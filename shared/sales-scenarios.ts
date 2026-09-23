import { z } from "zod";
import { pgTable, serial, text, jsonb, timestamp } from "drizzle-orm/pg-core";

const month = z.object({ year: z.number().int().min(2020).max(2200), month: z.number().int().min(1).max(12) });
export const scenarioSaleSchema = month.extend({
  id: z.string().min(1).max(100).refine(v => !v.startsWith("__"), "Identificativo riservato"),
  sizeId: z.number().int().positive(),
  quantity: z.number().int().min(0).max(2_000_000_000),
  pricePerThousand: z.number().min(0).max(1_000_000).nullable(),
  paymentDelayMonths: z.number().int().min(0).max(24),
});
export const scenarioInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  startYear: z.number().int().min(2020).max(2200),
  startMonth: z.number().int().min(1).max(12),
  horizon: z.number().int().min(1).max(24).default(12),
  growthFactor: z.number().min(0).max(2).default(1),
  prudentGrowthFactor: z.number().min(0).max(2).default(0.8),
  mortalityMultiplier: z.number().min(0).max(5).default(1),
  prudentMortalityMultiplier: z.number().min(0).max(5).default(1.25),
  prudentHatcheryFactor: z.number().min(0).max(1).default(0.8),
  // Optional for backward compatibility: absence means every allowed
  // commercial size. An explicit selection must never be empty.
  selectedSizeIds: z.array(z.number().int().positive()).min(1, "Selezionare almeno una taglia commerciale").max(9).optional(),
  sales: z.array(scenarioSaleSchema).max(100).default([]),
  sandNursery: z.array(month.extend({ quantity: z.number().int().min(0).max(2_000_000_000) })).max(24).default([]),
  cashGoal: z.number().min(0).max(1_000_000_000).default(0),
  cashDeadline: month,
  proposalPrices: z.array(z.object({ sizeId: z.number().int().positive(), pricePerThousand: z.number().positive().max(1_000_000), paymentDelayMonths: z.number().int().min(0).max(24) })).max(40).default([]),
}).superRefine((v, ctx) => {
  const first = v.startYear * 12 + v.startMonth - 1;
  for (const row of [...v.sales, ...v.sandNursery, v.cashDeadline]) {
    const n = row.year * 12 + row.month - 1;
    if (n < first || n >= first + v.horizon) ctx.addIssue({ code: "custom", message: "Date fuori dall'orizzonte dello scenario" });
  }
  if (new Set(v.sales.map(s => s.id)).size !== v.sales.length) ctx.addIssue({ code: "custom", message: "Identificativi vendite duplicati" });
  if (v.selectedSizeIds && new Set(v.selectedSizeIds).size !== v.selectedSizeIds.length) ctx.addIssue({ code: "custom", message: "Taglie commerciali selezionate duplicate" });
  if (new Set(v.proposalPrices.map(s => s.sizeId)).size !== v.proposalPrices.length) ctx.addIssue({ code: "custom", message: "Prezzi proposta duplicati per la stessa taglia" });
  if (v.prudentGrowthFactor > v.growthFactor || v.prudentMortalityMultiplier < v.mortalityMultiplier) ctx.addIssue({ code: "custom", message: "Le ipotesi prudenziali devono essere più cautelative di quelle attese" });
});
export type ScenarioInput = z.infer<typeof scenarioInputSchema>;
export type ScenarioSale = z.infer<typeof scenarioSaleSchema>;
export interface ScenarioMonth {
  year: number; month: number;
  availableBySize: Record<string, number>;
  ordersRequested: number; ordersFulfilled: number; orderShortfall: number;
  orderCommitment?: {
    animals: number;
    valueEuro: number | null;
    valuedAnimals: number;
    missingValueAnimals: number;
  };
  salesRequested: number; salesApplied: number; sandNurseryApplied: number;
  revenue: number; receipts: number; remainingAnimals: number;
}
export interface ScenarioProjection {
  months: ScenarioMonth[];
  totalRevenue: number; totalReceipts: number; receiptsByDeadline: number;
  finalStock: number; totalOrderShortfall: number; unfulfilledSales: number;
  goalReached: boolean;
}
export interface ScenarioResult {
  expected: ScenarioProjection; prudent: ScenarioProjection;
  warnings: string[]; generatedAt: string;
  availabilityIsAlternative: true;
}
export interface ScenarioProposal extends ScenarioResult {
  proposedSales: ScenarioSale[];
  method: string;
}
export interface ScenarioInputs {
  sizes: { id: number; code: string; name: string; pricePerThousand: number | null }[];
  defaults: ScenarioInput;
  warnings: string[];
}
export const salesScenarios = pgTable("sales_scenarios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  input: jsonb("input").$type<ScenarioInput>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export type SavedScenario = typeof salesScenarios.$inferSelect;