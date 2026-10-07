"""Pafta seti derleyici.
src/<ad>.html dosyaları şu biçimdedir:
  <!--meta {"title": "...", "desc": "...", "sheet": "A-100", "tr": "Hizmetler", "en": "Services", "nav": "hizmetler"}-->
  <style>...sayfaya özel CSS (isteğe bağlı)...</style>
  <main id="main"> ... </main>
  <script>...sayfaya özel JS (isteğe bağlı)...</script>
Çıktı: out/deploy (gerçek site) ve out/artifact (her şey satır içi, önizleme).
"""
import hashlib, base64
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)

CSS = open('assets/style.css').read()
JS_MODEL = open('assets/model.js').read()
JS_SITE = open('assets/site.js').read()
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900'
         '&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap">')

def T(tr, en):
    return f'<span lang="tr">{tr}</span><span lang="en">{en}</span>'

NAV = [  # (dosya, pafta, tr, en, açıklama tr, açıklama en)
    ('./', 'A-000', 'Kapak', 'Cover', 'Ana sayfa', 'Home'),
    ('hizmetler.html', 'A-100', 'Hizmetler', 'Services', 'Strateji · Model · Koordinasyon', 'Strategy · Model · Coordination'),
    ('projeler.html', 'A-200', 'Projeler', 'Projects', 'Proje dizini', 'Project index'),
    ('hakkimizda.html', 'A-300', 'Hakkımızda', 'About', 'Ekip · Yaklaşım', 'Team · Approach'),
    ('iletisim.html', 'A-900', 'İletişim', 'Contact', 'Teklif · Ofisler', 'Proposal · Offices'),
]
SUB = {  # alt paftalar: (dosya, pafta, tr, en, açıklama tr, açıklama en)
    'hizmetler.html': [
        ('hizmet-strateji.html', 'A-101', 'BIM stratejisi', 'BIM strategy', 'EIR, BEP, ISO 19650 yol haritası', 'EIR, BEP, ISO 19650 roadmap'),
        ('hizmet-modelleme.html', 'A-102', 'Modelleme', 'Modelling', 'Mimari, yapı, MEP, Scan-to-BIM', 'Architecture, structure, MEP, scan-to-BIM'),
        ('hizmet-koordinasyon.html', 'A-103', 'Koordinasyon', 'Coordination', 'Federe model, çakışma, BCF', 'Federated model, clashes, BCF'),
        ('hizmet-cde.html', 'A-104', 'Ortak veri ortamı', 'Common data environment', 'ACC kurulumu, isimlendirme, onaylar', 'ACC setup, naming, approvals'),
        ('hizmet-otomasyon.html', 'A-105', 'Otomasyon', 'Automation', 'Dynamo, Python, Revit API eklentileri', 'Dynamo, Python, Revit API add-ins'),
        ('hizmet-egitim.html', 'A-106', 'Eğitim ve destek', 'Training & support', 'Revit, Navisworks, ISO 19650 eğitimleri', 'Revit, Navisworks, ISO 19650 courses'),
    ],
    'projeler.html': [
        ('proje-ornek-hastane.html', 'A-210', 'Hastane kampüsü', 'Hospital campus', 'Sağlık · Türkiye · BIM yöneticisi', 'Healthcare · Türkiye · BIM manager'),
        ('proje-ornek-konut.html', 'A-220', 'Konut kulesi', 'Residential tower', 'Konut · Almanya · Modelleme ekibi', 'Residential · Germany · Modelling team'),
        ('proje-ornek-lojistik.html', 'A-230', 'Lojistik merkezi', 'Logistics hub', 'Endüstriyel · BAE · Scan-to-BIM', 'Industrial · UAE · Scan-to-BIM'),
    ],
}

KEY = {'./': 'index', 'hizmetler.html': 'hizmetler', 'projeler.html': 'projeler', 'hakkimizda.html': 'hakkimizda', 'iletisim.html': 'iletisim'}

LOGO = ('<svg viewBox="0 0 140 120" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        '<g stroke="currentColor"><path d="M10 26V10h16M94 10h16v16M10 94v16h16M110 94v16H94" stroke-width="6"/>'
        '<path d="M42 47 32 60l10 13M78 47l10 13-10 13" stroke-width="7"/>'
        '<path d="M60 48 70.4 54v12L60 72 49.6 66V54ZM49.6 54 60 60l10.4-6M60 60v12" stroke-width="4"/>'
        '<path d="M112 52h6M112 68h6" stroke-width="4"/><circle cx="122" cy="52" r="4" stroke-width="3.5"/>'
        '<circle cx="122" cy="68" r="4" stroke-width="3.5"/></g>'
        '<path d="M60 48 70.4 54 60 60 49.6 54Z" fill="var(--signal)"/></svg>')

