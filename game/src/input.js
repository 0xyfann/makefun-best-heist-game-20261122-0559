// input.js — one job: keyboard and mouse state, in game coordinates.
// The game reads this object every frame; nothing here knows the rules.
// Mouse position is converted from the canvas box into the 1280x800
// logical view, so clicks land where the player aimed at any window size.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.left = false;
    this.right = false;
    this.up = false;
    this.down = false;
    this.mouseX = 640;
    this.mouseY = 400;
    this.mouseDown = false;
    // Edge-triggered presses: the game consumes each one once.
    this.pressed = new Set();
    this._keys = new Set();

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this._keys.add(e.code);
      this.pressed.add(e.code);
      this._sync();
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this._keys.delete(e.code);
      this._sync();
    });
    canvas.addEventListener('mousemove', (e) => {
      const p = this.toGame(e.clientX, e.clientY);
      this.mouseX = p.x;
      this.mouseY = p.y;
    });
    canvas.addEventListener('mousedown', (e) => {
      this.mouseDown = true;
      const p = this.toGame(e.clientX, e.clientY);
      this.mouseX = p.x;
      this.mouseY = p.y;
    });
    window.addEventListener('mouseup', () => {
      this.mouseDown = false;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _sync() {
    this.left = this._keys.has('KeyA') || this._keys.has('ArrowLeft');
    this.right = this._keys.has('KeyD') || this._keys.has('ArrowRight');
    this.up = this._keys.has('KeyW') || this._keys.has('ArrowUp');
    this.down = this._keys.has('KeyS') || this._keys.has('ArrowDown');
  }

  // Was this code pressed since the last frame? Consumes the press.
  wasPressed(code) {
    if (this.pressed.has(code)) {
      this.pressed.delete(code);
      return true;
    }
    return false;
  }

  // Peek without consuming: for a check that must not steal a press
  // another state wants (pausing versus resuming on the same key).
  hasPressed(code) {
    return this.pressed.has(code);
  }

  // End of frame: drop presses nobody consumed, so a key never fires twice.
  endFrame() {
    this.pressed.clear();
  }

  // Client pixels -> logical 1280x800 view coordinates.
  toGame(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    const scale = Math.min(r.width / 1280, r.height / 800);
    const offX = (r.width - 1280 * scale) / 2;
    const offY = (r.height - 800 * scale) / 2;
    return {
      x: (clientX - r.left - offX) / scale,
      y: (clientY - r.top - offY) / scale,
    };
  }
}
