import { useState, useEffect } from 'react'

const STORAGE_KEY = '@thready_dark'

export function useDarkMode(): [boolean, () => void] {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const dark =
      stored !== null
        ? stored === 'true'
        : window.matchMedia('(prefers-color-scheme: dark)').matches
    // Set synchronously to avoid flash of wrong theme
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    return dark
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem(STORAGE_KEY, String(isDark))
  }, [isDark])

  return [isDark, () => setIsDark((v) => !v)]
}
