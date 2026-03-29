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

## Phase 3 — Pattern Integration
- [ ] Manual pattern entry (paste a list of DMC numbers)
- [ ] Import color list from file (CSV or plain text)
- [ ] Cross-reference pattern requirements against your inventory
- [ ] Shopping list view: what you need to buy for a specific pattern
- [ ] Pattern Keeper compatibility: import exported color lists

## Phase 4 — Extended Features
- [ ] Track multiple patterns simultaneously
- [ ] "What patterns can I start right now?" based on current stock
- [ ] Cloud backup / sync across devices
- [ ] Share shopping list
- [ ] Notes per color (e.g., brand, where purchased)
