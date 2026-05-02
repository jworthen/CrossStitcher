import { useEffect, useRef, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'

interface Options<V> {
  /** localStorage key. Always written, regardless of sign-in state. */
  storageKey: string
  /** Builds the slash-joined Firestore document path for a uid (e.g. `users/{uid}/data/inventory`). */
  docPath: (uid: string) => string
  /**
   * Migrates raw stored data on read. Used to upgrade legacy bare-number keys
   * to the new `${brand}:${number}` namespacing without dropping data.
   */
  migrate?: (raw: Record<string, V>) => Record<string, V>
}

function loadFromStorage<V>(key: string, migrate?: (r: Record<string, V>) => Record<string, V>): Record<string, V> {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, V>
    return migrate ? migrate(parsed) : parsed
  } catch {
    return {}
  }
}

function saveToStorage<V>(key: string, value: Record<string, V>) {
  try { localStorage.setItem(key, JSON.stringify(value)) }
  catch { /* quota — silently ignore */ }
}

/**
 * A Record<string, V> that lives in localStorage when signed out, and syncs
 * to a single Firestore document when signed in.
 *
 * On sign-in, local data merges with cloud (cloud + local-on-top). The merged
 * result is written back to Firestore so it propagates to other devices.
 *
 * Subsequent updates flow both ways: local mutations write through, and other
 * devices' changes arrive via onSnapshot. Our own pending writes are filtered
 * out via snap.metadata.hasPendingWrites so we don't echo state back at
 * ourselves mid-toggle.
 */
export function useSyncedRecord<V>(opts: Options<V>): {
  record: Record<string, V>
  setRecord: (next: Record<string, V>) => void
} {
  const { user } = useAuth()
  const [record, setRecordState] = useState<Record<string, V>>(() =>
    loadFromStorage<V>(opts.storageKey, opts.migrate)
  )
  // Latest record value, accessible synchronously inside the snapshot callback.
  const recordRef = useRef(record)
  recordRef.current = record

  useEffect(() => {
    if (!user || !db) return
    const ref = doc(db, opts.docPath(user.uid))
    let firstSnapshot = true

    return onSnapshot(ref, (snap) => {
      if (snap.metadata.hasPendingWrites) return  // our own write echoing back
      const cloud = ((snap.data() as Record<string, V> | undefined) ?? {})

      if (firstSnapshot) {
        firstSnapshot = false
        // Merge: cloud first, local on top — most recent local actions win.
        const merged = { ...cloud, ...recordRef.current }
        const cloudKeys = Object.keys(cloud)
        const mergedKeys = Object.keys(merged)
        const needsPush =
          mergedKeys.length !== cloudKeys.length ||
          mergedKeys.some((k) => merged[k] !== cloud[k])
        if (needsPush) setDoc(ref, merged as Record<string, unknown>).catch(console.error)
        setRecordState(merged)
        saveToStorage(opts.storageKey, merged)
      } else {
        setRecordState(cloud)
        saveToStorage(opts.storageKey, cloud)
      }
    })
  }, [user])  // eslint-disable-line react-hooks/exhaustive-deps

  const setRecord = (next: Record<string, V>) => {
    setRecordState(next)
    saveToStorage(opts.storageKey, next)
    if (user && db) {
      setDoc(doc(db, opts.docPath(user.uid)), next as Record<string, unknown>).catch(console.error)
    }
  }

  return { record, setRecord }
}
