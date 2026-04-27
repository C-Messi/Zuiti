import Store from 'electron-store'
import type { PetEvent } from '../../shared/types'

type Schema = {
  events: PetEvent[]
}

const store = new Store<Schema>({
  name: 'zuiti-memory',
  defaults: { events: [] }
})

const MAX = 20

export function appendEvent(e: PetEvent): void {
  const list = store.get('events')
  list.push(e)
  while (list.length > MAX) list.shift()
  store.set('events', list)
}

export function recent(n = 5): PetEvent[] {
  const list = store.get('events')
  return list.slice(-n)
}

export function clearAll(): void {
  store.set('events', [])
}
