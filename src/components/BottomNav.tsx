import styles from './BottomNav.module.css'

export type AppScreen = 'inventory' | 'patterns'

interface Props {
  screen: AppScreen
  onNavigate: (screen: AppScreen) => void
}

export default function BottomNav({ screen, onNavigate }: Props) {
  return (
    <nav className={styles.nav}>
      <button
        className={`${styles.tab} ${screen === 'inventory' ? styles.tabActive : ''}`}
        onClick={() => onNavigate('inventory')}
      >
        <span className={styles.label}>Inventory</span>
      </button>
      <button
        className={`${styles.tab} ${screen === 'patterns' ? styles.tabActive : ''}`}
        onClick={() => onNavigate('patterns')}
      >
        <span className={styles.label}>Patterns</span>
      </button>
    </nav>
  )
}
