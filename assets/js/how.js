/* How it works: who-does-what lanes, scroll-driven walkthrough, evidence ladder, check gates */
(function(){
  var RI = window.RI, doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Lanes: one line through the eight steps ---------- */
  var lanes = doc.getElementById('lanes'), poly = lanes.querySelector('polyline'), svg = lanes.querySelector('svg');
  function drawLanes(){
    var box = lanes.getBoundingClientRect();
    svg.setAttribute('width', box.width); svg.setAttribute('height', box.height); svg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
    var nodes = [].slice.call(lanes.querySelectorAll('.lane-node')).sort(function(a, b){ return a.style.getPropertyValue('--step') - b.style.getPropertyValue('--step'); });
    poly.setAttribute('points', nodes.map(function(n){ var r = n.getBoundingClientRect(); return (r.left - box.left + r.width / 2) + ',' + (r.top - box.top + r.height / 2); }).join(' '));
  }
  drawLanes();
  if('ResizeObserver' in window) new ResizeObserver(drawLanes).observe(lanes); else window.addEventListener('resize', drawLanes);
  if(doc.fonts && doc.fonts.ready) doc.fonts.ready.then(drawLanes);

  /* ---------- Section nav: current section ---------- */
  var links = [].slice.call(doc.querySelectorAll('.hiw-nav a'));
  var secs = links.map(function(a){ return doc.querySelector(a.getAttribute('href')); });
  function spy(){
    var y = window.scrollY + 180, cur = 0;
    secs.forEach(function(s, i){ if(s && s.offsetTop <= y) cur = i; });
    links.forEach(function(a, i){ a.classList.toggle('cur', i === cur); if(i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }
  window.addEventListener('scroll', spy, {passive:true}); spy();

  /* ---------- 2. Walkthrough: the step in the middle of the screen drives the stage ---------- */
  var stage = doc.getElementById('stage'), steps = [].slice.call(doc.querySelectorAll('.wstep'));
  var laneNodes = [].slice.call(lanes.querySelectorAll('.lane-node'));
  function setStep(n){
    if(stage.getAttribute('data-step') === String(n) && stage.classList.contains('ready')) return;
    stage.setAttribute('data-step', n); stage.classList.add('ready');
    steps.forEach(function(s){ s.classList.toggle('on', s.getAttribute('data-step') === String(n)); });
    stage.querySelectorAll('.frame').forEach(function(f, i){
      var on = i + 1 === +n; f.classList.toggle('on', on);
      if(on) f.querySelectorAll('.rl').forEach(function(r){ r.classList.remove('drawn'); void r.offsetWidth; setTimeout(function(){ r.classList.add('drawn'); }, 350); });
    });
    stage.querySelectorAll('.walk-rail span').forEach(function(s, i){ s.classList.toggle('done', i < n); });
  }
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting) setStep(e.target.getAttribute('data-step')); }); }, {rootMargin:'-45% 0px -50% 0px'});
    steps.forEach(function(s){ io.observe(s); });
  }
  setStep(1);
  /* Keep lane links working: scroll to the step and show it */
  laneNodes.forEach(function(a){ a.addEventListener('click', function(){ setStep(a.style.getPropertyValue('--step')); }); });

  /* ---------- 3. Evidence ladder ---------- */
  var BASE = 412, RATE = [6.5, 10.5];
  var RUNGS = [
    {k:'typed', t:'Typed by you', d:'Room sizes from the intake', ev:'reported', u:.04},
    {k:'pattern', t:'A pattern in a photo', d:'For example a row of tiles of known size', ev:'observed', u:.1},
    {k:'template', t:'A room template', d:'The usual layout for this room type', ev:'inferred', u:.2},
    {k:'typical', t:'A typical size', d:'Common for houses of this age and type', ev:'inferred', u:.32},
    {k:'none', t:'Nothing to go on', d:'No size, no pattern, no template that fits', ev:'unknown', u:null}
  ];
  var rungEl = doc.getElementById('rungs'), cur = 0;
  rungEl.innerHTML = RUNGS.map(function(r, i){ return '<button type="button" role="radio" class="rung" data-i="' + i + '" aria-checked="' + (i === 0) + '"' + (i === 0 ? '' : ' tabindex="-1"') + '><span class="rung-k">' + (i + 1) + '</span><span><b>' + r.t + '</b><span>' + r.d + '</span></span>' + RI.ev(r.ev) + '</button>'; }).join('');
  function pickRung(i, focus){
    cur = i; var r = RUNGS[i];
    rungEl.querySelectorAll('.rung').forEach(function(b, j){ b.setAttribute('aria-checked', j === i); b.tabIndex = j === i ? 0 : -1; if(j === i && focus) b.focus(); });
    rungEl.style.setProperty('--sel', i);
    var rl = doc.getElementById('lq-rl'), price = doc.getElementById('lq-price');
    if(r.u == null){
      doc.getElementById('lq-qty').innerHTML = 'Size: not known';
      doc.getElementById('lq-ev').innerHTML = RI.ev('unknown');
      price.innerHTML = '<span class="state state-measure">Needs measurement</span>';
      rl.parentNode.classList.add('empty');
      doc.getElementById('lq-note').textContent = 'Not in the total, and never shown as zero. The bedroom sizes would settle it. The rest of the house is still priced.';
      return;
    }
    rl.parentNode.classList.remove('empty');
    var qlo = Math.round(BASE * (1 - r.u)), qhi = Math.round(BASE * (1 + r.u));
    var lo = Math.round(qlo * RATE[0] / 10) * 10, hi = Math.round(qhi * RATE[1] / 10) * 10;
    doc.getElementById('lq-qty').innerHTML = (r.u < .05 ? '412 sq ft' : qlo + ' to ' + qhi + ' sq ft');
    doc.getElementById('lq-ev').innerHTML = RI.ev(r.ev);
    price.innerHTML = RI.range(lo, hi); price.classList.remove('bump'); void price.offsetWidth; price.classList.add('bump');
    rl.setAttribute('data-low', lo); rl.setAttribute('data-high', hi); RI.drawRange(rl); rl.classList.add('drawn');
    doc.getElementById('lq-note').textContent = i === 0 ? 'The narrowest range: the size is yours, so only the rate and product vary.' : 'The range is ' + Math.round((hi - lo) / (Math.round(BASE * 1.04 * RATE[1] / 10) * 10 - Math.round(BASE * .96 * RATE[0] / 10) * 10) * 10) / 10 + ' times as wide as with your typed sizes.';
  }
  rungEl.addEventListener('click', function(e){ var b = e.target.closest('.rung'); if(b) pickRung(+b.getAttribute('data-i')); });
  rungEl.addEventListener('keydown', function(e){
    var k = e.key, n = null;
    if(k === 'ArrowDown' || k === 'ArrowRight') n = Math.min(RUNGS.length - 1, cur + 1);
    if(k === 'ArrowUp' || k === 'ArrowLeft') n = Math.max(0, cur - 1);
    if(n != null){ e.preventDefault(); pickRung(n, true); }
  });
  RI.initRanges(doc.getElementById('evidence'));
  pickRung(0);

  /* ---------- 4. Checks as gates ---------- */
  var GATES = [
    ['A goal is chosen','The line belongs to Essential, Standard or Premium.'],
    ['The quantity is supported','If not, the line shows "needs measurement" and names the size that would settle it.'],
    ['The condition is clear enough','If not, the line shows "unverified" and names the photo that would settle it.'],
    ['A rate or product is ready','If not, the line shows "not priced yet".'],
    ['One trade owns the cost','No task is billed by two trades.'],
    ['The scope is complete','Work the action needs, like a drain reconnection, is included.'],
    ['Nothing overlaps','A tub is never reglazed and replaced in the same estimate.']
  ];
  var gatesEl = doc.getElementById('gates');
  gatesEl.insertAdjacentHTML('beforeend', GATES.map(function(g, i){ return '<span class="gate" style="--g:' + i + '"><span class="gk">' + (i + 1) + '</span></span>'; }).join(''));
  var ACT = {E:['Reglaze the tub and surround',900,1600], S:['Replace tub and tile surround',5200,8400], P:['Replace with a soaking tub and full-height tile',6800,9000]};
  var el = {photo:doc.getElementById('sim-photo'), size:doc.getElementById('sim-size'), rate:doc.getElementById('sim-rate'), pk:doc.getElementById('sim-pk')};
  function run(){
    var pass = [true, el.size.checked, el.photo.checked, el.rate.checked, true, true, true];
    var stop = pass.indexOf(false); /* first gate that fails, or -1 */
    var a = ACT[el.pk.value], ok = stop < 0;
    var state = ok ? ['state-priced','Priced',''] : stop === 1 ? ['state-measure','Needs measurement','The bathroom length and width would settle it.'] : stop === 2 ? ['state-unverified','Unverified','A photo of the tub and its walls would settle it.'] : ['state-notpriced','Not priced yet','Waiting for an approved rate.'];
    doc.getElementById('sim-state').innerHTML = '<span class="state ' + state[0] + '">' + state[1] + '</span>';
    doc.getElementById('sim-act').textContent = ok ? a[0] : state[2];
    doc.getElementById('sim-price').innerHTML = ok ? RI.range(a[1], a[2]) : '<span class="muted" style="font-weight:400">Not in the total</span>';
    var rl = doc.getElementById('sim-rl'); rl.parentNode.hidden = !ok;
    if(ok){ rl.setAttribute('data-low', a[1]); rl.setAttribute('data-high', a[2]); RI.drawRange(rl); rl.classList.add('drawn'); }
    var reach = ok ? 7 : stop; /* gates passed before the stop */
    gatesEl.querySelectorAll('.gate').forEach(function(g, i){ g.classList.toggle('pass', pass[i] && (ok || i < stop)); g.classList.toggle('fail', !pass[i]); g.classList.toggle('stop', i === stop); g.classList.toggle('later', !ok && i > stop && pass[i]); });
    gatesEl.style.setProperty('--reach', reach);
    gatesEl.classList.toggle('done', ok);
    doc.getElementById('gate-list').innerHTML = GATES.map(function(g, i){
      var cls = !pass[i] ? 'no' : (ok || i < stop) ? 'ok' : 'wait';
      return '<li class="' + cls + (i === stop ? ' stop' : '') + '">' + RI.icon(cls === 'ok' ? 'check' : cls === 'no' ? 'x' : 'minus','i-sm') + '<span><b>' + g[0] + '</b><span>' + g[1] + '</span></span></li>';
    }).join('');
  }
  ['photo','size','rate','pk'].forEach(function(k){ el[k].addEventListener('change', run); });
  run();
})();
