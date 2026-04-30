# CrossStitcher Roadmap

## Phase 1 — Core Inventory (MVP) ✅
- Full list of all DMC floss colors with numbers, names, and hex swatches
- Three states per color: **Unowned / In Stock / Low**
- Tap to cycle through states
- Search by number or color name
- Filter tabs: All / In Stock / Low / Missing
- Live count summary in header
- State persisted locally via localStorage

## Phase 2 — UX Polish 🚧
- [x] Sort/group toggle: switch between numerical order and color family grouping
- [x] Bulk actions on current view:
  - Mark all visible colors as owned/low/unowned (works with active search or filter)
  - "I went shopping" — clear all Low → In Stock in one tap
  - Reset all — wipe inventory back to unowned
- [x] Dark mode support
- [x] Export inventory as CSV or JSON

## Phase 3 — Aesthetics & Visual Polish
- [ ] Custom logo / wordmark in header
- [x] Improved typography (custom font pairing)
- [x] Animated status transitions (smooth color change on tap)
- [x] Color-coded row tinting based on status (subtle background wash)
- [x] Richer swatch styling (subtle depth, silk/thread texture)
- [ ] Skeleton loading / empty state illustrations
- [ ] Compact / Comfortable / Spacious density toggle
- [x] Header gradient or decorative pattern

## Phase 4 — PDF Pattern Viewer
The core differentiator. Pattern Keeper does not support PDF import.

**Scope:** Digital PDFs only (e.g. purchased patterns from Etsy, designer websites). Scanned/photographed patterns are out of scope — digital PDFs have mathematically perfect, consistent grids which makes reliable grid detection possible.

**Grid setup:**
- [ ] Import a digital PDF pattern from device storage
- [ ] Render the PDF as a zoomable, pannable image
- [ ] User zooms in and outlines a single stitch square by tapping two opposite corners
- [ ] App extrapolates cell size and origin from that one square and tiles the grid across the entire pattern
- [ ] User enters stitch count (width × height), or app estimates it by dividing image dimensions by cell size
- [ ] Grid overlay renders on top of the pattern

**Color list:**
- [ ] Extract the DMC color list from the pattern (manual entry or parsed from PDF legend)

**Tracking:**
- [ ] Tap a square to mark it complete (toggle)
- [ ] Track overall % complete
- [ ] Per-color progress: stitches done vs remaining per DMC color
- [ ] Save progress per pattern (multiple patterns supported)

## Phase 5 — Inventory + Pattern Integration
- [ ] Cross-reference pattern color requirements against your inventory
- [ ] Shopping list: what you need to buy before starting a pattern
- [ ] "Can I start this?" — instant answer based on current stock
- [ ] Mark shopping list items as bought → auto-update inventory

## Phase 6 — Sync & Extras
- [ ] Cloud backup / sync inventory and patterns across devices
- [ ] Share shopping list or pattern progress
- [ ] Notes per color (brand, where purchased, substitute colors)

## Phase 7 — Multi-Brand Thread Support
- [ ] Add inventory support for other popular brands: Anchor, J&P Coats, Madeira, Cosmo, Weeks Dye Works, The Gentle Art
- [ ] Cross-brand conversion charts (e.g. DMC 321 ↔ Anchor 9046)
- [ ] User can set a preferred brand per pattern or globally
- [ ] Patterns that list multiple brand codes show all equivalents

## Phase 8 — Community (Nice to Have)
Requires a backend and user accounts.

- [ ] User profiles
- [ ] Upload and share progress photos (WIP shots)
- [ ] Follow other stitchers
- [ ] Like and comment on progress photos
- [ ] Forums / discussion boards by topic (patterns, techniques, brands)
- [ ] Pattern recommendations from the community
- [ ] Finished object (FO) gallery — show off completed projects
