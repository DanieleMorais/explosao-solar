import Link from 'next/link'
import SunLogo from './SunLogo'
import { t } from '@/lib/tokens'
import { SITE } from '@/lib/site'
import { casca, linksInstitucionais } from '@/lib/blogCasca'
import { NOME_IDIOMA, HREFLANG, IDIOMAS_TRADUCAO, direcao, caminhoLista } from '@/lib/idiomas'

// Rodapé das páginas nos 9 idiomas novos: mesmo visual do Footer, nada em português. A coluna das editorias (que não
// existem nesses idiomas) vira a das edições por idioma; as páginas fixas levam à versão em inglês.
// No celular os blocos vão um embaixo do outro, mas as listas ficam em colunas (12 idiomas em 3, 6 links em 2), não
// numa pilha de 18 linhas.
const CSS = `@media (max-width:720px){
.es-rodape{grid-template-columns:minmax(0,1fr) !important;gap:28px !important}
.es-rodape-idiomas{grid-template-columns:repeat(3,minmax(0,1fr)) !important}
.es-rodape-links{display:grid !important;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 16px !important}
}`

export default function RodapeIdioma({ idioma }) {
  const c = casca(idioma)
  const titulo = { color: '#fff', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }
  const edicoes = [['pt', '/'], ...IDIOMAS_TRADUCAO.map((i) => [i, caminhoLista(i)])]

  return (
    <footer lang={idioma} dir={direcao(idioma)} style={{ background: t.dark, color: 'rgba(255,255,255,0.72)', marginTop: 56 }}>
      <style>{CSS}</style>
      <div style={{ height: 3, background: t.sunGrad }} />
      <div
        className="es-rodape"
        style={{
          maxWidth: t.maxW,
          margin: '0 auto',
          padding: '48px clamp(20px, 3vw, 56px) 36px',
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr 1.2fr',
          gap: 40,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <SunLogo size={30} />
            <span
              style={{
                fontWeight: 900,
                fontSize: 19,
                textTransform: 'uppercase',
                letterSpacing: -0.3,
                background: t.sunGrad,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Explosão Solar
            </span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 420 }}>{c.descricao}</p>
          <p style={{ fontSize: 13.5, marginTop: 16 }}>
            {c.contato}:{' '}
            <a href={`mailto:${SITE.email}`} className="hoverlink" style={{ color: '#FFB300', fontWeight: 600 }}>
              {SITE.email}
            </a>
          </p>
        </div>

        <nav aria-label={c.idiomas}>
          <h3 style={titulo}>{c.idiomas}</h3>
          <ul className="es-rodape-idiomas" style={{ listStyle: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
            {edicoes.map(([i, href]) => (
              <li key={i}>
                <Link href={href} hrefLang={HREFLANG[i]} lang={HREFLANG[i]} className="hoverlink" style={{ fontSize: 14, fontWeight: i === idioma ? 800 : 400 }}>
                  {NOME_IDIOMA[i]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={c.institucional}>
          <h3 style={titulo}>{c.institucional}</h3>
          <ul className="es-rodape-links" style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {linksInstitucionais(idioma).map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hoverlink" style={{ fontSize: 14 }}>
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div style={{ borderTop: `1px solid ${t.darkLine}` }}>
        <div
          style={{
            maxWidth: t.maxW,
            margin: '0 auto',
            padding: '18px clamp(20px, 3vw, 56px)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            justifyContent: 'space-between',
            fontSize: 12.5,
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          <span>
            © 2026 Explosão Solar · {c.direitos} · {c.feitoPor}
          </span>
          <span>explosaosolar.com</span>
        </div>
      </div>
    </footer>
  )
}
