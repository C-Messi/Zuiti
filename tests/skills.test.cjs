const assert = require('node:assert/strict')
const test = require('node:test')

const {
  buildSkillIndexText,
  selectSkill,
  validatePropSvg,
  writeSkillPackage,
  loadSkillIndex,
  readSkillProp
} = require('../src/main/skills/registry')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

test('validatePropSvg accepts compact standalone prop svg', () => {
  const result = validatePropSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
      <g>
        <rect x="105" y="72" width="46" height="118" rx="18" fill="#111827" />
        <circle cx="128" cy="60" r="28" fill="#f472b6" stroke="#111827" />
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -8;0 0" dur="1.2s" repeatCount="indefinite" />
      </g>
    </svg>
  `)

  assert.equal(result.ok, true)
})

test('validatePropSvg rejects unsafe svg features', () => {
  const bad = [
    '<svg viewBox="0 0 10 10"><script>alert(1)</script></svg>',
    '<svg viewBox="0 0 10 10"><image href="https://example.com/a.png" /></svg>',
    '<svg viewBox="0 0 10 10"><foreignObject /></svg>',
    '<svg viewBox="0 0 10 10"><circle onclick="alert(1)" /></svg>'
  ]

  for (const svg of bad) {
    assert.equal(validatePropSvg(svg).ok, false)
  }
})

test('selectSkill chooses enabled prop trigger match before creating a new skill', () => {
  const index = [
    {
      kind: 'prop',
      id: 'comfort-hug',
      title: 'Comfort Hug',
      triggers: ['抱抱', '安慰', 'hug'],
      moodAffinity: ['cuddling', 'sad'],
      durationMs: 2600,
      reviewScore: 91,
      enabled: true,
      anchor: 'right_hand',
      description: 'leans forward with warm hug motion'
    }
  ]

  const selected = selectSkill(index, {
    propIntent: '想抱抱用户一下',
    mood: 'cuddling'
  })

  assert.deepEqual(selected, { kind: 'existing', skillId: 'comfort-hug' })
})

test('buildSkillIndexText is compact and excludes disabled skills', () => {
  const text = buildSkillIndexText([
    {
      kind: 'prop',
      id: 'spark-jump',
      title: 'Spark Jump',
      triggers: ['开心', '庆祝'],
      moodAffinity: ['happy', 'excited'],
      durationMs: 1800,
      reviewScore: 88,
      enabled: true,
      anchor: 'head_top',
      description: 'small celebratory jump'
    },
    {
      kind: 'prop',
      id: 'draft',
      title: 'Draft',
      triggers: ['x'],
      moodAffinity: ['idle'],
      durationMs: 1000,
      reviewScore: 30,
      enabled: false,
      anchor: 'beside_left',
      description: 'not ready'
    }
  ])

  assert.match(text, /spark-jump/)
  assert.match(text, /anchor=head_top/)
  assert.doesNotMatch(text, /draft/)
  assert.ok(text.length < 220)
})

test('loadSkillIndex ignores legacy action.svg packages and loads prop packages', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zuiti-prop-registry-'))
  const skillsRoot = path.join(root, 'pet_resources', 'pets', 'default-cat', 'skills')
  const legacyDir = path.join(skillsRoot, 'legacy-wave')
  const propDir = path.join(skillsRoot, 'microphone')
  fs.mkdirSync(legacyDir, { recursive: true })
  fs.mkdirSync(propDir, { recursive: true })

  fs.writeFileSync(
    path.join(legacyDir, 'manifest.json'),
    JSON.stringify({
      id: 'legacy-wave',
      title: 'Legacy Wave',
      triggers: ['挥手'],
      moodAffinity: ['happy'],
      durationMs: 1000,
      reviewScore: 90,
      enabled: true,
      description: 'old full pet action'
    })
  )
  fs.writeFileSync(path.join(legacyDir, 'action.svg'), '<svg viewBox="0 0 10 10"></svg>')

  writeSkillPackage(
    {
      kind: 'prop',
      id: 'microphone',
      title: 'Microphone',
      triggers: ['唱歌'],
      moodAffinity: ['excited'],
      durationMs: 1800,
      reviewScore: 92,
      enabled: true,
      anchor: 'right_hand',
      description: 'handheld singing microphone',
      createdAt: '2026-05-01T00:00:00.000Z'
    },
    '- 触发：唱歌\n- 道具：麦克风',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect x="108" y="78" width="40" height="120" rx="18" fill="#111827"/></svg>',
    root
  )

  const index = loadSkillIndex(root)
  assert.equal(index.length, 1)
  assert.equal(index[0].id, 'microphone')
  assert.equal(index[0].anchor, 'right_hand')

  const prop = readSkillProp('microphone', root)
  assert.ok(prop)
  assert.equal(prop.anchor, 'right_hand')
  assert.match(prop.svg, /<svg/)
  assert.ok(fs.existsSync(path.join(skillsRoot, 'microphone', 'manifest.json')))
  assert.equal(fs.existsSync(path.join(root, 'skills', 'microphone', 'manifest.json')), false)
})
