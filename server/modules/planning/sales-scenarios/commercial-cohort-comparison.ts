import { access, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as currentEngine from "./engine";
import { scenarioInputSchema, type ScenarioInput, type ScenarioSale } from "../../../../shared/sales-scenarios";
import type { ProposalTimings, World } from "./engine";

const directory = dirname(fileURLToPath(import.meta.url));
const baselinePath = resolve(directory, ".commercial-cohort-engine-baseline.ts");
const serviceLoaderPath = resolve(directory, ".commercial-cohort-service-loader.ts");
let createdBaseline = false;
let createdServiceLoader = false;
let closeConnections: (() => Promise<void>) | undefined;
let stage = "comparison setup";

type EngineModule = typeof import("./engine");
type ServiceLoader = {
  getInputs(): Promise<{ defaults: ScenarioInput }>;
  loadWorlds(input: ScenarioInput, automatic?: boolean): Promise<{ expected: World; prudent: World }>;
  closeComparisonConnections(): Promise<void>;
};
type Summary = {
  uncoveredOrderQuantity: number;
  ordersWithShortfall: number;
  manualSalesAccepted: number;
  seedingAccepted: number;
  receiptsByDeadline: number;
  proposalReceiptsByDeadline: number;
};
type AllocationRow = {
  acceptedQuantity: number;
  day: number;
  kind: "manualSale" | "nurserySeeding" | "proposalSale";
};
type RunRows = {
  orders: Map<string, number>;
  allocations: Map<string, AllocationRow>;
};
type SimulationResult = { summary: Summary; rows: RunRows };
type EngineRun = {
  normal: { expected: SimulationResult; prudent: SimulationResult };
  proposal: {
    rows: number;
    timeLimited: boolean;
    candidatesEvaluated: number;
    plansEvaluated: number;
    expected: SimulationResult;
    prudent: SimulationResult;
    worstCaseReceiptsByDeadline: number;
    worstCaseProposalReceiptsByDeadline: number;
  };
  timingMs: { normalSimulation: number; proposalSimulation: number; total: number };
};

async function exists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function replaceExactlyOnce(source: string, before: string, after: string) {
  if (source.split(before).length !== 2) throw new Error("Required comparison source text was not found exactly once.");
  return source.replace(before, after);
}

function safeFailureCategory(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/password|connection|connect |ECONN|postgres|neon/i.test(message)) return "database or source connection unavailable";
  if (/scenario deve iniziare nel mese corrente/i.test(message)) return "input does not start in the current business month";
  if (/database ordini non disponibile/i.test(message)) return "orders source unavailable";
  if (/data consegna assente\/non valida/i.test(message)) return "an active order has an invalid delivery date";
  if (/taglia non riconosciuta/i.test(message)) return "an active order has an unrecognized size";
  if (/ordini oltre 60 mesi/i.test(message)) return "an order exceeds the supported protection horizon";
  if (/range taglia non valido/i.test(message)) return "a required size range is missing";
  if (/SGR mancante|SGR non configurati/i.test(message)) return "required growth data missing";
  if (/taglia sconosciuta/i.test(message)) return "scenario requests an unrecognized size";
  if (/inventario con quantità o peso non valido/i.test(message)) return "real inventory contains invalid quantities or weights";
  if (/schiuditoio .* priva di range/i.test(message)) return "hatchery arrivals lack a required size range";
  if (/troppo ampio|troppo articolato|troppo complessa/i.test(message)) return "real scenario exceeds calculation limits";
  if (/prezzo positivo|price/i.test(message)) return "proposal price missing or invalid";
  const name = error instanceof Error ? error.name : typeof error;
  return `unclassified ${name} failure`;
}

function serviceLoaderSource(source: string) {
  let loader = replaceExactlyOnce(
    source,
    "async function loadWorlds(",
    "export async function loadWorlds(",
  );
  loader = replaceExactlyOnce(
    loader,
    'import { db } from "../../../db";',
    'import { db, pool } from "../../../db";',
  );
  loader = replaceExactlyOnce(
    loader,
    'import { dbEsterno, isDbEsternoAvailable } from "../../../db-esterno";',
    'import { dbEsterno, isDbEsternoAvailable, poolEsterno } from "../../../db-esterno";',
  );
  return `${loader}
pool.on("error", () => undefined);
poolEsterno?.on("error", () => undefined);
export async function closeComparisonConnections() {
  await Promise.all([
    pool.end().catch(() => undefined),
    ...(poolEsterno ? [poolEsterno.end().catch(() => undefined)] : []),
  ]);
}
`;
}

