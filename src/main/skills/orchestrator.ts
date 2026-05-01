import type { LLMProvider } from '../brain/provider'
import { getContextManager } from '../context/snapshot'
import { getRuntimeRoot, refreshRuntimeSkillIndex } from '../context/runtime'
import { normalizeMotionPlan } from '../motion/validate'
import { loadPetPackage } from '../pet/package'
import type { BrainResponse, PetActivity, PetProp } from '../../shared/types'
import { authorSkillDraft, draftToManifest } from './author'
import { reviewSkillDraft } from './review'
import { loadSkillIndex, readSkillProp, selectSkill, writeSkillPackage } from './registry'
import { safeWarn } from '../logger'

const MIN_REVIEW_SCORE = 80
const MAX_AUTHOR_ATTEMPTS = 3

async function createReviewedSkill(
  provider: LLMProvider,
  propIntent: string,
  reply: BrainResponse,
  root: string
): Promise<PetProp | null> {
  const skillIndexText = getContextManager().getSnapshot().skillIndexText

  for (let attempt = 0; attempt < MAX_AUTHOR_ATTEMPTS; attempt += 1) {
    try {
      const draft = await authorSkillDraft(provider, propIntent, reply.mood_tag, skillIndexText)
      const review = await reviewSkillDraft(provider, draft, propIntent)
      if (review.score < MIN_REVIEW_SCORE) continue
      writeSkillPackage(draftToManifest(draft, review.score), draft.skillMarkdown, draft.svg, root)
      refreshRuntimeSkillIndex(root)
      return readSkillProp(draft.id, root)
    } catch (err) {
      safeWarn('[skills] author attempt failed:', err)
    }
  }

  return null
}

export async function resolveActivityForReply(
  reply: BrainResponse,
  provider: LLMProvider,
  root = getRuntimeRoot()
): Promise<PetActivity> {
  const petPackage = loadPetPackage(root)
  const motionPlan = normalizeMotionPlan(reply.motion_plan, reply.mood_tag, petPackage)
  const index = loadSkillIndex(root)
  const selection = selectSkill(index, {
    requestedSkillId: reply.prop_skill_id,
    propIntent: reply.prop_intent,
    mood: reply.mood_tag
  })

  if (selection.kind === 'existing') {
    const prop = readSkillProp(selection.skillId, root)
    return prop ? { motionPlan, prop } : { motionPlan }
  }
  if (selection.kind === 'create') {
    const prop = await createReviewedSkill(provider, selection.propIntent, reply, root)
    return prop ? { motionPlan, prop } : { motionPlan }
  }
  return { motionPlan }
}
