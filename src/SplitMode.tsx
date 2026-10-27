import { useState } from 'react'
import { GLOSSARY, cuts, graphemes, sameCuts, wrongWords, type Sentence } from './split'
import { playClip } from './speech'
import { useKeys, Verdict } from './ui'

/** Tap a character to put a word boundary after it; Enter checks, then Enter again moves on. */
export function SplitMode({ sentence: s, onDone }: { sentence: Sentence; onDone: (ok: boolean, wrong: string[]) => void }) {
  const [mine, setMine] = useState<Set<number>>(new Set())
  const [checked, setChecked] = useState(false)
  const [shown, setShown] = useState(false) // answer revealed without trying: counts as missed
  const g = graphemes(s.ch)
  const right = cuts(s)
  const ok = !shown && sameCuts(mine, right)
  const done = () => onDone(ok, shown ? s.split : wrongWords(s, mine))
  const play = () => playClip(s.ch, s.ch)
  const reveal = () => {
    setMine(new Set(right))
    setShown(true)
    setChecked(true)
  }
  const toggle = (i: number) => {
    if (checked || i >= g.length) return
    const next = new Set(mine)
    if (!next.delete(i)) next.add(i)
    setMine(next)
  }
  useKeys((k) => {
    if (k === 'Space') play()
    else if (k === 'Enter' && checked) done()
    else if (k === 'Enter') setChecked(true)
    else if (k === 'S' && !checked) reveal()
    else if (k === 'Backspace' && !checked) setMine(new Set())
  })

  // After checking, each boundary is: ok (cut & should be), miss (should be, wasn't), extra (cut, shouldn't be)
  const gapClass = (i: number) => {
    const m = mine.has(i), r = right.has(i)
    if (!checked || shown) return m ? 'cut' : ''
    return m && r ? 'cut ok' : r ? 'cut miss' : m ? 'cut extra' : ''
  }

  return (
    <div className="card">
      <p className="muted small">Tap a letter to split after it · Backspace clears{checked && ' · Tap a word to hear it'}</p>
      <div className="thai sentence" aria-label="Sentence to split">
        {g.map((x, i) => (
          <span key={i} className={`g ${gapClass(i + 1)}`} onClick={() => toggle(i + 1)}>{x}</span>
        ))}
      </div>
      {checked ? (
        <>
          <Verdict ok={ok}>
            {shown ? 'Answer' : ok ? 'Correct!' : 'Not quite'}
          </Verdict>
          <div className="words">
            {s.split.map((w, i) => (
              <button key={i} className={`word ${s.fresh.includes(w) ? 'fresh' : ''}`} onClick={() => playClip(w, w)} aria-label={`Play ${w}`}>
                <span className="thai">{w}</span>
                <small className="muted">{GLOSSARY[w]}</small>
              </button>
            ))}
          </div>
          <p>{s.meaning}</p>
          <div className="row">
            <button className="btn icon" aria-label="Play sentence" onClick={play}>🔊</button>
            <button className="btn primary" onClick={done}>Next <kbd>Enter</kbd></button>
          </div>
        </>
      ) : (
        <div className="row">
          <button className="btn icon" aria-label="Play sentence" onClick={play}>🔊</button>
          <button className="btn primary" onClick={() => setChecked(true)}>Check <kbd>Enter</kbd></button>
          <button className="btn" onClick={reveal}>Show answer <kbd>S</kbd></button>
        </div>
      )}
    </div>
  )
}
