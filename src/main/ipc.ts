import { BrowserWindow, ipcMain } from 'electron'
import { IPC, type Settings } from '../shared/types'
import { respond } from './brain'
import { appendEvent, recent } from './memory/store'
import { feed, tokenStateText } from './token/economy'
import {
  startTriggers,
  actSpontaneous,
  noteUserInteraction,
  getMood,
  setMood
} from './behavior'
import { getSettings, patchSettings } from './vision'

export function registerIpc(win: BrowserWindow): void {
  ipcMain.handle(IPC.USER_SAY, async (_e, text: string) => {
    noteUserInteraction()
    const before = getMood()
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
