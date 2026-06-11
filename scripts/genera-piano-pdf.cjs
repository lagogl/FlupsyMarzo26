/* Genera il PDF del Piano Sopravvivenza usando pdfkit (no browser). */
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const OUT = path.join('exports', 'Piano_Sopravvivenza_FLUPSY.pdf');

// Palette
const INK = '#1f2937';      // testo
const TEAL = '#0e7490';     // titoli sezione
const TEALD = '#155e75';    // titolo principale
const AMBER = '#92400e';    // accenti
const MUTE = '#6b7280';     // testo secondario
const LINE = '#cbd5e1';     // linee
const BOXBG = '#ecfeff';    // sfondo box principio
const BOXBR = '#a5f3fc';    // bordo box

const doc = new PDFDocument({ size: 'A4', margins: { top: 56, bottom: 64, left: 56, right: 56 }, bufferPages: true });
doc.pipe(fs.createWriteStream(OUT));

const PAGE_W = doc.page.width;
const ML = doc.page.margins.left;
const MR = doc.page.margins.right;
const CONTENT_W = PAGE_W - ML - MR;
const BOTTOM = doc.page.height - doc.page.margins.bottom;

function ensure(space) {
  if (doc.y + space > BOTTOM) doc.addPage();
}

function h1(text) {
  ensure(40);
  doc.moveDown(0.2);
  doc.fillColor(TEALD).font('Helvetica-Bold').fontSize(15).text(text, ML, doc.y, { width: CONTENT_W });
  const y = doc.y + 3;
  doc.moveTo(ML, y).lineTo(ML + CONTENT_W, y).lineWidth(1).strokeColor(TEAL).stroke();
  doc.moveDown(0.6);
}

function h2(text) {
  ensure(34);
  doc.moveDown(0.3);
  doc.fillColor(TEAL).font('Helvetica-Bold').fontSize(12.5).text(text, ML, doc.y, { width: CONTENT_W });
  doc.moveDown(0.25);
}

function para(text, opts = {}) {
  ensure(24);
  doc.fillColor(opts.color || INK).font('Helvetica').fontSize(opts.size || 10.5)
    .text(text, ML, doc.y, { width: CONTENT_W, align: opts.align || 'left', lineGap: 2 });
  doc.moveDown(opts.gap != null ? opts.gap : 0.4);
}

// paragrafo con etichetta in grassetto: "Obiettivo: testo..."
function labeled(label, text) {
  ensure(26);
  doc.fillColor(INK).fontSize(10.5);
  doc.font('Helvetica-Bold').text(label + ' ', ML, doc.y, { continued: true, width: CONTENT_W, lineGap: 2 });
  doc.font('Helvetica').text(text, { width: CONTENT_W, lineGap: 2 });
  doc.moveDown(0.4);
}

function bullet(text, opts = {}) {
  ensure(22);
  const x = ML + 6;
  const tw = CONTENT_W - 18;
  const startY = doc.y;
  doc.fillColor(opts.color || TEAL).font('Helvetica-Bold').fontSize(10.5).text('•', x, startY, { width: 10 });
  doc.fillColor(INK).font('Helvetica').fontSize(10.5).text(text, x + 12, startY, { width: tw, lineGap: 2 });
  doc.moveDown(0.3);
}

function principleBox(lines) {
  const padding = 12;
  // misura altezza
  doc.font('Helvetica').fontSize(10.5);
  const innerW = CONTENT_W - padding * 2;
  let h = padding * 2;
  for (const l of lines) h += doc.heightOfString(l, { width: innerW, lineGap: 2 }) + 4;
  ensure(h + 8);
  const top = doc.y;
  doc.roundedRect(ML, top, CONTENT_W, h, 6).fillAndStroke(BOXBG, BOXBR);
  let yy = top + padding;
  for (const l of lines) {
    doc.fillColor(TEALD).font('Helvetica').fontSize(10.5).text(l, ML + padding, yy, { width: innerW, lineGap: 2 });
    yy = doc.y + 4;
  }
  doc.y = top + h;
  doc.moveDown(0.6);
}

// ---------- COPERTINA / TESTATA ----------
doc.fillColor(TEALD).font('Helvetica-Bold').fontSize(22)
  .text('Piano per il Monitoraggio Affidabile', ML, 70, { width: CONTENT_W });
doc.text('della Sopravvivenza', { width: CONTENT_W });
doc.moveDown(0.4);
doc.fillColor(MUTE).font('Helvetica').fontSize(12)
  .text('Dal singolo campione al cruscotto di impianto — FLUPSY, raceway e bins', { width: CONTENT_W });
doc.moveDown(0.3);
doc.fillColor(AMBER).font('Helvetica-Bold').fontSize(10.5)
  .text('Bozza per condivisione con i colleghi — da approvare prima dell\u2019implementazione', { width: CONTENT_W });
doc.moveDown(1.2);

