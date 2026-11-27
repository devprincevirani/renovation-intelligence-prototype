/* App, milestone 4: checkout (simulated), payment received, the presentation, share, PDF, feedback,
   builder task lists. The presentation is the paid screen (docs/APP_FLOW.md 6.6). */
(function(){
  var RI = window.RI, A = RI.App, doc = document;
  A.hasCheckout = true;
  /* The price comes from RI.OFFERS through A.priceFor, the same value as on the price page */

  /* ---------- Checkout (simulated Stripe Checkout) ---------- */
  A.route('/houses/:id/checkout', function(view, p){
    var h = A.get(p.id); if(!h){ view.innerHTML = A.notFound(); return; }
    var runPay = /[?&]run=1/.test(location.hash);  /* paying at the free-report limit runs the house (guide p58) */
    if(A.status(h) === 'open'){ A.go('#/houses/' + h.id + '/presentation'); return; }
    if(A.status(h) !== 'ready' && !(runPay && A.status(h) === 'draft')){ A.go('#/houses/' + h.id); return; }
    var s = A.me(), cov = A.cover(h), PRICE = A.priceFor(h).amount; RI.track('checkout_started', {house:h.id});
    /* Referral credit (business model 3): offered here, on by default, never more than the price */
    var CREDIT = RI.Ref ? Math.min(RI.Ref.balance(s.email), PRICE) : 0, useCredit = CREDIT > 0;
    var total = function(){ return PRICE - (useCredit ? CREDIT : 0); };
    var exit = doc.getElementById('focus-exit'); if(exit) exit.innerHTML = '<a class="exit-btn" href="#/houses/' + h.id + '" aria-label="Cancel and go back to the house"><span class="eb-l">Cancel</span>' + RI.icon('x','i-sm') + '</a>';
    view.innerHTML = '<div class="app-wrap co-wrap"><div class="co-demo">' + RI.icon('info','i-sm') + '<span><b>Demo checkout.</b> In the product this is Stripe\'s own secure page. No real payment is taken here.</span></div>' +
      '<div class="co">' +
      '<section class="co-sum"><p class="label">Your order</p><div class="co-house">' + (cov ? '<img src="' + cov + '" alt="">' : '') + '<div><b>' + RI.esc(A.addr(h)) + '</b><span class="small muted">' + RI.esc(A.place(h)) + '</span></div></div>' +
        '<h1>The full presentation</h1><ul class="ticks"><li>' + RI.icon('check') + '<span>Every room and trade, with products</span></li><li>' + RI.icon('check') + '<span>Switch goals, turn items on or off</span></li><li>' + RI.icon('check') + '<span>House systems guidance</span></li><li>' + RI.icon('check') + '<span>PDF and a private share link</span></li></ul>' +
        '<dl class="co-tot"><div><dt>One payment for this house</dt><dd>$' + PRICE + '.00</dd></div>' +
          (CREDIT ? '<div class="co-credit"><dt><label class="check"><input type="checkbox" id="c-credit" checked><span>Use my referral credit</span></label></dt><dd id="c-credit-v">−$' + CREDIT + '.00</dd></div>' : '') +
          '<div class="tot"><dt>Total today</dt><dd id="c-total">$' + total() + '.00</dd></div></dl><p class="xsmall muted">Sample price. The presentation stays available after you pay. This is an estimate for planning, not a contractor\'s bid.</p></section>' +
      '<section class="co-pay" id="co-pay"><h2>Pay with card</h2><form class="form-grid" id="card" novalidate>' +
        '<div class="field"><label for="c-em">Email</label><input class="input" id="c-em" type="email" value="' + RI.esc(s.email) + '" autocomplete="email"></div>' +
        '<div class="field"><label for="c-no">Card number</label><div class="card-in"><input class="input" id="c-no" inputmode="numeric" autocomplete="cc-number" value="4242 4242 4242 4242"><span class="brands"><i>VISA</i><i>MC</i></span></div><span class="help">Demo card. Use any card number; nothing is charged.</span><span class="err"></span></div>' +
        '<div class="grid-3"><div class="field"><label for="c-ex">Expiry</label><input class="input" id="c-ex" inputmode="numeric" autocomplete="cc-exp" value="12 / 30"></div><div class="field"><label for="c-cv">CVC</label><input class="input" id="c-cv" inputmode="numeric" autocomplete="cc-csc" value="123"></div><div class="field"><label for="c-zip">ZIP</label><input class="input" id="c-zip" inputmode="numeric" value="' + RI.esc((h.addr || {}).zip || '') + '"></div></div>' +
        '<div class="notice notice-bad" id="c-err" hidden role="alert"></div>' +
        '<button type="submit" class="btn btn-primary btn-block" id="c-pay">' + RI.icon('lock','i-sm') + 'Pay $' + total() + '.00</button>' +
        '<p class="co-secure">' + RI.icon('shield','i-sm') + 'Payments are handled by Stripe. Card details never reach our servers.</p>' +
        '<div class="cta-row" style="justify-content:space-between"><a href="#/houses/' + h.id + '" class="textlink">Cancel and go back</a><button type="button" class="linkbtn small" id="decline">Demo: try a declined card</button></div>' +
      '</form></section></div></div>';
    var declined = false;
    view.querySelector('#decline').addEventListener('click', function(){ declined = true; RI.toast('The next payment will be declined, to show that state.', 'info'); });
    var cc = view.querySelector('#c-credit');
    if(cc) cc.addEventListener('change', function(){
      useCredit = cc.checked;
      view.querySelector('#c-credit-v').classList.toggle('off', !useCredit);
      view.querySelector('#c-total').textContent = '$' + total() + '.00';
      view.querySelector('#c-pay').innerHTML = RI.icon('lock','i-sm') + 'Pay $' + total() + '.00';
    });
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
        if(RI.Ref){
          if(useCredit && CREDIT) RI.Ref.spend(s.email, CREDIT, 'Report: ' + A.addr(h));
          RI.Ref.purchase(s.email, 'report'); /* if a referral brought this person here, its hold for refunds starts now */
        }
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
    /* Task lists come with Pro (Sam, Nov 27): Pro = everything in the $50 report + task lists */
    var pro = A.proOn(), open = {}, held = A.heldCount(est), tab = 'rooms';
    open[est.rooms[0].key] = true;
    view.innerHTML = '<div class="app-wrap pres">' +
      '<a class="back" href="#/houses/' + h.id + '">' + RI.icon('arrow','i-sm flip') + 'Price by package</a>' +
      '<header class="pr-head">' + (A.cover(h) ? '<img class="pr-photo" src="' + A.cover(h) + '" alt="' + RI.esc(A.addr(h)) + '">' : '') + '<div class="pr-ht"><p class="label">Presentation' + (h.version > 1 ? ' · version ' + h.version : '') + '</p><h1>' + RI.esc(A.addr(h)) + '</h1><p class="muted small">' + RI.esc(A.place(h)) + ' · ' + RI.esc(h.title || '') + '</p><p class="xsmall muted">Based on: ' + A.photoCount(h) + ' photos' + (Object.keys(h.sizes || {}).length ? ' and your room sizes' : '') + ', as of ' + A.date(h.run.start) + '. Prepared for ' + RI.esc(h.client || A.me().name) + '.</p></div>' +
        '<div class="pr-actions"><button type="button" class="btn btn-secondary btn-sm" id="share">' + RI.icon('share','i-sm') + 'Share</button><button type="button" class="btn btn-secondary btn-sm" id="pdf">' + RI.icon('file','i-sm') + 'PDF</button><button type="button" class="btn btn-secondary btn-sm" id="fb">Feedback</button></div>' + (A.proOn() ? '<p class="pro-free">' + RI.icon('check','i-sm') + 'Downloads, shares and fixes to this house use no credit.</p>' : '') + '</header>' +
      '<div class="pr-layout"><aside class="pr-side" id="pr-bar" aria-label="Package and total"><div class="pr-side-in"><div class="seg" role="tablist" aria-label="Package" id="pk"><span class="seg-thumb"></span>' + RI.PACKAGES.map(function(x){ return '<button type="button" role="tab" data-pk="' + x.key + '" aria-selected="' + (x.key === h.pk) + '">' + x.name + '</button>'; }).join('') + '</div>' +
        '<span class="small muted pr-goal" id="pr-goal"></span><div class="pr-total" aria-live="polite"><span class="lbl"><span id="pr-off"></span>' + (held.u + held.m ? '<span class="state state-partial">Partial</span>' : '') + '</span><span class="range-txt" id="pr-tot"></span><div data-scale="0,1"><div class="rl' + (held.u + held.m ? ' partial' : '') + '" id="pr-rl" data-low="0" data-high="0"></div></div></div><button type="button" class="linkbtn small pr-reset" id="pr-reset">Turn all items on</button></div></aside><div class="pr-main">' +
      '<div class="tabs-s" role="tablist" aria-label="Views" id="views">' + [['rooms','Rooms'],['trades','Trades'],['products','Products'],['unk','Not confirmed <span class="n' + (held.u + held.m ? ' n-warn n-pulse' : '') + '">' + (held.u + held.m) + '</span>'],['extras','Potential extra costs'],['notinc','Not included'],['sys','House systems']].concat(pro ? [['tasks','Task lists']] : []).map(function(t, i){ return '<button role="tab" data-v="' + t[0] + '" aria-selected="' + (i === 0) + '">' + t[1] + '</button>'; }).join('') + '</div>' +
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
      if(RI.isHeld(it)) return '<div class="item hold"><div><span class="nm">' + RI.esc(it.name) + '</span><div class="fix">' + RI.icon('info','i-sm') + ' ' + RI.esc(it.fix) + ' would settle it.</div></div>' + heldTag(it) + '<span class="amt muted small">Not in the total</span></div>';
      var a = it.pk[h.pk], keep = a[1] == null, off = !!h.off[it.id];
      return '<div class="item' + (off ? ' off' : '') + '" data-item="' + it.id + '"><div><span class="nm">' + RI.esc(it.name) + '</span><div class="act">' + RI.esc(a[0]) + '</div><details class="rc-det"><summary>Details</summary><span>' + RI.esc(it.qty) + ' · ' + RI.esc(it.trade) + '</span></details><div class="meta">' + (a[3] ? '<span class="prod">' + (productImg(it) ? '<img class="prod-th" src="' + productImg(it) + '" alt="">' : RI.icon('dot','i-sm')) + RI.esc(a[3]) + '</span>' : '') + '</div></div>' +
        (keep ? '<span></span><span class="amt muted small">Keep, no cost</span>' : '<label class="switch sw"><input type="checkbox" data-id="' + it.id + '"' + (off ? '' : ' checked') + '><span class="track"></span><span class="sr">Include ' + RI.esc(it.name) + '</span></label><span class="amt range-txt">' + RI.range(a[1], a[2]) + '</span>') + '</div>';
    }
    /* What this buys (Sam, meeting of Nov 2026): the room's range broken into the things it pays for, each with
       its product, the kind of work and its own range, biggest first. Kept parts fold away; held lines stay out of the sum. */
    var end = h.end === 'hi' ? 'hi' : 'lo'; /* Low or High: the end of each line shown, with its own product */
    function buyLine(it){
      return RI.RoomCard.buyRow(it, h.pk, end, {sw:true, off:!!h.off[it.id], img:RI.RoomCard.endImg(it, h.pk, end) || productImg(it)});
    }
    function heldLine(it){
      return RI.RoomCard.heldRow(it, '#/houses/' + h.id + '/intake/rooms');
    }
    function buysSum(r){
      var on = 0, offN = 0, held = 0;
      r.items.forEach(function(it){ if(RI.isHeld(it)){ held++; return; } var a = it.pk[h.pk]; if(!a || a[1] == null) return; if(h.off[it.id]) offN++; else on++; });
      var t = RI.totals(h.pk, h.off, r.key), v = RI.money(end === 'hi' ? t.high : t.low), w = end === 'hi' ? 'high' : 'low';
      var s = on === 0 ? 'Nothing is priced in this room right now.' : on === 1 ? 'At the ' + w + ' end, this one item comes to ' + v + '.' : 'At the ' + w + ' end, these ' + on + ' items come to ' + v + '.';
      return s + (offN ? ' ' + offN + ' turned off.' : '') + (held ? ' ' + held + ' not priced yet, left out.' : '');
    }
    /* The room's two ends as the switch at the top of the card (only when something in it is priced) */
    function endsFor(r){
      if(!r.items.some(function(it){ return !RI.isHeld(it) && it.pk[h.pk] && it.pk[h.pk][1] != null; })) return '';
      var t = RI.totals(h.pk, h.off, r.key); return RI.RoomCard.endsSwitch(end, t.low, t.high);
    }
    function buysHtml(r){
      var priced = [], kept = [], held = [];
      r.items.forEach(function(it){ if(RI.isHeld(it)) held.push(it); else if(!it.pk[h.pk] || it.pk[h.pk][1] == null) kept.push(it); else priced.push(it); });
      priced.sort(function(a, b){ return b.pk[h.pk][2] - a.pk[h.pk][2]; });
      return '<section class="wb" aria-label="What this buys">' + RI.RoomCard.buysHead(end, priced.length > 0, held.length) +
        (priced.length ? '<ul class="wb-list">' + priced.map(buyLine).join('') + '</ul>' : '<p class="small muted">Nothing to buy here under this goal.</p>') +
        '<p class="wb-sum">' + buysSum(r) + '</p>' +
        (held.length ? '<ul class="wb-list wb-held">' + held.map(heldLine).join('') + '</ul>' : '') +
        (kept.length ? '<details class="wb-kept"><summary>Kept as is, no cost · ' + kept.length + ' item' + (kept.length === 1 ? '' : 's') + '</summary><ul>' + kept.map(function(it){ var a = it.pk[h.pk]; return '<li><b>' + RI.esc(it.name) + '</b>' + (a && a[0] ? '<span class="xsmall muted">' + RI.esc(a[0]) + '</span>' : '') + '</li>'; }).join('') + '</ul></details>' : '') +
        RI.RoomCard.sampleNote() +
        '</section>';
    }
    function roomHead(r){
      var t = RI.totals(h.pk, h.off, r.key), hasHeld = r.items.some(RI.isHeld);
      return '<button type="button" class="room-head" aria-expanded="' + !!open[r.key] + '"><span><span class="rh-title">' + r.name + '</span><span class="sub">' + r.sub + (hasHeld ? ' · partial' : '') + '</span></span><span data-scale="0,' + Math.max(10000, Math.ceil(RI.totals('P', {}, r.key).high / 5000) * 5000) + '"><span class="rl' + (hasHeld ? ' partial' : '') + '" data-low="' + t.low + '" data-high="' + t.high + '"></span></span><span class="range-txt">' + (t.high ? RI.range(t.low, t.high) : '<span class="muted">' + (hasHeld ? 'Not priced yet' : 'No cost') + '</span>') + '</span><span class="chev" aria-hidden="true"></span></button>';
    }
    var plan;
    var selRoom = est.rooms[0].key;
    function roomRange(r){ var t = RI.totals(h.pk, h.off, r.key), hh = r.items.some(RI.isHeld); return (t.high ? RI.range(t.low, t.high) : '<span class="muted">No cost</span>') + (hh ? ' <span class="state state-partial">Partial</span>' : ''); }
    function roomPhoto(key){ var ps = []; Object.keys(h.photos || {}).forEach(function(k){ if(k === key || k.indexOf(key + '-') === 0) h.photos[k].forEach(function(p){ if(p.state === 'done') ps.push(p.src); }); }); return ps[0] || null; }
    function viewRooms(){
      var r = est.rooms.filter(function(x){ return x.key === selRoom; })[0] || est.rooms[0];
      pv.innerHTML = '<div class="rc-picker" role="group" aria-label="Rooms">' + est.rooms.map(function(x){ return '<button type="button" class="rc-chip" data-pick="' + x.key + '" aria-pressed="' + (x.key === r.key) + '">' + x.name + '</button>'; }).join('') + '</div>' +
        '<div id="pv-card">' + RI.RoomCard.html(r, h.pk, {photo:roomPhoto(r.key), range:roomRange(r), buysHtml:buysHtml(r), ends:endsFor(r)}) + '</div>' +
        '<div class="pr-rooms" style="margin-top:20px"><div class="pr-plan card" id="pr-plan"></div></div>';
      RI.RoomCard.wire(pv);
      plan = RI.Plan.mount(pv.querySelector('#pr-plan'), {onSelect:function(k){ if(k !== selRoom){ selRoom = k; drawCard('room'); } }});
      plan.update(h.pk, h.off, r.key);
      RI.initRanges(pv); pv.querySelectorAll('.rl').forEach(function(x){ x.classList.add('drawn'); }); RI.RoomCard.settle(pv);
    }
    /* Another room, or new numbers for this one, without a blink (user, Nov 2026): only the room card changes, a
       skeleton holds its place when the room changes, and the photo stays when it is the same picture */
    function drawCard(how){
      var r = est.rooms.filter(function(x){ return x.key === selRoom; })[0] || est.rooms[0], box = pv.querySelector('#pv-card');
      if(!box){ viewRooms(); return; }
      pv.querySelectorAll('.rc-picker [data-pick]').forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-pick') === r.key); });
      if(plan) plan.update(h.pk, h.off, r.key);
      RI.RoomCard.swap(box, function(){ var o = box.querySelector('.wb'), y = o && how !== 'room' ? o.scrollTop : 0; box.innerHTML = RI.RoomCard.html(r, h.pk, {photo:roomPhoto(r.key), range:roomRange(r), buysHtml:buysHtml(r), ends:endsFor(r)}); RI.fillIcons(box); var n = box.querySelector('.wb'); if(n && y) n.scrollTop = y; }, {sk:how === 'room' ? 'room' : null, keep:'.rc-photo img'});
    }
    /* Low end or High end: the two buttons switch at once, the list under them fades in with that end's products */
    function drawEnd(){
      var r = est.rooms.filter(function(x){ return x.key === selRoom; })[0] || est.rooms[0], wb = pv.querySelector('#pv-card .wb');
      pv.querySelectorAll('.rc-ends [data-end]').forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-end') === end); });
      if(wb) RI.RoomCard.swapEl(wb, buysHtml(r));
    }
    function refreshRooms(){
      if(tab !== 'rooms') return;
      var r = est.rooms.filter(function(x){ return x.key === selRoom; })[0], el = pv.querySelector('.rc-range'); if(el && r) el.innerHTML = roomRange(r);
      var sm = pv.querySelector('.wb-sum'); if(sm && r) sm.textContent = buysSum(r);
      var eb = pv.querySelectorAll('.rc-ends [data-end] b'); if(eb.length === 2 && r){ var tt = RI.totals(h.pk, h.off, r.key); eb[0].textContent = RI.money(tt.low); eb[1].textContent = RI.money(tt.high); }
      if(plan) plan.update(h.pk, h.off, selRoom);
    }
    /* The trade view (user, Nov 2026; APP_FLOW 6.6 "trade view with items on and off"): grouped by trade (painting, flooring, plumbing…; GLOSSARY), never by place; each line
       is a room with its part, net quantity and action, its Low to High and an on/off switch. A line turned off stays,
       muted; lines not priced yet come last with what would settle them. The trades add up to the rooms' total. */
    function viewTrades(keep){
      var openG = keep ? [].slice.call(pv.querySelectorAll('.tv-g[open]')).map(function(d){ return d.getAttribute('data-g'); }) : [];
      var by = {}, order = RI.TRADES.map(function(g){ return g[0]; });
      est.rooms.forEach(function(r){ r.items.forEach(function(it){
        var a = it.pk[h.pk], held = RI.isHeld(it); if(!held && (!a || a[1] == null)) return;
        var g = RI.tradeOf(it), t = by[g] = by[g] || {lo:0, hi:0, lines:[], held:0, rooms:{}};
        t.rooms[r.key] = 1; t.lines.push([r, it]); if(held){ t.held++; return; } if(!h.off[it.id]){ t.lo += a[1]; t.hi += a[2]; }
      }); });
      var keys = Object.keys(by).sort(function(a, b){ return by[b].hi - by[a].hi || order.indexOf(a) - order.indexOf(b); }), mx = Math.max.apply(null, keys.map(function(k){ return by[k].hi; })) || 1;
      var part = function(it){ return RI.esc((RI.ITEM_PART && RI.ITEM_PART[it.id]) || it.name); };
      /* one: the trade covers a single room, so the part is the title and the room moves under it */
      function line(r, it, one){
        var a = it.pk[h.pk], off = !!h.off[it.id];
        if(RI.isHeld(it)){
          var why = it.fix ? RI.esc(it.fix) + ' would settle it' : '';
          return '<li class="tv-r held"><span><b>' + (one ? RI.esc(it.name) : RI.esc(r.name)) + '</b><small>' + (one ? RI.esc(r.name) : RI.esc(it.name)) + (why ? ' · ' + why : '') + '</small></span><span class="p">' + heldTag(it) + '<span class="offt">Not in the total</span></span></li>';
        }
        var title = one ? part(it) : RI.esc(r.name), sub = (one ? RI.esc(r.name) : part(it)) + ' · ' + RI.esc(it.qty) + ' · ' + RI.esc(a[0]);
        return '<li class="tv-r' + (off ? ' off' : '') + '" data-item="' + it.id + '"><span><b>' + title + '</b><small>' + sub + '</small></span>' +
          '<span class="p"><span class="v range-txt">' + RI.range(a[1], a[2]) + '</span>' + (off ? '<span class="offt">Turned off</span>' : '') + '</span>' +
          '<label class="switch sw"><input type="checkbox" data-id="' + it.id + '"' + (off ? '' : ' checked') + '><span class="track"></span><span class="sr">Include ' + RI.esc(r.name) + ', ' + part(it).toLowerCase() + '</span></label></li>';
      }
      var t = RI.totals(h.pk, h.off), n = keys.length;
      pv.innerHTML = '<p class="small muted tab-intro">The same work, grouped by trade. Turn any item on or off here or in Rooms.</p><div class="tv" data-scale="0,' + mx + '">' + keys.map(function(k){
        var g = by[k], nr = Object.keys(g.rooms).length;
        g.lines.sort(function(x, y){ var hx = RI.isHeld(x[1]) ? 1 : 0, hy = RI.isHeld(y[1]) ? 1 : 0; return hx - hy || ((y[1].pk[h.pk] || [])[2] || 0) - ((x[1].pk[h.pk] || [])[2] || 0); });
        return '<details class="tv-g" data-g="' + RI.esc(k) + '"' + (openG.indexOf(k) >= 0 ? ' open' : '') + '><summary><span class="tv-n"><b>' + RI.esc(k) + '</b><small>' + nr + ' room' + (nr === 1 ? '' : 's') + (g.held ? ' · ' + g.held + ' not priced yet' : '') + '</small></span>' +
          '<span class="rl" data-low="' + g.lo + '" data-high="' + g.hi + '"></span><span class="tv-amt range-txt">' + (g.hi ? RI.range(g.lo, g.hi) : 'Not priced yet') + '</span><span class="tv-chev" aria-hidden="true"></span></summary>' +
          /* option F (user, Nov 2026): column names, the lines, then a total line that ends the trade, like a bill */
          '<div class="tv-body"><div class="tv-cols" aria-hidden="true"><span>' + (nr === 1 ? 'Work' : 'Room and work') + '</span><span>Low to High</span><span>Include</span></div>' +
          '<ul class="tv-l">' + g.lines.map(function(l){ return line(l[0], l[1], nr === 1); }).join('') + '</ul>' +
          '<div class="tv-tot"><span>Total ' + RI.esc(k.charAt(0).toLowerCase() + k.slice(1)) + (g.held ? '<small>' + g.held + ' line' + (g.held === 1 ? '' : 's') + ' not priced yet, left out</small>' : '') + '</span><span class="range-txt">' + (g.hi ? RI.range(g.lo, g.hi) : 'Not priced yet') + '</span></div>' +
          '<button type="button" class="tv-close" data-tv-close>Close ' + RI.esc(k.charAt(0).toLowerCase() + k.slice(1)) + '<span class="tv-chev up" aria-hidden="true"></span></button></div></details>';
      }).join('') + '</div><p class="tv-sum">These ' + n + ' trade' + (n === 1 ? '' : 's') + ' add up to <b class="range-txt">' + RI.range(t.low, t.high) + '</b>, the same as your rooms. Each part is counted once.</p>';
      RI.initRanges(pv); pv.querySelectorAll('.rl').forEach(function(x){ x.classList.add('drawn'); });
    }
    function viewUnk(){
      var list = []; est.rooms.forEach(function(r){ r.items.forEach(function(it){ if(RI.isHeld(it)) list.push([r, it]); }); });
      pv.innerHTML = list.length ? '<p class="small muted tab-intro">Left out of every total, never shown as zero. Add what is missing and the house runs again as a new version.' + (A.proOn() ? ' No credit used.' : '') + '</p><ul class="unk">' + list.map(function(x){ var ph = x[1].state === 'unverified'; return '<li>' + heldTag(x[1]) + '<span><b>' + x[0].name + ', ' + x[1].name.toLowerCase() + '</b><span class="small muted">' + RI.esc(x[1].fix) + ' would settle it.</span></span><a class="btn btn-secondary btn-sm" href="#/houses/' + h.id + '/intake/' + (ph ? 'photos' : 'measurements') + '">' + (ph ? 'Add the photo' : 'Add the size') + '</a></li>'; }).join('') + '</ul>' : '<div class="empty-s">' + RI.icon('check') + '<p>Every line in this house is priced.</p></div>';
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
    /* Task lists (user, Nov 27 2026: "too much scrolling"): the Trades tab's open-and-close trade groups; each piece of
       work is one row (room and net quantity beside it) with its tasks as a numbered line, not one table row per task.
       Trades stay open across a package switch. The CSV keeps one row per task. */
    function viewTasks(){
      var openG = [].slice.call(pv.querySelectorAll('.tk .tv-g[open]')).map(function(d){ return d.getAttribute('data-g'); });
      var work = []; est.rooms.forEach(function(r){ r.items.forEach(function(it){ if(RI.isHeld(it) || h.off[it.id]) return; var a = it.pk[h.pk]; if(a[1] == null) return; work.push({trade:it.trade, room:r.name, act:a[0], qty:it.qty, steps:tasksFor(it, a[0]).map(function(t){ return t[1]; })}); }); });
      work.sort(function(a, b){ return a.trade.localeCompare(b.trade); });
      var rows = [], groups = [];
      work.forEach(function(w){
        w.steps.forEach(function(s){ rows.push([w.trade, s, w.room, w.qty, w.act]); });
        var g = groups[groups.length - 1]; if(!g || g.trade !== w.trade){ g = {trade:w.trade, work:[], rooms:{}, n:0}; groups.push(g); }
        g.work.push(w); g.rooms[w.room] = 1; g.n += w.steps.length;
      });
      var pkName = RI.PACKAGES.filter(function(x){ return x.key === h.pk; })[0].name, plural = function(n, w){ return n + ' ' + w + (n === 1 ? '' : 's'); };
      var lower = function(s){ return s.charAt(0).toLowerCase() + s.slice(1); };
      function row(w){
        var steps = w.steps.length === 1 && w.steps[0] === w.act ? '' : '<ol class="tk-steps">' + w.steps.map(function(s){ return '<li>' + RI.esc(s) + '</li>'; }).join('') + '</ol>';
        return '<li class="tk-i"><div class="tk-top"><b>' + RI.esc(w.act) + '</b><span class="tk-where">' + RI.esc(w.room) + ' · ' + RI.esc(w.qty) + '</span></div>' + steps + '</li>';
      }
      pv.innerHTML = '<div class="tasks-head"><p class="small muted">Tasks for the ' + pkName + ' goal, by trade, with net quantities. Turned-off items are left out.</p>' +
        (groups.length ? '<div class="tasks-act"><button type="button" class="linkbtn small" id="tk-all" aria-controls="tk-list">Open all</button><button type="button" class="btn btn-secondary btn-sm" id="csv">' + RI.icon('file','i-sm') + 'Download CSV</button></div>' : '') + '</div>' +
        (groups.length ? '<div class="tv tk" id="tk-list">' + groups.map(function(g){
          var rk = Object.keys(g.rooms);
          return '<details class="tv-g" data-g="' + RI.esc(g.trade) + '"' + (openG.indexOf(g.trade) >= 0 ? ' open' : '') + '><summary><span class="tv-n"><b>' + RI.esc(g.trade) + '</b><small>' + plural(g.work.length, 'item') + ' · ' + plural(g.n, 'task') + ' · ' + (rk.length === 1 ? RI.esc(rk[0]) : rk.length + ' rooms') + '</small></span><span class="tv-chev" aria-hidden="true"></span></summary>' +
            '<div class="tv-body"><ul class="tk-l">' + g.work.map(row).join('') + '</ul>' +
            '<button type="button" class="tv-close" data-tv-close>Close ' + RI.esc(lower(g.trade)) + '<span class="tv-chev up" aria-hidden="true"></span></button></div></details>';
        }).join('') + '</div>' : '<p class="tk-empty small">Nothing to list for the ' + pkName + ' goal. Every item is turned off or not priced yet.</p>');
      if(!groups.length) return;
      var list = pv.querySelector('#tk-list'), all = pv.querySelector('#tk-all'), ds = list.querySelectorAll('.tv-g');
      function sync(){ var shut = [].some.call(ds, function(d){ return !d.open; }); all.textContent = shut ? 'Open all' : 'Close all'; all.setAttribute('aria-expanded', !shut); }
      list.addEventListener('toggle', sync, true); sync();
      all.addEventListener('click', function(){ var shut = [].some.call(ds, function(d){ return !d.open; }); [].forEach.call(ds, function(d){ d.open = shut; }); });
      pv.querySelector('#csv').addEventListener('click', function(){
        var csv = 'Trade,Task,Room,Net quantity,Action\n' + rows.map(function(r){ return r.map(function(c){ return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
        var a = doc.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'})); a.download = A.addr(h).replace(/\W+/g, '-').toLowerCase() + '-tasks.csv'; doc.body.appendChild(a); a.click(); a.remove();
        RI.toast('Task list downloaded.', 'file');
      });
    }
    /* how: 'sk' another tab (a skeleton for a beat, then the view fades in), 'fade' new numbers on the same view,
       nothing for the first draw */
    function show(v, how){
      tab = v; view.querySelectorAll('#views [data-v]').forEach(function(b){ b.setAttribute('aria-selected', b.getAttribute('data-v') === v); });
      /* opening Not confirmed stops the badge's pulse early */
      if(v === 'unk'){ var nb = view.querySelector('#views .n-pulse'); if(nb) nb.classList.remove('n-pulse'); }
      var fill = function(){ ({rooms:viewRooms, trades:viewTrades, products:viewProducts, unk:viewUnk, extras:viewExtras, notinc:viewNotInc, sys:viewSys, tasks:viewTasks})[v](); RI.fillIcons(pv); };
      if(!how) return fill();
      if(how === 'fade' && v === 'rooms' && pv.querySelector('#pv-card')) return drawCard();
      RI.RoomCard.swap(pv, fill, {sk:how === 'sk' ? (v === 'rooms' ? 'rooms' : 'list') : null});
    }
    view.querySelector('#views').addEventListener('click', function(e){ var b = e.target.closest('[data-v]'); if(b && b.getAttribute('data-v') !== tab) show(b.getAttribute('data-v'), 'sk'); });

    function setPk(k){ h.pk = k; save(); seg.querySelectorAll('[data-pk]').forEach(function(b){ b.setAttribute('aria-selected', b.getAttribute('data-pk') === k); }); RI.syncSeg(seg); totals(true); show(tab, 'fade'); }
    seg.addEventListener('click', function(e){ var b = e.target.closest('[data-pk]'); if(b) setPk(b.getAttribute('data-pk')); });
    seg.addEventListener('keydown', function(e){ if(e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; var ks = ['E','S','P'], n = ks[(ks.indexOf(h.pk) + (e.key === 'ArrowRight' ? 1 : 2)) % 3]; setPk(n); seg.querySelector('[data-pk="' + n + '"]').focus(); });

    pv.addEventListener('click', function(e){
      /* the close row at the end of an open trade: closes it, keeps its header in view and the focus on it */
      var tc = e.target.closest('[data-tv-close]'); if(tc){ var dg = tc.closest('details'), sm = dg.querySelector('summary'); dg.open = false; if(sm.getBoundingClientRect().top < 80) sm.scrollIntoView({block:'center', behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}); sm.focus({preventScroll:true}); return; }
      var ph = e.target.closest('[data-ph]'); if(ph){ var kk = ph.getAttribute('data-ph').split('|'), pp = (h.photos[kk[0]] || []).filter(function(x){ return x.state === 'done'; })[+kk[1]]; if(pp) A.dialog(RI.esc(est.rooms.filter(function(r){ return r.key === kk[0]; })[0].name), '<img class="plan-view" src="' + pp.src + '" alt="' + RI.esc(pp.name) + '">', {wide:true}); return; }
      var pick = e.target.closest('[data-pick]'); if(pick){ if(pick.getAttribute('data-pick') !== selRoom){ selRoom = pick.getAttribute('data-pick'); drawCard('room'); } return; }
      var en = e.target.closest('[data-end]'); if(en){ if(en.getAttribute('data-end') !== end){ end = en.getAttribute('data-end'); h.end = end; save(); drawEnd(); } }
    });
    pv.addEventListener('change', function(e){
      var id = e.target.getAttribute('data-id'); if(!id) return;
      var on = e.target.checked, note = [];
      if(!on){ h.off[id] = true; (RI.DEPS[id] || []).forEach(function(d){ if(!h.off[d[0]]){ h.off[d[0]] = true; note.push(d[1]); } }); }
      else { delete h.off[id]; Object.keys(RI.DEPS).forEach(function(parent){ RI.DEPS[parent].forEach(function(d){ if(d[0] === id && h.off[parent]){ delete h.off[parent]; note.push('Turned back on with it: ' + d[1].toLowerCase()); } }); }); }
      save();
      pv.querySelectorAll('[data-item]').forEach(function(row){ var iid = row.getAttribute('data-item'), cb = row.querySelector('input[data-id]'); row.classList.toggle('off', !!h.off[iid]); if(cb) cb.checked = !h.off[iid]; });
      if(note.length) RI.toast((on ? '' : 'Also turned off. ') + note.join(' '), 'info');
      totals(true); refreshRooms();
      if(tab === 'trades'){ viewTrades(true); var f = pv.querySelector('input[data-id="' + id + '"]'); if(f) f.focus(); }
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
      var d = A.dialog('Share this presentation', '<div id="sh-b">' + body() + '</div>' + (A.proOn() ? '<p class="xsmall muted pro-share">Sharing never uses a credit.</p>' : ''));
      d.addEventListener('click', function(e){
        if(e.target.closest('#sh-make')){ h.shares = h.shares || []; h.shares.push({token:A.uid('s') + A.uid(''), created:Date.now(), active:true, forName:h.client || A.me().name}); save(); RI.track('share_created', {house:h.id}); d.querySelector('#sh-b').innerHTML = body(); RI.fillIcons(d); RI.toast('Share link created.', 'share'); }
        if(e.target.closest('#sh-copy')){ var u = d.querySelector('#sh-url'); u.select(); (navigator.clipboard ? navigator.clipboard.writeText(u.value) : Promise.reject()).then(function(){ RI.toast('Link copied.', 'share'); }, function(){ doc.execCommand && doc.execCommand('copy'); RI.toast('Link copied.', 'share'); }); }
        if(e.target.closest('#sh-off')){ h.shares.forEach(function(x){ x.active = false; }); save(); d.querySelector('#sh-b').innerHTML = body(); RI.fillIcons(d); RI.toast('The link is turned off. Anyone who opens it sees that it has expired.'); }
      });
    });
    /* PDF through the browser's print dialog: every room, one after another, with what each one buys.
       The screen goes back to the one-room view once the dialog closes. */
    /* The PDF report (user, Nov 2026; INT70-A01): the house, the three package budgets, the chosen package by trade,
       every room's products with material and labor, what is not confirmed, what is not included and the house
       systems as advice. Same numbers as the screen; never a price source or a price date. */
    function reportHtml(){
      var R = RI.RoomCard, E = R.split ? end : 'lo', pkd = RI.PACKAGES.filter(function(p){ return p.key === h.pk; })[0], held = A.heldCount(est), nh = held.u + held.m;
      var rg = function(lo, hi){ return RI.money(lo) + ' to ' + RI.money(hi); }, esc = RI.esc;
      var facts = (est.facts && est.facts.length ? est.facts.filter(function(f){ return f[0] !== 'Photos'; }).map(function(f){ return f[0] + ' ' + f[1]; }) : [h.facts && h.facts.year ? 'Built ' + h.facts.year : '', h.facts && h.facts.sqft ? (+h.facts.sqft).toLocaleString('en-US') + ' sq ft' : '', h.facts && h.facts.beds ? h.facts.beds + ' bed' : '', h.facts && h.facts.baths ? h.facts.baths + (h.facts.halfBaths ? '.5' : '') + ' bath' : '']).filter(Boolean).join(' · ');
      var by = {}; est.rooms.forEach(function(r){ r.items.forEach(function(it){ var a = it.pk[h.pk]; if(RI.isHeld(it) || !a || a[1] == null || h.off[it.id]) return; var g = RI.tradeOf(it); by[g] = by[g] || [0, 0]; by[g][0] += a[1]; by[g][1] += a[2]; }); });
      var tr = Object.keys(by).sort(function(x, y){ return by[y][1] - by[x][1]; }), t = RI.totals(h.pk, h.off);
      var offs = [], unk = [];
      est.rooms.forEach(function(r){ r.items.forEach(function(it){ if(h.off[it.id]) offs.push(r.name + ', ' + ((RI.ITEM_PART && RI.ITEM_PART[it.id]) || it.name).toLowerCase()); if(RI.isHeld(it)) unk.push('<li><b>' + esc(r.name) + ', ' + esc(it.name.toLowerCase()) + '.</b> ' + (it.fix ? esc(it.fix) + ' would settle it.' : '') + '</li>'); }); });
      var rooms = est.rooms.map(function(r){
        var lines = r.items.filter(function(it){ return RI.isHeld(it) || (it.pk[h.pk] && it.pk[h.pk][1] != null); }); if(!lines.length) return '';
        var rt = RI.totals(h.pk, h.off, r.key);
        return '<section class="rpt-room"><h3><span>' + esc(r.name) + '</span><span>' + (rt.high ? rg(rt.low, rt.high) : 'Not priced yet') + '</span></h3><table><thead><tr><th>Part</th><th>Product</th><th>Quantity</th><th class="n">Material</th><th class="n">Labor</th><th class="n">Total</th></tr></thead><tbody>' +
          lines.map(function(it){
            var part = esc((RI.ITEM_PART && RI.ITEM_PART[it.id]) || it.name);
            if(RI.isHeld(it)) return '<tr class="held"><td>' + part + '</td><td colspan="5">Not priced yet' + (it.fix ? ': ' + esc(it.fix).toLowerCase() + ' would settle it' : '') + '</td></tr>';
            var s = R.split(it, h.pk, E), off = !!h.off[it.id];
            return '<tr' + (off ? ' class="off"' : '') + '><td>' + part + (off ? '<small>Turned off</small>' : '') + '</td><td>' + (s.product ? esc(s.product) : '<span class="rpt-ns">No product chosen yet</span><small>' + esc(it.pk[h.pk][0]) + '</small>') + '</td><td>' + s.qty + '</td>' +
              (s.material != null ? '<td class="n">' + RI.money(s.material) + '</td><td class="n">' + RI.money(s.labor) + '</td>' : '<td colspan="2" class="n rpt-ns">Not split yet</td>') + '<td class="n">' + RI.money(s.val) + '</td></tr>';
          }).join('') + '</tbody></table></section>';
      }).join('');
      return '<div class="rpt-head"><div><p class="rpt-k">Renovation estimate</p><h1>' + esc(A.addr(h)) + '</h1><p>' + esc(A.place(h)) + (facts ? ' · ' + esc(facts) : '') + '</p></div>' +
          '<div class="rpt-meta"><p>Prepared ' + new Date().toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'}) + '</p><p>Package shown: <b>' + pkd.name + '</b></p>' + (nh ? '<p><span class="rpt-tag">Partial: ' + nh + ' line' + (nh === 1 ? '' : 's') + ' not priced yet</span></p>' : '') + '</div></div>' +
        '<h2>Planning budget by package</h2><table><thead><tr><th>Package</th><th>What it does</th><th class="n">Low to High</th></tr></thead><tbody>' +
          RI.PACKAGES.map(function(p){ var x = RI.totals(p.key, h.off); return '<tr' + (p.key === h.pk ? ' class="cur"' : '') + '><td>' + p.name + (p.key === h.pk ? ' (shown below)' : '') + '</td><td>' + p.goal + '</td><td class="n">' + rg(x.low, x.high) + '</td></tr>'; }).join('') +
          '</tbody></table><p class="rpt-note">Contingency is not included. Keep some money aside for what is found once work starts. Items you turned off are left out of every budget.</p>' +
        '<h2>' + pkd.name + ', by trade</h2><table><thead><tr><th>Trade</th><th class="n">Low to High</th></tr></thead><tbody>' + tr.map(function(k){ return '<tr><td>' + esc(k) + '</td><td class="n">' + rg(by[k][0], by[k][1]) + '</td></tr>'; }).join('') +
          '<tr class="tot"><td>Total, ' + pkd.name + '</td><td class="n">' + rg(t.low, t.high) + '</td></tr></tbody></table>' +
        '<h2>' + pkd.name + ', room by room</h2><p class="rpt-note">Products and amounts at the ' + (E === 'hi' ? 'high' : 'low') + ' end of each range. Material is the product times its quantity; labor is the work on that line.</p>' + rooms +
        (unk.length ? '<h2>Not confirmed, left out of the budget</h2><ul>' + unk.join('') + '</ul>' : '') +
        '<h2>Not included</h2><ul>' + RI.NOT_INCLUDED.filter(function(x){ return x !== 'Items you turned off'; }).map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '<li>Items you turned off' + (offs.length ? ': ' + esc(offs.join('; ')) : ' (none)') + '</li></ul>' +
        '<h2>House systems, advice only</h2><ul>' + est.mechanicals.map(function(m){ return '<li><b>' + esc(m.name) + '.</b> ' + esc(m.life || '') + '. Have it inspected.</li>'; }).join('') + '</ul>' +
        '<p class="rpt-foot">An estimate for planning, not a contractor\'s bid. Sample products and prices until Sam\'s product list arrives.</p>';
    }
    view.querySelector('#pdf').addEventListener('click', function(){
      var rp = document.getElementById('rpt'); if(!rp){ rp = document.createElement('div'); rp.id = 'rpt'; rp.className = 'rpt'; document.body.appendChild(rp); }
      rp.innerHTML = reportHtml(); document.documentElement.classList.add('rpt-on');
      window.addEventListener('afterprint', function(){ document.documentElement.classList.remove('rpt-on'); rp.innerHTML = ''; }, {once:true});
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

    view.querySelector('#pr-reset').addEventListener('click', function(){ h.off = {}; save(); totals(true); show(tab, 'fade'); RI.toast('All items are back on.'); });
    totals(false); show('rooms'); fbInline();
    requestAnimationFrame(function(){ RI.syncSeg(seg); });
  }, {nav:'houses'});
})();
