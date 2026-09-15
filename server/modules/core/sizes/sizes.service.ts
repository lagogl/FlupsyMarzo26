import { storage } from "../../../storage";
import NodeCache from "node-cache";
import { db } from "../../../db";
import { sizeRangeVersions, sizes } from "../../../../shared/schema";
import { asc, eq, inArray, sql } from "drizzle-orm";
import {
  getSizeRangeCandidates,
  toBusinessIsoDate,
} from "../../../utils/size-determination";

// Cache per sizes (TTL: 300 secondi = 5 minuti, raramente cambiano)
const sizesCache = new NodeCache({ stdTTL: 300 });

export class SizesService {
  async getRangeVersions() {
    return db.select().from(sizeRangeVersions).orderBy(
      asc(sizeRangeVersions.validFrom),
      asc(sizeRangeVersions.minAnimalsPerKg),
    );
  }

  /**
   * Get all sizes
   */
  async getAllSizes(atDate?: string | Date) {
    const effectiveDate = toBusinessIsoDate(atDate ?? new Date());
    const cacheKey = `all-sizes-${effectiveDate}`;
    const cached = sizesCache.get(cacheKey);
    if (cached) {
      console.log("📦 SIZES SERVICE: Returning cached sizes");
      return cached;
    }

    // A size is eligible for forms/classification only when it has a range
    // version active on the business date.  Do not use sizes.min/max here:
    // those columns are the mutable identity snapshot, not the temporal
    // source of truth.
    const candidates = await getSizeRangeCandidates(effectiveDate);
    if (candidates.length === 0) {
      sizesCache.set(cacheKey, []);
      return [];
    }

    const ids = [...new Set(candidates.map((candidate) => candidate.sizeId))];
    const storedSizes = await db
      .select()
      .from(sizes)
      .where(inArray(sizes.id, ids));
    const rangeById = new Map(candidates.map((candidate) => [candidate.sizeId, candidate]));
    const activeSizes = storedSizes
      .map((size) => {
        const range = rangeById.get(size.id);
        return range
          ? {
              ...size,
              minAnimalsPerKg: range.minAnimalsPerKg,
              maxAnimalsPerKg: range.maxAnimalsPerKg,
            }
          : null;
      })
      .filter((size): size is NonNullable<typeof size> => size !== null)
      .sort((a, b) => a.minAnimalsPerKg - b.minAnimalsPerKg);

    sizesCache.set(cacheKey, activeSizes);
    return activeSizes;
  }

  /**
   * Get size by ID
   */
  async getSizeById(id: number) {
    const cacheKey = `size-${id}`;
    const cached = sizesCache.get(cacheKey);
    if (cached) {
      console.log(`📦 SIZES SERVICE: Returning cached size ${id}`);
      return cached;
    }

    const size = await storage.getSize(id);
    if (size) {
      sizesCache.set(cacheKey, size);
    }
    return size;
  }

