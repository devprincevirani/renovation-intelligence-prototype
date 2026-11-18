/* Signed-in preview pages. The full user dashboard (phase 2) and admin console (phase 3) replace these. */
(function(){
  var RI = window.RI, doc = document, box = doc.getElementById('preview'), scope = box.getAttribute('data-scope'), s = RI.session();
  if(!s){
    box.innerHTML = '<div class="mark bronze">' + RI.icon('lock') + '</div><h1>Log in to continue</h1><p class="muted">This area is for signed-in ' + (scope === 'admin' ? 'staff' : 'users') + '.</p><div class="cta-row"><a class="btn btn-primary" href="../login/">Log in</a><button type="button" class="linkbtn" data-open-demo>Use demo access</button></div>';
    return;
  }
  if(scope === 'admin' && s.role !== 'admin' && s.role !== 'staff'){
    box.innerHTML = '<div class="mark bronze">' + RI.icon('lock') + '</div><h1>This area is for staff</h1><p class="muted">You are logged in as ' + RI.esc(s.name) + '. The console is only for Sam and his staff.</p><a class="btn btn-primary" href="../app/">Open my houses</a>';
    return;
  }
  if(scope === 'user' && s.role === 'admin'){ location.replace('../admin/'); return; }
  var isAdmin = s.role === 'admin' || s.role === 'staff';
  var next = isAdmin
    ? ['Analytics and the funnel view','Every property and its runs','Decision tree with grading at every node','Rules, products and rates, with the publish queue','Staff invites and permissions','Back-tests and their reports']
    : ['My houses: list, search and filters','The intake wizard with photo upload by room','House status while the run works','Price by package: Essential, Standard and Premium','The full presentation: rooms, items on and off, share and PDF'].concat(s.role === 'builder' ? ['Builder resources: task lists and scope documents'] : []);
  box.innerHTML = '<div class="cta-row" style="gap:8px"><span class="tag-proto">Next phase</span><span class="state state-guidance">Logged in as ' + RI.esc(s.type) + '</span></div>' +
    '<h1>' + (isAdmin ? 'The console comes in phase 3' : 'Your dashboard comes in phase 2') + '</h1>' +
    '<p class="muted">You are logged in as <b>' + RI.esc(s.name) + '</b> (' + RI.esc(s.email) + '). The public website is ready for review first; once it is approved, this screen becomes:</p>' +
    '<ul class="ticks">' + next.map(function(n){ return '<li>' + RI.icon('check') + '<span>' + n + '</span></li>'; }).join('') + '</ul>' +
    '<div class="cta-row"><a class="btn btn-primary" href="../sample/">See the sample presentation</a><button type="button" class="btn btn-secondary" data-logout>Log out</button></div>';
})();
