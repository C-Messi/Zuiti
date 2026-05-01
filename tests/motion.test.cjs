const assert = require('node:assert/strict')
const test = require('node:test')

const {
  DEFAULT_MOTION_BY_MOOD,
  DEFAULT_SKELETON_ID,
  normalizeMotionPlan
} = require('../src/main/motion/validate')
const { DEFAULT_CAT_SKELETON } = require('../src/renderer/src/pet/skeleton')

test('normalizeMotionPlan rejects unknown tools and clamps numeric params', () => {
  const plan = normalizeMotionPlan(
    {
      skeleton_id: 'default-cat',
      commands: [
        {
          tool: 'wave',
          durationMs: 99,
          params: {
            angleDeg: 999,
            offsetY: -999,
            repeats: 99,
            note: 'hello'
          }
        },
        {
          tool: 'teleport',
          durationMs: 1800,
          params: { distance: 999 }
        }
      ]
    },
    'happy'
  )

  assert.equal(plan.skeleton_id, 'default-cat')
  assert.equal(plan.commands.length, 1)
  assert.equal(plan.commands[0].tool, 'wave')
  assert.equal(plan.commands[0].durationMs, 600)
  assert.equal(plan.commands[0].params.angleDeg, 24)
  assert.equal(plan.commands[0].params.offsetY, -20)
  assert.equal(plan.commands[0].params.repeats, 4)
  assert.equal(plan.commands[0].params.note, 'hello')
})

test('normalizeMotionPlan falls back for invalid skeleton or empty commands', () => {
  const plan = normalizeMotionPlan(
    {
      skeleton_id: 'totally-different-pet',
      commands: []
    },
    'sad'
  )

  assert.deepEqual(plan, DEFAULT_MOTION_BY_MOOD.sad)
})

test('default cat skeleton exposes required anchors and motion tools', () => {
  assert.equal(DEFAULT_SKELETON_ID, 'default-cat')
  assert.equal(DEFAULT_CAT_SKELETON.id, 'default-cat')

  for (const part of ['body', 'head', 'left_arm', 'right_arm', 'left_foot', 'right_foot', 'tail', 'face']) {
    assert.ok(DEFAULT_CAT_SKELETON.parts[part], `missing part ${part}`)
  }

  for (const anchor of ['left_hand', 'right_hand', 'head_top', 'mouth', 'beside_left', 'beside_right']) {
    const point = DEFAULT_CAT_SKELETON.anchors[anchor]
    assert.equal(typeof point.x, 'number', `missing x for ${anchor}`)
    assert.equal(typeof point.y, 'number', `missing y for ${anchor}`)
  }

  for (const tool of ['idle_breathe', 'nod', 'shake_head', 'wave', 'hop', 'sing']) {
    assert.ok(DEFAULT_CAT_SKELETON.motionTools.includes(tool), `missing tool ${tool}`)
  }
})

test('normalizeMotionPlan accepts semantic skeleton part motion tools', () => {
  const plan = normalizeMotionPlan(
    {
      skeleton_id: 'default-cat',
      commands: [
        { tool: 'tilt_head', durationMs: 1200, params: { angleDeg: 14 } },
        { tool: 'perk_ears', durationMs: 900, params: { angleDeg: -9 } },
        { tool: 'swish_tail', durationMs: 1600, params: { angleDeg: 18, repeats: 3 } }
      ]
    },
    'excited'
  )

  assert.deepEqual(
    plan.commands.map((command) => command.tool),
    ['tilt_head', 'perk_ears', 'swish_tail']
  )
})
