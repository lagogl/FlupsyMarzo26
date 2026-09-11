/**
 * Utility functions for automatic size determination based on animals per kg.
 */

import { and, asc, gte, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "../db";
import { sizeRangeVersions, sizes } from "../../shared/schema";

export type SizeDeterminationOptions = {
  /**
   * Data ISO YYYY-MM-DD per cui applicare i range.
   * Se omessa, usa la data operativa corrente nel fuso Europe/Rome.
   */
  atDate?: string | Date;
};

export type SizeRangeCandidate = {
  sizeId: number;
  code: string;
  minAnimalsPerKg: number;
  maxAnimalsPerKg: number;
};

const BUSINESS_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Rome",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function toBusinessIsoDate(value: string | Date): string {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error("Data range taglia non valida");
    }
    return BUSINESS_DATE_FORMATTER.format(value);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Data range taglia non valida: ${value}`);
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`Data range taglia non valida: ${value}`);
  }

  return value;
}

/**
 * Pure range matcher shared by runtime code and focused tests.
 * Returns null outside the configured scale and chooses the nearest boundary
 * only when a value falls inside a gap.
 */
export function findSizeInRanges(
  animalsPerKg: number,
  candidates: SizeRangeCandidate[],
): SizeRangeCandidate | null {
  if (!Number.isFinite(animalsPerKg) || animalsPerKg <= 0 || candidates.length === 0) {
    return null;
  }

  const ordered = [...candidates].sort(
    (a, b) => a.minAnimalsPerKg - b.minAnimalsPerKg,
  );

  const exact = ordered.find(
    (candidate) =>
      animalsPerKg >= candidate.minAnimalsPerKg &&
      animalsPerKg <= candidate.maxAnimalsPerKg,
  );
  if (exact) return exact;

  const scaleMin = Math.min(...ordered.map((candidate) => candidate.minAnimalsPerKg));
  const scaleMax = Math.max(...ordered.map((candidate) => candidate.maxAnimalsPerKg));
  if (animalsPerKg < scaleMin || animalsPerKg > scaleMax) return null;

  return ordered.reduce((closest, candidate) => {
    const closestDistance = Math.min(
      Math.abs(animalsPerKg - closest.minAnimalsPerKg),
      Math.abs(animalsPerKg - closest.maxAnimalsPerKg),
    );
    const candidateDistance = Math.min(
      Math.abs(animalsPerKg - candidate.minAnimalsPerKg),
      Math.abs(animalsPerKg - candidate.maxAnimalsPerKg),
    );
    return candidateDistance < closestDistance ? candidate : closest;
  });
}

export async function getSizeRangeCandidates(
  atDate?: string | Date,
): Promise<SizeRangeCandidate[]> {
  const effectiveDate = toBusinessIsoDate(atDate ?? new Date());
  const dateExpression = sql`${effectiveDate}::date`;

  return db
    .select({
      sizeId: sizes.id,
      code: sizes.code,
      minAnimalsPerKg: sizeRangeVersions.minAnimalsPerKg,
      maxAnimalsPerKg: sizeRangeVersions.maxAnimalsPerKg,
    })
    .from(sizeRangeVersions)
    .innerJoin(sizes, sql`${sizes.id} = ${sizeRangeVersions.sizeId}`)
    .where(
      and(
        lte(sizeRangeVersions.validFrom, dateExpression),
        or(
          isNull(sizeRangeVersions.validTo),
          gte(sizeRangeVersions.validTo, dateExpression),
        ),
      ),
    )
    .orderBy(asc(sizeRangeVersions.minAnimalsPerKg));
}

/**
 * Determines the appropriate size ID using the range version valid on atDate.
 * Existing callers can omit options and retain current-date behaviour.
 */
export async function determineSizeByAnimalsPerKg(
  animalsPerKg: number,
  options: SizeDeterminationOptions = {},
): Promise<number | null> {
  if (!Number.isFinite(animalsPerKg) || animalsPerKg <= 0) return null;

  try {
    const candidates = await getSizeRangeCandidates(options.atDate);
    if (candidates.length === 0) {
      console.error(
        `Nessun range taglia valido per la data ${options.atDate ?? "corrente"}`,
      );
      return null;
    }

    const match = findSizeInRanges(animalsPerKg, candidates);
    if (!match) {
      console.warn(
        `${animalsPerKg} animali/kg fuori dalla scala valida alla data ${options.atDate ?? "corrente"}`,
      );
      return null;
    }

    return match.sizeId;
  } catch (error) {
    console.error("Errore determinazione temporale taglia:", error);
    return null;
  }
}