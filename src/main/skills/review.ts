import type { LLMProvider } from '../brain/provider'
import type { SkillDraft } from './author'
import { validatePropSvg } from './registry'
import { safeWarn } from '../logger'

export type SkillReviewResult = {
  score: number
  summary: string
}

const REVIEW_SYSTEM = `你是嘴替桌宠的道具视觉审核器。

请根据预览图判断这个道具是否适合自动启用：
- 视觉是否清晰可读
- 是否是单个可挂载道具，而不是完整宠物、身体、脸、背景或大场景
- 是否安全、无敏感或攻击内容
- 是否匹配道具意图与锚点，且不会明显遮挡宠物本体

只输出 JSON：{ "score": 0-100, "summary": "一句话" }`

function parseScore(raw: unknown): SkillReviewResult | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as { score?: unknown; summary?: unknown }
  if (typeof obj.score !== 'number') return null
  return {
    score: Math.max(0, Math.min(100, obj.score)),
    summary: typeof obj.summary === 'string' ? obj.summary : '视觉审核完成'
  }
}

async function renderSvgPreviewBase64(svg: string): Promise<string | null> {
  try {
    const electron = await import('electron')
    const { app, BrowserWindow } = electron
    if (!app?.isReady?.()) return null
    const win = new BrowserWindow({
      width: 256,
      height: 256,
      show: false,
      transparent: true,
      webPreferences: { offscreen: true, sandbox: false }
    })
    const html = `<!doctype html><html><body style="margin:0;background:transparent;display:grid;place-items:center;width:256px;height:256px">${svg}</body></html>`
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    await new Promise((resolve) => setTimeout(resolve, 120))
    const image = await win.webContents.capturePage()
    win.destroy()
    return image.toPNG().toString('base64')
  } catch {
    return null
  }
}

export async function reviewSkillDraft(
  provider: LLMProvider,
  draft: SkillDraft,
  propIntent: string
): Promise<SkillReviewResult> {
  const validation = validatePropSvg(draft.svg)
  if (!validation.ok) return { score: 0, summary: validation.reason }

  const preview = await renderSvgPreviewBase64(validation.svg)
  if (!preview) {
    return { score: 82, summary: 'SVG 通过 deterministic 校验；当前环境无预览渲染，按保守分启用。' }
  }

  try {
    const raw = await provider.visionJSON(
      REVIEW_SYSTEM,
      `道具意图：${propIntent}\n锚点：${draft.anchor}\n标题：${draft.title}\n描述：${draft.description}`,
      preview
    )
    return parseScore(raw) ?? { score: 0, summary: '视觉审核返回格式无效' }
  } catch (err) {
    safeWarn('[skills] review failed:', err)
    return { score: 0, summary: '视觉审核失败' }
  }
}
