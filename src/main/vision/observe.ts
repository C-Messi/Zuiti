import { getProvider } from '../brain'
import { ensureRuntimeContext } from '../context/runtime'
import { getContextManager } from '../context/snapshot'
import { buildVisionSystemPrompt } from '../brain/prompt'
import { captureMainScreenPng } from './capture'
import { isVisionPaused, isAppBlacklisted } from './privacy'
import { safeWarn } from '../logger'
import type { ScreenObservation } from '../../shared/types'

const VISION_USER = `请基于截图给出 JSON。`

export async function observe(activeApp = ''): Promise<ScreenObservation | null> {
  if (isVisionPaused()) return null
  if (activeApp && isAppBlacklisted(activeApp)) {
    const observation: ScreenObservation = {
      ts: Date.now(),
      app: activeApp,
      scene: 'other',
      emotion_signal: 'neutral',
      summary_for_pet: '在敏感 app 里，跳过',
      privacy_filtered: true
    }
    getContextManager().setVisionSummary(observation)
    return observation
  }
  let png: Buffer | null = null
  try {
    png = await captureMainScreenPng()
  } catch (err) {
    safeWarn('[vision] capture failed:', err)
    return null
  }
  if (!png) return null
  const b64 = png.toString('base64')
  let raw: Partial<ScreenObservation> = {}
  try {
    ensureRuntimeContext()
    const snapshot = getContextManager().getSnapshot()
    raw = (await getProvider().visionJSON(
      buildVisionSystemPrompt(snapshot.soulText, snapshot.memoryText),
      VISION_USER,
      b64
    )) as Partial<ScreenObservation>
  } catch (err) {
    safeWarn('[vision] visionJSON failed, using neutral fallback:', err)
  }
  const observation = {
    ts: Date.now(),
    app: raw.app ?? activeApp ?? 'unknown',
    scene: (raw.scene as ScreenObservation['scene']) ?? 'other',
    emotion_signal: (raw.emotion_signal as ScreenObservation['emotion_signal']) ?? 'neutral',
    trigger_topic: raw.trigger_topic,
    summary_for_pet: raw.summary_for_pet ?? '屏幕没什么特别的',
    privacy_filtered: false
  }
  getContextManager().setVisionSummary(observation)
  return observation
}
