export interface ActiveSizeRange {
  code: string;
  minAnimalsPerKg?: number | string | null;
  maxAnimalsPerKg?: number | string | null;
  min_animals_per_kg?: number | string | null;
  max_animals_per_kg?: number | string | null;
}


export function getActiveSellableMax(
  sizes: ActiveSizeRange[],
): number | null {
  const sellableBoundary = sizes.find((size) => size.code === "TP-3000");
  const sellableMax = Number(
    sellableBoundary?.maxAnimalsPerKg ?? sellableBoundary?.max_animals_per_kg,
  );

  return Number.isFinite(sellableMax) ? sellableMax : null;
}

export function isActiveSellableSize(
  animalsPerKg: number | null | undefined,
  sizes: ActiveSizeRange[],
): boolean {
  if (animalsPerKg == null || !sizes?.length) return false;

  const matched = sizes.find((size) => {
    const min = Number(size.minAnimalsPerKg ?? size.min_animals_per_kg);
    const max = Number(size.maxAnimalsPerKg ?? size.max_animals_per_kg);
    return Number.isFinite(min) && Number.isFinite(max) && min <= max
      && animalsPerKg >= min && animalsPerKg <= max;
  });
  if (!matched) return false;

  const sellableMax = getActiveSellableMax(sizes);

  return sellableMax != null && animalsPerKg <= sellableMax;
}