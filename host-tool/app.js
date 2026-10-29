/* Vedėjo skydelis — host-tool.
   Данные игры живут в localStorage постоянно. Naktis/Diena — только видимость. */

(function () {
'use strict';

var KEY = 'mafiaHostTool.v1';

/* Список спец-ролей. Правится здесь — больше нигде не дублируется. */
var SPEC_ROLES = ['Advokatas', 'Kupidonas', 'Duobkasys', 'Baba Vanga',
                  'Naktinė viešnia', 'Pamišėlis', 'Barmenas', 'Riteris'];

var START_PLAYERS = 10,
    START_ROUNDS  = 5,
    MAX_ROUNDS    = 12,
    MAFIA_MAX     = 3,
    PIN_LEN       = 4,
    PL_COUNT      = 3;

var S = null,          // состояние
    mode = 'night',    // только в памяти: при каждой загрузке — Naktis
    seq = 1;

var $ = function (id) { return document.getElementById(id); };

/* ── Состояние ──────────────────────────────────────── */

function newPlayer() { return { id: 'p' + (seq++), name: '', dead: false, votes: [] }; }

function fit(arr, n) {
  while (arr.length < n) arr.push('');
  arr.length = n;
}

function fresh() {
  var st = {
    date: '', event: '', rounds: START_ROUNDS, players: [],
    mafia:   { kas: [], ka: [] },
    sheriff: { kas: '', ka: '' },
    doctor:  { kas: '', ka: [] },
    spec:    { role: '', kas: '', ka: [] },
    notes: '',
    pool: [],
    playlists: [],
    plCur: 0,
    pin: ''
  };
  for (var i = 0; i < START_PLAYERS; i++) st.players.push(newPlayer());
  normalize(st);
  return st;
}

function normalize(st) {
  if (!Array.isArray(st.pool)) st.pool = [];
  var seen = {};
  st.pool = st.pool.filter(function (n) {
    if (typeof n !== 'string') return false;
    n = n.trim();
    if (!n || seen[n.toLowerCase()]) return false;
    seen[n.toLowerCase()] = 1;
    return true;
  }).map(function (n) { return n.trim(); });
  if (!Array.isArray(st.playlists)) st.playlists = [];
  for (var pi = 0; pi < PL_COUNT; pi++) {
    var pl = st.playlists[pi];
    st.playlists[pi] = {
      name: pl && typeof pl.name === 'string' ? pl.name : '',
      url:  pl && typeof pl.url  === 'string' ? pl.url  : ''
    };
  }
  st.playlists.length = PL_COUNT;
  if (typeof st.plCur !== 'number' || st.plCur < 0 || st.plCur >= PL_COUNT) st.plCur = 0;

  st.rounds = Math.max(1, Math.min(MAX_ROUNDS, (st.rounds | 0) || START_ROUNDS));
  if (!Array.isArray(st.players) || !st.players.length) st.players = [newPlayer()];
  st.players.forEach(function (p) {
    if (!p.id) p.id = 'p' + (seq++);
    else { var n = parseInt(String(p.id).slice(1), 10); if (n >= seq) seq = n + 1; }
    if (!Array.isArray(p.votes)) p.votes = [];
    fit(p.votes, st.rounds);
    p.name = p.name || '';
    p.dead = !!p.dead;
  });
  if (!Array.isArray(st.mafia.kas)) st.mafia.kas = [];
  st.mafia.kas = st.mafia.kas.slice(0, MAFIA_MAX);
  fit(st.mafia.kas, MAFIA_MAX);
  fit(st.mafia.ka,  st.rounds);
  fit(st.doctor.ka, st.rounds);
  fit(st.spec.ka,   st.rounds);
}

function load() {
  var raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) {}
  if (!raw) return fresh();
  var st;
  try { st = JSON.parse(raw); } catch (e) { return fresh(); }
  if (!st || typeof st !== 'object') return fresh();
  var base = fresh();
  base.players = [];
  seq = 1;
  ['date', 'event', 'notes', 'pin'].forEach(function (k) { if (typeof st[k] === 'string') base[k] = st[k]; });
  if (st.rounds) base.rounds = st.rounds;
  if (Array.isArray(st.players)) base.players = st.players;
  ['mafia', 'sheriff', 'doctor', 'spec'].forEach(function (k) {
    if (st[k] && typeof st[k] === 'object') {
      for (var f in base[k]) if (st[k][f] !== undefined) base[k][f] = st[k][f];
    }
  });
  if (Array.isArray(st.pool)) base.pool = st.pool;
  if (Array.isArray(st.playlists)) base.playlists = st.playlists;
  else if (st.playlists && typeof st.playlists === 'object') {
    /* старое состояние: два плейлиста были привязаны к режиму */
    base.playlists = [
      { name: 'Naktis', url: st.playlists.night || '' },
      { name: 'Diena',  url: st.playlists.day   || '' }
    ];
  }
  if (typeof st.plCur === 'number') base.plCur = st.plCur;
  if (!base.players.length) for (var i = 0; i < START_PLAYERS; i++) base.players.push(newPlayer());
  normalize(base);
  return base;
}

var saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function () {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  }, 120);
}

