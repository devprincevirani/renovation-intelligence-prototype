/* App: the house page. One page that changes with the state of the house (docs/APP_FLOW.md 6.3):
   Draft, In line, Reading photos, Working out the plan, Taking longer, Price ready (6.4). */
(function(){
  var RI = window.RI, A = RI.App, doc = document;

  A.houseHead = function(h){
    var cov = A.cover(h);
    return '<a class="back" href="#/houses">' + RI.icon('arrow','i-sm flip') + (A.isPro() ? 'Client houses' : 'My houses') + '</a>' +
      '<header class="house-head"><div class="hh-media">' + (cov ? '<img src="' + cov + '" alt="">' : '<span class="hc-draw">' + A.drawing(A.illus(h)) + '</span>') + '</div>' +
      '<div class="hh-t"><span id="hh-pill">' + A.pill(h) + '</span>' + (h.client ? '<p class="hc-client">' + RI.icon('user','i-sm') + RI.esc(h.client) + '</p>' : '') + '<h1>' + RI.esc(A.addr(h)) + '</h1><p class="muted">' + RI.esc(A.place(h)) + '</p><p class="small">' + RI.esc(h.title || '') + (A.factsLine(h) ? ' · ' + A.factsLine(h).replace(/^Built \d+ · /, '') : '') + '</p></div></header>';
  };
  A.photosByRoom = function(h){
    return '<div class="pbr">' + A.roomsFor(h).filter(function(r){ return A.photoCount(h, r[0]); }).map(function(r){
      var ps = (h.photos[r[0]] || []).filter(function(p){ return p.state === 'done'; });
      return '<section><h3>' + r[1] + ' <span class="xsmall muted">' + ps.length + '</span></h3><div class="pbr-row">' + ps.slice(0, 6).map(function(p){ return '<img src="' + p.src + '" alt="' + RI.esc(r[1]) + ' photo" loading="lazy">'; }).join('') + (ps.length > 6 ? '<span class="more">+' + (ps.length - 6) + '</span>' : '') + '</div></section>';
    }).join('') + '</div>';
  };
  function allPhotos(h){ var out = []; A.roomsFor(h).forEach(function(r){ (h.photos[r[0]] || []).forEach(function(p){ if(p.state === 'done') out.push([r[1], p]); }); }); return out; }

  /* ---------- Draft ---------- */
  function draft(view, h){
    var steps = [['house','Tell us about the home',!!(h.facts && h.facts.sqft)],['rooms','Rooms and photos, then submit',false]];
    var done = steps.filter(function(s){ return s[2]; }).length;
    view.innerHTML = '<div class="app-wrap">' + A.houseHead(h) +
      '<section class="panel-s draft-p"><div class="dp-top"><div><h2>Finish entering your house</h2><p class="muted">Saved as a draft. Pick up where you left off.</p></div><div class="ring" style="--p:' + (done / steps.length) + '"><span>' + done + '<small>of ' + steps.length + '</small></span></div></div>' +
      '<ol class="todo">' + steps.map(function(t){ return '<li class="' + (t[2] ? 'ok' : '') + '">' + RI.icon(t[2] ? 'check' : 'dot','i-sm') + '<a href="#/houses/' + h.id + '/intake/' + t[0] + '">' + t[1] + '</a>' + (t[2] ? '<span class="xsmall muted">Done</span>' : '') + '</li>'; }).join('') + '</ol>' +
      '<div class="cta-row"><a class="btn btn-primary" href="' + A.next(h)[1] + '">Continue ' + RI.icon('arrow','i-sm i-arrow') + '</a><button type="button" class="linkbtn" id="del">Delete this draft</button></div></section></div>';
    view.querySelector('#del').addEventListener('click', function(){ A.confirm('Delete this draft?', 'The facts and photos you entered for this house are removed. This cannot be undone.', 'Delete draft', function(){ A.remove(h.id); RI.toast('Draft deleted.'); A.go('#/houses'); }, true); });
  }

  /* ---------- The run, live ---------- */
  function working(view, h){
    var photos = allPhotos(h), est = A.estimate(h);
    view.innerHTML = '<div class="app-wrap">' + A.houseHead(h) +
      '<section class="run" aria-live="polite">' +
        '<div class="run-stage" id="stage"><div class="rs-queue"><div class="rs-draw">' + A.drawing(A.illus(h)) + '</div><p class="rs-cap">Your house is in line</p></div>' +
          '<div class="rs-read"><figure class="rs-photo"><img id="rs-img" alt=""><span class="rs-scan"></span><span class="rs-tag" id="rs-tag"></span></figure><div class="rs-strip" id="rs-strip"></div></div>' +
          '<div class="rs-plan"><div id="rs-plan"></div></div></div>' +
        '<div class="run-side"><p class="label">Working on your house</p><h2 id="run-h">We have your house</h2><p class="muted small" id="run-sub"></p>' +
          '<div class="run-bar"><span class="bar work"><i id="run-pct"></i></span><span class="xsmall muted" id="run-eta"></span></div>' +
          '<ol class="stages" id="stages">' + A.STAGES.map(function(s, i){ return '<li data-s="' + i + '"><span class="sg-k">' + RI.icon('check','i-sm') + '</span><span><b>' + s[1] + '</b><span class="xsmall muted">' + s[2] + '</span></span></li>'; }).join('') + '</ol>' +
          '<div class="notice notice-info" id="slow" hidden>' + RI.icon('clock') + '<span><b>This is taking longer than usual.</b> We are on it. You do not need to do anything.</span></div>' +
          '<p class="xsmall muted run-leave">' + RI.icon('mail','i-sm') + 'You can leave this page. We email you when the price is ready.</p>' +
          (RI.devTools ? '<button type="button" class="linkbtn demo-slow" id="demo-slow">Team: show a slow run</button>' : '') + '</div>' +
      '</section></div>';
    RI.CURRENT = est;
    var plan = RI.Plan.mount(view.querySelector('#rs-plan'), {onSelect:function(){}});
    var stage = view.querySelector('#stage'), strip = view.querySelector('#rs-strip'), img = view.querySelector('#rs-img'), tag = view.querySelector('#rs-tag');
    strip.innerHTML = photos.slice(0, 40).map(function(p, i){ return '<img src="' + p[1].src + '" alt="" data-i="' + i + '">'; }).join('');
    var TAGS = ['Cabinets, 92%','Countertop, 71%','Flooring, 88%','Doors, 90%','Walls, 84%','Light fixture, 79%','Vanity, 86%','Tub, 64%','Trim, 81%'];
    var lastRead = -1;
    var ds = view.querySelector('#demo-slow'); if(ds) ds.addEventListener('click', function(){ h.run.slow = true; A.put(h); this.hidden = true; RI.toast('The run will take longer, to show that state.', 'clock'); });
    function tick(){
      var fresh = A.get(h.id); if(!fresh){ return; } h = fresh;
      var r = A.runState(h);
      if(r.status === 'ready'){ RI.toast('Your price is ready. In the product we would also email you.', 'mail'); A.render(); return; }
      stage.setAttribute('data-mode', r.status === 'queued' ? 'queue' : r.status === 'reading' ? 'read' : 'plan');
      var total = A.STAGES.length, pct = Math.round(((r.stage || 0) + (r.stageProgress || 0)) / total * 100);
      view.querySelector('#run-pct').style.width = Math.max(3, pct) + '%';
      view.querySelector('#run-h').textContent = A.STAGES[r.stage][1];
      view.querySelector('#run-sub').textContent = r.status === 'reading' ? 'Photo ' + Math.min(r.photos, r.read + 1) + ' of ' + r.photos + '. ' + A.STAGES[1][2] + '.' : A.STAGES[r.stage][2] + '.';
      var left = 0, acc = 0; A.STAGES.forEach(function(s, i){ var d = i === 1 ? A.readMs(h) : s[3]; if(i === 6 && h.run.slow) d += 9000; if(i >= r.stage) left += d; }); left -= (r.stageProgress || 0) * (r.stage === 1 ? A.readMs(h) : A.STAGES[r.stage][3]);
      view.querySelector('#run-eta').textContent = 'About ' + Math.max(1, Math.round(left / 1000)) + ' seconds left';
      view.querySelectorAll('#stages li').forEach(function(li, i){ li.className = i < r.stage ? 'done' : i === r.stage ? 'cur' : ''; });
      view.querySelector('#slow').hidden = !r.slow;
      view.querySelector('#hh-pill').innerHTML = A.pill(h);
      if(r.status === 'reading' && photos.length && r.read !== lastRead){
        lastRead = r.read; var p = photos[Math.min(photos.length - 1, r.read)];
        img.src = p[1].src; img.alt = p[0] + ' photo'; tag.textContent = p[0] + ': ' + TAGS[r.read % TAGS.length];
        img.parentNode.classList.remove('flash'); void img.offsetWidth; img.parentNode.classList.add('flash');
        strip.querySelectorAll('img').forEach(function(t, i){ t.classList.toggle('done', i < r.read); t.classList.toggle('now', i === r.read); });
        var now = strip.querySelector('.now'); if(now) strip.scrollTo({left:now.offsetLeft - strip.clientWidth / 2, behavior:A.reduce ? 'auto' : 'smooth'});
      }
      if(r.status === 'planning'){
        /* Rooms fill in as the stages finish */
        var show = Math.max(0, r.stage - 2 + r.stageProgress) / 5;
        plan.update(r.stage >= 5 ? 'S' : 'S', {}, null);
        view.querySelectorAll('#rs-plan .pl-room, #rs-plan .plan-chip').forEach(function(el, i, all){ el.style.opacity = i / all.length < show ? 1 : .15; });
      }
    }
    tick(); A.every(tick, 400);
  }

  /* ---------- Price ready (free): one room open, the rest locked and counted, the promise beside the button ---------- */
  /* The price for one house, from RI.OFFERS: the base price, or a true offer when Sam has switched one on */
  A.PRICE = RI.OFFERS.price;
  A.priceFor = function(h){
    var O = RI.OFFERS, s = A.me() || {}, paidOther = A.mine().some(function(x){ return x.paid && (!h || x.id !== h.id); });
    if(O.secondHouse.on && paidOther) return {amount:O.secondHouse.price, note:'Second house price'};
    var onList = (RI.store.get('waitlist', []) || []).some(function(w){ return w.email === (s.email || '').toLowerCase(); }) || s.demo;
    var ends = new Date(O.founding.ends + 'T23:59:59');
    if(O.founding.on && onList && Date.now() < ends) return {amount:O.founding.price, note:'Founding price, until ' + ends.toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'})};
    return {amount:O.price, note:''};
  };
  function ready(view, h){
    var est = A.estimate(h); RI.CURRENT = est; RI.track('price_viewed', {house:h.id});
    var T = {}; ['E','S','P'].forEach(function(k){ T[k] = RI.totals(k, {}); });
    var held = A.heldCount(est), max = Math.ceil(T.P.high / 25000) * 25000, sel = 'S';
    var unk = []; est.rooms.forEach(function(r){ r.items.forEach(function(it){ if(RI.isHeld(it)) unk.push([r, it]); }); });
    var paid = h.paid || h.trialOpen, credit = !paid && A.creditsLeft() > 0;
    /* The open room: the largest share of the Standard total */
    var open = est.rooms.filter(function(r){ return r.key !== 'whole'; }).sort(function(a, b){ return RI.totals('S', {}, b.key).high - RI.totals('S', {}, a.key).high; })[0];
    var photoN = A.photoCount(h), zip = (h.addr && h.addr.zip) || (h.facts && h.facts.zip) || '';
    function roomPhoto(r){ var ps = []; Object.keys(h.photos || {}).forEach(function(k){ if(k === r.key || k.indexOf(r.key + '-') === 0) h.photos[k].forEach(function(p){ if(p.state === 'done') ps.push(p.src); }); }); return ps[0] || null; }
    /* ---------- What a goal does to this house, room by room (no room prices: those open with the presentation) ---------- */
    var ROOMMAX = 1; ['E','S','P'].forEach(function(k){ est.rooms.forEach(function(r){ ROOMMAX = Math.max(ROOMMAX, RI.totals(k, {}, r.key).high); }); });
    var LEVELS = ['Kept as is', 'Light refresh', 'Update', 'Major update'];
    function pkName(k){ return RI.PACKAGES.filter(function(p){ return p.key === k; })[0].name; }
    function level(r, k){
      var t = RI.totals(k, {}, r.key);
      if(r.items.every(RI.isHeld)) return {i:-1, name:'Needs a photo', cls:'held'};
      if(!t.high) return {i:0, name:LEVELS[0], cls:'l0'};
      var x = t.high / ROOMMAX, i = x < .12 ? 1 : x < .35 ? 2 : 3;
      return {i:i, name:LEVELS[i], cls:'l' + i};
    }
    function mainChange(r, k){
      var best = null; r.items.forEach(function(it){ if(RI.isHeld(it)) return; var a = it.pk[k]; if(a[1] != null && (!best || a[2] > best[2])) best = a; });
      if(best) return best[0];
      var hd = r.items.filter(RI.isHeld)[0];
      return hd ? hd.fix + ' would show what this room needs' : 'Everything here is sound and kept';
    }
    function prodImgs(r, k){
      var out = []; r.items.forEach(function(it){ if(RI.isHeld(it)) return; var a = it.pk[k], m = RI.PRODUCT_IMG[it.id]; if(a[1] != null && m && m[k] && out.length < 3) out.push([RI.img(m[k]), a[3] || it.name]); });
      return out;
    }
    /* Parts, not rooms: what changes, what is kept and what still needs a photo or a size under this goal */
    function goalSummary(k){
      var changed = 0, kept = 0, need = 0;
      est.rooms.forEach(function(r){ r.items.forEach(function(it){ if(RI.isHeld(it)) need++; else if(it.pk[k][1] != null) changed++; else kept++; }); });
      return {changed:changed, kept:kept, need:need};
    }
    function sumHtml(g){
      return '<span><b>' + g.changed + '</b> part' + (g.changed === 1 ? '' : 's') + ' changed</span><span><b>' + g.kept + '</b> kept as is</span>' + (g.need ? '<span class="need"><b>' + g.need + '</b> need' + (g.need === 1 ? 's' : '') + ' a photo or size</span>' : '');
    }
    function goalSum(k){
      var g = goalSummary(k), ph = [];
      est.rooms.forEach(function(r){ prodImgs(r, k).forEach(function(x){ if(ph.length < 4 && !ph.some(function(y){ return y[0] === x[0]; })) ph.push(x); }); });
      return '<p class="pk-sum">' + sumHtml(g) + '</p>' +
        (ph.length ? '<span class="pk-ph">' + ph.map(function(x){ return '<img src="' + x[0] + '" alt="" title="' + RI.esc(x[1]) + '" loading="lazy">'; }).join('') + '</span>' : '');
    }
    /* A locked room's teaser (Sam's meeting, Nov 2026): a few real items, never their prices, then grey lines
       for the rest with the true count. Items with a product photo first, then the biggest cost. Two at most,
       never more than half the room (one when the room has one or two). */
    function teaser(r, k){
      var list = r.items.filter(function(it){ return !RI.isHeld(it) && it.pk[k] && it.pk[k][1] != null; });
      var hasImg = function(it){ return !!(RI.PRODUCT_IMG[it.id] && RI.PRODUCT_IMG[it.id][k]); };
      list.sort(function(a, b){ return hasImg(a) === hasImg(b) ? b.pk[k][2] - a.pk[k][2] : (hasImg(b) ? 1 : -1); });
      var n = list.length ? Math.min(2, Math.max(1, Math.floor(list.length / 2))) : 0;
      return {show:list.slice(0, n), hidden:list.length - n};
    }
    function tzLine(it, k){
      var a = it.pk[k], m = RI.PRODUCT_IMG[it.id], img = m && m[k] ? RI.img(m[k]) : null;
      return '<li><span class="tz-th">' + (img ? '<img src="' + img + '" alt="" loading="lazy">' : RI.icon('dot','i-sm')) + '</span><span class="tz-t"><b>' + RI.esc(it.name) + '</b><span>' + RI.esc(a[3] || a[0]) + '</span></span></li>';
    }
    function meter(l){ return '<span class="hm-meter" aria-hidden="true">' + [1,2,3].map(function(n){ return '<i' + (l.i >= n ? ' class="on"' : '') + '></i>'; }).join('') + '</span>'; }
    function mapHtml(){
      var g = goalSummary(sel), t = RI.totals(sel, {});
      return '<header class="hm-head"><div><p class="label">Your house under each goal</p><h2>What the <span class="hm-goal">' + pkName(sel) + '</span> plan does to your house</h2></div>' +
          '<div class="seg hm-seg" role="group" aria-label="Goal"><span class="seg-thumb"></span>' + RI.PACKAGES.map(function(p){ return '<button type="button" data-goal="' + p.key + '" aria-pressed="' + (p.key === sel) + '">' + p.name + '</button>'; }).join('') + '</div></header>' +
        '<div class="hm-strip">' + sumHtml(g) + '<span class="hm-tot">Whole house <b class="range-txt">' + RI.range(t.low, t.high) + '</b></span></div>' +
        '<div class="hm-legend" aria-hidden="true">' + LEVELS.map(function(n, i){ return '<span>' + meter({i:i}) + n + '</span>'; }).join('') + '<span class="held">' + meter({i:-1}) + 'Needs a photo</span></div>' +
        '<div class="hm-grid">' + est.rooms.map(function(r){
          var l = level(r, sel), ph = roomPhoto(r), pr = prodImgs(r, sel), part = r.items.some(RI.isHeld) && l.i >= 0;
          var tz = !paid && r !== open ? teaser(r, sel) : null;
          if(tz && tz.show.length) return '<article class="hm-room tz-lock ' + l.cls + '" data-room="' + r.key + '">' +
            '<div class="hm-ph">' + (ph ? '<img src="' + ph + '" alt="' + RI.esc(r.name) + '" loading="lazy">' : '<span class="hm-noph">' + RI.icon(r.key === 'whole' ? 'house' : 'camera') + '</span>') + '<span class="hm-tag">' + l.name + '</span></div>' +
            '<div class="hm-b"><div class="hm-top"><b>' + RI.esc(r.name) + '</b>' + meter(l) + '</div>' +
              '<ul class="tz-list">' + tz.show.map(function(it){ return tzLine(it, sel); }).join('') + '</ul>' +
              (tz.hidden ? '<span class="tz-bars" aria-hidden="true">' + '<i></i><i></i><i></i>'.slice(0, 7 * Math.min(3, tz.hidden)) + '</span>' : '') +
              '<span class="hm-foot"><a class="tz-more" href="#/houses/' + h.id + '/checkout">' + RI.icon('lock','i-sm') + (tz.hidden ? '+' + tz.hidden + ' more item' + (tz.hidden === 1 ? '' : 's') + ' and every price' : 'Its price is in the presentation') + '</a>' + (part ? '<span class="hm-part">Partial</span>' : '') + '</span></div></article>';
          /* Every card that can do something does it from anywhere on the card: paid opens the presentation,
             the free room scrolls to its full view below, a room with no photos goes to the photo step */
          var act = paid ? '<a class="tz-more" href="#/houses/' + h.id + '/presentation">' + RI.icon('eye','i-sm') + 'Open in the presentation</a>'
            : r === open ? '<button type="button" class="tz-more" data-goopen>' + RI.icon('eye','i-sm') + 'Open below, free</button>'
            : l.cls === 'held' ? '<a class="tz-more" href="#/houses/' + h.id + '/intake/photos">' + RI.icon('camera','i-sm') + 'Add photos of this room</a>'
            : null;
          return '<article class="hm-room ' + l.cls + (act ? ' tz-lock' : '') + '" data-room="' + r.key + '">' +
            '<div class="hm-ph">' + (ph ? '<img src="' + ph + '" alt="' + RI.esc(r.name) + '" loading="lazy">' : '<span class="hm-noph">' + RI.icon(r.key === 'whole' ? 'house' : 'camera') + '</span>') + '<span class="hm-tag">' + l.name + '</span></div>' +
            '<div class="hm-b"><div class="hm-top"><b>' + RI.esc(r.name) + '</b>' + meter(l) + '</div>' +
              '<p>' + RI.esc(mainChange(r, sel)) + '.</p>' +
              (pr.length ? '<span class="hm-prods">' + pr.map(function(x){ return '<img src="' + x[0] + '" alt="" title="' + RI.esc(x[1]) + '" loading="lazy">'; }).join('') + '</span>' : '') +
              '<span class="hm-foot">' + (act || RI.icon('lock','i-sm') + 'Price in the presentation') + (part ? '<span class="hm-part">Partial</span>' : '') + '</span></div></article>';
        }).join('') + '</div>';
    }
    /* ---------- Room by room, as in the presentation (Sam's meeting, Nov 2026): the same room buttons and room card.
       The free room opens in full. A locked room shows its photo, what changes, two or three of its products
       and the rest blurred, never a price, then the button to open every room. ---------- */
    var pick = open.key;
    function pickerHtml(){
      return est.rooms.map(function(r){
        var lk = !paid && r !== open;
        return '<button type="button" class="rc-chip' + (lk ? ' px-lk' : '') + '" data-pick="' + r.key + '" aria-pressed="' + (r.key === pick) + '">' + (lk ? RI.icon('lock','i-sm') : '') + RI.esc(r.name) + (lk ? '<span class="sr">, locked</span>' : paid ? '' : '<span class="px-free">Free</span>') + '</button>';
      }).join('');
    }
    function cost(it){ return it.pk[sel][2] || 0; }
    function lockImg(it){ var m = RI.PRODUCT_IMG[it.id]; return m && m[sel] ? RI.img(m[sel]) : null; }
    /* What this buys, as in the presentation: one line per item, biggest first, with its product photo, the kind of
       work, the product and its range. No switches here: turning items on or off is part of the paid presentation.
       lock 'clear': the line shows, its price is hidden. lock 'hid': the whole line is blurred. */
    var LOCKP = '<span class="px-lockp"><span class="rc-blur" aria-hidden="true">$•,••• to $•,•••</span>' + RI.icon('lock','i-sm') + '<span class="sr">Price locked</span></span>';
    function buyLine(it, lock){
      var a = it.pk[sel], img = lockImg(it), k = RI.RoomCard.kind(a[0]);
      if(lock === 'hid') return '<li class="wb-line px-hidl" aria-hidden="true"><span class="wb-th">' + (img ? '<img src="' + img + '" alt="" loading="lazy">' : '') + '<span class="px-hid-lk">' + RI.icon('lock','i-sm') + '</span></span>' +
        '<span class="wb-t px-bars"><i></i><i></i><i></i></span><span class="wb-r"><span class="rc-blur">$•,••• to $•,•••</span></span></li>';
      return '<li class="wb-line">' +
        '<span class="wb-th">' + (img ? '<img src="' + img + '" alt="" loading="lazy">' : RI.icon('dot','i-lg')) + '</span>' +
        '<span class="wb-t"><b>' + RI.esc(it.name) + '</b><span class="wb-act"><span class="wb-k' + (k === 'New' ? ' wb-k-new' : '') + '">' + k + '</span>' + RI.esc(a[0]) + '</span>' +
          (a[3] ? '<span class="wb-prod">' + RI.esc(a[3]) + '</span>' : '') + '</span>' +
        '<span class="wb-r">' + (lock ? LOCKP : '<span class="range-txt">' + RI.range(a[1], a[2]) + '</span>') + '</span></li>';
    }
    function heldLine(it){
      var m = it.state === 'measure';
      return '<li class="wb-line wb-hold"><span class="wb-th">' + RI.icon(m ? 'ruler' : 'camera','i-lg') + '</span>' +
        '<span class="wb-t"><b>' + RI.esc(it.name) + '</b><span class="wb-act">' + RI.esc(it.fix) + ' would settle it.</span></span>' +
        '<span class="wb-r"><span class="state ' + (m ? 'state-measure' : 'state-unverified') + '">' + (m ? 'Needs measurement' : 'Unverified') + '</span><span class="xsmall muted">Not in the total</span></span></li>';
    }
    function buysParts(r){
      var b = {priced:[], kept:[], held:[]};
      r.items.forEach(function(it){ if(RI.isHeld(it)) b.held.push(it); else if(!it.pk[sel] || it.pk[sel][1] == null) b.kept.push(it); else b.priced.push(it); });
      b.priced.sort(function(x, y){ return cost(y) - cost(x); });
      return b;
    }
    var BUYS_HD = '<div class="wb-hd"><h4>What this buys</h4><span class="state state-sample">Representative photos</span></div>';
    function heldList(b){ return b.held.length ? '<ul class="wb-list wb-held">' + b.held.map(heldLine).join('') + '</ul>' : ''; }
    /* The free room: every line open, with its range */
    function freeBuys(r){
      var b = buysParts(r), on = b.priced.length;
      return '<section class="wb" aria-label="What this buys">' + BUYS_HD +
        (on ? '<ul class="wb-list">' + b.priced.map(function(it){ return buyLine(it); }).join('') + '</ul>' : '<p class="small muted">Nothing to buy here under this goal.</p>') +
        '<p class="wb-sum">' + (on === 0 ? 'Nothing is priced in this room right now.' : on === 1 ? 'This one item is the whole range above.' : 'These ' + on + ' items add up to the range above.') + (b.held.length ? ' ' + b.held.length + ' not priced yet, left out.' : '') + '</p>' +
        heldList(b) +
        (b.kept.length ? '<details class="wb-kept"><summary>Kept as is, no cost · ' + b.kept.length + ' item' + (b.kept.length === 1 ? '' : 's') + '</summary><ul>' + b.kept.map(function(it){ var a = it.pk[sel]; return '<li><b>' + RI.esc(it.name) + '</b>' + (a && a[0] ? '<span class="xsmall muted">' + RI.esc(a[0]) + '</span>' : '') + '</li>'; }).join('') + '</ul></details>' : '') +
        '</section>';
    }
    /* A locked room (Nevil, Nov 2026): two or three lines in the clear when the room has enough, one when it has one
       or two, items with a product photo first; every price hidden and every other line blurred */
    function lockedBuys(r){
      var b = buysParts(r), list = b.priced, n = list.length >= 5 ? 3 : list.length >= 3 ? 2 : list.length ? 1 : 0;
      var clear = list.filter(lockImg).concat(list.filter(function(it){ return !lockImg(it); })).slice(0, n);
      clear.sort(function(x, y){ return cost(y) - cost(x); });
      var hid = list.filter(function(it){ return clear.indexOf(it) < 0; }), rest = hid.length;
      var cta = credit ? '<button type="button" class="btn btn-primary px-cta" data-credit>Open every room with a credit</button>'
        : A.hasCheckout ? '<a class="btn btn-primary px-cta" href="#/houses/' + h.id + '/checkout">Open every room, ' + price + '</a>' : '';
      return '<section class="wb" aria-label="What this buys">' + BUYS_HD +
        (list.length ? '<ul class="wb-list">' + clear.map(function(it){ return buyLine(it, 'clear'); }).join('') + hid.slice(0, 5).map(function(it){ return buyLine(it, 'hid'); }).join('') + '</ul>' +
          '<p class="px-more">' + RI.icon('lock','i-sm') + '<span>' + (rest ? '+' + rest + ' more item' + (rest === 1 ? '' : 's') + ' and every price' : 'Its price is in the presentation') + '</span></p>' : '<p class="small muted">Nothing to buy here under this goal.</p>') +
        heldList(b) + (list.length ? cta : '') + '</section>';
    }
    function lockedRoom(r){
      var pkd = RI.PACKAGES.filter(function(p){ return p.key === sel; })[0], src = roomPhoto(r) || RI.RoomCard.photoFor(r.key);
      var photo = src ? '<div class="rc-photo"><img src="' + src + '" alt="' + RI.esc(r.name) + '" loading="lazy"></div>' : '<div class="rc-photo rc-nophoto" aria-hidden="true">' + RI.icon(r.key === 'whole' ? 'house' : 'camera', 'i-lg') + '<span>' + RI.esc(r.name) + '</span></div>';
      var head = '<header class="rc-head"><div><h3>' + RI.esc(r.name) + '</h3><p class="xsmall muted">' + RI.esc(pkd.name) + ': ' + RI.esc(pkd.goal) + '</p></div>';
      /* No photos yet: nothing to tease, only the way to add them */
      if(r.items.every(RI.isHeld)) return '<article class="rc px-lockrc" data-room="' + r.key + '">' + photo + '<div class="rc-body">' + head + '</header>' +
        '<p class="rc-change">' + RI.esc(mainChange(r, sel)) + '.</p><a class="btn btn-secondary px-cta" href="#/houses/' + h.id + '/intake/photos">' + RI.icon('camera','i-sm') + 'Add photos of this room</a></div></article>';
      var priced = r.items.some(function(it){ return !RI.isHeld(it) && it.pk[sel] && it.pk[sel][1] != null; });
      return RI.RoomCard.html(r, sel, {photo:roomPhoto(r), range:priced ? LOCKP.replace('$•,••• to $•,•••', '$••,••• to $••,•••') : '', buysHtml:lockedBuys(r)});
    }
    function roomView(){
      var r = est.rooms.filter(function(x){ return x.key === pick; })[0] || open, t = RI.totals(sel, {}, r.key);
      if(paid || r === open) return RI.RoomCard.html(r, sel, {photo:roomPhoto(r), range:t.high ? RI.range(t.low, t.high) : '<span class="muted">No cost</span>', buysHtml:freeBuys(r)});
      return lockedRoom(r);
    }
    function drawRoom(){
      view.querySelector('#px-open').innerHTML = roomView(); /* hotspots stay wired: RoomCard.wire(view) listens above it */
      view.querySelectorAll('#px-pick [data-pick]').forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-pick') === pick); });
    }
    var pf = A.priceFor(h), price = '$' + pf.amount;
    view.innerHTML = '<div class="app-wrap px-page">' + A.houseHead(h) +
      '<section class="price-s"><header class="ps-head"><div><p class="label">Your price by package' + (h.version > 1 ? ' · version ' + h.version : '') + '</p><h2>Three goals, one house</h2><p class="muted small">' + (zip ? 'Priced for ZIP ' + RI.esc(zip) + '. ' : '') + 'From ' + photoN + ' photos' + (Object.keys(h.sizes || {}).length ? ' and your room sizes' : '') + '.</p></div>' +
        (held.u + held.m ? '<span class="state state-partial">Partial: ' + (held.u + held.m) + ' line' + (held.u + held.m > 1 ? 's' : '') + ' not priced yet</span>' : '<span class="state state-priced">Every line priced</span>') + '</header>' +
        '<div class="seg pk-seg-m" role="group" aria-label="Goal"><span class="seg-thumb"></span>' + RI.PACKAGES.map(function(p){ return '<button type="button" data-goal="' + p.key + '" aria-pressed="' + (p.key === sel) + '">' + p.name + '</button>'; }).join('') + '</div>' +
        '<div class="pk-cards" data-scale="0,' + max + '" role="tablist" aria-label="Goal">' + RI.PACKAGES.map(function(p, i){
          return '<article class="pk-card' + (p.key === sel ? ' is-default' : '') + '" data-goal="' + p.key + '" role="tab" tabindex="0" aria-selected="' + (p.key === sel) + '" style="--i:' + i + '"><header><h3>' + p.name + (p.key === 'S' ? ' <span class="default">Default view</span>' : '') + '</h3><p>' + p.goal + '</p></header>' +
            '<p class="pk-range">' + RI.range(T[p.key].low, T[p.key].high) + '</p><div class="rl thick' + (held.u + held.m ? ' partial' : '') + '" data-low="' + T[p.key].low + '" data-high="' + T[p.key].high + '"></div>' +
            goalSum(p.key) + '</article>';
        }).join('') + '</div><div class="pk-axis" data-scale="0,' + max + '"><div class="axis" data-ticks="0,' + max / 2 + ',' + max + '"></div></div>' +
      '</section>' +
      '<div class="px-layout"><div class="px-sec">' +
        '<section class="hm" id="px-map" aria-live="polite">' + mapHtml() + '</section>' +
        '<div class="px-open-h"><p class="label">Room by room</p><h2>' + (paid ? 'Every room, in full' : 'One room in full, free') + '</h2></div>' +
        '<div class="rc-picker px-pick" id="px-pick" role="group" aria-label="Rooms">' + pickerHtml() + '</div><div id="px-open">' + roomView() + '</div></div>' +
        '<aside class="px-side px-pin" aria-label="Open the full presentation"><p class="label">The full presentation</p><h2>' + (paid ? 'Your presentation is open' : 'Open every room') + '</h2>' +
          '<ul><li>Every room with its photo and products</li><li>Switch goals, turn items on or off</li><li>Guidance on the roof, heating, water heater and panel</li><li>A PDF and a private link</li></ul>' +
          (paid ? '<a class="btn btn-primary btn-block px-btn" href="#/houses/' + h.id + '/presentation">Open presentation ' + RI.icon('arrow','i-sm i-arrow') + '</a>'
            : credit ? '<button type="button" class="btn btn-primary btn-block px-btn" id="credit-open">Open with a credit</button><p class="small muted">You have ' + A.creditsLeft() + ' credit' + (A.creditsLeft() === 1 ? '' : 's') + ' left.</p>'
            : '<a class="btn btn-primary btn-block px-btn" href="#/houses/' + h.id + '/checkout" id="pay">Open the full presentation, ' + price + '</a><p class="px-promise">One payment for this house. Yours to keep. PDF and a private link included.' + (RI.OFFERS.priceIsSample ? ' <span class="state state-sample">Sample price</span>' : '') + '</p>' + (pf.note ? '<p class="small muted">' + RI.esc(pf.note) + '.</p>' : '') + (RI.devTools && RI.OFFERS.reminderEmail.on ? '<p class="xsmall muted">Team: one reminder email ' + RI.OFFERS.reminderEmail.days + ' days after the price is ready, if still locked. Then nothing more.</p>' : '')) +
          '<a class="textlink small" href="' + RI.url('sample/') + '" id="px-sample" target="_blank" rel="noopener">See a sample first ' + RI.icon('arrow','i-sm') + '</a>' +
          '<p class="xsmall muted">An estimate, never a quote. No subscription.</p></aside></div>' +
      '<div class="tabs-s" role="tablist" aria-label="Details">' +
        '<button role="tab" aria-selected="true" data-tab="unk">What we could not confirm <span class="n">' + unk.length + '</span></button>' +
        '<button role="tab" aria-selected="false" data-tab="dec">What each goal does</button>' +
        '<button role="tab" aria-selected="false" data-tab="ph">Photos <span class="n">' + photoN + '</span></button></div>' +
      '<div class="tab-p" id="tab-unk">' + (unk.length ? '<p class="small muted">These lines are left out of every total and never shown as zero. Each one says what would settle it.</p><ul class="unk">' + unk.map(function(x){
          var fixPhotos = x[1].state === 'unverified', link = '#/houses/' + h.id + '/intake/' + (fixPhotos ? 'photos' : 'measurements');
          return '<li><span class="state ' + (fixPhotos ? 'state-unverified' : 'state-measure') + '">' + (fixPhotos ? 'Unverified' : 'Needs measurement') + '</span><span><b>' + x[0].name + ', ' + x[1].name.toLowerCase() + '</b><span class="small muted">' + RI.esc(x[1].fix) + ' would settle it.</span></span><a class="btn btn-secondary btn-sm" href="' + link + '" data-fix>' + (fixPhotos ? 'Add the photo' : 'Add the size') + '</a></li>';
        }).join('') + '</ul><p class="xsmall muted">Adding a photo or a size runs the house again. You get a new version; the old one is kept.</p>' : '<p class="muted">Every line is priced. Nothing is missing.</p>') + '</div>' +
      '<div class="tab-p" id="tab-dec" hidden><p class="small muted">The same parts under three goals.</p><div class="scroll-x"><table class="dec"><thead><tr><th>Part</th>' + RI.PACKAGES.map(function(p){ return '<th>' + p.name + '</th>'; }).join('') + '</tr></thead><tbody>' +
        est.rooms.map(function(r){ return '<tr class="dec-room"><th colspan="4">' + r.name + '</th></tr>' + r.items.map(function(it){ return '<tr><td data-label="Part">' + RI.esc(it.name) + (RI.isHeld(it) ? ' <span class="state ' + (it.state === 'measure' ? 'state-measure' : 'state-unverified') + '">' + (it.state === 'measure' ? 'Needs measurement' : 'Unverified') + '</span>' : '') + '</td>' + ['E','S','P'].map(function(k){ var a = it.pk[k]; return '<td data-label="' + RI.PACKAGES.filter(function(p){ return p.key === k; })[0].name + '">' + (a ? RI.esc(a[0]) : '') + '</td>'; }).join('') + '</tr>'; }).join(''); }).join('') +
        '</tbody></table></div></div>' +
      '<div class="tab-p" id="tab-ph" hidden>' + A.photosByRoom(h) + '</div>' +
      '<p class="disc-line">' + RI.icon('info','i-sm') + 'This is an estimate for planning, never a contractor\'s bid. Lines we could not confirm are left out of the totals. A contractor still needs to see the house.</p>' +
      '</div>';
    RI.initRanges(view); RI.RoomCard.wire(view);
    view.querySelectorAll('.pk-card .rl').forEach(function(r, i){ r.classList.remove('drawn'); setTimeout(function(){ r.classList.add('drawn'); }, 250 + i * 220); });
    /* The goal switch changes the open room and the locked cards live */
    function setGoal(k){
      sel = k; view.querySelectorAll('.pk-card').forEach(function(c){ var on = c.getAttribute('data-goal') === k; c.classList.toggle('is-default', on); c.setAttribute('aria-selected', on); });
      var ms = view.querySelector('.pk-seg-m'); ms.querySelectorAll('[data-goal]').forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-goal') === k); }); RI.syncSeg(ms);
      drawRoom();
      var map = view.querySelector('#px-map'); map.innerHTML = mapHtml(); RI.fillIcons && RI.fillIcons(map); RI.syncSeg(map.querySelector('.hm-seg'));
      map.classList.remove('hm-flash'); void map.offsetWidth; map.classList.add('hm-flash');
    }
    view.querySelector('#px-map').addEventListener('click', function(e){
      var c = e.target.closest('.hm-seg [data-goal]'); if(c) setGoal(c.getAttribute('data-goal'));
      /* A locked room opens the same way as the main button: a credit when there is one, else checkout */
      if(e.target.closest('[data-goopen]')){
        if(pick !== open.key){ pick = open.key; drawRoom(); }
        var oh = view.querySelector('.px-open-h'), hh = oh.querySelector('h2');
        oh.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start'});
        hh.setAttribute('tabindex', '-1'); hh.focus({preventScroll:true}); return;
      }
      var t = e.target.closest('.tz-more[href$="/checkout"]'); if(t && (credit || !A.hasCheckout)){ e.preventDefault(); var b = view.querySelector('#credit-open'); if(b) b.click(); }
    });
    RI.syncSeg(view.querySelector('.hm-seg'));
    /* The room buttons; a locked room's button opens with a credit when there is one, as the main button does */
    view.querySelector('#px-pick').addEventListener('click', function(e){ var b = e.target.closest('[data-pick]'); if(b && b.getAttribute('data-pick') !== pick){ pick = b.getAttribute('data-pick'); drawRoom(); } });
    view.querySelector('#px-open').addEventListener('click', function(e){ if(e.target.closest('[data-credit]')){ var b = view.querySelector('#credit-open'); if(b) b.click(); } });
    view.querySelector('.pk-cards').addEventListener('click', function(e){ var c = e.target.closest('[data-goal]'); if(c) setGoal(c.getAttribute('data-goal')); });
    view.querySelector('.pk-seg-m').addEventListener('click', function(e){ var c = e.target.closest('[data-goal]'); if(c) setGoal(c.getAttribute('data-goal')); });
    RI.syncSeg(view.querySelector('.pk-seg-m'));
    view.querySelector('.pk-cards').addEventListener('keydown', function(e){ if((e.key === 'Enter' || e.key === ' ') && e.target.closest('[data-goal]')){ e.preventDefault(); setGoal(e.target.closest('[data-goal]').getAttribute('data-goal')); } });
    var sm = view.querySelector('#px-sample'); if(sm) sm.addEventListener('click', function(){ RI.track('sample_opened_from_price', {house:h.id}); });
    var pay = view.querySelector('#pay');
    var tabs = view.querySelectorAll('.tabs-s [data-tab]');
    tabs.forEach(function(t){ t.addEventListener('click', function(){ tabs.forEach(function(x){ x.setAttribute('aria-selected', x === t); }); ['unk','dec','ph'].forEach(function(k){ view.querySelector('#tab-' + k).hidden = k !== t.getAttribute('data-tab'); }); }); });
    view.querySelector('.tabs-s').addEventListener('keydown', function(e){ if(e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; var arr = [].slice.call(tabs), i = arr.indexOf(doc.activeElement); if(i < 0) return; var n = arr[(i + (e.key === 'ArrowRight' ? 1 : arr.length - 1)) % arr.length]; n.focus(); n.click(); });
    var to = view.querySelector('#credit-open'); if(to) to.addEventListener('click', function(){ h.trialOpen = true; A.put(h); RI.toast('Opened with a credit.'); A.go('#/houses/' + h.id + '/presentation'); });
    if(!A.hasCheckout){ if(pay){ pay.removeAttribute('href'); pay.setAttribute('aria-disabled', 'true'); pay.classList.add('is-off'); pay.textContent = 'The presentation arrives in milestone 4'; } }
  }

  A.route('/houses/:id', function(view, p){
    var h = A.get(p.id); if(!h){ view.innerHTML = A.notFound(); return; }
    var s = A.status(h);
    if(s === 'draft') draft(view, h);
    else if(s === 'ready' || s === 'open') ready(view, h);
    else working(view, h);
  }, {nav:'houses'});
})();
