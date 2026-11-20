"""Generates the account screens. Run: python3 tools/gen_account.py (from the prototype folder)."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from page import page

TYPES = [('homeowner','Homeowner','I own the house'),('buyer','Buyer','I am looking at a house'),('seller','Seller','I am selling a house'),
         ('builder','Builder','I renovate houses for clients'),('agent','Agent','I help people buy and sell'),('other','Other','Something else')]
TICON = {'homeowner':'house','buyer':'search','seller':'tag','builder':'hammer','agent':'key','other':'more'}
def type_cards(name):
    return ('<div class="types-pick3">' + ''.join(f'<label><input type="radio" name="{name}" value="{k}" data-d="{d}"{" checked" if k=="homeowner" else ""}><span><span class="tp-ic"><i data-i="{TICON[k]}"></i></span><b>{t}</b><span class="tp-ok" aria-hidden="true"><i data-i="check"></i></span></span></label>' for k,t,d in TYPES) + '</div>')
def type_chips(name):
    return '<div class="types-pick3">' + ''.join(f'<label><input type="radio" name="{name}" value="{k}" data-d="{d}"><span><span class="tp-ic"><i data-i="{TICON[k]}"></i></span><b>{t}</b><span class="tp-ok" aria-hidden="true"><i data-i="check"></i></span></span></label>' for k,t,d in TYPES) + '</div>'
def type_select(id_):
    return f'<select class="select" id="{id_}"><option value="">Choose one</option>' + ''.join(f'<option value="{k}">{t}</option>' for k,t,_ in TYPES) + '</select>'

def field(id_, label, typ='text', help_='', ac='', extra='', opt=False):
    o = ' <span class="opt">(optional)</span>' if opt else ''
    h = f'<span class="help" id="{id_}-help">{help_}</span>' if help_ else ''
    return f'<div class="field"><label for="{id_}">{label}{o}</label><input class="input" id="{id_}" type="{typ}" autocomplete="{ac}"{extra}{f" aria-describedby=\"{id_}-help\"" if help_ else ""}>{h}<span class="err" id="{id_}-err" role="alert"></span></div>'

def pw(id_, label, ac, help_='', meter=False):
    m = '<div class="meter" id="' + id_ + '-meter" aria-hidden="true"><i></i><i></i><i></i></div>' if meter else ''
    h = f'<span class="help" id="{id_}-help">{help_}</span>' if help_ else ''
    return f'<div class="field"><label for="{id_}">{label}</label><div class="pw-wrap"><input class="input" id="{id_}" type="password" autocomplete="{ac}"{f" aria-describedby=\"{id_}-help\"" if help_ else ""}><button type="button" aria-pressed="false">Show</button></div>{m}{h}<span class="err" id="{id_}-err" role="alert"></span></div>'

SHOW_EST = '''<aside class="auth-show" aria-label="What you get"><div class="as-in">
  <p class="as-k">{kicker}</p><h2>One house. Three goals. A Low and a High for each.</h2>
  <div class="as-card"><div class="as-photo"><img src="../assets/img/brick-ranch.jpg" alt="A one-story brick ranch house" width="1280" height="853"><span class="as-addr"><b>18450 Maple Ridge Dr</b> Clinton Township, MI</span></div>
    <ul class="as-pk" id="as-pk"></ul>
    <p class="as-note" id="as-note"></p></div>
  <p class="as-foot">Sample house. Your own estimate uses your photos and facts.</p>
</div></aside>'''
SHOW_SIGNUP = SHOW_EST.replace('{kicker}', 'What you get, free')
SHOW_WAIT = SHOW_EST.replace('{kicker}', 'What you will get, free')
SHOW_LOGIN = '''<aside class="auth-show" aria-label="Your houses"><div class="as-in">
  <p class="as-k">Pick up where you left off</p><h2>Your houses, each with its next step.</h2>
  <ul class="as-houses">
    <li><img src="../assets/img/brick-ranch.jpg" alt="" width="1280" height="853"><span><b>18450 Maple Ridge Dr</b><span>Clinton Township</span></span><em class="st-ready">Price ready</em></li>
    <li><img src="../assets/img/colonial.jpg" alt="" width="1280" height="853"><span><b>40322 Clinton Ct</b><span>Sterling Heights</span><i class="as-prog"><i></i></i></span><em class="st-run">Reading photos</em></li>
    <li><img src="../assets/img/livonia-street.jpg" alt="" width="1280" height="853"><span><b>6820 Kendal St</b><span>Dearborn</span></span><em class="st-draft">Draft, step 2 of 4</em></li>
  </ul>
  <p class="as-foot">Demo houses. In this prototype every role opens in one click.</p>
</div></aside>'''
SIDE = lambda img, alt, text: f'<div class="auth-side"><img src="../assets/img/{img}" alt="{alt}"><div class="cap">{text}</div></div>'

pages = {}

pages['waitlist'] = ('Join the waitlist for renovation estimates | Renovation Intelligence',
 'We open on April 1, 2027. Join the waitlist and we will write once, when you can enter your first house.',
 f'''<div class="auth auth2 auth-wl">
  <div class="auth-form"><div class="auth-inner" id="wl-panel">
    <form class="form-grid" id="wl-form" novalidate>
      <div class="stack" style="gap:10px"><span class="open-chip"><i data-i="clock" class="i-sm"></i>Opening April 1, 2027</span><h1>Join the waitlist</h1><p class="muted">We write once, when you can enter your first house. People Sam invites can start earlier, with a 15-day trial.</p></div>
      {field('wl-email','Email','email',ac='email',extra=' placeholder="name@example.com"')}
      <fieldset class="field tp-field"><legend class="flabel tp-head"><span>I am a</span><span class="tp-desc" id="wl-type-desc" aria-live="polite">Optional</span></legend>{type_chips('wl-type')}</fieldset>
      <button class="btn btn-primary btn-block btn-lg" type="submit">Join the waitlist <i data-i="arrow" class="i-arrow"></i></button>
      <p class="wl2-trust"><i data-i="shield"></i><span>One email when we open. Nothing else.</span></p>
      <p class="small muted center">Invited by Sam? Open the link in his email to sign up.</p>
    </form>
    <div class="success" id="wl-done" hidden tabindex="-1">
      <div class="mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path class="draw-check" d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
      <h2 style="font-size:1.6rem" id="wl-done-t">You are on the list</h2>
      <p id="wl-done-b"></p>
      <div class="cta-row"><a class="btn btn-secondary" href="../sample/">See a sample estimate</a><button type="button" class="linkbtn" id="wl-again">Add another email</button></div>
    </div>
  </div></div>
  {SHOW_WAIT}
</div>''', ('auth',), None)

pages['signup'] = ('Create your account | Renovation Intelligence', 'Create an account to enter a house and see its price by package.',
 f'''<div class="auth auth2">
  <div class="auth-form"><div class="auth-inner">
    <ol class="auth-steps" aria-label="Getting started"><li class="cur"><span>1</span>Account</li><li><span>2</span>Confirm email</li><li><span>3</span>First house</li></ol>
    <div class="stack" style="gap:8px"><h1>Create your account</h1><p class="muted">Email, password and what describes you. Nothing else.</p></div>
    <div class="invite-chip" id="su-invited" hidden><i data-i="mail"></i><span><b>Sam invited you.</b> Your 15-day trial starts when you enter your first house. <span class="xsmall muted">Proposed: how Sam invites contacts is still open.</span></span></div>
    <div class="su-closed" id="su-closed" hidden><span class="sc-ic"><i data-i="lock"></i></span><h2 id="su-closed-t">Sign up opens on April 1, 2027</h2><p class="muted" id="su-closed-b">Until then, only the people Sam invites can sign up. Join the waitlist and we will write when it opens.</p><a class="btn btn-primary btn-block btn-lg" href="../waitlist/">Join the waitlist <i data-i="arrow" class="i-arrow"></i></a><p class="small muted center">Invited by Sam? Open the link in his email.</p></div>
    <form class="form-grid" id="su-form" novalidate>
      <fieldset class="field tp-field"><legend class="flabel tp-head"><span>I am a</span><span class="tp-desc" id="su-type-desc" aria-live="polite">I own the house</span></legend>{type_cards('su-type')}</fieldset>
      {field('su-email','Email','email',ac='email',extra=' placeholder="name@example.com"')}
      {pw('su-pw','Password','new-password','A longer phrase is stronger.',True)}
      <ul class="pw-rules" aria-live="polite"><li id="su-r-len"><i data-i="check" class="i-sm"></i>At least 8 characters</li></ul>
      <div class="field consent-card"><label class="check"><input type="checkbox" id="su-disc"><span>I understand that an estimate is for planning. It is not a contractor's bid, an inspection or a fixed price. <a href="../disclaimer/" target="_blank" rel="noopener">Read the disclaimer</a></span></label><span class="err" id="su-disc-err" role="alert"></span></div>
      <label class="check"><input type="checkbox" id="su-news"><span>Send me product updates. <span class="muted">(optional)</span></span></label>
      <button class="btn btn-primary btn-block btn-lg" type="submit">Create my account <i data-i="arrow" class="i-arrow"></i></button>
      <p class="small muted center">Already have an account? <a href="../login/">Log in</a></p>
    </form>
  </div></div>
  {SHOW_SIGNUP}
</div>''', ('auth',), ('', 'Back to the site'), True)

pages['login'] = ('Log in | Renovation Intelligence', 'Log in to see your houses and estimates.',
 f'''<div class="auth auth2 auth-login">
  <div class="auth-form"><div class="auth-inner">
    <div class="stack" style="gap:8px"><h1>Welcome back</h1><p class="muted">Log in to see your houses and their estimates.</p></div>
    <div class="notice notice-bad" id="li-alert" hidden role="alert"></div>
    <form class="form-grid" id="li-form" novalidate>
      {field('li-email','Email','email',ac='email',extra=' placeholder="name@example.com"')}
      {pw('li-pw','Password','current-password')}
      <div class="li-row"><label class="check"><input type="checkbox" id="li-keep"><span>Keep me logged in</span></label><a class="small" href="../forgot-password/">Forgot your password?</a></div>
      <button class="btn btn-primary btn-block btn-lg" type="submit">Log in <i data-i="arrow" class="i-arrow"></i></button>
    </form>
    <div class="or2"><span>or</span></div>
    <section class="demo2" aria-labelledby="demo2-h">
      <div class="d2-head"><h2 id="demo2-h">Try the demo</h2><span class="d2-chip"><i data-i="lock" class="i-sm"></i>No password</span></div>
      <div class="d2-roles" id="demo-access" role="group" aria-labelledby="demo2-h"></div>
      <p class="d2-desc" id="d2-desc" aria-live="polite">Pick a role to look around.</p>
    </section>
    <p class="small muted center">New here? <a href="../signup/" data-when="launched" hidden>Create an account</a><a href="../waitlist/" data-when="prelaunch">Join the waitlist</a></p>
  </div></div>
  {SHOW_LOGIN}
</div>''', ('auth',), ('', 'Back to the site'), True)

pages['verify-email'] = ('Check your email | Renovation Intelligence', 'Confirm your email address to finish creating your account.',
 '''<div class="fx-wrap"><div class="fx-card" id="ve" aria-live="polite"></div></div>''', ('auth',), ('', 'Back to the site'), True)

RESET_FLOW = ['Enter your email', 'Open the link', 'Set a new password']
def fx_top(kicker, count, art, warn=False):
    return f'<div class="fx-top"><span class="fx-kick">{kicker}</span><div class="fx-art{" fx-warn" if warn else ""}" data-art="{art}"></div></div>'
def fx_flow(labels, cur):
    items = ''.join(f'<li class="{"done" if i < cur else "cur" if i == cur else ""}"><span>{"" if i < cur else i + 1}</span>{t}</li>' for i, t in enumerate(labels))
    return f'<ol class="fx-flow" aria-label="Steps">{items}</ol>'

pages['forgot-password'] = ('Reset your password | Renovation Intelligence', 'Get a link to set a new password.',
 f'''<div class="fx-wrap"><div class="fx-card">
  <div id="fp-step1" class="fx-in">
    {fx_top('Password reset', '1 of 3', 'key')}
    <div class="fx-body">
      <div class="fx-head"><h1>Forgot your password?</h1><p class="muted">No problem. Enter the email you signed up with and we will send you a link to choose a new one.</p></div>
      <form class="form-grid" id="fp-form" novalidate>
        {field('fp-email','Email','email',ac='email',extra=' placeholder="name@example.com"')}
        <button class="btn btn-primary btn-block btn-lg" type="submit">Send the link <i data-i="arrow" class="i-arrow"></i></button>
      </form>
      <p class="fx-alt">Remembered it? <a href="../login/">Log in</a></p>
    </div>
  </div>
  <div id="fp-step2" class="fx-in" hidden></div>
</div></div>''', ('auth',), ('login/', 'Back to log in'), True)

pages['reset-password'] = ('Set a new password | Renovation Intelligence', 'Choose a new password for your account.',
 f'''<div class="fx-wrap"><div class="fx-card">
  <div id="rp-step1" class="fx-in">
    {fx_top('Password reset', '3 of 3', 'lock')}
    <div class="fx-body">
      <div class="fx-head"><h1>Set a new password</h1><p class="muted" id="rp-for">For your account.</p></div>
      <form class="form-grid" id="rp-form" novalidate>
        <input class="sr" id="rp-user" type="email" autocomplete="username" readonly tabindex="-1" aria-hidden="true">
        {pw('rp-pw','New password','new-password','',True)}
        <p class="fx-str" id="rp-str" aria-live="polite">A longer phrase is stronger.</p>
        {pw('rp-pw2','Type it again','new-password')}
        <ul class="pw-rules fx-rules" aria-live="polite"><li id="rp-r-len"><i data-i="check" class="i-sm"></i>At least 8 characters</li><li id="rp-r-match"><i data-i="check" class="i-sm"></i>Both passwords match</li></ul>
        <button class="btn btn-primary btn-block btn-lg" type="submit">Save my new password</button>
      </form>
      <p class="fx-note"><i data-i="shield" class="i-sm"></i>Saving logs you out on your other devices.</p>
    </div>
  </div>
  <div id="rp-step2" class="fx-in" hidden tabindex="-1">
    {fx_top('Password reset', 'Done', 'check')}
    <div class="fx-body">
      <div class="fx-head"><h2>Your password is changed</h2><p class="muted">Use it the next time you log in. Your other devices are logged out.</p></div>
      <a class="btn btn-primary btn-block btn-lg" href="../login/">Log in <i data-i="arrow" class="i-arrow"></i></a>
    </div>
  </div>
</div></div>''', ('auth',), ('login/', 'Back to log in'), True)

for key,(title,desc,body,scripts,focus,*rest) in pages.items():
    os.makedirs(key, exist_ok=True)
    open(f'{key}/index.html','w').write(page('../', key, title, desc, body, scripts, focus, bool(rest and rest[0])))
print('generated', ', '.join(pages))