function getPath(path) {
  var a = path.split('.'), o = S;
  for (var i = 0; i < a.length; i++) o = o[a[i]];
  return o;
}
function setPath(path, v) {
  var a = path.split('.'), o = S;
  for (var i = 0; i < a.length - 1; i++) o = o[a[i]];
  o[a[a.length - 1]] = v;
  save();
}

/* ── Блок 1: игроки ─────────────────────────────────── */

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderTable() {
  var h = '<tr><th class="c-num"></th><th class="c-name">ŽAIDĖJAS</th><th class="c-dead">💀</th>';
  for (var r = 0; r < S.rounds; r++) h += '<th class="c-v">#' + (r + 1) + '</th>';
  $('thPlayers').innerHTML = h + '</tr>';

  var b = '';
  S.players.forEach(function (p, i) {
    b += '<tr class="' + (p.dead ? 'is-dead' : '') + '" data-p="' + p.id + '">';
    b += '<td class="c-num">' + (i + 1) + '</td>';
    b += '<td class="c-name"><select class="pname"></select></td>';
    b += '<td class="c-dead"><button type="button" class="dead">💀</button></td>';
    for (var r = 0; r < S.rounds; r++) {
      b += '<td class="c-v"><button type="button" class="vote' + (p.votes[r] !== '' ? ' on' : '') +
           '" data-r="' + r + '">' + esc(p.votes[r]) + '</button></td>';
    }
    b += '</tr>';
  });
  $('tbPlayers').innerHTML = b;
  refreshNames();
}

/* Гость, уже сидящий за столом, из чужих списков убирается — дважды
   одного человека не посадишь. В своей строке он, понятно, остаётся. */
function sortedPool() {
  return S.pool.slice().sort(function (a, b) { return a.localeCompare(b, 'lt'); });
}

function refreshNames() {
  var taken = {};
  S.players.forEach(function (p) { if (p.name) taken[p.name] = p.id; });
  var pool = sortedPool();

  Array.prototype.forEach.call(document.querySelectorAll('select.pname'), function (el) {
    var p = playerById(el.closest('tr').dataset.p);
    if (!p) return;
    var h = '<option value=""></option>';
    pool.forEach(function (n) {
      if (taken[n] && taken[n] !== p.id) return;
      h += '<option value="' + esc(n) + '">' + esc(n) + '</option>';
    });
    el.innerHTML = h;
    el.value = p.name;
  });
}

function playerById(id) {
  for (var i = 0; i < S.players.length; i++) if (S.players[i].id === id) return S.players[i];
  return null;
}

$('tbPlayers').addEventListener('change', function (e) {
  if (!e.target.classList.contains('pname')) return;
  var p = playerById(e.target.closest('tr').dataset.p);
  if (!p) return;
  p.name = e.target.value;
  save();
  refreshNames();
  refreshOptions();
});

$('tbPlayers').addEventListener('click', function (e) {
  var tr = e.target.closest('tr');
  if (!tr) return;
  var p = playerById(tr.dataset.p);
  if (!p) return;

  if (e.target.classList.contains('dead')) {
    p.dead = !p.dead;
    tr.classList.toggle('is-dead', p.dead);
    save();
    refreshOptions();
    return;
  }
  if (e.target.classList.contains('vote')) openNumpad(e.target, p);
});

$('btnAddPlayer').addEventListener('click', function () {
  S.players.push(newPlayer());
  normalize(S); save(); renderTable(); refreshOptions();
});

/* «−» убирает последнюю строку, только если она пустая и строк больше стартовых */
$('btnDelPlayer').addEventListener('click', function () {
  var p = S.players[S.players.length - 1];
  if (S.players.length <= START_PLAYERS || !p) return;
  if (p.name || p.dead || p.votes.some(function (v) { return v !== ''; })) return;
  S.players.pop(); save(); renderTable(); refreshOptions();
});

$('btnAddRound').addEventListener('click', function () {
  if (S.rounds >= MAX_ROUNDS) return;
  S.rounds++;
  normalize(S); save(); renderTable(); renderRoles(); refreshOptions();
});

/* «−» убирает последний раунд, только если колонка пуста везде */
$('btnDelRound').addEventListener('click', function () {
  if (S.rounds <= 1) return;
  var i = S.rounds - 1, used = false;
  S.players.forEach(function (p) { if (p.votes[i] !== '') used = true; });
  if (S.mafia.ka[i] || S.doctor.ka[i] || S.spec.ka[i]) used = true;
  if (used) return;
  S.rounds--;
  normalize(S); save(); renderTable(); renderRoles(); refreshOptions();
});

/* ── Numpad у ячейки ────────────────────────────────── */

