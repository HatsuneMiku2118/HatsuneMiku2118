/* ==========================================================
   engine.js —— 步进引擎
   step 类型：bg / bgfade / cg / cgOff / char / charOff / line / narr /
              choice / bgm / bgmStop / env / ui / theme / fade /
              chapter / wait / jump / flag / ending
   版式由 #stage[data-ui] 切换（ui-variants.css）
   ========================================================== */

(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const stage = $('#stage');
  const bgA = $('#bgA'), bgB = $('#bgB');
  const cgLayer = $('#cgLayer'), cgImg = $('#cgImg');
  const charL = $('#charL'), charR = $('#charR');
  const dialogue = $('#dialogue');
  const namePlate = $('#namePlate'), nameText = $('#nameText');
  const textBody = $('#textBody'), nextDot = $('#nextDot');
  const choicesEl = $('#choices');
  const fadeLayer = $('#fadeLayer');
  const chapterCard = $('#chapterCard');
  const titleScreen = $('#titleScreen');
  const endingScreen = $('#endingScreen');
  const panelLog = $('#panelLog'), panelCfg = $('#panelCfg');
  const logBody = $('#logBody');

  const S = { scene: '', idx: 0 };
  const FLAGS = {};
  const HIST = [];
  let blocked = null;          // {type:'line'|'choice'|'chapter'|'ending'|'wait'}
  let typing = null;
  let waitTimer = 0;
  let uiBeforeChoice = 'box';
  let bgFront = 'A';
  let bgInit = false;

  const SET = Object.assign({}, DEFAULT_SET,
    safeParse(lsGet(GAME.key + '.set')) || {});

  function safeParse(s) { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  /* file:// 或隐私模式下 localStorage 可能直接抛 SecurityError，不能让它带崩整个脚本 */
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }

  /* ---------------- 舞台缩放 ---------------- */
  function fit() {
    const s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    stage.style.transform = `translate(-50%,-50%) scale(${s})`;
    document.body.classList.toggle('compact', window.innerWidth < 900);
  }
  window.addEventListener('resize', fit);
  fit();

  /* ---------------- 基础操作 ---------------- */
  function ui(v) {
    if (!v) v = 'box';
    if (v === 'split' && window.innerWidth < 900) v = 'box'; // 窄屏降级
    if (stage.dataset.ui === v) return;
    stage.classList.add('ui-switching');
    setTimeout(() => { stage.dataset.ui = v; }, 120);
    setTimeout(() => { stage.classList.remove('ui-switching'); }, 150);
  }

  function setBg(name, instant) {
    if (!name) return;
    const cur = bgFront === 'A' ? bgA : bgB;
    const nxt = bgFront === 'A' ? bgB : bgA;
    nxt.src = 'assets/bg/' + name + '.jpg';
    nxt.classList.add('on');
    if (!bgInit || instant) {
      cur.classList.remove('on');
      bgInit = true;
    } else {
      setTimeout(() => cur.classList.remove('on'), 40);
    }
    bgFront = bgFront === 'A' ? 'B' : 'A';
  }

  function showCg(name) {
    if (!name) return;
    cgImg.src = 'assets/cg/' + name + '.jpg';
    cgLayer.classList.add('on');
  }
  function hideCg() { cgLayer.classList.remove('on'); }

  function showChar(st) {
    const pos = st.pos === 'r' ? 'r' : 'l';
    const slot = pos === 'r' ? charR : charL;
    const img = slot.querySelector('img');
    if (st.duo) {
      charL.classList.remove('solo');
      charR.classList.remove('solo');
    }
    img.src = 'assets/char/' + st.who + '.png';
    slot.classList.remove('off');
    slot.classList.add('on');
    slot.classList.toggle('solo', !st.duo);
    if (!st.duo) {
      const other = pos === 'r' ? charL : charR;
      other.classList.remove('on');
      other.classList.add('off');
    }
  }
  function hideChar(who) {
    if (who === 'all' || !who) {
      [charL, charR].forEach(el => {
        el.classList.remove('on'); el.classList.add('off');
      });
    } else {
      [charL, charR].forEach(el => {
        const img = el.querySelector('img');
        if (img && img.getAttribute('src') && img.getAttribute('src').indexOf(who) > -1) {
          el.classList.remove('on'); el.classList.add('off');
        }
      });
    }
  }

  function fade(on) { fadeLayer.classList.toggle('on', !!on); }

  /* ---------------- 台词 ---------------- */
  function showLine(st, index) {
    const ch = st.c ? CHARS[st.c] : null;
    const nm = ch ? ch.name : '';
    nameText.textContent = nm;
    namePlate.classList.toggle('empty', !nm);
    if (ch) nameText.style.color = ch.color || '';

    /* 云端巡检发现：旁白也必须进记录，否则开场全是 narr 时面板为空 */
    HIST.push({ name: nm, text: st.x || '' });
    if (HIST.length > 240) HIST.shift();

    const full = st.x || '';
    renderText(full, SET.speed);

    const vid = S.scene + '_' + index;
    if (typeof VOICE !== 'undefined') {
      VOICE.stop();
      if (st.vo) VOICE.play(vid);
    }
    saveGame();
    blocked = { type: 'line', st: st };
  }

  function renderText(full, speed) {
    clearInterval(typing);
    typing = null;
    textBody.textContent = '';
    nextDot.classList.remove('on');
    if (!full) { nextDot.classList.add('on'); return; }
    if (speed >= 99) { textBody.textContent = full; nextDot.classList.add('on'); return; }
    const step = Math.max(1, Math.round(speed));
    const delay = speed >= 4 ? 9 : (speed >= 2 ? 18 : 34);
    let i = 0;
    typing = { full, timer: setInterval(() => {
      i += step;
      textBody.textContent = full.slice(0, i);
      if (i >= full.length) {
        clearInterval(typing.timer);
        typing = null;
        textBody.textContent = full;
        nextDot.classList.add('on');
      }
    }, delay) };
  }

  function finishTyping() {
    if (!typing) return false;
    clearInterval(typing.timer);
    textBody.textContent = typing.full;
    typing = null;
    nextDot.classList.add('on');
    return true;
  }

  /* ---------------- 选择支 ---------------- */
  function showChoice(st) {
    uiBeforeChoice = stage.dataset.ui === 'choice' ? 'box' : stage.dataset.ui;
    ui('choice');
    stage.classList.add('dim-bg');
    choicesEl.innerHTML = '';
    (st.opts || []).forEach((o, k) => {
      const b = document.createElement('button');
      b.className = 'choice';
      b.type = 'button';
      b.dataset.idx = '0' + (k + 1);
      b.innerHTML = '<span class="main"></span>' + (o.sub ? '<span class="sub"></span>' : '');
      b.querySelector('.main').textContent = o.x || '';
      if (o.sub) b.querySelector('.sub').textContent = o.sub;
      b.addEventListener('click', (ev) => { ev.stopPropagation(); pick(o); });
      choicesEl.appendChild(b);
    });
    choicesEl.classList.add('on');
    saveGame();
    blocked = { type: 'choice' };
  }

  function pick(o) {
    if (!blocked || blocked.type !== 'choice') return;
    choicesEl.classList.remove('on');
    choicesEl.innerHTML = '';
    stage.classList.remove('dim-bg');
    ui(uiBeforeChoice || 'box');
    if (o.set) Object.assign(FLAGS, o.set);
    if (o.flag) FLAGS[o.flag] = true;
    if (typeof VOICE !== 'undefined') VOICE.stop();
    blocked = null;
    if (o.go) goto(o.go);
  }

  /* ---------------- 章节卡 ---------------- */
  function showChapter(st) {
    $('#chNo').textContent = st.no || '';
    $('#chTitle').textContent = st.title || '';
    $('#chSub').textContent = st.sub || '';
    chapterCard.classList.add('on');
    blocked = { type: 'chapter' };
  }

  /* ---------------- 结局 ---------------- */
  function showEnding(st) {
    const e = GAME.endings[st.v] || { no: 'END', title: st.v, text: '' };
    $('#endNo').textContent = e.no;
    $('#endTitle').textContent = e.title;
    $('#endText').textContent = e.text;
    endingScreen.classList.add('on');
    blocked = { type: 'ending' };

    const arr = safeParse(lsGet(GAME.key + '.endings')) || [];
    if (!arr.includes(st.v)) { arr.push(st.v); store(GAME.key + '.endings', arr); }
    refreshEndings();

    if (typeof BGM !== 'undefined') BGM.stop(1400);
    if (typeof ENV !== 'undefined') ENV.stop(1600);
  }

  function refreshEndings() {
    const arr = safeParse(lsGet(GAME.key + '.endings')) || [];
    $('#endingsCount').textContent = '结局 ' + arr.length + ' / 3';
    const box = $('#cfgEndings');
    if (box) {
      box.textContent = arr.length
        ? '已收集：' + arr.map(k => (GAME.endings[k] ? GAME.endings[k].title : k)).join(' · ')
        : '还没有走到任何结局。';
    }
  }

  /* ---------------- 存档 ---------------- */
  function saveGame() {
    if (!S.scene) return;
    store(GAME.key + '.save', { scene: S.scene, idx: S.idx, flags: FLAGS, at: Date.now() });
    const btn = $('#btnContinue');
    if (btn) btn.disabled = false;
  }

  function loadGame() {
    const s = safeParse(lsGet(GAME.key + '.save'));
    if (!s || !s.scene || !SCENES[s.scene]) return null;
    return s;
  }

  /* ---------------- 主循环 ---------------- */
  function goto(scene) {
    if (!SCENES[scene]) {
      console.warn('[engine] 没有场景:', scene);
      return;
    }
    S.scene = scene;
    S.idx = 0;
    blocked = null;
    hidePanels();
    run();
  }

  /* 非阻塞 step 的统一执行（run 与读档回放共用） */
  function applyOne(st) {
    switch (st.t) {
      case 'bg': setBg(st.v, !!st.instant); break;
      case 'cg': showCg(st.v); break;
      case 'cgOff': hideCg(); break;
      case 'char': showChar(st); break;
      case 'charOff': hideChar(st.who); break;
      case 'bgm':
        if (typeof BGM !== 'undefined') BGM.play(st.v, st.fade || 1600);
        break;
      case 'bgmStop':
        if (typeof BGM !== 'undefined') BGM.stop(st.fade || 1200);
        break;
      case 'env':
        if (typeof ENV !== 'undefined') ENV.play(st.v, st.lv);
        break;
      case 'ui': ui(st.v); break;
      case 'theme': stage.dataset.theme = st.v || 'ch1'; break;
      case 'fade': fade(st.v !== 'off'); break;
      case 'flag': FLAGS[st.k] = st.v === undefined ? true : st.v; break;
      default: console.warn('[engine] 未知 step:', st.t);
    }
  }

  function run() {
    let guard = 0;
    while (guard++ < 5000) {
      const steps = SCENES[S.scene];
      if (!steps) { console.warn('[engine] 场景为空:', S.scene); return; }
      if (S.idx >= steps.length) { console.warn('[engine] 场景结束但没有 jump/ending:', S.scene); return; }
      const st = steps[S.idx];
      const i = S.idx;

      if (st.t === 'jump') {
        if (st.v && SCENES[st.v]) { S.scene = st.v; S.idx = 0; continue; }
        console.warn('[engine] jump 目标不存在:', st.v); return;
      }

      switch (st.t) {
        case 'line':
        case 'narr': {
          if (st.t === 'narr') st.c = '';
          showLine(st, i);
          return;
        }
        case 'choice':
          showChoice(st);
          return;
        case 'chapter':
          showChapter(st);
          return;
        case 'ending':
          showEnding(st);
          return;
        case 'wait': {
          const ms = st.ms || 600;
          blocked = { type: 'wait' };
          clearTimeout(waitTimer);
          waitTimer = setTimeout(() => {
            if (blocked && blocked.type === 'wait') {
              blocked = null; S.idx++; run();
            }
          }, ms);
          return;
        }
        default:
          applyOne(st);
      }
      S.idx++;
    }
    console.warn('[engine] 单帧步进过多，可能死循环');
  }

  /* 读档：把目标句之前的所有非阻塞 step 重放一遍，恢复背景/立绘/BGM */
  function replayTo(scene, targetIdx) {
    S.scene = scene; S.idx = 0;
    const steps = SCENES[scene] || [];
    for (let i = 0; i < targetIdx && i < steps.length; i++) {
      const st = steps[i];
      if (st.t === 'line' || st.t === 'narr' || st.t === 'choice' ||
          st.t === 'chapter' || st.t === 'wait' || st.t === 'ending' || st.t === 'jump') {
        S.idx = i + 1;
        continue;
      }
      applyOne(st);
      S.idx = i + 1;
    }
    run();
  }

  function advance() {
    if (!blocked) return;
    if (blocked.type === 'line') {
      if (finishTyping()) return;
      if (typeof VOICE !== 'undefined') VOICE.stop();
      blocked = null;
      S.idx++;
      run();
    } else if (blocked.type === 'chapter') {
      chapterCard.classList.remove('on');
      blocked = null;
      S.idx++;
      setTimeout(run, 240);
    } else if (blocked.type === 'wait') {
      clearTimeout(waitTimer);
      blocked = null; S.idx++; run();
    }
  }

  /* ---------------- 输入 ---------------- */
  stage.addEventListener('click', (e) => {
    if (e.target.closest('.overlay.on')) return;
    if (e.target.closest('.panel.on')) return;
    if (e.target.closest('button, input, select, label')) return;
    advance();
  });

  chapterCard.addEventListener('click', () => {
    if (blocked && blocked.type === 'chapter') advance();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (panelCfg.classList.contains('on')) { closePanel(panelCfg); return; }
      if (panelLog.classList.contains('on')) { closePanel(panelLog); return; }
      if (titleScreen.classList.contains('on')) return;
      openPanel(panelCfg);
      return;
    }
    if (panelCfg.classList.contains('on') || panelLog.classList.contains('on')) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); advance(); }
  });

  /* ---------------- 面板 ---------------- */
  function openPanel(p) {
    p.classList.add('on');
    if (p === panelLog) renderLog();
  }
  function closePanel(p) { p.classList.remove('on'); }
  function hidePanels() { [panelLog, panelCfg].forEach(p => p.classList.remove('on')); }

  function renderLog() {
    logBody.innerHTML = '';
    HIST.slice().reverse().forEach(h => {
      const p = document.createElement('p');
      if (h.name) {
        const w = document.createElement('span');
        w.className = 'who'; w.textContent = h.name;
        p.appendChild(w);
      }
      p.appendChild(document.createTextNode(h.text));
      logBody.appendChild(p);
    });
    if (!HIST.length) logBody.innerHTML = '<p>还没有台词。</p>';
  }

  $('#hud').addEventListener('click', (e) => e.stopPropagation());

  $('#btnLog').addEventListener('click', (e) => { e.stopPropagation(); openPanel(panelLog); });
  $('#btnCfg').addEventListener('click', (e) => { e.stopPropagation(); openPanel(panelCfg); });
  document.querySelectorAll('[data-close]').forEach(b => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const el = document.getElementById(b.dataset.close);
      if (el) closePanel(el);
    });
  });

  /* ---------------- 设置 ---------------- */
  function applySettings() {
    if (typeof BGM !== 'undefined') { BGM.setVolume(SET.bgm / 100); BGM.setEnabled(true); }
    if (typeof VOICE !== 'undefined') {
      VOICE.setEnabled(SET.voiceOn !== false);
      VOICE.setVolume(SET.voice / 100);
    }
    $('#cfgBgm').value = SET.bgm;
    $('#valBgm').textContent = SET.bgm;
    $('#cfgVoice').value = SET.voice;
    $('#valVoice').textContent = SET.voice;
    $('#cfgVoiceOn').checked = SET.voiceOn !== false;
    $('#cfgSpeed').value = String(SET.speed);

    const n = (typeof VOICE !== 'undefined') ? VOICE.count : 0;
    $('#cfgVoiceNote').textContent = n
      ? `已生成 ${n} 句日语配音。`
      : '尚未生成配音：先 node scripts/extract_voice_lines.js，再 python scripts/tts_voicevox.py（需本地启动 VOICEVOX）。当前 vo 台词全部静默跳过，不影响流程。';
  }

  function bindSetting(id, prop, cast) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      let v = cast ? cast(el.value) : el.value;
      if (el.type === 'checkbox') v = el.checked;
      SET[prop] = v;
      store(GAME.key + '.set', SET);
      applySettings();
    });
    el.addEventListener('click', (e) => e.stopPropagation());
    el.addEventListener('change', (e) => e.stopPropagation());
  }
  bindSetting('cfgBgm', 'bgm', Number);
  bindSetting('cfgVoice', 'voice', Number);
  bindSetting('cfgVoiceOn', 'voiceOn');
  bindSetting('cfgSpeed', 'speed', Number);

  /* ---------------- 标题 / 开局 ---------------- */
  function showTitle() {
    if (typeof BGM !== 'undefined') BGM.stop(900);
    if (typeof ENV !== 'undefined') ENV.stop(900);
    chapterCard.classList.remove('on');
    endingScreen.classList.remove('on');
    hidePanels();
    fade(false);
    titleScreen.classList.add('on');
    titleScreen.classList.remove('off');
    stage.dataset.ui = 'box';
    stage.dataset.theme = 'ch1';
    refreshEndings();
    const btn = $('#btnContinue');
    btn.disabled = !loadGame();
    blocked = null;
    S.scene = ''; S.idx = 0;
    HIST.length = 0;
  }

  function startNew() {
    Object.keys(FLAGS).forEach(k => delete FLAGS[k]);
    titleScreen.classList.remove('on');
    endingScreen.classList.remove('on');
    hidePanels();
    if (typeof BGM !== 'undefined') BGM.stop(600);
    if (typeof ENV !== 'undefined') ENV.stop(600);
    fade(false);
    cgLayer.classList.remove('on');
    charL.classList.remove('on'); charL.classList.add('off');
    charR.classList.remove('on'); charR.classList.add('off');
    $('#textBody').textContent = '';
    namePlate.classList.add('empty');
    bgInit = false;
    goto(GAME.start || 'c1_room');
  }

  function continueGame() {
    const s = loadGame();
    if (!s) return;
    Object.keys(FLAGS).forEach(k => delete FLAGS[k]);
    Object.assign(FLAGS, s.flags || {});
    titleScreen.classList.remove('on');
    endingScreen.classList.remove('on');
    hidePanels();
    fade(false);
    bgInit = false;
    replayTo(s.scene, s.idx || 0);
  }

  $('#btnStart').addEventListener('click', (e) => { e.stopPropagation(); startNew(); });
  $('#btnContinue').addEventListener('click', (e) => { e.stopPropagation(); continueGame(); });
  $('#btnTitleCfg').addEventListener('click', (e) => { e.stopPropagation(); openPanel(panelCfg); });
  $('#btnBackTitle').addEventListener('click', (e) => { e.stopPropagation(); showTitle(); });
  $('#btnEndBack').addEventListener('click', (e) => { e.stopPropagation(); showTitle(); });
  endingScreen.addEventListener('click', (e) => e.stopPropagation());
  titleScreen.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    e.stopPropagation();
  });

  /* ---------------- 启动 ---------------- */
  applySettings();
  refreshEndings();
  showTitle();

  /* 调试入口：index.html?scene=c2_truth&i=12 直接跳到某场某步（验收用） */
  const q = new URLSearchParams(location.search);
  const qs = q.get('scene');
  if (qs && SCENES[qs]) {
    const qi = Math.max(0, parseInt(q.get('i') || '0', 10) || 0);
    titleScreen.classList.remove('on');
    bgInit = false;
    if (qi) replayTo(qs, qi); else goto(qs);
  }

  const save = loadGame();
  if (save) $('#btnContinue').disabled = false;

  window.__GAME = { S, FLAGS, SET, goto, save: saveGame, advance, ui, setBg };
})();
