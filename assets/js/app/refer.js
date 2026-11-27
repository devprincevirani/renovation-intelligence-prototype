/* App: Refer and earn (business model v1.0, section 3). Written so a first-time visitor understands it at a glance:
   1. What they get, in big numbers, with their link right there to copy or send.
   2. Their credit in plain words: ready to use, on its way, earned so far.
   3. How it works: four steps on one line, and a worked example with real amounts.
   4. Each friend they referred, with a step bar and one sentence saying what happens next.
   5. Common questions instead of a terms list.
   Logic and sample data: assets/js/referral.js. */
(function(){
  var RI = window.RI, A = RI.App, Ref = RI.Ref;
  if(!Ref) return;
  var date = function(t){ return new Date(t).toLocaleDateString('en-US', {month:'short', day:'numeric'}); };
  /* Demo steps, for the team: move a referral forward as if the friend paid, waited or asked for a refund */
  var DEMO = {signed:[['buy-report', 'Buys a report'], ['start-pro', 'Starts Pro']], pending:[['hold-ends', 'Refund check ends'], ['refund', 'Asks for a refund']],
    pending_pro:[['pro-paid', 'Pays next month'], ['refund', 'Leaves Pro']]};

  A.route('/refer', function(view){
    var s = A.me(), st = Ref.settings(), pre = RI.mode() === 'prelaunch', O = RI.OFFERS;
    if(!st.on){
      view.innerHTML = '<div class="app-wrap"><div class="empty"><div class="mark bronze">' + RI.icon('share') + '</div><h1>Referrals are paused for now</h1><p class="muted">Credit you already earned stays in your account and still comes off your next report.</p><a class="btn btn-primary" href="#/houses">Go to my houses</a></div></div>';
      return;
    }
    var list = Ref.mine(s.email), link = Ref.link(s.email), code = Ref.codeFor(s.email);
    var ready = Ref.balance(s.email), coming = Ref.pending(s.email), earned = Ref.earned(s.email);
    var nComing = list.filter(function(r){ return ['pending', 'pending_pro', 'approval'].indexOf(r.status) > -1; }).length;
    var nDone = list.filter(function(r){ return r.status === 'credited'; }).length;
    var months = st.proPayments === 1 ? 'one month' : st.proPayments + ' months';

    /* One friend: where they are on the way to the reward, and what happens next, in a sentence */
    function friend(r){
      var pro = r.track === 'pro', amt = pro ? st.pro : st.report, got = r.reward || amt;
      var labels = pro ? ['Signed up', 'Joined Pro', st.proPayments > 1 ? 'Paid ' + months : 'First payment', 'You get $' + got] : ['Signed up', 'Bought a report', 'Refund check', 'You get $' + got];
      var done = {signed:1, pending:2, pending_pro:2, approval:3, credited:4}[r.status];
      var stop = {blocked:0, void:2, reversed:3}[r.status];
      var bar = labels.map(function(l, i){
        var c = stop != null ? (i < stop ? 'done' : i === stop ? 'stop' : '') : (i < done ? 'done' : i === done ? 'now' : '');
        return '<li class="' + c + '"><span>' + l + '</span></li>';
      }).join('');
      var next = {
        signed:'Signed up on ' + date(r.at) + '. When they buy a report, $' + st.report + ' is on its way to you.',
        pending:'Bought a report. Your $' + amt + ' arrives on ' + date(Ref.qualifiesAt(r)) + ', once the refund check is over.',
        pending_pro:'On Pro, ' + (r.payments || 1) + ' of ' + st.proPayments + ' months paid. Your $' + amt + ' comes after month ' + st.proPayments + '.',
        approval:'All done on their side. We are checking it, and your $' + amt + ' arrives soon.',
        credited:'$' + got + ' was added to your account on ' + date(r.creditedAt) + '.',
        void:pro ? 'They left Pro before month ' + st.proPayments + ', so there is no reward this time.' : 'The report was refunded, so there is no reward this time.',
        reversed:'The purchase was refunded after your credit was added, so the credit was taken back.',
        blocked:'This sign up does not count. It looks like a second account of your own.'
      }[r.status];
      var money = r.status === 'credited' ? '<span class="rr-amt got">+$' + got + '</span>' :
        ['pending', 'pending_pro', 'approval'].indexOf(r.status) > -1 ? '<span class="rr-amt">$' + amt + '<small>on its way</small></span>' :
        r.status === 'signed' ? '<span class="rr-amt wait">$' + st.report + '<small>if they buy</small></span>' : '<span class="rr-amt none">$0</span>';
      var demo = RI.devTools && DEMO[r.status] ? '<div class="rr-demo"><span>Demo</span>' + DEMO[r.status].map(function(a){ return '<button type="button" class="linkbtn small" data-act="' + a[0] + '" data-id="' + r.id + '">' + a[1] + '</button>'; }).join('') + '</div>' : '';
      var tone = r.status === 'credited' ? ' is-done' : stop != null ? ' is-stop' : '';
      return '<li class="rr-f' + tone + '"><div class="rr-fh"><span class="rr-av" aria-hidden="true">' + r.referee.charAt(0).toUpperCase() + '</span>' +
        '<span class="rr-who"><b>' + RI.esc(Ref.mask(r.referee)) + '</b><small>' + (pro ? 'Professional, Pro plan' : r.track ? 'Report' : 'No purchase yet') + '</small></span>' + money + '</div>' +
        '<ol class="rr-bar" aria-label="Progress">' + bar + '</ol><p class="rr-next">' + next + '</p>' + demo + '</li>';
    }

    var tile = function(cls, label, value, note){ return '<div class="rr-b' + cls + '"><span class="rr-bl">' + label + '</span><b class="rr-bv">$' + value + '</b><span class="rr-bn">' + note + '</span></div>'; };
    var faq = function(q, a){ return '<details class="rr-q"><summary>' + q + RI.icon('chev', 'i-sm') + '</summary><p>' + a + '</p></details>'; };

    view.innerHTML = '<div class="app-wrap narrow-wrap rr">' +
      (pre ? '<div class="notice notice-warn rr-pre">' + RI.icon('info') + '<span>Before launch, sign up is closed, so your link opens the waitlist. Rewards start when sign up opens.' + (RI.devTools ? ' To try the link now, switch to After launch in Demo access.' : '') + '</span></div>' : '') +

      /* 1. What you get, and your link */
      '<section class="rr-hero" aria-labelledby="rr-h">' +
        '<h1 class="rr-k" id="rr-h">Refer and earn</h1><p class="rr-title">Share your link. Earn credit when friends buy.</p>' +
        '<div class="rr-offers">' +
          '<div class="rr-offer"><b>$' + st.report + '</b><span>for each friend who buys a <span class="nowrap">$' + O.price + ' report</span></span></div>' +
          '<div class="rr-offer"><b>$' + st.pro + '</b><span>for each professional who stays on Pro for ' + months + '</span></div></div>' +
        '<div class="rr-share"><label for="rf-link">Your link</label>' +
          '<div class="rr-link"><input class="input" id="rf-link" readonly value="' + RI.esc(link) + '"><button type="button" class="btn btn-primary" id="rf-copy">' + RI.icon('share', 'i-sm') + '<span id="rf-copy-t">Copy link</span></button></div>' +
          '<div class="rr-send">' +
            '<span class="rr-code">Or give them your code <b>' + code + '</b></span></div></div>' +
      '</section>' +

      /* 2. Your credit */
      '<section class="rr-bal" aria-label="Your credit">' +
        tile(' main', 'Ready to use', ready, ready ? 'Comes off your next report at checkout' : 'Nothing yet. Share your link to start.') +
        tile('', 'On its way', coming, nComing ? 'From ' + nComing + (nComing === 1 ? ' friend' : ' friends') + ', not final yet' : 'Nothing on its way yet') +
        tile('', 'Earned so far', earned, nDone + (nDone === 1 ? ' reward' : ' rewards') + ' in total') + '</section>' +

      /* 3. How it works */
      '<section class="acc-card-s rr-how-s" aria-labelledby="rr-how-t"><h2 id="rr-how-t">How it works</h2>' +
        '<ol class="rr-how">' +
          '<li><span class="rr-ic">' + RI.icon('share') + '</span><b>Share your link</b><span>Send it to a friend who is planning a renovation.</span></li>' +
          '<li><span class="rr-ic">' + RI.icon('user') + '</span><b>They sign up</b><span>They make a free account from your link. It has to be their first account.</span></li>' +
          '<li><span class="rr-ic">' + RI.icon('file') + '</span><b>They buy a report</b><span>A $' + O.price + ' report. A professional counts after ' + months + ' on Pro.</span></li>' +
          '<li><span class="rr-ic">' + RI.icon('check') + '</span><b>You get credit</b><span>$' + st.report + ' or $' + st.pro + ' is added to your account' + (st.holdDays ? ' ' + st.holdDays + ' days later, if there is no refund' : '') + '.</span></li></ol>' +
        '<div class="rr-eg"><span class="rr-eg-k">Example</span><p>Kim signs up with your link and buys a report.' + (st.holdDays ? ' ' + st.holdDays + ' days later, with no refund,' : ' Right after,') + ' <b>$' + st.report + '</b> is added to your account. Your next report costs <b>$' + Math.max(0, O.price - st.report) + '</b> instead of $' + O.price + '.</p></div>' +
      '</section>' +

      /* 4. Your friends */
      '<section class="acc-card-s" aria-labelledby="rr-fr-t"><div class="rr-lh"><h2 id="rr-fr-t">Your friends</h2><span>' + list.length + (list.length === 1 ? ' person' : ' people') + '</span></div>' +
        (list.length ? '<ul class="rr-list">' + list.map(friend).join('') + '</ul>' :
          '<div class="rr-empty">' + RI.icon('user') + '<p><b>No friends here yet.</b> When someone signs up with your link, you can follow them here, step by step.</p></div>') +
      '</section>' +

      /* 5. Common questions */
      '<section class="acc-card-s" aria-labelledby="rr-q-t"><h2 id="rr-q-t">Common questions</h2><div class="rr-qs">' +
        faq('When do I get my credit?', st.holdDays ? st.holdDays + ' days after your friend buys a report, so a refund can still cancel it. For a professional, after their ' + (st.proPayments === 1 ? 'first' : st.proPayments + ' monthly') + ' payment' + (st.proPayments === 1 ? '' : 's') + '. We check each reward before it is added.' : 'Right after your friend buys a report. For a professional, after ' + months + ' on Pro.') +
        faq('Where do I use my credit?', 'At checkout. It comes off your next report by itself, and you can untick it there if you want to keep it for later.') +
        faq('Who counts as a friend?', 'Someone new to Renovation Intelligence who signs up from your link or with your code. Each person counts once.') +
        faq('What if my friend gets a refund?', 'Then there is no reward. If the credit was already added, it is taken back.') +
        faq('Can I get cash instead?', 'No. Rewards are account credit only, and they cannot be swapped for money.') +
        faq('Can I refer myself?', 'No. A second account of your own does not count.') +
      '</div><p class="rr-fine"><span class="state state-sample">Proposed</span> The amounts and rules are proposed launch settings, subject to business and legal approval.</p></section>' +
    '</div>';

    var input = view.querySelector('#rf-link'), label = view.querySelector('#rf-copy-t');
    input.addEventListener('focus', function(){ input.select(); });
    view.querySelector('#rf-copy').addEventListener('click', function(){
      var done = function(){ label.textContent = 'Copied'; RI.toast('Link copied. Paste it in a message to a friend.', 'check'); setTimeout(function(){ label.textContent = 'Copy link'; }, 2200); };
      var fallback = function(){ input.focus(); input.select(); RI.toast('Link selected. Press Cmd or Ctrl and C to copy it.', 'info'); };
      if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(input.value).then(done, fallback); else fallback();
    });
    /* On the list, which each render draws anew, so the handler is never added twice */
    var ul = view.querySelector('.rr-list');
    if(ul) ul.addEventListener('click', function(e){
      var b = e.target.closest('[data-act]'); if(!b) return;
      var r = Ref.act(b.getAttribute('data-id'), b.getAttribute('data-act'), 'demo');
      if(r) RI.toast(Ref.mask(r.referee) + ': ' + Ref.STATUS[r.status][0], 'check');
      A.render();
    });
  }, {nav:'refer'});
})();
