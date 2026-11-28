/* 變身戰士的機器人型態（原創帥氣機甲風、純 SVG，2026-11-27）。
 * 身體、頭、腳、兩隻手共用一套（左右對稱）；每種車型只換一隻手的招牌零件：
 *   挖土機 → 挖斗爪、推土機 → 盾牌、吊車 → 長槍（吊臂）、水泥車 → 手臂砲、鑽地車 → 鑽頭
 * look = {paint: {c, shade}, glow, sticker, type, helmet, pack, stage}
 */
var Mecha = (function () {
  var node = typeof module !== 'undefined' && typeof require === 'function';
  var P = (node ? require('./princess.js') : Princess).parts;
  var DARK = '#2b2f3d', STEEL = '#8d96a8', STEEL2 = '#c3cad6', GOLD = '#f2c14e';
  var ID = '', GLOW = '';   // 目前這張圖的 id 前綴、燈光顏色

  function M() { return 'url(#' + ID + 'mp)'; }
  function S() { return 'url(#' + ID + 'ms)'; }
  function G() { return ' filter="url(#' + ID + 'glow)"'; }
  function defs(c) {
    return '<defs><linearGradient id="' + ID + 'mp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/>' +
      '<stop offset=".25" stop-color="' + c.c + '"/><stop offset="1" stop-color="' + c.shade + '"/></linearGradient>' +
      '<linearGradient id="' + ID + 'ms" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + STEEL2 + '"/><stop offset="1" stop-color="' + STEEL + '"/></linearGradient>' +
      '<pattern id="' + ID + 'hz" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
      '<rect width="10" height="10" fill="#f6c33b"/><rect width="5" height="10" fill="' + DARK + '"/></pattern></defs>';
  }
  function poly(pts, fill, extra) { return '<polygon points="' + pts + '" fill="' + fill + '" stroke="' + DARK + '" stroke-width="2" stroke-linejoin="round"' + (extra || '') + '/>'; }
  function hazard(x, y, w, h) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="url(#' + ID + 'hz)" stroke="' + DARK + '" stroke-width="1.5"/>'; }
  // 左邊的座標鏡射到右邊（x → 240 − x）
  function mir(pts) { return pts.split(' ').map(function (q) { var a = q.split(','); return (240 - a[0]) + ',' + a[1]; }).join(' '); }

  function legs() {
    var out = '';
    [98, 142].forEach(function (x) {
      out += poly((x - 14) + ',250 ' + (x + 14) + ',250 ' + (x + 12) + ',296 ' + (x - 12) + ',296', S()) +
        poly((x - 16) + ',292 ' + (x + 16) + ',292 ' + (x + 12) + ',306 ' + (x - 12) + ',306', M()) +
        poly((x - 15) + ',304 ' + (x + 15) + ',304 ' + (x + 17) + ',342 ' + (x - 17) + ',342', M()) +
        '<path d="M' + (x - 8) + ' 314 L' + (x + 8) + ' 314" stroke="' + GLOW + '" stroke-width="3" stroke-linecap="round"' + G() + '/>' +
        '<rect x="' + (x - 24) + '" y="340" width="48" height="26" rx="12" fill="' + DARK + '"/>' +
        [-12, 0, 12].map(function (d) { return '<circle cx="' + (x + d) + '" cy="353" r="6" fill="' + STEEL2 + '"/>'; }).join('');
    });
    return out;
  }

  function torso() {
    return poly('104,232 136,232 140,256 100,256', DARK) + hazard(100, 240, 40, 8) +
      poly('86,150 154,150 162,190 148,236 92,236 78,190', M()) +
      poly('104,148 136,148 130,158 110,158', S()) +
      poly('100,160 140,160 136,192 104,192', '#9fd8ff', ' opacity=".9"') +
      '<path d="M106 166 L118 166" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="120" cy="214" r="10" fill="' + GLOW + '"' + G() + '/><circle cx="120" cy="214" r="5" fill="#ffffff"/>' +
      '<path d="M92 200 L108 214 M148 200 L132 214" stroke="' + GLOW + '" stroke-width="2.5"' + G() + '/>';
  }

  function shoulders() {
    var L = '56,146 92,138 98,170 62,178';
    return poly(L, M()) + hazard(62, 166, 30, 7) + poly(mir(L), M()) + hazard(148, 166, 30, 7);
  }

  // 兩隻手左右對稱；right=false 畫左手。noFist：這隻手換成招牌零件，不畫拳頭
  function arm(right, noFist) {
    var up = '62,176 82,176 80,214 64,214', fore = '58,210 84,210 82,246 60,246';
    if (right) { up = mir(up); fore = mir(fore); }
    var x = right ? 156 : 58;
    return poly(up, S()) + poly(fore, M()) +
      (noFist ? '' : '<rect x="' + x + '" y="244" width="26" height="20" rx="6" fill="' + DARK + '"/><path d="M' + (x + 4) + ' 252 L' + (x + 22) + ' 252" stroke="' + STEEL + '" stroke-width="2"/>');
  }

  // 招牌零件：只換一隻手，比例維持人形
  var SIGNATURE = {
    excavator: { noFist: true, draw: function () {    // 右手 → 挖斗爪
      return poly('154,244 184,240 192,270 176,286 158,280', '#7a808f') +
        [160, 169, 178].map(function (x) { return poly(x + ',280 ' + (x + 7) + ',282 ' + (x + 2) + ',294', STEEL2); }).join('') +
        '<path d="M160 252 L184 248" stroke="' + DARK + '" stroke-width="2"/>';
    } },
    bulldozer: { draw: function () {                   // 左手前臂 → 盾牌（推土鏟）
      return poly('30,192 76,198 78,282 32,288 22,240', S()) +
        '<path d="M34 200 Q24 240 34 282" stroke="' + STEEL + '" stroke-width="3" fill="none"/>' + hazard(32, 192, 44, 8) +
        '<circle cx="52" cy="240" r="7" fill="' + GLOW + '"' + G() + '/>';
    } },
    crane: { draw: function () {                       // 吊臂 → 右手拿的長槍
      var out = '<path d="M196 330 L214 76" stroke="' + DARK + '" stroke-width="12" stroke-linecap="round"/>' +
        '<path d="M196 330 L214 76" stroke="url(#' + ID + 'mp)" stroke-width="8" stroke-linecap="round"/>';
      for (var i = 0; i < 9; i++) { var y = 316 - i * 28; out += '<path d="M' + (197 + i * 2) + ' ' + y + ' L' + (201 + i * 2) + ' ' + (y - 14) + '" stroke="' + DARK + '" stroke-width="1.5"/>'; }
      return out + poly('215,40 230,66 215,92 200,66', STEEL2) + poly('215,48 224,66 215,84 206,66', '#eef2f7') +      // 菱形刀片
        '<path d="M215 92 L215 100 Q230 106 226 122 Q220 132 210 126 L216 122 Q222 118 218 110 Q212 106 210 104" fill="' + STEEL2 + '" stroke="' + DARK + '" stroke-width="2" stroke-linejoin="round"/>' +
        P.sparkle(215, 40, 6, GLOW, 'tw', 0.3);
    } },
    mixer: { noFist: true, draw: function () {        // 滾筒 → 右手臂砲
      return poly('150,206 188,202 194,268 156,272', M()) +
        [222, 236, 250].map(function (y) { return '<path d="M154 ' + (y + 4) + ' L190 ' + y + '" stroke="' + DARK + '" stroke-width="2" opacity=".5"/>'; }).join('') +
        '<ellipse cx="175" cy="274" rx="20" ry="9" fill="' + DARK + '"/>' +
        '<ellipse cx="175" cy="274" rx="12" ry="5" fill="' + GLOW + '"' + G() + '/>' +
        '<ellipse cx="175" cy="274" rx="5" ry="2" fill="#ffffff"/>';
    } },
    driller: { noFist: true, draw: function () {      // 鑽頭 → 右手
      return '<rect x="154" y="242" width="32" height="10" rx="3" fill="' + DARK + '"/>' +
        poly('154,252 186,252 170,306', S()) +
        '<path d="M157 262 L183 258 M160 274 L180 270 M163 286 L177 282 M166 296 L174 294" stroke="' + DARK + '" stroke-width="2"/>' +
        P.sparkle(170, 310, 6, GLOW, 'tw', 0.2);
    } }
  };

  function head(helmet) {
    var out = '<rect x="109" y="128" width="22" height="28" rx="3" fill="' + STEEL + '" stroke="' + DARK + '" stroke-width="2"/>' +
      '<path d="M111 138 L129 138 M111 146 L129 146" stroke="' + DARK + '" stroke-width="1.5" opacity=".6"/>' +
      poly('98,86 142,86 148,112 138,136 102,136 92,112', M()) +
      poly('104,112 136,112 132,132 108,132', '#cfd5df') +
      '<path d="M110 120 L130 120 M112 126 L128 126" stroke="' + STEEL + '" stroke-width="2"/>' +
      poly('100,100 140,100 138,110 102,110', DARK) +
      '<path d="M104 105 L136 105" stroke="' + GLOW + '" stroke-width="5" stroke-linecap="round"' + G() + '/>' +
      poly('92,96 84,88 86,112 92,112', STEEL) + poly('148,96 156,88 154,112 148,112', STEEL);
    var k = helmet || 'v';
    if (k === 'horn') out += poly('114,90 126,90 120,46', GOLD) + poly('116,90 124,90 120,70', '#fff3c2');
    else if (k === 'wing') out += poly('98,92 70,62 76,58 106,84', GOLD) + poly(mir('98,92 70,62 76,58 106,84'), GOLD) +
      poly('100,96 64,80 68,74 104,88', '#ffd76a') + poly(mir('100,96 64,80 68,74 104,88'), '#ffd76a');
    else out += poly('120,92 96,60 104,58 120,80 136,58 144,60', GOLD);
    return out + '<circle cx="120" cy="90" r="4" fill="' + GLOW + '"' + G() + '/>';
  }

  function pack(kind) {   // 背包畫在身體後面
    if (kind === 'thruster') {
      return [84, 156].map(function (x) {
        return '<rect x="' + (x - 10) + '" y="120" width="20" height="56" rx="6" fill="' + S() + '" stroke="' + DARK + '" stroke-width="2"/>' +
          '<path d="M' + (x - 7) + ' 176 Q' + x + ' 214 ' + (x + 7) + ' 176Z" fill="#ff8f3d"/><path d="M' + (x - 4) + ' 176 Q' + x + ' 196 ' + (x + 4) + ' 176Z" fill="#ffe27a"/>';
      }).join('');
    }
    if (kind === 'wing') {
      var L = '92,150 30,100 22,150 56,186 92,180';
      return poly(L, M()) + poly(mir(L), M()) + '<path d="M36 118 L84 160 M30 140 L80 172" stroke="' + DARK + '" stroke-width="2"/>' +
        '<path d="' + 'M204 118 L156 160 M210 140 L160 172' + '" stroke="' + DARK + '" stroke-width="2"/>';
    }
    if (kind === 'light') {
      var W = '96,150 20,84 30,140 14,170 70,196';
      return '<g opacity=".75"' + G() + '>' + poly(W, GLOW, ' stroke="' + GLOW + '"') + poly(mir(W), GLOW, ' stroke="' + GLOW + '"') + '</g>' +
        '<path d="M30 100 L84 158 M24 150 L76 178 M210 100 L156 158 M216 150 L164 178" stroke="#ffffff" stroke-width="2" opacity=".8"/>';
    }
    return '';
  }

  function sticker(st) {
    if (!st) return '';
    var L = st.look;
    if (L.kind === 'heart') return P.heart(140, 178, 6, L.c);
    if (L.kind === 'bolt') return '<path d="M142 168 L134 180 L140 180 L136 190 L146 176 L140 176Z" fill="#ffd45c" stroke="' + L.c + '"/>';
    if (L.kind === 'flame') return '<path d="M134 186 Q132 174 140 168 Q140 176 146 174 Q150 182 144 186Z" fill="' + L.c + '"/>';
    return P.star(140, 178, 7, L.c, ' stroke="#cf9a12"');
  }

  // 只回傳圖案內容（不含 <svg>），給 truck.js 組起來
  function body(look, id) {
    ID = id; GLOW = look.glow || '#5ff2ff';
    var sig = SIGNATURE[look.type] || SIGNATURE.excavator, rightIsSig = look.type !== 'bulldozer', p = [];
    p.push(defs(look.paint));
    p.push('<ellipse cx="120" cy="368" rx="80" ry="8" fill="#00000022"/>');
    p.push(pack(look.pack));
    p.push(legs());
    p.push(arm(false, false));
    p.push(arm(true, rightIsSig && sig.noFist));
    p.push(torso());
    var A = { excavator: [172, 262, 1.35], bulldozer: [50, 240, 1.25], crane: [205, 200, 1.15], mixer: [172, 240, 1.3], driller: [170, 262, 1.4] }[look.type] || [170, 260, 1.3];
    p.push('<g transform="translate(' + A[0] + ' ' + A[1] + ') scale(' + A[2] + ') translate(' + (-A[0]) + ' ' + (-A[1]) + ')">' + sig.draw() + '</g>');   // 招牌武器大一點
    if (look.type === 'crane') p.push(arm(true, false));   // 長槍先畫、拳頭蓋在上面，看起來是握著
    p.push(shoulders());
    p.push(head(look.helmet));
    p.push(sticker(look.sticker));
    return p.join('');
  }

  return { body: body };
})();
if (typeof module !== 'undefined') module.exports = Mecha;
