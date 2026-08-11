// Pool de IAs do Explosão Solar.
// Tenta os motores em ordem. Rate limit (429) e erro de servidor põem o motor em
// descanso temporário; só credencial inválida (401/402/403/404) o desliga de vez.
// Se todos estiverem descansando, espera o mais próximo liberar em vez de desistir.

const fs = require('fs')
const path = require('path')

function loadEnv() {
  const f = path.join(__dirname, '..', '.env.robo')
  const env = {}
  if (!fs.existsSync(f)) return env
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/^([A-Z][A-Z0-9_]*)=(.+)$/gm)) env[m[1]] = m[2].trim()
  return env
}

const ENV = loadEnv()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function chatCompletions({ url, key, model, prompt, maxTokens, extraHeaders = {} }) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: maxTokens, temperature: 0.7 }),
    signal: AbortSignal.timeout(300000),
  })
  if (!r.ok) {
    const err = new Error(`HTTP ${r.status} ${(await r.text()).slice(0, 140)}`)
    err.status = r.status
    throw err
  }
  const j = await r.json()
  const text = j.choices?.[0]?.message?.content
  if (!text) throw new Error('resposta vazia')
  return text
}

const ENGINES = [
  {
    name: 'cerebras',
    envKey: 'CEREBRAS_API_KEY',
    minIntervalMs: 2500,
    run: (key, prompt, maxTokens) =>
      chatCompletions({ url: 'https://api.cerebras.ai/v1/chat/completions', key, model: 'gpt-oss-120b', prompt, maxTokens }),
  },
  {
    name: 'huggingface',
    envKey: 'HF_API_TOKEN',
    minIntervalMs: 1500,
    run: (key, prompt, maxTokens) =>
      chatCompletions({ url: 'https://router.huggingface.co/v1/chat/completions', key, model: 'meta-llama/Llama-3.3-70B-Instruct:novita', prompt, maxTokens }),
  },
  {
    name: 'gemini',
    envKey: 'GEMINI_API_KEY',
    minIntervalMs: 4000,
    run: async (key, prompt, maxTokens) => {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens } }),
        signal: AbortSignal.timeout(240000),
      })
      if (!r.ok) {
        const err = new Error(`HTTP ${r.status} ${(await r.text()).slice(0, 140)}`)
        err.status = r.status
        throw err
      }
      const j = await r.json()
      const text = j.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error('resposta vazia')
      return text
    },
  },
]

const st = {}
for (const e of ENGINES) st[e.name] = { cooldownUntil: 0, lastCall: 0, disabled: false, fails: 0 }

const COOLDOWN = { 429: 65000, 500: 20000, 502: 20000, 503: 30000, 504: 20000 }

function available() {
  return ENGINES.filter((e) => ENV[e.envKey] && !st[e.name].disabled)
}

async function askIA(prompt, { maxTokens = 4096, onLog = () => {}, maxWaitMs = 400000 } = {}) {
  const started = Date.now()
  const errors = []

  while (Date.now() - started < maxWaitMs) {
    const pool = available()
    if (!pool.length) throw new Error('nenhum motor de IA configurado ou todos desligados — ' + errors.slice(-3).join(' | '))

    const now = Date.now()
    const ready = pool.filter((e) => st[e.name].cooldownUntil <= now && now - st[e.name].lastCall >= e.minIntervalMs)

    if (!ready.length) {
      const nextFree = Math.min(...pool.map((e) => Math.max(st[e.name].cooldownUntil, st[e.name].lastCall + e.minIntervalMs)))
      const wait = Math.min(Math.max(nextFree - now, 500), 30000)
      await sleep(wait)
      continue
    }

    const engine = ready[0]
    const s = st[engine.name]
    s.lastCall = Date.now()
    try {
      const out = await engine.run(ENV[engine.envKey], prompt, maxTokens)
      s.fails = 0
      return out
    } catch (e) {
      errors.push(`${engine.name}: ${e.message}`)
      s.fails++
      if ([401, 402, 403, 404].includes(e.status)) {
        s.disabled = true
        onLog(`motor ${engine.name} DESLIGADO (credencial/modelo inválido): ${e.message.slice(0, 80)}`)
      } else {
        const cd = COOLDOWN[e.status] || 15000
        s.cooldownUntil = Date.now() + cd
        onLog(`motor ${engine.name} em descanso ${Math.round(cd / 1000)}s: ${e.message.slice(0, 80)}`)
      }
    }
  }
  throw new Error('todos os motores falharam após espera — ' + errors.slice(-3).join(' | '))
}

function extractJson(text) {
  const cleaned = String(text).replace(/```json|```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('sem JSON na resposta')
  return JSON.parse(cleaned.slice(start, end + 1))
}

async function askJson(prompt, opts = {}) {
  const attempts = opts.attempts || 3
  let last
  for (let i = 0; i < attempts; i++) {
    try {
      return extractJson(await askIA(prompt, opts))
    } catch (e) {
      last = e
      if (/nenhum motor de IA configurado/.test(e.message)) throw e
      ;(opts.onLog || (() => {}))(`tentativa ${i + 1}/${attempts} falhou: ${e.message.slice(0, 90)}`)
    }
  }
  throw last
}

function poolStatus() {
  return Object.entries(st)
    .map(([n, s]) => `${n}:${s.disabled ? 'off' : s.cooldownUntil > Date.now() ? 'descanso' : 'ok'}`)
    .join(' ')
}

module.exports = { askIA, askJson, extractJson, poolStatus, ENV, ENGINES }
