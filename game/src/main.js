// main.js — one job: run The Meridian Vault.
// State machine (title / playing / paused / caught / win), the frame loop,
// the alarm, room changes, tool keys, and the deterministic shot mode the
// screenshots are taken from (?shot=start|play|end&seed=1).

import { VIEW_W, VIEW_H, ROOM, ALARM_MAX, ALARM_DECAY, ALARM_SPOT_BONUS, TIME_BONUS_CAP, TIME_BONUS_PER_SECOND } from './config.js';
import { ROOMS, blockersOf } from './world.js';
import { Guard } from './guards.js';
import { Camera } from './cameras.js';
import { Thief } from './player.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { drawScene } from './render.js';
import { makeRng } from './random.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const params = new URLSearchParams(window.location.search);
const seed = Number.parseInt(params.get('seed') || '', 10) || 20261122;
const shot = params.get('shot') || '';
const rng = makeRng(seed);

export const game = {
  state: 'title', // title | playing | paused | caught | win
  roomIndex: 0,
  room: ROOMS[0],
  blockers: [],
  guards: [],
  cameras: [],
  thief: null,
  alarm: 0,
  smokes: [],
  tosses: [],
  loopTimer: 0,
  cameraSeen: false,
  elapsed: 0,
  toastTimer: 0,
  caughtReason: '',
  alarmsRaised: 0,
  timeBonus: 0,
  score: 0,
  exitBlockTimer: 0,
  animTime: 1200, // frozen clock for shot mode; live clock in normal play
  entryLoot: 0,
  entryCoins: 0,
  entryAlarm: 0,
  entryDiamond: false,
};

const input = new Input(canvas);
const sounds = new SoundBank();
let alarmPulseTimer = 0;
let lastFrame = performance.now();

// Fit the 1280x800 canvas into the window, keeping its aspect.
function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

function loadRoom(index) {
  const room = ROOMS[index];
  game.roomIndex = index;
  game.room = room;
  game.blockers = blockersOf(room);
  game.guards = room.guards.map((g) => new Guard(g));
  game.cameras = room.cameras.map((c) => {
    const cam = new Camera(c);
    cam.seedPhase(rng.range(0, Math.PI * 2));
    return cam;
  });
  game.thief = new Thief(room.start.x, room.start.y);
  game.thief.coins = game.entryCoins;
  game.thief.loot = game.entryLoot;
  game.thief.hasDiamond = game.entryDiamond;
  game.smokes = [];
  game.tosses = [];
  game.loopTimer = 0;
  game.alarm = game.entryAlarm;
  game.exitBlockTimer = 0;
  // Snapshot the run so R retries this room, not the whole night.
  game.entryLoot = game.thief.loot;
  game.entryCoins = game.thief.coins;
  game.entryDiamond = game.thief.hasDiamond;
  game.entryAlarm = game.alarm;
  game.toastTimer = 3.5;
}

function startRun() {
  game.entryLoot = 0;
  game.entryCoins = 0;
  game.entryDiamond = false;
  game.entryAlarm = 0;
  game.elapsed = 0;
  game.alarmsRaised = 0;
  game.score = 0;
  game.timeBonus = 0;
  loadRoom(0);
  game.state = 'playing';
  announce('The heist begins. Reach the exit of each room. Do not get seen.');
}

function retryRoom() {
  game.thief.loot = game.entryLoot;
  game.thief.coins = game.entryCoins;
  game.thief.hasDiamond = game.entryDiamond;
  loadRoom(game.roomIndex);
  game.state = 'playing';
  announce(`Retrying ${game.room.name}.`);
}

function toTitle() {
  game.entryLoot = 0;
  game.entryCoins = 0;
  game.entryDiamond = false;
  game.entryAlarm = 0;
  game.elapsed = 0;
  game.alarmsRaised = 0;
  loadRoom(0);
  game.state = 'title';
}

// A guard fully spotted the thief: alarm jumps, the sting plays, and
// every guard nearby turns toward the noise.
function onSpotted(guard) {
  game.alarm = Math.min(ALARM_MAX, game.alarm + ALARM_SPOT_BONUS);
  game.alarmsRaised += 1;
  sounds.sting();
  announce(`${guard.label} spotted you! Alarm ${Math.round(game.alarm)} percent.`);
  for (const g of game.guards) {
    if (g !== guard && Math.hypot(g.x - guard.x, g.y - guard.y) < 320) {
      g.lure(game.thief.x, game.thief.y);
    }
  }
}

