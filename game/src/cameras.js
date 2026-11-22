// cameras.js — one job: the wall cameras.
// A camera sits on a wall and sweeps its red cone back and forth.
// Being inside a live cone raises the alarm fast. A loop tool switches
// every camera off for a while; a looped camera shows a grey cone.

import {
  CAMERA_CONE_RANGE,
  CAMERA_CONE_HALF_ANGLE,
  CAMERA_SWEEP,
  CAMERA_SWEEP_SPEED,
  CAMERA_SEEN_RATE,
} from './config.js';
import { canSee } from './vision.js';

export class Camera {
  constructor(def) {
    this.x = def.x;
    this.y = def.y;
    this.baseAngle = def.baseAngle;
    this.label = def.label;
    this.phase = 0; // main.js sets this from the run seed; never Math.random
    this.loopTimer = 0; // > 0 while looped (off)
    this.seeingThief = false;
  }

  // Deterministic start angle for a seeded run.
  seedPhase(phase) {
    this.phase = phase;
  }

  get angle() {
    return this.baseAngle + Math.sin(this.phase) * CAMERA_SWEEP;
  }

  get looped() {
    return this.loopTimer > 0;
  }

  update(dt, world) {
    this.phase += CAMERA_SWEEP_SPEED * dt;
    if (this.loopTimer > 0) this.loopTimer -= dt;
    this.seeingThief = false;
    if (this.looped) return;
    const { thief, blockers, smokes } = world;
    this.seeingThief = canSee(
      this.x, this.y, this.angle,
      CAMERA_CONE_RANGE, CAMERA_CONE_HALF_ANGLE,
      thief.x, thief.y, blockers, smokes,
    );
    if (this.seeingThief) {
      world.alarm = Math.min(100, world.alarm + CAMERA_SEEN_RATE * dt);
      world.cameraSeen = true;
    }
  }

  // The loop tool: freeze every camera at once.
  loop(seconds) {
    this.loopTimer = seconds;
    this.seeingThief = false;
  }
}
