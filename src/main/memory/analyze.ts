import { getProvider } from '../brain'
import { getContextManager } from '../context/snapshot'
import { getRuntimeRoot, refreshRuntimeMemory } from '../context/runtime'
import { buildMemorySystemPrompt, buildMemoryUserPrompt } from '../brain/prompt'
import { compactMemoryText, writeMemoryText } from './files'
import { safeWarn } from '../logger'

const MEMORY_REFRESH_DEBOUNCE_MS = 6_000

let timer: NodeJS.Timeout | null = null
let inFlight = false

export function queueMemoryRefresh(): void {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    void refreshMemoryNow()
  }, MEMORY_REFRESH_DEBOUNCE_MS)
}

export async function refreshMemoryNow(): Promise<void> {
  if (inFlight) return
  inFlight = true
  try {
    const snapshot = getContextManager().getSnapshot()
    const raw = await getProvider().completeText(
      buildMemorySystemPrompt(snapshot.soulText),
      buildMemoryUserPrompt(snapshot),
      900
    )
    writeMemoryText(compactMemoryText(raw), getRuntimeRoot())
    refreshRuntimeMemory(getRuntimeRoot())
  } catch (err) {
    safeWarn('[memory] refresh failed:', err)
  } finally {
    inFlight = false
  }
}
