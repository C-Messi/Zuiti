import { PetView } from './components/PetView'
import { BubbleLayer } from './components/BubbleLayer'
import { SettingPanel } from './components/SettingPanel'
import { useIpcWiring } from './hooks/useIpc'

function App(): React.JSX.Element {
  useIpcWiring()
  return (
    <div
      className="relative h-screen w-screen flex flex-col justify-end items-center"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <BubbleLayer />
      <SettingPanel />
      <div className="relative z-10 pb-2">
        <PetView />
      </div>
    </div>
  )
}

export default App
