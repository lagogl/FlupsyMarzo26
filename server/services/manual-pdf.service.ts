/**
 * Generatore PDF del Manuale FLUPSY (IT/EN).
 * Sorgente unica: shared/manual-content.ts
 */
import PDFDocument from "pdfkit";
import { MANUAL, MANUAL as MAN, Lang, ManualBlock, ManualChapter, getChapter } from "../../shared/manual-content";

interface GenOptions {
  lang: Lang;
  chapterId?: string;
  title?: string;
  subtitle?: string;
}

const COLORS = {
  primary: "#1e3a5f",
  accent: "#0ea5e9",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  textMuted: "#6b7280",
  bg: "#f3f4f6",
  border: "#d1d5db",
};

const T = {
  cover: { it: "Manuale FLUPSY Manager", en: "FLUPSY Manager Manual" },
  cover_sub: {
    it: "Guida operativa completa per gli operatori",
    en: "Complete operational guide for operators",
  },
  toc: { it: "Indice", en: "Table of Contents" },
  page: { it: "Pagina", en: "Page" },
  gen_on: { it: "Generato il", en: "Generated on" },
  ver: { it: "Versione", en: "Version" },
  note: { it: "NOTA", en: "NOTE" },
  warn: { it: "ATTENZIONE", en: "WARNING" },
  tip: { it: "SUGGERIMENTO", en: "TIP" },
};

export async function generateManualPDF(opts: GenOptions): Promise<Buffer> {
  const lang: Lang = opts.lang === "en" ? "en" : "it";
  const chapters: ManualChapter[] = opts.chapterId
    ? [getChapter(opts.chapterId)].filter(Boolean) as ManualChapter[]
    : MAN;

  if (chapters.length === 0) {
    throw new Error(`Capitolo non trovato: ${opts.chapterId}`);
  }

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 60, bottom: 60, left: 55, right: 55 },
      info: {
        Title: opts.title || T.cover[lang],
        Author: "Delta Futuro / MITO SRL",
        Subject: opts.title || T.cover_sub[lang],
      },
      bufferPages: true,
    });

    const buffers: Buffer[] = [];
    doc.on("data", (b) => buffers.push(b));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const contentW = pageW - 110;

    // ===== COVER =====
    doc.rect(0, 0, pageW, pageH).fill(COLORS.primary);
    doc.fillColor("white");
    doc.font("Helvetica-Bold").fontSize(34).text(opts.title || T.cover[lang], 55, 220, { width: contentW, align: "center" });
    doc.font("Helvetica").fontSize(16).fillColor("#cbd5e1").text(opts.subtitle || T.cover_sub[lang], 55, 280, { width: contentW, align: "center" });
    doc.fillColor("white").fontSize(11);
    const today = new Date().toLocaleDateString(lang === "it" ? "it-IT" : "en-GB");
    doc.text(`${T.gen_on[lang]}: ${today}`, 55, pageH - 110, { width: contentW, align: "center" });
    doc.fontSize(9).fillColor("#94a3b8").text("MITO SRL · Delta Futuro · FLUPSY Manager", 55, pageH - 90, { width: contentW, align: "center" });

    // ===== TOC =====
    if (chapters.length > 1) {
      doc.addPage();
      doc.fillColor(COLORS.primary).font("Helvetica-Bold").fontSize(22).text(T.toc[lang], 55, 60);
      doc.moveTo(55, 95).lineTo(pageW - 55, 95).strokeColor(COLORS.accent).lineWidth(2).stroke();
      doc.moveDown(2);
      doc.fillColor("#000").font("Helvetica").fontSize(12);
      chapters.forEach((ch, i) => {
        doc.font("Helvetica-Bold").fillColor(COLORS.primary).text(`${i + 1}. ${ch.title[lang]}`, { continued: false });
        if (ch.sections.length > 0) {
          doc.font("Helvetica").fillColor("#374151").fontSize(10);
          ch.sections.forEach((s, j) => {
            doc.text(`    ${i + 1}.${j + 1}  ${s.title[lang]}`);
          });
          doc.fontSize(12);
        }
        doc.moveDown(0.5);
      });
    }

    // ===== CHAPTERS =====
    chapters.forEach((ch, ci) => {
      doc.addPage();
      // Chapter header
      doc.rect(0, 0, pageW, 80).fill(COLORS.primary);
      doc.fillColor("white").font("Helvetica-Bold").fontSize(11).text(`${lang === "it" ? "CAPITOLO" : "CHAPTER"} ${ci + 1}`, 55, 25);
      doc.fontSize(20).text(ch.title[lang], 55, 42, { width: contentW });
      doc.fillColor("#000").font("Helvetica").fontSize(11);
      doc.y = 100;

      if (ch.intro) {
        renderIntro(doc, ch.intro[lang]);
      }

      ch.sections.forEach((sec, si) => {
        ensureSpace(doc, 80);
        doc.moveDown(0.6);
        doc.fillColor(COLORS.primary).font("Helvetica-Bold").fontSize(14).text(`${ci + 1}.${si + 1}  ${sec.title[lang]}`, { width: contentW });
        doc.moveTo(doc.x, doc.y + 2).lineTo(doc.x + contentW, doc.y + 2).strokeColor(COLORS.accent).lineWidth(1).stroke();
        doc.moveDown(0.6);
        doc.fillColor("#111").font("Helvetica").fontSize(10.5);

        sec.blocks.forEach((b) => renderBlock(doc, b, lang, contentW));
      });
    });

    // ===== FOOTER on every page =====
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      if (i === 0) continue; // skip cover
      const w = doc.page.width;
      const h = doc.page.height;
      doc.fillColor(COLORS.textMuted).font("Helvetica").fontSize(8);
      doc.text(`${T.cover[lang]} · ${T.ver[lang]} ${today}`, 55, h - 40, { width: w - 110, align: "left", lineBreak: false });
      doc.text(`${T.page[lang]} ${i + 1} / ${range.count}`, 55, h - 40, { width: w - 110, align: "right", lineBreak: false });
    }

    doc.end();
  });
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  if (doc.y + needed > doc.page.height - 80) {
    doc.addPage();
  }
}

