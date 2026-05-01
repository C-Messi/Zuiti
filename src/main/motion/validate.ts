import type {
  MoodState,
  MotionParamDefinition,
  MotionToolDefinition,
  PetMotionCommand,
  PetMotionPlan,
  PetRenderPackage
} from '../../shared/types'
import {
  loadPetPackage,
  buildMotionPromptText as buildPackageMotionPromptText
} from '../pet/package'

const MIN_DURATION_MS = 600
const MAX_DURATION_MS = 6000
const MAX_COMMANDS = 3

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function toolById(pkg: PetRenderPackage, id: string): MotionToolDefinition | undefined {
  return pkg.motionTools.find((tool) => tool.id === id)
}

function normalizeNumericParam(raw: unknown, limit: MotionParamDefinition): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return clamp(raw, limit.min, limit.max)
  }
  return limit.default
}

function normalizeParams(
  value: unknown,
  tool: MotionToolDefinition
): Record<string, number | string> | undefined {
  const rawParams = isRecord(value) ? value : {}
  const params: Record<string, number | string> = {}

  for (const [key, limit] of Object.entries(tool.params ?? {})) {
    params[key] = normalizeNumericParam(rawParams[key], limit)
  }

  for (const [key, raw] of Object.entries(rawParams)) {
    if (key in (tool.params ?? {})) continue
    if (typeof raw === 'string' && raw.trim()) params[key] = raw.trim().slice(0, 40)
  }

  return Object.keys(params).length > 0 ? params : undefined
}

function normalizeCommand(raw: unknown, pkg: PetRenderPackage): PetMotionCommand | null {
  if (!isRecord(raw)) return null
  const toolId = raw.tool
  if (typeof toolId !== 'string') return null
  const tool = toolById(pkg, toolId)
  if (!tool) return null

  const command: PetMotionCommand = { tool: tool.id }
  if (typeof raw.durationMs === 'number' && Number.isFinite(raw.durationMs)) {
    command.durationMs = clamp(Math.round(raw.durationMs), MIN_DURATION_MS, MAX_DURATION_MS)
  } else {
    command.durationMs = tool.durationMs
  }
  const params = normalizeParams(raw.params, tool)
  if (params) command.params = params
  return command
}

export function loadDefaultMotionByMood(pkg = loadPetPackage()): Record<MoodState, PetMotionPlan> {
  return pkg.moodDefaults
}

export function buildMotionPromptText(pkg = loadPetPackage()): string {
  return buildPackageMotionPromptText(pkg)
}

export function normalizeMotionPlan(
  rawPlan: unknown,
  mood: MoodState,
  pkg = loadPetPackage()
): PetMotionPlan {
  const fallback = pkg.moodDefaults[mood]
  if (!isRecord(rawPlan) || rawPlan.skeleton_id !== pkg.id) {
    return fallback
  }
  if (!Array.isArray(rawPlan.commands)) return fallback

  const commands = rawPlan.commands
    .map((command) => normalizeCommand(command, pkg))
    .filter((command): command is PetMotionCommand => Boolean(command))
    .slice(0, MAX_COMMANDS)

  if (commands.length === 0) return fallback
  return {
    skeleton_id: pkg.id,
    commands
  }
}
