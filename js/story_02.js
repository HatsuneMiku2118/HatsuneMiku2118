/* ==========================================================
   story_02.js —— 第二章「屋上のソーダ」
   ========================================================== */

Object.assign(SCENES, {

  /* ========== 二 · 天台 ========== */
  c2_roof: [
    { t: 'chapter', no: '第二章', title: '屋上のソーダ', sub: '七月十三日 · 昼休み' },
    { t: 'theme', v: 'warm' },
    { t: 'ui', v: 'box' },
    { t: 'bg', v: 'school_roof', instant: true },
    { t: 'env', v: 'cicada', lv: 0.08 },
    { t: 'bgm', v: 'warm' },

    { t: 'narr', x: '天台的门锁是坏的。这件事只有我们两个人知道。' },
    { t: 'char', who: 'koharu', pos: 'l' },
    { t: 'line', c: 'koharu', vo: true, x: '这里，是不是很像秘密基地？', jp: 'ここ、ひみつきちみたいだね。' },
    { t: 'line', c: 'me', x: '只是没人来而已。' },
    { t: 'narr', x: '她把便当盒放在水塔的影子里，又从书包里掏出两瓶汽水。' },
    { t: 'line', c: 'koharu', x: '今天的是蜜瓜味。' },
    { t: 'narr', x: '玻璃瓶上全是水汽，摸上去凉得让人清醒。' },

    { t: 'ui', v: 'split' },
    { t: 'line', c: 'koharu', vo: true, x: '阳太，你还记得小时候的事吗？', jp: 'ようた、小さいころのこと、覚えてる？' },
    { t: 'line', c: 'me', x: '记得。' },
    { t: 'line', c: 'koharu', vo: true, x: '你说长大要开一家店，卖喝不完的汽水。', jp: 'お店やるって言ってたじゃん。ソーダが飲み放題のお店。' },
    { t: 'narr', x: '这件事我自己都忘了。' },
    { t: 'line', c: 'me', x: '……那是有多小的时候。' },
    { t: 'line', c: 'koharu', x: '七岁。你写在作文里的，我抄下来了。' },
    { t: 'narr', x: '她说这话的时候还在笑。' },
    { t: 'narr', x: '我看着她的侧脸，忽然不知道该说什么。' },

    { t: 'cg', v: 'cg_soda' },
    { t: 'charOff', who: 'all' },
    { t: 'narr', x: '汽水在嘴里炸开，甜得有点刺。' },
    { t: 'narr', x: '那天的云很大，天很蓝。' },
    { t: 'narr', x: '她说了很多话，我一句都没记住。' },
    { t: 'narr', x: '只记得她一直看着我。' },
    { t: 'cgOff' },
    { t: 'ui', v: 'box' },

    { t: 'jump', v: 'c2_shop' }
  ],

  /* ========== 二 · 店门口的告示 ========== */
  c2_shop: [
    { t: 'theme', v: 'warm' },
    { t: 'ui', v: 'box' },
    { t: 'bg', v: 'shop_street' },
    { t: 'env', v: 'cicada', lv: 0.05 },
    { t: 'bgm', v: 'afterglow' },

    { t: 'narr', x: '放学后，小春家的店门口贴着一张告示。' },
    { t: 'narr', x: '「本店营业至八月底」。' },
    { t: 'char', who: 'koharu', pos: 'l' },
    { t: 'narr', x: '她站在告示下面，手里还拿着扫帚。' },
    { t: 'line', c: 'me', x: '……要关门了？' },
    { t: 'line', c: 'koharu', vo: true, x: '嗯。爸爸身体不太行，要回外婆那边去。', jp: 'うん。お父さん、ちょっと悪くて。おばあちゃんとこに戻るの。' },
    { t: 'narr', x: '她说得很平静，像在念别人的事。' },
    { t: 'line', c: 'koharu', vo: true, x: '所以，九月我就不在这里了。', jp: 'だから、九月には、もうここにいないの。' },
    { t: 'narr', x: '蝉声忽然变得很大。' },
    { t: 'line', c: 'me', x: '……什么时候决定的。' },
    { t: 'line', c: 'koharu', x: '上个月。' },
    { t: 'narr', x: '她低下头，用扫帚在地上轻轻点了两下。' },
    { t: 'line', c: 'koharu', vo: true, x: '一直不敢跟你说。', jp: 'ようたに、言えなかった。' },
    { t: 'narr', x: '我想说的话卡在喉咙里，一句也出不来。' },
    { t: 'line', c: 'me', x: '为什么不早点说。' },
    { t: 'line', c: 'koharu', x: '因为你会是这个表情。' },
    { t: 'narr', x: '她伸手，指了指我的脸，又缩了回去。' },

    { t: 'bg', v: 'shop_front_night' },
    { t: 'theme', v: 'cold' },
    { t: 'env', v: 'wind', lv: 0.06 },
    { t: 'bgm', v: 'sorrow' },

    { t: 'narr', x: '那天晚上，我路过她家。' },
    { t: 'narr', x: '卷帘门拉下来一半，店里的灯还亮着。' },
    { t: 'char', who: 'koharu', pos: 'l' },
    { t: 'narr', x: '小春坐在台阶上，抱着膝盖。' },
    { t: 'line', c: 'koharu', x: '……阳太。' },
    { t: 'line', c: 'me', x: '怎么还没回去。' },
    { t: 'line', c: 'koharu', x: '在等最后一瓶汽水卖完。' },
    { t: 'narr', x: '冰箱里还剩一瓶。谁都知道那瓶卖不出去。' },
    { t: 'narr', x: '我坐下来，坐在她旁边。' },
    { t: 'line', c: 'koharu', vo: true, x: '如果我不在了，你早上会迟到吗？', jp: 'わたしがいなくなったら、朝、遅刻する？' },
    { t: 'line', c: 'me', x: '……会。' },
    { t: 'line', c: 'koharu', x: '那我就给你定个闹钟。' },
    { t: 'narr', x: '她笑了。我也笑了。' },
    { t: 'narr', x: '我们谁都没有再说话。' },

    { t: 'jump', v: 'c3_rain' }
  ]

});
