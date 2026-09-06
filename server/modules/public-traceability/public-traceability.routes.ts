import { Router } from 'express';
import { asc, eq, sql } from 'drizzle-orm';
import { db } from '../../db';
import {
  advancedSales, ddt, fattureInCloudConfig, saleBags
} from '../../../shared/schema';
import { getCompanyLogoBase64 } from '../../services/logo-service';
import { readPublicTraceabilityToken } from '../../services/public-traceability-token';

export const publicTraceabilityRoutes = Router();

const esc = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
}[character] || character));
const formatDate = (value: unknown) => {
  const text = String(value || '');
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : 'Data non disponibile';
};
const number = (value: unknown, decimals = 0) => Number(value || 0).toLocaleString('it-IT', {
  minimumFractionDigits: decimals, maximumFractionDigits: decimals
});

function milestoneLabel(type: string) {
  if (type.includes('prima-attivazione') || type === 'attivazione') return ['Ingresso nel ciclo di crescita', 'Il lotto è stato preso in carico e avviato al preingrasso.'];
  if (type.includes('vagliatura') || type.includes('selezione')) return ['Selezione e uniformazione', 'Gli animali sono stati selezionati per accompagnarne una crescita uniforme.'];
  if (type.includes('trasferimento')) return ['Proseguimento del percorso', 'Il lotto è stato trasferito in un ambiente idoneo alla fase successiva.'];
  if (type.includes('misura') || type.includes('controllo')) return ['Controllo di crescita', 'Peso e densità sono stati monitorati durante il percorso produttivo.'];
  return ['Monitoraggio del lotto', 'È stato registrato un controllo lungo il percorso di allevamento.'];
}

