import { resumoConjuntos, todosPt } from '@/lib/traducoes'

// Fonte do GET /api/admin/artigos (resumo) no ar. Gerada no BUILD e servida do cache estático, porque o Worker não
// enxerga content/ em tempo de execução. Quem responde à esteira é o worker-lang.js: ele exige o segredo e devolve 404
// para quem chama este endereço direto. Sem revalidate de propósito: regenerar no Worker daria um resumo vazio.
export const dynamic = 'force-static'

export function GET() {
  // fora do build (Worker sem os arquivos) seria um resumo vazio com cara de verdadeiro: falha alto
  if (!todosPt().length) throw new Error('content/articles não encontrado: esta rota só é gerada no build')
  return Response.json(resumoConjuntos())
}
