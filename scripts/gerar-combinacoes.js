// Gera o conteúdo das 78 combinações de signos (PT + reescrita EN/ES) com IA e grava
// content/combinacoes/<par>.json. Resumível: pula os pares já gravados.
// Uso: node scripts/gerar-combinacoes.js [--limite N] [--par aries-e-leao]
const fs = require('fs')
const path = require('path')
const { askJson } = require('./ia-pool')
const { SIGNOS } = require('../lib/signos.js')
const { ORDEM, MODALIDADE, OPOSTOS, NOMES, todosOsPares, parDoSlug, pontuar, saoOpostos, estaoNaListaCombina, rotulo } = require('../lib/combinacoes.js')

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

// Mínimos de palavras. Reescrita costuma encolher um pouco — 80% do mínimo do PT.
const MINIMOS = { amor: 80, amizade: 60, trabalho: 60, intimidade: 60 }
const CAMPOS_TEXTO = ['resumo', 'amor', 'amizade', 'trabalho', 'intimidade', 'dica']

const ASPECTO = ['conjunção (mesmo signo)', 'semissextil (signos vizinhos)', 'sextil', 'quadratura', 'trígono', 'quincúncio', 'oposição']
function aspecto(a, b) {
  const d = Math.abs(ORDEM.indexOf(a) - ORDEM.indexOf(b))
  return ASPECTO[Math.min(d, 12 - d)]
}

const REGENTES = {
  pt: { Marte: 'Marte', Vênus: 'Vênus', Mercúrio: 'Mercúrio', Lua: 'Lua', Sol: 'Sol', Plutão: 'Plutão', Júpiter: 'Júpiter', Saturno: 'Saturno', Urano: 'Urano', Netuno: 'Netuno' },
  en: { Marte: 'Mars', Vênus: 'Venus', Mercúrio: 'Mercury', Lua: 'Moon', Sol: 'Sun', Plutão: 'Pluto', Júpiter: 'Jupiter', Saturno: 'Saturn', Urano: 'Uranus', Netuno: 'Neptune' },
  es: { Marte: 'Marte', Vênus: 'Venus', Mercúrio: 'Mercurio', Lua: 'Luna', Sol: 'Sol', Plutão: 'Plutón', Júpiter: 'Júpiter', Saturno: 'Saturno', Urano: 'Urano', Netuno: 'Neptuno' },
}

