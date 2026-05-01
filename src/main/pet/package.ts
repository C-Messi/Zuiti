import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type {
  MoodState,
  MotionToolDefinition,
  PetExpressionDefinition,
  PetPartDefinition,
  PetRenderPackage,
  SkeletonPoint
} from '../../shared/types'

export const DEFAULT_PET_ID = 'default-cat'
export const PET_RESOURCES_DIR_NAME = 'pet_resources'
export const PETS_DIR_NAME = 'pets'

const MOODS: MoodState[] = [
  'idle',
  'happy',
  'angry_for_user',
  'cuddling',
  'hungry',
  'sleeping',
  'excited',
  'sad'
]

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

type ManifestPart = {
  label: string
  path: string
  transformOrigin: string
}

type ManifestExpression = {
  partId: string
  path: string
}

type PetManifest = {
  id: string
  title: string
  viewBox: string
  ariaLabel: string
  renderOrder: string[]
  parts: Record<string, ManifestPart>
  expressions: Partial<Record<MoodState, ManifestExpression>>
  anchors: Record<string, SkeletonPoint>
  motionTools: MotionToolDefinition[]
  moodDefaults: PetRenderPackage['moodDefaults']
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function petRoot(root = process.cwd(), petId = DEFAULT_PET_ID): string {
  return join(root, PET_RESOURCES_DIR_NAME, PETS_DIR_NAME, petId)
}

export function getEnabledPetId(): string {
  const petId = process.env.ENABLED_PET?.trim()
  if (!petId) return DEFAULT_PET_ID
  assert(
    /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(petId),
    'ENABLED_PET must be a pet_resources/pets directory name'
  )
  return petId
}

export function petPackageDir(root = process.cwd(), petId = getEnabledPetId()): string {
  return petRoot(root, petId)
}

function readablePetPackageDir(root = process.cwd(), petId = getEnabledPetId()): string {
  const dir = petRoot(root, petId)
  if (existsSync(join(dir, 'manifest.json'))) return dir
  return petRoot(process.cwd(), petId)
}

export function petMemoryDir(root = process.cwd(), petId = getEnabledPetId()): string {
  return join(root, PET_RESOURCES_DIR_NAME, PETS_DIR_NAME, petId, 'memory')
}

export function petSkillsDir(root = process.cwd(), petId = getEnabledPetId()): string {
  return join(root, PET_RESOURCES_DIR_NAME, PETS_DIR_NAME, petId, 'skills')
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function assertSafeGroupSvg(partId: string, svg: string): string {
  const trimmed = svg.trim()
  const normalized = partId.replaceAll('_', '-')
  assert(trimmed.startsWith(`<g id="zuiti-part-${normalized}"`), `invalid part svg id: ${partId}`)
  for (const pattern of BLOCKED_SVG_PATTERNS) {
    assert(!pattern.test(trimmed), `unsafe svg in pet part: ${partId}`)
  }
  return trimmed
}

function assertSafeTransform(transform: string): void {
  assert(transform.length <= 120, 'motion transform is too long')
  assert(
    /^[a-zA-Z0-9\s().,%{}+\-*/_]+$/.test(transform),
    `motion transform contains unsupported characters: ${transform}`
  )
  assert(
    !/[;:]/.test(transform),
    `motion transform must not contain CSS declarations: ${transform}`
  )
}

function parseManifest(value: unknown): PetManifest {
  assert(isRecord(value), 'pet manifest must be an object')
  assert(typeof value.id === 'string' && value.id.trim(), 'pet manifest missing id')
  assert(typeof value.title === 'string' && value.title.trim(), 'pet manifest missing title')
  assert(typeof value.viewBox === 'string' && value.viewBox.trim(), 'pet manifest missing viewBox')
  assert(
    typeof value.ariaLabel === 'string' && value.ariaLabel.trim(),
    'pet manifest missing ariaLabel'
  )
  assert(Array.isArray(value.renderOrder), 'pet manifest missing renderOrder')
  assert(isRecord(value.parts), 'pet manifest missing parts')
  assert(isRecord(value.anchors), 'pet manifest missing anchors')
  assert(Array.isArray(value.motionTools), 'pet manifest missing motionTools')
  assert(isRecord(value.moodDefaults), 'pet manifest missing moodDefaults')
  return value as PetManifest
}

function validateMotionTools(manifest: PetManifest): void {
  const partIds = new Set(Object.keys(manifest.parts))
  const toolIds = new Set<string>()

  for (const tool of manifest.motionTools) {
    assert(isRecord(tool), 'motion tool must be an object')
    assert(typeof tool.id === 'string' && tool.id.trim(), 'motion tool missing id')
    assert(!toolIds.has(tool.id), `duplicate motion tool: ${tool.id}`)
    toolIds.add(tool.id)
    assert(
      typeof tool.prompt === 'string' && tool.prompt.trim(),
      `motion tool ${tool.id} missing prompt`
    )
    assert(
      typeof tool.durationMs === 'number' && tool.durationMs >= 600,
      `motion tool ${tool.id} invalid duration`
    )
    assert(
      Array.isArray(tool.targets) && tool.targets.length > 0,
      `motion tool ${tool.id} missing targets`
    )
    for (const param of Object.values(tool.params ?? {})) {
      assert(typeof param.default === 'number', `motion tool ${tool.id} param missing default`)
      assert(typeof param.min === 'number', `motion tool ${tool.id} param missing min`)
      assert(typeof param.max === 'number', `motion tool ${tool.id} param missing max`)
      assert(
        param.min <= param.default && param.default <= param.max,
        `motion tool ${tool.id} param default out of range`
      )
    }
    for (const target of tool.targets) {
      assert(
        Array.isArray(target.partIds) && target.partIds.length > 0,
        `motion tool ${tool.id} target missing part ids`
      )
      for (const partId of target.partIds) {
        assert(
          partId === '__root' || partIds.has(partId),
          `motion tool ${tool.id} references missing part ${partId}`
        )
      }
      assert(
        Array.isArray(target.keyframes) && target.keyframes.length >= 2,
        `motion tool ${tool.id} target missing keyframes`
      )
      for (const keyframe of target.keyframes) {
        assert(
          typeof keyframe.offset === 'number' && keyframe.offset >= 0 && keyframe.offset <= 1,
          `motion tool ${tool.id} invalid offset`
        )
        assertSafeTransform(keyframe.transform)
      }
    }
  }

  for (const mood of MOODS) {
    const fallback = manifest.moodDefaults[mood]
    assert(fallback?.skeleton_id === manifest.id, `mood fallback ${mood} has invalid skeleton id`)
    assert(
      Array.isArray(fallback.commands) && fallback.commands.length > 0,
      `mood fallback ${mood} missing commands`
    )
    for (const command of fallback.commands) {
      assert(
        toolIds.has(command.tool),
        `mood fallback ${mood} references missing tool ${command.tool}`
      )
    }
  }
}

export function buildMotionPromptText(pkg: PetRenderPackage): string {
  return pkg.motionTools
    .map((tool) => `${tool.id}: prompt=${tool.prompt}`)
    .join('\n')
    .slice(0, 1200)
}

export function loadPetPackage(root = process.cwd(), petId = getEnabledPetId()): PetRenderPackage {
  const dir = readablePetPackageDir(root, petId)
  const manifest = parseManifest(readJson(join(dir, 'manifest.json')))

  const parts: Record<string, PetPartDefinition> = {}
  for (const [id, part] of Object.entries(manifest.parts)) {
    assert(typeof part.path === 'string' && part.path.trim(), `part ${id} missing path`)
    assert(typeof part.label === 'string' && part.label.trim(), `part ${id} missing label`)
    assert(
      typeof part.transformOrigin === 'string' && part.transformOrigin.trim(),
      `part ${id} missing transformOrigin`
    )
    parts[id] = {
      id,
      label: part.label,
      transformOrigin: part.transformOrigin,
      svg: assertSafeGroupSvg(id, readFileSync(join(dir, part.path), 'utf8'))
    }
  }

  for (const id of manifest.renderOrder) {
    assert(Boolean(parts[id]), `renderOrder references missing part ${id}`)
  }

  const expressions: Partial<Record<MoodState, PetExpressionDefinition>> = {}
  for (const [mood, expression] of Object.entries(manifest.expressions ?? {})) {
    assert(MOODS.includes(mood as MoodState), `unsupported expression mood ${mood}`)
    assert(
      parts[expression.partId],
      `expression ${mood} references missing part ${expression.partId}`
    )
    expressions[mood as MoodState] = {
      partId: expression.partId,
      svg: assertSafeGroupSvg(expression.partId, readFileSync(join(dir, expression.path), 'utf8'))
    }
  }

  validateMotionTools(manifest)

  const pkg: PetRenderPackage = {
    id: manifest.id,
    title: manifest.title,
    viewBox: manifest.viewBox,
    ariaLabel: manifest.ariaLabel,
    parts,
    expressions,
    anchors: manifest.anchors,
    renderOrder: manifest.renderOrder,
    motionTools: manifest.motionTools,
    moodDefaults: manifest.moodDefaults,
    motionPromptText: ''
  }
  return { ...pkg, motionPromptText: buildMotionPromptText(pkg) }
}
