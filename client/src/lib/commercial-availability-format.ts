import type { CommercialInput } from "@shared/commercial-availability";

export const animals = (value: number) => new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 }).format(value);
export const monthLabel = (value: { year: number; month: number }) => new Intl.DateTimeFormat("it-IT", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(value.year, value.month - 1, 1)));
export const dateLabel = (value: string) => value ? new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", dateStyle: "short" }).format(new Date(value.length === 10 ? `${value}T12:00:00Z` : value)) : "Non disponibile";
export const monthKey = (value: { year: number; month: number }) => `${value.year}-${String(value.month).padStart(2, "0")}`;
export const inputMonths = (input: CommercialInput) => Array.from({ length: input.horizon }, (_, i) => {
  const index = input.startYear * 12 + input.startMonth - 1 + i;
  return { year: Math.floor(index / 12), month: index % 12 + 1 };
});
export function dateForMonth(month: { year: number; month: number }, day: number) {
  return `${monthKey(month)}-${String(day).padStart(2, "0")}`;
}
export function setVisibleSize(input: CommercialInput, id: number, visible: boolean): CommercialInput {
  return { ...input, selectedSizeIds: visible ? [...new Set([...input.selectedSizeIds, id])] : input.selectedSizeIds.filter(v => v !== id) };
}
export function responseMatchesDraft(request: number, latestRequest: number, requestRevision: number, currentRevision: number) {
  return request === latestRequest && requestRevision === currentRevision;
}
export function frozenDraftNotice(requestRevision: number, currentRevision: number) {
  return requestRevision === currentRevision ? "" : "La bozza è cambiata durante il congelamento. Questo riepilogo storico riguarda solo gli input inviati; non verifica né aggiorna la bozza corrente.";
}