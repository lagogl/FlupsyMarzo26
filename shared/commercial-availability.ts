import { z } from "zod";
import { pgTable, serial, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import type { ScenarioMonth } from "./sales-scenarios";

const month = z.object({ year: z.number().int().min(2020).max(2200), month: z.number().int().min(1).max(12) });
export const commercialSaleSchema = month.extend({
  id: z.string().min(1).max(100).refine(s => !s.startsWith("__")),
  sizeId: z.number().int().positive(), quantity: z.number().int().positive().max(2_000_000_000),
  day: z.number().int().min(1).max(31).optional(),
});
export const commercialInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  startYear: z.number().int().min(2020).max(2200), startMonth: z.number().int().min(1).max(12),
  horizon: z.union([z.literal(6), z.literal(12), z.literal(24)]).default(6),
  selectedSizeIds: z.array(z.number().int().positive()).min(1).max(9),
  includeOrders: z.boolean().default(true), includeHatchery: z.boolean().default(false),
  growthFactor: z.number().min(0).max(2).default(1),
  mortalityMultiplier: z.number().min(0).max(5).default(1),
  sales: z.array(commercialSaleSchema).max(100).default([]),
  /** Replacement FUTURE residual arrivals, not gross forecasts; never persisted operationally. */
  hatcheryOverrides: z.array(month.extend({ quantity: z.number().int().min(0).max(2_000_000_000) })).max(60).default([]),
}).superRefine((v, ctx) => {
  const first = v.startYear * 12 + v.startMonth - 1;
  for (const s of [...v.sales, ...v.hatcheryOverrides]) {
    const n = s.year * 12 + s.month - 1;
    if (n < first || n >= first + v.horizon) ctx.addIssue({ code: "custom", message: "Data fuori orizzonte" });
    if ("day" in s && typeof s.day === "number" && s.day > new Date(s.year, s.month, 0).getDate()) ctx.addIssue({ code: "custom", message: "Giorno non valido" });
  }
  for (const keys of [v.sales.map(s => s.id), v.selectedSizeIds, v.hatcheryOverrides.map(s => `${s.year}-${s.month}`)]) {
    if (new Set<string | number>(keys).size !== keys.length) ctx.addIssue({ code: "custom", message: "Identificativi duplicati" });
  }
});
export type CommercialInput = z.infer<typeof commercialInputSchema>;
export type CommercialSale = z.infer<typeof commercialSaleSchema>;
export interface CommercialPlanRow extends CommercialSale {
  day: number; date: string; acceptedQuantity: number; shortfall: number;
}
export interface CommercialCellShortfall {
  /** Unfulfilled acquired orders, attributed to their requested size/month. */
  orders: number;
  /** Requested simulated sales minus accepted quantities, at their size/month. */
  sales: number;
}
export interface CommercialMonth extends ScenarioMonth {
  /** Optional only for older frozen snapshots: missing is NOT certified zero. */
  shortfallsBySize?: Record<string, CommercialCellShortfall>;
}
export interface CommercialResult {
  sizes: { id: number; code: string; name: string }[];
  input: CommercialInput; inputHash: string; referenceDate: string; generatedAt: string;
  availabilityIsAlternative: true; valid: boolean;
  months: CommercialMonth[]; baselineMonths: CommercialMonth[];
  plan: CommercialPlanRow[];
  totalRequested: number; totalAccepted: number;
  baselineOrderShortfall: number; orderShortfall: number;
  hatcheryDependent: boolean; warnings: string[];
  calculationMs: number;
}
export interface CommercialInputs {
  sizes: { id: number; code: string; name: string }[];
  defaults: CommercialInput; referenceDate: string; warnings: string[];
}
export const commercialScenarios = pgTable("commercial_availability_scenarios", {
  id: serial("id").primaryKey(), ownerId: text("owner_id").notNull(), name: text("name").notNull(),
  input: jsonb("input").$type<CommercialInput>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(), updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, table => ({ owner: index("commercial_availability_scenarios_owner_idx").on(table.ownerId) }));
export const commercialSummaries = pgTable("commercial_availability_summaries", {
  id: serial("id").primaryKey(), ownerId: text("owner_id").notNull(), name: text("name").notNull(),
  snapshot: jsonb("snapshot").$type<CommercialResult>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => ({ owner: index("commercial_availability_summaries_owner_idx").on(table.ownerId) }));
export type SavedCommercialScenario = typeof commercialScenarios.$inferSelect;
export type FrozenCommercialSummary = typeof commercialSummaries.$inferSelect;
// Authenticated API: GET /inputs; POST /simulate (CommercialInput).
// GET/POST /scenarios; GET/PUT/DELETE /scenarios/:id (CommercialInput).
// POST /scenarios/:id/duplicate; POST /scenarios/:id/replan.
// GET/POST /summaries; GET /summaries/:id. POST accepts CommercialInput,
// revalidates server-side and freezes the result; snapshots cannot be edited.