  /**
   * Create new size
   */
  async createSize(sizeData: any) {
    if (sizeData.minAnimalsPerKg == null || sizeData.maxAnimalsPerKg == null) {
      throw new Error("Entrambi i confini animali/kg sono obbligatori");
    }
    const businessDate = toBusinessIsoDate(new Date());
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`LOCK TABLE ${sizes} IN SHARE ROW EXCLUSIVE MODE`);
      if (sizeData.minAnimalsPerKg != null && sizeData.maxAnimalsPerKg != null) {
        const overlap = await tx.execute(sql`
          SELECT code FROM sizes
          WHERE ${sizeData.minAnimalsPerKg} <= max_animals_per_kg
            AND ${sizeData.maxAnimalsPerKg} >= min_animals_per_kg
          LIMIT 1
        `);
        if (overlap.rows.length > 0) {
          throw new Error(`Il range si sovrappone alla taglia ${overlap.rows[0].code}`);
        }
      }
      const [created] = await tx.insert(sizes).values(sizeData).returning();
      if (created.minAnimalsPerKg != null && created.maxAnimalsPerKg != null) {
        await tx.insert(sizeRangeVersions).values({
          sizeId: created.id,
          minAnimalsPerKg: created.minAnimalsPerKg,
          maxAnimalsPerKg: created.maxAnimalsPerKg,
          validFrom: businessDate,
          validTo: null,
        });
      }
      return created;
    });
    this.invalidateCache(); // Invalida DOPO il salvataggio
    return result;
  }

  /**
   * Update size
   */
  async updateSize(id: number, updateData: any) {
    const businessDate = toBusinessIsoDate(new Date());
    const previousDateValue = new Date(`${businessDate}T00:00:00Z`);
    previousDateValue.setUTCDate(previousDateValue.getUTCDate() - 1);
    const previousBusinessDate = previousDateValue.toISOString().slice(0, 10);
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`LOCK TABLE ${sizes} IN SHARE ROW EXCLUSIVE MODE`);
      const [current] = await tx.select().from(sizes).where(eq(sizes.id, id)).limit(1);
      if (!current) return undefined;

      if (updateData.minAnimalsPerKg === null || updateData.maxAnimalsPerKg === null) {
        throw new Error("I confini animali/kg non possono essere rimossi");
      }
      const nextMin = updateData.minAnimalsPerKg ?? current.minAnimalsPerKg;
      const nextMax = updateData.maxAnimalsPerKg ?? current.maxAnimalsPerKg;
      const rangeChanged =
        nextMin !== current.minAnimalsPerKg ||
        nextMax !== current.maxAnimalsPerKg;

      if (rangeChanged && nextMin != null && nextMax != null) {
        const overlap = await tx.execute(sql`
          SELECT code FROM sizes
          WHERE id <> ${id}
            AND ${nextMin} <= max_animals_per_kg
            AND ${nextMax} >= min_animals_per_kg
          LIMIT 1
        `);
        if (overlap.rows.length > 0) {
          throw new Error(`Il range si sovrappone alla taglia ${overlap.rows[0].code}`);
        }
      }

      const [updated] = await tx.update(sizes)
        .set(updateData)
        .where(eq(sizes.id, id))
        .returning();

      if (rangeChanged && nextMin != null && nextMax != null) {
        const [todayVersion] = await tx.select()
          .from(sizeRangeVersions)
          .where(sql`${sizeRangeVersions.sizeId} = ${id} AND ${sizeRangeVersions.validFrom} = ${businessDate}::date`)
          .limit(1);

        if (todayVersion) {
          await tx.update(sizeRangeVersions)
            .set({ minAnimalsPerKg: nextMin, maxAnimalsPerKg: nextMax })
            .where(eq(sizeRangeVersions.id, todayVersion.id));
        } else {
          await tx.update(sizeRangeVersions)
            .set({ validTo: previousBusinessDate })
            .where(sql`${sizeRangeVersions.sizeId} = ${id} AND ${sizeRangeVersions.validTo} IS NULL`);
          await tx.insert(sizeRangeVersions).values({
            sizeId: id,
            minAnimalsPerKg: nextMin,
            maxAnimalsPerKg: nextMax,
            validFrom: businessDate,
            validTo: null,
          });
        }
      }

      return updated;
    });
    this.invalidateCache(); // Invalida DOPO il salvataggio
    return result;
  }

  /**
   * Delete size
   */
  async deleteSize(id: number) {
    const [result] = await db.delete(sizes).where(eq(sizes.id, id)).returning();
    this.invalidateCache(); // Invalida DOPO il salvataggio
    return result;
  }

  /**
   * Invalidate all sizes cache
   */
  private invalidateCache() {
    sizesCache.flushAll();
    console.log("🧹 SIZES SERVICE: Cache invalidated");
    
    // Invalida anche il cache privato in db-storage
    storage.invalidateSizesCache();
  }
}

export const sizesService = new SizesService();
