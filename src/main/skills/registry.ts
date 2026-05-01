import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type {
  MoodState,
  PetAnchorId,
  PetProp,
  SkillIndexItem,
  SkillManifest
} from '../../shared/types'
import { loadPetPackage, petSkillsDir } from '../pet/package'

export const SKILLS_DIR_NAME = 'skills'

const MAX_SVG_CHARS = 30_000
const BLOCKED_SVG_PATTERNS = [
  /<\s*script\b/i,
  /<\s*foreignObject\b/i,
  /<\s*image\b/i,
  /\son[a-z]+\s*=/i,
  /javascript\s*:/i,
  /@import/i,
  /url\s*\(\s*["']?https?:/i,
  /\b(?:href|src)\s*=\s*["'](?:https?:|data:)/i
]
const ALLOWED_TAGS = new Set([
  'svg',
  'g',
  'path',
  'circle',
  'ellipse',
  'rect',
  'line',
  'polyline',
  'polygon',
  'text',
  'tspan',
  'defs',
  'lineargradient',
  'radialgradient',
  'stop',
  'animate',
  'animatetransform',
  'animatemotion',
  'style',
  'title',
  'desc'
])

type SvgValidationResult = { ok: true; svg: string } | { ok: false; reason: string }

type SkillSelectionInput = {
  propIntent?: string
  requestedSkillId?: string
  mood: MoodState
}

type SkillSelection =
  | { kind: 'existing'; skillId: string }
  | { kind: 'create'; propIntent: string }
  | { kind: 'none' }

function skillsDir(root = process.cwd()): string {
  return petSkillsDir(root)
}

function normalizeTrigger(text: string): string {
  return text.trim().toLowerCase()
}

export function isValidPropAnchor(value: unknown, root = process.cwd()): value is PetAnchorId {
  if (typeof value !== 'string') return false
  return Object.prototype.hasOwnProperty.call(loadPetPackage(root).anchors, value)
}

export function validatePropSvg(svg: string): SvgValidationResult {
  const trimmed = svg.trim()
  if (!trimmed.startsWith('<svg')) return { ok: false, reason: 'svg must start with <svg' }
  if (trimmed.length > MAX_SVG_CHARS) return { ok: false, reason: 'svg is too large' }
  if (!/\bviewBox\s*=/.test(trimmed)) return { ok: false, reason: 'svg must include viewBox' }

  for (const pattern of BLOCKED_SVG_PATTERNS) {
    if (pattern.test(trimmed)) return { ok: false, reason: 'svg contains unsafe content' }
  }

  const tagMatches = trimmed.matchAll(/<\s*\/?\s*([a-zA-Z][\w:-]*)\b/g)
  for (const match of tagMatches) {
    const tag = match[1].toLowerCase()
    if (!ALLOWED_TAGS.has(tag)) return { ok: false, reason: `unsupported svg tag: ${tag}` }
  }

  return { ok: true, svg: trimmed }
}

export function ensureSkillsDir(root = process.cwd()): void {
  const dir = skillsDir(root)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

export function sanitizeSkillId(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return slug || `skill-${Date.now()}`
}

export function buildSkillIndexText(skills: SkillIndexItem[]): string {
  const enabled = skills.filter((skill) => skill.enabled)
  if (enabled.length === 0) return '（暂无已启用道具 skill）'
  return enabled
    .map(
      (skill) =>
        `${skill.id}: ${skill.triggers.slice(0, 4).join('/')} | anchor=${skill.anchor} | mood=${skill.moodAffinity.join(',')} | ${skill.description}`
    )
    .join('\n')
    .slice(0, 1000)
}

export function selectSkill(index: SkillIndexItem[], input: SkillSelectionInput): SkillSelection {
  const enabled = index.filter((skill) => skill.enabled)
  if (input.requestedSkillId) {
    const exact = enabled.find((skill) => skill.id === input.requestedSkillId)
    if (exact) return { kind: 'existing', skillId: exact.id }
  }

  const intent = normalizeTrigger(input.propIntent ?? '')
  if (!intent) return { kind: 'none' }

  const scored = enabled
    .map((skill) => {
      const triggerHit = skill.triggers.some((trigger) =>
        intent.includes(normalizeTrigger(trigger))
      )
      const moodHit = skill.moodAffinity.includes(input.mood)
      return {
        skill,
        score: (triggerHit ? 10 : 0) + (moodHit ? 2 : 0) + Math.max(0, skill.reviewScore / 100)
      }
    })
    .filter((item) => item.score >= 10)
    .sort((a, b) => b.score - a.score)

  if (scored[0]) return { kind: 'existing', skillId: scored[0].skill.id }
  return { kind: 'create', propIntent: input.propIntent ?? input.mood }
}

export function loadSkillIndex(root = process.cwd()): SkillIndexItem[] {
  ensureSkillsDir(root)
  return readdirSync(skillsDir(root), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      try {
        const manifest = JSON.parse(
          readFileSync(join(skillsDir(root), entry.name, 'manifest.json'), 'utf8')
        ) as SkillManifest
        if (
          manifest.kind !== 'prop' ||
          !manifest.enabled ||
          !isValidPropAnchor(manifest.anchor, root) ||
          !existsSync(join(skillsDir(root), entry.name, 'prop.svg'))
        ) {
          return []
        }
        return [
          {
            kind: 'prop',
            id: manifest.id,
            title: manifest.title,
            triggers: manifest.triggers,
            moodAffinity: manifest.moodAffinity,
            durationMs: manifest.durationMs,
            reviewScore: manifest.reviewScore,
            enabled: manifest.enabled,
            anchor: manifest.anchor,
            description: manifest.description
          }
        ]
      } catch {
        return []
      }
    })
}

export function readSkillProp(skillId: string, root = process.cwd()): PetProp | null {
  const manifestPath = join(skillsDir(root), skillId, 'manifest.json')
  const svgPath = join(skillsDir(root), skillId, 'prop.svg')
  if (!existsSync(manifestPath) || !existsSync(svgPath)) return null
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as SkillManifest
  if (manifest.kind !== 'prop' || !manifest.enabled || !isValidPropAnchor(manifest.anchor, root)) {
    return null
  }
  return {
    skill_id: manifest.id,
    title: manifest.title,
    durationMs: manifest.durationMs,
    anchor: manifest.anchor,
    svg: readFileSync(svgPath, 'utf8')
  }
}

export function writeSkillPackage(
  manifest: SkillManifest,
  skillMarkdown: string,
  svg: string,
  root = process.cwd()
): void {
  const validation = validatePropSvg(svg)
  if (!validation.ok) throw new Error(validation.reason)
  if (manifest.kind !== 'prop' || !isValidPropAnchor(manifest.anchor, root)) {
    throw new Error('prop skill manifest must include a valid anchor')
  }
  ensureSkillsDir(root)
  const dir = join(skillsDir(root), manifest.id)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  writeFileSync(join(dir, 'skill.md'), skillMarkdown.trim() + '\n', 'utf8')
  writeFileSync(join(dir, 'prop.svg'), validation.svg + '\n', 'utf8')
}
