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
  C.APPLY.rates = function(d){ var l = C.get('rates', []), r = l[+d.ref]; if(r){ r.lo = d.after.lo; r.hi = d.after.hi; if(d.after.src) r.src = d.after.src; r.v = (r.v || 0) + 1; r.at = d.after.eff || Date.now(); r.added = false; C.set('rates', l); } };
  C.BEFORE.products = function(d){ var p = C.get('products', []).filter(function(x){ return x.id === d.ref; })[0]; if(!p) return null; var b = {}; Object.keys(d.after || {}).forEach(function(k){ b[k] = C.copy(p[k]); }); return {v:p.v, before:b}; };
  C.BEFORE.rates = function(d){ var r = C.get('rates', [])[+d.ref]; return r ? {v:r.v, before:{lo:r.lo, hi:r.hi}} : null; };

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
  var RT_NOTE = ['Back-test clean on 12 houses', 'Checked against two supplier quotes', 'Back-test clean; no double charges', 'Matches the lab house invoices', 'Back-test clean on the lab houses'];
  var RT_WHY = ['Supplier list for the quarter', 'Two installers raised their prices', 'The lab house back-test showed High too low', 'Matched to Sam\'s price book', 'Measured jobs ran larger than the guide'];
  /* Rates seeded before this screen lacked a code and a trade; add them, and the extra lines, once */
  /* Regions (Sam's meeting, Nov 2026): a rate belongs to one of a few big US regions (RI.regions, data.js), never a city.
     The four local areas used before all sat inside the Midwest: Southeast Michigan's lines become the Midwest's, and the
     other three scaled copies are set aside (kept, so drafts that point at a rate by its position stay right, shown nowhere). */
  var RT_HOME = 'Midwest';
  var RT_OLD = {'Sample region':RT_HOME, 'Southeast Michigan':RT_HOME, 'West Michigan':'', 'Northern Ohio':'', 'Greater Chicago':''};
  var rtRegionNames = function(){ return RI.regions().map(function(g){ return g.name; }); };
  var rtRegion = function(name){ return RI.regions().filter(function(g){ return g.name === name; })[0] || null; };
  var rtRound = function(v){ return v == null ? null : v >= 100 ? Math.round(v / 5) * 5 : Math.round(v * 20) / 20; };
  var rtISO = function(t){ var d = new Date(t); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  var rtParse = function(v){ return v ? new Date(v + 'T00:00:00').getTime() : null; };
  function rtList(){
    var list = C.get('rates', []), changed = false;
    list.forEach(function(r){ if(Object.prototype.hasOwnProperty.call(RT_OLD, r.region)){ r.region = RT_OLD[r.region] || 'Set aside: ' + r.region; changed = true; } });
    list.forEach(function(r){ if(!r.code){ var m = RT_META[r.name] || ['R-' + r.name.slice(0, 3).toUpperCase(), 'Carpentry']; r.code = m[0]; r.trade = m[1]; changed = true; } });
    RT_EXTRA.forEach(function(x, i){ if(list.some(function(r){ return r.code === x[5]; })) return;
      list.push({name:x[0], desc:x[1], unit:x[2], lo:x[3], hi:x[4], code:x[5], trade:x[6], region:RT_HOME, src:x[3] == null ? '' : i % 2 ? 'Sam\'s price book' : 'Supplier list, Nov 2026', v:x[3] == null ? 0 : 1 + (i * 3) % 5, at:now - (3 + i * 3) * DAY}); changed = true; });
    if(changed) C.set('rates', list);
    return list;
  }
  var rtPer = function(u){ return u === 'each' ? 'each' : 'per ' + u; };
  var rtMoney = function(n){ return n == null ? '' : '$' + (n < 100 ? n.toFixed(2) : Math.round(n).toLocaleString('en-US')); };
  var rtRange = function(lo, hi, unit){ return lo == null ? '<span class="rlb-none">No rate yet</span>' : '<span class="rlb-r"><b>' + rtMoney(lo) + '</b><em>to</em><b>' + rtMoney(hi) + '</b></span>' + (unit ? '<small>' + RI.esc(rtPer(unit)) + '</small>' : ''); };
  var rtShort = function(t){ return new Date(t).toLocaleDateString('en-US', {month:'short', day:'numeric'}); };
  /* Versions: the ones published in this browser come from the publish queue (with their before values);
     older ones are sample history so the timeline shows its shape */
  function rtHistory(r, i){
    if(r.lo == null || r.chk === false) return [];
    var pubs = C.drafts().filter(function(d){ return d.area === 'rates' && d.ref === String(i) && d.status === 'published'; }).sort(function(a, b){ return b.doneAt - a.doneAt; });
    var top = pubs[0] && pubs[0].toV === r.v ? pubs[0] : null;
    var out = [{v:r.v, lo:r.lo, hi:r.hi, src:r.src, at:r.at, by:top ? top.by : (r.v % 2 ? 'Marcus Hill' : 'Dana Reyes'), pub:top ? top.doneBy : 'Sam', why:top ? top.why : RT_WHY[r.v % RT_WHY.length], note:top ? top.note : RT_NOTE[r.v % RT_NOTE.length], cur:true}];
    var prev = top && top.before ? top.before : null;
    for(var k = r.v - 1, n = 1; k >= 1 && n <= 5; k--, n++){
      var f = 1 - 0.035 * n, lo = prev && n === 1 ? prev.lo : Math.round(r.lo * f * 20) / 20, hi = prev && n === 1 ? prev.hi : Math.round(r.hi * f * 20) / 20;
      if(r.lo >= 100){ lo = Math.round(lo); hi = Math.round(hi); }
      out.push({v:k, lo:lo, hi:hi, src:k % 2 ? 'Sam\'s price book' : 'Supplier list, ' + new Date(r.at - n * 28 * DAY).toLocaleDateString('en-US', {month:'short', year:'numeric'}), at:r.at - n * 28 * DAY, by:k % 2 ? 'Marcus Hill' : 'Dana Reyes', pub:'Sam', why:k === 1 ? 'First published rate' : RT_WHY[k % RT_WHY.length], note:k === 1 ? 'Seeded from Sam\'s pricing guidance' : RT_NOTE[k % RT_NOTE.length]});
    }
    return out;
  }

  /* Start a region from another region's rate list (from = its name), or empty (from = ''): the same activities and units,
     every line marked not checked. Each copy remembers its source, so the screens can say where it came from. */
  function rtStart(name, from){
    var all = rtList(), n = 0, tpl = from || RT_HOME;
    if(!all.some(function(r){ return r.region === tpl; })) tpl = RT_HOME;
    all.filter(function(r){ return r.region === tpl; }).forEach(function(r){
      if(all.some(function(x){ return x.region === name && x.code === r.code && x.unit === r.unit; })) return;
      var lo = from ? r.lo : null, hi = from ? r.hi : null;
      all.push({name:r.name, desc:r.desc, unit:r.unit, code:r.code, trade:r.trade, region:name, lo:lo, hi:hi, src:lo == null ? '' : 'Copied from the ' + from + ', not checked', from:from || '', v:0, at:Date.now(), chk:false}); n++;
    });
    C.set('rates', all); C.log('Region started', name + ': ' + n + (from ? ' rates copied from the ' + from + ' to check' : ' activities, empty, to fill in'), '', 'rates');
    return n;
  }
  /* Which region to start from: every region that has rates, with where it stands; or an empty list */
  function rtStartDialog(name, done){
    var all = rtList(), src = RI.regions().filter(function(g){ return g.name !== name && all.some(function(r){ return r.region === g.name; }); });
    var pick = (src.filter(function(g){ return g.live && g.name === RT_HOME; })[0] || src.filter(function(g){ return g.live; })[0] || src[0] || {}).name || '';
    var opt = function(g){
      var rows = all.filter(function(r){ return r.region === g.name; }), unchk = rows.filter(function(r){ return r.chk === false; }).length, priced = rows.filter(function(r){ return r.lo != null; }).length;
      var st = g.live ? '<span class="lb lb-pub">Live</span>' : unchk ? '<span class="lb lb-draft">Checking rates</span>' : '<span class="lb rgn-lb-ready">Ready to go live</span>';
      return '<label class="rgn-src"><input type="radio" name="rgn-src" value="' + RI.esc(g.name) + '"' + (g.name === pick ? ' checked' : '') + '><span class="rgn-src-t"><b>' + RI.esc(g.name) + '</b><small>' + priced + ' of ' + rows.length + ' rates with a Low and High' + (unchk ? ', ' + unchk + ' not checked yet' : '') + '</small></span>' + st + '</label>';
    };
    var d = C.dialog('Start the rates for the ' + name,
      '<p class="rgn-src-intro">Pick a rate list to start from. Every line comes over marked not checked, for you to check against ' + RI.esc(name) + ' prices one by one.</p>' +
      '<div class="rgn-srcs" role="radiogroup" aria-label="Start from">' + src.map(opt).join('') +
        '<label class="rgn-src"><input type="radio" name="rgn-src" value=""' + (pick ? '' : ' checked') + '><span class="rgn-src-t"><b>Start empty</b><small>The same activities and units with no Low or High. You fill in every rate.</small></span></label></div>' +
      '<div class="cta-row" style="justify-content:flex-end;margin-top:14px"><button type="button" class="btn btn-secondary" data-dlg-close>Cancel</button><button type="button" class="btn btn-primary" id="rgn-go">' + RI.icon('check', 'i-sm') + '<span id="rgn-go-t"></span></button></div>', {wide:true});
    function label(){ var v = (d.querySelector('input[name=rgn-src]:checked') || {}).value; d.querySelector('#rgn-go-t').textContent = v ? 'Copy the ' + v + ' rates' : 'Start empty'; }
    d.addEventListener('change', label); label(); RI.fillIcons(d);
    d.querySelector('#rgn-go').addEventListener('click', function(){
      var v = (d.querySelector('input[name=rgn-src]:checked') || {}).value || '', n = rtStart(name, v); d.close();
      RI.toast(v ? n + ' rates copied from the ' + v + ' to the ' + name + '. Check each one.' : n + ' activities added to the ' + name + '. Fill in each Low and High.', 'check');
      if(done) done();
    });
  }
  function rtChecked(name){
    var all = rtList(), n = 0; all.forEach(function(r){ if(r.region === name && r.chk === false){ r.chk = true; if(r.lo != null) r.src = 'Checked against the ' + (r.from || RT_HOME) + ' copy'; n++; } });
    C.set('rates', all); if(n) C.log('Rates checked', name + ': ' + n + ' copied rates marked checked', '', 'rates');
    return n;
  }

  C.route('/rates', function(view){
    var list = rtList(), canEdit = C.can('pricing.edit'), st = {q:'', trade:'all', s:'all', page:0, per:10, region:rtRegion(C.query().region) ? C.query().region : RT_HOME, unit:'all'}, open = null;
    var units = list.map(function(r){ return r.unit; }).filter(function(u, k, a){ return a.indexOf(u) === k; });
    var inView = function(r){ return r.region === st.region && (st.unit === 'all' || r.unit === st.unit); };
    var stateOf = function(r, i){ return C.draftFor('rates', String(i)) ? 'queued' : r.lo == null ? 'none' : 'pub'; };
    var count = function(s){ return list.filter(function(r, i){ return inView(r) && (s === 'all' || stateOf(r, i) === s); }).length; };
    view.innerHTML = C.page({kicker:'Pricing', title:'Rates', sub:'The rate library: a Low and a High installed rate per activity and unit, with the region, effective date and source. Check 4 prices a line only from a published rate.',
      actions:canEdit ? '<button type="button" class="btn btn-primary" id="rlb-add">' + RI.icon('plus', 'i-sm') + 'Add a rate</button>' : '',
      body:'<div class="rlb-tools">' + C.search('rlb-q', 'Search by activity or code', '') +
        '<label class="c-select rlb-sel"><span class="sr">Trade</span><select id="rlb-trade"><option value="all">All trades</option>' + RT_TRADES.map(function(t){ return '<option>' + t + '</option>'; }).join('') + '</select></label>' +
        '<label class="c-select rlb-sel"><span class="sr">Unit</span><select id="rlb-unit"><option value="all">All units</option>' + units.map(function(u){ return '<option value="' + RI.esc(u) + '">' + RI.esc(u === 'each' ? 'Each' : 'Per ' + u) + '</option>'; }).join('') + '</select></label>' +
        '<label class="rlb-regsel">' + RI.icon('pin', 'i-sm') + '<span class="sr">Region</span><span class="c-select"><select id="rlb-region">' + RI.regions().map(function(g){ return '<option value="' + RI.esc(g.name) + '"' + (g.name === st.region ? ' selected' : '') + '>' + RI.esc(g.name) + (g.live ? '' : ', not live') + '</option>'; }).join('') + '</select></span></label></div>' +
        '<div class="rlb-status" id="rlb-s" role="radiogroup" aria-label="Status"></div><p class="rlb-reg-n" id="rlb-reg-n"></p><div id="rlb-body"></div>' +
        '<div class="c-mt">' + C.note('Sample rates. Low and High only, never one number. Sam\'s rate library replaces them.') + '</div>'});

    function statusLbl(r, i){
      if(r.chk === false) return r.lo == null ? '<span class="lb lb-off">To fill in</span>' : '<span class="lb lb-draft">Copied, not checked</span>';
      if(r.lo != null && !r.v) return '<span class="lb lb-queued">Checked</span>';
      if(r.lo == null) return '<span class="lb lb-off">No rate yet</span>';
      return '<span class="lb lb-pub">Published <span class="lb-v">v' + r.v + '</span></span>';
    }
    function queueLine(r, i){
      return C.draftFor('rates', String(i)) ? '<span class="rlb-qline">' + RI.icon('clock', 'i-sm') + 'v' + ((r.v || 0) + 1) + ' in the queue</span>' : '';
    }
    function draw(){
      var q = st.q, rows = list.map(function(r, i){ return {r:r, i:i}; }).filter(function(x){ var r = x.r;
        return inView(r) && (st.trade === 'all' || r.trade === st.trade) && (st.s === 'all' || stateOf(r, x.i) === st.s) && (!q || (r.name + ' ' + r.code + ' ' + r.desc).toLowerCase().indexOf(q) > -1); });
      doc.getElementById('rlb-s').innerHTML = [['all', 'All'], ['pub', 'Published'], ['queued', 'In the queue'], ['none', 'No rate yet']].map(function(o){
        return '<button type="button" role="radio" data-s="' + o[0] + '" aria-checked="' + (st.s === o[0]) + '">' + o[1] + '<span class="n">' + count(o[0]) + '</span></button>'; }).join('');
      var none = count('none');
      var inReg = list.filter(function(r){ return r.region === st.region; }), unchk = inReg.filter(function(r){ return r.chk === false; }).length, g = rtRegion(st.region);
      doc.getElementById('rlb-reg-n').innerHTML = inReg.length + ' rates in the ' + RI.esc(st.region) + (g ? ' &middot; ' + (g.live ? '<span class="lb lb-pub">Live</span>' : '<span class="lb lb-off">Not live</span>') + ' &middot; <a href="#/regions?r=' + encodeURIComponent(g.key) + '">' + g.states.length + ' states</a>' : '');
      if(!inReg.length){
        doc.getElementById('rlb-body').innerHTML = '<div class="rgn-empty">' + RI.icon('pin') + '<div><b>No rates in the ' + RI.esc(st.region) + ' yet.</b><p>Start it from another region\'s rate list, or empty: every line comes over marked not checked, for you to check one by one. The region goes live when Sam turns it on.</p>' +
          (canEdit ? '<button type="button" class="btn btn-primary btn-sm" id="rgn-start">' + RI.icon('plus', 'i-sm') + 'Start the rates</button>' : '<p class="small muted">Starting a region needs the pricing.edit permission.</p>') + '</div></div>';
        RI.fillIcons(doc.getElementById('rlb-body')); return;
      }
      var html = (unchk ? '<div class="rgn-unchk">' + RI.icon('info', 'i-sm') + '<span><b>' + unchk + ' rate' + (unchk === 1 ? ' is' : 's are') + ' ' + (function(){ var fs = inReg.filter(function(r){ return r.chk === false; }).map(function(r){ return r.from; }).filter(function(f, k, a){ return a.indexOf(f) === k; }); return fs.length === 1 && !fs[0] ? 'empty, to fill in' : 'copied from the ' + fs.map(function(f){ return f || 'empty list'; }).join(' and ') + ' and not checked'; })() + '.</b> Open each one to check or change it, or mark them all checked once you have.</span>' + (canEdit ? '<button type="button" class="btn btn-secondary btn-sm" id="rgn-chkall">' + RI.icon('check', 'i-sm') + 'Mark all checked</button>' : '') + '</div>' : '') + (none && st.s !== 'none' ? '<button type="button" class="rlb-alert" data-s="none">' + RI.icon('warn', 'i-sm') + '<span><b>' + none + (none === 1 ? ' activity has' : ' activities have') + ' no rate yet.</b> Lines that use ' + (none === 1 ? 'it' : 'them') + ' show &ldquo;Not priced yet&rdquo; until Sam publishes a Low and a High.</span>' + RI.icon('arrow', 'i-sm') + '</button>' : '');
      /* Pages follow the trade order, so the groups stay together */
      rows.sort(function(a, b){ return RT_TRADES.indexOf(a.r.trade) - RT_TRADES.indexOf(b.r.trade); });
      var total = rows.length, pages = Math.max(1, Math.ceil(total / st.per)); if(st.page >= pages) st.page = pages - 1;
      rows = rows.slice(st.page * st.per, st.page * st.per + st.per);
      if(!rows.length){ doc.getElementById('rlb-body').innerHTML = html + '<div class="c-empty">' + RI.icon('search') + '<p>No rate matches. Try another word, or show all trades.</p></div>'; RI.fillIcons(doc.getElementById('rlb-body')); return; }
      html += '<ul class="rlb-list" role="list"><li class="rlb-head" aria-hidden="true"><span>Activity</span><span>Unit</span><span class="num">Low</span><span class="num">High</span><span>Effective</span><span>Source</span><span>Status</span><span></span></li>';
      RT_TRADES.forEach(function(t){
        var g = rows.filter(function(x){ return x.r.trade === t; }); if(!g.length) return;
        html += '<li class="rlb-grp"><span>' + t + '</span><small>' + g.length + (g.length === 1 ? ' rate' : ' rates') + '</small></li>';
        g.forEach(function(x){ var r = x.r, i = x.i, d = C.draftFor('rates', String(i));
          html += '<li class="rlb-row' + (r.lo == null ? ' is-none' : '') + (open === i ? ' is-open' : '') + '"><button type="button" class="rlb-hit" data-i="' + i + '" aria-label="Open ' + RI.esc(r.name) + '">' +
            '<span class="rlb-name"><b>' + RI.esc(r.name) + (r.added ? ' <span class="lb lb-sample">New</span>' : '') + '</b><small><code>' + r.code + '</code> &middot; ' + RI.esc(r.desc) + '</small></span>' +
            '<span class="rlb-unit">' + RI.esc(r.unit) + '</span>' +
            '<span class="rlb-lo num">' + (r.lo == null ? (d ? '<span class="rlb-dv">' + rtMoney(d.after.lo) + '</span>' : '<span class="muted">&ndash;</span>') : rtMoney(r.lo)) + '</span><span class="rlb-hi num">' + (r.hi == null ? (d ? '<span class="rlb-dv">' + rtMoney(d.after.hi) + '</span>' : '<span class="muted">&ndash;</span>') : rtMoney(r.hi)) + '</span>' +
            '<span class="rlb-val">' + rtRange(r.lo, r.hi, r.unit) + '</span>' +
            '<span class="rlb-eff">' + (r.lo == null ? (d && d.after.eff ? '<span class="rlb-dv">' + C.date(d.after.eff) + '<small>Draft</small></span>' : '<span class="muted">&ndash;</span>') : C.date(r.at)) + '</span><span class="rlb-src">' + (r.src ? RI.esc(r.src) : '<span class="muted">&ndash;</span>') + '</span>' +
            '<span class="rlb-meta">' + (r.lo == null ? 'Waiting for Sam\'s Low and High' : 'Effective ' + rtShort(r.at) + ' &middot; ' + RI.esc(r.src)) + (d ? ' &middot; <b class="rlb-q">Draft: ' + rtMoney(d.after.lo) + ' to ' + rtMoney(d.after.hi) + '</b>' : '') + '</span>' +
            '<span class="rlb-st">' + statusLbl(r, i) + queueLine(r, i) + '</span><span class="rlb-go">' + RI.icon('chev', 'i-sm') + '</span></button></li>';
        });
      });
      doc.getElementById('rlb-body').innerHTML = html + '</ul>' + C.pager({page:st.page, per:st.per, total:total, noun:'rates', perOpts:[10, 25, 50]});
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
      open = i; var r = list[i], d = C.draftFor('rates', String(i)), hist = rtHistory(r, i), ed = {lo:d ? d.after.lo : r.lo, hi:d ? d.after.hi : r.hi, src:(d && d.after.src) || r.src || '', eff:rtISO((d && d.after.eff) || Date.now())};
      sheet.innerHTML = '<div class="rlb-sh">' +
        '<header class="rlb-sh-h"><button type="button" class="rlb-x" data-close aria-label="Close">' + RI.icon('x') + '</button><div><p class="rlb-code"><code>' + r.code + '</code> &middot; ' + r.trade + '</p><h2 id="rlb-h">' + RI.esc(r.name) + '</h2><p class="muted">' + RI.esc(r.desc) + '</p></div><span id="rlb-stl">' + statusLbl(r, i) + queueLine(r, i) + '</span></header>' +
        '<div class="rlb-sh-b">' +
          '<section class="rlb-now"><div class="rlb-big">' + rtRange(r.lo, r.hi, r.unit) + '</div>' + (r.lo == null ? '<p class="rlb-why">Lines that use this activity show &ldquo;Not priced yet&rdquo; (check 4) until Sam publishes a Low and a High. Nothing is shown as zero.</p>' : '') +
            (r.chk === false ? '<p class="rgn-copied">' + RI.icon('info', 'i-sm') + '<span>' + (r.lo == null ? 'Added empty. Give it a Low and High for the ' + RI.esc(r.region) + '.' : 'Copied from the ' + RI.esc(r.from || RT_HOME) + '. Check it for the ' + RI.esc(r.region) + ', change it if it is off, or mark it checked.') + '</span>' + (canEdit ? '<button type="button" class="btn btn-secondary btn-sm" id="rgn-chk1">' + RI.icon('check', 'i-sm') + 'Mark checked</button>' : '') + '</p>' : '') +
            '<div id="rlb-bars">' + bars(r, ed.lo, ed.hi) + '</div>' +
            '<dl class="rlb-facts"><div><dt>Effective</dt><dd>' + (r.lo == null ? '&ndash;' : C.date(r.at)) + '</dd></div><div><dt>Source</dt><dd>' + (r.src ? RI.esc(r.src) : '&ndash;') + '</dd></div><div><dt>Region</dt><dd class="rlb-lockd">' + RI.icon('lock', 'i-sm') + RI.esc(r.region) + '</dd></div><div><dt>Unit</dt><dd class="rlb-lockd">' + RI.icon('lock', 'i-sm') + RI.esc(r.unit === 'each' ? 'Each' : 'Per ' + r.unit) + '</dd></div><div><dt>Version</dt><dd>' + (r.v ? 'v' + r.v : 'None yet') + '</dd></div></dl></section>' +
          (d ? '<section class="rlb-queue">' + RI.icon('clock', 'i-sm') + '<div><b>In the publish queue: ' + rtMoney(d.after.lo) + ' to ' + rtMoney(d.after.hi) + '</b><span>Saved by ' + RI.esc(d.by) + ' ' + C.ago(d.at) + (d.why ? ': &ldquo;' + RI.esc(d.why) + '&rdquo;' : '') + '</span>' +
            '<span class="rlb-bt ' + (!d.bt ? 'todo' : d.bt.clean ? 'ok' : 'bad') + '">' + RI.icon(!d.bt ? 'clock' : d.bt.clean ? 'check' : 'warn', 'i-sm') + (!d.bt ? 'Not back-tested yet. Sam runs one before he publishes.' : d.bt.clean ? 'Back-test clean' : 'The back-test found problems') + '</span>' +
            '<span class="rlb-qa">' + (d.bt ? '<a href="#/backtests/' + d.bt.id + '">Read the back-test</a>' : '') + '<a href="#/publish">Open the publish queue</a></span></div></section>' : '') +
          (canEdit ? '<section class="rlb-edit"><h3>' + (r.lo == null ? 'Add a Low and a High' : d ? 'Change the draft' : 'Change this rate') + '</h3><p class="small muted">Saved as a draft. It goes live when Sam publishes it, after a back-test.</p>' + (d ? '<p class="rlb-replace">' + RI.icon('info', 'i-sm') + '<span>Saving replaces the draft ' + RI.esc(d.by) + ' saved ' + C.ago(d.at) + '.</span></p>' : '') +
            '<div class="rlb-fields"><label><span>Low</span><span class="rlb-in"><i>$</i><input class="input" type="number" inputmode="decimal" step="0.05" min="0" id="rlb-lo" value="' + (ed.lo == null ? '' : ed.lo) + '"></span></label>' +
            '<label><span>High</span><span class="rlb-in"><i>$</i><input class="input" type="number" inputmode="decimal" step="0.05" min="0" id="rlb-hi" value="' + (ed.hi == null ? '' : ed.hi) + '"></span></label>' +
            '<label class="rlb-wide"><span>Effective date</span><input class="input" type="date" id="rlb-eff" value="' + ed.eff + '"><small class="rlb-hint">The date this Low and High applies from. Sam confirms it when he publishes.</small></label>' +
            '<label class="rlb-wide"><span>Source</span><input class="input" type="text" id="rlb-src" value="' + RI.esc(ed.src) + '" placeholder="For example: Supplier list, Dec 2026"></label></div>' +
            '<div class="rlb-fields rlb-locked"><div class="rlb-lockf"><span>Unit</span><span class="rlb-lockv" aria-readonly="true">' + RI.icon('lock', 'i-sm') + RI.esc(r.unit === 'each' ? 'Each' : 'Per ' + r.unit) + '</span></div>' +
            '<div class="rlb-lockf"><span>Region</span><span class="rlb-lockv" aria-readonly="true">' + RI.icon('lock', 'i-sm') + RI.esc(r.region) + '</span></div></div>' +
            '<p class="rlb-fixed">Unit and region are fixed for a rate. Another unit or region is its own rate line: use Add a rate.</p>' +
            '<p class="rlb-delta" id="rlb-delta" aria-live="polite"></p></section>' : '<p class="rlb-ro">' + RI.icon('lock', 'i-sm') + 'You can read rates. Changing one needs the pricing.edit permission.</p>') +
          (hist.length ? '<section class="rlb-hist"><h3>Versions</h3><ol>' + hist.map(function(h){
            return '<li' + (h.cur ? ' class="cur"' : '') + '><span class="rlb-dot" aria-hidden="true"></span><div class="rlb-hv"><div class="rlb-hv-t"><b>v' + h.v + '</b>' + (h.cur ? '<span class="lb lb-pub">Live</span>' : '<span class="lb lb-off">Retired</span>') + '<span class="rlb-hv-r">' + rtMoney(h.lo) + ' to ' + rtMoney(h.hi) + '</span></div>' +
              '<small>Effective ' + C.date(h.at) + ' &middot; ' + RI.esc(h.src) + '</small><small>Drafted by ' + RI.esc(h.by) + ', published by ' + RI.esc(h.pub) + '</small>' + (h.why ? '<p>&ldquo;' + RI.esc(h.why) + '&rdquo;</p>' : '') + (h.note ? '<p class="rlb-note">' + RI.icon('check', 'i-sm') + '<span><b>Sam\'s note:</b> ' + RI.esc(h.note) + '</span></p>' : '') +
              (!h.cur && canEdit ? '<button type="button" class="us-act rlb-restore" data-v="' + h.v + '">' + RI.icon('refresh', 'i-sm') + 'Restore v' + h.v + '</button>' : '') + '</div></li>';
          }).join('') + '</ol><p class="small muted">Nothing is overwritten. Restoring saves the older values as a new draft.</p></section>' : '') +
        '</div>' +
        (canEdit ? '<footer class="rlb-sh-f"><button type="button" class="btn btn-secondary" data-close>Cancel</button><button type="button" class="btn btn-primary" id="rlb-save">' + RI.icon('check', 'i-sm') + 'Save as draft</button></footer>' : '') + '</div>';
      RI.fillIcons(sheet);
      if(!sheet.open) sheet.showModal();
      draw();
      var lo = sheet.querySelector('#rlb-lo'), hi = sheet.querySelector('#rlb-hi'), src = sheet.querySelector('#rlb-src'), eff = sheet.querySelector('#rlb-eff'), dl = sheet.querySelector('#rlb-delta');
      function live(){
        var a = lo.value === '' ? null : +lo.value, b = hi.value === '' ? null : +hi.value, msg = '', bad = false;
        var effChanged = eff.value !== rtISO(r.at);
        if(a == null || b == null) msg = 'Enter both a Low and a High.', bad = true;
        else if(!eff.value) msg = 'Choose the effective date.', bad = true;
        else if(a <= 0) msg = 'Low must be more than zero.', bad = true;
        else if(b < a) msg = 'High must be at least Low.', bad = true;
        else if(r.lo != null && a === r.lo && b === r.hi && src.value.trim() === (r.src || '') && !effChanged) msg = 'No change yet.';
        else msg = (r.lo == null ? 'New rate: ' + rtMoney(a) + ' to ' + rtMoney(b) + ' ' + rtPer(r.unit) + '.' : a === r.lo && b === r.hi ? 'Same Low and High.' : 'Low ' + pctTxt(r.lo, a) + ', High ' + pctTxt(r.hi, b) + '.') + ' Effective ' + C.date(rtParse(eff.value)) + '.';
        dl.textContent = msg; dl.classList.toggle('bad', bad);
        sheet.querySelector('#rlb-bars').innerHTML = bars(r, bad ? null : a, bad ? null : b);
        var changed = !bad && msg !== 'No change yet.', typed = lo.value !== String(ed.lo == null ? '' : ed.lo) || hi.value !== String(ed.hi == null ? '' : ed.hi) || src.value.trim() !== (ed.src || '') || eff.value !== ed.eff;
        sheet.querySelector('#rlb-stl').innerHTML = typed ? C.lbl('draft', 'not saved') : statusLbl(r, i) + queueLine(r, i);
        return changed;
      }
      if(lo){ [lo, hi, src, eff].forEach(function(x){ x.addEventListener('input', live); x.addEventListener('change', live); }); live(); }
      var sv = sheet.querySelector('#rlb-save'); if(sv) sv.addEventListener('click', function(){
        if(!live()){ (lo.value === '' ? lo : hi).focus(); return; }
        var a = +lo.value, b = +hi.value, s = src.value.trim() || r.src, e = rtParse(eff.value);
        var sum = r.lo == null ? 'New Low and High ' + rtPer(r.unit) + ': ' + rtMoney(a) + ' to ' + rtMoney(b) : 'Low and High ' + rtPer(r.unit) + ': ' + rtMoney(r.lo) + ' to ' + rtMoney(r.hi) + ' becomes ' + rtMoney(a) + ' to ' + rtMoney(b);
        sum += ', effective ' + C.date(e);
        sheet.close();
        C.askWhy('Rate: ' + r.name, sum, function(why){ if(r.chk === false){ r.chk = true; C.set('rates', list); } C.addDraft({area:'rates', ref:String(i), title:'Rate: ' + r.name + ', ' + r.region, summary:sum, after:{lo:a, hi:b, src:s, eff:e}, why:why}); RI.toast('Saved as a draft. It waits in the publish queue.', 'check'); C.render(); });
      });
      sheet.querySelectorAll('.rlb-restore').forEach(function(b){ b.addEventListener('click', function(){
        var h = hist.filter(function(x){ return x.v === +b.getAttribute('data-v'); })[0]; if(!h) return;
        var sum = 'Restore v' + h.v + ': ' + rtMoney(r.lo) + ' to ' + rtMoney(r.hi) + ' becomes ' + rtMoney(h.lo) + ' to ' + rtMoney(h.hi) + ' ' + rtPer(r.unit);
        sheet.close();
        C.askWhy('Rate: ' + r.name, sum, function(why){ C.addDraft({area:'rates', ref:String(i), title:'Rate: ' + r.name + ', ' + r.region + ' (restore v' + h.v + ')', summary:sum, after:{lo:h.lo, hi:h.hi, src:h.src, eff:Date.now()}, why:why}); RI.toast('Saved as a draft to restore v' + h.v + '.', 'check'); C.render(); });
      }); });
      var c1 = sheet.querySelector('#rgn-chk1'); if(c1) c1.addEventListener('click', function(){ r.chk = true; if(r.lo != null) r.src = 'Checked against the ' + (r.from || RT_HOME) + ' copy'; C.set('rates', list); C.log('Rate checked', r.name + ', ' + r.region, '', 'rates'); RI.toast(r.name + ' checked for the ' + r.region + '.', 'check'); openSheet(i); });
      sheet.querySelectorAll('[data-close]').forEach(function(b){ b.addEventListener('click', function(){ sheet.close(); }); });
    }

    view.querySelector('#rlb-q').addEventListener('input', function(){ st.q = this.value.trim().toLowerCase(); st.page = 0; draw(); });
    view.querySelector('#rlb-trade').addEventListener('change', function(){ st.trade = this.value; st.page = 0; draw(); });
    view.querySelector('#rlb-unit').addEventListener('change', function(){ st.unit = this.value; st.page = 0; draw(); });
    view.querySelector('#rlb-region').addEventListener('change', function(){ st.region = this.value; st.page = 0; draw(); });
    view.addEventListener('change', function(e){ var p = e.target.closest('#rlb-body [data-per]'); if(p){ st.per = +p.value; st.page = 0; draw(); } });
    /* ---------- Add a rate: a new line (activity, unit, region) with its first Low and High, saved as a draft ---------- */
    var RT_UNITS = ['sq ft', 'linear ft', 'each', 'sq yd'];
    var RT_AB = {Flooring:'FL', Painting:'PT', Carpentry:'CP', Cabinets:'CB', Plumbing:'PL', Electrical:'EL', Drywall:'DW'};
    var RT_UB = {'sq ft':'SF', 'linear ft':'LF', each:'EA', 'sq yd':'SY'};
    function addSheet(){
      open = 'add';
      var opt = function(list, cur, lab){ return list.map(function(v){ return '<option value="' + RI.esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + RI.esc(lab ? lab(v) : v) + '</option>'; }).join(''); };
      sheet.innerHTML = '<div class="rlb-sh">' +
        '<header class="rlb-sh-h"><button type="button" class="rlb-x" data-close aria-label="Close">' + RI.icon('x') + '</button><div><p class="rlb-code">Rate library &middot; New line</p><h2 id="rlb-h">Add a rate</h2><p class="muted">A new activity, unit and region with its first Low and High.</p></div></header>' +
        '<form class="rlb-sh-b" id="rlb-addf" novalidate>' +
          '<section class="rlb-edit"><h3>What it is</h3><div class="rlb-fields">' +
            '<label class="rlb-wide"><span>Activity</span><input class="input" type="text" id="ra-name" placeholder="For example: Vinyl tile floor" autocomplete="off"><small class="err" id="ra-name-e"></small></label>' +
            '<label class="rlb-wide"><span>What it includes</span><input class="input" type="text" id="ra-desc" placeholder="For example: Glue down, with underlayment"></label>' +
            '<label><span>Trade</span><span class="c-select"><select id="ra-trade">' + opt(RT_TRADES, st.trade === 'all' ? 'Flooring' : st.trade) + '</select></span></label>' +
            '<label><span>Code</span><input class="input" type="text" id="ra-code" autocomplete="off" spellcheck="false"><small class="err" id="ra-code-e"></small></label>' +
            '<label><span>Unit</span><span class="c-select"><select id="ra-unit">' + opt(RT_UNITS, st.unit === 'all' ? 'sq ft' : st.unit, function(u){ return u === 'each' ? 'Each' : 'Per ' + u; }) + '</select></span></label>' +
            '<label><span>Region</span><span class="c-select"><select id="ra-region">' + opt(rtRegionNames(), st.region) + '</select></span></label>' +
          '</div><p class="rlb-fixed">' + RI.icon('lock', 'i-sm') + '<span>Unit and region cannot change once the rate is saved.</span></p></section>' +
          '<section class="rlb-edit"><h3>First Low and High</h3><div class="rlb-fields">' +
            '<label><span>Low</span><span class="rlb-in"><i>$</i><input class="input" type="number" inputmode="decimal" step="0.05" min="0" id="ra-lo"></span></label>' +
            '<label><span>High</span><span class="rlb-in"><i>$</i><input class="input" type="number" inputmode="decimal" step="0.05" min="0" id="ra-hi"></span></label>' +
            '<label class="rlb-wide"><span>Effective date</span><input class="input" type="date" id="ra-eff" value="' + rtISO(Date.now()) + '"></label>' +
            '<label class="rlb-wide"><span>Source</span><input class="input" type="text" id="ra-src" placeholder="For example: Supplier list, Dec 2026"></label>' +
          '</div><p class="rlb-delta" id="ra-delta" aria-live="polite"></p></section>' +
          '<p class="rlb-replace">' + RI.icon('info', 'i-sm') + '<span>The new rate is saved as a draft and waits in the publish queue. Lines can use it once Sam publishes it.</span></p>' +
        '</form>' +
        '<footer class="rlb-sh-f"><button type="button" class="btn btn-secondary" data-close>Cancel</button><button type="button" class="btn btn-primary" id="ra-save">' + RI.icon('check', 'i-sm') + 'Save as draft</button></footer></div>';
      RI.fillIcons(sheet);
      if(!sheet.open) sheet.showModal();
      var $ = function(id){ return sheet.querySelector('#' + id); }, codeTouched = false;
      function suggest(){ if(codeTouched) return; var w = $('ra-name').value.trim().toUpperCase().replace(/[^A-Z0-9 ]/g, '').split(/\s+/).filter(Boolean);
        $('ra-code').value = w.length ? 'R-' + RT_AB[$('ra-trade').value] + '-' + (w.length > 1 ? w.slice(0, 2).map(function(x){ return x.slice(0, 3); }).join('') : w[0].slice(0, 5)) + '-' + RT_UB[$('ra-unit').value] : ''; }
      function dupe(){ var c = $('ra-code').value.trim().toUpperCase(), g = $('ra-region').value;
        return list.some(function(r){ return r.region === g && (r.code === c || (r.name.toLowerCase() === $('ra-name').value.trim().toLowerCase() && r.unit === $('ra-unit').value)); }); }
      function check(show){
        var name = $('ra-name').value.trim(), code = $('ra-code').value.trim(), a = $('ra-lo').value === '' ? null : +$('ra-lo').value, b = $('ra-hi').value === '' ? null : +$('ra-hi').value, msg = '', bad = false;
        $('ra-name-e').textContent = show && !name ? 'Name the activity.' : '';
        $('ra-code-e').textContent = show && !code ? 'Give it a code.' : dupe() ? 'This activity and unit already have a rate in ' + $('ra-region').value + '.' : '';
        if(!name || !code || dupe()) bad = true;
        if(a == null || b == null) msg = 'Enter both a Low and a High.', bad = true;
        else if(a <= 0) msg = 'Low must be more than zero.', bad = true;
        else if(b < a) msg = 'High must be at least Low.', bad = true;
        else if(!$('ra-eff').value) msg = 'Choose the effective date.', bad = true;
        else msg = 'New rate: ' + rtMoney(a) + ' to ' + rtMoney(b) + ' ' + rtPer($('ra-unit').value) + ' in ' + $('ra-region').value + ', effective ' + C.date(rtParse($('ra-eff').value)) + '.';
        $('ra-delta').textContent = msg; $('ra-delta').classList.toggle('bad', bad && a != null && b != null);
        return !bad;
      }
      $('ra-code').addEventListener('input', function(){ codeTouched = true; check(false); });
      ['ra-name', 'ra-trade', 'ra-unit'].forEach(function(id){ $(id).addEventListener('input', function(){ suggest(); check(false); }); $(id).addEventListener('change', function(){ suggest(); check(false); }); });
      ['ra-lo', 'ra-hi', 'ra-eff', 'ra-region', 'ra-src'].forEach(function(id){ $(id).addEventListener('input', function(){ check(false); }); $(id).addEventListener('change', function(){ check(false); }); });
      sheet.querySelectorAll('[data-close]').forEach(function(b){ b.addEventListener('click', function(){ sheet.close(); }); });
      setTimeout(function(){ $('ra-name').focus(); }, 30);
      $('ra-save').addEventListener('click', function(){
        if(!check(true)){ var f = sheet.querySelector('.err:not(:empty)'); (f ? f.previousElementSibling : $('ra-lo')).focus(); return; }
        var r = {name:$('ra-name').value.trim(), desc:$('ra-desc').value.trim() || 'New activity', unit:$('ra-unit').value, code:$('ra-code').value.trim().toUpperCase(), trade:$('ra-trade').value,
          region:$('ra-region').value, lo:null, hi:null, src:'', v:0, at:Date.now(), added:true};
        var a = +$('ra-lo').value, b = +$('ra-hi').value, e = rtParse($('ra-eff').value), s = $('ra-src').value.trim() || 'Not given';
        var sum = 'New rate ' + rtPer(r.unit) + ' in ' + r.region + ': ' + rtMoney(a) + ' to ' + rtMoney(b) + ', effective ' + C.date(e);
        sheet.close();
        C.askWhy('New rate: ' + r.name, sum, function(why){
          var all = C.get('rates', []); all.push(r); C.set('rates', all); list = all;
          C.addDraft({area:'rates', ref:String(all.length - 1), title:'New rate: ' + r.name + ', ' + r.region, summary:sum, after:{lo:a, hi:b, src:s, eff:e}, why:why});
          RI.toast('New rate saved as a draft. It waits in the publish queue.', 'check'); C.render();
        });
      });
    }
    var addBtn = view.querySelector('#rlb-add'); if(addBtn) addBtn.addEventListener('click', addSheet);

    view.addEventListener('click', function(e){
      var s = e.target.closest('[data-s]'); if(s && view.contains(s) && !sheet.contains(s)){ st.s = s.getAttribute('data-s'); st.page = 0; draw(); return; }
      var pg = e.target.closest('#rlb-body [data-pg]'); if(pg && !pg.disabled){ st.page = +pg.getAttribute('data-pg'); draw(); doc.getElementById('rlb-s').scrollIntoView({block:'nearest'}); return; }
      var h = e.target.closest('.rlb-hit'); if(h){ openSheet(+h.getAttribute('data-i')); return; }
      if(e.target.closest('#rgn-start')){ rtStartDialog(st.region, function(){ list = rtList(); draw(); }); return; }
      if(e.target.closest('#rgn-chkall')){ var m = rtChecked(st.region); list = rtList(); RI.toast(m + ' rates marked checked in the ' + st.region + '.', 'check'); draw(); return; }
    });
    var want = C.query().code; draw();
    if(want){ var wi = list.map(function(r){ return r.code; }).indexOf(want); if(wi > -1) openSheet(wi); }
  }, {nav:'rates', perm:'rulebook.view'});

  /* ---------- Regions (Sam's meeting, Nov 2026) ----------
     The US in a few big regions, each a set of states, so opening a new area is filling in its rates, not new work.
     A US tile map shows which state belongs where; each region card says whether it is live, how far its rates are,
     and what to do next: start it from the Midwest's rate list, check the copied rates, go live (Sam only).
     Add a region or Change states moves states between regions; every state is in exactly one. */
  function rgnStats(g){
    var rows = rtList().filter(function(r){ return r.region === g.name; });
    var unchk = rows.filter(function(r){ return r.chk === false; }).length, none = rows.filter(function(r){ return r.lo == null; }).length;
    return {n:rows.length, unchk:unchk, none:none, priced:rows.length - none, state:g.live ? 'live' : !rows.length ? 'new' : (unchk || rows.length === none) ? 'check' : 'ready'};
  }
  C.route('/regions', function(view){
    var regs = RI.regions(), isSam = C.can('publish'), canEdit = C.can('pricing.edit'), want = C.query().r;
    var sel = (regs.filter(function(g){ return g.key === want; })[0] || regs.filter(function(g){ return g.name === RT_HOME; })[0] || regs[0]).key;
    var home = rtList().filter(function(r){ return r.region === RT_HOME; }).length;
    function save(){ C.set('regions', regs); }
    view.innerHTML = C.page({kicker:'Pricing', title:'Regions', sub:'The US in a few big regions. A house is priced with the rates of the region its state is in. Opening a new area means filling in its rates, then Sam turns it on.',
      actions:isSam ? '<button type="button" class="btn btn-primary" id="rgn-add">' + RI.icon('plus', 'i-sm') + 'Add a region</button>' : '',
      body:'<div class="rgn-layout"><section class="rgn-mapc" aria-label="Map of the regions"><header class="rgn-mh"><b>United States</b><span id="rgn-sum"></span></header><div class="rgn-map" id="rgn-map"></div><div class="rgn-legend" id="rgn-key"></div></section><div class="rgn-cards" id="rgn-cards"></div></div>' +
        '<div class="c-mt">' + C.note('A sample setup. Houses in a region that is not live can be saved but are not priced; the homeowner sees that we do not price their area yet. Every state belongs to exactly one region.') + '</div>'});
    function stLbl(x, g){
      return x.state === 'live' ? '<span class="lb lb-pub">Live</span>' : x.state === 'new' ? '<span class="lb lb-off">Not started</span>' : x.state === 'check' ? '<span class="lb lb-draft">Checking rates</span>' : '<span class="lb rgn-lb-ready">Ready to go live</span>';
    }
    function card(g){
      var x = rgnStats(g), on = g.key === sel, names = g.states.map(function(c){ return RI.STATES[c] || c; });
      var done = x.n - x.unchk, pct = x.n ? Math.round(done / x.n * 100) : 0;
      var next = x.state === 'live' ? '<a class="btn btn-secondary btn-sm" href="#/rates?region=' + encodeURIComponent(g.name) + '">' + RI.icon('file', 'i-sm') + 'Open its rates</a>'
        : x.state === 'new' ? (canEdit ? '<button type="button" class="btn btn-primary btn-sm" data-start="' + g.key + '">' + RI.icon('plus', 'i-sm') + 'Start this region</button>' : '')
        : '<a class="btn btn-secondary btn-sm" href="#/rates?region=' + encodeURIComponent(g.name) + '">' + RI.icon('file', 'i-sm') + (x.unchk ? 'Check its rates' : 'Open its rates') + '</a>' +
          (isSam ? '<button type="button" class="btn btn-primary btn-sm" data-live="' + g.key + '"' + (x.state === 'check' ? ' disabled' : '') + '>' + RI.icon('check', 'i-sm') + 'Go live</button>' : '');
      return '<article class="rgn-card' + (on ? ' is-on' : '') + '" data-sel="' + g.key + '">' +
        '<header><button type="button" class="rgn-pick" data-sel="' + g.key + '" aria-pressed="' + on + '"><b>' + RI.esc(g.name) + '</b><small>' + g.states.length + ' state' + (g.states.length === 1 ? '' : 's') + '</small></button>' + stLbl(x, g) + '</header>' +
        '<p class="rgn-states" title="' + RI.esc(names.join(', ')) + '">' + (names.length ? RI.esc(names.slice(0, 4).join(', ')) + (names.length > 4 ? ' and ' + (names.length - 4) + ' more' : '') : 'No states') + '</p>' +
        (x.state === 'live' ? '<p class="rgn-line">' + x.n + ' rates' + (x.none ? ', ' + x.none + ' with no rate yet (shown as not priced)' : '') + '. Houses in its states are priced.</p>'
          : x.state === 'new' ? '<p class="rgn-line">No rates yet. Houses here are saved but not priced.</p>'
          : '<div class="rgn-prog"><span class="rgn-bar" aria-hidden="true"><i style="width:' + pct + '%"></i></span><span>' + done + ' of ' + x.n + ' rates checked' + (x.unchk ? '' : x.priced ? ' &middot; Sam can turn it on' : ' &middot; no Low and High yet') + '</span></div>') +
        '<footer>' + next + (isSam ? '<button type="button" class="linkbtn small" data-edit="' + g.key + '">Change states</button>' : '') + '</footer></article>';
    }
    /* The map: every state in its real shape (RI.USMAP, usmap.js). The colour says where a region stands: green live,
       sage ready to go live, bronze while its rates are checked, hatched not started. Thick white lines part the regions,
       thin ones the states. Each region carries a name tag with a status dot; the chosen region is outlined in Deep
       Forest, filled in the deep shade of its status and shows its state codes. Alaska and Hawaii sit as insets. */
    var RGN_ST = {live:'Live', ready:'Ready to go live', check:'Checking rates', 'new':'Not started'};
    function map(){
      var M = RI.USMAP, host = doc.getElementById('rgn-map'); if(!M){ host.innerHTML = ''; return; }
      var stat = {}, cnt = {live:0, ready:0, check:0, 'new':0}, chosen = null;
      regs.forEach(function(g){ var x = rgnStats(g).state; stat[g.key] = x; cnt[x]++; if(g.key === sel) chosen = g; });
      /* the chosen region last, so its outline sits on top */
      var order = regs.filter(function(g){ return g.key !== sel; }).concat(chosen ? [chosen] : []), shapes = '', pins = '';
      order.forEach(function(g){
        var cs = g.states.filter(function(c){ return M.s[c]; }), st = stat[g.key], on = g.key === sel;
        shapes += '<g class="rgn-g st-' + st + (on ? ' is-on' : '') + '" data-g="' + g.key + '">' +
          cs.map(function(c){ return '<path class="rgn-e" d="' + M.s[c].d + '"/>'; }).join('') +
          cs.map(function(c){ return '<path class="rgn-s" d="' + M.s[c].d + '" data-sel="' + g.key + '"><title>' + RI.esc((RI.STATES[c] || c) + ', ' + g.name + ': ' + RGN_ST[st].toLowerCase()) + '</title></path>'; }).join('') +
          (on ? cs.filter(function(c){ return M.s[c].a > 900; }).map(function(c){ return '<text class="rgn-code" x="' + M.s[c].c[0] + '" y="' + M.s[c].c[1] + '">' + c + '</text>'; }).join('') : '') + '</g>';
        /* the name tag sits at the middle of the region's mainland states, weighted by size */
        var pts = cs.filter(function(c){ return c !== 'AK' && c !== 'HI'; }); if(!pts.length) pts = cs; if(!pts.length) return;
        var w = 0, x = 0, y = 0; pts.forEach(function(c){ var t = M.s[c], a = Math.sqrt(t.a); w += a; x += t.c[0] * a; y += t.c[1] * a; });
        x /= w; y /= w; if(on) y = Math.max(16, Math.min.apply(null, pts.map(function(c){ return M.s[c].c[1]; })) - 34); /* above the codes */
        pins += '<button type="button" class="rgn-pin st-' + st + (on ? ' is-on' : '') + '" style="left:' + (x / M.w * 100).toFixed(2) + '%;top:' + (y / M.h * 100).toFixed(2) + '%" data-sel="' + g.key + '" aria-label="' + RI.esc(g.name + ', ' + RGN_ST[st]) + '"><span class="d" aria-hidden="true"></span>' + RI.esc(g.name) + '</button>';
      });
      host.innerHTML = '<svg viewBox="0 0 ' + M.w + ' ' + M.h + '" role="img" aria-label="Map of the US regions' + (chosen ? ', ' + RI.esc(chosen.name) + ' chosen' : '') + '">' +
        '<defs><pattern id="rgn-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="#F3EEE5"/><rect width="3" height="9" fill="#DED2BF"/></pattern>' +
        '<pattern id="rgn-hatch-on" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" fill="#E6DBC9"/><rect width="3" height="9" fill="#C3AF92"/></pattern></defs>' + shapes + '</svg>' + pins;
      var regsN = regs.filter(function(g){ return g.states.length; }).length, statesN = regs.reduce(function(n, g){ return n + g.states.length; }, 0);
      doc.getElementById('rgn-sum').textContent = statesN + ' states in ' + regsN + ' regions';
      doc.getElementById('rgn-key').innerHTML = '<ul>' + ['live', 'ready', 'check', 'new'].filter(function(k){ return cnt[k] || k === 'live' || k === 'new'; }).map(function(k){
          return '<li><svg class="rgn-sw" viewBox="0 0 16 16" aria-hidden="true"><rect class="sw-' + k + '" width="16" height="16" rx="3"/></svg>' + RGN_ST[k] + '<b>' + cnt[k] + '</b></li>'; }).join('') + '</ul>' +
        '<p>' + (chosen ? '<span class="rgn-ol" aria-hidden="true"></span><b>' + RI.esc(chosen.name) + '</b> chosen &middot; ' + chosen.states.length + ' states' : '') + '<span class="rgn-tip">Tap a region on the map or a card</span></p>';
    }
    function draw(){ doc.getElementById('rgn-cards').innerHTML = regs.map(card).join(''); map(); RI.fillIcons(view); }
    /* Add a region, or change a region's states: one dialog. A state moves out of the region it was in. */
    function editRegion(key){
      var g = key ? regs.filter(function(x){ return x.key === key; })[0] : null, pick = {};
      (g ? g.states : []).forEach(function(c){ pick[c] = true; });
      var d = C.dialog(g ? 'Change the states of the ' + g.name : 'Add a region',
        '<label class="rgn-f"><span>Name</span><input class="input" id="rgn-name" value="' + RI.esc(g ? g.name : '') + '" placeholder="For example: Pacific Northwest" autocomplete="off"><small class="err" id="rgn-name-e"></small></label>' +
        '<p class="rgn-f-h">States <span class="muted" id="rgn-n"></span></p><div class="rgn-chips" id="rgn-chips">' +
          regs.map(function(r){ return '<fieldset><legend>' + RI.esc(r.name) + (r.live ? ' <span class="lb lb-pub">Live</span>' : '') + '</legend>' + r.states.slice().sort().map(function(c){ return '<label class="rgn-chip"><input type="checkbox" value="' + c + '"' + (pick[c] ? ' checked' : '') + '><span>' + c + '</span></label>'; }).join('') + '</fieldset>'; }).join('') +
        '</div><p class="rgn-warn" id="rgn-warn" aria-live="polite"></p>' +
        '<div class="cta-row" style="justify-content:flex-end;margin-top:12px"><button type="button" class="btn btn-secondary" data-dlg-close>Cancel</button><button type="button" class="btn btn-primary" id="rgn-save">' + RI.icon('check', 'i-sm') + (g ? 'Save the states' : 'Add the region') + '</button></div>', {wide:true});
      function chosen(){ return [].slice.call(d.querySelectorAll('#rgn-chips input:checked')).map(function(x){ return x.value; }); }
      function warn(){
        var cs = chosen(), moved = {}, w = [];
        cs.forEach(function(c){ var o = RI.regions().filter(function(r){ return r.states.indexOf(c) > -1; })[0]; if(o && (!g || o.key !== g.key)) (moved[o.name] = moved[o.name] || {live:o.live, s:[]}).s.push(c); });
        Object.keys(moved).forEach(function(n){ var m = moved[n]; w.push(m.s.join(', ') + ' move' + (m.s.length === 1 ? 's' : '') + ' out of the ' + n + (m.live ? ', which is live. Houses there are priced with this region\'s rates once it goes live; until then they are not priced.' : '.')); });
        d.querySelector('#rgn-n').textContent = cs.length + ' chosen'; d.querySelector('#rgn-warn').textContent = w.join(' ');
      }
      d.addEventListener('change', warn); warn();
      d.querySelector('#rgn-save').addEventListener('click', function(){
        var name = d.querySelector('#rgn-name').value.trim().replace(/\s+/g, ' '), cs = chosen(), e = d.querySelector('#rgn-name-e');
        var clash = regs.some(function(r){ return r.name.toLowerCase() === name.toLowerCase() && (!g || r.key !== g.key); });
        e.textContent = !name ? 'Name the region.' : clash ? 'There is already a region with this name.' : !cs.length ? 'Choose at least one state.' : '';
        if(e.textContent){ d.querySelector('#rgn-name').focus(); return; }
        regs.forEach(function(r){ if(!g || r.key !== g.key) r.states = r.states.filter(function(c){ return cs.indexOf(c) < 0; }); });
        if(g){
          if(g.name !== name){ var all = rtList(); all.forEach(function(r){ if(r.region === g.name) r.region = name; }); C.set('rates', all); }
          C.log('Region changed', name + ': ' + cs.length + ' states' + (g.name !== name ? ' (was ' + g.name + ')' : ''), '', 'rates');
          g.name = name; g.states = cs; sel = g.key;
        } else {
          var k = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'region'; while(regs.some(function(r){ return r.key === k; })) k += '-2';
          regs.push({key:k, name:name, states:cs}); sel = k; C.log('Region added', name + ': ' + cs.length + ' states, not live', '', 'rates');
        }
        save(); d.close(); RI.toast(g ? name + ' saved.' : name + ' added. Start it with the ' + RT_HOME + ' rates.', 'check'); draw();
      });
    }
    view.addEventListener('mouseover', function(e){ var x = e.target.closest('.rgn-s'); view.querySelectorAll('.rgn-g.is-hov').forEach(function(g){ if(!x || g !== x.parentNode) g.classList.remove('is-hov'); }); if(x) x.parentNode.classList.add('is-hov'); });
    view.addEventListener('mouseleave', function(){ view.querySelectorAll('.rgn-g.is-hov').forEach(function(g){ g.classList.remove('is-hov'); }); });
    view.addEventListener('click', function(e){
      var st = e.target.closest('[data-start]'); if(st){ var g1 = regs.filter(function(x){ return x.key === st.getAttribute('data-start'); })[0]; rtStartDialog(g1.name, function(){ sel = g1.key; draw(); }); return; }
      var lv = e.target.closest('[data-live]'); if(lv && !lv.disabled){ var g2 = regs.filter(function(x){ return x.key === lv.getAttribute('data-live'); })[0];
        C.confirm('Turn on the ' + g2.name + '?', 'Houses in its ' + g2.states.length + ' states are priced with its rates from now on. You can change any rate later through the publish queue.', 'Go live', function(){ g2.live = true; save(); var all = rtList(); all.forEach(function(r){ if(r.region === g2.name && r.lo != null && !r.v){ r.v = 1; r.at = Date.now(); } }); C.set('rates', all); C.log('Region live', g2.name + ': ' + g2.states.length + ' states priced from now on', '', 'rates'); RI.toast(g2.name + ' is live.', 'check'); draw(); }); return; }
      var ed = e.target.closest('[data-edit]'); if(ed){ editRegion(ed.getAttribute('data-edit')); return; }
      if(e.target.closest('#rgn-add')){ editRegion(null); return; }
      var s2 = e.target.closest('[data-sel]'); if(s2 && s2.getAttribute('data-sel')){ sel = s2.getAttribute('data-sel'); draw(); }
    });
    draw();
  }, {nav:'regions', perm:'rulebook.view'});

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
