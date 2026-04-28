/// <reference types="vite/client" />

import type { PetAction, Settings } from '../../shared/types'

declare global {
  interface Window {
    zuiti: {
      userSay: (text: string) => Promise<{ ok: boolean }>
      onPetSpeak: (cb: (text: string) => void) => () => void
      onPetMood: (cb: (mood: string) => void) => () => void
      onPetAction: (cb: (action: PetAction) => void) => () => void
      settingsGet: () => Promise<Settings>
      settingsSet: (patch: Partial<Settings>) => Promise<Settings>
      visionPause: (durationMs: number | null) => Promise<Settings>
    }
  }
}