// ---------- PRINCIPIO GUIDA ----------
h1('Principio guida');
principleBox([
  'La verit\u00e0 si misura sui VIVI, mai sui morti. La mortalit\u00e0 \u00e8 sempre una differenza tra due conteggi di vivi.',
  'Il campione si pesa sempre con i morti dentro: \u00e8 ci\u00f2 che rende i gusci innocui e impedisce di ricontarli.',
  'Il mescolamento non \u00e8 una perdita di dato: diventa un\u2019unit\u00e0 misurabile (coorte).',
  'Niente sparizioni: nessun animale pu\u00f2 uscire dai conti senza una destinazione dichiarata.',
]);

// ---------- IL PROBLEMA ----------
h1('Il problema (perch\u00e9 oggi i dati non sono affidabili)');
para('Con cicli che si aprono e chiudono in pochi giorni a causa delle vagliature, con un cestello origine suddiviso in pi\u00f9 cestelli destinazione, e con il mescolamento obbligatorio di lotti diversi, oggi non si riesce a capire con certezza quanti animali di ciascun lotto siano vivi o morti. Le cause precise sono quattro:');
bullet('Morti finte ("tracking perso"): quando un ciclo si chiude e gli animali non vengono collegati bene alla destinazione, il sistema li conta come morti per differenza. Sono vivi, ma risultano persi.');
bullet('Stima pro-quota nei lotti misti: quando un cestello con pi\u00f9 lotti viene vagliato, si assume che i lotti si dividano nelle stesse proporzioni. Ma la vagliatura separa per taglia, e lotti diversi si comportano diversamente: nasce un errore sistematico.');
bullet('Mortalit\u00e0 campionata diversa da quella reale: la mortalit\u00e0 delle misure giornaliere \u00e8 solo un campione; il conteggio vero avviene alla vagliatura. Mischiare i due tipi di dato genera numeri instabili.');
bullet('Rischio di sommare la mortalit\u00e0: i gusci morti restano fisicamente nei cestelli e vengono ricontati a ogni vagliatura successiva. Se la mortalit\u00e0 viene accumulata, gli stessi morti vengono contati pi\u00f9 volte.');

// ---------- LA SOLUZIONE IN SINTESI ----------
h1('La soluzione in sintesi');
bullet('Contare i VIVI, non i morti: la mortalit\u00e0 di un tratto = vivi all\u2019inizio meno vivi alla fine, registrata una sola volta.');
bullet('Campione pesato con i morti dentro: il conteggio dei vivi nasce dalla densit\u00e0 dei vivi, cos\u00ec i gusci che restano non vengono mai ricontati e non serve separarli meccanicamente.');
bullet('Mescolamento come coorte misurata: nell\u2019istante del mix si "fotografa" il conteggio dei vivi per lotto; da l\u00ec la coorte \u00e8 seguita come unit\u00e0 contata.');
bullet('Niente sparizioni: a ogni chiusura il bilancio deve quadrare, cos\u00ec il totale vivi/morti torna sempre.');

// ---------- LE FASI ----------
h1('Il piano, fase per fase');

h2('Fase 1 \u2014 Niente sparizioni');
labeled('Obiettivo:', 'eliminare le morti finte (animali vivi contati come persi).');
labeled('Cosa cambia:', 'a ogni chiusura ciclo compare un bilancio che deve quadrare \u2014 vivi iniziali = vivi usciti (vagliatura + trasferimento + vendita) + morti dichiarati. Le uscite possibili sono solo queste quattro. Decisioni confermate:');
bullet('Tolleranza \u00b11% (sotto, chiude senza disturbare).');
bullet('Se non quadra: avviso con scelta \u2014 correggere oppure registrare la differenza come mortalit\u00e0 con un clic.');
bullet('Se esce pi\u00f9 di quanto entra: segnala anomalia e chiedi ricontrollo, niente mortalit\u00e0 negativa.');
labeled('Cosa ottieni:', 'il totale vivi/morti torna sempre; sparisce il "tracking perso" che oggi gonfia la mortalit\u00e0. \u00c8 la fase con pi\u00f9 impatto e va per prima.');

h2('Fase 2 \u2014 Mortalit\u00e0 per differenza di vivi');
labeled('Obiettivo:', 'mai pi\u00f9 sommare la mortalit\u00e0, anche con vagliature consecutive e gusci che restano nei cestelli.');
labeled('Cosa cambia:', '');
bullet('La misura giornaliera resta solo un indicatore e non riduce in modo permanente il conteggio (regola "gusci che volano via").');
bullet('La vagliatura \u00e8 il punto di verit\u00e0: mortalit\u00e0 del tratto = vivi in ingresso meno vivi in uscita, registrata una sola volta; i conteggi destinazione diventano la nuova verit\u00e0 per il tratto successivo.');
bullet('Il campione si pesa con i morti: il conteggio dei vivi nasce dalla densit\u00e0 dei vivi, quindi i gusci non vengono mai ricontati. Non serve separarli meccanicamente.');
labeled('Cosa ottieni:', 'ogni morte pesa una volta sola; il rischio di doppio conteggio sparisce per costruzione. Fase 1 + Fase 2 insieme sono il salto di qualit\u00e0 pi\u00f9 grosso.');

