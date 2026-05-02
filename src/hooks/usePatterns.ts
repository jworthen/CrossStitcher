import { useState, useEffect, useCallback } from 'react'

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
  /** Per-pattern preferred brand override; falls back to global if unset. */
  preferredBrand?: string
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

function toMeta({ id, name, dateAdded, fileSize, designer, fabric, notes, preferredBrand }: StoredPattern): PatternMeta {
  const meta: PatternMeta = { id, name, dateAdded, fileSize }
  if (designer) meta.designer = designer
  if (fabric) meta.fabric = fabric
  if (notes) meta.notes = notes
  if (preferredBrand) meta.preferredBrand = preferredBrand
  return meta
}

export async function loadPatternData(id: string): Promise<{
  file: ArrayBuffer
  gridConfigs: Record<number, GridConfig>
  progress?: Record<string, string>
  patternColors?: PatternColor[]
  name: string
  designer?: string
  fabric?: string
  notes?: string
  preferredBrand?: string
} | null> {
  const db = await openDB()
  const record = await idbGet(db, id)
  if (!record) return null
  // Migrate legacy single gridConfig → gridConfigs[1]
  const gridConfigs: Record<number, GridConfig> = { ...(record.gridConfigs ?? {}) }
  if (record.gridConfig && !gridConfigs[1]) gridConfigs[1] = record.gridConfig
  return {
    file: record.file,
    gridConfigs,
    progress: record.progress,
    patternColors: record.patternColors,
    name: record.name,
    designer: record.designer,
    fabric: record.fabric,
    notes: record.notes,
    preferredBrand: record.preferredBrand,
  }
}

export async function savePatternMeta(
  id: string,
  patch: Partial<Pick<PatternMeta, 'name' | 'designer' | 'fabric' | 'notes' | 'preferredBrand'>>
): Promise<void> {
  const db = await openDB()
  const record = await idbGet(db, id)
  if (!record) return
  const updated: StoredPattern = { ...record, ...patch }
  if (!updated.designer) delete updated.designer
  if (!updated.fabric) delete updated.fabric
  if (!updated.notes) delete updated.notes
  if (!updated.preferredBrand) delete updated.preferredBrand
  await idbPut(db, updated)
}

export async function savePatternColors(id: string, patternColors: PatternColor[]): Promise<void> {
  const db = await openDB()
  const record = await idbGet(db, id)
  if (!record) return
  const updated: StoredPattern = { ...record }
  if (patternColors.length > 0) updated.patternColors = patternColors
  else delete updated.patternColors
  await idbPut(db, updated)
}

export async function saveProgress(id: string, progress: Record<string, string>): Promise<void> {
  const db = await openDB()
  const record = await idbGet(db, id)
  if (!record) return
  const updated: StoredPattern = { ...record }
  if (Object.keys(progress).length > 0) updated.progress = progress
  else delete updated.progress
  await idbPut(db, updated)
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
}

export function usePatterns() {
  const [patterns, setPatterns] = useState<PatternMeta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    openDB()
      .then((db) => idbGetAll(db))
      .then((all) => {
        setPatterns(all.map(toMeta).sort((a, b) => b.dateAdded - a.dateAdded))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

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
  }, [])

  const deletePattern = useCallback(async (id: string) => {
    const db = await openDB()
    await idbDelete(db, id)
    setPatterns((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const updatePattern = useCallback(async (
    id: string,
    patch: Partial<Pick<PatternMeta, 'name' | 'designer' | 'fabric' | 'notes' | 'preferredBrand'>>
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
