import Link from 'next/link'
import { t } from '@/lib/tokens'
import { direcao } from '@/lib/idiomas'

// Botão SEMPRE à mostra nas páginas do blog em outro idioma (regra da Dani, 15/10): fixo no canto no computador e barra
// na largura toda no celular, visível ao abrir e ao rolar. No portal de notícias o convite é continuar lendo no idioma
// (não há cadastro: a newsletter e os alertas são só em português). O espaço no fim da página evita cobrir o rodapé.
// O CSS das grades das páginas em idioma mora aqui também (as duas páginas renderizam este componente). No celular nada
// vira pilha (regra da Dani): a lista fica em grade de 2 e o "leia também" em trilho com encaixe.
// O aviso de cookies (z-index 100, colado embaixo) cobria o botão na primeira visita: nestas páginas ele sobe acima dele.
const CSS = `
.es-cta-fixo{position:fixed;z-index:60;bottom:22px;inset-inline-end:24px;display:flex;pointer-events:none}
.es-cta-fixo a{pointer-events:auto}
.es-cta-espaco{height:0}
.es-aviso-cookie{bottom:88px !important}
.es-grade-idioma{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:22px}
.es-relacionadas{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
[dir=rtl] .prose ul,[dir=rtl] .prose ol{padding-left:0;padding-right:1.4em}
@media (max-width:720px){
  .es-cta-fixo{inset-inline-start:12px;inset-inline-end:12px;bottom:12px}
  .es-cta-fixo a{flex:1;justify-content:center}
  .es-cta-espaco{height:78px}
  .es-grade-idioma{grid-template-columns:1fr 1fr;gap:12px}
  .es-grade-idioma .es-cartao-desc{display:none}
  .es-grade-idioma .es-cartao-titulo{font-size:14.5px !important}
  .es-relacionadas{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:12px;padding-bottom:6px}
  .es-relacionadas > a{flex:0 0 84%;scroll-snap-align:start}
}
`

export default function CtaFixo({ href, rotulo, lang }) {
  const rtl = direcao(lang) === 'rtl'
  return (
    <>
      <style>{CSS}</style>
      <div className="es-cta-espaco" aria-hidden="true" />
      <div className="es-cta-fixo" dir={direcao(lang)}>
        <Link
          href={href}
          className="btn"
          data-cta="fixo"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: t.sunGrad,
            color: '#131417',
            fontWeight: 900,
            fontSize: 15,
            letterSpacing: 0.2,
            padding: '14px 24px',
            borderRadius: 999,
            boxShadow: '0 10px 30px rgba(255,107,0,0.35), 0 2px 8px rgba(0,0,0,0.25)',
            whiteSpace: 'nowrap',
          }}
        >
          {rotulo}
          <span aria-hidden="true">{rtl ? '←' : '→'}</span>
        </Link>
      </div>
    </>
  )
}
