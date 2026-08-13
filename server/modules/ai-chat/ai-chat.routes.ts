import { Router, type Request, type Response } from "express";
import { db } from "../../db.js";
import { sql } from "drizzle-orm";

const router = Router();

// ─── Context builder ────────────────────────────────────────────────────────

async function buildOperatorContext(): Promise<string> {
  try {
    // Active baskets with current cycle info
    const baskets = await db.execute(sql`
      SELECT
        b.id,
        b.physical_number,
        f.name AS flupsy_name,
        f.location,
        s.code AS current_size,
        c.start_date,
        l.supplier AS lot_supplier,
        l.arrival_date AS lot_arrival,
        op.animals_per_kg,
        op.total_weight,
        op.date AS last_op_date,
        op.type AS last_op_type,
        mr.mortality_percent
      FROM baskets b
      JOIN flupsys f ON b.flupsy_id = f.id
      JOIN cycles c ON c.basket_id = b.id AND c.end_date IS NULL AND c.state = 'active'
      JOIN lots l ON c.lot_id = l.id
      LEFT JOIN LATERAL (
        SELECT o.animals_per_kg, o.total_weight, o.date, o.type, o.size_id
        FROM operations o
        WHERE o.basket_id = b.id AND o.cycle_id = c.id
        ORDER BY o.date DESC, o.id DESC
        LIMIT 1
      ) op ON true
      LEFT JOIN sizes s ON op.size_id = s.id
      LEFT JOIN LATERAL (
        SELECT ((SUM(dead_count)::float / NULLIF(MAX(animal_count), 0)) * 100) AS mortality_percent
        FROM operations
        WHERE basket_id = b.id AND cycle_id = c.id AND dead_count > 0
      ) mr ON true
      ORDER BY f.name, b.physical_number
      LIMIT 80
    `);

    // Recent operations (last 7 days)
    const recentOps = await db.execute(sql`
      SELECT
        o.date,
        o.type,
        o.animal_count,
        o.total_weight,
        o.dead_count,
        o.mortality_rate,
        b.physical_number AS basket_num,
        f.name AS flupsy_name,
        s.code AS size_code
      FROM operations o
      JOIN baskets b ON o.basket_id = b.id
      JOIN flupsys f ON b.flupsy_id = f.id
      LEFT JOIN sizes s ON o.size_id = s.id
      WHERE o.date >= CURRENT_DATE - INTERVAL '7 days'
        AND o.type != 'misura'
      ORDER BY o.date DESC
      LIMIT 50
    `);

    // Pending vagliaturas (baskets that haven't been screened in 14+ days)
    const pendingScreenings = await db.execute(sql`
      SELECT
        b.physical_number,
        f.name AS flupsy_name,
        s.code AS current_size,
        MAX(o.date) AS last_vagliatura,
        CURRENT_DATE - MAX(o.date) AS days_since
      FROM baskets b
      JOIN flupsys f ON b.flupsy_id = f.id
      JOIN cycles c ON c.basket_id = b.id AND c.end_date IS NULL AND c.state = 'active'
      LEFT JOIN LATERAL (
        SELECT so.code
        FROM operations lo
        LEFT JOIN sizes so ON lo.size_id = so.id
        WHERE lo.basket_id = b.id AND lo.cycle_id = c.id
        ORDER BY lo.date DESC, lo.id DESC
        LIMIT 1
      ) s ON true
      LEFT JOIN operations o ON o.basket_id = b.id AND o.type IN ('vagliatura', 'screening')
      GROUP BY b.physical_number, f.name, s.code
      HAVING MAX(o.date) IS NULL OR CURRENT_DATE - MAX(o.date) > 14
      ORDER BY days_since DESC NULLS FIRST
      LIMIT 20
    `);

    // Active lots summary
    const lots = await db.execute(sql`
      SELECT
        l.id,
        l.supplier,
        l.arrival_date,
        l.animal_count AS initial_count,
        s.code AS size_code,
        COUNT(DISTINCT c.basket_id) AS active_baskets
      FROM lots l
      JOIN sizes s ON l.size_id = s.id
      JOIN cycles c ON c.lot_id = l.id AND c.end_date IS NULL AND c.state = 'active'
      WHERE l.active = true
      GROUP BY l.id, l.supplier, l.arrival_date, l.animal_count, s.code
      ORDER BY l.arrival_date DESC
      LIMIT 15
    `);

    // High mortality baskets (>15%)
    const highMortality = await db.execute(sql`
      SELECT
        b.physical_number,
        f.name AS flupsy_name,
        ROUND(
          (SUM(o.dead_count)::numeric / NULLIF(MAX(o.animal_count), 0)) * 100,
          1
        ) AS mortality_pct
      FROM operations o
      JOIN baskets b ON o.basket_id = b.id
      JOIN cycles c ON c.basket_id = b.id AND c.end_date IS NULL AND c.state = 'active'
        AND o.cycle_id = c.id
      JOIN flupsys f ON b.flupsy_id = f.id
      WHERE o.dead_count > 0
        AND o.date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY b.physical_number, f.name
      HAVING (SUM(o.dead_count)::numeric / NULLIF(MAX(o.animal_count), 0)) * 100 > 15
      ORDER BY mortality_pct DESC
      LIMIT 10
    `);

    const today = new Date().toISOString().split('T')[0];

    return `
DATA CORRENTE: ${today}
IMPIANTO: Sistema FLUPSY ostricoltura (vongole / mitili / ostriche in fase larvale/giovanile)

=== CESTE ATTIVE (${(baskets.rows as any[]).length} ceste) ===
${(baskets.rows as any[]).map(b =>
  `Cesta #${b.physical_number} (${b.flupsy_name}, ${b.location}) | Taglia: ${b.current_size || 'N/A'} | Lotto: ${b.lot_supplier} | Ultima op: ${b.last_op_date ? String(b.last_op_date).split('T')[0] : 'N/A'} (${b.last_op_type || ''}) | Mortalità: ${b.mortality_percent ? Number(b.mortality_percent).toFixed(1) + '%' : 'N/A'}`
).join('\n')}

