import test from "node:test";
import assert from "node:assert/strict";
import { allocateScenario, monthNumber, monthParts, proposeSales, proposeSalesGreedyBaseline, projectWorld, replay, type World } from "./engine";
import { scenarioInputSchema, type ScenarioInput, type ScenarioSale } from "../../../../shared/sales-scenarios";

// Independent reference using the original one-baseline-replay-per-day search.
function oldBest(world: World, accepted: ScenarioSale[], candidate: ScenarioSale, upper: number) {
  const n = monthNumber(candidate.year, candidate.month);
  const firstDay = n === world.first ? world.startDay ?? 1 : 1;
  const days = new Set([firstDay]);
  for (const cohort of world.cohorts) {
    const p = cohort.path[n];
    if (!p) continue;
    for (const [text, state] of Object.entries(p.days ?? {}).sort(([a], [b]) => Number(a) - Number(b))) {
      const day = Number(text);
      if (day <= firstDay) continue;
      const limit = world.maxApk[`${n}|${candidate.sizeId}`] ?? -1;
      if (state.animalsPerKg <= limit && (p.days?.[day - 1]?.animalsPerKg ?? Infinity) > limit) days.add(day);
    }
  }
  let best = { quantity: 0, day: firstDay };
  for (const day of [...days].sort((a, b) => a - b)) {
    const reference = replay(world, accepted, { n, day });
    const feasible = (q: number) => {
      const trial = replay(world, [...accepted, { ...candidate, day, quantity: q }]);
      return (trial.applied[candidate.id] ?? 0) >= q
        && Object.entries(reference.orders).every(([id, used]) => (trial.orders[id] ?? 0) >= used)
        && Object.entries(reference.applied).every(([id, used]) => (trial.applied[id] ?? 0) >= used);
    };
    let lo = 0, hi = Math.max(0, Math.floor(Math.min(upper, reference.dayStock?.[candidate.sizeId] ?? 0)));
    if (hi !== 0 && !feasible(hi)) {
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (feasible(mid)) lo = mid;
        else hi = mid - 1;
      }
      hi = lo;
    }
    if (hi > best.quantity) best = { quantity: hi, day };
  }
  return best;
}

function oldAllocate(world: World, input: ScenarioInput) {
  const accepted: ScenarioSale[] = [];
  for (const candidate of [...input.sales].sort((a, b) =>
    monthNumber(a.year, a.month) - monthNumber(b.year, b.month))) {
    accepted.push({ ...candidate, ...oldBest(world, accepted, candidate, candidate.quantity) });
  }
  return accepted;
}

function oldProposal(expected: World, prudent: World, input: ScenarioInput) {
  const proposed: ScenarioSale[] = [];
  const first = monthNumber(input.startYear, input.startMonth);
  const deadline = monthNumber(input.cashDeadline.year, input.cashDeadline.month);
  const prices = input.proposalPrices.filter(p => expected.sizes.includes(p.sizeId) && prudent.sizes.includes(p.sizeId))
    .sort((a, b) => b.pricePerThousand - a.pricePerThousand || a.sizeId - b.sizeId);
  let next = { ...input, sales: input.sales.slice() };
  if (next.sales.length >= 100) return proposed;
  let prudentAccepted = oldAllocate(prudent, next);
  let expectedAccepted = oldAllocate(expected, next);
  const receipts = () => [...replay(prudent, prudentAccepted).months].reduce((sum, [n, m]) =>
    sum + (n >= first && n <= deadline ? m.receipts : 0), 0);
  let current = receipts();
  for (let receipt = first; receipt <= deadline; receipt++) for (const price of prices) {
    const gap = input.cashGoal - current;
    if (gap <= 0) return proposed;
    const at = receipt - price.paymentDelayMonths;
    if (at < first || at >= first + input.horizon) continue;
    const candidate: ScenarioSale = { ...price, ...monthParts(at), id: `auto-${at}-${price.sizeId}-${proposed.length}`,
      quantity: Math.ceil(gap * 1000 / price.pricePerThousand) };
    while (next.sales.some(s => s.id === candidate.id)) candidate.id += "-n";
    const wanted = Math.min(2_000_000_000, candidate.quantity);
    candidate.quantity = Math.min(oldBest(prudent, prudentAccepted, candidate, wanted).quantity,
      oldBest(expected, expectedAccepted, candidate, wanted).quantity);
    if (candidate.quantity > 0) {
      proposed.push(candidate);
      next = { ...next, sales: [...next.sales, candidate] };
      prudentAccepted = oldAllocate(prudent, next);
      expectedAccepted = oldAllocate(expected, next);
      current = receipts();
    }
    if (next.sales.length >= 100) return proposed;
  }
  return proposed;
}

