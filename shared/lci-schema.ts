import { pgTable, serial, varchar, text, integer, decimal, boolean, timestamp, date, jsonb, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const lciMaterials = pgTable("lci_materials", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  materialType: varchar("material_type", { length: 100 }),
  expectedLifeYears: decimal("expected_life_years", { precision: 5, scale: 2 }),
  disposalMethod: text("disposal_method"),
  quantity: integer("quantity").default(1),
  unit: varchar("unit", { length: 20 }).default("pc"),
  unitWeightKg: decimal("unit_weight_kg", { precision: 10, scale: 3 }),
  flupsyReference: varchar("flupsy_reference", { length: 100 }),
  installationDate: date("installation_date"),
  notes: text("notes"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const lciConsumables = pgTable("lci_consumables", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  ecoinventProcess: text("ecoinvent_process"),
  defaultAnnualAmount: decimal("default_annual_amount", { precision: 15, scale: 3 }),
  notes: text("notes"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lciConsumptionLogs = pgTable("lci_consumption_logs", {
  id: serial("id").primaryKey(),
  consumableId: integer("consumable_id").notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  amount: decimal("amount", { precision: 15, scale: 3 }).notNull(),
  source: varchar("source", { length: 50 }).default("manual"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by"),
});

export const lciProductionSnapshots = pgTable("lci_production_snapshots", {
  id: serial("id").primaryKey(),
  referenceYear: integer("reference_year").notNull(),
  referencePeriod: varchar("reference_period", { length: 50 }).notNull(),
  sizeCode: varchar("size_code", { length: 20 }),
  outputKg: decimal("output_kg", { precision: 15, scale: 3 }),
  outputPieces: bigint("output_pieces", { mode: "number" }),
  inputKg: decimal("input_kg", { precision: 15, scale: 3 }),
  inputPieces: bigint("input_pieces", { mode: "number" }),
  dataSource: varchar("data_source", { length: 50 }).default("calculated"),
  calculationNotes: text("calculation_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lciReports = pgTable("lci_reports", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  referenceYear: integer("reference_year").notNull(),
  status: varchar("status", { length: 20 }).default("draft"),
  excelPath: text("excel_path"),
  reportData: jsonb("report_data"),
  aiInsights: jsonb("ai_insights"),
  createdAt: timestamp("created_at").defaultNow(),
  finalizedAt: timestamp("finalized_at"),
  exportedAt: timestamp("exported_at"),
});

export const lciSettings = pgTable("lci_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: jsonb("value"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLciMaterialSchema = createInsertSchema(lciMaterials).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLciConsumableSchema = createInsertSchema(lciConsumables).omit({ id: true, createdAt: true });
export const insertLciConsumptionLogSchema = createInsertSchema(lciConsumptionLogs).omit({ id: true, createdAt: true });
export const insertLciProductionSnapshotSchema = createInsertSchema(lciProductionSnapshots).omit({ id: true, createdAt: true });
export const insertLciReportSchema = createInsertSchema(lciReports).omit({ id: true, createdAt: true, finalizedAt: true, exportedAt: true });
export const insertLciSettingSchema = createInsertSchema(lciSettings).omit({ id: true, updatedAt: true });

export type LciMaterial = typeof lciMaterials.$inferSelect;
export type InsertLciMaterial = z.infer<typeof insertLciMaterialSchema>;

export type LciConsumable = typeof lciConsumables.$inferSelect;
export type InsertLciConsumable = z.infer<typeof insertLciConsumableSchema>;

export type LciConsumptionLog = typeof lciConsumptionLogs.$inferSelect;
export type InsertLciConsumptionLog = z.infer<typeof insertLciConsumptionLogSchema>;

export type LciProductionSnapshot = typeof lciProductionSnapshots.$inferSelect;
export type InsertLciProductionSnapshot = z.infer<typeof insertLciProductionSnapshotSchema>;

export type LciReport = typeof lciReports.$inferSelect;
export type InsertLciReport = z.infer<typeof insertLciReportSchema>;

export type LciSetting = typeof lciSettings.$inferSelect;
export type InsertLciSetting = z.infer<typeof insertLciSettingSchema>;
