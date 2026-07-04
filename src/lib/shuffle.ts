/**
 * Seeded Fisher-Yates shuffle
 * NIM yang sama → output identik selalu
 */

function djb2Hash(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i)
    h = h >>> 0 // unsigned 32-bit
  }
  return h
}

function seededRng(seed: string) {
  let state = djb2Hash(seed)
  return () => {
    state ^= state << 13
    state ^= state >> 17
    state ^= state << 5
    state = state >>> 0
    return state / 4294967296
  }
}

export function seededShuffle<T>(arr: T[], seed: string): T[] {
  const rng = seededRng(seed)
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function pickProducts<T>(pool: T[], nim: string, count: number): T[] {
  return seededShuffle(pool, nim).slice(0, Math.min(count, pool.length))
}

export function pickToko<T>(pool: T[], nim: string): T {
  return seededShuffle(pool, nim + '_toko')[0]
}
