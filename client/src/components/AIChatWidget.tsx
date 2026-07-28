import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Send, ChevronDown, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  pending?: boolean;
}

const QUICK_ACTIONS = [
  '📊 Mortalità alta oggi?',
  '🔍 Ceste da vagliare',
  '📝 Riassumi operazioni settimana',
  '⚠️ Alert critici',
];

export function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus textarea when opened
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open, minimized]);

  const sendMessage = useCallback(async (text: string) => {
    const userText = text.trim();
    if (!userText || loading) return;

    const history = messages.filter(m => !m.pending);
    const newHistory: Message[] = [
      ...history,
      { role: 'user', content: userText },
      { role: 'assistant', content: '', pending: true },
    ];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    const apiMessages = [
      ...history,
      { role: 'user' as const, content: userText },
    ];

    try {
      const response = await fetch('/api/ai-chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let sseBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n');
        // Keep the last (possibly incomplete) line in the buffer
        sseBuffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;

          let json: any = null;
          try { json = JSON.parse(payload); } catch (_) { continue; /* incomplete/malformed frame */ }
          if (json.error) throw new Error(json.error);
          if (json.delta) {
            accumulated += json.delta;
            setMessages(prev => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (updated[lastIdx]?.role === 'assistant') {
                updated[lastIdx] = { role: 'assistant', content: accumulated };
              }
              return updated;
            });
          }
        }
      }

    } catch (err: any) {
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === 'assistant') {
          updated[lastIdx] = {
            role: 'assistant',
            content: `⚠️ Errore: ${err.message || 'Impossibile contattare l\'AI'}`,
          };
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setMinimized(false);
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Ciao! Sono l\'assistente AI dell\'impianto. Posso rispondere a domande su ceste, mortalità, vagliature, lotti e operazioni. Come posso aiutarti?',
      }]);
    }
  };

  // ── Closed state: FAB button ─────────────────────────────────────────────
  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        title="Assistente AI"
      >
        <Bot className="h-5 w-5" />
      </button>
    );
  }

  // ── Open state: chat panel ───────────────────────────────────────────────
  return (
    <div
      className={cn(
        'fixed bottom-5 right-5 z-50 w-[340px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col transition-all duration-200',
        minimized ? 'h-[52px]' : 'h-[480px]',
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 bg-indigo-600 rounded-t-xl cursor-pointer select-none"
        onClick={() => setMinimized(m => !m)}
      >
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-semibold">Assistente AI Impianto</span>
          {loading && <Loader2 className="h-3 w-3 animate-spin opacity-70" />}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={e => { e.stopPropagation(); setMinimized(m => !m); }}
            className="text-white/70 hover:text-white p-0.5"
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', minimized ? 'rotate-180' : '')} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setOpen(false); }}
            className="text-white/70 hover:text-white p-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 px-3 py-2">
            <div className="flex flex-col gap-2">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'max-w-[88%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap',
                    msg.role === 'user'
                      ? 'self-end bg-indigo-600 text-white'
                      : 'self-start bg-gray-100 text-gray-800',
                    msg.pending && !msg.content && 'animate-pulse',
                  )}
                >
                  {msg.content || (msg.pending ? '…' : '')}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Quick actions (only at start) */}
          {messages.length <= 1 && (
            <div className="px-3 pb-1 flex flex-wrap gap-1">
              {QUICK_ACTIONS.map(qa => (
                <button
                  key={qa}
                  onClick={() => sendMessage(qa)}
                  disabled={loading}
                  className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 border border-indigo-200 transition-colors disabled:opacity-50"
                >
                  {qa}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-1 flex gap-2 items-end border-t">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Scrivi un messaggio… (Invio per inviare)"
              className="resize-none text-sm min-h-[36px] max-h-[100px] py-1.5"
              rows={1}
              disabled={loading}
            />
            <Button
              size="sm"
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 h-8 w-8 p-0 shrink-0"
            >
              {loading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Send className="h-3.5 w-3.5" />
              }
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
