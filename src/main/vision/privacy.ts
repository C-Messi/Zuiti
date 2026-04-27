import Store from 'electron-store'
import type { Settings } from '../../shared/types'

const DEFAULT_BLACKLIST = [
  '1Password',
  'Keychain',
  '钥匙串访问',
  'Bank',
  '支付宝',
  '微信支付',
  'Wallet'
]

const store = new Store<Settings>({
  name: 'zuiti-settings',
  defaults: {
    visionEnabled: true,
    visionPausedUntil: null,
    tone: 'default',
    appBlacklist: DEFAULT_BLACKLIST
  }
})

export function getSettings(): Settings {
  return store.store
}

export function patchSettings(p: Partial<Settings>): Settings {
  store.set({ ...store.store, ...p })
  return store.store
}

export function isVisionPaused(): boolean {
  const s = store.store
  if (!s.visionEnabled) return true
  if (s.visionPausedUntil && Date.now() < s.visionPausedUntil) return true
  return false
}

export function isAppBlacklisted(activeAppName: string): boolean {
  const list = store.get('appBlacklist')
  return list.some((b) => activeAppName.toLowerCase().includes(b.toLowerCase()))
}
