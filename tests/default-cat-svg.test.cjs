const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const {
  buildDefaultCatSvg,
  buildDefaultCatSvgDataUrl,
  buildDefaultCatSvgMarkup
} = require('../src/renderer/src/pet/defaultCatSvg')

test('buildDefaultCatSvg draws a standalone safe cat svg for every mood', () => {
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
    const svg = buildDefaultCatSvg(mood)
    assert.match(svg, /^<svg /)
    assert.match(svg, /viewBox="0 0 256 256"/)
    assert.match(svg, /奶牛猫|cow-cat|cat/i)
    assert.doesNotMatch(svg, /<script|foreignObject/i)
    assert.doesNotMatch(svg, /\b(?:href|src)\s*=|url\(\s*["']?https?:/i)
  }
})

test('buildDefaultCatSvgDataUrl returns inline svg data url', () => {
  const url = buildDefaultCatSvgDataUrl('happy')

  assert.match(url, /^data:image\/svg\+xml;charset=utf-8,/)
  assert.match(decodeURIComponent(url), /<svg /)
})

test('buildDefaultCatSvgMarkup exposes stable transformable part groups', () => {
  const markup = buildDefaultCatSvgMarkup('excited')

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
  assert.match(source, /loadDefaultCatSkeletonResourcePackage/)
})
