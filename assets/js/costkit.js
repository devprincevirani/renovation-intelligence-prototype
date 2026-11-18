/* Renovation cost components, shared by the hub, area pages and house type pages:
   house elevation drawings, the schematic area map, the rate explorer, and "typical vs your house". */
(function(){
  var RI = window.RI, doc = document;

  /* ---------- House elevations: one line style, 240 by 150, ground at y 120 ---------- */
  function dim(x1, x2, label){
    return '<g class="el-dim"><line x1="' + x1 + '" y1="140" x2="' + x2 + '" y2="140"/><line x1="' + x1 + '" y1="136" x2="' + x1 + '" y2="144"/><line x1="' + x2 + '" y1="136" x2="' + x2 + '" y2="144"/>' +
      '<rect x="' + ((x1 + x2) / 2 - 26) + '" y="134" width="52" height="12" class="el-dim-bg"/><text x="' + ((x1 + x2) / 2) + '" y="143" text-anchor="middle">' + label + '</text></g>';
  }
  function win(x, y, w, h){ return '<rect class="el-win" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/><line class="el-thin" x1="' + (x + w / 2) + '" y1="' + y + '" x2="' + (x + w / 2) + '" y2="' + (y + h) + '"/>'; }
  var BODY = {
    'brick-ranch':
      '<rect class="el-fill" x="22" y="80" width="150" height="40"/><polyline class="el-line" points="12,80 92,56 180,80"/><rect class="el-fill" x="122" y="58" width="10" height="12"/>' +
      '<rect class="el-fill" x="172" y="90" width="56" height="30"/><polyline class="el-line" points="170,84 203,74 234,90"/>' +
      '<rect class="el-door" x="178" y="97" width="44" height="23"/><line class="el-thin" x1="178" y1="103" x2="222" y2="103"/><line class="el-thin" x1="178" y1="109" x2="222" y2="109"/><line class="el-thin" x1="178" y1="115" x2="222" y2="115"/>' +
      win(34, 92, 22, 14) + win(62, 92, 22, 14) + '<rect class="el-door" x="96" y="96" width="12" height="24"/>' + win(120, 92, 40, 16) +
      '<rect class="el-below" x="22" y="120" width="150" height="14"/>' + dim(22, 228, 'about 60 ft'),
    'bungalow':
      '<rect class="el-fill" x="50" y="78" width="140" height="42"/><polyline class="el-line" points="40,78 120,26 200,78"/><rect class="el-fill" x="160" y="40" width="10" height="22"/>' +
      '<rect class="el-fill" x="98" y="52" width="44" height="18"/><polyline class="el-line" points="94,52 120,40 146,52"/>' + win(108, 55, 24, 11) +
      '<line class="el-line" x1="44" y1="90" x2="196" y2="90"/><line class="el-line" x1="54" y1="90" x2="54" y2="120"/><line class="el-line" x1="186" y1="90" x2="186" y2="120"/><line class="el-thin" x1="54" y1="108" x2="104" y2="108"/><line class="el-thin" x1="136" y1="108" x2="186" y2="108"/>' +
      win(64, 95, 26, 13) + '<rect class="el-door" x="113" y="96" width="14" height="24"/>' + win(150, 95, 26, 13) +
      '<rect class="el-below" x="50" y="120" width="140" height="14"/>' + dim(50, 190, 'about 32 ft'),
    'colonial':
      '<rect class="el-fill" x="56" y="48" width="128" height="72"/><polyline class="el-line" points="48,48 120,24 192,48"/><rect class="el-fill" x="170" y="26" width="10" height="18"/>' +
      win(68, 58, 20, 16) + win(110, 58, 20, 16) + win(152, 58, 20, 16) + win(68, 90, 20, 16) + win(152, 90, 20, 16) +
      '<rect class="el-shut" x="63" y="58" width="4" height="16"/><rect class="el-shut" x="89" y="58" width="4" height="16"/><rect class="el-shut" x="147" y="58" width="4" height="16"/><rect class="el-shut" x="173" y="58" width="4" height="16"/>' +
      '<rect class="el-shut" x="63" y="90" width="4" height="16"/><rect class="el-shut" x="89" y="90" width="4" height="16"/><rect class="el-shut" x="147" y="90" width="4" height="16"/><rect class="el-shut" x="173" y="90" width="4" height="16"/>' +
      '<rect class="el-door" x="110" y="92" width="20" height="28"/><polyline class="el-line" points="106,92 120,84 134,92"/>' +
      '<rect class="el-below" x="56" y="120" width="128" height="14"/>' + dim(56, 184, 'about 36 ft'),
    'tri-level':
      '<rect class="el-fill" x="20" y="58" width="92" height="62"/><line class="el-thin" x1="20" y1="88" x2="112" y2="88"/><polyline class="el-line" points="14,58 66,38 118,58"/>' +
      '<rect class="el-fill" x="112" y="76" width="108" height="44"/><polyline class="el-line" points="106,76 166,58 226,76"/>' +
      win(32, 65, 22, 14) + win(70, 65, 22, 14) + win(32, 97, 22, 12) + win(70, 97, 22, 12) +
      '<rect class="el-door" x="118" y="94" width="12" height="26"/>' + win(150, 86, 40, 16) +
      '<rect class="el-below" x="20" y="120" width="92" height="10"/>' + dim(20, 220, 'about 52 ft')
  };
  RI.Drawing = {
    svg:function(type, withZones){
      var t = RI.TYPES[type];
      var z = withZones ? t.zones.map(function(z, i){ return '<rect class="el-zone" data-z="' + i + '" x="' + z[2] + '" y="' + z[3] + '" width="' + z[4] + '" height="' + z[5] + '"/>'; }).join('') : '';
      return '<svg class="elev-svg" viewBox="0 0 240 150" role="img" aria-label="Front elevation drawing of a ' + t.name.toLowerCase() + '"><line class="el-ground" x1="4" y1="120" x2="236" y2="120"/>' + BODY[type] + z + '</svg>';
    },
    /* A drawing with its "usually needs" list; hovering or focusing an item lights its zone */
    figure:function(type, opts){
      opts = opts || {};
      var t = RI.TYPES[type];
      return '<figure class="elev' + (opts.big ? ' big' : '') + '" data-type="' + type + '">' + '<div class="elev-draw">' + RI.Drawing.svg(type, true) + '</div>' +
        '<figcaption><span class="label">Usually needs</span><ul class="elev-needs">' + t.zones.map(function(z, i){ return '<li><button type="button" data-z="' + i + '">' + RI.icon(z[1], 'i-sm') + z[0] + '</button></li>'; }).join('') + '</ul></figcaption></figure>';
    },
    bind:function(scope){
      scope.querySelectorAll('.elev').forEach(function(f){
        function on(i){ f.querySelectorAll('[data-z]').forEach(function(el){ el.classList.toggle('on', el.getAttribute('data-z') === i); }); }
        f.addEventListener('mouseover', function(e){ var b = e.target.closest('button[data-z]'); if(b) on(b.getAttribute('data-z')); });
        f.addEventListener('mouseleave', function(){ on(null); });
        f.addEventListener('focusin', function(e){ var b = e.target.closest('button[data-z]'); if(b) on(b.getAttribute('data-z')); });
        f.addEventListener('focusout', function(){ on(null); });
        f.addEventListener('click', function(e){ var b = e.target.closest('button[data-z]'); if(b){ e.preventDefault(); on(b.getAttribute('data-z')); } });
      });
    }
  };

  /* ---------- Schematic map of the five areas, not to scale ---------- */
  var PLACES = {'clinton-township':[292,72,'t'], 'sterling-heights':[226,86,'l'], 'warren':[240,128,'l'], 'livonia':[92,182,'r'], 'dearborn':[160,244,'r']};
  RI.CostMap = {
    render:function(host, onHover){
      var R = RI.url('');
      var pins = Object.keys(PLACES).map(function(k){
        var p = PLACES[k], a = RI.AREAS[k], side = p[2];
        var tx = side === 'r' ? p[0] + 13 : side === 'l' ? p[0] - 13 : p[0], ty = side === 't' ? p[1] - 15 : p[1] + 3.5, anchor = side === 'r' ? 'start' : side === 'l' ? 'end' : 'middle';
        return '<a class="map-pin" href="' + R + 'renovation-cost/' + k + '/" data-area="' + k + '" aria-label="' + a.name + ', ' + a.county + '"><circle cx="' + p[0] + '" cy="' + (side === 't' ? p[1] - 6 : p[1]) + '" r="18" class="mp-hit"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="8" class="mp-ring"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" class="mp-dot"/>' +
          '<text x="' + tx + '" y="' + ty + '" text-anchor="' + anchor + '">' + a.name + '</text></a>';
      }).join('');
      host.innerHTML = '<svg class="map-svg" viewBox="0 0 400 290" aria-label="Schematic map of the five areas around Detroit">' +
        '<path class="map-water" d="M338 40 C372 52 392 92 396 132 C398 170 384 196 360 206 C340 214 326 204 322 186 C316 160 330 140 326 116 C322 90 318 60 338 40 Z"/>' +
        '<path class="map-river" d="M322 186 C300 214 270 238 238 252 C214 262 196 272 176 290"/>' +
        '<line class="map-road" x1="20" y1="152" x2="318" y2="152"/><text class="map-road-t" x="24" y="146">8 Mile Rd</text>' +
        '<line class="map-county" x1="190" y1="10" x2="190" y2="152"/>' +
        '<text class="map-county-t" x="60" y="40">Oakland County</text><text class="map-county-t" x="232" y="28">Macomb County</text><text class="map-county-t" x="40" y="276">Wayne County</text>' +
        '<text class="map-water-t" x="356" y="126" text-anchor="middle">Lake</text><text class="map-water-t" x="356" y="138" text-anchor="middle">St. Clair</text>' +
        '<g class="map-city"><rect x="208" y="196" width="44" height="26" rx="2"/><text x="230" y="213" text-anchor="middle">Detroit</text></g>' +
        pins + '<g class="map-compass" transform="translate(382 268)"><path d="M0 -10 L4 2 L0 -1 L-4 2 Z"/><text y="12" text-anchor="middle">N</text></g></svg>' +
        '<p class="map-note">Schematic, not to scale.</p>';
      host.addEventListener('mouseover', function(e){ var a = e.target.closest('.map-pin'); if(a) onHover(a.getAttribute('data-area')); });
      host.addEventListener('focusin', function(e){ var a = e.target.closest('.map-pin'); if(a) onHover(a.getAttribute('data-area')); });
    },
    mark:function(host, k){ host.querySelectorAll('.map-pin').forEach(function(a){ a.classList.toggle('on', a.getAttribute('data-area') === k); }); }
  };

  /* ---------- Rate explorer: a work type, a size you choose, a Low and a High ---------- */
  RI.RateExplorer = {
    render:function(host, opts){
      opts = opts || {};
      var idx = opts.only || RI.RATES.map(function(_, i){ return i; });
      var cur = idx[0];
      host.innerHTML = '<div class="rx">' +
        '<div class="rx-pick"><p class="label">Work</p><div class="rx-list" role="radiogroup" aria-label="Work type">' + idx.map(function(i, n){
          var r = RI.RATES[i];
          return '<button type="button" role="radio" class="rx-opt" data-i="' + i + '" aria-checked="' + (n === 0) + '"' + (n ? ' tabindex="-1"' : '') + '><b>' + r[0] + '</b><span>' + RI.moneyRate(r[3]) + ' to ' + RI.moneyRate(r[4]) + (r[2] === 'each' ? ' each' : ' per ' + r[2]) + '</span></button>';
        }).join('') + '</div></div>' +
        '<div class="rx-out"><p class="rx-what"></p>' +
          '<div class="field rx-size"><label for="rx-q-' + (opts.id || 'a') + '"><span class="rx-q-label">Size</span> <output class="rx-q-val"></output></label><input type="range" class="rx-range" id="rx-q-' + (opts.id || 'a') + '"></div>' +
          '<div class="rx-price"><span class="big-range"></span></div>' +
          '<div class="rx-line"><div class="rl thick" data-low="0" data-high="0"></div><div class="axis"></div></div>' +
          '<p class="small muted rx-note">' + (opts.where ? 'Typical installed cost in ' + opts.where + '. ' : 'Typical installed cost in Metro Detroit. ') + 'Sample rates, dated November 2026. In the product these come from Sam\'s published rate library.</p>' +
          '<p class="rx-ev">' + RI.ev('reported') + '<span class="small muted">Your size, so only the rate varies. Your own estimate counts the real quantities from your photos.</span></p>' +
        '</div></div>';
      var range = host.querySelector('.rx-range'), out = host.querySelector('.rx-q-val'), rl = host.querySelector('.rl'), axis = host.querySelector('.axis'), lineWrap = host.querySelector('.rx-line');
      function draw(bump){
        var r = RI.RATES[cur], q = +range.value, lo = Math.round(q * r[3] / 10) * 10, hi = Math.round(q * r[4] / 10) * 10;
        if(hi < 100){ lo = Math.round(q * r[3]); hi = Math.round(q * r[4]); }
        out.textContent = q.toLocaleString('en-US') + ' ' + (r[2] === 'each' ? (q === 1 ? 'item' : 'items') : r[2]);
        range.setAttribute('aria-valuetext', out.textContent);
        var max = r[7] * r[4], step = Math.pow(10, Math.floor(Math.log10(max))); max = Math.ceil(max / step) * step;
        lineWrap.setAttribute('data-scale', '0,' + max);
        rl.setAttribute('data-low', lo); rl.setAttribute('data-high', hi); RI.drawRange(rl); rl.classList.add('drawn');
        axis.setAttribute('data-ticks', [0, max / 2, max].join(',')); RI.initRanges(lineWrap);
        var p = host.querySelector('.big-range'); p.innerHTML = RI.range(lo, hi);
        if(bump){ p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); }
        range.style.setProperty('--fill', ((q - r[6]) / (r[7] - r[6]) * 100) + '%');
      }
      function pick(i, focus){
        cur = i; var r = RI.RATES[i];
        host.querySelectorAll('.rx-opt').forEach(function(b){ var on = +b.getAttribute('data-i') === i; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; if(on && focus) b.focus(); });
        range.min = r[6]; range.max = r[7]; range.step = r[8]; range.value = r[5];
        host.querySelector('.rx-q-label').textContent = r[2] === 'each' ? 'How many' : 'Size';
        host.querySelector('.rx-what').innerHTML = '<b>' + r[0] + '</b> <span class="muted">' + r[1] + '</span>';
        draw(true);
      }
      host.querySelector('.rx-list').addEventListener('click', function(e){ var b = e.target.closest('.rx-opt'); if(b) pick(+b.getAttribute('data-i')); });
      host.querySelector('.rx-list').addEventListener('keydown', function(e){
        var bs = [].slice.call(host.querySelectorAll('.rx-opt')), n = bs.findIndex(function(b){ return +b.getAttribute('data-i') === cur; }), m = null;
        if(e.key === 'ArrowDown' || e.key === 'ArrowRight') m = Math.min(bs.length - 1, n + 1);
        if(e.key === 'ArrowUp' || e.key === 'ArrowLeft') m = Math.max(0, n - 1);
        if(m != null){ e.preventDefault(); pick(+bs[m].getAttribute('data-i'), true); }
      });
      range.addEventListener('input', function(){ draw(false); });
      pick(cur);
    }
  };

  /* ---------- Typical range for a house type against one house's own estimate ---------- */
  RI.TypicalVsYours = {
    render:function(host, opts){
      opts = opts || {};
      var S = RI.totals('S', {}), sqft = 1686;
      var tk = opts.type || 'brick-ranch', tt = RI.TYPES[tk], band = tt.size.replace(/,/g, '').match(/\d+/g).map(Number);
      /* Sample: the sample house's Standard per sq ft, over the type's typical size band, widened for inferred sizes */
      var tl = Math.round(S.low / sqft * band[0] * .85 / 100) * 100, th = Math.round(S.high / sqft * band[1] * 1.15 / 100) * 100;
      var where = opts.where ? ' in ' + opts.where : '';
      host.innerHTML = '<div class="tvy" data-scale="0,' + (Math.ceil(th / 20000) * 20000) + '">' +
        '<div class="tvy-row"><div class="tvy-h"><b>Typical' + where + '</b><span>Standard goal, a ' + tt.name.toLowerCase() + ' of ' + band[0].toLocaleString('en-US') + ' to ' + band[1].toLocaleString('en-US') + ' sq ft. Sizes and condition unknown.</span></div>' +
          '<div class="rl tvy-wide partial" data-low="' + tl + '" data-high="' + th + '"></div><span class="range-txt">' + RI.range(tl, th) + '</span></div>' +
        '<div class="tvy-row is-yours"><div class="tvy-h"><b>One house, from its photos</b><span>The sample brick ranch, 1,686 sq ft. 2 lines unverified, 1 needs measurement, all named.</span></div>' +
          '<div class="rl thick partial" data-low="' + S.low + '" data-high="' + S.high + '"></div><span class="range-txt">' + RI.range(S.low, S.high) + '</span></div>' +
        '<div class="tvy-axis"><span></span><div class="axis" data-ticks="0,' + (Math.ceil(th / 20000) * 10000) + ',' + (Math.ceil(th / 20000) * 20000) + '"></div><span></span></div>' +
        '<div class="tvy-foot"><p>An area range helps you plan. <b>Your house gets its own</b>, with every line it could not confirm named, never guessed.</p><a class="btn btn-primary" data-cta href="' + RI.url('waitlist/') + '">Join the waitlist</a><a class="textlink" href="' + RI.url('sample/') + '">Open the sample house</a></div>' +
        '<p class="xsmall muted">Sample figures, worked out from the sample house and the sample rates.</p></div>';
      RI.initRanges(host); RI.applyCtas();
    }
  };
})();
