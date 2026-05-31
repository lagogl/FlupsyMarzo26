/**
 * Scheduler per la sonda Seneye "DF SIFONI".
 * L'API Seneye aggiorna l'ultima lettura ogni ~30 minuti, quindi salviamo
 * uno snapshot ogni 30 minuti per costruire lo storico (grafico/tabella).
 */
import { pollAndStore, isConfigured } from "../modules/seneye/seneye.service";

const INTERVAL_MS = 30 * 60 * 1000; // 30 minuti

let intervalHandle: NodeJS.Timeout | null = null;

async function runOnce(): Promise<void> {
  if (!isConfigured()) {
    console.log("🌊 SENEYE: credenziali non configurate, skip lettura.");
    return;
  }
  try {
    const row = await pollAndStore();
    console.log(
      `🌊 SENEYE: snapshot salvato (${row.deviceName}) — temp=${row.temperature ?? "-"}°C pH=${row.ph ?? "-"} NH3=${row.nh3 ?? "-"} O2=${row.o2 ?? "-"}`
    );
  } catch (e: any) {
    console.error("❌ SENEYE: errore durante la lettura della sonda:", e?.message || e);
  }
}

export function startSeneyeScheduler(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
  // Lettura iniziale dopo 60s dall'avvio, poi ogni 30 minuti.
  setTimeout(() => {
    runOnce();
  }, 60 * 1000);

  intervalHandle = setInterval(runOnce, INTERVAL_MS);
  console.log(`🌊 Scheduler SENEYE attivo (lettura ogni ${INTERVAL_MS / 60000} minuti)`);
}

export function stopSeneyeScheduler(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
