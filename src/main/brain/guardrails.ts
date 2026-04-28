const FALLBACK_LINES = [
  '嗯心疼你，这班上得，难怪你不爽',
  '我都替你不爽，要不要先深呼吸',
  '这就是工作啊，但今天你已经很努力了',
  '没事的，我在这'
]

const NAME_LIKE_REGEX = /(@\w+|经理|老板|主管|CEO|总监|[\u4e00-\u9fa5]{2,4}(经理|总|总监|主管))/g
const PHONE_REGEX = /\b\d{11}\b/
const EMAIL_REGEX = /\S+@\S+\.\S+/

export function applyGuardrails(text: string): string {
  if (!text || text.length > 180) return pickFallback()
  if (PHONE_REGEX.test(text) || EMAIL_REGEX.test(text)) return pickFallback()
  return text.replace(NAME_LIKE_REGEX, '那位')
}

export function pickFallback(): string {
  return FALLBACK_LINES[Math.floor(Math.random() * FALLBACK_LINES.length)]
}
