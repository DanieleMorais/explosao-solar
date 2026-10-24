import { artigosPtCompletos, todosPt } from '@/lib/traducoes'

// Fonte do GET /api/admin/artigos?completo=1&todos=1 (e ?slug=) no ar: TODAS as matérias PT com 600+ palavras, com ou
// sem tradução. Gerada no BUILD; o worker-lang.js exige o segredo e bloqueia o acesso direto. Sem revalidate.
export const dynamic = 'force-static'

export function GET() {
  if (!todosPt().length) throw new Error('content/articles não encontrado: esta rota só é gerada no build')
  return Response.json(artigosPtCompletos({ todos: true }))
}
