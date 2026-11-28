/* 進度、星星、換裝、小朋友帳號、每日挑戰（不碰畫面）。
 * 進度存在瀏覽器 localStorage，每台裝置各自一份；每個小朋友一份（KEY + ':' + 帳號 id）。
 */
var Store = (function () {
  var CAT = (typeof module !== 'undefined' && typeof require === 'function') ? require('./catalog.js') : Catalog;
  var KEY = 'abacus_kids_v1';
  var PROFILES_KEY = 'abacus_kids_profiles';
  var PASS_RATE = 0.8;
  var MAX_PROFILES = 5;
  var DAILY_COUNT = 5;

  var CATALOG = CAT.ITEMS;
  var CHARS = CAT.CHARS;
  // 第一版的商品（已下架）：讀到舊進度時把星星退回
  var LEGACY_COST = {
    'dress-white': 0, 'dress-pink': 5, 'dress-blue': 8, 'dress-purple': 10, 'dress-yellow': 14, 'dress-green': 18,
    'crown-silver': 4, 'crown-gold': 8, 'crown-flower': 12, 'shoes-pink': 3, 'shoes-glass': 7, 'shoes-gold': 10,
    'wand-star': 5, 'wand-heart': 9, 'necklace-pearl': 4, 'necklace-ruby': 11,
    // 2026-11-27 機器人角色合併進變身戰士：舊機器人的東西下架退星星；砂石車改成鑽地車
    'rb-head-square': 0, 'rb-head-round': 3, 'rb-head-tv': 6, 'rb-head-helmet': 9, 'rb-paint-blue': 0, 'rb-paint-red': 2, 'rb-paint-green': 2, 'rb-paint-yellow': 4, 'rb-paint-purple': 5, 'rb-paint-silver': 6, 'rb-paint-gold': 13, 'rb-eyes-round': 0, 'rb-eyes-visor': 4, 'rb-eyes-happy': 4, 'rb-eyes-heart': 7, 'rb-ant-ball': 2, 'rb-ant-star': 4, 'rb-ant-double': 6, 'rb-ant-prop': 10, 'rb-chest-light': 2, 'rb-chest-heart': 4, 'rb-chest-star': 5, 'rb-chest-screen': 6, 'rb-arms-hand': 0, 'rb-arms-claw': 4, 'rb-arms-drill': 8, 'rb-arms-rocket': 11, 'rb-legs-legs': 0, 'rb-legs-wheel': 4, 'rb-legs-track': 7, 'rb-legs-jet': 13, 'tk-type-dump': 0
  };

  function item(id) {
    for (var i = 0; i < CATALOG.length; i++) if (CATALOG[i].id === id) return CATALOG[i];
    return null;
  }
  function slotsFor(ch) { return CAT.slotsFor(ch); }
  function optional(ch, slot) { return !!(CAT.OPTIONAL[ch] && CAT.OPTIONAL[ch][slot]); }
  function fits(it, ch) { return !!it && (it.char === ch || it.char === 'all' || (Array.isArray(it.char) && it.char.indexOf(ch) >= 0)); }

  function defaultWear(ch) {
    var wear = {};
    slotsFor(ch).forEach(function (sl) {
      var free = CATALOG.filter(function (c) { return c.slot === sl.id && fits(c, ch) && c.cost === 0; })[0];
      wear[sl.id] = free ? free.id : null;
    });
    return wear;
  }

  function defaults() {
    var wears = {};
    CHARS.forEach(function (c) { wears[c.id] = defaultWear(c.id); });
    return {
      version: 3, stars: 0, seen: {},
      owned: CATALOG.filter(function (c) { return c.cost === 0; }).map(function (c) { return c.id; }),
      char: 'princess',     // 現在選的角色（地圖和更衣室顯示這個）
      form: 'vehicle',      // 變身戰士現在是車子（vehicle）還是機器人（robot）
      wears: wears,         // 每個角色各自穿什麼；星星和買到的東西四個角色共用
      lessons: {},          // id → {plays, best, last, passed, bestCorrect}
      mistakes: {},         // 方法 → 答錯次數（家長頁用）
      daily: {},            // 每日挑戰：區域 id → {date, got}（每一區各一個，一天各玩一次）
      voice: '',            // 家長選的語音名稱（空白＝自動挑台灣語音）
      physical: false       // true：計算題用自己的實體算盤（螢幕輸入答案）
    };
  }

  // 舊資料轉成現在的格式：下架的退星星、補上新的免費款、穿著的東西不存在就換回預設
  function migrate(st) {
    if (st.wear && !st.wears) st.wears = { princess: st.wear };   // v2 → v3：以前只有公主
    if (!st.daily || typeof st.daily !== 'object') st.daily = {};
    if (st.daily.date) st.daily = { 1: st.daily };                   // 舊版只有一個每日挑戰：算第一區的
    delete st.wear;
    st.wears = st.wears || {};
    if (st.char === 'robot') { st.char = 'truck'; st.form = 'robot'; }   // 舊機器人角色 → 變身戰士的機器人型態
    if (!CHARS.some(function (c) { return c.id === st.char; })) st.char = 'princess';
    if (st.form !== 'robot') st.form = 'vehicle';
    if (st.wears) delete st.wears.robot;
    var keep = [];
    (st.owned || []).forEach(function (id) {
      if (item(id)) { if (keep.indexOf(id) < 0) keep.push(id); }
      else st.stars += LEGACY_COST[id] || 0;
    });
    CATALOG.forEach(function (c) { if (c.cost === 0 && keep.indexOf(c.id) < 0) keep.push(c.id); });
    st.owned = keep;
    CHARS.forEach(function (c) {
      var base = defaultWear(c.id), old = st.wears[c.id] || {}, wear = {};
      Object.keys(base).forEach(function (slot) {
        var id = old[slot], it = id ? item(id) : null;
        if (it && it.slot === slot && fits(it, c.id) && keep.indexOf(id) >= 0) wear[slot] = id;
        else wear[slot] = optional(c.id, slot) && id === null ? null : base[slot];
      });
      st.wears[c.id] = wear;
    });
    if (!st.seen || typeof st.seen !== 'object') st.seen = {};   // 看過的主線故事（saga.js）
    st.version = 3;
    return st;
  }

  function keyFor(id) { return id ? KEY + ':' + id : KEY; }

  // 讀不到或壞掉就用預設；舊版少的欄位補上預設值（以後加欄位不會壞）
  function load(storage, id) {
    var st = defaults();
    try {
      var saved = JSON.parse(storage.getItem(keyFor(id)));
      if (saved && typeof saved === 'object') {
        Object.keys(saved).forEach(function (k) { st[k] = saved[k]; });
        if (saved.wear && !saved.wears) st.wears = null;
        if (!Array.isArray(st.owned)) st.owned = [];
        migrate(st);
      }
    } catch (e) { st = defaults(); /* 私密瀏覽或資料壞掉：從頭開始 */ }
    return st;
  }

  function save(storage, st, id) {
    try { storage.setItem(keyFor(id), JSON.stringify(st)); return true; } catch (e) { return false; }
  }

  // ---- 小朋友帳號（2026-11-27：三個小孩各自的進度）----
  // meta = {list: [{id, name}], current}；舊版只有一份進度的，搬到第一個帳號
  function saveProfiles(storage, meta) {
    try { storage.setItem(PROFILES_KEY, JSON.stringify(meta)); return true; } catch (e) { return false; }
  }
  function loadProfiles(storage) {
    var meta = null;
    try { meta = JSON.parse(storage.getItem(PROFILES_KEY)); } catch (e) { meta = null; }
    if (!meta || !Array.isArray(meta.list) || !meta.list.length) {
      meta = { list: [{ id: 'p1', name: '小英雄1' }], current: 'p1' };
      try {
        var old = storage.getItem(KEY);
        if (old && !storage.getItem(keyFor('p1'))) storage.setItem(keyFor('p1'), old);
      } catch (e) { /* 存不了就算了 */ }
      saveProfiles(storage, meta);
    }
    return meta;
  }
  function addProfile(meta, name) {
    if (meta.list.length >= MAX_PROFILES) return null;
    var n = 1;
    while (meta.list.some(function (p) { return p.id === 'p' + n; })) n++;
    var p = { id: 'p' + n, name: String(name || '').trim().slice(0, 8) || ('小英雄' + n) };
    meta.list.push(p);
    return p;
  }
  function renameProfile(meta, id, name) {
    var p = meta.list.filter(function (x) { return x.id === id; })[0];
    name = String(name || '').trim().slice(0, 8);
    if (!p || !name) return false;
    p.name = name;
    return true;
  }
  // 最後一個不能刪；刪掉的帳號進度也清掉
  function removeProfile(storage, meta, id) {
    if (meta.list.length <= 1) return false;
    var before = meta.list.length;
    meta.list = meta.list.filter(function (p) { return p.id !== id; });
    if (meta.list.length === before) return false;
    if (meta.current === id) meta.current = meta.list[0].id;
    try { storage.removeItem(keyFor(id)); } catch (e) { /* 沒關係 */ }
    return true;
  }

  // ---- 關卡星星 ----
  // 一關最多拿「題數」顆星（答對一題一顆），重玩只拿「比之前最好多答對的部分」，不能靠重複玩簡單的關卡刷星星；
  // 地圖上的「拿到幾顆 / 最多幾顆」就是 got / total，和結果頁一致。
  function lessonStars(rec, total) {
    if (!rec) return 0;
    var n = rec.bestCorrect !== undefined ? rec.bestCorrect : Math.round((rec.best || 0) * total);
    return Math.max(0, Math.min(total, n || 0));   // 紀錄缺欄位也不會出現 NaN
  }

  // 一次練習結束：correct＝第一次就答對的題數。回傳 {passed, earned, got, total}
  // passRate：這一關自己的過關標準（級檢定 0.7＝10 題對 7 題，和正式檢定一樣）
  function recordSession(st, lessonId, correct, total, ms, passRate) {
    var rate = total ? correct / total : 0;
    var passed = rate >= (passRate || PASS_RATE) - 1e-9;
    var rec = st.lessons[lessonId] || { plays: 0, best: 0, last: 0, passed: false };
    var before = lessonStars(rec, total);
    rec.plays += 1;
    rec.last = rate;
    rec.best = Math.max(rec.best, rate);
    rec.bestCorrect = Math.max(before, correct);
    rec.passed = rec.passed || passed;
    if (ms > 0) {   // 2026-11-27 記錄時間：最近一次、過關時最快的一次（之後高級要限時）
      rec.lastMs = ms;
      if (passed && (!rec.bestMs || ms < rec.bestMs)) rec.bestMs = ms;
    }
    st.lessons[lessonId] = rec;
    var earned = Math.max(0, rec.bestCorrect - before);
    st.stars += earned;
    return { passed: passed, earned: earned, rate: rate, got: rec.bestCorrect, total: total };
  }

  // ---- 每日挑戰（2026-11-27）：分區域，一區的關卡全部過關才打開那一區的；每區一天一次、5 題，答對一題一顆星 ----
  // 解鎖越多區域，每天能玩的每日挑戰就越多（使用者要求：靠程度拿星星，不是靠重複刷）
  function today(now) {
    var d = now || new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  // 這一區（不算即將推出的）每一關都過關了
  function worldDone(lessons, st, world) {
    var ls = lessons.filter(function (l) { return l.world === world && !l.comingSoon; });
    return ls.length > 0 && ls.every(function (l) { return st.lessons[l.id] && st.lessons[l.id].passed; });
  }
  function dailyRec(st, world) { return (st.daily || {})[world] || null; }
  function dailyAvailable(st, world, now) { var r = dailyRec(st, world); return !r || r.date !== today(now); }
  function recordDaily(st, world, correct, now) {
    if (!dailyAvailable(st, world, now)) return { earned: 0, got: dailyRec(st, world).got, total: DAILY_COUNT, passed: true };
    var got = Math.max(0, Math.min(DAILY_COUNT, correct));
    st.daily = st.daily || {};
    st.daily[world] = { date: today(now), got: got };
    st.stars += got;
    return { earned: got, got: got, total: DAILY_COUNT, passed: true };
  }

  function recordMistake(st, kind) {
    st.mistakes[kind] = (st.mistakes[kind] || 0) + 1;
  }

  // 第一關一定開；之後要前一關過關才開（自己以前過關過的也開：2026-11-27 中間插新關卡時，舊進度不會被鎖住）；comingSoon 的永遠不開
  function isUnlocked(lessons, st, idx) {
    var l = lessons[idx];
    if (!l || l.comingSoon) return false;
    if (idx === 0 || st.unlockAll) return true;   // unlockAll：家長頁「開放全部關卡」
    // 前一關＝同一種（珠算／心算）的上一關；心算第一關前面沒有心算關卡，一開始就開（2026-11-28）
    var track = l.track || 'abacus', prev = null;
    for (var i = idx - 1; i >= 0 && !prev; i--) if ((lessons[i].track || 'abacus') === track) prev = lessons[i];
    var passed = function (x) { return !!(st.lessons[x.id] && st.lessons[x.id].passed); };
    return !prev || passed(prev) || passed(l);
  }

  // ---- 換裝 ----
  function curWear(st) { return st.wears[st.char]; }

  function setChar(st, ch) {
    if (!CHARS.some(function (c) { return c.id === ch; })) return false;
    st.char = ch;
    return true;
  }

  function toggleForm(st) { st.form = st.form === 'robot' ? 'vehicle' : 'robot'; return st.form; }

  // 買給「現在的角色」並馬上穿上（舞台每個角色都能用）
  function buy(st, id) {
    var it = item(id);
    if (!it || !fits(it, st.char) || st.owned.indexOf(id) >= 0 || st.stars < it.cost) return false;
    st.stars -= it.cost;
    st.owned.push(id);
    curWear(st)[it.slot] = id;
    return true;
  }

  // 穿上已經有的；可以不戴的類別再點一次同一件就拿掉
  function wear(st, id) {
    var it = item(id), w = curWear(st);
    if (!it || !fits(it, st.char) || st.owned.indexOf(id) < 0) return false;
    if (w[it.slot] === id && optional(st.char, it.slot)) w[it.slot] = null;
    else w[it.slot] = id;
    return true;
  }

  return { KEY: KEY, PROFILES_KEY: PROFILES_KEY, PASS_RATE: PASS_RATE, MAX_PROFILES: MAX_PROFILES, DAILY_COUNT: DAILY_COUNT,
           CATALOG: CATALOG, CHARS: CHARS, slotsFor: slotsFor, optional: optional, fits: fits, item: item,
           defaultWear: defaultWear, defaults: defaults, migrate: migrate, load: load, save: save, keyFor: keyFor,
           loadProfiles: loadProfiles, saveProfiles: saveProfiles, addProfile: addProfile, renameProfile: renameProfile,
           removeProfile: removeProfile, recordSession: recordSession, lessonStars: lessonStars,
           today: today, worldDone: worldDone, dailyRec: dailyRec, dailyAvailable: dailyAvailable, recordDaily: recordDaily,
           recordMistake: recordMistake, isUnlocked: isUnlocked, curWear: curWear, setChar: setChar, toggleForm: toggleForm, buy: buy, wear: wear };
})();
if (typeof module !== 'undefined') module.exports = Store;
