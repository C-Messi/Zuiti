import type {
  MoodState,
  MotionToolId,
  PetMotionCommand,
  PetMotionPlan,
  SkeletonId
} from '../../shared/types'

export const DEFAULT_SKELETON_ID: SkeletonId = 'default-cat'

export const MOTION_TOOLS: MotionToolId[] = [
  'idle_breathe',
  'nod',
  'shake_head',
  'wave',
  'hop',
  'sing'
]

const MIN_DURATION_MS = 600
const MAX_DURATION_MS = 6000
const MAX_COMMANDS = 3

const PARAM_LIMITS: Record<string, { min: number; max: number }> = {
  angleDeg: { min: -24, max: 24 },
  offsetX: { min: -24, max: 24 },
  offsetY: { min: -20, max: 20 },
  scale: { min: 0.92, max: 1.08 },
  repeats: { min: 1, max: 4 },
  intensity: { min: 0, max: 1 }
}

export const DEFAULT_MOTION_BY_MOOD: Record<MoodState, PetMotionPlan> = {
  idle: {
    skeleton_id: DEFAULT_SKELETON_ID,
    commands: [{ tool: 'idle_breathe', durationMs: 1800, params: { intensity: 0.35 } }]
  },
  happy: {
    skeleton_id: DEFAULT_SKELETON_ID,
    commands: [{ tool: 'nod', durationMs: 1300, params: { angleDeg: 9, repeats: 2 } }]
  },
  angry_for_user: {
    skeleton_id: DEFAULT_SKELETON_ID,
    commands: [{ tool: 'shake_head', durationMs: 1300, params: { angleDeg: 12, repeats: 2 } }]
  },
  cuddling: {
    skeleton_id: DEFAULT_SKELETON_ID,
    commands: [{ tool: 'idle_breathe', durationMs: 2200, params: { intensity: 0.55 } }]
  },
  hungry: {
    skeleton_id: DEFAULT_SKELETON_ID,
    commands: [{ tool: 'nod', durationMs: 1200, params: { angleDeg: 7, repeats: 1 } }]
  },
  sleeping: {
    skeleton_id: DEFAULT_SKELETON_ID,
    commands: [{ tool: 'idle_breathe', durationMs: 2600, params: { intensity: 0.2 } }]
  },
  excited: {
    skeleton_id: DEFAULT_SKELETON_ID,
    commands: [{ tool: 'hop', durationMs: 1100, params: { offsetY: -16, repeats: 2 } }]
  },
  sad: {
    skeleton_id: DEFAULT_SKELETON_ID,
    commands: [{ tool: 'nod', durationMs: 1800, params: { angleDeg: 5, repeats: 1 } }]
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function normalizeParams(value: unknown): Record<string, number | string> | undefined {
  if (!isRecord(value)) return undefined
  const params: Record<string, number | string> = {}

  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      const limit = PARAM_LIMITS[key]
      params[key] = limit ? clamp(raw, limit.min, limit.max) : raw
    } else if (typeof raw === 'string' && raw.trim()) {
      params[key] = raw.trim().slice(0, 40)
    }
  }

  return Object.keys(params).length > 0 ? params : undefined
}

function normalizeCommand(raw: unknown): PetMotionCommand | null {
  if (!isRecord(raw)) return null
  const tool = raw.tool
  if (typeof tool !== 'string' || !MOTION_TOOLS.includes(tool as MotionToolId)) return null

  const command: PetMotionCommand = { tool: tool as MotionToolId }
  if (typeof raw.durationMs === 'number' && Number.isFinite(raw.durationMs)) {
    command.durationMs = clamp(Math.round(raw.durationMs), MIN_DURATION_MS, MAX_DURATION_MS)
  }
  const params = normalizeParams(raw.params)
  if (params) command.params = params
  return command
}

export function normalizeMotionPlan(rawPlan: unknown, mood: MoodState): PetMotionPlan {
  if (!isRecord(rawPlan) || rawPlan.skeleton_id !== DEFAULT_SKELETON_ID) {
    return DEFAULT_MOTION_BY_MOOD[mood]
  }
  if (!Array.isArray(rawPlan.commands)) return DEFAULT_MOTION_BY_MOOD[mood]

  const commands = rawPlan.commands
    .map((command) => normalizeCommand(command))
    .filter((command): command is PetMotionCommand => Boolean(command))
    .slice(0, MAX_COMMANDS)

  if (commands.length === 0) return DEFAULT_MOTION_BY_MOOD[mood]
  return {
    skeleton_id: DEFAULT_SKELETON_ID,
    commands
  }
}
