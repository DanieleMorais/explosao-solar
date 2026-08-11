// Regras editoriais únicas do Explosão Solar.
// Os três geradores (semear, robo-noticias, enriquecer) interpolam estas mesmas
// constantes — sem isso cada prompt diverge e um desfaz o acerto do outro.

const REGRAS_DE_FATO = `- FATOS: use apenas conhecimento consolidado e amplamente estabelecido. PROIBIDO, sem exceção:
  (a) listar composição, membros, cadeiras ou organograma de qualquer órgão colegiado (conselhos, comitês, cortes, diretorias) — descreva a função do órgão, nunca quem o compõe;
  (b) citar nome de lei, decreto, tratado, acordo, rodada, plano, programa, política ou sigla que não seja notório ao grande público — na dúvida, descreva sem nomear ("o acordo que criou a organização");
  (c) afirmar natureza jurídica ou poder de um órgão ("tem força normativa", "delibera", "fiscaliza", "as sessões são secretas", "reúne-se X vezes por ano") sem certeza;
  (d) dar ano exato de mudança de regra ou norma — escreva "nos anos 1920", "em meados do século XX";
  (e) escrever alíquota, percentual, faixa de tributação, taxa, prazo ou valor em matéria de dinheiro, tributos, investimento, previdência ou saúde — explique o mecanismo sem número;
  (f) usar "segundo estudos", "de acordo com especialistas", "segundo organismos internacionais", "estima-se que", "pesquisas apontam" — toda atribuição exige nome próprio da instituição; sem isso, apague a frase inteira;
  (g) atribuir a mediação ou a autoria de um fato histórico a uma instituição (ONU, OTAN, FMI, EUA, União Europeia) sem certeza — narre o fato sem apontar responsável.
  NA DÚVIDA SOBRE QUALQUER FATO: CORTE A FRASE. Texto mais curto e verdadeiro vale mais que texto completo e falso.
- PROIBIDO usar aspas de fala ou citação atribuída a qualquer pessoa, nomeada ou não.`

const REGRAS_DE_FORMA = `- ESTRUTURA: PROIBIDOS os intertítulos "Introdução", "Conclusão", "Contexto histórico", "Desafios e perspectivas futuras" e qualquer variação de "Implicações/impactos práticos para o leitor brasileiro". Todo <h2> precisa nomear o ASSUNTO do trecho ("O que muda no seu bolso quando a Selic sobe"), nunca a tarefa da redação. Use de 4 a 6 subtítulos.
- O corpo SEMPRE abre com um parágrafo <p> de lide de 2 a 3 frases; nunca comece em <h2>.
- PROIBIDO o texto falar de si mesmo: nada de "este artigo explora", "esta matéria apresenta", "o objetivo deste texto", "este guia reúne".
- PROIBIDO escrever rótulos internos de redação no corpo: "Lide:", "Título:", "Subtítulo:", "Corpo:", "Sumário:".
- Português brasileiro do Brasil, não de Portugal: "registram" e não "registam", "usuário" e não "utilizador". Nenhuma palavra solta em inglês ou espanhol no meio do texto — se o termo técnico não tem tradução consagrada, explique em português.
- Use SOMENTE o hífen comum "-". PROIBIDO hífen não separável, que quebra busca e indexação.
- Títulos e subtítulos em caixa de frase (só a primeira letra e nomes próprios em maiúscula), nunca Title Case.`

const TAGS_PERMITIDAS = ['p', 'h2', 'h3', 'ul', 'ol', 'li', 'strong', 'em']
const ALLOWED_RE = new RegExp(`<(?!\\/?(${TAGS_PERMITIDAS.join('|')})\\b)[a-z][^>]*>`, 'gi')

const sanitize = (h) => String(h || '').replace(ALLOWED_RE, '')
const contaPalavras = (h) => String(h || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length

// Corta em fronteira de frase/palavra em vez de picotar no meio.
function cortar(texto, max) {
  const s = String(texto || '').trim()
  if (s.length <= max) return s
  const corte = s.slice(0, max)
  const ponto = Math.max(corte.lastIndexOf('. '), corte.lastIndexOf('! '), corte.lastIndexOf('? '))
  if (ponto > max * 0.6) return corte.slice(0, ponto + 1)
  return corte.slice(0, corte.lastIndexOf(' ')).replace(/[,;:\-–—]$/, '') + '.'
}

function slugify(titulo) {
  const base = String(titulo)
    .normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim()
    .replace(/\s+/g, '-').replace(/-+/g, '-')
  if (base.length <= 60) return base.replace(/-$/, '')
  return base.slice(0, 60).replace(/-[^-]*$/, '').replace(/-$/, '')
}

// O modelo erra; o código precisa barrar. Cada throw manda regerar a matéria.
function validar(a, { minPalavras = 620, maxTitulo = 78 } = {}) {
  const erros = []
  const html = String(a.contentHtml || '')

  if (!a.title || a.title.length > maxTitulo) erros.push(`título com ${a.title ? a.title.length : 0} caracteres (máx ${maxTitulo})`)
  if (!a.excerpt || a.excerpt.length < 100 || a.excerpt.length > 170) erros.push(`excerpt com ${a.excerpt ? a.excerpt.length : 0} caracteres (esperado 100–170)`)
  else if (!/[.!?]$/.test(a.excerpt.trim())) erros.push('excerpt sem pontuação final')

  const palavras = contaPalavras(html)
  if (palavras < minPalavras) erros.push(`matéria rasa (${palavras} palavras, mínimo ${minPalavras})`)
  if (!/^\s*<p[\s>]/i.test(html)) erros.push('corpo não abre com parágrafo de lide')
  if (/<blockquote/i.test(html)) erros.push('contém citação em blockquote')
  if (/\b(Lide|Sumário|Subtítulo|Corpo)\s*:/i.test(html)) erros.push('rótulo interno de redação vazou no corpo')
  if (html.includes('‑')) erros.push('hífen não separável no corpo')
  if (/\bregistam\b|\butilizador/i.test(html)) erros.push('português de Portugal')
  if (/<h2[^>]*>\s*(Introdução|Conclusão|Contexto histórico)/i.test(html)) erros.push('intertítulo genérico proibido')
  if (/<h2[^>]*>[^<]*leitor brasileiro/i.test(html)) erros.push('intertítulo com "leitor brasileiro"')
  // Só o vício formulaico ("Este artigo explica...") conta. "Compartilhe este guia"
  // é chamada legítima ao leitor e não deve ser marcada.
  if (
    /\b(est[ae])\s+(artigo|mat[ée]ria|guia|texto|reportagem)\s+(explica|apresenta|descomplica|traz|re[úu]ne|mostra|analisa|discute|aborda|explora|descreve|tra[çc]a|desmonta|detalha|resume)/i.test(html) ||
    /\bo objetivo (deste|desta) (texto|artigo|mat[ée]ria|guia)\b/i.test(html)
  ) {
    erros.push('o texto fala de si mesmo')
  }
  if (/segundo estudos|de acordo com especialistas|pesquisas apontam|estima-se que/i.test(html)) erros.push('atribuição vaga sem instituição nomeada')

  return erros
}

module.exports = { REGRAS_DE_FATO, REGRAS_DE_FORMA, TAGS_PERMITIDAS, sanitize, contaPalavras, cortar, slugify, validar }
