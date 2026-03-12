/**
 * Controller per il calcolo delle giacenze personalizzate
 * Implementa il calcolo di giacenze esatte tra due date specifiche
 */
import { Request, Response } from 'express';
import { db } from '../db.js';
import { operations, baskets, flupsys, sizes, cycles } from '../../shared/schema.js';
import { eq, and, gte, lte, sql, isNull, or } from 'drizzle-orm';
import { format, parseISO, isValid } from 'date-fns';
import ExcelJS from 'exceljs';

/**
 * Endpoint principale per calcolare le giacenze tra due date
 * GET /api/giacenze/range?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD[&flupsyId=ID]
 */
export async function getGiacenzeRange(req: Request, res: Response) {
  const { dateFrom, dateTo, flupsyId } = req.query;

  // Validazione parametri
  if (!dateFrom || !dateTo) {
    return res.status(400).json({ 
      success: false, 
      error: "Parametri dateFrom e dateTo sono obbligatori. Formato: YYYY-MM-DD" 
    });
  }

  // Validazione formato date
  const startDate = parseISO(dateFrom as string);
  const endDate = parseISO(dateTo as string);
  
  if (!isValid(startDate) || !isValid(endDate)) {
    return res.status(400).json({ 
      success: false, 
      error: "Formato date non valido. Utilizzare il formato YYYY-MM-DD" 
    });
  }

  if (startDate > endDate) {
    return res.status(400).json({ 
      success: false, 
      error: "La data di inizio deve essere antecedente o uguale alla data di fine" 
    });
  }

  try {
    console.log(`🏭 CALCOLO GIACENZE: Range ${dateFrom} - ${dateTo}${flupsyId ? ` per FLUPSY ${flupsyId}` : ''}`);
    
    const startTime = Date.now();
    
    // Calcola giacenze per il range specificato
    const giacenzeData = await calculateGiacenzeForRange(startDate, endDate, flupsyId as string);
    
    const duration = Date.now() - startTime;
    console.log(`✅ GIACENZE CALCOLATE: ${duration}ms - Totale: ${giacenzeData.totale_giacenza} animali`);
    
    res.json({
      success: true,
      data: {
        dateFrom,
        dateTo,
        flupsyId: flupsyId ? parseInt(flupsyId as string) : null,
        ...giacenzeData,
        calculationTime: `${duration}ms`
      }
    });

  } catch (error: any) {
    console.error("❌ ERRORE CALCOLO GIACENZE:", error);
    res.status(500).json({ 
      success: false, 
      error: "Errore interno nel calcolo delle giacenze" 
    });
  }
}

/**
 * Endpoint per riepilogo rapido giacenze
 * GET /api/giacenze/summary?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD[&flupsyId=ID]
 */
