import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveFicFarmCode,
  shouldFetchFicClientDetail
} from './fic-customer-farm-code';

test('preserva il codice allevamento locale quando la lista FIC omette code', () => {
  assert.equal(resolveFicFarmCode(undefined, '025FE126'), '025FE126');
  assert.equal(resolveFicFarmCode('', '025FE126'), '025FE126');
});

test('preferisce il Codice cliente interno restituito dal dettaglio FIC', () => {
  assert.equal(resolveFicFarmCode(' 025FE999 ', '025FE126'), '025FE999');
});

test('recupera il dettaglio solo se indirizzo o codice allevamento sono incompleti', () => {
  const complete = {
    address_street: 'Via Laguna 1',
    address_postal_code: '44020',
    code: ''
  };
  assert.equal(shouldFetchFicClientDetail(complete, '025FE126'), false);
  assert.equal(shouldFetchFicClientDetail(complete, ''), true);
  assert.equal(shouldFetchFicClientDetail({ ...complete, code: '025FE999' }, ''), false);
  assert.equal(shouldFetchFicClientDetail({ ...complete, address_street: '' }, '025FE126'), true);
});