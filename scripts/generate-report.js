const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({ margin: 50, size: 'A4' });
const out = fs.createWriteStream('/home/runner/workspace/riepilogo_modifiche_19marzo2026.pdf');
doc.pipe(out);

const PRIMARY = '#1e40af';
const GRAY = '#6b7280';
const AMBER = '#b45309';
const GREEN_D = '#166534';
const PURPLE = '#5b21b6';
const DARK = '#374151';

// --- HEADER ---
doc.rect(0, 0, doc.page.width, 80).fill(PRIMARY);
doc.fillColor('white').fontSize(20).font('Helvetica-Bold')
   .text('FLUPSY Management System', 50, 22);
doc.fontSize(11).font('Helvetica')
   .text('Riepilogo Modifiche — 19 Marzo 2026', 50, 48);
doc.moveDown(3);

// --- INTRO ---
doc.fillColor('#111827').fontSize(11).font('Helvetica')
   .text(
     "Di seguito sono elencate tutte le modifiche tecniche implementate nella giornata odierna, " +
     "con descrizione dell'impatto funzionale per gli operatori.",
     { align: 'justify' }
   );
doc.moveDown(1.2);

function section(title, color) {
  doc.moveDown(0.4);
  const y = doc.y;
  doc.rect(50, y, doc.page.width - 100, 22).fill(color || PRIMARY);
  doc.fillColor('white').fontSize(12).font('Helvetica-Bold')
     .text(title, 58, y + 5);
  doc.y = y + 28;
  doc.moveDown(0.4);
}

function bullet(text) {
  const y = doc.y;
  doc.fillColor(PRIMARY).fontSize(14).font('Helvetica-Bold').text('\u2022', 54, y - 2);
  doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold')
     .text(text, 70, y, { width: doc.page.width - 120 });
  doc.moveDown(0.4);
}

function sub(text) {
  const y = doc.y;
  doc.fillColor(GRAY).fontSize(11).font('Helvetica').text('\u2013', 74, y - 1);
  doc.fillColor('#374151').fontSize(9.5).font('Helvetica')
     .text(text, 88, y, { width: doc.page.width - 138 });
  doc.moveDown(0.28);
}

// =========================================================
// 1. NUOVA PAGINA SGR PER LOTTO
// =========================================================
section('1. Nuova Pagina: SGR per Lotto', PRIMARY);

bullet('Cosa e stato aggiunto');
sub('Nuova pagina "SGR per Lotto" accessibile dal menu Monitoraggio.');
sub('Calcola il tasso di crescita specifico (SGR) per ogni lotto seguendo l\'intera catena di lineage.');
sub('Formula: ln(APK iniziale / APK finale) / giorni totali x 100');
sub('Mostra schede espandibili per ogni lotto con dettaglio per catena e statistiche globali.');
sub('Include filtri per lotto e intervallo di date.');
doc.moveDown(0.2);

bullet('Impatto per l\'operatore');
sub('E possibile confrontare le performance di crescita tra lotti diversi in un\'unica vista dedicata.');
sub('Il calcolo usa sempre animalsPerKg (affidabile), non il peso medio memorizzato nel database.');
doc.moveDown(0.3);

// =========================================================
// 2. FIX PERFORMANCE DI CRESCITA — OPERATIONS
// =========================================================
section('2. Correzione: Performance di Crescita (Operations)', AMBER);

bullet('Problema rilevato');
sub('La sezione "Performance di crescita" mostrava sempre 0.0% totale e 0.00% al giorno.');
sub('Causa: il campo average_weight era rimasto invariato (stale) anche dopo aggiornamenti di animalsPerKg.');
doc.moveDown(0.2);

bullet('Correzione applicata');
sub('Sostituito averageWeight (obsoleto) con calcolo diretto da animalsPerKg.');
sub('Formula corretta applicata: peso_mg = 1.000.000 / animalsPerKg');
sub('Fix applicato in DUE punti: riepilogo del ciclo e dettaglio per singola operazione.');
doc.moveDown(0.2);

