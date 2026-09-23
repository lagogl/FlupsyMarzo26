import { Router, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "../../../db";
import { salesScenarios, scenarioInputSchema } from "../../../../shared/sales-scenarios";
import { getInputs, simulate } from "./service";

const router = Router();
let calculating = false;
const errorResponse = (res: Response, error: unknown) => {
  const err = error as { code?: string; message?: string };
  if (err.code === "42P01") return res.status(503).json({ message: "Tabella scenari non ancora disponibile. Applicare la migrazione add_sales_scenarios prima di salvare o caricare scenari." });
  // Database diagnostics can contain connection details: never return raw DB errors.
  if (err.code || /password|connection|connect |ECONN|postgres|neon/i.test(err.message ?? "")) {
    return res.status(503).json({ message: "Fonte dati non disponibile. Impossibile calcolare o salvare lo scenario in sicurezza." });
  }
  return res.status(422).json({ message: err.message || "Impossibile elaborare lo scenario" });
};
router.get("/inputs", async (_req, res) => {
  try { res.json(await getInputs()); } catch (e) { errorResponse(res, e); }
});
for (const path of ["/simulate", "/propose"]) {
  router.post(path, async (req, res) => {
    const parsed = scenarioInputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Parametri scenario non validi", errors: parsed.error.flatten() });
    if (calculating) return res.status(429).json({ message: "Un calcolo è già in corso. Riprovare tra qualche secondo." });
    calculating = true;
    try { res.json(await simulate(parsed.data, path === "/propose")); }
    catch (e) { errorResponse(res, e); }
    finally { calculating = false; }
  });
}
router.get("/", async (_req, res) => {
  try { res.json(await db.select().from(salesScenarios).orderBy(desc(salesScenarios.updatedAt)).limit(200)); }
  catch (e) { errorResponse(res, e); }
});
router.post("/", async (req, res) => {
  const parsed = scenarioInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Parametri scenario non validi", errors: parsed.error.flatten() });
  try {
    const [row] = await db.insert(salesScenarios).values({ name: parsed.data.name, input: parsed.data }).returning();
    res.status(201).json(row);
  } catch (e) { errorResponse(res, e); }
});
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const parsed = scenarioInputSchema.safeParse(req.body);
  if (!Number.isSafeInteger(id) || id <= 0 || !parsed.success) return res.status(400).json({ message: "ID o parametri scenario non validi" });
  try {
    const [row] = await db.update(salesScenarios).set({ name: parsed.data.name, input: parsed.data, updatedAt: new Date() }).where(eq(salesScenarios.id, id)).returning();
    if (!row) return res.status(404).json({ message: "Scenario non trovato" });
    res.json(row);
  } catch (e) { errorResponse(res, e); }
});
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ message: "ID non valido" });
  try {
    const [row] = await db.delete(salesScenarios).where(eq(salesScenarios.id, id)).returning({ id: salesScenarios.id });
    if (!row) return res.status(404).json({ message: "Scenario non trovato" });
    res.status(204).end();
  } catch (e) { errorResponse(res, e); }
});
export default router;