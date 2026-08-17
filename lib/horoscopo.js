import fs from 'fs'
import path from 'path'

export const SIGNOS = [
  { slug: 'aries', nome: 'Áries', simbolo: '♈', periodo: '21/03 – 19/04', elemento: 'Fogo', cor: '#E4572E', regente: 'Marte', pedra: 'Diamante', corSorte: 'Vermelho', tracos: ['Corajoso', 'Impulsivo', 'Líder', 'Energético'], combina: ['leao', 'sagitario', 'gemeos'] },
  { slug: 'touro', nome: 'Touro', simbolo: '♉', periodo: '20/04 – 20/05', elemento: 'Terra', cor: '#4C9A2A', regente: 'Vênus', pedra: 'Esmeralda', corSorte: 'Verde', tracos: ['Determinado', 'Leal', 'Sensual', 'Prático'], combina: ['virgem', 'capricornio', 'cancer'] },
  { slug: 'gemeos', nome: 'Gêmeos', simbolo: '♊', periodo: '21/05 – 20/06', elemento: 'Ar', cor: '#F2C14E', regente: 'Mercúrio', pedra: 'Ágata', corSorte: 'Amarelo', tracos: ['Comunicativo', 'Curioso', 'Versátil', 'Espirituoso'], combina: ['libra', 'aquario', 'aries'] },
  { slug: 'cancer', nome: 'Câncer', simbolo: '♋', periodo: '21/06 – 22/07', elemento: 'Água', cor: '#3A86FF', regente: 'Lua', pedra: 'Pérola', corSorte: 'Prata', tracos: ['Sensível', 'Acolhedor', 'Intuitivo', 'Protetor'], combina: ['escorpiao', 'peixes', 'touro'] },
  { slug: 'leao', nome: 'Leão', simbolo: '♌', periodo: '23/07 – 22/08', elemento: 'Fogo', cor: '#FF8C00', regente: 'Sol', pedra: 'Rubi', corSorte: 'Dourado', tracos: ['Carismático', 'Generoso', 'Criativo', 'Orgulhoso'], combina: ['aries', 'sagitario', 'libra'] },
  { slug: 'virgem', nome: 'Virgem', simbolo: '♍', periodo: '23/08 – 22/09', elemento: 'Terra', cor: '#6B8E23', regente: 'Mercúrio', pedra: 'Safira', corSorte: 'Bege', tracos: ['Analítico', 'Detalhista', 'Prestativo', 'Organizado'], combina: ['touro', 'capricornio', 'cancer'] },
  { slug: 'libra', nome: 'Libra', simbolo: '♎', periodo: '23/09 – 22/10', elemento: 'Ar', cor: '#D081C4', regente: 'Vênus', pedra: 'Opala', corSorte: 'Rosa', tracos: ['Diplomático', 'Charmoso', 'Justo', 'Sociável'], combina: ['gemeos', 'aquario', 'leao'] },
  { slug: 'escorpiao', nome: 'Escorpião', simbolo: '♏', periodo: '23/10 – 21/11', elemento: 'Água', cor: '#8E2D45', regente: 'Plutão', pedra: 'Topázio', corSorte: 'Vinho', tracos: ['Intenso', 'Magnético', 'Determinado', 'Leal'], combina: ['cancer', 'peixes', 'capricornio'] },
  { slug: 'sagitario', nome: 'Sagitário', simbolo: '♐', periodo: '22/11 – 21/12', elemento: 'Fogo', cor: '#C1440E', regente: 'Júpiter', pedra: 'Turquesa', corSorte: 'Roxo', tracos: ['Aventureiro', 'Otimista', 'Sincero', 'Livre'], combina: ['aries', 'leao', 'aquario'] },
  { slug: 'capricornio', nome: 'Capricórnio', simbolo: '♑', periodo: '22/12 – 19/01', elemento: 'Terra', cor: '#5C4033', regente: 'Saturno', pedra: 'Ônix', corSorte: 'Marrom', tracos: ['Ambicioso', 'Disciplinado', 'Responsável', 'Paciente'], combina: ['touro', 'virgem', 'escorpiao'] },
  { slug: 'aquario', nome: 'Aquário', simbolo: '♒', periodo: '20/01 – 18/02', elemento: 'Ar', cor: '#00A8CC', regente: 'Urano', pedra: 'Ametista', corSorte: 'Azul-turquesa', tracos: ['Original', 'Independente', 'Humanitário', 'Visionário'], combina: ['gemeos', 'libra', 'sagitario'] },
  { slug: 'peixes', nome: 'Peixes', simbolo: '♓', periodo: '19/02 – 20/03', elemento: 'Água', cor: '#5E60CE', regente: 'Netuno', pedra: 'Água-marinha', corSorte: 'Lilás', tracos: ['Sonhador', 'Empático', 'Artístico', 'Intuitivo'], combina: ['cancer', 'escorpiao', 'touro'] },
]

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
