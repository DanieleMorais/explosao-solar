import ListaIdiomaView from '@/components/views/ListaIdiomaView'
import { metadataLista } from '@/lib/paginasIdioma'

// Lista do blog em 12 idiomas em inglês (só as traduções novas, slug em inglês). A capa /en continua a edição antiga.
export function generateMetadata() {
  return metadataLista('en')
}

export default function Page() {
  return <ListaIdiomaView lang="en" />
}
