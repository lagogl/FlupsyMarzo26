import { productionForecastService, ProductionForecastService } from "../../../ai/production-forecast-service";
import { dbEsterno, isDbEsternoAvailable } from "../../../db-esterno";
import { ordiniCondivisi } from "../../../schema-esterno";
import { and, not, eq } from "drizzle-orm";

const MONTH_NAMES = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const MONTH_SHORT = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

interface OrderDetail {
  ordineId: number;
  clienteNome: string;
  taglia: string;
  saleSize: string | null;
  quantita: number;
  dataInizioConsegna: string | null;
  dataFineConsegna: string | null;
  stato: string;
  quantitaPerMese: number;
  mesiCoperti: number;
}

interface MonthSizeSnapshot {
  giacenzaPre: number;
  giacenzaPost: number;
  ordini: number;
  soddisfatti: number;
  gap: number;
  coperturaPct: number;
}

interface MonthlySnapshot {
  month: number;
  monthName: string;
  monthShort: string;
  perTaglia: Record<string, MonthSizeSnapshot>;
  totaleGiacenzaPre: number;
  totaleGiacenzaPost: number;
  totaleOrdini: number;
  totaleSoddisfatti: number;
  totaleGap: number;
  coperturaPctGlobale: number;
}

interface CoverageResult {
  year: number;
  generatedAt: string;
  mesiSimulati: number;
  giacenzaIniziale: Record<string, number>;
  timeline: MonthlySnapshot[];
  riepilogoPerTaglia: Record<string, {
    giacenzaIniziale: number;
    totaleOrdini: number;
    totaleSoddisfatti: number;
    totaleGap: number;
    coperturaPct: number;
  }>;
  kpi: {
    totaleGiacenzaIniziale: number;
    totaleOrdiniAnno: number;
    totaleSoddisfacibili: number;
    totaleGap: number;
    coperturaPctGlobale: number;
    mesiCritici: number;
    mesiOk: number;
    taglieConGap: string[];
    taglieCoperte: string[];
  };
  ordiniDettaglio: OrderDetail[];
  dbEsternoDisponibile: boolean;
}

export class OrderCoverageService {