var pop = $('numpad'), popCell = null, popPlayer = null;

(function buildNumpad() {
  var h = '';
  for (var i = 1; i <= 9; i++) h += '<button type="button" class="key" data-k="' + i + '">' + i + '</button>';
  h += '<button type="button" class="key" data-k="x">⌫</button>';
  h += '<button type="button" class="key" data-k="0">0</button>';
  pop.innerHTML = h;
})();

function openNumpad(cell, p) {
  popCell = cell; popPlayer = p;
  pop.hidden = false;
  var r = cell.getBoundingClientRect(),
      w = pop.offsetWidth, hgt = pop.offsetHeight,
      left = Math.min(Math.max(8, r.left - 4), window.innerWidth - w - 8),
      top  = r.bottom + 6;
  if (top + hgt > window.innerHeight - 8) top = Math.max(8, r.top - hgt - 6);
  pop.style.left = left + 'px';
  pop.style.top = top + 'px';
}

function closeNumpad() { pop.hidden = true; popCell = null; popPlayer = null; }

pop.addEventListener('click', function (e) {
  var k = e.target.dataset.k;
  if (k === undefined || !popCell) return;
  var v = (k === 'x') ? '' : k;
  popPlayer.votes[+popCell.dataset.r] = v;
  popCell.textContent = v;
  popCell.classList.toggle('on', v !== '');
  save();
  closeNumpad();
});

document.addEventListener('click', function (e) {
  if (!pop.hidden && !pop.contains(e.target) && !e.target.classList.contains('vote')) closeNumpad();
}, true);
window.addEventListener('scroll', closeNumpad, true);
window.addEventListener('resize', closeNumpad);

/* ── Блок 2: роли ───────────────────────────────────── */

/* who=true — колонка KAS?: из такого списка выпадают игроки, уже занятые
   другой ролью. KĄ? остаётся полным — лечить и проверять можно кого угодно. */
function sel(path, who) {
  return '<select class="psel' + (who ? ' who' : '') + '" data-path="' + path + '"></select>';
}

function kaRow(path) {
  var h = '<div class="rk-wrap">';
  for (var i = 0; i < S.rounds; i++) {
    h += '<label class="rk"><span>#' + (i + 1) + '</span>' + sel(path + '.' + i) + '</label>';
  }
  return h + '</div>';
}

function renderRoles() {
  var h = '';
  h += '<div class="rc rc-head">VAIDMUO</div><div class="rc rc-head">KAS?</div><div class="rc rc-head">KĄ?</div>';

  h += '<div class="rc role-name">MAFIA</div>';
  var slots = '';
  for (var m = 0; m < MAFIA_MAX; m++) slots += sel('mafia.kas.' + m, true);
  h += '<div class="rc"><div class="who-wrap">' + slots + '</div></div>';
  h += '<div class="rc">' + kaRow('mafia.ka') + '</div>';

  h += '<div class="rc role-name">SHERIFF</div>';
  h += '<div class="rc">' + sel('sheriff.kas', true) + '</div>';
  h += '<div class="rc">' + sel('sheriff.ka') + '</div>';

  h += '<div class="rc role-name">DOCTOR</div>';
  h += '<div class="rc">' + sel('doctor.kas', true) + '</div>';
  h += '<div class="rc">' + kaRow('doctor.ka') + '</div>';

  var opts = '<option value="">Vaidmuo</option>';
  SPEC_ROLES.forEach(function (r) { opts += '<option value="' + esc(r) + '">' + esc(r) + '</option>'; });
  opts += '<option value="__custom">Kita…</option>';
  h += '<div class="rc"><select id="specRole">' + opts + '</select>' +
       '<input class="spec-custom" id="specCustom" type="text" placeholder="Vaidmuo" autocomplete="off" hidden></div>';
  h += '<div class="rc">' + sel('spec.kas', true) + '</div>';
  h += '<div class="rc">' + kaRow('spec.ka') + '</div>';

  $('roles').innerHTML = h;
  syncSpec();
}

function syncSpec() {
  var r = S.spec.role || '',
      isList = SPEC_ROLES.indexOf(r) !== -1,
      selEl = $('specRole'), inp = $('specCustom');
  if (!selEl) return;
  selEl.value = r === '' ? '' : (isList ? r : '__custom');
  inp.hidden = !(r !== '' && !isList);
  inp.value = isList ? '' : r;
}

/* Опции всех dropdown'ов + чипы мафии. Значения — id игроков, поэтому
   переименование не рвёт выбор. Игрок без имени из списков выпадает. */
