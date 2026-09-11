export interface TransactionRunner<TTransaction> {
  transaction<TResult>(work: (tx: TTransaction) => Promise<TResult>): Promise<TResult>;
}

/**
 * Runs all database work before invoking effects that must only observe committed data.
 */
export async function runAtomicDeletion<TTransaction, TResult>(
  runner: TransactionRunner<TTransaction>,
  work: (tx: TTransaction) => Promise<TResult>,
  afterCommit: (result: TResult) => void | Promise<void>,
  onAfterCommitError: (error: unknown) => void = console.error
): Promise<TResult> {
  const result = await runner.transaction(work);
  try {
    await afterCommit(result);
  } catch (error) {
    // The database is already committed. Never turn an external-effect failure
    // into a false rollback report that invites a destructive retry.
    onAfterCommitError(error);
  }
  return result;
}