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
  C.backtest = function(seedStr, draftIds){
    var r = rnd(seedStr), houses = A.all().filter(function(h){ return A.status(h) !== 'draft'; });
    var n = Math.max(houses.length, 6) + 6, f = [];
    var types = [['changed','Total changed'],['skip','Skipped part'],['dbl','Double charge'],['broken','Broken link']];
    houses.forEach(function(h){
      var x = r(); if(x > .55) return;
      var t = x < .38 ? types[0] : x < .47 ? types[1] : x < .52 ? types[2] : types[3];
      var est = A.estimate(h), room = est.rooms[Math.floor(r() * est.rooms.length)], it = room.items[Math.floor(r() * room.items.length)];
      var p = it.pk.S, lo = p[1] || 600, hi = p[2] || 1100, d = Math.round((r() - .35) * 600 / 10) * 10;
      f.push({type:t[0], label:t[1], house:A.addr(h), hid:h.id, line:it.name, before:[lo, hi], after:[lo + d, hi + d]});
    });
    var res = {changed:0, skip:0, dbl:0, broken:0}; f.forEach(function(x){ res[x.type]++; });
    return {id:C.uid('bt'), at:Date.now(), by:(C.me() || {}).name || 'Sam', houses:n, drafts:draftIds || [], res:res, findings:f};
  };
  C.btClean = function(b){ return !b.res.dbl && !b.res.skip && !b.res.broken; };
  C.btLine = function(b){ var r = b.res; return b.houses + ' houses · ' + (r.dbl ? r.dbl + ' double charge' + (r.dbl > 1 ? 's' : '') : 'no double charges') + ' · ' + (r.skip ? r.skip + ' skipped' : 'nothing skipped') + ' · ' + (r.broken ? r.broken + ' broken link' + (r.broken > 1 ? 's' : '') : 'no broken links') + ' · ' + r.changed + ' total' + (r.changed === 1 ? '' : 's') + ' changed'; };

  C.SEEDS.push(function(){
    var d1 = {id:C.uid('d'), status:'queued', area:'sheets', ref:'CB', title:'Condition sheet: Cabinetry threshold', summary:'Confidence threshold 70 to 75', after:{threshold:75}, why:'Too many dark kitchen photos passed', by:'Sam', at:now - DAY - 2 * 3600000};
    var d2 = {id:C.uid('d'), status:'queued', area:'rates', ref:'0', title:'Rate: LVP flooring, sample region', summary:'Low and High per sq ft: $6.50 to $10.50 becomes $6.80 to $10.90', after:{lo:6.8, hi:10.9}, why:'November supplier list', by:'Staff (staff@demo.ri)', at:now - 5 * 3600000};
    var d3 = {id:C.uid('d'), status:'queued', area:'guidance', ref:'Water heater', title:'Guidance: Water heater', summary:'Text rewritten, typical range unchanged', after:null, why:'Plainer wording for the age check', by:'Sam', at:now - 50 * 60000};
    var b1 = C.backtest('seed-1', [d1.id]); b1.at = now - 3 * 3600000; b1.by = 'Sam';
    d1.bt = {id:b1.id, at:b1.at, clean:C.btClean(b1), line:C.btLine(b1)};
    var b0 = C.backtest('seed-0', []); b0.at = now - 4 * DAY; b0.by = 'Sam';
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
      var card = btn.closest('.pq-card'), box = card.querySelector('.pq-bt'), houses = A.all().filter(function(h){ return A.status(h) !== 'draft'; }).length + 6, i = 0;
      box.className = 'pq-bt run'; box.innerHTML = '<span class="pq-spin" aria-hidden="true"></span><span><b>Replaying houses…</b><br><small id="pq-n">0 of ' + houses + '</small></span><span class="pq-bar"><i></i></span>';
      var bar = box.querySelector('.pq-bar i'), n = box.querySelector('#pq-n');
      var t = C.every(function(){ i++; n.textContent = i + ' of ' + houses; bar.style.width = (i / houses * 100) + '%'; if(i >= houses){ clearInterval(t);
        var b = C.backtest(id + Date.now(), [id]), list = C.get('backtests', []); list.unshift(b); C.set('backtests', list);
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

  /* ---------- Back-tests ---------- */
  var TYPE = {dbl:['Double charges','The same task counted twice across work types'], skip:['Skipped parts','A part the template expects that got no decision'], broken:['Broken links','A dependency that points to nothing'], changed:['Changed totals','A package total that moved, with the line that moved it']};
  C.route('/backtests', function(view){
    var list = C.get('backtests', []);
    view.innerHTML = C.page({kicker:'Changes', title:'Back-tests', sub:'Replay many houses after a change: double charges, skipped parts, broken links and changed totals. A failed house is marked; the others continue.',
      actions:C.can('backtests.run') ? '<button type="button" class="btn btn-primary" id="bt-new">' + RI.icon('refresh','i-sm') + 'Start a back-test</button>' : '',
      body:C.table({empty:'No back-tests yet.', cols:[{label:'Started'},{label:'By'},{label:'Drafts tested', num:true},{label:'Houses', num:true},{label:'Findings'},{label:''}],
        rows:list.map(function(b){ var r = b.res, clean = C.btClean(b);
          return {attr:'data-go="#/backtests/' + b.id + '" tabindex="0" role="link"', cells:['<b>' + C.time(b.at) + '</b>', RI.esc(b.by), String(b.drafts.length), String(b.houses),
            '<span class="bt-f">' + (clean ? '<span class="rel rel-ok">Clean</span>' : '') + (r.dbl ? '<span class="bt-n bad">' + r.dbl + ' double</span>' : '') + (r.skip ? '<span class="bt-n bad">' + r.skip + ' skipped</span>' : '') + (r.broken ? '<span class="bt-n bad">' + r.broken + ' broken</span>' : '') + '<span class="bt-n">' + r.changed + ' changed</span></span>',
            '<span class="linkbtn small">Report</span>']}; })})});
    view.addEventListener('click', function(e){ var r = e.target.closest('[data-go]'); if(r) C.go(r.getAttribute('data-go')); });
    var nb = view.querySelector('#bt-new'); if(nb) nb.addEventListener('click', function(){
      var q = C.queued();
      var d = C.dialog('Start a back-test', '<p class="small muted">Replays every priced house with the drafts you choose in place, and compares the results with the published versions.</p>' +
        '<fieldset class="perm-list"><legend class="flabel">Drafts to include</legend>' + (q.length ? q.map(function(x){ return '<label class="perm"><input type="checkbox" value="' + x.id + '" checked><span><b>' + RI.esc(x.title) + '</b><small>' + RI.esc(x.summary || '') + '</small></span></label>'; }).join('') : '<p class="small muted">No drafts waiting: this replays the published versions only.</p>') + '</fieldset>' +
        '<div class="cta-row" style="justify-content:flex-end"><button type="button" class="btn btn-secondary" data-dlg-close>Cancel</button><button type="button" class="btn btn-primary" id="bt-go">Start</button></div>', {wide:true});
      d.querySelector('#bt-go').addEventListener('click', function(){
        var ids = [].slice.call(d.querySelectorAll('input:checked')).map(function(i){ return i.value; }); d.close();
        var b = C.backtest('new' + Date.now(), ids), all = C.get('backtests', []); all.unshift(b); C.set('backtests', all);
        ids.forEach(function(id){ C.setDraft(id, {bt:{id:b.id, at:b.at, clean:C.btClean(b), line:C.btLine(b)}}); });
        C.log('Back-test run', b.houses + ' houses replayed with ' + ids.length + ' draft' + (ids.length === 1 ? '' : 's'), '', 'backtests');
        C.go('#/backtests/' + b.id + '?run=1');
      });
    });
  }, {nav:'backtests', perm:'backtests.run'});

  C.route('/backtests/:id', function(view, p){
    var b = C.get('backtests', []).filter(function(x){ return x.id === p.id; })[0];
    if(!b){ view.innerHTML = C.page({title:'That back-test is not here', back:['#/backtests','Back-tests']}); return; }
    var drafts = C.drafts().filter(function(d){ return b.drafts.indexOf(d.id) > -1; }), clean = C.btClean(b), running = C.query().run === '1';
    view.innerHTML = C.page({back:['#/backtests','Back-tests'], kicker:'Back-test report', title:clean ? 'Clean: nothing broke' : 'Problems found', sub:'Started ' + C.time(b.at) + ' by ' + RI.esc(b.by) + '. ' + b.houses + ' houses replayed with ' + (drafts.length ? drafts.length + ' draft' + (drafts.length > 1 ? 's' : '') : 'the published versions only') + '.',
      body:(running ? '<div class="bt-run" id="bt-run"><span class="pq-spin" aria-hidden="true"></span><span><b>Replaying houses…</b> <span id="bt-rn">0</span> of ' + b.houses + '</span><span class="pq-bar"><i id="bt-rb"></i></span></div>' : '') +
        '<div id="bt-body"' + (running ? ' hidden' : '') + '><div class="bt-sum">' + ['dbl','skip','broken','changed'].map(function(k){ var n = b.res[k], bad = k !== 'changed' && n;
          return '<div class="bt-s' + (bad ? ' bad' : '') + '"><b>' + n + '</b><span>' + TYPE[k][0] + '</span><small>' + TYPE[k][1] + '</small></div>'; }).join('') + '</div>' +
        (drafts.length ? '<section class="c-card c-mt"><header><h2>Drafts in this replay</h2></header><ul class="bt-dr">' + drafts.map(function(d){ return '<li>' + C.lbl(d.status) + '<span><b>' + RI.esc(d.title) + '</b><small>' + RI.esc(d.summary || '') + '</small></span></li>'; }).join('') + '</ul></section>' : '') +
        '<section class="c-mt"><h2 class="c-h2">Findings</h2>' + (b.findings.length ? C.table({cols:[{label:'Finding'},{label:'House'},{label:'Line'},{label:'Standard, before', num:true},{label:'After', num:true}],
          rows:b.findings.map(function(f){ return {attr:'data-go="#/houses/' + f.hid + '" tabindex="0" role="link"', cells:['<span class="bt-n' + (f.type === 'changed' ? '' : ' bad') + '">' + f.label + '</span>', RI.esc(f.house), RI.esc(f.line), C.range(f.before[0], f.before[1]), f.type === 'changed' ? C.range(f.after[0], f.after[1]) : '<span class="muted">Not priced</span>']}; })}) : '<div class="c-empty">' + RI.icon('check') + '<p>No findings: every house came out the same.</p></div>') + '</section>' +
        C.note('Differences that match an accepted alternative for a lab house are not counted as problems (PDF section 34). Sample report.') + '</div>'});
    view.addEventListener('click', function(e){ var r = e.target.closest('[data-go]'); if(r) C.go(r.getAttribute('data-go')); });
    C.crumb('Report, ' + C.time(b.at));
    if(running){
      var i = 0, rn = view.querySelector('#bt-rn'), rb = view.querySelector('#bt-rb');
      var t = C.every(function(){ i++; rn.textContent = i; rb.style.width = (i / b.houses * 100) + '%'; if(i >= b.houses){ clearInterval(t); view.querySelector('#bt-run').hidden = true; view.querySelector('#bt-body').hidden = false; history.replaceState(null, '', '#/backtests/' + b.id); } }, C.reduce ? 10 : 110);
    }
  }, {nav:'backtests', perm:'backtests.run'});
})();
