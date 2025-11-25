import { db } from "@db";
import { lciConsumables, lciConsumptionLogs, type LciConsumable, type LciConsumptionLog, type InsertLciConsumable, type InsertLciConsumptionLog } from "@shared/lci-schema";
import { eq, and, between, desc, sql } from "drizzle-orm";
import type { LciConsumableFilter, LciConsumptionSummary } from "../types/lci.types";

export class LciConsumablesService {
  async getAll(filter?: LciConsumableFilter): Promise<LciConsumable[]> {
    const conditions = [];
    
    if (filter?.category) {
      conditions.push(eq(lciConsumables.category, filter.category));
    }
    if (filter?.active !== undefined) {
      conditions.push(eq(lciConsumables.active, filter.active));
    }
    
    if (conditions.length > 0) {
      return db.select().from(lciConsumables).where(and(...conditions)).orderBy(lciConsumables.name);
    }
    
    return db.select().from(lciConsumables).orderBy(lciConsumables.name);
  }

  async getById(id: number): Promise<LciConsumable | undefined> {
    const result = await db.select().from(lciConsumables).where(eq(lciConsumables.id, id)).limit(1);
    return result[0];
  }

  async create(data: InsertLciConsumable): Promise<LciConsumable> {
    const result = await db.insert(lciConsumables).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async update(id: number, data: Partial<InsertLciConsumable>): Promise<LciConsumable | undefined> {
    const result = await db.update(lciConsumables)
      .set(data)
      .where(eq(lciConsumables.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<boolean> {
    const result = await db.update(lciConsumables)
      .set({ active: false })
      .where(eq(lciConsumables.id, id))
      .returning();
    return result.length > 0;
  }

  async getLogs(consumableId: number): Promise<LciConsumptionLog[]> {
    return db.select().from(lciConsumptionLogs)
      .where(eq(lciConsumptionLogs.consumableId, consumableId))
      .orderBy(desc(lciConsumptionLogs.periodEnd));
  }

  async addLog(data: InsertLciConsumptionLog): Promise<LciConsumptionLog> {
    const result = await db.insert(lciConsumptionLogs).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async getYearlySummary(year: number): Promise<LciConsumptionSummary[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const logs = await db.select({
      consumableId: lciConsumptionLogs.consumableId,
      amount: lciConsumptionLogs.amount,
      periodStart: lciConsumptionLogs.periodStart,
      periodEnd: lciConsumptionLogs.periodEnd,
    }).from(lciConsumptionLogs)
      .where(and(
        sql`${lciConsumptionLogs.periodStart} >= ${startDate.toISOString().split('T')[0]}`,
        sql`${lciConsumptionLogs.periodEnd} <= ${endDate.toISOString().split('T')[0]}`
      ));

    const consumables = await this.getAll({ active: true });
    const consumableMap = new Map(consumables.map(c => [c.id, c]));

    const summaryMap = new Map<number, { total: number; minStart: string; maxEnd: string }>();
    
    for (const log of logs) {
      const current = summaryMap.get(log.consumableId) || { 
        total: 0, 
        minStart: log.periodStart || '', 
        maxEnd: log.periodEnd || ''
      };
      
      current.total += Number(log.amount);
      if (log.periodStart && log.periodStart < current.minStart) {
        current.minStart = log.periodStart;
      }
      if (log.periodEnd && log.periodEnd > current.maxEnd) {
        current.maxEnd = log.periodEnd;
      }
      
      summaryMap.set(log.consumableId, current);
    }

    const result: LciConsumptionSummary[] = [];
    
    for (const [consumableId, data] of summaryMap.entries()) {
      const consumable = consumableMap.get(consumableId);
      if (consumable) {
        result.push({
          consumableId,
          consumableName: consumable.name,
          category: consumable.category,
          unit: consumable.unit,
          totalAmount: data.total,
          periodStart: data.minStart,
          periodEnd: data.maxEnd,
        });
      }
    }

    return result;
  }
}

export const lciConsumablesService = new LciConsumablesService();
