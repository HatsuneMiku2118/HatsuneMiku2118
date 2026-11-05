/* ==========================================================
   bgm.js —— 分层 BGM 管理器（情绪映射 / 交叉淡入 / 配音压低）

   用法：
     BGM.play('warm');      // 切到「温暖」，默认交叉淡入 1.6s
     BGM.play('climax', 600);
     BGM.duck(true);        // 配音开始，压低 BGM
     BGM.duck(false);       // 配音结束，抬回
     BGM.stop();            // 淡出停止
     BGM.setVolume(0.6);    // 0~1

   约定：音频放在 assets/bgm/<情绪>.mp3，情绪词固定为 EMOTIONS 里那几个。
   换曲子只要替换同名文件，剧本一个字都不用改。

   【重要】不要给这些 <audio> 设置 crossOrigin，也不要用
   createMediaElementSource 接 WebAudio：
   在 http 静态服务（无 CORS 头）和 file:// 下，浏览器会把媒体判成
   跨域并输出静音 —— 表现为「配音有声音、BGM 完全没声音」。
   这里全部用 HTMLAudioElement.volume 做淡入淡出，双击 index.html 也能响。
   ========================================================== */

const BGM = (() => {
  const EMOTIONS = ['calm', 'warm', 'unease', 'sorrow', 'tension', 'climax', 'afterglow', 'void'];
  const BASE = 'assets/bgm/';
  const EXT = '.mp3';

  const pool = {};                  // key -> HTMLAudioElement
  let baseVol = 0.55;
  let enabled = true;
  let ducked = false;
  let curKey = '';
  let curEl = null;
  let pending = '';                 // 被自动播放策略拒绝的曲目，等下一次手势补播

  function target() { return baseVol * (ducked ? 0.32 : 1); }

  function elFor(key) {
    if (pool[key]) return pool[key];
    const a = new Audio();
    a.src = BASE + key + EXT;
    a.loop = true;
    a.preload = 'auto';
    a.volume = 0;
    a.addEventListener('error', () => console.warn('[bgm] 载入失败:', a.src));
    pool[key] = a;
    return a;
  }

  /* 音量渐变：逐帧改 volume，避开 WebAudio 的跨域限制 */
  function fadeTo(a, to, ms) {
    if (!a) return;
    if (a._fade) cancelAnimationFrame(a._fade);
    const from = a.volume;
    const t0 = performance.now();
    const dur = Math.max(1, ms);
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      a.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      a._fade = k < 1 ? requestAnimationFrame(tick) : 0;
    };
    a._fade = requestAnimationFrame(tick);
  }

  function tryStart(a, key) {
    if (!a || !a.paused) return;
    try {
      const p = a.play();
      if (p && p.catch) {
        p.catch((err) => {
          // NotAllowedError = 还没拿到用户手势，等 unlock() 重试
          pending = key || '';
          console.warn('[bgm] 播放被浏览器拦下（等首次点击后重试）:', err && err.name);
        });
      }
    } catch (e) {
      console.warn('[bgm] play 异常:', e && e.message);
    }
  }

  function play(key, fade = 1600) {
    if (!key) return;
    if (!enabled) { curKey = key; return; }
    if (key === curKey && curEl) { tryStart(curEl, key); return; }

    const next = elFor(key);
    const prev = curEl;
    curKey = key;
    curEl = next;

    if (next !== prev) {
      try { next.currentTime = 0; } catch (e) { }
      fadeTo(next, target(), fade);
    }
    tryStart(next, key);

    if (prev && prev !== next) {
      fadeTo(prev, 0, fade);
      setTimeout(() => { try { prev.pause(); } catch (e) { } }, fade + 120);
    }
  }

  function stop(fade = 1200) {
    if (!curEl) { curKey = ''; return; }
    const a = curEl;
    fadeTo(a, 0, fade);
    setTimeout(() => { try { a.pause(); } catch (e) { } }, fade + 120);
    curEl = null;
    curKey = '';
    pending = '';
  }

  function duck(on) {
    on = !!on;
    if (ducked === on) return;
    ducked = on;
    if (curEl) fadeTo(curEl, target(), on ? 320 : 620);
  }

  function setVolume(v) {
    baseVol = Math.max(0, Math.min(1, v));
    if (curEl) fadeTo(curEl, target(), 200);
  }

  function setEnabled(on) {
    enabled = !!on;
    if (!enabled) {
      if (curEl) {
        fadeTo(curEl, 0, 300);
        const a = curEl;
        setTimeout(() => { if (!enabled) { try { a.pause(); } catch (e) { } } }, 420);
      }
    } else if (curEl) {
      fadeTo(curEl, target(), 600);
      tryStart(curEl, curKey);
    } else if (curKey) {
      const k = curKey;
      curKey = '';
      play(k, 800);
    }
  }

  /* 首次用户手势：补播被拦下的曲目；AudioContext 类音频也在这里一并解锁 */
  function unlock() {
    if (typeof ENV !== 'undefined' && ENV && ENV.unlock) { try { ENV.unlock(); } catch (e) { } }
    const k = pending || curKey;
    pending = '';
    if (!k || !enabled) return;
    const a = elFor(k);
    curKey = k;
    curEl = a;
    if (a.paused) fadeTo(a, target(), 500);
    tryStart(a, k);
  }

  let unlocked = false;
  function onGesture() {
    if (unlocked) return;
    unlocked = true;
    unlock();
  }
  ['pointerdown', 'keydown', 'touchend'].forEach((ev) => {
    document.addEventListener(ev, onGesture, { capture: true, passive: true });
  });

  /* 切到后台时暂停，回来时继续 —— 手机上很关键 */
  document.addEventListener('visibilitychange', () => {
    if (!curEl) return;
    if (document.hidden) { try { curEl.pause(); } catch (e) { } }
    else if (enabled) tryStart(curEl, curKey);
  });

  return {
    play, stop, duck, setVolume, setEnabled, unlock,
    EMOTIONS,
    get current() { return curKey; },
    get state() { return curEl ? { key: curKey, paused: curEl.paused, time: curEl.currentTime, volume: curEl.volume } : null; }
  };
})();
