/* Console: content and insight. Guidance and texts (APP_FLOW 7, M4-13), builder documents (M4-16),
   contacts and feedback (M4-15) and the funnel (APP_FLOW 3, M4-19). */
(function(){
  var RI = window.RI, A = RI.App, C = RI.Con, doc = document;
  var DAY = 86400000, now = Date.now();

  C.SEEDS.push(function(){
    C.set('guidance', {
      mech:RI.SAMPLE.mechanicals.map(function(m){ return {name:m.name, life:m.life, range:m.range, text:m.text, v:2, at:now - 12 * DAY}; }),
      texts:[
        {k:'estimate', label:'Estimate disclaimer', where:'Sign up, intake review, presentation, payment', text:'I understand this is an estimate for planning, based on the photos and facts I gave. It is not an inspection or a contractor\'s bid.', v:1, at:now - 20 * DAY},
        {k:'rights', label:'Photo rights', where:'Intake, photos step', text:'I took these photos or have the right to use them.', v:1, at:now - 20 * DAY},
        {k:'unverified', label:'Unverified items', where:'Price and presentation', text:'Left out of every total, never shown as zero. Add what is missing and the house runs again as a new version.', v:1, at:now - 20 * DAY},
        {k:'mech', label:'House systems', where:'Presentation, systems tab', text:'The roof, heating and cooling, water heater and electrical panel are never scored and never part of a package total. Education only; have each one inspected.', v:1, at:now - 20 * DAY}
      ]});
    C.set('docs', []);
    C.set('feedbackSeed', [
      {house:'18450 Maple Ridge Dr', v:'Yes', note:'The unverified list told me exactly what to photograph.', at:now - 2 * DAY},
      {house:'15520 Fairfield St', v:'Somewhat', note:'I expected the roof to be priced.', at:now - 4 * DAY},
      {house:'4227 Hampton Dr', v:'Yes', note:'', at:now - 6 * DAY}
    ]);
  });
  C.APPLY.resources = function(d){ var l = C.get('docs', []); l.forEach(function(x){ if(x.id === d.ref){ x.live = true; x.at = Date.now(); } }); C.set('docs', l); };

  /* ---------- Guidance (APP_FLOW 6.6 and 7, SCHEMA guidance_content_versions, BACKLOG M4-12 and M4-13) ----------
     Each house system has four parts: what to look for, a typical lifespan, a typical range (never in any total)
     and a next step (have it inspected). An edit is a draft, only Sam publishes, and old versions are kept.
     The wording is sample text until Sam's final text arrives (STATUS.md: mechanicals content, Jan 25, 2027). */
  var GU_DUE = 'Jan 25, 2027';
  var GU_LOOK = {
    'Roof':'Curled or missing shingles, granules in the gutters and stains on the ceiling below.',
    'Heating and cooling':'Uneven heat between rooms, rust on the cabinet and a service tag with no recent visits.',
    'Water heater':'Rust at the base or around the fittings, water on the floor and the year printed on the label.',
    'Electrical panel':'Scorch marks, a cover that feels warm and breakers that trip often.'
  };
  var GU_NEXT = {
    'Roof':'Have a roofer look at it before you buy or plan work under it.',
    'Heating and cooling':'Ask a heating and cooling contractor to service it and tell you how it runs.',
    'Water heater':'Have a plumber check it, and read the year on the label.',
    'Electrical panel':'Have a licensed electrician check it before you add lighting or appliances.'
  };
  var GU_ICON = {
    'Roof':'<path d="M2.5 12L12 4.5l9.5 7.5"/><path d="M5.5 10v10h13V10"/><path d="M15.5 7.2V4.5H18v4.6"/><path d="M10 20v-5h4v5"/>',
    'Heating and cooling':'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="1.4"/><path d="M12 10.6c0-3 1.2-4.8 3.6-4.8M13.4 12c3 0 4.8 1.2 4.8 3.6M12 13.4c0 3-1.2 4.8-3.6 4.8M10.6 12c-3 0-4.8-1.2-4.8-3.6"/>',
    'Water heater':'<rect x="6.5" y="3" width="11" height="16" rx="3"/><path d="M9 21h6M12 6.5v2.5"/><path d="M10.4 14.2c0-1.1 1.6-2.7 1.6-2.7s1.6 1.6 1.6 2.7a1.6 1.6 0 0 1-3.2 0z"/>',
    'Electrical panel':'<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7.5h2M13 7.5h2M9 11.5h2M13 11.5h2M9 15.5h2M13 15.5h2"/>',
    _text:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>'
  };
  var GU_HYPE = ['seamless','robust','cutting-edge','unlock','empower','elevate','leverage','effortless','game-changing','next-level','revolutionary','supercharge','harness','world-class','best-in-class','state-of-the-art','delve','dive in'];
  var GU_MF = ['look','life','lo','hi','inspect'], GU_TF = ['text'];
  var GU_NAMES = {look:'What to look for', life:'Typical lifespan', lo:'Low', hi:'High', inspect:'Next step', text:'Wording'};
  function guSvg(p){ return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; }
  function guPick(x, kind){ var o = {}; (kind === 'text' ? GU_TF : GU_MF).forEach(function(k){ o[k] = x[k]; }); return o; }

  /* Older saves kept one block of text per system; split it into the four parts once */
  function guLoad(){
    var g = C.get('guidance'); if(!g) return null; var changed = false, t0 = Date.now();
    g.mech.forEach(function(m){
      if(m.look != null) return;
      var old = {look:m.text || '', life:m.life || '', lo:m.range ? m.range[0] : null, hi:m.range ? m.range[1] : null, inspect:''};
      m.look = GU_LOOK[m.name] || m.text || ''; m.inspect = GU_NEXT[m.name] || '';
      m.lo = old.lo; m.hi = old.hi; m.by = m.by || 'Sam'; m.why = m.why || 'Split into the four parts the presentation shows';
      m.hist = [{v:Math.max(1, (m.v || 2) - 1), at:(m.at || t0) - 28 * DAY, by:'Sam', why:'First sample wording', f:old}];
      delete m.text; delete m.range; changed = true;
    });
    g.texts.forEach(function(t){ if(!t.hist){ t.hist = []; t.by = t.by || 'Sam'; t.why = t.why || 'First sample wording'; changed = true; } });
    if(changed) C.set('guidance', g);
    return g;
  }
  C.APPLY.guidance = function(d){
    var g = guLoad(); if(!g || !d.after) return;
    var kind = d.after.kind === 'text' ? 'text' : 'mech';
    (kind === 'text' ? g.texts : g.mech).forEach(function(x){
      if((x.k || x.name) !== d.ref) return;
      var f = d.after.fields || (kind === 'text' ? {text:d.after.text} : {look:d.after.text});
      x.hist = x.hist || []; x.hist.unshift({v:x.v, at:x.at, by:x.by || 'Sam', why:x.why || '', f:guPick(x, kind)});
      Object.assign(x, f); x.v++; x.at = Date.now(); x.by = d.by || 'Sam'; x.why = d.why || '';
    });
    C.set('guidance', g);
  };
  C.BEFORE.guidance = function(d){
    var g = guLoad(); if(!g || !d.after) return null; var kind = d.after.kind === 'text' ? 'text' : 'mech';
    var x = (kind === 'text' ? g.texts : g.mech).filter(function(y){ return (y.k || y.name) === d.ref; })[0];
    return x ? {v:x.v, before:{kind:kind, fields:guPick(x, kind)}} : null;
  };
  /* The sample Water heater draft was saved with no new wording, so publishing it changed nothing. Give it the wording its summary describes */
  C.REPAIRS.push(function(){
    var g = guLoad(), ds = C.drafts(), fixed = false; if(!g) return;
    ds.forEach(function(d){
      if(d.area !== 'guidance' || d.status !== 'queued' || d.after) return;
      var x = g.mech.filter(function(m){ return m.name === d.ref; })[0]; if(!x) return;
      var f = guPick(x, 'mech');
      if(d.ref === 'Water heater'){ f.look = 'Rust at the base or on the pipes, water on the floor, and the year on the label.'; f.inspect = 'Have a plumber check it. The year on the label tells you how old it is.'; }
      d.after = {kind:'mech', fields:f}; d.summary = 'Changed: What to look for, Next step. Typical range unchanged.'; fixed = true;
    });
    if(fixed) C.set('drafts', ds);
  });

  /* The checks come from DESIGN.md section 9 and the product rules. A cross blocks saving; a warning does not */
  function guChecks(kind, f){
    var words = (kind === 'text' ? [f.text] : [f.look, f.life, f.inspect]).join(' '), low = words.toLowerCase(), out = [];
    function add(ok, hard, label, fix){ out.push({ok:ok, hard:hard, label:label, fix:fix}); }
    if(kind === 'mech'){
      add(['look','life','inspect'].every(function(k){ return String(f[k] || '').trim().length > 0; }) && f.lo != null && f.hi != null, true, 'All four parts are filled in', 'Users always see what to look for, a lifespan, a range and a next step.');
      add(f.lo == null || f.hi == null || f.lo <= f.hi, true, 'Low is not above High', 'Swap the two amounts.');
      add(!/\b(condition|scores?|scored|scoring|rating|rated|grades?|graded|evaluat\w*)\b/.test(low), true, 'No scoring words', 'House systems get guidance, never a condition or a score.');
      add(!/\breplac\w*/.test(low), false, 'Does not push a replacement', 'Age alone never means replace (SY-RULE-026). Point to an inspection instead.');
    } else {
      add(String(f.text || '').trim().length > 0, true, 'Wording is filled in', 'Users always see this text.');
    }
    add(!/\bquotes?\b/.test(low), true, 'Never says quote', 'Say estimate.');
    add(!/[—–!]/.test(words), false, 'No dashes or exclamation marks', 'Use a period or a comma.');
    var hype = GU_HYPE.filter(function(w){ return low.indexOf(w) > -1; });
    add(!hype.length, false, hype.length ? 'Avoid: ' + hype.join(', ') : 'Plain words, no hype', 'These words read as machine written.');
    return out;
  }

  var guMQ = window.matchMedia('(max-width: 899px)');
  function guOnMQ(){ if(/^#\/guidance/.test(location.hash) && !C.dirty()) C.render(); }
  if(guMQ.addEventListener) guMQ.addEventListener('change', guOnMQ); else if(guMQ.addListener) guMQ.addListener(guOnMQ);

  C.route('/guidance', function(view){
    var g = guLoad(), q = C.query(), tab = q.tab === 'texts' ? 'texts' : 'mech', kind = tab === 'mech' ? 'mech' : 'text';
    var phone = guMQ.matches, canEdit = C.can('content.edit'), edit = null, esc = RI.esc;
    var items = tab === 'mech' ? g.mech.map(function(m){ return {k:m.name, label:m.name, x:m}; }) : g.texts.map(function(t){ return {k:t.k, label:t.label, x:t}; });
    var cur = q.k && items.some(function(i){ return i.k === q.k; }) ? q.k : (phone ? null : items[0].k);
    var base = '#/guidance?tab=' + tab;
    function item(){ return items.filter(function(i){ return i.k === cur; })[0]; }
    function fields(){ return edit || guPick(item().x, kind); }
    function differs(){ if(!edit) return false; var x = item().x; return (kind === 'text' ? GU_TF : GU_MF).some(function(k){ return String(edit[k] == null ? '' : edit[k]) !== String(x[k] == null ? '' : x[k]); }); }
    function hardFail(){ return guChecks(kind, fields()).some(function(c){ return !c.ok && c.hard; }); }
    function lifeShort(s){ return String(s || '').split(' for ')[0]; }
    function parts(x){ return [x.look, x.life, x.lo != null && x.hi != null, x.inspect].filter(Boolean).length; }

    /* ---- Overview: summary, tabs and the cards ---- */
    function cardHTML(i){
      var x = i.x, d = C.draftFor('guidance', i.k), on = i.k === cur;
      return '<a class="gu-card' + (on ? ' on' : '') + '" href="' + base + '&k=' + encodeURIComponent(i.k) + '"' + (on ? ' aria-current="true"' : '') + '>' +
        '<span class="gu-ic">' + guSvg(GU_ICON[i.k] || GU_ICON._text) + '</span>' +
        '<span class="gu-card-b"><span class="gu-card-t"><b>' + esc(i.label) + '</b>' + (d ? C.lbl('queued') : '') + '</span>' +
        (kind === 'mech' ? '<span class="gu-card-m">' + esc(lifeShort(x.life)) + '</span><span class="gu-card-m">' + C.range(x.lo, x.hi) + '</span>' : '<span class="gu-card-m">' + esc(x.where) + '</span>') +
        '<span class="gu-card-f">Version ' + x.v + ', ' + C.ago(x.at) + (kind === 'mech' ? '<span class="gu-dot" aria-hidden="true"></span>' + parts(x) + ' of 4 parts' : '') + '</span></span>' +
        '<span class="gu-chev" aria-hidden="true">' + RI.icon('chev', 'i-sm') + '</span></a>';
    }
    function overviewHTML(){
      var waiting = C.queued().filter(function(d){ return d.area === 'guidance'; }).length;
      return '<div class="gu-sum">' +
          '<span class="gu-sum-i"><b>' + g.mech.length + '</b>house systems</span>' +
          '<span class="gu-sum-i"><b>' + g.texts.length + '</b>texts</span>' +
          '<a class="gu-sum-i" href="#/publish"><b>' + waiting + '</b>' + (waiting === 1 ? 'draft' : 'drafts') + ' waiting</a>' +
          '<span class="gu-sum-s">' + C.lbl('sample') + '<span>Sam sends the final wording by ' + GU_DUE + '.</span></span></div>' +
        C.seg('gu-tab', [['mech', 'House systems', g.mech.length], ['texts', 'Disclaimers and texts', g.texts.length]], tab) +
        '<div class="gu-cards" id="gu-cards">' + items.map(cardHTML).join('') + '</div>';
    }

    /* ---- The editor ---- */
    function stateHTML(){ return stateFor(differs()); }
    function stateFor(dirty){ var d = C.draftFor('guidance', cur); return (dirty ? C.lbl('draft', 'not saved') : d ? C.lbl('queued') : C.lbl('published')) + C.lbl('sample'); }
    function fieldHTML(n, key, label, help, control){
      return '<section class="gu-f"><div class="gu-f-h">' + (n ? '<span class="gu-n" aria-hidden="true">' + n + '</span>' : '') + '<label for="gf-' + key + '">' + label + '</label></div>' +
        '<p class="gu-help" id="gh-' + key + '">' + help + '</p>' + control + '</section>';
    }
    function area(key, rows){ var v = fields()[key] || ''; return '<textarea class="input" id="gf-' + key + '" data-f="' + key + '" rows="' + rows + '" aria-describedby="gh-' + key + '"' + (canEdit ? '' : ' readonly') + '>' + esc(v) + '</textarea><span class="gu-count" id="gc-' + key + '">' + v.length + ' characters</span>'; }
    function formHTML(){
      var f = fields(), ro = canEdit ? '' : ' readonly';
      if(kind === 'text'){
        return fieldHTML(0, 'text', 'Wording', 'Plain words, second person. Sam\'s wording replaces this sample.', area('text', 5)) +
          '<section class="gu-f"><div class="gu-f-h"><span class="gu-f-l">Where users read it</span></div><div class="gu-where">' + String(item().x.where || '').split(', ').map(function(w){ return C.chip(esc(w)); }).join('') + '</div></section>';
      }
      var money = function(k, l){ return '<label class="gu-m"><span>' + l + '</span><span class="gu-cur"><span aria-hidden="true">$</span><input class="input" id="gf-' + k + '" data-f="' + k + '" inputmode="numeric" autocomplete="off" value="' + (f[k] == null ? '' : f[k]) + '" aria-describedby="gh-range"' + ro + '></span></label>'; };
      return fieldHTML(1, 'look', 'What to look for', 'Signs anyone can check without tools.', area('look', 3)) +
        fieldHTML(2, 'life', 'Typical lifespan', 'A range of years and the type it applies to.', '<input class="input" id="gf-life" data-f="life" value="' + esc(f.life || '') + '" aria-describedby="gh-life"' + ro + '>') +
        '<section class="gu-f"><div class="gu-f-h"><span class="gu-n" aria-hidden="true">3</span><span class="gu-f-l" id="gl-range">Typical range, for planning</span></div><p class="gu-help" id="gh-range">Shown as a Low and a High. Never added to any total.</p>' +
          '<div class="gu-money" role="group" aria-labelledby="gl-range">' + money('lo', 'Low') + '<span class="gu-to" aria-hidden="true">to</span>' + money('hi', 'High') + '</div></section>' +
        fieldHTML(4, 'inspect', 'Next step', 'Who should look at it. Always a professional.', area('inspect', 3));
    }
    /* One value of the preview, by key. Typing updates only that value, so nothing else redraws */
    function pvVal(k, f){
      var miss = '<span class="gu-miss">Not written yet</span>';
      if(k === 'range') return f.lo != null && f.hi != null ? RI.money(f.lo) + ' to ' + RI.money(f.hi) : miss;
      return String(f[k] || '').trim() ? esc(f[k]) : miss;
    }
    function previewHTML(){
      var f = fields();
      if(kind === 'text'){
        var tick = cur === 'estimate' || cur === 'rights';
        return '<div class="gu-pv-t' + (tick ? '' : ' plain') + '">' + (tick ? '<span class="gu-tick" aria-hidden="true"></span>' : '') + '<p data-pv="text">' + pvVal('text', f) + '</p></div>';
      }
      var s = (RI.SAMPLE.mechanicals || []).filter(function(m){ return m.name === cur; })[0];
      return '<div class="mech-card gu-mc"><h4>' + esc(cur) + '<span class="state state-guidance">Guidance</span></h4>' +
        (s ? '<span class="src">' + esc(s.src) + ' · ' + RI.ev(s.ev) + '</span>' : '') +
        '<dl class="gu-kv"><div class="w"><dt>What to look for</dt><dd data-pv="look">' + pvVal('look', f) + '</dd></div><div><dt>Typical lifespan</dt><dd data-pv="life">' + pvVal('life', f) + '</dd></div>' +
        '<div><dt>Typical range, for planning</dt><dd data-pv="range">' + pvVal('range', f) + '</dd></div><div class="w"><dt>Next step</dt><dd data-pv="inspect">' + pvVal('inspect', f) + '</dd></div></dl>' +
        '<span class="src">Guidance only. Never scored, never added to any total.</span></div>';
    }
    function checksHTML(){ return checksFor(fields()); }
    function checksFor(ff){
      var c = guChecks(kind, ff), bad = c.filter(function(x){ return !x.ok; }), hard = bad.some(function(x){ return x.hard; });
      return '<header><h3>Wording checks</h3><span class="gu-ck-n ' + (hard ? 'bad' : bad.length ? 'warn' : 'ok') + '">' + (c.length - bad.length) + ' of ' + c.length + ' pass</span></header><ul class="gu-ck">' +
        c.map(function(x){ var st = x.ok ? 'ok' : x.hard ? 'bad' : 'warn'; return '<li class="' + st + '"><span class="gu-ck-i">' + RI.icon(x.ok ? 'check' : x.hard ? 'x' : 'warn', 'i-sm') + '</span><span><b>' + esc(x.label) + '</b>' + (x.ok ? '' : '<small>' + esc(x.fix) + '</small>') + '</span></li>'; }).join('') + '</ul>';
    }
    function partsDL(f){
      return '<dl class="gu-old">' + (kind === 'text' ? GU_TF : ['look', 'life', 'range', 'inspect']).map(function(k){
        var v = k === 'range' ? (f.lo != null && f.hi != null ? RI.money(f.lo) + ' to ' + RI.money(f.hi) : '') : f[k];
        return '<div><dt>' + (k === 'range' ? 'Typical range' : GU_NAMES[k]) + '</dt><dd>' + (String(v || '').trim() ? esc(v) : '<span class="muted">Empty</span>') + '</dd></div>'; }).join('') + '</dl>';
    }
    function histRows(){ var x = item().x; return [{cur:true, v:x.v, at:x.at, by:x.by || 'Sam', why:x.why || '', f:guPick(x, kind)}].concat(x.hist || []); }
    function histHTML(){
      return '<header><h3>Versions</h3><span class="small muted">Old versions are kept. Nothing is overwritten.</span></header><ol class="gu-tl">' + histRows().map(function(r, i){
        return '<li' + (r.cur ? ' class="cur"' : '') + '><div class="gu-tl-h"><b>Version ' + r.v + '</b>' + (r.cur ? C.lbl('published', 'live') : '') + '<span class="small muted">' + C.date(r.at) + ' · ' + esc(r.by) + '</span></div>' +
          (r.why ? '<p class="gu-tl-why">' + esc(r.why) + '</p>' : '') +
          (r.cur ? '' : '<details class="gu-tl-d"><summary>See this version</summary>' + partsDL(r.f) + (canEdit ? '<button type="button" class="btn btn-secondary btn-sm" data-restore="' + i + '">Start a draft from it</button>' : '') + '</details>') + '</li>';
      }).join('') + '</ol>';
    }
    function editorHTML(){
      var x = item().x, d = C.draftFor('guidance', cur), mine = d && d.after && d.after.fields && canEdit;
      var head = phone ? '<div class="gu-meta"><span id="gu-state">' + stateHTML() + '</span><span>Version ' + x.v + ', published ' + C.ago(x.at) + ' by ' + esc(x.by || 'Sam') + '</span></div>'
        : '<header class="gu-eh"><div><p class="c-kicker">' + (kind === 'mech' ? 'House system' : 'Text users read') + '</p><h2>' + esc(item().label) + '</h2><p class="c-sub">Version ' + x.v + ', published ' + C.ago(x.at) + ' by ' + esc(x.by || 'Sam') + '.</p></div><span class="gu-state" id="gu-state">' + stateHTML() + '</span></header>';
      return head + C.draftBar('guidance', cur) + (mine ? '<p class="gu-ld"><button type="button" class="btn btn-secondary btn-sm" id="gu-ld">Open the draft wording here</button></p>' : '') +
        '<div class="gu-grid"><div class="gu-form" id="gu-form">' + formHTML() + '</div>' +
        '<aside class="gu-side" aria-label="Preview and checks"><section class="gu-pane"><header><h3>How users see it</h3><span class="small muted">' + (kind === 'mech' ? 'Presentation, share view, PDF' : 'Live wording') + '</span></header><div class="gu-pvbox" id="gu-pv">' + previewHTML() + '</div></section>' +
          '<section class="gu-pane" id="gu-ck">' + checksHTML() + '</section></aside>' +
          '<section class="gu-pane gu-hist" id="gu-hist">' + histHTML() + '</section></div>' +
        '<div id="gu-bar"></div>' + (canEdit ? '' : C.note('Editing guidance needs the permission to edit guidance drafts.', 'lock'));
    }

    /* ---- Page ---- */
    if(phone && cur){
      view.innerHTML = C.page({back:[base, tab === 'mech' ? 'All house systems' : 'All texts'], kicker:kind === 'mech' ? 'House system' : 'Text users read', title:esc(item().label), body:'<div class="gu-edit" id="gu-edit">' + editorHTML() + '</div>'});
    } else {
      view.innerHTML = C.page({kicker:'Content', title:'Guidance', sub:'What users read about the house systems, and the texts they see at key moments. Edits are drafts; only Sam publishes, and old versions are kept.',
        body:overviewHTML() + (cur ? '<div class="gu-edit" id="gu-edit">' + editorHTML() + '</div>' : '')});
    }
    RI.fillIcons(view);

    /* ---- Live updates while typing: preview, checks, state and the save bar ---- */
    /* The bar is created once and then only changed when its state flips, so it never flickers while typing */
    var barHard = null;
    function syncBar(){
      var bar = doc.getElementById('gu-bar'); if(!bar) return;
      if(!differs() || !canEdit){ if(bar.firstChild) bar.innerHTML = ''; barHard = null; return; }
      if(!bar.querySelector('.c-savebar')){ bar.innerHTML = C.saveBar('gu'); RI.fillIcons(bar); barHard = null; }
      var hard = hardFail(); if(hard === barHard) return; barHard = hard;
      doc.getElementById('gu-save').disabled = hard;
      bar.querySelector('.c-savebar>span').innerHTML = RI.icon(hard ? 'warn' : 'info', 'i-sm') + (hard ? '<b>Fix the checks marked with a cross</b> to save this as a draft.' : '<b>Unsaved changes.</b> Saving makes a draft; it goes live when Sam publishes it.');
    }
    /* Typing touches only what really changed: one preview value, the checks when a result flips, the label when the state flips */
    var lastCk = null, lastState = null;
    function refresh(){
      var f = fields();
      doc.querySelectorAll('#gu-pv [data-pv]').forEach(function(el){ var h = pvVal(el.getAttribute('data-pv'), f); if(el._h === undefined) el._h = pvVal(el.getAttribute('data-pv'), guPick(item().x, kind)); if(el._h !== h){ el.innerHTML = h; el._h = h; } });
      var ck = checksHTML(); if(lastCk === null) lastCk = checksFor(guPick(item().x, kind));
      if(ck !== lastCk){ lastCk = ck; doc.getElementById('gu-ck').innerHTML = ck; }
      var st = stateHTML(); if(lastState === null) lastState = stateFor(false);
      if(st !== lastState){ lastState = st; doc.getElementById('gu-state').innerHTML = st; }
      ['look', 'inspect', 'text'].forEach(function(k){ var c = doc.getElementById('gc-' + k), t = String(f[k] || '').length + ' characters'; if(c && c.textContent !== t) c.textContent = t; });
      syncBar();
    }
    function redrawEditor(){ var ed = doc.getElementById('gu-edit'); if(!ed) return; ed.innerHTML = editorHTML(); RI.fillIcons(ed); lastCk = null; lastState = null; syncBar(); }

    view.addEventListener('input', function(e){
      var t = e.target, k = t.getAttribute('data-f'); if(!k || !canEdit || !cur) return;
      if(!edit) edit = guPick(item().x, kind);
      if(k === 'lo' || k === 'hi'){ var digits = t.value.replace(/[^\d]/g, ''); if(t.value !== digits) t.value = digits; edit[k] = digits === '' ? null : +digits; }
      else edit[k] = t.value;
      if(!differs()) edit = null;
      refresh();
    });
    /* Moving to another system or tab with unsaved changes asks first (the console guard covers leaving the screen) */
    view.addEventListener('click', function(e){
      var a = e.target.closest('a[href^="#/guidance"]');
      if(a && differs()){ e.preventDefault(); var to = a.getAttribute('href');
        C.confirm('Leave without saving?', 'Your changes are not saved as a draft yet. If you leave, they are lost.', 'Leave', function(){ edit = null; location.hash = to; }, true); return; }
      var tb = e.target.closest('#gu-tab [data-v]');
      if(tb){ var go = function(){ location.hash = '#/guidance?tab=' + tb.getAttribute('data-v'); };
        if(differs()) C.confirm('Leave without saving?', 'Your changes are not saved as a draft yet. If you leave, they are lost.', 'Leave', function(){ edit = null; go(); }, true); else go(); return; }
      if(e.target.closest('#gu-undo')){ edit = null; redrawEditor(); return; }
      if(e.target.closest('#gu-ld')){ var dr = C.draftFor('guidance', cur); edit = Object.assign(guPick(item().x, kind), dr.after.fields); if(!differs()) edit = null; redrawEditor(); RI.toast('The draft wording is open. Save to replace the draft.', 'info'); return; }
      var rs = e.target.closest('[data-restore]');
      if(rs){ var r = histRows()[+rs.getAttribute('data-restore')]; edit = Object.assign(guPick(item().x, kind), r.f); if(!differs()) edit = null; redrawEditor(); RI.toast('Version ' + r.v + ' is open. Save it as a draft to propose it.', 'info'); window.scrollTo({top:(doc.getElementById('gu-form').getBoundingClientRect().top + window.scrollY - 90), behavior:'smooth'}); return; }
      if(e.target.closest('#gu-save')){
        if(hardFail()) return;
        var x = item().x, changed = (kind === 'text' ? GU_TF : GU_MF).filter(function(k){ return String(edit[k] == null ? '' : edit[k]) !== String(x[k] == null ? '' : x[k]); }).map(function(k){ return GU_NAMES[k]; });
        var title = (kind === 'mech' ? 'Guidance: ' : 'Text: ') + item().label, fields2 = Object.assign({}, edit);
        C.askWhy(title, 'Changed: ' + changed.join(', '), function(why){
          C.addDraft({area:'guidance', ref:cur, title:title, summary:'Changed: ' + changed.join(', '), after:{kind:kind, fields:fields2}, why:why});
          edit = null; RI.toast('Saved as a draft. It waits in the publish queue.', 'check'); C.render();
        });
      }
    });
    syncBar();
  }, {nav:'guidance', perm:'rulebook.view'});

  /* ---------- Builder documents ---------- */
  C.route('/resources', function(view){
    var canEdit = C.can('content.edit'), up = C.get('docs', []);
    var docs = RI.SCOPE_DOCS.map(function(d, i){ return {id:d.k, t:d.t, trade:d.trade, pages:d.pages, d:d.d, sec:d.sec, live:true, at:now - (5 + i * 7) * DAY, v:1 + i % 3}; }).concat(up);
    view.innerHTML = C.page({kicker:'Content', title:'Builder documents', sub:'Sam\'s scope documents. Builder and agent accounts read and download them; homeowner accounts never see them.',
      actions:canEdit ? '<label class="btn btn-primary file-btn">' + RI.icon('file','i-sm') + 'Upload a document<input type="file" accept="application/pdf" id="rs-up"></label>' : '',
      body:'<div class="rs">' + docs.map(function(d){ var dr = C.draftFor('resources', d.id); return '<article class="rs-card"><span class="rs-ic">' + RI.icon('file') + '<em>PDF</em></span><div class="rs-b"><h2>' + RI.esc(d.t) + '</h2><p>' + RI.esc(d.d || 'Uploaded document') + '</p><p class="rs-m">' + RI.esc(d.trade || '') + (d.pages ? ' · ' + d.pages + ' pages' : '') + ' · ' + C.date(d.at) + '</p></div><div class="rs-a">' + (dr ? C.lbl('queued') : d.live ? C.lbl('published', 'v' + (d.v || 1)) : C.lbl('draft')) + (d.sec ? '<button type="button" class="btn btn-secondary btn-sm" data-pv="' + d.id + '">Preview</button>' : '') + '</div></article>'; }).join('') + '</div>' +
        C.note('Visible to builder and agent accounts only (SECURITY 2). A new document waits in the publish queue until Sam publishes it.')});
    view.addEventListener('click', function(e){ var b = e.target.closest('[data-pv]'); if(!b) return; var d = docs.filter(function(x){ return x.id === b.getAttribute('data-pv'); })[0];
      C.dialog(RI.esc(d.t), '<p class="small muted">' + RI.esc(d.trade) + ' · ' + d.pages + ' pages</p><ol class="pk-tasks">' + d.sec.map(function(s){ return '<li><b>' + RI.esc(s[0]) + '</b><span>' + RI.esc(s[1]) + '</span></li>'; }).join('') + '</ol>', {wide:true}); });
    var inp = view.querySelector('#rs-up'); if(inp) inp.addEventListener('change', function(){ var f = inp.files[0]; if(!f) return;
      if(!/pdf$/i.test(f.type) && !/\.pdf$/i.test(f.name)){ RI.toast('Upload a PDF.', 'warn'); return; }
      var id = C.uid('doc'), list = C.get('docs', []); list.push({id:id, t:f.name.replace(/\.pdf$/i, ''), trade:'Uploaded', pages:0, d:Math.round(f.size / 1024) + ' KB', live:false, at:Date.now(), v:1}); C.set('docs', list);
      C.addDraft({area:'resources', ref:id, title:'Builder document: ' + f.name, summary:'New document, ' + Math.round(f.size / 1024) + ' KB', why:''}); RI.toast('Uploaded. It waits in the publish queue.', 'check'); C.render(); });
  }, {nav:'resources', perm:'content.edit'});

  /* ---------- Contacts and feedback ----------
     APP_FLOW 7: feedback from presentations; export of contacts and the updates list. SECURITY 3.2 (contacts.export),
     6.3 (consent with time and wording version), 11 (exports are formula-safe), 15 (exports are logged). RUNBOOK: the product
     exports the waitlist (it is part of Export contacts); Sam writes from his own tool. */
  var SAMPLE_CONTACTS = [
    {email:'maria.lopez@example.com', type:'homeowner', from:'Sign up', consent:'given', v:1, at:now - 49 * DAY},
    {email:'aisha.khan@example.com', type:'agent', from:'Sign up', consent:'given', v:1, at:now - 9 * DAY},
    {email:'kim.tran@example.com', type:'homeowner', from:'Waitlist', consent:'given', v:1, at:now - 2 * DAY},
    {email:'sara.l@example.com', type:'buyer', from:'Waitlist', consent:'given', v:1, at:now - 10 * DAY},
    {email:'oscar.b@example.com', type:'builder', from:'Waitlist', consent:'none', at:now - 3 * DAY},
    {email:'j.carter@example.com', type:'buyer', from:'Sign up', consent:'none', at:now - 13 * DAY},
    {email:'hannah.price@example.com', type:'homeowner', from:'Sign up', consent:'withdrawn', v:1, at:now - 29 * DAY, off:now - 12 * DAY},
    {email:'t.nowak@example.com', type:'seller', from:'Sign up', consent:'none', at:now - DAY},
    {email:'n.patel@example.com', type:'agent', from:'Waitlist', consent:'given', v:1, at:now - 5 * DAY},
    {email:'rosa.vega@example.com', type:'builder', from:'Waitlist', consent:'given', v:1, at:now - 7 * DAY},
    {email:'kai.tan@example.com', type:'homeowner', from:'Waitlist', consent:'given', v:1, at:now - 9 * DAY},
    {email:'elif.kaya@example.com', type:'seller', from:'Waitlist', consent:'none', at:now - 12 * DAY},
    {email:'priya.shah@example.com', type:'homeowner', from:'Sign up', consent:'given', v:1, at:now - 14 * DAY},
    {email:'will.ade@example.com', type:'agent', from:'Waitlist', consent:'given', v:1, at:now - 15 * DAY},
    {email:'ben.okafor@example.com', type:'buyer', from:'Sign up', consent:'none', at:now - 17 * DAY},
    {email:'lena.fischer@example.com', type:'seller', from:'Sign up', consent:'given', v:1, at:now - 20 * DAY},
    {email:'lee.morgan@example.com', type:'other', from:'Waitlist', consent:'none', at:now - 22 * DAY},
    {email:'carlos.mena@example.com', type:'homeowner', from:'Sign up', consent:'given', v:1, at:now - 24 * DAY},
    {email:'nina.petrov@example.com', type:'homeowner', from:'Sign up', consent:'withdrawn', v:1, at:now - 28 * DAY, off:now - 6 * DAY},
    {email:'tom.becker@example.com', type:'builder', from:'Sign up', consent:'given', v:1, at:now - 34 * DAY},
    {email:'grace.liu@example.com', type:'agent', from:'Sign up', consent:'none', at:now - 39 * DAY},
    {email:'omar.haddad@example.com', type:'homeowner', from:'Sign up', consent:'given', v:1, at:now - 45 * DAY},
    {email:'ivy.chen@example.com', type:'buyer', from:'Sign up', consent:'given', v:1, at:now - 52 * DAY},
    {email:'dwallace@example.com', type:'builder', from:'Sign up', consent:'given', v:1, at:now - 63 * DAY}
  ];
  /* Example feedback over seven weeks: every answer, every package, comments and a few without one */
  var SAMPLE_FEEDBACK = [
    ['18450 Maple Ridge Dr', 'Standard', 'Yes', 'The unverified list told me exactly what to photograph.', 'maria.lopez', 2],
    ['15520 Fairfield St', 'Premium', 'Somewhat', 'I expected the roof to be priced.', 'aisha.khan', 4],
    ['4227 Hampton Dr', 'Essential', 'Yes', '', 'j.carter', 6],
    ['912 Linden Ave', 'Standard', 'Yes', 'Room by room made it easy to talk it through with my contractor.', 'dwallace', 8],
    ['3307 Birchwood Ct', 'Premium', 'No', 'I wanted one number. The range was wider than I hoped.', 't.nowak', 11],
    ['77 Orchard Ln', 'Standard', 'Yes', 'Shared it with my agent the same day.', 'priya.shah', 13],
    ['5610 Cedar Ridge Rd', 'Essential', 'Somewhat', 'The kitchen photo was too dark and it said unverified. Fair, but tell me sooner.', 'ben.okafor', 16],
    ['1440 Westview Dr', 'Standard', 'Yes', 'Seeing what Essential leaves out helped us choose.', 'lena.fischer', 19],
    ['286 Harbor St', 'Premium', 'Yes', 'The product list saved me a weekend of browsing.', 'carlos.mena', 23],
    ['9021 Elm Grove Rd', 'Standard', 'No', 'The basement was marked unknown. I know it needs work; let me say so.', 'nina.petrov', 27],
    ['640 Willow Bend', 'Essential', 'Yes', '', 'tom.becker', 33],
    ['1188 Ridgeline Dr', 'Standard', 'Somewhat', 'Good detail. The PDF was long to read on a phone.', 'grace.liu', 38],
    ['52 Meadow Ct', 'Premium', 'Yes', 'The split by trade is what my builder asked for.', 'omar.haddad', 44],
    ['2705 Lakeshore Dr', 'Standard', 'Yes', 'Clear about what it could not see.', 'ivy.chen', 51]
  ].map(function(x){ return {house:x[0], pkg:x[1], v:x[2], note:x[3], who:x[4] + '@example.com', at:now - x[5] * DAY}; });
  /* A cell that starts with =, +, - or @ is written so a spreadsheet does not run it (SECURITY 11) */
  function cell(v){ v = String(v == null ? '' : v); if(/^[=+\-@\t\r]/.test(v)) v = "'" + v; return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function csv(head, rows){ return [head].concat(rows).map(function(r){ return r.map(cell).join(','); }).join('\n'); }
  function save(name, text){ var a = doc.createElement('a'); a.href = URL.createObjectURL(new Blob([text], {type:'text/csv'})); a.download = name; a.click(); }
  var capT = function(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; };

  C.route('/feedback', function(view){
    var q0 = C.query(), tab = q0.tab === 'contacts' ? 'contacts' : 'feedback', st = {q:'', f:q0.f || 'all', a:q0.a || 'all'}, canExp = C.can('contacts.export');
    var pkgName = function(k){ var p = (RI.PACKAGES || []).filter(function(x){ return x.key === k; })[0]; return p ? p.name : ''; };
    var fb = A.all().filter(function(h){ return h.feedback; }).map(function(h){ return {house:A.addr(h), hid:h.id, who:h.owner || '', pkg:pkgName(h.pk), v:h.feedback.v, note:h.feedback.note || '', at:h.feedback.at || h.updated}; })
      .concat(SAMPLE_FEEDBACK);
    /* Everyone who left an email: accounts and the waitlist, each with the state of their updates consent */
    var users = RI.users.all(), contacts = Object.keys(users).map(function(k){ return users[k]; }).filter(function(u){ return u.role !== 'staff'; })
      .map(function(u){ return {email:u.email, type:u.type, from:'Sign up', consent:u.news ? 'given' : 'none', v:1, at:u.at}; })
      .concat(RI.store.get('waitlist', []).map(function(w){ return {email:w.email, type:w.type, from:'Waitlist', consent:w.news ? 'given' : 'none', v:1, at:w.at}; }));
    SAMPLE_CONTACTS.forEach(function(s){ if(!contacts.some(function(c){ return c.email === s.email; })) contacts.push(s); });
    contacts.sort(function(a, b){ return b.at - a.at; });
    var updates = contacts.filter(function(c){ return c.consent === 'given'; });
    var yes = fb.filter(function(f){ return f.v === 'Yes'; }).length;
    /* Four headline cards, from the same rows as the lists below, so the numbers always agree with what is listed */
    var inDays = function(f, a, b){ var d = (now - f.at) / DAY; return d >= a && d < b; };
    var f30 = fb.filter(function(f){ return inDays(f, 0, 30); }).length, fPrev = fb.filter(function(f){ return inDays(f, 30, 60); }).length;
    var weeks = [5, 4, 3, 2, 1, 0].map(function(w){ return fb.filter(function(f){ return inDays(f, w * 7, w * 7 + 7); }).length; });
    var spark = function(arr){
      var w = 112, h = 34, max = Math.max(1, Math.max.apply(null, arr)), n = arr.length;
      var pts = arr.map(function(v, i){ return [i / (n - 1) * (w - 6) + 3, h - 4 - v / max * (h - 10)]; });
      var line = 'M' + pts.map(function(p){ return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L'), last = pts[n - 1];
      return '<svg class="k3-sp fg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><path class="f" d="' + line + ' L' + last[0].toFixed(1) + ',' + h + ' L3,' + h + ' Z"/><path class="l" d="' + line + '"/><circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="3"/></svg>';
    };
    var change = f30 - fPrev, chip = '<span class="k3-d ' + (change > 0 ? 'good' : change < 0 ? 'bad' : 'flat') + '">' + (change === 0 ? 'No change' : (change > 0 ? '+' : '') + change) + '</span>';
    var fromWl = contacts.filter(function(c){ return c.from === 'Waitlist'; }).length;
    var k3 = function(o){ return '<a class="k3' + (o.inv ? ' k3-inv' : '') + '" href="' + o.href + '"><span class="k3-h"><span class="k3-ic">' + RI.icon(o.icon, 'i-sm') + '</span>' + o.label + '</span><span class="k3-m"><b>' + o.value + '</b>' + (o.sp || '') + '</span><span class="k3-f">' + (o.chip || '') + '<span>' + o.foot + '</span></span></a>'; };
    var kpis = '<div class="k3s fb-k">' +
      k3({icon:'chat', label:'Feedback, 30 days', value:f30, sp:spark(weeks), chip:chip, foot:'vs the 30 days before', href:'#/feedback'}) +
      k3({icon:'check', label:'Said it helped', value:(fb.length ? Math.round(yes / fb.length * 100) : 0) + '%', foot:yes + ' of ' + fb.length + ' answered Yes', href:'#/feedback?a=Yes'}) +
      k3({icon:'user', label:'Contacts', value:contacts.length, foot:fromWl + ' from the waitlist, ' + (contacts.length - fromWl) + ' from sign up', href:'#/feedback?tab=contacts'}) +
      k3({icon:'mail', label:'Updates list', value:updates.length, foot:'agreed to updates, ready to export', href:'#/feedback?tab=contacts&f=given', inv:true}) + '</div>';

    view.innerHTML = C.page({kicker:'Customers', title:'Contacts and feedback', sub:'Feedback from presentations, contacts with consent, the updates list, and the exports Sam uses in his own tool.',
      actions:canExp ? '<button type="button" class="btn btn-secondary" id="fb-exp-ct" title="Everyone listed under Contacts, with their consent">' + RI.icon('download','i-sm') + 'Export contacts <span class="fb-n">' + contacts.length + '</span></button>' +
        '<button type="button" class="btn btn-primary" id="fb-exp-up" title="Only the people who agreed to updates">' + RI.icon('download','i-sm') + 'Export the updates list <span class="fb-n">' + updates.length + '</span></button>' : '',
      body:kpis + '<div class="fb-top">' + C.seg('fb-tab', [['feedback','Feedback',fb.length],['contacts','Contacts',contacts.length]], tab) + '<div id="fb-tools" class="us-bar"></div></div><div id="fb-body"></div>'});

    function consentLbl(c){
      if(c.consent === 'given') return '<span class="lb lb-pub">Agreed</span>';
      if(c.consent === 'withdrawn') return '<span class="lb lb-off">Withdrawn</span>';
      return '<span class="lb lb-off">Not agreed</span>';
    }
    function agreedOn(c){
      if(c.consent === 'given') return '<span class="fb-on">' + C.date(c.at) + '<small>Wording v' + (c.v || 1) + '</small></span>';
      if(c.consent === 'withdrawn') return '<span class="fb-on">' + C.date(c.off) + '<small>Withdrawn in account settings</small></span>';
      return '<span class="muted">&ndash;</span>';
    }
    function body(){
      var el = doc.getElementById('fb-body'), tools = doc.getElementById('fb-tools');
      if(tab === 'feedback'){
        var cnt = function(v){ return fb.filter(function(f){ return f.v === v; }).length; }, shown = fb.filter(function(f){ return st.a === 'all' || f.v === st.a; });
        tools.innerHTML = '<label class="c-select us-pick"><span class="sr">Answer</span><select id="fb-a">' + [['all','All answers',fb.length],['Yes','Yes',cnt('Yes')],['Somewhat','Somewhat',cnt('Somewhat')],['No','No',cnt('No')]].map(function(o){ return '<option value="' + o[0] + '"' + (o[0] === st.a ? ' selected' : '') + '>' + o[1] + ' (' + o[2] + ')</option>'; }).join('') + '</select></label>';
        /* The Said it helped card and the answer filter carry the summary, so it is not repeated here */
        el.innerHTML = (shown.length ? '<ul class="fb-list">' + shown.map(function(f){ return '<li><span class="fb-v fb-' + f.v.toLowerCase() + '">' + f.v + '</span><div><p>' + (f.note ? '&ldquo;' + RI.esc(f.note) + '&rdquo;' : '<span class="muted">No comment</span>') + '</p>' +
            '<small>' + (f.who ? '<b class="fb-who">' + RI.esc(f.who) + '</b> &middot; ' : '') + RI.esc(f.house) + (f.pkg ? ' &middot; ' + f.pkg : '') + ' &middot; ' + C.ago(f.at) + '</small></div>' + (f.hid ? '<a class="small" href="#/houses/' + f.hid + '">House</a>' : '') + '</li>'; }).join('') + '</ul>' : '<div class="c-empty">' + RI.icon('info') + '<p>No feedback with this answer yet.</p></div>') +
          '<div class="c-mt">' + C.note('Rows with example.com addresses are examples. New feedback from presentations in this browser appears with them.') + '</div>';
        tools.querySelector('#fb-a').addEventListener('change', function(){ st.a = this.value; body(); doc.getElementById('fb-a').focus(); });
      }
      if(tab === 'contacts'){
        var n = function(k){ return contacts.filter(function(c){ return c.consent === k; }).length; };
        tools.innerHTML = C.search('fb-q', 'Search by email', st.q) +
          '<label class="c-select us-pick"><span class="sr">Updates</span><select id="fb-f">' + [['all','All contacts',contacts.length],['given','Agreed to updates',n('given')],['none','Not agreed',n('none')],['withdrawn','Withdrawn',n('withdrawn')]].map(function(o){ return '<option value="' + o[0] + '"' + (o[0] === st.f ? ' selected' : '') + '>' + o[1] + ' (' + o[2] + ')</option>'; }).join('') + '</select></label>';
        var rows = contacts.filter(function(c){ return (st.f === 'all' || c.consent === st.f) && (!st.q || c.email.indexOf(st.q) > -1); });
        el.innerHTML = C.table({cls:'fb-ct', empty:'Nobody matches. Try another email, or show all.', cols:[{label:'Email'},{label:'Account type'},{label:'From'},{label:'Updates'},{label:'Agreed on'}],
          rows:rows.map(function(c){ return {cells:['<b>' + RI.esc(c.email) + '</b>', c.type ? C.chip(capT(c.type)) : '<span class="muted">Not given</span>', c.from, consentLbl(c), agreedOn(c)]}; })}) +
          '<div class="c-mt">' + C.note('Export contacts holds everyone listed here, with their consent. Export the updates list holds only the people who agreed. Each consent keeps its time and the version of the wording they saw.') + '</div>';
        RI.fillIcons(tools);
        tools.querySelector('#fb-q').addEventListener('input', function(){ st.q = this.value.trim().toLowerCase(); var p = this.selectionStart; body(); var x = doc.getElementById('fb-q'); x.focus(); x.setSelectionRange(p, p); });
        tools.querySelector('#fb-f').addEventListener('change', function(){ st.f = this.value; body(); doc.getElementById('fb-f').focus(); });
      }
      RI.fillIcons(el);
    }
    view.querySelector('#fb-tab').addEventListener('click', function(e){ var b = e.target.closest('[data-v]'); if(!b) return; tab = b.getAttribute('data-v'); view.querySelectorAll('#fb-tab [data-v]').forEach(function(x){ x.setAttribute('aria-selected', x === b); }); history.replaceState(null, '', '#/feedback?tab=' + tab); body(); });
    var eu = view.querySelector('#fb-exp-up'); if(eu) eu.addEventListener('click', function(){
      save('updates-list.csv', csv(['email', 'account type', 'from', 'agreed on', 'wording version'], updates.map(function(c){ return [c.email, c.type || '', c.from, new Date(c.at).toISOString().slice(0, 10), 'v' + (c.v || 1)]; })));
      C.log('Contacts exported', 'Updates list, ' + updates.length + ' contacts who agreed', '', 'feedback'); RI.toast('Updates list exported: ' + updates.length + ' contacts.', 'file');
    });
    var ec = view.querySelector('#fb-exp-ct'); if(ec) ec.addEventListener('click', function(){
      var word = {given:'agreed', none:'not agreed', withdrawn:'withdrawn'};
      save('contacts.csv', csv(['email', 'account type', 'from', 'updates', 'agreed on', 'wording version'], contacts.map(function(c){ return [c.email, c.type || '', c.from, word[c.consent], c.consent === 'given' ? new Date(c.at).toISOString().slice(0, 10) : '', c.consent === 'given' ? 'v' + (c.v || 1) : '']; })));
      C.log('Contacts exported', 'Contacts, ' + contacts.length + ' people with their consent', '', 'feedback'); RI.toast('Contacts exported: ' + contacts.length + ' people.', 'file');
    });
    body();
  }, {nav:'feedback', perm:'contacts.export'});
})();

/* ---------- Funnel (APP_FLOW 3, BACKLOG M4-19, SEO_CONVERSION 9) ----------
   Sample data for the last 7, 30 or 90 days. Four headline numbers (intakes, free views, paid presentations, shares),
   the nine steps from visit to share, where people leave and what each screen does about it, then before sign up
   and after paying. */
(function(){
  var RI = window.RI, C = RI.Con, doc = document, DAY = 86400000;
  var I = function(n, c){ return RI.icon(n, c || ''); }, fmt = function(n){ return Math.round(n).toLocaleString('en-US'); };
  var pct = function(a, b){ return b ? a / b * 100 : 0; };
  /* The nine steps of APP_FLOW 3, with what makes people leave and what the screen does about it.
     auto: the step follows on its own (the price arrives, the paid presentation opens), drawn lighter.
     rank: counted among the drops worth acting on. Arriving to signing up is left out (before launch most visitors
     join the waitlist instead), and so is sharing (it comes after payment). */
  var FLOW = [
    {e:'page_view', l:'Arrives', s:'Home or area page', why:'Does not understand what it is in five seconds', fix:'One sentence, one button, a real presentation shown'},
    {e:'signup_completed', l:'Starts', s:'Sign up', why:'Too many fields', fix:'Email, password, account type. Nothing else'},
    {e:'intake_submitted', l:'Enters the house', s:'Intake wizard', why:'Long forms, lost progress', fix:'Fewest inputs, saved at every step, measurements optional', rank:true},
    {e:'price_ready', l:'Waits', s:'House page', why:'Does not know if it is working', fix:'Live progress, and an email when the price is ready', auto:true},
    {e:'price_viewed', l:'Sees the price', s:'House page', why:'Does not trust the number', fix:'Low and High, the "partial" label, what is unverified and why', rank:true},
    {e:'checkout_started', l:'Decides to pay', s:'House page', why:'Does not know what the money buys', fix:'A clear list and preview of what the presentation holds', rank:true},
    {e:'payment_completed', l:'Pays', s:'Stripe Checkout', why:'Payment friction', fix:'Stripe\'s own page; return straight into the presentation', rank:true},
    {e:'presentation_opened', l:'Reads', s:'Presentation', why:'Hard to read on a phone', fix:'Sticky package switch and total, rooms that open and close', auto:true},
    {e:'share_created', l:'Spreads it', s:'Share view', why:'Nothing to pass on', fix:'Share link and PDF on every presentation'}
  ];
  /* Sample month: invented numbers that show the layout, labelled as sample */
  /* Sample data for each period: counts per event, the period before (for the change on the cards), and a trend line */
  var SETS = {
    7:{c:{page_view:468, waitlist_joined:51, signup_completed:24, intake_started:19, intake_submitted:14, price_ready:14, price_viewed:13, checkout_started:6, payment_completed:4, presentation_opened:4, share_created:2, share_viewed:7, feedback_sent:1},
      before:{intake_submitted:11, price_viewed:10, payment_completed:3, share_created:1},
      series:{intake_submitted:[1,2,2,2,2,2,3], price_viewed:[1,1,2,2,2,2,3], payment_completed:[0,1,0,1,0,1,1], share_created:[0,0,1,0,0,0,1]}},
    30:{c:{page_view:1840, waitlist_joined:212, signup_completed:96, intake_started:71, intake_submitted:52, price_ready:51, price_viewed:49, checkout_started:21, payment_completed:14, presentation_opened:14, share_created:6, share_viewed:23, feedback_sent:5},
      before:{intake_submitted:44, price_viewed:41, payment_completed:10, share_created:4},
      series:{intake_submitted:[4,5,6,6,7,7,8,9], price_viewed:[4,4,5,6,7,7,8,8], payment_completed:[1,1,1,2,2,2,2,3], share_created:[0,1,0,1,1,1,1,1]}},
    90:{c:{page_view:4920, waitlist_joined:566, signup_completed:241, intake_started:176, intake_submitted:128, price_ready:125, price_viewed:119, checkout_started:47, payment_completed:31, presentation_opened:31, share_created:12, share_viewed:44, feedback_sent:11},
      before:{intake_submitted:97, price_viewed:90, payment_completed:22, share_created:9},
      series:{intake_submitted:[10,11,12,13,14,15,16,18,19], price_viewed:[9,10,11,12,13,14,15,17,18], payment_completed:[2,2,3,3,3,4,4,5,5], share_created:[1,1,1,1,1,2,1,2,2]}}
  };

  function spark(arr, tone){
    var w = 112, h = 34, max = Math.max(1, Math.max.apply(null, arr)), n = arr.length;
    var pts = arr.map(function(v, i){ return [i / (n - 1) * (w - 6) + 3, h - 4 - v / max * (h - 10)]; });
    var line = 'M' + pts.map(function(p){ return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L'), last = pts[n - 1];
    return '<svg class="k3-sp ' + tone + '" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><path class="f" d="' + line + ' L' + last[0].toFixed(1) + ',' + h + ' L3,' + h + ' Z"/><path class="l" d="' + line + '"/><circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="3"/></svg>';
  }
  function delta(now, before){
    var d = now - before, txt = d === 0 ? 'No change' : (d > 0 ? '+' : '') + Math.round(d / before * 100) + '%';
    return '<span class="k3-d ' + (d === 0 ? 'flat' : d > 0 ? 'good' : 'bad') + '">' + txt + '</span>';
  }


  C.route('/funnel', function(view){
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var md = function(d){ return d.toLocaleDateString('en-US', {month:'short', day:'numeric'}); };
    var days = [7, 30, 90].indexOf(+C.query().days) > -1 ? +C.query().days : 30;
    function sub(){ var from = new Date(+today - (days - 1) * DAY); return 'Last ' + days + ' days, ' + md(from) + ' to ' + md(today) + ', ' + today.getFullYear() + '. Invented numbers.'; }
    /* The period: the same joined buttons as the audit log, a radio group with arrow keys */
    var per = '<div class="au-period" id="fu-days" role="radiogroup" aria-label="Period">' + [7, 30, 90].map(function(d){ return '<button type="button" role="radio" data-v="' + d + '" aria-checked="' + (d === days) + '" tabindex="' + (d === days ? 0 : -1) + '">' + d + ' days</button>'; }).join('') + '</div>';
    view.innerHTML = C.page({kicker:'Customers', title:'Funnel', sub:sub(), actions:per, body:'<div id="fu-body"></div>'});

    function card(o){ return '<section class="c3' + (o.cls ? ' ' + o.cls : '') + '" aria-labelledby="fn-' + o.id + '"><header class="c3-h"><div><h2 id="fn-' + o.id + '">' + o.title + '</h2>' + (o.sub ? '<p>' + o.sub + '</p>' : '') + '</div>' + (o.aside || '') + '</header>' + o.body + (o.foot ? '<footer class="c3-f sp">' + o.foot + '</footer>' : '') + '</section>'; }

    function body(){
      var D = SETS[days], n = function(e){ return D.c[e] || 0; };
      view.querySelector('.c-sub').textContent = sub();

      /* ---------- Four headline numbers (BACKLOG M4-19) ---------- */
      var kpi = function(icon, label, e){
        var v = n(e);
        return '<div class="k3"><span class="k3-h"><span class="k3-ic">' + I(icon, 'i-sm') + '</span>' + label + '</span><span class="k3-m"><b>' + fmt(v) + '</b>' + spark(D.series[e], 'fg') + '</span>' +
          '<span class="k3-f">' + delta(v, D.before[e]) + '<span>vs the ' + days + ' days before</span></span></div>';
      };
      var kpis = '<div class="k3s fn-k">' + kpi('house', 'Houses submitted', 'intake_submitted') + kpi('eye', 'Free price views', 'price_viewed') +
        kpi('file', 'Paid presentations', 'payment_completed') + kpi('share', 'Shares', 'share_created') + '</div>';

      /* ---------- From visit to share ----------
         One bar per step on a square-root scale, so the later steps stay readable next to the visitors.
         Bronze: the step keeps under 30% of the one before. Lighter: the step follows on its own.
         The three biggest drops worth acting on carry 1 to 3, matching the list below. */
      var top = Math.max.apply(null, [1].concat(FLOW.map(function(s){ return n(s.e); }))), steps = FLOW.map(function(s, i){ var v = n(s.e), p = i ? n(FLOW[i - 1].e) : null; return {s:s, v:v, p:p, keep:p ? v / p : null, lost:p ? Math.max(0, p - v) : 0}; });
      var leaks = steps.filter(function(x){ return x.p && x.s.rank && x.lost > 0; }).sort(function(a, b){ return a.keep - b.keep; });
      var rank = {}; leaks.slice(0, 3).forEach(function(x, i){ rank[steps.indexOf(x)] = i + 1; });
      var paidRate = pct(n('payment_completed'), n('signup_completed'));
      var chart = '<ol class="vb" aria-label="People at each step">' + steps.map(function(x, i){
        var w = Math.sqrt(x.v / top) * 100, lo = x.keep != null && x.keep < 0.3, r = rank[i];
        return '<li class="vb-s' + (lo ? ' vb-lo' : '') + (x.s.auto ? ' vb-auto' : '') + '">' +
          '<span class="vb-l"><b>' + (i + 1) + '. ' + x.s.l + '</b><small>' + x.s.e + '</small></span>' +
          '<span class="vb-t" aria-hidden="true"><span class="vb-b" style="width:' + w.toFixed(2) + '%"><b>' + fmt(x.v) + '</b></span></span>' +
          '<span class="vb-k">' + (r ? '<i aria-hidden="true">' + r + '</i>' : '') + (x.keep != null ? (x.keep * 100).toFixed(1) + '%' : '') + '</span>' +
          '<span class="sr">' + fmt(x.v) + ' people' + (x.keep != null ? ', ' + (x.keep * 100).toFixed(1) + '% of the step before' : '') + (lo ? ', keeps under 30%' : '') + (r ? ', drop ' + r + ' in the list below' : '') + '.</span></li>';
      }).join('') + '</ol>';
      var path = card({id:'path', cls:'fn-card', title:'From visit to share', sub:'Bar length on a square-root scale, so the later steps stay readable. Bronze marks a step that keeps under 30%.',
        aside:'<div class="fn-head"><b>' + paidRate.toFixed(1) + '%</b><span>of sign ups pay</span></div>',
        body:'<div class="c3-b">' + chart + '<div class="fn-key" aria-hidden="true"><span><i class="k"></i>People at the step</span><span><i class="a"></i>Follows on its own</span><span><i class="b"></i>Keeps under 30%</span><span><i class="r">1</i>Matches the list below</span><span class="fn-key-r">Right: share of the step before</span></div></div>'});

      /* ---------- Where people leave, and what each screen does about it ---------- */
      var leave = card({id:'leave', cls:'lk-card', title:'Where people leave', sub:'The three biggest drops after sign up, marked 1 to 3 on the chart, and what the screen does about each',
        body:leaks.length ? '<ol class="lk">' + leaks.slice(0, 3).map(function(x, i){
          var gone = Math.round((1 - x.keep) * 100);
          return '<li><span class="lk-n">' + (i + 1) + '</span><div class="lk-b"><p class="lk-t">' + FLOW[FLOW.indexOf(x.s) - 1].l + ' ' + I('arrow', 'i-sm') + ' ' + x.s.l + '</p>' +
            '<div class="lk-m"><span class="lk-bar"><i style="width:' + gone + '%"></i></span><span><b>' + gone + '%</b> leave · ' + fmt(x.lost) + ' people</span></div>' +
            '<dl class="lk-d"><div><dt>Why they leave</dt><dd>' + x.s.why + '</dd></div><div><dt>What the ' + x.s.s.toLowerCase() + ' does</dt><dd>' + x.s.fix + '</dd></div></dl></div></li>';
        }).join('') + '</ol>' : '<div class="e3"><p>No drops to show yet. Use the prototype as a homeowner to record a few steps.</p></div>'});

      /* ---------- Before sign up, and after paying ---------- */
      var flow = function(items){ return '<ol class="fq">' + items.map(function(it){ return '<li><span class="fq-ic">' + I(it[0], 'i-sm') + '</span><span class="fq-l">' + it[1] + (it[3] ? '<small>' + it[3] + '</small>' : '') + '</span><b>' + fmt(it[2]) + '</b></li>'; }).join('') + '</ol>'; };
      var pre = card({id:'pre', title:'Before sign up', sub:'Before launch, people join the waitlist; Sam invites them in',
        body:flow([['eye', 'Visitors', n('page_view'), 'Home and area pages'], ['mail', 'Joined the waitlist', n('waitlist_joined'), Math.round(pct(n('waitlist_joined'), n('page_view')) * 10) / 10 + '% of visitors'], ['user', 'Signed up', n('signup_completed'), Math.round(pct(n('signup_completed'), n('waitlist_joined'))) + '% of the waitlist, on a 15-day trial']])});
      var post = card({id:'post', title:'After paying', sub:'Reading, passing it on, and telling Sam',
        body:flow([['file', 'Read the presentation', n('presentation_opened'), Math.round(pct(n('presentation_opened'), n('payment_completed'))) + '% of payers'], ['share', 'Shared a link', n('share_created'), Math.round(pct(n('share_created'), n('presentation_opened'))) + '% of readers'], ['eye', 'Share views', n('share_viewed'), n('share_created') ? (n('share_viewed') / n('share_created')).toFixed(1) + ' views per link' : ''], ['mail', 'Sent feedback', n('feedback_sent'), '']])});

      doc.getElementById('fu-body').innerHTML = kpis + path + leave + '<div class="o3-g fn-r3">' + pre + post + '</div>' +
        C.note('Counted on our own server, one event per step, not by an ad tracker (SEO_CONVERSION 9).');
      RI.fillIcons(doc.getElementById('fu-body'));
    }
    var grp = view.querySelector('#fu-days');
    function setDays(v){ days = +v; grp.querySelectorAll('[data-v]').forEach(function(x){ var on = +x.getAttribute('data-v') === days; x.setAttribute('aria-checked', on); x.tabIndex = on ? 0 : -1; }); history.replaceState(null, '', '#/funnel' + (days === 30 ? '' : '?days=' + days)); body(); }
    grp.addEventListener('click', function(e){ var b = e.target.closest('[data-v]'); if(b) setDays(b.getAttribute('data-v')); });
    grp.addEventListener('keydown', function(e){ var bs = [].slice.call(grp.querySelectorAll('[data-v]')), i = bs.indexOf(e.target); if(i < 0) return; var k = e.key, j = k === 'ArrowRight' || k === 'ArrowDown' ? (i + 1) % bs.length : k === 'ArrowLeft' || k === 'ArrowUp' ? (i - 1 + bs.length) % bs.length : k === 'Home' ? 0 : k === 'End' ? bs.length - 1 : -1; if(j < 0) return; e.preventDefault(); setDays(bs[j].getAttribute('data-v')); bs[j].focus(); });
    body();
  }, {nav:'funnel', perm:'funnel.view'});
})();
