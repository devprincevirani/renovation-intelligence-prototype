/* Console: Blog (business model 5 and 7; Sam's roles answer 9: "customer service staff handle … blogs").
   Staff with the Blog permission write, schedule, publish and unpublish articles themselves; there is no publish
   queue for the blog. Every action goes in the audit log, which Sam sees in Overview "Recent activity".
   The articles live under con.blog; the public pages read the same list (assets/js/blog-data.js). */
(function(){
  var RI = window.RI, A = RI.App, C = RI.Con, B = RI.BLOG, doc = document;
  if(!C || !B) return;
  var esc = RI.esc;
  var HYPE = ['seamless','robust','cutting-edge','unlock','empower','elevate','leverage','effortless','game-changing','next-level','revolutionary','supercharge','harness','world-class','best-in-class','state-of-the-art','delve','dive in'];
  var LIBRARY = ['kitchen-dated-wide.jpg', 'kitchen-dated.jpg', 'hero-kitchen-remodel.jpg', 'cabinet-run.jpg', 'wood-floor.jpg', 'questions-painter.jpg', 'brick-ranch.jpg', 'colonial.jpg', 'split-level.jpg', 'livonia-street.jpg',
                 'rooms/living-arches.jpg', 'rooms/basement-utility.jpg', 'rooms/basement-finished.jpg', 'rooms/bath-tub.jpg', 'rooms/bedroom-front.jpg', 'ba/bath-before.jpg', 'ba/kitchen-before.jpg'];

  C.SEEDS.push(function(){ C.set('blog', B.SEED); C.set('blogTopics', B.TOPICS); });

  function all(){ return C.get('blog', B.SEED) || []; }
  function save(list){ C.set('blog', list); }
  function stateOf(p){ return B.isLive(p) ? 'published' : p.status === 'scheduled' ? 'scheduled' : 'draft'; }
  function stateLine(p){
    var s = stateOf(p);
    return s === 'published' ? 'Live since ' + C.date(p.at) : s === 'scheduled' ? 'Goes live ' + C.date(p.at) : p.updated ? 'Draft, last saved ' + C.date(p.updated) : 'New draft, not saved yet';
  }
  function when(p){ var s = stateOf(p); return s === 'published' ? 'Published ' + C.date(p.at) : s === 'scheduled' ? 'Goes live ' + C.date(p.at) : p.updated ? 'Saved ' + C.date(p.updated) : 'Not saved yet'; }
  function tomorrow(){ var t = new Date(Date.now() + B.DAY); return t.toISOString().slice(0, 10); }

  /* ---------- Section 6, the rich text box (user, Nov 28: "like Notepad or a rich text box") ----------
     It edits the article like a document; every change is written back as the simple text the blog stores
     (B.render reads it), so the checks, the preview, saving and the public page all stay the same. */
  var SVG = {
    ul:'<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/></svg>',
    ol:'<svg viewBox="0 0 24 24"><path d="M10 6h10M10 12h10M10 18h10"/><path d="M4 4.5h1.5V9M4 9h3M4 14.5c0-.8.7-1.5 1.5-1.5S7 13.7 7 14.5c0 1.2-3 2-3 3.5h3"/></svg>',
    link:'<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
    undo:'<svg viewBox="0 0 24 24"><path d="M9 7L4 12l5 5"/><path d="M4 12h11a5 5 0 0 1 0 10h-2"/></svg>',
    redo:'<svg viewBox="0 0 24 24"><path d="M15 7l5 5-5 5"/><path d="M20 12H9a5 5 0 0 0 0 10h2"/></svg>'
  };
  function rteHTML(body){
    var b = function(cmd, label, title, inner){ return '<button type="button" class="bg-tbtn" data-cmd="' + cmd + '" aria-label="' + label + '" title="' + title + '"' + (/^(bold|italic|insert)/.test(cmd) ? ' aria-pressed="false"' : '') + '>' + inner + '</button>'; };
    return '<div class="bg-rte"><div class="bg-tb" role="toolbar" aria-label="Formatting">' +
        '<select id="bg-blk" aria-label="Text style"><option value="p">Normal text</option><option value="h2">Heading</option></select><span class="sep"></span>' +
        b('bold', 'Bold', 'Bold, ⌘B', '<span class="b">B</span>') + b('italic', 'Italic', 'Italic, ⌘I', '<span class="it">I</span>') + '<span class="sep"></span>' +
        b('insertUnorderedList', 'Bulleted list', 'Bulleted list', SVG.ul) + b('insertOrderedList', 'Numbered list', 'Numbered list', SVG.ol) + b('link', 'Link', 'Link, ⌘K', SVG.link) + '<span class="sep"></span>' +
        b('undo', 'Undo', 'Undo, ⌘Z', SVG.undo) + b('redo', 'Redo', 'Redo, ⇧⌘Z', SVG.redo) + '</div>' +
      '<div class="bg-doc" id="bg-doc" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Article" data-ph="Start writing. Use the toolbar for headings, lists and links.">' + B.render(body, true) + '</div></div>';
  }
  /* The editor's paragraphs, headings, lists, bold, italic and links, back to the stored text */
  function toText(root){
    function one(c){
      if(c.nodeType === 3) return c.textContent.replace(/\s+/g, ' ');
      if(c.nodeType !== 1) return '';
      var t = c.tagName, s = inl(c), m = s.match(/^(\s*)([\s\S]*?)(\s*)$/);
      /* markers hug the words, so "**word **" never happens */
      if(t === 'STRONG' || t === 'B') return m[2] ? m[1] + '**' + m[2] + '**' + m[3] : s;
      if(t === 'EM' || t === 'I') return m[2] ? m[1] + '*' + m[2] + '*' + m[3] : s;
      if(t === 'A') return m[2] ? m[1] + '[' + m[2] + '](' + (c.getAttribute('href') || '') + ')' + m[3] : s;
      if(t === 'BR') return ' ';
      return s;
    }
    function inl(n){ return [].map.call(n.childNodes, one).join(''); }
    /* Walks blocks inside blocks too: browsers sometimes put a list inside a paragraph or a heading */
    var out = [], BLOCK = /^(P|DIV|SECTION|ARTICLE|BLOCKQUOTE|PRE|H[1-6]|UL|OL)$/;
    function hasBlock(n){ return [].some.call(n.children, function(c){ return BLOCK.test(c.tagName); }); }
    function walk(parent){
      var buf = '';
      function flush(){ var s = buf.trim(); if(s) out.push(s); buf = ''; }
      [].forEach.call(parent.childNodes, function(n){
        if(n.nodeType === 3){ buf += n.textContent.replace(/\s+/g, ' '); return; }
        if(n.nodeType !== 1) return;
        var t = n.tagName;
        if(/^H[1-6]$/.test(t) && !hasBlock(n)){ flush(); var h = inl(n).trim(); if(h) out.push('## ' + h); }
        else if(t === 'UL' || t === 'OL'){
          flush();
          var items = [].filter.call(n.children, function(li){ return li.tagName === 'LI'; }).map(function(li){ return inl(li).trim(); }).filter(Boolean);
          if(items.length) out.push(items.map(function(s, i){ return (t === 'UL' ? '- ' : (i + 1) + '. ') + s; }).join('\n'));
        }
        else if(BLOCK.test(t)){ flush(); walk(n); }
        else if(t === 'BR') flush();
        else buf += one(n);
      });
      flush();
    }
    walk(root);
    return out.join('\n\n');
  }
  /* One listener for the whole console: the toolbar shows what the cursor is in */
  doc.addEventListener('selectionchange', function(){ var ed = doc.getElementById('bg-doc'); if(ed && ed._sync) ed._sync(); });

  /* The same checks as Guidance (content.js guChecks) plus what a blog article needs. Hard ones block publishing;
     a draft can always be saved, half written. */
  function checks(f, self){
    var low = (f.title + ' ' + f.summary + ' ' + f.body).toLowerCase(), out = [];
    function add(ok, hard, label, fix){ out.push({ok:ok, hard:hard, label:label, fix:fix}); }
    var others = all().filter(function(p){ return p.id !== self; }).map(function(p){ return p.slug; });
    add(f.title.trim().length > 0, true, 'Title is filled in', 'Readers and search engines see it first.');
    add(f.title.length <= 70, false, 'Title fits in search results', 'Keep it to 70 characters or fewer.');
    add(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.slug) && others.indexOf(f.slug) < 0 && f.slug !== 'article', true, 'Web address is short and unique', 'Lowercase words joined by hyphens, not used by another article.');
    add(f.summary.trim().length > 0, true, 'Summary is filled in', 'It shows on the blog card and in search results.');
    add(f.summary.length <= 160, false, 'Summary fits in search results', 'Keep it to 160 characters or fewer.');
    add(!f.img || f.alt.trim().length > 0, true, 'The photo is described', 'Say what the photo shows, for people who cannot see it.');
    add(B.words(f.body) >= 150, false, 'The article has 150 words or more', 'Short pages rarely help readers or search.');
    add(!/\bquotes?\b/.test(low), true, 'Never says quote', 'Say estimate.');
    add(!/[—–!]/.test(f.title + f.summary + f.body), false, 'No dashes or exclamation marks', 'Use a period or a comma.');
    var hype = HYPE.filter(function(w){ return low.indexOf(w) > -1; });
    add(!hype.length, false, hype.length ? 'Avoid: ' + hype.join(', ') : 'Plain words, no hype', 'These words read as machine written.');
    add(/\]\((renovation-cost|sample|how-it-works)/.test(f.body), false, 'Points readers to a cost page', 'In the article, use the link button to link a cost page, such as Renovation costs, by area, so readers can see real ranges.');
    return out;
  }
  function checksHTML(c){
    var bad = c.filter(function(x){ return !x.ok; }), hard = bad.some(function(x){ return x.hard; });
    return '<header><h3>Checks</h3><span class="gu-ck-n ' + (hard ? 'bad' : bad.length ? 'warn' : 'ok') + '">' + (c.length - bad.length) + ' of ' + c.length + ' pass</span></header><ul class="gu-ck">' +
      c.map(function(x){ var st = x.ok ? 'ok' : x.hard ? 'bad' : 'warn'; return '<li class="' + st + '"><span class="gu-ck-i">' + RI.icon(x.ok ? 'check' : x.hard ? 'x' : 'warn', 'i-sm') + '</span><span><b>' + esc(x.label) + '</b>' + (x.ok ? '' : '<small>' + esc(x.fix) + (x.hard ? ' Needed before it goes live.' : '') + '</small>') + '</span></li>'; }).join('') + '</ul>';
  }

  C.route('/blog', function(view){
    var q = C.query();
    if(q.id || q['new']) return editor(view, q.id);
    list(view, q);
  }, {nav:'blog', perm:'blog.edit'});

  /* ---------- Topics (Nov 28, user): add, rename, change the tab order, hide. Edits stay in the dialog until
     "Save topics"; one audit entry says what changed ---------- */
  var GRIP = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>';
  function topicsDialog(){
    var before = B.topics(), list = B.topics(), posts = all();
    function used(key){ var n = posts.filter(function(p){ return p.topic === key; }).length; return n ? n + (n === 1 ? ' article' : ' articles') : 'No articles yet'; }
    function rowHTML(t){
      return '<li class="bg-tpr' + (t.hidden ? ' is-hidden' : '') + '" data-k="' + esc(t.key) + '">' +
        '<button type="button" class="bg-tgrip" aria-label="Reorder ' + esc(t.name) + ': drag, or use the up and down arrow keys" title="Drag to change the order">' + GRIP + '</button>' +
        '<span class="field bg-tnm"><input class="input" data-name value="' + esc(t.name) + '" aria-label="Topic name" maxlength="60" autocomplete="off"><span class="err"></span></span>' +
        '<span class="bg-tmeta">' + (t.hidden ? C.lbl('Hidden') : '') + '<span>' + used(t.key) + '</span></span>' +
        '<button type="button" class="btn btn-secondary btn-sm bg-thd" data-hide aria-pressed="' + t.hidden + '">' + (t.hidden ? 'Show' : 'Hide') + '</button></li>';
    }
    /* Add first (user, Nov 28), then the list; drag the handle to change the order */
    var d = C.dialog('Blog topics', '<form id="bg-tf" class="bg-tform" novalidate>' +
      '<div class="field bg-tadd"><label for="bg-tn">Add a topic</label><span class="bg-taddr"><input class="input" id="bg-tn" maxlength="60" placeholder="For example: Kitchens" autocomplete="off"><button type="button" class="btn btn-secondary" id="bg-tad">' + RI.icon('plus', 'i-sm') + 'Add</button></span><span class="err"></span></div>' +
      '<p class="small muted">Drag topics to set the order of the tabs on the blog. A topic shows as a tab once it has a published article. Hidden topics keep their articles; they still show under All.</p>' +
      '<ol class="bg-tpl" id="bg-tpl"></ol><p class="sr" id="bg-tlive" aria-live="polite"></p>' +
      '<div class="cta-row bg-tfoot"><button type="button" class="btn btn-secondary" data-dlg-close>Cancel</button><button type="submit" class="btn btn-primary">Save</button></div></form>', {wide:true});
    var ol = d.querySelector('#bg-tpl'), add = d.querySelector('#bg-tn'), live = d.querySelector('#bg-tlive'), body = d.querySelector('.dlg-body');
    function byKey(k){ return list.filter(function(t){ return t.key === k; })[0]; }
    function at(k){ return list.indexOf(byKey(k)); }
    function rowOf(k){ return [].filter.call(ol.children, function(r){ return r.getAttribute('data-k') === k; })[0]; }
    function say(k){ var i = at(k); live.textContent = byKey(k).name + ', position ' + (i + 1) + ' of ' + list.length + '.'; }
    function draw(){ ol.innerHTML = list.map(rowHTML).join(''); RI.fillIcons(ol); }
    draw();
    /* A name is fine when it is filled in, short, used once and never says quote. Returns the problem, or '' */
    function problem(name, self){
      var v = name.trim();
      if(!v) return 'Give the topic a name.';
      if(v.length > 30) return 'Keep it to 30 characters or fewer.';
      if(/\bquotes?\b/i.test(v)) return 'Never use the word quote. Say estimate.';
      if(list.some(function(t, i){ return i !== self && t.name.trim().toLowerCase() === v.toLowerCase(); })) return 'Another topic already has this name.';
      return '';
    }
    ol.addEventListener('input', function(e){ var r = e.target.closest('.bg-tpr'); if(!r || !e.target.hasAttribute('data-name')) return; byKey(r.getAttribute('data-k')).name = e.target.value; RI.form.setInvalid(e.target, ''); });
    ol.addEventListener('click', function(e){
      var r = e.target.closest('.bg-tpr'); if(!r || !e.target.closest('[data-hide]')) return;
      var k = r.getAttribute('data-k'), t = byKey(k); t.hidden = !t.hidden; draw(); rowOf(k).querySelector('[data-hide]').focus();
    });
    /* Keyboard: the arrow keys on a handle move that topic one place */
    ol.addEventListener('keydown', function(e){
      var g = e.target.closest('.bg-tgrip'); if(!g || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
      e.preventDefault();
      var k = g.closest('.bg-tpr').getAttribute('data-k'), i = at(k), j = i + (e.key === 'ArrowUp' ? -1 : 1);
      if(j < 0 || j >= list.length) return;
      var t = list[i]; list[i] = list[j]; list[j] = t; draw(); rowOf(k).querySelector('.bg-tgrip').focus(); say(k);
    });
    /* Mouse and touch: pointer events, so it works on phones too. The row follows the finger; the others make room as
       it passes their middle; letting go keeps the new order */
    var drag = null;
    ol.addEventListener('pointerdown', function(e){
      var g = e.target.closest('.bg-tgrip'); if(!g || e.button > 0) return;
      e.preventDefault();
      var row = g.closest('.bg-tpr');
      drag = {row:row, grab:e.clientY - row.getBoundingClientRect().top, id:e.pointerId};
      try { g.setPointerCapture(e.pointerId); } catch(x){}
      row.classList.add('is-drag'); ol.classList.add('is-sorting');
    });
    ol.addEventListener('pointermove', function(e){
      if(!drag || e.pointerId !== drag.id) return;
      var row = drag.row, center = e.clientY - drag.grab + row.offsetHeight / 2, next = null;
      [].some.call(ol.children, function(x){ if(x === row) return false; var b = x.getBoundingClientRect(); if(b.top + b.height / 2 > center){ next = x; return true; } return false; });
      if(next ? row.nextElementSibling !== next : ol.lastElementChild !== row) ol.insertBefore(row, next);
      row.style.transform = 'none'; var top = row.getBoundingClientRect().top;
      row.style.transform = 'translateY(' + Math.round(e.clientY - drag.grab - top) + 'px)';
      /* Near the top or bottom edge of a long list, scroll it */
      var sc = body.scrollHeight > body.clientHeight ? body : d, sr = sc.getBoundingClientRect();
      if(e.clientY < sr.top + 48) sc.scrollTop -= 12; else if(e.clientY > sr.bottom - 48) sc.scrollTop += 12;
    });
    function drop(e){
      if(!drag || e.pointerId !== drag.id) return;
      var k = drag.row.getAttribute('data-k'), order = [].map.call(ol.children, function(r){ return r.getAttribute('data-k'); });
      drag.row.style.transform = ''; drag = null; ol.classList.remove('is-sorting');
      list = order.map(byKey); draw(); rowOf(k).querySelector('.bg-tgrip').focus(); say(k);
    }
    ol.addEventListener('pointerup', drop); ol.addEventListener('pointercancel', drop);
    function addOne(){
      var bad = problem(add.value, -1); if(bad){ RI.form.setInvalid(add, bad); add.focus(); return; }
      var base = B.slugify(add.value) || 'topic', key = base, n = 2;
      while(key === 'all' || list.some(function(t){ return t.key === key; })) key = base + '-' + n++;
      list.unshift({key:key, name:add.value.trim(), hidden:false}); add.value = ''; RI.form.setInvalid(add, '');
      draw(); add.focus(); say(key);
    }
    d.querySelector('#bg-tad').addEventListener('click', addOne);
    add.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); addOne(); } });
    add.addEventListener('input', function(){ RI.form.setInvalid(add, ''); });
    d.querySelector('#bg-tf').addEventListener('submit', function(e){
      e.preventDefault();
      /* A name typed in "Add a topic" but not added yet is added now, rather than lost */
      if(add.value.trim()){ var c = list.length; addOne(); if(list.length === c) return; }
      var firstBad = null;
      ol.querySelectorAll('.bg-tpr').forEach(function(r, i){ var inp = r.querySelector('[data-name]'), bad = problem(list[i].name, i); RI.form.setInvalid(inp, bad); if(bad && !firstBad) firstBad = inp; });
      if(firstBad){ firstBad.focus(); return; }
      list.forEach(function(t){ t.name = t.name.trim(); });
      /* What changed, for the audit log */
      var was = {}; before.forEach(function(t){ was[t.key] = t; });
      var out = [];
      list.forEach(function(t){
        var o = was[t.key];
        if(!o){ out.push('added ' + t.name); return; }
        if(o.name !== t.name) out.push('renamed ' + o.name + ' to ' + t.name);
        if(o.hidden !== t.hidden) out.push((t.hidden ? 'hid ' : 'showed ') + t.name);
      });
      var oldOrder = before.map(function(t){ return t.key; }).join(), newOrder = list.filter(function(t){ return was[t.key]; }).map(function(t){ return t.key; }).join();
      if(oldOrder !== newOrder) out.push('changed the order');
      d.close();
      if(!out.length){ RI.toast('Nothing changed.', 'info'); return; }
      C.set('blogTopics', list);
      var what = out.join('; '); what = what.charAt(0).toUpperCase() + what.slice(1);
      C.log('Blog topics changed', what, '', 'blog');
      RI.toast('Topics saved. The blog shows them now.', 'check');
      C.render();
    });
  }

  /* ---------- The list (Nov 28 redesign): one row per article; Author, Status and the buttons in fixed columns,
     so they line up on every row ---------- */
  function list(view, q){
    var tab = ['published', 'scheduled', 'draft'].indexOf(q.tab) > -1 ? q.tab : 'all', topic = '', term = q.q || '';
    var posts = all().slice().sort(function(a, b){ return (b.updated || b.at || 0) - (a.updated || a.at || 0); });
    var n = {all:posts.length, published:0, scheduled:0, draft:0}; posts.forEach(function(p){ n[stateOf(p)]++; });
    view.innerHTML = C.page({kicker:'Content', title:'Blog', sub:'Write, schedule and publish the articles on the public blog. Every change goes in the audit log.',
      actions:'<a class="btn btn-secondary" href="' + RI.url('blog/') + '" target="_blank" rel="noopener">' + RI.icon('eye', 'i-sm') + 'View the blog</a><a class="btn btn-primary" href="#/blog?new=1">' + RI.icon('plus', 'i-sm') + 'New article</a>',
      body:'<div class="bg-tools">' + C.seg('bg-tab', [['all', 'All', n.all], ['published', 'Published', n.published], ['scheduled', 'Scheduled', n.scheduled], ['draft', 'Drafts', n.draft]], tab) +
        '<span class="c-select"><select id="bg-tpf" aria-label="Topic"><option value="">All topics</option>' + B.topics().map(function(t){ return '<option value="' + t.key + '">' + esc(t.name) + (t.hidden ? ' (hidden)' : '') + '</option>'; }).join('') + '</select></span>' +
        C.search('bg-q', 'Search titles and authors', term) +
        '<button type="button" class="btn btn-secondary bg-mt" id="bg-mt" aria-label="Manage topics" title="Add, rename, order or hide topics">' + RI.icon('sliders', 'i-sm') + 'Topics</button></div><div id="bg-rows"></div>'});
    function rows(){
      var t = term.trim().toLowerCase();
      var shown = posts.filter(function(p){ return (tab === 'all' || stateOf(p) === tab) && (!topic || p.topic === topic) && (!t || (p.title + ' ' + p.slug + ' ' + (p.author || '')).toLowerCase().indexOf(t) > -1); });
      doc.getElementById('bg-rows').innerHTML = shown.length ? '<ul class="bg-list"><li class="bg-lhead" aria-hidden="true"><span>Article</span><span>Author</span><span>Status</span><span></span></li>' + shown.map(function(p){
        var s = stateOf(p), au = p.author || B.TEAM;
        return '<li class="bg-row"><a class="bg-main" href="#/blog?id=' + p.id + '">' + (p.img ? '<img class="bg-th" src="' + B.imgSrc(p) + '" alt="">' : '<span class="bg-th"></span>') +
          '<span class="bg-tx"><b>' + esc(p.title || 'Untitled article') + '</b><span class="bg-sub"><span>' + esc(B.topic(p.topic).name) + '</span><span class="u">/blog/' + esc(p.slug) + '/</span>' + (p.sample ? '<span class="sm">Sample</span>' : '') + '</span>' +
          '<span class="bg-aum">by ' + esc(au) + '</span></span></a>' +
          '<span class="bg-au">' + C.av(au) + '<span>' + esc(au) + '</span></span>' +
          '<span class="bg-st">' + C.lbl(s) + '<small>' + when(p) + '</small></span>' +
          '<span class="bg-acts">' + (s === 'published' ? '<a class="bg-ic" href="' + RI.url(B.urlFor(p)) + '" target="_blank" rel="noopener" aria-label="View ' + esc(p.title) + ' on the site" title="View on the site">' + RI.icon('eye', 'i-sm') + '</a>' : '') +
          '<a class="bg-ic" href="#/blog?id=' + p.id + '" aria-label="Edit ' + esc(p.title) + '" title="Edit">' + RI.icon('pencil', 'i-sm') + '</a></span></li>';
      }).join('') + '</ul>' : '<div class="c-empty">' + RI.icon('info') + '<p>' + (t ? 'No article matches “' + esc(term) + '”.' : 'No articles here yet.') + '</p></div>';
      RI.fillIcons(doc.getElementById('bg-rows'));
    }
    rows();
    view.addEventListener('click', function(e){
      var b = e.target.closest('#bg-tab [data-v]'); if(!b) return;
      tab = b.getAttribute('data-v'); view.querySelectorAll('#bg-tab [data-v]').forEach(function(x){ x.setAttribute('aria-selected', String(x === b)); });
      history.replaceState(null, '', '#/blog' + (tab === 'all' ? '' : '?tab=' + tab)); rows();
    });
    doc.getElementById('bg-tpf').addEventListener('change', function(){ topic = this.value; rows(); });
    doc.getElementById('bg-mt').addEventListener('click', topicsDialog);
    var qi = doc.getElementById('bg-q'); qi.addEventListener('input', function(){ term = qi.value; rows(); });
  }

  /* ---------- One article: the form, a live preview, the checks and one bar of actions ---------- */
  function editor(view, id){
    var me = C.me(), p = id && all().filter(function(x){ return x.id === id; })[0];
    if(id && !p){ view.innerHTML = C.page({back:['#/blog', 'All articles'], title:'This article does not exist', body:'<div class="c-empty big">' + RI.icon('info') + '<a class="btn btn-secondary" href="#/blog">Back to the blog</a></div>'}); return; }
    var isNew = !p;
    var firstTopic = (B.topics().filter(function(t){ return !t.hidden; })[0] || B.topics()[0]).key;
    if(isNew) p = {id:C.uid('b'), slug:'', title:'', topic:firstTopic, summary:'', img:'', alt:'', body:'', related:[], author:me.name, status:'draft', at:null, updated:null};
    var saved = JSON.stringify(pick(p)), slugTouched = !isNew && !!p.slug;
    function pick(x){ return {title:x.title || '', slug:x.slug || '', topic:x.topic || 'costs', summary:x.summary || '', img:x.img || '', alt:x.alt || '', body:x.body || '', related:(x.related || []).slice(), author:x.author || ''}; }
    var f = pick(p);

    function box(n, label, forId, inner, help, count){
      return '<div class="gu-f field"><div class="gu-f-h"><span class="gu-n">' + n + '</span>' + (forId ? '<label for="' + forId + '">' + label + '</label>' : '<span class="gu-f-l">' + label + '</span>') + '</div>' +
        (help ? '<p class="gu-help">' + help + '</p>' : '') + inner + (count ? '<span class="gu-count" id="' + count + '"></span>' : '') + '<span class="err"></span></div>';
    }
    function formHTML(){
      return box(1, 'Title', 'bg-t', '<input class="input" id="bg-t" value="' + esc(f.title) + '" placeholder="For example: Refinish or replace kitchen cabinets?" autocomplete="off">', '', 'bg-tc') +
        box(2, 'Web address', 'bg-s', '<div class="bg-slug"><span>/blog/</span><input class="input" id="bg-s" value="' + esc(f.slug) + '" autocomplete="off" spellcheck="false"></div>', 'Lowercase words joined by hyphens. Made from the title until you change it. Changing it on a live article breaks old links.') +
        box(3, 'Topic', 'bg-tp', '<span class="c-select"><select id="bg-tp">' + B.topics().map(function(t){ return '<option value="' + t.key + '"' + (t.key === f.topic ? ' selected' : '') + '>' + esc(t.name) + (t.hidden ? ' (hidden from the blog tabs)' : '') + '</option>'; }).join('') + '</select></span>' +
          '<p class="small muted" id="bg-tph"' + (B.topic(f.topic).hidden ? '' : ' hidden') + '>This topic is hidden, so the article shows only under All.</p>') +
        box(4, 'Summary', 'bg-sm', '<textarea class="input" id="bg-sm" rows="3">' + esc(f.summary) + '</textarea>', 'Shows on the blog card and as the description in search results.', 'bg-smc') +
        box(5, 'Photo', '', '<label class="pf-drop' + (f.img ? ' has' : '') + '" id="bg-drop" for="bg-file"><span class="pf-dv" id="bg-dv">' + (f.img ? '<img src="' + B.imgSrc(f) + '" alt="">' : '') + '</span><span class="pf-dt"><b id="bg-dt">' + (f.img ? 'Replace the photo' : 'Drop a photo here, or choose a file') + '</b><small>A wide photo of a real room or house. Up to 1.5 MB.</small></span></label><input type="file" id="bg-file" accept="image/*" class="sr">' +
          '<div class="bg-lib"><label class="small" for="bg-libs">Or use a photo from the site</label><span class="c-select sm"><select id="bg-libs"><option value="">Choose a photo</option>' + LIBRARY.map(function(x){ return '<option value="' + x + '"' + (x === f.img ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></span></div>' +
          '<label class="small bg-altl" for="bg-alt">Describe the photo <span class="opt">(for people who cannot see it)</span></label><input class="input" id="bg-alt" value="' + esc(f.alt) + '" placeholder="For example: An older kitchen with white cabinets and a tile floor" autocomplete="off">' +
          '<button type="button" class="linkbtn small" id="bg-rm"' + (f.img ? '' : ' hidden') + '>Remove the photo</button>') +
        box(6, 'Article', '', rteHTML(f.body) + '<textarea id="bg-b" hidden>' + esc(f.body) + '</textarea>', 'Write as in any text editor. Use the toolbar for headings, bold, lists and links. Pasting keeps only the words.', 'bg-bc') +
        box(7, 'Author', 'bg-au', '<input class="input" id="bg-au" value="' + esc(f.author) + '" autocomplete="off">', 'The name readers see on the article.');
    }
    function previewHTML(){
      var t = B.topic(f.topic), q = Object.assign({}, p, f, {at:p.at || Date.now()});
      return '<div class="bg-pv">' +
        '<span class="bl-post bg-pvcard">' + (f.img ? '<img src="' + B.imgSrc(f) + '" alt="">' : '') + '<span class="bl-pb"><span class="bl-ptp">' + esc(t.name) + '</span><span class="bl-pt">' + esc(f.title || 'Title') + '</span><span class="bl-ps">' + esc(f.summary || 'Summary') + '</span>' +
          '<span class="bl-pa"><span class="bl-av" aria-hidden="true">' + RI.icon('house', 'i-sm') + '</span><b>' + esc(f.author || B.TEAM) + '</b><span class="d">' + B.date(q.at) + '</span></span></span></span>' +
        '<details class="bg-pvart"><summary>See the whole article</summary><div class="bl-text">' + (f.body.trim() ? B.render(f.body) : '<p class="muted">The article text shows here.</p>') + '</div></details></div>';
    }
    function serpHTML(){
      return '<div class="bg-serp"><span class="bg-serp-u">…/blog/' + esc(f.slug || 'web-address') + '/</span><b>' + esc((f.title || 'Title') + ' | Renovation Intelligence') + '</b><span>' + esc(f.summary.length > 160 ? f.summary.slice(0, 157) + '…' : (f.summary || 'The summary shows here.')) + '</span></div>';
    }

    var c0 = checks(f, p.id);
    view.innerHTML = C.page({back:['#/blog', 'All articles'], kicker:'Blog', title:esc(f.title || 'New article'),
      sub:'<span id="bg-state">' + C.lbl(stateOf(p)) + '</span> <span id="bg-line">' + stateLine(p) + '</span>' + (p.sample ? ' ' + C.lbl('sample') : ''),
      actions:stateOf(p) === 'published' ? '<a class="btn btn-secondary" href="' + RI.url(B.urlFor(p)) + '" target="_blank" rel="noopener">' + RI.icon('eye', 'i-sm') + 'View on the site</a>' : '',
      body:'<div class="gu-grid bg-ed"><div class="gu-form" id="bg-form">' + formHTML() + '</div>' +
        '<aside class="gu-side" aria-label="Preview and checks">' +
          '<section class="gu-pane"><header><h3>How readers see it</h3><span class="small muted">The blog card</span></header><div class="gu-pvbox" id="bg-pv">' + previewHTML() + '</div></section>' +
          '<section class="gu-pane"><header><h3>In search results</h3></header><div id="bg-serp">' + serpHTML() + '</div></section>' +
          '<section class="gu-pane" id="bg-ck">' + checksHTML(c0) + '</section></aside></div>' +
        '<div id="bg-bar"></div>'});
    RI.fillIcons(view);

    /* ---- The bar: what state the article is in and what can happen next. It turns into the unsaved-changes bar
       (c-savebar, so leaving asks first) as soon as something changes ---- */
    function dirty(){ return JSON.stringify(f) !== saved; }
    function bar(){
      var d = dirty(), s = stateOf(p), live = s === 'published', btn = function(id, label, cls){ return '<button type="button" class="btn ' + cls + ' btn-sm" id="' + id + '">' + label + '</button>'; };
      var text = d ? '<b>Unsaved changes.</b> ' + (live ? 'Readers still see the last saved version.' : 'Save them, or publish.') : esc(stateLine(p)) + '.';
      var acts = (d ? btn('bg-undo', 'Undo', 'btn-secondary') : '') +
        (live ? btn('bg-unpub', 'Unpublish', 'btn-secondary') + btn('bg-save', 'Save changes', d ? 'btn-primary' : 'btn-secondary') :
          (d || isNew ? btn('bg-save', 'Save draft', 'btn-secondary') : '') + (s === 'scheduled' ? btn('bg-draft', 'Back to draft', 'btn-secondary') : '') + btn('bg-sched', s === 'scheduled' ? 'Change the date' : 'Schedule', 'btn-secondary') + btn('bg-pub', 'Publish now', 'btn-primary'));
      var el = doc.getElementById('bg-bar');
      el.innerHTML = '<div class="' + (d ? 'c-savebar' : 'bg-bar') + '" role="region" aria-label="Article actions"><span>' + RI.icon(d ? 'info' : live ? 'check' : 'file', 'i-sm') + '<span>' + text + '</span></span>' + acts + '</div>';
      RI.fillIcons(el);
    }
    function counts(){
      var tc = doc.getElementById('bg-tc'), sc = doc.getElementById('bg-smc'), bc = doc.getElementById('bg-bc');
      tc.textContent = f.title.length + ' of 70'; tc.classList.toggle('over', f.title.length > 70);
      sc.textContent = f.summary.length + ' of 160'; sc.classList.toggle('over', f.summary.length > 160);
      bc.textContent = B.words(f.body) + ' words, about ' + B.mins(f.body) + ' min read';
    }
    function refresh(){
      doc.getElementById('bg-pv').innerHTML = previewHTML();
      doc.getElementById('bg-serp').innerHTML = serpHTML();
      doc.getElementById('bg-ck').innerHTML = checksHTML(checks(f, p.id)); RI.fillIcons(doc.getElementById('bg-ck'));
      counts(); bar();
    }
    counts(); bar();

    /* ---- Typing ---- */
    var $ = function(x){ return doc.getElementById(x); };
    function read(){
      f.title = $('bg-t').value; f.topic = $('bg-tp').value; f.summary = $('bg-sm').value; f.body = $('bg-b').value; f.alt = $('bg-alt').value; f.author = $('bg-au').value;
      $('bg-tph').hidden = !B.topic(f.topic).hidden;
      if(!slugTouched) $('bg-s').value = B.slugify(f.title);
      f.slug = $('bg-s').value.trim();
      refresh();
    }
    $('bg-form').addEventListener('input', function(e){ if(e.target.id === 'bg-s') slugTouched = true; if(e.target.type !== 'file') read(); });

    /* ---- Section 6, the rich text box: each change is written into the hidden #bg-b as the stored text,
       then read() picks it up like any other field ---- */
    var ed = $('bg-doc'), ta = $('bg-b'), rte = ed.closest('.bg-rte');
    function push(){ ta.value = toText(ed); read(); }
    try { doc.execCommand('defaultParagraphSeparator', false, 'p'); } catch(e){}
    ed._sync = function(){
      var sel = doc.getSelection(); if(!sel.rangeCount || !ed.contains(sel.anchorNode)) return;
      ['bold', 'italic', 'insertUnorderedList', 'insertOrderedList'].forEach(function(c){ rte.querySelector('[data-cmd="' + c + '"]').setAttribute('aria-pressed', String(doc.queryCommandState(c))); });
      $('bg-blk').value = /^h\d$/i.test(String(doc.queryCommandValue('formatBlock') || '')) ? 'h2' : 'p';
    };
    function link(){
      var sel = doc.getSelection(), range = sel.rangeCount && ed.contains(sel.anchorNode) ? sel.getRangeAt(0).cloneRange() : null;
      var pages = [['renovation-cost/', 'Renovation costs, by area'], ['sample/', 'Sample report'], ['how-it-works/', 'How it works'], ['pricing/', 'Pricing']]
        .concat(Object.keys(RI.AREAS || {}).map(function(k){ return ['renovation-cost/' + k + '/', 'Renovation costs in ' + RI.AREAS[k].name]; }));
      var d = C.dialog('Add a link', '<form id="bg-lf" class="form-grid" novalidate><div class="field"><label for="bg-lp">A page on our site</label><span class="c-select"><select id="bg-lp"><option value="">Choose a page</option>' + pages.map(function(x){ return '<option value="' + x[0] + '">' + esc(x[1]) + '</option>'; }).join('') + '</select></span></div>' +
        '<div class="field"><label for="bg-lu">Or a web address</label><input class="input" id="bg-lu" placeholder="https://" autocomplete="off" spellcheck="false"><span class="err"></span></div>' +
        '<div class="cta-row" style="justify-content:flex-end"><button type="button" class="btn btn-secondary" data-dlg-close>Cancel</button><button type="submit" class="btn btn-primary">Add the link</button></div></form>');
      setTimeout(function(){ d.querySelector('#bg-lp').focus(); }, 30);
      d.querySelector('#bg-lf').addEventListener('submit', function(e){
        e.preventDefault();
        var pk = d.querySelector('#bg-lp'), ui = d.querySelector('#bg-lu'), u = pk.value || ui.value.trim();
        if(!u){ RI.form.setInvalid(ui, 'Choose a page or type a web address.'); ui.focus(); return; }
        if(!pk.value && !/^https?:\/\/\S+\.\S+/.test(u)){ RI.form.setInvalid(ui, 'Start the address with https://'); ui.focus(); return; }
        var label = pk.value ? pk.selectedOptions[0].textContent : u.replace(/^https?:\/\//, '').replace(/\/$/, '');
        d.close(); ed.focus(); if(range){ var s2 = doc.getSelection(); s2.removeAllRanges(); s2.addRange(range); }
        if(!range || range.collapsed) doc.execCommand('insertHTML', false, '<a href="' + esc(u) + '">' + esc(label) + '</a>&nbsp;'); else doc.execCommand('createLink', false, u);
        push();
      });
    }
    /* Chrome moves the cursor to the start of the line after making a list or a heading; put it back where it was.
       Positions are counted in letters from the start of the article, so they survive the browser rebuilding the line */
    function caretGet(){
      var s = doc.getSelection(); if(!s.rangeCount || !ed.contains(s.anchorNode)) return null;
      var r = s.getRangeAt(0), off = function(n, o){ var x = doc.createRange(); x.setStart(ed, 0); x.setEnd(n, o); return x.toString().length; };
      return {a:off(r.startContainer, r.startOffset), b:off(r.endContainer, r.endOffset), fwd:r.startContainer.nodeType === 3 && r.startOffset === 0};
    }
    function caretSet(c){
      if(!c) return;
      var w = doc.createTreeWalker(ed, NodeFilter.SHOW_TEXT), n, seen = 0, at = [null, null];
      while((n = w.nextNode())){
        var len = n.textContent.length;
        [c.a, c.b].forEach(function(i, k){ if(!at[k] && (c.fwd ? i < seen + len : i <= seen + len)) at[k] = [n, i - seen]; });
        seen += len; if(at[0] && at[1]) break;
      }
      if(!at[0]) return;
      var r = doc.createRange(); r.setStart(at[0][0], at[0][1]); r.setEnd((at[1] || at[0])[0], (at[1] || at[0])[1]);
      var s = doc.getSelection(); s.removeAllRanges(); s.addRange(r);
    }
    function run(cmd, val){ var c = /List|formatBlock/.test(cmd) ? caretGet() : null; doc.execCommand(cmd, false, val || null); caretSet(c); ed._sync(); push(); }
    var tb = rte.querySelector('.bg-tb');
    tb.addEventListener('mousedown', function(e){ if(e.target.closest('.bg-tbtn')) e.preventDefault(); });
    tb.addEventListener('click', function(e){
      var b = e.target.closest('.bg-tbtn'); if(!b) return; var c = b.getAttribute('data-cmd');
      ed.focus(); if(c === 'link') return link();
      run(c);
    });
    $('bg-blk').addEventListener('change', function(e){ e.stopPropagation(); ed.focus(); run('formatBlock', this.value === 'h2' ? 'h2' : 'p'); });
    ed.addEventListener('keydown', function(e){ if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){ e.preventDefault(); e.stopPropagation(); link(); } });
    ed.addEventListener('paste', function(e){ e.preventDefault(); doc.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain')); });
    ed.addEventListener('input', function(e){ e.stopPropagation(); push(); });
    $('bg-form').addEventListener('change', function(e){ if(e.target.id === 'bg-libs'){ if(e.target.value) setImg(e.target.value); return; } if(e.target.type === 'checkbox' || e.target.tagName === 'SELECT') read(); });

    /* ---- The photo: a file (kept as a data URL in this browser) or one of the site's photos ---- */
    function setImg(v){
      f.img = v; $('bg-dv').innerHTML = v ? '<img src="' + B.imgSrc(f) + '" alt="">' : ''; $('bg-drop').classList.toggle('has', !!v);
      $('bg-dt').textContent = v ? 'Replace the photo' : 'Drop a photo here, or choose a file'; $('bg-rm').hidden = !v;
      if(!/^data:/.test(v || '')) $('bg-libs').value = v || ''; else $('bg-libs').value = '';
      refresh();
    }
    function readFile(file){
      if(!file) return; if(!/^image\//.test(file.type)){ RI.toast('Choose an image file, such as a JPG or PNG.', 'warn'); return; }
      if(file.size > 1.5 * 1024 * 1024){ RI.toast('That photo is over 1.5 MB. Choose a smaller one.', 'warn'); return; }
      var rd = new FileReader(); rd.onload = function(){ setImg(rd.result); }; rd.readAsDataURL(file);
    }
    $('bg-file').addEventListener('change', function(){ readFile(this.files && this.files[0]); this.value = ''; });
    var drop = $('bg-drop');
    ['dragenter', 'dragover'].forEach(function(ev){ drop.addEventListener(ev, function(e){ e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function(ev){ drop.addEventListener(ev, function(e){ e.preventDefault(); drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function(e){ readFile(e.dataTransfer && e.dataTransfer.files[0]); });
    $('bg-rm').addEventListener('click', function(){ setImg(''); f.alt = ''; $('bg-alt').value = ''; refresh(); });

    /* ---- Saving, scheduling, publishing ---- */
    function store(patch, action){
      var now = Date.now(), list = all(), rec = Object.assign({}, p, f, {slug:f.slug || B.slugify(f.title) || p.id, updated:now}, patch || {});
      if(rec.sample && JSON.stringify(pick(rec)) !== saved) rec.sample = false;
      var found = false; list = list.map(function(x){ if(x.id === rec.id){ found = true; return rec; } return x; });
      if(!found) list.unshift(rec);
      save(list); p = rec; f = pick(rec); saved = JSON.stringify(f); isNew = false;
      C.log(action, rec.title || 'Untitled article', '', 'blog');
      return rec;
    }
    function blockers(){ return checks(f, p.id).filter(function(x){ return !x.ok && x.hard; }); }
    function stopIfBlocked(){
      var b = blockers(); if(!b.length) return false;
      RI.toast('Fix this first: ' + b[0].label.toLowerCase() + '.', 'warn');
      $('bg-ck').scrollIntoView({block:'nearest', behavior:'smooth'});
      return true;
    }
    /* After saving, publishing, scheduling or unpublishing: back to the list (user, Nov 28), where the article now sits
       at the top because the list is sorted by the last change */
    function reopen(msg, icon){ RI.toast(msg, icon || 'check'); window.scrollTo({top:0, left:0, behavior:'instant'}); C.go('#/blog'); }
    view.addEventListener('click', function(e){
      var b = e.target.closest('button'); if(!b || !b.id) return;
      if(b.id === 'bg-undo'){ C.render(); return; }
      if(b.id === 'bg-save'){
        if(!f.title.trim()){ RI.form.setInvalid($('bg-t'), 'Give the article a title before saving.'); $('bg-t').focus(); return; }
        if(stateOf(p) === 'published' && stopIfBlocked()) return;
        var live = stateOf(p) === 'published'; store(null, live ? 'Article updated' : 'Article saved');
        reopen(live ? 'Changes saved. Readers see them now.' : 'Draft saved.');
      }
      if(b.id === 'bg-pub'){
        if(stopIfBlocked()) return;
        A.confirm('Publish this article?', 'It shows on the public blog at once, and Sam sees it in the audit log.', 'Publish now', function(){
          store({status:'published', at:Date.now()}, 'Article published'); reopen('Published. It is on the blog now.');
        });
      }
      if(b.id === 'bg-sched'){
        if(stopIfBlocked()) return;
        var cur = p.status === 'scheduled' && p.at > Date.now() ? new Date(p.at).toISOString().slice(0, 10) : tomorrow();
        var d = C.dialog('Schedule this article', '<form id="bg-sf" class="form-grid" novalidate><div class="field"><label for="bg-sd">Goes live on</label><input class="input" type="date" id="bg-sd" min="' + tomorrow() + '" value="' + cur + '"><span class="help">At 9 in the morning. Until then it stays off the blog.</span><span class="err"></span></div>' +
          '<div class="cta-row" style="justify-content:flex-end"><button type="button" class="btn btn-secondary" data-dlg-close>Cancel</button><button type="submit" class="btn btn-primary">Schedule</button></div></form>');
        RI.fillIcons(d); setTimeout(function(){ d.querySelector('#bg-sd').focus(); }, 30);
        d.querySelector('#bg-sf').addEventListener('submit', function(ev){
          ev.preventDefault(); var inp = d.querySelector('#bg-sd'), v = inp.value, t = v ? new Date(v + 'T09:00:00').getTime() : NaN;
          if(!v || isNaN(t) || t <= Date.now()){ RI.form.setInvalid(inp, 'Pick a day after today.'); inp.focus(); return; }
          d.close(); store({status:'scheduled', at:t}, 'Article scheduled'); reopen('Scheduled for ' + C.date(t) + '.', 'clock');
        });
      }
      if(b.id === 'bg-draft'){ store({status:'draft', at:null}, 'Article moved back to drafts'); reopen('Moved back to drafts. It will not go live.'); }
      if(b.id === 'bg-unpub'){
        A.confirm('Unpublish this article?', 'It disappears from the public blog at once and goes back to drafts. You can publish it again later.', 'Unpublish', function(){
          store({status:'draft', at:null}, 'Article unpublished'); reopen('Unpublished. It is off the blog.');
        }, true);
      }
    });
  }
})();
