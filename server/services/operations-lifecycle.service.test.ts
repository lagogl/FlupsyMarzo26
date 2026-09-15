import test from 'node:test';
import assert from 'node:assert/strict';
import {
  operations,
  cycles,
  baskets,
  basketLotComposition,
  selectionSourceBaskets
} from '../../shared/schema';
import { OperationsLifecycleService } from './operations-lifecycle.service';

type Row = Record<string, any>;
type FakeState = {
  operations: Row[];
  cycles: Row[];
  baskets: Row[];
  compositions: Row[];
  selectionSources: Row[];
  audit: Row[];
};

class FakeDatabase {
  constructor(public state: FakeState) {}

  async transaction<T>(work: (tx: FakeTransaction) => Promise<T>): Promise<T> {
    const pending = structuredClone(this.state);
    const result = await work(new FakeTransaction(pending));
    this.state = pending;
    return result;
  }
}

class FakeTransaction {
  constructor(private state: FakeState) {}

  select() {
    return {
      from: (table: unknown) => ({
        where: async () => {
          if (table === operations) return this.state.operations;
          if (table === selectionSourceBaskets) return this.state.selectionSources;
          return [];
        }
      })
    };
  }

  execute() {
    return Promise.resolve([]);
  }

  delete(table: unknown) {
    return {
      where: () => {
        const remove = () => {
          if (table === operations) this.state.operations = [];
          if (table === cycles) this.state.cycles = [];
          if (table === basketLotComposition) this.state.compositions = [];
          if (table === selectionSourceBaskets) this.state.selectionSources = [];
        };
        return {
          then: (resolve: (value: unknown) => void) => {
            remove();
            resolve(undefined);
          },
          returning: async () => {
            const deleted = table === basketLotComposition
              ? this.state.compositions
              : this.state.selectionSources;
            remove();
            return deleted;
          }
        };
      }
    };
  }

  update(table: unknown) {
    return {
      set: (values: Row) => ({
        where: async () => {
          if (table === baskets) {
            this.state.baskets = this.state.baskets.map(row => ({ ...row, ...values }));
          }
        }
      })
    };
  }
}

test('deleteOperation annulla l’intero cascade se l’audit fallisce dopo il reset cesta', async () => {
  const original: FakeState = {
    operations: [
      { id: 1, type: 'prima-attivazione', basketId: 3, cycleId: 2 },
      { id: 4, type: 'misura', basketId: 3, cycleId: 2 }
    ],
    cycles: [{ id: 2, basketId: 3, state: 'active' }],
    baskets: [{ id: 3, state: 'active', currentCycleId: 2, cycleCode: 'C-2' }],
    compositions: [{ id: 5, basketId: 3, cycleId: 2 }],
    selectionSources: [],
    audit: []
  };
  const database = new FakeDatabase(structuredClone(original));
  let afterCommitCalls = 0;
  const service = new OperationsLifecycleService(database, {
    handleCompositionDelete: async () => {},
    logDeleted: async (_id, _operation, _metadata, executor) => {
      (executor as any).state?.audit?.push({ action: 'operation_deleted' });
      throw new Error('fault injection audit');
    },
    afterCommit: () => {
      afterCommitCalls++;
    }
  });

  const result = await service.deleteOperation(1);

  assert.equal(result.success, false);
  assert.match(result.errors[0], /fault injection audit/);
  assert.deepEqual(result.cleanedTables, []);
  assert.deepEqual(database.state, original);
  assert.equal(afterCommitCalls, 0);
});

test('deleteOperation completa una cancellazione normale senza tabelle legacy opzionali', async () => {
  const database = new FakeDatabase({
    operations: [{ id: 1, type: 'misura', basketId: 3, cycleId: 2 }],
    cycles: [{ id: 2 }],
    baskets: [{ id: 3, state: 'active', currentCycleId: 2 }],
    compositions: [],
    selectionSources: [],
    audit: []
  });
  let afterCommitCalls = 0;
  const service = new OperationsLifecycleService(database, {
    handleCompositionDelete: async () => {},
    afterCommit: () => { afterCommitCalls++; }
  });

  const result = await service.deleteOperation(1);

  assert.equal(result.success, true);
  assert.deepEqual(database.state.operations, []);
  assert.deepEqual(database.state.cycles, [{ id: 2 }]);
  assert.equal(afterCommitCalls, 1);
});

test('deleteOperation completa il cascade sullo schema corrente senza tabelle legacy opzionali', async () => {
  const database = new FakeDatabase({
    operations: [
      { id: 1, type: 'prima-attivazione', basketId: 3, cycleId: 2 },
      { id: 4, type: 'misura', basketId: 3, cycleId: 2 }
    ],
    cycles: [{ id: 2 }],
    baskets: [{ id: 3, state: 'active', currentCycleId: 2, cycleCode: 'C-2' }],
    compositions: [{ id: 5, cycleId: 2 }],
    selectionSources: [],
    audit: []
  });
  let afterCommitCalls = 0;
  const service = new OperationsLifecycleService(database, {
    handleCompositionDelete: async () => {},
    afterCommit: () => { afterCommitCalls++; }
  });

  const result = await service.deleteOperation(1);

  assert.equal(result.success, true);
  assert.deepEqual(database.state.operations, []);
  assert.deepEqual(database.state.cycles, []);
  assert.equal(database.state.baskets[0].state, 'available');
  assert.equal(database.state.baskets[0].currentCycleId, null);
  assert.deepEqual(database.state.compositions, []);
  assert.deepEqual(database.state.selectionSources, []);
  assert.equal(afterCommitCalls, 1);
});

test('deleteOperation blocca il cascade e conserva lo storico collegato al ciclo', async () => {
  const original: FakeState = {
    operations: [
      { id: 1, type: 'prima-attivazione', basketId: 3, cycleId: 2 },
      { id: 4, type: 'misura', basketId: 3, cycleId: 2 }
    ],
    cycles: [{ id: 2 }],
    baskets: [{ id: 3, state: 'active', currentCycleId: 2, cycleCode: 'C-2' }],
    compositions: [{ id: 5, cycleId: 2 }],
    selectionSources: [{ id: 6, cycleId: 2 }],
    audit: []
  };
  const database = new FakeDatabase(structuredClone(original));
  let afterCommitCalls = 0;
  const service = new OperationsLifecycleService(database, {
    handleCompositionDelete: async () => {},
    afterCommit: () => { afterCommitCalls++; }
  });

  const result = await service.deleteOperation(1);

  assert.equal(result.success, false);
  assert.match(result.errors[0], /riferimenti storici/);
  assert.deepEqual(database.state, original);
  assert.equal(afterCommitCalls, 0);
});