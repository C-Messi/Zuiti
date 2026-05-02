import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import {
  IPC,
  type PetActivity,
  type PetRenderPackage,
  type Settings,
  type WindowDragPoint
} from '../shared/types'

const api = {
  userSay: (text: string): Promise<{ ok: boolean }> =>
    ipcRenderer.invoke(IPC.USER_SAY, text) as Promise<{ ok: boolean }>,
  onPetSpeak: (cb: (text: string) => void): (() => void) => {
    const handler = (_e: unknown, t: string): void => cb(t)
    ipcRenderer.on(IPC.PET_SPEAK, handler)
    return () => ipcRenderer.off(IPC.PET_SPEAK, handler)
  },
  onPetMood: (cb: (mood: string) => void): (() => void) => {
    const handler = (_e: unknown, m: string): void => cb(m)
    ipcRenderer.on(IPC.PET_MOOD, handler)
    return () => ipcRenderer.off(IPC.PET_MOOD, handler)
  },
  onPetActivity: (cb: (activity: PetActivity) => void): (() => void) => {
    const handler = (_e: unknown, activity: PetActivity): void => cb(activity)
    ipcRenderer.on(IPC.PET_ACTIVITY, handler)
    return () => ipcRenderer.off(IPC.PET_ACTIVITY, handler)
  },
  petPackageGet: (): Promise<PetRenderPackage> =>
    ipcRenderer.invoke(IPC.PET_PACKAGE_GET) as Promise<PetRenderPackage>,
  settingsGet: (): Promise<Settings> => ipcRenderer.invoke(IPC.SETTINGS_GET) as Promise<Settings>,
  settingsSet: (patch: Partial<Settings>): Promise<Settings> =>
    ipcRenderer.invoke(IPC.SETTINGS_SET, patch) as Promise<Settings>,
  visionPause: (durationMs: number | null): Promise<Settings> =>
    ipcRenderer.invoke(IPC.VISION_PAUSE, durationMs) as Promise<Settings>,
  windowDragStart: (point: WindowDragPoint): Promise<{ ok: boolean }> =>
    ipcRenderer.invoke(IPC.WINDOW_DRAG_START, point) as Promise<{ ok: boolean }>,
  windowDragMove: (point: WindowDragPoint): Promise<{ ok: boolean }> =>
    ipcRenderer.invoke(IPC.WINDOW_DRAG_MOVE, point) as Promise<{ ok: boolean }>,
  windowDragEnd: (): Promise<{ ok: boolean }> =>
    ipcRenderer.invoke(IPC.WINDOW_DRAG_END) as Promise<{ ok: boolean }>
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('zuiti', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.zuiti = api
}

export type ZuitiApi = typeof api
