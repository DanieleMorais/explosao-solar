import FeriadosView from '@/components/views/FeriadosView'

export const revalidate = 86400

export async function generateMetadata() {
  const ano = new Date().getFullYear()
  return {
    title: `Feriados ${ano} — calendário de feriados nacionais no Brasil`,
    description: `Calendário de feriados nacionais de ${ano} no Brasil: datas, dia da semana e quantos dias faltam para o próximo feriado e emendas.`,
    alternates: { canonical: '/feriados' },
  }
}

export default function FeriadosPage() {
  return <FeriadosView ano={new Date().getFullYear()} />
}
