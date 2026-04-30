import { useState, useCallback } from 'react'
import { FlossStatus } from '../data/dmcColors'

const STORAGE_KEY = '@floss_inventory'

type Inventory = Record<string, FlossStatus>

function loadFromStorage(): Inventory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Inventory) : {}
  } catch {
    return {}
  }
}

function saveToStorage(inventory: Inventory) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory))
  } catch {
    // storage quota exceeded or unavailable — silently ignore
  }
}

export function useInventory() {
  const [inventory, setInventory] = useState<Inventory>(loadFromStorage)

  const setStatus = useCallback((number: string, status: FlossStatus) => {
    setInventory((prev) => {
      const next = { ...prev, [number]: status }
      saveToStorage(next)
      return next
    })
  }, [])

  // Apply multiple status changes in a single state update (avoids N storage writes)
  const bulkSetStatus = useCallback((updates: Array<{ number: string; status: FlossStatus }>) => {
    setInventory((prev) => {
      const next = { ...prev }
      for (const { number, status } of updates) {
        next[number] = status
      }
      saveToStorage(next)
      return next
    })
  }, [])

  const cycleStatus = useCallback((number: string) => {
    setInventory((prev) => {
      const current = prev[number] ?? 'unowned'
      const next: FlossStatus =
        current === 'unowned' ? 'in_stock' : current === 'in_stock' ? 'low' : 'unowned'
      const updated = { ...prev, [number]: next }
      saveToStorage(updated)
      return updated
    })
  }, [])

  const getStatus = useCallback(
    (number: string): FlossStatus => inventory[number] ?? 'unowned',
    [inventory]
  )

  return { inventory, setStatus, bulkSetStatus, cycleStatus, getStatus }
}
