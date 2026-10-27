import { expect, it } from 'vitest'
import { VOWELS } from './data'

it('vowel forms are unique and each has an example word', () => {
  expect(new Set(VOWELS.map((v) => v.ch)).size).toBe(VOWELS.length)
  for (const v of VOWELS) expect(v.word.length, v.ch).toBeGreaterThan(1)
})
