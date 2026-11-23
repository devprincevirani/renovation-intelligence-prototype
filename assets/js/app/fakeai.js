/* App: the pretend photo reading for the prototype (Sam's meeting, Nov 2026).
   Every answer is worked out from the house and the room, never at random, so a rehearsal and the live demo
   give the same result. The product replaces this one file with the real photo service, keeping these calls:
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
