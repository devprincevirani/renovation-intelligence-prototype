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
    {key:'cabinets', eyebrow:'Cabinets up close', tab:'Cabinets', before:'ba/cab-before.jpg', after:'ba/cab-after.jpg', pos:'50% 50%',
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

  /* Simple mode (home page): one row per part, read in one go: the part, what the chosen goal does with it, its price.
     The room total closes the list, like a receipt (Nov 27: the tiles and the three-goal box were too much at once).
     Rows show full dollars, the same as the total, so the lines add up to it on sight (make-ui, Nov 27). */
  var SHORT = {k1:'Cabinets', k2:'Countertop', k3:'Sink and faucet', k4:'Backsplash', k5:'Kitchen floor', x1:'Front door', x2:'Trim paint', h1:'Tub and surround', h2:'Vanity and top', h3:'Toilet'};
  /* Read at a glance (make-ui, Nov 27): each part says what happens to it in one word with an icon, and its Low and High
     sit on a range line that shares one scale with the other parts, so the costly work shows by length, not by reading.
     The tags grow with the work: Keep is quiet, Replace is solid. The full sentence stays in the title and for screen readers. */
  var VERB = {k1:{E:'Repair', S:'Refinish', P:'Replace'}, k2:{E:'Keep', S:'Replace', P:'Replace'}, k3:{E:'Replace', S:'Replace', P:'Replace'},
              k4:{E:'Keep', S:'Replace', P:'Replace'}, h2:{E:'Repair', S:'Replace', P:'Replace'}, h3:{E:'Repair', S:'Replace', P:'Replace'}};
  var VICON = {Keep:'check', Repair:'tool', Refinish:'refresh', Replace:'hammer', Measure:'ruler', Unverified:'eye', Guidance:'info'};
  function verbOf(id, pk, act){
    if(id && VERB[id] && VERB[id][pk]) return VERB[id][pk];
    var w = String(act || '').toLowerCase();
    if(/^(keep|kept)/.test(w)) return 'Keep';
    if(/^(clean|tighten|adjust|reseal|repair|fix)/.test(w)) return 'Repair';
    if(/^(refinish|reglaze|paint|refresh)/.test(w)) return 'Refinish';
    return 'Replace';
  }
  function chips(c, pk){
    var max = 0;
    c.anns.forEach(function(a){ var it = a.item && item(a.item); if(it && !RI.isHeld(it) && it.pk[pk][2] != null) max = Math.max(max, it.pk[pk][2]); });
    return c.anns.map(function(a){
      var it = a.item && item(a.item), name = SHORT[a.item] || (a.name || it.name).split(',')[0], cls, val, act, verb, p = it && it.pk[pk];
      if(it && RI.isHeld(it)){ cls = 'is-held'; verb = it.state === 'measure' ? 'Measure' : 'Unverified'; val = 'Not in the total'; act = p[0] + '. ' + (it.state === 'measure' ? 'Needs measurement' : 'Unverified') + ', so it is not in the total yet.'; }
      else if(it){ act = p[0] + '.'; verb = verbOf(a.item, pk, p[0]); if(p[1] == null){ cls = 'is-kept'; val = 'No cost'; } else { cls = 'is-priced'; val = RI.range(p[1], p[2]); } }
      else { act = a.text[pk] + '.'; cls = a.guidance ? 'is-guide' : 'is-kept'; verb = a.guidance ? 'Guidance' : verbOf(null, pk, a.text[pk]); val = a.note; }
      var v = cls === 'is-priced' ? '<span class="range-txt">' + val + '</span>' : RI.esc(val);
      return '<li data-n="' + a.n + '" class="cr2 ' + cls + ' v-' + verb.toLowerCase() + '" title="' + RI.esc(act) + '">' +
        '<b class="cr-n">' + RI.esc(name) + '</b><span class="cr-v">' + v + '</span>' +
        '<span class="cr-tag">' + RI.icon(VICON[verb] || 'dot', 'i-sm') + verb + '</span>' +
        (cls === 'is-priced' && max ? '<span class="rl cr-rl" data-scale="0,' + max + '" data-low="' + p[1] + '" data-high="' + p[2] + '"></span>' : '') +
        '<span class="sr">' + RI.esc(act) + '</span></li>';
    }).join('');
  }

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
      /* Room tabs (home page, Nov 2026): one comparison at a time, so the section fits one screen */
      var tabsHost = opts && opts.tabs;
      host.innerHTML = LIST.map(function(c, i){
        var src = RI.img(ba ? c.before : c.img);
        return '<article class="cmp-card" data-card="' + c.key + '"' + (tabsHost ? ' id="cmp-card-' + c.key + '" role="tabpanel" aria-labelledby="cmp-tab-' + c.key + '"' + (i ? ' hidden' : '') : '') + '>' +
          '<figure class="cmp' + (ba ? ' cmp-ba' : '') + '" style="--pos:' + (ba ? 50 : 45) + '%">' +
            '<img class="cmp-img" src="' + src + '" alt="' + (ba ? c.altB : c.alt) + '" loading="lazy" style="object-position:' + c.pos + '">' +
            (ba ? '<div class="cmp-after"><img class="cmp-img" src="' + RI.img(c.after) + '" alt="' + c.altA + '" loading="lazy" style="object-position:' + c.pos + '"></div>'
                : '<div class="cmp-after" aria-hidden="true"><img class="cmp-img" src="' + src + '" alt="" loading="lazy" style="object-position:' + c.pos + '"><div class="cmp-anno">' + overlay(c) + '</div></div>') +
            (ba ? '<span class="cmp-tag cmp-tag-b">Before</span><span class="cmp-tag cmp-tag-a">After</span>' : '<span class="cmp-tag cmp-tag-b">Your photo</span><span class="cmp-tag cmp-tag-a">Your estimate</span>') +
            '<span class="cmp-line" aria-hidden="true"></span>' +
            '<span class="cmp-knob" role="slider" tabindex="0" aria-label="' + (ba ? 'Compare before and after for the ' : 'Compare your photo with your estimate for the ') + c.eyebrow.toLowerCase() + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="45" aria-valuetext="55 percent estimate">' + RI.icon('arrow','i-sm cmp-l') + RI.icon('arrow','i-sm') + '</span>' +
          '</figure>' +
          (simple ? '<div class="cmp-body cmp-simple"><ul class="cmp-list cc-rows"></ul><p class="cmp-total cc-total" aria-live="polite" aria-atomic="true"></p></div></article>'
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
        /* Pin, box and row light up together (full mode only: simple mode has no pins) */
        if(!simple){
          function hl(n){ card.querySelectorAll('[data-n]').forEach(function(el){ el.classList.toggle('on', el.getAttribute('data-n') === n); }); }
          card.addEventListener('mouseover', function(e){ var t = e.target.closest('.cmp-list li'); hl(t ? t.getAttribute('data-n') : null); });
          card.addEventListener('mouseleave', function(){ hl(null); });
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
            if(RI.initRanges) RI.initRanges(card.querySelector('.cmp-list'));
            card.querySelector('.cmp-total').innerHTML = '<span class="cc-tl">Room total<span class="cc-pk">' + name + '</span></span><span class="range-txt cc-big">' + (t.high ? RI.range(t.low, t.high) : 'No cost') + '</span>' + (t.held ? '<span class="state state-partial">Partial</span>' : '');
            return;
          }
          card.querySelector('.cmp-total').innerHTML = '<span class="small muted">This photo, ' + name + '</span><span class="range-txt">' + (t.high ? RI.range(t.low, t.high) : 'No cost') + '</span>' + (t.held ? '<span class="state state-partial">Partial</span>' : '');
        });
      }
      update();
      if(tabsHost){
        tabsHost.innerHTML = '<div class="cmp-rtabs" role="tablist" aria-label="Room">' + LIST.map(function(c, i){
          return '<button type="button" class="cmp-rtab" role="tab" id="cmp-tab-' + c.key + '" aria-controls="cmp-card-' + c.key + '" aria-selected="' + (i === 0) + '" tabindex="' + (i ? -1 : 0) + '"><img src="' + RI.img(ba ? c.before : c.img) + '" alt=""><span>' + (c.tab || c.eyebrow) + '</span></button>';
        }).join('') + '</div>';
        var tl = tabsHost.querySelector('[role="tablist"]'), tabs = [].slice.call(tl.querySelectorAll('[role="tab"]'));
        function show(i, focus){
          tabs.forEach(function(t, j){ t.setAttribute('aria-selected', String(i === j)); t.tabIndex = i === j ? 0 : -1; });
          host.querySelectorAll('.cmp-card').forEach(function(card, j){ card.hidden = i !== j; if(i === j) place(card.querySelector('.cmp'), LIST[j]); });
          if(focus) tabs[i].focus();
        }
        tl.addEventListener('click', function(e){ var t = e.target.closest('[role="tab"]'); if(t) show(tabs.indexOf(t)); });
        tl.addEventListener('keydown', function(e){
          var i = tabs.indexOf(doc.activeElement); if(i < 0) return;
          var n = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i + tabs.length - 1) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
          if(n < 0) return; e.preventDefault(); show(n, true);
        });
      }
      return {update:update};
    }
  };
})();
