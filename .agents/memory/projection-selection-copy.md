---
name: Projection selection copy
description: Clipboard contract for spreadsheet selections in growth projections.
---

Selection copy uses raw values in the displayed orientation, separated by tabs and newlines, without headers. Whole-table export remains indicator-first regardless of orientation.

**Why:** A rendered dash represents numeric zero, while missing-data messages are meaningful text. Copying formatted DOM text would lose that distinction and include coverage decorations.

**How to apply:** Validate month/indicator identity separately from display coordinates. Rotation must clear the selection and its Shift anchor; copying with no selection must leave the clipboard unchanged.