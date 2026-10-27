// Which language is being studied. Read once at load; changing it reloads the page so every module picks it up.
export type Lang = 'th' | 'km'
const KEY = 'thai-consonants-lang'
const get = (): Lang => { try { return localStorage.getItem(KEY) === 'km' ? 'km' : 'th' } catch { return 'th' } }
export const lang: Lang = get()
export function setLang(l: Lang) {
  try { localStorage.setItem(KEY, l) } catch { /* no storage */ }
  location.reload()
}
