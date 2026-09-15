/**
 * Utility per la gestione uniforme dei colori e stili delle taglie in tutta l'applicazione
 */

/**
 * Estrae il valore numerico da un codice taglia (es. 'TP-500' → 500)
 * @param sizeCode - Codice della taglia (es. 'TP-500')
 * @returns Valore numerico della taglia
 */
export function getSizeNumberFromCode(sizeCode: string): number {
  if (!sizeCode || !/^TP-\d+$/.test(sizeCode)) return 0;
  const value = Number(sizeCode.slice(3));
  return Number.isFinite(value) ? value : 0;
}

/**
 * Calcola la distanza tra due taglie per l'ordinamento
 * @param sizeCode1 - Codice della prima taglia (es. 'TP-500')
 * @param sizeCode2 - Codice della seconda taglia (es. 'TP-800')
 * @returns Distanza numerica tra le due taglie
 */
export function getSizeDistance(sizeCode1: string, sizeCode2: string): number {
  const size1 = getSizeNumberFromCode(sizeCode1);
  const size2 = getSizeNumberFromCode(sizeCode2);
  return Math.abs(size1 - size2);
}

/**
 * Restituisce il colore appropriato per una taglia specifica in formato esadecimale
 * @param sizeCode - Codice della taglia (es. 'TP-500')
 * @returns Codice colore esadecimale
 */
export function getSizeColor(sizeCode: string, activeSizes: Array<{ code: string }> = []): string {
  const index = activeSizes.findIndex(size => size.code === sizeCode);
  if (index < 0) return '#64748b';
  return ['#22c55e', '#84cc16', '#10b981', '#f59e0b', '#ef4444', '#dc2626', '#991b1b'][index % 7];
}

/**
 * Restituisce lo stile CSS per il badge di una taglia
 * @param sizeCode - Codice della taglia
 * @returns Oggetto con le proprietà di stile CSS
 */
export function getSizeBadgeStyle(sizeCode: string, activeSizes: Array<{ code: string }> = []): React.CSSProperties {
  const color = getSizeColor(sizeCode, activeSizes);
  
  return {
    backgroundColor: `${color}15`,
    color: color,
    borderColor: `${color}50`,
    borderWidth: '1px'
  };
}

/**
 * Restituisce le classi tailwind per lo stile del badge di una taglia
 * @param sizeCode - Codice della taglia
 * @returns Stringa con le classi Tailwind
 */
export function getSizeBadgeClass(sizeCode: string, activeSizes: Array<{ code: string }> = []): string {
  const index = activeSizes.findIndex(size => size.code === sizeCode);
  if (index < 0) return 'bg-gray-100 text-gray-800 border-gray-300';
  return [
    'bg-green-100 text-green-800 border-green-300',
    'bg-lime-100 text-lime-800 border-lime-300',
    'bg-emerald-100 text-emerald-800 border-emerald-300',
    'bg-amber-100 text-amber-800 border-amber-300',
    'bg-red-100 text-red-800 border-red-300',
    'bg-red-100 text-red-900 border-red-400',
  ][index % 6];
}

/**
 * Determina il codice taglia in base agli animali per kg
 * @param animalsPerKg - Numero di animali per chilogrammo
 * @param sizes - Array delle taglie disponibili
 * @returns Codice della taglia corrispondente o 'N/A' se non trovata
 */
export interface ActiveSizeRange {
  code: string;
  minAnimalsPerKg?: number | null;
  maxAnimalsPerKg?: number | null;
}

/**
 * Restituisce esclusivamente la taglia il cui intervallo contiene il valore.
 * Non ordina le taglie e non applica nearest/fallback: l'array ricevuto deve
 * essere quello attivo restituito da /api/sizes.
 */
export function getSizeCodeFromAnimalsPerKg(
  animalsPerKg: number,
  sizes: ActiveSizeRange[] = [],
): string {
  if (!Number.isFinite(animalsPerKg) || animalsPerKg <= 0 || sizes.length === 0) return 'N/A';
  
  // Trova la taglia che contiene il valore animalsPerKg nel suo range
  const matchingSize = sizes.find(size => {
    const min = Number(size.minAnimalsPerKg);
    const max = Number(size.maxAnimalsPerKg);
    return Number.isFinite(min) && Number.isFinite(max) && min <= max &&
      animalsPerKg >= min && animalsPerKg <= max;
  });
  
  return matchingSize ? matchingSize.code : 'N/A';
}