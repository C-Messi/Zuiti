import { getContextManager } from './snapshot'
import { ensureMemoryFiles, readMemoryText, readSoulText } from '../memory/files'
import { loadPetPackage } from '../pet/package'
import { buildSkillIndexText, loadSkillIndex } from '../skills/registry'

let initialized = false
let runtimeRoot = process.cwd()

export function initializeRuntimeContext(root = process.cwd()): void {
  runtimeRoot = root
  ensureMemoryFiles(root)
  const petPackage = loadPetPackage(root)
  const manager = getContextManager()
  manager.setSoulText(readSoulText(root))
  manager.setMemoryText(readMemoryText(root))
  manager.setSkillIndexText(buildSkillIndexText(loadSkillIndex(root)))
  manager.setMotionPromptText(petPackage.motionPromptText)
  initialized = true
}

export function ensureRuntimeContext(root = runtimeRoot): void {
  if (!initialized) initializeRuntimeContext(root)
}

export function refreshRuntimeMemory(root = runtimeRoot): void {
  ensureRuntimeContext(root)
  getContextManager().setMemoryText(readMemoryText(root))
}

export function refreshRuntimeSkillIndex(root = runtimeRoot): void {
  ensureRuntimeContext(root)
  getContextManager().setSkillIndexText(buildSkillIndexText(loadSkillIndex(root)))
}

export function getRuntimeRoot(): string {
  return runtimeRoot
}
