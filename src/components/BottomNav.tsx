import styles from './BottomNav.module.css'

export type AppScreen = 'inventory' | 'patterns'

interface Props {
  screen: AppScreen
  onNavigate: (screen: AppScreen) => void
}

// Spool of thread — for the inventory tab.
function SpoolIcon({ active }: { active: boolean }) {
  const stroke = active ? 'currentColor' : 'currentColor'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6" y="3.5" width="12" height="3" rx="1.2" stroke={stroke} strokeWidth="1.6" />
      <rect x="6" y="17.5" width="12" height="3" rx="1.2" stroke={stroke} strokeWidth="1.6" />
      <path d="M7.5 6.5h9v11h-9z" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
      {active && (
        <>
          <path d="M7.5 9.2 16.5 11.5" stroke={stroke} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <path d="M7.5 12.8 16.5 14.8" stroke={stroke} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        </>
      )}
    </svg>
  )
}

// Stitched chart grid — for the patterns tab.
function ChartIcon({ active }: { active: boolean }) {
  const stroke = active ? 'currentColor' : 'currentColor'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.2" stroke={stroke} strokeWidth="1.6" />
      <path d="M9 3.5v17M15 3.5v17M3.5 9h17M3.5 15h17" stroke={stroke} strokeWidth="1" opacity="0.55" />
      {active && (
        <>
          <path d="M5.5 5.5l2 2M7.5 5.5l-2 2" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M16.5 16.5l2 2M18.5 16.5l-2 2" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

export default function BottomNav({ screen, onNavigate }: Props) {
  return (
    <nav className={styles.nav}>
      <button
        data-screen="inventory"
        className={`${styles.tab} ${screen === 'inventory' ? styles.tabActive : ''}`}
        onClick={() => onNavigate('inventory')}
      >
        <span className={styles.iconWrap}>
          <SpoolIcon active={screen === 'inventory'} />
        </span>
        <span className={styles.label}>Inventory</span>
      </button>
      <button
        data-screen="patterns"
        className={`${styles.tab} ${screen === 'patterns' ? styles.tabActive : ''}`}
        onClick={() => onNavigate('patterns')}
      >
        <span className={styles.iconWrap}>
          <ChartIcon active={screen === 'patterns'} />
        </span>
        <span className={styles.label}>Patterns</span>
      </button>
    </nav>
  )
}
