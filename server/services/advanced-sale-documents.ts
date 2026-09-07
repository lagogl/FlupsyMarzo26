import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { getCompanyFiscalData, getCompanyLogoBase64, hasCompanyLogo } from './logo-service';
import { pdfGenerator } from './pdf-generator';

export type AdvancedSaleDocumentKind = 'delivery-report' | 'sale-conditions' | 'bivalve-transfer' | 'ddt';

export interface AdvancedSaleDocumentData {
  sale: any;
  bags: any[];
  operations: any[];
  customer?: any;
  ddt?: any;
  traceabilityUrl?: string;
}

const PRODUCT_NAME = 'Seme vivo di vongola verace destinato alla reimmersione';
const SCIENTIFIC_NAME = 'Ruditapes philippinarum';
const blank = '<span class="write-line"></span>';

const esc = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
}[character] || character));
const num = (value: unknown, decimals = 0) => Number(value || 0).toLocaleString('it-IT', {
  minimumFractionDigits: decimals,
  maximumFractionDigits: decimals
});
const displayDate = (value?: string | Date | null) => {
  if (!value) return '________________';
  const parsed = value instanceof Date ? value : new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? esc(value) : format(parsed, 'dd/MM/yyyy', { locale: it });
};
const present = (value: unknown) => {
  const text = String(value ?? '').trim();
  return !text || text === 'N/A' ? '________________' : esc(text);
};

function parseDetails(value: any): any {
  if (!value) return {};
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return { details: value }; }
}

function buildBuyer(data: AdvancedSaleDocumentData) {
  if (data.ddt) {
    return {
      name: data.ddt.clienteNome,
      address: data.ddt.clienteIndirizzo,
      city: data.ddt.clienteCitta,
      postalCode: data.ddt.clienteCap,
      province: data.ddt.clienteProvincia,
      country: data.ddt.clientePaese,
      vatNumber: data.ddt.clientePiva,
      taxCode: data.ddt.clienteCodiceFiscale,
      phone: '',
      email: '',
      farmCode: '',
      productionZone: ''
    };
  }
  const snapshot = parseDetails(data.sale.customerDetails);
  const customer = data.customer || {};
  return {
    name: snapshot.businessName || snapshot.name || customer.denominazione || data.sale.customerName,
    address: snapshot.address || customer.indirizzo || snapshot.details,
    city: snapshot.city || customer.comune,
    postalCode: snapshot.postalCode || snapshot.cap || customer.cap,
    province: snapshot.province || snapshot.provincia || customer.provincia,
    country: snapshot.country || customer.paese || 'Italia',
    vatNumber: snapshot.vatNumber || snapshot.piva || customer.piva,
    taxCode: snapshot.taxCode || snapshot.codiceFiscale || customer.codiceFiscale,
    phone: snapshot.phone || customer.telefono,
    email: snapshot.email || customer.email,
    farmCode: snapshot.farmCode || snapshot.codiceAllevamento || '',
    productionZone: snapshot.productionZone || snapshot.zonaProduzione || ''
  };
}

function companyFromDdt(ddt: any) {
  return {
    ragioneSociale: ddt.mittenteRagioneSociale,
    indirizzo: ddt.mittenteIndirizzo,
    cap: ddt.mittenteCap,
    citta: ddt.mittenteCitta,
    provincia: ddt.mittenteProvincia,
    partitaIva: ddt.mittentePartitaIva,
    codiceFiscale: ddt.mittenteCodiceFiscale,
    telefono: ddt.mittenteTelefono,
    email: ddt.mittenteEmail
  };
}

function logoFromDdt(ddt: any, companyId: unknown): string {
  const storedPath = String(ddt?.mittenteLogoPath || '').trim();
  if (storedPath) {
    const absolutePath = path.isAbsolute(storedPath)
      ? storedPath
      : path.resolve(process.cwd(), storedPath.replace(/^\/+/, ''));
    const allowedRoots = [
      path.resolve(process.cwd(), 'attached_assets'),
      path.resolve(process.cwd(), 'client/public')
    ];
    if (allowedRoots.some(root => absolutePath.startsWith(`${root}${path.sep}`)) && fs.existsSync(absolutePath)) {
      const mime = absolutePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      return `data:${mime};base64,${fs.readFileSync(absolutePath).toString('base64')}`;
    }
  }
  return getCompanyLogoBase64(companyId);
}

function farmCodeForCompany(companyId: unknown): string {
  return ['13263', '1052922'].includes(String(companyId)) ? '025FE127' : '';
}

