import { expect, it } from 'vitest'
import { GLOSSARY, SENTENCES, cuts, graphemes, sameCuts, wrongWords } from './split'

it('every split joins back to its sentence and has one cut per boundary', () => {
  for (const s of SENTENCES) {
    expect(s.split.join(''), s.ch).toBe(s.ch)
    expect(cuts(s).size, s.ch).toBe(s.split.length - 1)
    for (const w of s.split) expect(GLOSSARY[w], w).toBeTruthy()
  }
})

it('cuts are grapheme indices that reproduce the split', () => {
  const s = SENTENCES[0] // ผม|ตื่น|สาย|...
  const g = graphemes(s.ch)
  const c = cuts(s)
  expect(c.has(2)).toBe(true) // after ผม
  expect(c.has(4)).toBe(true) // ตื่น = ตื + น, marks glued
  const words: string[] = []
  let w = ''
  g.forEach((x, i) => { if (c.has(i)) { words.push(w); w = '' } w += x })
  expect([...words, w]).toEqual(s.split)
  expect(sameCuts(c, new Set(c))).toBe(true)
  expect(sameCuts(c, new Set([...c].slice(1)))).toBe(false)
})

it('wrongWords flags words with a missing edge or a cut inside', () => {
  const s = SENTENCES[0] // ผม ตื่น สาย เพราะ เมื่อคืน นอน ไม่ หลับ ครับ
  const c = cuts(s)
  expect(wrongWords(s, c)).toEqual([])
  expect(wrongWords(s, new Set())).toEqual(s.split)
  const noCutAfterTuen = new Set([...c].filter((x) => x !== 4))
  expect(wrongWords(s, noCutAfterTuen)).toEqual(['ตื่น', 'สาย'])
  const cutInsideTuen = new Set([...c, 3])
  expect(wrongWords(s, cutInsideTuen)).toEqual(['ตื่น'])
})

it('khmer: every split joins back and cuts never land inside a cluster', async () => {
  const km = (await import('./sentences.km.json')).default
  const seg = new Intl.Segmenter('km', { granularity: 'grapheme' })
  const g = (s: string) => [...seg.segment(s)].map((x) => x.segment)
  for (const s of km.sentences) {
    expect(s.split.join(''), s.thai).toBe(s.thai)
    expect(s.split.flatMap(g), s.thai).toEqual(g(s.thai)) // word edges fall on grapheme edges
    for (const w of s.split) expect((km.glossary as Record<string, string>)[w], w).toBeTruthy()
  }
})
