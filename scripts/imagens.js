// Atribui uma imagem (com crédito) a cada matéria, via Openverse (licença comercial).
// A busca sai do ASSUNTO da matéria (tags e título, em inglês quando dá) e a foto é
// recusada quando mostra um lugar que a matéria não cita ou quando o tom não bate
// com uma tragédia. Aplica a mesma imagem às traduções.
// Uso: node scripts/imagens.js [--limite 40] [--forcar] [--seco] [--detalhe]
//      node scripts/imagens.js --slugs slug-a,slug-b        (reprocessa mesmo com imagem)
//      node scripts/imagens.js --so-suspeitas caminho/auditoria-imagens.json

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const PT_DIR = path.join(ROOT, 'content', 'articles')
const LOG = path.join(__dirname, 'imagens.log')
const UA = { 'User-Agent': 'ExplosaoSolarBot/1.0 (+https://explosaosolar.com)' }

const QUERIES = {
  mundo: ['world globe map', 'international flags', 'city skyline aerial', 'earth from space'],
  brasil: ['brazil landscape', 'brasilia architecture', 'brazilian city aerial', 'são paulo skyline'],
  politica: ['parliament building', 'government chamber', 'courthouse justice', 'voting ballot'],
  economia: ['finance money', 'stock market chart', 'business office', 'banknotes currency'],
  tecnologia: ['technology circuit board', 'artificial intelligence', 'computer code screen', 'data server'],
  ciencia: ['science laboratory', 'space astronomy galaxy', 'nature climate', 'microscope research'],
  esportes: ['stadium crowd', 'soccer football field', 'running athletics track', 'sport arena'],
  cultura: ['cinema film reel', 'music concert stage', 'books library', 'art gallery museum'],
}

const PARADAS = new Set(
  ('a as o os um uma uns umas de do da dos das em no na nos nas ao aos e ou que se por para com sem sob sobre entre apos antes ate desde contra durante mais menos muito pouco seu sua seus suas este esta isso aquele aquela qual quais quando onde como porque ja nao sim ele ela eles elas nesta neste nessa nesse pela pelo pelos pelas foi ser sera tem tem que ha vai vao dia dias hoje ontem amanha semana mes ano anos apos nova novo novos novas grande grandes primeiro primeira ultimo ultima the of in on at for to and or with without from about after before into over under is are was were will be has have had this that these those his her its their there here what which when where why how not new more most very just also than then them they you your our it as by' +
    ' el la los las un una y o de del en con sin por para sobre entre como cuando donde porque').split(/\s+/)
)

// Tags que não viram foto nenhuma.
const TAGS_MORTAS = new Set(
  ['ao vivo', 'transmissao ao vivo', 'live broadcast', 'live', 'entrevista', 'interview', 'analise', 'analysis', 'opiniao', 'opinion', 'noticias', 'news', 'atualizacao', 'update', 'video', 'escalacao', 'lineup', 'agenda', 'resumo', 'summary', 'balanco', 'coletiva', 'declaracao', 'statement', 'polemica', 'repercussao']
)

// Palavras de matéria brasileira que o Openverse só indexa em inglês.
const GLOSSARIO = {
  terremoto: 'earthquake', sismo: 'earthquake', tremor: 'earthquake', replicas: 'aftershock',
  resgate: 'rescue', socorristas: 'rescue workers', escombros: 'rubble', desabamento: 'collapsed building',
  incendio: 'fire', fogo: 'fire', bombeiros: 'firefighters', fumaca: 'smoke', queimada: 'wildfire',
  enchente: 'flood', enchentes: 'flood', inundacao: 'flood', chuva: 'rain', chuvas: 'rain', seca: 'drought',
  tempestade: 'storm', furacao: 'hurricane', ciclone: 'cyclone', vendaval: 'windstorm', granizo: 'hail',
  deslizamento: 'landslide', barragem: 'dam', vitimas: 'victims', vitima: 'victim', morte: 'funeral',
  mortos: 'memorial', luto: 'mourning', desaparecidos: 'missing persons', tragedia: 'disaster',
  acidente: 'accident', colisao: 'crash', naufragio: 'shipwreck', guerra: 'war', ataque: 'attack',
  bombardeio: 'bombing', refugiados: 'refugees', ajuda: 'aid', doacoes: 'donations', abrigo: 'shelter',
  hospital: 'hospital', saude: 'health', medico: 'doctor', medicos: 'doctors', vacina: 'vaccine',
  vacinacao: 'vaccination', remedio: 'medicine', pesquisa: 'research', vitimados: 'victims',
  policia: 'police', crime: 'crime', prisao: 'prison', assassinato: 'crime scene', roubo: 'robbery',
  violencia: 'police', seguranca: 'security', investigacao: 'investigation', operacao: 'police operation',
  justica: 'courtroom', tribunal: 'courtroom', juiz: 'judge gavel', ministro: 'government official',
  julgamento: 'courtroom trial', lei: 'law book', constituicao: 'constitution document',
  eleicao: 'election', eleicoes: 'election', eleitoral: 'election', voto: 'ballot', votacao: 'ballot box',
  urna: 'ballot box', candidato: 'election campaign', candidatos: 'election campaign',
  campanha: 'election campaign', partido: 'political party', partidos: 'political party',
  congresso: 'parliament', senado: 'senate chamber', camara: 'parliament chamber', deputado: 'parliament',
  presidente: 'government building', governo: 'government building', reforma: 'government building',
  politica: 'politics', democracia: 'democracy', protesto: 'protest', manifestacao: 'protest march',
  greve: 'strike protest', sindicato: 'labor union',
  economia: 'economy', inflacao: 'inflation chart', juros: 'interest rate chart', dolar: 'us dollars',
  real: 'brazilian currency', moeda: 'currency', banco: 'bank building', bolsa: 'stock exchange',
  mercado: 'stock market', investimento: 'investment chart', imposto: 'tax documents',
  emprego: 'workers office', desemprego: 'unemployment line', salario: 'payroll money',
  industria: 'factory industry', agronegocio: 'farm agriculture', safra: 'harvest crops',
  soja: 'soybean field', petroleo: 'oil rig', combustivel: 'gas station', energia: 'power plant',
  eletricidade: 'power lines', comercio: 'shopping street', empresa: 'office building',
  futebol: 'football match', jogo: 'football match', partida: 'football match', time: 'football team',
  clube: 'football club', estadio: 'football stadium', torcida: 'football fans crowd', gol: 'football goal',
  campeonato: 'football championship', liga: 'football league', copa: 'football trophy',
  treino: 'training session', tecnico: 'football coach', jogador: 'football player', arbitro: 'referee',
  basquete: 'basketball', volei: 'volleyball', tenis: 'tennis', natacao: 'swimming', corrida: 'running race',
  olimpiadas: 'olympic games', atleta: 'athlete',
  tecnologia: 'technology', internet: 'internet network', celular: 'smartphone', aplicativo: 'mobile app',
  computador: 'computer', dados: 'data center', privacidade: 'data privacy', golpe: 'online scam',
  robo: 'robot', ciencia: 'science laboratory', espaco: 'outer space', foguete: 'rocket launch',
  satelite: 'satellite orbit', clima: 'climate', meio: 'environment', ambiente: 'environment',
  floresta: 'forest', amazonia: 'amazon rainforest', desmatamento: 'deforestation', oceano: 'ocean',
  poluicao: 'pollution', animais: 'wildlife animals', escola: 'school classroom', educacao: 'classroom',
  universidade: 'university campus', professor: 'teacher classroom', estudante: 'students studying',
  transporte: 'public transport', onibus: 'city bus', metro: 'subway train', aviao: 'airplane',
  aeroporto: 'airport terminal', estrada: 'highway road', transito: 'traffic', porto: 'seaport',
  turismo: 'tourism', viagem: 'travel', cultura: 'culture', cinema: 'movie theater', filme: 'film reel',
  musica: 'music concert', show: 'concert stage', livro: 'books', arte: 'art gallery', teatro: 'theater stage',
  festival: 'festival stage', religiao: 'church', igreja: 'church', papa: 'vatican', missa: 'church mass',
  moradia: 'housing', casa: 'houses', favela: 'urban housing', cidade: 'city street', obras: 'construction site',
  construcao: 'construction site', agua: 'water supply', saneamento: 'water treatment', lixo: 'waste',
}

