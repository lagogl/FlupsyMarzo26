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
    
    // Costruisci condizioni per la query
    let whereConditions = and(
      gte(operations.date, dateFrom as string),
      lte(operations.date, dateTo as string)
    );
    
    // Se è specificato un FLUPSY, filtra anche per quello
    if (flupsyId) {
      whereConditions = and(
        whereConditions,
        eq(baskets.flupsyId, parseInt(flupsyId as string))
      );
    }
    
    // Query per statistiche aggregate
    const stats = await db.select({
      totale_entrate: sql<number>`COALESCE(SUM(CASE 
        WHEN ${operations.type} IN ('prima-attivazione', 'misura', 'peso', 'pulizia') 
        THEN COALESCE(${operations.animalCount}, 0) 
        ELSE 0 
      END), 0)`,
      totale_uscite: sql<number>`COALESCE(SUM(CASE 
        WHEN ${operations.type} = 'vendita' 
        THEN COALESCE(${operations.animalCount}, 0) 
        ELSE 0 
      END), 0)`,
      numero_operazioni: sql<number>`COUNT(*)`,
      cestelli_coinvolti: sql<number>`COUNT(DISTINCT ${operations.basketId})`,
      flupsys_coinvolti: sql<number>`COUNT(DISTINCT ${baskets.flupsyId})`
    })
    .from(operations)
    .leftJoin(baskets, eq(operations.basketId, baskets.id))
    .where(whereConditions);

    const result = stats[0] || {
      totale_entrate: 0,
      totale_uscite: 0,
      numero_operazioni: 0,
      cestelli_coinvolti: 0,
      flupsys_coinvolti: 0
    };

    // Converti stringhe in numeri (PostgreSQL restituisce SUM come numeric/string)
    const totale_entrate = Number(result.totale_entrate) || 0;
    const totale_uscite = Number(result.totale_uscite) || 0;
    const numero_operazioni = Number(result.numero_operazioni) || 0;
    const cestelli_coinvolti = Number(result.cestelli_coinvolti) || 0;
    const flupsys_coinvolti = Number(result.flupsys_coinvolti) || 0;
    
    const totale_giacenza = totale_entrate - totale_uscite;
    
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
 */