function renderIntro(doc: PDFKit.PDFDocument, text: string) {
  const startY = doc.y;
  const contentW = doc.page.width - 110;
  // estimate height
  const h = doc.heightOfString(text, { width: contentW - 24 }) + 18;
  doc.rect(55, startY, contentW, h).fillAndStroke("#eff6ff", COLORS.accent);
  doc.fillColor(COLORS.primary).font("Helvetica-Oblique").fontSize(10.5).text(text, 67, startY + 9, { width: contentW - 24 });
  doc.fillColor("#000").font("Helvetica");
  doc.moveDown(0.8);
}

function renderBlock(doc: PDFKit.PDFDocument, b: ManualBlock, lang: Lang, contentW: number) {
  ensureSpace(doc, 60);
  switch (b.type) {
    case "h3":
      doc.moveDown(0.4);
      doc.fillColor(COLORS.primary).font("Helvetica-Bold").fontSize(12).text(b.text![lang], { width: contentW });
      doc.fillColor("#111").font("Helvetica").fontSize(10.5);
      doc.moveDown(0.2);
      break;
    case "p":
      doc.fillColor("#111").font("Helvetica").fontSize(10.5).text(b.text![lang], { width: contentW, align: "justify" });
      doc.moveDown(0.4);
      break;
    case "ul":
      b.items!.forEach((it) => {
        ensureSpace(doc, 30);
        const y0 = doc.y;
        doc.fillColor(COLORS.accent).text("•", 60, y0, { lineBreak: false, width: 12 });
        doc.fillColor("#111").text(it[lang], 75, y0, { width: contentW - 20 });
        doc.moveDown(0.15);
      });
      doc.moveDown(0.3);
      break;
    case "ol":
      b.items!.forEach((it, idx) => {
        ensureSpace(doc, 30);
        const y0 = doc.y;
        doc.fillColor(COLORS.accent).font("Helvetica-Bold").text(`${idx + 1}.`, 60, y0, { lineBreak: false, width: 20 });
        doc.fillColor("#111").font("Helvetica").text(it[lang], 80, y0, { width: contentW - 25 });
        doc.moveDown(0.15);
      });
      doc.moveDown(0.3);
      break;
    case "note":
      renderCallout(doc, T.note[lang], b.text![lang], "#eff6ff", COLORS.accent, contentW);
      break;
    case "warning":
      renderCallout(doc, T.warn[lang], b.text![lang], "#fef3c7", COLORS.warning, contentW);
      break;
    case "tip":
      renderCallout(doc, T.tip[lang], b.text![lang], "#ecfdf5", COLORS.success, contentW);
      break;
    case "code":
      renderCode(doc, b.text![lang], contentW);
      break;
    case "kvtable":
      renderKvTable(doc, b.rows!, lang, contentW);
      break;
  }
}

