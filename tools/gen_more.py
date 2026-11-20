"""Generates the contact page and the staff invite screen."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from page import page
contact = '''<section style="padding-top:clamp(36px,6vw,80px)"><div class="wrap wl-grid">
<div class="wl-copy"><nav class="crumbs" aria-label="Breadcrumb"><a href="../">Home</a><span aria-hidden="true">/</span><span>Contact</span></nav>
<h1>Contact us</h1><p class="lede">A question about an estimate, a builder or agent account, or the pilot. We reply by email.</p>
<div class="notice notice-quiet"><i data-i="info"></i><span>Sam's contact details and reply times are still to be confirmed. This form shows the layout.</span></div></div>
<div class="panel"><form class="form-grid" id="ct-form" novalidate>
<div class="field"><label for="ct-name">Your name</label><input class="input" id="ct-name" autocomplete="name"><span class="err"></span></div>
<div class="field"><label for="ct-email">Email</label><input class="input" id="ct-email" type="email" autocomplete="email"><span class="err"></span></div>
<div class="field"><label for="ct-topic">About</label><select class="select" id="ct-topic"><option>A question about an estimate</option><option>A builder or agent account</option><option>The pilot</option><option>Something else</option></select></div>
<div class="field"><label for="ct-msg">Message</label><textarea class="input" id="ct-msg" rows="5"></textarea><span class="err"></span></div>
<div class="field"><label class="check"><input type="checkbox" id="ct-ok"><span>Keep my details so you can reply. We do not add you to a list unless you ask.</span></label><span class="err" id="ct-ok-err"></span></div>
<button class="btn btn-primary btn-block" type="submit">Send the message</button></form>
<div class="success" id="ct-done" hidden tabindex="-1"><div class="mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path class="draw-check" d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h2 style="font-size:1.5rem">Thank you</h2><p>Your message is saved. We will reply by email.</p><a class="btn btn-secondary" href="../">Back to the home page</a></div></div>
</div></section>'''
invite = '<div class="acc-center"><div class="acc-card" id="inv"></div></div>'
os.makedirs('contact', exist_ok=True); os.makedirs('invite', exist_ok=True)
open('contact/index.html','w').write(page('../','contact','Contact | Renovation Intelligence','Questions about an estimate, a builder or agent account, or the pilot.',contact,('more',)))
open('invite/index.html','w').write(page('../','invite','Accept your invite | Renovation Intelligence','Accept an invite to the Renovation Intelligence console.',invite,('more',),('', 'Back to the site'),True))
print('ok')
