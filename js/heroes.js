/* 角色總表（2026-11-27）：公主、王子、變身戰士（工程車＋機器人）。app.js 只透過這裡畫角色。 */
var Heroes = (function () {
  var node = typeof module !== 'undefined' && typeof require === 'function';
  var MOD = node
    ? { princess: require('./princess.js'), prince: require('./prince.js'), truck: require('./truck.js') }
    : { princess: Princess, prince: Prince, truck: Truck };
  // 公主有兩種畫風（2026-11-27）：新畫風＝Gemini 生的圖（princess_art.js）、原本＝程式畫（princess.js）
  // 變身戰士也有新畫風（2026-11-28）：svg 換成 truck_art.js，小圖的取景、型態判斷沿用 truck.js
  var ART = node ? require('./princess_art.js') : (typeof PrincessArt !== 'undefined' ? PrincessArt : null);
  var TART = node ? require('./truck_art.js') : (typeof TruckArt !== 'undefined' ? TruckArt : null);
  var useArt = true;
  function setArt(on) { useArt = !!on; }
  function mod(ch) {
    if (useArt && ch === 'princess' && ART) return ART;
    if (useArt && ch === 'truck' && TART) return { svg: TART.svg, cropFor: MOD.truck.cropFor, formFor: MOD.truck.formFor };
    return MOD[ch] || MOD.princess;
  }

  // ch：角色 id；wear：這個角色穿的東西；id：圖的代號（漸層 id 用）；crop：只畫局部（更衣室小圖）；form：變身戰士的型態
  function svg(ch, wear, id, crop, form) { return mod(ch).svg(wear, id, crop, form); }
  function cropFor(ch, slot, form) { return mod(ch).cropFor(slot, form); }
  // 小圖要用哪個型態（只有變身戰士有分）
  function formFor(ch, slot, form) { return MOD[ch] && MOD[ch].formFor ? MOD[ch].formFor(slot, form) : form; }

  return { svg: svg, cropFor: cropFor, formFor: formFor, setArt: setArt };
})();
if (typeof module !== 'undefined') module.exports = Heroes;
