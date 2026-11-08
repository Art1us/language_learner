import { beforeEach, describe, expect, it } from 'vitest'
import { LETTERS } from './data'
import { drillNext, inPlay, record, reset, resetMode } from './store'

const pool = LETTERS.slice(0, 5)

describe('drillNext', () => {
  beforeEach(() => reset())

  it('starts with three letters and only adds a fourth once all three are known', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 30; i++) seen.add(drillNext(pool, undefined).ch)
    expect(seen.size).toBe(3)
    for (const l of inPlay(pool)) { record('drill', l.ch, true); record('drill', l.ch, true) } // box 3
    expect(drillNext(pool).ch).toBe(pool[3].ch)
    expect(inPlay(pool)).toHaveLength(4)
  })

  it('learn mode lets new words in while fewer than maxWeak are weak', () => {
    const opts = { mode: 'learn' as const, start: 2, maxWeak: 2 }
    drillNext(pool, undefined, opts); drillNext(pool, undefined, opts) // 2 in, both weak
    expect(inPlay(pool, 'learn')).toHaveLength(2)
    drillNext(pool, undefined, opts)
    expect(inPlay(pool, 'learn')).toHaveLength(2) // 2 weak: no new word
    record('learn', pool[0].ch, true); record('learn', pool[0].ch, true) // box 3
    expect(drillNext(pool, undefined, opts).ch).toBe(pool[2].ch)
    expect(inPlay(pool)).toHaveLength(0) // letter drill progress untouched
  })

  it('a known word waits its gap while weak ones cycle', () => {
    const opts = { mode: 'learn' as const, start: 4, maxWeak: 1 }
    for (let i = 0; i < 4; i++) drillNext(pool, undefined, opts) // 4 in, all weak
    for (let i = 0; i < 3; i++) record('learn', pool[0].ch, true) // box 4: gap 54
    let prev
    for (let i = 0; i < 40; i++) {
      prev = drillNext(pool.slice(0, 4), prev, opts)
      expect(prev.ch).not.toBe(pool[0].ch)
    }
  })

  it('never repeats the previous letter when others are in play', () => {
    let prev = drillNext(pool)
    for (let i = 0; i < 30; i++) {
      const next = drillNext(pool, prev)
      if (inPlay(pool).length > 1) expect(next).not.toBe(prev)
      prev = next
    }
  })
})

it('resetMode forgets one mode only', () => {
  record('learn', 'ก', true)
  record('drill', 'ก', true)
  resetMode('learn')
  expect(inPlay([{ ch: 'ก' }], 'learn')).toEqual([])
  expect(inPlay([{ ch: 'ก' }], 'drill')).toHaveLength(1)
})
