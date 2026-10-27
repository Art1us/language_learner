export type Cls = 'M' | 'H' | 'L'
export type Letter = {
  ch: string
  cls: Cls
  thai: string // spoken name, e.g. "กอ ไก่"
  roman: string
  meaning: string
  start: string
  end: string // "-" = not used as a final
}

const raw = `ก|M|กอ ไก่|gor gài|chicken|g|k
ข|H|ขอ ไข่|khor khài|egg|kh|k
ค|L|คอ ควาย|khor khwaai|buffalo|kh|k
ฆ|L|คอ ระฆัง|khor rá-khang|bell|kh|k
ง|L|งอ งู|ngor nguu|snake|ng|ng
จ|M|จอ จาน|jor jaan|plate|j|t
ฉ|H|ฉอ ฉิ่ง|chor chìng|small cymbals|ch|-
ช|L|ชอ ช้าง|chor cháang|elephant|ch|t
ซ|L|ซอ โซ่|sor sôo|chain|s|t
ฌ|L|ฌอ เฌอ|chor cher|tree|ch|-
ญ|L|ยอ หญิง|yor yǐng|woman|y|n
ฐ|H|ถอ ฐาน|thor thǎan|pedestal|th|t
ฑ|L|ทอ มณโฑ|thor mon-thoo|Montho (Ramakien character)|th|t
ฒ|L|ทอ ผู้เฒ่า|thor phûu-thâo|old man|th|t
ณ|L|นอ เณร|nor neen|novice monk|n|n
ด|M|ดอ เด็ก|dor dèk|child|d|t
ต|M|ตอ เต่า|dtor dtào|turtle|dt|t
ถ|H|ถอ ถุง|thor thǔng|bag|th|t
ท|L|ทอ ทหาร|thor thá-hǎan|soldier|th|t
ธ|L|ทอ ธง|thor thong|flag|th|t
น|L|นอ หนู|nor nǔu|mouse|n|n
บ|M|บอ ใบไม้|bor bai-mái|leaf|b|p
ป|M|ปอ ปลา|bpor bplaa|fish|bp|p
ผ|H|ผอ ผึ้ง|phor phûeng|bee|ph|-
ฝ|H|ฝอ ฝา|for fǎa|lid|f|-
พ|L|พอ พาน|phor phaan|offering tray|ph|p
ฟ|L|ฟอ ฟัน|for fan|tooth|f|p
ภ|L|พอ สำเภา|phor sǎm-phao|junk (ship)|ph|p
ม|L|มอ ม้า|mor máa|horse|m|m
ย|L|ยอ ยักษ์|yor yák|giant|y|i (glide)
ร|L|รอ เรือ|ror ruea|boat|r|n
ล|L|ลอ ลิง|lor ling|monkey|l|n
ว|L|วอ แหวน|wor wǎen|ring|w|o/u (glide)
ศ|H|สอ ศาลา|sor sǎa-laa|pavilion|s|t
ษ|H|สอ ฤๅษี|sor rue-sǐi|hermit|s|t
ส|H|สอ เสือ|sor sǔea|tiger|s|t
ห|H|หอ หีบ|hor hìip|chest (box)|h|-
ฬ|L|ลอ จุฬา|lor jù-laa|star-shaped kite|l|n
อ|M|ออ อ่าง|or àang|basin|silent|vowel
ฮ|L|ฮอ นกฮูก|hor nók-hûuk|owl|h|-`

export const LETTERS: Letter[] = raw.split('\n').map((line) => {
  const [ch, cls, thai, roman, meaning, start, end] = line.split('|')
  return { ch, cls: cls as Cls, thai, roman, meaning, start, end }
})

export const CLASS_NAME: Record<Cls, string> = { M: 'Middle', H: 'High', L: 'Low' }

export type Filter = Cls | 'All'
export const filterLetters = (f: Filter) => (f === 'All' ? LETTERS : LETTERS.filter((l) => l.cls === f))

