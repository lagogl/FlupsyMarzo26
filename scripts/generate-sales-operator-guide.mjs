import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";

const output = path.resolve("exports/Guida_Gestione_Vendite_Avanzate.pdf");
fs.mkdirSync(path.dirname(output), { recursive: true });

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 48, right: 48, bottom: 10, left: 48 },
  bufferPages: true,
});
doc.pipe(fs.createWriteStream(output));

const C = {
  navy: "#083D56",
  teal: "#00A6A6",
  darkTeal: "#087D86",
  green: "#39A85A",
  orange: "#F0A128",
  red: "#D64545",
  text: "#173044",
  muted: "#6B7F8C",
  line: "#DCE7EB",
  paleTeal: "#E9F8F7",
  paleBlue: "#EAF4FB",
  paleGreen: "#EEF8E9",
  paleOrange: "#FFF5E8",
  paleRed: "#FEECEC",
};

const pageWidth = 595.28;
const pageHeight = 841.89;
let pageNo = 0;

function addPage(title, phase) {
  if (pageNo) doc.addPage();
  pageNo += 1;
  doc.rect(0, 0, pageWidth, 6).fill(C.teal);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(C.teal).text(phase.toUpperCase(), 48, 38, {
    characterSpacing: 1.4,
  });
  doc.font("Helvetica-Bold").fontSize(23).fillColor(C.navy).text(title, 48, 56);
  doc.moveTo(48, 775).lineTo(547, 775).strokeColor(C.line).stroke();
  doc.font("Helvetica").fontSize(8).fillColor(C.muted)
    .text("FLUPSY Ecotapes / Delta Futuro", 48, 785, { lineBreak: false })
    .text(`${pageNo}`, 520, 785, { width: 27, align: "right", lineBreak: false });
  return 104;
}

function roundedBox(x, y, w, h, fill, stroke = fill) {
  doc.roundedRect(x, y, w, h, 9).fillAndStroke(fill, stroke);
}

function card(x, y, w, h, title, body, fill = C.paleTeal) {
  roundedBox(x, y, w, h, fill, C.line);
  doc.font("Helvetica-Bold").fontSize(13).fillColor(C.darkTeal).text(title, x + 14, y + 13, { width: w - 28 });
  doc.font("Helvetica").fontSize(10.5).fillColor(C.text).text(body, x + 14, y + 35, {
    width: w - 28,
    lineGap: 2,
  });
}

function alert(y, title, body, accent, fill) {
  roundedBox(48, y, 499, 58, fill, fill);
  doc.rect(48, y, 5, 58).fill(accent);
  doc.font("Helvetica-Bold").fontSize(11.5).fillColor(accent).text(title, 65, y + 11, { width: 465 });
  doc.font("Helvetica").fontSize(10).fillColor(C.text).text(body, 65, y + 29, { width: 465, lineGap: 1.5 });
}

function step(y, n, title, body) {
  doc.circle(61, y + 10, 11).fill(C.teal);
  doc.font("Helvetica-Bold").fontSize(11).fillColor("white").text(String(n), 55, y + 4.2, {
    width: 12,
    align: "center",
  });
  doc.font("Helvetica-Bold").fontSize(11.5).fillColor(C.navy).text(title, 82, y);
  doc.font("Helvetica").fontSize(10).fillColor(C.text).text(body, 82, y + 17, { width: 455, lineGap: 1.5 });
}

function checklist(y, items) {
  items.forEach((item, index) => {
    const rowY = y + index * 31;
    doc.circle(59, rowY + 6, 7).fill(C.green);
    doc.font("Helvetica-Bold").fontSize(8).fillColor("white").text("✓", 54.5, rowY + 1.3, {
      width: 9,
      align: "center",
    });
    doc.font("Helvetica").fontSize(10.5).fillColor(C.text).text(item, 75, rowY, { width: 465 });
  });
}

