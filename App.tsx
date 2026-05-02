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
          fontSize: '1.125rem',
          fontWeight: 700,
          color: 'var(--color-primary)',
          letterSpacing: '-0.01em',
        }}>Thready</span>
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
