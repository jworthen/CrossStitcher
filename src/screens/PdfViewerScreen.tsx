import { useCallback, useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import { loadPatternData, saveGridConfig, saveProgress, savePatternColors, savePatternMeta, clearGridAndProgress } from '../hooks/usePatterns'
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

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

const DMC_BY_NUMBER = new Map(DMC_COLORS.map((c) => [c.number, c]))
const COMPARE_SIZE = 16  // px — symbol images scaled to this before comparison

export default function PdfViewerScreen({ patternId, patternName, onBack }: Props) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [pageNum, setPageNum] = useState(() => {
    const saved = localStorage.getItem(`thready-lastpage-${patternId}`)
    return saved ? Math.max(1, parseInt(saved, 10)) : 1
  })
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number } | null>(null)
  const [gridConfigs, setGridConfigs] = useState<Record<number, GridConfig>>({})
  const gridConfig = gridConfigs[pageNum]
  const [progress, setProgress] = useState<Record<string, string>>({})
  const [patternColors, setPatternColors] = useState<PatternColor[]>([])
  const [calibState, setCalibState] = useState<CalibState>({ phase: 'off' })
  const [viewTab, setViewTab] = useState<'pattern' | 'colors' | 'info'>('pattern')
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [zoomScale, setZoomScale] = useState(1)
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)
  const [detectedLines, setDetectedLines] = useState<{ h: number[]; v: number[] } | null>(null)
  // Metadata fields
  const [metaName, setMetaName] = useState(patternName)
  const [designer, setDesigner] = useState('')
  const [fabric, setFabric] = useState('')
  const [notes, setNotes] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const transformRef = useRef<ReactZoomPanPinchRef>(null)
  // Pre-rendered symbol ImageData for stitch color matching (keyed by DMC number)
  const symbolDataRef = useRef<Map<string, ImageData>>(new Map())

  const isCalibrating = calibState.phase !== 'off'

  // Load PDF + existing data from IndexedDB
  useEffect(() => {
    let cancelled = false
    loadPatternData(patternId).then(async (data) => {
      if (!data || cancelled) return
      setGridConfigs(data.gridConfigs)
      // Migrate old-format keys ("col,row") to new format ("pageNum:col,row").
      // Old values were `true`; treat them as page 1 stitches with no color.
      const rawProgress = data.progress ?? {}
      const migratedProgress: Record<string, string> = {}
      for (const [k, v] of Object.entries(rawProgress)) {
        if (k.includes(':')) migratedProgress[k] = v as string
        else migratedProgress[`1:${k}`] = ''
      }
      setProgress(migratedProgress)
      setPatternColors(data.patternColors ?? [])
      setMetaName(data.name)
      setDesigner(data.designer ?? '')
      setFabric(data.fabric ?? '')
      setNotes(data.notes ?? '')
      try {
        const doc = await pdfjsLib.getDocument({ data: data.file }).promise
        if (!cancelled) {
          setPdf(doc)
          setNumPages(doc.numPages)
          // Clamp restored page to valid range now that we know numPages
          setPageNum(p => Math.min(p, doc.numPages))
        }
      } catch {
        if (!cancelled) setError('Could not read this PDF.')
      }
    })
    return () => { cancelled = true }
  }, [patternId])

  // Persist last-viewed page so reopening the pattern restores position
  useEffect(() => {
    localStorage.setItem(`thready-lastpage-${patternId}`, String(pageNum))
  }, [pageNum, patternId])

  // Re-render canvas on page change
  useEffect(() => {
    if (!pdf || !canvasRef.current) return
    let cancelled = false
    // Hold the pdf.js RenderTask so we can cancel it properly on cleanup,
    // not just set a JS flag. Without this, the in-flight task keeps drawing
    // to the canvas and can throw errors that race past the `cancelled` check.
    let renderTask: { cancel: () => void } | null = null
    setRendering(true)
    setDetectedLines(null)
    setError(null)

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
      const task = page.render({ canvas, canvasContext: ctx, viewport })
      renderTask = task
      return task.promise
        .then(() => { if (!cancelled) { setCanvasSize({ w: cssW, h: cssH }); setTimeout(detectGridLines, 0) } })
    }).then(() => {
      if (cancelled) return
      setRendering(false)
      transformRef.current?.resetTransform(0)
    }).catch((err) => {
      // RenderingCancelledException fires when .cancel() is called — not a real error.
      if (cancelled || err?.name === 'RenderingCancelledException') return
      setError('Failed to render page.')
      setRendering(false)
    })

    return () => {
      cancelled = true
      renderTask?.cancel()
    }
  }, [pdf, pageNum])

  // Pre-render each color's symbol image to COMPARE_SIZE×COMPARE_SIZE ImageData so
  // detectStitchColor can compare synchronously on every tap.
  useEffect(() => {
    const map = new Map<string, ImageData>()
    symbolDataRef.current = map
    for (const color of patternColors) {
      if (!color.symbolImage) continue
      const img = new Image()
      img.onload = () => {
        const c = document.createElement('canvas')
        c.width = c.height = COMPARE_SIZE
        c.getContext('2d')!.drawImage(img, 0, 0, COMPARE_SIZE, COMPARE_SIZE)
        map.set(color.dmcNumber, c.getContext('2d')!.getImageData(0, 0, COMPARE_SIZE, COMPARE_SIZE))
      }
      img.src = color.symbolImage
    }
  }, [patternColors])

  // Crop the stitch cell from the rendered canvas, scale to COMPARE_SIZE, and find
  // the closest symbol image by mean absolute pixel difference.
  const detectStitchColor = (col: number, row: number): string => {
    const symData = symbolDataRef.current
    if (!canvasRef.current || !gridConfig || symData.size === 0) return ''
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    const cx = Math.round((gridConfig.originX + col * gridConfig.cellW) * RENDER_SCALE)
    const cy = Math.round((gridConfig.originY + row * gridConfig.cellH) * RENDER_SCALE)
    const cw = Math.max(1, Math.round(gridConfig.cellW * RENDER_SCALE))
    const ch = Math.max(1, Math.round(gridConfig.cellH * RENDER_SCALE))
    const x0 = Math.max(0, cx), y0 = Math.max(0, cy)
    const x1 = Math.min(canvas.width, cx + cw), y1 = Math.min(canvas.height, cy + ch)
    if (x1 <= x0 || y1 <= y0) return ''
    const temp = document.createElement('canvas')
    temp.width = x1 - x0; temp.height = y1 - y0
    temp.getContext('2d')!.putImageData(ctx.getImageData(x0, y0, x1 - x0, y1 - y0), 0, 0)
    const scaled = document.createElement('canvas')
    scaled.width = scaled.height = COMPARE_SIZE
    scaled.getContext('2d')!.drawImage(temp, 0, 0, COMPARE_SIZE, COMPARE_SIZE)
    const cellPx = scaled.getContext('2d')!.getImageData(0, 0, COMPARE_SIZE, COMPARE_SIZE).data
    let best = '', bestScore = Infinity
    for (const [dmcNum, imgData] of symData) {
      let diff = 0
      for (let i = 0; i < cellPx.length; i++) diff += Math.abs(cellPx[i] - imgData.data[i])
      if (diff < bestScore) { bestScore = diff; best = dmcNum }
    }
    return best
  }

  const getSvgCoords = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!canvasSize) return null
    const rect = e.currentTarget.getBoundingClientRect()
    const zoom = rect.width / canvasSize.w
    return { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom }
  }

  const getSvgTouchCoords = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!canvasSize) return null
    const touch = e.touches[0] ?? e.changedTouches[0]
    if (!touch) return null
    const rect = e.currentTarget.getBoundingClientRect()
    const zoom = rect.width / canvasSize.w
    return { x: (touch.clientX - rect.left) / zoom, y: (touch.clientY - rect.top) / zoom }
  }

  // Scan the rendered canvas to find where the cross-stitch grid lines are.
  // Strategy: for every (period, phase) pair, average the brightness at positions
  // {phase, phase+period, phase+2*period, …}. The true grid gives the darkest
  // average because every sampled position lands on a dark grid line.
  // Iterating period from small→large ensures the fundamental period wins over harmonics.
  const detectGridLines = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || canvas.width === 0 || canvas.height === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const CW = canvas.width
    const CH = canvas.height
    const cssW = Math.ceil(CW / RENDER_SCALE)
    const cssH = Math.ceil(CH / RENDER_SCALE)

    const data = ctx.getImageData(0, 0, CW, CH).data

    // Build CSS-resolution brightness profiles in one row-major pixel pass.
    // Every canvas pixel contributes to both its CSS row and CSS column bucket.
    const rowAcc = new Float64Array(cssH)
    const colAcc = new Float64Array(cssW)

    for (let y = 0; y < CH; y++) {
      const cy = (y / RENDER_SCALE) | 0
      const base = y * CW * 4
      for (let x = 0; x < CW; x++) {
        const i = base + x * 4
        const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
        rowAcc[cy] += lum
        colAcc[(x / RENDER_SCALE) | 0] += lum
      }
    }

    // Normalise: each CSS row bucket holds CW*RENDER_SCALE values; each CSS col holds CH*RENDER_SCALE
    const rowNorm = CW * RENDER_SCALE
    const colNorm = CH * RENDER_SCALE
    const rowBright = new Float64Array(cssH)
    const colBright = new Float64Array(cssW)
    for (let i = 0; i < cssH; i++) rowBright[i] = rowAcc[i] / rowNorm
    for (let i = 0; i < cssW; i++) colBright[i] = colAcc[i] / colNorm

    // Returns the SMALLEST period (0.25px resolution) where the best-phase score exceeds a
    // threshold. Searching float periods with linear interpolation avoids the integer-period
    // drift problem where a period of 11.76px would never cleanly align on any integer grid.
    const findBestGrid = (profile: Float64Array, minP: number, maxP: number) => {
      const N = profile.length
      if (N < minP * 3) return null
      let mean = 0
      for (let i = 0; i < N; i++) mean += profile[i]
      mean /= N
      let variance = 0
      for (let i = 0; i < N; i++) variance += (profile[i] - mean) ** 2
      const std = Math.sqrt(variance / N)
      if (std < 0.5) return null  // image too uniform — no detectable grid

      const lerp = (pos: number): number => {
        const lo = pos | 0
        const hi = lo + 1
        return hi < N ? profile[lo] + (pos - lo) * (profile[hi] - profile[lo]) : profile[lo]
      }

      // Lowered from 0.9 — dense/colorful charts have thin grid lines whose
      // contrast doesn't reach 0.9 but is still clearly periodic at 0.65.
      const THRESHOLD = 0.65
      const clampedMax = Math.min(maxP, N / 3)

      const evalPeriod = (P: number) => {
        let bestScore = -Infinity, bestPhase = -1
        for (let ps = 0; ps * 0.5 < P; ps++) {
          const phase = ps * 0.5
          let sum = 0, count = 0
          for (let pos = phase; pos < N; pos += P) { sum += lerp(pos); count++ }
          if (count < 3) continue
          const score = (mean - sum / count) / std
          if (score > bestScore) { bestScore = score; bestPhase = phase }
        }
        return { score: bestScore, phase: bestPhase }
      }

      for (let s = 0; minP + s * 0.25 <= clampedMax; s++) {
        const P = minP + s * 0.25
        const { score: bestScore, phase: bestPhase } = evalPeriod(P)
        if (bestScore > THRESHOLD && bestPhase >= 0) {
          // Harmonic guard: if a sub-period also scores well, the detected period
          // is likely a bold-line harmonic (e.g. every-10-stitches bold line).
          // Walk divisors 2–10 and return the smallest that clears half-threshold.
          for (let div = 2; div <= 10; div++) {
            const subP = P / div
            if (subP < minP) break
            const { score: subScore, phase: subPhase } = evalPeriod(subP)
            if (subScore > 0.15 && subPhase >= 0) {
              return { period: subP, phase: subPhase }
            }
          }
          return { period: P, phase: bestPhase }
        }
      }

      return null
    }

    // Analyse the central 70% to skip headers, footers, and legend areas at page edges.
    const rowCropStart = (cssH * 0.15) | 0
    const rowSub = rowBright.subarray(rowCropStart, (cssH * 0.85) | 0)
    const rowGrid = findBestGrid(rowSub, 3, Math.min(120, rowSub.length / 3))

    const colCropStart = (cssW * 0.15) | 0
    const colSub = colBright.subarray(colCropStart, (cssW * 0.85) | 0)
    const colGrid = findBestGrid(colSub, 3, Math.min(120, colSub.length / 3))

    if (!rowGrid || !colGrid) { setDetectedLines(null); return }

    // Cross-stitch cells are always square — average the two independently-detected
    // periods so that rounding differences on each axis don't produce a skewed grid.
    const cellSize = (rowGrid.period + colGrid.period) / 2

    // Adjust phase back to full-page absolute coordinates.
    const rowPhase = (rowGrid.phase + rowCropStart) % cellSize
    const colPhase = (colGrid.phase + colCropStart) % cellSize

    const h: number[] = []
    for (let y = rowPhase; y < cssH; y += cellSize) h.push(y)
    const v: number[] = []
    for (let x = colPhase; x < cssW; x += cellSize) v.push(x)

    console.log(
      `Grid detection: ${v.length}cols × ${h.length}rows = ${v.length * h.length} stitches`,
      `(cellSize=${cellSize.toFixed(2)} from rowPeriod=${rowGrid.period.toFixed(2)} colPeriod=${colGrid.period.toFixed(2)})`,
    )

    setDetectedLines({ h, v })
  }, [])

  // Auto-calibrate: when detection succeeds and no grid is set for this page, apply it.
  useEffect(() => {
    if (!detectedLines || gridConfig) return
    const { h, v } = detectedLines
    if (h.length < 2 || v.length < 2) return
    const config: GridConfig = {
      originX: v[0],
      originY: h[0],
      cellW: v[1] - v[0],
      cellH: h[1] - h[0],
    }
    setGridConfigs(prev => ({ ...prev, [pageNum]: config }))
    saveGridConfig(patternId, pageNum, config)
  }, [detectedLines, gridConfig, pageNum])  // eslint-disable-line react-hooks/exhaustive-deps

  // Return the nearest snappable intersection: detected PDF grid first, overlay grid fallback.
  const getSnapPos = (x: number, y: number): { x: number; y: number } | null => {
    if (detectedLines && detectedLines.h.length > 1 && detectedLines.v.length > 1) {
      const snapR = Math.min(
        detectedLines.h[1] - detectedLines.h[0],
        detectedLines.v[1] - detectedLines.v[0],
      ) * 0.45

      let nearY = NaN, minDY = snapR
      for (const hy of detectedLines.h) { const d = Math.abs(y - hy); if (d < minDY) { minDY = d; nearY = hy } }
      let nearX = NaN, minDX = snapR
      for (const vx of detectedLines.v) { const d = Math.abs(x - vx); if (d < minDX) { minDX = d; nearX = vx } }

      if (!isNaN(nearX) && !isNaN(nearY)) return { x: nearX, y: nearY }
    }
    if (gridConfig) {
      const col = Math.round((x - gridConfig.originX) / gridConfig.cellW)
      const row = Math.round((y - gridConfig.originY) / gridConfig.cellH)
      return { x: gridConfig.originX + col * gridConfig.cellW, y: gridConfig.originY + row * gridConfig.cellH }
    }
    return null
  }

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => setHoverPos(getSvgCoords(e))
  const handleSvgMouseLeave = () => setHoverPos(null)
  const handleSvgTouchStart = (e: React.TouchEvent<SVGSVGElement>) => setHoverPos(getSvgTouchCoords(e))
  const handleSvgTouchEnd = () => setHoverPos(null)

  // Unified SVG click handler — calibration or stitch toggling
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const raw = getSvgCoords(e)
    if (!raw) return

    if (isCalibrating) {
      // Snap calibration corners to detected (or overlay) grid intersections
      const { x, y } = getSnapPos(raw.x, raw.y) ?? raw
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
        setGridConfigs(prev => ({ ...prev, [pageNum]: config }))
        setCalibState({ phase: 'off' })
        // Clear this page's stale progress atomically with the new grid
        setProgress(prev => {
          const next = { ...prev }
          const prefix = `${pageNum}:`
          for (const k of Object.keys(next)) { if (k.startsWith(prefix)) delete next[k] }
          return next
        })
        clearGridAndProgress(patternId, pageNum).then(() => saveGridConfig(patternId, pageNum, config))
      }
    } else if (gridConfig) {
      // Toggle the stitch square under the click
      const col = Math.floor((raw.x - gridConfig.originX) / gridConfig.cellW)
      const row = Math.floor((raw.y - gridConfig.originY) / gridConfig.cellH)
      const key = `${pageNum}:${col},${row}`
      setProgress((prev) => {
        const next = { ...prev }
        if (next[key] !== undefined) {
          delete next[key]
        } else {
          next[key] = detectStitchColor(col, row)
        }
        saveProgress(patternId, next)
        return next
      })
    }
  }

  const handleClearGrid = () => {
    setGridConfigs(prev => { const n = { ...prev }; delete n[pageNum]; return n })
    setDetectedLines(null)
    setProgress(prev => {
      const next = { ...prev }
      const prefix = `${pageNum}:`
      for (const k of Object.keys(next)) { if (k.startsWith(prefix)) delete next[k] }
      return next
    })
    clearGridAndProgress(patternId, pageNum)
    // Re-run detection so auto-calibration fires with a fresh result.
    setTimeout(detectGridLines, 0)
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
          // Strip "/COSMO NNN" suffix (e.g. "310/COSMO 600" → "310")
          const t = next.str.trim().toLowerCase().split('/')[0].trim()
          if (dmcMap.has(t)) { dmcNum = dmcMap.get(t)!; dmcItemIdx = dmcLabelIdx + 1 }
        }

        // Secondary: handle "DMC NNN/COSMO NNN - Name" as a single text item (common in
        // dual-brand color keys where DMC and COSMO numbers appear on the same line).
        if (!dmcNum) {
          for (let idx = 0; idx < rowItems.length; idx++) {
            const m = rowItems[idx].str.match(/\bDMC\s+([A-Za-z0-9]+)/i)
            if (!m) continue
            const t = m[1].toLowerCase()
            if (dmcMap.has(t)) { dmcNum = dmcMap.get(t)!; dmcItemIdx = idx; break }
          }
        }
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
          cropX = symItem.x * OFFSCREEN_SCALE  // no left padding — x is the glyph start
          // PDF y-origin is bottom-left; canvas y-origin is top-left
          cropY = Math.max(0, viewport.height - safeTopPdf * OFFSCREEN_SCALE)
          cropW = Math.min((side + 1) * OFFSCREEN_SCALE, viewport.width - cropX)
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
  const pagePrefix = `${pageNum}:`
  const completedCount = Object.keys(progress).filter((k) => k.startsWith(pagePrefix)).length
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
                {gridConfig ? 'Adjust Grid' : 'Set Grid Manually'}
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
                    onMouseMove={handleSvgMouseMove}
                    onMouseLeave={handleSvgMouseLeave}
                    onTouchStart={handleSvgTouchStart}
                    onTouchEnd={handleSvgTouchEnd}
                    onTouchCancel={handleSvgTouchEnd}
                  >
                    {gridConfig && (
                      <>
                        {/* Completed stitch squares — drawn before grid lines so lines sit on top */}
                        {Object.keys(progress)
                          .filter((k) => k.startsWith(pagePrefix))
                          .map((key) => {
                            const coords = key.slice(key.indexOf(':') + 1)
                            const [col, row] = coords.split(',').map(Number)
                            const rx = gridConfig.originX + col * gridConfig.cellW
                            const ry = gridConfig.originY + row * gridConfig.cellH
                            const dmc = DMC_BY_NUMBER.get(progress[key])
                            const fill = dmc
                              ? hexToRgba(dmc.hex, 0.65)
                              : 'rgba(156,163,175,0.45)'
                            return (
                              <rect key={key}
                                x={rx + 0.5} y={ry + 0.5}
                                width={gridConfig.cellW - 1} height={gridConfig.cellH - 1}
                                fill={fill} />
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
                    {/* Hover cell highlight + snap dot snapped to detected PDF grid */}
                    {!isCalibrating && gridConfig && hoverPos && (() => {
                      const col = Math.floor((hoverPos.x - gridConfig.originX) / gridConfig.cellW)
                      const row = Math.floor((hoverPos.y - gridConfig.originY) / gridConfig.cellH)
                      const rx = gridConfig.originX + col * gridConfig.cellW
                      const ry = gridConfig.originY + row * gridConfig.cellH
                      const isCompleted = !!progress[`${col},${row}`]
                      const sp = getSnapPos(hoverPos.x, hoverPos.y)
                      return (
                        <>
                          <rect
                            x={rx + 0.5} y={ry + 0.5}
                            width={gridConfig.cellW - 1} height={gridConfig.cellH - 1}
                            fill={isCompleted ? 'rgba(239,68,68,0.25)' : 'rgba(59,130,246,0.2)'}
                            stroke={isCompleted ? 'rgba(239,68,68,0.6)' : 'rgba(59,130,246,0.6)'}
                            strokeWidth={1}
                            style={{ pointerEvents: 'none' }}
                          />
                          {sp && (
                            <circle
                              cx={sp.x} cy={sp.y}
                              r={3 / zoomScale}
                              fill="rgba(59,130,246,0.9)"
                              stroke="white"
                              strokeWidth={1 / zoomScale}
                              style={{ pointerEvents: 'none' }}
                            />
                          )}
                        </>
                      )
                    })()}
                    {/* Live grid preview while placing corner2 — shows exactly where the grid will land */}
                    {calibState.phase === 'corner2' && hoverPos && (() => {
                      const sp = getSnapPos(hoverPos.x, hoverPos.y) ?? hoverPos
                      const cellW = Math.abs(sp.x - calibState.c1.x)
                      const cellH = Math.abs(sp.y - calibState.c1.y)
                      if (cellW < 2 || cellH < 2) return null
                      const originX = Math.min(calibState.c1.x, sp.x)
                      const originY = Math.min(calibState.c1.y, sp.y)
                      return (
                        <>
                          {gridPositions(originX, cellW, canvasSize.w).map((x, i) => (
                            <line key={`pv${i}`} x1={x} y1={0} x2={x} y2={canvasSize.h}
                              stroke="rgba(59,130,246,0.3)" strokeWidth={0.75} strokeDasharray={`${3 / zoomScale},${3 / zoomScale}`} />
                          ))}
                          {gridPositions(originY, cellH, canvasSize.h).map((y, i) => (
                            <line key={`ph${i}`} x1={0} y1={y} x2={canvasSize.w} y2={y}
                              stroke="rgba(59,130,246,0.3)" strokeWidth={0.75} strokeDasharray={`${3 / zoomScale},${3 / zoomScale}`} />
                          ))}
                        </>
                      )
                    })()}
                    {calibState.phase === 'corner2' && (
                      <circle cx={calibState.c1.x} cy={calibState.c1.y} r={5 / zoomScale}
                        fill="rgba(59,130,246,0.85)" stroke="white" strokeWidth={1.5 / zoomScale} />
                    )}
                    {/* Calibration cursor dot — snaps to detected PDF grid intersections */}
                    {isCalibrating && hoverPos && (() => {
                      const sp = getSnapPos(hoverPos.x, hoverPos.y) ?? hoverPos
                      return (
                        <circle
                          cx={sp.x} cy={sp.y}
                          r={4 / zoomScale}
                          fill="rgba(59,130,246,0.55)"
                          stroke="white"
                          strokeWidth={1 / zoomScale}
                          style={{ pointerEvents: 'none' }}
                        />
                      )
                    })()}
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
