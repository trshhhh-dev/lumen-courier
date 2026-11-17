import { FIELD, STEP, COLORS } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createParticles } from './particles.js';
import { createWorld, EVENT_COLLECT, EVENT_HIT, EVENT_WAVE, EVENT_OVER, EVENT_WIN_WAVE } from './world.js';
import { createRenderer, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSE, SCREEN_OVER } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

const input = createInput(canvas);
const audio = createAudio();
const particles = createParticles();
const renderer = createRenderer(canvas);

let screen = SCREEN_TITLE;
let world = createWorld(seed);
let best = Number(localStorage.getItem('lumenCourierBest') || '0') || 0;
let time = 0;
let pauseLatch = false;

function setStatus(text) {
  if (status) status.textContent = text;
}

function startRun() {
  audio.unlock();
  audio.start();
  world = createWorld((Date.now() ^ (seed * 997)) >>> 0);
  particles.clear();
  screen = SCREEN_PLAY;
  setStatus('Sector underway. Collect aurora cores.');
}

function endRun() {
  screen = SCREEN_OVER;
  if (world.state.score > best) {
    best = world.state.score;
    try { localStorage.setItem('lumenCourierBest', String(best)); } catch (_) {}
  }
  audio.boom();
  setStatus(`Signal lost. Score ${world.state.score}.`);
}

function frame(dt) {
  time += dt;
  if (shotName) return;

  if (input.consumeMute()) {
    const muted = audio.toggleMute();
    setStatus(muted ? 'Audio muted' : 'Audio on');
  }

  if (screen === SCREEN_TITLE) {
    if (input.consumeStart()) startRun();
    return;
  }

  if (screen === SCREEN_OVER) {
    if (input.consumeRestart() || input.consumeStart()) startRun();
    return;
  }

  const pauseDown = input.wantsPause();
  if (pauseDown && !pauseLatch) {
    screen = screen === SCREEN_PAUSE ? SCREEN_PLAY : SCREEN_PAUSE;
    setStatus(screen === SCREEN_PAUSE ? 'Paused' : 'Resumed');
  }
  pauseLatch = pauseDown;

  if (screen === SCREEN_PAUSE) return;

  const axis = input.axis();
  const pointerAim = input.pointer.down || input.pointer.inside ? { x: input.pointer.x, y: input.pointer.y } : null;
  // Scale pointer from canvas CSS pixels already handled in input via canvas.width mapping.
  // But canvas.width is DPR-scaled; input uses canvas.width which is backing store.
  // Convert to field space:
  let aim = null;
  if (pointerAim) {
    aim = {
      x: pointerAim.x * (FIELD.width / canvas.width),
      y: pointerAim.y * (FIELD.height / canvas.height),
    };
  }

  const events = world.step(dt, axis.x, axis.y, aim, false);
  particles.update(dt);
  particles.trail(world.state.courier.x, world.state.courier.y, COLORS.courierGlow);

  if (events & EVENT_COLLECT) {
    audio.collect();
    const c = world.state.courier;
    particles.burst(c.x, c.y, COLORS.core, 14, 180);
  }
  if (events & EVENT_HIT) {
    audio.hit();
    particles.burst(world.state.courier.x, world.state.courier.y, COLORS.hazard, 20, 220);
  }
  if (events & EVENT_WAVE) {
    audio.wave();
    setStatus(`Sector ${world.state.wave}`);
  }
  if (events & EVENT_WIN_WAVE) {
    // wave sound already fired
  }
  if (events & EVENT_OVER) endRun();
}

function draw() {
  renderer.draw(world.state, screen, particles, time, best);
}

if (shotName) {
  const staged = stageShot(shotName, seed);
  world = staged.world;
  screen = staged.screen;
  best = staged.best;
  particles.clear();
  // Simulate a bit of trail for play/end frames
  if (screen === SCREEN_PLAY) {
    for (let i = 0; i < 12; i += 1) {
      particles.trail(world.state.courier.x - i * 3, world.state.courier.y + i, COLORS.courierGlow);
      particles.update(1 / 60);
    }
  }
  draw();
  document.title = `Lumen Courier — ${shotName}`;
  setStatus(`Shot ${shotName}`);
} else {
  let last = performance.now();
  function loop(now) {
    const raw = Math.min(0.05, (now - last) / 1000);
    last = now;
    // fixed-ish step accumulation
    let acc = raw;
    while (acc > 0) {
      const dt = Math.min(STEP, acc);
      frame(dt);
      acc -= dt;
    }
    draw();
    requestAnimationFrame(loop);
  }
  setStatus('Lumen Courier ready. Press Space to launch.');
  requestAnimationFrame(loop);
}
