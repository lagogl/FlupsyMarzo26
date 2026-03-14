/**
 * Servizio FCloud DDT — canale indipendente da FIC
 *
 * Flusso:
 *  1. Upsert cliente per P.IVA (POST /api/ext/clients)
 *  2. Crea DDT in FCloud (POST /api/ext/ddt)
 *  3. Restituisce deep-link → https://fatture-cloud-clone.replit.app/fatture/{id}
 *
 * Mapping aziende via mittente_partita_iva (indipendente da FIC):
 *   04621060278 → ecotapes-001    (Ecotapes Soc. Agr. Srl)
 *   02057710382 → deltafuturo-001 (Delta Futuro Soc. Agr. Srl)
 *   02119900385 → mito-001        (Mito Srl)
 */

import { db } from '../db.js';
import { ddt, ddtRighe } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

const FCLOUD_BASE_URL = 'https://fatture-cloud-clone.replit.app';
const FCLOUD_API_KEY  = 'fcloud-ext-2026-k8Xm9PqR7vLw3NzT';

// Mappa P.IVA cedente → FCloud companyId
const PIVA_TO_FCLOUD: Record<string, string> = {
  '04621060278': 'ecotapes-001',
  '02057710382': 'deltafuturo-001',
  '02119900385': 'mito-001',
};

function headers(): Record<string, string> {
  return {
    'X-API-Key': FCLOUD_API_KEY,
    'Content-Type': 'application/json',
  };
}

function normalizePiva(piva: string | null | undefined): string {
  return (piva || '').replace(/\s/g, '').replace(/^IT/i, '').toUpperCase();
}

/**
 * Risolve (o crea) il clientId FCloud tramite upsert per P.IVA.
 * Usa POST /api/ext/clients che restituisce 200 se esiste, 201 se creato.
 */
async function upsertFCloudClient(
  fcloudCompanyId: string,
  cliente: {
    piva: string | null;
    nome: string | null;
    indirizzo: string | null;
    citta: string | null;
    cap: string | null;
    provincia: string | null;
    paese: string | null;
    codiceFiscale: string | null;
  }
): Promise<string> {
  const payload: Record<string, any> = {
    companyId: fcloudCompanyId,
    ragioneSociale: cliente.nome || 'Cliente sconosciuto',
    tipo: 'azienda',
  };
  if (cliente.piva)         payload.partitaIva    = normalizePiva(cliente.piva);
  if (cliente.codiceFiscale) payload.codiceFiscale = cliente.codiceFiscale;
  if (cliente.indirizzo)    payload.indirizzo     = cliente.indirizzo;
  if (cliente.citta)        payload.citta         = cliente.citta;
  if (cliente.cap)          payload.cap           = cliente.cap;
  if (cliente.provincia)    payload.provincia     = cliente.provincia;
  if (cliente.paese)        payload.nazione       = cliente.paese === 'Italia' ? 'IT' : (cliente.paese || 'IT');

  const resp = await fetch(`${FCLOUD_BASE_URL}/api/ext/clients`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`FCloud upsert cliente error ${resp.status}: ${err}`);
  }

  const data = await resp.json() as { id: string };
  const action = resp.status === 201 ? 'creato' : 'trovato';
  console.log(`☁️ FCloud cliente ${action}: ${data.id} (${cliente.nome}, P.IVA ${cliente.piva})`);
  return data.id;
}

export interface FCloudDdtResult {
  success: boolean;
  fcloudDdtId?: string;
  fcloudNumero?: string;
  deepLinkUrl?: string;
  error?: string;
}

/**
 * Crea il DDT in FCloud e restituisce l'ID + deep-link per aprirlo nel browser.
 * Usato sia in background (dopo invio FIC) sia dall'endpoint "Apri in FCloud".
 */
