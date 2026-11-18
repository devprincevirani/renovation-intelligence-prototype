/* App: the intake wizard. Four steps, each with its own address, saved as you go.
   Fields follow the draft field list (Developer Knowledge Guide p. 28, APP_FLOW 6.2), waiting for Sam's OK.
   Upload rules follow SECURITY 7 and the guide p. 29: types, limits, duplicates, quality flags, consent. */
(function(){
  var RI = window.RI, A = RI.App, doc = document;
  /* Four steps, as APP_FLOW 6.2 sets them. The guide's remarks, plans and consent (p24) live inside them:
     remarks under More facts, plans and the photo rights tick in Photos, the estimate tick on Review */
  var STEPS = [['house','The house'],['photos','Photos'],['measurements','Room sizes'],['review','Review']];
  var OLD = {remarks:'photos', consent:'review'}; /* drafts saved under the earlier six-step layout */
  var LAST = STEPS.length - 1;
  var SAMPLE_PHOTOS = {kitchen:['kitchen-dated.jpg','kitchen-dated-wide.jpg','cabinet-run.jpg'], living:['wood-floor.jpg','finishes/ct-stonelook.jpg'], bedrooms:['wood-floor.jpg'], hallbath:['finishes/bs-white.jpg','finishes/fx-black.jpg'], halfbath:['finishes/fx-single.jpg'], basement:['finishes/lt-old.jpg','finishes/lt-recessed.jpg'], exterior:['brick-ranch.jpg','livonia-street.jpg'], other:[]};
  var MAX_MB = 25, MAX_PHOTOS = 150, MAX_PLAN_KEEP = 1.5;            /* SECURITY 7; plan size kept in this demo */
  var TYPES_OK = /\.(jpe?g|png|webp|heic|heif)$/i;
  var RIGHTS = {version:'Draft 1, November 2026', text:'I took these photos or have the right to use them.'};
  var DISC = {version:'Draft 1, November 2026', text:'I understand this is an estimate for planning, based on the photos and facts I gave. It is not an inspection or a contractor\'s bid.'};
  A.FREE_LIMIT = 5; /* sample number; Sam sets the real one (SECURITY 9) */

  /* ---------- Reading a photo: shrink it, and measure size, sharpness and a small fingerprint ---------- */
  function gray(ctx, w, h){ var d = ctx.getImageData(0, 0, w, h).data, g = new Float32Array(w * h); for(var i = 0; i < w * h; i++) g[i] = d[i * 4] * .299 + d[i * 4 + 1] * .587 + d[i * 4 + 2] * .114; return g; }
  A.shrink = function(file){
    return new Promise(function(ok, bad){
      var r = new FileReader();
      r.onload = function(){
        var img = new Image();
        img.onload = function(){
          var m = 520, s = Math.min(1, m / Math.max(img.width, img.height)), c = doc.createElement('canvas');
          c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          /* Difference hash on 9 by 8 gray pixels: near duplicates differ in only a few bits */
          var hc = doc.createElement('canvas'); hc.width = 90; hc.height = 80; var hx = hc.getContext('2d'); hx.imageSmoothingQuality = 'high'; hx.drawImage(img, 0, 0, 90, 80);
          var big = gray(hx, 90, 80), hg = new Float32Array(72);
          for(var by = 0; by < 8; by++) for(var bx2 = 0; bx2 < 9; bx2++){ var acc = 0; for(var yy0 = 0; yy0 < 10; yy0++) for(var xx0 = 0; xx0 < 10; xx0++) acc += big[(by * 10 + yy0) * 90 + bx2 * 10 + xx0]; hg[by * 9 + bx2] = acc / 100; }
          var hash = ''; for(var y = 0; y < 8; y++) for(var x = 0; x < 8; x++) hash += hg[y * 9 + x] > hg[y * 9 + x + 1] ? '1' : '0';
          /* Sharpness: variance of a Laplacian on a 96 px copy. Low variance means likely blurry */
          var bc = doc.createElement('canvas'), bw = 96, bh = Math.max(8, Math.round(96 * img.height / img.width)); bc.width = bw; bc.height = bh; var bx = bc.getContext('2d'); bx.drawImage(img, 0, 0, bw, bh);
          var bg = gray(bx, bw, bh), sum = 0, sq = 0, n = 0;
          for(var yy = 1; yy < bh - 1; yy++) for(var xx = 1; xx < bw - 1; xx++){ var i2 = yy * bw + xx, l = 4 * bg[i2] - bg[i2 - 1] - bg[i2 + 1] - bg[i2 - bw] - bg[i2 + bw]; sum += l; sq += l * l; n++; }
          var vari = sq / n - Math.pow(sum / n, 2);
          ok({src:c.toDataURL('image/jpeg', .72), w:img.width, h:img.height, hash:hash, sharp:Math.round(vari)});
        };
        img.onerror = bad; img.src = r.result;
      };
      r.onerror = bad; r.readAsDataURL(file);
    });
  };
  /* HEIC is accepted, but this browser cannot draw it: the product converts it on the server */
  function heicThumb(name){
    var c = doc.createElement('canvas'); c.width = 320; c.height = 240; var x = c.getContext('2d');
    x.fillStyle = '#EDE6DA'; x.fillRect(0, 0, 320, 240); x.strokeStyle = '#B9AC9A'; x.lineWidth = 2; x.strokeRect(14, 14, 292, 212);
    x.fillStyle = '#203B38'; x.font = '600 40px sans-serif'; x.textAlign = 'center'; x.fillText('HEIC', 160, 118);
    x.fillStyle = '#655F58'; x.font = '15px sans-serif'; x.fillText(name.length > 28 ? name.slice(0, 26) + '…' : name, 160, 150); x.fillText('Converted to JPG in the product', 160, 176);
    return c.toDataURL('image/jpeg', .8);
  }
  function hamming(a, b){ var d = 0; for(var i = 0; i < a.length; i++) if(a[i] !== b[i]) d++; return d; }
  var FLAG = {small:'Too small', blurry:'May be blurry', near:'Near duplicate', heic:'HEIC'};

  /* ---------- Layout, stepper, saving ---------- */
  var lastAt = null;
  function layout(view, h, step){
    var at = STEPS.findIndex(function(s){ return s[0] === step; });
    var reach = Math.max(at, STEPS.findIndex(function(s){ return s[0] === (h.step || 'house'); }));
    view.innerHTML = '<div class="wiz">' +
      '<div class="wiz-top"><ol class="stepper" style="--at:' + at + ';--n:' + STEPS.length + '">' + STEPS.map(function(s, i){
        var state = i < at ? 'done' : i === at ? 'cur' : (i <= reach ? 'open' : 'todo');
        var inner = '<span class="sn">' + (i < at ? RI.icon('check','i-sm') : i + 1) + '</span><span class="sl">' + s[1] + '</span>';
        return '<li class="' + state + '">' + (state !== 'todo' && i !== at ? '<a href="#/houses/' + h.id + '/intake/' + s[0] + '">' + inner + '</a>' : '<span' + (i === at ? ' aria-current="step"' : '') + '>' + inner + '</span>') + '</li>';
      }).join('') + '</ol></div>' +
      '<div class="wiz-grid"><div class="wiz-main" id="wiz-main"></div><aside class="wiz-side" id="wiz-side" aria-label="Your house so far"></aside></div>' +
      /* The action dock: how far along, where you are, that it saves; then Back and Continue together */
      (function(){
        var C = 2 * Math.PI * 16, from = (lastAt != null ? lastAt + 1 : at + 1) / STEPS.length, to = (at + 1) / STEPS.length, nx = at === LAST ? null : STEPS[at + 1][1];
        return '<div class="wiz-bar' + (at === LAST ? ' is-last' : '') + '" role="region" aria-label="Step actions"><div class="wiz-bar-in"><div class="wb-dock">' +
          '<div class="wb-status"><span class="wb-ring" aria-hidden="true"><svg viewBox="0 0 40 40"><circle class="t" cx="20" cy="20" r="16"/><circle class="v" cx="20" cy="20" r="16" style="stroke-dasharray:' + C.toFixed(1) + ';--o0:' + (C * (1 - from)).toFixed(1) + ';--o1:' + (C * (1 - to)).toFixed(1) + '"/></svg><span><b>' + (at + 1) + '</b>/' + STEPS.length + '</span></span>' +
            '<span class="wb-txt"><span class="wb-name"><span class="sr">Step ' + (at + 1) + ' of ' + STEPS.length + ': </span>' + STEPS[at][1] + '</span><span class="saved" id="saved" aria-live="polite">' + RI.icon('check','i-sm') + 'Saved as you go</span></span></div>' +
          '<div class="wb-acts">' +
            (at > 0 ? '<a class="wb-back" href="#/houses/' + h.id + '/intake/' + STEPS[at - 1][0] + '" aria-label="Back to ' + STEPS[at - 1][1].toLowerCase() + '">' + RI.icon('arrow','i-sm flip') + '<span>Back</span></a>' : '<a class="wb-back" href="#/houses" aria-label="Cancel and go to my houses"><span>Cancel</span>' + RI.icon('x','i-sm wb-x') + '</a>') +
            '<button type="button" class="btn btn-primary wb-next" id="next">' + (at === LAST ? '<span>Submit my house</span>' + RI.icon('check','i-sm') : '<span>Continue<span class="wb-to"> to ' + nx.toLowerCase() + '</span></span>' + RI.icon('arrow','i-sm i-arrow')) + '</button>' +
          '</div></div></div></div>';
      })() + '</div>';
    lastAt = at;
    var exit = doc.getElementById('focus-exit');
    if(exit) exit.innerHTML = '<a class="textlink inv" href="#/houses">Save and exit</a>';
    side(h);
    return view.querySelector('#wiz-main');
  }
  var savedT;
  function saved(h){
    if(!A.put(h)) return; side(h);
    var el = doc.getElementById('saved'); if(!el) return;
    el.innerHTML = '<span class="saving"></span>Saving'; clearTimeout(savedT);
    savedT = setTimeout(function(){ el.innerHTML = RI.icon('check','i-sm') + 'Saved just now'; el.classList.remove('fresh'); void el.offsetWidth; el.classList.add('fresh'); }, 450);
  }
  function side(h){
    var s = doc.getElementById('wiz-side'); if(!s) return;
    var f = h.facts || {}, rooms = A.roomsFor(h);
    s.innerHTML = '<div class="side-house">' + (f.sqft ? '<div class="sh-draw">' + A.drawing(A.illus(h)) + '</div>' : '<div class="sh-draw sh-empty">' + RI.icon('house','i-lg') + '</div>') +
      '<p class="label">Your house so far</p><h2>' + RI.esc(A.addr(h)) + '</h2><p class="small muted">' + RI.esc(A.place(h)) + '</p>' +
      (A.factsLine(h) ? '<p class="small">' + A.factsLine(h) + '</p>' : '') +
      '<ul class="sh-rooms">' + sideRooms(h, rooms) + '</ul>' +
      (h.client ? '<p class="xsmall muted">Client: ' + RI.esc(h.client) + '</p>' : '') + '</div>';
    RI.fillIcons(s);
  }
  /* The side list groups bedrooms and baths: "Bedrooms, 2 of 3 with photos" */
  function sideRooms(h, rooms){
    var seen = {}, out = '';
    rooms.forEach(function(r){
      if(r[0] === 'other') return; var g = r[2] || r[0];
      var grp = rooms.filter(function(x){ return (x[2] || x[0]) === g; });
      if(grp.length > 1){ if(seen[g]) return; seen[g] = 1;
        var with_ = grp.filter(function(x){ return A.photoCount(h, x[0]); }).length, okg = with_ === grp.length;
        out += '<li class="' + (okg ? 'ok' : '') + '">' + RI.icon(okg ? 'check' : 'camera','i-sm') + '<span>' + grp[0][1].replace(/ 1$/, 's') + ' <span class="xsmall muted">' + with_ + ' of ' + grp.length + '</span></span><b>' + A.groupCount(h, g) + '</b></li>'; return; }
      var n = A.photoCount(h, r[0]); out += '<li class="' + (n ? 'ok' : '') + '">' + RI.icon(n ? 'check' : 'camera','i-sm') + '<span>' + r[1] + '</span><b>' + n + '</b></li>';
    });
    return out;
  }
  function stepper(id, label, val, min, max, help){
    return '<div class="field"><span class="flabel" id="' + id + '-l">' + label + '</span><div class="stepper-n" role="group" aria-labelledby="' + id + '-l"><button type="button" data-dec="' + id + '" aria-label="Fewer">' + RI.icon('minus','i-sm') + '</button><output id="' + id + '" data-min="' + min + '" data-max="' + max + '" aria-live="polite">' + val + '</output><button type="button" data-inc="' + id + '" aria-label="More"><span aria-hidden="true">+</span></button></div>' + (help ? '<span class="help">' + help + '</span>' : '') + '</div>';
  }
  function seg(name, opts, cur){ return '<div class="seg-pick" role="radiogroup">' + opts.map(function(o){ return '<label><input type="radio" name="' + name + '" value="' + o[0] + '"' + (cur === o[0] ? ' checked' : '') + '><span>' + o[1] + '</span></label>'; }).join('') + '</div>'; }

  /* ---------- Step 1 pieces: section cards, counters and small drawings ---------- */
  var IC = {
    bed:'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 25V8M4 20h24v5M28 20v-3.5a3.5 3.5 0 0 0-3.5-3.5H14v7"/><circle cx="9" cy="15.5" r="2.2"/></svg>',
    bath:'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16h24v2.5A6.5 6.5 0 0 1 21.5 25h-11A6.5 6.5 0 0 1 4 18.5V16zM7 16V8.5a2.5 2.5 0 0 1 4.6-1.4M10 25l-1.5 2.5M22 25l1.5 2.5"/></svg>',
    half:'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15h20a10 7 0 0 1-20 0zM16 15V8h5M13 27h6M16 22v5"/></svg>'
  };
  function card(key, n, title, sub, req, body){
    return '<section class="hs-card" id="sec-' + key + '" aria-labelledby="sec-' + key + '-h" style="--d:' + (n - 1) + '"><header class="hs-h"><span class="hs-n" aria-hidden="true"><b>' + n + '</b>' + RI.icon('check','i-sm') + '</span><div><h2 id="sec-' + key + '-h">' + title + '</h2><p class="small muted">' + sub + '</p></div>' + (req ? '<span class="hs-req">Required</span>' : '') + '</header><div class="hs-b">' + body + '</div></section>';
  }
  function counter(id, label, icon, val, min, max){
    return '<div class="cnt"><span class="cnt-ic" aria-hidden="true">' + icon + '</span><span class="cnt-l" id="' + id + '-l">' + label + '</span><div class="stepper-n" role="group" aria-labelledby="' + id + '-l"><button type="button" data-dec="' + id + '" aria-label="Fewer ' + label.toLowerCase() + '">' + RI.icon('minus','i-sm') + '</button><output id="' + id + '" data-min="' + min + '" data-max="' + max + '" aria-live="polite">' + val + '</output><button type="button" data-inc="' + id + '" aria-label="More ' + label.toLowerCase() + '"><span aria-hidden="true">+</span></button></div></div>';
  }
  function storyIcon(n){
    var fh = 7, base = 40, top = base - fh * n, out = '<svg viewBox="0 0 44 44" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">';
    out += '<path d="M8 ' + top + 'L22 ' + (top - 8) + 'L36 ' + top + '"/><rect x="11" y="' + top + '" width="22" height="' + (fh * n) + '"/>';
    for(var i = 0; i < n; i++){ var y = top + i * fh + 2.2; out += '<rect class="w" x="14.5" y="' + y + '" width="4" height="3"/><rect class="w" x="25.5" y="' + y + '" width="4" height="3"/>'; }
    return out + '<path d="M4 40h36"/></svg>';
  }
  function bsIcon(k){
    var b = '<svg viewBox="0 0 56 44" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M11 12L28 3l17 9"/><rect x="14" y="12" width="28" height="11"/>';
    if(k === 'none') b += '<path class="slab" d="M12 25h32"/>';
    if(k === 'unfinished') b += '<rect x="14" y="25" width="28" height="13" stroke-dasharray="2.5 2.5"/>';
    if(k === 'partly') b += '<rect class="fill" x="14" y="25" width="14" height="13" stroke="none"/><rect x="14" y="25" width="28" height="13"/>';
    if(k === 'finished') b += '<rect class="fill" x="14" y="25" width="28" height="13"/>';
    return b + '<path class="ground" d="M2 23.5h52"/></svg>';
  }

  /* ---------- Step 1: the house ---------- */
  function stepHouse(main, h){
    var f = h.facts, a = h.addr; f.more = f.more || {}; var m = f.more;
    if(!a.state) a.state = 'MI'; if(!f.propertyType) f.propertyType = 'single-family';
    if(!f.stories) f.stories = 1;
    var floors = ['Carpet','Hardwood','Vinyl','Tile','Laminate'];
    var bs = f.basement || 'finished';
    main.innerHTML = '<header class="wiz-head"><p class="label">Step 1 of 4</p><h1>The house</h1><p class="muted">The facts you would find on a home listing. About 2 minutes. Only address, year and size are required.</p></header>' +
      '<form class="hs-form" id="f" novalidate>' +
      /* 1 Address */
      card('addr', 1, 'Address', 'Where the house is. One house per address.', true,
        '<div class="hs-addr">' +
          '<div class="field a-street addr-f"><label for="street">Street address</label><div class="in-ic">' + RI.icon('pin','i-sm') + '<input class="input" id="street" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="addr-list" placeholder="Start typing, for example 6820 Kendal" value="' + RI.esc(a.street || '') + '"></div><ul class="addr-list" id="addr-list" role="listbox" hidden></ul><span class="err"></span></div>' +
          '<div class="field a-unit"><label for="unit">Unit <span class="opt">(optional)</span></label><input class="input" id="unit" autocomplete="address-line2" value="' + RI.esc(a.unit || '') + '"></div>' +
          '<div class="field a-city"><label for="city">City</label><input class="input" id="city" list="cities" autocomplete="address-level2" value="' + RI.esc(a.city || '') + '"><datalist id="cities">' + Object.keys(RI.AREAS).map(function(k){ return '<option value="' + RI.AREAS[k].name + '">'; }).join('') + '</datalist><span class="err"></span></div>' +
          '<div class="field a-state"><label for="state">State</label><input class="input" id="state" maxlength="2" autocomplete="address-level1" value="' + RI.esc(a.state) + '"><span class="err"></span></div>' +
          '<div class="field a-zip"><label for="zip">ZIP</label><input class="input" id="zip" inputmode="numeric" maxlength="5" autocomplete="postal-code" value="' + RI.esc(a.zip || '') + '"><span class="err"></span></div>' +
        '</div><div id="dup"></div>' +
        '<div class="ptype"><label class="pt-on"><input type="radio" name="ptype" value="single-family" checked>' + RI.icon('house','i-sm') + '<span><b>Single-family detached</b><span class="xsmall muted">The only property type in this version</span></span></label>' +
        '<span class="pt-later">' + RI.icon('lock','i-sm') + 'Condos, townhouses and multi-family come later</span></div>') +
      /* 2 Size and age */
      card('size', 2, 'Size and age', 'These two set the scale of every quantity.', true,
        '<div class="hs-2">' +
          '<div class="field"><label for="year">Year built</label><input class="input" id="year" inputmode="numeric" maxlength="4" value="' + (f.year || '') + '" placeholder="1986"><span class="help" id="year-age">Tells us which materials to expect</span><span class="err"></span></div>' +
          '<div class="field"><label for="sqft">Finished area</label><div class="in-suf"><input class="input" id="sqft" inputmode="numeric" value="' + (f.sqft || '') + '" placeholder="1,686"><span>sq ft</span></div><span class="help">Above ground, without the basement</span><span class="err"></span></div>' +
        '</div>' +
        '<div class="field"><span class="flabel" id="st-l">Stories above ground</span><div class="story-pick" role="radiogroup" aria-labelledby="st-l">' + [1,2,3,4].map(function(n){ return '<label><input type="radio" name="stories" value="' + n + '"' + (+f.stories === n ? ' checked' : '') + '><span>' + storyIcon(n) + '<b>' + n + '</b><i>' + (n === 1 ? 'story' : 'stories') + '</i></span></label>'; }).join('') + '</div><span class="help">For stairs, wall heights and the outside of the house</span></div>') +
      /* 3 Rooms */
      card('rooms', 3, 'Bedrooms and baths', 'Each one gets its own place for photos in the next step.', false,
        '<div class="cnt-grid">' + counter('beds', 'Bedrooms', IC.bed, f.beds != null ? f.beds : 3, 0, 15) + counter('baths', 'Full baths', IC.bath, f.baths || 1, 1, 8) + counter('halfBaths', 'Half baths', IC.half, f.halfBaths || 0, 0, 6) + '</div>' +
        '<div class="rooms-prev"><p class="xsmall muted">' + RI.icon('camera','i-sm') + '<span>Rooms we will ask photos for</span></p><ul id="rooms-prev" aria-live="polite"></ul></div>') +
      /* 4 Basement */
      card('bsmt', 4, 'Basement', 'Basement area is always kept apart from the above-grade area.', false,
        '<div class="bs-pick" role="radiogroup" aria-label="Basement">' + [['none','None','Slab or crawl space'],['unfinished','Unfinished','Bare walls and floor'],['partly','Partly finished','Some rooms finished'],['finished','Finished','Living space']].map(function(o){ return '<label><input type="radio" name="bsmt" value="' + o[0] + '"' + (bs === o[0] ? ' checked' : '') + '><span>' + bsIcon(o[0]) + '<b>' + o[1] + '</b><i>' + o[2] + '</i></span></label>'; }).join('') + '</div>' +
        '<div class="hs-2" id="bsmt-sizes"' + (bs === 'none' ? ' hidden' : '') + '>' +
          '<div class="field" id="bsqft-f"' + (bs === 'finished' || bs === 'partly' ? '' : ' hidden') + '><label for="bsqft">Finished basement <span class="opt">(optional)</span></label><div class="in-suf"><input class="input" id="bsqft" inputmode="numeric" value="' + (f.basementSqft || '') + '" placeholder="300"><span>sq ft</span></div><span class="help">Kept apart from the above-grade area</span></div>' +
          '<div class="field"><label for="btot">Total basement <span class="opt">(optional)</span></label><div class="in-suf"><input class="input" id="btot" inputmode="numeric" value="' + (f.basementTotal || '') + '" placeholder="1,400"><span>sq ft</span></div><span class="help">The unfinished part is never mixed in</span></div>' +
        '</div>') +
      '<details class="more-f"' + (Object.keys(m).some(function(k){ return m[k] && m[k].length !== 0 && m[k] !== 'none' && m[k] !== 'sq ft'; }) ? ' open' : '') + '><summary><span><b>More facts from the listing</b><span class="xsmall muted">All optional. Claims are checked against the photos, never simply trusted.</span></span><span class="chev" aria-hidden="true"></span></summary><div class="more-in">' +
        '<div class="field"><label for="m-link">Listing link</label><input class="input" id="m-link" type="url" inputmode="url" placeholder="https://" value="' + RI.esc(m.link || '') + '"><span class="help">Stored as a reference only. We never fetch or copy listing pages.</span><span class="err"></span></div>' +
        '<div class="grid-3"><div class="field"><label for="m-lot">Lot size</label><input class="input" id="m-lot" inputmode="decimal" value="' + RI.esc(m.lot || '') + '"></div><div class="field"><label for="m-lotu">Unit</label><select class="select" id="m-lotu">' + ['sq ft','acres'].map(function(u){ return '<option' + (m.lotUnit === u ? ' selected' : '') + '>' + u + '</option>'; }).join('') + '</select></div>' + stepper('fire', 'Fireplaces', m.fireplaces || 0, 0, 6) + '</div>' +
        '<div class="field"><span class="flabel">Garage</span>' + seg('garage', [['none','None'],['attached','Attached'],['detached','Detached']], m.garage || 'none') + '</div>' +
        '<div class="field" id="gs-f"' + (!m.garage || m.garage === 'none' ? ' hidden' : '') + '>' + stepper('gspaces', 'Garage spaces', m.garageSpaces || 2, 1, 4) + '</div>' +
        '<fieldset class="field"><legend class="flabel">Flooring types in the listing</legend><div class="chk-chips">' + floors.map(function(x){ return '<label><input type="checkbox" name="floor" value="' + x + '"' + ((m.floors || []).indexOf(x) > -1 ? ' checked' : '') + '><span>' + x + '</span></label>'; }).join('') + '</div></fieldset>' +
        '<div class="grid-3"><div class="field"><label for="m-heat">Heating</label><select class="select" id="m-heat"><option value="">Not known</option>' + ['Forced air, gas','Boiler','Heat pump','Electric baseboard','Other'].map(function(x){ return '<option' + (m.heat === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div>' +
          '<div class="field"><label for="m-heaty">Heating year</label><input class="input" id="m-heaty" inputmode="numeric" maxlength="4" value="' + RI.esc(m.heatYear || '') + '"><span class="err"></span></div>' +
          '<div class="field"><label for="m-cool">Cooling</label><select class="select" id="m-cool"><option value="">Not known</option>' + ['Central air','Window units','None'].map(function(x){ return '<option' + (m.cool === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div></div>' +
        '<div class="grid-3"><div class="field"><label for="m-wh">Water heater year</label><input class="input" id="m-wh" inputmode="numeric" maxlength="4" value="' + RI.esc(m.whYear || '') + '"><span class="err"></span></div><div class="field span-2"><label for="m-ext">Exterior, roof, foundation</label><input class="input" id="m-ext" placeholder="Brick, asphalt shingle roof, poured basement" value="' + RI.esc(m.exterior || '') + '"></div></div>' +
        '<div class="field"><label for="m-upd">Known updates</label><textarea class="input" id="m-upd" rows="2" placeholder="Kitchen 2015, roof 2018">' + RI.esc(m.updates || '') + '</textarea><span class="help">Each is kept as reported, with its year. Photos still decide what is visible.</span></div>' +
        '<div class="field"><label for="m-rem">Listing remarks</label><textarea class="input" id="m-rem" rows="5" placeholder="Paste the description from the listing">' + RI.esc(m.remarks || '') + '</textarea><span class="help">Words like "updated" or "remodeled" are split into parts and checked against the photos, never simply trusted.</span></div>' +
        '<p class="xsmall muted">Heating, cooling and the water heater are used for guidance only. They are never scored or priced.</p>' +
      '</div></details>' +
      '</form>';
    var $ = function(id){ return main.querySelector('#' + id); };
    function collect(){
      a.street = $('street').value.trim(); a.unit = $('unit').value.trim(); a.city = $('city').value.trim(); a.state = $('state').value.trim().toUpperCase(); a.zip = $('zip').value.trim();
      f.propertyType = 'single-family';
      f.year = $('year').value.replace(/\D/g, ''); f.sqft = $('sqft').value.replace(/\D/g, '');
      f.stories = +(main.querySelector('input[name=stories]:checked') || {value:1}).value; f.beds = +$('beds').textContent; f.baths = +$('baths').textContent; f.halfBaths = +$('halfBaths').textContent;
      f.basement = main.querySelector('input[name=bsmt]:checked').value; f.basementSqft = $('bsqft').value.replace(/\D/g, ''); f.basementTotal = $('btot').value.replace(/\D/g, '');
      m.link = $('m-link').value.trim(); m.lot = $('m-lot').value.trim(); m.lotUnit = $('m-lotu').value; m.fireplaces = +$('fire').textContent;
      m.garage = main.querySelector('input[name=garage]:checked').value; m.garageSpaces = m.garage === 'none' ? 0 : +$('gspaces').textContent;
      m.floors = [].slice.call(main.querySelectorAll('input[name=floor]:checked')).map(function(i){ return i.value; });
      m.heat = $('m-heat').value; m.heatYear = $('m-heaty').value.replace(/\D/g, ''); m.cool = $('m-cool').value; m.whYear = $('m-wh').value.replace(/\D/g, ''); m.exterior = $('m-ext').value.trim();
      m.updates = $('m-upd').value.trim(); m.remarks = $('m-rem').value.trim();
      h.title = A.titleFor(h);
      saved(h); live();
    }
    /* Live feedback: section ticks, the house's age, and the rooms the photo step will ask for */
    var prevKeys = null;
    function live(){
      var okA = a.street && a.street.length > 3 && a.city && a.city.length > 1 && /^[A-Za-z]{2}$/.test(a.state || '') && /^\d{5}$/.test(a.zip || '');
      var yr = +f.year, okS = yr >= 1800 && yr <= new Date().getFullYear() && +f.sqft >= 300 && +f.sqft <= 9000;
      $('sec-addr').classList.toggle('ok', !!okA); $('sec-size').classList.toggle('ok', !!okS);
      var nx = doc.getElementById('next'); if(nx){ var rd = !!(okA && okS); if(rd && !nx.classList.contains('ready')){ nx.classList.add('ready'); } else if(!rd) nx.classList.remove('ready'); }
      $('year-age').textContent = yr >= 1800 && yr <= new Date().getFullYear() ? 'About ' + (new Date().getFullYear() - yr) + ' years old' : 'Tells us which materials to expect';
      var rooms = A.roomsFor(h).filter(function(r){ return r[0] !== 'other' && !r[3]; }), keys = rooms.map(function(r){ return r[0]; });
      $('rooms-prev').innerHTML = rooms.map(function(r){ return '<li class="' + (prevKeys && prevKeys.indexOf(r[0]) < 0 ? 'new' : '') + '">' + RI.esc(r[1]) + '</li>'; }).join('');
      prevKeys = keys;
    }
    var deb; main.addEventListener('input', function(){ clearTimeout(deb); deb = setTimeout(collect, 350); });
    main.addEventListener('change', function(e){
      if(e.target.name === 'bsmt'){ var v = e.target.value; $('bsmt-sizes').hidden = v === 'none'; $('bsqft-f').hidden = !(v === 'finished' || v === 'partly'); }
      if(e.target.name === 'garage'){ $('gs-f').hidden = e.target.value === 'none'; }
      collect();
    });
    main.addEventListener('click', function(e){
      var inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]'); if(!inc && !dec) return;
      var id = (inc || dec).getAttribute(inc ? 'data-inc' : 'data-dec'), o = $(id), v = +o.textContent + (inc ? 1 : -1);
      v = Math.max(+o.getAttribute('data-min'), Math.min(+o.getAttribute('data-max'), v)); o.textContent = v;
      o.classList.remove('tick'); void o.offsetWidth; o.classList.add('tick'); collect();
    });
    /* check() runs every rule on Continue; check(id) checks one field when you leave it or fix it */
    /* Address suggestions: sample addresses plus your other houses. The product uses an address service */
    var list = $('addr-list'), street = $('street'), sugg = [], cur = -1;
    var SAMPLES = [['18450 Maple Ridge Dr','Clinton Township','48038'],['40322 Clinton Ct','Sterling Heights','48313'],['6820 Kendal St','Dearborn','48126'],['15520 Fairfield St','Livonia','48154'],['21430 Hoover Rd','Warren','48089'],['4227 Hampton Dr','Sterling Heights','48310'],['29115 Five Mile Rd','Livonia','48154'],['7114 Steadman St','Dearborn','48126'],['38710 Cass Ave','Clinton Township','48036'],['1420 Elm Grove Ave','Warren','48091'],['25110 Lyndon St','Livonia','48152'],['12045 Martin Rd','Warren','48093']];
    A.mine().forEach(function(x){ if(x.id !== h.id && x.addr && x.addr.street && !SAMPLES.some(function(sa){ return sa[0] === x.addr.street; })) SAMPLES.push([x.addr.street, x.addr.city, x.addr.zip]); });
    function showSugg(){
      var q = street.value.trim().toLowerCase(); if(q.length < 2){ list.hidden = true; street.setAttribute('aria-expanded', 'false'); return; }
      sugg = SAMPLES.filter(function(x){ return (x[0] + ' ' + x[1]).toLowerCase().indexOf(q) > -1; }).slice(0, 6); cur = -1;
      list.innerHTML = sugg.map(function(x, i){ return '<li role="option" id="as-' + i + '" data-i="' + i + '"><b>' + RI.esc(x[0]) + '</b><span>' + RI.esc(x[1]) + ', MI ' + x[2] + '</span></li>'; }).join('');
      list.hidden = !sugg.length; street.setAttribute('aria-expanded', !!sugg.length);
    }
    function pick(i){ var x = sugg[i]; if(!x) return; street.value = x[0]; $('city').value = x[1]; $('zip').value = x[2]; $('state').value = 'MI'; list.hidden = true; street.setAttribute('aria-expanded', 'false'); ['street','city','zip'].forEach(function(id){ RI.form.setInvalid($(id), null); }); collect(); dupCheck(); }
    street.addEventListener('input', showSugg);
    street.addEventListener('keydown', function(e){
      if(list.hidden) return;
      if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); cur = (cur + (e.key === 'ArrowDown' ? 1 : sugg.length - 1)) % sugg.length; list.querySelectorAll('li').forEach(function(li, i){ li.classList.toggle('on', i === cur); }); street.setAttribute('aria-activedescendant', 'as-' + cur); }
      if(e.key === 'Enter' && cur > -1){ e.preventDefault(); pick(cur); }
      if(e.key === 'Escape'){ list.hidden = true; }
    });
    list.addEventListener('mousedown', function(e){ var li = e.target.closest('li'); if(li){ e.preventDefault(); pick(+li.getAttribute('data-i')); } });
    street.addEventListener('blur', function(){ setTimeout(function(){ list.hidden = true; }, 120); dupCheck(); });
    /* One property per address. Never merge on a similar address alone: flag it and let the person decide (guide p24, p29) */
    function norm(v){ return (v || '').toLowerCase().replace(/[.,#]/g, ' ').replace(/\b(street)\b/g, 'st').replace(/\b(avenue)\b/g, 'ave').replace(/\b(drive)\b/g, 'dr').replace(/\b(road)\b/g, 'rd').replace(/\b(court)\b/g, 'ct').replace(/\s+/g, ' ').trim(); }
    function lev(a, b){ var m2 = [], i, j; for(i = 0; i <= b.length; i++) m2[i] = [i]; for(j = 0; j <= a.length; j++) m2[0][j] = j; for(i = 1; i <= b.length; i++) for(j = 1; j <= a.length; j++) m2[i][j] = b[i - 1] === a[j - 1] ? m2[i - 1][j - 1] : Math.min(m2[i - 1][j - 1] + 1, m2[i][j - 1] + 1, m2[i - 1][j] + 1); return m2[b.length][a.length]; }
    var dupState = null;
    function dupCheck(){
      var st = norm(street.value), zip = $('zip').value.trim(), unit = norm($('unit').value), box = $('dup'); dupState = null;
      if(st.length < 4){ box.innerHTML = ''; return; }
      A.mine().forEach(function(x){
        if(x.id === h.id || !x.addr || !x.addr.street) return;
        var xs = norm(x.addr.street), same = xs === st && (!zip || !x.addr.zip || x.addr.zip === zip) && norm(x.addr.unit) === unit;
        var near = !same && xs.split(' ')[0] === st.split(' ')[0] && (!zip || x.addr.zip === zip) && lev(xs, st) <= 3;
        if(same) dupState = {kind:'same', h:x}; else if(near && !dupState) dupState = {kind:'near', h:x};
      });
      if(!dupState){ box.innerHTML = ''; return; }
      var o = dupState.h;
      box.innerHTML = dupState.kind === 'same'
        ? '<div class="notice notice-warn" role="alert">' + RI.icon('warn') + '<span><b>You already have this house.</b> ' + RI.esc(o.addr.street + ', ' + (o.addr.city || '')) + ' is in your houses. One house per address keeps one history. <a href="#/houses/' + o.id + '">Open that house</a>, or enter a unit number if this is a different unit.</span></div>'
        : '<div class="notice notice-info">' + RI.icon('info') + '<span><b>This looks close to ' + RI.esc(o.addr.street) + '.</b> Is it the same house? <a href="#/houses/' + o.id + '">Open it</a>, or carry on if it is a different house.</span></div>';
      RI.fillIcons(box);
    }
    $('unit').addEventListener('input', dupCheck); $('zip').addEventListener('blur', dupCheck);
    dupCheck();
    function check(only){
      var ok = true, F = RI.form;
      function req(id, test, msg){ if(only && id !== only) return; var el = $(id), bad = !test(el.value.trim()); F.setInvalid(el, bad ? msg : null); if(bad && ok){ ok = false; if(!only) el.focus(); } }
      req('street', function(v){ return v.length > 3; }, 'Enter the street address.');
      req('city', function(v){ return v.length > 1; }, 'Enter the city.');
      req('state', function(v){ return /^[A-Za-z]{2}$/.test(v); }, 'Use the two-letter state, for example MI.');
      req('zip', function(v){ return /^\d{5}$/.test(v); }, 'A ZIP code has 5 digits.');
      req('year', function(v){ return /^\d{4}$/.test(v) && +v >= 1800 && +v <= new Date().getFullYear(); }, 'Enter a year between 1800 and this year.');
      req('sqft', function(v){ v = +v.replace(/\D/g, ''); return v >= 300 && v <= 9000; }, 'Enter the size in square feet, for example 1686.');
      ['m-heaty','m-wh'].forEach(function(id){ req(id, function(v){ return !v || (/^\d{4}$/.test(v) && +v >= 1900 && +v <= new Date().getFullYear()); }, 'Enter a four-digit year, or leave it empty.'); });
      req('m-link', function(v){ return !v || /^https?:\/\/\S+\.\S+/.test(v); }, 'Paste the full link, starting with https://');
      if(!ok && !only){ var mf = main.querySelector('.more-f'); if(mf && mf.querySelector('.field.invalid')) mf.open = true; }
      if(!only){ dupCheck(); if(dupState && dupState.kind === 'same'){ ok = false; $('dup').scrollIntoView({behavior:'smooth', block:'center'}); } }
      return ok;
    }
    live();
    main.querySelectorAll('.input').forEach(function(i){
      i.addEventListener('blur', function(){ if(i.value) check(i.id); });
      i.addEventListener('input', function(){ if(i.closest('.field.invalid')) check(i.id); });
    });
    return function(){ collect(); return check(); };
  }

  /* ---------- Step 2: photos by room ---------- */
  function stepPhotos(main, h){
    h.photos = h.photos || {}; h.fps = h.fps || []; h.consents = h.consents || {};
    var rooms = A.roomsFor(h), rightsOn = !!h.rights;
    var ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif';
    main.innerHTML = '<header class="wiz-head"><p class="label">Step 2 of 4</p><h1>Photos by room</h1><p class="muted">A photo of each room, taken from a corner so we see the floor and the walls. Listing photos are fine. JPG, PNG, WebP or HEIC, up to ' + MAX_MB + ' MB each and ' + MAX_PHOTOS + ' per house.</p></header>' +
      '<label class="rights' + (rightsOn ? ' on' : '') + '" id="rights"><input type="checkbox" id="rights-cb"' + (rightsOn ? ' checked' : '') + '><span><b>' + RIGHTS.text + '</b><span class="small muted">Photos are stored privately and used only for your estimate. Location data is removed from every copy we show or share.</span><span class="xsmall muted rights-rec" id="rights-rec">' + (h.consents.rights ? 'Ticked ' + new Date(h.consents.rights.at).toLocaleString('en-US') + '. Wording: ' + h.consents.rights.version + '.' : '') + '</span></span></label>' +
      '<div class="ph-tools"><label class="btn btn-secondary btn-sm file-btn' + (rightsOn ? '' : ' is-off') + '">' + RI.icon('camera','i-sm') + 'Add many at once<input type="file" accept="' + ACCEPT + '" multiple id="bulk"' + (rightsOn ? '' : ' disabled') + '></label><button type="button" class="btn btn-secondary btn-sm" id="sample"' + (rightsOn ? '' : ' disabled') + '>Use sample photos</button><span class="xsmall muted" id="ph-total"></span></div>' +
      '<div id="flags-sum"></div><div id="unsorted"></div>' +
      '<div class="rooms-up">' + rooms.map(function(r){ return roomBlock(r); }).join('') + '</div>' +
      '<div class="add-room"><button type="button" class="btn btn-secondary" id="add-room">' + RI.icon('house','i-sm') + 'Add a room</button><span class="xsmall muted">Office, laundry, attic, garage, porch and more</span></div>' +
      '<section class="plans"><h2>Floor plans <span class="opt">(optional)</span></h2><p class="small muted">If you have one: an image or a PDF. Stored and viewable. Plans are not read automatically in this version.</p><label class="btn btn-secondary btn-sm file-btn">' + RI.icon('file','i-sm') + 'Add a plan<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple id="plans"></label><ul class="plan-files" id="plan-files"></ul></section>';
    function roomBlock(r){
      return '<section class="room-up" data-room="' + r[0] + '"><header><div><h2>' + r[1] + '</h2><p class="xsmall muted">' + A.hintFor(r[2] || r[0]) + '</p></div><span class="ru-count"></span>' + (r[3] ? '<button type="button" class="icon-btn ru-del" data-delroom="' + r[0] + '" aria-label="Remove ' + RI.esc(r[1]) + '">' + RI.icon('x','i-sm') + '</button>' : '') + '</header>' +
        '<div class="thumbs"></div>' +
        '<label class="drop' + (rightsOn ? '' : ' is-off') + '"><input type="file" accept="' + ACCEPT + '" multiple capture="environment"' + (rightsOn ? '' : ' disabled') + ' data-room="' + r[0] + '">' + RI.icon('camera') + '<span><b>Add photos</b><span class="xsmall">Drop them here, choose files, or use your camera</span></span></label></section>';
    }
    var pending = {};
    function thumb(p, room){
      var cls = p.state === 'done' ? '' : p.state === 'fail' ? ' fail' : ' up';
      var flags = (p.flags || []).map(function(k){ return '<span class="th-flag' + (k === 'heic' ? ' info' : '') + '" title="' + (k === 'small' ? 'Under 800 px on the long side. Details may not be readable.' : k === 'blurry' ? 'This photo looks out of focus. A sharper one gives a more certain reading.' : k === 'near' ? 'Very similar to another photo of this house. Only one is needed.' : 'HEIC photos are converted to JPG in the product.') + '">' + FLAG[k] + '</span>'; }).join('');
      return '<figure class="th' + cls + '" data-p="' + p.id + '"><img src="' + p.src + '" alt="' + RI.esc(p.name) + '">' + (flags ? '<span class="th-flags">' + flags + '</span>' : '') +
        (p.state === 'up' ? '<span class="th-bar"><i style="width:' + (p.pct || 0) + '%"></i></span>' : '') +
        (p.state === 'fail' ? '<span class="th-fail">' + RI.icon('warn','i-sm') + 'Did not upload<button type="button" data-retry="' + p.id + '" data-room="' + room + '">Retry</button></span>' : '') +
        (room === 'unsorted' && p.state === 'done' ? '<select class="th-move" data-move="' + p.id + '" aria-label="Which room is this?"><option value="">Which room?</option>' + rooms.map(function(r){ return '<option value="' + r[0] + '">' + r[1] + '</option>'; }).join('') + '</select>' : '') +
        '<button type="button" class="th-x" data-del="' + p.id + '" data-room="' + room + '" aria-label="Remove photo">' + RI.icon('x','i-sm') + '</button></figure>';
    }
    function drawRoom(key){
      var list = (h.photos[key] || []).concat(pending[key] || []);
      if(key === 'unsorted'){
        var u = main.querySelector('#unsorted');
        u.innerHTML = list.length ? '<section class="room-up unsorted" data-room="unsorted"><header><div><h2>To sort</h2><p class="xsmall muted">Choose a room for each photo.</p></div></header><div class="thumbs">' + list.map(function(p){ return thumb(p, 'unsorted'); }).join('') + '</div></section>' : '';
        RI.fillIcons(u); return;
      }
      var sec = main.querySelector('.room-up[data-room="' + key + '"]'); if(!sec) return;
      sec.querySelector('.thumbs').innerHTML = list.map(function(p){ return thumb(p, key); }).join('');
      var n = A.photoCount(h, key);
      sec.querySelector('.ru-count').innerHTML = n ? '<span class="st st-ready">' + RI.icon('check','i-sm') + n + ' photo' + (n > 1 ? 's' : '') + '</span>' : '<span class="st st-draft">None yet</span>';
      sec.classList.toggle('has', n > 0);
      RI.fillIcons(sec);
    }
    function total(){ var n = 0; Object.keys(h.photos).forEach(function(k){ n += (h.photos[k] || []).length; }); Object.keys(pending).forEach(function(k){ n += pending[k].filter(function(p){ return p.state === 'up'; }).length; }); return n; }
    function totals(){
      main.querySelector('#ph-total').textContent = A.photoCount(h) + ' of ' + MAX_PHOTOS + ' photos · ' + rooms.filter(function(r){ return A.photoCount(h, r[0]); }).length + ' of ' + rooms.length + ' rooms';
      var fl = {small:0, blurry:0, near:0}; Object.keys(h.photos).forEach(function(k){ (h.photos[k] || []).forEach(function(p){ (p.flags || []).forEach(function(x){ if(fl[x] != null) fl[x]++; }); }); });
      var parts = []; if(fl.blurry) parts.push(fl.blurry + ' may be blurry'); if(fl.small) parts.push(fl.small + ' too small'); if(fl.near) parts.push(fl.near + ' near duplicate' + (fl.near > 1 ? 's' : ''));
      main.querySelector('#flags-sum').innerHTML = parts.length ? '<div class="notice notice-warn">' + RI.icon('eye') + '<span><b>Photo check:</b> ' + parts.join(', ') + '. They are kept, and a sharper or different photo gives a more certain reading. Point at a label for details.</span></div>' : '';
      RI.fillIcons(main.querySelector('#flags-sum'));
    }
    function all(){ drawRoom('unsorted'); rooms.forEach(function(r){ drawRoom(r[0]); }); totals(); }
    function upload(p, key){
      /* A simulated upload: progress per file, and now and then a failure that can be retried alone */
      p.state = 'up'; p.pct = 0; (pending[key] = pending[key] || []).push(p);
      var fail = !p.retried && Math.random() < .09, dur = 700 + Math.random() * 900, t0 = performance.now();
      drawRoom(key);
      (function tick(now){
        var k = Math.min(1, (now - t0) / dur); p.pct = Math.round(k * (fail ? 62 : 100));
        var bar = main.querySelector('[data-p="' + p.id + '"] .th-bar i'); if(bar) bar.style.width = p.pct + '%';
        if(k < 1){ requestAnimationFrame(tick); return; }
        pending[key] = pending[key].filter(function(x){ return x !== p; });
        if(fail){ p.state = 'fail'; (pending[key] = pending[key] || []).push(p); }
        else { p.state = 'done'; delete p.pct; (h.photos[key] = h.photos[key] || []).push(p); if(p.fp) h.fps.push(p.fp); saved(h); }
        drawRoom(key); totals();
      })(t0);
    }
    function existingHashes(){ var out = []; Object.keys(h.photos).forEach(function(k){ (h.photos[k] || []).forEach(function(p){ if(p.hash) out.push(p.hash); }); }); Object.keys(pending).forEach(function(k){ pending[k].forEach(function(p){ if(p.hash) out.push(p.hash); }); }); return out; }
    function addFiles(files, key){
      if(!h.rights){ RI.toast('Tick the photo rights box first.', 'warn'); return; }
      [].slice.call(files).forEach(function(file){
        var isHeic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
        var typeOk = /^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type) || TYPES_OK.test(file.name);
        if(!typeOk || /svg/i.test(file.type)){ RI.toast(file.name + ' was not added. We accept JPG, PNG, WebP and HEIC photos.', 'warn'); return; }
        if(file.size > MAX_MB * 1048576){ RI.toast(file.name + ' is over ' + MAX_MB + ' MB. Use a smaller copy.', 'warn'); return; }
        if(total() >= MAX_PHOTOS){ RI.toast('A house can have up to ' + MAX_PHOTOS + ' photos.', 'warn'); return; }
        var fp = file.name + '|' + file.size + '|' + file.lastModified;
        if(h.fps.indexOf(fp) > -1 || Object.keys(pending).some(function(k){ return pending[k].some(function(p){ return p.fp === fp; }); })){ RI.toast(file.name + ' is already added. Exact duplicates are skipped.', 'info'); return; }
        if(isHeic){ upload({id:A.uid('p'), name:file.name, src:heicThumb(file.name), fp:fp, flags:['heic']}, key); return; }
        A.shrink(file).then(function(r){
          var flags = [];
          if(Math.max(r.w, r.h) < 800) flags.push('small');
          if(r.sharp < 18) flags.push('blurry');
          if(existingHashes().some(function(x){ return hamming(x, r.hash) <= 6; })) flags.push('near');
          upload({id:A.uid('p'), name:file.name, src:r.src, fp:fp, hash:r.hash, flags:flags, px:r.w + ' by ' + r.h}, key);
        }, function(){ RI.toast(file.name + ' could not be opened as an image, so it was not added.', 'warn'); });
      });
    }
    main.addEventListener('change', function(e){
      var t = e.target;
      if(t.id === 'rights-cb'){
        h.rights = t.checked;
        if(t.checked) h.consents.rights = {at:Date.now(), version:RIGHTS.version, text:RIGHTS.text}; else delete h.consents.rights;
        saved(h); main.querySelector('#rights').classList.toggle('on', t.checked);
        main.querySelector('#rights-rec').textContent = t.checked ? 'Ticked ' + new Date(h.consents.rights.at).toLocaleString('en-US') + '. Wording: ' + RIGHTS.version + '.' : '';
        main.querySelectorAll('.drop input,#bulk').forEach(function(i){ i.disabled = !t.checked; }); main.querySelectorAll('.drop,.ph-tools .file-btn').forEach(function(d){ d.classList.toggle('is-off', !t.checked); });
        main.querySelector('#sample').disabled = !t.checked; return; }
      if(t.id === 'plans'){ addPlans(t.files); t.value = ''; return; }
      if(t.id === 'bulk'){ addFiles(t.files, 'unsorted'); t.value = ''; return; }
      if(t.matches('.drop input')){ addFiles(t.files, t.getAttribute('data-room')); t.value = ''; return; }
      if(t.matches('[data-move]') && t.value){
        var id = t.getAttribute('data-move'), p = h.photos.unsorted.filter(function(x){ return x.id === id; })[0];
        h.photos.unsorted = h.photos.unsorted.filter(function(x){ return x.id !== id; }); (h.photos[t.value] = h.photos[t.value] || []).push(p);
        saved(h); all(); RI.toast('Moved to ' + rooms.filter(function(r){ return r[0] === t.value; })[0][1] + '.');
      }
    });
    main.addEventListener('click', function(e){
      var del = e.target.closest('[data-del]'), re = e.target.closest('[data-retry]');
      if(del){ var k = del.getAttribute('data-room'), id = del.getAttribute('data-del');
        var gone = (h.photos[k] || []).filter(function(x){ return x.id === id; })[0]; if(gone && gone.fp) h.fps = h.fps.filter(function(f){ return f !== gone.fp; });
        h.photos[k] = (h.photos[k] || []).filter(function(x){ return x.id !== id; }); pending[k] = (pending[k] || []).filter(function(x){ return x.id !== id; });
        saved(h); drawRoom(k); totals(); }
      if(re){ var k2 = re.getAttribute('data-room'), p = (pending[k2] || []).filter(function(x){ return x.id === re.getAttribute('data-retry'); })[0];
        if(p){ pending[k2] = pending[k2].filter(function(x){ return x !== p; }); p.retried = true; upload(p, k2); } }
      if(e.target.closest('#sample')){
        var added = 0;
        rooms.forEach(function(r){ var sp = SAMPLE_PHOTOS[r[2] || r[0]]; if(A.photoCount(h, r[0]) || !sp || !sp.length) return; sp.forEach(function(s){ upload({id:A.uid('p'), name:s.split('/').pop(), src:RI.img(s), retried:true}, r[0]); added++; }); });
        RI.toast(added ? 'Added sample photos to the empty rooms.' : 'Every room already has photos.');
      }
      if(e.target.closest('#add-room')) roomPicker();
      var vp = e.target.closest('[data-viewplan]'); if(vp) viewPlan(+vp.getAttribute('data-viewplan'));
      var rp = e.target.closest('[data-rmplan]'); if(rp){ h.plans.splice(+rp.getAttribute('data-rmplan'), 1); saved(h); plans(); }
      var dr = e.target.closest('[data-delroom]'); if(dr){ var key = dr.getAttribute('data-delroom'), n = A.photoCount(h, key);
        var go = function(){ h.extraRooms = (h.extraRooms || []).filter(function(x){ return x.key !== key; }); delete h.photos[key]; saved(h); A.render(); };
        if(n) A.confirm('Remove this room?', 'Its ' + n + ' photo' + (n > 1 ? 's are' : ' is') + ' removed too.', 'Remove room', go, true); else go(); }
    });
    /* Drag and drop */
    main.addEventListener('dragover', function(e){ var d = e.target.closest('.drop'); if(d && h.rights){ e.preventDefault(); d.classList.add('over'); } });
    main.addEventListener('dragleave', function(e){ var d = e.target.closest('.drop'); if(d) d.classList.remove('over'); });
    main.addEventListener('drop', function(e){ var d = e.target.closest('.drop'); if(!d) return; e.preventDefault(); d.classList.remove('over'); addFiles(e.dataTransfer.files, d.querySelector('input').getAttribute('data-room')); });
    function roomPicker(){
      var counts = {}; (h.extraRooms || []).forEach(function(x){ counts[x.type] = (counts[x.type] || 0) + 1; });
      function grp(title, arr){ return '<div class="rp-g"><h3>' + title + '</h3><div class="rp-chips">' + arr.map(function(t){ return '<button type="button" data-rt="' + t[0] + '" data-rn="' + RI.esc(t[1]) + '">' + t[1] + (counts[t[0]] ? ' <span class="n">' + counts[t[0]] + '</span>' : '') + '</button>'; }).join('') + '</div></div>'; }
      var d = A.dialog('Add a room', '<p class="small muted">Room types from Sam\'s room list. The standard contents of each type come from its room template, so you never type what a room holds.</p>' + grp('Inside', RI.ROOM_TYPES.inside) + grp('Outside', RI.ROOM_TYPES.outside), {wide:true});
      d.addEventListener('click', function(e){
        var b2 = e.target.closest('[data-rt]'); if(!b2) return;
        var type = b2.getAttribute('data-rt'), name = b2.getAttribute('data-rn'), n = (counts[type] || 0) + 1;
        h.extraRooms = (h.extraRooms || []).concat([{key:'x-' + type + '-' + A.uid(''), type:type, name:name + (n > 1 ? ' ' + n : '')}]);
        saved(h); d.close(); RI.toast(name + ' added. Add its photos below.'); A.render();
        setTimeout(function(){ var secs = doc.querySelectorAll('.room-up[data-room^="x-"]'); var last = secs[secs.length - 1]; if(last) last.scrollIntoView({behavior:A.reduce ? 'auto' : 'smooth', block:'center'}); }, 300);
      });
    }
    /* Plans: images and PDFs, stored and viewable */
    function addPlans(files){
      [].slice.call(files).forEach(function(file){
        var isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name), isImg = /^image\/(jpeg|png|webp)$/i.test(file.type);
        if(!isPdf && !isImg){ RI.toast(file.name + ' was not added. Plans can be JPG, PNG, WebP or PDF.', 'warn'); return; }
        if(file.size > MAX_MB * 1048576){ RI.toast(file.name + ' is over ' + MAX_MB + ' MB.', 'warn'); return; }
        var rec = {name:file.name, kb:Math.round(file.size / 1024), kind:isPdf ? 'pdf' : 'image'};
        function done(){ h.plans = (h.plans || []).concat([rec]); saved(h); plans(); RI.toast('Plan added.', 'file'); }
        if(isImg){ A.shrink(file).then(function(r){ rec.src = r.src; done(); }, function(){ RI.toast(file.name + ' could not be opened.', 'warn'); }); }
        else if(file.size <= MAX_PLAN_KEEP * 1048576){ var fr = new FileReader(); fr.onload = function(){ rec.src = fr.result; done(); }; fr.readAsDataURL(file); }
        else { rec.big = true; done(); }
      });
    }
    function viewPlan(i){
      var p = h.plans[i];
      A.dialog(RI.esc(p.name), p.src ? (p.kind === 'pdf' ? '<object class="plan-view" data="' + p.src + '" type="application/pdf"><p>This browser cannot show the PDF here. <a href="' + p.src + '" download="' + RI.esc(p.name) + '">Download it</a>.</p></object>' : '<img class="plan-view" src="' + p.src + '" alt="Floor plan">') : '<p class="muted">This file is larger than this demo keeps in the browser. In the product it is stored privately and opens here.</p>', {wide:true});
    }
    function plans(){ main.querySelector('#plan-files').innerHTML = (h.plans || []).map(function(p, i){ return '<li>' + RI.icon('file','i-sm') + '<span>' + RI.esc(p.name) + '</span><span class="xsmall muted">' + (p.kind === 'pdf' ? 'PDF' : 'Image') + ', ' + p.kb + ' KB</span><button type="button" class="linkbtn" data-viewplan="' + i + '">View</button><button type="button" class="linkbtn" data-rmplan="' + i + '">Remove</button></li>'; }).join(''); RI.fillIcons(main.querySelector('#plan-files')); }
    plans();
    all();
    return function(){
      var up = Object.keys(pending).some(function(k){ return pending[k].some(function(p){ return p.state === 'up'; }); });
      if(up){ RI.toast('A few photos are still uploading. One moment.', 'clock'); return false; }
      if((h.photos.unsorted || []).length){ RI.toast('Choose a room for the photos in "To sort" first.', 'warn'); main.querySelector('#unsorted').scrollIntoView({behavior:'smooth', block:'center'}); return false; }
      return true;
    };
  }

  /* ---------- Step 3: room sizes, optional ---------- */
  function stepSizes(main, h){
    h.sizes = h.sizes || {};
    var rooms = A.roomsFor(h).filter(function(r){ return ['kitchen','living','bedrooms','hallbath','basement'].indexOf(r[0]) > -1; });
    var label = {bedrooms:'A typical bedroom', hallbath:'A full bath', living:'Living room'};
    main.innerHTML = '<header class="wiz-head"><p class="label">Step 3 of 4</p><h1>Room sizes</h1><p class="muted">Optional. If you know a room\'s length and width, your range gets narrower. Skip any you do not know.</p></header>' +
      '<div class="narrow-demo" aria-live="polite"><div><p class="label">Your range, as sizes are added</p><p class="small muted" id="nd-t"></p></div><div class="nd-line" data-scale="0,100"><div class="rl thick" id="nd-rl" data-low="10" data-high="90"></div></div></div>' +
      '<div class="sizes">' + rooms.map(function(r){
        var s = h.sizes[r[0]] || {};
        return '<div class="size-row" data-room="' + r[0] + '"><div><b>' + (label[r[0]] || r[1]) + '</b><span class="xsmall muted" data-area></span></div>' +
          '<div class="lw"><label class="sr" for="l-' + r[0] + '">Length in feet</label><input class="input" id="l-' + r[0] + '" inputmode="decimal" placeholder="Length" value="' + (s.l || '') + '"><span aria-hidden="true">×</span><label class="sr" for="w-' + r[0] + '">Width in feet</label><input class="input" id="w-' + r[0] + '" inputmode="decimal" placeholder="Width" value="' + (s.w || '') + '"><span class="xsmall muted">ft</span></div></div>';
      }).join('') + '</div>' +
      '<p class="small"><a href="#/houses/' + h.id + '/intake/review" class="textlink">Skip this step ' + RI.icon('arrow','i-sm') + '</a></p>';
    function upd(){
      var n = 0;
      main.querySelectorAll('.size-row').forEach(function(row){
        var k = row.getAttribute('data-room'), l = parseFloat(row.querySelector('#l-' + k).value), w = parseFloat(row.querySelector('#w-' + k).value);
        var ok = l > 2 && l < 80 && w > 2 && w < 80;
        if(ok){ h.sizes[k] = {l:l, w:w}; n++; } else delete h.sizes[k];
        row.querySelector('[data-area]').textContent = ok ? Math.round(l * w) + ' sq ft' : (l || w ? 'Enter both sizes, in feet' : 'Not entered');
        row.classList.toggle('done', ok);
      });
      var spread = 40 - n * (30 / rooms.length);
      var rl = main.querySelector('#nd-rl'); rl.setAttribute('data-low', 50 - spread); rl.setAttribute('data-high', 50 + spread); RI.drawRange(rl); rl.classList.add('drawn');
      main.querySelector('#nd-t').textContent = n ? n + ' of ' + rooms.length + ' rooms sized. The range narrows with each one.' : 'No sizes yet: we use room templates and typical sizes, which widen the range.';
    }
    var deb; main.addEventListener('input', function(){ upd(); clearTimeout(deb); deb = setTimeout(function(){ saved(h); }, 400); });
    RI.initRanges(main); upd();
    return function(){ saved(h); return true; };
  }


  /* ---------- Step 4: review, with the estimate tick before Submit ---------- */
  /* "What happens next": three stages, each with a small picture of this house's own data */
  function nextSteps(h){
    var thumbs = [], n = A.photoCount(h);
    Object.keys(h.photos || {}).forEach(function(k){ (h.photos[k] || []).forEach(function(p){ if(p.state === 'done' && thumbs.length < 3) thumbs.push(p.src); }); });
    var st = [
      ['eye', 'We read your photos', n ? 'All ' + n + ' of them, room by room. A few minutes.' : 'Room by room. A few minutes.',
        '<span class="ns-pics">' + (thumbs.length ? thumbs.map(function(src){ return '<img src="' + src + '" alt="">'; }).join('') : '<i></i><i></i><i></i>') + '</span>'],
      ['sliders', 'We work out the plan and price', 'Every part of the house, under three goals.',
        '<span class="ns-pk"><i>Essential</i><i class="on">Standard</i><i>Premium</i></span>'],
      ['mail', 'You see the price by package', 'Free. We email you when it is ready.',
        '<span class="ns-rl" aria-hidden="true"><span class="ns-ln"></span><span class="ns-bar"></span><span class="ns-lo">Low</span><span class="ns-hi">High</span></span>']
    ];
    return '<section class="rev-s next-s" aria-labelledby="ns-h"><header class="ns-head"><h2 id="ns-h">What happens next</h2><span class="ns-tag">' + RI.icon('clock','i-sm') + 'You can leave this page</span></header>' +
      '<ol class="ns">' + st.map(function(x, i){ return '<li style="--i:' + i + '"><span class="ns-ic">' + RI.icon(x[0]) + '<b>' + (i + 1) + '</b></span><div class="ns-t"><h3>' + x[1] + '</h3><p>' + x[2] + '</p></div><div class="ns-art">' + x[3] + '</div></li>'; }).join('') + '</ol></section>';
  }
  function recTxt(c){ return c ? 'Ticked ' + new Date(c.at).toLocaleString('en-US') + '. Wording: ' + c.version + '.' : ''; }
  var BSMT = {finished:'Finished', partly:'Partly finished', unfinished:'Unfinished', none:'None'};
  function stepReview(main, h){
    var rooms = A.roomsFor(h), f = h.facts || {}, m = f.more || {}, gaps = [];
    h.consents = h.consents || {};
    /* Missing photos, grouped: "Bedrooms 2 and 3 have no photos" reads better than one line each */
    var miss = {}, order = [];
    rooms.forEach(function(r){ if(r[0] === 'other' || A.photoCount(h, r[0])) return; var g = r[2] || r[0]; if(!miss[g]){ miss[g] = []; order.push(g); } miss[g].push(r[1]); });
    order.forEach(function(g){
      var l = miss[g], one = l.length === 1, all = rooms.filter(function(r){ return (r[2] || r[0]) === g; }).length;
      var name = one ? l[0] : (l.length === all ? 'All ' + l[0].replace(/ \d+$/, '').toLowerCase() + 's' : l[0].replace(/ \d+$/, '') + 's ' + l.map(function(x){ return x.split(' ').pop(); }).join(', ').replace(/, (\d+)$/, ' and $1'));
      gaps.push(['camera', name + (one ? ' has' : ' have') + ' no photos yet. ' + (one ? 'It' : 'They') + ' will show as unverified.', 'photos', 'Add photos']);
    });
    if(!(h.sizes.kitchen && h.sizes.kitchen.l)) gaps.push(['ruler', 'No kitchen size. The kitchen floor will need a measurement.', 'measurements', 'Add the size']);
    var fl = 0; Object.keys(h.photos || {}).forEach(function(k){ (h.photos[k] || []).forEach(function(p){ if((p.flags || []).some(function(x){ return x !== 'heic'; })) fl++; }); });
    if(fl) gaps.push(['eye', fl + ' photo' + (fl > 1 ? 's are' : ' is') + ' flagged as blurry, too small or a near duplicate. They are kept; a better photo gives a more certain reading.', 'photos', 'Review photos']);
    if(!h.rights && A.photoCount(h)) gaps.unshift(['warn', 'The photo rights box is not ticked.', 'photos', 'Tick it']);
    var sized = Object.keys(h.sizes || {}).length;
    var more = [['Listing link', m.link], ['Lot', m.lot ? m.lot + ' ' + (m.lotUnit || '') : ''], ['Garage', m.garage && m.garage !== 'none' ? m.garage + ', ' + m.garageSpaces + ' spaces' : ''], ['Flooring', (m.floors || []).join(', ')], ['Heating', [m.heat, m.heatYear].filter(Boolean).join(', ')], ['Cooling', m.cool], ['Water heater', m.whYear], ['Exterior', m.exterior], ['Fireplaces', m.fireplaces || ''], ['Known updates', m.updates], ['Listing remarks', m.remarks ? m.remarks.slice(0, 120) + (m.remarks.length > 120 ? '…' : '') : '']].filter(function(x){ return x[1]; });
    main.innerHTML = '<header class="wiz-head"><p class="label">Step 4 of 4</p><h1>Review and submit</h1><p class="muted">Check what we have. Anything missing is still fine: it is labeled in your estimate, never guessed.</p></header>' +
      '<div class="rev">' +
      '<section class="rev-s"><header><h2>The house</h2><a href="#/houses/' + h.id + '/intake/house">Edit</a></header><dl class="kv">' +
        [['Address', RI.esc(A.addr(h) + (h.addr.unit ? ', unit ' + h.addr.unit : '') + ', ' + (h.addr.city || '') + ', ' + (h.addr.state || 'MI') + ' ' + (h.addr.zip || ''))], ['Property type', 'Single-family detached'], ['Built', f.year || '?'], ['Above grade', f.sqft ? (+f.sqft).toLocaleString('en-US') + ' sq ft' : '?'], ['Stories', f.stories || '?'], ['Bedrooms and baths', (f.beds || 0) + ' bed, ' + (f.baths || 0) + ' full, ' + (f.halfBaths || 0) + ' half'], ['Basement', BSMT[f.basement || 'none'] + ((f.basement === 'finished' || f.basement === 'partly') && f.basementSqft ? ', ' + f.basementSqft + ' sq ft finished' : '') + (f.basementTotal ? ', ' + f.basementTotal + ' sq ft total' : '')]].map(function(r){ return '<div><dt>' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') +
        (more.length ? more.map(function(r){ return '<div><dt>' + r[0] + '</dt><dd>' + RI.esc(r[1]) + ' <span class="ev-rep">Reported</span></dd></div>'; }).join('') : '') + '</dl></section>' +
      '<section class="rev-s"><header><h2>Photos</h2><a href="#/houses/' + h.id + '/intake/photos">Edit</a></header><ul class="rev-rooms">' + rooms.filter(function(r){ return r[0] !== 'other' || A.photoCount(h, 'other'); }).map(function(r){
        var n = A.photoCount(h, r[0]), pics = (h.photos[r[0]] || []).slice(0, 4);
        return '<li class="' + (n ? 'ok' : 'gap') + '"><span class="rr-n">' + RI.icon(n ? 'check' : 'warn','i-sm') + r[1] + '</span><span class="rr-pics">' + pics.map(function(p){ return '<img src="' + p.src + '" alt="">'; }).join('') + '</span><b>' + n + '</b></li>';
      }).join('') + '</ul>' + ((h.plans || []).length ? '<p class="small">' + h.plans.length + ' floor plan' + (h.plans.length > 1 ? 's' : '') + ' attached.</p>' : '') +
      (h.consents.rights ? '<p class="xsmall muted">' + RI.icon('check','i-sm') + ' Photo rights ticked ' + new Date(h.consents.rights.at).toLocaleString('en-US') + ' (wording ' + h.consents.rights.version + ').</p>' : '') + '</section>' +
      '<section class="rev-s"><header><h2>Room sizes</h2><a href="#/houses/' + h.id + '/intake/measurements">Edit</a></header><p class="small">' + (sized ? sized + ' room' + (sized > 1 ? 's' : '') + ' sized: ' + Object.keys(h.sizes).map(function(k){ return k + ' ' + h.sizes[k].l + ' by ' + h.sizes[k].w + ' ft'; }).join(', ') : 'None. We will use room templates and typical sizes.') + '</p></section>' +
      (gaps.length ? '<section class="gaps"><h2>' + RI.icon('info','i-sm') + 'Before you submit</h2><ul>' + gaps.map(function(g){ return '<li>' + RI.icon(g[0],'i-sm') + '<span>' + g[1] + '</span><a href="#/houses/' + h.id + '/intake/' + g[2] + '">' + g[3] + '</a></li>'; }).join('') + '</ul></section>' : '<section class="gaps ok"><h2>' + RI.icon('check','i-sm') + 'Every room has photos</h2></section>') +
      nextSteps(h) +
      '<label class="rights rev-tick' + (h.consents.estimate ? ' on' : '') + '" id="c2"><input type="checkbox" id="c-est"' + (h.consents.estimate ? ' checked' : '') + '><span><b>' + DISC.text + '</b><span class="small muted">No contractor is contacted and no work is done. A contractor still needs to see the house. Required to submit.</span><span class="xsmall muted c-rec" id="c-rec">' + recTxt(h.consents.estimate) + '</span><span class="err" id="c-err"></span></span></label>' +
      '</div>';
    main.addEventListener('change', function(e){
      if(e.target.id !== 'c-est') return;
      if(e.target.checked) h.consents.estimate = {at:Date.now(), version:DISC.version, text:DISC.text}; else delete h.consents.estimate;
      saved(h); main.querySelector('#c2').classList.toggle('on', e.target.checked); main.querySelector('#c-rec').textContent = recTxt(h.consents.estimate);
      if(e.target.checked){ var er = main.querySelector('#c-err'); er.innerHTML = ''; er.style.display = ''; }
    });
    return function(){
      if(A.photoCount(h) && !h.rights){ RI.toast('Tick the photo rights box on the Photos step first.', 'warn'); A.go('#/houses/' + h.id + '/intake/photos'); return false; }
      if(!h.consents.estimate){ var er = main.querySelector('#c-err'); er.innerHTML = RI.icon('warn','i-sm') + '<span>Please tick this to submit.</span>'; er.style.display = 'flex'; main.querySelector('#c2').scrollIntoView({behavior:A.reduce ? 'auto' : 'smooth', block:'center'}); main.querySelector('#c-est').focus({preventScroll:true}); return false; }
      return 'submit';
    };
  }

  /* ---------- Submit checks: a verified email, and room under the free-report limit (SECURITY 5, 9) ---------- */
  A.trialOn = function(){ var s = A.me(); if(!s) return false; var t = RI.store.get('trial.' + s.email); return !!t && Date.now() < t + 15 * 86400000; };
  A.limitDialog = function(h){
    var d = A.dialog('You have used your free estimates', '<div class="mark bronze">' + RI.icon('lock') + '</div><p>Each account can run <b>' + A.FREE_LIMIT + ' free estimates</b>. Prices you have already seen stay open. Your draft is saved.</p>' +
      '<div class="limit-opts">' +
        (h ? '<a class="lo" href="#/houses/' + h.id + '/checkout?run=1" data-dlg-close><b>Pay for this house</b><span>One payment runs it and opens the full presentation.</span></a>' : '') +
        (A.trialOn() ? '' : '<button type="button" class="lo" id="lo-trial"><b>Start a 15-day trial</b><span>Run more houses and open presentations without paying.</span></button>') +
        '<a class="lo" href="' + RI.url('waitlist/') + '"><b>Join the waitlist</b><span>We tell you when more free estimates open.</span></a>' +
      '</div><p class="xsmall muted">Sample number and options. Sam sets both (APP_FLOW 6.5).</p>');
    var tb = d.querySelector('#lo-trial'); if(tb) tb.addEventListener('click', function(){ RI.store.set('trial.' + A.me().email, Date.now()); d.close(); RI.toast('Your 15-day trial has started.', 'check'); });
  };
  function canSubmit(h, again){
    var s = A.me();
    if(!s.demo){
      var u = RI.users.get(s.email) || {};
      if(!u.verified){
        A.dialog('Confirm your email to submit', '<p>We need a confirmed email before we read your photos. Your draft is saved.</p><div class="cta-row" style="justify-content:flex-end"><a class="btn btn-primary" href="' + RI.url('verify-email/?email=' + encodeURIComponent(s.email)) + '">Confirm my email</a></div>');
        return false;
      }
    }
    if(!again && !A.isPro()){
      var used = A.mine().filter(function(x){ return x.run && x.id !== h.id; }).length;
      if(used >= A.FREE_LIMIT && !A.trialOn()){ A.limitDialog(h); return false; }
    }
    return true;
  }

  A.route('/houses/:id/intake/:step', function(view, p){
    var h = A.get(p.id); if(!h){ view.innerHTML = A.notFound(); return; }
    if(OLD[p.step]){ A.go('#/houses/' + h.id + '/intake/' + OLD[p.step]); return; }
    if(OLD[h.step]){ h.step = OLD[h.step]; A.put(h); }
    var at = STEPS.findIndex(function(s){ return s[0] === p.step; }); if(at < 0){ A.go('#/houses/' + h.id + '/intake/house'); return; }
    if(h.status === 'draft' && STEPS.findIndex(function(s){ return s[0] === h.step; }) < at) { h.step = p.step; A.put(h); }
    h.facts = h.facts || {}; h.addr = h.addr || {}; h.sizes = h.sizes || {};
    var main = layout(view, h, p.step);
    var done = [stepHouse, stepPhotos, stepSizes, stepReview][at](main, h);
    view.querySelector('#next').addEventListener('click', function(){
      var r = done(); if(!r) return;
      if(r === 'submit'){
        var again = !!h.run; if(!canSubmit(h, again)) return;
        var b = this; RI.form.busy(b, true, 'Submitting');
        A.later(function(){
          h.status = 'submitted'; h.step = 'review'; h.run = {start:Date.now()}; h.version = (h.version || 1) + (again ? 1 : 0); h.submittedAt = Date.now();
          A.put(h); RI.track('intake_submitted', {again:again}); RI.toast(again ? 'Submitted again. A new version of your estimate is on its way.' : 'Submitted. Your house is in line.', 'check');
          A.go('#/houses/' + h.id);
        }, 700);
        return;
      }
      A.go('#/houses/' + h.id + '/intake/' + STEPS[at + 1][0]);
    });
  }, {focus:true});
})();
