import { notFound } from 'next/navigation'
import FeriadosView from '@/components/views/FeriadosView'

export const revalidate = 86400

export function generateStaticParams() {
  const atual = new Date().getFullYear()
  return [atual + 1, atual + 2].map((y) => ({ ano: String(y) }))
}

function valido(ano) {
  const atual = new Date().getFullYear()
  return ano >= 2020 && ano <= atual + 5
}

export async function generateMetadata({ params }) {
  const { ano } = await params
  const y = Number(ano)
  if (!valido(y)) return {}
  return {
    title: `Feriados ${y} — calendário de feriados nacionais no Brasil`,
    description: `Calendário completo de feriados nacionais de ${y} no Brasil: datas e dia da semana de cada feriado.`,
    alternates: { canonical: `/feriados/${y}` },
  }
}

export default async function Page({ params }) {
  const { ano } = await params
  const y = Number(ano)
  if (!valido(y)) notFound()
  return <FeriadosView ano={y} />
}
