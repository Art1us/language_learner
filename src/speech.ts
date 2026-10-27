// Pronunciation playback + speech recognition helpers.
import { clipFile, type Letter } from './data'
import { lang } from './lang'

const isThai = (v: SpeechSynthesisVoice) => v.lang.replace('_', '-').toLowerCase().startsWith(lang)

export function thaiVoice(): SpeechSynthesisVoice | undefined {
  if (!('speechSynthesis' in window)) return
  const vs = speechSynthesis.getVoices().filter(isThai)
  return vs.find((v) => /google/i.test(v.name)) ?? vs.find((v) => /premium|enhanced/i.test(v.name)) ?? vs[0]
}

/** Voices load async in Chrome; resolve once the list is populated. */
export const voicesReady = (): Promise<void> =>
  new Promise((res) => {
    if (!('speechSynthesis' in window) || speechSynthesis.getVoices().length) return res()
    speechSynthesis.addEventListener('voiceschanged', () => res(), { once: true })
    setTimeout(res, 1500) // some browsers never fire the event
  })

/** Plays the bundled clip for a letter; falls back to TTS. Returns false if nothing could play. */
/** Play the bundled clip for `key` (a letter or example word), else speak `text`. */
export async function playClip(key: string, text: string): Promise<boolean> {
  try {
    const a = new Audio(`${import.meta.env.BASE_URL}audio/${clipFile(key)}`)
    await a.play()
    return true
  } catch {
    return speakThai(text)
  }
}
export const playName = (l: Letter) => playClip(l.ch, l.thai)

/** Returns false if no Thai voice is installed. */
export async function speakThai(text: string): Promise<boolean> {
  await voicesReady()
  const v = thaiVoice()
  if (!v) return false
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.voice = v
  u.lang = v.lang
  u.rate = 0.85
  speechSynthesis.speak(u)
  return true
}

/** Minimal Web Speech API shape (lib.dom only ships the event types). */
export type SpeechRecognition = {
  lang: string
  maxAlternatives: number
  interimResults: boolean
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}
type SRCtor = new () => SpeechRecognition
export const SR: SRCtor | undefined =
  (window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor }).SpeechRecognition ??
  (window as unknown as { webkitSpeechRecognition?: SRCtor }).webkitSpeechRecognition

export const canRecord = () => !!navigator.mediaDevices?.getUserMedia && 'MediaRecorder' in window

/** Records mic audio until stop() is called; resolves with an object URL for playback. */
export async function startRecording(): Promise<{ stop: () => Promise<string | null> }> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const rec = new MediaRecorder(stream)
  const chunks: Blob[] = []
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
  rec.start()
  return {
    stop: () =>
      new Promise((res) => {
        rec.onstop = () => {
          stream.getTracks().forEach((t) => t.stop())
          res(chunks.length ? URL.createObjectURL(new Blob(chunks, { type: rec.mimeType })) : null)
        }
        if (rec.state === 'inactive') rec.onstop(new Event('stop'))
        else rec.stop()
      }),
  }
}
