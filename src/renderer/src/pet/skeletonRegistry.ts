import type {
  MoodState,
  PetExpressionDefinition,
  PetPartDefinition,
  PetRenderPackage
} from '../../../shared/types'

export type RegisteredSkeleton = {
  id: string
  parts: Record<string, PetPartDefinition>
  expressions: Partial<Record<MoodState, PetExpressionDefinition>>
  renderOrder: string[]
  motionTools: PetRenderPackage['motionTools']
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function isSafePart(id: string, value: unknown): value is PetPartDefinition {
  if (!isRecord(value)) return false
  const normalized = id.replaceAll('_', '-')
  return (
    value.id === id &&
    typeof value.label === 'string' &&
    typeof value.transformOrigin === 'string' &&
    typeof value.svg === 'string' &&
    value.svg.trim().startsWith(`<g id="zuiti-part-${normalized}"`) &&
    !/<\s*script\b|<\s*foreignObject\b|\son[a-z]+\s*=|\b(?:href|src)\s*=/i.test(value.svg)
  )
}

function safeFallbackMarkup(mood: MoodState): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Zuiti ${mood}" viewBox="0 0 256 256"><g id="zuiti-part-body"><ellipse cx="128" cy="210" rx="64" ry="14" fill="#111827" opacity=".12"/></g></svg>`
}

export function loadPetRenderPackage(pkg: PetRenderPackage): PetRenderPackage {
  return pkg
}

export function registerSkeletonFromResources(pkg: PetRenderPackage): RegisteredSkeleton {
  const parts: Record<string, PetPartDefinition> = {}
  for (const [partId, part] of Object.entries(pkg.parts)) {
    if (!isSafePart(partId, part)) throw new Error(`invalid skeleton resource part: ${partId}`)
    parts[partId] = { ...part, svg: part.svg.trim() }
  }

  for (const partId of pkg.renderOrder) {
    if (!parts[partId]) throw new Error(`renderOrder references missing part: ${partId}`)
  }

  return {
    id: pkg.id,
    parts,
    expressions: pkg.expressions,
    renderOrder: pkg.renderOrder,
    motionTools: pkg.motionTools
  }
}

function renderPart(
  partId: string,
  mood: MoodState,
  parts: RegisteredSkeleton['parts'],
  expressions: RegisteredSkeleton['expressions']
): string {
  const expression = expressions[mood]
  const part = parts[partId]
  const svg = expression?.partId === partId ? expression.svg.trim() : (part?.svg ?? '')
  if (!part || !svg) return ''
  return svg.replace(
    /^<g\b/,
    `<g style="transform-origin:${part.transformOrigin};transform-box:fill-box"`
  )
}

export function renderRegisteredSkeletonMarkup(pkg: PetRenderPackage, mood: MoodState): string {
  try {
    const registration = registerSkeletonFromResources(pkg)
    const body = registration.renderOrder
      .map((id) => renderPart(id, mood, registration.parts, registration.expressions))
      .join('\n')

    return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${pkg.ariaLabel} ${mood}" viewBox="${pkg.viewBox}">
<defs>
<filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
<feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#111827" flood-opacity=".18"/>
</filter>
</defs>
<g filter="url(#softShadow)">
${body}
</g>
</svg>`
  } catch {
    return safeFallbackMarkup(mood)
  }
}
