import * as XLSX from 'xlsx';
import { db } from '../../../db';
import { lciMaterials, lciConsumables, lciConsumptionLogs, lciProductionSnapshots, lciReports, lciSettings } from '../../../../shared/lci-schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { productionAdapter } from '../adapters/production-adapter';
import { lotsAdapter } from '../adapters/lots-adapter';
import { flupsyAdapter } from '../adapters/flupsy-adapter';

export interface LCIReportData {
  companyInfo: {
    name: string;
    location: string;
    coordinates: string;
    facilityType: string;
    facilitySizeM2: number;
  };
  referenceYear: number;
  materials: {
    category: string;
    name: string;
    materialType: string;
    quantity: number;
    unit: string;
    totalWeightKg: number;
    expectedLifeYears: number;
    annualizedWeightKg: number;
  }[];
  consumables: {
    category: string;
    name: string;
    unit: string;
    annualAmount: number;
    ecoinventProcess: string;
  }[];
  production: {
    sizeCode: string;
    inputKg: number;
    inputPieces: number;
    outputKg: number;
    outputPieces: number;
    survivalRate: number;
  }[];
  summary: {
    totalMaterialsKg: number;
    totalAnnualizedMaterialsKg: number;
    totalProductionKg: number;
    totalInputPieces: number;
    totalOutputPieces: number;
    overallSurvivalRate: number;
  };
}

export class LciExportService {

  async generateReportData(referenceYear: number): Promise<LCIReportData> {
    const settings = await db.select().from(lciSettings);
    const companyInfoSetting = settings.find(s => s.key === 'company_info');
    const companyInfo = companyInfoSetting?.value as any || {
      name: 'Delta Futuro',
      location: 'Italia',
      coordinates: '',
      facilityType: 'Vivaio Molluschi',
      facilitySizeM2: 0
    };

    const materials = await db.select()
      .from(lciMaterials)
      .where(eq(lciMaterials.active, true));

    const consumables = await db.select()
      .from(lciConsumables)
      .where(eq(lciConsumables.active, true));

    const consumptionLogs = await db.select()
      .from(lciConsumptionLogs)
      .where(
        and(
          gte(lciConsumptionLogs.periodStart, `${referenceYear}-01-01`),
          lte(lciConsumptionLogs.periodEnd, `${referenceYear}-12-31`)
        )
      );

    let productionSnapshots = await db.select()
      .from(lciProductionSnapshots)
      .where(eq(lciProductionSnapshots.referenceYear, referenceYear));

    if (productionSnapshots.length === 0) {
      productionSnapshots = await this.generateProductionSnapshots(referenceYear);
    }

    const materialsData = materials.map(m => {
      const quantity = m.quantity || 1;
      const unitWeight = parseFloat(m.unitWeightKg || '0') || 0;
      const totalWeight = quantity * unitWeight;
      const lifeYears = parseFloat(m.expectedLifeYears || '0') || 1;
      const annualized = totalWeight / lifeYears;

      return {
        category: m.category,
        name: m.name,
        materialType: m.materialType || '',
        quantity,
        unit: m.unit || 'pc',
        totalWeightKg: totalWeight,
        expectedLifeYears: lifeYears,
        annualizedWeightKg: annualized
      };
    });

    const consumablesMap = new Map<number, number>();
    for (const log of consumptionLogs) {
      const current = consumablesMap.get(log.consumableId) || 0;
      consumablesMap.set(log.consumableId, current + parseFloat(log.amount));
    }

    const consumablesData = consumables.map(c => ({
      category: c.category,
      name: c.name,
      unit: c.unit,
      annualAmount: consumablesMap.get(c.id) || parseFloat(c.defaultAnnualAmount || '0') || 0,
      ecoinventProcess: c.ecoinventProcess || ''
    }));

    const productionData = productionSnapshots.map(p => {
      const inputPieces = p.inputPieces || 0;
      const outputPieces = p.outputPieces || 0;
      const survivalRate = inputPieces > 0 ? (outputPieces / inputPieces) * 100 : 0;

      return {
        sizeCode: p.sizeCode || 'TOTAL',
        inputKg: parseFloat(p.inputKg || '0') || 0,
        inputPieces,
        outputKg: parseFloat(p.outputKg || '0') || 0,
        outputPieces,
        survivalRate
      };
    });

    const totalMaterialsKg = materialsData.reduce((sum, m) => sum + m.totalWeightKg, 0);
    const totalAnnualizedMaterialsKg = materialsData.reduce((sum, m) => sum + m.annualizedWeightKg, 0);
    const totalProductionKg = productionData.reduce((sum, p) => sum + p.outputKg, 0);
    const totalInputPieces = productionData.reduce((sum, p) => sum + p.inputPieces, 0);
    const totalOutputPieces = productionData.reduce((sum, p) => sum + p.outputPieces, 0);
    const overallSurvivalRate = totalInputPieces > 0 ? (totalOutputPieces / totalInputPieces) * 100 : 0;

    return {
      companyInfo: {
        name: companyInfo.name || 'Delta Futuro',
        location: companyInfo.location || '',
        coordinates: companyInfo.coordinates || '',
        facilityType: companyInfo.facility_type || 'Vivaio Molluschi',
        facilitySizeM2: companyInfo.facility_size_m2 || 0
      },
      referenceYear,
      materials: materialsData,
      consumables: consumablesData,
      production: productionData,
      summary: {
        totalMaterialsKg,
        totalAnnualizedMaterialsKg,
        totalProductionKg,
        totalInputPieces,
        totalOutputPieces,
        overallSurvivalRate
      }
    };
  }

