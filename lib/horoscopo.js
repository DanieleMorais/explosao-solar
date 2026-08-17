import fs from 'fs'
import path from 'path'

export const SIGNOS = [
  { slug: 'aries', nome: 'Áries', simbolo: '♈', periodo: '21/03 – 19/04', elemento: 'Fogo', cor: '#E4572E' },
  { slug: 'touro', nome: 'Touro', simbolo: '♉', periodo: '20/04 – 20/05', elemento: 'Terra', cor: '#4C9A2A' },
  { slug: 'gemeos', nome: 'Gêmeos', simbolo: '♊', periodo: '21/05 – 20/06', elemento: 'Ar', cor: '#F2C14E' },
  { slug: 'cancer', nome: 'Câncer', simbolo: '♋', periodo: '21/06 – 22/07', elemento: 'Água', cor: '#3A86FF' },
  { slug: 'leao', nome: 'Leão', simbolo: '♌', periodo: '23/07 – 22/08', elemento: 'Fogo', cor: '#FF8C00' },
  { slug: 'virgem', nome: 'Virgem', simbolo: '♍', periodo: '23/08 – 22/09', elemento: 'Terra', cor: '#6B8E23' },
  { slug: 'libra', nome: 'Libra', simbolo: '♎', periodo: '23/09 – 22/10', elemento: 'Ar', cor: '#D081C4' },
  { slug: 'escorpiao', nome: 'Escorpião', simbolo: '♏', periodo: '23/10 – 21/11', elemento: 'Água', cor: '#8E2D45' },
  { slug: 'sagitario', nome: 'Sagitário', simbolo: '♐', periodo: '22/11 – 21/12', elemento: 'Fogo', cor: '#C1440E' },
  { slug: 'capricornio', nome: 'Capricórnio', simbolo: '♑', periodo: '22/12 – 19/01', elemento: 'Terra', cor: '#5C4033' },
  { slug: 'aquario', nome: 'Aquário', simbolo: '♒', periodo: '20/01 – 18/02', elemento: 'Ar', cor: '#00A8CC' },
  { slug: 'peixes', nome: 'Peixes', simbolo: '♓', periodo: '19/02 – 20/03', elemento: 'Água', cor: '#5E60CE' },
]

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
