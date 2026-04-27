import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import type { BrainResponse } from '../../shared/types'

export type LLMProvider = {
  chatJSON(system: string, user: string): Promise<BrainResponse>
  visionJSON(system: string, user: string, imageBase64: string): Promise<unknown>
}

const SAFE: BrainResponse = { dialogue: '在啊，我都饿瘦了', mood_tag: 'hungry' }

function safeParseBrain(raw: string): BrainResponse {
  try {
    const m = raw.match(/\{[\s\S]*\}/)
    if (!m) return SAFE
    const obj = JSON.parse(m[0]) as Partial<BrainResponse>
    if (typeof obj.dialogue === 'string' && typeof obj.mood_tag === 'string') {
      return obj as BrainResponse
    }
  } catch {
    /* fall through */
  }
  return SAFE
}

export function makeMockProvider(): LLMProvider {
  const replies: BrainResponse[] = [
    { dialogue: '在的在的，主人想我了吗', mood_tag: 'happy' },
    { dialogue: '啊？这班上得，我都替你不爽', mood_tag: 'angry_for_user' },
    { dialogue: '喂喂喂，token 都不喂我了？', mood_tag: 'hungry' },
    { dialogue: '哈哈哈这个我也喜欢，再来！', mood_tag: 'excited' },
    { dialogue: '没事的，我在这', mood_tag: 'cuddling' }
  ]
  let i = 0
  return {
    async chatJSON() {
      const r = replies[i % replies.length]
      i++
      return r
    },
    async visionJSON() {
      return {
        app: 'unknown',
        scene: 'idle',
        emotion_signal: 'neutral',
        summary_for_pet: '主人在桌面发呆',
        privacy_filtered: false
      }
    }
  }
}

export function makeOpenAIProvider(): LLMProvider {
  const key = process.env.LLM_API_KEY
  if (!key) throw new Error('LLM_API_KEY missing')
  const baseURL = process.env.LLM_BASE_URL || undefined
  const client = new OpenAI({ apiKey: key, baseURL })
  const textModel = process.env.LLM_TEXT_MODEL ?? 'gpt-4o-mini'
  const visionModel = process.env.LLM_VISION_MODEL ?? 'gpt-4o-mini'
  return {
    async chatJSON(system, user) {
      const r = await client.chat.completions.create({
        model: textModel,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.8
      })
      return safeParseBrain(r.choices[0]?.message?.content ?? '')
    },
    async visionJSON(system, user, imageBase64) {
      const r = await client.chat.completions.create({
        model: visionModel,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          {
            role: 'user',
            content: [
              { type: 'text', text: user },
              {
                type: 'image_url',
                image_url: { url: `data:image/png;base64,${imageBase64}` }
              }
            ]
          }
        ],
        temperature: 0.4
      })
      try {
        return JSON.parse(r.choices[0]?.message?.content ?? '{}') as unknown
      } catch {
        return {}
      }
    }
  }
}

export function makeAnthropicProvider(): LLMProvider {
  const key = process.env.LLM_API_KEY
  if (!key) throw new Error('LLM_API_KEY missing')
  const baseURL = process.env.LLM_BASE_URL || undefined
  const client = new Anthropic({ apiKey: key, baseURL })
  const model = process.env.LLM_TEXT_MODEL ?? 'claude-3-5-sonnet-latest'
  return {
    async chatJSON(system, user) {
      const r = await client.messages.create({
        model,
        max_tokens: 256,
        system,
        messages: [{ role: 'user', content: user }]
      })
      const text = r.content.map((c) => ('text' in c ? c.text : '')).join('')
      return safeParseBrain(text)
    },
    async visionJSON(system, user, imageBase64) {
      const r = await client.messages.create({
        model,
        max_tokens: 512,
        system,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: user },
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/png', data: imageBase64 }
              }
            ]
          }
        ]
      })
      const text = r.content.map((c) => ('text' in c ? c.text : '')).join('')
      try {
        const m = text.match(/\{[\s\S]*\}/)
        return m ? (JSON.parse(m[0]) as unknown) : {}
      } catch {
        return {}
      }
    }
  }
}

export function pickProvider(): LLMProvider {
  const p = (process.env.LLM_PROVIDER ?? 'mock').toLowerCase()
  try {
    if (p === 'openai') return makeOpenAIProvider()
    if (p === 'anthropic') return makeAnthropicProvider()
  } catch (err) {
    console.warn('[brain] provider init failed, falling back to mock:', err)
  }
  return makeMockProvider()
}