h2('Fase 3 \u2014 Il mescolamento come coorte misurata');
labeled('Obiettivo:', 'rendere solido il mix, che resta obbligatorio per ragioni logistiche.');
labeled('Cosa cambia:', 'quando si mescolano lotti diversi, il sistema crea una coorte e congela la "foto" del conteggio (vivi per lotto in ingresso). Da l\u00ec la coorte \u00e8 seguita come unit\u00e0 contata a ogni vagliatura.');
labeled('Cosa ottieni:', 'la sopravvivenza della coorte \u00e8 verit\u00e0 contata; la storia di ogni lotto resta esatta fino al mix.');

h2('Fase 4 \u2014 Sopravvivenza per lotto, con affidabilit\u00e0');
labeled('Obiettivo:', 'dare il numero per singolo lotto in modo onesto.');
labeled('Cosa cambia:', 'sopravvivenza lotto = (parte esatta prima del mix) \u00d7 (sopravvivenza misurata della coorte dopo il mix), ripartita in proporzione alla popolazione; ogni numero con semaforo di affidabilit\u00e0 (alta = lotto a lungo puro; media/bassa = mescolato presto).');
labeled('Cosa ottieni:', 'un dato per lotto utilizzabile, sapendo sempre quanto \u00e8 solido.');

h2('Fase 5 \u2014 Cruscotto di impianto');
labeled('Obiettivo:', 'vedere in tempo reale la sopravvivenza di tutto l\u2019impianto, somma di tutti i moduli.');
labeled('5.0 \u2014 Etichetta di tipo modulo:', 'oggi FLUPSY, raceway e bins si riconoscono solo dal nome, cosa fragile. Si aggiunge una vera etichetta di tipo (FLUPSY / raceway / bins) su ogni installazione, cos\u00ec la scomposizione per tipo \u00e8 pulita e non dipende da come \u00e8 scritto il nome.');
labeled('5.1 \u2014 Il cruscotto:', '');
bullet('Numero grande in tempo reale: sopravvivenza ponderata sul vivo attuale.');
bullet('Grafico di tendenza: tasso a finestra mobile 30/90 giorni.');
bullet('Scomposizione per tipo modulo (FLUPSY / raceway / bins) e per singolo modulo.');
bullet('Ogni numero con semaforo certo/stimato (certo = contato all\u2019ultima vagliatura; stimato = dopo, dalle misure).');
labeled('Cosa ottieni:', 'a colpo d\u2019occhio come va l\u2019impianto, quale modulo rende meglio, dove si perde di pi\u00f9 \u2014 e quanto fidarsi di ogni numero.');

h2('Fase 6 \u2014 Verifica e taratura');
labeled('Obiettivo:', 'validare prima di usarlo per decisioni.');
labeled('Cosa cambia:', 'ricalcolo su alcuni lotti gi\u00e0 chiusi, controllo che i totali quadrino, taratura delle soglie.');
labeled('Cosa ottieni:', 'la certezza che i numeri reggono.');

// ---------- ORDINE CONSIGLIATO ----------
h1('Ordine consigliato e benefici progressivi');
bullet('Fase 1 + Fase 2: dati subito puliti \u2014 niente sparizioni, niente mortalit\u00e0 sommata.');
bullet('Fase 3 + Fase 4: lotti mescolati gestiti bene, con livello di affidabilit\u00e0.');
bullet('Fase 5 (con etichetta di tipo) + Fase 6: il cruscotto di impianto in tempo reale, solido e verificato.');
para('Tutto si appoggia a strumenti gi\u00e0 presenti (registro movimenti del lotto, composizione per lotto, Report Lotto, riconoscimento moduli): si rende solido l\u2019esistente, non si riparte da zero.', { color: MUTE });

// ---------- COSA NON CAMBIA ----------
h1('Cosa NON cambia per l\u2019operatore');
bullet('Le misure giornaliere si fanno come sempre.');
bullet('Non occorre separare meccanicamente i morti dai vivi tra le vagliature.');
bullet('L\u2019unica novit\u00e0 \u00e8 la schermata di bilancio alla chiusura: un controllo veloce, non lavoro in pi\u00f9.');

// ---------- FOOTER su tutte le pagine ----------
const range = doc.bufferedPageRange();
const footY = doc.page.height - 44;
for (let i = 0; i < range.count; i++) {
  doc.switchToPage(range.start + i);
  doc.moveTo(ML, footY - 6).lineTo(ML + CONTENT_W, footY - 6).lineWidth(0.5).strokeColor(LINE).stroke();
  doc.fillColor(MUTE).font('Helvetica').fontSize(8);
  doc.text('Piano Sopravvivenza FLUPSY \u2014 bozza riservata', ML, footY, { width: CONTENT_W / 2, align: 'left' });
  doc.text('Pagina ' + (i + 1) + ' di ' + range.count, ML + CONTENT_W / 2, footY, { width: CONTENT_W / 2, align: 'right' });
}

doc.end();
console.log('PDF generato:', OUT);
