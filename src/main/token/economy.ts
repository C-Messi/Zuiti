import Store from 'electron-store'

type Schema = { totalTokens: number; lastFedTs: number }

const store = new Store<Schema>({
  name: 'zuiti-token',
  defaults: { totalTokens: 0, lastFedTs: Date.now() }
})

export type HungerLevel = 'full' | 'ok' | 'hungry' | 'starving'

export function feed(tokens: number): void {
  store.set('totalTokens', store.get('totalTokens') + Math.max(0, tokens))
  store.set('lastFedTs', Date.now())
}

export function snapshot(): {
  total: number
  sinceLastFedMs: number
  hungerLevel: HungerLevel
} {
  const total = store.get('totalTokens')
  const since = Date.now() - store.get('lastFedTs')
  let hungerLevel: HungerLevel
  if (since < 60_000) hungerLevel = 'full'
  else if (since < 180_000) hungerLevel = 'ok'
  else if (since < 600_000) hungerLevel = 'hungry'
  else hungerLevel = 'starving'
  return { total, sinceLastFedMs: since, hungerLevel }
}

export function tokenStateText(): string {
  const s = snapshot()
  return `token 累计：${s.total}；当前 ${s.hungerLevel}（距上次投喂 ${Math.round(
    s.sinceLastFedMs / 1000
  )}s）`
}
