import ExcelJS from 'exceljs';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function generateMortalityAnalysis() {
  console.log('Inizio analisi mortalità cumulativa (versione ottimizzata)...');
  
  const query = `
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
    ),
    misure_stats AS (
      SELECT 
        o.cycle_id,
        COUNT(*) as num_misure,
        SUM(COALESCE(o.dead_count, 0)) as total_dead_count,
        json_agg(json_build_object(
          'dead_count', COALESCE(o.dead_count, 0),
          'animals_per_kg', o.animals_per_kg,
          'total_weight', o.total_weight
        ) ORDER BY o.id) as misure_detail
      FROM operations o
      WHERE o.type = 'misura'
      AND o.cycle_id IN (SELECT cycle_id FROM cycle_base)
      GROUP BY o.cycle_id
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
      uo.last_op_date,
      COALESCE(ms.num_misure, 0) as num_misure,
      COALESCE(ms.total_dead_count, 0) as total_dead_count,
      ms.misure_detail
    FROM cycle_base cb
    LEFT JOIN prima_attivazione pa ON cb.cycle_id = pa.cycle_id
    LEFT JOIN ultima_operazione uo ON cb.cycle_id = uo.cycle_id
    LEFT JOIN misure_stats ms ON cb.cycle_id = ms.cycle_id
    WHERE pa.original_count IS NOT NULL
    ORDER BY cb.flupsy_name, cb.basket_number
  `;

  const result = await pool.query(query);
  console.log(`Trovati ${result.rows.length} cicli attivi con prima attivazione`);

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
    { header: 'Note', key: 'notes', width: 50 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E40AF' }
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  const analysisResults: any[] = [];

  for (const row of result.rows) {
    const originalCount = parseInt(row.original_count) || 0;
    const currentCount = parseInt(row.current_count) || originalCount;
    const misureDetail = row.misure_detail || [];
    
    let newCalculatedCount = originalCount;
    let cumulativeMortalityRate = 0;
    const notes: string[] = [];

    for (const misura of misureDetail) {
      const deadCount = misura.dead_count || 0;
      
      if (deadCount > 0) {
        const animalsPerKg = misura.animals_per_kg || 0;
        const totalWeight = misura.total_weight || 0;
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

    if (Math.abs(differencePercent) > 1) {
      notes.push(`Variazione significativa: ${differencePercent > 0 ? '+' : ''}${differencePercent.toFixed(1)}%`);
    }
    if (cumulativeMortalityRate >= 0.05) {
      notes.push(`Mortalità >= 5%: op. peso erediteranno taglia`);
    }
    if (parseInt(row.total_dead_count) === 0 && parseInt(row.num_misure) > 0) {
      notes.push('Nessun morto nelle misure');
    }

    const analysisRow = {
      cycleId: row.cycle_id,
      basketNumber: row.basket_number,
      flupsyName: row.flupsy_name,
      lotSupplier: row.lot_supplier || 'N/D',
      cycleState: row.cycle_state,
      activationDate: row.activation_date,
      originalCount,
      originalSizeCode: row.original_size_code || 'N/D',
      currentCount,
      currentSizeCode: row.current_size_code || 'N/D',
      lastOpType: row.last_op_type || '',
      lastOpDate: row.last_op_date,
      numMisure: parseInt(row.num_misure) || 0,
      totalDeadCount: parseInt(row.total_dead_count) || 0,
      cumulativeMortalityPercent: Math.round(cumulativeMortalityRate * 10000) / 100,
      newCalculatedCount,
      difference,
      differencePercent: Math.round(differencePercent * 100) / 100,
      notes: notes.join('; '),
    };

    analysisResults.push(analysisRow);
    const excelRow = worksheet.addRow(analysisRow);
    
    excelRow.getCell('originalCount').numFmt = '#,##0';
    excelRow.getCell('currentCount').numFmt = '#,##0';
    excelRow.getCell('newCalculatedCount').numFmt = '#,##0';
    excelRow.getCell('difference').numFmt = '#,##0';

    if (analysisRow.cumulativeMortalityPercent >= 5) {
      excelRow.getCell('cumulativeMortalityPercent').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFECACA' }
      };
    }

    if (difference !== 0) {
      excelRow.getCell('difference').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: difference > 0 ? 'FFD1FAE5' : 'FFFEF3C7' }
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
  summarySheet.addRow(['Totale animali originali', totalOriginalAnimals.toLocaleString('it-IT')]);
  summarySheet.addRow(['Totale animali attuali (DB)', totalCurrentAnimals.toLocaleString('it-IT')]);
  summarySheet.addRow(['Totale animali nuova logica', totalNewCalculated.toLocaleString('it-IT')]);
  summarySheet.addRow(['Differenza totale', (totalCurrentAnimals - totalNewCalculated).toLocaleString('it-IT')]);
  summarySheet.addRow([]);
  summarySheet.addRow(['Data generazione', new Date().toLocaleString('it-IT')]);

  summarySheet.getRow(1).font = { bold: true, size: 14 };
  summarySheet.getColumn(1).width = 35;
  summarySheet.getColumn(2).width = 25;

  const filename = `analisi_mortalita_${new Date().toISOString().split('T')[0]}.xlsx`;
  await workbook.xlsx.writeFile(filename);
  
  console.log(`\n✅ File generato: ${filename}`);
  console.log(`\n📊 RIEPILOGO:`);
  console.log(`   Cicli analizzati: ${totalCycles}`);
  console.log(`   Cicli con mortalità >= 5%: ${cyclesWithMortality}`);
  console.log(`   Cicli con differenza: ${cyclesWithDifference}`);
  console.log(`   Animali originali: ${totalOriginalAnimals.toLocaleString('it-IT')}`);
  console.log(`   Animali attuali (DB): ${totalCurrentAnimals.toLocaleString('it-IT')}`);
  console.log(`   Animali nuova logica: ${totalNewCalculated.toLocaleString('it-IT')}`);
  console.log(`   Differenza: ${(totalCurrentAnimals - totalNewCalculated).toLocaleString('it-IT')}`);
  
  await pool.end();
  process.exit(0);
}

generateMortalityAnalysis().catch(error => {
  console.error('Errore:', error);
  pool.end();
  process.exit(1);
});