  async simulate(year: number, months: number = 12): Promise<CoverageResult> {
    const mortalityRates = { T1: 0.05, T3: 0.03, T10: 0.02 };

    const [sgrLookup, basketInventory, ordersByMonth] = await Promise.all([
      productionForecastService.getSgrLookup(),
      productionForecastService.getBasketLevelInventory(),
      productionForecastService.getOrdersByMonthAndSize(year)
    ]);

    let baskets = basketInventory.map(b => ({ ...b }));

    const giacenzaIniziale = productionForecastService.aggregateBySaleSize(baskets);

    const today = new Date();
    const currentMonth = today.getMonth() + 1;

    const timeline: MonthlySnapshot[] = [];
    const SALE_SIZES = ProductionForecastService.SALE_SIZES;

    const startMonth = currentMonth;
    const endMonth = Math.min(12, startMonth + months - 1);

    for (let month = startMonth; month <= endMonth; month++) {
      if (month === currentMonth) {
        const currentDay = today.getDate();
        const daysInMonth = new Date(year, month, 0).getDate();
        const remainingDays = Math.max(0, daysInMonth - currentDay);
        if (remainingDays > 0) {
          baskets = this.simulateDailyGrowth(baskets, sgrLookup, month - 1, mortalityRates, remainingDays);
        }
      } else {
        const daysInMonth = new Date(year, month, 0).getDate();
        baskets = this.simulateDailyGrowth(baskets, sgrLookup, month - 1, mortalityRates, daysInMonth);
      }

      const stockPre = productionForecastService.aggregateBySaleSize(baskets);

      const monthOrders = ordersByMonth[month.toString()] || {};

      const perTaglia: Record<string, MonthSizeSnapshot> = {};
      let totGiacPre = 0, totGiacPost = 0, totOrd = 0, totSodd = 0, totGap = 0;

      for (const size of SALE_SIZES) {
        const giacenza = stockPre[size] || 0;
        const ordini = monthOrders[size] || 0;

        if (giacenza === 0 && ordini === 0) continue;

        const soddisfatti = Math.min(giacenza, ordini);
        const gap = Math.max(0, ordini - soddisfatti);
        const copertura = ordini > 0 ? Math.round((soddisfatti / ordini) * 100) : (giacenza > 0 ? 100 : 0);

        if (soddisfatti > 0) {
          baskets = productionForecastService.removeAnimalsFromSaleSize(baskets, size, soddisfatti);
        }

        perTaglia[size] = {
          giacenzaPre: Math.round(giacenza),
          giacenzaPost: Math.round(Math.max(0, giacenza - soddisfatti)),
          ordini: Math.round(ordini),
          soddisfatti: Math.round(soddisfatti),
          gap: Math.round(gap),
          coperturaPct: copertura
        };

        totGiacPre += giacenza;
        totOrd += ordini;
        totSodd += soddisfatti;
        totGap += gap;
      }

      const stockPost = productionForecastService.aggregateBySaleSize(baskets);
      totGiacPost = Object.values(stockPost).reduce((a, b) => a + b, 0);

      timeline.push({
        month,
        monthName: MONTH_NAMES[month - 1],
        monthShort: MONTH_SHORT[month - 1],
        perTaglia,
        totaleGiacenzaPre: Math.round(totGiacPre),
        totaleGiacenzaPost: Math.round(totGiacPost),
        totaleOrdini: Math.round(totOrd),
        totaleSoddisfatti: Math.round(totSodd),
        totaleGap: Math.round(totGap),
        coperturaPctGlobale: totOrd > 0 ? Math.round((totSodd / totOrd) * 100) : 100
      });
    }

    const riepilogoPerTaglia: CoverageResult['riepilogoPerTaglia'] = {};
    for (const size of SALE_SIZES) {
      let totOrd = 0, totSodd = 0, totGap = 0;
      for (const snap of timeline) {
        const s = snap.perTaglia[size];
        if (s) {
          totOrd += s.ordini;
          totSodd += s.soddisfatti;
          totGap += s.gap;
        }
      }
      if (totOrd > 0 || (giacenzaIniziale[size] || 0) > 0) {
        riepilogoPerTaglia[size] = {
          giacenzaIniziale: Math.round(giacenzaIniziale[size] || 0),
          totaleOrdini: Math.round(totOrd),
          totaleSoddisfatti: Math.round(totSodd),
          totaleGap: Math.round(totGap),
          coperturaPct: totOrd > 0 ? Math.round((totSodd / totOrd) * 100) : 100
        };
      }
    }

    const taglieConGap = Object.entries(riepilogoPerTaglia)
      .filter(([, v]) => v.totaleGap > 0)
      .map(([k]) => k);
    const taglieCoperte = Object.entries(riepilogoPerTaglia)
      .filter(([, v]) => v.totaleOrdini > 0 && v.coperturaPct >= 100)
      .map(([k]) => k);

    const mesiCritici = timeline.filter(t => t.coperturaPctGlobale < 100 && t.totaleOrdini > 0).length;
    const mesiOk = timeline.filter(t => t.coperturaPctGlobale >= 100 || t.totaleOrdini === 0).length;

    const totOrdiniAnno = timeline.reduce((s, t) => s + t.totaleOrdini, 0);
    const totSoddAnno = timeline.reduce((s, t) => s + t.totaleSoddisfatti, 0);
    const totGapAnno = timeline.reduce((s, t) => s + t.totaleGap, 0);
    const totGiacIniz = Object.values(giacenzaIniziale).reduce((a, b) => a + b, 0);

    const ordiniDettaglio = await this.getOrderDetails(year);

    return {
      year,
      generatedAt: new Date().toISOString(),
      mesiSimulati: timeline.length,
      giacenzaIniziale,
      timeline,
      riepilogoPerTaglia,
      kpi: {
        totaleGiacenzaIniziale: Math.round(totGiacIniz),
        totaleOrdiniAnno: Math.round(totOrdiniAnno),
        totaleSoddisfacibili: Math.round(totSoddAnno),
        totaleGap: Math.round(totGapAnno),
        coperturaPctGlobale: totOrdiniAnno > 0 ? Math.round((totSoddAnno / totOrdiniAnno) * 100) : 100,
        mesiCritici,
        mesiOk,
        taglieConGap,
        taglieCoperte
      },
      ordiniDettaglio,
      dbEsternoDisponibile: isDbEsternoAvailable()
    };
  }

