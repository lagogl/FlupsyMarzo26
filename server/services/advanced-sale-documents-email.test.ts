import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatSaleWeightKg } from './advanced-sale-documents-email';

test('the sale email displays grams as kilograms exactly once', () => {
  assert.equal(formatSaleWeightKg(268800), '268,80 kg');
  assert.equal(formatSaleWeightKg('268800'), '268,80 kg');
  assert.equal(formatSaleWeightKg(1000), '1,00 kg');
  assert.throws(() => formatSaleWeightKg('invalid'));
});