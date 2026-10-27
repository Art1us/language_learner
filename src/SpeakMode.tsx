import { useEffect, useRef, useState } from 'react'
import { matchTranscript, type Verdict as V } from './match'
import { SR, canRecord, playName, startRecording, type SpeechRecognition } from './speech'
import { BigLetter, LetterInfo, Verdict, useKeys, type CardProps } from './ui'

const MAX = 3

export function SpeakMode({ letter, onDone }: CardProps) {
  const [listening, setListening] = useState(false)
  const [heard, setHeard] = useState<string[]>([])
  const [verdict, setVerdict] = useState<V | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [myAudio, setMyAudio] = useState<string | null>(null)
  const [voiceMsg, setVoiceMsg] = useState('')
  const [err, setErr] = useState('')
  const recRef = useRef<SpeechRecognition | null>(null)
  const [passed, setPassed] = useState(false)
  const done = passed || revealed
  const pass = passed

  useEffect(() => () => recRef.current?.abort(), [])

  const hear = async () => setVoiceMsg((await playName(letter)) ? '' : 'No audio: no Thai voice installed in your OS.')

  const finish = (v: V | null) => {
    if (v) setVerdict(v)
    if (v === 'correct' || v === 'close') setPassed(true)
    if ((v === 'wrong' || v === null) && !passed) {
      const n = attempts + 1
      setAttempts(n)
      if (n >= MAX) setRevealed(true)
    }
  }

  // Browser recognizer + MediaRecorder together so the user can replay their own voice.
  const listen = async () => {
    if (!SR || listening || revealed) return
    setErr('')
    setHeard([])
    setVerdict(null)
    const rec = new SR()
    recRef.current = rec
    rec.lang = 'th-TH'
    rec.maxAlternatives = 5
    rec.interimResults = false
    let recorder: Awaited<ReturnType<typeof startRecording>> | null = null
    if (canRecord()) recorder = await startRecording().catch(() => null)
    let result: V | null = null
    rec.onresult = (e) => {
      const alts = [...e.results[0]].map((r) => r.transcript)
      setHeard(alts)
      result = matchTranscript(alts, letter)
    }
    rec.onerror = (e) => { if (e.error !== 'no-speech' && e.error !== 'aborted') setErr(`Recognition error: ${e.error}`) }
    rec.onend = async () => {
      setListening(false)
      if (recorder) setMyAudio(await recorder.stop())
      finish(result ?? 'wrong')
    }
    rec.start()
    setListening(true)
  }

  // Fallback when SpeechRecognition is unsupported: record, then self-grade.
  const recorderRef = useRef<Awaited<ReturnType<typeof startRecording>> | null>(null)
  const toggleRecord = async () => {
    if (recorderRef.current) {
      setMyAudio(await recorderRef.current.stop())
      recorderRef.current = null
      setListening(false)
    } else {
      recorderRef.current = await startRecording().catch(() => { setErr('Microphone not available'); return null })
      setListening(!!recorderRef.current)
    }
  }

  useKeys((k, e) => {
    if (k === 'Space') {
      e.preventDefault()
      if (SR) listen()
      else toggleRecord()
    }
    if (k === 'Enter' && done) onDone(pass)
  })

  return (
    <div className="card">
      <BigLetter l={letter} />
      {!SR && (
        <p className="notice">
          Speech recognition isn't supported in this browser (works in Chrome, Edge, Safari). Record yourself, compare with the reference, then grade yourself.
        </p>
      )}
      {voiceMsg && <p className="warn">{voiceMsg}</p>}
      <div className="row">
        <button className="btn" onClick={hear}>🔊 Hear it</button>
        {SR ? (
          <button className={`btn primary mic ${listening ? 'live' : ''}`} disabled={revealed} onClick={listen}>
            {listening ? '● Listening…' : passed ? '🎤 Try again' : '🎤 Say it'} <kbd>␣</kbd>
          </button>
        ) : (
          <button className={`btn primary mic ${listening ? 'live' : ''}`} disabled={done || !canRecord()} onClick={toggleRecord}>
            {listening ? '■ Stop' : '● Record'} <kbd>␣</kbd>
          </button>
        )}
      </div>
      {!done && SR && (
        <p className="muted">
          Say the full name: <span className="thai">“{letter.thai}”</span> ({letter.meaning}) · attempt {Math.min(attempts + 1, MAX)} of {MAX}
        </p>
      )}
      {err && <p className="warn">{err}</p>}
      {heard.length > 0 && (
        <div className="heard">
          <div className="muted">Heard:</div>
          {heard.map((h, i) => <div key={i} className="thai">{h || '(nothing)'}</div>)}
        </div>
      )}
      {myAudio && (
        <div className="playback">
          <span className="muted">Your voice:</span> <audio controls src={myAudio} />
        </div>
      )}
      {verdict && !revealed && (
        <Verdict ok={verdict !== 'wrong'}>
          {verdict === 'correct' ? 'Correct!' : verdict === 'close' ? 'Close – key word recognized, class syllable missing' : passed ? 'Not recognized this time – still counts as passed' : 'Try again'}
        </Verdict>
      )}
      {!SR && !done && myAudio && (
        <div className="row">
          <button className="btn primary" onClick={() => finish('correct')}>I got it</button>
          <button className="btn" onClick={() => setRevealed(true)}>Not yet</button>
        </div>
      )}
      {done && (
        <>
          {revealed && !pass && <Verdict ok={false}>The answer is {letter.thai}</Verdict>}
          <LetterInfo l={letter} />
          <button className="btn primary wide" onClick={() => onDone(pass)}>Next <kbd>↵</kbd></button>
        </>
      )}
    </div>
  )
}
