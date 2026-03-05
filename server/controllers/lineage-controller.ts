import type { Request, Response } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";
import ExcelJS from 'exceljs';

export async function getLineageData(req: Request, res: Response) {
  try {
    const { basketIds, cycleIds } = req.query;

    if (!basketIds && !cycleIds) {
      return res.status(400).json({ error: "Fornire basketIds o cycleIds" });
    }

    let lineageGroupIds: number[] = [];

    if (cycleIds) {
      const ids = String(cycleIds).split(',').map(Number).filter(Boolean);
      const rows = await db.execute(sql`
        SELECT DISTINCT lineage_group_id FROM cycles
        WHERE id = ANY(${ids}::int[]) AND lineage_group_id IS NOT NULL
      `);
      lineageGroupIds = (rows.rows as any[]).map(r => r.lineage_group_id);
      // Anche il ciclo stesso se non ha lineage_group_id (è radice)
      const selfRows = await db.execute(sql`
        SELECT id FROM cycles WHERE id = ANY(${ids}::int[]) AND lineage_group_id IS NULL
      `);
      lineageGroupIds.push(...(selfRows.rows as any[]).map(r => r.id));
    }

    if (basketIds) {
      const physNums = String(basketIds).split(',').map(Number).filter(Boolean);
      const rows = await db.execute(sql`
        SELECT DISTINCT c.lineage_group_id, c.id
        FROM cycles c
        JOIN baskets b ON b.id = c.basket_id
        WHERE b.physical_number = ANY(${physNums}::int[])
          AND b.current_cycle_id = c.id
      `);
      for (const r of rows.rows as any[]) {
        lineageGroupIds.push(r.lineage_group_id ?? r.id);
      }
    }

    // Deduplica
    lineageGroupIds = [...new Set(lineageGroupIds.filter(Boolean))];

    if (lineageGroupIds.length === 0) {
      return res.json({ groups: [] });
    }

    // Recupera tutti i cicli dei gruppi, con dati aggregati
    const cyclesData = await db.execute(sql`
      SELECT
        c.id,
        c.basket_id,
        c.lot_id,
        c.start_date,
        c.end_date,
        c.state,
        c.parent_cycle_id,
        c.lineage_group_id,
        b.physical_number AS basket_physical_number,
        f.name AS flupsy_name,
        b.flupsy_id,
        l.name AS lot_name,
        l.supplier AS lot_supplier,
        -- Prima operazione del ciclo (tipo evento di apertura)
        (SELECT o.type FROM operations o WHERE o.cycle_id = c.id
         ORDER BY o.date ASC, o.id ASC LIMIT 1) AS opening_type,
        -- Ultima operazione
        (SELECT o.date FROM operations o WHERE o.cycle_id = c.id
         ORDER BY o.date DESC, o.id DESC LIMIT 1) AS last_op_date,
        (SELECT o.type FROM operations o WHERE o.cycle_id = c.id
         ORDER BY o.date DESC, o.id DESC LIMIT 1) AS last_op_type,
        -- Animali e taglia dall'ultima operazione utile
        (SELECT o.animal_count FROM operations o WHERE o.cycle_id = c.id
         AND o.type IN ('prima-attivazione','misura','peso','trasferimento')
         AND o.cancelled_at IS NULL
         ORDER BY o.date DESC, o.id DESC LIMIT 1) AS last_animal_count,
        (SELECT o.animals_per_kg FROM operations o WHERE o.cycle_id = c.id
         AND o.type IN ('prima-attivazione','misura','peso','trasferimento')
         AND o.cancelled_at IS NULL
         ORDER BY o.date DESC, o.id DESC LIMIT 1) AS last_animals_per_kg,
        (SELECT s.code FROM operations o JOIN sizes s ON s.id = o.size_id
         WHERE o.cycle_id = c.id AND o.type IN ('prima-attivazione','misura','peso','trasferimento')
         AND o.cancelled_at IS NULL
         ORDER BY o.date DESC, o.id DESC LIMIT 1) AS last_size_code,
        (SELECT o.total_weight FROM operations o WHERE o.cycle_id = c.id
         AND o.type IN ('prima-attivazione','misura','peso','trasferimento')
         AND o.cancelled_at IS NULL
         ORDER BY o.date DESC, o.id DESC LIMIT 1) AS last_total_weight,
        -- Conteggio operazioni
        (SELECT COUNT(*) FROM operations o WHERE o.cycle_id = c.id
         AND o.cancelled_at IS NULL) AS operation_count
      FROM cycles c
      JOIN baskets b ON b.id = c.basket_id
      JOIN flupsys f ON f.id = b.flupsy_id
      LEFT JOIN lots l ON l.id = c.lot_id
      WHERE c.lineage_group_id = ANY(${lineageGroupIds}::int[])
         OR c.id = ANY(${lineageGroupIds}::int[])
      ORDER BY c.lineage_group_id NULLS LAST, c.id ASC
    `);

    // Recupera le operazioni dettagliate per ogni ciclo
    const cycleIdsAll = (cyclesData.rows as any[]).map(r => r.id);
    let operationsData: any[] = [];

    if (cycleIdsAll.length > 0) {
      const opsResult = await db.execute(sql`
        SELECT
          o.id,
          o.cycle_id,
          o.date,
          o.type,
          o.animal_count,
          o.animals_per_kg,
          o.total_weight,
          o.average_weight,
          o.dead_count,
          o.mortality_rate,
          o.notes,
          s.code AS size_code,
          o.operator_name
        FROM operations o
        LEFT JOIN sizes s ON s.id = o.size_id
        WHERE o.cycle_id = ANY(${cycleIdsAll}::int[])
          AND o.cancelled_at IS NULL
        ORDER BY o.cycle_id, o.date ASC, o.id ASC
      `);
      operationsData = opsResult.rows as any[];
    }

    // Raggruppa per lineage_group_id
    const groupMap = new Map<number, any[]>();
    for (const cycle of cyclesData.rows as any[]) {
      const gid = cycle.lineage_group_id ?? cycle.id;
      if (!groupMap.has(gid)) groupMap.set(gid, []);
      groupMap.get(gid)!.push({
        ...cycle,
        operations: operationsData.filter(o => o.cycle_id === cycle.id)
      });
    }

    const groups = Array.from(groupMap.entries()).map(([groupId, cycles]) => ({
      lineageGroupId: groupId,
      rootCycle: cycles.find(c => c.parent_cycle_id === null || c.parent_cycle_id === undefined),
      cycles
    }));

    return res.json({ groups });
  } catch (err: any) {
    console.error('Lineage error:', err);
    return res.status(500).json({ error: err.message });
  }
}

