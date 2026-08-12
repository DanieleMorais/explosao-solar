// Pareia um número de WhatsApp ao Explosão Solar via CÓDIGO DE PAREAMENTO
// (a Dani digita o código no WhatsApp, sem precisar de QR).
// Uso: node parear.js 55DDNUMERO   (ex.: 5531999998888)

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')
const path = require('path')

const numero = (process.argv[2] || '').replace(/\D/g, '')
const AUTH_DIR = path.join(__dirname, '.wa-auth')

async function main() {
  if (!numero || numero.length < 12) {
    console.log('Informe o número com DDI+DDD: node parear.js 5531999998888')
    process.exit(1)
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Explosão Solar', 'Chrome', '1.0.0'],
  })

  sock.ev.on('creds.update', saveCreds)

  // pede o código de pareamento se ainda não estiver registrado
  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(numero)
        const formatado = code?.match(/.{1,4}/g)?.join('-') || code
        console.log('\n==================================================')
        console.log('  CÓDIGO DE PAREAMENTO:  ' + formatado)
        console.log('==================================================')
        console.log('  No WhatsApp: Configurações > Aparelhos conectados')
        console.log('  > Conectar aparelho > Conectar com número de telefone')
        console.log('  e digite o código acima.\n')
      } catch (e) {
        console.log('ERRO ao pedir código: ' + e.message)
        process.exit(1)
      }
    }, 3000)
  }

  sock.ev.on('connection.update', (u) => {
    const { connection, lastDisconnect } = u
    if (connection === 'open') {
      console.log('\n✅ PAREADO COM SUCESSO! Número: ' + (sock.user?.id || numero))
      console.log('Sessão salva em .wa-auth. Já pode fechar.')
      setTimeout(() => process.exit(0), 2500)
    }
    if (connection === 'close') {
      const motivo = lastDisconnect?.error?.output?.statusCode
      if (motivo === DisconnectReason.restartRequired) {
        console.log('reconectando…')
        main()
      } else if (motivo !== DisconnectReason.loggedOut) {
        console.log('conexão caiu (' + motivo + '), tentando de novo…')
        setTimeout(main, 3000)
      } else {
        console.log('sessão encerrada.')
        process.exit(1)
      }
    }
  })
}

main().catch((e) => {
  console.error('FATAL:', e.message)
  process.exit(1)
})
