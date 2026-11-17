import { FIELD, COURIER, CORE, HAZARD, WAVE, STEP } from './config.js';
import { createRng } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_COLLECT = 1;
export const EVENT_HIT = 2;
export const EVENT_WAVE = 4;
export const EVENT_OVER = 8;
export const EVENT_WIN_WAVE = 16;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function dist2(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function createWorld(seed = 1) {
  const rng = createRng(seed);
  const state = {
    courier: { x: FIELD.width * 0.5, y: FIELD.height * 0.72, vx: 0, vy: 0, invuln: 0 },
    cores: [],
    hazards: [],
    score: 0,
    bestCombo: 0,
    combo: 0,
    comboTimer: 0,
    lives: 3,
    wave: 1,
    coresLeft: 0,
    spawnTimer: 0,
    elapsed: 0,
    shake: 0,
    message: '',
    messageTimer: 0,
    wonSector: false,
  };

  function placeAwayFromCourier(minDist) {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const x = 40 + rng() * (FIELD.width - 80);
      const y = 40 + rng() * (FIELD.height * 0.55);
      if (dist2(x, y, state.courier.x, state.courier.y) >= minDist * minDist) return { x, y };
    }
    return { x: FIELD.width * 0.5, y: 80 };
  }

  function spawnCore() {
    const p = placeAwayFromCourier(90);
    state.cores.push({ x: p.x, y: p.y, r: CORE.radius, pulse: rng() * Math.PI * 2, alive: true });
  }

  function spawnHazard(boss) {
    const side = rng();
    let x;
    let y;
    let vx;
    let vy;
    const speed = HAZARD.baseSpeed + state.wave * HAZARD.speedPerWave;
    if (side < 0.25) {
      x = -20; y = rng() * FIELD.height; vx = speed * (0.7 + rng() * 0.6); vy = (rng() - 0.5) * speed * 0.4;
    } else if (side < 0.5) {
      x = FIELD.width + 20; y = rng() * FIELD.height; vx = -speed * (0.7 + rng() * 0.6); vy = (rng() - 0.5) * speed * 0.4;
    } else if (side < 0.75) {
      x = rng() * FIELD.width; y = -20; vx = (rng() - 0.5) * speed * 0.4; vy = speed * (0.7 + rng() * 0.6);
    } else {
      x = rng() * FIELD.width; y = FIELD.height + 20; vx = (rng() - 0.5) * speed * 0.4; vy = -speed * (0.7 + rng() * 0.6);
    }
    state.hazards.push({
      x, y, vx, vy,
      r: boss ? 28 : 11 + rng() * 7,
      spin: rng() * Math.PI * 2,
      spinRate: (rng() - 0.5) * 4,
      boss: !!boss,
      hp: boss ? 3 + Math.floor(state.wave / 5) : 1,
      alive: true,
    });
  }

  function beginWave() {
    state.cores.length = 0;
    state.hazards.length = 0;
    state.coresLeft = WAVE.coresPerWave + (state.wave - 1) * WAVE.coresGrowth;
    for (let i = 0; i < state.coresLeft; i += 1) spawnCore();
    state.spawnTimer = 0.4;
    state.wonSector = false;
    state.message = state.wave % WAVE.bossEvery === 0 ? `Rift Warden — Sector ${state.wave}` : `Sector ${state.wave}`;
    state.messageTimer = 1.8;
    if (state.wave % WAVE.bossEvery === 0) spawnHazard(true);
  }

  function reset() {
    state.courier.x = FIELD.width * 0.5;
    state.courier.y = FIELD.height * 0.72;
    state.courier.vx = 0;
    state.courier.vy = 0;
    state.courier.invuln = 0;
    state.score = 0;
    state.bestCombo = 0;
    state.combo = 0;
    state.comboTimer = 0;
    state.lives = 3;
    state.wave = 1;
    state.elapsed = 0;
    state.shake = 0;
    beginWave();
  }

  function steer(ax, ay, pointerAim, dt) {
    const c = state.courier;
    let ix = ax;
    let iy = ay;
    if (pointerAim) {
      const dx = pointerAim.x - c.x;
      const dy = pointerAim.y - c.y;
      const len = Math.hypot(dx, dy) || 1;
      if (len > 8) {
        ix += dx / len;
        iy += dy / len;
      }
    }
    const mag = Math.hypot(ix, iy);
    if (mag > 1) { ix /= mag; iy /= mag; }
    c.vx += ix * COURIER.accel * dt;
    c.vy += iy * COURIER.accel * dt;
    const speed = Math.hypot(c.vx, c.vy);
    if (speed > COURIER.maxSpeed) {
      c.vx = (c.vx / speed) * COURIER.maxSpeed;
      c.vy = (c.vy / speed) * COURIER.maxSpeed;
    }
    const damp = Math.exp(-COURIER.drag * dt);
    c.vx *= damp;
    c.vy *= damp;
    c.x = clamp(c.x + c.vx * dt, COURIER.radius, FIELD.width - COURIER.radius);
    c.y = clamp(c.y + c.vy * dt, COURIER.radius, FIELD.height - COURIER.radius);
  }

  function step(dt, ax, ay, pointerAim, frozen) {
    let events = EVENT_NONE;
    if (frozen) return events;
    state.elapsed += dt;
    if (state.courier.invuln > 0) state.courier.invuln = Math.max(0, state.courier.invuln - dt);
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }
    if (state.messageTimer > 0) state.messageTimer -= dt;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 2.5);

    steer(ax, ay, pointerAim, dt);

    const spawnEvery = Math.max(HAZARD.spawnFloor, HAZARD.spawnBase - state.wave * 0.05);
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnHazard(false);
      state.spawnTimer = spawnEvery;
    }

    for (let i = 0; i < state.hazards.length; i += 1) {
      const h = state.hazards[i];
      if (!h.alive) continue;
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      h.spin += h.spinRate * dt;
      if (h.boss) {
        const dx = state.courier.x - h.x;
        const dy = state.courier.y - h.y;
        const len = Math.hypot(dx, dy) || 1;
        h.vx += (dx / len) * 40 * dt;
        h.vy += (dy / len) * 40 * dt;
        const spd = Math.hypot(h.vx, h.vy);
        const cap = HAZARD.baseSpeed + state.wave * HAZARD.speedPerWave * 0.7;
        if (spd > cap) { h.vx = (h.vx / spd) * cap; h.vy = (h.vy / spd) * cap; }
      }
      if (h.x < -60 || h.x > FIELD.width + 60 || h.y < -60 || h.y > FIELD.height + 60) h.alive = false;
    }

    for (let i = 0; i < state.cores.length; i += 1) {
      const core = state.cores[i];
      if (!core.alive) continue;
      core.pulse += dt * 4;
      if (dist2(core.x, core.y, state.courier.x, state.courier.y) <= (core.r + COURIER.radius) ** 2) {
        core.alive = false;
        state.coresLeft -= 1;
        state.combo += 1;
        state.comboTimer = CORE.comboWindow;
        if (state.combo > state.bestCombo) state.bestCombo = state.combo;
        const gain = CORE.value * Math.min(8, state.combo);
        state.score += gain;
        events |= EVENT_COLLECT;
        if (state.coresLeft <= 0) {
          state.score += WAVE.clearBonus * state.wave;
          state.wave += 1;
          events |= EVENT_WAVE | EVENT_WIN_WAVE;
          beginWave();
        }
      }
    }

    if (state.courier.invuln <= 0) {
      for (let i = 0; i < state.hazards.length; i += 1) {
        const h = state.hazards[i];
        if (!h.alive) continue;
        if (dist2(h.x, h.y, state.courier.x, state.courier.y) <= (h.r + COURIER.radius * 0.85) ** 2) {
          state.lives -= 1;
          state.courier.invuln = COURIER.invulnSec;
          state.combo = 0;
          state.comboTimer = 0;
          state.shake = 0.45;
          events |= EVENT_HIT;
          if (h.boss) {
            h.hp -= 1;
            if (h.hp <= 0) {
              h.alive = false;
              state.score += 400;
            }
          }
          if (state.lives <= 0) events |= EVENT_OVER;
          break;
        }
      }
    }

    return events;
  }

  reset();
  return { state, reset, step, beginWave };
}

export { STEP };
