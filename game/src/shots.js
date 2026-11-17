/** Deterministic screenshot scenes for ?shot=start|play|end. */
import { STEP, FIELD } from './config.js';
import { EVENT_OVER, createWorld } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 2;
const PLAY_SECONDS = 18;
const END_LIMIT_SECONDS = 90;

function autopilot(state) {
  const c = state.courier;
  let tx = FIELD.width * 0.5;
  let ty = FIELD.height * 0.5;
  let best = Infinity;
  for (let i = 0; i < state.cores.length; i += 1) {
    const core = state.cores[i];
    if (!core.alive) continue;
    const d = (core.x - c.x) ** 2 + (core.y - c.y) ** 2;
    if (d < best) {
      best = d;
      tx = core.x;
      ty = core.y;
    }
  }
  // Steer away from nearest hazard when close.
  for (let i = 0; i < state.hazards.length; i += 1) {
    const h = state.hazards[i];
    if (!h.alive) continue;
    const dx = c.x - h.x;
    const dy = c.y - h.y;
    const d = Math.hypot(dx, dy);
    if (d < 110) {
      tx = c.x + (dx / (d || 1)) * 200;
      ty = c.y + (dy / (d || 1)) * 200;
      break;
    }
  }
  const dx = tx - c.x;
  const dy = ty - c.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

/**
 * Advance a fresh world into the named scene and return screen + best score to show.
 */
export function stageShot(name, seed) {
  const world = createWorld(seed || 1);
  if (name !== 'play' && name !== 'end') {
    for (let i = 0; i < START_SECONDS / STEP; i += 1) {
      world.step(STEP, 0, 0, null, true);
    }
    return { world, screen: SCREEN_TITLE, best: 0 };
  }
  const limit = name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  let over = false;
  for (let i = 0; i < limit / STEP; i += 1) {
    const stick = autopilot(world.state);
    // End scene: occasionally fly poorly so lives drain.
    const ax = name === 'end' && i % 40 < 10 ? -stick.x : stick.x;
    const ay = name === 'end' && i % 40 < 10 ? -stick.y : stick.y;
    const events = world.step(STEP, ax, ay, null, false);
    if (events & EVENT_OVER) {
      over = true;
      break;
    }
  }
  if (name === 'end' && !over) {
    world.state.lives = 0;
    over = true;
  }
  return {
    world,
    screen: over ? SCREEN_OVER : SCREEN_PLAY,
    best: world.state.score,
  };
}
