import { desktopCapturer, screen } from 'electron'

export async function captureMainScreenPng(): Promise<Buffer | null> {
  const { workAreaSize } = screen.getPrimaryDisplay()
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: {
      width: Math.round(workAreaSize.width / 2),
      height: Math.round(workAreaSize.height / 2)
    }
  })
  const main = sources[0]
  if (!main) return null
  return main.thumbnail.toPNG()
}
