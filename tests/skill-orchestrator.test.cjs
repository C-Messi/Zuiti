const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')

const { makeMockProvider } = require('../src/main/brain/provider.ts')
const { resolveActivityForReply } = require('../src/main/skills/orchestrator')

test('resolveActivityForReply creates singing motion with anchored microphone prop', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zuiti-prop-skill-'))

  const activity = await resolveActivityForReply(
    {
      dialogue: '开唱！',
      mood_tag: 'excited',
      motion_plan: {
        skeleton_id: 'default-cat',
        commands: [
          {
            tool: 'sing',
            durationMs: 1800,
            params: {
              angleDeg: 9,
              offsetY: -5
            }
          }
        ]
      },
      prop_intent: '主人让宠物唱歌，需要一个手持麦克风道具'
    },
    makeMockProvider(),
    root
  )

  assert.ok(activity)
  assert.equal(activity.motionPlan.commands[0].tool, 'sing')
  assert.ok(activity.prop)
  assert.equal(activity.prop.skill_id, 'mock-microphone')
  assert.equal(activity.prop.anchor, 'right_hand')
  assert.match(activity.prop.svg, /<svg/)
  assert.ok(fs.existsSync(path.join(root, 'skills', 'mock-microphone', 'manifest.json')))
  assert.ok(fs.existsSync(path.join(root, 'skills', 'mock-microphone', 'skill.md')))
  assert.ok(fs.existsSync(path.join(root, 'skills', 'mock-microphone', 'prop.svg')))
  assert.equal(fs.existsSync(path.join(root, 'skills', 'mock-microphone', 'action.svg')), false)
})
