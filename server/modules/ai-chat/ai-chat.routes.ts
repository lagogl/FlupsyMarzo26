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

    const stream = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.4,
      max_tokens: 1200,
      stream: true,
    }, { signal: abortController.signal });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
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
