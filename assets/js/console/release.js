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
  C.btHouses = function(set){ return A.all().filter(function(h){ return A.status(h) !== 'draft' && (set !== 'lab' || h.owner === C.LAB_OWNER); }); };
  /* Published versions every run is measured against (SCHEMA: versions tested) */
  var VERSIONS = [['Rulebook', 'v12'], ['Condition sheets', 'v4'], ['Room templates', 'v5'], ['Products', 'v7'], ['Rates', 'v9']];
  function stdTotal(est){ var lo = 0, hi = 0; est.rooms.forEach(function(r){ r.items.forEach(function(it){ var p = it.pk && it.pk.S; if(p && p[1]){ lo += p[1]; hi += p[2]; } }); }); return [lo, hi]; }
  var FAIL = ['A photo could not be read again', 'The run stopped at the quantity step', 'A product in the draft has no price'];
  /* One run: started by, set, versions and drafts tested, status; per house the result and the Standard total before and after;
     findings (double charges, skipped parts, broken links, changed totals); dependency cycles (DP-010), clashing tasks
     and accepted alternatives (PDF 34). A failed house is marked and the others continue (PDF, background jobs). */
  C.backtest = function(seedStr, draftIds, o){
    o = o || {}; var set = o.set === 'lab' ? 'lab' : 'all', r = rnd(seedStr), at = o.at || Date.now();
    var hs = C.btHouses(set), houses = [], f = [], cycles = [], clashes = [], alts = [];
    var types = [['changed','Total changed'],['skip','Skipped part'],['dbl','Double charge'],['broken','Broken link']];
    hs.forEach(function(h, i){
      var est = A.estimate(h), tot = stdTotal(est), lab = h.owner === C.LAB_OWNER, x = r();
      var row = {hid:h.id, addr:A.addr(h), place:A.place(h), lab:lab, before:tot, after:tot.slice(), result:'same', n:0};
      if(x > .93 && !lab){ row.result = 'failed'; row.reason = FAIL[Math.floor(r() * FAIL.length)]; row.after = null; houses.push(row); return; }
      var k = r(); if(k < .5){
        var t = k < .32 ? types[0] : k < .40 ? types[1] : k < .45 ? types[2] : types[3];
        var room = est.rooms[Math.floor(r() * est.rooms.length)], it = room.items[Math.floor(r() * room.items.length)];
        var p = (it.pk && it.pk.S) || [0, 600, 1100], lo = p[1] || 600, hi = p[2] || 1100, d = Math.round((r() - .35) * 600 / 10) * 10;
        f.push({type:t[0], label:t[1], house:row.addr, hid:h.id, line:it.name, before:[lo, hi], after:[lo + d, hi + d]});
        if(t[0] === 'changed'){ row.after = [tot[0] + d, tot[1] + d]; row.result = 'changed'; } else { row.result = 'problem'; row.n++; }
      }
      if(r() < .06) cycles.push({house:row.addr, hid:h.id, rule:'DP-010', a:'Kitchen cabinets', b:'Countertop', note:'Each waited on the other; the engine stopped after 3 passes'});
      if(r() < .2) clashes.push({house:row.addr, hid:h.id, task:'Remove and dispose of the old countertop', types:['Countertops', 'Cabinets'], kept:'Kept once, under Countertops'});
      if(lab && r() < .8) alts.push({house:row.addr, hid:h.id, line:i % 2 ? 'Kitchen cabinets' : 'Interior doors', ran:i % 2 ? 'Refinish fronts and boxes' : 'Replace slabs with hardware', accepted:i % 2 ? 'Paint fronts and boxes' : 'Refinish slabs, new hardware', wins:3 + (i % 2)});
      houses.push(row);
    });
    var res = {changed:0, skip:0, dbl:0, broken:0}; f.forEach(function(x){ res[x.type]++; });
    res.failed = houses.filter(function(h){ return h.result === 'failed'; }).length; res.cycles = cycles.length; res.clash = clashes.length; res.alt = alts.length;
    var order = {failed:0, problem:1, changed:2, same:3}; houses.sort(function(a, b){ return order[a.result] - order[b.result]; });
    var dur = o.instant ? 0 : Math.max(4000, houses.length * 700);
    return {v:2, id:C.uid('bt'), at:at, doneAt:at + dur, by:(C.me() || {}).name || 'Sam', set:set, versions:VERSIONS, drafts:draftIds || [], houses:houses.length, list:houses, res:res, findings:f, cycles:cycles, clashes:clashes, alts:alts};
  };
  /* Clean: no double charges, nothing skipped, links intact (the milestone gate), no failed house and no cycle */
  C.btClean = function(b){ var r = b.res; return !r.dbl && !r.skip && !r.broken && !r.failed && !r.cycles; };
  C.btRunning = function(b){ return b.doneAt && Date.now() < b.doneAt; };
  C.btDone = function(b){ return b.doneAt ? Math.min(b.houses, Math.floor((Date.now() - b.at) / (b.doneAt - b.at) * b.houses)) : b.houses; };
  /* The lab-house gate (PROJECT, TESTING): zero double charges, no skipped parts, links intact, every lab house ran */
  C.btGate = function(b){
    var lab = (b.list || []).filter(function(h){ return h.lab; }); if(!lab.length) return null;
    var bad = lab.filter(function(h){ return h.result === 'failed' || h.result === 'problem'; }).length;
    return {pass:!bad, n:lab.length, ok:lab.length - bad};
  };
  C.btLine = function(b){ var r = b.res; return b.houses + ' houses · ' + (r.failed ? r.failed + ' failed · ' : '') + (r.dbl ? r.dbl + ' double charge' + (r.dbl > 1 ? 's' : '') : 'no double charges') + ' · ' + (r.skip ? r.skip + ' skipped' : 'nothing skipped') + ' · ' + (r.broken ? r.broken + ' broken link' + (r.broken > 1 ? 's' : '') : 'no broken links') + ' · ' + r.changed + ' total' + (r.changed === 1 ? '' : 's') + ' changed'; };
  /* Runs saved before this version are rebuilt in the new shape, keeping who, when and which drafts */
  C.backtests = function(){
    var l = C.get('backtests', []) || [], up = false;
    l = l.map(function(b){ if(b.v === 2) return b; up = true; return Object.assign(C.backtest(b.id || 'old', b.drafts || [], {at:b.at, instant:true}), {id:b.id, by:b.by || 'Sam'}); });
    if(up) C.set('backtests', l);
    return l;
  };

  C.SEEDS.push(function(){
    var d1 = {id:C.uid('d'), status:'queued', area:'sheets', ref:'CB', title:'Condition sheet: Cabinetry threshold', summary:'Confidence threshold 70 to 75', after:{threshold:75}, why:'Too many dark kitchen photos passed', by:'Sam', at:now - DAY - 2 * 3600000};
    var d2 = {id:C.uid('d'), status:'queued', area:'rates', ref:'0', title:'Rate: LVP flooring, sample region', summary:'Low and High per sq ft: $6.50 to $10.50 becomes $6.80 to $10.90', after:{lo:6.8, hi:10.9}, why:'November supplier list', by:'Staff (staff@demo.ri)', at:now - 5 * 3600000};
    var d3 = {id:C.uid('d'), status:'queued', area:'guidance', ref:'Water heater', title:'Guidance: Water heater', summary:'Text rewritten, typical range unchanged', after:null, why:'Plainer wording for the age check', by:'Sam', at:now - 50 * 60000};
    var b1 = C.backtest('seed-1', [d1.id], {at:now - 3 * 3600000, instant:true}); b1.by = 'Sam';
    d1.bt = {id:b1.id, at:b1.at, clean:C.btClean(b1), line:C.btLine(b1)};
    var b0 = C.backtest('seed-0', [], {set:'lab', at:now - 4 * DAY, instant:true}); b0.by = 'Sam';
    C.set('drafts', [d3, d2, d1, {id:C.uid('d'), status:'published', area:'templates', ref:'kitchen', title:'Room template: Kitchen', summary:'Kitchen lighting usual count set to 4 to 6', why:'', by:'Sam', at:now - 4 * DAY, doneAt:now - 3 * DAY, doneBy:'Sam', note:'Back-test clean'}, {id:C.uid('d'), status:'discarded', area:'guidance', ref:'Roof', title:'Guidance: Roof', summary:'Shorter text', by:'Sam', at:now - 7 * DAY, doneAt:now - 6 * DAY, doneBy:'Sam', note:'Wording not final'}]);
    C.set('backtests', [b1, b0]);
  });

  /* ---------- Publish queue ---------- */
  C.route('/publish', function(view){
    var tab = C.query().tab || 'queued';
    function count(s){ return C.drafts().filter(function(d){ return d.status === s && C.mine(d); }).length; }
    view.innerHTML = C.page({kicker:'Changes', title:'Publish queue', sub:'Draft changes waiting for Sam. Run a back-test, read what it found, then publish or discard. Old runs keep the versions they were made with.',
      body:C.seg('pq-tab', [['queued','Waiting',count('queued')],['published','Published',count('published')],['discarded','Discarded',count('discarded')]], tab) +
        (C.can('publish') ? '' : '<div class="c-mt">' + C.note('You see the drafts of your own area. Only Sam publishes or discards.', 'lock') + '</div>') + '<div id="pq-list" class="c-mt"></div>'});
    function draw(){
      var list = C.drafts().filter(function(d){ return d.status === tab && C.mine(d); }), el = doc.getElementById('pq-list');
      el.innerHTML = list.length ? '<div class="pq">' + list.map(function(d){
        var ar = AREA[d.area] || ['Change','file'];
        return '<article class="pq-card" data-id="' + d.id + '"><header><span class="pq-ic">' + RI.icon(ar[1],'i-sm') + '</span><div><p class="c-kicker">' + ar[0] + '</p><h2>' + RI.esc(d.title) + '</h2></div>' + C.lbl(d.status) + '</header>' +
          (d.summary ? '<p class="pq-sum">' + RI.esc(d.summary) + '</p>' : '') +
          '<p class="pq-meta">' + C.av(d.by, d.by === 'Sam' ? 'sam' : '') + '<span><b>' + RI.esc(d.by) + '</b> · ' + C.ago(d.at) + (d.why ? '<br><q>' + RI.esc(d.why) + '</q>' : '') + '</span></p>' +
          (d.status === 'queued' ? '<div class="pq-bt ' + (d.bt ? (d.bt.clean ? 'ok' : 'warn') : 'none') + '">' + (d.bt ? RI.icon(d.bt.clean ? 'check' : 'warn','i-sm') + '<span><b>' + (d.bt.clean ? 'Back-test clean' : 'Back-test found problems') + '</b> · ' + C.ago(d.bt.at) + '<br><small>' + RI.esc(d.bt.line) + '</small></span><a href="#/backtests/' + d.bt.id + '">Report</a>' : RI.icon('clock','i-sm') + '<span><b>Not back-tested yet</b><br><small>Replays the priced houses with this draft in place.</small></span>') +
              (C.can('backtests.run') ? '<button type="button" class="btn btn-secondary btn-sm" data-bt="' + d.id + '">' + (d.bt ? 'Run again' : 'Run a back-test') + '</button>' : '') + '</div>' +
            (C.can('publish') ? '<div class="pq-act"><button type="button" class="linkbtn" data-discard="' + d.id + '">Discard</button><button type="button" class="btn btn-primary" data-pub="' + d.id + '">Publish</button></div>' : '')
          : '<p class="pq-done">' + (d.status === 'published' ? 'Published' : 'Discarded') + ' by ' + RI.esc(d.doneBy || '') + ', ' + C.ago(d.doneAt) + (d.note ? ': “' + RI.esc(d.note) + '”' : '') + '</p>') +
          '</article>';
      }).join('') + '</div>' : '<div class="c-empty big">' + RI.icon(tab === 'queued' ? 'check' : 'info') + '<p>' + (tab === 'queued' ? 'Nothing is waiting. Drafts saved on any editor appear here.' : 'Nothing ' + tab + ' yet.') + '</p></div>';
      RI.fillIcons(el);
    }
    view.querySelector('#pq-tab').addEventListener('click', function(e){ var b = e.target.closest('[data-v]'); if(!b) return; tab = b.getAttribute('data-v'); view.querySelectorAll('#pq-tab [data-v]').forEach(function(x){ x.setAttribute('aria-selected', x === b); }); history.replaceState(null, '', '#/publish?tab=' + tab); draw(); });
    view.addEventListener('click', function(e){
      var bt = e.target.closest('[data-bt]'); if(bt){ runFor(bt.getAttribute('data-bt'), bt); return; }
      var pub = e.target.closest('[data-pub]'); if(pub){ decide(pub.getAttribute('data-pub'), true); return; }
      var dis = e.target.closest('[data-discard]'); if(dis){ decide(dis.getAttribute('data-discard'), false); }
    });
    function runFor(id, btn){
      var card = btn.closest('.pq-card'), box = card.querySelector('.pq-bt'), houses = C.btHouses('all').length, i = 0;
      box.className = 'pq-bt run'; box.innerHTML = '<span class="pq-spin" aria-hidden="true"></span><span><b>Replaying houses…</b><br><small id="pq-n">0 of ' + houses + '</small></span><span class="pq-bar"><i></i></span>';
      var bar = box.querySelector('.pq-bar i'), n = box.querySelector('#pq-n');
      var t = C.every(function(){ i++; n.textContent = i + ' of ' + houses; bar.style.width = (i / houses * 100) + '%'; if(i >= houses){ clearInterval(t);
        var b = C.backtest(id + Date.now(), [id], {instant:true}), list = C.backtests(); list.unshift(b); C.set('backtests', list);
        C.setDraft(id, {bt:{id:b.id, at:b.at, clean:C.btClean(b), line:C.btLine(b)}}); C.log('Back-test run', b.houses + ' houses replayed with one draft', '', 'backtests');
        RI.toast(C.btClean(b) ? 'Back-test clean.' : 'Back-test found problems. Read the report.', C.btClean(b) ? 'check' : 'warn'); draw(); } }, C.reduce ? 10 : 90);
    }
    function decide(id, pub){
      var d = C.drafts().filter(function(x){ return x.id === id; })[0];
      var warn = pub && !d.bt ? '<p class="notice notice-warn">' + RI.icon('warn') + '<span>This draft has no back-test yet. Publishing without one is allowed, but the report shows what it changes across many houses.</span></p>' : (pub && d.bt && !d.bt.clean ? '<p class="notice notice-warn">' + RI.icon('warn') + '<span>The last back-test found problems.</span></p>' : '');
      var dlg = C.dialog(pub ? 'Publish this change?' : 'Discard this draft?', '<p><b>' + RI.esc(d.title) + '</b><br><span class="small muted">' + RI.esc(d.summary || '') + '</span></p>' + warn +
        (pub ? '<p class="small muted">New runs use it from now on. Runs already delivered keep the versions they were made with.</p>' : '<p class="small muted">The draft is kept in the history, but never goes live.</p>') +
        '<div class="field"><label for="pq-note">Note <span class="opt">(optional)</span></label><input class="input" id="pq-note" placeholder="' + (pub ? 'For example: back-test clean' : 'For example: wording not final') + '"></div>' +
        '<div class="cta-row" style="justify-content:flex-end"><button type="button" class="btn btn-secondary" data-dlg-close>Cancel</button><button type="button" class="btn ' + (pub ? 'btn-primary' : 'btn-danger') + '" id="pq-go">' + (pub ? 'Publish' : 'Discard') + '</button></div>');
      RI.fillIcons(dlg);
      dlg.querySelector('#pq-go').addEventListener('click', function(){ var note = dlg.querySelector('#pq-note').value.trim(); dlg.close(); if(pub) C.publish(id, note); else C.discard(id, note); RI.toast(pub ? 'Published. New runs use it from now on.' : 'Draft discarded.', pub ? 'check' : 'info'); C.render(); });
    }
    draw();
  }, {nav:'publish', perm:['rulebook.edit', 'pricing.edit', 'content.edit']});

  /* ---------- Back-tests ----------
     List: every run with its house set, what it tested, and its result, or a live bar while it runs in the background.
     Start: choose the house set (lab houses for the milestone check, or every priced house) and the drafts.
     Report: the verdict and the lab-house gate first, then the counts, every house with its Standard total before
     and after, the findings, what the engine rejected (cycles, clashing tasks), and accepted alternatives. */
  var TYPE = {failed:['Failed houses','The replay stopped for this house; the others continued'], dbl:['Double charges','The same task counted twice across work types'], skip:['Skipped parts','A part the template expects that got no decision'], broken:['Broken links','A dependency that points to nothing'], changed:['Changed totals','A Standard total that moved, with the line that moved it'], alt:['Accepted alternatives','A different answer Sam already accepts for a lab house']};
  var SETS = {lab:['Lab houses', 'Sam\'s lab houses: the milestone check'], all:['Every priced house', 'Lab houses and every priced house']};
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
    if(C.btRunning(b)){ var d = C.btDone(b); return '<span class="bt-live"><span class="pq-spin" aria-hidden="true"></span>Running · ' + d + ' of ' + b.houses + '<span class="pq-bar"><i style="width:' + (d / b.houses * 100).toFixed(0) + '%"></i></span></span>'; }
    var r = b.res;
    return '<span class="bt-f">' + (C.btClean(b) ? '<span class="rel rel-ok">Clean</span>' : '') + (r.failed ? '<span class="bt-n bad">' + r.failed + ' failed</span>' : '') + (r.dbl ? '<span class="bt-n bad">' + r.dbl + ' double</span>' : '') + (r.skip ? '<span class="bt-n bad">' + r.skip + ' skipped</span>' : '') + (r.broken ? '<span class="bt-n bad">' + r.broken + ' broken</span>' : '') + (r.cycles ? '<span class="bt-n bad">' + r.cycles + ' cycle' + (r.cycles > 1 ? 's' : '') + '</span>' : '') + '<span class="bt-n">' + r.changed + ' changed</span></span>';
  }

  C.route('/backtests', function(view){
    var list = C.backtests();
    view.innerHTML = C.page({kicker:'Changes', title:'Back-tests', sub:'Replay many houses with draft versions before Sam publishes. The report shows double charges, skipped parts, broken links and the before and after. A failed house is marked; the others continue.',
      actions:C.can('backtests.run') ? '<button type="button" class="btn btn-primary" id="bt-new">' + RI.icon('refresh','i-sm') + 'Start a back-test</button>' : '',
      body:'<div id="bt-list"></div>' + '<div class="c-mt">' + C.note('A back-test runs in the background. You can leave this page; the run keeps going and its report is here when it is done.') + '</div>'});
    function draw(){
      var el = view.querySelector('#bt-list'); if(!el) return;
      el.innerHTML = C.table({cls:'bt-tbl', empty:'No back-tests yet. Start one to replay houses with a draft.', cols:[{label:'Started'},{label:'House set'},{label:'Tested'},{label:'Result'},{label:'', cls:'bt-actc'}],
        rows:list.map(function(b){
          var g = C.btRunning(b) ? null : C.btGate(b);
          return {attr:'data-go="#/backtests/' + b.id + '" tabindex="0" role="link" aria-label="Open the report of ' + C.time(b.at) + '"', cells:[
            '<span class="bt-when"><b>' + C.time(b.at) + '</b><small>' + RI.esc(b.by) + '</small></span>',
            '<span class="bt-when"><b>' + SETS[b.set][0] + '</b><small>' + b.houses + ' houses' + (g ? ' · lab ' + (g.pass ? 'pass' : 'fail') : '') + '</small></span>',
            '<span class="bt-when"><b>' + (b.drafts.length ? b.drafts.length + ' draft' + (b.drafts.length > 1 ? 's' : '') : 'Published only') + '</b><small>' + b.versions.map(function(v){ return v[0].split(' ')[0] + ' ' + v[1]; }).slice(0, 2).join(' · ') + ' · …</small></span>',
            resultChips(b), '<span class="linkbtn small">' + (C.btRunning(b) ? 'Watch' : 'Report') + '</span>']};
        })});
      RI.fillIcons(el);
    }
    draw();
    /* While a run is going, the list updates by itself (APP_FLOW rule 3) */
    if(list.some(C.btRunning)) var t = C.every(function(){ draw(); if(!list.some(C.btRunning)) clearInterval(t); }, 400);
    view.addEventListener('click', function(e){ var r = e.target.closest('[data-go]'); if(r) C.go(r.getAttribute('data-go')); });
    view.addEventListener('keydown', function(e){ var r = e.target.closest('[data-go]'); if(r && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); C.go(r.getAttribute('data-go')); } });
    var nb = view.querySelector('#bt-new'); if(nb) nb.addEventListener('click', function(){
      var q = C.queued(), nLab = C.btHouses('lab').length, nAll = C.btHouses('all').length;
      var opt = function(v, n, on){ return '<label class="bt-set"><input type="radio" name="bt-set" value="' + v + '"' + (on ? ' checked' : '') + '><span><b>' + SETS[v][0] + ' <em>' + n + ' houses</em></b><small>' + (v === 'lab' ? 'The milestone check: zero double charges, nothing skipped, links intact.' : 'The lab houses plus every priced house. Slower, and shows the effect everywhere.') + '</small></span></label>'; };
      var d = C.dialog('Start a back-test', '<fieldset class="bt-sets"><legend class="flabel">Houses to replay</legend>' + opt('lab', nLab, false) + opt('all', nAll, true) + '</fieldset>' +
        '<fieldset class="perm-list"><legend class="flabel">Drafts to include</legend>' + (q.length ? q.map(function(x){ return '<label class="perm"><input type="checkbox" value="' + x.id + '" checked><span><b>' + RI.esc(x.title) + '</b><small>' + RI.esc(x.summary || '') + '</small></span></label>'; }).join('') : '<p class="small muted">No drafts waiting: this replays the published versions only.</p>') + '</fieldset>' +
        '<p class="small muted">Every run is measured against the published versions: ' + VERSIONS.map(function(v){ return v[0] + ' ' + v[1]; }).join(', ') + '. It runs in the background.</p>' +
        '<div class="cta-row" style="justify-content:flex-end"><button type="button" class="btn btn-secondary" data-dlg-close>Cancel</button><button type="button" class="btn btn-primary" id="bt-go">Start the back-test</button></div>', {wide:true});
      d.querySelector('#bt-go').addEventListener('click', function(){
        var ids = [].slice.call(d.querySelectorAll('.perm input:checked')).map(function(i){ return i.value; }), set = d.querySelector('input[name="bt-set"]:checked').value; d.close();
        var b = C.backtest('new' + Date.now(), ids, {set:set}), all = C.backtests(); all.unshift(b); C.set('backtests', all);
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
    var houses = C.table({cls:'bt-hs', cols:[{label:'House'},{label:'Result'},{label:'Standard, before', num:true},{label:'After', num:true},{label:'Change', num:true}],
      rows:b.list.map(function(h){
        var dl = h.after && h.before ? h.after[0] - h.before[0] : null;
        return {attr:'data-go="#/houses/' + h.hid + '" tabindex="0" role="link"' + (h.result === 'failed' ? ' class="bt-failed"' : ''), cells:[
          '<span class="bt-when"><b>' + RI.esc(h.addr) + (h.lab ? ' <span class="bt-lab">Lab</span>' : '') + '</b><small>' + RI.esc(h.place) + '</small></span>',
          '<span class="bt-res ' + RES[h.result][1] + '">' + RES[h.result][0] + (h.result === 'problem' ? ', ' + h.n : '') + '</span>' + (h.reason ? '<small class="bt-why">' + RI.esc(h.reason) + '</small>' : ''),
          money(h.before), money(h.after), dl == null ? '<span class="muted">–</span>' : dl === 0 ? '<span class="muted">No change</span>' : '<span class="bt-dl ' + (dl > 0 ? 'up' : 'down') + '">' + (dl > 0 ? '+' : '−') + RI.money(Math.abs(dl)) + '</span>']};
      })});
    var findings = b.findings.length ? C.table({cols:[{label:'Finding'},{label:'House'},{label:'Line'},{label:'Standard, before', num:true},{label:'After', num:true}],
      rows:b.findings.map(function(f){ return {attr:'data-go="#/houses/' + f.hid + '" tabindex="0" role="link"', cells:['<span class="bt-n' + (f.type === 'changed' ? '' : ' bad') + '">' + f.label + '</span>', RI.esc(f.house), RI.esc(f.line), C.range(f.before[0], f.before[1]), f.type === 'changed' ? C.range(f.after[0], f.after[1]) : '<span class="muted">Not priced</span>']}; })})
      : '<div class="c-empty">' + RI.icon('check') + '<p>No findings: every line came out the same.</p></div>';
    var engine = '<div class="bt-eng">' +
      '<section class="c-card"><header><h3>Dependency cycles <span class="bt-n' + (b.cycles.length ? ' bad' : '') + '">' + b.cycles.length + '</span></h3><p class="small muted">Rule DP-010 rejects a cycle and logs it.</p></header>' +
        (b.cycles.length ? '<ul class="bt-li">' + b.cycles.map(function(c){ return '<li><b>' + c.a + ' ' + RI.icon('arrow','i-sm') + ' ' + c.b + '</b><small>' + RI.esc(c.house) + ' · ' + c.note + '</small></li>'; }).join('') + '</ul>' : '<p class="bt-none">' + RI.icon('check','i-sm') + 'No cycles.</p>') + '</section>' +
      '<section class="c-card"><header><h3>Clashing tasks <span class="bt-n">' + b.clashes.length + '</span></h3><p class="small muted">A task claimed by two work types is counted once; the other is rejected and kept here.</p></header>' +
        (b.clashes.length ? '<ul class="bt-li">' + b.clashes.map(function(c){ return '<li><b>' + c.task + '</b><small>' + RI.esc(c.house) + ' · ' + c.types.join(' and ') + ' · ' + c.kept + '</small></li>'; }).join('') + '</ul>' : '<p class="bt-none">' + RI.icon('check','i-sm') + 'No clashes.</p>') + '</section></div>';
    var alts = b.alts.length ? C.table({cols:[{label:'Lab house'},{label:'Line'},{label:'The engine chose'},{label:'Accepted alternative'},{label:'Times it won', num:true}],
      rows:b.alts.map(function(x){ return {cells:[RI.esc(x.house), RI.esc(x.line), RI.esc(x.ran), RI.esc(x.accepted), String(x.wins) + (x.wins >= 3 ? ' <a class="bt-cand" href="#/rules">Rule candidate</a>' : '')]}; })}) +
      C.note('An accepted alternative is not counted as a problem. One that keeps winning becomes a rule candidate for Sam (PDF 34).')
      : '<div class="c-empty">' + RI.icon('info') + '<p>No accepted alternatives came up in this run.</p></div>';

    view.innerHTML = C.page({back:['#/backtests','Back-tests'], kicker:'Back-test report', title:clean ? 'Clean: nothing broke' : 'Problems found', sub:head + '.',
      body:verdict(b) + tested(b, drafts) +
        '<div class="bt-sum">' + tiles + '</div>' +
        '<section class="c-mt"><h2 class="c-h2">Houses replayed <span class="bt-cnt">' + b.houses + '</span></h2><p class="bt-lead">Each house with its Standard total from the published versions, and after the drafts. Failed houses come first.</p>' + houses + '</section>' +
        '<section class="c-mt"><h2 class="c-h2">Findings <span class="bt-cnt">' + b.findings.length + '</span></h2>' + findings + '</section>' +
        '<section class="c-mt"><h2 class="c-h2">What the engine rejected</h2>' + engine + '</section>' +
        '<section class="c-mt"><h2 class="c-h2">Accepted alternatives <span class="bt-cnt">' + b.alts.length + '</span></h2>' + alts + '</section>' +
        '<div class="c-mt">' + C.note('Sample report. Real runs replay the houses on the server against the versions listed above.') + '</div>'});
    RI.fillIcons(view);
    view.addEventListener('click', function(e){ var r = e.target.closest('[data-go]'); if(r) C.go(r.getAttribute('data-go')); });
    view.addEventListener('keydown', function(e){ var r = e.target.closest('[data-go]'); if(r && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); C.go(r.getAttribute('data-go')); } });
  }, {nav:'backtests', perm:'backtests.run'});
})();
