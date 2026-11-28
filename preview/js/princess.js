/* 偶像公主換裝圖（原創、純 SVG）。
 * 2026-11-26 第三版：參考日本偶像動畫的「大姊姊」畫風——頭小、身體和腿長、閃亮大眼睛、偶像舞台裝。
 * 只參考畫風，角色和衣服都是原創，不畫任何現有作品的人物。
 * svg(wear, id, crop)：wear 是各類別穿的商品 id；id 是這張圖的代號（同一頁好幾張圖時漸層 id 才不會撞到）；
 * crop 只畫局部（更衣室小圖用）。
 */
var Princess = (function () {
  var ST = (typeof module !== 'undefined' && typeof require === 'function') ? require('./store.js') : Store;
  var SK = '#ffeadf', SK_SH = '#f5c9b3', LINE = '#3d2236';
  var W = 240, H = 400, CX = 120;
  var HAND = [170, 132];   // 右手（拿東西）的位置
  var CROPS = {
    full: [0, 0, W, H], upper: [22, 10, 196, 220], head: [66, 8, 108, 108], face: [78, 28, 84, 84], hand: [128, 74, 84, 84],
    shoes: [70, 290, 100, 100], jewel: [78, 66, 84, 84]
  };

  function f(n) { return Math.round(n * 10) / 10; }

  function star(cx, cy, r, color, extra) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var rr = i % 2 ? r * 0.45 : r, a = Math.PI / 5 * i - Math.PI / 2;
      pts.push(f(cx + rr * Math.cos(a)) + ',' + f(cy + rr * Math.sin(a)));
    }
    return '<polygon points="' + pts.join(' ') + '" fill="' + color + '"' + (extra || '') + '/>';
  }

  // 四角閃光 ✦
  function sparkle(cx, cy, r, color, cls, delay) {
    var d = 'M' + cx + ' ' + f(cy - r) + ' Q' + cx + ' ' + cy + ' ' + f(cx + r) + ' ' + cy + ' Q' + cx + ' ' + cy + ' ' +
      cx + ' ' + f(cy + r) + ' Q' + cx + ' ' + cy + ' ' + f(cx - r) + ' ' + cy + ' Q' + cx + ' ' + cy + ' ' + cx + ' ' + f(cy - r) + 'Z';
    return '<path d="' + d + '" fill="' + color + '"' + (cls ? ' class="' + cls + '"' : '') +
      (delay !== undefined ? ' style="animation-delay:' + delay + 's"' : '') + '/>';
  }

  function heart(cx, cy, s, color, extra) {
    return '<path d="M' + cx + ' ' + f(cy + s) + ' C' + f(cx - s * 1.7) + ' ' + f(cy - s * 0.1) + ' ' + f(cx - s * 0.7) + ' ' +
      f(cy - s * 1.4) + ' ' + cx + ' ' + f(cy - s * 0.45) + ' C' + f(cx + s * 0.7) + ' ' + f(cy - s * 1.4) + ' ' +
      f(cx + s * 1.7) + ' ' + f(cy - s * 0.1) + ' ' + cx + ' ' + f(cy + s) + 'Z" fill="' + color + '"' + (extra || '') + '/>';
  }

  function sakura(cx, cy, r, color) {
    var out = '';
    for (var i = 0; i < 5; i++) {
      var a = Math.PI * 2 / 5 * i - Math.PI / 2, x = f(cx + Math.cos(a) * r * 0.55), y = f(cy + Math.sin(a) * r * 0.55);
      out += '<ellipse cx="' + x + '" cy="' + y + '" rx="' + f(r * 0.45) + '" ry="' + f(r * 0.62) + '" fill="' + color +
        '" transform="rotate(' + f(a * 180 / Math.PI + 90) + ' ' + x + ' ' + y + ')"/>';
    }
    return out + '<circle cx="' + cx + '" cy="' + cy + '" r="' + f(r * 0.22) + '" fill="#fff27a"/>';
  }

  function bow(cx, cy, s, color, tails) {
    return (tails ? '<path d="M' + cx + ' ' + cy + ' L' + f(cx - s * 0.7) + ' ' + f(cy + s * 1.6) + ' L' + f(cx - s * 0.15) + ' ' +
      f(cy + s * 1.35) + 'Z M' + cx + ' ' + cy + ' L' + f(cx + s * 0.7) + ' ' + f(cy + s * 1.6) + ' L' + f(cx + s * 0.15) + ' ' +
      f(cy + s * 1.35) + 'Z" fill="' + color + '"/>' : '') +
      '<path d="M' + cx + ' ' + cy + ' Q' + f(cx - s * 1.2) + ' ' + f(cy - s) + ' ' + f(cx - s * 1.3) + ' ' + cy + ' Q' + f(cx - s * 1.2) + ' ' +
      f(cy + s) + ' ' + cx + ' ' + cy + ' Q' + f(cx + s * 1.2) + ' ' + f(cy - s) + ' ' + f(cx + s * 1.3) + ' ' + cy + ' Q' + f(cx + s * 1.2) + ' ' +
      f(cy + s) + ' ' + cx + ' ' + cy + 'Z" fill="' + color + '" stroke="#00000026"/>' +
      '<path d="M' + f(cx - s * 0.3) + ' ' + cy + ' Q' + f(cx - s * 0.8) + ' ' + f(cy - s * 0.4) + ' ' + f(cx - s * 1.05) + ' ' + cy +
      ' M' + f(cx + s * 0.3) + ' ' + cy + ' Q' + f(cx + s * 0.8) + ' ' + f(cy - s * 0.4) + ' ' + f(cx + s * 1.05) + ' ' + cy +
      '" fill="none" stroke="#fff" opacity=".6"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + f(s * 0.3) + '" fill="' + color + '" stroke="#00000033"/>';
  }

  // 蓬蓬裙的一層：腰在 (wl~wr, top)，裙襬 n 個波浪，從 xR 往左到 xL
  function layer(top, wl, wr, xL, xR, y, n, depth, fill, stroke) {
    var w = (xR - xL) / n, d = 'M' + wl + ' ' + top + ' L' + wr + ' ' + top + ' Q' + f(xR - 4) + ' ' + f((top + y) / 2) + ' ' + xR + ' ' + y;
    for (var i = 0; i < n; i++) {
      var x0 = xR - i * w, x1 = x0 - w;
      d += ' Q' + f(x0 - w / 2) + ' ' + (y + depth) + ' ' + f(x1) + ' ' + y;
    }
    d += ' Q' + f(xL + 4) + ' ' + f((top + y) / 2) + ' ' + wl + ' ' + top + 'Z';
    return '<path d="' + d + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="1.2"' : '') + '/>';
  }

  function lace(xL, xR, y, n, color, r) {
    var out = '', w = (xR - xL) / n;
    for (var i = 0; i <= n; i++) out += '<circle cx="' + f(xL + i * w) + '" cy="' + (y + 2) + '" r="' + (r || 2.6) + '" fill="' + color + '"/>';
    return out;
  }

  // 每張圖共用的漸層和發光效果（id 前綴避免同一頁撞名）
  function commonDefs(id) {
    var stripes = ['#ffb3d1', '#ffe08a', '#a8ecd0', '#a9d3ff', '#d3b8ff'];
    var stops = '';
    stripes.forEach(function (c, k) {
      stops += '<stop offset="' + f(k / 5) + '" stop-color="' + c + '"/><stop offset="' + f((k + 1) / 5 - 0.001) + '" stop-color="' + c + '"/>';
    });
    return '<defs><linearGradient id="' + id + 'rb" x1="0" y1="0" x2="0" y2="1">' + stops + '</linearGradient>' +
      '<filter id="' + id + 'glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/>' +
      '<feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
  }
  // 'rainbow' → 彩虹條紋漸層
  function col(c, id) { return c === 'rainbow' ? 'url(#' + id + 'rb)' : c; }

  // 霓虹線條的形狀（只有外框、會發光）
  function neon(kind, cx, cy, r, color, id, rot) {
    var d;
    if (kind === 'tri') d = 'M' + cx + ' ' + f(cy - r) + ' L' + f(cx + r * 0.87) + ' ' + f(cy + r / 2) + ' L' + f(cx - r * 0.87) + ' ' + f(cy + r / 2) + 'Z';
    else if (kind === 'heart') d = 'M' + cx + ' ' + f(cy + r) + ' C' + f(cx - r * 1.7) + ' ' + f(cy - r * 0.1) + ' ' + f(cx - r * 0.7) + ' ' + f(cy - r * 1.4) + ' ' + cx + ' ' + f(cy - r * 0.45) + ' C' + f(cx + r * 0.7) + ' ' + f(cy - r * 1.4) + ' ' + f(cx + r * 1.7) + ' ' + f(cy - r * 0.1) + ' ' + cx + ' ' + f(cy + r) + 'Z';
    else if (kind === 'moon') d = 'M' + f(cx + r * 0.3) + ' ' + f(cy - r) + ' A' + r + ' ' + r + ' 0 1 0 ' + f(cx + r * 0.3) + ' ' + f(cy + r) + ' A' + f(r * 0.75) + ' ' + f(r * 0.75) + ' 0 1 1 ' + f(cx + r * 0.3) + ' ' + f(cy - r) + 'Z';
    else {
      var pts = [];
      for (var i = 0; i < 10; i++) {
        var rr = i % 2 ? r * 0.45 : r, a = Math.PI / 5 * i - Math.PI / 2;
        pts.push(f(cx + rr * Math.cos(a)) + ' ' + f(cy + rr * Math.sin(a)));
      }
      d = 'M' + pts.join(' L') + 'Z';
    }
    return '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2.2" stroke-linejoin="round" filter="url(#' + id + 'glow)"' +
      (rot ? ' transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"' : '') + '/>';
  }

  // ---------- 舞台 ----------
  function stage(s, id) {
    var L = s.look, i, out = '<defs><linearGradient id="' + id + 'sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' +
      L.sky[0] + '"/><stop offset="1" stop-color="' + L.sky[1] + '"/></linearGradient></defs>' +
      '<rect width="' + W + '" height="' + H + '" fill="url(#' + id + 'sky)"/>';
    if (L.kind === 'spot') {
      out += '<path d="M40 0 L6 390 L96 390Z M200 0 L144 390 L234 390Z" fill="#fff" opacity=".35"/>' +
        '<path d="M120 0 L76 390 L164 390Z" fill="#fff" opacity=".25"/>';
    } else if (L.kind === 'sakura') {
      out += '<path d="M240 30 Q190 40 160 20 M240 60 Q200 70 185 52 M0 50 Q40 40 60 20" stroke="#8a5a4a" stroke-width="5" fill="none" stroke-linecap="round"/>';
      [[170, 22], [190, 42], [215, 30], [200, 62], [228, 52], [30, 38], [55, 24], [12, 60]].forEach(function (p) {
        out += sakura(p[0], p[1], 9, '#ffb7d0');
      });
      [[30, 140], [210, 120], [50, 230], [196, 250], [20, 320], [225, 300], [140, 30]].forEach(function (p, k) {
        out += '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="4" ry="6" fill="#ffc6da" transform="rotate(' + (k * 40) + ' ' + p[0] + ' ' + p[1] + ')"/>';
      });
    } else if (L.kind === 'rainbow') {
      ['#ff9ec7', '#ffd45c', '#9fe3c8', '#86bdff', '#c3a3f5'].forEach(function (c, k) {
        out += '<path d="M-20 240 A140 140 0 0 1 260 240" fill="none" stroke="' + c + '" stroke-width="12" transform="translate(0 ' + (k * 12) + ')" opacity=".75"/>';
      });
      [[40, 250], [200, 240]].forEach(function (p) {
        out += '<g fill="#fff"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="18"/><circle cx="' + (p[0] + 18) + '" cy="' + (p[1] + 4) + '" r="14"/><circle cx="' + (p[0] - 18) + '" cy="' + (p[1] + 5) + '" r="13"/></g>';
      });
    } else if (L.kind === 'night') {
      for (i = 0; i < 26; i++) {
        out += '<circle cx="' + ((i * 53) % 236 + 2) + '" cy="' + ((i * 37) % 300 + 6) + '" r="' + (i % 3 ? 1.2 : 2) + '" fill="#fff" opacity=".85"/>';
      }
      out += '<circle cx="200" cy="44" r="20" fill="#fff6c2"/><circle cx="210" cy="38" r="18" fill="#2c2762"/>';
    } else if (L.kind === 'neon') {
      [['heart', 34, 60, 14, '#ff8fd0', -12], ['tri', 204, 48, 18, '#7fe3ff', 10], ['star', 26, 200, 12, '#fff27a', 0],
       ['moon', 214, 170, 13, '#c9a6ff', 0], ['tri', 36, 300, 14, '#a8ff9e', -20], ['heart', 208, 300, 12, '#7fe3ff', 15],
       ['star', 196, 110, 8, '#ff8fd0', 0], ['heart', 60, 130, 8, '#fff27a', 0]].forEach(function (n) {
        out += neon(n[0], n[1], n[2], n[3], n[4], id, n[5]);
      });
      out += '<ellipse cx="120" cy="378" rx="104" ry="16" fill="none" stroke="#ff8fd0" stroke-width="2" filter="url(#' + id + 'glow)"/>';
    } else if (L.kind === 'castle') {
      out += '<g fill="#e4d6fa" opacity=".6"><rect x="20" y="190" width="200" height="170"/>' +
        '<rect x="40" y="130" width="34" height="100"/><rect x="166" y="130" width="34" height="100"/><rect x="100" y="110" width="40" height="120"/>' +
        '<path d="M36 132 L57 90 L78 132Z M162 132 L183 90 L204 132Z M96 112 L120 60 L144 112Z" fill="#f3a8cc"/></g>' +
        '<g fill="#fff6c2" opacity=".8"><rect x="52" y="155" width="10" height="16" rx="5"/><rect x="178" y="155" width="10" height="16" rx="5"/><rect x="114" y="140" width="12" height="20" rx="6"/></g>';
    }
    out += '<ellipse cx="120" cy="378" rx="104" ry="16" fill="#ffffff" opacity=".55"/>';
    return out;
  }

  // ---------- 頭髮（上面顏色漸層到髮尾的亮色）----------
  function hairDefs(h, id) {
    return '<defs><linearGradient id="' + id + 'hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + h.c +
      '"/><stop offset=".55" stop-color="' + h.c + '"/><stop offset="1" stop-color="' + h.light + '"/></linearGradient></defs>';
  }

  function hairBack(style, h, id) {
    var c = 'url(#' + id + 'hair)', sh = h.shade;
    if (style === 'long') {
      return '<path d="M84 70 Q80 24 120 24 Q160 24 156 70 Q176 160 188 274 Q178 268 172 282 Q164 236 148 204 Q134 186 120 182 Q106 186 92 204 Q76 236 68 282 Q62 268 52 274 Q64 160 84 70Z" fill="' + c + '"/>' +
        '<path d="M92 120 L66 268 M148 120 L174 268" stroke="' + sh + '" stroke-width="2.5" opacity=".35"/>';
    }
    if (style === 'hime') {   // 公主切：又長又直、兩邊到下巴切齊
      return '<path d="M84 66 Q80 22 120 22 Q160 22 156 66 Q178 170 188 298 L160 298 Q152 226 142 200 Q130 184 120 182 Q110 184 98 200 Q88 226 80 298 L52 298 Q62 170 84 66Z" fill="' + c + '"/>' +
        '<path d="M90 120 L68 292 M150 120 L172 292" stroke="' + sh + '" stroke-width="2.5" opacity=".35"/>';
    }
    if (style === 'drill') {  // 捲捲雙馬尾：一圈一圈往下
      var rolls = '';
      [-1, 1].forEach(function (side) {
        rolls += '<path d="M' + (CX + side * 34) + ' 44 Q' + (CX + side * 58) + ' 60 ' + (CX + side * 56) + ' 90 L' + (CX + side * 58) + ' 270 L' + (CX + side * 44) + ' 270 L' + (CX + side * 40) + ' 70Z" fill="' + c + '"/>';
        for (var i = 0; i < 7; i++) {
          var rx = CX + side * (54 + (i % 2) * 5), ry = 86 + i * 29;
          rolls += '<ellipse cx="' + rx + '" cy="' + ry + '" rx="' + (17 - i * 0.6) + '" ry="15" fill="' + c + '"/>' +
            '<path d="M' + (rx - 14) + ' ' + (ry - 4) + ' Q' + rx + ' ' + (ry + 12) + ' ' + (rx + 14) + ' ' + (ry - 4) + '" stroke="' + sh + '" stroke-width="2" fill="none" opacity=".55"/>' +
            '<path d="M' + (rx - 8) + ' ' + (ry - 9) + ' Q' + rx + ' ' + (ry - 12) + ' ' + (rx + 8) + ' ' + (ry - 9) + '" stroke="' + h.light + '" stroke-width="2.4" fill="none" opacity=".8"/>';
        }
      });
      return '<path d="M86 70 Q82 26 120 26 Q158 26 154 70 L150 118 L90 118Z" fill="' + c + '"/>' + rolls;
    }
    if (style === 'curl') {
      return '<path d="M84 70 Q80 24 120 24 Q160 24 156 70 Q176 110 162 140 Q182 170 162 196 Q182 224 158 250 Q146 262 142 220 Q120 186 98 220 Q94 262 82 250 Q58 224 78 196 Q58 170 78 140 Q64 110 84 70Z" fill="' + c + '"/>' +
        '<path d="M80 150 Q94 160 84 174 M160 150 Q146 160 156 174 M80 206 Q94 216 86 230 M160 206 Q146 216 154 230" stroke="' + sh + '" stroke-width="2.5" fill="none" opacity=".5"/>';
    }
    var base = '<path d="M86 70 Q82 26 120 26 Q158 26 154 70 L150 118 L90 118Z" fill="' + c + '"/>';
    var tail = function (side) {   // side：-1 左、1 右
      var x = CX + side * 36;
      return '<path d="M' + x + ' 44 Q' + (x + side * 42) + ' 66 ' + (x + side * 38) + ' 150 Q' + (x + side * 34) + ' 226 ' +
        (x + side * 54) + ' 280 Q' + (x + side * 12) + ' 248 ' + (x + side * 10) + ' 160 Q' + (x + side * 6) + ' 96 ' + (x - side * 6) + ' 64Z" fill="' +
        c + '"/><path d="M' + (x + side * 22) + ' 96 Q' + (x + side * 30) + ' 170 ' + (x + side * 38) + ' 250" stroke="' + sh +
        '" stroke-width="2.5" fill="none" opacity=".4"/>';
    };
    if (style === 'twin') return base + tail(-1) + tail(1);
    return base + tail(1);
  }

  function hairFront(style, h, id) {
    var c = 'url(#' + id + 'hair)', sh = h.shade, li = h.light;
    var locks = '<path d="M90 62 Q80 112 84 160 Q88 134 91 106 Q90 84 92 68Z M150 62 Q160 112 156 160 Q152 134 149 106 Q150 84 148 68Z" fill="' + c + '"/>';
    var bangs = '<path d="M88 74 Q84 28 120 26 Q156 28 152 74 L148 64 L143 71 L136 61 L129 70 L120 59 L111 70 L104 61 L97 71 L92 64Z" fill="' + h.c + '"/>';
    var shine = '<path d="M96 42 Q120 30 144 42" stroke="' + li + '" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85"/>' +
      '<path d="M106 50 Q108 60 104 68 M134 50 Q132 60 136 68" stroke="' + sh + '" stroke-width="1.2" fill="none" opacity=".35"/>';
    if (style === 'hime') {
      bangs = '<path d="M88 72 Q84 26 120 24 Q156 26 152 72 L152 62 Q120 66 88 62Z" fill="' + h.c + '"/>';
      locks = '<path d="M88 58 L85 118 L93 118 L93 64Z M152 58 L155 118 L147 118 L147 64Z" fill="' + c + '"/>';
    }
    var ties = '';
    if (style === 'drill') ties = bow(CX - 36, 42, 8, 'url(#' + id + 'rb)') + bow(CX + 36, 42, 8, 'url(#' + id + 'rb)');
    if (style === 'twin') ties = bow(CX - 36, 44, 7, '#ff5c9a') + bow(CX + 36, 44, 7, '#ff5c9a');
    if (style === 'side') ties = bow(CX + 36, 44, 8, '#ff5c9a');
    return locks + bangs + shine + ties;
  }

  // ---------- 臉（2026-11-26 第四版：大姊姊臉——瓜子臉、杏仁眼、上眼皮蓋住一點瞳孔）----------
  // 眼睛用「外眼角在右邊」的座標畫，左眼用 scale(-1,1) 翻過來
  var EYE_WHITE = 'M-8.5 2 Q-6.5 -6.8 1 -7.4 Q8 -7 10 -1.5 Q7.5 6.6 0.5 7.2 Q-6 6.8 -8.5 2Z';

  function eye(cx, cy, flip, h, id, k, boy) {
    var clip = id + 'eye' + k;
    return '<g transform="translate(' + cx + ' ' + cy + ') scale(' + (flip ? -1.15 : 1.15) + ' 1.15)">' +
      '<clipPath id="' + clip + '"><path d="' + EYE_WHITE + '"/></clipPath>' +
      '<path d="' + EYE_WHITE + '" fill="#fff"/>' +
      '<g clip-path="url(#' + clip + ')">' +
        '<ellipse cx="0.6" cy="0.6" rx="6.2" ry="7.6" fill="url(#' + id + 'iris)"/>' +
        '<ellipse cx="0.6" cy="4.2" rx="4.2" ry="2.6" fill="' + h.eye[1] + '" opacity=".8"/>' +
        '<ellipse cx="0.6" cy="0.8" rx="2.6" ry="3.8" fill="#1e0d24" opacity=".75"/>' +
        '<path d="M-8.5 -7 Q1 -4 10 -7 L10 -3 Q1 -2 -8.5 -3Z" fill="#00000014"/>' +   // 上眼皮的陰影
      '</g>' +
      '<circle cx="-1.8" cy="-2.6" r="1.9" fill="#fff"/><circle cx="3" cy="3.6" r="1" fill="#fff"/>' +
      sparkle(2.8, -3, 1.6, '#fff') +
      // 上睫毛：女生外眼角粗、往上翹；男生（王子）細一點、不翹
      (boy ? '<path d="M-8.8 0.6 Q-7 -8 1 -8.6 Q8.5 -8.8 10.6 -2.4 L9.6 -1.4 Q7.6 -7.2 1 -7.4 Q-6 -7.2 -8 0.8Z" fill="' + LINE + '"/>'
        : '<path d="M-8.8 0.4 Q-7 -8.2 1 -8.9 Q9 -9.2 12.6 -4.6 L13.6 -7.4 L10.4 -0.8 Q8 -7.2 1 -7.5 Q-6 -7.2 -8 0.6Z" fill="' + LINE + '"/>' +
          '<path d="M6.5 5.6 Q8.8 4 9.8 1.2" stroke="' + LINE + '" stroke-width=".9" fill="none" stroke-linecap="round"/>') +
      '<path d="M-6 -11.4 Q1 -13.4 8.4 -10.4" stroke="' + LINE + '" stroke-width=".7" fill="none" opacity=".45"/>' +
      '<path d="M-7 -17 Q1 -20 10 -16.4" stroke="' + h.shade + '" stroke-width="1.3" fill="none" stroke-linecap="round"/>' +
      '</g>';
  }

  function face(h, id, boy) {
    return '<defs><linearGradient id="' + id + 'iris" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + h.eye[0] +
      '"/><stop offset=".55" stop-color="' + h.eye[1] + '"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs>' +
      // 瓜子臉、尖下巴
      '<path d="M90 68 Q90 96 105 108 Q113 114.5 120 114.5 Q127 114.5 135 108 Q150 96 150 68 Q150 40 120 40 Q90 40 90 68Z" fill="' + SK +
      '" stroke="' + SK_SH + '" stroke-width="1.1"/>' +
      '<path d="M106 108 Q113 112.5 120 112.5" stroke="' + SK_SH + '" stroke-width="1" fill="none" opacity=".5"/>' +
      eye(106, 83, true, h, id, 'l', boy) + eye(134, 83, false, h, id, 'r', boy) +
      '<ellipse cx="101" cy="95" rx="5" ry="2.2" fill="#ff8fb0" opacity=".32"/><ellipse cx="139" cy="95" rx="5" ry="2.2" fill="#ff8fb0" opacity=".32"/>' +
      '<path d="M121.2 91.5 L119.6 96 L121.4 96.4" stroke="' + SK_SH + '" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M115.5 102.4 Q120 107.6 124.5 102.4 Q120 103.6 115.5 102.4Z" fill="#d9536f" stroke="#b83a5e" stroke-width=".6"/>' +
      '<path d="M117.5 105 Q120 106.4 122.5 105" stroke="#ff9db5" stroke-width="1.2" fill="none"/>';
  }

  // ---------- 衣服 ----------
  function pattern(L, kind, pts) {
    return pts.map(function (p, k) {
      if (kind === 'star') return star(p[0], p[1], 4, L.bow);
      if (kind === 'heart') return heart(p[0], p[1], 3.2, '#fff', ' opacity=".9"');
      if (kind === 'sakura') return sakura(p[0], p[1], 5, k % 2 ? '#fff' : '#ff8fb8');
      if (kind === 'moon') return k % 3 ? star(p[0], p[1], 3, L.bow) : sparkle(p[0], p[1], 4.5, '#fff');
      if (kind === 'gem') return '<path d="M' + p[0] + ' ' + p[1] + ' l4 -5 l4 5 l-4 6Z" fill="' + (k % 2 ? '#ff6b9a' : '#86bdff') + '" stroke="#fff"/>';
      return '';
    }).join('');
  }
  var SKIRT_PTS = [[100, 204], [124, 210], [110, 222], [144, 220], [88, 224], [120, 194], [152, 206], [136, 196]];

  // 透明的三角格紋外裙（偶像舞台裝的感覺）
  function lattice(id) {
    var out = layer(178, 106, 134, CX - 62, CX + 62, 248, 8, 10, '#ffffff', null).replace('fill="#ffffff"', 'fill="#ffffff" opacity=".28"');
    var hem = [], waist = [];
    for (var i = 0; i <= 8; i++) { hem.push([CX - 62 + i * 15.5, 250]); waist.push([108 + i * 3, 180]); }
    var lines = '';
    for (i = 0; i < 8; i++) {
      lines += 'M' + f(waist[i][0]) + ' 180 L' + f(hem[i + 1][0]) + ' 250 M' + f(waist[i + 1][0]) + ' 180 L' + f(hem[i][0]) + ' 250 ';
    }
    lines += 'M' + (CX - 30) + ' 206 L' + (CX + 30) + ' 206 M' + (CX - 46) + ' 228 L' + (CX + 46) + ' 228';
    return out + '<path d="' + lines + '" stroke="#ffffff" stroke-width="1.3" fill="none" opacity=".95" filter="url(#' + id + 'glow)"/>';
  }

  function skirt(L, id) {
    var out = '';
    if (L.kind === 'tutu' || L.kind === 'kimono') {
      var cols = L.kind === 'kimono' ? ['#ffffff', L.c, L.shade] : (L.layers || [L.shade, L.c, L.light]);
      var n = cols.length;
      cols.forEach(function (c, k) {
        var spread = 56 - k * (26 / n), y = 238 - k * (26 / n);
        out += layer(178, 108, 132, CX - spread, CX + spread, f(y), 9 - k, 7, c, '#00000014');
      });
      out += lace(CX - 56, CX + 56, 244, 14, L.kind === 'kimono' ? L.light : '#ffffff');
      if (L.lattice) out += lattice(id);
      if (L.pattern === 'lace') out += lace(CX - 42, CX + 42, 226, 10, '#ffffff', 2.2) + lace(CX - 30, CX + 30, 210, 7, L.light, 2);
      else if (L.pattern) out += pattern(L, L.pattern, SKIRT_PTS);
      return out;
    }
    if (L.kind === 'gown') {
      out += '<defs><linearGradient id="' + id + 'gown" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + L.c +
        '"/><stop offset="1" stop-color="' + L.shade + '"/></linearGradient></defs>' +
        '<path d="M108 178 L132 178 Q158 260 180 372 Q120 386 60 372 Q82 260 108 178Z" fill="url(#' + id + 'gown)" stroke="#00000022"/>' +
        '<path d="M120 186 Q116 280 120 380 M110 190 Q96 280 80 376 M130 190 Q144 280 160 376" stroke="' + L.light + '" stroke-width="1.6" fill="none" opacity=".5"/>' +
        '<path d="M146 200 Q172 280 190 368 L180 372 Q160 280 136 196Z" fill="' + L.light + '" opacity=".45"/>';
      return out + pattern(L, 'moon', [[96, 250], [132, 240], [110, 280], [150, 290], [84, 320], [122, 330], [158, 340], [100, 214], [138, 210], [92, 360], [146, 364]]);
    }
    // ball：及膝大蓬裙
    out += '<defs><linearGradient id="' + id + 'ball" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + L.light +
      '"/><stop offset=".5" stop-color="' + L.c + '"/><stop offset="1" stop-color="' + L.shade + '"/></linearGradient></defs>' +
      '<path d="M106 176 L134 176 Q190 216 188 262 Q120 280 52 262 Q50 216 106 176Z" fill="url(#' + id + 'ball)" stroke="#00000022"/>' +
      layer(258, 54, 186, 54, 186, 270, 12, 7, L.light, '#00000018') +
      '<path d="M90 196 Q78 230 80 264 M150 196 Q162 230 160 264 M120 186 L120 272" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/>' +
      bow(78, 236, 6, L.bow) + bow(162, 236, 6, L.bow);
    return out + pattern(L, 'gem', [[98, 196], [138, 196], [86, 220], [150, 220], [116, 226], [102, 244], [134, 244]]);
  }

  function bodice(L, id) {
    var out = '<path d="M102 134 Q120 128 138 134 L132 180 L108 180Z" fill="' + L.c + '" stroke="#00000022" stroke-width="1"/>';
    if (L.kind === 'kimono') {
      return out + '<path d="M110 132 L120 156 L130 132" stroke="#fff" stroke-width="4.5" fill="none"/>' +
        '<path d="M112 132 L120 151 L128 132" stroke="' + L.bow + '" stroke-width="1.8" fill="none"/>' +
        '<rect x="106" y="164" width="28" height="15" rx="2" fill="' + L.obi + '"/>' +
        '<path d="M106 171 L134 171" stroke="' + L.bow + '" stroke-width="2"/>' + bow(140, 170, 9, L.bow, true);
    }
    out += '<path d="M104 132 Q112 140 120 136 Q128 140 136 132" stroke="#fff" stroke-width="3" fill="none"/>' +
      '<path d="M107 174 L133 174 L132 181 L108 181Z" fill="' + L.light + '"/>' + bow(120, 144, 8.5, col(L.bow, id), true) +
      bow(120, 178, 7, col(L.bow, id));
    if (L.layers) out += '<path d="M108 160 L132 160" stroke="' + L.layers[1] + '" stroke-width="3"/>';
    return out;
  }

  function sleeves(L) {
    if (L.kind === 'kimono') {
      return '<path d="M100 134 L88 140 L76 198 Q90 206 100 194 L106 150Z" fill="' + L.c + '" stroke="#00000022"/>' +
        '<path d="M140 134 L154 142 L174 172 Q168 184 158 176 L136 150Z" fill="' + L.c + '" stroke="#00000022"/>' +
        sakura(86, 180, 5, '#fff') + sakura(162, 168, 4, '#fff') + '<path d="M78 194 Q90 202 99 194" stroke="' + L.bow + '" stroke-width="2.5" fill="none"/>';
    }
    var puff = L.kind === 'gown' ? L.c : '#ffffff', edge = L.kind === 'gown' ? L.light : L.c;
    return '<ellipse cx="99" cy="138" rx="10" ry="8" fill="' + puff + '" stroke="' + edge + '" stroke-width="1.6"/>' +
      '<ellipse cx="141" cy="138" rx="10" ry="8" fill="' + puff + '" stroke="' + edge + '" stroke-width="1.6"/>' +
      '<path d="M92 141 Q99 146 106 141 M134 141 Q141 146 148 141" stroke="' + edge + '" stroke-width="1.4" fill="none"/>';
  }

  // ---------- 配件 ----------
  function headItem(it, id) {
    var L = it.look;
    if (L.kind === 'neon') {
      return neon('tri', 120, 14, 16, L.c, id) + neon('heart', 120, 18, 6, '#ff8fd0', id) + neon('star', 98, 24, 6, '#fff27a', id) +
        neon('star', 142, 24, 6, '#7fe3ff', id) + bow(120, 32, 7, 'url(#' + id + 'rb)');
    }
    if (L.kind === 'tiara') {
      return '<path d="M100 36 L103 20 L111 30 L120 14 L129 30 L137 20 L140 36 Q120 30 100 36Z" fill="' + L.c + '" stroke="#00000033"/>' +
        '<circle cx="120" cy="26" r="3.8" fill="' + L.gem + '"/><circle cx="103" cy="20" r="2.2" fill="' + L.gem + '"/><circle cx="137" cy="20" r="2.2" fill="' + L.gem + '"/>' +
        sparkle(126, 16, 3.5, '#fff');
    }
    if (L.kind === 'ribbon') return bow(146, 34, 13, L.c, true);
    if (L.kind === 'cat') {
      return '<path d="M90 46 Q93 36 96 14 L114 34Z M150 46 Q147 36 144 14 L126 34Z" fill="' + L.c + '" stroke="#00000022"/>' +
        '<path d="M96 36 L98 22 L108 33Z M144 36 L142 22 L132 33Z" fill="' + L.inner + '"/>' +
        '<path d="M88 52 Q120 22 152 52" stroke="' + L.inner + '" stroke-width="3.5" fill="none"/>';
    }
    return sakura(146, 40, 9, L.c) + sakura(156, 52, 6.5, '#ffffff') + sakura(138, 30, 5.5, '#ff8fb8') +
      '<path d="M154 58 L156 80 M159 58 L163 76" stroke="' + L.gem + '" stroke-width="1.3"/><circle cx="156" cy="82" r="2.2" fill="' + L.gem + '"/><circle cx="163" cy="78" r="2.2" fill="' + L.gem + '"/>';
  }

  function handItem(it) {
    var L = it.look, x = HAND[0], y = HAND[1];
    if (L.kind === 'mic') {
      return '<path d="M' + x + ' ' + y + ' L' + (x + 6) + ' ' + (y - 24) + '" stroke="#5b4a66" stroke-width="6" stroke-linecap="round"/>' +
        '<path d="M' + x + ' ' + y + ' L' + (x + 6) + ' ' + (y - 24) + '" stroke="' + L.c + '" stroke-width="3.4" stroke-linecap="round"/>' +
        '<circle cx="' + (x + 8) + '" cy="' + (y - 31) + '" r="8.5" fill="' + L.c + '" stroke="#00000033"/>' +
        '<path d="M' + (x + 1) + ' ' + (y - 32) + ' L' + (x + 15) + ' ' + (y - 32) + ' M' + (x + 2) + ' ' + (y - 27) + ' L' + (x + 14) + ' ' + (y - 27) +
        ' M' + (x + 8) + ' ' + (y - 39) + ' L' + (x + 8) + ' ' + (y - 23) + '" stroke="#fff" stroke-width="1" opacity=".8"/>' +
        bow(x + 3, y - 12, 5, '#ff5c9a') + sparkle(x + 22, y - 42, 5, '#fff', 'tw', 0.3);
    }
    var tip = [x + 15, y - 38];
    var stick = '<path d="M' + x + ' ' + y + ' L' + tip[0] + ' ' + (tip[1] + 6) + '" stroke="#d7b6ff" stroke-width="3.5" stroke-linecap="round"/>';
    if (L.kind === 'heart') return stick + heart(tip[0], tip[1], 9, L.c, ' stroke="#fff" stroke-width="1.4"') + sparkle(tip[0] + 13, tip[1] - 12, 5, '#fff', 'tw', 0.6);
    return stick + star(tip[0], tip[1], 12, L.c, ' stroke="#e0a800" stroke-width="1.1"') + sparkle(tip[0] + 14, tip[1] - 12, 5, '#fff', 'tw', 0.9);
  }

  function jewel(it) {
    var L = it.look;
    if (L.kind === 'earring') return star(91, 102, 4, L.c) + star(149, 102, 4, L.c);
    if (L.kind === 'necklace') return '<path d="M112 126 Q120 136 128 126" stroke="#f2c14e" stroke-width="1.4" fill="none"/>' + heart(120, 136, 4, L.c);
    var out = '';
    for (var i = 0; i < 7; i++) {
      var a = Math.PI * (0.15 + i * 0.7 / 6);
      out += '<circle cx="' + f(120 - Math.cos(a) * 11) + '" cy="' + f(126 + Math.sin(a) * 7) + '" r="2.1" fill="' + L.c + '" stroke="#d9cfe0"/>';
    }
    return out;
  }

  function shoes(it) {
    var L = it.look, out = '';
    [114, 126].forEach(function (x, k) {
      var toe = k ? 1 : -1;
      if (L.kind === 'boots') {
        out += '<path d="M' + (x - 5) + ' 300 L' + (x + 5) + ' 300 L' + (x + 5) + ' 356 Q' + (x + toe * 10) + ' 360 ' + (x + toe * 9) + ' 368 L' + (x - toe * 5) + ' 368 L' + (x - 5) + ' 356Z" fill="' + L.c + '" stroke="#00000030"/>' +
          '<rect x="' + (x - 6.5) + '" y="297" width="13" height="6" rx="2.5" fill="' + L.trim + '"/>' + bow(x, 300, 3, L.trim);
      } else if (L.kind === 'heels') {
        out += '<path d="M' + (x - 5) + ' 358 Q' + (x + toe * 8) + ' 358 ' + (x + toe * 11) + ' 366 L' + (x - toe * 5) + ' 368Z" fill="' + L.c + '" stroke="#7fb6d9"/>' + sparkle(x + toe * 3, 360, 3, '#fff');
      } else {
        out += '<ellipse cx="' + (x + toe * 3) + '" cy="' + 364 + '" rx="8" ry="4.5" fill="' + L.c + '" stroke="#00000030"/>' + bow(x + toe * 3, 360, 2.6, '#ffffff');
      }
    });
    return out;
  }

  // wear：{stage, style, hair, dress, head, hand, shoes, jewel}
  function svg(wear, id, crop) {
    id = String(id || 'p').replace(/[^\w-]/g, '');
    var get = function (slot) { return wear && wear[slot] ? ST.item(wear[slot]) : null; };
    var def = ST.defaultWear('princess');
    var orDef = function (slot) { return get(slot) || ST.item(def[slot]); };
    var st = orDef('stage'), style = orDef('style').look.kind, h = orDef('hair').look, dress = orDef('dress').look;
    var head = get('head'), hand = get('hand'), sh = orDef('shoes'), jw = get('jewel');
    var gown = dress.kind === 'gown';
    var p = [];
    p.push(commonDefs(id));
    p.push(stage(st, id));
    p.push(hairDefs(h, id));
    var HEAD = '<g transform="translate(0 7)">';   // 2026-11-26 使用者：脖子太長 → 頭往下移
    p.push(HEAD + hairBack(style, h, id) + '</g>');
    if (!gown) {   // 長腿＋鞋子
      p.push('<path d="M107 216 L120 216 L118.5 292 L117.5 360 L111 360 L109.5 292Z M120 216 L133 216 L130.5 292 L129 360 L122.5 360 L121.5 292Z" fill="' + SK + '" stroke="' + SK_SH + '" stroke-width=".8"/>' +
        '<path d="M110.5 292 Q114 295 118 292 M122 292 Q126 295 130 292" stroke="' + SK_SH + '" stroke-width="1" fill="none"/>');
      p.push(shoes(sh));
    }
    p.push(skirt(dress, id));
    // 左手叉腰、右手舉起來
    p.push('<path d="M100 140 Q80 166 106 182" stroke="' + SK + '" stroke-width="7.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>');
    p.push('<path d="M140 140 Q166 164 ' + HAND[0] + ' ' + HAND[1] + '" stroke="' + SK + '" stroke-width="7.5" fill="none" stroke-linecap="round"/>');
    p.push('<rect x="116" y="104" width="8" height="30" rx="3.5" fill="' + SK + '"/><path d="M116 112 Q120 116 124 112" stroke="' + SK_SH + '" stroke-width="1" fill="none"/>');
    p.push(bodice(dress, id));
    p.push(sleeves(dress));
    if (jw && jw.look.kind !== 'earring') p.push(jewel(jw));
    p.push(HEAD + face(h, id) + hairFront(style, h, id) + (head ? headItem(head, id) : '') +
      (jw && jw.look.kind === 'earring' ? jewel(jw) : '') + '</g>');
    if (hand) p.push(handItem(hand));
    // 白手套
    p.push('<circle cx="106" cy="182" r="4.6" fill="#fff" stroke="#e7d3dd"/><circle cx="' + HAND[0] + '" cy="' + HAND[1] + '" r="4.6" fill="#fff" stroke="#e7d3dd"/>');
    [[22, 40, 0], [214, 70, 0.7], [30, 190, 1.4], [212, 220, 0.4], [40, 340, 1.1], [200, 340, 1.8]].forEach(function (s) {
      p.push(sparkle(s[0], s[1], 7, '#ffffff', 'tw', s[2]));
    });
    var box = CROPS[crop] || CROPS.full;
    return '<svg viewBox="' + box.join(' ') + '"' + (crop && crop !== 'full' ? ' preserveAspectRatio="xMidYMin slice"' : '') +
      ' class="princess" role="img" aria-label="偶像公主">' + p.join('') + '</svg>';
  }

  function cropFor(slot) {
    return { head: 'head', style: 'upper', hair: 'face', hand: 'hand', shoes: 'shoes', jewel: 'jewel' }[slot] || 'full';
  }

  // 給王子等其他角色共用的零件（臉、舞台、閃光…）
  var parts = { f: f, star: star, sparkle: sparkle, heart: heart, sakura: sakura, bow: bow, layer: layer, lace: lace,
                commonDefs: commonDefs, stage: stage, hairDefs: hairDefs, face: face, neon: neon,
                SK: SK, SK_SH: SK_SH, LINE: LINE, W: W, H: H, CROPS: CROPS };

  return { svg: svg, cropFor: cropFor, parts: parts };
})();
if (typeof module !== 'undefined') module.exports = Princess;
