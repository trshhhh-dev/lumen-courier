/** Procedural Web Audio synth — no asset files. */
export function createAudio() {
  let ctx = null;
  let muted = false;
  let master = null;

  function ensure() {
    if (muted) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.22;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function beep(freq, duration, type, gainValue) {
    const audio = ensure();
    if (!audio || !master) return;
    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  return {
    unlock() { ensure(); },
    toggleMute() {
      muted = !muted;
      if (muted && ctx) ctx.suspend();
      else if (!muted) ensure();
      return muted;
    },
    isMuted() { return muted; },
    collect() { beep(740, 0.12, 'triangle', 0.35); beep(1180, 0.16, 'sine', 0.22); },
    hit() { beep(120, 0.28, 'sawtooth', 0.4); },
    wave() { beep(420, 0.18, 'square', 0.18); beep(630, 0.22, 'triangle', 0.16); },
    boom() { beep(80, 0.45, 'sawtooth', 0.45); },
    start() { beep(520, 0.1, 'sine', 0.2); beep(780, 0.14, 'triangle', 0.18); },
    win() {
      beep(523, 0.12, 'sine', 0.2);
      setTimeout(() => beep(659, 0.12, 'sine', 0.2), 90);
      setTimeout(() => beep(784, 0.22, 'triangle', 0.24), 180);
    },
  };
}
