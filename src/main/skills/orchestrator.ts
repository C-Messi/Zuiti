import type { LLMProvider } from '../brain/provider'
import { getContextManager } from '../context/snapshot'
import { getRuntimeRoot, refreshRuntimeSkillIndex } from '../context/runtime'
import type { BrainResponse, PetAction } from '../../shared/types'
import { authorSkillDraft, draftToManifest } from './author'
import { reviewSkillDraft } from './review'
import { loadSkillIndex, readSkillAction, selectSkill, writeSkillPackage } from './registry'
import { safeWarn } from '../logger'

const MIN_REVIEW_SCORE = 80
const MAX_AUTHOR_ATTEMPTS = 3

async function createReviewedSkill(
  provider: LLMProvider,
  actionIntent: string,
  reply: BrainResponse,
  root: string
): Promise<PetAction | null> {
  const skillIndexText = getContextManager().getSnapshot().skillIndexText

  for (let attempt = 0; attempt < MAX_AUTHOR_ATTEMPTS; attempt += 1) {
    try {
      const draft = await authorSkillDraft(provider, actionIntent, reply.mood_tag, skillIndexText)
      const review = await reviewSkillDraft(provider, draft, actionIntent)
      if (review.score < MIN_REVIEW_SCORE) continue
      writeSkillPackage(draftToManifest(draft, review.score), draft.skillMarkdown, draft.svg, root)
      refreshRuntimeSkillIndex(root)
      return readSkillAction(draft.id, root)
    } catch (err) {
      safeWarn('[skills] author attempt failed:', err)
    }
  }

  return null
}

export async function resolveActionForReply(
  reply: BrainResponse,
  provider: LLMProvider,
  root = getRuntimeRoot()
): Promise<PetAction | null> {
  const index = loadSkillIndex(root)
  const selection = selectSkill(index, {
    requestedSkillId: reply.skill_id,
    actionIntent: reply.action_intent,
    mood: reply.mood_tag
  })

  if (selection.kind === 'existing') return readSkillAction(selection.skillId, root)
  if (selection.kind === 'create') {
    return createReviewedSkill(provider, selection.actionIntent, reply, root)
  }
  return null
}
