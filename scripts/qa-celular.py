# Varre páginas do Explosão Solar em várias larguras e aponta o que vaza para o lado ou fica cortado.
# Uso: python -I scripts/qa-celular.py <base> <pasta-de-saida> [larguras separadas por vírgula]
# Só lê a página; não clica em anúncio nem envia nada.
import json, os, sys
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")
BASE = sys.argv[1].rstrip("/")
SAIDA = sys.argv[2]
LARGURAS = [int(x) for x in (sys.argv[3] if len(sys.argv) > 3 else "360,390,768,1440").split(",")]
os.makedirs(SAIDA, exist_ok=True)
PAGINAS = ["/", "/ciencia", "/clima", "/terremotos", "/cotacoes", "/loterias", "/horoscopo", "/busca", "/en", "/es"]

# elementos que passam da borda direita da tela (ignora o que está dentro de uma faixa que rola de propósito)
ACHAR = """() => {
  const W = document.documentElement.clientWidth, fora = [];
  const rola = (el) => { for (let p = el.parentElement; p; p = p.parentElement) { const s = getComputedStyle(p); if (/(auto|scroll)/.test(s.overflowX) && p.scrollWidth > p.clientWidth) return true; } return false; };
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    const s = getComputedStyle(el); if (s.position === 'fixed' || s.visibility === 'hidden' || s.display === 'none') continue;
    if ((r.right > W + 1 || r.left < -1) && !rola(el)) fora.push({ tag: el.tagName.toLowerCase(), cls: (el.className && el.className.baseVal === undefined ? el.className : '').toString().slice(0, 40), texto: (el.innerText || '').trim().slice(0, 50), esq: Math.round(r.left), dir: Math.round(r.right), larg: Math.round(r.width) });
  }
  // fica só com os mais "externos" (o pai que vaza já explica os filhos)
  return fora.slice(0, 400);
}"""
MENU = """() => {
  const nav = document.querySelector('header nav > div'); if (!nav) return null;
  const links = [...nav.querySelectorAll('a')]; const W = nav.clientWidth;
  return { faixa: nav.clientWidth, conteudo: nav.scrollWidth, rola: nav.scrollWidth > nav.clientWidth, visiveis: links.filter(a => { const r = a.getBoundingClientRect(), n = nav.getBoundingClientRect(); return r.left >= n.left - 1 && r.right <= n.right + 1; }).map(a => a.innerText.trim()), cortados: links.filter(a => { const r = a.getBoundingClientRect(), n = nav.getBoundingClientRect(); return r.left < n.right && r.right > n.right + 1; }).map(a => a.innerText.trim()), total: links.length };
}"""
TOPO = """() => { const h = document.querySelector('header'); if (!h) return null; const linhas = [...h.children].map(c => Math.round(c.getBoundingClientRect().height)); return { altura: Math.round(h.getBoundingClientRect().height), linhas }; }"""

relatorio = {}
with sync_playwright() as p:
    nav = p.chromium.launch(channel="msedge", headless=True)
    for w in LARGURAS:
        ctx = nav.new_context(viewport={"width": w, "height": 800}, is_mobile=w < 700, has_touch=w < 700, device_scale_factor=2 if w < 700 else 1)
        pg = ctx.new_page()
        for caminho in PAGINAS:
            try:
                pg.goto(BASE + caminho, wait_until="domcontentloaded", timeout=45000)
                pg.wait_for_timeout(2500)
            except Exception as e:
                print(f"[{w}] {caminho}: não abriu ({str(e)[:80]})"); continue
            sobra = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
            fora = pg.evaluate(ACHAR)
            menu = pg.evaluate(MENU)
            topo = pg.evaluate(TOPO)
            chave = f"{w}{caminho}"
            relatorio[chave] = {"sobra": sobra, "fora": fora[:15], "menu": menu, "topo": topo}
            raiz = [f for f in fora if f["larg"] > 0][:4]
            print(f"[{w}] {caminho}: sobra lateral {sobra}px | {len(fora)} elementos vazando | topo {topo} | menu {json.dumps({k: menu[k] for k in ('faixa','conteudo','cortados')}, ensure_ascii=False) if menu else '-'}")
            for f in raiz:
                print(f"        vaza: <{f['tag']}> '{f['texto']}' de {f['esq']} a {f['dir']} (larg {f['larg']})")
            if caminho in ("/", "/clima", "/horoscopo") and w in (360, 390):
                pg.screenshot(path=os.path.join(SAIDA, f"{w}{caminho.replace('/', '_') or '_home'}.png"), clip={"x": 0, "y": 0, "width": w, "height": 330})
        ctx.close()
    nav.close()
json.dump(relatorio, open(os.path.join(SAIDA, "relatorio.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
