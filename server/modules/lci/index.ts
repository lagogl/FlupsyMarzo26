import { Express } from "express";
import lciRoutes from "./lci.routes";
import { lciDataService } from "./services/lci-data.service";

export async function registerLciModule(app: Express): Promise<void> {
  const isEnabled = await lciDataService.isModuleEnabled();
  
  if (!isEnabled) {
    console.log("[LCI Module] Module is disabled via settings");
    return;
  }

  app.use("/api/lci", lciRoutes);
  
  console.log("[LCI Module] Registered successfully at /api/lci");
}

export { lciDataService } from "./services/lci-data.service";
export { lciMaterialsService } from "./services/lci-materials.service";
export { lciConsumablesService } from "./services/lci-consumables.service";
export { productionAdapter } from "./adapters/production-adapter";
export { lotsAdapter } from "./adapters/lots-adapter";
export { flupsyAdapter } from "./adapters/flupsy-adapter";
