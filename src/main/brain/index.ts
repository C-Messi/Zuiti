import { pickProvider, type LLMProvider } from './provider'
import { buildTextSystemPrompt, buildTextUserPrompt, type PromptContext } from './prompt'
import { applyGuardrails, pickFallback } from './guardrails'
import { ensureRuntimeContext } from '../context/runtime'
import { getContextManager } from '../context/snapshot'
import { safeWarn } from '../logger'
import type { BrainResponse } from '../../shared/types'

let _provider: LLMProvider | null = null
export function getProvider(): LLMProvider {
  if (!_provider) _provider = pickProvider()
  return _provider
}

export async function respond(ctx: PromptContext, userText?: string): Promise<BrainResponse> {
  ensureRuntimeContext()
  const snapshot = getContextManager().getSnapshot()
  const system = buildTextSystemPrompt(snapshot.soulText, ctx.tone)
  const userBlock = buildTextUserPrompt(ctx, snapshot, userText)
  try {
    const r = await getProvider().chatJSON(system, userBlock)
    return { ...r, dialogue: applyGuardrails(r.dialogue) }
  } catch (err) {
    safeWarn('[brain] chatJSON failed, falling back:', err)
    return { dialogue: pickFallback(), mood_tag: ctx.mood }
  }
}
