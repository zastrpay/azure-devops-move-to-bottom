# Move to Bottom (Backlog)

Adds a **Move to bottom** command to the backlog item context menu in Azure Boards,
mirroring the built-in **Move to top**.

Right-click one or more items on a backlog and choose **Move to bottom** to send them
to the end of the backlog in a single click — no more dragging to the bottom or typing
a position into *Move to position…*.

## Features

- Works on the product and portfolio backlogs (User Stories, Features, Epics, …).
- Supports multi-select: all selected items move to the bottom, keeping their relative order.
- Uses the same reordering API as the native drag-and-drop, so backlog order stays consistent.

## Permissions

The extension requests **vso.work_write** (read & write work items) — required to reorder backlog items.
