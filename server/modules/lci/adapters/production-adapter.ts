import { db } from "../../../db";
import { sql } from "drizzle-orm";
import type { ProductionAdapterData } from "../types/lci.types";

export class ProductionAdapter {
  async getYearlyProduction(year: number): Promise<ProductionAdapterData> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const result = await db.execute(sql`
      SELECT 
        s.code as size_code,
        SUM(CASE 
          WHEN o.operation_type IN ('vendita', 'spedizione') THEN COALESCE(o.weight, 0)
          ELSE 0
        END) as output_kg,
        SUM(CASE 
          WHEN o.operation_type IN ('vendita', 'spedizione') THEN COALESCE(o.animal_count, 0)
          ELSE 0
        END) as output_pieces
      FROM operations o
      LEFT JOIN sizes s ON o.size_id = s.id
      WHERE o.operation_date >= ${startDate}
        AND o.operation_date <= ${endDate}
        AND o.operation_type IN ('vendita', 'spedizione')
      GROUP BY s.code
      ORDER BY s.code
    `);

    const bySize = (result.rows || []).map((row: any) => ({
      sizeCode: row.size_code || 'unknown',
      outputKg: parseFloat(row.output_kg) || 0,
      outputPieces: parseInt(row.output_pieces) || 0,
    }));

    const totalOutputKg = bySize.reduce((sum, s) => sum + s.outputKg, 0);
    const totalOutputPieces = bySize.reduce((sum, s) => sum + s.outputPieces, 0);

    return {
      totalOutputKg,
      totalOutputPieces,
      bySize,
    };
  }

  async getProductionByQuarter(year: number): Promise<Map<string, ProductionAdapterData>> {
    const quarters = new Map<string, ProductionAdapterData>();
    const quarterRanges = [
      { name: 'Q1', start: `${year}-01-01`, end: `${year}-03-31` },
      { name: 'Q2', start: `${year}-04-01`, end: `${year}-06-30` },
      { name: 'Q3', start: `${year}-07-01`, end: `${year}-09-30` },
      { name: 'Q4', start: `${year}-10-01`, end: `${year}-12-31` },
    ];

    for (const quarter of quarterRanges) {
      const result = await db.execute(sql`
        SELECT 
          s.code as size_code,
          SUM(CASE 
            WHEN o.operation_type IN ('vendita', 'spedizione') THEN COALESCE(o.weight, 0)
            ELSE 0
          END) as output_kg,
          SUM(CASE 
            WHEN o.operation_type IN ('vendita', 'spedizione') THEN COALESCE(o.animal_count, 0)
            ELSE 0
          END) as output_pieces
        FROM operations o
        LEFT JOIN sizes s ON o.size_id = s.id
        WHERE o.operation_date >= ${quarter.start}
          AND o.operation_date <= ${quarter.end}
          AND o.operation_type IN ('vendita', 'spedizione')
        GROUP BY s.code
        ORDER BY s.code
      `);

      const bySize = (result.rows || []).map((row: any) => ({
        sizeCode: row.size_code || 'unknown',
        outputKg: parseFloat(row.output_kg) || 0,
        outputPieces: parseInt(row.output_pieces) || 0,
      }));

      quarters.set(quarter.name, {
        totalOutputKg: bySize.reduce((sum, s) => sum + s.outputKg, 0),
        totalOutputPieces: bySize.reduce((sum, s) => sum + s.outputPieces, 0),
        bySize,
      });
    }

    return quarters;
  }
}

export const productionAdapter = new ProductionAdapter();
