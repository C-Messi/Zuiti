const assert = require('node:assert/strict')
const test = require('node:test')

const { ContextSnapshotManager } = require('../src/main/context/snapshot')

test('ContextSnapshotManager keeps a bounded sliding chat window', () => {
  const manager = new ContextSnapshotManager({
    maxChatTurns: 3,
    soulText: 'SOUL',
    memoryText: 'MEM',
    skillIndexText: 'SKILLS'
  })

  manager.appendChatTurn({ role: 'user', text: 'one', ts: 1 })
  manager.appendChatTurn({ role: 'pet', text: 'two', ts: 2 })
  manager.appendChatTurn({ role: 'user', text: 'three', ts: 3 })
  manager.appendChatTurn({ role: 'pet', text: 'four', ts: 4 })

  assert.deepEqual(
    manager.getSnapshot().chatWindow.map((turn) => turn.text),
    ['two', 'three', 'four']
  )
})

test('ContextSnapshotManager exposes latest completed vision summary without waiting', () => {
  const manager = new ContextSnapshotManager({
    maxChatTurns: 6,
    soulText: 'SOUL',
    memoryText: 'MEM',
    skillIndexText: 'SKILLS'
  })

  manager.setVisionSummary({
    ts: 10,
    app: 'Code',
    scene: 'coding',
    emotion_signal: 'stressed',
    summary_for_pet: '用户在修 TS 报错',
    privacy_filtered: false
  })

  const snapshot = manager.getSnapshot()

  assert.equal(snapshot.visionSummary?.summary_for_pet, '用户在修 TS 报错')
  assert.equal(snapshot.memoryText, 'MEM')
})
