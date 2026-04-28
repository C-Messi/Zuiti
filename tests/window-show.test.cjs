const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

test('main window has load-complete fallback for transparent window visibility', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/main/index.ts'), 'utf8')

  assert.match(source, /mainWindow\.show\(\)/)
  assert.match(source, /mainWindow\.moveTop\(\)/)
  assert.match(source, /did-finish-load/)
  assert.match(source, /setTimeout\(\(\) => \{/)
  assert.match(source, /showMainWindowOnce\(\)\n  \}, 1500\)/)
})

test('main window position uses work area origin as well as size', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/main/index.ts'), 'utf8')

  assert.match(source, /const \{ workArea \} = screen\.getPrimaryDisplay\(\)/)
  assert.match(source, /x: workArea\.x \+ workArea\.width - winW - 24/)
  assert.match(source, /y: workArea\.y \+ workArea\.height - winH - 24/)
})
