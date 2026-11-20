/* Console: pricing. Products (APP_FLOW 7, M4-24), rates (M4-25) and check results (M3-19, PDF section 57).
   Staff with the permission edit products and rates as drafts; only Sam publishes. */
(function(){
  var RI = window.RI, A = RI.App, C = RI.Con, doc = document;
  var DAY = 86400000, now = Date.now();
  var TIER = {E:'Essential', S:'Standard', P:'Premium'};

  C.SEEDS.push(function(){
    var list = [];
    RI.SAMPLE.rooms.forEach(function(r){ r.items.forEach(function(it){ ['E','S','P'].forEach(function(k){ var a = it.pk[k]; if(!a || !a[3]) return;
      if(list.some(function(p){ return p.name === a[3] && p.tier === k; })) return;
      list.push({id:'p' + (1100 + list.length), item:it.name, fam:C.famOf(it.name), tier:k, name:a[3], lo:a[1], hi:a[2], unit:it.qty || '', src:list.length % 3 ? 'Supplier list, Nov 2026' : 'Sam\'s price book', img:(RI.PRODUCT_IMG[it.id] || {})[k] || '', v:1 + list.length % 3, at:now - (3 + list.length % 11) * DAY}); }); }); });
    C.set('products', list);
    C.set('rates', RI.RATES.map(function(r, i){ return {name:r[0], desc:r[1], unit:r[2], lo:r[3], hi:r[4], region:'Sample region', src:i % 2 ? 'Sam\'s price book' : 'Supplier list, Nov 2026', v:i === 0 ? 7 : 2 + i % 4, at:now - (4 + i * 2) * DAY}; }));
  });
  C.APPLY.products = function(d){ var l = C.get('products', []); l.forEach(function(p){ if(p.id === d.ref){ Object.assign(p, d.after); p.v++; p.at = Date.now(); } }); C.set('products', l); };
  C.APPLY.rates = function(d){ var l = C.get('rates', []), r = l[+d.ref]; if(r){ r.lo = d.after.lo; r.hi = d.after.hi; if(d.after.src) r.src = d.after.src; r.v = (r.v || 0) + 1; r.at = Date.now(); C.set('rates', l); } };

  /* A small range line: the bar from Low to High on a shared scale, as on the user's screens */
  function rline(lo, hi, max){ return '<span class="pr-rl" aria-hidden="true"><i style="left:' + (lo / max * 100).toFixed(1) + '%;width:' + Math.max(1.5, (hi - lo) / max * 100).toFixed(1) + '%"></i></span>'; }
  function money2(n){ return '$' + (n < 100 ? n.toFixed(2) : Math.round(n).toLocaleString('en-US')); }

  /* ---------- Products ---------- */
  C.route('/products', function(view){
    var list = C.get('products', []), st = {tier:'all', fam:'all', q:''}, canEdit = C.can('pricing.edit');
    var fams = list.map(function(p){ return p.fam; }).filter(function(v, i, a){ return a.indexOf(v) === i; });
    view.innerHTML = C.page({kicker:'Pricing', title:'Products', sub:'The product library: what goes in under each goal, with its Low and High, unit and source. A line can be priced from a rate or from a library product.',
      body:'<div class="c-toolbar">' + C.seg('pr-t', [['all','All tiers',list.length],['E','Essential'],['S','Standard'],['P','Premium']], 'all') +
        '<div class="c-tools">' + C.search('pr-q', 'Product or item', '') + '<label class="c-select"><span class="sr">Family</span><select id="pr-f"><option value="all">All families</option>' + fams.map(function(f){ return '<option value="' + f + '">' + (C.FAMILY[f] || f) + '</option>'; }).join('') + '</select></label></div></div><div id="pr-list"></div>'});
    function draw(){
      var v = st.q.toLowerCase(), rows = list.filter(function(p){ return (st.tier === 'all' || p.tier === st.tier) && (st.fam === 'all' || p.fam === st.fam) && (!v || (p.name + ' ' + p.item).toLowerCase().indexOf(v) > -1); });
      var max = Math.max.apply(null, list.map(function(p){ return p.hi || 0; })) * 1.05;
      doc.getElementById('pr-list').innerHTML = C.table({cls:'pr', empty:'No product matches.', cols:[{label:'Product'},{label:'For'},{label:'Tier'},{label:'Low and High', num:true},{label:''},{label:'Source'},{label:'State'}],
        rows:rows.map(function(p){ var dr = C.draftFor('products', p.id); return {attr:canEdit ? 'data-edit="' + p.id + '" tabindex="0" role="button"' : '', cells:['<span class="pr-p">' + (p.img ? '<img src="' + RI.img(p.img) + '" alt="" loading="lazy">' : '<span class="pr-noimg">' + RI.icon('tag','i-sm') + '</span>') + '<span><b>' + RI.esc(p.name) + '</b><small>' + p.id + '</small></span></span>', RI.esc(p.item) + '<small class="muted"> · ' + (C.FAMILY[p.fam] || p.fam) + '</small>', '<span class="tier tier-' + p.tier + '">' + TIER[p.tier] + '</span>', p.lo != null ? C.range(p.lo, p.hi) : '<span class="muted">Keep</span>', p.lo != null ? rline(p.lo, p.hi, max) : '', RI.esc(p.src) + '<small class="muted"> · ' + C.date(p.at) + '</small>', dr ? C.lbl('queued') : C.lbl('published', 'v' + p.v)]}; })}) +
        C.note('Sample products and prices, drawn from the sample house. Sam\'s product library replaces them.');
      RI.fillIcons(doc.getElementById('pr-list'));
    }
    view.querySelector('#pr-t').addEventListener('click', function(e){ var b = e.target.closest('[data-v]'); if(!b) return; st.tier = b.getAttribute('data-v'); view.querySelectorAll('#pr-t [data-v]').forEach(function(x){ x.setAttribute('aria-selected', x === b); }); draw(); });
    view.querySelector('#pr-q').addEventListener('input', function(){ st.q = this.value; draw(); });
    view.querySelector('#pr-f').addEventListener('change', function(){ st.fam = this.value; draw(); });
    view.addEventListener('click', function(e){ var r = e.target.closest('[data-edit]'); if(r) edit(r.getAttribute('data-edit')); });
    view.addEventListener('keydown', function(e){ var r = e.target.closest('[data-edit]'); if(r && e.key === 'Enter') edit(r.getAttribute('data-edit')); });
    function edit(id){
      var p = list.filter(function(x){ return x.id === id; })[0];
      var d = C.dialog('Edit product', '<div class="pe-top">' + (p.img ? '<img src="' + RI.img(p.img) + '" alt="">' : '') + '<div><p class="c-kicker">' + p.id + ' · ' + TIER[p.tier] + '</p><p><b>' + RI.esc(p.item) + '</b></p></div></div>' +
        '<form class="form-grid" id="pe-f" novalidate><div class="field"><label for="pe-n">Product</label><input class="input" id="pe-n" value="' + RI.esc(p.name) + '"></div>' +
        (p.lo != null ? '<div class="pe-2"><div class="field"><label for="pe-lo">Low</label><div class="in-suf"><input class="input" id="pe-lo" inputmode="numeric" value="' + p.lo + '"><span>$</span></div></div><div class="field"><label for="pe-hi">High</label><div class="in-suf"><input class="input" id="pe-hi" inputmode="numeric" value="' + p.hi + '"><span>$</span></div><span class="err"></span></div></div>' : '') +
        '<div class="field"><label for="pe-s">Source</label><input class="input" id="pe-s" value="' + RI.esc(p.src) + '"></div>' +
        C.note('Saving makes a draft. Old runs keep the product version they were made with.') +
        '<div class="cta-row" style="justify-content:flex-end"><button type="button" class="btn btn-secondary" data-dlg-close>Cancel</button><button type="submit" class="btn btn-primary">Save as draft</button></div></form>');
      RI.fillIcons(d);
      d.querySelector('#pe-f').addEventListener('submit', function(e){
        e.preventDefault(); var after = {name:d.querySelector('#pe-n').value.trim(), src:d.querySelector('#pe-s').value.trim()};
        if(p.lo != null){ after.lo = +d.querySelector('#pe-lo').value; after.hi = +d.querySelector('#pe-hi').value; if(!(after.lo > 0 && after.hi >= after.lo)){ RI.form.setInvalid(d.querySelector('#pe-hi'), 'High must be at least Low.'); return; } }
        var ch = []; if(after.name !== p.name) ch.push('name'); if(after.src !== p.src) ch.push('source'); if(p.lo != null && (after.lo !== p.lo || after.hi !== p.hi)) ch.push(RI.money(p.lo) + ' to ' + RI.money(p.hi) + ' becomes ' + RI.money(after.lo) + ' to ' + RI.money(after.hi));
        if(!ch.length){ d.close(); return; }
        d.close(); C.askWhy('Product: ' + p.name, ch.join('; '), function(why){ C.addDraft({area:'products', ref:p.id, title:'Product: ' + p.name, summary:ch.join('; '), after:after, why:why}); RI.toast('Saved as a draft. It waits in the publish queue.', 'check'); C.render(); });
      });
    }
    draw();
  }, {nav:'products', perm:'rulebook.view'});

  /* ---------- Rates (APP_FLOW 7, BACKLOG M3-09, M3-22, M4-25, SCHEMA rates and rate_versions, PDF 59) ----------
     The rate library: a Low and a High installed rate per activity and unit, with region, effective date, source,
     status and versions. Never one number. Staff with pricing.edit save a draft; only Sam publishes. Nothing is
     overwritten: every version stays visible, and an older one can be restored as a new draft (SECURITY 18).
     Mobile first: one list that is a stack of cards on a phone and a compact table on a computer; a rate opens in
     a sheet (full screen on a phone, a side panel on a computer). */
  var RT_TRADES = ['Flooring', 'Painting', 'Carpentry', 'Cabinets', 'Plumbing', 'Electrical', 'Drywall'];
  var RT_META = {
    'LVP flooring':['R-FL-LVP-SF', 'Flooring'], 'Interior painting':['R-PT-WALL-SF', 'Painting'], 'Hardwood refinish':['R-FL-HWR-SF', 'Flooring'],
    'Baseboard':['R-CP-BASE-LF', 'Carpentry'], 'Cabinet refinish':['R-CB-REF-LF', 'Cabinets'], 'Interior door':['R-CP-DOOR-EA', 'Carpentry'],
    'Bath vanity':['R-PL-VAN-EA', 'Plumbing'], 'Light fixture':['R-EL-FIX-EA', 'Electrical']
  };
  /* More sample lines so the library reads at a real size. One has no rate yet: SCHEMA lets Low and High both be empty */
  var RT_EXTRA = [
    ['Carpet', 'Pad and carpet, stretched in', 'sq ft', 3.2, 5.6, 'R-FL-CPT-SF', 'Flooring'],
    ['Tile floor', 'Ceramic, thinset and grout', 'sq ft', 11, 18, 'R-FL-TILE-SF', 'Flooring'],
    ['Ceiling painting', 'Flat white over primer', 'sq ft', 1.4, 2.6, 'R-PT-CEIL-SF', 'Painting'],
    ['Exterior door', 'Pre-hung steel, installed', 'each', 1400, 2500, 'R-CP-EXD-EA', 'Carpentry'],
    ['Laminate countertop', 'Post-formed, installed', 'linear ft', 38, 64, 'R-CB-CTL-LF', 'Cabinets'],
    ['Kitchen faucet', 'Pull-down, installed', 'each', 380, 690, 'R-PL-FAU-EA', 'Plumbing'],
    ['Shower valve', 'Pressure balanced, trim included', 'each', null, null, 'R-PL-SHV-EA', 'Plumbing'],
    ['Outlets and switches', 'Device and plate, standard', 'each', 45, 85, 'R-EL-DEV-EA', 'Electrical'],
    ['Drywall patch', 'Patch, tape, finish and prime', 'each', 180, 340, 'R-DW-PATCH-EA', 'Drywall']
  ];
  var RT_WHY = ['Supplier list for the quarter', 'Two installers raised their prices', 'The lab house back-test showed High too low', 'Matched to Sam\'s price book', 'Measured jobs ran larger than the guide'];
  /* Rates seeded before this screen lacked a code and a trade; add them, and the extra lines, once */
  function rtList(){
    var list = C.get('rates', []), changed = false;
    list.forEach(function(r){ if(!r.code){ var m = RT_META[r.name] || ['R-' + r.name.slice(0, 3).toUpperCase(), 'Carpentry']; r.code = m[0]; r.trade = m[1]; changed = true; } });
    RT_EXTRA.forEach(function(x, i){ if(list.some(function(r){ return r.code === x[5]; })) return;
      list.push({name:x[0], desc:x[1], unit:x[2], lo:x[3], hi:x[4], code:x[5], trade:x[6], region:'Sample region', src:x[3] == null ? '' : i % 2 ? 'Sam\'s price book' : 'Supplier list, Nov 2026', v:x[3] == null ? 0 : 1 + (i * 3) % 5, at:now - (3 + i * 3) * DAY}); changed = true; });
    if(changed) C.set('rates', list);
    return list;
  }
  var rtMoney = function(n){ return n == null ? '' : '$' + (n < 100 ? n.toFixed(2) : Math.round(n).toLocaleString('en-US')); };
  var rtRange = function(lo, hi, unit){ return lo == null ? '<span class="rlb-none">No rate yet</span>' : '<span class="rlb-r"><b>' + rtMoney(lo) + '</b><em>to</em><b>' + rtMoney(hi) + '</b></span>' + (unit ? '<small>per ' + RI.esc(unit) + '</small>' : ''); };
  var rtShort = function(t){ return new Date(t).toLocaleDateString('en-US', {month:'short', day:'numeric'}); };
  /* Versions: the ones published in this browser come from the publish queue (with their before values);
     older ones are sample history so the timeline shows its shape */
  function rtHistory(r, i){
    if(r.lo == null) return [];
    var pubs = C.drafts().filter(function(d){ return d.area === 'rates' && d.ref === String(i) && d.status === 'published'; }).sort(function(a, b){ return b.doneAt - a.doneAt; });
    var top = pubs[0] && pubs[0].toV === r.v ? pubs[0] : null;
    var out = [{v:r.v, lo:r.lo, hi:r.hi, src:r.src, at:r.at, by:top ? top.by : (r.v % 2 ? 'Marcus Hill' : 'Dana Reyes'), pub:top ? top.doneBy : 'Sam', why:top ? top.why : RT_WHY[r.v % RT_WHY.length], cur:true}];
    var prev = top && top.before ? top.before : null;
    for(var k = r.v - 1, n = 1; k >= 1 && n <= 5; k--, n++){
      var f = 1 - 0.035 * n, lo = prev && n === 1 ? prev.lo : Math.round(r.lo * f * 20) / 20, hi = prev && n === 1 ? prev.hi : Math.round(r.hi * f * 20) / 20;
      if(r.lo >= 100){ lo = Math.round(lo); hi = Math.round(hi); }
      out.push({v:k, lo:lo, hi:hi, src:k % 2 ? 'Sam\'s price book' : 'Supplier list, ' + new Date(r.at - n * 28 * DAY).toLocaleDateString('en-US', {month:'short', year:'numeric'}), at:r.at - n * 28 * DAY, by:k % 2 ? 'Marcus Hill' : 'Dana Reyes', pub:'Sam', why:k === 1 ? 'First published rate' : RT_WHY[k % RT_WHY.length]});
    }
    return out;
  }

  C.route('/rates', function(view){
    var list = rtList(), canEdit = C.can('pricing.edit'), st = {q:'', trade:'all', s:'all'}, open = null;
    var stateOf = function(r, i){ return r.lo == null ? 'none' : C.draftFor('rates', String(i)) ? 'queued' : 'pub'; };
    var count = function(s){ return list.filter(function(r, i){ return s === 'all' || stateOf(r, i) === s; }).length; };
    view.innerHTML = C.page({kicker:'Pricing', title:'Rates', sub:'The rate library: a Low and a High installed rate per activity and unit, with the region, effective date and source. Check 4 prices a line only from a published rate.',
      body:'<div class="rlb-tools">' + C.search('rlb-q', 'Search by activity or code', '') +
        '<label class="c-select rlb-sel"><span class="sr">Trade</span><select id="rlb-trade"><option value="all">All trades</option>' + RT_TRADES.map(function(t){ return '<option>' + t + '</option>'; }).join('') + '</select></label>' +
        '<span class="rlb-region">' + RI.icon('pin', 'i-sm') + 'Sample region<small>One region in version one</small></span></div>' +
        '<div class="rlb-status" id="rlb-s" role="radiogroup" aria-label="Status"></div><div id="rlb-body"></div>' +
        '<div class="c-mt">' + C.note('Sample rates. Low and High only, never one number. Sam\'s rate library replaces them.') + '</div>'});

    function statusLbl(r, i){
      var s = stateOf(r, i);
      if(s === 'none') return '<span class="lb lb-off">No rate yet</span>';
      if(s === 'queued') return '<span class="lb lb-queued">In the queue</span>';
      return '<span class="lb lb-pub">Published v' + r.v + '</span>';
    }
    function draw(){
      var q = st.q, rows = list.map(function(r, i){ return {r:r, i:i}; }).filter(function(x){ var r = x.r;
        return (st.trade === 'all' || r.trade === st.trade) && (st.s === 'all' || stateOf(r, x.i) === st.s) && (!q || (r.name + ' ' + r.code + ' ' + r.desc).toLowerCase().indexOf(q) > -1); });
      doc.getElementById('rlb-s').innerHTML = [['all', 'All'], ['pub', 'Published'], ['queued', 'In the queue'], ['none', 'No rate yet']].map(function(o){
        return '<button type="button" role="radio" data-s="' + o[0] + '" aria-checked="' + (st.s === o[0]) + '">' + o[1] + '<span class="n">' + count(o[0]) + '</span></button>'; }).join('');
      var none = count('none');
      var html = (none && st.s !== 'none' ? '<button type="button" class="rlb-alert" data-s="none">' + RI.icon('warn', 'i-sm') + '<span><b>' + none + (none === 1 ? ' activity has' : ' activities have') + ' no rate yet.</b> Lines that use ' + (none === 1 ? 'it' : 'them') + ' show &ldquo;Not priced yet&rdquo; until Sam publishes a Low and a High.</span>' + RI.icon('arrow', 'i-sm') + '</button>' : '');
      if(!rows.length){ doc.getElementById('rlb-body').innerHTML = html + '<div class="c-empty">' + RI.icon('search') + '<p>No rate matches. Try another word, or show all trades.</p></div>'; RI.fillIcons(doc.getElementById('rlb-body')); return; }
      html += '<ul class="rlb-list" role="list"><li class="rlb-head" aria-hidden="true"><span>Activity</span><span>Unit</span><span class="num">Low</span><span class="num">High</span><span>Effective</span><span>Source</span><span>Status</span><span></span></li>';
      RT_TRADES.forEach(function(t){
        var g = rows.filter(function(x){ return x.r.trade === t; }); if(!g.length) return;
        html += '<li class="rlb-grp"><span>' + t + '</span><small>' + g.length + (g.length === 1 ? ' rate' : ' rates') + '</small></li>';
        g.forEach(function(x){ var r = x.r, i = x.i, d = C.draftFor('rates', String(i));
          html += '<li class="rlb-row' + (r.lo == null ? ' is-none' : '') + (open === i ? ' is-open' : '') + '"><button type="button" class="rlb-hit" data-i="' + i + '" aria-label="Open ' + RI.esc(r.name) + '">' +
            '<span class="rlb-name"><b>' + RI.esc(r.name) + '</b><small><code>' + r.code + '</code> &middot; ' + RI.esc(r.desc) + '</small></span>' +
            '<span class="rlb-unit">' + RI.esc(r.unit) + '</span>' +
            '<span class="rlb-lo num">' + (r.lo == null ? '<span class="muted">&ndash;</span>' : rtMoney(r.lo)) + '</span><span class="rlb-hi num">' + (r.hi == null ? '<span class="muted">&ndash;</span>' : rtMoney(r.hi)) + '</span>' +
            '<span class="rlb-val">' + rtRange(r.lo, r.hi, r.unit) + '</span>' +
            '<span class="rlb-eff">' + (r.lo == null ? '<span class="muted">&ndash;</span>' : C.date(r.at)) + '</span><span class="rlb-src">' + (r.src ? RI.esc(r.src) : '<span class="muted">&ndash;</span>') + '</span>' +
            '<span class="rlb-meta">' + (r.lo == null ? 'Waiting for Sam\'s Low and High' : 'Effective ' + rtShort(r.at) + ' &middot; ' + RI.esc(r.src)) + (d ? ' &middot; <b class="rlb-q">Draft: ' + rtMoney(d.after.lo) + ' to ' + rtMoney(d.after.hi) + '</b>' : '') + '</span>' +
            '<span class="rlb-st">' + statusLbl(r, i) + '</span><span class="rlb-go">' + RI.icon('chev', 'i-sm') + '</span></button></li>';
        });
      });
      doc.getElementById('rlb-body').innerHTML = html + '</ul>';
      RI.fillIcons(doc.getElementById('rlb-body')); RI.fillIcons(doc.getElementById('rlb-s'));
    }

    /* ---------- One rate: current values, the edit, the queue, every version ---------- */
    var sheet = doc.createElement('dialog'); sheet.className = 'rlb-sheet'; sheet.setAttribute('aria-labelledby', 'rlb-h'); view.appendChild(sheet);
    sheet.addEventListener('close', function(){ open = null; draw(); });
    sheet.addEventListener('click', function(e){ if(e.target === sheet) sheet.close(); });
    function bars(r, nlo, nhi){
      var hasNew = nlo != null && nhi != null && (nlo !== r.lo || nhi !== r.hi), max = Math.max(r.hi || 0, hasNew ? nhi : 0) * 1.25 || 1;
      var bar = function(lo, hi, cls, label){ return '<div class="rlb-bar ' + cls + '"><span>' + label + '</span><span class="rlb-track"><i style="left:' + (lo / max * 100).toFixed(1) + '%;width:' + Math.max(1.5, (hi - lo) / max * 100).toFixed(1) + '%"></i></span><b>' + rtMoney(lo) + ' to ' + rtMoney(hi) + '</b></div>'; };
      return '<div class="rlb-bars">' + (r.lo != null ? bar(r.lo, r.hi, 'cur', 'Now') : '') + (hasNew ? bar(nlo, nhi, 'new', 'Draft') : '') + '</div>';
    }
    function pctTxt(a, b){ if(a == null || !b) return ''; var p = Math.round((b - a) / a * 100); return p === 0 ? 'no change' : (p > 0 ? '+' : '') + p + '%'; }
    function openSheet(i){
      open = i; var r = list[i], d = C.draftFor('rates', String(i)), hist = rtHistory(r, i), ed = {lo:d ? d.after.lo : r.lo, hi:d ? d.after.hi : r.hi, src:(d && d.after.src) || r.src || ''};
      sheet.innerHTML = '<div class="rlb-sh">' +
        '<header class="rlb-sh-h"><button type="button" class="rlb-x" data-close aria-label="Close">' + RI.icon('x') + '</button><div><p class="rlb-code"><code>' + r.code + '</code> &middot; ' + r.trade + '</p><h2 id="rlb-h">' + RI.esc(r.name) + '</h2><p class="muted">' + RI.esc(r.desc) + '</p></div>' + statusLbl(r, i) + '</header>' +
        '<div class="rlb-sh-b">' +
          '<section class="rlb-now"><div class="rlb-big">' + rtRange(r.lo, r.hi, r.unit) + '</div>' + (r.lo == null ? '<p class="rlb-why">Lines that use this activity show &ldquo;Not priced yet&rdquo; (check 4) until Sam publishes a Low and a High. Nothing is shown as zero.</p>' : '') +
            '<div id="rlb-bars">' + bars(r, ed.lo, ed.hi) + '</div>' +
            '<dl class="rlb-facts"><div><dt>Effective</dt><dd>' + (r.lo == null ? '&ndash;' : C.date(r.at)) + '</dd></div><div><dt>Source</dt><dd>' + (r.src ? RI.esc(r.src) : '&ndash;') + '</dd></div><div><dt>Region</dt><dd>' + RI.esc(r.region) + '</dd></div><div><dt>Version</dt><dd>' + (r.v ? 'v' + r.v : 'None yet') + '</dd></div></dl></section>' +
          (d ? '<section class="rlb-queue">' + RI.icon('clock', 'i-sm') + '<div><b>In the publish queue: ' + rtMoney(d.after.lo) + ' to ' + rtMoney(d.after.hi) + '</b><span>Saved by ' + RI.esc(d.by) + ' ' + C.ago(d.at) + (d.why ? ': &ldquo;' + RI.esc(d.why) + '&rdquo;' : '') + '</span><a href="#/publish">Open the publish queue</a></div></section>' : '') +
          (canEdit ? '<section class="rlb-edit"><h3>' + (r.lo == null ? 'Add a Low and a High' : d ? 'Change the draft' : 'Change this rate') + '</h3><p class="small muted">Saved as a draft. It goes live when Sam publishes it, after a back-test.</p>' +
            '<div class="rlb-fields"><label><span>Low</span><span class="rlb-in"><i>$</i><input class="input" type="number" inputmode="decimal" step="0.05" min="0" id="rlb-lo" value="' + (ed.lo == null ? '' : ed.lo) + '"></span></label>' +
            '<label><span>High</span><span class="rlb-in"><i>$</i><input class="input" type="number" inputmode="decimal" step="0.05" min="0" id="rlb-hi" value="' + (ed.hi == null ? '' : ed.hi) + '"></span></label>' +
            '<label class="rlb-wide"><span>Source</span><input class="input" type="text" id="rlb-src" value="' + RI.esc(ed.src) + '" placeholder="For example: Supplier list, Dec 2026"></label></div>' +
            '<p class="rlb-delta" id="rlb-delta" aria-live="polite"></p></section>' : '<p class="rlb-ro">' + RI.icon('lock', 'i-sm') + 'You can read rates. Changing one needs the pricing.edit permission.</p>') +
          (hist.length ? '<section class="rlb-hist"><h3>Versions</h3><ol>' + hist.map(function(h){
            return '<li' + (h.cur ? ' class="cur"' : '') + '><span class="rlb-dot" aria-hidden="true"></span><div class="rlb-hv"><div class="rlb-hv-t"><b>v' + h.v + '</b>' + (h.cur ? '<span class="lb lb-pub">Live</span>' : '') + '<span class="rlb-hv-r">' + rtMoney(h.lo) + ' to ' + rtMoney(h.hi) + '</span></div>' +
              '<small>Effective ' + C.date(h.at) + ' &middot; ' + RI.esc(h.src) + '</small><small>Drafted by ' + RI.esc(h.by) + ', published by ' + RI.esc(h.pub) + '</small>' + (h.why ? '<p>&ldquo;' + RI.esc(h.why) + '&rdquo;</p>' : '') +
              (!h.cur && canEdit ? '<button type="button" class="us-act rlb-restore" data-v="' + h.v + '">' + RI.icon('refresh', 'i-sm') + 'Restore v' + h.v + '</button>' : '') + '</div></li>';
          }).join('') + '</ol><p class="small muted">Nothing is overwritten. Restoring saves the older values as a new draft.</p></section>' : '') +
        '</div>' +
        (canEdit ? '<footer class="rlb-sh-f"><button type="button" class="btn btn-secondary" data-close>Cancel</button><button type="button" class="btn btn-primary" id="rlb-save">' + RI.icon('check', 'i-sm') + 'Save as draft</button></footer>' : '') + '</div>';
      RI.fillIcons(sheet);
      if(!sheet.open) sheet.showModal();
      draw();
      var lo = sheet.querySelector('#rlb-lo'), hi = sheet.querySelector('#rlb-hi'), src = sheet.querySelector('#rlb-src'), dl = sheet.querySelector('#rlb-delta');
      function live(){
        var a = lo.value === '' ? null : +lo.value, b = hi.value === '' ? null : +hi.value, msg = '', bad = false;
        if(a == null || b == null) msg = 'Enter both a Low and a High.', bad = true;
        else if(a <= 0) msg = 'Low must be more than zero.', bad = true;
        else if(b < a) msg = 'High must be at least Low.', bad = true;
        else if(r.lo != null && a === r.lo && b === r.hi && src.value.trim() === (r.src || '')) msg = 'No change yet.';
        else msg = r.lo == null ? 'New rate: ' + rtMoney(a) + ' to ' + rtMoney(b) + ' per ' + r.unit + '.' : 'Low ' + pctTxt(r.lo, a) + ', High ' + pctTxt(r.hi, b) + '.';
        dl.textContent = msg; dl.classList.toggle('bad', bad);
        sheet.querySelector('#rlb-bars').innerHTML = bars(r, bad ? null : a, bad ? null : b);
        return !bad && msg !== 'No change yet.';
      }
      if(lo){ [lo, hi, src].forEach(function(x){ x.addEventListener('input', live); }); live(); }
      var sv = sheet.querySelector('#rlb-save'); if(sv) sv.addEventListener('click', function(){
        if(!live()){ (lo.value === '' ? lo : hi).focus(); return; }
        var a = +lo.value, b = +hi.value, s = src.value.trim() || r.src;
        var sum = r.lo == null ? 'New Low and High per ' + r.unit + ': ' + rtMoney(a) + ' to ' + rtMoney(b) : 'Low and High per ' + r.unit + ': ' + rtMoney(r.lo) + ' to ' + rtMoney(r.hi) + ' becomes ' + rtMoney(a) + ' to ' + rtMoney(b);
        sheet.close();
        C.askWhy('Rate: ' + r.name, sum, function(why){ C.addDraft({area:'rates', ref:String(i), title:'Rate: ' + r.name + ', sample region', summary:sum, after:{lo:a, hi:b, src:s}, why:why}); RI.toast('Saved as a draft. It waits in the publish queue.', 'check'); C.render(); });
      });
      sheet.querySelectorAll('.rlb-restore').forEach(function(b){ b.addEventListener('click', function(){
        var h = hist.filter(function(x){ return x.v === +b.getAttribute('data-v'); })[0]; if(!h) return;
        var sum = 'Restore v' + h.v + ': ' + rtMoney(r.lo) + ' to ' + rtMoney(r.hi) + ' becomes ' + rtMoney(h.lo) + ' to ' + rtMoney(h.hi) + ' per ' + r.unit;
        sheet.close();
        C.askWhy('Rate: ' + r.name, sum, function(why){ C.addDraft({area:'rates', ref:String(i), title:'Rate: ' + r.name + ', sample region (restore v' + h.v + ')', summary:sum, after:{lo:h.lo, hi:h.hi, src:h.src}, why:why}); RI.toast('Saved as a draft to restore v' + h.v + '.', 'check'); C.render(); });
      }); });
      sheet.querySelectorAll('[data-close]').forEach(function(b){ b.addEventListener('click', function(){ sheet.close(); }); });
    }

    view.querySelector('#rlb-q').addEventListener('input', function(){ st.q = this.value.trim().toLowerCase(); draw(); });
    view.querySelector('#rlb-trade').addEventListener('change', function(){ st.trade = this.value; draw(); });
    view.addEventListener('click', function(e){
      var s = e.target.closest('[data-s]'); if(s && view.contains(s) && !sheet.contains(s)){ st.s = s.getAttribute('data-s'); draw(); return; }
      var h = e.target.closest('.rlb-hit'); if(h){ openSheet(+h.getAttribute('data-i')); }
    });
    var want = C.query().code; draw();
    if(want){ var wi = list.map(function(r){ return r.code; }).indexOf(want); if(wi > -1) openSheet(wi); }
  }, {nav:'rates', perm:'rulebook.view'});

  /* ---------- Check results ---------- */
  C.route('/checks', function(view){
    var lines = []; A.all().forEach(function(h){ var m = C.model(h); if(m) m.lines.forEach(function(l){ if(l.pass < 7){ l.h = h; l.fail = l.checks.indexOf(false); lines.push(l); } }); });
    var total = 0; A.all().forEach(function(h){ var m = C.model(h); if(m) total += m.lines.length; });
    var qck = C.query().ck, st = {ck:qck != null && C.CHECKS[+qck] ? String(+qck) : 'all'};
    var by = C.CHECKS.map(function(c, i){ return lines.filter(function(l){ return l.fail === i; }).length; });
    view.innerHTML = C.page({kicker:'Quality', title:'Check results', sub:'No line shows a price until it passes seven checks. A failed check never becomes a number: the line shows why, and the rest of the house is still priced.',
      body:'<div class="ck-sum">' + C.CHECKS.map(function(c, i){ return '<button type="button" class="ck-s' + (by[i] ? ' has' : '') + '" data-ck="' + i + '" aria-pressed="' + (String(i) === st.ck) + '"><span class="ck-i">' + (i + 1) + '</span><b>' + c[0] + '</b><span class="ck-c">' + (by[i] ? by[i] + ' held' : 'All pass') + '</span><small>' + (i >= 4 ? 'Visible to admin only' : 'The user sees the reason') + '</small></button>'; }).join('') + '</div>' +
        '<p class="ck-tot"><span><b>' + (total - lines.length) + ' of ' + total + '</b> lines across ' + A.all().filter(function(h){ return A.status(h) !== 'draft'; }).length + ' runs passed all seven checks.</span> <button type="button" class="linkbtn small" id="ck-all"' + (st.ck === 'all' ? ' hidden' : '') + '>Show all held lines</button></p><div id="ck-list"></div>'});
    function draw(){
      var rows = lines.filter(function(l){ return st.ck === 'all' || l.fail === +st.ck; });
      doc.getElementById('ck-list').innerHTML = C.table({empty:'No held lines for this check.', cols:[{label:'Line'},{label:'House'},{label:'Failed check'},{label:'What the user sees'},{label:'What would settle it'}],
        rows:rows.map(function(l){ var adm = l.fail >= 4; return {attr:'data-go="#/houses/' + l.h.id + '/tree?line=' + encodeURIComponent(l.id) + '" tabindex="0" role="link"', cells:['<span class="c-cmp"><code>' + l.code + '</code><span><b>' + RI.esc(l.item.name) + '</b><small>' + RI.esc(l.room) + '</small></span></span>', RI.esc(A.addr(l.h)), '<span class="ck-f">' + (l.fail + 1) + '. ' + C.CHECKS[l.fail][0] + '</span>', adm ? '<span class="rel rel-part">Held</span><small class="muted"> admin only</small>' : '<span class="rel rel-part">' + C.whyHeld(l) + '</span>', RI.esc(l.fail === 1 ? (l.item.fix || 'A typed size for the room') : l.fail === 2 ? 'A photo of the ' + l.item.name.toLowerCase() : l.fail === 5 ? 'Resolve the dependency in the tree' : 'Review in the tree')]}; })});
      RI.fillIcons(doc.getElementById('ck-list'));
    }
    view.addEventListener('click', function(e){
      var b = e.target.closest('[data-ck]'); if(b){ var on = b.getAttribute('aria-pressed') === 'true'; view.querySelectorAll('[data-ck]').forEach(function(x){ x.setAttribute('aria-pressed', 'false'); }); st.ck = on ? 'all' : b.getAttribute('data-ck'); if(!on) b.setAttribute('aria-pressed', 'true'); doc.getElementById('ck-all').hidden = st.ck === 'all'; draw(); return; }
      if(e.target.closest('#ck-all')){ st.ck = 'all'; view.querySelectorAll('[data-ck]').forEach(function(x){ x.setAttribute('aria-pressed', 'false'); }); e.target.hidden = true; draw(); return; }
      var r = e.target.closest('[data-go]'); if(r) C.go(r.getAttribute('data-go'));
    });
    draw();
  }, {nav:'checks', perm:'houses.view'});
})();
