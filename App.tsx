import { useState } from 'react'
import FlossListScreen from './src/screens/FlossListScreen'
import PatternLibraryScreen from './src/screens/PatternLibraryScreen'
import PdfViewerScreen from './src/screens/PdfViewerScreen'
import BottomNav, { AppScreen } from './src/components/BottomNav'

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
