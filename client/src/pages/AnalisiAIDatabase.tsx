import { useState, useRef, useEffect, useCallback } from 'react';
import { Lock, Send, Loader2, Database, Bot, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  pending?: boolean;
  model?: string;
}

const MODEL_LABELS: Record<string, string> = {
  'gpt-5': 'GPT-5 (OpenAI — ragionamento, massima profondità)',
  'gpt-5-mini': 'GPT-5 mini (OpenAI — ragionamento, veloce)',
  'o4-mini': 'o4-mini (OpenAI — ragionamento)',
  'gpt-4.1': 'GPT-4.1 (OpenAI — standard, potente)',
  'gpt-4.1-mini': 'GPT-4.1 mini (OpenAI — standard, economico)',
  'claude-opus-4-1': 'Claude Opus 4.1 (Anthropic — massima qualità)',
  'claude-sonnet-4-5': 'Claude Sonnet 4.5 (Anthropic — equilibrato)',
  'claude-haiku-4-5': 'Claude Haiku 4.5 (Anthropic — veloce)',
};

const QUICK_PROMPTS = [
  'Analizza l\'ultima vagliatura registrata',
  'Storia completa di un lotto (chiedimi quale)',
  'Mortalità per lotto negli ultimi 30 giorni',
  'Confronta SGR reale vs teorico per taglia',
];

const STORAGE_KEY = 'analisi-ai-db-pw';

export default function AnalisiAIDatabase() {
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState('gpt-5-mini');
  const [unlockError, setUnlockError] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const tryUnlock = useCallback(async (pw: string) => {
    setUnlocking(true);
    setUnlockError('');
    try {
      const r = await fetch('/api/ai-chat/analysis/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.error || 'Password errata');
      sessionStorage.setItem(STORAGE_KEY, pw);
      setModels(j.models || []);
      setUnlocked(true);
      setMessages([{
        role: 'assistant',
        content: 'Accesso consentito. Sono l\'analista AI del database (sola lettura). Scegli il modello in alto e fammi una domanda: analisi di vagliature, storie di lotti, mortalità, bilanci, SGR…',
      }]);
    } catch (e: any) {
      sessionStorage.removeItem(STORAGE_KEY);
      setUnlockError(e.message || 'Errore');
    } finally {
      setUnlocking(false);
    }
  }, []);

  // Auto-unlock se la password è già in sessione
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) { setPassword(saved); tryUnlock(saved); }
  }, [tryUnlock]);

  const sendMessage = useCallback(async (text: string) => {
    const userText = text.trim();
    if (!userText || loading) return;

    const history = messages.filter(m => !m.pending);
    setMessages([
      ...history,
      { role: 'user', content: userText },
      { role: 'assistant', content: '', pending: true, model },
    ]);
    setInput('');
    setLoading(true);

    const apiMessages = [...history, { role: 'user' as const, content: userText }]
      .map(({ role, content }) => ({ role, content }));

    try {
      const response = await fetch('/api/ai-chat/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-analysis-password': sessionStorage.getItem(STORAGE_KEY) || '',
        },
        body: JSON.stringify({ messages: apiMessages, model }),
      });

      if (response.status === 403) {
        sessionStorage.removeItem(STORAGE_KEY);
        setUnlocked(false);
        throw new Error('Password non più valida: reinseriscila.');
      }
      if (response.status === 401) {
        throw new Error('Sessione scaduta: effettua di nuovo il login.');
      }
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let sseBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;
          let json: any = null;
          try { json = JSON.parse(payload); } catch { continue; }
          if (json.error) throw new Error(json.error);
          if (json.status && !accumulated) {
            setMessages(prev => {
              const updated = [...prev];
              const last = updated.length - 1;
              if (updated[last]?.role === 'assistant') {
                updated[last] = { role: 'assistant', content: `🔎 ${json.status}`, pending: true, model };
              }
              return updated;
            });
          }
          if (json.delta) {
            accumulated += json.delta;
            setMessages(prev => {
              const updated = [...prev];
              const last = updated.length - 1;
              if (updated[last]?.role === 'assistant') {
                updated[last] = { role: 'assistant', content: accumulated, model };
              }
              return updated;
            });
          }
        }
      }
    } catch (err: any) {
      setMessages(prev => {
        const updated = [...prev];
        const last = updated.length - 1;
        if (updated[last]?.role === 'assistant') {
          updated[last] = { role: 'assistant', content: `⚠️ Errore: ${err.message}` };
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }, [messages, loading, model]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ── Schermata password ────────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-sm bg-white rounded-xl border shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-purple-700">
            <Lock className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Analisi AI Database</h1>
          </div>
          <p className="text-sm text-gray-500">
            Area protetta. Inserisci la password di accesso per usare l'analista AI (sola lettura sul database).
          </p>
          <form
            onSubmit={e => { e.preventDefault(); tryUnlock(password); }}
            className="flex flex-col gap-3"
          >
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
            />
            {unlockError && <p className="text-sm text-red-600">{unlockError}</p>}
            <Button type="submit" disabled={unlocking || !password} className="bg-purple-600 hover:bg-purple-700">
              {unlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Accedi'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // ── Chat ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3 pb-3 border-b flex-wrap">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-purple-600" />
          <div>
            <h1 className="text-lg font-semibold leading-tight">Analisi AI Database</h1>
            <p className="text-xs text-gray-500">Sola lettura — nessuna scrittura possibile sul database</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="w-[300px] h-9 text-sm" aria-label="Modello AI">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map(m => (
                <SelectItem key={m} value={m}>{MODEL_LABELS[m] || m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            title="Svuota conversazione"
            onClick={() => setMessages(prev => prev.slice(0, 1))}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 py-4 pr-2">
        <div className="flex flex-col gap-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'max-w-[85%] rounded-lg px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                msg.role === 'user'
                  ? 'self-end bg-purple-600 text-white'
                  : 'self-start bg-gray-100 text-gray-800',
                msg.pending && !msg.content && 'animate-pulse',
              )}
            >
              {msg.role === 'assistant' && msg.model && (
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-purple-500 mb-1">
                  <Bot className="h-3 w-3" /> {msg.model}
                </div>
              )}
              {msg.content || (msg.pending ? '…' : '')}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {messages.length <= 1 && (
        <div className="pb-2 flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map(qp => (
            <button
              key={qp}
              onClick={() => sendMessage(qp)}
              disabled={loading}
              className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full px-3 py-1 border border-purple-200 transition-colors disabled:opacity-50"
            >
              {qp}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-end border-t pt-3 pb-2">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Fai una domanda di analisi sul database… (Invio per inviare)"
          className="resize-none text-sm min-h-[44px] max-h-[140px]"
          rows={2}
          disabled={loading}
        />
        <Button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="bg-purple-600 hover:bg-purple-700 h-10 w-10 p-0 shrink-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
