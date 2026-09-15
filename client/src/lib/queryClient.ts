import { QueryClient, QueryFunction } from "@tanstack/react-query";

function notifyExpiredSession() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth:expired"));
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Funzione apiRequest overload per supportare entrambi i pattern di chiamata
export async function apiRequest<T = any>(
  urlOrOptions: string | { url: string; method?: string; body?: any },
  methodOrOptions?: string | RequestInit,
  bodyData?: any
): Promise<T> {
  let url: string;
  let options: RequestInit = {};
  let method = '';
  
  // Determina quale pattern di chiamata è stato usato
  if (typeof urlOrOptions === 'string') {
    url = urlOrOptions;
    
    // Pattern 1: apiRequest(url, method, body) - 3 parametri
    if (typeof methodOrOptions === 'string') {
      method = methodOrOptions;
      options.method = method;
      if (bodyData) {
        options.body = JSON.stringify(bodyData);
        options.headers = {
          'Content-Type': 'application/json'
        };
      }
    } 
    // Pattern 2: apiRequest(url, options) - 2 parametri
    else if (methodOrOptions && typeof methodOrOptions === 'object') {
      options = methodOrOptions;
      method = options.method || 'GET';
      // Se c'è un body nelle options, assicurati che ci sia il Content-Type
      if (options.body) {
        options.headers = {
          ...options.headers,
          'Content-Type': 'application/json'
        };
      }
    }
    // Pattern 3: apiRequest(url) - 1 parametro
    else {
      method = 'GET';
    }
  } else {
    // Pattern 4: apiRequest({ url, method, body }) - oggetto
    url = urlOrOptions.url;
    method = urlOrOptions.method || 'GET';
    options.method = method;
    if (urlOrOptions.body) {
      options.body = JSON.stringify(urlOrOptions.body);
      options.headers = {
        ...options.headers,
        'Content-Type': 'application/json'
      };
    }
  }

  // CRITICAL FIX: Method-override workaround for Replit proxy blocking PATCH/PUT
  if (method === 'PATCH' || method === 'PUT') {
    console.log(`🔄 METHOD-OVERRIDE: Converting ${method} to POST with X-HTTP-Method-Override header`);
    options.method = 'POST';
    options.headers = {
      ...options.headers,
      'X-HTTP-Method-Override': method
    };
  }
  
  console.log(`API Request: ${method}`, url);
  
  try {
    const res = await fetch(url, {
      ...options,
      credentials: "include"
    });
    
    console.log(`API Response status: ${res.status}`);
    if (res.status === 401) {
      notifyExpiredSession();
    }
    
    // Gestione migliore delle risposte
    if (!res.ok) {
      // Se la risposta non è OK, lancia un errore con i dati JSON se possibile
      const text = await res.text();
      let responseMessage = '';
      let responseData: unknown;
      
      // Aggiungi proprietà personalizzate all'errore per un migliore handling
      try {
        if (text && text.trim().startsWith('{')) {
          const jsonData = JSON.parse(text);
          responseData = jsonData;
          responseMessage = jsonData.error || jsonData.message || '';
        }
      } catch (e) {
        console.warn('Failed to parse error response as JSON:', e);
      }

      const error = new Error(
        responseMessage || `${res.status}: ${res.statusText || 'Request failed'}`
      );
      // @ts-ignore - Aggiungiamo proprietà personalizzate all'oggetto Error
      error.data = responseData;
      // @ts-ignore - Aggiungiamo il messaggio come proprietà autonoma
      error.responseMessage = responseMessage;
      
      throw error;
    }
    
    // Clona la risposta per poterla ispezionare e poi restituirla
    const resClone = res.clone();
    
    // Analizza la risposta senza stampare payload potenzialmente sensibili.
    let responseData: any = null;
    try {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await resClone.json();
      } else {
        const text = await resClone.text();
        // Se la risposta è vuota ma lo stato è OK, mappa a un oggetto di successo
        if (!text || text.trim() === '') {
          responseData = { success: true };
        }
      }
    } catch (error) {
      console.log('Response processing error:', error);
      // Se c'è un errore nel parsing ma la risposta è OK, restituisci un oggetto di successo
      responseData = { success: true };
    }
    
    // Abbiamo già gestito gli errori in precedenza, qui ritorniamo direttamente i dati elaborati
    if (responseData !== null) {
      return responseData as T;
    }
    
    // Se è una risposta JSON, restituisci il JSON parsato
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        return await res.json();
      } catch (e) {
        console.warn('Failed to parse JSON response, returning empty object');
        return {} as T;
      }
    }
    
    // Altrimenti restituisci l'oggetto Response
    return res as unknown as T;
  } catch (error) {
    console.error('API Request failed', {
      url,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey, signal }) => {
    // Estrai l'URL base e gli eventuali parametri aggiuntivi
    const baseUrl = queryKey[0] as string;
    const params: Record<string, unknown> =
      queryKey.length > 1 && typeof queryKey[1] === 'object' && queryKey[1] !== null
        ? queryKey[1] as Record<string, unknown>
        : {};
    
    // Costruisci l'URL con i parametri di query
    let url = baseUrl;
    if (Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      url = `${baseUrl}?${searchParams.toString()}`;
    }
    
    console.log(`Query request to: ${url}`);
    
    // Crea un timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondi timeout
    
    try {
      const res = await fetch(url, {
        credentials: "include",
        signal: signal || controller.signal, // Usa il signal della query o il nostro timeout
      });

      clearTimeout(timeoutId);

      if (res.status === 401) {
        notifyExpiredSession();
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('La richiesta ha impiegato troppo tempo. Riprova più tardi.');
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false, // Disabilita polling automatico
      refetchIntervalInBackground: false,
      refetchOnMount: true, // Permetti caricamento iniziale
      refetchOnReconnect: true, // Riconnetti quando torna online
      refetchOnWindowFocus: false, // Evita refetch su focus finestra
      staleTime: 30 * 1000, // 30 secondi - dati freschi per operazioni
      gcTime: 5 * 60 * 1000, // 5 minuti garbage collection
      retry: 1, // Riprova una volta in caso di errore
      retryDelay: 1000, // Aspetta 1 secondo prima di riprovare
    },
    mutations: {
      retry: false,
    },
  },
});

