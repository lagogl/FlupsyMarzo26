import express from 'express';
import type { Request, Response } from 'express';
import { dbEsterno, queryEsterno, isDbEsternoAvailable } from '../db-esterno';
import { ordiniCondivisi, ordiniDettagli, consegneCondivise } from '../schema-esterno';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';

const router = express.Router();

// ===== MIDDLEWARE DI VERIFICA =====

// Verifica che il DB esterno sia configurato
function requireDbEsterno(req: Request, res: Response, next: express.NextFunction) {
  if (!isDbEsternoAvailable()) {
    return res.status(503).json({
      success: false,
      error: 'Database esterno non configurato. Configura DATABASE_URL_ESTERNO nei Secrets.'
    });
  }
  next();
}

router.use(requireDbEsterno);

// ===== ENDPOINTS ORDINI CONDIVISI =====

/**
 * GET /api/ordini-condivisi
 * Recupera tutti gli ordini con calcolo residuo automatico
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { stato, clienteId, dataInizio, dataFine } = req.query;
    
    // Query diretta su tabella ordini con join per cliente e calcolo residuo
    let query = `
      SELECT 
        o.id,
        o.numero,
        o.data,
        o.cliente_id,
        COALESCE(c.denominazione, o.cliente_nome) as cliente_nome,
        o.stato,
        o.quantita as quantita_totale,
        o.taglia_richiesta,
        o.data_inizio_consegna,
        o.data_fine_consegna,
        o.fatture_in_cloud_id,
        o.fatture_in_cloud_numero,
        o.sync_status,
        COALESCE(SUM(cc.quantita_consegnata), 0)::INTEGER as quantita_consegnata,
        (COALESCE(o.quantita, 0) - COALESCE(SUM(cc.quantita_consegnata), 0))::INTEGER as quantita_residua
      FROM ordini o
      LEFT JOIN clienti c ON c.id = o.cliente_id
      LEFT JOIN consegne_condivise cc ON cc.ordine_id = o.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (stato) {
      query += ` AND stato = $${paramIndex}`;
      params.push(stato);
      paramIndex++;
    }
    
    if (clienteId) {
      query += ` AND cliente_id = $${paramIndex}`;
      params.push(clienteId);
      paramIndex++;
    }
    
    if (dataInizio) {
      query += ` AND data >= $${paramIndex}`;
      params.push(dataInizio);
      paramIndex++;
    }
    
    if (dataFine) {
      query += ` AND data <= $${paramIndex}`;
      params.push(dataFine);
      paramIndex++;
    }
    
    query += ` 
      GROUP BY 
        o.id, o.numero, o.data, o.cliente_id, c.denominazione, o.cliente_nome,
        o.stato, o.quantita, o.taglia_richiesta, o.data_inizio_consegna, 
        o.data_fine_consegna, o.fatture_in_cloud_id, o.fatture_in_cloud_numero, o.sync_status
      ORDER BY o.data DESC
    `;
    
    const ordiniRaw = await queryEsterno(query, params);
    
    // Recupera righe dettaglio per tutti gli ordini
    const ordiniIds = ordiniRaw.map((o: any) => o.id);
    let righeDettaglio: any[] = [];
    
    if (ordiniIds.length > 0) {
      const idsPlaceholders = ordiniIds.map((_, i) => `$${i + 1}`).join(', ');
      const righeQuery = `
        SELECT id, ordine_id, riga_numero, codice_prodotto, taglia, descrizione,
               quantita, prezzo_unitario, importo_riga
        FROM ordini_dettagli
        WHERE ordine_id IN (${idsPlaceholders})
        ORDER BY ordine_id, riga_numero
      `;
      righeDettaglio = await queryEsterno(righeQuery, ordiniIds);
    }
    
    // Trasforma snake_case in camelCase e aggiungi righe
    const ordini = ordiniRaw.map((o: any) => {
      // Mappa righe dettaglio per questo ordine
      const righeOrdine = righeDettaglio
        .filter((r: any) => r.ordine_id === o.id)
        .map((r: any) => ({
          id: r.id,
          rigaNumero: r.riga_numero,
          codiceProdotto: r.codice_prodotto,
          taglia: r.taglia,
          descrizione: r.descrizione,
          quantita: parseInt(r.quantita?.toString() || '0'),
          prezzoUnitario: parseFloat(r.prezzo_unitario?.toString() || '0'),
          importoRiga: parseFloat(r.importo_riga?.toString() || '0')
        }));
      
      return {
        id: o.id,
        numero: o.fatture_in_cloud_numero || o.numero || '',
        data: o.data,
        clienteId: o.cliente_id,
        clienteNome: o.cliente_nome,
        stato: o.stato, // Usa stato ORIGINALE dalla tabella ordini
        statoOriginale: o.stato,
        quantitaTotale: parseInt(o.quantita_totale?.toString() || '0'), // Quantità dalla tabella ordini
        tagliaRichiesta: o.taglia_richiesta || '',
        quantitaConsegnata: parseInt(o.quantita_consegnata?.toString() || '0'),
        quantitaResidua: parseInt(o.quantita_residua?.toString() || '0'),
        statoCalcolato: o.quantita_residua === 0 ? 'Completato' : (o.quantita_residua < o.quantita_totale ? 'Parziale' : 'Aperto'),
        dataInizioConsegna: o.data_inizio_consegna,
        dataFineConsegna: o.data_fine_consegna,
        syncStatus: o.sync_status,
        fattureInCloudId: o.fatture_in_cloud_id,
        righe: righeOrdine
      };
    });
    
    res.json({
      success: true,
      ordini,
      count: ordini.length
    });
  } catch (error: any) {
    console.error('Errore recupero ordini condivisi:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== ENDPOINTS CONSEGNE CONDIVISE =====
// NOTA: Queste route devono essere PRIMA di /:id per evitare conflitti di routing

/**
 * GET /api/ordini-condivisi/consegne
 * Recupera tutte le consegne (opzionalmente filtrate per ordine)
 */
