import { ImageResponse } from 'next/og'
import { getArticle } from '@/lib/content'
import { catColor } from '@/lib/tokens'
import { catLabel } from '@/lib/i18n'

export const ogSize = { width: 1200, height: 630 }

export async function renderArticleOg(slug, lang) {
  const article = getArticle(slug, lang)
  if (!article) return new Response('Not found', { status: 404 })

  const color = catColor(article.categorySlug)
  const fontSize = article.title.length > 70 ? 46 : article.title.length > 45 ? 54 : 62

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background: `linear-gradient(140deg, ${color} 0%, #101322 72%)`,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -160,
            right: -100,
            width: 460,
            height: 460,
            borderRadius: 9999,
            background: 'radial-gradient(circle, rgba(255,179,0,0.4) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            alignSelf: 'flex-start',
            background: 'rgba(255,255,255,0.95)',
            color,
            fontWeight: 800,
            fontSize: 24,
            letterSpacing: 3,
            textTransform: 'uppercase',
            padding: '10px 26px',
            borderRadius: 999,
            display: 'flex',
          }}
        >
          {catLabel(lang, article.categorySlug)}
        </div>
        <div style={{ fontSize, fontWeight: 900, color: '#ffffff', lineHeight: 1.15, letterSpacing: -1, display: 'flex', maxWidth: 1060 }}>
          {article.title}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{
              fontSize: 30,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: -0.5,
              background: 'linear-gradient(100deg, #FF6B00, #FFB300)',
              backgroundClip: 'text',
              color: 'transparent',
              display: 'flex',
            }}
          >
            ☀ Explosão Solar
          </div>
          <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.6)', display: 'flex' }}>explosaosolar.com</div>
        </div>
      </div>
    ),
    ogSize
  )
}
