/* ==========================================================
   audio.js —— 环境音层（海浪 / 蝉鸣 / 雨 / 风）
   与 BGM 分开：环境层提供"空间感"，不参与情绪。
   全部用 WebAudio 合成，不依赖任何音频文件。
   ========================================================== */

const ENV = (() => {
  let ctx = null, master = null, cur = null;
  let type = 'none';
  let ducked = false;
  let baseVol = 0.12;

  const LEVELS = { waves: 0.16, cicada: 0.10, rain: 0.13, wind: 0.09, none: 0 };

  function ensure() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    return true;
  }

  function noiseBuffer(seconds) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b = (b + 0.02 * w) / 1.02;
      d[i] = b * 3.2;
    }
    return buf;
  }

  function build(kind) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(4);
    src.loop = true;
    const gain = ctx.createGain();
    let chain = src;

    if (kind === 'waves') {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 620; lp.Q.value = 0.6;
      const swell = ctx.createGain();
      swell.gain.value = 1;
      const lfo = ctx.createOscillator();
      lfo.type = 'sine'; lfo.frequency.value = 0.11;
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.55;
      lfo.connect(lfoGain); lfoGain.connect(swell.gain);
      lfo.start();
      src.connect(lp); lp.connect(swell); swell.connect(gain);
    } else if (kind === 'cicada') {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 4200; bp.Q.value = 9;
      const amp = ctx.createGain(); amp.gain.value = 0.55;
      const lfo = ctx.createOscillator();
      lfo.type = 'sine'; lfo.frequency.value = 0.7;
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.35;
      lfo.connect(lfoGain); lfoGain.connect(amp.gain);
      lfo.start();
      src.connect(bp); bp.connect(amp); amp.connect(gain);
    } else if (kind === 'rain') {
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 900;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 7000;
      src.connect(hp); hp.connect(lp); lp.connect(gain);
    } else { // wind
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 420;
      const lfo = ctx.createOscillator();
      lfo.type = 'sine'; lfo.frequency.value = 0.06;
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.4;
      lfo.connect(lfoGain); lfoGain.connect(gain.gain);
      lfo.start();
      src.connect(lp); lp.connect(gain);
    }

    gain.gain.value = 0.5;
    gain.connect(master);
    src.start();
    return { src, gain, chain };
  }

  function play(kind, level) {
    kind = kind || 'none';
    baseVol = typeof level === 'number' ? level : (LEVELS[kind] || 0.1);
    if (kind === 'none') { stop(); return; }
    ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (kind === type && cur) { fadeTo(target(), 600); return; }
    type = kind;

    const prev = cur;
    cur = build(kind);
    fadeTo(target(), 900);
    if (prev) {
      try {
        prev.gain.gain.cancelScheduledValues(ctx.currentTime);
        prev.gain.gain.setValueAtTime(prev.gain.gain.value, ctx.currentTime);
        prev.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.9);
        setTimeout(() => { try { prev.src.stop(); } catch (e) { } }, 1200);
      } catch (e) { }
    }
  }

  function target() { return baseVol * (ducked ? 0.28 : 1); }

  function fadeTo(v, ms) {
    if (!master || !ctx) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(v, now + ms / 1000);
  }

  function stop(fade = 800) {
    type = 'none';
    if (cur) {
      const p = cur;
      cur = null;
      try {
        p.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + fade / 1000);
        setTimeout(() => { try { p.src.stop(); } catch (e) { } }, fade + 200);
      } catch (e) { }
    }
  }

  /* void 情绪时整层压到 0.04（世界失声） */
  function duck(on) { ducked = !!on; if (cur) fadeTo(target(), on ? 700 : 900); }
  function setVolume(v) { baseVol = Math.max(0, Math.min(1, v)); if (cur) fadeTo(target(), 300); }

  /* 首次用户手势时由 bgm.js 调用：把被自动播放策略挂起的 AudioContext 拉起来 */
  function unlock() {
    ensure();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else if (type !== 'none') ctx.resume();
  });

  return { play, stop, duck, setVolume, unlock, get type() { return type; } };
})();
