import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createServer } from "vite";
import puppeteer from "puppeteer";
import chromium from "@sparticuz/chromium";
import ExcelJS from "exceljs";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import { apiFixtures } from "./fixtures/growth-projection.mjs";

// Independent expectations, not calculated with production presentation helpers.
const labels = {
  it: {
    summary: "Disponibilità, ordini e arretrati", month: "Seleziona mese",
    columns: "Mesi in colonne", rows: "Mesi in righe", copy: "Copia",
    assignedTarget: "Assegnati da taglia target o superiore",
    assignedLower: "Assegnati da taglie inferiori al target",
    assignedTotal: "Totale assegnato · correnti e arretrati",
    shortfall: "Scoperto target mensile · TP-3000",
    recovery: "Recupero scoperto mensile · TP-3000",
    tooLate: "Il deficit della taglia target non può maturare in tempo:",
    arrival: "Ingresso TP-300 suggerito · mese di arrivo · TP-3000",
    budget: "Obiettivo vendite T3 (Forecast)", forecast: "T3 destinato al Forecast vendite TP-3000",
    forecastGap: "Forecast non coperto", bio: "Disponibilità biologica esclusiva a fine mese",
    backlog: "Arretrati precedenti · TP-4000",
    backlogValue: "entrati 1.200 · recuperati 1.200 · ancora aperti 0",
    monthly: "Capacità ordini a fine mese (non promessa di consegna) — Totale (coperti / richiesti / scoperti)",
    monthlyValue: "7.500 coperti / 10.000 richiesti / 2.500 scoperti",
    perSize: "Capacità ordini a fine mese — Taglia (coperti / richiesti / scoperti) TP-4000",
    perSizeValue: "0 coperti / 0 richiesti / 0 scoperti",
    deadline: "Copertura alla data di consegna — Totale",
    deadlineValue: "40.0% · 4.000 coperti / 10.000 con scadenza / 6.000 scoperti · 600 arretrati evasi dopo la scadenza · 200 non verificabili",
    unavailable: "Ricalcolare per leggere la copertura degli ordini correnti",
    alternative: "Scenario Forecast alternativo · non sommare con lo scenario ordini",
    visibility: "Visibilità righe", restore: "Ripristina tutte",
  },
  en: {
    summary: "Availability, orders & backlog", month: "Select month",
    columns: "Months in columns", rows: "Months in rows", copy: "Copy",
    assignedTarget: "Assigned from target size or larger",
    assignedLower: "Assigned from sizes below target",
    assignedTotal: "Total assigned · current and arrears",
    shortfall: "Monthly target-size uncovered demand · TP-3000",
    recovery: "Monthly target-size recovery status · TP-3000",
    tooLate: "The target-size deficit cannot mature in time:",
    arrival: "Suggested TP-300 entry · arrival month · TP-3000",
    budget: "T3 sales target (Forecast)", forecast: "T3 assigned to Forecast sales TP-3000",
    forecastGap: "Uncovered Forecast", bio: "Exclusive end-month biological availability",
    backlog: "Prior arrears · TP-4000",
    backlogValue: "entering 1.200 · recovered 1.200 · still open 0",
    monthly: "End-of-month order capacity (not a delivery promise) — Total (covered / requested / uncovered)",
    monthlyValue: "7.500 covered / 10.000 requested / 2.500 uncovered",
    perSize: "End-of-month order capacity — Size (covered / requested / uncovered) TP-4000",
    perSizeValue: "0 covered / 0 requested / 0 uncovered",
    deadline: "Coverage on delivery date — Total",
    deadlineValue: "40.0% · 4.000 covered / 10.000 with deadline / 6.000 uncovered · 600 arrears fulfilled after deadline · 200 unverifiable",
    unavailable: "Recalculate to read current-order coverage",
    alternative: "Alternative Forecast scenario · do not add to order scenario",
    visibility: "Row visibility", restore: "Restore all",
  },
};

async function clickText(page, text) {
  const button = await page.evaluateHandle(text => [...document.querySelectorAll("button")]
    .find(button => button.textContent.trim() === text), text);
  assert.ok(await button.asElement(), `Button not found: ${text}`);
  await button.asElement().click();
  await button.dispose();
}

function copyRows(text) {
  return text.split("\n").filter(line => line.includes("\t")).slice(1)
    .map(line => line.split("\t"));
}

const planningTable = "table[style*='Calibri']";