function refreshOptions() {
  var named = S.players.filter(function (p) { return p.name.trim() !== ''; });
  var ids = {};
  named.forEach(function (p) { ids[p.id] = p; });

  var all = document.querySelectorAll('select.psel');

  /* игрока удалили или стёрли имя — выбор, который на него ссылался, снимается */
  Array.prototype.forEach.call(all, function (s2) {
    var v = getPath(s2.dataset.path);
    if (v && !ids[v]) setPath(s2.dataset.path, '');
  });

  /* кто уже занят ролью: id -> путь того поля, где он выбран */
  var taken = {};
  Array.prototype.forEach.call(document.querySelectorAll('select.psel.who'), function (s2) {
    var v = getPath(s2.dataset.path);
    if (v) taken[v] = s2.dataset.path;
  });

  function opts(mine) {
    var h = '<option value=""></option>';
    named.forEach(function (p) {
      if (mine && taken[p.id] && taken[p.id] !== mine) return;   // занят другой ролью
      h += '<option value="' + p.id + '">' + (p.dead ? '† ' : '') + esc(p.name) + '</option>';
    });
    return h;
  }

  var full = opts(null);
  Array.prototype.forEach.call(all, function (s2) {
    var path = s2.dataset.path, v = getPath(path) || '';
    s2.innerHTML = s2.classList.contains('who') ? opts(path) : full;
    s2.value = v;
  });
}

$('roles').addEventListener('change', function (e) {
  if (e.target.classList.contains('psel')) {
    setPath(e.target.dataset.path, e.target.value);
    if (e.target.classList.contains('who')) refreshOptions();
    return;
  }
  if (e.target.id === 'specRole') {
    var v = e.target.value;
    if (v === '__custom') { S.spec.role = $('specCustom').value || ' '; $('specCustom').hidden = false; $('specCustom').focus(); }
    else { S.spec.role = v; $('specCustom').hidden = true; $('specCustom').value = ''; }
    save();
  }
});

$('roles').addEventListener('input', function (e) {
  if (e.target.id === 'specCustom') { S.spec.role = e.target.value; save(); }
});


/* ── Шапка, заметки ─────────────────────────────────── */

$('fDate').addEventListener('input', function () { S.date = this.value; save(); });
$('fEvent').addEventListener('input', function () { S.event = this.value; save(); });

var notes = $('fNotes');
function growNotes() { notes.style.height = 'auto'; notes.style.height = notes.scrollHeight + 'px'; }
notes.addEventListener('input', function () { S.notes = this.value; growNotes(); save(); });

/* Своя шторка у заметок: отдельная от Naktis/Diena и без PIN — прикрыть
   от подошедшего игрока на пару секунд. Текст под ней не трогается.
   При загрузке всегда открыто. */
var notesOff = false;
function setNotes(off) {
  notesOff = off;
  document.body.classList.toggle('notes-off', off);
  $('notesBtn').classList.toggle('is-off', off);
  if (off && document.activeElement === notes) notes.blur();
}
$('notesBtn').addEventListener('click', function () { setNotes(!notesOff); });

/* ── Naktis / Diena ─────────────────────────────────── */

function setMode(m) {
  mode = m;
  document.body.classList.toggle('day', m === 'day');
  $('modeBtn').classList.toggle('is-off', m === 'day');
  if (m === 'day' && document.activeElement && document.activeElement.blur) document.activeElement.blur();
  closeNumpad();
}

$('modeBtn').addEventListener('click', function () {
  if (mode === 'night') { if (S.pin) setMode('day'); else openPin('set'); }
  else openPin('unlock');
});

/* ── PIN ────────────────────────────────────────────── */

var pinModal = $('pinModal'), pinKind = null, pinBuf = '', pinFirst = '';

(function buildPin() {
  var h = '';
  for (var i = 1; i <= 9; i++) h += '<button type="button" class="pin-key" data-k="' + i + '">' + i + '</button>';
  h += '<span></span><button type="button" class="pin-key" data-k="0">0</button>' +
       '<button type="button" class="pin-key" data-k="x">⌫</button>';
  $('pinGrid').innerHTML = h;
  $('pinDots').innerHTML = new Array(PIN_LEN + 1).join('<i></i>');
})();

function pinDots() {
  var d = $('pinDots').children;
  for (var i = 0; i < d.length; i++) d[i].classList.toggle('on', i < pinBuf.length);
}

function pinErr() {
  var box = $('pinDots');
  box.classList.add('err');
  setTimeout(function () { box.classList.remove('err'); }, 320);
  pinBuf = ''; pinDots();
}

function openPin(kind) {
  pinKind = kind; pinBuf = ''; pinFirst = '';
  $('pinTitle').textContent = (kind === 'set') ? 'Naujas PIN' : 'PIN kodas';
  pinDots();
  pinModal.hidden = false;
}
function closePin() { pinModal.hidden = true; pinKind = null; pinBuf = ''; pinFirst = ''; }

$('pinClose').addEventListener('click', closePin);

