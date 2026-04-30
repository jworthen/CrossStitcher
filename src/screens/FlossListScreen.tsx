import { useState, useMemo } from 'react'
import { DMC_COLORS, DmcColor } from '../data/dmcColors'
import { useInventory } from '../hooks/useInventory'
import FlossItem from '../components/FlossItem'
import styles from './FlossListScreen.module.css'

type FilterTab = 'all' | 'in_stock' | 'low' | 'unowned'

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in_stock', label: 'In Stock' },
  { key: 'low', label: 'Low' },
  { key: 'unowned', label: 'Missing' },
]

const UNIQUE_COLORS: DmcColor[] = Array.from(
  new Map(DMC_COLORS.map((c) => [c.number, c])).values()
)

export default function FlossListScreen() {
  const { inventory, getStatus, cycleStatus } = useInventory()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

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

  return (
    <div className={styles.container}>
      <div className={styles.sticky}>
        <header className={styles.header}>
          <h1 className={styles.title}>DMC Floss</h1>
          <p className={styles.subtitle}>
            {counts.inStock + counts.low}/{counts.total} owned
            {counts.low > 0 && <> &middot; {counts.low} low</>}
          </p>
        </header>

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
            <button className={styles.clearBtn} onClick={() => setSearch('')} aria-label="Clear search">
              ✕
            </button>
          )}
        </div>

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
      </div>

      <main className={styles.main}>
        {filtered.length === 0 ? (
          <p className={styles.empty}>No colors found.</p>
        ) : (
          <ul className={styles.list}>
            {filtered.map((color) => (
              <FlossItem
                key={color.number}
                color={color}
                status={getStatus(color.number)}
                onPress={() => cycleStatus(color.number)}
              />
            ))}
          </ul>
        )}
      </main>

      <footer className={styles.footer}>
        Tap a color to cycle: missing → in stock → low
      </footer>
    </div>
  )
}
