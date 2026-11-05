import { useEffect, useState } from 'react'
import words from './vocabulary.json'
import phrases from './phrases.json'
import { playClip, preloadClip } from './speech'
import { useKeys } from './ui'

export type Vocab = { ch: string; meaning: string; tier?: number; complexity?: number }
const toCards = (xs: { thai: string; eng: string; tier?: number; complexity?: number }[]): Vocab[] =>
  xs.map((w) => ({ ch: w.thai, meaning: w.eng, tier: w.tier, complexity: w.complexity }))
export const VOCAB = toCards(words)
export const PHRASES = toCards(phrases)

const Buttons = ({ onDone }: { onDone: (ok: boolean) => void }) => (
  <div className="row">
    <button className="btn primary" onClick={() => onDone(true)}>Remember <kbd>1</kbd></button>
    <button className="btn" onClick={() => onDone(false)}>Don't remember <kbd>2</kbd></button>
  </div>
)

/**
 * Flashcard. Thai → English: reveal the meaning, then Remember / Don't remember.
 * English → Thai: answer Remember / Don't remember first, then the Thai is shown; Enter goes on.
 */
export function VocabMode({ word: w, reverse, onDone }: { word: Vocab; reverse: boolean; onDone: (ok: boolean) => void }) {
  const [shown, setShown] = useState(false)
  const [answer, setAnswer] = useState<boolean>()
  const play = () => playClip(w.ch, w.ch)
  const thaiShown = !reverse || answer !== undefined
  useEffect(() => { preloadClip(w.ch) }, [w.ch])

  useKeys((k, e) => {
    if (k === 'Space') { e.preventDefault(); if (thaiShown) play() }
    else if (reverse) {
      if (answer === undefined) { if (k === '1') setAnswer(true); else if (k === '2') setAnswer(false) }
      else if (k === 'Enter') onDone(answer)
      else if (k === '2' && answer) onDone(false)
    }
    else if (!shown) { if (k === 'Enter') setShown(true) }
    else if (k === '1') onDone(true)
    else if (k === '2') onDone(false)
  })

  return (
    <div className="card">
      <div className="prompt-name">
        {reverse && <div className="info-name">{w.meaning}</div>}
        {thaiShown && <div className={`thai tone-word ${w.ch.length > 12 ? 'long' : ''}`}>{w.ch}</div>}
        {!reverse && shown && <div className="info-name">{w.meaning}</div>}
        {thaiShown && <button className="btn icon" aria-label="Play word" onClick={play}>🔊 <kbd>␣</kbd></button>}
      </div>
      {reverse ? (
        answer === undefined ? <Buttons onDone={setAnswer} /> : (
          <div className="row">
            {answer && <button className="btn" onClick={() => onDone(false)}>Mistake <kbd>2</kbd></button>}
            <button className="btn primary" onClick={() => onDone(answer)}>Next <kbd>↵</kbd></button>
          </div>
        )
      ) : shown ? <Buttons onDone={onDone} /> : (
        <button className="btn primary wide" onClick={() => setShown(true)}>Show meaning <kbd>↵</kbd></button>
      )}
    </div>
  )
}
