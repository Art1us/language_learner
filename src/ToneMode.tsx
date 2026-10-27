import { useState } from 'react'
import { CLASS_NAME, MARK_NAME, TONES, TONE_NAME, type Tone, type ToneWord } from './data'
import { playClip } from './speech'
import { Verdict, useKeys } from './ui'

const Pitch = ({ t }: { t: Tone }) => (
  <svg className="pitch" viewBox="0 0 40 24" aria-hidden>
    <path d="M2 2 V22 H38" fill="none" stroke="currentColor" strokeOpacity=".3" />
    <path d={TONE_NAME[t][2]} fill="none" stroke={TONE_NAME[t][3]} strokeWidth="3" strokeLinecap="round" />
  </svg>
)

const SYL = { live: 'live syllable', short: 'dead syllable, short vowel', long: 'dead syllable, long vowel' }

export function ToneMode({ word, onDone }: { word: ToneWord; onDone: (ok: boolean) => void }) {
  const [picked, setPicked] = useState<Tone | null>(null)
  const ok = picked === word.tone

  useKeys((k) => {
    if (picked) { if (k === 'Enter') onDone(ok); return }
    const i = Number(k) - 1
    if (i >= 0 && i < TONES.length) setPicked(TONES[i])
  })

  return (
    <div className="card">
      <div className="prompt-name">
        <div className="thai tone-word">{word.ch}</div>
        <div className="muted">{word.meaning}</div>
        <button className="btn icon" aria-label="Play word" onClick={() => playClip(word.ch, word.ch)}>🔊</button>
      </div>
      <div className="options">
        {TONES.map((t, i) => {
          const cls = picked ? (t === word.tone ? 'right' : t === picked ? 'wrong' : 'dim') : ''
          return (
            <button key={t} className={`btn option ${cls}`} disabled={!!picked} onClick={() => setPicked(t)}>
              <kbd>{i + 1}</kbd><Pitch t={t} /><span className="thai option-name">{TONE_NAME[t][1]}</span>
            </button>
          )
        })}
      </div>
      {picked && (
        <>
          <Verdict ok={ok}>{ok ? 'Correct!' : <>Not quite – it is <span className="thai">{TONE_NAME[word.tone][1]}</span></>}</Verdict>
          <div className="info">
            <span style={{ color: ok ? 'var(--ok)' : 'var(--bad)' }}>{CLASS_NAME[word.cls]} class</span> · {word.mark ? <span className="thai">{MARK_NAME[word.mark]}</span> : SYL[word.syl]}
            {' '}→ <strong className="thai">{TONE_NAME[word.tone][1]}</strong> <Pitch t={word.tone} />
          </div>
          <button className="btn primary wide" onClick={() => onDone(ok)}>Next <kbd>↵</kbd></button>
        </>
      )}
    </div>
  )
}
