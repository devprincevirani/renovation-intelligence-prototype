/* The room card: a photo with hotspots on the left, the products the chosen goal puts in that room on the
   right, one line on what changes, the range, and the included list folded away. Used on the public sample,
   in the paid presentation and (one room open, the rest locked) on the free price page.
   Results, not method: no quantities, evidence or source words here. */
(function(){
  var RI = window.RI;

  /* Hotspots on the sample kitchen photo, in percent of the image */
  var PINS = {k1:[11,52], k2:[73,44], k4:[21,25], k3:[37,33]};
  var PHOTOS = {kitchen:'kitchen-dated.jpg', living:'wood-floor.jpg', exterior:'brick-ranch.jpg'};

  function productImg(it, pk){ var m = RI.PRODUCT_IMG && RI.PRODUCT_IMG[it.id]; return m && m[pk] ? RI.img(m[pk]) : null; }

  function tiles(room, pk){
    var out = [];
    room.items.forEach(function(it){
      if(RI.isHeld(it)) return;
      var a = it.pk[pk]; if(!a || !a[3]) return;
      out.push({id:it.id, name:a[3], type:it.name, trade:it.trade, img:productImg(it, pk)});
    });
    return out;
  }
  function priced(room){ return room.items.filter(function(it){ return !RI.isHeld(it); }); }

  /* One line on what changes in this room under the goal */
  function change(room, pk){
    var best = null;
    priced(room).forEach(function(it){ var a = it.pk[pk]; if(a && a[1] != null && (!best || a[2] > best[1][2])) best = [it, a]; });
    if(!best) return 'Nothing to change here under this goal. What is sound is kept.';
    var s = best[1][0]; return s.charAt(0).toUpperCase() + s.slice(1) + (/[.!?]$/.test(s) ? '' : '.');
  }
  function counts(room){
    var its = room.items, held = its.filter(RI.isHeld).length;
    return {items:its.length, products:Math.max(tiles(room, 'P').length, tiles(room, 'S').length), held:held};
  }

  function tileHtml(t){
    return '<li class="rc-tile" data-pin="' + t.id + '">' +
      (t.img ? '<span class="rc-ti"><img src="' + t.img + '" alt="" width="240" height="240" loading="lazy"></span>'
             : '<span class="rc-ti rc-neutral">' + RI.icon('dot', 'i-lg') + '<span>' + RI.esc(t.trade) + '</span></span>') +
      '<span class="rc-tn"><b>' + RI.esc(t.name) + '</b><span>' + RI.esc(t.type) + '</span></span></li>';
  }

  function photoHtml(room, opts){
    var src = opts.photo || (PHOTOS[room.key] && RI.img(PHOTOS[room.key]));
    if(!src) return '<div class="rc-photo rc-nophoto" aria-hidden="true">' + RI.icon('camera', 'i-lg') + '<span>' + RI.esc(room.name) + '</span></div>';
    var pins = '';
    if(room.key === 'kitchen' && !opts.photo){
      var n = 0; room.items.forEach(function(it){ if(PINS[it.id] && !RI.isHeld(it)){ n++; pins += '<span class="rc-pin" data-pin="' + it.id + '" style="left:' + PINS[it.id][0] + '%;top:' + PINS[it.id][1] + '%">' + n + '</span>'; } });
    }
    return '<div class="rc-photo"><img src="' + src + '" alt="' + RI.esc(room.name) + '" decoding="async">' + pins + '</div>';
  }

  /* The open room card. opts: photo, itemsHtml (the folded list), range (html), badge */
  function html(room, pk, opts){
    opts = opts || {};
    var t = tiles(room, pk), pkd = RI.PACKAGES.filter(function(p){ return p.key === pk; })[0], ends = opts.ends || '';
    return '<article class="rc" data-room="' + room.key + '">' + photoHtml(room, opts) +
      '<div class="rc-body"><header class="rc-head"><div><h3>' + RI.esc(room.name) + '</h3>' + (ends ? '<p class="rc-sub">' + RI.esc(roomSub(room, pk)) + '</p>' : '<p class="xsmall muted">' + RI.esc(pkd.name) + ': ' + RI.esc(pkd.goal) + '</p>') + '</div>' +
        (!ends && opts.range ? '<span class="range-txt rc-range">' + opts.range + '</span>' : '') + '</header>' +
      (ends || '<p class="rc-change">' + RI.esc(change(room, pk)) + '</p>') +
      /* opts.buysHtml (the paid presentation): every line open, with its product and range, instead of tiles + folded list */
      (opts.buysHtml || ((function(){ var tp = t.filter(function(x){ return x.img; }); /* real product photos only, never a placeholder tile */
        return tp.length ? '<ul class="rc-tiles">' + tp.slice(0, opts.max || 6).map(tileHtml).join('') + '</ul>' : '<p class="small muted">' + (t.length ? 'The products for this room are listed under What is included.' : 'No products to show for this room under this goal.') + '</p>';
      })() +
      (opts.itemsHtml ? '<details class="rc-inc"><summary>What is included</summary><div class="rc-list">' + opts.itemsHtml + '</div></details>' : ''))) +
      '</div></article>';
  }

  /* A locked room: real counts, a blurred range, no prices */
  function locked(room, pk, href){
    var c = counts(room), t = RI.totals(pk, {}, room.key);
    return '<button type="button" class="rc-lock" data-room="' + room.key + '" aria-label="' + RI.esc(room.name) + ', locked. ' + c.items + ' items, ' + c.products + ' products">' +
      '<span class="rc-lk-ic">' + RI.icon('lock') + '</span><span class="rc-lk-t"><b>' + RI.esc(room.name) + '</b><span>' + c.items + ' item' + (c.items === 1 ? '' : 's') + (c.products ? ', ' + c.products + ' product' + (c.products === 1 ? '' : 's') : '') + (c.held ? ', ' + c.held + ' need' + (c.held === 1 ? 's' : '') + ' a photo or size' : '') + '</span></span>' +
      '<span class="rc-blur" aria-hidden="true">' + (t.high ? RI.range(t.low, t.high) : '$0 to $0') + '</span></button>';
  }

  /* Hotspot and tile highlight each other */
  function wire(host){
    function on(id, v){ host.querySelectorAll('[data-pin="' + id + '"]').forEach(function(x){ x.classList.toggle('on', v); }); }
    host.addEventListener('mouseover', function(e){ var x = e.target.closest('[data-pin]'); if(x) on(x.getAttribute('data-pin'), true); });
    host.addEventListener('mouseout', function(e){ var x = e.target.closest('[data-pin]'); if(x) on(x.getAttribute('data-pin'), false); });
    host.addEventListener('click', function(e){ var x = e.target.closest('[data-pin]'); if(x){ host.querySelectorAll('[data-pin].on').forEach(function(y){ y.classList.remove('on'); }); on(x.getAttribute('data-pin'), true); } });
  }

  /* The kind of work, from the action words. In the product the engine gives it with each line. */
  function kind(action){
    var s = String(action || '').toLowerCase();
    if(/^(re)?paint/.test(s)) return 'Paint';
    if(/refinish|reglaze/.test(s)) return 'Refinish';
    if(/clean|adjust|tighten|restretch|reseal|flapper|scrape|weatherstrip|hinge/.test(s)) return 'Repair';
    return 'New';
  }

  /* Low | High (user, Nov 2026): which end of every line to show. Each end has its own kind of product, at one exact
     price per unit times its quantity; the line's installed cost at that end sits on the right. */
  /* The two ends of a room's range as the switch (the user's choice A, Nov 2026): Low end and High end, each with its
     total; tapping one shows that end's products in the list below. The buttons carry data-end, so each page's Low/High
     handler applies. */
  function endsSwitch(end, low, high){
    return '<div class="rc-ends"><div class="rc-ends-g" role="group" aria-label="The low or the high end of this room">' +
      [['lo', 'Low end', low], ['hi', 'High end', high]].map(function(x){ return '<button type="button" data-end="' + x[0] + '" aria-pressed="' + (end === x[0]) + '"><small>' + x[1] + '</small><b>' + RI.money(x[2]) + '</b></button>'; }).join('') +
      '</div><p class="rc-ends-h">Each end comes with its own products. Tap one to see them.</p></div>';
  }
  /* Under the room's name: the package, how many parts change, how many are not priced yet */
  function roomSub(room, pk){
    var pkd = RI.PACKAGES.filter(function(p){ return p.key === pk; })[0], n = 0, held = 0;
    room.items.forEach(function(it){ if(RI.isHeld(it)) held++; else if(it.pk[pk] && it.pk[pk][1] != null) n++; });
    return pkd.name + ' · ' + n + ' part' + (n === 1 ? '' : 's') + ' change' + (held ? ' · ' + held + ' not priced yet' : '');
  }
  /* One line of What this buys (user, Nov 2026): the part, what changes (today's -> the new product, or the work and its
     product), the product's exact price maths; on the right, the installed price at this end split into product and work.
     locked: a line on a locked room, with the change but no price and no maths */
  function partName(it){ return (RI.ITEM_PART && RI.ITEM_PART[it.id]) || it.name; }
  /* One line of What this buys (the user's choice C, Nov 2026). The part and its installed price at this end on the first
     line, what you get under it, and "How this price is made" opening the breakdown: the product with its maths, the work
     with what it covers, the installed total. o.sw adds the on/off switch (paid presentation); o.locked is the locked
     price to show instead (a locked room: no breakdown); o.img the photo; o.off a line turned off. */
  var WORK = 'Taking out the old one, fitting and installing, small materials, hauling away';
  function qtyText(p){
    if(p.per === 'each') return (p.qty !== 1 ? p.qty.toLocaleString('en-US') + ' &times; ' : '') + RI.unitPrice(p.price) + ' each';
    return p.qty.toLocaleString('en-US') + ' ' + p.per + ' &times; ' + RI.unitPrice(p.price);
  }
  function changeHtml(it, pk, p){
    var a = it.pk[pk], k = kind(a[0]), pn = p ? p.name : a[3], from = RI.ITEM_FROM && RI.ITEM_FROM[it.id];
    var tag = '<span class="wb-k' + (k === 'New' ? ' wb-k-new' : '') + '">' + k + '</span>';
    if(pn && k === 'New') return tag + '<b>' + RI.esc(pn) + '</b>' + (from ? ' <span class="wb-was">replaces ' + RI.esc(from.toLowerCase()) + '</span>' : '');
    return tag + RI.esc(a[0]) + (pn ? ' &middot; <b>' + RI.esc(pn) + '</b>' : '');
  }
  /* The breakdown card (user, Nov 2026): a bar with the split between product and work, the product with its photo and
     maths, the work with what it covers, the installed total. On a computer it floats on hover (see Hover below); on a
     phone it opens inside the line; the PDF prints it open. */
  function btCard(it, end, a, p, val, prod, img){
    var row = function(ic, name, sub, v){ return '<div class="bt-row"><span class="bt-ic">' + ic + '</span><span><b>' + name + '</b><small>' + sub + '</small></span><span class="bt-v">' + RI.money(v) + '</span></div>'; };
    var head = '<p class="bt-h">' + RI.esc(partName(it)) + ', ' + (end === 'hi' ? 'high' : 'low') + ' end</p>', body;
    if(p){
      var pp = val ? Math.round(prod / val * 100) : 0;
      body = '<div class="bt-bar" aria-hidden="true"><i class="bt-p" style="flex:' + pp + '"></i><i class="bt-w" style="flex:' + (100 - pp) + '"></i></div>' +
        '<p class="bt-key"><span><i class="bt-p"></i>Product ' + pp + '%</span><span><i class="bt-w"></i>Work ' + (100 - pp) + '%</span></p>' +
        row(img ? '<img src="' + img + '" alt="" decoding="async">' : RI.icon('dot'), RI.esc(p.name), qtyText(p), prod) + row(RI.icon('hammer'), 'Work', WORK, val - prod);
    } else body = row(RI.icon('hammer'), 'Work and materials', RI.esc(a[0]), val);
    return '<div class="bt">' + head + body + '<div class="bt-t"><span>Installed</span><span class="bt-v">' + RI.money(val) + '</span></div></div>';
  }
  function buyRow(it, pk, end, o){
    o = o || {};
    var a = it.pk[pk], p = o.locked ? null : RI.productEnd(it, pk, end), val = end === 'hi' ? a[2] : a[1], prod = p ? Math.min(p.total, val) : 0;
    var how = o.locked ? '' : '<details class="wb-how"><summary><span class="wb-how-l">How this price is made</span><span class="wb-how-s">Price breakdown</span></summary>' + btCard(it, end, a, p, val, prod, o.img) + '</details>';
    var inc = o.sw ? '<label class="switch sw wb-inc"><input type="checkbox" data-id="' + it.id + '"' + (o.off ? '' : ' checked') + '><span class="track"></span><span class="sr">Include ' + RI.esc(partName(it)) + '</span></label>' : '';
    return '<li class="wb-line wb-c' + (o.off ? ' off' : '') + '"' + (o.sw ? ' data-item="' + it.id + '"' : '') + '>' +
      '<span class="wb-th">' + (o.img ? '<img src="' + o.img + '" alt="" decoding="async">' : RI.icon('dot', 'i-lg')) + '</span>' +
      '<div class="wb-main"><div class="wb-top"><b>' + RI.esc(partName(it)) + '</b>' + (o.locked || '<span class="wb-endv' + (how ? ' has-bt' : '') + '">' + RI.money(val) + '</span>') + '</div>' +
        '<div class="wb-nx">' + changeHtml(it, pk, p) + '</div>' + (how || inc ? '<div class="wb-row' + (inc ? ' has-inc' : '') + '">' + how + inc + '</div>' : '') + '</div></li>';
  }
  /* The list's head names the end it shows, with Partial when a line is not priced yet */
  function buysHead(end, show, held){
    return '<div class="wb-hd"><h4>' + (show ? 'What the ' + (end === 'hi' ? 'high' : 'low') + ' end buys' : 'What this buys') + '</h4>' + (show && held ? '<span class="state state-partial">Partial</span>' : '') + '</div>';
  }
  /* A line not priced yet says what to add, with the button that adds it */
  function heldRow(it, href){
    var m = it.state === 'measure', f = String(it.fix || '').replace(/, in feet$/, '').replace(/^(The|A|Photos)\b/, function(w){ return w.toLowerCase(); });
    return '<li class="wb-line wb-hold"><span class="wb-th">' + RI.icon(m ? 'ruler' : 'camera', 'i-lg') + '</span>' +
      '<span class="wb-t"><b>' + RI.esc(partName(it)) + '</b><span class="wb-nx">Add ' + RI.esc(f) + ' to price it.</span></span>' +
      '<span class="wb-r"><a class="btn btn-secondary btn-sm" href="' + href + '">' + (m ? 'Add the size' : 'Add the photo') + '</a><span class="xsmall muted">Not in the total</span></span></li>';
  }
  function sampleNote(){ return '<p class="wb-note">Sample products and prices, until Sam’s product list arrives.</p>'; }
  function endImg(it, pk, end){ var p = RI.productEnd(it, pk, end); return p && p.img; }

  /* Hover (user, Nov 2026: "on hover i want show this break down like tooltip"). On a computer, resting the pointer on
     "How this price is made" or on the line's price shows its breakdown card floating under it, after a short wait so
     cards do not flash while the pointer passes. The card stays while the pointer is on it; a click keeps it open until
     a click elsewhere; Tab onto the link shows it; Escape closes it (focus stays where it is). Phones and tablets (no hover) open it inside the
     line instead. One floating card for the page, listening on the document, so redrawn lines need no wiring. */
  (function(){
    var mq = window.matchMedia ? matchMedia('(hover: hover) and (pointer: fine)') : null, fl = null, cur = null, anchor = null, pinned = false, openT, closeT;
    var TRIG = '.wb-how>summary, .wb-endv.has-bt';
    function on(){ return !!(mq && mq.matches); }
    function lineOf(el){ if(!el || !el.closest) return null; if(fl && fl.contains(el)) return cur; var li = el.closest('.wb-c'); return li && li.querySelector('details.wb-how') ? li : null; }
    function place(){
      var r = anchor.getBoundingClientRect(), vw = document.documentElement.clientWidth, w = fl.offsetWidth, hgt = fl.offsetHeight;
      var left = anchor.matches('.wb-endv') ? r.right - w + 12 : r.left - 12;
      left = Math.max(12, Math.min(left, vw - w - 12));
      var up = r.bottom + 10 + hgt > innerHeight - 8 && r.top - 10 - hgt > 8;
      fl.classList.toggle('up', up);
      fl.style.left = (left + scrollX) + 'px'; fl.style.top = ((up ? r.top - 10 - hgt : r.bottom + 10) + scrollY) + 'px';
      fl.style.setProperty('--cx', Math.max(16, Math.min(w - 16, r.left + r.width / 2 - left)) + 'px');
    }
    function show(li, a){
      clearTimeout(openT); clearTimeout(closeT);
      if(!document.contains(li)) return hide();
      var card = li.querySelector('details.wb-how .bt'); if(!card) return;
      if(!fl){ fl = document.createElement('div'); fl.className = 'bt-float'; fl.id = 'bt-float'; fl.setAttribute('role', 'tooltip'); document.body.appendChild(fl); }
      if(cur !== li){ fl.innerHTML = card.outerHTML; fl.classList.remove('in'); void fl.offsetWidth; fl.classList.add('in'); }
      if(cur && cur !== li) mark(cur, false);
      cur = li; anchor = a; fl.hidden = false; mark(li, true); place();
    }
    function mark(li, v){ var s = li.querySelector('.wb-how>summary'); if(!s) return; s.classList.toggle('is-on', v); if(v) s.setAttribute('aria-describedby', 'bt-float'); else s.removeAttribute('aria-describedby'); }
    function hide(){ clearTimeout(openT); clearTimeout(closeT); if(cur) mark(cur, false); cur = null; anchor = null; pinned = false; if(fl) fl.hidden = true; }
    document.addEventListener('mouseover', function(e){
      if(!on()) return;
      var li = lineOf(e.target); if(!li){ return; }
      var t = e.target.closest(TRIG) || (fl && fl.contains(e.target) ? fl : null); if(!t) return;
      clearTimeout(closeT);
      if(li === cur) return;
      clearTimeout(openT); openT = setTimeout(function(){ show(li, t); }, 200);
    });
    document.addEventListener('mouseout', function(e){
      if(!on()) return;
      var from = e.target.closest && (e.target.closest(TRIG) || (fl && fl.contains(e.target) ? fl : null)); if(!from) return;
      var to = e.relatedTarget, toZone = to && to.closest && (to.closest(TRIG) || (fl && fl.contains(to) ? fl : null));
      if(toZone && lineOf(to) === lineOf(e.target)) return;
      clearTimeout(openT);
      if(cur && !pinned) closeT = setTimeout(hide, 220);
    });
    document.addEventListener('click', function(e){
      if(!on()) return;
      var s = e.target.closest && e.target.closest('.wb-how>summary');
      if(s){ e.preventDefault(); var li = s.closest('.wb-c'); if(cur === li && pinned) hide(); else { show(li, s); pinned = true; } return; }
      if(cur && pinned && !(fl && fl.contains(e.target))) hide();
    });
    document.addEventListener('focusin', function(e){ if(!on()) return; var s = e.target.closest && e.target.closest('.wb-how>summary'); if(s && s.matches(':focus-visible')) show(s.closest('.wb-c'), s); });
    document.addEventListener('focusout', function(e){ if(cur && !pinned && e.target.closest && e.target.closest('.wb-how>summary')) hide(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && cur) hide(); });
    window.addEventListener('resize', hide); window.addEventListener('hashchange', hide);
    /* a list scrolled inside its card shows a line under its heading */
    document.addEventListener('scroll', function(e){ var t = e.target; if(t && t.classList && t.classList.contains('wb')) t.classList.toggle('is-scrolled', t.scrollTop > 2); }, true);
    document.addEventListener('scroll', function(e){ if(!cur || (fl && fl.contains(e.target))) return; if(pinned && document.contains(anchor)) place(); else hide(); }, true);
    if(mq && mq.addEventListener) mq.addEventListener('change', hide);
  })();

  /* Smooth changes (user, Nov 2026: "when i switch screen show blink"). A view, a room card or a list changes
     without a blink: the space keeps its height, a skeleton holds the place for a short beat when something else is
     shown (another tab, another room), new numbers for the same thing fade in softly, a photo that is the same
     picture stays put, and a photo still loading waits on a calm placeholder. Reduced motion: everything at once. */
  function calm(){ return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function skel(kind){
    var row = function(){ return '<div class="sk-row"><span class="sk-b sk-th"></span><span class="sk-lines"><span class="sk-l w60"></span><span class="sk-l w80"></span></span></div>'; };
    if(kind === 'list') return '<div class="sk-view" aria-hidden="true"><span class="sk-l sk-h w40"></span>' + [0,1,2,3].map(row).join('') + '</div>';
    var card = '<article class="rc sk-rc" aria-hidden="true"><div class="rc-photo sk-b"></div><div class="rc-body"><span class="sk-l sk-h w40"></span><span class="sk-l w60"></span><span class="sk-b sk-ends"></span>' + [0,1,2].map(row).join('') + '</div></article>';
    return kind === 'rooms' ? '<div class="sk-chips" aria-hidden="true">' + [0,1,2,3,4].map(function(){ return '<span class="sk-b"></span>'; }).join('') + '</div>' + card : card;
  }
  function settle(root){
    root.querySelectorAll('.rc-photo img, .wb-th img').forEach(function(img){
      if(img.complete && img.naturalWidth) return;
      var box = img.parentNode, done = function(){ box.classList.remove('img-wait'); };
      box.classList.add('img-wait'); img.addEventListener('load', done, {once:true}); img.addEventListener('error', done, {once:true});
    });
  }
  /* el: the box that changes; fill(): puts the new content in; o.sk: a skeleton first ('room', 'rooms' or 'list');
     o.keep: a selector for a photo kept when the new one is the same picture */
  function swap(el, fill, o){
    o = o || {};
    var waiting = !!el._swT, still = calm();
    clearTimeout(el._swT); clearTimeout(el._swR); el._swT = null;
    if(!waiting){ el._swKeep = o.keep ? el.querySelector(o.keep) : null; el.style.minHeight = el.offsetHeight + 'px'; }
    function put(){
      el._swT = null; el.removeAttribute('aria-busy');
      var old = el._swKeep; el._swKeep = null;
      fill();
      if(old && o.keep){ var nu = el.querySelector(o.keep); if(nu && nu.getAttribute('src') === old.getAttribute('src')) nu.parentNode.replaceChild(old, nu); }
      settle(el);
      if(!still){ el.classList.remove('sw-in'); void el.offsetWidth; el.classList.add('sw-in'); }
      el._swR = setTimeout(function(){ el.style.minHeight = ''; el.classList.remove('sw-in'); }, 240);
    }
    if(still || !o.sk){ put(); return; }
    el.setAttribute('aria-busy', 'true'); el.innerHTML = skel(o.sk);
    el._swT = setTimeout(put, 280);
  }
  /* One part of the card (What this buys) changes in place and fades in */
  function swapEl(old, html){
    var t = document.createElement('div'); t.innerHTML = html; var nu = t.firstElementChild; if(!nu) return old;
    old.parentNode.replaceChild(nu, old); if(RI.fillIcons) RI.fillIcons(nu); settle(nu);
    if(!calm()){ nu.classList.add('sw-self'); setTimeout(function(){ nu.classList.remove('sw-self'); }, 240); }
    return nu;
  }

  RI.RoomCard = {swap:swap, swapEl:swapEl, settle:settle, skel:skel, html:html, locked:locked, kind:kind, endsSwitch:endsSwitch, endImg:endImg, buyRow:buyRow, buysHead:buysHead, heldRow:heldRow, sampleNote:sampleNote, partName:partName, tiles:tiles, change:change, counts:counts, wire:wire, photoFor:function(k){ return PHOTOS[k] ? RI.img(PHOTOS[k]) : null; }};
})();
