/**
 * Pastoral Oversight at RLCC: Apps Script back end
 * ------------------------------------------------------------------
 * Container-bound to a Google Sheet. It provides:
 *   - register / login (salted, stretched password hashes; signed session tokens)
 *   - progress sync (a State sheet per learner, plus readable Responses)
 *   - a "Progress" sheet that the RLCC Learning Hub can read (see doGet and HUB notes)
 *
 * SETUP (once):
 *   1. Create a new Google Sheet (e.g. "RLCC Pastoral Oversight Data"), then Extensions > Apps Script.
 *   2. Paste this file as Code.gs, save, and run  setup()  (approve the permissions).
 *   3. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
 *   4. Copy the Web app URL (ends in /exec) into config.js on GitHub (apiUrl).
 *
 * OPTIONAL Script Properties (Project Settings > Script properties):
 *   REG_CODE         If set, new accounts must enter this staff access code.
 *   HUB_KEY          Secret key the Learning Hub uses to read progress (setup() creates one).
 *   HUB_WEBHOOK_URL  If set, every change in a learner's percentage is POSTed there as JSON.
 */

var COURSE_ID = 'pastoral-oversight-2027';
var COURSE_NAME = 'Pastoral Oversight at RLCC';
var SESSION_HOURS = 12;
var HASH_ROUNDS = 800;

var SHEETS = {
  Users: ['Name', 'Email', 'Salt', 'Hash', 'Created', 'Last Login'],
  State: ['Email', 'State JSON', 'Updated'],
  Progress: ['Name', 'Email', 'Course', 'Percent', 'Lessons Completed', 'Total Lessons', 'Steps Done', 'Total Steps',
    'Actions Committed', 'Actions Done', 'Started', 'Last Activity', 'Completed'],
  Responses: ['Updated', 'Name', 'Email', 'Lesson', 'Card', 'Type', 'Title', 'Response', 'Key']
};

/* ============================ entry points ============================ */

function doPost(e) {
  var out;
  try {
    var req = JSON.parse(e.postData.contents);
    switch (req.action) {
      case 'register': out = register_(req); break;
      case 'login': out = login_(req); break;
      case 'state': out = getState_(req); break;
      case 'save': out = save_(req); break;
      default: out = { ok: false, error: 'Unknown request.' };
    }
  } catch (err) {
    console.error(err && err.stack || err);
    out = { ok: false, error: 'Server error. Please try again.' };
  }
  return json_(out);
}

/** GET ?action=hub&key=HUB_KEY  ->  all learners' progress as JSON (for the Learning Hub). */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'hub') {
    var key = prop_('HUB_KEY');
    if (!key || p.key !== key) return json_({ ok: false, error: 'Not authorized.' });
    return json_({ ok: true, course: COURSE_ID, courseName: COURSE_NAME, generated: new Date().toISOString(), learners: hubRows_() });
  }
  return json_({ ok: true, service: COURSE_NAME + ' API' });
}

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ================================ setup =============================== */

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    var heads = SHEETS[name];
    sh.getRange(1, 1, 1, heads.length).setValues([heads]).setFontWeight('bold').setBackground('#365233').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  });
  var first = ss.getSheetByName('Sheet1');
  if (first && first.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(first);
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SECRET')) props.setProperty('SECRET', Utilities.getUuid() + Utilities.getUuid());
  if (!props.getProperty('HUB_KEY')) props.setProperty('HUB_KEY', Utilities.getUuid().replace(/-/g, ''));
  console.log('Setup complete. Learning Hub key: ' + props.getProperty('HUB_KEY'));
  return 'OK';
}

