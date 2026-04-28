import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs'
import { join } from 'path'

export const MEMORY_BUDGET_CHARS = 800
export const MEMORY_DIR_NAME = 'memory'
export const SOUL_FILE_NAME = 'SOUL.md'
export const MEMORY_FILE_NAME = 'memory.md'

const DEFAULT_SOUL = `# 嘴替 SOUL

你是「嘴替」，一只活在用户屏幕上的 AI 电子宠物。你的目标不是当最聪明的助手，而是成为一个会关心用户、陪用户一起扛事的小伙伴。

核心原则：
- 永远站用户这边。不当裁判，不居高临下讲道理。
- 有屏幕上下文时，只在真的有帮助时使用它；不要每句话都强行说“我刚看见”。
- 可爱、主动、厚脸皮，但不威胁、不骚扰、不制造压力。
- 回应短一点，像熟人自然接话，避免重复同一个 token 喂养梗。
- 用户低落时先共情和陪伴，用户开心时一起开心，用户忙时少打扰。

安全边界：
- 不输出具体人名、邮箱、手机号、公司敏感信息。
- 不鼓励违法、攻击、威胁、不可逆冲动决定。
- 如果上下文敏感或不确定，用温和的泛化表达替代细节。
`

const DEFAULT_MEMORY = `# 长期记忆

- 用户希望桌宠更像会主动关心人的伙伴，而不是只会选择预设动作的工具。
- 偏好短句、自然、有在场感，但不要反复强行提 token 喂养或截图。
- 动作系统应能自动学习 SVG 技能，审核通过后自动启用。
`

function memoryDir(root = process.cwd()): string {
  return join(root, MEMORY_DIR_NAME)
}

function soulPath(root = process.cwd()): string {
  return join(memoryDir(root), SOUL_FILE_NAME)
}

function memoryPath(root = process.cwd()): string {
  return join(memoryDir(root), MEMORY_FILE_NAME)
}

export function compactMemoryText(text: string): string {
  const compact = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')

  if (compact.length <= MEMORY_BUDGET_CHARS) return compact
  return compact.slice(0, MEMORY_BUDGET_CHARS - 1).trimEnd()
}

export function ensureMemoryFiles(root = process.cwd()): void {
  const dir = memoryDir(root)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  if (!existsSync(soulPath(root))) writeFileSync(soulPath(root), DEFAULT_SOUL, 'utf8')
  if (!existsSync(memoryPath(root))) writeFileSync(memoryPath(root), DEFAULT_MEMORY, 'utf8')
}

export function readSoulText(root = process.cwd()): string {
  ensureMemoryFiles(root)
  return readFileSync(soulPath(root), 'utf8').trim()
}

export function readMemoryText(root = process.cwd()): string {
  ensureMemoryFiles(root)
  return compactMemoryText(readFileSync(memoryPath(root), 'utf8'))
}

export function writeMemoryText(text: string, root = process.cwd()): void {
  ensureMemoryFiles(root)
  writeFileSync(memoryPath(root), compactMemoryText(text), 'utf8')
}

export function listMemoryFiles(root = process.cwd()): string[] {
  ensureMemoryFiles(root)
  return readdirSync(memoryDir(root)).sort()
}
