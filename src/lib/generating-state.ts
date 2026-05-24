interface Entry {
  startedAt: number
  listeners: Set<() => void>
}

const store = new Map<string, Entry>()

export function startGenerating(commodityId: string): number {
  const existing = store.get(commodityId)
  if (existing) return existing.startedAt
  const startedAt = Date.now()
  store.set(commodityId, { startedAt, listeners: new Set() })
  return startedAt
}

export function stopGenerating(commodityId: string) {
  const entry = store.get(commodityId)
  if (!entry) return
  store.delete(commodityId)
  entry.listeners.forEach((fn) => fn())
}

export function getGeneratingStart(commodityId: string): number | null {
  return store.get(commodityId)?.startedAt ?? null
}

export function onGeneratingDone(commodityId: string, fn: () => void): () => void {
  const entry = store.get(commodityId)
  if (!entry) return () => {}
  entry.listeners.add(fn)
  return () => entry.listeners.delete(fn)
}