async function tableAxes(page, orientation) {
  return page.$eval(planningTable, (table, orientation) => {
    const columns = [...table.querySelectorAll("thead th")].slice(1).map(cell => cell.innerText.trim());
    const rows = [...table.querySelectorAll("tbody tr")].map(row => row.children[0].innerText.trim());
    return orientation === "columns" ? { indicators: rows, months: columns } : { indicators: columns, months: rows };
  }, orientation);
}

async function clickTable(page, row, col, modifier) {
  const selector = row === -1
    ? `${planningTable} thead th:nth-child(${col + 2})`
    : `${planningTable} tbody tr:nth-child(${row + 1}) > td:nth-child(${col + 2})`;
  const element = await page.$(selector);
  assert.ok(element, `Missing table cell/header ${row},${col}`);
  // Real mouse/keyboard input, including horizontally off-screen indicator columns.
  await element.evaluate(el => el.scrollIntoView({ block: "center", inline: "center" }));
  if (modifier) await page.keyboard.down(modifier);
  try {
    await element.click();
  } finally {
    if (modifier) await page.keyboard.up(modifier);
    await element.dispose();
  }
}

async function selectedCount(page) {
  return page.$$eval(`${planningTable} td.bg-blue-50`, cells => cells.length);
}

async function assertKeyboardCopy(page, expected, context, modifier = "Control") {
  const sentinel = "clipboard must change only when a selection is copied";
  await page.evaluate(text => navigator.clipboard.writeText(text), sentinel);
  await page.keyboard.down(modifier);
  try {
    await page.keyboard.press("c");
  } finally {
    await page.keyboard.up(modifier);
  }
  if (expected !== null) {
    await page.waitForFunction(async sentinel => (await navigator.clipboard.readText()) !== sentinel, {}, sentinel);
  } else {
    // No-selection path must leave the clipboard untouched, not copy stale cells.
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), expected ?? sentinel, context);
}

async function checkSelections(page, l, lang, copiedRows) {
  const oracle = new Map(copiedRows.map(row => [row[0].trim(), row.slice(1)]));
  for (const hidden of [false, true]) {
    if (hidden) {
      // Remove an indicator between the two range endpoints; visible indices must
      // not accidentally look up the old, unfiltered indicator list.
      const trigger = await page.evaluateHandle(label => [...document.querySelectorAll("button")]
        .find(button => button.textContent.trim().startsWith(label)), l.visibility);
      await trigger.asElement().click();
      await trigger.dispose();
      const checkbox = await page.evaluateHandle(label => [...document.querySelectorAll("label")]
        .find(el => el.textContent.trim() === label)?.querySelector('[role="checkbox"]'), l.assignedLower);
      assert.ok(checkbox.asElement(), `Visibility checkbox missing: ${l.assignedLower}`);
      await checkbox.asElement().click();
      await checkbox.dispose();
      await page.keyboard.press("Escape");
    }
    for (const orientation of ["columns", "rows"]) {
      await clickText(page, l[orientation]);
      const axes = await tableAxes(page, orientation);
      assert.equal(axes.indicators.includes(l.assignedLower), !hidden);
      assert.equal(axes.months.length, 2);
      // The spreadsheet keeps the API's civil month labels in either UI language.
      assert.deepEqual(axes.months, ["Ott 2026", "Nov 2026"]);
      const matrix = orientation === "columns"
        ? axes.indicators.map(label => {
          assert.ok(oracle.has(label), `No independently checked export row for ${label}`);
          return oracle.get(label);
        })
        : axes.months.map((_, month) => axes.indicators.map(label => {
          assert.ok(oracle.has(label), `No independently checked export row for ${label}`);
          return oracle.get(label)[month];
        }));
      const cell = (indicator, month) => orientation === "columns"
        ? [axes.indicators.indexOf(indicator), month] : [month, axes.indicators.indexOf(indicator)];
      const context = `${lang}/${orientation}/${hidden ? "hidden" : "all"}`;
      for (const kind of ["single", "range", "row", "column"]) {
        if (kind === "single") {
          // Distinguish zero, unavailable, numeric and textual data; display "-"
          // and thousands separators must not leak into the raw clipboard value.
          for (const [label, month, value] of [
            [l.assignedTarget, 0, "9000"], [l.assignedTarget, 1, l.unavailable],
            [l.arrival, 0, "0"], [l.recovery, 0, l.tooLate],
          ]) {
            await clickTable(page, ...cell(label, month));
            assert.equal(await selectedCount(page), 1, `${context}/single highlight`);
            await assertKeyboardCopy(page, value, `${context}/single/${label}/${axes.months[month]}`);
          }
          await assertKeyboardCopy(page, l.tooLate, `${context}/Cmd+C`, "Meta");
        } else if (kind === "range") {
          const start = cell(l.assignedTarget, 0);
          const end = cell(l.assignedTotal, 1);
          await clickTable(page, ...start);
          await clickTable(page, ...end, "Shift");
          const minR = Math.min(start[0], end[0]), maxR = Math.max(start[0], end[0]);
          const minC = Math.min(start[1], end[1]), maxC = Math.max(start[1], end[1]);
          assert.equal(await selectedCount(page), (maxR - minR + 1) * (maxC - minC + 1), `${context}/range highlight`);
          await assertKeyboardCopy(page, matrix.slice(minR, maxR + 1)
            .map(row => row.slice(minC, maxC + 1).join("\t")).join("\n"), `${context}/range`);
        } else if (kind === "row") {
          const row = cell(l.assignedTotal, 0)[0];
          await clickTable(page, row, -1);
          assert.equal(await selectedCount(page), matrix[row].length, `${context}/row highlight`);
          await assertKeyboardCopy(page, matrix[row].join("\t"), `${context}/row`);
        } else {
          const col = cell(l.assignedTotal, 1)[1];
          await clickTable(page, -1, col);
          assert.equal(await selectedCount(page), matrix.length, `${context}/column highlight`);
          await assertKeyboardCopy(page, matrix.map(row => row[col]).join("\n"), `${context}/column`);
        }
        // Each selection type must be cleared, in both directions of rotation.
        const other = orientation === "columns" ? "rows" : "columns";
        await clickText(page, l[other]);
        assert.equal(await selectedCount(page), 0, `${context}/${kind}/rotation resets highlight`);
        await assertKeyboardCopy(page, null, `${context}/${kind}/rotation resets copy`);
        const rotatedAxes = await tableAxes(page, other);
        const indicator = rotatedAxes.indicators.indexOf(l.assignedTarget);
        // Shift-click after rotation also proves that the old range anchor is gone.
        await clickTable(page, ...(other === "columns" ? [indicator, 1] : [1, indicator]), "Shift");
        assert.equal(await selectedCount(page), 1, `${context}/${kind}/rotation resets anchor`);
        await assertKeyboardCopy(page, l.unavailable, `${context}/${kind}/month-indicator after rotation`);
        await clickText(page, l[orientation]);
      }
    }
  }
  const trigger = await page.evaluateHandle(label => [...document.querySelectorAll("button")]
    .find(button => button.textContent.trim().startsWith(label)), l.visibility);
  await trigger.asElement().click();
  await trigger.dispose();
  await clickText(page, l.restore);
  await page.keyboard.press("Escape");
}

