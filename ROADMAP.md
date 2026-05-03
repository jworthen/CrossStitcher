# Thready Roadmap

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

## Phase 3 — Aesthetics & Visual Polish ✅
- [x] Custom logo / wordmark in header
- [x] Improved typography (custom font pairing)
- [x] Animated status transitions (smooth color change on tap)
- [x] Color-coded row tinting based on status (subtle background wash)
- [x] Richer swatch styling (subtle depth, silk/thread texture)
- [x] Skeleton loading / empty state illustrations
- [x] Header gradient or decorative pattern

## Phase 4 — Marketing & Landing Page
A public-facing website to establish Thready's identity and attract users. Key differentiator to lead with: free, no account, works in any browser right now — versus competitors still in waitlist/beta.

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
- [x] Extract skein counts from scanned legend rows
- [x] Extract symbol images by rendering each legend row to an offscreen canvas and cropping — works with proprietary symbol fonts that can't be text-extracted
- [x] Only rows containing an explicit "DMC" brand label are accepted — prevents false positives from stitch counts, dimensions, or page numbers elsewhere in the PDF
- [x] Manual add/remove as fallback for PDFs without extractable text
- [x] Per-color done tracking; summary bar shows colors and stitches completed vs. remaining
- [x] Calibration dot scales inversely with zoom so it stays pin-sized at any zoom level

## Phase 5f — Pattern Metadata ✅
Let users document their patterns properly. Currently patterns are named from the PDF filename, which is often an order number or garbled string.

- [x] Edit pattern name (in-place, from the library list or viewer header)
- [x] Designer / brand field (e.g., "Dimensions", "Anchor", "indie designer name")
- [x] Fabric type & count (e.g., 14-count Aida, 28-count evenweave)
- [x] Notes field (free text — source URL, purchase date, kit contents, etc.)
- [x] Display designer name as a subtitle under the pattern name in the library

## Phase 6 — Inventory + Pattern Integration ✅
- [x] Cross-reference pattern color requirements against your inventory
- [x] Shopping list: what you need to buy before starting a pattern
- [x] "Can I start this?" — instant answer based on current stock
- [x] Mark shopping list items as bought → auto-update inventory

## Phase 7 — Sync & Extras ✅
- [x] Cloud backup / sync inventory and patterns across devices (Firebase: Auth + Firestore + Storage)
- [x] Share shopping list or pattern progress
- [x] Notes per color (brand, where purchased, substitute colors)

## Phase 8 — Multi-Brand Thread Support ✅
- [x] Add inventory support for other popular brands: Anchor, J&P Coats, Madeira, Cosmo, Weeks Dye Works, The Gentle Art
- [x] Cross-brand conversion charts (e.g. DMC 321 ↔ Anchor 9046)
- [x] User can set a preferred brand per pattern or globally
- [x] Patterns that list multiple brand codes show all equivalents
- [x] In-app way to contact the developer to request missing brands or colors

## Phase 9 — Community (Nice to Have)
Requires a backend and user accounts.

- [ ] User profiles
- [ ] Upload and share progress photos (WIP shots)
- [ ] Follow other stitchers
- [ ] Like and comment on progress photos
- [ ] Forums / discussion boards by topic (patterns, techniques, brands)
- [ ] Pattern recommendations from the community
- [ ] Finished object (FO) gallery — show off completed projects

## Phase 10 — AI & Camera Features
For physical/paper patterns and loose skeins — cases where there's no PDF to extract from. Requires browser camera access (WebRTC) and an AI/vision backend. (Digital PDF legend extraction is already handled in Phase 5e.)

- [ ] **Barcode scanning** — point camera at a floss skein's barcode to add it to inventory instantly
- [ ] **AI legend scanning** — photograph a paper pattern's color key; AI extracts DMC numbers and cross-references against your stash
- [ ] **Shopping list from legend scan** — auto-generate what to buy based on a scanned legend vs. current inventory

## Phase 11 — Foundation
Stuff that has to happen before features, because changing it later is painful.

- [ ] **Schema migration: skein quantities.** Inventory state goes from `Missing | InStock | Low` to `{ status, count }` where count is an integer ≥ 0. Status becomes derived (`count===0` → Missing, `count>0` → InStock, `count===1` or user-flagged → Low). Migrate existing data: InStock → count=1, Low → count=1+flag, Missing → count=0. Do this now because every later inventory feature (specialty DMC, photo matcher, multi-project shopping list) reads this shape.
- [ ] **PWA installability.** Web app manifest, service worker, offline shell, "Add to Home Screen" prompt. Cache the app shell + DMC catalog + Firebase SDK; let IndexedDB do its thing for user data. This unlocks the "install on iPhone" story and makes offline behavior feel deliberate instead of accidental.
- [ ] **Pattern data model: per-color skein needs.** Confirm Scan PDF actually captures skein counts per color (you said it does — verify on 5–10 real PDFs). Readiness banner should compare needed skeins against owned skeins, not just presence.
- [ ] **Project status field on patterns.** Add `status: "planning" | "in_progress" | "completed" | "on_hold"` and `started_at`, `completed_at` timestamps to the pattern record. Don't expose UI yet — just reserve the fields so Phase 15 doesn't need a migration.

## Phase 12 — Pattern-side parity (the big one)
This is where you close the Pattern Keeper gap. Order matters here because each feature builds on the last.

