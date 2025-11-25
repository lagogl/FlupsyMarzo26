import type { LciMaterial, LciConsumable, LciConsumptionLog, LciProductionSnapshot, LciReport, LciSetting } from "@shared/lci-schema";

export interface LciMaterialFilter {
  category?: string;
  materialType?: string;
  active?: boolean;
  flupsyReference?: string;
}

export interface LciConsumableFilter {
  category?: string;
  active?: boolean;
}

export interface LciProductionData {
  referenceYear: number;
  referencePeriod: string;
  sizeCode: string;
  outputKg: number;
  outputPieces: number;
  inputKg: number;
  inputPieces: number;
}

export interface LciConsumptionSummary {
  consumableId: number;
  consumableName: string;
  category: string;
  unit: string;
  totalAmount: number;
  periodStart: string;
  periodEnd: string;
}

export interface LciReportData {
  companyInfo: {
    name: string;
    location: string;
    coordinates: string;
    facilityType: string;
    facilitySizeM2: number;
  };
  referenceYear: number;
  productionData: LciProductionData[];
  materials: {
    category: string;
    items: LciMaterial[];
    totalWeightKg: number;
  }[];
  consumables: {
    category: string;
    items: LciConsumptionSummary[];
  }[];
}

export interface LciExportOptions {
  format: 'excel' | 'json';
  includeAiInsights?: boolean;
  targetSize?: string;
}

export type LciMaterialCategory = 
  | 'FLUPSY'
  | 'Raceway'
  | 'Filtri'
  | 'Pompe'
  | 'Illuminazione'
  | 'Strutture'
  | 'Elettrico'
  | 'Altro';

export type LciConsumableCategory = 
  | 'Energia'
  | 'Carburante'
  | 'Chimico'
  | 'Acqua'
  | 'Altro';

export type LciReportStatus = 'draft' | 'final' | 'exported';

export interface ProductionAdapterData {
  totalOutputKg: number;
  totalOutputPieces: number;
  bySize: {
    sizeCode: string;
    outputKg: number;
    outputPieces: number;
  }[];
}

export interface LotsAdapterData {
  totalInputKg: number;
  totalInputPieces: number;
  byLot: {
    lotCode: string;
    inputKg: number;
    inputPieces: number;
    supplier: string;
  }[];
}

export interface FlupsyAdapterData {
  totalFlupsy: number;
  activeFlupsySystems: string[];
  totalBaskets: number;
  averageCapacity: number;
}
