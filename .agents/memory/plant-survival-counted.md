---
name: Plant survival headline = counted-at-vagliatura
description: The Cruscotto Sopravvivenza big number must be counted survival, not cohort survival
---

The Cruscotto Sopravvivenza headline shows survival **counted at vagliature** (live animals out ÷ animals in, per source module, clamped dest≤origine), NOT the cohort-weighted rate.

**Why:** the cohort-weighted number read ~99,8% (misleading — most plant is untracked/estimated), while the real measured survival is ~79,5% and matches the trend chart and Report Lotto. A non-technical operator comparing pages must see ONE truth.

**How to apply:** survival/mortality anywhere user-facing (cruscotto headline, byType, byModule, Report Morti) must derive from completed vagliature origin/destination counts, never from cohort survival ratios. Cohort coverage/tracked counts are shown only as secondary context. Lot-level mortality comes from lot_ledger (mortality rows). Keep default time windows consistent across cruscotto and Report Morti to avoid confusing comparisons.
