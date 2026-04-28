import { useEffect } from 'react'
import { usePetStore } from '../store/usePetStore'
import { buildDefaultCatSvgDataUrl } from '../pet/defaultCatSvg'
import type { MoodState } from '../../../shared/types'

const MOOD_CSS_CLASS: Record<MoodState, string> = {
  idle: 'pet-idle',
  happy: 'pet-happy',
  angry_for_user: 'pet-angry',
  cuddling: 'pet-cuddling',
  hungry: 'pet-hungry',
  sleeping: 'pet-sleeping',
  excited: 'pet-excited',
  sad: 'pet-sad'
}

export function PetView(): React.JSX.Element {
  const mood = usePetStore((s) => s.mood)
  const activeSkillAction = usePetStore((s) => s.activeSkillAction)
  const setActiveSkillAction = usePetStore((s) => s.setActiveSkillAction)

  useEffect(() => {
    if (!activeSkillAction) return
    const id = setTimeout(() => {
      setActiveSkillAction(null)
    }, activeSkillAction.durationMs)
    return () => clearTimeout(id)
  }, [activeSkillAction, setActiveSkillAction])

  if (activeSkillAction) {
    const actionSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(activeSkillAction.svg)}`
    return (
      <div
        className="relative flex items-center justify-center"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <img
          src={actionSrc}
          alt={activeSkillAction.title}
          className="w-44 h-44 select-none drop-shadow-lg"
          draggable={false}
        />
      </div>
    )
  }

  const src = buildDefaultCatSvgDataUrl(mood)

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {mood === 'sleeping' && (
        <div className="absolute -top-2 right-2 text-lg font-bold text-indigo-300/70 select-none pointer-events-none">
          <span className="zzz inline-block" style={{ animationDelay: '0s' }}>
            z
          </span>
          <span className="zzz inline-block" style={{ animationDelay: '0.6s' }}>
            z
          </span>
          <span className="zzz inline-block" style={{ animationDelay: '1.2s' }}>
            z
          </span>
        </div>
      )}
      <img
        src={src}
        alt={mood}
        className={`w-44 h-44 select-none drop-shadow-lg transition-all duration-200 ${MOOD_CSS_CLASS[mood]}`}
        draggable={false}
      />
    </div>
  )
}
