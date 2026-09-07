import { format } from 'date-fns';
import { sendGmailEmail } from './gmail-service';

const RECIPIENTS = [
  'landri.francesco@gmail.com',
  'lago.gianluigi@gmail.com',
  'paola.landri@gmail.com'
];

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function number(value: unknown, decimals = 0): string {
  return Number(value || 0).toLocaleString('it-IT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export async function sendAdvancedSaleDocumentsReadyEmail(params: {
  sale: any;
  customer: any;
  companyName: string;
  attachments: Array<{ filename: string; content: Buffer }>;
}) {
  const { sale, customer, companyName, attachments } = params;
  const customerName = customer?.denominazione || sale.customerName || 'Cliente non indicato';
  const saleDate = sale.saleDate
    ? format(new Date(`${sale.saleDate}T12:00:00`), 'dd/MM/yyyy')
    : '—';
  const ddr = sale.ddrNumber && sale.ddrYear
    ? `${sale.ddrNumber}/${sale.ddrYear}`
    : 'non previsto / non assegnato';

  await sendGmailEmail({
    to: RECIPIENTS,
    subject: `Documenti vendita ${sale.saleNumber} pronti per Fatture in Cloud`,
    html: `
      <div style="max-width:640px;font-family:Arial,sans-serif;color:#1f2937">
        <div style="background:#166534;color:#ffffff;padding:20px 24px;border-radius:8px 8px 0 0">
          <div style="font-size:13px;font-weight:bold;letter-spacing:.6px;text-transform:uppercase">Nuova vendita registrata</div>
          <div style="font-size:24px;font-weight:bold;margin-top:6px">Vendita ${esc(sale.saleNumber)}</div>
        </div>
        <div style="border:1px solid #d1d5db;border-top:0;padding:22px 24px;border-radius:0 0 8px 8px">
          <p style="margin:0 0 16px">Buongiorno,</p>
          <div style="background:#dcfce7;border-left:5px solid #16a34a;color:#14532d;padding:14px 16px;margin-bottom:20px">
            <strong style="font-size:16px">Vendita completata con successo</strong><br>
            <span style="font-size:14px">I documenti sono stati generati e sono pronti per la successiva esportazione a Fatture in Cloud.</span>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr style="background:#f3f4f6"><td style="padding:9px 12px"><strong>Azienda</strong></td><td style="padding:9px 12px">${esc(companyName)}</td></tr>
            <tr><td style="padding:9px 12px"><strong>Cliente</strong></td><td style="padding:9px 12px">${esc(customerName)}</td></tr>
            <tr style="background:#f3f4f6"><td style="padding:9px 12px"><strong>Data vendita</strong></td><td style="padding:9px 12px">${saleDate}</td></tr>
            <tr><td style="padding:9px 12px"><strong>Numero sacchi</strong></td><td style="padding:9px 12px">${number(sale.totalBags)}</td></tr>
            <tr style="background:#f3f4f6"><td style="padding:9px 12px"><strong>Animali</strong></td><td style="padding:9px 12px">${number(sale.totalAnimals)}</td></tr>
            <tr><td style="padding:9px 12px"><strong>Peso totale</strong></td><td style="padding:9px 12px">${number(sale.totalWeight, 2)} kg</td></tr>
            <tr style="background:#f3f4f6"><td style="padding:9px 12px"><strong>Progressivo DDR</strong></td><td style="padding:9px 12px">${esc(ddr)}</td></tr>
          </table>
          <p style="margin:20px 0 0;padding:12px 14px;background:#fff7ed;border:1px solid #fdba74;color:#9a3412;border-radius:6px">
            <strong>Documenti allegati:</strong> il fascicolo della vendita è disponibile nei PDF inclusi in questa email.
          </p>
          <p style="margin:20px 0 0;color:#6b7280;font-size:12px">Messaggio generato automaticamente dal sistema di gestione vendite.</p>
        </div>
      </div>
    `,
    attachments: attachments.map(attachment => ({
      ...attachment,
      contentType: 'application/pdf'
    }))
  });
}