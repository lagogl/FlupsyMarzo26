import { Router, type Request, type Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db as defaultDb } from "../../../db";
import { commercialInputSchema, commercialScenarios, commercialSummaries, type CommercialInput } from "../../../../shared/commercial-availability";
import { requireAuth } from "../../system/auth";
import { getCommercialInputs as defaultInputs, replanInput, simulateCommercial as defaultSimulate } from "./service";

export function createCommercialRouter(overrides: Partial<{
  db: typeof defaultDb;
  getInputs: typeof defaultInputs;
  simulate: typeof defaultSimulate;
}> = {}) {
const db = overrides.db ?? defaultDb;
const getCommercialInputs = overrides.getInputs ?? defaultInputs;
const simulateCommercial = overrides.simulate ?? defaultSimulate;
const router = Router();
router.use(requireAuth);
const owner = (req: Request) => String(req.session.user!.id);
function id(req: Request) {
  const value = Number(req.params.id);
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error("ID non valido");
  return value;
}
const scenarioScope = (req: Request) => and(eq(commercialScenarios.id, id(req)), eq(commercialScenarios.ownerId, owner(req)));
const summaryScope = (req: Request) => and(eq(commercialSummaries.id, id(req)), eq(commercialSummaries.ownerId, owner(req)));
function errorResponse(res: Response, error: unknown) {
  const e = error as { code?: string; message?: string; name?: string };
  if (e.name === "CommercialBusyError") return res.status(503).json({ message: e.message });
  if (e.code === "42P01") return res.status(503).json({ message: "Archivio non disponibile: applicare la migrazione add_commercial_availability prima di salvare." });
  if (e.code || /password|connection|connect |ECONN|postgres|neon|sql|query|relation|column/i.test(e.message ?? "")) return res.status(503).json({ message: "Fonte dati non disponibile: impossibile elaborare in sicurezza." });
  if (e.name === "ZodError") return res.status(400).json({ message: "Parametri commerciali non validi" });
  return res.status(422).json({ message: e.message || "Calcolo commerciale non riuscito" });
}
const route = (handler: (req: Request, res: Response) => Promise<unknown>) => async (req: Request, res: Response) => {
  try { await handler(req, res); } catch (e) { errorResponse(res, e); }
};
async function validatedInput(body: unknown): Promise<CommercialInput> {
  const input = commercialInputSchema.parse(body);
  const catalog = await getCommercialInputs();
  const allowed = new Set(catalog.sizes.map(s => s.id));
  if ([...input.selectedSizeIds, ...input.sales.map(s => s.sizeId)].some(id => !allowed.has(id))) throw new Error("Taglia commerciale non ammessa");
  return input;
}
router.get("/inputs", route(async (_req, res) => res.json(await getCommercialInputs())));
router.post("/simulate", route(async (req, res) => {
  const input = commercialInputSchema.parse(req.body);
  res.json(await simulateCommercial(input, owner(req)));
}));
router.get("/scenarios", route(async (req, res) => {
  res.json(await db.select().from(commercialScenarios).where(eq(commercialScenarios.ownerId, owner(req))).orderBy(desc(commercialScenarios.updatedAt)).limit(200));
}));
router.get("/scenarios/:id", route(async (req, res) => {
  const [row] = await db.select().from(commercialScenarios).where(scenarioScope(req));
  return row ? res.json(row) : res.status(404).json({ message: "Scenario non trovato" });
}));
router.post("/scenarios", route(async (req, res) => {
  const input = await validatedInput(req.body);
  const [row] = await db.insert(commercialScenarios).values({ ownerId: owner(req), name: input.name, input }).returning();
  res.status(201).json(row);
}));
router.put("/scenarios/:id", route(async (req, res) => {
  const input = await validatedInput(req.body);
  const [row] = await db.update(commercialScenarios).set({ input, name: input.name, updatedAt: new Date() }).where(scenarioScope(req)).returning();
  return row ? res.json(row) : res.status(404).json({ message: "Scenario non trovato" });
}));
router.delete("/scenarios/:id", route(async (req, res) => {
  const [row] = await db.delete(commercialScenarios).where(scenarioScope(req)).returning({ id: commercialScenarios.id });
  return row ? res.status(204).end() : res.status(404).json({ message: "Scenario non trovato" });
}));
for (const action of ["duplicate", "replan"]) router.post(`/scenarios/:id/${action}`, route(async (req, res) => {
  const [source] = await db.select().from(commercialScenarios).where(scenarioScope(req));
  if (!source) return res.status(404).json({ message: "Scenario non trovato" });
  const input = action === "replan" ? replanInput(source.input)
    : { ...source.input, name: `${source.name.slice(0, 110)} (copia)` };
  const [row] = await db.insert(commercialScenarios).values({ ownerId: owner(req), name: input.name, input }).returning();
  res.status(201).json(row);
}));
router.get("/summaries", route(async (req, res) => {
  res.json(await db.select().from(commercialSummaries).where(eq(commercialSummaries.ownerId, owner(req))).orderBy(desc(commercialSummaries.createdAt)).limit(200));
}));
router.get("/summaries/:id", route(async (req, res) => {
  const [row] = await db.select().from(commercialSummaries).where(summaryScope(req));
  return row ? res.json(row) : res.status(404).json({ message: "Riepilogo non trovato" });
}));
router.post("/summaries", route(async (req, res) => {
  // Ignore any client-supplied result/hash/date: only a fresh server simulation
  // is allowed into the append-only summary archive.
  const input = await validatedInput(req.body);
  const snapshot = await simulateCommercial(input, owner(req), true);
  if (!snapshot.valid) return res.status(422).json({ message: "Piano non valido: quantità richieste non soddisfatte. Nessun riepilogo salvato." });
  const [row] = await db.insert(commercialSummaries).values({ ownerId: owner(req), name: input.name, snapshot }).returning();
  res.status(201).json(row);
}));
return router;
}
export default createCommercialRouter();