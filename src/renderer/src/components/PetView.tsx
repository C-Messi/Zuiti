import { useEffect, useState } from 'react'
import { usePetStore } from '../store/usePetStore'
import type { MoodState } from '../../../shared/types'

const FRAMES: Record<MoodState, string[]> = {
  idle: ['idle/0.png', 'idle/1.png', 'idle/2.png', 'idle/3.png'],
  happy: ['happy/0.png', 'happy/1.png', 'happy/2.png', 'happy/3.png'],
  angry_for_user: ['angry_for_user/0.png', 'angry_for_user/1.png', 'angry_for_user/2.png', 'angry_for_user/3.png'],
  cuddling: ['cuddling/0.png', 'cuddling/1.png', 'cuddling/2.png', 'cuddling/3.png'],
  hungry: ['hungry/0.png', 'hungry/1.png', 'hungry/2.png', 'hungry/3.png'],
  sleeping: ['sleeping/0.png', 'sleeping/1.png', 'sleeping/2.png', 'sleeping/3.png'],
  excited: ['excited/0.png', 'excited/1.png', 'excited/2.png', 'excited/3.png'],
  sad: ['sad/0.png', 'sad/1.png', 'sad/2.png', 'sad/3.png']
}

const FRAME_INTERVAL: Record<MoodState, number> = {
  idle: 500,
  happy: 200,
  angry_for_user: 180,
  cuddling: 350,
  hungry: 400,
  sleeping: 700,
  excited: 130,
  sad: 600
}

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
  const [frameIdx, setFrameIdx] = useState(0)

  useEffect(() => {
    setFrameIdx(0)
    const id = setInterval(() => {
      setFrameIdx((i) => (i + 1) % FRAMES[mood].length)
    }, FRAME_INTERVAL[mood])
    return () => clearInterval(id)
  }, [mood])

  const src = `pet/${FRAMES[mood][frameIdx]}`

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {mood === 'sleeping' && (
        <div className="absolute -top-2 right-2 text-lg font-bold text-indigo-300/70 select-none pointer-events-none">
          <span className="zzz inline-block" style={{ animationDelay: '0s' }}>z</span>
          <span className="zzz inline-block" style={{ animationDelay: '0.6s' }}>z</span>
          <span className="zzz inline-block" style={{ animationDelay: '1.2s' }}>z</span>
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