=== ULTIME OPERAZIONI 7 GIORNI (${(recentOps.rows as any[]).length}) ===
${(recentOps.rows as any[]).slice(0, 30).map(o =>
  `${String(o.date).split('T')[0]} | ${o.type} | Cesta #${o.basket_num} (${o.flupsy_name}) | ${o.animal_count ? Number(o.animal_count).toLocaleString('it-IT') + ' animali' : ''} | ${o.dead_count ? 'Morti: ' + Number(o.dead_count).toLocaleString('it-IT') : ''}`
).join('\n')}

=== CESTE DA VAGLIARE (>14gg senza vagliatura) ===
${(pendingScreenings.rows as any[]).length === 0 ? 'Nessuna' :
(pendingScreenings.rows as any[]).map(p =>
  `Cesta #${p.physical_number} (${p.flupsy_name}) | Taglia: ${p.current_size || 'N/A'} | Ultima vagliatura: ${p.last_vagliatura ? String(p.last_vagliatura).split('T')[0] : 'mai'} | Giorni: ${p.days_since || '?'}`
).join('\n')}

=== LOTTI ATTIVI (${(lots.rows as any[]).length}) ===
${(lots.rows as any[]).map(l =>
  `Lotto ${l.id} - ${l.supplier} | Arrivo: ${String(l.arrival_date).split('T')[0]} | Taglia: ${l.size_code} | Ceste attive: ${l.active_baskets}`
).join('\n')}