- [ ] **Symbol highlighting / color filter.** Tap a color in the legend → every cell with that symbol gets a highlight overlay on the chart. This is the single most-praised Pattern Keeper feature. Implementation: you already sample symbols per cell for color matching; reuse that index to filter the overlay layer.
- [ ] **Swipe-to-mark stitches.** Drag across cells to mark a run; support horizontal, vertical, and diagonal. Add a 10×10 block-mark gesture (long-press a corner, drag to opposite corner). Big quality-of-life win that multiplies the value of everything you've already built.
- [ ] **Stitch undo history.** A short undo stack (last 20–50 actions) per pattern session. Cheap to build, prevents the "I just tapped 30 cells with the wrong filter on" disaster.
- [ ] **Daily / session stitch counts.** Track `stitches_marked_today` and `session_started_at`. Show a small "127 stitches today" badge. This is a documented motivator across Pattern Keeper reviews — small feature, outsized engagement impact.
- [ ] **Continuous chart view across page breaks.** Hardest item in this phase. Stitch multi-page PDFs into one virtual canvas so the user can pan across page boundaries seamlessly. Save for last in Phase 12 because it touches grid calibration, rendering, and progress storage all at once.

## Phase 13 — Inventory depth
Now that skein counts exist in the schema, fill them out and broaden coverage.

- [ ] **Skein quantity UI.** +/− buttons on each color row, "I have 3" instead of just a checkmark. Threshold for "Low" becomes user-configurable (default: ≤1 skein).
- [ ] **Specialty DMC lines.** Étoile, Light Effects (metallics), Coloris, Color Variations, Pearl Cotton 3/5/8/12. Treat as separate sub-catalogs under DMC with their own toggle, like StitchStash does. Each gets its own inventory namespace.
- [ ] **Wider brand catalogs.** Expand from 7 brands toward Threadalog's 30+. Prioritize by user demand: Sullivans, CXC, Classic Colorworks, Rainbow Gallery, Kreinik are the most-requested in stitcher communities. Hand-dyed brands (Weeks, Gentle Art) stay sparse — that's a data problem, not a code problem.
- [ ] **Lower-friction "request a color" flow.** The GitHub issue link works for developers; for everyone else, an in-app form that posts to your issue tracker via a serverless function is much friendlier.

## Phase 14 — Specialty stitches & advanced marking
Deeper pattern features that need the Phase 12 foundation.

- [ ] **Fractional stitches.** Quarter, half, three-quarter. Each cell becomes a 2×2 sub-grid with independent state. Pattern Keeper just added tentative support; you can do it cleaner if you start now.
- [ ] **Backstitch.** Lines between cell corners, not fills. Genuinely open territory — neither Pattern Keeper nor MarkUp does this well yet. Worth doing right: store as edges in a graph keyed to grid coordinates.
- [ ] **French knots and other specialty marks.** Once backstitch infrastructure exists, these are mostly UI variants.
- [ ] **Parking markers.** Mark which corner of a square a thread is parked in. Niche but the full-coverage HAED crowd cares deeply.
- [ ] **"Mark to unpick" state.** A separate marking state for "I made a mistake here, fix later." Pattern Keeper added this recently; small change, frequently requested.

## Phase 15 — Project management
Turning the app from a tool into a workflow.

- [ ] **Project status UI.** Surface the schema fields from Phase 11. Filter patterns by Planning / In Progress / Completed / On Hold. Adds a "what should I work on next" answer.
- [ ] **Project journal / progress photos.** Attach photos to a pattern over time, with optional date and notes. Stored in IndexedDB locally, synced via Firebase Storage when signed in. Stitchers love this and it costs almost nothing to build.
- [ ] **Aggregated shopping list across projects.** "I'm starting these 3 patterns — combined, what do I need to buy?" Reads from each pattern's color list, subtracts owned skeins, dedupes. Natural extension of your existing per-pattern shopping list.
- [ ] **Multiple WIPs per pattern.** Some people stitch the same chart twice. Lower priority but the schema should allow it.

## Phase 16 — Differentiators
Things competitors don't have, where you can pull ahead.

- [ ] **Color matcher from photo.** Snap or upload a photo, tap to sample a pixel, get the closest DMC matches ranked by ΔE color distance. Pair it with your existing Convert utility so the result chains into "and here's the Anchor equivalent." Pure differentiator; StitchStash has it on iOS only.
- [ ] **Fabric calculator.** Inputs: stitch count W×H, fabric count (14ct, 18ct, 28ct evenweave over 2, etc.), margin. Outputs: fabric dimensions in inches/cm, recommended cut size with overage. No good free web tool exists — easy SEO win on its own URL.
- [ ] **Pattern Keeper-compatible PDF guidance.** Publish a short doc for designers: "Here's how to format your PDF so Thready's auto-scan works." Then reach out to a handful of indie designers to test. This is distribution, not a feature, but it's where Pattern Keeper got its network effect.

## Phase 17 — Polish & growth
- [ ] **iOS positioning.** Landing page copy that explicitly says "the Pattern Keeper alternative for iPhone." That's a real search query with no good free answer.
- [ ] **Designer / shop integrations.** Etsy purchase import, designer pattern packs, kit pre-loading. Speculative, but if Phase 16's designer outreach works, this is where it leads.
- [ ] **Stitch-along scheduler.** Set goals ("finish by March"), get progress nudges. Magic Needle has this; nobody does it well.
