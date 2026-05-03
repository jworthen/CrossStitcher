import { useState } from 'react'
import FlossListScreen from './src/screens/FlossListScreen'
import PatternLibraryScreen from './src/screens/PatternLibraryScreen'
import PdfViewerScreen from './src/screens/PdfViewerScreen'
import BottomNav, { AppScreen } from './src/components/BottomNav'
import AccountButton from './src/components/AccountButton'

interface ViewerState {
  patternId: string
  patternName: string
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('inventory')
  const [viewer, setViewer] = useState<ViewerState | null>(null)

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
        padding: '10px 16px',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ width: 30 }} aria-hidden="true" />
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--color-primary)',
        }}>
          {/* Needle-and-thread mascot */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <ellipse cx="6.5" cy="6.5" rx="3.2" ry="2" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="5.5" cy="6.5" r="0.7" fill="currentColor" opacity="0.7" />
            <path d="M9 7 L20 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M19 17 L21 19 L20 20.5 L18 18.5 Z" fill="currentColor" />
            <path d="M11 4.8 Q14 6 13 9 T15 13"
              stroke="var(--color-accent)" strokeWidth="1.4"
              strokeLinecap="round" fill="none" />
          </svg>
          <span style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontStyle: 'italic',
            fontSize: '1.5rem',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            lineHeight: 1,
          }}>Thready</span>
        </span>
        <AccountButton />
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