def brand(href='./'):
    return (f'<a class="brand" href="{href}" data-sheet="A-000" data-label="Kapak" aria-label="Firma Adı BIM, ana sayfa">{LOGO}'
            '<span><b>FIRMA ADI</b><small>BIM Consulting</small></span></a>')

def chrome_top(meta):
    cur = meta['nav']
    items = []
    for href, sh, tr, en, dtr, den in NAV:
        ac = ' aria-current="page"' if KEY[href] == cur else ''
        subs = ''
        if href in SUB:
            rows = []
            for sh2, s2, tr2, en2, d2, de2 in SUB[href]:
                ac2 = ' aria-current="page"' if meta.get('file') == sh2 else ''
                rows.append(f'<li><a href="{sh2}" data-sheet="{s2}" data-label="{tr2}"{ac2}><span class="sno">{s2}</span>'
                            f'<span class="st">{T(tr2, en2)}</span><span class="sd">{T(d2, de2)}</span></a></li>')
            subs = '<ul class="subs">' + ''.join(rows) + '</ul>'
        items.append(f'<li><a href="{href}" data-sheet="{sh}" data-label="{tr}"{ac}><span class="no">{sh}</span>'
                     f'<span class="t">{T(tr, en)}</span><span class="d">{T(dtr, den)}</span></a>{subs}</li>')
    axis = ''.join(f'<span>{c}</span>' for c in 'ABCDEFGH')
    return f'''<a class="skip" href="#main">{T('İçeriğe geç', 'Skip to content')}</a>
<div class="draft-note">{T('Taslak · Firma adı, iletişim bilgileri, projeler ve rakamlar örnektir.', 'Draft · Company name, contact details, projects and figures are placeholders.')}</div>
<div class="axis-left" aria-hidden="true">{axis}</div>
<header class="topbar sheet">
  <div class="frame">
    {brand()}
    <div class="top-right">
      <span class="mono dim sheet-label" aria-hidden="true">{meta['sheet']} · {T(meta['tr'], meta['en'])}</span>
      <div class="lang" role="group" aria-label="Dil / Language"><button type="button" data-lang="tr" aria-pressed="true">TR</button><button type="button" data-lang="en" aria-pressed="false">EN</button></div>
      <button class="menu-btn" id="menu-open" type="button" aria-expanded="false" aria-controls="register"><i aria-hidden="true"></i>{T('Paftalar', 'Sheets')}</button>
    </div>
  </div>
</header>
<nav class="register" id="register" hidden aria-label="{'Paftalar'}">
  <div class="register-head"><span class="mono">{T('Pafta listesi · 5 pafta · 9 alt pafta', 'Sheet register · 5 sheets · 9 sub-sheets')}</span><button class="register-close" type="button" data-close-register>{T('Kapat', 'Close')} ✕</button></div>
  <ol>
    {''.join(items)}
  </ol>
  <div class="register-foot"><span>info@firmaadi.com</span><span>+90 (212) 000 00 00</span><span>İstanbul · London</span></div>
</nav>
<aside class="titleblock" aria-hidden="true">
  <div><span>{T('Proje', 'Project')}</span><b>Firma Adı BIM</b></div>
  <div><span>{T('Pafta', 'Sheet')}</span><b>{meta['sheet']}</b></div>
  <div><span>{T('Ölçek', 'Scale')}</span><b>1:100</b></div>
  <div class="xy"><span>{T('Koordinat', 'Coordinate')}</span><b id="tb-xy">X 0.0 · Y 0.0</b></div>
  <div><span>Rev</span><b>P07</b></div>
  <div><span>{T('Durum', 'Status')}</span><b>S2 · {T('Bilgi', 'Info')}</b></div>
</aside>'''

def chrome_bottom():
    return f'''<footer class="footer sheet">
  <div class="frame">
    <div class="footer-cta">
      <h2>{T('Modeli birlikte<br><em>kuralım.</em>', "Let's build<br>the <em>model.</em>")}</h2>
      <a class="btn" href="iletisim.html" data-sheet="A-900" data-label="İletişim">{T('Teklif isteyin', 'Request a proposal')}</a>
    </div>
    <div class="footer-cols">
      <div>{brand()}<p>{T('Uluslararası BIM danışmanlık ve proje geliştirme. İstanbul merkezli, dünya genelinde projeler.', 'International BIM consulting and project development. Based in Istanbul, working worldwide.')}</p></div>
      <div><h4>{T('Paftalar', 'Sheets')}</h4><ul>
        <li><a href="hizmetler.html" data-sheet="A-100" data-label="Hizmetler">A-100 · {T('Hizmetler', 'Services')}</a></li>
        <li><a href="projeler.html" data-sheet="A-200" data-label="Projeler">A-200 · {T('Projeler', 'Projects')}</a></li>
        <li><a href="hakkimizda.html" data-sheet="A-300" data-label="Hakkımızda">A-300 · {T('Hakkımızda', 'About')}</a></li>
        <li><a href="iletisim.html" data-sheet="A-900" data-label="İletişim">A-900 · {T('İletişim', 'Contact')}</a></li>
      </ul></div>
      <div><h4>{T('Hizmetler', 'Services')}</h4><ul>
        {''.join(f'<li><a href="{h}" data-sheet="{n}" data-label="{a}">{n} · {T(a, b)}</a></li>' for h, n, a, b, _, __ in SUB['hizmetler.html'])}
      </ul></div>
      <div><h4>{T('İletişim', 'Contact')}</h4><ul><li>info@firmaadi.com</li><li>+90 (212) 000 00 00</li><li>İstanbul, Türkiye</li></ul></div>
      <div><h4>{T('Takip', 'Follow')}</h4><ul><li>LinkedIn</li><li>YouTube</li><li>Instagram</li></ul></div>
    </div>
    <div class="footer-legal"><span>© 2026 Firma Adı BIM</span><span>ISO 19650 · IFC · BCF · COBie</span><span>{T('KVKK · Gizlilik', 'Privacy')}</span></div>
  </div>
</footer>'''