const GENTILICOS = {
  brasileiro: 'brasil', brasileira: 'brasil', brazilian: 'brasil',
  canadense: 'canada', canadian: 'canada', quebecois: 'quebec',
  frances: 'franca', francesa: 'franca', french: 'franca', parisian: 'paris',
  ingles: 'inglaterra', inglesa: 'inglaterra', english: 'inglaterra', british: 'reino unido', londoner: 'london',
  alemao: 'alemanha', alema: 'alemanha', german: 'alemanha', bavarian: 'baviera',
  italiano: 'italia', italiana: 'italia', italian: 'italia', roman: 'roma', milanese: 'milan',
  espanhol: 'espanha', espanhola: 'espanha', spanish: 'espanha', catalan: 'catalunha',
  portugues: 'portugal', portuguesa: 'portugal', portuguese: 'portugal', lisbon: 'lisboa',
  americano: 'estados unidos', american: 'estados unidos', mexicano: 'mexico', mexican: 'mexico',
  argentino: 'argentina', argentine: 'argentina', chileno: 'chile', chilean: 'chile',
  colombiano: 'colombia', colombian: 'colombia', peruano: 'peru', peruvian: 'peru',
  japones: 'japao', japanese: 'japao', chines: 'china', chinese: 'china', korean: 'coreia',
  indiano: 'india', indian: 'india', russo: 'russia', russian: 'russia',
  egipcio: 'egito', egipcia: 'egito', egyptian: 'egito', marroquino: 'marrocos', moroccan: 'marrocos',
  saudita: 'arabia saudita', saudi: 'arabia saudita', turco: 'turquia', turkish: 'turquia',
  grego: 'grecia', greek: 'grecia', holandes: 'holanda', dutch: 'holanda', belga: 'belgica', belgian: 'belgica',
  suico: 'suica', swiss: 'suica', austriaco: 'austria', austrian: 'austria', sueco: 'suecia', swedish: 'suecia',
  noruegues: 'noruega', norwegian: 'noruega', dinamarques: 'dinamarca', danish: 'dinamarca',
  polones: 'polonia', polish: 'polonia', australiano: 'australia', australian: 'australia',
}

