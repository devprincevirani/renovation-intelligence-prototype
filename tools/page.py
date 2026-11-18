"""Dev helper (not shipped logic): wraps a page body in the shared <head>. Usage in scripts only."""
def page(root, key, title, desc, body, scripts=('auth',), focus=None, noindex=False):
    s=''.join(f'<script defer src="{root}assets/js/{x}.js"></script>\n' for x in ('data','site')+tuple(scripts))
    head_html = f'<div id="focus-head" data-exit="{focus[0]}" data-exit-text="{focus[1]}"></div>' if focus else '<div id="site-head"></div>'
    foot = '' if focus else '<div id="site-foot"></div>\n'
    robots = '<meta name="robots" content="noindex">\n' if noindex else ''
    return f'''<!doctype html>
<html lang="en" data-root="{root}" data-page="{key}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
{robots}<meta name="theme-color" content="#203B38">
<link rel="icon" href="{root}assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600&family=Jost:wght@400;500&display=swap">
<link rel="stylesheet" href="{root}assets/css/styles.css">
{s}</head>
<body>
{head_html}
<main id="main">
{body}
</main>
{foot}</body>
</html>
'''
