import { useMemo, useState } from 'react'
import { DMC_COLORS, FlossStatus } from '../data/dmcColors'
import { useInventory } from '../hooks/useInventory'
import type { PatternColor } from '../hooks/usePatterns'
import styles from './PatternColorList.module.css'

const DMC_BY_NUMBER = new Map(DMC_COLORS.map((c) => [c.number.toLowerCase(), c]))

function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return (Math.max(r, g, b) + Math.min(r, g, b)) / 2 > 0.85
}

const NEXT_STATUS: Record<FlossStatus, FlossStatus> = {
  unowned: 'in_stock',
  in_stock: 'low',
  low: 'unowned',
}

const STATUS_BADGE: Record<FlossStatus, { label: string; className: string; aria: string }> = {
  unowned: { label: '—', className: styles.invBadgeUnowned, aria: 'missing' },
  in_stock: { label: '✓', className: styles.invBadgeInStock, aria: 'in stock' },
  low: { label: '!', className: styles.invBadgeLow, aria: 'low' },
}

interface Props {
  colors: PatternColor[]
  onChange: (colors: PatternColor[]) => void
  patternName: string
}

export default function PatternColorList({ colors, onChange, patternName }: Props) {
  const [dmcInput, setDmcInput] = useState('')
  const [countInput, setCountInput] = useState('')
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)
  const { getStatus, cycleStatus, bulkSetStatus } = useInventory()

  const handleAdd = () => {
    const num = dmcInput.trim()
    if (!num) return
    if (colors.some((c) => c.dmcNumber.toLowerCase() === num.toLowerCase())) {
      setDmcInput('')
      return
    }
    const count = parseInt(countInput)
    onChange([...colors, {
      dmcNumber: num,
      stitchCount: !isNaN(count) && count > 0 ? count : undefined,
      done: false,
    }])
    setDmcInput('')
    setCountInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
  }

  const toggleDone = (dmcNumber: string) =>
    onChange(colors.map((c) => c.dmcNumber === dmcNumber ? { ...c, done: !c.done } : c))

  const remove = (dmcNumber: string) =>
    onChange(colors.filter((c) => c.dmcNumber !== dmcNumber))

  // Resolve each pattern color to its canonical inventory key (DMC number from the
  // master list) so manual-add casing differences don't fragment lookups.
  const canonicalNumberFor = (color: PatternColor): string =>
    DMC_BY_NUMBER.get(color.dmcNumber.toLowerCase())?.number ?? color.dmcNumber

  const inventorySummary = useMemo(() => {
    let missing = 0, low = 0, owned = 0
    const needBuy: string[] = []  // canonical numbers for missing+low
    for (const color of colors) {
      const key = canonicalNumberFor(color)
      const status = getStatus('dmc', key)
      if (status === 'unowned') { missing++; needBuy.push(key) }
      else if (status === 'low') { low++; needBuy.push(key) }
      else owned++
    }
    return { missing, low, owned, total: colors.length, needBuy }
  }, [colors, getStatus])

  const handleMarkAllBought = () => {
    if (inventorySummary.needBuy.length === 0) return
    bulkSetStatus(inventorySummary.needBuy.map((number) => ({ brand: 'dmc' as const, number, status: 'in_stock' as FlossStatus })))
  }

  const totalStitches = colors.reduce((s, c) => s + (c.stitchCount ?? 0), 0)
  const doneStitches = colors.filter((c) => c.done).reduce((s, c) => s + (c.stitchCount ?? 0), 0)
  const doneCount = colors.filter((c) => c.done).length
  const hasSymbols = colors.some((c) => c.symbol || c.symbolImage)

  // Format a list of colors as "DMC NNN — Name (N skeins)" lines.
  const formatColorLines = (items: PatternColor[]): string =>
    items.map((c) => {
      const dmc = DMC_BY_NUMBER.get(c.dmcNumber.toLowerCase())
      const name = dmc?.name ?? 'Unknown'
      const qty = c.skeinCount ? ` (${c.skeinCount} skein${c.skeinCount === 1 ? '' : 's'})`
        : c.stitchCount ? ` (${c.stitchCount.toLocaleString()} sts)`
        : ''
      return `• DMC ${c.dmcNumber} — ${name}${qty}`
    }).join('\n')

  const buildShoppingText = (): string => {
    const needed = colors.filter((c) => {
      const s = getStatus('dmc', canonicalNumberFor(c))
      return s === 'unowned' || s === 'low'
    })
    const lines = [`Shopping list — ${patternName}`]
    if (needed.length === 0) {
      lines.push('', 'All colors in stock — ready to start!')
    } else {
      lines.push(`${needed.length} of ${colors.length} color${colors.length === 1 ? '' : 's'} to buy:`, '')
      lines.push(formatColorLines(needed))
    }
    return lines.join('\n')
  }

  const buildProgressText = (): string => {
    const lines = [`Progress — ${patternName}`, '']
    lines.push(`Colors: ${doneCount} / ${colors.length} done`)
    if (totalStitches > 0) {
      const pct = Math.round((doneStitches / totalStitches) * 100)
      lines.push(`Stitches: ${doneStitches.toLocaleString()} / ${totalStitches.toLocaleString()} (${pct}%)`)
    }
    return lines.join('\n')
  }

  const share = async (title: string, text: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text })
        return
      }
    } catch {
      // user cancelled or share failed — fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(text)
      setShareFeedback('Copied to clipboard')
    } catch {
      setShareFeedback('Could not copy — share unavailable')
    }
    setTimeout(() => setShareFeedback(null), 2500)
  }

  const handleShareShopping = () => share(`Shopping list — ${patternName}`, buildShoppingText())
  const handleShareProgress = () => share(`Progress — ${patternName}`, buildProgressText())

  const ready = colors.length > 0 && inventorySummary.missing === 0 && inventorySummary.low === 0
  const showReadiness = colors.length > 0

  return (
    <div className={styles.container}>
      {/* Add form */}
      <div className={styles.addForm}>
        <input
          className={styles.addInput}
          type="text"
          placeholder="DMC #"
          value={dmcInput}
          onChange={(e) => setDmcInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <input
          className={`${styles.addInput} ${styles.addInputCount}`}
          type="number"
          placeholder="Stitches"
          min={1}
          value={countInput}
          onChange={(e) => setCountInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className={styles.addBtn} onClick={handleAdd} disabled={!dmcInput.trim()}>
          Add
        </button>
      </div>

      {/* Readiness banner — Phase 6 */}
      {showReadiness && (
        <div className={`${styles.readiness} ${ready ? styles.readinessReady : styles.readinessNotReady}`}>
          <div className={styles.readinessText}>
            {ready ? (
              <>
                <span className={styles.readinessIcon} aria-hidden="true">✓</span>
                <span>Ready to start — all {colors.length} color{colors.length === 1 ? '' : 's'} in stock</span>
              </>
            ) : (
              <>
                <span className={styles.readinessIcon} aria-hidden="true">⚠</span>
                <span>
                  {inventorySummary.missing > 0 && (
                    <strong>{inventorySummary.missing} missing</strong>
                  )}
                  {inventorySummary.missing > 0 && inventorySummary.low > 0 && ', '}
                  {inventorySummary.low > 0 && (
                    <strong>{inventorySummary.low} low</strong>
                  )}
                  {' '}of {colors.length}
                </span>
              </>
            )}
          </div>
          {!ready && inventorySummary.needBuy.length > 0 && (
            <button className={styles.markBoughtBtn} onClick={handleMarkAllBought}>
              Mark all as bought
            </button>
          )}
        </div>
      )}

      {colors.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No colors yet</p>
          <p className={styles.emptyHint}>Add DMC numbers from your pattern's legend</p>
        </div>
      ) : (
        <>
          <ul className={styles.list}>
            {colors.map((color) => {
              const dmc = DMC_BY_NUMBER.get(color.dmcNumber.toLowerCase())
              const hex = dmc?.hex ?? '#BBBBBB'
              const name = dmc?.name ?? 'Unknown color'
              const invKey = canonicalNumberFor(color)
              const invStatus = getStatus('dmc', invKey)
              const badge = STATUS_BADGE[invStatus]
              const rowStatusClass =
                invStatus === 'in_stock' ? styles.rowInStock :
                invStatus === 'low' ? styles.rowLow :
                styles.rowMissing
              return (
                <li key={color.dmcNumber} className={`${styles.row} ${rowStatusClass} ${color.done ? styles.rowDone : ''}`}>
                  {hasSymbols && (
                    <div className={styles.symbolCell}>
                      {color.symbolImage
                        ? <img src={color.symbolImage} className={styles.symbolImg} alt={color.symbol ?? ''} />
                        : <span className={styles.symbol}>{color.symbol ?? ''}</span>
                      }
                    </div>
                  )}
                  <div
                    className={styles.swatch}
                    style={{
                      backgroundColor: hex,
                      boxShadow: isLight(hex)
                        ? 'inset 0 0 0 1px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)'
                        : '0 1px 4px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.25)',
                    }}
                  />
                  <div className={styles.info}>
                    <span className={styles.number}>{color.dmcNumber}</span>
                    <span className={styles.name}>{name}</span>
                  </div>
                  {color.stitchCount ? (
                    <span className={styles.stitchCount}>{color.stitchCount.toLocaleString()} sts</span>
                  ) : color.skeinCount ? (
                    <span className={styles.stitchCount}>{color.skeinCount} sk</span>
                  ) : (
                    <span className={styles.stitchCountEmpty}>—</span>
                  )}
                  <button
                    className={`${styles.invBadge} ${badge.className}`}
                    onClick={() => cycleStatus('dmc', invKey)}
                    aria-label={`inventory: ${badge.aria} (tap to change)`}
                    title={`Inventory: ${badge.aria}`}
                  >
                    {badge.label}
                  </button>
                  <button
                    className={`${styles.doneBtn} ${color.done ? styles.doneBtnActive : ''}`}
                    onClick={() => toggleDone(color.dmcNumber)}
                    aria-label={color.done ? 'mark incomplete' : 'mark complete'}
                  >
                    {color.done ? '✓' : '—'}
                  </button>
                  <button className={styles.removeBtn} onClick={() => remove(color.dmcNumber)} aria-label="remove">
                    ×
                  </button>
                </li>
              )
            })}
          </ul>

          <div className={styles.summary}>
            <span>{doneCount} / {colors.length} colors done</span>
            {totalStitches > 0 && (
              <span>{doneStitches.toLocaleString()} / {totalStitches.toLocaleString()} stitches</span>
            )}
          </div>

          <div className={styles.shareBar}>
            {shareFeedback ? (
              <span className={styles.shareFeedback}>{shareFeedback}</span>
            ) : (
              <>
                <button className={styles.shareBtn} onClick={handleShareShopping}>
                  Share shopping list
                </button>
                <button className={styles.shareBtn} onClick={handleShareProgress}>
                  Share progress
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
