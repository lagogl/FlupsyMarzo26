import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canClaimSaleEmail } from './sale-email-delivery';

test('automatic email is allowed only once for a new sale', () => {
  assert.equal(canClaimSaleEmail(undefined, false, ''), true);
  for (const state of ['sent', 'failed', 'unknown', 'preparing', 'sending'] as const) {
    assert.equal(canClaimSaleEmail({ state, startedAt: '2026-09-26T00:00:00Z' }, false, ''), false);
  }
});

test('manual resend needs a reason and blocks concurrent sending', () => {
  assert.throws(() => canClaimSaleEmail(undefined, true, 'no'), /motivo/);
  assert.throws(() => canClaimSaleEmail(
    { state: 'sending', startedAt: '2026-09-26T10:00:00Z' },
    true, 'Verificato Gmail'
  ), /Invio in corso/);
});

test('manual resend allows checked exceptions, but never automatic retries', () => {
  for (const state of ['sent', 'failed', 'unknown'] as const) {
    assert.equal(canClaimSaleEmail({ state, startedAt: '2026-09-26T10:59:00Z' }, true, 'Verificato Gmail'), true);
  }
  assert.throws(() => canClaimSaleEmail({ state: 'sending', startedAt: '2026-09-26T10:00:00Z' }, true, 'Verificato Gmail'));
  assert.throws(() => canClaimSaleEmail({ state: 'sending', startedAt: 'invalid' }, true, 'Verificato Gmail'));
});