async function calculateGiacenzeForRange(startDate: Date, endDate: Date, flupsyId?: string) {
  const dateFromStr = format(startDate, 'yyyy-MM-dd');
  const dateToStr = format(endDate, 'yyyy-MM-dd');

  // Costruisci condizioni per la query
  let whereConditions = and(
    gte(operations.date, dateFromStr),
    lte(operations.date, dateToStr)
  );

  // Se è specificato un FLUPSY, filtra anche per quello
  if (flupsyId) {
    whereConditions = and(
      whereConditions,
      eq(baskets.flupsyId, parseInt(flupsyId))
    );
  }

  // Query principale con tutte le operazioni del periodo
  const operationsData = await db.select({
    id: operations.id,
    date: operations.date,
    type: operations.type,
    animalCount: operations.animalCount,
    basketId: operations.basketId,
    basketNumber: baskets.physicalNumber,
    sizeCode: sizes.code,
    flupsyId: baskets.flupsyId,
    flupsyName: flupsys.name,
  })
  .from(operations)
  .leftJoin(baskets, eq(operations.basketId, baskets.id))
  .leftJoin(flupsys, eq(baskets.flupsyId, flupsys.id))
  .leftJoin(sizes, eq(operations.sizeId, sizes.id))
  .where(whereConditions)
  .orderBy(operations.date);

  // Calcola totali e dettagli
  let totale_entrate = 0;
  let totale_uscite = 0;
  const dettaglio_operazioni = {
    'prima-attivazione': 0,
    'ripopolamento': 0,
    'cessazione': 0,
    'vendita': 0,
  };

  // Mappa per dettagli per taglia
  const taglieMap = new Map<string, { entrate: number; uscite: number }>();
  
  // Mappa per dettagli per FLUPSY
  const flupsysMap = new Map<number, { name: string; entrate: number; uscite: number }>();

  // Mappa per operazioni per data
  const operationsByDate: Record<string, Array<any>> = {};

  // Processa ogni operazione
  for (const op of operationsData) {
    const animalCount = op.animalCount || 0;
    
    // Classifica entrate e uscite
    const isEntrata = ['prima-attivazione', 'ripopolamento'].includes(op.type);
    const isUscita = ['vendita', 'cessazione'].includes(op.type);

    if (isEntrata) {
      totale_entrate += animalCount;
      if (op.type in dettaglio_operazioni) {
        dettaglio_operazioni[op.type as keyof typeof dettaglio_operazioni] += animalCount;
      }
    } else if (isUscita) {
      totale_uscite += animalCount;
      if (op.type in dettaglio_operazioni) {
        dettaglio_operazioni[op.type as keyof typeof dettaglio_operazioni] += animalCount;
      }
    }

    // Aggrega per taglia
    if (op.sizeCode) {
      if (!taglieMap.has(op.sizeCode)) {
        taglieMap.set(op.sizeCode, { entrate: 0, uscite: 0 });
      }
      const taglia = taglieMap.get(op.sizeCode)!;
      if (isEntrata) taglia.entrate += animalCount;
      if (isUscita) taglia.uscite += animalCount;
    }

    // Aggrega per FLUPSY
    if (op.flupsyId && op.flupsyName) {
      if (!flupsysMap.has(op.flupsyId)) {
        flupsysMap.set(op.flupsyId, { name: op.flupsyName, entrate: 0, uscite: 0 });
      }
      const flupsy = flupsysMap.get(op.flupsyId)!;
      if (isEntrata) flupsy.entrate += animalCount;
      if (isUscita) flupsy.uscite += animalCount;
    }

    // Aggrega per data
    const dateKey = op.date;
    if (!operationsByDate[dateKey]) {
      operationsByDate[dateKey] = [];
    }
    operationsByDate[dateKey].push({
      id: op.id,
      type: op.type,
      animalCount: animalCount,
      basketNumber: op.basketNumber,
      flupsyName: op.flupsyName || 'N/A',
      sizeCode: op.sizeCode || 'N/A'
    });
  }

  // Costruisci array dettaglio taglie
  const dettaglio_taglie = Array.from(taglieMap.entries()).map(([code, data]) => ({
    code,
    name: code, // Il nome coincide con il codice
    entrate: data.entrate,
    uscite: data.uscite,
    giacenza: data.entrate - data.uscite
  }));

  // Costruisci array dettaglio FLUPSY
  const dettaglio_flupsys = Array.from(flupsysMap.entries()).map(([id, data]) => ({
    id,
    name: data.name,
    entrate: data.entrate,
    uscite: data.uscite,
    giacenza: data.entrate - data.uscite
  }));

  // Calcola statistiche
  const totale_giacenza = totale_entrate - totale_uscite;
  const numeroOperazioni = operationsData.length;
  const giorniAnalizzati = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const mediaGiornaliera = giorniAnalizzati > 0 ? Math.round(numeroOperazioni / giorniAnalizzati) : 0;

  return {
    totale_giacenza,
    totale_entrate,
    totale_uscite,
    dettaglio_operazioni,
    dettaglio_taglie,
    dettaglio_flupsys,
    operations_by_date: operationsByDate,
    statistiche: {
      numero_operazioni: numeroOperazioni,
      giorni_analizzati: giorniAnalizzati,
      media_giornaliera: mediaGiornaliera,
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
      views: [{ state: 'frozen', ySplit: 1 }]
    });
    
    summarySheet.columns = [
      { header: 'Voce', key: 'voce', width: 25 },
      { header: 'Valore', key: 'valore', width: 20 }
    ];
    
    const headerStyle = { 
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF3B82F6' } },
      alignment: { vertical: 'middle' as const, horizontal: 'center' as const }
    };
    
    summarySheet.getRow(1).font = headerStyle.font;
    summarySheet.getRow(1).fill = headerStyle.fill;
    summarySheet.getRow(1).alignment = headerStyle.alignment;
    summarySheet.getRow(1).height = 22;

    summarySheet.addRow({ voce: 'Periodo', valore: `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}` });
    summarySheet.addRow({ voce: 'Giacenza Totale', valore: giacenzeData.totale_giacenza.toLocaleString('it-IT') });
    summarySheet.addRow({ voce: 'Entrate Totali', valore: giacenzeData.totale_entrate.toLocaleString('it-IT') });
    summarySheet.addRow({ voce: 'Uscite Totali', valore: giacenzeData.totale_uscite.toLocaleString('it-IT') });
    summarySheet.addRow({ voce: 'Numero Operazioni', valore: giacenzeData.statistiche.numero_operazioni.toString() });
    summarySheet.addRow({ voce: 'Giorni Analizzati', valore: giacenzeData.statistiche.giorni_analizzati.toString() });

    // Foglio 2: Giacenze per Taglia
    const taglieSheet = workbook.addWorksheet('Per Taglia', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });
    
    taglieSheet.columns = [
      { header: 'Taglia', key: 'taglia', width: 15 },
      { header: 'Entrate', key: 'entrate', width: 15 },
      { header: 'Uscite', key: 'uscite', width: 15 },
      { header: 'Giacenza', key: 'giacenza', width: 15 }
    ];
    
    taglieSheet.getRow(1).font = headerStyle.font;
    taglieSheet.getRow(1).fill = headerStyle.fill;
    taglieSheet.getRow(1).alignment = headerStyle.alignment;
    taglieSheet.getRow(1).height = 22;

    giacenzeData.dettaglio_taglie
      .sort((a, b) => b.giacenza - a.giacenza)
      .forEach((taglia, index) => {
        const row = taglieSheet.addRow({
          taglia: taglia.code,
          entrate: taglia.entrate.toLocaleString('it-IT'),
          uscite: taglia.uscite.toLocaleString('it-IT'),
          giacenza: taglia.giacenza.toLocaleString('it-IT')
        });
        if (index % 2 === 1) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        }
      });

    // Foglio 3: Giacenze per FLUPSY
    const flupsySheet = workbook.addWorksheet('Per FLUPSY', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });
    
    flupsySheet.columns = [
      { header: 'FLUPSY', key: 'flupsy', width: 25 },
      { header: 'Entrate', key: 'entrate', width: 15 },
      { header: 'Uscite', key: 'uscite', width: 15 },
      { header: 'Giacenza', key: 'giacenza', width: 15 }
    ];
    
    flupsySheet.getRow(1).font = headerStyle.font;
    flupsySheet.getRow(1).fill = headerStyle.fill;
    flupsySheet.getRow(1).alignment = headerStyle.alignment;
    flupsySheet.getRow(1).height = 22;

    giacenzeData.dettaglio_flupsys
      .sort((a, b) => b.giacenza - a.giacenza)
      .forEach((flupsy, index) => {
        const row = flupsySheet.addRow({
          flupsy: flupsy.name,
          entrate: flupsy.entrate.toLocaleString('it-IT'),
          uscite: flupsy.uscite.toLocaleString('it-IT'),
          giacenza: flupsy.giacenza.toLocaleString('it-IT')
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