const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')

const {
  MEMORY_BUDGET_CHARS,
  compactMemoryText,
  ensureMemoryFiles,
  readMemoryText,
  writeMemoryText
} = require('../src/main/memory/files')

test('ensureMemoryFiles creates only SOUL.md and memory.md in memory directory', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zuiti-memory-'))

  ensureMemoryFiles(root)

  const names = fs.readdirSync(path.join(root, 'memory')).sort()
  assert.deepEqual(names, ['SOUL.md', 'memory.md'])
})

test('writeMemoryText keeps long-term memory inside compact budget', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zuiti-memory-'))
  const noisy = Array.from(
    { length: 120 },
    (_, i) => `第${i}条：用户喜欢被温柔提醒但讨厌重复喂 token。`
  ).join('\n')

  writeMemoryText(noisy, root)
  const saved = readMemoryText(root)

  assert.ok(saved.length <= MEMORY_BUDGET_CHARS)
  assert.match(saved, /用户喜欢/)
})

test('compactMemoryText removes blank noise and preserves concise bullets', () => {
  const compact = compactMemoryText('\n\n- 用户偏好：短句。\n\n\n- 禁忌：不要重复 token 梗。\n')

  assert.equal(compact, '- 用户偏好：短句。\n- 禁忌：不要重复 token 梗。')
})
