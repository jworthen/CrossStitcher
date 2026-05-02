import { useState, useCallback } from 'react'
import { FlossStatus } from '../data/dmcColors'
import { BrandId } from '../data/brands'

const STORAGE_KEY = '@floss_inventory'

// Keys are namespaced as `${brand}:${number}` (e.g. `dmc:321`, `anchor:9046`).
// Legacy data was stored as bare numbers and is migrated to `dmc:NUMBER` on
// first read.
type Inventory = Record<string, FlossStatus>

function makeKey(brand: BrandId, number: string): string {
  return `${brand}:${number}`
}

function migrateLegacy(raw: Record<string, FlossStatus>): Inventory {
  const out: Inventory = {}
  for (const [k, v] of Object.entries(raw)) {
    out[k.includes(':') ? k : `dmc:${k}`] = v
  }
  return out
}

function loadFromStorage(): Inventory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return migrateLegacy(JSON.parse(raw))
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

  const setStatus = useCallback((brand: BrandId, number: string, status: FlossStatus) => {
    setInventory((prev) => {
      const next = { ...prev, [makeKey(brand, number)]: status }
      saveToStorage(next)
      return next
    })
  }, [])

  const bulkSetStatus = useCallback(
    (updates: Array<{ brand: BrandId; number: string; status: FlossStatus }>) => {
      setInventory((prev) => {
        const next = { ...prev }
        for (const { brand, number, status } of updates) {
          next[makeKey(brand, number)] = status
        }
        saveToStorage(next)
        return next
      })
    },
    []
  )

  const cycleStatus = useCallback((brand: BrandId, number: string) => {
    setInventory((prev) => {
      const k = makeKey(brand, number)
      const current = prev[k] ?? 'unowned'
      const next: FlossStatus =
        current === 'unowned' ? 'in_stock' : current === 'in_stock' ? 'low' : 'unowned'
      const updated = { ...prev, [k]: next }
      saveToStorage(updated)
      return updated
    })
  }, [])

  const getStatus = useCallback(
    (brand: BrandId, number: string): FlossStatus =>
      inventory[makeKey(brand, number)] ?? 'unowned',
    [inventory]
  )

  return { inventory, setStatus, bulkSetStatus, cycleStatus, getStatus }
}
