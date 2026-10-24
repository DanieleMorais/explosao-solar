// Textos de interface das páginas traduzidas (lista e matéria) nos 11 idiomas. O conteúdo das matérias vem dos arquivos
// de content/i18n, já traduzido; aqui só a moldura. Sem emoji, sem bandeira. Chaves das editorias = categorySlug do PT.
// "conferir" = frase que um revisor nativo deve olhar antes de a Dani divulgar o idioma.
// Só servidor (páginas): o cabeçalho, o rodapé e o aviso de cookies dos 9 idiomas novos estão em lib/blogCasca.js.
import { SITE } from './site.js'
import { HREFLANG, LOCALE_DATA } from './idiomas.js'
import { caminhoArtigo } from './blogSlug.js'

export const BLOG_DIC = {
  en: {
    noticias: 'News', listaTitulo: 'News in English',
    listaIntro: 'Stories from Brazil and the world, explained in depth by the Explosão Solar newsroom.',
    vazio: 'No stories in this language yet.', vazioTexto: 'The first stories are on the way. Meanwhile, browse the full English edition.',
    ctaEdicao: 'Open the English edition', maisNoticias: 'More news', lerMaisRecente: 'Read the latest story',
    leitura: '{n} min read', publicadoEm: 'Published on', leiaTambem: 'Read also', tambemEm: 'Also available in',
    traduzidoDe: 'Translated from the original in Portuguese', fonte: 'Source', imagem: 'Image', compartilhar: 'Share',
    compartilharEm: 'Share on {rede}', ler: 'Read',
    categorias: { mundo: 'World', brasil: 'Brazil', politica: 'Politics', economia: 'Economy', tecnologia: 'Technology', ciencia: 'Science', esportes: 'Sports', cultura: 'Culture' },
  },
  es: {
    noticias: 'Noticias', listaTitulo: 'Noticias en español',
    listaIntro: 'Historias de Brasil y del mundo, explicadas en profundidad por la redacción de Explosão Solar.',
    vazio: 'Todavía no hay noticias en este idioma.', vazioTexto: 'Las primeras noticias están en camino. Mientras tanto, recorre la edición completa en español.',
    ctaEdicao: 'Abrir la edición en español', maisNoticias: 'Más noticias', lerMaisRecente: 'Leer la más reciente',
    leitura: '{n} min de lectura', publicadoEm: 'Publicado el', leiaTambem: 'Lee también', tambemEm: 'También disponible en',
    traduzidoDe: 'Traducido del original en portugués', fonte: 'Fuente', imagem: 'Imagen', compartilhar: 'Compartir',
    compartilharEm: 'Compartir en {rede}', ler: 'Leer',
    categorias: { mundo: 'Mundo', brasil: 'Brasil', politica: 'Política', economia: 'Economía', tecnologia: 'Tecnología', ciencia: 'Ciencia', esportes: 'Deportes', cultura: 'Cultura' },
  },
  fr: {
    noticias: 'Actualités', listaTitulo: 'Actualités en français',
    listaIntro: "Le Brésil et le monde, expliqués en profondeur par la rédaction d'Explosão Solar.",
    vazio: "Pas encore d'articles dans cette langue.", vazioTexto: "Les premiers articles arrivent bientôt. En attendant, lisez l'édition en anglais.",
    ctaEdicao: "Lire l'édition anglaise", maisNoticias: "Plus d'actualités", lerMaisRecente: 'Lire le dernier article',
    leitura: '{n} min de lecture', publicadoEm: 'Publié le', leiaTambem: 'À lire aussi', tambemEm: 'Aussi disponible en',
    traduzidoDe: "Traduit de l'original en portugais", fonte: 'Source', imagem: 'Image', compartilhar: 'Partager',
    compartilharEm: 'Partager sur {rede}', ler: 'Lire',
    categorias: { mundo: 'Monde', brasil: 'Brésil', politica: 'Politique', economia: 'Économie', tecnologia: 'Technologie', ciencia: 'Science', esportes: 'Sport', cultura: 'Culture' },
  },
  de: {
    noticias: 'Nachrichten', listaTitulo: 'Nachrichten auf Deutsch',
    listaIntro: 'Brasilien und die Welt, ausführlich erklärt von der Redaktion von Explosão Solar.',
    vazio: 'In dieser Sprache gibt es noch keine Artikel.', vazioTexto: 'Die ersten Artikel kommen bald. Bis dahin: Lesen Sie die englische Ausgabe.',
    ctaEdicao: 'Zur englischen Ausgabe', maisNoticias: 'Mehr Nachrichten', lerMaisRecente: 'Neuesten Artikel lesen',
    leitura: '{n} Min. Lesezeit', publicadoEm: 'Veröffentlicht am', leiaTambem: 'Auch lesenswert', tambemEm: 'Auch verfügbar auf',
    traduzidoDe: 'Übersetzt aus dem portugiesischen Original', fonte: 'Quelle', imagem: 'Bild', compartilhar: 'Teilen',
    compartilharEm: 'Auf {rede} teilen', ler: 'Lesen',
    categorias: { mundo: 'Welt', brasil: 'Brasilien', politica: 'Politik', economia: 'Wirtschaft', tecnologia: 'Technologie', ciencia: 'Wissenschaft', esportes: 'Sport', cultura: 'Kultur' },
  },
  it: {
    noticias: 'Notizie', listaTitulo: 'Notizie in italiano',
    listaIntro: 'Il Brasile e il mondo, spiegati in profondità dalla redazione di Explosão Solar.',
    vazio: 'Non ci sono ancora articoli in questa lingua.', vazioTexto: "I primi articoli arriveranno presto. Nel frattempo, leggi l'edizione in inglese.",
    ctaEdicao: "Vai all'edizione inglese", maisNoticias: 'Altre notizie', lerMaisRecente: "Leggi l'ultimo articolo",
    leitura: '{n} min di lettura', publicadoEm: 'Pubblicato il', leiaTambem: 'Leggi anche', tambemEm: 'Disponibile anche in',
    traduzidoDe: "Tradotto dall'originale in portoghese", fonte: 'Fonte', imagem: 'Immagine', compartilhar: 'Condividi',
    compartilharEm: 'Condividi su {rede}', ler: 'Leggi',
    categorias: { mundo: 'Mondo', brasil: 'Brasile', politica: 'Politica', economia: 'Economia', tecnologia: 'Tecnologia', ciencia: 'Scienza', esportes: 'Sport', cultura: 'Cultura' },
  },
  nl: {
    noticias: 'Nieuws', listaTitulo: 'Nieuws in het Nederlands',
    listaIntro: 'Brazilië en de wereld, diepgaand uitgelegd door de redactie van Explosão Solar.',
    vazio: 'Er zijn nog geen artikelen in deze taal.', vazioTexto: 'De eerste artikelen komen eraan. Lees intussen de Engelse editie.',
    ctaEdicao: 'Naar de Engelse editie', maisNoticias: 'Meer nieuws', lerMaisRecente: 'Lees het nieuwste artikel',
    leitura: '{n} min leestijd', publicadoEm: 'Gepubliceerd op', leiaTambem: 'Lees ook', tambemEm: 'Ook beschikbaar in',
    traduzidoDe: 'Vertaald uit het Portugese origineel', fonte: 'Bron', imagem: 'Afbeelding', compartilhar: 'Delen',
    compartilharEm: 'Delen op {rede}', ler: 'Lees',
    categorias: { mundo: 'Wereld', brasil: 'Brazilië', politica: 'Politiek', economia: 'Economie', tecnologia: 'Technologie', ciencia: 'Wetenschap', esportes: 'Sport', cultura: 'Cultuur' },
  },
  ru: {
    noticias: 'Новости', listaTitulo: 'Новости на русском',
    listaIntro: 'Бразилия и мир — подробно и с контекстом от редакции Explosão Solar.',
    vazio: 'На этом языке статей пока нет.', vazioTexto: 'Первые статьи скоро появятся. А пока читайте англоязычную версию.',
    ctaEdicao: 'Открыть английскую версию', maisNoticias: 'Больше новостей', lerMaisRecente: 'Читать свежую статью',
    leitura: '{n} мин чтения', publicadoEm: 'Опубликовано', leiaTambem: 'Читайте также', tambemEm: 'Также доступно на языках',
    traduzidoDe: 'Перевод с португальского оригинала', fonte: 'Источник', imagem: 'Изображение', compartilhar: 'Поделиться',
    compartilharEm: 'Поделиться в {rede}', ler: 'Читать',
    categorias: { mundo: 'Мир', brasil: 'Бразилия', politica: 'Политика', economia: 'Экономика', tecnologia: 'Технологии', ciencia: 'Наука', esportes: 'Спорт', cultura: 'Культура' },
  },
  zh: {
    noticias: '新闻', listaTitulo: '中文新闻',
    listaIntro: 'Explosão Solar 编辑部为您深度解读巴西与世界。',
    vazio: '该语言暂时还没有文章。', vazioTexto: '首批文章即将上线。您可以先阅读英文版。',
    ctaEdicao: '阅读英文版', maisNoticias: '更多新闻', lerMaisRecente: '阅读最新文章',
    leitura: '阅读约 {n} 分钟', publicadoEm: '发布于', leiaTambem: '延伸阅读', tambemEm: '其他语言版本',
    traduzidoDe: '译自葡萄牙语原文', fonte: '来源', imagem: '图片', compartilhar: '分享',
    compartilharEm: '分享到 {rede}', ler: '阅读',
    categorias: { mundo: '国际', brasil: '巴西', politica: '政治', economia: '经济', tecnologia: '科技', ciencia: '科学', esportes: '体育', cultura: '文化' },
  },
  ja: {
    noticias: 'ニュース', listaTitulo: '日本語のニュース',
    listaIntro: 'ブラジルと世界のニュースを、Explosão Solar 編集部が深く解説します。',
    vazio: 'この言語の記事はまだありません。', vazioTexto: '最初の記事はまもなく公開されます。それまでは英語版をご覧ください。',
    ctaEdicao: '英語版を読む', maisNoticias: 'ほかのニュース', lerMaisRecente: '最新記事を読む',
    leitura: '約{n}分で読めます', publicadoEm: '公開日', leiaTambem: 'あわせて読みたい', tambemEm: 'ほかの言語で読む',
    traduzidoDe: 'ポルトガル語の原文からの翻訳', fonte: '出典', imagem: '画像', compartilhar: '共有',
    compartilharEm: '{rede}で共有', ler: '読む',
    categorias: { mundo: '世界', brasil: 'ブラジル', politica: '政治', economia: '経済', tecnologia: 'テクノロジー', ciencia: '科学', esportes: 'スポーツ', cultura: '文化' },
  },
  ko: {
    noticias: '뉴스', listaTitulo: '한국어 뉴스',
    listaIntro: 'Explosão Solar 편집국이 브라질과 세계의 소식을 깊이 있게 전합니다.',
    vazio: '아직 이 언어로 된 기사가 없습니다.', vazioTexto: '첫 기사가 곧 올라옵니다. 그동안 영어판을 읽어 보세요.',
    ctaEdicao: '영어판 읽기', maisNoticias: '뉴스 더 보기', lerMaisRecente: '최신 기사 읽기',
    leitura: '{n}분 읽기', publicadoEm: '게시일', leiaTambem: '함께 읽기', tambemEm: '다른 언어로 읽기',
    traduzidoDe: '포르투갈어 원문 번역', fonte: '출처', imagem: '이미지', compartilhar: '공유',
    compartilharEm: '{rede}에 공유', ler: '읽기',
    categorias: { mundo: '세계', brasil: '브라질', politica: '정치', economia: '경제', tecnologia: '기술', ciencia: '과학', esportes: '스포츠', cultura: '문화' },
  },
  ar: {
    noticias: 'الأخبار', listaTitulo: 'أخبار بالعربية',
    listaIntro: 'البرازيل والعالم، بشرح معمّق من فريق تحرير Explosão Solar.',
    vazio: 'لا توجد مقالات بهذه اللغة بعد.', vazioTexto: 'المقالات الأولى في الطريق. وحتى ذلك الحين، اقرأ النسخة الإنجليزية.',
    ctaEdicao: 'افتح النسخة الإنجليزية', maisNoticias: 'المزيد من الأخبار', lerMaisRecente: 'اقرأ أحدث مقال',
    leitura: '{n} د للقراءة', publicadoEm: 'نُشر في', leiaTambem: 'اقرأ أيضًا', tambemEm: 'متوفر أيضًا بـ', // conferir
    traduzidoDe: 'مترجم من الأصل البرتغالي', fonte: 'المصدر', imagem: 'الصورة', compartilhar: 'شارك',
    compartilharEm: 'شارك على {rede}', ler: 'اقرأ',
    categorias: { mundo: 'العالم', brasil: 'البرازيل', politica: 'السياسة', economia: 'الاقتصاد', tecnologia: 'التكنولوجيا', ciencia: 'العلوم', esportes: 'الرياضة', cultura: 'الثقافة' },
  },
}