export async function exportLineageExcel(req: Request, res: Response) {
  try {
    const { basketIds, cycleIds } = req.query;

    const lineageRes = await new Promise<any>((resolve) => {
      const fakeRes = {
        json: resolve,
        status: () => ({ json: resolve })
      };
      getLineageData(req, fakeRes as any);
    });

    const { groups } = lineageRes;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'FLUPSY Management System';
    workbook.created = new Date();

    for (const group of groups) {
      const rootName = group.rootCycle
        ? `Cesta${group.rootCycle.basket_physical_number}_Ciclo${group.lineageGroupId}`
        : `Gruppo${group.lineageGroupId}`;
      const sheetName = rootName.substring(0, 31);
      const sheet = workbook.addWorksheet(sheetName);

      // Titolo
      const titleRow = sheet.addRow([`STORIA ANIMALI — Gruppo Genealogico #${group.lineageGroupId}`]);
      titleRow.font = { bold: true, size: 14 };
      sheet.mergeCells(`A1:N1`);
      sheet.addRow([]);

      // Intestazioni cicli
      const headers = [
        'Ciclo #', 'Cesta Fisica', 'FLUPSY', 'Lotto', 'Fornitore',
        'Data Inizio', 'Data Fine', 'Stato', 'Ciclo Genitore',
        'Tipo Apertura', 'N° Operazioni',
        'Ultimi Animali', 'Peso Tot. (g)', 'Ultima Taglia'
      ];
      const headerRow = sheet.addRow(headers);
      headerRow.font = { bold: true };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A56DB' } };
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

      for (const cycle of group.cycles) {
        const dataRow = sheet.addRow([
          cycle.id,
          cycle.basket_physical_number,
          cycle.flupsy_name,
          cycle.lot_name ?? '',
          cycle.lot_supplier ?? '',
          cycle.start_date,
          cycle.end_date ?? '',
          cycle.state === 'active' ? 'Attivo' : 'Chiuso',
          cycle.parent_cycle_id ?? 'RADICE',
          cycle.opening_type ?? '',
          Number(cycle.operation_count),
          cycle.last_animal_count ?? '',
          cycle.last_total_weight ?? '',
          cycle.last_size_code ?? ''
        ]);

        // Colora radice in verde, figli in azzurro
        const isRoot = !cycle.parent_cycle_id;
        dataRow.fill = {
          type: 'pattern', pattern: 'solid',
          fgColor: { argb: isRoot ? 'FFD1FAE5' : 'FFEFF6FF' }
        };
      }

      // Autowidth
      sheet.columns.forEach(col => {
        col.width = Math.max(12, Math.min(35, (col.header?.toString().length ?? 10) + 4));
      });

      sheet.addRow([]);
      sheet.addRow([]);

      // === FOGLIO OPERAZIONI PER OGNI CICLO ===
      const opSheetName = `Op_${sheetName}`.substring(0, 31);
      const opSheet = workbook.addWorksheet(opSheetName);

      const opTitleRow = opSheet.addRow([`OPERAZIONI DETTAGLIATE — Gruppo #${group.lineageGroupId}`]);
      opTitleRow.font = { bold: true, size: 13 };
      opSheet.mergeCells(`A1:M1`);
      opSheet.addRow([]);

      const opHeaders = [
        'Ciclo #', 'Cesta Fisica', 'FLUPSY', 'Data', 'Tipo Operazione',
        'N° Animali', 'Animali/Kg', 'Peso Tot. (g)', 'Peso Medio (mg)',
        'Morti', 'Mortalità %', 'Taglia', 'Note'
      ];
      const opHeaderRow = opSheet.addRow(opHeaders);
      opHeaderRow.font = { bold: true };
      opHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
      opHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

      for (const cycle of group.cycles) {
        for (const op of cycle.operations) {
          opSheet.addRow([
            cycle.id,
            cycle.basket_physical_number,
            cycle.flupsy_name,
            op.date,
            op.type,
            op.animal_count ?? '',
            op.animals_per_kg ?? '',
            op.total_weight ?? '',
            op.average_weight ? Math.round(op.average_weight) : '',
            op.dead_count ?? '',
            op.mortality_rate ? `${op.mortality_rate}%` : '',
            op.size_code ?? '',
            op.notes ?? ''
          ]);
        }
      }

      opSheet.columns.forEach(col => {
        col.width = Math.max(12, Math.min(50, (col.header?.toString().length ?? 10) + 4));
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `storia_animali_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (err: any) {
    console.error('Lineage export error:', err);
    res.status(500).json({ error: err.message });
  }
}
