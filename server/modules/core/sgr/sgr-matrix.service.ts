import { storage } from "../../../storage";
import { sgrService } from "./sgr.service";
import { Operation, Size } from "../../../../shared/schema";

/**
 * SGR MATRIX SERVICE
 * Calcola l'SGR REALE da tutte le operazioni di tutti i cicli (aperti + chiusi),
 * segmento per segmento, e lo organizza in una matrice Taglia × Mese.
 *
 * Due metriche affiancate:
 *   - SGR-P: basato sul peso medio individuale (averageWeight, mg/animale)
 *   - SGR-M: basato sugli animali/kg (animalsPerKg)
 *
 * Ogni segmento (coppia di operazioni consecutive dello stesso ciclo) viene
 * attribuito al MESE in cui inizia la crescita e alla TAGLIA all'inizio del segmento.
 */

const MONTH_NAMES_IT = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Tipi di operazioni rilevanti per la crescita
const RELEVANT_TYPES = new Set([
  "prima-attivazione",
  "prima-attivazione-da-vagliatura",
  "peso",
  "misura",
  "chiusura-ciclo",
  "chiusura-ciclo-vagliatura",
]);

// Vincoli di plausibilità per un segmento
const MIN_DAYS = 5;
const MAX_SGR = 10; // % giornaliera massima plausibile

interface MatrixFilters {
  state?: "all" | "active" | "closed";
  year?: number | null;
  flupsyId?: number | null;
}

interface CellAccumulator {
  pValues: number[];
  mValues: number[];
  details: Array<{
    cycleId: number;
    basketPhysicalNumber: number | null;
    state: string;
    fromDate: string;
    toDate: string;
    days: number;
    sgrP: number | null;
    sgrM: number | null;
  }>;
}

export class SgrMatrixService {
  /**
   * Trova la taglia per un dato valore animalsPerKg.
   */
  private findSize(sizes: Size[], animalsPerKg: number): Size | null {
    return (
      sizes.find((size) => {
        const min = size.minAnimalsPerKg ?? 0;
        const max = size.maxAnimalsPerKg ?? Infinity;
        return animalsPerKg >= min && animalsPerKg <= max;
      }) || null
    );
  }

  /**
   * Ricava animalsPerKg da un'operazione: usa il valore diretto se presente,
   * altrimenti lo deriva da averageWeight (mg/animale): apk = 1.000.000 / avgWeight.
   */
  private getAnimalsPerKg(op: Operation): number | null {
    if (op.animalsPerKg && op.animalsPerKg > 0) return op.animalsPerKg;
    if (op.averageWeight && op.averageWeight > 0) {
      return 1_000_000 / op.averageWeight;
    }
    return null;
  }

