import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  abbreviateFlupsyName,
  buildAdvancedDdtSubject,
  buildFicDdtCustomerEntity,
  buildFicDdtHeader,
  formatFlupsyBasketIdentifier,
  logoFromDdt,
  mergeSaleCustomerData,
  normalizeSaleCustomerSnapshot,
  renderAdvancedSaleDocumentHtml,
  sendPdfBinaryResponse
} from './advanced-sale-documents';

test('abbrevia il nome FLUPSY senza perdere il riferimento alla cesta', () => {
  assert.equal(abbreviateFlupsyName('Flupsy 1 Bianco Vetroresina'), 'F. 1 Bianco VTR');
  assert.equal(abbreviateFlupsyName('Ca Pisani'), 'F. Ca Pisani');
});

test('formatta il riferimento FLUPSY/cesta nel formato compatto dei documenti', () => {
  assert.equal(formatFlupsyBasketIdentifier('Flupsy 1 Bianco Vetroresina', 3), 'F1C3');
  assert.equal(formatFlupsyBasketIdentifier('F. 2 nero PVC', 7), 'F2C7');
  assert.equal(formatFlupsyBasketIdentifier('Ca Pisani', 4), 'C4');
});

test('completa via e codice allevamento usando solo i campi mancanti', () => {
  const customer = mergeSaleCustomerData(
    { businessName: 'Cliente storico', vatNumber: '01234567890' },
    { denominazione: 'Cliente locale', comune: 'Goro', cap: '44020' },
    { address_street: 'Via del Porto 7', code: '025FE999' }
  );
  assert.equal(customer.name, 'Cliente storico');
  assert.equal(customer.address, 'Via del Porto 7');
  assert.equal(customer.city, 'Goro');
  assert.equal(customer.postalCode, '44020');
  assert.equal(customer.farmCode, '025FE999');
});

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
      certifiedEmail: '',
      eInvoiceCode: '',
      ficClientId: '',
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

test('normalizza i contatti fiscali completi restituiti da FIC', () => {
  const snapshot = normalizeSaleCustomerSnapshot({
    ficClientId: 321,
    email: 'amministrazione@example.it',
    certified_email: 'cliente@pec.example.it',
    ei_code: 'ABC1234',
    phone: '+39 041 0000000'
  });

  assert.equal(snapshot.ficClientId, '321');
  assert.equal(snapshot.email, 'amministrazione@example.it');
  assert.equal(snapshot.certifiedEmail, 'cliente@pec.example.it');
  assert.equal(snapshot.eInvoiceCode, 'ABC1234');
  assert.equal(snapshot.phone, '+39 041 0000000');
});

test('costruisce oggetto, causale e anagrafica completa per il payload DDT FIC', () => {
  const oggetto = buildAdvancedDdtSubject('VAV-000114');
  const header = buildFicDdtHeader({ oggetto, causaleTrasporto: 'Vendita' });
  const entity = buildFicDdtCustomerEntity({
    clienteFattureInCloudId: 321,
    clienteNome: 'Cliente S.r.l.',
    clienteIndirizzo: 'Via Laguna 10',
    clienteCitta: 'Chioggia',
    clienteCap: '30015',
    clienteProvincia: 'VE',
    clientePaese: 'Italia',
    clientePiva: '01234567890',
    clienteCodiceFiscale: '01234567890',
    clienteEmail: 'amministrazione@example.it',
    clientePec: 'cliente@pec.example.it',
    clienteTelefono: '+39 041 0000000',
    clienteCodiceDestinatario: 'ABC1234'
  });

  assert.deepEqual(header, {
    subject: 'Fornitura molluschi - vendita VAV-000114',
    visible_subject: 'Fornitura molluschi - vendita VAV-000114',
    dn_ai_causal: 'Vendita'
  });
  assert.deepEqual(entity, {
    name: 'Cliente S.r.l.',
    address_street: 'Via Laguna 10',
    address_city: 'Chioggia',
    address_postal_code: '30015',
    address_province: 'VE',
    country: 'Italia',
    vat_number: '01234567890',
    tax_code: '01234567890',
    email: 'amministrazione@example.it',
    certified_email: 'cliente@pec.example.it',
    phone: '+39 041 0000000',
    ei_code: 'ABC1234',
    id: 321
  });
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
  assert.match(logoFromDdt({ mittenteLogoPath: '/etc/passwd', companyId: 1052922 }), /^data:image\/png;base64,/);
  assert.match(logoFromDdt({ mittenteLogoPath: '../package.json', companyId: 1017299 }), /^data:image\/png;base64,/);
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

test('i documenti mostrano l’origine congelata del sacco', async () => {
  const html = await renderAdvancedSaleDocumentHtml('ddt', {
    sale: {
      saleNumber: 'VEN-SNAPSHOT',
      saleDate: '2026-09-08',
      companyId: 1052922
    },
    bags: [{
      bagNumber: 1,
      originalWeight: 2,
      totalWeight: 2,
      animalCount: 2000,
      animalsPerKg: 1000,
      sizeCode: 'M',
      origins: [{ flupsyName: 'FLUPSY 2 STORICO', basketPhysicalNumber: 17 }]
    }],
    operations: [],
    ddt: {
      numero: 1,
      data: '2026-09-08',
      mittenteRagioneSociale: 'Venditore',
      clienteNome: 'Cliente'
    }
  });

  assert.match(html, /F2C17/);
});
