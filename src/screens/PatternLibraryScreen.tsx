import { useRef, useState } from 'react'
import { usePatterns, PatternMeta } from '../hooks/usePatterns'
import Confetti from '../components/Confetti'
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
  /** uploading is null when idle, or { done, total } during a multi-PDF batch. */
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading({ done: 0, total: files.length })
    // Sequential adds — keeps IDB writes ordered and lets each upload kick off
    // its Storage transfer before we move to the next file.
    for (let i = 0; i < files.length; i++) {
      try { await addPattern(files[i]) } catch (err) { console.error('addPattern:', err) }
      setUploading({ done: i + 1, total: files.length })
    }
    setUploading(null)
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
          <Confetti variant="header" className={styles.headerConfetti} />
          <div className={styles.headerInner}>
            <h1 className={styles.title}>Patterns</h1>
            <p className={styles.subtitle}>
              {loading ? 'Loading…' : `${patterns.length} pattern${patterns.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <button
            className={styles.addBtn}
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
            disabled={uploading !== null}
          >
            {uploading
              ? `Adding ${uploading.done}/${uploading.total}…`
              : '+ Add PDFs'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </header>
      </div>

      <main className={styles.main}>
        {!loading && patterns.length === 0 ? (
          <div className={styles.empty}>
            <Confetti variant="header" className={styles.emptyConfetti} />
            <svg
              width="110" height="110" viewBox="0 0 110 110" fill="none"
              aria-hidden="true" className={styles.emptyIllustration}
            >
              {/* Sparkles */}
              <path d="M16 22 L17 25 L20 26 L17 27 L16 30 L15 27 L12 26 L15 25 Z"
                fill="var(--pastel-butter)" opacity="0.9"/>
              <circle cx="92" cy="20" r="3" fill="var(--pastel-mint)" opacity="0.85"/>
              <circle cx="20" cy="86" r="2.5" fill="var(--pastel-sky)" opacity="0.85"/>

              {/* Pattern page with peach-soft fill */}
              <path d="M28 22 H66 L80 36 V90 H28 Z"
                fill="var(--pastel-peach-soft)" stroke="var(--color-primary)" strokeWidth="2" strokeLinejoin="round"/>
              <path d="M66 22 V36 H80" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinejoin="round"/>

              {/* Lined "content" rendered in friendly pastels */}
              <path d="M36 48 H72" stroke="var(--pastel-pink)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M36 56 H72" stroke="var(--pastel-mint)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M36 64 H62" stroke="var(--pastel-sky)" strokeWidth="2" strokeLinecap="round"/>

              {/* Cross-stitches in the bottom-right */}
              <path d="M44 76 L50 82 M50 76 L44 82"
                stroke="var(--pastel-lilac)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M54 76 L60 82 M60 76 L54 82"
                stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M64 76 L70 82 M70 76 L64 82"
                fill="none" stroke="var(--pastel-butter)" strokeWidth="2" strokeLinecap="round"/>

              {/* Tiny heart in the corner */}
              <path d="M88 82 c -3 -4 -8 -2 -8 2 c 0 3 8 8 8 8 s 8 -5 8 -8 c 0 -4 -5 -6 -8 -2 z"
                fill="var(--pastel-pink)" opacity="0.85"/>
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
