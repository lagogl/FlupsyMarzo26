import { Router, Request, Response } from "express";
import ExcelJS from "exceljs";
import {
  computeInventoryIMM,
  computeCycleIMM,
  DEFAULT_IMM_CONFIG,
  saveDailySnapshot,
  getSnapshotHistory,
  computeOrdersCoverage,
  loadPersistedConfig,
  savePersistedConfig,
  IMMConfig,
} from "./imm.service";

export const immRoutes = Router();

function parseConfig(req: Request) {
  const q = req.query;
  const cfg: any = {};
  if (q.targetSizeCode && typeof q.targetSizeCode === "string") cfg.targetSizeCode = q.targetSizeCode;
  if (q.horizonDays) cfg.horizonDays = Number(q.horizonDays);
  if (q.weightSize) cfg.weightSize = Number(q.weightSize);
  if (q.weightTime) cfg.weightTime = Number(q.weightTime);
  if (q.weightQuality) cfg.weightQuality = Number(q.weightQuality);
  if (q.weightReliability) cfg.weightReliability = Number(q.weightReliability);
  if (q.fallbackSgrDaily) cfg.fallbackSgrDaily = Number(q.fallbackSgrDaily);
  if (q.baselineMortalityPct) cfg.baselineMortalityPct = Number(q.baselineMortalityPct);
  if (q.maxMortalityPct) cfg.maxMortalityPct = Number(q.maxMortalityPct);
  return cfg;
}

immRoutes.get("/inventory", async (req: Request, res: Response) => {
  try {
    const cfg = parseConfig(req);
    const data = await computeInventoryIMM(cfg);
    res.json({ success: true, data });
  } catch (e: any) {
    console.error("IMM inventory error:", e);
    res.status(500).json({ success: false, message: e?.message || "Errore calcolo IMM" });
  }
});

immRoutes.get("/cycle/:cycleId", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.cycleId);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: "cycleId non valido" });
    const cfg = parseConfig(req);
    const data = await computeCycleIMM(id, cfg);
    if (!data) return res.status(404).json({ success: false, message: "Ciclo non trovato o non attivo" });
    res.json({ success: true, data });
  } catch (e: any) {
    console.error("IMM cycle error:", e);
    res.status(500).json({ success: false, message: e?.message || "Errore calcolo IMM ciclo" });
  }
});

immRoutes.get("/config/defaults", (_req: Request, res: Response) => {
  res.json({ success: true, data: DEFAULT_IMM_CONFIG });
});

// Configurazione persistita (singleton)
immRoutes.get("/config", async (_req: Request, res: Response) => {
  try {
    const data = await loadPersistedConfig();
    res.json({ success: true, data });
  } catch (e: any) {
    console.error("IMM config get error:", e);
    res.status(500).json({ success: false, message: e?.message || "Errore lettura config" });
  }
});

immRoutes.put("/config", async (req: Request, res: Response) => {
  try {
    const allowed: (keyof IMMConfig)[] = [
      "targetSizeCode", "horizonDays", "weightSize", "weightTime",
      "weightQuality", "weightReliability", "fallbackSgrDaily",
      "baselineMortalityPct", "maxMortalityPct",
    ];
    const patch: Partial<IMMConfig> = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined && req.body[k] !== null) {
        (patch as any)[k] = k === "targetSizeCode" ? String(req.body[k]) : Number(req.body[k]);
      }
    }
    // Validazione minima
    const numericKeys: (keyof IMMConfig)[] = ["horizonDays", "weightSize", "weightTime",
      "weightQuality", "weightReliability", "fallbackSgrDaily", "baselineMortalityPct", "maxMortalityPct"];
    for (const k of numericKeys) {
      if (patch[k] !== undefined && !Number.isFinite(patch[k] as number)) {
        return res.status(400).json({ success: false, message: `Valore non valido per ${k}` });
      }
    }
    const data = await savePersistedConfig(patch);
    res.json({ success: true, data });
  } catch (e: any) {
    console.error("IMM config put error:", e);
    res.status(500).json({ success: false, message: e?.message || "Errore salvataggio config" });
  }
});

// Copertura ordini per taglia
immRoutes.get("/orders-coverage", async (req: Request, res: Response) => {
  try {
    const cfg = parseConfig(req);
    const data = await computeOrdersCoverage(cfg);
    res.json({ success: true, data });
  } catch (e: any) {
    console.error("IMM orders-coverage error:", e);
    res.status(500).json({ success: false, message: e?.message || "Errore copertura ordini" });
  }
});

