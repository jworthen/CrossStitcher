import { useCallback } from 'react'
import { FlossStatus } from '../data/dmcColors'
import { BrandId } from '../data/brands'
import { useSyncedRecord } from './useSyncedRecord'

const STORAGE_KEY = '@floss_inventory'

function makeKey(brand: BrandId, number: string): string {
  return `${brand}:${number}`
}

// Legacy data was stored as bare numbers (DMC-only). Promote them to the
// `dmc:` namespace on first read so older inventories still load.
function migrate(raw: Record<string, FlossStatus>): Record<string, FlossStatus> {
  const out: Record<string, FlossStatus> = {}
  for (const [k, v] of Object.entries(raw)) {
    out[k.includes(':') ? k : `dmc:${k}`] = v
  }
  return out
}

export function useInventory() {
  const { record: inventory, setRecord } = useSyncedRecord<FlossStatus>({
    storageKey: STORAGE_KEY,
    docPath: (uid) => `users/${uid}/data/inventory`,
    migrate,
  })

  const setStatus = useCallback((brand: BrandId, number: string, status: FlossStatus) => {
    setRecord({ ...inventory, [makeKey(brand, number)]: status })
  }, [inventory, setRecord])

  const bulkSetStatus = useCallback(
    (updates: Array<{ brand: BrandId; number: string; status: FlossStatus }>) => {
      const next = { ...inventory }
      for (const { brand, number, status } of updates) {
        next[makeKey(brand, number)] = status
      }
      setRecord(next)
    },
    [inventory, setRecord]
  )

  const cycleStatus = useCallback((brand: BrandId, number: string) => {
    const k = makeKey(brand, number)
    const current = inventory[k] ?? 'unowned'
    const next: FlossStatus =
      current === 'unowned' ? 'in_stock' : current === 'in_stock' ? 'low' : 'unowned'
    setRecord({ ...inventory, [k]: next })
  }, [inventory, setRecord])

  const getStatus = useCallback(
    (brand: BrandId, number: string): FlossStatus => inventory[makeKey(brand, number)] ?? 'unowned',
    [inventory]
  )

  return { inventory, setStatus, bulkSetStatus, cycleStatus, getStatus }
}
