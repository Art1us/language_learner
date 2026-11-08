import { useEffect, useState } from 'react'
import { ClassMode } from './ClassMode'
import { NamesMode } from './NamesMode'
import { DrillMode } from './DrillMode'
import { SpeakMode } from './SpeakMode'
import { ToneMode } from './ToneMode'
import { VowelMode } from './VowelMode'
import { SplitMode } from './SplitMode'
import { VocabMode, VOCAB, PHRASES, type Vocab } from './VocabMode'
import { GLOSSARY, SENTENCES, type Sentence } from './split'
import { LETTERS, TONE_WORDS, VOWELS, filterLetters, filterToneWords, type Filter, type Letter, type ToneWord, type Vowel } from './data'
import { useKeys } from './ui'
import { playClip } from './speech'
import { lang, setLang } from './lang'
import { MODES, drawRound, shuffle, drillNext, inPlay, mastered, getBox, record, reset, resetMode, type Mode } from './store'

const MODE_INFO: Record<Mode, [string, string]> = {
  class: ['Class & sounds', 'Middle, high or low? Then the start and end sounds.'],
  names: ['Names', 'Pick the right name for the letter (or the letter for the name).'],
  speak: ['Speak', 'Say the letter name aloud and get checked by speech recognition.'],
  tones: ['Tones', 'One-syllable word: which of the 5 tones? Learn the class / syllable / tone-mark rule.'],
  vowels: ['Complex vowels', 'Read the word aloud, play it, then mark yourself right or wrong.'],
  split: ['Split the sentence', 'A sentence with no spaces: tap where each word ends, then check.'],
  vocab: ['Vocabulary Thai → English', 'A Thai word: recall the meaning, reveal, then Remember or Don\'t remember.'],
  vocabrev: ['Vocabulary English → Thai', 'An English word: Remember or Don\'t remember first, then see the Thai.'],
  sent: ['Sentences Thai → English', 'A Thai sentence: recall the meaning, reveal, then Remember or Don\'t remember.'],
  sentrev: ['Sentences English → Thai', 'An English sentence: Remember or Don\'t remember first, then see the Thai.'],
  learn: ['Learn vocabulary', 'New words come in gradually, most important and easiest first. Words you miss come back often, known ones rarely.'],
  drill: ['Learn step by step', 'Letters come in one at a time. Recall class, sounds and name, reveal, then mark yourself right or wrong.'],
}
/** Self-graded flashcard modes and their card lists; '…rev' = English on the front. */
const FLASH: Partial<Record<Mode, Vocab[]>> = { learn: VOCAB, vocab: VOCAB, vocabrev: VOCAB, sent: PHRASES, sentrev: PHRASES }
const FILTERS: Filter[] = ['M', 'H', 'L', 'All']
const SIZES = [5, 10, 20, 50, Infinity] // cards per round; Infinity = whole pool
const TIERS = ['Core', 'Everyday', 'Broad', 'Niche'] // vocabulary tier 1..4
const LEVELS = ['Easy', 'Medium', 'Hard'] // vocabulary complexity 1..3
/** Multi-select toggle that never leaves the selection empty. */
const toggle = (xs: number[], x: number) => (xs.includes(x) ? (xs.length > 1 ? xs.filter((y) => y !== x) : xs) : [...xs, x].sort())
const VOCAB_MODES: Mode[] = ['learn', 'vocab', 'vocabrev'] // filtered by tier and complexity
const LEARN = { mode: 'learn' as const, start: 5, maxWeak: 3 } // 5 words to start; a new one while < 3 are weak
/** Learn-mode introduction order: by tier, then complexity, shuffled within each bucket once per page load. */
const LEARN_ORDER = shuffle(VOCAB).sort((a, b) => a.tier! - b.tier! || a.complexity! - b.complexity!)
const usesFilter = (m: Mode) => m !== 'vowels' && m !== 'split' && !FLASH[m]

function Seg<T>({ label, opts, on, pick, name = String }: { label: string; opts: T[]; on: (o: T) => boolean; pick: (o: T) => void; name?: (o: T) => string }) {
  return (
    <>
      <p className="muted small">{label}</p>
      <div className="seg" role="group" aria-label={label}>
        {opts.map((o) => (
          <button key={String(o)} className={on(o) ? 'on' : ''} aria-pressed={on(o)} onClick={() => pick(o)}>
            {name(o)}
          </button>
        ))}
      </div>
    </>
  )
}

const FILTER_LABEL: Record<Filter, string> = {
  M: 'Middle',
  H: 'High',
  L: 'Low',
  All: 'All',
}

