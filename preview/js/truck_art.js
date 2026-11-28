/* 新畫風變身戰士（2026-11-28）：使用者用 Gemini 生的 5 台車＋5 個機器人（都是黃色），
 * 圖層：base（全部）、paint（黃色車漆，用濾鏡換成選的顏色）、glow（藍色發光，換成選的燈光顏色），
 * 配件（頭盔、背包、警示燈、貼紙、司機）是另外切出來的小圖，放在每台車固定的位置。
 * 介面和 truck.js 一樣（svg），cropFor／formFor 沿用 truck.js。輪子在新畫風不顯示（履帶車不適合）。 */
var TruckArt = (function () {
  var node = typeof module !== 'undefined' && typeof require === 'function';
  var ST = node ? require('./store.js') : Store;
  var ART = node ? require('./truck_art_data.js') : TRUCK_ART;
  var STAGE = node ? require('./princess_art_data.js') : PRINCESS_ART;
  var DIR = 'art/truck/', VER = '1', W = 848, H = 1264;
  var PAINT_REF = 0.61, GLOW_REF = 0.67;   // 原圖黃色車漆、藍色發光的平均亮度

  // 每台車配件的位置（848×1264 畫布）：[中心 x, 中心 y, 寬]
  var SPOT = {
    excavator: { lights: [550, 812, 80], driver: [560, 885, 70], sticker: [240, 925, 100], head: [430, 205, 150], back: [430, 400] },
    driller:   { lights: [330, 640, 80], driver: [370, 680, 60], sticker: [190, 840, 110], head: [432, 210, 150], back: [432, 400] },
    bulldozer: { lights: [300, 580, 80], driver: [290, 640, 70], sticker: [180, 880, 110], head: [364, 215, 150], back: [400, 400] },
    mixer:     { lights: [540, 580, 80], driver: [620, 705, 70], sticker: [300, 640, 110], head: [450, 205, 150], back: [450, 400] },
    crane:     { lights: [560, 760, 80], driver: [560, 825, 70], sticker: [200, 910, 100], head: [432, 210, 150], back: [432, 400] }
  };

  function img(key, x, y, w, h, extra) {
    return '<image href="' + DIR + key + '.webp?v=' + VER + '" x="' + Math.round(x) + '" y="' + Math.round(y) + '" width="' + Math.round(w) +
      '" height="' + Math.round(h) + '"' + (extra || '') + '/>';
  }
  function layer(key, extra) {
    var r = ART[key];
    return r ? img(key, r[0], r[1], r[2], r[3], extra) : '';
  }
  function tint(id, hex, ref) {
    var c = [1, 3, 5].map(function (i) { return parseInt(hex.substr(i, 2), 16) / 255 / ref; });
    var row = function (k) { return [0.3 * k, 0.59 * k, 0.11 * k, 0, 0].map(function (v) { return v.toFixed(3); }).join(' '); };
    return '<filter id="' + id + '" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="' +
      row(c[0]) + ' ' + row(c[1]) + ' ' + row(c[2]) + ' 0 0 0 1 0"/></filter>';
  }

  function crops(kind) {
    var s = SPOT[kind] || SPOT.excavator, v = ART[kind + '-car'] || [0, 0, W, H];
    return {
      full: [0, 0, W, H],
      cabin: [s.driver[0] - 150, s.driver[1] - 170, 300, 300],
      side: [v[0] - 20, v[1] - 20, v[2] + 40, v[3] + 40],
      robohead: [s.head[0] - 130, s.head[1] - 130, 260, 260]
    };
  }

  function svg(wear, id, crop, form) {
    id = String(id || 'ta').replace(/[^\w-]/g, '');
    var def = ST.defaultWear('truck');
    var pick = function (slot) {
      var v = wear && slot in wear ? wear[slot] : def[slot];
      return v ? ST.item(v) : null;
    };
    var kind = (pick('type') || ST.item(def.type)).look.kind, robot = form === 'robot';
    var key = kind + (robot ? '-robot' : '-car'), s = SPOT[kind] || SPOT.excavator;
    var paint = pick('paint'), glow = pick('glow'), defs = '', p = [];
    var stage = pick('stage');
    if (stage && ART[stage.id]) p.push(layer(stage.id, ' preserveAspectRatio="xMidYMid slice"'));   // 變身戰士自己的舞台
    else if (stage && STAGE[stage.id]) p.push('<image href="art/princess/' + stage.id + '.webp?v=1" x="0" y="0" width="' + W + '" height="' + H + '" preserveAspectRatio="xMidYMid slice"/>');
    else p.push('<rect width="' + W + '" height="' + H + '" fill="#e8eef8"/>');
    // 配件都是 Gemini 直接畫在這台車／機器人上再切出來的圖層（位置和角度才準）；還沒做的配件就先不顯示
    var pf = paint && paint.id !== 'tk-paint-yellow' ? ' filter="url(#' + id + 'pt)"' : '';
    var acc = function (name, part) {   // 配件＋它的黃色部分跟著換車漆顏色
      var k = key + '-' + name + (part || '');
      if (!ART[k]) return '';
      return layer(k) + (pf && ART[k + '-paint'] ? layer(k + '-paint', pf) : '');
    };
    var pack = robot ? pick('pack') : null, helmet = robot ? pick('helmet') : null;
    if (pack) p.push(acc('pack-' + pack.look.kind, '-back'));   // 背包、翅膀在身體後面的部分
    p.push(layer(key));
    if (pf) { defs += tint(id + 'pt', paint.look.c, PAINT_REF); p.push(layer(key + '-paint', pf)); }
    if (glow && glow.id !== 'tk-glow-cyan') { defs += tint(id + 'gl', glow.look.c, GLOW_REF); p.push(layer(key + '-glow', ' filter="url(#' + id + 'gl)"')); }
    if (robot) {
      if (pack) p.push(acc('pack-' + pack.look.kind, '-front'));
      if (helmet && helmet.look.kind !== 'v') p.push(acc('helmet-' + helmet.look.kind));
    } else {
      var sticker = pick('sticker'), driver = pick('driver'), lights = pick('lights');
      if (sticker) p.push(acc('sticker-' + sticker.look.kind));
      if (driver) p.push(acc('driver'));
      if (lights) p.push(acc(lights.id.replace('tk-', '')));
    }
    var box = crops(kind)[crop] || crops(kind).full;
    return '<svg viewBox="' + box.map(Math.round).join(' ') + '"' + (crop && crop !== 'full' ? ' preserveAspectRatio="xMidYMid slice"' : '') +
      ' class="princess art" role="img" aria-label="' + (robot ? '變身戰士機器人' : '變身戰士工程車') + '">' +
      (defs ? '<defs>' + defs + '</defs>' : '') + p.join('') + '</svg>';
  }

  return { svg: svg, SPOT: SPOT };
})();
if (typeof module !== 'undefined') module.exports = TruckArt;
