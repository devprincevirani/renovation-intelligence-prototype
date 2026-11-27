/* Home page: the hero "house being read" entrance, the before and after gallery, goal tiles, what-you-get visuals,
   ZIP check and the quick waitlist. Results only: no method words on this page.
   Motion: the hero's reading loop and Replay, blocks that fade in on scroll, the plan drawing in, hover lift
   (restored Nov 27 at the user's request: the page looked too plain without them). */
(function(){
  var RI = window.RI, doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Hero: lines draw, pins appear, the price card arrives. Loops every 8 s while on screen. ---------- */
  var seq = doc.getElementById('hero-seq'), replay = doc.getElementById('hero-replay'), timers = [], loopT = null, onScreen = true;
  function drawSheet(on){ seq.querySelectorAll('.sheet .rl').forEach(function(r){ r.classList.toggle('drawn', on); }); }
  function finish(){
    timers.forEach(clearTimeout); timers = [];
    seq.classList.remove('seq-pre', 'seq-run'); seq.classList.add('seq-done'); drawSheet(true); replay.hidden = false;
    clearTimeout(loopT);
    if(!reduce) loopT = setTimeout(function again(){ if(onScreen && !doc.hidden) run(); else loopT = setTimeout(again, 1000); }, 5000);
  }
  function run(){
    timers.forEach(clearTimeout); timers = []; clearTimeout(loopT);
    replay.hidden = true; drawSheet(false);
    seq.classList.remove('seq-done', 'seq-run'); seq.classList.add('seq-pre');
    void seq.offsetWidth;
    seq.classList.remove('seq-pre'); seq.classList.add('seq-run');
    timers.push(setTimeout(function(){ drawSheet(true); }, 1900));
    timers.push(setTimeout(finish, 2900));
  }
  if('IntersectionObserver' in window) new IntersectionObserver(function(es){ onScreen = es[0].isIntersecting; }).observe(seq);
  if(reduce) finish(); else requestAnimationFrame(function(){ setTimeout(run, 250); });
  replay.addEventListener('click', run);
  seq.querySelector('.hero-photo').addEventListener('click', function(e){ if(seq.classList.contains('seq-run') && !e.target.closest('.replay')) finish(); });

  /* ---------- Before and after gallery ---------- */
  var cmpPk = 'S';
  var cmp = RI.Compare.render(doc.getElementById('cmp'), function(){ return cmpPk; }, {simple:true, beforeAfter:true, tabs:doc.getElementById('cmp-rooms')});
  var cseg = doc.getElementById('cmp-seg');
  function setCmp(k){ cmpPk = k; cseg.querySelectorAll('[data-pk]').forEach(function(x){ x.setAttribute('aria-selected', x.getAttribute('data-pk') === k); }); RI.syncSeg(cseg); cmp.update(); }
  cseg.addEventListener('click', function(e){ var b = e.target.closest('[data-pk]'); if(b) setCmp(b.getAttribute('data-pk')); });
  cseg.addEventListener('keydown', function(e){
    if(e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var ks = ['E','S','P'], n = ks[(ks.indexOf(cmpPk) + (e.key === 'ArrowRight' ? 1 : 2)) % 3]; setCmp(n); cseg.querySelector('[data-pk="' + n + '"]').focus();
  });

  /* ---------- Three goals: product tiles. On a phone one package at a time, with the package switch (DESIGN.md 6) ---------- */
  var boards = doc.getElementById('boards');
  RI.Materials.render(boards);
  boards.setAttribute('data-show', 'S');
  boards.insertAdjacentHTML('beforebegin', '<div class="seg pk-phone" role="tablist" aria-label="Package"><span class="seg-thumb"></span>' +
    RI.PACKAGES.map(function(p){ return '<button type="button" role="tab" data-pk="' + p.key + '" aria-selected="' + (p.key === 'S') + '">' + p.name + '</button>'; }).join('') + '</div>');
  var pks = boards.previousElementSibling;
  function showPk(k, focus){
    boards.setAttribute('data-show', k);
    pks.querySelectorAll('[data-pk]').forEach(function(b){ var on = b.getAttribute('data-pk') === k; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; if(on && focus) b.focus(); });
    RI.syncSeg(pks);
  }
  pks.addEventListener('click', function(e){ var b = e.target.closest('[data-pk]'); if(b) showPk(b.getAttribute('data-pk')); });
  pks.addEventListener('keydown', function(e){
    if(e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var ks = ['E','S','P'], cur = boards.getAttribute('data-show'); showPk(ks[(ks.indexOf(cur) + (e.key === 'ArrowRight' ? 1 : 2)) % 3], true);
  });
  showPk('S');

  /* ---------- Floor plan explorer ---------- */
  var st = {pk:'S', off:{}, room:'kitchen'};
  var panel = doc.getElementById('ex-panel');
  var plan = RI.Plan.mount(doc.getElementById('plan'), {onSelect:function(k){ st.room = k; render(true); }});
  function roomOf(k){ return RI.SAMPLE.rooms.filter(function(r){ return r.key === k; })[0]; }
  function renderPanel(bump){
    var r = roomOf(st.room), t = RI.totals(st.pk, st.off, st.room), held = r.items.some(RI.isHeld);
    var items = r.items.map(function(it){
      if(RI.isHeld(it)) return '<div class="t-item"><span><span class="nm">' + RI.esc(it.name) + '</span><span class="ac">' + RI.esc(it.fix) + ' would settle it</span></span><span class="state ' + (it.state === 'measure' ? 'state-measure' : 'state-unverified') + '">' + (it.state === 'measure' ? 'Needs measurement' : 'Unverified') + '</span></div>';
      var p = it.pk[st.pk], keep = p[1] == null, off = !!st.off[it.id];
      return '<div class="t-item' + (off ? ' off' : '') + '"><span><span class="nm">' + RI.esc(it.name) + '</span><span class="ac">' + RI.esc(p[0]) + '</span></span>' +
        (keep ? '<span class="keep">No cost</span>' : '<span class="range-txt">' + RI.range(p[1], p[2]) + '</span><label class="switch"><input type="checkbox" data-id="' + it.id + '"' + (off ? '' : ' checked') + '><span class="track"></span><span class="sr">Include ' + RI.esc(it.name) + '</span></label>') + '</div>';
    }).join('');
    panel.innerHTML = '<div class="ex-head"><p class="label">Selected room</p><h3>' + r.name + '</h3><p class="small muted">' + r.sub + '</p>' +
      '<a class="textlink" href="sample/">Open the full sample presentation ' + RI.icon('arrow','i-sm') + '</a></div>' +
      '<div class="ex-total"><span class="big-range' + (bump ? ' bump' : '') + '">' + (t.high ? RI.range(t.low, t.high) : '<span class="to" style="padding:0">No cost under this goal</span>') + '</span>' +
      (held ? '<span class="state state-partial">Partial</span>' : '') + '</div>' +
      '<div data-scale="0,30000"><div class="rl thick' + (held ? ' partial' : '') + '" data-low="' + t.low + '" data-high="' + t.high + '"></div></div>' +
      '<div class="tryit-items">' + items + '</div>';
    RI.initRanges(panel); panel.querySelectorAll('.rl').forEach(function(x){ x.classList.add('drawn'); });
  }
  function render(bump){
    plan.update(st.pk, st.off, st.room);
    var h = RI.totals(st.pk, st.off);
    doc.getElementById('ex-house').innerHTML = RI.range(h.low, h.high);
    renderPanel(bump);
  }
  panel.addEventListener('change', function(e){
    var id = e.target.getAttribute('data-id'); if(!id) return;
    st.off[id] = !e.target.checked; render(true);
    var sw = panel.querySelector('[data-id="' + id + '"]'); if(sw) sw.focus();
  });
  var seg = doc.getElementById('ex-seg');
  function setPk(k){ st.pk = k; seg.querySelectorAll('[data-pk]').forEach(function(x){ x.setAttribute('aria-selected', x.getAttribute('data-pk') === k); }); RI.syncSeg(seg); render(true); }
  seg.addEventListener('click', function(e){ var b = e.target.closest('[data-pk]'); if(b) setPk(b.getAttribute('data-pk')); });
  seg.addEventListener('keydown', function(e){
    if(e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var ks = ['E','S','P'], n = ks[(ks.indexOf(st.pk) + (e.key === 'ArrowRight' ? 1 : 2)) % 3]; setPk(n); seg.querySelector('[data-pk="' + n + '"]').focus();
  });
  render(false);

  /* ---------- Areas strip ---------- */
  doc.getElementById('areas-strip').innerHTML = Object.keys(RI.AREAS).map(function(k){
    var a = RI.AREAS[k];
    return '<a class="area-card" href="renovation-cost/' + k + '/"><img src="' + RI.img(a.img) + '" alt="" loading="lazy" width="' + a.w + '" height="' + a.h + '"><span class="t"><h3>' + a.name + '</h3><span>' + a.county + '</span><span class="go">See costs' + RI.icon('arrow','i-sm') + '</span></span></a>';
  }).join('');

  /* ---------- What you get: three range lines from the sample house ---------- */
  (function(){
    var host = doc.getElementById('vis-ranges'); if(!host) return;
    var T = {E:RI.totals('E'), S:RI.totals('S'), P:RI.totals('P')}, max = Math.ceil(T.P.high / 25000) * 25000;
    host.setAttribute('data-scale', '0,' + max);
    host.innerHTML = RI.PACKAGES.map(function(p){ var t = T[p.key];
      return '<div class="hx-r' + (p.key === 'S' ? ' on' : '') + '"><span>' + p.name + '</span><div class="rl partial" data-low="' + t.low + '" data-high="' + t.high + '"></div></div>';
    }).join('');
    RI.initRanges(host);
  })();

  /* ---------- An unknown is never a zero: the same estimate, shown two ways ---------- */
  (function(){
    var host = doc.getElementById('uz'); if(!host) return;
    var K = RI.totals('S', {}, 'kitchen'), L = RI.totals('S', {}, 'living'), B = RI.totals('S', {}, 'hallbath');
    var lo = K.low + L.low + B.low, hi = K.high + L.high + B.high;
    var rows = [['kitchen-dated.jpg', 'Kitchen', K], ['wood-floor.jpg', 'Living room', L], ['ba/bath-before.jpg', 'Hall bath', B]];
    function card(bad){
      return '<article class="uz-card' + (bad ? ' is-bad' : ' is-good') + '">' +
        '<header class="uz-h"><span class="uz-tag">' + (bad ? RI.icon('x','i-sm') + 'If a missing photo counted as $0' : RI.icon('check','i-sm') + 'How we show it') + '</span></header>' +
        '<ul class="uz-rows">' + rows.map(function(r){ return '<li><img src="' + RI.img(r[0]) + '" alt=""><span class="uz-n">' + r[1] + '</span><span class="range-txt">' + RI.range(r[2].low, r[2].high) + '</span></li>'; }).join('') +
          '<li class="uz-miss"><span class="uz-noph">' + RI.icon('camera','i-sm') + '</span><span class="uz-n">Hall bath tub<small>No clear photo</small></span>' +
            (bad ? '<span class="uz-zero">$0</span>' : '<span class="state state-unverified">Needs a photo</span>') + '</li></ul>' +
        '<footer class="uz-f"><span class="uz-tl">Total</span><span class="range-txt uz-t">' + RI.range(lo, hi) + '</span>' +
          (bad ? '<span class="uz-note bad">' + RI.icon('warn','i-sm') + 'Looks complete. It is not.</span>'
               : '<span class="uz-note good"><span class="state state-partial">Partial</span>Add the tub photo to finish it</span>') + '</footer></article>';
    }
    host.innerHTML = card(true) + '<span class="uz-vs" aria-hidden="true">vs</span>' + card(false);
  })();

  /* ---------- Questions: on a phone they all start closed, so the section is one screen ---------- */
  if(window.matchMedia('(max-width:639px)').matches) doc.querySelectorAll('#questions details[open]').forEach(function(d){ d.open = false; });

  /* ---------- Reveal on scroll (restored Nov 27 at the user's request). Hidden only under html.hx-rv, which is set
     here when motion is allowed, so reduced motion or a failed script shows everything ---------- */
  var rv = doc.querySelectorAll('.hx [data-rv], .site-foot [data-rv]');
  if(!reduce && 'IntersectionObserver' in window){
    doc.documentElement.classList.add('hx-rv');
    var rio = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting) return;
        e.target.classList.add('in'); rio.unobserve(e.target);
        e.target.querySelectorAll('.rl').forEach(function(r){ r.classList.add('drawn'); });
      });
    }, {rootMargin:'0px 0px -10% 0px'});
    rv.forEach(function(el, i){ el.style.setProperty('--rv', (i % 4) * 70 + 'ms'); rio.observe(el); });
  } else {
    rv.forEach(function(el){ el.querySelectorAll('.rl').forEach(function(r){ r.classList.add('drawn'); }); });
  }

  /* ---------- Priced for your ZIP code ---------- */
  var zf = doc.getElementById('zip-form');
  if(zf) zf.addEventListener('submit', function(e){
    e.preventDefault();
    var v = doc.getElementById('zip-in').value.trim(), msg = doc.getElementById('zip-msg');
    if(!/^\d{5}$/.test(v)){ msg.textContent = 'Enter a five-digit ZIP code.'; return; }
    RI.store.set('zip', v);
    var local = /^48[0-3]/.test(v); /* sample: the first market has local prices */
    msg.innerHTML = local ? 'Prices for ' + v + ' are local. <a data-cta href="' + RI.url('waitlist/') + '"></a>'
                          : 'No local prices for ' + v + ' yet. <a href="' + RI.url('waitlist/?zip=' + v) + '">Join the waitlist for this area</a>';
    if(local) RI.applyCtas();
  });

  /* ---------- Quick waitlist (before launch) ---------- */
  var f = doc.getElementById('wl-quick');
  if(f){
    var input = doc.getElementById('wq-email');
    f.addEventListener('submit', function(e){
      e.preventDefault();
      var v = input.value.trim();
      if(!RI.form.emailOk(v)){ RI.form.setInvalid(input, v ? 'Check the email address, for example name@example.com.' : 'Enter your email address.'); input.focus(); return; }
      RI.form.setInvalid(input, null);
      var list = RI.store.get('waitlist', []);
      var exists = list.some(function(x){ return x.email === v.toLowerCase(); });
      if(!exists){ list.push({email:v.toLowerCase(), type:'', zip:RI.store.get('zip', ''), at:Date.now(), source:'home'}); RI.store.set('waitlist', list); RI.track('waitlist_joined', {source:'home'}); }
      f.innerHTML = '<div class="success" role="status"><div class="mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path class="draw-check" d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>' +
        '<p><b>' + (exists ? 'You are already on the list.' : 'You are on the list.') + '</b> We will write to ' + RI.esc(v) + ' once, when it opens.</p>' +
        '<a class="textlink" href="waitlist/?email=' + encodeURIComponent(v) + '">Add your account type ' + RI.icon('arrow','i-sm') + '</a></div>';
    });
    input.addEventListener('blur', function(){ if(input.value && !RI.form.emailOk(input.value)) RI.form.setInvalid(input, 'Check the email address, for example name@example.com.'); });
    input.addEventListener('input', function(){ if(RI.form.emailOk(input.value)) RI.form.setInvalid(input, null); });
  }
})();