// Regras por idioma: como o texto deve chegar e o que denuncia tradução literal.
const LINGUA = {
  pt: {
    modalidade: /\b(cardinal|fix[oa]s?|mut[áa]ve(?:l|is)|modalidades?)\b/gi,
    opostos: /\bopost[oa]s?\b/i,
    regenteEmSigno: (r, s) => new RegExp(`\\b${r} em ${s}\\b`, 'i'),
    vazamento: [],
    titulo: (a, b) => `${rotulo(a, b, 'pt')} combinam? Compatibilidade no amor, na amizade e no trabalho`,
    faq: (a, b) => [`${rotulo(a, b, 'pt')} dão certo no amor?`, `${rotulo(a, b, 'pt')} podem ser amigos?`, `Qual o maior desafio de ${NOMES.pt[a]} com ${NOMES.pt[b]}?`],
  },
  en: {
    modalidade: /\b(cardinal|fixed|mutable|modalit(?:y|ies))\b/gi,
    opostos: /\bopposites?\b/i,
    regenteEmSigno: (r, s) => new RegExp(`\\b${r} in ${s}\\b`, 'i'),
    vazamento: [
      [/[áéíóúãõçâêôàñ¿¡]/, 'letra que não existe em inglês (palavra portuguesa/espanhola vazou)'],
      [/\b(Fogo|Terra|Água|Ar|dupla|intimidade|versatilidade|modalidade|regente|ariano|leonino|taurino|virginiano|geminiano|canceriano|escorpiano|sagitariano|capricorniano|aquariano|pisciano)\b/i, 'palavra em português dentro do texto em inglês'],
      [/\b(his|him|himself|her|hers|herself)\b/, 'signo não tem gênero em inglês — use "its"/"their"'],
      [/\bthe (aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces)\b/, 'nome de signo em minúscula ("the aries")'],
      [/\b(protagonism|firm pulse|in the sheets|brotherhood|lost space|full of content|command dispute|action line|adjustment point|future vision|mental hygiene|work out in love|In work,)/i, 'calco do português — reescreva com a expressão idiomática inglesa'],
    ],
    titulo: (a, b) => `${rotulo(a, b, 'en')} Compatibility: Love, Friendship, and Work`,
    faq: (a, b) => [`Are ${rotulo(a, b, 'en')} compatible in love?`, `Can ${rotulo(a, b, 'en')} be friends?`, `What is the biggest challenge between ${NOMES.en[a]} and ${NOMES.en[b]}?`],
  },
  es: {
    modalidade: /\b(cardinal|fij[oa]s?|mutables?|modalidad(?:es)?)\b/gi,
    opostos: /\bopuest[oa]s?\b/i,
    regenteEmSigno: (r, s) => new RegExp(`\\b${r} en ${s}\\b`, 'i'),
    vazamento: [
      [/[ãõçâêô]/, 'letra que não existe em espanhol (palavra portuguesa vazou)'],
      [/\b(Fogo|Terra|Água|Ar|dupla|intimidade|versatilidade|modalidade|realizador[a]?|Escorpião|Sagitário|Áries|Gêmeos|Leão|Virgem|Capricórnio|Aquário|Peixes|Touro|Câncer|Escorpiñ\w*)\b/i, 'palavra em português dentro do texto em espanhol'],
      [/\b((?:momentos?|vida|noches?|tiempo|encuentros?|desencuentro) a dos\b|a dos[.,]|vive detrás|se suelta el control|asum\w+ el frente|sin doble trabajo|calentad[oa] con|funcionan bien en el amor|ariesin[oa]s?|colide|se sienten? traíd[oa]s?)/i, 'calco do português — reescreva com a expressão idiomática espanhola'],
      [/\b(aries|tauro|géminis|cáncer|leo|virgo|libra|escorpio|sagitario|capricornio|acuario|piscis)\b/, 'nome de signo em minúscula'],
    ],
    titulo: (a, b) => `¿${rotulo(a, b, 'es')} son compatibles? Amor, amistad y trabajo`,
    faq: (a, b) => [`¿${rotulo(a, b, 'es')} son compatibles en el amor?`, `¿${rotulo(a, b, 'es')} pueden ser amigos?`, `¿Cuál es el mayor desafío entre ${NOMES.es[a]} y ${NOMES.es[b]}?`],
  },
}

function textoTodo(d) {
  return [...CAMPOS_TEXTO.map((k) => d[k]), ...(d.pontosFortes || []), ...(d.desafios || []), ...(d.faq || []).map((f) => f.resposta)].join('\n')
}

// Mesma sequência de 7 palavras em dois campos diferentes = parágrafo reciclado.
function trechoRepetido(d) {
  const campos = { ...Object.fromEntries(CAMPOS_TEXTO.map((k) => [k, d[k]])), pontosFortes: (d.pontosFortes || []).join(' '), desafios: (d.desafios || []).join(' '), faq: (d.faq || []).map((f) => f.resposta).join(' ') }
  const visto = new Map()
  for (const [campo, texto] of Object.entries(campos)) {
    const w = String(texto || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean)
    for (let i = 0; i + 7 <= w.length; i++) {
      const g = w.slice(i, i + 7).join(' ')
      const antes = visto.get(g)
      if (antes && antes !== campo) return `"${g}" (em ${antes} e ${campo})`
      visto.set(g, campo)
    }
  }
  return null
}

