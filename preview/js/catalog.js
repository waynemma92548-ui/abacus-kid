/* 換裝商品目錄（2026-11-27：四個角色＋共用舞台）。
 * char：角色 id，或角色 id 的陣列（公主和王子共用舞台；2026-11-28 變身戰士有自己的舞台）。slot：哪一類。cost：幾顆星星（0＝一開始就有）。
 * look：畫圖用的資料，各角色的畫圖程式（princess.js、prince.js、robot.js、truck.js）依 look 畫。
 * 2026-11-27 星星不能重複刷之後，價格全部約打 7 折。
 */
var Catalog = (function () {
  var CHARS = [
    { id: 'princess', name: '公主' }, { id: 'prince', name: '王子' },
    { id: 'truck', name: '變身戰士' }
  ];
  var SLOTS = {
    princess: [['dress', '禮服'], ['style', '髮型'], ['hair', '髮色'], ['head', '頭飾'], ['hand', '手上'], ['shoes', '鞋子'], ['jewel', '飾品'], ['stage', '舞台']],
    prince: [['outfit', '衣服'], ['style', '髮型'], ['hair', '髮色'], ['cape', '披風'], ['head', '頭飾'], ['hand', '手上'], ['shoes', '鞋子'], ['stage', '舞台']],
    // 變身戰士（2026-11-27，工程車＋變身機器人合併）：車子、顏色、燈光、貼紙兩種型態共用；輪子、警示燈、司機只有車子；頭盔、背包只有機器人
    truck: [['type', '車子'], ['paint', '顏色'], ['glow', '燈光'], ['sticker', '貼紙'], ['wheels', '輪子'], ['lights', '警示燈'], ['driver', '司機'],
            ['helmet', '頭盔'], ['pack', '背包'], ['stage', '舞台']]
  };
  // 可以不戴的類別（再點一次就拿掉）
  var OPTIONAL = {
    princess: { head: true, hand: true, jewel: true }, prince: { cape: true, head: true, hand: true },
    truck: { lights: true, sticker: true, driver: true, pack: true }
  };

  var ITEMS = [

    // 舞台背景
    { char: ['princess', 'prince'], id: 'stage-pink', slot: 'stage', name: '粉紅舞台', cost: 0, look: { kind: 'spot', sky: ['#ffd6e8', '#fff5fa'], beam: '#ffffff' } },
    { char: ['princess', 'prince'], id: 'stage-sakura', slot: 'stage', name: '櫻花舞台', cost: 8, look: { kind: 'sakura', sky: ['#ffe4ef', '#fffaf3'] } },
    { char: ['princess', 'prince'], id: 'stage-rainbow', slot: 'stage', name: '彩虹舞台', cost: 13, look: { kind: 'rainbow', sky: ['#cdeeff', '#fff7fb'] } },
    { char: ['princess', 'prince'], id: 'stage-star', slot: 'stage', name: '星空舞台', cost: 18, look: { kind: 'night', sky: ['#1d1b4f', '#5b3f99'] } },
    { char: ['princess', 'prince'], id: 'stage-neon', slot: 'stage', name: '霓虹舞台', cost: 21, look: { kind: 'neon', sky: ['#160d2e', '#3a1f5c'] } },
    { char: ['princess', 'prince'], id: 'stage-castle', slot: 'stage', name: '城堡舞台', cost: 24, look: { kind: 'castle', sky: ['#e9dcff', '#fff0f7'] } },
    // 變身戰士專屬舞台（2026-11-28，Gemini 生的背景；原本畫風用 look 的顏色畫簡單背景）
    { char: 'truck', id: 'tk-stage-site', slot: 'stage', name: '工地', cost: 0, look: { kind: 'spot', sky: ['#9fd0ff', '#f6e7c8'], beam: '#ffffff' } },
    { char: 'truck', id: 'tk-stage-city', slot: 'stage', name: '未來城市', cost: 8, look: { kind: 'neon', sky: ['#0d1630', '#24407a'] } },
    { char: 'truck', id: 'tk-stage-base', slot: 'stage', name: '秘密基地', cost: 13, look: { kind: 'spot', sky: ['#1f2a3a', '#3d5168'], beam: '#7fe3ff' } },
    { char: 'truck', id: 'tk-stage-canyon', slot: 'stage', name: '沙漠峽谷', cost: 18, look: { kind: 'spot', sky: ['#ff9a4d', '#ffd7a0'], beam: '#fff2d0' } },
    { char: 'truck', id: 'tk-stage-volcano', slot: 'stage', name: '火山', cost: 21, look: { kind: 'spot', sky: ['#3a1410', '#a8381c'], beam: '#ffb070' } },
    { char: 'truck', id: 'tk-stage-space', slot: 'stage', name: '月球基地', cost: 24, look: { kind: 'night', sky: ['#05060f', '#1d2550'] } },
    // 髮型
    { char: 'princess', id: 'style-long', slot: 'style', name: '公主直髮', cost: 0, look: { kind: 'long' } },
    { char: 'princess', id: 'style-twin', slot: 'style', name: '雙馬尾', cost: 6, look: { kind: 'twin' } },
    { char: 'princess', id: 'style-side', slot: 'style', name: '側馬尾', cost: 7, look: { kind: 'side' } },
    { char: 'princess', id: 'style-hime', slot: 'style', name: '公主切', cost: 8, look: { kind: 'hime' } },
    { char: 'princess', id: 'style-curl', slot: 'style', name: '公主捲髮', cost: 11, look: { kind: 'curl' } },
    { char: 'princess', id: 'style-drill', slot: 'style', name: '捲捲雙馬尾', cost: 15, look: { kind: 'drill' } },
    // 髮色（眼睛顏色跟著髮色）
    { char: 'princess', id: 'hair-brown', slot: 'hair', name: '咖啡色', cost: 0,
      look: { c: '#7a4a2e', shade: '#5a321c', light: '#b98458', eye: ['#5a3a20', '#d39a5c'] } },
    { char: 'princess', id: 'hair-black', slot: 'hair', name: '黑色', cost: 2,
      look: { c: '#352a3a', shade: '#1d1620', light: '#6c5a78', eye: ['#3a2a60', '#a184d6'] } },
    { char: 'princess', id: 'hair-gold', slot: 'hair', name: '金色', cost: 4,
      look: { c: '#f6cd62', shade: '#d9a537', light: '#fff2b8', eye: ['#245fae', '#8cc8ff'] } },
    { char: 'princess', id: 'hair-pink', slot: 'hair', name: '粉紅色', cost: 6,
      look: { c: '#ff9ec7', shade: '#ee6ea4', light: '#ffd8ea', eye: ['#b0175a', '#ff9ec7'] } },
    { char: 'princess', id: 'hair-lavender', slot: 'hair', name: '薰衣草紫', cost: 8,
      look: { c: '#c6a8f2', shade: '#9a78d6', light: '#efe4ff', eye: ['#5e35a8', '#c9a6ff'] } },
    { char: 'princess', id: 'hair-mint', slot: 'hair', name: '薄荷綠', cost: 10,
      look: { c: '#8fdcc0', shade: '#56bb98', light: '#dcf9ee', eye: ['#17806a', '#8fe6cc'] } },
    { char: 'princess', id: 'hair-ice', slot: 'hair', name: '冰藍色', cost: 14,
      look: { c: '#a9d8ff', shade: '#6aacea', light: '#e6f4ff', eye: ['#2357b0', '#a6d6ff'] } },
    // 禮服
    { char: 'princess', id: 'dress-basic', slot: 'dress', name: '白色小禮服', cost: 0,
      look: { kind: 'tutu', c: '#ffffff', shade: '#ffe3ee', light: '#ffc2da', bow: '#ff8fb8' } },
    { char: 'princess', id: 'dress-sweet', slot: 'dress', name: '甜心粉紅', cost: 4,
      look: { kind: 'tutu', c: '#ff9ec7', shade: '#ff7fb2', light: '#ffd6e8', bow: '#ff4f93', pattern: 'heart' } },
    { char: 'princess', id: 'dress-star', slot: 'dress', name: '星光藍', cost: 6,
      look: { kind: 'tutu', c: '#86bdff', shade: '#5f9ff0', light: '#d8eaff', bow: '#ffd45c', pattern: 'star', lattice: true } },
    { char: 'princess', id: 'dress-dream', slot: 'dress', name: '夢幻紫', cost: 8,
      look: { kind: 'tutu', c: '#c3a3f5', shade: '#a27fe6', light: '#efe4ff', bow: '#ff8fd0', pattern: 'lace' } },
    { char: 'princess', id: 'dress-rainbow', slot: 'dress', name: '彩虹糖果', cost: 13,
      look: { kind: 'tutu', c: '#ffd45c', shade: '#ff8fb8', light: '#9fe3c8', bow: '#86bdff',
              layers: ['#c3a3f5', '#86bdff', '#9fe3c8', '#ffe27a', '#ff9ec7'] } },
    { char: 'princess', id: 'dress-sakura', slot: 'dress', name: '櫻花和風', cost: 17,
      look: { kind: 'kimono', c: '#ffb7d0', shade: '#f08cb3', light: '#fff0f5', bow: '#e8436b', obi: '#f2c14e',
              pattern: 'sakura' } },
    { char: 'princess', id: 'dress-moon', slot: 'dress', name: '月光公主', cost: 21,
      look: { kind: 'gown', c: '#5a4bb5', shade: '#2e2a6e', light: '#c9b8ff', bow: '#ffe27a', pattern: 'moon' } },
    { char: 'princess', id: 'dress-crystal', slot: 'dress', name: '水晶偶像', cost: 24,
      look: { kind: 'tutu', c: '#ffffff', shade: '#d6ebff', light: '#ffe6f3', bow: 'rainbow', lattice: true,
              layers: ['#c9e4ff', '#ffd6ec', '#ffffff'] } },
    { char: 'princess', id: 'dress-gold', slot: 'dress', name: '閃亮舞台金', cost: 28,
      look: { kind: 'ball', c: '#ffd45c', shade: '#e7a91c', light: '#fff3c2', bow: '#ff6b9a', pattern: 'gem' } },
    // 頭飾
    { char: 'princess', id: 'head-tiara', slot: 'head', name: '銀色皇冠', cost: 3, look: { kind: 'tiara', c: '#e3e8f0', gem: '#7fb6ff' } },
    { char: 'princess', id: 'head-ribbon', slot: 'head', name: '大蝴蝶結', cost: 4, look: { kind: 'ribbon', c: '#ff5c9a' } },
    { char: 'princess', id: 'head-cat', slot: 'head', name: '貓耳髮箍', cost: 7, look: { kind: 'cat', c: '#ffffff', inner: '#ffb3cf' } },
    { char: 'princess', id: 'head-sakura', slot: 'head', name: '櫻花髮飾', cost: 10, look: { kind: 'flower', c: '#ffb7d0', gem: '#fff27a' } },
    { char: 'princess', id: 'head-neon', slot: 'head', name: '霓虹皇冠', cost: 18, look: { kind: 'neon', c: '#7fe3ff' } },
    { char: 'princess', id: 'head-gold', slot: 'head', name: '金色皇冠', cost: 15, look: { kind: 'tiara', c: '#f6cd62', gem: '#ff5c9a' } },
    // 手上拿的
    { char: 'princess', id: 'hand-mic', slot: 'hand', name: '偶像麥克風', cost: 4, look: { kind: 'mic', c: '#ff8fb8' } },
    { char: 'princess', id: 'hand-heart', slot: 'hand', name: '愛心魔法棒', cost: 6, look: { kind: 'heart', c: '#ff5c9a' } },
    { char: 'princess', id: 'hand-star', slot: 'hand', name: '星星魔法棒', cost: 9, look: { kind: 'star', c: '#ffd45c' } },
    { char: 'princess', id: 'hand-goldmic', slot: 'hand', name: '金色麥克風', cost: 20, look: { kind: 'mic', c: '#f6cd62' } },
    // 鞋子
    { char: 'princess', id: 'shoes-flat', slot: 'shoes', name: '粉紅鞋子', cost: 0, look: { kind: 'flat', c: '#ff9ec7' } },
    { char: 'princess', id: 'shoes-boots', slot: 'shoes', name: '白色靴子', cost: 5, look: { kind: 'boots', c: '#ffffff', trim: '#ff8fb8' } },
    { char: 'princess', id: 'shoes-glass', slot: 'shoes', name: '水晶鞋', cost: 8, look: { kind: 'heels', c: '#bfe6ff' } },
    { char: 'princess', id: 'shoes-gold', slot: 'shoes', name: '金色靴子', cost: 14, look: { kind: 'boots', c: '#f6cd62', trim: '#ffffff' } },
    // 飾品
    { char: 'princess', id: 'jewel-star', slot: 'jewel', name: '星星耳環', cost: 3, look: { kind: 'earring', c: '#ffd45c' } },
    { char: 'princess', id: 'jewel-heart', slot: 'jewel', name: '愛心項鍊', cost: 6, look: { kind: 'necklace', c: '#ff5c9a' } },
    { char: 'princess', id: 'jewel-pearl', slot: 'jewel', name: '珍珠項鍊', cost: 10, look: { kind: 'pearl', c: '#ffffff' } },
    // ---- 王子 ----
    { char: 'prince', id: 'pr-outfit-blue', slot: 'outfit', name: '藍色王子服', cost: 0, look: { kind: 'suit', c: '#4f7fd9', pants: '#f4f1ea', trim: '#f6cd62' } },
    { char: 'prince', id: 'pr-outfit-knight', slot: 'outfit', name: '騎士裝', cost: 6, look: { kind: 'knight', c: '#b9c3d1', pants: '#5b6478', trim: '#4f7fd9' } },
    { char: 'prince', id: 'pr-outfit-sailor', slot: 'outfit', name: '海軍裝', cost: 7, look: { kind: 'sailor', c: '#ffffff', pants: '#24345e', trim: '#2f5bb8' } },
    { char: 'prince', id: 'pr-outfit-red', slot: 'outfit', name: '紅色國王服', cost: 9, look: { kind: 'royal', c: '#d6334b', pants: '#ffffff', trim: '#f6cd62' } },
    { char: 'prince', id: 'pr-outfit-star', slot: 'outfit', name: '星光偶像裝', cost: 13, look: { kind: 'idol', c: '#7b5ad6', pants: '#2b2350', trim: '#ffd45c' } },
    { char: 'prince', id: 'pr-outfit-gold', slot: 'outfit', name: '黃金王子服', cost: 20, look: { kind: 'royal', c: '#f2c14e', pants: '#fff8e1', trim: '#d6334b' } },
    { char: 'prince', id: 'pr-style-short', slot: 'style', name: '短髮', cost: 0, look: { kind: 'short' } },
    { char: 'prince', id: 'pr-style-spiky', slot: 'style', name: '刺刺頭', cost: 4, look: { kind: 'spiky' } },
    { char: 'prince', id: 'pr-style-curly', slot: 'style', name: '捲捲頭', cost: 6, look: { kind: 'curly' } },
    { char: 'prince', id: 'pr-style-tail', slot: 'style', name: '小馬尾', cost: 8, look: { kind: 'tail' } },
    { char: 'prince', id: 'pr-hair-brown', slot: 'hair', name: '咖啡色', cost: 0, look: { c: '#6f4426', shade: '#4d2c15', light: '#a9764e', eye: ['#4a2e18', '#c58d52'] } },
    { char: 'prince', id: 'pr-hair-black', slot: 'hair', name: '黑色', cost: 2, look: { c: '#2d2733', shade: '#17131b', light: '#5d5268', eye: ['#24305e', '#7d93d6'] } },
    { char: 'prince', id: 'pr-hair-gold', slot: 'hair', name: '金色', cost: 4, look: { c: '#f3c85a', shade: '#d39f2f', light: '#fff0b3', eye: ['#1f5aa8', '#86c2ff'] } },
    { char: 'prince', id: 'pr-hair-silver', slot: 'hair', name: '銀色', cost: 7, look: { c: '#d5dbe6', shade: '#9aa6bd', light: '#ffffff', eye: ['#3c3f8f', '#9fa8ff'] } },
    { char: 'prince', id: 'pr-hair-red', slot: 'hair', name: '紅色', cost: 9, look: { c: '#d9503f', shade: '#a8352a', light: '#ff9a84', eye: ['#7a2420', '#f08a6c'] } },
    { char: 'prince', id: 'pr-cape-red', slot: 'cape', name: '紅色披風', cost: 4, look: { c: '#d6334b', lining: '#f6cd62' } },
    { char: 'prince', id: 'pr-cape-blue', slot: 'cape', name: '藍色披風', cost: 5, look: { c: '#2f5bb8', lining: '#ffffff' } },
    { char: 'prince', id: 'pr-cape-star', slot: 'cape', name: '星星披風', cost: 10, look: { c: '#2b2350', lining: '#ffd45c', stars: true } },
    { char: 'prince', id: 'pr-head-crown', slot: 'head', name: '金色皇冠', cost: 5, look: { kind: 'crown', c: '#f6cd62', gem: '#d6334b' } },
    { char: 'prince', id: 'pr-head-silver', slot: 'head', name: '銀色皇冠', cost: 3, look: { kind: 'crown', c: '#dfe4ec', gem: '#4f7fd9' } },
    { char: 'prince', id: 'pr-head-hat', slot: 'head', name: '羽毛帽', cost: 7, look: { kind: 'hat', c: '#24345e', feather: '#ffffff' } },
    { char: 'prince', id: 'pr-hand-sword', slot: 'hand', name: '寶劍', cost: 4, look: { kind: 'sword', c: '#dfe4ec' } },
    { char: 'prince', id: 'pr-hand-flag', slot: 'hand', name: '小旗子', cost: 5, look: { kind: 'flag', c: '#4f7fd9' } },
    { char: 'prince', id: 'pr-hand-scepter', slot: 'hand', name: '權杖', cost: 8, look: { kind: 'scepter', c: '#f6cd62' } },
    { char: 'prince', id: 'pr-shoes-brown', slot: 'shoes', name: '咖啡色靴子', cost: 0, look: { c: '#7a4a2e', trim: '#a9764e' } },
    { char: 'prince', id: 'pr-shoes-black', slot: 'shoes', name: '黑色靴子', cost: 2, look: { c: '#2d2733', trim: '#f6cd62' } },
    { char: 'prince', id: 'pr-shoes-gold', slot: 'shoes', name: '金色靴子', cost: 9, look: { c: '#f2c14e', trim: '#ffffff' } },
    // ---- 工程車 ----
    { char: 'truck', id: 'tk-type-excavator', slot: 'type', name: '挖土機', cost: 0, look: { kind: 'excavator' } },
    { char: 'truck', id: 'tk-type-driller', slot: 'type', name: '鑽地車', cost: 8, look: { kind: 'driller' } },
    { char: 'truck', id: 'tk-type-bulldozer', slot: 'type', name: '推土機', cost: 7, look: { kind: 'bulldozer' } },
    { char: 'truck', id: 'tk-type-mixer', slot: 'type', name: '水泥車', cost: 10, look: { kind: 'mixer' } },
    { char: 'truck', id: 'tk-type-crane', slot: 'type', name: '吊車', cost: 12, look: { kind: 'crane' } },
    { char: 'truck', id: 'tk-glow-cyan', slot: 'glow', name: '藍色光', cost: 0, look: { c: '#5ff2ff' } },
    { char: 'truck', id: 'tk-glow-yellow', slot: 'glow', name: '黃色光', cost: 3, look: { c: '#ffd45c' } },
    { char: 'truck', id: 'tk-glow-green', slot: 'glow', name: '綠色光', cost: 3, look: { c: '#7dff8a' } },
    { char: 'truck', id: 'tk-glow-pink', slot: 'glow', name: '粉紅光', cost: 5, look: { c: '#ff7ad9' } },
    { char: 'truck', id: 'tk-helmet-v', slot: 'helmet', name: 'V字頭盔', cost: 0, look: { kind: 'v' } },
    { char: 'truck', id: 'tk-helmet-horn', slot: 'helmet', name: '獨角頭盔', cost: 5, look: { kind: 'horn' } },
    { char: 'truck', id: 'tk-helmet-wing', slot: 'helmet', name: '鷹翼頭盔', cost: 8, look: { kind: 'wing' } },
    { char: 'truck', id: 'tk-pack-thruster', slot: 'pack', name: '推進器', cost: 5, look: { kind: 'thruster' } },
    { char: 'truck', id: 'tk-pack-wing', slot: 'pack', name: '機翼', cost: 9, look: { kind: 'wing' } },
    { char: 'truck', id: 'tk-pack-light', slot: 'pack', name: '能量光翼', cost: 14, look: { kind: 'light' } },
    { char: 'truck', id: 'tk-paint-yellow', slot: 'paint', name: '黃色', cost: 0, look: { c: '#f6c33b', shade: '#cf9a12' } },
    { char: 'truck', id: 'tk-paint-orange', slot: 'paint', name: '橘色', cost: 2, look: { c: '#ff8f3d', shade: '#d4661c' } },
    { char: 'truck', id: 'tk-paint-red', slot: 'paint', name: '紅色', cost: 2, look: { c: '#e8574f', shade: '#b83a34' } },
    { char: 'truck', id: 'tk-paint-green', slot: 'paint', name: '綠色', cost: 3, look: { c: '#4cc47e', shade: '#2f9459' } },
    { char: 'truck', id: 'tk-paint-blue', slot: 'paint', name: '藍色', cost: 4, look: { c: '#5b9cf2', shade: '#3c74c7' } },
    { char: 'truck', id: 'tk-paint-pink', slot: 'paint', name: '粉紅色', cost: 5, look: { c: '#ff8fbf', shade: '#e0679d' } },
    { char: 'truck', id: 'tk-wheels-black', slot: 'wheels', name: '黑色輪子', cost: 0, look: { kind: 'normal', rim: '#c7ced9' } },
    { char: 'truck', id: 'tk-wheels-big', slot: 'wheels', name: '大大輪子', cost: 5, look: { kind: 'big', rim: '#e8574f' } },
    { char: 'truck', id: 'tk-wheels-gold', slot: 'wheels', name: '金色輪子', cost: 9, look: { kind: 'normal', rim: '#f2c14e' } },
    { char: 'truck', id: 'tk-lights-red', slot: 'lights', name: '紅色警示燈', cost: 3, look: { c: ['#ff4d4d'] } },
    { char: 'truck', id: 'tk-lights-blue', slot: 'lights', name: '藍色警示燈', cost: 4, look: { c: ['#3d8bff'] } },
    { char: 'truck', id: 'tk-lights-rainbow', slot: 'lights', name: '彩虹燈', cost: 8, look: { c: ['#ff4d4d', '#ffd45c', '#4cc47e', '#3d8bff'] } },
    { char: 'truck', id: 'tk-sticker-star', slot: 'sticker', name: '星星貼紙', cost: 2, look: { kind: 'star', c: '#ffffff' } },
    { char: 'truck', id: 'tk-sticker-heart', slot: 'sticker', name: '愛心貼紙', cost: 3, look: { kind: 'heart', c: '#ff5c9a' } },
    { char: 'truck', id: 'tk-sticker-flame', slot: 'sticker', name: '火焰貼紙', cost: 5, look: { kind: 'flame', c: '#ff6b2d' } },
    { char: 'truck', id: 'tk-sticker-bolt', slot: 'sticker', name: '閃電貼紙', cost: 5, look: { kind: 'bolt', c: '#3d8bff' } },
    { char: 'truck', id: 'tk-driver-helmet', slot: 'driver', name: '安全帽小司機', cost: 7, look: { helmet: '#f6c33b' } }
  ];

  function slotsFor(ch) {
    return (SLOTS[ch] || []).map(function (s) { return { id: s[0], name: s[1] }; });
  }

  return { CHARS: CHARS, ITEMS: ITEMS, SLOTS: SLOTS, OPTIONAL: OPTIONAL, slotsFor: slotsFor };
})();
if (typeof module !== 'undefined') module.exports = Catalog;
