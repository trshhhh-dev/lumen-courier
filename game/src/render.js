import { FIELD, COLORS, COURIER } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSE = 'pause';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let stars = null;

  function ensureStars() {
    if (stars) return;
    stars = [];
    for (let i = 0; i < 90; i += 1) {
      stars.push({
        x: Math.random() * FIELD.width,
        y: Math.random() * FIELD.height,
        z: 0.3 + Math.random() * 1.2,
        tw: Math.random() * Math.PI * 2,
      });
    }
  }

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = FIELD.width * dpr;
    canvas.height = FIELD.height * dpr;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawBackground(time) {
    ensureStars();
    const g = ctx.createLinearGradient(0, 0, FIELD.width, FIELD.height);
    g.addColorStop(0, COLORS.nebulaA);
    g.addColorStop(0.55, COLORS.void);
    g.addColorStop(1, COLORS.nebulaB);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    for (let i = 0; i < stars.length; i += 1) {
      const s = stars[i];
      const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 2 + s.tw));
      ctx.globalAlpha = a;
      ctx.fillStyle = '#dbe7ff';
      ctx.fillRect(s.x, s.y, s.z, s.z);
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = 'rgba(126,249,255,0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < FIELD.width; x += 48) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, FIELD.height); ctx.stroke();
    }
    for (let y = 0; y < FIELD.height; y += 48) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(FIELD.width, y); ctx.stroke();
    }
  }

  function drawCourier(courier, time) {
    const blink = courier.invuln > 0 && Math.floor(time * 20) % 2 === 0;
    if (blink) return;
    const angle = Math.atan2(courier.vy, courier.vx || 0.001);
    ctx.save();
    ctx.translate(courier.x, courier.y);
    ctx.rotate(angle);
    ctx.shadowColor = COLORS.courierGlow;
    ctx.shadowBlur = 18;
    ctx.fillStyle = COLORS.courier;
    ctx.beginPath();
    ctx.moveTo(COURIER.radius + 4, 0);
    ctx.lineTo(-COURIER.radius * 0.85, COURIER.radius * 0.75);
    ctx.lineTo(-COURIER.radius * 0.45, 0);
    ctx.lineTo(-COURIER.radius * 0.85, -COURIER.radius * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(2, 0, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawCore(core) {
    const pulse = 1 + 0.12 * Math.sin(core.pulse);
    ctx.save();
    ctx.translate(core.x, core.y);
    ctx.shadowColor = COLORS.coreGlow;
    ctx.shadowBlur = 16;
    ctx.fillStyle = COLORS.core;
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI / 3) * i + core.pulse * 0.2;
      const r = core.r * pulse * (i % 2 === 0 ? 1 : 0.62);
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawHazard(h) {
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.spin);
    ctx.shadowColor = h.boss ? COLORS.boss : COLORS.hazardGlow;
    ctx.shadowBlur = h.boss ? 22 : 12;
    ctx.fillStyle = h.boss ? COLORS.boss : COLORS.hazard;
    ctx.beginPath();
    const spikes = h.boss ? 8 : 5;
    for (let i = 0; i < spikes * 2; i += 1) {
      const a = (Math.PI / spikes) * i;
      const r = i % 2 === 0 ? h.r : h.r * 0.45;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawHud(state) {
    ctx.fillStyle = COLORS.hud;
    ctx.font = '600 18px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE ${state.score}`, 24, 32);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '500 14px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(`SECTOR ${state.wave}`, 24, 54);
    ctx.fillText('LUMEN COURIER', 24, 94);
    ctx.fillText(`COMBO x${Math.max(1, state.combo)}`, 24, 74);

    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.hud;
    ctx.font = '600 18px ui-sans-serif, system-ui, sans-serif';
    let hearts = '';
    for (let i = 0; i < state.lives; i += 1) hearts += '◆ ';
    ctx.fillStyle = COLORS.accent;
    ctx.fillText(hearts.trim(), FIELD.width - 24, 32);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '500 14px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(`CORES ${state.coresLeft}`, FIELD.width - 24, 54);

    if (state.messageTimer > 0 && state.message) {
      ctx.textAlign = 'center';
      ctx.fillStyle = COLORS.panel;
      roundRect(ctx, FIELD.width * 0.5 - 160, 88, 320, 40, 10);
      ctx.fill();
      ctx.strokeStyle = COLORS.panelEdge;
      ctx.stroke();
      ctx.fillStyle = COLORS.courier;
      ctx.font = '600 16px ui-sans-serif, system-ui, sans-serif';
      ctx.fillText(state.message, FIELD.width * 0.5, 114);
    }
  }

  function drawPanel(title, lines, footer) {
    const w = 460;
    const h = 310;
    const x = (FIELD.width - w) / 2;
    const y = (FIELD.height - h) / 2;
    ctx.fillStyle = COLORS.panel;
    roundRect(ctx, x, y, w, h, 16);
    ctx.fill();
    ctx.strokeStyle = COLORS.panelEdge;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.courier;
    ctx.font = '700 34px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(title, FIELD.width / 2, y + 58);
    ctx.fillStyle = COLORS.hud;
    ctx.font = '500 16px ui-sans-serif, system-ui, sans-serif';
    for (let i = 0; i < lines.length; i += 1) {
      ctx.fillText(lines[i], FIELD.width / 2, y + 108 + i * 28);
    }
    ctx.fillStyle = COLORS.accent;
    ctx.font = '600 15px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(footer, FIELD.width / 2, y + h - 36);
  }

  function draw(state, screen, particles, time, best) {
    const shakeX = state.shake > 0 ? (Math.random() - 0.5) * 10 * state.shake : 0;
    const shakeY = state.shake > 0 ? (Math.random() - 0.5) * 10 * state.shake : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawBackground(time);
    for (let i = 0; i < state.cores.length; i += 1) {
      if (state.cores[i].alive) drawCore(state.cores[i]);
    }
    for (let i = 0; i < state.hazards.length; i += 1) {
      if (state.hazards[i].alive) drawHazard(state.hazards[i]);
    }
    particles.draw(ctx);
    drawCourier(state.courier, time);
    ctx.restore();

    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSE) drawHud(state);

    if (screen === SCREEN_TITLE) {
      drawPanel(
        'LUMEN COURIER',
        [
          'Pilot the prism courier through the rift.',
          'Scoop aurora cores. Dodge storm shards.',
          'Clear sectors, chain combos, survive the Warden.',
          'Move: WASD / Arrows · Aim boost: mouse',
        ],
        'Press Space / Click to launch · M mute',
      );
    } else if (screen === SCREEN_PAUSE) {
      drawPanel('PAUSED', ['Rift held in stasis.', 'Tune your heading.'], 'Press P / Esc to resume');
    } else if (screen === SCREEN_OVER) {
      drawPanel(
        'SIGNAL LOST',
        [
          `Final score  ${state.score}`,
          `Sectors cleared  ${Math.max(0, state.wave - 1)}`,
          `Best combo  x${state.bestCombo}`,
          best > 0 ? `Run best  ${best}` : 'Deliver more cores next run.',
        ],
        'Press R or Space to relaunch',
      );
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw, resize, ctx, canvas };
}
