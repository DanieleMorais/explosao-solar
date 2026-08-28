import BrasilClimaView from '@/components/views/BrasilClimaView'
import { alternates } from '@/lib/seo'

export const dynamic = 'force-dynamic' // clima em tempo real: busca a previsão a cada acesso

export const metadata = {
  title: 'Clima en los estados de Brasil — pronóstico en tiempo real',
  description: 'Pronóstico del tiempo en todos los estados de Brasil, con capitales, ciudades y búsqueda por barrio. Actualizado automáticamente.',
  alternates: alternates('es', '/clima/brasil'),
}

export default function Page() {
  return <BrasilClimaView lang="es" />
}
