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
  /* Team only: a mixed set of real room photos for the bulk upload demo, named the way a phone names them. Most come from
     one dated house (the Coolidge Street house, like the kitchen photos), so the set reads as one home; credits in CREDITS.md.
     Each carries the room it shows, so the pretend reading sorts them the same way every time ('?' = not sure on purpose). */
  var SAMPLE_BULK = [['kitchen-dated.jpg','kitchen',['sink','cabinets','stove']],['cabinet-run.jpg','kitchen',['windows','cabinets']],['kitchen-dated-wide.jpg','kitchen',['oven','cabinets','tile floor']],
    ['rooms/living-arches.jpg','living',['archway','wood floor']],['rooms/living-stair-wall.jpg','living',['staircase','window','wood floor']],
    ['rooms/bedroom-front.jpg','bedrooms',['ceiling light','window','wood floor']],['rooms/bedroom-closet.jpg','bedrooms',['closet door','window']],['rooms/bedroom-back.jpg','bedrooms',['window','wood floor']],
    ['rooms/bath-pedestal.jpg','hallbath',['sink','bathtub']],['rooms/bath-tub.jpg','hallbath',['bathtub','sink','tile walls']],
    ['rooms/basement-finished.jpg','basement',['fireplace','wood floor']],['rooms/basement-utility.jpg','basement',['shelving','water heater','washer and dryer']],
    ['rooms/exterior-front.jpg','exterior',['house','front walk','lawn']],['rooms/stairs.jpg','?',['stairs']]];
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
        '</div><div id="dup"></div><div id="rgn-note" aria-live="polite"></div>' +
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
    function pick(i){ var x = sugg[i]; if(!x) return; street.value = x[0]; $('city').value = x[1]; $('zip').value = x[2]; $('state').value = 'MI'; regionNote(); list.hidden = true; street.setAttribute('aria-expanded', 'false'); ['street','city','zip'].forEach(function(id){ RI.form.setInvalid($(id), null); }); collect(); dupCheck(); }
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
    /* Regions (Sam's meeting, Nov 2026): a state whose region is not live yet gets a calm note. The house can be saved, not priced */
    function regionNote(){
      var el = $('rgn-note'), v = $('state').value.trim().toUpperCase(), g = RI.STATES[v] ? RI.regionOf(v) : null; if(!el) return;
      var live = RI.regions().filter(function(r){ return r.live; }).map(function(r){ return r.name; });
      el.innerHTML = g && !g.live ? '<p class="rgn-note">' + RI.icon('pin','i-sm') + '<span><b>We do not price houses in ' + RI.esc(RI.STATES[v]) + ' yet.</b> We start in the ' + RI.esc(live.join(' and ') || 'Midwest') + '. You can save this house now, and we will let you know when we price the ' + RI.esc(g.name) + '.</span></p>' : '';
      RI.fillIcons(el);
    }
    $('state').addEventListener('input', regionNote); regionNote();
    function check(only){
      var ok = true, F = RI.form;
      function req(id, test, msg){ if(only && id !== only) return; var el = $(id), bad = !test(el.value.trim()); F.setInvalid(el, bad ? msg : null); if(bad && ok){ ok = false; if(!only) el.focus(); } }
      req('street', function(v){ return v.length > 3; }, 'Enter the street address.');
      req('city', function(v){ return v.length > 1; }, 'Enter the city.');
      req('state', function(v){ return !!RI.STATES[v.toUpperCase()]; }, 'Use the two-letter state, for example MI.');
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
    /* Team only: Fill sample data in the ribbon fills this whole screen, with a new address each time (no duplicate) */
    RI.setDevFill(function(){
      function any(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
      function rnd(a, b){ return a + Math.floor(Math.random() * (b - a + 1)); }
      var taken = A.mine().map(function(x){ return norm((x.addr || {}).street); }), pickA, tries = 0;
      do { var sa = any(SAMPLES.slice(0, 12)); pickA = [rnd(1100, 48900) + ' ' + sa[0].replace(/^\d+\s+/, ''), sa[1], sa[2]]; } while(taken.indexOf(norm(pickA[0])) > -1 && ++tries < 20);
      $('street').value = pickA[0]; $('unit').value = ''; $('city').value = pickA[1]; $('state').value = 'MI'; $('zip').value = pickA[2];
      $('year').value = rnd(1925, 1998); $('sqft').value = Math.round(rnd(1050, 2400) / 10) * 10;
      main.querySelector('input[name=stories][value="' + any([1,1,2]) + '"]').checked = true;
      $('beds').textContent = rnd(2, 4); $('baths').textContent = rnd(1, 2); $('halfBaths').textContent = rnd(0, 1);
      var bsm = main.querySelector('input[name=bsmt][value="' + any(['finished','partly','unfinished']) + '"]'); bsm.checked = true;
      $('btot').value = Math.round(rnd(800, 1400) / 10) * 10; $('bsqft').value = bsm.value === 'unfinished' ? '' : Math.round(rnd(300, 700) / 10) * 10;
      $('m-lot').value = rnd(5200, 9800); $('fire').textContent = rnd(0, 1);
      var gar = main.querySelector('input[name=garage][value="' + any(['attached','detached']) + '"]'); gar.checked = true;
      main.querySelectorAll('input[name=floor]').forEach(function(c){ c.checked = c.value === 'Hardwood' || c.value === 'Tile' || (c.value === 'Carpet' && Math.random() < .5); });
      $('m-heat').value = 'Forced air, gas'; $('m-heaty').value = rnd(2004, 2019); $('m-cool').value = 'Central air'; $('m-wh').value = rnd(2012, 2022);
      $('m-ext').value = any(['Brick, asphalt shingle roof, poured basement','Vinyl siding, asphalt shingle roof, block basement','Brick and siding, asphalt shingle roof']);
      $('m-upd').value = 'Roof ' + rnd(2010, 2020) + ', windows ' + rnd(2000, 2015);
      bsm.dispatchEvent(new Event('change', {bubbles:true})); gar.dispatchEvent(new Event('change', {bubbles:true}));
      main.querySelectorAll('.field.invalid .input').forEach(function(el){ RI.form.setInvalid(el, null); });
      regionNote(); dupCheck(); collect();
      RI.toast('Sample house filled in. Change anything you like.', 'check');
    }, 'Fill sample house', main);
    return function(){ collect(); return check(); };
  }

  /* ---------- Screen 2: rooms and photos (change 6). One tray for every photo, room cards with photos, size and a note,
     the photo rights asked once on the first upload, and the house submitted from this screen. ---------- */
  function stepRooms(main, h, finish){
    h.photos = h.photos || {}; h.fps = h.fps || []; h.consents = h.consents || {}; h.sizes = h.sizes || {}; h.notes = h.notes || {}; h.measured = h.measured || {};
    var rooms = A.roomsFor(h);
    var ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif';
    function nameOf(k){ var r = rooms.filter(function(x){ return x[0] === k; })[0]; return r ? r[1] : k; }
    function sizeable(r){ return r[0] !== 'exterior' && r[0] !== 'other' && !/^x-(ext|deck|patio|porch|driveway|pool|accessory)/.test(r[0]); }
    var LEAD = 'Add every photo at once. We sort them into rooms and measure each room. You check.';
    /* The floor plan box, the same before and after sorting (make-ui, Nov 2026): what it is, Add a plan, then each plan
       added with a thumbnail, View and Remove. Plans are kept with the house, not read (APP_FLOW). */
    var PLANBOX = '<section class="pl-box" aria-label="Floor plan"><div class="pl-head"><span class="pl-ic" aria-hidden="true">' + RI.icon('file') + '</span>' +
      '<span class="pl-t"><b>Floor plan <span class="opt">(optional)</span></b><small class="pl-help">If you have one. We keep it with your house; rooms are still measured from your photos.</small></span>' +
      '<label class="btn btn-secondary btn-sm file-btn pl-add">' + RI.icon('plus','i-sm') + '<span class="pl-add-t">Add a plan</span><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple data-plans aria-label="Add a floor plan"></label></div>' +
      '<ul class="pl-list" aria-label="Floor plans added"></ul><p class="pl-err" role="alert"></p></section>';
    /* Phones get the short line, so the first button is on the first screen (make-ui, Nov 2026) */
    var LEADH = '<span class="ld-l">' + LEAD + '</span><span class="ld-s">Add every photo. We sort them into rooms.</span>';
    /* Photo tips as small drawings, picture-first (Sam's rule): whole room from a corner, lights on, a close-up */
    var TIPS = [
      ['Whole room, from a corner', '<path d="M4 4l26 14h36L92 4M4 60l26-18h36l26 18M30 18v24M66 18v24"/><rect x="40" y="22" width="16" height="12"/><circle class="ac" cx="9" cy="54" r="3"/>'],
      ['Lights on, blinds open', '<rect x="34" y="14" width="40" height="34"/><path d="M34 31h40M54 14v34M34 18h40M34 22h40"/><path class="ac" d="M16 8v8M8 22h6M24 18l4-4M8 12l4 4M16 26a6 6 0 1 0 0-.1"/>'],
      ['Close-up of damage', '<rect x="6" y="8" width="84" height="48"/><path d="M30 14l6 10-5 6 7 9-4 9"/><circle class="ac" cx="36" cy="30" r="12"/><path class="ac" d="M45 39l9 9"/>']
    ];
    main.innerHTML = '<header class="wiz-head rp3-head"><div><p class="label">Screen 2 of 2</p><h1>Rooms and photos</h1><p class="muted" id="rp3-sub">' + LEADH + '</p></div>' +
        '<div class="rp3-prog" id="rp3-prog" aria-live="polite"></div></header>' +
      /* Bulk upload first (user, Nov 2026, after Sam's meeting): one place for every photo; the rooms appear once the
         photos are sorted, already filled in and measured. Only the photos we could not place ask for a tap. */
      '<div class="bk" id="bk">' +
        /* Before any photo (make-ui, Nov 2026): the drop area on the left; your rooms and photo tips beside it on a
           computer, under it on a tablet or phone. The rights tick comes before the buttons and is asked only here. */
        '<div class="bk-start"><div class="bk-main">' +
        '<section class="bk-drop" id="bk-drop" aria-labelledby="bk-drop-h"><input type="file" accept="' + ACCEPT + '" multiple data-room="unsorted" tabindex="-1" aria-hidden="true" class="bk-drop-in">' +
          '<span class="bk-ic">' + RI.icon('image','i-lg') + '<span class="bk-plus">' + RI.icon('plus','i-sm') + '</span></span>' +
          '<h2 id="bk-drop-h"><span class="bk-desk">Drop all your photos here</span><span class="bk-ph">Add all your photos</span></h2>' +
          '<p>Every room, inside and out, in any order. Two or three photos a room is enough.</p>' +
          '<div class="bk-ok-w"><span class="bk-ok-h">Before you add photos</span><label class="bk-ok" id="bk-ok"><input type="checkbox" id="bk-rights" aria-describedby="bk-ok-err"' + (h.rights ? ' checked' : '') + '><span>' + RIGHTS.text + '</span></label><span class="bk-ok-err" id="bk-ok-err" role="alert"></span></div>' +
          '<div class="bk-btns bk-desk"><label class="btn btn-primary file-btn">' + RI.icon('upload') + 'Choose photos<input type="file" accept="' + ACCEPT + '" multiple data-room="unsorted"></label>' +
            '<label class="btn btn-secondary file-btn bk-cam">' + RI.icon('camera') + 'Use camera<input type="file" accept="image/*" capture="environment" data-room="unsorted"></label><span class="bk-drag">or drag them here</span></div>' +
          '<div class="bk-btns bk-ph"><label class="btn btn-primary file-btn">' + RI.icon('camera') + 'Take photos<input type="file" accept="image/*" capture="environment" data-room="unsorted"></label>' +
            '<label class="btn btn-secondary file-btn">' + RI.icon('image') + 'From my photos<input type="file" accept="' + ACCEPT + '" multiple data-room="unsorted"></label></div>' +
          '<p class="bk-fmt">JPG, PNG, WebP or HEIC · up to ' + MAX_PHOTOS + ' photos' + (RI.devTools ? ' · <button type="button" class="linkbtn small" id="sample">Team: sample photos</button>' : '') + '</p>' +
        '</section>' +
        PLANBOX +
        '</div>' +
        '<aside class="bk-aside" aria-label="Before you start">' +
          '<section class="bk-box bk-rbox" id="bk-rbox"><h2>Your <span id="bk-want-n"></span> rooms</h2><p class="bk-rsub">From your answers. Photograph each one.</p>' +
            '<p class="bk-rsum"><span id="bk-rsum"></span> <button type="button" class="linkbtn small" id="bk-rmore" aria-expanded="false" aria-controls="bk-want">Show all</button></p><ul class="bk-chips" id="bk-want"></ul></section>' +
          '<section class="bk-box bk-tbox"><h2>Good photos</h2><ul class="bk-tips2">' + TIPS.map(function(t){ return '<li><svg viewBox="0 0 96 64" aria-hidden="true">' + t[1] + '</svg><span>' + t[0] + '</span></li>'; }).join('') + '</ul></section>' +
        '</aside></div>' +
        /* While the first photos are sorted: Spatial intelligence (user, Nov 2026). Your photos -> the orb -> Your rooms */
        '<section class="bk-stage" id="bk-stage" aria-label="Reading your photos">' +
          '<div class="bk-sh"><div><b id="bk-sh-b" aria-live="polite">Reading your photos</b><small id="bk-sh-s"></small></div><span class="bk-sh-a" id="bk-sh-a"></span></div>' +
          '<span class="bk-col bk-c1">Your photos</span><span class="bk-col bk-c2">Spatial intelligence</span><span class="bk-col bk-c3">Your rooms</span>' +
          '<div class="bk-now" id="bk-now" aria-hidden="true"><span>Next photo</span></div>' +
          '<div class="bk-pile" id="bk-pile" aria-hidden="true"></div><p class="bk-pile-l" id="bk-pile-l"></p>' +
          '<div class="bk-core" id="bk-core"></div>' +
          '<ul class="bk-tiles" id="bk-tiles" aria-label="Your rooms"></ul></section>' +
        /* Then: new photos being sorted, the ones we could not place, and every room */
        '<section class="bk-prog" id="bk-prog" aria-live="polite" hidden></section>' +
        '<div id="flags-sum"></div>' +
        '<section class="bk-need" id="unsorted" aria-live="polite" hidden></section>' +
        '<div class="rp2-rooms bk-rooms">' +
          '<div class="bk-roomsh"><h2>Your rooms</h2><p>Move a photo if we got it wrong: open the room and pick where it belongs.</p></div>' +
          '<div class="rc2-nav" aria-hidden="false"><span class="rc2-dots" id="rc2-dots"></span><button type="button" class="btn btn-secondary btn-sm" id="rc2-next">Next room ' + RI.icon('arrow','i-sm') + '</button></div>' +
          '<div class="rc2-grid" id="rc2-grid">' + rooms.map(roomCard).join('') + '</div>' +
          '<div class="bk-more"><span><b>Forgot a room?</b> Add more photos any time. We sort them the same way.</span><span class="bk-more-b"><label class="btn btn-secondary btn-sm file-btn">' + RI.icon('plus','i-sm') + 'Add more photos<input type="file" accept="' + ACCEPT + '" multiple data-room="unsorted"></label>' +
            '<button type="button" class="btn btn-secondary btn-sm" id="add-room">' + RI.icon('plus','i-sm') + 'Add a room</button></span></div>' +
          '<div class="plans-f2">' + PLANBOX + '</div>' +
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
        '<div class="rc3-body"><span class="rc3-ic">' + RI.icon(iconFor(r)) + '</span><div class="rc3-t"><h2 id="rc2-' + r[0] + '">' + nm + '</h2><p class="rc3-hint">' + A.hintFor(r[2] || r[0]) + '</p></div>' +
          (r[3] ? '<button type="button" class="icon-btn ru-del" data-delroom="' + r[0] + '" aria-label="Remove ' + nm + '">' + RI.icon('x','i-sm') + '</button>' : '') + '</div>' +
        '<p class="bk-dup" hidden>' + RI.icon('info','i-sm') + '<span>Two photos show the same view. We count it once.</span></p>' +
        '<div class="ps" data-ps="' + r[0] + '" aria-live="polite" hidden></div>' +
        (sizeable(r) ? '<div class="sz" data-sz="' + r[0] + '" aria-live="polite" hidden></div>' : '') +
        '<p class="rc3-note" hidden></p></section>';
    }
    /* The card under the photo: a note shows as one line; size and sorting have their own strips (make-ui, Nov 2026:
       the form under each card is gone, Edit opens the room window) */
    function foot(k){
      var sec = main.querySelector('.rc2[data-room="' + k + '"]'); if(!sec) return;
      var nEl = sec.querySelector('.rc3-note'), nt = h.notes[k];
      if(nEl){ nEl.hidden = !nt; nEl.innerHTML = nt ? RI.icon('chat','i-sm') + '<span>' + RI.esc(nt) + '</span>' : ''; }
      drawSort(k); drawSize(k);
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
      else if(s && s.l){ cls += ' is-ok'; html = '<span class="sz-v">' + RI.icon('ruler','i-sm') + '<span><b>' + s.l + ' × ' + s.w + ' ft</b><span class="sz-from">' + (s.src === 'user' ? 'Your size' : 'Confirmed') + '</span></span></span>'; }
      else if(!s && h.measured[k] === 'none' && A.photoCount(h, k)){ cls += ' is-none'; html = RI.icon('ruler','i-sm') + '<span>We could not size this room from the photos. Add a wider photo, or <button type="button" class="linkbtn" data-szedit="' + k + '">type the size</button>.</span>'; }
      else if(!s && A.photoCount(h, k)){ cls += ' is-add'; html = RI.icon('ruler','i-sm') + '<span>No size yet. <button type="button" class="linkbtn" data-szedit="' + k + '">Add the size</button> <span class="opt">(optional)</span></span>'; }
      el.className = cls; el.innerHTML = html; el.hidden = !html;
    }
    /* The card's own length and width boxes follow the saved size, so Edit opens them filled in */
    function setInputs(k){
      var sec = main.querySelector('.rc2[data-room="' + k + '"]'), s = h.sizes[k] || {}; if(!sec) return;
      var cl = sec.querySelector('[data-l]'), cw = sec.querySelector('[data-w]'); if(cl){ cl.value = s.l || ''; cw.value = s.w || ''; }
    }
    function maybeMeasure(k){
      var r = roomOf(k);
      if(!r || !sizeable(r) || h.sizes[k] || h.measured[k] || measuring[k] || !confirmedN(k)) return;
      measuring[k] = true; drawSize(k);
      setTimeout(function(){
        delete measuring[k];
        if(!doc.body.contains(main)) return;              /* left the screen: measured next time */
        if(h.sizes[k] || !confirmedN(k)){ drawSize(k); return; }
        var ps = (h.photos[k] || []).filter(function(p){ return p.state === 'done' && !p.sug; });
        var poor = ps.every(function(p){ return (p.flags || []).some(function(f){ return f === 'small' || f === 'blurry'; }); });
        var s = poor ? null : A.AI.sizeFor(h, k, r[2] || r[0]);
        h.measured[k] = s ? 'photo' : 'none';
        if(s) h.sizes[k] = {l:s.l, w:s.w, src:'photo', ok:false};
        saved(h); setInputs(k); foot(k); totals();
      }, A.AI.MEASURE_MS);
    }
    /* ---------- Photos sort themselves (Sam's meeting, Nov 2026): every photo added to the tray is read, then moved
       into the room it shows, marked Suggested. Each room asks "Right room? Yes / Fix"; a photo we are not sure about
       stays in the tray with its three best rooms. The reading is pretend (fakeai.js). ---------- */
    var reading = {}, readQ = 0;
    function confirmedN(k){ return (h.photos[k] || []).filter(function(p){ return p.state === 'done' && !p.sug; }).length; }
    function sugIn(k){ return (h.photos[k] || []).filter(function(p){ return p.state === 'done' && p.sug; }).length; }
    function read(p){
      if(reading[p.id] || p.unsure) return;
      reading[p.id] = true; readQ++; drawUnsorted(); totals();
      setTimeout(function(){
        delete reading[p.id]; readQ = Math.max(0, readQ - 1);
        if(!doc.body.contains(main)) return;              /* left the screen: read next time */
        if(!(h.photos.unsorted || []).some(function(x){ return x.id === p.id; })){ drawUnsorted(); return; }
        var res = A.AI.readPhoto(p, rooms, h); delete p.suggest;
        /* Sorted photos count as placed (the preview the user approved): the room asks about its size, not about each photo */
        if(res.sees) p.sees = res.sees;
        if(res.room){ p.auto = true; move('unsorted', p.id, res.room); }
        else { p.unsure = true; p.alts = res.alts; if(res.newType) p.newType = res.newType; saved(h); drawUnsorted(); }
      }, A.AI.readMs(p) + (readQ - 1) * 160);
    }
    function drawSort(k){
      var sec = main.querySelector('.rc2[data-room="' + k + '"]'), el = sec && sec.querySelector('.ps'); if(!el) return;
      var all = (h.photos[k] || []).filter(function(p){ return p.state === 'done'; }).length, sg = sugIn(k), nm = RI.esc(nameOf(k));
      sec.classList.toggle('is-sug', sg > 0);
      if(!sg){ el.hidden = true; el.innerHTML = ''; return; }
      el.innerHTML = '<span class="ps-t">' + RI.icon('image','i-sm') + '<span><b>' + (sg === all ? 'We put ' : 'We added ') + sg + ' photo' + (sg === 1 ? '' : 's') + ' here</b><span class="ps-from">Sorted by reading your photos</span></span></span>' +
        '<span class="ps-ask"><span class="ps-q">Right room?</span><button type="button" class="btn btn-secondary btn-sm" data-psok="' + k + '" aria-label="Yes, these photos show ' + nm + '">' + RI.icon('check','i-sm') + 'Yes</button><button type="button" class="btn btn-secondary btn-sm" data-psfix="' + k + '" aria-label="Fix the photos in ' + nm + '">' + RI.icon('pencil','i-sm') + 'Fix</button></span>';
      el.hidden = false;
    }
    /* The tray's top line: reading now, or how many photos wait for a yes, with Confirm all */
    function sortHtml(){
      var nRead = Object.keys(reading).length, sg = 0, rs = 0;
      rooms.forEach(function(r){ var n = sugIn(r[0]); if(n){ sg += n; rs++; } });
      if(nRead) return '<p class="ps-sum is-wait">' + RI.icon('image','i-sm') + '<span><b>Reading ' + nRead + ' photo' + (nRead === 1 ? '' : 's') + '…</b> Each one goes to the room it shows.</span></p>';
      if(sg) return '<div class="ps-sum"><p>' + RI.icon('check','i-sm') + '<span><b>' + sg + ' photo' + (sg === 1 ? '' : 's') + ' sorted into ' + rs + ' room' + (rs === 1 ? '' : 's') + '.</b> Check each room, or confirm them all. <span class="state state-sample">Sample</span></span></p>' +
        '<button type="button" class="btn btn-primary btn-sm btn-block" data-psall>' + RI.icon('check','i-sm') + 'Confirm all</button></div>';
      return '';
    }
    function confirmRoom(k){ (h.photos[k] || []).forEach(function(p){ delete p.sug; }); }
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
    /* A photo we could not place: one tap on a room. Our best guess comes first, outlined; a kind of room the house does
       not have yet is offered as a new room ("ask first"); Not a room takes it out. */
    function typeName(t){ var all = RI.ROOM_TYPES.inside.concat(RI.ROOM_TYPES.outside), x = all.filter(function(a){ return a[0] === t; })[0]; return x ? x[1] : t; }
    function pickParts(p){
      var opts = rooms.filter(function(r){ return r[0] !== 'other'; }), guess = p.newType ? null : (p.alts || []).filter(function(k){ return roomOf(k); })[0];
      var order = guess ? [roomOf(guess)].concat(opts.filter(function(r){ return r[0] !== guess; })) : opts;
      return {q:p.newType ? 'Looks like a room you did not list' : guess ? 'Our best guess is outlined' : 'Pick the room it shows',
        html:'<div class="bk-pick" role="group" aria-label="Room for this photo">' +
          (p.newType ? '<button type="button" class="bk-chip is-guess" data-newtype="' + p.newType + '" data-p="' + p.id + '">' + RI.icon('plus','i-sm') + 'New room: ' + RI.esc(typeName(p.newType)) + '<em>Best guess</em></button>' : '') +
          order.map(function(r){ var g = r[0] === guess; return '<button type="button" class="bk-chip' + (g ? ' is-guess' : '') + '" data-accept="' + p.id + '" data-to="' + r[0] + '">' + RI.icon(iconFor(r),'i-sm') + RI.esc(r[1]) + (g ? '<em>Best guess</em>' : '') + '</button>'; }).join('') +
          '<button type="button" class="bk-chip ghost" data-newroom="' + p.id + '">' + RI.icon('plus','i-sm') + 'New room</button><button type="button" class="bk-chip ghost" data-notroom="' + p.id + '">Not a room</button></div>'};
    }
    function placeItem(p){ var k = pickParts(p); return '<li class="bk-pl"><div class="bk-pl-ph">' + thumb(p, 'unsorted') + '</div><div class="bk-pl-b"><p class="bk-pl-q">' + k.q + '</p>' + k.html + '</div></li>'; }
    function drawUnsorted(){
      var un = h.photos.unsorted || [], u = main.querySelector('#unsorted');
      var place = un.filter(function(p){ return p.state === 'done' && !reading[p.id]; });
      u.hidden = !place.length;
      u.innerHTML = place.length ? '<header class="bk-need-h"><h2>Which room is this? <span class="n">' + place.length + ' photo' + (place.length === 1 ? '' : 's') + '</span></h2><p>We could not tell. Tap the room it shows.</p></header><ul class="bk-pl-list">' + place.map(placeItem).join('') + '</ul>' : '';
      RI.fillIcons(u);
      drawProg(); drawPhase();
    }
    /* After the first sort: new photos uploading or being read, and any that did not upload, in one strip */
    function drawProg(){
      var el = main.querySelector('#bk-prog'), un = h.photos.unsorted || [];
      var list = (pending.unsorted || []).concat(un.filter(function(p){ return reading[p.id]; }));
      if(!list.length){ el.hidden = true; el.innerHTML = ''; return; }
      var work = list.filter(function(p){ return p.state !== 'fail'; }).length, fl = list.length - work;
      el.innerHTML = '<div class="bk-prog-t">' + (work ? '<span class="bk-sp" aria-hidden="true"></span><span><b>Sorting ' + work + ' new photo' + (work === 1 ? '' : 's') + ' into rooms</b><small>They go to the room they show.</small></span>' : '<span><b>' + fl + ' photo' + (fl === 1 ? '' : 's') + ' did not upload</b><small>Try again, or remove ' + (fl === 1 ? 'it' : 'them') + '.</small></span>') + '</div>' +
        '<ul class="bk-mini">' + list.map(function(p){ return '<li>' + thumb(p, 'unsorted') + '</li>'; }).join('') + '</ul>';
      el.hidden = false; RI.fillIcons(el);
    }
    /* Which view: no photos yet; the first photos being sorted; or checking the rooms. Once a house has been sorted it
       stays on the check view, and new photos sort in the strip above the rooms. */
    function working(){ return Object.keys(reading).length > 0 || Object.keys(pending).some(function(k){ return pending[k].some(function(p){ return p.state === 'up'; }); }); }
    function phase(){
      var any = A.photoCount(h) + (h.photos.unsorted || []).length + Object.keys(pending).reduce(function(n, k){ return n + pending[k].length; }, 0);
      if(!any && !h.sortedOnce) return 'empty';
      if(!h.sortedOnce){
        /* Opened with every photo already read and placed (an older draft): straight to the rooms */
        if(!lastPhase && !working() && !(h.photos.unsorted || []).some(function(p){ return p.state === 'done'; })){ h.sortedOnce = true; A.put(h); return 'check'; }
        /* Otherwise the AI core stays until it has shown every result and the unsure ones have a room (or "later") */
        return 'sorting';
      }
      return 'check';
    }
    var lastPhase = '';
    function drawPhase(){
      var ph = phase(), bk = main.querySelector('#bk');
      bk.className = 'bk bk-' + ph;
      var c = counts(), un = c.unsorted, inR = A.photoCount(h), all = inR + un;
      var sub = main.querySelector('#rp3-sub');
      if(ph !== 'check'){ if(sub.innerHTML !== LEADH) sub.innerHTML = LEADH; } else sub.textContent = un ? 'We sorted ' + inR + ' of ' + all + ' photos. Place the ' + (un === 1 ? 'one' : un) + ' we were not sure about, then check each room.' : 'Every photo is in a room. Check each room and its size, then submit.';
      if(ph === 'empty') drawWant();
      if(ph === 'sorting') drawSorting();
      if(ph !== lastPhase){ if(lastPhase === 'sorting' && ph === 'check') RI.toast('Your photos are sorted. Check each room.', 'check'); lastPhase = ph; }
    }
    function drawWant(){
      var rs = rooms.filter(function(r){ return r[0] !== 'other'; });
      main.querySelector('#bk-want-n').textContent = rs.length;
      main.querySelector('#bk-want').innerHTML = rs.map(function(r){ return '<li>' + RI.icon(iconFor(r),'i-sm') + RI.esc(r[1]) + '</li>'; }).join('');
      /* Phones: one line instead of every chip, "Kitchen, living room, 4 bedrooms, full bath, basement and outside" */
      var grp = [], seen = {};
      rs.forEach(function(r){
        var t = r[2] || r[0], n = rs.filter(function(x){ return (x[2] || x[0]) === t; }).length; if(seen[t]) return; seen[t] = 1;
        var w = {kitchen:'kitchen', living:'living room', bedrooms:'bedroom', hallbath:'full bath', halfbath:'half bath', basement:'basement', exterior:'outside'}[t] || r[1].toLowerCase().replace(/ \d+$/, '');
        grp.push(n > 1 ? n + ' ' + w + (/s$/.test(w) ? '' : 's') : w);
      });
      var line = grp.length > 1 ? grp.slice(0, -1).join(', ') + ' and ' + grp[grp.length - 1] : grp.join('');
      main.querySelector('#bk-rsum').textContent = line.charAt(0).toUpperCase() + line.slice(1) + '.';
    }
    /* ---------- Spatial intelligence (user, Nov 2026) ----------
       Your photos -> the orb -> Your rooms. The photo being read sits highlighted on the left; the orb
       (RI.SpatialIntelligenceCore, sicore.js) walks through the steps for it: scanning, structure, room type, size; then the
       photo moves to its room tile. What it shows comes from the reading (room, what it saw, the rooms it could be) and the
       size measured for that room, marked Estimate until the owner confirms it; nothing is made up for show. Results play
       in order, a little behind the real reading, faster when many wait. Photos it could not place collect in "Needs you"
       and come back as questions. Reduced motion: nothing moves; the steps and tiles update. */
    var stg = null, EIN = 'cubic-bezier(.45,0,.2,1)';
    function T(x, y, sc){ return 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)' + (sc != null ? ' scale(' + sc + ')' : ''); }
    function sleep(ms){ return new Promise(function(ok){ setTimeout(ok, A.reduce ? 0 : ms); }); }
    function stage(){
      var el = main.querySelector('#bk-stage');
      if(!stg || stg.el !== el){
        stg = {el:el, seen:{}, landed:{}, src:{}, queue:[], busy:false, cards:{}, first:true, finishing:false, act:'',
          core:RI.SpatialIntelligenceCore.create(el.querySelector('#bk-core'), {reduce:A.reduce})};
      }
      return stg;
    }
    function rel(el){ var s0 = stg.el.getBoundingClientRect(), r = el.getBoundingClientRect(); return {x:r.left - s0.left, y:r.top - s0.top, w:r.width, h:r.height}; }
    function place(sel, x, y, w){ var e = stg.el.querySelector(sel); e.style.left = Math.round(x) + 'px'; e.style.top = Math.round(y) + 'px'; if(w) e.style.width = Math.round(w) + 'px'; }
    /* Three columns on a computer. On a tablet or phone: your photos, then the orb, then your rooms */
    function geo(){
      var S = stg, W = S.el.clientWidth, narrow = W < 960, tab = narrow && W >= 600, g = {W:W, narrow:narrow};
      var tl = S.el.querySelector('#bk-tiles'), core = S.el.querySelector('#bk-core'), sh = S.el.querySelector('.bk-sh'), top0 = sh.offsetTop + sh.offsetHeight + 16;
      S.el.classList.toggle('is-narrow', narrow);
      if(!narrow){
        var tw = Math.min(470, Math.round(W * .38)), left = W - 20 - tw, cl = 248, cw = left - 28 - cl;
        g.now = {x:26, y:top0 + 26, w:196, h:147}; g.pw = 96; g.ph = 72; g.pile = {x:26, y:g.now.y + g.now.h + 30};
        place('.bk-c1', 16, top0, 220); place('.bk-c2', cl, top0, cw); place('.bk-c3', left, top0, tw);
        place('#bk-pile-l', g.pile.x + g.pw + 16, g.pile.y + 12, 110);
        place('#bk-core', cl, top0 + 20, cw);
        tl.style.left = left + 'px'; tl.style.top = (top0 + 26) + 'px'; tl.style.width = tw + 'px'; tl.style.gridTemplateColumns = 'repeat(' + (tw > 400 ? 3 : 2) + ',minmax(0,1fr))';
      } else {
        var nw = tab ? 168 : 124;
        g.now = {x:16, y:top0 + 22, w:nw, h:Math.round(nw * .75)}; g.pw = tab ? 80 : 60; g.ph = Math.round(g.pw * .75);
        g.pile = {x:16 + nw + 18, y:g.now.y + g.now.h - g.ph - 4};
        place('.bk-c1', 16, top0, 200); place('#bk-pile-l', g.pile.x + g.pw + 16, g.pile.y + g.ph / 2 - 14, 110);
        var ct = g.now.y + g.now.h + 22; place('#bk-core', 12, ct, W - 24);
        var tt = ct + core.offsetHeight + 40; place('.bk-c3', 12, tt - 24, W - 24);
        tl.style.left = '12px'; tl.style.top = tt + 'px'; tl.style.width = (W - 24) + 'px'; tl.style.gridTemplateColumns = 'repeat(' + (tab ? 4 : 3) + ',minmax(0,1fr))';
      }
      var nowEl = S.el.querySelector('#bk-now'); place('#bk-now', g.now.x, g.now.y, g.now.w); nowEl.style.height = g.now.h + 'px';
      var H = Math.max(core.offsetTop + core.offsetHeight + 24, tl.offsetTop + tl.offsetHeight + 20, g.pile.y + g.ph + 40);
      if(S.el.style.height !== H + 'px') S.el.style.height = H + 'px';
      S.g = g; return g;
    }
    /* Every photo of this house and what is happening to it, in the order it was added */
    function batch(){
      var out = [];
      rooms.forEach(function(r){ (h.photos[r[0]] || []).forEach(function(p){ out.push({p:p, k:r[0], s:'placed'}); }); });
      (h.photos.unsorted || []).forEach(function(p){ out.push({p:p, k:'unsorted', s:p.state !== 'done' ? p.state : p.unsure && !reading[p.id] ? 'unsure' : 'reading'}); });
      Object.keys(pending).forEach(function(k){ pending[k].forEach(function(p){ out.push({p:p, k:k, s:p.state}); }); });
      return out.sort(function(a, b){ return (a.p.n || 0) - (b.p.n || 0); });
    }
    function drawPile(list){
      var S = stg, g = S.g, wait = list.filter(function(x){ return x.p.id !== S.playing && !S.landed[x.p.id] && x.s !== 'fail' && x.s !== 'unsure' && x.s !== 'placed'; })
        .concat(S.queue.filter(function(it){ return it.id !== S.playing; }).map(function(it){ return {p:it.p}; }));
      var el = S.el.querySelector('#bk-pile');
      el.style.transform = T(g.pile.x, g.pile.y);
      el.innerHTML = wait.slice(0, 4).map(function(x, i){ return '<img src="' + x.p.src + '" alt="" style="width:' + g.pw + 'px;height:' + g.ph + 'px;transform:translate(' + (i * 2) + 'px,' + (-i * 3) + 'px) rotate(' + ([-4, 3, -2, 5][i]) + 'deg);z-index:' + (10 - i) + '">'; }).join('');
      S.el.querySelector('#bk-pile-l').innerHTML = wait.length ? '<b>' + wait.length + '</b> waiting' : (S.playing ? 'Last photo' : '');
    }
    /* A room's size for its tile: the estimate from the photos until the owner confirms it */
    function tileSize(k){ var s0 = h.sizes[k]; if(!s0 || !s0.l) return ''; var est = s0.src === 'photo' && !s0.ok; return '<em class="bk-tsz"' + (est ? ' title="Estimate from your photos"' : '') + '>' + (est ? '≈ ' : '') + s0.l + ' × ' + s0.w + ' ft' + (est ? '' : ' ✓') + '</em>'; }
    function drawTiles(fresh){
      var S = stg, by = {};
      Object.keys(S.landed).forEach(function(id){ (by[S.landed[id]] = by[S.landed[id]] || []).push(id); });
      var rs = rooms.filter(function(r){ return r[0] !== 'other' || (by.other || []).length; });
      function stack(ids){ return ids.slice(-3).map(function(id){ return '<img src="' + (S.src[id] || '') + '" alt=""' + (id === fresh ? ' class="new"' : '') + '>'; }).join(''); }
      var hl = by.help || [];
      S.el.querySelector('#bk-tiles').innerHTML = rs.map(function(r){
        var ids = by[r[0]] || [], n = ids.length;
        return '<li class="bk-tile' + (n ? ' on' : '') + '" data-k="' + r[0] + '"><span class="bk-stack">' + (n ? stack(ids) : RI.icon(iconFor(r))) + '</span><b>' + RI.esc(r[1]) + '</b><small>' + (n ? n + ' photo' + (n === 1 ? '' : 's') : 'Waiting') + '</small>' + (n ? tileSize(r[0]) : '') + '</li>';
      }).join('') + '<li class="bk-tile help' + (hl.length ? ' has' : '') + '" data-k="help"><span class="bk-stack">' + (hl.length ? stack(hl) : '<span class="q">?</span>') + '</span><b>Needs your input</b><small>' + (hl.length ? hl.length + ' to check' : 'Not sure ones') + '</small></li>';
      geo();
    }
    function hit(k){ var b = stg.el.querySelector('.bk-tile[data-k="' + k + '"]'); if(b && !A.reduce){ b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); } }
    function tileAt(k){ var e = stg.el.querySelector('.bk-tile[data-k="' + k + '"] .bk-stack') || stg.el.querySelector('.bk-tile[data-k="help"] .bk-stack'), r = rel(e); return {x:r.x + r.w / 2, y:r.y + r.h / 2, r:r}; }
    function fly(el, to, ms, ease){ var from = el.style.transform; el.style.transform = to; if(A.reduce) return Promise.resolve(); return el.animate([{transform:from}, {transform:to}], {duration:ms, easing:ease || EIN, fill:'forwards'}).finished.catch(function(){}); }
    function land(it, fresh){ var S = stg; S.landed[it.id] = it.k; drawTiles(fresh ? it.id : null); hit(it.k); }
    /* ---- one photo, read: it comes up highlighted, the orb goes through the real steps for it, then it goes to its room ---- */
    async function play(it, slow, f){
      var S = stg, g = geo(), p = it.p, c = S.core, sp = function(a, b){ return (slow ? a : b) * f; }, n = Object.keys(S.landed).length + 1;
      S.playing = it.id; drawPile(batch());
      var el = doc.createElement('div'); el.className = 'bk-fl'; el.style.width = g.now.w + 'px'; el.style.height = g.now.h + 'px';
      el.innerHTML = '<img src="' + p.src + '" alt=""><span class="bk-fl-tag">Analysing</span><i class="bk-fl-scan"></i>';
      el.style.transform = T(g.pile.x, g.pile.y, (g.pw / g.now.w).toFixed(3)); S.el.appendChild(el);
      await fly(el, T(g.now.x, g.now.y, 1), sp(420, 260));
      el.classList.add('is-now');
      var sees = p.sees && p.sees.length ? p.sees.slice() : null, of = [n, S.total];
      c.set('scan', {step:0, of:of});
      await sleep(sp(700, 240));
      c.set('structure', {step:1, of:of, sees:sees});
      await sleep(sp(900, 280));
      if(it.k !== 'help'){
        var room = nameOf(it.k), r = roomOf(it.k), size = null, note = '', skip = !(r && sizeable(r));
        c.set('identify', {step:2, room:room, sees:sees});
        await sleep(sp(700, 260));
        if(!skip){
          c.set('dims', {step:3, room:room, sees:sees});
          /* The size is measured for the room from its photos; wait for it briefly, show it only when it is real */
          var t0 = Date.now(); while(measuring[it.k] && Date.now() - t0 < 2200) await sleep(120);
          var s0 = h.sizes[it.k];
          if(s0 && s0.l) size = {l:s0.l, w:s0.w, verified:!(s0.src === 'photo' && !s0.ok)};
          else note = h.measured[it.k] === 'none' ? 'Could not estimate it from these photos' : 'Not estimated yet';
          c.set('dims', {step:3, room:room, sees:sees, size:size, note:note});
          await sleep(sp(900, 300));
        }
        c.set('done', {room:room, sees:sees, size:size, note:skip ? 'Not measured outside' : note, skipDims:skip});
      } else {
        c.set('unsure', {step:2, alts:(p.alts || []).filter(function(k){ return roomOf(k); }).slice(0, 2).map(nameOf), newType:p.newType ? typeName(p.newType) : '', sees:sees});
      }
      await sleep(sp(700, 220));
      el.classList.remove('is-now');
      var b = tileAt(it.k).r, sc = Math.min(b.w / g.now.w, b.h / g.now.h);
      await fly(el, T(b.x + (b.w - g.now.w * sc) / 2, b.y + (b.h - g.now.h * sc) / 2, sc.toFixed(3)), sp(520, 340));
      el.remove(); S.playing = null; land(it, true); header();
      await sleep(sp(200, 60));
    }
    async function pump(){
      var S = stg; if(S.busy) return; S.busy = true;
      while(S.queue.length && S.el.isConnected){
        var it = S.queue.shift(), n = Object.keys(S.landed).length, now = batch().filter(function(x){ return x.p.id === it.id; })[0];
        if(!now || (now.s !== 'placed' && now.s !== 'unsure')) continue;
        it.k = now.s === 'placed' ? now.k : 'help';
        if(A.reduce || !S.el.offsetWidth){ land(it); continue; }
        await play(it, n < 2, S.queue.length > 8 ? .4 : S.queue.length > 4 ? .5 : S.queue.length > 1 ? .75 : 1);
      }
      S.busy = false; S.playing = null;
      if(S.el.isConnected && !h.sortedOnce) drawSorting();
    }
    /* ---- questions on the stage, for the photos it could not place ---- */
    function cardXY(c){ var g = stg.g, cw = c.offsetWidth; return T(g.narrow ? (g.W - cw) / 2 : 20 + (+c.dataset.slot) * (cw + 16), g.now.y - 6); }
    function popCard(p){
      var S = stg, used = Object.keys(S.cards).map(function(id){ return +S.cards[id].dataset.slot; }), slot = used.indexOf(0) < 0 ? 0 : 1, k = pickParts(p);
      var c = doc.createElement('div'); c.className = 'bk-fc'; c.dataset.slot = slot; c.setAttribute('role', 'group'); c.setAttribute('aria-label', 'Which room is this photo?');
      c.innerHTML = '<div class="bk-fc-in"><img src="' + p.src + '" alt="' + RI.esc(p.name || 'Photo') + '"><b>Which room is this?</b><small>' + k.q + '</small>' + k.html + '</div>';
      S.el.appendChild(c); RI.fillIcons(c); S.cards[p.id] = c;
      var hb = tileAt('help').r; c.style.transform = cardXY(c);
      if(!A.reduce) c.animate([{transform:T(hb.x, hb.y, .2), opacity:0}, {transform:c.style.transform, opacity:1}], {duration:620, delay:slot * 160, easing:'cubic-bezier(.2,.7,.2,1.15)', fill:'backwards'});
    }
    function unCard(id, k){
      var S = stg, c = S.cards[id]; delete S.cards[id];
      function done(){ c.remove(); if(k) land({id:id, k:k}, true); else { delete S.landed[id]; drawTiles(); } if(S.el.isConnected && !h.sortedOnce) drawSorting(); }
      if(A.reduce || !k){ if(!k && !A.reduce) c.animate([{opacity:1}, {opacity:0}], {duration:240, fill:'forwards'}).onfinish = done; else done(); return; }
      var b = tileAt(k).r, cw = c.offsetWidth, chh = c.offsetHeight;
      c.animate([{transform:c.style.transform, opacity:1}, {transform:T(b.x + b.w / 2 - cw / 2, b.y + b.h / 2 - chh / 2, (b.h / chh).toFixed(3)), opacity:0}], {duration:560, easing:EIN, fill:'forwards'}).onfinish = done;
    }
    function fadeCard(id){ var c = stg.cards[id]; delete stg.cards[id]; if(A.reduce) c.remove(); else c.animate([{opacity:1}, {opacity:0}], {duration:200, fill:'forwards'}).onfinish = function(){ c.remove(); }; }
    function header(){
      var S = stg, list = S.list || [], tot = S.total || 0, read = Object.keys(S.landed).length, left = Math.max(0, tot - read), b, sm, act;
      var fails = list.filter(function(x){ return x.s === 'fail'; }).length, up = list.filter(function(x){ return x.s === 'up'; }).length, nU = Object.keys(S.landed).filter(function(id){ return S.landed[id] === 'help'; }).length;
      if(S.finishing){ b = 'All sorted'; sm = 'Every photo is in a room'; act = ''; }
      else if(S.asking){ b = nU + ' photo' + (nU === 1 ? ' needs' : 's need') + ' your input'; sm = 'Tap the room ' + (nU === 1 ? 'it' : 'each one') + ' shows'; act = 'later'; }
      else { b = 'Reading your photos'; sm = read + ' of ' + tot + ' read' + (left ? ' · about ' + Math.max(5, Math.round(left * 1.6 / 5) * 5) + ' seconds left' : '') + (up ? ' · ' + up + ' uploading' : ''); act = 'add'; }
      var hb = S.el.querySelector('#bk-sh-b'); if(hb.textContent !== b) hb.textContent = b;
      S.el.querySelector('#bk-sh-s').innerHTML = RI.esc(sm) + (fails ? ' · ' + fails + ' did not upload <button type="button" class="linkbtn small" data-retryall="unsorted">Retry</button>' : '');
      if(S.act !== act){
        S.act = act;
        S.el.querySelector('#bk-sh-a').innerHTML = act === 'add' ? '<label class="btn btn-secondary btn-sm file-btn">' + RI.icon('plus','i-sm') + 'Add more<input type="file" accept="' + ACCEPT + '" multiple data-room="unsorted"></label>' :
          act === 'later' ? '<button type="button" class="linkbtn small" id="bk-later">Place them later</button>' : '';
        RI.fillIcons(S.el.querySelector('#bk-sh-a'));
      }
    }
    /* ---- called on every change: new results join the queue, answers go to their room, then questions or done ---- */
    function drawSorting(){
      var S = stage(); if(!S.el || !S.el.offsetWidth) return;
      if(!S.g) geo();
      var list = batch(), by = {};
      list.forEach(function(x){ by[x.p.id] = x; if(x.p.src) S.src[x.p.id] = x.p.src; });
      S.list = list; S.total = list.filter(function(x){ return x.s !== 'fail'; }).length;
      function kOf(x){ return !x ? null : x.s === 'placed' ? x.k : x.s === 'unsure' ? 'help' : null; }
      /* Opened with results already in (a reload): they count, without playing again */
      if(S.first){ list.forEach(function(x){ var k = kOf(x); if(k){ S.seen[x.p.id] = true; S.landed[x.p.id] = k; } }); S.first = false; drawTiles(); }
      list.forEach(function(x){ var k = kOf(x); if(k && !S.seen[x.p.id]){ S.seen[x.p.id] = true; S.queue.push({id:x.p.id, p:x.p, k:k}); } });
      S.queue = S.queue.filter(function(it){ return by[it.id]; });
      /* A photo that changed after it landed: answered (Needs your input -> a room), or taken out */
      Object.keys(S.landed).forEach(function(id){
        var k = kOf(by[id]); if(k === S.landed[id]) return;
        if(S.cards[id]) unCard(id, k); else { if(k) S.landed[id] = k; else delete S.landed[id]; drawTiles(); }
      });
      var busy = working() || S.queue.length > 0 || S.busy || list.some(function(x){ return x.s === 'up' || x.s === 'reading'; }), unsure = list.filter(function(x){ return x.s === 'unsure'; });
      S.asking = !busy && unsure.length > 0 && !S.finishing;
      if(!S.asking) Object.keys(S.cards).forEach(function(id){ if(by[id] && by[id].s === 'unsure') fadeCard(id); });
      else unsure.forEach(function(x){ if(!S.cards[x.p.id] && Object.keys(S.cards).length < (S.g.narrow ? 1 : 2)) popCard(x.p); });
      S.el.classList.toggle('asking', !!S.asking); S.core.dim(!!S.asking);
      drawPile(list);
      if(!S.busy && !S.finishing){
        if(S.asking) S.core.set('ask', {count:unsure.length});
        else S.core.set('idle', {});
      }
      /* Everything has a room: the orb settles with a check, then the rooms */
      if(!busy && !unsure.length && S.total && !S.finishing){
        S.finishing = true; S.core.set('all', {});
        setTimeout(function(){ if(!S.el.isConnected) return; h.sortedOnce = true; A.put(h); drawPhase(); }, A.reduce ? 0 : 1600);
      }
      header();
      if(S.queue.length && !S.busy) pump();
    }
    function relayout(){
      if(!main.isConnected){ removeEventListener('resize', relayout); return; }
      if(!stg || !stg.el.offsetWidth) return;
      geo(); drawPile(stg.list || []);
      Object.keys(stg.cards).forEach(function(id){ stg.cards[id].style.transform = cardXY(stg.cards[id]); });
    }
    addEventListener('resize', relayout);
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
          (n ? (sugIn(key) === n ? '<span class="rc3-ready is-sug">' + RI.icon('eye','i-sm') + 'Check</span>' : '<span class="rc3-ready">' + RI.icon('check','i-sm') + 'Ready</span>') + '<span class="rc3-cnt">' + RI.icon('camera','i-sm') + n + ' photo' + (n === 1 ? '' : 's') + '</span>' : '') +
          '<button type="button" class="rc3-edit" data-edit="' + key + '">' + RI.icon('pencil','i-sm') + 'Edit<span class="sr"> ' + nm + ' photos</span></button>' +
          (rest.length ? '<span class="rc3-mini" aria-hidden="true">' + rest.slice(0, 2).map(function(p){ return '<span><img src="' + p.src + '" alt=""></span>'; }).join('') + (more > 0 ? '<span class="more">+' + more + '</span>' : '') + '</span>' : '') +
          (up.length ? '<span class="rc3-up" data-p="' + up[0].id + '"><span>Uploading ' + up.length + ' photo' + (up.length === 1 ? '' : 's') + '</span><span class="th-bar"><i style="width:' + (up[0].pct || 0) + '%"></i></span></span>' : '');
      } else {
        var r0 = roomOf(key), gone = noRoomOk(key);
        m.innerHTML = '<div class="rc3-empty"><input type="file" accept="' + ACCEPT + '" multiple data-room="' + key + '" tabindex="-1" aria-hidden="true">' +
          '<span class="rc3-e-ic">' + RI.icon(r0 ? iconFor(r0) : 'camera') + '</span><span class="rc3-e-t"><b class="bk-none">No photos yet</b><span>Without photos this room shows as unverified.</span></span>' +
          '<span class="rc3-e-btns"><label class="rc3-chip">' + RI.icon('upload','i-sm') + 'Upload<input type="file" accept="' + ACCEPT + '" multiple data-room="' + key + '" aria-label="Upload photos of ' + nm + '"></label>' +
            '<label class="rc3-chip">' + RI.icon('camera','i-sm') + 'Camera<input type="file" accept="image/*" capture="environment" data-room="' + key + '" aria-label="Take a photo of ' + nm + '"></label></span>' +
          (gone ? '<button type="button" class="linkbtn small bk-noroom" data-noroom="' + key + '">There is no ' + nm + '</button>' : '') + '</div>';
      }
      var auto = done.some(function(p){ return p.auto; }), hint = sec.querySelector('.rc3-hint');
      if(hint) hint.innerHTML = n ? n + ' photo' + (n === 1 ? '' : 's') + (auto ? ' · sorted for you' : '') : A.hintFor((roomOf(key) || [])[2] || key);
      var dup = sec.querySelector('.bk-dup'); if(dup) dup.hidden = !done.some(function(p){ return (p.flags || []).indexOf('near') > -1; });
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
      return {rooms:rs.length, withP:withP, sizes:sz, est:est, unver:rs.length - withP, unsorted:(h.photos.unsorted || []).filter(function(p){ return p.state === 'done' && !reading[p.id]; }).length};
    }
    function totals(){
      var c = counts();
      var inRooms = A.photoCount(h), added = inRooms + c.unsorted;
      if(main.querySelector('#ph-total')) main.querySelector('#ph-total').innerHTML = added ? '<span class="up3-ok"><span class="c">' + RI.icon('check') + '</span>' + added + ' photo' + (added === 1 ? '' : 's') + ' added · ' + (c.unsorted ? inRooms + ' in rooms' : 'all in rooms') + '</span>' : '';
      var rs = rooms.filter(function(r){ return r[0] !== 'other' || A.photoCount(h, 'other'); });
      var none = !added && !Object.keys(pending).some(function(k){ return pending[k].length; });
      var wb = doc.querySelector('.wiz-bar'); if(wb) wb.classList.toggle('wb-empty', none);
      main.querySelector('#rp3-prog').innerHTML = none ? '' : '<p><b>' + c.withP + ' of ' + c.rooms + ' rooms</b> have photos</p><span class="rp3-seg" aria-hidden="true">' + rs.map(function(r, i){ return '<i' + (i < c.withP ? ' class="on"' : '') + '></i>'; }).join('') + '</span>';
      var fl = {small:0, blurry:0, near:0}; Object.keys(h.photos).forEach(function(k){ (h.photos[k] || []).forEach(function(p){ (p.flags || []).forEach(function(x){ if(fl[x] != null) fl[x]++; }); }); });
      var parts = []; if(fl.blurry) parts.push(fl.blurry + ' may be blurry'); if(fl.small) parts.push(fl.small + ' too small'); if(fl.near) parts.push(fl.near + ' look' + (fl.near > 1 ? '' : 's') + ' like another photo');
      main.querySelector('#flags-sum').innerHTML = parts.length ? '<p class="rp2-flags">' + RI.icon('eye','i-sm') + '<span><b>' + parts.join(', ') + '.</b> They are kept. ' + (fl.near && !fl.blurry && !fl.small ? 'You can remove extras.' : 'A sharper photo helps.') + '</span></p>' : '';
      RI.fillIcons(main.querySelector('#flags-sum'));
      var bar = doc.getElementById('sub-sum');
      if(bar && none) bar.innerHTML = '<span class="sb-short"><b>Add photos</b> to start</span><span class="sb-long"><b>Add your photos to start.</b> We sort them into rooms for you.</span>';
      else if(bar) bar.innerHTML = '<span class="sb-short"><b>' + c.withP + '/' + c.rooms + '</b> rooms with photos</span><span class="sb-long"><b>' + c.withP + ' of ' + c.rooms + '</b> rooms have photos<span class="sb-dot">·</span>' + c.sizes + ' size' + (c.sizes === 1 ? '' : 's') + (c.est ? ', ' + c.est + ' to confirm' : '') + (c.unsorted ? '<span class="sb-dot">·</span>' + c.unsorted + ' photo' + (c.unsorted === 1 ? '' : 's') + ' to place' : '') + (c.unver ? '<span class="sb-dot">·</span><span class="sb-un">' + c.unver + ' will show as unverified</span>' : '') + '</span>';
      metaRefresh(h); drawPhase();
    }
    function all(){ rooms.forEach(function(r){ drawRoom(r[0]); }); drawUnsorted(); totals(); dots(); }
    function upload(p, key){
      p.state = 'up'; p.pct = 0; if(!p.n){ h.seq = (h.seq || 0) + 1; p.n = h.seq; } (pending[key] = pending[key] || []).push(p);
      var fail = !p.retried && Math.random() < .09, dur = 700 + Math.random() * 900, t0 = performance.now();
      drawRoom(key); if(!pending[key].some(function(x){ return x !== p; })) totals();
      (function tick(now){
        var k = Math.min(1, (now - t0) / dur); p.pct = Math.round(k * (fail ? 62 : 100));
        doc.querySelectorAll('[data-p="' + p.id + '"] .th-bar i').forEach(function(bar){ bar.style.width = p.pct + '%'; });
        if(k < 1){ requestAnimationFrame(tick); return; }
        pending[key] = (pending[key] || []).filter(function(x){ return x !== p; });
        if(p.drop){ drawRoom(key); totals(); return; }
        if(fail){ p.state = 'fail'; (pending[key] = pending[key] || []).push(p); }
        else { p.state = 'done'; delete p.pct; (h.photos[key] = h.photos[key] || []).push(p); if(p.fp) h.fps.push(p.fp); saved(h); }
        drawRoom(key); totals(); if(p.state === 'done') (key === 'unsorted' ? read(p) : maybeMeasure(key)); else if(key === 'unsorted') drawUnsorted();
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
        var sug = ''; /* the room is decided by reading the photo once it is in (read, below) */
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
    function move(from, id, to, auto){
      var p = (h.photos[from] || []).filter(function(x){ return x.id === id; })[0]; if(!p || from === to) return;
      h.photos[from] = h.photos[from].filter(function(x){ return x.id !== id; }); delete p.suggest; delete p.unsure; delete p.alts; if(!auto) delete p.sug; (h.photos[to] = h.photos[to] || []).push(p);
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
    /* ---------- The room window (make-ui, Nov 2026): one place to change a room. Photos (cover, move, remove, add), Size
       (with whether it is our estimate, confirmed, or yours, and Looks right), Note. Nothing changes until Save changes;
       the footer says what will change. Cancel also takes back photos added here. A full-screen sheet on a phone. ---------- */
    var editing = null;
    function sizeState(key, l, w, ok){
      var s0 = h.sizes[key];
      if(!l && !w) return s0 ? ['off', 'Will be cleared'] : ['none', 'No size yet'];
      if(s0 && s0.l === l && s0.w === w){ if(s0.src === 'user') return ['ok', 'Your size']; return ok || s0.ok ? ['ok', 'Confirmed'] : ['est', 'Estimate from your photos']; }
      return ['ok', 'Your size'];
    }
    function editRoom(key, focusTo){
      var r = roomOf(key); if(!r) return;
      var before = {}; (h.photos[key] || []).concat(pending[key] || []).forEach(function(p){ before[p.id] = true; });
      var s0 = h.sizes[key] || {}, nm = RI.esc(r[1]), canSize = sizeable(r);
      var ed = editing = {key:key, rm:{}, mv:{}, cover:(coverOf(key) || {}).id || null, cover0:(coverOf(key) || {}).id || null, before:before, saved:false, szOk:false, note0:h.notes[key] || ''};
      var d = A.dialog(nm,
        '<section class="ed-sec" aria-labelledby="ed-h-ph"><div class="ed-sh"><h3 id="ed-h-ph">Photos</h3><small>Tap a photo to make it the cover.</small></div><div id="ed-grid"></div></section>' +
        /* Size (Nov 2026 redesign): labelled Length and Width with ft inside the box, the floor area beside the heading,
           and one status strip under the boxes (our estimate with Looks right, confirmed, yours, none, or cleared) */
        (canSize ? '<section class="ed-sec" id="ed-s-size" aria-labelledby="ed-h-sz"><div class="ed-sh"><h3 id="ed-h-sz">Size</h3><span class="ed-area" id="ed-area"></span></div>' +
          '<div class="ed-szr"><label class="ed-fld"><span>Length</span><span class="ed-in"><input class="input" id="ed-l" inputmode="decimal" autocomplete="off" aria-describedby="ed-err" value="' + (s0.l || '') + '"><i aria-hidden="true">ft</i></span></label>' +
          '<span class="ed-x" aria-hidden="true">×</span>' +
          '<label class="ed-fld"><span>Width</span><span class="ed-in"><input class="input" id="ed-w" inputmode="decimal" autocomplete="off" aria-describedby="ed-err" value="' + (s0.w || '') + '"><i aria-hidden="true">ft</i></span></label></div>' +
          '<p class="err" id="ed-err"></p><div class="ed-stat" id="ed-stat" aria-live="polite"></div></section>' : '') +
        '<section class="ed-sec" aria-labelledby="ed-h-n"><div class="ed-sh"><h3 id="ed-h-n"><label for="ed-t">Note</label></h3><small>Optional</small></div>' +
          '<textarea class="input" id="ed-t" maxlength="140" rows="2" placeholder="For example: a water stain on the ceiling" aria-describedby="ed-ncnt">' + RI.esc(h.notes[key] || '') + '</textarea><span class="ed-ncnt" id="ed-ncnt"></span></section>' +
        '<div class="ed-foot"><p class="ed-chg" id="ed-chg" aria-live="polite"></p><span class="ed-btns"><button type="button" class="btn btn-secondary" data-dlg-close>Cancel</button><button type="button" class="btn btn-primary" id="ed-save">' + RI.icon('check','i-sm') + 'Save changes</button></span></div>',
        {wide:true, onClose:function(){ if(!ed.saved) edRevert(ed); if(editing === ed) editing = null; }});
      d.classList.add('ed-dlg');
      d.querySelector('.dlg-head').innerHTML = '<span class="ed-ic" aria-hidden="true">' + RI.icon(iconFor(r)) + '</span><div class="ed-ht"><h2>' + nm + '</h2><p class="ed-sub" id="ed-sub"></p></div>' +
        '<button class="icon-btn" type="button" data-dlg-close aria-label="Close">' + RI.icon('x') + '</button>';
      d.appendChild(d.querySelector('.ed-foot'));
      ed.d = d;
      d.addEventListener('change', function(e){
        var t = e.target;
        if(t.matches('[data-edroom]')){ addFiles(t.files, key); t.value = ''; return; }
        if(t.matches('[data-edmove]') && t.value){ ed.mv[t.getAttribute('data-edmove')] = t.value; drawEd(); }
      });
      d.addEventListener('input', function(e){ if(e.target.matches('#ed-l, #ed-w')){ ed.szOk = false; var er = d.querySelector('#ed-err'); if(er) er.textContent = ''; d.querySelectorAll('#ed-l, #ed-w').forEach(function(x){ x.removeAttribute('aria-invalid'); }); } if(e.target.matches('#ed-l, #ed-w, #ed-t')) drawEd(); });
      d.addEventListener('click', function(e){
        var c = e.target.closest('[data-cover]'); if(c){ ed.cover = c.getAttribute('data-cover'); drawEd(); return; }
        var rm = e.target.closest('[data-edrm]'); if(rm){ ed.rm[rm.getAttribute('data-edrm')] = true; drawEd(); return; }
        if(e.target.closest('#ed-undo')){ ed.rm = {}; ed.mv = {}; ed.cover = ed.cover0; drawEd(); return; }
        if(e.target.closest('#ed-szok')){ ed.szOk = true; drawEd(); d.querySelector('#ed-save').focus(); return; }
        var dl = e.target.closest('[data-del]'); if(dl){ delPhoto(key, dl.getAttribute('data-del')); return; }
        var rt = e.target.closest('[data-retry]'); if(rt){ retry(key, rt.getAttribute('data-retry')); return; }
        if(e.target.closest('#ed-save')) edSave(ed);
      });
      d.addEventListener('dragover', function(e){ e.preventDefault(); d.classList.add('over'); });
      d.addEventListener('dragleave', function(e){ if(!d.contains(e.relatedTarget)) d.classList.remove('over'); });
      d.addEventListener('drop', function(e){ e.preventDefault(); d.classList.remove('over'); if(e.dataTransfer.files.length) addFiles(e.dataTransfer.files, key); });
      drawEd();
      /* From the size Edit on the card: straight to Size, the first box selected */
      if(focusTo === 'size' && canSize) setTimeout(function(){ var sz = d.querySelector('#ed-s-size'), li = d.querySelector('#ed-l'); sz.scrollIntoView({block:'center'}); li.focus({preventScroll:true}); var n = li.value.length; li.setSelectionRange(n, n); }, 60);
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
          '<span class="ed-acts"><label class="ed-mv">' + RI.icon('arrow','i-sm') + '<span class="ed-mv-t">Move</span><select data-edmove="' + p.id + '" aria-label="Move this photo to another room"><option value="">Move to</option>' +
            rooms.filter(function(r){ return r[0] !== key; }).map(function(r){ return '<option value="' + r[0] + '">' + RI.esc(r[1]) + '</option>'; }).join('') + '<option value="unsorted">Back to not sorted</option></select></label>' +
          '<button type="button" class="ed-del" data-edrm="' + p.id + '" aria-label="Remove this photo">' + RI.icon('trash','i-sm') + '</button></span></li>';
      }
      var grid = d.querySelector('#ed-grid'), had = grid.contains(doc.activeElement) && doc.activeElement.matches('[data-edroom]');
      grid.innerHTML = '<ul class="ed-list">' + order.map(tile).join('') + pd.map(function(p){ return '<li class="ed-ph">' + thumb(p, key) + '</li>'; }).join('') +
        '<li class="ed-add"><label class="ed-add-up">' + RI.icon('upload') + '<b>Add photos</b><span class="ed-drag">or drag here</span><input type="file" accept="' + ACCEPT + '" multiple data-edroom="' + key + '" aria-label="Add photos"></label>' +
          '<label class="ed-add-cam">' + RI.icon('camera','i-sm') + 'Camera<input type="file" accept="image/*" capture="environment" data-edroom="' + key + '" aria-label="Take a photo"></label></li></ul>';
      RI.fillIcons(grid);
      if(had){ var fi = grid.querySelector('.ed-add-up input'); if(fi) fi.focus(); }
      /* Size: what it is now, and whether Looks right is still a question */
      var li = d.querySelector('#ed-l'), wi = d.querySelector('#ed-w'), l = li ? parseFloat(li.value) || 0 : 0, w = wi ? parseFloat(wi.value) || 0 : 0;
      if(li){
        var st = sizeState(key, l, w, ed.szOk), sb = d.querySelector('#ed-stat');
        sb.className = 'ed-stat is-' + st[0];
        sb.innerHTML = st[0] === 'est' ? RI.icon('ruler','i-sm') + '<span><b>Our estimate</b> from your photos. Change it if it is off.</span><button type="button" class="btn btn-secondary btn-sm" id="ed-szok">' + RI.icon('check','i-sm') + 'Looks right</button>'
          : st[0] === 'ok' ? RI.icon('check','i-sm') + '<span><b>' + st[1] + '</b>' + (st[1] === 'Confirmed' ? ', you said it looks right.' : ', as you typed it.') + '</span>'
          : st[0] === 'off' ? RI.icon('info','i-sm') + '<span>The size will be cleared when you save.</span>'
          : RI.icon('ruler','i-sm') + '<span>No size yet. Add it if you know it.</span>';
        RI.fillIcons(sb);
        d.querySelector('#ed-area').textContent = l > 2 && w > 2 ? (st[0] === 'est' ? 'About ' : '') + Math.round(l * w).toLocaleString() + ' sq ft' : '';
      }
      var nt = d.querySelector('#ed-t'); d.querySelector('#ed-ncnt').textContent = nt.value.length + ' / 140';
      /* The header line and what Save will do */
      var added = done.concat(pd).filter(function(p){ return !ed.before[p.id]; }).length, rmN = Object.keys(ed.rm).length, mvTo = {}, parts = [];
      Object.keys(ed.mv).forEach(function(id){ var t = ed.mv[id]; mvTo[t] = (mvTo[t] || 0) + 1; });
      if(added) parts.push(added + ' added');
      if(rmN) parts.push(rmN + ' removed');
      Object.keys(mvTo).forEach(function(t){ parts.push(mvTo[t] + ' moved to ' + (t === 'unsorted' ? 'not sorted' : RI.esc(nameOf(t)))); });
      if(ed.cover !== ed.cover0 && cv) parts.push('new cover');
      var s0 = h.sizes[key] || {};
      if(li){ if(l !== (s0.l || 0) || w !== (s0.w || 0)) parts.push(l || w ? 'size changed' : 'size cleared'); else if(ed.szOk && s0.l && !s0.ok) parts.push('size confirmed'); }
      if(d.querySelector('#ed-t').value.trim() !== ed.note0) parts.push('note changed');
      var photoUndo = rmN || Object.keys(ed.mv).length || ed.cover !== ed.cover0;
      d.querySelector('#ed-chg').innerHTML = parts.length ? '<span>' + parts.join(' · ').replace(/^./, function(c){ return c.toUpperCase(); }) + '</span>' + (photoUndo ? '<button type="button" class="linkbtn small" id="ed-undo">Undo photo changes</button>' : '') : '<span class="ed-none">No changes yet</span>';
      d.querySelector('#ed-sub').textContent = done.length + ' photo' + (done.length === 1 ? '' : 's') + (li && l && w ? ' · ' + (sizeState(key, l, w, ed.szOk)[0] === 'est' ? 'about ' : '') + l + ' × ' + w + ' ft' : '');
    }
    function edSave(ed){
      var key = ed.key, d = ed.d, r = roomOf(key);
      var li = d.querySelector('#ed-l'), wi = d.querySelector('#ed-w');
      if(li && sizeable(r)){
        var l = parseFloat(li.value), w = parseFloat(wi.value), any = li.value.trim() || wi.value.trim();
        if(any && !(l > 2 && l < 80 && w > 2 && w < 80)){ d.querySelector('#ed-err').textContent = 'Use feet, from 3 to 79, for both.'; li.setAttribute('aria-invalid', 'true'); wi.setAttribute('aria-invalid', 'true'); li.focus(); return; }
        var prev = h.sizes[key], same = prev && prev.l === l && prev.w === w;
        if(any && !same){ h.sizes[key] = {l:l, w:w, src:'user', ok:true}; h.measured[key] = 'user'; }
        else if(any && same && ed.szOk){ prev.ok = true; }
        else if(!any && prev){ delete h.sizes[key]; h.measured[key] = 'cleared'; }
      }
      var note = d.querySelector('#ed-t').value.trim(); if(note) h.notes[key] = note; else delete h.notes[key];
      ed.saved = true; editing = null;
      Object.keys(ed.rm).forEach(function(id){ delPhoto(key, id); });
      Object.keys(ed.mv).forEach(function(id){ move(key, id, ed.mv[id]); });
      if(ed.cover && (h.photos[key] || []).some(function(p){ return p.id === ed.cover; })){ h.covers = h.covers || {}; h.covers[key] = ed.cover; }
      confirmRoom(key); /* saving the window means the room was checked */
      saved(h); drawRoom(key); drawUnsorted(); totals(); d.close(); RI.toast(nameOf(key) + ' saved.', 'check'); maybeMeasure(key);
      var eb = main.querySelector('.rc2[data-room="' + key + '"] .rc3-edit'); if(eb) eb.focus();
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
      if(t.id === 'plans' || t.hasAttribute('data-plans')){ addPlans(t.files); t.value = ''; return; }
      if(t.type === 'file' && t.getAttribute('data-room')){ addFiles(t.files, t.getAttribute('data-room')); t.value = ''; return; }
      if(t.id === 'bulk-to') bulkTo = t.value;
      if(t.id === 'bk-rights'){ main.querySelector('#bk-ok').classList.remove('is-err'); main.querySelector('#bk-ok-err').textContent = ''; }
      if(t.id === 'bk-rights'){ if(t.checked){ h.rights = true; h.consents.rights = {at:Date.now(), version:RIGHTS.version, text:RIGHTS.text}; } else h.rights = false; saved(h); }
    });
    main.addEventListener('click', function(e){
      /* No tick, no upload (APP_FLOW): the file picker does not open; the tick says so and takes the focus */
      if(e.target.matches && e.target.matches('#bk-drop input[type=file]') && !h.rights){
        e.preventDefault();
        var okl = main.querySelector('#bk-ok'), cb = main.querySelector('#bk-rights');
        okl.classList.remove('is-err'); void okl.offsetWidth; okl.classList.add('is-err');
        main.querySelector('#bk-ok-err').textContent = 'Tick this first to add your photos.';
        cb.focus({preventScroll:true}); if(okl.getBoundingClientRect().top < 80) okl.scrollIntoView({block:'center', behavior:A.reduce ? 'auto' : 'smooth'});
        return;
      }
      if(e.target.closest('#bk-rmore')){ var rb = main.querySelector('#bk-rbox'), op = !rb.classList.contains('is-open'); rb.classList.toggle('is-open', op); e.target.closest('#bk-rmore').setAttribute('aria-expanded', String(op)); e.target.closest('#bk-rmore').textContent = op ? 'Show less' : 'Show all'; return; }
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
      if(acc){ var an = nameOf(acc.getAttribute('data-to')); move('unsorted', acc.getAttribute('data-accept'), acc.getAttribute('data-to')); RI.toast('Moved to ' + an + '.', 'check'); var nxt = main.querySelector('#unsorted .bk-chip'); if(nxt) nxt.focus(); return; }
      if(e.target.closest('#accept-all')){ (h.photos.unsorted || []).slice().forEach(function(p){ if(p.suggest) move('unsorted', p.id, p.suggest); }); RI.toast('Suggestions accepted.'); return; }
      if(del) delPhoto(del.getAttribute('data-room'), del.getAttribute('data-del'));
      if(re) retry(re.getAttribute('data-room'), re.getAttribute('data-retry'));
      var pok = e.target.closest('[data-psok]'); if(pok){ var pk = pok.getAttribute('data-psok'), pn = sugIn(pk); confirmRoom(pk); saved(h); drawRoom(pk); drawUnsorted(); totals(); maybeMeasure(pk); var ps2 = main.querySelector('.rc2[data-room="' + pk + '"] .rc3-edit'); if(ps2) ps2.focus(); RI.toast(nameOf(pk) + ': ' + pn + ' photo' + (pn === 1 ? '' : 's') + ' confirmed.', 'check'); return; }
      var pfx = e.target.closest('[data-psfix]'); if(pfx){ editRoom(pfx.getAttribute('data-psfix')); return; }
      if(e.target.closest('[data-psall]')){ var cn = 0; rooms.forEach(function(r){ var x = sugIn(r[0]); if(x){ cn += x; confirmRoom(r[0]); } }); saved(h); all(); rooms.forEach(function(r){ maybeMeasure(r[0]); }); RI.toast(cn + ' photo' + (cn === 1 ? '' : 's') + ' confirmed in their rooms.', 'check'); return; }
      var szok = e.target.closest('[data-szok]'); if(szok){ var sk = szok.getAttribute('data-szok'); if(h.sizes[sk]){ h.sizes[sk].ok = true; saved(h); foot(sk); totals(); var sm = main.querySelector('.rc2[data-room="' + sk + '"] .rc3-edit'); if(sm) sm.focus(); RI.toast(nameOf(sk) + ': ' + h.sizes[sk].l + ' × ' + h.sizes[sk].w + ' ft confirmed.', 'check'); } return; }
      var sze = e.target.closest('[data-szedit]'); if(sze){ editRoom(sze.getAttribute('data-szedit'), 'size'); return; }
      if(e.target.closest('#sample')){
        /* Team only: a mixed bulk set lands in the tray, is read, and each photo moves to its room */
        if(!h.rights){ h.rights = true; h.consents.rights = {at:Date.now(), version:RIGHTS.version, text:RIGHTS.text}; }
        var added = 0, types = {}; rooms.forEach(function(r){ if(!A.photoCount(h, r[0])) types[r[2] || r[0]] = true; });
        SAMPLE_BULK.forEach(function(x, i){
          var fp = 'sample|' + x[0]; if(x[1] !== '?' && !types[x[1]]) return; if(h.fps.indexOf(fp) > -1) return;
          upload({id:A.uid('p'), name:'IMG_' + (4101 + i) + '.jpg', src:RI.img(x[0]), fp:fp, retried:true, demo:x[1], demoSees:x[2], demoAlts:x[1] === '?' ? ['living','basement','bedrooms'] : null}, 'unsorted'); added++;
        });
        RI.toast(added ? added + ' sample photos added. Watch them sort themselves.' : 'The sample photos are already in.');
      }
      if(e.target.closest('#add-room')) roomPicker();
      var nr = e.target.closest('[data-newroom]'); if(nr){ roomPicker(nr.getAttribute('data-newroom')); return; }
      var nt = e.target.closest('[data-newtype]'); if(nt){ addRoomFor(nt.getAttribute('data-newtype'), typeName(nt.getAttribute('data-newtype')), nt.getAttribute('data-p')); return; }
      var nx = e.target.closest('[data-notroom]'); if(nx){ delPhoto('unsorted', nx.getAttribute('data-notroom')); RI.toast('Photo taken out. It is not used.'); return; }
      var nb = e.target.closest('[data-noroom]'); if(nb){ noRoom(nb.getAttribute('data-noroom')); return; }
      if(e.target.closest('#bk-later')){ h.sortedOnce = true; A.put(h); drawPhase(); return; }
      var vp = e.target.closest('[data-viewplan]'); if(vp) viewPlan(+vp.getAttribute('data-viewplan'));
      var rp = e.target.closest('[data-rmplan]'); if(rp){ var box = rp.closest('.pl-box'), nm = h.plans[+rp.getAttribute('data-rmplan')].name; h.plans.splice(+rp.getAttribute('data-rmplan'), 1); saved(h); plans(); planErr(''); var ad = box.querySelector('.pl-add input'); if(ad) ad.focus(); RI.toast(nm + ' removed.'); }
      var dr = e.target.closest('[data-delroom]'); if(dr){ var key = dr.getAttribute('data-delroom'), n = A.photoCount(h, key);
        var go = function(){ h.extraRooms = (h.extraRooms || []).filter(function(x){ return x.key !== key; }); delete h.photos[key]; delete h.sizes[key]; delete h.notes[key]; saved(h); A.render(); };
        if(n) A.confirm('Remove this room?', 'Its ' + n + ' photo' + (n > 1 ? 's are' : ' is') + ' removed too.', 'Remove room', go, true); else go(); }
      if(e.target.closest('#rc2-next')){ var g = main.querySelector('#rc2-grid'); g.scrollTo({left:step() * (Math.round(g.scrollLeft / step()) + 1), behavior:A.reduce ? 'auto' : 'smooth'}); }
      var dt = e.target.closest('[data-dot]'); if(dt){ var g2 = main.querySelector('#rc2-grid'); g2.scrollTo({left:step() * +dt.getAttribute('data-dot'), behavior:A.reduce ? 'auto' : 'smooth'}); }
    });
    /* Drag and drop: files from the computer onto the tray or a room; sorted photos from the tray onto a room */
    main.addEventListener('dragstart', function(e){ var th = e.target.closest('[data-drag]'); if(th){ e.dataTransfer.setData('text/plain', 'ri:' + th.getAttribute('data-drag')); e.dataTransfer.effectAllowed = 'move'; } });
    function dropTarget(e){ return e.target.closest('.rc2') || e.target.closest('#bk-drop, .bk-stage, .bk-need, .bk-prog, .bk-more'); }
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
    /* A new room, and the photo that showed it goes straight in */
    function addRoomFor(type, name, pid){
      var n = (h.extraRooms || []).filter(function(x){ return x.type === type; }).length + 1, key = 'x-' + type + '-' + A.uid('');
      h.extraRooms = (h.extraRooms || []).concat([{key:key, type:type, name:name + (n > 1 ? ' ' + n : '')}]);
      var ph = pid && (h.photos.unsorted || []).filter(function(x){ return x.id === pid; })[0];
      if(ph){ h.photos.unsorted = h.photos.unsorted.filter(function(x){ return x !== ph; }); delete ph.unsure; delete ph.alts; delete ph.newType; (h.photos[key] = h.photos[key] || []).push(ph); }
      saved(h); RI.toast(name + ' added' + (ph ? ', with the photo.' : '.'), 'check'); A.render();
    }
    /* A room from step 1 with no photos can be taken off: the last bedroom or bath, the basement, or a room added here */
    function noRoomOk(key){
      var r = roomOf(key); if(!r || A.photoCount(h, key)) return false;
      if(r[3] || key === 'basement') return true;
      var g = r[2]; if(['bedrooms','hallbath','halfbath'].indexOf(g) < 0) return false;
      var grp = rooms.filter(function(x){ return x[2] === g; });
      return grp[grp.length - 1][0] === key && (g !== 'hallbath' || grp.length > 1);
    }
    function noRoom(key){
      var r = roomOf(key), f = h.facts = h.facts || {}; if(!noRoomOk(key)) return;
      if(r[3]) h.extraRooms = (h.extraRooms || []).filter(function(x){ return x.key !== key; });
      else if(key === 'basement') f.basement = 'none';
      else if(r[2] === 'bedrooms') f.beds = Math.max(0, (f.beds != null ? +f.beds : 3) - 1);
      else if(r[2] === 'hallbath') f.baths = Math.max(1, (+f.baths || 1) - 1);
      else if(r[2] === 'halfbath') f.halfBaths = Math.max(0, (+f.halfBaths || 0) - 1);
      delete h.photos[key]; delete h.sizes[key]; delete h.notes[key];
      saved(h); RI.toast(r[1] + ' taken off your house.', 'check'); A.render();
    }
    function roomPicker(pid){
      var cnt = {}; (h.extraRooms || []).forEach(function(x){ cnt[x.type] = (cnt[x.type] || 0) + 1; });
      function grp(title, arr){ return '<div class="rp-g"><h3>' + title + '</h3><div class="rp-chips">' + arr.map(function(t){ return '<button type="button" data-rt="' + t[0] + '" data-rn="' + RI.esc(t[1]) + '">' + t[1] + (cnt[t[0]] ? ' <span class="n">' + cnt[t[0]] + '</span>' : '') + '</button>'; }).join('') + '</div></div>'; }
      var d = A.dialog(pid ? 'Which room is it?' : 'Add a room', (pid ? '<p class="small muted">We add the room to your house and put the photo in it.</p>' : '') + grp('Inside', RI.ROOM_TYPES.inside) + grp('Outside', RI.ROOM_TYPES.outside), {wide:true});
      d.addEventListener('click', function(e){
        var b2 = e.target.closest('[data-rt]'); if(!b2) return;
        d.close(); addRoomFor(b2.getAttribute('data-rt'), b2.getAttribute('data-rn'), pid);
      });
    }
    function addPlans(files){
      [].slice.call(files).forEach(function(file){
        var isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name), isImg = /^image\/(jpeg|png|webp)$/i.test(file.type);
        if(!isPdf && !isImg){ planErr(file.name + ' was not added. Use JPG, PNG, WebP or PDF.'); return; }
        if(file.size > MAX_MB * 1048576){ planErr(file.name + ' was not added. It is over ' + MAX_MB + ' MB.'); return; }
        var rec = {name:file.name, kb:Math.round(file.size / 1024), kind:isPdf ? 'pdf' : 'image'};
        function done(){ h.plans = (h.plans || []).concat([rec]); saved(h); planErr(''); plans(h.plans.length - 1); }
        if(isImg){ A.shrink(file).then(function(r){ rec.src = r.src; done(); }, function(){ planErr(file.name + ' could not be opened.'); }); }
        else if(file.size <= MAX_PLAN_KEEP * 1048576){ var fr = new FileReader(); fr.onload = function(){ rec.src = fr.result; done(); }; fr.readAsDataURL(file); }
        else { rec.big = true; done(); }
      });
    }
    function viewPlan(i){
      var p = h.plans[i];
      A.dialog(RI.esc(p.name), p.src ? (p.kind === 'pdf' ? '<object class="plan-view" data="' + p.src + '" type="application/pdf"><p><a href="' + p.src + '" download="' + RI.esc(p.name) + '">Download it</a>.</p></object>' : '<img class="plan-view" src="' + p.src + '" alt="Floor plan">') : '<p class="muted">In the product this file is stored privately and opens here.</p>', {wide:true});
    }
    function planErr(msg){ main.querySelectorAll('.pl-err').forEach(function(e){ e.textContent = msg; }); }
    function plans(fresh){
      var list = h.plans || [];
      main.querySelectorAll('.pl-box').forEach(function(box){
        box.classList.toggle('has', list.length > 0);
        box.querySelector('.pl-add-t').textContent = list.length ? 'Add another' : 'Add a plan';
        box.querySelector('.pl-list').innerHTML = list.map(function(p, i){
          var th = p.kind === 'image' && p.src ? '<img class="pl-th" src="' + p.src + '" alt="">' : '<span class="pl-th pl-pdf" aria-hidden="true">PDF</span>';
          return '<li class="pl-row' + (i === fresh ? ' is-new' : '') + '">' + th + '<span class="pl-n"><b title="' + RI.esc(p.name) + '">' + RI.esc(p.name) + '</b><small>' + (p.kind === 'pdf' ? 'PDF' : 'Image') + ' · ' + (p.kb >= 1024 ? (p.kb / 1024).toFixed(1) + ' MB' : p.kb < 1 ? 'under 1 KB' : p.kb + ' KB') + '</small></span>' +
            '<span class="pl-acts"><button type="button" class="linkbtn small" data-viewplan="' + i + '" aria-label="View ' + RI.esc(p.name) + '">View</button><button type="button" class="linkbtn small pl-rm" data-rmplan="' + i + '" aria-label="Remove ' + RI.esc(p.name) + '">Remove</button></span></li>';
        }).join('');
      });
    }
    plans(); all(); rooms.forEach(function(r){ maybeMeasure(r[0]); });
    /* Team only: Fill sample data in the ribbon adds the sample photos */
    RI.setDevFill(function(){ var sb = main.querySelector('#sample'); if(sb) sb.click(); }, 'Add sample photos', main);
    (h.photos.unsorted || []).forEach(function(p){ if(p.state === 'done') read(p); });
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
      if(A.regionBlocked(h)) return false;
      var up = Object.keys(pending).some(function(k){ return pending[k].some(function(p){ return p.state === 'up'; }); });
      if(up){ RI.toast('A few photos are still uploading. One moment.', 'clock'); return false; }
      if(Object.keys(reading).length){ RI.toast('A few photos are still being read. One moment.', 'clock'); return false; }
      function trayThenSubmit(){
        var n = (h.photos.unsorted || []).length;
        if(n){ A.confirm(n + ' photo' + (n > 1 ? 's are' : ' is') + ' not in a room yet', 'Photos left in the tray are not used. Sort them first, or submit without them.', 'Submit without them', disclaimer); return; }
        disclaimer();
      }
      /* Photos still only suggested get one clear question first, before the estimate tick */
      var sg = 0; rooms.forEach(function(r){ sg += sugIn(r[0]); });
      if(sg){ A.confirm(sg + ' photo' + (sg === 1 ? ' is' : 's are') + ' still suggested', 'We put ' + (sg === 1 ? 'it' : 'them') + ' in rooms by reading the photos. Confirm ' + (sg === 1 ? 'it' : 'them') + ' as ' + (sg === 1 ? 'it is' : 'they are') + ', or check each room first.', 'Confirm them', function(){ rooms.forEach(function(r){ confirmRoom(r[0]); }); saved(h); all(); rooms.forEach(function(r){ maybeMeasure(r[0]); }); trayThenSubmit(); }); return false; }
      trayThenSubmit(); return false;
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
  /* A house in a region that is not live yet stays a draft; it is never priced with another region's rates */
  A.regionBlocked = function(h){
    var st = RI.stateOfHouse(h), g = RI.regionOf(st); if(!g || g.live) return false;
    A.dialog('We do not price the ' + g.name + ' yet', '<div class="mark bronze">' + RI.icon('pin') + '</div><p>Your house in ' + RI.esc(RI.STATES[st] || st) + ' is saved as a draft. We price houses with the rates of their region, and the ' + RI.esc(g.name) + ' is not open yet. We will let you know when it is.</p>' +
      '<div class="cta-row" style="justify-content:flex-end"><button type="button" class="btn btn-primary" data-dlg-close>Keep my draft</button></div>');
    return true;
  };
  function canSubmit(h, again){
    if(A.regionBlocked(h)) return false;
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
