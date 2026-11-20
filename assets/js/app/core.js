/* Renovation Intelligence app: core.
   Houses in localStorage, demo seeds, a per-house estimate, the simulated run, the router and the shell.
   Nothing here talks to a server. In the real build the API does all of this (docs/ARCHITECTURE.md). */
(function(){
  var RI = window.RI, doc = document;
  var A = RI.App = {};
  A.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Storage ---------- */
  A.uid = function(p){ return (p || 'h') + Math.random().toString(36).slice(2, 9); };
  A.all = function(){ return RI.store.get('houses', []); };
  A.saveAll = function(list){
    try{ localStorage.setItem('ri.houses', JSON.stringify(list)); return true; }
    catch(e){ RI.toast('This browser is out of space for demo photos. Remove a few photos, or reset the demo data.', 'warn'); return false; }
  };
  A.me = function(){ return RI.session(); };
  A.isPro = function(){ var s = A.me(); return !!s && (s.role === 'builder' || s.type === 'Builder' || s.type === 'builder' || s.type === 'agent' || s.type === 'Agent'); };
  A.mine = function(){ var s = A.me(); return s ? A.all().filter(function(h){ return h.owner === s.email; }) : []; };
  A.get = function(id){ return A.mine().filter(function(h){ return h.id === id; })[0] || null; };
  A.put = function(h){
    var list = A.all(), i = list.findIndex(function(x){ return x.id === h.id; });
    h.updated = Date.now();
    if(i > -1) list[i] = h; else list.unshift(h);
    return A.saveAll(list);
  };
  A.remove = function(id){ A.saveAll(A.all().filter(function(h){ return h.id !== id; })); };

  /* ---------- Rooms the intake asks for, from the house facts (room templates) ---------- */
  A.ROOM_HINTS = {
    kitchen:'Cabinets, counters, sink, backsplash, floor, ceiling light',
    living:'Floors, walls, windows, doors, light fixtures',
    bedrooms:'Floor, closet doors, walls. One photo is enough',
    hallbath:'Tub or shower and its walls, vanity, toilet, floor',
    halfbath:'Vanity, faucet, toilet, floor',
    basement:'Walls, floor, ceiling, stairs. Turn the lights on',
    exterior:'Front, back and both sides, front door, trim',
    other:'Anything else you want us to see, like a porch or a laundry room'
  };
  /* Hints for rooms added from Sam's room types (guide p24) */
  A.TYPE_HINTS = {inside:'Floor, walls, doors, windows and light fixtures', bath:'Tub or shower, vanity, toilet, floor', basement:'Walls, floor, ceiling, stairs. Turn the lights on', attic:'Floor, roof deck and insulation you can see', mechanical:'Furnace, water heater and panel. Guidance only, never priced', outside:'The whole side, including trim, windows and doors', roof:'Shingles and gutters, from the ground is fine. Guidance only', garage:'Door, floor and walls', yard:'The yard from a corner'};
  A.hintFor = function(type){ if(A.ROOM_HINTS[type]) return A.ROOM_HINTS[type]; if(/bath/.test(type)) return A.TYPE_HINTS.bath; if(/^ext-|deck|patio|porch|driveway|pool|accessory/.test(type)) return A.TYPE_HINTS.outside; return A.TYPE_HINTS[type] || A.TYPE_HINTS.inside; };
  A.roomsFor = function(h){
    /* One place for photos per bedroom and per bath. The first keeps the group key, so older drafts still fit */
    var f = h.facts || {}, r = [['kitchen','Kitchen'],['living','Living room and halls']];
    function each(key, name, n){ for(var i = 1; i <= n; i++) r.push([i === 1 ? key : key + '-' + i, name + (n > 1 ? ' ' + i : ''), key]); }
    each('bedrooms', 'Bedroom', f.beds != null ? +f.beds : 3); each('hallbath', 'Full bath', Math.max(1, +f.baths || 1)); each('halfbath', 'Half bath', +f.halfBaths || 0);
    if(f.basement && f.basement !== 'none') r.push(['basement','Basement']);
    r.push(['exterior','Exterior']);
    (h.extraRooms || []).forEach(function(x){ r.push([x.key, x.name, x.type, true]); });
    r.push(['other','Other rooms']);
    return r;
  };
  /* Photos for a group: the bedrooms are bedrooms, bedrooms-2, bedrooms-3... */
  A.groupCount = function(h, key){ return Object.keys(h.photos || {}).reduce(function(n, k){ return n + (k === key || k.indexOf(key + '-') === 0 ? A.photoCount(h, k) : 0); }, 0); };
  A.photoCount = function(h, key){
    var p = h.photos || {};
    if(key) return (p[key] || []).filter(function(x){ return x.state === 'done'; }).length;
    return Object.keys(p).reduce(function(n, k){ return n + (k === 'unsorted' ? 0 : p[k].filter(function(x){ return x.state === 'done'; }).length); }, 0);
  };

  /* ---------- A per-house estimate, built from the sample rules and this house's own evidence ---------- */
  A.estimate = function(h){
    var base = JSON.parse(JSON.stringify(RI.SAMPLE));
    if(h.exact) return base;                                  /* the sample house itself */
    var f = h.facts || {}, sq = +f.sqft || 1400;
    var k = Math.max(.55, Math.min(1.7, sq / 1686));
    var round = function(n){ return Math.round(n * k / 10) * 10; };
    var hasRoom = {basement:f.basement === 'finished' || f.basement === 'partly', halfbath:+f.halfBaths > 0};
    base.rooms = base.rooms.filter(function(r){ return hasRoom[r.key] !== false; });
    base.rooms.forEach(function(r){
      var photos = r.key === 'whole' ? 99 : A.groupCount(h, r.key);
      r.sub = r.key === 'whole' ? 'Paint, doors and lighting' : photos + ' photo' + (photos === 1 ? '' : 's');
      r.items.forEach(function(it){
        ['E','S','P'].forEach(function(p){ var a = it.pk[p]; if(a && a[1] != null){ a[1] = round(a[1]); a[2] = round(a[2]); } });
        it.state = null;
        if(photos === 0){ it.state = 'unverified'; it.fix = 'Photos of the ' + r.name.toLowerCase(); it.ev = 'unknown'; return; }
        if(it.id === 'k5'){ var s = (h.sizes || {}).kitchen; if(!(s && +s.l && +s.w)){ it.state = 'measure'; it.ev = 'unknown'; } else { it.ev = 'reported'; it.qty = Math.round(s.l * s.w) + ' sq ft from your sizes'; } }
        if(it.id === 'h1' && photos < 2){ it.state = 'unverified'; it.ev = 'unknown'; }
        if(it.id === 's2' && photos < 2){ it.state = 'unverified'; it.ev = 'unknown'; }
        if(it.id === 'b1'){ var b = (h.sizes || {}).bedrooms; it.qty = b && +b.l && +b.w ? Math.round(b.l * b.w * (+f.beds || 3)) + ' sq ft from your sizes' : 'About ' + Math.round(140 * (+f.beds || 3)) + ' sq ft, room template'; it.ev = b && +b.l ? 'reported' : 'inferred'; }
      });
      r.items.forEach(function(it){ if(it.state === 'unverified' && (it.id === 'h1' || it.id === 's2') && photos > 0) it.fix = it.id === 'h1' ? 'A photo of the tub and its walls' : 'A brighter photo of the basement walls'; });
    });
    base.title = h.title; base.facts = []; base.mechanicals = RI.SAMPLE.mechanicals;
    return base;
  };
  A.heldCount = function(est){ var u = 0, m = 0; est.rooms.forEach(function(r){ r.items.forEach(function(it){ if(it.state === 'unverified') u++; if(it.state === 'measure') m++; }); }); return {u:u, m:m}; };
  A.totals = function(h, pk, off){ RI.CURRENT = A.estimate(h); var t = RI.totals(pk, off || {}); return t; };

  /* ---------- The simulated run: a timeline from the moment of submit ---------- */
  A.STAGES = [
    ['queued','We have your house','In line for reading', 2500],
    ['reading','Reading your photos','Rooms, parts, materials and condition, each with how sure we are', 0],
    ['measure','Measuring','Your sizes first, then patterns in the photos, then room templates', 2600],
    ['evaluate','Evaluating condition','Condition and how dated, against the threshold for each part', 2200],
    ['decide','Deciding the work','One action per part, under Essential, Standard and Premium', 2600],
    ['count','Counting the work','Tasks and net quantities, one trade for each task', 2000],
    ['price','Pricing and checking','Local rates and products, then the seven checks on every line', 2800]
  ];
  A.readMs = function(h){ return Math.max(6000, Math.min(13000, A.photoCount(h) * 320)); };
  A.runState = function(h){
    if(!h.run) return {status:h.status || 'draft'};
    var t = Date.now() - h.run.start, acc = 0, n = A.photoCount(h);
    for(var i = 0; i < A.STAGES.length; i++){
      var d = A.STAGES[i][0] === 'reading' ? A.readMs(h) : A.STAGES[i][3];
      if(A.STAGES[i][0] === 'price' && h.run.slow) d += 9000;
      if(t < acc + d){
        var into = t - acc;
        return {status:i === 0 ? 'queued' : i === 1 ? 'reading' : 'planning', stage:i, stageProgress:into / d, read:i === 1 ? Math.min(n, Math.floor(into / d * n)) : (i > 1 ? n : 0), photos:n, slow:h.run.slow && i === 6 && into > 4500};
      }
      acc += d;
    }
    return {status:'ready', stage:A.STAGES.length, photos:n, read:n};
  };
  A.status = function(h){ if(h.status === 'draft') return 'draft'; var s = A.runState(h).status; return s === 'ready' && (h.paid || h.trialOpen) ? 'open' : s; };
  A.STATUS = {draft:['Draft','st-draft'], queued:['In line','st-work'], reading:['Reading photos','st-work'], planning:['Working out the plan','st-work'], ready:['Price ready','st-ready'], open:['Presentation open','st-open']};
  A.next = function(h){
    var s = A.status(h);
    if(s === 'draft') return ['Continue', '#/houses/' + h.id + '/intake/' + (h.step || 'house')];
    if(s === 'ready') return ['View price', '#/houses/' + h.id];
    if(s === 'open') return ['Open presentation', '#/houses/' + h.id + '/presentation'];
    return ['View progress', '#/houses/' + h.id];
  };

  /* ---------- Demo seeds ---------- */
  function ph(srcs){ return srcs.map(function(s, i){ return {id:A.uid('p'), name:s.replace(/\..*/, '') + '-' + (i + 1) + '.jpg', src:RI.img(s), state:'done'}; }); }
  function rep(src, n){ var a = []; for(var i = 0; i < n; i++) a.push(src[i % src.length]); return a; }
  var K = ['kitchen-dated.jpg','kitchen-dated-wide.jpg','cabinet-run.jpg'], FL = ['wood-floor.jpg','finishes/ct-quartz.jpg'];
  function photosFull(ext){ return {kitchen:ph(rep(K, 6)), living:ph(rep(FL, 4)), bedrooms:ph(rep(['wood-floor.jpg'], 3)), hallbath:ph(rep(['finishes/bs-white.jpg','finishes/fx-black.jpg'], 3)), halfbath:ph(['finishes/fx-single.jpg']), basement:ph(rep(['finishes/lt-old.jpg'], 2)), exterior:ph(rep([ext], 4))}; }
  function house(o){
    var now = Date.now(), h = Object.assign({id:A.uid(), created:now - (o.ago || 0), updated:now - (o.ago || 0), status:'submitted', step:'review', rights:true, sizes:{}, pk:'S', off:{}, shares:[], version:1}, o);
    h.facts.stories = h.facts.stories || (h.type === 'brick-ranch' ? 1 : 2); h.facts.propertyType = 'single-family'; h.addr.state = h.addr.state || 'MI';
    delete h.facts.type; h.title = A.titleFor(h);
    /* Spread the seed photos over each bedroom and bath, as a person would add them */
    [['bedrooms', h.facts.beds], ['hallbath', h.facts.baths], ['halfbath', h.facts.halfBaths]].forEach(function(g){
      var list = (h.photos || {})[g[0]], n = +g[1] || 0; if(!list || n < 2) return;
      var buckets = []; for(var i = 0; i < n; i++) buckets.push([]);
      list.forEach(function(p, i){ buckets[i % n].push(p); });
      buckets.forEach(function(b, i){ if(b.length) h.photos[i ? g[0] + '-' + (i + 1) : g[0]] = b; else if(i) delete h.photos[g[0] + '-' + (i + 1)]; });
    });   /* titles come from the facts, as for a house entered by hand */
    /* Consents as the intake records them (SECURITY 6.3): photo rights at upload, the estimate disclaimer at submit */
    var W = 'Draft 1, November 2026', start = h.run && h.run.start;
    h.consents = h.consents || {rights:{at:start ? Math.min(h.created + 90000, start - 60000) : h.created + 90000, version:W}};
    if(h.status !== 'draft' && start && !h.consents.estimate) h.consents.estimate = {at:start - 30000, version:W};
    return h;
  }
  A.seed = function(){
    var s = A.me(); if(!s || !s.demo) return;
    var key = 'seeded.' + s.email; if(RI.store.get(key)) return;
    var day = 86400000, list = A.all().filter(function(h){ return h.owner !== s.email; }), mk = [];
    if(s.role === 'builder'){
      mk = [
        house({owner:s.email, client:'Maria Alvarez', title:'Brick ranch, 1958', addr:{street:'21430 Hoover Rd', city:'Warren', zip:'48089'}, cover:'brick-ranch.jpg', type:'brick-ranch', facts:{type:'brick-ranch', year:1958, sqft:1120, beds:3, baths:1, halfBaths:0, basement:'finished', basementSqft:400}, photos:photosFull('brick-ranch.jpg'), run:{start:Date.now() - 3 * day}, ago:3 * day}),
        house({owner:s.email, client:'D. and K. Turner', title:'Colonial, 1964', addr:{street:'15520 Fairfield St', city:'Livonia', zip:'48154'}, cover:'colonial-brick.jpg', type:'colonial', facts:{type:'colonial', year:1964, sqft:1950, beds:4, baths:2, halfBaths:1, basement:'finished', basementSqft:600}, photos:photosFull('colonial-brick.jpg'), sizes:{kitchen:{l:13, w:11}}, run:{start:Date.now() - 9 * day}, paid:true, paidAt:Date.now() - 8 * day, ago:9 * day}),
        house({owner:s.email, client:'Sam Patel', title:'Tri-level, 1972', addr:{street:'38710 Cass Ave', city:'Clinton Township', zip:'48036'}, cover:'split-level.jpg', type:'tri-level', facts:{type:'tri-level', year:1972, sqft:1640, beds:3, baths:1, halfBaths:1, basement:'finished', basementSqft:450}, photos:photosFull('split-level.jpg'), run:{start:Date.now() - 4000}, ago:3600000}),
        house({owner:s.email, client:'The Nguyen family', title:'Bungalow, 1938', addr:{street:'7114 Steadman St', city:'Dearborn', zip:'48126'}, cover:'livonia-street.jpg', type:'bungalow', status:'draft', step:'photos', facts:{type:'bungalow', year:1938, sqft:1050, beds:2, baths:1, halfBaths:0, basement:'unfinished'}, photos:{kitchen:ph(rep(K, 2))}, ago:2 * day}),
        house({owner:s.email, client:'Rob Kowalski', title:'Colonial, 1989', addr:{street:'4227 Hampton Dr', city:'Sterling Heights', zip:'48310'}, cover:'colonial.jpg', type:'colonial', facts:{type:'colonial', year:1989, sqft:2300, beds:4, baths:2, halfBaths:1, basement:'finished', basementSqft:700}, photos:photosFull('colonial.jpg'), run:{start:Date.now() - 5 * day}, ago:5 * day}),
        house({owner:s.email, client:'Lena Brooks', title:'Ranch, 1956', addr:{street:'29115 Five Mile Rd', city:'Livonia', zip:'48154'}, cover:'livonia-pines.jpg', type:'brick-ranch', facts:{type:'brick-ranch', year:1956, sqft:1240, beds:3, baths:1, halfBaths:0, basement:'unfinished'}, photos:photosFull('livonia-pines.jpg'), run:{start:Date.now() + 1500}, ago:600000})
      ];
    } else {
      mk = [
        house({owner:s.email, exact:true, title:'Brick ranch, built 1986', addr:{street:'18450 Maple Ridge Dr', city:'Clinton Township', zip:'48038'}, cover:'brick-ranch.jpg', type:'brick-ranch', facts:{type:'brick-ranch', year:1986, sqft:1686, beds:3, baths:1, halfBaths:1, basement:'finished', basementSqft:300}, photos:photosFull('brick-ranch.jpg'), run:{start:Date.now() - 6 * day}, paid:true, paidAt:Date.now() - 5 * day, ago:6 * day}),
        house({owner:s.email, title:'Colonial, built 1978', addr:{street:'40322 Clinton Ct', city:'Sterling Heights', zip:'48313'}, cover:'colonial.jpg', type:'colonial', facts:{type:'colonial', year:1978, sqft:2140, beds:4, baths:2, halfBaths:1, basement:'finished', basementSqft:650}, photos:(function(p){ delete p.basement; return p; })(photosFull('colonial.jpg')), sizes:{kitchen:{l:12, w:14}}, run:{start:Date.now() - 2 * day}, ago:2 * day}),
        house({owner:s.email, title:'Bungalow, built 1941', addr:{street:'6820 Kendal St', city:'Dearborn', zip:'48126'}, cover:'livonia-street.jpg', type:'bungalow', status:'draft', step:'photos', facts:{type:'bungalow', year:1941, sqft:1180, beds:3, baths:1, halfBaths:0, basement:'unfinished'}, photos:{kitchen:ph(rep(K, 3)), exterior:ph(['livonia-street.jpg'])}, ago:day / 3})
      ];
    }
    A.saveAll(mk.concat(list)); RI.store.set(key, true);
  };
  /* A plain title from the documented facts: stories and year (no house type is asked at intake) */
  A.titleFor = function(h){
    var f = h.facts || {}, n = +f.stories || 1, word = ['One','Two','Three','Four'][n - 1] || n;
    return word + '-story house' + (f.year ? ', built ' + f.year : '');
  };
  /* A generic line drawing for houses without a photo, chosen only by the number of stories */
  A.illus = function(h){ return h.type && RI.TYPES[h.type] ? h.type : ((h.facts || {}).stories > 1 ? 'colonial' : 'brick-ranch'); };
  A.addr = function(h){ return h.addr && h.addr.street ? h.addr.street : 'New house'; };
  A.place = function(h){ return h.addr && h.addr.city ? h.addr.city + ', MI ' + (h.addr.zip || '') : 'Address not entered yet'; };
  A.cover = function(h){
    if(h.cover) return RI.img(h.cover);
    var p = h.photos || {}; var first = (p.exterior || [])[0] || (p.kitchen || [])[0];
    return first ? first.src : null;
  };
  A.factsLine = function(h){
    var f = h.facts || {}, parts = [];
    if(f.year) parts.push('Built ' + f.year); if(f.sqft) parts.push((+f.sqft).toLocaleString('en-US') + ' sq ft');
    if(f.stories > 1) parts.push(f.stories + ' stories');
    if(f.beds) parts.push(f.beds + ' bed'); if(f.baths) parts.push(f.baths + (+f.halfBaths ? '.5' : '') + ' bath');
    return parts.join(' · ');
  };
  A.ago = function(t){
    var s = (Date.now() - t) / 1000;
    if(s < 60) return 'just now'; if(s < 3600) return Math.floor(s / 60) + ' min ago'; if(s < 86400) return Math.floor(s / 3600) + ' h ago';
    var d = Math.floor(s / 86400); return d === 1 ? 'yesterday' : d + ' days ago';
  };
  A.date = function(t){ return new Date(t).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'}); };

  /* ---------- Small UI helpers ---------- */
  A.h = function(s){ var d = doc.createElement('div'); d.innerHTML = s; return d.firstElementChild; };
  A.pill = function(h){ var s = A.STATUS[A.status(h)]; return '<span class="st ' + s[1] + '">' + (s[1] === 'st-work' ? '<i class="st-dot" aria-hidden="true"></i>' : '') + s[0] + '</span>'; };
  A.drawing = function(type){ return RI.TYPES[type] ? RI.Drawing.svg(type, false) : ''; };
  A.dialog = function(title, body, opts){
    opts = opts || {};
    var d = doc.createElement('dialog'); d.className = 'dlg' + (opts.wide ? ' dlg-wide' : '');
    d.innerHTML = '<div class="dlg-head"><h2>' + title + '</h2><button class="icon-btn" type="button" data-dlg-close aria-label="Close">' + RI.icon('x') + '</button></div><div class="dlg-body">' + body + '</div>';
    doc.body.appendChild(d);
    d.addEventListener('click', function(e){ if(e.target === d || e.target.closest('[data-dlg-close]')) d.close(); });
    d.addEventListener('close', function(){ setTimeout(function(){ d.remove(); }, 50); if(opts.onClose) opts.onClose(); });
    RI.fillIcons(d); d.showModal(); return d;
  };
  A.confirm = function(title, text, yes, cb, danger){
    var d = A.dialog(title, '<p>' + text + '</p><div class="cta-row" style="justify-content:flex-end"><button type="button" class="btn btn-secondary" data-dlg-close>Cancel</button><button type="button" class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + '" data-yes>' + yes + '</button></div>');
    d.querySelector('[data-yes]').addEventListener('click', function(){ d.close(); cb(); });
  };

  /* ---------- Router ---------- */
  A.routes = [];
  A.route = function(pattern, fn, opts){ A.routes.push({re:new RegExp('^' + pattern.replace(/:(\w+)/g, '([^/]+)') + '$'), keys:(pattern.match(/:(\w+)/g) || []).map(function(k){ return k.slice(1); }), fn:fn, opts:opts || {}}); };
  A.go = function(hash){ if(location.hash === hash) A.render(); else location.hash = hash; };
  var timers = [];
  A.every = function(fn, ms){ var t = setInterval(fn, ms); timers.push(t); return t; };
  A.later = function(fn, ms){ var t = setTimeout(fn, ms); timers.push(t); return t; };
  A.render = function(){
    timers.forEach(function(t){ clearInterval(t); clearTimeout(t); }); timers = [];
    RI.CURRENT = null;
    var path = (location.hash || '#/houses').slice(1).split('?')[0];
    if(path === '/' || path === '') path = '/houses';
    var view = doc.getElementById('view'), s = A.me();
    var match = null, params = {};
    A.routes.some(function(r){ var m = path.match(r.re); if(m){ match = r; r.keys.forEach(function(k, i){ params[k] = decodeURIComponent(m[i + 1]); }); return true; } });
    doc.body.classList.toggle('is-focus', !!(match && match.opts.focus));
    shell(match ? match.opts.nav : null);
    if(!s){ RI.store.set('next', location.hash); view.innerHTML = gate(); RI.fillIcons(view); return; }
    if(s.role === 'admin' || s.role === 'staff'){ location.replace(RI.url('admin/')); return; }
    view.classList.remove('enter'); void view.offsetWidth; view.classList.add('enter');
    window.scrollTo(0, 0);
    if(!match){ view.innerHTML = A.notFound('That page does not exist.'); RI.fillIcons(view); return; }
    /* One error boundary per screen: a failure stays small and never loses saved work (SECURITY 12) */
    try { match.fn(view, params); }
    catch(err){ if(window.console) console.error(err); view.innerHTML = A.errorBox(); }
    RI.fillIcons(view); RI.applyCtas();
    var h1 = view.querySelector('h1'); if(h1){ h1.setAttribute('tabindex', '-1'); if(A._navigated) h1.focus({preventScroll:true}); }
    A._navigated = true;
    doc.title = (h1 ? h1.textContent.trim() + ' | ' : '') + 'Renovation Intelligence';
  };
  A.errorBox = function(){
    return '<div class="app-wrap"><div class="empty"><div class="mark bronze">' + RI.icon('warn') + '</div><h1>Something went wrong here</h1><p class="muted">This part of the page did not load. Your houses and drafts are saved. Try again.</p><div class="cta-row" style="justify-content:center"><button type="button" class="btn btn-primary" onclick="RI.App.render()">Try again</button><a class="btn btn-secondary" href="#/houses">Go to my houses</a></div></div></div>';
  };
  /* Pages menu targets: open a demo house in a given state, then the screen asked for */
  A.route('/go/:kind/:sub', function(view, p){
    var list = A.mine(), st = function(x){ return A.status(x); }, pick = function(f){ return list.filter(f)[0]; }, h;
    if(p.kind === 'open') h = pick(function(x){ return st(x) === 'open'; }) || pick(function(x){ return st(x) === 'ready'; });
    if(p.kind === 'ready') h = pick(function(x){ return st(x) === 'ready'; }) || pick(function(x){ return st(x) === 'open'; });
    if(p.kind === 'draft') h = pick(function(x){ return st(x) === 'draft'; });
    if(p.kind === 'working'){
      h = pick(function(x){ return ['queued','reading','planning'].indexOf(st(x)) > -1; });
      if(!h){ /* none running: start a demo run from a priced house, replacing an older demo run */
        var base = pick(function(x){ return st(x) === 'ready' || st(x) === 'open'; });
        if(base){ A.saveAll(A.all().filter(function(x){ return !x.demoRun; })); h = JSON.parse(JSON.stringify(base)); h.id = A.uid(); h.demoRun = true; h.paid = false; h.trialOpen = false; h.shares = []; h.status = 'submitted'; h.run = {start:Date.now()}; h.addr = Object.assign({}, h.addr, {unit:'Demo run'}); A.put(h); }
      }
    }
    if(!h){ RI.toast('No demo house in that state. Showing your houses.'); location.replace('#/houses'); return; }
    location.replace('#/houses/' + h.id + (p.sub === '-' ? '' : '/' + p.sub.replace(/~/g, '/')));
  });
  A.route('/demo-error', function(){ throw new Error('Demo: a screen that fails to load'); }, {nav:'account'});
  A.notFound = function(msg){
    return '<div class="app-wrap"><div class="empty"><div class="empty-art">' + RI.Drawing.svg('bungalow', false) + '</div><h1>We could not find that house</h1><p class="muted">' + (msg || 'It may have been removed, or it belongs to another account.') + '</p><a class="btn btn-primary" href="#/houses">Go to my houses</a></div></div>';
  };
  function gate(){
    return '<div class="app-wrap"><div class="empty"><div class="mark bronze">' + RI.icon('lock') + '</div><h1>Log in to see your houses</h1><p class="muted">Your houses and estimates are private to your account.</p><div class="cta-row" style="justify-content:center"><a class="btn btn-primary" href="' + RI.url('login/') + '">Log in</a><button type="button" class="btn btn-secondary" data-open-demo>Use demo access</button></div></div></div>';
  }

  /* ---------- Shell: top bar, bottom tabs, focused bar ---------- */
  function shell(active){
    var s = A.me(), top = doc.getElementById('app-top'), tabs = doc.getElementById('app-tabs');
    var items = [['houses', A.isPro() ? 'Client houses' : 'My houses', '#/houses', 'house']];
    if(A.isPro()) items.push(['resources','Resources','#/resources','file']);
    items.push(['account','Account','#/account','user']);
    var initials = s ? (s.name || s.email).split(/[\s@.]/).filter(Boolean).slice(0, 2).map(function(x){ return x[0].toUpperCase(); }).join('') : '';
    var focusExit = doc.body.classList.contains('is-focus');
    top.innerHTML = '<div class="app-top-in"><a class="brand" href="#/houses" aria-label="Renovation Intelligence, my houses">' + RI.LOGO + '<span><span class="bn">Renovation Intelligence</span><small>' + (A.isPro() ? 'Builder' : 'My houses') + '</small></span></a>' +
      (focusExit ? '<div class="focus-exit" id="focus-exit"></div>' :
      '<nav class="app-nav" aria-label="App">' + items.map(function(i){ return '<a href="' + i[2] + '"' + (active === i[0] ? ' aria-current="page"' : '') + '>' + i[1] + '</a>'; }).join('') + '</nav>' +
      (s ? '<div class="who"><button type="button" class="who-btn" aria-haspopup="true" aria-expanded="false"><span class="av">' + initials + '</span><span class="who-n">' + RI.esc(s.name) + '</span>' + RI.icon('chev','i-sm who-chev') + '</button>' +
        '<div class="who-menu" hidden><p class="xsmall muted">' + RI.esc(s.email) + '</p><a href="#/account">Account</a><a href="' + RI.url('') + '">Public site</a><button type="button" data-open-demo>Demo access</button><button type="button" data-logout>Log out</button></div></div>' : '')) + '</div>';
    tabs.innerHTML = focusExit || !s ? '' : items.map(function(i){ return '<a href="' + i[2] + '"' + (active === i[0] ? ' aria-current="page"' : '') + '>' + RI.icon(i[3]) + '<span>' + i[1].replace('Client houses','Houses') + '</span></a>'; }).join('');
    tabs.hidden = focusExit || !s;
    var wb = top.querySelector('.who-btn');
    if(wb){
      var menu = top.querySelector('.who-menu');
      wb.addEventListener('click', function(e){ e.stopPropagation(); var o = menu.hidden; menu.hidden = !o; wb.setAttribute('aria-expanded', o); });
      doc.addEventListener('click', function(){ menu.hidden = true; wb.setAttribute('aria-expanded', 'false'); }, {once:true});
    }
  }

  /* ---------- Boot ---------- */
  A.boot = function(){
    A.seed();
    window.addEventListener('hashchange', A.render);
    A.render();
  };
})();
