import { useRef, useState } from 'react'
import { usePatterns, PatternMeta } from '../hooks/usePatterns'
import styles from './PatternLibraryScreen.module.css'

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

interface Props {
  onOpenViewer: (patternId: string, patternName: string) => void
}

export default function PatternLibraryScreen({ onOpenViewer }: Props) {
  const { patterns, loading, addPattern, deletePattern } = usePatterns()
  const [deletePending, setDeletePending] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    await addPattern(file)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (deletePending === id) {
      deletePattern(id)
      setDeletePending(null)
    } else {
      setDeletePending(id)
    }
  }

  const handleRowClick = (p: PatternMeta) => {
    if (deletePending === p.id) { setDeletePending(null); return }
    onOpenViewer(p.id, p.name)
  }

  return (
    <div className={styles.container} onClick={() => setDeletePending(null)}>
      <div className={styles.sticky}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Patterns</h1>
            <p className={styles.subtitle}>
              {loading ? 'Loading…' : `${patterns.length} pattern${patterns.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <button
            className={styles.addBtn}
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
            disabled={uploading}
          >
            {uploading ? 'Adding…' : '+ Add PDF'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </header>
      </div>

      <main className={styles.main}>
        {!loading && patterns.length === 0 ? (
          <div className={styles.empty}>
            <svg
              width="96" height="96" viewBox="0 0 96 96" fill="none"
              aria-hidden="true" className={styles.emptyIllustration}
            >
              {/* Folded pattern page with a stitched corner */}
              <path d="M22 18 H58 L70 30 V78 H22 Z"
                fill="var(--color-surface)" stroke="currentColor" strokeWidth="2"/>
              <path d="M58 18 V30 H70" fill="none" stroke="currentColor" strokeWidth="2"/>
              <path d="M30 42 H62 M30 50 H62 M30 58 H54"
                stroke="currentColor" strokeWidth="1" opacity="0.4" strokeLinecap="round"/>
              {/* Tiny x-stitches in the bottom-right */}
              <path d="M40 66 L46 72 M46 66 L40 72"
                stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M50 66 L56 72 M56 66 L50 72"
                stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p className={styles.emptyTitle}>Your pattern library is empty</p>
            <p className={styles.emptyHint}>Drop in your first PDF to start stitching.</p>
            <button
              className={styles.emptyAddBtn}
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
            >
              + Add Pattern
            </button>
          </div>
        ) : (
          <ul className={styles.list}>
            {patterns.map((p) => (
              <li
                key={p.id}
                className={styles.row}
                onClick={() => handleRowClick(p)}
              >
                <div className={styles.icon} aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M5 3.5h9l5 5V20a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z"
                      stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                    <path d="M14 3.5V8.5h5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                    <path d="M8 13h8M8 16h8M8 19h5" stroke="currentColor" strokeWidth="1" opacity="0.55" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className={styles.info}>
                  <span className={styles.name}>{p.name}</span>
                  {p.designer && <span className={styles.designer}>{p.designer}</span>}
                  <span className={styles.meta}>{formatBytes(p.fileSize)} · {formatDate(p.dateAdded)}</span>
                </div>
                <button
                  className={`${styles.deleteBtn} ${deletePending === p.id ? styles.deleteBtnConfirm : ''}`}
                  onClick={(e) => handleDelete(e, p.id)}
                >
                  {deletePending === p.id ? 'Confirm?' : 'Delete'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
