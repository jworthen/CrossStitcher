# Thready — User Guide

Thready is a free, no-account, no-install web app for tracking your DMC floss
inventory and working through cross-stitch patterns. Everything stays in your
browser.

---

## Quick start

1. Open the app in any modern browser.
2. Tap the **Patterns** tab and add your first PDF.
3. Tap the **Floss** tab and mark a few colors as in stock.

That's it. Your inventory and patterns are saved automatically — close the tab
and they'll be there when you come back.

---

## The Floss tab

This is your DMC stash list — every color, with hex swatches, in one scrollable
view.

### Tracking what you own

Each color has three states:

| Badge | Status     | Meaning                                  |
|-------|------------|------------------------------------------|
| `—`   | Missing    | You don't have this color                |
| `✓`   | In Stock   | You have a full skein                    |
| `!`   | Low        | You're running out — pick up more soon   |

**Tap a row** to cycle through the states: Missing → In Stock → Low → Missing.

### Search and filter

- **Search box** — type a DMC number (e.g. `321`), a code from another brand
  (e.g. `Anchor 9046` or just `9046`), or a color name (e.g. `coral`).
- **Filter tabs** — `All`, `In Stock`, `Low`, `Missing`. Combine with search to
  narrow down further (e.g. find every "low" red).

### Sort and view density

- **# Number / ◉ Color** — switch between numerical order and color-family
  groups (Red, Blue, Yellow-Green, etc.).
- **S / M / L** — pick a row size. Compact fits more colors on screen; spacious
  is easier on phones.

### Preferred brand

The toolbar has a brand picker (DMC / Anchor / Madeira / Cosmo / J&P / Weeks /
Gentle Art). Pick the brand whose numbering you want to see prominently. The
DMC number always appears alongside as a fallback so nothing gets lost in
translation.

If a particular DMC color has no equivalent in the chosen brand's chart,
Thready shows "no <brand> match" instead of a code. The conversion data is
partial — most common colors are covered, but hand-dyed brands like Weeks Dye
Works and The Gentle Art are approximate by their nature, so coverage there is
sparse.

You can also set a different brand **per pattern** from the pattern's Info
tab — useful when a kit ships in Anchor but your stash is DMC.

### Bulk actions (the "Actions ▾" menu)

- **🛒 I went shopping** — flips every "Low" color to "In Stock" in one tap.
  Use this after a craft store run.
- **Mark visible as In Stock / Low / Missing** — applies to whatever's
  currently filtered or searched. Combine with the filter tabs to do things
  like "mark all my low reds as in stock".
- **Export as CSV / JSON** — download your inventory as a file. Useful for
  backups or for sharing with another stitcher.
- **Reset all inventory** — wipes everything back to "Missing". Requires a
  second tap to confirm.

### Notes per color

Each color row has a small **+** button (or **✎** if a note already exists).
Tap it to expand a note field. Use this for things like:

- Brand name, if you mix DMC with another brand
- Where you bought it
- Substitute colors that work in a pinch
- Personal reminders ("kit leftovers from the autumn sampler")

Notes save automatically when you close the field.

### Dark mode

Tap the ☀ / ☾ button in the header to switch. The app respects your system
preference on first load.

---

## The Patterns tab

This is your library of saved PDF patterns.

### Adding a pattern

Tap **+ Add PDF** and pick a file from your device. The PDF is stored locally
in your browser (IndexedDB) — nothing is uploaded to a server.

Patterns are listed newest first, with file size and the date you added them.

### Renaming and deleting

- Open a pattern and use the **Info** tab to rename it (or fill in designer,
  fabric, and notes).
- Tap **Delete** in the library list. Tap again to confirm.

---

## Viewing a pattern

Open a pattern from the library. You'll see three tabs at the top: **Pattern**,
**Colors**, and **Info**.

### Pattern tab — the chart

- **Pinch or scroll-wheel** to zoom. **Drag** to pan.
- **Page navigation** at the bottom for multi-page PDFs.

### Setting up the stitch grid

Thready will try to detect the grid automatically when the page renders. If it
doesn't (or the detection is wrong), calibrate manually:

1. Tap **Set Grid Manually**.
2. Click one corner of any single stitch square.
3. Click the **opposite** corner of that same square.

A live preview shows where the grid will land before you commit. If the grid
looks off, tap **Adjust Grid** to redo it. **Clear Grid** removes the overlay
and any stitch progress on the current page.

The grid extrapolates across the whole page from your one calibrated cell. The
toolbar shows an estimated total stitch count (`~W × H`).

### Marking stitches

Once a grid is set, **tap any cell** to mark it complete. Tap again to undo.
Completed cells get a colored fill — Thready samples the symbol in the cell
and matches it against the colors in your color list, so the fill matches the
DMC color when possible.

