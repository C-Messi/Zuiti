import type { LLMProvider } from '../brain/provider'
import type { MoodState, PetAnchorId, SkillManifest } from '../../shared/types'
import { isValidPropAnchor, sanitizeSkillId, validatePropSvg } from './registry'

export type SkillDraft = {
  id: string
  title: string
  triggers: string[]
  moodAffinity: MoodState[]
  durationMs: number
  anchor: PetAnchorId
  description: string
  skillMarkdown: string
  svg: string
}

const AUTHOR_SYSTEM = `你是嘴替桌宠的 SVG 道具绘制器。

你要根据道具意图，生成一个透明背景、独立可渲染的 SVG 道具 skill。
你只能画道具本身，例如麦克风、花、牌子、帽子、音符小物件。不要画完整宠物、身体、脸、背景场景、舞台或大范围特效。

只输出严格 JSON：
{
  "id": "kebab-case 英文或拼音 id",
  "title": "短标题",
  "triggers": ["触发词1", "触发词2"],
  "moodAffinity": ["happy"],
  "anchor": "left_hand | right_hand | head_top | mouth | beside_left | beside_right",
  "durationMs": 1800,
  "description": "一句话描述",
  "skillMarkdown": "简短 markdown，说明何时使用",
  "svg": "<svg ...>...</svg>"
}

SVG 约束：必须包含 viewBox；不要 script、foreignObject、image、外链、事件属性；尽量使用基础 shape/path/text 和 animateTransform。`

const VALID_MOODS: MoodState[] = [
  'idle',
  'happy',
  'angry_for_user',
  'cuddling',
  'hungry',
  'sleeping',
  'excited',
  'sad'
]

function parseJson(raw: string): Record<string, unknown> {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('skill author did not return JSON')
  return JSON.parse(match[0]) as Record<string, unknown>
}

function stringList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback
  const list = value.filter(
    (item): item is string => typeof item === 'string' && item.trim().length > 0
  )
  return list.length > 0 ? list.slice(0, 8) : fallback
}

function moodList(value: unknown, fallback: MoodState): MoodState[] {
  if (!Array.isArray(value)) return [fallback]
  const moods = value.filter((item): item is MoodState => VALID_MOODS.includes(item as MoodState))
  return moods.length > 0 ? moods : [fallback]
}

export async function authorSkillDraft(
  provider: LLMProvider,
  propIntent: string,
  mood: MoodState,
  skillIndexText: string
): Promise<SkillDraft> {
  const raw = await provider.completeText(
    AUTHOR_SYSTEM,
    `已有道具 skill 索引：\n${skillIndexText || '（暂无）'}\n\n道具意图：${propIntent}\n当前 mood：${mood}`,
    1800
  )
  const obj = parseJson(raw)
  const svg = typeof obj.svg === 'string' ? obj.svg : ''
  const validation = validatePropSvg(svg)
  if (!validation.ok) throw new Error(validation.reason)

  const id = sanitizeSkillId(typeof obj.id === 'string' ? obj.id : propIntent)
  const title = typeof obj.title === 'string' ? obj.title.slice(0, 40) : id
  const description =
    typeof obj.description === 'string' ? obj.description.slice(0, 120) : propIntent.slice(0, 120)
  const anchor = isValidPropAnchor(obj.anchor) ? obj.anchor : 'right_hand'

  return {
    id,
    title,
    triggers: stringList(obj.triggers, [propIntent]),
    moodAffinity: moodList(obj.moodAffinity, mood),
    anchor,
    durationMs:
      typeof obj.durationMs === 'number' ? Math.min(Math.max(obj.durationMs, 800), 6000) : 2200,
    description,
    skillMarkdown:
      typeof obj.skillMarkdown === 'string'
        ? obj.skillMarkdown
        : `- 触发：${propIntent}\n- 道具：${description}\n- 锚点：${anchor}`,
    svg: validation.svg
  }
}

export function draftToManifest(draft: SkillDraft, reviewScore: number): SkillManifest {
  return {
    kind: 'prop',
    id: draft.id,
    title: draft.title,
    triggers: draft.triggers,
    moodAffinity: draft.moodAffinity,
    durationMs: draft.durationMs,
    reviewScore,
    enabled: true,
    anchor: draft.anchor,
    description: draft.description,
    createdAt: new Date().toISOString()
  }
}
