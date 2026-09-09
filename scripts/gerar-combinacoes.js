// Gera o conteúdo das 78 combinações de signos (PT + tradução EN/ES) com IA e grava
// content/combinacoes/<par>.json. Resumível: pula os pares já gravados.
// Uso: node scripts/gerar-combinacoes.js [--limite N] [--par aries-e-leao]
const fs = require('fs')
const path = require('path')
const { askJson } = require('./ia-pool')
const { SIGNOS } = require('../lib/signos.js')
const { MODALIDADE, todosOsPares, parDoSlug, pontuar, saoOpostos, estaoNaListaCombina, rotulo } = require('../lib/combinacoes.js')

const DIR = path.join(__dirname, '..', 'content', 'combinacoes')
const PAUSA_MS = 1500
const log = (m) => console.log(`[${new Date().toISOString()}] ${m}`)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const palavras = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length

const args = process.argv.slice(2)
const flag = (nome) => {
  const i = args.indexOf(nome)
  return i === -1 ? null : args[i + 1]
}
const LIMITE = Number(flag('--limite')) || Infinity
const SO_PAR = flag('--par')

const IDIOMA = {
  en: { nome: 'inglês', nomes: 'Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces', exemplo: 'Aries and Leo' },
  es: { nome: 'espanhol', nomes: 'Aries, Tauro, Géminis, Cáncer, Leo, Virgo, Libra, Escorpio, Sagitario, Capricornio, Acuario, Piscis', exemplo: 'Aries y Leo' },
}

// Mínimos de palavras. Tradução costuma encolher um pouco — 80% do mínimo do PT.
const MINIMOS = { amor: 80, amizade: 60, trabalho: 60, intimidade: 60 }

function validar(d, fator = 1) {
  const erros = []
  if (!d || typeof d !== 'object') return ['resposta não é objeto']
  for (const k of ['titulo', 'resumo', 'amor', 'amizade', 'trabalho', 'intimidade', 'dica']) {
    if (typeof d[k] !== 'string' || d[k].trim().length < 10) erros.push(`campo "${k}" ausente ou curto`)
  }
  for (const k of ['pontosFortes', 'desafios']) {
    if (!Array.isArray(d[k]) || d[k].length !== 3 || d[k].some((x) => typeof x !== 'string' || !x.trim())) erros.push(`"${k}" precisa de exatamente 3 strings`)
  }
  if (!Array.isArray(d.faq) || d.faq.length !== 3 || d.faq.some((f) => !f || typeof f.pergunta !== 'string' || typeof f.resposta !== 'string' || !f.pergunta.trim() || !f.resposta.trim())) {
    erros.push('"faq" precisa de exatamente 3 itens {pergunta, resposta}')
  }
  for (const [k, min] of Object.entries(MINIMOS)) {
    const n = palavras(d[k])
    if (n < Math.round(min * fator)) erros.push(`"${k}" tem ${n} palavras (mínimo ${Math.round(min * fator)})`)
  }
  return erros
}

// Modelos costumam esquecer o ¿ de abertura em espanhol.
function abrirInterrogacaoES(d) {
  const fix = (q) => (/\?$/.test(q.trim()) && !q.trim().startsWith('¿') ? '¿' + q.trim() : q)
  d.titulo = fix(d.titulo)
  for (const f of d.faq) f.pergunta = fix(f.pergunta)
  return d
}

function fichaSigno(slug) {
  const s = SIGNOS.find((x) => x.slug === slug)
  return `${s.nome} — elemento ${s.elemento}, regente ${s.regente}, modalidade ${MODALIDADE[slug]}, traços: ${s.tracos.join(', ')}`
}

