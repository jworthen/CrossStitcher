import { DmcColor, FlossStatus } from '../data/dmcColors'
import styles from './FlossItem.module.css'

interface Props {
  color: DmcColor
  status: FlossStatus
  onPress: () => void
}

const STATUS_CONFIG: Record<FlossStatus, { label: string; className: string; ariaLabel: string }> = {
  unowned: { label: '—', className: styles.badgeUnowned, ariaLabel: 'missing' },
  in_stock: { label: '✓', className: styles.badgeInStock, ariaLabel: 'in stock' },
  low: { label: '!', className: styles.badgeLow, ariaLabel: 'low' },
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 220
}

export default function FlossItem({ color, status, onPress }: Props) {
  const config = STATUS_CONFIG[status]
  const light = isLightColor(color.hex)

  return (
    <li className={styles.row} onClick={onPress}>
      <div
        className={`${styles.swatch} ${light ? styles.swatchLight : ''}`}
        style={{ backgroundColor: color.hex }}
        aria-hidden="true"
      />
      <div className={styles.info}>
        <span className={styles.number}>{color.number}</span>
        <span className={styles.name}>{color.name}</span>
      </div>
      <div
        className={`${styles.badge} ${config.className}`}
        role="img"
        aria-label={config.ariaLabel}
      >
        {config.label}
      </div>
    </li>
  )
}
