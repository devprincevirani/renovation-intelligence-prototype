/* Renovation Intelligence console: core.
   For Sam and his staff (APP_FLOW 7, PDF section 60). A training console, not an approval desk:
   nothing here holds back a house. Every edit is a draft, it waits in the publish queue, and only
   Sam publishes (SECURITY 3.2). Staff see only the screens their permissions allow.
   Everything is simulated in this browser; the real build does it in the API. */
(function(){
  var RI = window.RI, A = RI.App, doc = document;
  var C = RI.Con = {};
  C.reduce = A.reduce;

  /* ---------- Storage ---------- */
  C.get = function(k, d){ return RI.store.get('con.' + k, d); };
  C.set = function(k, v){ RI.store.set('con.' + k, v); return v; };
  C.uid = function(p){ return (p || 'c') + Math.random().toString(36).slice(2, 8); };

  /* ---------- Who is here, and what they may do (SECURITY 3.2, PDF section 60) ---------- */
  /* Permissions as SECURITY.md 3.2 names them. Publishing, discarding and managing staff are super admin only,
     so they are not in this list. A new staff member starts with none; Sam ticks what each person needs (3.3) */
  C.PERMS = [
    ['houses.view', 'See every house: list, inspector, decision tree, ledger, check results. Read only'],
    ['houses.grade', 'Grade a node of the decision tree'],
    ['rulebook.view', 'Read rules, condition sheets, thresholds, room templates, packages, the catalog, products, rates and guidance'],
    ['rulebook.edit', 'Edit drafts of rules, condition sheets, thresholds, room templates, packages and the catalog'],
    ['pricing.edit', 'Edit drafts of products and rates'],
    ['content.edit', 'Edit drafts of guidance text; upload and manage builder documents'],
    ['accuracy.manage', 'Label photos for the accuracy set and see the scores'],
    ['backtests.run', 'Start a back-test and read its report'],
    ['users.view', 'See users, account types and the waitlist'],
    ['contacts.export', 'Read feedback; export contacts and the updates list'],
    ['funnel.view', 'See the funnel'],
    ['audit.view', 'Read the audit log']
  ];
  C.SUPER = ['publish', 'staff'];
  /* An edit permission includes reading the same area (3.3) */
  C.IMPLIES = {'rulebook.edit':['rulebook.view'], 'pricing.edit':['rulebook.view'], 'content.edit':['rulebook.view'], 'houses.grade':['houses.view']};
  /* The sample staff member Sam invited, and what "Preview as staff" shows */
  C.SAMPLE_STAFF = ['houses.view', 'houses.grade', 'rulebook.view', 'backtests.run', 'audit.view'];
  var OLD = {grade:'houses.grade', backtest:'backtests.run', 'drafts.reasoning':'rulebook.edit', 'drafts.pricing':'pricing.edit', 'drafts.texts':'content.edit', 'feedback.view':'contacts.export'};
  C.migratePerms = function(list){ var out = []; (list || []).forEach(function(p){ p = OLD[p] || p; if(C.SUPER.indexOf(p) < 0 && out.indexOf(p) < 0 && C.PERMS.some(function(q){ return q[0] === p; })) out.push(p); }); return out; };
  C.me = function(){
    var s = RI.session(); if(!s || (s.role !== 'admin' && s.role !== 'staff')) return s ? {outsider:true, s:s} : null;
    var preview = s.role === 'admin' && C.get('preview') === 'staff';
    var sam = s.role === 'admin' && !preview;
    var rec = (C.get('staff', []) || []).filter(function(x){ return x.email === s.email; })[0];
    var perms = sam ? C.PERMS.map(function(p){ return p[0]; }) : preview ? C.SAMPLE_STAFF : C.migratePerms(rec && rec.perms);
    return {s:s, sam:sam, preview:preview, name:preview ? 'Staff preview' : (s.role === 'admin' ? 'Sam' : (rec && rec.name) || s.name), email:s.email, role:sam ? 'Super admin' : 'Staff', perms:perms};
  };
  C.can = function(p){
    var m = C.me(); if(!m || m.outsider) return false;
    if(Array.isArray(p)) return p.some(C.can);
    if(m.sam) return true; if(C.SUPER.indexOf(p) > -1) return false;
    return m.perms.indexOf(p) > -1 || m.perms.some(function(q){ return (C.IMPLIES[q] || []).indexOf(p) > -1; });
  };

  /* ---------- Audit log: every change, who, when and why (SECURITY 15) ---------- */
  C.log = function(action, what, why, area){
    var m = C.me() || {}, list = C.get('audit', []);
    list.unshift({id:C.uid('a'), at:Date.now(), by:m.name || 'System', role:m.role || '', action:action, what:what, why:why || '', area:area || ''});
    C.set('audit', list.slice(0, 400));
  };

  /* ---------- Drafts and the publish queue ----------
     An edit is a draft. It waits in the queue, may carry a back-test result, and only Sam publishes.
     The old version is kept. A grade never changes a released result. */
  C.APPLY = {};
  C.drafts = function(){ return C.get('drafts', []); };
  /* Staff see the drafts of their own area; Sam sees all (SECURITY 3.3) */
  C.AREA_PERM = {products:'pricing.edit', rates:'pricing.edit', guidance:'content.edit', resources:'content.edit'};
  C.mine = function(d){ return C.can('publish') || C.can(C.AREA_PERM[d.area] || 'rulebook.edit'); };
  C.queued = function(){ return C.drafts().filter(function(d){ return d.status === 'queued'; }); };
  C.draftFor = function(area, ref){ return C.queued().filter(function(d){ return d.area === area && d.ref === ref; })[0] || null; };
  C.addDraft = function(o){
    var m = C.me(), list = C.drafts(), old = C.draftFor(o.area, o.ref);
    if(old){ list = list.map(function(d){ return d.id === old.id ? Object.assign(d, {status:'replaced'}) : d; }); }
    var d = Object.assign({id:C.uid('d'), status:'queued', at:Date.now(), by:m.name, bt:null}, o);
    list.unshift(d); C.set('drafts', list);
    C.log('Draft saved', o.title, o.why, o.area);
    return d;
  };
  C.setDraft = function(id, patch){ C.set('drafts', C.drafts().map(function(d){ return d.id === id ? Object.assign(d, patch) : d; })); };
  C.publish = function(id, note){
    var d = C.drafts().filter(function(x){ return x.id === id; })[0]; if(!d) return;
    if(C.APPLY[d.area]) C.APPLY[d.area](d);
    C.setDraft(id, {status:'published', doneAt:Date.now(), doneBy:C.me().name, note:note || ''});
    C.log('Published', d.title, note, d.area);
  };
  C.discard = function(id, note){
    var d = C.drafts().filter(function(x){ return x.id === id; })[0]; if(!d) return;
    C.setDraft(id, {status:'discarded', doneAt:Date.now(), doneBy:C.me().name, note:note || ''});
    C.log('Discarded', d.title, note, d.area);
  };

  /* ---------- Seeds: each module adds its own; they run once per browser ---------- */
  C.SEEDS = [];
  C.SEED_VERSION = 6;
  C.seed = function(){
    /* Every demo user's houses, so the console has the whole picture */
    var real = RI.session();
    [{role:'homeowner', name:'Jordan Lee', email:'homeowner@demo.ri', type:'Homeowner'}, {role:'builder', name:'Avery Brooks', email:'builder@demo.ri', type:'Builder'}].forEach(function(u){
      if(RI.store.get('seeded.' + u.email)) return;
      RI.store.set('session', Object.assign({demo:true, at:Date.now()}, u)); A.seed();
    });
    if(real) RI.store.set('session', real); else RI.store.del('session');
    if(C.get('seeded') === C.SEED_VERSION) return;
    /* Seeds only fill what is missing, so a new screen never wipes earlier changes */
    var realSet = C.set; C.set = function(k, v){ if(C.get(k) == null) realSet(k, v); return v; };
    try { C.SEEDS.forEach(function(fn){ fn(); }); } finally { C.set = realSet; }
    C.set('seeded', C.SEED_VERSION);
  };

  /* ---------- Small helpers ---------- */
  C.esc = RI.esc;
  C.ago = function(t){ return A.ago(t); };
  C.date = function(t){ return new Date(t).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'}); };
  C.time = function(t){ return new Date(t).toLocaleString('en-US', {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'}); };
  C.initials = function(n){ return (n || '?').split(/[\s@.()]+/).filter(Boolean).slice(0, 2).map(function(x){ return x[0].toUpperCase(); }).join(''); };
  C.av = function(n, cls){ return '<span class="c-av ' + (cls || '') + '" aria-hidden="true">' + C.initials(n) + '</span>'; };
  C.money = RI.money;
  C.range = function(lo, hi){ return '<span class="num">' + RI.money(lo) + '<span class="to">to</span>' + RI.money(hi) + '</span>'; };
  /* Draft, queued and published are always labeled (DESIGN 8.6) */
  C.lbl = function(state, extra){
    var map = {draft:['Draft','lb-draft'], queued:['Queued','lb-queued'], published:['Published','lb-pub'], discarded:['Discarded','lb-off'], replaced:['Replaced','lb-off'], sample:['Sample','lb-sample']};
    var x = map[state] || [state, 'lb-off'];
    return '<span class="lb ' + x[1] + '">' + x[0] + (extra ? ' ' + extra : '') + '</span>';
  };
  C.chip = function(t, cls){ return '<span class="c-chip ' + (cls || '') + '">' + t + '</span>'; };
  C.dialog = A.dialog; C.confirm = A.confirm; C.toast = RI.toast;
  /* The bar that appears once something has changed: undo, or save as a draft */
  C.saveBar = function(pfx){ return '<div class="c-savebar" role="region" aria-label="Unsaved changes"><span>' + RI.icon('info','i-sm') + '<b>Unsaved changes.</b> Saving makes a draft; it goes live when Sam publishes it.</span><button type="button" class="btn btn-secondary btn-sm" id="' + pfx + '-undo">Undo</button><button type="button" class="btn btn-primary btn-sm" id="' + pfx + '-save">Save as draft</button></div>'; };
  /* Saving a draft asks why, in a sentence. The reason travels with the draft and into the audit log */
  C.askWhy = function(title, summary, cb){
    var d = C.dialog('Save as a draft', '<form id="why-f" class="form-grid" novalidate><div class="why-what"><p class="c-kicker">The change</p><p><b>' + RI.esc(title) + '</b>' + (summary ? '<br><span class="small muted">' + RI.esc(summary) + '</span>' : '') + '</p></div>' +
      '<div class="field"><label for="why-t">Why this change? <span class="opt">(helps Sam decide)</span></label><textarea class="input" id="why-t" rows="3" placeholder="For example: too many dark photos passed the threshold"></textarea></div>' +
      '<p class="c-note">' + RI.icon('info','i-sm') + '<span>A draft changes nothing yet. It waits in the publish queue until Sam publishes it.</span></p>' +
      '<div class="cta-row" style="justify-content:flex-end"><button type="button" class="btn btn-secondary" data-dlg-close>Cancel</button><button type="submit" class="btn btn-primary">Save draft</button></div></form>');
    RI.fillIcons(d); setTimeout(function(){ d.querySelector('#why-t').focus(); }, 30);
    d.querySelector('#why-f').addEventListener('submit', function(e){ e.preventDefault(); var w = d.querySelector('#why-t').value.trim(); d.close(); cb(w); });
  };

  /* A page: header with title, short line and actions, then the body */
  C.page = function(o){
    return '<div class="c-page">' + (o.back ? '<a class="c-back" href="' + o.back[0] + '">' + RI.icon('arrow','i-sm flip') + o.back[1] + '</a>' : '') +
      '<header class="c-head"><div class="c-head-t">' + (o.kicker ? '<p class="c-kicker">' + o.kicker + '</p>' : '') + '<h1>' + o.title + '</h1>' + (o.sub ? '<p class="c-sub">' + o.sub + '</p>' : '') + '</div>' +
      (o.actions ? '<div class="c-actions">' + o.actions + '</div>' : '') + '</header>' + (o.body || '') + '</div>';
  };
  /* A real table on wide screens; the same rows become stacked cards on a phone (data-label) */
  C.table = function(o){
    if(!o.rows.length) return '<div class="c-empty">' + RI.icon('info') + '<p>' + (o.empty || 'Nothing here yet.') + '</p></div>';
    return '<div class="c-tbl-wrap"><table class="c-tbl' + (o.cls ? ' ' + o.cls : '') + '"><thead><tr>' + o.cols.map(function(c){ return '<th scope="col"' + (c.num ? ' class="num"' : '') + (c.w ? ' style="width:' + c.w + '"' : '') + '>' + c.label + '</th>'; }).join('') + '</tr></thead><tbody>' +
      o.rows.map(function(r){ return '<tr' + (r.attr ? ' ' + r.attr : '') + '>' + r.cells.map(function(cell, i){ var c = o.cols[i]; return '<td data-label="' + RI.esc(c.label) + '"' + (c.num ? ' class="num"' : c.cls ? ' class="' + c.cls + '"' : '') + '>' + cell + '</td>'; }).join('') + '</tr>'; }).join('') +
      '</tbody></table></div>';
  };
  /* Numbered pages (BACKLOG M1-23: lists are paginated). First, last, the pages around the current one, gaps as an ellipsis.
     o: {page (0-based), per, total, noun, perOpts:[...]} ; buttons carry data-pg (absolute page), the select data-per */
  C.pager = function(o){
    var pages = Math.max(1, Math.ceil(o.total / o.per)), p = Math.min(o.page, pages - 1), i, nums = [];
    var from = o.total ? p * o.per + 1 : 0, to = Math.min(o.total, p * o.per + o.per);
    if(pages <= 7){ for(i = 0; i < pages; i++) nums.push(i); }
    else {
      var s = Math.max(1, p - 1), e = Math.min(pages - 2, p + 1);
      if(p <= 3){ s = 1; e = 4; } if(p >= pages - 4){ s = pages - 5; e = pages - 2; }
      nums.push(0); if(s > 1) nums.push(null); for(i = s; i <= e; i++) nums.push(i); if(e < pages - 2) nums.push(null); nums.push(pages - 1);
    }
    var arr = function(to, dir, label){ return '<button type="button" class="pg-n pg-arr pg-' + dir + '" data-pg="' + to + '" aria-label="' + label + '"' + (to < 0 || to >= pages ? ' disabled' : '') + '>' + RI.icon('chev','i-sm') + '<span class="pg-arr-t">' + (dir === 'prev' ? 'Previous' : 'Next') + '</span></button>'; };
    return '<nav class="c-pager" aria-label="Pages">' +
      '<p class="pg-count">' + (o.total ? '<b>' + from + ' to ' + to + '</b> of ' + o.total + (o.noun ? ' ' + o.noun : '') : 'Nothing to show') + '</p>' +
      (pages > 1 ? '<div class="pg-nums">' + arr(p - 1, 'prev', 'Previous page') +
        nums.map(function(n){ return n === null ? '<span class="pg-gap" aria-hidden="true">…</span>' : '<button type="button" class="pg-n pg-num" data-pg="' + n + '" aria-label="Page ' + (n + 1) + '"' + (n === p ? ' aria-current="page"' : '') + '>' + (n + 1) + '</button>'; }).join('') +
        '<span class="pg-mob" aria-hidden="true">Page <b>' + (p + 1) + '</b> of ' + pages + '</span>' +
        arr(p + 1, 'next', 'Next page') + '</div>' : '') +
      (o.perOpts ? '<label class="pg-per"><span>Rows per page</span><span class="c-select sm"><select data-per>' + o.perOpts.map(function(n){ return '<option value="' + n + '"' + (n === o.per ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></span></label>' : '') +
      '</nav>';
  };
  C.seg = function(id, opts, cur){ return '<div class="c-seg" id="' + id + '" role="tablist">' + opts.map(function(o){ return '<button type="button" role="tab" data-v="' + o[0] + '" aria-selected="' + (o[0] === cur) + '">' + o[1] + (o[2] != null ? '<span class="n">' + o[2] + '</span>' : '') + '</button>'; }).join('') + '</div>'; };
  C.search = function(id, ph, v){ return '<label class="c-search">' + RI.icon('search','i-sm') + '<input type="search" id="' + id + '" placeholder="' + ph + '" value="' + RI.esc(v || '') + '" autocomplete="off"></label>'; };
  C.note = function(text, icon){ return '<p class="c-note">' + RI.icon(icon || 'info','i-sm') + '<span>' + text + '</span></p>'; };
  C.denied = function(what){
    return C.page({title:'You do not have access to this screen', sub:'Sam sets what each staff member can open. ' + (what ? 'This screen needs the permission: ' + what + '.' : ''),
      body:'<div class="c-empty big">' + RI.icon('lock') + '<p>Ask Sam if you need it.</p><a class="btn btn-secondary" href="#/houses">Go to the house list</a></div>'});
  };
  /* A save that becomes a draft: the same bar on every editor */
  C.draftBar = function(area, ref){
    var d = C.draftFor(area, ref);
    return d ? '<div class="c-draftbar">' + C.lbl('queued') + '<span>A draft of this is waiting in the publish queue: <b>' + RI.esc(d.title) + '</b>, by ' + RI.esc(d.by) + ', ' + C.ago(d.at) + '.</span><a href="#/publish">Open the queue</a></div>' : '';
  };

  /* ---------- Router ---------- */
  C.routes = [];
  C.route = function(pattern, fn, opts){ C.routes.push({re:new RegExp('^' + pattern.replace(/:(\w+)/g, '([^/]+)') + '$'), keys:(pattern.match(/:(\w+)/g) || []).map(function(k){ return k.slice(1); }), fn:fn, opts:opts || {}}); };
  C.go = function(hash){ if(location.hash === hash) C.render(); else location.hash = hash; };
  C.query = function(){ var q = (location.hash.split('?')[1] || ''), o = {}; q.split('&').forEach(function(p){ if(!p) return; var kv = p.split('='); o[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || ''); }); return o; };
  var timers = [];
  C.later = function(fn, ms){ var t = setTimeout(fn, ms); timers.push(t); return t; };
  C.every = function(fn, ms){ var t = setInterval(fn, ms); timers.push(t); return t; };
  var lastHash = null, leaving = false;
  C.render = function(){
    var screenOf = function(h){ return (h || '').split('?')[0]; };
    if(lastHash != null && !leaving && screenOf(lastHash) !== screenOf(location.hash) && C.dirty()){
      var want = location.hash; history.replaceState(null, '', lastHash);
      var d = C.dialog('Leave without saving?', '<p>You have changes on this screen that are not saved as a draft yet. If you leave, they are lost.</p><div class="cta-row" style="justify-content:flex-end"><button type="button" class="btn btn-secondary" data-dlg-close>Stay here</button><button type="button" class="btn btn-danger" id="lv-go">Leave and lose them</button></div>');
      d.querySelector('#lv-go').addEventListener('click', function(){ leaving = true; d.close(); location.hash = want; });
      return;
    }
    leaving = false; lastHash = location.hash;
    timers.forEach(function(t){ clearTimeout(t); clearInterval(t); }); timers = [];
    var view = doc.getElementById('view'), m = C.me();
    var path = (location.hash || '#/overview').slice(1).split('?')[0]; if(path === '/' || path === '') path = '/overview';
    var match = null, params = {};
    C.routes.some(function(r){ var x = path.match(r.re); if(x){ match = r; r.keys.forEach(function(k, i){ params[k] = decodeURIComponent(x[i + 1]); }); return true; } });
    closeMenu();
    if(!m){ shell(null, true); view.innerHTML = gate(); RI.fillIcons(view); return; }
    if(m.outsider){ shell(null, true); view.innerHTML = outsider(m.s); RI.fillIcons(view); return; }
    shell(match ? match.opts.nav : null);
    view.classList.remove('enter'); void view.offsetWidth; view.classList.add('enter');
    window.scrollTo(0, 0);
    if(!match){ view.innerHTML = C.page({title:'That screen does not exist', body:'<div class="c-empty big">' + RI.icon('info') + '<a class="btn btn-secondary" href="#/houses">Go to the house list</a></div>'}); RI.fillIcons(view); return; }
    if(match.opts.perm && !C.can(match.opts.perm)){ view.innerHTML = C.denied(permName(match.opts.perm)); RI.fillIcons(view); return; }
    /* One error boundary per screen */
    try { match.fn(view, params); }
    catch(err){ if(window.console) console.error(err); view.innerHTML = C.page({title:'This screen did not load', sub:'Nothing was changed. Try again.', body:'<button type="button" class="btn btn-secondary" onclick="location.reload()">Try again</button>'}); }
    RI.fillIcons(view);
    var h1 = view.querySelector('h1'); if(h1){ h1.setAttribute('tabindex', '-1'); if(C._nav) h1.focus({preventScroll:true}); }
    C._nav = true;
    var ht = h1 && h1.cloneNode(true); if(ht) ht.querySelectorAll('.h-aside').forEach(function(x){ x.remove(); });
    doc.title = (ht ? ht.textContent.trim() + ' | ' : '') + 'Console | Renovation Intelligence';
  };
  function permName(p){ if(Array.isArray(p)) return p.map(permName).join(', or '); var x = C.PERMS.filter(function(q){ return q[0] === p; })[0]; return x ? p + ' (' + x[1].charAt(0).toLowerCase() + x[1].slice(1) + ')' : p; }
  function gate(){
    return '<div class="c-gate"><div class="c-gate-card"><span class="c-gate-ic">' + RI.icon('lock') + '</span><h1>The console is for Sam and his staff</h1><p class="muted">Log in with your staff account to continue.</p><div class="cta-row" style="justify-content:center"><a class="btn btn-primary" href="' + RI.url('login/') + '">Log in</a></div></div></div>';
  }
  function outsider(s){
    return '<div class="c-gate"><div class="c-gate-card"><span class="c-gate-ic">' + RI.icon('lock') + '</span><h1>This area is for staff</h1><p class="muted">You are logged in as ' + RI.esc(s.name || s.email) + '. The console is only for Sam and his staff.</p><div class="cta-row" style="justify-content:center"><a class="btn btn-primary" href="' + RI.url('app/') + '">Open my houses</a></div></div></div>';
  }

  /* Pages menu targets: the first priced house's inspector or decision tree */
  C.route('/go/:what', function(view, p){
    var h = A.all().filter(function(x){ var s = A.status(x); return s === 'ready' || s === 'open'; })[0];
    if(!h){ location.replace('#/houses'); return; }
    location.replace('#/houses/' + h.id + (p.what === 'tree' ? '/tree' : ''));
  });

  /* The top bar names where you are: the section links back to its list, then the item you opened */
  /* Where you are. Desktop: one line, Group / Screen / Item. Phone: the parent as a small back link over the current name */
  C.crumbs = function(parts){
    parts = parts.filter(Boolean); var cur = parts[parts.length - 1], par = parts[parts.length - 2];
    var one = function(p){ return p[1] ? '<a href="' + p[1] + '">' + p[0] + '</a>' : '<span>' + p[0] + '</span>'; };
    return '<ol class="ct-crumbs">' + parts.map(function(p, i){ return '<li>' + (i === parts.length - 1 ? '<b aria-current="page">' + p[0] + '</b>' : one(p)) + '</li>'; }).join('') + '</ol>' +
      '<span class="ct-mob">' + (par ? (par[1] ? '<a href="' + par[1] + '">' + RI.icon('chev','i-sm ct-back') + par[0] + '</a>' : '<small>' + par[0] + '</small>') : '') + '<b>' + cur[0] + '</b></span>';
  };
  C.crumb = function(name, href, extra){
    var w = doc.querySelector('.ct-where'); if(!w) return '';
    var g = w.getAttribute('data-group'), list = w.getAttribute('data-list'), sect = w.getAttribute('data-name');
    w.innerHTML = C.crumbs([g ? [g] : null, [sect, list]].concat(href ? [[RI.esc(name), href], [extra]] : [[RI.esc(name)]]));
    RI.fillIcons(w);
    return '';
  };

  /* ---------- Screens and the side menu ---------- */
  C.SCREENS = [
    ['', [['overview', 'Overview', '#/overview', 'console', 'houses.view']]],
    ['Houses', [['houses', 'Houses', '#/houses', 'house', 'houses.view']]],
    ['Quality', [['checks', 'Check results', '#/checks', 'shield', 'houses.view'], ['accuracy', 'Photo accuracy', '#/accuracy', 'eye', 'accuracy.manage']]],
    ['Rulebook', [['rules', 'Rules and families', '#/rules', 'list', 'rulebook.view'], ['sheets', 'Condition sheets', '#/condition-sheets', 'sliders', 'rulebook.view'], ['templates', 'Room templates', '#/room-templates', 'ruler', 'rulebook.view'], ['packages', 'Packages and catalog', '#/packages', 'tag', 'rulebook.view']]],
    ['Pricing', [['products', 'Products', '#/products', 'tag', 'rulebook.view'], ['rates', 'Rates', '#/rates', 'file', 'rulebook.view']]],
    ['Content', [['guidance', 'Guidance', '#/guidance', 'info', 'rulebook.view'], ['resources', 'Builder documents', '#/resources', 'file', 'content.edit']]],
    ['Changes', [['publish', 'Publish queue', '#/publish', 'refresh', ['rulebook.edit', 'pricing.edit', 'content.edit']], ['backtests', 'Back-tests', '#/backtests', 'clock', 'backtests.run']]],
    ['Customers', [['feedback', 'Contacts and feedback', '#/feedback', 'mail', 'contacts.export'], ['funnel', 'Funnel', '#/funnel', 'sliders', 'funnel.view']]],
    ['Admin', [['users', 'Users and staff', '#/users', 'user', 'users.view'], ['audit', 'Audit log', '#/audit', 'console', 'audit.view']]]
  ];
  function shell(active, bare){
    var side = doc.getElementById('con-side'), top = doc.getElementById('con-top'), m = C.me();
    var q = C.queued().filter(C.mine).length, seeQ = C.can(['rulebook.edit', 'pricing.edit', 'content.edit']);
    if(bare){ side.innerHTML = ''; side.hidden = true; top.innerHTML = '<div class="ct-in"><a class="c-brand" href="' + RI.url('') + '">' + RI.LOGO + '<span><b>Renovation Intelligence</b><small>Console</small></span></a></div>'; return; }
    side.hidden = false;
    var groupOf = '', nameOf = '', listOf = '#/houses';
    side.innerHTML = '<div class="cs-in"><a class="c-brand" href="#/overview" aria-label="Console home, the overview">' + RI.LOGO + '<span><b>Renovation Intelligence</b><small>Console</small></span></a>' +
      '<nav class="cs-nav" aria-label="Console">' + C.SCREENS.map(function(g){
        var items = g[1].filter(function(it){ return C.can(it[4]); }); if(!items.length) return '';
        return '<div class="cs-g">' + (g[0] ? '<p class="cs-gt">' + g[0] + '</p>' : '') + items.map(function(it){
          var on = it[0] === active; if(on){ groupOf = g[0]; nameOf = it[1]; listOf = it[2]; }
          return '<a href="' + it[2] + '"' + (on ? ' aria-current="page"' : '') + '>' + RI.icon(it[3],'i-sm') + '<span>' + it[1] + '</span>' + (it[0] === 'publish' && q ? '<em class="cs-badge">' + q + '</em>' : '') + '</a>';
        }).join('') + '</div>';
      }).join('') + '</nav>' +
      '<div class="cs-me"><button type="button" class="cs-me-btn" id="cs-me" aria-haspopup="true" aria-expanded="false">' + C.av(m.name, m.sam ? 'sam' : '') + '<span><b>' + RI.esc(m.name) + '</b><small>' + m.role + (m.preview ? ', preview' : '') + '</small></span>' + RI.icon('chev','i-sm') + '</button>' +
        '<div class="cs-menu" id="cs-menu" hidden><p class="xsmall muted">' + RI.esc(m.email) + '</p>' +
        (m.s.role === 'admin' ? '<button type="button" id="cs-preview">' + (m.preview ? 'Back to Sam (super admin)' : 'Preview as staff') + '</button>' : '') +
        '<a href="' + RI.url('') + '">Open the public site</a><button type="button" data-logout>Log out</button></div></div></div>';
    top.innerHTML = '<div class="ct-in"><button type="button" class="ct-menu" id="ct-menu" aria-label="Open the menu" aria-controls="con-side" aria-expanded="false"><span></span><span></span><span></span></button>' +
      '<nav class="ct-where" aria-label="You are here" data-group="' + groupOf + '" data-name="' + (nameOf || 'Console') + '" data-list="' + listOf + '">' + C.crumbs([groupOf ? [groupOf] : null, [nameOf || 'Console']]) + '</nav>' +
      '<form class="ct-search" id="ct-search" role="search">' + RI.icon('search','i-sm') + '<input type="search" id="ct-q" placeholder="Search houses, rules, presets, screens" aria-label="Search the console" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="ct-res"><kbd title="Press / to search">/</kbd><button type="button" class="ct-x" id="ct-x">Cancel</button><div class="ct-res" id="ct-res" role="listbox" hidden></div></form>' +
      '<button type="button" class="ct-find" id="ct-find" aria-label="Search the console">' + RI.icon('search') + '</button>' +
      (m.preview ? '<span class="ct-preview">' + RI.icon('eye','i-sm') + 'Staff preview</span>' : '') +
      '<span class="ct-sep" aria-hidden="true"></span>' +
      (seeQ ? '<a class="ct-queue' + (q ? ' has' : '') + '" href="#/publish" aria-label="Publish queue, ' + q + ' waiting">' + RI.icon('refresh','i-sm') + '<span>Publish queue</span><em>' + q + '</em></a>' : '') + '</div>';
    RI.fillIcons(side); RI.fillIcons(top);
    var mb = doc.getElementById('cs-me'), mn = doc.getElementById('cs-menu');
    mb.addEventListener('click', function(e){ e.stopPropagation(); var o = mn.hidden; mn.hidden = !o; mb.setAttribute('aria-expanded', o); });
    doc.addEventListener('click', function(){ mn.hidden = true; mb.setAttribute('aria-expanded', 'false'); }, {once:true});
    var pv = doc.getElementById('cs-preview');
    if(pv) pv.addEventListener('click', function(){ var on = C.get('preview') === 'staff'; C.set('preview', on ? '' : 'staff'); RI.toast(on ? 'Back to the super admin view.' : 'Previewing the console as the sample staff member: houses, grading, reading the rulebook, back-tests and the audit log.', 'eye'); C.render(); });
    doc.getElementById('ct-menu').addEventListener('click', openMenu);
    var topEl = doc.getElementById('con-top');
    doc.getElementById('ct-find').addEventListener('click', function(){ topEl.classList.add('searching'); doc.getElementById('ct-q').focus(); });
    doc.getElementById('ct-x').addEventListener('click', function(){ var i = doc.getElementById('ct-q'); i.value = ''; doc.getElementById('ct-res').hidden = true; topEl.classList.remove('searching'); doc.getElementById('ct-find').focus(); });
    findBox();
  }
  /* ---------- Find anything: houses, screens, rules, presets and products, as you type ---------- */
  function findBox(){
    var f = doc.getElementById('ct-search'), q = doc.getElementById('ct-q'), box = doc.getElementById('ct-res'), sel = -1, items = [];
    function results(v){
      v = v.toLowerCase(); var out = [];
      var hs = A.all().filter(function(h){ return [A.addr(h), A.place(h), h.owner, h.client || ''].join(' ').toLowerCase().indexOf(v) > -1; }).slice(0, 5)
        .map(function(h){ return ['Houses', A.addr(h), A.place(h) + (h.client ? ' · ' + h.client : ''), '#/houses/' + h.id, 'house']; });
      var sc = []; C.SCREENS.forEach(function(g){ g[1].forEach(function(it){ if(C.can(it[4]) && it[1].toLowerCase().indexOf(v) > -1) sc.push(['Screens', it[1], g[0], it[2], it[3]]); }); });
      var ru = (C.get('rules', []) || []).filter(function(r){ return (r.code + ' ' + r.text + ' ' + r.plain).toLowerCase().indexOf(v) > -1; }).slice(0, 4).map(function(r){ return ['Rules', r.code, r.plain, '#/rules/' + r.code, 'list']; });
      var pr = (C.PRESETS || []).filter(function(p){ return (p[0] + ' ' + p[1]).toLowerCase().indexOf(v) > -1; }).slice(0, 3).map(function(p){ return ['Presets', p[0], p[1], '#/packages?tab=presets&p=' + p[0], 'sliders']; });
      var pd = (C.get('products', []) || []).filter(function(p){ return (p.name + ' ' + p.item).toLowerCase().indexOf(v) > -1; }).slice(0, 3).map(function(p){ return ['Products', p.name, p.item, '#/products', 'tag']; });
      return out.concat(hs, sc, ru, pr, pd);
    }
    function draw(){
      var v = q.value.trim(); if(!v){ box.hidden = true; q.setAttribute('aria-expanded', 'false'); return; }
      items = results(v); sel = items.length ? 0 : -1; var last = '';
      box.innerHTML = items.length ? items.map(function(it, i){ var head = it[0] !== last ? '<p class="ct-rg">' + it[0] + '</p>' : ''; last = it[0];
        return head + '<a href="' + it[3] + '" role="option" id="ct-o' + i + '" class="ct-ro' + (i === sel ? ' on' : '') + '">' + RI.icon(it[4],'i-sm') + '<span><b>' + RI.esc(it[1]) + '</b><small>' + RI.esc(it[2]) + '</small></span></a>'; }).join('') +
        '<p class="ct-rf"><span class="c-keys"><kbd>↑</kbd><kbd>↓</kbd> choose · <kbd>Enter</kbd> open · <kbd>Esc</kbd> close</span></p>' : '<p class="ct-none">Nothing matches “' + RI.esc(v) + '”.</p>';
      box.hidden = false; q.setAttribute('aria-expanded', 'true'); RI.fillIcons(box);
    }
    function mark(){ box.querySelectorAll('.ct-ro').forEach(function(a, i){ a.classList.toggle('on', i === sel); if(i === sel){ a.scrollIntoView({block:'nearest'}); q.setAttribute('aria-activedescendant', a.id); } }); }
    q.addEventListener('input', draw);
    q.addEventListener('focus', function(){ if(q.value.trim()) draw(); });
    q.addEventListener('keydown', function(e){
      if(box.hidden) return;
      if(e.key === 'ArrowDown'){ e.preventDefault(); sel = Math.min(items.length - 1, sel + 1); mark(); }
      if(e.key === 'ArrowUp'){ e.preventDefault(); sel = Math.max(0, sel - 1); mark(); }
      if(e.key === 'Escape'){ box.hidden = true; q.blur(); doc.getElementById('con-top').classList.remove('searching'); }
    });
    f.addEventListener('submit', function(e){ e.preventDefault(); doc.getElementById('con-top').classList.remove('searching'); var it = items[sel]; box.hidden = true; if(it) C.go(it[3]); else if(q.value.trim()) C.go('#/houses?q=' + encodeURIComponent(q.value.trim())); q.value = ''; q.blur(); });
    box.addEventListener('click', function(){ box.hidden = true; q.value = ''; });
    doc.addEventListener('click', function(e){ if(!f.contains(e.target)) box.hidden = true; });
  }

  /* ---------- Unsaved changes: ask before leaving them behind ---------- */
  C.dirty = function(){ return !!doc.querySelector('#view .c-savebar, #view .ra-card.editing') || [].some.call(doc.querySelectorAll('#view .gr-note:not([hidden]) textarea'), function(t){ return t.value.trim(); }); };
  window.addEventListener('beforeunload', function(e){ if(C.dirty()){ e.preventDefault(); e.returnValue = ''; } });

  function openMenu(){ var s = doc.getElementById('con-side'), sc = doc.getElementById('con-scrim'); s.classList.add('open'); sc.hidden = false; doc.getElementById('ct-menu').setAttribute('aria-expanded', 'true'); var a = s.querySelector('a[aria-current]') || s.querySelector('a'); if(a) a.focus(); }
  function closeMenu(){ var s = doc.getElementById('con-side'), sc = doc.getElementById('con-scrim'); if(!s) return; s.classList.remove('open'); sc.hidden = true; var b = doc.getElementById('ct-menu'); if(b) b.setAttribute('aria-expanded', 'false'); }
  C.boot = function(){
    C.seed();
    doc.getElementById('con-scrim').addEventListener('click', closeMenu);
    doc.addEventListener('keydown', function(e){
      if(e.key === 'Escape') closeMenu();
      var t = e.target; if(e.key === '/' && !(t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')){ var q = doc.getElementById('ct-q'); if(q && q.offsetParent){ e.preventDefault(); q.focus(); } }
    });
    window.addEventListener('hashchange', C.render);
    C.render();
  };
})();
