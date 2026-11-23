/* App: the intake. Two screens (change 6, 19 Nov brief): Tell us about the home, then Rooms and photos with submit.
   Fields follow the draft field list (Developer Knowledge Guide p. 28, APP_FLOW 6.2), waiting for Sam's OK.
   Upload rules follow SECURITY 7 and the guide p. 29: types, limits, duplicates, quality flags, consent. */
(function(){
  var RI = window.RI, A = RI.App, doc = document;
  /* Two screens. Sizes and notes sit on the room card; the photo rights tick is asked once, on the first upload;
     the estimate tick is asked when you submit. The listing link and remarks are gone (Sam, video 1). */
  var STEPS = [['house','Tell us about the home'],['rooms','Rooms and photos']];
  var OLD = {remarks:'rooms', consent:'rooms', photos:'rooms', measurements:'rooms', review:'rooms'}; /* older drafts and links */
  var LAST = STEPS.length - 1;
  var SAMPLE_PHOTOS = {kitchen:['kitchen-dated.jpg','kitchen-dated-wide.jpg','cabinet-run.jpg'], living:['wood-floor.jpg','finishes/ct-stonelook.jpg'], bedrooms:['wood-floor.jpg'], hallbath:['finishes/bs-white.jpg','finishes/fx-black.jpg'], halfbath:['finishes/fx-single.jpg'], basement:['finishes/lt-old.jpg','finishes/lt-recessed.jpg'], exterior:['brick-ranch.jpg','livonia-street.jpg'], other:[]};
  var MAX_MB = 25, MAX_PHOTOS = 150, MAX_PLAN_KEEP = 1.5;            /* SECURITY 7; plan size kept in this demo */
  var TYPES_OK = /\.(jpe?g|png|webp|heic|heif)$/i;
  var RIGHTS = {version:'Draft 1, November 2026', text:'I took these photos or have the right to use them.'};
  var DISC = {version:'Draft 1, November 2026', text:'I understand this is an estimate for planning, based on the photos and facts I gave. It is not an inspection or a contractor\'s bid.'};
  A.FREE_LIMIT = RI.OFFERS.freeRuns; /* from RI.OFFERS; Sam sets the real number */

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
  var FLAG = {small:'Too small', blurry:'Blurry', near:'Similar', heic:'HEIC'};

  /* ---------- Layout, stepper, saving ---------- */
  var lastAt = null;
  /* A few words per step about where this house stands */
  var STEP_ICON = {house:'house', rooms:'camera'};
  function stepMeta(h, k){
    var f = h.facts || {};
    if(k === 'house') return f.sqft ? [f.year ? 'Built ' + f.year : '', (+f.sqft).toLocaleString('en-US') + ' sq ft'].filter(Boolean).join(' · ') : 'Address, size, rooms';
    if(k === 'rooms'){ var rooms = A.roomsFor(h).filter(function(r){ return r[0] !== 'other'; }), n = A.photoCount(h); return n ? n + ' photo' + (n === 1 ? '' : 's') + ' · ' + rooms.filter(function(r){ return A.photoCount(h, r[0]); }).length + ' of ' + rooms.length + ' rooms' : 'A photo of each room'; }
    return '';
  }
  function metaRefresh(h){ doc.querySelectorAll('.wz-m[data-k]').forEach(function(m){ m.textContent = stepMeta(h, m.getAttribute('data-k')); }); }
  function layout(view, h, step){
    var at = STEPS.findIndex(function(s){ return s[0] === step; });
    var reach = Math.max(at, STEPS.findIndex(function(s){ return s[0] === (h.step || 'house'); }));
    view.innerHTML = '<div class="wiz' + (at === LAST ? ' wiz-wide' : '') + '">' +
      /* The step bar: each step names itself and says, in a few words, where this house stands on it */
      '<div class="wiz-top"><nav class="wz" aria-label="Intake steps"><ol>' + STEPS.map(function(s, i){
        var state = i < at ? 'done' : i === at ? 'cur' : (i <= reach ? 'open' : 'todo');
        var mark = i < at ? RI.icon('check','i-sm') : i === at ? RI.icon(STEP_ICON[s[0]],'i-sm') : '<b>' + (i + 1) + '</b>';
        var inner = '<span class="wz-ic">' + mark + '</span><span class="wz-t"><small>Screen ' + (i + 1) + ' of ' + STEPS.length + '</small><b>' + s[1] + '</b><em class="wz-m" data-k="' + s[0] + '">' + stepMeta(h, s[0]) + '</em></span>';
        var label = 'Screen ' + (i + 1) + ', ' + s[1] + (state === 'done' ? ', done' : '');
        return '<li class="' + state + '">' + (state !== 'todo' && i !== at ? '<a class="wz-s" href="#/houses/' + h.id + '/intake/' + s[0] + '" aria-label="' + label + '" title="' + s[1] + '">' + inner + '</a>' : '<span class="wz-s"' + (i === at ? ' aria-current="step"' : ' aria-disabled="true"') + ' title="' + s[1] + '">' + inner + '</span>') + '</li>';
      }).join('') + '</ol>' +
        /* Phones: where you are and what is next, over a four-part bar */
        '<div class="wz-mob"><div class="wzm-row"><span class="wzm-ic">' + RI.icon(STEP_ICON[STEPS[at][0]],'i-sm') + '</span><span class="wzm-t"><small>Screen ' + (at + 1) + ' of ' + STEPS.length + '</small><b>' + STEPS[at][1] + '</b></span><span class="wzm-next">' + (at === LAST ? 'Then submit' : 'Next: ' + STEPS[at + 1][1]) + '</span></div>' +
        '<div class="wzm-bar">' + STEPS.map(function(s, i){ var st = i < at ? 'done' : i === at ? 'cur' : (i <= reach ? 'open' : 'todo'), lab = 'Step ' + (i + 1) + ', ' + s[1] + (st === 'done' ? ', done' : st === 'cur' ? ', current' : ''); return (st === 'done' || st === 'open') ? '<a class="' + st + '" href="#/houses/' + h.id + '/intake/' + s[0] + '" aria-label="' + lab + '"><i></i></a>' : '<span class="' + st + '" aria-label="' + lab + '"' + (st === 'cur' ? ' aria-current="step"' : '') + '><i></i></span>'; }).join('') + '</div></div>' +
      '</nav></div>' +
      '<div class="wiz-grid"><div class="wiz-main" id="wiz-main"></div><aside class="wiz-side" id="wiz-side" aria-label="Your house so far"></aside></div>' +
      /* The action dock: how far along, where you are, that it saves; then Back and Continue together */
      (function(){
        var C = 2 * Math.PI * 16, from = (lastAt != null ? lastAt + 1 : at + 1) / STEPS.length, to = (at + 1) / STEPS.length, nx = at === LAST ? null : STEPS[at + 1][1];
        return '<div class="wiz-bar' + (at === LAST ? ' is-last' : '') + '" role="region" aria-label="Step actions"><div class="wiz-bar-in"><div class="wb-dock">' +
          '<div class="wb-status"><span class="wb-ring" aria-hidden="true"><svg viewBox="0 0 40 40"><circle class="t" cx="20" cy="20" r="16"/><circle class="v" cx="20" cy="20" r="16" style="stroke-dasharray:' + C.toFixed(1) + ';--o0:' + (C * (1 - from)).toFixed(1) + ';--o1:' + (C * (1 - to)).toFixed(1) + '"/></svg><span><b>' + (at + 1) + '</b>/' + STEPS.length + '</span></span>' +
            '<span class="wb-txt"><span class="wb-name">' + (at === LAST ? '<span id="sub-sum" aria-live="polite"></span>' : '<span class="sr">Screen ' + (at + 1) + ' of ' + STEPS.length + ': </span>' + STEPS[at][1]) + '</span><span class="saved" id="saved" aria-live="polite">' + RI.icon('check','i-sm') + 'Saved as you go</span></span></div>' +
          '<div class="wb-acts">' +
            (at > 0 ? '<a class="wb-back" href="#/houses/' + h.id + '/intake/' + STEPS[at - 1][0] + '" aria-label="Back to ' + STEPS[at - 1][1].toLowerCase() + '">' + RI.icon('arrow','i-sm flip') + '<span>Back</span></a>' : '<a class="wb-back" href="#/houses" aria-label="Cancel and go to my houses"><span>Cancel</span>' + RI.icon('x','i-sm wb-x') + '</a>') +
            (at === LAST ? '<a class="btn btn-secondary wb-draft" href="#/houses" id="save-draft">Save draft</a>' : '') +
            '<button type="button" class="btn btn-primary wb-next" id="next">' + (at === LAST ? '<span>Submit my house</span>' + RI.icon('check','i-sm') : '<span>Continue<span class="wb-to"> to ' + nx.toLowerCase() + '</span></span>' + RI.icon('arrow','i-sm i-arrow')) + '</button>' +
          '</div></div></div></div>';
      })() + '</div>';
    lastAt = at;
    var exit = doc.getElementById('focus-exit');
    if(exit) exit.innerHTML = '<a class="exit-btn" href="#/houses" aria-label="Save and exit to my houses"><span class="eb-l">Save and exit</span><span class="eb-s" aria-hidden="true">Save &amp; exit</span>' + RI.icon('exit','i-sm') + '</a>';
    side(h);
    return view.querySelector('#wiz-main');
  }
  var savedT;
  function saved(h){
    if(!A.put(h)) return; side(h); metaRefresh(h);
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
    if(!f.propertyType) f.propertyType = 'single-family';
    if(!f.stories) f.stories = 1;
    var floors = ['Carpet','Hardwood','Vinyl','Tile','Laminate'];
    var bs = f.basement || 'finished';
    main.innerHTML = '<header class="wiz-head"><p class="label">Screen 1 of 2</p><h1>Tell us about the home</h1><p class="muted">Start with the address. Only address, year and size are required.</p></header>' +
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
      card('rooms', 3, 'Bedrooms and baths', 'Each one gets its own card on the next screen.', false,
        '<div class="cnt-grid">' + counter('beds', 'Bedrooms', IC.bed, f.beds != null ? f.beds : 3, 0, 15) + counter('baths', 'Full baths', IC.bath, f.baths || 1, 1, 8) + counter('halfBaths', 'Half baths', IC.half, f.halfBaths || 0, 0, 6) + '</div>' +
        '<div class="rooms-prev"><p class="xsmall muted">' + RI.icon('camera','i-sm') + '<span>Rooms we will ask photos for</span></p><ul id="rooms-prev" aria-live="polite"></ul></div>') +
      /* 4 Basement */
      card('bsmt', 4, 'Basement', 'Whether you have one, and how much of it is finished.', false,
        '<div class="bs-pick" role="radiogroup" aria-label="Basement">' + [['none','None','Slab or crawl space'],['unfinished','Unfinished','Bare walls and floor'],['partly','Partly finished','Some rooms finished'],['finished','Finished','Living space']].map(function(o){ return '<label><input type="radio" name="bsmt" value="' + o[0] + '"' + (bs === o[0] ? ' checked' : '') + '><span>' + bsIcon(o[0]) + '<b>' + o[1] + '</b><i>' + o[2] + '</i></span></label>'; }).join('') + '</div>' +
        '<div class="hs-2" id="bsmt-sizes"' + (bs === 'none' ? ' hidden' : '') + '>' +
          '<div class="field" id="bsqft-f"' + (bs === 'finished' || bs === 'partly' ? '' : ' hidden') + '><label for="bsqft">Finished basement <span class="opt">(optional)</span></label><div class="in-suf"><input class="input" id="bsqft" inputmode="numeric" value="' + (f.basementSqft || '') + '" placeholder="300"><span>sq ft</span></div><span class="help">Only the part you use as living space</span></div>' +
          '<div class="field"><label for="btot">Total basement <span class="opt">(optional)</span></label><div class="in-suf"><input class="input" id="btot" inputmode="numeric" value="' + (f.basementTotal || '') + '" placeholder="1,400"><span>sq ft</span></div><span class="help">The whole basement, finished and unfinished</span></div>' +
        '</div>') +
      '<details class="more-f"' + (Object.keys(m).some(function(k){ return m[k] && m[k].length !== 0 && m[k] !== 'none' && m[k] !== 'sq ft' && k !== 'link' && k !== 'remarks'; }) ? ' open' : '') + '><summary><span><b>More details</b><span class="xsmall muted">All optional.</span></span><span class="chev" aria-hidden="true"></span></summary><div class="more-in">' +
        '<div class="grid-3"><div class="field"><label for="m-lot">Lot size</label><input class="input" id="m-lot" inputmode="decimal" value="' + RI.esc(m.lot || '') + '"></div><div class="field"><label for="m-lotu">Unit</label><select class="select" id="m-lotu">' + ['sq ft','acres'].map(function(u){ return '<option' + (m.lotUnit === u ? ' selected' : '') + '>' + u + '</option>'; }).join('') + '</select></div>' + stepper('fire', 'Fireplaces', m.fireplaces || 0, 0, 6) + '</div>' +
        '<div class="field"><span class="flabel">Garage</span>' + seg('garage', [['none','None'],['attached','Attached'],['detached','Detached']], m.garage || 'none') + '</div>' +
        '<div class="field" id="gs-f"' + (!m.garage || m.garage === 'none' ? ' hidden' : '') + '>' + stepper('gspaces', 'Garage spaces', m.garageSpaces || 2, 1, 4) + '</div>' +
        '<fieldset class="field"><legend class="flabel">Flooring types</legend><div class="chk-chips">' + floors.map(function(x){ return '<label><input type="checkbox" name="floor" value="' + x + '"' + ((m.floors || []).indexOf(x) > -1 ? ' checked' : '') + '><span>' + x + '</span></label>'; }).join('') + '</div></fieldset>' +
        '<div class="grid-3"><div class="field"><label for="m-heat">Heating</label><select class="select" id="m-heat"><option value="">Not known</option>' + ['Forced air, gas','Boiler','Heat pump','Electric baseboard','Other'].map(function(x){ return '<option' + (m.heat === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div>' +
          '<div class="field"><label for="m-heaty">Heating year</label><input class="input" id="m-heaty" inputmode="numeric" maxlength="4" value="' + RI.esc(m.heatYear || '') + '"><span class="help">A guess is fine</span><span class="err"></span></div>' +
          '<div class="field"><label for="m-cool">Cooling</label><select class="select" id="m-cool"><option value="">Not known</option>' + ['Central air','Window units','None'].map(function(x){ return '<option' + (m.cool === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div></div>' +
        '<div class="grid-3"><div class="field"><label for="m-wh">Water heater year</label><input class="input" id="m-wh" inputmode="numeric" maxlength="4" value="' + RI.esc(m.whYear || '') + '"><span class="help">Often on a sticker on the tank</span><span class="err"></span></div><div class="field span-2"><label for="m-ext">Exterior, roof, foundation</label><input class="input" id="m-ext" placeholder="Brick, asphalt shingle roof, poured basement" value="' + RI.esc(m.exterior || '') + '"></div></div>' +
        '<div class="field"><label for="m-upd">Known updates</label><textarea class="input" id="m-upd" rows="2" placeholder="Kitchen 2015, roof 2018">' + RI.esc(m.updates || '') + '</textarea><span class="help">With the year, if you know it.</span></div>' +
        '<p class="xsmall muted">Heating, cooling and the water heater get guidance only, never a price.</p>' +
      '</div></details>' +
      '</form>';
    var $ = function(id){ return main.querySelector('#' + id); };
    function collect(){
      a.street = $('street').value.trim(); a.unit = $('unit').value.trim(); a.city = $('city').value.trim(); a.state = $('state').value.trim().toUpperCase(); a.zip = $('zip').value.trim();
      f.propertyType = 'single-family';
      f.year = $('year').value.replace(/\D/g, ''); f.sqft = $('sqft').value.replace(/\D/g, '');
      f.stories = +(main.querySelector('input[name=stories]:checked') || {value:1}).value; f.beds = +$('beds').textContent; f.baths = +$('baths').textContent; f.halfBaths = +$('halfBaths').textContent;
      f.basement = main.querySelector('input[name=bsmt]:checked').value; f.basementSqft = $('bsqft').value.replace(/\D/g, ''); f.basementTotal = $('btot').value.replace(/\D/g, '');
      m.lot = $('m-lot').value.trim(); m.lotUnit = $('m-lotu').value; m.fireplaces = +$('fire').textContent;
      m.garage = main.querySelector('input[name=garage]:checked').value; m.garageSpaces = m.garage === 'none' ? 0 : +$('gspaces').textContent;
      m.floors = [].slice.call(main.querySelectorAll('input[name=floor]:checked')).map(function(i){ return i.value; });
      m.heat = $('m-heat').value; m.heatYear = $('m-heaty').value.replace(/\D/g, ''); m.cool = $('m-cool').value; m.whYear = $('m-wh').value.replace(/\D/g, ''); m.exterior = $('m-ext').value.trim();
      m.updates = $('m-upd').value.trim();
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

  /* ---------- Screen 2: rooms and photos (change 6). One tray for every photo, room cards with photos, size and a note,
     the photo rights asked once on the first upload, and the house submitted from this screen. ---------- */
  /* A suggested room from the file name. The product would use a quick read of each photo (a decision for Sam);
     without it the chip is empty and the person picks the room. */
  var SUGGEST = [[/kitchen|cabinet|counter|ct-|bs-|pulldown/i,'kitchen'],[/half/i,'halfbath'],[/bath|vanity|toilet|tub|shower|fx-black/i,'hallbath'],[/bed/i,'bedrooms'],[/living|family|dining|hall|wood-floor|floor/i,'living'],[/basement|lt-old|lt-recessed/i,'basement'],[/exterior|front|street|ranch|colonial|yard|outside/i,'exterior']];
  function suggestFor(name, rooms){
    for(var i = 0; i < SUGGEST.length; i++){ if(SUGGEST[i][0].test(name) && rooms.some(function(r){ return r[0] === SUGGEST[i][1]; })) return SUGGEST[i][1]; }
    return '';
  }
  function stepRooms(main, h, finish){
    h.photos = h.photos || {}; h.fps = h.fps || []; h.consents = h.consents || {}; h.sizes = h.sizes || {}; h.notes = h.notes || {}; h.measured = h.measured || {};
    var rooms = A.roomsFor(h);
    var ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif';
    function nameOf(k){ var r = rooms.filter(function(x){ return x[0] === k; })[0]; return r ? r[1] : k; }
    function sizeable(r){ return r[0] !== 'exterior' && r[0] !== 'other' && !/^x-(ext|deck|patio|porch|driveway|pool|accessory)/.test(r[0]); }
    main.innerHTML = '<header class="wiz-head rp3-head"><div><p class="label">Screen 2 of 2</p><h1>Rooms and photos</h1><p class="muted">Add all your photos at once, then put each one in its room. Sizes are optional.</p></div>' +
        '<div class="rp3-prog" id="rp3-prog" aria-live="polite"></div></header>' +
      '<div class="rp2">' +
        '<aside class="rp2-tray up3" aria-label="Your photos">' +
          '<div class="up3-hero"><input type="file" accept="' + ACCEPT + '" multiple data-room="unsorted" tabindex="-1" aria-hidden="true">' +
            '<span class="up3-ic">' + RI.icon('image','i-lg') + '<span class="up3-plus">' + RI.icon('plus') + '</span></span>' +
            '<span class="up3-t"><b>Add your photos</b><span>Drag and drop, or browse</span></span></div>' +
          '<div class="up3-btns"><label class="btn btn-primary file-btn">' + RI.icon('upload') + 'Choose photos<input type="file" accept="' + ACCEPT + '" multiple data-room="unsorted"></label>' +
            '<label class="btn btn-secondary file-btn up3-cam" title="Use camera">' + RI.icon('camera') + '<span class="up3-bt">Use camera</span><input type="file" accept="image/*" capture="environment" data-room="unsorted"></label>' +
            (RI.devTools ? '<button type="button" class="btn btn-secondary btn-sm" id="sample">Team: sample photos</button>' : '') + '</div>' +
          '<p class="up3-fmt">JPG, PNG, WebP or HEIC · up to ' + MAX_PHOTOS + ' photos</p>' +
          '<div id="flags-sum"></div>' +
          '<section class="rp2-unsorted" id="unsorted" aria-live="polite"></section>' +
          '<p class="up3-total" id="ph-total"></p>' +
        '</aside>' +
        '<div class="rp2-rooms">' +
          '<div class="rc2-nav" aria-hidden="false"><span class="rc2-dots" id="rc2-dots"></span><button type="button" class="btn btn-secondary btn-sm" id="rc2-next">Next room ' + RI.icon('arrow','i-sm') + '</button></div>' +
          '<div class="rc2-grid" id="rc2-grid">' + rooms.map(roomCard).join('') + '</div>' +
          '<button type="button" class="add-room3" id="add-room">' + RI.icon('plus') + '<b>Add a room</b><span>Office, laundry, attic, porch and more</span></button>' +
          '<details class="plans-f"><summary>Floor plans <span class="opt">(optional)</span></summary><p class="small muted">An image or a PDF, if you have one.</p><label class="btn btn-secondary btn-sm file-btn">' + RI.icon('file','i-sm') + 'Add a plan<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple id="plans"></label><ul class="plan-files" id="plan-files"></ul></details>' +
        '</div>' +
      '</div>';
    /* One icon per kind of room, on the card and in the edit sheet */
    function iconFor(r){
      var t = r[2] || r[0];
      if(t === 'kitchen') return 'kitchen'; if(t === 'living') return 'sofa'; if(/bed/.test(t)) return 'bed'; if(/bath/.test(t)) return 'bath';
      if(/basement|stair/.test(t)) return 'stairs'; if(t === 'other') return 'grid';
      if(t === 'exterior' || /^ext-|deck|patio|porch|driveway|pool|accessory|roof|yard|garage/.test(t)) return 'house';
      return 'door';
    }
    function roomOf(k){ return rooms.filter(function(x){ return x[0] === k; })[0]; }
    /* The cover is the photo the owner picked in the edit sheet, else the first one */
    function coverOf(k){ var list = h.photos[k] || [], id = h.covers && h.covers[k]; return list.filter(function(p){ return p.id === id; })[0] || list[0]; }
    function roomCard(r){
      var s = h.sizes[r[0]] || {}, nm = RI.esc(r[1]);
      return '<section class="rc2 rc3" data-room="' + r[0] + '" aria-labelledby="rc2-' + r[0] + '">' +
        '<div class="rc3-media"></div>' +
        '<div class="rc3-body"><span class="rc3-ic">' + RI.icon(iconFor(r)) + '</span><div class="rc3-t"><h2 id="rc2-' + r[0] + '">' + nm + '</h2><p>' + A.hintFor(r[2] || r[0]) + '</p></div>' +
          (r[3] ? '<button type="button" class="icon-btn ru-del" data-delroom="' + r[0] + '" aria-label="Remove ' + nm + '">' + RI.icon('x','i-sm') + '</button>' : '') + '</div>' +
        (sizeable(r) ? '<div class="sz" data-sz="' + r[0] + '" aria-live="polite" hidden></div>' : '') +
        '<details class="rc3-foot"><summary><span class="rc3-sum"></span><span class="rc3-state"></span></summary><div class="rc2-meta">' +
          (sizeable(r) ? '<div class="rc2-size"><span class="xsmall muted">Size <span class="opt">(optional)</span></span><span class="lw"><label class="sr" for="l-' + r[0] + '">Length in feet</label><input class="input" id="l-' + r[0] + '" data-l="' + r[0] + '" inputmode="decimal" placeholder="L" value="' + (s.l || '') + '"><span aria-hidden="true">×</span><label class="sr" for="w-' + r[0] + '">Width in feet</label><input class="input" id="w-' + r[0] + '" data-w="' + r[0] + '" inputmode="decimal" placeholder="W" value="' + (s.w || '') + '"><span class="xsmall muted">ft</span></span></div>' : '') +
          '<label class="sr" for="n-' + r[0] + '">Note for ' + nm + '</label><input class="input rc2-note" id="n-' + r[0] + '" data-note="' + r[0] + '" maxlength="140" placeholder="A note, if anything matters here" value="' + RI.esc(h.notes[r[0]] || '') + '"></div></details></section>';
    }
    /* The card's bottom strip: the size once it is in, else an invitation; and whether a note is there */
    function foot(k){
      var sec = main.querySelector('.rc2[data-room="' + k + '"]'); if(!sec) return;
      var s = h.sizes[k], r = roomOf(k), n = A.photoCount(h, k), est = s && s.src === 'photo' && !s.ok;
      /* An estimate still waiting for a yes shows in the strip above, so the footer does not repeat it */
      sec.querySelector('.rc3-sum').innerHTML = s && s.l && !est ? RI.icon('ruler','i-sm') + '<b>' + s.l + ' × ' + s.w + ' ft</b>' : RI.icon('chev','i-sm rc3-chev') + (est ? 'Edit the size or add a note' : (r && sizeable(r) ? 'Add size' : 'Add a note') + ' <span class="opt">(optional)</span>');
      sec.querySelector('.rc3-state').textContent = h.notes[k] ? 'Note added' : s && s.src === 'photo' && s.ok ? 'Confirmed' : n ? '' : 'No photos yet';
      drawSize(k);
    }
    /* ---------- Suggested room size (Sam's meeting, Nov 2026): once a room has photos, a size is measured from
       them and shown as an estimate with "Roughly right? Yes / Edit". A size you type is never overwritten,
       and a size you clear is not suggested again. The measuring itself is pretend (fakeai.js). ---------- */
    var measuring = {};
    function drawSize(k){
      var sec = main.querySelector('.rc2[data-room="' + k + '"]'), el = sec && sec.querySelector('.sz'); if(!el) return;
      var s = h.sizes[k], nm = RI.esc(nameOf(k)), html = '', cls = 'sz';
      if(measuring[k]){ cls += ' is-wait'; html = RI.icon('ruler','i-sm') + '<span>Measuring the ' + nm.toLowerCase() + ' from your photos…</span>'; }
      else if(s && s.src === 'photo' && !s.ok){
        html = '<span class="sz-v">' + RI.icon('ruler','i-sm') + '<span><span class="sz-top"><b>About ' + s.l + ' × ' + s.w + ' ft</b><span class="state state-sample">Sample</span></span><span class="sz-from">Measured from your photos</span></span></span>' +
          '<span class="sz-ask"><span class="sz-q">Roughly right?</span><button type="button" class="btn btn-secondary btn-sm" data-szok="' + k + '" aria-label="Yes, ' + nm + ' is about ' + s.l + ' by ' + s.w + ' feet">' + RI.icon('check','i-sm') + 'Yes</button><button type="button" class="btn btn-secondary btn-sm" data-szedit="' + k + '" aria-label="Edit the size of ' + nm + '">' + RI.icon('pencil','i-sm') + 'Edit</button></span>';
      }
      else if(!s && h.measured[k] === 'none' && A.photoCount(h, k)){ cls += ' is-none'; html = RI.icon('ruler','i-sm') + '<span>We could not size this room from the photos. Add a wider photo, or <button type="button" class="linkbtn" data-szedit="' + k + '">type the size</button>.</span>'; }
      el.className = cls; el.innerHTML = html; el.hidden = !html;
    }
    /* The card's own length and width boxes follow the saved size, so Edit opens them filled in */
    function setInputs(k){
      var sec = main.querySelector('.rc2[data-room="' + k + '"]'), s = h.sizes[k] || {}; if(!sec) return;
      var cl = sec.querySelector('[data-l]'), cw = sec.querySelector('[data-w]'); if(cl){ cl.value = s.l || ''; cw.value = s.w || ''; }
    }
    function maybeMeasure(k){
      var r = roomOf(k);
      if(!r || !sizeable(r) || h.sizes[k] || h.measured[k] || measuring[k] || !A.photoCount(h, k)) return;
      measuring[k] = true; drawSize(k);
      setTimeout(function(){
        delete measuring[k];
        if(!doc.body.contains(main)) return;              /* left the screen: measured next time */
        if(h.sizes[k] || !A.photoCount(h, k)){ drawSize(k); return; }
        var ps = (h.photos[k] || []).filter(function(p){ return p.state === 'done'; });
        var poor = ps.every(function(p){ return (p.flags || []).some(function(f){ return f === 'small' || f === 'blurry'; }); });
        var s = poor ? null : A.AI.sizeFor(h, k, r[2] || r[0]);
        h.measured[k] = s ? 'photo' : 'none';
        if(s) h.sizes[k] = {l:s.l, w:s.w, src:'photo', ok:false};
        saved(h); setInputs(k); foot(k); totals();
      }, A.AI.MEASURE_MS);
    }
    /* A room that loses all its photos also loses a size that only came from them */
    function dropEstimate(k){
      var s = h.sizes[k];
      if(A.photoCount(h, k)) return;
      if(s && s.src === 'photo' && !s.ok){ delete h.sizes[k]; setInputs(k); }
      if(h.measured[k] === 'photo' || h.measured[k] === 'none') delete h.measured[k];
    }
    var pending = {}, picked = {}; /* photos ticked in the tray, to put in a room together */
    function thumb(p, room){
      var cls = p.state === 'done' ? '' : p.state === 'fail' ? ' fail' : ' up';
      var flags = (p.flags || []).map(function(k){ return '<span class="th-flag' + (k === 'heic' ? ' info' : '') + '" title="' + (k === 'small' ? 'Under 800 px on the long side.' : k === 'blurry' ? 'This photo looks out of focus.' : k === 'near' ? 'Very similar to another photo of this house.' : 'HEIC photos are converted to JPG in the product.') + '">' + FLAG[k] + '</span>'; }).join('');
      return '<figure class="th' + cls + '" data-p="' + p.id + '"' + (p.state === 'done' ? ' draggable="true" data-drag="' + room + '|' + p.id + '"' : '') + '><img src="' + p.src + '" alt="' + RI.esc(p.name) + '">' + (flags ? '<span class="th-flags">' + flags + '</span>' : '') +
        (p.state === 'up' ? '<span class="th-bar"><i style="width:' + (p.pct || 0) + '%"></i></span>' : '') +
        (p.state === 'fail' ? '<span class="th-fail">' + RI.icon('warn','i-sm') + 'Did not upload<button type="button" data-retry="' + p.id + '" data-room="' + room + '">Retry</button></span>' : '') +
        '<button type="button" class="th-x" data-del="' + p.id + '" data-room="' + room + '" aria-label="Remove photo">' + RI.icon('x','i-sm') + '</button></figure>';
    }
    /* An unsorted photo: tap to select it; the suggested room chip (tap to accept) when there is one */
    function unsortedItem(p){
      if(p.state !== 'done') return '<li class="us-item">' + thumb(p, 'unsorted') + '</li>';
      var on = !!picked[p.id];
      return '<li class="us-item' + (on ? ' is-picked' : '') + '">' +
        '<div class="us-ph">' + thumb(p, 'unsorted') +
          '<button type="button" class="us-tick" data-pick="' + p.id + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Unselect' : 'Select') + ' this photo">' + RI.icon('check','i-sm') + '</button></div>' +
        (p.suggest ? '<button type="button" class="us-chip" data-accept="' + p.id + '" data-to="' + p.suggest + '" title="Put it in ' + RI.esc(nameOf(p.suggest)) + '">' + RI.icon('check','i-sm') + '<span>' + RI.esc(nameOf(p.suggest)) + '</span></button>' : '') + '</li>';
    }
    var bulkTo = '';
    function drawUnsorted(){
      var list = (h.photos.unsorted || []).concat(pending.unsorted || []), u = main.querySelector('#unsorted'), sug = list.filter(function(p){ return p.state === 'done' && p.suggest; }).length;
      Object.keys(picked).forEach(function(id){ if(!list.some(function(p){ return p.id === id; })) delete picked[id]; });
      var ids = Object.keys(picked), n = ids.length, done = list.filter(function(p){ return p.state === 'done'; }).length;
      /* The room picker starts on the room the picked photos have in common, or the last room used */
      var common = ids.map(function(id){ return (list.filter(function(p){ return p.id === id; })[0] || {}).suggest || ''; }).reduce(function(a, b){ return a === null ? b : a === b ? a : ''; }, null) || '';
      var to = bulkTo || common;
      u.innerHTML = list.length ? '<header><h2>Not sorted yet <span class="n">' + list.length + '</span></h2>' +
          '<span class="us-hacts">' + (sug > 1 ? '<button type="button" class="linkbtn small" id="accept-all">Accept suggestions</button>' : '') + (done > 1 && n < done ? '<button type="button" class="linkbtn small" id="pick-all">Select all</button>' : '') + '</span></header>' +
        '<p class="us-help">' + RI.icon('info','i-sm') + '<span>Tap photos, then pick the room once. Or drag a photo onto a room.</span></p>' +
        '<ul class="us-list">' + list.map(unsortedItem).join('') + '</ul>' +
        (n ? '<div class="us-bulk" role="region" aria-label="Put selected photos in a room"><div class="us-bulk-h"><b>' + n + ' selected</b><button type="button" class="linkbtn small" id="pick-clear">Clear</button></div>' +
          '<div class="us-bulk-r"><label class="us-sel-w"><span class="sr">Room for the selected photos</span><select class="us-sel" id="bulk-to"><option value="">Choose a room</option>' +
            rooms.map(function(r){ return '<option value="' + r[0] + '"' + (r[0] === to ? ' selected' : '') + '>' + RI.esc(r[1]) + '</option>'; }).join('') + '</select></label>' +
          '<button type="button" class="btn btn-primary btn-sm" id="bulk-go">' + RI.icon('arrow','i-sm') + 'Move ' + (n === 1 ? 'it' : 'them') + '</button></div></div>' : '')
        : '<p class="xsmall muted rp2-empty">' + (A.photoCount(h) ? RI.icon('check','i-sm') + 'Every photo is in a room.' : 'Photos you add land here first.') + '</p>';
      RI.fillIcons(u);
      /* While photos wait to be sorted, the upload area shrinks so they stay in view */
      main.querySelector('.up3').classList.toggle('busy', list.length > 0);
      /* Below desktop the page scrolls, so the Move bar sticks just above the submit dock */
      var dk = doc.querySelector('.wb-dock'); if(dk){ var top = dk.getBoundingClientRect().top; if(top > 0 && top < innerHeight) u.style.setProperty('--dock', Math.round(innerHeight - top + 8) + 'px'); }
    }
    /* A room card: the cover photo with the count, or a drop area when it has none */
    function drawRoom(key){
      if(key === 'unsorted'){ drawUnsorted(); return; }
      var sec = main.querySelector('.rc2[data-room="' + key + '"]'); if(!sec) return;
      var done = h.photos[key] || [], pd = pending[key] || [], n = done.length, nm = RI.esc(nameOf(key));
      var up = pd.filter(function(p){ return p.state === 'up'; }), fl = pd.filter(function(p){ return p.state === 'fail'; });
      var m = sec.querySelector('.rc3-media'), cv = coverOf(key) || up[0];
      if(cv){
        var rest = done.filter(function(p){ return p !== cv; }), more = rest.length - 2;
        m.innerHTML = '<button type="button" class="rc3-cover" data-edit="' + key + '" tabindex="-1" aria-hidden="true"><img src="' + cv.src + '" alt=""></button>' +
          (n ? '<span class="rc3-ready">' + RI.icon('check','i-sm') + 'Ready</span><span class="rc3-cnt">' + RI.icon('camera','i-sm') + n + ' photo' + (n === 1 ? '' : 's') + '</span>' : '') +
          '<button type="button" class="rc3-edit" data-edit="' + key + '">' + RI.icon('pencil','i-sm') + 'Edit<span class="sr"> ' + nm + ' photos</span></button>' +
          (rest.length ? '<span class="rc3-mini" aria-hidden="true">' + rest.slice(0, 2).map(function(p){ return '<span><img src="' + p.src + '" alt=""></span>'; }).join('') + (more > 0 ? '<span class="more">+' + more + '</span>' : '') + '</span>' : '') +
          (up.length ? '<span class="rc3-up" data-p="' + up[0].id + '"><span>Uploading ' + up.length + ' photo' + (up.length === 1 ? '' : 's') + '</span><span class="th-bar"><i style="width:' + (up[0].pct || 0) + '%"></i></span></span>' : '');
      } else {
        m.innerHTML = '<div class="rc3-empty"><input type="file" accept="' + ACCEPT + '" multiple data-room="' + key + '" tabindex="-1" aria-hidden="true">' +
          '<span class="rc3-e-ic">' + RI.icon('camera') + '</span><span class="rc3-e-t"><b>Add photos</b><span>Drop here or tap to browse</span></span>' +
          '<span class="rc3-e-btns"><label class="rc3-chip">' + RI.icon('upload','i-sm') + 'Upload<input type="file" accept="' + ACCEPT + '" multiple data-room="' + key + '" aria-label="Upload photos of ' + nm + '"></label>' +
            '<label class="rc3-chip">' + RI.icon('camera','i-sm') + 'Camera<input type="file" accept="image/*" capture="environment" data-room="' + key + '" aria-label="Take a photo of ' + nm + '"></label></span></div>';
      }
      if(fl.length) m.insertAdjacentHTML('beforeend', '<span class="rc3-fail">' + RI.icon('warn','i-sm') + '<span>' + fl.length + ' did not upload</span><button type="button" data-retryall="' + key + '">Retry</button><button type="button" data-dropfail="' + key + '">Remove</button></span>');
      sec.classList.toggle('has', !!(n || up.length));
      foot(key);
      if(editing && editing.key === key) drawEd();
    }
    function total(){ var n = 0; Object.keys(h.photos).forEach(function(k){ n += (h.photos[k] || []).length; }); Object.keys(pending).forEach(function(k){ n += pending[k].filter(function(p){ return p.state === 'up'; }).length; }); return n; }
    /* The submit bar counts, live */
    function counts(){
      var rs = rooms.filter(function(r){ return r[0] !== 'other' || A.photoCount(h, 'other'); });
      var withP = rs.filter(function(r){ return A.photoCount(h, r[0]); }).length, sz = Object.keys(h.sizes).filter(function(k){ return h.sizes[k] && h.sizes[k].l; }).length;
      var est = Object.keys(h.sizes).filter(function(k){ return h.sizes[k] && h.sizes[k].src === 'photo' && !h.sizes[k].ok; }).length;
      return {rooms:rs.length, withP:withP, sizes:sz, est:est, unver:rs.length - withP, unsorted:(h.photos.unsorted || []).length};
    }
    function totals(){
      var c = counts();
      var inRooms = A.photoCount(h), added = inRooms + c.unsorted;
      main.querySelector('#ph-total').innerHTML = added ? '<span class="up3-ok"><span class="c">' + RI.icon('check') + '</span>' + added + ' photo' + (added === 1 ? '' : 's') + ' added · ' + (c.unsorted ? inRooms + ' in rooms' : 'all in rooms') + '</span>' : '';
      var rs = rooms.filter(function(r){ return r[0] !== 'other' || A.photoCount(h, 'other'); });
      main.querySelector('#rp3-prog').innerHTML = '<p><b>' + c.withP + ' of ' + c.rooms + ' rooms</b> have photos</p><span class="rp3-seg" aria-hidden="true">' + rs.map(function(r, i){ return '<i' + (i < c.withP ? ' class="on"' : '') + '></i>'; }).join('') + '</span>';
      var fl = {small:0, blurry:0, near:0}; Object.keys(h.photos).forEach(function(k){ (h.photos[k] || []).forEach(function(p){ (p.flags || []).forEach(function(x){ if(fl[x] != null) fl[x]++; }); }); });
      var parts = []; if(fl.blurry) parts.push(fl.blurry + ' may be blurry'); if(fl.small) parts.push(fl.small + ' too small'); if(fl.near) parts.push(fl.near + ' look' + (fl.near > 1 ? '' : 's') + ' like another photo');
      main.querySelector('#flags-sum').innerHTML = parts.length ? '<p class="rp2-flags">' + RI.icon('eye','i-sm') + '<span><b>' + parts.join(', ') + '.</b> They are kept. ' + (fl.near && !fl.blurry && !fl.small ? 'You can remove extras.' : 'A sharper photo helps.') + '</span></p>' : '';
      RI.fillIcons(main.querySelector('#flags-sum'));
      var bar = doc.getElementById('sub-sum');
      if(bar) bar.innerHTML = '<span class="sb-short"><b>' + c.withP + '/' + c.rooms + '</b> rooms with photos</span><span class="sb-long"><b>' + c.withP + ' of ' + c.rooms + '</b> rooms have photos<span class="sb-dot">·</span>' + c.sizes + ' size' + (c.sizes === 1 ? '' : 's') + (c.est ? ', ' + c.est + ' to confirm' : '') + (c.unver ? '<span class="sb-dot">·</span><span class="sb-un">' + c.unver + ' will show as unverified</span>' : '') + '</span>';
      metaRefresh(h);
    }
    function all(){ drawUnsorted(); rooms.forEach(function(r){ drawRoom(r[0]); }); totals(); dots(); }
    function upload(p, key){
      p.state = 'up'; p.pct = 0; (pending[key] = pending[key] || []).push(p);
      var fail = !p.retried && Math.random() < .09, dur = 700 + Math.random() * 900, t0 = performance.now();
      drawRoom(key);
      (function tick(now){
        var k = Math.min(1, (now - t0) / dur); p.pct = Math.round(k * (fail ? 62 : 100));
        doc.querySelectorAll('[data-p="' + p.id + '"] .th-bar i').forEach(function(bar){ bar.style.width = p.pct + '%'; });
        if(k < 1){ requestAnimationFrame(tick); return; }
        pending[key] = (pending[key] || []).filter(function(x){ return x !== p; });
        if(p.drop){ drawRoom(key); totals(); return; }
        if(fail){ p.state = 'fail'; (pending[key] = pending[key] || []).push(p); }
        else { p.state = 'done'; delete p.pct; (h.photos[key] = h.photos[key] || []).push(p); if(p.fp) h.fps.push(p.fp); saved(h); }
        drawRoom(key); totals(); if(p.state === 'done' && key !== 'unsorted') maybeMeasure(key);
      })(t0);
    }
    function existingHashes(){ var out = []; Object.keys(h.photos).forEach(function(k){ (h.photos[k] || []).forEach(function(p){ if(p.hash) out.push(p.hash); }); }); Object.keys(pending).forEach(function(k){ pending[k].forEach(function(p){ if(p.hash) out.push(p.hash); }); }); return out; }
    /* Consent once: the photo rights tick appears as a small sheet on the first upload, never on every room */
    function rightsSheet(then){
      var d = A.dialog('Before your first photo', '<label class="rights on-sheet"><input type="checkbox" id="rs-cb"><span><b>' + RIGHTS.text + '</b><span class="small muted">Photos stay private and are used only for your estimate. Location data is removed from every copy we show or share.</span></span></label><span class="err" id="rs-err"></span>' +
        '<div class="cta-row" style="justify-content:flex-end;margin-top:12px"><button type="button" class="btn btn-secondary" data-dlg-close>Cancel</button><button type="button" class="btn btn-primary" id="rs-ok">Add my photos</button></div>');
      d.querySelector('#rs-ok').addEventListener('click', function(){
        if(!d.querySelector('#rs-cb').checked){ d.querySelector('#rs-err').textContent = 'Tick the box to add photos.'; return; }
        h.rights = true; h.consents.rights = {at:Date.now(), version:RIGHTS.version, text:RIGHTS.text}; saved(h); d.close(); then();
      });
    }
    function addFiles(files, key){
      files = [].slice.call(files); if(!files.length) return;
      if(!h.rights){ rightsSheet(function(){ addFiles(files, key); }); return; }
      files.forEach(function(file){
        var isHeic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
        var typeOk = /^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type) || TYPES_OK.test(file.name);
        if(!typeOk || /svg/i.test(file.type)){ RI.toast(file.name + ' was not added. We accept JPG, PNG, WebP and HEIC photos.', 'warn'); return; }
        if(file.size > MAX_MB * 1048576){ RI.toast(file.name + ' is over ' + MAX_MB + ' MB. Use a smaller copy.', 'warn'); return; }
        if(total() >= MAX_PHOTOS){ RI.toast('A house can have up to ' + MAX_PHOTOS + ' photos.', 'warn'); return; }
        var fp = file.name + '|' + file.size + '|' + file.lastModified;
        if(h.fps.indexOf(fp) > -1 || Object.keys(pending).some(function(k){ return pending[k].some(function(p){ return p.fp === fp; }); })){ RI.toast(file.name + ' is already added.', 'info'); return; }
        var sug = key === 'unsorted' ? suggestFor(file.name, rooms) : '';
        if(isHeic){ upload({id:A.uid('p'), name:file.name, src:heicThumb(file.name), fp:fp, flags:['heic'], suggest:sug}, key); return; }
        A.shrink(file).then(function(r){
          var flags = [];
          if(Math.max(r.w, r.h) < 800) flags.push('small');
          if(r.sharp < 18) flags.push('blurry');
          if(existingHashes().some(function(x){ return hamming(x, r.hash) <= 6; })) flags.push('near');
          upload({id:A.uid('p'), name:file.name, src:r.src, fp:fp, hash:r.hash, flags:flags, px:r.w + ' by ' + r.h, suggest:sug}, key);
        }, function(){ RI.toast(file.name + ' could not be opened as an image, so it was not added.', 'warn'); });
      });
    }
    function move(from, id, to){
      var p = (h.photos[from] || []).filter(function(x){ return x.id === id; })[0]; if(!p || from === to) return;
      h.photos[from] = h.photos[from].filter(function(x){ return x.id !== id; }); delete p.suggest; (h.photos[to] = h.photos[to] || []).push(p);
      if(h.covers && h.covers[from] === id) delete h.covers[from];
      dropEstimate(from); saved(h); drawRoom(from); drawRoom(to); totals(); maybeMeasure(to);
    }
    function delPhoto(k, id){
      var gone = (h.photos[k] || []).filter(function(x){ return x.id === id; })[0]; if(gone && gone.fp) h.fps = h.fps.filter(function(f){ return f !== gone.fp; });
      (pending[k] || []).forEach(function(x){ if(x.id === id) x.drop = true; });
      h.photos[k] = (h.photos[k] || []).filter(function(x){ return x.id !== id; }); pending[k] = (pending[k] || []).filter(function(x){ return x.id !== id; });
      if(h.covers && h.covers[k] === id) delete h.covers[k];
      dropEstimate(k); saved(h); drawRoom(k); totals();
    }
    function retry(k, id){ var p = (pending[k] || []).filter(function(x){ return x.id === id; })[0]; if(p){ pending[k] = pending[k].filter(function(x){ return x !== p; }); p.retried = true; upload(p, k); } }
    /* ---------- The edit sheet for one room: add, remove, move, pick the cover, size and note.
       Remove, move, cover, size and note wait for Save changes; Cancel also takes back photos added in the sheet. */
    var editing = null;
    function editRoom(key){
      var r = roomOf(key); if(!r) return;
      var before = {}; (h.photos[key] || []).concat(pending[key] || []).forEach(function(p){ before[p.id] = true; });
      var s = h.sizes[key] || {}, nm = RI.esc(r[1]);
      var ed = editing = {key:key, rm:{}, mv:{}, cover:(coverOf(key) || {}).id || null, before:before, saved:false};
      var d = A.dialog(nm + ' photos',
        '<div id="ed-grid"></div>' +
        '<p class="ed-note" id="ed-note" aria-live="polite"></p>' +
        '<div class="ed-up"><label class="ed-up-b">' + RI.icon('upload','i-lg') + '<span><b>Upload photos</b><span>JPG, PNG, WebP or HEIC</span></span><input type="file" accept="' + ACCEPT + '" multiple data-edroom="' + key + '"></label>' +
          '<label class="ed-up-b">' + RI.icon('camera','i-lg') + '<span><b>Take a photo</b><span>Use your camera</span></span><input type="file" accept="image/*" capture="environment" data-edroom="' + key + '"></label></div>' +
        '<details class="ed-det"' + (s.l || h.notes[key] ? ' open' : '') + '><summary>' + RI.icon('chev','i-sm') + nm + ' details <span class="opt">(optional)</span></summary><div class="ed-det-g">' +
          (sizeable(r) ? '<div><span class="ed-lbl">Size</span><span class="lw ed-lw"><label class="sr" for="ed-l">Length in feet</label><input class="input" id="ed-l" inputmode="decimal" placeholder="Length" value="' + (s.l || '') + '"><span aria-hidden="true">×</span><label class="sr" for="ed-w">Width in feet</label><input class="input" id="ed-w" inputmode="decimal" placeholder="Width" value="' + (s.w || '') + '"><span class="xsmall muted">ft</span></span><span class="err" id="ed-err"></span></div>' : '') +
          '<div class="ed-n"><label class="ed-lbl" for="ed-t">Note</label><textarea class="input" id="ed-t" maxlength="140" rows="2" placeholder="A note, if anything matters here">' + RI.esc(h.notes[key] || '') + '</textarea></div></div></details>' +
        '<div class="ed-foot"><button type="button" class="btn btn-secondary" data-dlg-close>Cancel</button><button type="button" class="btn btn-primary" id="ed-save">' + RI.icon('check') + 'Save changes</button></div>',
        {wide:true, onClose:function(){ if(!ed.saved) edRevert(ed); if(editing === ed) editing = null; }});
      d.classList.add('ed-dlg');
      d.querySelector('.dlg-head').innerHTML = '<span class="ed-ic">' + RI.icon(iconFor(r)) + '</span><div class="ed-ht"><h2>' + nm + ' photos</h2><p class="small muted">Add, remove or move photos. Tap a photo to make it the cover.</p></div>' +
        '<span class="ed-cnt" id="ed-cnt"></span><button class="icon-btn" type="button" data-dlg-close aria-label="Close">' + RI.icon('x') + '</button>';
      d.appendChild(d.querySelector('.ed-foot'));
      ed.d = d;
      d.addEventListener('change', function(e){
        var t = e.target;
        if(t.matches('[data-edroom]')){ addFiles(t.files, key); t.value = ''; return; }
        if(t.matches('[data-edmove]') && t.value){ ed.mv[t.getAttribute('data-edmove')] = t.value; drawEd(); }
      });
      d.addEventListener('click', function(e){
        var c = e.target.closest('[data-cover]'); if(c){ ed.cover = c.getAttribute('data-cover'); drawEd(); return; }
        var rm = e.target.closest('[data-edrm]'); if(rm){ ed.rm[rm.getAttribute('data-edrm')] = true; drawEd(); return; }
        if(e.target.closest('#ed-undo')){ ed.rm = {}; ed.mv = {}; drawEd(); return; }
        var dl = e.target.closest('[data-del]'); if(dl){ delPhoto(key, dl.getAttribute('data-del')); return; }
        var rt = e.target.closest('[data-retry]'); if(rt){ retry(key, rt.getAttribute('data-retry')); return; }
        if(e.target.closest('#ed-save')) edSave(ed);
      });
      d.addEventListener('dragover', function(e){ e.preventDefault(); d.classList.add('over'); });
      d.addEventListener('dragleave', function(e){ if(!d.contains(e.relatedTarget)) d.classList.remove('over'); });
      d.addEventListener('drop', function(e){ e.preventDefault(); d.classList.remove('over'); if(e.dataTransfer.files.length) addFiles(e.dataTransfer.files, key); });
      drawEd();
    }
    function drawEd(){
      var ed = editing; if(!ed || !ed.d) return;
      var key = ed.key, d = ed.d;
      var done = (h.photos[key] || []).filter(function(p){ return !ed.rm[p.id] && !ed.mv[p.id]; }), pd = pending[key] || [];
      var cv = done.filter(function(p){ return p.id === ed.cover; })[0] || done[0];
      var order = cv ? [cv].concat(done.filter(function(p){ return p !== cv; })) : done;
      function tile(p){
        var isC = p === cv, flags = isC ? '' : (p.flags || []).map(function(k){ return '<span class="th-flag' + (k === 'heic' ? ' info' : '') + '">' + FLAG[k] + '</span>'; }).join('');
        return '<li class="ed-ph' + (isC ? ' is-cover' : '') + '"><button type="button" class="ed-pick" data-cover="' + p.id + '" aria-label="' + (isC ? 'The cover photo' : 'Make this the cover photo') + '"><img src="' + p.src + '" alt="' + RI.esc(p.name) + '"></button>' +
          (isC ? '<span class="ed-tag">Cover</span>' : flags ? '<span class="th-flags">' + flags + '</span>' : '') +
          '<span class="ed-acts"><label class="ed-mv">' + RI.icon('arrow','i-sm') + 'Move<select data-edmove="' + p.id + '" aria-label="Move this photo to another room"><option value="">Move to</option>' +
            rooms.filter(function(r){ return r[0] !== key; }).map(function(r){ return '<option value="' + r[0] + '">' + RI.esc(r[1]) + '</option>'; }).join('') + '<option value="unsorted">Back to not sorted</option></select></label>' +
          '<button type="button" class="ed-del" data-edrm="' + p.id + '" aria-label="Remove this photo">' + RI.icon('trash','i-sm') + '</button></span></li>';
      }
      d.querySelector('#ed-grid').innerHTML = '<ul class="ed-list">' + order.map(tile).join('') + pd.map(function(p){ return '<li class="ed-ph">' + thumb(p, key) + '</li>'; }).join('') +
        '<li class="ed-add"><label>' + RI.icon('upload','i-lg') + '<b>Add more</b><span>or drag here</span><input type="file" accept="' + ACCEPT + '" multiple data-edroom="' + key + '" aria-label="Add more photos"></label></li></ul>';
      var parts = [], rmN = Object.keys(ed.rm).length, mvTo = {};
      Object.keys(ed.mv).forEach(function(id){ var t = ed.mv[id]; mvTo[t] = (mvTo[t] || 0) + 1; });
      if(rmN) parts.push(rmN + ' removed');
      Object.keys(mvTo).forEach(function(t){ parts.push(mvTo[t] + ' moved to ' + (t === 'unsorted' ? 'Not sorted yet' : RI.esc(nameOf(t)))); });
      d.querySelector('#ed-note').innerHTML = parts.length ? RI.icon('info','i-sm') + '<span>When you save: ' + parts.join(', ') + '.</span><button type="button" class="linkbtn" id="ed-undo">Undo</button>' : '';
      d.querySelector('#ed-cnt').innerHTML = RI.icon('image','i-sm') + done.length + ' photo' + (done.length === 1 ? '' : 's');
    }
    function edSave(ed){
      var key = ed.key, d = ed.d, r = roomOf(key);
      var li = d.querySelector('#ed-l'), wi = d.querySelector('#ed-w');
      if(li && sizeable(r)){
        var l = parseFloat(li.value), w = parseFloat(wi.value), any = li.value.trim() || wi.value.trim();
        if(any && !(l > 2 && l < 80 && w > 2 && w < 80)){ d.querySelector('#ed-err').textContent = 'Use feet, from 3 to 79, for both.'; d.querySelector('.ed-det').open = true; li.focus(); return; }
        var prev = h.sizes[key], same = prev && prev.src === 'photo' && prev.l === l && prev.w === w;
        if(any && !same){ h.sizes[key] = {l:l, w:w, src:'user', ok:true}; h.measured[key] = 'user'; } else if(!any && prev){ delete h.sizes[key]; h.measured[key] = 'cleared'; }
      }
      var note = d.querySelector('#ed-t').value.trim(); if(note) h.notes[key] = note; else delete h.notes[key];
      ed.saved = true; editing = null;
      Object.keys(ed.rm).forEach(function(id){ delPhoto(key, id); });
      Object.keys(ed.mv).forEach(function(id){ move(key, id, ed.mv[id]); });
      if(ed.cover && (h.photos[key] || []).some(function(p){ return p.id === ed.cover; })){ h.covers = h.covers || {}; h.covers[key] = ed.cover; }
      /* the card's own size and note fields follow */
      var sec = main.querySelector('.rc2[data-room="' + key + '"]'), sz = h.sizes[key] || {};
      if(sec){ var cl = sec.querySelector('[data-l]'), cw = sec.querySelector('[data-w]'), cn = sec.querySelector('[data-note]'); if(cl){ cl.value = sz.l || ''; cw.value = sz.w || ''; } if(cn) cn.value = h.notes[key] || ''; }
      saved(h); drawRoom(key); totals(); d.close(); RI.toast(nameOf(key) + ' saved.', 'check');
    }
    function edRevert(ed){
      var key = ed.key, n = 0;
      (h.photos[key] || []).concat(pending[key] || []).slice().forEach(function(p){ if(!ed.before[p.id]){ delPhoto(key, p.id); n++; } });
      if(n) RI.toast('Not saved. ' + (n === 1 ? 'The photo you just added was' : 'The ' + n + ' photos you just added were') + ' taken out.', 'info');
    }
    var deb;
    main.addEventListener('input', function(e){
      var t = e.target, k;
      if((k = t.getAttribute('data-l') || t.getAttribute('data-w'))){
        var l = parseFloat(main.querySelector('[data-l="' + k + '"]').value), w = parseFloat(main.querySelector('[data-w="' + k + '"]').value);
        if(l > 2 && l < 80 && w > 2 && w < 80){ h.sizes[k] = {l:l, w:w, src:'user', ok:true}; h.measured[k] = 'user'; } else { delete h.sizes[k]; h.measured[k] = 'cleared'; }
      }
      if(k) foot(k);
      if((k = t.getAttribute('data-note'))){ if(t.value.trim()) h.notes[k] = t.value.trim(); else delete h.notes[k]; foot(k); }
      totals(); clearTimeout(deb); deb = setTimeout(function(){ saved(h); }, 400);
    });
    main.addEventListener('change', function(e){
      var t = e.target;
      if(t.id === 'plans'){ addPlans(t.files); t.value = ''; return; }
      if(t.type === 'file' && t.getAttribute('data-room')){ addFiles(t.files, t.getAttribute('data-room')); t.value = ''; return; }
      if(t.id === 'bulk-to') bulkTo = t.value;
    });
    main.addEventListener('click', function(e){
      var tk = e.target.closest('[data-pick]');
      if(!tk){ var ph = e.target.closest('.us-ph'); if(ph && !e.target.closest('.th-x,[data-retry]')) tk = ph.querySelector('[data-pick]'); }
      if(tk){ var pid = tk.getAttribute('data-pick'); if(picked[pid]) delete picked[pid]; else picked[pid] = true; drawUnsorted(); return; }
      if(e.target.closest('#pick-all')){ var all = (h.photos.unsorted || []).filter(function(p){ return p.state === 'done'; }); if(Object.keys(picked).length === all.length) picked = {}; else all.forEach(function(p){ picked[p.id] = true; }); drawUnsorted(); return; }
      if(e.target.closest('#pick-clear')){ picked = {}; drawUnsorted(); return; }
      if(e.target.closest('#bulk-go')){
        var sel = main.querySelector('#bulk-to'), to = sel && sel.value, ids = Object.keys(picked);
        if(!to){ RI.toast('Choose a room first.', 'info'); if(sel) sel.focus(); return; }
        picked = {}; bulkTo = to; ids.forEach(function(id){ move('unsorted', id, to); }); RI.toast(ids.length + ' photo' + (ids.length === 1 ? '' : 's') + ' moved to ' + nameOf(to) + '.'); return;
      }
      var ed = e.target.closest('[data-edit]'); if(ed){ editRoom(ed.getAttribute('data-edit')); return; }
      var ra = e.target.closest('[data-retryall]'); if(ra){ var rk = ra.getAttribute('data-retryall'); (pending[rk] || []).filter(function(x){ return x.state === 'fail'; }).forEach(function(x){ retry(rk, x.id); }); return; }
      var df = e.target.closest('[data-dropfail]'); if(df){ var dk = df.getAttribute('data-dropfail'); (pending[dk] || []).filter(function(x){ return x.state === 'fail'; }).forEach(function(x){ delPhoto(dk, x.id); }); return; }
      var del = e.target.closest('[data-del]'), re = e.target.closest('[data-retry]'), acc = e.target.closest('[data-accept]');
      if(acc){ move('unsorted', acc.getAttribute('data-accept'), acc.getAttribute('data-to')); return; }
      if(e.target.closest('#accept-all')){ (h.photos.unsorted || []).slice().forEach(function(p){ if(p.suggest) move('unsorted', p.id, p.suggest); }); RI.toast('Suggestions accepted.'); return; }
      if(del) delPhoto(del.getAttribute('data-room'), del.getAttribute('data-del'));
      if(re) retry(re.getAttribute('data-room'), re.getAttribute('data-retry'));
      var szok = e.target.closest('[data-szok]'); if(szok){ var sk = szok.getAttribute('data-szok'); if(h.sizes[sk]){ h.sizes[sk].ok = true; saved(h); foot(sk); totals(); var sm = main.querySelector('.rc2[data-room="' + sk + '"] .rc3-foot>summary'); if(sm) sm.focus(); RI.toast(nameOf(sk) + ': ' + h.sizes[sk].l + ' × ' + h.sizes[sk].w + ' ft confirmed.', 'check'); } return; }
      var sze = e.target.closest('[data-szedit]'); if(sze){ var ek = sze.getAttribute('data-szedit'), esec = main.querySelector('.rc2[data-room="' + ek + '"]'); setInputs(ek); esec.querySelector('.rc3-foot').open = true; var li = esec.querySelector('[data-l]'); if(li){ li.focus(); li.select(); } return; }
      if(e.target.closest('#sample')){
        /* Team only: sample photos land in the tray with their suggested room, to show the sorting */
        if(!h.rights){ h.rights = true; h.consents.rights = {at:Date.now(), version:RIGHTS.version, text:RIGHTS.text}; }
        var added = 0;
        rooms.forEach(function(r){ var sp = SAMPLE_PHOTOS[r[2] || r[0]]; if(A.photoCount(h, r[0]) || !sp || !sp.length) return; sp.forEach(function(s){ upload({id:A.uid('p'), name:s.split('/').pop(), src:RI.img(s), retried:true, suggest:r[0]}, 'unsorted'); added++; }); });
        RI.toast(added ? 'Sample photos added to the tray, each with a suggested room.' : 'Every room already has photos.');
      }
      if(e.target.closest('#add-room')) roomPicker();
      var vp = e.target.closest('[data-viewplan]'); if(vp) viewPlan(+vp.getAttribute('data-viewplan'));
      var rp = e.target.closest('[data-rmplan]'); if(rp){ h.plans.splice(+rp.getAttribute('data-rmplan'), 1); saved(h); plans(); }
      var dr = e.target.closest('[data-delroom]'); if(dr){ var key = dr.getAttribute('data-delroom'), n = A.photoCount(h, key);
        var go = function(){ h.extraRooms = (h.extraRooms || []).filter(function(x){ return x.key !== key; }); delete h.photos[key]; delete h.sizes[key]; delete h.notes[key]; saved(h); A.render(); };
        if(n) A.confirm('Remove this room?', 'Its ' + n + ' photo' + (n > 1 ? 's are' : ' is') + ' removed too.', 'Remove room', go, true); else go(); }
      if(e.target.closest('#rc2-next')){ var g = main.querySelector('#rc2-grid'); g.scrollTo({left:step() * (Math.round(g.scrollLeft / step()) + 1), behavior:A.reduce ? 'auto' : 'smooth'}); }
      var dt = e.target.closest('[data-dot]'); if(dt){ var g2 = main.querySelector('#rc2-grid'); g2.scrollTo({left:step() * +dt.getAttribute('data-dot'), behavior:A.reduce ? 'auto' : 'smooth'}); }
    });
    /* Drag and drop: files from the computer onto the tray or a room; sorted photos from the tray onto a room */
    main.addEventListener('dragstart', function(e){ var th = e.target.closest('[data-drag]'); if(th){ e.dataTransfer.setData('text/plain', 'ri:' + th.getAttribute('data-drag')); e.dataTransfer.effectAllowed = 'move'; } });
    function dropTarget(e){ return e.target.closest('.rc2, .rp2-tray'); }
    main.addEventListener('dragover', function(e){ var d = dropTarget(e); if(d){ e.preventDefault(); d.classList.add('over'); } });
    main.addEventListener('dragleave', function(e){ var d = dropTarget(e); if(d && !d.contains(e.relatedTarget)) d.classList.remove('over'); });
    main.addEventListener('drop', function(e){
      var d = dropTarget(e); if(!d) return; e.preventDefault(); d.classList.remove('over');
      var to = d.classList.contains('rc2') ? d.getAttribute('data-room') : 'unsorted';
      var txt = e.dataTransfer.getData('text/plain');
      if(txt && txt.indexOf('ri:') === 0){ var x = txt.slice(3).split('|'); move(x[0], x[1], to); return; }
      addFiles(e.dataTransfer.files, to);
    });
    /* Phones: one room card at a time, with dots and Next room; the open card is remembered */
    function dots(){
      var host = main.querySelector('#rc2-dots'), at = h.cardAt || 0;
      host.innerHTML = rooms.map(function(r, i){ return '<button type="button" data-dot="' + i + '" class="' + (i === at ? 'on' : '') + (A.photoCount(h, r[0]) ? ' has' : '') + '" aria-label="' + RI.esc(r[1]) + '"></button>'; }).join('');
    }
    var grid = main.querySelector('#rc2-grid'), sdeb;
    /* One card's width plus the gap, so the carousel lands on a card's edge */
    function step(){ var c = grid.children; return c.length > 1 ? (c[1].offsetLeft - c[0].offsetLeft) || grid.clientWidth : grid.clientWidth; }
    grid.addEventListener('scroll', function(){ clearTimeout(sdeb); sdeb = setTimeout(function(){ if(!grid.clientWidth) return; var i = Math.round(grid.scrollLeft / step()); if(i !== h.cardAt){ h.cardAt = i; A.put(h); dots(); } }, 120); }, {passive:true});
    function roomPicker(){
      var cnt = {}; (h.extraRooms || []).forEach(function(x){ cnt[x.type] = (cnt[x.type] || 0) + 1; });
      function grp(title, arr){ return '<div class="rp-g"><h3>' + title + '</h3><div class="rp-chips">' + arr.map(function(t){ return '<button type="button" data-rt="' + t[0] + '" data-rn="' + RI.esc(t[1]) + '">' + t[1] + (cnt[t[0]] ? ' <span class="n">' + cnt[t[0]] + '</span>' : '') + '</button>'; }).join('') + '</div></div>'; }
      var d = A.dialog('Add a room', grp('Inside', RI.ROOM_TYPES.inside) + grp('Outside', RI.ROOM_TYPES.outside), {wide:true});
      d.addEventListener('click', function(e){
        var b2 = e.target.closest('[data-rt]'); if(!b2) return;
        var type = b2.getAttribute('data-rt'), name = b2.getAttribute('data-rn'), n = (cnt[type] || 0) + 1;
        h.extraRooms = (h.extraRooms || []).concat([{key:'x-' + type + '-' + A.uid(''), type:type, name:name + (n > 1 ? ' ' + n : '')}]);
        saved(h); d.close(); RI.toast(name + ' added.'); A.render();
      });
    }
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
      A.dialog(RI.esc(p.name), p.src ? (p.kind === 'pdf' ? '<object class="plan-view" data="' + p.src + '" type="application/pdf"><p><a href="' + p.src + '" download="' + RI.esc(p.name) + '">Download it</a>.</p></object>' : '<img class="plan-view" src="' + p.src + '" alt="Floor plan">') : '<p class="muted">In the product this file is stored privately and opens here.</p>', {wide:true});
    }
    function plans(){ main.querySelector('#plan-files').innerHTML = (h.plans || []).map(function(p, i){ return '<li>' + RI.icon('file','i-sm') + '<span>' + RI.esc(p.name) + '</span><span class="xsmall muted">' + (p.kind === 'pdf' ? 'PDF' : 'Image') + ', ' + p.kb + ' KB</span><button type="button" class="linkbtn" data-viewplan="' + i + '">View</button><button type="button" class="linkbtn" data-rmplan="' + i + '">Remove</button></li>'; }).join(''); RI.fillIcons(main.querySelector('#plan-files')); }
    plans(); all(); rooms.forEach(function(r){ maybeMeasure(r[0]); });
    /* Desktop: the photo card ends just above the submit dock, wherever the page is scrolled */
    var trayEl = main.querySelector('.rp2-tray'), fitQ = false;
    function fitTray(){
      fitQ = false;
      if(!trayEl.isConnected){ removeEventListener('scroll', qFit); removeEventListener('resize', qFit); return; }
      if(getComputedStyle(trayEl).position !== 'sticky'){ trayEl.style.maxHeight = ''; return; }
      var dk = doc.querySelector('.wb-dock'), bottom = dk ? dk.getBoundingClientRect().top - 12 : innerHeight - 16;
      trayEl.style.maxHeight = Math.max(320, Math.round(bottom - trayEl.getBoundingClientRect().top)) + 'px';
    }
    function qFit(){ if(!fitQ){ fitQ = true; requestAnimationFrame(fitTray); } }
    addEventListener('scroll', qFit, {passive:true}); addEventListener('resize', qFit); qFit();
    if(h.cardAt) requestAnimationFrame(function(){ grid.scrollLeft = step() * h.cardAt; });
    /* Submit is always allowed. What is missing shows on the room card and, after the run, as unverified */
    function disclaimer(){
      if(h.consents.estimate){ finish(); return; }
      var d = A.dialog('Submit your house', '<label class="rights on-sheet"><input type="checkbox" id="c-est"><span><b>' + DISC.text + '</b><span class="small muted">No contractor is contacted and no work is done.</span></span></label><span class="err" id="c-err"></span>' +
        '<div class="cta-row" style="justify-content:flex-end;margin-top:12px"><button type="button" class="btn btn-secondary" data-dlg-close>Not yet</button><button type="button" class="btn btn-primary" id="c-ok">Submit my house</button></div>');
      d.querySelector('#c-ok').addEventListener('click', function(){
        if(!d.querySelector('#c-est').checked){ d.querySelector('#c-err').textContent = 'Please tick this to submit.'; return; }
        h.consents.estimate = {at:Date.now(), version:DISC.version, text:DISC.text}; saved(h); d.close(); finish();
      });
    }
    return function(){
      var up = Object.keys(pending).some(function(k){ return pending[k].some(function(p){ return p.state === 'up'; }); });
      if(up){ RI.toast('A few photos are still uploading. One moment.', 'clock'); return false; }
      var n = (h.photos.unsorted || []).length;
      if(n){ A.confirm(n + ' photo' + (n > 1 ? 's are' : ' is') + ' not in a room yet', 'Photos left in the tray are not used. Sort them first, or submit without them.', 'Submit without them', disclaimer); return false; }
      disclaimer(); return false;
    };
  }

  /* ---------- Submit checks: a verified email, and room under the free-report limit (SECURITY 5, 9) ---------- */
  /* Settings Sam can change (change 8, a proposal): free runs, runs added per payment, invite credits. No clock anywhere. */
  A.RUNS_PER_PAYMENT = RI.OFFERS.runsPerPayment; A.CREDITS_START = RI.OFFERS.inviteCredits;
  A.freeRuns = function(){ return A.FREE_LIMIT + A.RUNS_PER_PAYMENT * A.mine().filter(function(x){ return x.paid; }).length; };
  A.hasCredits = function(){ var s = A.me(); if(!s) return false; if(s.demo) return s.role === 'builder'; var u = RI.users.get(s.email) || {}; return !!u.trial; };
  A.creditsLeft = function(){ return A.hasCredits() ? Math.max(0, A.CREDITS_START - A.mine().filter(function(x){ return x.trialOpen && !x.paid; }).length) : 0; };
  A.limitDialog = function(h){
    A.dialog('You have used your ' + A.freeRuns() + ' free estimates', '<div class="mark bronze">' + RI.icon('lock') + '</div><p>Prices you have already seen stay open, and your draft is saved. Open the full presentation for one of your houses to get <b>' + A.RUNS_PER_PAYMENT + ' more</b>, or ask us for more.</p>' +
      '<div class="limit-opts">' +
        (h ? '<a class="lo" href="#/houses/' + h.id + '/checkout?run=1" data-dlg-close><b>Pay for this house</b><span>One payment runs it and opens the full presentation.</span></a>' : '') +
        '<a class="lo" href="' + RI.url('contact/') + '"><b>Ask us for more</b><span>Tell us about your houses and we will get back to you.</span></a>' +
      '</div><p class="xsmall muted">Sample numbers. Sam sets them.</p>');
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
      if(used >= A.freeRuns()){ A.limitDialog(h); return false; }
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
    var nextBtn = view.querySelector('#next');
    function submit(){
        var again = !!h.run; if(!canSubmit(h, again)) return;
        var b = nextBtn; RI.form.busy(b, true, 'Submitting');
        A.later(function(){
          h.status = 'submitted'; h.step = 'rooms'; h.run = {start:Date.now()}; h.version = (h.version || 1) + (again ? 1 : 0); h.submittedAt = Date.now();
          A.put(h); RI.track('intake_submitted', {again:again}); RI.toast(again ? 'Submitted again. A new version of your estimate is on its way.' : 'Submitted. Your house is in line.', 'check');
          A.go('#/houses/' + h.id);
        }, 700);
    }
    var done = [stepHouse, stepRooms][at](main, h, submit);
    var sd = view.querySelector('#save-draft'); if(sd) sd.addEventListener('click', function(){ A.put(h); RI.toast('Draft saved. Pick up where you left off.'); });
    nextBtn.addEventListener('click', function(){
      var r = done(); if(!r) return;
      A.go('#/houses/' + h.id + '/intake/' + STEPS[at + 1][0]);
    });
  }, {focus:true});
})();
