const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

test('settings panel is layered above the pet', () => {
  const appSource = fs.readFileSync(path.join(process.cwd(), 'src/renderer/src/App.tsx'), 'utf8')
  const settingsSource = fs.readFileSync(
    path.join(process.cwd(), 'src/renderer/src/components/SettingPanel.tsx'),
    'utf8'
  )

  assert.match(appSource, /className="relative z-10 pb-2"/)
  assert.match(settingsSource, /className="absolute bottom-3 left-3 z-40"/)
  assert.match(settingsSource, /bg-white\/95/)
})

test('bubble layer stays above the pet without covering settings controls', () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'src/renderer/src/components/BubbleLayer.tsx'),
    'utf8'
  )

  assert.match(source, /className="absolute top-3 left-3 right-3 z-30/)
})