$('pinGrid').addEventListener('click', function (e) {
  var k = e.target.dataset.k;
  if (k === undefined) return;
  if (k === 'x') { pinBuf = pinBuf.slice(0, -1); pinDots(); return; }
  if (pinBuf.length >= PIN_LEN) return;
  pinBuf += k;
  pinDots();
  if (pinBuf.length < PIN_LEN) return;

  setTimeout(function () {
    if (pinKind === 'unlock') {
      if (pinBuf === S.pin) { closePin(); setMode('night'); }
      else pinErr();
      return;
    }
    if (!pinFirst) {
      pinFirst = pinBuf; pinBuf = '';
      $('pinTitle').textContent = 'Pakartokite';
      pinDots();
    } else if (pinBuf === pinFirst) {
      S.pin = pinBuf; save(); closePin(); setMode('day');
    } else {
      pinFirst = ''; $('pinTitle').textContent = 'Naujas PIN'; pinErr();
    }
  }, 90);
});

/* ── Вход в skydelis ────────────────────────────────── */
/* Замок от случайных гостей по ссылке, не защита: исходник публичный.
   В коде хеш, а не цифры; верный код запоминается на устройстве. */

var GATE_KEY  = 'mafiaHostTool.gate',
    GATE_LEN  = 6,
    GATE_HASH = '182b93eee32b4d05869180416ee330de3a891e23de038a792373b370677a7b92';
var gateBuf = '';

function gateDots() {
  var d = $('gateDots').children;
  for (var i = 0; i < d.length; i++) d[i].classList.toggle('on', i < gateBuf.length);
}

function gateCheck(code) {
  var data = new TextEncoder().encode('mafia-gate:' + code);
  return crypto.subtle.digest('SHA-256', data).then(function (buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) {
      return ('0' + b.toString(16)).slice(-2);
    }).join('') === GATE_HASH;
  });
}

(function () {
  var h = '';
  for (var i = 1; i <= 9; i++) h += '<button type="button" class="pin-key" data-k="' + i + '">' + i + '</button>';
  h += '<span></span><button type="button" class="pin-key" data-k="0">0</button>' +
       '<button type="button" class="pin-key" data-k="x">⌫</button>';
  $('gateGrid').innerHTML = h;
  $('gateDots').innerHTML = new Array(GATE_LEN + 1).join('<i></i>');
})();

$('gateGrid').addEventListener('click', function (e) {
  var b = e.target.closest('.pin-key'); if (!b) return;
  var k = b.dataset.k;
  if (k === 'x') { gateBuf = gateBuf.slice(0, -1); gateDots(); return; }
  if (gateBuf.length >= GATE_LEN) return;
  gateBuf += k;
  gateDots();
  if (gateBuf.length < GATE_LEN) return;
  gateCheck(gateBuf).then(function (ok) {
    if (ok) {
      try { localStorage.setItem(GATE_KEY, 'ok'); } catch (err) {}
      document.documentElement.classList.add('unlocked');
      gateBuf = ''; gateDots();
      return;
    }
    var box = $('gateDots');
    box.classList.remove('err'); void box.offsetWidth; box.classList.add('err');
    setTimeout(function () { box.classList.remove('err'); }, 320);
    gateBuf = ''; gateDots();
  });
});

/* ── Музыка: пульт для приложения Spotify ───────────── */
/* Звук идёт из приложения Spotify на планшете, страница только шлёт ему
   команды через Web API. Встроенный плеер (iframe) без входа играл
   30-секундные отрывки. Вход — PKCE без сервера: Client ID не секрет,
   токены лежат только в этом браузере. Управлять воспроизведением
   Spotify позволяет только аккаунту с Premium. */

var SP_ID       = '9b4b85585f334f40865046968c075264',
    SP_KEY      = 'mafiaHostTool.spotify',
    SP_REDIRECT = 'https://mafiain.lt/host-tool/',   // ровно как в Spotify Dashboard
    SP_SCOPES   = 'user-read-playback-state user-modify-playback-state user-read-currently-playing',
    SP_POLL_MS  = 4000;

var sp = null,            // { access, refresh, exp }
    spDevice = null,
    spPlaying = false,
    spVolBusy = 0;

function spLoad() {
  try { sp = JSON.parse(localStorage.getItem(SP_KEY)); } catch (e) { sp = null; }
  if (!sp || !sp.refresh) sp = null;
}
function spSave() {
  try {
    if (sp) localStorage.setItem(SP_KEY, JSON.stringify(sp));
    else localStorage.removeItem(SP_KEY);
  } catch (e) {}
}

function b64url(buf) {
  var s = '', b = new Uint8Array(buf);
  for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function randStr(n) {
  var a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return b64url(a).slice(0, n);
}

function spLogin() {
  var verifier = randStr(64), state = randStr(16);
  try { localStorage.setItem(SP_KEY + '.pkce', JSON.stringify({ v: verifier, s: state })); } catch (e) {}
  crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)).then(function (h) {
    location.href = 'https://accounts.spotify.com/authorize?' + new URLSearchParams({
      client_id: SP_ID,
      response_type: 'code',
      redirect_uri: SP_REDIRECT,
      scope: SP_SCOPES,
      code_challenge_method: 'S256',
      code_challenge: b64url(h),
      state: state
    }).toString();
  });
}

