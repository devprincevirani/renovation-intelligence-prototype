/* Before and after: "your photo" against "your estimate" on the same photo.
   The after side is the product's honest output (parts found, actions, ranges, unknowns),
   never an invented renovated room. Drag the handle, or use the arrow keys on it. */
(function(){
  var RI = window.RI, doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Annotations are in percent of the full image; boxes [x, y, w, h]; pin [x, y] */
  var CARDS = [
    {key:'kitchen', eyebrow:'Kitchen', title:'A dated kitchen, read part by part', img:'kitchen-dated.jpg', w:1280, h:960, pos:'50% 50%',
     alt:'A dated kitchen with white base cabinets, a tiled countertop, a white tile backsplash and a checkered floor',
     anns:[
      {n:1, item:'k1', box:[8,48,70,26], pin:[11,52]},
      {n:2, item:'k2', box:[8,41,72,6], pin:[73,44]},
      {n:3, item:'k3', box:[27,35,20,7], pin:[37,33]},
      {n:4, item:'k4', box:[18,21,60,15], pin:[21,25]},
      {n:5, item:'k5', box:[0,76,66,24], pin:[8,86]}
     ]},
    {key:'cabinets', eyebrow:'Cabinets up close', title:'One part, three goals', img:'cabinet-run.jpg', w:675, h:900, pos:'50% 80%',
     alt:'A long run of light wood base cabinets with wooden pulls below a row of windows',
     anns:[
      {n:1, item:'k1', box:[2,46,89,43], pin:[45,68]},
      {n:2, item:'k2', box:[2,41,89,5], pin:[78,43.5]},
      {n:3, name:'Pulls, 18 positions', pin:[13,52], text:{E:'Kept, tightened', S:'New satin brass pulls', P:'Come with the new cabinets'}, note:'In the cabinet line'}
     ]},
    {key:'exterior', eyebrow:'Front of the house', title:'Outside: priced, kept and guidance', img:'brick-ranch.jpg', w:1280, h:851, pos:'50% 50%',
     alt:'Single-story brick ranch house with an attached garage and a lawn in front',
     anns:[
      {n:1, item:'x1', box:[48,57,6,14], pin:[51,55]},
      {n:2, item:'x2', box:[0,49,65,5], pin:[8,51.5]},
      {n:3, name:'Brick walls', box:[2,55,19,16], pin:[11,63], text:{E:'Sound, kept',S:'Sound, kept',P:'Sound, kept'}, note:'No cost', kept:true},
      {n:4, name:'Roof', pin:[33,46], text:{E:'What to look for, typical lifespan',S:'What to look for, typical lifespan',P:'What to look for, typical lifespan'}, note:'Guidance only', guidance:true}
     ]}
  ];

  /* Before and after mode (home page): a real before photo and a real after photo of the same room.
     Nothing is drawn on them, because the two photos do not line up. The parts under each card are the sample house's. */
  var BA_CARDS = [
    {key:'kitchen', eyebrow:'Kitchen', before:'ba/kitchen-before.jpg', after:'ba/kitchen-after.jpg', pos:'50% 50%',
     altB:'A 1980 kitchen with wood cabinets, laminate counters and a white range', altA:'The same kitchen after a remodel: flat-panel cabinets, quartz counters and an apron-front sink',
     anns:[{n:1, item:'k1'}, {n:2, item:'k2'}, {n:3, item:'k3'}, {n:4, item:'k4'}, {n:5, item:'k5'}]},
    {key:'cabinets', eyebrow:'Cabinets up close', before:'ba/cab-before.jpg', after:'ba/cab-after.jpg', pos:'50% 50%',
     altB:'Wood cabinets, a white range and a white fridge before the remodel', altA:'The same wall after: flat-panel cabinet columns, a stainless fridge and wall ovens',
     anns:[{n:1, item:'k1'}, {n:2, item:'k2'}, {n:3, name:'Pulls, 18 positions', text:{E:'Kept, tightened', S:'New satin brass pulls', P:'Come with the new cabinets'}, note:'In the cabinet line'}]},
    {key:'bath', eyebrow:'Bathroom', before:'ba/bath-before.jpg', after:'ba/bath-after.jpg', pos:'50% 50%',
     altB:'A bathroom with green wall tile, a wall-hung sink and a speckled floor', altA:'The same bathroom after: painted walls, a vanity cabinet, a new toilet and a tile floor',
     anns:[{n:1, item:'h2'}, {n:2, item:'h3'}, {n:3, item:'h1'}]}
  ];

  function item(id){ var f; RI.SAMPLE.rooms.forEach(function(r){ r.items.forEach(function(i){ if(i.id === id) f = i; }); }); return f; }

  function cardTotal(c, pk){
    var low = 0, high = 0, held = 0, seen = {};
    c.anns.forEach(function(a){
      if(!a.item || seen[a.item]) return; seen[a.item] = 1;
      var it = item(a.item); if(RI.isHeld(it)){ held++; return; }
      var p = it.pk[pk]; if(p[1] != null){ low += p[1]; high += p[2]; }
    });
    return {low:low, high:high, held:held};
  }

  function overlay(c){
    return c.anns.map(function(a){
      var it = a.item && item(a.item), held = it && RI.isHeld(it);
      var cls = held ? ' held' : a.guidance ? ' guide' : a.kept ? ' kept' : '';
      return (a.box ? '<span class="cmp-box' + cls + '" data-n="' + a.n + '" style="left:' + a.box[0] + '%;top:' + a.box[1] + '%;width:' + a.box[2] + '%;height:' + a.box[3] + '%"></span>' : '') +
        '<span class="cmp-pin' + cls + '" data-n="' + a.n + '" style="left:' + a.pin[0] + '%;top:' + a.pin[1] + '%">' + a.n + '</span>';
    }).join('');
  }

  function rows(c, pk){
    return c.anns.map(function(a){
      var it = a.item && item(a.item), name = a.name || it.name, act, amt;
      if(it && RI.isHeld(it)){ act = it.fix + ' would settle it'; amt = '<span class="state ' + (it.state === 'measure' ? 'state-measure' : 'state-unverified') + '">' + (it.state === 'measure' ? 'Needs measurement' : 'Unverified') + '</span>'; }
      else if(it){ var p = it.pk[pk]; act = p[0]; amt = p[1] == null ? '<span class="muted small">No cost</span>' : '<span class="range-txt">' + RI.range(p[1], p[2]) + '</span>'; }
      else { act = a.text[pk]; amt = a.guidance ? '<span class="state state-guidance">' + a.note + '</span>' : '<span class="muted small">' + a.note + '</span>'; }
      return '<li data-n="' + a.n + '"><span class="cmp-n">' + a.n + '</span><span class="cmp-it"><b>' + RI.esc(name) + '</b><span>' + RI.esc(act) + '</span></span><span class="cmp-amt">' + amt + '</span></li>';
    }).join('');
  }

  /* Simple mode (home page): short names, short prices, one status colour each. The full sentence shows on demand. */
  var SHORT = {k1:'Cabinets', k2:'Countertop', k3:'Sink and faucet', k4:'Backsplash', k5:'Kitchen floor', x1:'Front door', x2:'Trim paint', h1:'Tub and surround', h2:'Vanity and top', h3:'Toilet'};
  function k(n){ return n >= 1000 ? '$' + (Math.round(n / 100) / 10).toString().replace(/\.0$/, '') + 'k' : '$' + n; }
  function chips(c, pk){
    return c.anns.map(function(a){
      var it = a.item && item(a.item), name = SHORT[a.item] || (a.name || it.name).split(',')[0], cls, val, act;
      if(it && RI.isHeld(it)){ cls = 'is-held'; val = it.state === 'measure' ? 'Needs measurement' : 'Unverified'; act = it.fix + ' would settle it.'; }
      else if(it){ var p = it.pk[pk]; act = p[0] + '.'; if(p[1] == null){ cls = 'is-kept'; val = 'No cost'; } else { cls = 'is-priced'; val = k(p[1]) + ' to ' + k(p[2]); } }
      else { act = a.text[pk] + '.'; cls = a.guidance ? 'is-guide' : 'is-kept'; val = a.guidance ? 'Guidance only' : a.note; }
      return '<li data-n="' + a.n + '" class="' + cls + '" tabindex="0" data-act="' + RI.esc(name + ': ' + act) + '"><span class="cmp-n">' + a.n + '</span><span class="cc-t"><b>' + RI.esc(name) + '</b><span class="cc-v">' + RI.esc(val) + '</span></span></li>';
    }).join('');
  }
  var HINT = 'Tap a part to see what changes.';

  function place(fig, c){
    /* Fit the annotation layer to the image as drawn with object-fit: cover */
    var W = fig.clientWidth, H = fig.clientHeight, r = c.w / c.h, pos = c.pos.split(' ').map(function(v){ return parseFloat(v) / 100; });
    var w, h, x, y;
    if(W / H > r){ w = W; h = W / r; x = 0; y = (H - h) * pos[1]; } else { h = H; w = H * r; y = 0; x = (W - w) * pos[0]; }
    fig.querySelectorAll('.cmp-anno').forEach(function(l){ l.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px'; });
  }

  RI.Compare = {
    render:function(host, getPk, opts){
      var simple = !!(opts && opts.simple), ba = !!(opts && opts.beforeAfter), LIST = ba ? BA_CARDS : CARDS;
      host.innerHTML = LIST.map(function(c){
        var src = RI.img(ba ? c.before : c.img);
        return '<article class="cmp-card" data-card="' + c.key + '">' +
          '<figure class="cmp' + (ba ? ' cmp-ba' : '') + '" style="--pos:' + (ba ? 50 : 45) + '%">' +
            '<img class="cmp-img" src="' + src + '" alt="' + (ba ? c.altB : c.alt) + '" loading="lazy" style="object-position:' + c.pos + '">' +
            (ba ? '<div class="cmp-after"><img class="cmp-img" src="' + RI.img(c.after) + '" alt="' + c.altA + '" loading="lazy" style="object-position:' + c.pos + '"></div>'
                : '<div class="cmp-after" aria-hidden="true"><img class="cmp-img" src="' + src + '" alt="" loading="lazy" style="object-position:' + c.pos + '"><div class="cmp-anno">' + overlay(c) + '</div></div>') +
            (ba ? '<span class="cmp-tag cmp-tag-b">Before</span><span class="cmp-tag cmp-tag-a">After</span>' : '<span class="cmp-tag cmp-tag-b">Your photo</span><span class="cmp-tag cmp-tag-a">Your estimate</span>') +
            '<span class="cmp-line" aria-hidden="true"></span>' +
            '<span class="cmp-knob" role="slider" tabindex="0" aria-label="' + (ba ? 'Compare before and after for the ' : 'Compare your photo with your estimate for the ') + c.eyebrow.toLowerCase() + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="45" aria-valuetext="55 percent estimate">' + RI.icon('arrow','i-sm cmp-l') + RI.icon('arrow','i-sm') + '</span>' +
          '</figure>' +
          (simple ? '<div class="cmp-body cmp-simple"><div class="cc-head"><p class="label">' + c.eyebrow + '</p><p class="cmp-total"></p></div><ol class="cmp-list cc-list"></ol><p class="cc-detail" aria-live="polite">' + HINT + '</p></div></article>'
            : '<div class="cmp-body"><p class="label">' + c.eyebrow + '</p><h3>' + c.title + '</h3><ol class="cmp-list"></ol>' +
          '<p class="cmp-total"></p></div></article>');
      }).join('');

      host.querySelectorAll('.cmp-card').forEach(function(card, i){
        var c = LIST[i], fig = card.querySelector('.cmp'), knob = card.querySelector('.cmp-knob');
        function set(v, smooth){
          v = Math.max(0, Math.min(100, v));
          fig.classList.toggle('smooth', !!smooth);
          fig.style.setProperty('--pos', v + '%');
          knob.setAttribute('aria-valuenow', Math.round(v));
          knob.setAttribute('aria-valuetext', ba ? (v < 10 ? 'Before' : v > 90 ? 'After' : Math.round(100 - v) + ' percent after') : (v < 10 ? 'Your photo' : v > 90 ? 'Your estimate' : Math.round(100 - v) + ' percent estimate'));
        }
        card._set = set;
        var dragging = false;
        function fromEvent(e){ var r = fig.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 100; }
        fig.addEventListener('pointerdown', function(e){ dragging = true; fig.setPointerCapture(e.pointerId); fig.classList.add('drag'); set(fromEvent(e), true); });
        fig.addEventListener('pointermove', function(e){ if(dragging) set(fromEvent(e), false); });
        function end(){ dragging = false; fig.classList.remove('drag'); }
        fig.addEventListener('pointerup', end); fig.addEventListener('pointercancel', end);
        knob.addEventListener('keydown', function(e){
          var v = parseFloat(knob.getAttribute('aria-valuenow'));
          var step = e.shiftKey ? 25 : 5;
          if(e.key === 'ArrowLeft' || e.key === 'ArrowDown'){ e.preventDefault(); set(v - step, true); }
          if(e.key === 'ArrowRight' || e.key === 'ArrowUp'){ e.preventDefault(); set(v + step, true); }
          if(e.key === 'Home'){ e.preventDefault(); set(0, true); }
          if(e.key === 'End'){ e.preventDefault(); set(100, true); }
        });
        /* Pin, box and row light up together */
        function hl(n){ card.querySelectorAll('[data-n]').forEach(function(el){ el.classList.toggle('on', el.getAttribute('data-n') === n); }); }
        card.addEventListener('mouseover', function(e){ var t = e.target.closest('.cmp-list li'); hl(t ? t.getAttribute('data-n') : null); });
        card.addEventListener('mouseleave', function(){ hl(null); if(simple) detail(null); });
        function detail(li){ var d = card.querySelector('.cc-detail'); if(d) d.textContent = li ? li.getAttribute('data-act') : HINT; }
        if(simple){
          card.addEventListener('mouseover', function(e){ var t = e.target.closest('.cc-list li'); if(t) detail(t); });
          card.addEventListener('focusin', function(e){ var t = e.target.closest('.cc-list li'); if(t){ hl(t.getAttribute('data-n')); detail(t); } });
          card.addEventListener('click', function(e){ var t = e.target.closest('.cc-list li'); if(t){ hl(t.getAttribute('data-n')); detail(t); } });
        }
        place(fig, c);
        if('ResizeObserver' in window) new ResizeObserver(function(){ place(fig, c); }).observe(fig);
      });

      /* One gentle nudge when the gallery first comes into view, to show it can be dragged */
      if(!reduce && 'IntersectionObserver' in window){
        var io = new IntersectionObserver(function(es){
          if(!es[0].isIntersecting) return; io.disconnect();
          host.querySelectorAll('.cmp-card').forEach(function(card, i){
            setTimeout(function(){ card._set(25, true); setTimeout(function(){ card._set(45, true); }, 750); }, 300 + i * 180);
          });
        }, {rootMargin:'0px 0px -25% 0px'});
        io.observe(host);
      }

      function update(){
        var pk = getPk();
        host.querySelectorAll('.cmp-card').forEach(function(card, i){
          var c = LIST[i], t = cardTotal(c, pk), name = RI.PACKAGES.filter(function(p){ return p.key === pk; })[0].name;
          card.querySelector('.cmp-list').innerHTML = simple ? chips(c, pk) : rows(c, pk);
          if(simple){
            card.querySelector('.cmp-total').innerHTML = '<span class="range-txt cc-big">' + (t.high ? RI.range(t.low, t.high) : 'No cost') + '</span><span class="cc-sub">' + name + (t.held ? ' <span class="state state-partial">Partial</span>' : '') + '</span>';
            var d = card.querySelector('.cc-detail'); if(d) d.textContent = HINT;
            return;
          }
          card.querySelector('.cmp-total').innerHTML = '<span class="small muted">This photo, ' + name + '</span><span class="range-txt">' + (t.high ? RI.range(t.low, t.high) : 'No cost') + '</span>' + (t.held ? '<span class="state state-partial">Partial</span>' : '');
        });
      }
      update();
      return {update:update};
    }
  };
})();
