import ExcelJS from 'exceljs';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function generateDetailedMortalityAnalysis() {
  console.log('Generazione analisi mortalità dettagliata con tutte le operazioni...');
  
  const cycleQuery = `
    WITH cycle_base AS (
      SELECT 
        c.id as cycle_id,
        c.basket_id,
        c.lot_id,
        c.state as cycle_state,
        b.physical_number as basket_number,
        f.name as flupsy_name,
        l.supplier as lot_supplier
      FROM cycles c
      JOIN baskets b ON c.basket_id = b.id
      JOIN flupsys f ON b.flupsy_id = f.id
      LEFT JOIN lots l ON c.lot_id = l.id
      WHERE c.state = 'active'
    ),
    prima_attivazione AS (
      SELECT DISTINCT ON (o.cycle_id)
        o.cycle_id,
        o.animal_count as original_count,
        o.size_id as original_size_id,
        s.code as original_size_code,
        o.date as activation_date
      FROM operations o
      LEFT JOIN sizes s ON o.size_id = s.id
      WHERE o.type = 'prima-attivazione'
      AND o.cycle_id IN (SELECT cycle_id FROM cycle_base)
      ORDER BY o.cycle_id, o.id ASC
    ),
    ultima_operazione AS (
      SELECT DISTINCT ON (o.cycle_id)
        o.cycle_id,
        o.animal_count as current_count,
        o.size_id as current_size_id,
        s.code as current_size_code,
        o.type as last_op_type,
        o.date as last_op_date
      FROM operations o
      LEFT JOIN sizes s ON o.size_id = s.id
      WHERE o.cycle_id IN (SELECT cycle_id FROM cycle_base)
      ORDER BY o.cycle_id, o.id DESC
    )
    SELECT 
      cb.cycle_id,
      cb.basket_id,
      cb.basket_number,
      cb.flupsy_name,
      cb.lot_supplier,
      cb.cycle_state,
      pa.activation_date,
      pa.original_count,
      pa.original_size_code,
      uo.current_count,
      uo.current_size_code,
      uo.last_op_type,
      uo.last_op_date
    FROM cycle_base cb
    LEFT JOIN prima_attivazione pa ON cb.cycle_id = pa.cycle_id
    LEFT JOIN ultima_operazione uo ON cb.cycle_id = uo.cycle_id
    WHERE pa.original_count IS NOT NULL
    ORDER BY cb.flupsy_name, cb.basket_number
  `;

  const allOperationsQuery = `
    SELECT 
      o.id as operation_id,
      o.cycle_id,
      o.date,
      o.type,
      o.animal_count,
      o.dead_count,
      o.total_weight,
      o.animals_per_kg,
      o.size_id,
      s.code as size_code,
      o.notes
    FROM operations o
    LEFT JOIN sizes s ON o.size_id = s.id
    WHERE o.cycle_id IN (
      SELECT c.id FROM cycles c WHERE c.state = 'active'
    )
    ORDER BY o.cycle_id, o.id ASC
  `;

  const [cycleResult, opsResult] = await Promise.all([
    pool.query(cycleQuery),
    pool.query(allOperationsQuery)
  ]);

  console.log(`Trovati ${cycleResult.rows.length} cicli attivi`);
  console.log(`Trovate ${opsResult.rows.length} operazioni totali`);

  const operationsByCycle: Record<number, any[]> = {};
  for (const op of opsResult.rows) {
    if (!operationsByCycle[op.cycle_id]) {
      operationsByCycle[op.cycle_id] = [];
    }
    operationsByCycle[op.cycle_id].push(op);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FLUPSY Management System';
  workbook.created = new Date();
  
  const summarySheet = workbook.addWorksheet('Riepilogo Cicli', {
    views: [{ state: 'frozen', xSplit: 3, ySplit: 1 }]
  });

  summarySheet.columns = [
    { header: 'Ciclo ID', key: 'cycleId', width: 10 },
    { header: 'Cestello', key: 'basketNumber', width: 10 },
    { header: 'FLUPSY', key: 'flupsyName', width: 18 },
    { header: 'Fornitore', key: 'lotSupplier', width: 15 },
    { header: 'Data Attiv.', key: 'activationDate', width: 12 },
    { header: 'Animali Originali', key: 'originalCount', width: 18 },
    { header: 'Animali Attuali (DB)', key: 'currentCount', width: 20 },
    { header: 'Nuova Logica', key: 'newCalculatedCount', width: 18 },
    { header: 'Differenza', key: 'difference', width: 14 },
    { header: 'Diff %', key: 'differencePercent', width: 10 },
    { header: 'Mortalità Cum. %', key: 'cumulativeMortalityPercent', width: 16 },
    { header: 'N. Operazioni', key: 'numOps', width: 14 },
    { header: 'Note', key: 'notes', width: 40 },
  ];

  const headerRow = summarySheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E40AF' }
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  const cyclesWithDifference: any[] = [];

  for (const row of cycleResult.rows) {
    const originalCount = parseInt(row.original_count) || 0;
    const currentCount = parseInt(row.current_count) || originalCount;
    const ops = operationsByCycle[row.cycle_id] || [];
    
    let newCalculatedCount = originalCount;
    let cumulativeMortalityRate = 0;
    const notes: string[] = [];

    for (const op of ops) {
      if (op.type === 'misura' && op.dead_count > 0) {
        const deadCount = op.dead_count || 0;
        const animalsPerKg = op.animals_per_kg || 0;
        const totalWeight = op.total_weight || 0;
        const liveAnimals = animalsPerKg > 0 && totalWeight > 0 
          ? Math.round((totalWeight / 1000) * animalsPerKg)
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

    if (cumulativeMortalityRate >= 0.05) {
      notes.push('Mortalità >= 5%');
    }

    const analysisRow = {
      cycleId: row.cycle_id,
      basketNumber: row.basket_number,
      flupsyName: row.flupsy_name,
      lotSupplier: row.lot_supplier || 'N/D',
      activationDate: row.activation_date,
      originalCount,
      currentCount,
      newCalculatedCount,
      difference,
      differencePercent: Math.round(differencePercent * 100) / 100,
      cumulativeMortalityPercent: Math.round(cumulativeMortalityRate * 10000) / 100,
      numOps: ops.length,
      notes: notes.join('; '),
      operations: ops,
    };

    const excelRow = summarySheet.addRow(analysisRow);
    
    excelRow.getCell('originalCount').numFmt = '#,##0';
    excelRow.getCell('currentCount').numFmt = '#,##0';
    excelRow.getCell('newCalculatedCount').numFmt = '#,##0';
    excelRow.getCell('difference').numFmt = '#,##0';

    if (difference !== 0) {
      cyclesWithDifference.push(analysisRow);
      excelRow.getCell('difference').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: difference > 0 ? 'FFD1FAE5' : 'FFFEF3C7' }
      };
      for (let col = 1; col <= 13; col++) {
        if (col !== 9) {
          excelRow.getCell(col).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFBEB' }
          };
        }
      }
    }

    if (analysisRow.cumulativeMortalityPercent >= 5) {
      excelRow.getCell('cumulativeMortalityPercent').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFECACA' }
      };
    }
  }

  console.log(`\nCicli con differenza: ${cyclesWithDifference.length}`);

  const detailSheet = workbook.addWorksheet('Dettaglio Operazioni', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
  });

  detailSheet.columns = [
    { header: 'Ciclo ID', key: 'cycleId', width: 10 },
    { header: 'Cestello', key: 'basketNumber', width: 10 },
    { header: 'FLUPSY', key: 'flupsyName', width: 18 },
    { header: 'Op. ID', key: 'operationId', width: 10 },
    { header: 'Data', key: 'date', width: 12 },
    { header: 'Tipo', key: 'type', width: 18 },
    { header: 'Animali DB', key: 'animalCount', width: 15 },
    { header: 'Morti Camp.', key: 'deadCount', width: 12 },
    { header: 'Peso (g)', key: 'totalWeight', width: 12 },
    { header: 'An/kg', key: 'animalsPerKg', width: 12 },
    { header: 'Taglia', key: 'sizeCode', width: 12 },
    { header: 'Vivi Campione', key: 'liveSample', width: 14 },
    { header: 'Totale Campione', key: 'totalSample', width: 16 },
    { header: 'Mortalità Camp. %', key: 'sampleMortality', width: 16 },
    { header: 'Animali Nuova Logica', key: 'newAnimalCount', width: 20 },
    { header: 'Note Calcolo', key: 'calcNotes', width: 35 },
  ];

  const detailHeaderRow = detailSheet.getRow(1);
  detailHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  detailHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF059669' }
  };
  detailHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };

  for (const cycle of cyclesWithDifference) {
    const originalCount = cycle.originalCount;
    let runningNewCount = originalCount;

    for (const op of cycle.operations) {
      const deadCount = op.dead_count || 0;
      const animalsPerKg = op.animals_per_kg || 0;
      const totalWeight = op.total_weight || 0;
      
      let liveSample = 0;
      let totalSample = 0;
      let sampleMortality = 0;
      let newAnimalCount = runningNewCount;
      let calcNotes = '';

      if (op.type === 'misura' && deadCount > 0) {
        liveSample = animalsPerKg > 0 && totalWeight > 0 
          ? Math.round((totalWeight / 1000) * animalsPerKg)
          : 0;
        totalSample = liveSample + deadCount;
        
        if (totalSample > 0) {
          sampleMortality = (deadCount / totalSample) * 100;
          const calculatedCount = Math.round(originalCount - (originalCount * (deadCount / totalSample)));
          newAnimalCount = Math.min(calculatedCount, runningNewCount);
          
          if (newAnimalCount < runningNewCount) {
            calcNotes = `Mortalità ${sampleMortality.toFixed(1)}% applicata: ${originalCount.toLocaleString()} × ${(1 - deadCount/totalSample).toFixed(4)} = ${newAnimalCount.toLocaleString()}`;
            runningNewCount = newAnimalCount;
          } else {
            calcNotes = 'Mortalità non riduce (MIN constraint)';
          }
        }
      } else if (op.type === 'prima-attivazione') {
        calcNotes = 'Conteggio iniziale';
        newAnimalCount = originalCount;
      } else if (op.type === 'peso') {
        calcNotes = 'Peso: mantiene ultimo conteggio';
      } else if (op.type === 'misura' && deadCount === 0) {
        calcNotes = 'Misura senza morti: mantiene conteggio';
      }

      const detailRow = detailSheet.addRow({
        cycleId: cycle.cycleId,
        basketNumber: cycle.basketNumber,
        flupsyName: cycle.flupsyName,
        operationId: op.operation_id,
        date: op.date,
        type: op.type,
        animalCount: op.animal_count,
        deadCount: deadCount || '',
        totalWeight: totalWeight || '',
        animalsPerKg: animalsPerKg || '',
        sizeCode: op.size_code || '',
        liveSample: liveSample || '',
        totalSample: totalSample || '',
        sampleMortality: sampleMortality ? Math.round(sampleMortality * 100) / 100 : '',
        newAnimalCount: newAnimalCount,
        calcNotes,
      });

      detailRow.getCell('animalCount').numFmt = '#,##0';
      detailRow.getCell('newAnimalCount').numFmt = '#,##0';
      detailRow.getCell('liveSample').numFmt = '#,##0';
      detailRow.getCell('totalSample').numFmt = '#,##0';

      if (op.type === 'prima-attivazione') {
        detailRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFDBEAFE' }
        };
      } else if (op.type === 'misura' && deadCount > 0) {
        detailRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEF3C7' }
        };
      } else if (op.type === 'misura') {
        detailRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0F2FE' }
        };
      }

      if (op.animal_count !== newAnimalCount) {
        detailRow.getCell('animalCount').font = { color: { argb: 'FFDC2626' } };
        detailRow.getCell('newAnimalCount').font = { bold: true, color: { argb: 'FF059669' } };
      }
    }

    const separatorRow = detailSheet.addRow({});
    separatorRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' }
    };
  }

  const statsSheet = workbook.addWorksheet('Statistiche');
  
  const totalCycles = cycleResult.rows.length;
  const cyclesWithDiff = cyclesWithDifference.length;
  const totalOriginal = cycleResult.rows.reduce((sum: number, r: any) => sum + (parseInt(r.original_count) || 0), 0);
  const totalCurrent = cycleResult.rows.reduce((sum: number, r: any) => sum + (parseInt(r.current_count) || 0), 0);
  const totalNew = cyclesWithDifference.reduce((sum, r) => sum + r.newCalculatedCount, 0) + 
    cycleResult.rows.filter((r: any) => !cyclesWithDifference.find(c => c.cycleId === r.cycle_id))
      .reduce((sum: number, r: any) => sum + (parseInt(r.current_count) || 0), 0);

  statsSheet.addRow(['RIEPILOGO ANALISI MORTALITÀ CUMULATIVA']);
  statsSheet.addRow([]);
  statsSheet.addRow(['Metrica', 'Valore']);
  statsSheet.addRow(['Cicli attivi totali', totalCycles]);
  statsSheet.addRow(['Cicli con differenza nel calcolo', cyclesWithDiff]);
  statsSheet.addRow([]);
  statsSheet.addRow(['Totale animali originali', totalOriginal.toLocaleString('it-IT')]);
  statsSheet.addRow(['Totale animali attuali (DB)', totalCurrent.toLocaleString('it-IT')]);
  statsSheet.addRow(['Differenza (DB - Nuova logica)', (totalCurrent - totalNew).toLocaleString('it-IT')]);
  statsSheet.addRow([]);
  statsSheet.addRow(['LOGICA APPLICATA:']);
  statsSheet.addRow(['1. Per operazioni "misura" con morti:']);
  statsSheet.addRow(['   - Calcola mortalità campione = morti / (vivi + morti)']);
  statsSheet.addRow(['   - Nuovo conteggio = originale × (1 - mortalità campione)']);
  statsSheet.addRow(['   - Applica MIN(calcolato, ultimo) per evitare resurrezione']);
  statsSheet.addRow(['2. Per operazioni "peso" con mortalità >= 5%:']);
  statsSheet.addRow(['   - Eredita taglia dall\'ultima misura']);
  statsSheet.addRow([]);
  statsSheet.addRow(['Data generazione', new Date().toLocaleString('it-IT')]);

  statsSheet.getRow(1).font = { bold: true, size: 14 };
  statsSheet.getColumn(1).width = 45;
  statsSheet.getColumn(2).width = 25;

  const filename = `analisi_mortalita_dettagliata_${new Date().toISOString().split('T')[0]}.xlsx`;
  await workbook.xlsx.writeFile(filename);
  
  console.log(`\n✅ File generato: ${filename}`);
  console.log(`\n📊 CONTENUTO FILE:`);
  console.log(`   1. Foglio "Riepilogo Cicli": tutti i ${totalCycles} cicli con confronto`);
  console.log(`   2. Foglio "Dettaglio Operazioni": tutte le operazioni dei ${cyclesWithDiff} cicli con differenza`);
  console.log(`   3. Foglio "Statistiche": riepilogo e spiegazione logica`);
  
  await pool.end();
  process.exit(0);
}

generateDetailedMortalityAnalysis().catch(error => {
  console.error('Errore:', error);
  pool.end();
  process.exit(1);
});
