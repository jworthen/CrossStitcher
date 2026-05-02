import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  currentUid,
  loadCloudPatternData,
  savePatternsList,
  saveCloudPatternData,
  deleteCloudPattern,
  subscribePatternsList,
} from '../lib/userPatterns'
import { uploadPatternPdf, downloadPatternPdf, deletePatternPdf } from '../lib/patternStorage'

const DB_NAME = 'thready'
const DB_VERSION = 1
const STORE = 'patterns'

export interface PatternColor {
  dmcNumber: string
  stitchCount?: number
  skeinCount?: number   // skeins needed — read from PDF legend
  done: boolean
  symbol?: string
  symbolImage?: string  // base64 PNG cropped from the rendered PDF legend
}

export interface GridConfig {
  originX: number
  originY: number
  cellW: number
  cellH: number
}

export interface PatternMeta {
  id: string
  name: string
  dateAdded: number
  fileSize: number
  designer?: string
  fabric?: string
  notes?: string
}

interface StoredPattern extends PatternMeta {
  file: ArrayBuffer
  gridConfig?: GridConfig                        // legacy — migrated to gridConfigs on read
  gridConfigs?: Record<number, GridConfig>       // per-page grid configs
  progress?: Record<string, string>
  patternColors?: PatternColor[]
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idbGetAll(db: IDBDatabase): Promise<StoredPattern[]> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idbGet(db: IDBDatabase, id: string): Promise<StoredPattern | undefined> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(id)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idbPut(db: IDBDatabase, record: StoredPattern): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readwrite').objectStore(STORE).put(record)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

function idbDelete(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

function toMeta({ id, name, dateAdded, fileSize, designer, fabric, notes }: PatternMeta): PatternMeta {
  const meta: PatternMeta = { id, name, dateAdded, fileSize }
  if (designer) meta.designer = designer
  if (fabric) meta.fabric = fabric
  if (notes) meta.notes = notes
  return meta
}

// ── Cloud sync helpers ──────────────────────────────────────────────────────

/** Rebuilds the cloud index from current IDB state. No-op when signed out. */
async function syncIndexToCloud(): Promise<void> {
  const uid = currentUid()
  if (!uid) return
  try {
    const db = await openDB()
    const all = await idbGetAll(db)
    await savePatternsList(uid, all.map(toMeta).sort((a, b) => b.dateAdded - a.dateAdded))
  } catch (e) { console.error('syncIndexToCloud:', e) }
}

/** Pushes per-pattern non-file data (grid configs, progress, colors) to cloud. */
async function syncPatternDataToCloud(id: string): Promise<void> {
  const uid = currentUid()
  if (!uid) return
  try {
    const db = await openDB()
    const record = await idbGet(db, id)
    if (!record) return
    await saveCloudPatternData(uid, id, {
      gridConfigs: record.gridConfigs,
      progress: record.progress,
      patternColors: record.patternColors,
    })
  } catch (e) { console.error('syncPatternDataToCloud:', e) }
}

// ── Top-level loaders / savers ──────────────────────────────────────────────

export async function loadPatternData(id: string): Promise<{
  file: ArrayBuffer | null
  gridConfigs: Record<number, GridConfig>
  progress?: Record<string, string>
  patternColors?: PatternColor[]
  name: string
  designer?: string
  fabric?: string
  notes?: string
} | null> {
  const db = await openDB()
  const record = await idbGet(db, id)

  // Migrate legacy single gridConfig → gridConfigs[1]
  const localGrid: Record<number, GridConfig> = { ...(record?.gridConfigs ?? {}) }
  if (record?.gridConfig && !localGrid[1]) localGrid[1] = record.gridConfig

  // If we have the IDB record (i.e. file is here), use it as primary.
  if (record) {
    return {
      file: record.file,
      gridConfigs: localGrid,
      progress: record.progress,
      patternColors: record.patternColors,
      name: record.name,
      designer: record.designer,
      fabric: record.fabric,
      notes: record.notes,
    }
  }

  // No IDB record — try cloud (signed in on a new device). Download the PDF
  // from Firebase Storage and seed IDB so future opens are instant. If the
  // download fails (file never uploaded, network error), still return the
  // cloud-side per-pattern data with file = null so the caller can recover.
  const uid = currentUid()
  if (!uid) return null
  const cloud = await loadCloudPatternData(uid, id)
  if (!cloud) return null

  let file: ArrayBuffer | null = null
  try {
    file = await downloadPatternPdf(uid, id)
  } catch (e) {
    console.error('downloadPatternPdf:', e)
  }

  // Seed IDB with whatever we have so subsequent opens are local-fast.
  if (file) {
    const seeded: StoredPattern = {
      id,
      name: '',
      dateAdded: Date.now(),
      fileSize: file.byteLength,
      file,
      gridConfigs: cloud.gridConfigs,
      progress: cloud.progress,
      patternColors: cloud.patternColors,
    }
    try { await idbPut(db, seeded) } catch { /* quota — ignore */ }
  }

  return {
    file,
    gridConfigs: cloud.gridConfigs ?? {},
    progress: cloud.progress,
    patternColors: cloud.patternColors,
    name: '',  // index has the name; viewer screen receives it via props
  }
}

export async function savePatternMeta(
  id: string,
  patch: Partial<Pick<PatternMeta, 'name' | 'designer' | 'fabric' | 'notes'>>
): Promise<void> {
  const db = await openDB()
  const record = await idbGet(db, id)
  if (!record) return
  const updated: StoredPattern = { ...record, ...patch }
  if (!updated.designer) delete updated.designer
  if (!updated.fabric) delete updated.fabric
  if (!updated.notes) delete updated.notes
  await idbPut(db, updated)
  await syncIndexToCloud()
}

export async function savePatternColors(id: string, patternColors: PatternColor[]): Promise<void> {
  const db = await openDB()
  const record = await idbGet(db, id)
  if (!record) return
  const updated: StoredPattern = { ...record }
  if (patternColors.length > 0) updated.patternColors = patternColors
  else delete updated.patternColors
  await idbPut(db, updated)
  await syncPatternDataToCloud(id)
}

export async function saveProgress(id: string, progress: Record<string, string>): Promise<void> {
  const db = await openDB()
  const record = await idbGet(db, id)
  if (!record) return
  const updated: StoredPattern = { ...record }
  if (Object.keys(progress).length > 0) updated.progress = progress
  else delete updated.progress
  await idbPut(db, updated)
  await syncPatternDataToCloud(id)
}

export async function saveGridConfig(id: string, page: number, gridConfig: GridConfig | undefined): Promise<void> {
  const db = await openDB()
  const record = await idbGet(db, id)
  if (!record) return
  const updated: StoredPattern = { ...record }
  const gridConfigs: Record<number, GridConfig> = { ...(record.gridConfigs ?? {}) }
  if (record.gridConfig && !gridConfigs[1]) gridConfigs[1] = record.gridConfig
  if (gridConfig) gridConfigs[page] = gridConfig
  else delete gridConfigs[page]
  if (Object.keys(gridConfigs).length > 0) updated.gridConfigs = gridConfigs
  else delete updated.gridConfigs
  delete updated.gridConfig
  await idbPut(db, updated)
  await syncPatternDataToCloud(id)
}

// Clears grid config and progress for one page in one atomic write.
export async function clearGridAndProgress(id: string, page: number): Promise<void> {
  const db = await openDB()
  const record = await idbGet(db, id)
  if (!record) return
  const updated: StoredPattern = { ...record }
  const gridConfigs: Record<number, GridConfig> = { ...(record.gridConfigs ?? {}) }
  if (record.gridConfig && !gridConfigs[1]) gridConfigs[1] = record.gridConfig
  delete gridConfigs[page]
  if (Object.keys(gridConfigs).length > 0) updated.gridConfigs = gridConfigs
  else delete updated.gridConfigs
  delete updated.gridConfig
  const prefix = `${page}:`
  const progress: Record<string, string> = {}
  for (const [k, v] of Object.entries(record.progress ?? {})) {
    if (!k.startsWith(prefix)) progress[k] = v
  }
  if (Object.keys(progress).length > 0) updated.progress = progress
  else delete updated.progress
  await idbPut(db, updated)
  await syncPatternDataToCloud(id)
}

export function usePatterns() {
  const { user } = useAuth()
  const [patterns, setPatterns] = useState<PatternMeta[]>([])
  const [loading, setLoading] = useState(true)

  // Initial load from IDB
  useEffect(() => {
    openDB()
      .then((db) => idbGetAll(db))
      .then((all) => {
        setPatterns(all.map(toMeta).sort((a, b) => b.dateAdded - a.dateAdded))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Subscribe to cloud index when signed in. First snapshot merges cloud +
  // local-on-top so any unsynced local-only patterns survive sign-in. Later
  // snapshots from other devices replace state directly.
  useEffect(() => {
    if (!user) return
    let firstSnapshot = true
    return subscribePatternsList(user.uid, (cloudPatterns, hasPendingWrites) => {
      if (hasPendingWrites) return
      if (firstSnapshot) {
        firstSnapshot = false
        setPatterns((local) => {
          const cloudById = new Map(cloudPatterns.map((p) => [p.id, p]))
          const localById = new Map(local.map((p) => [p.id, p]))
          const allIds = new Set([...cloudById.keys(), ...localById.keys()])
          const merged = Array.from(allIds)
            .map((id) => localById.get(id) ?? cloudById.get(id)!)
            .sort((a, b) => b.dateAdded - a.dateAdded)
          // If we contributed anything cloud didn't have, push the union back
          const cloudIds = new Set(cloudById.keys())
          const localOnly = merged.some((p) => !cloudIds.has(p.id))
          if (localOnly) savePatternsList(user.uid, merged).catch(console.error)
          return merged
        })
      } else {
        setPatterns([...cloudPatterns].sort((a, b) => b.dateAdded - a.dateAdded))
      }
    })
  }, [user])

  const addPattern = useCallback(async (file: File) => {
    const buffer = await file.arrayBuffer()
    const record: StoredPattern = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name.replace(/\.pdf$/i, ''),
      dateAdded: Date.now(),
      fileSize: file.size,
      file: buffer,
    }
    const db = await openDB()
    await idbPut(db, record)
    setPatterns((prev) => [toMeta(record), ...prev])
    await syncIndexToCloud()
    // Upload the PDF in the background. Failure is non-fatal — the pattern
    // remains usable locally even if the upload doesn't reach Storage.
    const uid = currentUid()
    if (uid) {
      uploadPatternPdf(uid, record.id, buffer).catch((e) =>
        console.error('uploadPatternPdf:', e)
      )
    }
  }, [])

  const deletePattern = useCallback(async (id: string) => {
    const db = await openDB()
    await idbDelete(db, id)
    setPatterns((prev) => prev.filter((p) => p.id !== id))
    await syncIndexToCloud()
    const uid = currentUid()
    if (uid) {
      await deleteCloudPattern(uid, id).catch(console.error)
      await deletePatternPdf(uid, id)
    }
  }, [])

  const updatePattern = useCallback(async (
    id: string,
    patch: Partial<Pick<PatternMeta, 'name' | 'designer' | 'fabric' | 'notes'>>
  ) => {
    await savePatternMeta(id, patch)
    setPatterns((prev) => prev.map((p) => p.id === id ? { ...p, ...patch } : p))
  }, [])

  // Used in Phase 5b (PDF viewer) — retrieves raw bytes for a stored pattern
  const getPatternFile = useCallback(async (id: string): Promise<ArrayBuffer | null> => {
    const db = await openDB()
    const record = await idbGet(db, id)
    return record?.file ?? null
  }, [])

  return { patterns, loading, addPattern, deletePattern, getPatternFile, updatePattern }
}
