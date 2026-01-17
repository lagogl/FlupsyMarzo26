import { db } from "../db";
import { sql } from "drizzle-orm";
import ExcelJSModule from 'exceljs';

const ExcelJS = (ExcelJSModule as any).default || ExcelJSModule;

async function exportMisuraBackup() {
  console.log("🔄 Generazione backup operazioni MISURA...");
  
  const result = await db.execute(sql`
    WITH ordered_ops AS (
      SELECT 
        o.id,
        o.basket_id,
        o.cycle_id,
        o.type,
        o.date,
        o.animal_count,
        o.total_weight,
        o.animals_per_kg,
        o.average_weight,
        o.dead_count,
        o.mortality_rate,
        o.lot_id,
        o.size_id,
        o.notes,
        b.physical_number as basket_number,
        f.name as flupsy_name,
        l.supplier_lot_number as lot_code,
        LAG(o.animal_count) OVER (PARTITION BY o.basket_id, o.cycle_id ORDER BY o.date, o.id) as prev_animal_count
      FROM operations o
      LEFT JOIN baskets b ON o.basket_id = b.id
      LEFT JOIN flupsys f ON b.flupsy_id = f.id
      LEFT JOIN lots l ON o.lot_id = l.id
      WHERE o.cycle_id IS NOT NULL AND o.cancelled_at IS NULL
    ),
    problematic_misura AS (
      SELECT id, basket_id, cycle_id, date as misura_date
      FROM ordered_ops
      WHERE type = 'misura'
        AND prev_animal_count IS NOT NULL AND prev_animal_count > 0
        AND ABS((animal_count - prev_animal_count)::numeric / prev_animal_count::numeric) > 0.05
    )
    SELECT 
      o.id as operation_id,
      o.flupsy_name,
      o.basket_number,
      o.cycle_id,
      o.type,
      o.date,
      o.animal_count,
      o.prev_animal_count,
      o.total_weight,
      o.animals_per_kg,
      o.average_weight,
      o.dead_count,
      o.mortality_rate,
      o.lot_code,
      CASE 
        WHEN o.type = 'misura' AND o.prev_animal_count IS NOT NULL 
             AND ABS((o.animal_count - o.prev_animal_count)::numeric / o.prev_animal_count::numeric) > 0.05
        THEN 'MISURA_DA_CORREGGERE'
        ELSE 'SUCCESSIVA_IMPATTATA'
      END as categoria,
      CASE 
        WHEN o.type = 'misura' AND o.prev_animal_count IS NOT NULL AND COALESCE(o.mortality_rate, 0) > 0
        THEN ROUND(o.prev_animal_count * (100 - COALESCE(o.mortality_rate, 0)) / 100)
        WHEN o.type = 'misura' AND o.prev_animal_count IS NOT NULL
        THEN o.prev_animal_count
        ELSE NULL
      END as valore_corretto_proposto
    FROM ordered_ops o
    WHERE 
      (o.type = 'misura' AND o.prev_animal_count IS NOT NULL AND o.prev_animal_count > 0
       AND ABS((o.animal_count - o.prev_animal_count)::numeric / o.prev_animal_count::numeric) > 0.05)
      OR
      EXISTS (
        SELECT 1 FROM problematic_misura pm 
        WHERE pm.basket_id = o.basket_id 
        AND pm.cycle_id = o.cycle_id 
        AND o.date > pm.misura_date
      )
    ORDER BY o.flupsy_name, o.basket_id, o.cycle_id, o.date, o.id
  `);

  const rows = result.rows as any[];
  console.log(`📊 Trovate ${rows.length} operazioni da esportare`);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FLUPSY Management System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Backup Operazioni MISURA');

  const titleRow = sheet.addRow(['BACKUP OPERAZIONI MISURA - Prima della Correzione']);
  titleRow.font = { bold: true, size: 14, color: { argb: 'FF0066CC' } };
  sheet.mergeCells('A1:Q1');

  const subtitleRow = sheet.addRow([`Generato il: ${new Date().toLocaleString('it-IT')} - Totale righe: ${rows.length}`]);
  subtitleRow.font = { italic: true, size: 10 };
  sheet.mergeCells('A2:Q2');

  sheet.addRow([]);

  const headers = [
    'ID Operazione', 'FLUPSY', 'Cesta', 'Ciclo', 'Tipo', 'Data',
    'N. Animali Attuale', 'N. Animali Precedente', 'Peso Totale (g)',
    'Animali/Kg', 'Peso Medio', 'Morti', 'Mortalità %', 'Lotto',
    'Categoria', 'Valore Corretto Proposto', 'Differenza'
  ];
  
  const headerRow = sheet.addRow(headers);
  headerRow.eachCell((cell: any) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0066CC' }
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  rows.forEach((row, index) => {
    const diff = row.valore_corretto_proposto && row.animal_count 
      ? row.animal_count - row.valore_corretto_proposto 
      : null;
    
    const dataRow = sheet.addRow([
      row.operation_id,
      row.flupsy_name,
      row.basket_number,
      row.cycle_id,
      row.type,
      row.date ? new Date(row.date).toLocaleDateString('it-IT') : '',
      row.animal_count,
      row.prev_animal_count,
      row.total_weight,
      row.animals_per_kg,
      row.average_weight ? Math.round(row.average_weight * 1000) / 1000 : null,
      row.dead_count,
      row.mortality_rate ? Math.round(row.mortality_rate * 100) / 100 : null,
      row.lot_code,
      row.categoria,
      row.valore_corretto_proposto,
      diff
    ]);

    if (row.categoria === 'MISURA_DA_CORREGGERE') {
      dataRow.eachCell((cell: any) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCCCC' }
        };
      });
    } else if (index % 2 === 1) {
      dataRow.eachCell((cell: any) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' }
        };
      });
    }
  });

  sheet.columns.forEach((column: any, i: number) => {
    const widths = [12, 25, 8, 8, 25, 12, 18, 18, 15, 12, 12, 8, 10, 25, 22, 22, 15];
    column.width = widths[i] || 15;
  });

  sheet.autoFilter = {
    from: 'A4',
    to: `Q${rows.length + 4}`
  };

  const summarySheet = workbook.addWorksheet('Riepilogo');
  
  const summaryTitle = summarySheet.addRow(['RIEPILOGO CORREZIONI']);
  summaryTitle.font = { bold: true, size: 14, color: { argb: 'FF0066CC' } };
  summarySheet.mergeCells('A1:C1');

  summarySheet.addRow([]);

  const misuraCount = rows.filter((r: any) => r.categoria === 'MISURA_DA_CORREGGERE').length;
  const successiveCount = rows.filter((r: any) => r.categoria === 'SUCCESSIVA_IMPATTATA').length;
  
  summarySheet.addRow(['Metrica', 'Valore']);
  summarySheet.addRow(['Operazioni MISURA da correggere', misuraCount]);
  summarySheet.addRow(['Operazioni successive impattate', successiveCount]);
  summarySheet.addRow(['Totale operazioni coinvolte', rows.length]);

  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const filename = `backup_misura_${timestamp}.xlsx`;
  const filepath = `./public/${filename}`;
  
  await workbook.xlsx.writeFile(filepath);
  console.log(`✅ File salvato: ${filepath}`);
  
  return { filename, filepath, rowCount: rows.length, misuraCount, successiveCount };
}

exportMisuraBackup()
  .then(result => {
    console.log(`\n📁 BACKUP COMPLETATO`);
    console.log(`   File: ${result.filename}`);
    console.log(`   MISURA da correggere: ${result.misuraCount}`);
    console.log(`   Successive impattate: ${result.successiveCount}`);
    console.log(`   Totale righe: ${result.rowCount}`);
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Errore:", err);
    process.exit(1);
  });
