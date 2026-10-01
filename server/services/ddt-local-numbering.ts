import { sql, type SQL } from "drizzle-orm";

type ExecuteQuery = (query: SQL) => Promise<{ rows: Record<string, unknown>[] }>;

/**
 * A sent document belongs to FIC's sequence, not the pending local sequence.
 * Use the same scoped query for preview and the transaction-locked recheck.
 * This does not relax duplicate checks against the complete local history.
 */
export async function getPendingLocalDdtMaximum(
  execute: ExecuteQuery,
  companyId: number,
  year: number,
): Promise<number | null> {
  const result = await execute(sql`
    SELECT MAX(numero)::integer AS highest_number
    FROM ddt
    WHERE company_id = ${companyId}
      AND numbering_year = ${year}
      AND ddt_stato IN ('locale', 'invio')
  `);
  const value = result.rows[0]?.highest_number;
  if (value == null) return null;
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) {
    throw new Error("Prenotazione locale DDT non valida");
  }
  return number;
}