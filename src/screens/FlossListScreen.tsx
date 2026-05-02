import { useState, useMemo, useRef, useEffect } from 'react'
import { DMC_COLORS, DmcColor, FlossStatus } from '../data/dmcColors'
import { useInventory } from '../hooks/useInventory'
import { useDarkMode } from '../hooks/useDarkMode'
import FlossItem from '../components/FlossItem'
import styles from './FlossListScreen.module.css'

type FilterTab = 'all' | 'in_stock' | 'low' | 'unowned'
type SortMode = 'number' | 'color'
type ListRow = { type: 'header'; label: string } | { type: 'color'; color: DmcColor }

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in_stock', label: 'In Stock' },
  { key: 'low', label: 'Low' },
  { key: 'unowned', label: 'Missing' },
]

const UNIQUE_COLORS: DmcColor[] = Array.from(
  new Map(DMC_COLORS.map((c) => [c.number, c])).values()
)

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
  const { inventory, getStatus, cycleStatus, setStatus, bulkSetStatus } = useInventory()
  const [isDark, toggleDark] = useDarkMode()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [sortMode, setSortMode] = useState<SortMode>('number')
  const [showActions, setShowActions] = useState(false)
  const [resetPending, setResetPending] = useState(false)
  const actionsRef = useRef<HTMLDivElement>(null)

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
    const inStock = UNIQUE_COLORS.filter((c) => getStatus(c.number) === 'in_stock').length
    const low = UNIQUE_COLORS.filter((c) => getStatus(c.number) === 'low').length
    return { inStock, low, total: UNIQUE_COLORS.length }
  }, [inventory, getStatus])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return UNIQUE_COLORS.filter((c) => {
      const matchesSearch =
        !q || c.number.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
      const matchesTab = activeTab === 'all' || getStatus(c.number) === activeTab
      return matchesSearch && matchesTab
    })
  }, [search, activeTab, inventory, getStatus])

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

  // ── Bulk actions ────────────────────────────────────────────────────────────

  const handleGoShopping = () => {
    const updates = UNIQUE_COLORS
      .filter((c) => getStatus(c.number) === 'low')
      .map((c) => ({ number: c.number, status: 'in_stock' as FlossStatus }))
    bulkSetStatus(updates)
    setShowActions(false)
  }

  const handleMarkVisible = (status: FlossStatus) => {
    bulkSetStatus(filtered.map((c) => ({ number: c.number, status })))
    setShowActions(false)
  }

  const handleResetAll = () => {
    if (resetPending) {
      bulkSetStatus(UNIQUE_COLORS.map((c) => ({ number: c.number, status: 'unowned' })))
      setResetPending(false)
      setShowActions(false)
    } else {
      setResetPending(true)
    }
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  const handleExportCSV = () => {
    const header = 'Number,Name,Hex,Status'
    const rows = UNIQUE_COLORS.map(
      (c) => `${c.number},"${c.name}",${c.hex},${getStatus(c.number)}`
    )
    downloadFile([header, ...rows].join('\n'), 'thready-inventory.csv', 'text/csv')
    setShowActions(false)
  }

  const handleExportJSON = () => {
    const data = UNIQUE_COLORS.map((c) => ({
      number: c.number,
      name: c.name,
      hex: c.hex,
      status: getStatus(c.number),
    }))
    downloadFile(
      JSON.stringify(data, null, 2),
      'thready-inventory.json',
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
            <h1 className={styles.title}>DMC Floss</h1>
            <p className={styles.subtitle}>
              {counts.inStock + counts.low}/{counts.total} owned
              {counts.low > 0 && <> &middot; {counts.low} low</>}
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
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search by number or name…"
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

        {/* Tabs */}
        <nav className={styles.tabs}>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
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
          <p className={styles.empty}>No colors found.</p>
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
                  status={getStatus(row.color.number)}
                  onPress={() => cycleStatus(row.color.number)}
                />
              )
            )}
          </ul>
        )}
      </main>

      <footer className={styles.footer}>
        Tap a color to cycle: missing → in stock → low
      </footer>
    </div>
  )
}
