import { startWindowWatcher, onActiveAppChanged, getActiveApp } from './window-watch'

export type TriggerReason = 'periodic' | 'window-switch' | 'silence'
type TriggerCb = (reason: TriggerReason) => void

let lastInteractionTs = Date.now()
let started = false

export function noteUserInteraction(): void {
  lastInteractionTs = Date.now()
}

export function startTriggers(cb: TriggerCb): void {
  if (started) return
  started = true

  startWindowWatcher()

  setInterval(() => cb('periodic'), 60_000)

  let silenceFired = false
  setInterval(() => {
    const idle = Date.now() - lastInteractionTs
    if (idle > 180_000 && !silenceFired) {
      silenceFired = true
      cb('silence')
    } else if (idle < 60_000) {
      silenceFired = false
    }
  }, 30_000)

  let timer: NodeJS.Timeout | null = null
  onActiveAppChanged(() => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => cb('window-switch'), 5_000)
  })
}

export { getActiveApp }