function renderCallout(doc: PDFKit.PDFDocument, label: string, text: string, bg: string, border: string, contentW: number) {
  ensureSpace(doc, 50);
  const startY = doc.y;
  const textH = doc.heightOfString(text, { width: contentW - 24 });
  const h = textH + 28;
  ensureSpace(doc, h + 8);
  doc.rect(55, startY, contentW, h).fillAndStroke(bg, border);
  doc.fillColor(border).font("Helvetica-Bold").fontSize(9).text(label, 65, startY + 8, { width: contentW - 20 });
  doc.fillColor("#111").font("Helvetica").fontSize(10.5).text(text, 65, startY + 22, { width: contentW - 24 });
  doc.y = startY + h + 6;
  doc.x = 55;
}

function renderCode(doc: PDFKit.PDFDocument, code: string, contentW: number) {
  ensureSpace(doc, 60);
  const startY = doc.y;
  const textH = doc.heightOfString(code, { width: contentW - 20, font: "Courier", size: 9 });
  const h = textH + 16;
  ensureSpace(doc, h + 8);
  doc.rect(55, startY, contentW, h).fillAndStroke("#0f172a", "#0f172a");
  doc.fillColor("#e2e8f0").font("Courier").fontSize(9).text(code, 65, startY + 8, { width: contentW - 20 });
  doc.fillColor("#000").font("Helvetica").fontSize(10.5);
  doc.y = startY + h + 6;
  doc.x = 55;
}

function renderKvTable(doc: PDFKit.PDFDocument, rows: NonNullable<ManualBlock["rows"]>, lang: Lang, contentW: number) {
  const kW = Math.round(contentW * 0.32);
  const vW = contentW - kW;
  rows.forEach((r) => {
    ensureSpace(doc, 50);
    const startY = doc.y;
    const kH = doc.heightOfString(r.k[lang], { width: kW - 12, font: "Helvetica-Bold", size: 9.5 });
    const vH = doc.heightOfString(r.v[lang], { width: vW - 12, font: "Helvetica", size: 9.5 });
    const h = Math.max(kH, vH) + 12;
    ensureSpace(doc, h + 4);
    // Cell key
    doc.rect(55, startY, kW, h).fillAndStroke(COLORS.bg, COLORS.border);
    doc.fillColor(COLORS.primary).font("Helvetica-Bold").fontSize(9.5).text(r.k[lang], 61, startY + 6, { width: kW - 12 });
    // Cell val
    doc.rect(55 + kW, startY, vW, h).fillAndStroke("#ffffff", COLORS.border);
    doc.fillColor("#111").font("Helvetica").fontSize(9.5).text(r.v[lang], 55 + kW + 6, startY + 6, { width: vW - 12 });
    doc.y = startY + h;
    doc.x = 55;
  });
  doc.fillColor("#000").font("Helvetica").fontSize(10.5);
  doc.moveDown(0.4);
}
