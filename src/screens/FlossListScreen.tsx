import { useState, useMemo, useRef, useEffect } from 'react'
import { FlossStatus } from '../data/dmcColors'
import { BRANDS, BRAND_BY_ID, BrandColor, BrandId, buildColorRequestUrl, catalogFor } from '../data/brands'
import { useInventory } from '../hooks/useInventory'
import { useColorNotes } from '../hooks/useColorNotes'
import { usePreferredBrand } from '../hooks/usePreferredBrand'
import { useDarkMode } from '../hooks/useDarkMode'
import FlossItem, { Density } from '../components/FlossItem'
import ConvertModal from '../components/ConvertModal'
import styles from './FlossListScreen.module.css'

type FilterTab = 'all' | 'in_stock' | 'low' | 'unowned'
type SortMode = 'number' | 'color'

const DENSITY_OPTIONS: { key: Density; label: string }[] = [
  { key: 'compact', label: 'S' },
  { key: 'comfortable', label: 'M' },
  { key: 'spacious', label: 'L' },
]
type ListRow = { type: 'header'; label: string } | { type: 'color'; color: BrandColor }

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in_stock', label: 'In Stock' },
  { key: 'low', label: 'Low' },
  { key: 'unowned', label: 'Missing' },
]

// ── Color family helpers ──────────────────────────────────────────────────────

function hexToHue(hex: string): number | null {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const d = max - min
  if (d < 0.1) return null
  let h: number
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60
  else if (max === g) h = ((b - r) / d + 2) * 60
  else h = ((r - g) / d + 4) * 60
  return h
}

function getLightness(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return (Math.max(r, g, b) + Math.min(r, g, b)) / 2
}

function getColorFamily(hex: string): string {
  const hue = hexToHue(hex)
  if (hue === null) {
    const l = getLightness(hex)
    if (l > 0.82) return 'White & Cream'
    if (l < 0.25) return 'Black & Charcoal'
    return 'Gray'
  }
  if (hue >= 345 || hue < 15) return 'Red'
  if (hue < 30) return 'Red-Orange'
  if (hue < 52) return 'Orange'
  if (hue < 72) return 'Yellow'
  if (hue < 100) return 'Yellow-Green'
  if (hue < 165) return 'Green'
  if (hue < 200) return 'Teal & Aqua'
  if (hue < 255) return 'Blue'
  if (hue < 295) return 'Violet'
  if (hue < 345) return 'Pink & Mauve'
  return 'Red'
}

function getHueSortKey(hex: string): number {
  const hue = hexToHue(hex)
  // Achromatic colors sort after chromatic, light to dark
  if (hue === null) return 1000 + (1 - getLightness(hex)) * 20
  return hue
}

