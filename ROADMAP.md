# CrossStitcher Roadmap

## Phase 1 — Core Inventory (MVP) ✅
- Full list of all DMC floss colors with numbers, names, and hex swatches
- Three states per color: **Unowned / In Stock / Low**
- Tap to cycle through states
- Search by number or color name
- Filter tabs: All / In Stock / Low / Missing
- Live count summary in header
- State persisted locally via AsyncStorage

## Phase 2 — UX Polish
- [ ] Sort/group toggle: switch between numerical order and color family grouping
- [ ] Bulk actions on current view:
  - Mark all visible colors as owned/low/unowned (works with active search or filter)
  - "I went shopping" — clear all Low → In Stock in one tap
  - Reset all — wipe inventory back to unowned
- [ ] Haptic feedback on status toggle
- [ ] Dark mode support
- [ ] Export inventory as CSV or JSON

## Phase 3 — PDF Pattern Viewer
The core differentiator. Pattern Keeper does not support PDF import.

**Scope:** Digital PDFs only (e.g. purchased patterns from Etsy, designer websites). Scanned/photographed patterns are out of scope — digital PDFs have mathematically perfect, consistent grids which makes reliable grid detection possible.

**Grid setup:**
- [ ] Import a digital PDF pattern from device storage
- [ ] Render the PDF as a zoomable, pannable image
- [ ] User zooms in and outlines a single stitch square by tapping two opposite corners
- [ ] App extrapolates cell size and origin from that one square and tiles the grid across the entire pattern
- [ ] User enters stitch count (width × height), or app estimates it by dividing image dimensions by cell size
- [ ] Grid overlay renders on top of the pattern

**Tracking:**
- [ ] Tap a square to mark it complete (toggle)
- [ ] Track overall % complete
- [ ] Per-color progress: stitches done vs remaining per DMC color
- [ ] Save progress per pattern (multiple patterns supported)

## Phase 4 — Inventory + Pattern Integration
- [ ] Extract the DMC color list from a pattern (manual entry or parsed from PDF legend)
- [ ] Cross-reference pattern color requirements against your inventory
- [ ] Shopping list: what you need to buy before starting a pattern
- [ ] "Can I start this?" — instant answer based on current stock
- [ ] Mark shopping list items as bought → auto-update inventory

## Phase 5 — Sync & Extras
- [ ] Cloud backup / sync inventory and patterns across devices
- [ ] Share shopping list or pattern progress
- [ ] Notes per color (brand, where purchased, substitute colors)
