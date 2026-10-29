/* Pastoral Oversight at RLCC — app logic (no framework, no build step) */
(function () {
  'use strict';

  var CFG = window.RO_CONFIG || {};
  var API = (CFG.apiUrl || '').trim();
  var DEMO = !API;
  var COURSE = window.COURSE;
  var LESSONS = COURSE.lessons;
  var app = document.getElementById('app');

  /* ---------- course lookups ---------- */
  var TOTAL = 0, ACTIONS = 0, CARD = {};
  LESSONS.forEach(function (L) {
    L.cards.forEach(function (c) {
      TOTAL++; CARD[c.id] = { c: c, L: L };
      if (c.t === 'action') ACTIONS++;
    });
  });
  function lessonById(id) { for (var i = 0; i < LESSONS.length; i++) if (LESSONS[i].id === id) return LESSONS[i]; return null; }

  var ACT = {};
  LESSONS.forEach(function (L) { L.cards.forEach(function (c) { if (c.t === 'action') ACT[L.id] = c; }); });
  function actionDone(L) { var c = ACT[L.id]; if (!c) return true; var a = st.act[c.id]; return !!(a && a.done); }
  function lessonFull(L) { return lessonDone(L) === L.cards.length && actionDone(L); }
  function unlocked(L) { if (L.id === LESSONS[0].id) return true; var p = lessonById(L.id - 1); return !p || lessonFull(p); }
  function lessonSteps(L) { var hasA = !!ACT[L.id]; return { d: lessonDone(L) + (hasA && actionDone(L) ? 1 : 0), n: L.cards.length + (hasA ? 1 : 0) }; }
  function allFull() { return LESSONS.every(lessonFull); }
  function completedAt() {
    var m = 0, k;
    for (k in st.done) if (st.done[k] > m) m = st.done[k];
    for (k in st.act) if (st.act[k].done && st.act[k].done > m) m = st.act[k].done;
    return m;
  }

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function md(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .split(/\n\n/).map(function (p) { return '<p>' + p.replace(/\n/g, '<br>') + '</p>'; }).join('');
  }
  function iso(d) { var m = d.getMonth() + 1, day = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day; }
  function todayISO() { return iso(new Date()); }
  function plusDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return iso(d); }
  function fmtDate(s) { if (!s) return ''; var d = new Date(s + 'T00:00:00'); return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
  function jget(store, key, def) { try { var v = store.getItem(key); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function jset(store, key, val) { try { store.setItem(key, JSON.stringify(val)); } catch (e) { } }
  function key(p, e) { return 'ro_' + p + '_' + e; }
  function firstName(n) { return String(n || '').trim().split(/\s+/)[0] || ''; }

  var I = {
    check: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
    lock: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>',
    eye: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>'
  };

  /* ---------- state ---------- */
  var sess = null, st = null, pend = null, syncTimer = null, syncing = false, syncMsg = '';
  var view = { lesson: null, idx: 0, phase: 'intro' };

  function emptyState() { return { done: {}, ans: {}, act: {} }; }
  function emptyPend() { return { done: {}, ans: {}, act: {} }; }
  function isEmpty(p) { return !Object.keys(p.done).length && !Object.keys(p.ans).length && !Object.keys(p.act).length; }

  function merge(a, b) {
    var o = emptyState();
    [a, b].forEach(function (s) {
      if (!s) return;
      var k;
      for (k in (s.done || {})) if (CARD[k] && (!o.done[k] || s.done[k] < o.done[k])) o.done[k] = s.done[k];
      ['ans', 'act'].forEach(function (f) {
        for (k in (s[f] || {})) {
          if (!CARD[k]) continue;
          var x = s[f][k];
          if (!o[f][k] || (x.ts || 0) >= (o[f][k].ts || 0)) o[f][k] = x;
        }
      });
    });
    return o;
  }
  function diff(local, remote) {
    var p = emptyPend(), k;
    remote = remote || emptyState();
    for (k in local.done) if (!remote.done[k]) p.done[k] = local.done[k];
    ['ans', 'act'].forEach(function (f) {
      for (k in local[f]) if (!remote[f][k] || (local[f][k].ts || 0) > (remote[f][k].ts || 0)) p[f][k] = local[f][k];
    });
    return p;
  }
  function saveLocal() {
    if (!sess) return;
    jset(localStorage, key('state', sess.email), st);
    jset(localStorage, key('pend', sess.email), pend);
  }
  function summary() {
    var done = 0, aC = 0, aD = 0, ld = 0;
    LESSONS.forEach(function (L) {
      L.cards.forEach(function (c) {
        if (st.done[c.id]) done++;
        if (c.t === 'action') { var a = st.act[c.id]; if (a && a.at) aC++; if (a && a.done) aD++; }
      });
      if (lessonFull(L)) ld++;
    });
    var steps = done + aD, total = TOTAL + ACTIONS, nl = nextLesson();
    return {
      course: COURSE.id, cardsDone: done, totalCards: TOTAL, stepsDone: steps, totalSteps: total, percent: Math.round(steps / total * 100),
      lessonsDone: ld, totalLessons: LESSONS.length, actionsCommitted: aC, actionsDone: aD, totalActions: ACTIONS,
      next: nl ? { id: nl.id, title: nl.title, pending: lessonDone(nl) === nl.cards.length && !actionDone(nl) } : null
    };
  }
  function lessonDone(L) { var n = 0; L.cards.forEach(function (c) { if (st.done[c.id]) n++; }); return n; }
  function firstUndone(L) { for (var i = 0; i < L.cards.length; i++) if (!st.done[L.cards[i].id]) return i; return 0; }

  function touch(f, id, val) { val.ts = Date.now(); st[f][id] = val; pend[f][id] = val; saveLocal(); queueSync(); }
  function markDone(id) {
    if (st.done[id]) return;
    var ts = Date.now(); st.done[id] = ts; pend.done[id] = ts; saveLocal(); queueSync();
  }

  /* ---------- server ---------- */
  function api(action, body, opts) {
    opts = opts || {};
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, opts.timeout || 30000);
    body = body || {}; body.action = action;
    return fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body), signal: ctrl ? ctrl.signal : undefined, keepalive: !!opts.keepalive
    }).then(function (r) { return r.json(); }).then(function (j) { clearTimeout(t); return j; }, function (e) { clearTimeout(t); throw e; });
  }
  function setSync(m) { syncMsg = m; var el = document.getElementById('sync'); if (el) { el.textContent = syncLabel(); el.className = 'sync' + (m === 'offline' ? ' warn' : ''); } }
  function syncLabel() {
    if (DEMO) return 'Preview mode';
    return { saving: 'Saving…', saved: 'Saved', offline: 'Offline. Will retry.' }[syncMsg] || '';
  }
  function queueSync(now) { if (DEMO) return; clearTimeout(syncTimer); syncTimer = setTimeout(function () { flush(); }, now ? 0 : 1500); }
  function flush(keep) {
    if (DEMO || !sess || syncing || isEmpty(pend)) return Promise.resolve();
    syncing = true; setSync('saving');
    var snap = JSON.parse(JSON.stringify(pend)), labels = {};
    ['ans', 'act'].forEach(function (f) {
      for (var id in snap[f]) {
        var m = CARD[id];
        if (m && (m.c.t === 'reflect' || m.c.t === 'action')) labels[id] = { l: m.L.id, t: m.c.t, p: m.c.title };
      }
    });
    return api('save', { token: sess.token, delta: snap, summary: summary(), labels: labels }, { keepalive: keep }).then(function (r) {
      syncing = false;
      if (!pend) return;
      if (r && r.ok) {
        ['done', 'ans', 'act'].forEach(function (f) {
          for (var id in snap[f]) {
            var cur = pend[f][id];
            if (f === 'done' ? cur === snap[f][id] : (cur && cur.ts === snap[f][id].ts)) delete pend[f][id];
          }
        });
        saveLocal(); setSync('saved');
        if (!isEmpty(pend)) queueSync();
      } else if (r && r.error === 'session') {
        logout('Your session ended. Please log in again.');
      } else { throw new Error('save'); }
    }).catch(function () { syncing = false; setSync('offline'); clearTimeout(syncTimer); syncTimer = setTimeout(function () { flush(); }, 15000); });
  }

  /* ---------- auth ---------- */
  function sha(s) {
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) {
        return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
      });
    }
    return Promise.resolve(btoa(unescape(encodeURIComponent(s))));
  }
  function demoAuth(mode, f) {
    var users = jget(localStorage, 'ro_demo_users', {});
    var em = f.email.toLowerCase();
    return sha(em + '|' + f.password).then(function (h) {
      if (mode === 'register') {
        if (users[em]) return { ok: false, error: 'This email is already registered. Log in instead.' };
        users[em] = { name: f.name, h: h }; jset(localStorage, 'ro_demo_users', users);
        return { ok: true, name: f.name, email: em, token: 'demo' };
      }
      var u = users[em];
      if (!u || u.h !== h) return { ok: false, error: 'Email or password is incorrect.' };
      return { ok: true, name: u.name, email: em, token: 'demo' };
    });
  }
  function startSession(remote) {
    var local = jget(localStorage, key('state', sess.email), null);
    st = merge(local, remote);
    var stored = jget(localStorage, key('pend', sess.email), emptyPend());
    pend = emptyPend();
    var d = diff(st, remote);
    [stored, d].forEach(function (p) { ['done', 'ans', 'act'].forEach(function (f) { for (var k in p[f]) if (CARD[k]) pend[f][k] = p[f][k]; }); });
    saveLocal();
    if (!DEMO) queueSync(true);
  }
  function logout(msg) {
    var p = flush(true) || Promise.resolve();
    try { sessionStorage.removeItem('ro_sess'); } catch (e) { }
    sess = null; st = null; pend = null; view = { lesson: null, idx: 0, phase: 'intro' };
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    render(msg ? { err: msg } : null);
    return p;
  }

  /* ---------- views ---------- */
  function header(right) {
    return '<header class="top"><a class="brand" href="#/" aria-label="Pastoral Oversight home"><img src="assets/logo.png" alt="Real Life Christian Communities" width="200" height="22"></a><div class="top-r">' + (right || '') + '</div></header>';
  }

  function viewAuth(o) {
    o = o || {};
    var mode = o.mode || 'login';
    var reg = mode === 'register';
    app.innerHTML =
      '<main class="auth">' +
      '<div class="auth-hero"><img class="auth-logo" src="assets/logo-white.png" alt="Real Life Christian Communities" width="260" height="29">' +
      '<h1>Pastoral Oversight</h1>' +
      '<p>From running ministry to raising leaders. A short, practical path for our pastoral staff in 2027.</p></div>' +
      '<section class="auth-card" aria-labelledby="authh">' +
      '<div class="tabs" role="tablist"><button role="tab" aria-selected="' + !reg + '" data-a="mode" data-m="login">Log in</button><button role="tab" aria-selected="' + reg + '" data-a="mode" data-m="register">Create account</button></div>' +
      '<h2 id="authh" class="sr">' + (reg ? 'Create your account' : 'Log in') + '</h2>' +
      (DEMO ? '<p class="demo">Preview mode: accounts and progress are saved on this device only.</p>' : '') +
      '<form id="authform" novalidate>' +
      (reg ? '<label>Full name<input name="name" autocomplete="name" required maxlength="80"></label>' : '') +
      '<label>Email<input name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" required maxlength="120"></label>' +
      '<label>Password<span class="pw"><input name="password" type="password" autocomplete="' + (reg ? 'new-password' : 'current-password') + '" required minlength="8" maxlength="100"><button type="button" class="eye" data-a="eye" aria-label="Show password">' + I.eye + '</button></span></label>' +
      (reg ? '<p class="hint">At least 8 characters.</p>' : '') +
      '<div id="coderow"' + (o.needCode ? '' : ' hidden') + '><label>Staff access code<input name="code" autocomplete="off" maxlength="60"></label></div>' +
      '<p id="autherr" class="err" role="alert">' + esc(o.err || '') + '</p>' +
      '<button class="btn primary block" id="authgo" type="submit">' + (reg ? 'Create account' : 'Log in') + '</button>' +
      (reg ? '<p class="fine">Your progress and written responses are saved in RLCC’s learning records.</p>' : '<p class="fine">You will log in each time you open the tool.</p>') +
      '</form></section></main>';
    var form = document.getElementById('authform');
    form.addEventListener('submit', function (e) { e.preventDefault(); submitAuth(mode, form); });
    var first = form.querySelector('input'); if (first && !('ontouchstart' in window)) first.focus();
  }

  function submitAuth(mode, form) {
    var err = document.getElementById('autherr'), btn = document.getElementById('authgo');
    var f = {
      name: (form.name ? form.name.value : '').trim(), email: form.email.value.trim().toLowerCase(),
      password: form.password.value, code: form.code ? form.code.value.trim() : ''
    };
    err.textContent = '';
    if (mode === 'register' && f.name.length < 2) { err.textContent = 'Enter your full name.'; form.name.focus(); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) { err.textContent = 'Enter a valid email address.'; form.email.focus(); return; }
    if (f.password.length < 8) { err.textContent = 'Your password needs at least 8 characters.'; form.password.focus(); return; }
    btn.disabled = true; btn.textContent = mode === 'register' ? 'Creating account…' : 'Logging in…';
    var p = DEMO ? demoAuth(mode, f) : api(mode, f);
    p.then(function (r) {
      if (!r || !r.ok) {
        if (r && r.needCode) { document.getElementById('coderow').hidden = false; form.code.focus(); }
        throw new Error((r && r.error) || 'Something went wrong. Please try again.');
      }
      sess = { token: r.token, name: r.name, email: r.email, remind: r.remind !== false };
      jset(sessionStorage, 'ro_sess', sess);
      startSession(r.state);
      location.hash = '#/'; render();
    }).catch(function (e) {
      btn.disabled = false; btn.textContent = mode === 'register' ? 'Create account' : 'Log in';
      err.textContent = e && e.name === 'AbortError' ? 'The server took too long to respond. Check your connection and try again.' :
        (e && e.message && e.message !== 'Failed to fetch' ? e.message : 'Could not reach the server. Check your connection and try again.');
    });
  }

  /* ----- home ----- */
  function nextLesson() {
    for (var i = 0; i < LESSONS.length; i++) if (!lessonFull(LESSONS[i])) return LESSONS[i];
    return null;
  }
  function ring(pct) {
    var c = 2 * Math.PI * 40, off = c * (1 - pct / 100);
    return '<svg class="ring" viewBox="0 0 100 100" width="104" height="104" role="img" aria-label="' + pct + ' percent complete"><circle cx="50" cy="50" r="40" fill="none" stroke="var(--leaf-l)" stroke-width="9"/><circle cx="50" cy="50" r="40" fill="none" stroke="var(--forest)" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 50 50)"/><text x="50" y="57" text-anchor="middle" class="ring-t">' + pct + '%</text></svg>';
  }
  function committedActions() {
    var out = [];
    LESSONS.forEach(function (L) {
      L.cards.forEach(function (c) {
        if (c.t !== 'action') return;
        var a = st.act[c.id];
        if (a && a.at) out.push({ c: c, L: L, a: a });
      });
    });
    out.sort(function (x, y) { return (x.a.done ? 1 : 0) - (y.a.done ? 1 : 0) || String(x.a.due).localeCompare(String(y.a.due)); });
    return out;
  }
  function viewHome() {
    var s = summary(), nl = nextLesson(), started = s.stepsDone > 0, finished = !nl;
    var pending = nl && lessonDone(nl) === nl.cards.length && !actionDone(nl);
    var cta = finished ? 'Review the lessons' : pending ? 'Mark your Lesson ' + nl.id + ' action done' : ((started ? 'Continue: ' : 'Start: ') + 'Lesson ' + nl.id);
    var h = header('<span class="sync' + (syncMsg === 'offline' ? ' warn' : '') + '" id="sync" aria-live="polite">' + esc(syncLabel()) + '</span><button class="link" data-a="logout">Log out</button>');
    h += '<main class="home wrap"><div class="home-l">' +
      '<section class="hero"><div class="hero-t"><h1>' + (started ? 'Welcome back, ' : 'Welcome, ') + esc(firstName(sess.name)) + '.</h1>' +
      '<p>' + (finished ? 'You have completed the path. Keep your commitments and keep multiplying leaders.' : 'Ten short lessons, each ending with something to do. The next lesson opens once you mark that action done.') + '</p></div>' +
      ring(s.percent) + '</section>' +
      '<p class="stats">' + s.stepsDone + ' of ' + s.totalSteps + ' steps &middot; ' + s.lessonsDone + ' of ' + s.totalLessons + ' lessons &middot; ' + s.actionsDone + ' of ' + s.totalActions + ' actions done</p>' +
      (finished ? '<div class="certcard"><h2>Your certificate is ready</h2><p>Thank you for finishing every lesson and putting each one into practice.</p><button class="btn gold block" data-a="cert">View your certificate</button></div>' : '') +
      '<button class="btn ' + (finished ? 'ghost' : 'primary') + ' block" data-a="' + (pending ? 'toacts' : 'open') + '" data-l="' + (nl ? nl.id : 1) + '" data-r="1">' + esc(cta) + '</button>' +
      actionsHTML() + '</div>' +
      '<section class="home-r" aria-labelledby="lh"><h2 id="lh" class="sec">Lessons</h2><ol class="lessons">' +
      LESSONS.map(function (L) {
        var ls = lessonSteps(L), pct = Math.round(ls.d / ls.n * 100), full = lessonFull(L), lock = !unlocked(L);
        var cardsAll = lessonDone(L) === L.cards.length;
        var meta = lock ? 'Locked. Mark the Lesson ' + (L.id - 1) + ' action done to open it.' : full ? 'Complete' : cardsAll ? 'Do your action to finish' : ls.d ? ls.d + ' of ' + ls.n + ' steps' : ls.n + ' steps &middot; ' + L.minutes + ' min';
        return '<li><button class="lrow' + (full ? ' full' : '') + (lock ? ' locked' : '') + '"' + (lock ? ' disabled' : ' data-a="open" data-l="' + L.id + '"') + '>' +
          '<span class="num">' + (full ? I.check : lock ? I.lock : L.id) + '</span>' +
          '<span class="ltxt"><span class="lt">' + esc(L.title) + '</span><span class="lm">' + meta + '</span>' +
          '<span class="mini" aria-hidden="true"><i style="width:' + pct + '%"></i></span></span>' + (lock ? '' : '<span class="chev">' + I.next + '</span>') + '</button></li>';
      }).join('') + '</ol></section></main>' +
      (DEMO ? '' : '<p class="prefs">Email reminders are ' + (sess.remind === false ? 'off' : 'on') + '. <button class="link" data-a="remind">' + (sess.remind === false ? 'Turn on' : 'Turn off') + '</button></p>') +
      '<footer class="foot"><p>Pastors equip and oversee. Lay leaders lead and multiply. The whole church participates in God’s mission.</p></footer>';
    app.innerHTML = h;
  }
  function actionsHTML() {
    var list = committedActions();
    var h = '<section class="acts" aria-labelledby="ah"><h2 id="ah" class="sec">My actions</h2>';
    if (!list.length) return h + '<p class="empty">Actions you commit to at the end of each lesson will appear here, so you can mark them done.</p></section>';
    h += '<ul class="alist">';
    list.forEach(function (x) {
      var over = !x.a.done && x.a.due && x.a.due < todayISO();
      h += '<li class="arow' + (x.a.done ? ' isdone' : '') + '"><div class="atop"><span class="atxt"><span class="at">' + esc(x.c.title) + '</span><span class="am">Lesson ' + x.L.id + ' &middot; ' +
        (x.a.done ? 'Done' : (over ? '<b class="late">Past due ' : 'Due ') + fmtDate(x.a.due) + (over ? '</b>' : '')) + '</span></span>' +
        (x.a.done ? '<button class="link" data-a="undo" data-c="' + x.c.id + '">Undo</button>' : '<button class="btn small" data-a="donepanel" data-c="' + x.c.id + '">Mark done</button>') + '</div>' +
        '<div class="dpanel" id="dp-' + x.c.id + '" hidden><label>What happened? (optional)<textarea rows="3" maxlength="500" id="dn-' + x.c.id + '"></textarea></label><button class="btn primary small" data-a="savedone" data-c="' + x.c.id + '">Save as done</button></div>' +
        (x.a.done && x.a.note ? '<p class="anote">' + esc(x.a.note) + '</p>' : '') + '</li>';
    });
    return h + '</ul></section>';
  }

  /* ----- lesson: intro / player / end ----- */
  function viewIntro(L) {
    var d = lessonDone(L), n = L.cards.length;
    app.innerHTML = header('<button class="link" data-a="home">Home</button>') +
      '<main class="intro wrap-s"><p class="lno">Lesson ' + L.id + ' of ' + LESSONS.length + '</p><h1>' + esc(L.title) + '</h1>' +
      '<p class="meta">' + n + ' steps &middot; about ' + L.minutes + ' minutes</p>' +
      '<div class="outcome"><h2>After this lesson you will be able to</h2><p>' + esc(L.outcome.charAt(0).toLowerCase() + L.outcome.slice(1)) + '</p></div>' +
      '<p class="note">Every lesson ends with something to do. ' + (lessonById(L.id + 1) ? 'Mark that action done to open Lesson ' + (L.id + 1) + '.' : 'Mark it done to receive your certificate.') + '</p>' +
      '<button class="btn primary block" data-a="begin">' + (d === n ? 'Review lesson' : d ? 'Resume lesson' : 'Start lesson') + '</button>' +
      (L.id > 1 ? '<button class="btn ghost block" data-a="open" data-l="' + (L.id - 1) + '">Previous lesson</button>' : '') +
      '</main>';
  }

  var KIND = { idea: 'Learn', scripture: 'Scripture', list: 'Learn', compare: 'Compare', choice: 'Quick check', sort: 'Quick check', reflect: 'Reflect', action: 'Put it into practice' };

  function cIdea(c) {
    var h = md(c.body || '');
    if (c.points) h += '<ul class="pts">' + c.points.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>';
    if (c.note) h += '<p class="callout">' + esc(c.note) + '</p>';
    return h;
  }
  function cScripture(c) {
    return '<blockquote class="verse"><p>' + esc(c.text) + '</p><footer>' + esc(c.ref) + ', paraphrased</footer></blockquote><p class="insight">' + esc(c.insight) + '</p>';
  }
  function cList(c) {
    return (c.intro ? '<p class="lead">' + esc(c.intro) + '</p>' : '') + '<div class="acc">' + c.items.map(function (it) {
      return '<details><summary><span>' + esc(it.h) + '</span></summary><p>' + esc(it.b) + '</p></details>';
    }).join('') + '</div>' + (c.note ? '<p class="callout">' + esc(c.note) + '</p>' : '');
  }
  function cCompare(c) {
    return '<div class="cmp">' + c.rows.map(function (r) {
      return '<div class="pair"><p class="a"><span class="lab">' + esc(c.left) + '</span>' + esc(r[0]) + '</p><p class="b"><span class="lab">' + esc(c.right) + '</span>' + esc(r[1]) + '</p></div>';
    }).join('') + '</div>';
  }
  function cChoice(c) {
    var a = st.ans[c.id], sel = a ? a.v : -1;
    var h = '<p class="q">' + esc(c.q) + '</p><div class="opts">';
    c.opts.forEach(function (o, i) {
      var cls = 'opt';
      if (a) { if (o.ok) cls += ' ok'; else if (i === sel) cls += ' bad'; }
      h += '<button class="' + cls + '" data-a="pick" data-i="' + i + '"' + (a ? ' disabled' : '') + '><span>' + esc(o.x) + '</span></button>';
    });
    h += '</div>';
    if (a) {
      var o = c.opts[sel], right = c.opts.filter(function (x) { return x.ok; })[0];
      h += '<div class="fb ' + (o.ok ? 'good' : 'miss') + '" role="status"><strong>' + (o.ok ? 'Right.' : 'Not quite.') + '</strong> ' + esc(o.fb || '') +
        (o.ok ? '' : '<br><br><strong>Best answer:</strong> ' + esc(right.x) + ' ' + esc(right.fb || '')) + '</div>';
    }
    return h;
  }
  function cSort(c) {
    var a = st.ans[c.id], v = a ? a.v : [], right = 0;
    var h = '<p class="q">' + esc(c.q) + '</p><div class="sorts">';
    c.items.forEach(function (it, i) {
      var pick = v[i];
      var has = pick !== undefined && pick !== null;
      if (has && pick === it.a) right++;
      h += '<div class="srt"><p class="x">' + esc(it.x) + '</p><div class="chips">';
      c.opts.forEach(function (o, j) {
        var cls = 'chip';
        if (has) { if (j === it.a) cls += ' ok'; else if (j === pick) cls += ' bad'; }
        h += '<button class="' + cls + '" data-a="sort" data-i="' + i + '" data-j="' + j + '"' + (has ? ' disabled' : '') + '>' + esc(o) + '</button>';
      });
      h += '</div>' + (has ? '<p class="why ' + (pick === it.a ? 'good' : 'miss') + '" role="status">' + (pick === it.a ? 'Right. ' : 'Not quite. ') + esc(it.why) + '</p>' : '') + '</div>';
    });
    h += '</div>';
    if (sortComplete(c)) h += '<p class="score">You matched ' + right + ' of ' + c.items.length + '.</p>';
    return h;
  }
  function sortComplete(c) {
    var a = st.ans[c.id]; if (!a || !a.v) return false;
    for (var i = 0; i < c.items.length; i++) if (a.v[i] === undefined || a.v[i] === null) return false;
    return true;
  }
  function cReflect(c) {
    var a = st.ans[c.id], v = a ? a.v : '';
    return '<p class="q">' + esc(c.prompt) + '</p><label class="sr" for="ref">Your reflection</label><textarea id="ref" class="ta" rows="7" maxlength="1200" placeholder="Write here…">' + esc(v) + '</textarea>' +
      '<p class="count" id="cnt">' + (c.hint ? esc(c.hint) : '') + '</p>';
  }
  function fieldsOK(c, a) {
    if (!c.fields) return true;
    for (var i = 0; i < c.fields.length; i++) if (!a || !a.fields || String(a.fields[i] || '').trim().length < 10) return false;
    return true;
  }
  function cAction(c) {
    var a = st.act[c.id] || {};
    var h = (c.intro ? '<p class="lead">' + esc(c.intro) + '</p>' : '') +
      '<ol class="steps">' + c.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>';
    if (c.fields) {
      h += '<div class="flds">' + c.fields.map(function (f, i) {
        return '<label>' + esc(f) + '<textarea class="ta dark" rows="3" maxlength="600" data-f="' + i + '">' + esc((a.fields || [])[i] || '') + '</textarea></label>';
      }).join('') + '</div>';
    }
    h += '<p class="donewhen"><strong>You’re done when:</strong> ' + esc(c.done) + '</p>';
    h += '<label class="due">Do this by<input type="date" id="due" min="' + todayISO() + '" value="' + esc(a.due || plusDays(7)) + '"></label>';
    if (a.at) {
      h += '<div class="committed" role="status">' + I.check + '<span>Committed. Due ' + esc(fmtDate(a.due)) + '.</span></div>';
      h += a.done ? '<p class="fine">Marked done. Well done.</p>' : '<button class="btn gold block" data-a="cdone">I’ve already done this</button>';
    } else {
      h += '<button class="btn gold block" id="commit" data-a="commit"' + (fieldsOK(c, a) ? '' : ' disabled') + '>I commit to do this</button>';
    }
    return h;
  }
  var RENDER = { idea: cIdea, scripture: cScripture, list: cList, compare: cCompare, choice: cChoice, sort: cSort, reflect: cReflect, action: cAction };

  function ready(c) {
    switch (c.t) {
      case 'choice': return !!st.ans[c.id];
      case 'sort': return sortComplete(c);
      case 'reflect': return !!(st.ans[c.id] && String(st.ans[c.id].v).trim().length >= 10);
      case 'action': return !!(st.act[c.id] && st.act[c.id].at);
      default: return true;
    }
  }
  var NEED = { choice: 'Choose an answer to continue.', sort: 'Match every item to continue.', reflect: 'Write a few words to continue.', action: 'Commit to the action to continue.' };

  function viewPlayer(L, keepScroll) {
    var c = L.cards[view.idx], n = L.cards.length, rdy = ready(c), last = view.idx === n - 1;
    var prev = keepScroll ? (document.getElementById('stage') || {}).scrollTop : 0;
    var seg = '';
    for (var i = 0; i < n; i++) seg += '<i class="' + (st.done[L.cards[i].id] ? 'd ' : '') + (i === view.idx ? 'c' : '') + '"></i>';
    var title = c.t === 'scripture' ? c.ref : (c.title || '');
    app.innerHTML =
      '<div class="player"><div class="ptop"><button class="x" data-a="home" aria-label="Close lesson">' + I.close + '</button>' +
      '<div class="seg" role="progressbar" aria-valuemin="1" aria-valuemax="' + n + '" aria-valuenow="' + (view.idx + 1) + '" aria-label="Step ' + (view.idx + 1) + ' of ' + n + '">' + seg + '</div>' +
      '<span class="pc">' + (view.idx + 1) + '/' + n + '</span></div>' +
      '<div class="stage" id="stage"><article class="sheet k-' + c.t + '" aria-labelledby="ct"><p class="kind">' + KIND[c.t] + '</p><h2 id="ct" tabindex="-1">' + esc(title) + '</h2>' + RENDER[c.t](c) + '</article></div>' +
      '<div class="dock"><p class="need" id="need" aria-live="polite">' + (rdy ? '' : NEED[c.t]) + '</p><div class="drow">' +
      '<button class="btn ghost" data-a="prev" aria-label="Previous step">' + I.back + '</button>' +
      '<button class="btn primary grow" id="nextbtn" data-a="next"' + (rdy ? '' : ' disabled') + '>' + (last ? 'Finish lesson' : 'Next') + I.next + '</button></div></div></div>';
    var stage = document.getElementById('stage');
    if (keepScroll) stage.scrollTop = prev; else { var h = document.getElementById('ct'); if (h) h.focus({ preventScroll: true }); stage.scrollTop = 0; }
    bindCard(c);
  }
  function refreshDock(c) {
    var b = document.getElementById('nextbtn'), nd = document.getElementById('need'), r = ready(c);
    if (b) b.disabled = !r; if (nd) nd.textContent = r ? '' : NEED[c.t];
  }
  function bindCard(c) {
    var L = lessonById(view.lesson);
    if (c.t === 'reflect') {
      var ta = document.getElementById('ref'), cnt = document.getElementById('cnt');
      ta.addEventListener('input', function () {
        touch('ans', c.id, { v: ta.value });
        var len = ta.value.trim().length;
        if (len >= 10) markDone(c.id);
        cnt.textContent = len >= 10 ? ta.value.length + ' / 1200' : (c.hint || '');
        refreshDock(c);
        paintSeg(L);
      });
    }
    if (c.t === 'action') {
      var due = document.getElementById('due');
      due.addEventListener('change', function () {
        var a = st.act[c.id] ? JSON.parse(JSON.stringify(st.act[c.id])) : {};
        a.due = due.value || plusDays(7);
        if (a.at) touch('act', c.id, a); else { st.act[c.id] = a; }
      });
      Array.prototype.forEach.call(document.querySelectorAll('textarea[data-f]'), function (t) {
        t.addEventListener('input', function () {
          var a = st.act[c.id] ? JSON.parse(JSON.stringify(st.act[c.id])) : {};
          a.fields = a.fields || []; a.fields[+t.dataset.f] = t.value;
          if (a.at) touch('act', c.id, a); else st.act[c.id] = a;
          var btn = document.getElementById('commit'); if (btn) btn.disabled = !fieldsOK(c, a);
        });
      });
    }
  }
  function paintSeg(L) {
    var seg = document.querySelector('.seg'); if (!seg) return;
    var kids = seg.children;
    for (var i = 0; i < kids.length; i++) kids[i].className = (st.done[L.cards[i].id] ? 'd ' : '') + (i === view.idx ? 'c' : '');
  }

  function viewEnd(L) {
    var s = summary(), nxt = lessonById(L.id + 1), ac = ACT[L.id], act = ac ? st.act[ac.id] : null;
    var full = lessonFull(L), last = !nxt, waiting = ac && !(act && act.done);
    app.innerHTML = header('<button class="link" data-a="home">Home</button>') +
      '<main class="end wrap-s"><div class="badge">' + I.check + '</div><p class="lno">Lesson ' + L.id + ' ' + (full ? 'complete' : 'learned') + '</p><h1>' + (full && last ? 'You have finished the path.' : full ? 'Well done.' : 'Now put it into practice.') + '</h1>' +
      '<p class="lead">' + (full && last ? 'The work now moves from the screen to your communities. Keep coaching, keep releasing, and keep multiplying leaders. “Entrust to faithful people who will be able to teach others also.” (2 Timothy 2:2)' :
        full ? 'You have completed ' + esc(L.title) + ' and done the action. That is how learning becomes leadership.' :
          'You have finished the cards for ' + esc(L.title) + '. The lesson is complete when you have done your action and marked it done.') + '</p>' +
      (waiting && act && act.at ? '<div class="outcome"><h2>Your action</h2><p><strong>' + esc(ac.title) + '</strong><br>Due ' + esc(fmtDate(act.due)) + '</p>' +
        '<label class="endlab">What happened? (optional)<textarea id="endnote" rows="3" maxlength="500"></textarea></label>' +
        '<button class="btn gold block" data-a="enddone">I’ve done this action</button>' +
        '<p class="fine">' + (nxt ? 'You can also do this later from the home screen. Lesson ' + nxt.id + ' opens once it is marked done.' : 'Your certificate is ready once it is marked done.') + '</p></div>' : '') +
      (full && act && act.done && act.note ? '<div class="outcome"><h2>What happened</h2><p>' + esc(act.note) + '</p></div>' : '') +
      '<p class="stats">Overall progress: ' + s.percent + '% (' + s.lessonsDone + ' of ' + s.totalLessons + ' lessons)</p>' +
      (last && full ? '<button class="btn gold block" data-a="cert">View your certificate</button>' : '') +
      (nxt ? (full ? '<button class="btn primary block" data-a="open" data-l="' + nxt.id + '">Next: ' + esc(nxt.title) + '</button>' :
        '<button class="btn primary block" disabled>Lesson ' + nxt.id + ' opens after your action</button>') : '') +
      '<button class="btn ghost block" data-a="home">Back to home</button></main>';
    window.scrollTo(0, 0);
  }

  /* ----- certificate ----- */
  function certDate() { return new Date(completedAt() || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }); }
  function viewCert() {
    var nm = esc(sess.name), dt = esc(certDate());
    app.innerHTML = '<div class="noprint">' + header('<button class="link" data-a="home">Home</button>') + '</div>' +
      '<main class="certwrap"><div class="cert"><div class="cert-in">' +
      '<div class="c-band"><img src="assets/logo-white.png" alt="Real Life Christian Communities"></div>' +
      '<div class="c-body"><p class="c-kick">Certificate of Completion</p><p class="c-this">This certifies that</p><h1 class="c-name">' + nm + '</h1>' +
      '<p class="c-txt">has completed the ten-lesson learning path</p><h2 class="c-course">' + esc(COURSE.title) + '</h2>' +
      '<p class="c-txt">developing and overseeing lay leaders,<br>with a practical action put into practice in every lesson.</p></div>' +
      '<div class="c-foot"><div><p class="c-v">' + dt + '</p><p class="c-l">Date completed</p></div><p class="c-tag">Pastors equip and oversee. Lay leaders lead and multiply.</p>' +
      '<div><p class="c-v">Bong Baylon</p><p class="c-l">Senior Pastor, RLCC</p></div></div></div></div>' +
      '<div class="cert-actions noprint"><button class="btn primary" data-a="print">Print or save as PDF</button><button class="btn ghost" data-a="dlcert">Download image</button></div>' +
      '<p class="fine noprint ctr">On a phone, turn it sideways to see the certificate larger.</p></main>';
    window.scrollTo(0, 0);
  }
  function downloadCert() {
    var W = 2000, H = 1414, cv = document.createElement('canvas'); cv.width = W; cv.height = H; var x = cv.getContext('2d');
    var F = Promise.all([document.fonts.load('600 80px Newsreader'), document.fonts.load('italic 400 40px Newsreader'), document.fonts.load('600 40px Figtree'), document.fonts.load('400 40px Figtree')]).catch(function () { });
    var img = new Image();
    var loaded = new Promise(function (res) { img.onload = res; img.onerror = res; img.src = 'assets/logo-white.png'; });
    Promise.all([F, loaded]).then(function () {
      function t(s, px, y, font, col, ax) { x.font = font; x.fillStyle = col; x.textAlign = ax || 'center'; x.fillText(s, ax === 'left' ? 170 : ax === 'right' ? W - 170 : W / 2, y); }
      x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
      x.fillStyle = '#365233'; x.fillRect(0, 0, W, 330);
      var lw = 720, lh = lw * (img.height / img.width || .11); x.drawImage(img, (W - lw) / 2, 165 - lh / 2, lw, lh);
      x.fillStyle = '#E0A93B'; x.fillRect(0, 330, W, 10);
      x.strokeStyle = '#365233'; x.lineWidth = 5; x.strokeRect(50, 50, W - 100, H - 100);
      t('Certificate of Completion', 0, 478, '600 88px Newsreader, Georgia, serif', '#365233');
      t('This certifies that', 0, 580, '400 42px Figtree, sans-serif', '#566757');
      var nm = sess.name, fs = 140; x.font = '600 ' + fs + 'px Newsreader, Georgia, serif'; while (x.measureText(nm).width > W - 360 && fs > 60) { fs -= 6; x.font = '600 ' + fs + 'px Newsreader, Georgia, serif'; }
      t(nm, 0, 730, '600 ' + fs + 'px Newsreader, Georgia, serif', '#1A2A1B');
      x.fillStyle = '#D6DFD0'; x.fillRect(W / 2 - 450, 770, 900, 3);
      t('has completed the ten-lesson learning path', 0, 850, '400 42px Figtree, sans-serif', '#566757');
      t(COURSE.title, 0, 960, '600 96px Newsreader, Georgia, serif', '#365233');
      t('developing and overseeing lay leaders,', 0, 1045, '400 42px Figtree, sans-serif', '#566757');
      t('with a practical action put into practice in every lesson.', 0, 1100, '400 42px Figtree, sans-serif', '#566757');
      x.fillStyle = '#365233'; x.fillRect(170, 1196, 420, 3); x.fillRect(W - 590, 1196, 420, 3);
      t(certDate(), 0, 1176, '600 40px Figtree, sans-serif', '#1A2A1B', 'left');
      t('Date completed', 0, 1245, '400 30px Figtree, sans-serif', '#566757', 'left');
      t('Bong Baylon', 0, 1176, '600 40px Figtree, sans-serif', '#1A2A1B', 'right');
      t('Senior Pastor, RLCC', 0, 1245, '400 30px Figtree, sans-serif', '#566757', 'right');
      t('Pastors equip and oversee. Lay leaders lead and multiply.', 0, 1300, 'italic 400 40px Newsreader, Georgia, serif', '#7A5A10');
      cv.toBlob(function (b) {
        var u = URL.createObjectURL(b), l = document.createElement('a');
        l.href = u; l.download = 'Pastoral-Oversight-Certificate-' + sess.name.replace(/[^A-Za-z0-9]+/g, '-') + '.png';
        document.body.appendChild(l); l.click(); l.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
      }, 'image/png');
    });
  }

  /* ---------- router ---------- */
  function render(o) {
    if (!sess) { viewAuth(o); return; }
    if (location.hash === '#/certificate') {
      if (!allFull()) { location.hash = '#/'; return; }
      view = { lesson: null, idx: 0, phase: 'intro' }; viewCert(); return;
    }
    var m = /^#\/lesson\/(\d+)/.exec(location.hash);
    if (m) {
      var L = lessonById(+m[1]);
      if (!L || !unlocked(L)) { location.hash = '#/'; return; }
      if (view.lesson !== L.id) view = { lesson: L.id, idx: 0, phase: 'intro' };
      if (view.phase === 'intro') viewIntro(L); else if (view.phase === 'end') viewEnd(L); else viewPlayer(L);
      if (view.phase !== 'cards') window.scrollTo(0, 0);
    } else {
      view = { lesson: null, idx: 0, phase: 'intro' };
      viewHome(); window.scrollTo(0, 0);
    }
  }

  /* ---------- actions ---------- */
  function setDone(id, note) {
    var a = st.act[id] ? JSON.parse(JSON.stringify(st.act[id])) : { at: Date.now(), due: plusDays(7) };
    if (!a.title && CARD[id]) { a.title = CARD[id].c.title; a.l = CARD[id].L.id; }
    a.done = Date.now(); a.note = note || ''; touch('act', id, a);
  }
  function goNext() {
    var L = lessonById(view.lesson), c = L.cards[view.idx];
    if (!ready(c)) return;
    markDone(c.id);
    if (view.idx >= L.cards.length - 1) { view.phase = 'end'; flush(); render(); return; }
    view.idx++; viewPlayer(L);
  }
  function goPrev() {
    var L = lessonById(view.lesson);
    if (view.idx === 0) { view.phase = 'intro'; render(); return; }
    view.idx--; viewPlayer(L);
  }

  app.addEventListener('click', function (e) {
    var t = e.target.closest('[data-a]'); if (!t || t.disabled) return;
    var a = t.dataset.a, L, c;
    switch (a) {
      case 'mode': viewAuth({ mode: t.dataset.m }); break;
      case 'eye': var pw = t.parentNode.querySelector('input'); var show = pw.type === 'password'; pw.type = show ? 'text' : 'password'; t.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); break;
      case 'logout': logout(); break;
      case 'home': location.hash = '#/'; break;
      case 'open':
        var lid = +t.dataset.l, Lo = lessonById(lid);
        if (!Lo || !unlocked(Lo)) break;
        view = { lesson: lid, idx: 0, phase: 'intro' };
        if (t.dataset.r && lessonDone(Lo) > 0 && lessonDone(Lo) < Lo.cards.length) { view.idx = firstUndone(Lo); view.phase = 'cards'; }
        if (location.hash === '#/lesson/' + lid) render(); else location.hash = '#/lesson/' + lid;
        break;
      case 'begin': L = lessonById(view.lesson); view.idx = lessonDone(L) === L.cards.length ? 0 : firstUndone(L); view.phase = 'cards'; render(); break;
      case 'toacts': var ah = document.getElementById('ah'); if (ah) ah.scrollIntoView({ block: 'start' }); break;
      case 'cert': location.hash = '#/certificate'; break;
      case 'print': window.print(); break;
      case 'dlcert': downloadCert(); break;
      case 'enddone':
        L = lessonById(view.lesson); setDone(ACT[L.id].id, (document.getElementById('endnote') || {}).value ? document.getElementById('endnote').value.trim() : ''); flush(); viewEnd(L); break;
      case 'remind':
        sess.remind = sess.remind === false; jset(sessionStorage, 'ro_sess', sess); viewHome();
        if (!DEMO) api('prefs', { token: sess.token, remind: sess.remind }).catch(function () { }); break;
      case 'next': goNext(); break;
      case 'prev': goPrev(); break;
      case 'pick':
        L = lessonById(view.lesson); c = L.cards[view.idx];
        if (st.ans[c.id]) break;
        touch('ans', c.id, { v: +t.dataset.i }); markDone(c.id); viewPlayer(L, true); break;
      case 'sort':
        L = lessonById(view.lesson); c = L.cards[view.idx];
        var cur = st.ans[c.id] ? JSON.parse(JSON.stringify(st.ans[c.id])) : { v: [] };
        var i = +t.dataset.i; if (cur.v[i] !== undefined && cur.v[i] !== null) break;
        for (var k = 0; k < c.items.length; k++) if (cur.v[k] === undefined) cur.v[k] = null;
        cur.v[i] = +t.dataset.j; touch('ans', c.id, cur);
        if (sortComplete(c)) markDone(c.id);
        viewPlayer(L, true); break;
      case 'commit':
        L = lessonById(view.lesson); c = L.cards[view.idx];
        var ex = st.act[c.id] || {};
        if (!fieldsOK(c, ex)) break;
        var na = { due: document.getElementById('due').value || plusDays(7), at: Date.now(), done: null, note: '', title: c.title, l: L.id };
        if (ex.fields) na.fields = ex.fields;
        touch('act', c.id, na); markDone(c.id); viewPlayer(L, true); break;
      case 'cdone':
        L = lessonById(view.lesson); c = L.cards[view.idx]; setDone(c.id, ''); viewPlayer(L, true); break;
      case 'donepanel': var p = document.getElementById('dp-' + t.dataset.c); p.hidden = !p.hidden; if (!p.hidden) p.querySelector('textarea').focus(); break;
      case 'savedone': setDone(t.dataset.c, document.getElementById('dn-' + t.dataset.c).value.trim()); viewHome(); break;
      case 'undo':
        var ua = JSON.parse(JSON.stringify(st.act[t.dataset.c])); ua.done = null; ua.note = ''; touch('act', t.dataset.c, ua); viewHome(); break;
    }
  });

  window.addEventListener('hashchange', function () { render(); });
  document.addEventListener('keydown', function (e) {
    if (!sess || view.phase !== 'cards' || /^(TEXTAREA|INPUT|SELECT)$/.test((e.target || {}).tagName || '')) return;
    if (e.key === 'ArrowRight') goNext(); else if (e.key === 'ArrowLeft') goPrev();
  });
  /* swipe between cards */
  var sx = 0, sy = 0;
  app.addEventListener('touchstart', function (e) { if (e.touches.length === 1) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; } }, { passive: true });
  app.addEventListener('touchend', function (e) {
    if (view.phase !== 'cards' || !sess || !e.changedTouches.length) return;
    if (/^(TEXTAREA|INPUT)$/.test((e.target || {}).tagName || '')) return;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) { if (dx < 0) goNext(); else goPrev(); }
  }, { passive: true });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(true); });
  window.addEventListener('online', function () { queueSync(true); });

  /* ---------- boot ---------- */
  sess = jget(sessionStorage, 'ro_sess', null);
  if (sess && sess.email) {
    startSession(null);
    if (!DEMO) {
      api('state', { token: sess.token }).then(function (r) {
        if (r && r.ok && r.state) { st = merge(st, r.state); if (r.remind === false) { sess.remind = false; jset(sessionStorage, 'ro_sess', sess); } saveLocal(); if (view.phase !== 'cards') render(); }
        else if (r && r.error === 'session') logout('Your session ended. Please log in again.');
      }).catch(function () { });
    }
  } else { sess = null; }
  render();

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { }); });
  }
})();
