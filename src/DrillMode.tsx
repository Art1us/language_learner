import { useState } from 'react'
import { BigLetter, LetterInfo, useKeys, type CardProps } from './ui'

/** Self-graded flashcard: recall, reveal, then say whether you had it. */
export function DrillMode({ letter, onDone }: CardProps) {
  const [shown, setShown] = useState(false)

  useKeys((k) => {
    if (!shown) { if (k === 'Enter' || k === 'Space') setShown(true) }
    else if (k === '1') onDone(true)
    else if (k === '2') onDone(false)
  })

  return (
    <div className="card">
      <BigLetter l={letter} />
      {shown ? (
        <>
          <LetterInfo l={letter} />
          <div className="row">
            <button className="btn primary" onClick={() => onDone(true)}>Got it <kbd>1</kbd></button>
            <button className="btn" onClick={() => onDone(false)}>Missed <kbd>2</kbd></button>
          </div>
        </>
      ) : (
        <button className="btn primary wide" onClick={() => setShown(true)}>Show answer <kbd>↵</kbd></button>
      )}
    </div>
  )
}
