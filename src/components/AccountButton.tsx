import { useEffect, useRef, useState } from 'react'
import { useAuth, friendlyAuthError } from '../contexts/AuthContext'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import styles from './AccountButton.module.css'

export default function AccountButton() {
  const { user, loading, configured, signInWithGoogle, signInAnonymous, signOut } = useAuth()
  const online = useOnlineStatus()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (loading) return <div className={styles.placeholder} aria-hidden="true" />
  if (!configured) return null  // Sign-in disabled when env vars are missing

  const initial = user
    ? (user.isAnonymous
        ? '?'
        : (user.displayName?.[0] ?? user.email?.[0] ?? '·').toUpperCase())
    : null

  const wrap = async (fn: () => Promise<void>) => {
    setBusy(true); setError(null)
    try { await fn(); setOpen(false) }
    catch (e) {
      console.error('[Thready auth]', e)  // surfaces the raw Firebase code
      setError(friendlyAuthError(e))
    }
    finally { setBusy(false) }
  }

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        className={`${styles.btn} ${user ? styles.btnSignedIn : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={
          user
            ? `Account menu (${online ? 'online' : 'offline'})`
            : 'Sign in'
        }
        disabled={busy}
      >
        {initial ?? '↪'}
        {user && (
          <span
            className={`${styles.statusDot} ${online ? styles.statusOnline : styles.statusOffline}`}
            aria-hidden="true"
            title={online ? 'Online — syncing' : 'Offline — changes will sync when you reconnect'}
          />
        )}
      </button>
      {open && (
        <div className={styles.menu}>
          {user ? (
            <>
              <div className={styles.menuHeader}>
                {user.isAnonymous
                  ? 'Anonymous account'
                  : (user.displayName ?? user.email ?? 'Signed in')}
                <div className={styles.menuHint}>
                  {online ? 'Online — changes sync automatically.' : 'Offline — changes will sync when you reconnect.'}
                  {user.isAnonymous && (
                    <> Sign in with Google to share across devices.</>
                  )}
                </div>
              </div>
              {user.isAnonymous && (
                <button
                  className={styles.menuItem}
                  onClick={() => wrap(signInWithGoogle)}
                  disabled={busy}
                >
                  Upgrade with Google
                </button>
              )}
              <button
                className={`${styles.menuItem} ${styles.menuItemDanger}`}
                onClick={() => wrap(signOut)}
                disabled={busy}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <button
                className={styles.menuItem}
                onClick={() => wrap(signInWithGoogle)}
                disabled={busy}
              >
                Sign in with Google
              </button>
              <button
                className={styles.menuItem}
                onClick={() => wrap(signInAnonymous)}
                disabled={busy}
              >
                Continue without account
              </button>
            </>
          )}
          {error && <div className={styles.menuError}>{error}</div>}
        </div>
      )}
    </div>
  )
}
