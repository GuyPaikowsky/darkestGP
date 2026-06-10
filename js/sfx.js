// ── tiny WebAudio synth: engine drone + UI blips, no assets ──────────────────
let ctx = null, engineGain = null, muted = false;

function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    startEngine();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function startEngine() {
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = 55;
  const sub = ctx.createOscillator();
  sub.type = 'triangle';
  sub.frequency.value = 41;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 6.5;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 4;
  lfo.connect(lfoGain).connect(osc.frequency);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 240;

  engineGain = ctx.createGain();
  engineGain.gain.value = muted ? 0 : 0.05;
  osc.connect(filter); sub.connect(filter);
  filter.connect(engineGain).connect(ctx.destination);
  osc.start(); sub.start(); lfo.start();
}

function blip(freq, dur, type = 'square', vol = 0.08, slideTo = null) {
  if (muted) return;
  const c = ac();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + dur);
}

export function sfx(kind) {
  try {
    ac();
    switch (kind) {
      case 'click':    blip(440, 0.08, 'square', 0.05); break;
      case 'hit':      blip(160, 0.18, 'sawtooth', 0.1, 60); break;
      case 'crit':     blip(90, 0.4, 'sawtooth', 0.16, 30); blip(1200, 0.12, 'square', 0.06); break;
      case 'heal':     blip(520, 0.25, 'sine', 0.07, 880); break;
      case 'meltdown': blip(300, 0.6, 'sawtooth', 0.1, 80); break;
      case 'battle':   blip(110, 0.5, 'sawtooth', 0.1, 220); break;
      case 'win':      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.3, 'triangle', 0.08), i * 130)); break;
      case 'lose':     [330, 290, 240, 180].forEach((f, i) => setTimeout(() => blip(f, 0.45, 'sawtooth', 0.08), i * 220)); break;
      case 'rev':      blip(70, 0.8, 'sawtooth', 0.12, 200); break;
    }
  } catch { /* audio is a luxury, not a right */ }
}

export function toggleMute() {
  muted = !muted;
  if (engineGain) engineGain.gain.value = muted ? 0 : 0.05;
  return muted;
}
