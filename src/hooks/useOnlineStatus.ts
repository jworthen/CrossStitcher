import { useEffect, useState } from 'react'

/**
 * Tracks navigator.onLine. Used by the AccountButton to show whether sync
 * writes are reaching Firebase or queueing in IndexedDB / Firestore's local
 * cache for later flush.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  )

  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])

  return online
}
