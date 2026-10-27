import { describe, expect, it } from 'vitest'
import { matchTranscript, normalize, splitName } from './match'

const gor = { thai: 'กอ ไก่' }

describe('normalize', () => {
  it('strips spaces, punctuation and zero-width chars', () => {
    expect(normalize('กอ ไก่')).toBe('กอไก่')
    expect(normalize('กอ, ไก่.')).toBe('กอไก่')
    expect(normalize('กอ​ไก่')).toBe('กอไก่')
  })
})

describe('splitName', () => {
  it('separates class syllable and key word', () => {
    expect(splitName('กอ ไก่')).toEqual({ syllable: 'กอ', key: 'ไก่' })
    expect(splitName('ฮอ นกฮูก')).toEqual({ syllable: 'ฮอ', key: 'นกฮูก' })
  })
})

describe('matchTranscript', () => {
  it('"กอไก่" is correct', () => expect(matchTranscript(['กอไก่'], gor)).toBe('correct'))
  it('"กอ ไก่" is correct', () => expect(matchTranscript(['กอ ไก่'], gor)).toBe('correct'))
  it('"ก ไก่" is close (key word, no class syllable)', () => expect(matchTranscript(['ก ไก่'], gor)).toBe('close'))
  it('"ไก่" alone is close', () => expect(matchTranscript(['ไก่'], gor)).toBe('close'))
  it('wrong word is wrong', () => expect(matchTranscript(['ขอ ไข่', 'ไข่'], gor)).toBe('wrong'))
  it('empty is wrong', () => expect(matchTranscript([], gor)).toBe('wrong'))
  it('takes the best of several alternatives', () => {
    expect(matchTranscript(['ไข่', 'ไก่', 'กอไก่'], gor)).toBe('correct')
    expect(matchTranscript(['ไข่', 'ไก่'], gor)).toBe('close')
  })
  it('key word inside a longer phrase still counts', () => {
    expect(matchTranscript(['นี่คือไก่'], gor)).toBe('close')
  })
})
