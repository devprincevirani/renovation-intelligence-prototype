/* Floor plan of the sample house: an architect-style drawing whose rooms are tinted by cost.
   Reusable: RI.Plan.mount(host, {onSelect}) returns {update(pk, off, selected)}.
   Tint depth follows the room's High under the chosen package; hatched rooms hold unverified lines. */
(function(){
  var RI = window.RI;
  var U = 10, OX = 50, OY = 58, W = 60, H = 28; /* feet, 10 units per foot */
  /* [roomKey, label, x, y, w, h] in feet from the top-left corner of the house */
  var RECTS = [
    ['bedrooms','Bed 1',0,0,12,13], ['bedrooms','Bed 2',12,0,12,13], ['bedrooms','Bed 3',0,16,12,12],
    ['living','Hall',0,13,24,3], ['living','Living room',24,0,20,17], ['living','Entry',24,17,10,11], ['living','Dining',44,15,16,13], ['living','Linen',19,22,5,6],
    ['hallbath','Bath',12,16,7,12], ['halfbath','Half',19,16,5,6],
    ['kitchen','Kitchen',44,0,16,15], ['basement','Stairs',34,17,10,11]
  ];
  var OFFPLAN = [['basement','Basement','about 300 sq ft, below grade'],['whole','Whole house','Paint, doors, lighting'],['exterior','Exterior','Front door, trim']];

  function X(f){ return OX + f * U; } function Y(f){ return OY + f * U; }
  function roomByKey(k){ return RI.src().rooms.filter(function(r){ return r.key === k; })[0]; }
  function hasHeld(k){ var r = roomByKey(k); return !!r && r.items.some(RI.isHeld); }

  function svg(){
    var s = '<svg class="plan-svg" viewBox="0 0 700 372" role="group" aria-label="Floor plan of the sample house">' +
      '<defs><pattern id="pl-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="#887F72" stroke-width="1.2" stroke-opacity=".45"/></pattern></defs>' +
      /* dimension lines */
      '<g class="pl-dim"><line x1="' + X(0) + '" y1="26" x2="' + X(W) + '" y2="26"/><line x1="' + X(0) + '" y1="19" x2="' + X(0) + '" y2="33"/><line x1="' + X(W) + '" y1="19" x2="' + X(W) + '" y2="33"/>' +
      '<rect x="' + (X(W / 2) - 34) + '" y="16" width="68" height="20" class="pl-dim-bg"/><text x="' + X(W / 2) + '" y="30.5" text-anchor="middle">60 ft</text>' +
      '<line x1="22" y1="' + Y(0) + '" x2="22" y2="' + Y(H) + '"/><line x1="15" y1="' + Y(0) + '" x2="29" y2="' + Y(0) + '"/><line x1="15" y1="' + Y(H) + '" x2="29" y2="' + Y(H) + '"/>' +
      '<rect x="12" y="' + (Y(H / 2) - 30) + '" width="20" height="60" class="pl-dim-bg"/><text x="22" y="' + Y(H / 2) + '" text-anchor="middle" transform="rotate(-90 22 ' + Y(H / 2) + ')" dy="4.5">28 ft</text></g>';
    /* rooms */
    var groups = {};
    RECTS.forEach(function(r){ (groups[r[0]] = groups[r[0]] || []).push(r); });
    Object.keys(groups).forEach(function(k){
      var room = roomByKey(k), held = hasHeld(k);
      if(!room){ groups[k].forEach(function(r){ s += '<rect class="pl-none" x="' + X(r[2]) + '" y="' + Y(r[3]) + '" width="' + r[4] * U + '" height="' + r[5] * U + '"/>'; }); return; }
      s += '<g class="pl-room' + (held ? ' held' : '') + '" data-room="' + k + '" tabindex="0" role="button" aria-label="' + room.name + '">';
      groups[k].forEach(function(r){ s += '<rect class="pl-fill" x="' + X(r[2]) + '" y="' + Y(r[3]) + '" width="' + r[4] * U + '" height="' + r[5] * U + '"/>' + (held ? '<rect class="pl-hatch" x="' + X(r[2]) + '" y="' + Y(r[3]) + '" width="' + r[4] * U + '" height="' + r[5] * U + '" fill="url(#pl-hatch)"/>' : ''); });
      groups[k].forEach(function(r){
        var cx = X(r[2] + r[4] / 2), cy = Y(r[3] + r[5] / 2), small = r[4] < 7 || r[5] < 6;
        s += '<text class="pl-label' + (small ? ' sm' : '') + '" x="' + cx + '" y="' + (cy + 5) + '" text-anchor="middle">' + r[1] + '</text>';
      });
      s += '</g>';
    });
    /* interior walls drawn on top, outer wall last */
    s += '<g class="pl-walls">';
    RECTS.forEach(function(r){ s += '<rect x="' + X(r[2]) + '" y="' + Y(r[3]) + '" width="' + r[4] * U + '" height="' + r[5] * U + '"/>'; });
    s += '</g>';
    /* door swings and openings */
    var doors = [[3,13,'up'],[15,13,'up'],[3,16,'down'],[13,16,'down'],[20,16,'down'],[28,28,'out']];
    s += '<g class="pl-doors">';
    doors.forEach(function(d){
      var x = X(d[0]), y = Y(d[1]), r = 28;
      if(d[2] === 'up') s += '<line x1="' + x + '" y1="' + y + '" x2="' + (x + r) + '" y2="' + y + '" class="gap"/><path d="M' + x + ' ' + y + ' L' + x + ' ' + (y - r) + ' A' + r + ' ' + r + ' 0 0 1 ' + (x + r) + ' ' + y + '"/>';
      else if(d[2] === 'down') s += '<line x1="' + x + '" y1="' + y + '" x2="' + (x + r * .8) + '" y2="' + y + '" class="gap"/><path d="M' + x + ' ' + y + ' L' + x + ' ' + (y + r * .8) + ' A' + r * .8 + ' ' + r * .8 + ' 0 0 0 ' + (x + r * .8) + ' ' + y + '"/>';
      else s += '<line x1="' + x + '" y1="' + y + '" x2="' + (x + 32) + '" y2="' + y + '" class="gap"/><path d="M' + (x + 32) + ' ' + y + ' L' + (x + 32) + ' ' + (y + 30) + ' A30 30 0 0 1 ' + (x + 2) + ' ' + y + '"/>';
    });
    s += '</g>';
    /* windows on the outer wall */
    var win = [[3,0,6,'h'],[15,0,6,'h'],[29,0,10,'h'],[49,0,6,'h'],[3,28,6,'h'],[47,28,8,'h'],[0,4,5,'v'],[0,19,5,'v'],[60,3,6,'v'],[60,18,6,'v']];
    s += '<g class="pl-win">';
    win.forEach(function(w){
      if(w[3] === 'h') s += '<rect x="' + X(w[0]) + '" y="' + (Y(w[1]) - 3) + '" width="' + w[2] * U + '" height="6"/><line x1="' + X(w[0]) + '" y1="' + Y(w[1]) + '" x2="' + X(w[0] + w[2]) + '" y2="' + Y(w[1]) + '"/>';
      else s += '<rect x="' + (X(w[0]) - 3) + '" y="' + Y(w[1]) + '" width="6" height="' + w[2] * U + '"/><line x1="' + X(w[0]) + '" y1="' + Y(w[1]) + '" x2="' + X(w[0]) + '" y2="' + Y(w[1] + w[2]) + '"/>';
    });
    s += '</g><rect class="pl-outer" x="' + X(0) + '" y="' + Y(0) + '" width="' + W * U + '" height="' + H * U + '" pathLength="100"/>';
    s += '<g class="pl-north" transform="translate(672 ' + (Y(H) - 6) + ')"><circle r="11"/><path d="M0 -7 L4 4 L0 1 L-4 4 Z"/><text y="-15" text-anchor="middle">N</text></g>';
    return s + '</svg>';
  }

  RI.Plan = {
    OFFPLAN: OFFPLAN,
    mount:function(host, opts){
      opts = opts || {};
      host.innerHTML = '<div class="plan-draw">' + svg() + '</div>' +
        '<div class="plan-chips">' + OFFPLAN.filter(function(o){ return !!roomByKey(o[0]); }).map(function(o){ return '<button type="button" class="plan-chip" data-room="' + o[0] + '"><span class="sw"></span><span><b>' + o[1] + '</b><small>' + ((roomByKey(o[0]) || {}).sub || o[2]) + '</small></span></button>'; }).join('') + '</div>' +
        '<div class="plan-legend"><span><i class="lg lg-1"></i><i class="lg lg-2"></i><i class="lg lg-3"></i>Less to more work</span><span><i class="lg lg-h"></i>Holds an unverified line</span></div>';
      var drawEl = host.querySelector('.plan-draw');
      function pick(k){ if(opts.onSelect) opts.onSelect(k); }
      host.addEventListener('click', function(e){ var g = e.target.closest('[data-room]'); if(g) pick(g.getAttribute('data-room')); });
      host.addEventListener('keydown', function(e){ if((e.key === 'Enter' || e.key === ' ') && e.target.closest('.pl-room')){ e.preventDefault(); pick(e.target.closest('.pl-room').getAttribute('data-room')); } });
      if('IntersectionObserver' in window){
        drawEl.classList.add('pre');
        var io = new IntersectionObserver(function(es){ if(es[0].isIntersecting){ drawEl.classList.remove('pre'); drawEl.classList.add('in'); io.disconnect(); } }, {rootMargin:'0px 0px -15% 0px'});
        io.observe(drawEl);
      }
      return {
        update:function(pk, off, selected){
          var max = 1;
          /* Scale across the rooms on the plan; whole-house work is spread over every room, so it is left out */
          RI.src().rooms.forEach(function(r){ if(r.key !== 'whole') max = Math.max(max, RI.totals(pk, {}, r.key).high); });
          host.querySelectorAll('[data-room]').forEach(function(el){
            var k = el.getAttribute('data-room'), t = RI.totals(pk, off, k), room = roomByKey(k);
            if(!room) return;
            var a = t.high ? Math.min(.72, .08 + .62 * (t.high / max)) : .03;
            el.style.setProperty('--tint', a.toFixed(3));
            el.classList.toggle('sel', k === selected);
            el.setAttribute('aria-pressed', k === selected);
            el.setAttribute('aria-label', room.name + ', ' + (t.high ? RI.money(t.low) + ' to ' + RI.money(t.high) : 'no cost') + (hasHeld(k) ? ', holds an unverified line' : ''));
            var sw = el.querySelector('.sw'); if(sw) sw.style.opacity = '';
          });
        }
      };
    }
  };
})();
