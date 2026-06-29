import http from "http";
import type { Express, Request, Response, NextFunction } from "express";

// ============================================================
// FASE 1 — Bind IMMEDIATO della porta.
// L'app è pesante da caricare (~secondi). Per evitare che il
// controllo di salute del deployment fallisca durante l'avvio,
// mettiamo subito in ascolto un server minimale che risponde
// 200 alle sonde di health, e solo dopo carichiamo l'app reale.
// ============================================================
const PORT = parseInt(process.env.PORT || "5000", 10);

// Handler reale (Express) impostato quando l'app è completamente pronta.
let realHandler: http.RequestListener | null = null;

const server = http.createServer((req, res) => {
  if (realHandler) {
    realHandler(req, res);
    return;
  }
  // App ancora in warm-up: 200 alle sonde di health, 503 al resto.
  const url = req.url || "/";
  if (req.method === "GET" && (url === "/" || url === "/health" || url.startsWith("/health?"))) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ status: "starting" }));
    return;
  }
  res.statusCode = 503;
  res.setHeader("Retry-After", "3");
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ status: "starting" }));
});

// Spegnimento controllato (mantiene il comportamento precedente).
process.on("SIGTERM", () => {
  console.log("Received SIGTERM. Performing graceful shutdown...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

let listenAttempts = 0;
const maxListenAttempts = 10;
let buildStarted = false;

server.on("listening", () => {
  const addr = server.address();
  const boundPort = typeof addr === "object" && addr ? addr.port : PORT;
  console.log(`[boot] HTTP server in ascolto su ${boundPort} (warm-up in corso...)`);

  // La porta è ora effettivamente legata (bind completato a livello OS): le sonde
  // di health vengono ACCETTATE. Solo ORA avviamo la costruzione pesante dell'app
  // (valutazione sincrona del grafo dei moduli, ~secondi). La rinviamo con
  // setImmediate così libuv completa il bind prima del blocco sincrono: le
  // connessioni in arrivo vengono accodate e servite appena l'app è pronta,
  // invece di ricevere "connection refused".
  if (!buildStarted) {
    buildStarted = true;
    setImmediate(() => {
      buildApp().catch((err) => {
        console.error("⚠️ Errore durante la costruzione dell'app:", err);
        process.exit(1);
      });
    });
  }
});

server.on("error", (err: any) => {
  if (err.code === "EADDRINUSE" && listenAttempts < maxListenAttempts) {
    listenAttempts++;
    const nextPort = PORT + listenAttempts;
    console.log(`[boot] Porta occupata, provo ${nextPort}...`);
    setTimeout(() => server.listen(nextPort, "0.0.0.0"), 200);
  } else {
    console.error("[boot] Errore avvio server:", err);
    process.exit(1);
  }
});

server.listen(PORT, "0.0.0.0");

// ============================================================
// Inizializzazioni pesanti — eseguite DOPO l'handoff, in background.
// ============================================================
async function runBackgroundInitialization(app: Express) {
  const { testDatabaseConnection } = await import("./debug-db");
  const { setupPerformanceOptimizations } = await import("./index-setup");
  const { ensureDatabaseConsistency } = await import("./database-consistency-service");

  // Test di connessione database con timeout
  console.log("\n===== TEST DI CONNESSIONE DATABASE =====");
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout connessione database (10s)')), 10000)
    );
    await Promise.race([testDatabaseConnection(), timeoutPromise]);
    console.log("✅ Connessione database principale verificata con successo");
  } catch (error) {
    console.error("❌ Errore connessione database principale:", error);
    console.log("⚠️ Continuando comunque...");
  }
  console.log("===== FINE TEST DI CONNESSIONE DATABASE =====\n");

  // Configura le ottimizzazioni di prestazioni (indici database critici)
  console.log("🔧 Configurazione ottimizzazioni prestazioni e indici database...");
  try {
    await setupPerformanceOptimizations(app);
    console.log("✅ Ottimizzazioni complete - indici database attivi");
  } catch (error) {
    console.error("⚠️ Errore durante configurazione ottimizzazioni:", error);
  }

  // Controllo automatico consistenza database
  console.log("🔍 Controllo consistenza database...");
  try {
    const consistencyResult = await ensureDatabaseConsistency();
    if (consistencyResult.consistent) {
      console.log("✅ Database consistente - nessun problema rilevato");
    } else {
      console.log(`🔧 Database riparato automaticamente - risolte ${consistencyResult.fixedIssues} inconsistenze`);
    }
  } catch (error) {
    console.error("⚠️ Errore durante il controllo consistenza:", error);
  }

  // Inizializza lo scheduler SGR
  console.log("📅 Inizializzazione scheduler SGR mensile...");
  try {
    const { sgrScheduler } = await import('./modules/core/sgr/sgr-scheduler');
    sgrScheduler.start();
    console.log("✅ Scheduler SGR attivo (calcolo automatico il giorno 1 del mese)");
  } catch (error) {
    console.error("❌ Errore durante l'inizializzazione dello scheduler SGR:", error);
  }

  // Inizializza lo scheduler di controllo integrità notturno
  console.log("🔍 Inizializzazione scheduler controllo integrità notturno...");
  try {
    const { startNightlyScheduler, runIntegrityCheck } = await import('./services/nightly-integrity-check.service');
    startNightlyScheduler();
    console.log("✅ Scheduler controllo integrità attivo (esecuzione ore 03:00)");

    setTimeout(() => {
      runIntegrityCheck().then(result => {
        if (result.status === 'issues_found') {
          console.log(`⚠️ Controllo iniziale: ${result.issuesFound.length} anomalie rilevate`);
        }
      }).catch(err => console.error('Errore controllo iniziale:', err));
    }, 10000);
  } catch (error) {
    console.error("⚠️ Errore durante l'inizializzazione dello scheduler integrità:", error);
  }

  // Inizializza lo scheduler snapshot IMM giornaliero
  console.log("📸 Inizializzazione scheduler snapshot IMM...");
  try {
    const { startImmSnapshotScheduler } = await import('./services/imm-snapshot-scheduler.service');
    startImmSnapshotScheduler({ hour: 3, minute: 30 });
    console.log("✅ Scheduler IMM attivo (snapshot ore 03:30)");
  } catch (error) {
    console.error("⚠️ Errore durante l'inizializzazione dello scheduler IMM:", error);
  }

  // Inizializza lo scheduler di backup automatico giornaliero
  console.log("💾 Inizializzazione scheduler backup automatico...");
  try {
    const { startBackupScheduler } = await import('./services/daily-backup-scheduler.service');
    startBackupScheduler({ hour: 2, minute: 0, retentionDays: 7 });
    console.log("✅ Scheduler backup attivo (esecuzione ore 02:00, retention 7 giorni)");
  } catch (error) {
    console.error("⚠️ Errore durante l'inizializzazione dello scheduler backup:", error);
  }

  // Inizializza lo scheduler dati marini (ogni 6 ore)
  console.log("🌊 Inizializzazione scheduler dati marini...");
  try {
    const { startMarineDataScheduler } = await import('./services/marine-data-scheduler.service');
    startMarineDataScheduler();
    console.log("✅ Scheduler dati marini attivo (aggiornamento ogni 6 ore)");
  } catch (error) {
    console.error("⚠️ Errore durante l'inizializzazione dello scheduler dati marini:", error);
  }

  // Inizializza lo scheduler diario ambientale (ogni 12 ore: 06:00 e 18:00)
  console.log("🌿 Inizializzazione scheduler diario ambientale...");
  try {
    const { startEnvironmentalLogScheduler } = await import('./services/environmental-log-scheduler.service');
    startEnvironmentalLogScheduler();
    console.log("✅ Scheduler diario ambientale attivo (acquisizione ore 06:00 e 18:00)");
  } catch (error) {
    console.error("⚠️ Errore durante l'inizializzazione dello scheduler diario ambientale:", error);
  }

  // Inizializza lo scheduler sonda Seneye DF SIFONI (ogni 30 minuti)
  console.log("🌊 Inizializzazione scheduler sonda Seneye...");
  try {
    const { startSeneyeScheduler } = await import('./services/seneye-scheduler.service');
    startSeneyeScheduler();
    console.log("✅ Scheduler Seneye attivo (lettura ogni 30 minuti)");
  } catch (error) {
    console.error("⚠️ Errore durante l'inizializzazione dello scheduler Seneye:", error);
  }

}

// ============================================================
// FASE 2 — Costruzione dell'app completa (import dinamici = caricati
// DOPO che il server è già in ascolto), poi handoff verso Express.
// ============================================================
async function buildApp() {
  const express = (await import("express")).default;
  const { registerRoutes } = await import("./routes");
  const { setupVite, serveStatic, log } = await import("./vite");
  const { createSaleNotification, createAdvancedSaleNotification } = await import("./sales-notification-handler");
  const { registerScreeningNotificationHandler } = await import("./screening-notification-handler");
  const { createSecureApiLogger, secureLogger } = await import("./utils/secure-logging");

  const app = express();

  // CRITICAL FIX: Method override middleware to bypass Replit proxy PATCH/PUT blocking
  app.use((req, res, next) => {
    // Only apply to /api routes for security
    if (req.path.startsWith('/api/')) {
      const override = req.headers['x-http-method-override'] || req.query._method;
      if (override && ['PUT', 'PATCH', 'DELETE'].includes((override as string).toUpperCase())) {
        const originalMethod = req.method;
        req.method = (override as string).toUpperCase();
        console.log(`[METHOD-OVERRIDE] ${originalMethod} ${req.path} → ${req.method} (via header/query)`);
      }
    }
    next();
  });

  // OPTIONS preflight responder for CORS support
  app.options('/api/*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-HTTP-Method-Override');
    res.header('Access-Control-Max-Age', '600');
    res.status(204).send();
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: false, limit: '50mb' }));

  // Rendi disponibile globalmente per l'uso nei controller
  globalThis.app = app;

  secureLogger.info('Cache middleware: DISABLED - forcing fresh asset download');

  // Secure API logging middleware - environment-gated with PII protection
  app.use(createSecureApiLogger());
  secureLogger.info('Logging middleware: Secure API logger initialized with PII protection');

  // Health check endpoint - responds immediately for Replit's health probe
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Servizio di sincronizzazione esterno temporaneamente disabilitato
  console.log("🔄 Servizio sincronizzazione esterno temporaneamente disabilitato per debug");

  // Registra tutte le route sull'app, riutilizzando il server già in ascolto
  await registerRoutes(app, server);

  // Registra i servizi di creazione notifiche per operazioni di vendita
  app.locals.createSaleNotification = createSaleNotification;
  app.locals.createAdvancedSaleNotification = createAdvancedSaleNotification;

  // Registra l'handler per le notifiche di vagliatura
  registerScreeningNotificationHandler(app);

  // Inizializza il modulo LCI (Life Cycle Inventory) per ECOTAPES.
  // DEVE essere registrato QUI: dopo registerRoutes e PRIMA del catch-all 404
  // su '/api' (più sotto). In Express la precedenza segue l'ordine di
  // registrazione; se registrato dopo, /api/lci/* verrebbe intercettato dal 404.
  console.log("🌿 Inizializzazione modulo LCI...");
  try {
    const { registerLciModule } = await import('./modules/lci');
    await registerLciModule(app);
    console.log("✅ Modulo LCI inizializzato");
  } catch (error) {
    console.error("⚠️ Errore durante l'inizializzazione del modulo LCI:", error);
  }

  // Inizializza lo scheduler per l'invio automatico delle email
  setTimeout(() => {
    import('./controllers/email-controller').then(EmailController => {
      try {
        EmailController.initializeEmailScheduler();
        console.log('📧 Scheduler email inizializzato con successo');
      } catch (err) {
        console.error('⚠️ Errore durante inizializzazione scheduler email:', err);
      }
    });
  }, 2000);

  // Importa il controller per le notifiche di crescita
  setTimeout(() => {
    import('./controllers/growth-notification-handler').then(GrowthNotificationHandler => {
      try {
        console.log('🌱 Inizializzazione notifiche di crescita...');

        const setupDailyCheck = () => {
          const now = new Date();
          const nextMidnight = new Date(now);
          nextMidnight.setDate(now.getDate() + 1);
          nextMidnight.setHours(0, 0, 0, 0);

          const msUntilMidnight = nextMidnight.getTime() - now.getTime();

          setTimeout(() => {
            GrowthNotificationHandler.checkCyclesForTP3000()
              .then(count => console.log(`Controllo notifiche crescita: create ${count} notifiche`))
              .catch(err => console.error('Errore controllo notifiche crescita:', err));

            setInterval(() => {
              GrowthNotificationHandler.checkCyclesForTP3000()
                .then(count => console.log(`Controllo giornaliero notifiche: create ${count} notifiche`))
                .catch(err => console.error('Errore controllo giornaliero:', err));
            }, 24 * 60 * 60 * 1000);
          }, msUntilMidnight);

          console.log(`Timer notifiche crescita: prossima esecuzione ${nextMidnight.toLocaleString()}`);
        };

        setupDailyCheck();
      } catch (err) {
        console.error('⚠️ Errore inizializzazione notifiche crescita:', err);
      }
    });
  }, 3000);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    // CRITICAL FIX: Isolate Vite on dedicated Router to prevent API interception
    const ui = express.Router();
    await setupVite(ui, server);

    // Mount Vite router with filters: exclude /api requests and non-GET/HEAD methods
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      return ui(req, res, next);
    });

    // Ensure API fallthrough never reaches Vite - return proper JSON 404 for unknown API routes
    app.use('/api', (_req, res) => res.status(404).json({ message: 'API endpoint not found' }));
  } else {
    app.set("env", "production");
    serveStatic(app);
  }

  // HANDOFF: da ora in poi tutte le richieste sono servite da Express.
  realHandler = app;
  log(`${app.get("env")} server pronto sulla porta ${PORT}`);
  console.log("🚀 App pronta - richieste servite da Express. Avvio inizializzazioni in background...");

  runBackgroundInitialization(app).catch(err => {
    console.error("⚠️ Errore durante inizializzazioni in background:", err);
  });
}
