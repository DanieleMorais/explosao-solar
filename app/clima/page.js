import ClimaView from '@/components/views/ClimaView'
import { alternates } from '@/lib/seo'

export const dynamic = 'force-dynamic' // clima em tempo real: busca a previsão a cada acesso

export const metadata = {
  title: 'Clima no mundo — previsão em tempo real',
  description: 'Previsão do tempo das grandes cidades do mundo e o clima espacial (tempestades solares), atualizados automaticamente no Explosão Solar.',
  alternates: alternates('pt', '/clima'),
}

export default function Page() {
  return <ClimaView lang="pt" />
}
