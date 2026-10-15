// FREIO EDITORIAL — decisão da Dani em 14/10/2026 ("frear e limpar"), para o site voltar ao Google.
// Desde ~24/08 o Google parou de indexar matéria nova do portal. O padrão era de conteúdo em
// escala: 24 a 43 matérias por dia, cada uma traduzida por máquina para EN e ES, a maioria
// reescrita curta de outro veículo. Regras que TODOS os robôs de conteúdo seguem a partir daqui:
//   1. no máximo LIMITE_DIA matérias novas por dia (dia de Brasília), somando todos os robôs;
//   2. só em português: nenhuma tradução automática nova para EN/ES;
//   3. texto de verdade: MIN_PALAVRAS ou mais, com fato concreto (números/datas e nomes próprios).
// Mudar a regra = mudar AQUI; os robôs e os workflows leem tudo deste arquivo.

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { contaPalavras } = require('./regras-editoriais')

const PT_DIR = path.join(__dirname, '..', 'content', 'articles')
const LIMITE_DIA = 3
const MIN_PALAVRAS = 600
const MIN_NUMEROS = 3
const MIN_NOMES = 5
const TRADUZIR = false

const diaBrasilia = (d) => new Date(d).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })

function publicadasHoje(dir = PT_DIR) {
  const hoje = diaBrasilia(Date.now())
  let n = 0
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue
    try {
      const a = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
      if (a.publishedAt && diaBrasilia(a.publishedAt) === hoje) n++
    } catch {}
  }
  return n
}

const vagasHoje = (dir) => Math.max(0, LIMITE_DIA - publicadasHoje(dir))

// "Fato concreto" medido no texto: números/datas distintos e nomes próprios distintos fora do
// início de frase. A matéria de enchimento de 14/09 ("Presidenciáveis têm agenda intensa...")
// não tinha nenhum dos dois.
function fatosConcretos(html) {
  const texto = String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  const numeros = new Set(texto.match(/\d+(?:[.,]\d+)*/g) || []).size
  const nomes = new Set()
  for (const m of texto.matchAll(/(?<![.!?:]) ([A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõçà]{2,}|[A-Z]{2,})/g)) nomes.add(m[1])
  return { numeros, nomes: nomes.size }
}

// null = aprovada; texto = motivo da recusa (a matéria NÃO é publicada).
function motivoRecusa(html) {
  const palavras = contaPalavras(html)
  if (palavras < MIN_PALAVRAS) return `curta demais (${palavras} palavras; mínimo ${MIN_PALAVRAS})`
  const { numeros, nomes } = fatosConcretos(html)
  if (numeros < MIN_NUMEROS || nomes < MIN_NOMES) {
    return `sem fato concreto (${numeros} números/datas e ${nomes} nomes próprios; mínimo ${MIN_NUMEROS} e ${MIN_NOMES})`
  }
  return null
}

module.exports = { LIMITE_DIA, MIN_PALAVRAS, TRADUZIR, publicadasHoje, vagasHoje, fatosConcretos, motivoRecusa }

// Conferência dos workflows logo antes do push (depois do pull --rebase): robôs em grupos de
// execução diferentes podem rodar juntos e cada um ver uma vaga. Se ESTE lote traz matéria nova
// e o dia passou do limite, sai com 1 e o lote não sobe.
if (require.main === module && process.argv.includes('--conferir')) {
  let novas = []
  try {
    // o lote do robô é o último commit (depois do pull --rebase ele fica por cima do remoto)
    novas = execSync('git diff-tree --root --no-commit-id --name-only --diff-filter=A -r HEAD -- content/articles', { encoding: 'utf8', cwd: path.join(__dirname, '..') })
      .split('\n')
      .filter((l) => l.endsWith('.json'))
  } catch (e) {
    console.log('freio: não consegui ler o último commit (' + String(e.message).slice(0, 80) + ')')
    process.exit(1)
  }
  const hoje = publicadasHoje()
  console.log(`freio: este lote traz ${novas.length} matéria(s) nova(s); hoje o site tem ${hoje} (limite ${LIMITE_DIA})`)
  process.exit(novas.length && hoje > LIMITE_DIA ? 1 : 0)
}
