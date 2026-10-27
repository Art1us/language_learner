import { useState } from 'react'
import { CLASS_NAME, type Cls } from './data'
import { BigLetter, LetterInfo, Verdict, useKeys, type CardProps } from './ui'

const CLASSES: Cls[] = ['M', 'H', 'L']

export function ClassMode({ letter, onDone }: CardProps) {
  const [ok, setOk] = useState<boolean | null>(null) // null = not answered yet

  useKeys((k) => {
    if (ok === null) { if (CLASSES.includes(k as Cls)) setOk(letter.cls === k) }
    else if (k === 'Enter') onDone(ok)
  })

  return (
    <div className="card">
      <BigLetter l={letter} />
      {ok === null ? (
        <div className="row">
          {CLASSES.map((c) => (
            <button key={c} className="btn primary" onClick={() => setOk(letter.cls === c)}>
              {CLASS_NAME[c]} <kbd>{c}</kbd>
            </button>
          ))}
        </div>
      ) : (
        <>
          <Verdict ok={ok}>{ok ? 'Correct!' : `Wrong class – it is ${CLASS_NAME[letter.cls]}`}</Verdict>
          <LetterInfo l={letter} />
          <button className="btn primary wide" onClick={() => onDone(ok)}>Next <kbd>↵</kbd></button>
        </>
      )}
    </div>
  )
}
