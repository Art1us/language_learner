import type { Letter } from './data'
import { lang } from './lang'

type Item = { ch: string }

export type Mode = 'class' | 'names' | 'speak' | 'tones' | 'vowels' | 'split' | 'drill'
/** Round-based modes shown as cards on the home screen; 'drill' has its own button. */
export const MODES: Mode[] = lang === 'km' ? ['split'] : ['class', 'names', 'speak', 'tones', 'vowels', 'split']
export const BOXES = 5

type Progress = Record<Mode, Record<string, number>> // letter -> box (1..5)
const KEY = lang === 'km' ? 'khmer-progress' : 'thai-consonants-progress'

const load = (): Progress => {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? '')
    if (p && typeof p === 'object') return { ...empty(), ...p }
  } catch { /* fresh */ }
  return empty()
}
const empty = (): Progress => ({ class: {}, names: {}, speak: {}, tones: {}, vowels: {}, split: {}, drill: {} })

let progress = load()

const save = () => { try { localStorage.setItem(KEY, JSON.stringify(progress)) } catch { /* no storage (private mode, tests) */ } }

export const getBox = (mode: Mode, ch: string) => progress[mode][ch] ?? 1

export function record(mode: Mode, ch: string, ok: boolean) {
  progress[mode][ch] = ok ? Math.min(BOXES, getBox(mode, ch) + 1) : 1
  save()
}

export const mastered = (mode: Mode) => Object.values(progress[mode]).filter((b) => b >= 4).length

export function reset() {
  progress = empty()
  try { localStorage.removeItem(KEY) } catch { /* no storage */ }
}

/** Weighted draw without replacement: box 1 is 16x more likely than box 5. */
export function drawRound<T extends Item>(mode: Mode, pool: T[]): T[] {
  const rest = pool.map((l) => ({ l, w: 2 ** (BOXES - getBox(mode, l.ch)) }))
  const out: T[] = []
  while (rest.length) {
    const total = rest.reduce((s, r) => s + r.w, 0)
    let r = Math.random() * total
    const i = rest.findIndex((x) => (r -= x.w) < 0)
    out.push(rest.splice(i === -1 ? rest.length - 1 : i, 1)[0].l)
  }
  return out
}

/** Letters already introduced in the drill. */
export const inPlay = (pool: Letter[]) => pool.filter((l) => l.ch in progress.drill)

/**
 * Drill: letters enter one at a time (3 to start, the next one once every letter in play
 * is at box 3+); among letters in play, weak ones come up more often; no immediate repeats.
 */
export function drillNext(pool: Letter[], prev?: Letter): Letter {
  const active = inPlay(pool)
  const fresh = pool.find((l) => !(l.ch in progress.drill))
  if (fresh && (active.length < 3 || active.every((l) => getBox('drill', l.ch) >= 3))) {
    progress.drill[fresh.ch] = 1
    save()
    return fresh
  }
  const candidates = active.length > 1 ? active.filter((l) => l !== prev) : active
  return drawRound('drill', candidates)[0]
}

export const shuffle = <T,>(xs: T[]) => {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