/** Example words per letter: one starting with it, one ending with it (syllable-initial / -final for rare letters). */
const rawEx = `ก|กา|crow|นก|bird
ข|ขา|leg|สุข|happiness
ค|คน|person|โรค|disease
ฆ|ฆ้อง|gong|เมฆ|cloud
ง|งู|snake|ดัง|loud
จ|จาน|plate|อาจ|may, might
ฉ|ฉัน|I||
ช|ช้าง|elephant|พืช|plant
ซ|ซ้าย|left|ก๊าซ|gas
ฌ|ฌาน|meditation||
ญ|ญาติ|relative|เชิญ|invite, please
ฐ|ฐาน|base|รัฐ|state
ฑ|มณโฑ|Montho|ครุฑ|Garuda
ฒ|ผู้เฒ่า|old man|วุฒิ|qualification
ณ|เณร|novice monk|คุณ|you
ด|ดาว|star|เผ็ด|spicy
ต|ตา|eye|ชีวิต|life
ถ|ถุง|bag|รถ|car
ท|ทาง|way|บาท|baht
ธ|ธง|flag|โกรธ|angry
น|นา|rice field|กิน|eat
บ|บ้าน|house|ครับ|polite particle (male)
ป|ปา|throw|รูป|picture
ผ|ผ้า|cloth||
ฝ|ฝน|rain||
พ|พ่อ|father|ภาพ|image
ฟ|ฟัน|tooth|ยีราฟ|giraffe
ภ|ภาพ|image|ลาภ|fortune
ม|มา|come|ลม|wind
ย|ยา|medicine|สาย|late
ร|ร้าน|shop|อาหาร|food
ล|ลา|donkey|ผล|result
ว|วัน|day|ข้าว|rice
ศ|ศาลา|pavilion|ประเทศ|country
ษ|ฤๅษี|hermit|พิษ|poison
ส|สาม|three|รส|taste
ห|หา|look for||
ฬ|จุฬา|kite|วาฬ|whale
อ|อ่าง|basin|พ่อ|father
ฮ|ฮา|ha (laughing)||`

export type Example = [word: string, meaning: string]
/** letter → { start, end }; missing = never used as final. */
export const EXAMPLES: Record<string, { start?: Example; end?: Example }> = Object.fromEntries(
  rawEx.split('\n').map((line) => {
    const [ch, sw, sm, ew, em] = line.split('|')
    return [ch, { start: [sw, sm] as Example, ...(ew && { end: [ew, em] as Example }) }]
  }),
)

/** Bundled clip name for a Thai string: hex code points, e.g. "กา" → "0e01-0e32.mp3" (see scripts/gen-audio.mjs). */
export const clipFile = (text: string) => [...text].map((c) => c.codePointAt(0)!.toString(16).padStart(4, '0')).join('-') + '.mp3'

// ---------- Tones ----------
export type Tone = 'mid' | 'low' | 'falling' | 'high' | 'rising'
export const TONES: Tone[] = ['mid', 'low', 'falling', 'high', 'rising']
/** [English, Thai, pitch contour as an SVG path in a 40x24 box (y down), colour]. */
export const TONE_NAME: Record<Tone, [en: string, th: string, path: string, color: string]> = {
  mid: ['Mid', 'สามัญ', 'M2 12 L38 13', '#4a7a1e'],
  low: ['Low', 'เอก', 'M2 10 Q20 14 38 22', '#2b5fd9'],
  falling: ['Falling', 'โท', 'M2 8 Q10 0 16 4 Q26 12 38 22', '#7a2fb3'],
  high: ['High', 'ตรี', 'M2 18 Q20 14 38 3', '#e8961e'],
  rising: ['Rising', 'จัตวา', 'M2 12 Q10 20 16 16 Q26 12 38 2', '#8a2a1e'],
}
export const MARK_NAME = ['no mark', 'ไม้เอก ่', 'ไม้โท ้', 'ไม้ตรี ๊', 'ไม้จัตวา ๋']

export type ToneWord = {
  ch: string // the word (same field name as Letter so progress/rounds work on both)
  meaning: string
  cls: Cls // class of the initial (ห นำ / clusters resolved by hand)
  syl: 'live' | 'short' | 'long' // live, or dead with short/long vowel
  mark: 0 | 1 | 2 | 3 | 4 // tone mark: none, เอก, โท, ตรี, จัตวา
  tone: Tone
}

/** The standard tone rule (see any class/tone chart). */
export function toneOf({ cls, syl, mark }: Pick<ToneWord, 'cls' | 'syl' | 'mark'>): Tone {
  if (mark === 1) return cls === 'L' ? 'falling' : 'low'
  if (mark === 2) return cls === 'L' ? 'high' : 'falling'
  if (mark === 3) return 'high'
  if (mark === 4) return 'rising'
  if (syl === 'live') return cls === 'H' ? 'rising' : 'mid'
  if (cls !== 'L') return 'low'
  return syl === 'long' ? 'falling' : 'high'
}

