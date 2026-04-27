import { exec } from 'child_process'

let lastApp = ''
let timer: NodeJS.Timeout | null = null
const listeners: Array<(name: string) => void> = []

function pollOnce(): void {
  exec(
    `osascript -e 'tell application "System Events" to get name of (processes where frontmost is true)'`,
    (err, stdout) => {
      if (err) return
      const name = stdout.trim().replace(/,?\s*$/, '')
      if (!name || name === lastApp) return
      lastApp = name
      listeners.forEach((cb) => cb(name))
    }
  )
}

export function startWindowWatcher(): void {
  if (process.platform !== 'darwin') return
  if (timer) return
  timer = setInterval(pollOnce, 1500)
}

export function stopWindowWatcher(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

export function onActiveAppChanged(cb: (name: string) => void): () => void {
  listeners.push(cb)
  return () => {
    const idx = listeners.indexOf(cb)
    if (idx >= 0) listeners.splice(idx, 1)
  }
}

export function getActiveApp(): string {
  return lastApp
}
