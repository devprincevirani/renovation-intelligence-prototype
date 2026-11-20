/* Sample presentation: package switch, item switches, rooms, comparison, unknowns, mechanicals.
   Choices are kept in localStorage so a reload keeps the viewer's selection. */
(function(){
  var RI = window.RI, doc = document, H = RI.SAMPLE;
  var st = {pk:RI.store.get('sample.pk', 'S'), off:RI.store.get('sample.off', {}), open:{kitchen:true}};
  function save(){ RI.store.set('sample.pk', st.pk); RI.store.set('sample.off', st.off); }
  var selRoom = 'kitchen';
  var plan = RI.Plan.mount(document.getElementById('plan'), {onSelect:function(k){
    selRoom = k; renderRooms(); plan.update(st.pk, st.off, selRoom);
    var el = doc.getElementById('rooms'); if(el) el.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start'});
  }});
  function pkName(k){ return RI.PACKAGES.filter(function(p){ return p.key === k; })[0]; }
  function heldLabel(it){ return it.state === 'measure' ? 'Needs measurement' : 'Unverified'; }

  doc.getElementById('facts').innerHTML = H.facts.map(function(f){ return '<div><dt>' + f[0] + '</dt><dd>' + f[1] + '</dd></div>'; }).join('');

  /* Rooms: one room card at a time, picked from the chips */
  var roomsEl = doc.getElementById('rooms');
  function itemRow(it){
    if(RI.isHeld(it)){
      return '<div class="item hold"><div><span class="nm">' + RI.esc(it.name) + '</span><div class="fix">' + RI.icon('info','i-sm') + ' ' + RI.esc(it.fix) + ' would settle it.</div></div>' +
        '<span class="state ' + (it.state === 'measure' ? 'state-measure' : 'state-unverified') + '">' + heldLabel(it) + '</span><span class="amt muted small">Not in the total</span></div>';
    }
    var p = it.pk[st.pk], keep = p[1] == null, off = !!st.off[it.id];
    return '<div class="item' + (off ? ' off' : '') + '" data-item="' + it.id + '"><div><span class="nm">' + RI.esc(it.name) + '</span><div class="act">' + RI.esc(p[0]) + '</div>' +
      '<details class="rc-det"><summary>Details</summary><span>' + RI.esc(it.qty) + ' · ' + RI.esc(it.trade) + '</span></details></div>' +
      (keep ? '<span></span><span class="amt muted small">Keep, no cost</span>' :
      '<label class="switch sw"><input type="checkbox" data-id="' + it.id + '"' + (off ? '' : ' checked') + '><span class="track"></span><span class="sr">Include ' + RI.esc(it.name) + '</span></label>' +
      '<span class="amt range-txt">' + RI.range(p[1], p[2]) + '</span>') + '</div>';
  }
  function roomRange(r){
    var t = RI.totals(st.pk, st.off, r.key), has = r.items.some(RI.isHeld);
    return (t.high ? RI.range(t.low, t.high) : '<span class="muted">No cost</span>') + (has ? ' <span class="state state-partial">Partial</span>' : '');
  }
  function renderRooms(){
    var r = H.rooms.filter(function(x){ return x.key === selRoom; })[0] || H.rooms[0];
    roomsEl.innerHTML = '<div class="rc-picker" role="group" aria-label="Rooms">' + H.rooms.map(function(x){ return '<button type="button" class="rc-chip" data-pick="' + x.key + '" aria-pressed="' + (x.key === r.key) + '">' + x.name + '</button>'; }).join('') + '</div>' +
      '<div id="rc-host">' + RI.RoomCard.html(r, st.pk, {range:roomRange(r), itemsHtml:r.items.map(itemRow).join('')}) + '</div>';
    RI.RoomCard.wire(roomsEl);
  }
  function refreshHeads(){
    var r = H.rooms.filter(function(x){ return x.key === selRoom; })[0], el = roomsEl.querySelector('.rc-range'); if(el && r) el.innerHTML = roomRange(r);
  }
  roomsEl.addEventListener('click', function(e){
    var b = e.target.closest('[data-pick]'); if(!b) return;
    selRoom = b.getAttribute('data-pick'); renderRooms(); renderThree(); plan.update(st.pk, st.off, selRoom);
  });
  roomsEl.addEventListener('change', function(e){
    var id = e.target.getAttribute('data-id'); if(!id) return;
    st.off[id] = !e.target.checked; if(!st.off[id]) delete st.off[id];
    e.target.closest('.item').classList.toggle('off', !e.target.checked);
    save(); refreshHeads(); renderTotals(); renderTrades(); renderThree();
  });

  /* Totals */
  function renderTotals(){
    if(typeof plan !== 'undefined') plan.update(st.pk, st.off, selRoom);
    var t = RI.totals(st.pk, st.off), pk = pkName(st.pk);
    var tot = doc.getElementById('tot'); tot.innerHTML = RI.range(t.low, t.high);
    tot.classList.remove('bump'); void tot.offsetWidth; tot.classList.add('bump');
    doc.getElementById('pk-goal').textContent = pk.name + ': ' + pk.goal;
    var offN = Object.keys(st.off).length;
    doc.getElementById('tot-label').textContent = offN ? offN + ' item' + (offN > 1 ? 's' : '') + ' off' : 'All items';
    var rl = doc.getElementById('tot-rl'); rl.setAttribute('data-low', t.low); rl.setAttribute('data-high', t.high); RI.drawRange(rl); rl.classList.add('drawn');
  }

  /* The three goals side by side: one row per part of the room, one column per goal.
     Read across a row to see what each goal does with that part. Tap a goal to use it on the whole page. */
  function g3Cell(it, pk){
    var sel = pk === st.pk ? ' sel' : '';
    if(RI.isHeld(it)) return '<div class="g3-cell held' + sel + '"><span class="g3-ph g3-ph-n">' + RI.icon(it.state === 'measure' ? 'ruler' : 'camera', 'i-sm') + '</span><span class="g3-t"><b>' + (it.state === 'measure' ? 'Needs measurement' : 'Unverified') + '</b><span>Not in the total</span></span></div>';
    var a = it.pk[pk];
    if(st.off[it.id] && a[1] != null) return '<div class="g3-cell off' + sel + '"><span class="g3-ph g3-ph-n">' + RI.icon('x', 'i-sm') + '</span><span class="g3-t"><b>Turned off</b><span>Not in the total</span></span></div>';
    if(a[1] == null) return '<div class="g3-cell kept' + sel + '" title="' + RI.esc(a[0]) + '"><span class="g3-ph g3-ph-n">' + RI.icon('check', 'i-sm') + '</span><span class="g3-t"><b>Kept as it is</b><span>No cost</span></span></div>';
    var m = RI.PRODUCT_IMG && RI.PRODUCT_IMG[it.id], img = m && m[pk] ? RI.img(m[pk]) : null;
    return '<div class="g3-cell' + sel + '" title="' + RI.esc(a[0] + (a[3] ? '. ' + a[3] : '')) + '">' +
      (img ? '<img class="g3-ph" src="' + img + '" alt="" loading="lazy">' : '<span class="g3-ph g3-ph-n">' + RI.icon('tag', 'i-sm') + '</span>') +
      '<span class="g3-t"><b>' + RI.esc(a[0]) + '</b><span class="g3-p">' + RI.money(a[1]) + ' to ' + RI.money(a[2]) + '</span></span></div>';
  }
  function renderThree(){
    var r = H.rooms.filter(function(x){ return x.key === selRoom; })[0] || H.rooms[0], el = doc.getElementById('three');
    var T = {}, max = 1; RI.PACKAGES.forEach(function(p){ T[p.key] = RI.totals(p.key, st.off, r.key); max = Math.max(max, T[p.key].high); });
    var held = r.items.some(RI.isHeld), photo = RI.RoomCard && RI.RoomCard.photoFor(r.key);
    var head = '<div class="g3-corner">' + (photo ? '<img src="' + photo + '" alt="">' : '<span class="g3-noph">' + RI.icon('camera') + '</span>') +
      '<span><b>' + RI.esc(r.name) + '</b><span>' + r.items.length + ' part' + (r.items.length === 1 ? '' : 's') + '</span></span></div>' +
      RI.PACKAGES.map(function(p){
        var t = T[p.key], on = p.key === st.pk;
        return '<button type="button" class="g3-goal' + (on ? ' sel' : '') + '" data-goal="' + p.key + '" aria-pressed="' + on + '">' +
          '<span class="g3-gn">' + p.name + (on ? '<span class="g3-badge">' + RI.icon('check', 'i-sm') + 'Selected</span>' : '') + '</span>' +
          '<span class="g3-gl">' + p.goal + '</span>' +
          '<span class="g3-tot range-txt">' + (t.high ? RI.range(t.low, t.high) : 'No cost') + '</span>' +
          '<span class="g3-bar" aria-hidden="true"><i style="left:' + (t.low / max * 100).toFixed(1) + '%;width:' + Math.max(2, (t.high - t.low) / max * 100).toFixed(1) + '%"></i></span>' +
          '<span class="g3-foot">' + (held ? '<span class="state state-partial">Partial</span>' : '') + (on ? '' : '<span class="g3-use">Use this goal</span>') + '</span></button>';
      }).join('');
    var rows = r.items.map(function(it){
      return '<div class="g3-part">' + RI.esc(it.name.split(',')[0]) + '</div>' + RI.PACKAGES.map(function(p){ return g3Cell(it, p.key); }).join('');
    }).join('');
    el.innerHTML = '<div class="g3" role="table" aria-label="' + RI.esc(r.name) + ' under each goal">' + head + rows + '</div>';
  }
  doc.getElementById('three').addEventListener('click', function(e){ var g = e.target.closest('[data-goal]'); if(g && g.getAttribute('data-goal') !== st.pk) setPk(g.getAttribute('data-goal')); });

  /* Trades summary */
  function renderTrades(){
    var by = {};
    H.rooms.forEach(function(r){ r.items.forEach(function(it){
      if(RI.isHeld(it) || st.off[it.id]) return; var p = it.pk[st.pk]; if(!p || p[1] == null) return;
      by[it.trade] = by[it.trade] || [0,0]; by[it.trade][0] += p[1]; by[it.trade][1] += p[2];
    }); });
    doc.getElementById('trades').innerHTML = Object.keys(by).sort(function(a, b){ return by[b][1] - by[a][1]; }).map(function(k){ return '<div class="trade-row"><span>' + k + '</span><span class="range-txt">' + RI.range(by[k][0], by[k][1]) + '</span></div>'; }).join('') || '<p class="small muted">No items selected.</p>';
  }

  /* Unknowns and mechanicals */
  var unk = []; H.rooms.forEach(function(r){ r.items.forEach(function(it){ if(RI.isHeld(it)) unk.push([r, it]); }); });
  doc.getElementById('unknowns').innerHTML = unk.map(function(x){ return '<div class="unk-row"><div><strong>' + x[0].name + ', ' + x[1].name.toLowerCase() + '</strong><div class="fix">' + x[1].fix + ' would settle it.</div></div><span class="state ' + (x[1].state === 'measure' ? 'state-measure' : 'state-unverified') + '">' + heldLabel(x[1]) + '</span></div>'; }).join('');
  doc.getElementById('mech').innerHTML = H.mechanicals.map(RI.mechCard).join('');


  /* Package switch */
  var seg = doc.getElementById('pk-seg');
  function setPk(k){
    st.pk = k; save();
    seg.querySelectorAll('[data-pk]').forEach(function(x){ x.setAttribute('aria-selected', x.getAttribute('data-pk') === k); });
    RI.syncSeg(seg); renderRooms();
    renderTotals(); renderTrades(); renderThree();
  }
  seg.addEventListener('click', function(e){ var b = e.target.closest('[data-pk]'); if(b) setPk(b.getAttribute('data-pk')); });
  seg.addEventListener('keydown', function(e){
    if(e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var ks = ['E','S','P'], i = ks.indexOf(st.pk), n = ks[(i + (e.key === 'ArrowRight' ? 1 : 2)) % 3];
    setPk(n); seg.querySelector('[data-pk="' + n + '"]').focus();
  });

  doc.getElementById('reset').addEventListener('click', function(){ st.off = {}; save(); setPk(st.pk); RI.toast('All items are back on.'); });
  doc.getElementById('share').addEventListener('click', function(){ RI.toast('In a paid presentation this copies a private, read-only link.', 'share'); });
  doc.getElementById('pdf').addEventListener('click', function(){ RI.toast('In a paid presentation this saves a PDF of the selected goal.', 'file'); });

  setPk(st.pk);
})();
