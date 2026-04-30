import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import { loadPatternData, saveGridConfig } from '../hooks/usePatterns'
import type { GridConfig } from '../hooks/usePatterns'
import styles from './PdfViewerScreen.module.css'

import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

// Render at 3× so canvas pixels are 3× CSS size — sharp up to 3× zoom.
const RENDER_SCALE = 3

type CalibState =
  | { phase: 'off' }
  | { phase: 'corner1' }
  | { phase: 'corner2'; c1: { x: number; y: number } }

interface Props {
  patternId: string
  patternName: string
  onBack: () => void
}

// Returns the x/y positions of all grid lines in one axis.
function gridPositions(origin: number, step: number, max: number): number[] {
  if (step < 1) return []
  const offset = ((origin % step) + step) % step
  const positions: number[] = []
  for (let p = offset; p <= max; p += step) positions.push(p)
  return positions
}

export default function PdfViewerScreen({ patternId, patternName, onBack }: Props) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number } | null>(null)
  const [gridConfig, setGridConfig] = useState<GridConfig | undefined>(undefined)
  const [calibState, setCalibState] = useState<CalibState>({ phase: 'off' })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const transformRef = useRef<ReactZoomPanPinchRef>(null)

  const isCalibrating = calibState.phase !== 'off'

  // Load PDF + existing grid config from IndexedDB
  useEffect(() => {
    let cancelled = false
    loadPatternData(patternId).then(async (data) => {
      if (!data || cancelled) return
      setGridConfig(data.gridConfig)
      try {
        const doc = await pdfjsLib.getDocument({ data: data.file }).promise
        if (!cancelled) { setPdf(doc); setNumPages(doc.numPages) }
      } catch {
        if (!cancelled) setError('Could not read this PDF.')
      }
    })
    return () => { cancelled = true }
  }, [patternId])

  // Re-render canvas on page change
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
      const cssW = viewport.width / RENDER_SCALE
      const cssH = viewport.height / RENDER_SCALE
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
      const ctx = canvas.getContext('2d')!
      return page.render({ canvas, canvasContext: ctx, viewport }).promise
        .then(() => { if (!cancelled) setCanvasSize({ w: cssW, h: cssH }) })
    }).then(() => {
      if (cancelled) return
      setRendering(false)
      transformRef.current?.resetTransform(0)
    }).catch(() => {
      if (!cancelled) { setError('Failed to render page.'); setRendering(false) }
    })

    return () => { cancelled = true }
  }, [pdf, pageNum])

  // Capture calibration clicks on the SVG overlay
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isCalibrating || !canvasSize) return
    const rect = e.currentTarget.getBoundingClientRect()
    const zoom = rect.width / canvasSize.w
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    if (calibState.phase === 'corner1') {
      setCalibState({ phase: 'corner2', c1: { x, y } })
    } else if (calibState.phase === 'corner2') {
      const cellW = Math.abs(x - calibState.c1.x)
      const cellH = Math.abs(y - calibState.c1.y)
      if (cellW < 2 || cellH < 2) {
        // Points too close — let the user try again
        setCalibState({ phase: 'corner1' })
        return
      }
      const config: GridConfig = {
        originX: Math.min(calibState.c1.x, x),
        originY: Math.min(calibState.c1.y, y),
        cellW, cellH,
      }
      setGridConfig(config)
      setCalibState({ phase: 'off' })
      saveGridConfig(patternId, config)
    }
  }

  const handleClearGrid = () => {
    setGridConfig(undefined)
    saveGridConfig(patternId, undefined)
  }

  const stitchW = canvasSize && gridConfig ? Math.round(canvasSize.w / gridConfig.cellW) : null
  const stitchH = canvasSize && gridConfig ? Math.round(canvasSize.h / gridConfig.cellH) : null

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <span className={styles.title}>{patternName}</span>
        {numPages > 0 && (
          <span className={styles.pageIndicator}>{pageNum} / {numPages}</span>
        )}
      </header>

      {/* Grid toolbar — only shown once PDF is loaded */}
      {pdf && (
        <div className={styles.toolbar}>
          {isCalibrating ? (
            <>
              <button className={styles.toolbarBtn} onClick={() => setCalibState({ phase: 'off' })}>
                Cancel
              </button>
              <span className={styles.toolbarInstruction}>
                {calibState.phase === 'corner1'
                  ? 'Click one corner of a stitch square'
                  : 'Now click the opposite corner'}
              </span>
            </>
          ) : (
            <>
              <button
                className={`${styles.toolbarBtn} ${!gridConfig ? styles.toolbarBtnPrimary : ''}`}
                onClick={() => setCalibState({ phase: 'corner1' })}
              >
                {gridConfig ? 'Recalibrate' : 'Set Grid'}
              </button>
              {gridConfig && (
                <button className={`${styles.toolbarBtn} ${styles.toolbarBtnDanger}`} onClick={handleClearGrid}>
                  Clear Grid
                </button>
              )}
              {stitchW && stitchH && (
                <span className={styles.toolbarStitchCount}>~{stitchW} × {stitchH} stitches</span>
              )}
            </>
          )}
        </div>
      )}

      {/* Viewer */}
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
            panning={{ disabled: isCalibrating }}
            doubleClick={{ disabled: isCalibrating, mode: 'zoomIn' }}
          >
            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
              <div className={styles.canvasWrapper}>
                <canvas ref={canvasRef} className={styles.canvas} />
                {rendering && <div className={styles.renderingOverlay}>Rendering…</div>}

                {/* SVG overlay: grid lines + calibration dots */}
                {canvasSize && (
                  <svg
                    style={{
                      position: 'absolute', top: 0, left: 0,
                      width: canvasSize.w, height: canvasSize.h,
                      overflow: 'visible',
                      pointerEvents: isCalibrating ? 'auto' : 'none',
                      cursor: isCalibrating ? 'crosshair' : 'default',
                    }}
                    onClick={handleSvgClick}
                  >
                    {gridConfig && (
                      <>
                        {gridPositions(gridConfig.originX, gridConfig.cellW, canvasSize.w).map((x, i) => (
                          <line key={`v${i}`} x1={x} y1={0} x2={x} y2={canvasSize.h}
                            stroke="rgba(59,130,246,0.5)" strokeWidth={0.75} />
                        ))}
                        {gridPositions(gridConfig.originY, gridConfig.cellH, canvasSize.h).map((y, i) => (
                          <line key={`h${i}`} x1={0} y1={y} x2={canvasSize.w} y2={y}
                            stroke="rgba(59,130,246,0.5)" strokeWidth={0.75} />
                        ))}
                      </>
                    )}
                    {calibState.phase === 'corner2' && (
                      <circle cx={calibState.c1.x} cy={calibState.c1.y} r={5}
                        fill="rgba(59,130,246,0.85)" stroke="white" strokeWidth={1.5} />
                    )}
                  </svg>
                )}
              </div>
            </TransformComponent>
          </TransformWrapper>
        )}
      </div>

      {/* Page navigation */}
      {numPages > 1 && (
        <nav className={styles.pageNav}>
          <button className={styles.pageBtn}
            onClick={() => setPageNum((n) => Math.max(1, n - 1))}
            disabled={pageNum <= 1}>← Prev</button>
          <span className={styles.pageLabel}>Page {pageNum} of {numPages}</span>
          <button className={styles.pageBtn}
            onClick={() => setPageNum((n) => Math.min(numPages, n + 1))}
            disabled={pageNum >= numPages}>Next →</button>
        </nav>
      )}
    </div>
  )
}
