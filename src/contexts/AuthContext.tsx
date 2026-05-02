import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInAnonymously,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { auth, googleProvider, firebaseConfigured } from '../lib/firebase'

interface AuthContextType {
  /** null = signed out; User = signed in (Google or anonymous). */
  user: User | null
  /** True until the initial onAuthStateChanged fires. */
  loading: boolean
  /** True when Firebase env vars are present. When false, sign-in is disabled. */
  configured: boolean
  signInWithGoogle: () => Promise<void>
  signInAnonymous: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function friendlyAuthError(e: unknown): string {
  if (!(e instanceof FirebaseError)) return 'Something went wrong. Please try again.'
  switch (e.code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in cancelled.'
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked. Allow popups and try again.'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.'
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled in Firebase.'
    default:
      return 'Sign-in failed. Please try again.'
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) { setLoading(false); return }
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase not configured')
    await signInWithPopup(auth, googleProvider)
  }

  const signInAnonymous = async () => {
    if (!auth) throw new Error('Firebase not configured')
    await signInAnonymously(auth)
  }

  const signOut = async () => {
    if (!auth) return
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, configured: firebaseConfigured, signInWithGoogle, signInAnonymous, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
