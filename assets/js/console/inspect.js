/* Console: the house inspector (APP_FLOW 7, M2-21, M3-18) and the decision tree with grading (M2-22, PDF section 60).
   One property end to end. Staff can read and grade; nothing here changes a house or a delivered run. */
(function(){
  var RI = window.RI, A = RI.App, C = RI.Con, doc = document;
  var PK = [['E','Essential'],['S','Standard'],['P','Premium']];
  var SEV = {C0:'No visible defect', C1:'Minor cosmetic wear', C2:'Moderate deterioration', C3:'Significant deterioration', C4:'Apparent urgent safety concern', CX:'Not enough evidence'};

  function confBar(l){
    var ok = l.conf >= l.thr;
    return '<span class="cf' + (ok ? '' : ' low') + '" title="Confidence ' + l.conf + ', threshold ' + l.thr + '"><span class="cf-t"><i style="width:' + l.conf + '%"></i><b style="left:' + l.thr + '%"></b></span><em>' + l.conf + '</em></span>';
  }
  function code(l, noRoom){ return '<span class="c-cmp"><code>' + l.code + '</code><span><b>' + RI.esc(l.item.name) + '</b>' + (noRoom ? '' : '<small>' + RI.esc(l.room) + '</small>') + '</span></span>'; }
  /* ---------- Shared by the inspector and the decision tree ---------- */
  var TRACK = [['draft','Draft'],['queued','In line'],['reading','Reading photos'],['planning','Working out the plan'],['ready','Price ready']];
  var BSMT = {finished:'Finished', partly:'Partly finished', unfinished:'Unfinished', none:'None'};
  var STEP_NAMES = {house:['1','The house'], photos:['2','Photos'], measurements:['3','Room sizes'], review:['4','Review']};
  var WORDING = 'Draft 1, November 2026';
  /* Dates as DESIGN 9 writes them: "Nov 16, 2026", with the time where it matters */
  function when(t){ return new Date(t).toLocaleString('en-US', {month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit'}); }
  /* Product states are honest answers, not errors: a dashed neutral label (DESIGN 3) */
  function stateLbl(t){ return '<span class="iv-state">' + t + '</span>'; }
  function isReady(st){ return st === 'ready' || st === 'open'; }
  function heldLines(m){ return m ? m.lines.filter(function(l){ return l.pass < 7; }) : []; }

  /* Sample data repair. A house is submitted only with the estimate disclaimer ticked (intake Review step), and photos
     only with the photo rights tick. The first demo houses were seeded without those records, so they are filled
     from dates the house already holds, with the wording version the intake uses (SECURITY 6.3). */
  function repairConsents(){
    var list = A.all(), changed = false;
    list.forEach(function(h){
      var c = h.consents || {}, start = h.run && h.run.start;
      if(!c.rights && h.rights){ c.rights = {at:start ? Math.min(h.created + 90000, start - 60000) : h.created + 90000, version:WORDING}; changed = true; }
      if(!c.estimate && h.status !== 'draft' && start){ c.estimate = {at:start - 30000, version:WORDING}; changed = true; }
      h.consents = c;
    });
    if(changed) A.saveAll(list);
  }

  /* Presentation access, in the words of APP_FLOW 9 */
  function access(h, st){
    if(h.paid) return 'Paid' + (h.paidAt ? ', ' + C.date(h.paidAt) : '');
    if(h.trialOpen) return 'Trial';
    return isReady(st) ? 'Price only' : 'No price yet';
  }
  /* Status as one compact meter: the five house statuses of APP_FLOW 9, the current one named.
     "Taking longer" replaces the working step it belongs to */
  function statusCell(h){
    var st = A.status(h), rs = A.runState(h), keys = TRACK.map(function(t){ return t[0]; });
    var cur = st === 'open' ? 4 : Math.max(0, keys.indexOf(st)), label = rs.slow ? 'Taking longer' : TRACK[cur][1];
    return '<span class="iv-status"><b>' + label + '</b><small>Step ' + (cur + 1) + ' of 5</small><span class="iv-seg" aria-hidden="true" title="' + TRACK.map(function(t){ return t[1]; }).join(', then ') + '">' +
      TRACK.map(function(t, i){ return '<i class="' + (i <= cur ? 'on' : '') + '"></i>'; }).join('') + '</span></span>';
  }
  /* The house record: photo, who and where, the four facts staff look for first, and the tabs as the card's lower edge */
  function head(h, active, m, tabs){
    var st = A.status(h), o = C.owner(h.owner), cov = A.cover(h), ready = isReady(st), held = heldLines(m).length;
    var rel = st === 'draft' ? '<span class="muted">Not run yet</span>' : !ready ? '<span class="muted">When the run finishes</span>' : held ? stateLbl('Partial planning estimate') : '<span class="rel rel-ok">Complete planning estimate</span>';
    var act = active === 'tree' ? '<a class="btn btn-secondary" href="#/houses/' + h.id + '">' + RI.icon('list','i-sm') + 'Back to the inspector</a>'
      : m && ready ? '<a class="btn btn-primary" href="#/houses/' + h.id + '/tree">' + RI.icon('sliders','i-sm') + 'Open the decision tree</a>' : '';
    var run = m ? '<code>' + m.run + '</code><small>v' + (h.version || 1) + ', started ' + C.date(m.at) + '</small>' : '<span class="muted">None yet</span><small>v' + (h.version || 1) + '</small>';
    return '<a class="c-back" href="#/houses">' + RI.icon('arrow','i-sm flip') + 'House list</a>' +
      '<header class="iv-rec' + (tabs ? ' has-tabs' : '') + '">' +
        (cov ? '<img class="iv-cover" src="' + cov + '" alt="Front of ' + RI.esc(A.addr(h)) + '">' : '<span class="iv-cover iv-nocover">' + RI.icon('house') + '</span>') +
        '<div class="iv-main"><div class="iv-top"><div class="iv-id"><p class="c-kicker">' + (active === 'tree' ? 'Decision tree' : 'House inspector') + '</p><h1>' + RI.esc(A.addr(h)) + '</h1>' +
          '<p class="iv-sub"><span>' + RI.esc(A.place(h)) + '</span><span>' + RI.esc(o.name) + ', ' + RI.esc(o.type) + '</span>' + (h.client ? '<span>Client ' + RI.esc(h.client) + '</span>' : '') + '</p></div>' +
          (act ? '<div class="iv-act">' + act + '</div>' : '') + '</div>' +
          '<dl class="iv-facts"><div><dt>Status</dt><dd>' + statusCell(h) + '</dd></div><div><dt>Release</dt><dd>' + rel + '</dd></div><div><dt>Presentation</dt><dd>' + access(h, st) + '</dd></div><div><dt>Run</dt><dd>' + run + '</dd></div></dl></div>' +
        (tabs || '') + '</header>';
  }

  /* ---------- Overview cards ---------- */
  function niceTop(v){ var p = Math.pow(10, Math.floor(Math.log10(Math.max(v, 1)))), s = [1, 2, 2.5, 5, 10]; for(var i = 0; i < s.length; i++) if(s[i] * p >= v) return s[i] * p; return 10 * p; }
  function kmoney(v){ return v >= 1000 ? '$' + (v / 1000).toLocaleString('en-US', {maximumFractionDigits:1}) + 'k' : '$' + v; }
  /* What would let a held line be priced (DESIGN 8.5: unknowns say what would verify them) */
  function unlock(l){
    var i = l.checks.indexOf(false);
    if(i === 1) return 'Priced once the ' + RI.esc(l.room.toLowerCase()) + ' size is typed or measured';
    if(i === 2) return 'Priced once a clear photo shows the ' + RI.esc(l.item.name.toLowerCase());
    if(i === 3) return 'Priced once a rate or product is published for this region';
    return 'Check ' + (i + 1) + ', ' + C.CHECKS[i][0].toLowerCase() + '. Staff see this line; users do not';
  }
  function priceCard(h, m){
    var held = heldLines(m), off = h.off || {};
    /* Only lines that passed all seven checks reach a total (PDF 57) */
    var tot = PK.map(function(k){ var lo = 0, hi = 0; m.lines.forEach(function(l){ var a = l.item.pk[k[0]]; if(l.pass === 7 && !off[l.item.id] && a && a[1] != null){ lo += a[1]; hi += a[2]; } }); return {k:k, lo:lo, hi:hi}; });
    var top = niceTop(Math.max.apply(null, tot.map(function(t){ return t.hi; })) * 1.04), goals = {};
    (RI.PACKAGES || []).forEach(function(p){ goals[p.key] = p.goal; });
    var rows = tot.map(function(t){
      return '<div class="iv-pk"><div class="iv-pk-n"><b>' + t.k[1] + '</b><small>' + RI.esc(goals[t.k[0]] || '') + '</small></div>' +
        '<div class="iv-pk-l"><span class="rl thick' + (held.length ? ' partial' : '') + '" data-low="' + t.lo + '" data-high="' + t.hi + '"></span></div>' +
        '<div class="iv-pk-v">' + C.range(t.lo, t.hi) + (held.length ? '<small>Partial</small>' : '') + '</div></div>';
    }).join('');
    var axis = '<div class="iv-pk iv-axis" aria-hidden="true"><span></span><div class="iv-pk-l"><span>$0</span><span>' + kmoney(top / 2) + '</span><span>' + kmoney(top) + '</span></div><span></span></div>';
    var out = held.length
      ? '<div class="iv-out"><h3>Left out of these totals <span class="iv-n warn">' + held.length + '</span></h3><ul>' + held.map(function(l){
          return '<li>' + code(l) + '<div class="iv-out-w">' + stateLbl(C.whyHeld(l)) + '<small>' + unlock(l) + '</small></div></li>'; }).join('') + '</ul>' +
          '<button type="button" class="iv-link" data-tab="checks">See all seven checks for every line' + RI.icon('arrow','i-sm') + '</button></div>'
      : '<p class="iv-allok">' + RI.icon('check','i-sm') + 'Every line passed all seven checks. Nothing is left out.</p>';
    return '<section class="c-card iv-price iv-wide"><header><div><h2>Price by package</h2><p class="iv-hint">The three goals on one scale. Low and High only.</p></div>' + (held.length ? stateLbl('Partial') : '<span class="rel rel-ok">Complete</span>') + '</header>' +
      '<div class="iv-pks" data-scale="0,' + top + '">' + rows + axis + '</div>' + out +
      C.note('A line that is not priced is left out of the total and named here, never counted as zero.') + '</section>';
  }
  /* The run end to end: each stage of APP_FLOW 7's inspector, with its count, opens its tab */
  function pathCard(h, m){
    var rooms = A.roomsFor(h), withPh = rooms.filter(function(r){ return A.photoCount(h, r[0]); }).length, noPh = rooms.filter(function(r){ return r[0] !== 'other' && !A.photoCount(h, r[0]); }).length;
    var low = m.lines.filter(function(l){ return l.conf < l.thr; }).length, measure = m.lines.filter(function(l){ return l.checks[1] === false; }).length;
    var held = heldLines(m).length, n = m.lines.length;
    var st = [
      ['photos', 'Photos', A.photoCount(h), withPh + ' rooms' + (noPh ? ', ' + noPh + ' without' : '')],
      ['obs', 'Observations', n + ' parts', low ? low + ' below threshold' : 'All above threshold'],
      ['dec', 'Decisions', n + ' × 3', 'One per goal, ' + m.rulesV],
      ['qty', 'Quantities', (n - measure) + ' of ' + n, measure ? measure + (measure === 1 ? ' needs' : ' need') + ' measurement' : 'All supported'],
      ['checks', 'Checks', (n - held) + ' of ' + n, held ? held + ' held' : 'All passed'],
      ['ledger', 'Ledger', n + ' entries', 'Pinned to ' + m.run]
    ];
    return '<section class="c-card iv-wide"><header><div><h2>From photo to price</h2><p class="iv-hint">This run, stage by stage. Open a stage to see every line.</p></div></header><ol class="iv-path">' + st.map(function(s, i){
      return '<li><button type="button" data-tab="' + s[0] + '"><span class="iv-path-i">' + (i + 1) + '</span><span class="iv-path-t">' + s[1] + '</span><b class="num">' + s[2] + '</b><small' + (/held|need|below|without/.test(s[3]) ? ' class="warn"' : '') + '>' + s[3] + '</small></button></li>';
    }).join('') + '</ol></section>';
  }
  function draftCard(h){
    var s = STEP_NAMES[h.step] || STEP_NAMES.house, miss = A.roomsFor(h).filter(function(r){ return r[0] !== 'other' && !A.photoCount(h, r[0]); }).map(function(r){ return r[1]; });
    return '<section class="c-card iv-wait iv-wide"><header><div><h2>No run yet</h2><p class="iv-hint">The owner has not submitted this house. The run starts when they do.</p></div>' + C.lbl('draft') + '</header>' +
      '<dl class="iv-kv"><dt>Where they are</dt><dd>Step ' + s[0] + ' of 4, ' + s[1] + '</dd><dt>Photos so far</dt><dd>' + A.photoCount(h) + '</dd>' +
      '<dt>Rooms without photos</dt><dd>' + (miss.length ? RI.esc(miss.join(', ')) : 'None') + '</dd></dl>' +
      C.note('Rooms without photos will show as unverified once the house is run.') + '</section>';
  }
  /* While the run works: the named stages, not a lone spinner (DESIGN 8.4). Updated by the route's timer */
  function progressCard(h){
    var rs = A.runState(h), cur = rs.stage || 0;
    return '<section class="c-card iv-wait iv-wide" id="iv-prog"><header><div><h2>Run in progress</h2><p class="iv-hint">Decisions, quantities and prices appear here when the run finishes. This page updates by itself.</p></div>' +
      '<span class="lb lb-queued">' + (rs.slow ? 'Taking longer' : 'Working') + '</span></header><ol class="iv-stages">' + A.STAGES.map(function(s, i){
        var now = i === cur, extra = now && s[0] === 'reading' ? rs.read + ' of ' + rs.photos + ' photos' : now ? Math.round((rs.stageProgress || 0) * 100) + '%' : i < cur ? 'Done' : '';
        return '<li class="' + (i < cur ? 'done' : now ? 'now' : '') + '"><i aria-hidden="true">' + (i < cur ? RI.icon('check','i-sm') : '') + '</i><span><b>' + s[1] + '</b><small>' + s[2] + '</small></span><em class="num">' + extra + '</em></li>';
      }).join('') + '</ol></section>';
  }
  function factsCard(h){
    var f = h.facts || {}, names = {}, sizes = h.sizes || {};
    A.roomsFor(h).forEach(function(r){ names[r[0]] = r[1]; });
    var rows = [['Year built', f.year || 'Not given'], ['Above grade', f.sqft ? (+f.sqft).toLocaleString('en-US') + ' sq ft' : 'Not given'], ['Stories', f.stories || 'Not given'], ['Bedrooms', f.beds != null ? f.beds : 'Not given'], ['Full baths', f.baths || 'Not given'], ['Half baths', f.halfBaths || 0], ['Basement', BSMT[f.basement] || 'Not given'], ['Finished basement', f.basementSqft ? (+f.basementSqft).toLocaleString('en-US') + ' sq ft' : 'Not given']];
    var sz = Object.keys(sizes).filter(function(k){ return sizes[k] && sizes[k].l && sizes[k].w; });
    return '<section class="c-card"><header><h2>Facts as entered</h2><span class="iv-ev" title="Typed by the owner at intake"><i aria-hidden="true"></i>Reported</span></header>' +
      '<dl class="iv-kv">' + rows.map(function(r){ return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl>' +
      '<h3 class="iv-h3">Room sizes <span class="muted">intake step 3, optional</span></h3>' +
      (sz.length ? '<dl class="iv-kv">' + sz.map(function(k){ var s = sizes[k]; return '<dt>' + RI.esc(names[k] || k) + '</dt><dd>' + s.l + ' × ' + s.w + ' ft <small>' + Math.round(s.l * s.w) + ' sq ft</small></dd>'; }).join('') + '</dl>'
        : '<p class="iv-none">None typed. Quantities come from the photos and the room templates.</p>') + '</section>';
  }
  function runCard(h, m, ready){
    return '<section class="c-card"><header><h2>This run</h2>' + (ready ? '<span class="lb lb-pub">Delivered</span>' : '<span class="lb lb-queued">Working</span>') + '</header>' +
      '<dl class="iv-kv"><dt>Run</dt><dd><code>' + m.run + '</code></dd><dt>Started</dt><dd>' + when(m.at) + '</dd><dt>Rules</dt><dd>' + m.rulesV + '</dd><dt>Rates</dt><dd>' + m.ratesV + '</dd><dt>Products</dt><dd>' + m.productsV + '</dd><dt>Fingerprint</dt><dd><code>' + m.fp + '</code></dd>' +
      (ready ? '<dt>Lines</dt><dd>' + m.lines.length + ' <small>' + m.lines.filter(function(l){ return l.pass === 7; }).length + ' passed all seven checks</small></dd>' : '') + '</dl>' +
      C.note('The run keeps the versions it was made with. A new version of a rule or rate only reaches new runs.') + '</section>';
  }
  function consent(c, notYet){ return c ? 'Ticked <small>' + when(c.at) + '<br>Wording: ' + RI.esc(c.version || WORDING) + '</small>' : '<span class="muted">' + notYet + '</span>'; }
  function consentCard(h, st){
    var c = h.consents || {}, sh = h.shares || [], act = sh.filter(function(s){ return s.active; }).length;
    return '<section class="c-card"><header><h2>Consents and access</h2></header><dl class="iv-kv">' +
      '<dt>Photo rights</dt><dd>' + consent(c.rights, 'Not yet') + '</dd>' +
      '<dt>Estimate disclaimer</dt><dd>' + consent(c.estimate, st === 'draft' ? 'Not yet, asked at Review' : 'Not yet') + '</dd>' +
      '<dt>Presentation</dt><dd>' + access(h, st) + '</dd>' +
      '<dt>Share links</dt><dd>' + (sh.length ? act + ' active, ' + (sh.length - act) + ' expired' : 'None') + '</dd>' +
      '<dt>Feedback</dt><dd>' + (h.feedback ? RI.esc(h.feedback.v) : '<span class="muted">None yet</span>') + '</dd></dl></section>';
  }

  /* ---------- Observations: four separate scales (PDF 33), each drawn as a position on its own scale ---------- */
  var SCALES = {condition:['Excellent','Good','Serviceable','Worn','Poor'], modern:['Current','Acceptable','Dated','Strongly dated'], character:['High','Moderate','Low','None'], func:['Good','Adequate','Limited']};
  var SEV_SHORT = {C0:'None', C1:'Minor', C2:'Moderate', C3:'Significant', C4:'Urgent', CX:'Not enough evidence'};
  function scaleCell(kind, v){
    var s = SCALES[kind], i = s.indexOf(v);
    if(i < 0) return stateLbl(v || 'Unknown');
    return '<span class="iv-sc" title="' + RI.esc(v) + ', ' + (i + 1) + ' of ' + s.length + ': ' + s.join(', ') + '"><span>' + RI.esc(v) + '</span><span class="iv-sc-m" aria-hidden="true">' + s.map(function(x, k){ return '<i' + (k === i ? ' class="on"' : '') + '></i>'; }).join('') + '</span></span>';
  }
  function sevCell(c){ return '<span class="iv-sev iv-sev-' + c + '" title="' + SEV[c] + '"><b>' + c + '</b>' + SEV_SHORT[c] + '</span>'; }
  function confCell(l){
    var low = l.conf < l.thr;
    return '<span class="iv-cf' + (low ? ' low' : '') + '" title="Confidence ' + l.conf + ', threshold ' + l.thr + '"><span class="iv-cf-t" aria-hidden="true"><i style="width:' + l.conf + '%"></i><b style="left:' + l.thr + '%"></b></span><span class="iv-cf-n"><b>' + l.conf + '</b><small>' + (low ? 'below ' + l.thr : 'needs ' + l.thr) + '</small></span></span>';
  }

  /* ---------- Quantities (GLOSSARY: gross, net, demolition, order; users see net, the rest stays in the console) ---------- */
  var WASTE = {FL:.1, TL:.12, TR:.1, CT:.08, EX:.1, RF:.1, BT:.1};
  function parseQty(q){ var x = /([\d,]+(?:\.\d+)?)\s*(sq ft|linear ft|each|fixtures?|in|rooms?)/.exec(q || ''); return x ? {n:+x[1].replace(/,/g, ''), u:x[2].replace(/s$/, '')} : null; }
  function fmtQ(n, u){ return '<span class="num">' + Math.round(n).toLocaleString('en-US') + '</span> <small>' + u + '</small>'; }
  function quantities(l, pk){
    var a = l.item.pk[pk], q = parseQty(l.item.qty);
    if(!a || !a[0]) return {none:'Not in this goal'};
    if(/^keep/i.test(a[0])) return {none:'Kept, no work'};
    if(!q) return {unknown:true};
    var r = C.rnd(l.id + ':q'), area = q.u === 'sq ft' || q.u === 'linear ft', replace = /replace|^new|install|remove|tear/i.test(a[0]);
    var gross = area ? Math.round(q.n * (1.03 + r() * .09)) : q.n;
    var demo = replace ? (area ? gross : q.n) : null;
    var order = l.fam === 'PT' && area ? {n:Math.ceil(q.n * 2 / 350), u:'gal'} : {n:area ? Math.ceil(q.n * (1 + (WASTE[l.fam] || .05))) : q.n, u:q.u};
    return {net:q, gross:gross, demo:demo, order:order};
  }

  /* ---------- House inspector ---------- */
  C.route('/houses/:id', function(view, p){
    var h = A.get ? A.all().filter(function(x){ return x.id === p.id; })[0] : null;
    if(!h){ view.innerHTML = C.page({title:'That house is not here', sub:'It may have been removed, or the link is wrong.', back:['#/houses','House list']}); return; }
    repairConsents(); h = A.all().filter(function(x){ return x.id === p.id; })[0];
    var st = A.status(h), ready = isReady(st), m = C.model(h), tab = C.query().tab || 'overview', qpk = h.pk || 'S', obsF = 'all';
    var held = heldLines(m).length;
    var tabs = [['overview','Overview'],['photos','Photos',A.photoCount(h)]];
    if(m && ready) tabs = tabs.concat([['obs','Observations',m.lines.length],['dec','Decisions'],['qty','Quantities and prices'],['checks','Checks',held, held ? 'warn' : ''],['ledger','Ledger']]);
    if(!tabs.some(function(t){ return t[0] === tab; })) tab = 'overview';
    view.innerHTML = '<div class="c-page iv">' + head(h, 'inspector', m,
      '<div class="iv-tabs" role="tablist" aria-label="Inspector sections">' + tabs.map(function(t){ return '<button type="button" role="tab" id="ivt-' + t[0] + '" aria-controls="in-body" data-v="' + t[0] + '" aria-selected="' + (t[0] === tab) + '" tabindex="' + (t[0] === tab ? 0 : -1) + '">' + t[1] + (t[2] != null ? '<span class="iv-n' + (t[3] ? ' ' + t[3] : '') + '"' + (t[0] === 'checks' ? ' title="Lines held by a check"' : '') + '>' + t[2] + '</span>' : '') + '</button>'; }).join('') + '</div>') +
      '<div id="in-body" class="iv-body" role="tabpanel" tabindex="-1"></div></div>';
    C.crumb(A.addr(h));
    /* Every photo in one numbered list, room by room. A photo is flagged when a part of its room could not be read
       from it (check 3, condition clear); rooms with no photo are named, so nothing unverified is hidden (DESIGN 0) */
    function photoList(){
      var list = [], rooms = A.roomsFor(h), unclear = {};
      if(m && ready) m.lines.forEach(function(l){ if(l.checks[2] === false) (unclear[l.roomKey] = unclear[l.roomKey] || []).push(l.item.name.toLowerCase()); });
      rooms.forEach(function(r){
        (h.photos[r[0]] || []).filter(function(x){ return x.state === 'done'; }).forEach(function(x){ list.push({src:x.src, room:r[1], key:r[0], flags:x.flags || [], why:[]}); });
      });
      Object.keys(unclear).forEach(function(k){
        for(var i = list.length - 1; i >= 0; i--) if(list[i].key === k || list[i].key.indexOf(k + '-') === 0){ list[i].why = unclear[k]; break; }
      });
      list.forEach(function(x, i){ x.n = i + 1; });
      return {list:list, miss:rooms.filter(function(r){ return r[0] !== 'other' && !A.photoCount(h, r[0]); })};
    }
    /* A larger view of one photo, with the previous and next */
    function openPhoto(i){
      var P = photoList().list, d = C.dialog('Photo', '<div id="iv-lb"></div>', {wide:true});
      function draw(){
        var x = P[i], why = x.why.length ? 'Too unclear to read the ' + RI.esc(x.why.join(' and the ')) : (x.flags || []).length ? RI.esc(x.flags.join(', ')) : '';
        d.querySelector('.dlg-head h2').textContent = 'Photo ' + x.n + ' of ' + P.length + ', ' + x.room;
        d.querySelector('#iv-lb').innerHTML = '<figure class="iv-lb"><img src="' + x.src + '" alt="' + RI.esc(x.room) + ', photo ' + x.n + '">' + (why ? '<figcaption>' + (x.why.length ? stateLbl('Unverified') : '') + '<span>' + why + '</span></figcaption>' : '') + '</figure>' +
          '<div class="iv-lb-nav"><button type="button" class="btn btn-secondary" data-lb="-1"' + (i ? '' : ' disabled') + '>' + RI.icon('arrow','i-sm flip') + 'Previous</button><span class="muted small">' + x.n + ' of ' + P.length + '</span><button type="button" class="btn btn-secondary" data-lb="1"' + (i < P.length - 1 ? '' : ' disabled') + '>Next' + RI.icon('arrow','i-sm') + '</button></div>';
        RI.fillIcons(d);
      }
      d.addEventListener('click', function(e){ var b = e.target.closest('[data-lb]'); if(b && !b.disabled){ i += +b.getAttribute('data-lb'); draw(); } });
      d.addEventListener('keydown', function(e){ if(e.key === 'ArrowRight' && i < P.length - 1){ i++; draw(); } if(e.key === 'ArrowLeft' && i > 0){ i--; draw(); } });
      draw();
    }
    function sec(title, hint, inner, aside){ return '<section class="iv-sec"><header><div><h2>' + title + '</h2>' + (hint ? '<p class="iv-hint">' + hint + '</p>' : '') + '</div>' + (aside || '') + '</header>' + inner + '</section>'; }
    function body(){
      var el = doc.getElementById('in-body'), html = '';
      el.setAttribute('aria-labelledby', 'ivt-' + tab);
      if(tab === 'overview'){
        var main = ready ? priceCard(h, m) + pathCard(h, m) : st === 'draft' ? draftCard(h) : progressCard(h);
        html = '<div class="iv-ov' + (m ? '' : ' no-run') + '">' + main + factsCard(h) + (m ? runCard(h, m, ready) : '') + consentCard(h, st) + '</div>';
      }
      if(tab === 'photos'){
        var P = photoList(), notes = [];
        P.miss.forEach(function(r){ notes.push('No photo shows the ' + RI.esc(r[1].toLowerCase()) + ', so its parts stay unverified.'); });
        P.list.forEach(function(x){ (x.why || []).forEach(function(w){ notes.push('Photo ' + x.n + ' is too unclear to read the ' + RI.esc(w) + ', so that part stays unverified.'); }); });
        html = P.list.length ? '<section class="c-card iv-phs"><div class="iv-ph">' + P.list.map(function(x, i){
            var flag = x.why.length || (x.flags || []).length;
            return '<button type="button" class="iv-tile" data-ph="' + i + '" aria-label="Open photo ' + x.n + ', ' + RI.esc(x.room) + (flag ? ', unverified' : '') + '"><img src="' + x.src + '" alt="" loading="lazy">' +
              '<span class="iv-tile-l">' + x.n + '. ' + RI.esc(x.room) + '</span>' + (flag ? '<span class="iv-tile-f"><i aria-hidden="true"></i>' + (x.why.length ? 'Unverified' : RI.esc(x.flags[0])) + '</span>' : '') + '</button>';
          }).join('') + '</div>' + (notes.length ? '<ul class="iv-phn">' + notes.map(function(t){ return '<li>' + t + '</li>'; }).join('') + '</ul>' : (ready ? '<p class="iv-phn">Every room has a photo, and every part could be read from them.</p>' : '')) + '</section>'
          : '<div class="c-empty">' + RI.icon('camera') + '<p>No photos yet. They appear here as the owner adds them.</p></div>';
      }
      if(tab === 'obs'){
        var PL = photoList().list, below = m.lines.filter(function(l){ return l.conf < l.thr; });
        var sevs = ['C0','C1','C2','C3','C4','CX'].map(function(c){ return [c, m.lines.filter(function(l){ return l.sev === c; }).length]; }).filter(function(x){ return x[1]; });
        var keep = function(l){ return obsF === 'all' ? true : obsF === 'low' ? l.conf < l.thr : l.sev === obsF; };
        var filt = '<div class="iv-obsf" id="iv-obsf" role="group" aria-label="Show"><button type="button" data-f="all" aria-pressed="' + (obsF === 'all') + '">All parts <span class="iv-n">' + m.lines.length + '</span></button>' +
          '<button type="button" data-f="low" aria-pressed="' + (obsF === 'low') + '"' + (below.length ? '' : ' disabled') + '>Below threshold <span class="iv-n' + (below.length ? ' warn' : '') + '">' + below.length + '</span></button><span class="iv-obsf-s" aria-hidden="true"></span>' +
          sevs.map(function(x){ return '<button type="button" data-f="' + x[0] + '" aria-pressed="' + (obsF === x[0]) + '" title="' + SEV[x[0]] + '"><span class="iv-sev iv-sev-' + x[0] + '"><b>' + x[0] + '</b></span>' + SEV_SHORT[x[0]] + ' <span class="iv-n">' + x[1] + '</span></button>'; }).join('') + '</div>';
        /* Photos of the line's room: up to its photo count, each opens the larger view */
        var thumbs = function(l){
          if(!l.photos) return stateLbl('No photo');
          var mine = PL.map(function(x, i){ return [x, i]; }).filter(function(p){ return p[0].key === l.roomKey || p[0].key.indexOf(l.roomKey + '-') === 0; });
          if(!mine.length) return '<span class="muted">' + l.photos + ' photo' + (l.photos > 1 ? 's' : '') + '</span>';
          var start = (l.code.charCodeAt(3) || 0) % mine.length, pick = [];
          for(var k = 0; k < Math.min(l.photos, mine.length, 2); k++) pick.push(mine[(start + k) % mine.length]);
          return '<span class="iv-thumbs">' + pick.map(function(p){ return '<button type="button" data-ph="' + p[1] + '" aria-label="Open photo ' + p[0].n + '"><img src="' + p[0].src + '" alt="" loading="lazy"></button>'; }).join('') + (l.photos > pick.length ? '<small>+' + (l.photos - pick.length) + '</small>' : '') + '</span>';
        };
        var cols = ['Component','Evidence','Condition','Modernisation','Character','Function','Severity','Confidence'];
        var groups = [], seen = {};
        m.lines.filter(keep).forEach(function(l){ if(!seen[l.room]){ seen[l.room] = {room:l.room, lines:[]}; groups.push(seen[l.room]); } seen[l.room].lines.push(l); });
        var rows = groups.map(function(g){
          var gl = g.lines.filter(function(l){ return l.conf < l.thr; }).length;
          return '<tr class="iv-grp"><th colspan="' + (cols.length + 1) + '" scope="rowgroup"><span>' + RI.esc(g.room) + '</span><small>' + g.lines.length + ' part' + (g.lines.length > 1 ? 's' : '') + (gl ? ', ' + gl + ' below threshold' : '') + '</small></th></tr>' +
            g.lines.map(function(l){
              var cells = [code(l, true), thumbs(l), scaleCell('condition', l.scales.condition), scaleCell('modern', l.scales.modern), scaleCell('character', l.scales.character), scaleCell('func', l.scales.func), sevCell(l.sev), confCell(l)];
              return '<tr data-go="#/houses/' + h.id + '/tree?line=' + encodeURIComponent(l.id) + '" tabindex="0" role="link" aria-label="Follow ' + RI.esc(l.item.name) + ' in the decision tree"' + (l.conf < l.thr ? ' class="is-low"' : '') + '>' +
                cells.map(function(c, i){ return '<td data-label="' + cols[i] + '">' + c + '</td>'; }).join('') + '<td class="iv-go" data-label="" aria-hidden="true">' + RI.icon('arrow','i-sm') + '</td></tr>';
            }).join('');
        }).join('');
        html = sec('Observations', 'What the photos show for each part, on four separate scales: a part can be sound and still look dated (PDF section 33). Open a line to follow it in the decision tree.', filt +
          (rows ? '<div class="c-tbl-wrap"><table class="c-tbl iv-tbl iv-obs"><thead><tr>' + cols.map(function(c){ return '<th scope="col">' + c + '</th>'; }).join('') + '<th scope="col"><span class="sr">Open</span></th></tr></thead><tbody>' + rows + '</tbody></table></div>'
            : '<div class="c-empty">' + RI.icon('info') + '<p>No part matches this filter.</p></div>') +
          C.note('Each small scale shows where the word sits, best on the left. The tick on a confidence bar is that part\'s threshold; below it, the part stays unverified.'));
      }
      if(tab === 'dec') html = sec('Decisions', 'One action per part under each goal, made before any pricing and from the same evidence.',
        C.table({cls:'iv-tbl', cols:[{label:'Component'},{label:'Essential'},{label:'Standard'},{label:'Premium'},{label:'Rule'}],
          rows:m.lines.map(function(l){ return {attr:'data-go="#/houses/' + h.id + '/tree?line=' + encodeURIComponent(l.id) + '" tabindex="0" role="link"', cells:[code(l)].concat(PK.map(function(k){ var a = l.item.pk[k[0]]; return a && a[0] ? (/^keep/i.test(a[0]) ? '<span class="muted">' + RI.esc(a[0]) + '</span>' : RI.esc(a[0])) : '<span class="muted">Not in this goal</span>'; })).concat(['<code>' + l.rule + '</code> <small class="muted">v' + l.ruleV + '</small>'])}; })}));
      if(tab === 'qty'){
        var pkName = PK.filter(function(k){ return k[0] === qpk; })[0][1];
        html = sec('Quantities and prices', 'Net is what the user sees. Gross, demolition and order stay in the console. An unknown quantity is left empty, never zero.', '<div class="iv-qtool">' + C.seg('iv-qpk', PK, qpk) + '</div>' +
          C.table({cls:'iv-tbl iv-qty', cols:[{label:'Component'},{label:'Work under ' + pkName},{label:'Net', num:true},{label:'Gross', num:true},{label:'Demolition', num:true},{label:'Order', num:true},{label:'Low and High', num:true}],
            rows:m.lines.map(function(l){ var q = quantities(l, qpk), a = l.item.pk[qpk] || [], why = C.whyHeld(l), price;
              if(why) price = stateLbl(why); else if(a[1] != null) price = C.range(a[1], a[2]); else price = '<span class="muted">No cost</span>';
              var work = a[0] ? RI.esc(a[0]) + (a[3] ? '<small class="iv-prod">' + RI.esc(a[3]) + '</small>' : '') : '<span class="muted">Not in this goal</span>';
              var e = '<span class="muted">None</span>';
              var cells = q.none ? ['<span class="muted">' + q.none + '</span>', '', '', ''] : q.unknown ? [stateLbl('Needs measurement'), '<span class="muted">Not known</span>', '<span class="muted">Not known</span>', '<span class="muted">Not known</span>']
                : [fmtQ(q.net.n, q.net.u) + '<small class="iv-src">' + RI.esc(l.qsrc) + (l.qconf && l.qsrc !== 'Not known' ? ', confidence ' + l.qconf : '') + '</small>', fmtQ(q.gross, q.net.u), q.demo != null ? fmtQ(q.demo, q.net.u) : e, fmtQ(q.order.n, q.order.u)];
              return {cells:[code(l), work].concat(cells).concat([price])}; })}) +
          C.note('Every quantity belongs to one component and one scope action (QT-RULE-048). Order adds waste for the trade; paint is ordered in gallons for two coats. Sample values.'));
      }
      if(tab === 'checks'){
        var fails = C.CHECKS.map(function(c, i){ return m.lines.filter(function(l){ return !l.checks[i]; }).length; });
        html = sec('Checks', 'No line shows a price until it passes all seven. A failed check never becomes a number, and one held line never blocks the house.',
          '<ol class="iv-cks">' + C.CHECKS.map(function(c, i){ return '<li class="' + (fails[i] ? 'has' : '') + '"><span class="iv-ck-i">' + (i + 1) + '</span><span><b>' + c[0] + '</b><small>' + c[1] + '</small></span><em>' + (fails[i] ? fails[i] + ' held' : 'All pass') + '</em></li>'; }).join('') + '</ol>' +
          C.table({cls:'iv-tbl iv-ckt', cols:[{label:'Component'}].concat(C.CHECKS.map(function(c, i){ return {label:String(i + 1), num:true}; })).concat([{label:'Result'}]),
            rows:m.lines.map(function(l){ return {cells:[code(l)].concat(l.checks.map(function(ok){ return ok ? '<span class="ck ok" aria-label="Passed">' + RI.icon('check','i-sm') + '</span>' : '<span class="ck no" aria-label="Held">' + RI.icon('x','i-sm') + '</span>'; })).concat([l.pass === 7 ? '<span class="rel rel-ok">Priced</span>' : stateLbl(C.whyHeld(l))])}; })}));
      }
      if(tab === 'ledger') html = sec('Verification ledger', 'How each line was verified: evidence, measurement, rule, rate and product, checks.', C.table({cls:'iv-tbl', cols:[{label:'Component'},{label:'Evidence used'},{label:'Measurement source'},{label:'Rule'},{label:'Rate and product'},{label:'Checks', num:true}],
        rows:m.lines.map(function(l){ return {cells:[code(l), l.photos ? 'photo_' + (20 + l.code.length + l.photos) + (l.photos > 1 ? ' and ' + (l.photos - 1) + ' more' : '') + ', intake field' : 'Intake field', l.qsrc + (l.qconf ? ', confidence ' + l.qconf : ''), l.rule + ' v' + l.ruleV, m.ratesV + ', ' + m.productsV, l.pass + ' of 7']}; })}) +
        C.note('Computed ' + when(m.at) + ', run ' + m.run + '. The partial or complete label is computed from the checks, never chosen by a screen.'), C.chip(m.run));
      el.innerHTML = html; RI.fillIcons(el); RI.initRanges(el);
      el.querySelectorAll('.rl').forEach(function(r){ r.classList.add('drawn'); });
    }
    function show(t, focus){
      tab = t;
      view.querySelectorAll('.iv-tabs [data-v]').forEach(function(x){ var on = x.getAttribute('data-v') === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; if(on && focus) x.focus(); });
      history.replaceState(null, '', '#/houses/' + h.id + '?tab=' + t); body();
    }
    var tl = view.querySelector('.iv-tabs');
    tl.addEventListener('click', function(e){ var b = e.target.closest('[data-v]'); if(b) show(b.getAttribute('data-v')); });
    tl.addEventListener('keydown', function(e){
      var keys = tabs.map(function(t){ return t[0]; }), i = keys.indexOf(tab), n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? keys.length - 1 : null;
      if(n == null) return; e.preventDefault(); show(keys[(n + keys.length) % keys.length], true);
    });
    view.addEventListener('click', function(e){
      var t = e.target.closest('[data-tab]'); if(t){ show(t.getAttribute('data-tab')); tl.scrollIntoView({block:'nearest'}); return; }
      var of = e.target.closest('#iv-obsf [data-f]'); if(of){ obsF = of.getAttribute('data-f'); body(); return; }
      var s = e.target.closest('#iv-qpk [data-v]'); if(s){ qpk = s.getAttribute('data-v'); body(); return; }
      var ph = e.target.closest('[data-ph]'); if(ph){ e.stopPropagation(); openPhoto(+ph.getAttribute('data-ph')); return; }
      var r = e.target.closest('[data-go]'); if(r) C.go(r.getAttribute('data-go'));
    });
    view.addEventListener('keydown', function(e){ var r = e.target.closest('[data-go]'); if(r && e.key === 'Enter' && !e.target.closest('button')) C.go(r.getAttribute('data-go')); });
    body();
    /* A working house updates by itself: the stage list moves, and the page redraws when the status changes */
    if(st !== 'draft' && !ready) C.every(function(){
      if(A.status(h) !== st){ C.render(); return; }
      var pc = doc.getElementById('iv-prog'); if(pc){ var tmp = doc.createElement('div'); tmp.innerHTML = progressCard(h); pc.replaceWith(tmp.firstChild); RI.fillIcons(doc.getElementById('iv-prog')); }
    }, 1000);
  }, {nav:'houses', perm:'houses.view'});

  /* ---------- Decision tree with grading ---------- */
  var GR = [['correct','Correct','check'],['wrong','Wrong','x'],['alt','Valid alternative','refresh']];
  function grades(){ return C.get('grades', {}); }
  C.route('/houses/:id/tree', function(view, p){
    var h = A.all().filter(function(x){ return x.id === p.id; })[0], m = h && C.model(h);
    if(!m){ view.innerHTML = C.page({title:'No decision tree yet', sub:'This house has not been run.', back:['#/houses' + (h ? '/' + h.id : ''), h ? 'House inspector' : 'House list']}); return; }
    var q = C.query(), cur = q.line || m.lines[0].id, pk = q.pk || 'S', stepIn = !!q.line;
    view.innerHTML = '<div class="c-page">' + head(h, 'tree', m) +
      (C.crumb(A.addr(h), '#/houses/' + h.id, 'Decision tree') || '') + '<div class="tr-wrap' + (stepIn ? ' in' : '') + '" id="tr-wrap"><aside class="c-list tr-nav" aria-label="Components">' + C.seg('tr-pk', PK.map(function(k){ return [k[0], k[1]]; }), pk) + '<div id="tr-list"></div></aside><section class="tr-chain" id="tr-chain" aria-live="polite"></section></div></div>';
    function list(){
      var g = grades(), byRoom = {};
      m.lines.forEach(function(l){ (byRoom[l.room] = byRoom[l.room] || []).push(l); });
      doc.getElementById('tr-list').innerHTML = Object.keys(byRoom).map(function(r){ return '<p class="c-list-g">' + RI.esc(r) + '</p>' + byRoom[r].map(function(l){
        var n = Object.keys(g).filter(function(k){ return k.indexOf(l.id + '|') === 0; }).length;
        return '<button type="button" class="c-li' + (l.id === cur ? ' on' : '') + '" data-line="' + l.id + '"><span><b>' + RI.esc(l.item.name) + '</b><small>' + (l.pass < 7 ? C.whyHeld(l) : RI.esc((l.item.pk[pk] || ['Not in this goal'])[0])) + '</small></span>' + (n ? '<span class="tr-g" title="' + n + ' grade' + (n > 1 ? 's' : '') + '">' + RI.icon('check','i-sm') + n + '</span>' : (l.pass < 7 ? '<span class="tr-dot" aria-label="Held"></span>' : '')) + '</button>'; }).join(''); }).join('');
      RI.fillIcons(doc.getElementById('tr-list'));
    }
    function node(n, key, title, body, l){
      var g = grades()[l.id + '|' + key + '|' + pk];
      return '<li class="tr-n" data-node="' + key + '"><span class="tr-step">' + n + '</span><div class="tr-card"><header><h3>' + title + '</h3>' +
        (g ? '<span class="gr gr-' + g.v + '">' + RI.icon(GR.filter(function(x){ return x[0] === g.v; })[0][2],'i-sm') + GR.filter(function(x){ return x[0] === g.v; })[0][1] + '</span>' : '') + '</header>' + body +
        (C.can('houses.grade') ? '<div class="gr-row"><span class="small muted gr-who">' + (g ? 'Graded by ' + RI.esc(g.by) + ', ' + C.ago(g.at) + (g.note ? ': “' + RI.esc(g.note) + '”' : '') + ' <button type="button" class="linkbtn small" data-clear="' + key + '">Clear</button>' : 'Grade this step') + '</span><div class="gr-btns" role="group" aria-label="Grade ' + title + '">' + GR.map(function(x){ return '<button type="button" data-grade="' + x[0] + '" data-key="' + key + '"' + (g && g.v === x[0] ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' + RI.icon(x[2],'i-sm') + x[1] + '</button>'; }).join('') + '</div></div><div class="gr-note" data-note="' + key + '" hidden></div>' : '') +
        '</div></li>';
    }
    function chain(){
      var l = m.lines.filter(function(x){ return x.id === cur; })[0], a = l.item.pk[pk], ruleT = C.ruleText ? C.ruleText(l.rule) : '', ev = (RI.EVIDENCE || {})[l.item.ev] || {}, ps = ((h.photos || {})[l.roomKey] || []).filter(function(x){ return x.state === 'done'; }).slice(0, l.photos || 0);
      var held = C.whyHeld(l), action = a ? a[0] : 'Not in this goal';
      var reason = a ? 'We suggest “' + action.toLowerCase() + '” because it looks ' + l.scales.condition.toLowerCase() + ' but ' + l.scales.modern.toLowerCase() + (l.photos ? ' in ' + l.photos + ' photo' + (l.photos > 1 ? 's' : '') : '') + '.' : '';
      doc.getElementById('tr-chain').innerHTML = '<button type="button" class="c-back tr-back" id="tr-back">' + RI.icon('arrow','i-sm flip') + 'All components</button>' +
        '<section class="tr-five"><h2>' + RI.esc(l.item.name) + ' <code>' + l.code + '</code></h2><dl>' +
          '<div><dt>What is it</dt><dd>' + RI.esc(l.item.name) + ', ' + RI.esc(l.room.toLowerCase()) + '</dd></div><div><dt>What condition</dt><dd>' + l.scales.condition + ', ' + l.scales.modern.toLowerCase() + '</dd></div><div><dt>How do we know</dt><dd>' + (l.photos ? 'Seen in ' + l.photos + ' photo' + (l.photos > 1 ? 's' : '') : 'No photo of this part') + '</dd></div><div><dt>What could be done</dt><dd>' + RI.esc(action) + '</dd></div><div><dt>How certain</dt><dd>' + l.conf + ' of 100, threshold ' + l.thr + '</dd></div></dl></section>' +
        '<ol class="tr">' +
          node(1, 'photo', 'Photo', ps.length ? '<div class="tr-ph">' + ps.map(function(x){ return '<img src="' + x.src + '" alt="">'; }).join('') + '</div>' : '<p class="tr-p muted">No photo of this part. That is why it cannot pass check 3.</p>', l) +
          node(2, 'obs', 'Observation', '<p class="tr-p"><b>' + RI.esc(l.item.name) + '</b> in the ' + RI.esc(l.room.toLowerCase()) + '. Family ' + (C.FAMILY[l.fam] || l.fam) + '. Evidence: ' + (ev.label || l.item.ev) + '.</p>', l) +
          node(3, 'eval', 'Evaluation', '<div class="tr-sc"><span><small>Condition</small><b>' + l.scales.condition + '</b></span><span><small>Modernisation</small><b>' + l.scales.modern + '</b></span><span><small>Character</small><b>' + l.scales.character + '</b></span><span><small>Function</small><b>' + l.scales.func + '</b></span></div><p class="tr-p"><span class="sev sev-' + l.sev + '">' + l.sev + '</span> ' + SEV[l.sev] + '. ' + confBar(l) + '</p>', l) +
          node(4, 'dec', 'Decision', '<p class="tr-p"><b>' + RI.esc(action) + '</b></p>' + (reason ? '<p class="tr-p muted">' + RI.esc(reason) + '</p>' : '') + '<p class="tr-rule"><code>' + l.rule + '</code> v' + l.ruleV + (ruleT ? ' · ' + RI.esc(ruleT) : '') + ' <a href="#/rules/' + l.rule + '">Open the rule</a></p>', l) +
          node(5, 'tasks', 'Tasks', a && a[1] != null ? '<p class="tr-p"><code>' + C.presetFor(l, pk) + '</code> ' + RI.esc(C.presetName ? C.presetName(C.presetFor(l, pk)) : '') + ' <a href="#/packages?tab=presets&p=' + C.presetFor(l, pk) + '">Open the preset</a></p>' : '<p class="tr-p muted">No tasks: the part is kept under this goal.</p>', l) +
          node(6, 'qty', 'Quantity', '<p class="tr-p"><b>' + RI.esc(l.item.qty || '') + '</b> · ' + l.qsrc + (l.qconf ? ', confidence ' + l.qconf : '') + '</p>' + (l.item.state === 'measure' ? '<p class="tr-p muted">Needs measurement: ' + RI.esc(l.item.fix || 'the room size') + '.</p>' : ''), l) +
          node(7, 'price', 'Price', a && a[1] != null && !held ? '<p class="tr-p">' + C.range(a[1], a[2]) + ' · ' + m.ratesV + (a[3] ? ' · ' + RI.esc(a[3]) : '') + '</p>' : '<p class="tr-p"><span class="rel rel-part">' + (held || 'No cost under this goal') + '</span></p>', l) +
          node(8, 'checks', 'Checks', '<ul class="tr-ck">' + C.CHECKS.map(function(c, i){ return '<li class="' + (l.checks[i] ? 'ok' : 'no') + '">' + RI.icon(l.checks[i] ? 'check' : 'x','i-sm') + c[0] + '</li>'; }).join('') + '</ul>', l) +
        '</ol>' + navFoot() + C.note('A grade never changes a delivered result. Grades feed the back-test and become rule candidates for Sam.');
      var tc = doc.getElementById('tr-chain');
      tc.insertAdjacentHTML('afterbegin', progress());
      RI.fillIcons(tc);
    }
    var wrap = view.querySelector('#tr-wrap');
    view.addEventListener('click', function(e){
      var li = e.target.closest('[data-line]'); if(li){ cur = li.getAttribute('data-line'); wrap.classList.add('in'); history.replaceState(null, '', '#/houses/' + h.id + '/tree?line=' + encodeURIComponent(cur) + '&pk=' + pk); list(); chain(); if(innerWidth < 900) window.scrollTo(0, wrap.offsetTop - 70); return; }
      if(e.target.closest('#tr-back')){ wrap.classList.remove('in'); return; }
      var pb = e.target.closest('#tr-pk [data-v]'); if(pb){ pk = pb.getAttribute('data-v'); view.querySelectorAll('#tr-pk [data-v]').forEach(function(x){ x.setAttribute('aria-selected', x === pb); }); list(); chain(); return; }
    });
    var NODES = ['photo','obs','eval','dec','tasks','qty','price','checks'], NAMES = {photo:'photo', obs:'observation', eval:'evaluation', dec:'decision', tasks:'tasks', qty:'quantity', price:'price', checks:'checks'};
    function lineOf(id){ return m.lines.filter(function(x){ return x.id === id; })[0]; }
    function gradedLine(id){ var g = grades(); return NODES.some(function(k){ return g[id + '|' + k + '|' + pk]; }); }
    function progress(){
      var n = m.lines.filter(function(x){ return gradedLine(x.id); }).length, pc = Math.round(n / m.lines.length * 100), l = lineOf(cur), allOk = NODES.every(function(k){ var g = grades()[l.id + '|' + k + '|' + pk]; return g && g.v === 'correct'; });
      return '<div class="tr-prog"><div><p><b>' + n + ' of ' + m.lines.length + '</b> components graded under ' + PK.filter(function(k){ return k[0] === pk; })[0][1] + '</p><span class="tr-pbar"><i style="width:' + pc + '%"></i></span></div>' +
        (C.can('houses.grade') ? '<button type="button" class="btn btn-secondary btn-sm" id="tr-allok"' + (allOk ? ' disabled' : '') + '>' + RI.icon('check','i-sm') + (allOk ? 'All steps correct' : 'Mark every step correct') + '</button>' : '') + '</div>';
    }
    function navFoot(){
      var i = m.lines.map(function(x){ return x.id; }).indexOf(cur), pv = m.lines[i - 1], nx = m.lines[i + 1];
      return '<nav class="tr-foot" aria-label="Components">' + (pv ? '<button type="button" class="tr-nb" data-line="' + pv.id + '">' + RI.icon('arrow','i-sm flip') + '<span><small>Previous</small>' + RI.esc(pv.item.name) + '</span></button>' : '<span></span>') +
        '<span class="tr-keys" aria-hidden="true"><kbd>←</kbd><kbd>→</kbd> move · <kbd>C</kbd> correct</span>' +
        (nx ? '<button type="button" class="tr-nb nx" data-line="' + nx.id + '"><span><small>Next</small>' + RI.esc(nx.item.name) + '</span>' + RI.icon('arrow','i-sm') + '</button>' : '<span></span>') + '</nav>';
    }
    function save(key, v, note, quiet){
      var l = lineOf(cur), all = grades(), id = l.id + '|' + key + '|' + pk, before = all[id];
      if(v) all[id] = {v:v, note:note || '', by:C.me().name, at:Date.now()}; else delete all[id];
      C.set('grades', all);
      if(v) C.log('Graded', l.item.name + ' on ' + A.addr(h) + ': ' + GR.filter(function(x){ return x[0] === v; })[0][1].toLowerCase() + ' (' + NAMES[key] + ')', note || '', 'tree');
      if(!quiet){ var t = RI.toast(v ? GR.filter(function(x){ return x[0] === v; })[0][1] + ' saved for the ' + NAMES[key] + '.' : 'Grade cleared.', 'check'); undoable(t, function(){ var a2 = grades(); if(before) a2[id] = before; else delete a2[id]; C.set('grades', a2); list(); chain(); }); }
      list(); var y = window.scrollY; chain(); window.scrollTo(0, y);
    }
    /* A small "Undo" inside the toast */
    function undoable(t, fn){ setTimeout(function(){ var el = doc.querySelector('.toasts .toast:last-child, .toasts > *:last-child'); if(!el || el.querySelector('.tr-undo')) return; var b = doc.createElement('button'); b.type = 'button'; b.className = 'tr-undo'; b.textContent = 'Undo'; b.addEventListener('click', function(){ fn(); el.remove(); }); el.appendChild(b); }, 20); }
    function noteBox(key, v){
      doc.querySelectorAll('.gr-note').forEach(function(n){ n.hidden = true; n.innerHTML = ''; });
      var box = doc.querySelector('[data-note="' + key + '"]'), g = GR.filter(function(x){ return x[0] === v; })[0]; if(!box) return;
      box.hidden = false;
      box.innerHTML = '<label for="gr-n" class="small"><b>' + g[1] + ':</b> what should it be? <span class="muted">A sentence helps Sam.</span></label><textarea class="input" id="gr-n" rows="2" placeholder="' + (v === 'wrong' ? 'For example: the boxes are water damaged, replace' : 'For example: painting would also reach the goal') + '"></textarea><div class="gr-na"><button type="button" class="btn btn-secondary btn-sm" data-ncancel>Cancel</button><button type="button" class="btn btn-primary btn-sm" data-nsave="' + key + '" data-v="' + v + '">Save the grade</button></div>';
      var ta = box.querySelector('#gr-n'); ta.focus();
      ta.addEventListener('keydown', function(e){ if(e.key === 'Enter' && (e.metaKey || e.ctrlKey)){ e.preventDefault(); save(key, v, ta.value.trim()); } if(e.key === 'Escape'){ box.hidden = true; } });
    }
    view.addEventListener('click', function(e){
      var gb = e.target.closest('[data-grade]'); if(gb){ var k = gb.getAttribute('data-key'), v = gb.getAttribute('data-grade'); if(v === 'correct') save(k, 'correct', ''); else noteBox(k, v); return; }
      var cl = e.target.closest('[data-clear]'); if(cl){ save(cl.getAttribute('data-clear'), null); return; }
      if(e.target.closest('[data-ncancel]')){ e.target.closest('.gr-note').hidden = true; return; }
      var ns = e.target.closest('[data-nsave]'); if(ns){ save(ns.getAttribute('data-nsave'), ns.getAttribute('data-v'), doc.getElementById('gr-n').value.trim()); return; }
      if(e.target.closest('#tr-allok')){ var l = lineOf(cur), all = grades(); NODES.forEach(function(k){ var id = l.id + '|' + k + '|' + pk; if(!all[id]) all[id] = {v:'correct', note:'', by:C.me().name, at:Date.now()}; }); C.set('grades', all); C.log('Graded', l.item.name + ' on ' + A.addr(h) + ': every step correct', '', 'tree');
        var i = m.lines.map(function(x){ return x.id; }).indexOf(cur), nx = m.lines[i + 1]; RI.toast('Every step marked correct.' + (nx ? ' Moving to ' + nx.item.name + '.' : ''), 'check'); if(nx) go(nx.id); else { list(); chain(); } }
    });
    function go(id){ cur = id; wrap.classList.add('in'); history.replaceState(null, '', '#/houses/' + h.id + '/tree?line=' + encodeURIComponent(cur) + '&pk=' + pk); list(); chain(); var on = doc.querySelector('.tr-nav .c-li.on'); if(on) on.scrollIntoView({block:'nearest'}); window.scrollTo(0, innerWidth < 900 ? wrap.offsetTop - 70 : 0); }
    /* Keyboard: arrows move between components, C marks every step correct */
    var onKey = function(e){
      var t = e.target; if(!doc.getElementById('tr-chain') || /INPUT|TEXTAREA|SELECT/.test(t.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
      var ids = m.lines.map(function(x){ return x.id; }), i = ids.indexOf(cur);
      if(e.key === 'ArrowRight' && ids[i + 1]){ e.preventDefault(); go(ids[i + 1]); }
      if(e.key === 'ArrowLeft' && ids[i - 1]){ e.preventDefault(); go(ids[i - 1]); }
      if((e.key === 'c' || e.key === 'C') && C.can('houses.grade')){ var b = doc.getElementById('tr-allok'); if(b && !b.disabled){ e.preventDefault(); b.click(); } }
    };
    doc.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', function off(){ doc.removeEventListener('keydown', onKey); window.removeEventListener('hashchange', off); });
    list(); chain();
  }, {nav:'houses', perm:'houses.view'});
})();
