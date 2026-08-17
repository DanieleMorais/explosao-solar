// Gera o horóscopo do dia (12 signos) com IA e grava content/horoscopo.json.
// Roda na nuvem 1x/dia. Uso: node scripts/robo-horoscopo.js
const fs = require('fs')
const path = require('path')
const { askJson } = require('./ia-pool')

const SIGNOS = ['aries', 'touro', 'gemeos', 'cancer', 'leao', 'virgem', 'libra', 'escorpiao', 'sagitario', 'capricornio', 'aquario', 'peixes']
const NOMES = { aries: 'Áries', touro: 'Touro', gemeos: 'Gêmeos', cancer: 'Câncer', leao: 'Leão', virgem: 'Virgem', libra: 'Libra', escorpiao: 'Escorpião', sagitario: 'Sagitário', capricornio: 'Capricórnio', aquario: 'Aquário', peixes: 'Peixes' }
const log = (m) => console.log(`[${new Date().toISOString()}] ${m}`)

function carregarEnv() {
  const f = path.join(__dirname, '..', '.env.robo')
  if (!fs.existsSync(f)) return
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/^([A-Z_0-9]+)=(.+)$/gm)) process.env[m[1]] = process.env[m[1]] || m[2].trim()
}

async function main() {
  carregarEnv()
  const hoje = new Date()
  const dataFmt = hoje.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' })
  const dataISO = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10) // BRT

  const prompt = `Você é astróloga brasileira. Escreva o horóscopo de HOJE (${dataFmt}) para os 12 signos.
Para cada signo, 2 a 3 frases acolhedoras e específicas do dia, cobrindo amor, trabalho/dinheiro e energia — sem clichês vazios, sem prometer o impossível, tom positivo e humano.
Responda SOMENTE um objeto JSON com as 12 chaves exatas: ${SIGNOS.join(', ')}. Cada valor é o texto do signo. Português brasileiro. Sem markdown, sem comentários.`

  const r = await askJson(prompt, { maxTokens: 2200, onLog: log })
  const signos = {}
  for (const s of SIGNOS) {
    const v = r?.[s] || r?.[NOMES[s]] || r?.[NOMES[s].toLowerCase()]
    if (v && String(v).trim().length > 20) signos[s] = String(v).trim()
  }
  if (Object.keys(signos).length < 10) throw new Error(`poucos signos válidos (${Object.keys(signos).length})`)

  const out = path.join(__dirname, '..', 'content', 'horoscopo.json')
  fs.writeFileSync(out, JSON.stringify({ data: dataISO, dataFmt, signos }, null, 2))
  log(`horóscopo gravado: ${Object.keys(signos).length} signos (${dataFmt})`)
}

main().catch((e) => {
  log('ERRO: ' + (e.stack || e.message))
  process.exit(1) // mantém o horóscopo anterior se falhar
})
