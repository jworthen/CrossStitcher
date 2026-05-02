import { doc, getDoc, setDoc, deleteDoc, onSnapshot, Unsubscribe } from 'firebase/firestore'
import { auth, db } from './firebase'
import type { PatternMeta, GridConfig, PatternColor } from '../hooks/usePatterns'

// Firestore layout (mirrors GardenScheduler's gardens setup):
//   users/{uid}/meta/patternsIndex   → { patterns: PatternMeta[], updatedAt }
//   users/{uid}/patterns/{patternId} → { gridConfigs, progress, patternColors }
//
// The actual PDF binary lives in Firebase Storage (Phase 7d). Pattern names,
// designer/fabric/notes/fileSize/dateAdded all live in the index for quick
// rendering of the library list without loading every per-pattern doc.

export interface CloudPatternData {
  gridConfigs?: Record<number, GridConfig>
  progress?: Record<string, string>
  patternColors?: PatternColor[]
}

export const patternsIndexRef = (uid: string) =>
  doc(db!, `users/${uid}/meta/patternsIndex`)

export const patternDocRef = (uid: string, patternId: string) =>
  doc(db!, `users/${uid}/patterns/${patternId}`)

/** Returns the current user's uid, or null if signed out / Firebase unconfigured. */
export function currentUid(): string | null {
  return auth?.currentUser?.uid ?? null
}

// ── Patterns index ──────────────────────────────────────────────────────────

export async function loadPatternsList(uid: string): Promise<PatternMeta[]> {
  if (!db) return []
  const snap = await getDoc(patternsIndexRef(uid))
  if (!snap.exists()) return []
  return (snap.data().patterns ?? []) as PatternMeta[]
}

export async function savePatternsList(uid: string, patterns: PatternMeta[]): Promise<void> {
  if (!db) return
  await setDoc(patternsIndexRef(uid), { patterns, updatedAt: new Date().toISOString() })
}

export function subscribePatternsList(
  uid: string,
  cb: (patterns: PatternMeta[], hasPendingWrites: boolean) => void,
): Unsubscribe {
  if (!db) return () => {}
  return onSnapshot(patternsIndexRef(uid), (snap) => {
    const patterns = (snap.data()?.patterns ?? []) as PatternMeta[]
    cb(patterns, snap.metadata.hasPendingWrites)
  })
}

// ── Per-pattern data ────────────────────────────────────────────────────────

export async function loadCloudPatternData(uid: string, patternId: string): Promise<CloudPatternData | null> {
  if (!db) return null
  const snap = await getDoc(patternDocRef(uid, patternId))
  return snap.exists() ? (snap.data() as CloudPatternData) : null
}

export async function saveCloudPatternData(uid: string, patternId: string, data: CloudPatternData): Promise<void> {
  if (!db) return
  await setDoc(patternDocRef(uid, patternId), data)
}

export async function deleteCloudPattern(uid: string, patternId: string): Promise<void> {
  if (!db) return
  await deleteDoc(patternDocRef(uid, patternId))
}
