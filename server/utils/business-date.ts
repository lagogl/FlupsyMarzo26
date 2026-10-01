/** Convert an instant to the company's civil date, independently of server TZ. */
const businessDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Rome",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function businessToday(instant: Date = new Date()) {
  const parts = businessDateFormatter.formatToParts(instant);
  const get = (key: string) => Number(parts.find(part => part.type === key)!.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/**
 * Calendar carrier for the existing projection engines, which use local
 * getters/constructors for civil dates. This is NOT the instant of midnight
 * in Rome. Only convert clock instants here; never reinterpret historical
 * dates already supplied to simulation functions.
 */
export function getBusinessReferenceDate(instant: Date = new Date()): Date {
  const { year, month, day } = businessToday(instant);
  return new Date(year, month - 1, day);
}