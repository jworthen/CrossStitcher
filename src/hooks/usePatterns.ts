import { useState, useEffect, useCallback } from 'react'

const DB_NAME = 'crossstitcher'
const DB_VERSION = 1
const STORE = 'patterns'

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
}

interface StoredPattern extends PatternMeta {
  file: ArrayBuffer
  gridConfig?: GridConfig
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

function toMeta({ id, name, dateAdded, fileSize }: StoredPattern): PatternMeta {
  return { id, name, dateAdded, fileSize }
}

export async function loadPatternData(id: string): Promise<{ file: ArrayBuffer; gridConfig?: GridConfig } | null> {
  const db = await openDB()
  const record = await idbGet(db, id)
  if (!record) return null
  return { file: record.file, gridConfig: record.gridConfig }
}

export async function saveGridConfig(id: string, gridConfig: GridConfig | undefined): Promise<void> {
  const db = await openDB()
  const record = await idbGet(db, id)
  if (!record) return
  const updated: StoredPattern = { ...record }
  if (gridConfig) updated.gridConfig = gridConfig
  else delete updated.gridConfig
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

  // Used in Phase 5b (PDF viewer) — retrieves raw bytes for a stored pattern
  const getPatternFile = useCallback(async (id: string): Promise<ArrayBuffer | null> => {
    const db = await openDB()
    const record = await idbGet(db, id)
    return record?.file ?? null
  }, [])

  return { patterns, loading, addPattern, deletePattern, getPatternFile }
}
