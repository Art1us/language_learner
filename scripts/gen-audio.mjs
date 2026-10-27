// Pre-renders each letter name (keyed by the letter), each example word and each split-mode word/sentence (keyed by itself)
// into public/audio/<codepoints>.mp3. Bundled clips are used because Chrome on macOS drops
// Thai text passed to speechSynthesis.
//
//   ELEVENLABS_API_KEY=... VOICE=<voice id> npm run audio   ElevenLabs v3 (or put both in .env)
//   npm run audio                             Microsoft Edge "Niwat" voice via edge-tts (auto-installed into node_modules/.cache/edge-tts)
//   LANG=km npm run audio                     Khmer split-mode words + sentences (Edge "Piseth" voice; VOICE=km-KH-SreymomNeural for female)
//
// Existing clips are skipped (FORCE=1 re-renders all), so an interrupted run can just be re-run.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { EXAMPLES, LETTERS, TONE_WORDS, VOWELS, clipFile } from '../src/data.ts'

const KM = process.env.LANG === 'km'
const { sentences, glossary } = JSON.parse(readFileSync(KM ? 'src/sentences.km.json' : 'src/sentences.json', 'utf8')) // split mode: every word + every sentence

const KEY = process.env.ELEVENLABS_API_KEY
const EDGE_TTS = process.env.EDGE_TTS ?? edgeTts()
// ElevenLabs: a voice id from https://elevenlabs.io/app/voice-library (default: "George", male).
// Edge: th-TH-NiwatNeural (male) or th-TH-PremwadeeNeural (female).
const VOICE = process.env.VOICE ?? (KEY ? 'JBFqnCBsd6RMkjVDRZzb' : KM ? 'km-KH-PisethNeural' : 'th-TH-NiwatNeural')

async function elevenlabs(text, out) {
  for (;;) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_64`, {
      method: 'POST',
      headers: { 'xi-api-key': KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ text, model_id: 'eleven_v3', language_code: KM ? 'km' : 'th' }),
    })
    if (r.status === 429) { process.stdout.write('(rate limited, waiting 10s) '); await new Promise((f) => setTimeout(f, 10_000)); continue }
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
    writeFileSync(out, Buffer.from(await r.arrayBuffer()))
    return
  }
}

/** Path to edge-tts; installs it into a project-local venv on first use (no system pip). */
function edgeTts() {
  if (KEY) return
  const venv = 'node_modules/.cache/edge-tts'
  const bin = `${venv}/bin/edge-tts`
  if (!existsSync(bin)) {
    console.log('installing edge-tts into ' + venv)
    execFileSync('python3', ['-m', 'venv', venv], { stdio: 'inherit' })
    execFileSync(`${venv}/bin/pip`, ['install', '-q', 'edge-tts'], { stdio: 'inherit' })
  }
  return bin
}

mkdirSync('public/audio', { recursive: true })
const clips = KM
  ? [...Object.keys(glossary), ...sentences.map((x) => x.thai)].map((w) => [w, w])
  : [
      ...LETTERS.map((l) => [l.ch, l.thai]),
      ...[...new Set([...Object.values(EXAMPLES).flatMap((e) => [e.start?.[0], e.end?.[0]].filter(Boolean)), ...TONE_WORDS.map((w) => w.ch), ...VOWELS.map((v) => v.word), ...Object.keys(glossary), ...sentences.map((x) => x.thai)])].map((w) => [w, w]),
    ]
for (const [key, text] of clips) {
  const out = `public/audio/${clipFile(key)}`
  if (process.env.FORCE !== '1' && existsSync(out)) continue
  if (KEY) await elevenlabs(text, out)
  else execFileSync(EDGE_TTS, ['--voice', VOICE, '--rate=-10%', '--text', text, '--write-media', out])
  process.stdout.write(key + ' ')
}
console.log('\ndone')