function validar(d, { fator = 1, lang = 'pt', a, b } = {}) {
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
  if (erros.length) return erros
  for (const [k, min] of Object.entries(MINIMOS)) {
    const n = palavras(d[k])
    if (n < Math.round(min * fator)) erros.push(`"${k}" tem ${n} palavras (mínimo ${Math.round(min * fator)})`)
  }

  const L = LINGUA[lang]
  const todo = textoTodo(d)
  for (const [re, motivo] of L.vazamento) {
    const m = re.exec(todo)
    if (m) erros.push(`${motivo}: "${m[0]}"`)
  }
  const nMod = (todo.match(L.modalidade) || []).length
  if (nMod > 4) erros.push(`modalidade (cardinal/fixo/mutável) citada ${nMod} vezes — máximo 2 frases no texto inteiro; explique uma vez e depois mostre em cenas`)
  const sa = SIGNOS.find((x) => x.slug === a)
  const sb = SIGNOS.find((x) => x.slug === b)
  for (const reg of new Set([sa.regente, sb.regente])) {
    const nome = REGENTES[lang][reg]
    const n = (todo.match(new RegExp(`\\b${nome}\\b`, 'g')) || []).length
    if (n > 4) erros.push(`regente ${nome} citado ${n} vezes — máximo 3; não reapresente o regente em cada bloco`)
    for (const s of [a, b]) {
      const nomeSigno = NOMES[lang][s]
      if (L.regenteEmSigno(nome, nomeSigno).test(todo)) erros.push(`"${nome} ${lang === 'en' ? 'in' : lang === 'es' ? 'en' : 'em'} ${nomeSigno}" é posição de mapa natal, não regência — escreva "regido por ${nome}"`)
    }
  }
  if (!saoOpostos(a, b) && L.opostos.test(todo)) {
    erros.push(`não use "${L.opostos.exec(todo)[0]}": ${NOMES[lang][a]} e ${NOMES[lang][b]} estão em ${aspecto(a, b)}, não em oposição (o oposto de ${NOMES[lang][a]} é ${NOMES[lang][OPOSTOS[a]]})`)
  }
  const rep = trechoRepetido(d)
  if (rep) erros.push(`trecho repetido em dois blocos: ${rep} — cada bloco precisa de ângulo próprio`)
  return erros
}

// Hífen não separável (U+2011) e espaço duro vindos do modelo quebram busca e renderização.
function normalizar(v) {
  if (typeof v === 'string') return v.replace(/[‐‑]/g, '-').replace(/ /g, ' ').trim()
  if (Array.isArray(v)) return v.map(normalizar)
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, normalizar(x)]))
  return v
}

