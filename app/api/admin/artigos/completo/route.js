import { artigosPtCompletos, todosPt } from '@/lib/traducoes'

// Fonte do GET /api/admin/artigos?completo=1 no ar: matérias PT com 600+ palavras (freio) que ainda não têm as 11
// traduções, com o texto em HTML. Gerada no BUILD (o Worker não enxerga content/); o worker-lang.js exige o segredo e
// bloqueia o acesso direto. Sem revalidate de propósito.
export const dynamic = 'force-static'

export function GET() {
  if (!todosPt().length) throw new Error('content/articles não encontrado: esta rota só é gerada no build')
  return Response.json(artigosPtCompletos())
}
