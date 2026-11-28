/* 日式算盤（上一下四）的核心規則：數字和珠子互換、點珠子、加減的撥珠步驟與方法判斷。
 * 不碰畫面，瀏覽器和 node 測試共用。
 * 一根柱子 = {u: 五珠是否靠樑(0/1), l: 靠樑的一珠顆數(0~4)}；rods[0] 是個位，rods[1] 是十位…
 * 步驟 step = {rod, u: +1/-1（五珠撥下/撥上）, l: +k/-k（一珠撥上/撥下 k 顆）}，一步只動一種珠子。
 */
var Abacus = (function () {
  var ROD_NAMES = ['個位', '十位', '百位', '千位', '萬位'];

  function digitOf(r) { return r.u * 5 + r.l; }

  function valueOf(rods) {
    var v = 0;
    for (var i = rods.length - 1; i >= 0; i--) v = v * 10 + digitOf(rods[i]);
    return v;
  }

  function fromValue(n, count) {
    if (n < 0 || n >= Math.pow(10, count)) throw new Error('算盤放不下 ' + n);
    var rods = [];
    for (var i = 0; i < count; i++) {
      var d = n % 10;
      rods.push({ u: d >= 5 ? 1 : 0, l: d % 5 });
      n = Math.floor(n / 10);
    }
    return rods;
  }

  function clone(rods) { return rods.map(function (r) { return { u: r.u, l: r.l }; }); }

  function same(a, b) {
    return a.length === b.length && a.every(function (r, i) { return r.u === b[i].u && r.l === b[i].l; });
  }

  function applyStep(rods, step) {
    var out = clone(rods), r = out[step.rod];
    if (!r) throw new Error('沒有這根柱子');
    r.u += step.u || 0;
    r.l += step.l || 0;
    if (r.u < 0 || r.u > 1 || r.l < 0 || r.l > 4) throw new Error('撥不到');
    return out;
  }

  // 點五珠：靠樑就撥開，沒靠樑就撥下
  function tapUpper(rods, i) {
    var out = clone(rods);
    out[i].u = 1 - out[i].u;
    return out;
  }

  // 點一珠：k = 0 是最靠近橫樑那顆。點到已靠樑的珠子 → 它和下面的一起撥下；點到沒靠樑的 → 它和上面的一起撥上
  function tapLower(rods, i, k) {
    var out = clone(rods);
    out[i].l = k < out[i].l ? k : k + 1;
    return out;
  }

  // ---- 加減的撥珠步驟 ----
  function move(st, steps, rod, du, dl) {
    var step = { rod: rod, u: du, l: dl };
    var next = applyStep(st.rods, step);
    st.rods = next;
    steps.push(step);
  }

  function addDigit(st, i, d, kinds, steps) {
    if (i >= st.rods.length) throw new Error('超過算盤的位數');
    var r = st.rods[i], x = digitOf(r);
    if (x + d <= 9) {
      if (d < 5) {
        if (r.l + d <= 4) { kinds.direct = true; move(st, steps, i, 0, d); }
        else { kinds.five = true; move(st, steps, i, 1, 0); move(st, steps, i, 0, -(5 - d)); }
      } else {
        kinds.direct = true;
        move(st, steps, i, 1, 0);
        if (d > 5) move(st, steps, i, 0, d - 5);
      }
    } else {
      kinds.ten = true;                     // 十的好朋友：這一位減掉補數，左邊一位加 1
      subDigit(st, i, 10 - d, kinds, steps);
      addDigit(st, i + 1, 1, kinds, steps);
    }
  }

  function subDigit(st, i, d, kinds, steps) {
    var r = st.rods[i], x = digitOf(r);
    if (x >= d) {
      if (d < 5) {
        if (r.l >= d) { kinds.direct = true; move(st, steps, i, 0, -d); }
        else { kinds.five = true; move(st, steps, i, 0, 5 - d); move(st, steps, i, -1, 0); }
      } else {
        kinds.direct = true;
        move(st, steps, i, -1, 0);
        if (d > 5) move(st, steps, i, 0, -(d - 5));
      }
    } else {
      if (i + 1 >= st.rods.length) throw new Error('不夠減');
      kinds.ten = true;                     // 十的好朋友：左邊一位減 1，這一位加上補數
      subDigit(st, i + 1, 1, kinds, steps);
      addDigit(st, i, 10 - d, kinds, steps);
    }
  }

  function mainKind(kinds) { return kinds.ten ? 'ten' : kinds.five ? 'five' : 'direct'; }

  // 撥珠提示的說法看是哪一根柱子（2026-11-27 第三區）：
  //   個位＝小精靈／大精靈、十位＝隊長／大隊長、進位到百位＝國王；千位以上用課本說法（「千位加 1」）
  var CAST = [{ one: '小精靈', five: '大精靈', m: '個' }, { one: '隊長', five: '大隊長', m: '位' }];
  function groupSay(op, d, kind, rod, multi) {
    rod = rod || 0;
    var c = CAST[rod], at = rod || multi ? ROD_NAMES[rod] : '';   // 兩位數的題目，個位也說「個位」
    var up = rod === 0 ? '十位的隊長' : rod === 1 ? '百位的國王' : ROD_NAMES[rod + 1];
    if (!c) {   // 百位以上：課本說法
      if (kind === 'ten') return op === '+' ? at + '加 ' + d + '，放不下：這一位減 ' + (10 - d) + '，' + ROD_NAMES[rod + 1] + '加 1'
        : at + '減 ' + d + '，不夠減：' + ROD_NAMES[rod + 1] + '減 1，這一位加 ' + (10 - d);
      if (kind === 'five') return op === '+' ? at + '加 ' + d + '：五珠撥下、一珠撥掉 ' + (5 - d) + ' 顆' : at + '減 ' + d + '：一珠撥上 ' + (5 - d) + ' 顆、五珠撥上';
      return at + (op === '+' ? '直接加 ' : '直接減 ') + d;
    }
    var many = rod === 0 ? '個精靈' : '位隊長';
    if (op === '+') {
      // 用故事的說法（lessons.js 的小精靈故事）：一珠＝小精靈、五珠＝大精靈
      if (kind === 'five') return at + '加 ' + d + '，' + c.one + '住不下，用五的好朋友：請' + c.five + '下來加 5、再請 ' + (5 - d) + ' ' + c.m + c.one + '回家減 ' + (5 - d);
      if (kind === 'ten') return at + '加 ' + d + '，這一位放不下，用十的好朋友：先請 ' + (10 - d) + ' ' + many + '回家減 ' + (10 - d) + '、再請' + up + '來加 1';
      return at + '直接加 ' + d;
    }
    if (kind === 'five') return at + '減 ' + d + '，' + c.one + '不夠走，用五的好朋友：先請 ' + (5 - d) + ' ' + c.m + c.one + '來接班加 ' + (5 - d) + '、再請' + c.five + '回家減 5';
    if (kind === 'ten') return at + '減 ' + d + '，不夠走，用十的好朋友：請' + up + '回家減 1、再請 ' + (10 - d) + ' ' + many + '回來加 ' + (10 - d);
    return at + '直接減 ' + d;
  }

  // a op b 的完整撥法：groups 依高位到低位，每個 group 是「加／減 b 的一個位數」
  function plan(a, op, b, count) {
    var st = { rods: fromValue(a, count) }, start = clone(st.rods), groups = [], all = {};
    var digits = String(b).split('').map(Number);
    digits.forEach(function (d, idx) {
      if (!d) return;
      var rod = digits.length - 1 - idx, kinds = {}, steps = [];
      (op === '+' ? addDigit : subDigit)(st, rod, d, kinds, steps);
      Object.keys(kinds).forEach(function (k) { all[k] = true; });
      var kind = mainKind(kinds), say = groupSay(op, d, kind, rod, digits.length > 1);
      // 連續進位／退位（例如 65+35：個位進位時十位已經是 9，要再找百位）
      if (steps.some(function (x) { return x.rod > rod + 1; })) {
        say += op === '+' ? '。' + ROD_NAMES[rod + 1] + '也滿了，再請' + (rod === 0 ? '百位的國王' : ROD_NAMES[rod + 2]) + '來加 1'
          : '。' + ROD_NAMES[rod + 1] + '是空的，要先請' + (rod === 0 ? '百位的國王' : ROD_NAMES[rod + 2]) + '回家減 1';
      }
      groups.push({ op: op, d: d, rod: rod, kind: kind, steps: steps, say: say });
    });
    return { start: start, groups: groups, end: st.rods, result: valueOf(st.rods),
             kinds: Object.keys(all).sort(), kind: mainKind(all) };
  }

  // 連加減（2026-11-27 珠心算檢定題型）：terms 例如 [3, 4, -2, 5]，從 0 開始一口一口撥。
  // 回傳和 plan 一樣的形狀（start/groups/end/result/kinds/kind），每個 group 多一個 term（第幾口）
  function planChain(terms, count) {
    var start = fromValue(0, count), groups = [], all = {}, total = 0;
    terms.forEach(function (t, k) {
      var op = t < 0 ? '-' : '+', pk = plan(total, op, Math.abs(t), count);
      pk.groups.forEach(function (g) { g.term = k; groups.push(g); });
      if (k > 0) pk.kinds.forEach(function (x) { all[x] = true; });   // 第一口是從 0 撥上去，不算方法
      total = pk.result;
    });
    var kinds = Object.keys(all).sort();
    return { start: start, groups: groups, end: fromValue(total, count), result: total, kinds: kinds, kind: mainKind(all) };
  }

  // 方法清單，例如 ['direct','five']；算盤放不下或不夠減會丟出錯誤
  function techniques(a, op, b, count) { return plan(a, op, b, count || 3).kinds; }

  function stepSay(step, count) {
    var name = count > 1 ? ROD_NAMES[step.rod] + '：' : '';
    if (step.u > 0) return name + '撥下五珠';
    if (step.u < 0) return name + '撥上五珠';
    if (step.l > 0) return name + '撥上 ' + step.l + ' 顆一珠';
    return name + '撥下 ' + (-step.l) + ' 顆一珠';
  }

  // 從 from 撥到 to 要動的珠子（給發亮提示用）：[{rod, part:'u'} 或 {rod, part:'l', k}]
  function beadsToMove(from, to) {
    var out = [];
    for (var i = from.length - 1; i >= 0; i--) {
      var a = from[i], b = to[i], k;
      if (a.u !== b.u) out.push({ rod: i, part: 'u' });
      if (a.l < b.l) for (k = a.l; k < b.l; k++) out.push({ rod: i, part: 'l', k: k });
      if (a.l > b.l) for (k = b.l; k < a.l; k++) out.push({ rod: i, part: 'l', k: k });
    }
    return out;
  }

  // 只動「下一個要改的柱子」的珠子，讓提示一次只亮一組
  function nextBeads(from, to) {
    var all = beadsToMove(from, to);
    if (!all.length) return all;
    var first = all[0];
    return all.filter(function (b) { return b.rod === first.rod && b.part === first.part; });
  }

  // 走到一半的狀態對照：目前 rods 等於 plan 裡第幾步之後的狀態（-1 = 都不是）
  function progressIn(p, rods) {
    var states = [p.start], st = p.start;
    p.groups.forEach(function (g) { g.steps.forEach(function (s) { st = applyStep(st, s); states.push(st); }); });
    for (var i = states.length - 1; i >= 0; i--) if (same(states[i], rods)) return i;
    return -1;
  }

  // 一步要動好幾顆一珠時，小朋友可能一次只點到其中幾顆：cur 在 from 和 from 撥完 step 之間（同一柱、同方向、還沒到）就算「撥到一半」
  function partialStep(from, step, cur) {
    if (!step.l) return false;
    var to = applyStep(from, step);
    for (var i = 0; i < from.length; i++) {
      if (cur[i].u !== from[i].u) return false;
      if (i !== step.rod && cur[i].l !== from[i].l) return false;
    }
    var a = from[step.rod].l, b = to[step.rod].l, c = cur[step.rod].l;
    return c !== a && c !== b && (c - a) * (b - c) > 0;
  }

  function flatSteps(p) {
    var out = [];
    p.groups.forEach(function (g) { g.steps.forEach(function (s, i) { out.push({ step: s, group: g, first: i === 0 }); }); });
    return out;
  }

  return { ROD_NAMES: ROD_NAMES, digitOf: digitOf, valueOf: valueOf, fromValue: fromValue, clone: clone,
           same: same, applyStep: applyStep, tapUpper: tapUpper, tapLower: tapLower, plan: plan,
           techniques: techniques, planChain: planChain, stepSay: stepSay, beadsToMove: beadsToMove, nextBeads: nextBeads,
           progressIn: progressIn, flatSteps: flatSteps, partialStep: partialStep };
})();
if (typeof module !== 'undefined') module.exports = Abacus;