test("real growth page: anonymous browser APIs, IT/EN, both orientations, clipboard and XLSX", { timeout: 240000 }, async t => {
  // Frontend only: importing/starting server/index.ts here would contact the live DB.
  const server = await createServer({
    // Same application source/aliases/styles, without editor-only instrumentation.
    configFile: false,
    root: path.resolve("client"),
    plugins: [react(), themePlugin()],
    resolve: { alias: { "@": path.resolve("client/src"), "@shared": path.resolve("shared") } },
    server: { host: "127.0.0.1", port: 0, allowedHosts: true },
  });
  let browser;
  const directory = await mkdtemp(path.join(tmpdir(), "growth-browser-"));
  try {
    await server.listen();
    const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
    browser = await puppeteer.launch({
      executablePath: await chromium.executablePath(), args: chromium.args, headless: true,
    });
    for (const lang of ["it", "en"]) {
      await t.test(lang, async () => {
        const l = labels[lang];
        const page = await browser.newPage();
        const failures = [];
        const apiCalls = [];
        page.on("pageerror", error => failures.push(error.message));
        await page.setViewport({ width: 1440, height: 1000 });
        await page.evaluateOnNewDocument(lang => localStorage.setItem("planning_lang", lang), lang);
        await page.setRequestInterception(true);
        page.on("request", async request => {
          const url = new URL(request.url());
          if (url.pathname.startsWith("/api/")) {
            apiCalls.push(`${request.method()} ${url.pathname}`);
            if (request.method() !== "GET" || !Object.hasOwn(apiFixtures, url.pathname)) {
              failures.push(`Unmocked API or attempted write: ${request.method()} ${url.pathname}`);
              return request.respond({ status: 501, contentType: "application/json", body: '{"error":"unmocked"}' });
            }
            return request.respond({ status: 200, contentType: "application/json", body: JSON.stringify(apiFixtures[url.pathname]) });
          }
          // No external network, including weather, fonts and analytics.
          if (url.origin !== origin && !["data:", "blob:"].includes(url.protocol)) return request.abort();
          return request.continue();
        });
        const cdp = await page.createCDPSession();
        await cdp.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: directory });
        await browser.defaultBrowserContext().overridePermissions(origin, ["clipboard-read", "clipboard-write", "clipboard-sanitized-write"]);
        await page.goto(`${origin}/proiezione-crescita`, { waitUntil: "networkidle0" });
        await page.waitForSelector(`select[aria-label="${l.month}"]`);
        await page.click('button[aria-label="Espandi dettaglio ordini"]');

        // Extract rendered rows rather than just searching the whole page for numbers.
        async function checkSummary(missing = false) {
          const content = await page.evaluate(title => {
            const heading = [...document.querySelectorAll("h3")].find(h => h.textContent === title);
            const card = heading.parentElement.parentElement.parentElement;
            return {
              text: card.innerText,
              tables: [...card.querySelectorAll("table")].map(table =>
                [...table.querySelectorAll("tbody tr")].map(row => [...row.children].map(cell => cell.textContent.trim()))),
              metrics: [...card.querySelectorAll(".tabular-nums")].map(el => el.textContent.trim()),
              metricCards: [...card.querySelectorAll(".grid > div > div.tabular-nums")].map(el => el.textContent.trim()),
            };
          }, l.summary);
          if (missing) {
            assert.match(content.text, lang === "it" ? /Dato non disponibile: ricalcolare/ : /Unavailable — recalculate/);
            assert.ok(content.text.includes(lang === "it" ? "Copertura non disponibile: ricalcolare" : "Coverage unavailable — recalculate"));
            assert.ok(content.text.includes("—"), "Missing values must not become zeros");
            assert.equal(content.tables[0].length, 1);
            assert.equal(content.tables[1].length, 1);
            assert.equal(content.tables[2].length, 1);
            assert.deepEqual(content.metricCards, ["—", "11" + (lang === "it" ? "." : ",") + "000", ...Array(9).fill("—")]);
            return;
          }
          const formatted = await page.evaluate(lang => Object.fromEntries(
            [0, 1000, 1200, 1500, 2000, 2200, 2500, 3000, 3700, 4000, 5200, 5500, 6000, 7000, 7500, 8000, 9000, 10000, 11000, 11200, 13000, 20000, 77777, 88888]
              .map(value => [value, value.toLocaleString(lang === "it" ? "it-IT" : "en-GB")])
          ), lang);
          const n = value => formatted[value];
          assert.deepEqual(content.tables[0], [
            ["TP-300", n(6000)], ["TP-1000", n(3000)], ["TP-3000", n(8000)], ["TP-4000", n(3000)],
          ]);
          assert.deepEqual(content.tables[1], [
            ["TP-1000", n(3000), n(2000), n(1000)],
            ["TP-3000", n(7000), n(5500), n(1500)],
            ["TP-4000", "0", "0", "0"],
          ]);
          assert.deepEqual(content.tables[2], [
            ["TP-3000", n(4000), n(2500), n(1500)], ["TP-4000", n(1200), n(1200), "0"],
          ]);
          assert.deepEqual(content.metricCards, [20000, 11000, 10000, 7500, 2500, 5200, 3700, 1500, 9000, 2200, 11200].map(n));
          for (const value of [13000, 11000, 2000, 6000]) assert.ok(content.metrics.includes(n(value)), `Missing Forecast/arrival value ${value}`);
          assert.ok(content.text.includes(lang === "it" ? "Deficit target non maturabile in tempo" : "Target deficit cannot mature in time"));
          assert.ok(content.text.includes(lang === "it" ? "Arrivo suggerito: 0" : "Suggested arrival: 0"));
          assert.ok(content.text.includes(lang === "it" ? "Non si somma alle disponibilità" : "Do not add to order availability"));
          assert.ok(content.text.includes(`${n(4000)} ${lang === "it" ? "coperti su" : "covered of"} ${n(10000)}`));
          assert.ok(!content.text.includes(n(77777)) && !content.text.includes(n(88888)), "Initial cohorts are not exclusive biology");
        }
        await checkSummary();

        let selectionOracle;
        for (const orientation of ["columns", "rows"]) {
          await clickText(page, l[orientation]);
          await page.evaluate(() => navigator.clipboard.writeText(""));
          await clickText(page, l.copy);
          await page.waitForFunction(async label => (await navigator.clipboard.readText()).includes(label), {}, l.assignedTarget);
          const copied = await page.evaluate(() => navigator.clipboard.readText());
          const rows = copyRows(copied);
          selectionOracle = rows;
          const expected = [
            [l.assignedTarget, 9000], [l.assignedLower, 2200], [l.assignedTotal, 11200],
            [l.shortfall, 3000], [l.recovery, l.tooLate], [l.arrival, 0],
            [l.budget, 13000], [l.forecast, 11000], [l.forecastGap, 2000],
            [l.backlog, l.backlogValue], [l.monthly, l.monthlyValue], [l.deadline, l.deadlineValue],
            [l.perSize, l.perSizeValue],
          ];
          for (const [label, value] of expected) {
            const row = rows.find(row => row[0].trim() === label);
            assert.ok(row, `Missing copied row: ${label}`);
            assert.equal(row[1], String(value), `${lang}/${orientation}/${label}`);
          }
          for (const [size, quantity] of [["TP-300", 6000], ["TP-1000", 3000], ["TP-3000", 8000], ["TP-4000", 3000]]) {
            assert.deepEqual(rows.find(row => row[0] === `${l.bio} · ${size}`)?.slice(1), [String(quantity), l.unavailable]);
          }
          for (const label of [l.assignedTarget, l.assignedLower, l.assignedTotal, l.shortfall, l.recovery, l.monthly, l.deadline, l.backlog, l.perSize]) {
            assert.equal(rows.find(row => row[0].trim() === label)?.[2], l.unavailable, `Missing data: ${label}`);
          }
          assert.ok(copied.includes(l.alternative));

          // Compare the actual spreadsheet DOM in either orientation to the fixed expectations.
          const displayed = await page.evaluate(({ orientation }) => {
            const table = [...document.querySelectorAll("table")].find(table =>
              table.style.fontFamily.includes("Calibri"));
            const headers = [...table.querySelectorAll("thead th")].map(cell => cell.innerText.trim());
            const body = [...table.querySelectorAll("tbody tr")].map(row => [...row.children].map((cell, index) =>
              index === 0 ? cell.innerText.trim() : (cell.querySelector(".tabular-nums > div:first-child > span:last-child")?.textContent ?? cell.innerText).trim()));
            return orientation === "columns" ? body : headers.slice(1).map((label, index) => [label, ...body.map(row => row[index + 1])]);
          }, { orientation });
          for (const [label, value] of expected) {
            const row = displayed.find(row => row[0] === label);
            assert.ok(row, `Missing visible row: ${label}`);
            assert.equal(value === 0 ? row[1] : typeof value === "number" ? Number(row[1].replaceAll(".", "")) : row[1], value === 0 ? "-" : value, `Rendered ${lang}/${orientation}/${label}`);
            const copiedRow = rows.find(row => row[0].trim() === label);
            const missingValue = copiedRow[2];
            assert.equal(missingValue === "0" ? row[2] : Number.isFinite(Number(missingValue)) ? Number(row[2].replaceAll(".", "")) : row[2], missingValue === "0" ? "-" : Number.isFinite(Number(missingValue)) ? Number(missingValue) : missingValue);
          }

          for (const filename of await readdir(directory)) await rm(path.join(directory, filename));
          await clickText(page, "Excel");
          let download;
          const end = Date.now() + 30000;
          while (Date.now() < end) {
            download = (await readdir(directory)).find(name => name.endsWith(".xlsx"));
            if (download) break;
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          assert.ok(download, "Excel download did not complete");
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(await readFile(path.join(directory, download)));
          const sheet = workbook.worksheets[0];
          const excelRows = [];
          sheet.eachRow(row => excelRows.push([row.getCell(1).text.trim(), row.getCell(2).value, row.getCell(3).value]));
          // Every copied quantity/text must be present in the downloaded workbook too.
          for (const copiedRow of rows) {
            const candidates = excelRows.filter(row => row[0] === copiedRow[0].trim());
            assert.ok(candidates.length, `Missing XLSX row: ${copiedRow[0]}`);
            const values = copiedRow.slice(1).map(value => value !== "" && Number.isFinite(Number(value)) ? Number(value) : value);
            assert.ok(candidates.some(row => JSON.stringify(row.slice(1)) === JSON.stringify(values)), `XLSX differs from clipboard: ${copiedRow[0]}`);
          }
          assert.ok(workbook.worksheets.length >= 3, "Initial-cohort detail sheets remain separate");
        }
        await checkSelections(page, l, lang, selectionOracle);
        await page.select(`select[aria-label="${l.month}"]`, "1");
        await checkSummary(true);
        assert.ok(apiCalls.includes("GET /api/proiezione-crescita"));
        assert.deepEqual(failures, []);
        await page.close();
      });
    }
  } finally {
    await browser?.close();
    await server.close();
    await rm(directory, { recursive: true, force: true });
  }
});