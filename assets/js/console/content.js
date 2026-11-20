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
    {email:'hannah.price@example.com', type:'homeowner', from:'Sign up', consent:'withdrawn', v:1, at:now - 29 * DAY, off:now - 12 * DAY}
  ];
  var FB_PKG = {'18450 Maple Ridge Dr':'Standard', '15520 Fairfield St':'Premium', '4227 Hampton Dr':'Essential'};
  var FB_PEOPLE = {'18450 Maple Ridge Dr':'maria.lopez@example.com', '15520 Fairfield St':'aisha.khan@example.com', '4227 Hampton Dr':'j.carter@example.com'};
  /* A cell that starts with =, +, - or @ is written so a spreadsheet does not run it (SECURITY 11) */
  function cell(v){ v = String(v == null ? '' : v); if(/^[=+\-@\t\r]/.test(v)) v = "'" + v; return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function csv(head, rows){ return [head].concat(rows).map(function(r){ return r.map(cell).join(','); }).join('\n'); }
  function save(name, text){ var a = doc.createElement('a'); a.href = URL.createObjectURL(new Blob([text], {type:'text/csv'})); a.download = name; a.click(); }
  var capT = function(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; };

  C.route('/feedback', function(view){
    var tab = C.query().tab === 'contacts' ? 'contacts' : 'feedback', st = {q:'', f:'all', a:'all'}, canExp = C.can('contacts.export');
    var pkgName = function(k){ var p = (RI.PACKAGES || []).filter(function(x){ return x.key === k; })[0]; return p ? p.name : ''; };
    var fb = A.all().filter(function(h){ return h.feedback; }).map(function(h){ return {house:A.addr(h), hid:h.id, who:h.owner || '', pkg:pkgName(h.pk), v:h.feedback.v, note:h.feedback.note || '', at:h.feedback.at || h.updated}; })
      .concat(C.get('feedbackSeed', []).map(function(f){ return Object.assign({who:FB_PEOPLE[f.house] || '', pkg:FB_PKG[f.house] || ''}, f); }));
    /* Everyone who left an email: accounts and the waitlist, each with the state of their updates consent */
    var users = RI.users.all(), contacts = Object.keys(users).map(function(k){ return users[k]; }).filter(function(u){ return u.role !== 'staff'; })
      .map(function(u){ return {email:u.email, type:u.type, from:'Sign up', consent:u.news ? 'given' : 'none', v:1, at:u.at}; })
      .concat(RI.store.get('waitlist', []).map(function(w){ return {email:w.email, type:w.type, from:'Waitlist', consent:w.news ? 'given' : 'none', v:1, at:w.at}; }));
    SAMPLE_CONTACTS.forEach(function(s){ if(!contacts.some(function(c){ return c.email === s.email; })) contacts.push(s); });
    contacts.sort(function(a, b){ return b.at - a.at; });
    var updates = contacts.filter(function(c){ return c.consent === 'given'; });
    var yes = fb.filter(function(f){ return f.v === 'Yes'; }).length;

    view.innerHTML = C.page({kicker:'Customers', title:'Contacts and feedback', sub:'Feedback from presentations, contacts with consent, the updates list, and the exports Sam uses in his own tool.',
      actions:canExp ? '<button type="button" class="btn btn-secondary" id="fb-exp-ct" title="Everyone listed under Contacts, with their consent">' + RI.icon('file','i-sm') + 'Export contacts <span class="fb-n">' + contacts.length + '</span></button>' +
        '<button type="button" class="btn btn-primary" id="fb-exp-up" title="Only the people who agreed to updates">' + RI.icon('file','i-sm') + 'Export the updates list <span class="fb-n">' + updates.length + '</span></button>' : '',
      body:'<div class="fb-top">' + C.seg('fb-tab', [['feedback','Feedback',fb.length],['contacts','Contacts',contacts.length]], tab) + '<div id="fb-tools" class="us-bar"></div></div><div id="fb-body"></div>'});

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
        el.innerHTML = (fb.length ? '<div class="fb-sum"><div><b>' + yes + ' of ' + fb.length + '</b><span>said the presentation helped</span></div>' + ['Yes','Somewhat','No'].map(function(v){ var n = fb.filter(function(f){ return f.v === v; }).length; return '<div class="fb-b"><span>' + v + '</span><span class="ac-t"><i style="width:' + (fb.length ? n / fb.length * 100 : 0) + '%"></i></span><b>' + n + '</b></div>'; }).join('') + '</div>' : '') +
          (shown.length ? '<ul class="fb-list">' + shown.map(function(f){ return '<li><span class="fb-v fb-' + f.v.toLowerCase() + '">' + f.v + '</span><div><p>' + (f.note ? '&ldquo;' + RI.esc(f.note) + '&rdquo;' : '<span class="muted">No comment</span>') + '</p>' +
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
