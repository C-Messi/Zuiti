const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')

const { makeMockProvider } = require('../src/main/brain/provider.ts')
const { resolveActionForReply } = require('../src/main/skills/orchestrator')

test('resolveActionForReply creates, reviews, saves, and returns a new svg action', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zuiti-skill-'))

  const action = await resolveActionForReply(
    {
      dialogue: '跳一下！',
      mood_tag: 'excited',
      action_intent: '开心庆祝，带星星跳一下'
    },
    makeMockProvider(),
    root
  )

  assert.ok(action)
  assert.equal(action.skill_id, 'mock-spark-jump')
  assert.match(action.svg, /<svg/)
  assert.ok(fs.existsSync(path.join(root, 'skills', 'mock-spark-jump', 'manifest.json')))
  assert.ok(fs.existsSync(path.join(root, 'skills', 'mock-spark-jump', 'skill.md')))
  assert.ok(fs.existsSync(path.join(root, 'skills', 'mock-spark-jump', 'action.svg')))
})
