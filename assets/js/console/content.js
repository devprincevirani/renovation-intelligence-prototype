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
  C.APPLY.guidance = function(d){ var g = C.get('guidance'); if(!g || !d.after) return; (d.after.kind === 'text' ? g.texts : g.mech).forEach(function(x){ if((x.k || x.name) === d.ref){ x.text = d.after.text; x.v++; x.at = Date.now(); } }); C.set('guidance', g); };
  C.APPLY.resources = function(d){ var l = C.get('docs', []); l.forEach(function(x){ if(x.id === d.ref){ x.live = true; x.at = Date.now(); } }); C.set('docs', l); };

  /* ---------- Guidance and texts ---------- */
  C.route('/guidance', function(view){
    var g = C.get('guidance'), tab = C.query().tab || 'mech', cur = C.query().k || (tab === 'mech' ? g.mech[0].name : g.texts[0].k), edit = null, canEdit = C.can('content.edit');
    view.innerHTML = C.page({kicker:'Content', title:'Guidance', sub:'The house systems guidance and the texts users read at key moments. Sam\'s wording; edits are drafts and old versions are kept.',
      body:C.seg('gu-tab', [['mech','House systems',g.mech.length],['texts','Disclaimers and texts',g.texts.length]], tab) + '<div class="c-split c-mt"><aside class="c-list" id="gu-list"></aside><section class="c-detail" id="gu-detail"></section></div>'});
    function items(){ return tab === 'mech' ? g.mech.map(function(m){ return {k:m.name, label:m.name, sub:m.life, text:m.text, v:m.v, at:m.at, m:m}; }) : g.texts.map(function(t){ return {k:t.k, label:t.label, sub:t.where, text:t.text, v:t.v, at:t.at}; }); }
    function list(){ doc.getElementById('gu-list').innerHTML = '<p class="c-list-g">' + (tab === 'mech' ? 'Mechanicals' : 'Where users read them') + '</p>' + items().map(function(x){ var dr = C.draftFor('guidance', x.k); return '<button type="button" class="c-li' + (x.k === cur ? ' on' : '') + '" data-k="' + RI.esc(x.k) + '"><span><b>' + RI.esc(x.label) + '</b><small>' + RI.esc(x.sub) + '</small></span>' + (dr ? C.lbl('queued') : '') + '</button>'; }).join(''); }
    function detail(){
      var x = items().filter(function(i){ return i.k === cur; })[0], text = edit == null ? x.text : edit, el = doc.getElementById('gu-detail');
      var preview = tab === 'mech' ? (RI.mechCard ? RI.mechCard(Object.assign({}, RI.SAMPLE.mechanicals.filter(function(m){ return m.name === x.k; })[0] || {}, {text:text})) : '<p>' + RI.esc(text) + '</p>') : '<div class="gu-pv-t"><span class="gu-tick"></span><p>' + RI.esc(text) + '</p></div>';
      el.innerHTML = C.draftBar('guidance', x.k) + '<header class="c-dhead"><div><p class="c-kicker">' + (tab === 'mech' ? 'House system' : RI.esc(x.sub)) + '</p><h2>' + RI.esc(x.label) + '</h2><p class="c-sub">Version ' + x.v + ', published ' + C.ago(x.at) + '.' + (x.m ? ' Typical life: ' + RI.esc(x.m.life) + '. Typical range ' + RI.money(x.m.range[0]) + ' to ' + RI.money(x.m.range[1]) + ', never in a total.' : '') + '</p></div>' + (edit != null && edit !== x.text ? C.lbl('draft', 'not saved') : C.lbl('published')) + '</header>' +
        '<div class="gu-ed"><div class="field"><label for="gu-t">Wording</label><textarea class="input" id="gu-t" rows="6"' + (canEdit ? '' : ' readonly') + '>' + RI.esc(text) + '</textarea><span class="help" id="gu-n">' + text.length + ' characters. Plain words, second person, no exclamation marks.</span></div>' +
        '<div class="gu-pv"><p class="c-kicker">How users see it</p><div class="gu-pv-in">' + preview + '</div></div></div>' +
        (edit != null && edit !== x.text && canEdit ? C.saveBar('gu') : '') + (canEdit ? '' : C.note('Editing texts needs the permission to edit text drafts.', 'lock'));
      RI.fillIcons(el);
    }
    view.querySelector('#gu-tab').addEventListener('click', function(e){ var b = e.target.closest('[data-v]'); if(!b || edit != null) { if(edit != null) RI.toast('Save or undo your change first.', 'warn'); return; } tab = b.getAttribute('data-v'); cur = items()[0].k; view.querySelectorAll('#gu-tab [data-v]').forEach(function(y){ y.setAttribute('aria-selected', y === b); }); list(); detail(); });
    view.addEventListener('click', function(e){
      var li = e.target.closest('#gu-list [data-k]'); if(li){ if(edit != null){ RI.toast('Save or undo your change first.', 'warn'); return; } cur = li.getAttribute('data-k'); list(); detail(); return; }
      if(e.target.closest('#gu-undo')){ edit = null; detail(); }
      if(e.target.closest('#gu-save')){ var x = items().filter(function(i){ return i.k === cur; })[0];
        C.askWhy((tab === 'mech' ? 'Guidance: ' : 'Text: ') + x.label, 'Wording changed, ' + edit.length + ' characters', function(why){ C.addDraft({area:'guidance', ref:x.k, title:(tab === 'mech' ? 'Guidance: ' : 'Text: ') + x.label, summary:'Wording changed', after:{kind:tab === 'mech' ? 'mech' : 'text', text:edit}, why:why}); edit = null; RI.toast('Saved as a draft. It waits in the publish queue.', 'check'); C.render(); }); }
    });
    view.addEventListener('input', function(e){ if(e.target.id !== 'gu-t') return; var x = items().filter(function(i){ return i.k === cur; })[0], was = edit != null && edit !== x.text; edit = e.target.value; var is = edit !== x.text;
      if(was !== is){ var pos = e.target.selectionStart; detail(); var t = doc.getElementById('gu-t'); t.focus(); t.setSelectionRange(pos, pos); return; }
      doc.getElementById('gu-n').textContent = edit.length + ' characters. Plain words, second person, no exclamation marks.';
      var pv = doc.querySelector('.gu-pv-in p'); if(pv) pv.textContent = edit; });
    list(); detail();
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

  /* ---------- Contacts and feedback ---------- */
  C.route('/feedback', function(view){
    var tab = C.query().tab || 'feedback';
    var fb = A.all().filter(function(h){ return h.feedback; }).map(function(h){ return {house:A.addr(h), hid:h.id, v:h.feedback.v, note:h.feedback.note || '', at:h.feedback.at || h.updated}; }).concat(C.get('feedbackSeed', []));
    var users = RI.users.all(), contacts = Object.keys(users).map(function(k){ return users[k]; }).filter(function(u){ return u.news; }).map(function(u){ return {email:u.email, type:u.type, from:'Sign up', at:u.at}; })
      .concat(RI.store.get('waitlist', []).filter(function(w){ return w.news; }).map(function(w){ return {email:w.email, type:w.type, from:'Waitlist', at:w.at}; }));
    var yes = fb.filter(function(f){ return f.v === 'Yes'; }).length;
    view.innerHTML = C.page({kicker:'Customers', title:'Contacts and feedback', sub:'What people said after reading a presentation, and the contacts who agreed to hear from Sam. Only contacts with consent are listed.',
      actions:C.can('contacts.export') ? '<button type="button" class="btn btn-secondary" id="fb-exp">' + RI.icon('file','i-sm') + 'Export contacts</button>' : '',
      body:C.seg('fb-tab', [['feedback','Feedback',fb.length],['contacts','Updates list',contacts.length]], tab) + '<div id="fb-body" class="c-mt"></div>'});
    function body(){
      var el = doc.getElementById('fb-body');
      if(tab === 'feedback') el.innerHTML = (fb.length ? '<div class="fb-sum"><div><b>' + yes + ' of ' + fb.length + '</b><span>said the presentation helped</span></div>' + ['Yes','Somewhat','No'].map(function(v){ var n = fb.filter(function(f){ return f.v === v; }).length; return '<div class="fb-b"><span>' + v + '</span><span class="ac-t"><i style="width:' + (fb.length ? n / fb.length * 100 : 0) + '%"></i></span><b>' + n + '</b></div>'; }).join('') + '</div>' : '') +
        '<ul class="fb-list">' + fb.map(function(f){ return '<li><span class="fb-v fb-' + f.v.toLowerCase() + '">' + f.v + '</span><div><p>' + (f.note ? '“' + RI.esc(f.note) + '”' : '<span class="muted">No comment</span>') + '</p><small>' + RI.esc(f.house) + ' · ' + C.ago(f.at) + '</small></div>' + (f.hid ? '<a class="small" href="#/houses/' + f.hid + '">House</a>' : '') + '</li>'; }).join('') + '</ul>' + C.note('Three of these are sample entries. New feedback from presentations in this browser appears at the top.');
      if(tab === 'contacts') el.innerHTML = C.table({empty:'Nobody in this browser has agreed to updates yet. Tick “Send me product updates” at sign up to see an entry.', cols:[{label:'Email'},{label:'Account type'},{label:'Agreed at'},{label:'When', num:true}],
        rows:contacts.map(function(c){ return {cells:['<b>' + RI.esc(c.email) + '</b>', c.type ? C.chip(c.type.charAt(0).toUpperCase() + c.type.slice(1)) : '<span class="muted">Not given</span>', c.from, C.date(c.at)]}; })}) + C.note('Consent is stored with its time and the wording version (SECURITY 6.3). Sam writes from his own tool; the product only exports.');
      RI.fillIcons(el);
    }
    view.querySelector('#fb-tab').addEventListener('click', function(e){ var b = e.target.closest('[data-v]'); if(!b) return; tab = b.getAttribute('data-v'); view.querySelectorAll('#fb-tab [data-v]').forEach(function(x){ x.setAttribute('aria-selected', x === b); }); body(); });
    var ex = view.querySelector('#fb-exp'); if(ex) ex.addEventListener('click', function(){
      var csv = 'email,account type,agreed at,date\n' + contacts.map(function(c){ return [c.email, c.type || '', c.from, new Date(c.at).toISOString().slice(0, 10)].join(','); }).join('\n');
      var a = doc.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'})); a.download = 'contacts-with-consent.csv'; a.click();
      C.log('Contacts exported', contacts.length + ' contacts with consent', ''); RI.toast(contacts.length + ' contacts exported.', 'file');
    });
    body();
  }, {nav:'feedback', perm:'contacts.export'});

  /* ---------- Funnel ---------- */
  var STEPS = [['page_view','Arrives','Home or area page'],['waitlist_joined','Joins the waitlist','Before launch'],['signup_completed','Signs up','Sign up'],['intake_started','Starts the intake','Intake wizard'],['intake_submitted','Submits the house','Intake wizard'],['price_viewed','Sees the price','House page'],['checkout_started','Starts to pay','House page'],['payment_completed','Pays','Checkout'],['presentation_opened','Reads the presentation','Presentation'],['share_created','Shares it','Share link'],['feedback_sent','Gives feedback','Presentation']];
  C.route('/funnel', function(view){
    var mode = C.query().mode || 'browser', ev = RI.store.get('events', []);
    var SAMPLE = {page_view:1840, waitlist_joined:212, signup_completed:96, intake_started:71, intake_submitted:52, price_viewed:49, checkout_started:21, payment_completed:14, presentation_opened:14, share_created:6, feedback_sent:5};
    function counts(){ var c = {}; if(mode === 'sample') return SAMPLE; ev.forEach(function(e){ c[e.e] = (c[e.e] || 0) + 1; }); return c; }
    view.innerHTML = C.page({kicker:'Customers', title:'Funnel', sub:'The path from a stranger to a paid presentation, one event per step (APP_FLOW 3). Where people leave, and what each screen does about it.',
      body:C.seg('fu-mode', [['browser','This browser'],['sample','Sample month']], mode) + '<div id="fu-body" class="c-mt"></div>'});
    function body(){
      var c = counts(), top = Math.max(1, c.page_view || 0), prev = null;
      doc.getElementById('fu-body').innerHTML = (mode === 'sample' ? '<div class="ru-note">' + C.lbl('sample') + '<span>Invented numbers to show the layout. Real counts come from the events the product records on its own server.</span></div>' : '<div class="ru-note">' + RI.icon('info','i-sm') + '<span>Counted from ' + ev.length + ' events recorded in this browser while using the prototype.</span></div>') +
        '<ol class="fu">' + STEPS.map(function(s, i){ var n = c[s[0]] || 0, pc = n / top * 100, conv = prev != null && prev > 0 && s[0] !== 'waitlist_joined' ? Math.round(n / prev * 100) : null; if(s[0] !== 'waitlist_joined') prev = n;
          return '<li class="fu-s' + (s[0] === 'waitlist_joined' ? ' side' : '') + '"><div class="fu-l"><b>' + s[1] + '</b><small><code>' + s[0] + '</code> · ' + s[2] + '</small></div><div class="fu-bar"><i style="width:' + Math.max(n ? 1.2 : 0, pc).toFixed(1) + '%"></i></div><div class="fu-n"><b>' + n.toLocaleString('en-US') + '</b>' + (conv != null ? '<small' + (conv < 40 ? ' class="fu-drop"' : '') + '>' + conv + '% of the step before</small>' : '') + '</div></li>'; }).join('') + '</ol>' +
        C.note('Before launch, the first step ends in the waitlist instead. Counts are kept on our own server, not by an ad tracker.');
      RI.fillIcons(doc.getElementById('fu-body'));
    }
    view.querySelector('#fu-mode').addEventListener('click', function(e){ var b = e.target.closest('[data-v]'); if(!b) return; mode = b.getAttribute('data-v'); view.querySelectorAll('#fu-mode [data-v]').forEach(function(x){ x.setAttribute('aria-selected', x === b); }); history.replaceState(null, '', '#/funnel?mode=' + mode); body(); });
    body();
  }, {nav:'funnel', perm:'funnel.view'});
})();