function spToken(params) {
  params.client_id = SP_ID;
  return fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString()
  }).then(function (r) {
    return r.json().then(function (j) { if (!r.ok) throw j; return j; });
  }).then(function (j) {
    sp = {
      access: j.access_token,
      refresh: j.refresh_token || (sp && sp.refresh),
      exp: Date.now() + (j.expires_in - 60) * 1000
    };
    spSave();
  });
}

/* Возврат со страницы входа Spotify: ?code=…&state=…
   true — мы только что вернулись, и пульт стоит открыть на вкладке музыки. */
function spCallback() {
  var q = new URLSearchParams(location.search);
  if (!q.has('code') && !q.has('error')) return Promise.resolve(false);
  var pk = null;
  try {
    pk = JSON.parse(localStorage.getItem(SP_KEY + '.pkce'));
    localStorage.removeItem(SP_KEY + '.pkce');
  } catch (e) {}
  history.replaceState(null, '', location.pathname);
  if (!q.has('code') || !pk || pk.s !== q.get('state')) return Promise.resolve(true);
  return spToken({
    grant_type: 'authorization_code',
    code: q.get('code'),
    redirect_uri: SP_REDIRECT,
    code_verifier: pk.v
  }).then(function () { return true; }, function () { return true; });
}

/* Токен живёт час. Отозванный вход (invalid_grant) — выходим; сбой сети — нет. */
function spFresh() {
  if (!sp) return Promise.reject('auth');
  if (Date.now() < sp.exp) return Promise.resolve();
  return spToken({ grant_type: 'refresh_token', refresh_token: sp.refresh }).catch(function (e) {
    if (e && e.error === 'invalid_grant') { sp = null; spSave(); spRender(); throw 'auth'; }
    throw e;
  });
}

