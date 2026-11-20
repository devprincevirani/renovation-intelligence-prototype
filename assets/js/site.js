/* Renovation Intelligence prototype: shared behavior for every public page.
   Plain JavaScript, no build step. Data lives in localStorage only (no backend). */
(function(){
  var RI = window.RI = window.RI || {};
  var doc = document, html = doc.documentElement;
  var ROOT = html.getAttribute('data-root') || '';
  var PAGE = html.getAttribute('data-page') || '';
  RI.ROOT = ROOT;
  RI.url = function(p){ return ROOT + p; };
  RI.img = function(f){ return ROOT + 'assets/img/' + f; };

  /* ---------- Storage (wrapped: private windows can throw) ---------- */
  RI.store = {
    get:function(k, d){ try{ var v = localStorage.getItem('ri.' + k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
    set:function(k, v){ try{ localStorage.setItem('ri.' + k, JSON.stringify(v)); }catch(e){} },
    del:function(k){ try{ localStorage.removeItem('ri.' + k); }catch(e){} },
    clearAll:function(){ try{ Object.keys(localStorage).forEach(function(k){ if(k.indexOf('ri.') === 0) localStorage.removeItem(k); }); }catch(e){} }
  };
  RI.mode = function(){ return RI.store.get('mode', 'prelaunch'); };
  /* Funnel events (APP_FLOW 3, guide p76). Counted in this browser for the demo; the product counts them on the server */
  RI.track = function(name, props){
    var ev = RI.store.get('events', []); ev.push({e:name, at:Date.now(), page:location.pathname.replace(/.*prototype/, ''), p:props || null});
    if(ev.length > 500) ev = ev.slice(-500); RI.store.set('events', ev);
  };
  RI.FUNNEL = [['page_view','Page views'],['waitlist_joined','Waitlist joined'],['signup_completed','Sign ups'],['intake_started','Intakes started'],['intake_submitted','Intakes submitted'],['price_viewed','Prices viewed'],['checkout_started','Checkouts started'],['payment_completed','Payments'],['presentation_opened','Presentations opened'],['share_created','Share links made'],['share_viewed','Share links viewed'],['pdf_downloaded','PDFs downloaded'],['feedback_sent','Feedback sent']];
  RI.session = function(){ return RI.store.get('session', null); };

  /* ---------- Formatting ---------- */
  RI.money = function(n){ return '$' + Math.round(n).toLocaleString('en-US'); };
  RI.moneyRate = function(n){ return n >= 100 ? RI.money(n) : '$' + n.toFixed(2); };
  RI.range = function(lo, hi, f){ f = f || RI.money; return f(lo) + '<span class="to">to</span>' + f(hi); };
  RI.esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  RI.ev = function(key){
    var e = RI.EVIDENCE && RI.EVIDENCE[key]; if(!e) return '';
    var b = ''; for(var i = 0; i < 4; i++) b += '<b' + (i < e.fill ? ' class="f"' : '') + '></b>';
    return '<span class="ev" title="' + RI.esc(e.meaning) + '"><i aria-hidden="true">' + b + '</i>' + e.label + '</span>';
  };

  /* House systems guidance card (guide p49): what to look for, typical lifespan, a typical range from Sam
     shown as guidance only and never added to any total, and the inspect note */
  RI.mechCard = function(m){
    return '<div class="mech-card"><h4>' + m.name + '<span class="state state-guidance">Guidance</span></h4><span class="src">' + m.src + ' · ' + RI.ev(m.ev) + '</span><p>' + m.text + '</p>' +
      '<dl class="mech-kv">' + (m.life ? '<div><dt>Typical lifespan</dt><dd>' + m.life + '</dd></div>' : '') + (m.range ? '<div><dt>Typical range, for planning</dt><dd>' + RI.money(m.range[0]) + ' to ' + RI.money(m.range[1]) + '</dd></div>' : '') + '</dl>' +
      '<span class="src">Guidance only. Never scored, never added to any total. Have it inspected by a professional.</span></div>';
  };

  /* ---------- Icons: one small hand-drawn set, regular weight ---------- */
  var ICONS = {
    arrow:'<path d="M4 12h15M13 6l6 6-6 6"/>',
    check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x:'<path d="M6 6l12 12M18 6L6 18"/>',
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    warn:'<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.5v.5"/>',
    lock:'<rect x="5" y="10.5" width="14" height="10" rx="1.5"/><path d="M8 10.5V7.5a4 4 0 018 0v3"/>',
    camera:'<path d="M4 8h3.5L9 5.5h6L16.5 8H20v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    house:'<path d="M3.5 11L12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>',
    ruler:'<path d="M3 15.5L15.5 3 21 8.5 8.5 21z"/><path d="M7 11.5l2 2M10 8.5l2 2M13 5.5l2 2"/>',
    list:'<path d="M9 6.5h11M9 12h11M9 17.5h11"/><path d="M4.5 6.5h.5M4.5 12h.5M4.5 17.5h.5"/>',
    mail:'<rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="M4 7l8 6 8-6"/>',
    user:'<circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6"/>',
    hammer:'<path d="M14 6.5l3.5 3.5M5 19l9.5-9.5M12.5 4.5l7 7-2 2-7-7z"/>',
    shield:'<path d="M12 3.5l7.5 3v5.5c0 4.5-3.2 7.6-7.5 9-4.3-1.4-7.5-4.5-7.5-9V6.5z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
    clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    pin:'<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0113 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    file:'<path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4M9 12.5h6M9 16h6"/>',
    share:'<circle cx="6" cy="12" r="2.5"/><circle cx="17.5" cy="6" r="2.5"/><circle cx="17.5" cy="18" r="2.5"/><path d="M8.3 10.8l7-3.6M8.3 13.2l7 3.6"/>',
    eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    sliders:'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    console:'<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M3.5 9h17M8 9v10.5"/>',
    refresh:'<path d="M19.5 8A8 8 0 005 9M4.5 16a8 8 0 0014.5-1"/><path d="M19.5 3.5V8H15M4.5 20.5V16H9"/>',
    tool:'<path d="M14.5 6.5a4 4 0 015 5l-9 9-3-3 9-9"/><path d="M14.5 6.5L17 9"/>',
    minus:'<path d="M5 12h14"/>',
    search:'<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    chev:'<path d="M6 9.5l6 6 6-6"/>',
    dot:'<circle cx="12" cy="12" r="3"/>',
    tag:'<path d="M3.5 12.2V4.5a1 1 0 011-1h7.7l8.3 8.3a1.2 1.2 0 010 1.7l-7 7a1.2 1.2 0 01-1.7 0z"/><circle cx="8" cy="8" r="1.6"/>',
    key:'<circle cx="8" cy="15" r="4.5"/><path d="M11.3 11.8L20 3.5M16.5 7l2.5 2.5M14 9.5l2 2"/>',
    exit:'<path d="M14 4.5h3.5a2 2 0 012 2v11a2 2 0 01-2 2H14"/><path d="M10 16l4-4-4-4M14 12H4.5"/>',
    more:'<circle cx="5.5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18.5" cy="12" r="1.4"/>'
  };
  RI.icon = function(name, cls){ return '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>'; };
  function fillIcons(scope){ (scope || doc).querySelectorAll('i[data-i]').forEach(function(el){ el.outerHTML = RI.icon(el.getAttribute('data-i'), (el.getAttribute('class') || '') + ' i-' + el.getAttribute('data-i')); }); }
  RI.fillIcons = fillIcons;

  /* ---------- Account screens: small illustrations, one per situation ---------- */
  var ART = {
    mail:'<svg viewBox="0 0 96 96" aria-hidden="true"><rect class="a-lt" x="30" y="24" width="36" height="30" rx="3"/><path class="a-ln" d="M36 33h18M36 40h24M36 47h14"/><path class="a-env" d="M20 40l28 20 28-20v32a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4z"/><path class="a-st" d="M20 40l28 20 28-20M20 76l22-18M76 76L54 58"/></svg>',
    clock:'<svg viewBox="0 0 96 96" aria-hidden="true"><circle class="a-face" cx="48" cy="50" r="26"/><path class="a-st" d="M48 50V34"/><path class="a-st a-hand" d="M48 50l12 8"/><circle class="a-dot" cx="48" cy="50" r="2.5"/><circle class="a-badge" cx="70" cy="28" r="10"/><path class="a-bang" d="M70 23v6M70 32.5v.5"/></svg>',
    key:'<svg viewBox="0 0 96 96" aria-hidden="true"><g class="a-key"><circle class="a-face" cx="32" cy="48" r="17"/><circle class="a-hole" cx="32" cy="48" r="6"/><path class="a-st" d="M49 48h31M68 48v10M77 48v7"/></g></svg>',
    lock:'<svg viewBox="0 0 96 96" aria-hidden="true"><path class="a-st a-shackle" d="M36 44V34a12 12 0 0 1 24 0v10"/><rect class="a-face" x="28" y="44" width="40" height="30" rx="6"/><circle class="a-dot" cx="48" cy="56" r="3.5"/><path class="a-st" d="M48 59v6"/></svg>',
    check:'<svg viewBox="0 0 96 96" aria-hidden="true"><circle class="a-ok" cx="48" cy="48" r="28"/><path class="a-tick" d="M35 49l9 9 18-20"/></svg>',
    ticket:'<svg viewBox="0 0 96 96" aria-hidden="true"><path class="a-tk" d="M16 30h64v12a6 6 0 0 0 0 12v12H16V54a6 6 0 0 0 0-12z"/><path class="a-perf" d="M58 32v32"/><path class="a-ln" d="M24 42h24M24 50h18"/></svg>'
  };
  /* The card's dark top band and the journey strip at its foot (account screens) */
  RI.fxTop = function(kicker, count, art, opt){ opt = opt || {}; return '<div class="fx-top"><span class="fx-kick">' + kicker + '</span>' + '<div class="fx-art' + (opt.warn ? ' fx-warn' : '') + '" data-art="' + art + '"' + (opt.stamp ? ' data-stamp="' + opt.stamp + '"' : '') + '></div></div>'; };
  RI.fxFlow = function(labels, cur){ return '<ol class="fx-flow" aria-label="Steps">' + labels.map(function(t, i){ return '<li class="' + (i < cur ? 'done' : i === cur ? 'cur' : '') + '"><span>' + (i < cur ? '' : i + 1) + '</span>' + t + '</li>'; }).join('') + '</ol>'; };
  RI.fillArt = function(scope){
    (scope || doc).querySelectorAll('[data-art]:not([data-art-done])').forEach(function(el){
      var k = el.getAttribute('data-art'), stamp = el.getAttribute('data-stamp');
      el.innerHTML = '<span class="fx-ring" aria-hidden="true"></span>' + (ART[k] || '') + (stamp ? '<span class="fx-stamp">' + stamp + '</span>' : '');
      el.classList.add('fx-art-' + k); el.setAttribute('data-art-done', '');
    });
  };

  var LOGO = '<svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><rect x=".5" y=".5" width="33" height="33" rx="4" fill="none" stroke="currentColor" stroke-opacity=".35"/><path d="M8 17.5L17 10l9 7.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M10.5 16v7.5h13V16" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 27.5h18" stroke="#C9A57F" stroke-width="1.6"/><path d="M8 25.5v4M26 25.5v4" stroke="#C9A57F" stroke-width="1.6"/></svg>';
  RI.LOGO = LOGO;
  function brand(){ return '<a class="brand" href="' + RI.url('') + '" aria-label="Renovation Intelligence, home">' + LOGO + '<span><span class="bn">Renovation Intelligence</span></span></a>'; }

  /* ---------- Primary action, per site state (docs/APP_FLOW.md section 3) ---------- */
  function ctaFor(variant){
    var pre = RI.mode() === 'prelaunch';
    if(variant === 'builder') return pre ? {t:'Join the waitlist as a builder', h:'waitlist/?type=builder'} : {t:'Create a builder account', h:'signup/?type=builder'};
    return pre ? {t:'Join the waitlist', h:'waitlist/'} : {t:'Start your estimate', h:'signup/'};
  }
  function applyCtas(){
    doc.querySelectorAll('[data-cta]').forEach(function(a){
      var c = ctaFor(a.getAttribute('data-cta'));
      a.setAttribute('href', RI.url(c.h));
      var t = a.querySelector('.t'); if(t) t.textContent = c.t; else a.innerHTML = '<span class="t">' + c.t + '</span>' + (a.hasAttribute('data-arrow') ? RI.icon('arrow','i-arrow') : '');
    });
    doc.querySelectorAll('[data-when]').forEach(function(el){ el.hidden = el.getAttribute('data-when') !== RI.mode(); });
    html.setAttribute('data-mode', RI.mode());
  }
  RI.applyCtas = applyCtas;

  /* ---------- Header, drawer, footer ---------- */
  var NAV = [['how-it-works/','How it works','how'],['renovation-cost/','Renovation cost','cost'],['sample/','Sample estimate','sample']];
  function renderHeader(){
    var host = doc.getElementById('site-head'); if(!host) return;
    var s = RI.session();
    var acct = s ? '<a class="navlink" href="' + RI.url(s.role === 'admin' ? 'admin/' : 'app/') + '">' + (s.role === 'admin' ? 'Console' : 'My houses') + '</a>'
                 : '<a class="navlink" href="' + RI.url('login/') + '"' + (PAGE === 'login' ? ' aria-current="page"' : '') + '>Log in</a>';
    var links = NAV.map(function(n){ return '<a class="navlink" href="' + RI.url(n[0]) + '"' + (PAGE === n[2] ? ' aria-current="page"' : '') + '>' + n[1] + '</a>'; }).join('');
    host.outerHTML = '<header class="site-head" id="site-head"><div class="wrap">' + brand() +
      '<nav class="mainnav" aria-label="Main">' + links + acct + '<a class="btn btn-ivory" data-cta></a></nav>' +
      '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="drawer">' + RI.icon('menu') + 'Menu</button></div></header>' +
      '<div class="drawer" id="drawer" aria-hidden="true"><div class="drawer-scrim" data-close></div><div class="drawer-panel" role="dialog" aria-modal="true" aria-label="Menu">' +
      '<div class="drawer-top">' + brand() + '<button class="icon-btn" type="button" data-close aria-label="Close menu">' + RI.icon('x') + '</button></div>' +
      '<nav aria-label="Main">' + '<a href="' + RI.url('') + '"' + (PAGE === 'home' ? ' aria-current="page"' : '') + '>Home</a>' + NAV.map(function(n){ return '<a href="' + RI.url(n[0]) + '"' + (PAGE === n[2] ? ' aria-current="page"' : '') + '>' + n[1] + '</a>'; }).join('') + '</nav>' +
      '<div class="drawer-cta"><a class="btn btn-ivory btn-block" data-cta></a>' +
      (s ? '<a class="btn btn-ghost-inv btn-block" href="' + RI.url(s.role === 'admin' ? 'admin/' : 'app/') + '">' + (s.role === 'admin' ? 'Open the console' : 'Open my houses') + '</a>'
         : '<a class="btn btn-ghost-inv btn-block" href="' + RI.url('login/') + '">Log in</a>') + '</div></div></div>';
    var head = doc.getElementById('site-head'), drawer = doc.getElementById('drawer'), btn = head.querySelector('.menu-btn');
    function setOpen(o){
      drawer.classList.toggle('open', o); drawer.setAttribute('aria-hidden', o ? 'false' : 'true'); btn.setAttribute('aria-expanded', o);
      doc.body.style.overflow = o ? 'hidden' : '';
      if(o) drawer.querySelector('[data-close].icon-btn').focus(); else btn.focus();
    }
    btn.addEventListener('click', function(){ setOpen(true); });
    drawer.addEventListener('click', function(e){ if(e.target.closest('[data-close]')) setOpen(false); });
    doc.addEventListener('keydown', function(e){ if(e.key === 'Escape' && drawer.classList.contains('open')) setOpen(false); });
    var onScroll = function(){ head.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
  }

  function renderFocusHeader(){
    var host = doc.getElementById('focus-head'); if(!host) return;
    var exit = host.getAttribute('data-exit') || '';
    var exitText = host.getAttribute('data-exit-text') || 'Back to the site';
    host.outerHTML = '<header class="focus-head"><div class="wrap">' + brand() + '<a class="fh-back" href="' + RI.url(exit) + '" aria-label="' + exitText + '"><span class="fh-ic" aria-hidden="true">' + RI.icon('arrow','i-sm') + '</span><span class="fh-long">' + exitText + '</span><span class="fh-short" aria-hidden="true">Back</span></a></div></header>';
  }

  function renderFooter(){
    var host = doc.getElementById('site-foot'); if(!host) return;
    var areas = RI.AREAS ? Object.keys(RI.AREAS).map(function(k){ return '<li><a href="' + RI.url('renovation-cost/' + k + '/') + '">' + RI.AREAS[k].name + '</a></li>'; }).join('') : '';
    host.outerHTML = '<footer class="site-foot"><div class="wrap"><div class="foot-grid">' +
      '<div class="foot-brand">' + brand() + '<p>An estimate for one specific house, with a Low and a High under three goals, and every unknown named.</p><div><a class="btn btn-ivory btn-sm" data-cta></a></div></div>' +
      '<div><h4>Product</h4><ul><li><a href="' + RI.url('how-it-works/') + '">How it works</a></li><li><a href="' + RI.url('sample/') + '">Sample estimate</a></li><li><a href="' + RI.url('renovation-cost/') + '">Renovation cost</a></li><li><a href="' + RI.url('waitlist/') + '">Waitlist</a></li><li><a href="' + RI.url('login/') + '">Log in</a></li></ul></div>' +
      '<div><h4>Areas</h4><ul>' + areas + '</ul></div>' +
      '<div><h4>Legal</h4><ul><li><a href="' + RI.url('terms/') + '">Terms of use</a></li><li><a href="' + RI.url('privacy/') + '">Privacy</a></li><li><a href="' + RI.url('disclaimer/') + '">Estimate disclaimer</a></li><li><a href="' + RI.url('contact/') + '">Contact</a></li></ul></div>' +
      '</div><div class="foot-bottom"><div class="disc"><p>Every figure is an estimate for planning, not a contractor\'s bid or a fixed price. Items we could not confirm are labeled and left out of the total. The roof, heating and cooling, water heater and electrical panel get guidance only, never a price.</p><p>Design prototype. Sample data. "Renovation Intelligence" is a working name.</p></div>' +
      '<div class="foot-state"><span class="xsmall">Demo: site state</span>' + modeSeg(true) + '</div></div></div></footer>';
  }

  /* ---------- Segmented control with sliding thumb ---------- */
  function modeSeg(inv){
    var m = RI.mode();
    return '<div class="seg' + (inv ? ' inv' : '') + '" role="group" aria-label="Site state" data-mode-seg><span class="seg-thumb"></span>' +
      '<button type="button" data-set-mode="prelaunch" aria-pressed="' + (m === 'prelaunch') + '">Before launch</button>' +
      '<button type="button" data-set-mode="launched" aria-pressed="' + (m === 'launched') + '">After launch</button></div>';
  }
  RI.syncSeg = function(seg){
    var on = seg.querySelector('[aria-pressed="true"],[aria-selected="true"]'), th = seg.querySelector('.seg-thumb');
    if(!on || !th) return;
    th.style.width = on.offsetWidth + 'px'; th.style.transform = 'translateX(' + (on.offsetLeft - 3) + 'px)';
  };
  function syncAllSegs(){ doc.querySelectorAll('.seg').forEach(RI.syncSeg); }
  RI.syncAllSegs = syncAllSegs;
  doc.addEventListener('click', function(e){
    var b = e.target.closest('[data-set-mode]'); if(!b) return;
    var m = b.getAttribute('data-set-mode'); if(m === RI.mode()) return;
    RI.store.set('mode', m);
    doc.querySelectorAll('[data-set-mode]').forEach(function(x){ x.setAttribute('aria-pressed', x.getAttribute('data-set-mode') === m); });
    syncAllSegs(); applyCtas();
    RI.toast(m === 'prelaunch' ? 'Showing the site before launch: the main button is Join the waitlist.' : 'Showing the site after launch: the main button is Start your estimate.');
    doc.dispatchEvent(new CustomEvent('ri:mode'));
  });

  /* ---------- Developer shortcuts switch ----------
     Demo access, the Pages menu and the floating Demo button are developer shortcuts. They are off by
     default, so reviewers use the prototype like the product. Turn them on in this browser by opening
     any page with ?dev=1 (for example /?dev=1 or /app/?dev=1#/houses). Turn them off again with ?dev=0.
     The choice is remembered in this browser only. */
  RI.devTools = (function(){
    var on = false;
    try {
      var q = /[?&]dev=([01])\b/.exec(location.search);
      if(q) localStorage.setItem('ri-dev-tools', q[1]);
      on = localStorage.getItem('ri-dev-tools') === '1';
    } catch(err){}
    return on;
  })();

  /* ---------- Prototype ribbon and demo panel ---------- */
  /* The prototype ribbon shows only in developer mode, because it holds the shortcuts. */
  function renderProtoBar(){
    var dev = RI.devTools;
    if(dev){
      var bar = doc.createElement('div'); bar.className = 'proto-bar';
      bar.innerHTML = '<div class="wrap"><span class="tag-proto">Prototype</span><span class="pb-long">A design prototype for review. Houses, prices and text are <b>sample data</b>.</span><span class="pb-short">Sample data only.</span>' +
        '<button type="button" data-open-demo>Demo access</button><button type="button" class="pb-pages" id="pb-pages" aria-haspopup="true" aria-expanded="false" aria-controls="pages-menu">Pages<svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M2.5 4.5L6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></button></div>';
      doc.body.insertBefore(bar, doc.body.firstChild);
      pagesMenu(bar);
    }
    var skip = doc.createElement('a'); skip.className = 'skip'; skip.href = '#main'; skip.textContent = 'Skip to content';
    doc.body.insertBefore(skip, doc.body.firstChild);
    if(dev){
      var fab = doc.createElement('button'); fab.type = 'button'; fab.className = 'demo-fab'; fab.setAttribute('data-open-demo', '');
      fab.innerHTML = '<span class="dot" aria-hidden="true"></span><span class="txt">Demo</span><span class="sr">Open demo access</span>';
      doc.body.appendChild(fab);
    }
  }

  /* ---------- Pages menu: a screen navigator for reviewing the prototype ----------
     Groups in a sidebar, screens as cards that say what they show, the intake as a numbered flow,
     search across everything, recent screens, and keyboard shortcuts (Cmd or Ctrl K, and /).
     Signed-in screens log in as the right demo role first. App links of the form #/go/<state>/<path>
     open a demo house in that state (the app resolves them). */
  var PM = [
    {key:'public', name:'Public site', icon:'house', sections:[
      ['Main pages', [['Home', '', 'The first screen a visitor sees', 'house'], ['How it works', 'how-it-works/', 'Eight steps, from photos to price', 'list'], ['Sample estimate', 'sample/', 'A full presentation for one house', 'file'], ['Renovation cost', 'renovation-cost/', 'Costs by area and house type', 'sliders']]],
      ['Area and house type', [['Area page: Livonia', 'renovation-cost/livonia/', 'Typical costs for one area', 'pin'], ['House type: brick ranch', 'renovation-cost/house-types/brick-ranch/', 'Typical costs for one house type', 'house']]],
      ['Waitlist and contact', [['Waitlist', 'waitlist/', 'Email and account type, before launch', 'mail'], ['Contact', 'contact/', 'A message form', 'mail']]],
      ['Legal and other', [['Terms', 'terms/', 'Terms of use', 'file'], ['Privacy', 'privacy/', 'How data is handled', 'shield'], ['Disclaimer', 'disclaimer/', 'An estimate, not a bid', 'info'], ['Page not found', '404.html', 'The 404 screen', 'warn']]]
    ]},
    {key:'accounts', name:'Accounts', icon:'user', sections:[
      ['Sign up', [['Sign up', 'signup/', 'Before launch: closed, points to the waitlist', 'user'], ['Sign up from Sam\'s trial invite', 'signup/?invite=demo-trial', 'The invited path, with a 15-day trial', 'mail'], ['Check your email', 'verify-email/?email=homeowner@demo.ri', 'Confirm the address after sign up', 'mail'], ['Email link expired', 'verify-email/?email=homeowner@demo.ri&state=expired', 'The link is older than 24 hours', 'clock']]],
      ['Log in and passwords', [['Log in', 'login/', 'Email and password, plus the demo roles', 'lock'], ['Forgot password', 'forgot-password/', 'Ask for a reset link', 'refresh'], ['Set a new password', 'reset-password/?email=homeowner@demo.ri', 'Opened from the reset link', 'lock']]],
      ['Staff', [['Staff invite', 'invite/?t=demo-staff', 'Accept Sam\'s invite and set a password', 'shield'], ['Staff invite expired', 'invite/?t=old', 'The invite link no longer works', 'clock']]]
    ]},
    {key:'homeowner', name:'Homeowner app', icon:'house', role:'homeowner', sections:[
      ['Houses', [['My houses', 'app/#/houses', 'Cards with status and the next step', 'house'], ['Add a house', 'app/#/houses/new', 'Starts a new intake', 'house']]],
      ['Intake', [['The house', 'app/#/go/draft/intake~house', 'Address, size, rooms', 'house'], ['Photos', 'app/#/go/draft/intake~photos', 'Photos by room, plans', 'camera'], ['Room sizes', 'app/#/go/draft/intake~measurements', 'Optional lengths and widths', 'ruler'], ['Review', 'app/#/go/draft/intake~review', 'Gaps, estimate tick, submit', 'check']], 'flow'],
      ['After submit', [['House being read', 'app/#/go/working/-', 'Progress while the photos are read', 'clock'], ['Price by package', 'app/#/go/ready/-', 'Free: Low and High for three goals', 'sliders'], ['Checkout', 'app/#/go/ready/checkout', 'One payment for the presentation', 'lock'], ['Presentation', 'app/#/go/open/presentation', 'Rooms, products, share and PDF', 'file']]],
      ['Other', [['Account', 'app/#/account', 'Profile, demo data, the free limit', 'user'], ['Error screen', 'app/#/demo-error', 'When a screen fails to load', 'warn']]]
    ]},
    {key:'builder', name:'Builder app', icon:'hammer', role:'builder', sections:[
      ['Builder', [['Client houses', 'app/#/houses', 'Six client houses with names', 'hammer'], ['Presentation with task lists', 'app/#/go/open/presentation', 'Task lists per trade, as CSV', 'list'], ['Resources', 'app/#/resources', 'Scope documents', 'file']]]
    ]},
    {key:'console', name:'Admin console', icon:'console', role:'admin', sections:[
      ['Overview', [['Overview', 'admin/#/overview', 'Proposal: what needs Sam and how the engine is doing', 'console']]],
      ['Houses', [['Houses', 'admin/#/houses', 'Every house, with search and filters', 'house'], ['House inspector', 'admin/#/go/inspector', 'One house end to end', 'list'], ['Decision tree', 'admin/#/go/tree', 'Follow a branch and grade it', 'sliders']]],
      ['Quality', [['Check results', 'admin/#/checks', 'Lines held by the seven checks', 'shield'], ['Photo accuracy', 'admin/#/accuracy', 'Labelled photos and the score', 'eye']]],
      ['Rulebook', [['Rules and families', 'admin/#/rules', 'The rule registry by family', 'list'], ['Condition sheets', 'admin/#/condition-sheets', 'Thresholds per component', 'sliders'], ['Room templates', 'admin/#/room-templates', 'What each room type holds', 'ruler'], ['Packages and catalog', 'admin/#/packages', 'Goals and the 23 presets', 'tag']]],
      ['Pricing', [['Products', 'admin/#/products', 'The product library by tier', 'tag'], ['Rates', 'admin/#/rates', 'Low and High per line', 'file']]],
      ['Content', [['Guidance', 'admin/#/guidance', 'Systems guidance and texts', 'info'], ['Builder documents', 'admin/#/resources', 'Scope documents', 'file']]],
      ['Changes', [['Publish queue', 'admin/#/publish', 'Drafts waiting for Sam', 'refresh'], ['Back-tests', 'admin/#/backtests', 'Replay houses after a change', 'clock']]],
      ['Customers', [['Contacts and feedback', 'admin/#/feedback', 'Feedback and the updates list', 'mail'], ['Funnel', 'admin/#/funnel', 'Where people leave', 'sliders']]],
      ['Admin', [['Users and staff', 'admin/#/users', 'Accounts, staff, waitlist', 'user'], ['Audit log', 'admin/#/audit', 'Every change, who and why', 'console']]]
    ]},
    {key:'other', name:'Shared view', icon:'share', sections:[
      ['Shared view', [['Share link not valid', 's/?t=nope', 'What a dead share link shows', 'share']]]
    ]}
  ];
  var ROLE_NAME = {homeowner:'Homeowner', builder:'Builder', admin:'Admin'};
  function pagesMenu(bar){
    var btn = bar.querySelector('#pb-pages'), all = [], active = null, mac = /Mac|iP/.test(navigator.platform || '');
    PM.forEach(function(g){ g.sections.forEach(function(sec){ sec[1].forEach(function(x, i){ all.push({g:g, sec:sec[0], flow:sec[2] === 'flow', n:i + 1, title:x[0], path:x[1], desc:x[2], icon:x[3], role:x[4] || g.role || '', href:RI.url(x[1])}); }); }); });
    function key(u){ return u.pathname + u.search + u.hash; }
    function here(){ return location.pathname + location.search + (location.hash || (/\/app\/$/.test(location.pathname) ? '#/houses' : '')); }
    function isHere(it){
      var who = RI.session(); if(it.role && !(who && who.role === it.role)) return false;
      var g = /^app\/#\/go\/([^/]+)\/(.+)$/.exec(it.path);
      if(g && /\/app\/$/.test(location.pathname)){
        /* A house screen: match the screen part, and the house's state where it tells two screens apart */
        var mh = /^#\/houses\/([^/]+)(\/.*)?$/.exec(location.hash); if(!mh || mh[1] === 'new') return false;
        var sub = g[2] === '-' ? '' : '/' + g[2].replace(/~/g, '/'); if((mh[2] || '') !== sub) return false;
        if(sub) return true;
        var A = RI.App, h = A && A.get ? A.get(mh[1]) : null, st = h ? A.status(h) : '';
        return g[1] === 'working' ? ['queued','reading','planning'].indexOf(st) > -1 : g[1] === st;
      }
      return key(new URL(it.href, location.href)) === here();
    }
    function recent(){ return RI.store.get('pm.recent', []).map(function(h){ return all.filter(function(it){ return it.path + '|' + it.role === h; })[0]; }).filter(Boolean); }

    var m = doc.createElement('div'); m.className = 'pm'; m.id = 'pages-menu'; m.hidden = true; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', 'All screens');
    m.innerHTML = '<div class="pm-scrim" data-pm-close></div><div class="pm-panel">' +
      '<header class="pm-top"><div class="pm-title"><b>Screens</b><span>' + all.length + ' in this prototype</span></div>' +
        '<label class="pm-search">' + RI.icon('search','i-sm') + '<input type="search" id="pm-q" placeholder="Find a screen" aria-label="Find a screen" autocomplete="off" spellcheck="false"><kbd>' + (mac ? '⌘' : 'Ctrl') + ' K</kbd></label>' +
        '<span class="pm-who" id="pm-who"></span><button type="button" class="pm-x" data-pm-close aria-label="Close">' + RI.icon('x','i-sm') + '</button></header>' +
      '<div class="pm-body"><nav class="pm-nav" aria-label="Groups">' + PM.map(function(g){
          var n = all.filter(function(it){ return it.g === g; }).length;
          return '<button type="button" data-pm-g="' + g.key + '"><span class="pm-gi">' + RI.icon(g.icon,'i-sm') + '</span><span class="pm-gn">' + g.name + (g.role ? '<small>as ' + ROLE_NAME[g.role] + '</small>' : '') + '</span><span class="pm-gc">' + n + '</span></button>';
        }).join('') + '</nav><div class="pm-main" id="pm-main"></div></div>' +
      '<footer class="pm-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span><span class="pm-foot-r">Screens in the app sign in as the right demo role</span></footer></div>';
    doc.body.appendChild(m);
    var q = m.querySelector('#pm-q'), main = m.querySelector('#pm-main');

    function card(it, showGroup){
      var on = isHere(it);
      return '<a class="pm-card' + (on ? ' here' : '') + '" href="' + it.href + '" data-path="' + RI.esc(it.path) + '"' + (it.role ? ' data-as="' + it.role + '"' : '') + (on ? ' aria-current="page"' : '') + '>' +
        '<span class="pm-ci">' + (it.flow ? '<b>' + it.n + '</b>' : RI.icon(it.icon,'i-sm')) + '</span>' +
        '<span class="pm-ct"><span class="pm-cn">' + RI.esc(it.title) + (on ? '<em>You are here</em>' : '') + '</span><span class="pm-cd">' + RI.esc(showGroup ? it.g.name + ' · ' + it.desc : it.desc) + '</span></span>' +
        (it.role && it.role !== it.g.role || (showGroup && it.role) ? '<span class="pm-role">' + ROLE_NAME[it.role] + '</span>' : '') + RI.icon('arrow','i-sm pm-go') + '</a>';
    }
    function showGroup(k){
      active = k; var g = PM.filter(function(x){ return x.key === k; })[0];
      m.querySelectorAll('[data-pm-g]').forEach(function(b){ b.setAttribute('aria-current', b.getAttribute('data-pm-g') === k ? 'true' : 'false'); });
      var rc = recent();
      main.innerHTML = (rc.length ? '<div class="pm-recent"><span>Recent</span>' + rc.map(function(it){ return '<a href="' + it.href + '" data-path="' + RI.esc(it.path) + '"' + (it.role ? ' data-as="' + it.role + '"' : '') + '>' + RI.esc(it.title) + '</a>'; }).join('') + '</div>' : '') +
        '<div class="pm-gh"><h2>' + g.name + '</h2>' + (g.role ? '<span class="pm-as">' + RI.icon('user','i-sm') + 'Opens signed in as ' + ROLE_NAME[g.role] + '</span>' : '') + '</div>' +
        g.sections.map(function(sec){
          var items = all.filter(function(it){ return it.g === g && it.sec === sec[0]; });
          return '<section class="pm-sec"><h3>' + sec[0] + (sec[2] === 'flow' ? '<span>4 steps</span>' : '') + '</h3><div class="' + (sec[2] === 'flow' ? 'pm-flow' : 'pm-grid') + '">' + items.map(function(it){ return card(it); }).join('') + '</div></section>';
        }).join('');
      main.scrollTop = 0;
    }
    function search(){
      var v = q.value.trim().toLowerCase();
      if(!v){ m.classList.remove('searching'); showGroup(active || 'public'); return; }
      m.classList.add('searching');
      var hits = all.filter(function(it){ return (it.title + ' ' + it.desc + ' ' + it.g.name + ' ' + it.sec).toLowerCase().indexOf(v) > -1; });
      main.innerHTML = '<div class="pm-gh"><h2>' + hits.length + ' result' + (hits.length === 1 ? '' : 's') + '</h2></div>' +
        (hits.length ? '<div class="pm-grid">' + hits.map(function(it){ return card(it, true); }).join('') + '</div>' : '<p class="pm-none">No screen matches “' + RI.esc(q.value.trim()) + '”. Try “photos”, “invite” or “price”.</p>');
    }
    function groupOfHere(){ var it = all.filter(isHere)[0]; return it ? it.g.key : 'public'; }
    function open(o){
      m.hidden = !o; btn.setAttribute('aria-expanded', o); doc.documentElement.classList.toggle('pm-open', o);
      if(o){ var s = RI.session(); m.querySelector('#pm-who').innerHTML = s ? '<i class="dot on"></i>Signed in as ' + RI.esc(s.type) : '<i class="dot"></i>Not signed in'; q.value = ''; m.classList.remove('searching'); showGroup(groupOfHere()); setTimeout(function(){ q.focus(); }, 30); }
    }
    btn.addEventListener('click', function(e){ e.stopPropagation(); open(m.hidden); });
    m.addEventListener('click', function(e){
      if(e.target.closest('[data-pm-close]')){ open(false); btn.focus(); return; }
      var gb = e.target.closest('[data-pm-g]'); if(gb){ q.value = ''; m.classList.remove('searching'); showGroup(gb.getAttribute('data-pm-g')); return; }
      var a = e.target.closest('a[data-path]'); if(!a) return;
      /* Remember it, sign in as the right role if needed, then go */
      var role = a.getAttribute('data-as') || '', id = a.getAttribute('data-path') + '|' + role, rc = RI.store.get('pm.recent', []).filter(function(x){ return x !== id; });
      rc.unshift(id); RI.store.set('pm.recent', rc.slice(0, 4));
      var now = RI.session(), target = new URL(a.href, location.href), switched = role && (!now || now.role !== role);
      if(switched){ var r = ROLES.filter(function(x){ return x.role === role; })[0]; if(r) RI.store.set('session', {role:r.role, name:r.name, email:r.email, type:r.type, demo:true, at:Date.now()}); }
      open(false);
      if(target.pathname === location.pathname && target.search === location.search){ e.preventDefault(); location.hash = target.hash; if(switched) location.reload(); }
    });
    q.addEventListener('input', search);
    /* Keyboard: Cmd or Ctrl K and / open it; arrows move through the screens; Enter opens */
    doc.addEventListener('keydown', function(e){
      var t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)){ e.preventDefault(); open(m.hidden); return; }
      if(e.key === '/' && !typing && m.hidden){ e.preventDefault(); open(true); return; }
      if(m.hidden) return;
      if(e.key === 'Escape'){ e.preventDefault(); open(false); btn.focus(); return; }
      if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
        var cards = [].slice.call(main.querySelectorAll('.pm-card')), i = cards.indexOf(doc.activeElement);
        if(!cards.length) return; e.preventDefault();
        var n = e.key === 'ArrowDown' ? (i < 0 ? 0 : Math.min(cards.length - 1, i + 1)) : (i <= 0 ? -1 : i - 1);
        if(n < 0) q.focus(); else { cards[n].focus(); cards[n].scrollIntoView({block:'nearest'}); }
      }
      if(e.key === 'Enter' && t === q){ var first = main.querySelector('.pm-card'); if(first){ e.preventDefault(); first.click(); } }
    });
  }
  var ROLES = [
    {role:'homeowner', name:'Jordan Lee', email:'homeowner@demo.ri', type:'Homeowner', d:'Three houses: one presentation, one priced, one in progress', icon:'house'},
    {role:'builder', name:'Avery Brooks', email:'builder@demo.ri', type:'Builder', d:'Six client houses, task lists, scope documents', icon:'hammer'},
    {role:'admin', name:'Sam (super admin)', email:'admin@demo.ri', type:'Admin', d:'Console: decisions, rules, rates, back-tests', icon:'console'}
  ];
  RI.ROLES = ROLES;
  RI.roleButtons = function(){
    return ROLES.map(function(r){ return '<button type="button" class="role-btn" data-demo-role="' + r.role + '"><span class="av">' + RI.icon(r.icon) + '</span><span><strong>' + r.type + '</strong><span>' + r.d + '</span></span>' + RI.icon('arrow','i-arrow') + '</button>'; }).join('');
  };
  RI.loginAs = function(role){
    var r = ROLES.filter(function(x){ return x.role === role; })[0]; if(!r) return;
    RI.store.set('session', {role:r.role, name:r.name, email:r.email, type:r.type, demo:true, at:Date.now()});
    RI.toast('Logged in as the demo ' + r.type.toLowerCase() + '.');
    var nx = role === 'admin' ? '' : RI.store.get('next', ''); RI.store.del('next');
    setTimeout(function(){
      var target = new URL(RI.url(role === 'admin' ? 'admin/' : 'app/') + (nx || ''), location.href);
      /* Already on that page (for example the app's login prompt): reload so the app starts signed in */
      if(target.pathname === location.pathname){ location.hash = target.hash; location.reload(); }
      else location.href = target.href;
    }, 450);
  };
  doc.addEventListener('click', function(e){
    var b = e.target.closest('[data-demo-role]'); if(b){ e.preventDefault(); RI.loginAs(b.getAttribute('data-demo-role')); }
  });
  function demoDialog(){
    var d = doc.getElementById('demo-dlg');
    if(!d){
      d = doc.createElement('dialog'); d.className = 'dlg'; d.id = 'demo-dlg'; d.setAttribute('aria-labelledby', 'demo-dlg-t');
      d.innerHTML = '<div class="dlg-head"><h2 id="demo-dlg-t">Demo access</h2><button class="icon-btn" type="button" data-dlg-close aria-label="Close">' + RI.icon('x') + '</button></div>' +
        '<div class="dlg-body"><div class="dlg-sec"><h3>Log in as</h3><div class="role-list">' + RI.roleButtons() + '</div><p class="xsmall muted">No password needed. The dashboards are built in the next phases; for now each opens a preview page.</p></div>' +
        '<div class="dlg-sec"><h3>Site state</h3>' + modeSeg(false) + '<p class="xsmall muted">Before launch, the main button is Join the waitlist and only the contacts Sam invites can sign up. <a href="' + RI.url('signup/?invite=demo-trial') + '">Open Sam\'s trial invite</a></p></div>' +
        '<div class="dlg-sec"><h3>Staff</h3><p class="xsmall muted">Sam invites staff from the console. <a href="' + RI.url('invite/?t=demo-staff') + '">Open a demo staff invite</a></p></div>' +
        '<div class="dlg-sec"><h3>Funnel events</h3><div class="funnel-mini" id="funnel-mini"></div><p class="xsmall muted">Counted in this browser. The console\'s funnel view counts them on the server.</p></div>' +
        '<div class="dlg-sec"><h3>Demo data</h3><div class="cta-row"><button type="button" class="btn btn-secondary btn-sm" data-reset-demo>' + RI.icon('refresh','i-sm') + 'Reset demo data</button>' +
        (RI.session() ? '<button type="button" class="btn btn-secondary btn-sm" data-logout>Log out</button>' : '') + '</div><p class="xsmall muted">Accounts, waitlist entries and choices are kept in this browser only.</p></div></div>';
      doc.body.appendChild(d);
      d.addEventListener('click', function(e){ if(e.target === d || e.target.closest('[data-dlg-close]')) d.close(); });
    }
    var counts = {}; RI.store.get('events', []).forEach(function(e){ counts[e.e] = (counts[e.e] || 0) + 1; });
    d.querySelector('#funnel-mini').innerHTML = RI.FUNNEL.map(function(f){ return '<div><span>' + f[1] + '</span><b>' + (counts[f[0]] || 0) + '</b></div>'; }).join('');
    d.showModal(); requestAnimationFrame(syncAllSegs);
  }
  doc.addEventListener('click', function(e){
    if(e.target.closest('[data-open-demo]')){ e.preventDefault(); demoDialog(); }
    if(e.target.closest('[data-reset-demo]')){ RI.store.clearAll(); RI.toast('Demo data cleared.'); setTimeout(function(){ location.reload(); }, 600); }
    if(e.target.closest('[data-logout]')){ RI.store.del('session'); RI.toast('Logged out.'); setTimeout(function(){ location.href = RI.url(''); }, 500); }
  });

  /* ---------- Toast ---------- */
  RI.toast = function(msg, icon){
    var host = doc.querySelector('.toasts');
    if(!host){ host = doc.createElement('div'); host.className = 'toasts'; host.setAttribute('role', 'status'); host.setAttribute('aria-live', 'polite'); doc.body.appendChild(host); }
    var t = doc.createElement('div'); t.className = 'toast'; t.innerHTML = RI.icon(icon || 'check') + '<span>' + RI.esc(msg) + '</span>';
    host.appendChild(t);
    setTimeout(function(){ t.classList.add('out'); setTimeout(function(){ t.remove(); }, 260); }, 3200);
  };

  /* ---------- Range lines: one scale per group, drawn once in view ---------- */
  RI.scaleOf = function(el){ var s = el.closest('[data-scale]'); var v = (el.getAttribute('data-scale') || (s && s.getAttribute('data-scale')) || '0,100').split(',').map(Number); return v; };
  RI.drawRange = function(el){
    var sc = RI.scaleOf(el), lo = +el.getAttribute('data-low'), hi = +el.getAttribute('data-high');
    var span = sc[1] - sc[0] || 1, l = Math.max(0, (lo - sc[0]) / span * 100), w = Math.max(.8, (hi - lo) / span * 100);
    if(!el.querySelector('.rl-track')){
      el.innerHTML = '<span class="rl-track"></span><span class="rl-bar"></span>';
      el.setAttribute('role', 'img');
    }
    var bar = el.querySelector('.rl-bar'); bar.style.left = l + '%'; bar.style.width = Math.min(w, 100 - l) + '%';
    var f = hi < 100 ? RI.moneyRate : RI.money;
    el.setAttribute('aria-label', 'Low ' + f(lo) + ', High ' + f(hi) + (el.classList.contains('partial') ? ', partial' : ''));
  };
  var drawObs = 'IntersectionObserver' in window ? new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('drawn'); drawObs.unobserve(en.target); } }); }, {rootMargin:'0px 0px -8% 0px'}) : null;
  RI.initRanges = function(scope){
    (scope || doc).querySelectorAll('.rl[data-low]').forEach(function(el){
      RI.drawRange(el);
      if(el.closest('[data-hold-draw]')){ el.setAttribute('data-draw', ''); return; }
      if(!el.hasAttribute('data-draw') && !el.classList.contains('drawn')){
        el.setAttribute('data-draw', '');
        if(drawObs) drawObs.observe(el); else el.classList.add('drawn');
      }
    });
    (scope || doc).querySelectorAll('.axis[data-ticks]').forEach(function(ax){
      var sc = RI.scaleOf(ax), span = sc[1] - sc[0];
      ax.innerHTML = ax.getAttribute('data-ticks').split(',').map(Number).map(function(t){ return '<span style="left:' + ((t - sc[0]) / span * 100) + '%">' + (t === 0 ? '$0' : '$' + (t / 1000) + 'k') + '</span>'; }).join('');
    });
  };

  /* ---------- Reveal, used on a few blocks only ---------- */
  var revObs = 'IntersectionObserver' in window ? new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); en.target.classList.remove('pre'); revObs.unobserve(en.target); } }); }, {rootMargin:'0px 0px -10% 0px'}) : null;
  function initReveal(){
    doc.querySelectorAll('.reveal,.steps').forEach(function(el){
      if(!revObs){ el.classList.add('in'); return; }
      if(el.classList.contains('steps')){
        el.classList.add('pre');
        el.querySelectorAll('li').forEach(function(li, i){ li.style.transitionDelay = (150 + i * 110) + 'ms'; });
      }
      revObs.observe(el);
    });
  }

  /* ---------- FAQ: smooth open and close ---------- */
  function initFaq(scope){
    (scope || doc).querySelectorAll('.faq details:not([data-bound])').forEach(function(d){
      d.setAttribute('data-bound', '');
      var s = d.querySelector('summary'), a = d.querySelector('.a'); if(!a) return;
      s.addEventListener('click', function(e){
        if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        e.preventDefault();
        if(d.open){
          a.style.overflow = 'hidden'; a.style.height = a.scrollHeight + 'px';
          requestAnimationFrame(function(){ a.style.transition = 'height 260ms cubic-bezier(.5,0,.75,0), opacity 200ms'; a.style.height = '0px'; a.style.opacity = '0'; });
          setTimeout(function(){ d.open = false; a.removeAttribute('style'); }, 270);
        } else {
          d.open = true; var h = a.scrollHeight; a.style.overflow = 'hidden'; a.style.height = '0px'; a.style.opacity = '0';
          requestAnimationFrame(function(){ a.style.transition = 'height 320ms cubic-bezier(.2,.7,.2,1), opacity 320ms'; a.style.height = h + 'px'; a.style.opacity = '1'; });
          setTimeout(function(){ a.removeAttribute('style'); }, 340);
        }
      });
    });
  }

  RI.initFaq = initFaq;

  /* ---------- Forms ---------- */
  RI.form = {
    emailOk:function(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
    setInvalid:function(input, msg){
      var f = input.closest('.field'); if(!f) return;
      var err = f.querySelector('.err');
      if(msg){ f.classList.add('invalid'); f.classList.remove('valid'); input.setAttribute('aria-invalid', 'true'); if(err) err.innerHTML = RI.icon('warn','i-sm') + '<span>' + RI.esc(msg) + '</span>'; }
      else { f.classList.remove('invalid'); input.removeAttribute('aria-invalid'); }
    },
    busy:function(btn, on, text){
      if(on){ btn.dataset.label = btn.innerHTML; btn.setAttribute('aria-busy', 'true'); btn.disabled = true; btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>' + (text || 'Working'); }
      else { btn.removeAttribute('aria-busy'); btn.disabled = false; if(btn.dataset.label) btn.innerHTML = btn.dataset.label; }
    },
    strength:function(pw){ var s = 0; if(pw.length >= 8) s++; if(/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++; if(/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) s++; if(pw.length < 8) s = Math.min(s, 1); return pw ? s : 0; },
    /* Prototype only: a light obfuscation so demo passwords are not stored as typed. Not security. */
    hash:function(s){ var h = 5381; for(var i = 0; i < s.length; i++){ h = ((h << 5) + h + s.charCodeAt(i)) | 0; } return 'h' + (h >>> 0).toString(36); },
    pwToggle:function(scope){
      (scope || doc).querySelectorAll('.pw-wrap button').forEach(function(b){
        b.addEventListener('click', function(){ var i = b.parentNode.querySelector('input'); var show = i.type === 'password'; i.type = show ? 'text' : 'password'; b.textContent = show ? 'Hide' : 'Show'; b.setAttribute('aria-pressed', show); });
      });
    },
    params:function(){ var p = {}; location.search.replace(/^\?/, '').split('&').forEach(function(kv){ if(!kv) return; var a = kv.split('='); p[decodeURIComponent(a[0])] = decodeURIComponent((a[1] || '').replace(/\+/g, ' ')); }); return p; }
  };
  RI.users = {
    all:function(){ return RI.store.get('users', {}); },
    get:function(email){ return RI.users.all()[email.trim().toLowerCase()]; },
    put:function(u){ var a = RI.users.all(); a[u.email] = u; RI.store.set('users', a); }
  };

  /* ---------- How it works, at a glance: price ranges and presentation rows, read from the sample house ----------
     Range lines share one scale, Low at the left tick and High at the right, never a middle mark; partial is dashed */
  function fillGlance(){
    if(!RI.totals || !RI.SAMPLE) return;
    var T = {E:RI.totals('E'), S:RI.totals('S'), P:RI.totals('P')}, max = T.P.high * 1.04;
    var full = function(n){ return '$' + Math.round(n).toLocaleString('en-US'); };
    doc.querySelectorAll('[data-gv="ranges"]').forEach(function(el){
      el.innerHTML = [['E','Essential'],['S','Standard'],['P','Premium']].map(function(k){ var t = T[k[0]], on = k[0] === 'S';
        return '<div class="gv-r' + (on ? ' on' : '') + '"><span class="gv-rn">' + k[1] + '</span><span class="gv-rv">' + full(t.low) + ' <em>to</em> ' + full(t.high) + '</span><span class="gv-rl" aria-hidden="true"><span class="gv-rz' + (t.partial ? ' part' : '') + '" style="left:' + (t.low / max * 100) + '%;width:' + ((t.high - t.low) / max * 100) + '%"></span></span></div>'; }).join('');
    });
    var items = (RI.SAMPLE.rooms[0] || {}).items || [], item = function(id){ return items.filter(function(x){ return x.id === id; })[0]; };
    doc.querySelectorAll('[data-gv="pres"]').forEach(function(el){
      el.innerHTML = [['k1','cabinet-run.jpg','Cabinets'],['k2','kitchen-dated-wide.jpg','Countertop'],['k5','wood-floor.jpg','Kitchen floor']].map(function(r){
        var it = item(r[0]); if(!it) return ''; var sp = it.pk.S, hold = it.state === 'measure' || it.state === 'unverified';
        return '<div class="gv-row"><img src="' + RI.img(r[1]) + '" alt=""><span><b>' + r[2] + '</b><small>' + RI.esc(sp[0].split(',')[0]) + '</small></span>' + (hold ? '<span class="v hold">' + (it.state === 'measure' ? 'Needs measurement' : 'Unverified') + '</span>' : '<span class="v">' + full(sp[1]) + ' to ' + full(sp[2]) + '</span>') + '</div>'; }).join('');
    });
  }

  /* ---------- Boot ---------- */
  function boot(){
    renderProtoBar(); renderHeader(); renderFocusHeader(); renderFooter();
    fillGlance(); fillIcons(); applyCtas(); RI.initRanges(); initReveal(); initFaq();
    syncAllSegs(); window.addEventListener('resize', syncAllSegs);
    if(doc.fonts && doc.fonts.ready) doc.fonts.ready.then(syncAllSegs);
    if(!/^(app|admin)$/.test(PAGE)) RI.track('page_view', {page:PAGE});
    doc.dispatchEvent(new CustomEvent('ri:ready'));
  }
  if(doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})();