function fixture(months: number, existing: number, shortfall: boolean) {
  const first = monthNumber(2027, 1);
  const path = (quantity: number, offset: number) => ({
    quantity, entry: first, path: Object.fromEntries(Array.from({ length: months + 2 }, (_, i) => {
      const n = first + i;
      const days = i === 0 ? Object.fromEntries(Array.from({ length: 31 }, (_, d) => [d + 1, {
        survival: 1 - d * 0.0002, sizeId: d < 8 + offset ? 1 : d < 17 + offset ? 2 : 3,
        animalsPerKg: d < 8 + offset ? 5000 : d < 17 + offset ? 3500 : 2200,
      }])) : undefined;
      return [n, { survival: 1 - i * 0.02, sizeId: 3, animalsPerKg: 2200, days }];
    })) as World["cohorts"][number]["path"],
  });
  const maxApk = Object.fromEntries(Array.from({ length: months + 2 }, (_, i) =>
    [1, 2, 3].map((size, j) => [`${first + i}|${size}`, [6000, 4000, 2500][j]])).flat());
  const orders = [{ key: "early-short", at: first, day: 4, sizeId: 2, quantity: shortfall ? 800 : 20 },
    { key: "later", at: first + months, sizeId: 3, quantity: 300 }];
  const expected: World = { first, last: first + months + 1, sizes: [1, 2, 3], maxApk,
    cohorts: [path(1400, 0), path(900, 3)], orders };
  const prudent: World = { ...expected, cohorts: [path(1100, 0), path(700, 3)] };
  const sales = Array.from({ length: existing }, (_, i) => ({
    id: `existing-${i}`, ...monthParts(first + i % months), sizeId: i % 2 ? 2 : 3,
    quantity: 15, pricePerThousand: 100 + i, paymentDelayMonths: i % 2,
  }));
  const input = scenarioInputSchema.parse({ name: "equivalence", startYear: 2027, startMonth: 1,
    horizon: months, cashDeadline: monthParts(first + months - 1), cashGoal: 500,
    sales, proposalPrices: [1, 2, 3].map((sizeId, i) => ({
      sizeId, pricePerThousand: 220 - i * 30, paymentDelayMonths: i % 2,
    })) });
  return { expected, prudent, input };
}

for (const shortfall of [false, true]) {
  test(`proposal preserves both worlds, daily availability and each order (preexisting shortfall=${shortfall})`, () => {
    const { expected, prudent, input } = fixture(4, 4, shortfall);
    const original = oldProposal(expected, prudent, input);
    // Exact equivalence belongs to the greedy baseline, not to the newer
    // bounded optimizer, which deliberately explores different month/size plans.
    assert.deepEqual(
      proposeSalesGreedyBaseline(expected, prudent, input).map(({ id, ...sale }) => sale),
      original.map(({ id, ...sale }) => sale),
    );
    const optimized = proposeSales(expected, prudent, input);
    assert.deepEqual(proposeSales(expected, prudent, input), optimized);
    for (const world of [expected, prudent]) {
      const oldResult = projectWorld(world, { ...input, sales: [...input.sales, ...original] });
      const newResult = projectWorld(world, { ...input, sales: [...input.sales, ...optimized] });
      assert.ok(newResult.receiptsByDeadline >= oldResult.receiptsByDeadline);
      assert.equal(newResult.unfulfilledSales, 0);
      const baseline = replay(world, allocateScenario(world, input));
      const after = replay(world, allocateScenario(world, { ...input, sales: [...input.sales, ...optimized] }));
      for (const [key, quantity] of Object.entries(baseline.orders)) assert.ok((after.orders[key] ?? 0) >= quantity);
      for (const [key, quantity] of Object.entries(baseline.applied)) assert.ok((after.applied[key] ?? 0) >= quantity);
    }
  });
}

// Opt-in larger representative timing comparison: RUN_PROPOSAL_BENCH=1 npx tsx --test this-file
if (process.env.RUN_PROPOSAL_BENCH === "1") test("12-month 21-sale proposal benchmark", () => {
  const { expected, prudent, input } = fixture(12, 21, true);
  const start = performance.now();
  const original = oldProposal(expected, prudent, input);
  const oldMs = performance.now() - start;
  const timings = { allocationMs: 0, candidateReplayMs: 0, receiptReplayMs: 0 };
  const optimized = proposeSales(expected, prudent, input, timings);
  const newMs = performance.now() - start - oldMs;
  assert.deepEqual(
    proposeSalesGreedyBaseline(expected, prudent, input).map(({ id, ...sale }) => sale),
    original.map(({ id, ...sale }) => sale),
  );
  const projectionsStart = performance.now();
  const combined = { ...input, sales: [...input.sales, ...optimized] };
  const expectedProjection = projectWorld(expected, combined);
  const prudentProjection = projectWorld(prudent, combined);
  const projectionMs = performance.now() - projectionsStart;
  assert.ok(expectedProjection.receiptsByDeadline >= projectWorld(expected, { ...input, sales: [...input.sales, ...original] }).receiptsByDeadline);
  assert.ok(prudentProjection.receiptsByDeadline >= projectWorld(prudent, { ...input, sales: [...input.sales, ...original] }).receiptsByDeadline);
  assert.equal(expectedProjection.unfulfilledSales, 0);
  assert.equal(prudentProjection.unfulfilledSales, 0);
  console.log({ oldMs: Math.round(oldMs), newMs: Math.round(newMs),
    allocationMs: Math.round(timings.allocationMs), candidateReplayMs: Math.round(timings.candidateReplayMs),
    receiptReplayMs: Math.round(timings.receiptReplayMs), finalProjectionsMs: Math.round(projectionMs) });
});