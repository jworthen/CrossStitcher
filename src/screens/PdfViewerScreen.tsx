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
    const dmcColorNames = new Set(DMC_COLORS.map((c) => c.name.toLowerCase()))
    const Y_TOL = 4
    const OFFSCREEN_SCALE = 3  // higher scale → sharper symbol crops
    const CROP_PX = 48         // output size in px
    const CROP_PAD = 2         // padding around symbol in PDF points

    interface RowItem { str: string; x: number; y: number; h: number }

    const results = new Map<string, {
      symbolText?: string
      symbolImage?: string
      skeinCount?: number
    }>()

    for (let p = 1; p <= numPages; p++) {
      const page = await pdf.getPage(p)
      const viewport = page.getViewport({ scale: OFFSCREEN_SCALE })
      const textContent = await page.getTextContent()

      const items: RowItem[] = []
      for (const item of textContent.items) {
        if (!('str' in item)) continue
        const str = item.str.trim()
        if (!str) continue
        const tf = item.transform as number[]
        const x = tf[4], y = tf[5]
        const h = (item as unknown as { height: number }).height || Math.abs(tf[0]) || 10
        items.push({ str, x, y, h })
      }

      const rowMap = new Map<number, RowItem[]>()
      for (const item of items) {
        let matched: number | null = null
        for (const key of rowMap.keys()) {
          if (Math.abs(key - item.y) <= Y_TOL) { matched = key; break }
        }
        if (matched !== null) rowMap.get(matched)!.push(item)
        else rowMap.set(item.y, [item])
      }

      type PageEntry = {
        dmcNum: string
        symbolText?: string
        skeinCount?: number
        cropX: number; cropY: number; cropW: number; cropH: number
        hasCrop: boolean
      }
      const pageEntries: PageEntry[] = []

      // Sorted row baselines (ascending PDF y = bottom-to-top) used to find the
      // row immediately above each legend row so the crop never bleeds into it.
      const sortedRowYs = Array.from(rowMap.keys()).sort((a, b) => a - b)

      for (const [rowKey, rowItems] of rowMap.entries()) {
        rowItems.sort((a, b) => a.x - b.x)

        let dmcNum: string | null = null
        let dmcItemIdx = -1

        // Primary: find literal "DMC" brand label → next item is the color number.
        // This avoids misidentifying the strand count (e.g. "2") as a DMC color.
        const dmcLabelIdx = rowItems.findIndex((it) => it.str.trim() === 'DMC')
        if (dmcLabelIdx >= 0 && dmcLabelIdx + 1 < rowItems.length) {
          const next = rowItems[dmcLabelIdx + 1]
          const t = next.str.trim().toLowerCase()
          if (dmcMap.has(t)) { dmcNum = dmcMap.get(t)!; dmcItemIdx = dmcLabelIdx + 1 }
        }

        // No fallback — only trust rows with an explicit "DMC" label to avoid false positives
        // from stitch counts, dimensions, or other numbers elsewhere in the PDF.
        if (!dmcNum || results.has(dmcNum)) continue

        // Symbol: leftmost item. Digits are intentionally allowed — proprietary symbol fonts
        // often map glyphs to digit codepoints, so filtering them out drops valid symbols.
        let symbolText: string | undefined
        if (dmcItemIdx > 0) {
          const s = rowItems[0].str.trim()
          if (s.length > 0 && s.length <= 4 && !dmcMap.has(s.toLowerCase()) && !dmcColorNames.has(s.toLowerCase())) {
            symbolText = s
          }
        }

        // Skein count: items after the color number column, strip commas for "1,234" format.
        let skeinCount: number | undefined
        for (let i = dmcItemIdx + 1; i < rowItems.length; i++) {
          const str = rowItems[i].str.trim().replace(/,/g, '')
          if (!/^\d+$/.test(str)) continue
          const n = parseInt(str, 10)
          if (n >= 1) { skeinCount = n; break }
        }

        // Crop a square around the symbol. Use the midpoint between this row's
        // baseline and the row above as the top boundary — this is exact regardless
        // of how item.height relates to the actual glyph height or line spacing.
        const symItem = dmcItemIdx > 0 ? rowItems[0] : null
        let cropX = 0, cropY = 0, cropW = 0, cropH = 0, hasCrop = false
        if (symItem) {
          const symH = symItem.h > 0 ? symItem.h : 10
          const thisIdx = sortedRowYs.findIndex((ry) => Math.abs(ry - rowKey) < 1)
          const aboveY = thisIdx + 1 < sortedRowYs.length
            ? sortedRowYs[thisIdx + 1]
            : rowKey + symH * 2
          // safeTop: midpoint to the row above — guaranteed not to bleed
          const safeTopPdf = (rowKey + aboveY) / 2
          const botPdf = rowKey - CROP_PAD
          const side = safeTopPdf - botPdf  // square side in PDF points
          cropX = Math.max(0, (symItem.x - CROP_PAD) * OFFSCREEN_SCALE)
          // PDF y-origin is bottom-left; canvas y-origin is top-left
          cropY = Math.max(0, viewport.height - safeTopPdf * OFFSCREEN_SCALE)
          cropW = Math.min(side * OFFSCREEN_SCALE, viewport.width - cropX)
          cropH = Math.min(side * OFFSCREEN_SCALE, viewport.height - cropY)
          hasCrop = cropW > 4 && cropH > 4
        }

        pageEntries.push({ dmcNum, symbolText, skeinCount, cropX, cropY, cropW, cropH, hasCrop })
      }

      if (pageEntries.length === 0) continue

      const offscreen = document.createElement('canvas')
      offscreen.width = viewport.width
      offscreen.height = viewport.height
      const offCtx = offscreen.getContext('2d')!
      await page.render({ canvas: offscreen, canvasContext: offCtx, viewport }).promise

      for (const entry of pageEntries) {
        let symbolImage: string | undefined
        if (entry.hasCrop) {
          const crop = document.createElement('canvas')
          crop.width = CROP_PX
          crop.height = CROP_PX
          const ctx = crop.getContext('2d')!
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, CROP_PX, CROP_PX)
          ctx.drawImage(offscreen, entry.cropX, entry.cropY, entry.cropW, entry.cropH,
                        0, 0, CROP_PX, CROP_PX)
          symbolImage = crop.toDataURL('image/png')
        }
        results.set(entry.dmcNum, { symbolText: entry.symbolText, symbolImage, skeinCount: entry.skeinCount })
      }
    }

    const existingNums = new Set(patternColors.map((c) => c.dmcNumber.toLowerCase()))
    const added: PatternColor[] = []
    for (const [num, meta] of results) {
      if (!existingNums.has(num.toLowerCase())) {
        added.push({
          dmcNumber: num, done: false,
          symbol: meta.symbolText, symbolImage: meta.symbolImage, skeinCount: meta.skeinCount,
        })
      }
    }

    if (added.length > 0) {
      const next = [...patternColors, ...added]
      setPatternColors(next)
      savePatternColors(patternId, next)
      setScanResult(`Found ${results.size} color${results.size !== 1 ? 's' : ''} — added ${added.length} new`)
    } else if (results.size > 0) {
      setScanResult(`Found ${results.size} color${results.size !== 1 ? 's' : ''} — already in list`)
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
