/* Sample presentation: package switch, item switches, rooms, comparison, unknowns, mechanicals.
   Choices are kept in localStorage so a reload keeps the viewer's selection. */
(function(){
  var RI = window.RI, doc = document, H = RI.SAMPLE;
  var st = {pk:RI.store.get('sample.pk', 'S'), off:RI.store.get('sample.off', {}), open:{kitchen:true}};
  function save(){ RI.store.set('sample.pk', st.pk); RI.store.set('sample.off', st.off); }
  var selRoom = 'kitchen';
  var plan = RI.Plan.mount(document.getElementById('plan'), {onSelect:function(k){
    selRoom = k; plan.update(st.pk, st.off, selRoom);
    var el = roomsEl.querySelector('[data-room="' + k + '"]'); if(!el) return;
    st.open[k] = true; el.classList.add('open'); el.querySelector('.room-head').setAttribute('aria-expanded', 'true');
    el.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start'});
  }});
  function pkName(k){ return RI.PACKAGES.filter(function(p){ return p.key === k; })[0]; }
  function heldLabel(it){ return it.state === 'measure' ? 'Needs measurement' : 'Unverified'; }

  doc.getElementById('facts').innerHTML = H.facts.map(function(f){ return '<div><dt>' + f[0] + '</dt><dd>' + f[1] + '</dd></div>'; }).join('');

  /* Rooms */
  var roomsEl = doc.getElementById('rooms');
  function roomScale(){ var m = 0; H.rooms.forEach(function(r){ ['E','S','P'].forEach(function(k){ m = Math.max(m, RI.totals(k, {}, r.key).high); }); }); return Math.ceil(m / 5000) * 5000; }
  var RS = roomScale();
  function itemRow(it){
    if(RI.isHeld(it)){
      return '<div class="item hold"><div><span class="nm">' + RI.esc(it.name) + '</span><div class="meta"><span>' + RI.esc(it.qty) + '</span>' + RI.ev(it.ev) + '</div><div class="fix">' + RI.icon('info','i-sm') + ' ' + RI.esc(it.fix) + ' would settle it.</div></div>' +
        '<span class="state ' + (it.state === 'measure' ? 'state-measure' : 'state-unverified') + '">' + heldLabel(it) + '</span><span class="amt muted small">Not in the total</span></div>';
    }
    var p = it.pk[st.pk], keep = p[1] == null, off = !!st.off[it.id];
    return '<div class="item' + (off ? ' off' : '') + '" data-item="' + it.id + '"><div><span class="nm">' + RI.esc(it.name) + '</span><div class="act">' + RI.esc(p[0]) + '</div>' +
      '<div class="meta"><span>' + RI.esc(it.qty) + '</span>' + RI.ev(it.ev) + '<span>' + RI.esc(it.trade) + '</span>' + (p[3] ? '<span class="prod">' + RI.icon('dot','i-sm') + RI.esc(p[3]) + '</span>' : '') + '</div></div>' +
      (keep ? '<span></span><span class="amt muted small">Keep, no cost</span>' :
      '<label class="switch sw"><input type="checkbox" data-id="' + it.id + '"' + (off ? '' : ' checked') + '><span class="track"></span><span class="sr">Include ' + RI.esc(it.name) + '</span></label>' +
      '<span class="amt range-txt">' + RI.range(p[1], p[2]) + '</span>') + '</div>';
  }
  function roomHead(r){
    var t = RI.totals(st.pk, st.off, r.key);
    var has = r.items.some(function(i){ return RI.isHeld(i); });
    return '<button type="button" class="room-head" aria-expanded="' + !!st.open[r.key] + '" aria-controls="room-' + r.key + '"><span><span class="rh-title">' + r.name + '</span><span class="sub">' + r.sub + (has ? ' &middot; partial' : '') + '</span></span>' +
      '<span data-scale="0,' + RS + '"><span class="rl' + (has ? ' partial' : '') + '" data-low="' + t.low + '" data-high="' + t.high + '"></span></span>' +
      '<span class="range-txt">' + (t.high ? RI.range(t.low, t.high) : '<span class="muted">No cost</span>') + '</span><span class="chev" aria-hidden="true"></span></button>';
  }
  function renderRooms(){
    roomsEl.innerHTML = H.rooms.map(function(r){
      return '<div class="room' + (st.open[r.key] ? ' open' : '') + '" data-room="' + r.key + '">' + roomHead(r) +
        '<div class="room-body" id="room-' + r.key + '"><div>' + r.items.map(itemRow).join('') + '</div></div></div>';
    }).join('');
    RI.initRanges(roomsEl);
  }
  function refreshHeads(){
    H.rooms.forEach(function(r){
      var el = roomsEl.querySelector('[data-room="' + r.key + '"] .room-head'); if(!el) return;
      var tmp = doc.createElement('div'); tmp.innerHTML = roomHead(r);
      el.innerHTML = tmp.firstChild.innerHTML; RI.initRanges(el); el.querySelectorAll('.rl').forEach(function(x){ x.classList.add('drawn'); });
    });
  }
  roomsEl.addEventListener('click', function(e){
    var h = e.target.closest('.room-head'); if(!h) return;
    var room = h.parentNode, k = room.getAttribute('data-room');
    st.open[k] = !st.open[k]; room.classList.toggle('open', st.open[k]); h.setAttribute('aria-expanded', st.open[k]);
  });
  roomsEl.addEventListener('change', function(e){
    var id = e.target.getAttribute('data-id'); if(!id) return;
    st.off[id] = !e.target.checked; if(!st.off[id]) delete st.off[id];
    e.target.closest('.item').classList.toggle('off', !e.target.checked);
    save(); refreshHeads(); renderTotals(); renderCompare(); renderTrades();
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

  /* Comparison table */
  function renderCompare(){
    var rows = H.rooms.map(function(r){
      return '<tr><td class="wt"><strong>' + r.name + '</strong></td>' + ['E','S','P'].map(function(k){
        var t = RI.totals(k, st.off, r.key);
        return '<td class="r' + (k === st.pk ? '' : ' muted') + '">' + (t.high ? RI.range(t.low, t.high) : 'No cost') + '</td>';
      }).join('') + '</tr>';
    }).join('');
    var tot = ['E','S','P'].map(function(k){ var t = RI.totals(k, st.off); return '<td class="r"><strong>' + RI.range(t.low, t.high) + '</strong><div data-scale="0,125000" style="margin-top:6px"><div class="rl partial" data-low="' + t.low + '" data-high="' + t.high + '"></div></div></td>'; }).join('');
    doc.getElementById('compare').innerHTML = '<thead><tr><th scope="col">Room</th>' + RI.PACKAGES.map(function(p){ return '<th scope="col" style="text-align:right">' + p.name + (p.key === st.pk ? ' (selected)' : '') + '</th>'; }).join('') + '</tr></thead><tbody>' + rows +
      '<tr><td class="wt"><strong>Total</strong><span>Partial: 3 lines not priced</span></td>' + tot + '</tr></tbody>';
    RI.initRanges(doc.getElementById('compare'));
  }

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
    RI.syncSeg(seg); renderRooms(); roomsEl.querySelectorAll('.rl').forEach(function(x){ x.classList.add('drawn'); });
    renderTotals(); renderCompare(); renderTrades();
  }
  seg.addEventListener('click', function(e){ var b = e.target.closest('[data-pk]'); if(b) setPk(b.getAttribute('data-pk')); });
  seg.addEventListener('keydown', function(e){
    if(e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var ks = ['E','S','P'], i = ks.indexOf(st.pk), n = ks[(i + (e.key === 'ArrowRight' ? 1 : 2)) % 3];
    setPk(n); seg.querySelector('[data-pk="' + n + '"]').focus();
  });

  doc.getElementById('expand').addEventListener('click', function(){
    var all = H.rooms.every(function(r){ return st.open[r.key]; });
    H.rooms.forEach(function(r){ st.open[r.key] = !all; });
    roomsEl.querySelectorAll('.room').forEach(function(el){ el.classList.toggle('open', !all); el.querySelector('.room-head').setAttribute('aria-expanded', !all); });
    this.textContent = all ? 'Open all rooms' : 'Close all rooms';
  });
  doc.getElementById('reset').addEventListener('click', function(){ st.off = {}; save(); setPk(st.pk); RI.toast('All items are back on.'); });
  doc.getElementById('share').addEventListener('click', function(){ RI.toast('In a paid presentation this copies a private, read-only link.', 'share'); });
  doc.getElementById('pdf').addEventListener('click', function(){ RI.toast('In a paid presentation this saves a PDF of the selected goal.', 'file'); });

  setPk(st.pk);
})();
