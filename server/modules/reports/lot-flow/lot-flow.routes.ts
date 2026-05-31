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

// Classificazione del contenitore in base al nome del FLUPSY.
const CATEGORY_SQL = (col: string) => `CASE
  WHEN ${col} ILIKE '%raceway%' THEN 'RACEWAY'
  WHEN ${col} ILIKE '%bins%' THEN 'BINS'
  WHEN ${col} ILIKE '%mini flupsy%' THEN 'MINI FLUPSY'
  WHEN ${col} ILIKE '%flupsy%' THEN 'FLUPSY'
  ELSE '(altro)' END`;

lotFlowRoutes.get("/lot-flow", async (req: Request, res: Response) => {
  try {
    const from = (req.query.from as string) || "2025-12-01";
    const to = (req.query.to as string) || new Date().toISOString().slice(0, 10);

    // Validazione formato date (YYYY-MM-DD) per evitare query con input non valido.
    const isoDate = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoDate.test(from) || !isoDate.test(to)) {
      return res.status(400).json({
        success: false,
        message: "Parametri 'from' e 'to' devono essere date in formato YYYY-MM-DD",
      });
    }

    // suppliers: lista di parole chiave separate da virgola (es. "roem,ecotapes").
    // "all" oppure vuoto = nessun filtro fornitore.
    const suppliersRaw = ((req.query.suppliers as string) || "roem,ecotapes,zeeland")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const noSupplierFilter = suppliersRaw.length === 0 || suppliersRaw.includes("all");
    const patterns = suppliersRaw.map((s) => `%${s}%`);

    const params: any[] = [from, to];
    let supplierClause = "";
    if (!noSupplierFilter) {
      params.push(patterns);
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

    const result = await pool.query(query, params);

    const matrix = result.rows.map((r: any) => ({
      origine: r.origine as string,
      destinazione: r.destinazione as string,
      eventi: Number(r.eventi),
      animali: Number(r.animali),
    }));

    res.json({
      from,
      to,
      suppliers: noSupplierFilter ? "all" : suppliersRaw,
      matrix,
    });
  } catch (error) {
    console.error("Errore report flusso lotti:", error);
    return sendError(res, error, "Impossibile generare il report flusso");
  }
});
