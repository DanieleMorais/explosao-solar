// Feriados nacionais (BrasilAPI, grátis).
const SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']

export async function feriados(ano) {
  const y = ano || new Date().getFullYear()
  try {
    const r = await fetch(`https://brasilapi.com.br/api/feriados/v1/${y}`, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(12000) })
    if (!r.ok) return { ano: y, lista: [] }
    const arr = await r.json()
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const lista = arr.map((f) => {
      const d = new Date(f.date + 'T12:00:00')
      const dias = Math.round((d - hoje) / 86400000)
      return {
        data: f.date,
        nome: f.name,
        dataFmt: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }),
        semana: SEMANA[d.getDay()],
        dias,
        passou: dias < 0,
      }
    })
    return { ano: y, lista }
  } catch {
    return { ano: y, lista: [] }
  }
}
