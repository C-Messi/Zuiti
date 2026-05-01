import type { MoodState, MotionToolId, SkeletonId } from '../../../shared/types'
import {
  buildDefaultCatFaceMarkup,
  buildDefaultCatSvgMarkup,
  getDefaultCatFace
} from './defaultCatSvg'
import { DEFAULT_CAT_SKELETON } from './skeleton'

type ResourcePartId = 'head' | 'ears' | 'tail'
type FetchText = (url: string) => Promise<string>

export type SkeletonResourcePart = {
  id: ResourcePartId
  label: string
  svg: string
  transformOrigin: string
}

export type SkeletonResourcePackage = {
  id: SkeletonId
  title: string
  requiredParts: ResourcePartId[]
  renderOrder: string[]
  motionTools: MotionToolId[]
  parts: Partial<Record<ResourcePartId, SkeletonResourcePart>>
}

type SkeletonResourceManifestPart = {
  label: string
  path: string
  transformOrigin: string
}

type SkeletonResourceManifest = {
  id: SkeletonId
  title: string
  requiredParts: ResourcePartId[]
  renderOrder: string[]
  motionTools: MotionToolId[]
  parts: Partial<Record<ResourcePartId, SkeletonResourceManifestPart>>
}

export type RegisteredSkeleton = {
  id: SkeletonId
  parts: Record<ResourcePartId, SkeletonResourcePart>
  renderOrder: string[]
  motionTools: MotionToolId[]
}

export const DEFAULT_CAT_RESOURCE_BASE_URL = '/skeletons/default-cat'

const HEAD_SVG =
  '<g id="zuiti-part-head"><circle cx="128" cy="125" r="74" fill="#fff7ed" stroke="#111827" stroke-width="7"/><path d="M75 95 C82 58 116 48 129 54 C115 72 99 84 75 95 Z" fill="#111827"/><path d="M145 57 C170 56 189 78 195 105 C174 98 157 84 145 57 Z" fill="#111827"/></g>'

const EARS_SVG =
  '<g id="zuiti-part-ears"><path d="M67 83 L82 35 L115 70 Z" fill="#fff7ed" stroke="#111827" stroke-width="7" stroke-linejoin="round"/><path d="M189 83 L174 35 L141 70 Z" fill="#fff7ed" stroke="#111827" stroke-width="7" stroke-linejoin="round"/><path d="M82 55 L88 78 L101 71 Z" fill="#f9a8d4" opacity=".82"/><path d="M174 55 L168 78 L155 71 Z" fill="#f9a8d4" opacity=".82"/></g>'

const TAIL_SVG =
  '<g id="zuiti-part-tail"><path d="M198 162 C232 158 229 207 190 198" fill="none" stroke="#111827" stroke-width="10" stroke-linecap="round"/><circle cx="197" cy="162" r="8" fill="{{accent}}" stroke="#111827" stroke-width="4"/></g>'

const BUILT_IN_PARTS: Record<ResourcePartId, SkeletonResourcePart> = {
  head: { id: 'head', label: 'Head', svg: HEAD_SVG, transformOrigin: '50% 70%' },
  ears: { id: 'ears', label: 'Ears', svg: EARS_SVG, transformOrigin: '50% 72%' },
  tail: { id: 'tail', label: 'Tail', svg: TAIL_SVG, transformOrigin: '8% 20%' }
}

export const DEFAULT_CAT_RESOURCE_PACKAGE: SkeletonResourcePackage = {
  id: 'default-cat',
  title: 'Default cow-cat resource skeleton',
  requiredParts: ['head', 'ears', 'tail'],
  renderOrder: [
    'body',
    'tail',
    'left_foot',
    'right_foot',
    'left_arm',
    'right_arm',
    'ears',
    'head',
    'face'
  ],
  motionTools: DEFAULT_CAT_SKELETON.motionTools,
  parts: BUILT_IN_PARTS
}

async function browserFetchText(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`failed to load skeleton resource: ${url}`)
  return response.text()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function isValidResourcePart(id: ResourcePartId, value: unknown): value is SkeletonResourcePart {
  if (!isRecord(value)) return false
  return (
    value.id === id &&
    typeof value.label === 'string' &&
    typeof value.transformOrigin === 'string' &&
    typeof value.svg === 'string' &&
    value.svg.trim().startsWith(`<g id="zuiti-part-${id}"`) &&
    !/<\s*script\b|<\s*foreignObject\b|\son[a-z]+\s*=|\b(?:href|src)\s*=/i.test(value.svg)
  )
}

function isResourcePartId(value: string): value is ResourcePartId {
  return value === 'head' || value === 'ears' || value === 'tail'
}

