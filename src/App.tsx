import { useEffect, useState } from 'react'
import { ClassMode } from './ClassMode'
import { NamesMode } from './NamesMode'
import { DrillMode } from './DrillMode'
import { SpeakMode } from './SpeakMode'
import { ToneMode } from './ToneMode'
import { VowelMode } from './VowelMode'
import { SplitMode } from './SplitMode'
import { GLOSSARY, SENTENCES, type Sentence } from './split'
import { LETTERS, TONE_WORDS, VOWELS, filterLetters, filterToneWords, type Filter, type Letter, type ToneWord, type Vowel } from './data'
import { useKeys } from './ui'
import { playClip } from './speech'
import { lang, setLang } from './lang'
import { MODES, drawRound, shuffle, drillNext, inPlay, mastered, record, reset, type Mode } from './store'

const MODE_INFO: Record<Mode, [string, string]> = {
  class: ['Class & sounds', 'Middle, high or low? Then the start and end sounds.'],
  names: ['Names', 'Pick the right name for the letter (or the letter for the name).'],
  speak: ['Speak', 'Say the letter name aloud and get checked by speech recognition.'],
  tones: ['Tones', 'One-syllable word: which of the 5 tones? Learn the class / syllable / tone-mark rule.'],
  vowels: ['Complex vowels', 'Read the word aloud, play it, then mark yourself right or wrong.'],
  split: ['Split the sentence', 'A sentence with no spaces: tap where each word ends, then check.'],
  drill: ['Learn step by step', 'Letters come in one at a time. Recall class, sounds and name, reveal, then mark yourself right or wrong.'],
}
const FILTERS: Filter[] = ['M', 'H', 'L', 'All']
const SIZES = [5, 10, 20, 50, Infinity] // cards per round; Infinity = whole pool
const FILTER_LABEL: Record<Filter, string> = {
  M: 'Middle',
  H: 'High',
  L: 'Low',
  All: 'All',
}

