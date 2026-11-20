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

  /* ---------- Users and staff ----------
     Users: one State column (not verified, active, trial with days left, disabled) and Enable after Disable.
     Waitlist and trial: Sam invites waiting contacts to the 15-day trial (SECURITY 3.2, APP_FLOW 10 "Trial invite", BACKLOG M1-38).
     Staff: the table, then a grid of who can do what (SECURITY 3.2, 3.3). */
  var TRIAL_DAYS = 15;
  /* Example rows so the screen reads at its real size. Accounts made in this browser are added on top */
  var SAMPLE_USERS = [
    {email:'maria.lopez@example.com', name:'Maria Lopez', type:'Homeowner', verified:true, news:true, at:now - 49 * DAY, houses:2},
    {email:'dwallace@example.com', name:'Derek Wallace', type:'Builder', verified:true, news:false, at:now - 63 * DAY, houses:9},
    {email:'aisha.khan@example.com', name:'Aisha Khan', type:'Agent', verified:true, news:true, trial:true, at:now - 9 * DAY, houses:5},
    {email:'j.carter@example.com', name:'James Carter', type:'Buyer', verified:true, news:false, trial:true, at:now - 13 * DAY, houses:1},
    {email:'t.nowak@example.com', name:'Tomasz Nowak', type:'Seller', verified:false, news:false, at:now - DAY, houses:0},
    {email:'hannah.price@example.com', name:'Hannah Price', type:'Homeowner', verified:true, news:false, at:now - 29 * DAY, houses:1, disabled:true}
  ];
  var SAMPLE_WL = [
    {email:'kim.tran@example.com', type:'homeowner', source:'home', at:now - 2 * DAY},
    {email:'oscar.b@example.com', type:'builder', source:'waitlist', at:now - 3 * DAY},
    {email:'n.patel@example.com', type:'agent', source:'home', at:now - 5 * DAY, invitedAt:now - 4 * DAY},
    {email:'sara.l@example.com', type:'buyer', source:'waitlist', at:now - 10 * DAY},
    {email:'aisha.khan@example.com', type:'agent', source:'home', at:now - 16 * DAY, invitedAt:now - 12 * DAY},
    {email:'j.carter@example.com', type:'buyer', source:'waitlist', at:now - 20 * DAY, invitedAt:now - 15 * DAY},
    {email:'lee.morgan@example.com', type:'other', source:'home', at:now - 22 * DAY}
  ];
  /* Short names for the grid; the full sentence stays in the invite and permissions dialogs */
  var SHORT = {'houses.view':'See houses', 'houses.grade':'Grade decisions', 'rulebook.view':'Read the rulebook', 'rulebook.edit':'Edit rulebook drafts',
    'pricing.edit':'Edit products and rates', 'content.edit':'Edit guidance and documents', 'accuracy.manage':'Label photos for accuracy', 'backtests.run':'Run back-tests',
    'users.view':'See users and the waitlist', 'contacts.export':'Read feedback, export contacts', 'funnel.view':'See the funnel', 'audit.view':'Read the audit log'};
  var GROUPS = [['Houses', ['houses.view', 'houses.grade']], ['Rulebook and pricing', ['rulebook.view', 'rulebook.edit', 'pricing.edit', 'content.edit', 'accuracy.manage', 'backtests.run']],
    ['People and records', ['users.view', 'contacts.export', 'funnel.view', 'audit.view']]];
  var SAM_ONLY = ['Publish or discard a draft', 'Invite staff and set permissions', 'Invite contacts to the trial', 'Disable an account'];
  /* Demo access logins: a note on where the row comes from, not a state, so it is quiet and sits by the name */
  var DEMO_TAG = '<span class="lb lb-sample" title="A Demo access login for trying the prototype. It cannot be disabled.">Demo</span>';
  /* Phones and tablets: the details collapse into one quiet line under the name */
  function meta(parts){ return '<small class="us-meta">' + parts.filter(Boolean).map(function(p){ return '<span>' + p + '</span>'; }).join(' &middot; ') + '</small>'; }
  var cap = function(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; };
  function daysLeft(u){ return TRIAL_DAYS - Math.floor((now - u.at) / DAY); }
  function userState(u){
    if(u.disabled) return 'disabled';
    if(!u.verified) return 'unverified';
    if(u.trial && daysLeft(u) > 0) return 'trial';
    return 'active';
  }
  function stateLbl(u){
    var s = userState(u);
    if(s === 'disabled') return '<span class="lb lb-bad">Disabled</span>';
    if(s === 'unverified') return '<span class="lb lb-off">Not verified</span>';
    if(s === 'trial'){ var d = daysLeft(u); return '<span class="lb ' + (d <= 3 ? 'lb-queued' : 'lb-info') + '">Trial, ' + d + (d === 1 ? ' day' : ' days') + ' left</span>'; }
    return '<span class="lb lb-pub">Active</span>';
  }

  C.route('/users', function(view){
    var q = C.query(), tab = q.tab === 'trial' ? 'waitlist' : (q.tab || 'users'), m = C.me(), sam = C.can('staff');
    /* The trial is for the contacts Sam invites before launch (PROJECT 3d, GLOSSARY) */
    var pre = RI.mode() === 'prelaunch', canInvite = sam && pre;
    var st = {uf:'all', uq:'', wf:'all', wq:'', pick:[]};
    var flags = C.get('userFlags', {}), inv = C.get('trialInvites', {});

    function users(){
      var list = (RI.ROLES || []).filter(function(r){ return r.role !== 'admin'; }).map(function(r){ return {email:r.email, name:r.name, type:r.type, demo:true, verified:true, news:false, at:now - 30 * DAY}; });
      var acc = RI.users.all(); Object.keys(acc).forEach(function(k){ var u = acc[k]; if(u.role === 'staff') return; list.push({email:u.email, name:u.email.split('@')[0], type:u.type ? cap(u.type) : 'User', verified:!!u.verified, news:!!u.news, trial:!!u.trial, at:u.at || now, disabled:u.disabled, real:true}); });
      SAMPLE_USERS.forEach(function(s){ if(!list.some(function(u){ return u.email === s.email; })) list.push(Object.assign({}, s)); });
      list.forEach(function(u){ if(!u.real && flags[u.email] != null) u.disabled = flags[u.email]; if(u.houses == null) u.houses = A.all().filter(function(h){ return h.owner === u.email; }).length; });
      return list.sort(function(a, b){ return b.at - a.at; });
    }
    function waitlist(){
      var mine = RI.store.get('waitlist', []), list = mine.slice().reverse().map(function(w){ return Object.assign({}, w); });
      SAMPLE_WL.forEach(function(s){ if(!list.some(function(w){ return w.email === s.email; })) list.push(Object.assign({}, s)); });
      var us = users();
      list.forEach(function(w){
        if(inv[w.email]) w.invitedAt = inv[w.email];
        var u = us.filter(function(x){ return x.email === w.email; })[0];
        w.user = u && u.trial ? u : null;
        w.status = w.user ? 'trial' : w.invitedAt ? 'invited' : 'waiting';
      });
      return list;
    }
    var U = users(), W = waitlist(), staff = staffList();

    view.innerHTML = C.page({kicker:'Admin', title:'Users and staff', sub:'Users, account types, staff invites and permissions.',
      actions:sam ? '<div class="us-head" id="us-head" aria-live="polite"></div><button type="button" class="btn btn-primary" id="inv-new">' + RI.icon('mail','i-sm') + 'Invite staff</button>' : '',
      body:'<div class="us-top">' + C.seg('us-tab', [['users','Users',U.length],['staff','Staff',staff.length + 1],['waitlist','Waitlist and trial',W.length]], tab) + '<div id="us-tools" class="us-bar"></div></div><div id="us-body"></div>'});

    function count(list, fn, v){ return list.filter(function(x){ return fn(x) === v; }).length; }
    /* State filter as a dropdown beside the search: each option carries its count */
    function pick(id, label, opts, cur){
      return '<label class="c-select us-pick"><span class="sr">' + label + '</span><select id="' + id + '">' + opts.map(function(o){ return '<option value="' + o[0] + '"' + (o[0] === cur ? ' selected' : '') + '>' + o[1] + ' (' + o[2] + ')</option>'; }).join('') + '</select></label>';
    }
    function bodyUsers(el){
      var rows = U.filter(function(u){ return (st.uf === 'all' || userState(u) === st.uf) && (!st.uq || (u.name + ' ' + u.email).toLowerCase().indexOf(st.uq) > -1); });
      var tools = doc.getElementById('us-tools');
      tools.innerHTML = C.search('us-uq', 'Search name or email', st.uq) +
        pick('us-uf', 'State', [['all','All states',U.length],['active','Active',count(U, userState, 'active')],['trial','On trial',count(U, userState, 'trial')],['unverified','Not verified',count(U, userState, 'unverified')],['disabled','Disabled',count(U, userState, 'disabled')]], st.uf);
      el.innerHTML =
        '<div class="c-mt">' + C.table({cls:'us-cards us-users', empty:'No account matches. Try another name, or show all.', cols:[{label:'Person'},{label:'Account type'},{label:'State'},{label:'Houses', num:true},{label:'Updates'},{label:'Joined', num:true},{label:''}],
          rows:rows.map(function(u){
            var act = '';
            if(sam && !u.demo) act = u.disabled ? '<button type="button" class="linkbtn small" data-en="' + RI.esc(u.email) + '">Enable</button>' : '<button type="button" class="linkbtn small danger" data-dis="' + RI.esc(u.email) + '">Disable</button>';
            return {attr:u.disabled ? 'class="us-off"' : '', cells:['<span class="c-person">' + C.av(u.name) + '<span><span class="us-name"><b>' + RI.esc(u.name) + '</b>' + (u.demo ? DEMO_TAG : '') + '</span><small>' + RI.esc(u.email) + '</small>' + meta([RI.esc(u.type), u.houses + (u.houses === 1 ? ' house' : ' houses'), 'Joined ' + C.date(u.at)]) + '</span></span>',
              C.chip(RI.esc(u.type)), stateLbl(u), String(u.houses), u.news ? 'Yes' : '<span class="muted">No</span>', C.date(u.at), act]};
          })}) + '</div>' +
        '<div class="c-mt">' + C.note('Account type changes what a person sees, never what they may do. Disabling an account ends its sessions at once; its houses stay.') + '</div>';
      RI.fillIcons(el);
      RI.fillIcons(tools);
      var s = tools.querySelector('#us-uq'); s.addEventListener('input', function(){ st.uq = this.value.trim().toLowerCase(); var p = this.selectionStart; bodyUsers(el); var n = doc.getElementById('us-uq'); n.focus(); n.setSelectionRange(p, p); });
      tools.querySelector('#us-uf').addEventListener('change', function(){ st.uf = this.value; bodyUsers(el); doc.getElementById('us-uf').focus(); });
    }

    function wlStatus(w){
      if(w.status === 'trial'){ var d = daysLeft(w.user); return d > 0 ? '<span class="lb ' + (d <= 3 ? 'lb-queued' : 'lb-pub') + '">On trial, ' + d + (d === 1 ? ' day' : ' days') + ' left</span>' : '<span class="lb lb-off">Trial ended</span>'; }
      if(w.status === 'invited') return '<span class="us-st"><span class="lb lb-info">Invited</span><span class="us-when">' + new Date(w.invitedAt).toLocaleDateString('en-US', {month:'short', day:'numeric'}) + '</span></span>';
      return '<span class="lb lb-off">Waiting</span>';
    }
    function bodyWaitlist(el){
      var rows = W.filter(function(w){ return (st.wf === 'all' || w.status === st.wf) && (!st.wq || w.email.indexOf(st.wq) > -1); });
      var waiting = rows.filter(function(w){ return w.status === 'waiting'; });
      st.pick = st.pick.filter(function(e){ return waiting.some(function(w){ return w.email === e; }); });
      var all = waiting.length && st.pick.length === waiting.length;
      var cols = (canInvite ? [{label:'<span class="sr">Select</span><input type="checkbox" class="us-ck" id="us-all" aria-label="Select every waiting contact"' + (all ? ' checked' : '') + (waiting.length ? '' : ' disabled') + '>', cls:'us-ckc'}] : [])
        .concat([{label:'Email'},{label:'Account type'},{label:'From'},{label:'Joined', num:true},{label:'Status'},{label:'', cls:'us-actc'}]);
      var tools = doc.getElementById('us-tools');
      tools.innerHTML = C.search('us-wq', 'Search by email', st.wq) +
        pick('us-wf', 'Status', [['all','All statuses',W.length],['waiting','Waiting',count(W, function(w){ return w.status; }, 'waiting')],['invited','Invited',count(W, function(w){ return w.status; }, 'invited')],['trial','On trial',count(W, function(w){ return w.status; }, 'trial')]], st.wf);
      el.innerHTML =
        '<div class="c-mt">' + C.table({cls:'us-wl us-cards' + (canInvite ? ' us-has-ck' : ''), empty:'Nobody matches. Try another email, or show all.', cols:cols,
          rows:rows.map(function(w){
            var act = !canInvite ? '' : w.status === 'waiting' ? '<button type="button" class="us-act" data-trial="' + RI.esc(w.email) + '" aria-label="Invite ' + RI.esc(w.email) + ' to the trial">' + RI.icon('mail','i-sm') + 'Invite</button>' : w.status === 'invited' ? '<button type="button" class="us-act" data-trial="' + RI.esc(w.email) + '" data-again="1" title="Last sent ' + C.date(w.invitedAt) + '" aria-label="Resend the trial invite to ' + RI.esc(w.email) + '">' + RI.icon('refresh','i-sm') + 'Resend</button>' : '';
            var ck = canInvite ? [w.status === 'waiting' ? '<input type="checkbox" class="us-ck" data-pick="' + RI.esc(w.email) + '" aria-label="Select ' + RI.esc(w.email) + '"' + (st.pick.indexOf(w.email) > -1 ? ' checked' : '') + '>' : ''] : [];
            return {attr:st.pick.indexOf(w.email) > -1 ? 'class="us-picked"' : '', cells:ck.concat(['<b>' + RI.esc(w.email) + '</b>' + meta([w.type ? cap(w.type) : '', w.source === 'home' ? 'Home page' : 'Waitlist page', 'Joined ' + C.date(w.at)]), w.type ? C.chip(cap(w.type)) : '<span class="muted">Not given</span>', w.source === 'home' ? 'Home page' : 'Waitlist page', C.date(w.at), wlStatus(w), act])};
          })}) + '</div>' +
        '<div class="c-mt">' + C.note(!pre ? 'Trial invites are for the contacts Sam invites before launch. Export the list from Contacts and feedback.' : sam ? 'A trial invite emails a link to sign up for a 15-day trial. Export the list from Contacts and feedback.' : 'Only Sam invites contacts to the trial. Export the list from Contacts and feedback.') + '</div>';
      var ah = el.querySelector('#us-all'); if(ah) ah.indeterminate = st.pick.length > 0 && !all;
      RI.fillIcons(el);
      RI.fillIcons(tools);
      tools.querySelector('#us-wq').addEventListener('input', function(){ st.wq = this.value.trim().toLowerCase(); var p = this.selectionStart; bodyWaitlist(el); var n = doc.getElementById('us-wq'); n.focus(); n.setSelectionRange(p, p); });
      tools.querySelector('#us-wf').addEventListener('change', function(){ st.wf = this.value; bodyWaitlist(el); doc.getElementById('us-wf').focus(); });
      el.addEventListener('change', function onCk(e){
        var t = e.target; if(!t.classList.contains('us-ck')) return; el.removeEventListener('change', onCk);
        if(t.id === 'us-all') st.pick = t.checked ? waiting.map(function(w){ return w.email; }) : [];
        else { var em = t.getAttribute('data-pick'); st.pick = t.checked ? st.pick.concat(em) : st.pick.filter(function(x){ return x !== em; }); }
        bodyWaitlist(el);
      });
      headActs();
    }
    function trialDialog(emails, again){
      var one = emails.length === 1;
      var d = C.dialog(again ? 'Resend the trial invite' : one ? 'Invite to the trial' : 'Invite ' + emails.length + ' contacts to the trial',
        '<p>' + (one ? '<b>' + RI.esc(emails[0]) + '</b> gets' : 'These contacts get') + ' an email with a link to sign up for a 15-day trial.</p>' +
        (one ? '' : '<ul class="us-list">' + emails.map(function(e){ return '<li>' + RI.esc(e) + '</li>'; }).join('') + '</ul>') +
        '<div class="mail-sim"><div class="mh">' + RI.icon('mail','i-sm') + '<span><b>Trial invite</b> · You are invited to try Renovation Intelligence</span></div><div class="mb"><p>Sam invited you to try Renovation Intelligence before it opens. Sign up to start your 15-day trial.</p><a class="btn btn-primary btn-sm" href="' + RI.url('signup/?invite=demo-trial') + '">Sign up</a><p class="xsmall muted">Demo only: this opens the sample trial sign-up.</p></div></div>' +
        '<div class="cta-row" style="justify-content:flex-end"><button type="button" class="btn btn-secondary" data-dlg-close>Cancel</button><button type="button" class="btn btn-primary" id="tr-go">' + (again ? 'Send it again' : one ? 'Send the invite' : 'Send ' + emails.length + ' invites') + '</button></div>');
      RI.fillIcons(d);
      d.querySelector('#tr-go').addEventListener('click', function(){
        var t = Date.now(); emails.forEach(function(e){ inv[e] = t; C.log('Trial invite sent', e, '', 'users'); }); C.set('trialInvites', inv);
        st.pick = []; W = waitlist(); d.close(); RI.toast(one ? 'Trial invite sent.' : emails.length + ' trial invites sent.', 'check'); body();
      });
    }

    function permGrid(){
      var people = staff.filter(function(x){ return x.status !== 'disabled'; });
      var head = '<tr><th scope="col" class="pg-perm">Permission</th><th scope="col" class="pg-who">' + C.av('Sam', 'sam') + '<span>Sam<small>Super admin</small></span></th>' +
        people.map(function(x){ return '<th scope="col" class="pg-who">' + C.av(x.name || x.email) + '<span>' + RI.esc((x.name || x.email.split('@')[0]).split(' ')[0]) + '<small>' + (x.status === 'invited' ? 'Invited' : 'Staff') + '</small></span>' + (sam ? '<button type="button" class="linkbtn small pg-man" data-staff="' + RI.esc(x.email) + '">Manage</button>' : '') + '</th>'; }).join('') + '</tr>';
      var yes = '<span class="pg-yes" title="Yes">' + RI.icon('check','i-sm') + '<span class="sr">Yes</span></span>';
      var rows = GROUPS.map(function(g){
        return '<tr class="pg-grp"><th scope="rowgroup" colspan="' + (people.length + 2) + '">' + g[0] + '</th></tr>' + g[1].map(function(code){
          return '<tr><th scope="row" class="pg-perm"><b>' + SHORT[code] + '</b><code>' + code + '</code></th><td>' + yes + '</td>' + people.map(function(x, i){
            var held = C.migratePerms(x.perms), has = held.indexOf(code) > -1;
            var by = Object.keys(C.IMPLIES).filter(function(k){ return held.indexOf(k) > -1 && C.IMPLIES[k].indexOf(code) > -1; })[0];
            if(has) return '<td>' + yes + '</td>';
            if(by) return '<td><span class="pg-inc" title="Included with ' + SHORT[by] + '">' + RI.icon('check','i-sm') + '<span class="sr">Included with ' + SHORT[by] + '</span></span></td>';
            return '<td><span class="pg-no" aria-label="No">–</span></td>';
          }).join('') + '</tr>';
        }).join('');
      }).join('') + '<tr class="pg-grp"><th scope="rowgroup" colspan="' + (people.length + 2) + '">Super admin only</th></tr>' + SAM_ONLY.map(function(t){
        return '<tr class="pg-sam"><th scope="row" class="pg-perm"><b>' + t + '</b></th><td>' + yes + '</td>' + people.map(function(){ return '<td><span class="pg-no" title="Only Sam">' + RI.icon('lock','i-sm') + '<span class="sr">Only Sam</span></span></td>'; }).join('') + '</tr>';
      }).join('');
      return '<section class="c-card c-mt pg-card"><header><div><h2>Access overview</h2><p class="small muted">Who can do what, side by side. ' + (sam ? 'To change it, open Manage for that person.' : 'Only Sam changes permissions.') + '</p></div><div class="pg-key" aria-hidden="true"><span>' + RI.icon('check','i-sm') + 'Given</span><span class="inc">' + RI.icon('check','i-sm') + 'Included with an edit</span><span>' + RI.icon('lock','i-sm') + 'Only Sam</span></div></header>' +
        '<div class="pg-wrap"><table class="pg-tbl"><caption class="sr">Permissions for each staff member</caption><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div></section>';
    }
    function bodyStaff(el){
      var rows = [{cells:['<span class="c-person">' + C.av('Sam', 'sam') + '<span><b>Sam</b><small>admin@demo.ri</small>' + meta(['Super admin', 'Everything', 'Created on the server']) + '</span></span>', '<span class="c-chip sam">Super admin</span>', C.lbl('published').replace('Published', 'Active'), '<span class="ax-areas"><span class="c-chip sam">Everything</span></span>', '<span class="muted">Created on the server</span>', '']}];
      staff.forEach(function(x){
        rows.push({attr:sam ? 'data-staff="' + RI.esc(x.email) + '" tabindex="0" role="button"' : '', cells:['<span class="c-person">' + C.av(x.name || x.email) + '<span><b>' + RI.esc(x.name || 'Not accepted yet') + '</b><small>' + RI.esc(x.email) + '</small>' + meta(['Staff', x.status === 'invited' ? 'Invited ' + C.ago(x.invitedAt) : 'Joined ' + C.ago(x.joinedAt || x.invitedAt)]) + '</span></span>', '<span class="c-chip">Staff</span>',
          staffLbl(x),
          areaChips(x.perms), x.status === 'invited' ? 'Invited ' + C.ago(x.invitedAt) + ' · link works 7 days' : 'Joined ' + C.ago(x.joinedAt || x.invitedAt),
          sam ? '<span class="linkbtn small">Manage access</span>' : '']});
      });
      el.innerHTML = C.table({cls:'us-cards us-staff', cols:[{label:'Person'},{label:'Role'},{label:'State'},{label:'Can work in'},{label:'Since'},{label:''}], rows:rows}) + permGrid() +
        '<div class="c-mt">' + C.note('Staff edit drafts. Only Sam publishes, and only Sam manages staff. A new staff member starts with no permissions.') + '</div>';
      RI.fillIcons(el);
    }

    /* Beside Invite staff: the waitlist selection. While contacts are ticked, inviting them is the main action,
       so Invite staff steps down to a secondary button */
    function headActs(){
      var slot = doc.getElementById('us-head'), staffBtn = doc.getElementById('inv-new'); if(!slot) return;
      var on = tab === 'waitlist' && canInvite, n = on ? st.pick.length : 0;
      slot.innerHTML = !on ? '' : n ? '<span class="us-h-sel"><b>' + n + ' selected</b><button type="button" class="us-ghost" id="us-clear">Clear</button></span>' +
        '<button type="button" class="btn btn-primary" id="us-bulk">' + RI.icon('mail','i-sm') + 'Invite ' + n + ' to the trial</button>' :
        '<span class="us-h-hint">Tick waiting contacts to invite several at once</span>';
      if(staffBtn){ staffBtn.classList.toggle('btn-primary', !n); staffBtn.classList.toggle('btn-secondary', !!n); }
      RI.fillIcons(slot);
      var cl = slot.querySelector('#us-clear'); if(cl) cl.addEventListener('click', function(){ st.pick = []; bodyWaitlist(doc.getElementById('us-body')); });
      var bk = slot.querySelector('#us-bulk'); if(bk) bk.addEventListener('click', function(){ trialDialog(st.pick.slice()); });
    }
    function body(){
      var el = doc.getElementById('us-body');
      doc.getElementById('us-tools').innerHTML = '';
      if(tab !== 'waitlist') st.pick = [];
      if(tab === 'users') bodyUsers(el);
      if(tab === 'staff') bodyStaff(el);
      if(tab === 'waitlist') bodyWaitlist(el);
      headActs();
    }
    view.querySelector('#us-tab').addEventListener('click', function(e){ var b = e.target.closest('[data-v]'); if(!b) return; tab = b.getAttribute('data-v'); view.querySelectorAll('#us-tab [data-v]').forEach(function(x){ x.setAttribute('aria-selected', x === b); }); history.replaceState(null, '', '#/users?tab=' + tab); body(); });
    view.addEventListener('click', function(e){
      var s = e.target.closest('[data-staff]'); if(s){ permsDialog(s.getAttribute('data-staff'), function(){ staff = staffList(); body(); }); return; }
      var tr = e.target.closest('[data-trial]'); if(tr){ trialDialog([tr.getAttribute('data-trial')], tr.hasAttribute('data-again')); return; }
      var d = e.target.closest('[data-dis]'), en = e.target.closest('[data-en]');
      if(d || en){
        var em = (d || en).getAttribute(d ? 'data-dis' : 'data-en'), off = !!d;
        var apply = function(){ var u = RI.users.get(em); if(u){ u.disabled = off; RI.users.put(u); } else { flags[em] = off; C.set('userFlags', flags); } C.log(off ? 'Account disabled' : 'Account enabled', em, '', 'users'); RI.toast(off ? 'Account disabled.' : 'Account enabled.'); U = users(); body(); };
        if(off) C.confirm('Disable this account?', RI.esc(em) + ' can no longer log in, and every session ends at once. Their houses stay.', 'Disable account', apply, true); else apply();
      }
    });
    view.addEventListener('keydown', function(e){ var s = e.target.closest('[data-staff]'); if(s && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); permsDialog(s.getAttribute('data-staff'), function(){ staff = staffList(); body(); }); } });
    var nb = view.querySelector('#inv-new'); if(nb) nb.addEventListener('click', function(){ inviteDialog(); });
    body();
  }, {nav:'users', perm:'users.view'});

  /* ---------- Staff access: one place to change it (SECURITY 3.2, 3.3; BACKLOG M1-34, M4-22) ----------
     A side panel, opened from Manage access or Invite staff. Permissions are grouped by area; ticking an edit
     permission ticks and locks the reading it includes. Nothing is saved until Save, the footer says exactly what
     will change, and a saved change ends that person's sessions. Disabling the account sits apart and asks first. */
  var AREAS = [
    ['Houses', 'house', ['houses.view', 'houses.grade']],
    ['Rulebook and pricing', 'list', ['rulebook.view', 'rulebook.edit', 'pricing.edit']],
    ['Content', 'file', ['content.edit']],
    ['Quality', 'shield', ['accuracy.manage', 'backtests.run']],
    ['People and records', 'user', ['users.view', 'contacts.export', 'funnel.view', 'audit.view']]
  ];
  var DESC = {}; C.PERMS.forEach(function(p){ DESC[p[0]] = p[1]; });
  /* What a set of ticks really allows: the ticks plus the reading each edit includes */
  function full(sel){ var out = sel.slice(); sel.forEach(function(k){ (C.IMPLIES[k] || []).forEach(function(v){ if(out.indexOf(v) < 0) out.push(v); }); }); return out; }
  function includedBy(sel, code){ return Object.keys(C.IMPLIES).filter(function(k){ return sel.indexOf(k) > -1 && C.IMPLIES[k].indexOf(code) > -1; })[0]; }
  function staffLbl(x){ return x.status === 'invited' ? '<span class="lb lb-info">Invited</span>' : x.status === 'disabled' ? '<span class="lb lb-bad">Disabled</span>' : C.lbl('published').replace('Published', 'Active'); }
  /* The areas someone can work in, for the staff table */
  function areaChips(perms){
    var held = full(C.migratePerms(perms)), on = AREAS.filter(function(a){ return a[2].some(function(c){ return held.indexOf(c) > -1; }); });
    return on.length ? '<span class="ax-areas">' + on.map(function(a){ return '<span class="c-chip">' + a[0].split(' ')[0] + '</span>'; }).join('') + '</span><small class="ax-cnt">' + held.length + ' of ' + C.PERMS.length + '</small>' : '<span class="muted">No access yet</span>';
  }
  function accessPanel(email, after){
    var list = staffList(), x = email ? list.filter(function(s){ return s.email === email; })[0] : null, invite = !email;
    if(email && !x) return;
    var start = x ? full(C.migratePerms(x.perms)) : [], sel = start.slice();
    var first = x ? (x.name ? x.name.split(' ')[0] : 'They') : '';
    var head = x ? '<div class="ax-who">' + C.av(x.name || x.email) + '<span><b>' + RI.esc(x.name || 'Not accepted yet') + '</b><small>' + RI.esc(x.email) + '</small></span>' + staffLbl(x) + '</div>' :
      '<div class="field"><label for="inv-em">Email</label><input class="input" id="inv-em" type="email" placeholder="name@example.com" autocomplete="off"><span class="err"></span><span class="help">The invite link works once, for 7 days. The email is fixed by the invite.</span></div>';
    var groups = AREAS.map(function(a, gi){
      return '<fieldset class="ax-g"><legend><span class="ax-gi">' + RI.icon(a[1], 'i-sm') + '</span><span class="ax-gt">' + a[0] + '</span><small class="ax-gn" data-gn="' + gi + '"></small></legend>' + a[2].map(function(code){
        return '<label class="ax-r" data-code="' + code + '"><input type="checkbox" value="' + code + '"><span class="ax-t"><b>' + SHORT[code] + '</b>' + (DESC[code].toLowerCase() !== SHORT[code].toLowerCase() ? '<small>' + DESC[code] + '</small>' : '') + '<span class="ax-meta"><code>' + code + '</code><em class="ax-inc"></em></span></span></label>';
      }).join('') + '</fieldset>';
    }).join('');
    var only = '<details class="ax-only"><summary>' + RI.icon('lock', 'i-sm') + 'Only Sam can do these</summary><ul>' + SAM_ONLY.map(function(t){ return '<li>' + t + '</li>'; }).join('') + '</ul></details>';
    var danger = !x ? '' : x.status !== 'disabled' ?
      '<section class="ax-danger"><div><b>Disable this staff account</b><small>They can no longer log in, and every session ends at once. Their grades and drafts stay.</small></div><button type="button" class="btn btn-secondary btn-sm ax-dis" id="ax-dis">Disable</button></section>' :
      '<section class="ax-danger"><div><b>This account is disabled</b><small>Turn it back on to let them log in with the permissions above.</small></div><button type="button" class="btn btn-secondary btn-sm" id="ax-en">Turn back on</button></section>';
    var d = C.dialog(invite ? 'Invite a staff member' : 'Manage access',
      '<div class="ax-scroll">' + head + '<p class="ax-lead">' + (invite ? 'A new staff member starts with no permissions. Tick what they need.' : 'Tick what ' + RI.esc(first === 'They' ? 'this person' : first) + ' needs.') + ' An edit permission includes reading the same area.</p>' + groups + only + danger + '</div>' +
      '<div class="ax-foot"><p class="ax-sum" id="ax-sum" aria-live="polite"></p><div class="ax-btns"><button type="button" class="btn btn-secondary" data-dlg-close>Cancel</button><button type="button" class="btn btn-primary" id="ax-save">' + (invite ? 'Send the invite' : 'Save changes') + '</button></div></div>');
    d.classList.add('dlg-drawer');
    var names = function(codes){ return codes.map(function(c){ return SHORT[c]; }).join(', '); };
    function diff(){ var now = full(sel); return {now:now, add:now.filter(function(c){ return start.indexOf(c) < 0; }), rem:start.filter(function(c){ return now.indexOf(c) < 0; })}; }
    function sync(){
      d.querySelectorAll('.ax-r').forEach(function(r){
        var c = r.getAttribute('data-code'), inp = r.querySelector('input'), by = includedBy(sel, c);
        inp.checked = sel.indexOf(c) > -1 || !!by; inp.disabled = !!by; r.classList.toggle('inc', !!by);
        r.querySelector('.ax-inc').textContent = by ? 'Included with ' + SHORT[by] : '';
      });
      var f = diff();
      AREAS.forEach(function(a, gi){ d.querySelector('[data-gn="' + gi + '"]').textContent = a[2].filter(function(c){ return f.now.indexOf(c) > -1; }).length + ' of ' + a[2].length; });
      var sum = d.querySelector('#ax-sum'), save = d.querySelector('#ax-save');
      if(invite){ sum.innerHTML = f.now.length ? '<b>' + f.now.length + ' of ' + C.PERMS.length + '</b> permissions' : 'No permissions yet. They can log in but see no screens.'; return; }
      if(!f.add.length && !f.rem.length){ sum.innerHTML = '<span class="muted">No changes yet</span>'; save.disabled = true; return; }
      save.disabled = false;
      sum.innerHTML = (f.add.length ? '<span class="ax-add">Gives: ' + names(f.add) + '</span>' : '') + (f.rem.length ? '<span class="ax-rem">Takes away: ' + names(f.rem) + '</span>' : '') +
        (x.status === 'active' ? '<span class="ax-warn">' + RI.icon('info', 'i-sm') + RI.esc(first) + ' is signed out of the console when you save.</span>' : '');
      RI.fillIcons(sum);
    }
    d.addEventListener('change', function(e){
      var inp = e.target.closest('.ax-r input'); if(!inp) return; var c = inp.value;
      sel = inp.checked ? sel.concat(c) : sel.filter(function(v){ return v !== c; }); sync();
    });
    d.querySelector('#ax-save').addEventListener('click', function(){
      var f = diff();
      if(invite){
        var em = d.querySelector('#inv-em'), v = em.value.trim().toLowerCase();
        if(!RI.form.emailOk(v)){ RI.form.setInvalid(em, 'Check the email address, for example name@example.com.'); em.focus(); return; }
        if(staffList().some(function(s){ return s.email === v; })){ RI.form.setInvalid(em, 'This person already has a staff invite or account.'); em.focus(); return; }
        var l = staffList(); l.push({email:v, name:'', status:'invited', perms:f.now, invitedAt:Date.now(), token:C.uid('t')}); C.set('staff', l);
        C.log('Staff invited', v + ', with ' + f.now.length + ' permissions', '', 'users');
        d.close();
        var s = C.dialog('Invite sent', '<p>We emailed an invite to <b>' + RI.esc(v) + '</b>. It works once, for 7 days.</p><div class="mail-sim"><div class="mh">' + RI.icon('mail','i-sm') + '<span><b>Demo inbox</b> · You are invited to the console</span></div><div class="mb"><p>Sam invited you as staff. Set a password to accept.</p><a class="btn btn-primary btn-sm" href="' + RI.url('invite/?t=demo-staff') + '">Accept the invite</a><p class="xsmall muted">Demo only: this opens the sample invite page.</p></div></div>');
        s.addEventListener('close', function(){ if(after) after(); else C.go('#/users?tab=staff'); });
        return;
      }
      x.perms = f.now; C.set('staff', list);
      C.log('Permissions changed', x.email + ': ' + [f.add.length ? 'gave ' + f.add.join(', ') : '', f.rem.length ? 'took away ' + f.rem.join(', ') : ''].filter(Boolean).join('; '), '', 'users');
      RI.toast('Access saved for ' + (x.name || x.email) + '.', 'check'); d.close(); if(after) after();
    });
    var dis = d.querySelector('#ax-dis');
    if(dis) dis.addEventListener('click', function(){
      C.confirm('Disable ' + RI.esc(x.name || x.email) + '?', 'They can no longer log in, and every session ends at once. Their grades and drafts stay. You can turn the account back on later.', 'Disable account', function(){
        x.status = 'disabled'; C.set('staff', list); C.log('Staff disabled', x.email, '', 'users'); RI.toast('Staff account disabled.'); d.close(); if(after) after();
      }, true);
    });
    var en = d.querySelector('#ax-en');
    if(en) en.addEventListener('click', function(){ x.status = 'active'; C.set('staff', list); C.log('Staff enabled', x.email, '', 'users'); RI.toast('Staff account turned back on.', 'check'); d.close(); if(after) after(); });
    sync();
    var focus = d.querySelector(invite ? '#inv-em' : '.ax-r input:not(:disabled)'); if(focus) setTimeout(function(){ focus.focus(); }, 30);
  }
  function inviteDialog(after){ accessPanel(null, after); }
  function permsDialog(email, after){ accessPanel(email, after); }

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
