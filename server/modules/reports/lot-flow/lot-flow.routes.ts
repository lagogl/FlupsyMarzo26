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
  if (from > to) {
    return { params: { from, to, suppliers: "all" }, error: "La data iniziale non può essere successiva alla data finale" };
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
    -- NB: in lot_ledger, le.basket_id = cesta di DESTINAZIONE per i transfer_in
    -- (cesta di ORIGINE per i transfer_out). Qui la query filtra solo transfer_in,
    -- quindi bdir = cesta di arrivo: è la fonte più affidabile della destinazione
    -- (risolve ~784/807 righe contro le ~213 del solo ciclo destinazione, perché i
    -- cicli/ceste destinazione possono essere stati eliminati o riorganizzati).
    WITH base AS (
      SELECT le.quantity,
        COALESCE(sel.origin_flupsy_id, bs.flupsy_id)                  AS origin_fid,
        COALESCE(sel.destination_flupsy_id, bdir.flupsy_id, bd.flupsy_id) AS dest_fid
      FROM lot_ledger le
      JOIN lots l ON l.id = le.lot_id
      LEFT JOIN selections sel ON sel.id = le.selection_id
      LEFT JOIN cycles cs ON cs.id = le.source_cycle_id
      LEFT JOIN baskets bs ON bs.id = cs.basket_id
      LEFT JOIN cycles cd ON cd.id = le.dest_cycle_id
      LEFT JOIN baskets bd ON bd.id = cd.basket_id
      LEFT JOIN baskets bdir ON bdir.id = le.basket_id
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
  entrati: number; // arrivi reali: attivazioni fornitori + trasferimenti in avanti lungo il percorso (no movimenti interni/ritorni)
  usciti: number; // animali usciti vivi verso un'altra tappa (transfer non interni) + vendite
  morti: number; // mortalità attribuita alla tappa (origine vagliatura / cesta operazione)
  saldo: number; // entrati - usciti - morti (giacenza teorica residua nella tappa)
  giacenza: number; // animali realmente presenti adesso nella tappa (conteggio ultima operazione)
  perditaNonSpiegata: number; // saldo - giacenza: animali "spariti" senza mortalità registrata
}

interface MortalityEvent {
  id: string;
  operationId: string;
  kind: "selection" | "screening";
  date: string;
  operationNumber: number;
  tappa: string;
  flupsy: string;
  sourceAnimals: number;
  destinationAnimals: number;
  mortality: number;
  mortalityPct: number;
  confidence: "high" | "medium" | "low";
  mixedLots: boolean;
}

interface MortalityStageRow {
  tappa: string;
  eventi: number;
  eventiConMortalita: number;
  animaliLavorati: number;
  mortalitaRilevata: number;
  mortalitaPct: number;
  eventoPeggiore: number;
  eventiBassaAffidabilita: number;
}

async function computeMortalityAnalysis(
  p: FlowParams,
): Promise<{ events: MortalityEvent[]; stages: MortalityStageRow[] }> {
  const supplierPatterns =
    p.suppliers === "all" ? ["%"] : p.suppliers.map((s) => `%${s}%`);

  const query = `
    WITH raw_events AS (
      SELECT
        'selection'::text AS kind,
        s.id,
        s.date,
        s.selection_number AS operation_number
      FROM selections s
      WHERE s.status = 'completed' AND s.date >= $1 AND s.date <= $2

      UNION ALL

      SELECT
        'screening'::text AS kind,
        o.id,
        o.date,
        o.screening_number AS operation_number
      FROM screening_operations o
      WHERE o.status = 'completed' AND o.date >= $1 AND o.date <= $2
    ), source_rows AS (
      SELECT 'selection'::text AS kind, ss.selection_id AS event_id,
        COALESCE(ss.flupsy_id, b.flupsy_id) AS origin_fid,
        ss.lot_id, COALESCE(ss.animal_count, 0)::numeric AS animal_count
      FROM selection_source_baskets ss
      LEFT JOIN baskets b ON b.id = ss.basket_id

      UNION ALL

      SELECT 'screening'::text AS kind, ss.screening_id AS event_id,
        COALESCE(ss.flupsy_id, b.flupsy_id) AS origin_fid,
        ss.lot_id, COALESCE(ss.animal_count, 0)::numeric AS animal_count
      FROM screening_source_baskets ss
      LEFT JOIN baskets b ON b.id = ss.basket_id
    ), destination_totals AS (
      SELECT 'selection'::text AS kind, sd.selection_id AS event_id,
        COALESCE(SUM(COALESCE(sd.animal_count, 0)), 0)::numeric AS destination_total
      FROM selection_destination_baskets sd
      GROUP BY sd.selection_id

      UNION ALL

      SELECT 'screening'::text AS kind, sd.screening_id AS event_id,
        COALESCE(SUM(COALESCE(sd.animal_count, 0)), 0)::numeric AS destination_total
      FROM screening_destination_baskets sd
      GROUP BY sd.screening_id
    ), source_totals AS (
      SELECT sr.kind, sr.event_id,
        SUM(sr.animal_count)::numeric AS source_total,
        COUNT(DISTINCT sr.lot_id)::int AS lot_count,
        COUNT(DISTINCT sr.origin_fid)::int AS origin_count
      FROM source_rows sr
      GROUP BY sr.kind, sr.event_id
    ), selected_origins AS (
      SELECT sr.kind, sr.event_id, sr.origin_fid,
        SUM(sr.animal_count)::numeric AS selected_source
      FROM source_rows sr
      JOIN lots l ON l.id = sr.lot_id
      WHERE LOWER(l.supplier) LIKE ANY($3::text[])
      GROUP BY sr.kind, sr.event_id, sr.origin_fid
    )
    SELECT
      e.kind, e.id, e.date, e.operation_number,
      so.origin_fid, st.source_total, COALESCE(dt.destination_total, 0) AS destination_total,
      so.selected_source, st.lot_count, st.origin_count,
      COALESCE(f.name, 'Contenitore non identificato') AS flupsy_name,
      ${CATEGORY_SQL("f.name")} AS stage,
      COALESCE(dt.destination_total, 0) * so.selected_source
        / NULLIF(st.source_total, 0) AS selected_destination,
      GREATEST(0, st.source_total - COALESCE(dt.destination_total, 0))
        * so.selected_source / NULLIF(st.source_total, 0) AS selected_mortality
    FROM raw_events e
    JOIN source_totals st ON st.kind = e.kind AND st.event_id = e.id
    JOIN selected_origins so ON so.kind = e.kind AND so.event_id = e.id
    LEFT JOIN destination_totals dt ON dt.kind = e.kind AND dt.event_id = e.id
    LEFT JOIN flupsys f ON f.id = so.origin_fid
    WHERE st.source_total > 0 AND so.selected_source > 0
    ORDER BY e.date DESC, e.id DESC, so.origin_fid`;

  const result = await pool.query(query, [p.from, p.to, supplierPatterns]);
  const events: MortalityEvent[] = result.rows.map((r: any) => {
    const sourceAnimals = Number(r.selected_source) || 0;
    const destinationAnimals = Number(r.selected_destination) || 0;
    const mortality = Math.max(0, Number(r.selected_mortality) || 0);
    const mixedLots = Number(r.lot_count) > 1;
    const stageUnknown = r.stage === "(altro)";
    const partiallyAllocated = Number(r.selected_source) < Number(r.source_total);
    const multipleOrigins = Number(r.origin_count) > 1;
    const confidence: MortalityEvent["confidence"] = stageUnknown
      ? "low"
      : mixedLots || partiallyAllocated || multipleOrigins
        ? "medium"
        : "high";
    return {
      id: `${r.kind}-${r.id}-${r.origin_fid ?? "unknown"}`,
      operationId: `${r.kind}-${r.id}`,
      kind: r.kind,
      date: String(r.date),
      operationNumber: Number(r.operation_number),
      tappa: r.stage,
      flupsy: r.flupsy_name,
      sourceAnimals,
      destinationAnimals,
      mortality,
      mortalityPct: sourceAnimals > 0 ? (mortality / sourceAnimals) * 100 : 0,
      confidence,
      mixedLots,
    };
  });

  const order = ["RACEWAY", "BINS", "MINI FLUPSY", "FLUPSY", "(altro)"];
  const stages = order.map((tappa) => {
    const rows = events.filter((event) => event.tappa === tappa);
    const operationIds = new Set(rows.map((event) => event.operationId));
    const mortalityOperationIds = new Set(
      rows.filter((event) => event.mortality > 0).map((event) => event.operationId),
    );
    const animaliLavorati = rows.reduce((sum, event) => sum + event.sourceAnimals, 0);
    const mortalitaRilevata = rows.reduce((sum, event) => sum + event.mortality, 0);
    return {
      tappa,
      eventi: operationIds.size,
      eventiConMortalita: mortalityOperationIds.size,
      animaliLavorati,
      mortalitaRilevata,
      mortalitaPct: animaliLavorati > 0 ? (mortalitaRilevata / animaliLavorati) * 100 : 0,
      eventoPeggiore: rows.reduce((max, event) => Math.max(max, event.mortalityPct), 0),
      eventiBassaAffidabilita: rows.filter((event) => event.confidence !== "high").length,
    };
  });

  return { events, stages };
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
// vivi e morti.
//
// ENTRATI = solo arrivi REALI lungo il percorso produttivo
// RACEWAY → BINS → MINI FLUPSY → FLUPSY:
//   - le attivazioni dei lotti dei fornitori (Roem / Ecotapes Zeeland) = animali
//     davvero arrivati dall'esterno; per la RACEWAY questo è l'unico ingresso reale
//     (i trasferimenti raceway↔raceway sono spostamenti interni, NON arrivi);
//   - i trasferimenti "in avanti" lungo il percorso (origine prima della
//     destinazione), cioè animali che progrediscono da una tappa alla successiva.
//   Sono esclusi i movimenti interni alla stessa tappa e i ritorni indietro.
// USCITI = trasferimenti verso un'altra tappa (esclusi quelli interni alla stessa
//   tappa) + vendite.
// La mortalità viene attribuita alla tappa di ORIGINE della vagliatura (dove gli
// animali si trovavano prima del conteggio), con fallback alla cesta.
async function computeStageBalance(p: FlowParams): Promise<StageBalanceRow[]> {
  const queryParams: any[] = [p.from, p.to];
  let supplierClause = "";
  if (p.suppliers !== "all") {
    queryParams.push(p.suppliers.map((s) => `%${s}%`));
    supplierClause = `AND LOWER(l.supplier) LIKE ANY($3::text[])`;
  }

  const PATH = `ARRAY['RACEWAY','BINS','MINI FLUPSY','FLUPSY']`;
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
      LEFT JOIN baskets ba ON ba.id = le.basket_id
      LEFT JOIN flupsys fb ON fb.id = ba.flupsy_id
      -- ba.flupsy_id (cesta della riga) va usata come DESTINAZIONE solo per i
      -- transfer_in (lì le.basket_id è la cesta di arrivo); per i transfer_out
      -- le.basket_id è invece la cesta di ORIGINE, quindi NON usarla qui.
      LEFT JOIN flupsys fd ON fd.id = COALESCE(sel.destination_flupsy_id,
        CASE WHEN le.type = 'transfer_in' THEN ba.flupsy_id END,
        (SELECT b.flupsy_id FROM cycles c JOIN baskets b ON b.id = c.basket_id WHERE c.id = le.dest_cycle_id))
    ), pos AS (
      SELECT cat.*,
        array_position(${PATH}, cat.origine) AS po,
        array_position(${PATH}, cat.destinazione) AS pd
      FROM cat
    )
    SELECT c.k AS tappa,
      COALESCE(SUM(CASE WHEN pos.type='transfer_in' AND pos.destinazione=c.k
            AND pos.po IS NOT NULL AND pos.pd > pos.po THEN pos.quantity END),0)::bigint
        + COALESCE(SUM(CASE WHEN pos.type='activation' AND pos.cesta=c.k THEN ABS(pos.quantity) END),0)::bigint AS entrati,
      COALESCE(SUM(CASE WHEN pos.type='transfer_in' AND pos.origine=c.k
            AND pos.origine IS DISTINCT FROM pos.destinazione THEN pos.quantity END),0)::bigint
        + COALESCE(SUM(CASE WHEN pos.type='sale' AND pos.cesta=c.k THEN pos.quantity END),0)::bigint AS usciti,
      COALESCE(SUM(CASE WHEN pos.type='mortality' AND COALESCE(NULLIF(pos.origine,'(altro)'),pos.cesta)=c.k THEN ABS(pos.quantity) END),0)::bigint AS morti
    FROM (VALUES ('RACEWAY'),('BINS'),('MINI FLUPSY'),('FLUPSY'),('(altro)')) AS c(k)
    LEFT JOIN pos ON TRUE
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
    const [matrix, stageBalance, mortalityAnalysis] = await Promise.all([
      computeLotFlow(params),
      computeStageBalance(params),
      computeMortalityAnalysis(params),
    ]);
    res.json({
      from: params.from,
      to: params.to,
      suppliers: params.suppliers,
      matrix,
      stageBalance,
      mortalityEvents: mortalityAnalysis.events,
      mortalityStages: mortalityAnalysis.stages,
    });
  } catch (error) {
    console.error("Errore report flusso lotti:", error);
    return sendError(res, error, "Impossibile generare il report flusso");
  }
});