router.get('/consegne/', async (req: Request, res: Response) => {
  try {
    const { ordineId, appOrigine, dataInizio, dataFine } = req.query;
    
    if (!dbEsterno) {
      return res.status(503).json({ error: 'Database esterno non disponibile' });
    }
    
    let conditions = [];
    
    if (ordineId) {
      conditions.push(eq(consegneCondivise.ordineId, parseInt(ordineId as string)));
    }
    
    if (appOrigine) {
      conditions.push(eq(consegneCondivise.appOrigine, appOrigine as string));
    }
    
    if (dataInizio) {
      conditions.push(gte(consegneCondivise.dataConsegna, dataInizio as string));
    }
    
    if (dataFine) {
      conditions.push(lte(consegneCondivise.dataConsegna, dataFine as string));
    }
    
    const consegneRaw = await dbEsterno
      .select()
      .from(consegneCondivise)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(consegneCondivise.dataConsegna));
    
    // Arricchisci con dati ordine e cliente
    const consegne = await Promise.all(consegneRaw.map(async (c) => {
      const [ordine] = await queryEsterno(
        'SELECT fatture_in_cloud_numero as numero, cliente_nome FROM ordini_con_residuo WHERE id = $1',
        [c.ordineId]
      );
      
      return {
        id: c.id,
        ordineId: c.ordineId,
        dataConsegna: c.dataConsegna,
        quantita: c.quantitaConsegnata,
        note: c.note,
        appOrigine: c.appOrigine,
        ordineNumero: ordine?.numero || null,
        clienteNome: ordine?.cliente_nome || null
      };
    }));
    
    res.json({
      success: true,
      consegne,
      count: consegne.length
    });
  } catch (error: any) {
    console.error('Errore recupero consegne:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ordini-condivisi/consegne
 * Crea una nuova consegna parziale
 */
router.post('/consegne/', async (req: Request, res: Response) => {
  try {
    const { ordineId, dataConsegna, quantita, note } = req.body;
    
    // Validazione
    if (!ordineId || !dataConsegna || !quantita) {
      return res.status(400).json({
        success: false,
        error: 'ordineId, dataConsegna e quantita sono obbligatori'
      });
    }
    
    if (quantita <= 0) {
      return res.status(400).json({
        success: false,
        error: 'La quantità deve essere maggiore di zero'
      });
    }
    
    if (!dbEsterno) {
      return res.status(503).json({ error: 'Database esterno non disponibile' });
    }
    
    // Verifica residuo disponibile
    const [ordine] = await queryEsterno(
      'SELECT quantita_residua FROM ordini_con_residuo WHERE id = $1',
      [ordineId]
    );
    
    if (!ordine) {
      return res.status(404).json({
        success: false,
        error: 'Ordine non trovato'
      });
    }
    
    if (quantita > ordine.quantita_residua) {
      return res.status(400).json({
        success: false,
        error: `Quantità superiore al residuo disponibile (${ordine.quantita_residua} animali)`
      });
    }
    
    // Inserisci consegna
    const [nuovaConsegna] = await dbEsterno
      .insert(consegneCondivise)
      .values({
        ordineId,
        dataConsegna: new Date(dataConsegna).toISOString().split('T')[0],
        quantitaConsegnata: quantita,
        appOrigine: 'delta_futuro',
        note: note || null
      })
      .returning();
    
    // Aggiorna stato ordine
    await aggiornaStatoOrdine(ordineId);
    
    res.json({
      success: true,
      consegna: nuovaConsegna,
      message: 'Consegna registrata con successo'
    });
  } catch (error: any) {
    console.error('Errore creazione consegna:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/ordini-condivisi/consegne/:id
 * Elimina una consegna
 */
router.delete('/consegne/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!dbEsterno) {
      return res.status(503).json({ error: 'Database esterno non disponibile' });
    }
    
    // Recupera ordineId prima di eliminare
    const [consegna] = await dbEsterno
      .select()
      .from(consegneCondivise)
      .where(eq(consegneCondivise.id, parseInt(id)));
    
    if (!consegna) {
      return res.status(404).json({
        success: false,
        error: 'Consegna non trovata'
      });
    }
    
    // Elimina
    await dbEsterno
      .delete(consegneCondivise)
      .where(eq(consegneCondivise.id, parseInt(id)));
    
    // Ricalcola stato ordine
    await aggiornaStatoOrdine(consegna.ordineId);
    
    res.json({
      success: true,
      message: 'Consegna eliminata'
    });
  } catch (error: any) {
    console.error('Errore eliminazione consegna:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== ENDPOINTS ORDINI (dopo consegne per evitare conflitti routing) =====

/**
 * GET /api/ordini-condivisi/:id
 * Recupera dettagli ordine con righe e consegne
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!dbEsterno) {
      return res.status(503).json({ error: 'Database esterno non disponibile' });
    }
    
    // Ordine con residuo
    const [ordine] = await queryEsterno(
      'SELECT * FROM ordini_con_residuo WHERE id = $1',
      [id]
    );
    
    if (!ordine) {
      return res.status(404).json({
        success: false,
        error: 'Ordine non trovato'
      });
    }
    
    // Righe dettaglio
    const righe = await dbEsterno
      .select()
      .from(ordiniDettagli)
      .where(eq(ordiniDettagli.ordineId, parseInt(id)))
      .orderBy(ordiniDettagli.rigaNumero);
    
    // Consegne associate
    const consegne = await dbEsterno
      .select()
      .from(consegneCondivise)
      .where(eq(consegneCondivise.ordineId, parseInt(id)))
      .orderBy(desc(consegneCondivise.dataConsegna));
    
    res.json({
      success: true,
      ordine: {
        ...ordine,
        righe,
        consegne
      }
    });
  } catch (error: any) {
    console.error(`Errore recupero ordine ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/ordini-condivisi/:id/delivery-range
 * Aggiorna range di consegna ordine
 */
router.patch('/:id/delivery-range', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dataInizioConsegna, dataFineConsegna } = req.body;
    
    if (!dataInizioConsegna || !dataFineConsegna) {
      return res.status(400).json({
        success: false,
        error: 'dataInizioConsegna e dataFineConsegna sono obbligatori'
      });
    }
    
    if (!dbEsterno) {
      return res.status(503).json({ error: 'Database esterno non disponibile' });
    }
    
    // Aggiorna range
    await dbEsterno
      .update(ordiniCondivisi)
      .set({
        dataInizioConsegna: new Date(dataInizioConsegna).toISOString().split('T')[0],
        dataFineConsegna: new Date(dataFineConsegna).toISOString().split('T')[0],
        updatedAt: sql`NOW()`
      })
      .where(eq(ordiniCondivisi.id, parseInt(id)));
    
    res.json({
      success: true,
      message: 'Range di consegna aggiornato'
    });
  } catch (error: any) {
    console.error('Errore aggiornamento range consegna:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== HELPERS =====

/**
 * Aggiorna lo stato dell'ordine in base alle consegne
 */
async function aggiornaStatoOrdine(ordineId: number): Promise<void> {
  if (!dbEsterno) return;
  
  try {
    const [ordine] = await queryEsterno(
      'SELECT quantita_totale, quantita_residua FROM ordini_con_residuo WHERE id = $1',
      [ordineId]
    );
    
    if (!ordine) return;
    
    let nuovoStato = 'Aperto';
    
    if (ordine.quantita_residua === 0) {
      nuovoStato = 'Completato';
    } else if (ordine.quantita_residua < ordine.quantita_totale) {
      nuovoStato = 'Parziale';
    }
    
    await dbEsterno
      .update(ordiniCondivisi)
      .set({
        stato: nuovoStato,
        updatedAt: new Date()
      })
      .where(eq(ordiniCondivisi.id, ordineId));
    
    console.log(`✅ Stato ordine ${ordineId} aggiornato a: ${nuovoStato}`);
  } catch (error) {
    console.error('Errore aggiornamento stato ordine:', error);
  }
}

export default router;
