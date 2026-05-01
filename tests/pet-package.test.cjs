const assert = require('node:assert/strict')
const path = require('node:path')
const test = require('node:test')

const {
  getEnabledPetId,
  petMemoryDir,
  petPackageDir,
  petSkillsDir
} = require('../src/main/pet/package')

test('pet package helpers use ENABLED_PET when pet id is not passed explicitly', () => {
  const previous = process.env.ENABLED_PET
  process.env.ENABLED_PET = 'winter-cat'
  try {
    const root = path.join(path.sep, 'tmp', 'zuiti-pets')

    assert.equal(getEnabledPetId(), 'winter-cat')
    assert.equal(petPackageDir(root), path.join(root, 'pet_resources', 'pets', 'winter-cat'))
    assert.equal(
      petMemoryDir(root),
      path.join(root, 'pet_resources', 'pets', 'winter-cat', 'memory')
    )
    assert.equal(
      petSkillsDir(root),
      path.join(root, 'pet_resources', 'pets', 'winter-cat', 'skills')
    )
  } finally {
    if (previous === undefined) delete process.env.ENABLED_PET
    else process.env.ENABLED_PET = previous
  }
})

test('pet package helpers fall back to default-cat when ENABLED_PET is empty', () => {
  const previous = process.env.ENABLED_PET
  process.env.ENABLED_PET = '   '
  try {
    assert.equal(getEnabledPetId(), 'default-cat')
  } finally {
    if (previous === undefined) delete process.env.ENABLED_PET
    else process.env.ENABLED_PET = previous
  }
})
