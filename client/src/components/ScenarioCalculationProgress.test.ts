import test from "node:test";
import { execFileSync } from "node:child_process";
import { build } from "esbuild";

test("calculation indicator renders real elapsed time, both operations and honest waiting guidance", async () => {
  // Compile the real component without CSS for this DOM-free rendering check.
  const compiled = await build({
    stdin: {
      resolveDir: process.cwd(),
      sourcefile: "scenario-progress-render-check.tsx",
      contents: `
        import assert from "node:assert/strict";
        import { createElement } from "react";
        import { renderToStaticMarkup } from "react-dom/server";
        import { ScenarioCalculationProgress } from "./client/src/components/ScenarioCalculationProgress";

        Date.now = () => 120_000;
        const render = (kind, elapsed) => renderToStaticMarkup(
          createElement(ScenarioCalculationProgress, { kind, startedAt: Date.now() - elapsed }),
        );
        for (const kind of ["proposal", "simulation"]) {
          const initial = render(kind, 0);
          assert.match(initial, /Elaborazione in corso/);
          assert.match(initial, new RegExp('data-kind="' + kind + '"'));
          assert.match(initial, /role="progressbar"/);
          assert.doesNotMatch(initial, /aria-valuenow|scenario-calculation-wait-guidance/);
          assert.match(initial, /0 secondi/);
          assert.match(initial, kind === "proposal" ? /Preparazione proposta/ : /Ricalcolo scenario/);
          assert.match(initial, /aria-live="off"/);
          assert.match(render(kind, 1_000), /1 secondo/);
          assert.match(render(kind, 29_000), /29 secondi/);
          assert.doesNotMatch(render(kind, 29_000), /scenario-calculation-wait-guidance/);
          assert.match(render(kind, 30_000), /scenario-calculation-wait-guidance/);
          assert.match(render(kind, 65_000), /01:05/);
          assert.match(render(kind, 65_000), /aspettando la risposta/);
          assert.match(render(kind, -1_000), /0 secondi/);
        }
      `,
    },
    bundle: true,
    write: false,
    platform: "node",
    format: "cjs",
    packages: "external",
    jsx: "automatic",
    loader: { ".css": "empty" },
  });
  execFileSync(process.execPath, ["--input-type=commonjs"], {
    input: compiled.outputFiles[0].text,
    cwd: process.cwd(),
    stdio: ["pipe", "pipe", "pipe"],
  });
});