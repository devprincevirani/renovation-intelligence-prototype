/* Home page: hero "house being read" sequence, before and after gallery, material boards,
   floor plan explorer, areas strip, quick waitlist */
(function(){
  var RI = window.RI, doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ---------- Hero sequence: lines draw, pins appear, the sheet arrives ---------- */
  var seq = doc.getElementById('hero-seq'), replay = doc.getElementById('hero-replay'), timers = [];
  function drawSheet(on){ seq.querySelectorAll('.sheet .rl').forEach(function(r){ r.classList.toggle('drawn', on); }); }
  function finish(){
    timers.forEach(clearTimeout); timers = [];
    seq.classList.remove('seq-pre', 'seq-run'); seq.classList.add('seq-done'); drawSheet(true); replay.hidden = false;
  }
  function run(){
    timers.forEach(clearTimeout); timers = [];
    replay.hidden = true; drawSheet(false);
    seq.classList.remove('seq-done', 'seq-run'); seq.classList.add('seq-pre');
    void seq.offsetWidth;
    seq.classList.remove('seq-pre'); seq.classList.add('seq-run');
    timers.push(setTimeout(function(){ drawSheet(true); }, 1900));
    timers.push(setTimeout(finish, 2900));
  }
  if(reduce) finish(); else requestAnimationFrame(function(){ setTimeout(run, 250); });
  replay.addEventListener('click', run);
  seq.querySelector('.hero-photo').addEventListener('click', function(e){ if(seq.classList.contains('seq-run') && !e.target.closest('.replay')) finish(); });

  /* ---------- Before and after gallery ---------- */
  var cmpPk = 'S';
  var cmp = RI.Compare.render(doc.getElementById('cmp'), function(){ return cmpPk; });
  var cseg = doc.getElementById('cmp-seg');
  function setCmp(k){ cmpPk = k; cseg.querySelectorAll('[data-pk]').forEach(function(x){ x.setAttribute('aria-selected', x.getAttribute('data-pk') === k); }); RI.syncSeg(cseg); cmp.update(); }
  cseg.addEventListener('click', function(e){ var b = e.target.closest('[data-pk]'); if(b) setCmp(b.getAttribute('data-pk')); });
  cseg.addEventListener('keydown', function(e){
    if(e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var ks = ['E','S','P'], n = ks[(ks.indexOf(cmpPk) + (e.key === 'ArrowRight' ? 1 : 2)) % 3]; setCmp(n); cseg.querySelector('[data-pk="' + n + '"]').focus();
  });

  /* ---------- Material boards ---------- */
  RI.Materials.render(doc.getElementById('boards'));

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
    panel.innerHTML = '<div class="ex-head"><p class="label">Selected room</p><h3>' + r.name + '</h3><p class="small muted">' + r.sub + '</p></div>' +
      '<div class="ex-total"><span class="big-range' + (bump ? ' bump' : '') + '">' + (t.high ? RI.range(t.low, t.high) : '<span class="to" style="padding:0">No cost under this goal</span>') + '</span>' +
      (held ? '<span class="state state-partial">Partial</span>' : '') + '</div>' +
      '<div data-scale="0,30000"><div class="rl thick' + (held ? ' partial' : '') + '" data-low="' + t.low + '" data-high="' + t.high + '"></div></div>' +
      '<div class="tryit-items">' + items + '</div>' +
      '<a class="textlink" href="sample/">Open the full sample presentation ' + RI.icon('arrow','i-sm') + '</a>';
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
      if(!exists){ list.push({email:v.toLowerCase(), type:'', zip:'', at:Date.now(), source:'home'}); RI.store.set('waitlist', list); RI.track('waitlist_joined', {source:'home'}); }
      f.innerHTML = '<div class="success" role="status"><div class="mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path class="draw-check" d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>' +
        '<p><b>' + (exists ? 'You are already on the list.' : 'You are on the list.') + '</b> We will write to ' + RI.esc(v) + ' once, when it opens.</p>' +
        '<div class="mail-sim" aria-label="Demo inbox"><div class="mh">' + RI.icon('mail','i-sm') + '<span><b>Demo inbox</b> · You are on the waitlist</span></div><div class="mb"><p>Thanks for joining. We will write once, when Renovation Intelligence opens on April 1, 2027.</p></div></div>' +
        '<a class="textlink" href="waitlist/?email=' + encodeURIComponent(v) + '">Add your area and account type ' + RI.icon('arrow','i-sm') + '</a></div>';
    });
    input.addEventListener('blur', function(){ if(input.value && !RI.form.emailOk(input.value)) RI.form.setInvalid(input, 'Check the email address, for example name@example.com.'); });
    input.addEventListener('input', function(){ if(RI.form.emailOk(input.value)) RI.form.setInvalid(input, null); });
  }
})();
