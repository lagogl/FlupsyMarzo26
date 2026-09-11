import test from 'node:test';
import assert from 'node:assert/strict';
import { runAtomicDeletion, type TransactionRunner } from './atomic-deletion';

type State = {
  operations: number[];
  cycles: number[];
  baskets: Array<{ id: number; state: string; cycleId: number | null }>;
  audit: string[];
};

class MemoryTransactionRunner implements TransactionRunner<State> {
  constructor(public state: State) {}

  async transaction<TResult>(work: (tx: State) => Promise<TResult>): Promise<TResult> {
    const pending = structuredClone(this.state);
    const result = await work(pending);
    this.state = pending;
    return result;
  }
}

test('un errore intermedio ripristina operazioni, ciclo, cesta e audit senza effetti esterni', async () => {
  const original: State = {
    operations: [10, 11],
    cycles: [20],
    baskets: [{ id: 30, state: 'active', cycleId: 20 }],
    audit: []
  };
  const runner = new MemoryTransactionRunner(structuredClone(original));
  let cacheInvalidations = 0;
  let broadcasts = 0;

  await assert.rejects(
    runAtomicDeletion(
      runner,
      async tx => {
        tx.operations = [];
        tx.cycles = [];
        tx.baskets[0] = { id: 30, state: 'available', cycleId: null };
        tx.audit.push('operation_deleted');
        throw new Error('fault injection dopo il reset della cesta');
      },
      () => {
        cacheInvalidations++;
        broadcasts++;
      }
    ),
    /fault injection/
  );

  assert.deepEqual(runner.state, original);
  assert.equal(cacheInvalidations, 0);
  assert.equal(broadcasts, 0);
});

test('cache e WebSocket partono soltanto dopo il commit', async () => {
  const runner = new MemoryTransactionRunner({
    operations: [10],
    cycles: [],
    baskets: [],
    audit: []
  });
  const events: string[] = [];

  await runAtomicDeletion(
    runner,
    async tx => {
      tx.operations = [];
      events.push('db-work');
      return 'deleted';
    },
    result => {
      assert.equal(result, 'deleted');
      assert.deepEqual(runner.state.operations, []);
      events.push('after-commit');
    }
  );

  assert.deepEqual(events, ['db-work', 'after-commit']);
});

test('un errore post-commit non trasforma una cancellazione confermata in un falso rollback', async () => {
  const runner = new MemoryTransactionRunner({
    operations: [10],
    cycles: [],
    baskets: [],
    audit: []
  });
  const errors: unknown[] = [];

  const result = await runAtomicDeletion(
    runner,
    async tx => {
      tx.operations = [];
      return 'deleted';
    },
    () => {
      throw new Error('WebSocket non disponibile');
    },
    error => errors.push(error)
  );

  assert.equal(result, 'deleted');
  assert.deepEqual(runner.state.operations, []);
  assert.equal(errors.length, 1);
});