// world.js — one job: the three rooms of the Meridian Museum.
// Layouts are plain data: walls, cover, doors, coins, loot, cameras and
// guard patrols. Nothing here moves; guards.js and cameras.js do that.
// Every room fits in one frame, so the judge sees the whole heist at once.

import { ROOM } from './config.js';

// A wall or a piece of cover: { x, y, w, h, kind, label? }.
// kind 'wall' is the room shell and interior structure; 'cover' is
// furniture the thief hides behind. Both block movement and sight.
function rect(x, y, w, h, kind, label) {
  return { x, y, w, h, kind, label: label || '' };
}

// Room 1 — The Lobby. Two guards, one camera, three ways through:
// the left corridor, the right corridor, or straight past the desk.
export const ROOM_LOBBY = {
  name: 'The Lobby',
  intro: 'Slip past the night staff. The safe in the corner is worth a look.',
  start: { x: ROOM.x + ROOM.w / 2, y: ROOM.y + ROOM.h - 46 },
  exit: { x: ROOM.x + ROOM.w / 2 - 34, y: ROOM.y + 2, w: 68, h: 12 },
  walls: [
    // The shell is the room edge itself; these are interior walls.
    rect(ROOM.x + 300, ROOM.y + 150, 26, 300, 'wall'),
    rect(ROOM.x + ROOM.w - 326, ROOM.y + 150, 26, 300, 'wall'),
    rect(ROOM.x + 430, ROOM.y + 480, 388, 26, 'wall'),
  ],
  cover: [
    rect(ROOM.x + 120, ROOM.y + 96, 150, 54, 'cover', 'Reception desk'),
    rect(ROOM.x + ROOM.w - 270, ROOM.y + 96, 150, 54, 'cover', 'Coat check'),
    rect(ROOM.x + 130, ROOM.y + 560, 110, 110, 'cover', 'Sofa'),
    rect(ROOM.x + ROOM.w - 240, ROOM.y + 560, 110, 110, 'cover', 'Sofa'),
    rect(ROOM.x + 560, ROOM.y + 300, 128, 60, 'cover', 'Planter'),
  ],
  coins: [
    { x: ROOM.x + 90, y: ROOM.y + 300 },
    { x: ROOM.x + 200, y: ROOM.y + 480 },
    { x: ROOM.x + ROOM.w - 90, y: ROOM.y + 300 },
    { x: ROOM.x + ROOM.w - 200, y: ROOM.y + 480 },
    { x: ROOM.x + 640, y: ROOM.y + 620 },
    { x: ROOM.x + 640, y: ROOM.y + 220 },
  ],
  loot: [
    { x: ROOM.x + 84, y: ROOM.y + 84, kind: 'safe', value: 150, label: 'Lobby safe' },
  ],
  cameras: [
    { x: ROOM.x + ROOM.w / 2, y: ROOM.y + 6, baseAngle: Math.PI / 2, label: 'Lobby cam' },
  ],
  guards: [
    {
      waypoints: [
        { x: ROOM.x + 210, y: ROOM.y + 220 },
        { x: ROOM.x + 210, y: ROOM.y + 540 },
      ],
      label: 'Guard Milo',
    },
    {
      waypoints: [
        { x: ROOM.x + ROOM.w - 210, y: ROOM.y + 540 },
        { x: ROOM.x + ROOM.w - 210, y: ROOM.y + 220 },
      ],
      label: 'Guard Petra',
    },
  ],
};

// Room 2 — The Gallery. Three guards, two cameras, the painting on the
// far wall. Display cases make the middle a maze with three routes.
export const ROOM_GALLERY = {
  name: 'The Gallery',
  intro: 'The Meridian portrait hangs upstairs. Cases and statues are cover.',
  start: { x: ROOM.x + 90, y: ROOM.y + ROOM.h - 46 },
  exit: { x: ROOM.x + ROOM.w - 102, y: ROOM.y + 2, w: 68, h: 12 },
  walls: [
    rect(ROOM.x + 420, ROOM.y + 120, 26, 260, 'wall'),
    rect(ROOM.x + 800, ROOM.y + 380, 26, 260, 'wall'),
  ],
  cover: [
    rect(ROOM.x + 250, ROOM.y + 180, 130, 70, 'cover', 'Display case'),
    rect(ROOM.x + 560, ROOM.y + 150, 130, 70, 'cover', 'Display case'),
    rect(ROOM.x + 860, ROOM.y + 180, 130, 70, 'cover', 'Display case'),
    rect(ROOM.x + 380, ROOM.y + 420, 90, 90, 'cover', 'Marble statue'),
    rect(ROOM.x + 760, ROOM.y + 450, 90, 90, 'cover', 'Marble statue'),
    rect(ROOM.x + 560, ROOM.y + 580, 150, 56, 'cover', 'Bench'),
    rect(ROOM.x + 180, ROOM.y + 660, 90, 60, 'cover', 'Ticket booth'),
  ],
  coins: [
    { x: ROOM.x + 200, y: ROOM.y + 90 },
    { x: ROOM.x + 480, y: ROOM.y + 300 },
    { x: ROOM.x + 700, y: ROOM.y + 90 },
    { x: ROOM.x + 950, y: ROOM.y + 320 },
    { x: ROOM.x + 300, y: ROOM.y + 620 },
    { x: ROOM.x + 620, y: ROOM.y + 340 },
    { x: ROOM.x + 1080, y: ROOM.y + 560 },
    { x: ROOM.x + 90, y: ROOM.y + 420 },
  ],
  loot: [
    { x: ROOM.x + ROOM.w / 2, y: ROOM.y + 78, kind: 'painting', value: 200, label: 'Meridian portrait' },
  ],
  cameras: [
    { x: ROOM.x + 300, y: ROOM.y + 6, baseAngle: Math.PI / 2, label: 'Gallery cam A' },
    { x: ROOM.x + ROOM.w - 30, y: ROOM.y + 320, baseAngle: Math.PI, label: 'Gallery cam B' },
  ],
  guards: [
    {
      waypoints: [
        { x: ROOM.x + 320, y: ROOM.y + 660 },
        { x: ROOM.x + ROOM.w - 200, y: ROOM.y + 660 },
      ],
      label: 'Guard Ansel',
    },
    {
      waypoints: [
        { x: ROOM.x + 1080, y: ROOM.y + 120 },
        { x: ROOM.x + 1080, y: ROOM.y + 620 },
      ],
      label: 'Guard Bea',
    },
    {
      waypoints: [
        { x: ROOM.x + 480, y: ROOM.y + 120 },
        { x: ROOM.x + 760, y: ROOM.y + 120 },
      ],
      label: 'Guard Cyrus',
    },
  ],
};

