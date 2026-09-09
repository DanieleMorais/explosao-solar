import fs from 'fs'
import path from 'path'

import { SIGNOS } from './signos.js'
export { SIGNOS }

// número da sorte do dia (determinístico por signo + data)
export function numeroSorte(slug, dataISO = '') {
  let h = 0
  const s = slug + dataISO
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return (h % 60) + 1
}

export function signoDe(slug) {
  return SIGNOS.find((s) => s.slug === slug) || null
}

// lê content/horoscopo.json = { data, dataFmt, signos: { aries: "texto", ... } }
export function getHoroscopo() {
  try {
    const p = path.join(process.cwd(), 'content', 'horoscopo.json')
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return null
  }
}