// Copertina
doc.rect(0, 0, pageWidth, pageHeight).fill("#F5FAFB");
doc.rect(0, 0, pageWidth, 7).fill(C.teal);
const deltaLogo = path.resolve("attached_assets/logos/delta-futuro.png");
const ecotapesLogo = path.resolve("attached_assets/logos/ecotapes.png");
if (fs.existsSync(deltaLogo)) doc.image(deltaLogo, 48, 42, { fit: [100, 48] });
if (fs.existsSync(ecotapesLogo)) doc.image(ecotapesLogo, 158, 42, { fit: [100, 48] });
doc.font("Helvetica-Bold").fontSize(9).fillColor(C.teal).text("GUIDA RAPIDA OPERATORI", 355, 57, {
  width: 192,
  align: "right",
  characterSpacing: 1.2,
});
roundedBox(48, 144, 499, 245, C.navy, C.navy);
doc.font("Helvetica-Bold").fontSize(10).fillColor("#86EBDD").text("MODULO OPERATIVO", 75, 174, { characterSpacing: 1.4 });
doc.font("Helvetica-Bold").fontSize(32).fillColor("white").text("Gestione Vendite\nAvanzate", 75, 204, {
  width: 420,
  lineGap: 3,
});
doc.font("Helvetica").fontSize(14).fillColor("#DDF8F4").text(
  "Come selezionare le ceste, preparare i sacchi, confermare la vendita e generare correttamente i documenti.",
  75, 300, { width: 420, lineGap: 4 }
);
card(48, 425, 241, 95, "Da Vagliatura con Mappa", "Per vendite già predisposte tramite operazioni di vagliatura.", C.paleTeal);
card(306, 425, 241, 95, "Ceste selezionate manualmente", "Per vendere l’intero contenuto di una o più ceste attive.", C.paleBlue);
alert(555, "PRIMA REGOLA", "Controllare cliente, azienda, ceste, sacchi, animali e peso prima di confermare.", C.orange, C.paleOrange);
doc.font("Helvetica").fontSize(10).fillColor(C.muted).text(
  "Selezione multi-cesta  •  Tracciabilità  •  Sacchi e allocazioni  •  DDT e DDR",
  48, 660, { width: 499, align: "center" }
);
doc.moveTo(48, 775).lineTo(547, 775).strokeColor(C.line).stroke();
doc.font("Helvetica").fontSize(8).fillColor(C.muted)
  .text("Guida Gestione Vendite Avanzate", 48, 785, { lineBreak: false })
  .text("1", 520, 785, { width: 27, align: "right", lineBreak: false });
pageNo = 1;

// Pagina 2
addPage("Creare una nuova vendita", "Fase 1");
step(118, 1, "Apri il modulo", "Vai in Vendite → Gestione Vendite Avanzate → Nuova Vendita.");
step(177, 2, "Scegli l’origine", "Seleziona “Da Vagliatura con Mappa” oppure “Ceste selezionate manualmente”.");
step(236, 3, "Seleziona le ceste", "Nella modalità manuale usa “Filtra per FLUPSY”. Le ceste sono ordinate per numero: spunta quelle da vendere.");
step(306, 4, "Indica il cliente", "Sceglilo dall’anagrafica. Se non è presente, abilita l’inserimento manuale e compila i dati richiesti.");
step(376, 5, "Scegli l’azienda", "Controlla che l’emittente sia Delta Futuro oppure Ecotapes e verifica la data.");
step(435, 6, "Crea la vendita", "Aggiungi eventuali note e premi “Crea Vendita”.");
alert(504, "SELEZIONE PIÙ SEMPLICE", "Puoi cambiare filtro FLUPSY senza perdere le ceste già spuntate.", C.green, C.paleGreen);
card(48, 585, 499, 126, "Controllo immediato", "• Il numero delle ceste selezionate è corretto?\n• Il totale animali mostrato è plausibile?\n• Cliente e azienda emittente sono quelli giusti?", C.paleOrange);

// Pagina 3
addPage("Preparare sacchi e quantità", "Fase 2");
card(48, 118, 241, 91, "Configura i sacchi", "Indica numero, contenuto e quantità di ogni sacco previsto.", C.paleTeal);
card(306, 118, 241, 91, "Distribuisci le origini", "Assegna ai sacchi gli animali provenienti dalle ceste.", C.paleBlue);
card(48, 226, 241, 91, "Controlla i totali", "Verifica animali, peso complessivo e quantità residue.", C.paleGreen);
card(306, 226, 241, 91, "Spiega le differenze", "Perdite o eccedenze devono essere controllate e motivate.", C.paleOrange);
doc.font("Helvetica-Bold").fontSize(15).fillColor(C.navy).text("Prima della conferma", 48, 350);
checklist(382, [
  "Cliente e azienda emittente verificati",
  "Data della vendita corretta",
  "Ceste selezionate corrette",
  "Numero di sacchi corretto",
  "Animali e peso totale controllati",
  "Eventuali differenze dichiarate e motivate",
]);
alert(590, "ATTENZIONE", "Non confermare se quantità, peso o sacchi non coincidono. Correggi prima i dati.", C.red, C.paleRed);
alert(664, "DOPO LA CONFERMA", "Il sistema registra la vendita, aggiorna le ceste e conserva la provenienza degli animali.", C.green, C.paleGreen);

