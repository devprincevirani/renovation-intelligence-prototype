/* Console: release. The publish queue (APP_FLOW 7, M3-21) and back-tests (M3-20, PDF section 60).
   How a change goes live: staff or Sam edit a draft, run the back-test, read the report, and Sam publishes.
   Only published versions reach the engine; old runs keep the versions they were made with. */
(function(){
  var RI = window.RI, A = RI.App, C = RI.Con, doc = document;
  var DAY = 86400000, now = Date.now();
  var AREA = {templates:['Room template','ruler'], sheets:['Condition sheet','eye'], rules:['Rule','list'], packages:['Preset','sliders'], products:['Product','tag'], rates:['Rate','file'], guidance:['Guidance','info'], resources:['Builder document','file']};
  C.AREA = AREA;

  /* A small, steady pseudo-random from a string, so a back-test shows the same result every time */
  function rnd(seed){ var h = 0; for(var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0; return function(){ h = (h * 1103515245 + 12345) >>> 0; return (h >>> 8) / 16777216; }; }
  /* The back-test set (TESTING): the lab houses, plus every priced house Sam supplies. Sam's own houses are the lab houses */
  C.LAB_OWNER = 'admin@demo.ri';
  /* Properties Sam supplied for the back-test set. They are replayed like any house but are not users' houses,
     so they have no house page. Each borrows the rooms of a priced house, scaled to its size */
  var SUPPLIED = [['1124 Linden Ave', 'Royal Oak, MI 48067', .82], ['3307 Grove St', 'Ferndale, MI 48220', .74], ['560 Birchwood Dr', 'Troy, MI 48083', 1.28], ['8812 Elm Ct', 'Warren, MI 48089', .9],
    ['2045 Oakview Rd', 'Livonia, MI 48154', 1.06], ['17 Harbor Ln', 'Clinton Township, MI 48038', 1.18], ['4410 Ridgeway Ave', 'Sterling Heights, MI 48313', .96], ['921 Cedar Point Dr', 'Novi, MI 48375', 1.4],
    ['6630 Willow Bend', 'Canton, MI 48187', 1.12], ['1502 Maple Hollow', 'Southfield, MI 48075', .88], ['39 Pine Crest Ct', 'Rochester Hills, MI 48307', 1.34], ['7718 Fairway Dr', 'Westland, MI 48185', .78],
    ['2290 Lakeview Ter', 'Shelby Township, MI 48315', 1.22], ['505 Brookside Ave', 'Dearborn, MI 48124', .86], ['1848 Hawthorne St', 'Madison Heights, MI 48071', .8]];
  C.BT_SUPPLIED = SUPPLIED;
  C.btCount = function(set){ return C.btHouses(set).length + (set === 'lab' ? 0 : SUPPLIED.length); };
  C.btHouses = function(set){ return A.all().filter(function(h){ return A.status(h) !== 'draft' && (set !== 'lab' || h.owner === C.LAB_OWNER); }); };
  /* Published versions (SCHEMA: versions tested). Each starts at the version live when the console opened and
     moves up by one for every draft of its area that Sam publishes; a run keeps the versions it was measured against */
  var VBASE = [['Rulebook', ['rules', 'packages'], 12], ['Condition sheets', ['sheets'], 4], ['Room templates', ['templates'], 5], ['Products', ['products'], 7], ['Rates', ['rates'], 9]];
  C.versionsAt = function(at){
    var pub = C.drafts().filter(function(d){ return d.status === 'published' && (d.doneAt || 0) <= at; });
    return VBASE.map(function(v){ return [v[0], 'v' + (v[2] + pub.filter(function(d){ return v[1].indexOf(d.area) > -1; }).length)]; });
  };
  var PKS = [['E', 'Essential'], ['S', 'Standard'], ['P', 'Premium']];
  C.BT_PKS = PKS;
  function totals(est){ var t = {E:[0, 0], S:[0, 0], P:[0, 0]}; est.rooms.forEach(function(r){ r.items.forEach(function(it){ PKS.forEach(function(k){ var p = it.pk && it.pk[k[0]]; if(p && p[1]){ t[k[0]][0] += p[1]; t[k[0]][1] += p[2]; } }); }); }); return t; }
  var CYC = [['Kitchen cabinets', 'Countertop', 'Each waited on the other; the engine stopped after 3 passes'], ['Vanity and faucet', 'Bathroom floor', 'The floor waited for the vanity size, the vanity for the floor height'],
    ['Exterior paint', 'Siding repair', 'Paint waited on the siding decision and the reverse; stopped after 3 passes'], ['Furnace', 'Ductwork', 'Each needed the other\'s size first; stopped after 3 passes']];
  var CLASH = [['Remove and dispose of the old countertop', ['Countertops', 'Cabinets']], ['Patch and paint around the new vanity', ['Bathroom', 'Painting']], ['Shut off and cap the water line', ['Plumbing', 'Kitchen']]];
  var FAIL = ['A photo could not be read again', 'The run stopped at the quantity step', 'A product in the draft has no price'];
  /* Accepted alternatives are Sam's "Valid alternative" grades on lab-house decisions (PDF glossary, 34) */
  function altGrades(){
    var g = C.get('grades', {}) || {}, out = [];
    Object.keys(g).forEach(function(k){
      if(!g[k] || g[k].v !== 'alt') return;
      var parts = k.split('|'), ids = parts[0].split(':'), h = A.get ? A.get(ids[0]) : A.all().filter(function(x){ return x.id === ids[0]; })[0];
      if(!h || h.owner !== C.LAB_OWNER) return;
      var it = null; A.estimate(h).rooms.forEach(function(r){ r.items.forEach(function(x){ if(String(x.id) === ids[1]) it = x; }); }); if(!it) return;
      var pk = parts[2] || 'S', ch = it.pk && it.pk[pk];
      out.push({key:parts[0] + '|' + pk, hid:h.id, house:A.addr(h), line:it.name, pk:pk, ran:ch ? ch[0] : it.name, accepted:g[k].note || 'Graded as a valid alternative', by:g[k].by || 'Sam', at:g[k].at});
    });
    return out;
  }
  /* Two sample "Valid alternative" grades on Sam's lab houses, so grading and the back-test show the same thing */
  C.btEnsureAltGrades = function(){
    var g = C.get('grades', {}) || {}, lab = C.btHouses('lab'), ids = lab.map(function(h){ return h.id; });
    if(Object.keys(g).some(function(k){ return g[k] && g[k].v === 'alt' && ids.indexOf(k.split(':')[0]) > -1; })) return;
    var notes = [[/cabinet/i, 'Painting fronts and boxes is also right when the boxes are sound'], [/door/i, 'Refinishing slabs with new hardware is also right for solid doors']];
    lab.slice(0, 2).forEach(function(h, i){
      var it = null; A.estimate(h).rooms.forEach(function(r){ r.items.forEach(function(x){ if(!it && notes[i][0].test(x.name)) it = x; }); });
      if(it) g[h.id + ':' + it.id + '|dec|S'] = {v:'alt', note:notes[i][1], by:'Sam', at:Date.now() - 16 * DAY};
    });
    C.set('grades', g);
  };
  /* One run: who, the house set, the published versions and drafts tested, and its status; per house the result and
     the Low and High of each package before and after; findings (double charges, skipped parts, broken links, changed
     totals) with their package; dependency cycles (DP-010), clashing tasks, and the accepted alternatives that won.
     A failed house is marked and the others continue (PDF, background jobs).
     o: {set, at, instant, by, profile ('clean' | 'rich'), prior (earlier runs, for how often an alternative won)} */
  C.backtest = function(seedStr, draftIds, o){
    o = o || {}; var set = o.set === 'lab' ? 'lab' : 'all', r = rnd(seedStr), at = o.at || Date.now(), prof = o.profile || '';
    var P = prof === 'clean' ? {fail:0, find:.45, bad:0, cyc:0, clash:.15} : prof === 'rich' ? {fail:.25, find:.95, bad:.55, cyc:.2, clash:.4} : {fail:.08, find:.55, bad:.3, cyc:.06, clash:.2};
    var hs = C.btHouses(set), houses = [], f = [], cycles = [], clashes = [], alts = [];
    var units = hs.map(function(h){ return {hid:h.id, addr:A.addr(h), place:A.place(h), lab:h.owner === C.LAB_OWNER, est:A.estimate(h), k:1}; });
    if(set === 'all' && hs.length) SUPPLIED.forEach(function(x, i){ units.push({hid:null, addr:x[0], place:x[1], lab:false, supplied:true, est:A.estimate(hs[i % hs.length]), k:x[2]}); });
    var sc = function(v, k){ return Math.round(v * k / 10) * 10; };
    var bad = [['skip','Skipped part'],['dbl','Double charge'],['broken','Broken link']];
    units.forEach(function(u){
      var h = {id:u.hid}, est = u.est, tot = totals(est), lab = u.lab;
      PKS.forEach(function(q){ tot[q[0]] = [sc(tot[q[0]][0], u.k), sc(tot[q[0]][1], u.k)]; });
      var row = {hid:u.hid, addr:u.addr, place:u.place, lab:lab, supplied:!!u.supplied, before:tot, after:JSON.parse(JSON.stringify(tot)), result:'same', n:0};
      if(!lab && r() < P.fail){ row.result = 'failed'; row.reason = FAIL[Math.floor(r() * FAIL.length)]; row.after = null; houses.push(row); return; }
      var k = 0, max = prof === 'rich' ? 3 : 2;
      while(k < max && r() < (k ? P.find * .5 : P.find)){
        k++;
        var isBad = r() < P.bad, t = isBad ? bad[Math.floor(r() * bad.length)] : ['changed', 'Total changed'];
        var room = est.rooms[Math.floor(r() * est.rooms.length)], it = room.items[Math.floor(r() * room.items.length)];
        var pk = PKS[r() < .25 ? 0 : r() < .6 ? 1 : 2][0], p = (it.pk && it.pk[pk]) || [0, 600, 1100], lo = sc(p[1] || 600, u.k), hi = sc(p[2] || 1100, u.k);
        var d = Math.round((r() - .3) * (pk === 'P' ? 1400 : 700) / 10) * 10 || 40;
        f.push({type:t[0], label:t[1], house:row.addr, hid:h.id, line:it.name, pk:pk, before:[lo, hi], after:[lo + d, hi + d]});
        if(t[0] === 'changed'){ row.after[pk] = [row.after[pk][0] + d, row.after[pk][1] + d]; if(row.result === 'same') row.result = 'changed'; } else { row.result = 'problem'; row.n++; }
      }
      if(r() < P.cyc){ var cy = CYC[Math.floor(r() * CYC.length)]; cycles.push({house:row.addr, hid:h.id, rule:'DP-010', a:cy[0], b:cy[1], note:cy[2]}); }
      if(r() < P.clash){ var cl = CLASH[Math.floor(r() * CLASH.length)]; clashes.push({house:row.addr, hid:h.id, task:cl[0], types:cl[1], kept:'Kept once, under ' + cl[1][0]}); }
      houses.push(row);
    });
    /* Accepted alternatives: Sam's graded alternatives for the lab houses in this run that the run landed on */
    var labIds = houses.filter(function(h){ return h.lab && h.result !== 'failed'; }).map(function(h){ return h.hid; }), prior = o.prior || [];
    altGrades().forEach(function(a){
      if(labIds.indexOf(a.hid) < 0 || r() > .75) return;
      var before = prior.filter(function(b){ return (b.alts || []).some(function(x){ return x.key === a.key; }); }).length;
      alts.push(Object.assign({}, a, {wins:before + 1}));
    });
    var res = {changed:0, skip:0, dbl:0, broken:0}; f.forEach(function(x){ res[x.type]++; });
    res.failed = houses.filter(function(h){ return h.result === 'failed'; }).length; res.cycles = cycles.length; res.clash = clashes.length; res.alt = alts.length;
    var order = {failed:0, problem:1, changed:2, same:3}; houses.sort(function(a, b){ return order[a.result] - order[b.result]; });
    var dur = o.instant ? 0 : o.dur || Math.max(4000, houses.length * 400);
    return {v:4, id:C.uid('bt'), at:at, doneAt:at + dur, by:o.by || (C.me() || {}).name || 'Sam', set:set, versions:C.versionsAt(at), drafts:draftIds || [], houses:houses.length, list:houses, res:res, findings:f, cycles:cycles, clashes:clashes, alts:alts};
  };
  /* Clean: no double charges, nothing skipped, links intact (the milestone gate), no failed house and no cycle */
  C.btClean = function(b){ var r = b.res; return !r.dbl && !r.skip && !r.broken && !r.failed && !r.cycles; };
  C.btRunning = function(b){ return b.doneAt && Date.now() < b.doneAt; };
  C.btDone = function(b){ return b.doneAt && b.doneAt > b.at ? Math.min(b.houses, Math.floor((Date.now() - b.at) / (b.doneAt - b.at) * b.houses)) : b.houses; };
  /* The lab-house gate (PROJECT, TESTING): zero double charges, no skipped parts, links intact, every lab house ran */
  C.btGate = function(b){
    var lab = (b.list || []).filter(function(h){ return h.lab; }); if(!lab.length) return null;
    var badN = lab.filter(function(h){ return h.result === 'failed' || h.result === 'problem'; }).length;
    return {pass:!badN, n:lab.length, ok:lab.length - badN};
  };
  C.btLine = function(b){ var r = b.res; return b.houses + ' houses · ' + (r.failed ? r.failed + ' failed · ' : '') + (r.dbl ? r.dbl + ' double charge' + (r.dbl > 1 ? 's' : '') : 'no double charges') + ' · ' + (r.skip ? r.skip + ' skipped' : 'nothing skipped') + ' · ' + (r.broken ? r.broken + ' broken link' + (r.broken > 1 ? 's' : '') : 'no broken links') + ' · ' + r.changed + ' total' + (r.changed === 1 ? '' : 's') + ' changed'; };
  /* Sample history: fifteen runs over thirty days by Sam and two staff, oldest first so alternatives count their wins,
     and one still replaying the full set in the background */
  function samples(){
    var ds = C.drafts(), find = function(re){ var d = ds.filter(function(x){ return re.test(x.title); })[0]; return d ? [d.id] : []; };
    var plan = [
      [29 * DAY + 2 * 3600000, 'lab', [], 'clean', 'Sam'],
      [27 * DAY + 5 * 3600000, 'all', [], '', 'Sam'],
      [24 * DAY + 3 * 3600000, 'all', [], 'rich', 'Dana Reyes'],
      [21 * DAY + 6 * 3600000, 'lab', [], '', 'Marcus Hill'],
      [18 * DAY + 4 * 3600000, 'all', [], 'clean', 'Sam'],
      [15 * DAY + 2 * 3600000, 'all', [], '', 'Marcus Hill'],
      [12 * DAY + 3 * 3600000, 'all', find(/Roof/), '', 'Sam'],
      [10 * DAY + 7 * 3600000, 'lab', find(/Roof/), 'clean', 'Dana Reyes'],
      [8 * DAY + 5 * 3600000, 'lab', [], 'rich', 'Sam'],
      [5 * DAY + 2 * 3600000, 'all', [], '', 'Dana Reyes'],
      [3 * DAY + 4 * 3600000, 'lab', find(/Room template: Kitchen/), 'clean', 'Sam'],
      [DAY + 6 * 3600000, 'lab', find(/Cabinetry threshold/), 'clean', 'Sam'],
      [3 * 3600000, 'all', find(/Cabinetry threshold/), '', 'Sam'],
      [25 * 60000, 'all', find(/LVP flooring/), 'rich', 'Marcus Hill'],
      [150000, 'all', find(/Water heater/), '', 'Marcus Hill', 22 * 60000]
    ], out = [], t0 = Date.now();
    plan.forEach(function(x, i){ out.push(C.backtest('sample-' + i, x[2], {set:x[1], at:t0 - x[0], instant:!x[5], dur:x[5], by:x[4], profile:x[3], prior:out.slice()})); });
    /* The drafts in the queue show their latest run */
    ds.forEach(function(d){ var run = out.filter(function(b){ return b.drafts.indexOf(d.id) > -1; }).pop(); if(run && d.status === 'queued') C.setDraft(d.id, {bt:{id:run.id, at:run.doneAt, clean:C.btClean(run), line:C.btLine(run)}}); });
    return out.reverse();
  }
  /* Runs saved before this version are replaced by the sample history */
  C.backtests = function(){
    var l = C.get('backtests', []) || [];
    if(l.some(function(b){ return b.v === 4; })) return l;
    C.btEnsureAltGrades();
    var out = samples();
    out.sort(function(a, b){ return b.at - a.at; });
    C.set('backtests', out);
    return out;
  };

  C.SEEDS.push(function(){
    var d1 = {id:C.uid('d'), status:'queued', area:'sheets', ref:'CB', title:'Condition sheet: Cabinetry threshold', summary:'Confidence threshold 70 to 75', after:{threshold:75}, why:'Too many dark kitchen photos passed', by:'Sam', at:now - DAY - 2 * 3600000};
    var d2 = {id:C.uid('d'), status:'queued', area:'rates', ref:'0', title:'Rate: LVP flooring, sample region', summary:'Low and High per sq ft: $6.50 to $10.50 becomes $6.80 to $10.90', after:{lo:6.8, hi:10.9}, why:'November supplier list', by:'Staff (staff@demo.ri)', at:now - 5 * 3600000};
    var d3 = {id:C.uid('d'), status:'queued', area:'guidance', ref:'Water heater', title:'Guidance: Water heater', summary:'Text rewritten, typical range unchanged', after:null, why:'Plainer wording for the age check', by:'Sam', at:now - 50 * 60000};
    C.set('drafts', [d3, d2, d1, {id:C.uid('d'), status:'published', area:'templates', ref:'kitchen', title:'Room template: Kitchen', summary:'Kitchen lighting usual count set to 4 to 6', why:'', by:'Sam', at:now - 4 * DAY, doneAt:now - 3 * DAY, doneBy:'Sam', note:'Back-test clean'}, {id:C.uid('d'), status:'discarded', area:'guidance', ref:'Roof', title:'Guidance: Roof', summary:'Shorter text', by:'Sam', at:now - 7 * DAY, doneAt:now - 6 * DAY, doneBy:'Sam', note:'Wording not final'}]);
  });

  /* ---------- Publish queue (APP_FLOW 7 and Flow 7, BACKLOG M3-17 and M3-21, SECURITY 3.3, SCHEMA 10.1) ----------
     Sam opens this to clear the queue. Each change shows where it is in the flow (saved, back-tested, decided, live),
     what it changes value by value, why, and which version it makes. Only Sam publishes or discards, each with a note.
     Mobile first: the list, then one change per screen with the decision at the thumb. Wide screens show both side by side. */
  var GU_N = {look:'What to look for', life:'Typical lifespan', lo:'Low', hi:'High', inspect:'Next step', text:'Wording'};
  var KEY_N = {lo:'Low', hi:'High', threshold:'Confidence threshold', img:'Photo', name:'Name', unit:'Unit', src:'Source', link:'Link'};
  /* A photo is shown as a picture, never as its file text (an uploaded photo is a long data address) */
  var IMG = '\u0000img:';
  function cell(v){
    v = v == null ? 'Not set' : String(v);
    if(v.indexOf(IMG) !== 0) return '<span>' + RI.esc(v) + '</span>';
    var src = v.slice(IMG.length); if(!/^(data:image\/|https?:|\/)/.test(src)) src = RI.img(src);
    return '<img class="qu-img" src="' + RI.esc(src) + '" alt="Product photo" loading="lazy">';
  }
  function amt(n){ return n == null || n === '' ? 'Not set' : '$' + (Math.round(n) === +n ? Math.round(n).toLocaleString('en-US') : (+n).toFixed(2)); }
  function flat(area, o){
    var out = {}; if(o == null) return out;
    if(o.fields){ Object.keys(o.fields).forEach(function(k){ var v = o.fields[k]; out[GU_N[k] || k] = k === 'lo' || k === 'hi' ? amt(v) : (v == null || v === '' ? 'Not set' : String(v)); }); return out; }
    if(o.items){ o.items.forEach(function(x){ var nm = (C.CATALOG && C.CATALOG[x.k] ? C.CATALOG[x.k][1] : x.k); out[nm] = x.lo == null ? 'Not set' : (x.lo === x.hi ? String(x.lo) : x.lo + ' to ' + x.hi); }); return out; }
    if(Array.isArray(o)){ o.forEach(function(x){ out[x.k] = x.v + ' ' + (x.unit || ''); }); return out; }
    Object.keys(o).forEach(function(k){ var v = o[k], nm = KEY_N[k] || k.charAt(0).toUpperCase() + k.slice(1);
      out[nm] = k === 'lo' || k === 'hi' ? amt(v) : k === 'img' ? (v ? IMG + v : 'No photo') : (v == null || v === '' ? 'Not set' : String(v)); });
    return out;
  }
  /* Only the values that differ, old above new on a phone and side by side on wider screens */
  function diffHTML(area, was, now, wasL, nowL){
    var a = flat(area, was), b = flat(area, now), keys = Object.keys(a).concat(Object.keys(b).filter(function(k){ return !(k in a); }));
    var rows = keys.filter(function(k){ return a[k] !== b[k]; });
    if(!rows.length) return '<p class="qu-quiet">No values differ from what is live.</p>';
    return '<ol class="qu-diff">' + rows.map(function(k){
      return '<li><b class="qu-dk">' + RI.esc(k) + '</b><div class="qu-dv"><p class="qu-was"><small>' + wasL + '</small>' + cell(a[k]) + '</p>' +
        '<span class="qu-to" aria-hidden="true">' + RI.icon('arrow','i-sm') + '</span><p class="qu-now"><small>' + nowL + '</small>' + cell(b[k]) + '</p></div></li>'; }).join('') + '</ol>';
  }
  function live(d){ return C.BEFORE[d.area] ? C.BEFORE[d.area](d) : null; }
  /* Recovery (SECURITY, RUNBOOK): the earlier values come back as a new draft, and go live as a new version once Sam publishes */
  function canRestore(d){
    return d.status === 'published' && d.before && d.fromV != null && !C.retiredBy(d) && !C.draftFor(d.area, d.ref) &&
      (C.can('publish') || C.can(C.AREA_PERM[d.area] || 'rulebook.edit'));
  }
  /* Where each kind of change is edited */
  var EDITOR = {templates:function(r){ return '#/room-templates?room=' + encodeURIComponent(r); }, sheets:function(r){ return '#/condition-sheets?fam=' + encodeURIComponent(r); }, rules:function(r){ return '#/rules/' + encodeURIComponent(r); },
    products:function(){ return '#/products'; }, rates:function(){ return '#/rates'; }, guidance:function(){ return '#/guidance'; }, resources:function(){ return '#/resources'; }};
  /* Where a waiting change stands: the back-test decides what Sam does next */
  var STAGE = {ready:['Ready to publish', 'Back-test clean', 'ok', 'check'], problems:['Found problems', 'Read the report first', 'warn', 'warn'], running:['Back-test running', 'Result shows when done', 'info', 'refresh'], untested:['Not back-tested', 'Run one before publishing', 'none', 'clock']};
  var STAGES = ['ready', 'problems', 'running', 'untested'];
  function btRun(d){ if(!d.bt) return null; var b = C.backtests().filter(function(x){ return x.id === d.bt.id; })[0]; return b && C.btRunning(b) ? b : null; }
  function stage(d){ return d.status !== 'queued' ? d.status : btRun(d) ? 'running' : !d.bt ? 'untested' : d.bt.clean ? 'ready' : 'problems'; }
  function vers(d){
    if(d.status === 'queued'){ var w = live(d); return w && w.v != null ? [w.v, w.v + 1] : null; }
    return d.toV != null ? [d.fromV, d.toV] : null;
  }
  function verPill(d){ var v = vers(d); return v ? '<span class="qu-v">v' + v[0] + RI.icon('arrow','i-sm') + 'v' + v[1] + '</span>' : ''; }
  function dayOf(t){ var a = new Date(t), b = new Date(), y = new Date(Date.now() - 86400000); a = a.toDateString(); return a === b.toDateString() ? 'Today' : a === y.toDateString() ? 'Yesterday' : C.date(t); }
  var quMQ = window.matchMedia('(max-width: 899px)');
  function quOnMQ(){ if(/^#\/publish/.test(location.hash)) C.render(); }
  if(quMQ.addEventListener) quMQ.addEventListener('change', quOnMQ); else if(quMQ.addListener) quMQ.addListener(quOnMQ);

  C.route('/publish', function(view){
    C.backtests(); /* the sample runs attach their results to the waiting drafts */
    var q = C.query(), tab = ['queued', 'published', 'discarded'].indexOf(q.tab) > -1 ? q.tab : 'queued';
    var st = {stage:STAGES.indexOf(q.st) > -1 ? q.st : 'all', area:AREA[q.a] ? q.a : 'all'}, sel = q.id || null;
    var phone = quMQ.matches, isSam = C.can('publish'), esc = RI.esc;
    function inTab(d, t){ return t === 'discarded' ? (d.status === 'discarded' || d.status === 'replaced') : d.status === t; }
    function tabOf(d){ return d.status === 'replaced' ? 'discarded' : d.status; }
    function find(id){ return C.drafts().filter(function(x){ return x.id === id; })[0] || null; }
    function mineIn(t){ return C.drafts().filter(function(d){ return inTab(d, t) && C.mine(d); }); }
    function hash(o){
      o = Object.assign({tab:tab, st:st.stage, a:st.area, id:sel}, o || {});
      var p = ['tab=' + o.tab]; if(o.tab === 'queued' && o.st && o.st !== 'all') p.push('st=' + o.st); if(o.a && o.a !== 'all') p.push('a=' + o.a); if(o.id) p.push('id=' + o.id);
      return '#/publish?' + p.join('&');
    }
    /* The list in the order Sam works through it: waiting changes by stage, oldest first; history newest first */
    function items(){
      var l = mineIn(tab).filter(function(d){ return st.area === 'all' || d.area === st.area; });
      if(tab === 'queued'){
        if(st.stage !== 'all') l = l.filter(function(d){ return stage(d) === st.stage; });
        return l.sort(function(a, b){ return (STAGES.indexOf(stage(a)) - STAGES.indexOf(stage(b))) || (a.at - b.at); });
      }
      return l.sort(function(a, b){ return (b.doneAt || b.at) - (a.doneAt || a.at); });
    }

    /* A phone with one change open shows only that change, with the decision at the bottom */
    if(phone && sel && find(sel) && C.mine(find(sel))){
      var d0 = find(sel), ar0 = AREA[d0.area] || ['Change', 'file'];
      view.innerHTML = C.page({back:[hash({id:null}), 'Publish queue'], kicker:ar0[0], title:esc(d0.title), body:'<div id="qu-root" class="qu-one">' + detail(d0, false) + '</div>'});
      wire(view.querySelector('#qu-root')); RI.fillIcons(view); liveTick(); return;
    }

    view.innerHTML = C.page({kicker:'Changes', title:'Publish queue',
      sub:isSam ? 'Every change to the rulebook, prices, templates and guidance waits here. Back-test it, read what it changes, then publish or discard it with a note.' : 'Changes in your areas wait here until Sam publishes or discards them.',
      body:'<div id="qu-root">' + C.seg('pq-tab', [['queued', 'Waiting', mineIn('queued').length], ['published', 'Published', mineIn('published').length], ['discarded', 'Discarded', mineIn('discarded').length]], tab) +
        (isSam ? '' : '<div class="c-mt">' + C.note('You see the changes in your own areas. Only Sam publishes or discards.', 'lock') + '</div>') +
        '<div id="qu-tiles"></div><div class="qu-cols" id="qu-cols"><aside class="qu-side" id="qu-side" aria-label="Changes"></aside><section class="qu-main" id="qu-main" aria-live="polite"></section></div></div>'});
    var root = view.querySelector('#qu-root');
    wire(root); draw();

    function draw(){ ensureSel(); tiles(); side(); main(); liveTick(); }
    /* On a wide screen one change is always open: the chosen one, or the first in the list */
    function ensureSel(){ if(phone) return; var list = items(); if(!sel || !list.some(function(x){ return x.id === sel; })){ sel = list[0] ? list[0].id : null; history.replaceState(null, '', hash()); } }

    /* Where the queue stands, one tile per stage; a tile filters the list */
    function tiles(){
      var el = doc.getElementById('qu-tiles'); if(!el) return;
      if(tab !== 'queued'){ el.innerHTML = ''; return; }
      var all = mineIn('queued'); if(!all.length){ el.innerHTML = ''; return; }
      var oldest = all.slice().sort(function(a, b){ return a.at - b.at; })[0];
      el.innerHTML = '<div class="qu-tiles" role="group" aria-label="Filter by stage">' + STAGES.map(function(s){
        var n = all.filter(function(d){ return stage(d) === s; }).length, on = st.stage === s;
        return '<button type="button" class="qu-tile t-' + STAGE[s][2] + (on ? ' on' : '') + '" data-st="' + s + '" aria-pressed="' + on + '"' + (n || on ? '' : ' disabled') + '><span class="qu-tile-i">' + RI.icon(STAGE[s][3], 'i-sm') + '</span><b>' + n + '</b><span>' + STAGE[s][0] + '</span></button>';
      }).join('') + '</div><p class="qu-oldest">' + RI.icon('clock', 'i-sm') + '<span>Waiting longest: <a href="' + hash({id:oldest.id, st:'all'}) + '" data-pick="' + oldest.id + '">' + esc(oldest.title) + '</a>, saved ' + C.ago(oldest.at) + '.</span></p>';
    }

    function row(d){
      var ar = AREA[d.area] || ['Change', 'file'], s = stage(d), when, tag;
      if(d.status === 'queued'){ tag = '<span class="qu-st s-' + STAGE[s][2] + '">' + (s === 'running' ? '<span class="pq-spin" aria-hidden="true"></span>' : RI.icon(STAGE[s][3], 'i-sm')) + STAGE[s][0] + '</span>'; when = esc(d.by) + ' · ' + C.ago(d.at); }
      else { var r = C.retiredBy(d); tag = r ? C.lbl('retired') : d.status === 'published' && d.toV ? C.lbl('published', 'v' + d.toV) : C.lbl(d.status); when = d.status === 'replaced' ? 'Never went live' : esc(d.doneBy || '') + ' · ' + C.ago(d.doneAt); }
      return '<a class="qu-row' + (d.id === sel && !phone ? ' on' : '') + '" href="' + hash({id:d.id}) + '" data-pick="' + d.id + '"' + (d.id === sel && !phone ? ' aria-current="true"' : '') + '>' +
        '<span class="qu-ic">' + RI.icon(ar[1], 'i-sm') + '</span><span class="qu-rb"><span class="qu-rk">' + ar[0] + (vers(d) ? ' · v' + vers(d)[0] + ' to v' + vers(d)[1] : '') + '</span><b>' + esc(d.title) + '</b>' +
        '<span class="qu-rm">' + tag + '<span>' + when + '</span></span></span><span class="qu-chev">' + RI.icon('chev', 'i-sm') + '</span></a>';
    }
    function side(){
      var el = doc.getElementById('qu-side'), list = items(), all = mineIn(tab), areas = {};
      all.forEach(function(d){ areas[d.area] = (areas[d.area] || 0) + 1; });
      var filt = '<div class="qu-filt"><label class="c-select sm"><select id="qu-area" aria-label="Area"><option value="all">All areas (' + all.length + ')</option>' +
        Object.keys(AREA).filter(function(k){ return areas[k] || st.area === k; }).map(function(k){ return '<option value="' + k + '"' + (st.area === k ? ' selected' : '') + '>' + AREA[k][0] + ' (' + (areas[k] || 0) + ')</option>'; }).join('') + '</select></label>' +
        (st.stage !== 'all' || st.area !== 'all' ? '<button type="button" class="linkbtn" id="qu-clear">Show all</button>' : '') + '<span class="qu-n">' + list.length + ' shown</span></div>';
      if(!list.length){
        var none = !all.length ? (tab === 'queued' ? 'Nothing is waiting. A draft saved on any editor appears here.' : tab === 'published' ? 'Nothing has been published yet.' : 'Nothing discarded or replaced.') : 'No changes match this filter.';
        el.innerHTML = (all.length ? filt : '') + '<div class="c-empty big">' + RI.icon(tab === 'queued' && !all.length ? 'check' : 'info') + '<p>' + none + '</p></div>';
        doc.getElementById('qu-cols').classList.add('solo'); RI.fillIcons(el); return;
      }
      doc.getElementById('qu-cols').classList.remove('solo');
      var groups = [], key = function(d){ return tab === 'queued' ? stage(d) : dayOf(d.doneAt || d.at); };
      list.forEach(function(d){ var k = key(d), g = groups[groups.length - 1]; if(!g || g.k !== k){ g = {k:k, l:[]}; groups.push(g); } g.l.push(d); });
      el.innerHTML = filt + groups.map(function(g){
        var head = tab === 'queued' ? STAGE[g.k][0] + '<small>' + STAGE[g.k][1] + '</small>' : g.k;
        return '<section class="qu-grp"><h2 class="qu-gh">' + head + '<span>' + g.l.length + '</span></h2><div class="qu-list">' + g.l.map(row).join('') + '</div></section>';
      }).join('');
      RI.fillIcons(el);
    }
    function main(){
      var el = doc.getElementById('qu-main'); if(phone){ el.innerHTML = ''; el.hidden = true; return; }
      var d = sel ? find(sel) : null;
      el.innerHTML = d ? detail(d, true) : ''; RI.fillIcons(el);
    }
    function pick(id){
      if(phone){ C.go(hash({id:id})); return; }
      sel = id; history.replaceState(null, '', hash());
      root.querySelectorAll('.qu-row').forEach(function(r){ var on = r.getAttribute('data-pick') === id; r.classList.toggle('on', on); if(on) r.setAttribute('aria-current', 'true'); else r.removeAttribute('aria-current'); });
      main(); liveTick();
      var m = doc.getElementById('qu-main'); if(m.getBoundingClientRect().top < 70) m.scrollIntoView({block:'start'});
    }

    /* ---------- One change ---------- */
    function steps(d){
      var b = btRun(d), r = C.retiredBy(d), v = vers(d), out = [];
      out.push(['done', 'Draft saved', esc(d.by) + ', ' + C.ago(d.at)]);
      out.push(d.status === 'queued' && b ? ['run', 'Back-test', '<span data-live="' + b.id + '">' + C.btDone(b) + ' of ' + b.houses + '</span> houses'] : b ? ['todo', 'Back-test', 'Not finished'] :
        d.bt ? [d.bt.clean ? 'done' : 'warn', 'Back-test', d.bt.clean ? 'Clean' : 'Found problems'] : ['todo', 'Back-test', d.status === 'queued' ? 'Not run yet' : 'Not run']);
      out.push(d.status === 'queued' ? ['now', 'Sam decides', isSam ? 'Your turn' : 'Waiting for Sam'] : d.status === 'published' ? ['done', 'Published', esc(d.doneBy || 'Sam') + ', ' + C.ago(d.doneAt)] :
        d.status === 'discarded' ? ['off', 'Discarded', esc(d.doneBy || 'Sam') + ', ' + C.ago(d.doneAt)] : ['off', 'Replaced', 'By a newer draft']);
      out.push(d.status === 'queued' ? ['todo', 'Goes live', v ? 'As version ' + v[1] : d.area === 'resources' ? 'For builders' : 'When published'] :
        d.status === 'published' ? (r ? ['off', 'Retired', 'Version ' + (r.toV || 'newer') + ' is live'] : ['done', 'Live', v ? 'Version ' + v[1] + ', v' + v[0] + ' kept' : 'Now']) : ['off', 'Never live', 'Nothing changed']);
      return '<ol class="qu-steps" aria-label="Where this change is">' + out.map(function(x, i){
        var dot = x[0] === 'done' ? RI.icon('check', 'i-sm') : x[0] === 'warn' ? RI.icon('warn', 'i-sm') : x[0] === 'run' ? '<span class="pq-spin" aria-hidden="true"></span>' : x[0] === 'off' ? RI.icon('minus', 'i-sm') : String(i + 1);
        return '<li class="qs-' + x[0] + '"' + (x[0] === 'now' ? ' aria-current="step"' : '') + '><span class="qs-dot">' + dot + '</span><span class="qs-t"><b>' + x[1] + '</b><small>' + x[2] + '</small></span></li>';
      }).join('') + '</ol>';
    }
    function changes(d){
      if(d.area === 'resources') return '<p class="qu-quiet">A new builder document. Builders see it once it is published.</p>';
      if(d.status === 'published'){
        if(d.before && d.after && d.toV != null) return diffHTML(d.area, d.before, d.after, 'Version ' + d.fromV, 'Version ' + d.toV);
        return '<p class="qu-quiet">' + esc(d.summary || 'Published.') + '</p>';
      }
      var w = live(d);
      if(!d.after || !w) return '<p class="qu-quiet">' + esc(d.summary || 'This draft carries no values.') + '</p>';
      return diffHTML(d.area, w.before, d.after, 'Live now' + (w.v != null ? ', v' + w.v : ''), d.status === 'queued' ? 'This draft' : 'This draft, never live');
    }
    function btBox(d){
      var b = btRun(d), canRun = C.can('backtests.run') && d.status === 'queued';
      if(b && d.status !== 'queued') return '<p class="qu-quiet">A back-test was still running when this was decided. <a href="#/backtests/' + b.id + '">Watch it</a></p>';
      if(b) return '<div class="qu-bt run" id="qu-bt"><span class="pq-spin" aria-hidden="true"></span><span class="qu-bt-t"><b>Back-test running</b><small><span data-live="' + b.id + '">' + C.btDone(b) + ' of ' + b.houses + '</span> houses replayed. The result shows here when the last house is done.</small></span><a class="btn btn-secondary btn-sm" href="#/backtests/' + b.id + '">' + RI.icon('eye', 'i-sm') + 'Watch</a></div>';
      if(d.bt) return '<div class="qu-bt ' + (d.bt.clean ? 'ok' : 'warn') + '" id="qu-bt">' + RI.icon(d.bt.clean ? 'check' : 'warn', 'i-sm') + '<span class="qu-bt-t"><b>' + (d.bt.clean ? 'Back-test clean' : 'Back-test found problems') + ' · ' + C.ago(d.bt.at) + '</b><small>' + esc(d.bt.line) + '</small></span>' +
        '<span class="qu-bt-a"><a class="btn btn-secondary btn-sm" href="#/backtests/' + d.bt.id + '">' + RI.icon('file', 'i-sm') + 'Report</a>' + (canRun ? '<button type="button" class="btn btn-secondary btn-sm" data-bt="' + d.id + '">' + RI.icon('refresh', 'i-sm') + 'Run again</button>' : '') + '</span></div>';
      if(d.status !== 'queued') return '<p class="qu-quiet">No back-test was run for this change.</p>';
      return '<div class="qu-bt none" id="qu-bt">' + RI.icon('clock', 'i-sm') + '<span class="qu-bt-t"><b>Not back-tested yet</b><small>Replays ' + C.btCount('all') + ' priced houses with this draft in place: double charges, skipped parts, broken links, and the before and after.</small></span>' +
        (canRun ? '<span class="qu-bt-a"><button type="button" class="btn btn-primary btn-sm" data-bt="' + d.id + '">' + RI.icon('refresh', 'i-sm') + 'Run a back-test</button></span>' : '') + '</div>';
    }
    function earlier(d){
      var l = C.drafts().filter(function(x){ return x.area === d.area && x.ref === d.ref && x.id !== d.id && C.mine(x); }).sort(function(a, b){ return (b.doneAt || b.at) - (a.doneAt || a.at); }).slice(0, 5);
      if(!l.length) return '';
      return '<section class="qu-sec"><h3>Other changes to this item</h3><ol class="qu-hist">' + l.map(function(x){
        var r = C.retiredBy(x), lb = x.status === 'queued' ? C.lbl('queued') : r ? C.lbl('retired') : x.status === 'published' && x.toV ? C.lbl('published', 'v' + x.toV) : C.lbl(x.status);
        return '<li><a href="' + hash({tab:tabOf(x), id:x.id, st:'all', a:'all'}) + '"><span class="qu-hist-h">' + lb + '<small>' + C.date(x.doneAt || x.at) + ' · ' + esc(x.doneBy || x.by) + '</small></span><span>' + esc(x.summary || x.title) + '</span></a></li>';
      }).join('') + '</ol></section>';
    }
    function detail(d, head){
      var ar = AREA[d.area] || ['Change', 'file'], ed = EDITOR[d.area] ? EDITOR[d.area](d.ref) : null, r = C.retiredBy(d);
      var lb = d.status === 'queued' ? '<span class="qu-st s-' + STAGE[stage(d)][2] + '">' + STAGE[stage(d)][0] + '</span>' : r ? C.lbl('retired') : d.status === 'published' && d.toV ? C.lbl('published', 'v' + d.toV) : C.lbl(d.status);
      var h = '<article class="qu-det" data-id="' + d.id + '">' +
        (head ? '<header class="qu-dh"><span class="qu-ic lg">' + RI.icon(ar[1], 'i-sm') + '</span><div><p class="c-kicker">' + ar[0] + '</p><h2>' + esc(d.title) + '</h2></div></header>' : '') +
        '<div class="qu-tags">' + lb + verPill(d) + (ed ? '<a class="btn btn-secondary btn-sm qu-ed" href="' + ed + '">' + RI.icon('tool', 'i-sm') + 'Open in the editor</a>' : '') + '</div>' +
        (d.summary ? '<p class="qu-sum">' + esc(d.summary) + '</p>' : '') +
        steps(d) +
        '<section class="qu-sec"><h3>' + (d.status === 'published' ? 'What it changed' : 'What changes') + '</h3>' + changes(d) + '</section>' +
        '<section class="qu-sec"><h3>Why</h3><p class="qu-why">' + C.av(d.by, d.by === 'Sam' ? 'sam' : '') + '<span><b>' + esc(d.by) + '</b><small>Saved ' + C.ago(d.at) + '</small>' + (d.why ? '<q>' + esc(d.why) + '</q>' : '<em>No reason given.</em>') + '</span></p></section>' +
        '<section class="qu-sec"><h3>Back-test</h3>' + btBox(d) + '</section>';
      if(d.status === 'published' || d.status === 'discarded'){
        h += '<section class="qu-sec"><h3>Decision</h3><p class="qu-why">' + C.av(d.doneBy || 'Sam', 'sam') + '<span><b>' + (d.status === 'published' ? 'Published' : 'Discarded') + ' by ' + esc(d.doneBy || 'Sam') + '</b><small>' + C.time(d.doneAt) + '</small>' + (d.note ? '<q>' + esc(d.note) + '</q>' : '<em>No note.</em>') + '</span></p>' +
          (r ? C.note('Retired: version ' + (r.toV || 'a newer one') + ' went live ' + C.ago(r.doneAt) + '. Its values are kept.', 'info') : '') +
          (canRestore(d) ? '<div class="qu-restore"><div><b>Put version ' + d.fromV + ' back</b><small>Makes a new draft with the values of version ' + d.fromV + '. It goes live as version ' + (d.toV + 1) + ' once Sam publishes it.</small></div><button type="button" class="btn btn-secondary btn-sm" data-restore="' + d.id + '">' + RI.icon('refresh', 'i-sm') + 'Make the draft</button></div>' : '') + '</section>';
      }
      if(d.status === 'replaced') h += '<section class="qu-sec"><h3>Decision</h3>' + C.note('A newer draft of the same item replaced this one' + (d.doneAt ? ' ' + C.ago(d.doneAt) : '') + '. It never went live.', 'info') + '</section>';
      h += earlier(d);
      if(d.status === 'queued') h += isSam ? '<div class="qu-bar"><button type="button" class="btn btn-secondary" data-discard="' + d.id + '">' + RI.icon('x', 'i-sm') + 'Discard</button><button type="button" class="btn btn-primary" data-pub="' + d.id + '">' + RI.icon('check', 'i-sm') + (vers(d) ? 'Publish as v' + vers(d)[1] : 'Publish') + '</button></div>'
        : '<div class="qu-bar lock">' + RI.icon('lock', 'i-sm') + '<span>Only Sam publishes or discards. The decision and its note show here.</span></div>';
      return h + '</article>';
    }

    /* A back-test running in the background: count the houses, then show the result */
    var tick = null;
    function liveTick(){
      if(tick) return; var any = function(){ return C.drafts().some(function(d){ return d.status === 'queued' && btRun(d); }); };
      if(!any()) return;
      tick = C.every(function(){
        if(!doc.getElementById('qu-root')){ clearInterval(tick); tick = null; return; }
        doc.querySelectorAll('[data-live]').forEach(function(x){ var b = C.backtests().filter(function(y){ return y.id === x.getAttribute('data-live'); })[0]; if(b) x.textContent = C.btDone(b) + ' of ' + b.houses; });
        if(!any()){ clearInterval(tick); tick = null; if(phone && sel){ C.render(); } else draw(); }
      }, 400);
    }

    function wire(el){
      el.addEventListener('click', function(e){
        var t = e.target.closest('#pq-tab [data-v]'); if(t){ tab = t.getAttribute('data-v'); sel = null; st.stage = 'all'; el.querySelectorAll('#pq-tab [data-v]').forEach(function(x){ x.setAttribute('aria-selected', x === t); }); history.replaceState(null, '', hash()); draw(); return; }
        var ti = e.target.closest('[data-st]'); if(ti){ var s = ti.getAttribute('data-st'); st.stage = st.stage === s ? 'all' : s; sel = null; history.replaceState(null, '', hash()); draw(); return; }
        if(e.target.closest('#qu-clear')){ st.stage = 'all'; st.area = 'all'; history.replaceState(null, '', hash()); draw(); return; }
        var pk = e.target.closest('[data-pick]'); if(pk && !e.metaKey && !e.ctrlKey){ e.preventDefault(); var id = pk.getAttribute('data-pick'); if(pk.closest('.qu-oldest')){ st.stage = 'all'; sel = id; if(phone){ C.go(hash({id:id})); return; } draw(); return; } pick(id); return; }
        var bt = e.target.closest('[data-bt]'); if(bt){ runFor(bt.getAttribute('data-bt')); return; }
        var pub = e.target.closest('[data-pub]'); if(pub){ decide(pub.getAttribute('data-pub'), true); return; }
        var dis = e.target.closest('[data-discard]'); if(dis){ decide(dis.getAttribute('data-discard'), false); return; }
        var rs = e.target.closest('[data-restore]'); if(rs) restore(rs.getAttribute('data-restore'));
      });
      el.addEventListener('change', function(e){ if(e.target.id === 'qu-area'){ st.area = e.target.value; sel = null; history.replaceState(null, '', hash()); draw(); } });
    }
    function after(){ if(phone && sel && find(sel)){ C.render(); return; } draw(); }
    function runFor(id){
      var box = doc.getElementById('qu-bt'), houses = C.btCount('all'), i = 0; if(!box) return;
      box.className = 'qu-bt run'; box.innerHTML = '<span class="pq-spin" aria-hidden="true"></span><span class="qu-bt-t"><b>Replaying houses…</b><small id="qu-n">0 of ' + houses + '</small></span><span class="pq-bar"><i></i></span>';
      var bar = box.querySelector('.pq-bar i'), n = box.querySelector('#qu-n');
      var t = C.every(function(){ i++; n.textContent = i + ' of ' + houses; bar.style.width = (i / houses * 100) + '%'; if(i >= houses){ clearInterval(t);
        var list = C.backtests(), b = C.backtest(id + Date.now(), [id], {instant:true, prior:list.slice().reverse()}); list.unshift(b); C.set('backtests', list);
        C.setDraft(id, {bt:{id:b.id, at:b.at, clean:C.btClean(b), line:C.btLine(b)}}); C.log('Back-test run', b.houses + ' houses replayed with one draft', '', 'backtests');
        RI.toast(C.btClean(b) ? 'Back-test clean.' : 'Back-test found problems. Read the report.', C.btClean(b) ? 'check' : 'warn'); after(); } }, C.reduce ? 10 : 90);
    }
    function decide(id, pub){
      var d = find(id); if(!d) return; var v = vers(d);
      var warn = pub && btRun(d) ? '<p class="notice notice-warn">' + RI.icon('warn') + '<span>The back-test is still running. Its result is not in yet.</span></p>' :
        pub && !d.bt ? '<p class="notice notice-warn">' + RI.icon('warn') + '<span>This draft has no back-test yet. Publishing without one is allowed, but the report shows what it changes across many houses.</span></p>' :
        pub && !d.bt.clean ? '<p class="notice notice-warn">' + RI.icon('warn') + '<span>The last back-test found problems.</span></p>' : '';
      var dlg = C.dialog(pub ? 'Publish this change?' : 'Discard this draft?', '<p><b>' + esc(d.title) + '</b><br><span class="small muted">' + esc(d.summary || '') + '</span></p>' + warn +
        (pub ? '<p class="small muted">' + (v ? 'It goes live as version ' + v[1] + ', and version ' + v[0] + ' is kept. ' : '') + 'New runs use it from now on. Runs already delivered keep the versions they were made with.</p>' : '<p class="small muted">The draft is kept in the history, but never goes live.</p>') +
        '<div class="field" id="pq-nf"><label for="pq-note">Note</label><input class="input" id="pq-note" aria-describedby="pq-nh" placeholder="' + (pub ? 'For example: back-test clean' : 'For example: wording not final') + '"><span class="err" id="pq-ne">' + RI.icon('warn','i-sm') + 'Add a short note. It is kept with the ' + (pub ? 'version' : 'draft') + ' and in the audit log.</span><span class="help" id="pq-nh">Say why, in a few words. Everyone who looks at this change later reads it.</span></div>' +
        '<div class="cta-row" style="justify-content:flex-end"><button type="button" class="btn btn-secondary" data-dlg-close>Cancel</button><button type="button" class="btn ' + (pub ? 'btn-primary' : 'btn-danger') + '" id="pq-go">' + (pub ? 'Publish' : 'Discard') + '</button></div>');
      RI.fillIcons(dlg);
      var nf = dlg.querySelector('#pq-nf'), ni = dlg.querySelector('#pq-note');
      ni.addEventListener('input', function(){ if(ni.value.trim()){ nf.classList.remove('invalid'); ni.removeAttribute('aria-invalid'); } });
      dlg.querySelector('#pq-go').addEventListener('click', function(){ var note = ni.value.trim();
        if(!note){ nf.classList.add('invalid'); ni.setAttribute('aria-invalid', 'true'); ni.setAttribute('aria-describedby', 'pq-ne pq-nh'); ni.focus(); return; }
        /* Next in line, so Sam can keep clearing the queue */
        var list = items(), at = list.map(function(x){ return x.id; }).indexOf(id), next = list[at + 1] || list[at - 1] || null;
        dlg.close(); if(pub) C.publish(id, note); else C.discard(id, note);
        RI.toast(pub ? 'Published' + (v ? ' as version ' + v[1] : '') + '. New runs use it from now on.' : 'Draft discarded.', pub ? 'check' : 'info');
        sel = next ? next.id : null;
        if(phone){ C.go(hash({id:null})); return; }
        history.replaceState(null, '', hash()); C.render(); });
    }
    function restore(id){
      var d = find(id); if(!d || !canRestore(d)) return;
      var sum = 'Back to the values of version ' + d.fromV;
      C.askWhy(d.title, sum + '. Saved as a new draft; it goes live as a new version when Sam publishes it.', function(why){
        var nd = C.addDraft({area:d.area, ref:d.ref, title:d.title, summary:sum, after:C.copy(d.before), why:why});
        RI.toast('Saved as a draft. It waits in the publish queue.', 'check');
        C.go('#/publish?tab=queued&id=' + nd.id);
      });
    }
  }, {nav:'publish', perm:['rulebook.edit', 'pricing.edit', 'content.edit']});

  /* ---------- Back-tests ----------
     List: every run with its house set, what it tested, and its result, or a live bar while it runs in the background.
     Start: choose the house set (lab houses for the milestone check, or every priced house) and the drafts.
     Report: the verdict and the lab-house gate first, then the counts, every house with its Standard total before
     and after, the findings, what the engine rejected (cycles, clashing tasks), and accepted alternatives. */
  var TYPE = {failed:['Failed houses','The replay stopped for this house; the others continued'], dbl:['Double charges','The same task counted twice across work types'], skip:['Skipped parts','A part the template expects that got no decision'], broken:['Broken links','A dependency that points to nothing'], changed:['Changed totals','A package total that moved, with the line that moved it'], alt:['Accepted alternatives','A different answer Sam already accepts for a lab house']};
  var SETS = {lab:['Lab houses', 'Sam\'s lab houses: the milestone check'], all:['Full set', 'Lab houses, priced houses and the properties Sam supplied']};
  var money = function(v){ return v ? C.range(v[0], v[1]) : '<span class="muted">No result</span>'; };
  function verdict(b){
    var g = C.btGate(b), clean = C.btClean(b);
    return '<section class="bt-verdict ' + (clean ? 'ok' : 'bad') + '"><span class="bt-v-ic">' + RI.icon(clean ? 'check' : 'warn') + '</span><div class="bt-v-t"><b>' + (clean ? 'Safe to publish' : 'Fix before publishing') + '</b><span>' +
      (clean ? 'No double charges, nothing skipped, every link intact, and every house ran.' : 'The counts below show what broke. Open a house to see the step.') + '</span></div>' +
      (g ? '<span class="bt-gate ' + (g.pass ? 'ok' : 'bad') + '" title="Zero double charges, no skipped parts, links intact, on every lab house">' + RI.icon(g.pass ? 'check' : 'warn', 'i-sm') + 'Lab houses: ' + (g.pass ? 'pass' : 'fail') + '<small>' + g.ok + ' of ' + g.n + '</small></span>' : '') + '</section>';
  }
  function tested(b, drafts){
    return '<div class="bt-ver"><span class="bt-ver-k">Tested</span>' + b.versions.map(function(v){ return '<span class="bt-chip">' + v[0] + ' <b>' + v[1] + '</b></span>'; }).join('') +
      (drafts.length ? drafts.map(function(d){ return '<span class="bt-chip draft">Draft: ' + RI.esc(d.title) + '</span>'; }).join('') : '<span class="bt-chip off">No drafts: published versions only</span>') + '</div>';
  }
  function resultChips(b){
    if(C.btRunning(b)){ var d = C.btDone(b); return '<span class="bt-live" data-run="' + b.id + '"><span class="pq-spin" aria-hidden="true"></span><span class="bt-live-t">Running · ' + d + ' of ' + b.houses + '</span><span class="pq-bar"><i style="width:' + (d / b.houses * 100).toFixed(0) + '%"></i></span></span>'; }
    var r = b.res;
    return '<span class="bt-f">' + (C.btClean(b) ? '<span class="rel rel-ok">Clean</span>' : '') + (r.failed ? '<span class="bt-n bad">' + r.failed + ' failed</span>' : '') + (r.dbl ? '<span class="bt-n bad">' + r.dbl + ' double</span>' : '') + (r.skip ? '<span class="bt-n bad">' + r.skip + ' skipped</span>' : '') + (r.broken ? '<span class="bt-n bad">' + r.broken + ' broken</span>' : '') + (r.cycles ? '<span class="bt-n bad">' + r.cycles + ' cycle' + (r.cycles > 1 ? 's' : '') + '</span>' : '') + '<span class="bt-n">' + r.changed + ' changed</span></span>';
  }

  C.route('/backtests', function(view){
    var list = C.backtests();
    view.innerHTML = C.page({kicker:'Changes', title:'Back-tests', sub:'Replay many houses with draft versions before Sam publishes. The report shows double charges, skipped parts, broken links and the before and after. A failed house is marked; the others continue.',
      actions:C.can('backtests.run') ? '<button type="button" class="btn btn-primary" id="bt-new">' + RI.icon('refresh','i-sm') + 'Start a back-test</button>' : '',
      body:'<div id="bt-list"></div>' + '<div class="c-mt">' + C.note('A back-test runs in the background. You can leave this page; the run keeps going and its report is here when it is done.') + '</div>'});
    var st = {page:0, per:C.get('bt.per', 10)};
    function draw(){
      var el = view.querySelector('#bt-list'); if(!el) return;
      var pages = Math.max(1, Math.ceil(list.length / st.per)); st.page = Math.min(st.page, pages - 1);
      var shown = list.slice(st.page * st.per, st.page * st.per + st.per);
      el.innerHTML = C.table({cls:'bt-tbl', empty:'No back-tests yet. Start one to replay houses with a draft.', cols:[{label:'Started'},{label:'House set'},{label:'Tested'},{label:'Result'},{label:'', cls:'bt-actc'}],
        rows:shown.map(function(b){
          var g = C.btRunning(b) ? null : C.btGate(b);
          return {attr:'data-go="#/backtests/' + b.id + '"', cells:[
            '<span class="bt-when"><b>' + C.time(b.at) + '</b><small>' + RI.esc(b.by) + '</small></span>',
            '<span class="bt-when"><b>' + SETS[b.set][0] + '</b><small>' + b.houses + ' houses' + (g ? ' · lab ' + (g.pass ? 'pass' : 'fail') : '') + '</small></span>',
            '<span class="bt-when"><b>' + (b.drafts.length ? b.drafts.length + ' draft' + (b.drafts.length > 1 ? 's' : '') : 'Published only') + '</b><small>' + b.versions.map(function(v){ return v[0].split(' ')[0] + ' ' + v[1]; }).slice(0, 2).join(' · ') + ' · …</small></span>',
            resultChips(b), '<button type="button" class="us-act" data-go="#/backtests/' + b.id + '" aria-label="' + (C.btRunning(b) ? 'Watch the back-test of ' : 'Open the report of ') + C.time(b.at) + '">' + RI.icon(C.btRunning(b) ? 'eye' : 'file', 'i-sm') + (C.btRunning(b) ? 'Watch' : 'Report') + '</button>']};
        })});
      if(list.length) el.innerHTML += C.pager({page:st.page, per:st.per, total:list.length, noun:list.length === 1 ? 'run' : 'runs', perOpts:[10, 25, 50]});
      RI.fillIcons(el);
    }
    draw();
    /* While a run is going, the list updates by itself (APP_FLOW rule 3) */
    /* While a run is going, only its progress updates (focus and hover stay put); the row redraws when it ends */
    if(list.some(C.btRunning)) var t = C.every(function(){
      if(!view.querySelector('#bt-list')) return clearInterval(t);
      if(!list.some(C.btRunning)){ clearInterval(t); draw(); return; }
      view.querySelectorAll('[data-run]').forEach(function(x){ var b = list.filter(function(y){ return y.id === x.getAttribute('data-run'); })[0]; if(!b) return; var d = C.btDone(b); x.querySelector('.bt-live-t').textContent = 'Running · ' + d + ' of ' + b.houses; x.querySelector('.pq-bar i').style.width = (d / b.houses * 100).toFixed(0) + '%'; });
    }, 1000);
    view.addEventListener('click', function(e){
      var pg = e.target.closest('[data-pg]');
      if(pg){ if(pg.disabled) return; st.page = +pg.getAttribute('data-pg'); draw(); var top = view.querySelector('#bt-list').getBoundingClientRect().top; if(top < 80) window.scrollTo({top:window.scrollY + top - 96, behavior:'smooth'}); return; }
      var r = e.target.closest('[data-go]'); if(r) C.go(r.getAttribute('data-go'));
    });
    view.addEventListener('change', function(e){ if(!e.target.matches('[data-per]')) return; st.per = C.set('bt.per', +e.target.value); st.page = 0; draw(); });
    view.addEventListener('keydown', function(e){ var r = e.target.closest('[data-go]'); if(r && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); C.go(r.getAttribute('data-go')); } });
    var nb = view.querySelector('#bt-new'); if(nb) nb.addEventListener('click', function(){
      var q = C.queued(), nLab = C.btCount('lab'), nAll = C.btCount('all');
      var opt = function(v, n, on){ return '<label class="bt-set"><input type="radio" name="bt-set" value="' + v + '"' + (on ? ' checked' : '') + '><span><b>' + SETS[v][0] + ' <em>' + n + ' houses</em></b><small>' + (v === 'lab' ? 'The milestone check: zero double charges, nothing skipped, links intact.' : 'Lab houses, every priced house and the properties Sam supplied. Slower, and shows the effect everywhere.') + '</small></span></label>'; };
      var d = C.dialog('Start a back-test', '<fieldset class="bt-sets"><legend class="flabel">Houses to replay</legend>' + opt('lab', nLab, false) + opt('all', nAll, true) + '</fieldset>' +
        '<fieldset class="perm-list"><legend class="flabel">Drafts to include</legend>' + (q.length ? q.map(function(x){ return '<label class="perm"><input type="checkbox" value="' + x.id + '" checked><span><b>' + RI.esc(x.title) + '</b><small>' + RI.esc(x.summary || '') + '</small></span></label>'; }).join('') : '<p class="small muted">No drafts waiting: this replays the published versions only.</p>') + '</fieldset>' +
        '<p class="small muted">Every run is measured against the published versions: ' + C.versionsAt(Date.now()).map(function(v){ return v[0] + ' ' + v[1]; }).join(', ') + '. It runs in the background.</p>' +
        '<div class="cta-row" style="justify-content:flex-end"><button type="button" class="btn btn-secondary" data-dlg-close>Cancel</button><button type="button" class="btn btn-primary" id="bt-go">Start the back-test</button></div>', {wide:true});
      d.querySelector('#bt-go').addEventListener('click', function(){
        var ids = [].slice.call(d.querySelectorAll('.perm input:checked')).map(function(i){ return i.value; }), set = d.querySelector('input[name="bt-set"]:checked').value; d.close();
        var all = C.backtests(), b = C.backtest('new' + Date.now(), ids, {set:set, prior:all.slice().reverse()}); all.unshift(b); C.set('backtests', all);
        ids.forEach(function(id){ C.setDraft(id, {bt:{id:b.id, at:b.doneAt, clean:C.btClean(b), line:C.btLine(b)}}); });
        C.log('Back-test run', b.houses + ' houses (' + SETS[set][0].toLowerCase() + ') replayed with ' + ids.length + ' draft' + (ids.length === 1 ? '' : 's'), '', 'backtests');
        C.go('#/backtests/' + b.id);
      });
    });
  }, {nav:'backtests', perm:'backtests.run'});

  C.route('/backtests/:id', function(view, p){
    var b = C.backtests().filter(function(x){ return x.id === p.id; })[0];
    if(!b){ view.innerHTML = C.page({title:'That back-test is not here', back:['#/backtests','Back-tests']}); return; }
    var drafts = C.drafts().filter(function(d){ return b.drafts.indexOf(d.id) > -1; });
    C.crumb('Report, ' + C.time(b.at));
    var head = 'Started ' + C.time(b.at) + ' by ' + RI.esc(b.by) + ' · ' + SETS[b.set][0] + ', ' + b.houses + ' houses';

    /* Still running: a live bar; the report appears by itself when the last house is done */
    if(C.btRunning(b)){
      view.innerHTML = C.page({back:['#/backtests','Back-tests'], kicker:'Back-test report', title:'Replaying houses…', sub:head + '. You can leave this page; the run keeps going.',
        body:'<div class="bt-run"><span class="pq-spin" aria-hidden="true"></span><span><b id="bt-rn">' + C.btDone(b) + '</b> of ' + b.houses + ' houses replayed</span><span class="pq-bar"><i id="bt-rb"></i></span></div>' + tested(b, drafts)});
      var t = C.every(function(){ var d = C.btDone(b), rn = view.querySelector('#bt-rn'), rb = view.querySelector('#bt-rb'); if(!rn) return clearInterval(t); rn.textContent = d; rb.style.width = (d / b.houses * 100) + '%'; if(!C.btRunning(b)){ clearInterval(t); C.render(); } }, 250);
      return;
    }

    var clean = C.btClean(b), r = b.res;
    var tiles = ['failed', 'dbl', 'skip', 'broken', 'changed', 'alt'].map(function(k){ var n = r[k] || 0, bad = ['failed','dbl','skip','broken'].indexOf(k) > -1 && n;
      return '<div class="bt-s' + (bad ? ' bad' : '') + (k === 'changed' || k === 'alt' ? ' info' : '') + '"><b>' + n + '</b><span>' + TYPE[k][0] + '</span><small>' + TYPE[k][1] + '</small></div>'; }).join('');
    var RES = {failed:['Failed','bad'], problem:['Problems','bad'], changed:['Total changed',''], same:['Same','ok']};
    /* Every house, Low and High before and after for the chosen package. Opens on the package that moved most */
    var pkName = {}; PKS.forEach(function(k){ pkName[k[0]] = k[1]; });
    var moved = {E:0, S:0, P:0}; b.findings.forEach(function(x){ if(x.type === 'changed') moved[x.pk || 'S']++; });
    var curPk = ['S', 'P', 'E'].sort(function(x, y){ return moved[y] - moved[x]; })[0];
    if(!moved[curPk]) curPk = 'S';
    function housesTable(pk){
      return C.table({cls:'bt-hs', cols:[{label:'House'},{label:'Result'},{label:pkName[pk] + ', before', num:true},{label:'After', num:true},{label:'Change', num:true}],
        rows:b.list.map(function(h){
          var bf = h.before && (h.before[pk] || h.before), af = h.after && (h.after[pk] || h.after), dl = af && bf ? af[0] - bf[0] : null;
          return {attr:(h.hid ? 'data-go="#/houses/' + h.hid + '" tabindex="0" role="link"' : '') + (h.result === 'failed' ? ' class="bt-failed"' : ''), cells:[
            '<span class="bt-when"><b>' + RI.esc(h.addr) + (h.lab ? ' <span class="bt-lab">Lab</span>' : '') + (h.supplied ? ' <span class="bt-lab" style="background:var(--sunken);color:var(--muted)">Supplied</span>' : '') + '</b><small>' + RI.esc(h.place) + '</small></span>',
            '<span class="bt-res ' + RES[h.result][1] + '">' + RES[h.result][0] + (h.result === 'problem' ? ', ' + h.n : '') + '</span>' + (h.reason ? '<small class="bt-why">' + RI.esc(h.reason) + '</small>' : ''),
            money(bf), money(af), dl == null ? '<span class="muted">–</span>' : dl === 0 ? '<span class="muted">No change</span>' : '<span class="bt-dl ' + (dl > 0 ? 'up' : 'down') + '">' + (dl > 0 ? '+' : '−') + RI.money(Math.abs(dl)) + '</span>']};
        })});
    }
    var pkSwitch = '<div class="au-period" id="bt-pk" role="radiogroup" aria-label="Package">' + PKS.map(function(k){ return '<button type="button" role="radio" data-v="' + k[0] + '" aria-checked="' + (k[0] === curPk) + '" tabindex="' + (k[0] === curPk ? 0 : -1) + '">' + k[1] + (moved[k[0]] ? ' · ' + moved[k[0]] : '') + '</button>'; }).join('') + '</div>';
    var findings = b.findings.length ? C.table({cols:[{label:'Finding'},{label:'House'},{label:'Line'},{label:'Package'},{label:'Before', num:true},{label:'After', num:true}],
      rows:b.findings.map(function(f){ return {attr:f.hid ? 'data-go="#/houses/' + f.hid + '" tabindex="0" role="link"' : '', cells:['<span class="bt-n' + (f.type === 'changed' ? '' : ' bad') + '">' + f.label + '</span>', RI.esc(f.house), RI.esc(f.line), pkName[f.pk || 'S'], C.range(f.before[0], f.before[1]), f.type === 'changed' ? C.range(f.after[0], f.after[1]) : '<span class="muted">Not priced</span>']}; })})
      : '<div class="c-empty">' + RI.icon('check') + '<p>No findings: every line came out the same.</p></div>';
    var engine = '<div class="bt-eng">' +
      '<section class="c-card"><header><h3>Dependency cycles <span class="bt-n' + (b.cycles.length ? ' bad' : '') + '">' + b.cycles.length + '</span></h3><p class="small muted">Rule DP-010 rejects a cycle and logs it.</p></header>' +
        (b.cycles.length ? '<ul class="bt-li">' + b.cycles.map(function(c){ return '<li><b>' + c.a + ' ' + RI.icon('arrow','i-sm') + ' ' + c.b + '</b><small>' + RI.esc(c.house) + ' · ' + c.note + '</small></li>'; }).join('') + '</ul>' : '<p class="bt-none">' + RI.icon('check','i-sm') + 'No cycles.</p>') + '</section>' +
      '<section class="c-card"><header><h3>Clashing tasks <span class="bt-n">' + b.clashes.length + '</span></h3><p class="small muted">A task claimed by two work types is counted once; the other is rejected and kept here.</p></header>' +
        (b.clashes.length ? '<ul class="bt-li">' + b.clashes.map(function(c){ return '<li><b>' + c.task + '</b><small>' + RI.esc(c.house) + ' · ' + c.types.join(' and ') + ' · ' + c.kept + '</small></li>'; }).join('') + '</ul>' : '<p class="bt-none">' + RI.icon('check','i-sm') + 'No clashes.</p>') + '</section></div>';
    var alts = b.alts.length ? C.table({cols:[{label:'Lab house'},{label:'Line'},{label:'Published answer'},{label:'Sam\'s accepted alternative'},{label:'Times it won', num:true}],
      rows:b.alts.map(function(x){ return {attr:'data-go="#/houses/' + x.hid + '/tree" tabindex="0" role="link"', cells:['<span class="bt-when"><b>' + RI.esc(x.house) + '</b><small>Graded by ' + RI.esc(x.by) + (x.at ? ', ' + C.date(x.at) : '') + '</small></span>', RI.esc(x.line), RI.esc(x.ran), RI.esc(x.accepted), String(x.wins) + (x.wins >= 3 ? ' <a class="bt-cand" href="#/rules">Rule candidate</a>' : '')]}; })}) +
      C.note('These come from Sam\'s "Valid alternative" grades on lab-house decisions. A match is not counted as a problem; one that keeps winning becomes a rule candidate (PDF 34).')
      : '<div class="c-empty">' + RI.icon('info') + '<p>No accepted alternatives came up in this run.</p></div>';

    view.innerHTML = C.page({back:['#/backtests','Back-tests'], kicker:'Back-test report', title:clean ? 'Clean: nothing broke' : 'Problems found', sub:head + '.',
      body:verdict(b) + tested(b, drafts) +
        '<div class="bt-sum">' + tiles + '</div>' +
        '<section class="c-mt"><h2 class="c-h2">Houses replayed <span class="bt-cnt">' + b.houses + '</span></h2><div class="bt-hs-top" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 16px;margin:-2px 0 12px"><p class="bt-lead" style="margin:0;flex:1 1 320px">Each house with its Low and High from the published versions, and after the drafts. Failed houses come first.</p>' + pkSwitch + '</div><div id="bt-hs">' + housesTable(curPk) + '</div></section>' +
        '<section class="c-mt"><h2 class="c-h2">Findings <span class="bt-cnt">' + b.findings.length + '</span></h2>' + findings + '</section>' +
        '<section class="c-mt"><h2 class="c-h2">What the engine rejected</h2>' + engine + '</section>' +
        '<section class="c-mt"><h2 class="c-h2">Accepted alternatives <span class="bt-cnt">' + b.alts.length + '</span></h2>' + alts + '</section>' +
        '<div class="c-mt">' + C.note('Sample report. Real runs replay the houses on the server against the versions listed above.') + '</div>'});
    RI.fillIcons(view);
    /* The package switch: a radio group with arrow keys */
    var grp = view.querySelector('#bt-pk');
    function setPk(v){ curPk = v; grp.querySelectorAll('[data-v]').forEach(function(x){ var on = x.getAttribute('data-v') === v; x.setAttribute('aria-checked', on); x.tabIndex = on ? 0 : -1; }); view.querySelector('#bt-hs').innerHTML = housesTable(v); }
    grp.addEventListener('click', function(e){ var x = e.target.closest('[data-v]'); if(x) setPk(x.getAttribute('data-v')); });
    grp.addEventListener('keydown', function(e){ var bs = [].slice.call(grp.querySelectorAll('[data-v]')), i = bs.indexOf(e.target); if(i < 0) return; var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if(!d) return; e.preventDefault(); var t = bs[(i + d + bs.length) % bs.length]; setPk(t.getAttribute('data-v')); t.focus(); });
    view.addEventListener('click', function(e){ if(e.target.closest('a')) return; var r = e.target.closest('[data-go]'); if(r) C.go(r.getAttribute('data-go')); });
    view.addEventListener('keydown', function(e){ var r = e.target.closest('[data-go]'); if(r && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); C.go(r.getAttribute('data-go')); } });
  }, {nav:'backtests', perm:'backtests.run'});
})();
