# Testa o menu de editorias de verdade: faixa no computador; botão + caixa que só abre no clique quando não cabe;
# abrir, ver todos os itens inteiros, navegar, fechar com Esc e clicando fora; anúncio da Adsterra fora do topo no celular.
# Uso: python -I scripts/qa-menu.py <base> <pasta-de-saida>
import os, sys
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")
BASE = sys.argv[1].rstrip("/")
SAIDA = sys.argv[2]
os.makedirs(SAIDA, exist_ok=True)
ok = falha = 0


def certo(c, m):
    global ok, falha
    print("OK   " if c else "FALHA", m)
    if c: ok += 1
    else: falha += 1


ITENS_CAIXA = "document.querySelectorAll('#menu-caixa a').length"
with sync_playwright() as p:
    nav = p.chromium.launch(channel="msedge", headless=True)
    for nome, larg, alt, celular in [("360", 360, 760, True), ("390", 390, 844, True), ("768", 768, 1024, True), ("1024", 1024, 768, False), ("1440", 1440, 900, False)]:
        ctx = nav.new_context(viewport={"width": larg, "height": alt}, is_mobile=celular and larg < 700, has_touch=celular)
        pg = ctx.new_page()
        erros = []
        pg.on("pageerror", lambda e: erros.append(str(e)))
        for caminho in ["/", "/en"]:
            pg.goto(BASE + caminho, wait_until="domcontentloaded", timeout=90000)
            pg.wait_for_timeout(2500)
            faixa_visivel = pg.evaluate("getComputedStyle(document.querySelector('.menu-faixa')).visibility === 'visible'")
            botao = pg.locator(".menu-botao button")
            botao_visivel = botao.is_visible()
            total = pg.evaluate("document.querySelectorAll('.menu-faixa a').length")
            cabe = pg.evaluate("(() => { const f = document.querySelector('.menu-faixa'), n = document.querySelector('.menu-nav'); return f.scrollWidth <= n.clientWidth + 1 })()")
            certo(faixa_visivel != botao_visivel, f"[{nome}] {caminho}: mostra só um dos dois (faixa={faixa_visivel}, botão={botao_visivel}; {total} editorias, cabem numa linha={cabe})")
            certo((faixa_visivel and cabe) or (botao_visivel and not cabe), f"[{nome}] {caminho}: faixa só quando cabe; botão quando não cabe")
            certo(pg.evaluate(ITENS_CAIXA) == 0 and botao.get_attribute("aria-expanded") in (None, "false"), f"[{nome}] {caminho}: caixa fechada ao abrir a página")
            if botao_visivel:
                botao.click()
                pg.wait_for_timeout(400)
                n = pg.evaluate(ITENS_CAIXA)
                inteiros = pg.evaluate("[...document.querySelectorAll('#menu-caixa a')].every(a => { const r = a.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && a.scrollWidth <= a.clientWidth + 1 })")
                certo(n == total and inteiros and botao.get_attribute("aria-expanded") == "true", f"[{nome}] {caminho}: clicou, a caixa abriu com as {n} editorias inteiras na tela")
                if caminho == "/":
                    pg.screenshot(path=os.path.join(SAIDA, f"aberta-{nome}.png"), clip={"x": 0, "y": 0, "width": larg, "height": min(alt, 520)})
                pg.keyboard.press("Escape")
                pg.wait_for_timeout(300)
                certo(pg.evaluate(ITENS_CAIXA) == 0, f"[{nome}] {caminho}: Esc fecha")
                botao.click(); pg.wait_for_timeout(300)
                pg.locator("header span[suppresshydrationwarning], header > div span").first.click(); pg.wait_for_timeout(300)  # a data do topo: fora do menu e não é link
                certo(pg.evaluate(ITENS_CAIXA) == 0, f"[{nome}] {caminho}: clicar fora fecha")
                if caminho == "/":
                    botao.click(); pg.wait_for_timeout(300)
                    alvo = pg.locator("#menu-caixa a").nth(2)
                    destino = alvo.get_attribute("href")
                    alvo.click()
                    pg.wait_for_url(BASE + destino, timeout=60000)
                    pg.wait_for_timeout(1500)
                    certo(pg.evaluate(ITENS_CAIXA) == 0 and pg.locator(".menu-botao span").first.inner_text().strip() != "", f"[{nome}]: escolher uma editoria leva para {destino}, fecha a caixa e mostra o nome dela ao lado do botão")
            sobra = pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
            certo(sobra <= 0, f"[{nome}] {caminho}: sem rolagem lateral ({sobra})")
        if celular and larg < 900:
            anuncio = pg.evaluate("(() => { const f = document.querySelector(\"iframe[id^='container-169fa54e49316c546e1d757c665a6f2f']\"); if (!f) return null; const r = f.getBoundingClientRect(); return { topo: Math.round(r.top), base: Math.round(innerHeight - r.bottom) } })()")
            if anuncio is None:
                print(f"AVISO [{nome}]: o anúncio não carregou nesta visita; não deu para conferir a posição")
            else:
                cab = pg.evaluate("Math.round(document.querySelector('header').getBoundingClientRect().bottom)")
                certo(anuncio["topo"] > cab, f"[{nome}]: anúncio fora do topo (começa em {anuncio['topo']} px; o cabeçalho termina em {cab} px; fica a {anuncio['base']} px do rodapé)")
        certo(not erros, f"[{nome}]: {len(erros)} erro de JavaScript" + (": " + erros[0][:120] if erros else ""))
        ctx.close()
    nav.close()
print(f"\n{ok} OK, {falha} falha")
sys.exit(1 if falha else 0)
