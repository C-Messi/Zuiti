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

export type BrainResponse = {
  dialogue: string
  mood_tag: MoodState
  animation_hint?: string
}

export const IPC = {
  USER_SAY: 'user:say',
  PET_SPEAK: 'pet:speak',
  PET_MOOD: 'pet:mood',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  VISION_PAUSE: 'vision:pause',
  VISION_PEEK_PREVIEW: 'vision:peek:preview',
  VISION_PEEK_CANCEL: 'vision:peek:cancel',
  TOKEN_STATE: 'token:state'
} as const
