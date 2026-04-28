const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

test('electron vite dev server binds IPv4 localhost instead of ::1', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'electron.vite.config.ts'), 'utf8')

  assert.match(source, /host:\s*'127\.0\.0\.1'/)
})

test('stale generated electron vite js config does not shadow ts config', () => {
  assert.equal(fs.existsSync(path.join(process.cwd(), 'electron.vite.config.js')), false)
  assert.equal(fs.existsSync(path.join(process.cwd(), 'electron.vite.config.d.ts')), false)
})

test('compiled main/preload js artifacts do not shadow ts source files', () => {
  const allowed = new Set([path.join('src', 'renderer', 'src', 'env.d.ts')])
  const srcDir = path.join(process.cwd(), 'src')
  const staleArtifacts = []

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
        continue
      }

      const rel = path.relative(process.cwd(), fullPath)
      const isGeneratedSourceArtifact = rel.endsWith('.js') || rel.endsWith('.d.ts')
      if (isGeneratedSourceArtifact && !allowed.has(rel)) staleArtifacts.push(rel)
    }
  }

  walk(srcDir)
  assert.deepEqual(staleArtifacts, [])
})
