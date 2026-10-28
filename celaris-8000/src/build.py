import base64, pathlib, re, sys
A = pathlib.Path(sys.argv[1])
here = pathlib.Path(__file__).parent
css = (A / 'celaris.css').read_text()
css = re.sub(r"@import url\([^)]*\);\n?", "", css)  # Lexend va embebida abajo
html = (here / 'template.html').read_text()
html = html.replace('/*__CELARIS_CSS__*/', css)
html = html.replace('/*__LEXEND_B64__*/', base64.b64encode((here / 'lexend-latin.woff2').read_bytes()).decode())
html = html.replace('/*__LOGO_BLANCO__*/', base64.b64encode((A / 'logo-blanco-web.png').read_bytes()).decode())
html = html.replace('/*__LOGO_MORADO__*/', base64.b64encode((A / 'logo-morado-web.png').read_bytes()).decode())
(here.parent / 'celaris-8000.html').write_text(html)
print('ok', len(html))
