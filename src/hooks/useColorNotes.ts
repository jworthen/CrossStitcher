import { useState, useCallback } from 'react'
import { BrandId } from '../data/brands'

const STORAGE_KEY = '@floss_color_notes'

// Notes are namespaced per-brand, same scheme as the inventory hook.
type Notes = Record<string, string>

function makeKey(brand: BrandId, number: string): string {
  return `${brand}:${number}`
}

function migrateLegacy(raw: Record<string, string>): Notes {
  const out: Notes = {}
  for (const [k, v] of Object.entries(raw)) {
    out[k.includes(':') ? k : `dmc:${k}`] = v
  }
  return out
}

function loadFromStorage(): Notes {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return migrateLegacy(JSON.parse(raw))
  } catch {
    return {}
  }
}

function saveToStorage(notes: Notes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  } catch {
    // storage quota exceeded or unavailable — silently ignore
  }
}

export function useColorNotes() {
  const [notes, setNotes] = useState<Notes>(loadFromStorage)

  const setNote = useCallback((brand: BrandId, number: string, note: string) => {
    setNotes((prev) => {
      const next = { ...prev }
      const k = makeKey(brand, number)
      const trimmed = note.trim()
      if (trimmed) next[k] = trimmed
      else delete next[k]
      saveToStorage(next)
      return next
    })
  }, [])

  const getNote = useCallback(
    (brand: BrandId, number: string): string => notes[makeKey(brand, number)] ?? '',
    [notes]
  )

  return { notes, setNote, getNote }
}
