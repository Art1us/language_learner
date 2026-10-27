import type { Letter } from './data'

/** Strip spaces, punctuation and zero-width chars so "ก ไก่", "กอ.ไก่" and "กอไก่" compare equal. */
export const normalize = (s: string) =>
  s.normalize('NFC').replace(/[\s\p{P}\p{S}​-‍⁠﻿]/gu, '')

/** "กอ ไก่" -> { syllable: "กอ", key: "ไก่" } */
export const splitName = (thai: string) => {
  const [syllable, ...rest] = thai.split(' ')
  return { syllable: normalize(syllable), key: normalize(rest.join('')) }
}

export type Verdict = 'correct' | 'close' | 'wrong'

/** Correct = key word + class syllable heard; close = key word only; wrong = nothing matched. */
export function matchTranscript(alternatives: string[], letter: Pick<Letter, 'thai'>): Verdict {
  const { syllable, key } = splitName(letter.thai)
  let best: Verdict = 'wrong'
  for (const alt of alternatives) {
    const t = normalize(alt)
    if (!t.includes(key)) continue
    if (t.includes(syllable)) return 'correct'
    best = 'close'
  }
  return best
}