export async function getGiacenzeSummary(req: Request, res: Response) {
  const { dateFrom, dateTo, flupsyId } = req.query;

  // Validazione parametri
  if (!dateFrom || !dateTo) {
    return res.status(400).json({ 
      success: false, 
      error: "Parametri dateFrom e dateTo sono obbligatori. Formato: YYYY-MM-DD" 
    });
  }

  // Validazione formato date
  const startDate = parseISO(dateFrom as string);
  const endDate = parseISO(dateTo as string);
  
  if (!isValid(startDate) || !isValid(endDate)) {
    return res.status(400).json({ 
      success: false, 
      error: "Formato date non valido. Utilizzare il formato YYYY-MM-DD" 
    });
  }

  if (startDate > endDate) {
    return res.status(400).json({ 
      success: false, 
      error: "La data di inizio deve essere antecedente o uguale alla data di fine" 
    });
  }

  try {
    console.log(`📊 RIEPILOGO GIACENZE: Range ${dateFrom} - ${dateTo}${flupsyId ? ` per FLUPSY ${flupsyId}` : ''}`);
    
    const startTime = Date.now();
    
    // Costruisci filtro FLUPSY opzionale
    const flupsyFilter = flupsyId 
      ? sql`AND b.flupsy_id = ${parseInt(flupsyId as string)}` 
      : sql``;
    
    // Query CORRETTA: prende l'ULTIMA operazione di ogni cestello attivo
    // invece di sommare tutte le operazioni (che era sbagliato)
    const giacenzaResult = await db.execute(sql`
      WITH latest_ops AS (
        SELECT DISTINCT ON (o.basket_id) 
          o.basket_id,
          o.animal_count,
          o.date,
          o.type,
          b.flupsy_id
        FROM operations o
        JOIN baskets b ON b.id = o.basket_id
        WHERE b.state = 'active'
          AND o.type IN ('misura', 'peso', 'prima-attivazione')
          AND o.animal_count > 0
          AND o.date <= ${dateTo as string}
          ${flupsyFilter}
        ORDER BY o.basket_id, o.date DESC, o.id DESC
      )
      SELECT 
        COALESCE(SUM(animal_count), 0) as totale_giacenza,
        COUNT(*) as cestelli_coinvolti,
        COUNT(DISTINCT flupsy_id) as flupsys_coinvolti
      FROM latest_ops
    `);
    
    // Query per entrate totali (prima-attivazione + ripopolamento) nel periodo
    const entrateResult = await db.execute(sql`
      SELECT COALESCE(SUM(o.animal_count), 0) as totale_entrate
      FROM operations o
      JOIN baskets b ON b.id = o.basket_id
      WHERE o.type IN ('prima-attivazione', 'ripopolamento')
        AND o.date >= ${dateFrom as string}
        AND o.date <= ${dateTo as string}
        ${flupsyFilter}
    `);
    
    // Query per uscite totali (vendita + cessazione) nel periodo
    const usciteResult = await db.execute(sql`
      SELECT COALESCE(SUM(o.animal_count), 0) as totale_uscite
      FROM operations o
      JOIN baskets b ON b.id = o.basket_id
      WHERE o.type IN ('vendita', 'cessazione')
        AND o.date >= ${dateFrom as string}
        AND o.date <= ${dateTo as string}
        ${flupsyFilter}
    `);
    
    // Query per conteggio operazioni nel periodo
    const operazioniResult = await db.execute(sql`
      SELECT COUNT(*) as numero_operazioni
      FROM operations o
      JOIN baskets b ON b.id = o.basket_id
      WHERE o.date >= ${dateFrom as string}
        AND o.date <= ${dateTo as string}
        ${flupsyFilter}
    `);

    const giacenzaRow = giacenzaResult.rows[0] as any;
    const entrateRow = entrateResult.rows[0] as any;
    const usciteRow = usciteResult.rows[0] as any;
    const operazioniRow = operazioniResult.rows[0] as any;

    const totale_giacenza = parseInt(giacenzaRow?.totale_giacenza) || 0;
    const totale_entrate = parseInt(entrateRow?.totale_entrate) || 0;
    const totale_uscite = parseInt(usciteRow?.totale_uscite) || 0;
    const numero_operazioni = parseInt(operazioniRow?.numero_operazioni) || 0;
    const cestelli_coinvolti = parseInt(giacenzaRow?.cestelli_coinvolti) || 0;
    const flupsys_coinvolti = parseInt(giacenzaRow?.flupsys_coinvolti) || 0;
    
    const duration = Date.now() - startTime;
    console.log(`✅ RIEPILOGO COMPLETATO: ${duration}ms - Giacenza: ${totale_giacenza} animali`);
    
    res.json({
      success: true,
      data: {
        dateFrom,
        dateTo,
        flupsyId: flupsyId ? parseInt(flupsyId as string) : null,
        totale_giacenza,
        totale_entrate,
        totale_uscite,
        numero_operazioni,
        cestelli_coinvolti,
        flupsys_coinvolti
      }
    });

  } catch (error: any) {
    console.error("❌ ERRORE RIEPILOGO GIACENZE:", error);
    res.status(500).json({ 
      success: false, 
      error: "Errore interno nel calcolo del riepilogo" 
    });
  }
}

/**
 * Calcola le giacenze esatte per un range di date
 * NOTA: Giacenza = somma dell'ULTIMA operazione di ogni cestello attivo (non somma tutte le operazioni)
 */
