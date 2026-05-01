const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const {
  DEFAULT_CAT_RESOURCE_PACKAGE,
  DEFAULT_CAT_RESOURCE_BASE_URL,
  loadSkeletonResourcePackage,
  registerSkeletonFromResources,
  renderRegisteredSkeletonMarkup
} = require('../src/renderer/src/pet/skeletonRegistry')

const root = process.cwd()

test('default cat resource package registers head ears and tail parts', () => {
  const registration = registerSkeletonFromResources(DEFAULT_CAT_RESOURCE_PACKAGE)

  assert.equal(registration.id, 'default-cat')
  for (const part of ['head', 'ears', 'tail']) {
    assert.ok(registration.parts[part], `missing resource part ${part}`)
    assert.match(registration.parts[part].svg, /^<g id="zuiti-part-/)
    assert.equal(typeof registration.parts[part].transformOrigin, 'string')
  }

  assert.deepEqual(registration.renderOrder.slice(0, 3), ['body', 'tail', 'left_foot'])
  assert.ok(registration.renderOrder.includes('ears'))
  assert.ok(registration.motionTools.includes('tilt_head'))
  assert.ok(registration.motionTools.includes('perk_ears'))
  assert.ok(registration.motionTools.includes('swish_tail'))
})

test('renderer falls back to legacy default cat markup when registration is invalid', () => {
  const invalidPackage = {
    ...DEFAULT_CAT_RESOURCE_PACKAGE,
    parts: {
      head: DEFAULT_CAT_RESOURCE_PACKAGE.parts.head
    }
  }

  const markup = renderRegisteredSkeletonMarkup(invalidPackage, 'happy')

  assert.match(markup, /^<svg /)
  assert.match(markup, /zuiti-part-head/)
  assert.match(markup, /zuiti-part-tail/)
})

test('default cat resources live under pet_resources with a skeleton standard document', async () => {
  const resourceRoot = path.join(root, 'pet_resources')
  const manifestPath = path.join(resourceRoot, 'skeletons/default-cat/manifest.json')
  const standardPath = path.join(resourceRoot, 'PET_SKELETON_STANDARD.md')

  assert.ok(fs.existsSync(manifestPath), 'missing pet_resources skeleton manifest')
  assert.ok(fs.existsSync(standardPath), 'missing pet skeleton standard document')
  assert.equal(DEFAULT_CAT_RESOURCE_BASE_URL, '/skeletons/default-cat')
  assert.ok(!fs.existsSync(path.join(root, 'src/renderer/src/pet/resources/default-cat/manifest.json')))

  const standard = fs.readFileSync(standardPath, 'utf8')
  for (const text of ['SVG', 'manifest', 'motionTools', 'prompt']) {
    assert.match(standard, new RegExp(text, 'i'))
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  assert.equal(manifest.parts.head.path, 'parts/head.svg')
  assert.equal(manifest.parts.ears.path, 'parts/ears.svg')
  assert.equal(manifest.parts.tail.path, 'parts/tail.svg')
})

test('loadSkeletonResourcePackage reads manifest and part svg resources from pet_resources', async () => {
  const baseDir = path.join(root, 'pet_resources/skeletons/default-cat')
  const pkg = await loadSkeletonResourcePackage(async (url) => {
    const relative = url.replace('/skeletons/default-cat/', '')
    return fs.readFileSync(path.join(baseDir, relative), 'utf8')
  })

  const registration = registerSkeletonFromResources(pkg)
  assert.equal(registration.id, 'default-cat')
  assert.match(registration.parts.head.svg, /zuiti-part-head/)
  assert.match(registration.parts.ears.svg, /zuiti-part-ears/)
  assert.match(registration.parts.tail.svg, /zuiti-part-tail/)
})
