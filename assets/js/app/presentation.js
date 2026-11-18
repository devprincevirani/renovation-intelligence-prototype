/* App, milestone 4: checkout (simulated), payment received, the presentation, share, PDF, feedback,
   builder task lists. The presentation is the paid screen (docs/APP_FLOW.md 6.6). */
(function(){
  var RI = window.RI, A = RI.App, doc = document;
  A.hasCheckout = true;
  var PRICE = 49; /* sample price for the prototype; Sam sets the real one */

  /* ---------- Checkout (simulated Stripe Checkout) ---------- */
  A.route('/houses/:id/checkout', function(view, p){
    var h = A.get(p.id); if(!h){ view.innerHTML = A.notFound(); return; }
    var runPay = /[?&]run=1/.test(location.hash);  /* paying at the free-report limit runs the house (guide p58) */
    if(A.status(h) === 'open'){ A.go('#/houses/' + h.id + '/presentation'); return; }
    if(A.status(h) !== 'ready' && !(runPay && A.status(h) === 'draft')){ A.go('#/houses/' + h.id); return; }
    var s = A.me(), cov = A.cover(h); RI.track('checkout_started', {house:h.id});
    var exit = doc.getElementById('focus-exit'); if(exit) exit.innerHTML = '<a class="textlink inv" href="#/houses/' + h.id + '">Cancel</a>';
    view.innerHTML = '<div class="app-wrap co-wrap"><div class="co-demo">' + RI.icon('info','i-sm') + '<span><b>Demo checkout.</b> In the product this is Stripe\'s own secure page. No real payment is taken here.</span></div>' +
      '<div class="co">' +
      '<section class="co-sum"><p class="label">Your order</p><div class="co-house">' + (cov ? '<img src="' + cov + '" alt="">' : '') + '<div><b>' + RI.esc(A.addr(h)) + '</b><span class="small muted">' + RI.esc(A.place(h)) + '</span></div></div>' +
        '<h1>The full presentation</h1><ul class="ticks"><li>' + RI.icon('check') + '<span>Every room and trade, with products</span></li><li>' + RI.icon('check') + '<span>Switch goals, turn items on or off</span></li><li>' + RI.icon('check') + '<span>House systems guidance</span></li><li>' + RI.icon('check') + '<span>PDF and a private share link</span></li></ul>' +
        '<dl class="co-tot"><div><dt>One payment for this house</dt><dd>$' + PRICE + '.00</dd></div><div class="tot"><dt>Total today</dt><dd>$' + PRICE + '.00</dd></div></dl><p class="xsmall muted">Sample price. The presentation stays available after you pay. This is an estimate for planning, not a contractor\'s bid.</p></section>' +
      '<section class="co-pay" id="co-pay"><h2>Pay with card</h2><form class="form-grid" id="card" novalidate>' +
        '<div class="field"><label for="c-em">Email</label><input class="input" id="c-em" type="email" value="' + RI.esc(s.email) + '" autocomplete="email"></div>' +
        '<div class="field"><label for="c-no">Card number</label><div class="card-in"><input class="input" id="c-no" inputmode="numeric" autocomplete="cc-number" value="4242 4242 4242 4242"><span class="brands"><i>VISA</i><i>MC</i></span></div><span class="help">Demo card. Use any card number; nothing is charged.</span><span class="err"></span></div>' +
        '<div class="grid-3"><div class="field"><label for="c-ex">Expiry</label><input class="input" id="c-ex" inputmode="numeric" autocomplete="cc-exp" value="12 / 30"></div><div class="field"><label for="c-cv">CVC</label><input class="input" id="c-cv" inputmode="numeric" autocomplete="cc-csc" value="123"></div><div class="field"><label for="c-zip">ZIP</label><input class="input" id="c-zip" inputmode="numeric" value="' + RI.esc((h.addr || {}).zip || '') + '"></div></div>' +
        '<div class="notice notice-bad" id="c-err" hidden role="alert"></div>' +
        '<button type="submit" class="btn btn-primary btn-block" id="c-pay">' + RI.icon('lock','i-sm') + 'Pay $' + PRICE + '.00</button>' +
        '<p class="co-secure">' + RI.icon('shield','i-sm') + 'Payments are handled by Stripe. Card details never reach our servers.</p>' +
        '<div class="cta-row" style="justify-content:space-between"><a href="#/houses/' + h.id + '" class="textlink">Cancel and go back</a><button type="button" class="linkbtn small" id="decline">Demo: try a declined card</button></div>' +
      '</form></section></div></div>';
    var declined = false;
    view.querySelector('#decline').addEventListener('click', function(){ declined = true; RI.toast('The next payment will be declined, to show that state.', 'info'); });
    view.querySelector('#card').addEventListener('submit', function(e){
      e.preventDefault(); var btn = view.querySelector('#c-pay'), err = view.querySelector('#c-err'); err.hidden = true;
      var no = view.querySelector('#c-no'); if(no.value.replace(/\D/g, '').length < 12){ RI.form.setInvalid(no, 'Check the card number.'); return; } RI.form.setInvalid(no, null);
      RI.form.busy(btn, true, 'Processing');
      A.later(function(){
        if(declined){ declined = false; RI.form.busy(btn, false); err.innerHTML = RI.icon('warn') + '<span><b>Your card was declined.</b> Nothing was charged. Try another card.</span>'; err.hidden = false; return; }
        var box = view.querySelector('#co-pay');
        box.innerHTML = '<div class="paid-ok"><div class="mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path class="draw-check" d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h2>Payment received</h2><p class="muted">' + (runPay ? 'Sending your house to be read…' : 'Opening your presentation…') + '</p><span class="bar"><i id="open-bar" style="width:0"></i></span><p class="xsmall muted">If this takes a moment, the page opens by itself.</p></div>';
        requestAnimationFrame(function(){ var b = view.querySelector('#open-bar'); if(b){ b.style.transition = 'width 1.6s cubic-bezier(.2,.7,.2,1)'; b.style.width = '100%'; } });
        h.paid = true; h.paidAt = Date.now();
        if(runPay){ var again = !!h.run; h.status = 'submitted'; h.step = 'review'; h.run = {start:Date.now()}; h.submittedAt = Date.now(); h.version = (h.version || 1) + (again ? 1 : 0); RI.track('intake_submitted', {paid:true}); }
        A.put(h); RI.track('payment_completed', {house:h.id});
        A.later(function(){ RI.toast(runPay ? 'Paid. Your house is in line, and the presentation opens when it is ready.' : 'Your presentation is open. In the product we would email you a receipt.', 'mail'); A.go('#/houses/' + h.id + (runPay ? '' : '/presentation')); }, 1800);
      }, 1400);
    });
  }, {focus:true});

  /* ---------- Task lists for builders ---------- */
  function tasksFor(it, act){
    var a = act.toLowerCase(), q = it.qty;
    var steps = /refinish/.test(a) ? ['Clean and degrease','Scuff sand and prime','Two finish coats'] :
      /paint/.test(a) ? ['Protect, patch and sand','Prime where needed','Two finish coats'] :
      /remove|replace|install|new /.test(a) ? ['Remove and haul away','Prepare the surface','Install','Clean up and inspect'] :
      /reglaze/.test(a) ? ['Clean and etch','Mask and spray','Cure 24 hours'] : [act];
    return steps.map(function(s){ return [it.trade, s, q]; });
  }

  /* ---------- The presentation ---------- */
  A.route('/houses/:id/presentation', function(view, p){
    var h = A.get(p.id); if(!h){ view.innerHTML = A.notFound(); return; }
    if(A.status(h) !== 'open'){ RI.toast('Open the presentation from the price page first.', 'lock'); A.go('#/houses/' + h.id); return; }
    var est = A.estimate(h); RI.CURRENT = est; RI.track('presentation_opened', {house:h.id});
    h.pk = h.pk || 'S'; h.off = h.off || {};
    var pro = A.isPro(), open = {}, held = A.heldCount(est), tab = 'rooms';
    open[est.rooms[0].key] = true;
    view.innerHTML = '<div class="app-wrap pres">' +
      '<a class="back" href="#/houses/' + h.id + '">' + RI.icon('arrow','i-sm flip') + 'Price by package</a>' +
      '<header class="pr-head">' + (A.cover(h) ? '<img class="pr-photo" src="' + A.cover(h) + '" alt="' + RI.esc(A.addr(h)) + '">' : '') + '<div class="pr-ht"><p class="label">Presentation' + (h.version > 1 ? ' · version ' + h.version : '') + '</p><h1>' + RI.esc(A.addr(h)) + '</h1><p class="muted small">' + RI.esc(A.place(h)) + ' · ' + RI.esc(h.title || '') + '</p><p class="xsmall muted">Evidence: ' + A.photoCount(h) + ' photos' + (Object.keys(h.sizes || {}).length ? ' and your room sizes' : '') + ', as of ' + A.date(h.run.start) + '. Prepared for ' + RI.esc(h.client || A.me().name) + '.</p></div>' +
        '<div class="pr-actions"><button type="button" class="btn btn-secondary btn-sm" id="share">' + RI.icon('share','i-sm') + 'Share</button><button type="button" class="btn btn-secondary btn-sm" id="pdf">' + RI.icon('file','i-sm') + 'PDF</button><button type="button" class="btn btn-secondary btn-sm" id="fb">Feedback</button></div></header>' +
      '<div class="pr-layout"><aside class="pr-side" id="pr-bar" aria-label="Package and total"><div class="pr-side-in"><div class="seg" role="tablist" aria-label="Package" id="pk"><span class="seg-thumb"></span>' + RI.PACKAGES.map(function(x){ return '<button type="button" role="tab" data-pk="' + x.key + '" aria-selected="' + (x.key === h.pk) + '">' + x.name + '</button>'; }).join('') + '</div>' +
        '<span class="small muted pr-goal" id="pr-goal"></span><div class="pr-total" aria-live="polite"><span class="lbl"><span id="pr-off"></span>' + (held.u + held.m ? '<span class="state state-partial">Partial</span>' : '') + '</span><span class="range-txt" id="pr-tot"></span><div data-scale="0,1"><div class="rl' + (held.u + held.m ? ' partial' : '') + '" id="pr-rl" data-low="0" data-high="0"></div></div></div><button type="button" class="linkbtn small pr-reset" id="pr-reset">Turn all items on</button></div></aside><div class="pr-main">' +
      '<div class="tabs-s" role="tablist" aria-label="Views" id="views">' + [['rooms','Rooms'],['trades','Trades'],['products','Products'],['unk','Not confirmed <span class="n">' + (held.u + held.m) + '</span>'],['extras','Potential extra costs'],['notinc','Not included'],['sys','House systems']].concat(pro ? [['tasks','Task lists']] : []).map(function(t, i){ return '<button role="tab" data-v="' + t[0] + '" aria-selected="' + (i === 0) + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<div id="pv"></div>' +
      '<section class="fb-inline" id="fb-inline"></section></div></div>' +
      '<p class="disc-line">' + RI.icon('info','i-sm') + 'This is an estimate for planning, never a contractor\'s bid. Quantities shown are net. Lines we could not confirm are left out of every total. Anything hidden in walls, floors or systems stays unknown until someone opens them.</p></div>';
    var pv = view.querySelector('#pv'), seg = view.querySelector('#pk'), max = Math.ceil(RI.totals('P', {}).high / 25000) * 25000;
    view.querySelector('#pr-rl').parentNode.setAttribute('data-scale', '0,' + max);
    function save(){ A.put(h); }
    function totals(bump){
      var t = RI.totals(h.pk, h.off), pkd = RI.PACKAGES.filter(function(x){ return x.key === h.pk; })[0];
      var el = view.querySelector('#pr-tot'); el.innerHTML = RI.range(t.low, t.high);
      if(bump){ el.classList.remove('bump-l'); void el.offsetWidth; el.classList.add('bump-l'); }
      view.querySelector('#pr-goal').textContent = pkd.goal;
      var n = Object.keys(h.off).length; view.querySelector('#pr-off').textContent = n ? n + ' item' + (n > 1 ? 's' : '') + ' off' : 'All items';
      var rl = view.querySelector('#pr-rl'); rl.setAttribute('data-low', t.low); rl.setAttribute('data-high', t.high); RI.drawRange(rl); rl.classList.add('drawn');
    }
    function heldTag(it){ return '<span class="state ' + (it.state === 'measure' ? 'state-measure' : 'state-unverified') + '">' + (it.state === 'measure' ? 'Needs measurement' : 'Unverified') + '</span>'; }
    function item(it){
      if(RI.isHeld(it)) return '<div class="item hold"><div><span class="nm">' + RI.esc(it.name) + '</span><div class="meta"><span>' + RI.esc(it.qty) + '</span>' + RI.ev(it.ev) + '</div><div class="fix">' + RI.icon('info','i-sm') + ' ' + RI.esc(it.fix) + ' would settle it.</div></div>' + heldTag(it) + '<span class="amt muted small">Not in the total</span></div>';
      var a = it.pk[h.pk], keep = a[1] == null, off = !!h.off[it.id];
      return '<div class="item' + (off ? ' off' : '') + '" data-item="' + it.id + '"><div><span class="nm">' + RI.esc(it.name) + '</span><div class="act">' + RI.esc(a[0]) + '</div><div class="meta"><span>' + RI.esc(it.qty) + '</span>' + RI.ev(it.ev) + '<span>' + RI.esc(it.trade) + '</span>' + (a[3] ? '<span class="prod">' + (productImg(it) ? '<img class="prod-th" src="' + productImg(it) + '" alt="">' : RI.icon('dot','i-sm')) + RI.esc(a[3]) + '</span>' : '') + '</div></div>' +
        (keep ? '<span></span><span class="amt muted small">Keep, no cost</span>' : '<label class="switch sw"><input type="checkbox" data-id="' + it.id + '"' + (off ? '' : ' checked') + '><span class="track"></span><span class="sr">Include ' + RI.esc(it.name) + '</span></label><span class="amt range-txt">' + RI.range(a[1], a[2]) + '</span>') + '</div>';
    }
    function roomHead(r){
      var t = RI.totals(h.pk, h.off, r.key), hasHeld = r.items.some(RI.isHeld);
      return '<button type="button" class="room-head" aria-expanded="' + !!open[r.key] + '"><span><span class="rh-title">' + r.name + '</span><span class="sub">' + r.sub + (hasHeld ? ' · partial' : '') + '</span></span><span data-scale="0,' + Math.max(10000, Math.ceil(RI.totals('P', {}, r.key).high / 5000) * 5000) + '"><span class="rl' + (hasHeld ? ' partial' : '') + '" data-low="' + t.low + '" data-high="' + t.high + '"></span></span><span class="range-txt">' + (t.high ? RI.range(t.low, t.high) : '<span class="muted">' + (hasHeld ? 'Not priced yet' : 'No cost') + '</span>') + '</span><span class="chev" aria-hidden="true"></span></button>';
    }
    var plan;
    function viewRooms(){
      pv.innerHTML = '<div class="pr-rooms"><div class="pr-plan card" id="pr-plan"></div><div id="rooms">' + est.rooms.map(function(r){ return '<div class="room' + (open[r.key] ? ' open' : '') + '" data-room="' + r.key + '">' + roomHead(r) + '<div class="room-body"><div>' + roomPhotos(r.key) + r.items.map(item).join('') + '</div></div></div>'; }).join('') + '</div></div>';
      plan = RI.Plan.mount(pv.querySelector('#pr-plan'), {onSelect:function(k){ open[k] = true; var el = pv.querySelector('.room[data-room="' + k + '"]'); if(el){ el.classList.add('open'); el.querySelector('.room-head').setAttribute('aria-expanded', 'true'); el.scrollIntoView({behavior:A.reduce ? 'auto' : 'smooth', block:'start'}); } plan.update(h.pk, h.off, k); }});
      plan.update(h.pk, h.off, null);
      RI.initRanges(pv); pv.querySelectorAll('.rl').forEach(function(x){ x.classList.add('drawn'); });
    }
    function refreshRooms(){
      if(tab !== 'rooms') return;
      pv.querySelectorAll('.room').forEach(function(el){
        var r = est.rooms.filter(function(x){ return x.key === el.getAttribute('data-room'); })[0];
        var tmp = doc.createElement('div'); tmp.innerHTML = roomHead(r); var head = el.querySelector('.room-head'); head.innerHTML = tmp.firstChild.innerHTML;
        RI.initRanges(head); head.querySelectorAll('.rl').forEach(function(x){ x.classList.add('drawn'); });
      });
      if(plan) plan.update(h.pk, h.off, null);
    }
    function viewTrades(){
      var by = {};
      est.rooms.forEach(function(r){ r.items.forEach(function(it){ var t = it.trade; by[t] = by[t] || {lo:0, hi:0, lines:[], held:0}; if(RI.isHeld(it)){ by[t].held++; by[t].lines.push([r, it, null]); return; } var a = it.pk[h.pk]; if(a[1] == null || h.off[it.id]) return; by[t].lo += a[1]; by[t].hi += a[2]; by[t].lines.push([r, it, a]); }); });
      var keys = Object.keys(by).sort(function(a, b){ return by[b].hi - by[a].hi; }), mx = Math.max.apply(null, keys.map(function(k){ return by[k].hi; })) || 1;
      pv.innerHTML = '<p class="small muted tab-intro">The same work grouped by trade. Each task is counted once, by the one trade that owns it.</p><div class="trades" data-scale="0,' + mx + '">' + keys.map(function(k){
        var t = by[k];
        return '<details class="trade"><summary><span><b>' + k + '</b><span class="xsmall muted">' + t.lines.length + ' line' + (t.lines.length === 1 ? '' : 's') + (t.held ? ', ' + t.held + ' not confirmed' : '') + '</span></span><span class="rl" data-low="' + t.lo + '" data-high="' + t.hi + '"></span><span class="range-txt">' + (t.hi ? RI.range(t.lo, t.hi) : '<span class="muted">Not priced</span>') + '</span></summary>' +
          '<ul>' + t.lines.map(function(l){ return '<li><span><b>' + l[0].name + '</b> ' + RI.esc(l[1].name) + '<span class="xsmall muted">' + (l[2] ? RI.esc(l[2][0]) : '') + '</span></span>' + (l[2] ? '<span class="range-txt small">' + RI.range(l[2][1], l[2][2]) + '</span>' : heldTag(l[1])) + '</li>'; }).join('') + '</ul></details>';
      }).join('') + '</div>';
      RI.initRanges(pv); pv.querySelectorAll('.rl').forEach(function(x){ x.classList.add('drawn'); });
    }
    function viewUnk(){
      var list = []; est.rooms.forEach(function(r){ r.items.forEach(function(it){ if(RI.isHeld(it)) list.push([r, it]); }); });
      pv.innerHTML = list.length ? '<p class="small muted tab-intro">Left out of every total, never shown as zero. Add what is missing and the house runs again as a new version.</p><ul class="unk">' + list.map(function(x){ var ph = x[1].state === 'unverified'; return '<li>' + heldTag(x[1]) + '<span><b>' + x[0].name + ', ' + x[1].name.toLowerCase() + '</b><span class="small muted">' + RI.esc(x[1].fix) + ' would settle it.</span></span><a class="btn btn-secondary btn-sm" href="#/houses/' + h.id + '/intake/' + (ph ? 'photos' : 'measurements') + '">' + (ph ? 'Add the photo' : 'Add the size') + '</a></li>'; }).join('') + '</ul>' : '<div class="empty-s">' + RI.icon('check') + '<p>Every line in this house is priced.</p></div>';
    }
    function viewSys(){
      pv.innerHTML = '<p class="small muted tab-intro">The roof, heating and cooling, water heater and electrical panel are never scored and never part of a package total. Education only; have each one inspected. <span class="state state-sample">Sample guidance</span></p><div class="mech">' + est.mechanicals.map(RI.mechCard).join('') + '</div>';
    }
    /* Each room with its photos (guide p59) */
    function roomPhotos(key){
      /* The bedrooms room shows every bedroom's photos: bedrooms, bedrooms-2, ... */
      var ps = []; Object.keys(h.photos || {}).forEach(function(k){ if(k !== key && k.indexOf(key + '-') !== 0) return; h.photos[k].filter(function(p){ return p.state === 'done'; }).forEach(function(p, i){ ps.push([k, i, p]); }); });
      return ps.length ? '<div class="room-photos">' + ps.slice(0, 8).map(function(x, i){ return '<button type="button" class="rp" data-ph="' + x[0] + '|' + x[1] + '" aria-label="Open photo ' + (i + 1) + '"><img src="' + x[2].src + '" alt="" loading="lazy"></button>'; }).join('') + (ps.length > 8 ? '<span class="rp-more">+' + (ps.length - 8) + '</span>' : '') + '</div>' : '';
    }
    function productImg(it){ var m = RI.PRODUCT_IMG[it.id]; return m && m[h.pk] ? RI.img(m[h.pk]) : null; }
    /* Products: a clean card per item, so the user sees what the money buys (guide p59) */
    function viewProducts(){
      var cards = [];
      est.rooms.forEach(function(r){ r.items.forEach(function(it){ if(RI.isHeld(it)) return; var a = it.pk[h.pk]; if(!a || !a[3]) return; cards.push([r, it, a]); }); });
      var tier = RI.PACKAGES.filter(function(x){ return x.key === h.pk; })[0].name;
      pv.innerHTML = '<p class="small muted tab-intro">The products in the ' + tier + ' goal. In the product each one comes from Sam\'s product library, with its own photo. <span class="state state-sample">Representative photos</span></p><div class="prods">' + cards.map(function(c){
        var img = productImg(c[1]), off = !!h.off[c[1].id];
        return '<article class="prod-card' + (off ? ' off' : '') + '"><div class="pc-img">' + (img ? '<img src="' + img + '" alt="" loading="lazy">' : '<span class="pc-ph">' + RI.icon('dot','i-lg') + '<span>' + RI.esc(c[1].trade) + '</span></span>') + '<span class="pc-tier">' + tier + '</span></div>' +
          '<div class="pc-b"><b>' + RI.esc(c[2][3]) + '</b><span class="xsmall muted">' + c[0].name + ' · ' + RI.esc(c[1].name) + '</span><span class="range-txt small">' + RI.range(c[2][1], c[2][2]) + '</span>' + (off ? '<span class="state state-partial">Turned off</span>' : '') + '</div></article>';
      }).join('') + '</div>';
    }
    /* Potential extra costs: conditional work and hidden-condition risks, apart from the base total */
    function viewExtras(){
      pv.innerHTML = '<p class="small muted tab-intro">Work that may be needed if something is found once the job starts. None of it is in any total, and none of it is assumed. A contractor confirms it on site. <span class="state state-sample">Sample list</span></p><ul class="extras">' + RI.EXTRAS.map(function(x){ return '<li><span class="ex-ic">' + RI.icon('warn','i-sm') + '</span><span><b>' + x.t + '</b><span class="small muted">' + x.when + '.</span></span><span class="xsmall muted">' + x.room + '</span></li>'; }).join('') + '</ul>';
    }
    /* Not included: excluded work, stated plainly */
    function viewNotInc(){
      var offs = []; est.rooms.forEach(function(r){ r.items.forEach(function(it){ if(h.off[it.id]) offs.push(r.name + ', ' + it.name.toLowerCase()); }); });
      pv.innerHTML = '<p class="small muted tab-intro">What this estimate does not cover.</p><ul class="notinc">' + RI.NOT_INCLUDED.filter(function(x){ return x !== 'Items you turned off'; }).map(function(x){ return '<li>' + RI.icon('x','i-sm') + '<span>' + x + '</span></li>'; }).join('') +
        '<li>' + RI.icon('x','i-sm') + '<span>Items you turned off' + (offs.length ? ': ' + offs.join('; ') : ' (none right now)') + '</span></li></ul>';
    }
    function viewTasks(){
      var rows = []; est.rooms.forEach(function(r){ r.items.forEach(function(it){ if(RI.isHeld(it) || h.off[it.id]) return; var a = it.pk[h.pk]; if(a[1] == null) return; tasksFor(it, a[0]).forEach(function(t){ rows.push([t[0], t[1], r.name, t[2], a[0]]); }); }); });
      rows.sort(function(a, b){ return a[0].localeCompare(b[0]); });
      pv.innerHTML = '<div class="tasks-head"><p class="small muted">Tasks for the ' + RI.PACKAGES.filter(function(x){ return x.key === h.pk; })[0].name + ' goal, by trade, with net quantities. Turned-off items are left out.</p><button type="button" class="btn btn-secondary btn-sm" id="csv">' + RI.icon('file','i-sm') + 'Download CSV</button></div>' +
        '<div class="scroll-x"><table class="dec tasks-t"><thead><tr><th>Trade</th><th>Task</th><th>Room</th><th>Net quantity</th></tr></thead><tbody>' + rows.map(function(r, i){ return '<tr' + (i && rows[i - 1][0] === r[0] ? '' : ' class="first"') + '><td data-label="Trade">' + (i && rows[i - 1][0] === r[0] ? '' : '<b>' + r[0] + '</b>') + '</td><td data-label="Task">' + RI.esc(r[1]) + '<span class="xsmall muted">' + RI.esc(r[4]) + '</span></td><td data-label="Room">' + r[2] + '</td><td data-label="Net quantity">' + RI.esc(r[3]) + '</td></tr>'; }).join('') + '</tbody></table></div>';
      pv.querySelector('#csv').addEventListener('click', function(){
        var csv = 'Trade,Task,Room,Net quantity,Action\n' + rows.map(function(r){ return r.map(function(c){ return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
        var a = doc.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'})); a.download = A.addr(h).replace(/\W+/g, '-').toLowerCase() + '-tasks.csv'; doc.body.appendChild(a); a.click(); a.remove();
        RI.toast('Task list downloaded.', 'file');
      });
    }
    function show(v){ tab = v; view.querySelectorAll('#views [data-v]').forEach(function(b){ b.setAttribute('aria-selected', b.getAttribute('data-v') === v); }); ({rooms:viewRooms, trades:viewTrades, products:viewProducts, unk:viewUnk, extras:viewExtras, notinc:viewNotInc, sys:viewSys, tasks:viewTasks})[v](); RI.fillIcons(pv); pv.classList.remove('fade'); void pv.offsetWidth; pv.classList.add('fade'); }
    view.querySelector('#views').addEventListener('click', function(e){ var b = e.target.closest('[data-v]'); if(b) show(b.getAttribute('data-v')); });

    function setPk(k){ h.pk = k; save(); seg.querySelectorAll('[data-pk]').forEach(function(b){ b.setAttribute('aria-selected', b.getAttribute('data-pk') === k); }); RI.syncSeg(seg); totals(true); show(tab); }
    seg.addEventListener('click', function(e){ var b = e.target.closest('[data-pk]'); if(b) setPk(b.getAttribute('data-pk')); });
    seg.addEventListener('keydown', function(e){ if(e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; var ks = ['E','S','P'], n = ks[(ks.indexOf(h.pk) + (e.key === 'ArrowRight' ? 1 : 2)) % 3]; setPk(n); seg.querySelector('[data-pk="' + n + '"]').focus(); });

    pv.addEventListener('click', function(e){
      var ph = e.target.closest('[data-ph]'); if(ph){ var kk = ph.getAttribute('data-ph').split('|'), pp = (h.photos[kk[0]] || []).filter(function(x){ return x.state === 'done'; })[+kk[1]]; if(pp) A.dialog(RI.esc(est.rooms.filter(function(r){ return r.key === kk[0]; })[0].name), '<img class="plan-view" src="' + pp.src + '" alt="' + RI.esc(pp.name) + '">', {wide:true}); return; }
      var hd = e.target.closest('.room-head'); if(!hd) return;
      var room = hd.parentNode, k = room.getAttribute('data-room'); open[k] = !open[k]; room.classList.toggle('open', open[k]); hd.setAttribute('aria-expanded', open[k]);
    });
    pv.addEventListener('change', function(e){
      var id = e.target.getAttribute('data-id'); if(!id) return;
      var on = e.target.checked, note = [];
      if(!on){ h.off[id] = true; (RI.DEPS[id] || []).forEach(function(d){ if(!h.off[d[0]]){ h.off[d[0]] = true; note.push(d[1]); } }); }
      else { delete h.off[id]; Object.keys(RI.DEPS).forEach(function(parent){ RI.DEPS[parent].forEach(function(d){ if(d[0] === id && h.off[parent]){ delete h.off[parent]; note.push('Turned back on with it: ' + d[1].toLowerCase()); } }); }); }
      save();
      pv.querySelectorAll('.item[data-item]').forEach(function(row){ var iid = row.getAttribute('data-item'), cb = row.querySelector('input[data-id]'); row.classList.toggle('off', !!h.off[iid]); if(cb) cb.checked = !h.off[iid]; });
      if(note.length) RI.toast((on ? '' : 'Also turned off. ') + note.join(' '), 'info');
      totals(true); refreshRooms();
    });

    /* Share */
    view.querySelector('#share').addEventListener('click', function(){
      function link(sh){ return location.origin + location.pathname.replace(/app\/.*$/, '') + 's/?t=' + sh.token; }
      function body(){
        var sh = (h.shares || []).filter(function(x){ return x.active; })[0];
        return sh ? '<p>Anyone with this link can see the presentation, read-only. It is not shown in search engines.</p><div class="share-row"><input class="input" id="sh-url" readonly value="' + link(sh) + '"><button type="button" class="btn btn-primary" id="sh-copy">Copy</button></div>' +
          '<div class="cta-row" style="justify-content:space-between"><a class="textlink" href="' + link(sh) + '" target="_blank" rel="noopener">Open the share view</a><button type="button" class="linkbtn" id="sh-off">Turn off this link</button></div><p class="xsmall muted">Created ' + A.date(sh.created) + '. Shows the ' + RI.PACKAGES.filter(function(x){ return x.key === h.pk; })[0].name + ' goal and every item you have on.</p>'
          : '<p>Create a private, read-only link for a partner, an agent or a lender. You can turn it off at any time.</p><button type="button" class="btn btn-primary" id="sh-make">' + RI.icon('share','i-sm') + 'Create a share link</button>' + ((h.shares || []).length ? '<p class="xsmall muted">' + h.shares.length + ' earlier link' + (h.shares.length > 1 ? 's are' : ' is') + ' turned off.</p>' : '');
      }
      var d = A.dialog('Share this presentation', '<div id="sh-b">' + body() + '</div>');
      d.addEventListener('click', function(e){
        if(e.target.closest('#sh-make')){ h.shares = h.shares || []; h.shares.push({token:A.uid('s') + A.uid(''), created:Date.now(), active:true, forName:h.client || A.me().name}); save(); RI.track('share_created', {house:h.id}); d.querySelector('#sh-b').innerHTML = body(); RI.fillIcons(d); RI.toast('Share link created.', 'share'); }
        if(e.target.closest('#sh-copy')){ var u = d.querySelector('#sh-url'); u.select(); (navigator.clipboard ? navigator.clipboard.writeText(u.value) : Promise.reject()).then(function(){ RI.toast('Link copied.', 'share'); }, function(){ doc.execCommand && doc.execCommand('copy'); RI.toast('Link copied.', 'share'); }); }
        if(e.target.closest('#sh-off')){ h.shares.forEach(function(x){ x.active = false; }); save(); d.querySelector('#sh-b').innerHTML = body(); RI.fillIcons(d); RI.toast('The link is turned off. Anyone who opens it sees that it has expired.'); }
      });
    });
    /* PDF through the browser's print dialog, with every room open */
    view.querySelector('#pdf').addEventListener('click', function(){
      if(tab !== 'rooms') show('rooms');
      pv.querySelectorAll('.room').forEach(function(r){ r.classList.add('open'); });
      RI.toast('Choose "Save as PDF" in the print dialog.', 'file');
      RI.track('pdf_downloaded', {house:h.id}); setTimeout(function(){ window.print(); }, 400);
    });
    /* Feedback */
    function fbInline(){
      var fb = h.feedback;
      view.querySelector('#fb-inline').innerHTML = fb ? '<div class="fb-done">' + RI.icon('check') + '<span><b>Thank you for your feedback.</b> You said: ' + RI.esc(fb.v) + (fb.note ? '. "' + RI.esc(fb.note) + '"' : '.') + '</span><button type="button" class="linkbtn" id="fb-edit">Change</button></div>'
        : '<div class="fb-ask"><b>Was this estimate useful?</b><div class="fb-opts">' + ['Yes','Somewhat','No'].map(function(v){ return '<button type="button" class="btn btn-secondary btn-sm" data-fbv="' + v + '">' + v + '</button>'; }).join('') + '</div></div>';
      RI.fillIcons(view.querySelector('#fb-inline'));
    }
    function fbDialog(v){
      var d = A.dialog('Your feedback', '<div class="seg-pick" id="fbv">' + ['Yes','Somewhat','No'].map(function(x){ return '<label><input type="radio" name="fbv" value="' + x + '"' + ((v || (h.feedback || {}).v) === x ? ' checked' : '') + '><span>' + (x === 'Yes' ? 'Useful' : x === 'No' ? 'Not useful' : 'Somewhat useful') + '</span></label>'; }).join('') + '</div><div class="field"><label for="fb-note">What would make it better? <span class="opt">(optional)</span></label><textarea class="input" id="fb-note" rows="4">' + RI.esc((h.feedback || {}).note || '') + '</textarea></div><div class="cta-row" style="justify-content:flex-end"><button type="button" class="btn btn-primary" id="fb-send">Send feedback</button></div>');
      d.querySelector('#fb-send').addEventListener('click', function(){ var c = d.querySelector('input[name=fbv]:checked'); if(!c){ RI.toast('Choose one of the three answers.', 'warn'); return; } h.feedback = {v:c.value, note:d.querySelector('#fb-note').value.trim(), at:Date.now()}; save(); RI.track('feedback_sent', {v:c.value}); d.close(); fbInline(); RI.toast('Thank you. Your feedback goes to Sam\'s team.'); });
    }
    view.querySelector('#fb').addEventListener('click', function(){ fbDialog(); });
    view.querySelector('#fb-inline').addEventListener('click', function(e){ var b = e.target.closest('[data-fbv]'); if(b) fbDialog(b.getAttribute('data-fbv')); if(e.target.closest('#fb-edit')) fbDialog(); });

    view.querySelector('#pr-reset').addEventListener('click', function(){ h.off = {}; save(); totals(true); show(tab); RI.toast('All items are back on.'); });
    totals(false); show('rooms'); fbInline();
    requestAnimationFrame(function(){ RI.syncSeg(seg); });
  }, {nav:'houses'});
})();
