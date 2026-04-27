import { getProvider } from '../brain'
import { captureMainScreenPng } from './capture'
import { isVisionPaused, isAppBlacklisted } from './privacy'
import type { ScreenObservation } from '../../shared/types'

const VISION_SYSTEM = `你是一个屏幕情境分析器。看到截图后，仅输出严格 JSON：
{
  "app": "<前台 app 短名>",
  "scene": "coding | messaging | watching | writing | browsing | idle | other",
  "emotion_signal": "positive | negative | neutral | stressed",
  "trigger_topic": "<简短话题，可空字符串>",
  "summary_for_pet": "<一句话，给宠物用的中文上下文，<=30 字>"
}
若无法识别或无内容，summary_for_pet 写 "屏幕没什么特别的"，emotion_signal 用 neutral。`

const VISION_USER = `请基于截图给出 JSON。`

export async function observe(activeApp = ''): Promise<ScreenObservation | null> {
  if (isVisionPaused()) return null
  if (activeApp && isAppBlacklisted(activeApp)) {
    return {
      ts: Date.now(),
      app: activeApp,
      scene: 'other',
      emotion_signal: 'neutral',
      summary_for_pet: '在敏感 app 里，跳过',
      privacy_filtered: true
    }
  }
  let png: Buffer | null = null
  try {
    png = await captureMainScreenPng()
  } catch (err) {
    console.warn('[vision] capture failed:', err)
    return null
  }
  if (!png) return null
  const b64 = png.toString('base64')
  let raw: Partial<ScreenObservation> = {}
  try {
    raw = (await getProvider().visionJSON(VISION_SYSTEM, VISION_USER, b64)) as Partial<ScreenObservation>
  } catch (err) {
    console.warn('[vision] visionJSON failed, using neutral fallback:', err)
  }
  return {
    ts: Date.now(),
    app: raw.app ?? activeApp ?? 'unknown',
    scene: (raw.scene as ScreenObservation['scene']) ?? 'other',
    emotion_signal:
      (raw.emotion_signal as ScreenObservation['emotion_signal']) ?? 'neutral',
    trigger_topic: raw.trigger_topic,
    summary_for_pet: raw.summary_for_pet ?? '屏幕没什么特别的',
    privacy_filtered: false
  }
}
