import ListaIdiomaView from '@/components/views/ListaIdiomaView'
import { metadataLista } from '@/lib/paginasIdioma'

// Lista do blog em 12 idiomas em espanhol (só as traduções novas, slug em espanhol). A capa /es continua a edição antiga.
export function generateMetadata() {
  return metadataLista('es')
}

export default function Page() {
  return <ListaIdiomaView lang="es" />
}
