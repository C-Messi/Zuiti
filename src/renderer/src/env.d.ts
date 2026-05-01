/// <reference types="vite/client" />

import type { PetActivity, PetRenderPackage, Settings } from '../../shared/types'

declare global {
  interface Window {
    zuiti: {
      userSay: (text: string) => Promise<{ ok: boolean }>
      onPetSpeak: (cb: (text: string) => void) => () => void
      onPetMood: (cb: (mood: string) => void) => () => void
      onPetActivity: (cb: (activity: PetActivity) => void) => () => void
      petPackageGet: () => Promise<PetRenderPackage>
      settingsGet: () => Promise<Settings>
      settingsSet: (patch: Partial<Settings>) => Promise<Settings>
      visionPause: (durationMs: number | null) => Promise<Settings>
    }
  }
}
