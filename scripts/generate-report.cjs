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
const TEAL = '#0f766e';
const LEFT = 50;
const CONTENT_W = W - 100;

// HEADER
doc.rect(0, 0, W, 78).fill(PRIMARY);
doc.fillColor('white').fontSize(20).font('Helvetica-Bold')
   .text('FLUPSY Management System', LEFT, 20, { width: CONTENT_W });
doc.fontSize(11).font('Helvetica')
   .text('Riepilogo Modifiche Operative — 19 Marzo 2026', LEFT, 48, { width: CONTENT_W });
doc.y = 95;

doc.fillColor('#111827').fontSize(10.5).font('Helvetica')
   .text(
     'Riepilogo verificato dai commit git della giornata. Sono elencate le modifiche effettive ' +
     'implementate nel sistema, con descrizione operativa per gli utenti.',
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

// =========================================================
// 1. NOTE VAGLIATURA
// =========================================================
section('1. Note Vagliatura — Visualizzazione in piu moduli', PURPLE);

bullet('Cosa e stato aggiunto');
sub('Nelle operazioni di tipo "Scheda" (dettaglio operazione): appare una nuova sezione viola "Nota Vagliatura" se presente.');
sub('Nel modulo SpreadsheetOperations: la cella nota mostra un pallino viola se esiste una nota vagliatura, con tooltip che espone il testo e lo storico note del ciclo.');
sub('Nella Dashboard FLUPSY Visualizer: i cestelli con nota vagliatura mostrano un\'icona StickyNote viola nell\'angolo in alto a destra con tooltip al passaggio del mouse.');
doc.moveDown(0.15);

bullet('Moduli toccati');
sub('SpreadsheetOperations — cella nota con indicatore viola e popup storico');
sub('Operations — card "Nota Vagliatura" nel dettaglio operazione');
sub('NewFlupsyVisualizer — icona nota sui cestelli nella dashboard');
sub('operations.service.ts — aggiunto campo vagliatureNote alla query');
sub('baskets-controller.ts — aggiunto vagliatureNote nella risposta API cestelli');
doc.moveDown(0.25);

// =========================================================
// 2. SGR CICLI CHIUSI IN SPREADSHEETOPERATIONS
// =========================================================
section('2. SGR Cicli Chiusi — Modulo Foglio Operativo', TEAL);

bullet('Cosa e stato aggiunto');
sub('Nel modulo SpreadsheetOperations e apparso un nuovo pulsante "Cicli chiusi" (icona cartella) nella barra filtri.');
sub('Cliccando il pulsante si espande una sezione sola lettura che elenca tutti i cicli chiusi del FLUPSY selezionato.');
sub('Per ogni ciclo chiuso viene calcolato e mostrato l\'SGR-M (tasso di crescita mensile) basato sulle operazioni di misura.');
sub('La sezione rispetta i filtri attivi (FLUPSY e Sito) e mostra i cicli in ordine cronologico inverso.');
sub('Sono incluse operazioni di tipo misura, prima-attivazione, chiusura-ciclo-vagliatura e vagliatura-con-mappa.');
doc.moveDown(0.15);

bullet('Impatto operativo');
sub('Gli operatori possono confrontare la performance storica dei cicli chiusi con quella dei cicli attivi senza uscire dal foglio operativo.');
sub('I dati sono in sola lettura: nessuna modifica accidentale possibile.');
doc.moveDown(0.25);

// =========================================================
// 3. NUOVA PAGINA: SGR PER LOTTO
// =========================================================
section('3. Nuova Pagina: SGR per Lotto (menu Monitoraggio)', PRIMARY);

bullet('Cosa e stato aggiunto');
sub('Nuova pagina dedicata "SGR per Lotto" accessibile dal menu Monitoraggio -> SGR per Lotto.');
sub('Calcola il tasso SGR percorrendo l\'intera catena di discendenza (lineage) a partire dal lineage_group_id.');
sub('Formula: ln(APK radice / APK foglia) / giorni totali x 100');
sub('Schede espandibili per ogni lotto con dettaglio per catena di lineage e statistiche globali comparative.');
sub('Filtri per lotto specifico e per intervallo di date.');
doc.moveDown(0.15);

bullet('Modifiche tecniche collegate');
sub('SgrLineage.tsx — nuova pagina (425 righe aggiunte)');
sub('App.tsx — registrata la rotta /sgr-lineage');
sub('MainLayout.tsx — aggiunta voce di menu nel gruppo Monitoraggio');
sub('MenuSettings.tsx — aggiunta voce nelle impostazioni menu');
sub('cycles.service.ts — aggiunti i campi parentCycleId e lineageGroupId nella query cicli');
doc.moveDown(0.25);

// =========================================================
// 4. FIX PESO MEDIO / SGR — CORREZIONI BUG
// =========================================================
section('4. Correzione Bug: Peso Medio e SGR (dato stale)', AMBER);

bullet('Problema individuato');
sub('Il campo average_weight nel database conservava il valore della prima inserzione e non veniva aggiornato quando animalsPerKg cambiava.');
sub('Conseguenza: "Performance di crescita" mostrava 0.0% e il "Peso Medio" nella pagina ciclo mostrava lo stesso valore per tutte le operazioni.');
doc.moveDown(0.15);

bullet('Correzioni applicate — Operations.tsx');
sub('Riepilogo ciclo: calcolo peso sostituito con formula 1.000.000 / animalsPerKg (sempre aggiornata).');
sub('Dettaglio per operazione: stessa formula applicata alla singola operazione.');
doc.moveDown(0.15);

bullet('Correzioni applicate — CycleDetail.tsx');
sub('Card "Peso Medio" in cima alla pagina ciclo: ora mostra il peso reale derivato da animalsPerKg.');
sub('Sezione "Andamento della Crescita": Peso iniziale, Peso attuale e percentuali di crescita corretti.');
sub('Grafico di crescita: punti aggiornati, la curva non e piu piatta.');
sub('Tabella Cronologia Operazioni, colonna "Peso Medio (mg)": ogni riga mostra il peso specifico di quella operazione.');
doc.moveDown(0.15);

bullet('Risultato concreto — Ciclo #194 (esempio)');
sub('Prima: tutte le righe mostravano 0.23 mg, crescita 0.0%');
sub('Dopo: Prima Attivazione 0.23 mg, Misura 1.54 mg, Crescita +562% totale');
doc.moveDown(0.25);

// =========================================================
// 5. NOTE NELLE LISTE SCREENING
// =========================================================
section('5. Colonna Note nelle Liste Screening', GREEN_D);

bullet('Cosa e stato aggiunto');
sub('ScreeningsList.tsx: aggiunta colonna "Note" nella tabella lista screening (troncata con tooltip).');
sub('ScreeningDetail.tsx: aggiunta colonna "Note" nella tabella ceste della vagliatura.');
doc.moveDown(0.15);

bullet('Impatto operativo');
sub('Le note associate agli screening sono ora visibili direttamente dalla lista senza dover aprire ogni record.');
doc.moveDown(0.3);

// =========================================================
// RIEPILOGO FILE
// =========================================================
section('Riepilogo File Modificati', DARK);

const files = [
  ['client/src/pages/SpreadsheetOperations.tsx', 'MODIFICA — note vagliatura + sezione cicli chiusi con SGR storico'],
  ['client/src/pages/Operations.tsx', 'MODIFICA — nota vagliatura nel dettaglio + fix calcolo peso (2 punti)'],
  ['client/src/pages/CycleDetail.tsx', 'MODIFICA — fix peso medio in 4 punti (card, crescita, grafico, tabella)'],
  ['client/src/pages/ScreeningsList.tsx', 'MODIFICA — colonna Note aggiunta alla lista'],
  ['client/src/pages/ScreeningDetail.tsx', 'MODIFICA — colonna Note aggiunta al dettaglio ceste'],
  ['client/src/pages/SgrLineage.tsx', 'NUOVO — pagina SGR per Lotto con calcoli lineage (425 righe)'],
  ['client/src/layouts/MainLayout.tsx', 'MODIFICA — voce menu SGR per Lotto'],
  ['client/src/pages/MenuSettings.tsx', 'MODIFICA — voce menu nelle impostazioni'],
  ['client/src/components/dashboard/NewFlupsyVisualizer.tsx', 'MODIFICA — icona nota vagliatura sui cestelli'],
  ['server/modules/.../operations.service.ts', 'MODIFICA — aggiunto campo vagliatureNote nella query'],
  ['server/controllers/baskets-controller.ts', 'MODIFICA — aggiunto vagliatureNote nella risposta API'],
  ['server/modules/.../cycles.service.ts', 'MODIFICA — aggiunti parentCycleId e lineageGroupId'],
];

files.forEach(function(item) {
  const fy = doc.y;
  doc.fillColor(PRIMARY).fontSize(8.5).font('Helvetica-Bold')
     .text(item[0], LEFT + 4, fy, { width: CONTENT_W - 4 });
  doc.fillColor(GRAY).fontSize(8.5).font('Helvetica')
     .text(item[1], LEFT + 4, doc.y, { width: CONTENT_W - 4 });
  doc.moveDown(0.4);
});

// FOOTER
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  const footerY = doc.page.height - 38;
  doc.rect(0, footerY - 6, W, 44).fill('#f3f4f6');
  doc.fillColor(GRAY).fontSize(8).font('Helvetica')
     .text(
       'FLUPSY Management System  \u2014  Riepilogo verificato da git log del 19/03/2026  \u2014  Uso interno',
       LEFT, footerY, { align: 'center', width: CONTENT_W }
     );
  doc.fillColor(GRAY).fontSize(8)
     .text('Pag. ' + (i + 1) + ' / ' + range.count, LEFT, footerY + 12, { align: 'center', width: CONTENT_W });
}

doc.end();
out.on('finish', function() { console.log('OK'); });
out.on('error', function(e) { console.error(e); });