// Título e perguntas da FAQ são fixos por idioma: são o que a pessoa digita no Google.
function fixarTituloEFaq(d, lang, a, b) {
  d.titulo = LINGUA[lang].titulo(a, b)
  LINGUA[lang].faq(a, b).forEach((p, i) => { d.faq[i].pergunta = p })
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
    ? `É um par do MESMO signo: fale de espelho — o que se reconhece e se admira no outro e o que vira excesso quando os dois têm os mesmos traços (${sa.tracos.join(', ')}). Traga excessos DIFERENTES em cada bloco (no amor um, na amizade outro, no trabalho outro).`
    : [
        `Elementos: ${sa.elemento} + ${sb.elemento}${sa.elemento === sb.elemento ? ' (mesmo elemento: afinidade natural, mas também os mesmos pontos cegos)' : ''}.`,
        `Regentes: ${sa.regente} (${sa.nome}) e ${sb.regente} (${sb.nome}) — o regente explica o jeito de amar, conviver e trabalhar; apresente isso UMA vez e depois só mostre em cenas.`,
        `Modalidades: ${sa.nome} é ${MODALIDADE[a]}, ${sb.nome} é ${MODALIDADE[b]}${MODALIDADE[a] === MODALIDADE[b] ? ' (mesma modalidade: os dois querem conduzir do mesmo jeito)' : ' (modalidades diferentes: ritmos que se complementam)'}.`,
        `Aspecto entre os dois no zodíaco: ${aspecto(a, b)}.${saoOpostos(a, b) ? ' São OPOSTOS: atração de opostos, cada um tem o que falta no outro.' : ` NÃO são opostos (o oposto de ${sa.nome} é ${NOMES.pt[OPOSTOS[a]]}) — não use a palavra "opostos"; se quiser falar de contraste, diga "temperamentos diferentes".`}`,
        estaoNaListaCombina(a, b) ? `${sa.nome} e ${sb.nome} estão entre as afinidades clássicas um do outro.` : 'Não estão entre as afinidades clássicas um do outro — o texto precisa explicar honestamente onde a relação exige trabalho.',
      ].filter(Boolean).join('\n')

  const tomFaq = p.amor >= 80 ? 'sim, com convicção' : p.amor >= 65 ? 'sim, mas com uma condição concreta' : '"depende" — e diga do quê'

  return `Você é uma astróloga brasileira experiente e escreve para um portal de notícias. Escreva o conteúdo da página "${nomePar} combinam?" em português brasileiro natural (você / a gente), direto, específico e sem clichê.

DADOS REAIS (use TODOS — elemento, regente e traços dos dois signos):
- ${fichaSigno(a)}
- ${fichaSigno(b)}
${relacao}
Compatibilidade calculada (0-100) que o texto deve refletir em tom, sem citar números: geral ${p.geral}, amor ${p.amor}, amizade ${p.amizade}, trabalho ${p.trabalho}, intimidade ${p.intimidade}. A resposta de "dão certo no amor?" segue a nota de amor: ${tomFaq}.

CADA BLOCO TEM UM ÂNGULO PRÓPRIO — não reconte nos outros o argumento que já usou:
- resumo: a dinâmica em 2-3 frases. É o ÚNICO lugar onde elementos, regentes e modalidades aparecem lado a lado.
- amor: atração, como cada um demonstra afeto, como brigam e como fazem as pazes.
- amizade: convivência — os programas que fazem juntos, dinheiro emprestado, atraso, segredo, o amigo que some e reaparece, o que um ensina ao outro. Não reconte a briga do amor.
- trabalho: papéis (quem inicia, quem sustenta, quem revisa), ritmo, prazo, crédito e reconhecimento, dinheiro, hierarquia. O atrito aqui tem que ser DIFERENTE do que apareceu no amor.
- intimidade: iniciativa, ritmo, o que cada um precisa pra se soltar, o que esfria. Tom adulto e elegante, sem vulgaridade. Use o elemento, não repita o argumento do amor.
- pontosFortes e desafios: cada item cita algo que SÓ este par tem (regente, elemento, aspecto, um traço da ficha). Teste: troque os dois signos por outro par qualquer; se a frase continua verdadeira, reescreva.
- dica: um gesto concreto e observável, diferente do que já está nos desafios.
- faq: cada resposta traz uma situação concreta NOVA; não resume o texto acima.

REGRAS DE ESCRITA:
- Modalidade (cardinal/fixo/mutável) aparece em no máximo 2 frases do JSON inteiro. Cada regente, no máximo 3 vezes.
- Não enfileire os traços da ficha como lista ("traz a coragem, a impulsividade e a energia"). Mostre o traço em comportamento: o que a pessoa faz numa cena.
- Escreva "regido por ${sa.regente}" ou "${sa.nome}, que tem ${sa.regente} como regente". NUNCA "${sa.regente} em ${sa.nome}" nem "a energia de ${sa.regente} em ${sa.nome}" — isso é posição de mapa natal, outra coisa.
- Nenhum signo é "dono" de um elemento; três signos dividem cada elemento.
- Vocabulário exato (caranguejo tem carapaça, não carcaça). Nada de clichê corporativo: "fora da caixa", "zona de conforto", "imbatível", "altamente produtivo", "complementar" sem dizer no quê.
- PROIBIDO: inventar estudos, estatísticas, porcentagens, citar astrólogos, livros ou pesquisas; frases vazias ("pode dar certo se houver respeito") sem explicar o porquê; markdown.

Devolva SOMENTE um JSON com exatamente estes campos:
{
  "titulo": "${LINGUA.pt.titulo(a, b)}",
  "resumo": "2-3 frases diretas",
  "amor": "100-140 palavras",
  "amizade": "80-110 palavras",
  "trabalho": "80-110 palavras",
  "intimidade": "80-110 palavras",
  "pontosFortes": ["3 frases curtas"],
  "desafios": ["3 frases curtas"],
  "dica": "1-2 frases práticas para o casal ou a dupla",
  "faq": [
    {"pergunta": "${LINGUA.pt.faq(a, b)[0]}", "resposta": "1-3 frases"},
    {"pergunta": "${LINGUA.pt.faq(a, b)[1]}", "resposta": "1-3 frases"},
    {"pergunta": "${LINGUA.pt.faq(a, b)[2]}", "resposta": "1-3 frases"}
  ]
}`
}

