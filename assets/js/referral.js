/* Referral program (business model v1.0, November 2026, section 3). The amounts and rules are proposed launch
   settings, subject to final business and legal approval.
   - A report referral: the referred person buys the $50 report; after the hold for refunds, the referrer gets $10.
   - A Pro referral: the referred professional pays the $99 plan twice; then the referrer gets $25.
   - New customers only, one referrer per person, no self-referral, nothing for a refunded purchase.
   - Rewards are account credit, never cash. Credit is used at checkout.
   Prototype only: referrals and credit live in this browser's localStorage. Loaded by the app, the console and sign up. */
(function(){
  var RI = window.RI, DAY = 86400000;
  var R = RI.Ref = {};
  var DEFAULTS = {on:true, report:10, pro:25, proPayments:2, holdDays:14, approve:true};

  R.settings = function(){ return Object.assign({}, DEFAULTS, RI.store.get('ref.settings', {})); };
  R.saveSettings = function(s){ RI.store.set('ref.settings', s); };

  /* Codes: short, readable, one per account. The sample people have fixed codes so links in the demo stay the same */
  var FIXED = {'homeowner@demo.ri':'JORDAN10', 'builder@demo.ri':'AVERY10', 'maria.lopez@example.com':'MARIA10', 'dwallace@example.com':'DEREK10'};
  var NAMES = {'maria.lopez@example.com':'Maria Lopez', 'dwallace@example.com':'Derek Wallace'};
  R.codeFor = function(email){
    var e = (email || '').trim().toLowerCase(); if(FIXED[e]) return FIXED[e];
    var base = (e.split('@')[0].replace(/[^a-z]/g, '').slice(0, 6) || 'FRIEND').toUpperCase();
    return base + RI.form.hash(e).slice(-3).toUpperCase();
  };
  R.link = function(email){ return new URL(RI.url('signup/?ref=' + R.codeFor(email)), location.href).href; };
  function known(){
    var list = Object.keys(FIXED).concat(Object.keys(RI.users.all()));
    (RI.ROLES || []).forEach(function(r){ list.push(r.email); });
    return list;
  }
  R.ownerOf = function(code){
    var c = (code || '').trim().toUpperCase(); if(!c) return null;
    return known().filter(function(e){ return R.codeFor(e) === c; })[0] || null;
  };
  R.nameOf = function(email){
    var role = (RI.ROLES || []).filter(function(r){ return r.email === email; })[0];
    return NAMES[email] || (role && role.name) || email.split('@')[0];
  };
  /* k•••@example.com: the referrer sees who signed up without the full address */
  R.mask = function(email){ var p = email.split('@'); return p[0].charAt(0) + '•••@' + p[1]; };

  /* Statuses: signed (no purchase yet), pending (report bought, in the hold), pending_pro (n of the payments),
     approval (qualified, waiting for Sam), credited, void (refund or cancel before it qualified),
     reversed (taken back after it was credited), blocked (not eligible) */
  function seed(){
    var now = Date.now(), d = function(n){ return now - n * DAY; }, id = 0;
    var row = function(o){ id += 1; return Object.assign({id:'rf' + id}, o); };
    return [
      row({referrer:'homeowner@demo.ri', referee:'kim.tran@example.com', at:d(26), track:'report', paidAt:d(24), status:'credited', reward:10, creditedAt:d(10)}),
      row({referrer:'homeowner@demo.ri', referee:'d.ramos@example.com', at:d(5), track:'report', paidAt:d(3), status:'pending'}),
      row({referrer:'homeowner@demo.ri', referee:'r.ortiz@example.com', at:d(20), track:'pro', paidAt:d(19), payments:1, status:'pending_pro'}),
      row({referrer:'homeowner@demo.ri', referee:'sara.l@example.com', at:d(2), status:'signed'}),
      row({referrer:'homeowner@demo.ri', referee:'b.chen@example.com', at:d(18), track:'report', paidAt:d(17), status:'void', reason:'Refunded before it qualified'}),
      row({referrer:'maria.lopez@example.com', referee:'p.green@example.com', at:d(64), track:'pro', paidAt:d(62), payments:2, status:'approval'}),
      row({referrer:'maria.lopez@example.com', referee:'m.fisher@example.com', at:d(40), track:'report', paidAt:d(39), status:'credited', reward:10, creditedAt:d(25)}),
      row({referrer:'dwallace@example.com', referee:'j.patel@example.com', at:d(31), track:'report', paidAt:d(15), status:'approval'}),
      row({referrer:'dwallace@example.com', referee:'derek.w.home@example.com', at:d(9), status:'blocked', reason:'Self-referral: the same card as the referrer'}),
      row({referrer:'dwallace@example.com', referee:'n.hughes@example.com', at:d(45), track:'report', paidAt:d(44), status:'reversed', reward:10, creditedAt:d(30), reason:'Refunded after the credit was given'}),
      row({referrer:'builder@demo.ri', referee:'l.kim@example.com', at:d(80), track:'pro', paidAt:d(78), payments:2, status:'credited', reward:25, creditedAt:d(47)})
    ];
  }
  R.all = function(){
    var list = RI.store.get('ref.list', null);
    if(!list){ list = seed(); RI.store.set('ref.list', list); }
    /* A report referral qualifies by itself once the hold for refunds is over */
    var s = R.settings(), changed = false;
    list.forEach(function(r){ if(r.status === 'pending' && r.paidAt + s.holdDays * DAY <= Date.now()){ qualify(r, s); changed = true; } });
    if(changed) RI.store.set('ref.list', list);
    return list;
  };
  function save(list){ RI.store.set('ref.list', list); }
  R.mine = function(email){ return R.all().filter(function(r){ return r.referrer === email; }).sort(function(a, b){ return b.at - a.at; }); };
  R.rewardFor = function(r){ var s = R.settings(); return r.reward || (r.track === 'pro' ? s.pro : r.track === 'report' ? s.report : 0); };
  R.qualifiesAt = function(r){ return r.paidAt + R.settings().holdDays * DAY; };
  function qualify(r, s){
    if(s.approve){ r.status = 'approval'; return; }
    r.status = 'credited'; r.reward = r.track === 'pro' ? s.pro : s.report; r.creditedAt = Date.now();
  }

  /* Money: earned and pending from the referrals; spent from the checkout entries */
  R.earned = function(email){ return R.mine(email).filter(function(r){ return r.status === 'credited'; }).reduce(function(t, r){ return t + r.reward; }, 0); };
  R.pending = function(email){ return R.mine(email).filter(function(r){ return ['pending', 'pending_pro', 'approval'].indexOf(r.status) > -1; }).reduce(function(t, r){ return t + R.rewardFor(r); }, 0); };
  R.spent = function(email){ return RI.store.get('ref.spent', []).filter(function(x){ return x.email === email; }).reduce(function(t, x){ return t + x.amount; }, 0); };
  R.balance = function(email){ return Math.max(0, R.earned(email) - R.spent(email)); };
  R.spend = function(email, amount, what){ var l = RI.store.get('ref.spent', []); l.push({email:email, amount:amount, what:what, at:Date.now()}); RI.store.set('ref.spent', l); };

  /* Sign up from a link: link the new account to the person who shared it, or say why not */
  R.attach = function(code, email){
    var s = R.settings(), owner = R.ownerOf(code), e = (email || '').trim().toLowerCase(); if(!s.on || !owner) return null;
    var list = R.all();
    if(list.some(function(r){ return r.referee === e; })) return null; /* one referrer per person: the first one stays */
    var r = {id:'rf' + Date.now(), referrer:owner, referee:e, at:Date.now(), status:'signed'};
    if(owner === e){ r.status = 'blocked'; r.reason = 'Self-referral: the same email as the referrer'; }
    list.push(r); save(list); return r;
  };
  /* The referred person pays: a report starts the hold; the Pro plan counts its payments */
  R.purchase = function(email, track){
    var list = R.all(), s = R.settings(), r = list.filter(function(x){ return x.referee === email && x.status === 'signed'; })[0]; if(!r) return null;
    r.track = track; r.paidAt = Date.now();
    if(track === 'pro'){ r.payments = 1; r.status = 'pending_pro'; } else r.status = 'pending';
    save(list); return r;
  };

  /* What happens next to one referral. Demo steps and Sam's actions both come through here */
  R.act = function(id, action, by){
    var list = R.all(), s = R.settings(), r = list.filter(function(x){ return x.id === id; })[0]; if(!r) return null;
    if(action === 'buy-report' && r.status === 'signed'){ r.track = 'report'; r.paidAt = Date.now(); r.status = 'pending'; }
    else if(action === 'start-pro' && r.status === 'signed'){ r.track = 'pro'; r.paidAt = Date.now(); r.payments = 1; r.status = 'pending_pro'; }
    else if(action === 'hold-ends' && r.status === 'pending'){ r.paidAt = Date.now() - s.holdDays * DAY; qualify(r, s); }
    else if(action === 'pro-paid' && r.status === 'pending_pro'){ r.payments = (r.payments || 1) + 1; if(r.payments >= s.proPayments) qualify(r, s); }
    else if(action === 'refund' && ['pending', 'pending_pro', 'approval'].indexOf(r.status) > -1){ r.status = 'void'; r.reason = r.track === 'pro' ? 'The plan was cancelled or refunded before it qualified' : 'Refunded before it qualified'; }
    else if(action === 'approve' && r.status === 'approval'){ r.status = 'credited'; r.reward = r.track === 'pro' ? s.pro : s.report; r.creditedAt = Date.now(); r.by = by; }
    else if(action === 'reject' && r.status === 'approval'){ r.status = 'void'; r.reason = 'Not approved by ' + (by || 'Sam'); r.by = by; }
    else if(action === 'reverse' && r.status === 'credited'){ r.status = 'reversed'; r.reason = 'Taken back by ' + (by || 'Sam'); r.by = by; }
    else return null;
    save(list); return r;
  };

  /* One status label, in words, for the app and the console */
  R.STATUS = {signed:['Signed up', 'off'], pending:['Pending', 'work'], pending_pro:['Pending', 'work'], approval:['Waiting for review', 'work'],
    credited:['Credited', 'ok'], void:['No reward', 'off'], reversed:['Taken back', 'bad'], blocked:['Not eligible', 'bad']};
  R.detail = function(r){
    var s = R.settings(), when = function(t){ return new Date(t).toLocaleDateString('en-US', {month:'short', day:'numeric'}); };
    if(r.status === 'signed') return 'No purchase yet';
    if(r.status === 'pending') return 'Bought a report · qualifies ' + when(R.qualifiesAt(r));
    if(r.status === 'pending_pro') return 'Pro plan · ' + (r.payments || 1) + ' of ' + s.proPayments + ' payments';
    if(r.status === 'approval') return (r.track === 'pro' ? 'Pro plan · ' + s.proPayments + ' payments made' : 'Report · hold over') + ' · Sam reviews it';
    if(r.status === 'credited') return 'Credited ' + when(r.creditedAt);
    return r.reason || '';
  };
})();