// Le taglie possono essere versionate per data di business. Un unico timer
// condiviso viene armato alla prossima mezzanotte Europe/Rome, evitando polling
// continuo o logica duplicata a ogni componente che usa /api/sizes.
let sizesBusinessDateTimer: ReturnType<typeof setTimeout> | null = null;
let sizesBusinessDateListenersInstalled = false;

const romeDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Rome",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const romeOffsetFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Rome",
  timeZoneName: "shortOffset",
});

let sizesBusinessDateKey = getEuropeRomeDateKey();

function getEuropeRomeDateKey(): string {
  const parts = romeDateFormatter.formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getEuropeRomeOffsetMinutes(date: Date): number {
  const timeZoneName = romeOffsetFormatter
    .formatToParts(date)
    .find(part => part.type === "timeZoneName")?.value ?? "GMT";
  const match = timeZoneName.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0);
  return match[1] === "-" ? -minutes : minutes;
}

function getMillisecondsUntilNextEuropeRomeMidnight(): number {
  const now = new Date();
  const parts = romeDateFormatter.formatToParts(now);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const nextUtcMidnight = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day) + 1,
  );
  const initialOffset = getEuropeRomeOffsetMinutes(new Date(nextUtcMidnight));
  let target = nextUtcMidnight - initialOffset * 60 * 1000;
  // Re-evaluate once at the target to handle a DST transition at midnight.
  const targetOffset = getEuropeRomeOffsetMinutes(new Date(target));
  target = nextUtcMidnight - targetOffset * 60 * 1000;
  return Math.max(1000, target - now.getTime());
}

function checkEuropeRomeBusinessDate(): void {
  const nextKey = getEuropeRomeDateKey();
  if (nextKey === sizesBusinessDateKey) return;
  sizesBusinessDateKey = nextKey;
  void queryClient.invalidateQueries({ queryKey: ["/api/sizes"] });
}

const handleSizesVisibilityChange = (): void => {
  if (document.visibilityState === "visible") checkEuropeRomeBusinessDate();
};

function scheduleSizesBusinessDateRefresh(): void {
  if (typeof window === "undefined") return;
  if (sizesBusinessDateTimer) clearTimeout(sizesBusinessDateTimer);
  sizesBusinessDateTimer = setTimeout(() => {
    sizesBusinessDateTimer = null;
    checkEuropeRomeBusinessDate();
    scheduleSizesBusinessDateRefresh();
  }, getMillisecondsUntilNextEuropeRomeMidnight());
}

export function cleanupSizesBusinessDateRefresh(): void {
  if (sizesBusinessDateTimer) {
    clearTimeout(sizesBusinessDateTimer);
    sizesBusinessDateTimer = null;
  }
  if (typeof window !== "undefined" && sizesBusinessDateListenersInstalled) {
    window.removeEventListener("focus", checkEuropeRomeBusinessDate);
    document.removeEventListener("visibilitychange", handleSizesVisibilityChange);
    sizesBusinessDateListenersInstalled = false;
  }
}

function installSizesBusinessDateRefresh(): void {
  if (typeof window === "undefined" || sizesBusinessDateListenersInstalled) return;
  window.addEventListener("focus", checkEuropeRomeBusinessDate);
  document.addEventListener("visibilitychange", handleSizesVisibilityChange);
  sizesBusinessDateListenersInstalled = true;
  scheduleSizesBusinessDateRefresh();
}

installSizesBusinessDateRefresh();
