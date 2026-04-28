import { create } from 'zustand'
import type { MoodState, PetAction } from '../../../shared/types'

type State = {
  mood: MoodState
  activeSkillAction: PetAction | null
  bubbleText: string
  bubbleVisible: boolean
  setMood: (m: MoodState) => void
  setActiveSkillAction: (action: PetAction | null) => void
  setBubble: (t: string) => void
  hideBubble: () => void
}

export const usePetStore = create<State>((set) => ({
  mood: 'idle',
  activeSkillAction: null,
  bubbleText: '',
  bubbleVisible: false,
  setMood: (m) => set({ mood: m }),
  setActiveSkillAction: (action) => set({ activeSkillAction: action }),
  setBubble: (t) => set({ bubbleText: t, bubbleVisible: true }),
  hideBubble: () => set({ bubbleVisible: false })
}))
