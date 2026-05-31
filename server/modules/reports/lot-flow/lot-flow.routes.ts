/**
 * Modulo report "Flusso animali per tappe"
 * Ricostruisce i passaggi degli animali tra i contenitori
 * (raceway, bins, flupsy, mini-flupsy) a partire dal registro lotti.
 *
 * Fonte autorevole dei passaggi:
 *  - per le VAGLIATURE: selections.origin_flupsy_id / destination_flupsy_id
 *  - per i TRASFERIMENTI diretti: ciclo sorgente/destinazione -> cesta -> flupsy
 * Le due fonti vengono unite con COALESCE (prima la vagliatura, poi il ciclo).
 */
import { Router, Request, Response } from "express";
import ExcelJS from "exceljs";
import { sendError } from "../../../utils/error-handler";
import { pool } from "../../../db";

export const lotFlowRoutes = Router();

const CATS = ["RACEWAY", "BINS", "FLUPSY", "MINI FLUPSY", "(altro)"];

// Classificazione del contenitore in base al nome del FLUPSY.
const CATEGORY_SQL = (col: string) => `CASE
  WHEN ${col} ILIKE '%raceway%' THEN 'RACEWAY'
  WHEN ${col} ILIKE '%bins%' THEN 'BINS'
  WHEN ${col} ILIKE '%mini flupsy%' THEN 'MINI FLUPSY'
  WHEN ${col} ILIKE '%flupsy%' THEN 'FLUPSY'
  ELSE '(altro)' END`;

interface FlowRow {
  origine: string;
  destinazione: string;
  eventi: number;
  animali: number;
}

