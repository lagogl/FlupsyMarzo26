/**
 * Servizio per la generazione del PDF delle modifiche al sistema
 * Aggiornamento Gennaio 2026 - Mortalità, Dashboard e Analisi AI
 */
import PDFDocument from 'pdfkit';

export async function generateMortalityUpdatePDF(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: 'Aggiornamento Sistema FLUPSY - 30-31 Gennaio 2026',
          Author: 'Delta Futuro',
          Subject: 'Nuove funzionalità per mortalità, dashboard e analisi AI'
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

      // ============ PAGINA 1 ============
      // Header
      doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);
      
      doc.fontSize(22)
         .fillColor('white')
         .font('Helvetica-Bold')
         .text('AGGIORNAMENTO SISTEMA FLUPSY', 50, 35, { align: 'center' });
      
      doc.fontSize(12)
         .font('Helvetica')
         .text('30-31 Gennaio 2026 - Novità per Operatori', { align: 'center' });

      let yPos = 130;

      // Indice
      doc.fillColor(primaryColor)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('INDICE DELLE NOVITÀ', 50, yPos);
      
      yPos += 25;
      doc.fillColor('#333')
         .fontSize(10)
         .font('Helvetica');
      
      const indice = [
        '1. Mortalità Cumulativa Ponderata (nuovo calcolo più preciso)',
        '2. Card Analisi Mortalità Temporale (dashboard)',
        '3. Card Analisi AI Mortalità (pattern e alert)',
        '4. Popup Interattivi (distribuzione animali e mortalità per taglia)',
        '5. Layout Dashboard Migliorato',
        '6. Export Excel con Animali Iniziali'
      ];
      
      indice.forEach(item => {
        doc.text(item, 60, yPos);
        yPos += 15;
      });

      // Sezione 1: Mortalità Cumulativa
      yPos += 20;
      doc.fillColor(primaryColor)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('1. MORTALITÀ CUMULATIVA PONDERATA', 50, yPos);
      
      yPos += 20;
      doc.fillColor('#333')
         .fontSize(10)
         .font('Helvetica')
         .text('Il sistema ora calcola la mortalità in modo più accurato.', 50, yPos);
      
      yPos += 20;
      doc.font('Helvetica-Bold')
         .text('PRIMA (media semplice - meno preciso):', 60, yPos);
      yPos += 12;
      doc.font('Helvetica')
         .text('• Campione 1: 5% + Campione 2: 10% + Campione 3: 2% = media 5.7%', 70, yPos);
      
      yPos += 20;
      doc.fillColor(successColor)
         .font('Helvetica-Bold')
         .text('ORA (cumulativo ponderato - più preciso):', 60, yPos);
      yPos += 12;
      doc.font('Helvetica')
         .fillColor('#333')
         .text('• Totale morti nei campioni ÷ Totale animali campionati × 100', 70, yPos);
      yPos += 12;
      doc.text('• Le ceste con campioni più grandi pesano di più nel calcolo', 70, yPos);

      yPos += 25;
      doc.font('Helvetica-Oblique')
         .fontSize(9)
         .text('Non cambia nulla nel modo in cui registri le operazioni. Il sistema calcola automaticamente.', 60, yPos);

      // Sezione 2: Card Mortalità Temporale
      yPos += 30;
      doc.fillColor(primaryColor)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('2. CARD ANALISI MORTALITÀ TEMPORALE', 50, yPos);
      
      yPos += 20;
      doc.fillColor('#333')
         .fontSize(10)
         .font('Helvetica')
         .text('Nella dashboard trovi una nuova card che mostra la mortalità divisa per periodi:', 50, yPos);
      
      yPos += 20;
      
      // Mini box colorati
      doc.rect(60, yPos, 130, 45).fill('#fee2e2').stroke('#fca5a5');
      doc.fillColor('#991b1b').fontSize(9).font('Helvetica-Bold').text('RECENTE', 70, yPos + 5);
      doc.fontSize(8).font('Helvetica').text('Ultimi 3 giorni', 70, yPos + 17);
      doc.fillColor('#dc2626').text('Colore ROSSO', 70, yPos + 30);
      
      doc.rect(200, yPos, 130, 45).fill('#fef3c7').stroke('#fcd34d');
      doc.fillColor('#92400e').fontSize(9).font('Helvetica-Bold').text('MONITORARE', 210, yPos + 5);
      doc.fontSize(8).font('Helvetica').text('4-7 giorni fa', 210, yPos + 17);
      doc.fillColor('#d97706').text('Colore GIALLO', 210, yPos + 30);
      
      doc.rect(340, yPos, 130, 45).fill('#dcfce7').stroke('#86efac');
      doc.fillColor('#166534').fontSize(9).font('Helvetica-Bold').text('STORICA', 350, yPos + 5);
      doc.fontSize(8).font('Helvetica').text('Oltre 7 giorni', 350, yPos + 17);
      doc.fillColor('#16a34a').text('Colore VERDE', 350, yPos + 30);
      
      yPos += 60;
      doc.fillColor('#333')
         .fontSize(10)
         .font('Helvetica')
         .text('In fondo alla card trovi anche:', 50, yPos);
      yPos += 15;
      doc.text('• Morti stimati totali sulla popolazione (differenza tra animali iniziali e attuali)', 60, yPos);
      yPos += 12;
      doc.text('• Percentuale di mortalità sulla popolazione totale', 60, yPos);

      // Sezione 3: Card AI
      yPos += 30;
      doc.fillColor(primaryColor)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('3. CARD ANALISI AI MORTALITÀ', 50, yPos);
      
      yPos += 20;
      doc.fillColor('#333')
         .fontSize(10)
         .font('Helvetica')
         .text('Una nuova card con intelligenza artificiale analizza i dati e rileva automaticamente:', 50, yPos);
      
      yPos += 18;
      const patterns = [
        { name: 'SPIKE', desc: 'Aumento improvviso della mortalità (>50% rispetto alla media)', color: dangerColor },
        { name: 'PERSISTENTE', desc: '3 o più eventi di mortalità in 7 giorni sulla stessa cesta', color: warningColor },
        { name: 'LOCALIZZATA', desc: '3 o più ceste con mortalità nello stesso FLUPSY', color: warningColor },
        { name: 'IN MIGLIORAMENTO', desc: 'Riduzione significativa della mortalità', color: successColor }
      ];
      
      patterns.forEach(p => {
        doc.fillColor(p.color).font('Helvetica-Bold').text(`• ${p.name}:`, 60, yPos);
        doc.fillColor('#333').font('Helvetica').text(p.desc, 150, yPos);
        yPos += 14;
      });

      yPos += 10;
      doc.fillColor('#333')
         .font('Helvetica')
         .text('La card mostra anche le ceste più colpite con la loro percentuale di mortalità.', 50, yPos);

      // Sezione 4: Popup Interattivi
      yPos += 30;
      doc.fillColor(primaryColor)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('4. POPUP INTERATTIVI', 50, yPos);
      
      yPos += 20;
      doc.fillColor('#333')
         .fontSize(10)
         .font('Helvetica')
         .text('Nella dashboard, passando il mouse sopra le statistiche delle ceste attive:', 50, yPos);
      
      yPos += 18;
      doc.text('• Popup con grafico a torta della distribuzione animali per taglia', 60, yPos);
      yPos += 12;
      doc.text('• Popup con grafico a torta della distribuzione mortalità per taglia', 60, yPos);
      yPos += 12;
      doc.text('• Dettagli completi: numero ceste, animali totali, percentuali', 60, yPos);

      // Footer pagina 1
      doc.rect(0, doc.page.height - 35, doc.page.width, 35).fill(primaryColor);
      doc.fillColor('white')
         .fontSize(8)
         .font('Helvetica')
         .text('Delta Futuro © 2026 - FLUPSY Management System - Pagina 1/2', 50, doc.page.height - 22, { align: 'center' });

      // ============ PAGINA 2 ============
      doc.addPage();
      
      // Header pagina 2
      doc.rect(0, 0, doc.page.width, 60).fill(primaryColor);
      doc.fontSize(16)
         .fillColor('white')
         .font('Helvetica-Bold')
         .text('AGGIORNAMENTO SISTEMA FLUPSY - continua', 50, 25, { align: 'center' });

      yPos = 90;

      // Sezione 5: Layout Dashboard
      doc.fillColor(primaryColor)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('5. LAYOUT DASHBOARD MIGLIORATO', 50, yPos);
      
      yPos += 20;
      doc.fillColor('#333')
         .fontSize(10)
         .font('Helvetica')
         .text('La dashboard è stata riorganizzata per una migliore visualizzazione:', 50, yPos);
      
      yPos += 18;
      doc.text('• Prima riga: 4 card principali (Ceste, Cicli, Lotti, Health SGR)', 60, yPos);
      yPos += 12;
      doc.text('• Seconda riga: 2 card mortalità affiancate (Temporale + AI)', 60, yPos);
      yPos += 12;
      doc.text('• Design simmetrico e più leggibile', 60, yPos);

      // Sezione 6: Export Excel
      yPos += 30;
      doc.fillColor(primaryColor)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('6. EXPORT EXCEL CON ANIMALI INIZIALI', 50, yPos);
      
      yPos += 20;
      doc.fillColor('#333')
         .fontSize(10)
         .font('Helvetica')
         .text('Gli export Excel ora includono anche:', 50, yPos);
      
      yPos += 18;
      doc.text('• Numero animali iniziali (alla prima attivazione)', 60, yPos);
      yPos += 12;
      doc.text('• Numero animali attuali', 60, yPos);
      yPos += 12;
      doc.text('• Differenza (morti stimati)', 60, yPos);

      // Riquadro riepilogo
      yPos += 40;
      doc.rect(50, yPos, 495, 120).fill('#f0f9ff').stroke(accentColor);
      yPos += 15;
      doc.fillColor(primaryColor)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('RIEPILOGO PER GLI OPERATORI', 60, yPos);
      
      yPos += 25;
      doc.fillColor('#333')
         .fontSize(10)
         .font('Helvetica');
      
      const riepilogo = [
        '✓ Non cambia nulla nel modo in cui registri le operazioni',
        '✓ Il calcolo della mortalità è ora più preciso automaticamente',
        '✓ Nuove card nella dashboard per monitorare meglio la mortalità',
        '✓ Popup informativi passando il mouse sulle statistiche',
        '✓ Export Excel più completi con dati iniziali e attuali'
      ];
      
      riepilogo.forEach(item => {
        doc.text(item, 70, yPos, { width: 460 });
        yPos += 16;
      });

      // Sezione contatti/supporto
      yPos += 40;
      doc.fillColor(primaryColor)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('SUPPORTO', 50, yPos);
      
      yPos += 18;
      doc.fillColor('#333')
         .fontSize(10)
         .font('Helvetica')
         .text('Per domande o problemi, contattare il responsabile IT o consultare la guida operativa', 50, yPos);
      yPos += 12;
      doc.text('completa disponibile in: /api/guides/operator-guide.pdf', 50, yPos);

      // Footer pagina 2
      doc.rect(0, doc.page.height - 35, doc.page.width, 35).fill(primaryColor);
      doc.fillColor('white')
         .fontSize(8)
         .font('Helvetica')
         .text('Delta Futuro © 2026 - FLUPSY Management System - Pagina 2/2', 50, doc.page.height - 22, { align: 'center' });
      doc.text('Documento generato il ' + new Date().toLocaleDateString('it-IT'), { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
