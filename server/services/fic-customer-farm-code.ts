function normalized(value: unknown): string {
  return typeof value === 'string'
    ? value.trim()
    : value == null
      ? ''
      : String(value).trim();
}

export function resolveFicFarmCode(
  ficInternalCode: unknown,
  existingFarmCode: unknown
): string {
  return normalized(ficInternalCode) || normalized(existingFarmCode);
}

export function shouldFetchFicClientDetail(
  listClient: { address_street?: unknown; address_postal_code?: unknown; code?: unknown },
  existingFarmCode: unknown
): boolean {
  return !normalized(listClient.address_street)
    || !normalized(listClient.address_postal_code)
    || !resolveFicFarmCode(listClient.code, existingFarmCode);
}