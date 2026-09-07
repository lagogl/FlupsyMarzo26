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
      <p>Buongiorno,</p>
      <p>i documenti della vendita <strong>${esc(sale.saleNumber)}</strong> sono stati generati e sono pronti per la successiva esportazione dei dati a Fatture in Cloud.</p>
      <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
        <tr><td style="padding:5px 14px 5px 0"><strong>Azienda</strong></td><td>${esc(companyName)}</td></tr>
        <tr><td style="padding:5px 14px 5px 0"><strong>Cliente</strong></td><td>${esc(customerName)}</td></tr>
        <tr><td style="padding:5px 14px 5px 0"><strong>Data vendita</strong></td><td>${saleDate}</td></tr>
        <tr><td style="padding:5px 14px 5px 0"><strong>Numero sacchi</strong></td><td>${number(sale.totalBags)}</td></tr>
        <tr><td style="padding:5px 14px 5px 0"><strong>Animali</strong></td><td>${number(sale.totalAnimals)}</td></tr>
        <tr><td style="padding:5px 14px 5px 0"><strong>Peso totale</strong></td><td>${number(sale.totalWeight, 2)} kg</td></tr>
        <tr><td style="padding:5px 14px 5px 0"><strong>Progressivo DDR</strong></td><td>${esc(ddr)}</td></tr>
      </table>
      <p>I documenti sono allegati alla presente email.</p>
      <p>Messaggio generato automaticamente dal sistema di gestione vendite.</p>
    `,
    attachments: attachments.map(attachment => ({
      ...attachment,
      contentType: 'application/pdf'
    }))
  });
}