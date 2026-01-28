/**
 * Servizio per la generazione del PDF guida operatori
 * Documento formativo sulle operazioni del sistema FLUPSY
 */
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

interface GuideSection {
  title: string;
  color: string;
  content: string[];
  example?: string;
  isDeprecated?: boolean;
  isNew?: boolean;
}

export async function generateOperatorGuidePDF(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: 'Guida Operativa FLUPSY - Gennaio 2026',
          Author: 'Delta Futuro',
          Subject: 'Manuale operativo per la gestione delle operazioni FLUPSY'
        }
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const primaryColor = '#1e3a5f';
      const accentColor = '#0ea5e9';
      const successColor = '#10b981';
      const warningColor = '#f59e0b';
      const dangerColor = '#ef4444';
      const newFeatureColor = '#3b82f6';

      doc.rect(0, 0, doc.page.width, 140).fill(primaryColor);
      
      doc.fontSize(28)
         .fillColor('white')
         .font('Helvetica-Bold')
         .text('GUIDA OPERATIVA FLUPSY', 50, 50, { align: 'center' });
      
      doc.fontSize(14)
         .font('Helvetica')
         .text('Manuale per gli Operatori - Gennaio 2026', 50, 90, { align: 'center' });

      doc.fontSize(12)
         .text('Delta Futuro S.r.l.', 50, 115, { align: 'center' });

      doc.moveDown(4);
      doc.y = 160;

      doc.fontSize(16)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('NOVITA\' IMPORTANTI', 50, doc.y);
      
      doc.moveDown(0.5);
      
      doc.rect(50, doc.y, doc.page.width - 100, 80)
         .fillAndStroke('#fef3c7', warningColor);
      
      const boxY = doc.y + 10;
      doc.fontSize(11)
         .fillColor('#92400e')
         .font('Helvetica-Bold')
         .text('ATTENZIONE: Modifiche operative da Gennaio 2026', 60, boxY);
      
      doc.font('Helvetica')
         .fontSize(10)
         .text('1. L\'operazione "PESO" ora registra SOLO il peso (no cambio taglia)', 60, boxY + 18);
      doc.text('2. Nuovo "SGR-Peso" per monitorare il trend di crescita', 60, boxY + 32);
      doc.text('3. "TAGLIA ATTESA" prevede quando fare una MISURA', 60, boxY + 46);
      doc.text('4. Le ceste che richiedono misura lampeggiano in blu', 60, boxY + 60);

      doc.y = boxY + 100;

      doc.fontSize(14)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('OPERAZIONI DISPONIBILI', 50, doc.y);
      
      doc.moveDown(1);

      const operations: GuideSection[] = [
        {
          title: 'PRIMA ATTIVAZIONE',
          color: '#a855f7',
          content: [
            'Registra l\'inizio di un nuovo ciclo in una cesta',
            'Inserisci: numero animali iniziali, peso totale, taglia iniziale',
            'Il sistema calcola automaticamente gli animali per kg'
          ],
          example: 'Esempio: Cesta #15, 500.000 animali, 2.5 kg, Taglia T1'
        },
        {
          title: 'MISURA (Campionamento)',
          color: successColor,
          isNew: true,
          content: [
            'Operazione PRINCIPALE per determinare la TAGLIA',
            'Preleva un campione, pesalo e conta gli animali',
            'Il sistema calcola la taglia (animali/kg) e aggiorna i dati',
            'Usa questa operazione quando vuoi aggiornare taglia e numero animali'
          ],
          example: 'Esempio: Campione di 150g con 4.500 animali = 30.000 an/kg'
        },
        {
          title: 'PESO (Trend Crescita)',
          color: '#8b5cf6',
          content: [
            'Registra SOLO il peso totale della cesta',
            'NON modifica taglia, numero animali o peso medio',
            'Genera un SGR-Peso per monitorare il trend di crescita',
            'Utile per verificare la crescita senza fare un campionamento completo'
          ],
          example: 'Esempio: Peso totale 15kg - il sistema calcola SGR-Peso'
        },
        {
          title: 'PULIZIA',
          color: '#06b6d4',
          content: [
            'Registra la pulizia della cesta',
            'Importante per monitorare la frequenza di manutenzione',
            'Il sistema avvisa quando una cesta non viene pulita da troppo tempo'
          ],
          example: 'Consiglio: Pulire ogni 7-10 giorni'
        },
        {
          title: 'VAGLIATURA (Screening)',
          color: '#6366f1',
          content: [
            'Separa gli animali per taglia usando setacci',
            'Permette di dividere il contenuto in piu\' ceste',
            'Registra mortalita\' se ci sono animali morti',
            'Supporta trasferimenti tra FLUPSY diversi'
          ],
          example: 'Esempio: Da 1 cesta crei 3 ceste con taglie diverse'
        },
        {
          title: 'TRATTAMENTO',
          color: '#f59e0b',
          content: [
            'Registra interventi sanitari o preventivi',
            'Documenta il tipo di trattamento effettuato',
            'Mantiene la tracciabilita\' delle cure'
          ]
        }
      ];

      for (const op of operations) {
        if (doc.y > 680) {
          doc.addPage();
          doc.y = 50;
        }

        const startY = doc.y;
        const boxHeight = op.isDeprecated ? 70 : (op.example ? 95 : 75);
        
        doc.rect(50, startY, 10, boxHeight).fill(op.color);
        
        if (op.isDeprecated) {
          doc.rect(60, startY, doc.page.width - 110, boxHeight)
             .fillAndStroke('#fee2e2', dangerColor);
        } else if (op.isNew) {
          doc.rect(60, startY, doc.page.width - 110, boxHeight)
             .fillAndStroke('#dbeafe', newFeatureColor);
        } else {
          doc.rect(60, startY, doc.page.width - 110, boxHeight)
             .fillAndStroke('#f8fafc', '#e2e8f0');
        }

        doc.fontSize(12)
           .fillColor(op.color)
           .font('Helvetica-Bold')
           .text(op.title, 70, startY + 8);
        
        if (op.isDeprecated) {
          doc.fontSize(8)
             .fillColor('white')
             .rect(70 + doc.widthOfString(op.title) + 10, startY + 8, 65, 14)
             .fill(dangerColor);
          doc.fillColor('white')
             .text('NON USARE', 70 + doc.widthOfString(op.title) + 15, startY + 10);
        }
        
        if (op.isNew) {
          const labelX = 70 + doc.widthOfString(op.title) + 10;
          doc.rect(labelX, startY + 8, 55, 14).fill(newFeatureColor);
          doc.fillColor('white')
             .fontSize(8)
             .text('PRINCIPALE', labelX + 5, startY + 10);
        }

        let contentY = startY + 25;
        doc.fontSize(9)
           .fillColor('#374151')
           .font('Helvetica');
        
        for (const line of op.content) {
          doc.text('• ' + line, 75, contentY, { width: doc.page.width - 140 });
          contentY += 12;
        }

        if (op.example) {
          doc.fontSize(8)
             .fillColor('#6b7280')
             .font('Helvetica-Oblique')
             .text(op.example, 75, contentY + 2);
        }

        doc.y = startY + boxHeight + 10;
      }

      doc.addPage();

      doc.rect(0, 0, doc.page.width, 60).fill(newFeatureColor);
      doc.fontSize(20)
         .fillColor('white')
         .font('Helvetica-Bold')
         .text('TAGLIA ATTESA - Nuova Funzionalita\'', 50, 20, { align: 'center' });

      doc.y = 80;

      doc.fontSize(11)
         .fillColor('#1f2937')
         .font('Helvetica')
         .text('Il sistema ora calcola automaticamente quando ogni cesta potrebbe aver cambiato taglia, basandosi su:', 50, doc.y, { width: doc.page.width - 100 });
      
      doc.moveDown(1);
      
      const features = [
        { icon: '📊', text: 'SGR (Specific Growth Rate) - tasso di crescita specifico per taglia' },
        { icon: '📅', text: 'Giorni trascorsi dall\'ultima misura' },
        { icon: '🔬', text: 'Peso medio atteso calcolato con formula esponenziale' }
      ];
      
      for (const f of features) {
        doc.fontSize(10)
           .text(`${f.icon}  ${f.text}`, 60, doc.y);
        doc.moveDown(0.5);
      }

      doc.moveDown(1);

      doc.rect(50, doc.y, doc.page.width - 100, 100)
         .fillAndStroke('#dbeafe', newFeatureColor);
      
      const formulaY = doc.y + 10;
      doc.fontSize(11)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('Come funziona:', 60, formulaY);
      
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#1e40af');
      
      doc.text('1. Il sistema prende il peso medio dall\'ultima MISURA', 60, formulaY + 18);
      doc.text('2. Applica l\'SGR per calcolare la crescita giornaliera', 60, formulaY + 32);
      doc.text('3. Se il peso atteso supera la soglia della taglia successiva...', 60, formulaY + 46);
      doc.text('4. La cesta LAMPEGGIA IN BLU nella tabella per avvisarti!', 60, formulaY + 60);
      
      doc.fontSize(8)
         .fillColor('#6b7280')
         .font('Helvetica-Oblique')
         .text('Formula: Peso Atteso = Peso Medio × e^((SGR/100) × giorni)', 60, formulaY + 78);

      doc.y = formulaY + 120;

      doc.fontSize(14)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('INDICATORI VISIVI', 50, doc.y);
      
      doc.moveDown(1);

      const indicators = [
        { color: newFeatureColor, text: 'SFONDO BLU CHE LAMPEGGIA', desc: 'La cesta potrebbe aver cambiato taglia - fare MISURA' },
        { color: successColor, text: 'TAGLIA OK', desc: 'La taglia registrata corrisponde a quella attesa' },
        { color: '#6b7280', text: 'GRIGIO', desc: 'Non ci sono dati sufficienti per calcolare la taglia attesa' }
      ];

      for (const ind of indicators) {
        const indY = doc.y;
        doc.rect(50, indY, 20, 20).fill(ind.color);
        doc.fontSize(10)
           .fillColor('#1f2937')
           .font('Helvetica-Bold')
           .text(ind.text, 80, indY + 2);
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#6b7280')
           .text(ind.desc, 80, indY + 14);
        doc.y = indY + 30;
      }

      doc.moveDown(2);

      doc.rect(50, doc.y, doc.page.width - 100, 80)
         .fillAndStroke('#dcfce7', successColor);
      
      const tipY = doc.y + 10;
      doc.fontSize(12)
         .fillColor('#166534')
         .font('Helvetica-Bold')
         .text('COSA DEVI FARE:', 60, tipY);
      
      doc.fontSize(10)
         .font('Helvetica')
         .text('1. Quando vedi una cesta lampeggiare in blu, fai una MISURA', 60, tipY + 20);
      doc.text('2. Usa PESO per registrare solo il peso (trend SGR-Peso)', 60, tipY + 35);
      doc.text('3. Usa MISURA per aggiornare taglia e numero animali', 60, tipY + 50);
      doc.text('4. Il sistema calcolera\' automaticamente la mortalita\'', 60, tipY + 65);

      doc.moveDown(2);

      doc.fontSize(14)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('RIEPILOGO MODIFICHE GENNAIO 2026', 50, doc.y);
      
      doc.moveDown(1);

      const changes = [
        { status: 'MODIFICATO', color: warningColor, text: 'Operazione PESO - ora registra solo peso (no cambio taglia)' },
        { status: 'NUOVO', color: newFeatureColor, text: 'SGR-Peso - trend crescita basato su operazioni peso' },
        { status: 'NUOVO', color: newFeatureColor, text: 'Taglia Attesa - calcolo automatico crescita' },
        { status: 'NUOVO', color: newFeatureColor, text: 'Lampeggio blu per ceste da misurare' },
        { status: 'MIGLIORATO', color: successColor, text: 'Tracciabilita\' lotto in tutte le transazioni' }
      ];

      for (const ch of changes) {
        const chY = doc.y;
        doc.fontSize(8)
           .rect(50, chY, 55, 14)
           .fill(ch.color);
        doc.fillColor('white')
           .font('Helvetica-Bold')
           .text(ch.status, 55, chY + 3);
        doc.fontSize(10)
           .fillColor('#1f2937')
           .font('Helvetica')
           .text(ch.text, 115, chY + 2);
        doc.y = chY + 20;
      }

      // =============== NUOVA PAGINA: SPREADSHEET OPERATIONS ===============
      doc.addPage();

      doc.rect(0, 0, doc.page.width, 60).fill('#10b981');
      doc.fontSize(20)
         .fillColor('white')
         .font('Helvetica-Bold')
         .text('FOGLIO ELETTRONICO - Spreadsheet Operations', 50, 20, { align: 'center' });

      doc.y = 80;

      doc.fontSize(11)
         .fillColor('#1f2937')
         .font('Helvetica')
         .text('Il modulo Spreadsheet Operations offre una vista tabellare completa di tutte le ceste con le operazioni piu\' recenti. E\' progettato per:', 50, doc.y, { width: doc.page.width - 100 });
      
      doc.moveDown(1);
      
      const spreadsheetFeatures = [
        { icon: '📋', text: 'Visualizzazione compatta di tutti i dati in formato tabella' },
        { icon: '🔍', text: 'Filtri rapidi per FLUPSY e Taglia' },
        { icon: '↕️', text: 'Ordinamento cliccando sulle intestazioni colonne' },
        { icon: '📊', text: 'Indicatori di performance con punteggio AI' },
        { icon: '💾', text: 'Export Excel professionale con tutti i dati' }
      ];
      
      for (const f of spreadsheetFeatures) {
        doc.fontSize(10)
           .text(`${f.icon}  ${f.text}`, 60, doc.y);
        doc.moveDown(0.5);
      }

      doc.moveDown(1);

      // Sezione Colonne della Tabella
      doc.fontSize(14)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('COLONNE DELLA TABELLA', 50, doc.y);
      
      doc.moveDown(0.8);

      const tableColumns = [
        { col: 'Cesta', desc: 'Numero fisico della cesta (es. #15)' },
        { col: 'Performance', desc: 'Punteggio 0-100 calcolato da AI (crescita, mortalita\', attivita\')' },
        { col: 'Trend AI', desc: 'Previsione crescita: STABILE, CRESCITA o CALO' },
        { col: 'FLUPSY', desc: 'Nome dell\'impianto FLUPSY' },
        { col: 'Taglia', desc: 'Categoria taglia attuale (T1, T3, T10, ecc.)' },
        { col: 'P.Med (mg)', desc: 'Peso medio per animale in milligrammi' },
        { col: 'Ult.Op', desc: 'Data dell\'ultima operazione (gg/mm)' },
        { col: 'Lotto', desc: 'ID e nome del lotto (es. "5 | Fornitore ABC")' },
        { col: 'Animali', desc: 'Numero totale di animali nella cesta' },
        { col: 'Peso Tot', desc: 'Peso totale in grammi' },
        { col: 'Anim/kg', desc: 'Animali per chilogrammo (indicatore taglia)' },
        { col: 'Mortalita\' %', desc: 'Percentuale mortalita\' dall\'ultima operazione' }
      ];

      for (const tc of tableColumns) {
        if (doc.y > 700) {
          doc.addPage();
          doc.y = 50;
        }
        doc.fontSize(9)
           .fillColor(primaryColor)
           .font('Helvetica-Bold')
           .text(tc.col + ': ', 60, doc.y, { continued: true });
        doc.fillColor('#374151')
           .font('Helvetica')
           .text(tc.desc);
        doc.moveDown(0.3);
      }

      doc.moveDown(1);

      // Sezione Performance Score
      doc.fontSize(14)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('PUNTEGGIO PERFORMANCE', 50, doc.y);
      
      doc.moveDown(0.8);

      const perfLevels = [
        { range: '80-100', level: 'Eccellente', color: successColor, desc: 'Crescita ottimale, mortalita\' bassa' },
        { range: '60-79', level: 'Buona', color: '#22c55e', desc: 'Andamento positivo' },
        { range: '40-59', level: 'Media', color: warningColor, desc: 'Monitoraggio consigliato' },
        { range: '0-39', level: 'Attenzione', color: dangerColor, desc: 'Richiede intervento' }
      ];

      for (const pl of perfLevels) {
        const plY = doc.y;
        doc.rect(60, plY, 50, 16).fill(pl.color);
        doc.fontSize(8)
           .fillColor('white')
           .font('Helvetica-Bold')
           .text(pl.range, 65, plY + 4);
        doc.fontSize(10)
           .fillColor('#1f2937')
           .font('Helvetica-Bold')
           .text(pl.level, 120, plY + 3);
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#6b7280')
           .text('- ' + pl.desc, 190, plY + 3);
        doc.y = plY + 22;
      }

      // =============== NUOVA PAGINA: EXPORT EXCEL ===============
      doc.addPage();

      doc.rect(0, 0, doc.page.width, 60).fill('#22c55e');
      doc.fontSize(20)
         .fillColor('white')
         .font('Helvetica-Bold')
         .text('EXPORT EXCEL - Esportazione Dati', 50, 20, { align: 'center' });

      doc.y = 80;

      doc.fontSize(11)
         .fillColor('#1f2937')
         .font('Helvetica')
         .text('Il pulsante verde "Esporta Excel" nella pagina Spreadsheet Operations permette di scaricare un file Excel professionale con tutti i dati visibili.', 50, doc.y, { width: doc.page.width - 100 });
      
      doc.moveDown(1.5);

      doc.fontSize(14)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('COME USARE L\'EXPORT', 50, doc.y);
      
      doc.moveDown(0.8);

      const exportSteps = [
        '1. Vai alla pagina "Spreadsheet Operations"',
        '2. Usa i filtri per selezionare FLUPSY e/o Taglia desiderata',
        '3. Clicca sull\'intestazione colonna per ordinare (freccia su/giu\')',
        '4. Clicca il pulsante verde "Esporta Excel"',
        '5. Il file viene scaricato automaticamente con nome: Spreadsheet_[FLUPSY]_[data].xlsx'
      ];

      for (const step of exportSteps) {
        doc.fontSize(10)
           .fillColor('#374151')
           .font('Helvetica')
           .text(step, 60, doc.y);
        doc.moveDown(0.5);
      }

      doc.moveDown(1);

      doc.fontSize(14)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('COLONNE NEL FILE EXCEL', 50, doc.y);
      
      doc.moveDown(0.8);

      const excelColumns = [
        { col: 'Cesta', desc: 'Numero fisico cesta' },
        { col: 'Performance', desc: 'Punteggio/100 con livello (es. "75.5/100 (Buona)")' },
        { col: 'Trend AI', desc: 'Direzione trend con percentuale (es. "CRESCITA (115%)")' },
        { col: 'FLUPSY', desc: 'Nome impianto' },
        { col: 'Taglia', desc: 'Categoria taglia' },
        { col: 'P.Med(mg)', desc: 'Peso medio in mg' },
        { col: 'Ult.Op', desc: 'Data ultima operazione' },
        { col: 'Lotto', desc: 'ID | Nome fornitore' },
        { col: 'Animali', desc: 'Conteggio animali' },
        { col: 'Peso Tot (g)', desc: 'Peso totale grammi' },
        { col: 'Anim/kg', desc: 'Animali per kg' },
        { col: 'P.Camp', desc: 'Peso campione' },
        { col: 'Vivi', desc: 'Animali vivi nel campione' },
        { col: 'Morti', desc: 'Animali morti' },
        { col: 'Tot.Camp.', desc: 'Totale campione' },
        { col: 'Mortalita\' %', desc: 'Percentuale mortalita\'' },
        { col: 'Urgenza', desc: 'Livello urgenza: Normale, Media, Alta, CRITICA' },
        { col: 'Problemi Rilevati', desc: 'Elenco problemi identificati dall\'AI' },
        { col: 'Raccomandazioni', desc: 'Azioni consigliate dall\'AI' },
        { col: 'Note', desc: 'Note operatore' }
      ];

      for (const ec of excelColumns) {
        if (doc.y > 720) {
          doc.addPage();
          doc.y = 50;
        }
        doc.fontSize(9)
           .fillColor('#166534')
           .font('Helvetica-Bold')
           .text(ec.col + ': ', 60, doc.y, { continued: true });
        doc.fillColor('#374151')
           .font('Helvetica')
           .text(ec.desc);
        doc.moveDown(0.25);
      }

      doc.moveDown(1);

      // Box informativo sui livelli di urgenza
      doc.rect(50, doc.y, doc.page.width - 100, 85)
         .fillAndStroke('#fef3c7', warningColor);
      
      const urgencyBoxY = doc.y + 10;
      doc.fontSize(11)
         .fillColor('#92400e')
         .font('Helvetica-Bold')
         .text('LIVELLI DI URGENZA', 60, urgencyBoxY);
      
      doc.fontSize(9)
         .font('Helvetica')
         .text('CRITICA: Mortalita\' >20% - Intervento immediato richiesto', 60, urgencyBoxY + 18);
      doc.text('Alta: Mortalita\' 10-20% o perdita popolazione anomala', 60, urgencyBoxY + 32);
      doc.text('Media: Crescita lenta o assenza operazioni da >14 giorni', 60, urgencyBoxY + 46);
      doc.text('Normale: Monitoraggio standard', 60, urgencyBoxY + 60);

      doc.y = urgencyBoxY + 100;

      // Sezione filtri e ordinamento
      doc.fontSize(14)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('FILTRI E ORDINAMENTO', 50, doc.y);
      
      doc.moveDown(0.8);

      doc.rect(50, doc.y, doc.page.width - 100, 70)
         .fillAndStroke('#dbeafe', newFeatureColor);
      
      const filterBoxY = doc.y + 10;
      doc.fontSize(10)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text('Filtro FLUPSY:', 60, filterBoxY);
      doc.font('Helvetica')
         .text('Seleziona un impianto specifico o "Tutti"', 150, filterBoxY);
      
      doc.font('Helvetica-Bold')
         .text('Filtro Taglia:', 60, filterBoxY + 18);
      doc.font('Helvetica')
         .text('Filtra per categoria taglia (T1, T3, T10, ecc.)', 150, filterBoxY + 18);
      
      doc.font('Helvetica-Bold')
         .text('Ordinamento:', 60, filterBoxY + 36);
      doc.font('Helvetica')
         .text('Clicca intestazione colonna (freccia indica direzione)', 150, filterBoxY + 36);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
