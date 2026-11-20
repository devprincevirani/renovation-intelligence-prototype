/* Console: users and staff (APP_FLOW 7, SECURITY 3.2, BACKLOG M1-34, M4-22) and the audit log (SECURITY 15, M1-36, M4-28).
   Only Sam invites staff and sets permissions. Contacts and feedback live in release.js. */
(function(){
  var RI = window.RI, A = RI.App, C = RI.Con, doc = document;
  var DAY = 86400000, now = Date.now();

  C.SEEDS.push(function(){
    /* Two active staff and one open invite: the sample invite page (/invite/?t=demo-staff) accepts it */
    var M = 60000, H = 3600000;
    var STAFF = [
      {email:'dana@demo.ri', name:'Dana Reyes', status:'active', perms:['houses.view', 'houses.grade', 'rulebook.view', 'rulebook.edit', 'contacts.export', 'audit.view'], invitedAt:now - 41 * DAY, joinedAt:now - 40 * DAY},
      {email:'marcus@demo.ri', name:'Marcus Hill', status:'active', perms:['houses.view', 'rulebook.view', 'rulebook.edit', 'pricing.edit', 'backtests.run', 'audit.view'], invitedAt:now - 33 * DAY, joinedAt:now - 32 * DAY},
      {email:'staff@demo.ri', name:'', status:'invited', perms:C.SAMPLE_STAFF.slice(), invitedAt:now - 2 * DAY - 2 * H, token:'demo-staff'}
    ];
    var SAM = ['Sam', 'Super admin'], DANA = ['Dana Reyes', 'Staff'], MARC = ['Marcus Hill', 'Staff'], SYS = ['System', ''];
    var SAMPLE = [
      [26 * M, SAM, 'Published', 'Rate library: LVP flooring, sample region', 'New supplier price list for November. Back-test BT-119 passed', 'rates'],
      [55 * M, MARC, 'Back-test run', 'BT-119: 12 houses replayed with one draft', 'Before publishing the LVP flooring rates', 'backtests'],
      [100 * M, DANA, 'Draft saved', 'Rule CB-RULE-015 v4', 'Worn cabinets with sound boxes can be refinished in Standard too', 'rules'],
      [3 * H, SAM, 'Graded', 'Kitchen cabinets on 18450 Maple Ridge Dr: correct', 'Refinish is right for sound oak boxes', 'tree'],
      [4 * H, MARC, 'Draft saved', 'Rate R-FL-LVP-SF: LVP flooring per sq ft', 'Two installers raised their prices in October', 'rates'],
      [DAY + H, DANA, 'Graded', '2140 Ashcroft Dr: 14 decisions reviewed', 'Weekly review', 'tree'],
      [DAY + 3 * H, SAM, 'Draft saved', 'Condition sheet: cabinets, threshold 70 to 75', 'Too many dark photos passed', 'sheets'],
      [DAY + 5 * H, MARC, 'Draft saved', 'Room template: Kitchen v3', 'Measured kitchens run larger than the starting count', 'templates'],
      [2 * DAY + 40 * M, SAM, 'Permissions changed', 'marcus@demo.ri: 6 permissions', 'Runs back-tests from now on', 'users'],
      [2 * DAY + 2 * H, SAM, 'Staff invited', 'staff@demo.ri, with 5 permissions', '', 'users'],
      [3 * DAY - 2 * H, SAM, 'Published', 'Room template: Kitchen v2', 'The starting count for a small kitchen in the guide', 'templates'],
      [3 * DAY + 4 * H, DANA, 'Contacts exported', '38 contacts with consent', 'Monthly update email', 'feedback'],
      [5 * DAY + 3 * H + 10 * M, SAM, 'Account disabled', 'test.user@demo.ri', 'The owner asked for the account to be closed', 'users'],
      [6 * DAY + 5 * H, SAM, 'Discarded', 'Guidance: water heater text', 'Wording not final', 'guidance'],
      [7 * DAY + H + 25 * M, SAM, 'Accuracy run', '1,240 labelled photos, 91.4% agree', 'Before the model update', 'accuracy'],
      [9 * DAY + 2 * H + 50 * M, SYS, 'Super admin created', 'admin@demo.ri', 'One-time command on the server', 'users']
    ].map(function(e){ return {id:C.uid('a'), at:now - e[0], by:e[1][0], role:e[1][1], action:e[2], what:e[3], why:e[4], area:e[5]}; });
    /* Seeds normally only fill what is missing. The audit sample changed (three people, sixteen changes), so it is merged
       in: the old sample rows go, anything done in this browser stays. Staff missing from the list are added. */
    var raw = function(k, v){ RI.store.set('con.' + k, v); };
    var OLD = ['Rate library: LVP flooring, sample region', '12 houses replayed after the cabinet refinish change', 'Kitchen cabinets on 18450 Maple Ridge Dr: correct', 'Condition sheet: cabinets, threshold 70 to 75', 'staff@demo.ri, with 5 permissions', 'Room template: Kitchen v2', 'Guidance: water heater text', 'admin@demo.ri'];
    var mine = (C.get('audit') || []).filter(function(e){ return OLD.indexOf(e.what) < 0 && !SAMPLE.some(function(x){ return x.what === e.what && x.action === e.action; }); });
    raw('audit', mine.concat(SAMPLE).sort(function(a, b){ return b.at - a.at; }).slice(0, 400));
    var have = C.get('staff');
    if(!have) raw('staff', STAFF);
    else { STAFF.forEach(function(x){ if(!have.some(function(h){ return h.email === x.email; })) have.unshift(x); }); raw('staff', have); }
  });

  /* Has the sample invite been accepted on the invite page? */
  function staffList(){
    var list = C.get('staff', []), used = RI.store.get('invite.demo-staff.used');
    list.forEach(function(x){ if(x.token === 'demo-staff' && used && x.status === 'invited'){ x.status = 'active'; x.joinedAt = used; } });
    return list;
  }
  function permChips(perms){ var n = C.migratePerms(perms).length; return '<span class="c-chip">' + n + ' of ' + C.PERMS.length + '</span>'; }

  /* ---------- Users and staff ---------- */
  C.route('/users', function(view){
    var tab = C.query().tab || 'users', m = C.me();
    var users = (RI.ROLES || []).filter(function(r){ return r.role !== 'admin'; }).map(function(r){ return {email:r.email, name:r.name, type:r.type, demo:true, verified:true, news:false, at:now - 30 * DAY}; });
    var acc = RI.users.all(); Object.keys(acc).forEach(function(k){ var u = acc[k]; if(u.role === 'staff') return; users.push({email:u.email, name:u.email.split('@')[0], type:u.type ? u.type.charAt(0).toUpperCase() + u.type.slice(1) : 'User', verified:!!u.verified, news:!!u.news, trial:!!u.trial, at:u.at || now, disabled:u.disabled}); });
    var staff = staffList(), wl = RI.store.get('waitlist', []);
    view.innerHTML = C.page({kicker:'Admin', title:'Users and staff', sub:'Every account, its type and state; Sam\'s staff and what each may do; and the waitlist.',
      actions:C.can('staff') ? '<button type="button" class="btn btn-primary" id="inv-new">' + RI.icon('mail','i-sm') + 'Invite staff</button>' : '',
      body:C.seg('us-tab', [['users','Users',users.length],['staff','Staff',staff.length + 1],['waitlist','Waitlist',wl.length]], tab) + '<div id="us-body" class="c-mt"></div>'});
    function body(){
      var el = doc.getElementById('us-body');
      if(tab === 'users'){
        el.innerHTML = C.table({cols:[{label:'Account'},{label:'Type'},{label:'Email'},{label:'Houses', num:true},{label:'Updates'},{label:'Joined', num:true},{label:''}],
          rows:users.map(function(u){
            var n = A.all().filter(function(h){ return h.owner === u.email; }).length;
            return {cells:['<span class="c-person">' + C.av(u.name) + '<span><b>' + RI.esc(u.name) + '</b><small>' + RI.esc(u.email) + '</small></span></span>',
              C.chip(u.type) + (u.trial ? ' ' + C.chip('Trial', 'trial') : '') + (u.demo ? ' ' + C.lbl('sample') : ''),
              u.verified ? '<span class="ok-t">' + RI.icon('check','i-sm') + 'Verified</span>' : '<span class="muted">Not verified</span>',
              String(n), u.news ? 'Yes' : '<span class="muted">No</span>', C.date(u.at),
              u.disabled ? C.lbl('discarded', '') .replace('Discarded', 'Disabled') : (C.can('staff') && !u.demo ? '<button type="button" class="linkbtn small" data-dis="' + RI.esc(u.email) + '">Disable</button>' : '')]};
          })}) + C.note('Disabling an account ends its sessions at once. Proposed in SECURITY 3.2; Sam confirms.');
      }
      if(tab === 'staff'){
        var rows = [{cells:['<span class="c-person">' + C.av('Sam', 'sam') + '<span><b>Sam</b><small>admin@demo.ri</small></span></span>', '<span class="c-chip sam">Super admin</span>', C.lbl('published').replace('Published', 'Active'), '<span class="c-chip">All</span>', '<span class="muted">Created on the server</span>', '']}];
        staff.forEach(function(x){
          rows.push({attr:C.can('staff') ? 'data-staff="' + RI.esc(x.email) + '" tabindex="0" role="button"' : '', cells:['<span class="c-person">' + C.av(x.name || x.email) + '<span><b>' + RI.esc(x.name || 'Not accepted yet') + '</b><small>' + RI.esc(x.email) + '</small></span></span>', '<span class="c-chip">Staff</span>',
            x.status === 'invited' ? C.lbl('queued').replace('Queued', 'Invited') : x.status === 'disabled' ? C.lbl('discarded').replace('Discarded', 'Disabled') : C.lbl('published').replace('Published', 'Active'),
            permChips(x.perms), x.status === 'invited' ? 'Invited ' + C.ago(x.invitedAt) + ' · link works 7 days' : 'Joined ' + C.ago(x.joinedAt || x.invitedAt),
            C.can('staff') ? '<span class="linkbtn small">Permissions</span>' : '']});
        });
        el.innerHTML = C.table({cols:[{label:'Person'},{label:'Role'},{label:'State'},{label:'Permissions'},{label:'Since'},{label:''}], rows:rows}) +
          C.note('Staff edit drafts. Only Sam publishes, and only Sam manages staff (SECURITY 3.2). A changed permission takes effect at once.');
      }
      if(tab === 'waitlist'){
        el.innerHTML = C.table({empty:'Nobody has joined the waitlist in this browser yet. Join it from the public site to see an entry here.', cols:[{label:'Email'},{label:'Account type'},{label:'From'},{label:'Joined', num:true}],
          rows:wl.slice().reverse().map(function(w){ return {cells:['<b>' + RI.esc(w.email) + '</b>', w.type ? C.chip(w.type.charAt(0).toUpperCase() + w.type.slice(1)) : '<span class="muted">Not given</span>', w.source === 'home' ? 'Home page' : 'Waitlist page', C.date(w.at)]}; })}) +
          C.note('Sam writes to the waitlist from his own tool; the product only exports the list (RUNBOOK). Export is on Contacts and feedback.');
      }
      RI.fillIcons(el);
    }
    view.querySelector('#us-tab').addEventListener('click', function(e){ var b = e.target.closest('[data-v]'); if(!b) return; tab = b.getAttribute('data-v'); view.querySelectorAll('#us-tab [data-v]').forEach(function(x){ x.setAttribute('aria-selected', x === b); }); history.replaceState(null, '', '#/users?tab=' + tab); body(); });
    view.addEventListener('click', function(e){
      var s = e.target.closest('[data-staff]'); if(s){ permsDialog(s.getAttribute('data-staff'), body); return; }
      var d = e.target.closest('[data-dis]'); if(d){ var em = d.getAttribute('data-dis');
        C.confirm('Disable this account?', RI.esc(em) + ' can no longer log in, and every session ends at once. Their houses stay.', 'Disable account', function(){ var u = RI.users.get(em); if(u){ u.disabled = true; RI.users.put(u); } C.log('Account disabled', em, ''); RI.toast('Account disabled.'); C.render(); }, true); }
    });
    view.addEventListener('keydown', function(e){ var s = e.target.closest('[data-staff]'); if(s && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); permsDialog(s.getAttribute('data-staff'), body); } });
    var nb = view.querySelector('#inv-new'); if(nb) nb.addEventListener('click', function(){ inviteDialog(); });
    body();
  }, {nav:'users', perm:'users.view'});

  /* Permission boxes, grouped as in the guide's table */
  function permBoxes(sel){
    return '<fieldset class="perm-list"><legend class="sr">Permissions</legend>' + C.PERMS.map(function(p){
      return '<label class="perm"><input type="checkbox" value="' + p[0] + '"' + (sel.indexOf(p[0]) > -1 ? ' checked' : '') + '><span><b>' + p[1] + '</b><small><code>' + p[0] + '</code></small></span></label>';
    }).join('') + '</fieldset><p class="small muted">Publishing, discarding and managing staff stay with the super admin. An edit permission includes reading the same area.</p>';
  }
  function inviteDialog(){
    var d = C.dialog('Invite a staff member', '<form class="form-grid" id="inv-f" novalidate><div class="field"><label for="inv-em">Email</label><input class="input" id="inv-em" type="email" placeholder="name@example.com" autocomplete="off"><span class="err"></span><span class="help">The invite link works once, for 7 days. The email is fixed by the invite.</span></div>' +
      '<div class="field"><span class="flabel">What they can do</span>' + permBoxes([]) + '</div>' +
      '<div class="cta-row" style="justify-content:flex-end"><button type="button" class="btn btn-secondary" data-dlg-close>Cancel</button><button type="submit" class="btn btn-primary">Send the invite</button></div></form>', {wide:true});
    d.querySelector('#inv-f').addEventListener('submit', function(e){
      e.preventDefault(); var em = d.querySelector('#inv-em'), v = em.value.trim().toLowerCase();
      if(!RI.form.emailOk(v)){ RI.form.setInvalid(em, 'Check the email address, for example name@example.com.'); em.focus(); return; }
      if(staffList().some(function(x){ return x.email === v; })){ RI.form.setInvalid(em, 'This person already has a staff invite or account.'); em.focus(); return; }
      var perms = [].slice.call(d.querySelectorAll('.perm input:checked')).map(function(i){ return i.value; });
      var list = staffList(); list.push({email:v, name:'', status:'invited', perms:perms, invitedAt:Date.now(), token:C.uid('t')}); C.set('staff', list);
      C.log('Staff invited', v + ', with ' + perms.length + ' permissions', '', 'users');
      d.close();
      var s = C.dialog('Invite sent', '<p>We emailed an invite to <b>' + RI.esc(v) + '</b>. It works once, for 7 days.</p><div class="mail-sim"><div class="mh">' + RI.icon('mail','i-sm') + '<span><b>Demo inbox</b> · You are invited to the console</span></div><div class="mb"><p>Sam invited you as staff. Set a password to accept.</p><a class="btn btn-primary btn-sm" href="' + RI.url('invite/?t=demo-staff') + '">Accept the invite</a><p class="xsmall muted">Demo only: this opens the sample invite page.</p></div></div>');
      s.addEventListener('close', function(){ C.go('#/users?tab=staff'); });
    });
  }
  function permsDialog(email, after){
    var list = staffList(), x = list.filter(function(s){ return s.email === email; })[0]; if(!x) return;
    var d = C.dialog('Permissions: ' + RI.esc(x.name || x.email), '<p class="small muted">Changes take effect at once and end the person\'s current sessions.</p>' + permBoxes(C.migratePerms(x.perms)) +
      '<div class="cta-row" style="justify-content:space-between">' + (x.status !== 'disabled' ? '<button type="button" class="linkbtn danger" id="pd-dis">Disable this staff account</button>' : '<button type="button" class="linkbtn" id="pd-en">Turn the account back on</button>') +
      '<span class="cta-row"><button type="button" class="btn btn-secondary" data-dlg-close>Cancel</button><button type="button" class="btn btn-primary" id="pd-save">Save</button></span></div>', {wide:true});
    d.querySelector('#pd-save').addEventListener('click', function(){
      var perms = [].slice.call(d.querySelectorAll('.perm input:checked')).map(function(i){ return i.value; });
      x.perms = perms; C.set('staff', list); C.log('Permissions changed', x.email + ': ' + perms.length + ' permissions', ''); RI.toast('Permissions saved.', 'check'); d.close(); after();
    });
    var dis = d.querySelector('#pd-dis'); if(dis) dis.addEventListener('click', function(){ x.status = 'disabled'; C.set('staff', list); C.log('Staff disabled', x.email, ''); RI.toast('Staff account disabled.'); d.close(); after(); });
    var en = d.querySelector('#pd-en'); if(en) en.addEventListener('click', function(){ x.status = 'active'; C.set('staff', list); C.log('Staff enabled', x.email, ''); d.close(); after(); });
  }

  /* ---------- Audit log ----------
     Who, what, on what, when and why (SECURITY 15, BACKLOG M1-36), filtered by person, action and date (M4-28).
     Desktop: a real table, one column per question, rows grouped by day. Tablet: the reason moves under the change.
     Phone: each change is a card. Nothing here can be edited. */
  /* Action tags by meaning: rulebook changes, checks, and people and access */
  var AU_KIND = {'Published':'pub', 'Draft saved':'draft', 'Discarded':'off', 'Back-test run':'chk', 'Accuracy run':'chk', 'Graded':'chk',
    'Staff invited':'acc', 'Permissions changed':'acc', 'Staff enabled':'acc', 'Contacts exported':'acc', 'Super admin created':'acc', 'Staff disabled':'bad', 'Account disabled':'bad'};
  /* What each area is called, and where it opens */
  var AU_AREA = {rates:['Rates', '#/rates'], rules:['Rules', '#/rules'], sheets:['Condition sheets', '#/condition-sheets'], templates:['Room templates', '#/room-templates'],
    packages:['Packages', '#/packages'], products:['Products', '#/products'], guidance:['Guidance', '#/guidance'], resources:['Builder documents', '#/resources'],
    backtests:['Back-tests', '#/backtests'], accuracy:['Photo accuracy', '#/accuracy'], users:['Users and staff', '#/users?tab=staff'], feedback:['Contacts and feedback', '#/feedback'], tree:['Decision tree', '']};
  C.route('/audit', function(view){
    var all = C.get('audit', []), st = {who:'all', act:'all', when:'all', q:'', page:0, per:C.get('au.per', 10)};
    var PER = [10, 25, 50];
    var people = all.map(function(e){ return e.by; }).filter(function(v, i, a){ return a.indexOf(v) === i; });
    var acts = all.map(function(e){ return e.action; }).filter(function(v, i, a){ return a.indexOf(v) === i; }).sort();
    view.innerHTML = C.page({kicker:'Admin', title:'Audit log', sub:'Every change: who made it, when, and why. Nothing here can be edited or removed.',
      body:'<div class="c-toolbar au-bar">' + '<div class="au-period" id="au-when" role="radiogroup" aria-label="Period">' + [['all','All time'],['1','Today'],['7','7 days'],['30','30 days']].map(function(o, i){ return '<button type="button" role="radio" data-v="' + o[0] + '" aria-checked="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '">' + o[1] + '</button>'; }).join('') + '</div>' +
        '<div class="c-tools">' + C.search('au-q', 'Search changes', '') +
        '<label class="c-select"><span class="sr">Person</span><select id="au-who"><option value="all">Everyone</option>' + people.map(function(p){ return '<option>' + RI.esc(p) + '</option>'; }).join('') + '</select></label>' +
        '<label class="c-select"><span class="sr">Action</span><select id="au-act"><option value="all">All actions</option>' + acts.map(function(a){ return '<option>' + RI.esc(a) + '</option>'; }).join('') + '</select></label></div></div>' +
        '<p class="au-sum" id="au-sum" aria-live="polite"></p><div id="au-list"></div>'});
    var today = new Date(); today.setHours(0, 0, 0, 0);
    function dayName(t){ var d = new Date(t); d.setHours(0, 0, 0, 0); var n = Math.round((today - d) / DAY); return n === 0 ? 'Today' : n === 1 ? 'Yesterday' : C.date(t); }
    function clock(t){ return new Date(t).toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'}); }
    function why(e){ return e.why ? RI.esc(e.why) : '<span class="au-none">No reason given</span>'; }
    function row(e){
      var area = AU_AREA[e.area], what = RI.esc(e.what), sys = e.by === 'System';
      return '<tr class="au-r">' +
        '<td class="au-c-when" data-label="When"><time datetime="' + new Date(e.at).toISOString() + '" title="' + C.date(e.at) + ', ' + clock(e.at) + '">' + clock(e.at) + '</time></td>' +
        '<td class="au-c-who" data-label="Who"><span class="c-person">' + (sys ? '<span class="c-av sm au-sys" aria-hidden="true">' + RI.icon('console','i-sm') + '</span>' : C.av(e.by, 'sm' + (e.by === 'Sam' ? ' sam' : ''))) +
          '<span><b>' + RI.esc(e.by) + '</b><small>' + (sys ? 'Server' : RI.esc(e.role || 'Staff')) + '</small></span></span></td>' +
        '<td class="au-c-act" data-label="Action"><span class="au-tag au-' + (AU_KIND[e.action] || 'off') + '">' + RI.esc(e.action) + '</span></td>' +
        '<td class="au-c-what" data-label="What">' + (area && area[1] ? '<a class="au-what" href="' + area[1] + '">' + what + '</a>' : '<b class="au-what">' + what + '</b>') +
          (area ? '<small class="au-area">' + area[0] + '</small>' : '') + '<p class="au-why-in">' + (e.why ? '“' + RI.esc(e.why) + '”' : '<span class="au-none">No reason given</span>') + '</p></td>' +
        '<td class="au-c-why" data-label="Why">' + why(e) + '</td></tr>';
    }
    function draw(){
      var v = st.q.toLowerCase().trim(), cut = st.when === 'all' ? 0 : st.when === '1' ? +today : Date.now() - (+st.when) * DAY;
      var rows = all.filter(function(e){ return (st.who === 'all' || e.by === st.who) && (st.act === 'all' || e.action === st.act) && e.at >= cut && (!v || [e.by, e.action, e.what, e.why].join(' ').toLowerCase().indexOf(v) > -1); });
      var pages = Math.max(1, Math.ceil(rows.length / st.per)); st.page = Math.min(st.page, pages - 1);
      var shown = rows.slice(st.page * st.per, st.page * st.per + st.per), lastDay = '', body = '';
      shown.forEach(function(e){
        var d = dayName(e.at);
        if(d !== lastDay){ if(body) body += '</tbody>'; body += '<tbody><tr class="au-day"><th colspan="5" scope="colgroup">' + d + '</th></tr>'; lastDay = d; }
        body += row(e);
      });
      var filtered = st.who !== 'all' || st.act !== 'all' || st.when !== 'all' || v;
      doc.getElementById('au-sum').innerHTML = '<span><b>' + rows.length + '</b> ' + (rows.length === 1 ? 'change' : 'changes') + (filtered ? ' match these filters' : ', newest first') + '</span>' +
        (filtered ? '<button type="button" class="linkbtn small" id="au-clear">Clear filters</button>' : '');
      doc.getElementById('au-list').innerHTML = rows.length ?
        '<div class="c-tbl-wrap"><table class="c-tbl au-tbl"><caption class="sr">Audit log, ' + rows.length + ' changes</caption>' +
          '<thead><tr><th scope="col" class="au-c-when">When</th><th scope="col" class="au-c-who">Who</th><th scope="col" class="au-c-act">Action</th><th scope="col" class="au-c-what">What</th><th scope="col" class="au-c-why">Why</th></tr></thead>' + body + '</tbody></table></div>' +
          C.pager({page:st.page, per:st.per, total:rows.length, noun:rows.length === 1 ? 'change' : 'changes', perOpts:PER})
        : '<div class="c-empty">' + RI.icon('info') + '<p>' + (v ? 'No change matches “' + RI.esc(st.q) + '”. Try a rule code, an address or a name.' : 'No changes match these filters.') + '</p></div>';
      RI.fillIcons(doc.getElementById('au-list'));
    }
    function reset(){ st.page = 0; draw(); }
    function setWhen(val){ st.when = val; view.querySelectorAll('#au-when [data-v]').forEach(function(x){ var on = x.getAttribute('data-v') === val; x.setAttribute('aria-checked', on); x.tabIndex = on ? 0 : -1; }); }
    view.querySelector('#au-when').addEventListener('click', function(e){ var b = e.target.closest('[data-v]'); if(!b) return; setWhen(b.getAttribute('data-v')); reset(); });
    /* A radio group: arrow keys move the choice, as people expect from a set of options */
    view.querySelector('#au-when').addEventListener('keydown', function(e){
      var k = e.key, bs = [].slice.call(this.querySelectorAll('[data-v]')), i = bs.indexOf(e.target); if(i < 0) return;
      var n = k === 'ArrowRight' || k === 'ArrowDown' ? (i + 1) % bs.length : k === 'ArrowLeft' || k === 'ArrowUp' ? (i - 1 + bs.length) % bs.length : k === 'Home' ? 0 : k === 'End' ? bs.length - 1 : -1;
      if(n < 0) return; e.preventDefault(); setWhen(bs[n].getAttribute('data-v')); bs[n].focus(); reset();
    });
    view.querySelector('#au-q').addEventListener('input', function(){ st.q = this.value; reset(); });
    view.querySelector('#au-who').addEventListener('change', function(){ st.who = this.value; reset(); });
    view.querySelector('#au-act').addEventListener('change', function(){ st.act = this.value; reset(); });
    view.addEventListener('change', function(e){ if(!e.target.matches('[data-per]')) return; st.per = C.set('au.per', +e.target.value); reset(); });
    view.addEventListener('click', function(e){
      if(e.target.closest('#au-clear')){ st.who = st.act = 'all'; st.q = ''; setWhen('all'); view.querySelector('#au-q').value = ''; view.querySelector('#au-who').value = 'all'; view.querySelector('#au-act').value = 'all'; reset(); view.querySelector('#au-q').focus(); return; }
      var pg = e.target.closest('[data-pg]'); if(!pg || pg.disabled) return;
      st.page = +pg.getAttribute('data-pg'); draw();
      var list = doc.getElementById('au-list'), top = list.getBoundingClientRect().top;
      if(top < 80) window.scrollTo({top:window.scrollY + top - 96, behavior:'smooth'});
      var cur = list.querySelector('[aria-current="page"]'); if(!cur || !cur.offsetParent) cur = list.querySelector('.pg-' + (pg.classList.contains('pg-prev') ? 'prev' : 'next') + ':not(:disabled)'); if(cur) cur.focus({preventScroll:true});
    });
    draw();
  }, {nav:'audit', perm:'audit.view'});
})();
