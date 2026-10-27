import type { Vowel } from './data'
import { playClip } from './speech'
import { useKeys } from './ui'

/** Self-graded: read the word aloud, hear it, then say whether you had it. */
export function VowelMode({ vowel: v, onDone }: { vowel: Vowel; onDone: (ok: boolean) => void }) {
  const play = () => playClip(v.word, v.word)
  useKeys((k) => {
    if (k === 'Space' || k === 'Enter') play()
    else if (k === '1') onDone(true)
    else if (k === '2') onDone(false)
  })

  return (
    <div className="card">
      <div className="prompt-name">
        <div className="thai tone-word">{v.word}</div>
        <div className="muted">{v.meaning}</div>
        <div className="thai info-name">{v.ch}</div>
        <div className="muted">{v.len}</div>
        <button className="btn icon" aria-label="Play word" onClick={play}>🔊</button>
      </div>
      <div className="row">
        <button className="btn primary" onClick={() => onDone(true)}>Got it <kbd>1</kbd></button>
        <button className="btn" onClick={() => onDone(false)}>Missed <kbd>2</kbd></button>
      </div>
    </div>
  )
}
