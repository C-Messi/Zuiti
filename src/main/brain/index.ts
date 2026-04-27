import { pickProvider, type LLMProvider } from './provider'
import { buildSystemPrompt, buildUserPrompt, type PromptContext } from './prompt'
import { applyGuardrails, pickFallback } from './guardrails'
import type { BrainResponse } from '../../shared/types'

let _provider: LLMProvider | null = null
export function getProvider(): LLMProvider {
  if (!_provider) _provider = pickProvider()
  return _provider
}

export async function respond(
  ctx: PromptContext,
  userText?: string
): Promise<BrainResponse> {
  const system = buildSystemPrompt(ctx.tone)
  const userBlock = userText
    ? `${buildUserPrompt(ctx)}\n用户刚说：${userText}`
    : buildUserPrompt(ctx)
  try {
    const r = await getProvider().chatJSON(system, userBlock)
    return { ...r, dialogue: applyGuardrails(r.dialogue) }
  } catch (err) {
    console.warn('[brain] chatJSON failed, falling back:', err)
    return { dialogue: pickFallback(), mood_tag: ctx.mood }
  }
}