function productRows(bags: any[]) {
  return bags.map((bag, index) => {
    const gross = Number(bag.originalWeight ?? bag.totalWeight ?? 0);
    const net = Number(bag.totalWeight ?? gross);
    const loss = Number(bag.weightLoss ?? Math.max(0, gross - net));
    const identifiers = [
      `Sacco ${bag.bagNumber || index + 1}`,
      bag.basketNumbers?.length ? `Ceste ${bag.basketNumbers.join(', ')}` : ''
    ].filter(Boolean).join(' · ');
    return `<tr>
      <td class="left"><strong>${esc(identifiers)}</strong></td>
      <td>${num(gross, 2)}</td><td>${num(loss, 2)}</td><td>${num(net, 2)}</td>
      <td>${num(bag.wastePercentage, 1)}%</td><td>${num(bag.animalsPerKg)}</td>
      <td>${num(bag.animalCount)}</td><td><strong>${esc(bag.sizeCode || '—')}</strong></td>
    </tr>`;
  }).join('');
}

function productsTable(data: AdvancedSaleDocumentData) {
  const gross = data.bags.reduce((sum, bag) => sum + Number(bag.originalWeight ?? bag.totalWeight ?? 0), 0);
  const net = data.bags.reduce((sum, bag) => sum + Number(bag.totalWeight ?? 0), 0);
  const loss = data.bags.reduce((sum, bag) => sum + Number(bag.weightLoss ?? 0), 0);
  const animals = data.bags.reduce((sum, bag) => sum + Number(bag.animalCount || 0), 0);
  return `<table class="products"><thead><tr>
    <th class="left">Collo / identificativo</th><th>Peso lordo kg</th><th>Scarto kg</th>
    <th>Peso netto kg</th><th>Scarto %</th><th>Pz/kg</th><th>N. animali</th><th>Taglia</th>
  </tr></thead><tbody>${productRows(data.bags)}<tr class="total">
    <td class="left">Totale · ${data.bags.length} colli</td><td>${num(gross, 2)}</td><td>${num(loss, 2)}</td>
    <td>${num(net, 2)}</td><td>${gross ? num((loss / gross) * 100, 1) : '0,0'}%</td>
    <td>${net ? num(animals / net) : '—'}</td><td>${num(animals)}</td><td>—</td>
  </tr></tbody></table>`;
}

function partyBlock(title: string, party: any, farmCode = '', extra = '') {
  const locality = [party.postalCode || party.cap, party.city || party.citta, party.province ? `(${party.province})` : '']
    .filter(Boolean).join(' ');
  return `<div class="party"><div class="box-title">${title}</div>
    <div class="party-name">${present(party.name || party.ragioneSociale)}</div>
    <div><strong>Indirizzo:</strong> ${present(party.address || party.indirizzo)}</div>
    <div><strong>Località:</strong> ${present(locality)}</div>
    <div>P. IVA: ${present(party.vatNumber || party.partitaIva)}${party.taxCode || party.codiceFiscale ? ` · C.F.: ${present(party.taxCode || party.codiceFiscale)}` : ''}</div>
    <div>Codice allevamento: ${farmCode ? esc(farmCode) : '________________'}</div>${extra}</div>`;
}

