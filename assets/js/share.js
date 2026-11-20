/* Share view: a read-only presentation opened from a private link (docs/APP_FLOW.md 4.4).
   In this prototype links work in the same browser, because the data lives in localStorage. */
(function(){
  var RI = window.RI, A = RI.App, doc = document, box = doc.getElementById('share');
  var t = RI.form.params().t, h = null;
  A.all().some(function(x){ return (x.shares || []).some(function(s){ if(s.token === t && s.active){ h = x; return true; } }); });
  function cta(){ return '<a class="btn btn-primary" data-cta data-arrow href="' + RI.url('waitlist/') + '">Join the waitlist</a>'; }
  if(!h){
    box.innerHTML = '<div class="empty"><div class="mark bronze">' + RI.icon('lock') + '</div><h1>This link has expired or is not valid</h1><p class="muted">The person who shared it may have turned it off. You can still get an estimate for your own house.</p>' +
      '<div class="cta-row" style="justify-content:center"><a class="btn btn-primary" href="' + RI.url('') + '">Get this for your house</a><a class="textlink" href="' + RI.url('sample/') + '">See a sample estimate</a></div><p class="xsmall muted">Note: share links open in the same browser that created them.</p></div>';
    RI.fillIcons(box); return;
  }
  var est = A.estimate(h); RI.CURRENT = est; RI.track('share_viewed');
  var pk = h.pk || 'S', off = h.off || {}, P = RI.PACKAGES.filter(function(x){ return x.key === pk; })[0], tot = RI.totals(pk, off), held = A.heldCount(est);
  var sh = h.shares.filter(function(s){ return s.token === t; })[0];
  box.innerHTML = '<div class="sv-banner">' + RI.icon('eye','i-sm') + '<span>A read-only estimate shared with you. <b>Prepared for ' + RI.esc(sh.forName || h.client || 'the owner') + '</b> on ' + A.date(h.run.start) + ', shared ' + A.date(sh.created) + '.</span></div>' +
    '<header class="house-head"><div class="hh-media">' + (A.cover(h) ? '<img src="' + A.cover(h) + '" alt="">' : '') + '</div><div class="hh-t"><span class="st st-open">Estimate</span><h1>' + RI.esc(A.addr(h)) + '</h1><p class="muted">' + RI.esc(A.place(h)) + '</p><p class="small">' + RI.esc(h.title || '') + '</p></div></header>' +
    '<section class="price-s"><header class="ps-head"><div><p class="label">The ' + P.name + ' goal</p><h2>' + P.goal + '</h2></div>' + (held.u + held.m ? '<span class="state state-partial">Partial: ' + (held.u + held.m) + ' not priced yet</span>' : '') + '</header>' +
      '<p class="pk-range sv-total">' + RI.range(tot.low, tot.high) + '</p>' +
      '<div class="pk-cards sv-cards" data-scale="0,' + Math.ceil(RI.totals('P', {}).high / 25000) * 25000 + '">' + RI.PACKAGES.map(function(x){ var tt = RI.totals(x.key, off); return '<div class="pk-card' + (x.key === pk ? ' is-default' : '') + '"><h3>' + x.name + '</h3><p class="range-txt">' + RI.range(tt.low, tt.high) + '</p><div class="rl' + (held.u + held.m ? ' partial' : '') + '" data-low="' + tt.low + '" data-high="' + tt.high + '"></div></div>'; }).join('') + '</div></section>' +
    '<h2 class="sv-h">Room by room</h2><div class="sv-rooms">' + est.rooms.map(function(r){
      var t2 = RI.totals(pk, off, r.key);
      return '<details class="trade"><summary><span><b>' + r.name + '</b><span class="xsmall muted">' + r.items.length + ' items</span></span><span></span><span class="range-txt">' + (t2.high ? RI.range(t2.low, t2.high) : '<span class="muted">' + (r.items.some(RI.isHeld) ? 'Not priced yet' : 'No cost') + '</span>') + '</span></summary><ul>' + r.items.map(function(it){
        if(RI.isHeld(it)) return '<li><span><b>' + RI.esc(it.name) + '</b><span class="xsmall muted">' + RI.esc(it.fix) + ' would settle it.</span></span><span class="state ' + (it.state === 'measure' ? 'state-measure' : 'state-unverified') + '">' + (it.state === 'measure' ? 'Needs measurement' : 'Unverified') + '</span></li>';
        var a = it.pk[pk]; if(off[it.id]) return '<li class="is-off"><span><b>' + RI.esc(it.name) + '</b><span class="xsmall muted">Turned off by the owner</span></span><span></span></li>';
        return '<li><span><b>' + RI.esc(it.name) + '</b><span class="xsmall muted">' + RI.esc(a[0]) + (a[3] ? ' · ' + RI.esc(a[3]) : '') + '</span></span><span class="range-txt small">' + (a[1] == null ? 'Keep, no cost' : RI.range(a[1], a[2])) + '</span></li>';
      }).join('') + '</ul></details>';
    }).join('') + '</div>' +
    '<h2 class="sv-h">House systems</h2><div class="mech">' + est.mechanicals.map(RI.mechCard).join('') + '</div>' +
    '<section class="sv-cta"><div><h2>Get this for your house</h2><p class="muted">Enter a house once, with photos and a few facts. The price by package is free.</p></div>' + cta() + '</section>' +
    '<p class="disc-line">' + RI.icon('info','i-sm') + 'An estimate for planning, never a contractor\'s bid. Lines that could not be confirmed are left out of the totals.</p>';
  RI.fillIcons(box); RI.applyCtas(); RI.initRanges(box);
})();
