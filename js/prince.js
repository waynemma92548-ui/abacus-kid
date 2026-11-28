/* 王子（原創、純 SVG，2026-11-27）：和公主同一套臉、姿勢、舞台（Princess.parts），衣服換成王子服、披風、寶劍。 */
var Prince = (function () {
  var node = typeof module !== 'undefined' && typeof require === 'function';
  var ST = node ? require('./store.js') : Store;
  var P = (node ? require('./princess.js') : Princess).parts;
  var SK = P.SK, SK_SH = P.SK_SH, CX = 120, HAND = [170, 132];

  function hairBack(style, h, id) {
    if (style !== 'tail') return '';
    var c = 'url(#' + id + 'hair)';
    return '<path d="M108 104 Q100 150 112 176 Q120 168 128 176 Q140 150 132 104Z" fill="' + c + '"/>' +
      P.bow(120, 112, 6, '#2f5bb8');
  }

  function hairFront(style, h, id) {
    var c = h.c, sh = h.shade, li = h.light;
    var top = '<path d="M86 76 Q82 26 120 24 Q158 26 154 76 L150 62 L144 72 L137 56 L130 68 L122 52 L113 68 L105 56 L97 70 L91 62Z" fill="' + c + '"/>' +
      '<path d="M86 60 L85 92 L92 88Z M154 60 L155 92 L148 88Z" fill="' + c + '"/>';
    if (style === 'spiky') {
      top = '<path d="M84 78 L80 46 L92 50 L90 26 L104 38 L110 16 L122 34 L132 14 L136 36 L150 26 L148 50 L160 46 L156 78 L150 62 L143 72 L136 56 L128 70 L120 52 L112 70 L104 56 L97 72 L90 62Z" fill="' + c + '"/>';
    } else if (style === 'curly') {
      top = '<path d="M84 80 Q76 64 86 52 Q80 36 96 32 Q100 18 116 22 Q128 12 140 24 Q156 26 154 42 Q166 54 156 70 L156 80 Q150 64 140 66 Q132 56 120 62 Q108 54 100 66 Q90 64 84 80Z" fill="' + c + '"/>' +
        '<path d="M94 44 q6 -6 12 0 M116 34 q6 -6 12 0 M136 44 q6 -6 12 0" stroke="' + sh + '" stroke-width="1.6" fill="none" opacity=".6"/>';
    }
    return top + '<path d="M98 40 Q120 30 142 40" stroke="' + li + '" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".85"/>';
  }

  function cape(it) {
    if (!it) return '';
    var L = it.look, out = '<path d="M98 132 L142 132 L178 352 Q120 366 62 352Z" fill="' + L.c + '" stroke="#00000026"/>' +
      '<path d="M142 132 L178 352 L168 354 L136 140Z" fill="' + L.lining + '" opacity=".9"/>';
    if (L.stars) [[86, 250], [110, 300], [150, 280], [96, 330], [140, 330], [120, 220]].forEach(function (s) { out += P.star(s[0], s[1], 5, L.lining); });
    return out;
  }

  // 長褲＋靴子
  function legs(outfit, shoes) {
    var L = outfit.look, S = shoes.look;
    return '<path d="M106 178 L134 178 L132 352 L122.5 352 L120.5 236 L118 352 L108.5 352Z" fill="' + L.pants + '" stroke="#00000022"/>' +
      [113, 127].map(function (x) {
        return '<path d="M' + (x - 6) + ' 320 L' + (x + 6) + ' 320 L' + (x + 6) + ' 358 Q' + (x + 13) + ' 360 ' + (x + 12) + ' 368 L' + (x - 6) + ' 368Z" fill="' + S.c + '" stroke="#00000030"/>' +
          '<rect x="' + (x - 7) + '" y="317" width="14" height="6" rx="2" fill="' + S.trim + '"/>';
      }).join('');
  }

  function jacket(outfit) {
    var L = outfit.look, c = L.c, t = L.trim, out = '';
    // 衣服下襬（禮服是燕尾、騎士是短袍）
    if (L.kind === 'knight') out += '<path d="M100 170 L140 170 L148 236 L92 236Z" fill="' + c + '" stroke="#00000022"/>' +
      '<path d="M120 172 L120 236" stroke="' + t + '" stroke-width="10"/>' + P.star(120, 150, 9, t);
    else out += '<path d="M101 176 L139 176 L146 214 L132 206 L120 214 L108 206 L94 214Z" fill="' + c + '" stroke="#00000022"/>';
    out += '<path d="M100 132 Q120 126 140 132 L138 182 L102 182Z" fill="' + c + '" stroke="#00000022" stroke-width="1.2"/>';
    if (L.kind === 'sailor') {
      out += '<path d="M104 130 L120 150 L136 130 L142 144 L120 162 L98 144Z" fill="' + t + '"/>' + P.bow(120, 156, 6, '#d6334b');
    } else if (L.kind === 'knight') {
      out += '<path d="M104 132 L120 146 L136 132" stroke="' + t + '" stroke-width="3" fill="none"/>';
    } else {
      out += '<path d="M112 130 L120 142 L128 130Z" fill="#ffffff"/>' + P.bow(120, 136, 4, '#d6334b') +
        [150, 160, 170].map(function (y) { return '<circle cx="120" cy="' + y + '" r="2.2" fill="' + t + '"/>'; }).join('') +
        '<path d="M102 132 L102 182 M138 132 L138 182" stroke="' + t + '" stroke-width="2.4"/>';
      if (L.kind === 'royal') out += '<path d="M104 134 L136 176" stroke="' + t + '" stroke-width="6" opacity=".9"/>';
      if (L.kind === 'idol') [[108, 150], [132, 164], [112, 172]].forEach(function (s) { out += P.star(s[0], s[1], 4, t); });
    }
    out += '<rect x="102" y="176" width="36" height="6" rx="2" fill="' + (L.kind === 'knight' ? '#6b4a2e' : t) + '"/>';
    return out;
  }

  function sleeves(outfit) {
    var L = outfit.look;
    return '<path d="M100 140 Q80 166 106 182" stroke="' + L.c + '" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M140 140 Q166 164 ' + HAND[0] + ' ' + HAND[1] + '" stroke="' + L.c + '" stroke-width="9" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="99" cy="136" rx="10" ry="6" fill="' + L.trim + '"/><ellipse cx="141" cy="136" rx="10" ry="6" fill="' + L.trim + '"/>';
  }

  function headItem(it) {
    var L = it.look;
    if (L.kind === 'hat') {
      return '<path d="M84 46 Q120 8 156 46 Q120 36 84 46Z" fill="' + L.c + '"/><ellipse cx="120" cy="46" rx="40" ry="6" fill="' + L.c + '"/>' +
        '<path d="M140 30 Q170 4 172 30 Q160 22 146 36Z" fill="' + L.feather + '" stroke="#00000022"/>';
    }
    return '<path d="M102 38 L104 22 L112 31 L120 18 L128 31 L136 22 L138 38Z" fill="' + L.c + '" stroke="#00000033"/>' +
      '<circle cx="120" cy="30" r="3.2" fill="' + L.gem + '"/>';
  }

  function handItem(it) {
    var L = it.look, x = HAND[0], y = HAND[1];
    if (L.kind === 'sword') {
      return '<path d="M' + (x + 2) + ' ' + (y - 4) + ' L' + (x + 20) + ' ' + (y - 70) + ' L' + (x + 24) + ' ' + (y - 66) + ' L' + (x + 7) + ' ' + y + 'Z" fill="' + L.c + '" stroke="#8a94a6"/>' +
        '<path d="M' + (x - 6) + ' ' + (y - 2) + ' L' + (x + 14) + ' ' + (y + 4) + '" stroke="#f6cd62" stroke-width="4" stroke-linecap="round"/>' +
        P.sparkle(x + 26, y - 74, 5, '#fff', 'tw', 0.4);
    }
    if (L.kind === 'flag') {
      return '<path d="M' + x + ' ' + (y + 4) + ' L' + (x + 4) + ' ' + (y - 70) + '" stroke="#8a5a3b" stroke-width="3"/>' +
        '<path d="M' + (x + 4) + ' ' + (y - 70) + ' L' + (x + 40) + ' ' + (y - 60) + ' L' + (x + 4) + ' ' + (y - 48) + 'Z" fill="' + L.c + '"/>' +
        P.star(x + 16, y - 59, 4, '#ffd45c');
    }
    return '<path d="M' + x + ' ' + (y + 6) + ' L' + (x + 10) + ' ' + (y - 50) + '" stroke="' + L.c + '" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="' + (x + 11) + '" cy="' + (y - 56) + '" r="8" fill="#d6334b" stroke="' + L.c + '" stroke-width="3"/>' + P.sparkle(x + 22, y - 66, 4, '#fff', 'tw', 0.8);
  }

  function svg(wear, id, crop) {
    id = String(id || 'pr').replace(/[^\w-]/g, '');
    var def = ST.defaultWear('prince');
    var get = function (slot) { return wear && wear[slot] ? ST.item(wear[slot]) : null; };
    var orDef = function (slot) { return get(slot) || ST.item(def[slot]); };
    var h = orDef('hair').look, style = orDef('style').look.kind, outfit = orDef('outfit');
    var HEAD = '<g transform="translate(0 7)">', p = [];
    p.push(P.commonDefs(id));
    p.push(P.stage(orDef('stage'), id));
    p.push(P.hairDefs(h, id));
    p.push(cape(get('cape')));
    p.push(HEAD + hairBack(style, h, id) + '</g>');
    p.push(legs(outfit, orDef('shoes')));
    p.push('<rect x="116" y="104" width="8" height="30" rx="3.5" fill="' + SK + '"/>');
    p.push(jacket(outfit));
    p.push(sleeves(outfit));
    p.push(HEAD + P.face(h, id, true) + hairFront(style, h, id) + (get('head') ? headItem(get('head')) : '') + '</g>');
    if (get('hand')) p.push(handItem(get('hand')));
    p.push('<circle cx="106" cy="182" r="4.8" fill="#fff" stroke="#e7d3dd"/><circle cx="' + HAND[0] + '" cy="' + HAND[1] + '" r="4.8" fill="#fff" stroke="#e7d3dd"/>');
    [[22, 40, 0], [214, 70, 0.7], [30, 190, 1.4], [212, 220, 0.4]].forEach(function (s) { p.push(P.sparkle(s[0], s[1], 7, '#ffffff', 'tw', s[2])); });
    var box = P.CROPS[crop] || P.CROPS.full;
    return '<svg viewBox="' + box.join(' ') + '"' + (crop && crop !== 'full' ? ' preserveAspectRatio="xMidYMin slice"' : '') +
      ' class="princess" role="img" aria-label="王子">' + p.join('') + '</svg>';
  }

  function cropFor(slot) {
    return { head: 'head', style: 'upper', hair: 'face', hand: 'hand', shoes: 'shoes', cape: 'full' }[slot] || 'full';
  }

  return { svg: svg, cropFor: cropFor };
})();
if (typeof module !== 'undefined') module.exports = Prince;
