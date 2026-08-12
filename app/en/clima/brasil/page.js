import BrasilClimaView from '@/components/views/BrasilClimaView'
import { alternates } from '@/lib/seo'

export const revalidate = 1800

export const metadata = {
  title: 'Weather across Brazil — real-time forecast',
  description: 'Weather forecast for every state in Brazil, with capitals, cities and neighborhood search. Updated automatically.',
  alternates: alternates('en', '/clima/brasil'),
}

export default function Page() {
  return <BrasilClimaView lang="en" />
}
