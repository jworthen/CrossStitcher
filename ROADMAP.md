# CrossStitcher Roadmap

## Phase 1 — Core Inventory (MVP) ✅
- Full list of all DMC floss colors with numbers, names, and hex swatches
- Three states per color: **Unowned / In Stock / Low**
- Tap to cycle through states
- Search by number or color name
- Filter tabs: All / In Stock / Low / Missing
- Live count summary in header
- State persisted locally via localStorage

## Phase 2 — UX Polish ✅
- [x] Sort/group toggle: switch between numerical order and color family grouping
- [x] Bulk actions on current view:
  - Mark all visible colors as owned/low/unowned (works with active search or filter)
  - "I went shopping" — clear all Low → In Stock in one tap
  - Reset all — wipe inventory back to unowned
- [x] Dark mode support
- [x] Export inventory as CSV or JSON

## Phase 3 — Aesthetics & Visual Polish 🚧
- [ ] Custom logo / wordmark in header
- [x] Improved typography (custom font pairing)
- [x] Animated status transitions (smooth color change on tap)
- [x] Color-coded row tinting based on status (subtle background wash)
- [x] Richer swatch styling (subtle depth, silk/thread texture)
- [ ] Skeleton loading / empty state illustrations
- [ ] Compact / Comfortable / Spacious density toggle
- [x] Header gradient or decorative pattern

## Phase 4 — Marketing & Landing Page
A public-facing website to establish CrossStitcher's identity and attract users. Key differentiator to lead with: free, no account, works in any browser right now — versus competitors still in waitlist/beta.

- [ ] Hero section: tagline, app screenshot, CTA ("Open the App")
- [ ] Feature highlights: inventory tracking, sort/filter, dark mode, CSV export
- [ ] "How it works" — 3-step walkthrough (search → tap to track → export)
- [ ] Competitive positioning: free forever, no install, no account, no subscription
- [ ] Roadmap teaser: what's coming (pattern viewer, shopping list)
- [ ] Responsive design, dark mode support

## Phase 5a — Pattern Library ✅
File management only — no rendering yet. Gets the storage layer in place.

- [x] Upload a PDF pattern from device
- [x] Name and save patterns to the browser (IndexedDB)
- [x] List of saved patterns (name, date added, file size)
- [x] Delete patterns (with confirmation)

## Phase 5b — PDF Viewer ✅
Render patterns in-app so users can read them without leaving.

- [x] Render a saved PDF as a zoomable, pannable image (pdf.js)
- [x] Multi-page navigation for patterns that span multiple pages

## Phase 5c — Grid Overlay ✅
The technically complex part. Calibrate a stitch grid over the rendered pattern.

- [x] User clicks two opposite corners of one stitch square to calibrate
- [x] App extrapolates cell size and tiles the grid across the full pattern
- [x] App estimates stitch count from canvas size ÷ cell size (~W × H display)

## Phase 5d — Stitch Tracking ✅
Make the grid interactive.

- [x] Tap a grid square to mark it complete (toggle)
- [x] Overall % complete progress bar
- [x] Progress saves per pattern (multiple patterns supported)

## Phase 5e — Color List ✅
Track a pattern's color requirements. Unlocks Phase 6 inventory integration.

- [x] Scan PDF text to auto-detect DMC color numbers from the legend
- [x] Extract stitch counts and legend symbols from scanned rows
- [x] Manual add/remove as fallback for PDFs without extractable text
- [x] Per-color progress: mark colors done, summary shows stitches done vs. remaining

## Phase 5f — Pattern Metadata
Let users document their patterns properly. Currently patterns are named from the PDF filename, which is often an order number or garbled string.

- [ ] Edit pattern name (in-place, from the library list or viewer header)
- [ ] Designer / brand field (e.g., "Dimensions", "Anchor", "indie designer name")
- [ ] Fabric type & count (e.g., 14-count Aida, 28-count evenweave)
- [ ] Notes field (free text — source URL, purchase date, kit contents, etc.)
- [ ] Display designer name as a subtitle under the pattern name in the library

## Phase 6 — Inventory + Pattern Integration
- [ ] Cross-reference pattern color requirements against your inventory
- [ ] Shopping list: what you need to buy before starting a pattern
- [ ] "Can I start this?" — instant answer based on current stock
- [ ] Mark shopping list items as bought → auto-update inventory

## Phase 7 — AI & Camera Features
For physical/paper patterns and loose skeins — cases where there's no PDF to extract from. Requires browser camera access (WebRTC) and an AI/vision backend. (Digital PDF legend extraction is already handled in Phase 5e.)

- [ ] **Barcode scanning** — point camera at a floss skein's barcode to add it to inventory instantly
- [ ] **AI legend scanning** — photograph a paper pattern's color key; AI extracts DMC numbers and cross-references against your stash
- [ ] **Shopping list from legend scan** — auto-generate what to buy based on a scanned legend vs. current inventory

## Phase 8 — Sync & Extras
- [ ] Cloud backup / sync inventory and patterns across devices
- [ ] Share shopping list or pattern progress
- [ ] Notes per color (brand, where purchased, substitute colors)

## Phase 9 — Multi-Brand Thread Support
- [ ] Add inventory support for other popular brands: Anchor, J&P Coats, Madeira, Cosmo, Weeks Dye Works, The Gentle Art
- [ ] Cross-brand conversion charts (e.g. DMC 321 ↔ Anchor 9046)
- [ ] User can set a preferred brand per pattern or globally
- [ ] Patterns that list multiple brand codes show all equivalents

## Phase 10 — Community (Nice to Have)
Requires a backend and user accounts.

- [ ] User profiles
- [ ] Upload and share progress photos (WIP shots)
- [ ] Follow other stitchers
- [ ] Like and comment on progress photos
- [ ] Forums / discussion boards by topic (patterns, techniques, brands)
- [ ] Pattern recommendations from the community
- [ ] Finished object (FO) gallery — show off completed projects
