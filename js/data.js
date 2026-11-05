/* ==========================================================
   data.js —— 角色表 / 场景表 / 结局表 / 默认设置
   剧本文件一律 Object.assign(SCENES, {...})
   ========================================================== */

var SCENES = {};

const CHARS = {
  koharu:       { name: '小春', color: '#f6a99b' },
  koharu_yukata:{ name: '小春', color: '#f6a99b' },
  me:           { name: '陽太', color: '#e8c88a' }
};

const GAME = {
  key: 'soda.v1',
  title: '放課後ソーダ',
  subtitle: '放学后的汽水',
  start: 'c1_room',
  endings: {
    blue:   { no: 'END 01', title: '青いソーダ',   text: '烟火在头顶炸开的时候，我把话说完了。\n她没有说「再见」，只说「等我回来」。\n那年夏天，汽水一直是冰的。' },
    summer: { no: 'END 02', title: '夏のつづき',   text: '我说，明年还在这里等。\n她笑着答应了。\n有些话没说出口，就被留在了那个夏天。' },
    foam:   { no: 'END 03', title: 'ソーダの泡',   text: '我笑着说，明年再说吧。\n九月，她搬走了。\n后来那瓶汽水，气跑光了，甜还在。' }
  }
};

const DEFAULT_SET = {
  bgm: 55,
  voice: 95,
  voiceOn: true,
  speed: 2,
  textSpeed: 20
};