function onOpen() {
  try {
    SpreadsheetApp.getUi().createMenu('Oversight admin')
      .addItem('Reset a learner’s password', 'resetPasswordPrompt')
      .addItem('Show Learning Hub key', 'showHubKey')
      .addToUi();
  } catch (e) { }
}
function showHubKey() {
  SpreadsheetApp.getUi().alert('Learning Hub key', prop_('HUB_KEY') || 'Run setup() first.', SpreadsheetApp.getUi().ButtonSet.OK);
}
function resetPasswordPrompt() {
  var ui = SpreadsheetApp.getUi();
  var a = ui.prompt('Reset password', 'Learner email:', ui.ButtonSet.OK_CANCEL);
  if (a.getSelectedButton() !== ui.Button.OK) return;
  var b = ui.prompt('Reset password', 'New temporary password (8+ characters):', ui.ButtonSet.OK_CANCEL);
  if (b.getSelectedButton() !== ui.Button.OK) return;
  var ok = resetPassword_(a.getResponseText(), b.getResponseText());
  ui.alert(ok ? 'Password updated. Ask the learner to log in with it.' : 'No learner found with that email, or the password is too short.');
}
function resetPassword_(email, pw) {
  email = String(email || '').trim().toLowerCase();
  if (!pw || pw.length < 8) return false;
  var sh = sheet_('Users'), row = findRow_(sh, 2, email);
  if (!row) return false;
  var salt = Utilities.getUuid();
  sh.getRange(row, 3, 1, 2).setValues([[salt, hash_(pw, salt)]]);
  return true;
}

/* ============================ auth handlers =========================== */

function register_(req) {
  var name = clean_(req.name, 80), email = String(req.email || '').trim().toLowerCase(), pw = String(req.password || '');
  if (name.length < 2) return { ok: false, error: 'Enter your full name.' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 120) return { ok: false, error: 'Enter a valid email address.' };
  if (pw.length < 8 || pw.length > 100) return { ok: false, error: 'Your password needs at least 8 characters.' };
  var need = prop_('REG_CODE');
  if (need && String(req.code || '').trim() !== need) {
    return { ok: false, needCode: true, error: req.code ? 'That access code is not correct.' : 'Enter the staff access code you were given.' };
  }
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sh = sheet_('Users');
    if (findRow_(sh, 2, email)) return { ok: false, error: 'This email is already registered. Log in instead.' };
    var salt = Utilities.getUuid(), now = new Date();
    sh.appendRow([safe_(name), email, salt, hash_(pw, salt), now, now]);
    upsertProgress_(name, email, { cardsDone: 0, totalCards: 0, lessonsDone: 0, totalLessons: 0, actionsCommitted: 0, actionsDone: 0 }, true);
    return { ok: true, name: name, email: email, token: token_(email), state: emptyState_() };
  } finally { lock.releaseLock(); }
}

function login_(req) {
  var email = String(req.email || '').trim().toLowerCase(), pw = String(req.password || '');
  var cache = CacheService.getScriptCache(), fk = 'fail_' + Utilities.base64EncodeWebSafe(email).slice(0, 80);
  var fails = Number(cache.get(fk) || 0);
  if (fails >= 6) return { ok: false, error: 'Too many attempts. Please wait 15 minutes and try again.' };
  var sh = sheet_('Users'), row = findRow_(sh, 2, email);
  var bad = { ok: false, error: 'Email or password is incorrect.' };
  if (!row) { cache.put(fk, String(fails + 1), 900); return bad; }
  var r = sh.getRange(row, 1, 1, 4).getValues()[0];
  if (hash_(pw, String(r[2])) !== String(r[3])) { cache.put(fk, String(fails + 1), 900); return bad; }
  cache.remove(fk);
  sh.getRange(row, 6).setValue(new Date());
  return { ok: true, name: String(r[0]), email: email, token: token_(email), state: loadState_(email) };
}

/* ============================ data handlers =========================== */

function getState_(req) {
  var email = verify_(req.token);
  if (!email) return { ok: false, error: 'session' };
  return { ok: true, state: loadState_(email) };
}