def parse(path):
    s = open(path).read()
    meta = json.loads(re.search(r'<!--meta (.*?)-->', s, re.S).group(1))
    style = ''.join(re.findall(r'<style>(.*?)</style>', s, re.S))
    script = ''.join(re.findall(r'<script>(.*?)</script>', s, re.S))
    main = re.search(r'<main id="main">.*?</main>', s, re.S).group(0)
    return meta, style, main, script

def page(name, mode):
    meta, style, main, script = parse(f'src/{name}.html')
    meta.setdefault('file', f'{name}.html')
    main = main.replace('<main id="main">', '<main id="main" class="sheet"><div class="frame">').replace('</main>', '</div></main>')
    body = chrome_top(meta) + '\n' + main + '\n' + chrome_bottom()
    title = meta['title']
    path = '' if name == 'index' else f'{name}.html'
    page_style = f'<style>\n{style}\n</style>' if style.strip() else ''
    page_script = f'<script>\n{script}\n</script>' if script.strip() else ''
    if mode == 'deploy':
        # Güvenlik: içerik güvenlik politikası (CSP). Satır içi script yalnızca hash'i eşleşirse çalışır.
        h = base64.b64encode(hashlib.sha256(f'\n{script}\n'.encode()).digest()).decode() if script.strip() else ''
        script_src = "'self'" + (f" 'sha256-{h}'" if h else '')
        csp = ("default-src 'self'; "
               f"script-src {script_src}; "
               "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
               "font-src 'self' https://fonts.gstatic.com; "
               "img-src 'self' data: blob:; connect-src 'self'; "
               "object-src 'none'; base-uri 'self'; form-action 'self'; "
               "upgrade-insecure-requests")
        sec = (f'<meta http-equiv="Content-Security-Policy" content="{csp}">\n'
               '<meta name="referrer" content="strict-origin-when-cross-origin">\n'
               '<script src="assets/guard.js"></script>')
        return f'''<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
{sec}
<title>{title}</title>
<meta name="description" content="{meta['desc']}">
<meta property="og:type" content="website">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{meta['desc']}">
<meta property="og:url" content="https://www.firmaadi.com/{path}">
<meta property="og:image" content="https://www.firmaadi.com/assets/logo.png">
<link rel="canonical" href="https://www.firmaadi.com/{path}">
<link rel="icon" type="image/svg+xml" href="assets/logo.svg">
{FONTS}
<link rel="stylesheet" href="assets/style.css">
{page_style}
</head>
<body>
{body}
<script src="assets/model.js"></script>
<script src="assets/site.js"></script>
{page_script}
</body>
</html>
'''
    inner = (f'<title>{title}</title>\n{FONTS}\n<style>\n{CSS}\n{style}\n</style>\n{body}\n'
             f'<script>\n{JS_MODEL}\n</script>\n<script>\n{JS_SITE}\n</script>\n{page_script}\n')
    if name == 'index':
        return inner
    head, rest = inner.split('</style>\n', 1)
    return ('<!doctype html>\n<html lang="tr">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + head + '</style>\n</head>\n<body>\n' + rest + '</body>\n</html>\n')

if __name__ == '__main__':
    names = [n[:-5] for n in sorted(os.listdir('src')) if n.endswith('.html')]
    for d in ('out/deploy/assets', 'out/artifact'):
        os.makedirs(d, exist_ok=True)
    for f in ('style.css', 'model.js', 'site.js', 'guard.js', 'logo.svg', 'logo.png'):
        if os.path.exists(f'assets/{f}'):
            open(f'out/deploy/assets/{f}', 'wb').write(open(f'assets/{f}', 'rb').read())
    for n in names:
        open(f'out/deploy/{n}.html', 'w').write(page(n, 'deploy'))
        open(f'out/artifact/{n}.html', 'w').write(page(n, 'artifact'))
    print('built', names)
