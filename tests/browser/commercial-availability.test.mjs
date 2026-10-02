import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
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

// Synthetic, isolated API fixtures. These deliberately do not import any production
// calculation/presentation helpers: this suite tests rendered UI and request contracts,
// not the biological replay (which is covered by server tests).
function resultFor(input, { capacity = 4321, invalid = false, historical = false, shortfallsByMonth = [] } = {}) {
  const months = Array.from({ length: input.horizon }, (_, index) => {
    const serial = input.startYear * 12 + input.startMonth - 1 + index;
    return {
      year: Math.floor(serial / 12), month: serial % 12 + 1,
      availableBySize: { 1: capacity, 2: 0 },
      availabilityDayBySize: { 1: index === 0 ? day : 15 },
      ...(shortfallsByMonth[index] === undefined ? {} : { shortfallsBySize: shortfallsByMonth[index] }),
      ordersRequested: 100, ordersFulfilled: 100, orderShortfall: 0,
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
    baselineOrderShortfall: 0, orderShortfall: 0,
    hatcheryDependent: input.includeHatchery, warnings: [], calculationMs: 25,
  };
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
    let delayNext = false, invalidNext = false, pending = null, nextShortfallsByMonth = null;
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
          "/api/users/current": { success: true, user: { id: 1, username: "commercial-browser-fixture", role: "user" } },
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
          });
          nextShortfallsByMonth = null;
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

    await t.test("availability cells show scaled, separately explained order and sales shortfalls", async () => {
      nextShortfallsByMonth = [
        { 1: { orders: 12, sales: 34 }, 2: { orders: 0, sales: 0 } },
        { 1: { orders: 5, sales: 0 }, 2: { orders: 20, sales: 30 } },
      ];
      await verify(page);

      const firstSizeFirstMonth = ".ca-desktop-matrix tbody tr:nth-child(1) td:nth-of-type(1) .ca-cell";
      const secondSizeFirstMonth = ".ca-desktop-matrix tbody tr:nth-child(2) td:nth-of-type(1) .ca-cell";
      const secondSizeSecondMonth = ".ca-desktop-matrix tbody tr:nth-child(2) td:nth-of-type(2) .ca-cell";
      const firstCellLines = await page.$eval(firstSizeFirstMonth, cell => cell.innerText.split("\n").map(line => line.trim()));
      assert.ok(firstCellLines.includes("Mancano 46"), `Order and sale shortfalls must add to 46: ${firstCellLines}`);
      const noDeficitLines = await page.$eval(secondSizeFirstMonth, cell => cell.innerText.split("\n").map(line => line.trim()));
      assert.ok(!noDeficitLines.some(line => line.startsWith("Mancano ")), "Zero availability without shortfalls must not fabricate a deficit");
      assert.ok(!noDeficitLines.includes("Mancano 0"), "An explicit zero shortfall must not render a deficit");
      const positiveDeficitLines = await page.$eval(secondSizeSecondMonth, cell => cell.innerText.split("\n").map(line => line.trim()));
      assert.ok(positiveDeficitLines.includes("Mancano 50"), `A zero-capacity cell with unmet demand must show the deficit: ${positiveDeficitLines}`);

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
      await page.click(firstSizeFirstMonth);
      await page.waitForSelector('[role="dialog"]');
      const detailText = await page.$eval('[role="dialog"]', dialog => dialog.innerText);
      assert.match(detailText, /4\.321 animali/);
      assert.match(detailText, /dal .*\b\d{1,2}\b/i, "Positive availability keeps its earlier reachable date");
      assert.match(detailText, /Ordini inclusi non coperti: 12/);
      assert.match(detailText, /Vendite simulate non soddisfatte: 34/);
      assert.ok(!detailText.includes("Ordini inclusi non coperti: 46"));
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));

      await page.click(secondSizeSecondMonth);
      await page.waitForSelector('[role="dialog"]');
      const zeroCapacityDetail = await page.$eval('[role="dialog"]', dialog => dialog.innerText);
      assert.match(zeroCapacityDetail, /Ordini inclusi non coperti: 20/);
      assert.match(zeroCapacityDetail, /Vendite simulate non soddisfatte: 30/);
      assert.equal(await page.$eval('[role="dialog"] button.ca-button.primary', element => element.disabled), true);
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));

      await page.setViewport({ width: 402, height: 874 });
      await page.waitForFunction(() => getComputedStyle(document.querySelector(".ca-mobile-matrix")).display !== "none");
      await page.screenshot({ path: "/tmp/commercial-availability-shortfalls-mobile.jpg" });
      await page.setViewport({ width: 1440, height: 1100 });
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
      await page.click(`button[aria-label="Modifica o sposta vendita ${saleId}"]`);
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
      await page.click(`button[aria-label="Elimina vendita ${saleId}"]`);
      await waitText(page, "Piano commerciale (0)");
      await verify(page);
      assert.deepEqual(simulations.at(-1).sales, []);
    });

    await t.test("orders/hatchery switches, retained zero override and invalid joint plan", async () => {
      await toggle(page, "Ordini futuri acquisiti");
      await toggle(page, "Arrivi futuri schiuditoio");
      await page.click(".commercial-workspace details > summary");
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
      await page.click(".commercial-workspace details > summary");
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
      await page.click(".ca-desktop-matrix tbody tr:nth-child(1) td:nth-of-type(1) .ca-cell");
      await page.waitForSelector('[role="dialog"]');
      const staleDetail = await page.$eval('[role="dialog"]', dialog => dialog.innerText);
      assert.match(staleDetail, /Ricalcola la bozza prima di utilizzare questa quantità/);
      assert.equal(await page.$eval('[role="dialog"] button.ca-button.primary', element => element.disabled), true, "A stale cell cannot start a sale");
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
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
      await clickText(page, "Esplora disponibilità");
      await page.click(".ca-desktop-matrix tbody tr:nth-child(1) td:nth-of-type(1) .ca-cell");
      await page.waitForSelector('[role="dialog"]');
      const historicalCellDetail = await page.$eval('[role="dialog"]', dialog => dialog.innerText);
      assert.match(historicalCellDetail, /Mancanze non disponibili/);
      assert.doesNotMatch(historicalCellDetail, /Ordini inclusi non coperti: 0|Vendite simulate non soddisfatte: 0/);
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
      await clickText(page, "Scenari e riepiloghi");
      await typeField(page, "Nome della bozza", "Modifica live non cambia storico");
      await verify(page);
      assert.equal(await page.$eval(".commercial-workspace .ca-panel:last-of-type", element => element.innerText), summaryText, "Live replay cannot rewrite frozen summary");
      await page.click(`button[aria-label="Elimina scenario ${scenarios[0].name}"]`);
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
      for (const close of await page.$$("[toast-close]")) {
        await close.click(); await close.dispose();
      }
      await page.waitForFunction(() => !document.querySelector('[data-state="open"][toast-close]') &&
        ![...document.querySelectorAll("[toast-close]")].some(element => element.closest('[data-state="open"]')));
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
    assert.deepEqual(failures, []);
    assert.ok(!calls.some(call => !call.path.startsWith(root) && call.method !== "GET"), "No operational API writes");
    await page.close();
  } finally {
    await browser?.close();
    await server.close();
    await rm(directory, { recursive: true, force: true });
  }
});