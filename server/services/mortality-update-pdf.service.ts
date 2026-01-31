/**
 * Servizio per la generazione del PDF delle modifiche al sistema di mortalità
 * Aggiornamento Gennaio 2026 - Mortalità Cumulativa Ponderata
 */
import PDFDocument from 'pdfkit';

export async function generateMortalityUpdatePDF(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: 'Aggiornamento Sistema Mortalità - Gennaio 2026',
          Author: 'Delta Futuro',
          Subject: 'Nuove funzionalità per il calcolo della mortalità cumulativa ponderata'
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

      // Header
      doc.rect(0, 0, doc.page.width, 120).fill(primaryColor);
      
      doc.fontSize(24)
         .fillColor('white')
         .font('Helvetica-Bold')
         .text('AGGIORNAMENTO SISTEMA MORTALITÀ', 50, 40, { align: 'center' });
      
      doc.fontSize(14)
         .font('Helvetica')
         .text('Gennaio 2026 - Mortalità Cumulativa Ponderata', { align: 'center' });
      
      doc.fontSize(10)
         .text('Delta Futuro - FLUPSY Management System', { align: 'center' });

      let yPos = 150;

      // Sezione 1: Introduzione
      doc.fillColor(primaryColor)
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('1. Cosa è cambiato?', 50, yPos);
      
      yPos += 25;
      doc.fillColor('#333')
         .fontSize(11)
         .font('Helvetica')
         .text('Il sistema di calcolo della mortalità è stato migliorato per fornire dati più accurati e significativi.', 50, yPos, { width: 495 });
      
      yPos += 35;
      doc.text('Prima: La mortalità veniva calcolata come media semplice delle percentuali delle singole operazioni.', 50, yPos, { width: 495 });
      
      yPos += 30;
      doc.fillColor(successColor)
         .font('Helvetica-Bold')
         .text('Ora: La mortalità viene calcolata in modo cumulativo e ponderato, considerando il numero totale di animali campionati.', 50, yPos, { width: 495 });

      // Sezione 2: Come funziona
      yPos += 50;
      doc.fillColor(primaryColor)
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('2. Come funziona il nuovo calcolo?', 50, yPos);
      
      yPos += 30;
      doc.fillColor('#333')
         .fontSize(11)
         .font('Helvetica')
         .text('Quando registri un\'operazione di Misura con mortalità:', 50, yPos);
      
      yPos += 25;
      doc.font('Helvetica-Bold')
         .text('Esempio pratico:', 70, yPos);
      
      yPos += 20;
      doc.font('Helvetica')
         .text('• Campione 1: 100 animali controllati, 5 morti → 5%', 70, yPos);
      yPos += 15;
      doc.text('• Campione 2: 80 animali controllati, 3 morti → 3.75%', 70, yPos);
      yPos += 15;
      doc.text('• Campione 3: 120 animali controllati, 2 morti → 1.67%', 70, yPos);
      
      yPos += 25;
      doc.fillColor(warningColor)
         .font('Helvetica-Bold')
         .text('Calcolo VECCHIO (media semplice):', 70, yPos);
      yPos += 15;
      doc.font('Helvetica')
         .fillColor('#333')
         .text('(5% + 3.75% + 1.67%) / 3 = 3.47%', 70, yPos);
      
      yPos += 25;
      doc.fillColor(successColor)
         .font('Helvetica-Bold')
         .text('Calcolo NUOVO (cumulativo ponderato):', 70, yPos);
      yPos += 15;
      doc.font('Helvetica')
         .fillColor('#333')
         .text('(5 + 3 + 2) morti / (100 + 80 + 120) campionati × 100 = 3.33%', 70, yPos);
      
      yPos += 25;
      doc.font('Helvetica-Oblique')
         .fontSize(10)
         .text('Il nuovo calcolo è più preciso perché dà più peso ai campioni più grandi.', 70, yPos);

      // Sezione 3: Cosa vedi nella Dashboard
      yPos += 45;
      doc.fillColor(primaryColor)
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('3. Cosa vedi nella Dashboard?', 50, yPos);
      
      yPos += 30;
      doc.fillColor('#333')
         .fontSize(11)
         .font('Helvetica')
         .text('La card "Analisi Mortalità Temporale" ora mostra:', 50, yPos);
      
      yPos += 25;
      
      // Box Recente
      doc.rect(70, yPos, 140, 60).fill('#fee2e2').stroke('#fca5a5');
      doc.fillColor('#991b1b')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('RECENTE (ultimi 3 gg)', 80, yPos + 8);
      doc.fontSize(16)
         .text('X.X%', 80, yPos + 25);
      doc.fontSize(8)
         .font('Helvetica')
         .text('N ceste • M morti campione', 80, yPos + 45);
      
      // Box Monitorare
      doc.rect(220, yPos, 140, 60).fill('#fef3c7').stroke('#fcd34d');
      doc.fillColor('#92400e')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('MONITORARE (4-7 gg)', 230, yPos + 8);
      doc.fontSize(16)
         .text('X.X%', 230, yPos + 25);
      doc.fontSize(8)
         .font('Helvetica')
         .text('N ceste • M morti campione', 230, yPos + 45);
      
      // Box Storica
      doc.rect(370, yPos, 140, 60).fill('#dcfce7').stroke('#86efac');
      doc.fillColor('#166534')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('STORICA (>7 gg)', 380, yPos + 8);
      doc.fontSize(16)
         .text('X.X%', 380, yPos + 25);
      doc.fontSize(8)
         .font('Helvetica')
         .text('N ceste • M morti campione', 380, yPos + 45);
      
      yPos += 80;
      doc.fillColor('#333')
         .fontSize(11)
         .font('Helvetica')
         .text('La percentuale mostrata è ora la mortalità cumulativa ponderata del periodo.', 50, yPos, { width: 495 });

      // Sezione 4: Morti Stimati Totali
      yPos += 35;
      doc.fillColor(primaryColor)
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('4. Morti Stimati sulla Popolazione', 50, yPos);
      
      yPos += 25;
      doc.fillColor('#333')
         .fontSize(11)
         .font('Helvetica')
         .text('In fondo alla card trovi ora un nuovo dato:', 50, yPos);
      
      yPos += 25;
      doc.rect(70, yPos, 420, 40).fill('#f3f4f6').stroke('#d1d5db');
      doc.fillColor('#374151')
         .fontSize(10)
         .font('Helvetica')
         .text('Morti stimati totali: ', 80, yPos + 12);
      doc.fillColor('#dc2626')
         .font('Helvetica-Bold')
         .text('~15.000.000', 175, yPos + 12);
      doc.fillColor('#6b7280')
         .font('Helvetica')
         .text('(14.42% della popolazione)', 260, yPos + 12);
      
      yPos += 55;
      doc.fillColor('#333')
         .fontSize(11)
         .font('Helvetica')
         .text('Questo numero rappresenta la stima dei morti totali, calcolata come:', 50, yPos);
      
      yPos += 20;
      doc.font('Helvetica-Bold')
         .text('Animali iniziali (alla prima attivazione) - Animali attuali = Morti stimati', 70, yPos);
      
      yPos += 25;
      doc.font('Helvetica-Oblique')
         .fontSize(10)
         .text('Passa il mouse sopra per vedere i dettagli: animali iniziali, attuali e differenza.', 50, yPos);

      // Sezione 5: Note importanti
      yPos += 40;
      doc.fillColor(primaryColor)
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('5. Note Importanti', 50, yPos);
      
      yPos += 25;
      doc.fillColor('#333')
         .fontSize(11)
         .font('Helvetica');
      
      const notes = [
        '• Non cambia nulla nel modo in cui registri le operazioni.',
        '• I dati delle operazioni passate vengono ancora mostrati correttamente.',
        '• Le nuove operazioni beneficeranno del calcolo più preciso.',
        '• I colori indicano la "freschezza" del dato: rosso = recente, giallo = da monitorare, verde = storico.'
      ];
      
      notes.forEach(note => {
        doc.text(note, 50, yPos, { width: 495 });
        yPos += 18;
      });

      // Footer
      doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill(primaryColor);
      doc.fillColor('white')
         .fontSize(9)
         .font('Helvetica')
         .text('Delta Futuro © 2026 - FLUPSY Management System', 50, doc.page.height - 28, { align: 'center' });
      doc.text('Documento generato automaticamente', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
