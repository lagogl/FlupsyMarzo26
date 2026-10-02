import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createServer } from "vite";
import puppeteer from "puppeteer";
import chromium from "@sparticuz/chromium";
import ExcelJS from "exceljs";
import { PDFDocument } from "pdf-lib";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";

const root = "/api/commercial-availability";
const referenceDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());
const [year, month, day] = referenceDate.split("-").map(Number);
const sizes = [
  { id: 1, code: "TP-1000", name: "Taglia 1000" },
  { id: 2, code: "TP-3000", name: "Taglia 3000" },
];
const defaults = {
  name: "Bozza browser", startYear: year, startMonth: month, horizon: 6,
  selectedSizeIds: [1, 2], includeOrders: true, includeHatchery: false,
  growthFactor: 1, mortalityMultiplier: 1, sales: [], hatcheryOverrides: [],
};
const quotaWarning = "Ordine fixture 12: consegne fuori periodo o ambigue; mantenute quote lorde cautelative, riconciliare.";

async function toggleAdvanced(page) {
  const summary = await page.evaluateHandle(() => [...document.querySelectorAll(".commercial-workspace details > summary")]
    .find(element => element.textContent.includes("Ipotesi avanzate")));
  assert.ok(summary.asElement(), "Advanced scenario assumptions must remain available separately from quota warnings");
  try { await summary.asElement().click(); } finally { await summary.dispose(); }
}

// Synthetic, isolated API fixtures. These deliberately do not import any production
// calculation/presentation helpers: this suite tests rendered UI and request contracts,
// not the biological replay (which is covered by server tests).
function resultFor(input, { capacity = 4321, invalid = false, historical = false, omitMortality = false, shortfallsByMonth = [], mortalityByMonth = [] } = {}) {
  const months = Array.from({ length: input.horizon }, (_, index) => {
    const serial = input.startYear * 12 + input.startMonth - 1 + index;
    return {
      year: Math.floor(serial / 12), month: serial % 12 + 1,
      availableBySize: { 1: capacity, 2: 0 },
      availabilityDayBySize: { 1: index === 0 ? day : 15 },
      ...(shortfallsByMonth[index] === undefined ? {} : { shortfallsBySize: shortfallsByMonth[index] }),
      ...(!historical && !omitMortality ? mortalityByMonth[index] ?? { mortalityBySize: { 1: Math.round(1234 * input.mortalityMultiplier), 2: 0 } } : {}),
      ordersRequested: 1000, ordersFulfilled: 950, orderShortfall: 50,
      salesRequested: 0, salesApplied: 0, sandNurseryApplied: 0,
      revenue: 0, receipts: 0, remainingAnimals: 4321,
    };
  });
  const plan = input.sales.map(sale => ({
    ...sale, day: sale.day ?? 1,
    date: `${sale.year}-${String(sale.month).padStart(2, "0")}-${String(sale.day ?? 1).padStart(2, "0")}`,
    acceptedQuantity: invalid ? 0 : sale.quantity, shortfall: invalid ? sale.quantity : 0,
  }));
  const totalRequested = input.sales.reduce((sum, sale) => sum + sale.quantity, 0);
  return {
    sizes: historical ? [{ id: 1, code: "HISTORICAL-1000", name: "Catalogo congelato" }, sizes[1]] : sizes,
    input: structuredClone(input), inputHash: "fixture-only-hash",
    referenceDate, generatedAt: `${referenceDate}T08:00:00.000Z`,
    availabilityIsAlternative: true, valid: !invalid, months,
    baselineMonths: structuredClone(months), plan, totalRequested,
    totalAccepted: invalid ? 0 : totalRequested,
    baselineOrderShortfall: input.horizon * 50, orderShortfall: input.horizon * 50,
    hatcheryDependent: input.includeHatchery, warnings: historical ? [] : [quotaWarning], calculationMs: 25,
  };
}

// Select only physical-size rows, independently of summary rows above them.
const sizeCell = (sizeIndex, monthIndex = 1) =>
  `.ca-desktop-matrix tbody tr:nth-child(${sizeIndex} of tr:has(.ca-cell)) td:nth-of-type(${monthIndex}) .ca-cell`;
async function mortalitySummary(page, selector) {
  return page.$eval(selector, element => ({
    total: element.querySelector(".ca-month-mortality-total strong").innerText.trim(),
    breakdown: Object.fromEntries([...element.querySelectorAll("dl > div")].map(row =>
      [row.querySelector("dt").innerText.trim(), row.querySelector("dd").innerText.trim()])),
    text: element.innerText,
    color: getComputedStyle(element.querySelector(".ca-month-mortality-total strong")).color,
  }));
}
function assertRed(color) {
  const channels = color.match(/\d+/g)?.map(Number);
  assert.ok(channels?.[0] > channels[1] * 1.4 && channels[0] > channels[2] * 1.2,
    `Population mortality total must be red: ${color}`);
}

