import { useEffect, useRef, useState } from 'react'
import { usePetStore } from '../store/usePetStore'
import { renderRegisteredSkeletonMarkup } from '../pet/skeletonRegistry'
import type {
  MoodState,
  MotionToolDefinition,
  PetActivity,
  PetAnchorId,
  PetMotionCommand,
  PetRenderPackage
} from '../../../shared/types'

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

function activityDuration(activity: PetActivity, pkg: PetRenderPackage | null): number {
  const motionDurations = activity.motionPlan.commands.map((command) => {
    const tool = pkg?.motionTools.find((item) => item.id === command.tool)
    return command.durationMs ?? tool?.durationMs ?? 1400
  })
  return Math.max(activity.prop?.durationMs ?? 0, ...motionDurations, 1000)
}

const PROP_SIZE_BY_ANCHOR: Record<string, number> = {
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

function resolveMotionParams(
  command: PetMotionCommand,
  tool: MotionToolDefinition
): Record<string, number | string> {
  const params: Record<string, number | string> = {}
  for (const [key, definition] of Object.entries(tool.params ?? {})) {
    params[key] = definition.default
  }
  for (const [key, value] of Object.entries(command.params ?? {})) {
    params[key] = value
  }
  return params
}

function resolveTransform(template: string, params: Record<string, number | string>): string {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, key: string) => String(params[key] ?? 0))
}

function partElement(root: HTMLElement, partId: string): Element | null {
  if (partId === '__root') return root.querySelector('.zuiti-pet-svg')
  return root.querySelector(`[id="zuiti-part-${partId.replaceAll('_', '-')}"]`)
}

function runMotionAnimations(
  root: HTMLElement | null,
  pkg: PetRenderPackage | null,
  activity: PetActivity | null
): Animation[] {
  if (!root || !pkg || !activity) return []
  const animations: Animation[] = []
  for (const command of activity.motionPlan.commands) {
    const tool = pkg.motionTools.find((item) => item.id === command.tool)
    if (!tool) continue
    const params = resolveMotionParams(command, tool)
    const repeats = typeof params.repeats === 'number' ? params.repeats : 1
    for (const target of tool.targets) {
      const keyframes = target.keyframes.map((keyframe) => ({
        offset: keyframe.offset,
        transform: resolveTransform(keyframe.transform, params)
      }))
      for (const partId of target.partIds) {
        const element = partElement(root, partId)
        if (!element) continue
        animations.push(
          element.animate(keyframes, {
            duration: command.durationMs ?? tool.durationMs,
            easing: tool.easing,
            iterations: repeats
          })
        )
      }
    }
  }
  return animations
}

export function PetView(): React.JSX.Element {
  const mood = usePetStore((s) => s.mood)
  const activeActivity = usePetStore((s) => s.activeActivity)
  const setActiveActivity = usePetStore((s) => s.setActiveActivity)
  const [petPackage, setPetPackage] = useState<PetRenderPackage | null>(null)
  const skeletonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    window.zuiti
      .petPackageGet()
      .then((pkg) => {
        if (alive) setPetPackage(pkg)
      })
      .catch(() => {
        /* The shell remains usable even if the pet package fails to load. */
      })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!activeActivity) return
    const id = setTimeout(
      () => {
        setActiveActivity(null)
      },
      activityDuration(activeActivity, petPackage)
    )
    return () => clearTimeout(id)
  }, [activeActivity, petPackage, setActiveActivity])

  useEffect(() => {
    const animations = runMotionAnimations(skeletonRef.current, petPackage, activeActivity)
    return () => {
      for (const animation of animations) animation.cancel()
    }
  }, [activeActivity, petPackage])

  const prop = activeActivity?.prop
  const anchor = prop ? petPackage?.anchors[prop.anchor] : null
  const propSrc = prop ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(prop.svg)}` : null

  return (
    <div
      ref={skeletonRef}
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
      <div
        className={`zuiti-pet-svg w-44 h-44 select-none drop-shadow-lg transition-all duration-200 ${MOOD_CSS_CLASS[mood]}`}
        aria-label={mood}
        dangerouslySetInnerHTML={{
          __html: petPackage ? renderRegisteredSkeletonMarkup(petPackage, mood) : ''
        }}
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
            width: PROP_SIZE_BY_ANCHOR[prop.anchor] ?? 52,
            height: PROP_SIZE_BY_ANCHOR[prop.anchor] ?? 52,
            transform: propTransform(prop.anchor)
          }}
        />
      )}
    </div>
  )
}
