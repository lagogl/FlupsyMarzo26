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
  }>;
  ordersAbsoluteBySize: Record<string, number>;
  mortalityBySize: Record<string, number>;
  mortalityAdjustment: number;
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
    
    const systemPrompt = `Sei un esperto analista di produzione per un'azienda di acquacoltura (ostricoltura).
Analizza i dati di produzione e rispondi alle domande dell'utente in modo chiaro e conciso.

CONTESTO AZIENDALE:
- L'azienda produce ostriche in diverse taglie: TP-2000, TP-3000, TP-3500 (categoria T3) e TP-4000, TP-5000 (categoria T10)
- Le taglie si riferiscono al numero di animali per kg (es: TP-3000 = 3000 animali/kg)
- La mortalità è espressa in percentuale dal seme alla taglia finale di vendita
- SGR (Specific Growth Rate) indica la velocità di crescita giornaliera
- Le semine T1 sono i semi iniziali da piantare per raggiungere le taglie di vendita

REGOLE DI RISPOSTA:
1. Rispondi SEMPRE in italiano
2. Sii conciso ma completo (max 3-4 frasi per la risposta principale)
3. Fornisci 2-3 raccomandazioni pratiche quando appropriato
4. Usa numeri formattati (es: 1.5M invece di 1500000)
5. Indica chiaramente se i dati sono insufficienti per una risposta precisa
6. Considera sempre la mortalità attesa nei calcoli`;

    const contextSummary = this.buildContextSummary(context, year);
    
    const userPrompt = `DATI DI PRODUZIONE ATTUALI:
${contextSummary}

DOMANDA DELL'UTENTE:
${question}

Rispondi alla domanda basandoti sui dati forniti. Includi:
1. Una risposta diretta alla domanda (2-4 frasi)
2. 2-3 raccomandazioni pratiche
3. 2-3 dati chiave rilevanti con trend (positivo/negativo/neutro)`;

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
      
      return this.generateFallbackAnalysis(question, context);
    }
  }
  
  private buildContextSummary(context: ScenarioContext, year: number): string {
    const lines: string[] = [];
    
    lines.push(`Anno di riferimento: ${year}`);
    lines.push(`Mese corrente: ${new Date().toLocaleString('it-IT', { month: 'long' })}`);
    lines.push('');
    
    lines.push('GIACENZA ATTUALE PER TAGLIA:');
    for (const inv of context.currentInventory) {
      lines.push(`- ${inv.sizeName}: ${this.formatNumber(inv.totalAnimals)} animali (${inv.sizeCategory})`);
    }
    lines.push('');
    
    lines.push('ORDINI PER TAGLIA SPECIFICA:');
    for (const [size, animals] of Object.entries(context.ordersAbsoluteBySize)) {
      if (animals > 0) {
        lines.push(`- ${size}: ${this.formatNumber(animals)} animali`);
      }
    }
    lines.push('');
    
    lines.push('MORTALITA ATTESA PER TAGLIA:');
    for (const [size, mortality] of Object.entries(context.mortalityBySize)) {
      lines.push(`- ${size}: ${mortality}%`);
    }
    if (context.mortalityAdjustment !== 0) {
      lines.push(`- Variazione simulata: ${context.mortalityAdjustment > 0 ? '+' : ''}${context.mortalityAdjustment}%`);
    }
    lines.push('');
    
    lines.push('PROIEZIONI MENSILI:');
    const months = context.monthlyData.reduce((acc, m) => {
      const key = m.monthName;
      if (!acc[key]) acc[key] = [];
      acc[key].push(m);
      return acc;
    }, {} as Record<string, typeof context.monthlyData>);
    
    for (const [month, data] of Object.entries(months)) {
      const totalOrders = data.reduce((s, d) => s + d.ordersAnimals, 0);
      const totalProduction = data.reduce((s, d) => s + d.productionForecast, 0);
      const worstStatus = data.some(d => d.status === 'critical') ? 'CRITICO' :
                         data.some(d => d.status === 'warning') ? 'ATTENZIONE' : 'OK';
      if (totalOrders > 0 || totalProduction > 0) {
        lines.push(`- ${month}: Ordini ${this.formatNumber(totalOrders)}, Produzione ${this.formatNumber(totalProduction)}, Status: ${worstStatus}`);
      }
    }
    lines.push('');
    
    lines.push('SEMINE T1 RICHIESTE:');
    const seedings = context.monthlyData.filter(m => m.seminaT1Richiesta > 0 && m.meseSeminaT1);
    for (const s of seedings) {
      lines.push(`- Seminare ${this.formatNumber(s.seminaT1Richiesta)} in ${s.meseSeminaT1} per ${s.monthName} (${s.sizeCategory})`);
    }
    
    return lines.join('\n');
  }
  
  private generateFallbackAnalysis(question: string, context: ScenarioContext): ScenarioAnalysisResult {
    const currentMonth = new Date().getMonth();
    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                       'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    
    const totalInventory = context.currentInventory.reduce((s, i) => s + i.totalAnimals, 0);
    const totalOrders = Object.values(context.ordersAbsoluteBySize).reduce((s, v) => s + v, 0);
    const coverage = totalOrders > 0 ? (totalInventory / totalOrders * 100) : 0;
    
    const questionLower = question.toLowerCase();
    
    let answer = '';
    let recommendations: string[] = [];
    let dataPoints: ScenarioAnalysisResult['dataPoints'] = [];
    
    if (questionLower.includes('giugno') || questionLower.includes('copri') || questionLower.includes('ordini')) {
      const juneData = context.monthlyData.filter(m => m.month === 6);
      const juneOrders = juneData.reduce((s, d) => s + d.ordersAnimals, 0);
      const canCover = totalInventory >= juneOrders;
      
      answer = canCover 
        ? `Sì, la giacenza attuale di ${this.formatNumber(totalInventory)} animali è sufficiente per coprire gli ordini di Giugno (${this.formatNumber(juneOrders)}). Hai un margine di ${this.formatNumber(totalInventory - juneOrders)} animali.`
        : `No, la giacenza attuale di ${this.formatNumber(totalInventory)} animali NON è sufficiente per gli ordini di Giugno (${this.formatNumber(juneOrders)}). Mancano ${this.formatNumber(juneOrders - totalInventory)} animali.`;
      
      recommendations = canCover 
        ? ['Mantieni il ritmo di crescita attuale', 'Considera di anticipare alcune vendite', 'Monitora la mortalità settimanalmente']
        : ['Aumenta le semine immediate', 'Valuta di posticipare alcune consegne', 'Riduci la mortalità con controlli più frequenti'];
      
      dataPoints = [
        { label: 'Giacenza totale', value: this.formatNumber(totalInventory), trend: 'neutral' },
        { label: 'Ordini Giugno', value: this.formatNumber(juneOrders), trend: canCover ? 'positive' : 'negative' },
        { label: 'Copertura', value: `${coverage.toFixed(0)}%`, trend: coverage >= 100 ? 'positive' : 'negative' }
      ];
      
    } else if (questionLower.includes('semina') || questionLower.includes('maggio') || questionLower.includes('picco')) {
      const maySeedings = context.monthlyData.filter(m => m.month === 5 && m.seminaT1Richiesta > 0);
      const totalSeeding = maySeedings.reduce((s, d) => s + d.seminaT1Richiesta, 0);
      
      answer = totalSeeding > 0
        ? `Per soddisfare il picco di Maggio, dovresti seminare circa ${this.formatNumber(totalSeeding)} animali T1 oggi o al più presto. Considera un margine di sicurezza del 10-15% per compensare la mortalità.`
        : `Non ci sono requisiti di semina urgenti per Maggio basandoti sui dati attuali. Verifica comunque le proiezioni per i mesi successivi.`;
      
      recommendations = [
        'Pianifica le semine con 8-12 settimane di anticipo',
        'Considera le variazioni stagionali di SGR',
        'Monitora i tassi di mortalità settimanalmente'
      ];
      
      dataPoints = [
        { label: 'Semina T1 richiesta', value: this.formatNumber(totalSeeding), trend: 'neutral' },
        { label: 'Tempo di crescita', value: '8-12 settimane', trend: 'neutral' }
      ];
      
    } else if (questionLower.includes('critico') || questionLower.includes('mese')) {
      const criticalMonths = context.monthlyData.filter(m => m.status === 'critical');
      const criticalMonth = criticalMonths.length > 0 ? criticalMonths[0].monthName : null;
      
      answer = criticalMonth
        ? `Il mese più critico è ${criticalMonth}, con un gap significativo tra ordini e produzione prevista. Richiede attenzione immediata per evitare mancate consegne.`
        : `Non ci sono mesi critici al momento. La produzione sembra allineata con gli ordini. Continua a monitorare per eventuali cambiamenti.`;
      
      recommendations = criticalMonth
        ? ['Aumenta le semine per quel mese', 'Valuta di spostare ordini', 'Intensifica i controlli qualità']
        : ['Mantieni il monitoraggio regolare', 'Pianifica le semine con anticipo', 'Aggiorna le proiezioni mensilmente'];
      
      dataPoints = [
        { label: 'Mesi critici', value: criticalMonths.length.toString(), trend: criticalMonths.length > 0 ? 'negative' : 'positive' },
        { label: 'Copertura media', value: `${coverage.toFixed(0)}%`, trend: coverage >= 80 ? 'positive' : 'negative' }
      ];
      
    } else if (questionLower.includes('ritardo') || questionLower.includes('settimane')) {
      const delayWeeks = 2;
      const delayImpact = totalInventory * 0.05 * delayWeeks;
      
      answer = `Un ritardo di ${delayWeeks} settimane nella semina potrebbe causare una riduzione della produzione di circa ${this.formatNumber(delayImpact)} animali. Questo impatto deriva dalla mancata crescita e potenziale aumento della mortalità nei mesi più caldi.`;
      
      recommendations = [
        'Evita ritardi nelle semine critiche',
        'Mantieni un buffer di sicurezza del 10%',
        'Considera semine scaglionate per ridurre i rischi'
      ];
      
      dataPoints = [
        { label: 'Impatto stimato', value: this.formatNumber(delayImpact), trend: 'negative' },
        { label: 'Ritardo simulato', value: `${delayWeeks} settimane`, trend: 'negative' }
      ];
      
    } else {
      answer = `La tua giacenza totale è di ${this.formatNumber(totalInventory)} animali con una copertura ordini del ${coverage.toFixed(0)}%. Per analisi più specifiche, prova a formulare la domanda includendo riferimenti a mesi, taglie o azioni specifiche.`;
      
      recommendations = [
        'Monitora giacenze e ordini regolarmente',
        'Pianifica semine con 8-12 settimane di anticipo',
        'Aggiorna le previsioni di mortalità mensilmente'
      ];
      
      dataPoints = [
        { label: 'Giacenza totale', value: this.formatNumber(totalInventory), trend: 'neutral' },
        { label: 'Ordini totali', value: this.formatNumber(totalOrders), trend: 'neutral' },
        { label: 'Copertura', value: `${coverage.toFixed(0)}%`, trend: coverage >= 80 ? 'positive' : 'negative' }
      ];
    }
    
    return {
      answer,
      recommendations,
      dataPoints,
      confidence: 0.7
    };
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
