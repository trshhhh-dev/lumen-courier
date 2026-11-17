/** Lightweight particle bursts for feedback. */
export function createParticles() {
  const list = [];

  function spawn(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const mag = speed * (0.35 + Math.random());
      list.push({
        x, y,
        vx: Math.cos(angle) * mag,
        vy: Math.sin(angle) * mag,
        life: 0.35 + Math.random() * 0.55,
        age: 0,
        color,
        size: 1.5 + Math.random() * 2.5,
      });
    }
  }

  return {
    burst(x, y, color, count = 12, speed = 160) { spawn(x, y, color, count, speed); },
    trail(x, y, color) { spawn(x, y, color, 2, 40); },
    update(dt) {
      for (let i = list.length - 1; i >= 0; i -= 1) {
        const p = list[i];
        p.age += dt;
        if (p.age >= p.life) {
          list.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.96;
        p.vy *= 0.96;
      }
    },
    draw(ctx) {
      for (let i = 0; i < list.length; i += 1) {
        const p = list[i];
        const t = 1 - p.age / p.life;
        ctx.globalAlpha = t;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * t, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    clear() { list.length = 0; },
  };
}
