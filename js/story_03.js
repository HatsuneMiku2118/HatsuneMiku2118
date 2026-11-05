/* ==========================================================
   story_03.js —— 第三章「雨の下校」
   ========================================================== */

Object.assign(SCENES, {

  c3_rain: [
    { t: 'chapter', no: '第三章', title: '雨の下校', sub: '七月二十日 · 木曜日' },
    { t: 'theme', v: 'cold' },
    { t: 'ui', v: 'box' },
    { t: 'bg', v: 'classroom', instant: true },
    { t: 'env', v: 'rain', lv: 0.12 },
    { t: 'bgm', v: 'unease' },

    { t: 'narr', x: '值日那天，天从中午就阴着。' },
    { t: 'narr', x: '放学铃响的时候，雨已经下大了。' },
    { t: 'char', who: 'koharu', pos: 'l' },
    { t: 'line', c: 'koharu', x: '……没带伞。' },
    { t: 'line', c: 'me', x: '我带了一把。' },
    { t: 'narr', x: '两个人，一把伞。' },
    { t: 'narr', x: '她看了我一眼，很自然地站到我左边。' },
    { t: 'line', c: 'koharu', vo: true, x: '挤一挤。', jp: 'ちょっと、詰めて。' },

    { t: 'ui', v: 'wide' },
    { t: 'bg', v: 'bridge_rain' },
    { t: 'narr', x: '河面上的雨点砸出一层白雾。' },
    { t: 'narr', x: '伞很小，她的肩膀湿了一半。' },
    { t: 'line', c: 'koharu', vo: true, x: '我小时候掉进这条河，是你把我拉上来的。', jp: '小さいとき、この川に落ちたの、ようたが引き上げてくれたんだよ。' },
    { t: 'line', c: 'me', x: '……你记错了。是你自己爬上来的。' },
    { t: 'line', c: 'koharu', vo: true, x: '不对。是你。', jp: 'ちがう。ようただよ。' },
    { t: 'narr', x: '她停下脚步，抬头看我。' },
    { t: 'narr', x: '雨落在伞面上，声音很密。' },
    { t: 'line', c: 'koharu', vo: true, x: '所以这次，换我拉你，好不好。', jp: 'だから今度は、わたしが引っぱるね。' },
    { t: 'line', c: 'me', x: '……什么意思。' },
    { t: 'line', c: 'koharu', vo: true, x: '意思是，你别一个人待着。', jp: 'ひとりで、いないで。' },
    { t: 'narr', x: '她说完就往前走了，伞柄还握在我手里。' },
    { t: 'narr', x: '我跟上去的时候，她已经笑了。' },

    { t: 'jump', v: 'c4_festival' }
  ]

});
