import { useRef, useState } from 'react'
import { PetView } from './components/PetView'
import { BubbleLayer } from './components/BubbleLayer'
import { SettingPanel } from './components/SettingPanel'
import { useIpcWiring } from './hooks/useIpc'

const CLICK_DRAG_THRESHOLD_PX = 5

type PetPointerDrag = {
  pointerId: number
  startClientX: number
  startClientY: number
  dragging: boolean
}

function App(): React.JSX.Element {
  useIpcWiring()
  const [auxiliaryVisible, setAuxiliaryVisible] = useState(false)
  const dragStartRef = useRef<PetPointerDrag | null>(null)

  const toggleAuxiliary = (): void => {
    setAuxiliaryVisible((visible) => !visible)
  }

  const dragPoint = (
    event: React.PointerEvent<HTMLDivElement>
  ): { screenX: number; screenY: number } => ({
    screenX: event.screenX,
    screenY: event.screenY
  })

  const finishPetPointer = (
    event: React.PointerEvent<HTMLDivElement>,
    clickEnabled: boolean
  ): void => {
    const dragStart = dragStartRef.current
    if (!dragStart || dragStart.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(dragStart.pointerId)) {
      event.currentTarget.releasePointerCapture(dragStart.pointerId)
    }
    void window.zuiti.windowDragEnd()
    dragStartRef.current = null
    if (!dragStart.dragging && clickEnabled) toggleAuxiliary()
  }

  return (
    <div
      className="relative h-screen w-screen flex flex-col justify-end items-center"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {auxiliaryVisible && (
        <>
          <BubbleLayer />
          <SettingPanel />
        </>
      )}
      <div
        className="relative z-10 pb-2"
        role="button"
        tabIndex={0}
        aria-label={auxiliaryVisible ? '隐藏对话和设置' : '显示对话和设置'}
        onPointerDown={(event) => {
          if (event.button !== 0) return
          dragStartRef.current = {
            pointerId: event.pointerId,
            startClientX: event.clientX,
            startClientY: event.clientY,
            dragging: false
          }
          event.currentTarget.setPointerCapture(event.pointerId)
          void window.zuiti.windowDragStart(dragPoint(event))
        }}
        onPointerMove={(event) => {
          const dragStart = dragStartRef.current
          if (!dragStart || dragStart.pointerId !== event.pointerId) return
          const dx = event.clientX - dragStart.startClientX
          const dy = event.clientY - dragStart.startClientY
          if (!dragStart.dragging && Math.hypot(dx, dy) < CLICK_DRAG_THRESHOLD_PX) return
          dragStart.dragging = true
          void window.zuiti.windowDragMove(dragPoint(event))
        }}
        onPointerUp={(event) => finishPetPointer(event, true)}
        onPointerCancel={(event) => finishPetPointer(event, false)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            toggleAuxiliary()
          }
        }}
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <PetView />
      </div>
    </div>
  )
}

export default App
