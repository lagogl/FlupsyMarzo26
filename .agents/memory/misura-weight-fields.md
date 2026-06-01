---
name: Misura operation weight/size field provenance
description: How animals_per_kg vs average_weight vs total_weight are derived in "misura" operations, and which is reliable for judging taglia/growth.
---

In a `misura` operation the size-related fields come from DIFFERENT, independent sources and can legitimately diverge:

- **animals_per_kg** = from the SAMPLE: `liveAnimals / (sampleWeight/1000)`. This is the direct physical measurement of individual animal size → it is the RELIABLE indicator of taglia and growth.
- **animal_count** = previous count × (1 − mortality%) (mortality cascade). NOT derived from basket weight.
- **average_weight (peso medio)** can be stored as `total_weight / animal_count` (grams→mg). This depends entirely on the manually-entered basket weight, so it is UNRELIABLE if the operator typed a wrong weight.
- **total_weight (peso cesta)** in a misura is entered MANUALLY (source `desktop_manager`), or auto-copied from the previous op of the cycle if left blank. The gross→net tara subtraction applies ONLY to `peso` operations, NOT to misura — whatever is typed is used as-is. total_weight feeds only into average_weight; it does NOT affect animals_per_kg or animal_count.

Note: the canonical MISURA ALLINEATA / direct-operations endpoints compute `averageWeight = 1e6 / animalsPerKg` (consistent with sample). But some stored misura rows have `average_weight = total_weight / animal_count` instead, which disagrees with `1e6/animals_per_kg` when the typed basket weight is wrong.

**Rule when diagnosing a misura anomaly:** trust `animals_per_kg` (sample) for taglia/growth, NOT `average_weight`. If average_weight contradicts animals_per_kg, suspect a wrong manually-typed basket weight, not a real size regression.

**Why:** Real incident — basket 8 (Flupsy 2 nero PVC) cycle 657: a misura had a basket weight (~6.5 kg) typed too low (should have been ~14 kg given sample size ~12.5 mg / TP-2000 and ~1.128M animals), making peso medio show ~5.76 mg and falsely look like a regression to TP-1800. animals_per_kg/taglia were actually correct and growing.

**Weight-decrease warning (both Operazioni + Spreadsheet modules):** a cycle's total_weight should always grow; a non-blocking confirm dialog fires when a new misura/peso total_weight is LOWER than the previous op's. **Baseline gotcha:** compute the previous weight by filtering operations on BOTH basketId AND the active cycleId AND total_weight>0, then take latest. Do NOT reuse the spreadsheet's per-row `lastOperation` for this — it is filtered by basketId only (not cycle-scoped) and may be a no-weight op (pulizia/vagliatura). For `peso` gross mode, subtract tara before comparing (stored weights are net). In the Spreadsheet the misura total_weight is now an editable required field (was read-only/inherited) with the previous value only as a placeholder suggestion.
