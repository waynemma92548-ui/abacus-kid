/* 新畫風公主（2026-11-27）：使用者用 Gemini 生的圖，切成圖層（art_src/tools/），這裡用 SVG <image> 疊起來。
 * 圖層順序：舞台 → 後面頭髮 → 身體 → 鞋子 → 衣服 → 飾品 → 前面頭髮 → 頭飾 → 手上的東西
 * 髮色只有咖啡色的圖，其他顏色用 SVG 濾鏡換；拿東西的時候，素體原本張開的手指用遮罩擦掉。
 * 介面和 princess.js 一樣（svg、cropFor），heroes.js 依設定選用哪一種。 */
var PrincessArt = (function () {
  var node = typeof module !== 'undefined' && typeof require === 'function';
  var ST = node ? require('./store.js') : Store;
  var ART = node ? require('./princess_art_data.js') : PRINCESS_ART;
  var DIR = 'art/princess/', VER = '1', W = 848, H = 1264;
  var BROWN = 0.42;   // 咖啡色頭髮的平均亮度（換色時當基準）

  // 小圖的取景範圍（848×1264 畫布）
  var CROPS = {
    full: [0, 0, W, H], upper: [140, 30, 568, 640], head: [250, 40, 348, 348], face: [290, 130, 268, 268],
    hand: [470, 160, 320, 320], shoes: [250, 1000, 350, 350], jewel: [300, 250, 250, 250]
  };

  function img(key, extra) {
    var r = ART[key];
    if (!r) return '';
    return '<image href="' + DIR + key + '.webp?v=' + VER + '" x="' + r[0] + '" y="' + r[1] + '" width="' + r[2] + '" height="' + r[3] + '"' +
      (extra || '') + '/>';
  }

  // 咖啡色 → 目標髮色：先算亮度，再乘上「目標色 ÷ 咖啡色亮度」，明暗層次保留
  function tintFilter(id, hex) {
    var c = [1, 3, 5].map(function (i) { return parseInt(hex.substr(i, 2), 16) / 255 / BROWN; });
    var row = function (k) { return [0.3 * k, 0.59 * k, 0.11 * k, 0, 0].map(function (v) { return v.toFixed(3); }).join(' '); };
    return '<filter id="' + id + 'tint" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="' +
      row(c[0]) + ' ' + row(c[1]) + ' ' + row(c[2]) + ' 0 0 0 1 0"/></filter>';
  }

  function svg(wear, id, crop) {
    id = String(id || 'pa').replace(/[^\w-]/g, '');
    var def = ST.defaultWear('princess');
    var pick = function (slot) {
      var v = wear && slot in wear ? wear[slot] : def[slot];
      return v ? ST.item(v) : null;
    };
    var style = (pick('style') || ST.item(def.style)).look.kind, hair = pick('hair') || ST.item(def.hair);
    var stage = pick('stage'), hand = pick('hand');
    var defs = '', tint = '';
    if (hair.id !== 'hair-brown') { defs += tintFilter(id, hair.look.c); tint = ' filter="url(#' + id + 'tint)"'; }
    var handKey = hand ? hand.id : null, erase = handKey ? 'erase-' + handKey.replace('hand-', '') : null, mask = '';
    if (erase && ART[erase]) {
      defs += '<mask id="' + id + 'hand" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + H + '">' +
        '<rect width="' + W + '" height="' + H + '" fill="#fff"/>' + img(erase) + '</mask>';
      mask = ' mask="url(#' + id + 'hand)"';
    }
    var p = [];
    if (stage && ART[stage.id]) p.push(img(stage.id, ' preserveAspectRatio="xMidYMid slice"'));
    else p.push('<rect width="' + W + '" height="' + H + '" fill="#ffe6f1"/>');
    p.push(img('style-' + style + '-back', tint));
    p.push(img('base', mask));
    ['shoes', 'dress', 'jewel'].forEach(function (s) { var it = pick(s); if (it) p.push(img(it.id)); });
    p.push(img('style-' + style + '-front', tint));
    var head = pick('head');
    if (head) p.push(img(head.id));
    if (hand) p.push(img(hand.id));
    var box = CROPS[crop] || CROPS.full;
    return '<svg viewBox="' + box.join(' ') + '"' + (crop && crop !== 'full' ? ' preserveAspectRatio="xMidYMin slice"' : '') +
      ' class="princess art" role="img" aria-label="偶像公主">' + (defs ? '<defs>' + defs + '</defs>' : '') + p.join('') + '</svg>';
  }

  function cropFor(slot) {
    return { head: 'head', style: 'upper', hair: 'face', hand: 'hand', shoes: 'shoes', jewel: 'jewel' }[slot] || 'full';
  }

  // 每一個公主商品都要有圖（測試用）
  function hasArt(itemId) { return !!(ART[itemId] || ART['style-' + itemId.replace('style-', '') + '-back']); }

  return { svg: svg, cropFor: cropFor, hasArt: hasArt, CROPS: CROPS };
})();
if (typeof module !== 'undefined') module.exports = PrincessArt;
