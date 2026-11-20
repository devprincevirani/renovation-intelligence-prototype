/* Console: users and staff (APP_FLOW 7, SECURITY 3.2, BACKLOG M1-34, M4-22) and the audit log (SECURITY 15, M1-36, M4-28).
   Only Sam invites staff and sets permissions. Contacts and feedback live in release.js. */
(function(){
  var RI = window.RI, A = RI.App, C = RI.Con, doc = document;
  var DAY = 86400000, now = Date.now();

  C.SEEDS.push(function(){
    /* One staff invite: the sample invite page (/invite/?t=demo-staff) accepts it */
    C.set('staff', [{email:'staff@demo.ri', name:'', status:'invited', perms:C.SAMPLE_STAFF.slice(), invitedAt:now - 2 * DAY, token:'demo-staff'}]);
    C.set('audit', [
      {at:now - 26 * 60000, by:'Sam', role:'Super admin', action:'Published', what:'Rate library: LVP flooring, sample region', why:'New supplier price list for November', area:'rates'},
      {at:now - 3 * 3600000, by:'Sam', role:'Super admin', action:'Back-test run', what:'12 houses replayed after the cabinet refinish change', why:'Before publishing CB-RULE-015 v3', area:'backtests'},
      {at:now - 5 * 3600000, by:'Sam', role:'Super admin', action:'Graded', what:'Kitchen cabinets on 18450 Maple Ridge Dr: correct', why:'Refinish is right for sound oak boxes', area:'tree'},
      {at:now - DAY - 2 * 3600000, by:'Sam', role:'Super admin', action:'Draft saved', what:'Condition sheet: cabinets, threshold 70 to 75', why:'Too many dark photos passed', area:'sheets'},
      {at:now - 2 * DAY, by:'Sam', role:'Super admin', action:'Staff invited', what:'staff@demo.ri, with 5 permissions', why:'', area:'users'},
      {at:now - 3 * DAY, by:'Sam', role:'Super admin', action:'Published', what:'Room template: Kitchen v2', why:'The starting count for a small kitchen in the guide', area:'templates'},
      {at:now - 6 * DAY, by:'Sam', role:'Super admin', action:'Discarded', what:'Guidance: water heater text', why:'Wording not final', area:'guidance'},
      {at:now - 9 * DAY, by:'System', role:'', action:'Super admin created', what:'admin@demo.ri', why:'One-time command on the server', area:'users'}
    ].map(function(e){ e.id = C.uid('a'); return e; }));
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
    view.innerHTML = C.page({kicker:'People', title:'Users and staff', sub:'Every account, its type and state; Sam\'s staff and what each may do; and the waitlist.',
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

  /* ---------- Audit log ---------- */
  C.route('/audit', function(view){
    var all = C.get('audit', []), st = {who:'all', act:'all', when:'all', q:''};
    var people = all.map(function(e){ return e.by; }).filter(function(v, i, a){ return a.indexOf(v) === i; });
    var acts = all.map(function(e){ return e.action; }).filter(function(v, i, a){ return a.indexOf(v) === i; }).sort();
    view.innerHTML = C.page({kicker:'People and insight', title:'Audit log', sub:'Every change: who made it, when, and why. Nothing here can be edited or removed.',
      body:'<div class="c-toolbar">' + C.seg('au-when', [['all','All time'],['1','Today'],['7','7 days'],['30','30 days']], 'all') +
        '<div class="c-tools">' + C.search('au-q', 'Search what changed', '') +
        '<label class="c-select"><span class="sr">Person</span><select id="au-who"><option value="all">Everyone</option>' + people.map(function(p){ return '<option>' + RI.esc(p) + '</option>'; }).join('') + '</select></label>' +
        '<label class="c-select"><span class="sr">Action</span><select id="au-act"><option value="all">All actions</option>' + acts.map(function(a){ return '<option>' + RI.esc(a) + '</option>'; }).join('') + '</select></label></div></div><div id="au-list"></div>'});
    function draw(){
      var v = st.q.toLowerCase(), cut = st.when === 'all' ? 0 : Date.now() - (+st.when) * DAY;
      var rows = all.filter(function(e){ return (st.who === 'all' || e.by === st.who) && (st.act === 'all' || e.action === st.act) && e.at >= cut && (!v || (e.what + ' ' + e.why).toLowerCase().indexOf(v) > -1); });
      var lastDay = '';
      doc.getElementById('au-list').innerHTML = rows.length ? '<ol class="au-list">' + rows.map(function(e){
        var day = C.date(e.at), head = day !== lastDay ? '<li class="au-day">' + (Date.now() - e.at < DAY && new Date(e.at).getDate() === new Date().getDate() ? 'Today' : day) + '</li>' : ''; lastDay = day;
        return head + '<li class="au-e"><span class="au-t">' + new Date(e.at).toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'}) + '</span>' + C.av(e.by, e.by === 'Sam' ? 'sam' : '') +
          '<div class="au-b"><p><b>' + RI.esc(e.by) + '</b> <span class="au-a au-' + e.action.split(' ')[0].toLowerCase() + '">' + RI.esc(e.action) + '</span> ' + RI.esc(e.what) + '</p>' + (e.why ? '<p class="au-why">“' + RI.esc(e.why) + '”</p>' : '') + '</div></li>';
      }).join('') + '</ol>' : '<div class="c-empty">' + RI.icon('info') + '<p>No changes match these filters.</p></div>';
      RI.fillIcons(doc.getElementById('au-list'));
    }
    view.querySelector('#au-when').addEventListener('click', function(e){ var b = e.target.closest('[data-v]'); if(!b) return; st.when = b.getAttribute('data-v'); view.querySelectorAll('#au-when [data-v]').forEach(function(x){ x.setAttribute('aria-selected', x === b); }); draw(); });
    view.querySelector('#au-q').addEventListener('input', function(){ st.q = this.value; draw(); });
    view.querySelector('#au-who').addEventListener('change', function(){ st.who = this.value; draw(); });
    view.querySelector('#au-act').addEventListener('change', function(){ st.act = this.value; draw(); });
    draw();
  }, {nav:'audit', perm:'audit.view'});
})();