  async generateProductionSnapshots(referenceYear: number) {
    try {
      const productionData = await productionAdapter.getProductionByYear(referenceYear);
      
      const snapshots: any[] = [];
      for (const data of productionData) {
        const snapshot = {
          referenceYear,
          referencePeriod: 'annual',
          sizeCode: data.sizeCode,
          outputKg: data.outputKg?.toString() || '0',
          outputPieces: data.outputPieces || 0,
          inputKg: data.inputKg?.toString() || '0',
          inputPieces: data.inputPieces || 0,
          dataSource: 'calculated',
          calculationNotes: `Auto-generated from production data for year ${referenceYear}`
        };
        
        const [inserted] = await db.insert(lciProductionSnapshots).values(snapshot).returning();
        snapshots.push(inserted);
      }

      if (snapshots.length === 0) {
        const [defaultSnapshot] = await db.insert(lciProductionSnapshots).values({
          referenceYear,
          referencePeriod: 'annual',
          sizeCode: 'TOTAL',
          outputKg: '0',
          outputPieces: 0,
          inputKg: '0',
          inputPieces: 0,
          dataSource: 'placeholder',
          calculationNotes: 'No production data available for this year'
        }).returning();
        snapshots.push(defaultSnapshot);
      }

      return snapshots;
    } catch (error) {
      console.error('Error generating production snapshots:', error);
      return [];
    }
  }

