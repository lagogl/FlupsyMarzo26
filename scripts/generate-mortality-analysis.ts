import ExcelJS from 'exceljs';
import { db } from '../server/db';
import { operations, cycles, baskets, flupsys, sizes, lots } from '../shared/schema';
import { eq, and, sql, desc, asc } from 'drizzle-orm';

interface CycleAnalysis {
  cycleId: number;
  basketId: number;
  basketNumber: number;
  flupsyName: string;
  lotSupplier: string;
  cycleState: string;
  activationDate: string;
  originalCount: number;
  originalSizeCode: string;
  currentCount: number;
  currentSizeCode: string;
  lastOpType: string;
  lastOpDate: string;
  numMisure: number;
  totalDeadCount: number;
  cumulativeMortalityPercent: number;
  newCalculatedCount: number;
  difference: number;
  differencePercent: number;
  notes: string;
}

async function generateMortalityAnalysis() {
  console.log('Inizio analisi mortalità cumulativa...');
  
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FLUPSY Management System';
  workbook.created = new Date();
  
  const worksheet = workbook.addWorksheet('Analisi Mortalità', {
    views: [{ state: 'frozen', xSplit: 3, ySplit: 1 }]
  });

  worksheet.columns = [
    { header: 'Ciclo ID', key: 'cycleId', width: 10 },
    { header: 'Cestello', key: 'basketNumber', width: 10 },
    { header: 'FLUPSY', key: 'flupsyName', width: 20 },
    { header: 'Fornitore Lotto', key: 'lotSupplier', width: 18 },
    { header: 'Stato', key: 'cycleState', width: 10 },
    { header: 'Data Attiv.', key: 'activationDate', width: 12 },
    { header: 'Animali Originali', key: 'originalCount', width: 18 },
    { header: 'Taglia Orig.', key: 'originalSizeCode', width: 12 },
    { header: 'Animali Attuali (DB)', key: 'currentCount', width: 20 },
    { header: 'Taglia Attuale', key: 'currentSizeCode', width: 14 },
    { header: 'Ultima Op.', key: 'lastOpType', width: 12 },
    { header: 'Data Ultima Op.', key: 'lastOpDate', width: 14 },
    { header: 'N. Misure', key: 'numMisure', width: 10 },
    { header: 'Tot. Morti Campione', key: 'totalDeadCount', width: 18 },
    { header: 'Mortalità Cum. %', key: 'cumulativeMortalityPercent', width: 16 },
    { header: 'Animali Nuova Logica', key: 'newCalculatedCount', width: 20 },
    { header: 'Differenza', key: 'difference', width: 14 },
    { header: 'Differenza %', key: 'differencePercent', width: 14 },
    { header: 'Note', key: 'notes', width: 40 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E40AF' }
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  const activeCycles = await db
    .select({
      cycleId: cycles.id,
      basketId: cycles.basketId,
      lotId: cycles.lotId,
      cycleState: cycles.state,
    })
    .from(cycles)
    .where(eq(cycles.state, 'active'));

  console.log(`Trovati ${activeCycles.length} cicli attivi`);

  const analysisResults: CycleAnalysis[] = [];

  for (const cycle of activeCycles) {
    const basket = await db
      .select({
        physicalNumber: baskets.physicalNumber,
        flupsyId: baskets.flupsyId,
      })
      .from(baskets)
      .where(eq(baskets.id, cycle.basketId))
      .limit(1);

    if (basket.length === 0) continue;

    const flupsy = await db
      .select({ name: flupsys.name })
      .from(flupsys)
      .where(eq(flupsys.id, basket[0].flupsyId!))
      .limit(1);

    const lot = cycle.lotId ? await db
      .select({ supplier: lots.supplier })
      .from(lots)
      .where(eq(lots.id, cycle.lotId))
      .limit(1) : [];

    const primaAttivazione = await db
      .select({
        animalCount: operations.animalCount,
        sizeId: operations.sizeId,
        date: operations.date,
      })
      .from(operations)
      .where(
        and(
          eq(operations.cycleId, cycle.cycleId),
          eq(operations.type, 'prima-attivazione')
        )
      )
      .orderBy(asc(operations.id))
      .limit(1);

    const ultimaOperazione = await db
      .select({
        animalCount: operations.animalCount,
        sizeId: operations.sizeId,
        type: operations.type,
        date: operations.date,
      })
      .from(operations)
      .where(eq(operations.cycleId, cycle.cycleId))
      .orderBy(desc(operations.id))
      .limit(1);

    const misureConMortalita = await db
      .select({
        deadCount: operations.deadCount,
        animalCount: operations.animalCount,
        animalsPerKg: operations.animalsPerKg,
        totalWeight: operations.totalWeight,
      })
      .from(operations)
      .where(
        and(
          eq(operations.cycleId, cycle.cycleId),
          eq(operations.type, 'misura')
        )
      )
      .orderBy(asc(operations.id));

    if (primaAttivazione.length === 0) continue;

    const originalCount = primaAttivazione[0].animalCount || 0;
    const currentCount = ultimaOperazione[0]?.animalCount || originalCount;

    const origSize = primaAttivazione[0].sizeId ? await db
      .select({ code: sizes.code })
      .from(sizes)
      .where(eq(sizes.id, primaAttivazione[0].sizeId))
      .limit(1) : [];

    const currSize = ultimaOperazione[0]?.sizeId ? await db
      .select({ code: sizes.code })
      .from(sizes)
      .where(eq(sizes.id, ultimaOperazione[0].sizeId))
      .limit(1) : [];

    let newCalculatedCount = originalCount;
    let cumulativeMortalityRate = 0;
    let totalDeadCount = 0;
    let notes: string[] = [];

    for (const misura of misureConMortalita) {
      const deadCount = misura.deadCount || 0;
      totalDeadCount += deadCount;
      
      if (deadCount > 0) {
        const liveAnimals = misura.animalsPerKg && misura.totalWeight 
          ? Math.round((misura.totalWeight / 1000) * misura.animalsPerKg)
          : 0;
        const totalSample = liveAnimals + deadCount;
        
        if (totalSample > 0) {
          const sampleMortalityRate = deadCount / totalSample;
          const calculatedCount = Math.round(originalCount - (originalCount * sampleMortalityRate));
          newCalculatedCount = Math.min(calculatedCount, newCalculatedCount);
          cumulativeMortalityRate = 1 - (newCalculatedCount / originalCount);
        }
      }
    }

    const difference = currentCount - newCalculatedCount;
    const differencePercent = originalCount > 0 ? (difference / originalCount) * 100 : 0;

    if (Math.abs(differencePercent) > 1) {
      notes.push(`Variazione significativa: ${differencePercent > 0 ? '+' : ''}${differencePercent.toFixed(1)}%`);
    }
    if (cumulativeMortalityRate >= 0.05) {
      notes.push(`Mortalità >= 5%: operazioni peso erediteranno taglia`);
    }
    if (totalDeadCount === 0 && misureConMortalita.length > 0) {
      notes.push('Nessun morto registrato nelle misure');
    }

    analysisResults.push({
      cycleId: cycle.cycleId,
      basketId: cycle.basketId,
      basketNumber: basket[0].physicalNumber,
      flupsyName: flupsy[0]?.name || 'N/D',
      lotSupplier: lot[0]?.supplier || 'N/D',
      cycleState: cycle.cycleState,
      activationDate: primaAttivazione[0].date?.toString() || '',
      originalCount,
      originalSizeCode: origSize[0]?.code || 'N/D',
      currentCount,
      currentSizeCode: currSize[0]?.code || 'N/D',
      lastOpType: ultimaOperazione[0]?.type || '',
      lastOpDate: ultimaOperazione[0]?.date?.toString() || '',
      numMisure: misureConMortalita.length,
      totalDeadCount,
      cumulativeMortalityPercent: Math.round(cumulativeMortalityRate * 10000) / 100,
      newCalculatedCount,
      difference,
      differencePercent: Math.round(differencePercent * 100) / 100,
      notes: notes.join('; '),
    });
  }

  analysisResults.sort((a, b) => {
    if (a.flupsyName !== b.flupsyName) return a.flupsyName.localeCompare(b.flupsyName);
    return a.basketNumber - b.basketNumber;
  });

  for (const result of analysisResults) {
    const row = worksheet.addRow(result);
    
    row.getCell('originalCount').numFmt = '#,##0';
    row.getCell('currentCount').numFmt = '#,##0';
    row.getCell('newCalculatedCount').numFmt = '#,##0';
    row.getCell('difference').numFmt = '#,##0';
    row.getCell('cumulativeMortalityPercent').numFmt = '0.00"%"';
    row.getCell('differencePercent').numFmt = '0.00"%"';

    if (result.cumulativeMortalityPercent >= 5) {
      row.getCell('cumulativeMortalityPercent').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFECACA' }
      };
    }

    if (result.difference !== 0) {
      const diffCell = row.getCell('difference');
      diffCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: result.difference > 0 ? 'FFD1FAE5' : 'FFFEF3C7' }
      };
    }
  }

  const summarySheet = workbook.addWorksheet('Riepilogo');
  
  const totalCycles = analysisResults.length;
  const cyclesWithMortality = analysisResults.filter(r => r.cumulativeMortalityPercent >= 5).length;
  const cyclesWithDifference = analysisResults.filter(r => r.difference !== 0).length;
  const totalOriginalAnimals = analysisResults.reduce((sum, r) => sum + r.originalCount, 0);
  const totalCurrentAnimals = analysisResults.reduce((sum, r) => sum + r.currentCount, 0);
  const totalNewCalculated = analysisResults.reduce((sum, r) => sum + r.newCalculatedCount, 0);

  summarySheet.addRow(['RIEPILOGO ANALISI MORTALITÀ CUMULATIVA']);
  summarySheet.addRow([]);
  summarySheet.addRow(['Metrica', 'Valore']);
  summarySheet.addRow(['Cicli attivi analizzati', totalCycles]);
  summarySheet.addRow(['Cicli con mortalità >= 5%', cyclesWithMortality]);
  summarySheet.addRow(['Cicli con differenza nel calcolo', cyclesWithDifference]);
  summarySheet.addRow([]);
  summarySheet.addRow(['Totale animali originali', totalOriginalAnimals]);
  summarySheet.addRow(['Totale animali attuali (DB)', totalCurrentAnimals]);
  summarySheet.addRow(['Totale animali nuova logica', totalNewCalculated]);
  summarySheet.addRow(['Differenza totale', totalCurrentAnimals - totalNewCalculated]);
  summarySheet.addRow([]);
  summarySheet.addRow(['Data generazione', new Date().toLocaleString('it-IT')]);

  summarySheet.getRow(1).font = { bold: true, size: 14 };
  summarySheet.getColumn(1).width = 35;
  summarySheet.getColumn(2).width = 20;

  const filename = `analisi_mortalita_${new Date().toISOString().split('T')[0]}.xlsx`;
  await workbook.xlsx.writeFile(filename);
  
  console.log(`\nFile generato: ${filename}`);
  console.log(`\nRiepilogo:`);
  console.log(`- Cicli analizzati: ${totalCycles}`);
  console.log(`- Cicli con mortalità >= 5%: ${cyclesWithMortality}`);
  console.log(`- Cicli con differenza: ${cyclesWithDifference}`);
  console.log(`- Animali originali: ${totalOriginalAnimals.toLocaleString('it-IT')}`);
  console.log(`- Animali attuali (DB): ${totalCurrentAnimals.toLocaleString('it-IT')}`);
  console.log(`- Animali nuova logica: ${totalNewCalculated.toLocaleString('it-IT')}`);
  console.log(`- Differenza: ${(totalCurrentAnimals - totalNewCalculated).toLocaleString('it-IT')}`);
  
  process.exit(0);
}

generateMortalityAnalysis().catch(error => {
  console.error('Errore:', error);
  process.exit(1);
});
