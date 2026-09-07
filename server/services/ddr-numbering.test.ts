import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureDdrNumber,
  validateNextDdrNumber,
  type DdrNumberingStore,
  type DdrNumberingTransaction,
  type DdrSale
} from './ddr-numbering';

class MemoryDdrStore implements DdrNumberingStore {
  sales = new Map<number, DdrSale>();
  sequences = new Map<string, number>();
  private queue = Promise.resolve();

  async transaction<T>(work: (tx: DdrNumberingTransaction) => Promise<T>): Promise<T> {
    const previous = this.queue;
    let release!: () => void;
    this.queue = new Promise<void>(resolve => { release = resolve; });
    await previous;
    try {
      const tx: DdrNumberingTransaction = {
        lockSale: async id => this.sales.get(id) ?? null,
        ensureSequence: async (companyId, year) => {
          const key = `${companyId}:${year}`;
          if (!this.sequences.has(key)) {
            const assigned = [...this.sales.values()]
              .filter(s => s.companyId === companyId && s.ddrYear === year)
              .map(s => s.ddrNumber ?? 0);
            this.sequences.set(key, Math.max(0, ...assigned) + 1);
          }
        },
        lockNextNumber: async (companyId, year) => this.sequences.get(`${companyId}:${year}`)!,
        assignSale: async (id, number, year) => {
          const sale = this.sales.get(id)!;
          sale.ddrNumber = number;
          sale.ddrYear = year;
        },
        advanceSequence: async (companyId, year, next) => {
          this.sequences.set(`${companyId}:${year}`, next);
        }
      };
      return await work(tx);
    } finally {
      release();
    }
  }
}

function sale(id: number, companyId: number, saleDate: string): DdrSale {
  return { id, companyId, saleDate, ddrNumber: null, ddrYear: null };
}

test('due assegnazioni simultanee ricevono progressivi diversi e consecutivi', async () => {
  const store = new MemoryDdrStore();
  store.sales.set(1, sale(1, 1052922, '2026-09-07'));
  store.sales.set(2, sale(2, 1052922, '2026-09-07'));

  const assigned = await Promise.all([
    ensureDdrNumber(store, 1),
    ensureDdrNumber(store, 2)
  ]);

  assert.deepEqual(assigned.map(value => value.number), [1, 2]);
});

test('la ristampa conserva il progressivo originale senza avanzare la sequenza', async () => {
  const store = new MemoryDdrStore();
  store.sales.set(1, { ...sale(1, 1052922, '2026-09-07'), ddrNumber: 17, ddrYear: 2026 });
  store.sequences.set('1052922:2026', 18);

  assert.deepEqual(await ensureDdrNumber(store, 1), { number: 17, year: 2026 });
  assert.equal(store.sequences.get('1052922:2026'), 18);
});

test('aziende diverse mantengono sequenze indipendenti', async () => {
  const store = new MemoryDdrStore();
  store.sales.set(1, sale(1, 1052922, '2026-09-07'));
  store.sales.set(2, sale(2, 1017299, '2026-09-07'));
  store.sequences.set('1052922:2026', 41);
  store.sequences.set('1017299:2026', 8);

  assert.deepEqual(await ensureDdrNumber(store, 1), { number: 41, year: 2026 });
  assert.deepEqual(await ensureDdrNumber(store, 2), { number: 8, year: 2026 });
});

test('il nuovo anno riparte dal valore configurato oppure da 1', async () => {
  const store = new MemoryDdrStore();
  store.sales.set(1, { ...sale(1, 1052922, '2027-01-01'), saleDate: new Date(2027, 0, 1) });
  store.sales.set(2, sale(2, 1017299, '2027-01-01'));
  store.sequences.set('1052922:2027', 25);

  assert.deepEqual(await ensureDdrNumber(store, 1), { number: 25, year: 2027 });
  assert.deepEqual(await ensureDdrNumber(store, 2), { number: 1, year: 2027 });
});

test('rifiuta un prossimo numero già assegnato o regressivo', () => {
  assert.throws(() => validateNextDdrNumber(12, 12), /inferiore a 13/);
  assert.throws(() => validateNextDdrNumber(7, 12), /inferiore a 13/);
  assert.equal(validateNextDdrNumber(13, 12), 13);
});