import ClimaView from '@/components/views/ClimaView'
import { alternates } from '@/lib/seo'

export const revalidate = 1800

export const metadata = {
  title: 'Clima en el mundo — pronóstico en tiempo real',
  description: 'Pronóstico del tiempo de las grandes ciudades del mundo y el clima espacial (tormentas solares), actualizados automáticamente en Explosão Solar.',
  alternates: alternates('es', '/clima'),
}

export default function Page() {
  return <ClimaView lang="es" />
}
