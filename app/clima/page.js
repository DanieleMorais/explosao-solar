import ClimaView from '@/components/views/ClimaView'
import { alternates } from '@/lib/seo'

export const dynamic = 'force-dynamic' // clima em tempo real: busca a previsão a cada acesso

export const metadata = {
  title: 'Clima para amanhã — previsão do tempo hoje e nos próximos dias',
  description: 'Vai chover amanhã? Veja a previsão do tempo para hoje, amanhã e os próximos 14 dias na sua cidade, com temperatura, chuva e busca por bairro — além do clima das grandes capitais do mundo.',
  alternates: alternates('pt', '/clima'),
}

export default function Page() {
  return <ClimaView lang="pt" />
}
