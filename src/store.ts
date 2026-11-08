import { lang } from './lang'

type Item = { ch: string }

export type Mode = 'class' | 'names' | 'speak' | 'tones' | 'vowels' | 'split' | 'vocab' | 'vocabrev' | 'sent' | 'sentrev' | 'drill' | 'learn'
/** Round-based modes shown as cards on the home screen; 'drill' has its own button. */
export const MODES: Mode[] = lang === 'km' ? ['split'] : ['class', 'names', 'speak', 'tones', 'vowels', 'split', 'learn', 'vocab', 'vocabrev', 'sent', 'sentrev']
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
const empty = (): Progress => ({ class: {}, names: {}, speak: {}, tones: {}, vowels: {}, split: {}, vocab: {}, vocabrev: {}, sent: {}, sentrev: {}, drill: {}, learn: {} })

let progress = load()

const save = () => { try { localStorage.setItem(KEY, JSON.stringify(progress)) } catch { /* no storage (private mode, tests) */ } }

export const getBox = (mode: Mode, ch: string) => progress[mode][ch] ?? 1

export function record(mode: Mode, ch: string, ok: boolean) {
  progress[mode][ch] = ok ? Math.min(BOXES, getBox(mode, ch) + 1) : 1
  save()
}

export const mastered = (mode: Mode) => Object.values(progress[mode]).filter((b) => b >= 4).length

/** Forget one exercise's boxes (and its in-memory spacing history). */
export function resetMode(mode: Mode) {
  progress[mode] = {}
  delete lastSeen[mode]
  save()
}

export function reset() {
  progress = empty()
  lastSeen = {}
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

/** Items already introduced in a progressive mode ('drill' = letters, 'learn' = vocabulary). */
export const inPlay = <T extends Item>(pool: T[], mode: Mode = 'drill') => pool.filter((l) => l.ch in progress[mode])

/** Progressive modes: turn each item was last shown, in memory only (a reload starts everyone at turn 0). */
let lastSeen: Partial<Record<Mode, Record<string, number>>> = {}
let turn = 0
/** Cards to wait before an item is due again: 2, 6, 18, 54, 162 by box. */
export const gap = (box: number) => 2 * 3 ** (box - 1)

/**
 * Progressive drill: items enter one at a time, in pool order (`start` to begin, the next one
 * once fewer than `maxWeak` items in play are below box 3); otherwise the most overdue item in
 * play comes up, so known ones wait longer each time; no immediate repeats.
 */
export function drillNext<T extends Item>(pool: T[], prev?: T, { mode = 'drill' as Mode, start = 3, maxWeak = 1 } = {}): T {
  const seen = (lastSeen[mode] ??= {})
  turn++
  const active = inPlay(pool, mode)
  const fresh = pool.find((l) => !(l.ch in progress[mode]))
  let next: T
  if (fresh && (active.length < start || active.filter((l) => getBox(mode, l.ch) < 3).length < maxWeak)) {
    progress[mode][fresh.ch] = 1
    save()
    next = fresh
  } else {
    const candidates = active.length > 1 ? active.filter((l) => l !== prev) : active
    const overdue = (l: T) => turn - (seen[l.ch] ?? 0) - gap(getBox(mode, l.ch)) + Math.random() // random breaks ties
    next = candidates.reduce((a, b) => (overdue(b) > overdue(a) ? b : a))
  }
  seen[next.ch] = turn
  return next
}

export const shuffle = <T,>(xs: T[]) => {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