// Lugares que aparecem em título/crédito de banco de imagem. A foto que anuncia uma CIDADE
// só passa se a matéria citar essa cidade; a que anuncia só o PAÍS passa se a matéria citar
// o país, o gentílico ou qualquer cidade dele (foto da liga egípcia serve pra matéria do Cairo).
const PAISES = [
  { nomes: ['brasil', 'brazil'], cidades: [['sao paulo'], ['rio de janeiro'], ['brasilia'], ['salvador'], ['recife'], ['fortaleza'], ['belem'], ['manaus'], ['curitiba'], ['porto alegre'], ['florianopolis'], ['belo horizonte'], ['goiania'], ['natal'], ['joao pessoa'], ['maceio'], ['aracaju'], ['teresina'], ['sao luis'], ['cuiaba'], ['campo grande'], ['palmas'], ['macapa'], ['boa vista'], ['rio branco'], ['porto velho'], ['vitoria'], ['santos'], ['campinas'], ['gramado'], ['ouro preto'], ['paraty'], ['amazonas'], ['bahia'], ['ceara'], ['pernambuco'], ['minas gerais'], ['parana'], ['santa catarina'], ['goias'], ['maranhao'], ['paraiba'], ['sergipe'], ['alagoas'], ['mato grosso'], ['espirito santo']] },
  { nomes: ['canada'], cidades: [['quebec'], ['toronto'], ['montreal'], ['ottawa'], ['vancouver'], ['calgary'], ['edmonton'], ['winnipeg'], ['halifax'], ['ontario'], ['alberta'], ['british columbia']] },
  { nomes: ['estados unidos', 'united states', 'usa'], cidades: [['new york', 'nova york'], ['washington'], ['chicago'], ['boston'], ['seattle'], ['portland'], ['denver'], ['detroit'], ['philadelphia'], ['atlanta'], ['dallas'], ['houston'], ['austin'], ['phoenix'], ['san diego'], ['san francisco'], ['los angeles'], ['las vegas'], ['baltimore'], ['new orleans'], ['nashville'], ['minneapolis'], ['cleveland'], ['pittsburgh'], ['miami'], ['orlando'], ['tampa'], ['honolulu'], ['anchorage'], ['california'], ['texas'], ['florida'], ['nevada'], ['colorado'], ['alaska'], ['hawaii']] },
  { nomes: ['mexico'], cidades: [['mexico city', 'cidade do mexico'], ['guadalajara'], ['monterrey'], ['cancun'], ['oaxaca']] },
  { nomes: ['franca', 'france'], cidades: [['paris'], ['lyon'], ['marseille'], ['bordeaux'], ['toulouse'], ['provence'], ['normandia', 'normandy']] },
  { nomes: ['inglaterra', 'england', 'reino unido', 'united kingdom', 'scotland', 'escocia', 'wales'], cidades: [['london', 'londres'], ['manchester'], ['liverpool'], ['birmingham'], ['leeds'], ['edinburgh'], ['glasgow'], ['cardiff'], ['belfast'], ['oxford'], ['cambridge']] },
  { nomes: ['irlanda', 'ireland'], cidades: [['dublin'], ['cork'], ['galway']] },
  { nomes: ['alemanha', 'germany'], cidades: [['berlin', 'berlim'], ['munich', 'munique'], ['hamburg'], ['frankfurt'], ['cologne', 'colonia'], ['dresden'], ['stuttgart'], ['bavaria', 'baviera']] },
  { nomes: ['italia', 'italy'], cidades: [['roma', 'rome'], ['milan', 'milao', 'milano'], ['venice', 'veneza'], ['florence', 'florenca'], ['naples', 'napoles'], ['turin', 'turim'], ['bologna'], ['verona'], ['genoa'], ['palermo'], ['toscana', 'tuscany'], ['capri']] },
  { nomes: ['espanha', 'spain'], cidades: [['madrid'], ['barcelona'], ['sevilla', 'seville'], ['valencia'], ['bilbao'], ['granada'], ['malaga'], ['andaluzia', 'andalusia'], ['catalunha', 'catalonia']] },
  { nomes: ['portugal'], cidades: [['lisboa', 'lisbon'], ['coimbra'], ['algarve'], ['madeira']] },
  { nomes: ['holanda', 'netherlands'], cidades: [['amsterdam'], ['rotterdam'], ['utrecht']] },
  { nomes: ['belgica', 'belgium'], cidades: [['bruxelas', 'brussels'], ['antwerp'], ['bruges']] },
  { nomes: ['suica', 'switzerland'], cidades: [['zurich', 'zurique'], ['geneva', 'genebra'], ['basel'], ['bern'], ['lucerne'], ['st gallen', 'st.gallen'], ['lausanne']] },
  { nomes: ['austria'], cidades: [['vienna', 'viena'], ['salzburg'], ['innsbruck']] },
  { nomes: ['republica tcheca', 'czech'], cidades: [['praga', 'prague']] },
  { nomes: ['hungria', 'hungary'], cidades: [['budapest', 'budapeste']] },
  { nomes: ['polonia', 'poland'], cidades: [['warsaw', 'varsovia'], ['krakow', 'cracovia']] },
  { nomes: ['romenia', 'romania'], cidades: [['bucharest', 'bucareste']] },
  { nomes: ['servia', 'serbia'], cidades: [['belgrade', 'belgrado']] },
  { nomes: ['croacia', 'croatia'], cidades: [['zagreb'], ['dubrovnik']] },
  { nomes: ['ucrania', 'ukraine'], cidades: [['kyiv', 'kiev'], ['odessa'], ['lviv']] },
  { nomes: ['russia'], cidades: [['moscow', 'moscou'], ['saint petersburg'], ['siberia']] },
  { nomes: ['suecia', 'sweden'], cidades: [['stockholm', 'estocolmo'], ['gothenburg']] },
  { nomes: ['noruega', 'norway'], cidades: [['oslo'], ['bergen']] },
  { nomes: ['dinamarca', 'denmark'], cidades: [['copenhagen', 'copenhague']] },
  { nomes: ['finlandia', 'finland'], cidades: [['helsinki']] },
  { nomes: ['islandia', 'iceland'], cidades: [['reykjavik']] },
  { nomes: ['grecia', 'greece'], cidades: [['athens', 'atenas'], ['thessaloniki'], ['santorini']] },
  { nomes: ['turquia', 'turkey'], cidades: [['istanbul', 'istambul'], ['ankara'], ['izmir'], ['antalya']] },
  { nomes: ['egito', 'egypt'], cidades: [['cairo'], ['alexandria'], ['giza'], ['luxor']] },
  { nomes: ['marrocos', 'morocco'], cidades: [['casablanca'], ['marrakech'], ['rabat']] },
  { nomes: ['tunisia'], cidades: [['tunis']] },
  { nomes: ['argelia', 'algeria'], cidades: [['algiers']] },
  { nomes: ['quenia', 'kenya'], cidades: [['nairobi'], ['mombasa']] },
  { nomes: ['nigeria'], cidades: [['lagos'], ['abuja']] },
  { nomes: ['gana', 'ghana'], cidades: [['accra']] },
  { nomes: ['etiopia', 'ethiopia'], cidades: [['addis ababa']] },
  { nomes: ['africa do sul', 'south africa'], cidades: [['johannesburg', 'joanesburgo'], ['cape town', 'cidade do cabo'], ['durban'], ['pretoria']] },
  { nomes: ['senegal'], cidades: [['dakar']] },
  { nomes: ['angola'], cidades: [['luanda']] },
  { nomes: ['mocambique', 'mozambique'], cidades: [['maputo']] },
  { nomes: ['arabia saudita', 'saudi arabia'], cidades: [['riyadh', 'riade'], ['jeddah'], ['mecca', 'meca']] },
  { nomes: ['emirados arabes', 'united arab emirates'], cidades: [['dubai'], ['abu dhabi']] },
  { nomes: ['catar', 'qatar'], cidades: [['doha']] },
  { nomes: ['kuwait'], cidades: [] },
  { nomes: ['oma', 'oman'], cidades: [['muscat']] },
  { nomes: ['bahrein', 'bahrain'], cidades: [['manama']] },
  { nomes: ['israel'], cidades: [['tel aviv'], ['jerusalem', 'jerusalem']] },
  { nomes: ['palestina', 'palestine'], cidades: [['gaza'], ['ramallah']] },
  { nomes: ['libano', 'lebanon'], cidades: [['beirut', 'beirute']] },
  { nomes: ['jordania', 'jordan'], cidades: [['amman']] },
  { nomes: ['iraque', 'iraq'], cidades: [['baghdad', 'bagda']] },
  { nomes: ['iran'], cidades: [['tehran', 'teera']] },
  { nomes: ['siria', 'syria'], cidades: [['damasco', 'damascus'], ['aleppo']] },
  { nomes: ['japao', 'japan'], cidades: [['tokyo', 'toquio'], ['kyoto'], ['osaka'], ['nagoya'], ['hiroshima']] },
  { nomes: ['china'], cidades: [['shanghai', 'xangai'], ['beijing', 'pequim'], ['guangzhou'], ['shenzhen'], ['hong kong'], ['macau']] },
  { nomes: ['taiwan'], cidades: [['taipei']] },
  { nomes: ['coreia', 'korea'], cidades: [['seoul', 'seul'], ['busan']] },
  { nomes: ['india'], cidades: [['delhi', 'nova delhi'], ['mumbai'], ['bangalore'], ['kolkata'], ['chennai'], ['jaipur']] },
  { nomes: ['paquistao', 'pakistan'], cidades: [['karachi'], ['lahore'], ['islamabad']] },
  { nomes: ['bangladesh'], cidades: [['dhaka']] },
  { nomes: ['nepal'], cidades: [['kathmandu']] },
  { nomes: ['sri lanka'], cidades: [['colombo']] },
  { nomes: ['tailandia', 'thailand'], cidades: [['bangkok'], ['phuket']] },
  { nomes: ['vietna', 'vietnam'], cidades: [['hanoi'], ['saigon', 'ho chi minh']] },
  { nomes: ['camboja', 'cambodia'], cidades: [['phnom penh']] },
  { nomes: ['indonesia'], cidades: [['jakarta'], ['bali']] },
  { nomes: ['malasia', 'malaysia'], cidades: [['kuala lumpur']] },
  { nomes: ['singapura', 'singapore'], cidades: [] },
  { nomes: ['filipinas', 'philippines'], cidades: [['manila']] },
  { nomes: ['australia'], cidades: [['sydney'], ['melbourne'], ['brisbane'], ['perth'], ['adelaide']] },
  { nomes: ['nova zelandia', 'new zealand'], cidades: [['auckland'], ['wellington']] },
  { nomes: ['argentina'], cidades: [['buenos aires'], ['cordoba'], ['rosario'], ['mendoza'], ['patagonia']] },
  { nomes: ['chile'], cidades: [['santiago'], ['valparaiso']] },
  { nomes: ['uruguai', 'uruguay'], cidades: [['montevideo', 'montevideu']] },
  { nomes: ['paraguai', 'paraguay'], cidades: [['asuncion']] },
  { nomes: ['bolivia'], cidades: [['la paz'], ['santa cruz']] },
  { nomes: ['peru'], cidades: [['lima'], ['cusco']] },
  { nomes: ['equador', 'ecuador'], cidades: [['quito'], ['guayaquil']] },
  { nomes: ['colombia'], cidades: [['bogota'], ['medellin'], ['cartagena'], ['cali'], ['barranquilla']] },
  { nomes: ['venezuela'], cidades: [['caracas']] },
  { nomes: ['cuba'], cidades: [['havana']] },
  { nomes: ['jamaica'], cidades: [['kingston']] },
  { nomes: ['haiti'], cidades: [['porto principe', 'port-au-prince']] },
  { nomes: ['republica dominicana'], cidades: [['santo domingo']] },
  { nomes: ['panama'], cidades: [['panama city']] },
  { nomes: ['costa rica'], cidades: [['san jose']] },
  { nomes: ['guatemala'], cidades: [['guatemala city']] },
  { nomes: ['guiana', 'guyana'], cidades: [['georgetown']] },
]

