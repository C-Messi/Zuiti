import { create } from 'zustand'
import type { MoodState } from '../../../shared/types'

type State = {
  mood: MoodState
  bubbleText: string
  bubbleVisible: boolean
  setMood: (m: MoodState) => void
  setBubble: (t: string) => void
  hideBubble: () => void
}

export const usePetStore = create<State>((set) => ({
  mood: 'idle',
  bubbleText: '',
  bubbleVisible: false,
  setMood: (m) => set({ mood: m }),
  setBubble: (t) => set({ bubbleText: t, bubbleVisible: true }),
  hideBubble: () => set({ bubbleVisible: false })
}))