function simulate(
  engine: EngineModule,
  world: World,
  input: ScenarioInput,
  proposals: ScenarioSale[],
): SimulationResult {
  const requestedSales = [...input.sales, ...proposals];
  const accepted = engine.allocateScenario(world, { ...input, sales: requestedSales });
  const replay = engine.replay(world, accepted);
  const applied = replay.applied;
  const first = engine.monthNumber(input.startYear, input.startMonth);
  const deadline = engine.monthNumber(input.cashDeadline.year, input.cashDeadline.month);
  const proposalIds = new Set(proposals.map(sale => sale.id));
  const manualIds = new Set(input.sales.map(sale => sale.id));
  let receiptsByDeadline = 0;
  let proposalReceiptsByDeadline = 0;
  for (const sale of accepted) {
    if (sale.nursery) continue;
    const receiptMonth = engine.monthNumber(sale.year, sale.month) + sale.paymentDelayMonths;
    if (receiptMonth < first || receiptMonth > deadline) continue;
    const receipt = (applied[sale.id] ?? 0) * (sale.pricePerThousand ?? 0) / 1000;
    receiptsByDeadline += receipt;
    if (proposalIds.has(sale.id)) proposalReceiptsByDeadline += receipt;
  }

  const orders = new Map(world.orders.map(order => [order.key, replay.orders[order.key] ?? 0]));
  const allocations = new Map<string, AllocationRow>();
  for (const sale of accepted) {
    const month = engine.monthNumber(sale.year, sale.month);
    allocations.set(sale.id, {
      acceptedQuantity: applied[sale.id] ?? 0,
      day: sale.day ?? (month === world.first ? world.startDay ?? 1 : 1),
      kind: manualIds.has(sale.id) ? "manualSale" : sale.nursery ? "nurserySeeding" : "proposalSale",
    });
  }
  return {
    summary: {
      uncoveredOrderQuantity: world.orders.reduce(
        (total, order) => total + Math.max(0, order.quantity - (replay.orders[order.key] ?? 0)),
        0,
      ),
      ordersWithShortfall: world.orders.filter(order => (replay.orders[order.key] ?? 0) < order.quantity).length,
      manualSalesAccepted: input.sales.reduce((total, sale) => total + (applied[sale.id] ?? 0), 0),
      seedingAccepted: accepted.filter(sale => sale.nursery)
        .reduce((total, sale) => total + (applied[sale.id] ?? 0), 0),
      receiptsByDeadline,
      proposalReceiptsByDeadline,
    },
    rows: { orders, allocations },
  };
}

function runEngine(engine: EngineModule, expected: World, prudent: World, input: ScenarioInput): EngineRun {
  const started = performance.now();
  const deadlineMs = Date.now() + 90_000;
  const expectedWorld = { ...expected, deadlineMs };
  const prudentWorld = { ...prudent, deadlineMs };
  const normalStarted = performance.now();
  const normalExpected = simulate(engine, expectedWorld, input, []);
  const normalPrudent = simulate(engine, prudentWorld, input, []);
  const normalSimulationMs = Math.round(performance.now() - normalStarted);
  const timings: ProposalTimings = { allocationMs: 0, candidateReplayMs: 0, receiptReplayMs: 0 };
  const proposalStarted = performance.now();
  const proposals = engine.proposeSales(expectedWorld, prudentWorld, input, timings);
  const proposalExpected = simulate(engine, expectedWorld, input, proposals);
  const proposalPrudent = simulate(engine, prudentWorld, input, proposals);
  return {
    normal: { expected: normalExpected, prudent: normalPrudent },
    proposal: {
      rows: proposals.length,
      timeLimited: timings.optimization?.timeLimited ?? false,
      candidatesEvaluated: timings.optimization?.candidatesEvaluated ?? 0,
      plansEvaluated: timings.optimization?.plansEvaluated ?? 0,
      expected: proposalExpected,
      prudent: proposalPrudent,
      worstCaseReceiptsByDeadline: Math.min(
        proposalExpected.summary.receiptsByDeadline,
        proposalPrudent.summary.receiptsByDeadline,
      ),
      worstCaseProposalReceiptsByDeadline: Math.min(
        proposalExpected.summary.proposalReceiptsByDeadline,
        proposalPrudent.summary.proposalReceiptsByDeadline,
      ),
    },
    timingMs: {
      normalSimulation: normalSimulationMs,
      proposalSimulation: Math.round(performance.now() - proposalStarted),
      total: Math.round(performance.now() - started),
    },
  };
}

