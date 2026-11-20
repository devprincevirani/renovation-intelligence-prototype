/* App screens: My houses, start a house, account settings, builder resources */
(function(){
  var RI = window.RI, A = RI.App, doc = document;

  /* ---------- My houses ---------- */
  var FILTERS = [['all','All'],['draft','Drafts'],['work','In progress'],['ready','Price ready'],['open','Presentation']];
  function groupOf(h){ var s = A.status(h); return s === 'queued' || s === 'reading' || s === 'planning' ? 'work' : s; }
  function card(h, i){
    var s = A.status(h), next = A.next(h), cov = A.cover(h), rs = A.runState(h);
    var body = '';
    if(s === 'ready' || s === 'open'){
      var t = A.totals(h, 'S', {}); var held = A.heldCount(RI.CURRENT);
      body = '<div class="hc-price" data-scale="0,' + (Math.ceil(t.high / 25000) * 25000) + '"><span class="xsmall muted">Standard</span><span class="range-txt">' + RI.range(t.low, t.high) + '</span><div class="rl' + (held.u + held.m ? ' partial' : '') + '" data-low="' + t.low + '" data-high="' + t.high + '"></div>' + (held.u + held.m ? '<span class="xsmall muted">' + (held.u + held.m) + ' not priced yet</span>' : '') + '</div>';
    } else if(s === 'draft'){
      var steps = ['house','photos','measurements','review'], at = Math.max(0, steps.indexOf({remarks:'photos', consent:'review'}[h.step] || h.step || 'house'));
      body = '<div class="hc-prog"><span class="xsmall muted">Step ' + (at + 1) + ' of 4 · ' + A.photoCount(h) + ' photos</span><span class="bar"><i style="width:' + ((at + .5) / 4 * 100) + '%"></i></span></div>';
    } else {
      var pct = rs.status === 'queued' ? 4 : Math.round(((rs.stage || 0) + (rs.stageProgress || 0)) / A.STAGES.length * 100);
      body = '<div class="hc-prog"><span class="xsmall muted">' + A.STAGES[rs.stage || 0][1] + (rs.status === 'reading' ? ', ' + rs.read + ' of ' + rs.photos : '') + '</span><span class="bar work"><i style="width:' + pct + '%"></i></span></div>';
    }
    return '<article class="hcard" style="--i:' + i + '" data-id="' + h.id + '">' +
      '<a class="hc-media" href="' + next[1] + '" tabindex="-1" aria-hidden="true">' + (cov ? '<img src="' + cov + '" alt="" loading="lazy">' : '<span class="hc-draw">' + A.drawing(A.illus(h)) + '</span>') + A.pill(h) + '</a>' +
      '<div class="hc-body">' + (h.client ? '<p class="hc-client">' + RI.icon('user','i-sm') + RI.esc(h.client) + '</p>' : '') +
      '<h2 class="hc-t"><a href="#/houses/' + h.id + '">' + RI.esc(A.addr(h)) + '</a></h2><p class="hc-sub">' + RI.esc(A.place(h)) + '</p>' +
      '<p class="hc-facts">' + (A.factsLine(h) || 'Facts not entered yet') + '</p>' + body +
      '<div class="hc-foot"><span class="xsmall muted">Updated ' + A.ago(h.updated) + '</span><a class="btn btn-sm ' + (s === 'draft' || s === 'ready' || s === 'open' ? 'btn-primary' : 'btn-secondary') + '" href="' + next[1] + '">' + next[0] + '</a></div></div></article>';
  }
  function list(view){
    var pro = A.isPro(), P = (location.hash.split('?')[1] || '');
    var st = {q:'', f:'all', sort:'updated'};
    view.innerHTML = '<div class="app-wrap">' +
      '<header class="app-head"><div><p class="label">' + (pro ? 'Builder account' : 'Your account') + '</p><h1>' + (pro ? 'Client houses' : 'My houses') + '</h1><p class="muted" id="h-count"></p></div>' +
      '<a class="btn btn-primary" href="#/houses/new">' + RI.icon('house','i-sm') + 'Add a house</a></header>' +
      '<div class="toolbar"><label class="search">' + RI.icon('search','i-sm') + '<span class="sr">Search</span><input type="search" id="q" placeholder="Search by address' + (pro ? ' or client' : '') + '" autocomplete="off"></label>' +
      '<div class="chips-f" role="tablist" aria-label="Filter by status" id="filters">' + FILTERS.map(function(f){ return '<button type="button" role="tab" data-f="' + f[0] + '" aria-selected="' + (f[0] === 'all') + '">' + f[1] + ' <span class="n"></span></button>'; }).join('') + '</div>' +
      '<label class="sort"><span class="xsmall muted">Sort</span><select class="select" id="sort"><option value="updated">Recently updated</option><option value="addr">Address</option>' + (pro ? '<option value="client">Client</option>' : '') + '</select></label></div>' +
      '<div class="hgrid" id="hgrid" aria-live="polite">' + [0,1,2].map(function(){ return '<div class="hcard sk"><span class="sk-media"></span><span class="sk-l w60"></span><span class="sk-l w40"></span><span class="sk-l w80"></span></div>'; }).join('') + '</div></div>';
    var grid = view.querySelector('#hgrid');
    function draw(){
      var all = A.mine(), counts = {all:all.length};
      all.forEach(function(h){ var g = groupOf(h); counts[g] = (counts[g] || 0) + 1; });
      view.querySelectorAll('#filters [data-f]').forEach(function(b){ b.querySelector('.n').textContent = counts[b.getAttribute('data-f')] || 0; });
      view.querySelector('#h-count').textContent = all.length ? all.length + (all.length === 1 ? ' house' : ' houses') + ' · ' + (counts.ready || 0) + ' with a price ready' : '';
      if(!all.length){ grid.innerHTML = empty(); grid.classList.add('is-empty'); RI.fillIcons(grid); return; }
      grid.classList.remove('is-empty');
      var q = st.q.trim().toLowerCase();
      var rows = all.filter(function(h){ return (st.f === 'all' || groupOf(h) === st.f) && (!q || (A.addr(h) + ' ' + A.place(h) + ' ' + (h.client || '') + ' ' + (h.title || '')).toLowerCase().indexOf(q) > -1); });
      rows.sort(function(a, b){ return st.sort === 'addr' ? A.addr(a).localeCompare(A.addr(b)) : st.sort === 'client' ? (a.client || '').localeCompare(b.client || '') : b.updated - a.updated; });
      grid.innerHTML = rows.length ? rows.map(card).join('') : '<div class="none-found"><p><b>No houses match.</b></p><p class="muted small">Try another address, or <button type="button" class="linkbtn" id="clear">clear the filters</button>.</p></div>';
      RI.initRanges(grid); RI.fillIcons(grid);
      var c = grid.querySelector('#clear'); if(c) c.addEventListener('click', function(){ st.q = ''; st.f = 'all'; view.querySelector('#q').value = ''; setF('all'); });
    }
    function setF(f){ st.f = f; view.querySelectorAll('#filters [data-f]').forEach(function(b){ b.setAttribute('aria-selected', b.getAttribute('data-f') === f); }); draw(); }
    view.querySelector('#filters').addEventListener('click', function(e){ var b = e.target.closest('[data-f]'); if(b) setF(b.getAttribute('data-f')); });
    view.querySelector('#q').addEventListener('input', function(){ st.q = this.value; draw(); });
    view.querySelector('#sort').addEventListener('change', function(){ st.sort = this.value; draw(); });
    A.later(draw, A.reduce ? 0 : 380);
    /* Houses that are working update by themselves */
    A.every(function(){ if(A.mine().some(function(h){ return groupOf(h) === 'work'; })) draw(); }, 2000);
  }
  function empty(){
    return '<div class="empty"><div class="empty-art">' + RI.Drawing.svg('brick-ranch', false) + '</div><h2>Add your first house</h2><p class="muted">You will need the address, a few facts from the listing, and a photo of each room. It takes about 10 minutes and saves as you go.</p>' +
      '<ul class="ticks empty-list"><li>' + RI.icon('check') + '<span>The price by package is free</span></li><li>' + RI.icon('check') + '<span>Room sizes are optional</span></li><li>' + RI.icon('check') + '<span>Finish on any device</span></li></ul>' +
      '<a class="btn btn-primary" href="#/houses/new">Add your first house</a></div>';
  }
  A.route('/houses', list, {nav:'houses'});

  /* ---------- Start a house ---------- */
  A.route('/houses/new', function(view){
    var pro = A.isPro();
    view.innerHTML = '<div class="app-wrap narrow-wrap">' +
      '<a class="back" href="#/houses">' + RI.icon('arrow','i-sm flip') + (pro ? 'Client houses' : 'My houses') + '</a>' +
      '<div class="start"><div class="start-art">' + RI.Drawing.svg('brick-ranch', false) + '</div>' +
      '<h1>Add a house</h1><p class="lede">Enter it once. We read the photos and work out the price under three goals. You do nothing after you submit.</p>' +
      '<ol class="start-steps"><li><b>Tell us about the home</b><span>Address, size, bedrooms and baths.</span></li><li><b>Rooms and photos</b><span>All your photos at once, sorted into rooms. Sizes optional. Then submit.</span></li></ol>' +
      (pro ? '<div class="field"><label for="client">Client name <span class="opt">(optional)</span></label><input class="input" id="client" autocomplete="off" placeholder="For example, Maria Alvarez"><span class="help">Only you see this. It helps you find the house later.</span></div>' : '') +
      '<div class="cta-row"><button type="button" class="btn btn-primary" id="go">Start ' + RI.icon('arrow','i-sm i-arrow') + '</button><span class="small muted">Saved as a draft as you go.</span></div></div></div>';
    view.querySelector('#go').addEventListener('click', function(){
      var s = A.me(), c = view.querySelector('#client');
      var h = {id:A.uid(), owner:s.email, created:Date.now(), status:'draft', step:'house', facts:{basement:'finished'}, addr:{}, photos:{}, sizes:{}, rights:false, pk:'S', off:{}, shares:[], version:1, client:c && c.value.trim() ? c.value.trim() : undefined};
      A.put(h); RI.track('intake_started'); A.go('#/houses/' + h.id + '/intake/house');
    });
  }, {nav:'houses'});

  /* ---------- Account ---------- */
  A.route('/account', function(view){
    var s = A.me(), u = RI.users.get(s.email) || {}, pro = A.isPro();
    var credits = A.hasCredits(), left = A.creditsLeft();
    var houses = A.mine(), used = houses.filter(function(h){ return h.run; }).length;
    var types = ['homeowner','buyer','seller','builder','agent','other'];
    view.innerHTML = '<div class="app-wrap narrow-wrap"><header class="app-head"><div><p class="label">Settings</p><h1>Account</h1></div></header>' +
      '<div class="acc-grid">' +
      '<section class="acc-card-s"><h2>Profile</h2><form class="form-grid" id="prof" novalidate>' +
        '<div class="field"><label for="ac-email">Email</label><input class="input" id="ac-email" type="email" value="' + RI.esc(s.email) + '" autocomplete="email"><span class="err"></span></div>' +
        '<div class="field"><label for="ac-type">Account type</label><select class="select" id="ac-type">' + types.map(function(t){ return '<option value="' + t + '"' + ((u.type || s.type || '').toLowerCase() === t ? ' selected' : '') + '>' + t[0].toUpperCase() + t.slice(1) + '</option>'; }).join('') + '</select><span class="help">Builder and agent accounts also see task lists and scope documents.</span></div>' +
        '<label class="switch"><input type="checkbox" id="ac-news"' + (u.news ? ' checked' : '') + '><span class="track"></span><span>Send me product updates</span></label>' +
        '<div><button class="btn btn-primary" type="submit">Save changes</button></div></form></section>' +
      '<section class="acc-card-s"><h2>Password</h2><form class="form-grid" id="pw" novalidate>' +
        '<div class="field"><label for="ac-p1">New password</label><div class="pw-wrap"><input class="input" id="ac-p1" type="password" autocomplete="new-password"><button type="button">Show</button></div><span class="err"></span></div>' +
        '<div class="field"><label for="ac-p2">Type it again</label><div class="pw-wrap"><input class="input" id="ac-p2" type="password" autocomplete="new-password"><button type="button">Show</button></div><span class="err"></span></div>' +
        '<div><button class="btn btn-secondary" type="submit">Change password</button></div></form></section>' +
      '<section class="acc-card-s"><h2>Your plan</h2>' +
        (credits ? '<div class="trial"><div class="trial-top"><b>Invite credits</b><span class="st st-ready">' + left + ' of ' + A.CREDITS_START + ' left</span></div><span class="bar"><i style="width:' + ((A.CREDITS_START - left) / A.CREDITS_START * 100) + '%"></i></span><p class="small muted">Each credit opens one full presentation for free. They never expire. After the last one, each house is one payment.</p></div>' : '<p class="small muted">The price by package is free. Each full presentation is one payment.</p>') +
        '<dl class="kv"><div><dt>Houses</dt><dd>' + houses.length + '</dd></div><div><dt>Estimates run</dt><dd>' + used + '</dd></div><div><dt>Free runs left</dt><dd>' + (pro ? 'Builder accounts are not limited in this demo' : Math.max(0, A.freeRuns() - used) + ' of ' + A.freeRuns() + ' <span class="state state-sample">Sample limit</span>') + '</dd></div></dl></section>' +
      '<section class="acc-card-s"><h2>Session</h2><div class="cta-row">' + (RI.devTools ? '<button type="button" class="btn btn-secondary" id="reseed">' + RI.icon('refresh','i-sm') + 'Reset my demo houses</button>' : '') + '<button type="button" class="btn btn-secondary" data-logout>Log out</button></div>' +
        (RI.devTools ? '<div class="cta-row demo-links"><span class="xsmall muted">Team screens:</span><button type="button" class="linkbtn small" id="show-limit">Free-run limit reached</button><a class="textlink small" href="#/demo-error">A screen that fails to load</a></div>' : '') + '</section>' +
      '</div></div>';
    RI.form.pwToggle(view);
    view.querySelector('#prof').addEventListener('submit', function(e){
      e.preventDefault(); var em = view.querySelector('#ac-email');
      if(!RI.form.emailOk(em.value)){ RI.form.setInvalid(em, 'Check the email address, for example name@example.com.'); return; }
      RI.form.setInvalid(em, null);
      var t = view.querySelector('#ac-type').value; s.type = t[0].toUpperCase() + t.slice(1);
      if(!s.demo){ s.role = (t === 'builder' || t === 'agent') ? 'builder' : 'homeowner'; }
      RI.store.set('session', s); if(u.email){ u.type = t; u.news = view.querySelector('#ac-news').checked; RI.users.put(u); }
      RI.toast('Your changes are saved.'); A.render();
    });
    view.querySelector('#pw').addEventListener('submit', function(e){
      e.preventDefault(); var p1 = view.querySelector('#ac-p1'), p2 = view.querySelector('#ac-p2');
      if(p1.value.length < 8){ RI.form.setInvalid(p1, 'Use at least 8 characters.'); return; } RI.form.setInvalid(p1, null);
      if(p1.value !== p2.value){ RI.form.setInvalid(p2, 'The two passwords do not match.'); return; } RI.form.setInvalid(p2, null);
      if(u.email){ u.pw = RI.form.hash(p1.value); RI.users.put(u); }
      p1.value = p2.value = ''; RI.toast('Your password is changed.');
    });
    var sl = view.querySelector('#show-limit'); if(sl) sl.addEventListener('click', function(){ A.limitDialog(); });
    var rs = view.querySelector('#reseed'); if(rs) rs.addEventListener('click', function(){
      A.confirm('Reset your demo houses?', 'Your houses go back to the starting set. Houses you added are removed.', 'Reset', function(){
        A.saveAll(A.all().filter(function(h){ return h.owner !== s.email; })); RI.store.del('seeded.' + s.email); A.seed(); RI.toast('Demo houses reset.'); A.go('#/houses');
      });
    });
  }, {nav:'account'});

  /* ---------- Builder resources ---------- */
  A.route('/resources', function(view){
    if(!A.isPro()){ view.innerHTML = '<div class="app-wrap"><div class="empty"><div class="mark bronze">' + RI.icon('lock') + '</div><h1>For builder and agent accounts</h1><p class="muted">Scope documents and task lists are part of builder and agent accounts. You can change your account type in Account.</p><a class="btn btn-primary" href="#/account">Open account</a></div></div>'; return; }
    view.innerHTML = '<div class="app-wrap"><header class="app-head"><div><p class="label">Builder resources</p><h1>Scope of work documents</h1><p class="muted">Sam\'s scope documents for each trade, to read and to share with subcontractors. <span class="state state-sample">Sample documents</span></p></div></header>' +
      '<div class="docs">' + RI.SCOPE_DOCS.map(function(d, i){
        return '<article class="docc" style="--i:' + i + '"><div class="doc-ic">' + RI.icon('file','i-lg') + '<span>' + d.pages + ' pages</span></div><div class="doc-b"><h2>' + d.t + '</h2><p class="xsmall label">' + d.trade + '</p><p class="small muted">' + d.d + '</p></div>' +
          '<div class="doc-a"><button type="button" class="btn btn-secondary btn-sm" data-read="' + i + '">Read</button><button type="button" class="btn btn-primary btn-sm" data-dl="' + i + '">Download</button></div></article>';
      }).join('') + '</div></div>';
    function html(d){ return '<h1>' + d.t + '</h1><p>' + d.d + '</p>' + d.sec.map(function(s){ return '<h2>' + s[0] + '</h2><p>' + s[1] + '</p>'; }).join('') + '<p><small>Sample document for the design prototype. The real documents come from Sam.</small></p>'; }
    view.addEventListener('click', function(e){
      var r = e.target.closest('[data-read]'), d = e.target.closest('[data-dl]');
      if(r){ var doc1 = RI.SCOPE_DOCS[+r.getAttribute('data-read')]; var dl = A.dialog(doc1.t, '<div class="doc-read">' + html(doc1).replace('<h1>' + doc1.t + '</h1>', '') + '</div><div class="cta-row" style="justify-content:flex-end"><button type="button" class="btn btn-primary" data-dl="' + r.getAttribute('data-read') + '">Download</button></div>', {wide:true}); dl.addEventListener('click', function(ev){ var b = ev.target.closest('[data-dl]'); if(b) download(+b.getAttribute('data-dl')); }); }
      if(d) download(+d.getAttribute('data-dl'));
    });
    function download(i){
      var d1 = RI.SCOPE_DOCS[i], blob = new Blob(['<!doctype html><meta charset="utf-8"><title>' + d1.t + '</title><style>body{font:16px/1.6 Georgia,serif;max-width:680px;margin:40px auto;padding:0 16px;color:#303332}h1,h2{font-family:Arial,sans-serif;color:#203B38}</style>' + html(d1)], {type:'text/html'});
      var a = doc.createElement('a'); a.href = URL.createObjectURL(blob); a.download = d1.t.toLowerCase().replace(/\s+/g, '-') + '.html'; doc.body.appendChild(a); a.click(); a.remove();
      RI.toast('Downloaded ' + d1.t + '.', 'file');
    }
  }, {nav:'resources'});
})();
