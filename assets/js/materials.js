/* Material boards: the sample kitchen under each package, shown as finish samples.
   Photos are representative finishes from Wikimedia Commons (credits in CREDITS.md).
   In the product each sample is a real item from Sam's product library. Each tile links to a
   sample item, so the action text and the ranges come from the same data as the presentation. */
(function(){
  var RI = window.RI;

  /* Kitchen board: tile name, sample item id, [photo, caption] per package */
  var TILES = [
    {name:'Cabinets', id:'k1', E:['cab-oak','Oak, kept'], S:['cab-painted','Same doors, refinished'], P:['cab-shaker','White shaker, new']},
    {name:'Countertop', id:'k2', E:['ct-laminate','Laminate, kept'], S:['ct-stonelook','Stone-look laminate'], P:['ct-quartz','Quartz']},
    {name:'Backsplash', id:'k4', E:['bs-existing','Existing tile, kept'], S:['bs-white','White ceramic tile'], P:['bs-glazed','Glazed tile']},
    {name:'Faucet', id:'k3', E:['fx-single','Single-handle'], S:['fx-pulldown','Stainless, pull-down'], P:['fx-black','Matte black']},
    {name:'Lighting', id:'k6', E:['lt-old','Fluorescent panel, kept'], S:['lt-flush','Flush mounts'], P:['lt-recessed','Recessed, dimmer']},
    {name:'Floor', id:'k5', measure:true}
  ];

  function item(id){ var it; RI.SAMPLE.rooms.forEach(function(r){ r.items.forEach(function(i){ if(i.id === id) it = i; }); }); return it; }

  RI.Materials = {
    render:function(host){
      host.innerHTML = RI.PACKAGES.map(function(p){
        var t = RI.totals(p.key, {}, 'kitchen'), kept = 0, changed = 0;
        var tiles = TILES.map(function(tile, i){
          if(tile.measure){
            return '<li class="mt mt-measure" style="--i:' + i + '"><span class="mt-sw">' + RI.icon('ruler','i-lg') + '<span>Needs measurement</span></span><span class="mt-cap"><b>' + tile.name + '</b><span>Not in the total</span></span></li>';
          }
          var it = item(tile.id), act = it.pk[p.key], isKeep = act[1] == null || /kept/i.test(tile[p.key][1]);
          if(isKeep) kept++; else changed++;
          return '<li class="mt' + (isKeep ? ' kept' : '') + '" style="--i:' + i + '" tabindex="0" data-act="' + RI.esc(tile.name + ': ' + act[0] + (act[1] != null ? ' (' + RI.money(act[1]) + ' to ' + RI.money(act[2]) + ')' : ', no cost')) + '">' +
            '<span class="mt-sw"><img src="' + RI.img('finishes/' + tile[p.key][0] + '.jpg') + '" alt="' + RI.esc(tile.name + ', ' + tile[p.key][1].toLowerCase()) + '" width="360" height="360" loading="lazy">' + (isKeep ? '<span class="mt-kept">Kept</span>' : '') + '</span>' +
            '<span class="mt-cap"><b>' + tile.name + '</b><span>' + tile[p.key][1] + '</span></span></li>';
        }).join('');
        return '<article class="board' + (p.key === 'S' ? ' is-default' : '') + '" aria-label="' + p.name + ' finishes">' +
          '<header class="board-head"><div><h3>' + p.name + (p.key === 'S' ? ' <span class="default">Default view</span>' : '') + '</h3><p>' + p.goal + '</p></div><span class="board-pin" aria-hidden="true"></span></header>' +
          '<ul class="board-grid">' + tiles + '</ul>' +
          '<footer class="board-foot"><div class="board-range" data-scale="0,40000"><div class="rl partial" data-low="' + t.low + '" data-high="' + t.high + '"></div></div>' +
          '<div class="row"><span class="range-txt">' + RI.range(t.low, t.high) + '</span><span class="small muted">' + changed + ' changed, ' + kept + ' kept</span></div>' +
          '<p class="board-note" aria-live="polite">Select a sample to see the work.</p></footer></article>';
      }).join('');
      host.querySelectorAll('.board').forEach(function(b){
        var note = b.querySelector('.board-note'), def = note.textContent;
        function show(el){ note.textContent = el ? el.getAttribute('data-act') : def; b.querySelectorAll('.mt').forEach(function(m){ m.classList.toggle('on', m === el); }); }
        b.addEventListener('mouseover', function(e){ var m = e.target.closest('.mt[data-act]'); if(m) show(m); });
        b.addEventListener('mouseleave', function(){ show(null); });
        b.addEventListener('focusin', function(e){ var m = e.target.closest('.mt[data-act]'); if(m) show(m); });
        b.addEventListener('click', function(e){ var m = e.target.closest('.mt[data-act]'); if(m) show(m); });
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
