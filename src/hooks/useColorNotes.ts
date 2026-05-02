import { useState, useCallback } from 'react'

const STORAGE_KEY = '@floss_color_notes'

type Notes = Record<string, string>

function loadFromStorage(): Notes {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Notes) : {}
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

  const setNote = useCallback((number: string, note: string) => {
    setNotes((prev) => {
      const next = { ...prev }
      const trimmed = note.trim()
      if (trimmed) next[number] = trimmed
      else delete next[number]
      saveToStorage(next)
      return next
    })
  }, [])

  const getNote = useCallback((number: string): string => notes[number] ?? '', [notes])

  return { notes, setNote, getNote }
}
