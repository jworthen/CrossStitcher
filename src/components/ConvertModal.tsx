import { useEffect, useMemo, useState } from 'react'
import {
  BRANDS,
  BRAND_BY_ID,
  BrandId,
  CONVERSIONS,
  brandCodeFor,
  buildColorRequestUrl,
  dmcFromBrandCode,
} from '../data/brands'
import { DMC_COLORS } from '../data/dmcColors'
import styles from './ConvertModal.module.css'

interface Props {
  onClose: () => void
}

const DMC_BY_NUMBER = new Map(DMC_COLORS.map((c) => [c.number, c]))

interface Equivalent {
  brand: BrandId
  code: string | null
}

export default function ConvertModal({ onClose }: Props) {
  const [sourceBrand, setSourceBrand] = useState<BrandId>('dmc')
  const [code, setCode] = useState('')

  // ESC closes the modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Resolve the typed code to a canonical DMC number, then derive equivalents
  // for every other brand from the conversion chart.
  const result = useMemo(() => {
    const trimmed = code.trim()
    if (!trimmed) return null
    const dmc = sourceBrand === 'dmc'
      ? (CONVERSIONS[trimmed] || DMC_BY_NUMBER.has(trimmed) ? trimmed : null)
      : dmcFromBrandCode(sourceBrand, trimmed)
    if (!dmc) return { dmc: null, equivalents: [], colorInfo: null }

    const dmcEntry = DMC_BY_NUMBER.get(dmc) ?? null
    const equivalents: Equivalent[] = BRANDS
      .filter((b) => b.id !== sourceBrand)
      .map((b) => ({ brand: b.id, code: brandCodeFor(b.id, dmc) }))
    return { dmc, equivalents, colorInfo: dmcEntry }
  }, [sourceBrand, code])

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Convert color code">
        <header className={styles.header}>
          <h2 className={styles.title}>Convert color code</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className={styles.body}>
          <div className={styles.inputRow}>
            <select
              className={styles.select}
              value={sourceBrand}
              onChange={(e) => setSourceBrand(e.target.value as BrandId)}
              aria-label="Source brand"
            >
              {BRANDS.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <input
              className={styles.input}
              type="text"
              placeholder="Code, e.g. 321"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
            />
          </div>

          {result && result.dmc === null && (
            <div className={styles.noMatch}>
              <p className={styles.hint}>
                No match for {BRAND_BY_ID[sourceBrand].shortName} <strong>{code}</strong> in the conversion chart.
              </p>
              <a
                className={styles.requestLink}
                href={buildColorRequestUrl({ brand: sourceBrand, code })}
                target="_blank"
                rel="noopener noreferrer"
              >
                Request this color →
              </a>
            </div>
          )}

          {result && result.dmc && (
            <>
              {result.colorInfo && (
                <div className={styles.colorPreview}>
                  <div
                    className={styles.swatch}
                    style={{ backgroundColor: result.colorInfo.hex }}
                    aria-hidden="true"
                  />
                  <div>
                    <div className={styles.colorName}>{result.colorInfo.name}</div>
                    <div className={styles.colorHex}>{result.colorInfo.hex}</div>
                  </div>
                </div>
              )}

              <ul className={styles.list}>
                {result.equivalents.map((eq) => {
                  const b = BRAND_BY_ID[eq.brand]
                  return (
                    <li key={eq.brand} className={styles.equivalent}>
                      <span className={styles.brandLabel}>
                        {b.name}{b.approximate && <span className={styles.approxTag}> · approx</span>}
                      </span>
                      <span className={eq.code ? styles.code : styles.codeMissing}>
                        {eq.code ?? '—'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </>
          )}

          {!result && (
            <p className={styles.hint}>
              Pick a source brand and enter a code to see equivalents in every other brand.
            </p>
          )}
        </div>

        <footer className={styles.footer}>
          Coverage is partial.{' '}
          <a
            className={styles.footerLink}
            href={buildColorRequestUrl()}
            target="_blank"
            rel="noopener noreferrer"
          >
            Request a missing color or brand →
          </a>
        </footer>
      </div>
    </div>
  )
}
