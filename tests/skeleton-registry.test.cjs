const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const {
  loadPetRenderPackage,
  registerSkeletonFromResources,
  renderRegisteredSkeletonMarkup
} = require('../src/renderer/src/pet/skeletonRegistry')
const { loadPetPackage } = require('../src/main/pet/package')

const root = process.cwd()

test('default cat pet package declares a complete resource-owned skeleton', () => {
  const pkg = loadPetPackage(root)
  const registration = registerSkeletonFromResources(loadPetRenderPackage(pkg))

  assert.equal(registration.id, 'default-cat')
  for (const part of [
    'body',
    'tail',
    'left_foot',
    'right_foot',
    'left_arm',
    'right_arm',
    'ears',
    'head',
    'face'
  ]) {
    assert.ok(registration.parts[part], `missing resource part ${part}`)
    assert.match(registration.parts[part].svg, /^<g id="zuiti-part-/)
    assert.equal(typeof registration.parts[part].transformOrigin, 'string')
  }

  assert.deepEqual(registration.renderOrder.slice(0, 3), ['body', 'tail', 'left_foot'])
  for (const partId of registration.renderOrder) {
    assert.ok(registration.parts[partId], `renderOrder references missing part ${partId}`)
  }
  assert.ok(registration.motionTools.some((tool) => tool.id === 'tilt_head'))
  assert.ok(registration.motionTools.some((tool) => tool.id === 'perk_ears'))
  assert.ok(registration.motionTools.some((tool) => tool.id === 'swish_tail'))
})

test('renderer falls back to a minimal safe shell when registration is invalid', () => {
  const pkg = loadPetRenderPackage(loadPetPackage(root))
  const invalidPackage = {
    ...pkg,
    parts: {
      head: pkg.parts.head
    }
  }

  const markup = renderRegisteredSkeletonMarkup(invalidPackage, 'happy')

  assert.match(markup, /^<svg /)
  assert.match(markup, /zuiti-part-body/)
  assert.doesNotMatch(markup, /zuiti-part-head/)
})

test('default cat resources live under pet_resources with a skeleton standard document', async () => {
  const resourceRoot = path.join(root, 'pet_resources')
  const manifestPath = path.join(resourceRoot, 'pets/default-cat/manifest.json')
  const standardPath = path.join(resourceRoot, 'PET_SKELETON_STANDARD.md')

  assert.ok(fs.existsSync(manifestPath), 'missing pet_resources skeleton manifest')
  assert.ok(fs.existsSync(standardPath), 'missing pet skeleton standard document')
  assert.ok(!fs.existsSync(path.join(root, 'pet_resources/skeletons/default-cat/manifest.json')))
  assert.ok(
    !fs.existsSync(path.join(root, 'src/renderer/src/pet/resources/default-cat/manifest.json'))
  )

  const standard = fs.readFileSync(standardPath, 'utf8')
  for (const text of ['SVG', 'manifest', 'motionTools', 'prompt', 'memory', 'skills']) {
    assert.match(standard, new RegExp(text, 'i'))
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  assert.equal(manifest.parts.head.path, 'skeleton/parts/head.svg')
  assert.equal(manifest.parts.body.path, 'skeleton/parts/body.svg')
  assert.equal(manifest.parts.face.path, 'skeleton/parts/face-idle.svg')
  assert.equal(manifest.expressions.happy.partId, 'face')
})

test('loadPetPackage reads all part and expression svg resources from pet_resources', () => {
  const pkg = loadPetRenderPackage(loadPetPackage(root))

  const registration = registerSkeletonFromResources(pkg)
  assert.equal(registration.id, 'default-cat')
  assert.match(registration.parts.body.svg, /zuiti-part-body/)
  assert.match(registration.parts.head.svg, /zuiti-part-head/)
  assert.match(registration.parts.ears.svg, /zuiti-part-ears/)
  assert.match(registration.parts.tail.svg, /zuiti-part-tail/)
  assert.match(registration.expressions.happy.svg, /zuiti-part-face/)
  assert.match(renderRegisteredSkeletonMarkup(pkg, 'happy'), /Q128 165 145 141/)
})
