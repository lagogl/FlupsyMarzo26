import test from "node:test";
import assert from "node:assert/strict";
import { businessToday, getBusinessReferenceDate } from "./business-date";

process.env.TZ = "UTC";

const utc = (value: string) => new Date(value);

test("businessToday segue il giorno civile di Roma durante l'inverno e l'estate", () => {
  assert.deepEqual(businessToday(utc("2025-01-14T22:59:59.999Z")), {
    year: 2025,
    month: 1,
    day: 14,
  });
  assert.deepEqual(businessToday(utc("2025-01-14T23:00:00.000Z")), {
    year: 2025,
    month: 1,
    day: 15,
  });
  assert.deepEqual(businessToday(utc("2025-07-14T21:59:59.999Z")), {
    year: 2025,
    month: 7,
    day: 14,
  });
  assert.deepEqual(businessToday(utc("2025-07-14T22:00:00.000Z")), {
    year: 2025,
    month: 7,
    day: 15,
  });
});

test("businessToday attraversa correttamente mese, anno e giorno bisestile", () => {
  assert.deepEqual(businessToday(utc("2025-01-31T22:59:59.999Z")), {
    year: 2025,
    month: 1,
    day: 31,
  });
  assert.deepEqual(businessToday(utc("2025-01-31T23:00:00.000Z")), {
    year: 2025,
    month: 2,
    day: 1,
  });
  assert.deepEqual(businessToday(utc("2025-12-31T22:59:59.999Z")), {
    year: 2025,
    month: 12,
    day: 31,
  });
  assert.deepEqual(businessToday(utc("2025-12-31T23:00:00.000Z")), {
    year: 2026,
    month: 1,
    day: 1,
  });
  assert.deepEqual(businessToday(utc("2024-02-28T22:59:59.999Z")), {
    year: 2024,
    month: 2,
    day: 28,
  });
  assert.deepEqual(businessToday(utc("2024-02-28T23:00:00.000Z")), {
    year: 2024,
    month: 2,
    day: 29,
  });
  assert.deepEqual(businessToday(utc("2024-02-29T23:00:00.000Z")), {
    year: 2024,
    month: 3,
    day: 1,
  });
});

test("le transizioni DST di Roma non spostano il giorno civile", () => {
  // Il 30 marzo l'ora locale romana salta da 01:59:59 a 03:00 alle 01:00Z.
  assert.deepEqual(businessToday(utc("2025-03-30T00:59:59.999Z")), {
    year: 2025,
    month: 3,
    day: 30,
  });
  assert.deepEqual(businessToday(utc("2025-03-30T01:00:00.000Z")), {
    year: 2025,
    month: 3,
    day: 30,
  });

  // 2025-10-26: in Italia l'orologio torna da 02:59:59 a 02:00:00.
  assert.deepEqual(businessToday(utc("2025-10-26T00:59:59.999Z")), {
    year: 2025,
    month: 10,
    day: 26,
  });
  assert.deepEqual(businessToday(utc("2025-10-26T01:00:00.000Z")), {
    year: 2025,
    month: 10,
    day: 26,
  });
});

test("la data di riferimento è un carrier a mezzanotte locale anche con TZ=UTC", () => {
  const cases = [
    ["2025-01-31T23:30:00.000Z", "2025-02-01T00:00:00.000Z"],
    ["2025-07-14T22:30:00.000Z", "2025-07-15T00:00:00.000Z"],
    ["2024-02-28T23:30:00.000Z", "2024-02-29T00:00:00.000Z"],
    ["2025-03-30T01:30:00.000Z", "2025-03-30T00:00:00.000Z"],
    ["2025-10-26T01:30:00.000Z", "2025-10-26T00:00:00.000Z"],
  ] as const;

  for (const [instant, expectedCarrier] of cases) {
    const reference = getBusinessReferenceDate(utc(instant));
    assert.equal(reference.toISOString(), expectedCarrier);
    assert.equal(reference.getHours(), 0);
  }
});

test("l'istante predefinito e le date storiche esplicite non vengono reinterpretati", () => {
  const OriginalDate = globalThis.Date;
  const frozenInstant = OriginalDate.parse("2025-07-14T22:30:00.000Z");
  class FrozenDate extends OriginalDate {
    constructor(...args: ConstructorParameters<typeof Date>) {
      if (args.length === 0) super(frozenInstant);
      else super(...args);
    }

    static now() {
      return frozenInstant;
    }
  }

  try {
    globalThis.Date = FrozenDate as DateConstructor;
    assert.deepEqual(businessToday(), { year: 2025, month: 7, day: 15 });
    assert.equal(getBusinessReferenceDate().toISOString(), "2025-07-15T00:00:00.000Z");

    // Anche un istante esplicito nel passato viene convertito usando il suo
    // giorno civile di Roma, non sostituito con il giorno congelato corrente.
    assert.deepEqual(businessToday(new OriginalDate("2019-12-30T23:30:00.000Z")), {
      year: 2019,
      month: 12,
      day: 31,
    });
    const historical = getBusinessReferenceDate(new OriginalDate("2019-12-30T23:30:00.000Z"));
    assert.equal(historical.toISOString(), "2019-12-31T00:00:00.000Z");
  } finally {
    globalThis.Date = OriginalDate;
  }
});