async function calculateGiacenzeForRange(startDate: Date, endDate: Date, flupsyId?: string) {
  const dateFromStr = format(startDate, 'yyyy-MM-dd');
  const dateToStr = format(endDate, 'yyyy-MM-dd');

  // Filtro FLUPSY opzionale
  const flupsyFilter = flupsyId 
    ? sql`AND b.flupsy_id = ${parseInt(flupsyId)}` 
    : sql``;

  // Carica taglie per determinare la taglia effettiva da animali/kg
  const sizesForLookup = await db.execute(sql`
    SELECT code, min_animals_per_kg, max_animals_per_kg 
    FROM sizes 
    ORDER BY COALESCE(max_animals_per_kg, 999999999) ASC
  `);
  const sizeRanges: { code: string; min: number | null; max: number | null }[] = 
    (sizesForLookup.rows as any[]).map(r => ({
      code: r.code,
      min: r.min_animals_per_kg ? parseInt(r.min_animals_per_kg) : null,
      max: r.max_animals_per_kg ? parseInt(r.max_animals_per_kg) : null,
    }));

  // Funzione: determina taglia effettiva da animali/kg
  const getEffectiveSizeCode = (animalsPerKg: number | null, registeredCode: string): string => {
    if (!animalsPerKg || animalsPerKg <= 0) return registeredCode;
    const match = sizeRanges.find(s => 
      (s.min === null || animalsPerKg >= s.min) && 
      (s.max === null || animalsPerKg <= s.max)
    );
    return match ? match.code : registeredCode;
  };

  // Query CORRETTA per giacenza: ultima operazione di ogni cestello attivo
  const giacenzaResult = await db.execute(sql`
    WITH latest_ops AS (
      SELECT DISTINCT ON (o.basket_id) 
        o.basket_id,
        o.animal_count,
        o.animals_per_kg,
        o.date,
        o.type,
        o.size_id,
        b.flupsy_id,
        f.name as flupsy_name,
        s.code as size_code
      FROM operations o
      JOIN baskets b ON b.id = o.basket_id
      LEFT JOIN flupsys f ON b.flupsy_id = f.id
      LEFT JOIN sizes s ON o.size_id = s.id
      WHERE b.state = 'active'
        AND o.type IN ('misura', 'peso', 'prima-attivazione')
        AND o.animal_count > 0
        AND o.date <= ${dateToStr}
        ${flupsyFilter}
      ORDER BY o.basket_id, o.date DESC, o.id DESC
    )
    SELECT 
      basket_id,
      animal_count,
      animals_per_kg,
      flupsy_id,
      flupsy_name,
      size_code
    FROM latest_ops
  `);

  // Query per entrate (prima-attivazione + ripopolamento) nel periodo
  const entrateResult = await db.execute(sql`
    SELECT COALESCE(SUM(o.animal_count), 0) as totale
    FROM operations o
    JOIN baskets b ON b.id = o.basket_id
    WHERE o.type IN ('prima-attivazione', 'ripopolamento')
      AND o.date >= ${dateFromStr}
      AND o.date <= ${dateToStr}
      ${flupsyFilter}
  `);

  // Query per uscite (vendita + cessazione) nel periodo
  const usciteResult = await db.execute(sql`
    SELECT COALESCE(SUM(o.animal_count), 0) as totale
    FROM operations o
    JOIN baskets b ON b.id = o.basket_id
    WHERE o.type IN ('vendita', 'cessazione')
      AND o.date >= ${dateFromStr}
      AND o.date <= ${dateToStr}
      ${flupsyFilter}
  `);

  // Query per entrate per taglia (prima-attivazione + ripopolamento)
  const entratePerTagliaResult = await db.execute(sql`
    SELECT COALESCE(s.code, 'N/A') as size_code, SUM(o.animal_count) as totale
    FROM operations o
    JOIN baskets b ON b.id = o.basket_id
    LEFT JOIN sizes s ON o.size_id = s.id
    WHERE o.type IN ('prima-attivazione', 'ripopolamento')
      AND o.date >= ${dateFromStr}
      AND o.date <= ${dateToStr}
      ${flupsyFilter}
    GROUP BY s.code
  `);

  // Query per uscite per taglia (vendita + cessazione)
  const uscitePerTagliaResult = await db.execute(sql`
    SELECT COALESCE(s.code, 'N/A') as size_code, SUM(o.animal_count) as totale
    FROM operations o
    JOIN baskets b ON b.id = o.basket_id
    LEFT JOIN sizes s ON o.size_id = s.id
    WHERE o.type IN ('vendita', 'cessazione')
      AND o.date >= ${dateFromStr}
      AND o.date <= ${dateToStr}
      ${flupsyFilter}
    GROUP BY s.code
  `);

  // Query per entrate per FLUPSY
  const entratePerFlupsyResult = await db.execute(sql`
    SELECT b.flupsy_id, SUM(o.animal_count) as totale
    FROM operations o
    JOIN baskets b ON b.id = o.basket_id
    WHERE o.type IN ('prima-attivazione', 'ripopolamento')
      AND o.date >= ${dateFromStr}
      AND o.date <= ${dateToStr}
      ${flupsyFilter}
    GROUP BY b.flupsy_id
  `);

  // Query per uscite per FLUPSY
  const uscitePerFlupsyResult = await db.execute(sql`
    SELECT b.flupsy_id, SUM(o.animal_count) as totale
    FROM operations o
    JOIN baskets b ON b.id = o.basket_id
    WHERE o.type IN ('vendita', 'cessazione')
      AND o.date >= ${dateFromStr}
      AND o.date <= ${dateToStr}
      ${flupsyFilter}
    GROUP BY b.flupsy_id
  `);

  // Mappa entrate/uscite per taglia
  const entratePerTaglia = new Map<string, number>();
  for (const row of entratePerTagliaResult.rows as any[]) {
    entratePerTaglia.set(row.size_code, parseInt(row.totale) || 0);
  }
  const uscitePerTaglia = new Map<string, number>();
  for (const row of uscitePerTagliaResult.rows as any[]) {
    uscitePerTaglia.set(row.size_code, parseInt(row.totale) || 0);
  }

  // Mappa entrate/uscite per FLUPSY
  const entratePerFlupsy = new Map<number, number>();
  for (const row of entratePerFlupsyResult.rows as any[]) {
    entratePerFlupsy.set(row.flupsy_id, parseInt(row.totale) || 0);
  }
  const uscitePerFlupsy = new Map<number, number>();
  for (const row of uscitePerFlupsyResult.rows as any[]) {
    uscitePerFlupsy.set(row.flupsy_id, parseInt(row.totale) || 0);
  }

  // Calcola totale giacenza dall'ultima operazione di ogni cestello
  let totale_giacenza = 0;
  const taglieMap = new Map<string, number>();
  const flupsysMap = new Map<number, { name: string; giacenza: number }>();

  for (const row of giacenzaResult.rows as any[]) {
    const animalCount = parseInt(row.animal_count) || 0;
    totale_giacenza += animalCount;

    // Aggrega per taglia effettiva (da animali/kg misurati, non size_code registrato)
    const animalsPerKgRaw = parseInt(row.animals_per_kg) || 0;
    const sizeCode = getEffectiveSizeCode(animalsPerKgRaw, row.size_code || 'N/A');
    taglieMap.set(sizeCode, (taglieMap.get(sizeCode) || 0) + animalCount);

    // Aggrega per FLUPSY
    if (row.flupsy_id) {
      const existing = flupsysMap.get(row.flupsy_id) || { name: row.flupsy_name || 'N/A', giacenza: 0 };
      existing.giacenza += animalCount;
      flupsysMap.set(row.flupsy_id, existing);
    }
  }

  const totale_entrate = parseInt((entrateResult.rows[0] as any)?.totale) || 0;
  const totale_uscite = parseInt((usciteResult.rows[0] as any)?.totale) || 0;

  // Costruisci array dettaglio taglie con entrate/uscite reali
  const allSizeCodes = new Set([...taglieMap.keys(), ...entratePerTaglia.keys(), ...uscitePerTaglia.keys()]);
  const dettaglio_taglie = Array.from(allSizeCodes).map((code) => ({
    code,
    name: code,
    giacenza: taglieMap.get(code) || 0,
    entrate: entratePerTaglia.get(code) || 0,
    uscite: uscitePerTaglia.get(code) || 0
  }));

  // Costruisci array dettaglio FLUPSY con entrate/uscite reali
  const allFlupsyIds = new Set([...flupsysMap.keys(), ...entratePerFlupsy.keys(), ...uscitePerFlupsy.keys()]);
  const dettaglio_flupsys = Array.from(allFlupsyIds).map((id) => ({
    id,
    name: flupsysMap.get(id)?.name || `FLUPSY ${id}`,
    giacenza: flupsysMap.get(id)?.giacenza || 0,
    entrate: entratePerFlupsy.get(id) || 0,
    uscite: uscitePerFlupsy.get(id) || 0
  }));

  const giorniAnalizzati = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return {
    totale_giacenza,
    totale_entrate,
    totale_uscite,
    dettaglio_operazioni: {
      'prima-attivazione': totale_entrate,
      'ripopolamento': 0,
      'cessazione': 0,
      'vendita': totale_uscite,
    },
    dettaglio_taglie,
    dettaglio_flupsys,
    operations_by_date: {}, // Rimosso per performance
    statistiche: {
      numero_operazioni: giacenzaResult.rows.length,
      giorni_analizzati: giorniAnalizzati,
      media_giornaliera: 0,
      cestelli_attivi: giacenzaResult.rows.length,
    }
  };
}