function spApi(method, path, body, retried) {
  return spFresh().then(function () {
    return fetch('https://api.spotify.com/v1' + path, {
      method: method,
      headers: { Authorization: 'Bearer ' + sp.access, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
  }).then(function (r) {
    if (r.status === 401 && !retried) { sp.exp = 0; return spApi(method, path, body, true); }
    if (r.status === 204 || r.status === 202) return null;
    return r.text().then(function (t) {
      var j = null;
      try { j = t ? JSON.parse(t) : null; } catch (e) {}
      if (!r.ok) throw { status: r.status, reason: j && j.error && j.error.reason };
      return j;
    });
  });
}

/* Активное устройство, иначе планшет или телефон, иначе первое в списке.
   Устройство в списке есть, только пока приложение Spotify на нём открыто. */
function spPickDevice() {
  return spApi('GET', '/me/player/devices').then(function (j) {
    var list = (j && j.devices) || [],
        d = list.filter(function (x) { return x.is_active; })[0] ||
            list.filter(function (x) { return x.type === 'Tablet' || x.type === 'Smartphone'; })[0] ||
            list[0];
    if (!d) throw { reason: 'NO_DEVICE' };
    spDevice = d;
    return d.id;
  });
}

/* Команда воспроизведению. Нет активного устройства (404) — находим его
   в списке и повторяем команду уже с его id. */
function spCmd(method, path, body) {
  if (!sp) { spStatus('Pirmiausia prisijunkite prie Spotify', true); return Promise.resolve(); }
  return spApi(method, path, body).catch(function (e) {
    if (!e || e.status !== 404) throw e;
    return spPickDevice().then(function (id) {
      return spApi(method, path + (path.indexOf('?') < 0 ? '?' : '&') + 'device_id=' + id, body);
    });
  }).then(function () { setTimeout(spRefresh, 600); }, spFail);
}

function spFail(e) {
  var r = e && e.reason, msg = 'Nepavyko, bandykite dar kartą';
  if (r === 'NO_DEVICE' || r === 'NO_ACTIVE_DEVICE') msg = 'Atidarykite Spotify programėlę planšetėje';
  else if (r === 'PREMIUM_REQUIRED') msg = 'Reikia Spotify Premium';
  else if (e === 'auth') msg = 'Prisijunkite prie Spotify iš naujo';
  spStatus(msg, true);
}

function spStatus(t, err) {
  var el = $('spStatus');
  el.textContent = t || '';
  el.classList.toggle('err', !!err);
}

/* Ссылка на плейлист (или голый ID) → URI для Spotify */
function spUri(raw) {
  var s = String(raw || '').trim(),
      m = s.match(/(playlist|album|track|episode|show|artist)[\/:]([A-Za-z0-9]{16,})/);
  if (!m && /^[A-Za-z0-9]{16,}$/.test(s)) m = [null, 'playlist', s];
  return m ? { type: m[1], uri: 'spotify:' + m[1] + ':' + m[2] } : null;
}

function spStart(i) {
  var u = spUri(S.playlists[i] && S.playlists[i].url);
  if (!u) return;
  var single = u.type === 'track' || u.type === 'episode';
  spCmd('PUT', '/me/player/play', single ? { uris: [u.uri] } : { context_uri: u.uri });
}

function spShow(item) {
  var imgs = item ? ((item.album && item.album.images) || item.images || []) : [],
      cover = $('spCover');
  $('spTrack').textContent = item ? item.name : '—';
  $('spArtist').textContent = item
    ? (item.artists || []).map(function (a) { return a.name; }).join(', ') || (item.show && item.show.name) || ''
    : '';
  var src = imgs.length ? imgs[Math.min(1, imgs.length - 1)].url : '';
  if (src) { if (cover.getAttribute('src') !== src) cover.src = src; }
  else cover.removeAttribute('src');
}

function spPlayBtn() {
  var b = $('spPlay');
  b.classList.toggle('is-playing', spPlaying);
  b.setAttribute('aria-label', spPlaying ? 'Pauzė' : 'Groti');
}

function spRefresh() {
  if (!sp) return;
  spApi('GET', '/me/player').then(function (j) {
    if (!j || !j.device) {
      spPlaying = false; spPlayBtn(); spShow(null);
      spStatus('Niekas negroja');
      return;
    }
    spDevice = j.device;
    spPlaying = !!j.is_playing;
    spPlayBtn();
    spShow(j.item);
    spStatus(j.device.name);
    /* у части телефонов Spotify не даёт менять громкость извне — тогда кнопки планшета */
    $('spVolWrap').hidden = j.device.supports_volume === false;
    if (Date.now() > spVolBusy && j.device.volume_percent != null) $('spVol').value = j.device.volume_percent;
  }, function (e) { if (e === 'auth') spFail(e); });
}

function spRender() {
  $('spLogin').hidden = !!sp;
  $('spRemote').hidden = !sp;
  $('btnSpOut').hidden = !sp;
}

$('btnSpLogin').addEventListener('click', spLogin);

$('btnSpOut').addEventListener('click', function () {
  sp = null; spSave(); spRender();
});

$('spPlay').addEventListener('click', function () {
  spPlaying = !spPlaying;            // отвечаем сразу, не дожидаясь Spotify
  spPlayBtn();
  spCmd('PUT', spPlaying ? '/me/player/play' : '/me/player/pause');
});
$('spPrev').addEventListener('click', function () { spCmd('POST', '/me/player/previous'); });
$('spNext').addEventListener('click', function () { spCmd('POST', '/me/player/next'); });

var volTimer = null;
$('spVol').addEventListener('input', function () {
  var v = this.value;
  spVolBusy = Date.now() + 2500;     // опрос не перетаскивает ползунок из-под пальца
  clearTimeout(volTimer);
  volTimer = setTimeout(function () { spCmd('PUT', '/me/player/volume?volume_percent=' + v); }, 250);
});

setInterval(function () { if (!document.hidden) spRefresh(); }, SP_POLL_MS);
document.addEventListener('visibilitychange', function () { if (!document.hidden) spRefresh(); });

/* Кнопка на каждый заполненный плейлист. Пустые не показываем —
   переключать нечего, а ряд пустых кнопок только мешает. */
function renderPlTabs() {
  var h = '';
  S.playlists.forEach(function (p, i) {
    if (!p.url && !p.name) return;
    h += '<button type="button" class="pl-tab' + (i === S.plCur ? ' on' : '') +
         '" data-i="' + i + '">' + esc(p.name || String(i + 1)) + '</button>';
  });
  $('plTabs').innerHTML = h;
}

$('plTabs').addEventListener('click', function (e) {
  var b = e.target.closest('.pl-tab');
  if (!b) return;
  S.plCur = +b.dataset.i;
  save();
  renderPlTabs();
  spStart(S.plCur);
});

$('btnCfg').addEventListener('click', function () {
  var box = $('cfgBox');
  box.hidden = !box.hidden;
  this.classList.toggle('on', !box.hidden);
});

$('btnCfgSave').addEventListener('click', function () {
  Array.prototype.forEach.call(document.querySelectorAll('.pl-name'), function (el) {
    S.playlists[+el.dataset.i].name = el.value.trim();
  });
  Array.prototype.forEach.call(document.querySelectorAll('.pl-url'), function (el) {
    S.playlists[+el.dataset.i].url = el.value.trim();
  });
  if (!S.playlists[S.plCur].url) {
    var first = -1;
    S.playlists.forEach(function (p, i) { if (first < 0 && p.url) first = i; });
    S.plCur = first < 0 ? 0 : first;
  }
  save();
  renderPlTabs();
  $('cfgBox').hidden = true;
  $('btnCfg').classList.remove('on');
});

/* ── Вкладки (портрет) ──────────────────────────────── */

function goTab(name) {
  document.body.dataset.tab = name;
  Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (x) {
    x.classList.toggle('on', x.dataset.go === name);
  });
}
Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) {
  t.addEventListener('click', function () { goTab(t.dataset.go); });
});
goTab('sablonas');