export async function sendDDTToFCloud(ddtId: number): Promise<FCloudDdtResult> {
  // 1. Carica DDT con righe
  const [ddtData] = await db.select().from(ddt).where(eq(ddt.id, ddtId)).limit(1);
  if (!ddtData) return { success: false, error: `DDT ${ddtId} non trovato` };

  // 2. Risolvi companyId FCloud dalla P.IVA del mittente (cedente)
  const mittentePiva = normalizePiva(ddtData.mittentePartitaIva);
  const fcloudCompanyId = PIVA_TO_FCLOUD[mittentePiva];
  if (!fcloudCompanyId) {
    return {
      success: false,
      error: `Nessun mapping FCloud per mittente P.IVA "${ddtData.mittentePartitaIva}" (normalizzata: "${mittentePiva}")`,
    };
  }

  // 3. Upsert cliente FCloud per P.IVA
  let clientId: string;
  try {
    clientId = await upsertFCloudClient(fcloudCompanyId, {
      piva:          ddtData.clientePiva,
      nome:          ddtData.clienteNome,
      indirizzo:     ddtData.clienteIndirizzo,
      citta:         ddtData.clienteCitta,
      cap:           ddtData.clienteCap,
      provincia:     ddtData.clienteProvincia,
      paese:         ddtData.clientePaese,
      codiceFiscale: ddtData.clienteCodiceFiscale,
    });
  } catch (err: any) {
    return { success: false, error: `Errore upsert cliente: ${err.message}` };
  }

  // 4. Carica righe DDT
  const righe = await db.select().from(ddtRighe).where(eq(ddtRighe.ddtId, ddtId)).orderBy(ddtRighe.id);

  // 5. Costruisci payload FCloud
  const items = righe.map(r => ({
    descrizione:    r.descrizione,
    quantita:       parseFloat(r.quantita   || '1'),
    prezzoUnitario: parseFloat(r.prezzoUnitario || '0'),
    aliquotaIva:    4,
    unitaMisura:    r.unitaMisura || 'NR',
  }));

  const payload: Record<string, any> = {
    companyId:         fcloudCompanyId,
    clientId,
    data:              ddtData.data,
    causaleTrasporto:  'Vendita',
    aspettoEsteriore:  'Colli',
    pesoKg:            ddtData.pesoTotale  ? parseFloat(ddtData.pesoTotale)  : undefined,
    numeroColli:       ddtData.totaleColli || undefined,
    note:              ddtData.note        || undefined,
    items,
  };

  // 6. POST /api/ext/ddt
  console.log(`☁️ FCloud: invio DDT #${ddtData.numero} → ${fcloudCompanyId}, cliente ${clientId}`);
  const resp = await fetch(`${FCLOUD_BASE_URL}/api/ext/ddt`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`FCloud DDT create error ${resp.status}: ${errText}`);
  }

  const created = await resp.json() as { id: string; numero: string | number };
  const deepLinkUrl = `${FCLOUD_BASE_URL}/fatture/${created.id}`;
  console.log(`✅ FCloud: DDT creato — ID: ${created.id}, N. ${created.numero}, link: ${deepLinkUrl}`);

  return {
    success:      true,
    fcloudDdtId:  created.id,
    fcloudNumero: String(created.numero),
    deepLinkUrl,
  };
}

/**
 * Apre (o crea) il DDT in FCloud e restituisce il deep-link.
 * Se il DDT è già stato inviato a FCloud, restituisce il link senza ricrearlo.
 */
export async function openOrCreateDDTInFCloud(ddtId: number): Promise<FCloudDdtResult> {
  // Controlla se esiste già in FCloud
  const [ddtData] = await db.select().from(ddt).where(eq(ddt.id, ddtId)).limit(1);
  if (!ddtData) return { success: false, error: `DDT ${ddtId} non trovato` };

  if (ddtData.fcloudDdtId && ddtData.fcloudStato === 'inviato') {
    const deepLinkUrl = `${FCLOUD_BASE_URL}/fatture/${ddtData.fcloudDdtId}`;
    console.log(`☁️ FCloud: DDT ${ddtId} già sincronizzato → ${deepLinkUrl}`);
    return {
      success:      true,
      fcloudDdtId:  ddtData.fcloudDdtId,
      fcloudNumero: ddtData.fcloudDdtNumero || undefined,
      deepLinkUrl,
    };
  }

  // Non ancora in FCloud: crea ora
  const result = await sendDDTToFCloud(ddtId);

  if (result.success && result.fcloudDdtId) {
    await db.update(ddt).set({
      fcloudDdtId:    result.fcloudDdtId,
      fcloudDdtNumero: result.fcloudNumero,
      fcloudStato:    'inviato',
      updatedAt:      new Date(),
    }).where(eq(ddt.id, ddtId));
  } else {
    await db.update(ddt).set({ fcloudStato: 'errore', updatedAt: new Date() }).where(eq(ddt.id, ddtId)).catch(() => {});
  }

  return result;
}

/**
 * Annulla un DDT in FCloud (PATCH stato: annullata)
 */
export async function cancelDDTInFCloud(fcloudDdtId: string, note?: string): Promise<void> {
  console.log(`☁️ FCloud: annullamento DDT ${fcloudDdtId}`);
  const resp = await fetch(`${FCLOUD_BASE_URL}/api/ext/ddt/${fcloudDdtId}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ stato: 'annullata', note: note || 'Annullato da FLUPSY' }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`FCloud DDT cancel error ${resp.status}: ${err}`);
  }
  console.log(`✅ FCloud: DDT ${fcloudDdtId} annullato`);
}