function save_(req) {
  var email = verify_(req.token);
  if (!email) return { ok: false, error: 'session' };
  var d = req.delta || {}, sum = req.summary || {};
  var lock = LockService.getScriptLock(); lock.waitLock(25000);
  try {
    var users = sheet_('Users'), urow = findRow_(users, 2, email);
    if (!urow) return { ok: false, error: 'session' };
    var name = String(users.getRange(urow, 1).getValue());
    var st = loadState_(email), id;

    for (id in (d.done || {})) if (validId_(id)) { var t = Number(d.done[id]) || Date.now(); if (!st.done[id] || t < st.done[id]) st.done[id] = t; }
    ['ans', 'act'].forEach(function (f) {
      for (id in (d[f] || {})) {
        if (!validId_(id)) continue;
        var v = d[f][id];
        if (!v || JSON.stringify(v).length > (f === 'ans' ? 1800 : 4500)) continue;
        if (!st[f][id] || (v.ts || 0) >= (st[f][id].ts || 0)) st[f][id] = v;
      }
    });

    var stateStr = JSON.stringify(st);
    if (stateStr.length > 48000) return { ok: false, error: 'Too much data to save.' };
    var ssh = sheet_('State'), srow = findRow_(ssh, 1, email);
    if (srow) ssh.getRange(srow, 2, 1, 2).setValues([[stateStr, new Date()]]); else ssh.appendRow([email, stateStr, new Date()]);

    var totalCards = clampInt_(sum.totalCards, 1, 500) || 1;
    var done = Object.keys(st.done).length, aC = 0, aD = 0;
    for (id in st.act) { if (st.act[id].at) aC++; if (st.act[id].done) aD++; }
    upsertProgress_(name, email, {
      cardsDone: Math.min(done, totalCards), totalCards: totalCards,
      lessonsDone: clampInt_(sum.lessonsDone, 0, 100), totalLessons: clampInt_(sum.totalLessons, 0, 100),
      actionsCommitted: aC, actionsDone: aD
    }, false);

    upsertResponses_(name, email, d, req.labels || {});
    return { ok: true };
  } finally { lock.releaseLock(); }
}

/* ============================ progress / hub ========================== */

function upsertProgress_(name, email, s, isNew) {
  var sh = sheet_('Progress'), row = findRow_(sh, 2, email), now = new Date();
  var pct = s.totalCards ? Math.round(s.cardsDone / s.totalCards * 100) : 0;
  var prev = row ? sh.getRange(row, 1, 1, 13).getValues()[0] : null;
  var started = prev && prev[10] ? prev[10] : (s.cardsDone > 0 ? now : '');
  var completed = prev && prev[12] ? prev[12] : (pct >= 100 ? now : '');
  var vals = [safe_(name), email, COURSE_NAME, pct, s.lessonsDone, s.totalLessons, s.cardsDone, s.totalCards,
    s.actionsCommitted, s.actionsDone, started, now, completed];
  if (row) sh.getRange(row, 1, 1, 13).setValues([vals]); else sh.appendRow(vals);
  if (!prev || Number(prev[3]) !== pct) pushHub_({ name: name, email: email, percent: pct, row: vals });
}

function hubRows_() {
  var sh = sheet_('Progress'), last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 13).getValues().map(function (r) {
    return {
      name: r[0], email: r[1], course: r[2], percent: r[3], lessonsCompleted: r[4], totalLessons: r[5],
      stepsDone: r[6], totalSteps: r[7], actionsCommitted: r[8], actionsDone: r[9],
      started: r[10] ? new Date(r[10]).toISOString() : '', lastActivity: r[11] ? new Date(r[11]).toISOString() : '',
      completed: r[12] ? new Date(r[12]).toISOString() : ''
    };
  });
}

/** Optional push to the Learning Hub when a learner's percentage changes. */
function pushHub_(p) {
  var url = prop_('HUB_WEBHOOK_URL');
  if (!url) return;
  try {
    UrlFetchApp.fetch(url, {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      payload: JSON.stringify({
        source: 'pastoral-oversight', course: COURSE_ID, courseName: COURSE_NAME,
        name: p.name, email: p.email, percent: p.percent, key: prop_('HUB_KEY') || ''
      })
    });
  } catch (e) { console.error('Hub push failed: ' + e); }
}

