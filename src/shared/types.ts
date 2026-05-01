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

export type SkeletonId = 'default-cat'

export type PetAnchorId =
  | 'left_hand'
  | 'right_hand'
  | 'head_top'
  | 'mouth'
  | 'beside_left'
  | 'beside_right'

export type MotionToolId =
  | 'idle_breathe'
  | 'nod'
  | 'shake_head'
  | 'wave'
  | 'hop'
  | 'sing'
  | 'tilt_head'
  | 'perk_ears'
  | 'swish_tail'

export type PetMotionCommand = {
  tool: MotionToolId
  params?: Record<string, number | string>
  durationMs?: number
}

export type PetMotionPlan = {
  skeleton_id: SkeletonId
  commands: PetMotionCommand[]
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
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  VISION_PAUSE: 'vision:pause',
  VISION_PEEK_PREVIEW: 'vision:peek:preview',
  VISION_PEEK_CANCEL: 'vision:peek:cancel',
  TOKEN_STATE: 'token:state'
} as const
