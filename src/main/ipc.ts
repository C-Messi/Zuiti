import { BrowserWindow, ipcMain } from 'electron'
import { IPC, type Settings } from '../shared/types'
import { getProvider, respond } from './brain'
import { appendEvent, recent } from './memory/store'
import { queueMemoryRefresh } from './memory/analyze'
import { feed, tokenStateText } from './token/economy'
import { initializeRuntimeContext } from './context/runtime'
import { getContextManager } from './context/snapshot'
import { resolveActionForReply } from './skills/orchestrator'
import { startTriggers, actSpontaneous, noteUserInteraction, getMood, setMood } from './behavior'
import { getSettings, patchSettings } from './vision'

export function registerIpc(win: BrowserWindow): void {
  initializeRuntimeContext()

  ipcMain.handle(IPC.USER_SAY, async (_e, text: string) => {
    noteUserInteraction()
    const before = getMood()
    getContextManager().appendChatTurn({ role: 'user', text, ts: Date.now() })
    const reply = await respond(
      {
        recentEvents: recent(3),
        mood: before,
        tokenStateText: tokenStateText(),
        tone: getSettings().tone
      },
      text
    )
    setMood(reply.mood_tag)
    getContextManager().setMood(reply.mood_tag)
    getContextManager().appendChatTurn({
      role: 'pet',
      text: reply.dialogue,
      ts: Date.now()
    })
    feed(text.length)
    appendEvent({
      ts: Date.now(),
      type: 'user_initiated',
      mood_before: before,
      mood_after: reply.mood_tag,
      dialogue: reply.dialogue,
      token_delta: text.length
    })
    if (!win.isDestroyed()) {
      win.webContents.send(IPC.PET_MOOD, reply.mood_tag)
      win.webContents.send(IPC.PET_SPEAK, reply.dialogue)
    }
    queueMemoryRefresh()
    void resolveActionForReply(reply, getProvider()).then((action) => {
      if (action && !win.isDestroyed()) win.webContents.send(IPC.PET_ACTION, action)
    })
    return { ok: true }
  })

  ipcMain.handle(IPC.SETTINGS_GET, () => getSettings())
  ipcMain.handle(IPC.SETTINGS_SET, (_e, p: Partial<Settings>) => patchSettings(p))
  ipcMain.handle(IPC.VISION_PAUSE, (_e, durationMs: number | null) =>
    patchSettings({
      visionPausedUntil: durationMs ? Date.now() + durationMs : null
    })
  )

  startTriggers((reason) => {
    void actSpontaneous(win, reason)
  })
}
