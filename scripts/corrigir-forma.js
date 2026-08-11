// Corrige problemas de FORMA nas matérias sem reescrever o corpo — assim não há
// chance de reintroduzir erro factual. Só mexe em subtítulo, excerpt, intertítulos
// e limpezas estruturais (blockquote, lide, português de Portugal).
//
// Uso: node scripts/corrigir-forma.js [--aplicar] [--limite 60]

const fs = require('fs')
const path = require('path')
const { askJson } = require('./ia-pool')
const { adquirir } = require('./trava')
const { validar, contaPalavras, cortar } = require('./regras-editoriais')

const ROOT = path.join(__dirname, '..')
const CONTENT = path.join(ROOT, 'content')
const PT_DIR = path.join(CONTENT, 'articles')
const LOG = path.join(__dirname, 'corrigir-forma.log')

function log(m) {
  const line = `[${new Date().toISOString()}] ${m}`
  console.log(line)
  fs.appendFileSync(LOG, line + '\n')
}

const PT_PT = [
  [/\bregistam\b/gi, 'registram'],
  [/\bregistou\b/gi, 'registrou'],
  [/\butilizador(es)?\b/gi, (m) => (m.endsWith('es') ? 'usuários' : 'usuário')],
  [/\bfacto\b/gi, 'fato'],
  [/\bactual(mente)?\b/gi, (m) => (m.toLowerCase().endsWith('mente') ? 'atualmente' : 'atual')],
]

// "Conclusão: lições para o futuro" -> "Lições para o futuro" (mantém o que informa)
function limparIntertitulos(html) {
  return html
    .replace(
      new RegExp('<h2([^>]*)>\\s*(?:introdu[çc][ãa]o|conclus[ãa]o|considera[çc][õo]es finais|contexto hist[óo]rico)\\s*[:–—-]\\s*([^<]+)</h2>', 'gi'),
      (_, attrs, resto) => `<h2${attrs}>${resto.trim().charAt(0).toUpperCase()}${resto.trim().slice(1)}</h2>`
    )
    .replace(
      new RegExp('<h2[^>]*>\\s*(?:introdu[çc][ãa]o|conclus[ãa]o|considera[çc][õo]es finais|contexto hist[óo]rico|desafios e perspectivas(?: futuras)?)\\s*</h2>\\s*', 'gi'),
      ''
    )
    .replace(new RegExp('<h2[^>]*>[^<]*leitor brasileiro[^<]*</h2>\\s*', 'gi'), '')
}

function limparEstrutura(html) {
  let out = limparIntertitulos(html)
  out = out.replace(/<\/?blockquote[^>]*>/gi, '') // citação em bloco é proibida no portal
  out = out.replace(/<p>\s*(?:Lide|Sumário|Subtítulo|Corpo|Título)\s*:\s*/gi, '<p>')
  out = out.replace(/(?:^|<p>)\s*(?:Lide|Sumário)\s*:\s*/gi, '<p>')
  for (const [re, sub] of PT_PT) out = out.replace(re, sub)
  out = out.replace(/<p>\s*<\/p>/g, '')
  // corpo precisa abrir com lide: se começa em <h2>, remove esse primeiro título
  out = out.replace(/^\s*<h2[^>]*>[^<]*<\/h2>\s*/i, '')
  return out
}

