import { useEffect, useRef, useState } from 'react'
import { usePetStore } from '../store/usePetStore'

export function BubbleLayer(): React.JSX.Element {
  const bubbleText = usePetStore((s) => s.bubbleText)
  const bubbleVisible = usePetStore((s) => s.bubbleVisible)
  const hideBubble = usePetStore((s) => s.hideBubble)

  const [shown, setShown] = useState('')
  const idxRef = useRef(0)

  useEffect(() => {
    if (!bubbleVisible) {
      setShown('')
      idxRef.current = 0
      return
    }
    setShown('')
    idxRef.current = 0
    const id = setInterval(() => {
      if (idxRef.current >= bubbleText.length) {
        clearInterval(id)
        setTimeout(() => hideBubble(), 4000)
        return
      }
      idxRef.current += 1
      setShown(bubbleText.slice(0, idxRef.current))
    }, 35)
    return () => clearInterval(id)
  }, [bubbleText, bubbleVisible, hideBubble])

  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const send = async (): Promise<void> => {
    const t = draft.trim()
    if (!t || sending) return
    setSending(true)
    setDraft('')
    try {
      await window.zuiti.userSay(t)
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="absolute top-3 left-3 right-3 flex flex-col items-end gap-2"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {/* Speech bubble */}
      {bubbleVisible && shown && (
        <div className="bubble-enter max-w-[280px] relative">
          <div
            className="rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-lg
              backdrop-blur-md bg-white/85 text-gray-700
              border border-white/60"
          >
            {shown}
            <span className="inline-block w-[2px] h-3.5 bg-gray-400/60 ml-0.5 align-text-bottom animate-pulse" />
          </div>
          {/* Bubble tail */}
          <div
            className="absolute -bottom-1.5 right-6 w-3 h-3 rotate-45
              backdrop-blur-md bg-white/85 border-r border-b border-white/60"
          />
        </div>
      )}

      {/* Input area */}
      <div className="flex w-full items-center gap-1.5 mt-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void send()
            }
          }}
          placeholder="跟猫猫说点啥…"
          disabled={sending}
          className="input-glow flex-1 rounded-full border border-white/40 backdrop-blur-md
            bg-white/60 px-4 py-2 text-[13px] text-gray-700 placeholder-gray-400/70
            outline-none transition-all duration-200
            disabled:opacity-50"
        />
        <button
          onClick={() => void send()}
          disabled={sending}
          className="flex items-center justify-center w-8 h-8 rounded-full
            bg-gradient-to-br from-orange-300 to-pink-300
            text-white text-sm shadow-md
            hover:shadow-lg hover:scale-105 active:scale-95
            transition-all duration-200
            disabled:opacity-50 disabled:hover:scale-100"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
