---
name: Capacity forecast (Capacità vicina)
description: How/why the per-size basket capacity forecast projects weight only, and where the growth math is reused.
---

# Capacity forecast — weight-only by design

The capacity feature has two limits per taglia: max animal count and max weight (grams, like all weights in this app). The predictive "Capacità vicina (~N giorni)" forecast projects **only the weight limit**.

**Why:** animal count never grows — it only decreases via mortality — so a basket that isn't over the animal limit now can never cross it through growth. The animal-count limit is therefore a present-moment check (the "Capacità superata" alert), not something to forecast. Weight is the only quantity that rises over time as animals grow.

**How to apply:**
- Any extension of the capacity forecast (e.g. Fase 2 temperature correction) keeps projecting weight, not count.
- Reuse the shared growth engine (`loadGrowthSimulationContext` + `stepOneDay`/`simulateForward`) rather than re-deriving SGR math, so all modules stay consistent. That engine works in **mg per animal** (1_000_000/weightMg = animals/kg); convert total grams ↔ per-animal mg at the boundary.
- The monthly SGR tables already bake in the seasonal temperature effect — a future direct-temperature factor must use only the *deviation* from the month's norm, or temperature is double-counted.
- In the heatmap, the "vicina" (approaching) alert must yield to "superata" (already over): only raise it when the basket is not already past the limit.
