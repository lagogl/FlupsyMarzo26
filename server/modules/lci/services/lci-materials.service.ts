import { db } from "../../../db";
import { lciMaterials, type LciMaterial, type InsertLciMaterial } from "@shared/lci-schema";
import { eq, and, sql, desc } from "drizzle-orm";
import type { LciMaterialFilter, LciMaterialCategory } from "../types/lci.types";

export class LciMaterialsService {
  async getAll(filter?: LciMaterialFilter): Promise<LciMaterial[]> {
    let query = db.select().from(lciMaterials);
    
    const conditions = [];
    
    if (filter?.category) {
      conditions.push(eq(lciMaterials.category, filter.category));
    }
    if (filter?.materialType) {
      conditions.push(eq(lciMaterials.materialType, filter.materialType));
    }
    if (filter?.active !== undefined) {
      conditions.push(eq(lciMaterials.active, filter.active));
    }
    if (filter?.flupsyReference) {
      conditions.push(eq(lciMaterials.flupsyReference, filter.flupsyReference));
    }
    
    if (conditions.length > 0) {
      return db.select().from(lciMaterials).where(and(...conditions)).orderBy(desc(lciMaterials.createdAt));
    }
    
    return db.select().from(lciMaterials).orderBy(desc(lciMaterials.createdAt));
  }

  async getById(id: number): Promise<LciMaterial | undefined> {
    const result = await db.select().from(lciMaterials).where(eq(lciMaterials.id, id)).limit(1);
    return result[0];
  }

  async create(data: InsertLciMaterial): Promise<LciMaterial> {
    const result = await db.insert(lciMaterials).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async update(id: number, data: Partial<InsertLciMaterial>): Promise<LciMaterial | undefined> {
    const result = await db.update(lciMaterials)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(lciMaterials.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<boolean> {
    const result = await db.update(lciMaterials)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(lciMaterials.id, id))
      .returning();
    return result.length > 0;
  }

  async getCategories(): Promise<string[]> {
    const result = await db.selectDistinct({ category: lciMaterials.category }).from(lciMaterials);
    return result.map(r => r.category);
  }

  async getByCategory(category: string): Promise<LciMaterial[]> {
    return db.select().from(lciMaterials)
      .where(and(eq(lciMaterials.category, category), eq(lciMaterials.active, true)))
      .orderBy(lciMaterials.name);
  }

  async getTotalWeightByCategory(): Promise<{ category: string; totalWeightKg: number }[]> {
    const materials = await this.getAll({ active: true });
    
    const categoryTotals = new Map<string, number>();
    
    for (const material of materials) {
      const weight = (material.quantity || 1) * (Number(material.unitWeightKg) || 0);
      const current = categoryTotals.get(material.category) || 0;
      categoryTotals.set(material.category, current + weight);
    }
    
    return Array.from(categoryTotals.entries()).map(([category, totalWeightKg]) => ({
      category,
      totalWeightKg,
    }));
  }

  async bulkImport(materials: InsertLciMaterial[]): Promise<LciMaterial[]> {
    if (materials.length === 0) return [];
    
    const result = await db.insert(lciMaterials)
      .values(materials.map(m => ({ ...m, createdAt: new Date() })))
      .returning();
    return result;
  }
}

export const lciMaterialsService = new LciMaterialsService();
