/* App: SpatialIntelligenceCore, the photo-reading orb on Rooms and photos (user, Nov 2026).
   A reusable, state-driven component: RI.SpatialIntelligenceCore.create(host, {reduce}) -> {set(state, info), dim(on), resize()}.
   It only shows what it is given: the step the reading is on, and real results (room type, what the photo shows, the
   other rooms it could be, and the size measured for that room, marked Estimate until the owner confirms it). It never
   makes up a result. States: idle, scan, structure, identify, dims, done, unsure, ask, all.
   Drawn on one canvas, no images or video: a breathing, gently morphing glass orb with flowing emerald, teal and cyan
   light, a highlight, slow energy rings; a room wireframe and scan lines while it reads the structure; dimension lines
   while it sizes the room. One animation loop that stops when the core leaves the page; reduced motion draws still frames.
   The glow and gradients are a deliberate exception to DESIGN.md, for this orb only (user, Nov 2026). */
(function(){
  var RI = window.RI = window.RI || {};
  var STEPS = ['Scanning photo', 'Detecting structure', 'Identifying room type', 'Estimating dimensions'];
  /* Three palettes the orb moves between: working (emerald, teal, cyan), done (green), needs you (warm stone) */
  var WORK = {base:[[44,112,102], [12,36,34]], glow:[30,160,138], blobs:[[47,181,143], [22,163,160], [103,209,222], [214,255,245], [28,134,118]]};
  var GREEN = {base:[[48,116,80], [13,42,28]], glow:[49,150,92], blobs:[[63,191,127], [46,158,107], [143,227,176], [232,255,240], [40,150,90]]};
  var STONE = {base:[[112,104,94], [42,39,36]], glow:[156,146,134], blobs:[[185,172,154], [143,133,121], [216,207,194], [245,242,236], [160,150,138]]};
  var STATES = {
    idle:{act:.16, text:'Ready to understand your space'},
    scan:{act:.55, waves:1, text:'Analysing your space…'},
    structure:{act:.95, waves:1, wire:1, text:'Understanding walls, doors and windows'},
    identify:{act:.6, waves:.4, text:'Identifying the room type…'},
    dims:{act:.42, dims:1, text:'Estimating room dimensions…'},
    done:{act:.12, green:1, ok:1, text:'Room successfully identified'},
    unsure:{act:.3, stone:1, text:'Not sure which room. It needs your input'},
    ask:{act:.1, stone:.7, text:''},
    all:{act:.08, green:1, ok:1, text:'Every photo is in a room'}
  };
  function mix(a, b, k){ return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
  function rgba(c, a){ return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')'; }
  function esc(s){ return RI.esc ? RI.esc(String(s)) : String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[c]; }); }

  function create(host, opt){
    opt = opt || {};
    var reduce = !!opt.reduce;
    host.classList.add('sic');
    host.innerHTML = '<div class="sic-stage"><canvas class="sic-cv" aria-hidden="true"></canvas><span class="sic-tag" aria-hidden="true"></span>' +
        '<span class="sic-ok" aria-hidden="true">' + (RI.icon ? RI.icon('check') : '') + '</span></div>' +
      '<p class="sic-status" role="status"></p>' +
      '<ol class="sic-steps" aria-label="What it is doing">' + STEPS.map(function(s){ return '<li><span>' + s + '</span></li>'; }).join('') + '</ol>' +
      '<dl class="sic-info"></dl>';
    var cv = host.querySelector('canvas'), ctx = cv.getContext('2d'), okEl = host.querySelector('.sic-ok');
    var cur = {act:.16, waves:0, wire:0, dims:0, green:0, stone:0}, tgt = {act:.16, waves:0, wire:0, dims:0, green:0, stone:0};
    var t = 0, lt = 0, size = 0, labels = null, key = '';

    function resize(){
      var w = cv.clientWidth; if(!w) return;
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      if(size !== w || cv.width !== Math.round(w * dpr)){ size = w; cv.width = Math.round(w * dpr); cv.height = Math.round(w * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var R = size * .29; okEl.style.left = Math.round(size / 2 + R * .64 - 17) + 'px'; okEl.style.top = Math.round(size / 2 + R * .64 - 17) + 'px';
    }
    function palette(){
      function pick(k, i){ var a = i == null ? WORK[k] : WORK[k][i], b = i == null ? GREEN[k] : GREEN[k][i], c = i == null ? STONE[k] : STONE[k][i]; return mix(mix(a, b, cur.green), c, cur.stone); }
      return {base:[pick('base', 0), pick('base', 1)], glow:pick('glow'), blobs:WORK.blobs.map(function(_, i){ return pick('blobs', i); })};
    }
    function label(text, x, y, vertical){
      ctx.save(); ctx.font = '600 12px "Hanken Grotesk", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.translate(x, y); if(vertical) ctx.rotate(-Math.PI / 2);
      var w = ctx.measureText(text).width + 12;
      ctx.fillStyle = 'rgba(255,255,255,.94)'; ctx.fillRect(-w / 2, -10, w, 20);
      ctx.fillStyle = '#203B38'; ctx.fillText(text, 0, 1); ctx.restore();
    }
    function draw(){
      if(!size) return;
      var S = size, cx = S / 2, cy = S / 2, a = cur.act, R = S * .29 * (1 + Math.sin(t * .0016) * .018 * (1 - a * .5)), P = palette(), i;
      ctx.clearRect(0, 0, S, S);
      /* a soft halo */
      var g = ctx.createRadialGradient(cx, cy, R * .7, cx, cy, R * 1.75);
      g.addColorStop(0, rgba(P.glow, .2 + a * .18)); g.addColorStop(1, rgba(P.glow, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
      /* slow energy rings */
      for(i = 0; i < 3; i++){
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * (.00016 + i * .00006) * (i % 2 ? -1 : 1) + i * 1.1);
        ctx.strokeStyle = rgba(P.blobs[1], .12 + a * .2 + cur.wire * .18); ctx.lineWidth = 1;
        if(cur.wire > .3) ctx.setLineDash([4, 7]);
        ctx.beginPath(); ctx.ellipse(0, 0, R * (1.2 + i * .09), R * (1.2 + i * .09) * (.28 + i * .07), 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      /* the body: a circle that breathes and gently changes shape */
      var m = .007 + a * .016, body = new Path2D();
      for(i = 0; i <= 72; i++){
        var th = i / 72 * Math.PI * 2, r = R * (1 + m * (Math.sin(3 * th + t * .0011) * .6 + Math.sin(5 * th - t * .0017) * .4));
        if(i) body.lineTo(cx + Math.cos(th) * r, cy + Math.sin(th) * r); else body.moveTo(cx + Math.cos(th) * r, cy + Math.sin(th) * r);
      }
      body.closePath();
      ctx.save(); ctx.clip(body);
      var bg = ctx.createRadialGradient(cx - R * .3, cy - R * .35, R * .1, cx, cy, R * 1.15);
      bg.addColorStop(0, rgba(P.base[0], 1)); bg.addColorStop(1, rgba(P.base[1], 1));
      ctx.fillStyle = bg; ctx.fillRect(cx - R * 1.3, cy - R * 1.3, R * 2.6, R * 2.6);
      /* flowing light inside */
      ctx.globalCompositeOperation = 'lighter';
      P.blobs.forEach(function(c, j){
        var sp = .00035 + j * .00011, ph = j * 1.7;
        var bx = cx + Math.cos(t * sp + ph) * R * (.38 + .12 * Math.sin(t * .0007 + j)), by = cy + Math.sin(t * sp * 1.3 + ph) * R * (.34 + .1 * Math.cos(t * .0009 + j));
        var br = R * (.62 + .12 * Math.sin(t * .001 + j * 2)), gg = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        gg.addColorStop(0, rgba(c, j === 3 ? .32 : .46 + a * .16)); gg.addColorStop(1, rgba(c, 0));
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
      });
      if(cur.waves > .02){
        ctx.lineWidth = 7;
        for(var w = 0; w < 3; w++){
          var yy = cy + ((((t * .00045 + w / 3) % 1) * 2) - 1) * R;
          ctx.strokeStyle = rgba([255, 255, 255], .15 * cur.waves); ctx.beginPath();
          for(var xx = -R; xx <= R + 1; xx += 6){ var y2 = yy + Math.sin((xx / R) * 3 + t * .003 + w) * R * .06; if(xx === -R) ctx.moveTo(cx + xx, y2); else ctx.lineTo(cx + xx, y2); }
          ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      /* reading the structure: a room drawn inside, with a door and a window, and a scan plane */
      if(cur.wire > .02){
        var bw = R * .34, bh = R * .26, fx = R * .92, fy = R * .72, wa = cur.wire;
        ctx.strokeStyle = rgba([235, 255, 250], .55 * wa); ctx.lineWidth = 1.2; ctx.beginPath();
        ctx.rect(cx - bw, cy - bh, bw * 2, bh * 2);
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function(q){ ctx.moveTo(cx + q[0] * bw, cy + q[1] * bh); ctx.lineTo(cx + q[0] * fx, cy + q[1] * fy); });
        ctx.rect(cx - bw * .64, cy - bh * .08, bw * .36, bh * 1.08);
        ctx.rect(cx + bw * .08, cy - bh * .64, bw * .52, bh * .5);
        ctx.stroke();
        var sy = cy - fy + ((t * .0009) % 1) * fy * 2;
        ctx.strokeStyle = rgba([122, 211, 221], .85 * wa); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - R, sy); ctx.lineTo(cx + R, sy); ctx.stroke();
      }
      var hl = ctx.createRadialGradient(cx - R * .38, cy - R * .45, 0, cx - R * .38, cy - R * .45, R * .7);
      hl.addColorStop(0, 'rgba(255,255,255,.42)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = hl; ctx.fillRect(cx - R * 1.3, cy - R * 1.3, R * 2.6, R * 2.6);
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.38)'; ctx.lineWidth = 1.2; ctx.stroke(body);
      /* a viewfinder and sweeping arcs while it reads the structure */
      if(cur.wire > .02){
        var vb = R * 1.36, L = R * .22;
        ctx.strokeStyle = rgba(P.blobs[1], .8 * cur.wire); ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath();
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function(q){ ctx.moveTo(cx + q[0] * vb, cy + q[1] * (vb - L)); ctx.lineTo(cx + q[0] * vb, cy + q[1] * vb); ctx.lineTo(cx + q[0] * (vb - L), cy + q[1] * vb); });
        ctx.stroke(); ctx.lineWidth = 2.5;
        for(var s2 = 0; s2 < 2; s2++){ var a0 = t * .0016 + s2 * Math.PI; ctx.beginPath(); ctx.arc(cx, cy, R * 1.18, a0, a0 + .55); ctx.stroke(); }
      }
      /* dimension lines while it sizes the room; numbers only when the size is real */
      if(cur.dims > .02){
        var dp = cur.dims, y0 = cy + R * 1.34, x0 = cx + R * 1.34, hw = R * dp;
        ctx.strokeStyle = 'rgba(32,59,56,' + (.7 * dp).toFixed(3) + ')'; ctx.lineWidth = 1.2; ctx.lineCap = 'butt'; ctx.beginPath();
        ctx.moveTo(cx - hw, y0); ctx.lineTo(cx + hw, y0); ctx.moveTo(cx - hw, y0 - 5); ctx.lineTo(cx - hw, y0 + 5); ctx.moveTo(cx + hw, y0 - 5); ctx.lineTo(cx + hw, y0 + 5);
        ctx.moveTo(x0, cy - hw); ctx.lineTo(x0, cy + hw); ctx.moveTo(x0 - 5, cy - hw); ctx.lineTo(x0 + 5, cy - hw); ctx.moveTo(x0 - 5, cy + hw); ctx.lineTo(x0 + 5, cy + hw);
        ctx.stroke();
        if(labels && dp > .7){ label(labels.w, cx, y0); label(labels.l, x0, cy, true); }
      }
    }
    function loop(now){
      if(!host.isConnected) return;
      requestAnimationFrame(loop);
      var dt = Math.min(50, now - (lt || now)); lt = now;
      if(!reduce) t += dt * (.6 + cur.act * 1.6);
      var k = reduce ? 1 : Math.min(1, dt / 380);
      Object.keys(tgt).forEach(function(n){ cur[n] += (tgt[n] - cur[n]) * (n === 'dims' && !reduce ? Math.min(1, dt / 650) : k); });
      if(!size || cv.clientWidth !== size) resize();
      draw();
    }

    /* The state and the real results for it */
    function set(state, info){
      info = info || {};
      var k2 = state + '|' + JSON.stringify(info); if(k2 === key) return; key = k2;
      var d = STATES[state] || STATES.idle;
      tgt.act = d.act; tgt.waves = d.waves || 0; tgt.wire = d.wire || 0; tgt.green = d.green || 0; tgt.stone = d.stone || 0;
      tgt.dims = d.dims || (state === 'done' && info.size) ? 1 : 0;
      labels = info.size ? {w:'≈ ' + info.size.w + ' ft', l:'≈ ' + info.size.l + ' ft'} : null;
      host.querySelector('.sic-status').textContent = state === 'ask' ? info.count + ' photo' + (info.count === 1 ? ' needs' : 's need') + ' your input' : d.text;
      var tag = host.querySelector('.sic-tag'), txt = '', q = false;
      if(info.room && (state === 'identify' || state === 'dims' || state === 'done')) txt = info.room + ' detected';
      if(state === 'unsure'){ txt = info.newType ? 'Looks like: ' + info.newType : 'Not sure which room'; q = true; }
      tag.textContent = txt; tag.classList.toggle('q', q); tag.classList.toggle('on', !!txt);
      okEl.classList.toggle('on', !!d.ok);
      host.classList.toggle('is-done', !!d.ok);
      var nowI = info.step != null ? info.step : -1;
      host.querySelectorAll('.sic-steps li').forEach(function(li, i){
        var c = '';
        if(state === 'done' || state === 'all') c = i === 3 && info.skipDims ? 'is-skip' : 'is-done';
        else if(state === 'unsure') c = i < 2 ? 'is-done' : i === 2 ? 'is-q' : 'is-skip';
        else if(nowI > -1) c = i < nowI ? 'is-done' : i === nowI ? (i === 3 && info.skipDims ? 'is-skip' : 'is-now') : '';
        li.className = c; if(c === 'is-now') li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      });
      var rows = [];
      if(info.of) rows.push(['Photo', info.of[0] + ' of ' + info.of[1]]);
      if(info.room) rows.push(['Room type', esc(info.room)]);
      if(state === 'unsure') rows.push(['Room type', '<span class="sic-q">Not sure</span>']);
      if(info.alts && info.alts.length) rows.push(['Could be', esc(info.alts.join(' or '))]);
      if(info.size) rows.push(['Size', (info.size.verified ? '' : 'About ') + info.size.l + ' × ' + info.size.w + ' ft' + (info.size.verified ? '<span class="sic-ver">Confirmed</span>' : '<span class="sic-est">Estimate</span>')]);
      else if(info.note) rows.push(['Size', '<span class="sic-mu">' + esc(info.note) + '</span>']);
      if(info.sees && info.sees.length) rows.push(['Seen in photo', esc(info.sees.join(', '))]);
      host.querySelector('.sic-info').innerHTML = rows.length ? rows.map(function(r){ return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('') :
        '<dd class="sic-empty">' + (state === 'all' ? 'Check each room and its size next.' : state === 'ask' ? 'Everything else is sorted.' : 'What it finds in each photo shows here.') + '</dd>';
    }
    requestAnimationFrame(loop);
    set('idle', {});
    return {set:set, dim:function(on){ host.classList.toggle('is-dim', !!on); }, resize:resize, el:host};
  }
  RI.SpatialIntelligenceCore = {create:create, STEPS:STEPS};
})();
