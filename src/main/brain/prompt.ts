import type { ContextSnapshot } from '../context/snapshot'
import type { MoodState, PetEvent, ScreenObservation, ToneMode } from '../../shared/types'

export type PromptContext = {
  observation?: ScreenObservation
  recentEvents: PetEvent[]
  mood: MoodState
  tokenStateText: string
  tone: ToneMode
}

const TONE_BLOCK: Record<ToneMode, string> = {
  default: '风格：自然短句，最多 2 句话；可以网感一点，但不要复读固定梗。',
  gentle: '风格：短句、温柔安抚、像最理解用户的朋友；少锐评，多陪伴。',
  silent: '风格：极简，最多 5 个字，或一个 emoji。'
}

function formatVision(summary?: ScreenObservation): string {
  if (!summary) return '屏幕快照：（暂无最新摘要）'
  if (summary.privacy_filtered) return '屏幕快照：当前在敏感 app，已跳过细节。'
  return `屏幕快照：${summary.summary_for_pet}（场景=${summary.scene}，情绪=${summary.emotion_signal}）`
}

function formatChatWindow(snapshot: ContextSnapshot): string {
  if (snapshot.chatWindow.length === 0) return '（暂无短期对话）'
  return snapshot.chatWindow
    .slice(-12)
    .map((turn) => `${turn.role === 'user' ? '用户' : '嘴替'}：${turn.text}`)
    .join('\n')
}

function formatRecentEvents(events: PetEvent[]): string {
  if (events.length === 0) return '（无近期事件）'
  return events
    .slice(-3)
    .map((event) => `${event.type}: mood=${event.mood_after} ${event.dialogue ?? ''}`.trim())
    .join('\n')
}

export function buildTextSystemPrompt(soulText: string, tone: ToneMode): string {
  return `${soulText}

${TONE_BLOCK[tone]}

输出要求：
- 严格输出 JSON，不要 markdown。
- dialogue 是最终给用户看的话，短、自然，不超过 2 句。
- mood_tag 只能是 idle | happy | angry_for_user | cuddling | hungry | sleeping | excited | sad。
- action_intent 可选：当你希望桌宠做一个具体动作时，用一句中文描述动作意图。
- skill_id 可选：如果你确信已有 skill 适合，可以填 skill id。
- 屏幕、token、记忆只是上下文；只有相关时才提，不要为了提而提。

JSON 形状：
{ "dialogue": "...", "mood_tag": "...", "action_intent": "可选", "skill_id": "可选" }`
}

export function buildTextUserPrompt(
  ctx: PromptContext,
  snapshot: ContextSnapshot,
  userText?: string
): string {
  return `长期记忆：
${snapshot.memoryText || '（暂无）'}

可用动作 skill 索引：
${snapshot.skillIndexText || '（暂无）'}

${formatVision(snapshot.visionSummary ?? ctx.observation)}

短期对话滑动窗口：
${formatChatWindow(snapshot)}

近期桌宠事件：
${formatRecentEvents(ctx.recentEvents)}

当前 mood：${ctx.mood}
${ctx.tokenStateText}

当前事件：
${userText ? `用户刚说：${userText}` : ctx.observation ? '根据最新屏幕/触发器主动回应。' : '主动找用户，但不要强行提 token。'}

请输出 JSON。`
}

export function buildVisionSystemPrompt(soulText: string, memoryText: string): string {
  return `你是嘴替桌宠的截图分析 agent。你只负责把截图压缩成安全、短小、可供宠物理解的摘要。

人格参考：
${soulText}

长期记忆参考：
${memoryText || '（暂无）'}

只输出严格 JSON：
{
  "app": "<前台 app 短名>",
  "scene": "coding | messaging | watching | writing | browsing | idle | other",
  "emotion_signal": "positive | negative | neutral | stressed",
  "trigger_topic": "<简短话题，可空字符串>",
  "summary_for_pet": "<一句中文，<=30 字，不含隐私细节>"
}

规则：不抄截图里的姓名、邮箱、手机号、账号、具体公司/群名；看不清就用 neutral 和“屏幕没什么特别的”。`
}

export function buildMemorySystemPrompt(soulText: string): string {
  return `你是嘴替桌宠的长期记忆整理器。

人格参考：
${soulText}

任务：把输入压缩成 memory.md，只保留稳定偏好、重要近况、互动禁忌。不要流水账，不要隐私细节。
输出 markdown，400-800 中文字以内，优先短 bullet。`
}

export function buildMemoryUserPrompt(snapshot: ContextSnapshot): string {
  return `当前 memory.md：
${snapshot.memoryText || '（暂无）'}

最新屏幕摘要：
${formatVision(snapshot.visionSummary)}

短期对话：
${formatChatWindow(snapshot)}

请重写 memory.md。`
}