async function reescreverCabecalho(a) {
  const prompt = `Você é editor do portal brasileiro "Explosão Solar". Reescreva APENAS o subtítulo e o resumo da matéria abaixo. NÃO invente informação: use somente o que já está no título e no texto.

REGRAS:
- O subtítulo é uma frase que ACRESCENTA informação ao título. PROIBIDO o texto falar de si mesmo: nada de "este artigo", "esta matéria", "este guia", "este texto", "de forma didática", "em linguagem acessível".
- O resumo tem entre 120 e 160 caracteres e termina em ponto final.
- Português brasileiro, tom de jornal, sem clickbait.

Responda APENAS com JSON válido: {"subtitle":"...","excerpt":"..."}

TÍTULO: ${a.title}
SUBTÍTULO ATUAL: ${a.subtitle || ''}
RESUMO ATUAL: ${a.excerpt || ''}
PRIMEIRO PARÁGRAFO: ${String(a.contentHtml).replace(/<[^>]+>/g, ' ').slice(0, 400)}`

  const r = await askJson(prompt, { maxTokens: 2500, onLog: log })
  if (!r.subtitle || !r.excerpt) throw new Error('resposta incompleta')
  if (/\b(est[ae] (artigo|mat[ée]ria|guia|texto|reportagem))/i.test(r.subtitle)) throw new Error('subtítulo ainda fala de si mesmo')
  return { subtitle: r.subtitle.trim(), excerpt: cortar(r.excerpt.trim(), 168) }
}

async function main() {
  if (!adquirir('corrigir-forma', log)) return

  const args = process.argv.slice(2)
  const aplicar = args.includes('--aplicar')
  const semIA = args.includes('--sem-ia') // limpezas estruturais são instantâneas e não gastam cota
  const limite = args.includes('--limite') ? parseInt(args[args.indexOf('--limite') + 1], 10) : 60

  const alvos = []
  for (const f of fs.readdirSync(PT_DIR)) {
    if (!f.endsWith('.json')) continue
    const a = JSON.parse(fs.readFileSync(path.join(PT_DIR, f), 'utf8'))
    const erros = validar(a, { minPalavras: a.sourceUrl ? 220 : 620, maxTitulo: 78 })
    if (erros.length) alvos.push({ a, erros })
  }

  log(`${alvos.length} matérias com ressalva${aplicar ? '' : ' (simulação)'}`)
  if (!aplicar) {
    alvos.slice(0, 20).forEach(({ a, erros }) => console.log(`  ${a.slug.slice(0, 50)} -> ${erros.join('; ').slice(0, 70)}`))
    return
  }

  let mecanicas = 0
  let comIA = 0
  let falhas = 0

  for (const { a, erros } of alvos.slice(0, limite)) {
    let mudou = false

    const novoCorpo = limparEstrutura(a.contentHtml)
    if (novoCorpo !== a.contentHtml) {
      a.contentHtml = novoCorpo
      mudou = true
      mecanicas++
    }

    const precisaIA = !semIA && erros.some((e) => /fala de si mesmo|excerpt com/.test(e))
    if (precisaIA) {
      try {
        const novo = await reescreverCabecalho(a)
        a.subtitle = novo.subtitle
        a.excerpt = novo.excerpt
        mudou = true
        comIA++
      } catch (e) {
        falhas++
        log(`cabeçalho falhou [${a.slug.slice(0, 40)}]: ${e.message.slice(0, 70)}`)
      }
    }

    if (!mudou) continue

    a.readingMinutes = Math.max(2, Math.round(contaPalavras(a.contentHtml) / 200))
    fs.writeFileSync(path.join(PT_DIR, a.slug + '.json'), JSON.stringify(a, null, 2))

    // aplica as mesmas limpezas estruturais nas traduções (sem chamar IA)
    for (const lang of ['en', 'es']) {
      const p = path.join(CONTENT, lang, 'articles', a.slug + '.json')
      if (!fs.existsSync(p)) continue
      try {
        const t = JSON.parse(fs.readFileSync(p, 'utf8'))
        t.contentHtml = limparEstrutura(t.contentHtml)
        fs.writeFileSync(p, JSON.stringify(t, null, 2))
      } catch {}
    }
  }

  log(`fim: ${mecanicas} corpos limpos, ${comIA} cabeçalhos reescritos, ${falhas} falhas`)
}

main().catch((e) => {
  log('ERRO FATAL: ' + (e.stack || e.message))
  process.exit(1)
})
