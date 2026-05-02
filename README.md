# Thready

A web app for managing your cross-stitch projects — track your DMC floss inventory, view PDF patterns, mark off stitches, and manage your color lists.

## Features

### Floss Inventory
- Browse the full DMC color list with hex swatches
- Mark each color as **In Stock**, **Low**, or **Unowned** — tap to cycle
- Search by DMC number or color name
- Filter by status: All / In Stock / Low / Missing
- Sort numerically or group by color family
- Bulk actions: mark all visible colors, clear Low → In Stock, reset inventory
- Export inventory as CSV or JSON
- Dark mode support
- Inventory saves automatically in your browser (localStorage)

### Pattern Library
- Upload PDF patterns from your device
- Patterns stored locally in your browser (IndexedDB — no server, no account)
- Edit pattern name inline from the library list
- Delete patterns with confirmation

### PDF Viewer
- Render any saved pattern as a zoomable, pannable image
- Multi-page navigation
- Pattern metadata: name, designer/brand, fabric type, free-text notes

### Stitch Grid & Tracking
- Tap two opposite corners of one stitch square to calibrate a grid overlay
- Grid tiles across the full pattern automatically
- Tap any grid square to mark it complete (toggle)
- Progress bar and stitch count estimate (completed / ~total)
- Progress saves per pattern

### Color List
- Scan PDF text to auto-detect DMC colors from a pattern's legend
- Extracts skein counts and crops symbol images from the rendered page — works even with proprietary symbol fonts
- Manual add/remove with optional stitch count entry
- Mark colors done as you stitch; summary bar tracks colors and stitches completed

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
npm run build
```

## Project Structure

```
src/
  data/
    dmcColors.ts                    # Full DMC color list with hex values
  hooks/
    useInventory.ts                 # Inventory state + localStorage persistence
    useDarkMode.ts                  # Dark mode toggle with system preference detection
    usePatterns.ts                  # Pattern library state + IndexedDB persistence
  components/
    FlossItem.tsx                   # Individual color row (inventory screen)
    FlossItem.module.css
    PatternColorList.tsx            # Per-pattern color list with symbol images
    PatternColorList.module.css
  screens/
    FlossListScreen.tsx             # Main inventory screen
    FlossListScreen.module.css
    PatternLibraryScreen.tsx        # Pattern library (upload, list, delete)
    PatternLibraryScreen.module.css
    PdfViewerScreen.tsx             # PDF viewer, grid overlay, color scan
    PdfViewerScreen.module.css
```

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for planned features.
