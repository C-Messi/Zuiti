const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

test('renderer no longer exposes the whole pet_resources directory as public assets', () => {
  const config = fs.readFileSync(path.join(process.cwd(), 'electron.vite.config.ts'), 'utf8')

  assert.doesNotMatch(config, /publicDir:\s*resolve\(__dirname,\s*'pet_resources'\)/)
  assert.doesNotMatch(config, /publicDir:\s*resolve\(__dirname,\s*'resources'\)/)
  assert.ok(fs.existsSync(path.join(process.cwd(), 'resources/icon.png')))
})
