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

test('auxiliary UI is hidden until the pet is clicked', () => {
  const appSource = fs.readFileSync(path.join(process.cwd(), 'src/renderer/src/App.tsx'), 'utf8')

  assert.match(appSource, /useState\(false\)/)
  assert.match(appSource, /setAuxiliaryVisible\(\(visible\) => !visible\)/)
  assert.match(appSource, /auxiliaryVisible && \(/)
  assert.match(appSource, /<BubbleLayer \/>/)
  assert.match(appSource, /<SettingPanel \/>/)
})

test('pet body supports drag without treating drag as a click', () => {
  const appSource = fs.readFileSync(path.join(process.cwd(), 'src/renderer/src/App.tsx'), 'utf8')
  const preloadSource = fs.readFileSync(path.join(process.cwd(), 'src/preload/index.ts'), 'utf8')
  const ipcSource = fs.readFileSync(path.join(process.cwd(), 'src/main/ipc.ts'), 'utf8')

  assert.match(appSource, /CLICK_DRAG_THRESHOLD_PX/)
  assert.match(appSource, /windowDragStart/)
  assert.match(appSource, /windowDragMove/)
  assert.match(appSource, /if \(!dragStart\.dragging && clickEnabled\) toggleAuxiliary\(\)/)
  assert.match(preloadSource, /windowDragStart/)
  assert.match(preloadSource, /windowDragMove/)
  assert.match(preloadSource, /windowDragEnd/)
  assert.match(ipcSource, /WINDOW_DRAG_START/)
  assert.match(ipcSource, /WINDOW_DRAG_MOVE/)
  assert.match(ipcSource, /setPosition/)
})
