import { sendGmailEmail } from './gmail-service';

const SUSPICIOUS_RECIPIENTS = ['paola.landri@gmail.com', 'lago.gianluigi@gmail.com'];

export interface SuspiciousScreeningPayload {
  selectionId: number;
  selectionNumber: number;
  date: string;
  totalAnimalsOrigin: number;
  totalAnimalsDestination: number;
  mortality: number;
  discrepancyPct: number;
  threshold: number;
  suspiciousNote?: string | null;
  sourceBaskets: Array<{ basketId: number; physicalNumber?: number | null; flupsyName?: string | null; lotId?: number | null; animalCount: number }>;
  destinationBaskets: Array<{ basketId: number; physicalNumber?: number | null; flupsyName?: string | null; sizeCode?: string | null; animalCount: number }>;
  lotIds: number[];
}

function fmt(n: number | null | undefined) {
  if (n === null || n === undefined) return '-';
  return n.toLocaleString('it-IT');
}

function rowsToTable(headers: string[], rows: string[][]) {
  const th = headers.map(h => `<th style="border:1px solid #ccc;padding:6px;background:#f3f4f6;text-align:left">${h}</th>`).join('');
  const trs = rows.map(r => `<tr>${r.map(c => `<td style="border:1px solid #ccc;padding:6px">${c}</td>`).join('')}</tr>`).join('');
  return `<table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:13px"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`;
}

export async function sendSuspiciousScreeningEmail(p: SuspiciousScreeningPayload): Promise<void> {
  const subject = `⚠️ Vagliatura SOSPETTA #${p.selectionNumber} — discrepanza ${p.discrepancyPct.toFixed(2)}% (${fmt(p.mortality)} animali persi)`;

  const sourceRows = p.sourceBaskets.map(sb => [
    `#${sb.physicalNumber ?? sb.basketId}`,
    sb.flupsyName ?? '-',
    sb.lotId != null ? String(sb.lotId) : '-',
    fmt(sb.animalCount),
  ]);
  const destRows = p.destinationBaskets.map(db => [
    `#${db.physicalNumber ?? db.basketId}`,
    db.flupsyName ?? '-',
    db.sizeCode ?? '-',
    fmt(db.animalCount),
  ]);

  const html = `
<div style="font-family:Arial,sans-serif;max-width:760px;margin:0 auto;color:#111">
  <h2 style="color:#b91c1c;margin-bottom:4px">⚠️ Vagliatura sospetta confermata dall'operatore</h2>
  <p style="margin-top:0;color:#555">Soglia di sospetto: <strong>${p.threshold}%</strong> di scarto tra animali origine e destinazione.</p>

  <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;padding:12px;margin:12px 0">
    <table style="width:100%;font-size:14px">
      <tr><td><strong>Vagliatura</strong></td><td>#${p.selectionNumber} (ID interno ${p.selectionId})</td></tr>
      <tr><td><strong>Data</strong></td><td>${p.date}</td></tr>
      <tr><td><strong>Animali origine</strong></td><td>${fmt(p.totalAnimalsOrigin)}</td></tr>
      <tr><td><strong>Animali destinazione</strong></td><td>${fmt(p.totalAnimalsDestination)}</td></tr>
      <tr><td><strong>Differenza</strong></td><td style="color:#b91c1c"><strong>${fmt(p.mortality)} animali (${p.discrepancyPct.toFixed(2)}%)</strong></td></tr>
      <tr><td><strong>Lotti coinvolti</strong></td><td>${p.lotIds.length > 0 ? p.lotIds.join(', ') : '-'}</td></tr>
    </table>
  </div>

  ${p.suspiciousNote ? `<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;padding:10px;margin:12px 0"><strong>Nota dell'operatore:</strong><br>${p.suspiciousNote.replace(/</g, '&lt;')}</div>` : ''}

  <h3 style="margin-bottom:6px">Ceste di origine</h3>
  ${rowsToTable(['Cesta', 'FLUPSY', 'Lotto', 'Animali'], sourceRows)}

  <h3 style="margin-bottom:6px;margin-top:16px">Ceste di destinazione</h3>
  ${rowsToTable(['Cesta', 'FLUPSY', 'Taglia', 'Animali'], destRows)}

  <p style="color:#555;font-size:12px;margin-top:18px">Email automatica dal gestionale FLUPSY. Non rispondere a questo messaggio.</p>
</div>`;

  await sendGmailEmail({
    to: SUSPICIOUS_RECIPIENTS,
    subject,
    html,
  });
}
