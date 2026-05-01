import { create } from 'zustand'
import type { MoodState, PetActivity } from '../../../shared/types'

type State = {
  mood: MoodState
  activeActivity: PetActivity | null
  bubbleText: string
  bubbleVisible: boolean
  setMood: (m: MoodState) => void
  setActiveActivity: (activity: PetActivity | null) => void
  setBubble: (t: string) => void
  hideBubble: () => void
}

export const usePetStore = create<State>((set) => ({
  mood: 'idle',
  activeActivity: null,
  bubbleText: '',
  bubbleVisible: false,
  setMood: (m) => set({ mood: m }),
  setActiveActivity: (activity) => set({ activeActivity: activity }),
  setBubble: (t) => set({ bubbleText: t, bubbleVisible: true }),
  hideBubble: () => set({ bubbleVisible: false })
}))
