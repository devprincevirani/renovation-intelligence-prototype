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
  C.APPLY.rates = function(d){ var l = C.get('rates', []), r = l[+d.ref]; if(r){ r.lo = d.after.lo; r.hi = d.after.hi; r.v++; r.at = Date.now(); C.set('rates', l); } };

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

  /* ---------- Rates ---------- */
  C.route('/rates', function(view){
    var list = C.get('rates', []), canEdit = C.can('pricing.edit'), edit = {};
    view.innerHTML = C.page({kicker:'Pricing', title:'Rates', sub:'Installed Low and High per line, by region, with the date and the source. A published rate is what check 4 looks for.',
      body:'<div class="c-toolbar"><label class="c-select"><span class="sr">Region</span><select id="ra-r"><option>Sample region</option></select></label><span class="small muted">One region in version one.</span></div><div id="ra-list"></div>'});
    function draw(){
      doc.getElementById('ra-list').innerHTML = '<div class="ra">' + list.map(function(r, i){
        var e = edit[i], lo = e ? e.lo : r.lo, hi = e ? e.hi : r.hi, dr = C.draftFor('rates', String(i)), max = Math.max(r.hi, hi) * 1.6;
        return '<article class="ra-card' + (e ? ' editing' : '') + '"><header><div><h2>' + RI.esc(r.name) + '</h2><p>' + RI.esc(r.desc) + '</p></div>' + (e ? C.lbl('draft', 'not saved') : dr ? C.lbl('queued') : C.lbl('published', 'v' + r.v)) + '</header>' +
          '<div class="ra-val"><span class="ra-n">' + money2(lo) + '<em>to</em>' + money2(hi) + '<small>per ' + r.unit + '</small></span>' + rline(lo, hi, max) + '</div>' +
          (e ? '<div class="ra-ed"><label>Low<input class="input" type="number" step="0.1" data-lo="' + i + '" value="' + lo + '"></label><label>High<input class="input" type="number" step="0.1" data-hi="' + i + '" value="' + hi + '"></label><button type="button" class="btn btn-secondary btn-sm" data-cancel="' + i + '">Cancel</button><button type="button" class="btn btn-primary btn-sm" data-save="' + i + '">Save as draft</button></div>' :
            '<footer><span class="small muted">' + RI.esc(r.region) + ' · ' + RI.esc(r.src) + ' · ' + C.date(r.at) + '</span>' + (canEdit && !dr ? '<button type="button" class="linkbtn small" data-ed="' + i + '">Edit</button>' : dr ? '<a class="small" href="#/publish">In the queue</a>' : '') + '</footer>') + '</article>';
      }).join('') + '</div>' + C.note('Sample rates. Low and High only, never one number. Sam\'s rate library replaces them.');
      RI.fillIcons(doc.getElementById('ra-list'));
    }
    view.addEventListener('click', function(e){
      var ed = e.target.closest('[data-ed]'); if(ed){ var i = +ed.getAttribute('data-ed'); edit[i] = {lo:list[i].lo, hi:list[i].hi}; draw(); var f = doc.querySelector('[data-lo="' + i + '"]'); if(f) f.focus(); return; }
      var ca = e.target.closest('[data-cancel]'); if(ca){ delete edit[+ca.getAttribute('data-cancel')]; draw(); return; }
      var sv = e.target.closest('[data-save]'); if(sv){ var k = +sv.getAttribute('data-save'), r = list[k], x = edit[k];
        if(!(x.lo > 0 && x.hi >= x.lo)){ RI.toast('High must be at least Low.', 'warn'); return; }
        if(x.lo === r.lo && x.hi === r.hi){ delete edit[k]; draw(); return; }
        var sum = 'Low and High per ' + r.unit + ': ' + money2(r.lo) + ' to ' + money2(r.hi) + ' becomes ' + money2(x.lo) + ' to ' + money2(x.hi);
        C.askWhy('Rate: ' + r.name, sum, function(why){ C.addDraft({area:'rates', ref:String(k), title:'Rate: ' + r.name + ', sample region', summary:sum, after:{lo:x.lo, hi:x.hi}, why:why}); delete edit[k]; RI.toast('Saved as a draft. It waits in the publish queue.', 'check'); C.render(); }); }
    });
    view.addEventListener('input', function(e){ var lo = e.target.getAttribute('data-lo'), hi = e.target.getAttribute('data-hi'); if(lo != null) edit[+lo].lo = +e.target.value; if(hi != null) edit[+hi].hi = +e.target.value;
      var i = lo != null ? +lo : hi != null ? +hi : -1; if(i < 0) return; var card = e.target.closest('.ra-card'), x = edit[i], max = Math.max(list[i].hi, x.hi) * 1.6;
      card.querySelector('.ra-n').innerHTML = money2(x.lo || 0) + '<em>to</em>' + money2(x.hi || 0) + '<small>per ' + list[i].unit + '</small>'; card.querySelector('.pr-rl').outerHTML = rline(x.lo || 0, x.hi || 0, max); });
    draw();
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
