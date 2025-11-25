import { Request, Response } from "express";
import { lciMaterialsService } from "./services/lci-materials.service";
import { lciConsumablesService } from "./services/lci-consumables.service";
import { lciDataService } from "./services/lci-data.service";
import { productionAdapter } from "./adapters/production-adapter";
import { lotsAdapter } from "./adapters/lots-adapter";
import { flupsyAdapter } from "./adapters/flupsy-adapter";
import { insertLciMaterialSchema, insertLciConsumableSchema, insertLciConsumptionLogSchema, insertLciProductionSnapshotSchema, insertLciReportSchema } from "@shared/lci-schema";

export class LciController {
  async getStatus(req: Request, res: Response) {
    try {
      const enabled = await lciDataService.isModuleEnabled();
      const settings = await lciDataService.getAllSettings();
      res.json({ enabled, settings });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getMaterials(req: Request, res: Response) {
    try {
      const { category, materialType, active, flupsyReference } = req.query;
      const filter: any = {};
      if (category) filter.category = category;
      if (materialType) filter.materialType = materialType;
      if (active !== undefined) filter.active = active === 'true';
      if (flupsyReference) filter.flupsyReference = flupsyReference;
      
      const materials = await lciMaterialsService.getAll(filter);
      res.json(materials);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getMaterialById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const material = await lciMaterialsService.getById(id);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }
      res.json(material);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createMaterial(req: Request, res: Response) {
    try {
      const parsed = insertLciMaterialSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const material = await lciMaterialsService.create(parsed.data);
      res.status(201).json(material);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateMaterial(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const material = await lciMaterialsService.update(id, req.body);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }
      res.json(material);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteMaterial(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const success = await lciMaterialsService.delete(id);
      if (!success) {
        return res.status(404).json({ error: "Material not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getMaterialCategories(req: Request, res: Response) {
    try {
      const categories = await lciMaterialsService.getCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getMaterialsByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params;
      const materials = await lciMaterialsService.getByCategory(category);
      res.json(materials);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async bulkImportMaterials(req: Request, res: Response) {
    try {
      const { materials } = req.body;
      if (!Array.isArray(materials)) {
        return res.status(400).json({ error: "materials must be an array" });
      }
      const result = await lciMaterialsService.bulkImport(materials);
      res.status(201).json({ imported: result.length, materials: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getConsumables(req: Request, res: Response) {
    try {
      const { category, active } = req.query;
      const filter: any = {};
      if (category) filter.category = category;
      if (active !== undefined) filter.active = active === 'true';
      
      const consumables = await lciConsumablesService.getAll(filter);
      res.json(consumables);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getConsumableById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const consumable = await lciConsumablesService.getById(id);
      if (!consumable) {
        return res.status(404).json({ error: "Consumable not found" });
      }
      res.json(consumable);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createConsumable(req: Request, res: Response) {
    try {
      const parsed = insertLciConsumableSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const consumable = await lciConsumablesService.create(parsed.data);
      res.status(201).json(consumable);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateConsumable(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const consumable = await lciConsumablesService.update(id, req.body);
      if (!consumable) {
        return res.status(404).json({ error: "Consumable not found" });
      }
      res.json(consumable);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteConsumable(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const success = await lciConsumablesService.delete(id);
      if (!success) {
        return res.status(404).json({ error: "Consumable not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getConsumptionLogs(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const logs = await lciConsumablesService.getLogs(id);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async addConsumptionLog(req: Request, res: Response) {
    try {
      const consumableId = parseInt(req.params.id);
      const parsed = insertLciConsumptionLogSchema.safeParse({ ...req.body, consumableId });
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const log = await lciConsumablesService.addLog(parsed.data);
      res.status(201).json(log);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getConsumptionSummary(req: Request, res: Response) {
    try {
      const year = parseInt(req.params.year);
      const summary = await lciConsumablesService.getYearlySummary(year);
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async calculateProduction(req: Request, res: Response) {
    try {
      const year = parseInt(req.params.year);
      const data = await productionAdapter.getYearlyProduction(year);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getProductionSnapshots(req: Request, res: Response) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const snapshots = await lciDataService.getProductionSnapshots(year);
      res.json(snapshots);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createProductionSnapshot(req: Request, res: Response) {
    try {
      const parsed = insertLciProductionSnapshotSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const snapshot = await lciDataService.createProductionSnapshot(parsed.data);
      res.status(201).json(snapshot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async generateProductionFromApp(req: Request, res: Response) {
    try {
      const year = parseInt(req.params.year);
      const snapshots = await lciDataService.calculateProductionFromApp(year);
      
      const created = [];
      for (const snapshot of snapshots) {
        const result = await lciDataService.createProductionSnapshot(snapshot);
        created.push(result);
      }
      
      res.status(201).json({ created: created.length, snapshots: created });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getReports(req: Request, res: Response) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const reports = await lciDataService.getReports(year);
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getReportById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const report = await lciDataService.getReportById(id);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createReport(req: Request, res: Response) {
    try {
      const parsed = insertLciReportSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const report = await lciDataService.createReport(parsed.data);
      res.status(201).json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async generateReportData(req: Request, res: Response) {
    try {
      const year = parseInt(req.params.year);
      const data = await lciDataService.generateReportData(year);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async finalizeReport(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const report = await lciDataService.finalizeReport(id);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getFlupsyOverview(req: Request, res: Response) {
    try {
      const data = await flupsyAdapter.getFlupsyOverview();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getLotsInput(req: Request, res: Response) {
    try {
      const year = parseInt(req.params.year);
      const data = await lotsAdapter.getYearlyInput(year);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const lciController = new LciController();
