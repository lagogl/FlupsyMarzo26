import test from 'node:test';
import assert from 'node:assert/strict';
import {
  allocateIntegerByWeight,
  buildCycleCode,
  getRestoreBlockReason,
  validateBasketAllocationLimits,
  validateManualSaleBags
} from './manual-sale-accounting';

test('accetta un sacco aggregato allocato su più ceste della vendita', () => {
  const error = validateManualSaleBags([
    {
      animalCount: 1000,
      allocations: [
        { sourceOperationId: 10, sourceBasketId: 1, allocatedAnimals: 600 },
        { sourceOperationId: 20, sourceBasketId: 2, allocatedAnimals: 400 }
      ]
    }
  ], [
    { operationId: 10, basketId: 1 },
    { operationId: 20, basketId: 2 }
  ]);
  assert.equal(error, null);
});

test('rifiuta una cesta sovra-allocata anche se il totale globale coincide', () => {
  const bags = [{
    animalCount: 1000,
    allocations: [
      { sourceOperationId: 10, sourceBasketId: 1, allocatedAnimals: 700 },
      { sourceOperationId: 20, sourceBasketId: 2, allocatedAnimals: 300 }
    ]
  }];
  assert.match(validateBasketAllocationLimits(bags, [
    { operationId: 10, basketId: 1, originalAnimals: 600 },
    { operationId: 20, basketId: 2, originalAnimals: 400 }
  ], 0) || '', /supera/);
});

test('ripartisce anche l’eccedenza positiva senza concentrarla su una cesta', () => {
  const sources = [
    { operationId: 10, basketId: 1, originalAnimals: 600 },
    { operationId: 20, basketId: 2, originalAnimals: 400 }
  ];
  assert.equal(validateBasketAllocationLimits([{
    animalCount: 1010,
    allocations: [
      { sourceOperationId: 10, sourceBasketId: 1, allocatedAnimals: 606 },
      { sourceOperationId: 20, sourceBasketId: 2, allocatedAnimals: 404 }
    ]
  }], sources, 10), null);
  assert.match(validateBasketAllocationLimits([{
    animalCount: 1010,
    allocations: [
      { sourceOperationId: 10, sourceBasketId: 1, allocatedAnimals: 610 },
      { sourceOperationId: 20, sourceBasketId: 2, allocatedAnimals: 400 }
    ]
  }], sources, 10) || '', /supera/);
});

test('rifiuta totali discordanti e fonti estranee alla vendita', () => {
  assert.match(
    validateManualSaleBags([
      {
        animalCount: 1000,
        allocations: [{ sourceOperationId: 10, sourceBasketId: 1, allocatedAnimals: 999 }]
      }
    ], [{ operationId: 10, basketId: 1 }]) || '',
    /non corrispondono/
  );

  assert.match(
    validateManualSaleBags([
      {
        animalCount: 1000,
        allocations: [{ sourceOperationId: 99, sourceBasketId: 9, allocatedAnimals: 1000 }]
      }
    ], [{ operationId: 10, basketId: 1 }]) || '',
    /estranea/
  );
});

test('ripartisce un totale intero tra lotti senza perdere unità', () => {
  const result = allocateIntegerByWeight(101, [
    { lotId: 1, weight: 60 },
    { lotId: 2, weight: 40 }
  ]);
  assert.deepEqual(result.map(item => item.quantity), [60, 41]);
  assert.equal(result.reduce((sum, item) => sum + item.quantity, 0), 101);
});

test('ricostruisce il codice ciclo e blocca ceste già riutilizzate', () => {
  assert.equal(buildCycleCode(12, 4, '2026-08-18'), '12-4-2608');
  assert.equal(getRestoreBlockReason({
    physicalNumber: 12,
    basketState: 'available',
    currentCycleId: null,
    cycleState: 'closed',
    cycleId: 88
  }), null);
  assert.match(getRestoreBlockReason({
    physicalNumber: 12,
    basketState: 'active',
    currentCycleId: 99,
    cycleState: 'closed',
    cycleId: 88
  }) || '', /riutilizzata/);
});