  private async getOrderDetails(year: number): Promise<OrderDetail[]> {
    if (!isDbEsternoAvailable() || !dbEsterno) return [];

    try {
      const ordini = await dbEsterno
        .select({
          id: ordiniCondivisi.id,
          clienteNome: ordiniCondivisi.clienteNome,
          quantita: ordiniCondivisi.quantita,
          quantitaTotale: ordiniCondivisi.quantitaTotale,
          tagliaRichiesta: ordiniCondivisi.tagliaRichiesta,
          dataInizioConsegna: ordiniCondivisi.dataInizioConsegna,
          dataFineConsegna: ordiniCondivisi.dataFineConsegna,
          stato: ordiniCondivisi.stato
        })
        .from(ordiniCondivisi)
        .where(
          and(
            not(eq(ordiniCondivisi.stato, 'Annullato')),
            not(eq(ordiniCondivisi.cancellato, true))
          )
        );

      return ordini
        .filter(o => {
          const df = o.dataFineConsegna ? new Date(o.dataFineConsegna) : null;
          const di = o.dataInizioConsegna ? new Date(o.dataInizioConsegna) : null;
          if (df && df.getFullYear() < year) return false;
          if (di && di.getFullYear() > year) return false;
          return true;
        })
        .map(o => {
          const qty = o.quantitaTotale || o.quantita || 0;
          const di = o.dataInizioConsegna ? new Date(o.dataInizioConsegna) : null;
          const df = o.dataFineConsegna ? new Date(o.dataFineConsegna) : null;
          let mesi = 1;
          if (di && df) {
            mesi = Math.max(1, (df.getFullYear() - di.getFullYear()) * 12 + (df.getMonth() - di.getMonth()) + 1);
          }
          const saleSize = productionForecastService.mapOrderSizeToSaleSize(
            productionForecastService.normalizeTagliaCode(o.tagliaRichiesta) || ''
          );
          return {
            ordineId: o.id,
            clienteNome: o.clienteNome || 'N/D',
            taglia: o.tagliaRichiesta || '',
            saleSize,
            quantita: qty,
            dataInizioConsegna: di?.toISOString().split('T')[0] || null,
            dataFineConsegna: df?.toISOString().split('T')[0] || null,
            stato: o.stato,
            quantitaPerMese: Math.round(qty / mesi),
            mesiCoperti: mesi
          };
        });
    } catch (error) {
      console.error('Errore recupero dettagli ordini per copertura:', error);
      return [];
    }
  }

  private simulateDailyGrowth(
    baskets: Array<{basketId: number, animalsPerKg: number, animalCount: number}>,
    sgrLookup: any,
    monthIndex: number,
    mortalityRates: { T1: number; T3: number; T10: number },
    totalDays: number
  ): Array<{basketId: number, animalsPerKg: number, animalCount: number}> {
    let working = baskets.map(b => ({
      basketId: b.basketId,
      weightMg: 1000000 / b.animalsPerKg,
      animalCount: b.animalCount
    }));

    const dailyMortalityFraction = 1 / 30;
    let sizeChanges = 0;

    for (let day = 0; day < totalDays; day++) {
      working = working.map(b => {
        const animalsPerKg = 1000000 / b.weightMg;
        const category = productionForecastService.getCategoryFromAnimalsPerKg(animalsPerKg);
        const sgr = productionForecastService.getSgrForAnimalsPerKg(sgrLookup, monthIndex, animalsPerKg);
        const newWeight = b.weightMg * (1 + sgr / 100);
        const newAnimalsPerKg = 1000000 / newWeight;
        const oldSaleSize = productionForecastService.mapAnimalsPerKgToSaleSize(animalsPerKg);
        const newSaleSize = productionForecastService.mapAnimalsPerKgToSaleSize(newAnimalsPerKg);
        if (oldSaleSize !== newSaleSize) sizeChanges++;

        const dailyMortality = mortalityRates[category] * dailyMortalityFraction;
        const survivingAnimals = Math.round(b.animalCount * (1 - dailyMortality));

        return {
          basketId: b.basketId,
          weightMg: newWeight,
          animalCount: survivingAnimals
        };
      });
    }

    if (sizeChanges > 0) {
      console.log(`[DailyGrowth] Mese ${monthIndex + 1}, ${totalDays} giorni: ${sizeChanges} cambi taglia rilevati`);
    }

    return working.map(b => ({
      basketId: b.basketId,
      animalsPerKg: Math.round(1000000 / b.weightMg),
      animalCount: b.animalCount
    }));
  }
}

export const orderCoverageService = new OrderCoverageService();