  async generateExcelReport(referenceYear: number): Promise<Buffer> {
    const data = await this.generateReportData(referenceYear);
    
    const workbook = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.aoa_to_sheet([
      ['ECOTAPES - Life Cycle Inventory Report'],
      [],
      ['Informazioni Azienda'],
      ['Nome', data.companyInfo.name],
      ['Località', data.companyInfo.location],
      ['Coordinate', data.companyInfo.coordinates],
      ['Tipo Impianto', data.companyInfo.facilityType],
      ['Superficie (m²)', data.companyInfo.facilitySizeM2],
      [],
      ['Anno di Riferimento', data.referenceYear],
      [],
      ['Riepilogo LCI'],
      ['Peso Totale Materiali (kg)', data.summary.totalMaterialsKg.toFixed(2)],
      ['Peso Annualizzato Materiali (kg/anno)', data.summary.totalAnnualizedMaterialsKg.toFixed(2)],
      ['Produzione Totale (kg)', data.summary.totalProductionKg.toFixed(2)],
      ['Animali in Ingresso', data.summary.totalInputPieces],
      ['Animali in Uscita', data.summary.totalOutputPieces],
      ['Tasso Sopravvivenza (%)', data.summary.overallSurvivalRate.toFixed(1)],
      [],
      ['Report generato il', new Date().toLocaleDateString('it-IT')]
    ]);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Riepilogo');

    const materialsHeaders = ['Categoria', 'Nome', 'Tipo Materiale', 'Quantità', 'Unità', 'Peso Totale (kg)', 'Vita Utile (anni)', 'Peso Annualizzato (kg/anno)'];
    const materialsRows = data.materials.map(m => [
      m.category,
      m.name,
      m.materialType,
      m.quantity,
      m.unit,
      m.totalWeightKg.toFixed(3),
      m.expectedLifeYears.toFixed(1),
      m.annualizedWeightKg.toFixed(3)
    ]);
    const materialsSheet = XLSX.utils.aoa_to_sheet([materialsHeaders, ...materialsRows]);
    XLSX.utils.book_append_sheet(workbook, materialsSheet, 'Materiali');

    const consumablesHeaders = ['Categoria', 'Nome', 'Unità', 'Consumo Annuale', 'Processo Ecoinvent'];
    const consumablesRows = data.consumables.map(c => [
      c.category,
      c.name,
      c.unit,
      c.annualAmount.toFixed(3),
      c.ecoinventProcess
    ]);
    const consumablesSheet = XLSX.utils.aoa_to_sheet([consumablesHeaders, ...consumablesRows]);
    XLSX.utils.book_append_sheet(workbook, consumablesSheet, 'Consumabili');

    const productionHeaders = ['Taglia', 'Input (kg)', 'Input (pezzi)', 'Output (kg)', 'Output (pezzi)', 'Sopravvivenza (%)'];
    const productionRows = data.production.map(p => [
      p.sizeCode,
      p.inputKg.toFixed(2),
      p.inputPieces,
      p.outputKg.toFixed(2),
      p.outputPieces,
      p.survivalRate.toFixed(1)
    ]);
    const productionSheet = XLSX.utils.aoa_to_sheet([productionHeaders, ...productionRows]);
    XLSX.utils.book_append_sheet(workbook, productionSheet, 'Produzione');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    return Buffer.from(excelBuffer);
  }

  async createReport(name: string, referenceYear: number): Promise<any> {
    const reportData = await this.generateReportData(referenceYear);
    
    const [report] = await db.insert(lciReports).values({
      name,
      referenceYear,
      status: 'draft',
      reportData
    }).returning();

    return report;
  }

  async getReports(): Promise<any[]> {
    return db.select().from(lciReports).orderBy(desc(lciReports.createdAt));
  }

  async getReport(id: number): Promise<any | null> {
    const [report] = await db.select().from(lciReports).where(eq(lciReports.id, id));
    return report || null;
  }

  async finalizeReport(id: number): Promise<any> {
    const [report] = await db.update(lciReports)
      .set({ 
        status: 'finalized',
        finalizedAt: new Date()
      })
      .where(eq(lciReports.id, id))
      .returning();
    return report;
  }

  async deleteReport(id: number): Promise<void> {
    await db.delete(lciReports).where(eq(lciReports.id, id));
  }

  async getProductionSnapshots(referenceYear: number) {
    return db.select()
      .from(lciProductionSnapshots)
      .where(eq(lciProductionSnapshots.referenceYear, referenceYear));
  }

  async getConsumptionLogs(consumableId?: number, year?: number) {
    let query = db.select().from(lciConsumptionLogs);
    
    if (consumableId) {
      query = query.where(eq(lciConsumptionLogs.consumableId, consumableId)) as any;
    }
    
    return query.orderBy(desc(lciConsumptionLogs.createdAt));
  }

  async addConsumptionLog(data: {
    consumableId: number;
    periodStart: string;
    periodEnd: string;
    amount: string;
    source?: string;
    notes?: string;
    createdBy?: number;
  }) {
    const [log] = await db.insert(lciConsumptionLogs).values(data).returning();
    return log;
  }
}

export const lciExportService = new LciExportService();
