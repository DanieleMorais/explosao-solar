import BrasilClimaView from '@/components/views/BrasilClimaView'
import { alternates } from '@/lib/seo'

export const revalidate = 1800

export const metadata = {
  title: 'Clima nos estados do Brasil — previsão em tempo real',
  description: 'Previsão do tempo em todos os estados do Brasil, com capitais, cidades e busca por bairro. Atualizado automaticamente.',
  alternates: alternates('pt', '/clima/brasil'),
}

export default function Page() {
  return <BrasilClimaView lang="pt" />
}
