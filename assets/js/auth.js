/* Account screens: waitlist, sign up, verify email, log in, forgot and reset password.
   Simulated in the browser. No email is sent; a "demo inbox" stands in for it. */
(function(){
  var RI = window.RI, doc = document, F = RI.form, page = doc.documentElement.getAttribute('data-page');
  var P = F.params();
  function $(id){ return doc.getElementById(id); }
  function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
  function blurEmail(input){
    input.addEventListener('blur', function(){ if(input.value && !F.emailOk(input.value)) F.setInvalid(input, 'Check the email address, for example name@example.com.'); });
    input.addEventListener('input', function(){ if(input.closest('.field').classList.contains('invalid') && F.emailOk(input.value)) F.setInvalid(input, null); });
  }
  function checkEmail(input){
    var v = input.value.trim();
    if(!v){ F.setInvalid(input, 'Enter your email address.'); return false; }
    if(!F.emailOk(v)){ F.setInvalid(input, 'Check the email address, for example name@example.com.'); return false; }
    F.setInvalid(input, null); return true;
  }
  function meter(input, m){ input.addEventListener('input', function(){ m.setAttribute('data-s', F.strength(input.value)); if(input.value.length >= 8) F.setInvalid(input, null); }); }
  function mailSim(subject, bodyHtml){
    return '<div class="mail-sim" aria-label="Email preview"><div class="mh">' + RI.icon('mail','i-sm') + '<span><b>Email preview</b> &middot; ' + RI.esc(subject) + '</span></div><div class="mb">' + bodyHtml + '</div></div>';
  }
  F.pwToggle(); RI.fillArt();
  /* "Send it again" waits 30 seconds between sends, and says so */
  function cooldown(btn, label, onSend){
    var t = null;
    btn.addEventListener('click', function(){
      if(t) return; onSend(); var left = 30; btn.disabled = true;
      (function tick(){ btn.textContent = 'Send again in 0:' + (left < 10 ? '0' : '') + left; if(left-- <= 0){ clearTimeout(t); t = null; btn.disabled = false; btn.textContent = label; return; } t = setTimeout(tick, 1000); })();
    });
  }
  /* The panel beside the form: the sample house's real Low and High under each goal */
  (function(){
    var box = $('as-pk'); if(!box || !RI.totals) return;
    var names = {E:'Essential', S:'Standard', P:'Premium'}, tt = {E:RI.totals('E', {}), S:RI.totals('S', {}), P:RI.totals('P', {})}, max = tt.P.high * 1.08;
    box.innerHTML = ['E','S','P'].map(function(k, i){
      var t = tt[k];
      return '<li style="--i:' + i + '"><span class="ap-n">' + names[k] + '</span><span class="ap-r">' + RI.range(t.low, t.high) + '</span><span class="ap-l" aria-hidden="true"><i style="left:' + (t.low / max * 100).toFixed(1) + '%;width:' + ((t.high - t.low) / max * 100).toFixed(1) + '%"></i></span></li>';
    }).join('');
    var held = 0; RI.SAMPLE.rooms.forEach(function(r){ r.items.forEach(function(it){ if(RI.isHeld(it)) held++; }); });
    $('as-note').innerHTML = held ? '<span class="state state-partial">Partial</span><span>' + held + ' items could not be confirmed from the photos. They are named, never guessed.</span>' : '';
  })();

  /* ---------- Waitlist: email and account type, a thank-you state, a confirmation email (APP_FLOW 4.5) ---------- */
  if(page === 'waitlist'){
    var em = $('wl-email');
    var ty = {get value(){ var c = doc.querySelector('input[name=wl-type]:checked'); return c ? c.value : ''; },
              set value(v){ var r = doc.querySelector('input[name=wl-type][value="' + v + '"]'); if(r) r.checked = true; }};
    /* Tap a chosen chip again to clear it: the field is optional */
    doc.querySelectorAll('input[name=wl-type]').forEach(function(r){
      r.closest('label').addEventListener('pointerdown', function(){ r.dataset.was = r.checked ? '1' : ''; });
      r.addEventListener('click', function(){ if(r.dataset.was){ r.checked = false; r.dataset.was = ''; } wlDesc(); });
    });
    /* The label line says "Optional" until a type is chosen, then what that type means */
    function wlDesc(){ var c = doc.querySelector('input[name=wl-type]:checked'), d = $('wl-type-desc'); d.textContent = c ? c.getAttribute('data-d') : 'Optional'; d.classList.remove('flip'); void d.offsetWidth; d.classList.add('flip'); }
    if(P.email) em.value = P.email;
    if(P.type) ty.value = P.type;
    wlDesc();
    blurEmail(em);
    $('wl-form').addEventListener('submit', function(e){
      e.preventDefault();
      if(!checkEmail(em)){ em.focus(); return; }
      var btn = this.querySelector('[type=submit]'); F.busy(btn, true, 'Adding you');
      wait(700).then(function(){
        var v = em.value.trim().toLowerCase(), list = RI.store.get('waitlist', []), found = list.filter(function(x){ return x.email === v; })[0];
        if(found){ found.type = ty.value || found.type; }
        else list.push({email:v, type:ty.value, at:Date.now(), source:'waitlist'});
        RI.store.set('waitlist', list);
        F.busy(btn, false);
        $('wl-form').hidden = true; var d = $('wl-done'); d.hidden = false;
        $('wl-done-t').textContent = found ? 'You were already on the list' : 'You are on the list';
        $('wl-done-b').innerHTML = 'We will write to <b>' + RI.esc(v) + '</b> once, when we open on April 1, 2027.' + (found ? ' We updated your details.' : '') +
          mailSim('You are on the waitlist', '<p>Thanks for joining. We will write once, when Renovation Intelligence opens on April 1, 2027.</p><p class="xsmall muted">Preview only. In the product this arrives as a real email.</p>');
        if(!found) RI.track('waitlist_joined', {source:'waitlist'});
        d.focus();
      });
    });
    $('wl-again').addEventListener('click', function(){ $('wl-form').reset(); wlDesc(); $('wl-done').hidden = true; $('wl-form').hidden = false; em.focus(); });
  }

  /* ---------- Sign up ---------- */
  if(page === 'signup'){
    var se = $('su-email'), sp = $('su-pw');
    /* Before launch only the contacts Sam invites can sign up (APP_FLOW 3). His "Trial invite" email links here
       (APP_FLOW 10); the link carries a token. How he invites is still open (APP_FLOW 13, point 8) */
    /* demo-trial: the full form with invite credits. trial-invite: Sam's Invite to trial (console, Trial invites tab),
       which fixes the email and account type and gives a 15-day trial from sign up */
    var TRIAL = {'demo-trial':{email:'contact@demo.ri'}, 'trial-invite':{email:'priya.shah@example.com', type:'builder', days:15}}, inv = P.invite ? TRIAL[P.invite] : null, pre = RI.mode() === 'prelaunch';
    if(pre && !inv){
      $('su-form').hidden = true; $('su-closed').hidden = false; doc.querySelector('.auth-steps').hidden = true;
      doc.querySelector('.auth-inner > .stack').hidden = true;
      if(P.invite){ $('su-closed-t').textContent = 'This invite link does not work'; $('su-closed-b').textContent = 'It may be mistyped or too old. Ask Sam for a new one, or join the waitlist and we will write when sign up opens.'; }
    }
    if(pre && inv){ $('su-invited').hidden = false; if(!P.email) P.email = inv.email; if(inv.days) trialForm(); }
    /* A referral link (?ref=CODE, business model 3): say who shared it; the new account is linked to them when it is made.
       Before launch sign up is closed, so the link shows the closed screen like any other visit */
    var refBy = !inv && P.ref && RI.Ref && RI.Ref.settings().on ? RI.Ref.ownerOf(P.ref) : null;
    if(refBy && !pre){ $('su-invited').innerHTML = RI.icon('share') + '<span><b>' + RI.esc(RI.Ref.nameOf(refBy)) + ' sent you this link.</b> Create your account to explore renovation costs for free.</span>'; $('su-invited').hidden = false; }
    if(P.type){ var r = doc.querySelector('input[name="su-type"][value="' + P.type + '"]'); if(r) r.checked = true; }
    if(P.email) se.value = P.email;
    blurEmail(se); meter(sp, $('su-pw-meter'));
    /* The chosen account type explains itself under the tiles */
    function typeDesc(){ var c = doc.querySelector('input[name="su-type"]:checked'), d = $('su-type-desc'); if(!c) return; d.textContent = c.getAttribute('data-d'); d.classList.remove('flip'); void d.offsetWidth; d.classList.add('flip'); }
    doc.querySelectorAll('input[name="su-type"]').forEach(function(r){ r.addEventListener('change', typeDesc); }); typeDesc();
    sp.addEventListener('input', function(){ $('su-r-len').classList.toggle('ok', sp.value.length >= 8); });
    sp.addEventListener('blur', function(){ if(sp.value && sp.value.length < 8) F.setInvalid(sp, 'Use at least 8 characters.'); });
    $('su-disc').addEventListener('change', function(){ if(this.checked) $('su-disc-err').closest('.field').classList.remove('invalid'); });
    $('su-form').addEventListener('submit', function(e){
      e.preventDefault();
      var ok = checkEmail(se);
      if(sp.value.length < 8){ F.setInvalid(sp, sp.value ? 'Use at least 8 characters.' : 'Choose a password.'); ok = false; } else F.setInvalid(sp, null);
      var disc = $('su-disc');
      if(!disc.checked){ var f = disc.closest('.field'); f.classList.add('invalid'); $('su-disc-err').innerHTML = RI.icon('warn','i-sm') + '<span>Please confirm you have read this to continue.</span>'; ok = false; }
      if(ok && RI.users.get(se.value)){ F.setInvalid(se, 'An account with this email already exists. Log in instead.'); ok = false; }
      if(!ok){ var first = doc.querySelector('.field.invalid input'); if(first) first.focus(); return; }
      var btn = this.querySelector('[type=submit]'); F.busy(btn, true, 'Creating your account');
      var type = doc.querySelector('input[name="su-type"]:checked').value;
      wait(900).then(function(){
        var email = se.value.trim().toLowerCase();
        RI.users.put({email:email, pw:F.hash(sp.value), type:type, verified:false, trial:!!(pre && inv), news:$('su-news').checked, at:Date.now()});
        if(refBy) RI.Ref.attach(P.ref, email);
        RI.track('signup_completed', {type:type});
        location.href = '../verify-email/?email=' + encodeURIComponent(email);
      });
    });

    /* The 15-day trial view: email locked, a password typed twice. The invite link went to this address, so it
       counts as confirmed and there is no email step (as with a staff invite). The trial runs from sign up */
    function trialForm(){
      var NAMES = {homeowner:'a homeowner', buyer:'a buyer', seller:'a seller', builder:'a builder', agent:'an agent'};
      var DAY = 86400000, te = $('st-email'), p1 = $('st-pw'), p2 = $('st-pw2');
      var ends = new Date(Date.now() + inv.days * DAY).toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'});
      $('su-form').hidden = true; $('su-trial').hidden = false;
      $('su-invited').innerHTML = RI.icon('mail') + '<span><b>Sam invited you' + (NAMES[inv.type] ? ' as ' + NAMES[inv.type] : '') + '.</b> Your ' + inv.days + '-day trial starts when you create your account and ends on <b>' + ends + '</b>.</span>';
      doc.querySelector('.auth-inner > .stack h1').textContent = 'Start your ' + inv.days + '-day trial';
      doc.querySelector('.auth-inner > .stack p').textContent = 'Choose a password. Your email comes from the invite.';
      var steps = doc.querySelectorAll('.auth-steps li'); steps[1].hidden = true; steps[2].querySelector('span').textContent = '2';
      te.value = inv.email;
      meter(p1, $('st-pw-meter'));
      function rules(){ $('st-r-len').classList.toggle('ok', p1.value.length >= 8); $('st-r-match').classList.toggle('ok', !!p1.value && p1.value === p2.value); }
      p1.addEventListener('input', rules);
      p2.addEventListener('input', function(){ rules(); if(p2.value === p1.value) F.setInvalid(p2, null); });
      p1.addEventListener('blur', function(){ if(p1.value && p1.value.length < 8) F.setInvalid(p1, 'Use at least 8 characters.'); });
      $('st-disc').addEventListener('change', function(){ if(this.checked) $('st-disc-err').closest('.field').classList.remove('invalid'); });
      $('su-trial').addEventListener('submit', function(e){
        e.preventDefault();
        var ok = true;
        if(p1.value.length < 8){ F.setInvalid(p1, p1.value ? 'Use at least 8 characters.' : 'Choose a password.'); ok = false; } else F.setInvalid(p1, null);
        if(!p2.value){ F.setInvalid(p2, 'Type the password again.'); ok = false; }
        else if(p2.value !== p1.value){ F.setInvalid(p2, 'The two passwords do not match.'); ok = false; } else F.setInvalid(p2, null);
        var disc = $('st-disc');
        if(!disc.checked){ disc.closest('.field').classList.add('invalid'); $('st-disc-err').innerHTML = RI.icon('warn','i-sm') + '<span>Please confirm you have read this to continue.</span>'; ok = false; }
        if(RI.users.get(inv.email)){ F.setInvalid(te, 'This invite was already used: the account exists. Log in instead.'); ok = false; }
        if(!ok){ var first = doc.querySelector('#su-trial .field.invalid input:not([readonly])'); if(first) first.focus(); return; }
        var btn = this.querySelector('[type=submit]'); F.busy(btn, true, 'Starting your trial');
        wait(900).then(function(){
          var at = Date.now();
          RI.users.put({email:inv.email, pw:F.hash(p1.value), type:inv.type, verified:true, trial:true, trialEnds:at + inv.days * DAY, news:false, at:at});
          RI.track('signup_completed', {type:inv.type, trial:inv.days});
          location.href = '../verify-email/?email=' + encodeURIComponent(inv.email);
        });
      });
    }
  }

  /* ---------- Verify email ---------- */
  if(page === 'verify-email'){
    var box = $('ve'), email = (P.email || '').toLowerCase(), u = email ? RI.users.get(email) : null;
    var FLOW = ['Account', 'Confirm email', 'First house'];
    var who = '<span class="fx-email">' + RI.icon('mail','i-sm') + RI.esc(email || 'your email') + '</span>';
    function render(top, body, cur){ box.innerHTML = '<div class="fx-in">' + top + '<div class="fx-body">' + body + '</div></div>'; RI.fillIcons(box); RI.fillArt(box); }
    function sent(){
      render(RI.fxTop('Create your account', '2 of 3', 'mail'),
        '<div class="fx-head"><h1>Check your email</h1><p class="muted">We sent a confirmation link to</p>' + who + '<p class="muted">Open it to confirm your address. It works for 24 hours.</p></div>' +
        '<div class="fx-inbox">' + mailSim('Confirm your email', '<p>Confirm your email to finish creating your Renovation Intelligence account.</p><div><button type="button" class="btn btn-primary btn-sm" id="ve-confirm">Confirm my email</button></div><p class="xsmall muted">Preview only. In the product this arrives as a real email.</p>') + '</div>' +
        '<div class="fx-row"><p class="fx-note">' + RI.icon('info','i-sm') + 'Nothing there? Check spam and promotions.</p><button type="button" class="btn btn-secondary btn-sm" id="ve-resend">Send it again</button></div>' +
        '<a class="fx-demo" href="?email=' + encodeURIComponent(email) + '&state=expired">Demo: see the expired link screen</a>', 1);
      $('ve-confirm').addEventListener('click', function(){
        F.busy(this, true, 'Confirming');
        wait(700).then(function(){ if(u){ u.verified = true; RI.users.put(u); } verified(); });
      });
      cooldown($('ve-resend'), 'Send it again', function(){ RI.toast('We sent a new link to ' + (email || 'your email') + '.', 'mail'); });
    }
    function verified(){
      var ends = u && u.trialEnds ? new Date(u.trialEnds).toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'}) : '';
      render(RI.fxTop('Create your account', ends ? '2 of 2' : '3 of 3', 'check'),
        (ends ? '<div class="fx-head"><h1>Your 15-day trial has started</h1><p class="muted">Your account is ready. The invite confirmed your email, so there is no email step. Your trial ends on <b>' + ends + '</b>.</p></div>' :
        '<div class="fx-head"><h1>Your email is confirmed</h1><p class="muted">Your account is ready.</p></div>') +
        '<ul class="fx-next"><li><b>About 10 minutes</b><span>to enter your first house</span></li><li><b>Photos first</b><span>room by room</span></li><li><b>Sizes optional</b><span>skip any you do not know</span></li></ul>' +
        '<button type="button" class="btn btn-primary btn-block btn-lg" id="ve-go">Enter my first house ' + RI.icon('arrow','i-sm i-arrow') + '</button><p class="fx-alt"><a href="../login/">Log in later</a></p>', 2);
      $('ve-go').addEventListener('click', function(){
        RI.store.set('session', {role:(u && (u.type === 'builder' || u.type === 'agent')) ? 'builder' : 'homeowner', name:email.split('@')[0], email:email, type:u ? u.type : 'homeowner', demo:false, at:Date.now()});
        location.href = '../app/#/houses/new';
      });
    }
    function expired(){
      render(RI.fxTop('Create your account', '2 of 3', 'clock', {warn:true}),
        '<div class="fx-head"><h1>This link has expired</h1><p class="muted">Confirmation links work for 24 hours, so this one has run out. We can send a fresh one to</p>' + who + '</div>' +
        '<button type="button" class="btn btn-primary btn-block btn-lg" id="ve-new">Send a new link</button><p class="fx-alt">Already confirmed? <a href="../login/">Log in</a></p>', 1);
      $('ve-new').addEventListener('click', function(){ F.busy(this, true, 'Sending'); wait(700).then(function(){ history.replaceState(null, '', '?email=' + encodeURIComponent(email)); sent(); RI.toast('A new link is on its way.', 'mail'); }); });
    }
    if(P.state === 'expired') expired(); else if(u && u.verified) verified(); else sent();
  }

  /* ---------- Log in ---------- */
  if(page === 'login'){
    /* Demo roles: three compact tiles; the focused one explains itself underneath */
    var dbox = $('demo-access'), ddesc = $('d2-desc'), dflt = ddesc.textContent;
    dbox.innerHTML = RI.ROLES.map(function(r){
      return '<button type="button" class="d2-role d2-' + r.role + '" data-demo-role="' + r.role + '" data-d="' + RI.esc(r.d) + '" aria-describedby="d2-desc"><span class="d2-av">' + RI.icon(r.icon) + '</span><span class="d2-n">' + r.type + '</span></button>';
    }).join('');
    function say(b){ ddesc.textContent = b ? b.getAttribute('data-d') : dflt; ddesc.classList.toggle('on', !!b); }
    dbox.addEventListener('mouseover', function(e){ say(e.target.closest('.d2-role')); });
    dbox.addEventListener('mouseleave', function(){ if(!dbox.contains(doc.activeElement)) say(null); });
    dbox.addEventListener('focusin', function(e){ say(e.target.closest('.d2-role')); });
    dbox.addEventListener('focusout', function(e){ if(!dbox.contains(e.relatedTarget)) say(null); });
    /* Show that the tile is opening; the shared handler signs in and moves on */
    dbox.addEventListener('click', function(e){
      var b = e.target.closest('.d2-role'); if(!b || dbox.classList.contains('busy')) return;
      dbox.classList.add('busy'); b.classList.add('opening'); b.querySelector('.d2-n').textContent = 'Opening…'; b.setAttribute('aria-busy', 'true');
    }, true);
    var le = $('li-email'), lp = $('li-pw'), alert = $('li-alert');
    if(P.email) le.value = P.email;
    blurEmail(le);
    $('li-form').addEventListener('submit', function(e){
      e.preventDefault(); alert.hidden = true;
      var ok = checkEmail(le);
      if(!lp.value){ F.setInvalid(lp, 'Enter your password.'); ok = false; } else F.setInvalid(lp, null);
      if(!ok){ doc.querySelector('.field.invalid input').focus(); return; }
      var btn = this.querySelector('[type=submit]'); F.busy(btn, true, 'Logging in');
      wait(700).then(function(){
        F.busy(btn, false);
        var u = RI.users.get(le.value);
        if(!u || u.pw !== F.hash(lp.value)){
          alert.innerHTML = RI.icon('warn') + '<span>That email and password do not match an account. Check them, or <a href="../forgot-password/?email=' + encodeURIComponent(le.value.trim()) + '">reset your password</a>.</span>';
          alert.hidden = false; lp.value = ''; lp.focus(); return;
        }
        if(!u.verified){
          alert.className = 'notice notice-warn'; alert.innerHTML = RI.icon('mail') + '<span>Confirm your email first. <a href="../verify-email/?email=' + encodeURIComponent(u.email) + '">Open the confirmation step</a>.</span>';
          alert.hidden = false; return;
        }
        if(u.role === 'staff'){ RI.store.set('session', {role:'staff', name:u.email.split('@')[0], email:u.email, type:'Staff', demo:false, at:Date.now()}); RI.toast('Logged in.'); setTimeout(function(){ location.href = '../admin/'; }, 400); return; }
        RI.store.set('session', {role:(u.type === 'builder' || u.type === 'agent') ? 'builder' : 'homeowner', name:u.email.split('@')[0], email:u.email, type:u.type, demo:false, at:Date.now()});
        var nx = RI.store.get('next', ''); RI.store.del('next');
        RI.toast('Logged in.'); setTimeout(function(){ location.href = '../app/' + (nx || ''); }, 400);
      });
    });
  }

  /* ---------- Forgot password ---------- */
  if(page === 'forgot-password'){
    var fe = $('fp-email'); if(P.email) fe.value = P.email; blurEmail(fe);
    $('fp-form').addEventListener('submit', function(e){
      e.preventDefault(); if(!checkEmail(fe)){ fe.focus(); return; }
      var btn = this.querySelector('[type=submit]'); F.busy(btn, true, 'Sending');
      wait(800).then(function(){
        var v = fe.value.trim().toLowerCase(), u = RI.users.get(v);
        $('fp-step1').hidden = true; var s2 = $('fp-step2'); s2.hidden = false;
        s2.innerHTML = RI.fxTop('Password reset', '2 of 3', 'mail') + '<div class="fx-body"><div class="fx-head"><h1>Check your email</h1><p class="muted">If an account uses</p><span class="fx-email">' + RI.icon('mail','i-sm') + RI.esc(v) + '</span><p class="muted">a link to set a new password is on its way. It works for one hour.</p></div>' +
          (u ? '<div class="fx-inbox">' + mailSim('Set a new password', '<p>Someone asked to reset the password for this account. If it was you, set a new one.</p><div><a class="btn btn-primary btn-sm" href="../reset-password/?email=' + encodeURIComponent(v) + '">Set a new password</a></div><p class="xsmall muted">Preview only.</p>') + '</div>'
             : '<div class="notice notice-quiet"><i data-i="info"></i><span>Note: no account with this email exists in this browser, so no email would be sent. The screen looks the same either way, so nobody can test which emails have accounts.</span></div>') +
          '<div class="fx-row"><p class="fx-note">' + RI.icon('info','i-sm') + 'Nothing there? Check spam.</p><button type="button" class="btn btn-secondary btn-sm" id="fp-resend">Send it again</button></div><p class="fx-alt"><a href="../login/">Back to log in</a></p></div>';
        RI.fillIcons(s2);
        RI.fillArt(s2); cooldown($('fp-resend'), 'Send it again', function(){ RI.toast('If an account uses ' + v + ', a new link is on its way.', 'mail'); });
        RI.fillIcons(s2);
      });
    });
  }

  /* ---------- Reset password ---------- */
  if(page === 'reset-password'){
    var r1 = $('rp-pw'), r2 = $('rp-pw2'), re = (P.email || '').toLowerCase();
    if(re) $('rp-for').innerHTML = 'For <b>' + RI.esc(re) + '</b>.';
    $('rp-user').value = re;
    meter(r1, $('rp-pw-meter'));
    function rpRules(){
      $('rp-r-len').classList.toggle('ok', r1.value.length >= 8); $('rp-r-match').classList.toggle('ok', !!r1.value && r1.value === r2.value);
      var st = $('rp-str'), n = +F.strength(r1.value) || 0, lab = !r1.value ? 'A longer phrase is stronger.' : ['Too short', 'Weak', 'Good', 'Strong'][Math.max(0, Math.min(3, n))];
      st.textContent = r1.value ? 'Strength: ' + lab : lab; st.setAttribute('data-s', r1.value ? n : '');
    }
    r1.addEventListener('input', rpRules); r2.addEventListener('input', rpRules);
    $('rp-form').addEventListener('submit', function(e){
      e.preventDefault(); var ok = true;
      if(r1.value.length < 8){ F.setInvalid(r1, r1.value ? 'Use at least 8 characters.' : 'Choose a new password.'); ok = false; } else F.setInvalid(r1, null);
      if(r2.value !== r1.value){ F.setInvalid(r2, 'The two passwords do not match.'); ok = false; } else F.setInvalid(r2, null);
      if(!ok){ doc.querySelector('.field.invalid input').focus(); return; }
      var btn = this.querySelector('[type=submit]'); F.busy(btn, true, 'Saving');
      wait(700).then(function(){
        var u = re && RI.users.get(re); if(u){ u.pw = F.hash(r1.value); u.verified = true; RI.users.put(u); }
        $('rp-step1').hidden = true; var s = $('rp-step2'); s.hidden = false; RI.fillArt(s); s.focus();
      });
    });
  }
})();