function promptPT(a, b) {
  const sa = SIGNOS.find((x) => x.slug === a)
  const sb = SIGNOS.find((x) => x.slug === b)
  const mesmo = a === b
  const p = pontuar(a, b)
  const nomePar = rotulo(a, b, 'pt')
  const relacao = mesmo
    ? `É um par do MESMO signo: fale de espelho — o que se reconhece e se admira no outro e o que vira excesso quando os dois têm os mesmos traços (${sa.tracos.join(', ')}).`
    : [
        `Elementos: ${sa.elemento} + ${sb.elemento}${sa.elemento === sb.elemento ? ' (mesmo elemento: afinidade natural, mas também os mesmos pontos cegos)' : ''}.`,
        `Regentes: ${sa.regente} (${sa.nome}) e ${sb.regente} (${sb.nome}) — explique o que cada regente imprime no jeito de amar, conviver e trabalhar.`,
        `Modalidades: ${sa.nome} é ${MODALIDADE[a]}, ${sb.nome} é ${MODALIDADE[b]}${MODALIDADE[a] === MODALIDADE[b] ? ' (mesma modalidade: os dois querem conduzir do mesmo jeito, o que gera atrito de quadratura/oposição)' : ' (modalidades diferentes: ritmos que se complementam)'}.`,
        saoOpostos(a, b) ? 'São signos OPOSTOS no zodíaco: atração de opostos, cada um tem o que falta no outro.' : '',
        estaoNaListaCombina(a, b) ? `${sa.nome} e ${sb.nome} estão entre as afinidades clássicas um do outro.` : 'Não estão entre as afinidades clássicas um do outro — o texto precisa explicar honestamente onde a relação exige trabalho.',
      ].filter(Boolean).join('\n')

  return `Você é uma astróloga brasileira experiente e escreve para um portal de notícias. Escreva o conteúdo da página "${nomePar} combinam?" em português brasileiro natural (você / a gente), direto, específico e sem clichê.

DADOS REAIS (use TODOS — cite elemento, regente e traços dos dois signos e explique a dinâmica entre eles):
- ${fichaSigno(a)}
- ${fichaSigno(b)}
${relacao}
Compatibilidade calculada (0-100) que o texto deve refletir em tom, sem citar números: geral ${p.geral}, amor ${p.amor}, amizade ${p.amizade}, trabalho ${p.trabalho}, intimidade ${p.intimidade}.

PROIBIDO: inventar estudos, estatísticas, porcentagens, citar astrólogos, livros ou pesquisas; frases vazias ("pode dar certo se houver respeito") sem explicar o porquê; repetir o mesmo parágrafo trocando o nome do signo; markdown.

Devolva SOMENTE um JSON com exatamente estes campos:
{
  "titulo": "${nomePar} combinam? Compatibilidade no amor, na amizade e no trabalho",
  "resumo": "2-3 frases diretas resumindo a dinâmica do par",
  "amor": "100-140 palavras sobre a relação amorosa: como se atraem, como brigam, o que sustenta",
  "amizade": "80-110 palavras",
  "trabalho": "80-110 palavras: quem lidera, quem executa, onde travam",
  "intimidade": "80-110 palavras, tom adulto e elegante, sem vulgaridade",
  "pontosFortes": ["3 frases curtas"],
  "desafios": ["3 frases curtas"],
  "dica": "1-2 frases práticas para o casal ou a dupla",
  "faq": [
    {"pergunta": "${nomePar} dão certo no amor?", "resposta": "1-3 frases"},
    {"pergunta": "${nomePar} podem ser amigos?", "resposta": "1-3 frases"},
    {"pergunta": "Qual o maior desafio de ${sa.nome} com ${sb.nome}?", "resposta": "1-3 frases"}
  ]
}`
}

function promptTraducao(pt, lang, a, b) {
  const i = IDIOMA[lang]
  return `Traduza o JSON abaixo do português brasileiro para ${i.nome} natural e fluente — reescreva como um falante nativo escreveria, não palavra por palavra. Mantenha EXATAMENTE a mesma estrutura, as mesmas chaves e a mesma quantidade de itens nos arrays. Mantenha o sentido, os traços, elementos e regentes citados.
Nomes dos signos em ${i.nome}: ${i.nomes}. Este par é "${rotulo(a, b, lang)}" (formato de exemplo: "${i.exemplo}").
As perguntas do "faq" devem soar como alguém digitaria no Google em ${i.nome}.
Devolva SOMENTE o JSON traduzido, sem markdown.

${JSON.stringify(pt, null, 2)}`
}