function renderPage(data: any) {
  const { sale, bags, lotRows, history, company, logo } = data;
  const grossWeight = bags.reduce((sum: number, bag: any) => sum + Number(bag.originalWeight || bag.totalWeight || 0), 0);
  const netWeight = bags.reduce((sum: number, bag: any) => sum + Number(bag.totalWeight || 0), 0);
  const animals = bags.reduce((sum: number, bag: any) => sum + Number(bag.animalCount || 0), 0);
  const sizesList = [...new Set(bags.map((bag: any) => bag.sizeCode).filter(Boolean))].join(' · ');
  const timeline = [
    ...lotRows.map((lot: any) => ({
      date: lot.arrivalDate,
      title: 'Origine e presa in carico',
      text: `Lotto di seme vivo proveniente da ${lot.origin || lot.supplier || 'filiera controllata'}, registrato all’ingresso.`
    })),
    ...history.map((item: any) => {
      const [title, text] = milestoneLabel(item.type || '');
      const detail = item.sizeCode ? ` Taglia rilevata: ${item.sizeCode}${item.animalsPerKg ? `, circa ${number(item.animalsPerKg)} animali/kg` : ''}.` : '';
      return { date: item.date, title, text: `${text}${detail}` };
    }),
    {
      date: sale.saleDate,
      title: 'Preparazione e consegna',
      text: `${bags.length} ${bags.length === 1 ? 'collo preparato' : 'colli preparati'} per la reimmersione, con controllo conclusivo di peso e taglia.`
    }
  ].sort((a, b) => String(a.date).localeCompare(String(b.date)));

  const uniqueTimeline = timeline.filter((item, index, all) =>
    index === all.findIndex(candidate => candidate.date === item.date && candidate.title === item.title)
  );
  const origins = lotRows.map((lot: any) => lot.origin || lot.supplier).filter(Boolean);

  return `<!doctype html><html lang="it"><head>
    <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="robots" content="noindex,nofollow,noarchive">
    <title>Tracciabilità ${esc(sale.saleNumber)}</title>
    <style>
      :root{--navy:#12384b;--teal:#087f83;--mint:#e5f4f1;--ink:#183044;--muted:#607480;--line:#cfdddf}
      *{box-sizing:border-box}body{margin:0;background:#f4f7f7;color:var(--ink);font-family:Inter,Arial,sans-serif;line-height:1.5}
      .hero{background:linear-gradient(135deg,#0e3449,#087f83);color:white;padding:28px 20px 62px}.wrap{max-width:900px;margin:auto}
      .brand{display:flex;align-items:center;justify-content:space-between;gap:20px}.logo{max-width:180px;max-height:60px;object-fit:contain;background:white;border-radius:10px;padding:7px}
      .verified{font-size:13px;border:1px solid #75c8c4;border-radius:99px;padding:7px 12px}.hero h1{font-size:clamp(28px,5vw,48px);line-height:1.08;margin:42px 0 12px;max-width:720px}.hero p{max-width:650px;color:#d8f2ef;font-size:18px}
      main{margin:-36px auto 40px;padding:0 20px}.card{background:white;border:1px solid var(--line);border-radius:18px;padding:24px;box-shadow:0 14px 40px #173a4d14;margin-bottom:18px}
      .eyebrow{color:var(--teal);font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.1em}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:18px}.metric{background:#f1f7f6;padding:14px;border-radius:12px}.metric strong{display:block;font-size:21px}.metric span{font-size:12px;color:var(--muted)}
      h2{margin:4px 0 16px;font-size:24px}.species{font-style:italic}.details{display:grid;grid-template-columns:1fr 1fr;gap:12px}.detail{border-left:3px solid var(--teal);padding:4px 12px}.detail small{display:block;color:var(--muted)}
      .timeline{position:relative;margin:8px 0 0 9px;padding-left:27px;border-left:2px solid #b9d8d5}.event{position:relative;padding:0 0 25px}.event:last-child{padding-bottom:0}.event:before{content:"";position:absolute;left:-34px;top:4px;width:12px;height:12px;border-radius:50%;background:var(--teal);border:4px solid var(--mint)}.event time{font-size:12px;color:var(--teal);font-weight:700}.event h3{margin:3px 0;font-size:17px}.event p{margin:0;color:var(--muted)}
      .note{background:#eaf5f3;border-radius:14px;padding:18px;color:#335966}.footer{text-align:center;color:#71828a;font-size:12px;padding:8px 20px 35px}
      @media(max-width:680px){.summary{grid-template-columns:1fr 1fr}.details{grid-template-columns:1fr}.brand{align-items:flex-start}.verified{font-size:11px}.card{padding:18px}}
    </style></head><body>
    <header class="hero"><div class="wrap"><div class="brand">${logo ? `<img class="logo" src="${logo}" alt="${esc(company.ragioneSociale)}">` : `<strong>${esc(company.ragioneSociale)}</strong>`}<span class="verified">✓ Tracciabilità verificata</span></div>
    <h1>Il percorso del seme vivo consegnato</h1><p>Una sintesi trasparente delle principali fasi di crescita, controllo e preparazione alla reimmersione.</p></div></header>
    <main class="wrap"><section class="card"><span class="eyebrow">Consegna ${esc(sale.saleNumber)}</span><h2>Ruditapes philippinarum</h2>
    <div class="details"><div class="detail"><small>Prodotto</small><strong>Seme vivo di vongola verace</strong></div><div class="detail"><small>Destinazione</small><strong>Reimmersione</strong></div>
    <div class="detail"><small>Data di consegna</small><strong>${formatDate(sale.saleDate)}</strong></div><div class="detail"><small>Origine dichiarata</small><strong>${esc([...new Set(origins)].join(' · ') || 'Filiera controllata')}</strong></div></div>
    <div class="summary"><div class="metric"><strong>${bags.length}</strong><span>Colli</span></div><div class="metric"><strong>${number(netWeight,2)} kg</strong><span>Peso netto</span></div>
    <div class="metric"><strong>${esc(sizesList || '—')}</strong><span>Taglia alla consegna</span></div><div class="metric"><strong>${number(animals)}</strong><span>Esemplari stimati</span></div></div></section>
    <section class="card"><span class="eyebrow">Percorso documentato</span><h2>Dall’ingresso alla consegna</h2><div class="timeline">${uniqueTimeline.map(item =>
      `<article class="event"><time>${formatDate(item.date)}</time><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></article>`
    ).join('')}</div></section>
    <section class="card"><span class="eyebrow">Controlli alla consegna</span><h2>Preparato con cura</h2>
    <div class="details"><div class="detail"><small>Peso lordo controllato</small><strong>${number(grossWeight,2)} kg</strong></div><div class="detail"><small>Peso netto consegnato</small><strong>${number(netWeight,2)} kg</strong></div>
    <div class="detail"><small>Composizione</small><strong>${lotRows.length > 1 ? `${lotRows.length} origini tracciate` : 'Lotto tracciato'}</strong></div><div class="detail"><small>Società responsabile</small><strong>${esc(company.ragioneSociale)}</strong></div></div></section>
    <aside class="note">Questa pagina presenta una sintesi commerciale dei dati registrati lungo il percorso del lotto. Nei lotti composti, la storia rappresenta il percorso documentato delle diverse componenti e non il tracciamento del singolo animale.</aside></main>
    <footer class="footer">${esc(company.ragioneSociale)} · Documento pubblico in sola lettura · Rif. ${esc(sale.saleNumber)}</footer></body></html>`;
}

