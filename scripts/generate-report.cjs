const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
const out = fs.createWriteStream('/home/runner/workspace/riepilogo_modifiche_19marzo2026.pdf');
doc.pipe(out);

const W = doc.page.width;
const PRIMARY = '#1e40af';
const GRAY = '#6b7280';
const AMBER = '#b45309';
const GREEN_D = '#166534';
const PURPLE = '#5b21b6';
const DARK = '#374151';
const LEFT = 50;
const RIGHT = W - 50;
const CONTENT_W = RIGHT - LEFT;

doc.rect(0, 0, W, 78).fill(PRIMARY);
doc.fillColor('white').fontSize(20).font('Helvetica-Bold')
   .text('FLUPSY Management System', LEFT, 20, { width: CONTENT_W });
doc.fontSize(11).font('Helvetica')
   .text('Riepilogo Modifiche — 19 Marzo 2026', LEFT, 48, { width: CONTENT_W });

doc.y = 95;

doc.fillColor('#111827').fontSize(10.5).font('Helvetica')
   .text(
     "Di seguito sono elencate tutte le modifiche tecniche implementate nella giornata odierna, " +
     "con descrizione dell'impatto funzionale per gli operatori.",
     LEFT, doc.y, { align: 'justify', width: CONTENT_W }
   );
doc.moveDown(0.8);

function section(title, color) {
  const c = color || PRIMARY;
  const sy = doc.y + 4;
  doc.rect(LEFT, sy, CONTENT_W, 24).fill(c);
  doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
     .text(title, LEFT + 8, sy + 6, { width: CONTENT_W - 16 });
  doc.y = sy + 30;
  doc.moveDown(0.2);
}

function bullet(text) {
  const by = doc.y;
  doc.fillColor(PRIMARY).fontSize(13).font('Helvetica-Bold').text('\u2022', LEFT + 4, by);
  doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold')
     .text(text, LEFT + 18, by, { width: CONTENT_W - 18 });
  doc.moveDown(0.35);
}

function sub(text) {
  const sy = doc.y;
  doc.fillColor(GRAY).fontSize(10).font('Helvetica').text('\u2013', LEFT + 22, sy);
  doc.fillColor('#374151').fontSize(9.5).font('Helvetica')
     .text(text, LEFT + 34, sy, { width: CONTENT_W - 34 });
  doc.moveDown(0.25);
}

section('1. Nuova Pagina: SGR per Lotto', PRIMARY);

bullet('Cosa e stato aggiunto');
sub('Nuova pagina "SGR per Lotto" accessibile dal menu Monitoraggio.');
sub('Calcola il tasso di crescita specifico (SGR) per ogni lotto seguendo l\'intera catena di lineage.');
sub('Formula applicata: ln(APK iniziale / APK finale) / giorni totali x 100');
sub('Mostra schede espandibili per lotto con dettaglio catena e statistiche globali.');
sub('Include filtri per lotto e per intervallo di date.');

doc.moveDown(0.15);
bullet('Impatto per l\'operatore');
sub('E possibile confrontare le performance di crescita tra lotti in una vista dedicata.');
sub('Il calcolo usa sempre animalsPerKg (affidabile), non il peso medio memorizzato nel database.');
doc.moveDown(0.25);

section('2. Correzione: Performance di Crescita (pagina Operazioni)', AMBER);

bullet('Problema rilevato');
sub('La sezione "Performance di crescita" mostrava sempre 0.0% totale e 0.00% al giorno.');
sub('Causa: il campo average_weight era rimasto stale anche dopo aggiornamenti di animalsPerKg.');
doc.moveDown(0.15);

bullet('Correzione applicata');
sub('Sostituito averageWeight con calcolo diretto: peso_mg = 1.000.000 / animalsPerKg');
sub('Fix applicato in DUE punti: riepilogo del ciclo e dettaglio per singola operazione.');
doc.moveDown(0.15);

