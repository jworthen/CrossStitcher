import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import { loadPatternData, saveGridConfig, saveProgress, savePatternColors, savePatternMeta } from '../hooks/usePatterns'
import type { GridConfig, PatternColor } from '../hooks/usePatterns'
import { DMC_COLORS } from '../data/dmcColors'
import PatternColorList from '../components/PatternColorList'
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
  const [progress, setProgress] = useState<Record<string, true>>({})
  const [patternColors, setPatternColors] = useState<PatternColor[]>([])
  const [calibState, setCalibState] = useState<CalibState>({ phase: 'off' })
  const [viewTab, setViewTab] = useState<'pattern' | 'colors' | 'info'>('pattern')
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [zoomScale, setZoomScale] = useState(1)
  // Metadata fields
  const [metaName, setMetaName] = useState(patternName)
  const [designer, setDesigner] = useState('')
  const [fabric, setFabric] = useState('')
  const [notes, setNotes] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const transformRef = useRef<ReactZoomPanPinchRef>(null)

  const isCalibrating = calibState.phase !== 'off'

  // Load PDF + existing data from IndexedDB
  useEffect(() => {
    let cancelled = false
    loadPatternData(patternId).then(async (data) => {
      if (!data || cancelled) return
      setGridConfig(data.gridConfig)
      setProgress(data.progress ?? {})
      setPatternColors(data.patternColors ?? [])
      setMetaName(data.name)
      setDesigner(data.designer ?? '')
      setFabric(data.fabric ?? '')
      setNotes(data.notes ?? '')
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

  // Unified SVG click handler — calibration or stitch toggling
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!canvasSize) return
    const rect = e.currentTarget.getBoundingClientRect()
    const zoom = rect.width / canvasSize.w
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    if (isCalibrating) {
      if (calibState.phase === 'corner1') {
        setCalibState({ phase: 'corner2', c1: { x, y } })
      } else if (calibState.phase === 'corner2') {
        const cellW = Math.abs(x - calibState.c1.x)
        const cellH = Math.abs(y - calibState.c1.y)
        if (cellW < 2 || cellH < 2) { setCalibState({ phase: 'corner1' }); return }
        const config: GridConfig = {
          originX: Math.min(calibState.c1.x, x),
          originY: Math.min(calibState.c1.y, y),
          cellW, cellH,
        }
        setGridConfig(config)
        setCalibState({ phase: 'off' })
        // Clear stale progress — cell positions are no longer valid after recalibration
        setProgress({})
        saveProgress(patternId, {})
        saveGridConfig(patternId, config)
      }
    } else if (gridConfig) {
      // Toggle the stitch square under the click
      const col = Math.floor((x - gridConfig.originX) / gridConfig.cellW)
      const row = Math.floor((y - gridConfig.originY) / gridConfig.cellH)
      const key = `${col},${row}`
      setProgress((prev) => {
        const next = { ...prev }
        if (next[key]) delete next[key]
        else next[key] = true
        saveProgress(patternId, next)
        return next
      })
    }
  }

  const handleClearGrid = () => {
    setGridConfig(undefined)
    setProgress({})
    saveGridConfig(patternId, undefined)
    saveProgress(patternId, {})
  }

  const scanPdfForColors = async () => {
    if (!pdf) return
    setScanning(true)
    setScanResult(null)

    const dmcMap = new Map(DMC_COLORS.map((c) => [c.number.toLowerCase(), c.number]))
    const Y_TOL = 4

    interface RowItem { str: string; x: number; y: number }

    // Collect text items with x/y positions across all pages
    const allRows: RowItem[][] = []
    for (let p = 1; p <= numPages; p++) {
      const page = await pdf.getPage(p)
      const textContent = await page.getTextContent()

      const items: RowItem[] = []
      for (const item of textContent.items) {
        if (!('str' in item)) continue
        const str = item.str.trim()
        if (!str) continue
        const [, , , , x, y] = item.transform as number[]
        items.push({ str, x, y })
      }

      // Group items into rows by Y coordinate
      const rowMap = new Map<number, RowItem[]>()
      for (const item of items) {
        let matched: number | null = null
        for (const key of rowMap.keys()) {
          if (Math.abs(key - item.y) <= Y_TOL) { matched = key; break }
        }
        if (matched !== null) rowMap.get(matched)!.push(item)
        else rowMap.set(item.y, [item])
      }
      for (const rowItems of rowMap.values()) {
        allRows.push(rowItems.sort((a, b) => a.x - b.x))
      }
    }

    // Parse each row for DMC number + symbol + stitch count
    type Entry = { symbol?: string; stitchCount?: number }
    const found = new Map<string, Entry>()
    const dmcColorNames = new Set(DMC_COLORS.map((c) => c.name.toLowerCase()))

    for (const row of allRows) {
      // Locate DMC number in this row
      let dmcNum: string | null = null
      let dmcItemIdx = -1
      outer: for (let i = 0; i < row.length; i++) {
        for (const token of row[i].str.split(/[\s,;/()\[\]]+/)) {
          const t = token.trim().toLowerCase()
          if (t && dmcMap.has(t)) { dmcNum = dmcMap.get(t)!; dmcItemIdx = i; break outer }
        }
      }
      if (!dmcNum || found.has(dmcNum)) continue

      const isSymbolCandidate = (t: string) =>
        t.length > 0 && t.length <= 4 &&
        !/^\d+$/.test(t) &&
        !dmcMap.has(t.toLowerCase()) &&
        !dmcColorNames.has(t.toLowerCase())

      // Symbol: first check tokens before the DMC token within the same item (handles "X 310"),
      // then fall back to separate items to the left of the DMC column
      let symbol: string | undefined
      for (const token of row[dmcItemIdx].str.split(/[\s,;/()\[\]]+/)) {
        const t = token.trim()
        if (t.toLowerCase() === dmcNum.toLowerCase()) break
        if (isSymbolCandidate(t)) { symbol = t; break }
      }
      if (!symbol) {
        for (let i = 0; i < dmcItemIdx; i++) {
          const str = row[i].str.trim()
          if (isSymbolCandidate(str)) symbol = str
        }
      }

      // Stitch count: a pure integer not in the DMC database
      let stitchCount: number | undefined
      for (const item of row) {
        const str = item.str.trim()
        if (!/^\d+$/.test(str) || dmcMap.has(str.toLowerCase())) continue
        const n = parseInt(str, 10)
        if (n >= 1) { stitchCount = n; break }
      }

      found.set(dmcNum, { symbol, stitchCount })
    }

    const existingNums = new Set(patternColors.map((c) => c.dmcNumber.toLowerCase()))
    const added: PatternColor[] = []
    for (const [num, meta] of found) {
      if (!existingNums.has(num.toLowerCase())) {
        added.push({ dmcNumber: num, done: false, symbol: meta.symbol, stitchCount: meta.stitchCount })
      }
    }

    if (added.length > 0) {
      const next = [...patternColors, ...added]
      setPatternColors(next)
      savePatternColors(patternId, next)
      setScanResult(`Found ${found.size} color${found.size !== 1 ? 's' : ''} — added ${added.length} new`)
    } else if (found.size > 0) {
      setScanResult(`Found ${found.size} color${found.size !== 1 ? 's' : ''} — already in list`)
    } else {
      setScanResult('No DMC numbers found in PDF text')
    }
    setScanning(false)
  }

  const saveMetaField = (patch: Partial<{ name: string; designer: string; fabric: string; notes: string }>) => {
    savePatternMeta(patternId, patch)
  }

  const stitchW = canvasSize && gridConfig ? Math.round(canvasSize.w / gridConfig.cellW) : null
  const stitchH = canvasSize && gridConfig ? Math.round(canvasSize.h / gridConfig.cellH) : null
  const estimatedTotal = stitchW && stitchH ? stitchW * stitchH : 0
  const completedCount = Object.keys(progress).length
  const pct = estimatedTotal > 0 ? Math.min(100, (completedCount / estimatedTotal) * 100) : 0

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <span className={styles.title}>{metaName}</span>
        {numPages > 0 && viewTab === 'pattern' && (
          <span className={styles.pageIndicator}>{pageNum} / {numPages}</span>
        )}
      </header>

      {/* Tab bar */}
      {pdf && (
        <div className={styles.tabBar}>
          <button
            className={`${styles.viewTab} ${viewTab === 'pattern' ? styles.viewTabActive : ''}`}
            onClick={() => setViewTab('pattern')}
          >
            Pattern
          </button>
          <button
            className={`${styles.viewTab} ${viewTab === 'colors' ? styles.viewTabActive : ''}`}
            onClick={() => setViewTab('colors')}
          >
            Colors{patternColors.length > 0 ? ` (${patternColors.length})` : ''}
          </button>
          <button
            className={`${styles.viewTab} ${viewTab === 'info' ? styles.viewTabActive : ''}`}
            onClick={() => setViewTab('info')}
          >
            Info
          </button>
        </div>
      )}

      {/* Grid toolbar — Pattern tab only */}
      {pdf && viewTab === 'pattern' && (
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
                <span className={styles.toolbarStitchCount}>
                  {completedCount} / ~{estimatedTotal} stitches
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* Progress bar — Pattern tab only */}
      {pdf && viewTab === 'pattern' && gridConfig && estimatedTotal > 0 && !isCalibrating && (
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
      )}

      {/* Color list — Colors tab */}
      {viewTab === 'colors' && (
        <div className={styles.colorListArea}>
          {pdf && (
            <div className={styles.scanBar}>
              <button
                className={`${styles.toolbarBtn} ${styles.toolbarBtnPrimary}`}
                onClick={scanPdfForColors}
                disabled={scanning}
              >
                {scanning ? 'Scanning…' : 'Scan PDF'}
              </button>
              {scanResult && <span className={styles.scanResult}>{scanResult}</span>}
            </div>
          )}
          <PatternColorList
            colors={patternColors}
            onChange={(colors) => {
              setPatternColors(colors)
              savePatternColors(patternId, colors)
            }}
          />
        </div>
      )}

      {/* Info tab */}
      {viewTab === 'info' && (
        <div className={styles.infoArea}>
          <div className={styles.infoField}>
            <label className={styles.infoLabel}>Pattern name</label>
            <input
              className={styles.infoInput}
              value={metaName}
              onChange={(e) => setMetaName(e.target.value)}
              onBlur={(e) => { const v = e.target.value.trim(); if (v) { setMetaName(v); saveMetaField({ name: v }) } }}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
            />
          </div>
          <div className={styles.infoRow}>
            <div className={styles.infoField}>
              <label className={styles.infoLabel}>Designer / brand</label>
              <input
                className={styles.infoInput}
                placeholder="e.g. Dimensions, Anchor…"
                value={designer}
                onChange={(e) => setDesigner(e.target.value)}
                onBlur={(e) => saveMetaField({ designer: e.target.value.trim() })}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
              />
            </div>
            <div className={styles.infoField}>
              <label className={styles.infoLabel}>Fabric</label>
              <input
                className={styles.infoInput}
                placeholder="e.g. 14-count Aida…"
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                onBlur={(e) => saveMetaField({ fabric: e.target.value.trim() })}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
              />
            </div>
          </div>
          <div className={styles.infoField}>
            <label className={styles.infoLabel}>Notes</label>
            <textarea
              className={`${styles.infoInput} ${styles.infoTextarea}`}
              placeholder="Source URL, purchase date, kit contents…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={(e) => saveMetaField({ notes: e.target.value.trim() })}
            />
          </div>
        </div>
      )}

      {/* Viewer — Pattern tab */}
      <div className={styles.viewerArea} style={{ display: viewTab === 'pattern' ? 'flex' : 'none' }}>
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
            onTransform={(_, state) => setZoomScale(state.scale)}
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
                      pointerEvents: (isCalibrating || !!gridConfig) ? 'auto' : 'none',
                      cursor: isCalibrating ? 'crosshair' : (gridConfig ? 'pointer' : 'default'),
                    }}
                    onClick={handleSvgClick}
                  >
                    {gridConfig && (
                      <>
                        {/* Completed stitch squares — drawn before grid lines so lines sit on top */}
                        {Object.keys(progress).map((key) => {
                          const [col, row] = key.split(',').map(Number)
                          const rx = gridConfig.originX + col * gridConfig.cellW
                          const ry = gridConfig.originY + row * gridConfig.cellH
                          return (
                            <rect key={key}
                              x={rx + 0.5} y={ry + 0.5}
                              width={gridConfig.cellW - 1} height={gridConfig.cellH - 1}
                              fill="rgba(34,197,94,0.4)" />
                          )
                        })}
                        {/* Grid lines */}
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
                      <circle cx={calibState.c1.x} cy={calibState.c1.y} r={5 / zoomScale}
                        fill="rgba(59,130,246,0.85)" stroke="white" strokeWidth={1.5 / zoomScale} />
                    )}
                  </svg>
                )}
              </div>
            </TransformComponent>
          </TransformWrapper>
        )}
      </div>

      {/* Page navigation — Pattern tab only */}
      {viewTab === 'pattern' && numPages > 1 && (
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
