import { db } from "../../../db";
import { sql } from "drizzle-orm";
import type { FlupsyAdapterData } from "../types/lci.types";

export class FlupsyAdapter {
  async getFlupsyOverview(): Promise<FlupsyAdapterData> {
    const flupsyResult = await db.execute(sql`
      SELECT 
        f.name as flupsy_name,
        COUNT(b.id) as basket_count,
        f.capacity as capacity
      FROM flupsy_systems f
      LEFT JOIN baskets b ON b.flupsy_id = f.id AND b.active = true
      WHERE f.active = true
      GROUP BY f.id, f.name, f.capacity
      ORDER BY f.name
    `);

    const activeFlupsySystems: string[] = [];
    let totalBaskets = 0;
    let totalCapacity = 0;

    for (const row of (flupsyResult.rows || []) as any[]) {
      activeFlupsySystems.push(row.flupsy_name);
      totalBaskets += parseInt(row.basket_count) || 0;
      totalCapacity += parseInt(row.capacity) || 0;
    }

    const totalFlupsy = activeFlupsySystems.length;
    const averageCapacity = totalFlupsy > 0 ? totalCapacity / totalFlupsy : 0;

    return {
      totalFlupsy,
      activeFlupsySystems,
      totalBaskets,
      averageCapacity,
    };
  }

  async getFlupsyDetails(): Promise<{
    name: string;
    basketCount: number;
    capacity: number;
    activeCycles: number;
  }[]> {
    const result = await db.execute(sql`
      SELECT 
        f.name as flupsy_name,
        COUNT(DISTINCT b.id) as basket_count,
        f.capacity as capacity,
        COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_cycles
      FROM flupsy_systems f
      LEFT JOIN baskets b ON b.flupsy_id = f.id AND b.active = true
      LEFT JOIN cycles c ON c.basket_id = b.id
      WHERE f.active = true
      GROUP BY f.id, f.name, f.capacity
      ORDER BY f.name
    `);

    return (result.rows || []).map((row: any) => ({
      name: row.flupsy_name,
      basketCount: parseInt(row.basket_count) || 0,
      capacity: parseInt(row.capacity) || 0,
      activeCycles: parseInt(row.active_cycles) || 0,
    }));
  }

  async getMaterialsFromFlupsy(): Promise<{
    flupsyName: string;
    estimatedWeight: number;
    materialType: string;
  }[]> {
    const result = await db.execute(sql`
      SELECT 
        f.name as flupsy_name,
        f.capacity as capacity
      FROM flupsy_systems f
      WHERE f.active = true
      ORDER BY f.name
    `);

    return (result.rows || []).map((row: any) => ({
      flupsyName: row.flupsy_name,
      estimatedWeight: (parseInt(row.capacity) || 0) * 15,
      materialType: 'HDPE/PVC',
    }));
  }
}

export const flupsyAdapter = new FlupsyAdapter();