export const dicBlog = (idioma) => BLOG_DIC[idioma] || BLOG_DIC.en

// O crédito da foto vem da matéria PT. O único trecho em português que aparece lá é o das imagens geradas pela casa
// ("Ilustração de IA · Explosão Solar", 86 matérias em 23/10); o resto é nome de autor/licença, que não se traduz.
const ILUSTRACAO_IA = {
  en: 'AI illustration', es: 'Ilustración de IA', fr: 'Illustration générée par IA', de: 'KI-Illustration', it: 'Illustrazione IA',
  nl: 'AI-illustratie', ru: 'Иллюстрация, созданная ИИ', zh: 'AI 插图', ja: 'AIによるイラスト', ko: 'AI 일러스트', ar: 'رسم توضيحي بالذكاء الاصطناعي',
}
export const creditoImagem = (credito, idioma) => String(credito || '').replace(/^\s*Ilustração de IA\b/u, ILUSTRACAO_IA[idioma] || ILUSTRACAO_IA.en)

export const preencher = (modelo, valores) =>
  String(modelo).replace(/\{(\w+)\}/g, (_, k) => (typeof valores === 'object' ? valores[k] : valores) ?? '')

export const dataNoticia = (iso, idioma) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(LOCALE_DATA[idioma] || 'en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' })
}

export const urlAbsoluta = (caminho) => `${SITE.url}${caminho}`

// hreflang entre as versões que EXISTEM: pt-BR (a original), cada idioma com o slug DELE e x-default = PT. Sem tradução
// publicada, undefined (a página PT fica como sempre foi: só canonical).
export function hreflangDoBlog(slugPt, versoes) {
  const idiomas = Object.keys(versoes || {})
  if (!idiomas.length) return undefined
  const pt = urlAbsoluta(caminhoArtigo('pt', slugPt))
  return {
    'pt-BR': pt,
    ...Object.fromEntries(idiomas.map((i) => [HREFLANG[i] || i, urlAbsoluta(caminhoArtigo(i, versoes[i]))])),
    'x-default': pt,
  }
}

// JSON-LD dentro de <script>: "<" escapado para um título com "</script>" não fechar a tag.
export const jsonLd = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c')
