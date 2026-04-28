const assert = require('node:assert/strict')
const test = require('node:test')

const {
  buildSkillIndexText,
  selectSkill,
  validateActionSvg
} = require('../src/main/skills/registry')

test('validateActionSvg accepts compact standalone animated svg', () => {
  const result = validateActionSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
      <g>
        <circle cx="128" cy="128" r="58" fill="#fff7ed" stroke="#111827" />
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -8;0 0" dur="1.2s" repeatCount="indefinite" />
      </g>
    </svg>
  `)

  assert.equal(result.ok, true)
})

test('validateActionSvg rejects unsafe svg features', () => {
  const bad = [
    '<svg viewBox="0 0 10 10"><script>alert(1)</script></svg>',
    '<svg viewBox="0 0 10 10"><image href="https://example.com/a.png" /></svg>',
    '<svg viewBox="0 0 10 10"><foreignObject /></svg>',
    '<svg viewBox="0 0 10 10"><circle onclick="alert(1)" /></svg>'
  ]

  for (const svg of bad) {
    assert.equal(validateActionSvg(svg).ok, false)
  }
})

test('selectSkill chooses enabled trigger match before creating a new skill', () => {
  const index = [
    {
      id: 'comfort-hug',
      title: 'Comfort Hug',
      triggers: ['抱抱', '安慰', 'hug'],
      moodAffinity: ['cuddling', 'sad'],
      durationMs: 2600,
      reviewScore: 91,
      enabled: true,
      description: 'leans forward with warm hug motion'
    }
  ]

  const selected = selectSkill(index, {
    actionIntent: '想抱抱用户一下',
    mood: 'cuddling'
  })

  assert.deepEqual(selected, { kind: 'existing', skillId: 'comfort-hug' })
})

test('buildSkillIndexText is compact and excludes disabled skills', () => {
  const text = buildSkillIndexText([
    {
      id: 'spark-jump',
      title: 'Spark Jump',
      triggers: ['开心', '庆祝'],
      moodAffinity: ['happy', 'excited'],
      durationMs: 1800,
      reviewScore: 88,
      enabled: true,
      description: 'small celebratory jump'
    },
    {
      id: 'draft',
      title: 'Draft',
      triggers: ['x'],
      moodAffinity: ['idle'],
      durationMs: 1000,
      reviewScore: 30,
      enabled: false,
      description: 'not ready'
    }
  ])

  assert.match(text, /spark-jump/)
  assert.doesNotMatch(text, /draft/)
  assert.ok(text.length < 220)
})
