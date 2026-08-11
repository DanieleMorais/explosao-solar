// Trava de execução única: impede que duas rodadas do mesmo robô se atropelem
// (o Agendador dispara a cada 20 min e um lote pode demorar mais que isso).

const fs = require('fs')
const path = require('path')

const MAX_IDADE_MS = 90 * 60 * 1000

function arquivo(nome) {
  return path.join(__dirname, `.${nome}.lock`)
}

function processoVivo(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch (e) {
    return e.code === 'EPERM'
  }
}

function adquirir(nome, log = () => {}) {
  const f = arquivo(nome)
  if (fs.existsSync(f)) {
    let dados
    try {
      dados = JSON.parse(fs.readFileSync(f, 'utf8'))
    } catch {
      dados = null
    }
    const idade = dados ? Date.now() - dados.em : Infinity
    if (dados && idade < MAX_IDADE_MS && processoVivo(dados.pid)) {
      log(`já existe uma rodada de "${nome}" em andamento (pid ${dados.pid}, há ${Math.round(idade / 60000)} min) — saindo`)
      return false
    }
    log(`trava antiga de "${nome}" descartada (processo morto ou vencida)`)
  }
  fs.writeFileSync(f, JSON.stringify({ pid: process.pid, em: Date.now() }))
  const liberar = () => {
    try {
      const atual = JSON.parse(fs.readFileSync(f, 'utf8'))
      if (atual.pid === process.pid) fs.unlinkSync(f)
    } catch {}
  }
  process.on('exit', liberar)
  process.on('SIGINT', () => { liberar(); process.exit(130) })
  process.on('SIGTERM', () => { liberar(); process.exit(143) })
  return true
}

module.exports = { adquirir }