lotFlowRoutes.get("/lot-flow/export", async (req: Request, res: Response) => {
  try {
    const { params, error } = parseParams(req);
    if (error) return res.status(400).json({ success: false, message: error });
    const [matrix, stageBalance, mortalityAnalysis] = await Promise.all([
      computeLotFlow(params),
      computeStageBalance(params),
      computeMortalityAnalysis(params),
    ]);

    const find = (o: string, d: string) =>
      matrix.find((r) => r.origine === o && r.destinazione === d);

    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    wb.creator = "FLUPSY";
    wb.created = new Date();
    const fmtInt = "#,##0";

    // Foglio 1: Riepilogo tappe
    // I valori derivano dagli STESSI dati del "Bilancio per tappa" (stageBalance),
    // così i riquadri/riepilogo coincidono sempre con la tabella di dettaglio.
    const sbVal = (t: string, k: "entrati" | "usciti" | "morti" | "saldo" | "giacenza") =>
      stageBalance.find((r) => r.tappa === t)?.[k] ?? 0;
    const s1 = wb.addWorksheet("Riepilogo tappe");
    s1.columns = [
      { header: "Voce", key: "k", width: 48 },
      { header: "Animali", key: "a", width: 22, style: { numFmt: fmtInt } },
    ];
    s1.getRow(1).font = { bold: true };
    const supplierLabel = params.suppliers === "all" ? "Tutti" : params.suppliers.join(", ");
    s1.addRows([
      { k: "Periodo", a: safeCell(`${params.from} → ${params.to}`) },
      { k: "Fornitori", a: safeCell(supplierLabel) },
      { k: "", a: "" },
      { k: "1) Uscite dalle Raceway (verso tappe successive o vendita)", a: sbVal("RACEWAY", "usciti") },
      { k: "2) Uscite dai Bins (tappa opzionale)", a: sbVal("BINS", "usciti") },
      { k: "3) Uscite dai Mini-flupsy (tappa opzionale)", a: sbVal("MINI FLUPSY", "usciti") },
      { k: "Entrati nel Flupsy (trasferimenti + attivazioni dirette)", a: sbVal("FLUPSY", "entrati") },
      { k: "", a: "" },
      { k: "Nota", a: "Questi valori coincidono con il foglio 'Bilancio per tappa'. Le 'Uscite' sono gli animali usciti vivi da ogni tappa (verso la tappa successiva o la vendita); gli 'Entrati nel Flupsy' includono sia i trasferimenti da altre tappe sia gli animali attivati direttamente nel flupsy. Non vanno confusi con le singole celle della 'Matrice passaggi', che contano solo i trasferimenti registrati." },
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

    const s5 = wb.addWorksheet("Diagnostica mortalità");
    s5.columns = [
      { header: "Tappa", key: "tappa", width: 20 },
      { header: "Operazioni completate", key: "eventi", width: 22, style: { numFmt: fmtInt } },
      { header: "Eventi con mortalità", key: "eventiMort", width: 22, style: { numFmt: fmtInt } },
      { header: "Animali lavorati", key: "lavorati", width: 20, style: { numFmt: fmtInt } },
      { header: "Mortalità rilevata", key: "mortalita", width: 20, style: { numFmt: fmtInt } },
      { header: "% sul lavorato", key: "percentuale", width: 18, style: { numFmt: "0.0" } },
      { header: "Peggior evento %", key: "peggiore", width: 18, style: { numFmt: "0.0" } },
      { header: "Eventi da verificare", key: "verificare", width: 20, style: { numFmt: fmtInt } },
    ];
    s5.getRow(1).font = { bold: true };
    mortalityAnalysis.stages.forEach((r) => s5.addRow({
      tappa: r.tappa,
      eventi: r.eventi,
      eventiMort: r.eventiConMortalita,
      lavorati: r.animaliLavorati,
      mortalita: r.mortalitaRilevata,
      percentuale: r.mortalitaPct,
      peggiore: r.eventoPeggiore,
      verificare: r.eventiBassaAffidabilita,
    }));
    s5.addRow({});
    s5.addRow({
      tappa: "Nota",
      eventi: "Mortalità osservata nelle operazioni completate: differenza positiva tra animali nelle ceste di origine e animali nelle ceste di destinazione. È attribuita alla tappa di origine, dove la differenza è stata rilevata, non necessariamente causata.",
    });

    const s6 = wb.addWorksheet("Eventi mortalità");
    s6.columns = [
      { header: "Data", key: "data", width: 14 },
      { header: "Tipo", key: "tipo", width: 14 },
      { header: "Numero operazione", key: "numero", width: 18, style: { numFmt: fmtInt } },
      { header: "Tappa", key: "tappa", width: 18 },
      { header: "FLUPSY", key: "flupsy", width: 30 },
      { header: "Animali origine", key: "origine", width: 20, style: { numFmt: fmtInt } },
      { header: "Animali destinazione", key: "destinazione", width: 22, style: { numFmt: fmtInt } },
      { header: "Mortalità rilevata", key: "mortalita", width: 20, style: { numFmt: fmtInt } },
      { header: "Mortalità %", key: "percentuale", width: 16, style: { numFmt: "0.0" } },
      { header: "Affidabilità", key: "affidabilita", width: 16 },
      { header: "Lotti misti", key: "misti", width: 14 },
    ];
    s6.getRow(1).font = { bold: true };
    mortalityAnalysis.events.forEach((event) => s6.addRow({
      data: event.date,
      tipo: event.kind === "selection" ? "Selezione" : "Screening",
      numero: event.operationNumber,
      tappa: event.tappa,
      flupsy: safeCell(event.flupsy),
      origine: event.sourceAnimals,
      destinazione: event.destinationAnimals,
      mortalita: event.mortality,
      percentuale: event.mortalityPct,
      affidabilita: event.confidence === "high" ? "Alta" : event.confidence === "medium" ? "Media" : "Bassa",
      misti: event.mixedLots ? "Sì" : "No",
    }));

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
