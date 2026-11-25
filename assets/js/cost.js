/* Renovation cost: hub, area pages and house type pages from one template.
   Uses the shared components in costkit.js (drawings, map, rate explorer, typical vs your house).
   Prototype note: in the real build these pages are rendered on the server (docs/SEO_CONVERSION.md section 3). */
(function(){
  var RI = window.RI, doc = document, main = doc.getElementById('main');
  var area = main.getAttribute('data-area'), type = main.getAttribute('data-type');
  var R = RI.url(''), P = RI.form.params();

  function faq(title, list){
    return '<div class="stack" style="gap:8px"><h2 style="margin-bottom:10px">' + title + '</h2><div class="faq">' + list.map(function(q){ return '<details><summary>' + q[0] + '</summary><div class="a"><p>' + q[1] + '</p></div></details>'; }).join('') + '</div></div>';
  }
  function side(where){
    return '<aside class="side-card" aria-label="Get an estimate for your house"><h3>Your house, not an average</h3><p class="small muted">A range for one specific house' + (where ? ' in ' + where : '') + ', from its photos and listing facts.</p>' +
      '<dl><dt>Price by package</dt><dd>Free</dd><dt>Time to enter</dt><dd>About 10 min</dd><dt>Ready in</dt><dd>A few minutes</dd></dl>' +
      '<a class="btn btn-primary btn-block" data-cta href="' + R + 'waitlist/">Join the waitlist</a><p class="small muted">An estimate for planning, not a contractor\'s bid.</p></aside>';
  }
  function crumbs(items){ return '<nav class="crumbs" aria-label="Breadcrumb"><a href="' + R + '">Home</a>' + items.map(function(c){ return '<span aria-hidden="true">/</span>' + (c[1] ? '<a href="' + R + c[1] + '">' + c[0] + '</a>' : '<span>' + c[0] + '</span>'); }).join('') + '</nav>'; }
  /* What a house type usually gets: product photo tiles; a tile opens a popup (what it is, which goals include it) */
  function getsHtml(k, big){
    var t = RI.TYPES[k], list = (RI.TYPE_PRODUCTS[k] || []);
    return '<div class="tg' + (big ? ' tg-big' : '') + '">' + (big ? '' : '<p class="tg-h">What it usually gets</p>') +
      '<ul class="tg-grid">' + list.map(function(id){ var p = RI.PRODUCTS[id];
        return '<li><button type="button" class="tg-tile" data-prod="' + id + '" data-type="' + k + '" aria-haspopup="dialog"><span class="tg-ph"><img src="' + RI.img(p.img) + '" alt="" loading="lazy"></span><span class="tg-n">' + p.name + '</span></button></li>';
      }).join('') + '</ul></div>';
  }
  function prodDialog(id, k){
    var p = RI.PRODUCTS[id], t = RI.TYPES[k], d = doc.getElementById('tg-dlg');
    if(!d){ d = doc.createElement('dialog'); d.id = 'tg-dlg'; d.className = 'dlg tg-dlg'; d.setAttribute('aria-labelledby', 'tg-dlg-t'); doc.body.appendChild(d);
      d.addEventListener('click', function(e){ if(e.target === d || e.target.closest('[data-close]')) d.close(); }); }
    d.innerHTML = '<div class="dlg-head"><div><p class="label">' + t.name + ' · usually gets</p><h2 id="tg-dlg-t">' + p.name + '</h2></div><button class="icon-btn" type="button" data-close aria-label="Close">' + RI.icon('x') + '</button></div>' +
      '<div class="tg-dlg-b"><img class="tg-dlg-img" src="' + RI.img(p.img) + '" alt="' + RI.esc(p.name) + '">' +
        '<div class="tg-dlg-t"><p>' + p.what + '</p><p class="tg-in">Included in</p><ul class="tg-goals">' + RI.PACKAGES.map(function(g){ var on = p.goals.indexOf(g.key) > -1;
          return '<li class="' + (on ? 'on' : 'off') + '">' + (on ? RI.icon('check','i-sm') : RI.icon('x','i-sm')) + '<b>' + g.name + '</b><span>' + g.goal + '</span></li>'; }).join('') + '</ul>' +
          '<div class="tg-dlg-cta"><a class="btn btn-primary" data-cta data-arrow href="' + R + 'waitlist/">Join the waitlist</a><span class="small muted">The price for your house is free, from your photos.</span></div></div></div>' +
      '<p class="xsmall muted tg-dlg-note">Sample product. In the product, each one comes from the product library.</p>';
    RI.applyCtas(); if(d.showModal) d.showModal(); else d.setAttribute('open', '');
  }
  doc.addEventListener('click', function(e){ var b = e.target.closest('.tg-tile'); if(b) prodDialog(b.getAttribute('data-prod'), b.getAttribute('data-type')); });

  function typeCard(k, small){
    var t = RI.TYPES[k];
    return '<article class="type-card' + (small ? ' sm' : '') + '" data-type="' + k + '">' + RI.Drawing.figure(k) +
      '<div class="type-body"><h3><a href="' + R + 'renovation-cost/house-types/' + k + '/">' + t.name + '</a></h3><p>' + t.short + '</p>' +
      (small ? '' : '<dl class="type-facts"><div><dt>Built</dt><dd>' + t.era + '</dd></div><div><dt>Stories</dt><dd>' + t.stories + '</dd></div><div><dt>Typical size</dt><dd>' + t.size + '</dd></div></dl>') +
      getsHtml(k) + '<a class="textlink" href="' + R + 'renovation-cost/house-types/' + k + '/">See everything a ' + t.name.toLowerCase() + ' <span class="nw">gets' + RI.icon('arrow','i-sm') + '</span></a></div></article>';
  }
  function block(title, sub, id){ return '<div class="stack" style="gap:18px;min-width:0"><div class="stack" style="gap:6px"><h2>' + title + '</h2>' + (sub ? '<p class="muted small">' + sub + '</p>' : '') + '</div><div id="' + id + '"></div></div>'; }
  function closing(t){ return '<section style="padding-top:0"><div class="wrap"><hr class="rule" style="margin-bottom:clamp(40px,5vw,64px)"><div class="closing"><div class="stack" style="gap:12px"><h2>' + t + '</h2><p class="lede">The price by package is free.</p></div><div class="cta-row"><a class="textlink" href="' + R + 'sample/">See the sample first</a><a class="btn btn-primary" data-cta data-arrow href="' + R + 'waitlist/">Join the waitlist</a></div></div></div></section>'; }

  /* ---------- Hub ---------- */
  if(main.hasAttribute('data-hub')){
    /* Finder */
    var fType = doc.getElementById('f-type'), fArea = doc.getElementById('f-area'), hint = doc.getElementById('finder-hint');
    Object.keys(RI.TYPES).forEach(function(k){ fType.insertAdjacentHTML('beforeend', '<option value="' + k + '">' + RI.TYPES[k].name.toLowerCase() + '</option>'); });
    Object.keys(RI.AREAS).forEach(function(k){ fArea.insertAdjacentHTML('beforeend', '<option value="' + k + '">' + RI.AREAS[k].name + '</option>'); });
    function hintText(){
      var t = fType.value, a = fArea.value;
      if(t && a) hint.textContent = RI.AREAS[a].types.indexOf(t) > -1 ? RI.TYPES[t].name + 's are common in ' + RI.AREAS[a].name + '.' : RI.TYPES[t].name + 's are less common in ' + RI.AREAS[a].name + ', but the costs still apply.';
      else if(a) hint.textContent = 'Opens the ' + RI.AREAS[a].name + ' page.';
      else if(t) hint.textContent = 'Opens the ' + RI.TYPES[t].name.toLowerCase() + ' page.';
      else hint.textContent = 'Pick one or both.';
      if(a){ RI.CostMap.mark(doc.getElementById('map'), a); info(a); }
    }
    fType.addEventListener('change', hintText); fArea.addEventListener('change', hintText);
    doc.getElementById('finder').addEventListener('submit', function(e){
      e.preventDefault();
      var t = fType.value, a = fArea.value;
      if(!t && !a){ hint.textContent = 'Choose a house type, an area, or both.'; fType.focus(); return; }
      location.href = a ? R + 'renovation-cost/' + a + '/' + (t ? '?type=' + t : '') : R + 'renovation-cost/house-types/' + t + '/';
    });
    /* Map with an info panel */
    var mapHost = doc.getElementById('map'), infoEl = doc.getElementById('map-info');
    function info(k){
      var a = RI.AREAS[k];
      infoEl.innerHTML = '<div class="mi-h"><b>' + a.name + '</b><span>' + a.county + '</span></div><p>' + a.blurb + '</p><p class="mi-types">' + a.types.map(function(t){ return '<span>' + RI.TYPES[t].name + '</span>'; }).join('') + '</p><a class="textlink" href="' + k + '/">See costs in ' + a.name + ' ' + RI.icon('arrow','i-sm') + '</a>';
      RI.CostMap.mark(mapHost, k);
    }
    RI.CostMap.render(mapHost, info);
    info('livonia');

    doc.getElementById('hub-areas').innerHTML = Object.keys(RI.AREAS).map(function(k){
      var a = RI.AREAS[k];
      return '<a class="area-row" href="' + k + '/"><img src="' + RI.img(a.img) + '" alt="" loading="lazy" width="96" height="72"><div><h3>' + a.name + '</h3><span class="county">' + a.county + '</span></div><p>' + a.blurb + '</p><span class="go">See costs' + RI.icon('arrow','i-sm') + '</span></a>';
    }).join('');
    doc.getElementById('hub-types').innerHTML = Object.keys(RI.TYPES).map(function(k){ return typeCard(k); }).join('');
    RI.Drawing.bind(doc.getElementById('hub-types'));
    RI.RateExplorer.render(doc.getElementById('hub-rates'), {id:'hub'});
    RI.TypicalVsYours.render(doc.getElementById('hub-tvy'));
  }

  /* ---------- Area page ---------- */
  if(area){
    var a = RI.AREAS[area], want = P.type && RI.TYPES[P.type] ? P.type : null;
    var typesShown = want && a.types.indexOf(want) < 0 ? [want].concat(a.types.slice(0, 2)) : a.types;
    var nearby = Object.keys(RI.AREAS).filter(function(k){ return k !== area; }).map(function(k){ return '<a href="' + R + 'renovation-cost/' + k + '/">' + RI.AREAS[k].name + '</a>'; }).join('') + '<a href="' + R + 'renovation-cost/">All areas</a>';
    main.innerHTML =
      '<div class="page-head" style="border-bottom:0;padding-bottom:24px"><div class="wrap">' + crumbs([['Renovation cost','renovation-cost/'],[a.name + ', MI']]) +
      '<h1>Renovation cost in ' + a.name + ', MI</h1><p class="lede">What ' + a.name + ' houses most often need, and how to get a Low and a High for yours, free.</p><p class="small muted">' + a.county + ', Michigan <span class="state state-sample">Sample page content</span></p>' +
      (want ? '<p class="notice notice-info" style="display:flex;max-width:44rem">' + RI.icon('info') + '<span>Showing ' + a.name + ' for a <b>' + RI.TYPES[want].name.toLowerCase() + '</b>. Its drawing and typical work are highlighted below.</span></p>' : '') + '</div></div>' +
      '<div class="wrap area-hero"><div class="ph"><img src="' + RI.img(a.img) + '" alt="' + a.alt + '" width="' + a.w + '" height="' + a.h + '" fetchpriority="high"></div><p class="credit">' + a.cap + '</p></div>' +
      '<section style="padding-top:clamp(40px,5vw,64px)"><div class="wrap area-grid"><div class="stack" style="gap:56px;min-width:0">' +
        '<div class="prose"><h2>Houses in ' + a.name + '</h2>' + a.intro.map(function(p){ return '<p>' + p + '</p>'; }).join('') + '</div>' +
        '<div class="stack" style="gap:18px"><h2>House types common in ' + a.name + '</h2><div class="type-grid sm" id="ar-types">' + typesShown.map(function(k){ return typeCard(k, true); }).join('') + '</div></div>' +
        block('What your estimate prices', 'Every job below is priced for your house, from your photos. Not an area average.', 'ar-rates') +
        block('A typical range is wide. Yours is not.', '', 'ar-tvy') +
        faq('Questions about ' + a.name, [
          ['What does it cost to renovate a ranch in ' + a.name + '?','It depends on what the house needs and how far you go, so we do not give an area average. Your house gets its own Low and High from its own photos, free, with the unknowns listed apart.'],
          ['Why is the range wide on some lines?','A range widens when we know less about a line, for example a size taken from a typical room instead of your measurement. Adding the room size narrows it.'],
          ['Do you cover the roof and furnace?','As guidance only: what to look for, a typical lifespan, and a reminder to have it inspected. They are never part of the price.']]) +
        '<div class="stack" style="gap:12px"><h2 style="font-size:1.3rem">Other areas</h2><nav class="chips" aria-label="Other areas">' + nearby + '</nav></div>' +
      '</div>' + side(a.name) + '</div></section>' + closing('Get a range for one specific house in ' + a.name + '.');
    if(want){ var c = main.querySelector('.type-card[data-type="' + want + '"]'); if(c) c.classList.add('picked'); }
    RI.Drawing.bind(doc.getElementById('ar-types'));
    RI.RateExplorer.render(doc.getElementById('ar-rates'), {id:'area', where:a.name});
    RI.TypicalVsYours.render(doc.getElementById('ar-tvy'), {where:a.name});
  }

  /* ---------- House type page ---------- */
  if(type){
    var t = RI.TYPES[type];
    var others = Object.keys(RI.TYPES).filter(function(k){ return k !== type; }).map(function(k){ return '<a href="' + R + 'renovation-cost/house-types/' + k + '/">' + RI.TYPES[k].name + '</a>'; }).join('');
    var areas = Object.keys(RI.AREAS).filter(function(k){ return RI.AREAS[k].types.indexOf(type) > -1; }).map(function(k){ return '<a href="' + R + 'renovation-cost/' + k + '/?type=' + type + '">' + RI.AREAS[k].name + '</a>'; }).join('');
    main.innerHTML =
      '<div class="page-head" style="border-bottom:0;padding-bottom:24px"><div class="wrap">' + crumbs([['Renovation cost','renovation-cost/'],['House types','renovation-cost/#types'],[t.name]]) +
      '<h1>Cost to renovate a ' + t.name.toLowerCase() + '</h1><p class="lede">' + t.short + ' What these houses usually need, and the products they usually get.</p><p><span class="state state-sample">Sample page content</span></p></div></div>' +
      '<div class="wrap"><div class="type-hero">' + RI.Drawing.figure(type, {big:true}) +
        '<dl class="ht-facts"><div><dt>Built</dt><dd>' + t.era + '</dd></div><div><dt>Stories</dt><dd>' + t.stories + '</dd></div><div><dt>Basement</dt><dd>' + t.basement + '</dd></div><div><dt>Typical size</dt><dd>' + t.size + '</dd></div></dl></div></div>' +
      '<section style="padding-top:clamp(40px,5vw,64px)"><div class="wrap area-grid"><div class="stack" style="gap:56px;min-width:0">' +
        '<div class="prose"><h2>About the ' + t.name.toLowerCase() + '</h2>' + t.intro.map(function(p){ return '<p>' + p + '</p>'; }).join('') +
        '<figure class="type-photo"><img src="' + RI.img(t.img) + '" alt="' + t.alt + '" loading="lazy"><figcaption class="credit">A ' + t.name.toLowerCase() + '.</figcaption></figure></div>' +
        '<div class="stack" style="gap:18px;min-width:0"><div class="stack" style="gap:6px"><h2>What a ' + t.name.toLowerCase() + ' usually gets</h2><p class="muted small">Real products for the work these houses most often need. Tap one to see which goals include it.</p></div>' + getsHtml(type, true) + '</div>' +
        block('What your estimate prices', 'The work a ' + t.name.toLowerCase() + ' most often needs. Each job is priced for your house, from your photos.', 'ty-rates') +
        block('A typical range is wide. Yours is not.', '', 'ty-tvy') +
        faq('Questions about the ' + t.name.toLowerCase(), t.faq) +
        '<div class="stack" style="gap:12px"><h2 style="font-size:1.3rem">Where these houses are common</h2><nav class="chips" aria-label="Areas">' + areas + '</nav></div>' +
        '<div class="stack" style="gap:12px"><h2 style="font-size:1.3rem">Other house types</h2><nav class="chips" aria-label="Other house types">' + others + '</nav></div>' +
      '</div>' + side('') + '</div></section>' + closing('Get a range for your ' + t.name.toLowerCase() + '.');
    RI.Drawing.bind(main);
    RI.RateExplorer.render(doc.getElementById('ty-rates'), {id:'type', only:t.work});
    RI.TypicalVsYours.render(doc.getElementById('ty-tvy'), {type:type});
  }

  RI.fillIcons(main); RI.applyCtas(); RI.initRanges(main); RI.initFaq(main);
})();
