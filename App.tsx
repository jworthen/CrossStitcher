import { useEffect, useState } from 'react'
import FlossListScreen from './src/screens/FlossListScreen'
import PatternLibraryScreen from './src/screens/PatternLibraryScreen'
import PdfViewerScreen from './src/screens/PdfViewerScreen'
import BottomNav, { AppScreen } from './src/components/BottomNav'
import AccountButton from './src/components/AccountButton'

interface ViewerState {
  patternId: string
  patternName: string
}

const SCREEN_KEY = 'thready-active-screen'

function loadInitialScreen(): AppScreen {
  const saved = localStorage.getItem(SCREEN_KEY)
  return saved === 'patterns' ? 'patterns' : 'inventory'
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>(loadInitialScreen)
  const [viewer, setViewer] = useState<ViewerState | null>(null)

  useEffect(() => {
    localStorage.setItem(SCREEN_KEY, screen)
  }, [screen])

  if (viewer) {
    return (
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <PdfViewerScreen
          patternId={viewer.patternId}
          patternName={viewer.patternName}
          onBack={() => setViewer(null)}
        />
      </div>
    )
  }

  return (
    <>
      <header style={{
        flexShrink: 0,
        padding: '10px 16px 8px',
        background: 'var(--color-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
      }}>
        <span style={{ width: 30 }} aria-hidden="true" />
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--color-primary)',
          position: 'relative',
        }}>
          {/* Needle-and-thread mascot */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <ellipse cx="6.5" cy="6.5" rx="3.2" ry="2" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="5.5" cy="6.5" r="0.7" fill="currentColor" opacity="0.7" />
            <path d="M9 7 L20 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M19 17 L21 19 L20 20.5 L18 18.5 Z" fill="currentColor" />
            <path d="M11 4.8 Q14 6 13 9 T15 13"
              stroke="var(--pastel-mint)" strokeWidth="1.4"
              strokeLinecap="round" fill="none" />
          </svg>
          <span style={{
            fontFamily: "'Caveat', 'Marker Felt', cursive",
            fontSize: '2rem',
            fontWeight: 700,
            letterSpacing: '0.005em',
            lineHeight: 1,
          }}>Thready</span>
          {/* Tiny sparkle next to the wordmark */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"
            style={{ position: 'absolute', top: -4, right: -10 }}>
            <path d="M7 1 L8 6 L13 7 L8 8 L7 13 L6 8 L1 7 L6 6 Z"
              fill="var(--pastel-butter)" stroke="var(--color-primary)" strokeWidth="0.8" strokeLinejoin="round"/>
          </svg>
        </span>
        <AccountButton />
        {/* Pastel-rainbow stripe under the header */}
        <div style={{
          position: 'absolute',
          left: 0, right: 0, bottom: 0,
          height: 4,
          background: 'var(--rainbow-stripe)',
        }} aria-hidden="true" />
      </header>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {screen === 'inventory' && <FlossListScreen />}
        {screen === 'patterns' && (
          <PatternLibraryScreen
            onOpenViewer={(id, name) => setViewer({ patternId: id, patternName: name })}
          />
        )}
      </div>
      <BottomNav screen={screen} onNavigate={setScreen} />
    </>
  )
}
