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
    return '<div class="rc-photo"><img src="' + src + '" alt="' + RI.esc(room.name) + '" loading="lazy">' + pins + '</div>';
  }

  /* The open room card. opts: photo, itemsHtml (the folded list), range (html), badge */
  function html(room, pk, opts){
    opts = opts || {};
    var t = tiles(room, pk), pkd = RI.PACKAGES.filter(function(p){ return p.key === pk; })[0];
    var buys = !!opts.buysHtml; /* the paid presentation: photo as a banner on top, the breakdown says what changes */
    return '<article class="rc' + (buys ? ' rc-banner' : '') + '" data-room="' + room.key + '">' + photoHtml(room, opts) +
      '<div class="rc-body"><header class="rc-head"><div><h3>' + RI.esc(room.name) + '</h3><p class="xsmall muted">' + RI.esc(pkd.name) + ': ' + RI.esc(pkd.goal) + '</p></div>' +
        (opts.range ? '<span class="range-txt rc-range">' + opts.range + '</span>' : '') + '</header>' +
      (buys ? '' : '<p class="rc-change">' + RI.esc(change(room, pk)) + '</p>') +
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

  RI.RoomCard = {html:html, locked:locked, kind:kind, tiles:tiles, change:change, counts:counts, wire:wire, photoFor:function(k){ return PHOTOS[k] ? RI.img(PHOTOS[k]) : null; }};
})();