  async computeMatrix(filters: MatrixFilters = {}): Promise<any> {
    const state = filters.state || "all";
    const yearFilter = filters.year ?? null;
    const flupsyId = filters.flupsyId ?? null;

    const [allOperations, allCycles, sizes, baskets, sgrPerTaglia] =
      await Promise.all([
        storage.getOperations(),
        storage.getCycles(),
        storage.getAllSizes(),
        storage.getBaskets(),
        sgrService.getSgrPerTaglia(),
      ]);

    // Taglie ordinate per min_animals_per_kg ASC (animali più grandi = posizione 1)
    const orderedSizes = [...sizes].sort(
      (a, b) => (a.minAnimalsPerKg ?? 0) - (b.minAnimalsPerKg ?? 0)
    );

    // Mappa cicli per stato + lookup veloce
    const cycleMap = new Map(allCycles.map((c) => [c.id, c]));
    const basketMap = new Map(baskets.map((b) => [b.id, b]));

    // Valori stimati (seed biologico) indicizzati per taglia+meseIndex
    const estimatedMap = new Map<string, number>();
    for (const row of sgrPerTaglia as any[]) {
      const monthIdx = this.monthNameToIndex(row.month);
      if (monthIdx === -1) continue;
      const key = `${row.sizeId}_${monthIdx}`;
      // Mantieni il valore (l'ultimo vince, va bene)
      estimatedMap.set(key, Number(row.calculatedSgr));
    }

    // Raggruppa operazioni per ciclo
    const opsByCycle = new Map<number, Operation[]>();
    for (const op of allOperations) {
      if (op.cancelledAt) continue; // escludi operazioni annullate
      if (!op.cycleId) continue;
      if (!RELEVANT_TYPES.has(op.type)) continue;
      if (!opsByCycle.has(op.cycleId)) opsByCycle.set(op.cycleId, []);
      opsByCycle.get(op.cycleId)!.push(op);
    }

    // Accumulatore matrice: chiave `${sizeId}_${monthIndex}`
    const cells = new Map<string, CellAccumulator>();
    const availableYears = new Set<number>();

    let totalSegments = 0;

    for (const [cycleId, ops] of opsByCycle.entries()) {
      const cycle = cycleMap.get(cycleId);
      if (!cycle) continue;

      // Filtro stato ciclo
      if (state === "active" && cycle.state !== "active") continue;
      if (state === "closed" && cycle.state !== "closed") continue;

      // Filtro FLUPSY (tramite la cesta del ciclo)
      if (flupsyId != null) {
        const basket = basketMap.get(cycle.basketId);
        if (!basket || basket.flupsyId !== flupsyId) continue;
      }

      // Ordina per data, poi id
      ops.sort((a, b) => {
        const d = new Date(a.date).getTime() - new Date(b.date).getTime();
        return d !== 0 ? d : a.id - b.id;
      });

      const basket = basketMap.get(cycle.basketId);

      for (let i = 0; i < ops.length - 1; i++) {
        const op1 = ops[i];
        const op2 = ops[i + 1];

        const date1 = new Date(op1.date);
        const date2 = new Date(op2.date);
        const days = Math.floor(
          (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (days < MIN_DAYS) continue;

        const year = date1.getFullYear();
        availableYears.add(year);
        if (yearFilter != null && year !== yearFilter) continue;

        const monthIndex = date1.getMonth(); // 0-11 (mese di inizio crescita)

        // Determina taglia all'inizio del segmento
        const apk1 = this.getAnimalsPerKg(op1);
        if (apk1 == null) continue;
        const size = this.findSize(orderedSizes, apk1);
        if (!size) continue;

        // ── SGR-P (peso medio individuale, averageWeight in mg) ──
        let sgrP: number | null = null;
        if (
          op1.averageWeight &&
          op2.averageWeight &&
          op1.averageWeight > 0 &&
          op2.averageWeight > 0 &&
          op2.averageWeight > op1.averageWeight
        ) {
          const v =
            ((Math.log(op2.averageWeight) - Math.log(op1.averageWeight)) /
              days) *
            100;
          if (v > 0 && v < MAX_SGR) sgrP = v;
        }

        // ── SGR-M (animali/kg) ──
        // L'individuo cresce → animali/kg DIMINUISCE, quindi apk1 > apk2.
        let sgrM: number | null = null;
        const apk2 = this.getAnimalsPerKg(op2);
        if (apk1 && apk2 && apk1 > 0 && apk2 > 0 && apk1 > apk2) {
          const v = ((Math.log(apk1) - Math.log(apk2)) / days) * 100;
          if (v > 0 && v < MAX_SGR) sgrM = v;
        }

        if (sgrP == null && sgrM == null) continue;

        const key = `${size.id}_${monthIndex}`;
        if (!cells.has(key)) {
          cells.set(key, { pValues: [], mValues: [], details: [] });
        }
        const cell = cells.get(key)!;
        if (sgrP != null) cell.pValues.push(sgrP);
        if (sgrM != null) cell.mValues.push(sgrM);
        cell.details.push({
          cycleId,
          basketPhysicalNumber: basket?.physicalNumber ?? null,
          state: cycle.state,
          fromDate: String(op1.date).substring(0, 10),
          toDate: String(op2.date).substring(0, 10),
          days,
          sgrP: sgrP != null ? Math.round(sgrP * 1000) / 1000 : null,
          sgrM: sgrM != null ? Math.round(sgrM * 1000) / 1000 : null,
        });
        totalSegments++;
      }
    }

    // Costruisci output matrice
    const avg = (arr: number[]) =>
      arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;

    const matrix: Record<string, Record<number, any>> = {};
    const details: Record<string, any[]> = {};

    let bestCell: { sizeName: string; month: string; value: number } | null =
      null;
    let worstCell: { sizeName: string; month: string; value: number } | null =
      null;

    for (const size of orderedSizes) {
      const rowKey = String(size.id);
      for (let m = 0; m < 12; m++) {
        const key = `${size.id}_${m}`;
        const cell = cells.get(key);
        const estimated = estimatedMap.get(key) ?? null;

        const sgrP = cell ? avg(cell.pValues) : null;
        const sgrM = cell ? avg(cell.mValues) : null;

        if (sgrP == null && sgrM == null && estimated == null) continue;

        if (!matrix[rowKey]) matrix[rowKey] = {};
        // Media reale combinata (per heatmap e best/worst): media tra P e M disponibili
        const realParts = [sgrP, sgrM].filter((v) => v != null) as number[];
        const real = realParts.length ? avg(realParts) : null;

        matrix[rowKey][m] = {
          sgrP: sgrP != null ? Math.round(sgrP * 100) / 100 : null,
          countP: cell ? cell.pValues.length : 0,
          sgrM: sgrM != null ? Math.round(sgrM * 100) / 100 : null,
          countM: cell ? cell.mValues.length : 0,
          real: real != null ? Math.round(real * 100) / 100 : null,
          estimated: estimated != null ? Math.round(estimated * 100) / 100 : null,
          deviation:
            real != null && estimated != null
              ? Math.round((real - estimated) * 100) / 100
              : null,
        };

        if (cell && cell.details.length) {
          details[key] = cell.details.sort(
            (a, b) => new Date(b.fromDate).getTime() - new Date(a.fromDate).getTime()
          );
        }

        if (real != null) {
          if (!bestCell || real > bestCell.value) {
            bestCell = { sizeName: size.code, month: MONTH_NAMES_IT[m], value: Math.round(real * 100) / 100 };
          }
          if (!worstCell || real < worstCell.value) {
            worstCell = { sizeName: size.code, month: MONTH_NAMES_IT[m], value: Math.round(real * 100) / 100 };
          }
        }
      }
    }

    // Solo le taglie che hanno almeno una cella popolata
    const sizesWithData = orderedSizes
      .filter((s) => matrix[String(s.id)])
      .map((s, idx) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        minAnimalsPerKg: s.minAnimalsPerKg,
        maxAnimalsPerKg: s.maxAnimalsPerKg,
        position: idx + 1,
      }));

    return {
      monthsIt: MONTH_NAMES_IT,
      monthsEn: MONTH_NAMES_EN,
      sizes: sizesWithData,
      matrix,
      details,
      summary: {
        totalSegments,
        sizesCount: sizesWithData.length,
        bestCell,
        worstCell,
      },
      availableYears: Array.from(availableYears).sort((a, b) => b - a),
      filters: { state, year: yearFilter, flupsyId },
    };
  }

  private monthNameToIndex(name: string): number {
    if (!name) return -1;
    const lower = String(name).toLowerCase();
    let idx = MONTH_NAMES_EN.findIndex((m) => m.toLowerCase() === lower);
    if (idx !== -1) return idx;
    idx = MONTH_NAMES_IT.findIndex((m) => m.toLowerCase() === lower);
    return idx;
  }
}

export const sgrMatrixService = new SgrMatrixService();
