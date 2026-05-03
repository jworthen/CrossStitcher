import { useEffect, useRef, useState } from 'react'
import { FlossStatus } from '../data/dmcColors'
import { BrandColor } from '../data/brands'
import styles from './FlossItem.module.css'

interface Props {
  color: BrandColor
  status: FlossStatus
  onPress: () => void
  note: string
  onNoteChange: (note: string) => void
}

const STATUS_CONFIG: Record<FlossStatus, { label: string; className: string; rowClassName: string; ariaLabel: string }> = {
  unowned: { label: '—', className: styles.badgeUnowned, rowClassName: '', ariaLabel: 'missing' },
  in_stock: { label: '✓', className: styles.badgeInStock, rowClassName: styles.rowInStock, ariaLabel: 'in stock' },
  low: { label: '!', className: styles.badgeLow, rowClassName: styles.rowLow, ariaLabel: 'low' },
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 220
}

export default function FlossItem({ color, status, onPress, note, onNoteChange }: Props) {
  const config = STATUS_CONFIG[status]
  const light = isLightColor(color.hex)

  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState(note)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { setDraft(note) }, [note])

  useEffect(() => {
    if (expanded) textareaRef.current?.focus()
  }, [expanded])

  const hasNote = note.trim().length > 0

  const commit = () => {
    if (draft !== note) onNoteChange(draft)
  }

  const handleNoteToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded((v) => !v)
  }

  return (
    <li className={styles.rowWrapper}>
      <div className={`${styles.row} ${config.rowClassName}`} onClick={onPress}>
        <div
          className={`${styles.swatch} ${light ? styles.swatchLight : ''}`}
          style={{ backgroundColor: color.hex }}
          aria-hidden="true"
        />
        <div className={styles.info}>
          <span className={styles.number}>{color.number}</span>
          <span className={styles.name}>{color.name}</span>
        </div>
        <button
          className={`${styles.noteBtn} ${hasNote ? styles.noteBtnHasNote : ''} ${expanded ? styles.noteBtnOpen : ''}`}
          onClick={handleNoteToggle}
          aria-label={hasNote ? `edit note for ${color.number}` : `add note for ${color.number}`}
          title={hasNote ? note : 'Add a note'}
        >
          {hasNote ? '✎' : '+'}
        </button>
        <div
          className={`${styles.badge} ${config.className}`}
          role="img"
          aria-label={config.ariaLabel}
        >
          {config.label}
        </div>
      </div>
      {expanded && (
        <div className={styles.notePanel} onClick={(e) => e.stopPropagation()}>
          <textarea
            ref={textareaRef}
            className={styles.noteInput}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            placeholder="Brand, where purchased, substitute colors…"
            rows={2}
          />
          <div className={styles.noteActions}>
            <button
              className={styles.noteCloseBtn}
              onClick={() => { commit(); setExpanded(false) }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
