# Explosão Solar ☀️

Portal de notícias e jornalismo explicativo — explosaosolar.com

## Stack

- Next.js 15 (App Router) + React 19, inline styles com design tokens
- Conteúdo file-based: `content/articles/*.json` (uma matéria por arquivo) + `content/institutional.json`
- Deploy: Vercel

## Estrutura

- `app/` — home, editorias (`/[categoria]`), matéria (`/noticia/[slug]`), busca, FAQ, políticas (privacidade, cookies, termos), sobre, contato
- `components/` — Header (menu chips), Footer, CookieBanner (LGPD), Analytics (GA4 só com consentimento), cards, share, newsletter
- `lib/content.js` — camada de conteúdo; `lib/tokens.js` — design tokens

## Formato de matéria (`content/articles/<slug>.json`)

```json
{
  "slug": "", "title": "", "subtitle": "", "category": "", "categorySlug": "",
  "excerpt": "", "author": "Redação Explosão Solar", "publishedAt": "ISO-8601",
  "readingMinutes": 0, "tags": [], "contentHtml": "<p>…</p>"
}
```

Basta adicionar um JSON novo e fazer deploy — home, editoria, sitemap e busca atualizam sozinhos.

## Env vars

- `NEXT_PUBLIC_GA_ID` — Google Analytics 4 (opcional; só carrega com consentimento de cookies)

## Rodar local

```bash
npm install
npm run dev
```
