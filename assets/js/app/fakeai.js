/* App: the pretend photo reading for the prototype (Sam's meeting, Nov 2026).
   Every answer is worked out from the house and the room, never at random, so a rehearsal and the live demo
   give the same result. The product replaces this one file with the real photo service, keeping these calls:
     A.AI.readPhoto(p, rooms, h) ->  {room, conf, alts}: the room a photo shows, or null when not sure
     A.AI.sizeFor(h, key, type)  ->  {l, w} in feet, or null when the photos cannot size the room
   Nothing on screen knows the answers are made up; the screens label them as estimates. */
(function(){
  var RI = window.RI, A = RI.App;
  A.AI = A.AI || {};

  /* How long "Measuring from your photos" shows, in milliseconds */
  A.AI.MEASURE_MS = 1400;

  /* A typical size per kind of room, in feet [shorter side, longer side] */
  var BASE = {
    kitchen:[12,14], living:[14,18], family:[14,16], dining:[11,13], bedrooms:[11,12], bedroom:[11,12],
    hallbath:[5,8], 'primary-bath':[8,10], 'secondary-bath':[5,8], basement:[20,26], office:[10,11],
    laundry:[6,8], mudroom:[6,8], hallway:[4,14], attic:[12,20], mechanical:[8,10], garage:[20,22]
  };
  /* Rooms the photos never size in this demo, so the screen can show that case: a half bath is too tight for a wide photo */
  var NONE = {halfbath:true, 'half-bath':true};

  function seed(s){ var n = 0; for(var i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) % 9973; return n; }

  /* ---------- Which room a photo shows ----------
     A.AI.readPhoto(p, rooms, h) -> {room, conf, alts}: room is null when not sure; alts are the three best rooms.
     A team sample photo carries its room in p.demo ('?' = not sure on purpose). Otherwise words in the file name
     decide (kitchen, vanity, bed...); a camera name like IMG_4101 gives a weak guess, still shown as Suggested,
     and about one photo in eight comes back not sure, so the screen shows that case too. */
  var NAME = [[/kitchen|cabinet|counter|backsplash|pantry|fridge|stove/i,'kitchen'],[/half/i,'halfbath'],[/bath|vanity|toilet|tub|shower/i,'hallbath'],
    [/bed/i,'bedrooms'],[/living|family|lounge|sofa/i,'living'],[/dining/i,'dining'],[/basement|cellar/i,'basement'],[/laundry|washer|dryer/i,'laundry'],
    [/office|study/i,'office'],[/garage/i,'garage'],[/exterior|front|street|yard|outside|porch|roof|house/i,'exterior']];
  A.AI.readMs = function(p){ return 700 + seed(String(p.name || '') + (p.hash || '')) % 800; };
  /* The room of that kind with the fewest photos, so three bedroom photos spread over the bedrooms */
  function roomOfType(type, rooms, h){
    var best = null, bn = 1e9;
    rooms.forEach(function(r){ if((r[2] || r[0]) !== type && r[0] !== type) return; var n = A.photoCount(h, r[0]); if(n < bn){ best = r[0]; bn = n; } });
    return best;
  }
  A.AI.readPhoto = function(p, rooms, h){
    var cand = rooms.filter(function(r){ return r[0] !== 'other'; }), sd = seed(String(p.name || '') + (p.hash || '') + (p.demo || ''));
    var guess = null, i;
    if(p.demo) guess = p.demo === '?' ? null : roomOfType(p.demo, cand, h);
    else for(i = 0; i < NAME.length && !guess; i++){ if(NAME[i][0].test(p.name || '')) guess = roomOfType(NAME[i][1], cand, h); }
    var alts = [];
    function add(k){ if(k && alts.indexOf(k) < 0 && alts.length < 3) alts.push(k); }
    add(guess); (p.demoAlts || []).forEach(function(t){ add(roomOfType(t, cand, h)); });
    cand.forEach(function(r){ if(!A.photoCount(h, r[0])) add(r[0]); }); cand.forEach(function(r){ add(r[0]); });
    if(p.demo === '?' || (!p.demo && !guess && sd % 8 === 0)) return {room:null, conf:.4, alts:alts};
    if(guess) return {room:guess, conf:.9, alts:alts};
    var fb = cand[sd % cand.length][0];
    return {room:fb, conf:.6, alts:[fb].concat(alts.filter(function(x){ return x !== fb; })).slice(0, 3)};
  };

  A.AI.sizeFor = function(h, key, type){
    type = type || key;
    if(NONE[type]) return null;
    var b = BASE[type]; if(!b) return null;
    /* Bigger houses have bigger rooms, within limits; each room moves a foot either way so they do not all match */
    var sq = +((h.facts || {}).sqft) || 1686, k = Math.max(.85, Math.min(1.25, Math.sqrt(sq / 1686))), j = seed(String(h.id || '') + key) % 3 - 1;
    var a = Math.round(b[0] * k) + (j > 0 ? 1 : 0), c = Math.round(b[1] * k) + (j < 0 ? 1 : 0);
    return {l:Math.min(a, c), w:Math.max(a, c)};
  };
})();