type Item = Letter | ToneWord | Vowel | Sentence
type Screen =
  | { s: 'home' }
  | { s: 'drill'; letter: Letter; n: number }
  | {
      s: 'round'
      mode: Mode
      queue: Item[]
      i: number
      missed: Item[]
      right: number
      t0: number
      times: number[]
      wrong: string[] // split mode: words not isolated correctly
      paused?: number
    }
  | {
      s: 'end'
      mode: Mode
      queue: Item[]
      right: number
      missed: Item[]
      times: number[]
      wrong: string[]
    }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ s: 'home' })
  const [filter, setFilter] = useState<Filter>('All')
  const [reverse, setReverse] = useState(false)
  const [size, setSize] = useState(Infinity)
  const [textbook, setTextbook] = useState(false)
  useEffect(() => {
    document.documentElement.dataset.font = textbook ? 'textbook' : 'system'
    document.documentElement.dataset.lang = lang
  }, [textbook])
  const km = lang === 'km'
  const [confirm, setConfirm] = useState(false)
  const [, bump] = useState(0)

  // P pauses / resumes a round; the paused time is excluded from the card's time
  useKeys((k) => {
    if (k !== 'P' || screen.s !== 'round') return
    setScreen(
      screen.paused
        ? {
            ...screen,
            paused: undefined,
            t0: screen.t0 + Date.now() - screen.paused,
          }
        : { ...screen, paused: Date.now() },
    )
  })

  const poolOf = (mode: Mode): Item[] => mode === 'tones' ? filterToneWords(filter) : mode === 'vowels' ? VOWELS : mode === 'split' ? SENTENCES : filterLetters(filter)
  const start = (mode: Mode, queue: Item[] = drawRound(mode, shuffle(poolOf(mode)).slice(0, size))) =>
    setScreen({
      s: 'round',
      mode,
      queue,
      i: 0,
      missed: [],
      right: 0,
      t0: Date.now(),
      times: [],
      wrong: [],
    })

  if (screen.s === 'home')
    return (
      <main className="home">
        <header className="bar">
          <h1>{km ? 'Khmer' : 'Thai consonants'}</h1>
          <div className="seg lang" role="radiogroup" aria-label="Language">
            {(['th', 'km'] as const).map((l) => (
              <button key={l} className={lang === l ? 'on' : ''} aria-checked={lang === l} role="radio" onClick={() => lang !== l && setLang(l)}>
                {l === 'th' ? 'Thai' : 'Khmer'}
              </button>
            ))}
          </div>
        </header>
        <p className="muted">{km ? 'Word splitting' : '40 letters'} · progress saved in this browser</p>
        {!km && <div className="seg" role="radiogroup" aria-label="Letter class filter">
          {FILTERS.map((f) => (
            <button key={f} className={filter === f ? 'on' : ''} aria-checked={filter === f} role="radio" onClick={() => setFilter(f)}>
              {FILTER_LABEL[f]}
            </button>
          ))}
        </div>}
        <div className="seg" role="radiogroup" aria-label="Cards per round">
          {SIZES.map((n) => (
            <button key={n} className={size === n ? 'on' : ''} aria-checked={size === n} role="radio" onClick={() => setSize(n)}>
              {n === Infinity ? 'All' : n}
            </button>
          ))}
        </div>
        <p className="muted small">Cards per round</p>
        <div className="modes">
          {MODES.map((m) => (
            <button key={m} className="mode" onClick={() => start(m)}>
              <strong>{MODE_INFO[m][0]}</strong>
              <span className="muted">{MODE_INFO[m][1]}</span>
              <span className="mastery">
                {mastered(m)} / {(m === 'tones' ? TONE_WORDS : m === 'vowels' ? VOWELS : m === 'split' ? SENTENCES : LETTERS).length} mastered
              </span>
            </button>
          ))}
        </div>
        {!km && <button
          className="mode drill"
          onClick={() =>
            setScreen({
              s: 'drill',
              letter: drillNext(filterLetters(filter)),
              n: 0,
            })
          }
        >
          <strong>{MODE_INFO.drill[0]}</strong>
          <span className="muted">{MODE_INFO.drill[1]}</span>
          <span className="mastery">
            {mastered('drill')} / {LETTERS.length} mastered
          </span>
        </button>}
        {!km && <label className="toggle">
          <input type="checkbox" checked={reverse} onChange={(e) => setReverse(e.target.checked)} /> Names: show name, pick the letter
        </label>}
        {!km && <label className="toggle">
          <input type="checkbox" checked={textbook} onChange={(e) => setTextbook(e.target.checked)} /> Textbook font (looped, as on school charts)
        </label>}
        <div className="reset">
          {confirm ? (
            <>
              <span>Erase all progress?</span>
              <button
                className="btn danger"
                onClick={() => {
                  reset()
                  setConfirm(false)
                  bump((n) => n + 1)
                }}
              >
                Yes, reset
              </button>
              <button className="btn" onClick={() => setConfirm(false)}>
                Cancel
              </button>
            </>
          ) : (
            <button className="btn subtle" onClick={() => setConfirm(true)}>
              Reset progress
            </button>
          )}
        </div>
        <p className="muted small">{km ? 'Keys: Space play · Enter check / next · S show answer · Backspace clear' : 'Keys: M/H/L class · 1–5 options · Space mic / replay · Enter next / reveal · 1 got it, 2 missed'}</p>
      </main>
    )

  if (screen.s === 'drill') {
    const { letter, n } = screen
    const pool = filterLetters(filter)
    const onDone = (ok: boolean) => {
      record('drill', letter.ch, ok)
      setScreen({ s: 'drill', letter: drillNext(pool, letter), n: n + 1 })
    }
    return (
      <main>
        <header className="bar">
          <button className="btn subtle" onClick={() => setScreen({ s: 'home' })}>
            ← Home
          </button>
          <span>
            {MODE_INFO.drill[0]} · {FILTER_LABEL[filter]}
          </span>
          <span className="muted">
            {inPlay(pool).length} / {pool.length} in play
          </span>
        </header>
        <DrillMode key={n} letter={letter} onDone={onDone} />
      </main>
    )
  }

  if (screen.s === 'round') {
    const { mode, queue, i, missed, right, t0, times, wrong } = screen
    const letter = queue[i]
    const onDone = (ok: boolean, words: string[] = []) => {
      record(mode, letter.ch, ok)
      const next = {
        missed: ok ? missed : [...missed, letter],
        right: right + (ok ? 1 : 0),
        times: [...times, Date.now() - t0],
        wrong: [...wrong, ...words.filter((w) => !wrong.includes(w))],
      }
      if (i + 1 < queue.length) setScreen({ ...screen, ...next, i: i + 1, t0: Date.now() })
      else setScreen({ s: 'end', mode, queue, ...next })
    }
    const key = letter.ch // key resets per-card state
    const props = { letter: letter as Letter, onDone, key }
    const pause = () => setScreen({ ...screen, paused: Date.now() })
    const resume = () =>
      setScreen({
        ...screen,
        paused: undefined,
        t0: t0 + Date.now() - screen.paused!,
      })
    return (
      <main>
        <header className="bar">
          <button className="btn subtle" onClick={() => setScreen({ s: 'home' })}>
            ← Home
          </button>
          <span>
            {MODE_INFO[mode][0]}{mode !== 'vowels' && mode !== 'split' && ` · ${FILTER_LABEL[filter]}`}
          </span>
          <span className="muted">
            {i + 1} / {queue.length}
          </span>
          <button className="btn subtle" onClick={screen.paused ? resume : pause} aria-label={screen.paused ? 'Resume' : 'Pause'}>
            {screen.paused ? '▶' : '⏸'}
          </button>
          <button className="btn subtle" aria-label="Stop and show stats" onClick={() => (times.length ? setScreen({ s: 'end', mode, queue: queue.slice(0, times.length), right, missed, times, wrong }) : setScreen({ s: 'home' }))}>
            ⏹
          </button>
        </header>
        {screen.paused ? (
          <div className="card paused" onClick={resume}>
            <p>Paused</p>
            <button className="btn primary">
              Resume <kbd>P</kbd>
            </button>
          </div>
        ) : (
          <>
            {mode === 'class' && <ClassMode {...props} />}
            {mode === 'names' && <NamesMode {...props} reverse={reverse} />}
            {mode === 'speak' && <SpeakMode {...props} />}
            {mode === 'tones' && <ToneMode key={key} word={letter as ToneWord} onDone={onDone} />}
            {mode === 'vowels' && <VowelMode key={key} vowel={letter as Vowel} onDone={onDone} />}
            {mode === 'split' && <SplitMode key={key} sentence={letter as Sentence} onDone={onDone} />}
          </>
        )}
      </main>
    )
  }

  const { mode, queue, right, missed, times, wrong } = screen // queue = answered cards only
  const sec = (ms: number) => (ms / 1000).toFixed(1) + ' s'
  const byTime = queue.map((l, i) => [l, times[i]] as const).sort((a, b) => b[1] - a[1])
  return (
    <main className="end">
      <h2>Round done</h2>
      <div className="score">
        {right} / {queue.length}
      </div>
      <p className="muted">Average {sec(times.reduce((a, b) => a + b, 0) / times.length)} per card</p>
      {missed.length ? (
        <>
          <p className="muted">Missed</p>
          <div className="tiles">
            {missed.map((l) => (
              <div key={l.ch} className={`tile thai ${l.ch.length > 1 ? 'word' : ''}`} title={l.meaning}>
                {l.ch}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p>Perfect round 🎉</p>
      )}
      {wrong.length > 0 && (
        <>
          <p className="muted">Words you didn't split right</p>
          <div className="words">
            {wrong.map((w) => (
              <button key={w} className="word" onClick={() => playClip(w, w)} aria-label={`Play ${w}`}>
                <span className="thai">{w}</span>
                <small className="muted">{GLOSSARY[w]}</small>
              </button>
            ))}
          </div>
        </>
      )}
      <details className="times">
        <summary>Time per card</summary>
        <ol>
          {byTime.map(([l, ms]) => (
            <li key={l.ch}>
              <span className="thai">{l.ch}</span> <span className="muted">{sec(ms)}</span>
            </li>
          ))}
        </ol>
      </details>
      <div className="row">
        {missed.length > 0 && (
          <button className="btn primary" onClick={() => start(mode, missed)}>
            Retry missed
          </button>
        )}
        <button className="btn primary" onClick={() => start(mode)}>
          New round
        </button>
        <button className="btn" onClick={() => setScreen({ s: 'home' })}>
          Home
        </button>
      </div>
    </main>
  )
}
