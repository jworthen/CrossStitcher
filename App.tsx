import { useState } from 'react'
import FlossListScreen from './src/screens/FlossListScreen'
import PatternLibraryScreen from './src/screens/PatternLibraryScreen'
import BottomNav, { AppScreen } from './src/components/BottomNav'

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('inventory')

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {screen === 'inventory' && <FlossListScreen />}
        {screen === 'patterns' && <PatternLibraryScreen />}
      </div>
      <BottomNav screen={screen} onNavigate={setScreen} />
    </>
  )
}
