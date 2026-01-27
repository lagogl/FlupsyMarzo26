import PDFDocument from 'pdfkit';
import fs from 'fs';

const doc = new PDFDocument({ 
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 }
});

const outputPath = 'public/downloads/proposta-gestione-mortalita.pdf';

if (!fs.existsSync('public/downloads')) {
  fs.mkdirSync('public/downloads', { recursive: true });
}

doc.pipe(fs.createWriteStream(outputPath));

const colors = {
  primary: '#1e40af',
  secondary: '#059669',
  accent: '#dc2626',
  warning: '#f59e0b',
  lightBlue: '#dbeafe',
  lightGreen: '#d1fae5',
  lightRed: '#fee2e2',
  lightYellow: '#fef3c7',
  gray: '#6b7280',
  darkGray: '#374151'
};

doc.rect(0, 0, 595, 120).fill(colors.primary);

doc.fillColor('white')
   .fontSize(28)
   .font('Helvetica-Bold')
   .text('FLUPSY Management System', 50, 40, { align: 'center' });

doc.fontSize(18)
   .font('Helvetica')
   .text('Proposta: Gestione Avanzata della Mortalità', 50, 75, { align: 'center' });

doc.fillColor(colors.darkGray)
   .fontSize(10)
   .text('Documento tecnico per la discussione operativa', 50, 100, { align: 'center' });

doc.moveDown(4);

doc.rect(50, 140, 495, 80).fill(colors.lightRed);
doc.fillColor(colors.accent)
   .fontSize(16)
   .font('Helvetica-Bold')
   .text('IL PROBLEMA ATTUALE', 60, 150);

doc.fillColor(colors.darkGray)
   .fontSize(11)
   .font('Helvetica')
   .text('1. Mortalità non distinguibile: Non è possibile sapere se i morti trovati sono "nuovi" o gli stessi dell\'ultima misurazione', 60, 175, { width: 475 });

doc.text('2. Peso contaminato: Il peso totale della cesta include ancora gli animali morti, causando un calcolo errato della taglia', 60, 195, { width: 475 });

doc.rect(50, 240, 495, 180).fill(colors.lightGreen);
doc.fillColor(colors.secondary)
   .fontSize(16)
   .font('Helvetica-Bold')
   .text('LA SOLUZIONE PROPOSTA', 60, 250);

doc.fillColor(colors.darkGray)
   .fontSize(11)
   .font('Helvetica')
   .text('Aggiungere due semplici domande durante l\'inserimento dell\'operazione:', 60, 275, { width: 475 });

doc.rect(70, 300, 465, 50).fill('white').stroke(colors.secondary);
doc.fillColor(colors.secondary)
   .fontSize(12)
   .font('Helvetica-Bold')
   .text('DOMANDA 1: "I morti sono stati rimossi dalla cesta?"', 80, 310);
doc.fillColor(colors.darkGray)
   .fontSize(10)
   .font('Helvetica')
   .text('Sì = Il peso totale riflette solo gli animali vivi | No = Il sistema sottrae il peso stimato dei morti', 80, 330, { width: 445 });

doc.rect(70, 360, 465, 50).fill('white').stroke(colors.secondary);
doc.fillColor(colors.secondary)
   .fontSize(12)
   .font('Helvetica-Bold')
   .text('DOMANDA 2: "Questa mortalità è nuova o già conteggiata?"', 80, 370);
doc.fillColor(colors.darkGray)
   .fontSize(10)
   .font('Helvetica')
   .text('Nuova = Aggiungi al conteggio cumulativo | Già conteggiata = Non sommare di nuovo', 80, 390, { width: 445 });

doc.rect(50, 440, 495, 100).fill(colors.lightBlue);
doc.fillColor(colors.primary)
   .fontSize(16)
   .font('Helvetica-Bold')
   .text('CALCOLO AUTOMATICO CORRETTO', 60, 450);

doc.fillColor(colors.darkGray)
   .fontSize(11)
   .font('Helvetica')
   .text('Il sistema calcolerà automaticamente la taglia corretta:', 60, 475);

doc.rect(70, 495, 465, 35).fill('white').stroke(colors.primary);
doc.fillColor(colors.primary)
   .fontSize(10)
   .font('Helvetica-Bold')
   .text('Se morti NON rimossi:', 80, 502);