bullet('Risultato — Esempio Ciclo #194');
sub('Prima della correzione: Crescita totale 0.0%, giornaliera 0.00%');
sub('Dopo la correzione: Peso 0.23 mg -> 1.54 mg, Crescita +562%, circa 24% al giorno');
doc.moveDown(0.3);

// =========================================================
// 3. FIX DETTAGLIO CICLO
// =========================================================
section('3. Correzione: Pagina Dettaglio Ciclo (CycleDetail)', GREEN_D);

bullet('Problema rilevato');
sub('La pagina di dettaglio mostrava in piu punti il peso medio stale (0.23 mg per tutte le operazioni).');
doc.moveDown(0.2);

bullet('Quattro correzioni applicate');
sub('Card "Peso Medio" in alto: ora mostra il peso reale calcolato dall\'ultima operazione tramite animalsPerKg.');
sub('Sezione "Andamento della Crescita": Peso iniziale, Peso attuale, Crescita totale e giornaliera ora corretti.');
sub('Grafico di crescita: i punti ora riflettono i pesi reali (curva non piu piatta).');
sub('Tabella Cronologia Operazioni, colonna "Peso Medio (mg)": ogni riga mostra il valore corretto per quella operazione.');
doc.moveDown(0.2);

bullet('Risultato visivo');
sub('Ciclo #194: tabella mostra 0.23 mg (Prima Attivazione) e 1.54 mg (Misura) invece di 0.23 per entrambe.');
sub('Il grafico mostra una curva di crescita reale invece di una linea piatta.');
doc.moveDown(0.3);

// =========================================================
// NOTA TECNICA
// =========================================================
section('Nota Tecnica — Root Cause', PURPLE);

bullet('Perche average_weight era stale?');
sub(
  'Il campo average_weight viene scritto al momento dell\'inserimento e non sempre ricalcolato ' +
  'quando animalsPerKg viene aggiornato successivamente.'
);
sub(
  'Soluzione permanente: derivare sempre il peso dalla formula 1.000.000 / animalsPerKg, ' +
  'che e sempre aggiornata e coerente.'
);
sub('animalsPerKg e il valore primario e canonico; average_weight va considerato non affidabile per i calcoli SGR.');
doc.moveDown(0.3);

// =========================================================
// FILE MODIFICATI
// =========================================================
section('File Modificati', DARK);

const files = [
  ['client/src/pages/SgrLineage.tsx', 'NUOVO — pagina SGR per Lotto con calcoli lineage'],
  ['client/src/layouts/MainLayout.tsx', 'MODIFICA — aggiunta voce menu "SGR per Lotto"'],
  ['client/src/pages/MenuSettings.tsx', 'MODIFICA — aggiunta voce menu nelle impostazioni'],
  ['server/modules/operations/cycles/cycles.service.ts', 'MODIFICA — aggiunti parentCycleId e lineageGroupId alla query'],
  ['client/src/pages/Operations.tsx', 'MODIFICA — fix calcolo peso in 2 punti (Performance di crescita)'],
  ['client/src/pages/CycleDetail.tsx', 'MODIFICA — fix peso medio in 4 punti (card, crescita, grafico, tabella)'],
];

files.forEach(([file, desc]) => {
  const y = doc.y;
  doc.fillColor(PRIMARY).fontSize(9).font('Helvetica-Bold')
     .text(file, 54, y, { width: doc.page.width - 104 });
  doc.fillColor(GRAY).fontSize(9).font('Helvetica')
     .text(desc, 54, { width: doc.page.width - 104 });
  doc.moveDown(0.45);
});

// =========================================================
// FOOTER
// =========================================================
doc.moveDown(1.5);
const footerY = doc.page.height - 45;
doc.rect(0, footerY - 10, doc.page.width, 55).fill('#f9fafb');
doc.fillColor(GRAY).fontSize(8.5).font('Helvetica')
   .text(
     'FLUPSY Management System — Riepilogo tecnico generato il 19/03/2026 — Uso interno',
     50, footerY,
     { align: 'center', width: doc.page.width - 100 }
   );

doc.end();
out.on('finish', () => console.log('PDF creato con successo'));
out.on('error', (e) => console.error('Errore:', e));
