---
name: Lot mortality canonical recompute (Fase 2)
description: How lot mortality is computed — single source of truth, not incremental; misura is indicator-only.
---

# Mortalità per lotto — ricalcolo canonico

**Regola:** la mortalità di un lotto (`lots.totalMortality`) si calcola SOLO dalle vagliature/screening completati, contata UNA SOLA VOLTA, mai per somma incrementale. La funzione canonica `recomputeLotMortality(lotIds?)` in `server/services/lot-mortality.ts` è full-state e idempotente: sostituisce sempre il valore, non somma mai. Formula per segmento: `max(0, Σ vivi origine − Σ vivi destinazione)` attribuito ai lotti di origine in proporzione alla loro quota, poi clamp `[0, ricevuti]`.

**Why:** prima la mortalità veniva (a) sovrascritta da `SUM(deadCount)` grezzo in `lot-auto-stats-service.ts` e (b) accumulata in modo incrementale (`+=`) ad ogni vagliatura/screening, producendo numeri assurdi (es. 60M morti su lotto da 1M ricevuti) e doppi conteggi. La misura giornaliera registra gusci nel campione ("gusci che volano via") che NON sono morti reali → non deve incidere sulla mortalità del lotto.

**How to apply:**
- La **misura/peso** è solo indicatore: `updateLotStatistics` NON scrive `totalMortality`, `updateLotLedger` non crea entry `mortality` per misura/peso.
- Vagliatura (`selection-controller-fixed.ts`) e screening (`screening.service.ts`) dopo il commit chiamano `recomputeLotMortality(lotIdsCoinvolti)` — niente blocchi `+=`.
- Backfill / ricalcolo manuale: `POST /api/admin/recalc-lot-mortality` (GET = anteprima dry-run via `lot-mortality-preview.ts`).
- I lotti misti / con ricircolo tra vagliature danno mortalità clampata e vengono marcati "⚠ Affidabilità bassa" in `mortalityNotes`. Questo è ATTESO: i numeri per-lotto precisi + affidabilità sono rimandati alle fasi 3-4. Non trattarlo come bug.
- Il recompute gira fuori transazione e logga (non blocca) gli errori: se la mortalità sembra disallineata dopo completamenti concorrenti, ri-eseguire il backfill admin.
