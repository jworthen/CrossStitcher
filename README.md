# Thready

A web app for managing your cross-stitch projects — track your DMC floss inventory, view PDF patterns, mark off stitches, and manage your color lists.

## Features

### Floss Inventory
- Per-brand inventory: DMC, Anchor, Madeira, Cosmo, J&P Coats, Weeks Dye Works, and The Gentle Art each track independently
- Switch brands from a dropdown — see only that brand's color list
- Mark each color as **In Stock**, **Low**, or **Unowned** — tap to cycle
- Search by code or color name
- Filter by status: All / In Stock / Low / Missing
- Sort numerically or group by color family
- Per-color notes (where purchased, substitute colors, etc.)
- Bulk actions: mark all visible colors, clear Low → In Stock, reset inventory
- Export the active brand's inventory as CSV or JSON
- Dark mode support
- Inventory saves automatically in your browser (localStorage)

### Cross-Brand Conversion
- Built-in conversion chart (e.g. DMC 321 ↔ Anchor 9046) with ~350 entries
- "Convert" button opens a small utility: pick a source brand, type a code, see equivalents in every other brand
- Coverage is partial: DMC ships a full catalog (~480 colors); other brands are limited to entries we have a documented cross-reference for. Hand-dyed brands (Weeks, Gentle Art) are flagged as approximate.
- "Request a missing color" link (in the Convert modal and the Floss tab Actions menu) opens a pre-filled GitHub issue for missing brands or specific codes
- PDF scanner can extract Anchor / Madeira / Cosmo codes from a pattern's legend and convert to DMC

### Pattern Library
- Upload one or many PDF patterns at once from your device
- Patterns stored locally in your browser (IndexedDB) and, when signed in, synced via Firebase Storage
- Rename patterns and add designer / fabric / notes from the Info tab inside the viewer
- Delete patterns with confirmation
- Active tab and last-viewed page per pattern persist across refreshes

### PDF Viewer
- Render any saved pattern as a zoomable, pannable image
- Multi-page navigation
- Pattern metadata: name, designer/brand, fabric type, free-text notes

### Stitch Grid & Tracking
- Auto-detect the stitch grid on render (directional 2D edge detection + autocorrelation); falls back to manual two-corner calibration when the chart is unusual
- Grid tiles across the full pattern; per-page configs for multi-page PDFs
- Tap any grid square to mark it complete (toggle); the fill color is sampled from the cell's symbol and matched against the pattern's color list
- Progress bar and stitch count estimate (completed / ~total)
- Progress saves per pattern, per page

### Color List
- Scan PDF text to auto-detect DMC, Anchor, Madeira, or Cosmo codes from a pattern's legend
- Extracts skein counts and crops symbol images from the rendered page — works even with proprietary symbol fonts
- Manual add/remove with optional stitch count entry (in your preferred brand's numbering)
- Mark colors done as you stitch; summary bar tracks colors and stitches completed
- Share shopping list or progress via the Web Share API (with clipboard fallback)

### Cloud Sync (optional)
- Sign in with Google or anonymously to sync inventory, color notes, patterns, and PDFs across devices
- Inventory + notes sync via Firestore documents under `users/{uid}/data/...`
- Pattern metadata + grid configs + progress in Firestore; PDF binaries in Firebase Storage
- Realtime updates (mark a stitch on your phone → see it on your laptop)
- Online/offline indicator on the account button — offline changes queue and flush when you reconnect
- Without Firebase env vars set, the app continues to work in fully local mode (no sign-in)

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

### Optional: Firebase setup (cloud sync)

Cloud sync is optional — without these env vars, the app runs in fully local mode.

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Authentication** providers: Google and Anonymous.
3. Enable **Cloud Firestore** (start in production mode).
4. Enable **Firebase Storage**.
5. Deploy the security rules from this repo:
   ```bash
   firebase deploy --only firestore:rules,storage
   ```
6. Copy `.env.example` to `.env` and fill in the Firebase web config values from the project settings page.

## Project Structure

```
src/
  contexts/
    AuthContext.tsx                 # Firebase auth provider (Google + anonymous)
  data/
    dmcColors.ts                    # Full DMC color list with hex values
    brands.ts                       # Brand definitions, conversion chart, per-brand catalog helper
  hooks/
    useInventory.ts                 # Per-brand inventory (namespaced keys), local + Firestore sync
    useColorNotes.ts                # Per-brand color notes, local + Firestore sync
    usePreferredBrand.ts            # Active brand setting
    useDarkMode.ts                  # Dark mode toggle with system preference detection
    useOnlineStatus.ts              # navigator.onLine wrapper for the account button indicator
    useSyncedRecord.ts              # Generic localStorage ⇄ Firestore record helper
    usePatterns.ts                  # Pattern library state, IndexedDB cache + Firestore index
  lib/
    firebase.ts                     # Firebase app + auth + Firestore + Storage initialization
    userPatterns.ts                 # Cloud index doc + per-pattern doc CRUD
    patternStorage.ts               # Firebase Storage upload / download / delete for PDF binaries
  components/
    AccountButton.tsx               # Avatar / sign-in menu in the header
    AccountButton.module.css
    BottomNav.tsx                   # Inventory ↔ Patterns tab bar
    BottomNav.module.css
    Confetti.tsx                    # Decorative SVG sprinkles used in headers + empty states
    Confetti.module.css
    FlossItem.tsx                   # Individual color row (inventory screen)
    FlossItem.module.css
    PatternColorList.tsx            # Per-pattern color list with symbol images
    PatternColorList.module.css
    ConvertModal.tsx                # Cross-brand code conversion utility
    ConvertModal.module.css
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
