import { useEffect } from 'react'
import { usePetStore } from '../store/usePetStore'
import type { MoodState } from '../../../shared/types'

export function useIpcWiring(): void {
  const setMood = usePetStore((s) => s.setMood)
  const setBubble = usePetStore((s) => s.setBubble)
  const setActiveActivity = usePetStore((s) => s.setActiveActivity)
  useEffect(() => {
    const offSpeak = window.zuiti.onPetSpeak((t) => setBubble(t))
    const offMood = window.zuiti.onPetMood((m) => setMood(m as MoodState))
    const offActivity = window.zuiti.onPetActivity((activity) => setActiveActivity(activity))
    return () => {
      offSpeak()
      offMood()
      offActivity()
    }
  }, [setMood, setBubble, setActiveActivity])
}
