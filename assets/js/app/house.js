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
    var steps = [['house','The house',!!(h.facts && h.facts.sqft)],['photos','Photos by room',A.photoCount(h) > 0],['measurements','Room sizes (optional)',Object.keys(h.sizes || {}).length > 0],['review','Review and submit',false]];
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
          '<button type="button" class="linkbtn demo-slow" id="demo-slow">Demo: show a slow run</button></div>' +
      '</section></div>';
    RI.CURRENT = est;
    var plan = RI.Plan.mount(view.querySelector('#rs-plan'), {onSelect:function(){}});
    var stage = view.querySelector('#stage'), strip = view.querySelector('#rs-strip'), img = view.querySelector('#rs-img'), tag = view.querySelector('#rs-tag');
    strip.innerHTML = photos.slice(0, 40).map(function(p, i){ return '<img src="' + p[1].src + '" alt="" data-i="' + i + '">'; }).join('');
    var TAGS = ['Cabinets, 92%','Countertop, 71%','Flooring, 88%','Doors, 90%','Walls, 84%','Light fixture, 79%','Vanity, 86%','Tub, 64%','Trim, 81%'];
    var lastRead = -1;
    view.querySelector('#demo-slow').addEventListener('click', function(){ h.run.slow = true; A.put(h); this.hidden = true; RI.toast('The run will take longer, to show that state.', 'clock'); });
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
      view.querySelector('#run-eta').textContent = 'About ' + Math.max(1, Math.round(left / 1000)) + ' seconds left in this demo';
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

  /* ---------- Price ready (free) ---------- */
  function ready(view, h){
    var est = A.estimate(h); RI.CURRENT = est; RI.track('price_viewed', {house:h.id});
    var T = {}; ['E','S','P'].forEach(function(k){ T[k] = RI.totals(k, {}); });
    var held = A.heldCount(est), max = Math.ceil(T.P.high / 25000) * 25000;
    var unk = []; est.rooms.forEach(function(r){ r.items.forEach(function(it){ if(RI.isHeld(it)) unk.push([r, it]); }); });
    var paid = h.paid || h.trialOpen, trial = !paid && isTrial();
    function highlights(k){
      var items = []; est.rooms.forEach(function(r){ r.items.forEach(function(it){ if(!RI.isHeld(it) && it.pk[k][1] != null) items.push([it.pk[k][2], r.name, it.pk[k][0]]); }); });
      return items.sort(function(a, b){ return b[0] - a[0]; }).slice(0, 3).map(function(x){ return '<li><b>' + x[1] + '</b> ' + RI.esc(x[2]) + '</li>'; }).join('');
    }
    view.innerHTML = '<div class="app-wrap">' + A.houseHead(h) +
      '<section class="price-s"><header class="ps-head"><div><p class="label">Your price by package' + (h.version > 1 ? ' · version ' + h.version : '') + '</p><h2>Three goals, one house</h2><p class="muted small">Ready ' + A.ago(h.run.start + 25000) + '. From ' + A.photoCount(h) + ' photos' + (Object.keys(h.sizes || {}).length ? ' and your room sizes' : '') + '.</p></div>' +
        (held.u + held.m ? '<span class="state state-partial">Partial: ' + (held.u + held.m) + ' line' + (held.u + held.m > 1 ? 's' : '') + ' not priced yet</span>' : '<span class="state state-priced">Every line priced</span>') + '</header>' +
        '<div class="pk-cards" data-scale="0,' + max + '">' + RI.PACKAGES.map(function(p, i){
          return '<article class="pk-card' + (p.key === 'S' ? ' is-default' : '') + '" style="--i:' + i + '"><header><h3>' + p.name + (p.key === 'S' ? ' <span class="default">Default view</span>' : '') + '</h3><p>' + p.goal + '</p></header>' +
            '<p class="pk-range">' + RI.range(T[p.key].low, T[p.key].high) + '</p><div class="rl thick' + (held.u + held.m ? ' partial' : '') + '" data-low="' + T[p.key].low + '" data-high="' + T[p.key].high + '"></div>' +
            '<ul class="pk-hl">' + highlights(p.key) + '</ul></article>';
        }).join('') + '</div><div class="pk-axis" data-scale="0,' + max + '"><div class="axis" data-ticks="0,' + max / 2 + ',' + max + '"></div></div>' +
      '</section>' +
      '<div class="tabs-s" role="tablist" aria-label="Details">' +
        '<button role="tab" aria-selected="true" data-tab="unk">What we could not confirm <span class="n">' + unk.length + '</span></button>' +
        '<button role="tab" aria-selected="false" data-tab="dec">What each goal does</button>' +
        '<button role="tab" aria-selected="false" data-tab="ph">Photos <span class="n">' + A.photoCount(h) + '</span></button></div>' +
      '<div class="tab-p" id="tab-unk">' + (unk.length ? '<p class="small muted">These lines are left out of every total and never shown as zero. Each one says what would settle it.</p><ul class="unk">' + unk.map(function(x){
          var fixPhotos = x[1].state === 'unverified', link = '#/houses/' + h.id + '/intake/' + (fixPhotos ? 'photos' : 'measurements');
          return '<li><span class="state ' + (fixPhotos ? 'state-unverified' : 'state-measure') + '">' + (fixPhotos ? 'Unverified' : 'Needs measurement') + '</span><span><b>' + x[0].name + ', ' + x[1].name.toLowerCase() + '</b><span class="small muted">' + RI.esc(x[1].fix) + ' would settle it.</span></span><a class="btn btn-secondary btn-sm" href="' + link + '" data-fix>' + (fixPhotos ? 'Add the photo' : 'Add the size') + '</a></li>';
        }).join('') + '</ul><p class="xsmall muted">Adding a photo or a size runs the house again. You get a new version; the old one is kept.</p>' : '<p class="muted">Every line is priced. Nothing is missing.</p>') + '</div>' +
      '<div class="tab-p" id="tab-dec" hidden><p class="small muted">The same parts, three goals. Decisions are made before any pricing, from the same evidence.</p><div class="scroll-x"><table class="dec"><thead><tr><th>Part</th>' + RI.PACKAGES.map(function(p){ return '<th>' + p.name + '</th>'; }).join('') + '</tr></thead><tbody>' +
        est.rooms.map(function(r){ return '<tr class="dec-room"><th colspan="4">' + r.name + '</th></tr>' + r.items.map(function(it){ return '<tr><td data-label="Part">' + RI.esc(it.name) + (RI.isHeld(it) ? ' <span class="state ' + (it.state === 'measure' ? 'state-measure' : 'state-unverified') + '">' + (it.state === 'measure' ? 'Needs measurement' : 'Unverified') + '</span>' : '') + '</td>' + ['E','S','P'].map(function(k){ var a = it.pk[k]; return '<td data-label="' + RI.PACKAGES.filter(function(x){ return x.key === k; })[0].name + '" class="' + (a[1] == null ? 'keep' : '') + '">' + RI.esc(a[0]) + '</td>'; }).join('') + '</tr>'; }).join(''); }).join('') +
        '</tbody></table></div></div>' +
      '<div class="tab-p" id="tab-ph" hidden>' + A.photosByRoom(h) + '</div>' +
      '<section class="sys-teaser" aria-labelledby="h-sys"><div><p class="label">House systems</p><h2 id="h-sys">Guidance, never a price in your totals</h2><p class="small muted">What to look for, typical lifespans and planning ranges for the four systems a renovation does not touch. Full guidance is in the presentation.</p></div>' +
        '<ul>' + est.mechanicals.map(function(m){ return '<li>' + RI.icon('info','i-sm') + '<span><b>' + m.name + '</b><span class="xsmall muted">' + m.src + '</span></span><span class="st st-draft">' + RI.icon('lock','i-sm') + 'In the presentation</span></li>'; }).join('') + '</ul></section>' +
      '<section class="pay-s">' +
        '<div class="pay-prev" aria-hidden="true"><div class="pp-sheet"><div class="pp-bar"><span>Essential</span><span class="on">Standard</span><span>Premium</span></div>' + est.rooms.slice(0, 4).map(function(r){ var t = RI.totals('S', {}, r.key); return '<div class="pp-row"><b>' + r.name + '</b><span>' + (t.high ? RI.money(t.low) + ' to ' + RI.money(t.high) : (r.items.some(RI.isHeld) ? 'Not priced yet' : 'No cost')) + '</span></div>'; }).join('') + '<div class="pp-fade"></div></div></div>' +
        '<div class="pay-copy"><p class="label">The full presentation</p><h2>' + (paid ? 'Your presentation is open' : 'Every room, every line, every product') + '</h2>' +
          '<ul class="ticks"><li>' + RI.icon('check') + '<span>Room by room and trade by trade, with the product for each line</span></li><li>' + RI.icon('check') + '<span>Switch goals and turn items on or off. Totals update at once</span></li><li>' + RI.icon('check') + '<span>Guidance on the roof, heating and cooling, water heater and panel</span></li><li>' + RI.icon('check') + '<span>A PDF and a private link to share</span></li>' + (A.isPro() ? '<li>' + RI.icon('check') + '<span>Task lists per trade, for your crews</span></li>' : '') + '</ul>' +
          (paid ? '<a class="btn btn-primary" href="#/houses/' + h.id + '/presentation">Open presentation ' + RI.icon('arrow','i-sm i-arrow') + '</a>'
            : trial ? '<div class="cta-row"><button type="button" class="btn btn-primary" id="trial-open">Open with your trial</button><span class="small muted">Included in your 15-day trial</span></div>'
            : '<div class="cta-row"><a class="btn btn-primary" href="#/houses/' + h.id + '/checkout" id="pay">Open the full presentation, $49</a><span class="small muted">One payment for this house. <span class="state state-sample">Sample price</span></span></div>') +
        '</div></section>' +
      '<p class="disc-line">' + RI.icon('info','i-sm') + 'This is an estimate for planning, never a contractor\'s bid. Lines we could not confirm are left out of the totals. A contractor still needs to see the house.</p>' +
      '</div>';
    RI.initRanges(view);
    view.querySelectorAll('.pk-card .rl').forEach(function(r, i){ r.classList.remove('drawn'); setTimeout(function(){ r.classList.add('drawn'); }, 250 + i * 220); });
    var tabs = view.querySelectorAll('.tabs-s [data-tab]');
    tabs.forEach(function(t){ t.addEventListener('click', function(){ tabs.forEach(function(x){ x.setAttribute('aria-selected', x === t); }); ['unk','dec','ph'].forEach(function(k){ view.querySelector('#tab-' + k).hidden = k !== t.getAttribute('data-tab'); }); }); });
    view.querySelector('.tabs-s').addEventListener('keydown', function(e){ if(e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; var arr = [].slice.call(tabs), i = arr.indexOf(doc.activeElement); if(i < 0) return; var n = arr[(i + (e.key === 'ArrowRight' ? 1 : arr.length - 1)) % arr.length]; n.focus(); n.click(); });
    var to = view.querySelector('#trial-open'); if(to) to.addEventListener('click', function(){ h.trialOpen = true; A.put(h); RI.toast('Opened with your trial.'); A.go('#/houses/' + h.id + '/presentation'); });
    if(!A.hasCheckout){ var pay = view.querySelector('#pay'); if(pay){ pay.removeAttribute('href'); pay.setAttribute('aria-disabled', 'true'); pay.classList.add('is-off'); pay.textContent = 'The presentation arrives in milestone 4'; } }
  }
  function isTrial(){ var s = A.me(); if(!s) return false; if(s.demo) return s.role === 'builder'; var u = RI.users.get(s.email) || {}; return !!u.trial && Date.now() < (u.at || 0) + 15 * 86400000; }

  A.route('/houses/:id', function(view, p){
    var h = A.get(p.id); if(!h){ view.innerHTML = A.notFound(); return; }
    var s = A.status(h);
    if(s === 'draft') draft(view, h);
    else if(s === 'ready' || s === 'open') ready(view, h);
    else working(view, h);
  }, {nav:'houses'});
})();
