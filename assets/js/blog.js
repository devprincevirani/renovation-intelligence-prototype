/* Blog: the list page (<main data-blog="list">) and one article (<main data-post="slug">, or ?a=slug on blog/article/).
   Articles come from RI.BLOG (blog-data.js): the console's copy when there is one, else the samples.
   Nov 28 redesigns (user approved the previews): the list shows the newest article across the full width on a solid
   panel, topic tabs with counts, a search box and a grid that lines up; an article gets "In this article" beside the
   text, a next-step panel at the end (no cost-page buttons, user) and "Read next".
   Prototype note: in the real build these pages are rendered on the server (docs/SEO_CONVERSION.md section 3). */
(function(){
  var RI = window.RI, doc = document, main = doc.getElementById('main'), B = RI && RI.BLOG;
  if(!main || !B) return;
  var esc = RI.esc;

  function meta(p){
    return '<span class="bl-meta"><span class="bl-topic">' + esc(B.topic(p.topic).name) + '</span><span>' + B.date(p.at) + '</span><span>' + B.mins(p.body) + ' min read</span></span>';
  }
  /* A boxed card: "Read next" under an article */
  function card(p){
    return '<a class="bl-card" href="' + RI.url(B.urlFor(p)) + '">' +
      '<span class="bl-ph">' + (p.img ? '<img src="' + B.imgSrc(p) + '" alt="" loading="lazy">' : '') + '</span>' +
      '<span class="bl-body">' + meta(p) + '<span class="bl-t">' + esc(p.title) + '</span><span class="bl-sum">' + esc(p.summary) + '</span></span></a>';
  }
  /* The list: the newest article across the full width, and the grid of the rest */
  function av(){ return '<span class="bl-av" aria-hidden="true">' + RI.icon('house', 'i-sm') + '</span>'; }
  function lead(p){
    return '<a class="bl-lead" href="' + RI.url(B.urlFor(p)) + '">' + (p.img ? '<img src="' + B.imgSrc(p) + '" alt="">' : '') + '<span class="bl-go" aria-hidden="true">' + RI.icon('arrow', 'i-sm') + '</span>' +
      '<span class="bl-panel"><span class="bl-tags"><span class="bl-tag">' + esc(B.topic(p.topic).name) + '</span><span class="bl-tag">' + B.mins(p.body) + ' min read</span>' + (p.sample ? '<span class="bl-tag s">Sample</span>' : '') + '</span>' +
        '<h2>' + esc(p.title) + '</h2><p>' + esc(p.summary) + '</p>' +
        '<span class="bl-pby"><span class="who">' + av() + esc(p.author || B.TEAM) + '</span><span class="when">' + RI.icon('clock', 'i-sm') + B.date(p.at) + '</span></span></span></a>';
  }
  function post(p){
    return '<a class="bl-post" href="' + RI.url(B.urlFor(p)) + '">' + (p.img ? '<img src="' + B.imgSrc(p) + '" alt="" loading="lazy">' : '') +
      '<span class="bl-pb"><span class="bl-ptp">' + esc(B.topic(p.topic).name) + '</span><span class="bl-pt">' + esc(p.title) + '</span><span class="bl-ps">' + esc(p.summary) + '</span>' +
      '<span class="bl-pa">' + av() + '<b>' + esc(p.author || B.TEAM) + '</b><span class="d">' + B.date(p.at) + '</span></span></span></a>';
  }
  function crumbs(items){
    return '<nav class="crumbs" aria-label="Breadcrumb">' + items.map(function(x, i){
      return (i ? '<span aria-hidden="true">/</span>' : '') + (x[1] != null ? '<a href="' + RI.url(x[1]) + '">' + esc(x[0]) + '</a>' : '<span aria-current="page">' + esc(x[0]) + '</span>');
    }).join('') + '</nav>';
  }
  function settle(){ if(doc.readyState !== 'loading'){ RI.applyCtas && RI.applyCtas(); RI.fillIcons && RI.fillIcons(main); } }

  /* ---------- The list (Nov 28, design 2): the heading; the newest article across the full width; topic tabs with
     counts and a search box (both kept in the address); then the grid. With no tab and no search the newest article is
     not repeated in the grid ---------- */
  function list(){
    var posts = B.live(), qs = new URLSearchParams(location.search), top = posts[0];
    /* Tabs follow the console's topic list: its order and names, hidden topics and topics with no live article left out */
    var shownTopics = B.tabs(posts);
    var cur = shownTopics.some(function(t){ return t.key === qs.get('topic'); }) ? qs.get('topic') : 'all', term = qs.get('q') || '';
    var tabs = [{key:'all', name:'All'}].concat(shownTopics).map(function(t){
      var n = t.key === 'all' ? posts.length : posts.filter(function(p){ return p.topic === t.key; }).length;
      return '<button type="button" class="bl-tab" data-tab="' + t.key + '" aria-pressed="' + (t.key === cur) + '">' + esc(t.name) + '<span class="bl-tn">' + n + '</span></button>';
    }).join('');
    main.innerHTML =
      '<section class="bl-top"><div class="wrap">' + crumbs([['Home', ''], ['Blog']]) +
        '<p class="label">Blog</p><h1>Plain guides for planning a renovation</h1>' +
        '<p class="lede">Renovation costs, materials, buying a home and planning the work, for homeowners, buyers and the professionals who help them.</p>' +
      '</div></section>' +
      '<div class="wrap bl-list">' +
        (top ? lead(top) +
          '<div class="bl-bar"><div class="bl-tabs" role="group" aria-label="Show articles about">' + tabs + '</div>' +
            '<label class="bl-search">' + RI.icon('search', 'i-sm') + '<input type="search" id="bl-q" placeholder="Search the blog" aria-label="Search the blog" value="' + esc(term) + '" autocomplete="off"></label></div>' +
          '<p class="bl-count" id="bl-count" aria-live="polite"></p><div class="bl-posts" id="bl-out"></div>'
        : '<div class="bl-empty"><p><b>No articles yet.</b></p><p class="muted">New guides are added every month.</p></div>') +
      '</div>';
    if(!top) return;
    function draw(){
      var t = term.trim().toLowerCase();
      var shown = posts.filter(function(p){
        if(cur !== 'all' && p.topic !== cur) return false;
        return !t || (p.title + ' ' + p.summary + ' ' + p.body).toLowerCase().indexOf(t) > -1;
      });
      if(cur === 'all' && !t) shown = shown.filter(function(p){ return p !== top; });
      var about = cur === 'all' ? '' : ' about ' + B.topic(cur).name.toLowerCase(), one = shown.length === 1;
      doc.getElementById('bl-count').textContent = t ? shown.length + (one ? ' article' : ' articles') + about + (one ? ' matches' : ' match') + ' “' + term.trim() + '”'
        : 'Showing ' + shown.length + (one ? ' article' : ' articles') + about;
      var out = doc.getElementById('bl-out');
      out.innerHTML = shown.length ? shown.map(post).join('')
        : '<div class="bl-empty"><p><b>No article matches.</b></p><p class="muted">Try another word, or see every topic.</p><button type="button" class="btn btn-secondary btn-sm" id="bl-clear">Clear the search</button></div>';
      RI.fillIcons && RI.fillIcons(out);
    }
    function keep(){
      var u = new URL(location.href);
      if(cur === 'all') u.searchParams.delete('topic'); else u.searchParams.set('topic', cur);
      if(term.trim()) u.searchParams.set('q', term.trim()); else u.searchParams.delete('q');
      history.replaceState(null, '', u.pathname + u.search);
    }
    function press(){ main.querySelectorAll('.bl-tab').forEach(function(x){ x.setAttribute('aria-pressed', String(x.getAttribute('data-tab') === cur)); }); }
    draw();
    main.addEventListener('click', function(e){
      var b = e.target.closest('.bl-tab');
      if(b){ cur = b.getAttribute('data-tab'); press(); keep(); draw(); return; }
      if(e.target.closest('#bl-clear')){ term = ''; cur = 'all'; doc.getElementById('bl-q').value = ''; press(); keep(); draw(); doc.getElementById('bl-q').focus(); }
    });
    doc.getElementById('bl-q').addEventListener('input', function(){ term = this.value; keep(); draw(); });
  }

  /* ---------- One article ---------- */
  function article(slug){
    var p = slug && B.bySlug(slug);
    if(!p || !B.isLive(p)){
      doc.title = 'Article not available | Renovation Intelligence';
      main.innerHTML = '<section class="page-head"><div class="wrap">' + crumbs([['Home', ''], ['Blog', 'blog/']]) +
        '<h1>This article is not available</h1><p class="lede">It may have been moved or taken down.</p>' +
        '<div class="cta-row"><a class="btn btn-primary" href="' + RI.url('blog/') + '">See all articles</a></div></div></section>';
      return;
    }
    var t = B.topic(p.topic), isTab = B.tabs().some(function(x){ return x.key === t.key; });
    doc.title = p.title + ' | Renovation Intelligence';
    var md = doc.querySelector('meta[name="description"]'); if(md) md.setAttribute('content', p.summary);
    /* Number the headings so "In this article" can point at them */
    var n = 0, text = B.render(p.body).replace(/<h2>/g, function(){ n++; return '<h2 id="part-' + n + '">'; });
    var heads = []; text.replace(/<h2 id="(part-\d+)">(.*?)<\/h2>/g, function(m, id, h){ heads.push([id, h]); });
    var more = B.live().filter(function(x){ return x.slug !== p.slug; })
      .sort(function(a, b){ return (b.topic === p.topic) - (a.topic === p.topic) || (b.at || 0) - (a.at || 0); }).slice(0, 3);
    var free = function(cls){ return '<a class="btn ' + cls + '" data-cta="free" href="' + RI.url('signup/') + '"><span class="t">Explore renovation costs for free</span></a>'; };
    main.innerHTML =
      '<section class="bl-head"><div class="wrap">' + crumbs([['Home', ''], ['Blog', 'blog/'], [t.name, isTab ? 'blog/?topic=' + t.key : 'blog/']]) +
        '<p class="label">' + esc(t.name) + '</p><h1>' + esc(p.title) + '</h1><p class="lede">' + esc(p.summary) + '</p>' +
        '<p class="bl-by"><span>' + esc(p.author || B.TEAM) + '</span><span>' + (p.updated && p.updated > (p.at || 0) ? 'Updated ' + B.date(p.updated) : B.date(p.at)) + '</span><span>' + B.mins(p.body) + ' min read</span>' +
          (p.sample ? '<span class="state state-sample">Sample</span>' : '') + '</p>' +
      '</div></section>' +
      '<div class="wrap bl-art">' +
        (p.img ? '<figure class="bl-hero"><img src="' + B.imgSrc(p) + '" alt="' + esc(p.alt || '') + '"></figure>' : '') +
        '<div class="bl-cols"><div class="bl-main">' +
          (heads.length > 1 ? '<details class="bl-tocm"><summary>In this article<span class="small muted">' + heads.length + ' parts</span></summary><ol>' +
            heads.map(function(h){ return '<li><a href="#' + h[0] + '">' + h[1] + '</a></li>'; }).join('') + '</ol></details>' : '') +
          '<article class="bl-text">' + text + '</article>' +
          '<section class="bl-next" aria-labelledby="bl-next-h"><h2 id="bl-next-h">Want the numbers for your own house?</h2>' +
            '<p>Add your house and a photo of each room. You get a Low and a High for each part, under three goals, free.</p>' +
            '<div class="bl-next-acts">' + free('btn-ivory') + '<a class="textlink" href="' + RI.url('sample/') + '">See a sample report' + RI.icon('arrow', 'i-sm') + '</a></div>' +
          '</section>' +
          '<p class="bl-note">Our articles are guidance for planning, not a contractor\'s price. Every house is different. <a href="' + RI.url('disclaimer/') + '">Read the estimate disclaimer</a>.</p>' +
        '</div>' +
        '<aside class="bl-side" aria-label="Contents and your house">' +
          (heads.length > 1 ? '<nav class="bl-toc" aria-label="In this article"><p class="bl-lh">In this article</p>' + heads.map(function(h, i){ return '<a href="#' + h[0] + '"' + (i ? '' : ' class="on"') + '>' + h[1] + '</a>'; }).join('') + '</nav>' : '') +
          '<div class="bl-sidecard"><h2>See your renovation costs</h2><p>A Low and a High for your own house, under three goals. Free.</p>' + free('btn-primary btn-block') + '</div>' +
        '</aside></div>' +
        (more.length ? '<section class="bl-more" aria-labelledby="bl-more-h"><div class="bl-more-head"><h2 id="bl-more-h">Read next</h2><a class="textlink" href="' + RI.url('blog/') + '">All articles' + RI.icon('arrow', 'i-sm') + '</a></div>' +
          '<div class="bl-grid">' + more.map(function(x){ return card(x); }).join('') + '</div></section>' : '') +
      '</div>';

    /* "In this article": mark the part being read */
    var links = [].slice.call(main.querySelectorAll('.bl-toc a')), parts = links.map(function(a){ return doc.getElementById(a.getAttribute('href').slice(1)); }), ticking = false;
    if(!links.length) return;
    function mark(){
      ticking = false;
      var line = 160, cur = 0;
      parts.forEach(function(h, i){ if(h && h.getBoundingClientRect().top <= line) cur = i; });
      links.forEach(function(a, i){ var on = i === cur; a.classList.toggle('on', on); if(on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    }
    window.addEventListener('scroll', function(){ if(!ticking){ ticking = true; requestAnimationFrame(mark); } }, {passive:true});
    mark();
  }

  if(main.getAttribute('data-blog') === 'list') list();
  else article(main.getAttribute('data-post') || new URLSearchParams(location.search).get('a'));
  settle();
})();
