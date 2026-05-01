import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import type { BrainResponse } from '../../shared/types'
import { safeWarn } from '../logger'

export type LLMProvider = {
  chatJSON(system: string, user: string): Promise<BrainResponse>
  visionJSON(system: string, user: string, imageBase64: string): Promise<unknown>
  completeText(system: string, user: string, maxTokens?: number): Promise<string>
}

const SAFE: BrainResponse = { dialogue: '在啊，我都饿瘦了', mood_tag: 'hungry' }

function safeParseBrain(raw: string): BrainResponse {
  try {
    const m = raw.match(/\{[\s\S]*\}/)
    if (!m) return SAFE
    const obj = JSON.parse(m[0]) as Partial<BrainResponse>
    if (typeof obj.dialogue === 'string' && typeof obj.mood_tag === 'string') {
      return {
        dialogue: obj.dialogue,
        mood_tag: obj.mood_tag,
        motion_plan: obj.motion_plan,
        prop_intent: obj.prop_intent,
        prop_skill_id: obj.prop_skill_id
      } as BrainResponse
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
    async visionJSON(system) {
      if (system.includes('道具视觉审核器')) {
        return {
          score: 88,
          summary: '道具清晰、锚点合适、安全可用'
        }
      }
      return {
        app: 'unknown',
        scene: 'idle',
        emotion_signal: 'neutral',
        summary_for_pet: '主人在桌面发呆',
        privacy_filtered: false
      }
    },
    async completeText(system) {
      if (system.includes('SVG 道具绘制器')) {
        return JSON.stringify({
          id: 'mock-microphone',
          title: 'Mock Microphone',
          triggers: ['唱歌', '麦克风', '开唱'],
          moodAffinity: ['excited', 'happy'],
          anchor: 'right_hand',
          durationMs: 1800,
          description: '手持唱歌麦克风道具',
          skillMarkdown: '- 触发：唱歌、开唱\n- 道具：挂在右手的麦克风\n- 锚点：right_hand',
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><g><rect x="112" y="92" width="32" height="104" rx="14" fill="#111827"/><circle cx="128" cy="74" r="34" fill="#f472b6" stroke="#111827" stroke-width="8"/><path d="M108 69 h40" stroke="#fff7ed" stroke-width="6" stroke-linecap="round" opacity=".72"/><path d="M105 210 h46" stroke="#111827" stroke-width="10" stroke-linecap="round"/></g></svg>'
        })
      }
      if (system.includes('长期记忆整理器')) {
        return '# 长期记忆\n- 用户喜欢自然、短句、有陪伴感的桌宠。\n- 不要重复 token 喂养梗，屏幕信息只在有用时提。\n- 宠物本体由稳定骨架渲染，道具 skill 以 SVG 自动沉淀，审核通过后自动启用。'
      }
      return '{"dialogue":"在的，我会轻一点但一直在","mood_tag":"cuddling","motion_plan":{"skeleton_id":"default-cat","commands":[{"tool":"idle_breathe","durationMs":1800,"params":{"intensity":0.5}}]}}'
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
    async completeText(system, user, maxTokens = 1024) {
      const r = await client.chat.completions.create({
        model: textModel,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.7,
        max_tokens: maxTokens
      })
      return r.choices[0]?.message?.content ?? ''
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
    async completeText(system, user, maxTokens = 1024) {
      const r = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: user }]
      })
      return r.content.map((c) => ('text' in c ? c.text : '')).join('')
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
    safeWarn('[brain] provider init failed, falling back to mock:', err)
  }
  return makeMockProvider()
}
