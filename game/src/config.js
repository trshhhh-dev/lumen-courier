/** Tunables for Lumen Courier: field, courier, waves, and scoring. */
export const TITLE = 'Lumen Courier';
export const FIELD = { width: 960, height: 540 };

export const COURIER = {
  radius: 14,
  accel: 980,
  maxSpeed: 440,
  drag: 3.2,
  invulnSec: 1.15,
};

export const CORE = {
  radius: 9,
  value: 25,
  comboWindow: 2.4,
};

export const HAZARD = {
  baseSpeed: 90,
  speedPerWave: 14,
  spawnBase: 1.15,
  spawnFloor: 0.42,
};

export const WAVE = {
  coresPerWave: 6,
  coresGrowth: 1,
  clearBonus: 180,
  bossEvery: 5,
};

export const STEP = 1 / 60;

export const COLORS = {
  void: '#05060d',
  nebulaA: '#1a1040',
  nebulaB: '#0b2a3a',
  courier: '#7ef9ff',
  courierGlow: '#3ad0ff',
  core: '#ffe566',
  coreGlow: '#ff9f1c',
  hazard: '#ff4d6d',
  hazardGlow: '#c9184a',
  boss: '#c77dff',
  hud: '#e8f1ff',
  muted: '#8aa0c0',
  accent: '#5efc8d',
  panel: 'rgba(8, 12, 28, 0.78)',
  panelEdge: 'rgba(126, 249, 255, 0.35)',
};
