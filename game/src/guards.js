// guards.js — one job: the night staff.
// A guard walks a patrol, pauses to look around, and watches a cone.
// Seeing the thief fills suspicion; a full bar means an alert, a chase,
// and a jump on the alarm meter. A tossed coin pulls a guard off patrol.

import {
  GUARD_PATROL_SPEED,
  GUARD_CHASE_SPEED,
  GUARD_WAYPOINT_PAUSE,
  GUARD_SWEEP,
  GUARD_SUSPICION_RATE,
  GUARD_SUSPICION_DECAY,
  GUARD_INVESTIGATE_TIME,
  GUARD_CONE_RANGE,
  GUARD_CONE_HALF_ANGLE,
  ROOM,
} from './config.js';
import { canSee } from './vision.js';

export class Guard {
  constructor(def) {
    this.waypoints = def.waypoints;
    this.label = def.label;
    this.x = def.waypoints[0].x;
    this.y = def.waypoints[0].y;
    this.targetIndex = 1 % def.waypoints.length;
    this.facing = 0;
    this.pauseTimer = 0;
    this.suspicion = 0; // 0..100, per guard
    this.state = 'patrol'; // patrol | look | chase | investigate
    this.investigateX = 0;
    this.investigateY = 0;
    this.investigateTimer = 0;
    this.chaseTimer = 0;
    this.alerted = false; // already paid the alarm bonus for this sighting
    this.speedBoost = 0; // heat: guards quicken when the alarm is high
  }

  // Face a point.
  faceToward(x, y) {
    this.facing = Math.atan2(y - this.y, x - this.x);
  }

  // The guard's current patrol target.
  patrolTarget() {
    return this.waypoints[this.targetIndex];
  }

  // Walk toward (x, y) at speed; returns true when arrived.
  stepToward(x, y, speed, dt) {
    const dx = x - this.x;
    const dy = y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return true;
    const move = Math.min(dist, speed * dt);
    this.x += (dx / dist) * move;
    this.y += (dy / dist) * move;
    this.faceToward(x, y);
    return move >= dist - 0.01;
  }

  update(dt, world) {
    const { thief, blockers, smokes, alarm } = world;
    this.speedBoost = alarm >= 50 ? 22 : 0;
    const seen = canSee(
      this.x, this.y, this.facing,
      GUARD_CONE_RANGE, GUARD_CONE_HALF_ANGLE,
      thief.x, thief.y, blockers, smokes,
    );

    if (seen) {
      this.suspicion = Math.min(100, this.suspicion + GUARD_SUSPICION_RATE * dt);
    } else {
      this.suspicion = Math.max(0, this.suspicion - GUARD_SUSPICION_DECAY * dt);
    }

    if (this.suspicion >= 100 && !this.alerted) {
      this.alerted = true;
      this.state = 'chase';
      this.chaseTimer = 3.0;
      world.onSpotted(this);
    }
    if (this.state === 'chase') {
      this.chaseTimer -= dt;
      this.stepToward(thief.x, thief.y, GUARD_CHASE_SPEED + this.speedBoost, dt);
      if (this.chaseTimer <= 0 || !seen) {
        this.state = 'patrol';
        this.alerted = false;
      }
      return;
    }
    if (this.state === 'investigate') {
      this.investigateTimer -= dt;
      const arrived = this.stepToward(
        this.investigateX, this.investigateY,
        GUARD_PATROL_SPEED + this.speedBoost, dt,
      );
      if (arrived) {
        this.pauseTimer = GUARD_WAYPOINT_PAUSE;
        this.state = 'look';
      }
      if (this.investigateTimer <= 0) this.state = 'patrol';
      return;
    }
    if (this.state === 'look') {
      this.pauseTimer -= dt;
      // Sweep the gaze while standing still: tension the player can read.
      const w = this.patrolTarget();
      const base = Math.atan2(w.y - this.y, w.x - this.x);
      const phase = (GUARD_WAYPOINT_PAUSE - this.pauseTimer) / GUARD_WAYPOINT_PAUSE;
      this.facing = base + Math.sin(phase * Math.PI * 2) * GUARD_SWEEP;
      if (this.pauseTimer <= 0) {
        this.state = 'patrol';
        this.targetIndex = (this.targetIndex + 1) % this.waypoints.length;
      }
      return;
    }
    // Patrol: walk to the next waypoint, then stop and look around.
    const arrived = this.stepToward(
      this.patrolTarget().x, this.patrolTarget().y,
      GUARD_PATROL_SPEED + this.speedBoost, dt,
    );
    if (arrived) {
      this.state = 'look';
      this.pauseTimer = GUARD_WAYPOINT_PAUSE;
    }
  }

  // A coin clinks nearby: walk over and look, if it is in earshot.
  lure(x, y) {
    if (this.state === 'chase') return;
    this.investigateX = x;
    this.investigateY = y;
    this.investigateTimer = GUARD_INVESTIGATE_TIME;
    this.state = 'investigate';
  }

  // Did this guard catch the thief by touch?
  touches(thief) {
    return Math.hypot(this.x - thief.x, this.y - thief.y) < 26;
  }

  // Keep the guard inside the room floor.
  clamp() {
    this.x = Math.max(ROOM.x + 16, Math.min(ROOM.x + ROOM.w - 16, this.x));
    this.y = Math.max(ROOM.y + 16, Math.min(ROOM.y + ROOM.h - 16, this.y));
  }
}