const CIDADE_GRUPO = new Map()
const TERMO_LUGAR = []
for (const p of PAISES) {
  p.gentilicos = []
  for (const c of p.cidades) for (const v of c) CIDADE_GRUPO.set(v, { grupo: c, pais: p })
}
for (const [g, alvo] of Object.entries(GENTILICOS)) {
  const pais = PAISES.find((x) => x.nomes.includes(alvo))
  if (pais) pais.gentilicos.push(g)
  else {
    const cidade = CIDADE_GRUPO.get(alvo)
    if (cidade && !cidade.grupo.includes(g)) {
      cidade.grupo.push(g)
      CIDADE_GRUPO.set(g, cidade)
    }
  }
}
for (const [termo, cidade] of CIDADE_GRUPO) TERMO_LUGAR.push({ termo, tipo: 'cidade', cidade })
for (const p of PAISES) for (const termo of [...p.nomes, ...p.gentilicos]) TERMO_LUGAR.push({ termo, tipo: 'pais', pais: p })

// Palavra maiúscula seguida de uma dessas = topônimo mesmo fora da tabela.
const MARCA_LUGAR = 'city|cidade|skyline|downtown|aerial view|panorama|waterfront|old town|province|state|county|region'

const TRAGEDIA = ['terremoto', 'sismo', 'earthquake', 'morte', 'morre', 'morreu', 'mortos', 'mortas', 'obito', 'vitima', 'vitimas', 'desaparecid', 'tragedia', 'acidente', 'incendio', 'enchente', 'inundacao', 'desabamento', 'desabou', 'colapso', 'ataque', 'atentado', 'guerra', 'massacre', 'naufragio', 'sequestro', 'assassin', 'homicidio', 'feminicidio', 'estupro', 'chacina', 'atropel', 'colisao', 'queda de aviao', 'luto', 'funeral', 'soterrad', 'escombros', 'deslizamento', 'bombardeio', 'refugiados', 'fome', 'epidemia', 'surto']