function compareOrderRows(before: Map<string, number>, after: Map<string, number>) {
  const keys = new Set([...before.keys(), ...after.keys()]);
  let changedRows = 0, lessFulfilledRows = 0, moreFulfilledRows = 0;
  let totalAbsoluteQuantityChange = 0, totalQuantityLoss = 0, totalQuantityGain = 0;
  for (const key of keys) {
    const delta = (after.get(key) ?? 0) - (before.get(key) ?? 0);
    if (!delta) continue;
    changedRows++;
    totalAbsoluteQuantityChange += Math.abs(delta);
    if (delta < 0) { lessFulfilledRows++; totalQuantityLoss -= delta; }
    else { moreFulfilledRows++; totalQuantityGain += delta; }
  }
  return { rowsCompared: keys.size, changedRows, lessFulfilledRows, moreFulfilledRows,
    totalAbsoluteQuantityChange, totalQuantityLoss, totalQuantityGain };
}

function compareAllocationRows(before: Map<string, AllocationRow>, after: Map<string, AllocationRow>) {
  const keys = new Set([...before.keys(), ...after.keys()]);
  const categories = ["manualSale", "nurserySeeding", "proposalSale"] as const;
  const byType = Object.fromEntries(categories.map(kind => [kind, {
    rowsCompared: 0, changedRows: 0, acceptedQuantityReducedRows: 0,
    acceptedQuantityIncreasedRows: 0, allocationDayChangedRows: 0,
    totalAbsoluteAcceptedQuantityChange: 0,
  }])) as Record<typeof categories[number], {
    rowsCompared: number; changedRows: number; acceptedQuantityReducedRows: number;
    acceptedQuantityIncreasedRows: number; allocationDayChangedRows: number;
    totalAbsoluteAcceptedQuantityChange: number;
  }>;
  for (const key of keys) {
    const oldRow = before.get(key), newRow = after.get(key);
    const totals = byType[(newRow ?? oldRow)!.kind];
    const delta = (newRow?.acceptedQuantity ?? 0) - (oldRow?.acceptedQuantity ?? 0);
    const dayChanged = !!oldRow && !!newRow && oldRow.day !== newRow.day;
    totals.rowsCompared++;
    if (delta || dayChanged) totals.changedRows++;
    if (delta < 0) totals.acceptedQuantityReducedRows++;
    if (delta > 0) totals.acceptedQuantityIncreasedRows++;
    if (dayChanged) totals.allocationDayChangedRows++;
    totals.totalAbsoluteAcceptedQuantityChange += Math.abs(delta);
  }
  return { rowsCompared: keys.size, byType };
}

function compareRows(before: EngineRun, after: EngineRun) {
  const comparison = (a: SimulationResult, b: SimulationResult) => ({
    perOrder: compareOrderRows(a.rows.orders, b.rows.orders),
    perAllocation: compareAllocationRows(a.rows.allocations, b.rows.allocations),
  });
  return {
    normalSimulation: {
      expected: comparison(before.normal.expected, after.normal.expected),
      prudent: comparison(before.normal.prudent, after.normal.prudent),
    },
    proposalSimulation: {
      expected: comparison(before.proposal.expected, after.proposal.expected),
      prudent: comparison(before.proposal.prudent, after.proposal.prudent),
    },
  };
}

function delta(before: Summary, after: Summary) {
  return {
    uncoveredOrderQuantity: after.uncoveredOrderQuantity - before.uncoveredOrderQuantity,
    ordersWithShortfall: after.ordersWithShortfall - before.ordersWithShortfall,
    manualSalesAccepted: after.manualSalesAccepted - before.manualSalesAccepted,
    seedingAccepted: after.seedingAccepted - before.seedingAccepted,
    receiptsByDeadline: after.receiptsByDeadline - before.receiptsByDeadline,
    proposalReceiptsByDeadline: after.proposalReceiptsByDeadline - before.proposalReceiptsByDeadline,
  };
}

