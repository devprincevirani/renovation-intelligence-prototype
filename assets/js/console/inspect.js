/* Console: the house inspector (APP_FLOW 7, M2-21, M3-18) and the decision tree with grading (M2-22, PDF section 60).
   One property end to end. Staff can read and grade; nothing here changes a house or a delivered run. */
(function(){
  var RI = window.RI, A = RI.App, C = RI.Con, doc = document;
  var PK = [['E','Essential'],['S','Standard'],['P','Premium']];
  var SEV = {C0:'No visible defect', C1:'Minor cosmetic wear', C2:'Moderate deterioration', C3:'Significant deterioration', C4:'Apparent urgent safety concern', CX:'Not enough evidence'};

  function confBar(l){
    var ok = l.conf >= l.thr;
    return '<span class="cf' + (ok ? '' : ' low') + '" title="Confidence ' + l.conf + ', threshold ' + l.thr + '"><span class="cf-t"><i style="width:' + l.conf + '%"></i><b style="left:' + l.thr + '%"></b></span><em>' + l.conf + '</em></span>';
  }
  function code(l){ return '<span class="c-cmp"><code>' + l.code + '</code><span><b>' + RI.esc(l.item.name) + '</b><small>' + RI.esc(l.room) + '</small></span></span>'; }
  function head(h, active, model){
    var st = C.houseState(h), o = C.owner(h.owner), cov = A.cover(h);
    return '<a class="c-back" href="#/houses">' + RI.icon('arrow','i-sm flip') + 'House list</a>' +
      '<header class="ih">' + (cov ? '<img class="ih-img" src="' + cov + '" alt="">' : '<span class="ih-img ih-noimg">' + RI.icon('house') + '</span>') +
      '<div class="ih-t"><p class="c-kicker">' + (active === 'tree' ? 'Decision tree' : 'House inspector') + '</p><h1>' + RI.esc(A.addr(h)) + '</h1><p class="c-sub">' + RI.esc(A.place(h)) + ' · ' + RI.esc(o.name) + ', ' + o.type + (h.client ? ' · client ' + RI.esc(h.client) : '') + '</p>' +
        '<div class="ih-tags">' + A.pill(h) + (st.st !== 'draft' ? (st.held ? '<span class="rel rel-part">Partial planning estimate</span>' : '<span class="rel rel-ok">Complete planning estimate</span>') : '') + (model ? C.chip(model.run) : '') + C.chip('v' + (h.version || 1)) + '</div></div>' +
      (model ? '<div class="ih-act">' + (active === 'tree' ? '<a class="btn btn-secondary" href="#/houses/' + h.id + '">' + RI.icon('list','i-sm') + 'Inspector</a>' : '<a class="btn btn-primary" href="#/houses/' + h.id + '/tree">' + RI.icon('sliders','i-sm') + 'Open the decision tree</a>') + '</div>' : '') + '</header>';
  }

  /* ---------- House inspector ---------- */
  C.route('/houses/:id', function(view, p){
    var h = A.get ? A.all().filter(function(x){ return x.id === p.id; })[0] : null;
    if(!h){ view.innerHTML = C.page({title:'That house is not here', back:['#/houses','House list']}); return; }
    var m = C.model(h), tab = C.query().tab || 'overview', f = h.facts || {};
    var tabs = m ? [['overview','Overview'],['photos','Photos',A.photoCount(h)],['obs','Observations',m.lines.length],['dec','Decisions'],['qty','Quantities and prices'],['checks','Checks',m.lines.filter(function(l){ return l.pass < 7; }).length],['ledger','Ledger']] : [['overview','Overview'],['photos','Photos',A.photoCount(h)]];
    view.innerHTML = '<div class="c-page">' + head(h, 'inspector', m) + C.seg('in-tab', tabs, tab) + '<div id="in-body" class="c-mt"></div></div>';
    C.crumb(A.addr(h));
    function body(){
      var el = doc.getElementById('in-body'), html = '';
      if(tab === 'overview'){
        var tot = '';
        if(m){ RI.CURRENT = m.est; tot = '<section class="c-card"><header><h2>Price by package</h2>' + (C.houseState(h).held ? '<span class="rel rel-part">Partial</span>' : '<span class="rel rel-ok">Complete</span>') + '</header><div class="in-pk">' + PK.map(function(k){ var t = RI.totals(k[0], h.off || {}); return '<div><span>' + k[1] + '</span>' + C.range(t.low, t.high) + '</div>'; }).join('') + '</div>' + C.note('Low and High only. Unconfirmed lines are left out and named, never zero.') + '</section>'; RI.CURRENT = null; }
        var cons = h.consents || {};
        html = '<div class="in-grid">' +
          '<section class="c-card"><header><h2>Facts as entered</h2>' + C.chip('Reported') + '</header><dl class="c-kv">' + [['Year built', f.year || '?'], ['Above grade', f.sqft ? (+f.sqft).toLocaleString('en-US') + ' sq ft' : '?'], ['Stories', f.stories || '?'], ['Bedrooms', f.beds != null ? f.beds : '?'], ['Full baths', f.baths || '?'], ['Half baths', f.halfBaths || 0], ['Basement', f.basement || '?'], ['Basement, finished', f.basementSqft ? f.basementSqft + ' sq ft' : 'Not given']].map(function(r){ return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl></section>' +
          (m ? '<section class="c-card"><header><h2>This run</h2>' + C.lbl('published', '') .replace('Published', 'Delivered') + '</header><dl class="c-kv"><dt>Run</dt><dd><code>' + m.run + '</code></dd><dt>Started</dt><dd>' + C.time(m.at) + '</dd><dt>Rules</dt><dd>' + m.rulesV + '</dd><dt>Rates</dt><dd>' + m.ratesV + '</dd><dt>Products</dt><dd>' + m.productsV + '</dd><dt>Fingerprint</dt><dd><code>' + m.fp + '</code></dd><dt>Lines</dt><dd>' + m.lines.length + ', ' + m.lines.filter(function(l){ return l.pass === 7; }).length + ' passed all seven checks</dd></dl>' + C.note('The run keeps the versions it was made with. A new version of a rule or rate only reaches new runs.') + '</section>'
             : '<section class="c-card"><header><h2>No run yet</h2>' + C.lbl('draft') + '</header><p class="small muted">This house is still a draft: the owner has not submitted it. The run starts when they do.</p></section>') +
          tot +
          '<section class="c-card"><header><h2>Consents and access</h2></header><dl class="c-kv"><dt>Photo rights</dt><dd>' + (cons.rights ? 'Ticked ' + C.date(cons.rights.at) : (h.rights ? 'Ticked' : 'Not yet')) + '</dd><dt>Estimate only</dt><dd>' + (cons.estimate ? 'Ticked ' + C.date(cons.estimate.at) : 'Not yet') + '</dd><dt>Presentation</dt><dd>' + (h.paid ? 'Paid' : h.trialOpen ? 'Trial' : 'Not paid') + '</dd><dt>Share links</dt><dd>' + ((h.shares || []).filter(function(s){ return s.active; }).length) + ' active</dd><dt>Feedback</dt><dd>' + (h.feedback ? RI.esc(h.feedback.v) : 'None') + '</dd></dl></section></div>';
      }
      if(tab === 'photos'){
        var rooms = A.roomsFor(h);
        html = rooms.filter(function(r){ return A.photoCount(h, r[0]); }).map(function(r){ var ps = (h.photos[r[0]] || []).filter(function(x){ return x.state === 'done'; });
          return '<section class="in-ph"><h2 class="c-h2">' + r[1] + ' <span class="muted">' + ps.length + '</span></h2><div class="in-ph-g">' + ps.map(function(x){ return '<figure><img src="' + x.src + '" alt="" loading="lazy">' + ((x.flags || []).length ? '<figcaption>' + x.flags.join(', ') + '</figcaption>' : '') + '</figure>'; }).join('') + '</div></section>';
        }).join('') || '<div class="c-empty">' + RI.icon('camera') + '<p>No photos yet.</p></div>';
        var miss = rooms.filter(function(r){ return r[0] !== 'other' && !A.photoCount(h, r[0]); }).map(function(r){ return r[1]; });
        if(miss.length) html += C.note('No photos of ' + miss.join(', ') + '. Those rooms show as unverified.');
      }
      if(tab === 'obs') html = C.table({cols:[{label:'Component'},{label:'Evidence'},{label:'Condition'},{label:'Modernisation'},{label:'Character'},{label:'Function'},{label:'Severity'},{label:'Confidence'}],
        rows:m.lines.map(function(l){ return {attr:'data-go="#/houses/' + h.id + '/tree?line=' + encodeURIComponent(l.id) + '" tabindex="0" role="link"', cells:[code(l), l.photos ? l.photos + ' photo' + (l.photos > 1 ? 's' : '') : '<span class="muted">No photo</span>', l.scales.condition, l.scales.modern, l.scales.character, l.scales.func, '<span class="sev sev-' + l.sev + '" title="' + SEV[l.sev] + '">' + l.sev + '</span>', confBar(l)]}; })}) + C.note('Four separate scales: a part can be in good condition and still look dated (PDF section 33). The tick on each bar is that component\'s threshold.');
      if(tab === 'dec') html = C.table({cols:[{label:'Component'},{label:'Essential'},{label:'Standard'},{label:'Premium'},{label:'Rule'}],
        rows:m.lines.map(function(l){ return {attr:'data-go="#/houses/' + h.id + '/tree?line=' + encodeURIComponent(l.id) + '" tabindex="0" role="link"', cells:[code(l)].concat(PK.map(function(k){ var a = l.item.pk[k[0]]; return a ? RI.esc(a[0]) : '<span class="muted">Not in this goal</span>'; })).concat(['<code>' + l.rule + '</code> v' + l.ruleV])}; })});
      if(tab === 'qty') html = C.table({cols:[{label:'Component'},{label:'Quantity'},{label:'Source'},{label:'Preset'},{label:'Standard', num:true},{label:'Product'}],
        rows:m.lines.map(function(l){ var a = l.item.pk.S || [], held = C.whyHeld(l); return {cells:[code(l), RI.esc(l.item.qty || ''), l.qsrc + (l.qconf ? ' <span class="muted">· ' + l.qconf + '</span>' : ''), '<code>' + l.preset + '</code>', held ? '<span class="rel rel-part">' + held + '</span>' : a[1] != null ? C.range(a[1], a[2]) : '<span class="muted">No cost</span>', a[3] ? RI.esc(a[3]) : '<span class="muted">None</span>']}; })}) + C.note('Net quantities only. Every quantity belongs to one component and one scope action (QT-RULE-048).');
      if(tab === 'checks') html = C.table({cols:[{label:'Component'}].concat(C.CHECKS.map(function(c, i){ return {label:String(i + 1), num:true}; })).concat([{label:'Result'}]),
        rows:m.lines.map(function(l){ return {cells:[code(l)].concat(l.checks.map(function(ok){ return ok ? '<span class="ck ok" aria-label="Passed">' + RI.icon('check','i-sm') + '</span>' : '<span class="ck no" aria-label="Failed">' + RI.icon('x','i-sm') + '</span>'; })).concat([l.pass === 7 ? '<span class="rel rel-ok">Priced</span>' : '<span class="rel rel-part">' + C.whyHeld(l) + '</span>'])}; })}) +
        '<ol class="ck-key">' + C.CHECKS.map(function(c){ return '<li><b>' + c[0] + '</b> ' + c[1] + '</li>'; }).join('') + '</ol>';
      if(tab === 'ledger') html = '<section class="c-card"><header><h2>Verification ledger</h2>' + C.chip(m.run) + '</header>' + C.table({cols:[{label:'Component'},{label:'Evidence used'},{label:'Measurement source'},{label:'Rule'},{label:'Rate and product'},{label:'Checks', num:true}],
        rows:m.lines.map(function(l){ return {cells:[code(l), l.photos ? 'photo_' + (20 + l.code.length + l.photos) + (l.photos > 1 ? ' and ' + (l.photos - 1) + ' more' : '') + ', intake field' : 'Intake field', l.qsrc + (l.qconf ? ', confidence ' + l.qconf : ''), l.rule + ' v' + l.ruleV, m.ratesV + ', ' + m.productsV, l.pass + ' of 7']}; })}) + C.note('Computed ' + C.time(m.at) + ', run ' + m.run + '. The partial or complete label is computed from the checks, never chosen by a screen.') + '</section>';
      el.innerHTML = html; RI.fillIcons(el);
    }
    view.querySelector('#in-tab').addEventListener('click', function(e){ var b = e.target.closest('[data-v]'); if(!b) return; tab = b.getAttribute('data-v'); view.querySelectorAll('#in-tab [data-v]').forEach(function(x){ x.setAttribute('aria-selected', x === b); }); history.replaceState(null, '', '#/houses/' + h.id + '?tab=' + tab); body(); });
    view.addEventListener('click', function(e){ var r = e.target.closest('[data-go]'); if(r) C.go(r.getAttribute('data-go')); });
    view.addEventListener('keydown', function(e){ var r = e.target.closest('[data-go]'); if(r && e.key === 'Enter') C.go(r.getAttribute('data-go')); });
    body();
  }, {nav:'houses', perm:'houses.view'});

  /* ---------- Decision tree with grading ---------- */
  var GR = [['correct','Correct','check'],['wrong','Wrong','x'],['alt','Valid alternative','refresh']];
  function grades(){ return C.get('grades', {}); }
  C.route('/houses/:id/tree', function(view, p){
    var h = A.all().filter(function(x){ return x.id === p.id; })[0], m = h && C.model(h);
    if(!m){ view.innerHTML = C.page({title:'No decision tree yet', sub:'This house has not been run.', back:['#/houses' + (h ? '/' + h.id : ''), h ? 'House inspector' : 'House list']}); return; }
    var q = C.query(), cur = q.line || m.lines[0].id, pk = q.pk || 'S', stepIn = !!q.line;
    view.innerHTML = '<div class="c-page">' + head(h, 'tree', m) +
      (C.crumb(A.addr(h), '#/houses/' + h.id, 'Decision tree') || '') + '<div class="tr-wrap' + (stepIn ? ' in' : '') + '" id="tr-wrap"><aside class="c-list tr-nav" aria-label="Components">' + C.seg('tr-pk', PK.map(function(k){ return [k[0], k[1]]; }), pk) + '<div id="tr-list"></div></aside><section class="tr-chain" id="tr-chain" aria-live="polite"></section></div></div>';
    function list(){
      var g = grades(), byRoom = {};
      m.lines.forEach(function(l){ (byRoom[l.room] = byRoom[l.room] || []).push(l); });
      doc.getElementById('tr-list').innerHTML = Object.keys(byRoom).map(function(r){ return '<p class="c-list-g">' + RI.esc(r) + '</p>' + byRoom[r].map(function(l){
        var n = Object.keys(g).filter(function(k){ return k.indexOf(l.id + '|') === 0; }).length;
        return '<button type="button" class="c-li' + (l.id === cur ? ' on' : '') + '" data-line="' + l.id + '"><span><b>' + RI.esc(l.item.name) + '</b><small>' + (l.pass < 7 ? C.whyHeld(l) : RI.esc((l.item.pk[pk] || ['Not in this goal'])[0])) + '</small></span>' + (n ? '<span class="tr-g" title="' + n + ' grade' + (n > 1 ? 's' : '') + '">' + RI.icon('check','i-sm') + n + '</span>' : (l.pass < 7 ? '<span class="tr-dot" aria-label="Held"></span>' : '')) + '</button>'; }).join(''); }).join('');
      RI.fillIcons(doc.getElementById('tr-list'));
    }
    function node(n, key, title, body, l){
      var g = grades()[l.id + '|' + key + '|' + pk];
      return '<li class="tr-n" data-node="' + key + '"><span class="tr-step">' + n + '</span><div class="tr-card"><header><h3>' + title + '</h3>' +
        (g ? '<span class="gr gr-' + g.v + '">' + RI.icon(GR.filter(function(x){ return x[0] === g.v; })[0][2],'i-sm') + GR.filter(function(x){ return x[0] === g.v; })[0][1] + '</span>' : '') + '</header>' + body +
        (C.can('houses.grade') ? '<div class="gr-row"><span class="small muted gr-who">' + (g ? 'Graded by ' + RI.esc(g.by) + ', ' + C.ago(g.at) + (g.note ? ': “' + RI.esc(g.note) + '”' : '') + ' <button type="button" class="linkbtn small" data-clear="' + key + '">Clear</button>' : 'Grade this step') + '</span><div class="gr-btns" role="group" aria-label="Grade ' + title + '">' + GR.map(function(x){ return '<button type="button" data-grade="' + x[0] + '" data-key="' + key + '"' + (g && g.v === x[0] ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' + RI.icon(x[2],'i-sm') + x[1] + '</button>'; }).join('') + '</div></div><div class="gr-note" data-note="' + key + '" hidden></div>' : '') +
        '</div></li>';
    }
    function chain(){
      var l = m.lines.filter(function(x){ return x.id === cur; })[0], a = l.item.pk[pk], ruleT = C.ruleText ? C.ruleText(l.rule) : '', ev = (RI.EVIDENCE || {})[l.item.ev] || {}, ps = ((h.photos || {})[l.roomKey] || []).filter(function(x){ return x.state === 'done'; }).slice(0, l.photos || 0);
      var held = C.whyHeld(l), action = a ? a[0] : 'Not in this goal';
      var reason = a ? 'We suggest “' + action.toLowerCase() + '” because it looks ' + l.scales.condition.toLowerCase() + ' but ' + l.scales.modern.toLowerCase() + (l.photos ? ' in ' + l.photos + ' photo' + (l.photos > 1 ? 's' : '') : '') + '.' : '';
      doc.getElementById('tr-chain').innerHTML = '<button type="button" class="c-back tr-back" id="tr-back">' + RI.icon('arrow','i-sm flip') + 'All components</button>' +
        '<section class="tr-five"><h2>' + RI.esc(l.item.name) + ' <code>' + l.code + '</code></h2><dl>' +
          '<div><dt>What is it</dt><dd>' + RI.esc(l.item.name) + ', ' + RI.esc(l.room.toLowerCase()) + '</dd></div><div><dt>What condition</dt><dd>' + l.scales.condition + ', ' + l.scales.modern.toLowerCase() + '</dd></div><div><dt>How do we know</dt><dd>' + (l.photos ? 'Seen in ' + l.photos + ' photo' + (l.photos > 1 ? 's' : '') : 'No photo of this part') + '</dd></div><div><dt>What could be done</dt><dd>' + RI.esc(action) + '</dd></div><div><dt>How certain</dt><dd>' + l.conf + ' of 100, threshold ' + l.thr + '</dd></div></dl></section>' +
        '<ol class="tr">' +
          node(1, 'photo', 'Photo', ps.length ? '<div class="tr-ph">' + ps.map(function(x){ return '<img src="' + x.src + '" alt="">'; }).join('') + '</div>' : '<p class="tr-p muted">No photo of this part. That is why it cannot pass check 3.</p>', l) +
          node(2, 'obs', 'Observation', '<p class="tr-p"><b>' + RI.esc(l.item.name) + '</b> in the ' + RI.esc(l.room.toLowerCase()) + '. Family ' + (C.FAMILY[l.fam] || l.fam) + '. Evidence: ' + (ev.label || l.item.ev) + '.</p>', l) +
          node(3, 'eval', 'Evaluation', '<div class="tr-sc"><span><small>Condition</small><b>' + l.scales.condition + '</b></span><span><small>Modernisation</small><b>' + l.scales.modern + '</b></span><span><small>Character</small><b>' + l.scales.character + '</b></span><span><small>Function</small><b>' + l.scales.func + '</b></span></div><p class="tr-p"><span class="sev sev-' + l.sev + '">' + l.sev + '</span> ' + SEV[l.sev] + '. ' + confBar(l) + '</p>', l) +
          node(4, 'dec', 'Decision', '<p class="tr-p"><b>' + RI.esc(action) + '</b></p>' + (reason ? '<p class="tr-p muted">' + RI.esc(reason) + '</p>' : '') + '<p class="tr-rule"><code>' + l.rule + '</code> v' + l.ruleV + (ruleT ? ' · ' + RI.esc(ruleT) : '') + ' <a href="#/rules/' + l.rule + '">Open the rule</a></p>', l) +
          node(5, 'tasks', 'Tasks', a && a[1] != null ? '<p class="tr-p"><code>' + C.presetFor(l, pk) + '</code> ' + RI.esc(C.presetName ? C.presetName(C.presetFor(l, pk)) : '') + ' <a href="#/packages?tab=presets&p=' + C.presetFor(l, pk) + '">Open the preset</a></p>' : '<p class="tr-p muted">No tasks: the part is kept under this goal.</p>', l) +
          node(6, 'qty', 'Quantity', '<p class="tr-p"><b>' + RI.esc(l.item.qty || '') + '</b> · ' + l.qsrc + (l.qconf ? ', confidence ' + l.qconf : '') + '</p>' + (l.item.state === 'measure' ? '<p class="tr-p muted">Needs measurement: ' + RI.esc(l.item.fix || 'the room size') + '.</p>' : ''), l) +
          node(7, 'price', 'Price', a && a[1] != null && !held ? '<p class="tr-p">' + C.range(a[1], a[2]) + ' · ' + m.ratesV + (a[3] ? ' · ' + RI.esc(a[3]) : '') + '</p>' : '<p class="tr-p"><span class="rel rel-part">' + (held || 'No cost under this goal') + '</span></p>', l) +
          node(8, 'checks', 'Checks', '<ul class="tr-ck">' + C.CHECKS.map(function(c, i){ return '<li class="' + (l.checks[i] ? 'ok' : 'no') + '">' + RI.icon(l.checks[i] ? 'check' : 'x','i-sm') + c[0] + '</li>'; }).join('') + '</ul>', l) +
        '</ol>' + navFoot() + C.note('A grade never changes a delivered result. Grades feed the back-test and become rule candidates for Sam.');
      var tc = doc.getElementById('tr-chain');
      tc.insertAdjacentHTML('afterbegin', progress());
      RI.fillIcons(tc);
    }
    var wrap = view.querySelector('#tr-wrap');
    view.addEventListener('click', function(e){
      var li = e.target.closest('[data-line]'); if(li){ cur = li.getAttribute('data-line'); wrap.classList.add('in'); history.replaceState(null, '', '#/houses/' + h.id + '/tree?line=' + encodeURIComponent(cur) + '&pk=' + pk); list(); chain(); if(innerWidth < 900) window.scrollTo(0, wrap.offsetTop - 70); return; }
      if(e.target.closest('#tr-back')){ wrap.classList.remove('in'); return; }
      var pb = e.target.closest('#tr-pk [data-v]'); if(pb){ pk = pb.getAttribute('data-v'); view.querySelectorAll('#tr-pk [data-v]').forEach(function(x){ x.setAttribute('aria-selected', x === pb); }); list(); chain(); return; }
    });
    var NODES = ['photo','obs','eval','dec','tasks','qty','price','checks'], NAMES = {photo:'photo', obs:'observation', eval:'evaluation', dec:'decision', tasks:'tasks', qty:'quantity', price:'price', checks:'checks'};
    function lineOf(id){ return m.lines.filter(function(x){ return x.id === id; })[0]; }
    function gradedLine(id){ var g = grades(); return NODES.some(function(k){ return g[id + '|' + k + '|' + pk]; }); }
    function progress(){
      var n = m.lines.filter(function(x){ return gradedLine(x.id); }).length, pc = Math.round(n / m.lines.length * 100), l = lineOf(cur), allOk = NODES.every(function(k){ var g = grades()[l.id + '|' + k + '|' + pk]; return g && g.v === 'correct'; });
      return '<div class="tr-prog"><div><p><b>' + n + ' of ' + m.lines.length + '</b> components graded under ' + PK.filter(function(k){ return k[0] === pk; })[0][1] + '</p><span class="tr-pbar"><i style="width:' + pc + '%"></i></span></div>' +
        (C.can('houses.grade') ? '<button type="button" class="btn btn-secondary btn-sm" id="tr-allok"' + (allOk ? ' disabled' : '') + '>' + RI.icon('check','i-sm') + (allOk ? 'All steps correct' : 'Mark every step correct') + '</button>' : '') + '</div>';
    }
    function navFoot(){
      var i = m.lines.map(function(x){ return x.id; }).indexOf(cur), pv = m.lines[i - 1], nx = m.lines[i + 1];
      return '<nav class="tr-foot" aria-label="Components">' + (pv ? '<button type="button" class="tr-nb" data-line="' + pv.id + '">' + RI.icon('arrow','i-sm flip') + '<span><small>Previous</small>' + RI.esc(pv.item.name) + '</span></button>' : '<span></span>') +
        '<span class="tr-keys" aria-hidden="true"><kbd>←</kbd><kbd>→</kbd> move · <kbd>C</kbd> correct</span>' +
        (nx ? '<button type="button" class="tr-nb nx" data-line="' + nx.id + '"><span><small>Next</small>' + RI.esc(nx.item.name) + '</span>' + RI.icon('arrow','i-sm') + '</button>' : '<span></span>') + '</nav>';
    }
    function save(key, v, note, quiet){
      var l = lineOf(cur), all = grades(), id = l.id + '|' + key + '|' + pk, before = all[id];
      if(v) all[id] = {v:v, note:note || '', by:C.me().name, at:Date.now()}; else delete all[id];
      C.set('grades', all);
      if(v) C.log('Graded', l.item.name + ' on ' + A.addr(h) + ': ' + GR.filter(function(x){ return x[0] === v; })[0][1].toLowerCase() + ' (' + NAMES[key] + ')', note || '', 'tree');
      if(!quiet){ var t = RI.toast(v ? GR.filter(function(x){ return x[0] === v; })[0][1] + ' saved for the ' + NAMES[key] + '.' : 'Grade cleared.', 'check'); undoable(t, function(){ var a2 = grades(); if(before) a2[id] = before; else delete a2[id]; C.set('grades', a2); list(); chain(); }); }
      list(); var y = window.scrollY; chain(); window.scrollTo(0, y);
    }
    /* A small "Undo" inside the toast */
    function undoable(t, fn){ setTimeout(function(){ var el = doc.querySelector('.toasts .toast:last-child, .toasts > *:last-child'); if(!el || el.querySelector('.tr-undo')) return; var b = doc.createElement('button'); b.type = 'button'; b.className = 'tr-undo'; b.textContent = 'Undo'; b.addEventListener('click', function(){ fn(); el.remove(); }); el.appendChild(b); }, 20); }
    function noteBox(key, v){
      doc.querySelectorAll('.gr-note').forEach(function(n){ n.hidden = true; n.innerHTML = ''; });
      var box = doc.querySelector('[data-note="' + key + '"]'), g = GR.filter(function(x){ return x[0] === v; })[0]; if(!box) return;
      box.hidden = false;
      box.innerHTML = '<label for="gr-n" class="small"><b>' + g[1] + ':</b> what should it be? <span class="muted">A sentence helps Sam.</span></label><textarea class="input" id="gr-n" rows="2" placeholder="' + (v === 'wrong' ? 'For example: the boxes are water damaged, replace' : 'For example: painting would also reach the goal') + '"></textarea><div class="gr-na"><button type="button" class="btn btn-secondary btn-sm" data-ncancel>Cancel</button><button type="button" class="btn btn-primary btn-sm" data-nsave="' + key + '" data-v="' + v + '">Save the grade</button></div>';
      var ta = box.querySelector('#gr-n'); ta.focus();
      ta.addEventListener('keydown', function(e){ if(e.key === 'Enter' && (e.metaKey || e.ctrlKey)){ e.preventDefault(); save(key, v, ta.value.trim()); } if(e.key === 'Escape'){ box.hidden = true; } });
    }
    view.addEventListener('click', function(e){
      var gb = e.target.closest('[data-grade]'); if(gb){ var k = gb.getAttribute('data-key'), v = gb.getAttribute('data-grade'); if(v === 'correct') save(k, 'correct', ''); else noteBox(k, v); return; }
      var cl = e.target.closest('[data-clear]'); if(cl){ save(cl.getAttribute('data-clear'), null); return; }
      if(e.target.closest('[data-ncancel]')){ e.target.closest('.gr-note').hidden = true; return; }
      var ns = e.target.closest('[data-nsave]'); if(ns){ save(ns.getAttribute('data-nsave'), ns.getAttribute('data-v'), doc.getElementById('gr-n').value.trim()); return; }
      if(e.target.closest('#tr-allok')){ var l = lineOf(cur), all = grades(); NODES.forEach(function(k){ var id = l.id + '|' + k + '|' + pk; if(!all[id]) all[id] = {v:'correct', note:'', by:C.me().name, at:Date.now()}; }); C.set('grades', all); C.log('Graded', l.item.name + ' on ' + A.addr(h) + ': every step correct', '', 'tree');
        var i = m.lines.map(function(x){ return x.id; }).indexOf(cur), nx = m.lines[i + 1]; RI.toast('Every step marked correct.' + (nx ? ' Moving to ' + nx.item.name + '.' : ''), 'check'); if(nx) go(nx.id); else { list(); chain(); } }
    });
    function go(id){ cur = id; wrap.classList.add('in'); history.replaceState(null, '', '#/houses/' + h.id + '/tree?line=' + encodeURIComponent(cur) + '&pk=' + pk); list(); chain(); var on = doc.querySelector('.tr-nav .c-li.on'); if(on) on.scrollIntoView({block:'nearest'}); window.scrollTo(0, innerWidth < 900 ? wrap.offsetTop - 70 : 0); }
    /* Keyboard: arrows move between components, C marks every step correct */
    var onKey = function(e){
      var t = e.target; if(!doc.getElementById('tr-chain') || /INPUT|TEXTAREA|SELECT/.test(t.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
      var ids = m.lines.map(function(x){ return x.id; }), i = ids.indexOf(cur);
      if(e.key === 'ArrowRight' && ids[i + 1]){ e.preventDefault(); go(ids[i + 1]); }
      if(e.key === 'ArrowLeft' && ids[i - 1]){ e.preventDefault(); go(ids[i - 1]); }
      if((e.key === 'c' || e.key === 'C') && C.can('houses.grade')){ var b = doc.getElementById('tr-allok'); if(b && !b.disabled){ e.preventDefault(); b.click(); } }
    };
    doc.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', function off(){ doc.removeEventListener('keydown', onKey); window.removeEventListener('hashchange', off); });
    list(); chain();
  }, {nav:'houses', perm:'houses.view'});
})();