const LAZER = ['sunset', 'sunrise', 'por do sol', 'beach', 'praia', 'vacation', 'ferias', 'resort', 'hotel pool', 'wedding', 'casamento', 'party', 'festa', 'smiling', 'smile', 'sorrindo', 'happy', 'holiday', 'tourism', 'turismo', 'tourist', 'scenic', 'picturesque', 'flower', 'flores', 'blossom', 'garden', 'sunny', 'paradise', 'cruise', 'carnival', 'celebration', 'festival', 'fireworks', 'skyline', 'panorama', 'landscape', 'paisagem', 'postcard', 'honeymoon', 'relax', 'spa', 'wine', 'cocktail', 'selfie', 'fashion', 'model']

const SERIO = ['rubble', 'debris', 'ruins', 'destroyed', 'destruction', 'damaged', 'damage', 'collapse', 'collapsed', 'rescue', 'emergency', 'firefighter', 'fire brigade', 'ambulance', 'paramedic', 'aid', 'relief', 'humanitarian', 'shelter', 'earthquake', 'seismograph', 'seismic', 'flood', 'wreck', 'crash', 'police', 'evacuation', 'search and rescue', 'disaster', 'memorial', 'funeral', 'mourning', 'crisis', 'refugee']

// Assunto amplo por gatilho — nível (c) da busca.
const ASSUNTOS = [
  { chave: 'terremoto', gatilhos: ['terremoto', 'sismo', 'earthquake', 'tremor', 'replica'], busca: 'earthquake damaged building rubble' },
  { chave: 'incendio', gatilhos: ['incendio', 'fogo', 'chamas', 'queimada', 'bombeiro'], busca: 'firefighters burned building' },
  { chave: 'enchente', gatilhos: ['enchente', 'inundacao', 'alagamento', 'chuva forte', 'temporal'], busca: 'flooded street rescue' },
  { chave: 'desastre', gatilhos: ['desabamento', 'deslizamento', 'barragem', 'soterrad', 'tragedia', 'naufragio'], busca: 'rescue workers debris' },
  { chave: 'guerra', gatilhos: ['guerra', 'bombardeio', 'atentado', 'massacre', 'militar', 'exercito', 'refugiado'], busca: 'destroyed building war' },
  { chave: 'crime', gatilhos: ['policia', 'crime', 'assassin', 'homicidio', 'roubo', 'prisao', 'operacao policial', 'trafico'], busca: 'police officers investigation' },
  { chave: 'justica', gatilhos: ['stf', 'supremo', 'tribunal', 'julgamento', 'ministro do stf', 'juiz', 'processo', 'court'], busca: 'courtroom judge gavel' },
  { chave: 'eleicao', gatilhos: ['eleicao', 'eleitoral', 'voto', 'urna', 'candidat', 'campanha', 'election', 'ballot'], busca: 'ballot box voting' },
  { chave: 'congresso', gatilhos: ['congresso', 'senado', 'camara', 'deputado', 'senador', 'parlamento', 'parliament', 'reforma politica'], busca: 'parliament chamber session' },
  { chave: 'governo', gatilhos: ['presidente', 'governo', 'ministerio', 'planalto', 'governador', 'prefeito'], busca: 'government building flag' },
  { chave: 'protesto', gatilhos: ['protesto', 'manifestacao', 'greve', 'sindicato', 'ato publico'], busca: 'protest march crowd' },
  { chave: 'economia', gatilhos: ['economia', 'inflacao', 'juros', 'dolar', 'bolsa', 'pib', 'imposto', 'banco central'], busca: 'stock market chart finance' },
  { chave: 'negocios', gatilhos: ['empresa', 'startup', 'investimento', 'aquisicao', 'fusao', 'lucro', 'bilhao', 'fundo'], busca: 'business office meeting' },
  { chave: 'futebol', gatilhos: ['futebol', 'football', 'soccer', 'gol', 'campeonato', 'liga', 'copa', 'estadio', 'clube', 'partida', 'jogo'], busca: 'football match players' },
  { chave: 'esporte', gatilhos: ['basquete', 'volei', 'tenis', 'natacao', 'atletismo', 'olimpiada', 'corrida', 'maratona', 'luta'], busca: 'athletes competition sport' },
  { chave: 'saude', gatilhos: ['saude', 'hospital', 'medico', 'doenca', 'vacina', 'sus', 'paciente', 'cirurgia', 'remedio'], busca: 'hospital doctors care' },
  { chave: 'educacao', gatilhos: ['escola', 'educacao', 'universidade', 'professor', 'aluno', 'enem', 'vestibular'], busca: 'classroom students school' },
  { chave: 'tecnologia', gatilhos: ['tecnologia', 'inteligencia artificial', 'app', 'aplicativo', 'internet', 'software', 'chip', 'dados', 'digital'], busca: 'technology computer screen' },
  { chave: 'ciencia', gatilhos: ['ciencia', 'pesquisa', 'estudo', 'cientista', 'laboratorio', 'espaco', 'nasa', 'satelite'], busca: 'science laboratory research' },
  { chave: 'ambiente', gatilhos: ['clima', 'meio ambiente', 'amazonia', 'floresta', 'desmatamento', 'poluicao', 'aquecimento', 'sustentab'], busca: 'forest environment nature' },
  { chave: 'agro', gatilhos: ['agronegocio', 'safra', 'soja', 'milho', 'pecuaria', 'lavoura', 'produtor rural'], busca: 'farm field agriculture' },
  { chave: 'cultura', gatilhos: ['cinema', 'filme', 'serie', 'musica', 'show', 'album', 'livro', 'teatro', 'artista', 'exposicao'], busca: 'concert stage audience' },
  { chave: 'transporte', gatilhos: ['aviao', 'aeroporto', 'onibus', 'metro', 'trem', 'rodovia', 'transito', 'combustivel'], busca: 'transport road traffic' },
  { chave: 'cidade', gatilhos: ['moradia', 'aluguel', 'obra', 'construcao', 'saneamento', 'favela', 'urbano', 'prefeitura'], busca: 'city street buildings' },
]

