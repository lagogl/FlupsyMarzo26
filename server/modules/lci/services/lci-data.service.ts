import { db } from "@db";
import { lciProductionSnapshots, lciReports, lciSettings, type LciProductionSnapshot, type LciReport, type LciSetting, type InsertLciProductionSnapshot, type InsertLciReport } from "@shared/lci-schema";
import { eq, and, desc } from "drizzle-orm";
import { lciMaterialsService } from "./lci-materials.service";
import { lciConsumablesService } from "./lci-consumables.service";
import { productionAdapter } from "../adapters/production-adapter";
import type { LciReportData, LciExportOptions } from "../types/lci.types";

export class LciDataService {
  async getSetting(key: string): Promise<LciSetting | undefined> {
    const result = await db.select().from(lciSettings).where(eq(lciSettings.key, key)).limit(1);
    return result[0];
  }

  async setSetting(key: string, value: any, description?: string): Promise<LciSetting> {
    const existing = await this.getSetting(key);
    
    if (existing) {
      const result = await db.update(lciSettings)
        .set({ value, description, updatedAt: new Date() })
        .where(eq(lciSettings.key, key))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(lciSettings)
        .values({ key, value, description, updatedAt: new Date() })
        .returning();
      return result[0];
    }
  }

  async getAllSettings(): Promise<LciSetting[]> {
    return db.select().from(lciSettings);
  }

  async isModuleEnabled(): Promise<boolean> {
    const setting = await this.getSetting('lci_module_enabled');
    return setting?.value === true || setting?.value === 'true';
  }

  async getProductionSnapshots(year?: number): Promise<LciProductionSnapshot[]> {
    if (year) {
      return db.select().from(lciProductionSnapshots)
        .where(eq(lciProductionSnapshots.referenceYear, year))
        .orderBy(desc(lciProductionSnapshots.createdAt));
    }
    return db.select().from(lciProductionSnapshots).orderBy(desc(lciProductionSnapshots.createdAt));
  }

  async createProductionSnapshot(data: InsertLciProductionSnapshot): Promise<LciProductionSnapshot> {
    const result = await db.insert(lciProductionSnapshots).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async calculateProductionFromApp(year: number): Promise<InsertLciProductionSnapshot[]> {
    const productionData = await productionAdapter.getYearlyProduction(year);
    
    return productionData.bySize.map(sizeData => ({
      referenceYear: year,
      referencePeriod: 'annual',
      sizeCode: sizeData.sizeCode,
      outputKg: String(sizeData.outputKg),
      outputPieces: sizeData.outputPieces,
      inputKg: null,
      inputPieces: null,
      dataSource: 'calculated',
      calculationNotes: `Calculated from app data for year ${year}`,
    }));
  }

  async getReports(year?: number): Promise<LciReport[]> {
    if (year) {
      return db.select().from(lciReports)
        .where(eq(lciReports.referenceYear, year))
        .orderBy(desc(lciReports.createdAt));
    }
    return db.select().from(lciReports).orderBy(desc(lciReports.createdAt));
  }

  async getReportById(id: number): Promise<LciReport | undefined> {
    const result = await db.select().from(lciReports).where(eq(lciReports.id, id)).limit(1);
    return result[0];
  }

  async createReport(data: InsertLciReport): Promise<LciReport> {
    const result = await db.insert(lciReports).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateReport(id: number, data: Partial<InsertLciReport>): Promise<LciReport | undefined> {
    const result = await db.update(lciReports)
      .set(data)
      .where(eq(lciReports.id, id))
      .returning();
    return result[0];
  }

  async finalizeReport(id: number): Promise<LciReport | undefined> {
    const result = await db.update(lciReports)
      .set({ status: 'final', finalizedAt: new Date() })
      .where(eq(lciReports.id, id))
      .returning();
    return result[0];
  }

  async generateReportData(year: number): Promise<LciReportData> {
    const companyInfoSetting = await this.getSetting('company_info');
    const companyInfo = companyInfoSetting?.value as LciReportData['companyInfo'] || {
      name: 'Delta Futuro',
      location: 'Goro (FE)',
      coordinates: "44°50'21\"N 12°19'22\"E",
      facilityType: 'raceways (indoor) + FLUPSY e sand nursery (outdoor)',
      facilitySizeM2: 70000,
    };

    const snapshots = await this.getProductionSnapshots(year);
    const productionData = snapshots.map(s => ({
      referenceYear: s.referenceYear,
      referencePeriod: s.referencePeriod,
      sizeCode: s.sizeCode || '',
      outputKg: Number(s.outputKg) || 0,
      outputPieces: Number(s.outputPieces) || 0,
      inputKg: Number(s.inputKg) || 0,
      inputPieces: Number(s.inputPieces) || 0,
    }));

    const materials = await lciMaterialsService.getAll({ active: true });
    const materialsByCategory = new Map<string, typeof materials>();
    
    for (const material of materials) {
      const categoryMaterials = materialsByCategory.get(material.category) || [];
      categoryMaterials.push(material);
      materialsByCategory.set(material.category, categoryMaterials);
    }

    const materialCategories = Array.from(materialsByCategory.entries()).map(([category, items]) => ({
      category,
      items,
      totalWeightKg: items.reduce((sum, m) => sum + (m.quantity || 1) * (Number(m.unitWeightKg) || 0), 0),
    }));

    const consumptionSummary = await lciConsumablesService.getYearlySummary(year);
    const consumablesByCategory = new Map<string, typeof consumptionSummary>();
    
    for (const summary of consumptionSummary) {
      const categorySummaries = consumablesByCategory.get(summary.category) || [];
      categorySummaries.push(summary);
      consumablesByCategory.set(summary.category, categorySummaries);
    }

    const consumableCategories = Array.from(consumablesByCategory.entries()).map(([category, items]) => ({
      category,
      items,
    }));

    return {
      companyInfo,
      referenceYear: year,
      productionData,
      materials: materialCategories,
      consumables: consumableCategories,
    };
  }
}

export const lciDataService = new LciDataService();
