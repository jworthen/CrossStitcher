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
            <div className={styles.emptyIcon}>📄</div>
            <p className={styles.emptyTitle}>No patterns yet</p>
            <p className={styles.emptyHint}>Add a PDF to get started</p>
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
                <div className={styles.icon}>📄</div>
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
