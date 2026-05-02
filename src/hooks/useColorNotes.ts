import { useCallback } from 'react'
import { BrandId } from '../data/brands'
import { useSyncedRecord } from './useSyncedRecord'

const STORAGE_KEY = '@floss_color_notes'

function makeKey(brand: BrandId, number: string): string {
  return `${brand}:${number}`
}

function migrate(raw: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) {
    out[k.includes(':') ? k : `dmc:${k}`] = v
  }
  return out
}

export function useColorNotes() {
  const { record: notes, setRecord } = useSyncedRecord<string>({
    storageKey: STORAGE_KEY,
    docPath: (uid) => `users/${uid}/data/notes`,
    migrate,
  })

  const setNote = useCallback((brand: BrandId, number: string, note: string) => {
    const k = makeKey(brand, number)
    const next = { ...notes }
    const trimmed = note.trim()
    if (trimmed) next[k] = trimmed
    else delete next[k]
    setRecord(next)
  }, [notes, setRecord])

  const getNote = useCallback(
    (brand: BrandId, number: string): string => notes[makeKey(brand, number)] ?? '',
    [notes]
  )

  return { notes, setNote, getNote }
}