// word|meaning|class|syllable|mark
const rawTones = `กา|crow|M|live|0
ตา|eye|M|live|0
ดี|good|M|live|0
ปู|crab|M|live|0
ไก่|chicken|M|live|1
ไข่|egg|H|live|1
ป่า|forest|M|live|1
อ่าน|read|M|live|1
ต่อ|continue|M|live|1
สี่|four|H|live|1
บ้าน|house|M|live|2
เก้า|nine|M|live|2
ได้|can|M|live|2
ข้าว|rice|H|live|2
ห้า|five|H|live|2
ผ้า|cloth|H|live|2
เสื้อ|shirt|H|live|2
โต๊ะ|table|M|short|3
โจ๊ก|congee|M|long|3
ตั๋ว|ticket|M|live|4
เก๋|stylish|M|live|4
กัด|bite|M|short|0
ปาก|mouth|M|long|0
จาก|from|M|long|0
ขาด|torn|H|long|0
ผัก|vegetable|H|short|0
หก|six|H|short|0
ถูก|cheap, correct|H|long|0
ขา|leg|H|live|0
สี|colour|H|live|0
เสือ|tiger|H|live|0
สวย|beautiful|H|live|0
หมา|dog|H|live|0
ฉัน|I|H|live|0
คน|person|L|live|0
มา|come|L|live|0
ใคร|who|L|live|0
งู|snake|L|live|0
ยา|medicine|L|live|0
แม่|mother|L|live|1
พ่อ|father|L|live|1
ไม่|no|L|live|1
ที่|at|L|live|1
ว่า|that|L|live|1
เพื่อน|friend|L|live|1
ม้า|horse|L|live|2
น้ำ|water|L|live|2
ช้าง|elephant|L|live|2
ซ้าย|left|L|live|2
รัก|love|L|short|0
นก|bird|L|short|0
วัด|temple|L|short|0
เล็ก|small|L|short|0
คะ|polite particle (female, question)|L|short|0
มาก|much|L|long|0
ลูก|child|L|long|0
ยาก|difficult|L|long|0
ชอบ|like|L|long|0
นา|rice field|L|live|0
พา|lead, take along|L|live|0
หา|look for|H|live|0
ลา|donkey|L|live|0
ชา|tea|L|live|0
วา|wa (2 m)|L|live|0
อา|aunt / uncle (father's younger sibling)|M|live|0
ปา|throw|M|live|0
คา|stuck|L|live|0
งาน|work|L|live|0
ดาน|hard, solid|M|live|0
ทาน|eat (polite)|L|live|0
นาน|long time|L|live|0
จาน|plate|M|live|0
ดาว|star|M|live|0
ยาว|long|L|live|0
สาว|young woman|H|live|0
ขาว|white|H|live|0
กาว|glue|M|live|0
ดึง|pull|M|live|0
กิ่ง|branch|M|live|1
กิน|eat|M|live|0
บิน|fly|M|live|0
ยิน|hear|L|live|0
ดิน|earth|M|live|0
ฟิน|blissful (slang)|L|live|0
กัน|together|M|live|0
วัน|day|L|live|0
พัน|thousand|L|live|0
มัน|it|L|live|0
ดอน|highland|M|live|0
นอน|sleep|L|live|0
ฟอน|font|L|live|0
กอด|hug|M|long|0
จอด|park|M|long|0
ตอด|peck|M|long|0
บอด|blind|M|long|0
คอม|computer|L|live|0
จอม|supreme|M|live|0
ดอม|sniff (old)|M|live|0
เกม|game|M|live|0
เวร|fate; shift|L|live|0`

export const TONE_WORDS: ToneWord[] = rawTones.split('\n').map((line) => {
  const [ch, meaning, cls, syl, mark] = line.split('|') as [string, string, Cls, ToneWord['syl'], string]
  const w = { ch, meaning, cls, syl, mark: Number(mark) as ToneWord['mark'] }
  return { ...w, tone: toneOf(w) }
})
export const filterToneWords = (f: Filter) => (f === 'All' ? TONE_WORDS : TONE_WORDS.filter((w) => w.cls === f))

// ---- Complex vowels (two or more symbols) ----
export type Vowel = { ch: string; len: 'short' | 'long'; word: string; meaning: string }
/** form|length|example word|meaning. The form uses อ / - as the consonant placeholder. */
const rawVowels = `เอะ|short|เตะ|kick
แอะ|short|แกะ|sheep
โอะ|short|โต๊ะ|table
เอาะ|short|เกาะ|island
เออะ|short|เยอะ|a lot
เออ|long|เธอ|you (familiar)
เอีย|long|เสีย|broken; to lose, spend
เอือ|long|เรือ|boat
อัว|long|ตัว|body
เอา|long|เขา|he, she; mountain
เอ็-|short|เล็ก|small
แอ็-|short|แข็ง|hard
เอิ-|long|เกิด|be born
-ว-|long|ด้วย|also, with
เ-ย|long|เคย|ever, used to`
export const VOWELS: Vowel[] = rawVowels.split('\n').map((line) => {
  const [ch, len, word, meaning] = line.split('|') as [string, Vowel['len'], string, string]
  return { ch, len, word, meaning }
})