function parseSkeletonResourceManifest(text: string): SkeletonResourceManifest {
  const manifest = JSON.parse(text) as SkeletonResourceManifest
  if (!isRecord(manifest) || manifest.id !== 'default-cat') {
    throw new Error('invalid skeleton manifest')
  }
  if (!Array.isArray(manifest.requiredParts) || !Array.isArray(manifest.renderOrder)) {
    throw new Error('skeleton manifest missing order data')
  }
  if (!Array.isArray(manifest.motionTools) || !isRecord(manifest.parts)) {
    throw new Error('skeleton manifest missing motion or part data')
  }
  return manifest
}

export async function loadSkeletonResourcePackage(
  fetchText: FetchText = browserFetchText,
  baseUrl = DEFAULT_CAT_RESOURCE_BASE_URL
): Promise<SkeletonResourcePackage> {
  const manifest = parseSkeletonResourceManifest(await fetchText(`${baseUrl}/manifest.json`))
  const parts: Partial<Record<ResourcePartId, SkeletonResourcePart>> = {}

  for (const partId of manifest.requiredParts) {
    if (!isResourcePartId(partId)) throw new Error(`unsupported skeleton part: ${partId}`)
    const part = manifest.parts[partId]
    if (!part?.path || !part.transformOrigin || !part.label) {
      throw new Error(`missing skeleton part metadata: ${partId}`)
    }
    parts[partId] = {
      id: partId,
      label: part.label,
      transformOrigin: part.transformOrigin,
      svg: await fetchText(`${baseUrl}/${part.path}`)
    }
  }

  return {
    id: manifest.id,
    title: manifest.title,
    requiredParts: manifest.requiredParts,
    renderOrder: manifest.renderOrder,
    motionTools: manifest.motionTools,
    parts
  }
}

export function loadDefaultCatSkeletonResourcePackage(): Promise<SkeletonResourcePackage> {
  return loadSkeletonResourcePackage()
}

export function registerSkeletonFromResources(pkg: SkeletonResourcePackage): RegisteredSkeleton {
  if (pkg.id !== 'default-cat') throw new Error('unsupported skeleton resource package')

  const parts = {} as Record<ResourcePartId, SkeletonResourcePart>
  for (const partId of pkg.requiredParts) {
    const part = pkg.parts[partId]
    if (!isValidResourcePart(partId, part)) {
      throw new Error(`invalid skeleton resource part: ${partId}`)
    }
    parts[partId] = {
      ...part,
      svg: part.svg.trim()
    }
  }

  return {
    id: pkg.id,
    parts,
    renderOrder: pkg.renderOrder,
    motionTools: pkg.motionTools
  }
}

function renderResourcePart(part: SkeletonResourcePart, mood: MoodState): string {
  const face = getDefaultCatFace(mood)
  return part.svg.replaceAll('{{accent}}', face.accent)
}

function renderStaticPart(id: string, mood: MoodState, parts: RegisteredSkeleton['parts']): string {
  if (id === 'body') {
    return '<g id="zuiti-part-body"><ellipse cx="128" cy="210" rx="64" ry="14" fill="#111827" opacity=".12"/></g>'
  }
  if (id === 'left_foot') {
    return '<g id="zuiti-part-left-foot"><ellipse cx="96" cy="190" rx="18" ry="10" fill="#fff7ed" stroke="#111827" stroke-width="6"/></g>'
  }
  if (id === 'right_foot') {
    return '<g id="zuiti-part-right-foot"><ellipse cx="160" cy="190" rx="18" ry="10" fill="#fff7ed" stroke="#111827" stroke-width="6"/></g>'
  }
  if (id === 'left_arm') {
    return '<g id="zuiti-part-left-arm"><path d="M74 168 C57 157 49 139 55 119" fill="none" stroke="#111827" stroke-width="7" stroke-linecap="round"/></g>'
  }
  if (id === 'right_arm') {
    return '<g id="zuiti-part-right-arm"><path d="M182 168 C199 157 207 139 201 119" fill="none" stroke="#111827" stroke-width="7" stroke-linecap="round"/></g>'
  }
  if (id === 'face') return buildDefaultCatFaceMarkup(mood)
  if (id === 'head' || id === 'ears' || id === 'tail') return renderResourcePart(parts[id], mood)
  return ''
}

export function renderRegisteredSkeletonMarkup(
  pkg: SkeletonResourcePackage,
  mood: MoodState
): string {
  try {
    const registration = registerSkeletonFromResources(pkg)
    const body = registration.renderOrder
      .map((id) => renderStaticPart(id, mood, registration.parts))
      .join('\n')

    return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Zuiti cow-cat ${mood} 奶牛猫" viewBox="0 0 256 256">
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
    return buildDefaultCatSvgMarkup(mood)
  }
}

export function renderDefaultCatSkeletonMarkup(mood: MoodState): string {
  return renderRegisteredSkeletonMarkup(DEFAULT_CAT_RESOURCE_PACKAGE, mood)
}