A progress bar shows percent complete based on `completed / estimated total`.

Progress is saved per pattern, per page, automatically.

### Colors tab — your color list

This is the per-pattern legend.

#### Auto-scan from PDF

Tap **Scan PDF** to extract every color the pattern uses. Thready:

- Reads the PDF text and finds rows that contain a brand label — `DMC`,
  `Anchor`, `Madeira`, or `Cosmo`
- Converts non-DMC codes back to DMC via the conversion chart so your
  inventory stays consistent
- Pulls the color number, skein count, and crops the symbol image from each
  legend row
- Skips rows already in your list

Auto-scan only works for PDFs whose legend text is selectable. For paper-style
PDFs (scanned images), use manual add.

#### Manual add

Type a color number in your preferred brand's numbering (the placeholder
updates to match) and (optionally) a stitch count, then tap **Add**. Non-DMC
codes are converted to DMC behind the scenes so cross-references and
inventory lookups still work.

#### Working through the list

For each color you'll see:

- The symbol image or text (if extracted)
- A swatch of the DMC color
- The DMC number and color name
- Skein count or stitch count
- An **inventory badge** — tap to cycle inventory status (this is the same
  data as the Floss tab; changes flow both ways)
- A **done** button (`—` / `✓`) — mark a color as fully stitched
- A **×** button to remove the color from this pattern

A summary bar at the bottom shows colors and stitches completed.

#### Readiness banner

At the top of the color list, Thready tells you whether you can start this
pattern based on your current inventory:

- ✓ **Ready to start** — every color is in stock
- ⚠ **N missing, N low** — you need to buy something first

When not ready, **Mark all as bought** flips every missing/low color in this
pattern to "In Stock". Use this after a shopping trip.

#### Sharing

Two buttons at the bottom of the color list:

- **Share shopping list** — generates a plain-text list of colors you still
  need to buy for this pattern
- **Share progress** — generates a summary of how many colors and stitches
  you've completed

Both use your device's native share sheet (Web Share API) when available, or
fall back to copying to your clipboard.

### Info tab — pattern metadata

PDF filenames are often garbled order numbers. Use this tab to set:

- **Pattern name** — what shows in the library and viewer header
- **Designer / brand** — e.g. "Dimensions", "Anchor", indie designer name
- **Fabric** — e.g. "14-count Aida", "28-count evenweave"
- **Notes** — anywhere you want to record source URL, purchase date, kit
  contents, etc.
- **Thread brand for this pattern** — overrides your global preferred brand
  just for this pattern. Default is "follow global". Useful when one kit
  uses Anchor but the rest of your stash is DMC.

All fields save when you tap out of them.

---

## Where your data lives

Everything is stored locally in your browser:

- **Inventory and color notes** — `localStorage`
- **Patterns, grids, and stitch progress** — `IndexedDB`

There is no account. There is no server. Nothing leaves your device unless you
explicitly use Export or Share.

This also means:

- Your data is per-browser and per-device. Using Thready on your laptop
  won't show the same inventory as Thready on your phone.
- Clearing your browser's site data will wipe everything. Use **Export as
  JSON** periodically if you want a backup.

---

## Tips

- **Calibration is the hard part.** Zoom in close before clicking the grid
  corners — accuracy at high zoom translates to a tighter grid across the
  whole page.
- **Scan first, then stitch.** Running "Scan PDF" before you start means the
  stitch-color matching can fill in real DMC colors as you tap cells.
- **Use search + bulk actions together.** Want every shade of blue marked low?
  Search "blue", then Actions → Mark visible as Low.
- **Backup with Export → JSON.** It's the only way to move your inventory
  between devices today.

---

## Troubleshooting

**"Scan PDF" found nothing.**
The PDF probably has no selectable text (it's a scanned image). Add the colors
manually. Also note: scan only recognizes DMC, Anchor, Madeira, and Cosmo
brand labels — other brands need to be entered by hand.

**My color shows "no <brand> match".**
Thready's conversion chart covers most common colors but isn't exhaustive,
especially for hand-dyed brands (Weeks Dye Works, The Gentle Art). The DMC
number is always shown so you can look up an equivalent yourself.

**The auto-detected grid is wrong.**
Tap **Adjust Grid** and calibrate manually. Zoom in first for precision.

**My progress bar shows >100%.**
The estimated total is based on canvas size ÷ cell size. If your pattern has
white margin around the chart, the estimate will be high. The percentage is
informational — actual completion is per-cell.

**I cleared my browser data and lost everything.**
There's no server-side backup. Use Export → JSON regularly to keep a copy.