/**
 * Esporta le giacenze in formato Excel
 * POST /api/giacenze/export-excel
 */
export async function exportGiacenzeExcel(req: Request, res: Response) {
  const { dateFrom, dateTo, flupsyId } = req.body;

  if (!dateFrom || !dateTo) {
    return res.status(400).json({ 
      success: false, 
      error: "Parametri dateFrom e dateTo sono obbligatori" 
    });
  }

  const startDate = parseISO(dateFrom);
  const endDate = parseISO(dateTo);
  
  if (!isValid(startDate) || !isValid(endDate)) {
    return res.status(400).json({ 
      success: false, 
      error: "Formato date non valido" 
    });
  }

  try {
    console.log(`📊 EXPORT EXCEL GIACENZE: ${dateFrom} - ${dateTo}`);
    
    const giacenzeData = await calculateGiacenzeForRange(startDate, endDate, flupsyId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FLUPSY Management System';
    workbook.created = new Date();

    // Foglio 1: Riepilogo
    const summarySheet = workbook.addWorksheet('Riepilogo', {
      views: [{ state: 'frozen', ySplit: 4 }]
    });
    
    summarySheet.columns = [
      { header: '', key: 'voce', width: 25 },
      { header: '', key: 'valore', width: 25 }
    ];
    
    // Riga 1: Titolo
    summarySheet.mergeCells('A1:B1');
    const titleRow = summarySheet.getRow(1);
    titleRow.getCell(1).value = 'REPORT GIACENZE PERSONALIZZATE';
    titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF1F2937' } };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.height = 28;
    
    // Riga 2: Data Inizio
    summarySheet.getRow(2).getCell(1).value = 'Data Inizio:';
    summarySheet.getRow(2).getCell(1).font = { bold: true };
    summarySheet.getRow(2).getCell(2).value = format(startDate, 'dd/MM/yyyy');
    
    // Riga 3: Data Fine
    summarySheet.getRow(3).getCell(1).value = 'Data Fine:';
    summarySheet.getRow(3).getCell(1).font = { bold: true };
    summarySheet.getRow(3).getCell(2).value = format(endDate, 'dd/MM/yyyy');
    
    // Riga 4: vuota per separazione
    summarySheet.getRow(4).height = 10;
    
    const headerStyle = { 
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF3B82F6' } },
      alignment: { vertical: 'middle' as const, horizontal: 'center' as const }
    };
    
    // Riga 5: Intestazione tabella con stile applicato a ogni cella
    const headerRow = summarySheet.getRow(5);
    headerRow.getCell(1).value = 'Voce';
    headerRow.getCell(2).value = 'Valore';
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF1E40AF' } },
        left: { style: 'thin', color: { argb: 'FF1E40AF' } },
        bottom: { style: 'thin', color: { argb: 'FF1E40AF' } },
        right: { style: 'thin', color: { argb: 'FF1E40AF' } }
      };
    });
    headerRow.height = 25;

    summarySheet.addRow({ voce: 'Giacenza Totale', valore: giacenzeData.totale_giacenza || 0 });
    summarySheet.addRow({ voce: 'Entrate Totali', valore: giacenzeData.totale_entrate || 0 });
    summarySheet.addRow({ voce: 'Uscite Totali', valore: giacenzeData.totale_uscite || 0 });
    summarySheet.addRow({ voce: 'Cestelli Attivi', valore: giacenzeData.statistiche.cestelli_attivi || 0 });
    summarySheet.addRow({ voce: 'Giorni Analizzati', valore: giacenzeData.statistiche.giorni_analizzati || 0 });

    // Foglio 2: Giacenze per Taglia
    const taglieSheet = workbook.addWorksheet('Per Taglia', {
      views: [{ state: 'frozen', ySplit: 2 }]
    });
    
    // Riga titolo
    const taglieTitleRow = taglieSheet.addRow(['GIACENZE PER TAGLIA - Dettaglio entrate, uscite e giacenza per ciascuna taglia']);
    taglieSheet.mergeCells('A1:D1');
    taglieTitleRow.font = { bold: true, size: 14, color: { argb: 'FF1E3A8A' } };
    taglieTitleRow.height = 30;
    taglieTitleRow.alignment = { vertical: 'middle', horizontal: 'left' };
    
    taglieSheet.columns = [
      { key: 'taglia', width: 15 },
      { key: 'entrate', width: 15 },
      { key: 'uscite', width: 15 },
      { key: 'giacenza', width: 15 }
    ];
    
    const taglieHeaderRow = taglieSheet.addRow(['Taglia', 'Entrate', 'Uscite', 'Giacenza']);
    taglieHeaderRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF1E40AF' } },
        left: { style: 'thin', color: { argb: 'FF1E40AF' } },
        bottom: { style: 'thin', color: { argb: 'FF1E40AF' } },
        right: { style: 'thin', color: { argb: 'FF1E40AF' } }
      };
    });
    taglieHeaderRow.height = 25;

    giacenzeData.dettaglio_taglie
      .sort((a, b) => b.giacenza - a.giacenza)
      .forEach((taglia, index) => {
        const row = taglieSheet.addRow({
          taglia: taglia.code,
          entrate: taglia.entrate || 0,
          uscite: taglia.uscite || 0,
          giacenza: taglia.giacenza || 0
        });
        if (index % 2 === 1) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        }
      });

    // Foglio 3: Giacenze per FLUPSY
    const flupsySheet = workbook.addWorksheet('Per FLUPSY', {
      views: [{ state: 'frozen', ySplit: 2 }]
    });
    
    // Riga titolo
    const flupsyTitleRow = flupsySheet.addRow(['GIACENZE PER FLUPSY - Dettaglio entrate, uscite e giacenza per ciascun FLUPSY']);
    flupsySheet.mergeCells('A1:D1');
    flupsyTitleRow.font = { bold: true, size: 14, color: { argb: 'FF1E3A8A' } };
    flupsyTitleRow.height = 30;
    flupsyTitleRow.alignment = { vertical: 'middle', horizontal: 'left' };
    
    flupsySheet.columns = [
      { key: 'flupsy', width: 25 },
      { key: 'entrate', width: 15 },
      { key: 'uscite', width: 15 },
      { key: 'giacenza', width: 15 }
    ];
    
    const flupsyHeaderRow = flupsySheet.addRow(['FLUPSY', 'Entrate', 'Uscite', 'Giacenza']);
    flupsyHeaderRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF1E40AF' } },
        left: { style: 'thin', color: { argb: 'FF1E40AF' } },
        bottom: { style: 'thin', color: { argb: 'FF1E40AF' } },
        right: { style: 'thin', color: { argb: 'FF1E40AF' } }
      };
    });
    flupsyHeaderRow.height = 25;

    giacenzeData.dettaglio_flupsys
      .sort((a, b) => b.giacenza - a.giacenza)
      .forEach((flupsy, index) => {
        const row = flupsySheet.addRow({
          flupsy: flupsy.name,
          entrate: flupsy.entrate || 0,
          uscite: flupsy.uscite || 0,
          giacenza: flupsy.giacenza || 0
        });
        if (index % 2 === 1) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        }
      });

    // Aggiungi bordi a tutti i fogli
    [summarySheet, taglieSheet, flupsySheet].forEach(sheet => {
      sheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
          };
        });
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `giacenze_${format(startDate, 'yyyyMMdd')}_${format(endDate, 'yyyyMMdd')}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(buffer);

  } catch (error: any) {
    console.error("❌ ERRORE EXPORT EXCEL GIACENZE:", error);
    res.status(500).json({ 
      success: false, 
      error: "Errore nell'esportazione Excel" 
    });
  }
}