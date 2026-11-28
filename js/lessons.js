/* 課程設定（資料）＋出題。以後加 20 以內、乘除，只要在 LESSONS 加新的一筆；
 * 新題型（type）才需要在 app.js 加對應的畫面。
 *
 * type：set＝聽數字撥珠、read＝看珠子選數字、calc＝加減計算
 * calc 的出題條件：ops 運算、max 答案和數字上限、require 一定要用到的方法、allow 只能用到的方法
 *   方法：direct 直接撥、five 五的好朋友、ten 十的好朋友（require 可以給陣列＝每一題都要同時用到）
 *   minA：第一個數字最小是多少、minB／maxB：第二個數字最小／最大、minAns：答案最小是多少、mult：兩個數字都是它的倍數（整十）
 */
var Lessons = (function () {
  var AB = (typeof module !== 'undefined' && typeof require === 'function') ? require('./abacus.js') : Abacus;

  var WORLDS = [
    { id: 1, title: '十以內', note: '第一區', place: '精靈村' },
    { id: 2, title: '二十以內', note: '第二區', place: '彩虹森林' },
    { id: 3, title: '一百以內', note: '第三區', place: '星星城堡' },
    { id: 4, title: '一千以內', note: '第四區', place: '星光王宮' },   // 2026-11-28 珠算 6 級加減
    { id: 5, title: '乘法', note: '第五區', place: '乘法王國' },
    { id: 6, title: '除法', note: '第六區', place: '魔王塔' }
  ];

  // ---- 故事頁（2026-11-26：使用者覺得「五的好朋友」太突然，用小一聽得懂的故事說明「為什麼要這樣撥」）----
  // 一頁 = { text：畫面上的字＋語音念的內容，
  //          dots: [a, b] 手指圖（a 根彎下、b 根站著）、pairs: true 好朋友表、rule: 'add'|'sub' 口訣表、
  //          quiz: n 問「n 的好朋友是誰？」、
  //          abacus: 算盤顯示的數字、glow: 'active'|'upper'|'lower'|'free' 要亮的珠子、
  //          play: [步驟…] 從 abacus 開始一步一步撥（步驟格式同 abacus.js） }
  // 大精靈＝五珠（一個就是 5）、小精靈＝一珠（一個是 1）
  var STORY_FIVE_ADD = [
    { text: '我們先來認識「五的好朋友」。張開一隻手，有 5 根手指頭。', dots: [0, 5] },
    { text: '彎下 1 根手指，還有 4 根站著。1 和 4 合起來是 5，所以 1 和 4 是五的好朋友！', dots: [1, 4] },
    { text: '彎下 2 根手指，還有 3 根站著。2 和 3 合起來也是 5，2 和 3 也是五的好朋友！', dots: [2, 3] },
    { quiz: 4 },
    { quiz: 2 },
    { text: '算盤上，下面的一珠就像小精靈，一個代表 1。上面的五珠就像大精靈，一個大精靈就等於 5 個小精靈！', abacus: 5, glow: 'upper' },
    { text: '現在來算 3 加 4。算盤上已經住了 3 個小精靈。', abacus: 3, glow: 'active' },
    { text: '還要再來 4 個小精靈，可是下面只剩 1 個空位，住不下！怎麼辦呢？', abacus: 3, glow: 'free' },
    { text: '我們請大精靈下來幫忙！大精靈一個就是 5，可是我們只要 4 個，這樣多了 1 個。', abacus: 3, play: [{ rod: 0, u: 1, l: 0 }] },
    { text: '多了 1 個，就請 1 個小精靈回家。你看，1 就是 4 的好朋友喔！', abacus: 8, play: [{ rod: 0, u: 0, l: -1 }] },
    { text: '數數看：大精靈是 5，再加 2 個小精靈，就是 7。所以 3 加 4 等於 7！', abacus: 7, glow: 'active' },
    { text: '記住這句口訣：小精靈住不下的時候，就「加 5，再減掉它的好朋友」。', rule: 'add' }
  ];
  var STORY_FIVE_SUB = [
    { text: '還記得五的好朋友嗎？1 和 4 是好朋友，2 和 3 也是好朋友。', pairs: true },
    { quiz: 3 },
    { quiz: 1 },
    { text: '現在來算 6 減 3。算盤上是 6：1 個大精靈，再加 1 個小精靈。', abacus: 6, glow: 'active' },
    { text: '要走掉 3 個小精靈，可是只有 1 個小精靈，不夠走！', abacus: 6, glow: 'lower' },
    { text: '那就請大精靈回家吧！可是大精靈一個就是 5，比 3 多了 2 個。', abacus: 6, glow: 'upper' },
    { text: '所以大精靈回家之前，先請 2 個小精靈進來接班。2 就是 3 的好朋友喔！', abacus: 6, play: [{ rod: 0, u: 0, l: 2 }] },
    { text: '現在大精靈可以放心回家了。', abacus: 8, play: [{ rod: 0, u: -1, l: 0 }] },
    { text: '數數看，剩下 3 個小精靈，所以 6 減 3 等於 3！', abacus: 3, glow: 'active' },
    { text: '記住這句口訣：小精靈不夠走的時候，就「加上它的好朋友，再減 5」。', rule: 'sub' }
  ];

  // 十的好朋友：十位的一顆珠子＝精靈王國護衛隊隊長（簡稱隊長），一位隊長等於 10 個小精靈
  // （2026-11-27 使用者把「精靈公主」改名，避免和主角公主撞名）
  // dots/quiz 加上 total: 10 就是兩隻手 10 根手指；glow 'tens' 亮十位的珠子
  var STORY_TEN_ADD = [
    { text: '這一關要認識「十的好朋友」。張開兩隻手，總共有 10 根手指頭。', dots: [0, 10], total: 10 },
    { text: '彎下 3 根手指，還有 7 根站著。3 和 7 合起來是 10，所以 3 和 7 是十的好朋友！', dots: [3, 7], total: 10 },
    { text: '十的好朋友有：1 和 9、2 和 8、3 和 7、4 和 6，還有 5 和 5。', pairs: true, total: 10 },
    { quiz: 3, total: 10 },
    { quiz: 6, total: 10 },
    { text: '算盤左邊是十位。十位住的是「精靈王國護衛隊隊長」，我們叫他隊長。一位隊長就等於 10 個小精靈！', abacus: 10, glow: 'tens' },
    { text: '現在來算 7 加 3。個位已經有 7：1 個大精靈，加上 2 個小精靈。', abacus: 7, glow: 'active' },
    { text: '還要再來 3 個，可是個位最多只能放到 9，放不下！', abacus: 7, glow: 'free' },
    { text: '那就請十位的隊長來幫忙！隊長一個就是 10，可是我們只要加 3，所以要先請 3 的好朋友，7 個精靈回家。', abacus: 7, glow: 'active' },
    { text: '先請大精靈回家，大精靈是 5 個。', abacus: 7, play: [{ rod: 0, u: -1, l: 0 }] },
    { text: '再請 2 個小精靈回家，這樣 7 個都回家了。', abacus: 2, play: [{ rod: 0, u: 0, l: -2 }] },
    { text: '最後請十位的隊長來，隊長就是 10！', abacus: 0, play: [{ rod: 1, u: 0, l: 1 }] },
    { text: '數數看：十位有 1 位隊長，是 10；個位沒有精靈，是 0。所以 7 加 3 等於 10！', abacus: 10, glow: 'active' },
    { text: '記住這句口訣：個位放不下的時候，就「減掉它的好朋友，十位加 1」。', rule: 'tenAdd' }
  ];
  var STORY_TEN_SUB = [
    { text: '還記得十的好朋友嗎？1 和 9、2 和 8、3 和 7、4 和 6、5 和 5。', pairs: true, total: 10 },
    { quiz: 4, total: 10 },
    { quiz: 8, total: 10 },
    { text: '現在來算 10 減 4。算盤上是 10：十位有 1 位隊長，個位一個精靈都沒有。', abacus: 10, glow: 'active' },
    { text: '要走掉 4 個精靈，可是個位一個都沒有，不夠走！', abacus: 10 },
    { text: '那就請隊長回家吧！隊長一個就是 10，可是我們只要走 4 個，這樣多走了 6 個。', abacus: 10, glow: 'tens' },
    { text: '隊長先回家。', abacus: 10, play: [{ rod: 1, u: 0, l: -1 }] },
    { text: '多走了 6 個，就請 6 個精靈回到個位。先請大精靈來，大精靈是 5 個。', abacus: 0, play: [{ rod: 0, u: 1, l: 0 }] },
    { text: '再請 1 個小精靈來，5 加 1 就是 6。你看，6 就是 4 的好朋友喔！', abacus: 5, play: [{ rod: 0, u: 0, l: 1 }] },
    { text: '數數看，個位有 6 個，所以 10 減 4 等於 6！', abacus: 6, glow: 'active' },
    { text: '記住這句口訣：個位不夠走的時候，就「十位減 1，再加上它的好朋友」。', rule: 'tenSub' }
  ];

  // ---- 主線故事（2026-11-27）：每一關開頭接上「算盤王國保衛戰」，{hero}＝孩子選的角色 ----
  var STORY_W1_1 = [
    { text: '{hero}來到精靈村。村子裡的算盤，就是精靈們的家。', who: 'hero' },
    { text: '橫樑下面住著小精靈，一個小精靈代表 1。', abacus: 0, glow: 'free' },
    { text: '橫樑上面住著大精靈，一個大精靈就代表 5。', abacus: 0, glow: 'upper' },
    { text: '精靈要靠到中間的橫樑，才算出來幫忙。你看，這是 3。', abacus: 3, glow: 'active' },
    { text: '亂亂怪把數字藏起來了！仔細聽數字，把精靈撥到橫樑上，就能救出他們。', who: 'king' }
  ];
  var STORY_W1_2 = [
    { text: '亂亂怪把精靈排好隊，問{hero}：「你知道這是多少嗎？答不出來就不放人！」', who: 'king', abacus: 6 },
    { text: '別怕！先看大精靈有沒有靠到橫樑，有就是 5。', abacus: 6, glow: 'upper' },
    { text: '再數一數靠樑的小精靈，有 1 個。5 加 1，就是 6！', abacus: 6, glow: 'active' },
    { text: '答對了，精靈就會被放出來。{hero}，加油！', who: 'hero' }
  ];
  var STORY_W1_3 = [
    { text: '救出來的精靈要回家了！算盤上有 1 個小精靈，又來了 3 個。', abacus: 1, glow: 'active' },
    { text: '空位夠的時候，直接把 3 個小精靈撥上去就好。', abacus: 1, play: [{ rod: 0, u: 0, l: 3 }] },
    { text: '數數看，1 加 3 等於 4！', abacus: 4, glow: 'active' },
    { text: '{hero}說：「精靈越來越多了，太好了！」', who: 'hero' }
  ];
  var STORY_W1_4 = [
    { text: '亂亂怪又來搗蛋，想把精靈抓走！算盤上有 4 個小精靈，被抓走 3 個。', who: 'king', abacus: 4, glow: 'active' },
    { text: '要走的精靈都在橫樑上，直接撥下來。', abacus: 4, play: [{ rod: 0, u: 0, l: -3 }] },
    { text: '剩下 1 個，所以 4 減 3 等於 1。', abacus: 1, glow: 'active' },
    { text: '別擔心，{hero}一定會把他們救回來！', who: 'hero' }
  ];
  var STORY_W1_8 = [
    { text: '亂亂怪派出手下「小亂怪」，守住精靈村的大門！', who: 'boss1' },
    { text: '小亂怪會出各種題目。想一想，要直接撥、用五的好朋友，還是十的好朋友。' },
    { text: '答對越多題，小亂怪就越快逃走。{hero}，加油！', who: 'hero' }
  ];

  // 第二區「彩虹森林」：二十以內（2026-11-27）
  var STORY_W2_1 = [
    { text: '{hero}來到彩虹森林。這裡的精靈好多，超過 10 個了！', who: 'hero' },
    { text: '還記得隊長嗎？十位的一顆珠子就是一位隊長，代表 10。', abacus: 10, glow: 'tens' },
    { text: '13 就是：十位 1 位隊長是 10，個位 3 個小精靈是 3。', abacus: 13, glow: 'active' },
    { text: '十幾的數字，十位都是 1 位隊長，再看個位是幾就好。這是 17。', abacus: 17, glow: 'active' }
  ];
  var STORY_W2_2 = [
    { text: '亂亂怪的手下又來考{hero}了：「這是多少？」', who: 'boss2', abacus: 16 },
    { text: '先看十位：1 位隊長是 10。再看個位：大精靈 5，加 1 個小精靈，是 6。', abacus: 16, glow: 'active' },
    { text: '10 和 6 合起來，就是 16！', abacus: 16 },
    { text: '如果十位有 2 位隊長，個位都沒有，那就是 20！', abacus: 20, glow: 'active' }
  ];
  var STORY_W2_3 = [
    { text: '森林裡的精靈在搬家。來算 12 加 5，十位不用動，只要看個位。', abacus: 12, glow: 'active' },
    { text: '個位 2 加 5，直接請大精靈下來。', abacus: 12, play: [{ rod: 0, u: 1, l: 0 }] },
    { text: '十位還是 1 位隊長，個位是 7，所以 12 加 5 等於 17！', abacus: 17, glow: 'active' },
    { text: '個位住不下或不夠走的時候，就用五的好朋友，跟以前學的一樣！', who: 'hero' }
  ];
  var STORY_W2_4 = [
    { text: '{hero}遇到一題：9 加 5。算盤上已經有 9 了。', who: 'hero', abacus: 9, glow: 'active' },
    { text: '要再加 5，個位放不下！請出十的好朋友：5 的好朋友是 5，先請 5 個精靈回家。', abacus: 9, glow: 'upper' },
    { text: '大精靈就是 5 個，請大精靈回家。', abacus: 9, play: [{ rod: 0, u: -1, l: 0 }] },
    { text: '再請十位的隊長來，加 1。', abacus: 4, play: [{ rod: 1, u: 0, l: 1 }] },
    { text: '十位 1 位隊長是 10，個位是 4，所以 9 加 5 等於 14！', abacus: 14, glow: 'active' },
    { text: '口訣一樣：個位放不下的時候，就「減掉它的好朋友，十位加 1」。', rule: 'tenAdd' }
  ];
  var STORY_W2_5 = [
    { text: '亂亂怪想抓走精靈！算盤上是 13，要被抓走 5 個。', who: 'king', abacus: 13, glow: 'active' },
    { text: '個位只有 3 個，不夠走！先請十位的隊長回家，減 1。', abacus: 13, play: [{ rod: 1, u: 0, l: -1 }] },
    { text: '隊長是 10，可是只要走 5 個，多走了 5 個。5 的好朋友是 5，請大精靈回來。', abacus: 3, play: [{ rod: 0, u: 1, l: 0 }] },
    { text: '個位是 8，所以 13 減 5 等於 8！', abacus: 8, glow: 'active' },
    { text: '口訣一樣：個位不夠走的時候，就「十位減 1，再加上它的好朋友」。', rule: 'tenSub' }
  ];
  var STORY_W2_6 = [
    { text: '彩虹森林深處，亂亂怪設了最難的機關：6 加 7！', who: 'king', abacus: 6, glow: 'active' },
    { text: '個位放不下，要用十的好朋友。7 的好朋友是 3，所以要先減 3。', abacus: 6, glow: 'active' },
    { text: '可是個位只有 1 個小精靈，不夠減 3！這時候換五的好朋友幫忙：3 的好朋友是 2，先請 2 個小精靈來。', abacus: 6, play: [{ rod: 0, u: 0, l: 2 }] },
    { text: '再請大精靈回家，減 5。這樣就減掉 3 了。', abacus: 8, play: [{ rod: 0, u: -1, l: 0 }] },
    { text: '最後請十位的隊長來，加 1。', abacus: 3, play: [{ rod: 1, u: 0, l: 1 }] },
    { text: '十位 10，個位 3，所以 6 加 7 等於 13！隊長和大精靈一起幫忙，好厲害！', abacus: 13, glow: 'active' },
    { text: '記住：十的好朋友減不下去的時候，就再請五的好朋友幫忙。', who: 'hero' }
  ];
  var STORY_W2_7 = [
    { text: '亂亂怪又想抓走 7 個精靈：12 減 7！', who: 'king', abacus: 12, glow: 'active' },
    { text: '個位只有 2 個，不夠走。先請十位的隊長回家，減 1。', abacus: 12, play: [{ rod: 1, u: 0, l: -1 }] },
    { text: '7 的好朋友是 3，要請 3 個小精靈回來。可是下面只剩 2 個空位，住不下！', abacus: 2, glow: 'free' },
    { text: '換五的好朋友幫忙：請大精靈下來，加 5。', abacus: 2, play: [{ rod: 0, u: 1, l: 0 }] },
    { text: '多了 2 個，請 2 個小精靈回家。你看，2 就是 3 的好朋友！', abacus: 7, play: [{ rod: 0, u: 0, l: -2 }] },
    { text: '個位剩 5，所以 12 減 7 等於 5！', abacus: 5, glow: 'active' },
    { text: '記住：十的好朋友加不上去的時候，就再請五的好朋友幫忙。', who: 'hero' }
  ];
  var STORY_W2_8 = [
    { text: '亂亂怪派出更厲害的手下「大亂怪」，守住彩虹森林！', who: 'boss2' },
    { text: '大亂怪會出好長的連加減題目。先想一想每一口要用哪一招，再撥珠子。' },
    { text: '把大亂怪打敗，就能救出森林裡全部的精靈。{hero}，加油！', who: 'hero' }
  ];

  // 第三區「星星城堡」：一百以內，算盤 3 根（2026-11-27）
  // 十位：隊長＝10、大隊長（十位的五珠）＝50；百位：精靈國王＝100；日式算盤先撥十位、再撥個位
  var STORY_W3_1 = [
    { text: '{hero}來到星星城堡。聽說精靈國王被關在城堡最高的塔上！', who: 'hero' },
    { text: '城堡的算盤有 3 根柱子：右邊是個位，中間是十位，左邊是百位。', abacus: 0 },
    { text: '十位下面的珠子是隊長，一位就是 10。十位上面的珠子是「大隊長」，一位大隊長就是 50！', abacus: 50, glow: 'tensUp' },
    { text: '這是 73：十位有大隊長 50，再加 2 位隊長 20，是 70；個位是 3。', abacus: 73, glow: 'active' },
    { text: '你發現了嗎？每往左邊一根，就大 10 倍：個位的珠子是 1，十位是 10，百位是 100！', abacus: 111, glow: 'active' },
    { text: '百位住的是精靈國王，一位國王就是 100。我們要湊到 100，才能救出國王！', abacus: 100, glow: 'king' }
  ];
  var STORY_W3_2 = [
    { text: '亂亂將軍守在城門口：「這是多少？答對才能進城堡！」', who: 'boss3', abacus: 68 },
    { text: '先看十位：大隊長 50，加 1 位隊長 10，是 60。', abacus: 68, glow: 'rod1' },
    { text: '再看個位：大精靈 5，加 3 個小精靈，是 8。60 和 8 合起來，就是 68！', abacus: 68, glow: 'rod0' },
    { text: '如果百位有 1 位國王，十位和個位都沒有，那就是 100！', abacus: 100, glow: 'king' }
  ];
  var STORY_W3_3 = [
    { text: '城堡的大門要用整十的數字打開。來算 30 加 40。', abacus: 30, glow: 'active' },
    { text: '整十的數字只要撥十位，就像個位一樣算！30 是 3 位隊長，再來 4 位，住不下！', abacus: 30, glow: 'rod1' },
    { text: '用五的好朋友：請大隊長下來，加 50。', abacus: 30, play: [{ rod: 1, u: 1, l: 0 }] },
    { text: '多了 10，請 1 位隊長回家。', abacus: 80, play: [{ rod: 1, u: 0, l: -1 }] },
    { text: '大隊長 50，加 2 位隊長 20，所以 30 加 40 等於 70！', abacus: 70, glow: 'active' }
  ];
  var STORY_W3_4 = [
    { text: '日式算盤有一個重要的規則：先撥十位，再撥個位，從左邊撥到右邊！', who: 'hero' },
    { text: '來算 23 加 45。45 是 4 個十和 5 個一。', abacus: 23, glow: 'active' },
    { text: '先撥十位：加 4，隊長住不下，請大隊長下來。', abacus: 23, play: [{ rod: 1, u: 1, l: 0 }] },
    { text: '多了 1 位，請 1 位隊長回家。', abacus: 73, play: [{ rod: 1, u: 0, l: -1 }] },
    { text: '再撥個位：加 5，請大精靈下來。', abacus: 63, play: [{ rod: 0, u: 1, l: 0 }] },
    { text: '十位 6，個位 8，所以 23 加 45 等於 68！', abacus: 68, glow: 'active' }
  ];
  var STORY_W3_5 = [
    { text: '星星城堡的精靈越來越多。來算 27 加 8。', abacus: 27, glow: 'active' },
    { text: '個位加 8，放不下！8 的好朋友是 2，先請 2 個小精靈回家。', abacus: 27, play: [{ rod: 0, u: 0, l: -2 }] },
    { text: '再請十位的隊長來，加 1。', abacus: 25, play: [{ rod: 1, u: 0, l: 1 }] },
    { text: '十位 3 位隊長是 30，個位 5，所以 27 加 8 等於 35！', abacus: 35, glow: 'active' }
  ];
  var STORY_W3_6 = [
    { text: '亂亂將軍想抓走 5 個精靈：32 減 5！', who: 'boss3', abacus: 32, glow: 'active' },
    { text: '個位只有 2 個，不夠走。先請十位的隊長回家，減 1。', abacus: 32, play: [{ rod: 1, u: 0, l: -1 }] },
    { text: '5 的好朋友是 5，請大精靈回來。', abacus: 22, play: [{ rod: 0, u: 1, l: 0 }] },
    { text: '十位 2 位隊長，個位 7，所以 32 減 5 等於 27！', abacus: 27, glow: 'active' }
  ];
  var STORY_W3_7 = [
    { text: '來挑戰 38 加 45！記得：先撥十位，再撥個位。', abacus: 38, glow: 'active' },
    { text: '十位加 4：隊長住不下，請大隊長下來，再請 1 位隊長回家。', abacus: 38, play: [{ rod: 1, u: 1, l: 0 }, { rod: 1, u: 0, l: -1 }] },
    { text: '個位加 5：放不下！5 的好朋友是 5，請大精靈回家。', abacus: 78, play: [{ rod: 0, u: -1, l: 0 }] },
    { text: '再請十位的隊長來，加 1。', abacus: 73, play: [{ rod: 1, u: 0, l: 1 }] },
    { text: '十位 8，個位 3，所以 38 加 45 等於 83！', abacus: 83, glow: 'active' }
  ];
  var STORY_W3_8 = [
    { text: '亂亂將軍出了一題難的：72 減 38。先撥十位！', who: 'boss3', abacus: 72, glow: 'active' },
    { text: '十位減 3：隊長不夠走，先請 2 位隊長來接班。', abacus: 72, play: [{ rod: 1, u: 0, l: 2 }] },
    { text: '再請大隊長回家，減 50。', abacus: 92, play: [{ rod: 1, u: -1, l: 0 }] },
    { text: '個位減 8：只有 2 個，不夠走！請十位的隊長回家，減 1。', abacus: 42, play: [{ rod: 1, u: 0, l: -1 }] },
    { text: '8 的好朋友是 2，請 2 個小精靈回來。', abacus: 32, play: [{ rod: 0, u: 0, l: 2 }] },
    { text: '十位 3，個位 4，所以 72 減 38 等於 34！', abacus: 34, glow: 'active' }
  ];
  var STORY_W3_9 = [
    { text: '終於到了最高的塔！要湊到 100，才能打開國王的門。來算 65 加 35。', who: 'hero', abacus: 65, glow: 'active' },
    { text: '先撥十位：加 3，直接撥上 3 位隊長。', abacus: 65, play: [{ rod: 1, u: 0, l: 3 }] },
    { text: '再撥個位：加 5，放不下！先請大精靈回家。', abacus: 95, play: [{ rod: 0, u: -1, l: 0 }] },
    { text: '要請十位的隊長來加 1，可是十位已經滿了，是 9！', abacus: 90, glow: 'rod1' },
    { text: '十位也用十的好朋友：1 的好朋友是 9，請 9 位隊長回家。', abacus: 90, play: [{ rod: 1, u: -1, l: 0 }, { rod: 1, u: 0, l: -4 }] },
    { text: '再請百位的精靈國王來，加 1！', abacus: 0, play: [{ rod: 2, u: 0, l: 1 }] },
    { text: '百位 1 位國王，就是 100！65 加 35 等於 100，國王的門打開了！', abacus: 100, glow: 'active' }
  ];
  // 第四區「星光王宮」（2026-11-28）：國王回到王宮，寶物數字被弄亂了，要用三位數才數得完
  var STORY_W4_1 = [
    { text: '{hero}救出精靈國王，國王帶大家回到星光王宮。可是亂亂怪把王宮寶庫的數字全部弄亂了！', who: 'hero' },
    { text: '寶物好多，要用到百位。百位的一顆珠子是一位國王，代表 100。', abacus: 100, glow: 'king' },
    { text: '這是 365：百位 3 位國王是 300，十位大隊長加 1 位隊長是 60，個位大精靈是 5。', abacus: 365, glow: 'active' },
    { text: '還記得規則嗎？每往左邊一根，就大 10 倍。百位再左邊是千位，一顆就是 1000！', abacus: 1000, glow: 'active' }
  ];
  var STORY_W4_2 = [
    { text: '寶庫的門上寫著一個數字，要唸對才能打開。', abacus: 472, glow: 'active' },
    { text: '從左邊看：百位是 400，十位大隊長加 2 位隊長是 70，個位是 2。', abacus: 472, glow: 'active' },
    { text: '400 和 70 和 2 合起來，就是 472！', abacus: 472 },
    { text: '如果某一位一顆都沒有，就唸「零」。這是 906：九百零六。', abacus: 906, glow: 'active' }
  ];
  var STORY_W4_3 = [
    { text: '寶物要搬進寶庫。231 加 152，跟以前一樣從左邊開始撥。', abacus: 231, glow: 'active' },
    { text: '先撥百位：加 1 位國王。再撥十位：加 5，請大隊長下來。最後撥個位：加 2 個小精靈。', abacus: 231, glow: 'active' },
    { text: '百位 3、十位 8、個位 3，所以 231 加 152 等於 383！', abacus: 383, glow: 'active' }
  ];
  var STORY_W4_4 = [
    { text: '寶物越來越多，十位滿了怎麼辦？來算 178 加 45。', abacus: 178, glow: 'active' },
    { text: '十位 7 加 4 放不下：十的好朋友！十位減 6，再請百位的國王加 1。', abacus: 178, glow: 'rod1' },
    { text: '個位 8 加 5 也放不下：個位減 5，再請十位加 1。', abacus: 218, glow: 'rod0' },
    { text: '百位 2、十位 2、個位 3，所以 178 加 45 等於 223！不管是哪一位，招式都一樣。', abacus: 223, glow: 'active' }
  ];
  var STORY_W4_5 = [
    { text: '亂亂怪派出「亂亂騎士」守住寶庫的最後一道門！', who: 'boss4' },
    { text: '亂亂騎士會出二位數、三位數的連加減。記得從左邊撥，一口一口來。' },
    { text: '打敗亂亂騎士，就能把王宮的寶物全部救回來。{hero}，加油！', who: 'hero' }
  ];

  var STORY_W3_10 = [
    { text: '亂亂將軍生氣了，親自出來擋路！', who: 'boss3' },
    { text: '亂亂將軍會出一百以內的各種題目。記得先撥十位，再撥個位。' },
    { text: '打敗亂亂將軍，就能把精靈國王救出來。{hero}，加油！', who: 'hero' }
  ];

  // 級檢定的題目由少到多：第 1～3 題 4 口、第 4～7 題 5 口、第 8～10 題 6 口（使用者覺得一次 6 口太難）
  var RAMP6 = [4, 4, 4, 5, 5, 5, 5, 6, 6, 6];
  var RAMP5 = [3, 3, 3, 4, 4, 4, 4, 5, 5, 5];   // 9 級最多 5 口
  var RAMP7 = [5, 5, 5, 6, 6, 6, 6, 7, 7, 7];   // 7 級最多 7 口

  var LESSONS = [
    { id: 'w1-1', world: 1, title: '認識算盤', type: 'set', min: 1, max: 9, rods: 2, count: 8, demo: [3, 7],
      intro: '算盤上面一顆是五珠，一顆代表 5。下面四顆是一珠，一顆代表 1。珠子靠到中間的橫樑才算數。',
      story: STORY_W1_1 },
    { id: 'w1-2', world: 1, title: '看珠說數字', type: 'read', min: 0, max: 9, rods: 2, count: 8, demo: [6, 9],
      intro: '先看五珠有沒有靠樑，有就是 5，再加上靠樑的一珠。', story: STORY_W1_2 },
    { id: 'w1-3', world: 1, title: '直接加', type: 'calc', ops: ['+'], max: 9, rods: 2, count: 8,
      allow: ['direct'], demo: [[1, '+', 3], [5, '+', 2]], intro: '珠子夠的時候，直接撥上去就好。',
      story: STORY_W1_3, storyQ: [1, '+', 3] },
    { id: 'w1-4', world: 1, title: '直接減', type: 'calc', ops: ['-'], max: 9, rods: 2, count: 8,
      allow: ['direct'], demo: [[4, '-', 3], [8, '-', 5]], intro: '要減的珠子都在橫樑上，直接撥下來。',
      story: STORY_W1_4, storyQ: [4, '-', 3] },
    // 2026-11-27 照珠心算檢定分級：每一招先教 2 口 → 連加減 3～4 口 → 級檢定（4 口慢慢加到 6 口）
    { id: 'w1-c1', world: 1, title: '直接連加減', type: 'chain', ops: ['+', '-'], digits: [1, 1], terms: [3, 4], max: 9, rods: 2, count: 8,
      allow: ['direct'], demo: [[2, 5, 1, -3]],
      intro: '考試的題目有好幾個數字，叫做「連加減」。從上面一口一口往下撥，最後算盤上就是答案。' },
    { id: 'w1-g15', world: 1, title: '15級檢定', type: 'chain', exam: 15, ops: ['+', '-'], digits: [1, 1], ramp: RAMP6, passRate: 0.7, max: 9, rods: 2, count: 10,
      allow: ['direct'], demo: [[1, 5, 2, -3]],
      intro: '15級檢定：只用直接撥的連加減，10 題答對 7 題就過關，拿到 15 級證書！' },
    { id: 'w1-5', world: 1, title: '五的好朋友：加', type: 'calc', ops: ['+'], max: 9, rods: 2, count: 8,
      require: 'five', allow: ['direct', 'five'], demo: [[3, '+', 4], [2, '+', 3]],
      intro: '這一關要學「五的好朋友」。先聽一個小精靈的故事，就知道為什麼要這樣撥喔！',
      story: STORY_FIVE_ADD, storyQ: [3, '+', 4] },
    { id: 'w1-6', world: 1, title: '五的好朋友：減', type: 'calc', ops: ['-'], max: 9, rods: 2, count: 8,
      require: 'five', allow: ['direct', 'five'], demo: [[6, '-', 3], [5, '-', 2]],
      intro: '五的好朋友也可以幫忙算減法！先聽故事，看看大精靈怎麼回家。',
      story: STORY_FIVE_SUB, storyQ: [6, '-', 3] },
    // 2026-11-26 加故事時拆成加、減兩關（和五的好朋友一樣），每個故事才不會太長
    { id: 'w1-c2', world: 1, title: '五的好朋友連加減', type: 'chain', ops: ['+', '-'], digits: [1, 1], terms: [3, 4], max: 9, rods: 2, count: 8,
      require: 'five', allow: ['direct', 'five'], demo: [[3, 4, -2]],
      intro: '連加減裡面，小精靈住不下或不夠走的時候，就用五的好朋友。' },
    { id: 'w1-g14', world: 1, title: '14級檢定', type: 'chain', exam: 14, ops: ['+', '-'], digits: [1, 1], ramp: RAMP6, passRate: 0.7, max: 9, rods: 2, count: 10,
      require: 'five', requireN: 2, allow: ['direct', 'five'], demo: [[4, 3, -4, 2]],
      intro: '14級檢定：會用到五的好朋友的連加減，10 題答對 7 題就過關！' },
    { id: 'w1-7', world: 1, title: '十的好朋友：加', type: 'calc', ops: ['+'], max: 10, rods: 2, count: 8,
      require: 'ten', demo: [[7, '+', 3], [4, '+', 6]],
      intro: '這一關要學「十的好朋友」。先聽隊長的故事，就知道個位放不下的時候怎麼辦！',
      story: STORY_TEN_ADD, storyQ: [7, '+', 3] },
    { id: 'w1-c3', world: 1, title: '十的好朋友連加', type: 'chain', ops: ['+'], digits: [1, 1], terms: [3, 4], max: 99, rods: 2, count: 8,
      require: 'ten', noMix: true, demo: [[7, 3, 4]],
      intro: '一口一口加，個位放不下的時候，就請十位的隊長來幫忙。' },
    { id: 'w1-g13', world: 1, title: '13級檢定', type: 'chain', exam: 13, ops: ['+'], digits: [1, 1], ramp: RAMP6, passRate: 0.7, max: 99, rods: 2, count: 10,
      require: 'ten', requireN: 2, noMix: true, demo: [[6, 4, 8, 5]], boss: 'boss1', story: STORY_W1_8,
      intro: '打敗小亂怪！13級檢定：會用到十的好朋友的連加，10 題答對 7 題就過關。' },
    // 第二區（2026-11-27）
    { id: 'w1-7b', world: 2, title: '十的好朋友：減', type: 'calc', ops: ['-'], max: 10, rods: 2, count: 8,
      require: 'ten', demo: [[10, '-', 4], [10, '-', 7]],
      intro: '十的好朋友也可以幫忙算減法！先聽故事，看看隊長怎麼幫忙。',
      story: STORY_TEN_SUB, storyQ: [10, '-', 4] },
    { id: 'w2-1', world: 2, title: '認識十幾', type: 'set', min: 10, max: 19, rods: 2, count: 8, demo: [13, 17],
      intro: '十位的一顆珠子是隊長，代表 10。先撥十位的隊長，再撥個位。', story: STORY_W2_1 },
    { id: 'w2-2', world: 2, title: '看珠說十幾', type: 'read', min: 10, max: 20, rods: 2, count: 8, demo: [16, 20],
      intro: '先看十位有幾位隊長，再看個位是幾。', story: STORY_W2_2 },
    { id: 'w2-3', world: 2, title: '十幾的加減', type: 'calc', ops: ['+', '-'], max: 19, minA: 10, rods: 2, maxB: 9, count: 8,
      allow: ['direct', 'five'], demo: [[12, '+', 5], [16, '-', 3]],
      intro: '十位不用動，只要算個位。個位不夠的時候，用五的好朋友。', story: STORY_W2_3, storyQ: [12, '+', 5] },
    { id: 'w2-4', world: 2, title: '進位加', type: 'calc', ops: ['+'], max: 20, minAns: 11, rods: 2, maxB: 9, count: 8,
      require: 'ten', allow: ['direct', 'ten'], demo: [[9, '+', 5], [9, '+', 7]],
      intro: '個位放不下的時候，請十位的隊長來幫忙！', story: STORY_W2_4, storyQ: [9, '+', 5] },
    { id: 'w2-5', world: 2, title: '退位減', type: 'calc', ops: ['-'], max: 20, minA: 11, rods: 2, maxB: 9, count: 8,
      require: 'ten', allow: ['direct', 'ten'], demo: [[13, '-', 5], [12, '-', 9]],
      intro: '個位不夠走的時候，請十位的隊長回家幫忙！', story: STORY_W2_5, storyQ: [13, '-', 5] },
    // 2026-11-27 照檢定分級：12級＝十的好朋友連加減、11級＝隊長和大精靈（五和十一起用）、10級＝一位數連加減
    { id: 'w2-c1', world: 2, title: '十的好朋友連加減', type: 'chain', ops: ['+', '-'], digits: [1, 1], terms: [3, 4], max: 30, rods: 2, count: 8,
      require: 'ten', noMix: true, demo: [[7, 5, -8]],
      intro: '連加減裡面，個位放不下或不夠走的時候，就請十位的隊長幫忙。' },
    { id: 'w2-g12', world: 2, title: '12級檢定', type: 'chain', exam: 12, ops: ['+', '-'], digits: [1, 1], ramp: RAMP6, passRate: 0.7, max: 30, rods: 2, count: 10,
      require: 'ten', requireN: 2, noMix: true, demo: [[8, 6, -9, 7]],
      intro: '12級檢定：會用到十的好朋友（加和減）的連加減，10 題答對 7 題就過關！' },
    { id: 'w2-6', world: 2, title: '隊長和大精靈：加', type: 'calc', ops: ['+'], max: 20, rods: 2, maxB: 9, count: 8,
      require: ['ten', 'five'], demo: [[6, '+', 7], [5, '+', 8]],
      intro: '這是第二區最難的一招：十的好朋友和五的好朋友一起用！', story: STORY_W2_6, storyQ: [6, '+', 7] },
    { id: 'w2-7', world: 2, title: '隊長和大精靈：減', type: 'calc', ops: ['-'], max: 20, rods: 2, maxB: 9, count: 8,
      require: ['ten', 'five'], demo: [[12, '-', 7], [13, '-', 6]],
      intro: '減法也可以讓隊長和大精靈一起幫忙！', story: STORY_W2_7, storyQ: [12, '-', 7] },
    { id: 'w2-c2', world: 2, title: '隊長和大精靈連加減', type: 'chain', ops: ['+', '-'], digits: [1, 1], terms: [3, 4], max: 40, rods: 2, count: 8,
      require: ['ten', 'five'], demo: [[6, 7, -5]],
      intro: '連加減裡面，十的好朋友減不下去、加不上去的時候，就再請五的好朋友幫忙。' },
    { id: 'w2-g11', world: 2, title: '11級檢定', type: 'chain', exam: 11, ops: ['+', '-'], digits: [1, 1], ramp: RAMP6, passRate: 0.7, max: 40, rods: 2, count: 10,
      require: ['ten', 'five'], requireN: 2, demo: [[6, 7, 4, -7]],
      intro: '11級檢定：隊長和大精靈一起幫忙的連加減，10 題答對 7 題就過關！' },
    { id: 'w2-c3', world: 2, title: '一位數連加減總複習', type: 'chain', ops: ['+', '-'], digits: [1, 1], terms: [4, 5], max: 50, rods: 2, count: 8,
      demo: [[9, 8, -6, 7]], intro: '各種招式都會用到，一口一口慢慢撥。' },
    { id: 'w2-g10', world: 2, title: '10級檢定', type: 'chain', exam: 10, ops: ['+', '-'], digits: [1, 1], ramp: RAMP6, passRate: 0.7, max: 50, rods: 2, count: 10,
      demo: [[8, 7, -6, 9]], boss: 'boss2', story: STORY_W2_8,
      intro: '打敗大亂怪！10級檢定：一位數的連加減，10 題答對 7 題就過關。' },
    // 第三區（2026-11-27）：3 根柱子；mult＝兩個數字都是整十、minB＝第二個數字最小
    { id: 'w3-1', world: 3, title: '認識一百以內', type: 'set', min: 20, max: 99, rods: 3, count: 8, demo: [73, 46],
      intro: '十位上面的珠子是大隊長，代表 50；下面的隊長，一位代表 10。', story: STORY_W3_1 },
    { id: 'w3-2', world: 3, title: '看珠說數字', type: 'read', min: 20, max: 100, rods: 3, count: 8, demo: [68, 100],
      intro: '先看十位是幾，再看個位是幾。', story: STORY_W3_2 },
    { id: 'w3-3', world: 3, title: '整十加減', type: 'calc', ops: ['+', '-'], max: 90, mult: 10, rods: 3, count: 8,
      allow: ['direct', 'five'], demo: [[30, '+', 40], [70, '-', 20]],
      intro: '整十的數字只要撥十位，就像個位一樣算。', story: STORY_W3_3, storyQ: [30, '+', 40] },
    { id: 'w3-4', world: 3, title: '兩位數加減', type: 'calc', ops: ['+', '-'], max: 99, minA: 11, minB: 11, rods: 3, count: 8,
      allow: ['direct', 'five'], demo: [[23, '+', 45], [68, '-', 25]],
      intro: '先撥十位，再撥個位。這一關都不用進位、退位。', story: STORY_W3_4, storyQ: [23, '+', 45] },
    // 2026-11-27 照檢定分級：9級＝一、二位數連加減（最多 5 口）、8級（6 口）、7級（7 口）
    { id: 'w3-c1', world: 3, title: '兩位數連加減', type: 'chain', ops: ['+', '-'], digits: [1, 2], terms: [3, 3], max: 99, rods: 3, count: 8,
      allow: ['direct', 'five'], demo: [[23, 45, -31]],
      intro: '兩位數的連加減：每一口都先撥十位，再撥個位。這一關都不用進位、退位。' },
    { id: 'w3-5', world: 3, title: '加一位數進位', type: 'calc', ops: ['+'], max: 99, minA: 20, maxB: 9, rods: 3, count: 8,
      require: 'ten', demo: [[27, '+', 8], [46, '+', 7]],
      intro: '個位放不下，就請十位的隊長來幫忙。', story: STORY_W3_5, storyQ: [27, '+', 8] },
    { id: 'w3-6', world: 3, title: '減一位數退位', type: 'calc', ops: ['-'], max: 99, minA: 20, maxB: 9, rods: 3, count: 8,
      require: 'ten', demo: [[32, '-', 5], [51, '-', 7]],
      intro: '個位不夠走，就請十位的隊長回家幫忙。', story: STORY_W3_6, storyQ: [32, '-', 5] },
    { id: 'w3-g9', world: 3, title: '9級檢定', type: 'chain', exam: 9, ops: ['+', '-'], digits: [1, 2], ramp: RAMP5, passRate: 0.7, max: 99, rods: 3, count: 10,
      require: 'ten', demo: [[27, 8, -15, 6]],
      intro: '9級檢定：一位數和兩位數的連加減，最多 5 口，10 題答對 7 題就過關！' },
    { id: 'w3-7', world: 3, title: '加兩位數進位', type: 'calc', ops: ['+'], max: 99, minA: 11, minB: 11, rods: 3, count: 8,
      require: 'ten', demo: [[38, '+', 45], [27, '+', 36]],
      intro: '先撥十位，再撥個位；個位放不下就進位。', story: STORY_W3_7, storyQ: [38, '+', 45] },
    { id: 'w3-8', world: 3, title: '減兩位數退位', type: 'calc', ops: ['-'], max: 99, minA: 20, minB: 11, rods: 3, count: 8,
      require: 'ten', demo: [[72, '-', 38], [53, '-', 26]],
      intro: '先撥十位，再撥個位；個位不夠走就退位。', story: STORY_W3_8, storyQ: [72, '-', 38] },
    { id: 'w3-g8', world: 3, title: '8級檢定', type: 'chain', exam: 8, ops: ['+', '-'], digits: [1, 2], ramp: RAMP6, passRate: 0.7, max: 99, rods: 3, count: 10,
      require: 'ten', requireN: 2, demo: [[38, 45, -27, 9]],
      intro: '8級檢定：一位數和兩位數的連加減，最多 6 口，10 題答對 7 題就過關！' },
    { id: 'w3-9', world: 3, title: '湊到一百救國王', type: 'calc', ops: ['+'], max: 100, minAns: 100, minA: 50, rods: 3, count: 8,
      demo: [[65, '+', 35], [98, '+', 2]],
      intro: '十位滿了還要進位，就請百位的精靈國王來！', story: STORY_W3_9, storyQ: [65, '+', 35] },
    { id: 'w3-g7', world: 3, title: '7級檢定', type: 'chain', exam: 7, ops: ['+', '-'], digits: [1, 2], ramp: RAMP7, passRate: 0.7, max: 199, rods: 3, count: 10,
      require: 'ten', requireN: 2, demo: [[65, 35, 48, -27]], boss: 'boss3', story: STORY_W3_10,
      intro: '打敗亂亂將軍！7級檢定：最多 7 口的連加減，答案可能超過 100，10 題答對 7 題就過關。' },
    // 第四區「星光王宮」（2026-11-28）：珠算 6 級的加減＝二～三位數連加減；算盤 4 根（答案可能超過 1000）
    { id: 'w4-1', world: 4, title: '認識三位數', type: 'set', min: 100, max: 999, rods: 4, count: 8, demo: [365, 208],
      intro: '百位的珠子是精靈國王，一位代表 100。先撥百位，再撥十位，最後撥個位。', story: STORY_W4_1 },
    { id: 'w4-2', world: 4, title: '看珠說三位數', type: 'read', min: 100, max: 999, rods: 4, count: 8, demo: [472, 906],
      intro: '從左邊看過來：百位幾、十位幾、個位幾。', story: STORY_W4_2 },
    { id: 'w4-3', world: 4, title: '三位數加減', type: 'chain', ops: ['+', '-'], digits: [3, 3], terms: [2, 2], max: 999, rods: 4,
      count: 8, allow: ['direct', 'five'], demo: [[231, 152], [586, -243]],
      intro: '三位數也是從左邊撥：先百位、再十位、最後個位。這一關都不用進位、退位。', story: STORY_W4_3 },
    { id: 'w4-4', world: 4, title: '三位數進位退位', type: 'chain', ops: ['+', '-'], digits: [2, 3], terms: [2, 2], max: 999, rods: 4,
      count: 8, require: 'ten', demo: [[178, 45], [302, -67]],
      intro: '哪一位放不下，就請左邊那一位加 1；不夠走，就請左邊那一位減 1。', story: STORY_W4_4 },
    { id: 'w4-c1', world: 4, title: '二三位數連加減', type: 'chain', ops: ['+', '-'], digits: [2, 3], terms: [3, 4], max: 1999, rods: 4,
      count: 8, demo: [[245, 318, -126]], intro: '好幾個二位數、三位數連在一起，一口一口撥。' },
    { id: 'w4-c2', world: 4, title: '二三位數連加減五口', type: 'chain', ops: ['+', '-'], digits: [2, 3], terms: [5, 5], max: 2999, rods: 4,
      count: 8, demo: [[452, 87, -213, 365, 94]], intro: '五口的連加減，慢慢撥、不要急。' },
    { id: 'w4-g6', world: 4, title: '6級加減檢定', type: 'chain', exam: 6, ops: ['+', '-'], digits: [2, 3], ramp: RAMP6, passRate: 0.7,
      max: 2999, rods: 4, count: 10, demo: [[365, 248, -127, 92]], boss: 'boss4', story: STORY_W4_5,
      intro: '打敗亂亂騎士！6 級的珠算加減：二～三位數的連加減，10 題答對 7 題就合格。' },
    // 之後的區域（使用者 2026-11-28 決定：先加減、再心算模式、再乘除）
    { id: 'w5-1', world: 5, title: '乘法', type: 'mul', comingSoon: true },
    { id: 'w6-1', world: 6, title: '除法', type: 'div', comingSoon: true }
  ];

  function byId(id) {
    for (var i = 0; i < LESSONS.length; i++) if (LESSONS[i].id === id) return LESSONS[i];
    return null;
  }

  function fits(lesson, kinds) {
    var need = lesson.require ? [].concat(lesson.require) : [];   // require 可以是一個或好幾個方法
    if (need.some(function (k) { return kinds.indexOf(k) < 0; })) return false;
    if (lesson.allow && kinds.some(function (k) { return lesson.allow.indexOf(k) < 0; })) return false;
    return true;
  }

  function union(lessons) {
    var pool = [], seen = {};
    lessons.forEach(function (l) {
      candidates(l).forEach(function (q) { var k = q.join(''); if (!seen[k]) { seen[k] = 1; pool.push(q); } });
    });
    return pool;
  }

  // 符合這一關條件的所有題目（a、b 都不為 0；答案 0～max）
  function candidates(lesson) {
    if (lesson.pool) return lesson.pool.slice();   // 每日挑戰：直接給題目清單
    if (lesson.poolFrom) return union(lesson.poolFrom.map(byId));   // 大挑戰：前面幾關的題目合起來
    if (lesson.type === 'set' || lesson.type === 'read') {
      var nums = [];
      for (var n = lesson.min; n <= lesson.max; n++) nums.push(n);
      return nums;
    }
    var out = [];
    var m = lesson.mult || 1;
    lesson.ops.forEach(function (op) {
      for (var a = Math.max(lesson.minA || 1, m); a <= lesson.max; a += (a % m ? m - a % m : m)) {
        for (var b = Math.max(lesson.minB || 1, m); b <= (lesson.maxB || lesson.max); b += m) {
          var r = op === '+' ? a + b : a - b;
          if (r < (lesson.minAns || 0) || r > lesson.max) continue;
          var p = AB.plan(a, op, b, lesson.rods);
          if (fits(lesson, p.kinds)) out.push([a, op, b]);
        }
      }
    });
    return out;
  }

  // ---- 連加減（type: 'chain'）：一題是一串數字，例如 [3, 4, -2, 5] ----
  // digits [最少, 最多] 位數、terms [最少, 最多] 口數（或 ramp：第 i 題幾口）、max 中間和答案的上限、
  // allow／require 同 calc（每一口分開看）、requireN 至少幾口要用到 require、noMix 同一口不能同時用五和十的好朋友
  function chainOk(lesson, kinds) {
    if (lesson.allow && kinds.some(function (k) { return lesson.allow.indexOf(k) < 0; })) return false;
    if (lesson.noMix && kinds.indexOf('five') >= 0 && kinds.indexOf('ten') >= 0) return false;
    return true;
  }
  function chainTerms(lesson, n, rng) {
    var lo = Math.pow(10, lesson.digits[0] - 1), hi = Math.pow(10, lesson.digits[1]) - 1;
    var need = lesson.require ? [].concat(lesson.require) : [];
    for (var tries = 0; tries < 400; tries++) {
      var total = lo + Math.floor(rng() * (Math.min(hi, lesson.max) - lo + 1)), terms = [total], hits = 0, ok = true;
      for (var k = 1; k < n && ok; k++) {
        var cands = [];
        // 三位數有 900 種可能，每一口都全部試太慢（iPad 上會卡）：範圍大的時候隨機抽 120 個來挑
        var pool = [];
        if (hi - lo + 1 > 150) for (var t = 0; t < 120; t++) pool.push(lo + Math.floor(rng() * (hi - lo + 1)));
        else for (var v = lo; v <= hi; v++) pool.push(v);
        lesson.ops.forEach(function (op) {
          pool.forEach(function (d) {
            var r = op === '+' ? total + d : total - d;
            if (r < 0 || r > lesson.max) return;
            var kinds = AB.plan(total, op, d, lesson.rods).kinds;
            if (!chainOk(lesson, kinds)) return;
            var hit = need.length && need.every(function (x) { return kinds.indexOf(x) >= 0; });
            for (var w = hit ? 3 : 1; w > 0; w--) cands.push([op === '+' ? d : -d, hit]);   // 多抽到要練的方法
          });
        });
        if (!cands.length) { ok = false; break; }
        var c = cands[Math.floor(rng() * cands.length)];
        terms.push(c[0]); total += c[0]; if (c[1]) hits++;
      }
      if (!ok || (need.length && hits < (lesson.requireN || 1))) continue;
      if (!distinctStates(terms, lesson.rods)) continue;
      return terms;
    }
    return null;
  }
  // 撥的過程中算盤不會回到同一個樣子（不然「撥到第幾步」會判斷錯）
  function distinctStates(terms, rods) {
    var p = AB.planChain(terms, rods), seen = {}, st = p.start, key = JSON.stringify(st);
    seen[key] = 1;
    for (var i = 0; i < p.groups.length; i++) {
      for (var j = 0; j < p.groups[i].steps.length; j++) {
        st = AB.applyStep(st, p.groups[i].steps[j]); key = JSON.stringify(st);
        if (seen[key]) return false;
        seen[key] = 1;
      }
    }
    return true;
  }
  function termsFor(lesson, i, rng) {
    if (lesson.ramp) return lesson.ramp[Math.min(i, lesson.ramp.length - 1)];
    return lesson.terms[0] + Math.floor(rng() * (lesson.terms[1] - lesson.terms[0] + 1));
  }

  // 抽 count 題，盡量不重複、不連續出一樣的；rng 可以換成固定的亂數方便測試
  function generate(lesson, rng) {
    rng = rng || Math.random;
    if (lesson.type === 'chain') {
      var qs = [];
      for (var i = 0; qs.length < lesson.count && i < lesson.count * 5; i++) {
        var t = chainTerms(lesson, termsFor(lesson, qs.length, rng), rng);
        if (t) qs.push(t);
      }
      return qs;
    }

    var pool = candidates(lesson), out = [];
    if (!pool.length) return out;
    while (out.length < lesson.count) {
      var bag = pool.slice();
      for (var i = bag.length - 1; i > 0; i--) {
        var j = Math.floor(rng() * (i + 1)), t = bag[i];
        bag[i] = bag[j]; bag[j] = t;
      }
      bag.forEach(function (q) {
        var last = out[out.length - 1];
        if (out.length < lesson.count && JSON.stringify(q) !== JSON.stringify(last)) out.push(q);
      });
    }
    return out;
  }

  function answerOf(q) {
    if (typeof q === 'number') return q;
    if (typeof q[1] === 'number') return q.reduce(function (a, b) { return a + b; }, 0);   // 連加減
    return q[1] === '+' ? q[0] + q[2] : q[0] - q[2];
  }

  // 看珠說數字的選項：正確答案＋2 個相近的數字，順序打亂
  function choices(answer, lesson, rng) {
    rng = rng || Math.random;
    var near = [answer - 1, answer + 1, answer - 5, answer + 5, answer - 2, answer + 2].filter(function (n) {
      return n >= lesson.min && n <= lesson.max;
    });
    var picked = [answer];
    while (picked.length < 3 && near.length) {
      var n = near.splice(Math.floor(rng() * near.length), 1)[0];
      if (picked.indexOf(n) < 0) picked.push(n);
    }
    return picked.sort(function (a, b) { return a - b; });
  }

  function opWord(op) { return op === '+' ? '加' : '減'; }

  // 每日挑戰（2026-11-27）：某一區的每日挑戰，從那一區的計算關卡出題（混合各種方法）
  function dailyLesson(world) {
    var w = WORLDS.filter(function (x) { return x.id === world; })[0];
    var title = (w ? w.note : '') + '每日挑戰';
    var pool = union(LESSONS.filter(function (l) { return l.world === world && !l.comingSoon && l.type === 'calc'; }));
    if (!pool.length) {   // 2026-11-28 第四區起只有連加減：每日挑戰用這一區最後一個連加減練習關的出題方式，5 題
      var chains = LESSONS.filter(function (l) { return l.world === world && !l.comingSoon && l.type === 'chain' && !l.exam; });
      var last = chains[chains.length - 1];
      if (last) return Object.assign({}, last, { id: 'daily', title: title, count: 5, story: null, demo: null });
    }
    return { id: 'daily', world: world, title: title, type: 'calc', rods: world >= 3 ? 3 : 2, count: 5, max: 100, pool: pool };
  }

  function gradeOf(st) {
    var g = null;
    LESSONS.forEach(function (l) {
      if (l.exam && st.lessons[l.id] && st.lessons[l.id].passed && (g === null || l.exam < g)) g = l.exam;
    });
    return g;
  }

  return { WORLDS: WORLDS, LESSONS: LESSONS, gradeOf: gradeOf, chainTerms: chainTerms, distinctStates: distinctStates, byId: byId, candidates: candidates, generate: generate,
           answerOf: answerOf, choices: choices, opWord: opWord, dailyLesson: dailyLesson };
})();
if (typeof module !== 'undefined') module.exports = Lessons;
