/* Console: Referrals (business model v1.0, section 3). Who referred whom, the rewards waiting for Sam, and the
   program settings. Logic and sample data: assets/js/referral.js. Approving, taking back and the settings are Sam's. */
(function(){
  var RI = window.RI, C = RI.Con, Ref = RI.Ref, doc = document;
  if(!Ref) return;
  var LB = {off:'lb-off', work:'lb-info', ok:'lb-pub', bad:'lb-bad'};
  var GROUP = {review:['approval'], onway:['signed', 'pending', 'pending_pro'], credited:['credited'], none:['void', 'reversed', 'blocked']};
  var TRACK = {report:'Report, $' + RI.OFFERS.price, pro:'Pro plan, $' + RI.OFFERS.pro.price + ' a month'};

  C.route('/referrals', function(view){
    var m = C.me() || {}, isSam = !!m.sam, st = {g:'all', q:''};

    function render(){
      var s = Ref.settings(), all = Ref.all().slice().sort(function(a, b){ return b.at - a.at; });
      var of = function(g){ return all.filter(function(r){ return GROUP[g].indexOf(r.status) > -1; }); };
      var sum = function(list){ return list.reduce(function(t, r){ return t + Ref.rewardFor(r); }, 0); };
      var review = of('review'), onway = of('onway'), credited = of('credited'), none = of('none');
      var rows = all.filter(function(r){ return (st.g === 'all' || GROUP[st.g].indexOf(r.status) > -1) && (!st.q || (r.referrer + ' ' + Ref.nameOf(r.referrer) + ' ' + r.referee).toLowerCase().indexOf(st.q) > -1); });
      var kpi = function(g, label, list, note, key){
        return '<button type="button" class="ov-k' + (key ? ' key' : '') + '" data-g="' + g + '" aria-pressed="' + (st.g === g) + '"><span class="ov-kl">' + label + '</span><span class="ov-kv">' + list.length + (g !== 'none' ? '<small>$' + sum(list) + '</small>' : '') + '</span><span class="ov-kc">' + note + '</span></button>';
      };
      var act = function(r){
        if(!isSam) return '';
        if(r.status === 'approval') return '<span class="refc-acts"><button type="button" class="us-act" data-do="approve" data-id="' + r.id + '">' + RI.icon('check', 'i-sm') + 'Approve</button><button type="button" class="us-act us-act-danger" data-do="reject" data-id="' + r.id + '">' + RI.icon('x', 'i-sm') + 'Reject</button></span>';
        if(r.status === 'credited') return '<button type="button" class="us-act us-act-danger" data-do="reverse" data-id="' + r.id + '">' + RI.icon('refresh', 'i-sm') + 'Take back</button>';
        return '';
      };
      var k = function(r){ return Ref.STATUS[r.status]; };
      var off = isSam ? '' : ' disabled';
      /* A number with a minus and a plus beside it; the unit sits right next to the value */
      var step = function(id, label, help, v, min, max, pre, suf){
        return '<div class="field refc-fld"><div class="refc-fl"><label for="' + id + '">' + label + '</label><small>' + help + '</small></div>' +
          '<div class="refc-stp"><button type="button" class="refc-sb" data-step="-1" data-for="' + id + '" aria-label="Lower: ' + label + '"' + off + '>' + RI.icon('minus', 'i-sm') + '</button>' +
          '<span class="refc-sv">' + (pre ? '<span class="refc-u">' + pre + '</span>' : '') + '<input id="' + id + '" type="number" inputmode="numeric" min="' + min + '" max="' + max + '" step="1" value="' + v + '"' + off + '>' + (suf ? '<span class="refc-u">' + suf + '</span>' : '') + '</span>' +
          '<button type="button" class="refc-sb" data-step="1" data-for="' + id + '" aria-label="Raise: ' + label + '"' + off + '>' + RI.icon('plus', 'i-sm') + '</button></div><span class="err"></span></div>';
      };
      var sw = function(id, on, label, cls, text){ return '<label class="switch' + (cls ? ' ' + cls : '') + '"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + off + '><span class="track"></span>' + (text ? text : '<span class="sr">' + label + '</span>') + '</label>'; };

      view.innerHTML = C.page({kicker:'Customers', title:'Referrals', sub:'Who referred whom, the rewards waiting for review, and the program settings.',
        body:
          '<div class="ov-kpis refc-kpis">' + kpi('review', 'Waiting for review', review, review.length ? 'Approve or reject each one' : 'Nothing to review', review.length > 0) +
            kpi('onway', 'On the way', onway, 'In the hold or between payments') +
            kpi('credited', 'Credited', credited, 'Account credit given') +
            kpi('none', 'No reward', none, 'Refunded, taken back or not eligible') + '</div>' +
          '<div class="c-toolbar refc-bar">' + C.seg('refc-g', [['all', 'All', all.length], ['review', 'Review', review.length], ['onway', 'On the way', onway.length], ['credited', 'Credited', credited.length], ['none', 'No reward', none.length]], st.g) +
            C.search('refc-q', 'Name or email', st.q) + '</div>' +
          '<div class="c-mt">' + C.table({cls:'refc-tbl', empty:'No referral matches. Try another name, or show all.',
            /* Five columns so it fits beside the side menu: when they signed up goes in the line under the person,
               what they bought under the reward */
            cols:[{label:'Referred person'}, {label:'Referred by'}, {label:'Status'}, {label:'Reward', num:true}, {label:''}],
            rows:rows.map(function(r){
              var amt = r.track && r.status !== 'blocked' ? Ref.rewardFor(r) : 0;
              return {cells:[
                '<b title="' + RI.esc(r.referee) + '">' + RI.esc(r.referee) + '</b><small class="refc-sub">Signed up ' + new Date(r.at).toLocaleDateString('en-US', {month:'short', day:'numeric'}) + ' · ' + RI.esc(Ref.detail(r)) + '</small>',
                '<span class="c-person">' + C.av(Ref.nameOf(r.referrer)) + '<span><b>' + RI.esc(Ref.nameOf(r.referrer)) + '</b><small>' + RI.esc(r.referrer) + '</small></span></span>',
                '<span class="lb ' + LB[k(r)[1]] + '">' + k(r)[0] + '</span>',
                '<span class="refc-amt' + (r.status === 'credited' ? ' got' : '') + '">$' + amt + '</span><small class="refc-sub">' + (r.track ? TRACK[r.track] : 'Nothing bought yet') + '</small>',
                act(r)]};
            })}) + '</div>' +
          /* Program settings: the two kinds of referral side by side, each with its numbers and the path to its reward */
          '<section class="refc-set c-mt" aria-labelledby="refc-set-t"><form id="refc-set" novalidate>' +
            '<header class="refc-set-h"><div><h2 id="refc-set-t">Program settings</h2><p>Proposed launch settings, subject to business and legal approval.</p></div>' +
              sw('refc-on', s.on, 'Referral program on', 'refc-master', '<span class="refc-ms" id="refc-state">' + (s.on ? 'Program on' : 'Program paused') + '</span>') + '</header>' +
            '<div class="refc-tracks">' +
              '<div class="refc-track"><div class="refc-tr-h"><span class="refc-tr-ic">' + RI.icon('file') + '</span><div><b>Report referral</b><small>Someone they referred buys the $' + RI.OFFERS.price + ' report</small></div></div>' +
                step('refc-report', 'Reward', 'Credit the referrer gets', s.report, 0, 100, '$', '') +
                step('refc-hold', 'Hold for refunds', 'A refund in this time cancels it', s.holdDays, 0, 60, '', 'days') +
                '<ol class="refc-path" id="refc-path-report" aria-label="How a report reward is earned"></ol></div>' +
              '<div class="refc-track"><div class="refc-tr-h"><span class="refc-tr-ic">' + RI.icon('key') + '</span><div><b>Pro referral</b><small>A professional they referred takes the $' + RI.OFFERS.pro.price + ' plan</small></div></div>' +
                step('refc-pro', 'Reward', 'Credit the referrer gets', s.pro, 0, 500, '$', '') +
                step('refc-pay', 'Payments first', 'Monthly payments before the reward', s.proPayments, 1, 12, '', s.proPayments === 1 ? 'payment' : 'payments') +
                '<ol class="refc-path" id="refc-path-pro" aria-label="How a Pro reward is earned"></ol></div>' +
            '</div>' +
            '<div class="refc-review"><span class="refc-tr-ic">' + RI.icon('shield') + '</span><div class="refc-fl"><label for="refc-approve">Sam reviews each reward</label><small>On: a reward that qualifies waits in Review until Sam approves it. Off: it is credited at once.</small></div>' +
              sw('refc-approve', s.approve, 'Sam reviews each reward') + '</div>' +
            '<footer class="refc-set-f"><p class="refc-sum" id="refc-sum" aria-live="polite"></p>' +
              (isSam ? '<div class="refc-btns" id="refc-btns" hidden><button type="button" class="btn btn-secondary btn-sm" id="refc-undo">Undo changes</button><button type="submit" class="btn btn-primary btn-sm" id="refc-save">Save settings</button></div>' : '') +
            '</footer>' +
          '</form></section>' +
          '<div class="c-mt">' + C.note('Rewards are account credit, never cash. New customers only; self-referrals, duplicates and refunded purchases earn nothing. The amounts and rules are proposed launch settings, subject to business and legal approval.') + '</div>'});
      RI.fillIcons(view);
      bind();
    }

    function bind(){
      var page = view.querySelector('.c-page');
      page.addEventListener('click', function(e){
        var g = e.target.closest('[data-g]'); if(g){ var v = g.getAttribute('data-g'); st.g = st.g === v ? 'all' : v; render(); return; }
        var sg = e.target.closest('#refc-g [data-v]'); if(sg){ st.g = sg.getAttribute('data-v'); render(); return; }
        var b = e.target.closest('[data-do]'); if(!b) return;
        var id = b.getAttribute('data-id'), r = Ref.all().filter(function(x){ return x.id === id; })[0], what = r ? Ref.nameOf(r.referrer) + ' for ' + r.referee : '';
        var go = function(action, logged, toast){ var x = Ref.act(id, action, m.name || 'Sam'); if(x){ C.log(logged, what + (x.reward ? ', $' + x.reward : ''), '', 'referrals'); RI.toast(toast, 'check'); } render(); };
        var d = b.getAttribute('data-do');
        if(d === 'approve') go('approve', 'Referral reward approved', 'Approved. The credit is in ' + Ref.nameOf(r.referrer) + '\'s account.');
        if(d === 'reject') C.confirm('Reject this reward?', RI.esc(Ref.nameOf(r.referrer)) + ' gets no credit for ' + RI.esc(r.referee) + '. The referral stays in the list as No reward.', 'Reject reward', function(){ go('reject', 'Referral reward rejected', 'Reward rejected.'); }, true);
        if(d === 'reverse') C.confirm('Take this reward back?', 'The $' + Ref.rewardFor(r) + ' credit leaves ' + RI.esc(Ref.nameOf(r.referrer)) + '\'s balance. Use this when the purchase was refunded or the referral was not real.', 'Take it back', function(){ go('reverse', 'Referral reward taken back', 'Reward taken back.'); }, true);
      });
      var q = view.querySelector('#refc-q');
      q.addEventListener('input', function(){ st.q = this.value.trim().toLowerCase(); var p = this.selectionStart; render(); var n = doc.getElementById('refc-q'); n.focus(); n.setSelectionRange(p, p); });
      /* Settings: each kind of referral shows the path to its reward with the values as they are typed.
         Undo and Save appear only when something changed */
      var form = view.querySelector('#refc-set'), saved = Ref.settings();
      var val = function(id){ return form.querySelector('#' + id); };
      var current = function(){ return {on:val('refc-on').checked, report:Number(val('refc-report').value), pro:Number(val('refc-pro').value), proPayments:Number(val('refc-pay').value), holdDays:Number(val('refc-hold').value), approve:val('refc-approve').checked}; };
      var path = function(list){ return list.filter(Boolean).map(function(t, i, all){ return '<li' + (i === all.length - 1 ? ' class="end"' : '') + '>' + t + '</li>'; }).join(''); };
      function sync(){
        var c = current(), dirty = ['on', 'report', 'pro', 'proPayments', 'holdDays', 'approve'].some(function(key){ return c[key] !== saved[key]; });
        val('refc-path-report').innerHTML = path(['Signs up', 'Buys the report', c.holdDays ? c.holdDays + '-day hold' : 'No hold', c.approve ? 'Sam reviews' : '', '+$' + (c.report || 0) + ' credit']);
        val('refc-path-pro').innerHTML = path(['Signs up', c.proPayments > 1 ? 'Pays ' + c.proPayments + ' months' : 'Pays once', c.approve ? 'Sam reviews' : '', '+$' + (c.pro || 0) + ' credit']);
        val('refc-pay').parentNode.querySelector('.refc-u').textContent = c.proPayments === 1 ? 'payment' : 'payments';
        val('refc-state').textContent = c.on ? 'Program on' : 'Program paused';
        form.classList.toggle('refc-off', !c.on);
        form.querySelectorAll('[data-step]').forEach(function(b){ var i = val(b.getAttribute('data-for')), v = Number(i.value); b.disabled = !isSam || (Number(b.getAttribute('data-step')) < 0 ? v <= Number(i.min) : v >= Number(i.max)); });
        var sum = val('refc-sum');
        sum.className = 'refc-sum' + (!isSam ? ' ro' : dirty ? ' dirty' : '');
        sum.innerHTML = !isSam ? 'Only Sam changes the settings.' : dirty ? '<span class="refc-dot" aria-hidden="true"></span>Unsaved changes' : RI.icon('check', 'i-sm') + 'All changes saved';
        if(isSam) val('refc-btns').hidden = !dirty;
      }
      form.addEventListener('input', sync); form.addEventListener('change', sync); sync();
      form.addEventListener('click', function(e){
        var b = e.target.closest('[data-step]'); if(!b || b.disabled) return;
        var i = val(b.getAttribute('data-for'));
        i.value = Math.max(Number(i.min), Math.min(Number(i.max), (Number(i.value) || 0) + Number(b.getAttribute('data-step'))));
        RI.form.setInvalid(i, null); sync();
      });
      if(isSam) val('refc-undo').addEventListener('click', function(){ render(); });
      form.addEventListener('submit', function(e){
        e.preventDefault(); if(!isSam) return;
        var ok = true, read = function(id, min, max){ var el = val(id), v = Number(el.value); var bad = !el.value || v % 1 || v < min || v > max; RI.form.setInvalid(el, bad ? 'Use a whole number from ' + min + ' to ' + max + '.' : null); if(bad) ok = false; return v; };
        var next = {on:val('refc-on').checked, report:read('refc-report', 0, 100), pro:read('refc-pro', 0, 500), proPayments:read('refc-pay', 1, 12), holdDays:read('refc-hold', 0, 60), approve:val('refc-approve').checked};
        if(!ok){ form.querySelector('.field.invalid input').focus(); return; }
        Ref.saveSettings(next);
        C.log('Referral settings changed', (next.on ? 'On' : 'Off') + '; report $' + next.report + ', Pro $' + next.pro + ' after ' + next.proPayments + ' payments; ' + next.holdDays + '-day hold; ' + (next.approve ? 'Sam reviews each reward' : 'rewards credited at once'), '', 'referrals');
        RI.toast('Referral settings saved.', 'check'); render();
      });
    }
    render();
  }, {nav:'referrals', perm:'users.view'});
})();
