// player.js — one job: the thief, Wren.
// WASD or arrows to move, with smooth acceleration and wall sliding.
// Three tools, each bought with coins: smoke, camera loop, coin toss.
// The thief picks up coins and loot by walking over them.

import {
  THIEF_RADIUS,
  THIEF_SPEED,
  THIEF_ACCEL,
  THIEF_FRICTION,
  TOOL_SMOKE_COST,
  TOOL_LOOP_COST,
  TOOL_COIN_COST,
  SMOKE_RADIUS,
  SMOKE_TIME,
  LOOP_TIME,
  TOSS_LURE_RANGE,
  COIN_VALUE,
  ROOM,
} from './config.js';
import { pointInRect } from './vision.js';

export class Thief {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.coins = 0;
    this.loot = 0; // dollars of loot carried
    this.hasDiamond = false;
    this.facing = -Math.PI / 2; // starts facing up, toward the room
    this.moving = false;
  }

  // Move with acceleration; slide along walls instead of sticking.
  update(dt, input, blockers) {
    let ax = 0;
    let ay = 0;
    if (input.left) ax -= 1;
    if (input.right) ax += 1;
    if (input.up) ay -= 1;
    if (input.down) ay += 1;
    this.moving = ax !== 0 || ay !== 0;
    if (this.moving) {
      const len = Math.hypot(ax, ay);
      ax /= len;
      ay /= len;
      this.vx += ax * THIEF_ACCEL * dt;
      this.vy += ay * THIEF_ACCEL * dt;
      const speed = Math.hypot(this.vx, this.vy);
      if (speed > THIEF_SPEED) {
        this.vx = (this.vx / speed) * THIEF_SPEED;
        this.vy = (this.vy / speed) * THIEF_SPEED;
      }
      this.facing = Math.atan2(this.vy, this.vx);
    } else {
      const speed = Math.hypot(this.vx, this.vy);
      const drop = THIEF_FRICTION * dt;
      if (speed <= drop) {
        this.vx = 0;
        this.vy = 0;
      } else {
        this.vx -= (this.vx / speed) * drop;
        this.vy -= (this.vy / speed) * drop;
      }
    }
    // Sweep the frame's displacement in small steps: a single long step
    // could jump clean over a thin wall (tunnelling). No sub-step is
    // longer than 8 px, so the thief always stops at a wall instead.
    const dx = this.vx * dt;
    const dy = this.vy * dt;
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 8));
    for (let i = 0; i < steps; i++) {
      this.tryMove(dx / steps, 0, blockers);
      this.tryMove(0, dy / steps, blockers);
    }
    this.x = Math.max(ROOM.x + THIEF_RADIUS, Math.min(ROOM.x + ROOM.w - THIEF_RADIUS, this.x));
    this.y = Math.max(ROOM.y + THIEF_RADIUS, Math.min(ROOM.y + ROOM.h - THIEF_RADIUS, this.y));
  }

  // Move on one axis; cancel the step when a blocker would be entered.
  // Trying axes separately is what makes the thief slide along walls.
  tryMove(dx, dy, blockers) {
    const nx = this.x + dx;
    const ny = this.y + dy;
    for (const r of blockers) {
      if (
        nx + THIEF_RADIUS > r.x && nx - THIEF_RADIUS < r.x + r.w &&
        ny + THIEF_RADIUS > r.y && ny - THIEF_RADIUS < r.y + r.h
      ) {
        return;
      }
    }
    this.x = nx;
    this.y = ny;
  }

  // Pick up anything within reach. Returns a list of what was taken,
  // so the game can chime, count, and announce each one.
  collect(room) {
    const taken = [];
    for (const coin of room.coins) {
      if (!coin.taken && Math.hypot(coin.x - this.x, coin.y - this.y) < THIEF_RADIUS + 12) {
        coin.taken = true;
        this.coins += COIN_VALUE;
        taken.push({ kind: 'coin', value: COIN_VALUE, x: coin.x, y: coin.y });
      }
    }
    for (const item of room.loot) {
      if (!item.taken && Math.hypot(item.x - this.x, item.y - this.y) < THIEF_RADIUS + 22) {
        item.taken = true;
        this.loot += item.value;
        if (item.kind === 'diamond') this.hasDiamond = true;
        taken.push({ kind: item.kind, value: item.value, x: item.x, y: item.y, label: item.label });
      }
    }
    return taken;
  }

  // Standing inside the green exit door?
  atExit(room) {
    const e = room.exit;
    return this.x > e.x - 6 && this.x < e.x + e.w + 6 && this.y < e.y + e.h + 26;
  }

  // Tool 1: a smoke pellet at the thief's feet. Blocks every cone.
  useSmoke(world) {
    if (this.coins < TOOL_SMOKE_COST) return false;
    this.coins -= TOOL_SMOKE_COST;
    world.smokes.push({ x: this.x, y: this.y, radius: SMOKE_RADIUS, timer: SMOKE_TIME });
    return true;
  }

  // Tool 2: loop every camera at once.
  useLoop(world) {
    if (this.coins < TOOL_LOOP_COST) return false;
    this.coins -= TOOL_LOOP_COST;
    for (const cam of world.cameras) cam.loop(LOOP_TIME);
    world.loopTimer = LOOP_TIME;
    return true;
  }

  // Tool 3: toss a coin at the mouse. The nearest guard in earshot
  // walks over to look. Returns the toss point, or null when too poor.
  useToss(world, mouseX, mouseY) {
    if (this.coins < TOOL_COIN_COST) return false;
    this.coins -= TOOL_COIN_COST;
    const tx = Math.max(ROOM.x + 10, Math.min(ROOM.x + ROOM.w - 10, mouseX));
    const ty = Math.max(ROOM.y + 10, Math.min(ROOM.y + ROOM.h - 10, mouseY));
    world.tosses.push({ x: tx, y: ty, timer: 1.2 });
    let best = null;
    let bestDist = TOSS_LURE_RANGE;
    for (const g of world.guards) {
      const d = Math.hypot(g.x - tx, g.y - ty);
      if (d < bestDist) {
        bestDist = d;
        best = g;
      }
    }
    if (best) best.lure(tx, ty);
    return true;
  }
}
