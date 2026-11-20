/* Contact page (contacts kept with consent, guide p58) and the staff invite screen (APP_FLOW 5) */
(function(){
  var RI = window.RI, doc = document, F = RI.form, page = doc.documentElement.getAttribute('data-page'), P = F.params();
  function $(id){ return doc.getElementById(id); }
  if(page === 'contact'){
    $('ct-form').addEventListener('submit', function(e){
      e.preventDefault(); var ok = true;
      [['ct-name', function(v){ return v.length > 1; }, 'Enter your name.'], ['ct-email', F.emailOk, 'Check the email address, for example name@example.com.'], ['ct-msg', function(v){ return v.length > 4; }, 'Write a short message.']].forEach(function(r){ var el = $(r[0]), bad = !r[1](el.value.trim()); F.setInvalid(el, bad ? r[2] : null); if(bad && ok){ ok = false; el.focus(); } });
      var c = $('ct-ok'), f = c.closest('.field'); if(!c.checked){ f.classList.add('invalid'); $('ct-ok-err').innerHTML = RI.icon('warn','i-sm') + '<span>We need your OK to keep your details for a reply.</span>'; ok = false; } else f.classList.remove('invalid');
      if(!ok) return;
      var b = this.querySelector('[type=submit]'); F.busy(b, true, 'Sending');
      setTimeout(function(){
        var list = RI.store.get('contacts', []); list.push({name:$('ct-name').value.trim(), email:$('ct-email').value.trim().toLowerCase(), topic:$('ct-topic').value, msg:$('ct-msg').value.trim(), consent:{at:Date.now(), text:'Keep my details so you can reply'}, at:Date.now()}); RI.store.set('contacts', list);
        RI.track('contact_sent'); $('ct-form').hidden = true; var d = $('ct-done'); d.hidden = false; d.focus();
      }, 700);
    });
  }
  if(page === 'invite'){
    var box = $('inv'), t = P.t || '', INV = {'demo-staff':{email:'staff@demo.ri', by:'Sam', perms:[['eye','See every house','Its photos, runs and decision tree'],['grade','Grade decisions','Mark each node right or wrong, with a note'],['list','Read the rulebook','Rules, condition sheets, room templates, products and rates'],['clock','Run back-tests','Replay houses and read the report'],['console','Read the audit log','Who changed what, when and why']]}};
    var inv = INV[t], used = RI.store.get('invite.' + t + '.used');
    if(!inv || P.state === 'expired'){
      box.closest('.acc-center').classList.add('fx-wrap'); box.classList.add('fx-card');
      box.innerHTML = '<div class="fx-in">' + RI.fxTop('Staff invite', '', 'ticket', {warn:true, stamp:'Expired'}) + '<div class="fx-body"><div class="fx-head"><h1>This invite has expired</h1><p class="muted">For your safety, invite links work once and only for 7 days. Ask Sam to send you a new one from the console.</p></div>' +
        '<ol class="fx-life" aria-label="What happened to this invite"><li class="ok"><span></span><b>Sam sent the invite</b><em>The link was emailed to you</em></li><li class="bad"><span></span><b>The link expired</b><em>7 days after it was sent</em></li><li class="todo"><span></span><b>Get a new link</b><em>Sam sends it from the console</em></li></ol>' +
        '<a class="btn btn-primary btn-block btn-lg" href="../contact/">Contact us ' + RI.icon('arrow','i-sm i-arrow') + '</a><p class="fx-alt"><a href="../">Back to the site</a></p></div></div>'; RI.fillIcons(box); RI.fillArt(box); return;
    }
    if(used){
      box.closest('.acc-center').classList.add('fx-wrap'); box.classList.add('fx-card');
      box.innerHTML = '<div class="fx-in">' + RI.fxTop('Staff invite', '', 'ticket', {stamp:'Used'}) + '<div class="fx-body"><div class="fx-head"><h1>This invite was already used</h1><p class="muted">The account for</p><span class="fx-email">' + RI.icon('mail','i-sm') + RI.esc(inv.email) + '</span><p class="muted">is set up. Log in to open the console.</p></div><a class="btn btn-primary btn-block btn-lg" href="../login/?email=' + encodeURIComponent(inv.email) + '">Log in ' + RI.icon('arrow','i-sm i-arrow') + '</a><a class="fx-demo" href="?t=demo-staff&reset=1" id="inv-reset">Demo: reset this invite</a></div></div>'; RI.fillIcons(box); RI.fillArt(box);
      $('inv-reset').addEventListener('click', function(e){ e.preventDefault(); RI.store.del('invite.' + t + '.used'); location.href = '?t=' + t; }); return;
    }
    /* The invite as a ticket from Sam, what the role can and cannot do, then a short form */
    var exp = new Date(Date.now() + 6 * 86400000).toLocaleDateString('en-US', {month:'long', day:'numeric'});
    var PI = {eye:'eye', grade:'check', edit:'sliders'};
    box.closest('.acc-center').classList.add('inv-page');
    box.innerHTML =
      '<div class="inv-side">' +
        '<div class="inv-ticket">' +
          '<div class="it-top"><span class="it-av" aria-hidden="true">' + inv.by.charAt(0) + '</span><div><p class="it-k">Staff invite</p><p class="it-from"><b>' + inv.by + '</b> invited you to the console</p></div></div>' +
          '<h1>Join Sam\'s console</h1>' +
          '<div class="it-cut" aria-hidden="true"></div>' +
          '<dl class="it-meta"><div><dt>For</dt><dd>' + RI.esc(inv.email) + '</dd></div><div><dt>Role</dt><dd><span class="it-role">Staff</span></dd></div><div><dt>Valid until</dt><dd>' + exp + '</dd></div></dl>' +
        '</div>' +
        '<div class="inv-perms2"><h2>What you can do</h2><ul>' + inv.perms.map(function(x){ return '<li><span class="ip-ic">' + RI.icon(PI[x[0]]) + '</span><span><b>' + x[1] + '</b><span>' + x[2] + '</span></span></li>'; }).join('') +
          '<li class="no"><span class="ip-ic">' + RI.icon('lock') + '</span><span><b>Publishing stays with Sam</b><span>Your edits wait in his queue until he publishes them.</span></span></li></ul>' +
          '<p class="xsmall muted">Sample permissions. Sam chooses them for each person.</p></div>' +
      '</div>' +
      '<div class="inv-form-card"><div class="ifc-head"><p class="label">Accept the invite</p><h2>Set up your account</h2><p class="small muted">Your name and a password. That is all.</p></div>' +
      '<form class="form-grid" id="inv-form" novalidate>' +
        '<input class="sr" id="iv-email" type="email" autocomplete="username" value="' + inv.email + '" readonly tabindex="-1" aria-hidden="true">' +
        '<div class="field"><label for="iv-name">Your name</label><input class="input" id="iv-name" autocomplete="name" placeholder="As your team knows you"><span class="err"></span></div>' +
        '<div class="field"><label for="iv-pw">Password</label><div class="pw-wrap"><input class="input" id="iv-pw" type="password" autocomplete="new-password"><button type="button">Show</button></div><div class="meter" id="iv-meter" aria-hidden="true"><i></i><i></i><i></i></div><span class="err"></span></div>' +
        '<div class="field"><label for="iv-pw2">Type it again</label><div class="pw-wrap"><input class="input" id="iv-pw2" type="password" autocomplete="new-password"><button type="button">Show</button></div><span class="err"></span></div>' +
        '<ul class="pw-rules" aria-live="polite"><li id="r-len">' + RI.icon('check','i-sm') + 'At least 8 characters</li><li id="r-match">' + RI.icon('check','i-sm') + 'Both passwords match</li></ul>' +
        '<button class="btn btn-primary btn-block" type="submit">Accept and open the console ' + RI.icon('arrow','i-sm i-arrow') + '</button>' +
        '<p class="xsmall muted ifc-note">' + RI.icon('shield','i-sm') + 'Your email is confirmed by the invite. No extra email step.</p>' +
      '</form></div>';
    RI.fillIcons(box); F.pwToggle(box);
    function rules(){ var a1 = $('iv-pw').value, a2 = $('iv-pw2').value; $('r-len').classList.toggle('ok', a1.length >= 8); $('r-match').classList.toggle('ok', !!a1 && a1 === a2); }
    $('iv-pw').addEventListener('input', function(){ $('iv-meter').setAttribute('data-s', F.strength(this.value)); rules(); });
    $('iv-pw2').addEventListener('input', rules);
    $('inv-form').addEventListener('submit', function(e){
      e.preventDefault(); var ok = true, n = $('iv-name'), p1 = $('iv-pw'), p2 = $('iv-pw2');
      F.setInvalid(n, n.value.trim().length > 1 ? null : 'Enter your name.'); if(n.value.trim().length < 2) ok = false;
      F.setInvalid(p1, p1.value.length >= 8 ? null : 'Use at least 8 characters.'); if(p1.value.length < 8) ok = false;
      F.setInvalid(p2, p2.value === p1.value ? null : 'The two passwords do not match.'); if(p2.value !== p1.value) ok = false;
      if(!ok){ doc.querySelector('.field.invalid input').focus(); return; }
      var b = this.querySelector('[type=submit]'); F.busy(b, true, 'Setting up');
      setTimeout(function(){
        RI.users.put({email:inv.email, pw:F.hash(p1.value), type:'Staff', role:'staff', verified:true, at:Date.now()});
        RI.store.set('invite.' + t + '.used', Date.now());
        RI.store.set('session', {role:'staff', name:n.value.trim(), email:inv.email, type:'Staff', demo:false, at:Date.now()});
        location.href = '../admin/';
      }, 800);
    });
  }
})();
