/**
 * Script standalone per acquisire e salvare un dato della sonda Seneye "DF SIFONI".
 *
 * Pensato per un "Scheduled Deployment" di Replit: viene eseguito ogni 30 minuti,
 * legge l'ultima lettura dall'API Seneye, la salva nel database e termina.
 * Non richiede che l'applicazione web sia avviata.
 *
 * Esecuzione: tsx scripts/poll-seneye.ts
 */
import { pool } from "../server/db";
import { pollAndStore, isConfigured } from "../server/modules/seneye/seneye.service";

async function main() {
  if (!isConfigured()) {
    console.error(
      "[poll-seneye] Credenziali mancanti: imposta SENEYE_USERNAME e SENEYE_PASSWORD."
    );
    process.exitCode = 1;
    return;
  }

  try {
    const reading = await pollAndStore();
    console.log(
      `[poll-seneye] OK — ${reading.deviceName} @ ${new Date(
        reading.recordDate
      ).toISOString()} | temp=${reading.temperature ?? "-"}°C ph=${
        reading.ph ?? "-"
      } nh3=${reading.nh3 ?? "-"} o2=${reading.o2 ?? "-"} (id=${reading.id})`
    );
  } catch (err: any) {
    console.error(`[poll-seneye] ERRORE: ${err?.message || err}`);
    process.exitCode = 1;
  }
}

main().finally(async () => {
  // Chiude la connessione al database così il processo termina correttamente.
  try {
    await pool.end();
  } catch {
    // ignora errori di chiusura
  }
});