=== ALTA MORTALITÀ (>15%, ultimi 30gg) ===
${(highMortality.rows as any[]).length === 0 ? 'Nessuna cesta con mortalità critica' :
(highMortality.rows as any[]).map(h =>
  `⚠️ Cesta #${h.physical_number} (${h.flupsy_name}): ${h.mortality_pct}%`
).join('\n')}
`.trim();

  } catch (err: any) {
    console.error('[AI Chat] Context build error:', err.message);
    return `DATA: ${new Date().toISOString().split('T')[0]}\nImpianto FLUPSY - dati non disponibili al momento.`;
  }
}

// ─── Read-only SQL tool ──────────────────────────────────────────────────────

const SCHEMA_DOC = `
=== SCHEMA DATABASE (tabelle principali, PostgreSQL) ===
flupsys: id, name, location, active, max_positions, production_center
baskets: id, physical_number (numero cesta visibile all'operatore, NON univoco tra flupsy!), flupsy_id, state ('active'/'available'), current_cycle_id, row, position
cycles: id, basket_id, lot_id, start_date, end_date (NULL = ciclo aperto), state ('active'/'closed'), cohort_id
operations: id, date, type ('prima-attivazione','misura','peso','vagliatura','chiusura-ciclo-vagliatura','vendita','trasferimento','pulizia',...), basket_id, cycle_id, size_id, lot_id, animal_count, total_weight (grammi), animals_per_kg, average_weight (mg), dead_count, mortality_rate, notes, cancelled_at (escludere le annullate: cancelled_at IS NULL)
lots: id, arrival_date, supplier, supplier_lot_number, animal_count (conteggio iniziale arrivo), size_id, active, total_mortality
sizes: id, code ('TP-3500', 'TP-4500',...), size_mm, min_animals_per_kg, max_animals_per_kg
selections (= vagliature): id, selection_number (numero vagliatura mostrato all'utente, DIVERSO da id!), date, purpose, status, notes, is_cross_flupsy
selection_source_baskets: selection_id, basket_id, cycle_id, animal_count, total_weight, animals_per_kg, size_id, lot_id (ceste ORIGINE della vagliatura)
selection_destination_baskets: selection_id, basket_id, cycle_id, destination_type ('placed'/'sold'), animal_count, live_animals, total_weight, animals_per_kg, size_id, dead_count, mortality_rate, sample_weight, sample_count (ceste DESTINAZIONE)
basket_lot_composition: basket_id, cycle_id, lot_id, animal_count, percentage (composizione lotti misti)
lot_mortality_records: lot_id, calculation_date, initial_count, current_count, sold_count, mortality_count, mortality_percentage

NOTE IMPORTANTI:
- Per riferirti a una vagliatura usa selections.selection_number (es. "vagliatura n.253"), mai l'id interno.
- Le ceste si identificano con physical_number + nome flupsy (join baskets->flupsys).
- I conteggi delle ceste origine di una vagliatura sono spesso ereditati da operazioni precedenti (peso × densità della data di origine): verifica sempre la data dell'ultima misura/pesata reale.
- Escludi sempre le operazioni annullate (cancelled_at IS NULL).
- ATTENZIONE: in selection_source_baskets il size_id è spesso NULL. Per la taglia delle ceste origine usa animals_per_kg confrontato con sizes (min/max_animals_per_kg) oppure l'ultima operazione con size_id del ciclo. Non concludere mai "nessun animale in ingresso per questa taglia" solo perché size_id è NULL: raggruppa origine e destinazione per fascia di animals_per_kg.
`.trim();

function sanitizeReadOnlySql(input: string): string {
  const cleaned = input
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .trim()
    .replace(/;+\s*$/, '');
  if (cleaned.includes(';')) {
    throw new Error('Una sola istruzione SQL per query.');
  }
  if (!/^(select|with)\b/i.test(cleaned)) {
    throw new Error('Sono consentite solo query SELECT (o WITH ... SELECT).');
  }
  const forbidden = /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|copy|vacuum|reindex|call|do|execute|set|listen|notify|pg_sleep|pg_terminate|pg_cancel)\b/i;
  const match = cleaned.match(forbidden);
  if (match) {
    throw new Error(`Parola chiave non consentita: ${match[0]}`);
  }
  return cleaned;
}

// Pool dedicato per le query dell'assistente: transazione READ ONLY imposta dal DB,
// timeout breve, LIMIT esterno sempre applicato (non aggirabile da LIMIT interni).
let aiQueryPool: import('pg').Pool | null = null;
async function getAiQueryPool() {
  if (!aiQueryPool) {
    const { Pool } = await import('pg');
    aiQueryPool = new Pool({
      connectionString: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
      max: 2,
      idleTimeoutMillis: 30000,
    });
  }
  return aiQueryPool;
}

async function runReadOnlyQuery(query: string): Promise<string> {
  const cleaned = sanitizeReadOnlySql(query);
  // Wrapper sempre applicato: il LIMIT esterno vince su qualsiasi LIMIT interno
  const limited = `SELECT * FROM (${cleaned}) __q LIMIT 200`;

  const pool = await getAiQueryPool();
  const client = await pool.connect();
  let rows: any[];
  try {
    await client.query('BEGIN TRANSACTION READ ONLY');
    await client.query(`SET LOCAL statement_timeout = '8s'`);
    const result = await client.query(limited);
    rows = result.rows as any[];
  } finally {
    try { await client.query('ROLLBACK'); } catch (_) { /* noop */ }
    client.release();
  }
  if (rows.length === 0) return 'Nessuna riga trovata.';

  let out = JSON.stringify(rows.slice(0, 200), (_k, v) =>
    v instanceof Date ? v.toISOString().split('T')[0] : v
  );
  const MAX_CHARS = 12000;
  if (out.length > MAX_CHARS) {
    out = out.slice(0, MAX_CHARS) + `\n... [risultato troncato: ${rows.length} righe totali, restringi la query]`;
  }
  return out;
}

const SQL_TOOL = {
  type: 'function' as const,
  function: {
    name: 'esegui_query_sql',
    description:
      'Esegue una query SQL di SOLA LETTURA (SELECT) sul database PostgreSQL dell\'impianto per analisi approfondite: vagliature, bilanci IN/OUT, mortalità, storici cesta, lotti, taglie. Usa lo schema fornito nel prompt. Massimo 200 righe per query: usa aggregazioni e LIMIT.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Query SQL SELECT (una sola istruzione, PostgreSQL)' },
        scopo: { type: 'string', description: 'Breve descrizione in italiano di cosa stai cercando (mostrata all\'utente)' },
      },
      required: ['query', 'scopo'],
    },
  },
};

// ─── POST /api/ai-chat/message ───────────────────────────────────────────────

router.post('/message', async (req: Request, res: Response) => {
  const { messages } = req.body as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'AI non configurata' });
  }

  let contextSnapshot = '';
  try {
    contextSnapshot = await buildOperatorContext();
  } catch (_) {
    contextSnapshot = `DATA: ${new Date().toISOString().split('T')[0]}`;
  }

  const systemPrompt = `Sei l'assistente AI dell'impianto FLUPSY di ostricoltura. Rispondi SEMPRE in italiano.
Sei diretto, pratico e conosci il dominio: ceste, vagliature, taglia, mortalità, SGR, lotti, trasferimenti.
Quando l'operatore ti chiede cosa fare, dai suggerimenti concreti e azionabili.
Per le note di operazione, genera testo breve e professionale in italiano.
Non inventare dati non presenti nel contesto — se non hai l'informazione, dillo chiaramente.
Usa i numeri delle ceste (es. "Cesta #3"), i nomi dei flupsy e i codici taglia (TP-1900, TP-2500...) esattamente come appaiono nei dati.

HAI ACCESSO AL DATABASE tramite lo strumento "esegui_query_sql" (sola lettura).
Usalo ogni volta che la domanda richiede dati non presenti nello snapshot: analisi di vagliature (bilancio animali/pesi IN vs OUT, deficit per taglia), storici di una cesta, andamenti di mortalità, confronti tra lotti, verifiche di conteggi.
Metodo OBBLIGATORIO per l'analisi di una vagliatura N:
1. Trova la selection con selection_number = N (prendi il suo id).
2. BILANCIO TOTALE (il dato autorevole): deficit = SUM(selection_source_baskets.animal_count) − SUM(selection_destination_baskets.animal_count) per quella selection_id. Fai lo stesso con total_weight. Se le note della selection riportano una discrepanza, il tuo bilancio deve coincidere.
3. Elenca le ceste origine (animal_count, total_weight, animals_per_kg) e le ceste destinazione (con size e destination_type).
4. Per il confronto per taglia NON usare size_id delle origini (spesso NULL): dividi origini e destinazioni in fasce di animals_per_kg (es. >15000 = taglie piccole, <15000 = taglie grandi) e confronta i subtotali IN vs OUT per fascia.
5. Verifica la provenienza dei conteggi origine (ultime operazioni misura/peso/prima-attivazione per cesta+ciclo): conteggi vecchi = stime ereditate.
6. Considera la crescita: i pesi origine rilevati giorni prima sottostimano la biomassa attesa in uscita.
Non dichiarare mai "nessun deficit" senza aver eseguito il punto 2.
Esegui più query in sequenza se serve; poi presenta un'analisi strutturata con numeri precisi, cause probabili e raccomandazioni.

${SCHEMA_DOC}

=== SNAPSHOT DATI IMPIANTO ===
${contextSnapshot}`;

  // Streaming SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Abort upstream stream if the client disconnects
  const abortController = new AbortController();
  req.on('close', () => abortController.abort());

  try {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey, timeout: 60000 });

    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
    // I modelli di ragionamento (o-series, gpt-5*) non accettano temperature custom né max_tokens
    const isReasoningModel = /^(o\d|gpt-5)/i.test(model);
    const modelParams = isReasoningModel
      ? { max_completion_tokens: 6000 }
      : { temperature: 0.4, max_tokens: 2000 };

    const convo: any[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const MAX_TOOL_ROUNDS = 8;
    const MAX_TOTAL_TOOL_CALLS = 14;
    let rounds = 0;
    let totalToolCalls = 0;

    while (true) {
      const isLastRound = rounds >= MAX_TOOL_ROUNDS;

      const stream = await client.chat.completions.create({
        model,
        messages: convo,
        ...(isLastRound ? {} : { tools: [SQL_TOOL] }),
        ...modelParams,
        stream: true,
      }, { signal: abortController.signal });

      let content = '';
      const toolCalls: Array<{ id: string; name: string; args: string }> = [];

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (!delta) continue;
        if (delta.content) {
          content += delta.content;
          res.write(`data: ${JSON.stringify({ delta: delta.content })}\n\n`);
        }
        for (const tc of delta.tool_calls ?? []) {
          if (tc.index != null && !toolCalls[tc.index]) {
            toolCalls[tc.index] = { id: tc.id || '', name: '', args: '' };
          }
          const slot = toolCalls[tc.index ?? 0];
          if (tc.id) slot.id = tc.id;
          if (tc.function?.name) slot.name += tc.function.name;
          if (tc.function?.arguments) slot.args += tc.function.arguments;
        }
      }

      if (toolCalls.length === 0) break; // final answer complete

      rounds++;
      convo.push({
        role: 'assistant',
        content: content || null,
        tool_calls: toolCalls.map(tc => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.name, arguments: tc.args },
        })),
      });

      for (const tc of toolCalls) {
        let toolResult: string;
        let scopo = '';
        try {
          if (totalToolCalls >= MAX_TOTAL_TOOL_CALLS) {
            throw new Error('Limite massimo di query raggiunto per questa risposta: concludi l\'analisi con i dati già raccolti.');
          }
          totalToolCalls++;
          const parsed = JSON.parse(tc.args || '{}');
          scopo = parsed.scopo || '';
          if (tc.name !== 'esegui_query_sql') {
            throw new Error(`Strumento sconosciuto: ${tc.name}`);
          }
          res.write(`data: ${JSON.stringify({ status: scopo || 'Interrogo il database…' })}\n\n`);
          toolResult = await runReadOnlyQuery(parsed.query || '');
        } catch (toolErr: any) {
          toolResult = `ERRORE QUERY: ${toolErr.message}`;
        }
        convo.push({ role: 'tool', tool_call_id: tc.id, content: toolResult });
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err: any) {
    if (abortController.signal.aborted) {
      // Client went away — nothing to write
      return;
    }
    console.error('[AI Chat] OpenAI error:', err.message);
    res.write(`data: ${JSON.stringify({ error: 'Errore AI temporaneo, riprova tra poco.' })}\n\n`);
    res.end();
  }
});

export const aiChatRoutes = router;
