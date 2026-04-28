import { useEffect } from 'react'
import { usePetStore } from '../store/usePetStore'
import type { MoodState } from '../../../shared/types'

export function useIpcWiring(): void {
  const setMood = usePetStore((s) => s.setMood)
  const setBubble = usePetStore((s) => s.setBubble)
  const setActiveSkillAction = usePetStore((s) => s.setActiveSkillAction)
  useEffect(() => {
    const offSpeak = window.zuiti.onPetSpeak((t) => setBubble(t))
    const offMood = window.zuiti.onPetMood((m) => setMood(m as MoodState))
    const offAction = window.zuiti.onPetAction((action) => setActiveSkillAction(action))
    return () => {
      offSpeak()
      offMood()
      offAction()
    }
  }, [setMood, setBubble, setActiveSkillAction])
}
