/** Read-only real-source benchmark. Prints timing/count aggregates only.
 * Run: npx tsx server/modules/planning/commercial-availability/benchmark.ts */
export {};
const print = console.log.bind(console);
let stage = "imports";
console.log = console.info = console.warn = console.error = () => {};
try {
  const [{ getCommercialInputs, simulateCommercial, toScenarioInput }, { loadWorlds }, { projectWorld }] = await Promise.all([
    import("./service"), import("../sales-scenarios/service"), import("../sales-scenarios/engine"),
  ]);
  stage = "catalog";
  const catalog = await getCommercialInputs();
  const includeOrders = !process.argv.includes("--without-orders");
  const input = { ...catalog.defaults, selectedSizeIds: catalog.sizes.slice(0, 3).map(s => s.id), includeHatchery: true, includeOrders };
  const legacy = toScenarioInput(input);
  let started = performance.now();
  stage = "legacy-sources";
  const beforeWorlds = await loadWorlds(legacy, false, includeOrders ? undefined : { includeOrders: false, includeHatchery: true, hatcheryOverrides: [] });
  const preparationMs = Math.round(performance.now() - started);
  started = performance.now();
  stage = "legacy-projection";
  projectWorld(beforeWorlds.expected, legacy);
  projectWorld(beforeWorlds.prudent, legacy);
  const legacyProjectionMs = Math.round(performance.now() - started);
  started = performance.now();
  stage = "commercial-cold";
  const result = await simulateCommercial(input, "__readonly_benchmark", true);
  const commercialColdMs = Math.round(performance.now() - started);
  started = performance.now();
  stage = "commercial-reuse";
  await simulateCommercial({ ...input, name: "Benchmark modificato" }, "__readonly_benchmark");
  const reusedTrajectoriesMs = Math.round(performance.now() - started);
  print(JSON.stringify({ mode: includeOrders ? "with-orders" : "without-orders", horizon: input.horizon, requestedSizes: input.selectedSizeIds.length, cohorts: beforeWorlds.expected.cohorts.length, protectedOrders: beforeWorlds.expected.orders.length, preparationMs, biologyMainThreadMs: beforeWorlds.timings?.biologyMainThreadMs, legacyProjectionMs, commercialColdMs, reusedTrajectoriesMs, valid: result.valid }));
  process.exit(0);
} catch (error) {
  const e = error as { message?: string; code?: string };
  const category = /quantità totali non riconciliate/.test(e.message ?? "") ? "unreconciled-order-quantity"
    : /data consegna|Data consegna/.test(e.message ?? "") ? "missing-order-date"
    : /fonte|database|connect|ECONN|password/i.test(e.message ?? "") ? "source-unavailable"
    : /troppo|budget|compless/.test(e.message ?? "") ? "compute-budget"
    : /Taglia|taglia|range/.test(e.message ?? "") ? "size-validation" : "other-validation";
  print(JSON.stringify({ error: "Benchmark non completato; nessun dato operativo stampato.", stage, category, ...(e.code && /^[A-Z0-9]{5}$/.test(e.code) ? { sqlState: e.code } : {}) }));
  process.exit(1);
}