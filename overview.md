# Move to Bottom (Backlog)

Adds a **Move to bottom** command to the backlog item context menu in Azure Boards,
the mirror image of the built-in **Move to top**.

On a **Sprint backlog** (Sprints → Backlog), right-click one or more items and choose
**Move to bottom** to send them to the end of that iteration's list in a single click —
no dragging to the bottom or typing a position into *Move to position…*.

## Features

- Works on the **iteration / sprint backlog**.
- Reorders **within the iteration only** and **never changes the work item's parent** —
  the same scope as the built-in **Move to top**.
- Supports multi-select: all selected items move to the bottom, keeping their relative order.
- Uses the same iteration-reordering API as the native drag-and-drop, so order stays consistent.

## Permissions

The extension requests **vso.work_write** (read & write work items) — required to read the
iteration's order and reorder its items.
