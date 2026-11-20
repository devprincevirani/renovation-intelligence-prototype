/* Console: the house list (APP_FLOW 7, BACKLOG M1-33). Every property, with search and filters.
   The house inspector and the decision tree live in reasoning.js. */
(function(){
  var RI = window.RI, A = RI.App, C = RI.Con, doc = document;

  /* Owner of a house: the demo roles, then accounts made in this browser */
  C.owner = function(email){
    var r = (RI.ROLES || []).filter(function(x){ return x.email === email; })[0];
    if(r) return {name:r.name, type:r.type, demo:true};
    var u = RI.users.get(email || '') || {};
    return {name:(email || '').split('@')[0], type:u.type ? u.type.charAt(0).toUpperCase() + u.type.slice(1) : 'User'};
  };
  /* Where a house stands, for the console */
  C.houseState = function(h){
    var st = A.status(h), s = A.STATUS[st] || ['', ''];
    var out = {st:st, label:s[0], cls:s[1], held:0, release:'Not run'};
    if(st !== 'draft'){ var est = A.estimate(h), hc = A.heldCount(est); out.held = hc.u + hc.m; out.release = out.held ? 'Partial' : 'Complete'; out.est = est; }
    return out;
  };
  C.runId = function(h){ return 'run_' + h.id.slice(1, 6) + '_' + ('000' + (h.version || 1)).slice(-4); };

  var GROUP = {draft:'draft', queued:'work', reading:'work', planning:'work', ready:'ready', open:'open'};
  /* The four stages a house moves through, in order. One marker drawn the same way in the strip and in each row */
  var STAGES = [['draft','Draft'], ['work','Working'], ['ready','Price ready'], ['open','Presentation open']];
  var STEP = {draft:1, work:2, ready:3, open:4};
  C.stageMark = function(g){ var n = STEP[g] || 0; return '<span class="hl-mark s-' + g + '" aria-hidden="true">' + [1,2,3,4].map(function(k){ return '<i' + (k <= n ? ' class="on"' : '') + '></i>'; }).join('') + '</span>'; };
  var PER = [5, 10, 25];

  C.route('/houses', function(view){
    var q = C.query(), all = A.all().slice().sort(function(a, b){ return (b.updated || b.created) - (a.updated || a.created); });
    var per = +C.get('hl.per', 5); if(PER.indexOf(per) < 0) per = 5;
    var st = {q:q.q || '', f:q.f || 'all', owner:'all', sort:'updated', page:0, per:per};
    var info = {}; all.forEach(function(h){ info[h.id] = C.houseState(h); });
    var count = function(k){ return all.filter(function(h){ return k === 'all' || GROUP[info[h.id].st] === k; }).length; };
    var total = all.length, held = all.reduce(function(n, h){ return n + info[h.id].held; }, 0);
    /* Stage strip: the filter and an at-a-glance view of the pipeline in one */
    var tile = function(k, label, inner){ return '<button type="button" role="tab" class="hl-st hl-st-' + k + '" data-v="' + k + '" aria-selected="' + (k === st.f) + '"><span class="hl-st-k">' + label + '</span><b class="hl-st-n">' + count(k) + '</b>' + inner + '</button>'; };
    var dist = '<span class="hl-dist" aria-hidden="true">' + STAGES.map(function(s){ var n = count(s[0]); return n ? '<i class="s-' + s[0] + '" style="flex:' + n + '"></i>' : ''; }).join('') + '</span>';
    var strip = '<div class="hl-stages" id="hl-f" role="tablist" aria-label="Filter by stage">' +
      tile('all', 'All houses', dist + '<span class="hl-st-s">' + (held ? held + ' lines held across houses' : 'No lines held') + '</span>') +
      STAGES.map(function(s, i){ return tile(s[0], s[1], C.stageMark(s[0]) + '<span class="hl-st-s">Stage ' + (i + 1) + ' of 4</span>'); }).join('') + '</div>';
    view.innerHTML = C.page({kicker:'Houses', title:'Every house', sub:'All properties entered by users, builders and staff. Open one to see its run end to end. Nothing here holds a house back.',
      body:strip +
        '<div class="hl-bar">' + C.search('hl-q', 'Search address, owner or client', st.q) +
        '<label class="c-select"><span class="sr">Owner</span><select id="hl-owner"><option value="all">All owners</option><option value="Homeowner">Homeowners</option><option value="Builder">Builders</option><option value="other">Other accounts</option></select></label>' +
        '<label class="c-select"><span class="sr">Sort</span><select id="hl-sort"><option value="updated">Recently updated</option><option value="addr">Address, A to Z</option><option value="held">Most lines held</option></select></label></div>' +
        '<div id="hl-list"></div>'});
    function draw(){
      var v = st.q.toLowerCase();
      var list = all.filter(function(h){
        var i = info[h.id], o = C.owner(h.owner);
        if(st.f !== 'all' && GROUP[i.st] !== st.f) return false;
        if(st.owner !== 'all' && (st.owner === 'other' ? (o.type === 'Homeowner' || o.type === 'Builder') : o.type !== st.owner)) return false;
        return !v || [A.addr(h), A.place(h), h.owner, h.client || '', o.name].join(' ').toLowerCase().indexOf(v) > -1;
      });
      if(st.sort === 'addr') list.sort(function(a, b){ return A.addr(a).localeCompare(A.addr(b)); });
      if(st.sort === 'held') list.sort(function(a, b){ return info[b.id].held - info[a.id].held; });
      var pages = Math.max(1, Math.ceil(list.length / st.per)); st.page = Math.min(st.page, pages - 1);
      var shown = list.slice(st.page * st.per, st.page * st.per + st.per);
      var stageName = (STAGES.filter(function(s){ return s[0] === st.f; })[0] || [])[1];
      doc.getElementById('hl-list').innerHTML = C.table({cls:'hl', empty:v ? 'No house matches “' + RI.esc(st.q) + '”. Try part of the street, the owner email or a client name.' : stageName ? 'No houses are at ' + stageName + ' right now.' : 'No houses yet.',
        cols:[{label:'House'}, {label:'Owner'}, {label:'Stage'}, {label:'Photos', num:true}, {label:'Release'}, {label:'Updated', num:true}],
        rows:shown.map(function(h){
          var i = info[h.id], o = C.owner(h.owner), cov = A.cover(h), g = GROUP[i.st];
          return {attr:'data-go="#/houses/' + h.id + '" tabindex="0" role="link" aria-label="Open ' + RI.esc(A.addr(h)) + '"', cells:[
            '<span class="hl-house">' + (cov ? '<img src="' + cov + '" alt="" loading="lazy">' : '<span class="hl-noimg">' + RI.icon('house','i-sm') + '</span>') + '<span><b>' + RI.esc(A.addr(h)) + '</b><small>' + RI.esc(A.place(h)) + (h.client ? ' · ' + RI.esc(h.client) : '') + '</small></span></span>',
            '<span class="hl-owner">' + C.av(o.name, 'sm') + '<span><b>' + RI.esc(o.name) + '</b><small>' + o.type + '</small></span></span>',
            '<span class="hl-stage">' + C.stageMark(g) + '<span>' + A.STATUS[i.st][0] + '</span></span>',
            String(A.photoCount(h)),
            i.st === 'draft' ? '<span class="muted">Not run yet</span>' : (i.held ? '<span class="hl-rel"><span class="rel rel-part">Partial</span><small>' + i.held + (i.held === 1 ? ' line' : ' lines') + ' held</small></span>' : '<span class="hl-rel"><span class="rel rel-ok">Complete</span></span>'),
            '<span class="hl-when"><span title="' + C.time(h.updated || h.created) + '">' + C.ago(h.updated || h.created) + '</span><small>Version ' + (h.version || 1) + '</small></span>'
          ]};
        })}) +
        (list.length ? C.pager({page:st.page, per:st.per, total:list.length, noun:list.length === 1 ? 'house' : 'houses', perOpts:PER}) : '');
      RI.fillIcons(doc.getElementById('hl-list'));
    }
    view.querySelector('#hl-f').addEventListener('click', function(e){ var b = e.target.closest('[data-v]'); if(!b) return; st.f = b.getAttribute('data-v'); st.page = 0; view.querySelectorAll('#hl-f [data-v]').forEach(function(x){ x.setAttribute('aria-selected', x === b); }); draw(); });
    view.querySelector('#hl-q').addEventListener('input', function(){ st.q = this.value; st.page = 0; draw(); });
    view.querySelector('#hl-owner').addEventListener('change', function(){ st.owner = this.value; st.page = 0; draw(); });
    view.querySelector('#hl-sort').addEventListener('change', function(){ st.sort = this.value; draw(); });
    view.addEventListener('change', function(e){ if(!e.target.matches('[data-per]')) return; st.per = C.set('hl.per', +e.target.value); st.page = 0; draw(); });
    view.addEventListener('click', function(e){
      var pg = e.target.closest('[data-pg]');
      if(pg){
        if(pg.disabled) return; st.page = +pg.getAttribute('data-pg'); draw();
        var list = doc.getElementById('hl-list'), top = list.getBoundingClientRect().top;
        if(top < 80) window.scrollTo({top:window.scrollY + top - 96, behavior:'smooth'});
        var cur = list.querySelector('[aria-current="page"]'); if(!cur || !cur.offsetParent) cur = list.querySelector('.pg-' + (pg.classList.contains('pg-prev') ? 'prev' : 'next') + ':not(:disabled)'); if(cur) cur.focus({preventScroll:true});
        return;
      }
      var r = e.target.closest('[data-go]'); if(r) C.go(r.getAttribute('data-go'));
    });
    view.addEventListener('keydown', function(e){ var r = e.target.closest('[data-go]'); if(r && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); C.go(r.getAttribute('data-go')); } });
    draw();
  }, {nav:'houses', perm:'houses.view'});
})();