async function button(page, text, { prefix = false, scope = "document" } = {}) {
  const handle = await page.evaluateHandle(({ text, prefix, scope }) => {
    const container = scope === "document" ? document : document.querySelector(scope);
    return [...(container?.querySelectorAll("button") ?? [])].find(element =>
      prefix ? element.textContent.trim().startsWith(text) : element.textContent.trim() === text);
  }, { text, prefix, scope });
  assert.ok(handle.asElement(), `Missing button: ${text}`);
  return handle;
}
async function clickText(page, text, options) {
  const handle = await button(page, text, options);
  try {
    assert.equal(await handle.evaluate(element => element.disabled), false, `Disabled button: ${text}`);
    await handle.evaluate(element => element.scrollIntoView({ block: "center", inline: "center" }));
    await page.waitForFunction(element => {
      const rect = element.getBoundingClientRect();
      return element.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2));
    }, {}, handle);
    await handle.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await handle.asElement().click();
  } finally { await handle.dispose(); }
}
async function clickSelector(page, selector) {
  const element = await page.$(selector);
  assert.ok(element, `Missing action: ${selector}`);
  try {
    await element.evaluate(element => element.scrollIntoView({ block: "center", inline: "center" }));
    try {
      await page.waitForFunction(element => {
        const rect = element.getBoundingClientRect();
        return element.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2));
      }, {}, element);
    } catch (error) {
      await page.screenshot({ path: "/tmp/commercial-action-failure.jpg" });
      const hit = await element.evaluate(element => {
        const rect = element.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return { target: element.outerHTML, rect: rect.toJSON(), hit: hit?.outerHTML };
      });
      assert.fail(`Action not reachable: ${selector}; ${JSON.stringify(hit)}`);
    }
    await element.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await element.click();
  } finally { await element.dispose(); }
}
async function dismissToasts(page) {
  for (const close of await page.$$('[data-state="open"] [toast-close]')) {
    await close.click();
    await close.dispose();
  }
  await page.waitForFunction(() => !document.querySelector('[data-state="open"] [toast-close]'));
}
async function closeDialog(page) {
  await page.waitForSelector('[role="dialog"][data-state="open"]', { visible: true });
  // Radix focus/layer registration is asynchronous after the React commit.
  // Use the explicit close control rather than racing its Escape listener.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await clickText(page, "Close", { scope: '[role="dialog"]' });
  await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
}
async function isDisabled(page, text) {
  const handle = await button(page, text);
  try { return await handle.evaluate(element => element.disabled); } finally { await handle.dispose(); }
}
async function field(page, label, kind = "input", scope = ".commercial-workspace") {
  const handle = await page.evaluateHandle(({ label, kind, scope }) =>
    [...document.querySelectorAll(`${scope} label`)]
      .find(element => [...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() === label))
      ?.querySelector(kind), { label, kind, scope });
  assert.ok(handle.asElement(), `Missing field: ${label}`);
  return handle;
}
async function typeField(page, label, value, scope) {
  const handle = await field(page, label, "input", scope);
  try {
    await handle.asElement().click({ clickCount: 3 });
    await page.keyboard.press("Backspace");
    await handle.asElement().type(String(value));
  } finally { await handle.dispose(); }
}
async function selectField(page, label, value, scope) {
  const handle = await field(page, label, "select", scope);
  try { await handle.asElement().select(String(value)); } finally { await handle.dispose(); }
}
async function toggle(page, label) {
  const handle = await field(page, label);
  try { await handle.asElement().click(); } finally { await handle.dispose(); }
}
async function waitText(page, text) {
  try {
    await page.waitForFunction(text => document.querySelector(".commercial-workspace")?.innerText.includes(text), { timeout: 10000 }, text);
  } catch (error) {
    await page.screenshot({ path: "/tmp/commercial-availability-failure.jpg" });
    assert.fail(`Waiting for ${text}: ${await page.$eval(".commercial-workspace", element => element.innerText)}`);
  }
}
async function verify(page) {
  await clickText(page, "Verifica disponibilità e piano");
  await page.waitForNetworkIdle({ idleTime: 100 });
  await page.waitForFunction(() => !document.querySelector(".commercial-workspace")?.innerText.includes("Calcolo in corso"));
  await waitText(page, "Risultato aggiornato");
}
async function download(directory, extension, page) {
  const end = Date.now() + 30000;
  while (Date.now() < end) {
    const name = (await readdir(directory)).find(name => name.endsWith(extension));
    if (name) return path.join(directory, name);
    const error = await page.$$eval(".commercial-workspace [role=alert]", elements => elements.map(element => element.innerText).join("\n"));
    assert.equal(error, "", `Export displayed an error: ${error}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.fail(`Download did not finish: ${extension}; UI: ${await page.$eval(".commercial-workspace", element => element.innerText)}`);
}
async function clearWorkbookDownloads(directory) {
  for (const name of await readdir(directory)) {
    if (name.endsWith(".xlsx")) await unlink(path.join(directory, name));
  }
}
async function downloadWorkbook(directory, page) {
  const file = await download(directory, ".xlsx", page);
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await readFile(file));
    return workbook;
  } finally { await unlink(file); }
}
function excelHeaders(sheet) {
  return new Map(sheet.getRow(1).values.slice(1).map((value, index) => [String(value), index + 1]));
}
function excelRow(sheet, header, value) {
  const column = excelHeaders(sheet).get(header);
  assert.ok(column, `Missing Excel header: ${header} in ${sheet.name}`);
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    if (sheet.getRow(rowNumber).getCell(column).value === value) return sheet.getRow(rowNumber);
  }
  assert.fail(`Missing Excel row for ${header}=${value} in ${sheet.name}`);
}
function excelValue(sheet, row, header) {
  const column = excelHeaders(sheet).get(header);
  assert.ok(column, `Missing Excel header: ${header} in ${sheet.name}`);
  return row.getCell(column).value;
}
function excelKeyValue(sheet, key) {
  for (let rowNumber = 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    if (row.getCell(1).value === key) return row.getCell(2).value;
  }
  assert.fail(`Missing Excel key: ${key} in ${sheet.name}`);
}

test("commercial page: real authenticated React, sales, stale replay, library, frozen XLSX/PDF and mobile", { timeout: 240000 }, async t => {
  // Only Vite's frontend harness is started; never server/index.ts or the live DB.
  // Auth remains intact: the existing AuthProvider/ProtectedRoute consume the
  // /users/current fixture just as they consume a real authenticated API response.
  const server = await createServer({
    configFile: false, root: path.resolve("client"), plugins: [react(), themePlugin()],
    resolve: { alias: { "@": path.resolve("client/src"), "@shared": path.resolve("shared") } },
    server: { host: "127.0.0.1", port: 0, allowedHosts: true },
  });
  const directory = await mkdtemp(path.join(tmpdir(), "commercial-browser-"));
  let browser;
  try {
    await server.listen();
    const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
    browser = await puppeteer.launch({
      executablePath: await chromium.executablePath(), args: chromium.args, headless: true,
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1100 });
    const failures = [], calls = [], simulations = [];
    const timestamp = `${referenceDate}T08:00:00.000Z`;
    const historicalInput = {
      ...structuredClone(defaults), name: "Riepilogo storico",
      sales: [{ id: "historic-sale", year, month, day, sizeId: 1, quantity: 1234 }],
      includeOrders: false, includeHatchery: true,
    };
    const historic = { id: 70, ownerId: "fixture", name: historicalInput.name,
      snapshot: resultFor(historicalInput, { historical: true }), createdAt: timestamp };
    let scenarios = [], summaries = [historic], nextId = 10;
    let delayNext = false, invalidNext = false, pending = null, nextShortfallsByMonth = null, nextMortalityByMonth = null, omitNextMortality = false;
    page.on("pageerror", error => failures.push(error.message));
    page.on("dialog", dialog => dialog.accept());
    await page.setRequestInterception(true);
    page.on("request", async request => {
      try {
        const url = new URL(request.url());
        if (!url.pathname.startsWith("/api/")) {
          if (url.origin !== origin && !["data:", "blob:"].includes(url.protocol)) return request.abort();
          return request.continue();
        }
        const method = request.headers()["x-http-method-override"] ?? request.method();
        const body = request.postData() ? JSON.parse(request.postData()) : undefined;
        calls.push({ method, path: url.pathname, body: structuredClone(body) });
        const respond = data => request.respond({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
        const readFixtures = {
          "/api/users/current": { success: true, user: { id: 1, username: "commercial-browser-fixture", role: "user", language: "it" } },
          "/api/menu-preferences/1": { success: true, data: { menuItems: [], hiddenMenuItems: [], compactModeEnabled: false } },
          "/api/cycles/pending-closures/count": { count: 0 },
          "/api/notifications": { success: true, notifications: [] },
          "/api/proxy/tide-data": [],
          [`${root}/inputs`]: { sizes, defaults, referenceDate, warnings: [] },
          [`${root}/scenarios`]: scenarios, [`${root}/summaries`]: summaries,
        };
        if (method === "GET" && Object.hasOwn(readFixtures, url.pathname)) return respond(readFixtures[url.pathname]);
        if (method === "POST" && url.pathname === `${root}/simulate`) {
          simulations.push(body);
          const response = resultFor(body, {
            capacity: delayNext ? 98765 : 4321, invalid: invalidNext,
            shortfallsByMonth: nextShortfallsByMonth ?? [],
            mortalityByMonth: nextMortalityByMonth ?? [],
            omitMortality: omitNextMortality,
          });
          nextShortfallsByMonth = null;
          nextMortalityByMonth = null;
          omitNextMortality = false;
          invalidNext = false;
          if (delayNext) { delayNext = false; pending = () => respond(response); return; }
          return respond(response);
        }
        if (method === "POST" && url.pathname === `${root}/summaries`) {
          const summary = { id: nextId++, ownerId: "fixture", name: body.name,
            snapshot: resultFor(body), createdAt: timestamp };
          summaries = [...summaries, summary];
          return respond(summary);
        }
        if (method === "POST" && url.pathname === `${root}/scenarios`) {
          const scenario = { id: nextId++, ownerId: "fixture", name: body.name,
            input: body, createdAt: timestamp, updatedAt: timestamp };
          scenarios = [...scenarios, scenario];
          return respond(scenario);
        }
        const match = url.pathname.match(/\/scenarios\/(\d+)(\/duplicate)?$/);
        if (match) {
          const id = Number(match[1]), existing = scenarios.find(scenario => scenario.id === id);
          assert.ok(existing, `Unknown fixture scenario ${id}`);
          if (method === "PUT") {
            const updated = { ...existing, input: body, name: body.name };
            scenarios = scenarios.map(scenario => scenario.id === id ? updated : scenario);
            return respond(updated);
          }
          if (method === "DELETE") { scenarios = scenarios.filter(scenario => scenario.id !== id); return respond({ success: true }); }
          if (method === "POST" && match[2]) {
            const copy = { ...structuredClone(existing), id: nextId++, name: `${existing.name} — copia` };
            copy.input.name = copy.name; scenarios = [...scenarios, copy]; return respond(copy);
          }
        }
        failures.push(`Unmocked API: ${method} ${url.pathname}`);
        return request.respond({ status: 501, contentType: "application/json", body: '{"error":"Unmocked browser API"}' });
      } catch (error) {
        failures.push(error.message);
        if (!request.isInterceptResolutionHandled()) await request.abort();
      }
    });
    const cdp = await page.createCDPSession();
    await cdp.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: directory });
    await page.goto(`${origin}/disponibilita-commerciale`, { waitUntil: "networkidle0" });
    await waitText(page, "Risultato aggiornato");
    assert.ok(calls.some(call => call.path === "/api/users/current"), "Real auth provider must request the session API");
    assert.ok(calls.some(call => call.path === `${root}/inputs`));
    assert.match(await page.$eval(".ca-matrix", table => table.innerText), /4\.321/);

    await t.test("future-quota policy and reconciliation warning details", async () => {
      const text = await page.$eval(".commercial-workspace", element => element.innerText);
      assert.match(text, /solo quote future valide, al netto delle consegne certificate sulla quota/);
      assert.match(text, /Nessun recupero delle sotto-consegne passate e nessun riporto degli scoperti/);
      const details = await page.evaluateHandle(() => [...document.querySelectorAll(".commercial-workspace details")]
        .find(element => element.querySelector("summary")?.textContent.includes("Verifiche quote e consegne")));
      assert.ok(details.asElement(), "Reconciliation warning details must be present");
      const summary = await details.asElement().$('summary');
      await summary.click();
      await summary.dispose();
      assert.ok(await details.evaluate((element, warning) => element.open && element.innerText.includes(warning), quotaWarning),
        "Expanded warning details must show the actual conservative attribution warning");
      await details.dispose();
      assert.equal(await page.$$eval(".commercial-workspace table tbody tr", rows => rows.filter(row =>
        /Arretrati precedenti|Recupero arretrati|Riporto scoperti/.test(row.innerText)).length), 0,
      "Past carry-over must not create planning rows");
      await page.screenshot({ path: "/tmp/future-quota-commercial.jpg" });
      await page.setViewport({ width: 402, height: 874 });
      await page.waitForSelector("aside button:has(.lucide-x)");
      await page.click("aside button:has(.lucide-x)");
      await page.waitForFunction(() => document.querySelector("aside")?.getBoundingClientRect().right <= 0);
      await page.$eval(".commercial-workspace details", element => element.scrollIntoView({ block: "center" }));
      await page.screenshot({ path: "/tmp/future-quota-commercial-mobile.jpg" });
      await page.setViewport({ width: 1440, height: 1100 });
    });

    await t.test("availability cells show scaled, separately explained order and sales shortfalls", async () => {
      nextShortfallsByMonth = [
        { 1: { orders: 12, sales: 34 }, 2: { orders: 0, sales: 0 } },
        { 1: { orders: 5, sales: 0 }, 2: { orders: 20, sales: 30 } },
      ];
      await verify(page);

      const firstSizeFirstMonth = sizeCell(1);
      const secondSizeFirstMonth = sizeCell(2);
      const secondSizeSecondMonth = sizeCell(2, 2);
      const firstCellLines = await page.$eval(firstSizeFirstMonth, cell => cell.innerText.split("\n").map(line => line.trim()));
      assert.ok(firstCellLines.includes("Mancano 46"), `Order and sale shortfalls must add to 46: ${firstCellLines}`);
      const noDeficitLines = await page.$eval(secondSizeFirstMonth, cell => cell.innerText.split("\n").map(line => line.trim()));
      assert.ok(!noDeficitLines.some(line => line.startsWith("Mancano ")), "Zero availability without shortfalls must not fabricate a deficit");
      assert.ok(!noDeficitLines.includes("Mancano 0"), "An explicit zero shortfall must not render a deficit");
      const positiveDeficitLines = await page.$eval(secondSizeSecondMonth, cell => cell.innerText.split("\n").map(line => line.trim()));
      assert.ok(positiveDeficitLines.includes("Mancano 50"), `A zero-capacity cell with unmet demand must show the deficit: ${positiveDeficitLines}`);
      const mortalityText = await page.$eval(firstSizeFirstMonth, cell =>
        cell.querySelector(".ca-cell-mortality")?.innerText.trim());
      assert.equal(mortalityText, "Morti previsti nel mese (sola taglia fisica): 1.234");
      const zeroMortalityText = await page.$eval(secondSizeFirstMonth, cell =>
        cell.querySelector(".ca-cell-mortality")?.innerText.trim());
      assert.equal(zeroMortalityText, "Morti previsti nel mese (sola taglia fisica): 0");
      const mortalityColor = await page.$eval(firstSizeFirstMonth, cell =>
        getComputedStyle(cell.querySelector(".ca-cell-mortality")).color);
      const redChannels = mortalityColor.match(/\d+/g)?.map(Number);
      assert.ok(redChannels?.[0] > redChannels[1] * 1.4 && redChannels[0] > redChannels[2] * 1.2,
        `Mortality annotation must be red: ${mortalityColor}`);

      const scale = await page.$eval(".ca-desktop-matrix", matrix => {
        const inspect = selector => [...matrix.querySelectorAll(selector)].map(fill => ({
          quantity: Number(fill.dataset.quantity),
          width: parseFloat(fill.style.width),
          parentWidth: fill.parentElement.getBoundingClientRect().width,
          fillWidth: fill.getBoundingClientRect().width,
        }));
        return {
          available: inspect(".ca-capacity-bar-fill"),
          shortfall: inspect(".ca-shortfall-bar-fill"),
        };
      });
      assert.ok(scale.available.length >= 12, "Every displayed size/month cell with a capacity should expose a capacity scale bar");
      assert.ok(scale.shortfall.length >= 3, "Positive cell deficits should expose shortfall scale bars");
      assert.ok(scale.available.some(bar => bar.quantity === 4321 && bar.width === 100), "Maximum visible quantity must define the shared 100% scale");
      assert.ok(scale.available.some(bar => bar.quantity === 0 && bar.width === 0), "Zero capacity must retain a zero-width fill");
      const scaledShortfall = scale.shortfall.find(bar => bar.quantity === 50);
      assert.ok(scaledShortfall && scaledShortfall.width > 0 && scaledShortfall.width < 2, "Deficits use the same scale as availability, rather than an independent shortfall maximum");
      assert.ok(scale.shortfall.some(bar => bar.quantity === 46 && bar.width > 0 && bar.width < scaledShortfall.width), "Smaller combined shortfall must use that same scale");
      assert.ok(scale.available.every(bar => bar.parentWidth > 0), "Capacity bars must remain visibly rendered");
      assert.ok(scale.shortfall.every(bar => bar.parentWidth > 0), "Shortfall bars must remain visibly rendered");

      await page.screenshot({ path: "/tmp/commercial-availability-shortfalls-desktop.jpg" });
      await page.screenshot({ path: "/tmp/commercial-availability-mortality-desktop.jpg" });
      await page.click(firstSizeFirstMonth);
      await page.waitForSelector('[role="dialog"]');
      const detailText = await page.$eval('[role="dialog"]', dialog => dialog.innerText);
      assert.match(detailText, /4\.321 animali/);
      assert.match(detailText, /dal .*\b\d{1,2}\b/i, "Positive availability keeps its earlier reachable date");
      assert.match(detailText, /Morti previsti nel mese \(sola taglia fisica\): 1\.234 animali/);
      assert.match(detailText, /coefficiente.*1|moltiplicatore.*1/i);
      assert.match(detailText, /Totali del mese · tutte le taglie: ordini richiesti 1\.000 animali; scoperto ordini 50 animali/);
      assert.match(detailText, /Ordini inclusi non coperti · TP-1000: 12/);
      assert.match(detailText, /Vendite simulate non soddisfatte · TP-1000: 34/);
      assert.ok(!detailText.includes("Ordini inclusi non coperti · TP-1000: 46"));
      assert.match(detailText, /questa taglia e questo mese/);
      assert.match(detailText, /Non è .*scoperto cumulativo dei mesi precedenti/);
      await closeDialog(page);

      await page.click(secondSizeSecondMonth);
      await page.waitForSelector('[role="dialog"]');
      const zeroCapacityDetail = await page.$eval('[role="dialog"]', dialog => dialog.innerText);
      assert.match(zeroCapacityDetail, /Totali del mese · tutte le taglie: ordini richiesti 1\.000 animali; scoperto ordini 50 animali/);
      assert.match(zeroCapacityDetail, /Ordini inclusi non coperti · TP-3000: 20/);
      assert.match(zeroCapacityDetail, /Vendite simulate non soddisfatte · TP-3000: 30/);
      assert.doesNotMatch(zeroCapacityDetail, /tutte le taglie:.*scoperto ordini 20 animali/);
      assert.equal(await page.$eval('[role="dialog"] button.ca-button.primary', element => element.disabled), true);
      await closeDialog(page);

      await page.setViewport({ width: 402, height: 874 });
      await page.waitForFunction(() => getComputedStyle(document.querySelector(".ca-mobile-matrix")).display !== "none");
      assert.equal(await page.$eval(".ca-mobile-matrix .ca-cell-mortality", element => element.innerText.trim()),
        "Morti previsti nel mese (sola taglia fisica): 1.234");
      const mobileMortalityColor = await page.$eval(".ca-mobile-matrix .ca-cell-mortality", element => getComputedStyle(element).color);
      const mobileRedChannels = mobileMortalityColor.match(/\d+/g)?.map(Number);
      assert.ok(mobileRedChannels?.[0] > mobileRedChannels[1] * 1.4 && mobileRedChannels[0] > mobileRedChannels[2] * 1.2,
        `Mobile mortality annotation must be red: ${mobileMortalityColor}`);
      await page.screenshot({ path: "/tmp/commercial-availability-shortfalls-mobile.jpg" });
      await page.screenshot({ path: "/tmp/commercial-availability-mortality-mobile.jpg" });
      await page.setViewport({ width: 1440, height: 1100 });

      await toggleAdvanced(page);
      await typeField(page, "Moltiplicatore mortalità (0–5)", 0.5);
      const staleMortality = await page.$eval(firstSizeFirstMonth, cell => cell.querySelector(".ca-cell-mortality")?.innerText.trim());
      assert.equal(staleMortality, "Morti previsti nel mese (sola taglia fisica): 1.234", "Editing the coefficient retains only the marked stale replay values");
      assert.match(await page.$eval(".commercial-workspace .ca-header", element => element.innerText), /Bozza da verificare/);
      await verify(page);
      assert.equal(await page.$eval(firstSizeFirstMonth, cell => cell.querySelector(".ca-cell-mortality")?.innerText.trim()),
        "Morti previsti nel mese (sola taglia fisica): 617", "Fresh mortality is an absolute count scaled by the selected coefficient");
      await typeField(page, "Moltiplicatore mortalità (0–5)", 1);
      assert.equal(await page.$eval(firstSizeFirstMonth, cell => cell.querySelector(".ca-cell-mortality")?.innerText.trim()),
        "Morti previsti nel mese (sola taglia fisica): 617", "The prior absolute mortality remains visible as stale until recalculation");
      await verify(page);
      assert.equal(await page.$eval(firstSizeFirstMonth, cell => cell.querySelector(".ca-cell-mortality")?.innerText.trim()),
        "Morti previsti nel mese (sola taglia fisica): 1.234", "Restore the fixture's default coefficient for subsequent browser scenarios");
      await toggleAdvanced(page);
    });

    await t.test("population mortality includes hidden physical sizes and unclassified animals exactly once", async () => {
      nextMortalityByMonth = [
        { mortalityBySize: { 1: 0, 2: 0, 99: 1307365 }, unclassifiedMortality: 1842178 },
        { mortalityBySize: { 1: 0, 2: 0, 99: 0 }, unclassifiedMortality: 2181489,
          availableBySize: { 1: 0, 2: 0 }, availabilityDayBySize: {} },
      ];
      await verify(page);
      const desktopMonth = index =>
        `.ca-desktop-matrix .ca-mortality-summary-row td:nth-of-type(${index}) .ca-month-mortality`;
      const mobileMonth = index =>
        `.ca-mobile-mortality-summary .ca-mobile-mortality-month:nth-of-type(${index}) .ca-month-mortality`;
      const expectedFirst = {
        "Taglie fisiche visibili": "0", "Altre taglie fisiche": "1.307.365", "Non classificati": "1.842.178",
      };
      const expectedSecond = {
        "Taglie fisiche visibili": "0", "Altre taglie fisiche": "0", "Non classificati": "2.181.489",
      };
      const first = await mortalitySummary(page, desktopMonth(1));
      assert.equal(first.total, "3.149.543", "Hidden-size deaths and unclassified deaths must each be counted once");
      assert.deepEqual(first.breakdown, expectedFirst);
      assert.equal(Object.values(first.breakdown).reduce((sum, value) => sum + Number(value.replaceAll(".", "")), 0),
        3149543, "The total must be the partition sum, not a sum of overlapping alternative-capacity rows");
      assertRed(first.color);
      assert.match(first.text, /fuori dagli intervalli delle taglie fisiche configurate/);
      const second = await mortalitySummary(page, desktopMonth(2));
      assert.equal(second.total, "2.181.489", "A month with only unclassified deaths must still display a positive total");
      assert.deepEqual(second.breakdown, expectedSecond);
      assertRed(second.color);
      for (const sizeIndex of [1, 2]) {
        assert.equal(await page.$eval(sizeCell(sizeIndex, 2), cell => cell.querySelector("strong").innerText.trim()), "0",
          "Purely unclassified deaths remain visible even when every size row has zero capacity");
      }
      for (const sizeIndex of [1, 2]) for (const monthIndex of [1, 2]) {
        assert.equal(await page.$eval(sizeCell(sizeIndex, monthIndex), cell =>
          cell.querySelector(".ca-cell-mortality").innerText.trim()),
        "Morti previsti nel mese (sola taglia fisica): 0", "Visible physical-size zeros must not hide population deaths");
      }
      assert.equal(await page.$$eval(".ca-desktop-matrix tbody tr:has(.ca-cell)", rows => rows.length), 2,
        "The hidden physical size must contribute to totals without becoming a visible size row");
      await page.$eval(".ca-mortality-summary-row", element => element.scrollIntoView({ block: "center" }));
      await page.screenshot({ path: "/tmp/commercial-mortality-totals-desktop.jpg" });
      await page.click(sizeCell(1));
      await page.waitForSelector('[role="dialog"]');
      const detailSummary = await mortalitySummary(page, '[role="dialog"] .ca-detail-mortality .ca-month-mortality');
      assert.equal(detailSummary.total, "3.149.543");
      assert.deepEqual(detailSummary.breakdown, expectedFirst);
      const detailText = await page.$eval('[role="dialog"]', element => element.innerText);
      assert.match(detailText, /Zero morti nella sola taglia fisica non significa zero mortalità nella popolazione/);
      assert.match(detailText, /non sottrarre di nuovo questi animali/);
      assert.match(detailText, /non è la differenza aritmetica tra i massimi/);
      await closeDialog(page);

      await page.setViewport({ width: 402, height: 874 });
      await page.waitForFunction(() => getComputedStyle(document.querySelector(".ca-mobile-matrix")).display !== "none");
      const mobileFirst = await mortalitySummary(page, mobileMonth(1));
      const mobileSecond = await mortalitySummary(page, mobileMonth(2));
      assert.equal(mobileFirst.total, first.total);
      assert.deepEqual(mobileFirst.breakdown, expectedFirst);
      assert.equal(mobileSecond.total, second.total);
      assert.deepEqual(mobileSecond.breakdown, expectedSecond);
      assertRed(mobileFirst.color);
      assertRed(mobileSecond.color);
      await page.$eval(".ca-mobile-mortality-summary", element => element.scrollIntoView({ block: "start" }));
      await page.screenshot({ path: "/tmp/commercial-mortality-totals-mobile.jpg" });
      await page.setViewport({ width: 1440, height: 1100 });

      await toggle(page, "Ordini futuri acquisiti");
      await waitText(page, "Bozza da verificare");
      assert.equal((await mortalitySummary(page, desktopMonth(1))).total, "3.149.543",
        "Stale totals must retain the previous replay, not recompute or become zero");
      assert.match(await page.$eval(".ca-bar-legend", element => element.innerText), /Dati del calcolo precedente, da verificare/);
      assert.equal(await isDisabled(page, "Prepara riepilogo commerciale"), true);
      await toggle(page, "Ordini futuri acquisiti");

      omitNextMortality = true;
      await verify(page);
      for (const selector of [desktopMonth(1), desktopMonth(2), mobileMonth(1), mobileMonth(2)]) {
        const missing = await mortalitySummary(page, selector);
        assert.equal(missing.total, "n.d.", "Older results without mortality are unknown, never zero");
        assert.deepEqual(missing.breakdown, {
          "Taglie fisiche visibili": "n.d.", "Altre taglie fisiche": "n.d.", "Non classificati": "n.d.",
        });
        assert.match(missing.text, /Mortalità non disponibile/);
        assert.doesNotMatch(missing.text, /Totale popolazione\s*0|Non classificati\s*0|Taglie fisiche visibili\s*0/);
      }
      await verify(page);
      assert.equal((await mortalitySummary(page, desktopMonth(1))).total, "1.234",
        "Restore normal fixtures for the existing browser scenarios");
    });

    await t.test("sales add/edit/delete and hidden-size preservation", async () => {
      await clickText(page, "Piano commerciale (0)");
      await clickText(page, "Aggiungi vendita");
      await page.waitForSelector('[role="dialog"]');
      await typeField(page, "Animali", 1200, '[role="dialog"]');
      await clickText(page, "Applica alla bozza");
      await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
      await waitText(page, "Piano commerciale (1)");
      assert.equal(await isDisabled(page, "Prepara riepilogo commerciale"), true, "Changing sales invalidates freeze");
      await toggle(page, "TP-1000");
      await waitText(page, "1 vendite in taglie nascoste restano nel piano");
      assert.match(await page.$eval(".ca-table tbody", element => element.innerText), /TP-1000[\s\S]*Fuori filtro[\s\S]*1\.200/);
      await verify(page);
      assert.deepEqual(simulations.at(-1).selectedSizeIds, [2]);
      assert.equal(simulations.at(-1).sales.length, 1);
      assert.equal(simulations.at(-1).sales[0].quantity, 1200, "Hidden sale still reaches server replay");
      await clickText(page, "Salva bozza");
      await page.waitForNetworkIdle({ idleTime: 100 });
      assert.equal(scenarios[0].input.sales[0].quantity, 1200, "Hidden sale survives persistence");
      const saleId = scenarios[0].input.sales[0].id;
      await clickSelector(page, `button[aria-label="Modifica o sposta vendita ${saleId}"]`);
      await page.waitForSelector('[role="dialog"]');
      const nextSerial = year * 12 + month;
      const nextYear = Math.floor(nextSerial / 12), nextMonth = nextSerial % 12 + 1;
      await selectField(page, "Mese", `${nextYear}-${nextMonth}`, '[role="dialog"]');
      await typeField(page, "Giorno", 15, '[role="dialog"]');
      await typeField(page, "Animali", 1500, '[role="dialog"]');
      await clickText(page, "Applica alla bozza");
      await verify(page);
      assert.deepEqual(simulations.at(-1).sales, [{ id: saleId, year: nextYear, month: nextMonth, day: 15, sizeId: 1, quantity: 1500 }]);
      await clickText(page, "Mostra le taglie del piano");
      await waitText(page, "Bozza da verificare");
      await page.waitForFunction(() => !document.querySelector(".commercial-workspace")?.innerText.includes("Fuori filtro"));
      await clickSelector(page, `button[aria-label="Elimina vendita ${saleId}"]`);
      await waitText(page, "Piano commerciale (0)");
      await verify(page);
      assert.deepEqual(simulations.at(-1).sales, []);
    });

    await t.test("orders/hatchery switches, retained zero override and invalid joint plan", async () => {
      await toggle(page, "Ordini futuri acquisiti");
      await toggle(page, "Arrivi futuri schiuditoio");
      await toggleAdvanced(page);
      const override = await page.$('.commercial-workspace input[placeholder="Programma base"]');
      await override.type("0"); await override.dispose();
      await verify(page);
      assert.equal(simulations.at(-1).includeOrders, false);
      assert.equal(simulations.at(-1).includeHatchery, true);
      assert.deepEqual(simulations.at(-1).hatcheryOverrides, [{ year, month, quantity: 0 }]);
      await waitText(page, "Scenario senza vincolo ordini.");
      await toggle(page, "Arrivi futuri schiuditoio");
      await verify(page);
      assert.equal(simulations.at(-1).includeHatchery, false);
      assert.deepEqual(simulations.at(-1).hatcheryOverrides, [{ year, month, quantity: 0 }], "Exclusion must not erase override");
      await toggleAdvanced(page);
      invalidNext = true;
      await verify(page);
      await waitText(page, "Il piano non è realizzabile congiuntamente.");
      assert.equal(await isDisabled(page, "Prepara riepilogo commerciale"), true);
      await verify(page);
      assert.equal(await isDisabled(page, "Prepara riepilogo commerciale"), false);
    });

    await t.test("late calculation rejects edited draft and superseded response", async () => {
      delayNext = true;
      await clickText(page, "Verifica disponibilità e piano");
      await page.waitForFunction(() => document.querySelector(".commercial-workspace")?.innerText.includes("Calcolo in corso"));
      while (!pending) await new Promise(resolve => setTimeout(resolve, 10));
      await typeField(page, "Nome della bozza", "Bozza modificata durante replay");
      await pending(); pending = null;
      await waitText(page, "Il risultato tardivo è stato scartato");
      assert.equal(await isDisabled(page, "Prepara riepilogo commerciale"), true);
      assert.equal(await page.$$eval(".commercial-workspace .ca-mono", elements => elements.some(element => element.textContent.includes("98.765"))), false);
      await clickText(page, "Esplora disponibilità");
      await page.click(sizeCell(1));
      await page.waitForSelector('[role="dialog"]');
      const staleDetail = await page.$eval('[role="dialog"]', dialog => dialog.innerText);
      assert.match(staleDetail, /Ricalcola la bozza prima di utilizzare questa quantità/);
      assert.equal(await page.$eval('[role="dialog"] button.ca-button.primary', element => element.disabled), true, "A stale cell cannot start a sale");
      await closeDialog(page);
      await verify(page);
      assert.equal(simulations.at(-1).name, "Bozza modificata durante replay");
      delayNext = true;
      await clickText(page, "Verifica disponibilità e piano");
      while (!pending) await new Promise(resolve => setTimeout(resolve, 10));
      const oldResponse = pending; pending = null;
      await clickText(page, "Ricalcola questa bozza");
      await waitText(page, "Risultato aggiornato");
      await oldResponse();
      // Fetch resolution and React commit are asynchronous; wait for the delayed
      // response to finish, then let the next rendering frame settle.
      await page.waitForNetworkIdle({ idleTime: 100 });
      assert.equal(await page.$$eval(".commercial-workspace .ca-mono", elements => elements.some(element => element.textContent.includes("98.765"))), false);
      assert.equal(await isDisabled(page, "Prepara riepilogo commerciale"), false);
    });

    await t.test("library update, duplication, freezing and immutable historical exports", async () => {
      await clickText(page, "Salva bozza");
      await page.waitForNetworkIdle({ idleTime: 100 });
      assert.equal(scenarios.length, 1, "Active draft updates instead of creating a duplicate");
      assert.equal(scenarios[0].input.name, "Bozza modificata durante replay");
      assert.ok(calls.some(call => call.method === "PUT" && call.path === `${root}/scenarios/${scenarios[0].id}`), "Harness must support real method-override writes");
      await clickText(page, "Duplica");
      await page.waitForNetworkIdle({ idleTime: 100 });
      assert.equal(scenarios.length, 2);
      assert.ok(scenarios[1].input.name.endsWith("— copia"));
      assert.deepEqual(scenarios[1].input.hatcheryOverrides, [{ year, month, quantity: 0 }]);
      await verify(page);
      await clickText(page, "Prepara riepilogo commerciale");
      await waitText(page, "Questa copia è immutabile.");
      assert.equal(summaries.length, 2);
      const freezeCall = calls.find(call => call.method === "POST" && call.path === `${root}/summaries`);
      assert.deepEqual(freezeCall.body, simulations.at(-1), "Freeze sends input for server revalidation, not a client result");
      await clickText(page, "Riepilogo storico", { prefix: true });
      await waitText(page, "HISTORICAL-1000");
      const summaryText = await page.$eval(".commercial-workspace .ca-panel:last-of-type", element => element.innerText);
      assert.match(summaryText, /richiesti 1\.234 \| accettati 1\.234 \| mancanti 0/);
      assert.match(summaryText, /Scenario senza vincolo ordini/);
      // An older API result, like an immutable old summary, may lack this field.
      // Selecting a summary does not replace the live explorer's result.
      omitNextMortality = true;
      await verify(page);
      await clickText(page, "Esplora disponibilità");
      const historicFirstCell = sizeCell(1);
      assert.equal(await page.$eval(historicFirstCell, cell => cell.querySelector(".ca-cell-mortality")?.innerText.trim()), "Mortalità n.d. (sola taglia fisica)");
      await page.click(historicFirstCell);
      await page.waitForSelector('[role="dialog"]');
      const historicalCellDetail = await page.$eval('[role="dialog"]', dialog => dialog.innerText);
      assert.match(historicalCellDetail, /Mancanze non disponibili/);
      assert.doesNotMatch(historicalCellDetail, /Ordini inclusi non coperti · TP-1000: 0|Vendite simulate non soddisfatte · TP-1000: 0/);
      assert.match(historicalCellDetail, /Mortalità della sola taglia fisica non disponibile/);
      assert.doesNotMatch(historicalCellDetail, /Mortalità.*(?:0|1\.234)/);
      await closeDialog(page);
      await clickText(page, "Scenari e riepiloghi");
      await typeField(page, "Nome della bozza", "Modifica live non cambia storico");
      await verify(page);
      assert.equal(await page.$eval(".commercial-workspace .ca-panel:last-of-type", element => element.innerText), summaryText, "Live replay cannot rewrite frozen summary");
      await clickSelector(page, `button[aria-label="Elimina scenario ${scenarios[0].name}"]`);
      await page.waitForNetworkIdle({ idleTime: 100 });
      assert.equal(scenarios.length, 1);
      assert.equal(summaries.length, 2, "Deleting a draft does not delete frozen snapshots");
      await clickText(page, "Excel");
      const excel = await download(directory, ".xlsx", page);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await readFile(excel));
      assert.deepEqual(workbook.worksheets.map(sheet => sheet.name), ["Piano validato", "Ipotesi e avvisi", "Alternative non sommabili"]);
      const planSheet = workbook.getWorksheet("Piano validato");
      assert.deepEqual(planSheet.getRow(1).values.slice(1), ["Data", "Taglia", "Animali richiesti", "Animali accettati", "Animali mancanti"]);
      assert.deepEqual(planSheet.getRow(2).values.slice(1), [referenceDate, "HISTORICAL-1000", 1234, 1234, 0]);
      const notes = workbook.getWorksheet("Ipotesi e avvisi").getColumn(1).values.filter(Boolean).join("\n");
      assert.match(notes, /Scenario senza vincolo ordini/);
      assert.match(notes, /non una garanzia produttiva/);
      const alternatives = workbook.getWorksheet("Alternative non sommabili");
      assert.equal(alternatives.getRow(2).getCell(2).value, "HISTORICAL-1000");
      assert.equal(alternatives.getRow(2).getCell(3).value, 4321);
      assert.equal(alternatives.getRow(2).getCell(4).value, day);
      await clickText(page, "PDF");
      const pdf = await download(directory, ".pdf", page);
      const bytes = await readFile(pdf);
      assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
      assert.ok((await PDFDocument.load(bytes)).getPageCount() >= 1);
      // Installed system utility, no new packages. Independent PDF text oracle.
      const pdfText = execFileSync("pdftotext", [pdf, "-"], { encoding: "utf8" });
      assert.match(pdfText, /HISTORICAL-1000/);
      assert.match(pdfText, /richiesti 1\.234.*accettati 1\.234.*mancanti 0/);
      assert.match(pdfText, /Scenario senza vincolo ordini/);
      assert.match(pdfText, /non una garanzia produttiva/);
      assert.ok(!pdfText.includes("Modifica live non cambia storico"), "PDF must use frozen name");
    });

    await t.test("authenticated mobile matrix and usable sale dialog screenshot", async () => {
      await page.setViewport({ width: 402, height: 874 });
      await dismissToasts(page);
      await clickText(page, "Esplora disponibilità");
      await page.waitForSelector(".ca-desktop-matrix");
      await page.evaluate(() => window.scrollTo(0, 0));
      assert.equal(await page.$eval(".ca-desktop-matrix", element => getComputedStyle(element).display), "none");
      assert.notEqual(await page.$eval(".ca-mobile-matrix", element => getComputedStyle(element).display), "none");
      assert.equal(await page.$$eval(".ca-mobile-matrix .ca-cell", elements => elements.length), 12);
      const mobileWidths = await page.evaluate(() => ({
        viewport: innerWidth, document: document.documentElement.scrollWidth,
        workspace: document.querySelector(".commercial-workspace").getBoundingClientRect().width,
      }));
      assert.ok(mobileWidths.workspace <= 402, "Commercial workspace must fit the phone viewport");
      t.diagnostic(`Mobile widths (viewport/document/workspace): ${JSON.stringify(mobileWidths)}`);
      await page.screenshot({ path: "/tmp/commercial-availability-mobile.jpg" });
      await page.screenshot({ path: "/tmp/commercial-availability-mobile-full.jpg", fullPage: true });
      await page.$eval(".ca-mobile-matrix .ca-cell", element => element.scrollIntoView({ block: "center" }));
      await page.click(".ca-mobile-matrix .ca-cell");
      await page.waitForSelector('[role="dialog"]');
      await clickText(page, "Prova una vendita da questa cella");
      await page.waitForSelector('[role="dialog"] form');
      const quantity = await field(page, "Animali", "input", '[role="dialog"]');
      assert.equal(await quantity.evaluate(element => element.value), "4321");
      await quantity.dispose();
      const bounds = await page.$eval('[role="dialog"]', element => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
      });
      assert.ok(bounds.left >= 0 && bounds.right <= 403 && bounds.top >= 0 && bounds.bottom <= 875, `Mobile dialog outside viewport: ${JSON.stringify(bounds)}`);
      await page.screenshot({ path: "/tmp/commercial-availability-mobile-sale.jpg" });
      await clickText(page, "Annulla");
    });

    await t.test("editable draft, scenario-library and per-scenario Excel exports", async () => {
      await page.setViewport({ width: 1440, height: 1100 });
      await typeField(page, "Nome della bozza", "Workbook saved scenario");
      await clickText(page, "Piano commerciale (0)");
      await clickText(page, "Aggiungi vendita");
      await page.waitForSelector('[role="dialog"]');
      await typeField(page, "Animali", 650, '[role="dialog"]');
      await clickText(page, "Applica alla bozza");
      await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
      const saleId = await page.$eval('button[aria-label^="Modifica o sposta vendita "]', element =>
        element.getAttribute("aria-label").replace("Modifica o sposta vendita ", ""));

      nextShortfallsByMonth = [{ 1: { orders: 7, sales: 11 } }];
      await verify(page);
      await clearWorkbookDownloads(directory);
      await clickText(page, "Excel bozza e piano");
      const freshWorkbook = await downloadWorkbook(directory, page);
      assert.deepEqual(freshWorkbook.worksheets.map(sheet => sheet.name), [
        "Guida", "Disponibilità", "Date disponibilità", "Mancanze ordini",
        "Mancanze vendite", "Morti previsti", "Piano commerciale", "Ipotesi", "Arrivi futuri",
      ]);
      assert.equal(excelKeyValue(freshWorkbook.getWorksheet("Guida"), "Stato del calcolo"), "PIANO VERIFICATO");
      const quotaPolicy = excelKeyValue(freshWorkbook.getWorksheet("Guida"), "Calendario ordini per i nuovi calcoli");
      assert.match(quotaPolicy, /solo quote future valide.*consegne certificate sulla quota/);
      assert.match(quotaPolicy, /Nessun recupero delle sotto-consegne passate e nessun riporto degli scoperti/);
      const exportedWarning = freshWorkbook.getWorksheet("Guida").getRows(1, freshWorkbook.getWorksheet("Guida").rowCount)
        .some(row => row.getCell(1).value === "Avviso" && row.getCell(2).value === quotaWarning);
      assert.ok(exportedWarning, "Draft workbook must retain the actual quota attribution warning");

      const monthHeader = new Intl.DateTimeFormat("it-IT", {
        month: "long", year: "numeric", timeZone: "UTC",
      }).format(new Date(Date.UTC(year, month - 1, 1)));
      const availability = freshWorkbook.getWorksheet("Disponibilità");
      const availabilityColumn = excelHeaders(availability).get(monthHeader);
      assert.ok(availabilityColumn, `Missing availability month column ${monthHeader}`);
      const availabilityRow = availability.getRows(2, availability.rowCount - 1)
        .find(row => String(row.getCell(1).value).startsWith("TP-1000"));
      assert.ok(availabilityRow, "Missing exported size row");
      assert.equal(availabilityRow.getCell(availabilityColumn).value, 4321);
      assert.equal(availability.getColumn(1).width, 31);
      assert.equal(availability.getColumn(2).width, 18);
      assert.equal(availability.views[0].state, "frozen");
      assert.equal(availability.views[0].xSplit, 1);
      assert.equal(availability.views[0].ySplit, 1);
      assert.equal(availability.getRow(1).getCell(1).fill.fgColor.argb, "FF123B47");
      assert.equal(availabilityRow.getCell(availabilityColumn).numFmt, "#,##0");
      assert.equal(freshWorkbook.getWorksheet("Date disponibilità").getRow(availabilityRow.number).getCell(availabilityColumn).value,
        `${referenceDate.slice(0, 7)}-${String(day).padStart(2, "0")}`);
      const orderGap = freshWorkbook.getWorksheet("Mancanze ordini");
      const salesGap = freshWorkbook.getWorksheet("Mancanze vendite");
      const orderRow = orderGap.getRows(2, orderGap.rowCount - 1)
        .find(row => String(row.getCell(1).value).startsWith("TP-1000"));
      const salesGapRow = salesGap.getRows(2, salesGap.rowCount - 1)
        .find(row => String(row.getCell(1).value).startsWith("TP-1000"));
      assert.equal(orderRow.getCell(availabilityColumn).value, 7);
      assert.equal(salesGapRow.getCell(availabilityColumn).value, 11);
      const plan = freshWorkbook.getWorksheet("Piano commerciale");
      const freshSaleRow = excelRow(plan, "ID vendita", saleId);
      assert.equal(excelValue(plan, freshSaleRow, "Animali richiesti"), 650);
      assert.equal(excelValue(plan, freshSaleRow, "Animali accettati"), 650);
      assert.equal(excelValue(plan, freshSaleRow, "Animali mancanti"), 0);
      assert.equal(plan.getColumn(5).width, 21);
      assert.equal(plan.views[0].state, "frozen");
      assert.equal(plan.views[0].ySplit, 1);

      await clickText(page, "Salva bozza");
      await page.waitForNetworkIdle({ idleTime: 100 });
      await clickText(page, "Duplica");
      await page.waitForNetworkIdle({ idleTime: 100 });
      await verify(page);
      await typeField(page, "Nome della bozza", "Unverified current workbook draft");
      await clearWorkbookDownloads(directory);
      await clickText(page, "Excel bozza e piano");
      const staleWorkbook = await downloadWorkbook(directory, page);
      assert.deepEqual(staleWorkbook.worksheets.map(sheet => sheet.name), [
        "Guida", "Piano commerciale", "Ipotesi", "Arrivi futuri",
      ]);
      assert.equal(excelKeyValue(staleWorkbook.getWorksheet("Guida"), "Stato del calcolo"), "BOZZA NON VERIFICATA");
      const stalePlan = staleWorkbook.getWorksheet("Piano commerciale");
      const staleSaleRow = excelRow(stalePlan, "ID vendita", saleId);
      assert.equal(excelValue(stalePlan, staleSaleRow, "Animali richiesti"), 650);
      assert.equal(excelValue(stalePlan, staleSaleRow, "Animali accettati"), null);
      assert.equal(excelValue(stalePlan, staleSaleRow, "Animali mancanti"), null);
      assert.equal(excelValue(stalePlan, staleSaleRow, "Data accettata"), null);
      assert.equal(excelValue(stalePlan, staleSaleRow, "Esito"), "In attesa di ricalcolo");
      assert.equal(stalePlan.views[0].state, "frozen");

      await clickText(page, "Scenari e riepiloghi");
      const liveNameBeforeLibraryExport = await (await field(page, "Nome della bozza")).evaluate(element => element.value);
      await clearWorkbookDownloads(directory);
      await clickText(page, "Excel scenari");
      const libraryWorkbook = await downloadWorkbook(directory, page);
      for (const sheetName of ["Scenari", "Vendite scenari", "Arrivi scenari"]) {
        assert.ok(libraryWorkbook.getWorksheet(sheetName), `Missing scenario-library sheet ${sheetName}`);
      }
      const savedInputs = structuredClone(scenarios);
      const scenarioSheet = libraryWorkbook.getWorksheet("Scenari");
      const salesSheet = libraryWorkbook.getWorksheet("Vendite scenari");
      const arrivalsSheet = libraryWorkbook.getWorksheet("Arrivi scenari");
      for (const saved of savedInputs) {
        const savedRow = excelRow(scenarioSheet, "ID scenario", saved.id);
        assert.equal(excelValue(scenarioSheet, savedRow, "Nome salvato"), saved.name);
        assert.equal(excelValue(scenarioSheet, savedRow, "Stato input"), "Bozza salvata");
        const savedSale = salesSheet.getRows(2, salesSheet.rowCount - 1)
          .find(row => excelValue(salesSheet, row, "ID scenario") === saved.id);
        assert.ok(savedSale, `Library omitted sale input for scenario ${saved.id}`);
        assert.equal(excelValue(salesSheet, savedSale, "ID vendita"), saved.input.sales[0].id);
        assert.equal(excelValue(salesSheet, savedSale, "Animali richiesti"), 650);
        const savedOverride = arrivalsSheet.getRows(2, arrivalsSheet.rowCount - 1)
          .find(row => excelValue(arrivalsSheet, row, "ID scenario") === saved.id);
        assert.ok(savedOverride, `Library omitted overrides for scenario ${saved.id}`);
        assert.equal(excelValue(arrivalsSheet, savedOverride, "Override residuo"), 0);
      }
      assert.equal(scenarioSheet.getColumn(1).width, 18);
      assert.equal(scenarioSheet.views[0].state, "frozen");
      assert.equal(scenarioSheet.views[0].ySplit, 1);

      const selectedScenario = savedInputs[0];
      const simulationCount = simulations.length;
      const writesBeforeExport = calls.filter(call => call.method !== "GET" &&
        call.path.startsWith(root) && call.path !== `${root}/simulate`).length;
      await clearWorkbookDownloads(directory);
      await page.evaluate(name => {
        const target = [...document.querySelectorAll("button[aria-label^='Esporta Excel scenario ']")]
          .find(element => element.getAttribute("aria-label") === `Esporta Excel scenario ${name}`);
        if (!target) throw new Error(`Missing Excel export action for ${name}`);
        target.click();
      }, selectedScenario.name);
      const scenarioWorkbook = await downloadWorkbook(directory, page);
      assert.deepEqual(scenarioWorkbook.worksheets.map(sheet => sheet.name), [
        "Guida", "Disponibilità", "Date disponibilità", "Mancanze ordini",
        "Mancanze vendite", "Morti previsti", "Piano commerciale", "Ipotesi", "Arrivi futuri",
      ]);
      assert.equal(simulations.length, simulationCount + 1, "Individual scenario export recalculates its current-month input");
      assert.deepEqual(simulations.at(-1), selectedScenario.input, "Scenario export simulates the saved input, not the live draft");
      assert.equal(calls.filter(call => call.method !== "GET" &&
        call.path.startsWith(root) && call.path !== `${root}/simulate`).length, writesBeforeExport,
      "Scenario export must not persist or otherwise mutate saved inputs");
      assert.equal(await (await field(page, "Nome della bozza")).evaluate(element => element.value),
        liveNameBeforeLibraryExport, "Scenario export must leave the current live draft unchanged");
      assert.equal(await isDisabled(page, "Prepara riepilogo commerciale"), true, "Scenario export does not refresh the stale live draft");

      await dismissToasts(page);
      await clickText(page, "Piano commerciale (1)");
      await clickSelector(page, `button[aria-label="Elimina vendita ${saleId}"]`);
      await waitText(page, "Piano commerciale (0)");
    });

    assert.deepEqual(failures, []);
    assert.ok(!calls.some(call => !call.path.startsWith(root) && call.method !== "GET"), "No operational API writes");
    await page.close();
  } finally {
    await browser?.close();
    await server.close();
    await rm(directory, { recursive: true, force: true });
  }
});