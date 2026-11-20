/* Console: Overview. A proposal for Sam (not in APP_FLOW 7 yet): what moved this week and what needs him.
   Charts can show "Example data" (a labelled sample at the scale of a working pilot) or "This browser" (the prototype's
   own houses). The lists (publish queue, activity, decisions to grade) always use this browser, so every link is real.
   Each block shows only with its permission and opens the screen it comes from. */
(function(){
  var RI = window.RI, A = RI.App, C = RI.Con, doc = document, DAY = 86400000, esc = RI.esc, I = RI.icon;
  var GROUP = {draft:'draft', queued:'work', reading:'work', planning:'work', ready:'ready', open:'open'};
  var day = function(t){ return new Date(t).toLocaleDateString('en-US', {month:'short', day:'numeric'}); };
  var date = function(t){ return new Date(t).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'}); };
  var fmt = function(n){ return n.toLocaleString('en-US'); };
  var plural = function(n, one, many){ return n + ' ' + (n === 1 ? one : many); };
  /* Seven checks, one colour each: Sam's palette first, then the design guide's meaning colours. Always with a label and a number */
  var CHECK_COLORS = ['#887F72', '#203B38', '#A17D58', '#D8C9B5', '#33607E', '#31693F', '#9D3629'];

  /* Example data: two weeks at the scale of a working pilot. Shown with a clear label */
  var EX = {
    sub:[3, 4, 2, 5, 6, 4, 3, 5, 7, 6, 4, 8, 7, 6], ready:[3, 3, 2, 5, 5, 4, 3, 4, 6, 6, 4, 7, 6, 5],
    paid:[0, 1, 0, 1, 1, 0, 1, 1, 2, 1, 1, 2, 2, 1], held:[6, 5, 6, 4, 5, 4, 4, 3, 4, 3, 3, 2, 3, 2],
    checks:[3, 38, 41, 12, 4, 9, 10], acc:{photos:1240, agree:1133, weakest:'ceiling lights'}
  };

  /* ---------- Small charts ---------- */
  function spark(arr, tone){
    var w = 112, h = 34, max = Math.max(1, Math.max.apply(null, arr)), n = arr.length;
    var pts = arr.map(function(v, i){ return [i / (n - 1) * (w - 6) + 3, h - 4 - v / max * (h - 10)]; });
    var line = 'M' + pts.map(function(p){ return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L'), last = pts[n - 1];
    return '<svg class="k3-sp ' + tone + '" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><path class="f" d="' + line + ' L' + last[0].toFixed(1) + ',' + h + ' L3,' + h + ' Z"/><path class="l" d="' + line + '"/><circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="3"/></svg>';
  }
  function delta(now, before, goodWhenDown, absolute){
    var d = now - before, good = goodWhenDown ? d < 0 : d > 0;
    var txt = d === 0 ? 'No change' : absolute || !before ? (d > 0 ? '+' : '') + d : (d > 0 ? '+' : '') + Math.round(d / before * 100) + '%';
    return '<span class="k3-d ' + (d === 0 ? 'flat' : good ? 'good' : 'bad') + '">' + txt + '</span>';
  }
  /* Grouped columns: submitted and price ready per day, whole-number ticks, readout by hover or arrow keys */
  function columns(days){
    var n = days.length, max = Math.max.apply(null, days.map(function(d){ return Math.max(d.sub, d.ready); }));
    var step = max <= 5 ? 1 : max <= 10 ? 2 : Math.ceil(max / 4), top = Math.max(2, Math.ceil(max / step) * step), ticks = [];
    for(var v = 0; v <= top; v += step) ticks.push(v);
    return '<div class="g3" style="--n:' + n + '"><div class="g3-y" aria-hidden="true">' + ticks.map(function(v){ return '<span style="bottom:' + (v / top * 100) + '%">' + v + '</span>'; }).join('') + '</div>' +
      '<div class="g3-p">' + ticks.map(function(v){ return '<i style="bottom:' + (v / top * 100) + '%"' + (v ? '' : ' class="b"') + '></i>'; }).join('') +
        '<div class="g3-b" tabindex="0" role="group" aria-label="Houses submitted and price ready per day. Use the left and right arrow keys to read each day.">' + days.map(function(d, i){
          return '<span data-i="' + i + '" data-tip="' + day(d.t) + ': ' + d.sub + ' submitted, ' + d.ready + ' price ready"><i class="s' + (d.sub ? '' : ' z') + '" style="height:' + (d.sub / top * 100) + '%"></i><i class="r' + (d.ready ? '' : ' z') + '" style="height:' + (d.ready / top * 100) + '%"></i></span>'; }).join('') + '</div>' +
        '<span class="g3-tip" role="status" hidden></span></div>' +
      '<div class="g3-x" aria-hidden="true">' + days.map(function(d, i){ return '<span' + (i % 4 === 2 ? ' class="alt"' : '') + '>' + (i % 2 === 0 ? day(d.t) : '') + '</span>'; }).join('') + '</div></div>' +
      '<div class="sr"><table><caption>Houses submitted and price ready per day</caption><thead><tr><th scope="col">Day</th><th scope="col">Submitted</th><th scope="col">Price ready</th></tr></thead><tbody>' +
        days.map(function(d){ return '<tr><th scope="row">' + day(d.t) + '</th><td>' + d.sub + '</td><td>' + d.ready + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  function wireColumns(box){
    var bars = box.querySelector('.g3-b'); if(!bars) return;
    var tip = box.querySelector('.g3-tip'), all = [].slice.call(bars.children), cur = all.length - 1;
    function show(i){
      cur = Math.max(0, Math.min(all.length - 1, i)); all.forEach(function(b, j){ b.classList.toggle('on', j === cur); });
      var b = all[cur], pr = bars.getBoundingClientRect(), r = b.getBoundingClientRect(), top = Math.min.apply(null, [].map.call(b.children, function(x){ return x.getBoundingClientRect().top; }));
      tip.textContent = b.getAttribute('data-tip'); tip.hidden = false;
      tip.style.left = (r.left - pr.left + r.width / 2) + 'px'; tip.style.bottom = (pr.bottom - Math.min(top, pr.bottom - 2) + 8) + 'px';
      tip.classList.toggle('end', cur > all.length * .6); tip.classList.toggle('start', cur < all.length * .25);
    }
    function hide(){ tip.hidden = true; all.forEach(function(b){ b.classList.remove('on'); }); }
    bars.addEventListener('mouseover', function(e){ var b = e.target.closest('[data-i]'); if(b) show(+b.getAttribute('data-i')); });
    bars.addEventListener('mouseleave', function(){ if(doc.activeElement !== bars) hide(); });
    bars.addEventListener('focus', function(){ show(cur); });
    bars.addEventListener('blur', hide);
    bars.addEventListener('keydown', function(e){
      if(e.key === 'ArrowLeft' || e.key === 'ArrowRight'){ e.preventDefault(); show(cur + (e.key === 'ArrowLeft' ? -1 : 1)); }
      if(e.key === 'Home'){ e.preventDefault(); show(0); } if(e.key === 'End'){ e.preventDefault(); show(all.length - 1); }
    });
  }
  function ring(pct){
    var R = 52, CIRC = 2 * Math.PI * R;
    return '<div class="r3-ring"><svg viewBox="0 0 128 128" aria-hidden="true"><circle class="tr" cx="64" cy="64" r="' + R + '"/><circle class="pr" cx="64" cy="64" r="' + R + '" stroke-dasharray="' + (CIRC * pct).toFixed(1) + ' ' + CIRC.toFixed(1) + '" transform="rotate(-90 64 64)"/></svg><span><b>' + (Math.round(pct * 1000) / 10) + '%</b><small>accuracy</small></span></div>';
  }
  function donut(counts){
    var total = counts.reduce(function(a, b){ return a + b; }, 0), R = 54, CIRC = 2 * Math.PI * R, off = 0, gap = total > 1 ? 3 : 0;
    var segs = counts.map(function(n, i){ if(!n) return ''; var len = n / total * CIRC, s = '<circle cx="70" cy="70" r="' + R + '" stroke="' + CHECK_COLORS[i] + '" stroke-dasharray="' + Math.max(0, len - gap).toFixed(1) + ' ' + CIRC.toFixed(1) + '" stroke-dashoffset="' + (-off).toFixed(1) + '" transform="rotate(-90 70 70)"/>'; off += len; return s; }).join('');
    return '<div class="d3"><div class="d3-c"><svg viewBox="0 0 140 140" aria-hidden="true"><circle class="tr" cx="70" cy="70" r="' + R + '"/>' + segs + '</svg><span><b>' + total + '</b><small>' + (total === 1 ? 'line' : 'lines') + '</small></span></div>' +
      '<ul class="d3-l">' + C.CHECKS.map(function(c, i){ return '<li' + (counts[i] ? '' : ' class="z"') + '><a href="#/checks?ck=' + i + '"><i style="background:' + CHECK_COLORS[i] + '"></i><span>' + (i + 1) + '. ' + c[0] + '</span><b>' + counts[i] + '</b></a></li>'; }).join('') + '</ul></div>';
  }

  C.route('/overview', function(view){
    var all = A.all().slice().sort(function(a, b){ return ((b.run && b.run.start) || b.created) - ((a.run && a.run.start) || a.created); });
    var stage = function(h){ return GROUP[A.status(h)]; };
    var runs = all.filter(function(h){ return h.run && A.status(h) !== 'draft'; });
    var today = new Date(); today.setHours(0, 0, 0, 0); var T0 = today.getTime();
    var mode = C.get('ov.data', 'example') === 'browser' ? 'browser' : 'example';

    /* ---------- This browser's numbers ---------- */
    var runEnd = function(h){ var ms = 0; A.STAGES.forEach(function(st){ ms += st[0] === 'reading' ? A.readMs(h) : st[3]; if(st[0] === 'price' && h.run.slow) ms += 9000; }); return h.run.start + ms; };
    var heldOf = function(h){ return C.model(h).lines.filter(function(l){ return l.pass < 7; }).length; };
    var perDay = function(fn){ var out = []; for(var i = 13; i >= 0; i--){ var d0 = T0 - i * DAY; out.push(fn(d0, d0 + DAY)); } return out; };
    var byCheck = C.CHECKS.map(function(){ return 0; });
    runs.forEach(function(h){ C.model(h).lines.forEach(function(l){ if(l.pass < 7) byCheck[l.checks.indexOf(false)]++; }); });
    var SET = C.ACC_SET || [], agree = SET.filter(function(x){ return x[2] === x[3]; }).length, comp = {};
    SET.forEach(function(x){ var c = comp[x[1]] = comp[x[1]] || [0, 0]; c[1]++; if(x[2] === x[3]) c[0]++; });
    var weakest = Object.keys(comp).sort(function(a, b){ return comp[a][0] / comp[a][1] - comp[b][0] / comp[b][1]; })[0];
    var BR = {
      sub:perDay(function(a, b){ return runs.filter(function(h){ return h.run.start >= a && h.run.start < b; }).length; }),
      ready:perDay(function(a, b){ return runs.filter(function(h){ var s = stage(h), e = runEnd(h); return (s === 'ready' || s === 'open') && e >= a && e < b; }).length; }),
      paid:perDay(function(a, b){ return all.filter(function(h){ return h.paidAt >= a && h.paidAt < b; }).length; }),
      held:perDay(function(a, b){ return runs.filter(function(h){ return h.run.start >= a && h.run.start < b; }).reduce(function(s, h){ return s + heldOf(h); }, 0); }),
      checks:byCheck, acc:{photos:SET.length, agree:agree, weakest:weakest ? weakest.toLowerCase() : ''}
    };
    var D = mode === 'example' ? EX : BR;
    var sum = function(arr, from, to){ return arr.slice(from, to).reduce(function(s, v){ return s + v; }, 0); };
    var days = D.sub.map(function(v, i){ return {t:T0 - (13 - i) * DAY, sub:v, ready:D.ready[i]}; });
    var running = mode === 'example' ? sum(D.sub) - sum(D.ready) : all.filter(function(h){ return stage(h) === 'work'; }).length;

    var card = function(o){ return '<section class="c3' + (o.cls ? ' ' + o.cls : '') + '" aria-labelledby="o3-' + o.id + '"><header class="c3-h"><div><h2 id="o3-' + o.id + '">' + o.title + '</h2>' + (o.sub ? '<p>' + o.sub + '</p>' : '') + '</div>' + (o.aside || '') + '</header>' + o.body + (o.foot ? '<footer class="c3-f' + (o.footCls ? ' ' + o.footCls : '') + '">' + o.foot + '</footer>' : '') + '</section>'; };
    var link = function(href, text){ return '<a href="' + href + '">' + text + ' ' + I('arrow', 'i-sm') + '</a>'; };

    /* ---------- KPI cards ---------- */
    var kpi = function(icon, label, value, sp, dl, note, href){ return '<a class="k3" href="' + href + '"><span class="k3-h"><span class="k3-ic">' + I(icon, 'i-sm') + '</span>' + label + '</span><span class="k3-m"><b>' + value + '</b>' + sp + '</span><span class="k3-f">' + dl + '<span>' + note + '</span></span></a>'; };
    var kpis = '<div class="k3s">' +
      kpi('house', 'Houses submitted, 7 days', sum(D.sub, 7), spark(D.sub, 'fg'), delta(sum(D.sub, 7), sum(D.sub, 0, 7)), 'vs the week before', '#/houses') +
      kpi('check', 'Prices ready', sum(D.ready, 7), spark(D.ready, 'fg'), delta(sum(D.ready, 7), sum(D.ready, 0, 7)), 'vs the week before', '#/houses?f=ready') +
      kpi('file', 'Paid presentations', sum(D.paid, 7), spark(D.paid, 'fg'), delta(sum(D.paid, 7), sum(D.paid, 0, 7), false, true), 'this week', '#/houses?f=open') +
      kpi('shield', 'Lines held by checks', sum(D.held, 7), spark(D.held, 'br'), delta(sum(D.held, 7), sum(D.held, 0, 7), true), 'fewer is better', '#/checks') + '</div>';

    /* ---------- Houses per day ---------- */
    var trend = card({id:'trend', cls:'c3-trend', title:'Houses per day', sub:'Submitted and price ready, last 14 days',
      aside:'<div class="c3-key" aria-hidden="true"><span><i class="s"></i>Submitted</span><span><i class="r"></i>Price ready</span></div>',
      body:'<div class="c3-b" id="o3-chart">' + columns(days) + '<div class="t3"><div><span>Submitted, 14 days</span><b>' + sum(D.sub) + '</b></div><div><span>Price ready</span><b>' + sum(D.ready) + '</b></div><div><span>Still running</span><b>' + running + '</b></div></div></div>'});

    /* ---------- Photo reading accuracy ---------- */
    var acc = C.can('accuracy.manage') ? '<section class="c3 c3-dark" aria-labelledby="o3-acc">' + ring(D.acc.photos ? D.acc.agree / D.acc.photos : 0) +
      '<div class="acc-t"><h2 id="o3-acc">Photo reading accuracy</h2><p>' + fmt(D.acc.photos) + ' labelled photos. ' + fmt(D.acc.agree) + ' agree with your labels.' + (D.acc.weakest ? ' Weakest: ' + esc(D.acc.weakest) + '.' : '') + '</p>' + link('#/accuracy', 'See accuracy') + '</div></section>' : '';

    /* ---------- Waiting for Sam ---------- */
    var canQueue = C.can(['rulebook.edit', 'pricing.edit', 'content.edit']), q = C.queued().filter(C.mine), bts = C.get('backtests', []) || [];
    var btOf = function(d){ return bts.filter(function(b){ return (b.drafts || []).indexOf(d.id) > -1; })[0]; };
    var wait = canQueue ? card({id:'wait', title:'Waiting for Sam', sub:q.length ? plural(q.length, 'draft', 'drafts') + ' in the publish queue' : 'Nothing in the publish queue',
      body:q.length ? '<ul class="w3">' + q.slice(0, 5).map(function(d){ var b = btOf(d), f = b ? b.res.dbl + b.res.broken + b.res.skip : 0;
          return '<li><i aria-hidden="true"></i><span>' + esc(d.title) + '</span>' + (b ? (f ? '<em class="bad">Back-test found issues</em>' : '<em class="good">Back-test clean</em>') : '<em>Back-test not run</em>') + '</li>'; }).join('') + '</ul>'
        : '<div class="e3">' + I('check') + '<p>No drafts are waiting. New edits land here for Sam to publish.</p></div>',
      foot:link('#/publish', 'Review the queue')}) : '';

    /* ---------- Why lines did not price ---------- */
    var totalHeld = D.checks.reduce(function(a, b){ return a + b; }, 0);
    var why = card({id:'why', title:'Why lines did not price', sub:'By check, ' + (mode === 'example' ? 'last 14 days' : 'all runs'),
      body:totalHeld ? donut(D.checks) : '<div class="e3">' + I('shield') + '<p>No held lines. Every line passed the seven checks.</p></div>',
      foot:link('#/checks', 'Open check results')});

    /* ---------- Recent activity ---------- */
    var audit = (C.get('audit', []) || []).slice(0, 5);
    var act = C.can('audit.view') ? card({id:'act', title:'Recent activity',
      body:audit.length ? '<ul class="a3">' + audit.map(function(a){ return '<li>' + C.av(a.by, a.by === 'Sam' ? 'sam sm' : 'sm') + '<span><b>' + esc(a.by) + '</b> ' + esc(a.action.toLowerCase()) + ' <b>' + esc(a.what) + '</b></span><small title="' + C.time(a.at) + '">' + C.ago(a.at) + '</small></li>'; }).join('') + '</ul>'
        : '<div class="e3">' + I('console') + '<p>No changes yet. Every edit, publish and grade will be listed here.</p></div>',
      foot:link('#/audit', 'Open the audit log')}) : '';

    /* ---------- Decisions to grade (or latest runs for staff who cannot grade) ---------- */
    var canGrade = C.can('houses.grade'), G = C.get('grades', {}) || {}, gkeys = Object.keys(G);
    var graded = function(l){ return gkeys.some(function(k){ return k.indexOf(l.id + '|') === 0; }); };
    var rows = runs.map(function(h){ var m = C.model(h), done = m.lines.filter(graded).length; return {h:h, total:m.lines.length, done:done, next:m.lines.filter(function(l){ return !graded(l); })[0]}; });
    var toDo = rows.filter(function(r){ return r.done < r.total; }).length, week = gkeys.filter(function(k){ return G[k].at >= T0 - 6 * DAY; }).length;
    var chip = function(h){ var s = A.status(h); return s === 'open' ? '<em class="good">Price ready</em><em class="paid">Paid</em>' : s === 'ready' ? '<em class="good">Price ready</em>' : '<em class="info">' + A.STATUS[s][0] + '</em>'; };
    var gradeCard = card({id:'grade', cls:'c3-grade', title:canGrade ? 'Decisions to grade' : 'Latest runs',
      sub:canGrade ? 'Newest runs first. Grading trains the engine; it never changes a price the owner has seen.' : 'Newest runs first.',
      aside:canGrade && rows.length ? '<span class="g4-sum"><b>' + toDo + '</b> of ' + plural(rows.length, 'run', 'runs') + ' to grade</span>' : '',
      body:rows.length ? '<table class="h3"><thead><tr><th scope="col">House</th><th scope="col">Status</th>' + (canGrade ? '<th scope="col">Grading</th>' : '') + '<th scope="col">Submitted</th>' + (canGrade ? '<th scope="col"><span class="sr">Action</span></th>' : '') + '</tr></thead><tbody>' +
          rows.slice(0, 6).map(function(r){ var h = r.h, cov = A.cover(h), pc = Math.round(r.done / r.total * 100), complete = r.done === r.total;
            return '<tr><td data-label="House"><a class="h3-h" href="#/houses/' + h.id + '">' + (cov ? '<img src="' + cov + '" alt="" loading="lazy">' : '<span class="h3-n">' + I('house', 'i-sm') + '</span>') + '<span><b>' + esc(A.addr(h)) + '</b><small>' + esc(A.place(h)) + '</small></span></a></td>' +
              '<td data-label="Status">' + chip(h) + '</td>' +
              (canGrade ? '<td data-label="Grading"><span class="g4-p" title="' + r.done + ' of ' + r.total + ' components graded"><span class="g4-bar"><i style="width:' + pc + '%"></i></span><small>' + (complete ? 'All ' + r.total + ' graded' : r.done + ' of ' + r.total + ' graded') + '</small></span></td>' : '') +
              '<td data-label="Submitted">' + date(h.run.start) + '</td>' +
              (canGrade ? '<td class="g4-a"><a class="btn btn-secondary btn-sm" href="#/houses/' + h.id + '/tree' + (!complete && r.next ? '?line=' + encodeURIComponent(r.next.id) : '') + '" aria-label="' + (complete ? 'Review' : r.done ? 'Continue grading' : 'Grade') + ' ' + esc(A.addr(h)) + '">' + (complete ? 'Review' : r.done ? 'Continue' : 'Grade') + '</a></td>' : '') + '</tr>'; }).join('') + '</tbody></table>'
        : '<div class="e3">' + I('house') + '<p>No runs yet. Houses appear here once their price is ready.</p></div>',
      foot:(canGrade ? '<span><b class="g4-n">' + week + '</b> ' + (week === 1 ? 'step' : 'steps') + ' graded this week · ' + plural(toDo, 'run', 'runs') + ' still to grade</span>' : '<span>' + plural(rows.length, 'run', 'runs') + ' in all</span>') + link('#/houses', 'All houses'), footCls:'sp'});

    var right = acc + wait;
    view.innerHTML = '<div class="c-page o3">' +
      '<div class="o3-head"><div><p class="c-kicker">Console</p><h1>Overview <span class="o3-tag h-aside">Proposal for Sam</span></h1><p>' + new Date().toLocaleDateString('en-US', {weekday:'long', month:'short', day:'numeric', year:'numeric'}) + '. What moved in the console this week.</p></div>' +
        '<div class="o3-act"><span class="o3-seg" role="group" aria-label="Data in the charts"><button type="button" data-mode="example" aria-pressed="' + (mode === 'example') + '">Example data</button><button type="button" data-mode="browser" aria-pressed="' + (mode === 'browser') + '">This browser</button></span>' +
        (canQueue ? '<a class="btn btn-primary" href="#/publish">' + I('refresh', 'i-sm') + 'Open the publish queue</a>' : '') + '</div></div>' +
      kpis +
      '<div class="o3-g' + (right ? ' o3-r1' : '') + '">' + trend + (right ? '<div class="o3-col">' + right + '</div>' : '') + '</div>' +
      '<div class="o3-g' + (act ? ' o3-r2' : '') + '">' + why + act + '</div>' + gradeCard + '</div>';
    RI.fillIcons(view);
    wireColumns(doc.getElementById('o3-chart'));
    view.querySelector('.o3-seg').addEventListener('click', function(e){ var b = e.target.closest('[data-mode]'); if(!b || b.getAttribute('aria-pressed') === 'true') return; C.set('ov.data', b.getAttribute('data-mode')); C.render(); });
  }, {nav:'overview', perm:'houses.view'});
})();
