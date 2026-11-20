/* Console: the product library (APP_FLOW 7, BACKLOG M3-10, M3-22, M4-24, SCHEMA products and product_versions).
   One product per item per package (PDF, product decisions): the screen is built around items, each with three
   slots, Essential, Standard and Premium. A filled slot is a product tile (DESIGN: square photo, name and tier) with
   its price, version and state; an empty one says how that line is priced or offers Add product.
   A product has one price with its unit (SCHEMA products: "price"; PDF: "name, photo, link, price, source"). The Low and
   High belongs to rates and to the estimate line, where product and rates combine (SCHEMA 7, the pricing spec, open).
   A product opens in a side panel: photo, price, source and link, how many priced houses it prices, its
   version history, any draft waiting, and Edit as draft. Add product uses the same form and only offers empty slots.
   Edits and new products are drafts; only Sam publishes (SECURITY 3.2). Registered first, so it replaces the older
   products table in pricing.js. */
(function(){
  var RI = window.RI, A = RI.App, C = RI.Con, doc = document, DAY = 86400000;
  var TIERS = [['E', 'Essential'], ['S', 'Standard'], ['P', 'Premium']], TN = {E:'Essential', S:'Standard', P:'Premium'};
  /* Two icons this screen needs that the shared set lacks, drawn in the same line style */
  var OWN = {grid:'<rect x="4" y="4" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1"/>', plus:'<path d="M12 5v14M5 12h14"/>', pencil:'<path d="M4 20l1-4.5L15.5 5 19 8.5 8.5 19z"/><path d="M13.5 7l3.5 3.5"/>'};
  var esc = RI.esc, money = RI.money, I = function(n, c){ c = c || 'i-sm'; return OWN[n] ? '<svg class="i ' + c + '" viewBox="0 0 24 24" aria-hidden="true">' + OWN[n] + '</svg>' : RI.icon(n === 'image' ? 'camera' : n, c); };
  var PEOPLE = ['Sam', 'Sam', 'Marcus Hill', 'Sam', 'Dana Reyes'];

  /* ---------- Data: one product per item and tier, a supplier link and a version history for each ---------- */
  function upgrade(list){
    if(C.get('products.v') >= 2) return list;
    var now = Date.now();
    /* The second Premium "Carpet" was the basement's waterproof floor: give that pair its own item */
    list.forEach(function(p){ if(p.id === 'p1127' || p.id === 'p1128'){ p.item = 'Basement floor'; p.fam = 'FL'; } });
    list.forEach(function(p, i){
      p.link = p.link || 'https://supplier.example/products/' + p.id;
      if(p.hist) return;
      var v = p.v || 1, h = [], at = p.at || now - (i % 9 + 2) * DAY;
      for(var k = v; k >= 1; k--){
        var when = at - (v - k) * (9 + i % 5) * DAY, by = PEOPLE[(i + k) % PEOPLE.length], f = 1 - (v - k) * .06;
        h.push({v:k, at:when, by:by, lo:Math.round(p.lo * f / 10) * 10, hi:Math.round(p.hi * f / 10) * 10,
          change:k === 1 ? 'Added to the library' : (k + i) % 3 ? 'New supplier prices' : 'Source updated to ' + p.src, note:k === 1 ? '' : (k + i) % 2 ? 'Back-test clean' : ''});
      }
      p.hist = h;
    });
    C.set('products', list); C.set('products.v', 2);
    return list;
  }
  /* Sample prices per unit until Sam's product list arrives (STATUS: due 4 Jan 2027). Matched by product name */
  var PRICES = [[/brass pull/i, 9, 'each'], [/^painted shaker, soft close$/i, 310, 'linear ft'], [/stone-look laminate/i, 28, 'sq ft'], [/quartz, eased/i, 68, 'sq ft'],
    [/single-handle faucet/i, 145, 'each'], [/stainless sink/i, 420, 'each'], [/undermount sink/i, 780, 'each'], [/3 by 6 in ceramic/i, 4.5, 'sq ft'], [/handmade-look/i, 14, 'sq ft'],
    [/sheet vinyl/i, 2.2, 'sq ft'], [/oak-look lvp/i, 3.8, 'sq ft'], [/porcelain/i, 6.5, 'sq ft'], [/pendants/i, 140, 'each'], [/^led flush mount$/i, 65, 'each'], [/recessed/i, 48, 'each'],
    [/white oak engineered/i, 7.8, 'sq ft'], [/3\.25 in/i, 1.4, 'linear ft'], [/5\.25 in/i, 2.6, 'linear ft'], [/shaker bifold/i, 160, 'each'], [/^solid-core shaker$/i, 290, 'each'],
    [/steel tub/i, 480, 'each'], [/soaking tub/i, 1450, 'each'], [/30 in furniture/i, 1150, 'each'], [/30 in vanity/i, 520, 'each'], [/1\.28 gpf/i, 260, 'each'], [/comfort height/i, 380, 'each'],
    [/wall-hung/i, 760, 'each'], [/24 in vanity/i, 380, 'each'], [/acoustic underlay/i, 4.6, 'sq ft'], [/waterproof lvp/i, 3.2, 'sq ft'], [/insulated drywall/i, 24, 'sheet'], [/drywall/i, 16, 'sheet'],
    [/flat ceilings/i, 52, 'gallon'], [/low-voc/i, 48, 'gallon'], [/hollow-core/i, 95, 'each'], [/solid-core shaker slab/i, 210, 'each'], [/designer led/i, 260, 'each'], [/six-panel/i, 420, 'each'], [/fiberglass/i, 1280, 'each']];
  var PER = ['each', 'sq ft', 'linear ft', 'sheet', 'gallon', 'set'];
  function samplePrice(p){
    for(var i = 0; i < PRICES.length; i++) if(PRICES[i][0].test(p.name)) return [PRICES[i][1], PRICES[i][2]];
    var q = parseFloat(p.unit) || 1, per = /sq ft/.test(p.unit) ? 'sq ft' : /linear ft/.test(p.unit) ? 'linear ft' : 'each';
    return [Math.max(1, Math.round((p.lo || 100) / q * .45)), per];
  }
  /* Version 3 of the data: one price per product. The old Low and High was the sample house's whole line, so it is
     kept apart as that line (line, qty), never as the product's price */
  function onePrice(list){
    if(C.get('products.v') === 3) return list;
    list.forEach(function(p){
      if(p.price == null){
        var sp = samplePrice(p); p.price = sp[0]; p.per = sp[1];
        if(p.lo != null) p.line = [p.lo, p.hi];
        if(p.unit) p.qty = p.unit;
        (p.hist || []).forEach(function(h){ var f = p.lo && h.lo ? h.lo / p.lo : 1; h.price = Math.round(p.price * f * 100) / 100; delete h.lo; delete h.hi; });
      }
      delete p.lo; delete p.hi; delete p.unit;
    });
    C.set('products', list); C.set('products.v', 3);
    return list;
  }
  function all(){ return onePrice(upgrade(C.get('products', []) || [])); }
  function priceOf(x){ var n = +x.price, per = x.per || 'each'; return '$' + (n < 100 && n % 1 ? n.toFixed(2) : Math.round(n).toLocaleString('en-US')) + ' ' + (per === 'each' ? 'each' : 'per ' + per); }
  /* Items: every item that has a product, with its three slots */
  function items(list){
    var by = {};
    list.forEach(function(p){ var k = p.item; (by[k] = by[k] || {item:p.item, fam:p.fam, slots:{}}).slots[p.tier] = p; });
    return Object.keys(by).map(function(k){ return by[k]; }).sort(function(a, b){ return (C.FAMILY[a.fam] || a.fam).localeCompare(C.FAMILY[b.fam] || b.fam) || a.item.localeCompare(b.item); });
  }
  /* How many priced houses this product prices (BACKLOG M3-10: products feed the price) */
  function usedBy(p){
    return A.all().filter(function(h){ if(A.status(h) === 'draft') return false; var hit = false; A.estimate(h).rooms.forEach(function(r){ r.items.forEach(function(it){ var a = it.pk && it.pk[p.tier]; if(a && a[3] === p.name) hit = true; }); }); return hit; }).length;
  }

  /* Publishing a new product adds it to the library; publishing an edit adds a version to its history */
  var applyEdit = C.APPLY.products;
  C.APPLY.products = function(d){
    var list = all(), m = C.me() || {};
    if(d.after && d.after._new){
      var n = list.reduce(function(x, p){ return Math.max(x, +String(p.id).slice(1) || 0); }, 1099) + 1, a = d.after;
      list.push({id:'p' + n, item:a.item, fam:a.fam, tier:a.tier, name:a.name, price:a.price, per:a.per, src:a.src, link:a.link, img:a.img || '', v:1, at:Date.now(),
        hist:[{v:1, at:Date.now(), by:m.name || 'Sam', price:a.price, change:'Added to the library', note:''}]});
      C.set('products', list); return;
    }
    if(applyEdit) applyEdit(d);
    var l2 = C.get('products', []); l2.forEach(function(p){ if(p.id === d.ref){ (p.hist = p.hist || []).unshift({v:p.v, at:Date.now(), by:m.name || 'Sam', price:p.price, change:d.summary || 'Edited', note:''}); } }); C.set('products', l2);
  };

  /* ---------- Pieces ---------- */
  function photo(p, size){ return p && p.img ? '<img src="' + (p.img.indexOf('data:') === 0 ? p.img : RI.img(p.img)) + '" alt="" loading="lazy">' : '<span class="pl-nophoto">' + I('image') + (size === 'big' ? '<b>Photo needed</b>' : '') + '</span>'; }
  function stateOf(p){ var d = C.draftFor('products', p.id); return d ? '<span class="lb lb-draft">Draft waiting</span>' : '<span class="pl-v">v' + (p.v || 1) + '</span>'; }
  function tile(p, t, canEdit){
    if(!p) return '<div class="pl-slot pl-none" data-tier="' + t + '"><span class="pl-tier">' + TN[t] + '</span>' +
      (t === 'E' ? '<p class="pl-emp">Priced from a rate</p>' : canEdit ? '<button type="button" class="pl-add" data-add="' + t + '">' + I('plus') + 'Add product</button>' : '<p class="pl-emp">No product yet</p>') + '</div>';
    var dr = C.draftFor('products', p.id);
    return '<button type="button" class="pl-slot' + (dr ? ' drafted' : '') + (p.img ? '' : ' nophoto') + '" data-prod="' + p.id + '" aria-label="' + esc(p.name) + ', ' + TN[t] + ', ' + priceOf(p) + '">' +
      '<span class="pl-ph">' + photo(p) + '</span><span class="pl-tx"><span class="pl-tier">' + TN[t] + '</span><b class="pl-name">' + esc(p.name) + '</b>' +
      '<span class="pl-price">' + priceOf(p) + '</span><span class="pl-meta">' + (p.img ? '' : '<span class="pl-flag">Photo needed</span>') + stateOf(p) + '</span></span></button>';
  }

  C.route('/products', function(view){
    var list = all(), canEdit = C.can('pricing.edit'), q = C.query();
    var st = {q:'', fam:'all', show:'all', tier:'all', view:C.get('pl.view', 'cards')};
    var fams = list.map(function(p){ return p.fam; }).filter(function(v, i, a){ return a.indexOf(v) === i; }).sort(function(a, b){ return (C.FAMILY[a] || a).localeCompare(C.FAMILY[b] || b); });
    view.innerHTML = C.page({kicker:'Pricing', title:'Products', sub:'Sam\'s product library: one real product per item and package, with its price, source and photo. The Low and High of a line comes from the product and the rates together. Lines without a product are priced from a rate.',
      actions:canEdit ? '<button type="button" class="btn btn-primary" id="pl-new">' + I('plus') + 'Add product</button>' : '',
      body:'<div id="pl-stats"></div><div class="pl-bar"><div class="pl-chips" id="pl-t" role="radiogroup" aria-label="Package"></div><div class="pl-right">' + C.search('pl-q', 'Search products', '') +
        '<label class="c-select"><span class="sr">Family</span><select id="pl-f"><option value="all">All families</option>' + fams.map(function(f){ return '<option value="' + f + '">' + (C.FAMILY[f] || f) + '</option>'; }).join('') + '</select></label>' +
        '<div class="pl-vt" id="pl-view" role="radiogroup" aria-label="View">' + [['cards', 'Cards', 'grid'], ['items', 'By item', 'list']].map(function(o){ return '<button type="button" role="radio" data-view="' + o[0] + '" aria-label="' + o[1] + '" title="' + o[1] + '" aria-checked="' + (st.view === o[0]) + '" tabindex="' + (st.view === o[0] ? 0 : -1) + '">' + I(o[2]) + '</button>'; }).join('') + '</div></div></div>' +
        '<div id="pl-list"></div>' + (canEdit ? '' : '<div class="c-mt">' + C.note('You can read the library. Editing needs the "Edit drafts of products and rates" permission.', 'lock') + '</div>')});

    /* Library health: photos, package coverage and drafts, each a bar that filters the list when tapped */
    function stats(){
      var its = items(list), withPh = list.filter(function(p){ return p.img; }).length, drafts = C.queued().filter(function(d){ return d.area === 'products'; }).length;
      var slots = its.length * 2, filled = its.reduce(function(n, it){ return n + ['S', 'P'].filter(function(t){ return it.slots[t]; }).length; }, 0);
      var meter = function(k, label, n, of, note, warn){ var pc = of ? Math.round(n / of * 100) : 0; return '<button type="button" class="ph-m' + (warn ? ' warn' : '') + '" data-show="' + k + '" aria-pressed="' + (st.show === k) + '"><span class="ph-l">' + label + '</span><span class="ph-n"><b>' + n + '</b> of ' + of + '</span><span class="ph-bar"><i style="width:' + pc + '%"></i></span><span class="ph-note">' + note + '</span></button>'; };
      doc.getElementById('pl-stats').innerHTML = '<section class="ph" aria-label="Library health"><header class="ph-h"><b>Library health</b><span>' + list.length + ' products · ' + its.length + ' items · ' + fams.length + ' families</span></header><div class="ph-ms">' +
        meter('photo', 'Photos', withPh, list.length, list.length - withPh ? (list.length - withPh) + ' still need a photo' : 'Every product has a photo', list.length - withPh) +
        meter('gap', 'Package coverage', filled, slots, slots - filled ? (slots - filled) + ' Standard or Premium ' + (slots - filled === 1 ? 'slot' : 'slots') + ' empty' : 'Every item has Standard and Premium', slots - filled) +
        '<button type="button" class="ph-m ph-d' + (drafts ? ' warn' : '') + '" data-show="draft" aria-pressed="' + (st.show === 'draft') + '"><span class="ph-l">Drafts waiting</span><span class="ph-big">' + drafts + '</span><span class="ph-note">' + (drafts ? 'Waiting for Sam to publish' : 'Nothing waiting') + '</span></button>' +
        '</div></section>';
      var tc = function(t){ return t === 'all' ? list.length : list.filter(function(p){ return p.tier === t; }).length; };
      doc.getElementById('pl-t').innerHTML = [['all', 'All tiers']].concat(TIERS).map(function(t){ return '<button type="button" role="radio" data-tier="' + t[0] + '" aria-checked="' + (st.tier === t[0]) + '" tabindex="' + (st.tier === t[0] ? 0 : -1) + '">' + t[1] + ' <span class="pl-tn">' + tc(t[0]) + '</span></button>'; }).join('');
    }
    /* One product as a card (DESIGN: product tile, a square photo, its name and tier) */
    /* How many priced houses each product prices, counted once per draw */
    var USE = {};
    function countUse(){
      USE = {};
      A.all().forEach(function(h){ if(A.status(h) === 'draft') return; var seen = {}; A.estimate(h).rooms.forEach(function(r){ r.items.forEach(function(it){ ['E', 'S', 'P'].forEach(function(t){ var a = it.pk && it.pk[t]; if(a && a[3]){ var k = t + '|' + a[3]; if(!seen[k]){ seen[k] = 1; USE[k] = (USE[k] || 0) + 1; } } }); }); }); });
    }
    function card(p){
      var dr = C.draftFor('products', p.id), n = +p.price, num = '$' + (n < 100 && n % 1 ? n.toFixed(2) : Math.round(n).toLocaleString('en-US')), per = (p.per || 'each') === 'each' ? 'each' : 'per ' + p.per, used = USE[p.tier + '|' + p.name] || 0;
      return '<article class="pc' + (dr ? ' drafted' : '') + '">' +
        '<div class="pc-ph">' + (p.img ? photo(p) : '<span class="pc-noph">' + I('image') + '<b>No photo yet</b></span>') + '<span class="pc-tier t-' + p.tier + '"><i aria-hidden="true"></i>' + TN[p.tier] + '</span>' +
          (!p.img && canEdit ? '<button type="button" class="pc-addph" data-photo="' + p.id + '">' + I('plus') + 'Add photo</button>' : '') + '</div>' +
        '<div class="pc-b"><p class="pc-fam">' + esc(p.item) + '</p><h3 class="pc-name"><button type="button" class="pc-open" data-prod="' + p.id + '">' + esc(p.name) + '</button></h3>' +
          '<p class="pc-price"><b>' + num + '</b><span>' + per + '</span></p>' +
          '<div class="pc-f"><div class="pc-s">' + (dr ? '<span class="pc-st dr"><i aria-hidden="true"></i>Draft waiting</span><small class="pc-note">Not live until Sam publishes</small>'
            : '<span class="pc-st ok"><i aria-hidden="true"></i>Live · v' + (p.v || 1) + '</span><small class="pc-note">' + (used ? 'Prices ' + used + (used === 1 ? ' house' : ' houses') : 'Not used by a priced house yet') + '</small>') + '</div>' +
          (canEdit ? '<button type="button" class="pc-edit" data-edit="' + p.id + '" aria-label="Edit ' + esc(p.name) + '" title="Edit">' + I('pencil') + '</button>' : '') + '</div></div></article>';
    }
    function draw(){
      list = all(); stats(); countUse();
      var v = st.q.toLowerCase().trim(), match = function(p){ return p.name.toLowerCase().indexOf(v) > -1 || p.item.toLowerCase().indexOf(v) > -1 || p.id.indexOf(v) > -1; };
      var el = doc.getElementById('pl-list'), filtered = st.show !== 'all' || st.fam !== 'all' || st.tier !== 'all' || v;
      if(st.view === 'cards'){
        var ps = list.filter(function(p){
          if(st.fam !== 'all' && p.fam !== st.fam) return false;
          if(st.tier !== 'all' && p.tier !== st.tier) return false;
          if(v && !match(p)) return false;
          if(st.show === 'photo') return !p.img;
          if(st.show === 'draft') return !!C.draftFor('products', p.id);
          if(st.show === 'gap') return false;
          return true;
        }).sort(function(a, b){ return (C.FAMILY[a.fam] || a.fam).localeCompare(C.FAMILY[b.fam] || b.fam) || a.item.localeCompare(b.item) || 'ESP'.indexOf(a.tier) - 'ESP'.indexOf(b.tier); });
        if(st.show === 'gap'){ st.view = 'items'; return draw(); }
        var groups = []; ps.forEach(function(p){ var g = groups[groups.length - 1]; if(!g || g.fam !== p.fam) groups.push(g = {fam:p.fam, ps:[]}); g.ps.push(p); });
        el.innerHTML = ps.length ? '<p class="pl-count" aria-live="polite"><b>' + ps.length + '</b> ' + (ps.length === 1 ? 'product' : 'products') + (filtered ? ' match' : '') + '</p><div class="pl-groups">' + groups.map(function(g){
          var its = g.ps.map(function(p){ return p.item; }).filter(function(x, i, a){ return a.indexOf(x) === i; }).length;
          return '<section class="pc-grp"><h2 class="pc-gh">' + (C.FAMILY[g.fam] || g.fam) + '<span>' + g.ps.length + (g.ps.length === 1 ? ' product' : ' products') + ' · ' + its + (its === 1 ? ' item' : ' items') + '</span></h2><div class="pc-grid" style="--n:' + Math.min(g.ps.length, 4) + '">' + g.ps.map(card).join('') + '</div></section>';
        }).join('') + '</div>'
          : '<div class="c-empty">' + I('info') + '<p>' + (v ? 'No product or item matches “' + esc(st.q) + '”.' : 'No product matches these filters.') + '</p></div>';
      } else {
        var rows = items(list).filter(function(it){
          if(st.fam !== 'all' && it.fam !== st.fam) return false;
          var pr = TIERS.map(function(t){ return it.slots[t[0]]; }).filter(Boolean);
          if(st.tier !== 'all' && !it.slots[st.tier]) return false;
          if(v && !(it.item.toLowerCase().indexOf(v) > -1 || pr.some(match))) return false;
          if(st.show === 'photo') return pr.some(function(p){ return !p.img; });
          if(st.show === 'gap') return !it.slots.S || !it.slots.P;
          if(st.show === 'draft') return pr.some(function(p){ return C.draftFor('products', p.id); });
          return true;
        });
        el.innerHTML = rows.length ? '<p class="pl-count" aria-live="polite"><b>' + rows.length + '</b> ' + (rows.length === 1 ? 'item' : 'items') + (filtered ? ' match' : '') + '</p><div class="pl-items">' + rows.map(function(it){
          var n = TIERS.filter(function(t){ return it.slots[t[0]]; }).length;
          return '<section class="pl-item" data-item="' + esc(it.item) + '"><header class="pl-ih"><div><h2>' + esc(it.item) + '</h2><p>' + (C.FAMILY[it.fam] || it.fam) + '</p></div><span class="pl-cov" title="Packages with a product">' + n + ' of 3</span></header>' +
            '<div class="pl-slots">' + TIERS.map(function(t){ return tile(it.slots[t[0]], t[0], canEdit); }).join('') + '</div></section>';
        }).join('') + '</div>' : '<div class="c-empty">' + I('info') + '<p>' + (v ? 'No product or item matches “' + esc(st.q) + '”.' : 'Nothing here. Try everything.') + '</p></div>';
      }
      view.querySelectorAll('#pl-view [data-view]').forEach(function(x){ var on = x.getAttribute('data-view') === st.view; x.setAttribute('aria-checked', on); x.tabIndex = on ? 0 : -1; });
      RI.fillIcons(view);
    }

    /* ---------- The side panel: a product, its history, and the edit form ---------- */
    function panel(id){
      var p = list.filter(function(x){ return x.id === id; })[0]; if(!p) return;
      var dr = C.draftFor('products', p.id), n = usedBy(p);
      var d = C.dialog(esc(p.name),
        '<div class="ax-scroll pl-pan">' +
          '<div class="pl-hero"><span class="pl-big">' + photo(p, 'big') + '</span><div class="pl-hero-t"><p class="pl-chips"><span class="pl-chip t">' + TN[p.tier] + '</span><span class="pl-chip">' + (C.FAMILY[p.fam] || p.fam) + '</span><span class="pl-chip code">' + p.id + '</span></p>' +
            '<p class="pl-for">For <b>' + esc(p.item) + '</b></p>' + stateOf(p) + '</div></div>' +
          '<section class="pl-box"><p class="pl-k">Price</p><p class="pl-bigp">' + priceOf(p) + '</p><p class="pl-smp">Sample price until Sam\'s product list arrives.</p>' +
            '<dl class="pl-dl"><div><dt>Source</dt><dd>' + esc(p.src || '') + '</dd></div>' +
            '<div><dt>Supplier page</dt><dd>' + (p.link ? '<a href="' + esc(p.link) + '" target="_blank" rel="noopener">' + esc(p.link.replace(/^https?:\/\//, '')) + ' ' + I('arrow') + '</a>' : '<span class="muted">No link</span>') + '</dd></div>' +
            '<div><dt>Prices</dt><dd>' + (n ? n + ' priced ' + (n === 1 ? 'house' : 'houses') + ' use it under ' + TN[p.tier] : '<span class="muted">No priced house uses it yet</span>') + '</dd></div>' +
            (p.line ? '<div><dt>Line in the sample house</dt><dd><b>' + money(p.line[0]) + ' to ' + money(p.line[1]) + '</b>' + (p.qty ? ' for ' + esc(p.qty) : '') + '<br><span class="muted">This product plus the work, from the rates</span></dd></div>' : '') + '</dl></section>' +
          (dr ? '<section class="pl-dr">' + I('clock') + '<div><b>A draft is waiting</b><span>' + esc(dr.summary || '') + ' · ' + esc(dr.by) + ', ' + C.ago(dr.at) + '</span></div><a href="#/publish">Publish queue</a></section>' : '') +
          (p.img ? '' : '<section class="pl-dr warn">' + I('image') + '<div><b>This product has no photo</b><span>Every product shows a real photo (BACKLOG M3-10). Add one with Edit.</span></div></section>') +
          '<section><h3 class="pl-h3">Versions <span class="bt-cnt">' + (p.hist || []).length + '</span></h3><ol class="pl-hist">' + (p.hist || []).map(function(h, i){
            return '<li' + (i ? '' : ' class="cur"') + '><span class="pl-hv">v' + h.v + '</span><div><b>' + esc(h.change) + '</b><span>' + (h.price != null ? priceOf({price:h.price, per:p.per}) + ' · ' : '') + esc(h.by) + ', ' + C.date(h.at) + (h.note ? ' · ' + esc(h.note) : '') + '</span></div>' + (i ? '' : '<span class="pl-live">Live</span>') + '</li>';
          }).join('') + '</ol><p class="pl-note">Old runs keep the version they were priced with. Nothing is overwritten.</p></section>' +
        '</div>' +
        '<div class="ax-foot"><div class="ax-btns"><button type="button" class="btn btn-secondary" data-dlg-close>Close</button>' + (canEdit ? '<button type="button" class="btn btn-primary" id="pl-edit">' + I('pencil') + 'Edit as draft</button>' : '') + '</div></div>');
      d.classList.add('dlg-drawer'); RI.fillIcons(d);
      var e = d.querySelector('#pl-edit'); if(e) e.addEventListener('click', function(){ d.close(); form(p); });
    }

    /* The form for a new product or an edit.
       A live preview at the top looks like the product card and follows the typing. Then three sections:
       where it goes (item, and the package as three option cards where a taken slot shows its product and cannot be
       picked: one product per item per package), the product (a photo drop area and the name), and the price (price
       with its unit, source and supplier page). Editing shows the item and package as facts, not choices. */
    var SOURCES = ['Sam\'s price book', 'Supplier list, Nov 2026', 'Supplier quote'];
    function form(p, preset){
      var isNew = !p, its = items(list), a = p || {name:'', price:'', per:'each', src:'Sam\'s price book', link:'', img:''};
      var img = a.img || '';
      var open = function(it){ return TIERS.filter(function(t){ return !it.slots[t[0]]; }); };
      var withGap = its.filter(function(it){ return open(it).length; });
      var pickItem = preset ? preset.item : (withGap[0] || {}).item;
      var itemOf = function(name){ return its.filter(function(x){ return x.item === name; })[0]; };
      /* The three packages for an item: an open one is a choice, a taken one names its product */
      var tierCards = function(name){
        var it = itemOf(name), o = it ? open(it) : [], only = o.length === 1;
        return TIERS.map(function(t){
          var taken = it && it.slots[t[0]], on = !taken && ((preset && preset.tier === t[0]) || only);
          return '<label class="pf-tc t-' + t[0] + (taken ? ' taken' : '') + '"><input type="radio" name="pl-tier" value="' + t[0] + '"' + (taken ? ' disabled' : '') + (on ? ' checked' : '') + '>' +
            '<span class="pf-tc-h"><i aria-hidden="true"></i>' + t[1] + '</span><small>' + (taken ? 'Has a product: ' + esc(taken.name) : 'Open') + '</small></label>';
        }).join('');
      };
      var item0 = isNew ? pickItem : a.item;
      var sec = function(n, title, body){ return '<section class="pf-sec"><h3 class="pf-h"><span>' + n + '</span>' + title + '</h3>' + body + '</section>'; };
      var d = C.dialog(isNew ? 'Add a product' : 'Edit product',
        '<form class="ax-scroll pl-form pf" id="pl-form" novalidate>' +
          '<div class="pf-pre" aria-hidden="true"><span class="pf-pre-k">Preview</span><div class="pf-card"><span class="pf-ph" id="pf-ph"></span><div class="pf-ct"><span class="pf-tl" id="pf-tier"></span><b id="pf-name"></b><span class="pf-for" id="pf-for"></span><span class="pf-pr" id="pf-pr"></span></div></div></div>' +
          sec(1, 'Where it goes', isNew ?
            '<div class="field"><label for="pl-item">Item</label><span class="c-select pf-wide"><select id="pl-item">' + withGap.map(function(it){ return '<option' + (it.item === pickItem ? ' selected' : '') + '>' + esc(it.item) + '</option>'; }).join('') + '</select></span><span class="help">Only items with an open package are listed.</span></div>' +
            '<div class="field" id="pl-tf"><span class="flabel">Package</span><div class="pf-tcs" id="pl-trs">' + tierCards(pickItem) + '</div><span class="err" id="pl-terr"></span><span class="help">One product per item per package.</span></div>'
            : '<dl class="pf-facts"><div><dt>Item</dt><dd>' + esc(a.item) + '</dd></div><div><dt>Package</dt><dd><span class="pf-tier t-' + a.tier + '"><i></i>' + TN[a.tier] + '</span></dd></div><div><dt>Code</dt><dd><code>' + a.id + '</code> · v' + (a.v || 1) + '</dd></div></dl>') +
          sec(2, 'The product',
            '<div class="field"><span class="flabel">Photo</span><label class="pf-drop' + (img ? ' has' : '') + '" id="pf-drop" for="pl-file"><span class="pf-dv" id="pl-upv">' + photo({img:img}) + '</span><span class="pf-dt"><b id="pf-dtt">' + (img ? 'Replace the photo' : 'Drop a photo here, or choose a file') + '</b><small>A square photo of the real product, as the presentation shows it. Up to 1.5 MB.</small></span></label><input type="file" id="pl-file" accept="image/*" class="sr">' +
              '<button type="button" class="linkbtn small pf-rm" id="pf-rm"' + (img ? '' : ' hidden') + '>Remove the photo</button></div>' +
            '<div class="field"><label for="pl-n">Product name</label><input class="input" id="pl-n" value="' + esc(a.name) + '" placeholder="For example: Painted shaker, soft close" autocomplete="off"><span class="err"></span></div>') +
          sec(3, 'Price',
            '<div class="pl-2"><div class="field"><label for="pl-pr">Price</label><div class="pf-money"><span aria-hidden="true">$</span><input class="input" id="pl-pr" inputmode="decimal" value="' + (a.price === '' ? '' : a.price) + '" placeholder="0.00" autocomplete="off"></div><span class="err"></span></div>' +
              '<div class="field"><label for="pl-per">Per</label><span class="c-select"><select id="pl-per">' + PER.map(function(u){ return '<option value="' + u + '"' + (u === (a.per || 'each') ? ' selected' : '') + '>' + (u === 'each' ? 'Each' : u) + '</option>'; }).join('') + '</select></span></div></div>' +
            '<p class="pl-help">One price for the product. A line\'s Low and High comes from this price and the rates together.</p>' +
            '<div class="field"><label for="pl-src">Source</label><input class="input" id="pl-src" list="pf-srcs" value="' + esc(a.src || '') + '" autocomplete="off"><datalist id="pf-srcs">' + SOURCES.map(function(x){ return '<option value="' + esc(x) + '">'; }).join('') + '</datalist></div>' +
            '<div class="field"><label for="pl-ln">Supplier page <span class="opt">(optional)</span></label><input class="input" id="pl-ln" type="url" value="' + esc(a.link || '') + '" placeholder="https://" autocomplete="off"></div>') +
        '</form><div class="ax-foot pf-foot"><p class="pf-fn">' + I('info') + '<span>Saves a draft. Only Sam publishes; old runs keep their version.</span></p><div class="ax-btns"><button type="button" class="btn btn-secondary" data-dlg-close>Cancel</button><button type="submit" form="pl-form" class="btn btn-primary">' + (isNew ? 'Save the draft' : 'Save changes as draft') + '</button></div></div>');
      d.classList.add('dlg-drawer'); RI.fillIcons(d);
      var sel = d.querySelector('#pl-item');
      /* The preview follows the form */
      function preview(){
        var it = isNew ? (sel ? sel.value : '') : a.item, t = isNew ? ((d.querySelector('input[name="pl-tier"]:checked') || {}).value || '') : a.tier;
        var nm = d.querySelector('#pl-n').value.trim(), pr = +d.querySelector('#pl-pr').value, per = d.querySelector('#pl-per').value;
        d.querySelector('#pf-ph').innerHTML = photo({img:img});
        d.querySelector('#pf-tier').innerHTML = t ? '<span class="pf-tier t-' + t + '"><i></i>' + TN[t] + '</span>' : '<span class="pf-tier"><i></i>Choose a package</span>';
        d.querySelector('#pf-name').textContent = nm || 'Product name';
        d.querySelector('#pf-name').classList.toggle('pf-none', !nm);
        d.querySelector('#pf-for').textContent = it ? 'For ' + it : '';
        d.querySelector('#pf-pr').innerHTML = pr > 0 ? '<b>' + priceOf({price:pr, per:per}).replace(/ (each|per .*)$/, '') + '</b> ' + (per === 'each' ? 'each' : 'per ' + per) : '<span class="muted">No price yet</span>';
      }
      d.addEventListener('input', preview);
      d.addEventListener('change', function(e){ if(e.target.name === 'pl-tier'){ var tf = d.querySelector('#pl-tf'); if(tf) tf.classList.remove('invalid'); } preview(); });
      if(sel) sel.addEventListener('change', function(){ d.querySelector('#pl-trs').innerHTML = tierCards(this.value); d.querySelector('#pl-tf').classList.remove('invalid'); preview(); });
      /* Photo: choose or drop a file; replace or remove */
      function setImg(v){ img = v; d.querySelector('#pl-upv').innerHTML = photo({img:img}); d.querySelector('#pf-drop').classList.toggle('has', !!img); d.querySelector('#pf-dtt').textContent = img ? 'Replace the photo' : 'Drop a photo here, or choose a file'; d.querySelector('#pf-rm').hidden = !img; preview(); }
      function readFile(f){
        if(!f) return; if(!/^image\//.test(f.type)){ RI.toast('Choose an image file, such as a JPG or PNG.', 'warn'); return; }
        if(f.size > 1.5 * 1024 * 1024){ RI.toast('That photo is over 1.5 MB. Choose a smaller one.', 'warn'); return; }
        var rd = new FileReader(); rd.onload = function(){ setImg(rd.result); }; rd.readAsDataURL(f);
      }
      d.querySelector('#pl-file').addEventListener('change', function(){ readFile(this.files && this.files[0]); });
      var drop = d.querySelector('#pf-drop');
      ['dragenter', 'dragover'].forEach(function(ev){ drop.addEventListener(ev, function(e){ e.preventDefault(); drop.classList.add('over'); }); });
      ['dragleave', 'drop'].forEach(function(ev){ drop.addEventListener(ev, function(e){ e.preventDefault(); drop.classList.remove('over'); if(ev === 'drop') readFile(e.dataTransfer.files && e.dataTransfer.files[0]); }); });
      d.querySelector('#pf-rm').addEventListener('click', function(){ setImg(''); });
      preview();
      d.querySelector('#pl-form').addEventListener('submit', function(ev){
        ev.preventDefault();
        var name = d.querySelector('#pl-n'), prEl = d.querySelector('#pl-pr'), price = Math.round(+prEl.value * 100) / 100, per = d.querySelector('#pl-per').value;
        if(isNew){ var tier0 = (d.querySelector('input[name="pl-tier"]:checked') || {}).value; if(!tier0){ var tf0 = d.querySelector('#pl-tf'); tf0.classList.add('invalid'); d.querySelector('#pl-terr').textContent = 'Choose a package.'; tf0.scrollIntoView({block:'center'}); return; } }
        if(!name.value.trim()){ RI.form.setInvalid(name, 'Give the product a name.'); name.focus(); return; }
        if(!(price > 0)){ RI.form.setInvalid(prEl, 'Enter the product\'s price, for example 9 or 68.50.'); prEl.focus(); return; }
        var after = {name:name.value.trim(), price:price, per:per, src:d.querySelector('#pl-src').value.trim(), link:d.querySelector('#pl-ln').value.trim(), img:img};
        if(isNew){
          var tier = d.querySelector('input[name="pl-tier"]:checked').value, item = sel.value, it = itemOf(item);
          after._new = true; after.item = item; after.tier = tier; after.fam = it.fam;
          d.close();
          C.askWhy('New product: ' + after.name, item + ' · ' + TN[tier] + ' · ' + priceOf(after), function(why){ C.addDraft({area:'products', ref:'new-' + item + '-' + tier, title:'New product: ' + after.name, summary:item + ', ' + TN[tier] + ': ' + priceOf(after), after:after, why:why}); RI.toast('Saved as a draft. It waits in the publish queue.', 'check'); draw(); });
          return;
        }
        var ch = []; if(after.name !== a.name) ch.push('name'); if(price !== a.price || per !== a.per) ch.push('price ' + priceOf(a) + ' becomes ' + priceOf(after)); if(after.src !== (a.src || '')) ch.push('source'); if(after.link !== (a.link || '')) ch.push('supplier page'); if(after.img !== (a.img || '')) ch.push('photo');
        if(!ch.length){ d.close(); return; }
        d.close();
        C.askWhy('Product: ' + a.name, ch.join('; '), function(why){ C.addDraft({area:'products', ref:a.id, title:'Product: ' + a.name, summary:ch.join('; '), after:after, why:why}); RI.toast('Saved as a draft. It waits in the publish queue.', 'check'); draw(); });
      });
    }

    view.querySelector('#pl-q').addEventListener('input', function(){ st.q = this.value; draw(); });
    view.querySelector('#pl-f').addEventListener('change', function(){ st.fam = this.value; draw(); });
    var tg = view.querySelector('#pl-t');
    tg.addEventListener('click', function(e){ var b = e.target.closest('[data-tier]'); if(b){ st.tier = b.getAttribute('data-tier'); draw(); } });
    tg.addEventListener('keydown', function(e){ var bs = [].slice.call(tg.querySelectorAll('[data-tier]')), i = bs.indexOf(e.target), k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if(i < 0 || !k) return; e.preventDefault(); st.tier = bs[(i + k + bs.length) % bs.length].getAttribute('data-tier'); draw(); var on = tg.querySelector('[aria-checked="true"]'); if(on) on.focus(); });
    var vg = view.querySelector('#pl-view');
    function setView(v){ st.view = v; C.set('pl.view', v); draw(); }
    vg.addEventListener('click', function(e){ var b = e.target.closest('[data-view]'); if(b) setView(b.getAttribute('data-view')); });
    vg.addEventListener('keydown', function(e){ if(e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; e.preventDefault(); setView(st.view === 'cards' ? 'items' : 'cards'); var on = vg.querySelector('[aria-checked="true"]'); if(on) on.focus(); });
    view.addEventListener('click', function(e){
      var s = e.target.closest('[data-show]'); if(s){ st.show = st.show === s.getAttribute('data-show') ? 'all' : s.getAttribute('data-show'); draw(); return; }
      var ed = e.target.closest('[data-edit]'); if(ed){ form(list.filter(function(x){ return x.id === ed.getAttribute('data-edit'); })[0]); return; }
      var ph = e.target.closest('[data-photo]'); if(ph){ form(list.filter(function(x){ return x.id === ph.getAttribute('data-photo'); })[0]); return; }
      var p = e.target.closest('[data-prod]'); if(p){ panel(p.getAttribute('data-prod')); return; }
      var ad = e.target.closest('[data-add]'); if(ad){ form(null, {item:ad.closest('[data-item]').getAttribute('data-item'), tier:ad.getAttribute('data-add')}); return; }
      if(e.target.closest('#pl-new')) form(null);
    });
    draw();
    if(q.p) panel(q.p);
  }, {nav:'products', perm:'rulebook.view'});
  /* This screen replaces the older products table: its route goes first */
  C.routes.unshift(C.routes.pop());
})();
