import { beforeEach, describe, expect, it } from 'vitest'
import { LETTERS } from './data'
import { drillNext, inPlay, record, reset } from './store'

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

  it('never repeats the previous letter when others are in play', () => {
    let prev = drillNext(pool)
    for (let i = 0; i < 30; i++) {
      const next = drillNext(pool, prev)
      if (inPlay(pool).length > 1) expect(next).not.toBe(prev)
      prev = next
    }
  })
})
