import type { BrowserWindow } from 'electron'
import { observe, getSettings } from '../vision'
import { getProvider, respond } from '../brain'
import { recent, appendEvent } from '../memory/store'
import { queueMemoryRefresh } from '../memory/analyze'
import { tokenStateText } from '../token/economy'
import { getActiveApp } from './triggers'
import { getContextManager } from '../context/snapshot'
import { resolveActionForReply } from '../skills/orchestrator'
import type { TriggerReason } from './triggers'
import { IPC, type MoodState, type ScreenObservation } from '../../shared/types'

let currentMood: MoodState = 'idle'

export function getMood(): MoodState {
  return currentMood
}
export function setMood(m: MoodState): void {
  currentMood = m
}

export async function actSpontaneous(win: BrowserWindow, reason: TriggerReason): Promise<void> {
  const { tone } = getSettings()
  let observation: ScreenObservation | undefined
  if (reason === 'window-switch' || reason === 'periodic') {
    const app = getActiveApp()
    observation = (await observe(app)) ?? undefined
  }
  const reply = await respond({
    observation,
    recentEvents: recent(3),
    mood: currentMood,
    tokenStateText: tokenStateText(),
    tone
  })
  const before = currentMood
  currentMood = reply.mood_tag
  getContextManager().setMood(reply.mood_tag)
  getContextManager().appendChatTurn({
    role: 'pet',
    text: reply.dialogue,
    ts: Date.now()
  })
  appendEvent({
    ts: Date.now(),
    type: reason === 'silence' ? 'spontaneous' : 'reactive',
    observation,
    mood_before: before,
    mood_after: reply.mood_tag,
    dialogue: reply.dialogue,
    token_delta: 0
  })
  if (!win.isDestroyed()) {
    win.webContents.send(IPC.PET_MOOD, reply.mood_tag)
    win.webContents.send(IPC.PET_SPEAK, reply.dialogue)
  }
  queueMemoryRefresh()
  void resolveActionForReply(reply, getProvider()).then((action) => {
    if (action && !win.isDestroyed()) win.webContents.send(IPC.PET_ACTION, action)
  })
}