/* ---------- The run behind a house, as the console sees it ----------
   Each estimate line becomes a component with its evidence, the four scales of its existing state
   (PDF section 33), a severity code, a confidence, a decision per package with its rule, the preset,
   the quantity and its source, the price, and the seven checks (PDF section 57). Sample values,
   steady for each house, so grades and back-tests always point at the same thing. */
(function(){
  var RI = window.RI, A = RI.App, C = RI.Con;
  function rnd(seed){ var h = 0; for(var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0; return function(){ h = (h * 1103515245 + 12345) >>> 0; return (h >>> 8) / 16777216; }; }
  C.rnd = rnd;
  var FAM = [[/cabinet/i,'CB'],[/counter/i,'CT'],[/backsplash|tile/i,'TL'],[/sink|faucet|toilet|vanity/i,'PL'],[/tub|surround/i,'BT'],[/floor|carpet|lvp|hardwood/i,'FL'],[/light|fixture/i,'EL'],[/switch|outlet|receptacle/i,'EL'],[/baseboard|trim|casing/i,'TR'],[/door/i,'DR'],[/siding|exterior/i,'EX'],[/gutter|roof/i,'RF'],[/appliance|range|refrigerator/i,'AP'],[/wall|ceiling|paint/i,'PT']];
  var PRESET = {CB:['SW-CB-002','SW-CB-001'], CT:['SW-CT-001'], TL:['SW-TL-001'], PL:['SW-PL-002','SW-PL-001'], BT:['SW-BT-001'], FL:['SW-FL-001'], EL:['SW-EL-001','SW-EL-002'], TR:['SW-TR-001','SW-TR-002'], DR:['SW-DR-001'], EX:['SW-PT-002','SW-EX-001'], RF:['SW-RF-002'], AP:['SW-AP-001'], PT:['SW-PT-001']};
  var RULE = {CB:'CB-RULE-015', BT:'BA-RULE-016', PL:'BA-RULE-018', EL:'EL-RULE-019', AP:'AP-RULE-020', TR:'TR-RULE-014', EX:'EX-RULE-024', FL:'CORE-05', CT:'CORE-05', TL:'CORE-07', DR:'CORE-05', RF:'EX-RULE-024', PT:'CORE-08'};
  var COND = ['Excellent','Good','Serviceable','Worn','Poor'], MOD = ['Current','Acceptable','Dated','Strongly dated'], CHAR = ['High','Moderate','Low','None'], FUNC = ['Good','Adequate','Limited'];
  var EVQ = {observed:'Inferred from photos', reported:'Typed size', inferred:'Room template', unknown:'Not known'};
  /* The scope preset follows the action, the part and the room */
  C.presetFor = function(l, pk){
    var a = ((l.item.pk[pk] || [])[0] || '').toLowerCase(), n = l.item.name.toLowerCase(), f = l.fam;
    if(f === 'CB') return /refinish|paint/.test(a) ? 'SW-CB-002' : 'SW-CB-001';
    if(f === 'PL') return /kitchen|sink/.test(n + ' ' + l.room.toLowerCase()) ? 'SW-PL-002' : 'SW-PL-001';
    if(f === 'EL') return /switch|outlet|receptacle|device/.test(n) ? 'SW-EL-002' : 'SW-EL-001';
    if(f === 'TR') return /casing/.test(n) ? 'SW-TR-002' : 'SW-TR-001';
    if(f === 'EX') return /paint/.test(a) ? 'SW-PT-002' : 'SW-EX-001';
    if(f === 'FL') return /tile|porcelain/.test(a) ? 'SW-TL-001' : 'SW-FL-001';
    if(f === 'BT') return 'SW-BT-001';
    return PRESET[f][0];
  };
  C.famOf = function(name){ for(var i = 0; i < FAM.length; i++) if(FAM[i][0].test(name)) return FAM[i][1]; return 'PT'; };
  C.threshold = function(fam){ var s = C.get('sheets', {}); return (s[fam] && s[fam].threshold) || 70; };
  C.model = function(h){
    if(A.status(h) === 'draft') return null;
    var est = A.estimate(h), out = [], seq = {};
    est.rooms.forEach(function(room){
      room.items.forEach(function(it){
        var r = rnd(h.id + it.id), fam = C.famOf(it.name), held = RI.isHeld(it), keepE = it.pk.E && it.pk.E[1] == null;
        var conf = held && it.state === 'unverified' ? 38 + Math.round(r() * 22) : 72 + Math.round(r() * 24);
        var ci = keepE ? (r() < .5 ? 1 : 2) : 2 + Math.floor(r() * 2), mi = keepE ? Math.floor(r() * 2) : 2 + Math.floor(r() * 2);
        var sev = it.state === 'unverified' ? 'CX' : ['C0','C1','C2','C3'][Math.min(3, ci)];
        var photos = Math.max(0, Math.round(r() * 3)) + (held && it.state === 'unverified' ? 0 : 1);
        var checks = [true, it.state !== 'measure', it.state !== 'unverified', true, true, true, true];
        if(!held && r() < .03) checks[5] = false; /* scope incomplete: held, admin only */
        out.push({id:h.id + ':' + it.id, item:it, room:room.name, roomKey:room.key, fam:fam, code:fam + '-' + ('0' + (seq[fam] = (seq[fam] || 0) + 1)).slice(-2),
          photos:photos, conf:conf, thr:C.threshold(fam), sev:sev,
          scales:{condition:held && it.state === 'unverified' ? 'Unknown' : COND[ci], modern:MOD[mi], character:CHAR[Math.floor(r() * 4)], func:FUNC[Math.floor(r() * 3)]},
          rule:RULE[fam] || 'CORE-05', ruleV:1 + Math.floor(r() * 3),
          qsrc:EVQ[it.ev] || 'Room template', qconf:it.state === 'measure' ? 0 : 50 + Math.round(r() * 45),
          checks:checks, pass:checks.filter(Boolean).length});
        out[out.length - 1].preset = C.presetFor(out[out.length - 1], 'S');
      });
    });
    return {h:h, est:est, lines:out, run:C.runId(h), at:(h.run && h.run.start) || h.updated, rulesV:'Registry v2.0', ratesV:'MI rates v7', productsV:'Library v12', fp:rnd(h.id)().toString(16).slice(2, 10) + rnd(h.id + 'f')().toString(16).slice(2, 10)};
  };
  C.CHECKS = [['Package chosen','The line belongs to the package being viewed'],['Quantity supported','Typed, template, inferred or typical, above its threshold'],['Condition clear','The photo reading is above the threshold for that component'],['Rate or product ready','A published Low and High, or a library product, for this region'],['Cost owner set','Exactly one owner, inclusions reconciled'],['Scope complete','Selected work and its dependencies resolved'],['No overlap','No task counted twice across work types']];
  C.whyHeld = function(l){ var i = l.checks.indexOf(false); return i < 0 ? '' : i === 1 ? 'Needs measurement' : i === 2 ? 'Unverified' : i === 3 ? 'Not priced yet' : 'Held, visible to admin only'; };
})();
