# Thai consonants

Flashcard app for 40 Thai consonants (the 44 minus obsolete ฃ ฅ and rare ฎ ฏ): class & sounds, names, and speaking practice with Leitner spaced repetition. No backend; progress lives in `localStorage`.

## Setup

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests for the transcript matcher
npm run build    # production build in dist/
```

Requires Node 18+. Letters render in Noto Sans Thai Looped (loaded from Google Fonts; falls back to the system Thai font offline).

## Modes

- **Class & sounds** – Middle / High / Low (keys M / H / L). The answer card shows the start and end sound with a playable example word for each.
- **Names** – pick the name from 4 options (keys 1–4). Toggle on the home screen reverses it: see the name, pick the letter.
- **Complex vowels** – an example word for each multi-symbol vowel (เอีย, เอือ, อัว, เอ็-, เ-ย …). Read it aloud, play the clip (Space), mark yourself right or wrong (1/2). List in `src/data.ts` (`rawVowels`).
- **Tones** – a one-syllable word; pick its tone (keys 1–5). The answer shows the rule: class, live/dead syllable (and vowel length), tone mark. Word list in `src/data.ts` (`rawTones`), tone derived by `toneOf`.
- **Split the sentence** – a sentence with no spaces; tap a letter to put a word boundary after it (Backspace clears), Enter to check (or S to show the answer, which counts as missed), Enter again for the next one. Green = right cut, red = missed cut, dotted red = cut that shouldn't be there. 100 sentences in `src/sentences.json`.
- **Learn step by step** – separate button. Letters of the chosen class enter one at a time (3 to start, the next once all in play reach box 3). Recall, reveal (Enter), mark yourself Got it (1) or Missed (2). Weak letters repeat more, known ones less. No rounds, stop any time.
- **Thai / Khmer** toggle on the home screen (saved in `localStorage`, key `thai-consonants-lang`). Khmer has only **Split the sentence**, with 5 sentences in `src/sentences.km.json`; progress is kept separately. No Khmer audio clips: the speaker buttons fall back to a Khmer TTS voice if the OS has one, else stay silent.
- **Textbook font** toggle on the home screen: default is the system Thai font (what chats and the web show); on = Noto Sans Thai Looped, the school-chart style.
- **Speak** – press the mic (Space) and say the name, e.g. "gor gài". Hear the reference first, replay your own recording after. 3 attempts, then the answer is revealed.

⏸ in the header (or P) pauses a round; paused time is not counted. ⏹ ends the round early and shows the stats for the cards answered so far. The end screen shows the average time per card and a per-card list, slowest first. Each letter has 5 Leitner boxes per mode. Correct moves up one box, wrong resets to box 1. A round covers every card of the selected class, weak ones (low boxes) first; the **Cards per round** control (5 / 10 / 20 / 50 / All) caps it to a random subset. "Mastered" on the home screen = box 4–5.

## Browser support for Thai speech recognition

Speech recognition uses the Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`, `lang = th-TH`).

| Browser | Recognition | Thai TTS voice |
|---|---|---|
| Chrome / Edge (desktop, Android) | Yes – audio is sent to Google/Microsoft servers | Yes (Google "ไทย" voice online; or an OS voice) |
| Safari (macOS, iOS 14.5+) | Yes – uses Siri's recognizer; needs Siri/dictation enabled | Yes if the Thai voice (Kanya) is installed in system settings |
| Firefox | **No** – the app shows a notice and falls back to self-grading (record, compare, "I got it" / "Not yet") | Depends on OS voices |

Recognition needs a secure context (localhost or https) and mic permission.

### Reference audio

"Hear it" and the speaker buttons play pre-rendered clips from `public/audio/` (one `.mp3` per letter name, example word, tone/vowel word, and every split-mode word and sentence; male Thai voice "Niwat" from Microsoft Edge neural TTS, rendered with the free [edge-tts](https://github.com/rany2/edge-tts) tool). Bundled clips are used because Chrome on macOS silently drops Thai text passed to `speechSynthesis` (the utterance "ends" after ~100 ms with no sound). If a clip fails to load the app falls back to `speechSynthesis` with a Thai voice, and says so if none is installed.

Regenerate with `FORCE=1 ELEVENLABS_API_KEY=... npm run audio` (ElevenLabs v3, free key from https://elevenlabs.io, `VOICE=<voice id>` picks another voice) or, without a key, just `npm run audio` (edge-tts is installed into `node_modules/.cache/edge-tts` on first run; set `EDGE_TTS=/path/to/edge-tts` to use your own; `VOICE=th-TH-PremwadeeNeural` for the female voice). Existing clips are skipped; `FORCE=1` re-renders everything.

## Project layout

- `src/data.ts` – the 40 letters
- `src/match.ts` / `src/match.test.ts` – transcript matching (normalize, key word + class syllable)
- `src/store.ts` – Leitner boxes in localStorage
- `src/speech.ts` – clip playback / TTS fallback, recognition, MediaRecorder helpers
- `scripts/gen-audio.mjs` – renders `public/audio/*.mp3` with edge-tts
- `src/ClassMode.tsx`, `src/NamesMode.tsx`, `src/SpeakMode.tsx`, `src/App.tsx`, `src/ui.tsx`

## Not included

The optional cloud-recognition server (OpenAI / Google STT) is not built in v1.
