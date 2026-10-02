---
name: Browser presentation locales
description: Compare browser-formatted quantities in their own runtime, not with Node ICU assumptions.
---

For browser presentation checks, compare numeric meaning separately from locale-specific text and derive locale formatting expectations in the browser runtime.

**Why:** Node and Chromium can have different ICU/CLDR versions: Italian four-digit grouping may differ even when both call `toLocaleString("it-IT")`. A Node-generated formatted expectation can falsely report a UI regression.

**How to apply:** Keep semantic quantities as independent fixed expectations. For explicitly localized UI, calculate only the formatting in the browser; for copy/XLSX compare actual exported numbers/text. Preserve intentionally different formatting policies between spreadsheet-style tables and localized summaries unless the user requests a change.