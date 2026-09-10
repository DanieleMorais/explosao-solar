import { getAllArticles } from './content'

// Só os campos que o card da busca usa: mandar a matéria inteira pro cliente
// inflava a página de busca (eram ~650 KB com o acervo em 1.000 matérias).
export function slim(a) {
  return {
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    category: a.category,
    categorySlug: a.categorySlug,
    publishedAt: a.publishedAt,
    readingMinutes: a.readingMinutes,
    subtitle: a.subtitle,
    imagem: a.imagem,
  }
}

const norm = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(new RegExp('[\u0300-\u036f]', 'g'), '')
    .toLowerCase()

export function buscar(q, lang = 'pt', limite = 40) {
  const termo = norm(q).trim()
  const todas = getAllArticles(lang)
  if (!termo) return { total: todas.length, resultados: todas.slice(0, limite).map(slim) }
  const achadas = todas.filter((a) =>
    norm(`${a.title} ${a.excerpt} ${a.category} ${(a.tags || []).join(' ')}`).includes(termo)
  )
  return { total: achadas.length, resultados: achadas.slice(0, limite).map(slim) }
}

// Índice que o navegador baixa uma vez para buscar sem ida ao servidor. Ele existe
// porque o Worker não lê os arquivos de conteúdo em tempo de execução — só o build
// lê — então uma rota de busca dinâmica responderia sempre vazio.
// Campos curtos porque o arquivo inteiro viaja: b = texto já normalizado.
// Formato em array (sem repetir nomes de campo 1.500 vezes) e sem duplicar o
// excerpt dentro do texto de busca: [slug, título, excerpt, categoria, catSlug,
// data, minutos, imagem, textoDeBusca].
export function indiceBusca(lang = 'pt') {
  return getAllArticles(lang).map((a) => [
    a.slug,
    a.title,
    String(a.excerpt || '').slice(0, 100),
    a.category,
    a.categorySlug,
    String(a.publishedAt || '').slice(0, 10),
    a.readingMinutes || 0,
    a.imagem || '',
    norm(`${a.title} ${a.category} ${(a.tags || []).join(' ')}`),
  ])
}

export function normalizarTermo(q) {
  return norm(q).trim()
}
