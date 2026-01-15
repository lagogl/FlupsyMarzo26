import OpenAI from 'openai';
import { ProductionForecastService } from './production-forecast-service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface ScenarioContext {
  currentInventory: Array<{
    sizeName: string;
    totalAnimals: number;
    sizeCategory: string;
  }>;
  monthlyData: Array<{
    month: number;
    monthName: string;
    sizeCategory: string;
    ordersAnimals: number;
    productionForecast: number;
    varianceOrdersProduction: number;
    status: string;
    seminaT1Richiesta: number;
    meseSeminaT1: string | null;
    giacenzaInizioMese?: number;
    stockResiduo?: number;
  }>;
  ordersAbsoluteBySize: Record<string, number>;
  mortalityBySize: Record<string, number>;
  mortalityAdjustment: number;
  baselineInventory?: number;
  adjustedInventory?: number;
  mortalityImpact?: number;
}

interface ScenarioAnalysisResult {
  answer: string;
  recommendations: string[];
  dataPoints: Array<{
    label: string;
    value: string;
    trend: 'positive' | 'negative' | 'neutral';
  }>;
  confidence: number;
}

export class ScenarioAnalysisService {
  
  private forecastService: ProductionForecastService;
  
  constructor() {
    this.forecastService = new ProductionForecastService();
  }
  
