import { useEffect, useState } from 'react'
import type { Settings, ToneMode } from '../../../shared/types'

const TONE_OPTIONS: { value: ToneMode; label: string; icon: string }[] = [
  { value: 'default', label: '锐评', icon: '🔥' },
  { value: 'gentle', label: '温和', icon: '🌸' },
  { value: 'silent', label: '静音', icon: '🤫' }
]

export function SettingPanel(): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [s, setS] = useState<Settings | null>(null)

  useEffect(() => {
    void window.zuiti.settingsGet().then(setS)
  }, [])

  if (!s) return <div />

  const setTone = async (tone: ToneMode): Promise<void> => {
    const ns = await window.zuiti.settingsSet({ tone })
    setS(ns)
  }
  const togglePause = async (): Promise<void> => {
    const next = s.visionPausedUntil ? null : 30 * 60 * 1000
    await window.zuiti.visionPause(next)
    const ns = await window.zuiti.settingsGet()
    setS(ns)
  }

  const isPaused = s.visionPausedUntil && s.visionPausedUntil > Date.now()

  return (
    <div
      className="absolute bottom-3 left-3"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {/* Gear button */}
      <button
        className={`flex items-center justify-center w-7 h-7 rounded-full
          backdrop-blur-md transition-all duration-300
          ${open
            ? 'bg-white/80 shadow-md rotate-90'
            : 'bg-white/40 hover:bg-white/60 hover:shadow-sm'
          }`}
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-500">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </button>

      {/* Settings panel */}
      {open && (
        <div className="panel-enter mt-2 w-52 rounded-2xl backdrop-blur-xl bg-white/80 border border-white/50 p-3 shadow-xl">
          {/* Vision toggle */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">👁</span>
              <span className="text-xs text-gray-600 font-medium">看屏</span>
            </div>
            <button
              className={`relative w-10 h-5.5 rounded-full transition-colors duration-300 ${
                isPaused ? 'bg-gray-300' : 'bg-emerald-400'
              }`}
              style={{ width: 40, height: 22 }}
              onClick={() => void togglePause()}
            >
              <div
                className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                  isPaused ? 'left-0.5' : 'left-[20px]'
                }`}
                style={{
                  width: 18, height: 18,
                  transform: isPaused ? 'translateX(0)' : 'translateX(0)',
                  left: isPaused ? 2 : 20
                }}
              />
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-200/60 mb-3" />

          {/* Tone selector */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm">💬</span>
              <span className="text-xs text-gray-600 font-medium">语气</span>
            </div>
            <div className="flex gap-1.5">
              {TONE_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  className={`flex-1 flex flex-col items-center gap-0.5 rounded-xl py-1.5 px-1 text-[10px]
                    transition-all duration-200 ${
                      s.tone === t.value
                        ? 'bg-gradient-to-b from-orange-100 to-pink-100 text-gray-700 shadow-sm border border-orange-200/50'
                        : 'bg-gray-100/60 text-gray-500 hover:bg-gray-200/60'
                    }`}
                  onClick={() => void setTone(t.value)}
                >
                  <span className="text-sm leading-none">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