publicTraceabilityRoutes.get('/:token', async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  const saleId = readPublicTraceabilityToken(req.params.token);
  if (!saleId) return res.status(404).send('Collegamento di tracciabilità non valido.');

  const [sale] = await db.select().from(advancedSales).where(eq(advancedSales.id, saleId)).limit(1);
  if (!sale || sale.status === 'cancelled') return res.status(404).send('Tracciabilità non disponibile.');

  const bags = await db.select().from(saleBags).where(eq(saleBags.advancedSaleId, saleId)).orderBy(asc(saleBags.bagNumber));
  if (!bags.length) return res.status(404).send('Tracciabilità non disponibile.');

  const lotRows = await db.execute(sql`
    SELECT DISTINCT l.id, l.arrival_date AS "arrivalDate", l.supplier, l.supplier_lot_number AS "supplierLotNumber",
      l.origin, l.quality
    FROM bag_allocations ba
    JOIN sale_bags sb ON sb.id = ba.sale_bag_id
    LEFT JOIN operations o ON o.id = ba.source_operation_id
    LEFT JOIN cycles c ON c.id = o.cycle_id
    LEFT JOIN basket_lot_composition blc ON blc.basket_id = ba.source_basket_id
      AND (blc.cycle_id = o.cycle_id OR o.cycle_id IS NULL)
    JOIN lots l ON l.id = COALESCE(blc.lot_id, o.lot_id, c.lot_id)
    WHERE sb.advanced_sale_id = ${saleId}
    ORDER BY l.arrival_date
  `);
  const resolvedLots = lotRows.rows as any[];
  const lotIds = resolvedLots.map(row => Number(row.id)).filter(Number.isInteger);
  const historyResult = lotIds.length
    ? await db.execute(sql`
        SELECT DISTINCT o.id, o.date, o.type, o.animals_per_kg AS "animalsPerKg", s.code AS "sizeCode"
        FROM operations o
        JOIN cycles c ON c.id = o.cycle_id
        LEFT JOIN basket_lot_composition blc ON blc.cycle_id = o.cycle_id
        LEFT JOIN sizes s ON s.id = o.size_id
        WHERE o.cancelled_at IS NULL
          AND (
            o.lot_id IN (${sql.join(lotIds.map(id => sql`${id}`), sql`, `)})
            OR c.lot_id IN (${sql.join(lotIds.map(id => sql`${id}`), sql`, `)})
            OR blc.lot_id IN (${sql.join(lotIds.map(id => sql`${id}`), sql`, `)})
          )
        ORDER BY o.date, o.id
        LIMIT 80
      `)
    : { rows: [] };
  const history = historyResult.rows as any[];

  const [existingDdt] = sale.ddtId
    ? await db.select().from(ddt).where(eq(ddt.id, sale.ddtId)).limit(1)
    : [];
  const [currentCompany] = await db.select().from(fattureInCloudConfig)
    .where(eq(fattureInCloudConfig.companyId, sale.companyId || 0)).limit(1);
  const company = existingDdt?.mittenteRagioneSociale ? {
    ragioneSociale: existingDdt.mittenteRagioneSociale
  } : currentCompany;
  if (!company?.ragioneSociale) return res.status(404).send('Tracciabilità non disponibile.');

  res.type('html').send(renderPage({
    sale, bags, lotRows: resolvedLots, history, company,
    logo: getCompanyLogoBase64(existingDdt?.companyId || sale.companyId)
  }));
});