export const DDT_NUMBER_CONFLICT_MESSAGE =
  "Il numero DDT è già stato assegnato per questa azienda e anno. Riprova la generazione.";

/**
 * The database guard raises SQLSTATE 23505 when it rejects a concurrent or
 * external duplicate while preserving legacy duplicate DDT records.
 */
export function isDdtNumberConflict(error: unknown): boolean {
  const databaseError = error as { code?: unknown; constraint?: unknown } | null;

  return databaseError?.code === "23505"
    && databaseError.constraint === "ddt_company_year_number_unique";
}