/* Console: Overview. A proposal for Sam (not in APP_FLOW 7 yet): one page that gathers what needs him and how the
   engine is doing, from the other screens. Each block shows only with its permission and links to its screen. */
(function(){
  var RI = window.RI, A = RI.App, C = RI.Con, doc = document, DAY = 86400000;
  var GROUP = {draft:'draft', queued:'work', reading:'work', planning:'work', ready:'ready', open:'open'};
  /* Stages are in order, so they share one Deep Forest ramp, light to dark (checked: one hue, monotone, light end clears white) */
  var RAMP = ['#93AAA6', '#668884', '#3E625D', '#203B38'];
  var STAGES = [['draft','Draft'], ['work','Working'], ['ready','Price ready'], ['open','Presentation open']];
  var NODES = ['photo','obs','eval','dec','tasks','qty','price','checks'];
  var esc = RI.esc;
  var day = function(t){ return new Date(t).toLocaleDateString('en-US', {month:'short', day:'numeric'}); };
  var plural = function(n, one, many){ return n + ' ' + (n === 1 ? one : many); };

  /* ---------- Houses entered per day, stacked by the stage each house is in now ----------
     Daily counts are separate events, so columns, not a line. Whole-number ticks, the day's total on top, a stub for
     days with none. The legend above is the key and a filter: pick a stage to bring it forward in every column.
     Stack order, bottom to top: Presentation open, Price ready, Working, Draft (furthest along sits on the baseline) */
  var KEYS = ['draft', 'work', 'ready', 'open'];
  function scale(max){ var step = max <= 5 ? 1 : Math.ceil(max / 4), top = Math.max(2, Math.ceil(max / step) * step), t = []; for(var v = 0; v <= top; v += step) t.push(v); return {top:top, ticks:t}; }
  function breakdown(d){ return KEYS.filter(function(k){ return d.by[k]; }).map(function(k){ return d.by[k] + ' ' + STAGES[KEYS.indexOf(k)][1].toLowerCase(); }).join(', '); }
  function columns(data){
    var n = data.length, max = Math.max.apply(null, data.map(function(d){ return d.n; })), sc = scale(max), dense = n > 14, step = n <= 7 ? 1 : n <= 14 ? 2 : 5;
    var label = function(d, i){ return i === n - 1 ? 'Today' : day(d.t); };
    return '<div class="ov-cols' + (dense ? ' dense' : '') + '" style="--n:' + n + '">' +
      '<div class="ov-cy" aria-hidden="true">' + sc.ticks.map(function(v){ return '<span style="bottom:' + (v / sc.top * 100) + '%">' + v + '</span>'; }).join('') + '</div>' +
      '<div class="ov-cplot">' + sc.ticks.map(function(v){ return '<i class="ov-cg' + (v ? '' : ' base') + '" style="bottom:' + (v / sc.top * 100) + '%"></i>'; }).join('') +
        '<div class="ov-cbars" tabindex="0" role="group" aria-label="Houses entered per day, by stage. Use the left and right arrow keys to read each day.">' + data.map(function(d, i){
          var tip = label(d, i) + ': ' + plural(d.n, 'house', 'houses') + (d.n ? ' (' + breakdown(d) + ')' : '');
          return '<span class="ov-cb' + (d.n ? '' : ' z') + '" data-i="' + i + '" data-tip="' + tip + '"><span class="ov-cw" style="height:' + (d.n / sc.top * 100) + '%">' + (d.n && !dense ? '<b>' + d.n + '</b>' : '') +
            '<span class="ov-st">' + KEYS.map(function(k, j){ return d.by[k] ? '<span class="ov-sg ov-s' + j + '" style="flex:' + d.by[k] + '"></span>' : ''; }).join('') + '</span></span></span>'; }).join('') + '</div>' +
        '<span class="ov-ctip" role="status" hidden></span>' +
      '</div>' +
      '<div class="ov-cx" aria-hidden="true">' + (function(){ var k = 0; return data.map(function(d, i){ var show = i === n - 1 || (i % step === 0 && n - 1 - i >= step); if(!show) return '<span></span>'; var alt = i !== n - 1 && (k++ % 2 === 1); return '<span' + (alt ? ' class="alt"' : '') + '>' + label(d, i) + '</span>'; }).join(''); })() + '</div>' +
    '</div>' +
    '<div class="sr"><table><caption>Houses entered per day, by stage</caption><thead><tr><th scope="col">Day</th><th scope="col">Total</th>' + STAGES.map(function(s){ return '<th scope="col">' + s[1] + '</th>'; }).join('') + '</tr></thead><tbody>' +
      data.map(function(d, i){ return '<tr><th scope="row">' + label(d, i) + '</th><td>' + d.n + '</td>' + KEYS.map(function(k){ return '<td>' + d.by[k] + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  function legend(data, focus){
    return KEYS.map(function(k, j){ var n = data.reduce(function(a, d){ return a + d.by[k]; }, 0);
      return '<button type="button" class="ov-lg" data-stage="' + k + '" aria-pressed="' + (focus === k) + '"' + (n ? '' : ' disabled') + '><i class="ov-s' + j + '"></i><span>' + STAGES[j][1] + '</span><b>' + n + '</b></button>'; }).join('');
  }
  function wireCols(box){
    var bars = box.querySelector('.ov-cbars'), tip = box.querySelector('.ov-ctip'), all = [].slice.call(bars.children), cur = all.length - 1;
    function show(i){
      cur = Math.max(0, Math.min(all.length - 1, i)); all.forEach(function(b, j){ b.classList.toggle('on', j === cur); });
      var b = all[cur], pr = bars.getBoundingClientRect(), r = b.getBoundingClientRect(), bar = b.firstChild.getBoundingClientRect();
      tip.textContent = b.getAttribute('data-tip'); tip.hidden = false;
      tip.style.left = (r.left - pr.left + r.width / 2) + 'px'; tip.style.bottom = (pr.bottom - Math.min(bar.top, pr.bottom - 2) + 8) + 'px';
      tip.classList.toggle('end', cur > all.length * .6); tip.classList.toggle('start', cur < all.length * .25);
    }
    function hide(){ tip.hidden = true; all.forEach(function(b){ b.classList.remove('on'); }); }
    bars.addEventListener('mouseover', function(e){ var b = e.target.closest('.ov-cb'); if(b) show(+b.getAttribute('data-i')); });
    bars.addEventListener('mouseleave', function(){ if(doc.activeElement !== bars) hide(); });
    bars.addEventListener('focus', function(){ show(cur); });
    bars.addEventListener('blur', hide);
    bars.addEventListener('keydown', function(e){
      if(e.key === 'ArrowLeft' || e.key === 'ArrowRight'){ e.preventDefault(); show(cur + (e.key === 'ArrowLeft' ? -1 : 1)); }
      if(e.key === 'Home'){ e.preventDefault(); show(0); } if(e.key === 'End'){ e.preventDefault(); show(all.length - 1); }
    });
  }
  /* The figures that matter, in one line under the title */
  function headline(data){
    var total = data.reduce(function(a, d){ return a + d.n; }, 0), best = data.reduce(function(a, d){ return d.n > a.n ? d : a; }, {n:0});
    return '<b>' + total + '</b> in ' + data.length + ' days' + (best.n ? ' · busiest ' + day(best.t) + ' with ' + best.n : '');
  }

  C.route('/overview', function(view){
    var all = A.all().slice().sort(function(a, b){ return (b.updated || b.created) - (a.updated || a.created); });
    var stage = function(h){ return GROUP[A.status(h)]; }, count = function(k){ return all.filter(function(h){ return stage(h) === k; }).length; };
    var runs = all.filter(function(h){ return A.status(h) !== 'draft'; });
    var today = new Date(); today.setHours(0, 0, 0, 0); var T0 = today.getTime();
    var series = function(n){ var out = []; for(var i = n - 1; i >= 0; i--){ var d0 = T0 - i * DAY, hs = all.filter(function(h){ return h.created >= d0 && h.created < d0 + DAY; }), by = {draft:0, work:0, ready:0, open:0}; hs.forEach(function(h){ by[stage(h)]++; }); out.push({t:d0, n:hs.length, by:by}); } return out; };
    var focus = '';
    var per = [7, 14, 30].indexOf(+C.get('ov.per', 14)) > -1 ? +C.get('ov.per', 14) : 14;

    /* Lines and checks, counted the way Check results counts them: a held line by its first failed check */
    var lines = 0, held = 0, byCheck = C.CHECKS.map(function(){ return 0; });
    runs.forEach(function(h){ C.model(h).lines.forEach(function(l){ lines++; if(l.pass < 7){ held++; byCheck[l.checks.indexOf(false)]++; } }); });

    /* Grading: a component counts as graded once any of its steps has a grade */
    var G = C.get('grades', {}) || {}, gkeys = Object.keys(G);
    var toGrade = runs.map(function(h){
      var m = C.model(h), done = m.lines.filter(function(l){ return gkeys.some(function(k){ return k.indexOf(l.id + '|') === 0; }); }).length;
      var next = m.lines.filter(function(l){ return !gkeys.some(function(k){ return k.indexOf(l.id + '|') === 0; }); })[0];
      return {h:h, total:m.lines.length, done:done, next:next};
    });
    var open = toGrade.filter(function(x){ return x.done < x.total; });
    var week = gkeys.filter(function(k){ return G[k].at >= T0 - 6 * DAY; }).length;

    var priced = count('ready') + count('open'), paid = count('open'), inProgress = count('draft') + count('work');
    var canQueue = C.can(['rulebook.edit', 'pricing.edit', 'content.edit']), queue = C.queued().filter(C.mine);
    var bts = C.get('backtests', []) || [], untested = queue.filter(function(d){ return !bts.some(function(b){ return (b.drafts || []).indexOf(d.id) > -1; }); }).length;
    var s14 = series(14), thisWeek = s14.slice(7).reduce(function(a, d){ return a + d.n; }, 0), lastWeek = s14.slice(0, 7).reduce(function(a, d){ return a + d.n; }, 0);

    var card = function(o){ return '<section class="ov-c' + (o.cls ? ' ' + o.cls : '') + '" aria-labelledby="ov-' + o.id + '"><header class="ov-ch"><div><h2 id="ov-' + o.id + '">' + o.title + '</h2>' + (o.sub ? '<p>' + o.sub + '</p>' : '') + '</div>' + (o.link ? '<a href="' + o.link[1] + '">' + o.link[0] + RI.icon('chev','i-sm ov-go') + '</a>' : '') + '</header>' + o.body + '</section>'; };
    var kpi = function(o){ return '<a class="ov-k' + (o.cls ? ' ' + o.cls : '') + '" href="' + o.href + '"><span class="ov-kl">' + o.label + '</span><span class="ov-kv">' + o.value + (o.unit ? '<small>' + o.unit + '</small>' : '') + '</span>' + (o.visual || '') + '<span class="ov-kc">' + o.context + '</span></a>'; };
    var meter = function(part, whole, cls, tip){ return '<span class="ov-km" title="' + tip + '"><i class="' + (cls || '') + '" style="width:' + (whole ? part / whole * 100 : 0) + '%"></i></span>'; };

    /* ---------- The numbers ---------- */
    var kpis = [
      canQueue ? kpi({cls:'key', label:'Waiting to publish', value:queue.length, unit:queue.length === 1 ? 'draft' : 'drafts', href:'#/publish', context:queue.length ? (untested ? untested + ' not back-tested yet' : 'All back-tested') : 'Nothing waiting'}) :
        kpi({cls:'key', label:'Graded this week', value:week, unit:week === 1 ? 'step' : 'steps', href:'#/houses', context:open.length ? plural(open.length, 'run', 'runs') + ' still to grade' : 'Every run graded'}),
      kpi({label:'Houses', value:all.length, href:'#/houses', context:inProgress + ' in progress · ' + priced + ' priced',
        visual:'<span class="ov-kstage" aria-hidden="true">' + STAGES.map(function(s, i){ var n = count(s[0]); return n ? '<i style="flex:' + n + ';background:' + RAMP[i] + '"></i>' : ''; }).join('') + '</span>'}),
      kpi({label:'Lines held back', value:held, unit:'of ' + lines, href:'#/checks', context:(lines ? Math.round(held / lines * 100) : 0) + '% shown as unverified, never as zero', visual:meter(held, lines, 'hl', held + ' of ' + lines + ' lines held')}),
      kpi({label:'Presentations paid', value:paid, unit:'of ' + priced + ' priced', href:'#/houses?f=open', context:(priced ? Math.round(paid / priced * 100) : 0) + '% of priced houses', visual:meter(paid, priced, '', paid + ' of ' + priced + ' priced houses paid')})
    ].join('');

    /* ---------- Houses entered ---------- */
    var first = series(per);
    var trend = card({id:'trend', cls:'ov-trend', title:'Houses entered', sub:'<span id="ov-head">' + headline(first) + '</span> · ' + thisWeek + ' this week, ' + lastWeek + ' the week before', link:['House list', '#/houses'],
      body:'<div class="ov-legend" role="group" aria-label="Stage now. Pick one to bring it forward" id="ov-leg">' + legend(first, focus) + '</div><div id="ov-chart">' + columns(first) + '</div>'});

    /* ---------- Decisions to grade ---------- */
    var grade = C.can('houses.grade') ? card({id:'grade', cls:'ov-grade', title:'Decisions to grade', sub:open.length ? plural(open.length, 'run', 'runs') + ' with ungraded components, newest first' : 'Every run is graded', link:['House list', '#/houses'],
      body:(open.length ? '<ul class="ov-gl">' + open.slice(0, 5).map(function(x){ var cov = A.cover(x.h), pc = Math.round(x.done / x.total * 100);
          return '<li><a class="ov-gh" href="#/houses/' + x.h.id + '">' + (cov ? '<img src="' + cov + '" alt="" loading="lazy">' : '<span class="ov-noimg">' + RI.icon('house','i-sm') + '</span>') + '<span><b>' + esc(A.addr(x.h)) + '</b><small>' + (x.total - x.done) + ' of ' + x.total + ' components ungraded</small></span></a>' +
            '<span class="ov-gp" title="' + x.done + ' of ' + x.total + ' graded"><i style="width:' + pc + '%"></i></span>' +
            '<a class="btn btn-secondary btn-sm" href="#/houses/' + x.h.id + '/tree' + (x.next ? '?line=' + encodeURIComponent(x.next.id) : '') + '" aria-label="Grade ' + esc(A.addr(x.h)) + '">' + (x.done ? 'Continue' : 'Grade') + '</a></li>'; }).join('') + '</ul>' +
          (open.length > 5 ? '<p class="ov-more">' + plural(open.length - 5, 'more run', 'more runs') + ' in the house list</p>' : '')
        : '<div class="ov-empty">' + RI.icon('check') + '<p>Every component of every run has a grade. New runs appear here as they are priced.</p></div>') +
        '<p class="ov-foot"><b>' + week + '</b> ' + (week === 1 ? 'step' : 'steps') + ' graded this week. A grade trains the engine; it never changes a delivered price.</p>'}) : '';

    /* ---------- Where lines are held ---------- */
    var maxC = Math.max(1, Math.max.apply(null, byCheck));
    var ranked = C.CHECKS.map(function(c, i){ return {i:i, k:c[0], n:byCheck[i]}; }).sort(function(a, b){ return b.n - a.n || a.i - b.i; });
    var checks = card({id:'checks', title:'Where lines are held', sub:runs.length ? held + ' of ' + lines + ' lines across ' + plural(runs.length, 'run', 'runs') : 'No runs yet', link:['Check results', '#/checks'],
      body:runs.length ? '<ul class="ov-bars">' + ranked.map(function(r){ return '<li><a href="#/checks?ck=' + r.i + '" title="' + r.k + ': ' + plural(r.n, 'line held', 'lines held') + '"><span class="ov-bk">' + r.k + '</span><span class="ov-tr"><i style="width:' + (r.n / maxC * 100) + '%"></i></span><b' + (r.n ? '' : ' class="z"') + '>' + r.n + '</b></a></li>'; }).join('') + '</ul>' +
        '<p class="ov-foot">A held line is left out and named. The rest of the house is still priced.</p>' : '<div class="ov-empty">' + RI.icon('shield') + '<p>Lines appear here once a house is priced.</p></div>'});

    /* ---------- Photo reading accuracy ---------- */
    var acc = '';
    if(C.can('accuracy.manage') && C.ACC_SET){
      var SET = C.ACC_SET, agree = SET.filter(function(x){ return x[2] === x[3]; }).length, by = {}, order = [];
      SET.forEach(function(x){ if(!by[x[1]]){ by[x[1]] = [0, 0]; order.push(x[1]); } by[x[1]][1]++; if(x[2] === x[3]) by[x[1]][0]++; });
      order.sort(function(a, b){ return by[a][0] / by[a][1] - by[b][0] / by[b][1]; });
      acc = card({id:'acc', title:'Photo reading accuracy', sub:Math.round(agree / SET.length * 100) + '% agree with your labels · ' + agree + ' of ' + SET.length + ' photos · last run ' + day(C.get('evalAt', Date.now() - 2 * DAY)), link:['Accuracy', '#/accuracy'],
        body:'<ul class="ov-bars ov-acc">' + order.map(function(k){ var b = by[k], p = b[0] / b[1]; return '<li><a href="#/accuracy" title="' + k + ': ' + b[0] + ' of ' + b[1] + ' agree"><span class="ov-bk' + (p < .5 ? ' low' : '') + '">' + k + '</span><span class="ov-tr"><i class="' + (p < .5 ? 'hl' : '') + '" style="width:' + (p * 100) + '%"></i></span><b' + (p < .5 ? ' class="low"' : '') + '>' + b[0] + '/' + b[1] + '</b></a></li>'; }).join('') + '</ul>' +
          '<p class="ov-foot">Weakest first; under half agreeing is marked in bronze. Run the photo set again before any prompt or model change.</p>'});
    }

    /* ---------- Recent changes ---------- */
    var audit = (C.get('audit', []) || []).slice(0, 5);
    var changes = C.can('audit.view') ? card({id:'chg', cls:'ov-chg', title:'Recent changes', sub:'Every change is kept with who, when and why', link:['Audit log', '#/audit'],
      body:audit.length ? '<table class="ov-tbl"><thead><tr><th scope="col">Who</th><th scope="col">What</th><th scope="col">Why</th><th scope="col" class="r">When</th></tr></thead><tbody>' + audit.map(function(a){
          return '<tr><td><span class="ov-who">' + C.av(a.by, a.by === 'Sam' ? 'sam sm' : 'sm') + esc(a.by) + '</span></td><td><span class="ov-act">' + esc(a.action) + '</span>' + esc(a.what) + '</td><td class="m">' + esc(a.why || '') + '</td><td class="r m" title="' + C.time(a.at) + '">' + C.ago(a.at) + '</td></tr>'; }).join('') + '</tbody></table>'
        : '<div class="ov-empty">' + RI.icon('console') + '<p>No changes yet. Every edit, publish and grade will be listed here.</p></div>'}) : '';

    var dateLine = new Date().toLocaleDateString('en-US', {weekday:'long', month:'short', day:'numeric'});
    view.innerHTML = C.page({kicker:'Console', title:'Overview <span class="ov-prop h-aside">Proposal for Sam</span>', sub:dateLine + '. What needs you, and how the engine is doing. Every block opens the screen it comes from.',
      actions:'<span class="ov-per" id="ov-per" role="group" aria-label="Period for houses entered">' + [7, 14, 30].map(function(d){ return '<button type="button" data-d="' + d + '" aria-pressed="' + (d === per) + '">' + d + ' days</button>'; }).join('') + '</span>',
      body:'<div class="ov-kpis">' + kpis + '</div>' +
        '<div class="ov-row' + (grade ? ' ov-r1' : '') + '">' + trend + grade + '</div>' +
        '<div class="ov-row' + (acc ? ' ov-r2' : '') + '">' + checks + acc + '</div>' + changes});
    RI.fillIcons(view);
    var chart = doc.getElementById('ov-chart');
    wireCols(chart);
    function applyFocus(){ var c = chart.querySelector('.ov-cols'); if(focus) c.setAttribute('data-focus', focus); else c.removeAttribute('data-focus'); doc.querySelectorAll('#ov-leg [data-stage]').forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-stage') === focus); }); }
    doc.getElementById('ov-leg').addEventListener('click', function(e){ var b = e.target.closest('[data-stage]'); if(!b) return; focus = focus === b.getAttribute('data-stage') ? '' : b.getAttribute('data-stage'); applyFocus(); });
    view.querySelector('#ov-per').addEventListener('click', function(e){
      var b = e.target.closest('[data-d]'); if(!b) return; per = +b.getAttribute('data-d'); C.set('ov.per', per);
      this.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed', x === b); });
      var d = series(per); chart.innerHTML = columns(d); wireCols(chart); doc.getElementById('ov-leg').innerHTML = legend(d, focus); doc.getElementById('ov-head').innerHTML = headline(d); applyFocus();
    });
  }, {nav:'overview', perm:'houses.view'});
})();
