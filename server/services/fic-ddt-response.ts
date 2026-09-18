export function normalizeFicDdtNumber(rawNumber: unknown): string | null {
  if (typeof rawNumber === "number") {
    return Number.isSafeInteger(rawNumber) && rawNumber > 0
      ? String(rawNumber)
      : null;
  }
  if (typeof rawNumber !== "string") return null;

  const normalized = rawNumber.trim();
  if (!/^[1-9]\d*$/.test(normalized)) return null;
  const numeric = Number(normalized);
  return Number.isSafeInteger(numeric) && String(numeric) === normalized
    ? normalized
    : null;
}

export function getAssignedFicDdtNumber(responseData: unknown): string {
  const normalized = normalizeFicDdtNumber((responseData as any)?.number);
  if (!normalized) {
    const error: any = new Error("Fatture in Cloud non ha restituito un numero DDT valido");
    error.code = "FIC_DDT_NUMBER_MISSING";
    throw error;
  }

  return normalized;
}