import { ADS_MONEYTIZER } from './ads-moneytizer'

// Método "automático" do The Moneytizer: a lista vem do servidor deles, então nunca
// fica velha. É o mesmo endereço que o ads_tm.php oficial deles consulta. Se o
// servidor deles falhar, vale a cópia embutida no código (lib/ads-moneytizer.js).
const LISTA_OFICIAL = 'https://ads.themoneytizer.com/ads_txt.php?site_id=132944&id=132944'

async function listaDoMoneytizer() {
  try {
    const r = await fetch(LISTA_OFICIAL, { signal: AbortSignal.timeout(5000) })
    if (!r.ok) throw new Error('HTTP ' + r.status)
    const texto = await r.text()
    // Resposta válida tem centenas de linhas "dominio, id, TIPO"; qualquer outra coisa
    // (página de erro, texto vazio) cai na cópia embutida.
    const linhas = texto.split(/\r?\n/).filter((l) => /^[\w.-]+\.\w+\s*,/.test(l.trim()))
    if (linhas.length < 100) throw new Error('lista curta demais (' + linhas.length + ')')
    return { texto, origem: 'servidor do Moneytizer' }
  } catch (e) {
    console.error('[ads.txt] lista do Moneytizer indisponível, usando a cópia embutida:', e.message)
    return { texto: ADS_MONEYTIZER, origem: 'cópia embutida' }
  }
}

export async function montarAdsTxt() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || ''
  const pub = client.replace(/^ca-/, '')
  const adsense = pub ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0` : ''

  const { texto } = await listaDoMoneytizer()
  const embutida = ADS_MONEYTIZER.split('\n').map((l) => l.trim()).filter(Boolean)
  const remota = texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

  // OWNERDOMAIN/MANAGERDOMAIN e a linha do vendedor 132944 vêm do painel dela
  // (o servidor deles não manda essas); o resto vem do servidor.
  const variaveis = embutida.filter((l) => l.includes('='))
  const vendedor = embutida.filter((l) => /^themoneytizer\.com\s*,/i.test(l))
  const parceiros = remota.filter((l) => !l.includes('=') && !l.startsWith('#'))

  const vistas = new Set()
  const unicas = []
  for (const l of [adsense, ...vendedor, ...parceiros]) {
    if (!l) continue
    const chave = l.toLowerCase().replace(/\s+/g, '').replace(/,$/, '')
    if (vistas.has(chave)) continue
    vistas.add(chave)
    unicas.push(l)
  }
  return [...variaveis, ...unicas].join('\n') + '\n'
}
