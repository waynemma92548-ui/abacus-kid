/* 語音：只用台灣口音（zh-TW）的語音，找不到就不出聲、只顯示文字（不會退回中國口音）。 */
var Voice = (function () {
  // 常見的台灣語音名稱，排前面的優先（Windows、iPad、Android、Chrome）
  var PREFERRED = ['Hanhan', 'HsiaoChen', 'HsiaoYu', 'Yating', 'Mei-Jia', 'Meijia', '美佳', 'Google 國語（臺灣）',
                   'Zhiwei', 'YunJhe'];

  function isTaiwan(v) {
    var lang = String(v.lang || '').replace('_', '-').toLowerCase();
    if (lang === 'zh-tw' || lang === 'cmn-hant-tw' || lang === 'zh-hant-tw') return true;
    return /台灣|臺灣|Taiwan/i.test(v.name || '') && lang.indexOf('zh') === 0;
  }

  // voices：speechSynthesis.getVoices() 的結果；wanted：家長頁選過的語音名稱
  function pick(voices, wanted) {
    var tw = (voices || []).filter(isTaiwan);
    if (!tw.length) return null;
    if (wanted) {
      var w = tw.filter(function (v) { return v.name === wanted; })[0];
      if (w) return w;
    }
    for (var i = 0; i < PREFERRED.length; i++) {
      var hit = tw.filter(function (v) { return v.name.indexOf(PREFERRED[i]) >= 0; })[0];
      if (hit) return hit;
    }
    return tw[0];
  }

  // 念給小孩聽：減號念「減」、等號念「等於」
  function spoken(text) {
    return String(text).replace(/(\d)\s*-\s*(\d)/g, '$1 減 $2').replace(/\+/g, ' 加 ')
      .replace(/=/g, ' 等於 ').replace(/？/g, '？');
  }

  // 瀏覽器用：回傳 Promise，念完（或沒有語音時等一下）才 resolve
  function makeSpeaker(synth, getWanted, onMissing) {
    var voice = null, ready = false;
    function refresh() {
      if (!synth) return;
      voice = pick(synth.getVoices(), getWanted());
      ready = true;
      if (!voice && onMissing) onMissing();
    }
    if (synth) {
      refresh();
      if ('onvoiceschanged' in synth) synth.onvoiceschanged = refresh;
    }
    function say(text, opts) {
      opts = opts || {};
      return new Promise(function (resolve) {
        var wait = Math.min(600 + String(text).length * 180, 6000);
        if (!synth || !voice) { setTimeout(resolve, opts.silentWait === false ? 0 : wait); return; }
        if (opts.interrupt !== false) synth.cancel();
        var u = new SpeechSynthesisUtterance(spoken(text));
        u.voice = voice; u.lang = voice.lang; u.rate = opts.rate || 0.9; u.pitch = 1.1;
        var done = false, finish = function () { if (!done) { done = true; resolve(); } };
        u.onend = finish; u.onerror = finish;
        setTimeout(finish, wait + 4000);   // 有些瀏覽器不觸發 onend，保險
        synth.speak(u);
      });
    }
    return { say: say, refresh: refresh, current: function () { return voice; },
             list: function () { return synth ? synth.getVoices().filter(isTaiwan) : []; },
             ready: function () { return ready; },
             stop: function () { if (synth) synth.cancel(); } };
  }

  return { isTaiwan: isTaiwan, pick: pick, spoken: spoken, makeSpeaker: makeSpeaker };
})();
if (typeof module !== 'undefined') module.exports = Voice;
