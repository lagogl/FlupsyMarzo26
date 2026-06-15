import { db } from "../../../db";
import { sizes, operations, basketSizeCapacity } from "@shared/schema";
import { sql, eq } from "drizzle-orm";

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
