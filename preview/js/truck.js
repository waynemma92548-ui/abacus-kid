/* 變身戰士（原創、純 SVG，2026-11-27）：工程車型態＋機器人型態（mecha.js）。
 * 車子：挖土機、推土機、鑽地車（履帶）、水泥車、吊車（輪子）；有金屬光澤、警示條紋、發光車燈。
 * 共用：顏色、燈光、貼紙、車型；只有車子：輪子、警示燈、司機；只有機器人：頭盔、背包。
 * svg(wear, id, crop, form)：form = 'vehicle' 或 'robot'
 */
var Truck = (function () {
  var node = typeof module !== 'undefined' && typeof require === 'function';
  var ST = node ? require('./store.js') : Store;
  var P = (node ? require('./princess.js') : Princess).parts;
  var MC = node ? require('./mecha.js') : Mecha;
  var DARK = '#2b2f3d', STEEL = '#8d96a8', STEEL2 = '#c3cad6', GLASS = '#a8dcff', GROUND = 368;
  var ID = '', GLOW = '';

  function M() { return 'url(#' + ID + 'vp)'; }
  function S() { return 'url(#' + ID + 'vs)'; }
  function G() { return ' filter="url(#' + ID + 'glow)"'; }
  function poly(pts, fill, extra) { return '<polygon points="' + pts + '" fill="' + fill + '" stroke="' + DARK + '" stroke-width="2" stroke-linejoin="round"' + (extra || '') + '/>'; }
  function hazard(x, y, w, h) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="url(#' + ID + 'hz)" stroke="' + DARK + '" stroke-width="1.5"/>'; }
  function defs(c) {
    return '<defs><linearGradient id="' + ID + 'vp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".5"/>' +
      '<stop offset=".2" stop-color="' + c.c + '"/><stop offset="1" stop-color="' + c.shade + '"/></linearGradient>' +
      '<linearGradient id="' + ID + 'vs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + STEEL2 + '"/><stop offset="1" stop-color="' + STEEL + '"/></linearGradient>' +
      '<pattern id="' + ID + 'hz" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
      '<rect width="10" height="10" fill="#f6c33b"/><rect width="5" height="10" fill="' + DARK + '"/></pattern></defs>';
  }

  // 各車型：駕駛室 [x, y, 寬, 高]、貼紙位置
  var GEO = {
    excavator: { cab: [146, 206, 50, 60], sticker: [104, 282] },
    bulldozer: { cab: [124, 200, 52, 62], sticker: [150, 292] },
    driller: { cab: [160, 196, 46, 56], sticker: [140, 286] },
    mixer: { cab: [158, 236, 52, 80], sticker: [88, 266] },
    crane: { cab: [158, 236, 52, 80], sticker: [100, 300] }
  };

  function tracks(x0, x1, rim) {
    var out = '<rect x="' + x0 + '" y="320" width="' + (x1 - x0) + '" height="48" rx="24" fill="' + DARK + '"/>' +
      '<rect x="' + (x0 + 6) + '" y="326" width="' + (x1 - x0 - 12) + '" height="36" rx="18" fill="none" stroke="#565c70" stroke-width="3" stroke-dasharray="7 5"/>';
    var n = Math.floor((x1 - x0 - 40) / 30);
    for (var i = 0; i <= n; i++) {
      var x = x0 + 20 + i * (x1 - x0 - 40) / n, r = (i === 0 || i === n) ? 14 : 10;
      out += '<circle cx="' + x + '" cy="344" r="' + r + '" fill="' + S() + '" stroke="' + DARK + '" stroke-width="2"/><circle cx="' + x + '" cy="344" r="' + (r * 0.4) + '" fill="' + rim + '"/>';
    }
    return out;
  }
  function wheel(x, r, rim) {
    var y = GROUND - r;
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + DARK + '"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 0.58) + '" fill="' + S() + '" stroke="' + rim + '" stroke-width="3"/>' +
      [0, 72, 144, 216, 288].map(function (a) { var t = a * Math.PI / 180; return '<circle cx="' + P.f(x + Math.cos(t) * r * 0.32) + '" cy="' + P.f(y + Math.sin(t) * r * 0.32) + '" r="1.8" fill="' + DARK + '"/>'; }).join('');
  }
  function cab(g) {
    var x = g.cab[0], y = g.cab[1], w = g.cab[2], h = g.cab[3];
    return poly(x + ',' + (y + h) + ' ' + x + ',' + (y + 12) + ' ' + (x + 12) + ',' + y + ' ' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + h), M()) +
      poly((x + 8) + ',' + (y + h * 0.52) + ' ' + (x + 8) + ',' + (y + 14) + ' ' + (x + 16) + ',' + (y + 7) + ' ' + (x + w - 7) + ',' + (y + 7) + ' ' + (x + w - 7) + ',' + (y + h * 0.52), GLASS, ' opacity=".95"') +
      '<path d="M' + (x + 16) + ' ' + (y + 14) + ' L' + (x + 26) + ' ' + (y + 14) + '" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="' + (x + w - 7) + '" cy="' + (y + h - 12) + '" r="5" fill="' + GLOW + '"' + G() + '/>';
  }
  function exhaust(x, y) {
    return '<rect x="' + x + '" y="' + y + '" width="8" height="30" rx="2" fill="' + S() + '" stroke="' + DARK + '" stroke-width="1.5"/>' +
      '<rect x="' + (x - 1) + '" y="' + (y - 4) + '" width="10" height="6" rx="1" fill="' + DARK + '"/>';
  }
  function grille(x, y) {
    return [0, 7, 14].map(function (d) { return '<path d="M' + x + ' ' + (y + d) + ' L' + (x + 26) + ' ' + (y + d) + '" stroke="' + DARK + '" stroke-width="2.5" opacity=".6"/>'; }).join('');
  }

  var BODY = {
    excavator: function (rim) {
      return tracks(38, 202, rim) + '<rect x="70" y="302" width="130" height="18" fill="' + DARK + '"/>' +
        poly('66,302 202,302 206,262 92,262 80,272', M()) + hazard(70, 292, 130, 8) + grille(160, 272) + exhaust(98, 232) +
        poly('112,276 128,270 84,168 70,176', M()) +                                    // 吊臂
        '<path d="M110 262 L90 200" stroke="' + DARK + '" stroke-width="7"/><path d="M110 262 L90 200" stroke="' + STEEL2 + '" stroke-width="3"/>' +
        poly('70,172 86,170 52,248 38,242', M()) + '<circle cx="78" cy="172" r="7" fill="' + DARK + '"/>' +
        poly('30,240 60,236 62,272 44,286 26,274', '#7a808f') +                          // 挖斗
        [30, 39, 48].map(function (x) { return poly(x + ',282 ' + (x + 7) + ',284 ' + (x + 2) + ',296', STEEL2); }).join('');
    },
    bulldozer: function (rim) {
      return tracks(48, 208, rim) + poly('64,320 204,320 208,262 74,262', M()) + hazard(66, 304, 140, 8) + grille(176, 276) + exhaust(186, 224) +
        '<path d="M64 300 L40 304 M64 316 L40 326" stroke="' + DARK + '" stroke-width="8" stroke-linecap="round"/>' +
        poly('14,252 46,256 48,366 16,366 6,310', S()) + hazard(14, 252, 32, 9) +
        '<path d="M20 268 Q10 310 20 358" stroke="' + STEEL + '" stroke-width="3" fill="none"/>' +
        poly('206,300 216,300 230,350 222,354', DARK);                                    // 後面的耙子
    },
    driller: function (rim) {   // 前面是大鑽頭（和機器人的手一樣）
      var spiral = '';
      for (var i = 0; i < 6; i++) { var x = 76 - i * 11, h = 46 - i * 8; spiral += '<path d="M' + x + ' ' + (290 - h) + ' Q' + (x - 10) + ' 290 ' + (x - 2) + ' ' + (290 + h) + '" stroke="' + DARK + '" stroke-width="3" fill="none" opacity=".55"/>'; }
      return tracks(70, 214, rim) + poly('86,320 212,320 214,252 96,252 86,264', M()) + hazard(88, 304, 124, 8) + grille(176, 268) + exhaust(118, 222) +
        [116, 136, 156].map(function (x) { return '<path d="M' + x + ' 256 L' + x + ' 300" stroke="' + DARK + '" stroke-width="2" opacity=".35"/>'; }).join('') +
        '<rect x="80" y="246" width="14" height="88" rx="4" fill="' + S() + '" stroke="' + DARK + '" stroke-width="2"/>' +
        poly('82,238 82,342 8,290', S()) + spiral +
        '<path d="M70 250 L20 286" stroke="#ffffff" stroke-width="3" opacity=".5"/>' +
        '<circle cx="12" cy="290" r="6" fill="' + GLOW + '"' + G() + '/>';
    },
    mixer: function (rim, r) {
      return '<rect x="22" y="312" width="192" height="20" rx="5" fill="' + DARK + '"/>' + hazard(26, 304, 120, 8) +
        '<g transform="rotate(-12 90 268)"><ellipse cx="90" cy="268" rx="66" ry="40" fill="' + M() + '" stroke="' + DARK + '" stroke-width="3"/>' +
        '<path d="M40 246 Q68 290 58 306 M74 232 Q106 278 94 310 M110 232 Q140 276 128 304" stroke="' + DARK + '" stroke-width="5" fill="none" opacity=".45"/>' +
        '<path d="M40 252 Q60 238 86 236" stroke="#ffffff" stroke-width="4" fill="none" opacity=".5"/></g>' +
        poly('18,296 34,282 40,292 26,306', S()) + exhaust(146, 226) + [60, 104, 186].map(function (x) { return wheel(x, r, rim); }).join('');
    },
    crane: function (rim, r) {
      var truss = '';
      for (var i = 0; i < 8; i++) { var y = 286 - i * 24, x = 108 - i * 9; truss += '<path d="M' + x + ' ' + y + ' L' + (x - 3) + ' ' + (y - 22) + ' M' + (x + 12) + ' ' + (y - 2) + ' L' + (x - 3) + ' ' + (y - 22) + '" stroke="' + DARK + '" stroke-width="2"/>'; }
      return '<rect x="22" y="312" width="192" height="20" rx="5" fill="' + DARK + '"/>' + hazard(26, 304, 128, 8) +
        poly('74,284 140,284 140,312 74,312', S()) +
        poly('104,298 122,292 46,94 32,100', M()) + truss +
        '<path d="M38 98 L38 178" stroke="' + DARK + '" stroke-width="2"/>' + poly('38,178 48,192 38,206 28,192', S()) +
        '<path d="M38 206 L38 212 Q52 216 48 230 Q42 238 32 232 L38 228 Q44 224 40 218 Q34 214 32 212" fill="' + STEEL2 + '" stroke="' + DARK + '" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M30 312 L14 352 M150 312 L166 352" stroke="' + DARK + '" stroke-width="6"/>' +
        [62, 104, 186].map(function (x) { return wheel(x, r, rim); }).join('');
    }
  };

  function driver(g, it) {
    if (!it) return '';
    var x = g.cab[0] + g.cab[2] / 2 + 2, y = g.cab[1] + g.cab[3] * 0.52 - 3;
    return '<circle cx="' + x + '" cy="' + (y - 9) + '" r="9.5" fill="#ffe9da"/>' +
      '<path d="M' + (x - 11) + ' ' + (y - 12) + ' Q' + x + ' ' + (y - 29) + ' ' + (x + 11) + ' ' + (y - 12) + 'Z" fill="' + it.look.helmet + '" stroke="#cf9a12"/>' +
      '<circle cx="' + (x - 3.5) + '" cy="' + (y - 8) + '" r="1.4" fill="#3d2236"/><circle cx="' + (x + 3.5) + '" cy="' + (y - 8) + '" r="1.4" fill="#3d2236"/>' +
      '<path d="M' + (x - 3) + ' ' + (y - 4) + ' Q' + x + ' ' + (y - 2) + ' ' + (x + 3) + ' ' + (y - 4) + '" stroke="#c0466a" stroke-width="1.2" fill="none"/>';
  }
  function lights(g, it) {
    if (!it) return '';
    var cols = it.look.c, x0 = g.cab[0] + g.cab[2] / 2 - (cols.length - 1) * 7, y = g.cab[1] - 5;
    return cols.map(function (col, k) {
      var x = x0 + k * 14;
      return '<rect x="' + (x - 6) + '" y="' + (y - 6) + '" width="12" height="9" rx="4" fill="' + col + '" stroke="#ffffff" stroke-width="1.5"/>' + P.sparkle(x, y - 10, 5, col, 'tw', k * 0.3);
    }).join('');
  }
  function sticker(g, it) {
    if (!it) return '';
    var L = it.look, x = g.sticker[0], y = g.sticker[1];
    if (L.kind === 'heart') return P.heart(x, y, 9, L.c, ' stroke="#ffffff" stroke-width="1.5"');
    if (L.kind === 'flame') return '<path d="M' + (x - 12) + ' ' + (y + 8) + ' Q' + (x - 14) + ' ' + (y - 8) + ' ' + (x - 2) + ' ' + (y - 16) + ' Q' + (x - 2) + ' ' + (y - 4) + ' ' + (x + 6) + ' ' + (y - 8) + ' Q' + (x + 14) + ' ' + y + ' ' + (x + 8) + ' ' + (y + 8) + 'Z" fill="' + L.c + '" stroke="#ffd45c" stroke-width="2"/>';
    if (L.kind === 'bolt') return '<path d="M' + (x + 4) + ' ' + (y - 16) + ' L' + (x - 8) + ' ' + (y + 2) + ' L' + x + ' ' + (y + 2) + ' L' + (x - 4) + ' ' + (y + 16) + ' L' + (x + 9) + ' ' + (y - 3) + ' L' + (x + 1) + ' ' + (y - 3) + 'Z" fill="#ffd45c" stroke="' + L.c + '" stroke-width="2"/>';
    return P.star(x, y, 12, L.c, ' stroke="#cf9a12" stroke-width="1.5"');
  }

  // 這一類東西要用哪個型態的小圖：只有機器人的用機器人、只有車子的用車子，共用的跟著現在的型態
  var ROBOT_ONLY = { helmet: 1, pack: 1 }, VEHICLE_ONLY = { wheels: 1, lights: 1, driver: 1 };
  function formFor(slot, cur) { return ROBOT_ONLY[slot] ? 'robot' : VEHICLE_ONLY[slot] ? 'vehicle' : (cur || 'vehicle'); }

  function svg(wear, id, crop, form) {
    id = String(id || 'tk').replace(/[^\w-]/g, '');
    ID = id;
    var def = ST.defaultWear('truck');
    var get = function (slot) { return wear && wear[slot] ? ST.item(wear[slot]) : null; };
    var orDef = function (slot) { return get(slot) || ST.item(def[slot]); };
    var kind = orDef('type').look.kind, g = GEO[kind] || GEO.excavator, c = orDef('paint').look, p = [];
    GLOW = orDef('glow').look.c;
    p.push(P.commonDefs(id));
    p.push(P.stage(orDef('stage'), id));
    if (form === 'robot') {
      p.push(MC.body({ paint: c, glow: GLOW, sticker: get('sticker'), type: kind, helmet: orDef('helmet').look.kind,
                       pack: get('pack') ? get('pack').look.kind : null }, id));
      ID = id; GLOW = orDef('glow').look.c;
    } else {
      var w = orDef('wheels').look, r = w.kind === 'big' ? 26 : 20;
      p.push(defs(c));
      p.push('<ellipse cx="120" cy="370" rx="104" ry="7" fill="#00000022"/>');
      p.push(BODY[kind](w.rim, r));
      p.push(cab(g));
      if (get('driver')) {
        p.push(driver(g, get('driver')));
        p.push('<rect x="' + (g.cab[0] + 8) + '" y="' + (g.cab[1] + 7) + '" width="' + (g.cab[2] - 15) + '" height="' + (g.cab[3] * 0.45) + '" rx="4" fill="' + GLASS + '" opacity=".3"/>');
      }
      p.push(lights(g, get('lights')));
      p.push(sticker(g, get('sticker')));
    }
    [[22, 40, 0], [214, 70, 0.7], [30, 190, 1.4], [212, 180, 0.4]].forEach(function (s) { p.push(P.sparkle(s[0], s[1], 7, '#ffffff', 'tw', s[2])); });
    var box = { cabin: [100, 160, 150, 150], side: [6, 180, 228, 200], robohead: [60, 30, 120, 120] }[crop] || P.CROPS[crop] || P.CROPS.full;
    return '<svg viewBox="' + box.join(' ') + '"' + (crop && crop !== 'full' ? ' preserveAspectRatio="xMidYMid slice"' : '') +
      ' class="princess" role="img" aria-label="' + (form === 'robot' ? '變身戰士機器人' : '變身戰士工程車') + '">' + p.join('') + '</svg>';
  }

  function cropFor(slot, form) {
    if (formFor(slot, form) === 'robot') return slot === 'helmet' ? 'robohead' : 'full';
    return { lights: 'cabin', driver: 'cabin', wheels: 'side', sticker: 'side', paint: 'side', glow: 'side' }[slot] || 'full';
  }

  return { svg: svg, cropFor: cropFor, formFor: formFor };
})();
if (typeof module !== 'undefined') module.exports = Truck;
