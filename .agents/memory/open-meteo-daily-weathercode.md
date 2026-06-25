---
name: Open-Meteo daily weather_code over-reports overcast
description: Why the dashboard weather widget derives the sky icon from sunshine ratio instead of the raw daily weather_code
---

Open-Meteo's **daily** `weather_code` reports the *most significant* condition of the
day, so a brief passing cloud declassifies an otherwise-clear day to code 3
("Coperto"/overcast). Observed live for the Goro/Po-Delta coords: 6 consecutive days
returned code 3 while `sunshine_duration` was 91–97% of `daylight_duration` and
`precipitation_sum` was 0 — i.e. essentially full sun.

**Rule:** for sky condition (clear/clouds/fog, codes 0–3 and 45–48) do NOT trust the
raw daily weather_code. Derive it from `sunFrac = sunshine_duration / daylight_duration`:
≥0.8 → Sereno(0), ≥0.6 → code 1, ≥0.35 → code 2, else Coperto(3). **Any precipitation
code (≥51: drizzle/rain/snow/showers/thunderstorm) is kept verbatim** — never hide rain
by overriding it with the sun ratio. Fall back to the raw code when sunshine/daylight
are missing or daylight ≤ 0.

**Why:** the daily aggregation is pessimistic about clouds but precipitation totals are
reliable; users (Goro) correctly reported "sunny" days shown as overcast.

**How to apply:** lives in the dashboard "Meteo Delta" widget. If adding new daily
forecast displays, request `sunshine_duration,daylight_duration` alongside
`weather_code` and apply the same derivation. The hourly `weather_code` does not have
this problem; only the daily one does.
