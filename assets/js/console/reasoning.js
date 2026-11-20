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
    view.innerHTML = C.page({kicker:'Reasoning', title:'Room templates', sub:'The standard contents of each room type, so nobody types the obvious. The photos confirm what is really there.',
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

  /* Lines across every run that use a rule, or fall in a family */
  function allLines(){ var out = []; A.all().forEach(function(h){ var m = C.model(h); if(m) m.lines.forEach(function(l){ l.h = h; out.push(l); }); }); return out; }

  /* ---------- Rules and families ---------- */
  C.route('/rules', function(view){
    var rules = C.get('rules', []), st = {fam:C.query().fam || 'all', cls:'all', q:''};
    var cnt = function(f){ return rules.filter(function(r){ return f === 'all' || r.fam === f; }).length; };
    view.innerHTML = C.page({kicker:'Reasoning', title:'Rules and families', sub:'The rule registry, grouped by the twelve families. Every rule has a reason, a worked example, a version and the tests that prove it. A rule without a test cannot be published.',
      body:'<div class="ru-note">' + C.lbl('sample') + '<span>Showing the ' + rules.length + ' rules named in the developer guide: the twelve core rules, Sam\'s approved component rules, and the dependency and quantity rules. The full registry of 221 rules loads from Sam\'s grouped list.</span></div>' +
        '<div class="ru-fams" id="ru-fams"><button type="button" data-fam="all" aria-pressed="' + (st.fam === 'all') + '"><b>All families</b><span>' + rules.length + ' rules</span></button>' + C.FAMILIES.map(function(f){ var n = cnt(f[0]); return '<button type="button" data-fam="' + f[0] + '" aria-pressed="' + (st.fam === f[0]) + '"' + (n ? '' : ' class="empty"') + '><code>' + f[0] + '</code><b>' + f[1] + '</b><span>' + (n ? n + ' rule' + (n > 1 ? 's' : '') : 'None shown yet') + '</span></button>'; }).join('') + '</div>' +
        '<div class="c-toolbar c-mt">' + C.seg('ru-cls', [['all','All classes']].concat(Object.keys(C.CLASSES).map(function(k){ return [k, C.CLASSES[k][0]]; })), 'all') + '<div class="c-tools">' + C.search('ru-q', 'Code or words', '') + '</div></div><div id="ru-list"></div>'});
    function draw(){
      var v = st.q.toLowerCase(), list = rules.filter(function(r){ return (st.fam === 'all' || r.fam === st.fam) && (st.cls === 'all' || r.cls === st.cls) && (!v || (r.code + ' ' + r.text + ' ' + r.plain).toLowerCase().indexOf(v) > -1); });
      doc.getElementById('ru-list').innerHTML = C.table({empty:'No rule matches.', cols:[{label:'Rule'},{label:'In plain words'},{label:'Family'},{label:'Class'},{label:'Version', num:true},{label:'State'}],
        rows:list.map(function(r){ var dr = C.draftFor('rules', r.code); return {attr:'data-go="#/rules/' + r.code + '" tabindex="0" role="link"', cells:['<span class="ru-c"><code>' + r.code + '</code><b>' + RI.esc(r.text) + '</b></span>', RI.esc(r.plain), '<code>' + r.fam + '</code> ' + C.FAMILIES.filter(function(f){ return f[0] === r.fam; })[0][1], '<span class="cls cls-' + r.cls + '">' + C.CLASSES[r.cls][0] + '</span>', 'v' + r.v, dr ? C.lbl('queued') : C.lbl('published')]}; })});
      RI.fillIcons(doc.getElementById('ru-list'));
    }
    view.querySelector('#ru-fams').addEventListener('click', function(e){ var b = e.target.closest('[data-fam]'); if(!b) return; st.fam = b.getAttribute('data-fam'); view.querySelectorAll('#ru-fams [data-fam]').forEach(function(x){ x.setAttribute('aria-pressed', x === b); }); draw(); });
    view.querySelector('#ru-cls').addEventListener('click', function(e){ var b = e.target.closest('[data-v]'); if(!b) return; st.cls = b.getAttribute('data-v'); view.querySelectorAll('#ru-cls [data-v]').forEach(function(x){ x.setAttribute('aria-selected', x === b); }); draw(); });
    view.querySelector('#ru-q').addEventListener('input', function(){ st.q = this.value; draw(); });
    view.addEventListener('click', function(e){ var r = e.target.closest('[data-go]'); if(r) C.go(r.getAttribute('data-go')); });
    view.addEventListener('keydown', function(e){ var r = e.target.closest('[data-go]'); if(r && e.key === 'Enter') C.go(r.getAttribute('data-go')); });
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

  /* ---------- Condition sheets ---------- */
  var SEVS = [['C0','No visible defect','Keep, unless the goal asks for change'],['C1','Minor cosmetic wear','Clean, repair or refinish'],['C2','Moderate deterioration','Repair or refinish; replace if the goal needs it'],['C3','Significant deterioration','Replace or repair, by the rules'],['C4','Apparent urgent safety concern','Flag for a professional; no precise replacement'],['CX','Not enough evidence','Verify. Shown as unverified']];
  C.route('/condition-sheets', function(view){
    var sheets = C.get('sheets', {}), fams = Object.keys(sheets), cur = C.query().fam || 'CB', lines = allLines(), val = null, canEdit = C.can('rulebook.edit');
    view.innerHTML = C.page({kicker:'Reasoning', title:'Condition sheets', sub:'Sam\'s conditions per component type, and the confidence threshold for each. Below the threshold, a line shows as unverified instead of being priced.',
      body:'<div class="c-split"><aside class="c-list" aria-label="Component types"><div id="cs-list"></div></aside><section class="c-detail" id="cs-detail"></section></div>'});
    function list(){
      doc.getElementById('cs-list').innerHTML = '<p class="c-list-g">Component types</p>' + fams.map(function(f){ var s = sheets[f], dr = C.draftFor('sheets', f);
        return '<button type="button" class="c-li' + (f === cur ? ' on' : '') + '" data-f="' + f + '"><span><b>' + (C.FAMILY[f] || f) + '</b><small><code>' + f + '</code> · threshold ' + s.threshold + '</small></span>' + (dr ? C.lbl('queued') : '') + '</button>'; }).join('');
    }
    function detail(){
      var s = sheets[cur], t = val == null ? s.threshold : val, fl = lines.filter(function(l){ return l.fam === cur && l.item.state !== 'measure'; });
      var below = fl.filter(function(l){ return l.conf < t; }).length, nowBelow = fl.filter(function(l){ return l.conf < s.threshold; }).length;
      var el = doc.getElementById('cs-detail');
      el.innerHTML = C.draftBar('sheets', cur) + '<header class="c-dhead"><div><p class="c-kicker"><code>' + cur + '</code></p><h2>' + (C.FAMILY[cur] || cur) + '</h2><p class="c-sub">Version ' + s.v + ', published ' + C.ago(s.at) + '.</p></div>' + (val != null && val !== s.threshold ? C.lbl('draft', 'not saved') : C.lbl('published')) + '</header>' +
        '<section class="cs-thr"><div class="cs-thr-h"><label for="cs-r"><b>Confidence threshold</b><span class="small muted">A reading below this shows as unverified.</span></label><output id="cs-o">' + t + '</output></div>' +
          '<input type="range" id="cs-r" min="40" max="95" step="1" value="' + t + '"' + (canEdit ? '' : ' disabled') + ' aria-describedby="cs-eff">' +
          '<div class="cs-dots" aria-hidden="true">' + fl.map(function(l){ return '<i class="' + (l.conf < t ? 'below' : '') + '" style="left:' + ((l.conf - 40) / 55 * 100) + '%" title="' + RI.esc(l.item.name) + ', ' + l.conf + '"></i>'; }).join('') + '</div>' +
          '<p class="cs-eff" id="cs-eff">' + (fl.length ? '<b>' + below + ' of ' + fl.length + '</b> ' + (C.FAMILY[cur] || cur).toLowerCase() + ' lines in the current runs would show as unverified' + (t !== s.threshold ? ' (now ' + nowBelow + ')' : '') + '.' : 'No line of this type in the current runs.') + '</p></section>' +
        '<section class="c-mt"><h3 class="c-h2">Severity codes</h3>' + C.table({cols:[{label:'Code'},{label:'Meaning'},{label:'What the engine does'}], rows:SEVS.map(function(x){ return {cells:['<span class="sev sev-' + x[0] + '">' + x[0] + '</span>', x[1], x[2]]}; })}) + '</section>' +
        '<section class="c-mt"><h3 class="c-h2">Four separate scales</h3><div class="cs-scales">' + [['Physical condition','Excellent, Good, Serviceable, Worn, Poor, Failed, Unknown'],['Modernisation','Current, Acceptable, Dated, Strongly dated, Obsolete, Unknown'],['Character value','High, Moderate, Low, None, Unknown'],['Functional adequacy','Good, Adequate, Limited, Deficient, Unknown']].map(function(x){ return '<div><b>' + x[0] + '</b><span>' + x[1] + '</span></div>'; }).join('') + '</div>' + C.note('Never one score: a 1990 oak kitchen can be condition 8 and modernisation 3 (PDF section 33).') + '</section>' +
        (val != null && val !== s.threshold && canEdit ? C.saveBar('cs') : '') + (canEdit ? '' : C.note('Changing a threshold needs the permission to edit reasoning drafts.', 'lock'));
      RI.fillIcons(el);
    }
    view.addEventListener('input', function(e){ if(e.target.id !== 'cs-r') return; var had = val != null && val !== sheets[cur].threshold; val = +e.target.value; var has = val !== sheets[cur].threshold;
      if(had !== has){ detail(); var r = doc.getElementById('cs-r'); r.focus(); return; }
      doc.getElementById('cs-o').textContent = val; var fl = lines.filter(function(l){ return l.fam === cur && l.item.state !== 'measure'; }), below = fl.filter(function(l){ return l.conf < val; }).length;
      doc.querySelectorAll('.cs-dots i').forEach(function(i, k){ i.classList.toggle('below', fl[k].conf < val); });
      doc.getElementById('cs-eff').innerHTML = fl.length ? '<b>' + below + ' of ' + fl.length + '</b> ' + (C.FAMILY[cur] || cur).toLowerCase() + ' lines in the current runs would show as unverified (now ' + fl.filter(function(l){ return l.conf < sheets[cur].threshold; }).length + ').' : 'No line of this type in the current runs.';
    });
    view.addEventListener('click', function(e){
      var li = e.target.closest('[data-f]'); if(li){ if(val != null && val !== sheets[cur].threshold){ RI.toast('Save or undo your change first.', 'warn'); return; } cur = li.getAttribute('data-f'); val = null; history.replaceState(null, '', '#/condition-sheets?fam=' + cur); list(); detail(); return; }
      if(e.target.closest('#cs-undo')){ val = null; detail(); }
      if(e.target.closest('#cs-save')){ var s = sheets[cur], sum = 'Confidence threshold ' + s.threshold + ' to ' + val;
        C.askWhy('Condition sheet: ' + (C.FAMILY[cur] || cur), sum, function(why){ C.addDraft({area:'sheets', ref:cur, title:'Condition sheet: ' + (C.FAMILY[cur] || cur) + ' threshold', summary:sum, after:{threshold:val}, why:why}); val = null; RI.toast('Saved as a draft. It waits in the publish queue.', 'check'); C.render(); }); }
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
    view.innerHTML = C.page({kicker:'Reasoning', title:'Packages and catalog', sub:'A package is a goal, not a list of work (CORE-06). The catalog holds the scope presets: the standard task list for one action.',
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
  C.route('/accuracy', function(view){
    var SET = C.ACC_SET;
    var agree = SET.filter(function(x){ return x[2] === x[3]; }).length, score = Math.round(agree / SET.length * 100), last = C.get('evalAt', Date.now() - 2 * DAY);
    var byComp = {}; SET.forEach(function(x){ var b = byComp[x[1]] = byComp[x[1]] || [0, 0]; b[1]++; if(x[2] === x[3]) b[0]++; });
    view.innerHTML = C.page({kicker:'Reasoning', title:'Accuracy', sub:'Sam\'s labelled photos, read by the model and compared with his labels. Run before any prompt or model change.',
      actions:'<button type="button" class="btn btn-primary" id="ac-run">' + RI.icon('refresh','i-sm') + 'Run the photo set</button>',
      body:'<div class="ac-top"><div class="ac-score" style="--p:' + score + '"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52"/><circle class="v" cx="60" cy="60" r="52" style="stroke-dasharray:326.7;stroke-dashoffset:' + (326.7 * (1 - score / 100)).toFixed(1) + '"/></svg><div><b>' + score + '<small>%</small></b><span>agree with Sam</span></div></div>' +
        '<dl class="c-kv ac-kv"><dt>Labelled photos</dt><dd>' + SET.length + ' ' + C.lbl('sample') + '</dd><dt>Agree</dt><dd>' + agree + '</dd><dt>Disagree</dt><dd>' + (SET.length - agree) + '</dd><dt>Last run</dt><dd id="ac-last">' + C.time(last) + '</dd><dt>Model</dt><dd>Vision model behind the adapter</dd></dl>' +
        '<div class="ac-comp"><h2 class="c-h2">By component</h2>' + Object.keys(byComp).map(function(k){ var b = byComp[k], pc = Math.round(b[0] / b[1] * 100); return '<div class="ac-bar"><span>' + k + '</span><span class="ac-t"><i style="width:' + pc + '%"></i></span><b>' + b[0] + ' of ' + b[1] + '</b></div>'; }).join('') + '</div></div>' +
        '<h2 class="c-h2 c-mt">Every labelled photo</h2><div class="ac-grid">' + SET.map(function(x){ var ok = x[2] === x[3]; return '<figure class="ac-ph' + (ok ? '' : ' miss') + '"><img src="' + RI.img(x[0]) + '" alt="" loading="lazy"><figcaption><b>' + x[1] + '</b><span><small>Sam</small>' + x[2] + '</span><span><small>Model</small>' + x[3] + ' · ' + x[4] + '</span>' + (ok ? '<em class="rel rel-ok">Agrees</em>' : '<em class="rel rel-part">Disagrees</em>') + '</figcaption></figure>'; }).join('') + '</div>' +
        C.note('Sample set. Sam\'s labelled lab photos replace it; accuracy is reported per component and per condition.')});
    view.querySelector('#ac-run').addEventListener('click', function(){ var b = this; RI.form.busy(b, true, 'Reading ' + SET.length + ' photos'); C.later(function(){ RI.form.busy(b, false); C.set('evalAt', Date.now()); doc.getElementById('ac-last').textContent = C.time(Date.now()); C.log('Accuracy run', SET.length + ' labelled photos, ' + score + '% agree', ''); RI.toast('Photo set read: ' + score + '% agree with Sam. No change since the last run.', 'check'); }, 1600); });
  }, {nav:'accuracy', perm:'accuracy.manage'});
})();