type Item = Letter | ToneWord | Vowel | Sentence | Vocab
type Screen =
  | { s: 'home' }
  | { s: 'setup'; mode: Mode }
  | { s: 'drill'; mode: 'drill' | 'learn'; letter: Letter | Vocab; n: number }
  | {
      s: 'round'
      mode: Mode
      queue: Item[]
      i: number
      missed: Item[]
      right: number
      t0: number
      times: number[]
      wrong: string[] // split mode: words not isolated correctly (unique)
      nWrong: number // split mode: every wrong word, counted per sentence
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
      nWrong: number
    }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ s: 'home' })
  const [filter, setFilter] = useState<Filter>('All')
  const [reverse, setReverse] = useState(false)
  const [size, setSize] = useState(Infinity)
  const [tiers, setTiers] = useState([1])
  const [levels, setLevels] = useState([1, 2, 3])
  const [learnRev, setLearnRev] = useState(false)
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

  const vocabFilter = (w: Vocab) => tiers.includes(w.tier!) && levels.includes(w.complexity!)
  const poolOf = (mode: Mode): Item[] => mode === 'tones' ? filterToneWords(filter) : mode === 'vowels' ? VOWELS : mode === 'split' ? SENTENCES : VOCAB_MODES.includes(mode) ? VOCAB.filter(vocabFilter) : FLASH[mode] ?? filterLetters(filter)
  // progressive pools, in the order new items are introduced
  const drillPool = (mode: 'drill' | 'learn'): (Letter | Vocab)[] =>
    mode === 'drill' ? filterLetters(filter) : LEARN_ORDER.filter(vocabFilter)
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
      nWrong: 0,
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
        <div className="modes">
          {MODES.map((m) => (
            <button key={m} className="mode" onClick={() => setScreen({ s: 'setup', mode: m })}>
              <strong>{MODE_INFO[m][0]}</strong>
              <span className="muted">{MODE_INFO[m][1]}</span>
              <span className="mastery">
                {mastered(m)} / {(m === 'tones' ? TONE_WORDS : m === 'vowels' ? VOWELS : m === 'split' ? SENTENCES : FLASH[m] ?? LETTERS).length} mastered
              </span>
            </button>
          ))}
        </div>
        {!km && <button
          className="mode drill"
          onClick={() => setScreen({ s: 'setup', mode: 'drill' })}
        >
          <strong>{MODE_INFO.drill[0]}</strong>
          <span className="muted">{MODE_INFO.drill[1]}</span>
          <span className="mastery">
            {mastered('drill')} / {LETTERS.length} mastered
          </span>
        </button>}
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
        <p className="muted small keys">{km ? 'Keys: Space play · Enter check / next · S show answer · Backspace clear' : 'Keys: M/H/L class · 1–5 options · Space mic / replay · Enter next / reveal · 1 got it, 2 missed'}</p>
      </main>
    )

  if (screen.s === 'setup') {
    const m = screen.mode
    const progressive = m === 'drill' || m === 'learn'
    const pool: Item[] = progressive ? drillPool(m) : poolOf(m)
    const go = () => (progressive ? setScreen({ s: 'drill', mode: m, letter: drillNext(pool as (Letter | Vocab)[], undefined, m === 'learn' ? LEARN : {}), n: 0 }) : start(m))
    return (
      <main className="home">
        <header className="bar">
          <button className="btn subtle" onClick={() => { setConfirm(false); setScreen({ s: 'home' }) }}>
            ← Home
          </button>
        </header>
        <h1>{MODE_INFO[m][0]}</h1>
        <p className="muted">{MODE_INFO[m][1]}</p>
        {usesFilter(m) && <Seg label="Letter class" opts={FILTERS} on={(f) => f === filter} pick={setFilter} name={(f) => FILTER_LABEL[f]} />}
        {VOCAB_MODES.includes(m) && (
          <>
            <Seg label="Tier (most important first)" opts={[1, 2, 3, 4]} on={(t) => tiers.includes(t)} pick={(t) => setTiers(toggle(tiers, t))} name={(t) => TIERS[t - 1]} />
            <Seg label="Complexity" opts={[1, 2, 3]} on={(c) => levels.includes(c)} pick={(c) => setLevels(toggle(levels, c))} name={(c) => LEVELS[c - 1]} />
          </>
        )}
        {m === 'learn' && <Seg label="Direction" opts={[false, true]} on={(r) => r === learnRev} pick={setLearnRev} name={(r) => (r ? 'English → Thai' : 'Thai → English')} />}
        {!progressive && <Seg label="Cards per round" opts={SIZES} on={(n) => n === size} pick={setSize} name={(n) => (n === Infinity ? 'All' : String(n))} />}
        {m === 'names' && (
          <label className="toggle">
            <input type="checkbox" checked={reverse} onChange={(e) => setReverse(e.target.checked)} /> Show name, pick the letter
          </label>
        )}
        <p className="muted">
          {pool.length} cards{progressive && ` · ${inPlay(pool, m).length} in play`} · {pool.filter((x) => getBox(m, x.ch) >= 4).length} mastered
        </p>
        <button className="btn primary wide" disabled={!pool.length} onClick={go}>
          Start
        </button>
        {inPlay(pool, m).length > 0 && (
          <div className="reset">
            {confirm ? (
              <>
                <span>Erase progress for this exercise?</span>
                <button className="btn danger" onClick={() => { resetMode(m); setConfirm(false) }}>
                  Yes, reset
                </button>
                <button className="btn" onClick={() => setConfirm(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="btn subtle" onClick={() => setConfirm(true)}>
                Reset progress for this exercise
              </button>
            )}
          </div>
        )}
      </main>
    )
  }

  if (screen.s === 'drill') {
    const { mode, letter, n } = screen
    const pool = drillPool(mode)
    const onDone = (ok: boolean) => {
      record(mode, letter.ch, ok)
      setScreen({ s: 'drill', mode, letter: drillNext(pool, letter, mode === 'learn' ? LEARN : {}), n: n + 1 })
    }
    return (
      <main>
        <header className="bar">
          <button className="btn subtle" onClick={() => setScreen({ s: 'setup', mode })}>
            ← Back
          </button>
          <span>
            {MODE_INFO[mode][0]}{mode === 'drill' && ` · ${FILTER_LABEL[filter]}`}
          </span>
          <span className="muted">
            {inPlay(pool, mode).length} / {pool.length} in play
          </span>
        </header>
        {mode === 'drill' ? <DrillMode key={n} letter={letter as Letter} onDone={onDone} /> : <VocabMode key={n} word={letter as Vocab} reverse={learnRev} onDone={onDone} />}
      </main>
    )
  }

  if (screen.s === 'round') {
    const { mode, queue, i, missed, right, t0, times, wrong, nWrong } = screen
    const letter = queue[i]
    const onDone = (ok: boolean, words: string[] = []) => {
      record(mode, letter.ch, ok)
      const next = {
        missed: ok ? missed : [...missed, letter],
        right: right + (ok ? 1 : 0),
        times: [...times, Date.now() - t0],
        wrong: [...wrong, ...words.filter((w) => !wrong.includes(w))],
        nWrong: nWrong + words.length,
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
          <button className="btn subtle" onClick={() => setScreen({ s: 'setup', mode })}>
            ← Back
          </button>
          <span>
            {MODE_INFO[mode][0]}{mode !== 'vowels' && mode !== 'split' && !FLASH[mode] && ` · ${FILTER_LABEL[filter]}`}
          </span>
          <span className="muted">
            {i + 1} / {queue.length}
          </span>
          <button className="btn subtle" onClick={screen.paused ? resume : pause} aria-label={screen.paused ? 'Resume' : 'Pause'}>
            {screen.paused ? '▶' : '⏸'}
          </button>
          <button className="btn subtle" aria-label="Stop and show stats" onClick={() => (times.length ? setScreen({ s: 'end', mode, queue: queue.slice(0, times.length), right, missed, times, wrong, nWrong }) : setScreen({ s: 'setup', mode }))}>
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
            {FLASH[mode] && <VocabMode key={key} word={letter as Vocab} reverse={mode.endsWith('rev')} onDone={onDone} />}
          </>
        )}
      </main>
    )
  }

  const { mode, queue, right, missed, times, wrong, nWrong } = screen // queue = answered cards only
  const sec = (ms: number) => (ms / 1000).toFixed(1) + ' s'
  const nWords = mode === 'split' ? (queue as Sentence[]).reduce((n, s) => n + s.split.length, 0) : 0
  const byTime = queue.map((l, i) => [l, times[i]] as const).sort((a, b) => b[1] - a[1])
  return (
    <main className="end">
      <h2>Round done</h2>
      <div className="score">
        {right} / {queue.length}
      </div>
      <p className="muted">Average {sec(times.reduce((a, b) => a + b, 0) / times.length)} per card</p>
      {mode === 'split' && (
        <p className="muted">
          Mistakes: {Math.round((100 * nWrong) / nWords)}% of words ({nWrong} of {nWords})
        </p>
      )}
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
        <button className="btn" onClick={() => setScreen({ s: 'setup', mode })}>
          Settings
        </button>
      </div>
    </main>
  )
}
