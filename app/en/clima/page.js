import ClimaView from '@/components/views/ClimaView'
import { alternates } from '@/lib/seo'

export const revalidate = 1800

export const metadata = {
  title: 'World weather — real-time forecast',
  description: 'Weather forecast for major world cities and space weather (solar storms), updated automatically on Explosão Solar.',
  alternates: alternates('en', '/clima'),
}

export default function Page() {
  return <ClimaView lang="en" />
}
