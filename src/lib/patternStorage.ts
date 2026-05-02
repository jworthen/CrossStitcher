import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { storage } from './firebase'

const patternPath = (uid: string, patternId: string) =>
  `users/${uid}/patterns/${patternId}.pdf`

/**
 * Upload a pattern PDF to Firebase Storage. The progress callback receives a
 * fraction in [0, 1]. Throws on auth/network errors so the caller can surface
 * them.
 */
export async function uploadPatternPdf(
  uid: string,
  patternId: string,
  file: ArrayBuffer | Blob,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  if (!storage) throw new Error('Firebase Storage not configured')
  const r = ref(storage, patternPath(uid, patternId))
  const blob = file instanceof Blob ? file : new Blob([file], { type: 'application/pdf' })
  const task = uploadBytesResumable(r, blob, { contentType: 'application/pdf' })
  await new Promise<void>((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => onProgress?.(snap.bytesTransferred / snap.totalBytes),
      reject,
      () => resolve(),
    )
  })
}

/** Download a pattern PDF from Firebase Storage as an ArrayBuffer. */
export async function downloadPatternPdf(uid: string, patternId: string): Promise<ArrayBuffer> {
  if (!storage) throw new Error('Firebase Storage not configured')
  const r = ref(storage, patternPath(uid, patternId))
  const url = await getDownloadURL(r)
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`Download failed: ${resp.status}`)
  return resp.arrayBuffer()
}

/** Delete a pattern PDF. Errors (e.g. already deleted) are silently swallowed. */
export async function deletePatternPdf(uid: string, patternId: string): Promise<void> {
  if (!storage) return
  try {
    await deleteObject(ref(storage, patternPath(uid, patternId)))
  } catch { /* not found / permission — ignore */ }
}