// Room 3 — The Vault. The Meridian Diamond waits behind the last patrol.
// Two cameras watch the approach; the green exit door is the getaway.
export const ROOM_VAULT = {
  name: 'The Vault',
  intro: 'The diamond is yours if the vault approach stays quiet.',
  start: { x: ROOM.x + ROOM.w / 2, y: ROOM.y + ROOM.h - 46 },
  exit: { x: ROOM.x + ROOM.w - 102, y: ROOM.y + 2, w: 68, h: 12 },
  walls: [
    rect(ROOM.x + 330, ROOM.y + 200, 26, 260, 'wall'),
    rect(ROOM.x + ROOM.w - 356, ROOM.y + 200, 26, 260, 'wall'),
    rect(ROOM.x + 500, ROOM.y + 120, 248, 26, 'wall'),
  ],
  cover: [
    rect(ROOM.x + 120, ROOM.y + 140, 120, 120, 'cover', 'Bullion crate'),
    rect(ROOM.x + ROOM.w - 240, ROOM.y + 140, 120, 120, 'cover', 'Bullion crate'),
    rect(ROOM.x + 180, ROOM.y + 520, 130, 70, 'cover', 'Bullion crate'),
    rect(ROOM.x + ROOM.w - 310, ROOM.y + 520, 130, 70, 'cover', 'Bullion crate'),
    rect(ROOM.x + 560, ROOM.y + 380, 128, 60, 'cover', 'Vault console'),
  ],
  coins: [
    { x: ROOM.x + 200, y: ROOM.y + 330 },
    { x: ROOM.x + ROOM.w - 200, y: ROOM.y + 330 },
    { x: ROOM.x + 420, y: ROOM.y + 620 },
    { x: ROOM.x + ROOM.w - 420, y: ROOM.y + 620 },
    { x: ROOM.x + 640, y: ROOM.y + 480 },
    { x: ROOM.x + 640, y: ROOM.y + 260 },
  ],
  loot: [
    { x: ROOM.x + ROOM.w / 2, y: ROOM.y + 92, kind: 'diamond', value: 500, label: 'Meridian Diamond' },
  ],
  cameras: [
    { x: ROOM.x + 380, y: ROOM.y + 6, baseAngle: Math.PI / 2, label: 'Vault cam A' },
    { x: ROOM.x + ROOM.w - 380, y: ROOM.y + 6, baseAngle: Math.PI / 2, label: 'Vault cam B' },
  ],
  guards: [
    {
      waypoints: [
        { x: ROOM.x + 300, y: ROOM.y + 500 },
        { x: ROOM.x + 300, y: ROOM.y + 220 },
      ],
      label: 'Guard Dara',
    },
    {
      waypoints: [
        { x: ROOM.x + ROOM.w - 300, y: ROOM.y + 220 },
        { x: ROOM.x + ROOM.w - 300, y: ROOM.y + 500 },
      ],
      label: 'Guard Emil',
    },
    {
      waypoints: [
        { x: ROOM.x + 380, y: ROOM.y + 540 },
        { x: ROOM.x + 560, y: ROOM.y + 540 },
      ],
      label: 'Guard Faye',
    },
  ],
};

export const ROOMS = [ROOM_LOBBY, ROOM_GALLERY, ROOM_VAULT];

// All rectangles that block movement and sight in a room:
// the shell, the interior walls, and the cover.
export function blockersOf(room) {
  const shell = [
    rect(ROOM.x - 8, ROOM.y - 8, ROOM.w + 16, 8, 'wall'),
    rect(ROOM.x - 8, ROOM.y + ROOM.h, ROOM.w + 16, 8, 'wall'),
    rect(ROOM.x - 8, ROOM.y, 8, ROOM.h, 'wall'),
    rect(ROOM.x + ROOM.w, ROOM.y, 8, ROOM.h, 'wall'),
  ];
  return [...shell, ...room.walls, ...room.cover];
}
