/* Material boards: the sample kitchen under each goal, shown as finish samples.
   Each tile opens a popup with its options. Picking one swaps the finish and updates that goal's Low and High at once.
   The goal's own picks come from the sample house (RI.SAMPLE), so a board starts at the same total as the
   presentation. Extra options are sample options with sample prices; in the product they come from Sam's
   product library. Every option has a real photo of that kind of product (Wikimedia Commons, credits in
   CREDITS.md). Kept options show what is in the sample kitchen today. */
(function(){
  var RI = window.RI;

  /* Per tile: the options. `from` takes the action and price from the sample item under that goal;
     the others carry their own sample action and price. `keep` marks an option that keeps what is there. */
  var TILES = [
    {name:'Cabinets', id:'k1', def:{E:'oak', S:'painted', P:'shaker'}, opts:[
      {k:'oak', img:'cab-oak', cap:'Oak, kept', from:'E', keep:true},
      {k:'painted', img:'cab-painted', cap:'Same doors, refinished', from:'S'},
      {k:'shaker', img:'cab-shaker', cap:'White shaker, new', from:'P'},
      {k:'stained', img:'cab-stained', cap:'Stained shaker, new', act:'Replace with stained wood shaker cabinets', lo:16200, hi:26800},
      {k:'slab', img:'cab-slab', cap:'Flat slab, wood-grain', act:'Replace with flat slab cabinets in a wood-grain finish', lo:15800, hi:25900}
    ]},
    {name:'Countertop', id:'k2', def:{E:'laminate', S:'stonelook', P:'quartz'}, opts:[
      {k:'laminate', img:'ct-laminate', cap:'Laminate, kept', from:'E', keep:true},
      {k:'stonelook', img:'ct-stonelook', cap:'Stone-look laminate', from:'S'},
      {k:'butcher', img:'ct-butcher', cap:'Butcher block', act:'Replace with a butcher block top', lo:2200, hi:3600},
      {k:'granite', img:'ct-granite', cap:'Granite', act:'Replace with granite, eased edge', lo:3200, hi:5200},
      {k:'quartz', img:'ct-quartz', cap:'Quartz', from:'P'}
    ]},
    {name:'Backsplash', id:'k4', def:{E:'existing', S:'white', P:'glazed'}, opts:[
      {k:'existing', img:'bs-existing', cap:'Existing tile, kept', from:'E', keep:true},
      {k:'white', img:'bs-white', cap:'White ceramic tile', from:'S'},
      {k:'glazed', img:'bs-glazed', cap:'Glazed tile', from:'P'},
      {k:'glass', img:'bs-glass', cap:'Back-painted glass panel', act:'Replace the tile with one back-painted glass panel', lo:1600, hi:2700}
    ]},
    {name:'Faucet', id:'k3', def:{E:'single', S:'pulldown', P:'black'}, opts:[
      {k:'single', img:'fx-single-new', cap:'Single-handle', from:'E'},
      {k:'pulldown', img:'fx-pulldown', cap:'Stainless, pull-down', from:'S'},
      {k:'black', img:'fx-black', cap:'Matte black', from:'P'},
      {k:'touchless', img:'fx-touchless', cap:'Touchless, chrome', act:'New sink and a touchless faucet', lo:1300, hi:2100}
    ]},
    {name:'Lighting', id:'k6', def:{E:'old', S:'flush', P:'recessed'}, opts:[
      {k:'old', img:'lt-old', cap:'Fluorescent panel, kept', from:'E', keep:true},
      {k:'undercab', img:'lt-undercab', cap:'Under-cabinet LED', act:'Add LED strips under the wall cabinets', lo:450, hi:850},
      {k:'flush', img:'lt-flush', cap:'Flush mounts', from:'S'},
      {k:'pendants', img:'lt-pendant', cap:'Glass pendants over the sink', act:'Add two glass pendant lights over the sink', lo:700, hi:1300},
      {k:'recessed', img:'lt-recessed', cap:'Recessed, dimmer', from:'P'}
    ]},
    {name:'Floor', id:'k5', measure:true}
  ];

  function item(id){ var it; RI.SAMPLE.rooms.forEach(function(r){ r.items.forEach(function(i){ if(i.id === id) it = i; }); }); return it; }
  /* Fill each option's action and price from the sample house where it is that goal's own pick */
  TILES.forEach(function(t){
    if(t.measure) return;
    var it = item(t.id);
    t.opts.forEach(function(o){ if(!o.from) return; var a = it.pk[o.from]; o.act = a[0]; o.lo = a[1]; o.hi = a[2]; });
  });
  function optOf(t, k){ return t.opts.filter(function(o){ return o.k === k; })[0]; }
  function priceTxt(o){ return o.lo == null ? 'No cost' : RI.money(o.lo) + ' to ' + RI.money(o.hi); }
  function swatch(o, alt, small){
    return o.img ? '<img src="' + RI.img('finishes/' + o.img + '.jpg') + '" alt="' + RI.esc(alt || '') + '" width="360" height="360" loading="lazy">'
                 : '<span class="mt-neutral" aria-hidden="true">' + RI.icon('tag', 'i-lg') + (small ? '' : '<span>' + RI.esc(o.cap) + '</span>') + '</span>';
  }

  RI.Materials = {
    render:function(host){
      /* The pick per goal and tile; starts at each goal's own picks */
      var pick = {};
      RI.PACKAGES.forEach(function(p){ pick[p.key] = {}; TILES.forEach(function(t){ if(!t.measure) pick[p.key][t.id] = t.def[p.key]; }); });

      function total(pk){
        var lo = 0, hi = 0, changed = 0, kept = 0, edited = false;
        TILES.forEach(function(t){
          if(t.measure) return;
          var o = optOf(t, pick[pk][t.id]);
          if(o.lo != null){ lo += o.lo; hi += o.hi; }
          if(o.keep || o.lo == null) kept++; else changed++;
          if(o.k !== t.def[pk]) edited = true;
        });
        return {low:lo, high:hi, changed:changed, kept:kept, edited:edited};
      }
      function tileHtml(t, pk, i){
        if(t.measure){
          return '<li class="mt mt-measure" style="--i:' + i + '"><span class="mt-sw">' + RI.icon('ruler','i-lg') + '<span>Needs measurement</span></span><span class="mt-cap"><b>' + t.name + '</b><span>Not in the total</span></span></li>';
        }
        var o = optOf(t, pick[pk][t.id]), isKeep = !!o.keep || o.lo == null, edited = o.k !== t.def[pk];
        return '<li class="mt' + (isKeep ? ' kept' : '') + (edited ? ' edited' : '') + '" style="--i:' + i + '" role="button" tabindex="0" aria-haspopup="dialog" data-tile="' + t.id + '" data-act="' + RI.esc(t.name + ': ' + o.act + ' (' + priceTxt(o) + ')') + '" aria-label="' + RI.esc(t.name + ', ' + o.cap + '. Choose another option') + '">' +
          '<span class="mt-sw">' + swatch(o, t.name + ', ' + o.cap.toLowerCase()) + (isKeep ? '<span class="mt-kept">Kept</span>' : '') + '<span class="mt-more" aria-hidden="true">' + (t.opts.length - 1) + ' more</span></span>' +
          '<span class="mt-cap"><b>' + t.name + '</b><span>' + RI.esc(o.cap) + '</span></span></li>';
      }
      function pkName(pk){ return RI.PACKAGES.filter(function(p){ return p.key === pk; })[0].name; }
      function sgn(n){ return (n < 0 ? '−' : '+') + RI.money(Math.abs(n)); }

      host.innerHTML = RI.PACKAGES.map(function(p){
        return '<article class="board' + (p.key === 'S' ? ' is-default' : '') + '" data-pk="' + p.key + '" aria-label="' + p.name + ' finishes">' +
          '<header class="board-head"><div><h3>' + p.name + (p.key === 'S' ? ' <span class="default">Default view</span>' : '') + '</h3><p>' + p.goal + '</p></div><span class="board-pin" aria-hidden="true"></span></header>' +
          '<ul class="board-grid"></ul>' +
          '<footer class="board-foot"><div class="board-range" data-scale="0,40000"><div class="rl partial" data-low="0" data-high="0"></div></div>' +
          '<div class="row"><span class="range-txt board-total"></span><span class="small muted board-count"></span></div>' +
          '<p class="board-note" aria-live="polite"></p><button type="button" class="linkbtn small board-reset" hidden>Back to the ' + p.name + ' picks</button></footer></article>';
      }).join('');
      if(!host.nextElementSibling || !host.nextElementSibling.classList.contains('mt-src')) host.insertAdjacentHTML('afterend', '<p class="xsmall muted mt-src">Select a finish to see its options. Sample options and prices; in the product, each one comes from the product library.</p>');

      /* ---------- The popup: one dialog for every board and finish ---------- */
      var dlg = document.getElementById('mt-dlg');
      if(!dlg){ dlg = document.createElement('dialog'); dlg.id = 'mt-dlg'; dlg.className = 'dlg mt-dlg'; dlg.setAttribute('aria-labelledby', 'mt-dlg-t'); document.body.appendChild(dlg); }
      var cur = null; /* {pk, id, start, tileEl} */
      var B = {};    /* per board: draw(bump) and setNote(text) */
      function dlgHtml(){
        var t = TILES.filter(function(x){ return x.id === cur.id; })[0], pk = cur.pk, sel = optOf(t, pick[pk][t.id]), tt = total(pk);
        var dl = tt.low - cur.start.low, dh = tt.high - cur.start.high;
        return '<div class="dlg-head"><div><p class="label">' + pkName(pk) + ' · ' + t.name + '</p><h2 id="mt-dlg-t">Choose the ' + t.name.toLowerCase() + '</h2></div>' +
            '<button class="icon-btn" type="button" data-close aria-label="Close">' + RI.icon('x') + '</button></div>' +
          '<div class="mt-dlg-body">' +
            '<div class="mt-dlg-tot"><span class="small muted">' + pkName(pk) + ' total</span><span class="range-txt">' + RI.range(tt.low, tt.high) + '</span>' +
              (dl || dh ? '<span class="mt-dlg-delta' + (dh > 0 ? ' up' : ' down') + '">' + sgn(dl) + ' to ' + sgn(dh) + '</span>' : '') + '</div>' +
            '<ul class="mt-cards" role="listbox" aria-label="' + t.name + ' options">' + t.opts.map(function(o){
              var on = o.k === sel.k, own = o.k === t.def[pk];
              return '<li><button type="button" class="mt-card' + (on ? ' on' : '') + '" role="option" aria-selected="' + on + '" data-opt="' + o.k + '">' +
                '<span class="mt-card-sw">' + swatch(o, '', true) + (o.keep || o.lo == null ? '<span class="mt-kept">Kept</span>' : '') + (on ? '<span class="mt-card-ok">' + RI.icon('check','i-sm') + '</span>' : '') + '</span>' +
                '<span class="mt-card-t"><b>' + RI.esc(o.cap) + '</b><span class="mt-card-p">' + priceTxt(o) + '</span>' + (own ? '<em>This goal\'s pick</em>' : '') + '</span></button></li>';
            }).join('') + '</ul>' +
            '<p class="mt-dlg-act"><b>' + RI.esc(sel.cap) + ':</b> ' + RI.esc(sel.act) + '.</p>' +
          '</div>' +
          '<div class="mt-dlg-foot">' + (sel.k !== t.def[pk] ? '<button type="button" class="linkbtn small" data-own>Back to this goal\'s pick</button>' : '<span></span>') +
            '<button type="button" class="btn btn-primary" data-close>Done</button></div>';
      }
      function paint(focusSel){
        dlg.innerHTML = dlgHtml(); if(RI.fillIcons) RI.fillIcons(dlg);
        if(focusSel){ var s = dlg.querySelector('.mt-card.on') || dlg.querySelector('.mt-card'); if(s) s.focus({preventScroll:true}); }
      }
      function openDlg(pk, id, tileEl){
        var t = TILES.filter(function(x){ return x.id === id; })[0]; if(!t || t.measure) return;
        cur = {pk:pk, id:id, start:total(pk), tileEl:tileEl};
        paint(false);
        if(dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
        var s = dlg.querySelector('.mt-card.on'); if(s) s.focus({preventScroll:true});
      }
      function choose(k){
        var t = TILES.filter(function(x){ return x.id === cur.id; })[0], pk = cur.pk, before = total(pk), from = optOf(t, pick[pk][t.id]), to = optOf(t, k);
        if(from.k === to.k) return;
        pick[pk][t.id] = k; B[pk].draw(true);
        var after = total(pk), dl = after.low - before.low, dh = after.high - before.high;
        B[pk].setNote(t.name + ': ' + to.cap + '. ' + to.act + '. Total ' + (dl === 0 && dh === 0 ? 'unchanged' : sgn(dl) + ' to ' + sgn(dh)) + '.');
        paint(true);
        if(RI.track) RI.track('finish_option_chosen', {goal:pk, tile:t.id, option:k});
      }
      dlg.addEventListener('click', function(e){
        if(!cur) return;
        if(e.target === dlg || e.target.closest('[data-close]')){ dlg.close(); return; }
        if(e.target.closest('[data-own]')){ var t = TILES.filter(function(x){ return x.id === cur.id; })[0]; choose(t.def[cur.pk]); return; }
        var o = e.target.closest('[data-opt]'); if(o) choose(o.getAttribute('data-opt'));
      });
      dlg.addEventListener('close', function(){
        if(!cur) return;
        var b = host.querySelector('.board[data-pk="' + cur.pk + '"]'), tl = b && b.querySelector('[data-tile="' + cur.id + '"]');
        cur = null; if(tl) tl.focus({preventScroll:true});
      });

      host.querySelectorAll('.board').forEach(function(b){
        var pk = b.getAttribute('data-pk'), grid = b.querySelector('.board-grid'), note = b.querySelector('.board-note'), lastNote = '';
        var DEF = 'Select a finish to see its options.';
        function draw(bump){
          grid.innerHTML = TILES.map(function(t, i){ return tileHtml(t, pk, i); }).join('');
          var t = total(pk), rl = b.querySelector('.rl'), tot = b.querySelector('.board-total');
          rl.setAttribute('data-low', t.low); rl.setAttribute('data-high', t.high); RI.drawRange(rl); rl.classList.add('drawn');
          tot.innerHTML = RI.range(t.low, t.high);
          if(bump){ tot.classList.remove('bump-l'); void tot.offsetWidth; tot.classList.add('bump-l'); }
          b.querySelector('.board-count').textContent = t.changed + ' changed, ' + t.kept + ' kept';
          b.querySelector('.board-reset').hidden = !t.edited;
          b.classList.toggle('is-edited', t.edited);
        }
        function show(el){ note.textContent = el ? el.getAttribute('data-act') : (lastNote || DEF); }
        B[pk] = {draw:draw, setNote:function(txt){ lastNote = txt; note.textContent = txt; }};
        grid.addEventListener('click', function(e){ var m = e.target.closest('.mt[data-tile]'); if(m) openDlg(pk, m.getAttribute('data-tile'), m); });
        grid.addEventListener('keydown', function(e){ var m = e.target.closest('.mt[data-tile]'); if(m && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); openDlg(pk, m.getAttribute('data-tile'), m); } });
        /* Hover or focus a tile: its work and price in the note line */
        grid.addEventListener('mouseover', function(e){ var m = e.target.closest('.mt[data-act]'); if(m) show(m); });
        grid.addEventListener('mouseleave', function(){ show(null); });
        grid.addEventListener('focusin', function(e){ var m = e.target.closest('.mt[data-act]'); if(m) show(m); });
        b.querySelector('.board-reset').addEventListener('click', function(){
          TILES.forEach(function(t){ if(!t.measure) pick[pk][t.id] = t.def[pk]; });
          lastNote = ''; draw(true); show(null);
        });
        draw(false); show(null);
      });
      RI.initRanges(host);
      if('IntersectionObserver' in window){
        host.classList.add('pre');
        var io = new IntersectionObserver(function(es){ if(es[0].isIntersecting){ host.classList.remove('pre'); io.disconnect(); } }, {rootMargin:'0px 0px -15% 0px'});
        io.observe(host);
      }
    }
  };
})();