  async analyzeScenario(
    question: string,
    context: ScenarioContext,
    year: number = new Date().getFullYear()
  ): Promise<ScenarioAnalysisResult> {
    
    const cumulativeAnalysis = this.calculateCumulativeStock(context);
    const mortalityAnalysis = this.calculateMortalityImpact(context);
    
    const systemPrompt = `Sei un esperto analista di produzione per un'azienda di acquacoltura (ostricoltura).
Analizza i dati di produzione e rispondi alle domande dell'utente in modo chiaro e conciso.

CONTESTO AZIENDALE:
- L'azienda produce ostriche in diverse taglie: TP-2000, TP-3000, TP-3500 (categoria T3) e TP-4000, TP-5000 (categoria T10)
- Le taglie si riferiscono al numero di animali per kg (es: TP-3000 = 3000 animali/kg)
- La mortalità è espressa in percentuale dal seme alla taglia finale di vendita
- SGR (Specific Growth Rate) indica la velocità di crescita giornaliera
- Le semine T1 sono i semi iniziali da piantare per raggiungere le taglie di vendita

IMPORTANTE - CALCOLI CORRETTI:
- Per verificare la copertura di un mese futuro, DEVI considerare tutti gli ordini dei mesi precedenti che riducono la giacenza disponibile
- La giacenza disponibile per un mese = giacenza iniziale - ordini cumulati da oggi fino a quel mese (escluso)
- L'impatto della mortalità si calcola sulla produzione totale, non solo sulla giacenza attuale

REGOLE DI RISPOSTA:
1. Rispondi SEMPRE in italiano
2. Sii conciso ma completo (max 3-4 frasi per la risposta principale)
3. Fornisci 2-3 raccomandazioni pratiche quando appropriato
4. Usa numeri formattati (es: 1.5M invece di 1500000)
5. Indica chiaramente se i dati sono insufficienti per una risposta precisa
6. Considera sempre la mortalità attesa E gli ordini cumulati nei calcoli

Rispondi in formato JSON con questa struttura:
{
  "answer": "risposta principale",
  "recommendations": ["raccomandazione 1", "raccomandazione 2"],
  "dataPoints": [{"label": "etichetta", "value": "valore", "trend": "positive|negative|neutral"}],
  "confidence": 0.8
}`;

    const contextSummary = this.buildContextSummary(context, year, cumulativeAnalysis, mortalityAnalysis);
    
    const userPrompt = `DATI DI PRODUZIONE ATTUALI:
${contextSummary}

DOMANDA DELL'UTENTE:
${question}

Rispondi alla domanda basandoti sui dati forniti. Usa i CALCOLI CUMULATIVI per verificare la copertura ordini.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Risposta AI vuota');
      }

      const parsed = JSON.parse(content);
      
      return {
        answer: parsed.answer || parsed.risposta || 'Impossibile analizzare la domanda',
        recommendations: parsed.recommendations || parsed.raccomandazioni || [],
        dataPoints: (parsed.dataPoints || parsed.datiChiave || []).map((dp: any) => ({
          label: dp.label || dp.etichetta || '',
          value: dp.value || dp.valore || '',
          trend: dp.trend || 'neutral'
        })),
        confidence: parsed.confidence || parsed.confidenza || 0.8
      };
      
    } catch (error) {
      console.error('Errore analisi scenario AI:', error);
      
      return this.generateFallbackAnalysis(question, context, cumulativeAnalysis, mortalityAnalysis);
    }
  }
  
  private calculateCumulativeStock(context: ScenarioContext): Map<number, { availableStock: number; cumulativeOrders: number; monthOrders: number }> {
    const result = new Map<number, { availableStock: number; cumulativeOrders: number; monthOrders: number }>();
    const currentMonth = new Date().getMonth() + 1;
    
    const totalInventory = context.currentInventory.reduce((s, i) => s + i.totalAnimals, 0);
    
    const monthlyOrders = new Map<number, number>();
    for (const m of context.monthlyData) {
      const current = monthlyOrders.get(m.month) || 0;
      monthlyOrders.set(m.month, current + m.ordersAnimals);
    }
    
    let cumulativeOrders = 0;
    
    for (let month = currentMonth; month <= 12; month++) {
      const monthOrders = monthlyOrders.get(month) || 0;
      
      cumulativeOrders += monthOrders;
      
      const availableStock = totalInventory - (cumulativeOrders - monthOrders);
      
      result.set(month, {
        availableStock,
        cumulativeOrders,
        monthOrders
      });
    }
    
    return result;
  }
  
  private calculateMortalityImpact(context: ScenarioContext): { baselineTotal: number; adjustedTotal: number; delta: number; adjustmentPercent: number } {
    if (context.baselineInventory !== undefined && context.adjustedInventory !== undefined) {
      return {
        baselineTotal: context.baselineInventory,
        adjustedTotal: context.adjustedInventory,
        delta: context.adjustedInventory - context.baselineInventory,
        adjustmentPercent: context.mortalityAdjustment
      };
    }
    
    if (context.mortalityImpact !== undefined) {
      const totalInventory = context.currentInventory.reduce((s, i) => s + i.totalAnimals, 0);
      return {
        baselineTotal: totalInventory,
        adjustedTotal: totalInventory + context.mortalityImpact,
        delta: context.mortalityImpact,
        adjustmentPercent: context.mortalityAdjustment
      };
    }
    
    const totalInventory = context.currentInventory.reduce((s, i) => s + i.totalAnimals, 0);
    const avgMortality = Object.values(context.mortalityBySize).length > 0
      ? Object.values(context.mortalityBySize).reduce((s, v) => s + v, 0) / Object.values(context.mortalityBySize).length
      : 25;
    
    const adjustmentPercent = context.mortalityAdjustment || 0;
    const baseMortality = avgMortality / 100;
    const adjustedMortality = baseMortality * (1 + adjustmentPercent / 100);
    
    const baselineTotal = totalInventory;
    const mortalityDifference = adjustedMortality - baseMortality;
    const delta = -totalInventory * mortalityDifference;
    
    return {
      baselineTotal,
      adjustedTotal: baselineTotal + delta,
      delta,
      adjustmentPercent
    };
  }
  
  private buildContextSummary(
    context: ScenarioContext, 
    year: number,
    cumulativeAnalysis: Map<number, { availableStock: number; cumulativeOrders: number; monthOrders: number }>,
    mortalityAnalysis: { baselineTotal: number; adjustedTotal: number; delta: number; adjustmentPercent: number }
  ): string {
    const lines: string[] = [];
    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                       'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    
    lines.push(`Anno di riferimento: ${year}`);
    lines.push(`Mese corrente: ${new Date().toLocaleString('it-IT', { month: 'long' })}`);
    lines.push('');
    
    lines.push('GIACENZA ATTUALE PER TAGLIA:');
    const totalInventory = context.currentInventory.reduce((s, i) => s + i.totalAnimals, 0);
    for (const inv of context.currentInventory) {
      lines.push(`- ${inv.sizeName}: ${this.formatNumber(inv.totalAnimals)} animali (${inv.sizeCategory})`);
    }
    lines.push(`TOTALE GIACENZA: ${this.formatNumber(totalInventory)} animali`);
    lines.push('');
    
    lines.push('⚠️ ANALISI CUMULATIVA ORDINI (considera ordini precedenti):');
    for (const [month, data] of cumulativeAnalysis.entries()) {
      const canCover = data.availableStock >= data.monthOrders;
      const margin = data.availableStock - data.monthOrders;
      lines.push(`- ${monthNames[month - 1]}: Ordini mese ${this.formatNumber(data.monthOrders)}, Ordini cumulati ${this.formatNumber(data.cumulativeOrders)}, Stock disponibile ${this.formatNumber(data.availableStock)}, Margine ${this.formatNumber(margin)} ${canCover ? '✅' : '❌'}`);
    }
    lines.push('');
    
    if (mortalityAnalysis.adjustmentPercent !== 0) {
      lines.push('⚠️ IMPATTO VARIAZIONE MORTALITÀ:');
      lines.push(`- Variazione simulata: ${mortalityAnalysis.adjustmentPercent > 0 ? '+' : ''}${mortalityAnalysis.adjustmentPercent}%`);
      lines.push(`- Giacenza base: ${this.formatNumber(mortalityAnalysis.baselineTotal)} animali`);
      lines.push(`- Giacenza con variazione: ${this.formatNumber(mortalityAnalysis.adjustedTotal)} animali`);
      lines.push(`- DELTA: ${mortalityAnalysis.delta >= 0 ? '+' : ''}${this.formatNumber(mortalityAnalysis.delta)} animali`);
      lines.push('');
    }
    
    lines.push('ORDINI PER TAGLIA SPECIFICA:');
    for (const [size, animals] of Object.entries(context.ordersAbsoluteBySize)) {
      if (animals > 0) {
        lines.push(`- ${size}: ${this.formatNumber(animals)} animali`);
      }
    }
    lines.push('');
    
    lines.push('MORTALITÀ ATTESA PER TAGLIA:');
    for (const [size, mortality] of Object.entries(context.mortalityBySize)) {
      lines.push(`- ${size}: ${mortality}%`);
    }
    lines.push('');
    
    lines.push('SEMINE T1 RICHIESTE:');
    const seedings = context.monthlyData.filter(m => m.seminaT1Richiesta > 0 && m.meseSeminaT1);
    for (const s of seedings) {
      lines.push(`- Seminare ${this.formatNumber(s.seminaT1Richiesta)} in ${s.meseSeminaT1} per ${s.monthName} (${s.sizeCategory})`);
    }
    
    return lines.join('\n');
  }
  
  private generateFallbackAnalysis(
    question: string, 
    context: ScenarioContext,
    cumulativeAnalysis: Map<number, { availableStock: number; cumulativeOrders: number; monthOrders: number }>,
    mortalityAnalysis: { baselineTotal: number; adjustedTotal: number; delta: number; adjustmentPercent: number }
  ): ScenarioAnalysisResult {
    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                       'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    
    const totalInventory = context.currentInventory.reduce((s, i) => s + i.totalAnimals, 0);
    const totalOrders = Object.values(context.ordersAbsoluteBySize).reduce((s, v) => s + v, 0);
    
    const questionLower = question.toLowerCase();
    
    let answer = '';
    let recommendations: string[] = [];
    let dataPoints: ScenarioAnalysisResult['dataPoints'] = [];
    
    const targetMonth = this.extractTargetMonth(questionLower);
    
    if (questionLower.includes('copri') || questionLower.includes('ordini') || targetMonth) {
      const month = targetMonth || 6;
      const monthData = cumulativeAnalysis.get(month);
      
      if (monthData) {
        const canCover = monthData.availableStock >= monthData.monthOrders;
        const margin = monthData.availableStock - monthData.monthOrders;
        const previousOrders = monthData.cumulativeOrders - monthData.monthOrders;
        
        if (canCover) {
          answer = `Sì, dopo aver consegnato gli ordini dei mesi precedenti (${this.formatNumber(previousOrders)} animali), avrai ${this.formatNumber(monthData.availableStock)} animali disponibili per ${monthNames[month - 1]}, sufficienti per gli ordini di ${this.formatNumber(monthData.monthOrders)}. Margine: ${this.formatNumber(margin)} animali.`;
        } else {
          answer = `No, dopo gli ordini dei mesi precedenti (${this.formatNumber(previousOrders)} animali), rimarranno solo ${this.formatNumber(monthData.availableStock)} animali per ${monthNames[month - 1]}, insufficienti per gli ordini di ${this.formatNumber(monthData.monthOrders)}. Mancano ${this.formatNumber(Math.abs(margin))} animali.`;
        }
        
        recommendations = canCover 
          ? ['Mantieni il ritmo di crescita attuale', 'Monitora la mortalità per non ridurre il margine', 'Considera anticipi su ordini successivi']
          : ['Aumenta urgentemente le semine', 'Valuta di negoziare consegne parziali', 'Riduci la mortalità con controlli intensivi'];
        
        dataPoints = [
          { label: 'Ordini precedenti', value: this.formatNumber(previousOrders), trend: 'neutral' },
          { label: 'Stock disponibile', value: this.formatNumber(monthData.availableStock), trend: canCover ? 'positive' : 'negative' },
          { label: `Ordini ${monthNames[month - 1]}`, value: this.formatNumber(monthData.monthOrders), trend: canCover ? 'neutral' : 'negative' },
          { label: 'Margine', value: this.formatNumber(margin), trend: margin >= 0 ? 'positive' : 'negative' }
        ];
      }
      
    } else if (questionLower.includes('mortalità') || questionLower.includes('scenario') || mortalityAnalysis.adjustmentPercent !== 0) {
      const delta = mortalityAnalysis.delta;
      const isPositive = delta > 0;
      
      answer = isPositive
        ? `Con una riduzione della mortalità del ${Math.abs(mortalityAnalysis.adjustmentPercent)}%, avresti ${this.formatNumber(Math.abs(delta))} animali IN PIÙ, portando la giacenza a ${this.formatNumber(mortalityAnalysis.adjustedTotal)}.`
        : `Con un aumento della mortalità del ${Math.abs(mortalityAnalysis.adjustmentPercent)}%, perderesti ${this.formatNumber(Math.abs(delta))} animali, riducendo la giacenza a ${this.formatNumber(mortalityAnalysis.adjustedTotal)}.`;
      
      recommendations = isPositive
        ? ['Investi in controlli qualità per ridurre la mortalità', 'Ottimizza i parametri ambientali', 'Considera questa proiezione per aumentare le vendite']
        : ['Prepara semine aggiuntive di emergenza', 'Intensifica i controlli sanitari', 'Valuta di ridimensionare gli ordini a rischio'];
      
      dataPoints = [
        { label: 'Giacenza base', value: this.formatNumber(mortalityAnalysis.baselineTotal), trend: 'neutral' },
        { label: 'Giacenza scenario', value: this.formatNumber(mortalityAnalysis.adjustedTotal), trend: isPositive ? 'positive' : 'negative' },
        { label: 'Impatto', value: `${delta >= 0 ? '+' : ''}${this.formatNumber(delta)}`, trend: isPositive ? 'positive' : 'negative' }
      ];
      
    } else if (questionLower.includes('semina') || questionLower.includes('picco')) {
      const seedings = context.monthlyData.filter(m => m.seminaT1Richiesta > 0 && m.meseSeminaT1);
      const totalSeeding = seedings.reduce((s, d) => s + d.seminaT1Richiesta, 0);
      
      answer = totalSeeding > 0
        ? `Per coprire la produzione futura, dovresti seminare circa ${this.formatNumber(totalSeeding)} animali T1. Le semine più urgenti sono: ${seedings.slice(0, 2).map(s => `${s.meseSeminaT1} per ${s.monthName}`).join(', ')}.`
        : `Non ci sono requisiti di semina urgenti basandoti sui dati attuali. Verifica comunque le proiezioni per i prossimi mesi.`;
      
      recommendations = [
        'Pianifica le semine con 8-12 settimane di anticipo',
        'Considera le variazioni stagionali di SGR',
        'Aggiungi un margine del 10-15% per la mortalità'
      ];
      
      dataPoints = [
        { label: 'Semina T1 richiesta', value: this.formatNumber(totalSeeding), trend: 'neutral' },
        { label: 'N° semine pianificate', value: seedings.length.toString(), trend: seedings.length > 0 ? 'neutral' : 'negative' }
      ];
      
    } else if (questionLower.includes('critico') || questionLower.includes('mese')) {
      let mostCriticalMonth = 0;
      let worstMargin = Infinity;
      
      for (const [month, data] of cumulativeAnalysis.entries()) {
        const margin = data.availableStock - data.monthOrders;
        if (margin < worstMargin) {
          worstMargin = margin;
          mostCriticalMonth = month;
        }
      }
      
      if (mostCriticalMonth > 0) {
        const monthData = cumulativeAnalysis.get(mostCriticalMonth)!;
        answer = worstMargin < 0
          ? `Il mese più critico è ${monthNames[mostCriticalMonth - 1]} con un deficit di ${this.formatNumber(Math.abs(worstMargin))} animali. Gli ordini cumulati (${this.formatNumber(monthData.cumulativeOrders)}) superano la giacenza disponibile.`
          : `${monthNames[mostCriticalMonth - 1]} è il mese con margine più ridotto (${this.formatNumber(worstMargin)} animali). La situazione è gestibile ma richiede monitoraggio.`;
      }
      
      recommendations = worstMargin < 0
        ? ['Concentra le semine per quel mese', 'Negozia posticipo ordini', 'Valuta acquisti esterni']
        : ['Mantieni il monitoraggio regolare', 'Prepara piani di contingenza', 'Aggiorna le proiezioni mensilmente'];
      
      dataPoints = [
        { label: 'Mese critico', value: monthNames[mostCriticalMonth - 1] || 'N/A', trend: worstMargin < 0 ? 'negative' : 'neutral' },
        { label: 'Margine peggiore', value: this.formatNumber(worstMargin), trend: worstMargin >= 0 ? 'positive' : 'negative' }
      ];
      
    } else {
      const coverage = totalOrders > 0 ? (totalInventory / totalOrders * 100) : 0;
      
      answer = `La giacenza totale è di ${this.formatNumber(totalInventory)} animali con ordini totali di ${this.formatNumber(totalOrders)} (copertura ${coverage.toFixed(0)}%). Per analisi specifiche, chiedi di mesi, ordini o scenari di mortalità.`;
      
      recommendations = [
        'Monitora giacenze e ordini regolarmente',
        'Pianifica semine con 8-12 settimane di anticipo',
        'Aggiorna le previsioni di mortalità mensilmente'
      ];
      
      dataPoints = [
        { label: 'Giacenza totale', value: this.formatNumber(totalInventory), trend: 'neutral' },
        { label: 'Ordini totali', value: this.formatNumber(totalOrders), trend: 'neutral' },
        { label: 'Copertura', value: `${coverage.toFixed(0)}%`, trend: coverage >= 100 ? 'positive' : 'negative' }
      ];
    }
    
    return {
      answer,
      recommendations,
      dataPoints,
      confidence: 0.75
    };
  }
  
  private extractTargetMonth(question: string): number | null {
    const monthMap: Record<string, number> = {
      'gennaio': 1, 'febbraio': 2, 'marzo': 3, 'aprile': 4,
      'maggio': 5, 'giugno': 6, 'luglio': 7, 'agosto': 8,
      'settembre': 9, 'ottobre': 10, 'novembre': 11, 'dicembre': 12
    };
    
    for (const [name, num] of Object.entries(monthMap)) {
      if (question.includes(name)) {
        return num;
      }
    }
    return null;
  }
  
  private formatNumber(num: number): string {
    if (Math.abs(num) >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (Math.abs(num) >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return Math.round(num).toString();
  }
}

export const scenarioAnalysisService = new ScenarioAnalysisService();
