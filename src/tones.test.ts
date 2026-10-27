import { describe, expect, it } from 'vitest'
import { TONE_WORDS, toneOf } from './data'

describe('toneOf', () => {
  it('follows the chart', () => {
    expect(toneOf({ cls: 'M', syl: 'live', mark: 0 })).toBe('mid')
    expect(toneOf({ cls: 'H', syl: 'live', mark: 0 })).toBe('rising')
    expect(toneOf({ cls: 'M', syl: 'long', mark: 0 })).toBe('low')
    expect(toneOf({ cls: 'L', syl: 'long', mark: 0 })).toBe('falling')
    expect(toneOf({ cls: 'L', syl: 'short', mark: 0 })).toBe('high')
    expect(toneOf({ cls: 'L', syl: 'live', mark: 1 })).toBe('falling')
    expect(toneOf({ cls: 'H', syl: 'live', mark: 2 })).toBe('falling')
    expect(toneOf({ cls: 'L', syl: 'live', mark: 2 })).toBe('high')
  })
  it('word list is well-formed and covers every tone', () => {
    expect(new Set(TONE_WORDS.map((w) => w.ch)).size).toBe(TONE_WORDS.length)
    expect(new Set(TONE_WORDS.map((w) => w.tone)).size).toBe(5)
  })
})