function upsertResponses_(name, email, d, labels) {
  var rows = [], id;
  for (id in (d.ans || {})) {
    var lb = labels[id];
    if (!lb || lb.t !== 'reflect') continue;
    rows.push([name, email, lb.l, id, 'Reflection', lb.p, String((d.ans[id] || {}).v || '').slice(0, 1200)]);
  }
  for (id in (d.act || {})) {
    var la = labels[id], a = d.act[id];
    if (!la || la.t !== 'action' || !a || !a.at) continue;
    var txt = 'Committed, due ' + a.due + (a.done ? '. DONE' + (a.note ? ': ' + a.note : '') : '. Not yet done.');
    if (a.fields && a.fields.length) txt += '\n' + a.fields.map(function (x, i) { return (i + 1) + ') ' + (x || ''); }).join('\n');
    rows.push([name, email, la.l, id, 'Action', la.p, txt.slice(0, 3000)]);
  }
  if (!rows.length) return;
  var sh = sheet_('Responses');
  rows.forEach(function (r) {
    var k = email + '|' + r[3], row = findRow_(sh, 9, k);
    var vals = [new Date(), safe_(r[0]), r[1], r[2], r[3], r[4], safe_(r[5]), safe_(r[6]), k];
    if (row) sh.getRange(row, 1, 1, 9).setValues([vals]); else sh.appendRow(vals);
  });
}

/* ============================== utilities ============================= */

function emptyState_() { return { done: {}, ans: {}, act: {} }; }
function loadState_(email) {
  var sh = sheet_('State'), row = findRow_(sh, 1, email);
  if (!row) return emptyState_();
  try {
    var s = JSON.parse(String(sh.getRange(row, 2).getValue()));
    s.done = s.done || {}; s.ans = s.ans || {}; s.act = s.act || {};
    return s;
  } catch (e) { return emptyState_(); }
}
function sheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName(name);
  if (!sh) { setup(); sh = ss.getSheetByName(name); }
  return sh;
}
function findRow_(sh, col, val) {
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var f = sh.getRange(2, col, last - 1, 1).createTextFinder(String(val)).matchEntireCell(true).matchCase(false).findNext();
  return f ? f.getRow() : 0;
}
function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k); }
function clean_(s, n) { return String(s || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n); }
function safe_(s) { s = String(s == null ? '' : s); return /^[=+\-@]/.test(s) ? "'" + s : s; }   // stops spreadsheet formula injection
function validId_(id) { return /^[A-Za-z0-9_\-]{1,40}$/.test(id); }
function clampInt_(n, lo, hi) { n = Math.round(Number(n)); if (!isFinite(n)) return lo; return Math.max(lo, Math.min(hi, n)); }

function hash_(pw, salt) {
  var h = salt + ':' + pw;
  for (var i = 0; i < HASH_ROUNDS; i++) {
    h = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, h + salt + pw));
  }
  return h;
}
function sign_(payload) {
  var secret = prop_('SECRET'); if (!secret) { setup(); secret = prop_('SECRET'); }
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload, secret));
}
function token_(email) {
  var p = Utilities.base64EncodeWebSafe(JSON.stringify({ e: email, x: Date.now() + SESSION_HOURS * 3600 * 1000 }));
  return p + '.' + sign_(p);
}
function verify_(tok) {
  try {
    var parts = String(tok || '').split('.');
    if (parts.length !== 2) return null;
    var good = sign_(parts[0]), a = parts[1], diff = good.length ^ a.length;
    for (var i = 0; i < good.length && i < a.length; i++) diff |= good.charCodeAt(i) ^ a.charCodeAt(i);
    if (diff !== 0) return null;
    var body = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
    if (!body.e || body.x < Date.now()) return null;
    return String(body.e);
  } catch (e) { return null; }
}
