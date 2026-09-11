import assert from 'node:assert/strict';
import test from 'node:test';
import {
  testDatabaseConnection,
  type DatabaseDiagnosticDependencies,
} from './debug-db';

test('la diagnostica di avvio esegue esclusivamente letture', async () => {
  const calls: string[] = [];
  const forbiddenMethods = new Set([
    'delete',
    'insert',
    'update',
    'transaction',
  ]);

  const diagnosticPool = new Proxy({
    async query(query: string) {
      calls.push(`pool.query:${query}`);
      assert.match(query.trim(), /^select\b/i);
      return { rows: [{ test: 1 }] };
    },
  }, {
    get(target, property, receiver) {
      if (typeof property === 'string' && !(property in target)) {
        const operationType = forbiddenMethods.has(property) ? 'mutante' : 'non prevista';
        throw new Error(`Operazione ${operationType} nella diagnostica: pool.${property}`);
      }
      return Reflect.get(target, property, receiver);
    },
  });

  const diagnosticDb = new Proxy({
    async execute(query: unknown) {
      calls.push('db.execute');
      const sqlText = (query as { queryChunks?: Array<{ value?: string[] }> })
        .queryChunks?.flatMap(chunk => chunk.value ?? [])
        .join(' ') ?? '';
      assert.match(sqlText.trim(), /^select\b/i);
      return [];
    },
    select() {
      calls.push('db.select');
      return {
        async from() {
          calls.push('db.select.from');
          return [{ count: 0 }];
        },
      };
    },
  }, {
    get(target, property, receiver) {
      if (typeof property === 'string' && !(property in target)) {
        const operationType = forbiddenMethods.has(property) ? 'mutante' : 'non prevista';
        throw new Error(`Operazione ${operationType} nella diagnostica: db.${property}`);
      }
      return Reflect.get(target, property, receiver);
    },
  });

  const dependencies: DatabaseDiagnosticDependencies = {
    pool: diagnosticPool,
    db: diagnosticDb,
  };

  const originalLog = console.log;
  const originalError = console.error;
  console.log = () => undefined;
  console.error = () => undefined;

  try {
    assert.equal(await testDatabaseConnection(dependencies), true);
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }

  assert.deepEqual(calls, [
    'pool.query:SELECT 1 as test',
    'db.execute',
    'db.select',
    'db.select.from',
    'db.select',
    'db.select.from',
    'db.select',
    'db.select.from',
  ]);
});