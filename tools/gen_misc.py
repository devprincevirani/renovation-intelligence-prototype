"""Generates legal pages, photo credits, 404 and the dashboard preview pages."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from page import page

DRAFT = '<div class="draft"><i data-i="warn"></i><span><b>Placeholder wording.</b> The final text comes from Sam (docs/SCOPE.md section 2: legal wording is supplied by the client). This draft shows the layout only.</span></div>'
def toc(cur):
    items=[('terms/','Terms of use','terms'),('privacy/','Privacy','privacy'),('disclaimer/','Estimate disclaimer','disclaimer'),('photo-credits/','Photo credits','credits')]
    return '<nav class="toc" aria-label="Legal pages"><span class="label">Legal</span>' + ''.join(f'<a href="../{h}"{" aria-current=\"page\"" if k==cur else ""}>{t}</a>' for h,t,k in items) + '</nav>'
def legal(cur, h1, lede, articles, draft=True):
    return f'''<div class="page-head"><div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="../">Home</a><span aria-hidden="true">/</span><span>{h1}</span></nav><h1>{h1}</h1><p class="lede">{lede}</p><p class="updated">Last updated: draft, November 2026</p></div></div>
<section style="padding-top:clamp(32px,4vw,56px)"><div class="wrap legal-grid">{toc(cur)}<div class="doc">{DRAFT if draft else ''}{articles}</div></div></section>'''

disclaimer = '''<article><h2>What an estimate is</h2><p>Renovation Intelligence gives estimates for planning. An estimate is not a contractor's bid, an offer to do work or a guaranteed price.</p>
<h3>How the ranges are made</h3><p>Each cost is shown as a Low and a High. They come from local installed rates and real products for the work we found in your photos and facts. We never show a single expected figure.</p></article>
<article><h2>What an estimate cannot see</h2><ul><li>Anything hidden inside walls, floors, ceilings or systems.</li><li>Items that were not in your photos. These are marked unverified and left out of the total, which is then labeled partial.</li><li>The condition of the roof, heating and cooling, water heater and electrical panel. For these we give general guidance only, never a price.</li></ul></article>
<article><h2>What we do not give</h2><p>We do not inspect houses, and we do not give advice on permits, building codes, insurance or safety. A licensed contractor or inspector should see the house before you commit to any work.</p></article>'''

privacy = '''<article><h2>What we collect</h2><p>Your email, account type and password (stored only in scrambled form), the houses you enter, their photos and facts, and how you use the site.</p></article>
<article><h2>Your photos</h2><ul><li>Stored privately. Only you and the people you share a link with can see them.</li><li>Location data is removed from every copy we show or share.</li><li>Used to make your estimate. How they may be used to improve photo reading is Sam's decision and will be stated here.</li><li>Never sold.</li></ul></article>
<article><h2>Payments</h2><p>Payments are handled by Stripe. Your card details never reach our servers.</p></article>
<article><h2>Your choices</h2><p>You can turn off a share link at any time, ask for a copy of your data, or ask us to delete your account.</p></article>
<article><h2>In this prototype</h2><p>Nothing leaves your browser. Accounts, waitlist entries and choices are kept in this browser's local storage, and you can clear them from the Demo panel.</p></article>'''

terms = '''<article><h2>Your account</h2><p>One person per account. Keep your password private. You are responsible for what is entered under your account.</p></article>
<article><h2>Photos you upload</h2><p>You confirm that you took the photos or have the right to use them. Photos from a listing site may belong to the photographer or the agent.</p></article>
<article><h2>Free reports and payment</h2><p>Seeing the price by package is free, up to a limit of new houses per account. The full presentation is one payment per house. Viewing, switching goals, sharing and downloading do not count toward the limit.</p></article>
<article><h2>Estimates</h2><p>Every figure is an estimate for planning. See the <a href="../disclaimer/">estimate disclaimer</a>.</p></article>'''

CR = [('livonia-street.jpg','Rosedale Gardens Historic District, Livonia, Michigan','Andrew Jameson','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/'),
      ('livonia-corner.jpg','Rosedale Gardens Historic District, Livonia, Michigan','Andrew Jameson','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/'),
      ('livonia-pines.jpg','Rosedale Gardens Historic District, Livonia, Michigan','Andrew Jameson','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/'),
      ('brick-ranch.jpg','Lake Drive ranches, Bailey Lakes, Ohio','Nyttend','Public domain',''),
      ('split-level.jpg','Split-level houses in Gang Mills, New York','Stilfehler','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/'),
      ('colonial.jpg','169 Kedzie St, East Lansing, Michigan, built 1947','Tim Kiser','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/'),
      ('colonial-brick.jpg','House in East Lansing, Michigan, built 1937','Tim Kiser','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/'),
      ('dearborn-house.jpg','Charles A. Kandt House, Dearborn, Michigan','Dwight Burdette','Public domain',''),
      ('cabinet-run.jpg','Interior, Duncan House, Polymath Park, Acme, Pennsylvania','w_lemay','CC BY-SA 2.0','https://creativecommons.org/licenses/by-sa/2.0/'),
      ('kitchen-dated.jpg','Coolidge Street house, Old Jefferson, Louisiana','Infrogmation of New Orleans','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/'),
      ('kitchen-dated-wide.jpg','Coolidge Street house, Old Jefferson, Louisiana','Infrogmation of New Orleans','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/'),
      ('wood-floor.jpg','Wood flooring made of hickory wood','Loadmaster (David R. Tribble)','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/'),
      ('finishes/cab-oak.jpg','Cabinet door, raised panel (sample 4)','Stilfehler','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/'),
      ('finishes/cab-painted.jpg','Cabinet door, raised panel (sample 8)','Stilfehler','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/'),
      ('finishes/cab-shaker.jpg','Cabinet door, shaker (sample 4)','Stilfehler','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/'),
      ('finishes/ct-laminate.jpg','Laminate kitchen countertop, beige','Kurtkaiser','CC0',''),
      ('finishes/ct-stonelook.jpg','Formica laminate for countertops (sample 02)','Stilfehler','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/'),
      ('finishes/ct-quartz.jpg','Quartz (engineered stone) for countertops (sample 01)','Stilfehler','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/'),
      ('finishes/bs-existing.jpg','Detail of the Coolidge Street house kitchen, Old Jefferson, Louisiana','Infrogmation of New Orleans','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/'),
      ('finishes/bs-white.jpg','Ceramic tile, white rectangle','Eric Polk','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/'),
      ('finishes/bs-glazed.jpg','Kitchen backsplash tile','Capdevielle','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/'),
      ('finishes/fx-single.jpg','Franke faucet FF 380, kitchen sink','Tomwsulcer','CC0',''),
      ('finishes/fx-pulldown.jpg','Kitchen faucet (sample 1)','Stilfehler','CC0',''),
      ('finishes/fx-black.jpg','Black faucet at a bathroom sink','Shixart1985','CC BY 2.0','https://creativecommons.org/licenses/by/2.0/'),
      ('finishes/lt-old.jpg','Recessed fluorescent ceiling light with guard','BrokenSphere','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/'),
      ('finishes/lt-flush.jpg','A ceiling lamp','Slyronit','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/'),
      ('finishes/lt-recessed.jpg','Bathroom ceiling after remodel','Stilfehler','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/')]
credits = '<article><h2>Photos used on this site</h2><p>All photos come from Wikimedia Commons and are used under the license named beside each one. Some are resized or cropped. Captions on area pages describe the house type, not the photo\'s location, unless they say otherwise.</p><div class="credits">' + ''.join(
  f'<div><img src="../assets/img/{f}" alt="" width="88" height="64" loading="lazy"><span>{t}. {a}, ' + (f'<a href="{u}" target="_blank" rel="noopener">{l}</a>' if u else l) + '.</span></div>' for f,t,a,l,u in CR) + '</div><p class="small muted">Before launch, these are replaced with Sam\'s own photography or licensed images.</p></article>'

out = {
 'terms': ('Terms of use | Renovation Intelligence','The terms of using Renovation Intelligence: your account, the photos you upload, free reports and payment.', legal('terms','Terms of use','The terms of using the site and the estimates.', terms)),
 'privacy': ('Privacy | Renovation Intelligence','How Renovation Intelligence handles your account, your houses and your photos.', legal('privacy','Privacy','What we collect, how your photos are kept, and your choices.', privacy)),
 'disclaimer': ('Estimate disclaimer | Renovation Intelligence','What a Renovation Intelligence estimate is and is not, and what it cannot see.', legal('disclaimer','Estimate disclaimer','What an estimate is, what it cannot see, and what we do not give.', disclaimer)),
 'photo-credits': ('Photo credits | Renovation Intelligence','Credits and licenses for the photos used on this site.', legal('credits','Photo credits','Who took the photos on this site, and their licenses.', credits, draft=False)),
}
for k,(t,d,b) in out.items():
    os.makedirs(k, exist_ok=True)
    open(f'{k}/index.html','w').write(page('../', k, t, d, b, ()))

# 404: absolute root, because it is served at any URL
nf = '''<div class="nf"><div class="wrap nf-grid">
<div class="stack" style="gap:22px"><span class="nf-code" aria-hidden="true">404</span><h1 style="margin-top:12px">We could not find that page</h1><p class="lede">The address may have a typo, or the page has moved. Everything else is where you left it.</p>
<div class="cta-row"><a class="btn btn-primary" href="/">Go to the home page</a><a class="textlink" href="/renovation-cost/">Renovation cost by area</a></div></div>
<div class="hero-photo"><img src="/assets/img/livonia-pines.jpg" alt="Brick houses behind tall pine trees on a quiet residential street" width="1280" height="906"></div>
</div></div>'''
open('404.html','w').write(page('/', '404', 'Page not found | Renovation Intelligence', 'This page could not be found.', nf, (), None, True))

# Dashboard previews (phases 2 and 3)
for k, scope in (('app','user'),('admin','admin')):
    os.makedirs(k, exist_ok=True)
    open(f'{k}/index.html','w').write(page('../', k, ('My houses' if k=='app' else 'Console') + ' | Renovation Intelligence', 'Signed-in area.', f'<div class="acc-center"><div class="acc-card" id="preview" data-scope="{scope}" style="max-width:640px"></div></div>', ('preview',), ('', 'Back to the site'), True))
print('ok')
