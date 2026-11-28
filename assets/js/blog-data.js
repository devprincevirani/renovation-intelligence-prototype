/* Blog (business model 5: "Blog / Renovation Knowledge Center: SEO articles about renovation costs, materials,
   homebuying, and project planning"). One list of articles shared by the public pages (blog.js) and the console
   (console/blog.js). The console keeps its copy under con.blog; the public pages read that copy when it exists, so an
   article published in the console shows on /blog/ in the same browser. The ten below are samples, tagged as such:
   plain words, no dollar figures (the cost pages and the free estimate give the numbers), never the engine's method. */
(function(){
  var RI = window.RI = window.RI || {};
  var DAY = 864e5;
  function d(y, m, day){ return Date.UTC(y, m - 1, day, 14); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  var TOPICS = [
    {key:'costs', name:'Renovation costs'},
    {key:'materials', name:'Materials'},
    {key:'buying', name:'Buying a home'},
    {key:'planning', name:'Project planning'}
  ];
  var TEAM = 'Renovation Intelligence team';

  var SEED = [
    {id:'b1', slug:'what-an-early-estimate-covers', topic:'planning', status:'published', at:d(2026, 11, 24), updated:d(2026, 11, 24),
     title:'What an early estimate covers, and what it can\'t know yet',
     summary:'An estimate from photos is a planning tool. What it can tell you, what it leaves open, and how to use both.',
     img:'questions-painter.jpg', alt:'A man holding a paint roller stops in front of a half-painted wall and scratches his head',
     related:['type:bungalow', 'area:dearborn'],
     body:[
       '## What it covers',
       'An early estimate looks at what can be seen: the rooms, the parts in each room and their visible condition. It gives a Low and a High for the work under each goal.',
       '## What it cannot know yet',
       '- Anything inside walls, under floors or in the house systems.\n- Exact sizes that nobody measured.\n- Local prices on the day a contractor prices the job.',
       '## Why a range helps',
       'A range is honest about what is not known yet. The width of the range tells you how sure the number is.',
       '## Lines that are not confirmed',
       'A good estimate lists what it could not confirm instead of hiding it inside the total. Those lines tell you what to check next.',
       '## The next step',
       'Use the estimate to plan and to compare houses. Then ask a contractor to see the house before any work starts. [See how it works](how-it-works/).'
     ].join('\n\n')},

    {id:'b2', slug:'kitchen-renovation-cost', topic:'costs', status:'published', at:d(2026, 11, 20), updated:d(2026, 11, 22),
     title:'What changes the cost of a kitchen renovation',
     summary:'Cabinets, counters, the floor and what sits behind the walls. The parts that move a kitchen budget most, and how to see them before you start.',
     img:'kitchen-dated-wide.jpg', alt:'An older kitchen with white cabinets, open shelves and a black and white tile floor',
     related:['area:livonia', 'type:colonial'],
     body:[
       '## Cabinets set the size of the budget',
       'Cabinets are usually the largest part of a kitchen. Keeping sound boxes and refinishing the fronts costs far less than replacing the whole run. Replacing makes sense when the boxes are damaged, the layout does not work, or you want a different look.',
       '## Counters and the backsplash follow the cabinets',
       'New cabinets almost always mean a new countertop, and often a new backsplash. If you keep the cabinets, a sound countertop can often stay too.',
       '## The floor depends on the rooms around it',
       'A kitchen floor often runs into the dining room or a hallway. The cost depends on how much floor is replaced, not only on the kitchen.',
       '## Sinks, faucets and lights add up',
       'Each fixture is small on its own. Together they make a real part of the total, so count every one.',
       '## What is hidden stays a question',
       'Old wiring, old plumbing or water damage behind the cabinets can only be seen once work starts. A good estimate names these as open questions instead of guessing.',
       '## See the parts of your own kitchen',
       'Add a photo of each wall of your kitchen and you get a Low and a High for each part, under three goals. [See renovation costs by area](renovation-cost/).'
     ].join('\n\n')},

    {id:'b3', slug:'essential-standard-premium', topic:'costs', status:'published', at:d(2026, 11, 18), updated:d(2026, 11, 18),
     title:'Essential, Standard or Premium: which level fits your house',
     summary:'Three levels of renovation for the same house. What each one keeps, repairs or replaces, and how to pick the one that fits your plans.',
     img:'rooms/living-arches.jpg', alt:'An empty living room with arched openings and a wood floor',
     related:['type:brick-ranch', 'area:clinton-township'],
     body:[
       '## Essential: fix what is worn or broken',
       'Essential keeps what still works. It repairs, cleans and replaces only what has failed. It suits a house you plan to sell soon, or a tight first budget.',
       '## Standard: refresh the house',
       'Standard updates the parts that look dated, such as cabinet fronts, counters, floors and lights, with sound mid-range materials. It suits a house you plan to live in for several years.',
       '## Premium: replace and upgrade',
       'Premium replaces more and chooses better materials, such as new cabinets, stone counters and tile. It suits a long-term home where you want the work to last.',
       '## You can mix levels by room',
       'You do not have to pick one level for the whole house. Many people choose Standard for the kitchen and Essential for the rest.',
       '## Questions to ask yourself',
       '- How long will you live in the house?\n- Which rooms matter most to you?\n- How much of the budget should stay free for surprises?',
       '[See what each level does in a sample house](sample/).'
     ].join('\n\n')},

    {id:'b4', slug:'cabinets-refinish-or-replace', topic:'materials', status:'published', at:d(2026, 11, 16), updated:d(2026, 11, 16),
     title:'Refinish or replace kitchen cabinets?',
     summary:'Refinishing keeps the boxes and changes the look. Replacing changes everything. How to tell which one your kitchen needs.',
     img:'cabinet-run.jpg', alt:'A long run of light wood cabinets under a row of windows',
     related:['type:tri-level', 'area:sterling-heights'],
     body:[
       '## Look at the boxes, not the doors',
       'Open the doors. If the shelves are flat, the boxes are dry and the frames are solid, the cabinets are sound. Sound boxes are good candidates for refinishing.',
       '## When refinishing makes sense',
       '- The layout works for you.\n- The boxes are solid wood or good plywood.\n- You want a new color, new hardware or new door fronts.',
       '## When replacing makes sense',
       '- The boxes are swollen, cracked or water damaged.\n- You want a different layout or more storage.\n- The doors and boxes are made of a material that does not take paint well.',
       '## Hardware is part of the job',
       'New pulls and hinges change how cabinets look and feel. Count every door and drawer when you plan.',
       '## See it on your own kitchen',
       'Your estimate shows what each goal does with your cabinets, side by side. [See how it works](how-it-works/).'
     ].join('\n\n')},

    {id:'b5', slug:'buying-a-house-that-needs-work', topic:'buying', status:'published', at:d(2026, 11, 13), updated:d(2026, 11, 13),
     title:'What to check before buying a house that needs work',
     summary:'A short list of what to look at during a showing, so the renovation budget is part of your offer, not a surprise after closing.',
     img:'brick-ranch.jpg', alt:'A brick ranch house with a front lawn and a car in the driveway',
     related:['area:warren', 'type:brick-ranch'],
     body:[
       '## Start with the big systems',
       'The roof, furnace, water heater, electrical panel and plumbing cost the most to replace. Ask how old they are and have an inspector check them.',
       '## Then look at the rooms you will live in',
       '- Kitchen: cabinets, counters, sink and floor.\n- Bathrooms: tub, tile, vanity and signs of leaks.\n- Floors: what is under the carpet.\n- Walls and ceilings: cracks and water stains.',
       '## Take a photo of every room',
       'Photos help you compare houses later and plan the work. Take one of each wall where you can.',
       '## Separate wants from needs',
       'A dated kitchen is a choice. A leaking roof is not. Plan the needs first.',
       '## Know what nobody can see yet',
       'Anything inside walls, under floors or in the systems stays unknown until someone opens it or inspects it. Keep part of the budget for that.',
       '[See typical renovation costs by area](renovation-cost/).'
     ].join('\n\n')},

    {id:'b6', slug:'choosing-flooring', topic:'materials', status:'published', at:d(2026, 11, 11), updated:d(2026, 11, 11),
     title:'LVP, hardwood or tile: choosing a floor',
     summary:'Where each kind of floor works best, how it wears, and what changes the price of the job.',
     img:'wood-floor.jpg', alt:'A wide plank wood floor in a hallway',
     related:['type:bungalow', 'area:livonia'],
     body:[
       '## Luxury vinyl plank',
       'Luxury vinyl plank, often called LVP, handles water well, is easy to clean and suits kitchens, basements and busy family rooms. It can go over many existing floors.',
       '## Hardwood',
       'Hardwood lasts for decades and can be sanded and refinished more than once. It suits living rooms, dining rooms and bedrooms. Keep it away from wet areas.',
       '## Tile',
       'Porcelain and ceramic tile stand up to water and wear. They suit bathrooms, entries and kitchens. Tile takes longer to install than plank floors.',
       '## What changes the price of the job',
       '- How much floor is replaced, in square feet.\n- What has to come out first, such as old carpet or tile.\n- Whether the subfloor needs repair.\n- Stairs, which take more time for each step.',
       '## Already have hardwood?',
       'Look under the carpet before you plan. Refinishing a sound hardwood floor is often the better choice.'
     ].join('\n\n')},

    {id:'b7', slug:'renovation-budget-before-offer', topic:'buying', status:'published', at:d(2026, 11, 9), updated:d(2026, 11, 9),
     title:'Plan the renovation budget before you make an offer',
     summary:'The price of the house is only half of the plan. How to put the renovation into your numbers before you commit.',
     img:'colonial.jpg', alt:'A two-story wood-sided colonial house with a green front door',
     related:['type:colonial', 'area:dearborn'],
     body:[
       '## Price the house and the work together',
       'Two houses at the same price can need very different work. Add the renovation to the price before you compare them.',
       '## Use a range, not one number',
       'A planning range shows a Low and a High. If your budget is tight, plan with the High.',
       '## Decide what happens first',
       '- Safety and systems: roof, electrical, plumbing and heating.\n- What you need to move in: floors, paint, a working kitchen and bathroom.\n- What can wait: upgrades and finishes.',
       '## Keep a contingency',
       'Set aside part of the budget for what nobody can see yet. [Why every renovation budget needs a contingency](blog/renovation-contingency/).',
       '## Bring the numbers to your agent',
       'A clear plan helps you and your agent talk about the offer with facts. [See a sample report](sample/).'
     ].join('\n\n')},

    {id:'b8', slug:'renovation-contingency', topic:'planning', status:'published', at:d(2026, 11, 6), updated:d(2026, 11, 6),
     title:'Why every renovation budget needs a contingency',
     summary:'Older houses hold surprises. A contingency is the part of the budget kept for them, so one surprise does not stop the project.',
     img:'rooms/basement-utility.jpg', alt:'An unfinished basement with a furnace, a water heater, ducts and a washer and dryer',
     related:['area:warren', 'type:tri-level'],
     body:[
       '## What a contingency is',
       'A contingency is money you set aside for work nobody can see before the job starts. It is part of the plan, not an extra.',
       '## What it usually covers',
       '- Water damage found behind cabinets or under floors.\n- Old wiring or plumbing that has to be updated once the walls are open.\n- Repairs to the subfloor under old flooring.',
       '## How much to keep',
       'Older houses and bigger jobs need a larger share. Ask your contractor what they usually find in houses like yours.',
       '## If you do not need it',
       'Money you do not use stays yours. Many people spend it on an upgrade at the end of the job.',
       '## Plan it from the start',
       'Put the contingency in the budget on day one, not after the first surprise. [What an early estimate covers](blog/what-an-early-estimate-covers/).'
     ].join('\n\n')},

    {id:'b9', slug:'bathroom-renovation-cost', topic:'costs', status:'draft', at:null, updated:d(2026, 11, 26),
     title:'Bathroom renovation: what changes the price',
     summary:'The tub, the tile and the vanity. The parts that move a bathroom budget, and what to check first.',
     img:'ba/bath-before.jpg', alt:'A bathroom with green wall tile, a wall-hung sink and a speckled floor',
     related:['type:bungalow'],
     body:[
       '## The tub and the tile around it',
       'Reglazing a sound tub costs much less than replacing the tub and the tile around it.',
       '## The vanity and the toilet',
       'A new vanity, top and faucet change the whole room. A toilet can often be repaired instead of replaced.',
       '## Water you cannot see',
       'A soft floor or stains near the tub point to a leak. Check those first.'
     ].join('\n\n')},

    {id:'b10', slug:'finishing-a-basement', topic:'planning', status:'scheduled', at:d(2026, 12, 5), updated:d(2026, 11, 27),
     title:'Finishing a basement: where the work goes',
     summary:'Walls, floors, ceilings and light. What finishing a basement involves, and what to check before you start.',
     img:'rooms/basement-finished.jpg', alt:'A finished basement with a wood floor, a fireplace and recessed lights',
     related:['type:tri-level', 'area:sterling-heights'],
     body:[
       '## Check for water first',
       'A dry basement comes first. Look for stains, a musty smell and damp walls.',
       '## Walls, floor and ceiling',
       'Most of the work is framing, insulation, drywall, flooring and a ceiling.',
       '## Light and power',
       'Plan outlets and lights early, before the walls are closed.'
     ].join('\n\n')}
  ].map(function(p){ p.author = TEAM; p.sample = true; return p; });

  /* The eight sample articles have their own page at blog/<slug>/; any other article opens at blog/article/?a=<slug> */
  var SHELLS = ['what-an-early-estimate-covers', 'kitchen-renovation-cost', 'essential-standard-premium', 'cabinets-refinish-or-replace',
                'buying-a-house-that-needs-work', 'choosing-flooring', 'renovation-budget-before-offer', 'renovation-contingency'];

  function all(){
    var v = RI.store && RI.store.get('con.blog');
    return Array.isArray(v) && v.length ? v : SEED;
  }
  function isLive(p){ return p.status === 'published' || (p.status === 'scheduled' && p.at && p.at <= Date.now()); }
  function live(){ return all().filter(isLive).sort(function(a, b){ return (b.at || 0) - (a.at || 0); }); }
  function bySlug(slug){ return all().filter(function(p){ return p.slug === slug; })[0] || null; }
  function topic(key){ return TOPICS.filter(function(t){ return t.key === key; })[0] || {key:key, name:key}; }
  function href(u){ return /^https?:/.test(u) ? u : (RI.url ? RI.url(u) : u); }
  function urlFor(p){ return SHELLS.indexOf(p.slug) > -1 ? 'blog/' + p.slug + '/' : 'blog/article/?a=' + encodeURIComponent(p.slug); }
  /* A sample photo is a file name under assets/img; a photo added in the console is kept as a data URL */
  function imgSrc(p){ return !p || !p.img ? '' : /^data:/.test(p.img) ? p.img : (RI.img ? RI.img(p.img) : p.img); }

  /* The article text: "## " starts a heading, a blank line starts a new paragraph, "- " lines make a list and
     "1. " lines a numbered list, **words** are bold, *words* italic, [words](address) makes a link. Everything else is
     escaped. The console's rich text box writes this same text (Nov 28), so the page shows what the editor showed. */
  function inline(s, raw){
    return esc(s).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function(m, t, u){
      var ext = /^https?:/.test(u);
      return '<a href="' + esc(raw ? u : href(u)) + '"' + (ext && !raw ? ' rel="noopener"' : '') + '>' + t + '</a>';
    }).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }
  /* raw: keep link addresses as written (the console editor reads them back) */
  function render(body, raw){
    return String(body || '').replace(/\r/g, '').split(/\n\s*\n/).map(function(b){
      b = b.trim(); if(!b) return '';
      if(/^##\s+/.test(b)) return '<h2>' + inline(b.replace(/^##\s+/, ''), raw) + '</h2>';
      var lines = b.split('\n');
      if(lines.every(function(l){ return /^\s*-\s+/.test(l); })) return '<ul>' + lines.map(function(l){ return '<li>' + inline(l.replace(/^\s*-\s+/, ''), raw) + '</li>'; }).join('') + '</ul>';
      if(lines.every(function(l){ return /^\s*\d+\.\s+/.test(l); })) return '<ol>' + lines.map(function(l){ return '<li>' + inline(l.replace(/^\s*\d+\.\s+/, ''), raw) + '</li>'; }).join('') + '</ol>';
      return '<p>' + inline(lines.join(' '), raw) + '</p>';
    }).join('');
  }
  function words(body){ return String(body || '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').split(/\s+/).filter(Boolean).length; }
  function mins(body){ return Math.max(1, Math.ceil(words(body) / 200)); }
  function date(t){ return t ? new Date(t).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'}) : ''; }
  /* Related cost pages: "area:livonia" or "type:bungalow" */
  function related(p){
    return (p.related || []).map(function(r){
      var k = r.split(':'), area = k[0] === 'area';
      var src = area ? RI.AREAS : RI.TYPES, x = src && src[k[1]];
      if(!x) return null;
      return {href:area ? 'renovation-cost/' + k[1] + '/' : 'renovation-cost/house-types/' + k[1] + '/', name:area ? 'Renovation costs in ' + x.name : 'Renovating a ' + x.name.toLowerCase()};
    }).filter(Boolean);
  }
  function slugify(s){ return String(s || '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80); }

  RI.BLOG = {TOPICS:TOPICS, SEED:SEED, SHELLS:SHELLS, TEAM:TEAM, DAY:DAY, all:all, live:live, isLive:isLive, bySlug:bySlug, topic:topic,
             urlFor:urlFor, imgSrc:imgSrc, render:render, words:words, mins:mins, date:date, related:related, slugify:slugify, esc:esc};
})();
