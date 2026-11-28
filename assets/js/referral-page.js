/* Public Referral program page (referral/, redesigned Nov 28). The amounts and timings follow the program's settings,
   the same ones the app's Refer and earn screen and the console's Referrals screen use (RI.Ref.settings(),
   referral.js). The page's HTML holds the default figures, so it still reads right without this script.
   - [data-ref="report|pro|months|pay|hold-line|hold-sentence"] are filled in here.
   - The example line is sized to the credit's share of the next report and draws once when it comes into view.
   - The waitlist or "Get your referral link" buttons follow the site state through site.js (data-when).
   - When the program is switched off in the console, a paused notice shows and the link buttons hide.
   Prototype only: the settings live in this browser. */
(function(){
  var RI = window.RI, doc = document;
  if(!RI || !RI.Ref) return;
  var s = RI.Ref.settings(), price = (RI.OFFERS && RI.OFFERS.price) || 50;
  var v = {
    report:'$' + s.report,
    pro:'$' + s.pro,
    months:s.proPayments === 1 ? 'one month' : s.proPayments + ' months',
    pay:'$' + Math.max(0, price - s.report),
    'hold-line':s.holdDays ? 'Added ' + s.holdDays + ' days later, if there is no refund.' : 'Added once the purchase goes through.',
    'hold-sentence':s.holdDays ? 'Credit arrives ' + s.holdDays + ' days after the purchase' : 'Credit arrives once the purchase goes through'
  };
  doc.querySelectorAll('[data-ref]').forEach(function(el){ var k = el.getAttribute('data-ref'); if(k in v) el.textContent = v[k]; });

  /* The example line: the credit's share of the next report */
  var line = doc.getElementById('rpg-line');
  if(line){
    line.style.setProperty('--w', Math.min(100, Math.max(8, s.report / price * 100)) + '%');
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window){
      line.classList.add('wait');
      var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ line.classList.remove('wait'); io.disconnect(); } }); }, {threshold:.6});
      io.observe(line);
    }
  }

  if(!s.on){
    var n = doc.getElementById('rpg-paused'); if(n) n.hidden = false;
    /* site.js shows or hides data-when buttons by site state; keep the link buttons hidden while paused */
    doc.querySelectorAll('.rpg-get').forEach(function(a){ a.removeAttribute('data-when'); a.hidden = true; });
  }
})();
