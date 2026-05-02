const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')

const { authorSkillDraft } = require('../src/main/skills/author')

function copyDefaultPetAs(root, petId) {
  const source = path.join(process.cwd(), 'pet_resources', 'pets', 'default-cat')
  const target = path.join(root, 'pet_resources', 'pets', petId)
  fs.cpSync(source, target, { recursive: true })
  return target
}

test('authorSkillDraft injects anchors from the enabled pet manifest', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zuiti-skill-author-'))
  const petId = 'custom-anchor-cat'
  const petDir = copyDefaultPetAs(root, petId)
  const manifestPath = path.join(petDir, 'manifest.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  manifest.anchors = {
    tail_tip: { x: 220, y: 180 }
  }
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

  const previous = process.env.ENABLED_PET
  process.env.ENABLED_PET = petId
  try {
    let capturedSystem = ''
    const provider = {
      async chatJSON() {
        throw new Error('chatJSON should not be called')
      },
      async visionJSON() {
        throw new Error('visionJSON should not be called')
      },
      async completeText(system) {
        capturedSystem = system
        assert.match(system, /tail_tip/)
        return JSON.stringify({
          id: 'tail-ribbon',
          title: 'Tail Ribbon',
          triggers: ['蝴蝶结'],
          moodAffinity: ['happy'],
          anchor: 'tail_tip',
          durationMs: 1800,
          description: '挂在尾巴尖的小蝴蝶结',
          skillMarkdown: '- 触发：蝴蝶结\n- 锚点：tail_tip',
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M80 96 L128 128 L80 160 Z" fill="#f472b6"/><path d="M176 96 L128 128 L176 160 Z" fill="#fb7185"/></svg>'
        })
      }
    }

    const draft = await authorSkillDraft(provider, '给尾巴戴蝴蝶结', 'happy', '（暂无）', root)

    assert.equal(draft.anchor, 'tail_tip')
    assert.match(capturedSystem, /tail_tip/)
  } finally {
    if (previous === undefined) delete process.env.ENABLED_PET
    else process.env.ENABLED_PET = previous
  }
})
