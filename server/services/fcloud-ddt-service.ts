/**
 * Servizio per la sincronizzazione DDT verso l'app esterna FCloud
 * 
 * Doppia scrittura parallela: FIC (esistente) + FCloud (nuovo)
 * Operazione NON bloccante — un errore FCloud non compromette il flusso FIC
 * 
 * Base URL: https://fatture-cloud-clone.replit.app
 * Auth: X-API-Key header
 */

import { db } from '../db.js';
import { ddt, ddtRighe } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

const FCLOUD_BASE_URL = 'https://fatture-cloud-clone.replit.app';
const FCLOUD_API_KEY = 'fcloud-ext-2026-k8Xm9PqR7vLw3NzT';

// Mappa FIC companyId (numerico) → FCloud companyId (stringa)
// Basata su P.IVA corrispondente
const COMPANY_MAP: Record<number, string> = {
  1017299: 'ecotapes-001',    // Ecotapes Soc. Agr. Srl (P.IVA 04621060278)
  1052922: 'deltafuturo-001', // Delta Futuro Soc. Agr. Srl (P.IVA 02057710382)
};

// Cache clienti FCloud per evitare chiamate ripetute (per sessione)
const clientiCache: Record<string, { id: string; partitaIva: string; ragioneSociale: string }[]> = {};

/**
 * Headers standard per tutte le chiamate FCloud
 */
function fcloudHeaders(): Record<string, string> {
  return {
    'X-API-Key': FCLOUD_API_KEY,
    'Content-Type': 'application/json',
  };
}

/**
 * Recupera la lista clienti FCloud per una data azienda (con cache)
 */
async function getClientiForCompany(fcloudCompanyId: string): Promise<{ id: string; partitaIva: string; ragioneSociale: string }[]> {
  if (clientiCache[fcloudCompanyId]) {
    return clientiCache[fcloudCompanyId];
  }
  const resp = await fetch(`${FCLOUD_BASE_URL}/api/ext/clients?companyId=${fcloudCompanyId}`, {
    headers: fcloudHeaders(),
  });
  if (!resp.ok) {
    throw new Error(`FCloud clienti fetch error: ${resp.status} ${await resp.text()}`);
  }
  const data = await resp.json() as any[];
  clientiCache[fcloudCompanyId] = data.map((c: any) => ({
    id: c.id,
    partitaIva: (c.partitaIva || '').replace(/\s/g, ''),
    ragioneSociale: c.ragioneSociale || '',
  }));
  return clientiCache[fcloudCompanyId];
}

/**
 * Trova il clientId FCloud abbinando la P.IVA del cliente FLUPSY
 */
async function findFCloudClientId(fcloudCompanyId: string, pivaCliente: string): Promise<string | null> {
  if (!pivaCliente || pivaCliente === 'N/A') return null;
  const normalizedPiva = pivaCliente.replace(/\s/g, '').replace(/^IT/i, '');
  const clienti = await getClientiForCompany(fcloudCompanyId);
  const match = clienti.find(c => {
    const cp = c.partitaIva.replace(/^IT/i, '');
    return cp === normalizedPiva;
  });
  return match ? match.id : null;
}

/**
 * Invia un DDT locale all'app esterna FCloud
 * Ritorna { success: true, fcloudDdtId, fcloudNumero } oppure lancia eccezione
 */
export async function sendDDTToFCloud(ddtId: number): Promise<{
  success: boolean;
  fcloudDdtId?: string;
  fcloudNumero?: string;
  error?: string;
}> {
  // 1. Carica DDT locale
  const ddtResult = await db.select().from(ddt).where(eq(ddt.id, ddtId)).limit(1);
  if (ddtResult.length === 0) {
    return { success: false, error: `DDT ${ddtId} non trovato` };
  }
  const ddtData = ddtResult[0];

  // 2. Risolvi il companyId FCloud
  const ficCompanyId = ddtData.companyId;
  if (!ficCompanyId) {
    return { success: false, error: 'company_id mancante nel DDT' };
  }
  const fcloudCompanyId = COMPANY_MAP[ficCompanyId];
  if (!fcloudCompanyId) {
    return { success: false, error: `Nessun mapping FCloud per FIC company ${ficCompanyId}` };
  }

  // 3. Trova clientId FCloud per P.IVA
  const clientId = await findFCloudClientId(fcloudCompanyId, ddtData.clientePiva || '');
  if (!clientId) {
    return {
      success: false,
      error: `Cliente FCloud non trovato per P.IVA "${ddtData.clientePiva}" in ${fcloudCompanyId}`,
    };
  }

  // 4. Carica righe DDT
  const righe = await db.select().from(ddtRighe).where(eq(ddtRighe.ddtId, ddtId)).orderBy(ddtRighe.id);

  // 5. Costruisci payload FCloud
  const items = righe.map(r => ({
    descrizione: r.descrizione,
    quantita: parseFloat(r.quantita || '1'),
    prezzoUnitario: parseFloat(r.prezzoUnitario || '0'),
    aliquotaIva: 4,
    unitaMisura: r.unitaMisura || 'NR',
  }));

  const payload: Record<string, any> = {
    companyId: fcloudCompanyId,
    clientId,
    data: ddtData.data,
    causaleTrasporto: 'Vendita',
    pesoKg: ddtData.pesoTotale ? parseFloat(ddtData.pesoTotale) : undefined,
    numeroColli: ddtData.totaleColli || undefined,
    note: ddtData.note || undefined,
    items,
  };

  // 6. Chiamata POST /api/ext/ddt
  console.log(`☁️ FCloud: invio DDT #${ddtData.numero} → ${fcloudCompanyId} cliente ${clientId}`);
  const resp = await fetch(`${FCLOUD_BASE_URL}/api/ext/ddt`, {
    method: 'POST',
    headers: fcloudHeaders(),
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`FCloud DDT create error ${resp.status}: ${errText}`);
  }

  const created = await resp.json() as any;
  console.log(`✅ FCloud: DDT creato - ID: ${created.id}, N. ${created.numero}`);

  return {
    success: true,
    fcloudDdtId: created.id,
    fcloudNumero: created.numero?.toString(),
  };
}

/**
 * Annulla un DDT nell'app esterna FCloud (chiamato in caso di storno/eliminazione)
 */
export async function cancelDDTInFCloud(fcloudDdtId: string, note?: string): Promise<void> {
  console.log(`☁️ FCloud: annullamento DDT ${fcloudDdtId}`);
  const resp = await fetch(`${FCLOUD_BASE_URL}/api/ext/ddt/${fcloudDdtId}`, {
    method: 'PATCH',
    headers: fcloudHeaders(),
    body: JSON.stringify({ stato: 'annullata', note: note || 'Annullato da FLUPSY' }),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`FCloud DDT cancel error ${resp.status}: ${errText}`);
  }
  console.log(`✅ FCloud: DDT ${fcloudDdtId} annullato`);
}

/**
 * Svuota la cache clienti (chiamare se i clienti FCloud cambiano)
 */
export function clearFCloudClientCache(): void {
  Object.keys(clientiCache).forEach(k => delete clientiCache[k]);
}
