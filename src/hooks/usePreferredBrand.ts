import { useCallback, useState } from 'react'
import { BrandId, BRAND_BY_ID } from '../data/brands'

const STORAGE_KEY = 'thready-preferred-brand'

function loadFromStorage(): BrandId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw && raw in BRAND_BY_ID) return raw as BrandId
  } catch { /* ignore */ }
  return 'dmc'
}

export function usePreferredBrand(): [BrandId, (brand: BrandId) => void] {
  const [brand, setBrandState] = useState<BrandId>(loadFromStorage)

  const setBrand = useCallback((next: BrandId) => {
    setBrandState(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* ignore */ }
  }, [])

  return [brand, setBrand]
}