doc.fillColor(colors.darkGray)
   .font('Helvetica')
   .text('Peso effettivo = Peso totale - (N° morti × Peso medio singolo)', 200, 502);
doc.text('Taglia = Animali vivi ÷ Peso effettivo', 200, 515);

doc.addPage();

doc.rect(0, 0, 595, 60).fill(colors.primary);
doc.fillColor('white')
   .fontSize(20)
   .font('Helvetica-Bold')
   .text('Flusso Operativo Proposto', 50, 20, { align: 'center' });

const steps = [
  { num: '1', title: 'Prelievo Campione', desc: 'L\'operatore preleva un campione dalla cesta', color: colors.lightBlue, borderColor: colors.primary },
  { num: '2', title: 'Pesatura e Conteggio', desc: 'Pesa il campione e conta gli animali vivi e morti', color: colors.lightBlue, borderColor: colors.primary },
  { num: '3', title: 'Domanda Rimozione', desc: 'Il sistema chiede: "I morti sono stati rimossi dalla cesta?"', color: colors.lightYellow, borderColor: colors.warning },
  { num: '4', title: 'Domanda Nuova Mortalità', desc: 'Il sistema chiede: "Questa mortalità è nuova o già conteggiata?"', color: colors.lightYellow, borderColor: colors.warning },
  { num: '5', title: 'Calcolo Automatico', desc: 'Il sistema calcola automaticamente taglia e animali corretti', color: colors.lightGreen, borderColor: colors.secondary },
  { num: '6', title: 'Conferma e Salvataggio', desc: 'L\'operatore verifica i dati e conferma il salvataggio', color: colors.lightGreen, borderColor: colors.secondary }
];

let yPos = 90;
steps.forEach((step, index) => {
  doc.rect(50, yPos, 495, 55).fill(step.color).stroke(step.borderColor);
  
  doc.circle(80, yPos + 27, 18).fill(step.borderColor);
  doc.fillColor('white')
     .fontSize(16)
     .font('Helvetica-Bold')
     .text(step.num, 72, yPos + 19);
  
  doc.fillColor(step.borderColor)
     .fontSize(14)
     .font('Helvetica-Bold')
     .text(step.title, 110, yPos + 12);
  
  doc.fillColor(colors.darkGray)
     .fontSize(11)
     .font('Helvetica')
     .text(step.desc, 110, yPos + 32, { width: 420 });
  
  yPos += 65;
});

doc.rect(50, yPos + 20, 495, 120).fill(colors.lightGreen);
doc.fillColor(colors.secondary)
   .fontSize(16)
   .font('Helvetica-Bold')
   .text('VANTAGGI DELLA SOLUZIONE', 60, yPos + 30);

const benefits = [
  '✓ Tracciabilità completa: Saprai sempre se la mortalità è nuova o già registrata',
  '✓ Calcolo taglia preciso: Il peso viene corretto automaticamente se i morti non sono rimossi',
  '✓ Inserimento agile: Solo 2 checkbox aggiuntive, nessuna complicazione',
  '✓ Storico accurato: Dati affidabili per analisi e previsioni',
  '✓ Riduzione errori: Meno calcoli manuali = meno errori umani'
];

yPos += 55;
benefits.forEach((benefit) => {
  doc.fillColor(colors.darkGray)
     .fontSize(11)
     .font('Helvetica')
     .text(benefit, 70, yPos, { width: 460 });
  yPos += 18;
});

doc.rect(50, 580, 495, 80).fill(colors.lightYellow);
doc.fillColor(colors.warning)
   .fontSize(14)
   .font('Helvetica-Bold')
   .text('PROSSIMI PASSI', 60, 590);

doc.fillColor(colors.darkGray)
   .fontSize(11)
   .font('Helvetica')
   .text('1. Discussione con il team operativo per raccogliere feedback', 70, 615);
doc.text('2. Approvazione del flusso proposto', 70, 632);
doc.text('3. Implementazione nel sistema FLUPSY Management', 70, 649);

doc.rect(0, 750, 595, 50).fill(colors.primary);
doc.fillColor('white')
   .fontSize(9)
   .font('Helvetica')
   .text('FLUPSY Management System - Documento generato automaticamente', 50, 765, { align: 'center' });
doc.text(`Data: ${new Date().toLocaleDateString('it-IT')}`, 50, 778, { align: 'center' });

doc.end();

console.log(`PDF generato con successo: ${outputPath}`);
