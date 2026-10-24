// Cabeçalho, rodapé e aviso de cookies dos 9 idiomas novos (fr de it nl ru zh ja ko ar). en/es continuam com o UI de
// lib/i18n.js, que já cobre o site inteiro neles. Arquivo separado do lib/blogDic.js de propósito: estes textos vão para o
// JavaScript do navegador (componentes de cliente), as frases das páginas não. "conferir" = revisor nativo deve olhar.
// As páginas fixas (sobre, contato, políticas) só existem em pt/en/es: os links levam para a versão em inglês.

const LINKS = ['/sobre', '/faq', '/contato', '/politica-de-privacidade', '/politica-de-cookies', '/termos-de-uso']

const C = {
  fr: {
    tagline: 'Le contexte, pas seulement les titres.', topbar: 'Journalisme explicatif, rigoureux et approfondi', noticias: 'Actualités',
    descricao: 'Journalisme explicatif et approfondi : Brésil, monde, politique, économie, technologie et science. Comprendre le contexte derrière chaque titre.',
    contato: 'Contact', direitos: 'Tous droits réservés', feitoPor: 'Réalisé par Agência Fada Madrinha', institucional: 'À propos', idiomas: 'Langues',
    links: ['À propos', 'FAQ', 'Contact', 'Politique de confidentialité', 'Politique relative aux cookies', "Conditions d'utilisation"],
    cookieTitulo: 'Ce site utilise des cookies',
    cookieTexto: "Nous utilisons des cookies essentiels au fonctionnement du site et, avec votre accord, des cookies d'analyse et de publicité pour améliorer votre expérience. En savoir plus dans notre",
    cookiePolitica: 'Politique relative aux cookies', cookieFim: '.', cookieAceitar: 'Tout accepter', cookieEssenciais: 'Essentiels uniquement', cookieAria: 'Avis sur les cookies',
  },
  de: {
    tagline: 'Kontext statt nur Schlagzeilen.', topbar: 'Erklärender Journalismus mit Tiefgang und Sorgfalt', noticias: 'Nachrichten',
    descricao: 'Erklärender Journalismus mit Tiefgang: Brasilien, Welt, Politik, Wirtschaft, Technologie und Wissenschaft. Der Kontext hinter jeder Schlagzeile.',
    contato: 'Kontakt', direitos: 'Alle Rechte vorbehalten', feitoPor: 'Erstellt von Agência Fada Madrinha', institucional: 'Über uns', idiomas: 'Sprachen',
    links: ['Über uns', 'FAQ', 'Kontakt', 'Datenschutzerklärung', 'Cookie-Richtlinie', 'Nutzungsbedingungen'],
    cookieTitulo: 'Diese Website verwendet Cookies',
    cookieTexto: 'Wir verwenden notwendige Cookies für den Betrieb der Website und, mit Ihrer Zustimmung, Analyse- und Werbe-Cookies, um Ihr Erlebnis zu verbessern. Mehr dazu in unserer',
    cookiePolitica: 'Cookie-Richtlinie', cookieFim: '.', cookieAceitar: 'Alle akzeptieren', cookieEssenciais: 'Nur notwendige', cookieAria: 'Cookie-Hinweis',
  },
  it: {
    tagline: 'Il contesto, non solo i titoli.', topbar: 'Giornalismo esplicativo, rigoroso e approfondito', noticias: 'Notizie',
    descricao: 'Giornalismo esplicativo e approfondito: Brasile, mondo, politica, economia, tecnologia e scienza. Il contesto dietro ogni titolo.',
    contato: 'Contatti', direitos: 'Tutti i diritti riservati', feitoPor: 'Realizzato da Agência Fada Madrinha', institucional: 'Chi siamo', idiomas: 'Lingue',
    links: ['Chi siamo', 'Domande frequenti', 'Contatti', 'Informativa sulla privacy', 'Cookie policy', "Termini d'uso"],
    cookieTitulo: 'Questo sito utilizza i cookie',
    cookieTexto: 'Usiamo cookie essenziali per il funzionamento del sito e, con il tuo consenso, cookie di analisi e pubblicità per migliorare la tua esperienza. Scopri di più nella nostra',
    cookiePolitica: 'Cookie policy', cookieFim: '.', cookieAceitar: 'Accetta tutti', cookieEssenciais: 'Solo essenziali', cookieAria: 'Avviso sui cookie',
  },
  nl: {
    tagline: 'Context, niet alleen koppen.', topbar: 'Verklarende journalistiek met diepgang en zorg', noticias: 'Nieuws',
    descricao: 'Verklarende journalistiek met diepgang: Brazilië, wereld, politiek, economie, technologie en wetenschap. De context achter elke kop.',
    contato: 'Contact', direitos: 'Alle rechten voorbehouden', feitoPor: 'Gemaakt door Agência Fada Madrinha', institucional: 'Over ons', idiomas: 'Talen',
    links: ['Over ons', 'Veelgestelde vragen', 'Contact', 'Privacybeleid', 'Cookiebeleid', 'Gebruiksvoorwaarden'],
    cookieTitulo: 'Deze site gebruikt cookies',
    cookieTexto: 'We gebruiken noodzakelijke cookies om de site te laten werken en, met je toestemming, analyse- en advertentiecookies om je ervaring te verbeteren. Lees meer in ons',
    cookiePolitica: 'Cookiebeleid', cookieFim: '.', cookieAceitar: 'Alles accepteren', cookieEssenciais: 'Alleen noodzakelijke', cookieAria: 'Cookiemelding',
  },
  ru: {
    tagline: 'Контекст, а не только заголовки.', topbar: 'Аналитическая журналистика: глубоко и точно', noticias: 'Новости',
    descricao: 'Аналитическая журналистика: Бразилия, мир, политика, экономика, технологии и наука. Контекст за каждым заголовком.',
    contato: 'Контакты', direitos: 'Все права защищены', feitoPor: 'Сделано Agência Fada Madrinha', institucional: 'О нас', idiomas: 'Языки',
    links: ['О нас', 'Вопросы и ответы', 'Контакты', 'Политика конфиденциальности', 'Политика использования cookie', 'Условия использования'],
    cookieTitulo: 'Сайт использует файлы cookie',
    cookieTexto: 'Мы используем необходимые cookie для работы сайта и, с вашего согласия, аналитические и рекламные cookie, чтобы сделать сайт удобнее. Подробнее — в нашей',
    cookiePolitica: 'политике использования cookie', cookieFim: '.', cookieAceitar: 'Принять все', cookieEssenciais: 'Только необходимые', cookieAria: 'Уведомление о cookie',
  },
  zh: {
    tagline: '不止标题，更有背景。', topbar: '有深度、严谨的解读型新闻', noticias: '新闻',
    descricao: '深度解读新闻：巴西、国际、政治、经济、科技与科学。读懂每条标题背后的来龙去脉。',
    contato: '联系我们', direitos: '版权所有', feitoPor: '由 Agência Fada Madrinha 制作', institucional: '关于我们', idiomas: '语言',
    links: ['关于我们', '常见问题', '联系我们', '隐私政策', 'Cookie 政策', '使用条款'],
    cookieTitulo: '本网站使用 Cookie',
    cookieTexto: '我们使用必要的 Cookie 保证网站正常运行，并在征得您同意后使用分析和广告 Cookie 来改善您的体验。详情请见我们的',
    cookiePolitica: 'Cookie 政策', cookieFim: '。', cookieAceitar: '全部接受', cookieEssenciais: '仅限必要', cookieAria: 'Cookie 提示',
  },
  ja: {
    tagline: '見出しだけでなく、背景まで。', topbar: '深く、正確に伝える解説報道', noticias: 'ニュース',
    descricao: 'ブラジルと世界、政治、経済、テクノロジー、科学を深く解説する報道。見出しの裏にある背景がわかります。',
    contato: 'お問い合わせ', direitos: '無断転載を禁じます', feitoPor: '制作：Agência Fada Madrinha', institucional: '運営情報', idiomas: '言語',
    links: ['私たちについて', 'よくある質問', 'お問い合わせ', 'プライバシーポリシー', 'Cookieポリシー', '利用規約'],
    cookieTitulo: 'このサイトはCookieを使用しています',
    cookieTexto: 'サイトの動作に必要なCookieに加え、同意いただいた場合は分析・広告用のCookieを使用して体験を向上させます。詳しくは',
    cookiePolitica: 'Cookieポリシー', cookieFim: 'をご覧ください。', cookieAceitar: 'すべて許可', cookieEssenciais: '必要なもののみ', cookieAria: 'Cookieに関するお知らせ',
  },
  ko: {
    tagline: '헤드라인 너머의 맥락.', topbar: '깊이와 정확성을 갖춘 해설 저널리즘', noticias: '뉴스',
    descricao: '브라질과 세계, 정치, 경제, 기술, 과학을 깊이 있게 풀어 주는 해설 저널리즘. 모든 헤드라인 뒤의 맥락을 전합니다.',
    contato: '문의', direitos: '모든 권리 보유', feitoPor: '제작: Agência Fada Madrinha', institucional: '소개', idiomas: '언어',
    links: ['소개', '자주 묻는 질문', '문의', '개인정보 처리방침', '쿠키 정책', '이용약관'],
    cookieTitulo: '이 사이트는 쿠키를 사용합니다',
    cookieTexto: '사이트 운영에 필요한 쿠키를 사용하며, 동의하시면 분석 및 광고 쿠키로 더 나은 경험을 제공합니다. 자세한 내용은',
    cookiePolitica: '쿠키 정책', cookieFim: '을 확인하세요.', cookieAceitar: '모두 허용', cookieEssenciais: '필수만 허용', cookieAria: '쿠키 안내',
  },
  ar: {
    tagline: 'السياق، لا العناوين فقط.', topbar: 'صحافة تفسيرية بعمق ودقة', noticias: 'الأخبار',
    descricao: 'صحافة تفسيرية معمّقة: البرازيل والعالم والسياسة والاقتصاد والتكنولوجيا والعلوم. السياق الكامل وراء كل عنوان.',
    contato: 'اتصل بنا', direitos: 'جميع الحقوق محفوظة', feitoPor: 'من إنتاج Agência Fada Madrinha', institucional: 'من نحن', idiomas: 'اللغات',
    links: ['من نحن', 'الأسئلة الشائعة', 'اتصل بنا', 'سياسة الخصوصية', 'سياسة ملفات تعريف الارتباط', 'شروط الاستخدام'],
    cookieTitulo: 'يستخدم هذا الموقع ملفات تعريف الارتباط',
    cookieTexto: 'نستخدم ملفات تعريف الارتباط الضرورية لتشغيل الموقع، وبموافقتك ملفات التحليل والإعلانات لتحسين تجربتك. اعرف المزيد في', // conferir
    cookiePolitica: 'سياسة ملفات تعريف الارتباط', cookieFim: '.', cookieAceitar: 'قبول الكل', cookieEssenciais: 'الضرورية فقط', cookieAria: 'إشعار ملفات تعريف الارتباط',
  },
}

export const casca = (idioma) => C[idioma] || null

// os 6 links institucionais com o nome no idioma; o endereço é o da versão em inglês
export const linksInstitucionais = (idioma) => (C[idioma]?.links || []).map((name, i) => ({ name, href: `/en${LINKS[i]}` }))
