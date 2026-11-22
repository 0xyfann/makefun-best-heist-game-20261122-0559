// config.js — one job: every tunable number of The Meridian Vault.
// Nothing here reads the network, the clock, or the DOM: pure constants.

export const VIEW_W = 1280;
export const VIEW_H = 800;

// HUD strip at the top, room floor below it.
export const HUD_H = 56;
export const ROOM = { x: 16, y: 64, w: 1248, h: 728 };

// The thief.
export const THIEF_RADIUS = 13;
export const THIEF_SPEED = 215; // px per second
export const THIEF_ACCEL = 2600;
export const THIEF_FRICTION = 2400;

// Guards.
export const GUARD_RADIUS = 14;
export const GUARD_PATROL_SPEED = 62;
export const GUARD_CHASE_SPEED = 148;
export const GUARD_CONE_RANGE = 175;
export const GUARD_CONE_HALF_ANGLE = 0.62; // radians, ~35 degrees
export const GUARD_WAYPOINT_PAUSE = 1.15; // seconds looking around
export const GUARD_SWEEP = 0.85; // radians of look-around sweep at a waypoint
export const GUARD_SUSPICION_RATE = 95; // per second while the thief is seen
export const GUARD_SUSPICION_DECAY = 26; // per second while hidden
export const GUARD_INVESTIGATE_TIME = 4.0; // seconds spent at a tossed coin
export const GUARD_ALERT_RADIUS = 320; // a spotted thief alerts guards this near

// Cameras.
export const CAMERA_CONE_RANGE = 205;
export const CAMERA_CONE_HALF_ANGLE = 0.5;
export const CAMERA_SWEEP = 0.95; // radians either side of the mount angle
export const CAMERA_SWEEP_SPEED = 0.55; // radians per second
export const CAMERA_SEEN_RATE = 26; // alarm points per second while seen

// The alarm meter, 0..100. At 100 the run is over.
export const ALARM_MAX = 100;
export const ALARM_DECAY = 6; // per second while nobody sees the thief
export const ALARM_SPOT_BONUS = 42; // added the moment a guard fully spots you
export const ALARM_HEAT_STEP = 50; // crossing this makes every guard faster

// Tools, bought with coins. Costs are the whole economy: coins are scarce.
export const TOOL_SMOKE_COST = 25;
export const TOOL_LOOP_COST = 30;
export const TOOL_COIN_COST = 10;
export const SMOKE_RADIUS = 74;
export const SMOKE_TIME = 6;
export const LOOP_TIME = 8;
export const TOSS_LURE_RANGE = 330; // guards nearer than this walk to the coin

// Loot values, in dollars.
export const COIN_VALUE = 10;
export const SAFE_VALUE = 150;
export const PAINTING_VALUE = 200;
export const DIAMOND_VALUE = 500;
export const TIME_BONUS_PER_SECOND = 2; // getaway bonus, capped below
export const TIME_BONUS_CAP = 240;

// Palette. Dark vault at night: cover is teal, danger is amber/red,
// loot is gold, the thief is ice-white, the exit is green.
export const COLORS = {
  floor: '#171d29',
  floorAlt: '#1b2231',
  wall: '#2c3648',
  wallEdge: '#4a5a75',
  cover: '#1f4d4a',
  coverEdge: '#3f8f86',
  coverLow: '#274b5c',
  door: '#7a5c2e',
  exit: '#2fae5f',
  exitGlow: '#7dffa8',
  thief: '#eaf6ff',
  thiefRing: '#7fd4ff',
  guard: '#ffcf5c',
  guardAlert: '#ff5a4e',
  cone: 'rgba(255, 207, 92, 0.20)',
  coneEdge: 'rgba(255, 207, 92, 0.55)',
  coneAlert: 'rgba(255, 90, 78, 0.26)',
  camera: '#ff6b5e',
  cameraCone: 'rgba(255, 107, 94, 0.16)',
  cameraConeEdge: 'rgba(255, 107, 94, 0.5)',
  loot: '#ffd94a',
  lootGlow: 'rgba(255, 217, 74, 0.35)',
  coin: '#f5c542',
  smoke: 'rgba(190, 205, 220, 0.5)',
  hud: '#0e1420',
  hudLine: '#2c3648',
  text: '#e8eef7',
  textDim: '#9fb0c8',
  alarmLow: '#57c785',
  alarmMid: '#f5c542',
  alarmHigh: '#ff5a4e',
};
