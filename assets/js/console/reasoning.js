/* Console: the reasoning. Room templates (APP_FLOW 7, M1-35); more screens are added below as they land.
   Every edit is a draft that waits in the publish queue; only Sam publishes. */
(function(){
  var RI = window.RI, A = RI.App, C = RI.Con, doc = document;
  var DAY = 86400000, now = Date.now();

  /* ---------- The component library: families and codes as in Sam's files ---------- */
  C.LIB = [
    ['CB-01','Base cabinets','LF'],['CB-02','Wall cabinets','LF'],['CT-01','Countertop','SF'],['TL-02','Backsplash','SF'],['PL-01','Kitchen sink and faucet','EA'],
    ['AP-01','Range and hood','EA'],['AP-02','Refrigerator','EA'],['FL-01','Floor','SF'],['PT-01','Walls','SF'],['PT-02','Ceiling','SF'],['TR-01','Baseboard','LF'],
    ['TR-02','Door and window casing','LF'],['DR-01','Interior doors','EA'],['EL-01','Ceiling light','EA'],['EL-02','Switches and receptacles','EA'],['PL-02','Toilet','EA'],
    ['PL-03','Vanity and faucet','EA'],['BT-01','Tub and surround','EA'],['TL-01','Floor tile','SF'],['EL-03','Vanity light','EA'],['PT-03','Closet walls and shelf','SF'],
    ['EX-01','Siding','SF'],['PT-04','Exterior trim','LF'],['DR-02','Entry door','EA'],['RF-02','Gutters and downspouts','LF'],['PT-05','Basement walls','SF'],['FL-02','Stairs','EA']
  ];
  C.lib = function(code){ return C.LIB.filter(function(x){ return x[0] === code; })[0] || [code, code, 'EA']; };
  C.FAMILY = {CB:'Cabinetry', CT:'Countertops', TL:'Tile', PL:'Plumbing fixtures', AP:'Appliances', FL:'Flooring', PT:'Painting', TR:'Trim', DR:'Doors', EL:'Lighting and devices', BT:'Bath', EX:'Exterior', RF:'Roof and gutters'};

  /* ---------- Room templates (APP_FLOW 7, BACKLOG M1-22 and M1-35, SCHEMA 5) ----------
     A template is the standard contents of a room type: each item is a component and its usual count.
     Names and IDs come from Sam's guide: BA-01 to BA-17, FL-01 to FL-12 and TR-01 to TR-10 have IDs there;
     the kitchen, painting, lighting, exterior and basement parts are named with their work type code only.
     Mechanicals (SY) are recognized and shown as guidance, never scored or priced. */
  C.WORK = {CB:'Kitchen cabinets', CT:'Countertops and backsplash', PL:'Plumbing fixtures', AP:'Appliances', EL:'Lighting and electrical', BA:'Bathroom', FL:'Flooring', PT:'Painting', TR:'Doors and trim', EX:'Exterior', BS:'Basement', SY:'Mechanicals'};
  C.CATALOG = {
    cab:['', 'Cabinets', 'CB', 'LF'], ctop:['', 'Countertops', 'CT', 'SF'], bspl:['', 'Backsplash', 'CT', 'SF'],
    sink:['', 'Sink', 'PL', 'EA'], fauc:['', 'Faucet', 'PL', 'EA'], appl:['', 'Appliances', 'AP', 'EA'], klight:['', 'Kitchen lighting', 'EL', 'EA'],
    ba01:['BA-01', 'Vanity cabinetry', 'BA', 'EA'], ba02:['BA-02', 'Vanity countertop', 'BA', 'EA'], ba03:['BA-03', 'Sink', 'BA', 'EA'], ba04:['BA-04', 'Faucet', 'BA', 'EA'],
    ba05:['BA-05', 'Toilet', 'BA', 'EA'], ba06:['BA-06', 'Bathtub', 'BA', 'EA'], ba07:['BA-07', 'Shower base', 'BA', 'EA'], ba08:['BA-08', 'Tub or shower surround', 'BA', 'SF'],
    ba09:['BA-09', 'Shower valve trim, head, spout', 'BA', 'EA'], ba10:['BA-10', 'Shower enclosure', 'BA', 'EA'], ba11:['BA-11', 'Bathroom floor', 'BA', 'SF'], ba12:['BA-12', 'Mirror', 'BA', 'EA'],
    ba13:['BA-13', 'Medicine cabinet', 'BA', 'EA'], ba14:['BA-14', 'Accessories', 'BA', 'EA'], ba15:['BA-15', 'Exhaust fan', 'BA', 'EA'], ba16:['BA-16', 'Vanity lighting', 'BA', 'EA'], ba17:['BA-17', 'Wall finishes', 'BA', 'SF'],
    floor:['FL-01 to FL-11', 'Floor, material read from the photos', 'FL', 'SF'], fl11:['FL-11', 'Transitions', 'FL', 'EA'], fl12:['FL-12', 'Stairs', 'FL', 'EA'],
    walls:['', 'Interior walls', 'PT', 'SF'], ceil:['', 'Ceilings', 'PT', 'SF'], closet:['', 'Closets', 'PT', 'SF'],
    tr01:['TR-01', 'Interior passage doors', 'TR', 'EA'], tr02:['TR-02', 'Closet doors', 'TR', 'EA'], tr03:['TR-03', 'Door casing', 'TR', 'LF'], tr04:['TR-04', 'Baseboards', 'TR', 'LF'], tr05:['TR-05', 'Door hardware', 'TR', 'Sets'],
    tr06:['TR-06', 'Door jambs', 'TR', 'EA'], tr07:['TR-07', 'Window casing', 'TR', 'LF'], tr08:['TR-08', 'Crown moulding', 'TR', 'LF'], tr09:['TR-09', 'Shoe moulding', 'TR', 'LF'], tr10:['TR-10', 'Other decorative trim', 'TR', 'LF'],
    light:['', 'Light fixtures', 'EL', 'EA'], deco:['', 'Decorative fixture', 'EL', 'EA'], recess:['', 'Recessed lights', 'EL', 'EA'], cfan:['', 'Ceiling fans', 'EL', 'EA'], dev:['', 'Switches and receptacles', 'EL', 'EA'], plates:['', 'Cover plates', 'EL', 'EA'],
    util:['', 'Utility area cleaning', 'BS', 'EA'],
    siding:['', 'Siding', 'EX', 'SF'], brick:['', 'Brick, masonry', 'EX', 'SF'], xtrim:['', 'Trim, fascia, soffit', 'EX', 'LF'], win:['', 'Windows', 'EX', 'EA'], gut:['', 'Gutters, downspouts', 'EX', 'LF'],
    entry:['', 'Front entry door', 'EX', 'EA'], gdoor:['', 'Garage door', 'EX', 'EA'], drive:['', 'Driveway, walkways', 'EX', 'SF'], porch:['', 'Porch, patio, deck', 'EX', 'SF'], fence:['', 'Fence', 'EX', 'LF'], land:['', 'Landscaping', 'EX', 'SF'],
    roof:['', 'Roof covering', 'SY', ''], furn:['', 'Furnace', 'SY', ''], ac:['', 'Air conditioning', 'SY', ''], wh:['', 'Water heater', 'SY', ''], panel:['', 'Electrical panel', 'SY', ''], sump:['', 'Sump pump', 'SY', ''], insul:['', 'Insulation', 'SY', ''], vent:['', 'Ventilation', 'SY', '']
  };
  var cat = function(k){ return C.CATALOG[k] || ['', k, '', 'EA']; };
  var measured = function(k){ var u = cat(k)[3]; return u === 'SF' || u === 'LF'; };
  var guide = function(k){ return cat(k)[2] === 'SY'; };
  /* SCHEMA room_types.level: above grade, basement or exterior */
  var LEVELS = [['above','Above grade'], ['basement','Basement'], ['exterior','Exterior']];
  var levelOf = function(k){ return /^(basement|mechanical)$/.test(k) ? 'basement' : RI.ROOM_TYPES.outside.some(function(r){ return r[0] === k; }) ? 'exterior' : 'above'; };

  C.SEEDS.push(function(){
    /* Usual counts only where the guide gives one or the room defines it (a bathroom has one toilet).
       The lighting counts are the guide's starting counts. Everything else stays Not set, never zero */
    var I = function(k, lo, hi){ return {k:k, lo:lo == null ? null : lo, hi:hi == null ? (lo == null ? null : lo) : hi}; };
    var finish = function(){ return [I('floor'), I('walls'), I('ceil'), I('tr04'), I('tr03'), I('tr07')]; };
    var room = function(lights, extra){ return extra.concat([lights, I('dev')]).concat(finish()); };
    var fullBath = [I('ba01',1), I('ba02',1), I('ba03',1), I('ba04',1), I('ba05',1), I('ba06'), I('ba08'), I('ba09',1), I('ba11'), I('ba12',1), I('ba13'), I('ba14'), I('ba15',1), I('ba16',1), I('ba17'), I('tr01',1), I('tr03'), I('ceil')];
    var T = {
      kitchen:[I('cab'), I('ctop'), I('bspl'), I('sink',1), I('fauc',1), I('appl'), I('klight',4,6), I('dev')].concat(finish()),
      'primary-bath':fullBath, 'secondary-bath':fullBath,
      'half-bath':[I('ba01',1), I('ba02',1), I('ba03',1), I('ba04',1), I('ba05',1), I('ba11'), I('ba12',1), I('ba14'), I('ba15'), I('ba16',1), I('ba17'), I('tr01',1), I('tr03'), I('ceil')],
      bedroom:room(I('light',1), [I('tr01',1), I('tr05',1), I('tr02'), I('closet')]),
      living:room(I('light',4,6), []), family:room(I('light',6,8), []), dining:room(I('deco',1), []), hallway:room(I('light',1,3), []),
      office:room(I('light'), [I('tr01',1)]), laundry:room(I('light'), []), mudroom:room(I('light'), []), entry:room(I('light'), []), sunroom:room(I('light'), []),
      attic:[I('insul'), I('vent')],
      basement:[I('floor'), I('walls'), I('ceil'), I('light'), I('dev'), I('tr01'), I('tr04'), I('fl12',1), I('util',1), I('furn'), I('wh'), I('sump')],
      mechanical:[I('util',1), I('furn'), I('ac'), I('wh'), I('panel')],
      'ext-front':[I('siding'), I('brick'), I('xtrim'), I('win'), I('gut'), I('entry',1)], 'ext-rear':[I('siding'), I('brick'), I('xtrim'), I('win'), I('gut')], 'ext-side':[I('siding'), I('brick'), I('xtrim'), I('win'), I('gut')],
      roof:[I('roof')], garage:[I('gdoor')], driveway:[I('drive')], deck:[I('porch')], patio:[I('porch')], porch:[I('porch')], yard:[I('land'), I('fence')]
    };
    var out = {};
    RI.ROOM_TYPES.inside.concat(RI.ROOM_TYPES.outside).forEach(function(r){
      var k = r[0], items = (T[k] || []).map(function(x){ return Object.assign({}, x); });
      out[k] = {name:r[1], level:levelOf(k), items:items, v:1, at:now - 12 * DAY, by:'Sam', note:items.length ? 'First version' : '', hist:[]};
    });
    /* The kitchen has a short history, so the versions list has something to show */
    var k = out.kitchen, before = k.items.map(function(x){ return x.k === 'klight' ? I('klight') : Object.assign({}, x); });
    k.hist = [{v:1, at:now - 12 * DAY, by:'Sam', note:'First version', why:'', items:before}];
    k.v = 2; k.at = now - 3 * DAY; k.note = 'Kitchen lighting usual count set to 4 to 6'; k.why = 'The starting count for a small kitchen in the guide';
    C.set('rtpl', out);
  });
  C.APPLY.templates = function(d){
    var t = C.get('rtpl', {}), x = t[d.ref]; if(!x || !d.after || !d.after.items) return;
    x.hist = (x.hist || []).concat([{v:x.v, at:x.at, by:x.by, note:x.note, why:x.why, items:x.items}]);
    x.items = d.after.items; x.v++; x.at = Date.now(); x.by = d.by || 'Sam'; x.note = d.summary || ''; x.why = d.why || '';
    C.set('rtpl', t);
  };
  C.BEFORE.templates = function(d){ var x = (C.get('rtpl', {}) || {})[d.ref]; return x ? {v:x.v, before:{items:C.copy(x.items)}} : null; };
  var countText = function(it){
    if(guide(it.k)) return '<span class="lb lb-guide">Guidance only</span>';
    if(it.lo == null) return '<span class="lb lb-unset">Not set</span>';
    var n = it.lo === it.hi ? String(it.lo) : it.lo + ' to ' + it.hi;
    return measured(it.k) ? '<span class="rt-n">' + n + ' ' + cat(it.k)[3] + '</span><small class="rt-prov">Typical, provisional</small>' : '<span class="rt-n">' + n + '</span>';
  };
  /* What a draft changes, in words */
  var diff = function(from, to){
    var out = [], key = function(l){ var o = {}; l.forEach(function(x){ o[x.k] = x; }); return o; }, A0 = key(from), B0 = key(to);
    to.forEach(function(x){ if(!A0[x.k]) out.push(['Added', cat(x.k)[1]]); else if(A0[x.k].lo !== x.lo || A0[x.k].hi !== x.hi) out.push(['Changed', cat(x.k)[1] + ': ' + plain(A0[x.k]) + ' to ' + plain(x)]); });
    from.forEach(function(x){ if(!B0[x.k]) out.push(['Removed', cat(x.k)[1]]); });
    return out;
  };
  var plain = function(it){ return it.lo == null ? 'not set' : it.lo === it.hi ? String(it.lo) : it.lo + ' to ' + it.hi; };

  C.route('/room-templates', function(view){
    var all = C.get('rtpl', {}), keys = Object.keys(all), qr = C.query(), cur = all[qr.room] ? qr.room : 'kitchen', edit = null, q = '';
    var canEdit = C.can('rulebook.edit'), stepIn = !!qr.room, editing = false;
    /* Drafts saved before templates had usual counts cannot be applied; retire them once */
    var ds = C.drafts(), old = ds.filter(function(d){ return d.area === 'templates' && d.status === 'queued' && !(d.after && d.after.items); });
    if(old.length){ old.forEach(function(d){ d.status = 'discarded'; d.doneAt = Date.now(); d.doneBy = 'Prototype update'; d.note = 'Saved in an older template format'; }); C.set('drafts', ds); }
    view.innerHTML = C.page({kicker:'Rulebook', title:'Room templates', sub:'The standard contents of each room type, so nobody types the obvious. The photos confirm what is really there.',
      body:'<div class="c-split rt-split' + (stepIn ? ' in' : '') + '" id="rt-split"><aside class="c-list" aria-label="Room types">' + C.search('rt-q', 'Find a room type', '') + '<div id="rt-list"></div></aside><section class="c-detail" id="rt-detail" aria-live="polite"></section></div>'});
    function list(){
      var v = q.toLowerCase();
      doc.getElementById('rt-list').innerHTML = LEVELS.map(function(L){
        var ks = keys.filter(function(k){ return all[k].level === L[0] && (!v || all[k].name.toLowerCase().indexOf(v) > -1); }); if(!ks.length) return '';
        return '<p class="c-list-g">' + L[1] + '</p>' + ks.map(function(k){ var t = all[k], dr = C.draftFor('templates', k);
          return '<button type="button" class="c-li' + (k === cur ? ' on' : '') + '" data-k="' + k + '"><span><b>' + t.name + '</b><small>' + (t.items.length ? t.items.length + ' items · v' + t.v : 'No template yet') + '</small></span>' + (dr ? C.lbl('queued') : '') + '</button>'; }).join('');
      }).join('') || '<p class="ct-none">No room type matches.</p>';
    }
    function detail(){
      var t = all[cur], items = edit || t.items, dirty = !!edit, el = doc.getElementById('rt-detail'), dr = C.draftFor('templates', cur), ed = canEdit && (editing || dirty);
      var nGuide = items.filter(function(x){ return guide(x.k); }).length, lvl = (LEVELS.filter(function(L){ return L[0] === t.level; })[0] || [])[1];
      var changes = dr && dr.after && dr.after.items ? diff(t.items, dr.after.items) : [];
      el.innerHTML = '<button type="button" class="c-back rt-back" id="rt-back">' + RI.icon('arrow','i-sm flip') + 'All room types</button>' +
        C.draftBar('templates', cur) +
        (changes.length ? '<ul class="rt-diff" aria-label="What the queued draft changes">' + changes.map(function(c){ return '<li><span class="lb lb-off">' + c[0] + '</span>' + RI.esc(c[1]) + '</li>'; }).join('') + '</ul>' : '') +
        '<header class="c-dhead"><div><p class="c-kicker">' + lvl + '</p><h2>' + t.name + '</h2><p class="c-sub">Version ' + t.v + ', published ' + C.ago(t.at) + ' by ' + RI.esc(t.by || 'Sam') + '. ' + items.length + ' items' + (nGuide ? ', ' + nGuide + ' of them guidance only' : '') + '.</p></div>' + '<div class="rt-hact">' + (dirty ? C.lbl('draft', 'not saved') : C.lbl('published')) + (canEdit && !ed ? '<button type="button" class="btn btn-secondary btn-sm" id="rt-edit">' + RI.icon('tool','i-sm') + 'Edit template</button>' : '') + (ed && !dirty ? '<button type="button" class="btn btn-secondary btn-sm" id="rt-done">Done</button>' : '') + '</div></header>' +
        (items.length ? C.table({cls:'rt-tbl', cols:[{label:'Component'}, {label:'Work type'}, {label:'Usual count'}, {label:'Unit'}].concat(ed ? [{label:''}] : []), rows:items.map(function(it, i){ var c = cat(it.k);
          var cnt = ed && !guide(it.k) ? '<span class="rt-edit"><label><span class="sr">' + (measured(it.k) ? 'Typical size, low' : 'Usual count, from') + ' for ' + c[1] + '</span><input type="number" min="0" inputmode="numeric" class="rt-in" data-lo="' + i + '" value="' + (it.lo == null ? '' : it.lo) + '" placeholder="Not set"></label><span class="to">to</span><label><span class="sr">' + (measured(it.k) ? 'Typical size, high' : 'Usual count, to') + ' for ' + c[1] + '</span><input type="number" min="0" inputmode="numeric" class="rt-in" data-hi="' + i + '" value="' + (it.hi == null || it.hi === it.lo ? '' : it.hi) + '" placeholder="' + (it.lo == null ? '' : 'Same') + '"></label>' + (measured(it.k) ? '<small class="rt-prov">Typical, provisional</small>' : '') + '</span>' : countText(it);
          return {attr:guide(it.k) ? 'class="rt-guide"' : '', cells:['<span class="rt-cmp"><b>' + c[1] + '</b>' + (c[0] ? '<small class="rt-id">' + c[0] + '</small>' : '') + (guide(it.k) ? '<small>Recognized in photos. Never scored or priced</small>' : '') + '</span>',
            '<span class="rt-wt"><code>' + c[2] + '</code>' + (C.WORK[c[2]] || '') + '</span>', cnt, c[3] || '<span class="muted">None</span>'].concat(ed ? ['<button type="button" class="icon-btn sm" data-rm="' + i + '" aria-label="Remove ' + c[1] + '">' + RI.icon('x','i-sm') + '</button>'] : [])}; })}) :
          '<div class="c-empty">' + RI.icon('ruler') + '<p>' + (t.level === 'exterior' || cur === 'other' ? 'No work type in Sam\'s guide covers this room type yet.' : 'This room type has no template yet.') + ' Its photos are kept and read; nothing in it is priced until components are added and published.</p></div>') +
        C.note('Usual counts and typical sizes are used only when nothing better is known. A typed size always wins, then sizes worked out from the photos. A typical size from a template is low confidence and stays provisional. Anything not set stays not set, never zero.', 'info') +
        (ed ? '<div class="rt-add"><label class="c-select"><span class="sr">Add a component</span><select id="rt-addsel"><option value="">Add a component…</option>' + Object.keys(C.WORK).map(function(f){
            var opts = Object.keys(C.CATALOG).filter(function(k){ return cat(k)[2] === f && !items.some(function(x){ return x.k === k; }); }); if(!opts.length) return '';
            return '<optgroup label="' + C.WORK[f] + ' (' + f + ')">' + opts.map(function(k){ var c = cat(k); return '<option value="' + k + '">' + (c[0] ? c[0] + ' · ' : '') + c[1] + (f === 'SY' ? ' (guidance only)' : '') + '</option>'; }).join('') + '</optgroup>'; }).join('') + '</select></label></div>' +
          (dirty ? C.saveBar('rt') : '')
          : canEdit ? '' : C.note('You can read templates. Editing them needs rulebook.edit, which Sam grants.', 'lock')) +
        '<section class="rt-hist" aria-labelledby="rt-hist-h"><h3 id="rt-hist-h">Versions</h3><p class="small muted">Nothing is overwritten. Every published change is a new version, and old runs keep the version they were made with.</p><ol>' +
          [{v:t.v, at:t.at, by:t.by, note:t.note, why:t.why, items:t.items, cur:true}].concat((t.hist || []).slice().reverse()).map(function(h){
            return '<li><span class="rt-v">v' + h.v + '</span><span class="rt-hb"><b>' + RI.esc(h.note || 'No note') + '</b><small>' + (h.cur ? 'In use · ' : '') + 'Published ' + C.date(h.at) + ' by ' + RI.esc(h.by || 'Sam') + (h.why ? ' · Why: ' + RI.esc(h.why) : '') + '</small></span>' + (h.cur ? C.lbl('published') : '<button type="button" class="linkbtn small" data-hv="' + h.v + '">View</button>') + '</li>';
          }).join('') + '</ol></section>';
      RI.fillIcons(el);
    }
    function showVersion(v){
      var t = all[cur], h = (t.hist || []).filter(function(x){ return x.v === v; })[0]; if(!h) return;
      var d = C.dialog(t.name + ', version ' + v, '<p class="small muted">Published ' + C.date(h.at) + ' by ' + RI.esc(h.by || 'Sam') + '. Read only: old versions are kept, never edited.</p>' +
        C.table({cls:'rt-tbl', cols:[{label:'Component'}, {label:'Usual count'}, {label:'Unit'}], rows:h.items.map(function(it){ var c = cat(it.k); return {cells:['<span class="rt-cmp"><b>' + c[1] + '</b>' + (c[0] ? '<small class="rt-id">' + c[0] + '</small>' : '') + '</span>', countText(it), c[3] || ''] }; })}) +
        '<div class="cta-row" style="justify-content:flex-end;margin-top:14px"><button type="button" class="btn btn-secondary" data-dlg-close>Close</button></div>', {wide:true});
      RI.fillIcons(d);
    }
    var split = function(){ return doc.getElementById('rt-split'); };
    var working = function(){ return edit || (edit = all[cur].items.map(function(x){ return Object.assign({}, x); })); };
    view.addEventListener('click', function(e){
      var li = e.target.closest('[data-k]');
      if(li){ if(edit){ RI.toast('Save or undo your changes first.', 'warn'); return; } cur = li.getAttribute('data-k'); editing = false; history.replaceState(null, '', '#/room-templates?room=' + cur); list(); detail(); split().classList.add('in'); if(innerWidth < 900) window.scrollTo(0, 0); else doc.getElementById('rt-detail').scrollIntoView({block:'nearest'}); return; }
      if(e.target.closest('#rt-back')){ if(edit){ RI.toast('Save or undo your changes first.', 'warn'); return; } split().classList.remove('in'); history.replaceState(null, '', '#/room-templates'); window.scrollTo(0, 0); return; }
      var hv = e.target.closest('[data-hv]'); if(hv){ showVersion(+hv.getAttribute('data-hv')); return; }
      var rm = e.target.closest('[data-rm]'); if(rm){ working().splice(+rm.getAttribute('data-rm'), 1); detail(); return; }
      if(e.target.closest('#rt-edit')){ editing = true; detail(); var f = doc.querySelector('#rt-detail .rt-in'); if(f) f.focus(); return; }
      if(e.target.closest('#rt-done')){ editing = false; detail(); return; }
      if(e.target.closest('#rt-undo')){ edit = null; editing = false; detail(); return; }
      if(e.target.closest('#rt-save')){
        var ch = diff(all[cur].items, edit), sum = ch.length ? ch.map(function(c){ return c[0] + ' ' + c[1].charAt(0).toLowerCase() + c[1].slice(1); }).join('; ') : 'No change';
        if(!ch.length){ edit = null; detail(); RI.toast('Nothing changed, so there is nothing to save.'); return; }
        C.askWhy('Room template: ' + all[cur].name, sum, function(why){
          C.addDraft({area:'templates', ref:cur, title:'Room template: ' + all[cur].name, summary:sum, after:{items:edit}, why:why});
          edit = null; editing = false; RI.toast('Saved as a draft. It waits in the publish queue.', 'check'); C.render();
        });
      }
    });
    view.addEventListener('change', function(e){
      if(e.target.id === 'rt-addsel' && e.target.value){ working().push({k:e.target.value, lo:null, hi:null}); detail(); return; }
      var lo = e.target.getAttribute('data-lo'), hi = e.target.getAttribute('data-hi');
      if(lo != null || hi != null){
        var it = working()[+(lo != null ? lo : hi)], v = e.target.value === '' ? null : Math.max(0, Math.round(+e.target.value));
        if(lo != null){ it.lo = v; if(v == null) it.hi = null; else if(it.hi == null || it.hi < v) it.hi = v; }
        else { it.hi = v == null ? it.lo : Math.max(v, it.lo == null ? v : it.lo); if(it.lo == null) it.lo = it.hi; }
        detail();
      }
    });
    view.querySelector('#rt-q').addEventListener('input', function(){ q = this.value; list(); });
    list(); detail();
  }, {nav:'templates', perm:'rulebook.view'});
})();

