import { execSync } from "child_process";
import QRCode from "qrcode";
import pkg from "whatsapp-web.js";

const { Client, LocalAuth, MessageMedia } = pkg;
type WAClient = InstanceType<typeof Client>;

// Nome del gruppo WhatsApp di destinazione (richiesto: Delta Futuro Equipe Tecnica)
export const TARGET_GROUP_NAME = "Delta Futuro Equipe Tecnica";

// Tempo massimo (ms) per ottenere QR o connessione prima di considerare fallito l'avvio
const INIT_TIMEOUT_MS = 90_000;

let client: WAClient | null = null;
let currentQrDataUrl: string | null = null;
let ready = false;
let initializing = false;
let lastError: string | null = null;

function resolveChromiumPath(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  try {
    return execSync("which chromium").toString().trim() || undefined;
  } catch {
    return undefined;
  }
}

export function getStatus() {
  const state = ready
    ? "connected"
    : currentQrDataUrl
    ? "qr"
    : initializing
    ? "initializing"
    : "disconnected";
  return {
    connected: ready,
    initializing,
    hasQr: !!currentQrDataUrl,
    error: lastError,
    state,
    targetGroup: TARGET_GROUP_NAME,
  };
}

export function getQr(): string | null {
  return currentQrDataUrl;
}

/**
 * Avvia (se necessario) il client WhatsApp Web. È idempotente: chiamate ripetute
 * mentre è già connesso o in avvio non creano nuovi client. La gestione del ciclo
 * di vita è "instance-safe": gli handler degli eventi agiscono solo se l'istanza
 * che li ha emessi è ancora quella corrente, così eventi tardivi di un client
 * vecchio non corrompono lo stato di uno nuovo.
 */
export async function connect() {
  if (ready || initializing) return getStatus();
  initializing = true;
  lastError = null;
  currentQrDataUrl = null;

  // Distruggi eventuali client orfani prima di crearne uno nuovo
  if (client) {
    const stale = client;
    client = null;
    try {
      await stale.destroy();
    } catch {}
  }

  const instance: WAClient = new Client({
    authStrategy: new LocalAuth({ dataPath: ".wa-session" }),
    puppeteer: {
      headless: true,
      executablePath: resolveChromiumPath(),
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    },
  });
  client = instance;

  const isCurrent = () => client === instance;

  // Watchdog: se entro INIT_TIMEOUT_MS non arriva né QR né "ready", sblocca lo stato
  let watchdog: ReturnType<typeof setTimeout> | null = setTimeout(() => {
    if (isCurrent() && !ready && !currentQrDataUrl) {
      lastError = "Timeout di connessione a WhatsApp. Riprova.";
      initializing = false;
      instance.destroy().catch(() => {});
      if (isCurrent()) client = null;
    }
  }, INIT_TIMEOUT_MS);
  const clearWatchdog = () => {
    if (watchdog) {
      clearTimeout(watchdog);
      watchdog = null;
    }
  };

  instance.on("qr", async (qr: string) => {
    if (!isCurrent()) return;
    clearWatchdog();
    try {
      currentQrDataUrl = await QRCode.toDataURL(qr, { width: 320, margin: 1 });
      ready = false;
    } catch (e: any) {
      lastError = "Errore generazione QR: " + (e?.message || String(e));
    }
  });

  instance.on("ready", () => {
    if (!isCurrent()) return;
    clearWatchdog();
    ready = true;
    initializing = false;
    currentQrDataUrl = null;
    lastError = null;
  });

  instance.on("authenticated", () => {
    if (!isCurrent()) return;
    currentQrDataUrl = null;
  });

  instance.on("auth_failure", (msg: string) => {
    if (!isCurrent()) return;
    clearWatchdog();
    lastError = "Autenticazione fallita: " + msg;
    ready = false;
    initializing = false;
  });

  instance.on("disconnected", async (reason: string) => {
    if (!isCurrent()) return;
    clearWatchdog();
    ready = false;
    initializing = false;
    lastError = "Disconnesso: " + reason;
    try {
      await instance.destroy();
    } catch {}
    if (isCurrent()) client = null;
  });

  instance.initialize().catch((e: any) => {
    if (!isCurrent()) return;
    clearWatchdog();
    lastError = e?.message || String(e);
    initializing = false;
    ready = false;
    client = null;
  });

  return getStatus();
}

async function findTargetGroup() {
  if (!client || !ready) throw new Error("WhatsApp non connesso");
  const chats = await client.getChats();
  const target = TARGET_GROUP_NAME.trim().toLowerCase();
  const group = chats.find(
    (c: any) => c.isGroup && (c.name || "").trim().toLowerCase() === target,
  );
  return group || null;
}

/**
 * Invia un'immagine (PNG base64 / data URL) al gruppo di destinazione.
 */
export async function sendImageToTargetGroup(imageBase64: string, caption: string) {
  if (!client || !ready) throw new Error("WhatsApp non connesso");
  const group = await findTargetGroup();
  if (!group) {
    throw new Error(
      `Gruppo "${TARGET_GROUP_NAME}" non trovato. Verifica che l'account WhatsApp collegato sia membro del gruppo.`,
    );
  }
  const data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const media = new MessageMedia("image/png", data, "mappa-termica.png");
  await client.sendMessage(group.id._serialized, media, { caption: caption || undefined });
  return { to: group.name as string };
}
