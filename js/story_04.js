/* ==========================================================
   story_04.js —— 第四章「夏祭りの夜」+ 三条结局分支
   ========================================================== */

Object.assign(SCENES, {

  /* ========== 四 · 夜市 ========== */
  c4_festival: [
    { t: 'chapter', no: '第四章', title: '夏祭りの夜', sub: '七月二十四日 · 土曜日' },
    { t: 'theme', v: 'warm' },
    { t: 'ui', v: 'box' },
    { t: 'bg', v: 'festival_night', instant: true },
    { t: 'env', v: 'wind', lv: 0.05 },
    { t: 'bgm', v: 'warm' },

    { t: 'narr', x: '夏祭那天，小春穿了浴衣。' },
    { t: 'char', who: 'koharu_yukata', pos: 'l' },
    { t: 'narr', x: '浅蓝的底，白色的牵牛花。她站在灯笼下面，比平时高出半个头。' },
    { t: 'line', c: 'me', x: '……你穿这个。' },
    { t: 'line', c: 'koharu', vo: true, x: '奇怪吗？', jp: 'おかしい？' },
    { t: 'line', c: 'me', x: '不是。' },
    { t: 'narr', x: '她笑起来，把手里的小袋子递给我。' },
    { t: 'line', c: 'koharu', x: '帮我拿一下，我要去买苹果糖。' },

    { t: 'ui', v: 'wave' },
    { t: 'narr', x: '人群把我们挤得很近。' },
    { t: 'narr', x: '捞金鱼、射击、巧克力香蕉。她每个摊子都要停一下。' },
    { t: 'narr', x: '我跟在她后面，手里拿着她的袋子、她的苹果糖、她的汽水。' },
    { t: 'line', c: 'koharu', vo: true, x: '阳太，你是不是不太喜欢这种热闹？', jp: 'ようた、こういうの、苦手？' },
    { t: 'line', c: 'me', x: '还好。' },
    { t: 'line', c: 'koharu', x: '骗人。' },
    { t: 'narr', x: '她回头笑了一下，又继续往前走。' },

    { t: 'bgm', v: 'afterglow' },
    { t: 'narr', x: '八点四十五分，广播说烟花要开始了。' },
    { t: 'ui', v: 'wide' },

    { t: 'jump', v: 'c4_fireworks' }
  ],

  /* ========== 四 · 烟花 ========== */
  c4_fireworks: [
    { t: 'narr', x: '我们被挤到河堤上。' },
    { t: 'narr', x: '第一发烟花升上去的时候，所有人都抬起了头。' },

    { t: 'ui', v: 'cine' },
    { t: 'cg', v: 'cg_fireworks' },
    { t: 'charOff', who: 'all' },
    { t: 'narr', x: '光落在她脸上，一下亮，一下暗。' },
    { t: 'line', c: 'koharu', vo: true, x: '阳太。', jp: 'ようた。' },
    { t: 'line', c: 'koharu', vo: true, x: '明年，你还会来吗？', jp: '来年も、来てくれる？' },
    { t: 'narr', x: '烟花的声音太大，我差点没听清。' },
    { t: 'line', c: 'me', x: '……你要走了吧。' },
    { t: 'line', c: 'koharu', x: '嗯。' },
    { t: 'line', c: 'koharu', vo: true, x: '所以我才问，明年。', jp: 'だから、来年のこと、聞いてるの。' },

    { t: 'ui', v: 'box' },
    { t: 'cgOff' },
    { t: 'narr', x: '她看着我。眼睛里有烟火，也有一点别的东西。' },

    { t: 'choice', opts: [
      { x: '「我也喜欢你。不管你去哪里。」', sub: '把话说出口', go: 'c4_confess' },
      { x: '「明年，我在这里等你。」', sub: '把约定留下', go: 'c4_wait' },
      { x: '「……明年再说吧。」', sub: '笑着带过去', go: 'c4_foam' }
    ] }
  ],

  /* ========== END 01 · 青いソーダ ========== */
  c4_confess: [
    { t: 'theme', v: 'warm' },
    { t: 'ui', v: 'box' },
    { t: 'bgm', v: 'climax' },

    { t: 'narr', x: '我说出口的时候，烟花正好在头顶炸开。' },
    { t: 'narr', x: '她愣了很久。' },
    { t: 'line', c: 'koharu', vo: true, x: '……真的？', jp: '……ほんとに？' },
    { t: 'line', c: 'me', x: '真的。' },
    { t: 'narr', x: '她低下头，又抬起来，眼睛红红的。' },
    { t: 'line', c: 'koharu', vo: true, x: '本来想，等回来再说的。', jp: 'ほんとはね、戻ってから言おうって思ってた。' },
    { t: 'narr', x: '她伸手，抓住了我的袖子。' },
    { t: 'line', c: 'koharu', vo: true, x: '那，你等我。', jp: 'じゃあ、待ってて。' },
    { t: 'narr', x: '我点头。烟花一发接一发。' },
    { t: 'narr', x: '那个夏天，我们没有说再见。' },
    { t: 'narr', x: '只说了「等你回来」。' },

    { t: 'bgmStop', fade: 2400 },
    { t: 'wait', ms: 1200 },
    { t: 'ending', v: 'blue' }
  ],

  /* ========== END 02 · 夏のつづき ========== */
  c4_wait: [
    { t: 'theme', v: 'warm' },
    { t: 'ui', v: 'wide' },
    { t: 'bgm', v: 'afterglow' },

    { t: 'narr', x: '我说，明年我在这里等你。' },
    { t: 'narr', x: '她笑了，笑得很轻。' },
    { t: 'line', c: 'koharu', vo: true, x: '那我一定回来。', jp: 'じゃあ、ぜったい戻ってくるね。' },
    { t: 'narr', x: '她没有说喜欢，我也没有。' },
    { t: 'narr', x: '有些话，好像只要不说破，就能一直放着。' },
    { t: 'narr', x: '烟花散了，人潮往车站涌。' },
    { t: 'narr', x: '我们被人群冲散，又在桥头找到彼此。' },
    { t: 'line', c: 'koharu', vo: true, x: '明年见。', jp: 'また、来年ね。' },
    { t: 'narr', x: '她挥了挥手。' },
    { t: 'narr', x: '我站在原地，把那句没说的话咽了回去。' },
    { t: 'narr', x: '——明年，还很远。' },

    { t: 'bgmStop', fade: 2200 },
    { t: 'wait', ms: 1200 },
    { t: 'ending', v: 'summer' }
  ],

  /* ========== END 03 · ソーダの泡 ========== */
  c4_foam: [
    { t: 'theme', v: 'void' },
    { t: 'ui', v: 'box' },
    { t: 'bgmStop', fade: 800 },

    { t: 'narr', x: '我笑了笑，说，明年再说吧。' },
    { t: 'narr', x: '她也笑了。' },
    { t: 'line', c: 'koharu', vo: true, x: '嗯。明年再说。', jp: 'うん。来年にしよう。' },
    { t: 'narr', x: '烟花在头顶散开，又落下来。' },
    { t: 'narr', x: '我们并排站着，中间隔着半个人的距离。' },
    { t: 'narr', x: '那半个人，谁都没有跨过去。' },

    { t: 'bg', v: 'shop_front_night' },
    { t: 'env', v: 'wind', lv: 0.05 },
    { t: 'narr', x: '九月，她走了。' },
    { t: 'narr', x: '店门口的告示被雨冲掉了一半。' },
    { t: 'narr', x: '我还是每天走那条路。' },
    { t: 'narr', x: '只是再也没有人在楼下按自行车铃。' },
    { t: 'narr', x: '后来我买了一瓶蜜瓜汽水。' },
    { t: 'narr', x: '喝了一口，气已经跑光了。' },
    { t: 'narr', x: '甜还在，就是不再刺了。' },

    { t: 'bgm', v: 'void', fade: 2600 },
    { t: 'wait', ms: 1400 },
    { t: 'ending', v: 'foam' }
  ]

});
