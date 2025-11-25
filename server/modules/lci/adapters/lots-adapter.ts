import { db } from "@db";
import { sql } from "drizzle-orm";
import type { LotsAdapterData } from "../types/lci.types";

export class LotsAdapter {
  async getYearlyInput(year: number): Promise<LotsAdapterData> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const result = await db.execute(sql`
      SELECT 
        l.code as lot_code,
        l.supplier as supplier,
        COALESCE(l.seed_weight, 0) as input_kg,
        COALESCE(l.seed_number, 0) as input_pieces
      FROM lots l
      WHERE l.created_at >= ${startDate}
        AND l.created_at <= ${endDate}
      ORDER BY l.code
    `);

    const byLot = (result.rows || []).map((row: any) => ({
      lotCode: row.lot_code || 'unknown',
      inputKg: parseFloat(row.input_kg) || 0,
      inputPieces: parseInt(row.input_pieces) || 0,
      supplier: row.supplier || '',
    }));

    const totalInputKg = byLot.reduce((sum, l) => sum + l.inputKg, 0);
    const totalInputPieces = byLot.reduce((sum, l) => sum + l.inputPieces, 0);

    return {
      totalInputKg,
      totalInputPieces,
      byLot,
    };
  }

  async getInputBySupplier(year: number): Promise<Map<string, LotsAdapterData>> {
    const result = await db.execute(sql`
      SELECT 
        l.supplier as supplier,
        l.code as lot_code,
        COALESCE(l.seed_weight, 0) as input_kg,
        COALESCE(l.seed_number, 0) as input_pieces
      FROM lots l
      WHERE l.created_at >= ${`${year}-01-01`}
        AND l.created_at <= ${`${year}-12-31`}
      ORDER BY l.supplier, l.code
    `);

    const supplierMap = new Map<string, LotsAdapterData>();

    for (const row of (result.rows || []) as any[]) {
      const supplier = row.supplier || 'unknown';
      const lotData = {
        lotCode: row.lot_code || 'unknown',
        inputKg: parseFloat(row.input_kg) || 0,
        inputPieces: parseInt(row.input_pieces) || 0,
        supplier,
      };

      if (!supplierMap.has(supplier)) {
        supplierMap.set(supplier, {
          totalInputKg: 0,
          totalInputPieces: 0,
          byLot: [],
        });
      }

      const existing = supplierMap.get(supplier)!;
      existing.byLot.push(lotData);
      existing.totalInputKg += lotData.inputKg;
      existing.totalInputPieces += lotData.inputPieces;
    }

    return supplierMap;
  }
}

export const lotsAdapter = new LotsAdapter();
