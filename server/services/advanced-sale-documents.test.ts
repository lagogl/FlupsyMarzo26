import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSaleCustomerSnapshot } from './advanced-sale-documents';

test('normalizza lo snapshot di un cliente inserito manualmente per DDT e documenti', () => {
  assert.deepEqual(
    normalizeSaleCustomerSnapshot(JSON.stringify({
      businessName: 'Cliente Manuale',
      details: 'Via Laguna 10',
      city: 'Chioggia',
      postalCode: '30015',
      province: 'VE',
      vatNumber: 'IT01234567890',
      taxCode: 'RSSMRA80A01C638X',
      farmCode: 'AL-42'
    })),
    {
      name: 'Cliente Manuale',
      address: 'Via Laguna 10',
      city: 'Chioggia',
      postalCode: '30015',
      province: 'VE',
      country: 'Italia',
      vatNumber: 'IT01234567890',
      taxCode: 'RSSMRA80A01C638X',
      phone: '',
      email: '',
      farmCode: 'AL-42',
      productionZone: ''
    }
  );
});

test('mantiene compatibili gli alias anagrafici esistenti', () => {
  const snapshot = normalizeSaleCustomerSnapshot({
    denominazione: 'Cliente Storico',
    indirizzo: 'Via Roma 1',
    comune: 'Venezia',
    cap: '30100',
    provincia: 'VE',
    piva: '01234567890',
    codiceFiscale: '01234567890',
    paese: 'Italia'
  });

  assert.equal(snapshot.name, 'Cliente Storico');
  assert.equal(snapshot.address, 'Via Roma 1');
  assert.equal(snapshot.postalCode, '30100');
  assert.equal(snapshot.vatNumber, '01234567890');
});

test('gestisce uno snapshot storico non JSON senza causare errore', () => {
  const snapshot = normalizeSaleCustomerSnapshot('Via del Porto 5', 'Cliente Legacy');
  assert.equal(snapshot.name, 'Cliente Legacy');
  assert.equal(snapshot.address, 'Via del Porto 5');
});