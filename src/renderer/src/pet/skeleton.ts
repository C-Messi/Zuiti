import type { MotionToolId, PetAnchorId, SkeletonId } from '../../../shared/types'

export type SkeletonPoint = {
  x: number
  y: number
}

export type PetSkeletonDefinition = {
  id: SkeletonId
  parts: Record<string, { id: string; label: string }>
  anchors: Record<PetAnchorId, SkeletonPoint>
  motionTools: MotionToolId[]
}

export const DEFAULT_CAT_SKELETON: PetSkeletonDefinition = {
  id: 'default-cat',
  parts: {
    body: { id: 'body', label: 'Body' },
    head: { id: 'head', label: 'Head' },
    left_arm: { id: 'left_arm', label: 'Left arm' },
    right_arm: { id: 'right_arm', label: 'Right arm' },
    left_foot: { id: 'left_foot', label: 'Left foot' },
    right_foot: { id: 'right_foot', label: 'Right foot' },
    ears: { id: 'ears', label: 'Ears' },
    tail: { id: 'tail', label: 'Tail' },
    face: { id: 'face', label: 'Face' }
  },
  anchors: {
    left_hand: { x: 58, y: 154 },
    right_hand: { x: 198, y: 154 },
    head_top: { x: 128, y: 44 },
    mouth: { x: 128, y: 146 },
    beside_left: { x: 42, y: 130 },
    beside_right: { x: 214, y: 130 }
  },
  motionTools: [
    'idle_breathe',
    'nod',
    'shake_head',
    'wave',
    'hop',
    'sing',
    'tilt_head',
    'perk_ears',
    'swish_tail'
  ]
}
