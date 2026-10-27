// Sentence word-splitting data + pure logic (no DOM).
import th from './sentences.json'
import km from './sentences.km.json'
import { lang } from './lang'

const json = lang === 'km' ? km : th

export type Sentence = { ch: string; split: string[]; meaning: string; fresh: string[] }

export const GLOSSARY = json.glossary as Record<string, string>
export const SENTENCES: Sentence[] = json.sentences.map((s) => ({
  ch: s.thai,
  split: s.split,
  meaning: s.english,
  fresh: s.new_words,
}))

// Grapheme clusters keep vowel/tone marks glued to their consonant, so a cut can never land inside one.
const seg = new Intl.Segmenter(lang, { granularity: 'grapheme' })
export const graphemes = (s: string) => [...seg.segment(s)].map((x) => x.segment)

/** Grapheme indices a word boundary falls before (sentence end excluded). */
export function cuts(s: Sentence): Set<number> {
  const out = new Set<number>()
  let n = 0
  for (const w of s.split.slice(0, -1)) out.add((n += graphemes(w).length))
  return out
}

export const sameCuts = (a: Set<number>, b: Set<number>) => a.size === b.size && [...a].every((x) => b.has(x))

/** Words the user did not isolate: a boundary at either edge missing, or a cut placed inside the word. */
export function wrongWords(s: Sentence, mine: Set<number>): string[] {
  const out: string[] = []
  let start = 0
  s.split.forEach((w, k) => {
    const end = start + graphemes(w).length
    const edgesOk = (k === 0 || mine.has(start)) && (k === s.split.length - 1 || mine.has(end))
    const inside = [...mine].some((c) => c > start && c < end)
    if (!edgesOk || inside) out.push(w)
    start = end
  })
  return out
}
