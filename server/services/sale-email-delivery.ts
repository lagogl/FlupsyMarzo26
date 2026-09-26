import { db } from '../db';
import { sql } from 'drizzle-orm';
import { sendAdvancedSaleDocumentsReadyEmail } from './advanced-sale-documents-email';

export type SaleEmailState = 'preparing' | 'sending' | 'sent' | 'failed' | 'unknown';

type EmailMarker = {
  state: SaleEmailState;
  attempt: number;
  startedAt: string;
  sentAt?: string;
  gmailMessageId?: string;
  history?: Array<{
    attempt: number; at: string; previousState?: string; outcome?: SaleEmailState;
    gmailMessageId?: string; actorId?: number | null; reason?: string
  }>;
};

export type SaleEmailPayload = Parameters<typeof sendAdvancedSaleDocumentsReadyEmail>[0];

export function canClaimSaleEmail(
  previous: Pick<EmailMarker, 'state' | 'startedAt'> | undefined,
  manual: boolean,
  reason: string
): boolean {
  if (!manual) return !previous;
  if (reason.trim().length < 8) throw new Error('Indicare il motivo del rinvio (almeno 8 caratteri)');
  if (previous && ['preparing', 'sending'].includes(previous.state)) {
    throw new Error('Invio in corso o dall’esito incerto: verificare Gmail prima di rinviare');
  }
  return true;
}

/** Claim before generating PDFs or contacting Gmail. No automatic retries. */
async function claim(saleId: number, manual: boolean, reason: string, actorId: number | null) {
  return db.transaction(async tx => {
    const result = await tx.execute(sql`
      SELECT s.id, s.status, s.ddt_status, s.generated_documents,
             d.ddt_stato, d.fatture_in_cloud_id, d.fatture_in_cloud_numero
      FROM advanced_sales s LEFT JOIN ddt d ON d.id = s.ddt_id
      WHERE s.id = ${saleId} FOR UPDATE OF s
    `);
    const row = (result as any).rows?.[0];
    if (!row) throw new Error('Vendita non trovata');
    if (row.status === 'cancelled' || row.ddt_status !== 'inviato'
      || row.ddt_stato !== 'inviato' || !row.fatture_in_cloud_id
      || !/^[1-9]\d*$/.test(String(row.fatture_in_cloud_numero || ''))) {
      throw new Error('Email disponibile solo dopo l’invio del DDT numerato a FIC');
    }
    const previous = row.generated_documents?.__saleEmail as EmailMarker | undefined;
    if (!canClaimSaleEmail(previous, manual, reason)) return null;
    const attempt = (previous?.attempt || 0) + 1;
    const marker: EmailMarker = {
      state: 'preparing', attempt, startedAt: new Date().toISOString(),
      history: [
        ...(previous?.history || []).slice(-19),
        {
          attempt, at: new Date().toISOString(), previousState: previous?.state || 'nessuno',
          ...(manual ? { actorId, reason: reason.trim() } : {})
        }
      ]
    };
    await tx.execute(sql`
      UPDATE advanced_sales SET generated_documents =
        jsonb_set(COALESCE(generated_documents, '{}'::jsonb), '{__saleEmail}', ${JSON.stringify(marker)}::jsonb, true),
        updated_at = NOW() WHERE id = ${saleId}
    `);
    return marker;
  });
}

async function update(saleId: number, attempt: number, patch: Partial<EmailMarker>) {
  await db.transaction(async tx => {
    const outcome = patch.state && patch.state !== 'sending' ? {
      attempt, at: new Date().toISOString(), outcome: patch.state,
      ...(patch.gmailMessageId ? { gmailMessageId: patch.gmailMessageId } : {})
    } : null;
    const result = await tx.execute(sql`
      UPDATE advanced_sales SET generated_documents =
        jsonb_set(generated_documents, '{__saleEmail}',
          (generated_documents -> '__saleEmail') || ${JSON.stringify(patch)}::jsonb
          ${outcome ? sql`|| jsonb_build_object('history',
            COALESCE(generated_documents -> '__saleEmail' -> 'history', '[]'::jsonb)
              || ${JSON.stringify(outcome)}::jsonb)` : sql``}, true),
        updated_at = NOW()
      WHERE id = ${saleId}
        AND (generated_documents -> '__saleEmail' ->> 'attempt')::integer = ${attempt}
      RETURNING id
    `);
    if (!(result as any).rows?.length) throw new Error('Tentativo email modificato durante l’invio');
  });
}

export async function deliverSaleEmail(
  saleId: number,
  buildPayload: () => Promise<SaleEmailPayload>,
  options: { manual?: boolean; reason?: string; actorId?: number | null } = {}
): Promise<'sent' | 'already_requested'> {
  const marker = await claim(saleId, !!options.manual, options.reason || '', options.actorId ?? null);
  if (!marker) return 'already_requested';

  let payload: SaleEmailPayload;
  try {
    payload = await buildPayload();
    if (payload.ddtIsDraft) throw new Error('Il fascicolo contiene un DDT non ufficiale');
  } catch (error) {
    await update(saleId, marker.attempt, { state: 'failed' });
    throw error;
  }

  await update(saleId, marker.attempt, { state: 'sending' });
  try {
    const result = await sendAdvancedSaleDocumentsReadyEmail(payload);
    await update(saleId, marker.attempt, {
      state: 'sent', sentAt: new Date().toISOString(),
      ...(result?.id ? { gmailMessageId: result.id } : {})
    });
    return 'sent';
  } catch (error) {
    // A transport error can occur after Gmail accepts the message. No automatic retry.
    await update(saleId, marker.attempt, { state: 'unknown' }).catch(() => {});
    throw error;
  }
}