import { sql, type SQL } from "drizzle-orm";

/**
 * Historical references stay intact after reversal. Only a completed, audited
 * cancellation releases them; drafts, live sales and orphan references reserve
 * their source operation.
 */
export function manualSaleSourceIsAvailable(operationId: SQL): SQL {
  return sql`NOT EXISTS (
    SELECT 1
    FROM sale_operations_ref existing_ref
    WHERE existing_ref.operation_id = ${operationId}
      AND NOT EXISTS (
        SELECT 1
        FROM advanced_sales reversed_sale
        WHERE reversed_sale.id = existing_ref.advanced_sale_id
          AND reversed_sale.status = 'cancelled'
          AND reversed_sale.cancelled_at IS NOT NULL
      )
  )`;
}