// Reescrita, não tradução: a instrução vem no idioma de destino pra segurar o registro nativo.
function promptEN(pt, a, b) {
  const sa = SIGNOS.find((x) => x.slug === a)
  const sb = SIGNOS.find((x) => x.slug === b)
  return `You are a native English-speaking astrology writer for a US news site. Below is a Brazilian Portuguese JSON about the zodiac pairing "${rotulo(a, b, 'en')}". Rewrite it in natural, idiomatic American English as if you were writing it from scratch for an English-speaking reader — same ideas, same facts, same structure, but never a word-for-word translation.

Facts to keep (do not change): ${NOMES.en[a]} is a ${({ Fogo: 'Fire', Terra: 'Earth', Ar: 'Air', Água: 'Water' })[sa.elemento]} sign ruled by ${REGENTES.en[sa.regente]}; ${NOMES.en[b]} is a ${({ Fogo: 'Fire', Terra: 'Earth', Ar: 'Air', Água: 'Water' })[sb.elemento]} sign ruled by ${REGENTES.en[sb.regente]}. Sign names in English: Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces — always capitalized.

Rules:
- Signs have no gender: use "its" or "their", never "his/her". Write "the Aries partner" or just "Aries", never "the aries".
- Write "ruled by ${REGENTES.en[sa.regente]}" or "${REGENTES.en[sa.regente]}, ${NOMES.en[a]}'s ruler" — never "${REGENTES.en[sa.regente]} in ${NOMES.en[a]}" (that means a natal placement, a different thing). If the source says "a energia de X em quem é de Y", write "the energy of X, Y's ruler".
- Use English idioms, not Portuguese ones: "at work" (not "in work"), "a firm hand" (not "firm pulse"), "between the sheets", "power struggle" (not "command dispute"), "competing for the spotlight" (not "protagonism"), "bond" (not "brotherhood"), "lost ground" (not "lost space"), "course of action" (not "action line"), "long-term vision" (not "future vision"), "a clear head" (not "mental hygiene"), "an exchange" (article agreement!).
- No Portuguese word may remain (Fogo, Terra, Água, Ar, dupla, intimidade...). No accented letters at all.
- Keep every array the same length, keep the same keys. Do not add markdown.
- Use exactly this title and these FAQ questions:
  "titulo": "${LINGUA.en.titulo(a, b)}"
  faq questions, in order: "${LINGUA.en.faq(a, b).join('" | "')}"

Return ONLY the rewritten JSON.

${JSON.stringify(pt, null, 2)}`
}

