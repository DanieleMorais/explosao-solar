// Cotações ao vivo. Dólar, euro, libra, peso, bitcoin, ethereum — em reais.
// Fonte principal: AwesomeAPI (variação/máx/mín do dia). Reserva: currency-api via
// jsDelivr (CDN, não bloqueia IP de datacenter) — garante que a página nunca fique vazia.
const PARES = ['USD-BRL', 'EUR-BRL', 'GBP-BRL', 'ARS-BRL', 'BTC-BRL', 'ETH-BRL']

const META = {
  USD: { nome: 'Dólar americano', emoji: '🇺🇸', casas: 4 },
  EUR: { nome: 'Euro', emoji: '🇪🇺', casas: 4 },
  GBP: { nome: 'Libra esterlina', emoji: '🇬🇧', casas: 4 },
  ARS: { nome: 'Peso argentino', emoji: '🇦🇷', casas: 5 },
  BTC: { nome: 'Bitcoin', emoji: '₿', casas: 0, cripto: true },
  ETH: { nome: 'Ethereum', emoji: 'Ξ', casas: 0, cripto: true },
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36'

async function daAwesome() {
  const r = await fetch(`https://economia.awesomeapi.com.br/last/${PARES.join(',')}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    next: { revalidate: 600 },
    signal: AbortSignal.timeout(8000),
  })
  if (!r.ok) throw new Error('awesome ' + r.status)
  const j = await r.json()
  const lista = PARES.map((p) => {
    const d = j[p.replace('-', '')]
    if (!d) return null
    const m = META[d.code] || { nome: d.name, emoji: '💱', casas: 4 }
    return {
      code: d.code, nome: m.nome, emoji: m.emoji, cripto: !!m.cripto, casas: m.casas,
      valor: Number(d.bid), pct: Number(d.pctChange), alta: Number(d.high), baixa: Number(d.low), atualizado: d.create_date,
    }
  }).filter(Boolean)
  if (!lista.length) throw new Error('awesome vazio')
  return lista
}

async function daReserva() {
  const r = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/brl.json', {
    headers: { Accept: 'application/json' },
    next: { revalidate: 600 },
    signal: AbortSignal.timeout(8000),
  })
  if (!r.ok) throw new Error('reserva ' + r.status)
  const j = await r.json()
  const brl = j.brl || {}
  const lista = PARES.map((p) => {
    const code = p.split('-')[0]
    const taxa = brl[code.toLowerCase()]
    if (!taxa) return null
    const m = META[code]
    const valor = 1 / taxa
    return { code, nome: m.nome, emoji: m.emoji, cripto: !!m.cripto, casas: m.casas, valor, pct: 0, alta: valor, baixa: valor, atualizado: `${j.date || ''} 00:00:00` }
  }).filter(Boolean)
  if (!lista.length) throw new Error('reserva vazia')
  return lista
}

export async function cotacoes() {
  try { return await daAwesome() } catch {}
  try { return await daReserva() } catch {}
  return []
}

export function formatarBRL(v, casas = 4) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })
}
