import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import { loadPatternFile } from '../hooks/usePatterns'
import styles from './PdfViewerScreen.module.css'

import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

// Render at 3× — canvas pixels are 3× the CSS display size, giving sharp
// text and grid lines up to 3× zoom before the canvas becomes a limiting factor.
const RENDER_SCALE = 3

interface Props {
  patternId: string
  patternName: string
  onBack: () => void
}

export default function PdfViewerScreen({ patternId, patternName, onBack }: Props) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const transformRef = useRef<ReactZoomPanPinchRef>(null)

  // Load PDF document from IndexedDB on mount
  useEffect(() => {
    let cancelled = false
    loadPatternFile(patternId).then(async (buffer) => {
      if (!buffer || cancelled) return
      try {
        const doc = await pdfjsLib.getDocument({ data: buffer }).promise
        if (!cancelled) {
          setPdf(doc)
          setNumPages(doc.numPages)
        }
      } catch {
        if (!cancelled) setError('Could not read this PDF.')
      }
    })
    return () => { cancelled = true }
  }, [patternId])

  // Re-render canvas whenever the document or page number changes
  useEffect(() => {
    if (!pdf || !canvasRef.current) return
    let cancelled = false
    setRendering(true)

    pdf.getPage(pageNum).then((page) => {
      if (cancelled || !canvasRef.current) return
      const viewport = page.getViewport({ scale: RENDER_SCALE })
      const canvas = canvasRef.current
      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.width = `${viewport.width / RENDER_SCALE}px`
      canvas.style.height = `${viewport.height / RENDER_SCALE}px`
      const ctx = canvas.getContext('2d')!
      return page.render({ canvas, canvasContext: ctx, viewport }).promise
    }).then(() => {
      if (cancelled) return
      setRendering(false)
      transformRef.current?.resetTransform(0)
    }).catch(() => {
      if (!cancelled) { setError('Failed to render page.'); setRendering(false) }
    })

    return () => { cancelled = true }
  }, [pdf, pageNum])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <span className={styles.title}>{patternName}</span>
        {numPages > 0 && (
          <span className={styles.pageIndicator}>{pageNum} / {numPages}</span>
        )}
      </header>

      <div className={styles.viewerArea}>
        {error ? (
          <p className={styles.message}>{error}</p>
        ) : !pdf ? (
          <p className={styles.message}>Loading…</p>
        ) : (
          <TransformWrapper
            ref={transformRef}
            initialScale={1}
            minScale={0.2}
            maxScale={5}
            centerOnInit
            doubleClick={{ mode: 'zoomIn' }}
          >
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%' }}
            >
              <div className={styles.canvasWrapper}>
                <canvas ref={canvasRef} className={styles.canvas} />
                {rendering && <div className={styles.renderingOverlay}>Rendering…</div>}
              </div>
            </TransformComponent>
          </TransformWrapper>
        )}
      </div>

      {numPages > 1 && (
        <nav className={styles.pageNav}>
          <button
            className={styles.pageBtn}
            onClick={() => setPageNum((n) => Math.max(1, n - 1))}
            disabled={pageNum <= 1}
          >
            ← Prev
          </button>
          <span className={styles.pageLabel}>Page {pageNum} of {numPages}</span>
          <button
            className={styles.pageBtn}
            onClick={() => setPageNum((n) => Math.min(numPages, n + 1))}
            disabled={pageNum >= numPages}
          >
            Next →
          </button>
        </nav>
      )}
    </div>
  )
}
