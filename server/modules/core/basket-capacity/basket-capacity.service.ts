import { db } from "../../../db";
import { sizes, operations, basketSizeCapacity } from "@shared/schema";
import { sql, eq } from "drizzle-orm";
import { basketsService } from "../../operations/baskets/baskets.service";
import { loadGrowthSimulationContext, stepOneDay } from "../../../services/growth-simulation.service";

export interface CapacityForecastEntry {
  /** Giorni stimati prima che il PESO totale raggiunga il limite della taglia. */
  daysToWeightCapacity: number;
  /** Peso attuale (grammi) e limite, utili per il dettaglio in UI. */
  currentWeightGrams: number;
  maxWeightGrams: number;
}

export interface CapacityForecastResult {
  horizonDays: number;
  /** basketId → previsione (solo ceste che supereranno il limite entro l'orizzonte). */
  forecast: Record<number, CapacityForecastEntry>;
}

export interface CapacityRow {
  sizeId: number;
  code: string;
  name: string;
  color: string | null;
  minAnimalsPerKg: number | null;
  maxAnimalsPerKg: number | null;
  // Valori salvati (configurati dall'utente)
  maxAnimals: number | null;
  maxWeightGrams: number | null;
  // Suggerimenti calcolati dai massimi storici realmente raggiunti
  suggestedMaxAnimals: number | null;
  suggestedMaxWeightGrams: number | null;
}

export interface SaveCapacityInput {
  sizeId: number;
  maxAnimals: number | null;
  maxWeightGrams: number | null;
}

export class BasketCapacityService {
  /**
   * Restituisce, per ogni taglia, la capacità massima configurata (numero animali +
   * peso in grammi) insieme ai suggerimenti calcolati dai massimi storici realmente
   * raggiunti nelle operazioni. Ordinata per minAnimalsPerKg crescente (animali più
   * grandi prima), nulls in coda.
   */
  async getCapacitiesWithSuggestions(): Promise<CapacityRow[]> {
    // 1. Tutte le taglie
    const allSizes = await db.select().from(sizes);

    // 2. Capacità già configurate
    const saved = await db.select().from(basketSizeCapacity);
    const savedBySize = new Map<number, { maxAnimals: number | null; maxWeightGrams: number | null }>();
    for (const row of saved) {
      savedBySize.set(row.sizeId, {
        maxAnimals: row.maxAnimals,
        maxWeightGrams: row.maxWeightGrams,
      });
    }

    // 3. Massimi storici per taglia (dalle operazioni)
    const history = await db
      .select({
        sizeId: operations.sizeId,
        maxAnimals: sql<number | null>`MAX(${operations.animalCount})`,
        maxWeight: sql<number | null>`MAX(${operations.totalWeight})`,
      })
      .from(operations)
      .where(sql`${operations.animalCount} IS NOT NULL AND ${operations.animalCount} > 0`)
      .groupBy(operations.sizeId);

    const historyBySize = new Map<number, { maxAnimals: number | null; maxWeight: number | null }>();
    for (const h of history) {
      historyBySize.set(h.sizeId, {
        maxAnimals: h.maxAnimals != null ? Math.round(Number(h.maxAnimals)) : null,
        maxWeight: h.maxWeight != null ? Math.round(Number(h.maxWeight)) : null,
      });
    }

    const rows: CapacityRow[] = allSizes.map((s) => {
      const sv = savedBySize.get(s.id);
      const hist = historyBySize.get(s.id);
      return {
        sizeId: s.id,
        code: s.code,
        name: s.name,
        color: s.color,
        minAnimalsPerKg: s.minAnimalsPerKg,
        maxAnimalsPerKg: s.maxAnimalsPerKg,
        maxAnimals: sv?.maxAnimals ?? null,
        maxWeightGrams: sv?.maxWeightGrams ?? null,
        suggestedMaxAnimals: hist?.maxAnimals ?? null,
        suggestedMaxWeightGrams: hist?.maxWeight ?? null,
      };
    });

    // Ordina per minAnimalsPerKg crescente (animali più grandi prima), nulls in coda
    rows.sort((a, b) => {
      const am = a.minAnimalsPerKg;
      const bm = b.minAnimalsPerKg;
      if (am == null && bm == null) return a.code.localeCompare(b.code);
      if (am == null) return 1;
      if (bm == null) return -1;
      return am - bm;
    });

    return rows;
  }