// Pagina 4
addPage("Generare i documenti", "Fase 3");
doc.font("Helvetica").fontSize(11).fillColor(C.text).text(
  "Dalla scheda Vendite puoi aprire i singoli documenti oppure generare il fascicolo completo con “Stampa documenti”.",
  48, 115, { width: 499, lineGap: 2 }
);
const documents = [
  ["1", "Rapporto di consegna", "Contiene il QR pubblico di tracciabilità"],
  ["2", "Dichiarazione di vendita e condizioni", ""],
  ["3", "DDR", "Solo per Delta Futuro"],
  ["4", "DDT", ""],
];
documents.forEach(([n, name, note], i) => {
  const y = 166 + i * 45;
  doc.circle(61, y + 7, 11).fill(C.paleTeal);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(C.teal).text(n, 55, y + 1, { width: 12, align: "center" });
  doc.font("Helvetica-Bold").fontSize(11).fillColor(C.navy).text(name, 82, y);
  if (note) doc.font("Helvetica").fontSize(9).fillColor(C.muted).text(note, 82, y + 17);
  doc.moveTo(82, y + 33).lineTo(547, y + 33).strokeColor(C.line).stroke();
});
card(48, 360, 241, 113, "Delta Futuro · 4 documenti", "Rapporto, dichiarazione, DDR e DDT. Il progressivo DDR annuale viene assegnato automaticamente.", C.paleTeal);
card(306, 360, 241, 113, "Ecotapes · 3 documenti", "Rapporto, dichiarazione e DDT. Non viene generato il DDR interno.", C.paleOrange);
alert(500, "ATTENZIONE: PARTE UNA VERA EMAIL", "“Stampa documenti” genera il fascicolo, invia il riepilogo ai responsabili e allega i PDF.", C.orange, C.paleOrange);
alert(574, "DOCUMENTI SINGOLI", "Aprire o stampare un documento singolo dal menu non invia l’email automatica.", C.green, C.paleGreen);
card(48, 654, 499, 100, "Numerazioni automatiche", "DDT: deriva dalla numerazione presente in Fatture in Cloud per azienda e anno.\nDDR: il progressivo annuale Delta Futuro viene incrementato automaticamente.", C.paleBlue);

// Pagina 5
addPage("Storno, ristampe e controlli finali", "Da ricordare");
card(48, 118, 499, 104, "Storno di una vendita", "Una vendita confermata può essere stornata indicando obbligatoriamente il motivo. Il sistema ripristina quantità e stato delle ceste, mantenendo la registrazione storica.", C.paleOrange);
alert(244, "DIVIETO DI STORNO", "Non è possibile stornare una vendita dopo l’emissione del DDT. Rivolgersi al responsabile amministrativo.", C.red, C.paleRed);
doc.font("Helvetica-Bold").fontSize(15).fillColor(C.navy).text("Regole operative", 48, 333);
checklist(369, [
  "Non creare una nuova vendita per ristampare un documento.",
  "Usa sempre la vendita esistente per le ristampe.",
  "Non modificare manualmente numeri DDT o DDR già assegnati.",
  "Non usare “Stampa documenti” per fare una prova: parte l’email reale.",
  "Se l’email fallisce, non considerare completato il fascicolo.",
  "Se compare un errore, non premere conferma ripetutamente.",
]);
roundedBox(48, 585, 499, 88, C.navy, C.navy);
doc.font("Helvetica-Bold").fontSize(17).fillColor("white").text("Sequenza corretta", 68, 607, { width: 459, align: "center" });
doc.font("Helvetica").fontSize(11).fillColor("#DDF8F4").text(
  "Seleziona  >  controlla  >  configura i sacchi  >  conferma  >  genera i documenti",
  68, 638, { width: 459, align: "center" }
);
doc.font("Helvetica").fontSize(10).fillColor(C.muted).text(
  "In caso di dubbio, fermarsi prima della conferma e chiedere al responsabile.",
  48, 712, { width: 499, align: "center" }
);

doc.end();
console.log(output);