async function pedirValidado(montarPrompt, fator, tag) {
  let erros = []
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    const extra = erros.length ? `\n\nATENÇÃO — a tentativa anterior falhou por: ${erros.join('; ')}. Corrija isso.` : ''
    const d = await askJson(montarPrompt() + extra, { maxTokens: 3500, attempts: 3, onLog: (m) => log(`  [${tag}] ${m}`) })
    erros = validar(d, fator)
    if (!erros.length) return d
    log(`  [${tag}] tentativa ${tentativa}/3 inválida: ${erros.join('; ')}`)
  }
  throw new Error(`${tag}: ${erros.join('; ')}`)
}

function gravarAtomico(arquivo, dados) {
  const tmp = `${arquivo}.${process.pid}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(dados, null, 2))
  fs.renameSync(tmp, arquivo)
}

function jaGravado(arquivo) {
  try {
    const j = JSON.parse(fs.readFileSync(arquivo, 'utf8'))
    return Boolean(j.pt && j.en && j.es)
  } catch {
    return false
  }
}

async function gerarPar(par) {
  const { a, b } = parDoSlug(par)
  const inicio = Date.now()
  log(`${par}: gerando PT`)
  const pt = await pedirValidado(() => promptPT(a, b), 1, `${par} pt`)
  const out = { par, signos: [a, b], geradoEm: '', pt }
  for (const lang of ['en', 'es']) {
    log(`${par}: traduzindo ${lang}`)
    out[lang] = await pedirValidado(() => promptTraducao(pt, lang, a, b), 0.8, `${par} ${lang}`)
  }
  abrirInterrogacaoES(out.es)
  out.geradoEm = new Date().toISOString()
  gravarAtomico(path.join(DIR, `${par}.json`), out)
  log(`${par}: gravado em ${Math.round((Date.now() - inicio) / 1000)}s (amor pt/en/es = ${palavras(pt.amor)}/${palavras(out.en.amor)}/${palavras(out.es.amor)} palavras)`)
}

async function main() {
  fs.mkdirSync(DIR, { recursive: true })
  let fila = todosOsPares()
  if (SO_PAR) {
    if (!parDoSlug(SO_PAR)) throw new Error(`--par inválido: "${SO_PAR}" (use a ordem zodiacal, ex.: aries-e-leao)`)
    fila = [SO_PAR]
  }
  const pendentes = fila.filter((par) => !jaGravado(path.join(DIR, `${par}.json`)))
  log(`${fila.length} pares, ${fila.length - pendentes.length} já gravados, ${Math.min(pendentes.length, LIMITE)} nesta rodada`)

  let feitos = 0
  let falhas = 0
  for (const par of pendentes.slice(0, LIMITE)) {
    try {
      await gerarPar(par)
      feitos++
    } catch (e) {
      falhas++
      log(`${par}: FALHOU — ${e.message.slice(0, 200)}`)
      if (/nenhum motor de IA configurado/.test(e.message)) throw e
    }
    await sleep(PAUSA_MS)
  }
  log(`fim: ${feitos} gravados, ${falhas} falhas, ${pendentes.length - feitos} pendentes`)
  if (falhas && !feitos) process.exit(1)
}

// O aviso MODULE_TYPELESS_PACKAGE_JSON vem do require() dos módulos ESM de lib/ e só suja o log.
process.removeAllListeners('warning')
process.on('warning', (w) => {
  if (w.code !== 'MODULE_TYPELESS_PACKAGE_JSON') console.warn(w.stack || w.message)
})

main().catch((e) => {
  log('ERRO: ' + (e.stack || e.message))
  process.exit(1)
})