interface FlowParams {
  from: string;
  to: string;
  suppliers: string[] | "all";
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Neutralizza l'injection di formule in Excel: i valori testuali che iniziano
// con =, +, -, @ (o tab/CR/LF) vengono prefissati con un apice così Excel li
// tratta come testo letterale e non come formula.
function safeCell(v: string): string {
  return /^[=+\-@\t\r\n]/.test(v) ? `'${v}` : v;
}

function parseParams(req: Request): { params: FlowParams; error?: string } {
  const from = (req.query.from as string) || "2025-12-01";
  const to = (req.query.to as string) || new Date().toISOString().slice(0, 10);
  if (!ISO_DATE.test(from) || !ISO_DATE.test(to)) {
    return { params: { from, to, suppliers: "all" }, error: "Parametri 'from' e 'to' devono essere date in formato YYYY-MM-DD" };
  }
  const suppliersRaw = ((req.query.suppliers as string) || "roem,ecotapes,zeeland")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const noFilter = suppliersRaw.length === 0 || suppliersRaw.includes("all");
  return { params: { from, to, suppliers: noFilter ? "all" : suppliersRaw } };
}

async function computeLotFlow(p: FlowParams): Promise<FlowRow[]> {
  const queryParams: any[] = [p.from, p.to];
  let supplierClause = "";
  if (p.suppliers !== "all") {
    queryParams.push(p.suppliers.map((s) => `%${s}%`));
    supplierClause = `AND LOWER(l.supplier) LIKE ANY($3::text[])`;
  }

  const query = `
    WITH base AS (
      SELECT le.quantity,
        COALESCE(sel.origin_flupsy_id, bs.flupsy_id)      AS origin_fid,
        COALESCE(sel.destination_flupsy_id, bd.flupsy_id) AS dest_fid
      FROM lot_ledger le
      JOIN lots l ON l.id = le.lot_id
      LEFT JOIN selections sel ON sel.id = le.selection_id
      LEFT JOIN cycles cs ON cs.id = le.source_cycle_id
      LEFT JOIN baskets bs ON bs.id = cs.basket_id
      LEFT JOIN cycles cd ON cd.id = le.dest_cycle_id
      LEFT JOIN baskets bd ON bd.id = cd.basket_id
      WHERE le.date >= $1 AND le.date <= $2
        AND le.type = 'transfer_in'
        ${supplierClause}
    ), t AS (
      SELECT base.quantity,
        ${CATEGORY_SQL("fo.name")} AS origine,
        ${CATEGORY_SQL("fd.name")} AS destinazione
      FROM base
      LEFT JOIN flupsys fo ON fo.id = base.origin_fid
      LEFT JOIN flupsys fd ON fd.id = base.dest_fid
    )
    SELECT origine, destinazione,
      COUNT(*)::int AS eventi,
      COALESCE(SUM(quantity), 0)::bigint AS animali
    FROM t
    GROUP BY origine, destinazione
    ORDER BY origine, destinazione`;

  const result = await pool.query(query, queryParams);
  return result.rows.map((r: any) => ({
    origine: r.origine as string,
    destinazione: r.destinazione as string,
    eventi: Number(r.eventi),
    animali: Number(r.animali),
  }));
}

interface StageBalanceRow {
  tappa: string;
  entrati: number; // animali arrivati nella tappa (transfer_in dest + attivazioni)
  usciti: number; // animali usciti vivi (transfer_out origine + vendite)
  morti: number; // mortalità attribuita alla tappa (origine vagliatura / cesta operazione)
  saldo: number; // entrati - usciti - morti (giacenza teorica residua nella tappa)
  giacenza: number; // animali realmente presenti adesso nella tappa (conteggio ultima operazione)
  perditaNonSpiegata: number; // saldo - giacenza: animali "spariti" senza mortalità registrata
}

// Giacenza attuale per tappa: somma del conteggio dell'ultima operazione di
// ogni cesta attiva, ALLOCATO ai nostri lotti tramite la composizione lotti
// (fallback al lotto del ciclo per le ceste non miscelate). Non è filtrata per
// data perché rappresenta lo stato corrente, solo per fornitore.
async function computeCurrentInventory(p: FlowParams): Promise<Record<string, number>> {
  const supplierPatterns =
    p.suppliers === "all" ? ["%"] : p.suppliers.map((s) => `%${s}%`);

  const query = `
    WITH latest AS (
      SELECT DISTINCT ON (o.basket_id) o.basket_id, o.animal_count
      FROM operations o
      WHERE o.type IN ('misura','peso','prima-attivazione')
        AND o.animal_count IS NOT NULL
        AND o.cancelled_at IS NULL
      ORDER BY o.basket_id, o.date DESC, o.id DESC
    ), comp AS (
      SELECT blc.basket_id, blc.cycle_id,
        SUM(blc.animal_count) FILTER (WHERE LOWER(l.supplier) LIKE ANY($1::text[]))::numeric AS our_cnt,
        SUM(blc.animal_count)::numeric AS tot_cnt
      FROM basket_lot_composition blc
      JOIN lots l ON l.id = blc.lot_id
      GROUP BY blc.basket_id, blc.cycle_id
    )
    SELECT ${CATEGORY_SQL("f.name")} AS tappa,
      ROUND(SUM(latest.animal_count * frac.f))::bigint AS giacenza
    FROM baskets b
    JOIN flupsys f ON f.id = b.flupsy_id
    JOIN latest ON latest.basket_id = b.id
    LEFT JOIN cycles c ON c.id = b.current_cycle_id
    LEFT JOIN lots cl ON cl.id = c.lot_id
    LEFT JOIN comp ON comp.basket_id = b.id AND comp.cycle_id = b.current_cycle_id
    CROSS JOIN LATERAL (SELECT CASE
        WHEN comp.tot_cnt IS NOT NULL AND comp.tot_cnt > 0 THEN comp.our_cnt / comp.tot_cnt
        WHEN LOWER(cl.supplier) LIKE ANY($1::text[]) THEN 1
        ELSE 0 END AS f) frac
    WHERE b.state = 'active' AND frac.f > 0
    GROUP BY 1`;

  const result = await pool.query(query, [supplierPatterns]);
  const map: Record<string, number> = {};
  result.rows.forEach((r: any) => {
    map[r.tappa as string] = Number(r.giacenza);
  });
  return map;
}

// Bilancio per tappa: per ogni contenitore quanti animali sono entrati, usciti
// vivi e morti. La mortalità viene attribuita alla tappa di ORIGINE della
// vagliatura (dove gli animali si trovavano prima del conteggio), con fallback
// alla cesta dell'operazione.
async function computeStageBalance(p: FlowParams): Promise<StageBalanceRow[]> {
  const queryParams: any[] = [p.from, p.to];
  let supplierClause = "";
  if (p.suppliers !== "all") {
    queryParams.push(p.suppliers.map((s) => `%${s}%`));
    supplierClause = `AND LOWER(l.supplier) LIKE ANY($3::text[])`;
  }

  const query = `
    WITH filt AS (
      SELECT le.* FROM lot_ledger le JOIN lots l ON l.id = le.lot_id
      WHERE le.date >= $1 AND le.date <= $2 ${supplierClause}
    ), cat AS (
      SELECT le.type, le.quantity,
        ${CATEGORY_SQL("fo.name")} AS origine,
        ${CATEGORY_SQL("fd.name")} AS destinazione,
        ${CATEGORY_SQL("fb.name")} AS cesta
      FROM filt le
      LEFT JOIN selections sel ON sel.id = le.selection_id
      LEFT JOIN flupsys fo ON fo.id = COALESCE(sel.origin_flupsy_id,
        (SELECT b.flupsy_id FROM cycles c JOIN baskets b ON b.id = c.basket_id WHERE c.id = le.source_cycle_id))
      LEFT JOIN flupsys fd ON fd.id = COALESCE(sel.destination_flupsy_id,
        (SELECT b.flupsy_id FROM cycles c JOIN baskets b ON b.id = c.basket_id WHERE c.id = le.dest_cycle_id))
      LEFT JOIN baskets ba ON ba.id = le.basket_id
      LEFT JOIN flupsys fb ON fb.id = ba.flupsy_id
    )
    SELECT c.k AS tappa,
      COALESCE(SUM(CASE WHEN cat.type='transfer_in' AND cat.destinazione=c.k THEN cat.quantity END),0)::bigint
        + COALESCE(SUM(CASE WHEN cat.type='activation' AND cat.cesta=c.k THEN ABS(cat.quantity) END),0)::bigint AS entrati,
      COALESCE(SUM(CASE WHEN cat.type='transfer_out' AND cat.origine=c.k THEN cat.quantity END),0)::bigint
        + COALESCE(SUM(CASE WHEN cat.type='sale' AND cat.cesta=c.k THEN cat.quantity END),0)::bigint AS usciti,
      COALESCE(SUM(CASE WHEN cat.type='mortality' AND COALESCE(NULLIF(cat.origine,'(altro)'),cat.cesta)=c.k THEN cat.quantity END),0)::bigint AS morti
    FROM (VALUES ('RACEWAY'),('BINS'),('MINI FLUPSY'),('FLUPSY'),('(altro)')) AS c(k)
    LEFT JOIN cat ON TRUE
    GROUP BY c.k`;

  const [result, inventory] = await Promise.all([
    pool.query(query, queryParams),
    computeCurrentInventory(p),
  ]);
  const order = ["RACEWAY", "BINS", "MINI FLUPSY", "FLUPSY", "(altro)"];
  return result.rows
    .map((r: any) => {
      const entrati = Number(r.entrati);
      const usciti = Number(r.usciti);
      const morti = Number(r.morti);
      const saldo = entrati - usciti - morti;
      const giacenza = inventory[r.tappa as string] ?? 0;
      return {
        tappa: r.tappa as string,
        entrati,
        usciti,
        morti,
        saldo,
        giacenza,
        perditaNonSpiegata: saldo - giacenza,
      };
    })
    .sort((a, b) => order.indexOf(a.tappa) - order.indexOf(b.tappa));
}

lotFlowRoutes.get("/lot-flow", async (req: Request, res: Response) => {
  try {
    const { params, error } = parseParams(req);
    if (error) return res.status(400).json({ success: false, message: error });
    const [matrix, stageBalance] = await Promise.all([
      computeLotFlow(params),
      computeStageBalance(params),
    ]);
    res.json({ from: params.from, to: params.to, suppliers: params.suppliers, matrix, stageBalance });
  } catch (error) {
    console.error("Errore report flusso lotti:", error);
    return sendError(res, error, "Impossibile generare il report flusso");
  }
});

lotFlowRoutes.get("/lot-flow/export", async (req: Request, res: Response) => {
  try {
    const { params, error } = parseParams(req);
    if (error) return res.status(400).json({ success: false, message: error });
    const [matrix, stageBalance] = await Promise.all([
      computeLotFlow(params),
      computeStageBalance(params),
    ]);

    const find = (o: string, d: string) =>
      matrix.find((r) => r.origine === o && r.destinazione === d);
    const sumBetween = (origins: string[], dests: string[]) =>
      matrix
        .filter((r) => origins.includes(r.origine) && dests.includes(r.destinazione))
        .reduce(
          (acc, r) => ({ animali: acc.animali + r.animali, eventi: acc.eventi + r.eventi }),
          { animali: 0, eventi: 0 },
        );

    const wb = new ExcelJS.Workbook();
    wb.creator = "FLUPSY";
    wb.created = new Date();
    const fmtInt = "#,##0";

    // Foglio 1: Riepilogo tappe
    const s1 = wb.addWorksheet("Riepilogo tappe");
    s1.columns = [
      { header: "Tappa", key: "k", width: 40 },
      { header: "Animali (movimenti)", key: "a", width: 22, style: { numFmt: fmtInt } },
      { header: "N. movimenti", key: "n", width: 16, style: { numFmt: fmtInt } },
    ];
    s1.getRow(1).font = { bold: true };
    const supplierLabel = params.suppliers === "all" ? "Tutti" : params.suppliers.join(", ");
    s1.addRows([
      { k: "Periodo", a: safeCell(`${params.from} → ${params.to}`) },
      { k: "Fornitori", a: safeCell(supplierLabel) },
      { k: "", a: "" },
      { k: "1) Raceway → ingrasso (Bins / Mini / Flupsy)", a: sumBetween(["RACEWAY"], ["BINS", "MINI FLUPSY", "FLUPSY"]).animali, n: sumBetween(["RACEWAY"], ["BINS", "MINI FLUPSY", "FLUPSY"]).eventi },
      { k: "2) Bins → Mini-flupsy / Flupsy (tappa opzionale)", a: sumBetween(["BINS"], ["MINI FLUPSY", "FLUPSY"]).animali, n: sumBetween(["BINS"], ["MINI FLUPSY", "FLUPSY"]).eventi },
      { k: "3) Mini-flupsy → Flupsy (tappa opzionale)", a: sumBetween(["MINI FLUPSY"], ["FLUPSY"]).animali, n: sumBetween(["MINI FLUPSY"], ["FLUPSY"]).eventi },
      { k: "Arrivati al Flupsy (ultima tappa prima della vendita)", a: sumBetween(["RACEWAY", "BINS", "MINI FLUPSY", "(altro)"], ["FLUPSY"]).animali, n: sumBetween(["RACEWAY", "BINS", "MINI FLUPSY", "(altro)"], ["FLUPSY"]).eventi },
      { k: "", a: "" },
      { k: "Nota", a: "Percorso: Raceway → (Bins → Mini-flupsy → Flupsy) → vendita. Bins e mini-flupsy possono mancare; la vendita avviene da flupsy o mini-flupsy. I numeri indicano i movimenti di animali, non animali unici: lo stesso animale che passa più tappe è contato a ogni passaggio." },
    ]);

    // Foglio 2: Matrice completa (origine x destinazione)
    const s2 = wb.addWorksheet("Matrice passaggi");
    s2.columns = [
      { header: "DA \\ A", key: "da", width: 16 },
      ...CATS.map((c) => ({ header: c, key: c, width: 16, style: { numFmt: fmtInt } })),
    ];
    s2.getRow(1).font = { bold: true };
    CATS.forEach((o) => {
      const row: any = { da: o };
      CATS.forEach((d) => {
        const c = find(o, d);
        row[d] = c ? c.animali : 0;
      });
      s2.addRow(row);
    });
    s2.getColumn(1).font = { bold: true };

    // Foglio 3: Dettaglio (lista piatta)
    const s3 = wb.addWorksheet("Dettaglio");
    s3.columns = [
      { header: "Origine", key: "o", width: 16 },
      { header: "Destinazione", key: "d", width: 16 },
      { header: "Animali", key: "a", width: 18, style: { numFmt: fmtInt } },
      { header: "N. movimenti", key: "n", width: 16, style: { numFmt: fmtInt } },
    ];
    s3.getRow(1).font = { bold: true };
    matrix.forEach((r) => s3.addRow({ o: r.origine, d: r.destinazione, a: r.animali, n: r.eventi }));

    // Foglio 4: Bilancio per tappa (dove si perdono gli animali)
    const s4 = wb.addWorksheet("Bilancio per tappa");
    s4.columns = [
      { header: "Tappa", key: "t", width: 16 },
      { header: "Entrati", key: "e", width: 16, style: { numFmt: fmtInt } },
      { header: "Usciti vivi", key: "u", width: 16, style: { numFmt: fmtInt } },
      { header: "Morti", key: "m", width: 16, style: { numFmt: fmtInt } },
      { header: "Saldo teorico", key: "s", width: 16, style: { numFmt: fmtInt } },
      { header: "Giacenza attuale", key: "g", width: 18, style: { numFmt: fmtInt } },
      { header: "Perdita non spiegata", key: "x", width: 20, style: { numFmt: fmtInt } },
      { header: "% mortalità", key: "p", width: 12, style: { numFmt: "0.0" } },
    ];
    s4.getRow(1).font = { bold: true };
    stageBalance.forEach((r) =>
      s4.addRow({
        t: r.tappa,
        e: r.entrati,
        u: r.usciti,
        m: r.morti,
        s: r.saldo,
        g: r.giacenza,
        x: r.perditaNonSpiegata,
        p: r.entrati > 0 ? (r.morti / r.entrati) * 100 : 0,
      }),
    );
    s4.addRow({});
    s4.addRow({ t: "Nota", e: "Mortalità attribuita alla tappa di origine della vagliatura (dove erano gli animali prima della conta). 'Saldo teorico' = entrati − usciti − morti. 'Giacenza attuale' = animali realmente presenti adesso nelle ceste attive (conteggio ultima operazione, ripartito sui nostri lotti). 'Perdita non spiegata' = saldo teorico − giacenza: animali spariti senza mortalità o vendita registrata." });

    const filename = `Flusso_animali_${params.from}_${params.to}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Errore export flusso lotti:", error);
    return sendError(res, error, "Impossibile generare l'Excel del flusso");
  }
});