function caught(reason) {
  game.state = 'caught';
  game.caughtReason = reason;
  sounds.caught();
  announce(`Caught. ${reason} Press R to retry the room.`);
}

function winRun() {
  game.timeBonus = Math.min(TIME_BONUS_CAP, Math.max(0, Math.round((360 - game.elapsed)) * TIME_BONUS_PER_SECOND));
  game.score = game.thief.loot + game.timeBonus;
  game.state = 'win';
  sounds.fanfare();
  announce(`Clean getaway! Score ${game.score} dollars.`);
}

function announce(text) {
  if (statusEl) statusEl.textContent = text;
}

function update(dt) {
  game.elapsed += dt;
  game.animTime = performance.now();
  if (game.toastTimer > 0) game.toastTimer -= dt;
  if (game.exitBlockTimer > 0) game.exitBlockTimer -= dt;
  if (game.loopTimer > 0) game.loopTimer -= dt;

  // Tools.
  if (input.wasPressed('Digit1')) {
    if (game.thief.useSmoke(game)) sounds.smoke();
    else announce('Not enough coins for smoke. A coin is 10, smoke is 25.');
  }
  if (input.wasPressed('Digit2')) {
    if (game.thief.useLoop(game)) announce('Cameras looped for 8 seconds.');
    else announce('Not enough coins for a camera loop. It costs 30.');
  }
  if (input.wasPressed('Digit3')) {
    if (game.thief.useToss(game, input.mouseX, input.mouseY)) sounds.toss();
    else announce('Not enough coins to toss. It costs 10.');
  }
  if (input.wasPressed('KeyM')) {
    sounds.unlock();
    announce(sounds.toggleMute() ? 'Sound off.' : 'Sound on.');
  }
  if (input.wasPressed('KeyP') || input.wasPressed('Escape')) {
    game.state = 'paused';
    return;
  }

  const world = {
    thief: game.thief,
    blockers: game.blockers,
    smokes: game.smokes,
    alarm: game.alarm,
    guards: game.guards,
    cameras: game.cameras,
    cameraSeen: false,
    onSpotted,
  };
  game.thief.update(dt, input, game.blockers);
  for (const guard of game.guards) guard.update(dt, world);
  for (const cam of game.cameras) cam.update(dt, world);
  game.cameraSeen = world.cameraSeen;

  // The alarm falls when nobody sees the thief.
  const anyoneSees = game.guards.some((g) => g.suspicion > 0) || game.cameraSeen;
  if (!anyoneSees) game.alarm = Math.max(0, game.alarm - ALARM_DECAY * dt);
  if (game.alarm > 75) {
    alarmPulseTimer -= dt;
    if (alarmPulseTimer <= 0) {
      sounds.alarmPulse();
      alarmPulseTimer = 0.9;
    }
  }

  // Smoke and tossed coins fade.
  for (const s of game.smokes) s.timer -= dt;
  game.smokes = game.smokes.filter((s) => s.timer > 0);
  for (const t of game.tosses) t.timer -= dt;
  game.tosses = game.tosses.filter((t) => t.timer > 0);

  // Pickups.
  for (const got of game.thief.collect(game.room)) {
    if (got.kind === 'coin') sounds.coin();
    else if (got.kind === 'diamond') sounds.diamond();
    else sounds.loot();
    if (got.kind !== 'coin') announce(`${got.label} taken: $${got.value}.`);
  }

  // Caught by touch, or by a full alarm.
  for (const guard of game.guards) {
    if (guard.touches(game.thief)) {
      caught(`${guard.label} grabbed you in ${game.room.name}.`);
      return;
    }
  }
  if (game.alarm >= ALARM_MAX) {
    caught('The alarm hit 100 percent. Lockdown. The night staff found you.');
    return;
  }

  // The exit door.
  if (game.exitBlockTimer <= 0 && game.thief.atExit(game.room)) {
    if (game.roomIndex === ROOMS.length - 1) {
      if (game.thief.hasDiamond) {
        winRun();
        return;
      }
      game.exitBlockTimer = 2.5;
      game.toastTimer = 2.5;
      game.room.intro = 'The Meridian Diamond first — it is in the vault.';
      announce('The exit is locked until the diamond is yours.');
      return;
    }
    loadRoom(game.roomIndex + 1);
    announce(`${game.room.name}. ${game.room.intro}`);
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  if (input.wasPressed('Enter')) {
    sounds.unlock();
    if (game.state === 'title' || game.state === 'win') startRun();
    else if (game.state === 'caught') retryRoom();
  }
  if (input.wasPressed('KeyR') && (game.state === 'caught' || game.state === 'win' || game.state === 'playing')) {
    sounds.unlock();
    retryRoom();
  }
  if (input.wasPressed('KeyT') && game.state !== 'title') toTitle();
  // Resume from pause: peek first, consume only when actually resuming.
  // (wasPressed here would eat the press that update() needs to pause.)
  if (game.state === 'paused' && (input.hasPressed('KeyP') || input.hasPressed('Escape'))) {
    input.wasPressed('KeyP');
    input.wasPressed('Escape');
    game.state = 'playing';
  }
  if (game.state === 'playing') update(dt);
  drawScene(ctx, game);
  input.endFrame();
  requestAnimationFrame(frame);
}

// Shot mode: a frozen, scripted frame for the screenshots. The game never
// runs its loop here; each shot is one render of fixed positions, so the
// image is the same every time it is taken.
function setupShot(name) {
  if (name === 'start') {
    // The cover: the heist itself, nothing on top of it. No title card —
    // the room, the thief, both guard cones, the camera, the safe and the
    // alarm meter all have to be visible in this one frame.
    loadRoom(0);
    game.state = 'playing';
    game.elapsed = 0;
    game.alarm = 0;
    game.toastTimer = 0;
    // Mid-patrol, mid-sweep: cones crossing the room, thief at the door.
    game.guards[0].x = 226; game.guards[0].y = 404; game.guards[0].facing = Math.PI / 2;
    game.guards[1].x = 1054; game.guards[1].y = 404; game.guards[1].facing = -Math.PI / 2;
    game.cameras[0].seedPhase(0.6);
    game.animTime = 600;
  } else if (name === 'play') {
    loadRoom(1);
    game.state = 'playing';
    game.elapsed = 148;
    game.alarm = 45;
    game.thief.coins = 40;
    game.thief.x = 640; game.thief.y = 326; // tucked behind the middle case
    game.thief.facing = -Math.PI / 2;
    game.room.coins[0].taken = true;
    game.room.coins[2].taken = true;
    game.room.coins[5].taken = true;
    // Ansel mid-patrol, suspicious, cone sweeping toward the thief.
    game.guards[0].x = 700; game.guards[0].y = 724; game.guards[0].facing = Math.PI;
    game.guards[0].suspicion = 62; game.guards[0].state = 'look'; game.guards[0].pauseTimer = 0.6;
    // Bea walks to a tossed coin; Cyrus watches the painting.
    game.guards[1].x = 1000; game.guards[1].y = 452; game.guards[1].facing = -Math.PI / 2;
    game.guards[1].state = 'investigate'; game.guards[1].investigateX = 916; game.guards[1].investigateY = 500;
    game.guards[2].x = 620; game.guards[2].y = 184; game.guards[2].facing = Math.PI / 2;
    game.cameras[0].seedPhase(0.9);
    game.cameras[1].seedPhase(-0.7);
    game.tosses.push({ x: 916, y: 500, timer: 1.2 });
    game.toastTimer = 0;
    game.animTime = 1200;
  } else if (name === 'end') {
    loadRoom(2);
    game.state = 'win';
    game.elapsed = 284;
    game.alarm = 12;
    game.thief.loot = 850;
    game.thief.coins = 15;
    game.thief.hasDiamond = true;
    game.thief.x = 1196; game.thief.y = 92; // at the green exit door
    game.thief.facing = -Math.PI / 2;
    game.room.loot[0].taken = true;
    game.room.coins[0].taken = true;
    game.room.coins[3].taken = true;
    game.timeBonus = 152;
    game.score = 1002;
    game.alarmsRaised = 1;
    // Cameras looped grey, guards far from the door.
    game.cameras[0].loop(8);
    game.cameras[1].loop(8);
    game.guards[0].x = 396; game.guards[0].y = 300; game.guards[0].facing = Math.PI / 2;
    game.guards[1].x = 884; game.guards[1].y = 300; game.guards[1].facing = Math.PI / 2;
    game.guards[2].x = 496; game.guards[2].y = 604; game.guards[2].facing = 0;
    game.animTime = 1200;
  }
  drawScene(ctx, game);
  window.__shotReady = true;
}

loadRoom(0);
if (shot) {
  setupShot(shot);
} else {
  window.__game = game;
  requestAnimationFrame(frame);
}
