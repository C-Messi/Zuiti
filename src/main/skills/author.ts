import type { LLMProvider } from '../brain/provider'
import type { MoodState, SkillManifest } from '../../shared/types'
import { sanitizeSkillId, validateActionSvg } from './registry'

export type SkillDraft = {
  id: string
  title: string
  triggers: string[]
  moodAffinity: MoodState[]
  durationMs: number
  description: string
  skillMarkdown: string
  svg: string
}

const AUTHOR_SYSTEM = `你是嘴替桌宠的 SVG 动作绘制器。

你要根据动作意图，生成一个透明背景、独立可渲染的 SVG 动画 skill。角色是圆滚滚、可爱、情绪丰富的桌宠。

只输出严格 JSON：
{
  "id": "kebab-case 英文或拼音 id",
  "title": "短标题",
  "triggers": ["触发词1", "触发词2"],
  "moodAffinity": ["happy"],
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
  actionIntent: string,
  mood: MoodState,
  skillIndexText: string
): Promise<SkillDraft> {
  const raw = await provider.completeText(
    AUTHOR_SYSTEM,
    `已有 skill 索引：\n${skillIndexText || '（暂无）'}\n\n动作意图：${actionIntent}\n当前 mood：${mood}`,
    1800
  )
  const obj = parseJson(raw)
  const svg = typeof obj.svg === 'string' ? obj.svg : ''
  const validation = validateActionSvg(svg)
  if (!validation.ok) throw new Error(validation.reason)

  const id = sanitizeSkillId(typeof obj.id === 'string' ? obj.id : actionIntent)
  const title = typeof obj.title === 'string' ? obj.title.slice(0, 40) : id
  const description =
    typeof obj.description === 'string' ? obj.description.slice(0, 120) : actionIntent.slice(0, 120)

  return {
    id,
    title,
    triggers: stringList(obj.triggers, [actionIntent]),
    moodAffinity: moodList(obj.moodAffinity, mood),
    durationMs:
      typeof obj.durationMs === 'number' ? Math.min(Math.max(obj.durationMs, 800), 6000) : 2200,
    description,
    skillMarkdown:
      typeof obj.skillMarkdown === 'string'
        ? obj.skillMarkdown
        : `- 触发：${actionIntent}\n- 动作：${description}`,
    svg: validation.svg
  }
}

export function draftToManifest(draft: SkillDraft, reviewScore: number): SkillManifest {
  return {
    id: draft.id,
    title: draft.title,
    triggers: draft.triggers,
    moodAffinity: draft.moodAffinity,
    durationMs: draft.durationMs,
    reviewScore,
    enabled: true,
    description: draft.description,
    createdAt: new Date().toISOString()
  }
}
