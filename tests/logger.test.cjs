const assert = require('node:assert/strict')
const test = require('node:test')

const { writeSafeLog } = require('../src/main/logger')

test('writeSafeLog does not throw when stderr pipe is closed', () => {
  assert.doesNotThrow(() => {
    writeSafeLog(() => {
      const err = new Error('write EPIPE')
      err.code = 'EPIPE'
      throw err
    }, ['[vision] capture failed:', new Error('Failed to get sources')])
  })
})

test('writeSafeLog stringifies errors without throwing', () => {
  const lines = []

  writeSafeLog((line) => lines.push(line), ['prefix', new Error('boom')])

  assert.match(lines.join(''), /prefix Error: boom/)
})