/* ---------- Rules and families, condition sheets, packages and catalog, accuracy (APP_FLOW 7; PDF sections 33, 39, 60 to 63) ---------- */
(function(){
  var RI = window.RI, A = RI.App, C = RI.Con, doc = document;
  var DAY = 86400000, now = Date.now();
  C.FAMILIES = [['F01','Property Context','Property type, age, layout, renovation history'],['F02','Evidence Authority','What is known, inferred, conflicting or unknown'],['F03','Photo Intelligence','Spaces, components, materials, visible condition'],['F04','Component State','Condition, modernisation, character, function'],['F05','Target and Packages','Essential, Standard and Premium outcomes'],['F06','Action Selection','Keep, repair, refinish, replace and the rest'],['F07','Quantity Intelligence','Quantities without false precision'],['F08','Scope Generation','Actions into construction tasks'],['F09','Dependencies','Triggers, shared work, sequencing'],['F10','Systems and Safety','Cosmetic work kept apart from system risk'],['F11','Reconciliation','Conflicts, omissions, over-renovation'],['F12','Governance and Learning','Corrections, reasons, approvals, versions']];
  C.CLASSES = {guardrail:['Guardrail','Must never be broken'], decision:['Decision','Selects an action'], heuristic:['Heuristic','A useful default, not an absolute'], workflow:['Workflow','Controls order or review']};

  C.SEEDS.push(function(){
    var R = function(code, fam, cls, text, plain, reason, ex, v, extra){ return Object.assign({code:code, fam:fam, cls:cls, text:text, plain:plain, reason:reason, ex:ex, v:v || 1, status:'published', at:now - (10 + v * 6) * DAY, tests:[('test_' + code.toLowerCase().replace(/-/g, '_') + '_' + plain.toLowerCase().replace(/[^a-z ]/g, '').split(' ').slice(0, 4).join('_'))]}, extra || {}); };
    C.set('rules', [
      R('CORE-01','F08','guardrail','Renovation scope must be determined before pricing','Decide the work before you price it','A price on undecided work is a guess','A kitchen floor is chosen as LVP before any rate is looked up',1),
      R('CORE-02','F02','guardrail','Evidence and existing state remain independent of package selection','What the house is never changes with the package','The house does not change when the goal does','Switching to Premium never makes a worn floor look better',1),
      R('CORE-03','F01','guardrail','Property age does not establish component age or preservation value','An old house can have new parts','Listing age and part age often differ','A 1941 bungalow with a 2015 kitchen keeps the kitchen',1),
      R('CORE-04','F02','guardrail','An unknown condition cannot be presented as an observed fact','Unknown is never a fact and never zero','The user must see what we could not confirm','A bath with no photo shows as unverified, never as $0',2),
      R('CORE-05','F06','decision','Choose interventions by target gap, component value and condition','Pick the action by goal, value and condition','The least invasive action that meets the goal','Sound hardwood under carpet is refinished, not replaced',2),
      R('CORE-06','F05','decision','Package tiers define outcomes, not predetermined amounts of work','A package is a goal, not a list','Two houses need different work for the same goal','Standard keeps sound oak cabinets in one house and replaces failed ones in another',1),
      R('CORE-07','F06','decision','Different components may need different actions in the same assembly','Parts in one room can differ','A room is not one decision','Keep the counter, refinish the cabinets, replace the faucet',1),
      R('CORE-08','F08','guardrail','Approved actions must generate complete construction scope','Every action gets its full task list','A missing task is a hidden cost','A new floor brings removal, prep, transitions and baseboard work',1),
      R('CORE-09','F09','workflow','Dependencies distinguish required, conditional and elective work','Every link has a type','Users can only turn off what is elective','The backsplash goes with a new countertop; it cannot stay on alone',1),
      R('CORE-10','F11','workflow','Shared work consolidated and incompatible work reconciled','Merge shared work, resolve clashes','One patch-and-paint, not three','Wall repair for new lights and for new trim is counted once',1),
      R('CORE-11','F10','guardrail','Major system condition stays separate from cosmetic renovation','Mechanicals get guidance, not evaluation','We do not judge furnaces from photos','The furnace gets a guidance card and a typical range, never a line in the total',1),
      R('CORE-12','F12','guardrail','Every recommendation explainable, traceable and correctable','Every decision can be traced and graded','Sam must see why and be able to correct it','Every line links to its photo, rule, rate and checks',1),
      R('TR-RULE-014','F06','decision','Whole-house flooring replaced, baseboards dated: replace baseboards','Replace dated baseboards with new floors','New floors expose tired trim','Unless the trim is quality and current',2,{when:'Whole-house flooring replaced; baseboards dated', then:'Replace baseboards (SW-TR-001)', unless:'Quality, current trim'}),
      R('CB-RULE-015','F06','decision','Preserve and refinish serviceable cabinetry','Refinish sound but dated cabinets','Refinishing reaches the Standard goal without replacing sound boxes','A 1990 oak kitchen in good condition is refinished under Standard',3,{when:'Physical condition good or serviceable; modernisation dated or strongly dated', then:'Refinish (SW-CB-002)', unless:'Structural or functional faults', tests:['test_cb_rule_015_refinishes_sound_dated_cabinets','test_cb_rule_015_replaces_on_structural_fault']}),
      R('BA-RULE-016','F06','decision','Sound bathtub with a tired surface: preserve by reglazing','Reglaze a sound tub','A sound tub does not need replacing','Unless cracks or damage: investigate',1,{when:'Sound bathtub, tired surface', then:'Reglaze (SW-BT-001)', unless:'Cracks or damage'}),
      R('BA-RULE-017','F06','decision','Suitable tub or shower surround: restore and recoat','Recoat a suitable surround','Keeps sound work in place','Unless the substrate is unsound',1),
      R('BA-RULE-018','F06','decision','Substantial bathroom update, older toilet: replace the toilet','Replace an older toilet in a bath update','Settles keep versus modernise for toilets','Unless the toilet is newer and visually compatible',2,{when:'Substantial bathroom update; older toilet', then:'Replace the toilet (SW-PL-001)', unless:'Newer, compatible toilet stays'}),
      R('EL-RULE-019','F06','decision','Modernised rooms with dated switches and outlets: replace devices and plates','Replace dated devices in modernised rooms','Old devices undo a new room','Unless compatible modern devices are there',1),
      R('AP-RULE-020','F06','decision','Outdated or mismatched appliances: selective replacement','Replace only the appliances that need it','Newer compatible ones stay','A 2019 refrigerator stays when the range is replaced',1),
      R('BS-RULE-021','F07','guardrail','Any basement: keep basement and above-grade areas separate','Basement area is never mixed in','Above-grade and basement are priced differently','Finished basement area is kept apart from the 1,686 sq ft above grade',1),
      R('BS-RULE-022','F10','guardrail','Signs of basement moisture: investigate before finish work','Check for water before finishing','Finishing over moisture fails','Unless the issue is verified as resolved',1),
      R('BS-RULE-023','F06','decision','Existing suspended ceiling: evaluate keeping it and alternatives','Never tear out a drop ceiling by default','It may hide services that must stay reachable','Never demolish automatically',1),
      R('EX-RULE-024','F06','decision','Serviceable exterior materials: retain, clean or repair','Keep sound exterior materials','Siding in good shape stays','Unless confirmed damage or a design reason',1),
      R('EX-RULE-025','F06','heuristic','Standard landscaping: clean up, trim, edge, mulch','Tidy the yard, do not replant','New planting is rarely needed','New planting only when justified',1,{vals:[{k:'Mulch depth', v:2, unit:'in'}]}),
      R('SY-RULE-026','F10','decision','Ageing, reportedly working system: retain pending inspection','Keep a working system and recommend inspection','An age heuristic must not replace a working furnace','A 20 year old furnace that works gets guidance, not a replacement line',1),
      R('DP-001','F09','guardrail','Every dependency points to a real action or task','No dangling links','A broken link hides cost','The back-test reports any link with no target',1),
      R('DP-010','F09','guardrail','A dependency cycle is rejected, logged and shown in the back-test report','Cycles are refused','The engine must always finish','Re-evaluation stops when nothing changes',1,{vals:[{k:'Re-evaluations per component', v:3, unit:'times'}]}),
      R('QT-RULE-048','F07','guardrail','Every quantity belongs to one component and one scope action','One quantity, one owner','Stops double counting','Wall area for paint is not also counted for drywall',1),
      R('QT-PT-001','F07','heuristic','Walls from perimeter times height, or documented surface geometry','Measure walls by perimeter and height','A clear, repeatable way to measure paint','Standard doors and windows are not deducted from labour',2,{vals:[{k:'Default wall height', v:8, unit:'ft'},{k:'Large opening deducted from', v:24, unit:'sq ft'}]})
    ]);
    var S = {}; ['CB','CT','TL','PL','BT','FL','EL','TR','DR','EX','RF','AP','PT'].forEach(function(f){ S[f] = {threshold:{CB:70, CT:70, TL:70, PL:75, BT:75, FL:65, EL:65, TR:60, DR:65, EX:70, RF:80, AP:70, PT:60}[f], v:2, at:now - 14 * DAY}; });
    C.set('sheets', S);
  });
  C.ruleText = function(code){ var r = C.get('rules', []).filter(function(x){ return x.code === code; })[0]; return r ? r.plain : ''; };
  C.APPLY.rules = function(d){ var rs = C.get('rules', []); rs.forEach(function(r){ if(r.code === d.ref){ r.vals = d.after; r.v++; r.at = Date.now(); } }); C.set('rules', rs); };
  C.APPLY.sheets = function(d){ var s = C.get('sheets', {}); if(s[d.ref]){ s[d.ref].threshold = d.after.threshold; s[d.ref].v++; s[d.ref].at = Date.now(); C.set('sheets', s); } };
  C.BEFORE.rules = function(d){ var r = C.get('rules', []).filter(function(x){ return x.code === d.ref; })[0]; return r ? {v:r.v, before:C.copy(r.vals || [])} : null; };
  C.BEFORE.sheets = function(d){ var s = (C.get('sheets', {}) || {})[d.ref]; return s ? {v:s.v, before:{threshold:s.threshold}} : null; };

  /* Lines across every run that use a rule, or fall in a family */
  function allLines(){ var out = []; A.all().forEach(function(h){ var m = C.model(h); if(m) m.lines.forEach(function(l){ l.h = h; out.push(l); }); }); return out; }

  /* ---------- Rules and families (APP_FLOW 7, BACKLOG M2-23 and M4-26, SCHEMA rule_families and rules) ----------
     The admin's four questions first: how much of the rulebook is loaded, what must never break, what can be tuned,
     what is waiting to publish. Then the twelve families beside the rules. Each rule reads as a sentence
     (when, then, unless), shows its values, how often it is used, its tests and its published version. */
  var RG_ICON = {guardrail:'shield', decision:'tool', heuristic:'ruler', workflow:'list'};
  C.route('/rules', function(view){
    var rules = C.get('rules', []), q0 = C.query(), st = {fam:q0.fam || 'all', cls:'all', q:'', only:q0.only || 'all', sort:'code'};
    var FAM = {}; C.FAMILIES.forEach(function(f){ FAM[f[0]] = f; });
    var lines = allLines(), USED = {}; lines.forEach(function(l){ if(l.rule) USED[l.rule] = (USED[l.rule] || 0) + 1; });
    var used = function(r){ return USED[r.code] || 0; };
    var queued = function(r){ return !!C.draftFor('rules', r.code); };
    var tunable = function(r){ return (r.vals || []).length > 0; };
    var match = function(r, fam, cls, only){ var v = st.q.toLowerCase();
      return (fam === 'all' || r.fam === fam) && (cls === 'all' || r.cls === cls) && (only === 'all' || (only === 'tunable' ? tunable(r) : only === 'queued' ? queued(r) : r.cls === only)) &&
        (!v || (r.code + ' ' + r.text + ' ' + r.plain + ' ' + (r.when || '') + ' ' + (r.then || '')).toLowerCase().indexOf(v) > -1); };
    var count = function(fam, cls, only){ return rules.filter(function(r){ return match(r, fam, cls, only == null ? st.only : only); }).length; };
    var TOTAL = 221, nG = rules.filter(function(r){ return r.cls === 'guardrail'; }).length, nT = rules.filter(tunable).length, nQ = rules.filter(queued).length;

    view.innerHTML = C.page({kicker:'Rulebook', title:'Rules and families', sub:'Every rule the engine follows, in twelve families. Each has a reason, a worked example, a version and the tests that prove it. A rule without a test cannot be published.',
      body:'<div class="rk-band" id="rk-band"></div>' +
        '<div class="rf-layout"><aside class="rf-side" aria-label="Rule families"><p class="rf-side-h">Families</p><div class="rf-fams" id="rf-fams" role="radiogroup" aria-label="Family"></div></aside>' +
        '<section class="rf-main" aria-live="polite"><div class="rf-head" id="rf-head"></div>' +
          '<div class="rg-tools">' + C.search('rf-q', 'Search by code or words', '') +
            '<label class="c-select rg-sort"><span class="sr">Sort</span><select id="rg-sort"><option value="code">Sort by code</option><option value="used">Most used first</option><option value="recent">Recently changed</option></select></label></div>' +
          '<div class="rf-cls" id="rf-cls" role="radiogroup" aria-label="Class"></div><div id="rg-active"></div>' +
          '<div id="rf-list"></div></section></div>' +
        '<p class="rk-foot">' + C.lbl('sample') + '<span>A sample of ' + rules.length + ' rules from the developer guide: the core rules, the approved component rules, and the dependency and quantity rules. The rest load from Sam\'s grouped list.</span></p>'});

    function band(){
      var pct = Math.round(rules.length / TOTAL * 100);
      var card = function(o){ return '<button type="button" class="rk-card' + (o.cls ? ' ' + o.cls : '') + (o.on ? ' on' : '') + '"' + (o.only ? ' data-only="' + o.only + '" aria-pressed="' + !!o.on + '"' : ' disabled') + '>' +
        '<span class="rk-h"><span class="rk-ic">' + RI.icon(o.icon, 'i-sm') + '</span>' + o.label + '</span><span class="rk-v"><b>' + o.value + '</b>' + (o.of ? '<small>of ' + o.of + '</small>' : '') + '</span>' + (o.bar != null ? '<span class="rk-bar" aria-hidden="true"><i style="width:' + o.bar + '%"></i></span>' : '') + '<span class="rk-f">' + o.foot + '</span></button>'; };
      doc.getElementById('rk-band').innerHTML =
        card({icon:'file', label:'Rulebook loaded', value:rules.length, of:TOTAL, bar:pct, foot:pct + '% loaded. ' + (TOTAL - rules.length) + ' more to come'}) +
        card({icon:'shield', label:'Guardrails', value:nG, foot:'Must never be broken', only:'guardrail', on:st.only === 'guardrail'}) +
        card({icon:'sliders', label:'Values to tune', value:nT, foot:'Rules with values Sam can change as a draft', only:'tunable', on:st.only === 'tunable'}) +
        card({icon:'clock', label:'Waiting to publish', value:nQ, foot:nQ ? 'Rule drafts in the publish queue' : 'No rule draft is waiting', only:'queued', on:st.only === 'queued', cls:nQ ? 'dark' : ''});
    }
    function wtu(r){
      if(!r.when) return '';
      return '<span class="rg-wtu"><span><em>When</em>' + RI.esc(r.when) + '</span><span><em>Then</em>' + RI.esc(r.then) + '</span>' + (r.unless ? '<span><em>Unless</em>' + RI.esc(r.unless) + '</span>' : '') + '</span>';
    }
    function row(r){
      var t = (r.tests || []).length, u = used(r), dr = C.draftFor('rules', r.code), f = FAM[r.fam];
      return '<li><a class="rg-row' + (r.cls === 'guardrail' ? ' is-guard' : '') + '" href="#/rules/' + r.code + '">' +
        '<span class="rg-ic" title="' + C.CLASSES[r.cls][0] + ': ' + C.CLASSES[r.cls][1] + '">' + RI.icon(RG_ICON[r.cls], 'i-sm') + '</span>' +
        '<span class="rg-body"><span class="rg-top"><code>' + r.code + '</code><span class="rg-cls">' + C.CLASSES[r.cls][0] + '</span>' + (st.fam === 'all' ? '' : '') + '</span>' +
          '<b class="rg-t">' + RI.esc(r.text) + '</b><span class="rg-p">' + RI.esc(r.plain) + '</span>' + wtu(r) +
          (tunable(r) ? '<span class="rg-vals">' + r.vals.map(function(x){ return '<span>' + RI.icon('sliders', 'i-sm') + RI.esc(x.k) + ' <b>' + x.v + ' ' + RI.esc(x.unit) + '</b></span>'; }).join('') + '</span>' : '') + '</span>' +
        '<span class="rg-meta">' +
          '<span class="rg-st"><span class="lb lb-pub">Published <span class="lb-v">v' + r.v + '</span></span>' + (dr ? '<span class="rlb-qline">' + RI.icon('clock', 'i-sm') + 'v' + (r.v + 1) + ' in the queue</span>' : '') + '</span>' +
          '<span class="rg-m">' + RI.icon(t ? 'check' : 'warn', 'i-sm') + t + (t === 1 ? ' test' : ' tests') + '</span>' +
          '<span class="rg-m' + (u ? ' used' : '') + '">' + RI.icon('house', 'i-sm') + (u ? 'Used on ' + u + (u === 1 ? ' line' : ' lines') : 'Not used yet') + '</span>' +
          '<span class="rg-m">' + RI.icon('clock', 'i-sm') + 'Changed ' + C.ago(r.at) + '</span>' +
        '</span><span class="rg-go">' + RI.icon('chev', 'i-sm') + '</span></a></li>';
    }
    function sorted(list){
      var by = {code:function(a, b){ return a.code < b.code ? -1 : 1; }, used:function(a, b){ return used(b) - used(a) || (a.code < b.code ? -1 : 1); }, recent:function(a, b){ return b.at - a.at; }}[st.sort];
      return list.slice().sort(by);
    }
    function draw(){
      band();
      doc.getElementById('rf-fams').innerHTML = [['all', 'All families', 'Every family']].concat(C.FAMILIES).map(function(f){
        var n = count(f[0], st.cls), total = rules.filter(function(r){ return f[0] === 'all' || r.fam === f[0]; }).length, on = st.fam === f[0];
        return '<button type="button" role="radio" aria-checked="' + on + '" data-fam="' + f[0] + '"' + (total ? '' : ' class="rf-none"') + ' title="' + RI.esc(f[2]) + '">' +
          (f[0] === 'all' ? '<span class="rf-fcode">' + RI.icon('list', 'i-sm') + '</span>' : '<span class="rf-fcode"><code>' + f[0] + '</code></span>') +
          '<span class="rf-fname">' + RI.esc(f[1]) + (total ? '' : '<small>Loads with the full list</small>') + '</span><span class="rf-fn">' + n + '</span></button>';
      }).join('');
      var f = FAM[st.fam], famRules = rules.filter(function(r){ return st.fam === 'all' || r.fam === st.fam; });
      var mix = Object.keys(C.CLASSES).map(function(k){ var n = famRules.filter(function(r){ return r.cls === k; }).length; return n ? '<span>' + RI.icon(RG_ICON[k], 'i-sm') + n + ' ' + C.CLASSES[k][0].toLowerCase() + (n === 1 ? '' : 's') + '</span>' : ''; }).join('');
      doc.getElementById('rf-head').innerHTML = (f ? '<p class="rf-hcode"><code>' + f[0] + '</code> Family</p><h2>' + RI.esc(f[1]) + '</h2><p>' + RI.esc(f[2]) + '</p>' :
        '<p class="rf-hcode">Rule registry</p><h2>All families</h2><p>Twelve families, from what the house is to how the rulebook learns.</p>') + (mix ? '<p class="rg-mix">' + mix + '</p>' : '');
      doc.getElementById('rf-cls').innerHTML = [['all', 'All classes', 'Every class']].concat(Object.keys(C.CLASSES).map(function(k){ return [k, C.CLASSES[k][0], C.CLASSES[k][1]]; })).map(function(c){
        return '<button type="button" role="radio" aria-checked="' + (st.cls === c[0]) + '" data-cls="' + c[0] + '" title="' + c[2] + '">' + (c[0] === 'all' ? '' : RI.icon(RG_ICON[c[0]], 'i-sm')) + c[1] + '<span class="n">' + count(st.fam, c[0]) + '</span></button>';
      }).join('');
      var ONLY = {guardrail:'Guardrails only', tunable:'Rules with values to tune', queued:'Waiting to publish'};
      doc.getElementById('rg-active').innerHTML = st.only !== 'all' ? '<p class="rg-active">Showing: <b>' + ONLY[st.only] + '</b><button type="button" class="us-ghost" data-only="all">' + RI.icon('x', 'i-sm') + 'Clear</button></p>' : '';
      var list = sorted(rules.filter(function(r){ return match(r, st.fam, st.cls, st.only); })), html;
      if(!list.length){
        var total = famRules.length;
        html = '<div class="c-empty">' + RI.icon(total ? 'search' : 'info') + '<p>' + (total ? 'No rule matches. Try other words, another class, or clear the filter.' : 'No rule from this family is in the sample yet. Its rules load with Sam\'s grouped list of 221.') + '</p>' +
          (total ? '' : '<button type="button" class="btn btn-secondary btn-sm" data-fam="all">Show all families</button>') + '</div>';
      } else if(st.fam === 'all' && st.sort === 'code'){
        html = C.FAMILIES.map(function(fm){ var g = list.filter(function(r){ return r.fam === fm[0]; }); if(!g.length) return '';
          return '<section class="rf-grp"><h3><button type="button" data-fam="' + fm[0] + '"><code>' + fm[0] + '</code>' + RI.esc(fm[1]) + '</button><span>' + g.length + (g.length === 1 ? ' rule' : ' rules') + '</span></h3><ul class="rg-rows">' + g.map(row).join('') + '</ul></section>'; }).join('');
      } else html = '<ul class="rg-rows">' + list.map(row).join('') + '</ul>';
      doc.getElementById('rf-list').innerHTML = html;
      RI.fillIcons(view);
    }
    function pickFam(fam){ st.fam = fam; history.replaceState(null, '', '#/rules' + (fam === 'all' ? '' : '?fam=' + fam)); draw();
      var b = view.querySelector('#rf-fams [aria-checked="true"]'); if(b && b.scrollIntoView) b.scrollIntoView({block:'nearest', inline:'nearest'}); }
    view.addEventListener('click', function(e){
      var ob = e.target.closest('[data-only]'); if(ob){ var o = ob.getAttribute('data-only'); st.only = st.only === o ? 'all' : o; if(o === 'guardrail' && st.only === 'guardrail') st.cls = 'all'; draw(); return; }
      var fb = e.target.closest('[data-fam]'); if(fb){ pickFam(fb.getAttribute('data-fam')); return; }
      var cb = e.target.closest('[data-cls]'); if(cb){ st.cls = cb.getAttribute('data-cls'); if(st.only === 'guardrail') st.only = 'all'; draw(); }
    });
    view.querySelector('#rf-fams').addEventListener('keydown', function(e){
      if(['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].indexOf(e.key) < 0) return; e.preventDefault();
      var bs = [].slice.call(this.querySelectorAll('[data-fam]')), i = bs.indexOf(doc.activeElement), d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
      var nb = bs[(i + d + bs.length) % bs.length]; pickFam(nb.getAttribute('data-fam')); this.querySelector('[data-fam="' + nb.getAttribute('data-fam') + '"]').focus();
    });
    view.querySelector('#rf-q').addEventListener('input', function(){ st.q = this.value.trim(); draw(); });
    view.querySelector('#rg-sort').addEventListener('change', function(){ st.sort = this.value; draw(); });
    draw();
  }, {nav:'rules', perm:'rulebook.view'});

  C.route('/rules/:code', function(view, p){
    var r = C.get('rules', []).filter(function(x){ return x.code === p.code; })[0];
    if(!r){ view.innerHTML = C.page({title:'That rule is not in the sample registry', back:['#/rules','Rules and families']}); return; }
    var fam = C.FAMILIES.filter(function(f){ return f[0] === r.fam; })[0], used = allLines().filter(function(l){ return l.rule === r.code; }), edit = null, canEdit = C.can('rulebook.edit');
    view.innerHTML = C.page({back:['#/rules','Rules and families'], kicker:'<code>' + r.code + '</code> · ' + fam[0] + ' ' + fam[1], title:RI.esc(r.text), sub:'In plain words: ' + RI.esc(r.plain) + '.',
      actions:'<span class="cls cls-' + r.cls + '">' + C.CLASSES[r.cls][0] + '</span>' + C.lbl('published', 'v' + r.v),
      body:C.draftBar('rules', r.code) + '<div class="ru-grid">' +
        '<section class="c-card"><header><h2>Why it exists</h2></header><p>' + RI.esc(r.reason) + '.</p><h3 class="ru-h3">Worked example</h3><p>' + RI.esc(r.ex) + '.</p>' +
          (r.when ? '<dl class="ru-wtu"><div><dt>When</dt><dd>' + RI.esc(r.when) + '</dd></div><div><dt>Then</dt><dd>' + RI.esc(r.then) + '</dd></div><div><dt>Unless</dt><dd>' + RI.esc(r.unless) + '</dd></div></dl>' : '') + '</section>' +
        '<section class="c-card" id="ru-vals"></section>' +
        '<section class="c-card"><header><h2>Tests that prove it</h2><span class="rel rel-ok">' + r.tests.length + ' passing</span></header><ul class="ru-tests">' + r.tests.map(function(t){ return '<li>' + RI.icon('check','i-sm') + '<code>' + t + '</code></li>'; }).join('') + '</ul>' + C.note('A rule without a test cannot be published.') + '</section>' +
        '<section class="c-card"><header><h2>Versions</h2></header><ol class="ru-v">' + Array.from({length:r.v}, function(_, i){ var v = r.v - i; return '<li><b>v' + v + '</b>' + (i === 0 ? C.lbl('published') : C.lbl('replaced')) + '<span class="muted">' + C.date(r.at - i * 9 * DAY) + '</span></li>'; }).join('') + '</ol>' + C.note('Old runs keep the version they were made with.') + '</section>' +
        '<section class="c-card ru-used"><header><h2>Where it applies now</h2>' + C.chip(used.length + ' line' + (used.length === 1 ? '' : 's')) + '</header>' + (used.length ? '<ul class="ru-uses">' + used.slice(0, 8).map(function(l){ return '<li><a href="#/houses/' + l.h.id + '/tree?line=' + encodeURIComponent(l.id) + '">' + RI.esc(l.item.name) + '</a><span class="muted">' + RI.esc(A.addr(l.h)) + '</span></li>'; }).join('') + '</ul>' : '<p class="small muted">No line in the current runs uses this rule.</p>') + '</section></div>'});
    function vals(){
      var el = doc.getElementById('ru-vals'), vs = edit || r.vals || [];
      el.innerHTML = '<header><h2>Values Sam may tune</h2>' + (edit ? C.lbl('draft', 'not saved') : '') + '</header>' + (vs.length ? '<div class="ru-vals">' + vs.map(function(x, i){ return '<label class="ru-val"><span>' + RI.esc(x.k) + '</span><span class="ru-in"><input class="input" type="number" step="1" data-vi="' + i + '" value="' + x.v + '"' + (canEdit ? '' : ' disabled') + '><em>' + x.unit + '</em></span></label>'; }).join('') + '</div>' + C.note('Sample values. Changing a value needs no developer; a new kind of rule does.') : '<p class="small muted">This rule has no tunable values. Its wording and logic change only through a developer.</p>') + (edit ? C.saveBar('ru') : '');
      RI.fillIcons(el);
    }
    view.addEventListener('input', function(e){ var i = e.target.getAttribute('data-vi'); if(i == null) return; edit = (edit || r.vals).map(function(x){ return Object.assign({}, x); }); edit[+i].v = +e.target.value; if(!doc.querySelector('#ru-vals .c-savebar')){ vals(); var inp = doc.querySelector('[data-vi="' + i + '"]'); inp.focus(); inp.setSelectionRange && null; } });
    view.addEventListener('click', function(e){
      if(e.target.closest('#ru-undo')){ edit = null; vals(); }
      if(e.target.closest('#ru-save')){ var sum = edit.map(function(x, i){ return x.k + ' ' + r.vals[i].v + ' to ' + x.v + ' ' + x.unit; }).filter(function(s, i){ return edit[i].v !== r.vals[i].v; }).join('; ');
        C.askWhy(r.code + ' values', sum, function(why){ C.addDraft({area:'rules', ref:r.code, title:'Rule ' + r.code + ': values', summary:sum, after:edit, why:why}); RI.toast('Saved as a draft. It waits in the publish queue.', 'check'); C.render(); }); }
    });
    vals(); C.crumb(r.code);
  }, {nav:'rules', perm:'rulebook.view'});

  /* ---------- Condition sheets (APP_FLOW 7; BACKLOG M2-09, M2-23, M4-27; SCHEMA condition_sheets) ----------
     Master and detail. Left: each component type with its live threshold on a small meter, its line count and
     how many of those lines are unverified. Right: what is live and what waits in the queue; the threshold as a
     scale from 40 to 95 with every line of the current runs placed on it, so the effect of a change shows before
     it is saved; those lines, lowest confidence first; the condition levels and the four scales, each with how
     this component read in the current runs. cd- prefix (cs- belongs to the console shell). */
  var SEVS = [['C0','No visible defect','Keep, unless the goal asks for change'],['C1','Minor cosmetic wear','Clean, repair or refinish'],['C2','Moderate deterioration','Repair or refinish; replace if the goal needs it'],['C3','Significant deterioration','Replace or repair, by the rules'],['C4','Apparent urgent safety concern','Flag for a professional; no precise replacement'],['CX','Not enough evidence','Verify. Shown as unverified']];
  var SCALES = [['condition','Physical condition',['Excellent','Good','Serviceable','Worn','Poor','Failed']],['modern','Modernisation',['Current','Acceptable','Dated','Strongly dated','Obsolete']],['character','Character value',['High','Moderate','Low','None']],['func','Functional adequacy',['Good','Adequate','Limited','Deficient']]];
  var CD_LO = 40, CD_HI = 95, cdPos = function(v){ return ((Math.max(CD_LO, Math.min(CD_HI, v)) - CD_LO) / (CD_HI - CD_LO) * 100).toFixed(2) + '%'; };
  C.route('/condition-sheets', function(view){
    var sheets = C.get('sheets', {}), fams = Object.keys(sheets), cur = C.query().fam, all = allLines(), val = null, more = false, canEdit = C.can('rulebook.edit');
    if(!sheets[cur]) cur = sheets.CB ? 'CB' : fams[0];
    var name = function(f){ return C.FAMILY[f] || f; };
    var of = function(f){ return all.filter(function(l){ return l.fam === f && l.item.state !== 'measure'; }).sort(function(a, b){ return a.conf - b.conf; }); };
    var plural = function(n, w){ return n + ' ' + w + (n === 1 ? '' : 's'); };
    view.innerHTML = C.page({kicker:'Rulebook', title:'Condition sheets', sub:'Each component type has its condition levels and a confidence threshold. A photo reading below the threshold shows as unverified instead of being priced.',
      body:fams.length ? '<div class="c-split cd-split"><nav class="c-list cd-list" aria-label="Component types" id="cd-list"></nav><section class="c-detail cd-detail" id="cd-detail" aria-live="off"></section></div>' : '<div class="c-empty">' + RI.icon('info') + '<p>No condition sheet yet. Sheets arrive with Sam\'s rulebook import.</p></div>'});
    if(!fams.length) return;

    function list(){
      var box = doc.getElementById('cd-list');
      box.innerHTML = '<p class="c-list-g">Component types<span>' + fams.length + '</span></p>' + fams.map(function(f){
        var s = sheets[f], dr = C.draftFor('sheets', f), fl = of(f), un = fl.filter(function(l){ return l.conf < s.threshold; }).length;
        return '<button type="button" class="cd-li' + (f === cur ? ' on' : '') + '" data-f="' + f + '"' + (f === cur ? ' aria-current="true"' : '') + '>' +
          '<span class="cd-li-t"><b>' + name(f) + '</b><span class="cd-li-v">' + s.threshold + (dr ? '<i title="Queued">' + RI.icon('arrow', 'i-sm') + dr.after.threshold + '</i>' : '') + '</span></span>' +
          '<span class="cd-li-m" aria-hidden="true"><i style="width:' + cdPos(s.threshold) + '"></i>' + (dr ? '<s style="left:' + cdPos(dr.after.threshold) + '"></s>' : '') + '</span>' +
          '<small><code>' + f + '</code> · ' + (fl.length ? plural(fl.length, 'line') + (un ? ', <em>' + un + ' unverified</em>' : '') : 'no lines yet') + (dr ? ' · queued' : '') + '</small></button>'; }).join('');
      var on = box.querySelector('.on'); if(on && box.scrollWidth > box.clientWidth) box.scrollLeft = on.offsetLeft - 8;
    }

    /* Lines by confidence: one bar per 5 points from 40 to 95 (90 and up is the last). The share of a bar's lines
       below the threshold is bronze (shown as unverified), the rest Deep Forest (clear to price). */
    var BINS = [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90];
    var binOf = function(c){ return Math.min(10, Math.max(0, Math.floor((c - CD_LO) / 5))); };
    function bars(fl, t){
      var n = BINS.map(function(){ return 0; }); fl.forEach(function(l){ n[binOf(l.conf)]++; });
      var mx = Math.max.apply(null, n.concat([1])), w = (5 / (CD_HI - CD_LO) * 100).toFixed(3);
      return BINS.map(function(b, i){ if(!n[i]) return '';
        var u = fl.filter(function(l){ return binOf(l.conf) === i && l.conf < t; }).length;
        var tip = 'Confidence ' + (i === 10 ? '90 and up' : b + ' to ' + (b + 4)) + ': ' + plural(n[i], 'line') + (u ? ', ' + u + ' unverified' : ', all clear');
        return '<div class="cd-bar2" style="left:' + cdPos(b) + ';width:' + w + '%;height:' + (n[i] / mx * 100).toFixed(2) + '%" title="' + RI.esc(tip) + '">' +
          (u ? '<i class="b" style="flex-grow:' + u + '"></i>' : '') + (n[i] - u ? '<i class="g" style="flex-grow:' + (n[i] - u) + '"></i>' : '') + '</div>'; }).join('');
    }

    function detail(){
      var s = sheets[cur], dr = C.draftFor('sheets', cur), fl = of(cur), el = doc.getElementById('cd-detail');
      el.innerHTML =
        '<header class="cd-head"><div><p class="c-kicker"><code>' + cur + '</code> · Condition sheet</p><h2>' + name(cur) + '</h2></div><span id="cd-state"></span></header>' +
        '<div class="cd-vers">' +
          '<div><span class="cd-vk">Live threshold</span><b>' + s.threshold + '</b><small>Version ' + s.v + ', published ' + C.ago(s.at) + '</small></div>' +
          (dr ? '<span class="cd-vto" aria-hidden="true">' + RI.icon('arrow') + '</span><div class="cd-vq"><span class="cd-vk">In the publish queue</span><b>' + dr.after.threshold + '</b><small>Version ' + (s.v + 1) + ', by ' + RI.esc(dr.by) + ', ' + C.ago(dr.at) + '</small></div>' +
            '<div class="cd-vfoot">' + (dr.why ? '<p class="cd-why">' + RI.icon('info', 'i-sm') + '<span><b>Why:</b> ' + RI.esc(dr.why) + '</span></p>' : '<span></span>') + '<a class="btn btn-secondary btn-sm cd-vbtn" href="#/publish">Open the queue</a></div>'
            : '<p class="cd-vnone">Nothing waiting. A change you save becomes a draft for Sam to publish.</p>') +
        '</div>' +
        '<section class="cd-card" aria-labelledby="cd-thr-h">' +
          '<div class="cd-thr-top"><div><h3 class="cd-h" id="cd-thr-h">Confidence threshold</h3><p class="cd-p">' + 'A photo reading below this number shows as unverified instead of being priced. ' + (canEdit ? 'Drag the handle, use the buttons or click the chart to try a value.' : 'You can read this sheet but not change it.') + '</p></div>' +
            '<div class="cd-step">' + (canEdit ? '<button type="button" class="cd-sb" data-step="-1" aria-label="Lower the threshold by one">' + RI.icon('minus') + '</button>' : '') + '<output id="cd-num" for="cd-r">' + s.threshold + '</output>' + (canEdit ? '<button type="button" class="cd-sb" data-step="1" aria-label="Raise the threshold by one">' + RI.icon('plus') + '</button>' : '') + '</div></div>' +
          '<div class="cd-meter" id="cd-meter"></div>' +
          '<div class="cd-what"><div class="cd-what-h"><b>Lines by confidence</b><span class="cd-key"><span><i class="cd-sw u"></i>Unverified</span><span><i class="cd-sw o"></i>Clear to price</span></span></div>' +
          '<div class="cd-chart">' +
            '<div class="cd-plot' + (canEdit ? ' edit' : '') + '" id="cd-plot">' + [25, 50, 75, 100].map(function(v){ return '<i class="cd-gl" style="bottom:' + v + '%"></i>'; }).join('') +
              '<div id="cd-bars"></div>' +
              '<div class="cd-guide p" id="cd-gp" style="left:' + cdPos(s.threshold) + '"><em>Live ' + s.threshold + '</em></div>' +
              '<div class="cd-thl" id="cd-thl"><em id="cd-thl-t"></em></div>' +
            '</div>' +
            '<div class="cd-axis" aria-hidden="true">' + [40, 50, 60, 70, 80, 90].map(function(v){ return '<span style="left:' + cdPos(v) + '">' + v + '</span>'; }).join('') + '</div>' +
          '</div>' +
          '<div class="cd-sl"><label for="cd-r">Threshold: <b id="cd-sl-v">' + s.threshold + '</b></label>' +
            '<div class="cd-slw"><span class="cd-sl-tr"><i id="cd-fill"></i></span><input type="range" id="cd-r" class="cd-range" min="' + CD_LO + '" max="' + CD_HI + '" step="1" value="' + s.threshold + '"' + (canEdit ? '' : ' disabled') + ' aria-describedby="cd-sum"></div></div>' +
          '</div>' +
          '<p class="cd-sum" id="cd-sum" aria-live="polite"></p>' +
        '</section>' +
        '<section class="cd-card" aria-labelledby="cd-ln-h"><div class="cd-card-h"><div><h3 class="cd-h" id="cd-ln-h">Lines in the current runs</h3><p class="cd-p">Lowest confidence first. These are the lines a higher threshold turns unverified. Open one to see its photos.</p></div></div><div id="cd-lines"></div></section>' +
        '<section class="cd-card" aria-labelledby="cd-lv-h"><div class="cd-card-h"><div><h3 class="cd-h" id="cd-lv-h">Condition levels</h3><p class="cd-p">What a photo reading is matched to, and what the engine does at each level.</p></div><span class="cd-colh">In current runs</span></div>' +
          '<ol class="cd-lv">' + SEVS.map(function(x){ var n = fl.filter(function(l){ return l.sev === x[0]; }).length;
            return '<li><span class="sev sev-' + x[0] + '">' + x[0] + '</span><span class="cd-lv-t"><b>' + x[1] + '</b><small>' + RI.icon('arrow', 'i-sm') + x[2] + '</small></span><span class="cd-lv-n' + (n ? '' : ' zero') + '"><span class="cd-bar"><i style="width:' + (fl.length ? (n / fl.length * 100).toFixed(1) : 0) + '%"></i></span><b>' + n + '</b></span></li>'; }).join('') + '</ol></section>' +
        '<section class="cd-card" aria-labelledby="cd-sc-h"><div class="cd-card-h"><div><h3 class="cd-h" id="cd-sc-h">Four separate scales</h3><p class="cd-p">Never one score: a 1990 oak kitchen can be condition 8 and modernisation 3.' + (fl.length ? ' The numbers show how the ' + plural(fl.length, 'line') + ' read.' : '') + '</p></div></div>' +
          '<div class="cd-scales">' + SCALES.map(function(sc){
            return '<div class="cd-sc"><b>' + sc[1] + '</b><ol>' + sc[2].concat(['Unknown']).map(function(v){ var n = fl.filter(function(l){ return l.scales[sc[0]] === v; }).length;
              return '<li class="' + (v === 'Unknown' ? 'unk' : '') + (n ? ' has' : '') + '"><span>' + v + '</span>' + (n ? '<em>' + n + '</em>' : '') + '</li>'; }).join('') + '</ol></div>'; }).join('') + '</div></section>' +
        '<div id="cd-savewrap"></div>' + (canEdit ? '' : C.note('Changing a threshold needs the permission to edit reasoning drafts.', 'lock'));
      update();
    }

    function rows(t, live){
      var fl = of(cur);
      if(!fl.length) return '<div class="c-empty">' + RI.icon('info') + '<p>No ' + name(cur).toLowerCase() + ' line in the current runs yet. The threshold applies from the next run.</p></div>';
      var cut = fl.length > 8, show = more || !cut ? fl : fl.slice(0, 6);
      return '<div class="cd-tblw"><table class="cd-tbl"><thead><tr><th scope="col">Line</th><th scope="col">Confidence</th><th scope="col">Result</th></tr></thead><tbody>' + show.map(function(l){
        var un = l.conf < t, was = l.conf < live, flip = un !== was;
        return '<tr class="' + (un ? 'un' : '') + (flip ? ' flip' : '') + '"><td><a href="#/houses/' + l.h.id + '"><b>' + RI.esc(l.item.name) + '</b><small>' + RI.esc(l.room) + ' · ' + RI.esc(A.addr(l.h)) + '</small></a></td>' +
          '<td class="cd-cf"><span class="cd-cfw"><span class="cd-bar"><i style="width:' + cdPos(l.conf) + '"></i><s style="left:' + cdPos(t) + '"></s></span><b>' + l.conf + '</b></span></td>' +
          '<td>' + (un ? '<span class="cd-res cd-un">Unverified</span>' : '<span class="cd-res cd-ok">' + RI.icon('check', 'i-sm') + 'Clear</span>') + (flip ? '<small class="cd-was">was ' + (was ? 'unverified' : 'clear') + '</small>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        (cut ? '<button type="button" class="cd-more" id="cd-more" aria-expanded="' + more + '">' + (more ? 'Show fewer' : 'Show all ' + fl.length + ' lines') + RI.icon('chev', 'i-sm') + '</button>' : '');
    }

    function update(){
      var s = sheets[cur], t = val == null ? s.threshold : val, dirty = t !== s.threshold, fl = of(cur);
      var un = fl.filter(function(l){ return l.conf < t; }).length, was = fl.filter(function(l){ return l.conf < s.threshold; }).length, delta = un - was;
      doc.getElementById('cd-num').textContent = t;
      var r = doc.getElementById('cd-r'); if(+r.value !== t) r.value = t;
      doc.getElementById('cd-bars').innerHTML = bars(fl, t);
      var th = doc.getElementById('cd-thl'), gp = doc.getElementById('cd-gp'); th.style.left = cdPos(t); doc.getElementById('cd-thl-t').textContent = 'Threshold ' + t;
      th.className = 'cd-thl' + ((dirty ? t < s.threshold : t > 80) ? ' l' : ''); gp.className = 'cd-guide p' + (dirty ? ' on' : '') + (t < s.threshold ? ' r' : '');
      doc.getElementById('cd-sl-v').textContent = t; doc.getElementById('cd-fill').style.width = 'calc(' + ((t - CD_LO) / (CD_HI - CD_LO)).toFixed(4) + ' * (100% - 18px) + 9px)';
      var ok = fl.length - un;
      doc.getElementById('cd-meter').innerHTML = !fl.length ? '' : '<div class="cd-mbar" aria-hidden="true">' + (ok ? '<i class="o" style="flex-grow:' + ok + '"></i>' : '') + (un ? '<i class="u" style="flex-grow:' + un + '"></i>' : '') + '</div>' +
        '<div class="cd-mleg"><span><i class="cd-sw o"></i><b>' + ok + '</b> clear to price</span><span><i class="cd-sw u"></i><b>' + un + '</b> unverified' + (dirty && delta ? ' <small>' + (delta > 0 ? '+' : '') + delta + ' vs live</small>' : '') + '</span><span class="cd-mtot">' + plural(fl.length, 'line') + ' in the current runs</span></div>';
      doc.getElementById('cd-sum').innerHTML = !fl.length ? 'No line of this type in the current runs, so a change here shows no effect yet.'
        : dirty ? (delta ? '<b>' + plural(Math.abs(delta), 'line') + '</b> would turn ' + (delta > 0 ? 'unverified' : 'clear') + ' at ' + t + ', against the live threshold of ' + s.threshold + '.' : 'No line changes between ' + s.threshold + ' and ' + t + '.')
        : '<b>' + un + ' of ' + fl.length + '</b> lines show as unverified at the live threshold.';
      doc.getElementById('cd-lines').innerHTML = rows(t, s.threshold);
      doc.getElementById('cd-state').innerHTML = dirty ? C.lbl('draft', 'not saved') : C.lbl('published', 'v' + s.v);
      var sv = doc.getElementById('cd-savewrap'), has = !!sv.firstChild;
      if(dirty && canEdit && !has) sv.innerHTML = C.saveBar('cd'); else if(!dirty && has) sv.innerHTML = '';
    }

    var atX = function(e){ var p = doc.getElementById('cd-plot'), r = p.getBoundingClientRect(); return Math.max(CD_LO, Math.min(CD_HI, Math.round(CD_LO + (e.clientX - r.left) / r.width * (CD_HI - CD_LO)))); };
    view.addEventListener('input', function(e){ if(e.target.id !== 'cd-r') return; val = +e.target.value; update(); });
    view.addEventListener('click', function(e){
      var li = e.target.closest('[data-f]'); if(li){ if(val != null && val !== sheets[cur].threshold){ RI.toast('Save or undo your change first.', 'warn'); return; } cur = li.getAttribute('data-f'); val = null; more = false; history.replaceState(null, '', '#/condition-sheets?fam=' + cur); list(); detail(); return; }
      var st = e.target.closest('[data-step]'); if(st){ val = Math.max(CD_LO, Math.min(CD_HI, (val == null ? sheets[cur].threshold : val) + +st.getAttribute('data-step'))); update(); return; }
      if(canEdit && e.target.closest('#cd-plot')){ val = atX(e); update(); return; }
      if(e.target.closest('#cd-more')){ more = !more; update(); return; }
      if(e.target.closest('#cd-undo')){ val = null; update(); return; }
      if(e.target.closest('#cd-save')){ var s = sheets[cur], sum = 'Confidence threshold ' + s.threshold + ' to ' + val;
        C.askWhy('Condition sheet: ' + name(cur), sum, function(why){ C.addDraft({area:'sheets', ref:cur, title:'Condition sheet: ' + name(cur) + ' threshold', summary:sum, after:{threshold:val}, why:why}); val = null; RI.toast('Saved as a draft. It waits in the publish queue.', 'check'); C.render(); }); }
    });
    list(); detail();
  }, {nav:'sheets', perm:'rulebook.view'});

  /* ---------- Packages and catalog ---------- */
  C.PRESETS = [['SW-PT-001','Interior painting: walls, ceilings, trim, doors, closets','SF, LF, EA','In use'],['SW-FL-001','LVP flooring: demolition, prep, material, install, transitions','SF, LF, EA','In use'],['SW-CB-001','Cabinet installation','LF, EA','In use'],['SW-CB-002','Cabinet refinishing','EA, SF','In use'],['SW-TR-001','Baseboard replacement','LF','In use'],['SW-DR-001','Interior door replacement','EA','In use'],['SW-CT-001','Countertop installation','SF, LF, EA','In use'],['SW-PT-002','Exterior painting','SF, LF','In use'],['SW-TL-001','Floor tile installation','SF','In use'],['SW-DW-001','Drywall repair and installation','SF, EA','In use'],['SW-WP-001','Wallpaper removal and wall prep','SF','In use'],['SW-TR-002','Interior casing replacement','LF','In use'],['SW-PL-001','Bathroom plumbing fixtures','EA','In use'],['SW-PL-002','Kitchen plumbing fixtures','EA','In use'],['SW-EL-001','Interior lighting fixtures','EA','In use'],['SW-EL-002','Switches, receptacles and cover plates','EA','In use'],['SW-BT-001','Bathtub reglazing and surround resurfacing','EA, SF','In use'],['SW-AP-001','Kitchen appliances','EA','In use'],['SW-RF-002','Gutters and downspouts','LF, EA','In use'],['SW-EX-001','Exterior siding replacement','SF, LF, EA','In use'],['SW-HV-001','HVAC replacement','EA','By design'],['SW-PL-003','Water heater replacement','EA','By design'],['SW-RF-001','Asphalt shingle roof replacement','SQ','By design']];
  C.presetName = function(code){ var p = C.PRESETS.filter(function(x){ return x[0] === code; })[0]; return p ? p[1] : ''; };
  var TASKS = {'SW-CB-002':[['Protect and prepare','Cover counters and floors. Remove doors, drawers and hardware, labeled by position.'],['Clean and degrease','Degrease every surface that will be coated.'],['Scuff sand and prime','Bonding primer on fronts and boxes.'],['Two finish coats','Sprayed fronts, brushed boxes. Re-hang and adjust.'],['New pulls','At every position, drilled to the template.']],
    'SW-FL-001':[['Remove','Remove the old floor and haul away.'],['Prepare','Flat within 3/16 in over 10 ft. Fill or grind.'],['Install','Underlayment and plank, staggered joints.'],['Transitions','At every doorway and floor change.'],['Baseboard','Reset or replace, by the rules.']]};
  C.route('/packages', function(view){
    var tab = C.query().tab || 'packages', cur = C.query().p || 'SW-CB-002';
    view.innerHTML = C.page({kicker:'Rulebook', title:'Packages and catalog', sub:'A package is a goal, not a list of work (CORE-06). The catalog holds the scope presets: the standard task list for one action.',
      body:C.seg('pk-tab', [['packages','Packages',3],['presets','Scope presets',C.PRESETS.length]], tab) + '<div id="pk-body" class="c-mt"></div>'});
    function body(){
      var el = doc.getElementById('pk-body');
      if(tab === 'packages') el.innerHTML = '<div class="pk-goals">' + RI.PACKAGES.map(function(p, i){ return '<article class="pk-goal pk-' + p.key + '"><span class="pk-i">' + (i + 1) + '</span><h2>' + p.name + '</h2><p class="pk-g">' + p.goal + '</p><ul>' + [['Essential',['Fix what is broken or unsafe','Keep everything sound','No upgrades for looks alone']],['Standard',['Modernise what looks dated','Keep and refinish what is sound','Mid-grade products']],['Premium',['A higher finish throughout','Replace where a better result is wanted','Upper-grade products']]][i][1].map(function(x){ return '<li>' + x + '</li>'; }).join('') + '</ul>' + C.lbl('published', 'v2') + '</article>'; }).join('') + '</div>' + C.note('Sample wording for each goal. The same goal leads to different work in different houses.');
      if(tab === 'presets'){
        var p = C.PRESETS.filter(function(x){ return x[0] === cur; })[0], tasks = TASKS[cur] || [['Protect and prepare','Protect adjacent finishes and the path in and out.'],['Main work','As named by the preset, to the standard.'],['Clean up','Remove debris and haul away.']];
        el.innerHTML = '<div class="c-split"><aside class="c-list" aria-label="Presets"><p class="c-list-g">23 approved presets</p>' + C.PRESETS.map(function(x){ return '<button type="button" class="c-li' + (x[0] === cur ? ' on' : '') + '" data-p="' + x[0] + '"><span><b><code>' + x[0] + '</code></b><small>' + RI.esc(x[1]) + '</small></span>' + (x[3] === 'By design' ? '<span class="c-chip">By design</span>' : '') + '</button>'; }).join('') + '</aside>' +
          '<section class="c-detail"><header class="c-dhead"><div><p class="c-kicker"><code>' + p[0] + '</code></p><h2>' + RI.esc(p[1]) + '</h2><p class="c-sub">Units: ' + p[2] + '. ' + (p[3] === 'In use' ? 'Used by the engine today.' : 'Defined, but used only when a system is in scope.') + '</p></div>' + C.lbl('published') + '</header>' +
          '<h3 class="c-h2">Tasks</h3><ol class="pk-tasks">' + tasks.map(function(t){ return '<li><b>' + t[0] + '</b><span>' + t[1] + '</span></li>'; }).join('') + '</ol>' +
          '<div class="pk-ie"><div><h3 class="c-h2">Included</h3><p class="small">Material, labour, protection, normal preparation (level 1), clean-up.</p></div><div><h3 class="c-h2">Not included</h3><p class="small">Hidden damage found during work, permits, work by other presets.</p></div><div><h3 class="c-h2">Done when</h3><p class="small">Installed, clean, working, and checked against the scope document.</p></div></div>' +
          C.note('Sample tasks and criteria. Sam\'s preset mapping supplies the real ones.') + '</section></div>';
      }
      RI.fillIcons(el);
    }
    view.querySelector('#pk-tab').addEventListener('click', function(e){ var b = e.target.closest('[data-v]'); if(!b) return; tab = b.getAttribute('data-v'); view.querySelectorAll('#pk-tab [data-v]').forEach(function(x){ x.setAttribute('aria-selected', x === b); }); body(); });
    view.addEventListener('click', function(e){ var b = e.target.closest('[data-p]'); if(b){ cur = b.getAttribute('data-p'); history.replaceState(null, '', '#/packages?tab=presets&p=' + cur); body(); } });
    body();
  }, {nav:'packages', perm:'rulebook.view'});

  /* ---------- Accuracy: Sam's labelled photos and the score ---------- */
  /* Sam's labelled photos (sample set): file, component, Sam's label, the model's reading, confidence. The overview reads it too */
  C.ACC_SET = [['kitchen-dated.jpg','Cabinets','Serviceable, dated','Serviceable, dated',88],['kitchen-dated-wide.jpg','Countertop','Worn','Serviceable',61],['cabinet-run.jpg','Cabinets','Good, dated','Good, dated',91],['wood-floor.jpg','Floor','Serviceable','Serviceable',84],['finishes/bs-existing.jpg','Backsplash','Worn, strongly dated','Worn, strongly dated',79],['finishes/lt-old.jpg','Ceiling light','Worn, obsolete','Worn, dated',66],['finishes/fx-single.jpg','Faucet','Good, current','Good, current',93],['finishes/cab-oak.jpg','Cabinets','Good, dated','Good, dated',90],['finishes/ct-laminate.jpg','Countertop','Serviceable, dated','Serviceable, dated',82],['finishes/lt-flush.jpg','Ceiling light','Good, current','Good, acceptable',74]];
  /* What the model read as the material on each sample photo, and the materials Sam can pick for each component (sample
     lists until the component library has them). Mechanical items get no condition: the rules never give them one. */
  C.ACC_MAT = {'kitchen-dated.jpg':'Painted wood', 'kitchen-dated-wide.jpg':'Laminate', 'cabinet-run.jpg':'Oak veneer', 'wood-floor.jpg':'Solid oak', 'finishes/bs-existing.jpg':'Ceramic tile',
    'finishes/lt-old.jpg':'Fluorescent troffer', 'finishes/fx-single.jpg':'Chrome', 'finishes/cab-oak.jpg':'Solid oak', 'finishes/ct-laminate.jpg':'Laminate', 'finishes/lt-flush.jpg':'LED flush mount'};
  var ACC_MATS = {Cabinets:['Painted wood','Oak veneer','Solid oak','Thermofoil','Laminate'], Countertop:['Laminate','Quartz','Granite','Ceramic tile','Solid surface'],
    Floor:['Solid oak','Engineered wood','Laminate','Vinyl plank','Sheet vinyl','Ceramic tile','Carpet'], Backsplash:['Ceramic tile','Glass tile','Stone tile','Laminate','Paint only'],
    'Ceiling light':['Fluorescent troffer','LED flush mount','Incandescent fixture','Recessed can','Pendant'], Faucet:['Chrome','Brushed nickel','Matte black','Bronze'],
    Furnace:['Gas','Electric','Oil'], 'Water heater':['Gas tank','Electric tank','Tankless'], Roof:['Asphalt shingle','Metal','Tile'], 'Electrical panel':['Breaker panel','Fuse box']};
  var ACC_MECH = ['Furnace','Water heater','Roof','Electrical panel'];
  var ACC_COND = ['Excellent','Good','Serviceable','Worn','Poor','Failed'], ACC_MOD = ['Current','Acceptable','Dated','Strongly dated','Obsolete'];
  function accSplit(t){ var p = String(t || '').split(', '); return {cond:p[0] || '', mod:p[1] ? p[1].charAt(0).toUpperCase() + p[1].slice(1) : ''}; }
  function accText(cond, mod){ return (cond || 'No condition') + (mod ? ', ' + mod.toLowerCase() : ''); }
  /* Every photo in the set as it stands (user, Nov 2026: "what if he disagrees"): the sample set and the photos Sam added,
     with his corrections on top. A correction keeps the labels before it, with who gave them and when. */
  C.accRows = function(){
    var fix = C.get('accFix', {}) || {}, rows = C.ACC_SET.map(function(x){ return {id:x[0], src:RI.img(x[0]), name:x[0], comp:x[1], mat:C.ACC_MAT[x[0]] || '', label:x[2], model:x[3], modelComp:x[1], modelMat:C.ACC_MAT[x[0]] || '', conf:x[4]}; });
    (C.get('accAdded', []) || []).forEach(function(a){ rows.push({id:a.id, src:a.src, name:a.name, comp:a.comp, mat:a.mat, label:accText(a.cond, a.mod), note:a.note, by:a.by, at:a.at, model:a.model || null, modelComp:a.modelComp || a.comp, modelMat:a.modelMat || '', conf:a.conf || null, added:true}); });
    return rows.map(function(r){
      var f = fix[r.id]; if(f){ r.comp = f.comp; r.mat = f.mat; r.label = accText(f.cond, f.mod); r.fix = f; }
      r.read = r.model != null;
      r.ok = r.read && r.comp === r.modelComp && r.label.toLowerCase() === String(r.model).toLowerCase() && (!r.mat || !r.modelMat || r.mat === r.modelMat || r.mat === 'Not sure');
      return r;
    });
  };
  C.route('/accuracy', function(view){
    var st = {f:'all'}, queue = [];
    var FILTERS = [['all','All'], ['ok','Agrees'], ['no','Disagrees'], ['fix','Corrected by Sam'], ['new','Not read yet']];
    function pass(r, f){ return f === 'all' || (f === 'ok' && r.ok) || (f === 'no' && r.read && !r.ok) || (f === 'fix' && !!r.fix) || (f === 'new' && !r.read); }
    function when(t){ return new Date(t).toLocaleDateString('en-US', {month:'short', day:'numeric'}); }
    /* One photo (user, Nov 2026, make-ui): what Sam said and what the model read on two aligned rows, the model's wrong
       words crossed out, one row when they agree; Agrees or Disagrees with an icon; Corrected as a tag on the photo; the
       note with who wrote it and when; the photo opens the panel to look closer. Phones show it as a list row. */
    function parts(t){ var p = String(t || '').split(', '); return [p[0] || '', p[1] || '']; }
    function card(r){
      var nm = RI.esc(r.comp || 'this') + ' photo', s = parts(r.label), m = parts(r.model), cmp;
      var matS = r.mat && r.mat !== 'Not sure' ? r.mat : '', matM = r.modelMat || '';
      if(!r.read) cmp = '<div class="acl-k">Sam</div><div class="acl-v">' + RI.esc(r.label) + (matS ? ' · ' + RI.esc(matS) : '') + '</div><div class="acl-k">Model</div><div class="acl-v muted">Not read yet</div>';
      else if(r.ok) cmp = '<div class="acl-k">Both</div><div class="acl-v">' + RI.esc(r.label) + '<span class="acl-pc">' + r.conf + '% sure</span></div>';
      else {
        var dc = r.comp !== r.modelComp, d0 = s[0] !== m[0], d1 = s[1] !== m[1], dm = matS && matM && matS !== matM;
        var sam = (dc ? '<b>' + RI.esc(r.comp) + '</b> · ' : '') + (d0 ? '<b>' + RI.esc(s[0]) + '</b>' : RI.esc(s[0])) + (s[1] ? ', ' + (d1 ? '<b>' + RI.esc(s[1]) + '</b>' : RI.esc(s[1])) : '') + (dm ? ' · <b>' + RI.esc(matS) + '</b>' : '');
        var mod = (dc ? '<s>' + RI.esc(r.modelComp) + '</s> · ' : '') + (d0 ? '<s>' + RI.esc(m[0]) + '</s>' : RI.esc(m[0])) + (m[1] ? ', ' + (d1 ? '<s>' + RI.esc(m[1]) + '</s>' : RI.esc(m[1])) : '') + (dm ? ' · <s>' + RI.esc(matM) + '</s>' : '');
        cmp = '<div class="acl-k">Sam</div><div class="acl-v">' + sam + '</div><div class="acl-k">Model</div><div class="acl-v">' + mod + '<span class="acl-pc">' + r.conf + '% sure</span></div>';
      }
      var who = r.fix ? [r.fix.note, r.fix.by, r.fix.at] : [r.note, r.by, r.at];
      var note = who[0] ? '<div class="acl-nt"><q>' + RI.esc(who[0]) + '</q><span class="acl-who">' + RI.esc(who[1] || 'Sam') + (who[2] ? ', ' + when(who[2]) : '') + '</span></div>' : '';
      var badge = !r.read ? '<em class="acl-bd wait">Not read yet</em>' : r.ok ? '<em class="acl-bd ok">' + RI.icon('check') + 'Agrees</em>' : '<em class="acl-bd no">' + RI.icon('x') + 'Disagrees</em>';
      var btn = r.read && r.ok && !r.fix ? '<button type="button" class="acl-btn" data-acl="disagree" aria-label="Disagree with the model on the ' + nm + '">' + RI.icon('x','i-sm') + 'Disagree</button>'
        : '<button type="button" class="acl-btn" data-acl="edit" aria-label="Edit the label of the ' + nm + '">' + RI.icon('pencil','i-sm') + 'Edit label</button>';
      return '<figure class="ac-ph" data-id="' + RI.esc(r.id) + '"><button type="button" class="acl-photo" data-acl="look" aria-label="Look closer at the ' + nm + '"><img src="' + r.src + '" alt="" loading="lazy">' +
          (r.fix ? '<span class="acl-tag">Corrected</span>' : r.added ? '<span class="acl-tag">Added</span>' : '') + '<span class="acl-look" aria-hidden="true"><span>' + RI.icon('eye','i-sm') + 'Look closer</span></span></button>' +
        '<figcaption><b class="acl-t">' + RI.esc(r.comp) + '</b><div class="acl-cmp">' + cmp + '</div>' + note + '<div class="acl-ft">' + badge + btn + '</div></figcaption></figure>';
    }
    function draw(keep){
      var y = window.scrollY, rows = C.accRows(), read = rows.filter(function(r){ return r.read; }), agree = read.filter(function(r){ return r.ok; }).length;
      var score = read.length ? Math.round(agree / read.length * 100) : 0, last = C.get('evalAt', Date.now() - 2 * DAY), unread = rows.length - read.length;
      var byComp = {}; read.forEach(function(r){ var b = byComp[r.comp] = byComp[r.comp] || [0, 0]; b[1]++; if(r.ok) b[0]++; });
      var counts = {}; FILTERS.forEach(function(f){ counts[f[0]] = rows.filter(function(r){ return pass(r, f[0]); }).length; });
      if(!counts[st.f] && st.f !== 'all') st.f = 'all';
      var shown = rows.filter(function(r){ return pass(r, st.f); });
      var EMPTY = {fix:'No label is corrected yet. Use Disagree on a photo to give the right answer.', ok:'No photo agrees with the model yet.', no:'Every photo agrees with the model.'};
      view.innerHTML = C.page({kicker:'Quality', title:'Photo accuracy', sub:'Sam\'s labelled photos, read by the model and compared with his labels. Run before any prompt or model change. When the model is wrong, Disagree and give the right answer.',
        actions:'<button type="button" class="btn btn-primary" id="ac-run">' + RI.icon('refresh','i-sm') + 'Run the photo set</button>',
        body:'<div class="ac-top"><div class="ac-score" style="--p:' + score + '"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52"/><circle class="v" cx="60" cy="60" r="52" style="stroke-dasharray:326.7;stroke-dashoffset:' + (326.7 * (1 - score / 100)).toFixed(1) + '"/></svg><div><b>' + score + '<small>%</small></b><span>agree with Sam</span></div></div>' +
          '<dl class="c-kv ac-kv"><dt>Labelled photos</dt><dd>' + rows.length + ' ' + C.lbl('sample') + '</dd><dt>Agree</dt><dd>' + agree + '</dd><dt>Disagree</dt><dd>' + (read.length - agree) + '</dd>' + (unread ? '<dt>Not read yet</dt><dd>' + unread + '</dd>' : '') + '<dt>Last run</dt><dd id="ac-last">' + C.time(last) + '</dd><dt>Model</dt><dd>Vision model behind the adapter</dd></dl>' +
          '<div class="ac-comp"><h2 class="c-h2">By component</h2>' + Object.keys(byComp).map(function(k){ var b = byComp[k], pc = Math.round(b[0] / b[1] * 100); return '<div class="ac-bar"><span>' + RI.esc(k) + '</span><span class="ac-t"><i style="width:' + pc + '%"></i></span><b>' + b[0] + ' of ' + b[1] + '</b></div>'; }).join('') + '</div></div>' +
          '<h2 class="c-h2 c-mt">Every labelled photo</h2>' +
          '<div class="acl-bar"><div class="c-seg" role="tablist" aria-label="Show" id="acl-f">' + FILTERS.filter(function(f){ return f[0] !== 'new' || counts.new; }).map(function(f){ return '<button type="button" role="tab" data-f="' + f[0] + '" aria-selected="' + (st.f === f[0]) + '">' + f[1] + '<span class="n">' + counts[f[0]] + '</span></button>'; }).join('') + '</div>' +
            '<label class="btn btn-secondary btn-sm acl-add">' + RI.icon('plus','i-sm') + 'Add photos to the set<input type="file" accept="image/*" multiple id="acl-file" class="sr"></label></div>' +
          (shown.length ? '<div class="ac-grid" id="acl-grid">' + shown.map(card).join('') + '</div>' : '<p class="acl-empty">' + (EMPTY[st.f] || 'No photo here.') + '</p>') +
          C.note('Sample set. Sam\'s labelled lab photos replace it; accuracy is reported per component and per condition. Every correction is kept with the labels before it.')});
      RI.fillIcons(view);
      if(keep) window.scrollTo(0, y);
    }
    /* The label panel: the photo and what the model read on the left, what is right on the right */
    function openLabel(r, mode, done){
      var look = mode === 'look'; if(look) mode = r.read && r.ok && !r.fix ? 'disagree' : 'edit';
      var cur = {comp:r.comp || '', mat:r.mat || '', cond:'', mod:''}, sp = accSplit(r.label), msp = accSplit(r.model);
      if(mode !== 'new'){ cur.cond = r.fix ? r.fix.cond : sp.cond; cur.mod = r.fix ? r.fix.mod : sp.mod; }
      var comps = Object.keys(ACC_MATS), mech = function(){ return ACC_MECH.indexOf(cur.comp) >= 0; };
      var chips = function(key, name, opts, on, model){ return '<div class="acl-f" data-k="' + key + '"><span class="l" id="acl-' + key + '">' + name + '</span><div class="acl-chips' + (model ? ' has-model' : '') + '" role="group" aria-labelledby="acl-' + key + '">' + opts.map(function(o){ var v = o === 'Not judged' ? '' : o; return '<button type="button" data-v="' + v + '" aria-pressed="' + (v === on) + '"' + (model && o === model ? ' class="model" title="What the model picked"' : '') + '>' + o + '</button>'; }).join('') + '</div></div>'; };
      var hist = r.fix && r.fix.hist ? r.fix.hist.slice().reverse() : [];
      var title = look ? 'The ' + (r.comp || 'new') + ' photo' : mode === 'new' ? 'Label this photo' + (done && done.of > 1 ? ' (' + done.n + ' of ' + done.of + ')' : '') : mode === 'disagree' ? 'Disagree with the model' : 'Edit the label';
      var body = '<form class="acl-g" id="acl-form" novalidate><div class="acl-ph"><img src="' + r.src + '" alt="The ' + RI.esc(r.comp || 'new') + ' photo"><p>Lab photo · ' + RI.esc(r.name || '') + '</p>' +
          (r.read ? '<div class="acl-read"><small>The model read</small><span><b>' + RI.esc(r.modelComp) + '</b>' + (r.modelMat ? ' · ' + RI.esc(r.modelMat) : '') + ' · ' + RI.esc(r.model) + '</span><span class="conf">' + r.conf + '% sure</span></div>'
            : '<div class="acl-read"><small>The model</small><span>Not read yet. It reads this photo the next time the set is run.</span></div>') + '</div>' +
        '<div class="acl-form"><h3>What is right?</h3>' +
          '<div class="acl-f"><label for="acl-c">Component</label><select id="acl-c">' + (cur.comp ? '' : '<option value="">Pick the part in the photo</option>') + comps.map(function(c){ return '<option' + (c === cur.comp ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select>' + (mode === 'new' ? '' : '<p class="acl-help">Change it if the model named the wrong part.</p>') + '<p class="acl-err" id="acl-c-err" hidden>Pick the part in the photo.</p></div>' +
          '<div class="acl-f"><label for="acl-m">Material</label><select id="acl-m"></select></div>' +
          '<div id="acl-cm"></div>' +
          '<div class="acl-f"><label for="acl-n">Note: ' + (mode === 'new' ? 'anything to know about this photo?' : 'why is it wrong?') + '</label><textarea id="acl-n" placeholder="' + (mode === 'new' ? 'For example: taken in morning light, the left cabinet door is new' : 'For example: cupping by the back door, finish worn through in the walkway') + '">' + RI.esc(r.fix ? r.fix.note || '' : '') + '</textarea><p class="acl-help">The team reads every note when they tune the prompt and the thresholds.</p></div>' +
          (hist.length ? '<details class="acl-hist"><summary>Earlier labels · ' + hist.length + '</summary><ol>' + hist.map(function(h){ return '<li><b>' + RI.esc(h.label) + (h.mat ? ' · ' + RI.esc(h.mat) : '') + '</b><span>' + RI.esc(h.by) + (h.at ? ', ' + when(h.at) : '') + '</span>' + (h.note ? '<q>' + RI.esc(h.note) + '</q>' : '') + '</li>'; }).join('') + '</ol></details>' : '') +
          '<p class="acl-err" id="acl-same" hidden>This is what the model read. Change at least one answer, or press Cancel.</p>' +
        '</div>' +
        '<div class="acl-foot"><p>The model\'s reading stays next to your label. Nothing is overwritten: every change is kept with your name and the date.</p><div class="btns">' + (r.added && mode !== 'new' ? '<button type="button" class="btn btn-text acl-rm">Remove this photo</button>' : '') + '<button type="button" class="btn btn-secondary" data-dlg-close>Cancel</button><button type="submit" class="btn btn-primary">Save my label</button></div></div></form>';
      var d = C.dialog(title, body, {wide:true, onClose:function(){ if(done && done.next) done.next(); }}); d.classList.add('acl-dlg');
      function paint(){
        var mats = (ACC_MATS[cur.comp] || []).concat(['Not sure']); if(cur.mat && mats.indexOf(cur.mat) < 0) cur.mat = '';
        d.querySelector('#acl-m').innerHTML = (cur.comp ? '' : '<option value="">Pick the part first</option>') + mats.map(function(m){ return '<option' + (m === cur.mat ? ' selected' : '') + '>' + m + '</option>'; }).join('');
        if(!cur.mat && cur.comp){ cur.mat = 'Not sure'; d.querySelector('#acl-m').value = 'Not sure'; } /* a new part starts unsure, never a guessed material */
        var sameComp = r.read && r.modelComp === cur.comp;
        d.querySelector('#acl-cm').innerHTML = mech() ? '<p class="acl-mech">' + RI.icon('shield','i-sm') + 'Mechanical items get no condition. The rules give them guidance only.</p>'
          : chips('cond', 'Condition', ACC_COND, cur.cond, sameComp ? msp.cond : '') + '<p class="acl-err" id="acl-cond-err" hidden>Pick a condition.</p>' + chips('mod', 'Modernisation', ACC_MOD.concat(['Not judged']), cur.mod, sameComp ? (msp.mod || 'Not judged') : '');
        RI.fillIcons(d);
      }
      paint();
      d.querySelector('#acl-c').addEventListener('change', function(){ cur.comp = this.value; d.querySelector('#acl-c-err').hidden = true; paint(); });
      d.querySelector('#acl-m').addEventListener('change', function(){ cur.mat = this.value; });
      d.addEventListener('click', function(e){
        var b = e.target.closest('.acl-chips [data-v]'); if(b){ var k = b.closest('[data-k]').getAttribute('data-k'); cur[k] = b.getAttribute('data-v'); b.parentNode.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed', x === b); }); var er = d.querySelector('#acl-cond-err'); if(er && k === 'cond') er.hidden = true; d.querySelector('#acl-same').hidden = true; return; }
        if(e.target.closest('.acl-rm')) C.confirm('Remove this photo?', 'It leaves the accuracy set and the score. Its labels stay in the audit log.', 'Remove', function(){ C.set('accAdded', (C.get('accAdded', []) || []).filter(function(a){ return a.id !== r.id; })); var fx = C.get('accFix', {}) || {}; delete fx[r.id]; C.set('accFix', fx); C.log('Photo labelled', 'Removed ' + (r.comp || 'a') + ' photo from the accuracy set', '', 'accuracy'); d.close(); draw(true); RI.toast('Photo removed from the set.', 'check'); }, true);
      });
      d.querySelector('#acl-form').addEventListener('submit', function(e){
        e.preventDefault();
        var note = d.querySelector('#acl-n').value.trim(), m = mech();
        if(!cur.comp){ d.querySelector('#acl-c-err').hidden = false; d.querySelector('#acl-c').focus(); return; }
        if(!m && !cur.cond){ d.querySelector('#acl-cond-err').hidden = false; return; }
        var lab = {comp:cur.comp, mat:cur.mat, cond:m ? '' : cur.cond, mod:m ? '' : cur.mod, note:note, by:(C.me() || {}).name || 'Sam', at:Date.now()};
        if(mode === 'disagree' && r.read && lab.comp === r.modelComp && accText(lab.cond, lab.mod).toLowerCase() === String(r.model).toLowerCase() && (lab.mat === r.modelMat || lab.mat === 'Not sure')){ d.querySelector('#acl-same').hidden = false; return; }
        var text = accText(lab.cond, lab.mod) + (lab.mat ? ' · ' + lab.mat : '');
        try {
          if(mode === 'new'){
            var added = C.get('accAdded', []) || []; lab.id = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); lab.src = r.src; lab.name = r.name; added.push(lab); C.set('accAdded', added);
            C.log('Photo labelled', 'Added a ' + lab.comp + ' photo to the accuracy set: ' + text, note, 'accuracy');
            d.close(); draw(true); RI.toast('Photo added to the set. The model reads it on the next run.', 'check');
          } else {
            var fx = C.get('accFix', {}) || {}, prev = fx[r.id], before = prev ? JSON.parse(JSON.stringify(prev)) : null;
            var was = prev ? {label:accText(prev.cond, prev.mod), mat:prev.mat, note:prev.note, by:prev.by, at:prev.at} : {label:r.label, mat:r.added ? r.mat : '', note:r.note || '', by:r.added ? (r.by || 'Sam') : 'Original label', at:r.added ? r.at : null};
            lab.hist = (prev && prev.hist || []).concat([was]); fx[r.id] = lab; C.set('accFix', fx);
            C.log('Photo labelled', lab.comp + ' photo: ' + was.label + ' changed to ' + text, note, 'accuracy');
            d.close(); draw(true);
            RI.toast('Label saved. The score now counts your label.', 'check');
            undoable(function(){ var a2 = C.get('accFix', {}) || {}; if(before) a2[r.id] = before; else delete a2[r.id]; C.set('accFix', a2); draw(true); });
          }
        } catch(err){ RI.toast('This demo browser has no room left for more photos. Remove one and try again.', 'warn'); }
      });
      var first = d.querySelector(mode === 'new' ? '#acl-c' : '.acl-chips [aria-pressed="true"]') || d.querySelector('#acl-c'); if(first) first.focus();
    }
    function undoable(fn){ setTimeout(function(){ var el = doc.querySelector('.toasts .toast:last-child, .toasts > *:last-child'); if(!el || el.querySelector('.tr-undo')) return; var b = doc.createElement('button'); b.type = 'button'; b.className = 'tr-undo'; b.textContent = 'Undo'; b.addEventListener('click', function(){ fn(); el.remove(); }); el.appendChild(b); }, 20); }
    /* New photos: made smaller in the browser, then labelled one after another */
    function shrink(file, cb){
      var fr = new FileReader(); fr.onload = function(){ var im = new Image(); im.onload = function(){ var k = Math.min(1, 960 / Math.max(im.width, im.height)), c = doc.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', 0.8)); }; im.onerror = function(){ cb(null); }; im.src = fr.result; }; fr.readAsDataURL(file);
    }
    function nextNew(n, of){
      var f = queue.shift(); if(!f) return;
      shrink(f, function(src){
        if(!src){ RI.toast('That file is not a photo we can read.', 'warn'); nextNew(n + 1, of); return; }
        openLabel({src:src, name:f.name, comp:'', mat:'', label:'', read:false}, 'new', {n:n, of:of, next:function(){ nextNew(n + 1, of); }});
      });
    }
    view.addEventListener('change', function(e){ if(e.target.id !== 'acl-file') return; queue = [].slice.call(e.target.files || []).filter(function(f){ return /^image\//.test(f.type); }); e.target.value = ''; nextNew(1, queue.length); });
    view.addEventListener('click', function(e){
      var f = e.target.closest('#acl-f [data-f]'); if(f){ st.f = f.getAttribute('data-f'); draw(true); var nb = view.querySelector('#acl-f [data-f="' + st.f + '"]'); if(nb) nb.focus(); return; }
      var b = e.target.closest('[data-acl]'); if(b){ var id = b.closest('[data-id]').getAttribute('data-id'), r = C.accRows().filter(function(x){ return x.id === id; })[0]; if(r) openLabel(r, b.getAttribute('data-acl')); return; }
      if(e.target.closest('#ac-run')){
        var btn = e.target.closest('#ac-run'), n = C.accRows().length; RI.form.busy(btn, true, 'Reading ' + n + ' photos');
        C.later(function(){
          /* Photos Sam added are read now: in the prototype the model mostly agrees, and reads every third one a step better than it is */
          var added = C.get('accAdded', []) || [], k = 0;
          added.forEach(function(a){ if(a.model) return; var better = k++ % 3 === 2 && ACC_COND.indexOf(a.cond) > 0; a.model = accText(better ? ACC_COND[ACC_COND.indexOf(a.cond) - 1] : a.cond, a.mod); a.modelComp = a.comp; a.modelMat = a.mat === 'Not sure' ? '' : a.mat; a.conf = better ? 68 : 84 + (k % 3) * 4; });
          try { C.set('accAdded', added); } catch(err){}
          C.set('evalAt', Date.now()); draw(true);
          var rows = C.accRows(), read = rows.filter(function(r){ return r.read; }), sc = read.length ? Math.round(read.filter(function(r){ return r.ok; }).length / read.length * 100) : 0;
          C.log('Accuracy run', rows.length + ' labelled photos, ' + sc + '% agree', ''); RI.toast('Photo set read: ' + sc + '% agree with Sam.', 'check');
        }, 1600);
      }
    });
    draw();
  }, {nav:'accuracy', perm:'accuracy.manage'});
})();
