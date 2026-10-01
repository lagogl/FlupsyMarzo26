import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const source = readFileSync(fileURLToPath(new URL("./AnalisiScostamenti.tsx", import.meta.url)), "utf8");

test("forecast calendar compares year-month keys from the Rome civil month", () => {
  assert.match(source, /const currentRomeMonthKey = getEuropeRomeDateKey\(\)\.slice\(0, 7\);/);
  assert.match(
    source,
    /const getForecastMonthKey = \(year: number, month: number\): string =>\s*`\$\{year\}-\$\{String\(month\)\.padStart\(2, '0'\)\}`;/
  );
  assert.match(source, /getForecastMonthKey\(row\.year, row\.month\)/);
  assert.match(source, /forecastYear=\{selectedYear\}/);
  assert.equal((source.match(/const isPast = monthKey < currentRomeMonthKey;/g) || []).length, 3);
  assert.equal((source.match(/const isCurrent = monthKey === currentRomeMonthKey;/g) || []).length, 3);
  assert.match(source, /getForecastMonthKey\(forecastYear, m\.month\) === currentRomeMonthKey/);
  assert.match(source, /d\.year === forecastYear && d\.month === m\.month/);

  assert.doesNotMatch(source, /m\.month\s*<\s*currentMonth|m\.month\s*===\s*currentMonth/);
});

test("selected forecast year remains in the API request and both exports", () => {
  assert.equal((source.match(/year: String\(selectedYear\)/g) || []).length, 3);
  assert.match(source, /JSON\.stringify\(\{ question, context, year: forecastYear \}\)/);
  assert.match(source, /d\.meseSeminaT1 === `\$\{m\.fullName\} \$\{forecastYear\}`/);
});

test("a January in the next year sorts after December of the current year", () => {
  const currentRomeMonthKey = "2026-12";
  const nextYearJanuaryKey = "2027-01";
  assert.equal(nextYearJanuaryKey < currentRomeMonthKey, false);
});