bullet('Esempio concreto — Ciclo #194');
sub('PRIMA: Crescita totale 0.0% — giornaliera 0.00%');
sub('DOPO:  Peso 0.23 mg -> 1.54 mg — Crescita +562% — circa 24% al giorno');
doc.moveDown(0.25);

section('3. Correzione: Pagina Dettaglio Ciclo', GREEN_D);

bullet('Problema rilevato');
sub('La pagina di dettaglio mostrava il peso medio stale (0.23 mg) per tutte le operazioni.');
doc.moveDown(0.15);

bullet('Quattro correzioni applicate');
sub('Card "Peso Medio" in alto a destra: ora mostra il peso reale dell\'ultima operazione.');
sub('Sezione "Andamento della Crescita": Peso iniziale, attuale, Crescita totale e giornaliera corretti.');
sub('Grafico di crescita: punti ora corretti, curva non piu piatta.');
sub('Tabella Cronologia Operazioni, colonna "Peso Medio (mg)": ogni riga mostra il valore corretto.');
doc.moveDown(0.15);

bullet('Risultato visivo — Ciclo #194');
sub('Prima Attivazione (24/02): 4.307.692 an/kg -> 0.23 mg (invariato, era gia corretto)');
sub('Misura (19/03): 651.163 an/kg -> 1.54 mg (prima mostrava erroneamente 0.23 mg)');
doc.moveDown(0.25);

section('Nota Tecnica — Root Cause del Bug', PURPLE);

bullet('Perche average_weight era stale?');
sub('Il campo average_weight viene scritto all\'inserimento e non sempre ricalcolato quando animalsPerKg cambia.');
sub('Soluzione permanente adottata: derivare il peso sempre da 1.000.000 / animalsPerKg.');
sub('animalsPerKg e il valore primario e canonico; average_weight e solo un campo derivato.');
doc.moveDown(0.25);

section('File Modificati', DARK);

const files = [
  ['client/src/pages/SgrLineage.tsx', 'NUOVO — pagina SGR per Lotto con calcoli lineage'],
  ['client/src/layouts/MainLayout.tsx', 'MODIFICA — aggiunta voce menu "SGR per Lotto"'],
  ['client/src/pages/MenuSettings.tsx', 'MODIFICA — aggiunta voce nelle impostazioni menu'],
  ['server/modules/.../cycles.service.ts', 'MODIFICA — aggiunti parentCycleId e lineageGroupId alla query'],
  ['client/src/pages/Operations.tsx', 'MODIFICA — fix calcolo peso in 2 punti (Performance di crescita)'],
  ['client/src/pages/CycleDetail.tsx', 'MODIFICA — fix peso medio in 4 punti (card, crescita, grafico, tabella)'],
];

files.forEach(function(item) {
  const fy = doc.y;
  doc.fillColor(PRIMARY).fontSize(8.5).font('Helvetica-Bold')
     .text(item[0], LEFT + 4, fy, { width: CONTENT_W - 4 });
  doc.fillColor(GRAY).fontSize(8.5).font('Helvetica')
     .text(item[1], LEFT + 4, doc.y, { width: CONTENT_W - 4 });
  doc.moveDown(0.4);
});

const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  const footerY = doc.page.height - 38;
  doc.rect(0, footerY - 6, W, 44).fill('#f3f4f6');
  doc.fillColor(GRAY).fontSize(8).font('Helvetica')
     .text(
       'FLUPSY Management System  \u2014  Riepilogo tecnico del 19/03/2026  \u2014  Uso interno',
       LEFT, footerY, { align: 'center', width: CONTENT_W }
     );
  doc.fillColor(GRAY).fontSize(8)
     .text('Pag. ' + (i + 1) + ' / ' + range.count, LEFT, footerY + 12, { align: 'center', width: CONTENT_W });
}

doc.end();
out.on('finish', function() { console.log('PDF creato con successo'); });
out.on('error', function(e) { console.error('Errore:', e); });
