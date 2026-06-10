---
name: Vagliatura taglia — operator-chosen size (total vs live density)
description: Why a vagliatura destination basket's stored sizeId may not match its stored animals_per_kg range.
---

In the vagliatura Calcolatore (DraggableCalculator) the commercial taglia can be derived from two densities:
- live density = live/sampleWeight×1000 (`animals_per_kg`, canonical for the live COUNT)
- total density = (live+dead)/sampleWeight×1000 (`apkForSize` = true average individual weight, incl. dead)

When the two map to different sizes, the calculator shows BOTH and the operator picks one (default = total density / new reasoning). Only the chosen `sizeId` is stored; `animals_per_kg` and `animalCount` stay on the live density (the live count must not change).

**Why:** dead shells still weigh roughly the same, so the true individual size (taglia) is best reflected by total density; but the live count must use live density to avoid mis-counting. The operator choice was explicitly requested by the user.

**How to apply:** A vagliatura destination basket's stored `sizeId` may legitimately NOT match the range of its stored `animals_per_kg`. Do NOT "fix" this as a bug. The choice is honored end-to-end: the client sets `sizeManuallySelected=true` so the submit-time recompute in VagliaturaConMappa is skipped; the server `completeSelectionFixed` uses `destBasket.sizeId` verbatim when non-zero, else falls back to `determineSizeId(animals_per_kg)`. The other two destination paths (manual measurement dialog, direct sale dialog) do NOT set the flag and keep the historical live-density recompute. Anomaly detection positions sizes from `animals_per_kg`, not `sizeId`, so it is unaffected.