function page(title: string, subtitle: string, company: any, logo: string, body: string, reference: string) {
  const companyAddress = [company.indirizzo, company.cap, company.citta, company.provincia ? `(${company.provincia})` : '']
    .filter(Boolean).join(' ');
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><style>
    @page{size:A4;margin:10mm 11mm 11mm}*{box-sizing:border-box}body{margin:0;color:#183044;font-family:Arial,Helvetica,sans-serif;font-size:8.2pt;line-height:1.28}
    header{display:flex;align-items:flex-start;justify-content:space-between;border-top:4px solid #087f83;padding:7px 0 8px;min-height:66px}.logo{width:auto;max-width:230px;max-height:62px;object-fit:contain;object-position:left top}.issuer{text-align:right;color:#4d6270;font-size:7.4pt;max-width:55%}.issuer strong{display:block;color:#183044;font-size:9.2pt}
    .document-title{background:linear-gradient(100deg,#e4f3f1,#f4f8f8);border-left:4px solid #087f83;padding:7px 9px;margin:4px 0 8px}.document-title h1{margin:0;text-transform:uppercase;font-size:13.2pt;letter-spacing:.035em}.document-title p{margin:2px 0 0;color:#55707b}
    .meta,.parties,.two,.three{display:grid;gap:6px}.meta,.parties,.two{grid-template-columns:1fr 1fr}.three{grid-template-columns:1fr 1fr 1fr}.box,.party{border:1px solid #82949e;margin:6px 0}.party{padding:0 6px 6px;min-height:92px}.box-title{margin:0 -6px 5px;padding:3px 6px;background:#edf3f3;border-bottom:1px solid #a9b7bd;color:#2d4d5d;font-size:6.9pt;font-weight:bold;text-transform:uppercase;letter-spacing:.05em}.party-name{font-size:9pt;font-weight:bold;margin-bottom:2px}
    .field{border:1px solid #aab7bd;padding:5px 6px;min-height:38px}.label{display:block;color:#60727c;font-size:6.6pt;font-weight:bold;text-transform:uppercase;letter-spacing:.035em}.value{display:block;margin-top:2px;font-weight:bold;font-size:8.4pt}.write-line{display:inline-block;min-width:105px;height:11px;border-bottom:1px solid #526771;vertical-align:bottom}
    table{width:100%;border-collapse:collapse;margin:7px 0}th{padding:4px 3px;background:#184f63;color:white;font-size:6.3pt;text-transform:uppercase;text-align:right}th.left,td.left{text-align:left}td{border:1px solid #a9b8be;padding:4px 3px;text-align:right;font-size:7.2pt}.total td{font-weight:bold;background:#eef4f4}
    .legal{border:1px solid #91a1a8;padding:7px 9px;margin-top:6px}.legal ol{margin:3px 0 0;padding-left:17px}.legal li{margin:4px 0}.legal strong{color:#174f62}.intro{margin:6px 0}.checks{letter-spacing:.02em;word-spacing:3px}
    .signatures{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:17px;break-inside:avoid}.signature{padding-top:55px;border-bottom:1px solid #405b67;text-align:center}.signature-note{text-align:center;color:#60717a;font-size:6.8pt;margin-top:2px}
    .traceability{border:1px solid #79aaa9;background:#eef8f6;border-radius:5px;padding:6px;display:flex;align-items:center;gap:8px;min-height:72px}.traceability img{width:62px;height:62px;background:white}.traceability strong{display:block;font-size:7.2pt;line-height:1.25;margin:2px 0}.traceability small{display:block;color:#597078;font-size:6.4pt}
    footer{display:flex;justify-content:space-between;border-top:1px solid #b6c1c5;color:#677982;font-size:6.4pt;margin-top:9px;padding-top:4px}.avoid{break-inside:avoid}
    @media print{header,.document-title,th,.box-title,.total td{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><header><div>${logo ? `<img class="logo" src="${logo}" alt="Logo">` : ''}</div>
  <div class="issuer"><strong>${present(company.ragioneSociale || company.name)}</strong>${present(companyAddress)}<br>P. IVA ${present(company.partitaIva)}${company.codiceFiscale ? ` · C.F. ${present(company.codiceFiscale)}` : ''}<br>${company.email ? present(company.email) : ''}${company.telefono ? ` · ${present(company.telefono)}` : ''}</div></header>
  <section class="document-title"><h1>${title}</h1><p>${subtitle}</p></section>${body}
  <footer><span>${PRODUCT_NAME} · <em>${SCIENTIFIC_NAME}</em></span><span>Rif. ${esc(reference)} · Generato ${format(new Date(), 'dd/MM/yyyy HH:mm')}</span></footer></body></html>`;
}

export async function generateAdvancedSaleDocument(
  kind: AdvancedSaleDocumentKind,
  data: AdvancedSaleDocumentData
): Promise<Buffer> {
  const fiscal = data.ddt ? null : await getCompanyFiscalData(data.sale.companyId);
  if (!data.ddt && (!fiscal || !hasCompanyLogo(data.sale.companyId))) {
    throw new Error(`Azienda emittente non configurata per la vendita ${data.sale.saleNumber}`);
  }
  const company = data.ddt ? companyFromDdt(data.ddt) : fiscal;
  if (!company?.ragioneSociale) {
    throw new Error(`Snapshot emittente incompleto per la vendita ${data.sale.saleNumber}`);
  }
  const logo = data.ddt
    ? logoFromDdt(data.ddt, data.ddt.companyId || data.sale.companyId)
    : getCompanyLogoBase64(data.sale.companyId);
  const buyer = buildBuyer(data);
  const companyFarmCode = farmCodeForCompany(data.sale.companyId);
  const reference = data.sale.saleNumber;
  const ddtNumber = data.ddt?.numero ? `N. ${data.ddt.numero}` : `Bozza · Rif. ${reference}`;
  const seller = partyBlock('Cedente / produttore', company, companyFarmCode);
  const recipient = partyBlock('Acquirente / destinatario', buyer, buyer.farmCode,
    buyer.productionZone ? `<div>Zona di produzione: ${esc(buyer.productionZone)}</div>` : '');
  const meta = `<div class="meta"><div class="field"><span class="label">Vendita</span><span class="value">${esc(reference)}</span></div>
    <div class="field"><span class="label">Data vendita / consegna</span><span class="value">${displayDate(data.sale.saleDate)}</span></div></div>`;
  const products = productsTable(data);
  const traceabilityQr = kind === 'delivery-report' && data.traceabilityUrl
    ? await QRCode.toDataURL(data.traceabilityUrl, {
        errorCorrectionLevel: 'M',
        width: 320,
        margin: 1,
        color: { dark: '#12384B', light: '#FFFFFF' }
      })
    : '';
  let title: string;
  let subtitle: string;
  let body: string;

  if (kind === 'delivery-report') {
    title = 'Rapporto di consegna';
    subtitle = `Riferimento ordine ${blank} · consegna del ${displayDate(data.sale.saleDate)}`;
    body = `${meta}<div class="parties">${seller}${recipient}</div>${products}
      <div class="two avoid"><div><div class="field"><span class="label">Luogo e ora della consegna</span><span class="value">${blank} · ore ${blank}</span></div>
      <div class="field"><span class="label">Osservazioni alla consegna</span><span class="value">${present(data.sale.notes)}</span></div></div>
      ${traceabilityQr ? `<div class="traceability"><img src="${traceabilityQr}" alt="QR tracciabilità"><div><span class="label">Scopri la storia del lotto</span><strong>Scansiona il QR per consultare il percorso di crescita e i controlli del seme vivo consegnato.</strong><small>Codice tracciabilità: ${esc(reference)}</small></div></div>` : ''}</div>
      <div class="signatures"><div><div class="signature">Firma del cedente</div><div class="signature-note">Nome leggibile e firma</div></div>
      <div><div class="signature">Firma per ricevuta dell'acquirente</div><div class="signature-note">Il cliente conferma quantità e stato apparente alla consegna</div></div></div>`;
  } else if (kind === 'sale-conditions') {
    title = 'Dichiarazione di vendita e condizioni contrattuali';
    subtitle = `${PRODUCT_NAME} · ${SCIENTIFIC_NAME}`;
    body = `<div class="parties">${seller}${recipient}</div>${meta}<p class="intro">Il venditore dichiara di cedere il prodotto descritto, costituito da organismi biologicamente vivi e soggetto a naturale variabilità e a fattori ambientali e gestionali successivi alla consegna.</p>${products}
      <section class="legal avoid"><span class="label">Condizioni contrattuali</span><ol>
      <li><strong>Accettazione del prodotto.</strong> La vendita è effettuata con accettazione da parte dell'acquirente del prodotto nello stato di fatto in cui si trova al momento della consegna.</li>
      <li><strong>Trasferimento del rischio.</strong> Il rischio relativo al deperimento, alla mortalità, alla perdita di vitalità e alle alterazioni biologiche si trasferisce all'acquirente dal momento della consegna.</li>
      <li><strong>Esclusione di responsabilità post-consegna.</strong> Dalla consegna il venditore non assume responsabilità sulla sopravvivenza, crescita, adattamento o risultato produttivo dipendenti da fattori esterni.</li>
      <li><strong>Conformità alla consegna.</strong> Il venditore garantisce la conformità del prodotto al momento della consegna nei limiti delle caratteristiche dichiarate.</li>
      <li><strong>Limiti di responsabilità.</strong> Le limitazioni operano nei limiti consentiti dalla normativa vigente e non si estendono ai casi di dolo o colpa grave.</li>
      <li><strong>Accettazione e responsabilità dell'acquirente.</strong> L'acquirente dichiara di accettare il prodotto e di assumersi la responsabilità della gestione successiva alla consegna.</li>
      </ol></section><div class="three avoid"><div class="field"><span class="label">Luogo</span><span class="value">${blank}</span></div>
      <div class="field"><span class="label">Data</span><span class="value">${displayDate(data.sale.saleDate)}</span></div>
      <div class="field"><span class="label">Riferimento documento</span><span class="value">${esc(reference)}</span></div></div>
      <div class="signatures"><div><div class="signature">Il venditore</div><div class="signature-note">Nome leggibile e firma</div></div>
      <div><div class="signature">L'acquirente per integrale accettazione</div><div class="signature-note">Nome leggibile e firma</div></div></div>`;
  } else if (kind === 'bivalve-transfer') {
    title = 'Documento di registrazione per il trasferimento di molluschi bivalvi vivi';
    const ddrReference = data.sale.ddrNumber && data.sale.ddrYear
      ? `DDR n. ${data.sale.ddrNumber}/${data.sale.ddrYear}`
      : `DDR · Rif. ${reference}`;
    subtitle = `${ddrReference} · novellame destinato alla reimmersione`;
    const origin = data.operations.map(operation =>
      `Cesta ${operation.basketPhysicalNumber || operation.basketId}${operation.date ? ` (${displayDate(operation.date)})` : ''}`
    ).join(', ') || '________________';
    body = `<div class="parties">${seller}${recipient}</div>
      <div class="two"><div class="field"><span class="label">Persona delegata alla firma</span><span class="value">${blank}</span></div>
      <div class="field"><span class="label">Data di raccolta / preparazione</span><span class="value">${displayDate(data.sale.saleDate)}</span></div></div>
      <div class="box"><div class="box-title">Origine dei molluschi bivalvi vivi (novellame)</div><div class="two">
      <div class="field"><span class="label">Zona classificata — tipo</span><span class="value checks">□ A &nbsp; □ B &nbsp; □ C &nbsp; □ Non classificata</span></div>
      <div class="field"><span class="label">Provenienza novellame</span><span class="value checks">□ Schiuditoio &nbsp; ☒ Preingrasso</span></div>
      <div class="field"><span class="label">Codice allevamento origine</span><span class="value">${companyFarmCode || blank}</span></div>
      <div class="field"><span class="label">Tracciabilità interna origine</span><span class="value">${esc(origin)}</span></div></div></div>
      <div class="two"><div class="field"><span class="label">Specie (nome scientifico)</span><span class="value"><em>${SCIENTIFIC_NAME}</em></span></div>
      <div class="field"><span class="label">Descrizione</span><span class="value">${PRODUCT_NAME}</span></div></div>${products}
      <div class="box"><div class="box-title">Ricezione e trasporto</div><div class="two">
      <div class="field"><span class="label">Timbro e data di arrivo del lotto</span><span class="value">${blank}</span></div>
      <div class="field"><span class="label">Numero di registro del destinatario</span><span class="value">${blank}</span></div>
      <div class="field"><span class="label">Identificazione vettore / targa</span><span class="value">${blank}</span></div>
      <div class="field"><span class="label">Punto di sbarco / scarico</span><span class="value">${blank}</span></div></div></div>
      <div class="signatures"><div><div class="signature">Firma del responsabile alla consegna</div></div>
      <div><div class="signature">Firma del destinatario / registro</div></div></div>`;
  } else {
    title = 'Documento di trasporto (D.D.T.)';
    subtitle = `${ddtNumber} · del ${displayDate(data.ddt?.data || data.sale.saleDate)}`;
    body = `<div class="parties">${seller}${recipient}</div>
      <div class="two"><div class="field"><span class="label">Causale del trasporto</span><span class="value">Vendita</span></div>
      <div class="field"><span class="label">Trasporto a mezzo</span><span class="value checks">□ Cedente &nbsp; □ Cessionario &nbsp; □ Vettore</span></div></div>
      <div class="two"><div class="field"><span class="label">Consegna / inizio trasporto</span><span class="value">${displayDate(data.sale.saleDate)} · ore ${blank}</span></div>
      <div class="field"><span class="label">Mezzo e targa</span><span class="value">${blank}</span></div></div>
      <div class="field"><span class="label">Descrizione dei beni</span><span class="value">${PRODUCT_NAME} · <em>${SCIENTIFIC_NAME}</em></span></div>${products}
      <div class="two avoid"><div class="field"><span class="label">Aspetto esteriore dei beni</span><span class="value">Colli / sacchi</span></div>
      <div class="field"><span class="label">Note</span><span class="value">${present(data.sale.notes)}</span></div></div>
      <div class="signatures"><div><div class="signature">Firma del conducente / cedente</div></div>
      <div><div class="signature">Firma del cessionario per ricevuta</div></div></div>`;
  }

  return pdfGenerator.generateFromHTML(page(title, subtitle, company, logo, body, reference), {
    format: 'A4',
    preferCSSPageSize: true,
    printBackground: true,
    margin: { top: '6mm', right: '6mm', bottom: '6mm', left: '6mm' }
  });
}