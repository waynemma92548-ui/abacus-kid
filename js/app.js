/* 畫面與流程：地圖、上課（看示範 → 跟著做 → 自己做）、結果、更衣室、家長頁。
 * 規則都在 abacus.js / lessons.js / store.js，這裡只負責畫面和按鈕。
 */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var Z = Zhuyin.html;
  var storage = (function () {
    var s;
    try { s = window.localStorage; s.getItem('x'); }
    catch (e) { return { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} }; }
    if (!window.ABACUS_PREVIEW) return s;
    // 預覽版（/preview/，2026-11-28）：和正式版同一個網域，localStorage 是共用的，
    // 所以 key 都加 preview: 前綴，試玩不會動到小朋友正式的進度；第一次打開時複製一份正式版進度過來
    var P = 'preview:';
    if (s.getItem(P + 'copied') === null) {
      for (var i = 0; i < s.length; i++) {
        var k = s.key(i);
        if (k && k.indexOf('abacus_kids') === 0) s.setItem(P + k, s.getItem(k));
      }
      s.setItem(P + 'copied', '1');
    }
    return {
      getItem: function (k) { return s.getItem(P + k); },
      setItem: function (k, v) { s.setItem(P + k, v); },
      removeItem: function (k) { s.removeItem(P + k); }
    };
  })();
  // 小朋友帳號：每個人一份進度（2026-11-27）
  var meta = Store.loadProfiles(storage), curId = meta.current;
  // 預覽版（2026-11-28 使用者要求）：關卡全部打開，方便試玩新區域；正式版照原本進度一關一關開
  function loadState(id) {
    var x = Store.load(storage, id);
    if (window.ABACUS_PREVIEW) x.unlockAll = true;
    return x;
  }
  var st = loadState(curId);
  var speaker = Voice.makeSpeaker(window.speechSynthesis || null, function () { return st.voice; });
  // 說話時同時在上課畫面顯示字幕（含注音）；故事、說明這種畫面上已經有字的，傳 {caption: false}
  var say = function (text, opts) {
    opts = opts || {};
    var cap = document.getElementById('caption'), lesson = document.getElementById('scr-lesson');
    if (cap && lesson && !lesson.hidden && opts.caption !== false) cap.innerHTML = Z(Voice.spoken(opts.captionText !== undefined ? opts.captionText : text).replace(/\s+/g, ' '));
    return speaker.say(text, opts);
  };
  function clearCaption() { var cap = document.getElementById('caption'); if (cap) cap.innerHTML = ''; }
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var PRAISE = ['答對了！好棒！', '太棒了！', '好厲害！', '答對了，繼續加油！', '完全正確！'];
  var KIND_NAMES = { direct: '直接撥', five: '五的好朋友', ten: '十的好朋友', set: '撥出數字', read: '看珠說數字' };

  function persist() { Store.save(storage, st, curId); $('stars').textContent = st.stars; }

  function heroSvg(state, id, crop) { Heroes.setArt(!state.classicArt); return Heroes.svg(state.char, Store.curWear(state), id, crop, state.form); }
  function faceCrop(ch, form) { return ch === 'truck' ? (form === 'robot' ? 'robohead' : 'side') : 'head'; }
  function curName() { var p = meta.list.filter(function (x) { return x.id === curId; })[0]; return p ? p.name : ''; }
  function renderWhoChip() {
    $('who-name').textContent = curName();
    $('who-face').innerHTML = heroSvg(st, 'whochip', faceCrop(st.char, st.form));
  }

  // ---- 誰要玩？（開始畫面）----
  function renderWhoList() {
    var html = meta.list.map(function (p) {
      var s2 = p.id === curId ? st : Store.load(storage, p.id);
      return '<button class="who-card" data-pid="' + p.id + '"><span class="who-pic">' + heroSvg(s2, 'who' + p.id, faceCrop(s2.char, s2.form)) +
        '</span><b>' + escapeHtml(p.name) + '</b><span class="who-stars">⭐ ' + s2.stars + '</span></button>';
    }).join('');
    if (meta.list.length < Store.MAX_PROFILES) html += '<button class="who-card add" data-pid="+"><span class="plus">＋</span><span class="addtxt">' + Z('新增小朋友') + '</span></button>';
    $('who-list').innerHTML = html;
  }
  function pickProfile(id) {
    curId = id; meta.current = id; Store.saveProfiles(storage, meta);
    st = loadState(id);
    speaker.refresh();
    renderWhoChip();
    audio();
    say('歡迎來到珠心算小英雄，' + curName() + '！選一個關卡開始吧。');
    goMap();
  }
  function addProfile() {
    var name = window.prompt('小朋友的名字（最多 8 個字）', '');
    if (name === null) return null;
    var p = Store.addProfile(meta, name);
    if (!p) { window.alert('最多 ' + Store.MAX_PROFILES + ' 個小朋友'); return null; }
    Store.saveProfiles(storage, meta);
    return p;
  }
  function showWho() {
    phase = ''; speaker.stop(); stopDemo();
    renderWhoList(); show('scr-start');
  }

  // ---- 音效（WebAudio 簡單的叮聲，不用音檔）----
  var actx = null;
  function audio() {
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } }
    return actx;
  }
  function tone(freq, at, len, vol) {
    var a = audio(); if (!a) return;
    var o = a.createOscillator(), g = a.createGain(), t = a.currentTime + at;
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + len + 0.02);
  }
  function tick() { tone(1200, 0, 0.06, 0.12); }
  function chime() { tone(784, 0, 0.25, 0.2); tone(988, 0.12, 0.25, 0.2); tone(1319, 0.24, 0.4, 0.2); }

  function show(id) {
    document.querySelectorAll('.screen').forEach(function (s) { s.hidden = s.id !== id; });
    window.scrollTo(0, 0);
  }
  // 2026-11-27 使用者：撥珠子的時候整個畫面會跟著動。手指從算盤上開始滑，就不捲動頁面（只有珠子會動），
  // iPad Safari 的「橡皮筋」回彈也一起擋（touchmove 要 passive:false 才能 preventDefault）。
  // 只擋算盤上的手勢：手機等小螢幕上課畫面可能比螢幕長，其他地方還是要能捲。
  document.addEventListener('touchmove', function (e) {
    if (e.target.closest && e.target.closest('.abacus')) e.preventDefault();
  }, { passive: false });

  // ---- 算盤畫面 ----
  function AbacusView(el, count) {
    var rods = Abacus.fromValue(0, count), onTap = null, enabled = true, showDigits = true, cols = [];
    el.innerHTML = '';
    for (var i = count - 1; i >= 0; i--) {
      var col = document.createElement('div');
      col.className = 'rod';
      var lower = '';
      for (var k = 0; k < 4; k++) lower += '<button class="bead" data-rod="' + i + '" data-part="l" data-k="' + k + '" aria-label="一珠"></button>';
      col.innerHTML = '<div class="upper"><i class="stick"></i><button class="bead five" data-rod="' + i +
        '" data-part="u" aria-label="五珠"></button></div><div class="beam"></div><div class="lower"><i class="stick"></i>' +
        lower + '</div><div class="rodlabel"><span class="rname">' + Zhuyin.html(Abacus.ROD_NAMES[i]) + '</span><b class="digit"></b></div>';
      el.appendChild(col);
      cols[i] = col;
    }
    el.onpointerdown = function (e) {
      var b = e.target.closest('.bead');
      if (!b || !enabled) return;
      e.preventDefault();
      var r = +b.dataset.rod;
      var next = b.dataset.part === 'u' ? Abacus.tapUpper(rods, r) : Abacus.tapLower(rods, r, +b.dataset.k);
      if (Abacus.same(next, rods)) return;
      set(next); tick();
      if (onTap) onTap(Abacus.clone(rods));
    };
    function render() {
      rods.forEach(function (r, i) {
        var col = cols[i];
        col.querySelector('[data-part="u"]').classList.toggle('on', r.u === 1);
        col.querySelectorAll('[data-part="l"]').forEach(function (b) {
          var k = +b.dataset.k;
          b.classList.toggle('on', k < r.l);
          b.style.setProperty('--pos', k < r.l ? k : k + 1);
        });
        col.querySelector('.digit').textContent = showDigits ? Abacus.digitOf(r) : '';
      });
    }
    function set(r) { rods = Abacus.clone(r); render(); }
    function glow(list) {
      el.querySelectorAll('.bead.glow').forEach(function (b) { b.classList.remove('glow'); });
      (list || []).forEach(function (g) {
        var sel = '[data-rod="' + g.rod + '"][data-part="' + g.part + '"]' + (g.part === 'l' ? '[data-k="' + g.k + '"]' : '');
        var b = el.querySelector(sel);
        if (b) b.classList.add('glow');
      });
    }
    render();
    return {
      get: function () { return Abacus.clone(rods); }, set: set, glow: glow,
      onTap: function (fn) { onTap = fn; },
      enable: function (v) { enabled = v; el.classList.toggle('locked', !v); },
      digits: function (v) { showDigits = v; render(); }
    };
  }

  // 一珠靠樑的珠子（看珠說數字的提示用）
  function activeBeads(rods) {
    var out = [];
    rods.forEach(function (r, i) {
      if (r.u) out.push({ rod: i, part: 'u' });
      for (var k = 0; k < r.l; k++) out.push({ rod: i, part: 'l', k: k });
    });
    return out;
  }

  function readSay(n, rods) {
    var parts = [], names = Abacus.ROD_NAMES;
    for (var i = rods.length - 1; i >= 0; i--) {
      var r = rods[i];
      if (!r.u && !r.l && !(i === 0 && n === 0)) continue;
      var bits = [];
      if (r.u) bits.push('五珠靠樑是 5');
      if (r.l) bits.push('一珠有 ' + r.l + ' 顆');
      if (!bits.length) bits.push('沒有珠子靠樑，是 0');
      parts.push((rods.length > 1 ? names[i] + '：' : '') + bits.join('，'));
    }
    return parts.join('。') + '。所以是 ' + n;
  }

  // ---- 地圖 ----
  // 關卡進度用星星表示（2026-11-26 使用者：小朋友看不懂 %）：最好那次答對幾題就幾顆金星，差的用黑星，旁邊寫「拿到幾顆 / 最多幾顆」
  function starRow(l, rec) {
    var total = l.count || 0, got = Store.lessonStars(rec, total), h = '';
    for (var i = 0; i < total; i++) h += '<i class="' + (i < got ? 'on' : 'off') + '">★</i>';
    return '<span class="srow" aria-label="' + got + ' / ' + total + '">' + h + '<b class="scount">' + got + ' / ' + total + '</b></span>';
  }
  // 地圖一次只顯示一區（2026-11-27 第二區上線後一頁放不下），上面用分頁切換；預設是正在玩的那一區
  var mapWorld = 0;
  function playableWorlds() {
    return Lessons.WORLDS.filter(function (w) {
      return Lessons.LESSONS.some(function (l) { return l.world === w.id && !l.comingSoon; });
    });
  }
  function currentWorld() {
    // 第一個還沒全部過關的區；全部都過了就停在最後一區
    var ws = playableWorlds();
    for (var i = 0; i < ws.length; i++) if (!Store.worldDone(Lessons.LESSONS, st, ws[i].id)) return ws[i].id;
    return ws[ws.length - 1].id;
  }
  function renderMap() {
    var ws = playableWorlds();
    if (!ws.some(function (w) { return w.id === mapWorld; })) mapWorld = currentWorld();
    var later = Lessons.WORLDS.filter(function (w) { return ws.indexOf(w) < 0; });
    var html = '<div class="wtabs">' + ws.map(function (w) {
      var done = Store.worldDone(Lessons.LESSONS, st, w.id);
      return '<button class="wtab' + (w.id === mapWorld ? ' on' : '') + '" data-world="' + w.id + '">' + Z(w.note) + ' ' + Z(w.place) +
        (done ? ' ✅' : '') + '</button>';
    }).join('') + later.map(function (w) {   // 還沒做的區：灰色分頁＋即將推出
      return '<button class="wtab soon" disabled>🔒 ' + Z(w.note) + ' ' + Z(w.place) + '</button>';
    }).join('') + '</div>';
    var count = Lessons.LESSONS.filter(function (l) { return l.world === mapWorld; }).length;
    html += dailyCards(mapWorld) + '<div class="rooms' + (count > 9 ? ' many' : '') + '">';
    Lessons.LESSONS.forEach(function (l, idx) {
      if (l.world !== mapWorld) return;
      var rec = st.lessons[l.id], open = Store.isUnlocked(Lessons.LESSONS, st, idx), n = 0;
      Lessons.LESSONS.slice(0, idx + 1).forEach(function (x) { if (x.world === mapWorld) n++; });
      var badge = l.comingSoon ? '<span class="soon">' + Z('即將推出') + '</span>'
        : !open ? '<span class="lock">🔒</span>'
        : starRow(l, rec);
      html += '<button class="room' + (open ? '' : ' closed') + (l.comingSoon ? ' soon' : '') + (l.boss ? ' boss' : '') + '" data-lesson="' + l.id + '"' + (open ? '' : ' disabled') +
        '><span class="num">' + n + '</span><span class="rt">' + Z(l.title) + '</span>' + badge + '</button>';
    });
    html += '</div>';
    $('worlds').innerHTML = html;
    var g = Lessons.gradeOf(st);
    $('map-grade').innerHTML = '🏅 ' + Z(g ? '珠算 ' + g + '級' : '還沒有級數');
    $('map-princess').innerHTML = heroSvg(st, 'map');
    $('map-xform').hidden = st.char !== 'truck';
    $('stars').textContent = st.stars;
  }

  // ---- 上課 ----
  var L = null, view = null, phase = '', queue = [], qi = 0, q = null, p = null, flat = [];
  var examWrong = [], startedAt = 0;
  var firstTry = true, guiding = false, correct = 0, busy = false, spokenIdx = {}, lastGood = null;

  function setQuestion(text) { $('question').innerHTML = text; }
  function feedback(text, cls) { var f = $('feedback'); f.innerHTML = Z(text || ''); f.className = 'feedback ' + (cls || ''); }

  function buttons(list) {
    var box = $('controls');
    box.innerHTML = '';
    list.forEach(function (b) {
      var el = document.createElement('button');
      el.className = 'btn ' + (b.cls || '');
      el.innerHTML = (b.icon ? '<span class="ic">' + b.icon + '</span>' : '') + Z(b.label);
      el.onclick = function () { if (!busy || b.always) b.fn(); };
      box.appendChild(el);
    });
  }

  function phaseChip(text) { $('phase').innerHTML = Z(text); }

  function dots() {
    if (phase !== 'guided' && phase !== 'practice') { $('dots').innerHTML = ''; return; }
    var h = '';
    for (var i = 0; i < queue.length; i++) h += '<i class="' + (i < qi ? 'done' : i === qi ? 'cur' : '') + '"></i>';
    $('dots').innerHTML = h;
  }

  // 實體算盤模式（2026-11-26）：計算題可以改用自己的算盤，螢幕只負責出題、提示步驟、輸入答案
  function calcLike() { return !!L && (L.type === 'calc' || L.type === 'chain'); }   // 計算題：兩個數字或連加減
  function usePhys() { return !!st.physical && calcLike(); }
  function renderMode() {
    var b = $('mode');
    b.hidden = !calcLike();
    b.innerHTML = st.physical ? '<span class="ic">🧮</span>' + Z('實體算盤') : '<span class="ic">📱</span>' + Z('螢幕算盤');
    b.classList.toggle('phys', !!st.physical);
  }
  $('mode').onclick = function () {
    st.physical = !st.physical; persist(); renderMode();
    say(st.physical ? '換成用你自己的算盤。' : '換成用螢幕上的算盤。');
    if ((phase === 'guided' || phase === 'practice') && q && !busy) setupQuestion(true);
  };

  function startLesson(lesson, skipIntro) {
    // 從結果頁按「下一關／再練習一次」進來時，上一題答對留下的 busy 要清掉，不然按鈕都沒反應（2026-11-26 修正）
    speaker.stop(); busy = false; stopDemo();
    L = lesson;
    show('scr-lesson');
    $('l-title').innerHTML = Z(lesson.title);
    $('choices').innerHTML = '';
    view = AbacusView($('abacus'), lesson.rods);
    view.onTap(onTap);
    renderMode(); clearCaption(); showAbacus(true);
    if (skipIntro) return startRound('practice');
    phase = 'intro'; dots();
    phaseChip('看示範');
    view.set(Abacus.fromValue(0, L.rods)); view.enable(true); view.digits(true); view.glow([]);
    setQuestion('<span class="intro">' + Z(lesson.intro || '') + '</span>');
    feedback('');
    var passed = st.lessons[lesson.id] && st.lessons[lesson.id].passed;
    var list = lesson.story
      ? [{ label: '聽故事', icon: '📖', cls: 'main', fn: function () { runStory(0); } }, { label: '看示範', icon: '▶', fn: runDemo }]
      : [{ label: '看示範', icon: '▶', cls: 'main', fn: runDemo }];
    if (lesson.exam) {   // 級檢定：不用跟著做，直接開始
      list.forEach(function (b) { b.cls = ''; });
      list.push({ label: '開始檢定', icon: '🏅', cls: 'main', fn: function () { startRound('practice'); } });
    } else if (passed) list.push({ label: '換我試試', icon: '✋', fn: function () { startRound('guided'); } });
    buttons(list);
    clearCaption();
    say(lesson.intro || '', { caption: false });
  }

  // ---- 主線故事「算盤王國保衛戰」（saga.js）：序章、每一區的勝利故事，用故事頁播 ----
  function worldDoneFn(w) { return Store.worldDone(Lessons.LESSONS, st, w); }
  function pendingSaga() { return Saga.pending(st.seen, worldDoneFn); }
  function playSaga(pages, keys, after) {
    speaker.stop(); busy = false; stopDemo();
    (keys || []).forEach(function (k) { st.seen[k] = true; });   // 一開始播就算看過，中途回地圖不會一直重播
    persist();
    L = { id: 'saga', title: '算盤王國保衛戰', rods: 2, story: pages, saga: true, after: after || goMap };
    show('scr-lesson');
    $('l-title').innerHTML = Z(L.title);
    $('choices').innerHTML = '';
    view = AbacusView($('abacus'), 2);
    renderMode(); clearCaption();
    runStory(0);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  // 連加減照考卷直式排：一排一個數字，減的前面有「－」；cur＝正在撥第幾口（跟著做、示範時亮起來）
  function chainHtml(item, ans, cur) {
    return '<div class="chain">' + item.map(function (t, k) {
      return '<span class="t' + (k === cur ? ' cur' : '') + '">' + (t < 0 ? '－' : k ? '<i class="plus">＋</i>' : '') + Math.abs(t) + '</span>';
    }).join('') + '<span class="t sum"><b id="ans" class="ans">' + (ans || '?') + '</b></span></div>';
  }
  function chainSay(item) {
    return item.map(function (t, k) { return (k ? (t < 0 ? '減 ' : '加 ') : '') + Math.abs(t); }).join('，');
  }
  function markTerm(k) {
    document.querySelectorAll('.chain .t').forEach(function (el, i) { el.classList.toggle('cur', i === k); });
  }
  function qText(item) {
    if (L.type === 'chain') return chainHtml(item);
    if (L.type === 'set') return '<span class="big">' + Z('撥出') + ' <b>' + item + '</b></span>';
    if (L.type === 'read') return '<span class="big">' + Z('這是多少') + '？</span>';
    return '<span class="big eq">' + item[0] + ' ' + (item[1] === '+' ? '＋' : '－') + ' ' + item[2] + ' ＝ <b>?</b></span>';
  }
  function qSpeech(item) {
    if (L.type === 'set') return '撥出 ' + item;
    if (L.type === 'read') return '這是多少？';
    if (L.type === 'chain') return chainSay(item) + '，等於多少？';
    return item[0] + ' ' + Lessons.opWord(item[1]) + ' ' + item[2] + ' 等於多少？';
  }

  async function showStep(step, my) {
    var cur = view.get(), next = Abacus.applyStep(cur, step);
    view.glow(Abacus.beadsToMove(cur, next));
    await guard(my, say(Abacus.stepSay(step, L.rods)));
    view.set(next); tick(); view.glow([]);
    await guard(my, sleep(350));
  }

  async function demoOne(item, my) {
    setQuestion(qText(item));
    feedback('');
    if (L.type === 'set') {
      view.set(Abacus.fromValue(0, L.rods));
      await guard(my, say('撥出 ' + item + '。'));
      var pl = Abacus.plan(0, '+', item, L.rods);
      if (item >= 5) await guard(my, say('先撥下五珠，是 5。'));
      for (var g = 0; g < pl.groups.length; g++) for (var s = 0; s < pl.groups[g].steps.length; s++) await showStep(pl.groups[g].steps[s], my);
      if (item === 0) await guard(my, say('珠子都不靠樑，就是 0。'));
      await guard(my, say('這樣就是 ' + item + '。'));
      return;
    }
    if (L.type === 'read') {
      var rods = Abacus.fromValue(item, L.rods);
      view.set(rods); view.glow(activeBeads(rods));
      await guard(my, say('這是多少？'));
      await guard(my, say(readSay(item, rods)));
      view.glow([]);
      feedback('答案是 ' + item, 'ok');
      return;
    }
    var chain = L.type === 'chain';
    var pp = chain ? Abacus.planChain(item, L.rods) : Abacus.plan(item[0], item[1], item[2], L.rods);
    view.set(pp.start);
    await guard(my, say(qSpeech(item) + (chain ? '從 0 開始，一口一口撥。' : '算盤上先撥好 ' + item[0] + '。'), chain ? { captionText: '從 0 開始，一口一口撥。' } : undefined));
    for (var i = 0; i < pp.groups.length; i++) {
      if (chain) markTerm(pp.groups[i].term);
      await guard(my, say(pp.groups[i].say));
      for (var j = 0; j < pp.groups[i].steps.length; j++) await showStep(pp.groups[i].steps[j], my);
    }
    if (chain) { markTerm(-1); $('ans').textContent = pp.result; }
    feedback(chain ? '答案是 ' + pp.result : item[0] + (item[1] === '+' ? ' ＋ ' : ' － ') + item[2] + ' ＝ ' + pp.result, 'ok');
    await guard(my, say('答案是 ' + pp.result + '。'));
  }

  // ---- 故事（lessons.js 的 story）：一頁一頁，按「下一頁」才往下，讓小朋友（和家長）有時間想 ----
  var storyToken = 0;

  function fingerDots(a, b, total) {   // a 根彎下（粉紅）、b 根站著（紫色）；total 10 就是兩隻手
    total = total || 5;
    var h = '<span class="fdots' + (total > 5 ? ' ten' : '') + '">';
    for (var i = 0; i < total; i++) {
      if (i === 5) h += '<b class="gap"></b>';
      h += '<i class="' + (i < a ? 'a' : i < a + b ? 'b' : 'e') + '"></i>';
    }
    h += '</span>';
    if (a && b) h += '<span class="flabel"><b class="ca">' + a + '</b> ' + Z('和') + ' <b class="cb">' + b + '</b> ' + Z('是好朋友') + '</span>';
    else h += '<span class="flabel"><b class="cb">' + (a + b) + '</b></span>';
    return h;
  }

  function ruleTable(kind) {
    var ten = kind === 'tenAdd' || kind === 'tenSub', nums = ten ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [1, 2, 3, 4];
    var rows = nums.map(function (n) {
      if (kind === 'add') return '<tr><td>' + Z('加 ' + n) + '</td><td>→</td><td>' + Z('加 5，再減 ') + '<b>' + (5 - n) + '</b></td></tr>';
      if (kind === 'sub') return '<tr><td>' + Z('減 ' + n) + '</td><td>→</td><td>' + Z('加 ') + '<b>' + (5 - n) + '</b>' + Z('，再減 5') + '</td></tr>';
      if (kind === 'tenAdd') return '<tr><td>' + Z('加 ' + n) + '</td><td>→</td><td>' + Z('減 ') + '<b>' + (10 - n) + '</b>' + Z('，十位加 1') + '</td></tr>';
      return '<tr><td>' + Z('減 ' + n) + '</td><td>→</td><td>' + Z('十位減 1，加 ') + '<b>' + (10 - n) + '</b></td></tr>';
    }).join('');
    if (ten) {   // 9 列分成 3 欄，畫面才放得下
      var list = rows.split('</tr>').filter(Boolean).map(function (r) { return r + '</tr>'; });
      return '<table class="rule ten"><tr>' + [0, 3, 6].map(function (k) {
        return '<td><table>' + list.slice(k, k + 3).join('') + '</table></td>';
      }).join('') + '</tr></table>';
    }
    return '<table class="rule">' + rows + '</table>';
  }

  function sceneVisual(sc) {
    if (sc.dots) return fingerDots(sc.dots[0], sc.dots[1], sc.total);
    if (sc.pairs && sc.total === 10) {
      return '<div class="pairs10">' + [[1, 9], [2, 8], [3, 7], [4, 6], [5, 5]].map(function (pr) {
        return '<span><b class="ca">' + pr[0] + '</b>＋<b class="cb">' + pr[1] + '</b></span>';
      }).join('') + '</div>';
    }
    if (sc.pairs) return fingerDots(1, 4) + fingerDots(2, 3);
    if (sc.rule) return ruleTable(sc.rule);
    return '';
  }

  function sceneGlow(kind, rods) {
    var r = rods[0], out = [], k;
    if (kind === 'active') return activeBeads(rods);
    if (kind === 'upper') return [{ rod: 0, part: 'u' }];
    if (kind === 'lower') { for (k = 0; k < r.l; k++) out.push({ rod: 0, part: 'l', k: k }); return out; }
    if (kind === 'free') { for (k = r.l; k < 4; k++) out.push({ rod: 0, part: 'l', k: k }); return out; }
    if (kind === 'tens') return [{ rod: 1, part: 'l', k: 0 }];
    if (kind === 'tensUp') return [{ rod: 1, part: 'u' }];   // 大隊長
    if (kind === 'king') return [{ rod: 2, part: 'l', k: 0 }];   // 精靈國王
    if (/^rod\d$/.test(kind)) return activeBeads(rods).filter(function (b) { return b.rod === +kind[3]; });
    return out;
  }

  // 故事旁邊的人物：hero＝孩子選的角色（頭像）、其他＝亂亂怪一家（saga.js）
  function portrait(who, i) {
    if (!who) return '';
    if (who === 'hero') return '<span class="who">' + heroSvg(st, 'sw' + i, faceCrop(st.char, st.form)) + '</span>';
    return '<span class="who">' + Saga.monster(who, 'sm' + i) + '</span>';
  }

  function storyButtons(i) {
    var last = i >= L.story.length - 1, list = [];
    if (i > 0) list.push({ label: '上一頁', icon: '◀', fn: function () { runStory(i - 1); } });
    list.push({ label: '再聽一次', icon: '🔊', fn: function () { runStory(i); } });
    if (!last) list.push({ label: '下一頁', icon: '▶', cls: 'main', fn: function () { runStory(i + 1); } });
    else if (L.saga) list.push({ label: '出發', icon: '🚩', cls: 'main', fn: L.after });
    else list.push({ label: '看示範', icon: '▶', cls: 'main', fn: runDemo });
    buttons(list);
  }

  async function runStory(i) {
    demoToken++;
    var sc = L.story[i], token = ++storyToken;
    phase = 'story'; busy = false; dots();
    phaseChip('聽故事');
    speaker.stop(); feedback(''); $('choices').innerHTML = '';
    view.enable(false); view.digits(true); view.glow([]);
    if (sc.quiz) return storyQuiz(i, sc.quiz, token, sc.total || 5);
    var text = Saga.fill(sc.text, st.char), board = sc.abacus !== undefined || !!sc.play;
    setQuestion('<div class="story"><div class="sline' + (board ? '' : ' solo') + '">' + portrait(sc.who, i) +
      '<p class="stext">' + Z(text) + '</p></div>' + sceneVisual(sc) +
      '<p class="spage">' + (i + 1) + ' / ' + L.story.length + '</p></div>');
    showAbacus(board);
    view.set(Abacus.fromValue(sc.abacus || 0, L.rods));
    if (sc.glow) view.glow(sceneGlow(sc.glow, view.get()));
    storyButtons(i);
    clearCaption();
    await say(text, { caption: false });
    if (token !== storyToken || !sc.play) return;
    for (var k = 0; k < sc.play.length; k++) {   // 一步一步撥給她看
      var cur = view.get(), next = Abacus.applyStep(cur, sc.play[k]);
      view.glow(Abacus.beadsToMove(cur, next));
      await sleep(900);
      if (token !== storyToken) return;
      view.set(next); tick(); view.glow([]);
      await sleep(400);
    }
  }

  // 小測驗：「n 的好朋友是誰？」答對才出現「下一頁」
  function storyQuiz(i, n, token, total) {
    var ans = total - n, nums = [];
    for (var c = 1; c < total; c++) nums.push(c);
    setQuestion('<div class="story"><p class="stext big">' + n + ' ' + Z('的好朋友是誰') + '？</p>' + fingerDots(n, 0, total) +
      '<p class="spage">' + (i + 1) + ' / ' + L.story.length + '</p></div>');
    view.set(Abacus.fromValue(0, L.rods)); showAbacus(false);
    buttons([{ label: '再聽一次', icon: '🔊', fn: function () { runStory(i); } }]);
    var box = $('choices');
    box.innerHTML = '';
    nums.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'choice'; b.textContent = c;
      b.onclick = function () {
        if (token !== storyToken) return;
        if (c === ans) {
          chime();
          box.innerHTML = '';
          setQuestion('<div class="story"><p class="stext big">' + Z('答對了') + '！</p>' + fingerDots(n, ans, total) +
            '<p class="spage">' + (i + 1) + ' / ' + L.story.length + '</p></div>');
          say('答對了！' + n + ' 和 ' + ans + ' 合起來是 ' + total + '，它們是' + (total === 10 ? '十' : '五') + '的好朋友！');
          storyButtons(i);
        } else {
          b.disabled = true;
          feedback('再想想看', 'warn');
          say('不對喔。' + n + ' 再加多少才會變成 ' + total + ' 呢？數數看空的圓圈有幾個。');
        }
      };
      box.appendChild(b);
    });
    clearCaption();
    say(n + ' 的好朋友是誰？', { caption: false });
  }

  // 示範播到一半離開（回地圖、換關、聽故事…）就要停下來，不然會在別的畫面繼續撥珠、說話
  var demoToken = 0, CANCEL = {};
  function guard(my, p) {
    return p.then(function (v) { if (my !== demoToken) throw CANCEL; return v; });
  }
  function stopDemo() { demoToken++; storyToken++; }

  async function runDemo() {
    storyToken++;
    var my = ++demoToken;
    try { await playDemo(my); } catch (e) { if (e !== CANCEL) throw e; }
  }

  async function playDemo(my) {
    phase = 'demo'; busy = true; dots(); showAbacus(true);
    phaseChip('看示範');
    view.enable(false); view.digits(true);
    buttons([]);
    for (var i = 0; i < (L.demo || []).length; i++) {
      if (phase !== 'demo') return;   // 中途離開
      await demoOne(L.demo[i], my);
      await guard(my, sleep(600));
    }
    if (phase !== 'demo') return;
    busy = false;
    view.enable(true);
    if (L.review) {
      say('錯的題目都看完了。');
      var orig = Lessons.byId(L.id);
      return buttons([{ label: '再考一次', icon: '↺', cls: 'main', fn: function () { startLesson(orig, true); } },
                      { label: '回地圖', icon: '🏰', fn: goMap }]);
    }
    say('看懂了嗎？換你試試看！');
    buttons([{ label: '再看一次', icon: '↺', fn: runDemo },
             { label: '換我試試', icon: '✋', cls: 'main', fn: function () { startRound('guided'); } }]);
  }

  function startRound(kind) {
    stopDemo();
    phase = kind;
    guiding = kind === 'guided';
    queue = Lessons.generate(Object.assign({}, L, { count: kind === 'guided' ? 3 : L.count }));
    qi = 0; correct = 0; examWrong = []; startedAt = Date.now();   // 2026-11-27 記錄花多少時間（之後高級要限時）
    phaseChip(kind === 'guided' ? '跟著做' : '自己做');
    nextQuestion();
  }

  function startState() {
    if (calcLike()) return p.start;
    if (L.type === 'read') return Abacus.fromValue(q, L.rods);
    return Abacus.fromValue(0, L.rods);
  }

  function showAbacus(on) { $('abacus').hidden = !on; }

  function nextQuestion() {
    if (qi >= queue.length) return phase === 'guided' ? afterGuided() : finish();
    q = queue[qi];
    firstTry = true; spokenIdx = {};
    guiding = phase === 'guided';
    p = L.type === 'chain' ? Abacus.planChain(q, L.rods) : L.type === 'calc' ? Abacus.plan(q[0], q[1], q[2], L.rods) : null;
    flat = p ? Abacus.flatSteps(p) : [];
    setupQuestion(true);
  }

  // 依目前模式擺好這一題的畫面（換模式、答錯改成跟著做時也會重擺）
  function setupQuestion(speak) {
    var phys = usePhys(), keypad = phys && !guiding;
    busy = false; answer = '';
    dots();
    setQuestion(keypad ? physText(q) : qText(q));
    feedback('');
    view.set(startState()); lastGood = view.get();
    showAbacus(!keypad);
    view.enable(L.type !== 'read' && !phys);
    view.digits(guiding && L.type !== 'read');
    $('choices').innerHTML = '';
    if (L.type === 'read') renderChoices();
    if (keypad) renderKeypad();
    controlsFor();
    if (speak) {
      var extra = '';
      if (L.type === 'chain') {
        extra = phys ? (guiding ? '先把你的算盤歸零，再照著發亮的珠子撥，撥好了就按撥好了。' : '用你的算盤一口一口撥，算好了按數字告訴我。')
          : '從 0 開始，一口一口往下撥。';
        if (phys && !guiding) extra = '用你的算盤算，再按答案。';
      } else if (L.type === 'calc') {
        if (!phys) extra = '算盤上已經撥好 ' + q[0] + ' 了。';
        else if (guiding) extra = '先在你的算盤上撥好 ' + q[0] + '，再照著發亮的珠子撥，撥好了就按撥好了。';
        else extra = '用你的算盤算算看，算好了按數字告訴我。';
      }
      // 連加減的題目畫面上已經有，字幕只放後面的說明（字幕太長 iPad 放不下）
      say(qSpeech(q) + extra, L.type === 'chain' ? { captionText: extra } : undefined).then(function () { if (q && guiding) refreshGlow(true); });
    }
    refreshGlow(false);
  }

  // 實體算盤「自己做」：用數字鍵輸入答案
  var answer = '';
  function physText(item) {
    if (L.type === 'chain') return chainHtml(item, answer);
    return '<span class="big eq">' + item[0] + ' ' + (item[1] === '+' ? '＋' : '－') + ' ' + item[2] + ' ＝ <b id="ans" class="ans">' +
      (answer || '?') + '</b></span>';
  }
  function renderKeypad() {
    var box = $('choices');
    box.innerHTML = '<div class="keypad">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0].map(function (k) {
      return '<button class="key' + (k === '⌫' ? ' del' : '') + '" data-k="' + k + '">' + k + '</button>';
    }).join('') + '</div>';
    box.querySelector('.keypad').onclick = function (e) {
      var b = e.target.closest('.key');
      if (!b || busy) return;
      var k = b.dataset.k;
      if (k === '⌫') answer = answer.slice(0, -1);
      else if (answer.length < 3) answer = (answer === '0' ? '' : answer) + k;
      tick();
      $('ans').textContent = answer || '?';
    };
  }
  function checkAnswer() {
    if (!answer) { feedback('先按數字，再按好了', 'warn'); say('先按數字，再按好了。'); return; }
    if (+answer === Lessons.answerOf(q)) success(); else wrong(false);
  }
  // 實體算盤「跟著做」：她在自己的算盤撥好一步，按「撥好了」，螢幕上的算盤也跟著撥，再亮下一步
  function physStep() {
    var cur = view.get(), idx = Abacus.progressIn(p, cur);
    if (idx < 0) { view.set(lastGood); return refreshGlow(true); }
    if (idx >= flat.length) return success();
    var next = Abacus.applyStep(cur, flat[idx].step);
    view.set(next); lastGood = next; tick();
    if (idx + 1 >= flat.length) return success();
    refreshGlow(true);
  }

  function controlsFor() {
    var list = [{ label: '再聽一次', icon: '🔊', fn: function () { say(qSpeech(q)); } }];
    if (usePhys()) {
      if (guiding) list.push({ label: '撥好了', icon: '✔', cls: 'main', fn: physStep });
      else {
        if (!L.exam) list.push({ label: '提示', icon: '💡', fn: function () { wrong(true); } });
        list.push({ label: '好了', icon: '✔', cls: 'main', fn: checkAnswer });
      }
      return buttons(list);
    }
    if (L.type !== 'read') list.push({ label: '清空', icon: '↺', fn: resetQuestion });
    if (!guiding && L.type !== 'read' && !L.exam) list.push({ label: '提示', icon: '💡', fn: function () { wrong(true); } });
    if (!guiding && L.type !== 'read') list.push({ label: '好了', icon: '✔', cls: 'main', fn: check });
    buttons(list);
  }

  function renderChoices() {
    var box = $('choices');
    box.innerHTML = '';
    Lessons.choices(q, L).forEach(function (n) {
      var b = document.createElement('button');
      b.className = 'choice'; b.textContent = n;
      b.onclick = function () {
        if (busy) return;
        if (n === q) { success(); return; }
        b.disabled = true;
        wrong(false);
      };
      box.appendChild(b);
    });
  }

  function resetQuestion() {
    view.set(startState()); lastGood = view.get(); spokenIdx = {};
    refreshGlow(true);
  }

  // 跟著做：讓下一步要撥的珠子發亮，並念出這一步
  function refreshGlow(speak) {
    if (!guiding) { view.glow([]); return; }
    var cur = view.get();
    if (L.type === 'read') { view.glow(activeBeads(cur)); return; }
    if (L.type === 'set') {
      var target = Abacus.fromValue(q, L.rods);
      var next = Abacus.nextBeads(cur, target);
      view.glow(next);
      if (speak && next.length && !spokenIdx.set) {
        spokenIdx.set = true;
        say(q >= 5 ? '先撥下五珠，再撥一珠，看發亮的珠子。' : '撥上發亮的一珠。');
      }
      return;
    }
    var idx = Abacus.progressIn(p, cur);
    if (idx < 0) { view.glow(partialGlow(cur)); return; }
    if (idx >= flat.length) { view.glow([]); return; }
    var f = flat[idx], after = Abacus.applyStep(cur, f.step);
    if (L.type === 'chain') markTerm(f.group.term);
    view.glow(Abacus.beadsToMove(cur, after));
    if (speak && !spokenIdx[idx]) {
      spokenIdx[idx] = true;
      say((f.first ? f.group.say + '。' : '') + Abacus.stepSay(f.step, L.rods));
    }
  }

  // 撥到一半（一步要動好幾顆、只點到一部分）時，還沒撥的珠子；不是撥到一半就回傳 []
  function partialGlow(rods) {
    var at = Abacus.progressIn(p, lastGood);
    if (at < 0 || at >= flat.length || !Abacus.partialStep(lastGood, flat[at].step, rods)) return [];
    return Abacus.beadsToMove(rods, Abacus.applyStep(lastGood, flat[at].step));
  }

  function onTap(rods) {
    if (busy || usePhys()) return;
    if (!guiding) return;   // 自己做：按「好了」才檢查
    if (L.type === 'set') {
      if (Abacus.same(rods, Abacus.fromValue(q, L.rods))) return success();
      return refreshGlow(false);
    }
    var idx = Abacus.progressIn(p, rods);
    if (idx === flat.length) return success();
    if (idx < 0) {
      // 一步要動好幾顆，只點到一部分：不算錯，繼續亮還沒撥的珠子
      var rest = partialGlow(rods);
      if (rest.length) { view.glow(rest); return; }
      busy = true;
      feedback('這顆撥錯了，沒關係', 'warn');
      say('這顆撥錯了，沒關係，我們回到剛剛。').then(function () {
        view.set(lastGood); busy = false; feedback('');
        refreshGlow(false);
      });
      return;
    }
    lastGood = Abacus.clone(rods);
    refreshGlow(true);
  }

  function check() {
    var v = Abacus.valueOf(view.get());
    if (v === Lessons.answerOf(q)) success(); else wrong(false);
  }

  function kindOf() {
    if (L.type === 'set' || L.type === 'read') return L.type;
    return p.kind;
  }

  function success() {
    busy = true;
    if (phase === 'practice' && firstTry) correct++;
    view.glow([]); view.digits(true);
    chime();
    var text = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    feedback('⭐ ' + text, 'ok');
    if (L.type === 'read') setQuestion('<span class="big">' + Z('答對了') + '！<b>' + q + '</b></span>');
    if (calcLike() && $('ans')) $('ans').textContent = Lessons.answerOf(q);
    say(text).then(function () { return sleep(400); }).then(function () {
      if (phase !== 'guided' && phase !== 'practice') return;
      qi++; nextQuestion();
    });
  }

  // 答錯或按提示：第一次才算錯；接著變成「跟著做」帶她做完這題
  function wrong(asked) {
    if (phase === 'practice' && firstTry) { Store.recordMistake(st, kindOf()); persist(); }
    if (L.exam && phase === 'practice') {   // 檢定：跟考試一樣不帶著做，說答案就下一題，結束後可以看錯的題目
      firstTry = false; busy = true; examWrong.push(q);
      view.glow([]); view.enable(false);
      if ($('ans')) $('ans').textContent = Lessons.answerOf(q);
      feedback('答案是 ' + Lessons.answerOf(q), 'warn');
      say('答案是 ' + Lessons.answerOf(q) + '，下一題。').then(function () {
        if (phase !== 'practice') return;
        qi++; nextQuestion();
      });
      return;
    }
    firstTry = false;
    guiding = true;
    if (L.type === 'read') {
      busy = true;
      view.glow(activeBeads(view.get()));
      feedback('數一數發亮的珠子', 'warn');
      say((asked ? '' : '差一點點。') + readSay(q, view.get())).then(function () { busy = false; });
      return;
    }
    feedback(asked ? '一起來看看' : '差一點點，一起來看看', 'warn');
    controlsFor();
    busy = true;
    say(asked ? '我們一起來看看。' : '差一點點，我們一起來看看。').then(function () {
      if (phase !== 'guided' && phase !== 'practice') return;
      setupQuestion(false);
      view.digits(true);
      feedback(asked ? '一起來看看' : '差一點點，一起來看看', 'warn');
      refreshGlow(true);
    });
  }

  function afterGuided() {
    busy = true;
    feedback('你會了！現在換你自己做', 'ok');
    say('你會了！現在換你自己做，不會的時候可以按提示。').then(function () {
      busy = false;
      startRound('practice');
    });
  }

  function finish() {
    busy = false;
    if (L.id === 'daily') return finishDaily();
    var ms = Date.now() - startedAt;
    var res = Store.recordSession(st, L.id, correct, queue.length, ms, L.passRate);
    persist();
    phase = 'result';
    show('scr-result');
    var idx = Lessons.LESSONS.indexOf(L), next = Lessons.LESSONS[idx + 1];
    var nextOpen = next && Store.isUnlocked(Lessons.LESSONS, st, idx + 1);
    var cert = L.exam && res.passed;
    $('r-title').innerHTML = cert ? '🏅 ' + Z(L.exam + '級合格') + '！' : res.passed ? Z('過關了') + '！🎉' : Z('練習完成') + '！';
    $('r-score').innerHTML = Z('答對 ' + correct + ' / ' + queue.length + ' 題') + '<span class="rtime">⏱ ' + Z(timeText(ms)) + '</span>' +
      (cert ? '<div class="cert"><span>📜 ' + Z('證書') + '</span><b>' + Z(L.exam + '級') + '</b><small>' + Z(curName() + ' 珠算檢定合格') + '</small></div>' : '');
    $('r-stars').innerHTML = res.earned ? Z('新拿到') + ' ⭐ × ' + res.earned + '<span class="rsub">' + Z('這一關') + ' ' + res.got + ' / ' + res.total + '</span>'
      : '<span class="rsub">' + Z('這一關已經拿到') + ' ' + res.got + ' / ' + res.total + '</span>';
    $('r-msg').innerHTML = Z(res.passed ? (nextOpen ? '下一關開了！' : '這一區全部完成了！')
      : '答對 ' + Math.ceil(queue.length * (L.passRate || Store.PASS_RATE) - 1e-9) + ' 題就能過關，再練習一次吧！');
    var box = $('r-buttons');
    box.innerHTML = '';
    var add = function (label, icon, cls, fn) {
      var b = document.createElement('button');
      b.className = 'btn ' + cls; b.innerHTML = '<span class="ic">' + icon + '</span>' + Z(label);
      b.onclick = fn; box.appendChild(b);
    };
    var pend = res.passed ? pendingSaga() : { keys: [] };
    if (pend.keys.length) {
      add('勝利故事', '🎉', 'main', function () {
        playSaga(pend.pages, pend.keys, nextOpen ? function () { startLesson(next); } : goMap);
      });
    }
    if (res.passed && nextOpen) add('下一關', '▶', pend.keys.length ? '' : 'main', function () { startLesson(next); });
    if (examWrong.length) add('看錯的題目', '🔍', '', reviewWrong);
    add(L.exam ? '再考一次' : '再練習一次', '↺', res.passed ? '' : 'main', function () { startLesson(L, true); });
    add('更衣室', '✨', '', openDress);
    add('回地圖', '🏰', '', goMap);
    say((cert ? '恭喜！' + L.exam + '級合格！' : res.passed ? '過關了！' : '練習完成！') + '答對 ' + correct + ' 題。' +
      (res.earned ? '新拿到 ' + res.earned + ' 顆星星！' : (res.got < res.total ? '要比上次答對更多題，才會拿到新的星星喔。' : '這一關的星星全部拿到了！')));
  }

  function timeText(ms) {
    var sec = Math.max(1, Math.round(ms / 1000)), m = Math.floor(sec / 60);
    return '花了 ' + (m ? m + ' 分 ' : '') + (sec % 60) + ' 秒';
  }

  // 檢定答錯的題目：一題一題用示範撥給她看
  function reviewWrong() {
    var lesson = Lessons.byId(L.id), list = examWrong.slice();
    startLesson(lesson);
    L = Object.assign({}, lesson, { demo: list, review: true });
    runDemo();
  }

  // 每日挑戰：每一區一張（那一區全部過關才打開）
  function dailyCards(world) {
    return playableWorlds().filter(function (w) { return w.id === world; }).map(function (w) {
      var name = w.note + '每日挑戰';
      if (!Store.worldDone(Lessons.LESSONS, st, w.id)) {
        return '<div class="daily locked">🔒 ' + Z(name) + '<small>' + Z(w.note + '的關卡全部過關就會打開') + '</small></div>';
      }
      if (!Store.dailyAvailable(st, w.id)) {
        return '<div class="daily done">✅ ' + Z(name) + ' ⭐ ' + Store.dailyRec(st, w.id).got + ' / ' + Store.DAILY_COUNT +
          '<small>' + Z('明天再來挑戰') + '</small></div>';
      }
      return '<button class="daily" data-daily="' + w.id + '">🌟 ' + Z(name) + '<small>' + Z('5 題，答對一題拿一顆星') + '</small></button>';
    }).join('');
  }
  function startDaily(world) {
    if (!Store.worldDone(Lessons.LESSONS, st, world) || !Store.dailyAvailable(st, world)) return;
    startLesson(Lessons.dailyLesson(world), true);
  }

  function finishDaily() {
    var res = Store.recordDaily(st, L.world, correct);
    persist();
    phase = 'result';
    show('scr-result');
    $('r-title').innerHTML = Z(L.title + '完成') + '！🌟';
    $('r-score').innerHTML = Z('答對 ' + correct + ' / ' + queue.length + ' 題');
    $('r-stars').innerHTML = Z('新拿到') + ' ⭐ × ' + res.earned;
    $('r-msg').innerHTML = Z('明天再來挑戰');
    var box = $('r-buttons');
    box.innerHTML = '';
    [['更衣室', '✨', 'main', openDress], ['回地圖', '🏰', '', goMap]].forEach(function (a) {
      var b = document.createElement('button');
      b.className = 'btn ' + a[2]; b.innerHTML = '<span class="ic">' + a[1] + '</span>' + Z(a[0]);
      b.onclick = a[3]; box.appendChild(b);
    });
    say('每日挑戰完成！答對 ' + correct + ' 題，拿到 ' + res.earned + ' 顆星星。明天再來挑戰喔！');
  }

  function goMap() {
    phase = ''; speaker.stop(); busy = false; stopDemo();
    var pend = pendingSaga();
    if (pend.keys.length) return playSaga(pend.pages, pend.keys, goMap);   // 還沒看過的故事先播
    renderMap(); show('scr-map');
  }

  // ---- 更衣室（2026-11-27：四個角色，星星和買到的東西共用）----
  var slot = '';
  function openDress() { phase = ''; speaker.stop(); stopDemo(); closeBuy(); renderDress(); show('scr-dress'); }
  function renderDress() {
    Heroes.setArt(!st.classicArt);
    var w = Store.curWear(st), slots = Store.slotsFor(st.char);
    if (!slots.some(function (x) { return x.id === slot; })) slot = slots[0].id;
    $('dress-princess').innerHTML = heroSvg(st, 'dress');
    $('dress-xform').hidden = st.char !== 'truck';
    $('d-stars').textContent = st.stars;
    $('chars').innerHTML = Store.CHARS.map(function (c) {
      var s2 = { char: c.id, wears: st.wears, form: st.form };
      return '<button class="char' + (c.id === st.char ? ' on' : '') + '" data-char="' + c.id + '"><span class="cpic">' +
        heroSvg(s2, 'ch-' + c.id, faceCrop(c.id, st.form)) + '</span>' + Z(c.name) + '</button>';
    }).join('');
    $('slots').innerHTML = slots.map(function (s) {
      return '<button class="slot' + (s.id === slot ? ' on' : '') + '" data-slot="' + s.id + '">' + Z(s.name) + '</button>';
    }).join('');
    $('items').innerHTML = Store.CATALOG.filter(function (c) { return c.slot === slot && Store.fits(c, st.char); }).map(function (c) {
      var own = st.owned.indexOf(c.id) >= 0, on = w[c.slot] === c.id;
      var tag = on ? '<span class="tag on">' + Z(st.char === 'truck' ? '裝上了' : '穿著') + '</span>'
        : own ? '<span class="tag">' + Z(st.char === 'truck' ? '裝上' : '穿上') + '</span>'
        : '<span class="tag cost' + (st.stars >= c.cost ? '' : ' poor') + '">⭐ ' + c.cost + '</span>';
      var look = Object.assign({}, w);
      look[c.slot] = c.id;   // 小圖：換上這一件的樣子（只看那一塊）
      return '<button class="item' + (on ? ' on' : '') + '" data-item="' + c.id + '"><span class="thumb">' +
        Heroes.svg(st.char, look, 'th-' + c.id, Heroes.cropFor(st.char, c.slot, st.form), Heroes.formFor(st.char, c.slot, st.form)) +
        '</span><span>' + Z(c.name) + '</span>' + tag + '</button>';
    }).join('');
  }
  $('chars').onclick = function (e) {
    var b = e.target.closest('.char'); if (!b) return;
    Store.setChar(st, b.dataset.char); tick(); persist(); renderDress(); renderWhoChip();
    var c = Store.CHARS.filter(function (x) { return x.id === st.char; })[0];
    say('換成' + c.name + '！');
  };
  $('slots').onclick = function (e) {
    var b = e.target.closest('.slot'); if (!b) return;
    slot = b.dataset.slot; renderDress();
  };
  $('items').onclick = function (e) {
    var b = e.target.closest('.item'); if (!b) return;
    var c = Store.item(b.dataset.item);
    if (st.owned.indexOf(c.id) >= 0) {
      Store.wear(st, c.id); st.form = Heroes.formFor(st.char, c.slot, st.form) || st.form;
      tick(); persist(); renderDress(); renderWhoChip(); flash(); return;
    }
    openBuy(c);   // 還沒買的：先預覽，再決定要不要買
  };
  function flash() {   // 變身閃光
    var stg = $('dress-princess');
    stg.classList.remove('flash'); void stg.offsetWidth; stg.classList.add('flash');
  }

  // ---- 變身（2026-11-27）：工程車 ⇄ 機器人，有光芒動畫 ----
  var morphing = false;
  function transform(boxId, done) {
    if (morphing || st.char !== 'truck') return;
    morphing = true;
    var box = $(boxId), old = box.innerHTML;
    Store.toggleForm(st); persist();
    box.innerHTML = '<div class="xf"><div class="xf-old">' + old + '</div><div class="xf-new">' + heroSvg(st, boxId + 'xf') +
      '</div><div class="xf-rays"></div><div class="xf-burst"></div></div>';
    void box.offsetWidth;
    box.querySelector('.xf').classList.add('go');
    [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.09, 0.25, 0.18); });
    say(st.form === 'robot' ? '變身！' : '變回工程車！');
    setTimeout(function () { morphing = false; done(); renderWhoChip(); }, 1500);
  }
  $('dress-xform').onclick = function () { transform('dress-princess', renderDress); };
  $('map-xform').onclick = function () { transform('map-princess', renderMap); };

  // ---- 買東西前的預覽 ----
  var buying = null;
  function openBuy(c) {
    buying = c;
    var look = Object.assign({}, Store.curWear(st)), enough = st.stars >= c.cost;
    look[c.slot] = c.id;
    Heroes.setArt(!st.classicArt);
    $('buy-pic').innerHTML = Heroes.svg(st.char, look, 'buyprev', null, Heroes.formFor(st.char, c.slot, st.form));
    $('buy-name').innerHTML = Z(c.name);
    $('buy-cost').innerHTML = '⭐ ' + c.cost + '　<span class="mhave">' + Z('你有') + ' ⭐ ' + st.stars + '</span>' +
      (enough ? '' : '<br><span class="mneed">' + Z('還差 ' + (c.cost - st.stars) + ' 顆星星') + '</span>');
    $('buy-no').innerHTML = '<span class="ic">◀</span>' + Z(enough ? '不要' : '回去');
    $('buy-yes').innerHTML = '<span class="ic">✔</span>' + Z('買下來') + ' ⭐' + c.cost;
    $('buy-yes').hidden = !enough;
    $('buy').hidden = false;
    say(enough ? '要買' + c.name + '嗎？要 ' + c.cost + ' 顆星星。' : '還差 ' + (c.cost - st.stars) + ' 顆星星，多練習就能拿到喔！');
  }
  function closeBuy() { $('buy').hidden = true; buying = null; }
  $('buy-no').onclick = function () { tick(); closeBuy(); };
  $('buy-yes').onclick = function () {
    if (!buying) return;
    var c = buying;
    closeBuy();
    if (Store.buy(st, c.id)) {
      st.form = Heroes.formFor(st.char, c.slot, st.form) || st.form;
      chime(); say('變身！買到' + c.name + '了！');
      persist(); renderDress(); renderWhoChip(); flash();
    }
  };

  // ---- 家長頁 ----
  function openParent() {
    phase = ''; speaker.stop(); stopDemo();
    var rows = Lessons.LESSONS.filter(function (l) { return !l.comingSoon; }).map(function (l) {
      var r = st.lessons[l.id];
      return '<tr><td>' + escapeHtml(l.title) + '</td><td>' + (r ? r.plays : 0) + '</td><td>' +
        (r ? Math.round(r.last * 100) + '%' : '—') + '</td><td>' + (r ? Math.round(r.best * 100) + '%' : '—') +
        '</td><td>' + (r && r.passed ? '✅' : '') + '</td><td>' + (r && r.lastMs ? timeText(r.lastMs).replace('花了 ', '') : '—') + '</td></tr>';
    }).join('');
    $('p-table').innerHTML = '<tr><th>關卡</th><th>練習次數</th><th>最近</th><th>最好</th><th>過關</th><th>最近時間</th></tr>' + rows;
    var ms = Object.keys(st.mistakes);
    $('p-mistakes').innerHTML = ms.length ? ms.sort(function (a, b) { return st.mistakes[b] - st.mistakes[a]; })
      .map(function (k) { return '<li>' + (KIND_NAMES[k] || k) + '：答錯 ' + st.mistakes[k] + ' 次</li>'; }).join('')
      : '<li>還沒有答錯的紀錄</li>';
    $('p-who').textContent = curName();
    $('p-profiles').innerHTML = meta.list.map(function (p) {
      var s2 = p.id === curId ? st : Store.load(storage, p.id);
      return '<li><b>' + escapeHtml(p.name) + '</b>' + (p.id === curId ? '（現在）' : '') + ' ⭐ ' + s2.stars +
        ' <button class="btn mini" data-ren="' + p.id + '">改名字</button>' +
        (meta.list.length > 1 ? ' <button class="btn mini danger" data-del="' + p.id + '">刪除</button>' : '') + '</li>';
    }).join('');
    $('p-add').hidden = meta.list.length >= Store.MAX_PROFILES;
    renderVoices();
    $('p-unlock').checked = !!st.unlockAll;
    $('p-art').checked = !st.classicArt;
    show('scr-parent');
  }
  function renderVoices() {
    var list = speaker.list(), cur = speaker.current();
    var sel = $('p-voice');
    sel.innerHTML = list.map(function (v) {
      return '<option value="' + escapeHtml(v.name) + '"' + (cur && cur.name === v.name ? ' selected' : '') + '>' +
        escapeHtml(v.name) + '</option>';
    }).join('');
    sel.hidden = !list.length;
    $('p-novoice').hidden = !!list.length;
    $('p-voice-now').textContent = cur ? '目前語音：' + cur.name + '（' + cur.lang + '）' : '目前沒有台灣口音語音，只會顯示文字';
  }
  $('p-voice').onchange = function () { st.voice = this.value; persist(); speaker.refresh(); renderVoices(); };
  $('p-test').onclick = function () { speaker.refresh(); say('三加四等於七。五的好朋友，加五再減一。'); };
  $('p-unlock').onchange = function () { st.unlockAll = this.checked; persist(); };
  // 公主畫風（2026-11-27）：新畫風（Gemini 圖）／原本的程式畫，兩種都保留
  $('p-art').onchange = function () { st.classicArt = !this.checked; persist(); renderWhoChip(); };
  $('p-profiles').onclick = function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.ren) {
      var p = meta.list.filter(function (x) { return x.id === b.dataset.ren; })[0];
      var name = window.prompt('新的名字（最多 8 個字）', p.name);
      if (name !== null && Store.renameProfile(meta, p.id, name)) { Store.saveProfiles(storage, meta); renderWhoChip(); }
    }
    if (b.dataset.del) {
      var q = meta.list.filter(function (x) { return x.id === b.dataset.del; })[0];
      if (!window.confirm('確定要刪除「' + q.name + '」和他所有的進度、星星嗎？這個動作不能復原。')) return;
      Store.removeProfile(storage, meta, q.id);
      Store.saveProfiles(storage, meta);
      if (q.id === curId) { curId = meta.current; st = loadState(curId); renderWhoChip(); }
    }
    openParent();
  };
  $('p-add').onclick = function () { if (addProfile()) openParent(); };
  $('p-reset').onclick = function () {
    if (!window.confirm('確定要清除「' + curName() + '」的所有進度、星星和衣服嗎？這個動作不能復原。')) return;
    st = Store.defaults(); persist(); openParent();
  };

  // ---- 共用按鈕 ----
  $('worlds').onclick = function (e) {
    var t = e.target.closest('[data-world]');
    if (t) { mapWorld = +t.dataset.world; renderMap(); return; }
    var d = e.target.closest('[data-daily]');
    if (d) return startDaily(+d.dataset.daily);
    var b = e.target.closest('.room'); if (!b || b.disabled) return;
    startLesson(Lessons.byId(b.dataset.lesson));
  };
  document.querySelectorAll('[data-go]').forEach(function (b) {
    b.addEventListener('click', function () {
      var go = b.dataset.go;
      if (go === 'map') goMap();
      if (go === 'dress') openDress();
      if (go === 'parent') openParent();
      if (go === 'who') showWho();
      if (go === 'saga') playSaga(Saga.soFar(worldDoneFn), [], goMap);
    });
  });
  $('who-list').onclick = function (e) {
    var b = e.target.closest('.who-card'); if (!b) return;
    if (b.dataset.pid === '+') { var p = addProfile(); if (p) renderWhoList(); return; }
    pickProfile(b.dataset.pid);
  };
  // 標題、固定按鈕加注音
  document.querySelectorAll('[data-zy]').forEach(function (el) { el.innerHTML = Z(el.dataset.zy); });
  $('stars').textContent = st.stars;
  renderWhoChip(); renderWhoList();
  window.addEventListener('pagehide', function () { speaker.stop(); });
})();