function aggregateDelta(before: EngineRun, after: EngineRun) {
  return {
    normalSimulation: {
      expected: delta(before.normal.expected.summary, after.normal.expected.summary),
      prudent: delta(before.normal.prudent.summary, after.normal.prudent.summary),
    },
    proposalSimulation: {
      expected: delta(before.proposal.expected.summary, after.proposal.expected.summary),
      prudent: delta(before.proposal.prudent.summary, after.proposal.prudent.summary),
      proposalRows: after.proposal.rows - before.proposal.rows,
      worstCaseReceiptsByDeadline: after.proposal.worstCaseReceiptsByDeadline
        - before.proposal.worstCaseReceiptsByDeadline,
      worstCaseProposalReceiptsByDeadline: after.proposal.worstCaseProposalReceiptsByDeadline
        - before.proposal.worstCaseProposalReceiptsByDeadline,
    },
  };
}

function publicRun(run: EngineRun) {
  return {
    normalSimulation: {
      expected: run.normal.expected.summary,
      prudent: run.normal.prudent.summary,
    },
    proposalSimulation: {
      proposalRows: run.proposal.rows,
      proposalSearch: {
        timeLimited: run.proposal.timeLimited,
        candidatesEvaluated: run.proposal.candidatesEvaluated,
        plansEvaluated: run.proposal.plansEvaluated,
      },
      expected: run.proposal.expected.summary,
      prudent: run.proposal.prudent.summary,
      worstCaseReceiptsByDeadline: run.proposal.worstCaseReceiptsByDeadline,
      worstCaseProposalReceiptsByDeadline: run.proposal.worstCaseProposalReceiptsByDeadline,
    },
  };
}

function workload(input: ScenarioInput, expected: World, prudent: World) {
  return {
    horizonMonths: input.horizon,
    selectedSizes: input.selectedSizeIds?.length ?? 0,
    expectedCohorts: expected.cohorts.length,
    prudentCohorts: prudent.cohorts.length,
    acquiredOrders: expected.orders.length,
    manualSaleRows: input.sales.length,
    manualSaleQuantity: input.sales.reduce((total, sale) => total + sale.quantity, 0),
    seedingRows: input.sandNursery.length,
    seedingQuantity: input.sandNursery.reduce((total, seed) => total + seed.quantity, 0),
  };
}

