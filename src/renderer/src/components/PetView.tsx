import { useEffect } from 'react'
import { usePetStore } from '../store/usePetStore'
import { buildDefaultCatSvgMarkup } from '../pet/defaultCatSvg'
import { DEFAULT_CAT_SKELETON } from '../pet/skeleton'
import type { MoodState, PetActivity, PetAnchorId, PetMotionCommand } from '../../../shared/types'

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

function numberParam(command: PetMotionCommand | undefined, key: string, fallback: number): number {
  const value = command?.params?.[key]
  return typeof value === 'number' ? value : fallback
}

function motionClass(command: PetMotionCommand | undefined): string {
  return command ? `zuiti-motion-${command.tool}` : ''
}

function activityDuration(activity: PetActivity): number {
  const motionDurations = activity.motionPlan.commands.map((command) => command.durationMs ?? 1400)
  return Math.max(activity.prop?.durationMs ?? 0, ...motionDurations, 1000)
}

function motionStyle(command: PetMotionCommand | undefined): React.CSSProperties {
  return {
    '--motion-duration': `${command?.durationMs ?? 1400}ms`,
    '--motion-angle': `${numberParam(command, 'angleDeg', 8)}deg`,
    '--motion-offset-x': `${numberParam(command, 'offsetX', 0)}px`,
    '--motion-offset-y': `${numberParam(command, 'offsetY', -10)}px`,
    '--motion-scale': `${numberParam(command, 'scale', 1.02)}`
  } as React.CSSProperties
}

const PROP_SIZE_BY_ANCHOR: Record<PetAnchorId, number> = {
  left_hand: 52,
  right_hand: 52,
  head_top: 58,
  mouth: 34,
  beside_left: 60,
  beside_right: 60
}

function propTransform(anchor: PetAnchorId): string {
  if (anchor === 'left_hand') return 'translate(-80%, -48%) rotate(-12deg)'
  if (anchor === 'right_hand') return 'translate(-18%, -48%) rotate(12deg)'
  if (anchor === 'head_top') return 'translate(-50%, -100%)'
  if (anchor === 'mouth') return 'translate(-50%, -50%)'
  if (anchor === 'beside_left') return 'translate(-100%, -50%)'
  return 'translate(0%, -50%)'
}

export function PetView(): React.JSX.Element {
  const mood = usePetStore((s) => s.mood)
  const activeActivity = usePetStore((s) => s.activeActivity)
  const setActiveActivity = usePetStore((s) => s.setActiveActivity)

  useEffect(() => {
    if (!activeActivity) return
    const id = setTimeout(() => {
      setActiveActivity(null)
    }, activityDuration(activeActivity))
    return () => clearTimeout(id)
  }, [activeActivity, setActiveActivity])

  const command = activeActivity?.motionPlan.commands[0]
  const prop = activeActivity?.prop
  const anchor = prop ? DEFAULT_CAT_SKELETON.anchors[prop.anchor] : null
  const propSrc = prop ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(prop.svg)}` : null

  return (
    <div
      className={`relative flex items-center justify-center ${motionClass(command)}`}
      style={{ ...motionStyle(command), WebkitAppRegion: 'no-drag' } as React.CSSProperties}
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
      <div
        className={`zuiti-pet-svg w-44 h-44 select-none drop-shadow-lg transition-all duration-200 ${MOOD_CSS_CLASS[mood]}`}
        aria-label={mood}
        dangerouslySetInnerHTML={{ __html: buildDefaultCatSvgMarkup(mood) }}
      />
      {prop && anchor && propSrc && (
        <img
          src={propSrc}
          alt={prop.title}
          className="absolute z-20 select-none pointer-events-none drop-shadow-md zuiti-prop-layer"
          draggable={false}
          style={{
            left: `${(anchor.x / 256) * 100}%`,
            top: `${(anchor.y / 256) * 100}%`,
            width: PROP_SIZE_BY_ANCHOR[prop.anchor],
            height: PROP_SIZE_BY_ANCHOR[prop.anchor],
            transform: propTransform(prop.anchor)
          }}
        />
      )}
    </div>
  )
}
