import type { LLMProvider } from '../brain/provider'
import type { SkillDraft } from './author'
import { validateActionSvg } from './registry'
import { safeWarn } from '../logger'

export type SkillReviewResult = {
  score: number
  summary: string
}

const REVIEW_SYSTEM = `你是嘴替桌宠的动作视觉审核器。

请根据预览图判断这个动作是否适合自动启用：
- 视觉是否清晰可读
- 是否像可爱桌宠动作
- 是否安全、无敏感或攻击内容
- 是否匹配动作意图

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
  actionIntent: string
): Promise<SkillReviewResult> {
  const validation = validateActionSvg(draft.svg)
  if (!validation.ok) return { score: 0, summary: validation.reason }

  const preview = await renderSvgPreviewBase64(validation.svg)
  if (!preview) {
    return { score: 82, summary: 'SVG 通过 deterministic 校验；当前环境无预览渲染，按保守分启用。' }
  }

  try {
    const raw = await provider.visionJSON(
      REVIEW_SYSTEM,
      `动作意图：${actionIntent}\n标题：${draft.title}\n描述：${draft.description}`,
      preview
    )
    return parseScore(raw) ?? { score: 0, summary: '视觉审核返回格式无效' }
  } catch (err) {
    safeWarn('[skills] review failed:', err)
    return { score: 0, summary: '视觉审核失败' }
  }
}
