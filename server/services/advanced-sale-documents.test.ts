import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  logoFromDdt,
  normalizeSaleCustomerSnapshot,
  renderAdvancedSaleDocumentHtml,
  sendPdfBinaryResponse
} from './advanced-sale-documents';

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

test('la ristampa DDT usa identità, numero e logo congelati nello snapshot', async (t) => {
  const logoRelativePath = 'attached_assets/test-ddt-snapshot-logo.png';
  const logoAbsolutePath = path.resolve(process.cwd(), logoRelativePath);
  const frozenLogo = Buffer.from('logo-snapshot-immutabile');
  fs.writeFileSync(logoAbsolutePath, frozenLogo);
  t.after(() => fs.rmSync(logoAbsolutePath, { force: true }));

  const html = await renderAdvancedSaleDocumentHtml('ddt', {
    sale: {
      saleNumber: 'VEN-CORRENTE',
      saleDate: '2026-09-07',
      companyId: 1052922,
      customerName: 'Cliente corrente modificato',
      customerDetails: JSON.stringify({ businessName: 'Cliente corrente modificato' })
    },
    bags: [],
    operations: [],
    customer: {
      denominazione: 'Cliente corrente modificato',
      indirizzo: 'Via Corrente 99'
    },
    ddt: {
      numero: 417,
      data: '2026-08-20',
      companyId: 1017299,
      mittenteRagioneSociale: 'Emittente storico S.r.l.',
      mittenteIndirizzo: 'Via Storica 1',
      mittenteCap: '30100',
      mittenteCitta: 'Venezia',
      mittenteProvincia: 'VE',
      mittentePartitaIva: 'IT00000000001',
      clienteNome: 'Destinatario storico S.r.l.',
      clienteIndirizzo: 'Calle Snapshot 2',
      clienteCap: '30015',
      clienteCitta: 'Chioggia',
      clienteProvincia: 'VE',
      clientePaese: 'Italia',
      clientePiva: 'IT00000000002',
      mittenteLogoPath: logoRelativePath
    }
  });

  assert.match(html, /Emittente storico S\.r\.l\./);
  assert.match(html, /Destinatario storico S\.r\.l\./);
  assert.match(html, /N\. 417/);
  assert.match(html, new RegExp(frozenLogo.toString('base64')));
  assert.doesNotMatch(html, /Cliente corrente modificato|Via Corrente 99/);
});

test('un percorso logo DDT esterno agli asset consentiti viene ignorato', () => {
  assert.equal(logoFromDdt({ mittenteLogoPath: '/etc/passwd' }), '');
  assert.equal(logoFromDdt({ mittenteLogoPath: '../package.json' }), '');
});

test('la risposta documento resta PDF binario anche con un Uint8Array', () => {
  const headers = new Map<string, string | number>();
  let body: unknown;
  const response = {
    setHeader(name: string, value: string | number) {
      headers.set(name, value);
      return this;
    },
    send(value: unknown) {
      body = value;
      return this;
    }
  };
  const bytes = new Uint8Array(Buffer.from('%PDF-1.7 test'));

  const sent = sendPdfBinaryResponse(response as any, bytes, 'DDT-417');

  assert.ok(Buffer.isBuffer(sent));
  assert.ok(Buffer.isBuffer(body));
  assert.equal(headers.get('Content-Type'), 'application/pdf');
  assert.equal(headers.get('Content-Disposition'), 'inline; filename="DDT-417.pdf"');
  assert.equal(headers.get('Content-Length'), bytes.length);
});