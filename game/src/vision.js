// vision.js — one job: what a watcher can actually see.
// A cone is a sector (range + half-angle); walls and cover block the view.
// Smoke blocks it too. All tests are pure geometry, no DOM, no state.

import { GUARD_CONE_RANGE } from './config.js';

// Is point (px, py) inside the rectangle r? (r has x, y, w, h.)
export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// Does the segment (x1,y1)-(x2,y2) cross the rectangle r?
// Tested by sampling: cheap, robust, and good enough for 60 fps play.
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const steps = 24;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (pointInRect(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, r)) return true;
  }
  return false;
}

// Does the segment pass through the circle (cx, cy, radius)?
export function segmentHitsCircle(x1, y1, x2, y2, cx, cy, radius) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(cx - x1, cy - y1) <= radius;
  let t = ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const nearX = x1 + dx * t;
  const nearY = y1 + dy * t;
  return Math.hypot(cx - nearX, cy - nearY) <= radius;
}

// Is the target visible from the eye? Range, cone angle, walls/cover,
// then smoke. `blockers` is the room's list of sight-blocking rects,
// `smokes` the active smoke clouds. Returns true when the line is clear.
export function canSee(eyeX, eyeY, facing, range, halfAngle, tx, ty, blockers, smokes) {
  const dx = tx - eyeX;
  const dy = ty - eyeY;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 1) return true;
  const angle = Math.atan2(dy, dx);
  let diff = angle - facing;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > halfAngle) return false;
  for (const r of blockers) {
    if (segmentHitsRect(eyeX, eyeY, tx, ty, r)) return false;
  }
  for (const s of smokes) {
    if (segmentHitsCircle(eyeX, eyeY, tx, ty, s.x, s.y, s.radius)) return false;
  }
  return true;
}

// The cone as a polygon the renderer can draw: eye, then an arc of points.
export function conePolygon(eyeX, eyeY, facing, range, halfAngle) {
  const pts = [{ x: eyeX, y: eyeY }];
  const steps = 18;
  for (let i = 0; i <= steps; i++) {
    const a = facing - halfAngle + (2 * halfAngle * i) / steps;
    pts.push({ x: eyeX + Math.cos(a) * range, y: eyeY + Math.sin(a) * range });
  }
  return pts;
}

// Keep the guard cone range import honest: the module's callers pass their
// own range, but the default patrol cone is this wide.
export const DEFAULT_CONE_RANGE = GUARD_CONE_RANGE;