function promptES(pt, a, b) {
  const sa = SIGNOS.find((x) => x.slug === a)
  const sb = SIGNOS.find((x) => x.slug === b)
  const EL = { Fogo: 'Fuego', Terra: 'Tierra', Ar: 'Aire', Água: 'Agua' }
  return `Eres redactor/a de astrología, hispanohablante nativo/a, y escribes para un portal de noticias en español neutro (que se lea natural en México, Colombia, Argentina y España). Abajo hay un JSON en portugués de Brasil sobre la pareja zodiacal "${rotulo(a, b, 'es')}". Reescríbelo en español natural e idiomático como si lo redactaras desde cero para un lector hispano: mismas ideas, mismos datos, misma estructura, pero jamás una traducción palabra por palabra.

Datos que no cambian: ${NOMES.es[a]} es un signo de ${EL[sa.elemento]} regido por ${REGENTES.es[sa.regente]}; ${NOMES.es[b]} es un signo de ${EL[sb.elemento]} regido por ${REGENTES.es[sb.regente]}. Nombres de los signos en español: Aries, Tauro, Géminis, Cáncer, Leo, Virgo, Libra, Escorpio, Sagitario, Capricornio, Acuario, Piscis — siempre con mayúscula inicial y con su acento.

Reglas:
- Escribe "regido por ${REGENTES.es[sa.regente]}" o "${REGENTES.es[sa.regente]}, regente de ${NOMES.es[a]}" — nunca "${REGENTES.es[sa.regente]} en ${NOMES.es[a]}" (eso es una posición natal, otra cosa). Si el original dice "a energia de X em quem é de Y", escribe "la energía de X, regente de Y".
- Ninguna palabra portuguesa puede quedar: Fogo → Fuego, Terra → Tierra, Ar → Aire, Água → Agua, intimidade → intimidad, versatilidade → versatilidad, Escorpião → Escorpio, Sagitário → Sagitario, Câncer → Cáncer. Nada de "dupla" (usa "dúo", "pareja" o "los dos"; en amistad, "dúo" o "amigos", no "pareja").
- Expresiones naturales en español: "cada momento juntos" (no "a dos"), "anda tras las novedades" (no "vive detrás de"), "suelta el control" (no "se suelta el control"), "toma la delantera" (no "asume el frente"), "sin rehacer el trabajo" (no "sin doble trabajo"), "encendido/deseado" (no "calentado"), "con capacidad de ejecución" (no "realizadora"), "muy sólido" (no "muy fuerte" para un resultado).
- Las preguntas llevan ¿ y ? y sus acentos (¿Cuál...?).
- Mantén la misma cantidad de elementos en cada array y las mismas claves. Sin markdown.
- Usa exactamente este título y estas preguntas del FAQ:
  "titulo": "${LINGUA.es.titulo(a, b)}"
  preguntas del faq, en orden: "${LINGUA.es.faq(a, b).join('" | "')}"

Devuelve SOLO el JSON reescrito.

${JSON.stringify(pt, null, 2)}`
}

async function pedirValidado(montarPrompt, ctx, tag) {
  let erros = []
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    const extra = erros.length ? `\n\nATENÇÃO — a tentativa anterior falhou por: ${erros.join('; ')}. Corrija isso.` : ''
    const d = normalizar(await askJson(montarPrompt() + extra, { maxTokens: 3500, attempts: 3, onLog: (m) => log(`  [${tag}] ${m}`) }))
    erros = validar(d, ctx)
    if (!erros.length) return fixarTituloEFaq(d, ctx.lang, ctx.a, ctx.b)
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
  const pt = await pedirValidado(() => promptPT(a, b), { fator: 1, lang: 'pt', a, b }, `${par} pt`)
  const out = { par, signos: [a, b], geradoEm: '', pt }
  log(`${par}: reescrevendo en`)
  out.en = await pedirValidado(() => promptEN(pt, a, b), { fator: 0.8, lang: 'en', a, b }, `${par} en`)
  log(`${par}: reescrevendo es`)
  out.es = await pedirValidado(() => promptES(pt, a, b), { fator: 0.8, lang: 'es', a, b }, `${par} es`)
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
      log(`${par}: FALHOU — ${e.message.slice(0, 300)}`)
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

module.exports = { validar, normalizar, aspecto }

if (require.main === module) {
  main().catch((e) => {
    log('ERRO: ' + (e.stack || e.message))
    process.exit(1)
  })
}
