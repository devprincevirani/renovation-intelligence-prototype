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

  /* ---------- Houses per day: submitted and price ready, side by side ----------
     Daily counts are separate events, so grouped columns, not lines. Submitted is the day a run starts; price ready is
     the day that run finishes (the app's own run length). Two colours: Deep Forest and a light bronze (#A88A66, 3.2:1 on
     white, 3.7:1 against Deep Forest). Whole-number ticks, a readout by hover or arrow keys, and a table for screen readers */
  var SER = [['sub', 'Submitted'], ['ready', 'Price ready']];
  function scale(max){ var step = max <= 5 ? 1 : max <= 10 ? 2 : Math.ceil(max / 4), top = Math.max(2, Math.ceil(max / step) * step), t = []; for(var v = 0; v <= top; v += step) t.push(v); return {top:top, ticks:t}; }
  function runEnd(h){
    var ms = 0; A.STAGES.forEach(function(st){ ms += st[0] === 'reading' ? A.readMs(h) : st[3]; if(st[0] === 'price' && h.run.slow) ms += 9000; });
    return h.run.start + ms;
  }
  function grouped(data){
    var n = data.length, max = Math.max.apply(null, data.map(function(d){ return Math.max(d.sub, d.ready); })), sc = scale(max), step = n <= 7 ? 1 : n <= 14 ? 2 : 5;
    var label = function(d){ return day(d.t); };
    return '<div class="ov-cols ov-grp' + (n > 14 ? ' dense' : '') + '" style="--n:' + n + '">' +
      '<div class="ov-cy" aria-hidden="true">' + sc.ticks.map(function(v){ return '<span style="bottom:' + (v / sc.top * 100) + '%">' + v + '</span>'; }).join('') + '</div>' +
      '<div class="ov-cplot">' + sc.ticks.map(function(v){ return '<i class="ov-cg' + (v ? '' : ' base') + '" style="bottom:' + (v / sc.top * 100) + '%"></i>'; }).join('') +
        '<div class="ov-cbars" tabindex="0" role="group" aria-label="Houses submitted and price ready per day. Use the left and right arrow keys to read each day.">' + data.map(function(d, i){
          return '<span class="ov-cb" data-i="' + i + '" data-tip="' + label(d) + ': ' + d.sub + ' submitted, ' + d.ready + ' price ready"><span class="ov-pair">' +
            SER.map(function(s){ return '<span class="ov-gb ov-' + s[0] + (d[s[0]] ? '' : ' z') + '" style="height:' + (d[s[0]] / sc.top * 100) + '%"></span>'; }).join('') + '</span></span>'; }).join('') + '</div>' +
        '<span class="ov-ctip" role="status" hidden></span>' +
      '</div>' +
      '<div class="ov-cx" aria-hidden="true">' + data.map(function(d, i){ return i % step === 0 ? '<span' + ((i / step) % 2 ? ' class="alt"' : '') + '>' + label(d) + '</span>' : '<span></span>'; }).join('') + '</div>' +
    '</div>' +
    '<div class="sr"><table><caption>Houses submitted and price ready per day</caption><thead><tr><th scope="col">Day</th><th scope="col">Submitted</th><th scope="col">Price ready</th></tr></thead><tbody>' +
      data.map(function(d){ return '<tr><th scope="row">' + label(d) + '</th><td>' + d.sub + '</td><td>' + d.ready + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  function wireCols(box){
    var bars = box.querySelector('.ov-cbars'), tip = box.querySelector('.ov-ctip'), all = [].slice.call(bars.children), cur = all.length - 1;
    function show(i){
      cur = Math.max(0, Math.min(all.length - 1, i)); all.forEach(function(b, j){ b.classList.toggle('on', j === cur); });
      var b = all[cur], pr = bars.getBoundingClientRect(), r = b.getBoundingClientRect(), top = Math.min.apply(null, [].map.call(b.querySelectorAll('.ov-gb'), function(x){ return x.getBoundingClientRect().top; }));
      tip.textContent = b.getAttribute('data-tip'); tip.hidden = false;
      tip.style.left = (r.left - pr.left + r.width / 2) + 'px'; tip.style.bottom = (pr.bottom - Math.min(top, pr.bottom - 2) + 8) + 'px';
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
  /* The three totals under the chart */
  function totals(data, running){
    var sub = data.reduce(function(a, d){ return a + d.sub; }, 0), ready = data.reduce(function(a, d){ return a + d.ready; }, 0);
    var box = function(l, v){ return '<div><span>' + l + '</span><b>' + v + '</b></div>'; };
    return box('Submitted, ' + data.length + ' days', sub) + box('Price ready', ready) + box('Still running', running);
  }

  C.route('/overview', function(view){
    var all = A.all().slice().sort(function(a, b){ return (b.updated || b.created) - (a.updated || a.created); });
    var stage = function(h){ return GROUP[A.status(h)]; }, count = function(k){ return all.filter(function(h){ return stage(h) === k; }).length; };
    var runs = all.filter(function(h){ return A.status(h) !== 'draft'; });
    var today = new Date(); today.setHours(0, 0, 0, 0); var T0 = today.getTime();
    var series = function(n){ var out = []; for(var i = n - 1; i >= 0; i--){ var d0 = T0 - i * DAY, d1 = d0 + DAY;
        out.push({t:d0, sub:runs.filter(function(h){ return h.run && h.run.start >= d0 && h.run.start < d1; }).length,
          ready:runs.filter(function(h){ var st = stage(h); if(!h.run || (st !== 'ready' && st !== 'open')) return false; var e = runEnd(h); return e >= d0 && e < d1; }).length}); } return out; };
    var running = all.filter(function(h){ return stage(h) === 'work'; }).length;
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
    var trend = card({id:'trend', cls:'ov-trend', title:'Houses per day', sub:'<span id="ov-head">Submitted and price ready, last ' + per + ' days</span>',
      body:'<div class="ov-key" aria-hidden="true">' + SER.map(function(x){ return '<span><i class="ov-' + x[0] + '"></i>' + x[1] + '</span>'; }).join('') + '</div>' +
        '<div id="ov-chart">' + grouped(first) + '</div><div class="ov-tot" id="ov-tot">' + totals(first, running) + '</div>'});

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
      actions:'<span class="ov-per" id="ov-per" role="group" aria-label="Period for houses per day">' + [7, 14, 30].map(function(d){ return '<button type="button" data-d="' + d + '" aria-pressed="' + (d === per) + '">' + d + ' days</button>'; }).join('') + '</span>',
      body:'<div class="ov-kpis">' + kpis + '</div>' +
        '<div class="ov-row' + (grade ? ' ov-r1' : '') + '">' + trend + grade + '</div>' +
        '<div class="ov-row' + (acc ? ' ov-r2' : '') + '">' + checks + acc + '</div>' + changes});
    RI.fillIcons(view);
    var chart = doc.getElementById('ov-chart');
    wireCols(chart);
    view.querySelector('#ov-per').addEventListener('click', function(e){
      var b = e.target.closest('[data-d]'); if(!b) return; per = +b.getAttribute('data-d'); C.set('ov.per', per);
      this.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed', x === b); });
      var d = series(per); chart.innerHTML = grouped(d); wireCols(chart); doc.getElementById('ov-tot').innerHTML = totals(d, running); doc.getElementById('ov-head').textContent = 'Submitted and price ready, last ' + per + ' days';
    });
  }, {nav:'overview', perm:'houses.view'});
})();
