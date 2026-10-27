import { useMemo, useState } from 'react'
import { LETTERS, type Letter } from './data'
import { shuffle } from './store'
import { BigLetter, LetterInfo, Verdict, useKeys, type CardProps } from './ui'

export function NamesMode({ letter, reverse, onDone }: CardProps & { reverse: boolean }) {
  const [picked, setPicked] = useState<Letter | null>(null)
  const options = useMemo(() => {
    const same = shuffle(LETTERS.filter((l) => l.cls === letter.cls && l !== letter))
    const other = shuffle(LETTERS.filter((l) => l.cls !== letter.cls))
    return shuffle([letter, ...[...same, ...other].slice(0, 3)])
  }, [letter])
  const ok = picked === letter

  useKeys((k) => {
    if (picked) { if (k === 'Enter') onDone(ok); return }
    const i = Number(k) - 1
    if (i >= 0 && i < 4) setPicked(options[i])
  })

  return (
    <div className="card">
      {reverse ? (
        <div className="prompt-name">
          <div className="thai info-name">{letter.thai}</div>
        </div>
      ) : (
        <BigLetter l={letter} />
      )}
      <div className="options">
        {options.map((o, i) => {
          const cls = picked ? (o === letter ? 'right' : o === picked ? 'wrong' : 'dim') : ''
          return (
            <button key={o.ch} className={`btn option ${cls}`} disabled={!!picked} onClick={() => setPicked(o)}>
              <kbd>{i + 1}</kbd>
              {reverse ? <span className="thai option-letter">{o.ch}</span> : <span className="thai option-name">{o.thai}</span>}
            </button>
          )
        })}
      </div>
      {picked && (
        <>
          <Verdict ok={ok} />
          <LetterInfo l={letter} />
          <button className="btn primary wide" onClick={() => onDone(ok)}>Next <kbd>↵</kbd></button>
        </>
      )}
    </div>
  )
}
