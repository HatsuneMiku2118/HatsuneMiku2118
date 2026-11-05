/* ==========================================================
   voice.js —— 日语配音播放器（与台词同步 / 自动压低 BGM / 可关闭）

   用法：
     VOICE.play('ch1_023');   // 播放 assets/voice/ch1_023.wav
     VOICE.stop();            // 推进到下一句时调，掐断上一句
     VOICE.setEnabled(false)  // 设置里的「语音」开关

   清单：
     scripts/tts_voicevox.py 会生成 assets/voice/manifest.js，
     内容是 window.VOICE_FILES = ["ch1_023", ...]。
     有清单时，缺失的 id 会被静默跳过，不会满屏 404。
   ========================================================== */

const VOICE = (() => {
  const BASE = 'assets/voice/';
  const EXT = '.wav';

  /* 注意：bgm.js 里的 BGM 是 const 声明，不能用 window.BGM 取到，必须走同一个全局词法作用域 */
  function duckBGM(on) {
    try { if (typeof BGM !== 'undefined' && BGM) BGM.duck(on); } catch (e) { }
  }

  let el = null;
  let enabled = true;
  let volume = 0.95;
  /* 有 manifest（哪怕是空数组）就以它为准；连 manifest 都没有才"不做判断"。
     空数组 = 还没跑 tts，全部跳过，不会满屏 404。 */
  const listed = Array.isArray(window.VOICE_FILES) ? window.VOICE_FILES : null;
  const have = new Set(listed || []);

  function ensureEl() {
    if (el) return el;
    el = new Audio();
    el.preload = 'auto';
    el.addEventListener('playing', () => duckBGM(true));
    el.addEventListener('ended', () => duckBGM(false));
    el.addEventListener('error', () => duckBGM(false));
    return el;
  }

  function exists(id) {
    return listed ? have.has(id) : true; // 没有清单时不做存在性判断
  }

  function play(id) {
    if (!enabled || !id) return;
    if (!exists(id)) return;
    const a = ensureEl();
    try {
      a.pause();
      a.src = BASE + id + EXT;
      a.volume = volume;
      const p = a.play();
      if (p && p.catch) p.catch(() => duckBGM(false));
    } catch (e) { }
  }

  function stop() {
    if (!el) return;
    try { el.pause(); } catch (e) { }
    duckBGM(false);
  }

  function setEnabled(on) {
    enabled = !!on;
    if (!enabled) stop();
  }

  function setVolume(v) { volume = Math.max(0, Math.min(1, v)); if (el) el.volume = volume; }

  /* 切到后台时掐断，回来不重播（台词已经过去了） */
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });

  return {
    play, stop, setEnabled, setVolume,
    get enabled() { return enabled; },
    get count() { return have.size; }
  };
})();
