import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ScenarioProposalOptimizationSummary } from "./ScenarioProposalOptimizationSummary";
import type { ScenarioProposalOptimization } from "@shared/sales-scenarios";

const example: ScenarioProposalOptimization = {
  baselineReceipts: 1_273_386,
  optimizedReceipts: 1_400_000,
  improvementEuro: 126_614,
  plansEvaluated: 4,
  candidatesEvaluated: 23,
  searchTimeMs: 5_200,
  timeLimited: false,
  strategy: "premium-first",
  baselineFeasible: true,
};

test("the preview reports verified worst-world cash, improvement and remaining target", () => {
  const html = renderToStaticMarkup(createElement(ScenarioProposalOptimizationSummary, {
    optimization: example,
    cashGoal: 2_000_000,
  }));
  assert.match(html, /1\.400\.000/);
  assert.match(html, /126\.614/);
  assert.match(html, /600\.000/);
  assert.match(html, /aria-valuenow="70"/);
  assert.match(html, /fra atteso e prudente/);
  assert.match(html, /non un ottimo matematico garantito/);
  assert.doesNotMatch(html, /limite di tempo/);
});

test("time-limited search and unsafe prior baseline are explained accurately", () => {
  const html = renderToStaticMarkup(createElement(ScenarioProposalOptimizationSummary, {
    optimization: { ...example, baselineFeasible: false, baselineStatus: "unsafe", timeLimited: true },
    cashGoal: 2_000_000,
  }));
  assert.match(html, /limite di tempo/);
  assert.match(html, /piano manuale protetto/);
  assert.match(html, /Piano manuale di partenza/);
  assert.doesNotMatch(html, /Miglioramento vs metodo precedente/);
});

test("unfinished baseline is not falsely reported as unsafe", () => {
  const html = renderToStaticMarkup(createElement(ScenarioProposalOptimizationSummary, {
    optimization: { ...example, baselineFeasible: false, baselineStatus: "not-completed", timeLimited: true },
    cashGoal: 2_000_000,
  }));
  assert.match(html, /non ha terminato le verifiche/);
  assert.doesNotMatch(html, /non rispettava tutti gli impegni/);
  assert.match(html, /Piano manuale di partenza/);
});

test("invalid optimization totals fail visibly instead of showing a fake zero", () => {
  const html = renderToStaticMarkup(createElement(ScenarioProposalOptimizationSummary, {
    optimization: { ...example, optimizedReceipts: NaN },
    cashGoal: 2_000_000,
  }));
  assert.match(html, /role="alert"/);
  assert.match(html, /non valido/);
});