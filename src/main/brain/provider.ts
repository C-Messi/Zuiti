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
        animation_hint: obj.animation_hint,
        action_intent: obj.action_intent,
        skill_id: obj.skill_id
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
      if (system.includes('动作视觉审核器')) {
        return {
          score: 88,
          summary: '动作清晰、风格可爱、安全可用'
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
      if (system.includes('SVG 动作绘制器')) {
        return JSON.stringify({
          id: 'mock-spark-jump',
          title: 'Mock Spark Jump',
          triggers: ['开心', '庆祝', '跳一下'],
          moodAffinity: ['happy', 'excited'],
          durationMs: 1800,
          description: '开心时带小星星跳一下',
          skillMarkdown: '- 触发：开心、庆祝、用户完成任务\n- 动作：圆滚滚桌宠带星星轻轻跳起',
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><g><circle cx="128" cy="128" r="58" fill="#fff7ed" stroke="#111827" stroke-width="6"/><circle cx="108" cy="116" r="7" fill="#111827"/><circle cx="148" cy="116" r="7" fill="#111827"/><path d="M104 146 Q128 166 152 146" fill="none" stroke="#111827" stroke-width="6" stroke-linecap="round"/><path d="M70 72 L78 90 L98 92 L82 104 L86 124 L70 114 L52 124 L58 104 L42 92 L62 90 Z" fill="#facc15"/><animateTransform attributeName="transform" type="translate" values="0 0;0 -14;0 0" dur="1.2s" repeatCount="indefinite"/></g></svg>'
        })
      }
      if (system.includes('长期记忆整理器')) {
        return '# 长期记忆\n- 用户喜欢自然、短句、有陪伴感的桌宠。\n- 不要重复 token 喂养梗，屏幕信息只在有用时提。\n- 动作 skill 以 SVG 自动沉淀，审核通过后自动启用。'
      }
      return '{"dialogue":"在的，我会轻一点但一直在","mood_tag":"cuddling","action_intent":"轻轻抱抱用户"}'
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