function log(m) {
  const line = `[${new Date().toISOString()}] ${m}`
  console.log(line)
  fs.appendFileSync(LOG, line + '\n')
}

function hash(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

const semTags = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ')
const norm = (s) => semTags(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s.-]/g, ' ').replace(/\s+/g, ' ').trim()

let FORCAR = false
let SECO = false
let DETALHE = false

async function urlOk(u) {
  if (FORCAR) return true
  try {
    const r = await fetch(u, { method: 'GET', headers: { ...UA, Range: 'bytes=0-2048' }, signal: AbortSignal.timeout(12000) })
    return (r.status >= 200 && r.status < 400) || r.status === 416
  } catch {
    return false
  }
}

async function candidatos(q, wide) {
  try {
    const r = await fetch(
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=20&license_type=commercial${wide ? '&aspect_ratio=wide' : ''}&mature=false`,
      { headers: UA, signal: AbortSignal.timeout(20000) }
    )
    if (!r.ok) return []
    const j = await r.json()
    return (j.results || []).filter((x) => x.url && (x.width || 0) >= 500 && (x.width || 0) >= (x.height || 0))
  } catch {
    return []
  }
}

function textoDaFoto(img) {
  const tags = (img.tags || []).map((t) => (typeof t === 'string' ? t : t.name)).join(' ')
  return { titulo: norm([img.title, img.attribution, img.creator].join(' ')), tudo: norm([img.title, img.attribution, img.creator, tags].join(' ')) }
}

function cita(texto, termo) {
  return new RegExp(`(^|[^a-z0-9])${termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`).test(texto)
}

// Lugares que a foto anuncia: tabela de países/cidades/gentílicos + "Palavra Maiúscula + City/Skyline/...".
function lugaresDaFoto(img) {
  const bruto = semTags([img.title, img.attribution, img.creator].join(' '))
  const n = norm(bruto)
  const achados = []
  const vistos = new Set()
  for (const t of TERMO_LUGAR) {
    if (!cita(n, t.termo)) continue
    const chave = t.tipo === 'cidade' ? 'c:' + t.cidade.grupo[0] : 'p:' + t.pais.nomes[0]
    if (vistos.has(chave)) continue
    vistos.add(chave)
    achados.push(t)
  }
  const re = new RegExp(`\\b([A-ZÀ-Þ][a-zà-ÿ]{2,})(?:[ -]([A-ZÀ-Þ][a-zà-ÿ]{2,}))?[ ,-]+(?:${MARCA_LUGAR})\\b`, 'gi')
  let m
  while ((m = re.exec(bruto))) {
    const solto = norm([m[1], m[2]].filter(Boolean).join(' '))
    if (solto && !PARADAS.has(solto) && !vistos.has('s:' + solto)) {
      vistos.add('s:' + solto)
      achados.push({ termo: solto, tipo: 'solto' })
    }
  }
  return achados
}

// A matéria cita esse lugar? Cidade exige a própria cidade; país aceita país, gentílico ou
// qualquer cidade dele.
function lugarBate(l, materia) {
  if (l.tipo === 'cidade') return l.cidade.grupo.some((v) => cita(materia, v))
  if (l.tipo === 'pais') {
    const p = l.pais
    return p.nomes.some((v) => cita(materia, v)) || p.gentilicos.some((v) => cita(materia, v)) || p.cidades.some((c) => c.some((v) => cita(materia, v)))
  }
  return cita(materia, l.termo)
}

function rotulo(l) {
  return l.tipo === 'cidade' ? l.cidade.grupo[0] : l.tipo === 'pais' ? l.pais.nomes[0] : l.termo
}

// Substantivos comuns que o glossário conhece (dos dois lados) — o que rende foto.
const COMUNS = new Set(
  Object.entries(GLOSSARIO)
    .flat()
    .join(' ')
    .split(/\s+/)
    .concat('league club team cup championship court parliament party university institute association federation group city united school hospital stadium airport museum ministry bank company market championship final derby'.split(' '))
)

function ehNomeDePessoa(tag) {
  const palavras = String(tag).trim().split(/\s+/)
  if (palavras.length < 2 || palavras.length > 4) return false
  const conectores = new Set(['de', 'da', 'do', 'dos', 'das', 'van', 'von', 'del', 'di', 'la', 'al'])
  const fortes = palavras.filter((p) => !conectores.has(p.toLowerCase()))
  if (!fortes.every((p) => /^[A-ZÀ-Þ]/.test(p))) return false
  const n = norm(tag)
  if (TERMO_LUGAR.some((t) => n.includes(t.termo))) return false
  return !n.split(' ').some((p) => COMUNS.has(p))
}

function traduzir(tag) {
  const n = norm(tag)
  if (!n) return ''
  if (GLOSSARIO[n]) return GLOSSARIO[n]
  const palavras = n.split(' ')
  const trad = palavras.map((p) => GLOSSARIO[p] || p)
  return trad.join(' ')
}

function lerEn(slug) {
  const p = path.join(ROOT, 'content', 'en', 'articles', slug + '.json')
  if (!fs.existsSync(p)) return null
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return null
  }
}

// Tags ordenadas por quanto rendem foto: substantivo comum > organização > lugar > nome de pessoa.
function tagsUteis(a, en) {
  const pt = (a.tags || []).map(String)
  const ingles = (en && Array.isArray(en.tags) ? en.tags : []).map(String)
  const pool = pt.map((t, i) => {
    const alvo = ingles[i] && norm(ingles[i]) !== norm(t) ? ingles[i] : t
    return { original: t, texto: alvo }
  })
  const vistos = new Set()
  const saida = []
  for (const { original, texto } of pool) {
    const n = norm(texto)
    if (!n || n.length < 3 || TAGS_MORTAS.has(n) || /(^|\s)(ao vivo|live)(\s|$)/.test(n) || vistos.has(n)) continue
    vistos.add(n)
    const palavras = n.split(' ').filter((p) => !PARADAS.has(p))
    if (!palavras.length) continue
    const busca = traduzir(palavras.join(' '))
    const eLugar = TERMO_LUGAR.some((t) => cita(n, t.termo))
    const conhecidas = busca.split(' ').filter((p) => COMUNS.has(p)).length
    let pontos = 0
    if (eLugar) pontos = 1
    else if (ehNomeDePessoa(texto)) pontos = -6
    else if (palavras.length === 1) pontos = conhecidas || !/^[A-ZÀ-Þ]/.test(texto) ? 5 : 3 // substantivo comum vale mais que nome próprio solto
    else if (!/[A-ZÀ-Þ]/.test(texto)) pontos = 6
    else pontos = 2
    if (busca !== n) pontos += 1
    if (conhecidas) pontos += 2
    if (texto === original && conhecidas < busca.split(' ').length) pontos -= 2
    saida.push({ tag: original, busca, pontos, eLugar, palavras: palavras.length })
  }
  return saida.sort((x, y) => y.pontos - x.pontos)
}

function palavrasDoTitulo(a, en) {
  const fonte = en && en.title ? `${en.title} ${a.title}` : a.title
  const cru = semTags(fonte).split(/\s+/)
  const saida = []
  for (const p of cru) {
    if (/^[A-ZÀ-Þ]/.test(p) && saida.length) continue
    const n = norm(p)
    if (!n || n.length < 4 || PARADAS.has(n)) continue
    saida.push(traduzir(n))
  }
  return [...new Set(saida)]
}

function assuntoAmplo(a, en) {
  const t = norm([a.title, a.seoTitle, a.subtitle, a.excerpt, (a.tags || []).join(' '), a.tema, en && en.title, en && (en.tags || []).join(' ')].join(' '))
  const achado = ASSUNTOS.find((s) => s.gatilhos.some((g) => new RegExp(`(^|[^a-z0-9])${g}`).test(t)))
  if (achado) return { chave: achado.chave, busca: achado.busca }
  if (a.tema) {
    const b = traduzir(a.tema)
    if (b && b.length > 2) return { chave: 'tema:' + a.tema, busca: b }
  }
  return null
}

function eTragedia(texto) {
  return TRAGEDIA.some((t) => texto.includes(t))
}

function planoDeBusca(a) {
  const en = lerEn(a.slug)
  const tags = tagsUteis(a, en)
  const uteis = tags.filter((t) => t.pontos > 0 && !t.eLugar)
  const fortes = uteis.filter((t) => t.pontos >= 5)
  const bons = fortes.length ? fortes.slice(0, 3) : uteis.slice(0, 2)
  const lugares = tags.filter((t) => t.eLugar).sort((x, y) => y.palavras - x.palavras)
  const titulo = palavrasDoTitulo(a, en)
  const amplo = assuntoAmplo(a, en)
  const editoria = QUERIES[a.categorySlug] || QUERIES.mundo

  const niveis = []
  const base = bons.slice(0, 3).map((t) => t.busca)
  if (!base.length && titulo.length) base.push(...titulo.slice(0, 2))
  if (base.length && lugares.length) niveis.push({ nivel: 'tags+lugar', q: [base[0], lugares[0].busca].join(' ') })
  if (base.length) niveis.push({ nivel: 'tags', q: base.join(' ') })
  if (base.length) niveis.push({ nivel: 'tag', q: base[0] })
  if (amplo) niveis.push({ nivel: 'assunto:' + amplo.chave, q: amplo.busca })
  niveis.push({ nivel: 'editoria', q: editoria[hash(a.slug) % editoria.length] })
  niveis.push({ nivel: 'editoria2', q: editoria[0] })

  const vistos = new Set()
  const limpo = niveis.map((n) => ({ ...n, q: [...new Set(String(n.q).split(' ').filter(Boolean))].join(' ') }))
  return { niveis: limpo.filter((n) => n.q && !vistos.has(n.q) && vistos.add(n.q)), en }
}

function textoDaMateria(a, en) {
  return norm([a.title, a.seoTitle, a.subtitle, a.excerpt, (a.tags || []).join(' '), a.tema, a.category, en && en.title, en && en.seoTitle, en && en.excerpt, en && (en.tags || []).join(' ')].join(' '))
}

async function buscarImagem(a) {
  const { niveis, en } = planoDeBusca(a)
  const materia = textoDaMateria(a, en)
  const tragedia = eTragedia(materia)
  let recLugar = 0
  let recTom = 0

  for (const { nivel, q } of niveis) {
    let achados = await candidatos(q, true)
    if (achados.length < 4) achados = achados.concat(await candidatos(q, false))
    const unicos = [...new Map(achados.map((b) => [b.url, b])).values()]
    if (!unicos.length) continue

    const aprovados = []
    for (const img of unicos) {
      const { titulo, tudo } = textoDaFoto(img)
      const lugares = lugaresDaFoto(img)
      const forasteiro = lugares.find((l) => !lugarBate(l, materia))
      if (forasteiro) {
        recLugar++
        if (DETALHE) log(`   recusada por LUGAR (${rotulo(forasteiro)} não citado): ${String(img.title).slice(0, 70)}`)
        continue
      }
      const lazer = tragedia && LAZER.find((l) => titulo.includes(l))
      if (lazer) {
        recTom++
        if (DETALHE) log(`   recusada por TOM (${lazer} em matéria de tragédia): ${String(img.title).slice(0, 70)}`)
        continue
      }
      aprovados.push({ img, serio: tragedia && SERIO.some((s) => tudo.includes(s)) })
    }
    if (!aprovados.length) continue

    aprovados.sort((x, y) => {
      if (x.serio !== y.serio) return x.serio ? -1 : 1
      return (hash(a.slug + (x.img.id || x.img.url)) % 997) - (hash(a.slug + (y.img.id || y.img.url)) % 997)
    })

    for (const { img } of aprovados.slice(0, 8)) {
      if (await urlOk(img.url)) {
        return {
          dados: {
            imagem: img.url,
            imagemCredito: img.attribution ? semTags(img.attribution).replace(/\s+/g, ' ').trim().slice(0, 180) : `${img.creator || 'Autor desconhecido'} · ${img.license || 'CC'}`,
            imagemCreditoUrl: img.foreign_landing_url || img.creator_url || img.url,
          },
          nivel,
          q,
          titulo: img.title || '(sem título)',
          recLugar,
          recTom,
          tragedia,
        }
      }
    }
  }
  return { dados: null, recLugar, recTom, tragedia, q: niveis.map((n) => n.q).join(' | ') }
}

function gravar(p, obj) {
  const tmp = p + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2))
  fs.renameSync(tmp, p)
}

function aplicar(slug, dados) {
  for (const lang of ['pt', 'en', 'es']) {
    const dir = lang === 'pt' ? PT_DIR : path.join(ROOT, 'content', lang, 'articles')
    const p = path.join(dir, slug + '.json')
    if (!fs.existsSync(p)) continue
    try {
      const a = JSON.parse(fs.readFileSync(p, 'utf8'))
      Object.assign(a, dados)
      gravar(p, a)
    } catch (e) {
      log(`ERRO ao gravar ${lang}/${slug}: ${e.message}`)
    }
  }
}

function lerArtigo(slug) {
  const p = path.join(PT_DIR, slug + '.json')
  if (!fs.existsSync(p)) return null
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    return null
  }
}

function slugsDoAuditor(arquivo) {
  const j = JSON.parse(fs.readFileSync(arquivo, 'utf8'))
  const lista = Array.isArray(j) ? j : [...(j.lugarErrado || []), ...(j.tomErrado || [])]
  return [...new Set(lista.map((x) => (typeof x === 'string' ? x : x.slug)).filter(Boolean))]
}

async function main() {
  const args = process.argv.slice(2)
  const valor = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : null)
  const limite = args.includes('--limite') ? parseInt(valor('--limite'), 10) : 40
  FORCAR = args.includes('--forcar')
  SECO = args.includes('--seco')
  DETALHE = args.includes('--detalhe')

  let alvos
  if (valor('--slugs')) {
    const pedidos = valor('--slugs').split(',').map((s) => s.trim()).filter(Boolean)
    alvos = pedidos.map(lerArtigo).filter(Boolean)
    for (const s of pedidos) if (!lerArtigo(s)) log(`slug não encontrado em content/articles: ${s}`)
    log(`${alvos.length} matéria(s) pedidas por --slugs (reprocessa mesmo com imagem)`)
  } else if (valor('--so-suspeitas')) {
    alvos = slugsDoAuditor(valor('--so-suspeitas')).map(lerArtigo).filter(Boolean).slice(0, limite)
    log(`${alvos.length} matéria(s) suspeitas do auditor (limite ${limite})`)
  } else {
    alvos = fs
      .readdirSync(PT_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        try {
          return JSON.parse(fs.readFileSync(path.join(PT_DIR, f), 'utf8'))
        } catch {
          return null
        }
      })
      .filter((a) => a && a.slug && !a.imagem)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, limite)
    log(`${alvos.length} matéria(s) sem imagem (limite ${limite})`)
  }

  let ok = 0
  let falhou = 0
  for (const a of alvos) {
    const r = await buscarImagem(a)
    const rec = `recusadas lugar:${r.recLugar} tom:${r.recTom}${r.tragedia ? ' [tragédia]' : ''}`
    if (r.dados) {
      if (!SECO) aplicar(a.slug, r.dados)
      ok++
      log(`ok [${a.categorySlug}] ${a.slug} | nível ${r.nivel} | q="${r.q}" | ${rec} | foto: ${String(r.titulo).slice(0, 80)}`)
    } else {
      falhou++
      log(`sem foto aceitável [${a.categorySlug}] ${a.slug} | tentou: ${r.q} | ${rec} | imagem atual mantida`)
    }
    await new Promise((s) => setTimeout(s, 700))
  }
  log(`fim: ${ok} com imagem, ${falhou} sem${SECO ? ' (modo --seco, nada gravado)' : ''}`)
}

main().catch((e) => {
  log('ERRO FATAL: ' + (e.stack || e.message))
  process.exit(1)
})
