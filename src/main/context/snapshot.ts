import type { MoodState, ScreenObservation } from '../../shared/types'

export type ChatTurn = {
  role: 'user' | 'pet'
  text: string
  ts: number
}

export type ContextSnapshot = {
  soulText: string
  memoryText: string
  skillIndexText: string
  visionSummary?: ScreenObservation
  chatWindow: ChatTurn[]
  mood?: MoodState
}

type ContextSnapshotManagerOptions = {
  maxChatTurns: number
  soulText: string
  memoryText: string
  skillIndexText: string
}

const DEFAULT_MAX_CHAT_TURNS = 12

export class ContextSnapshotManager {
  private readonly maxChatTurns: number
  private soulText: string
  private memoryText: string
  private skillIndexText: string
  private visionSummary?: ScreenObservation
  private chatWindow: ChatTurn[] = []
  private mood?: MoodState

  constructor(options: ContextSnapshotManagerOptions) {
    this.maxChatTurns = options.maxChatTurns
    this.soulText = options.soulText
    this.memoryText = options.memoryText
    this.skillIndexText = options.skillIndexText
  }

  setSoulText(text: string): void {
    this.soulText = text
  }

  setMemoryText(text: string): void {
    this.memoryText = text
  }

  setSkillIndexText(text: string): void {
    this.skillIndexText = text
  }

  setVisionSummary(summary: ScreenObservation | undefined): void {
    this.visionSummary = summary
  }

  setMood(mood: MoodState): void {
    this.mood = mood
  }

  appendChatTurn(turn: ChatTurn): void {
    this.chatWindow.push(turn)
    while (this.chatWindow.length > this.maxChatTurns) this.chatWindow.shift()
  }

  getSnapshot(): ContextSnapshot {
    return {
      soulText: this.soulText,
      memoryText: this.memoryText,
      skillIndexText: this.skillIndexText,
      visionSummary: this.visionSummary,
      chatWindow: [...this.chatWindow],
      mood: this.mood
    }
  }
}

let singleton = new ContextSnapshotManager({
  maxChatTurns: DEFAULT_MAX_CHAT_TURNS,
  soulText: '',
  memoryText: '',
  skillIndexText: ''
})

export function getContextManager(): ContextSnapshotManager {
  return singleton
}

export function resetContextManagerForTests(manager: ContextSnapshotManager): void {
  singleton = manager
}
