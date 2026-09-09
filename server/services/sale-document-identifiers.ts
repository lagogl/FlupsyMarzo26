/**
 * Identificativo compatto usato nei documenti di vendita:
 * F<numero FLUPSY>C<numero cesta>
 */
export function formatFlupsyBasketIdentifier(
  flupsyName: unknown,
  basketPhysicalNumber: unknown
): string {
  const basketNumber = Number(basketPhysicalNumber);
  if (!Number.isInteger(basketNumber) || basketNumber <= 0) return '';

  const name = String(flupsyName ?? '').trim();
  const match = name.match(/(?:flupsy|f)\s*[-._#:]*\s*(\d+)/i)
    ?? name.match(/\b(\d+)\b/);
  if (!match) return `C${basketNumber}`;

  return `F${Number(match[1])}C${basketNumber}`;
}