/* ── Копия / Įkelti / Spausdinti / Naujas žaidimas ──── */

$('btnExport').addEventListener('click', function () {
  var blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }),
      a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'mafia-' + (S.date || new Date().toISOString().slice(0, 10)) + '.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
});

$('btnImport').addEventListener('click', function () { $('fileInput').click(); });

$('fileInput').addEventListener('change', function () {
  var file = this.files && this.files[0];
  if (!file) return;
  var fr = new FileReader();
  fr.onload = function () {
    try {
      var st = JSON.parse(fr.result);
      if (!st || typeof st !== 'object') throw 0;
      try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
      S = load();
      renderAll();
      save();
    } catch (e) {
      var b = $('btnImport');
      b.classList.add('bad');
      setTimeout(function () { b.classList.remove('bad'); }, 1200);
    }
  };
  fr.readAsText(file);
  this.value = '';
});

/* ── Svečiai: пул имён ──────────────────────────────── */

function renderPool() {
  var seated = {};
  S.players.forEach(function (p) { if (p.name) seated[p.name] = 1; });
  var h = '';
  sortedPool().forEach(function (n) {
    h += '<div class="pool-item' + (seated[n] ? ' seated' : '') + '">' +
         '<span>' + esc(n) + '</span>' +
         '<button type="button" class="pool-del" data-n="' + esc(n) + '">✕</button></div>';
  });
  $('poolList').innerHTML = h;
}

$('btnPool').addEventListener('click', function () {
  renderPool();
  $('poolModal').hidden = false;
  $('poolInput').focus();
});
$('poolClose').addEventListener('click', function () { $('poolModal').hidden = true; });
$('poolModal').addEventListener('click', function (e) {
  if (e.target === this) this.hidden = true;    // тап мимо окна закрывает
});

function addGuest() {
  var v = $('poolInput').value.trim();
  if (!v) return;
  var dup = S.pool.some(function (n) { return n.toLowerCase() === v.toLowerCase(); });
  if (!dup) S.pool.push(v);
  $('poolInput').value = '';
  $('poolInput').focus();
  save();
  renderPool();
  refreshNames();
}
$('poolAdd').addEventListener('click', addGuest);
$('poolInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') addGuest(); });

/* Убрали гостя из пула — встаёт и из-за стола: иначе в строке осталось бы
   имя, которого нет ни в одном списке. */
$('poolList').addEventListener('click', function (e) {
  var b = e.target.closest('.pool-del');
  if (!b) return;
  var n = b.dataset.n;
  S.pool = S.pool.filter(function (x) { return x !== n; });
  S.players.forEach(function (p) { if (p.name === n) p.name = ''; });
  save();
  renderPool();
  refreshNames();
  refreshOptions();
});

$('btnPrint').addEventListener('click', function () { window.print(); });

/* Партия закончилась, компания та же: имена на местах, всё остальное с нуля. */
function clearGame() {
  S.rounds = START_ROUNDS;
  S.players.forEach(function (p) {
    p.dead = false;
    p.votes = fit([], S.rounds);
  });
  S.mafia   = { kas: [], ka: [] };
  S.sheriff = { kas: '', ka: '' };
  S.doctor  = { kas: '', ka: [] };
  S.spec    = { role: '', kas: '', ka: [] };
  S.notes = '';
  normalize(S);
}

$('btnSession').addEventListener('click', function () {
  if (!confirm('Nauja sesija?')) return;
  clearGame();
  save();
  renderAll();
  setMode('night');
  setNotes(false);
});

$('btnReset').addEventListener('click', function () {
  if (!confirm('Naujas žaidimas?')) return;
  clearGame();
  S.date = '';
  S.event = '';
  S.players = [];
  for (var i = 0; i < START_PLAYERS; i++) S.players.push(newPlayer());
  normalize(S);
  save();
  renderAll();
  setMode('night');
  setNotes(false);
});

/* ── Старт ──────────────────────────────────────────── */

function renderAll() {
  $('fDate').value  = S.date;
  $('fEvent').value = S.event;
  $('fNotes').value = S.notes;
  Array.prototype.forEach.call(document.querySelectorAll('.pl-name'), function (el) {
    el.value = S.playlists[+el.dataset.i].name;
  });
  Array.prototype.forEach.call(document.querySelectorAll('.pl-url'), function (el) {
    el.value = S.playlists[+el.dataset.i].url;
  });
  renderPlTabs();
  renderTable();
  renderRoles();
  refreshOptions();
  growNotes();
}

S = load();
renderAll();
setMode('night');
setNotes(false);
save();

spLoad();
spCallback().then(function (back) {
  spRender();
  if (back) goTab('muzika');
  spRefresh();
});

if (navigator.storage && navigator.storage.persist) navigator.storage.persist();

window.addEventListener('beforeunload', function () {
  clearTimeout(saveTimer);
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
});

})();