// Storia snapshot (per trend chart)
immRoutes.get("/history", async (req: Request, res: Response) => {
  try {
    const scope = typeof req.query.scope === "string" ? req.query.scope : "global";
    const scopeId = req.query.scopeId ? Number(req.query.scopeId) : null;
    const targetSizeCode = typeof req.query.targetSizeCode === "string" ? req.query.targetSizeCode : undefined;
    const fromDate = typeof req.query.fromDate === "string" ? req.query.fromDate : undefined;
    const toDate = typeof req.query.toDate === "string" ? req.query.toDate : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const data = await getSnapshotHistory({ scope, scopeId, targetSizeCode, fromDate, toDate, limit });
    res.json({ success: true, data });
  } catch (e: any) {
    console.error("IMM history error:", e);
    res.status(500).json({ success: false, message: e?.message || "Errore lettura storico IMM" });
  }
});

// Export Excel completo del report IMM
immRoutes.get("/export", async (req: Request, res: Response) => {
  try {
    const cfg = parseConfig(req);
    const [inv, cov] = await Promise.all([
      computeInventoryIMM(cfg),
      computeOrdersCoverage(cfg),
    ]);

    const wb = new ExcelJS.Workbook();
    wb.creator = "FLUPSY IMM";
    wb.created = new Date();

    const fmtEuro = '#,##0.00 "€"';
    const fmtPct = '0.0';
    const fmtInt = '#,##0';

    // Foglio 1: Riepilogo
    const s1 = wb.addWorksheet("Riepilogo");
    s1.columns = [
      { header: "Parametro", key: "k", width: 32 },
      { header: "Valore", key: "v", width: 24 },
    ];
    s1.getRow(1).font = { bold: true };
    const t = inv.totals;
    s1.addRows([
      { k: "Data report", v: new Date().toISOString().slice(0, 10) },
      { k: "Taglia target", v: inv.config.targetSizeCode },
      { k: "Orizzonte (giorni)", v: inv.config.horizonDays },
      { k: "Cicli attivi inclusi", v: t.totalCycles },
      { k: "Animali totali", v: t.totalAnimals },
      { k: "IMM globale", v: t.immGlobal },
      { k: "Componente Size", v: t.immSize },
      { k: "Componente Time", v: t.immTime },
      { k: "Componente Quality", v: t.immQuality },
      { k: "Componente Reliability", v: t.immReliability },
      { k: "Valore attuale (€)", v: t.valoreAttuale },
      { k: "Valore a target (€)", v: t.valorePotenziale },
      { k: "Valore maturo (€)", v: t.valoreMaturo },
    ]);

    // Foglio 2: Distribuzione
    const s2 = wb.addWorksheet("Distribuzione");
    s2.columns = [
      { header: "Fascia IMM", key: "range", width: 14 },
      { header: "Animali", key: "animals", width: 16, style: { numFmt: fmtInt } },
      { header: "Cicli", key: "cycles", width: 8 },
      { header: "% sul totale", key: "pct", width: 14, style: { numFmt: fmtPct } },
    ];
    s2.getRow(1).font = { bold: true };
    inv.distribution.forEach((b) => s2.addRow({
      range: b.range, animals: b.animalCount, cycles: b.cycleCount, pct: b.pctOfTotal,
    }));

    // Foglio 3: Per FLUPSY
    const s3 = wb.addWorksheet("Per FLUPSY");
    s3.columns = [
      { header: "FLUPSY", key: "name", width: 28 },
      { header: "Cicli", key: "cycles", width: 8 },
      { header: "Animali", key: "animals", width: 16, style: { numFmt: fmtInt } },
      { header: "IMM", key: "imm", width: 8, style: { numFmt: fmtPct } },
      { header: "Size", key: "s", width: 8, style: { numFmt: fmtPct } },
      { header: "Time", key: "ti", width: 8, style: { numFmt: fmtPct } },
      { header: "Quality", key: "q", width: 10, style: { numFmt: fmtPct } },
      { header: "Reliability", key: "r", width: 12, style: { numFmt: fmtPct } },
      { header: "Val. attuale", key: "va", width: 16, style: { numFmt: fmtEuro } },
      { header: "Val. target", key: "vp", width: 16, style: { numFmt: fmtEuro } },
      { header: "Val. maturo", key: "vm", width: 16, style: { numFmt: fmtEuro } },
    ];
    s3.getRow(1).font = { bold: true };
    inv.byFlupsy.forEach((f) => s3.addRow({
      name: f.scopeName, cycles: f.cycleCount, animals: f.animalCount,
      imm: f.imm, s: f.immSize, ti: f.immTime, q: f.immQuality, r: f.immReliability,
      va: f.valoreAttuale, vp: f.valorePotenziale, vm: f.valoreMaturo,
    }));

    // Foglio 4: Per Lotto
    const s4 = wb.addWorksheet("Per Lotto");
    s4.columns = s3.columns.map((c) => ({ ...c }));
    s4.getColumn(1).header = "Lotto";
    s4.getRow(1).font = { bold: true };
    inv.byLot.forEach((l) => s4.addRow({
      name: l.scopeName, cycles: l.cycleCount, animals: l.animalCount,
      imm: l.imm, s: l.immSize, ti: l.immTime, q: l.immQuality, r: l.immReliability,
      va: l.valoreAttuale, vp: l.valorePotenziale, vm: l.valoreMaturo,
    }));

    // Foglio 5: Cicli attivi
    const s5 = wb.addWorksheet("Cicli");
    s5.columns = [
      { header: "Ciclo", key: "id", width: 8 },
      { header: "FLUPSY", key: "f", width: 24 },
      { header: "Cesta #", key: "b", width: 10 },
      { header: "Taglia", key: "t", width: 10 },
      { header: "An/kg", key: "apk", width: 12, style: { numFmt: fmtInt } },
      { header: "Animali", key: "an", width: 14, style: { numFmt: fmtInt } },
      { header: "Qualità", key: "q", width: 10 },
      { header: "Mort.%", key: "m", width: 10, style: { numFmt: fmtPct } },
      { header: "Gg→target", key: "gg", width: 12 },
      { header: "Size", key: "is", width: 8, style: { numFmt: fmtPct } },
      { header: "Time", key: "it", width: 8, style: { numFmt: fmtPct } },
      { header: "Quality", key: "iq", width: 10, style: { numFmt: fmtPct } },
      { header: "Reliability", key: "ir", width: 12, style: { numFmt: fmtPct } },
      { header: "IMM", key: "imm", width: 8, style: { numFmt: fmtPct } },
      { header: "Val. attuale (€)", key: "va", width: 16, style: { numFmt: fmtEuro } },
      { header: "Val. target (€)", key: "vp", width: 16, style: { numFmt: fmtEuro } },
      { header: "Val. maturo (€)", key: "vm", width: 16, style: { numFmt: fmtEuro } },
    ];
    s5.getRow(1).font = { bold: true };
    inv.cycles.forEach((c) => s5.addRow({
      id: c.cycleId, f: c.flupsyName, b: c.physicalNumber,
      t: c.currSizeCode ?? "-", apk: c.currApk, an: c.currAnimalCount,
      q: c.qualityClass ?? "n/d", m: c.cumulativeMortalityPct,
      gg: c.daysRemaining == null ? "∞" : (c.daysRemaining <= 0 ? "pronto" : Math.round(c.daysRemaining)),
      is: c.components.immSize, it: c.components.immTime,
      iq: c.components.immQuality, ir: c.components.immReliability,
      imm: c.imm, va: c.valoreAttuale, vp: c.valorePotenziale, vm: c.valoreMaturo,
    }));

    // Foglio 6: Copertura ordini
    const s6 = wb.addWorksheet("Copertura ordini");
    s6.columns = [
      { header: "Taglia", key: "size", width: 12 },
      { header: "Domanda", key: "d", width: 16, style: { numFmt: fmtInt } },
      { header: "Offerta", key: "s", width: 16, style: { numFmt: fmtInt } },
      { header: "Pronti (IMM≥75)", key: "m", width: 18, style: { numFmt: fmtInt } },
      { header: "Gap", key: "g", width: 16, style: { numFmt: fmtInt } },
      { header: "Copertura %", key: "c", width: 14, style: { numFmt: fmtPct } },
      { header: "€/animale", key: "p", width: 14 },
      { header: "Valore domanda (€)", key: "v", width: 18, style: { numFmt: fmtEuro } },
    ];
    s6.getRow(1).font = { bold: true };
    cov.rows.forEach((r) => s6.addRow({
      size: r.sizeCode, d: r.demand, s: r.supply, m: r.matureSupply,
      g: r.gap, c: r.coverage, p: r.pricePerAnimal ?? "-", v: r.demandValue,
    }));

    const filename = `IMM_${inv.config.targetSizeCode}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (e: any) {
    console.error("IMM export error:", e);
    res.status(500).json({ success: false, message: e?.message || "Errore export Excel" });
  }
});

// Trigger manuale snapshot (admin / scheduler)
immRoutes.post("/snapshot", async (req: Request, res: Response) => {
  try {
    const cfg = parseConfig(req);
    const date = typeof req.query.date === "string" ? req.query.date : undefined;
    const out = await saveDailySnapshot(cfg, date);
    res.json({ success: true, ...out });
  } catch (e: any) {
    console.error("IMM snapshot error:", e);
    res.status(500).json({ success: false, message: e?.message || "Errore snapshot IMM" });
  }
});