// ── File download helper ──────────────────────────────────────────────────────

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FlossListScreen() {
  const { inventory, getStatus, cycleStatus, bulkSetStatus } = useInventory()
  const { getNote, setNote } = useColorNotes()
  const [brand, setBrand] = usePreferredBrand()
  const [isDark, toggleDark] = useDarkMode()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [sortMode, setSortMode] = useState<SortMode>('number')
  const [density, setDensity] = useState<Density>(() =>
    (localStorage.getItem('thready-density') as Density) || 'comfortable'
  )
  const [showActions, setShowActions] = useState(false)
  const [resetPending, setResetPending] = useState(false)
  const [showConvert, setShowConvert] = useState(false)
  const actionsRef = useRef<HTMLDivElement>(null)

  // Active brand's catalog. Switching the brand selector flips this entirely —
  // each brand has its own browseable color list and its own inventory.
  const colors = useMemo(() => catalogFor(brand), [brand])

  const handleDensity = (d: Density) => {
    setDensity(d)
    localStorage.setItem('thready-density', d)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showActions) return
    const handler = (e: MouseEvent) => {
      if (!actionsRef.current?.contains(e.target as Node)) {
        setShowActions(false)
        setResetPending(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showActions])

  const counts = useMemo(() => {
    const inStock = colors.filter((c) => getStatus(brand, c.number) === 'in_stock').length
    const low = colors.filter((c) => getStatus(brand, c.number) === 'low').length
    return { inStock, low, total: colors.length }
  }, [colors, brand, inventory, getStatus])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return colors.filter((c) => {
      const matchesSearch =
        !q ||
        c.number.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q)
      const matchesTab = activeTab === 'all' || getStatus(brand, c.number) === activeTab
      return matchesSearch && matchesTab
    })
  }, [search, activeTab, colors, brand, inventory, getStatus])

  const listRows = useMemo((): ListRow[] => {
    if (sortMode === 'number') {
      const sorted = [...filtered].sort((a, b) => {
        const aNum = parseInt(a.number, 10)
        const bNum = parseInt(b.number, 10)
        const aIsNum = !isNaN(aNum)
        const bIsNum = !isNaN(bNum)
        if (aIsNum && bIsNum) return aNum - bNum
        if (aIsNum) return -1
        if (bIsNum) return 1
        return a.number.localeCompare(b.number)
      })
      return sorted.map((color) => ({ type: 'color', color }))
    }
    const sorted = [...filtered].sort((a, b) => getHueSortKey(a.hex) - getHueSortKey(b.hex))
    const rows: ListRow[] = []
    let lastFamily = ''
    for (const color of sorted) {
      const family = getColorFamily(color.hex)
      if (family !== lastFamily) {
        rows.push({ type: 'header', label: family })
        lastFamily = family
      }
      rows.push({ type: 'color', color })
    }
    return rows
  }, [filtered, sortMode])

  // ── Bulk actions (act on the active brand's inventory only) ─────────────────

  const handleGoShopping = () => {
    const updates = colors
      .filter((c) => getStatus(brand, c.number) === 'low')
      .map((c) => ({ brand, number: c.number, status: 'in_stock' as FlossStatus }))
    bulkSetStatus(updates)
    setShowActions(false)
  }

  const handleMarkVisible = (status: FlossStatus) => {
    bulkSetStatus(filtered.map((c) => ({ brand, number: c.number, status })))
    setShowActions(false)
  }

  const handleResetAll = () => {
    if (resetPending) {
      bulkSetStatus(colors.map((c) => ({ brand, number: c.number, status: 'unowned' as FlossStatus })))
      setResetPending(false)
      setShowActions(false)
    } else {
      setResetPending(true)
    }
  }

  // ── Export (active brand only) ──────────────────────────────────────────────

  const handleExportCSV = () => {
    const header = 'Brand,Number,Name,Hex,Status'
    const rows = colors.map(
      (c) => `${brand},${c.number},"${c.name}",${c.hex},${getStatus(brand, c.number)}`
    )
    downloadFile([header, ...rows].join('\n'), `thready-inventory-${brand}.csv`, 'text/csv')
    setShowActions(false)
  }

  const handleExportJSON = () => {
    const data = colors.map((c) => ({
      brand,
      number: c.number,
      name: c.name,
      hex: c.hex,
      status: getStatus(brand, c.number),
    }))
    downloadFile(
      JSON.stringify(data, null, 2),
      `thready-inventory-${brand}.json`,
      'application/json'
    )
    setShowActions(false)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={styles.container}>
      <div className={styles.sticky}>

        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>{BRAND_BY_ID[brand].name} Floss</h1>
            <p className={styles.subtitle}>
              {counts.inStock + counts.low}/{counts.total} owned
              {counts.low > 0 && <> &middot; {counts.low} low</>}
              {brand !== 'dmc' && (
                <> &middot; partial catalog</>
              )}
            </p>
          </div>
          <button
            className={styles.darkToggle}
            onClick={toggleDark}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? '☀' : '☾'}
          </button>
        </header>

        {/* Search */}
        <div className={styles.searchBar}>
          <div className={styles.searchInputWrap}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder={`Search ${BRAND_BY_ID[brand].shortName} number or name…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            {search && (
              <button className={styles.clearBtn} onClick={() => setSearch('')} aria-label="Clear">
                ✕
              </button>
            )}
          </div>
          <button
            className={styles.convertBtn}
            onClick={() => setShowConvert(true)}
            title="Convert a code between brands"
          >
            ⇄ Convert
          </button>
        </div>

        {/* Tabs */}
        <nav className={styles.tabs}>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              data-tab={key}
              className={`${styles.tab} ${activeTab === key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.sortToggle}>
            <button
              className={`${styles.sortBtn} ${sortMode === 'number' ? styles.sortBtnActive : ''}`}
              onClick={() => setSortMode('number')}
            >
              # Number
            </button>
            <button
              className={`${styles.sortBtn} ${sortMode === 'color' ? styles.sortBtnActive : ''}`}
              onClick={() => setSortMode('color')}
            >
              ◉ Color
            </button>
          </div>

          <div className={styles.densityToggle}>
            {DENSITY_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                className={`${styles.densityBtn} ${density === key ? styles.densityBtnActive : ''}`}
                onClick={() => handleDensity(key)}
                aria-label={key}
              >
                {label}
              </button>
            ))}
          </div>

          <select
            className={styles.brandSelect}
            value={brand}
            onChange={(e) => setBrand(e.target.value as typeof brand)}
            aria-label="Preferred brand"
            title="Show codes for this brand"
          >
            {BRANDS.map((b) => (
              <option key={b.id} value={b.id}>{b.shortName}</option>
            ))}
          </select>

          <div className={styles.actionsWrapper} ref={actionsRef}>
            <button
              className={styles.actionsBtn}
              onClick={() => { setShowActions((v) => !v); setResetPending(false) }}
            >
              Actions ▾
            </button>
            {showActions && (
              <div className={styles.dropdown}>
                <button className={styles.dropdownItem} onClick={handleGoShopping}>
                  🛒 I went shopping
                  <span className={styles.dropdownHint}>All Low → In Stock</span>
                </button>
                <div className={styles.dropdownDivider} />
                <button className={styles.dropdownItem} onClick={() => handleMarkVisible('in_stock')}>
                  Mark visible as In Stock
                </button>
                <button className={styles.dropdownItem} onClick={() => handleMarkVisible('low')}>
                  Mark visible as Low
                </button>
                <button className={styles.dropdownItem} onClick={() => handleMarkVisible('unowned')}>
                  Mark visible as Missing
                </button>
                <div className={styles.dropdownDivider} />
                <button className={styles.dropdownItem} onClick={handleExportCSV}>
                  Export as CSV
                </button>
                <button className={styles.dropdownItem} onClick={handleExportJSON}>
                  Export as JSON
                </button>
                <div className={styles.dropdownDivider} />
                <a
                  className={styles.dropdownItem}
                  href={buildColorRequestUrl({ brand })}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowActions(false)}
                >
                  Request a missing color
                  <span className={styles.dropdownHint}>Opens GitHub issues</span>
                </a>
                <div className={styles.dropdownDivider} />
                <button
                  className={`${styles.dropdownItem} ${resetPending ? styles.dropdownConfirm : styles.dropdownDanger}`}
                  onClick={handleResetAll}
                >
                  {resetPending ? '⚠ Tap again to confirm' : 'Reset all inventory'}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>{/* /sticky */}

      {/* List */}
      <main className={styles.main}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            {/* Smiling spool with rainbow threads + sparkles */}
            <svg width="110" height="110" viewBox="0 0 110 110" fill="none" aria-hidden="true" className={styles.emptyIllustration}>
              {/* Sparkles */}
              <path d="M14 22 L15 26 L19 27 L15 28 L14 32 L13 28 L9 27 L13 26 Z"
                fill="var(--pastel-butter)" opacity="0.9"/>
              <path d="M96 78 L97 81 L100 82 L97 83 L96 86 L95 83 L92 82 L95 81 Z"
                fill="var(--pastel-pink)" opacity="0.9"/>
              <circle cx="92" cy="22" r="2.5" fill="var(--pastel-mint)" opacity="0.8"/>
              <circle cx="18" cy="80" r="3" fill="var(--pastel-sky)" opacity="0.8"/>

              {/* Spool body */}
              <ellipse cx="55" cy="32" rx="22" ry="6" fill="var(--pastel-peach-soft)" stroke="var(--color-primary)" strokeWidth="1.6"/>
              <rect x="33" y="32" width="44" height="44" rx="3" fill="var(--pastel-pink-soft)" stroke="var(--color-primary)" strokeWidth="1.6"/>
              <ellipse cx="55" cy="76" rx="22" ry="6" fill="var(--pastel-peach-soft)" stroke="var(--color-primary)" strokeWidth="1.6"/>

              {/* Thread wraps in rainbow pastels */}
              <path d="M37 40 H73" stroke="var(--pastel-pink)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M37 47 H73" stroke="var(--pastel-peach)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M37 54 H73" stroke="var(--pastel-butter)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M37 61 H73" stroke="var(--pastel-mint)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M37 68 H73" stroke="var(--pastel-sky)" strokeWidth="2" strokeLinecap="round"/>

              {/* Thread trailing off with a curl */}
              <path d="M73 70 Q88 74 89 84 Q88 92 80 91"
                stroke="var(--pastel-lilac)" strokeWidth="2.2"
                strokeLinecap="round" fill="none"/>

              {/* Eyes + smile */}
              <circle cx="48" cy="49" r="1.6" fill="var(--color-text)" opacity="0.75"/>
              <circle cx="62" cy="49" r="1.6" fill="var(--color-text)" opacity="0.75"/>
              <path d="M48 56 Q55 60 62 56" stroke="var(--color-text)"
                strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.75"/>
              {/* Cheeks */}
              <circle cx="44" cy="55" r="2" fill="var(--pastel-pink)" opacity="0.55"/>
              <circle cx="66" cy="55" r="2" fill="var(--pastel-pink)" opacity="0.55"/>
            </svg>
            <p className={styles.emptyTitle}>
              {search ? `Nothing for "${search}"` : 'Nothing here yet'}
            </p>
            <p className={styles.emptySubtitle}>
              {search ? 'Try a different number, name, or brand code.' : 'No colors match this filter.'}
            </p>
            {search && (
              <button className={styles.emptyClearBtn} onClick={() => setSearch('')}>
                Clear search
              </button>
            )}
          </div>
        ) : (
          <ul className={styles.list}>
            {listRows.map((row, i) =>
              row.type === 'header' ? (
                <li key={`h-${row.label}-${i}`} className={styles.sectionHeader}>
                  {row.label}
                </li>
              ) : (
                <FlossItem
                  key={row.color.number}
                  color={row.color}
                  status={getStatus(brand, row.color.number)}
                  onPress={() => cycleStatus(brand, row.color.number)}
                  density={density}
                  note={getNote(brand, row.color.number)}
                  onNoteChange={(n) => setNote(brand, row.color.number, n)}
                />
              )
            )}
          </ul>
        )}
      </main>

      <footer className={styles.footer}>
        Tap a color to cycle: missing → in stock → low
      </footer>

      {showConvert && <ConvertModal onClose={() => setShowConvert(false)} />}
    </div>
  )
}
