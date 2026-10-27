import { useEffect, useState } from 'react'
import { CLASS_NAME, EXAMPLES, type Letter } from './data'
import { playClip, playName } from './speech'

/** Global keydown handler; ignores keys while typing in inputs. */
export function useKeys(handler: (key: string, e: KeyboardEvent) => void) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return
      handler(e.key === ' ' ? 'Space' : e.key.length === 1 ? e.key.toUpperCase() : e.key, e)
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  })
}

export function SpeakButton({ letter, label = '🔊' }: { letter: Letter; label?: string }) {
  const [msg, setMsg] = useState('')
  return (
    <span className="speak-wrap">
      <button
        className="btn icon"
        aria-label="Play pronunciation"
        onClick={async () => setMsg((await playName(letter)) ? '' : 'No audio: no Thai voice installed')}
      >
        {label}
      </button>
      {msg && <small className="warn">{msg}</small>}
    </span>
  )
}

/** Two playable example words: one with the letter at the start, one with it at the end. Letter is highlighted. */
export function Examples({ l }: { l: Letter }) {
  const ex = EXAMPLES[l.ch] ?? {}
  const mark = (w: string) => w.split(l.ch).flatMap((part, i) => (i ? [<mark key={i}>{l.ch}</mark>, part] : [part]))
  return (
    <div className="row">
      {([['Start', ex.start], ['End', ex.end]] as const).map(([label, w]) => w && (
        <button key={label} className="btn" onClick={() => playClip(w[0], w[0])}>
          🔊 {label}: <span className="thai">{mark(w[0])}</span> <small className="muted">{w[1]}</small>
        </button>
      ))}
    </div>
  )
}

export const BigLetter = ({ l }: { l: Letter }) => (
  <div className="big-letter">
    <span className="thai">{l.ch}</span>
  </div>
)

export function LetterInfo({ l }: { l: Letter }) {
  return (
    <div className="info">
      <div className="info-head">
        <span className="thai info-letter">{l.ch}</span>
        <div>
          <div className="thai info-name">{l.thai}</div>
          <div className="info-roman">{l.meaning}</div>
        </div>
        <SpeakButton letter={l} />
      </div>
      <dl className="info-grid">
        <dt>Class</dt><dd className={`cls cls-${l.cls}`}>{CLASS_NAME[l.cls]}</dd>
        <dt>Start</dt><dd>{l.start}</dd>
        <dt>End</dt><dd>{l.end === '-' ? 'not used as final' : l.end}</dd>
      </dl>
      <Examples l={l} />
    </div>
  )
}

export const Verdict = ({ ok, children }: { ok: boolean; children?: React.ReactNode }) => (
  <div className={`verdict ${ok ? 'ok' : 'bad'}`}>{children ?? (ok ? 'Correct!' : 'Not quite')}</div>
)

/** Props every mode component gets for one card. */
export type CardProps = { letter: Letter; onDone: (ok: boolean) => void }