  /**
   * FASE 1 — Previsione raggiungimento PESO massimo per cesta.
   *
   * Per ogni cesta attiva confronta il peso totale attuale con il limite di peso
   * configurato per la sua taglia e, tramite la simulazione di crescita giornaliera
   * basata sull'SGR storico (peso × (1 + SGR), mortalità inclusa), stima fra quanti
   * giorni la cesta raggiungerà quel limite. Restituisce solo le ceste che lo
   * raggiungeranno ENTRO l'orizzonte indicato (default 5 giorni).
   *
   * NB: il limite "numero animali" NON è oggetto di previsione: gli animali non si
   * moltiplicano, quindi quel limite è un controllo del presente (gestito altrove).
   * Qui si proietta solo il PESO, che cresce nel tempo.
   */
  async getCapacityForecast(horizonDays = 5): Promise<CapacityForecastResult> {
    const horizon = Number.isFinite(horizonDays) && horizonDays > 0 ? Math.floor(horizonDays) : 5;

    // Limiti di peso configurati per taglia
    const savedCaps = await db.select().from(basketSizeCapacity);
    const maxWeightBySize = new Map<number, number>();
    for (const c of savedCaps) {
      if (c.maxWeightGrams != null && c.maxWeightGrams > 0) {
        maxWeightBySize.set(c.sizeId, c.maxWeightGrams);
      }
    }

    const forecast: Record<number, CapacityForecastEntry> = {};
    if (maxWeightBySize.size === 0) {
      return { horizonDays: horizon, forecast };
    }

    // Stato attuale di ogni cesta (stessa fonte usata dalla Heatmap)
    const latestOps = await basketsService.getLatestOperations();
    const ctx = await loadGrowthSimulationContext();
    const today = new Date();

    for (const op of Object.values(latestOps) as any[]) {
      const sizeId = op?.sizeId;
      const currentWeightGrams = op?.totalWeight;
      const count = op?.animalCount;
      if (sizeId == null || currentWeightGrams == null || count == null) continue;
      if (!(currentWeightGrams > 0) || !(count > 0)) continue;

      const maxWeightGrams = maxWeightBySize.get(Number(sizeId));
      if (maxWeightGrams == null) continue;
      // Già a/oltre il limite: gestito dall'allarme "Capacità superata", non qui
      if (currentWeightGrams >= maxWeightGrams) continue;

      // Stato iniziale per la simulazione: peso per animale in mg
      let weightMg = (currentWeightGrams * 1000) / count;
      let cnt = count;
      const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      let daysToReach: number | null = null;

      for (let day = 1; day <= horizon; day++) {
        cursor.setDate(cursor.getDate() + 1);
        const next = stepOneDay(ctx, { weightMg, count: cnt }, cursor);
        weightMg = next.weightMg;
        cnt = next.count;
        const totalGrams = (weightMg * cnt) / 1000;
        if (totalGrams >= maxWeightGrams) {
          daysToReach = day;
          break;
        }
      }

      if (daysToReach != null) {
        forecast[op.basketId] = {
          daysToWeightCapacity: daysToReach,
          currentWeightGrams: Math.round(currentWeightGrams),
          maxWeightGrams,
        };
      }
    }

    return { horizonDays: horizon, forecast };
  }

  /**
   * Salva (upsert) le capacità per le taglie indicate. Una riga per taglia (size_id unico).
   * I valori possono essere null (limite non impostato).
   */
  async saveCapacities(inputs: SaveCapacityInput[]): Promise<{ saved: number }> {
    let count = 0;
    for (const input of inputs) {
      const maxAnimals = input.maxAnimals != null && Number.isFinite(input.maxAnimals)
        ? Math.round(input.maxAnimals)
        : null;
      const maxWeightGrams = input.maxWeightGrams != null && Number.isFinite(input.maxWeightGrams)
        ? Math.round(input.maxWeightGrams)
        : null;

      await db
        .insert(basketSizeCapacity)
        .values({ sizeId: input.sizeId, maxAnimals, maxWeightGrams })
        .onConflictDoUpdate({
          target: basketSizeCapacity.sizeId,
          set: { maxAnimals, maxWeightGrams },
        });
      count++;
    }
    return { saved: count };
  }
}

export const basketCapacityService = new BasketCapacityService();