async function main() {
  stage = "checking temporary-file safety";
  if (await exists(baselinePath) || await exists(serviceLoaderPath)) {
    throw new Error("A temporary comparison file already exists; comparison cannot run safely.");
  }
  const inputPath = process.argv[2];
  if (process.argv.length > 3) throw new Error("Provide at most one scenario-input JSON path.");

  stage = "deriving the original commercial comparator";
  const source = await readFile(resolve(directory, "engine.ts"), "utf8");
  const baselineSource = replaceExactlyOnce(
    source,
    "return (historicPreference ? a.apk - b.apk : b.apk - a.apk) || a.i - b.i;",
    "return a.apk - b.apk || a.i - b.i;",
  );
  await writeFile(baselinePath, baselineSource, { flag: "wx" });
  createdBaseline = true;
  const baselineEngine = await import(pathToFileURL(baselinePath).href) as EngineModule;

  stage = "preparing read-only service loader";
  const serviceSource = await readFile(resolve(directory, "service.ts"), "utf8");
  await writeFile(serviceLoaderPath, serviceLoaderSource(serviceSource), { flag: "wx" });
  createdServiceLoader = true;
  const service = await import(pathToFileURL(serviceLoaderPath).href) as ServiceLoader;
  closeConnections = () => service.closeComparisonConnections();

  stage = "loading default scenario inputs";
  const defaults = scenarioInputSchema.parse((await service.getInputs()).defaults);
  const scenarios: { label: string; input: ScenarioInput }[] = [{ label: "default", input: defaults }];
  if (inputPath) {
    const provided = scenarioInputSchema.parse(
      JSON.parse(await readFile(resolve(process.cwd(), inputPath), "utf8")),
    );
    scenarios.push({
      label: provided.sales.length && provided.sandNursery.length
        ? "provided-manual-and-seeding-input"
        : "provided-input",
      input: provided,
    });
  }
  for (const scenario of scenarios) {
    if (!scenario.input.proposalPrices.some(price => Number.isFinite(price.pricePerThousand) && price.pricePerThousand > 0)) {
      throw new Error("Every compared scenario needs at least one positive proposal price.");
    }
  }

  const results: Record<string, unknown>[] = [];
  const pending: {
    label: string;
    input: ScenarioInput;
    expected: World;
    prudent: World;
    worldLoadMs: number;
    started: number;
  }[] = [];
  let failures = 0;
  for (const scenario of scenarios) {
    stage = `loading full live scenario worlds for ${scenario.label}`;
    const started = performance.now();
    try {
      const worldLoadStarted = performance.now();
      const { expected, prudent } = await service.loadWorlds(scenario.input, true);
      pending.push({
        label: scenario.label,
        input: scenario.input,
        expected,
        prudent,
        worldLoadMs: Math.round(performance.now() - worldLoadStarted),
        started,
      });
    } catch (error) {
      failures++;
      results.push({
        label: scenario.label,
        status: "failed",
        stage,
        category: safeFailureCategory(error),
      });
    }
  }
  // Close read-only database pools before the comparatively expensive proposal search.
  await closeConnections?.().catch(() => undefined);
  closeConnections = undefined;

  for (const item of pending) {
    stage = `comparing normal and proposal simulations for ${item.label}`;
    try {
      const baselineStarted = performance.now();
      const before = runEngine(baselineEngine, item.expected, item.prudent, item.input);
      const baselineMs = Math.round(performance.now() - baselineStarted);
      const currentStarted = performance.now();
      const after = runEngine(currentEngine, item.expected, item.prudent, item.input);
      const currentMs = Math.round(performance.now() - currentStarted);
      const rowComparison = compareRows(before, after);
      const changes = aggregateDelta(before, after);
      const regressions: string[] = [];
      for (const [phase, worlds] of Object.entries(rowComparison)) {
        for (const [hypothesis, rows] of Object.entries(worlds)) {
          if (rows.perOrder.lessFulfilledRows > 0) regressions.push(`${phase}/${hypothesis}: acquired order coverage reduced`);
          for (const kind of ["manualSale", "nurserySeeding"] as const) {
            if (rows.perAllocation.byType[kind].acceptedQuantityReducedRows > 0) {
              regressions.push(`${phase}/${hypothesis}: fixed ${kind} quantity reduced`);
            }
          }
        }
      }
      // Animal rounding may change a sub-cent overshoot of the same cash goal.
      if (changes.proposalSimulation.worstCaseReceiptsByDeadline < -0.01) regressions.push("proposal: worst-world receipts reduced");
      if (regressions.length) failures++;
      results.push({
        label: item.label,
        status: regressions.length ? "regression" : "complete",
        regressions,
        scope: "full live read-only scenario",
        timingMs: {
          worldLoad: item.worldLoadMs,
          baseline: before.timingMs,
          current: after.timingMs,
          baselineSimulation: baselineMs,
          currentSimulation: currentMs,
          total: Math.round(performance.now() - item.started),
        },
        workload: workload(item.input, item.expected, item.prudent),
        before: publicRun(before),
        after: publicRun(after),
        perOrderAndAllocationComparison: rowComparison,
        aggregateDeltaAfterMinusBefore: changes,
      });
    } catch (error) {
      failures++;
      results.push({
        label: item.label,
        status: "failed",
        stage,
        category: safeFailureCategory(error),
      });
    }
  }

  console.log(JSON.stringify({
    status: failures ? "partial-or-failed" : "complete",
    readOnly: true,
    comparison: "same engine source with original vs current commercial comparator",
    includesNormalSimulationWithoutProposals: true,
    includesProposalSimulation: true,
    scenarios: results,
  }, null, 2));
  if (failures) process.exitCode = 1;
}

try {
  await main();
} catch (error) {
  console.error(JSON.stringify({
    status: "failed",
    stage,
    category: safeFailureCategory(error),
    detail: "Detailed errors are suppressed to avoid exposing scenario data or credentials.",
  }));
  process.exitCode = 1;
} finally {
  await Promise.all([
    closeConnections?.().catch(() => undefined),
    ...(createdServiceLoader ? [unlink(serviceLoaderPath).catch(() => undefined)] : []),
    ...(createdBaseline ? [unlink(baselinePath).catch(() => undefined)] : []),
  ]);
}