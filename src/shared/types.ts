export type MoodState =
  | 'idle'
  | 'happy'
  | 'angry_for_user'
  | 'cuddling'
  | 'hungry'
  | 'sleeping'
  | 'excited'
  | 'sad'

export type EmotionSignal = 'positive' | 'negative' | 'neutral' | 'stressed'

export type ScreenObservation = {
  ts: number
  app: string
  scene: 'coding' | 'messaging' | 'watching' | 'writing' | 'browsing' | 'idle' | 'other'
  emotion_signal: EmotionSignal
  trigger_topic?: string
  summary_for_pet: string
  privacy_filtered: boolean
}

export type PetEventType = 'spontaneous' | 'reactive' | 'user_initiated'

export type PetEvent = {
  ts: number
  type: PetEventType
  observation?: ScreenObservation
  mood_before: MoodState
  mood_after: MoodState
  dialogue?: string
  token_delta: number
}

export type ToneMode = 'default' | 'gentle' | 'silent'

export type Settings = {
  visionEnabled: boolean
  visionPausedUntil: number | null
  tone: ToneMode
  appBlacklist: string[]
}

export type SkeletonId = string

export type PetAnchorId = string

export type MotionToolId = string

export type SkeletonPoint = {
  x: number
  y: number
}

export type PetPartDefinition = {
  id: string
  label: string
  svg: string
  transformOrigin: string
}

export type PetExpressionDefinition = {
  partId: string
  svg: string
}

export type MotionParamDefinition = {
  default: number
  min: number
  max: number
}

export type MotionKeyframeDefinition = {
  offset: number
  transform: string
}

export type MotionTargetDefinition = {
  partIds: string[]
  keyframes: MotionKeyframeDefinition[]
}

export type MotionToolDefinition = {
  id: MotionToolId
  prompt: string
  durationMs: number
  easing: string
  params: Record<string, MotionParamDefinition>
  targets: MotionTargetDefinition[]
}

export type PetMotionCommand = {
  tool: MotionToolId
  params?: Record<string, number | string>
  durationMs?: number
}

export type PetMotionPlan = {
  skeleton_id: SkeletonId
  commands: PetMotionCommand[]
}

export type PetRenderPackage = {
  id: SkeletonId
  title: string
  viewBox: string
  ariaLabel: string
  parts: Record<string, PetPartDefinition>
  expressions: Partial<Record<MoodState, PetExpressionDefinition>>
  anchors: Record<PetAnchorId, SkeletonPoint>
  renderOrder: string[]
  motionTools: MotionToolDefinition[]
  moodDefaults: Record<MoodState, PetMotionPlan>
  motionPromptText: string
}

export type BrainResponse = {
  dialogue: string
  mood_tag: MoodState
  motion_plan?: PetMotionPlan
  prop_intent?: string
  prop_skill_id?: string
}

export type PropSkillIndexItem = {
  kind: 'prop'
  id: string
  title: string
  triggers: string[]
  moodAffinity: MoodState[]
  durationMs: number
  reviewScore: number
  enabled: boolean
  anchor: PetAnchorId
  description: string
}

export type SkillIndexItem = PropSkillIndexItem

export type SkillManifest = PropSkillIndexItem & {
  createdAt: string
}

export type PetProp = {
  skill_id: string
  title: string
  svg: string
  durationMs: number
  anchor: PetAnchorId
}

export type PetActivity = {
  motionPlan: PetMotionPlan
  prop?: PetProp
}

export const IPC = {
  USER_SAY: 'user:say',
  PET_SPEAK: 'pet:speak',
  PET_MOOD: 'pet:mood',
  PET_ACTIVITY: 'pet:activity',
  PET_PACKAGE_GET: 'pet:package:get',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  VISION_PAUSE: 'vision:pause',
  VISION_PEEK_PREVIEW: 'vision:peek:preview',
  VISION_PEEK_CANCEL: 'vision:peek:cancel',
  TOKEN_STATE: 'token:state'
} as const
