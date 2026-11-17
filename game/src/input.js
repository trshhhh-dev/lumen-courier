/** Keyboard + mouse / pointer input for the courier. */
export function createInput(canvas) {
  const keys = new Set();
  const pointer = { x: 0, y: 0, down: false, inside: false };
  let startPressed = false;
  let restartPressed = false;
  let mutePressed = false;

  function mapKey(code) {
    if (code === 'ArrowLeft' || code === 'KeyA') return 'left';
    if (code === 'ArrowRight' || code === 'KeyD') return 'right';
    if (code === 'ArrowUp' || code === 'KeyW') return 'up';
    if (code === 'ArrowDown' || code === 'KeyS') return 'down';
    if (code === 'Space' || code === 'Enter') return 'action';
    if (code === 'KeyR') return 'restart';
    if (code === 'KeyM') return 'mute';
    if (code === 'Escape' || code === 'KeyP') return 'pause';
    return null;
  }

  window.addEventListener('keydown', (event) => {
    const name = mapKey(event.code);
    if (!name) return;
    event.preventDefault();
    if (!keys.has(name)) {
      if (name === 'action') startPressed = true;
      if (name === 'restart') restartPressed = true;
      if (name === 'mute') mutePressed = true;
    }
    keys.add(name);
  });

  window.addEventListener('keyup', (event) => {
    const name = mapKey(event.code);
    if (name) keys.delete(name);
  });

  function syncPointer(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    pointer.x = (event.clientX - rect.left) * scaleX;
    pointer.y = (event.clientY - rect.top) * scaleY;
    pointer.inside = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= canvas.width && pointer.y <= canvas.height;
  }

  canvas.addEventListener('pointermove', syncPointer);
  canvas.addEventListener('pointerdown', (event) => {
    syncPointer(event);
    pointer.down = true;
    startPressed = true;
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener('pointerup', () => { pointer.down = false; });
  canvas.addEventListener('pointercancel', () => { pointer.down = false; });

  return {
    keys,
    pointer,
    consumeStart() {
      const value = startPressed;
      startPressed = false;
      return value;
    },
    consumeRestart() {
      const value = restartPressed;
      restartPressed = false;
      return value;
    },
    consumeMute() {
      const value = mutePressed;
      mutePressed = false;
      return value;
    },
    axis() {
      let x = 0;
      let y = 0;
      if (keys.has('left')) x -= 1;
      if (keys.has('right')) x += 1;
      if (keys.has('up')) y -= 1;
      if (keys.has('down')) y += 1;
      return { x, y };
    },
    wantsPause() {
      return keys.has('pause');
    },
  };
}
