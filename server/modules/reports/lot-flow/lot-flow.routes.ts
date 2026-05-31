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

lotFlowRoutes.get("/lot-flow", async (req: Request, res: Response) => {
  try {
    const { params, error } = parseParams(req);
    if (error) return res.status(400).json({ success: false, message: error });
    const matrix = await computeLotFlow(params);
    res.json({ from: params.from, to: params.to, suppliers: params.suppliers, matrix });
  } catch (error) {
    console.error("Errore report flusso lotti:", error);
    return sendError(res, error, "Impossibile generare il report flusso");
  }
});

lotFlowRoutes.get("/lot-flow/export", async (req: Request, res: Response) => {
  try {
    const { params, error } = parseParams(req);
    if (error) return res.status(400).json({ success: false, message: error });
    const matrix = await computeLotFlow(params);

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
      { k: "1) Raceway → Bins", a: sumBetween(["RACEWAY"], ["BINS"]).animali, n: sumBetween(["RACEWAY"], ["BINS"]).eventi },
      { k: "2) Bins → Flupsy / Mini-flupsy", a: sumBetween(["BINS"], ["FLUPSY", "MINI FLUPSY"]).animali, n: sumBetween(["BINS"], ["FLUPSY", "MINI FLUPSY"]).eventi },
      { k: "Raceway → Flupsy / Mini (diretto)", a: sumBetween(["RACEWAY"], ["FLUPSY", "MINI FLUPSY"]).animali, n: sumBetween(["RACEWAY"], ["FLUPSY", "MINI FLUPSY"]).eventi },
      { k: "Arrivati ai Flupsy/Mini da fuori", a: sumBetween(["RACEWAY", "BINS", "(altro)"], ["FLUPSY", "MINI FLUPSY"]).animali, n: sumBetween(["RACEWAY", "BINS", "(altro)"], ["FLUPSY", "MINI FLUPSY"]).eventi },
      { k: "", a: "" },
      { k: "Nota", a: "I numeri indicano i movimenti di animali, non animali unici: lo stesso animale che passa più tappe è contato a ogni passaggio." },
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
