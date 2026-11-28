/* App: the Pro plan (client request, Nov 27 2026; business model v1.0).
   $99 a month for agents, builders and investors: 10 houses a month, reset each month; one more house is $10,
   bought only when the user presses the button; downloads, shares and fixes to the same house use no credit;
   there is no unlimited plan. Numbers come from RI.OFFERS.pro (data.js).
   Sample rules until Sam answers: a credit is used when the full presentation opens; the month runs from the
   day Pro starts; a house bought on the house page opens at once, one bought from Account waits until used.
   Demo only: state lives in this browser (RI.store 'pro.<email>'), nothing is charged. */
(function(){
  var RI = window.RI, A = RI.App, doc = document, O = RI.OFFERS.pro, DAY = 86400000;
  var WORK = ['builder', 'agent', 'investor'];

  /* ---------- State ---------- */
  function key(){ var s = A.me(); return s ? 'pro.' + s.email : null; }
  function typeOf(){ var s = A.me() || {}, u = s.email ? (RI.users.get(s.email) || {}) : {}; return String(u.type || s.type || '').toLowerCase(); }
  /* Who can buy Pro: agent, builder and investor accounts (sample rule) */
  A.proEligible = function(){ var s = A.me(); return !!s && (s.role === 'builder' || WORK.indexOf(typeOf()) > -1); };
  function get(){
    var k = key(); if(!k) return null;
    var st = RI.store.get(k, null), s = A.me();
    /* The demo builder starts on Pro, with one house opened by a credit this month */
    if(!st && s.demo && s.role === 'builder'){ st = {on:true, start:Date.now() - 3600000, used:[], extra:0, demoSeed:true}; RI.store.set(k, st); }
    if(st && st.demoSeed){
      var t = A.mine().filter(function(h){ return h.addr && h.addr.street === '15520 Fairfield St'; })[0];
      if(t){ st.used.push({id:t.id, at:Date.now() - 1800000, kind:'credit'}); delete st.demoSeed; RI.store.set(k, st); }
    }
    return st;
  }
  function put(st){ RI.store.set(key(), st); }
  function addMonths(t, k){ var d = new Date(t), day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + k); d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); return d.getTime(); }
  function cycle(st){ var k = 0, now = Date.now(); while(addMonths(st.start, k + 1) <= now) k++; return {from:addMonths(st.start, k), to:addMonths(st.start, k + 1)}; }
  function usedNow(st){ var c = cycle(st); return st.used.filter(function(u){ return u.at >= c.from; }); }
  function creditsUsed(st){ var c = cycle(st); return usedNow(st).filter(function(u){ return u.kind === 'credit'; }).length + (st.fill && st.fill.from === c.from ? st.fill.n : 0); }
  function date(t){ return new Date(t).toLocaleDateString('en-US', {month:'short', day:'numeric'}); }
  function money(n){ return '$' + n + '.00'; }

  A.proOn = function(){ var st = get(); return !!(st && st.on); };
  A.proMonthLeft = function(){ var st = get(); return st ? Math.max(0, O.credits - creditsUsed(st)) : 0; };
  A.proExtra = function(){ var st = get(); return st ? st.extra || 0 : 0; };
  A.proLeft = function(){ return A.proMonthLeft() + A.proExtra(); };
  A.proReset = function(){ var st = get(); return st ? cycle(st).to : 0; };
  A.proLeftText = function(){
    var m = A.proMonthLeft(), x = A.proExtra();
    if(m) return m + ' of ' + O.credits + ' left this month' + (x ? ' · ' + x + ' extra' : '');
    return x ? x + ' extra house' + (x === 1 ? '' : 's') + ' left' : 'None left this month';
  };
  A.proBuyLabel = function(){ return 'Buy 1 more house, $' + O.extra; };

  /* Opening a house: a monthly credit first, then an extra house bought earlier */
  A.proSpend = function(h){
    var st = get(), kind = A.proMonthLeft() > 0 ? 'credit' : 'extra';
    if(kind === 'extra') st.extra = Math.max(0, (st.extra || 0) - 1);
    st.used.push({id:h.id, at:Date.now(), kind:kind}); put(st);
    h.proOpen = true; h.proAt = Date.now(); h.proKind = kind; A.put(h);
    RI.track('pro_credit_used', {house:h.id, kind:kind});
  };

  /* ---------- The meter: houses left this month and the reset date ---------- */
  A.proMeterHtml = function(mode){
    var left = A.proMonthLeft(), x = A.proExtra(), bar = '';
    for(var i = 0; i < O.credits; i++) bar += '<i' + (i < left ? ' class="on"' : '') + '></i>';
    return '<div class="pro-meter' + (mode === 'box' ? ' pro-meter-box' : '') + (left <= 2 ? ' is-low' : '') + '" role="group" aria-label="Pro houses this month">' +
      '<div class="prm-top"><b>' + left + ' of ' + O.credits + ' left</b><span>Resets ' + date(A.proReset()) + '</span></div>' +
      '<span class="pr-m-bar" aria-hidden="true">' + bar + '</span>' + (x ? '<span class="pm-extra">+' + x + ' extra house' + (x === 1 ? '' : 's') + '</span>' : '') + '</div>';
  };

  /* ---------- House page: none left this month ---------- */
  A.proOutHtml = function(){
    return '<div class="pro-out"><b>All ' + O.credits + ' used this month</b><span>' + O.credits + ' more on ' + date(A.proReset()) + '.</span></div>' +
      '<button type="button" class="btn btn-primary btn-block px-btn" id="pro-buy">' + A.proBuyLabel() + '</button>' +
      '<p class="small muted">Charged only when you press the button.</p>';
  };

  /* ---------- Buy 1 more house: always a confirm step, never a silent charge ---------- */
  A.proBuy = function(h){
    var d = A.dialog('Buy 1 more house for $' + O.extra + '?',
      '<p>' + (h ? 'It opens ' + RI.esc(A.addr(h)) + ' in full.' : 'It adds one house you can open at any time.') + ' It is a single payment, not added to your monthly plan.</p>' +
      '<dl class="co-tot pro-dlg-tot"><div class="tot"><dt>Card ending 4242</dt><dd>' + money(O.extra) + '</dd></div></dl>' +
      '<p class="xsmall muted">Demo. No real payment is taken.</p>' +
      '<div class="cta-row" style="justify-content:flex-end"><button type="button" class="btn btn-secondary" data-dlg-close>Cancel</button><button type="button" class="btn btn-primary" id="pb-pay">Pay ' + money(O.extra) + '</button></div>');
    d.querySelector('#pb-pay').addEventListener('click', function(){
      var btn = this; RI.form.busy(btn, true, 'Processing');
      setTimeout(function(){
        var st = get(); RI.track('pro_extra_bought', {house:h ? h.id : null});
        if(h){
          st.used.push({id:h.id, at:Date.now(), kind:'bought'}); put(st);
          h.proOpen = true; h.proAt = Date.now(); h.proKind = 'bought'; A.put(h);
          d.close(); RI.toast('Paid $' + O.extra + '. The house is open.'); A.go('#/houses/' + h.id + '/presentation');
        } else {
          st.extra = (st.extra || 0) + 1; put(st);
          d.close(); RI.toast('Paid $' + O.extra + '. One more house is ready to use.'); A.render();
        }
      }, 900);
    });
  };

  /* ---------- Account, Your plan ---------- */
  A.proPlanHtml = function(){
    var st = get(), rows = usedNow(st).slice().reverse().map(function(u){
      var h = A.get(u.id); if(!h) return '';
      return '<li><span>' + RI.esc(A.addr(h)) + '</span><span class="muted">' + (u.kind === 'bought' ? 'Bought, $' + O.extra : u.kind === 'extra' ? 'Used an extra house' : 'Used 1 credit') + '</span></li>';
    }).join('');
    return '<div class="pro-plan"><div class="pro-plan-h"><b>Pro · $' + O.price + ' a month</b><span class="small muted">Next payment ' + date(A.proReset()) + '</span></div>' +
      A.proMeterHtml() +
      (rows ? '<ul class="pro-used" aria-label="Houses opened this month">' + rows + '</ul>' : '<p class="small muted">No houses opened yet this month.</p>') +
      '<div class="cta-row"><button type="button" class="btn btn-secondary btn-sm" id="pro-buy-acc">' + RI.icon('plus','i-sm') + A.proBuyLabel() + '</button></div>' +
      '<p class="xsmall muted">Credits reset every month. Downloads, shares and fixes use no credit. <span class="state state-sample">Sample rules</span></p></div>';
  };
  A.proOfferHtml = function(){
    return '<div class="pro-plan pro-offer"><div class="pro-plan-h"><b>Pro · $' + O.price + ' a month</b><span class="state state-sample">Sample rules</span></div>' +
      '<ul class="ticks small"><li>' + RI.icon('check') + '<span>' + O.credits + ' houses a month, each with all three packages</span></li><li>' + RI.icon('check') + '<span>A full detailed report for every house</span></li><li>' + RI.icon('check') + '<span>Task lists and scope documents for each trade</span></li><li>' + RI.icon('check') + '<span>Extra houses $' + O.extra + ' each, only when you choose</span></li></ul>' +
      '<div><a class="btn btn-primary btn-sm" href="#/pro">Start Pro, $' + O.price + ' a month</a></div></div>';
  };
  A.proDevHtml = function(){ return '<button type="button" class="linkbtn small" id="pro-empty">Demo: no credits left</button><button type="button" class="linkbtn small" id="pro-reset">Demo: reset credits</button>'; };
  A.proWire = function(view){
    var b = view.querySelector('#pro-buy-acc'); if(b) b.addEventListener('click', function(){ A.proBuy(null); });
    var e = view.querySelector('#pro-empty'); if(e) e.addEventListener('click', function(){ var st = get(), c = cycle(st); st.fill = {from:c.from, n:0}; st.fill.n = Math.max(0, O.credits - creditsUsed(st)); st.extra = 0; put(st); RI.toast('Demo: no credits left this month.'); A.render(); });
    var r = view.querySelector('#pro-reset'); if(r) r.addEventListener('click', function(){ var st = get(), c = cycle(st); delete st.fill; st.extra = 0; st.used = st.used.filter(function(u){ return u.at < c.from || u.kind !== 'credit'; }); put(st); RI.toast('Demo: credits reset.'); A.render(); });
  };

  /* ---------- Checkout: Pro, $99 a month (simulated Stripe Checkout, like the house checkout) ---------- */
  A.route('/pro', function(view){
    var s = A.me();
    if(!A.proEligible()){ RI.toast('Pro is for agent, builder and investor accounts.'); A.go('#/account'); return; }
    if(A.proOn()){ A.go('#/account'); return; }
    RI.track('pro_checkout_started', {});
    var next = addMonths(Date.now(), 1);
    var exit = doc.getElementById('focus-exit'); if(exit) exit.innerHTML = '<a class="exit-btn" href="#/account" aria-label="Cancel and go back to your account"><span class="eb-l">Cancel</span>' + RI.icon('x','i-sm') + '</a>';
    view.innerHTML = '<div class="app-wrap co-wrap"><div class="co-demo">' + RI.icon('info','i-sm') + '<span><b>Demo checkout.</b> In the product this is Stripe\'s own secure page. No real payment is taken here.</span></div>' +
      '<div class="co">' +
      '<section class="co-sum"><p class="label">Your plan</p>' +
        '<h1>Renovation Intelligence Pro</h1><ul class="ticks">' +
          '<li>' + RI.icon('check') + '<span>' + O.credits + ' houses a month, each with all three packages</span></li>' +
          '<li>' + RI.icon('check') + '<span>A full detailed report for every house</span></li>' +
          '<li>' + RI.icon('check') + '<span>Reports to download and share with clients</span></li>' +
          '<li>' + RI.icon('check') + '<span>Task lists and scope documents for each trade</span></li>' +
          '<li>' + RI.icon('check') + '<span>Extra houses $' + O.extra + ' each, only when you choose</span></li></ul>' +
        '<dl class="co-tot"><div><dt>Pro, monthly</dt><dd>' + money(O.price) + '</dd></div><div class="tot"><dt>Total today</dt><dd>' + money(O.price) + '</dd></div><div class="pro-next"><dt>Next payment</dt><dd>' + money(O.price) + ' on ' + date(next) + '</dd></div></dl>' +
        '<p class="xsmall muted">Your ' + O.credits + ' houses reset every month. <span class="state state-sample">Sample rules</span></p></section>' +
      '<section class="co-pay" id="co-pay"><h2>Pay with card</h2><form class="form-grid" id="card" novalidate>' +
        '<div class="field"><label for="c-em">Email</label><input class="input" id="c-em" type="email" value="' + RI.esc(s.email) + '" autocomplete="email"></div>' +
        '<div class="field"><label for="c-no">Card number</label><div class="card-in"><input class="input" id="c-no" inputmode="numeric" autocomplete="cc-number" value="4242 4242 4242 4242"><span class="brands"><i>VISA</i><i>MC</i></span></div><span class="help">Demo card. Use any card number; nothing is charged.</span><span class="err"></span></div>' +
        '<div class="grid-3"><div class="field"><label for="c-ex">Expiry</label><input class="input" id="c-ex" inputmode="numeric" autocomplete="cc-exp" value="12 / 30"></div><div class="field"><label for="c-cv">CVC</label><input class="input" id="c-cv" inputmode="numeric" autocomplete="cc-csc" value="123"></div><div class="field"><label for="c-zip">ZIP</label><input class="input" id="c-zip" inputmode="numeric" value=""></div></div>' +
        '<div class="notice notice-bad" id="c-err" hidden role="alert"></div>' +
        '<button type="submit" class="btn btn-primary btn-block" id="c-pay">' + RI.icon('lock','i-sm') + 'Start Pro, ' + money(O.price) + ' a month</button>' +
        '<p class="co-secure">' + RI.icon('shield','i-sm') + 'Payments are handled by Stripe. Card details never reach our servers.</p>' +
        '<div class="cta-row" style="justify-content:space-between"><a href="#/account" class="textlink">Cancel and go back</a><button type="button" class="linkbtn small" id="decline">Demo: try a declined card</button></div>' +
      '</form></section></div></div>';
    var declined = false;
    view.querySelector('#decline').addEventListener('click', function(){ declined = true; RI.toast('The next payment will be declined, to show that state.', 'info'); });
    view.querySelector('#card').addEventListener('submit', function(e){
      e.preventDefault(); var btn = view.querySelector('#c-pay'), err = view.querySelector('#c-err'); err.hidden = true;
      var no = view.querySelector('#c-no'); if(no.value.replace(/\D/g, '').length < 12){ RI.form.setInvalid(no, 'Check the card number.'); return; } RI.form.setInvalid(no, null);
      RI.form.busy(btn, true, 'Processing');
      A.later(function(){
        if(declined){ declined = false; RI.form.busy(btn, false); err.innerHTML = RI.icon('warn') + '<span><b>Your card was declined.</b> Nothing was charged. Try another card.</span>'; err.hidden = false; return; }
        put({on:true, start:Date.now(), used:[], extra:0}); RI.track('pro_started', {});
        view.querySelector('#co-pay').innerHTML = '<div class="paid-ok"><div class="mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path class="draw-check" d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h2>Pro is on</h2><p class="muted">You have ' + O.credits + ' houses this month. They reset on ' + date(A.proReset()) + '.</p></div>';
        A.later(function(){ RI.toast('Pro is on. In the product we would email you a receipt.', 'mail'); A.go('#/account'); }, 1400);
      }, 1400);
    });
  }, {focus:true});
})();
