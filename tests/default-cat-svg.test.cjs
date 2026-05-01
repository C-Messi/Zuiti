const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const { loadPetPackage } = require('../src/main/pet/package')
const {
  loadPetRenderPackage,
  renderRegisteredSkeletonMarkup
} = require('../src/renderer/src/pet/skeletonRegistry')

test('default cat pet package renders standalone safe svg for every mood', () => {
  const pkg = loadPetRenderPackage(loadPetPackage(process.cwd()))
  const moods = [
    'idle',
    'happy',
    'angry_for_user',
    'cuddling',
    'hungry',
    'sleeping',
    'excited',
    'sad'
  ]

  for (const mood of moods) {
    const svg = renderRegisteredSkeletonMarkup(pkg, mood)
    assert.match(svg, /^<svg /)
    assert.match(svg, /viewBox="0 0 256 256"/)
    assert.match(svg, /奶牛猫|cow-cat|cat/i)
    assert.doesNotMatch(svg, /<script|foreignObject/i)
    assert.doesNotMatch(svg, /\b(?:href|src)\s*=|url\(\s*["']?https?:/i)
  }
})

test('pet package markup exposes stable transformable part groups', () => {
  const markup = renderRegisteredSkeletonMarkup(
    loadPetRenderPackage(loadPetPackage(process.cwd())),
    'excited'
  )

  for (const id of [
    'zuiti-part-body',
    'zuiti-part-head',
    'zuiti-part-ears',
    'zuiti-part-left-arm',
    'zuiti-part-right-arm',
    'zuiti-part-left-foot',
    'zuiti-part-right-foot',
    'zuiti-part-tail',
    'zuiti-part-face'
  ]) {
    assert.match(markup, new RegExp(`id="${id}"`))
  }
})

test('PetView no longer replaces pet with full action svgs', () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'src/renderer/src/components/PetView.tsx'),
    'utf8'
  )

  assert.doesNotMatch(source, /pet\/\$\{/)
  assert.doesNotMatch(source, /FRAMES/)
  assert.doesNotMatch(source, /activeSkillAction/)
  assert.doesNotMatch(source, /data:image\/svg\+xml;charset=utf-8,\$\{encodeURIComponent\(active/)
  assert.match(source, /activeActivity/)
  assert.match(source, /renderRegisteredSkeletonMarkup/)
  assert.match(source, /petPackageGet/)
})
