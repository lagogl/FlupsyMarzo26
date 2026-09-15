/**
 * activeSizeOrder è ordinato per animals/kg decrescente:
 * dall'animale fisicamente più piccolo a quello più grande.
 */
export function canFulfillOrderWithSize(
  actualSize: string,
  requiredSize: string,
  activeSizeOrder: string[],
): boolean {
  const actualRank = activeSizeOrder.indexOf(actualSize);
  const requiredRank = activeSizeOrder.indexOf(requiredSize);
  if (actualRank < 0 || requiredRank < 0) return false;

  return actualRank >= requiredRank;
}