/* Console: users and staff (APP_FLOW 7, SECURITY 3.2, BACKLOG M1-34, M4-22) and the audit log (SECURITY 15, M1-36, M4-28).
   Each person has one role (Roles tab). Sam and sub admins invite staff and give roles; only Sam changes roles and
   publishes. Contacts and feedback live in release.js. */
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
    if(list.some(function(x){ return !x.role || !C.role(x.role); })) giveRoles(list);
    return list;
  }
  /* Everyone gets a role (Nov 2026). The sample people get the starter roles; anyone else keeps exactly the access they
     had: the closest role, with the difference kept as their own additions and removals */
  function giveRoles(list){
    var roles = C.roles(), DEMO = {'dana@demo.ri':'sub', 'marcus@demo.ri':'price', 'staff@demo.ri':'rev'};
    list.forEach(function(x){
      if(x.role && C.role(x.role)) return;
      if(DEMO[x.email] && C.role(DEMO[x.email])){ x.role = DEMO[x.email]; x.add = []; x.remove = []; return; }
      var had = full(C.migratePerms(x.perms)), best = null, cost = 99;
      roles.forEach(function(r){ if(r.fixed || C.isAdminRole(r)) return; var c = had.filter(function(p){ return r.perms.indexOf(p) < 0; }).length + r.perms.filter(function(p){ return had.indexOf(p) < 0; }).length; if(c < cost){ cost = c; best = r; } });
      best = best || C.role('ro'); x.role = best.id;
      x.add = had.filter(function(p){ return best.perms.indexOf(p) < 0; }); x.remove = best.perms.filter(function(p){ return had.indexOf(p) < 0; });
    });
    C.set('staff', list);
  }
  /* A small tooltip for [data-hint] (DESIGN.md: white raised card, Warm Stone hairline, radius 8, the floating shadow,
     Charcoal text). Optional bold title in data-hint-title; lines that start with "+ " or "− " get the success and danger
     signs. data-hint-side="right" puts it beside the element when there is room, otherwise above (or below near the top).
     It goes inside the open dialog when there is one, since a modal dialog covers everything outside it. Screen readers
     get the same text from the element itself, so the tooltip is hidden from them. */
  (function(){
    var box = null, on = null, GAP = 10, EDGE = 8;
    function hide(){ if(box) box.remove(); box = null; on = null; }
    function build(el){
      var b = document.createElement('div'), t = el.getAttribute('data-hint-title');
      b.className = 'c-hint'; b.setAttribute('aria-hidden', 'true');
      if(t){ var h = document.createElement('b'); h.textContent = t; b.appendChild(h); }
      el.getAttribute('data-hint').split('\n').forEach(function(line){
        var p = document.createElement('p'), sign = line.slice(0, 2);
        if(sign === '+ ' || sign === '− '){ var i = document.createElement('i'); i.className = sign === '+ ' ? 'h-add' : 'h-rem'; i.textContent = sign.charAt(0); p.appendChild(i); line = line.slice(2); }
        p.appendChild(document.createTextNode(line)); b.appendChild(p);
      });
      return b;
    }
    function show(el){
      if(on === el) return; hide(); on = el; box = build(el);
      (el.closest('dialog') || document.body).appendChild(box);
      var r = el.getBoundingClientRect(), b = box.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight, top, left, side;
      if(el.getAttribute('data-hint-side') === 'right' && r.right + GAP + b.width <= W - EDGE){
        side = 'right'; left = r.right + GAP; top = Math.max(EDGE, Math.min(r.top + r.height / 2 - b.height / 2, H - b.height - EDGE));
        box.style.setProperty('--hy', Math.round(Math.max(14, Math.min(r.top + r.height / 2 - top, b.height - 14))) + 'px');
      } else {
        var wide = r.width > b.width, aim = wide ? r.left + 28 : r.left + r.width / 2;
        side = r.top - b.height - GAP >= EDGE ? 'top' : 'bottom';
        top = side === 'top' ? r.top - b.height - GAP : r.bottom + GAP;
        left = Math.max(EDGE, Math.min(wide ? r.left + 12 : aim - b.width / 2, W - b.width - EDGE));
        box.style.setProperty('--hx', Math.round(Math.max(14, Math.min(aim - left, b.width - 14))) + 'px');
      }
      box.classList.add('c-hint-' + side); box.style.top = Math.round(top) + 'px'; box.style.left = Math.round(left) + 'px';
    }
    function find(e){ return e.target && e.target.closest ? e.target.closest('[data-hint]') : null; }
    document.addEventListener('mouseover', function(e){ var el = find(e); if(el) show(el); else if(on && on !== document.activeElement && !on.contains(document.activeElement)) hide(); });
    document.addEventListener('focusin', function(e){ var el = find(e); if(el) show(el); else hide(); });
    document.addEventListener('focusout', function(e){ if(on && !on.contains(e.relatedTarget)) hide(); });
    document.addEventListener('scroll', hide, true);
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') hide(); });
    document.addEventListener('close', hide, true);
  })();
  function adjusted(x){ return (x.add || []).length + (x.remove || []).length; }

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
    var q = C.query(), tab = q.tab === 'trial' ? 'waitlist' : (q.tab || 'users'), m = C.me(), sam = C.can('staff'), isSam = !!(m && m.sam);
    /* The trial is for the contacts Sam invites before launch (PROJECT 3d, GLOSSARY) */
    var pre = RI.mode() === 'prelaunch', canInvite = isSam && pre; /* trial invites and disabling users stay Sam's (SECURITY 3.2) */
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
      actions:sam ? '<div class="us-head" id="us-head" aria-live="polite"></div><button type="button" class="btn btn-primary" id="inv-new">' + RI.icon('user','i-sm') + 'Invite staff</button>' : '',
      body:'<div class="us-top">' + '<div class="us-tabs" id="us-tab" role="tablist" aria-label="Sections">' + [['users', 'Users', U.length, 'user'], ['staff', 'Staff', staff.length + 1, 'key'], ['roles', 'Roles', C.roles().length, 'shield'], ['waitlist', 'Waitlist<span class="ut-long"> and trial</span>', W.length, 'mail']].map(function(t){
        return '<button type="button" role="tab" data-v="' + t[0] + '" aria-selected="' + (t[0] === tab) + '"><span class="ut-ic">' + RI.icon(t[3], 'i-sm') + '</span><span class="ut-t">' + t[1] + '</span><span class="ut-n">' + t[2] + '</span></button>';
      }).join('') + '</div>' + '<div id="us-tools" class="us-bar"></div></div><div id="us-body"></div>'});

    function count(list, fn, v){ return list.filter(function(x){ return fn(x) === v; }).length; }
    /* State filter as a dropdown beside the search: each option carries its count */
    function pick(id, label, opts, cur){
      return '<label class="c-select us-pick"><span class="sr">' + label + '</span><select id="' + id + '">' + opts.map(function(o){ return '<option value="' + o[0] + '"' + (o[0] === cur ? ' selected' : '') + '>' + o[1] + ' (' + o[2] + ')</option>'; }).join('') + '</select></label>';
    }
    function bodyUsers(el){
      var rows = U.filter(function(u){ return (st.uf === 'all' || userState(u) === st.uf) && (!st.uq || (u.name + ' ' + u.email).toLowerCase().indexOf(st.uq) > -1); });
      var tools = doc.getElementById('us-tools');
      tools.innerHTML = C.search('us-uq', 'Name or email', st.uq) +
        pick('us-uf', 'State', [['all','All states',U.length],['active','Active',count(U, userState, 'active')],['trial','On trial',count(U, userState, 'trial')],['unverified','Not verified',count(U, userState, 'unverified')],['disabled','Disabled',count(U, userState, 'disabled')]], st.uf);
      el.innerHTML =
        '<div class="c-mt">' + C.table({cls:'us-cards us-users', empty:'No account matches. Try another name, or show all.', cols:[{label:'Person'},{label:'Account type'},{label:'State'},{label:'Houses', num:true},{label:'Updates'},{label:'Joined', num:true},{label:''}],
          rows:rows.map(function(u){
            var act = '';
            if(isSam && !u.demo) act = u.disabled ? '<button type="button" class="us-act" data-en="' + RI.esc(u.email) + '" aria-label="Enable ' + RI.esc(u.email) + '">' + RI.icon('key','i-sm') + 'Enable</button>' : '<button type="button" class="us-act us-act-danger" data-dis="' + RI.esc(u.email) + '" aria-label="Disable ' + RI.esc(u.email) + '">' + RI.icon('lock','i-sm') + 'Disable</button>';
            return {attr:u.disabled ? 'class="us-off"' : '', cells:['<span class="c-person">' + C.av(u.name) + '<span><span class="us-name"><b>' + RI.esc(u.name) + '</b>' + (u.demo ? DEMO_TAG : '') + '</span><small>' + RI.esc(u.email) + '</small><span class="us-pst">' + stateLbl(u) + '</span>' + meta([RI.esc(u.type), u.houses + (u.houses === 1 ? ' house' : ' houses'), 'Joined ' + C.date(u.at)]) + '</span></span>',
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
      tools.innerHTML = C.search('us-wq', 'Search email', st.wq) +
        pick('us-wf', 'Status', [['all','All statuses',W.length],['waiting','Waiting',count(W, function(w){ return w.status; }, 'waiting')],['invited','Invited',count(W, function(w){ return w.status; }, 'invited')],['trial','On trial',count(W, function(w){ return w.status; }, 'trial')]], st.wf);
      el.innerHTML =
        '<div class="c-mt">' + C.table({cls:'us-wl us-cards' + (canInvite ? ' us-has-ck' : ''), empty:'Nobody matches. Try another email, or show all.', cols:cols,
          rows:rows.map(function(w){
            var act = !canInvite ? '' : w.status === 'waiting' ? '<button type="button" class="us-act" data-trial="' + RI.esc(w.email) + '" aria-label="Invite ' + RI.esc(w.email) + ' to the trial">' + RI.icon('mail','i-sm') + 'Invite</button>' : w.status === 'invited' ? '<button type="button" class="us-act" data-trial="' + RI.esc(w.email) + '" data-again="1" title="Last sent ' + C.date(w.invitedAt) + '" aria-label="Resend the trial invite to ' + RI.esc(w.email) + '">' + RI.icon('refresh','i-sm') + 'Resend</button>' : '';
            var ck = canInvite ? [w.status === 'waiting' ? '<input type="checkbox" class="us-ck" data-pick="' + RI.esc(w.email) + '" aria-label="Select ' + RI.esc(w.email) + '"' + (st.pick.indexOf(w.email) > -1 ? ' checked' : '') + '>' : ''] : [];
            return {attr:st.pick.indexOf(w.email) > -1 ? 'class="us-picked"' : '', cells:ck.concat(['<b>' + RI.esc(w.email) + '</b><span class="us-pst">' + wlStatus(w) + '</span>' + meta([w.type ? cap(w.type) : '', w.source === 'home' ? 'Home page' : 'Waitlist page', 'Joined ' + C.date(w.at)]), w.type ? C.chip(cap(w.type)) : '<span class="muted">Not given</span>', w.source === 'home' ? 'Home page' : 'Waitlist page', C.date(w.at), wlStatus(w), act])};
          })}) + '</div>' +
        '<div class="c-mt">' + C.note(!pre ? 'Trial invites are for the contacts Sam invites before launch. Export the list from Contacts and feedback.' : isSam ? 'A trial invite emails a link to sign up for a 15-day trial. Export the list from Contacts and feedback.' : 'Only Sam invites contacts to the trial. Export the list from Contacts and feedback.') + '</div>';
      var ah = el.querySelector('#us-all'); if(ah) ah.indeterminate = st.pick.length > 0 && !all;
      /* Desktop: the bulk action sits right above the row Invite buttons, same width and place */
      var th = el.querySelector('.us-wl thead th:last-child');
      if(th && canInvite && st.pick.length){
        th.innerHTML = '<button type="button" class="us-th-go" id="us-th-bulk" aria-label="Invite the ' + st.pick.length + ' selected contacts to the trial">' + RI.icon('mail','i-sm') + 'Invite ' + st.pick.length + '</button>';
        th.querySelector('#us-th-bulk').addEventListener('click', function(){ trialDialog(st.pick.slice()); });
      }
      RI.fillIcons(el);
      RI.fillIcons(tools);
      tools.querySelector('#us-wq').addEventListener('input', function(){ st.wq = this.value.trim().toLowerCase(); var p = this.selectionStart; bodyWaitlist(el); var n = doc.getElementById('us-wq'); n.focus(); n.setSelectionRange(p, p); });
      tools.querySelector('#us-wf').addEventListener('change', function(){ st.wf = this.value; bodyWaitlist(el); doc.getElementById('us-wf').focus(); });
      el.addEventListener('change', function onCk(e){
        var t = e.target; if(!t.classList.contains('us-ck')) return; el.removeEventListener('change', onCk);
        if(t.id === 'us-all') st.pick = st.pick.length ? [] : waiting.map(function(w){ return w.email; });
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

    function bodyStaff(el){
      var rows = [{cells:['<span class="c-person">' + C.av('Sam', 'sam') + '<span><b>Sam</b><small>admin@demo.ri</small><span class="us-pst">' + C.lbl('published').replace('Published', 'Active') + '</span>' + meta(['Super admin', 'Everything', 'Created on the server']) + '</span></span>', '<span class="c-chip sam">Super admin</span>', C.lbl('published').replace('Published', 'Active'), '<span class="ax-areas"><span class="c-chip sam">Everything</span></span>', '<span class="muted">Created on the server</span>', '']}];
      staff.forEach(function(x){
        var rl = C.role(x.role), rn = rl ? rl.name : 'No role yet', can = canManage(x);
        rows.push({attr:can ? 'data-staff="' + RI.esc(x.email) + '"' : '', cells:['<span class="c-person">' + C.av(x.name || x.email) + '<span><b>' + RI.esc(x.name || 'Not accepted yet') + '</b><small>' + RI.esc(x.email) + '</small><span class="us-pst">' + staffLbl(x) + '</span>' + meta([RI.esc(rn) + cusBadge(x), x.status === 'invited' ? 'Invited ' + C.ago(x.invitedAt) : 'Joined ' + C.ago(x.joinedAt || x.invitedAt)]) + '</span></span>', '<span class="rl-cell"><span class="c-chip' + (C.isAdminRole(rl) ? ' sam' : '') + ' rl-chip">' + RI.esc(rn) + '</span>' + cusBadge(x) + '</span>',
          staffLbl(x),
          areaChips(C.effPerms(x)), x.status === 'invited' ? 'Invited ' + C.ago(x.invitedAt) + ' · link works 7 days' : 'Joined ' + C.ago(x.joinedAt || x.invitedAt),
          can ? '<button type="button" class="us-act" data-staff="' + RI.esc(x.email) + '" aria-label="Change the role of ' + RI.esc(x.name || x.email) + '">' + RI.icon('key','i-sm') + 'Change<span class="us-long"> role</span></button>' : '']});
      });
      el.innerHTML = C.table({cls:'us-cards us-staff', cols:[{label:'Person'},{label:'Role'},{label:'State'},{label:'Can work in'},{label:'Since'},{label:'', cls:'us-actc'}], rows:rows}) +
        '<div class="c-mt">' + C.note('Each person has one role; what a role can do is set in Roles. Sam and sub admins invite staff and give roles. Only Sam changes roles and publishes.') + '</div>';
      RI.fillIcons(el);
    }

    /* Who may change a person's role: Sam anyone; a sub admin only people without an admin role, and never themselves */
    function canManage(x){ if(isSam) return true; return sam && !C.isAdminRole(C.role(x.role)) && !C.isAdminPerson(x) && x.email !== (m && m.email); }
    /* ---------- Roles (Sam's meeting, Nov 2026) ----------
       One card per role: what it is for, what it can do, who has it. Only Sam creates and changes roles. */
    function bodyRoles(el){
      var roles = C.roles(), people = staffList();
      var who = function(r){ return r.id === 'super' ? [{name:'Sam'}] : people.filter(function(x){ return x.role === r.id; }); };
      el.innerHTML = '<div class="rl-top"><p>A role is a name and what it can do. Each person has one role; change a role and everyone with it changes at once.' + (isSam ? '' : ' Only Sam creates and changes roles.') + '</p>' +
          (isSam ? '<button type="button" class="btn btn-primary btn-sm" id="rl-new">' + RI.icon('plus', 'i-sm') + 'Create a role</button>' : '') + '</div>' +
        '<div class="rl-grid">' + roles.map(function(r){
          var adm = C.ADMIN_CAPS.filter(function(a){ return r.perms.indexOf(a[0]) > -1; }), caps = r.perms.filter(function(p){ return C.SUPER.indexOf(p) < 0; }), ppl = who(r);
          return '<article class="rl-c' + (r.fixed ? ' fixed' : '') + '"><div class="rl-h"><div><h3>' + RI.esc(r.name) + '</h3><p>' + RI.esc(r.about || '') + '</p></div>' +
              (r.fixed ? '<span class="rl-tag lock">' + RI.icon('lock', 'i-sm') + 'Fixed</span>' : r.built ? '<span class="rl-tag bi">Built in</span>' : '') + '</div>' +
            '<div class="rl-caps">' + adm.map(function(a){ return '<span class="adm">' + a[1] + '</span>'; }).join('') + (caps.length === C.PERMS.length ? '<span>Everything staff can do</span>' : caps.map(function(p){ return '<span>' + SHORT[p] + '</span>'; }).join('')) + '</div>' +
            '<span class="rl-n">' + (caps.length + adm.length) + ' of ' + (C.PERMS.length + C.ADMIN_CAPS.length) + ' capabilities</span>' +
            '<div class="rl-ft"><span class="rl-who">' + (ppl.length ? ppl.slice(0, 4).map(function(x){ return C.av(x.name || x.email); }).join('') + ppl.length + (ppl.length === 1 ? ' person' : ' people') : 'Nobody yet') + '</span>' +
              (isSam && !r.fixed ? '<button type="button" class="us-act" data-role-edit="' + r.id + '" aria-label="Edit the ' + RI.esc(r.name) + ' role">' + RI.icon('pencil', 'i-sm') + 'Edit role</button>' : '') + '</div></article>';
        }).join('') + '</div>' +
        '<div class="rl-safe"><b>' + RI.icon('shield', 'i-sm') + 'Safety rules</b><ul><li>There is always a super admin. Sam cannot be removed or given a lower role.</li><li>A sub admin invites staff and gives them a role, but cannot give an admin role, change another admin, or change their own role.</li><li>Publishing stays with Sam unless he gives it to a role on purpose.</li><li>Every role change is written to the audit log.</li></ul></div>';
      RI.fillIcons(el);
    }
    function rolesChanged(){ staff = staffList(); var n = view.querySelector('#us-tab [data-v="roles"] .ut-n'); if(n) n.textContent = C.roles().length; body(); }

    /* Beside Invite staff: the waitlist selection. While contacts are ticked, inviting them is the main action,
       so Invite staff steps down to a secondary button */
    function headActs(){
      var slot = doc.getElementById('us-head'), staffBtn = doc.getElementById('inv-new'); if(!slot) return;
      var on = tab === 'waitlist' && canInvite, n = on ? st.pick.length : 0;
      /* One control for the selection: the count, clear, and the action, joined; a divider keeps it apart from Invite staff */
      slot.innerHTML = !on ? '' : n ? '<div class="us-selgrp" role="group" aria-label="' + n + ' contacts selected"><span class="us-sg-n"><b>' + n + '</b>selected</span>' +
        '<button type="button" class="us-sg-x" id="us-clear" aria-label="Clear the selection" title="Clear the selection">' + RI.icon('x','i-sm') + '</button>' +
        '<button type="button" class="us-sg-go" id="us-bulk">' + RI.icon('mail','i-sm') + 'Invite to the trial</button></div>' : '';
      RI.fillIcons(slot);
      var cl = slot.querySelector('#us-clear'); if(cl) cl.addEventListener('click', function(){ st.pick = []; bodyWaitlist(doc.getElementById('us-body')); });
      var bk = slot.querySelector('#us-bulk'); if(bk) bk.addEventListener('click', function(){ trialDialog(st.pick.slice()); });
    }
    function body(){
      var el = doc.getElementById('us-body');
      var pg = view.querySelector('.c-page'); if(pg) pg.setAttribute('data-tab', tab);
      doc.getElementById('us-tools').innerHTML = '';
      if(tab !== 'waitlist') st.pick = [];
      if(tab === 'users') bodyUsers(el);
      if(tab === 'staff') bodyStaff(el);
      if(tab === 'roles') bodyRoles(el);
      if(tab === 'waitlist') bodyWaitlist(el);
      headActs();
    }
    view.querySelector('#us-tab').addEventListener('click', function(e){ var b = e.target.closest('[data-v]'); if(!b) return; tab = b.getAttribute('data-v'); view.querySelectorAll('#us-tab [data-v]').forEach(function(x){ x.setAttribute('aria-selected', x === b); }); history.replaceState(null, '', '#/users?tab=' + tab); body(); });
    view.addEventListener('click', function(e){
      if(e.target.closest('.rl-cus')) return;
      var s = e.target.closest('[data-staff]'); if(s){ permsDialog(s.getAttribute('data-staff'), function(){ staff = staffList(); body(); }); return; }
      var re = e.target.closest('[data-role-edit]'); if(re){ roleDialog(C.role(re.getAttribute('data-role-edit')), rolesChanged); return; }
      if(e.target.closest('#rl-new')){ roleDialog(null, rolesChanged); return; }
      var tr = e.target.closest('[data-trial]'); if(tr){ trialDialog([tr.getAttribute('data-trial')], tr.hasAttribute('data-again')); return; }
      var d = e.target.closest('[data-dis]'), en = e.target.closest('[data-en]');
      if(d || en){
        var em = (d || en).getAttribute(d ? 'data-dis' : 'data-en'), off = !!d;
        var apply = function(){ var u = RI.users.get(em); if(u){ u.disabled = off; RI.users.put(u); } else { flags[em] = off; C.set('userFlags', flags); } C.log(off ? 'Account disabled' : 'Account enabled', em, '', 'users'); RI.toast(off ? 'Account disabled.' : 'Account enabled.'); U = users(); body(); };
        if(off) C.confirm('Disable this account?', RI.esc(em) + ' can no longer log in, and every session ends at once. Their houses stay.', 'Disable account', apply, true); else apply();
      }
    });
    view.addEventListener('keydown', function(e){ var s = !e.target.closest('.rl-cus') && e.target.closest('[data-staff]'); if(s && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); permsDialog(s.getAttribute('data-staff'), function(){ staff = staffList(); body(); }); } });
    var nb = view.querySelector('#inv-new'); if(nb) nb.addEventListener('click', function(){ inviteDialog(); });
    body();
  }, {nav:'users', perm:'users.view'});

  /* ---------- Staff access: one place to change it (SECURITY 3.2, 3.3; BACKLOG M1-34, M4-22) ----------
     A side panel, opened from the Manage access button or Invite staff. Permissions are grouped by area; ticking an edit
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
  /* What a role can do, as one short line */
  function capsLine(r){
    var adm = C.ADMIN_CAPS.filter(function(a){ return r.perms.indexOf(a[0]) > -1; }).map(function(a){ return a[1]; }), caps = r.perms.filter(function(p){ return C.SUPER.indexOf(p) < 0; });
    return adm.concat(caps.length === C.PERMS.length ? ['everything staff can do'] : caps.map(function(p){ return SHORT[p]; })).join(', ').replace(/^./, function(c){ return c.toUpperCase(); });
  }
  /* Invite someone, or change a person's role: pick one role. Sam may give any role but Super admin; a sub admin only
     roles without admin powers. A new person starts as Read only, the least access. */
  var capName = function(c){ var ad = C.ADMIN_CAPS.filter(function(x){ return x[0] === c; })[0]; return ad ? ad[1] : SHORT[c]; };
  /* Customized: a small badge; hover or focus lists what was added and taken away for this person only */
  function cusBadge(x){
    if(!adjusted(x)) return '';
    var who = x.name ? x.name.split(' ')[0] : 'this person', title = 'Customized for ' + who, lines = (x.add || []).map(function(c){ return '+ ' + capName(c); }).concat((x.remove || []).map(function(c){ return '− ' + capName(c); }));
    return '<span class="rl-cus" tabindex="0" role="img" data-hint-title="' + RI.esc(title) + '" data-hint="' + RI.esc(lines.join('\n')) + '" aria-label="' + RI.esc(title + ': ' + adjText(x)) + '">' + RI.icon('sliders', 'i-sm') + '</span>';
  }
  function adjText(x){ return [(x.add || []).length ? '+' + (x.add || []).map(capName).join(', +') : '', (x.remove || []).length ? '−' + (x.remove || []).map(capName).join(', −') : ''].filter(Boolean).join('; '); }
  /* Invite someone, or change a person's role: pick one role, then, if needed, adjust it for this person only (add or
     take away single capabilities) without changing the role. Their additions and removals are kept apart, so a later
     change to the role still reaches them. Sam may give any role but Super admin; a sub admin only roles without admin
     powers, and only capabilities they have themselves. A new person starts as Read only, the least access. */
  function accessPanel(email, after){
    var me = C.me() || {}, list = staffList(), x = email ? list.filter(function(s){ return s.email === email; })[0] : null, invite = !email;
    if(email && !x) return;
    var first = x && x.name ? x.name.split(' ')[0] : 'this person', First = first.charAt(0).toUpperCase() + first.slice(1);
    var pickable = C.roles().filter(function(r){ return !r.fixed && (me.sam || !C.isAdminRole(r)); });
    var cur = x ? x.role : 'ro', add = x ? (x.add || []).slice() : [], rem = x ? (x.remove || []).slice() : [];
    var start = x ? {role:x.role, add:add.slice().sort().join(), rem:rem.slice().sort().join()} : null;
    var mine = me.sam ? null : C.me().perms;
    var head = x ? '<div class="ax-who">' + C.av(x.name || x.email) + '<span><b>' + RI.esc(x.name || 'Not accepted yet') + '</b><small>' + RI.esc(x.email) + '</small></span>' + staffLbl(x) + '</div>' :
      '<div class="field"><label for="inv-em">Email</label><input class="input" id="inv-em" type="email" placeholder="name@example.com" autocomplete="off"><span class="err"></span><span class="help">The invite link works once, for 7 days. The email is fixed by the invite.</span></div>';
    var cards = '<div class="ax-rbar"><span class="rp-l" aria-hidden="true">' + (invite ? 'Their role' : 'Role') + '</span><button type="button" class="btn btn-secondary btn-sm ax-cust" id="ax-cust" aria-expanded="false" aria-controls="ax-pane">' + RI.icon('sliders', 'i-sm') + '<span id="ax-cust-t">Customize</span><em class="ax-cn" id="ax-cn"></em></button></div>' +
      '<fieldset class="rp"><legend class="sr">' + (invite ? 'Their role' : 'Role') + '</legend>' + pickable.map(function(r){
      return '<label class="rp-c"' + (r.about ? ' data-hint-side="right" data-hint-title="' + RI.esc(r.name) + '" data-hint="' + RI.esc(r.about) + '"' : '') + '><input type="radio" name="rp" value="' + r.id + '"' + (r.id === cur ? ' checked' : '') + '><span class="rp-t"><b>' + RI.esc(r.name) + (C.isAdminRole(r) ? ' <span class="rp-adm">Admin</span>' : '') + '</b>' + (r.about ? '<span class="sr">' + RI.esc(r.about) + '</span>' : '') + '<em>' + capsLine(r) + '</em></span></label>';
    }).join('') + '</fieldset>';
    var codes = AREAS.concat(me.sam ? [['Admin', 'key', ['staff', 'publish']]] : []);
    var named = !!(x && x.name), capDesc = function(c){ var ad = C.ADMIN_CAPS.filter(function(a){ return a[0] === c; })[0]; return ad ? ad[2] : DESC[c]; };
    var pane = '<section class="ax-pane" id="ax-pane" aria-labelledby="ax-pane-t" hidden><div class="ax-ph"><button type="button" class="linkbtn ax-back" id="ax-back">' + RI.icon('chev', 'i-sm') + 'Back to roles</button>' +
      '<div class="ax-pth"><b id="ax-pane-t">' + (named ? 'Permissions for ' + RI.esc(first) : 'Their permissions') + '</b><small>Starts from <b id="ax-from"></b>. Changes here are for ' + (named ? RI.esc(first) : 'this person') + ' only.</small></div>' +
      '<div class="ax-pt"><em class="ax-cn" id="ax-adj-n"></em><button type="button" class="linkbtn small" id="ax-reset">Match the role again</button></div></div>' +
      '<div class="ax-cols">' + codes.map(function(a){
        return '<fieldset class="ax-g"><legend><span class="ax-gi">' + RI.icon(a[1], 'i-sm') + '</span><span class="ax-gt">' + a[0] + '</span><small class="ax-gn"></small></legend>' + a[2].map(function(code){
          return '<label class="ax-r" data-code="' + code + '"><input type="checkbox" value="' + code + '"><span class="ax-t"><span class="ax-nm"><b>' + capName(code) + '</b><em class="ax-src"></em></span><small>' + RI.esc(capDesc(code) || '') + '</small></span></label>';
        }).join('') + '</fieldset>';
      }).join('') + '</div></section>';
    var danger = !x ? '' : x.status !== 'disabled' ?
      '<section class="ax-danger"><div><b>Disable this staff account</b><small>They can no longer log in, and every session ends at once. Their grades and drafts stay.</small></div><button type="button" class="btn btn-secondary btn-sm ax-dis" id="ax-dis">Disable</button></section>' :
      '<section class="ax-danger"><div><b>This account is disabled</b><small>Turn it back on to let them log in with their role.</small></div><button type="button" class="btn btn-secondary btn-sm" id="ax-en">Turn back on</button></section>';
    var d = C.dialog(invite ? 'Invite someone' : 'Change role',
      '<div class="ax-split"><div class="ax-scroll">' + head + '<p class="ax-lead">' + (invite ? 'Pick their role. They see only the screens it allows.' : 'Pick the role for ' + RI.esc(first) + '.') + ' What each role can do is set in Roles' + (me.sam ? '' : ', by Sam') + '.</p>' + cards + danger + '</div>' + pane + '</div>' +
      '<div class="ax-foot"><p class="ax-sum" id="ax-sum" aria-live="polite"></p><div class="ax-btns"><button type="button" class="btn btn-secondary" data-dlg-close>Cancel</button><button type="button" class="btn btn-primary" id="ax-save">' + (invite ? 'Send the invite' : 'Save') + '</button></div></div>');
    d.classList.add('dlg-drawer');
    function base(){ var r = C.role(cur); return r ? full(r.perms) : []; }
    function eff(){ var b = base(); return full(b.concat(add.filter(function(p){ return b.indexOf(p) < 0; })).filter(function(p){ return rem.indexOf(p) < 0; })); }
    function sync(){
      var b = base(), e = eff(), r = C.role(cur);
      d.querySelectorAll('.rp-c').forEach(function(l){ l.classList.toggle('on', l.querySelector('input').checked); });
      d.querySelectorAll('.ax-pane .ax-r').forEach(function(row){
        var c = row.getAttribute('data-code'), inp = row.querySelector('input'), inRole = b.indexOf(c) > -1, on = e.indexOf(c) > -1, by = includedBy(e, c);
        var locked = (!!by && on) || (mine && mine.indexOf(c) < 0 && !inRole);
        inp.checked = on; inp.disabled = locked;
        row.classList.toggle('add', on && !inRole); row.classList.toggle('rem', !on && inRole); row.classList.toggle('inc', !!by && on);
        row.querySelector('.ax-src').textContent = by && on && !inRole ? 'Included with ' + capName(by) : on && !inRole ? 'Added for ' + first : !on && inRole ? 'Taken away for ' + first : inRole ? 'From the role' : (mine && mine.indexOf(c) < 0 ? 'You do not have this yourself' : '');
      });
      d.querySelectorAll('.ax-pane .ax-g').forEach(function(g){ g.querySelector('.ax-gn').textContent = g.querySelectorAll('.ax-r input:checked').length + ' of ' + g.querySelectorAll('.ax-r').length; });
      var n = add.length + rem.length, nt = n ? n + ' change' + (n === 1 ? '' : 's') : '';
      d.querySelector('#ax-adj-n').textContent = nt; d.querySelector('#ax-cn').textContent = nt;
      d.querySelector('#ax-from').textContent = r ? r.name : '';
      d.querySelector('#ax-reset').hidden = !n;
      var sum = d.querySelector('#ax-sum'), save = d.querySelector('#ax-save'), extra = (add.length ? 'adds ' + add.map(capName).join(', ') : '') + (add.length && rem.length ? '; ' : '') + (rem.length ? 'takes away ' + rem.map(capName).join(', ') : '');
      if(invite){ sum.innerHTML = '<span>' + (r ? 'Invites them as <b>' + RI.esc(r.name) + '</b>' + (extra ? ', and ' + RI.esc(extra) + ' for them only' : '') : 'Pick a role') + '</span>'; save.disabled = !r; return; }
      var same = cur === start.role && add.slice().sort().join() === start.add && rem.slice().sort().join() === start.rem;
      if(same){ sum.innerHTML = '<span class="muted">No changes yet</span>'; save.disabled = true; return; }
      save.disabled = false;
      sum.innerHTML = (cur !== start.role ? '<span class="ax-add">Changes the role: ' + RI.esc((C.role(start.role) || {name:'No role'}).name) + ' to ' + RI.esc(r.name) + '</span>' : '') +
        (extra ? '<span class="ax-add">For ' + RI.esc(first) + ' only: ' + RI.esc(extra) + '</span>' : (cur === start.role ? '<span class="ax-add">Matches the role again</span>' : '')) +
        (x.status === 'active' ? '<span class="ax-warn">' + RI.icon('info', 'i-sm') + RI.esc(First) + ' is signed out of the console when you save.</span>' : '');
      RI.fillIcons(sum);
    }
    d.addEventListener('change', function(e){
      var ri = e.target.closest('.rp-c input');
      if(ri){ cur = ri.value; var b = base(); add = add.filter(function(p){ return b.indexOf(p) < 0; }); rem = rem.filter(function(p){ return b.indexOf(p) > -1; }); sync(); return; }
      var ci = e.target.closest('.ax-pane .ax-r input'); if(!ci) return;
      var c = ci.value, inRole = base().indexOf(c) > -1;
      if(ci.checked){ rem = rem.filter(function(p){ return p !== c; }); if(!inRole && add.indexOf(c) < 0) add.push(c); }
      else { add = add.filter(function(p){ return p !== c; }); if(inRole && rem.indexOf(c) < 0) rem.push(c); }
      sync();
    });
    var cust = d.querySelector('#ax-cust'), paneEl = d.querySelector('#ax-pane'), narrow = window.matchMedia('(max-width:767px)');
    d.querySelector('#ax-reset').addEventListener('click', function(){ add = []; rem = []; sync(); (narrow.matches ? d.querySelector('#ax-back') : cust).focus(); });
    function showPane(on){
      d.classList.toggle('ax-open', on); paneEl.hidden = !on;
      cust.setAttribute('aria-expanded', String(on)); d.querySelector('#ax-cust-t').textContent = on ? 'Hide' : 'Customize';
      if(narrow.matches) (on ? d.querySelector('#ax-back') : cust).focus();
    }
    cust.addEventListener('click', function(){ showPane(!d.classList.contains('ax-open')); });
    d.querySelector('#ax-back').addEventListener('click', function(){ showPane(false); });
    d.querySelector('#ax-save').addEventListener('click', function(){
      var r = C.role(cur); if(!r) return;
      var rec = {role:r.id, add:add.slice(), remove:rem.slice()}, perms = C.effPerms(rec).filter(function(p){ return C.SUPER.indexOf(p) < 0; });
      var extra = adjText(rec);
      if(invite){
        var em = d.querySelector('#inv-em'), v = em.value.trim().toLowerCase();
        if(!RI.form.emailOk(v)){ RI.form.setInvalid(em, 'Check the email address, for example name@example.com.'); em.focus(); return; }
        if(staffList().some(function(s){ return s.email === v; }) || v === 'admin@demo.ri'){ RI.form.setInvalid(em, 'This person already has a staff invite or account.'); em.focus(); return; }
        var l = staffList(); l.push({email:v, name:'', status:'invited', role:r.id, add:rec.add, remove:rec.remove, perms:perms, invitedAt:Date.now(), token:C.uid('t'), by:me.name || 'Sam'}); C.set('staff', l);
        C.log('Staff invited', v + ', as ' + r.name + (extra ? ' (' + extra + ')' : ''), '', 'users');
        d.close();
        var s = C.dialog('Invite sent', '<p>We emailed an invite to <b>' + RI.esc(v) + '</b>, as <b>' + RI.esc(r.name) + '</b>' + (extra ? ' with changes for them only' : '') + '. It works once, for 7 days.</p><div class="mail-sim"><div class="mh">' + RI.icon('mail','i-sm') + '<span><b>Demo inbox</b> · You are invited to the console</span></div><div class="mb"><p>' + RI.esc(me.name || 'Sam') + ' invited you as ' + RI.esc(r.name) + '. Set a password to accept.</p><a class="btn btn-primary btn-sm" href="' + RI.url('invite/?t=demo-staff') + '">Accept the invite</a><p class="xsmall muted">Demo only: this opens the sample invite page.</p></div></div>');
        s.addEventListener('close', function(){ if(after) after(); else C.go('#/users?tab=staff'); });
        return;
      }
      var was = (C.role(start.role) || {name:'No role'}).name;
      x.role = r.id; x.add = rec.add; x.remove = rec.remove; x.perms = perms; C.set('staff', list);
      if(r.id !== start.role) C.log('Role given', x.email + ': ' + was + ' to ' + r.name + (extra ? ' (' + extra + ')' : ''), '', 'users');
      else C.log('Access adjusted', x.email + ': ' + r.name + (extra ? ', ' + extra : ', matches the role again'), '', 'users');
      RI.toast((x.name || x.email) + ' is now ' + r.name + (extra ? ', with changes of their own.' : '.'), 'check'); d.close(); if(after) after();
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
    /* Editing someone: opens with the permission list showing, so changes of their own are seen at once (user, Nov 2026).
       Inviting: opens with the email and the role only; Customize opens the list (user, Nov 2026). On a phone the
       roles come first; the button shows how many changes they have. */
    if(!narrow.matches && !invite){ d.style.transition = 'none'; showPane(true); void d.offsetWidth; d.style.transition = ''; }
    var focus = d.querySelector(invite ? '#inv-em' : '.rp-c input:checked'); if(focus) setTimeout(function(){ focus.focus(); }, 30);
  }
  /* Create or edit a role (Sam only): its name, what it is for, and what it can do, grouped by area like before. An
     edit permission includes reading the same area. Saving changes everyone with the role at once. */
  function roleDialog(role, after){
    var me = C.me() || {}; if(!me.sam || (role && role.fixed)) return;
    var isNew = !role, roles = C.roles(), sel = role ? role.perms.slice() : [];
    var people = staffList().filter(function(x){ return role && x.role === role.id; });
    var groups = AREAS.concat([['Admin', 'key', C.ADMIN_CAPS.map(function(a){ return a[0]; })]]).map(function(a, gi){
      return '<fieldset class="ax-g"><legend><span class="ax-gi">' + RI.icon(a[1], 'i-sm') + '</span><span class="ax-gt">' + a[0] + '</span><small class="ax-gn" data-gn="' + gi + '"></small></legend>' + a[2].map(function(code){
        var ad = C.ADMIN_CAPS.filter(function(x){ return x[0] === code; })[0];
        return '<label class="ax-r" data-code="' + code + '"><input type="checkbox" value="' + code + '"><span class="ax-t"><b>' + (ad ? ad[1] : SHORT[code]) + '</b><small>' + (ad ? ad[2] : DESC[code]) + '</small><span class="ax-meta"><em class="ax-inc"></em></span></span></label>';
      }).join('') + '</fieldset>';
    }).join('');
    var d = C.dialog(isNew ? 'Create a role' : 'Edit role: ' + RI.esc(role.name),
      '<div class="ax-scroll"><div class="rl-f"><div class="field"><label for="rl-name">Role name</label><input class="input" id="rl-name" value="' + RI.esc(role ? role.name : '') + '" placeholder="For example: Pricing editor" autocomplete="off"><span class="err"></span></div>' +
        '<div class="field"><label for="rl-about">What it is for</label><input class="input" id="rl-about" value="' + RI.esc(role ? role.about || '' : '') + '" placeholder="One line: what someone with this role does" autocomplete="off"></div></div>' +
        '<p class="ax-lead">What it can do. An edit permission includes reading the same area.</p>' + groups +
        (!isNew ? '<p class="rl-who-n">' + RI.icon('user', 'i-sm') + (people.length ? people.length + (people.length === 1 ? ' person has' : ' people have') + ' this role (' + people.map(function(x){ return RI.esc(x.name || x.email) + (adjusted(x) ? ', with changes of their own' : ''); }).join('; ') + '). Saving changes what they can do right away; changes of their own stay.' : 'Nobody has this role yet.') + '</p>' : '') +
        (!isNew && !role.built && !people.length ? '<section class="ax-danger"><div><b>Delete this role</b><small>Nobody has it, so nothing else changes.</small></div><button type="button" class="btn btn-secondary btn-sm" id="rl-del">Delete</button></section>' : '') + '</div>' +
      '<div class="ax-foot"><p class="ax-sum" id="ax-sum" aria-live="polite"></p><div class="ax-btns"><button type="button" class="btn btn-secondary" data-dlg-close>Cancel</button><button type="button" class="btn btn-primary" id="ax-save">' + (isNew ? 'Create the role' : 'Save the role') + '</button></div></div>');
    d.classList.add('dlg-drawer');
    var label = function(c){ var ad = C.ADMIN_CAPS.filter(function(x){ return x[0] === c; })[0]; return ad ? ad[1] : SHORT[c]; };
    function now(){ return full(sel); }
    function sync(){
      d.querySelectorAll('.ax-r').forEach(function(r){
        var c = r.getAttribute('data-code'), inp = r.querySelector('input'), by = includedBy(sel, c);
        inp.checked = sel.indexOf(c) > -1 || !!by; inp.disabled = !!by; r.classList.toggle('inc', !!by);
        r.querySelector('.ax-inc').textContent = by ? 'Included with ' + SHORT[by] : '';
      });
      var f = now(), sum = d.querySelector('#ax-sum');
      AREAS.concat([['Admin', '', ['staff', 'publish']]]).forEach(function(a, gi){ d.querySelector('[data-gn="' + gi + '"]').textContent = a[2].filter(function(c){ return f.indexOf(c) > -1; }).length + ' of ' + a[2].length; });
      if(isNew){ sum.innerHTML = '<b>' + f.length + ' of ' + (C.PERMS.length + 2) + '</b> capabilities'; return; }
      var add = f.filter(function(c){ return role.perms.indexOf(c) < 0; }), rem = role.perms.filter(function(c){ return f.indexOf(c) < 0; });
      sum.innerHTML = !add.length && !rem.length ? '<span class="muted">No changes to what it can do</span>' : (add.length ? '<span class="ax-add">Gives: ' + add.map(label).join(', ') + '</span>' : '') + (rem.length ? '<span class="ax-rem">Takes away: ' + rem.map(label).join(', ') + '</span>' : '');
    }
    d.addEventListener('change', function(e){ var inp = e.target.closest('.ax-r input'); if(!inp) return; var c = inp.value; sel = inp.checked ? sel.concat(c) : sel.filter(function(v){ return v !== c; }); sync(); });
    d.querySelector('#ax-save').addEventListener('click', function(){
      var nm = d.querySelector('#rl-name'), name = nm.value.trim(), about = d.querySelector('#rl-about').value.trim(), f = now();
      if(!name){ RI.form.setInvalid(nm, 'Give the role a name.'); nm.focus(); return; }
      if(roles.some(function(r){ return (!role || r.id !== role.id) && r.name.toLowerCase() === name.toLowerCase(); })){ RI.form.setInvalid(nm, 'Another role already has this name.'); nm.focus(); return; }
      if(!f.length){ d.querySelector('#ax-sum').innerHTML = '<span class="ax-rem">Tick at least one thing this role can do.</span>'; return; }
      var list = C.roles();
      if(isNew){
        list.push({id:'r' + Date.now().toString(36), name:name, about:about, perms:f}); C.set('roles', list);
        C.log('Role created', name + ': ' + f.length + ' capabilities', '', 'users'); RI.toast('Role created: ' + name + '.', 'check');
      } else {
        var add = f.filter(function(c){ return role.perms.indexOf(c) < 0; }), rem = role.perms.filter(function(c){ return f.indexOf(c) < 0; }), renamed = name !== role.name;
        list.forEach(function(r){ if(r.id === role.id){ r.name = name; r.about = about; r.perms = f; } }); C.set('roles', list);
        var st = staffList(); st.forEach(function(x){ if(x.role === role.id) x.perms = C.effPerms(x).filter(function(p){ return C.SUPER.indexOf(p) < 0; }); }); C.set('staff', st);
        C.log('Role changed', name + ': ' + [renamed ? 'renamed from ' + role.name : '', add.length ? 'gave ' + add.map(label).join(', ') : '', rem.length ? 'took away ' + rem.map(label).join(', ') : ''].filter(Boolean).join('; ') + (people.length ? ' (' + people.length + (people.length === 1 ? ' person)' : ' people)') : ''), '', 'users');
        RI.toast('Role saved' + (people.length ? '. ' + people.length + (people.length === 1 ? ' person has' : ' people have') + ' the new access.' : '.'), 'check');
      }
      d.close(); if(after) after();
    });
    var del = d.querySelector('#rl-del');
    if(del) del.addEventListener('click', function(){ C.confirm('Delete the ' + RI.esc(role.name) + ' role?', 'Nobody has it. It leaves the list of roles.', 'Delete role', function(){ C.set('roles', C.roles().filter(function(r){ return r.id !== role.id; })); C.log('Role deleted', role.name, '', 'users'); RI.toast('Role deleted.'); d.close(); if(after) after(); }, true); });
    sync(); setTimeout(function(){ d.querySelector('#rl-name').focus(); }, 30);
  }
  function inviteDialog(after){ accessPanel(null, after); }
  function permsDialog(email, after){ accessPanel(email, after); }

  /* ---------- Audit log ----------
     Who, what, on what, when and why (SECURITY 15, BACKLOG M1-36), filtered by person, action and date (M4-28).
     Desktop: a real table, one column per question, rows grouped by day. Tablet: the reason moves under the change.
     Phone: each change is a card. Nothing here can be edited. */
  /* Action tags by meaning: rulebook changes, checks, and people and access */
  var AU_KIND = {'Published':'pub', 'Draft saved':'draft', 'Discarded':'off', 'Back-test run':'chk', 'Accuracy run':'chk', 'Role created':'acc', 'Role changed':'acc', 'Role given':'acc', 'Access adjusted':'acc', 'Role deleted':'acc', 'Photo labelled':'chk', 'Graded':'chk',
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
