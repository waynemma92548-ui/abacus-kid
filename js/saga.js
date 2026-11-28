/* 主線故事「算盤王國保衛戰」（2026-11-27）：序章、每一區的勝利故事、亂亂怪的圖。
 * 故事頁格式同 lessons.js 的 story；{hero} 會換成孩子選的角色（公主／王子／變身戰士）；
 * who: 'hero' 旁邊放主角的頭像、who: 'boss1' 等放壞蛋（MONSTERS 的 key）。 */
var Saga = (function () {
  var HERO_NAME = { princess: '公主', prince: '王子', truck: '變身戰士' };

  var PROLOGUE = [
    { text: '很久很久以前，有一個「算盤王國」。數字精靈們住在算盤上，每天幫大家算數學。', abacus: 7, glow: 'active' },
    { text: '有一天，搗蛋的亂亂怪跑來了！牠把數字全部弄亂，還把精靈們都關起來。', who: 'king' },
    { text: '國王好著急：「誰能救救我們的精靈？」' },
    { text: '這時候，{hero}站了出來：「交給我吧！」', who: 'hero' },
    { text: '要打敗亂亂怪，就要學會算盤的魔法。每學會一招，就能救出更多精靈！', who: 'hero' },
    { text: '第一站是「精靈村」。小英雄，出發吧！', who: 'hero' }
  ];

  // 每一區全部過關後播一次（地圖上「故事」按鈕可以再看）
  var OUTROS = {
    1: [
      { text: '小亂怪被打敗，逃走了！精靈村的精靈全部救出來了！', who: 'boss1' },
      { text: '精靈們一起歡呼：「謝謝{hero}！」', who: 'hero' },
      { text: '可是亂亂怪逃到了「彩虹森林」，還把更多的精靈關在那裡。', who: 'king' },
      { text: '彩虹森林的數字比較大，要請十位的隊長幫忙。{hero}，我們繼續前進！', who: 'hero' }
    ],
    2: [
      { text: '大亂怪被打敗了！彩虹森林的精靈全部救出來了！', who: 'boss2' },
      { text: '森林變回漂亮的彩虹顏色，精靈們一起說：「謝謝{hero}！」', who: 'hero' },
      { text: '亂亂怪又逃走了，這次牠躲進了「星星城堡」。下一站，星星城堡見！', who: 'king' }
    ],
    3: [
      { text: '亂亂將軍被打敗了！{hero}打開最高的塔，救出了精靈國王！', who: 'hero' },
      { text: '精靈國王說：「謝謝你，小英雄！請跟我回星光王宮吧！」' },
      { text: '可是亂亂怪偷偷溜進王宮，把寶庫的數字全部弄亂了。', who: 'king' },
      { text: '寶庫的數字好大，要用到三位數。下一站，星光王宮！', who: 'hero' }
    ],
    4: [
      { text: '亂亂騎士被打敗了！王宮的寶物全部救回來了！', who: 'boss4' },
      { text: '精靈國王頒給{hero}一枚星光勳章：「你已經是 6 級的小英雄了！」', who: 'hero' },
      { text: '亂亂怪又逃走了，這次牠躲進了「乘法王國」。下一個冒險，敬請期待！', who: 'king' }
    ]
  };

  // 亂亂怪一家（原創）：圓滾滾的小怪物，顏色和角不一樣。king＝亂亂怪本人（戴歪掉的皇冠）
  var MONSTERS = {
    king: { body: '#8e44c9', dark: '#5e2a8c', belly: '#c79bea', horns: 2, crown: true },
    boss1: { body: '#4aa0e0', dark: '#2a6a9e', belly: '#a9d6f5', horns: 1 },
    boss2: { body: '#46b26b', dark: '#2a7a45', belly: '#a6e2b9', horns: 2, big: true },
    boss3: { body: '#e0663a', dark: '#9a3a1a', belly: '#f6c09a', horns: 0, big: true, helmet: true },  // 亂亂將軍
    boss4: { body: '#5b6fd6', dark: '#2f3c8f', belly: '#b9c4f5', horns: 2, big: true, helmet: true }   // 亂亂騎士
  };

  function monster(key, id) {
    var m = MONSTERS[key] || MONSTERS.king;
    id = String(id || key).replace(/[^\w-]/g, '');
    var horn = function (x, dir) {
      return '<path d="M' + x + ' 52 Q' + (x + dir * 10) + ' 22 ' + (x + dir * 20) + ' 18 Q' + (x + dir * 12) + ' 34 ' + (x + dir * 14) + ' 56Z" fill="#f2d16b" stroke="#b8962e" stroke-width="2"/>';
    };
    var out = '<svg viewBox="0 0 120 120" class="monster" role="img" aria-label="亂亂怪"><defs>' +
      '<radialGradient id="' + id + 'mb" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff" stop-opacity=".35"/>' +
      '<stop offset=".5" stop-color="' + m.body + '" stop-opacity="0"/></radialGradient></defs>';
    if (m.horns === 2) out += horn(34, -1) + horn(86, 1);
    else if (m.horns === 1) out += horn(52, 1);
    out += '<path d="M60 30 C' + (m.big ? '104 30 110 62 106 88' : '98 30 104 62 100 88') + ' Q98 108 60 108 Q22 108 ' + (m.big ? '14 88 C10 62 16 30' : '20 88 C16 62 22 30') + ' 60 30Z" fill="' + m.body + '" stroke="' + m.dark + '" stroke-width="3"/>' +
      '<path d="M60 30 C98 30 104 62 100 88 Q98 108 60 108 Q22 108 20 88 C16 62 22 30 60 30Z" fill="url(#' + id + 'mb)"/>' +
      '<ellipse cx="60" cy="84" rx="24" ry="18" fill="' + m.belly + '"/>' +
      // 眼睛（一大一小，看起來調皮）
      '<ellipse cx="46" cy="58" rx="11" ry="12" fill="#fff" stroke="' + m.dark + '" stroke-width="2"/><ellipse cx="76" cy="60" rx="8" ry="9" fill="#fff" stroke="' + m.dark + '" stroke-width="2"/>' +
      '<circle cx="48" cy="60" r="5" fill="#2a1a3a"/><circle cx="77" cy="61" r="4" fill="#2a1a3a"/><circle cx="50" cy="57" r="1.8" fill="#fff"/><circle cx="78" cy="59" r="1.4" fill="#fff"/>' +
      '<path d="M34 44 L54 50 M70 52 L86 46" stroke="' + m.dark + '" stroke-width="3" stroke-linecap="round"/>' +
      // 壞壞的笑＋小尖牙
      '<path d="M44 76 Q60 90 78 74" stroke="#2a1a3a" stroke-width="3" fill="#7a2240" stroke-linejoin="round"/>' +
      '<path d="M50 79 L53 85 L56 81Z M66 81 L69 85 L71 78Z" fill="#fff"/>' +
      // 小手
      '<path d="M20 78 Q8 72 10 62 M100 78 Q112 72 110 62" stroke="' + m.dark + '" stroke-width="6" fill="none" stroke-linecap="round"/>';
    if (m.helmet) out += '<path d="M24 50 Q26 18 60 16 Q94 18 96 50 Q78 40 60 40 Q42 40 24 50Z" fill="#8a96a8" stroke="#4a5262" stroke-width="2.5"/>' +
      '<path d="M60 16 L60 40" stroke="#4a5262" stroke-width="3"/><path d="M52 18 Q60 -4 68 18Z" fill="#d6334b" stroke="#8a1a2a" stroke-width="2"/>';
    if (m.crown) out += '<path d="M44 34 L46 14 L54 26 L62 10 L68 26 L78 16 L76 36Z" fill="#ffd45c" stroke="#b8962e" stroke-width="2" transform="rotate(-12 60 26)"/>';
    return out + '</svg>';
  }

  function heroName(ch) { return HERO_NAME[ch] || '小英雄'; }
  function fill(text, ch) { return String(text || '').replace(/\{hero\}/g, heroName(ch)); }

  // 還沒看過的故事：序章、已經完成的區的勝利故事（done(world) 回傳那一區是否全部過關）
  function pending(seen, done) {
    seen = seen || {};
    var out = [], keys = [];
    if (!seen.prologue) { out = out.concat(PROLOGUE); keys.push('prologue'); }
    Object.keys(OUTROS).forEach(function (w) {
      if (!seen['w' + w] && done(Number(w))) { out = out.concat(OUTROS[w]); keys.push('w' + w); }
    });
    return { pages: out, keys: keys };
  }

  // 地圖上「故事」按鈕：從頭看到目前進度
  function soFar(done) {
    var out = PROLOGUE.slice();
    Object.keys(OUTROS).forEach(function (w) { if (done(Number(w))) out = out.concat(OUTROS[w]); });
    return out;
  }

  return { PROLOGUE: PROLOGUE, OUTROS: OUTROS, MONSTERS: MONSTERS, monster: monster, heroName: heroName, fill: fill,
           pending: pending, soFar: soFar };
})();
if (typeof module !== 'undefined') module.exports = Saga;
