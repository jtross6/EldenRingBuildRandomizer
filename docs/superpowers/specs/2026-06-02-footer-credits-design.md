# Footer Credits Design

## Overview

Add a subtle credit footer to every page, attributing the creator and data sources.

## Placement

A `<footer>` element inside `RootLayout` (`src/components/layout/root-layout.tsx`), placed after the `<Outlet />`. It sits in normal document flow within the existing `max-w-5xl` container. It is not fixed or sticky.

On pages with the fixed `ActionBar` (Fate, Build Viewer), the footer is the last element in the scrollable document. The action bar floats over the viewport bottom as it already does.

## Content

Single line with dot separators:

```
Made by @jtross6 · Data from Fextralife · Elden Ring © FromSoftware / Bandai Namco
```

- `@jtross6` links to `https://github.com/jtross6`
- No other segments are links

## Visual Treatment

- Font size: 11px (`text-[11px]`), matching the nav links
- Color: `text-text-dim` (`#5a5750`) — the dimmest text tier
- Center-aligned
- Top margin of `mt-12` to separate from page content
- The `@jtross6` link uses `text-text-dim` with `hover:text-text-secondary` for a subtle hover effect
- Dot separators (`·`) in the same dim color

## Files Changed

- `src/components/layout/root-layout.tsx` — add `<footer>` after `<Outlet />`

## Scope

One file, static markup only. No JavaScript behavior, no new components, no new dependencies.
