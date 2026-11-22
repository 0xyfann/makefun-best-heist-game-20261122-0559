// render.js — one job: everything the player sees, on one canvas.
// The room, the cones, the people, the loot, the HUD, and the overlays.
// Pure drawing: it reads the game state and never changes it.

import { VIEW_W, VIEW_H, HUD_H, ROOM, COLORS } from './config.js';
import { conePolygon } from './vision.js';
import { GUARD_CONE_RANGE, GUARD_CONE_HALF_ANGLE, CAMERA_CONE_RANGE, CAMERA_CONE_HALF_ANGLE } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fillPoly(ctx, pts, fill) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawCone(ctx, eyeX, eyeY, facing, range, halfAngle, fill, edge) {
  const pts = conePolygon(eyeX, eyeY, facing, range, halfAngle);
  fillPoly(ctx, pts, fill);
  ctx.beginPath();
  ctx.moveTo(eyeX, eyeY);
  ctx.lineTo(pts[1].x, pts[1].y);
  ctx.moveTo(eyeX, eyeY);
  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// The whole scene, in draw order: floor, loot, cones, furniture, people,
// smoke, then the HUD and any overlay on top.
export function drawScene(ctx, game) {
  const room = game.room;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#0b0f18';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  drawFloor(ctx, room);
  drawLoot(ctx, game);
  drawCones(ctx, game);
  drawWallsAndCover(ctx, room);
  drawExit(ctx, room, game);
  drawCoins(ctx, game);
  drawCameras(ctx, game);
  drawGuards(ctx, game);
  drawThief(ctx, game);
  drawSmoke(ctx, game);
  drawTosses(ctx, game);
  drawHud(ctx, game);
  if (game.state === 'title') drawTitle(ctx, game);
  if (game.state === 'caught') drawCaught(ctx, game);
  if (game.state === 'win') drawWin(ctx, game);
  if (game.state === 'paused') drawPaused(ctx, game);
  if (game.toastTimer > 0 && game.state === 'playing') drawToast(ctx, game);
}

function drawFloor(ctx, room) {
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h);
  // A quiet checker so motion reads at a glance.
  ctx.fillStyle = COLORS.floorAlt;
  const tile = 62;
  for (let y = ROOM.y; y < ROOM.y + ROOM.h; y += tile) {
    for (let x = ROOM.x; x < ROOM.x + ROOM.w; x += tile) {
      const col = Math.floor((x - ROOM.x) / tile);
      const row = Math.floor((y - ROOM.y) / tile);
      if ((col + row) % 2 === 0) ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.strokeStyle = COLORS.wallEdge;
  ctx.lineWidth = 3;
  ctx.strokeRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h);
}

function drawWallsAndCover(ctx, room) {
  for (const w of room.walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = COLORS.wallEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x, w.y, w.w, w.h);
  }
  for (const c of room.cover) {
    ctx.fillStyle = COLORS.cover;
    roundRect(ctx, c.x, c.y, c.w, c.h, 8);
    ctx.fill();
    ctx.strokeStyle = COLORS.coverEdge;
    ctx.lineWidth = 2;
    roundRect(ctx, c.x, c.y, c.w, c.h, 8);
    ctx.stroke();
    if (c.label) {
      ctx.fillStyle = COLORS.textDim;
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.label, c.x + c.w / 2, c.y + c.h / 2 + 4);
    }
  }
}

function drawExit(ctx, room, game) {
  const e = room.exit;
  const pulse = 0.55 + 0.35 * Math.sin(game.animTime / 280);
  ctx.fillStyle = COLORS.exit;
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = `rgba(125, 255, 168, ${pulse})`;
  ctx.fillRect(e.x - 4, e.y + e.h, e.w + 8, 10);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', e.x + e.w / 2, e.y + e.h + 30);
}

function drawCoins(ctx, game) {
  for (const coin of game.room.coins) {
    if (coin.taken) continue;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.coin;
    ctx.fill();
    ctx.strokeStyle = '#8a6d1f';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#8a6d1f';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('¢', coin.x, coin.y + 3.5);
  }
}

function drawLoot(ctx, game) {
  for (const item of game.room.loot) {
    if (item.taken) continue;
    const glow = 26 + 8 * Math.sin(game.animTime / 240);
    const g = ctx.createRadialGradient(item.x, item.y, 4, item.x, item.y, glow + 22);
    g.addColorStop(0, COLORS.lootGlow);
    g.addColorStop(1, 'rgba(255, 217, 74, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(item.x, item.y, glow + 22, 0, Math.PI * 2);
    ctx.fill();
    if (item.kind === 'diamond') {
      ctx.fillStyle = '#bfe9ff';
      ctx.beginPath();
      ctx.moveTo(item.x, item.y - 16);
      ctx.lineTo(item.x + 13, item.y);
      ctx.lineTo(item.x, item.y + 16);
      ctx.lineTo(item.x - 13, item.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (item.kind === 'painting') {
      ctx.fillStyle = '#7a5c2e';
      ctx.fillRect(item.x - 26, item.y - 18, 52, 36);
      ctx.strokeStyle = COLORS.loot;
      ctx.lineWidth = 3;
      ctx.strokeRect(item.x - 26, item.y - 18, 52, 36);
      ctx.fillStyle = COLORS.loot;
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ART', item.x, item.y + 4);
    } else {
      // A wall safe: a steel box with a dial.
      ctx.fillStyle = '#5a6b84';
      roundRect(ctx, item.x - 20, item.y - 16, 40, 32, 4);
      ctx.fill();
      ctx.strokeStyle = COLORS.loot;
      ctx.lineWidth = 2;
      roundRect(ctx, item.x - 20, item.y - 16, 40, 32, 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(item.x, item.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.loot;
      ctx.fill();
    }
    ctx.fillStyle = COLORS.loot;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.label, item.x, item.y + 34);
  }
}

function drawCones(ctx, game) {
  for (const cam of game.cameras) {
    if (cam.looped) {
      drawCone(ctx, cam.x, cam.y, cam.angle, CAMERA_CONE_RANGE, CAMERA_CONE_HALF_ANGLE,
        'rgba(150, 160, 175, 0.07)', 'rgba(150, 160, 175, 0.3)');
    } else {
      drawCone(ctx, cam.x, cam.y, cam.angle, CAMERA_CONE_RANGE, CAMERA_CONE_HALF_ANGLE,
        COLORS.cameraCone, COLORS.cameraConeEdge);
    }
  }
  for (const guard of game.guards) {
    const alert = guard.suspicion > 55 || guard.state === 'chase';
    drawCone(ctx, guard.x, guard.y, guard.facing, GUARD_CONE_RANGE, GUARD_CONE_HALF_ANGLE,
      alert ? COLORS.coneAlert : COLORS.cone, alert ? 'rgba(255, 90, 78, 0.6)' : COLORS.coneEdge);
  }
}

function drawGuards(ctx, game) {
  for (const guard of game.guards) {
    const alert = guard.suspicion > 55 || guard.state === 'chase';
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = alert ? COLORS.guardAlert : COLORS.guard;
    ctx.fill();
    ctx.strokeStyle = '#3a2c00';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Facing tick.
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.facing) * 20, guard.y + Math.sin(guard.facing) * 20);
    ctx.strokeStyle = '#3a2c00';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Suspicion: "?" while noticing, "!" when sure.
    if (guard.suspicion > 5) {
      ctx.fillStyle = alert ? '#ff5a4e' : '#ffd94a';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(alert ? '!' : '?', guard.x, guard.y - 20);
    }
    // Suspicion bar under the guard.
    if (guard.suspicion > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(guard.x - 16, guard.y + 19, 32, 5);
      ctx.fillStyle = alert ? '#ff5a4e' : '#ffd94a';
      ctx.fillRect(guard.x - 16, guard.y + 19, 32 * (guard.suspicion / 100), 5);
    }
  }
}

function drawCameras(ctx, game) {
  for (const cam of game.cameras) {
    ctx.fillStyle = cam.looped ? '#8a94a3' : COLORS.camera;
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2b1110';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cam.x, cam.y);
    ctx.lineTo(cam.x + Math.cos(cam.angle) * 16, cam.y + Math.sin(cam.angle) * 16);
    ctx.strokeStyle = cam.looped ? '#8a94a3' : COLORS.camera;
    ctx.lineWidth = 3;
    ctx.stroke();
    if (cam.looped) {
      ctx.fillStyle = '#c8d2de';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LOOPED', cam.x, cam.y + 26);
    }
  }
}

function drawThief(ctx, game) {
  const t = game.thief;
  // A soft ring so the thief reads at a glance, even in a cone.
  ctx.beginPath();
  ctx.arc(t.x, t.y, 19, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.thiefRing;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(t.x, t.y, 13, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.thief;
  ctx.fill();
  ctx.strokeStyle = '#1d2c44';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(t.x, t.y);
  ctx.lineTo(t.x + Math.cos(t.facing) * 17, t.y + Math.sin(t.facing) * 17);
  ctx.strokeStyle = '#1d2c44';
  ctx.lineWidth = 3;
  ctx.stroke();
  if (t.hasDiamond) {
    ctx.fillStyle = '#bfe9ff';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('◆', t.x, t.y - 22);
  }
}

function drawSmoke(ctx, game) {
  for (const s of game.smokes) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.smoke;
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SMOKE', s.x, s.y + 4);
  }
}

function drawTosses(ctx, game) {
  for (const toss of game.tosses) {
    ctx.beginPath();
    ctx.arc(toss.x, toss.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.coin;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(toss.x, toss.y, 12, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(245, 197, 66, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// The HUD: alarm meter front and centre, loot, coins, tools, room, timer.
function drawHud(ctx, game) {
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.strokeStyle = COLORS.hudLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, HUD_H);
  ctx.lineTo(VIEW_W, HUD_H);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText('THE MERIDIAN VAULT', 16, 24);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(game.room.name, 16, 42);

  // Alarm meter.
  const alarm = game.alarm;
  const barX = 300;
  const barW = 300;
  ctx.fillStyle = COLORS.textDim;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('ALARM', barX, 20);
  ctx.fillStyle = '#101826';
  roundRect(ctx, barX, 26, barW, 14, 7);
  ctx.fill();
  const alarmColor = alarm < 40 ? COLORS.alarmLow : alarm < 75 ? COLORS.alarmMid : COLORS.alarmHigh;
  ctx.fillStyle = alarmColor;
  if (alarm > 0.5) {
    roundRect(ctx, barX, 26, Math.max(14, (barW * alarm) / 100), 14, 7);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(`${Math.round(alarm)}%`, barX + barW + 10, 38);

  // Loot and coins.
  ctx.fillStyle = COLORS.loot;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`LOOT $${game.thief.loot}`, 700, 24);
  ctx.fillStyle = COLORS.coin;
  ctx.fillText(`COINS ${game.thief.coins}¢`, 700, 42);

  // Tools with their costs.
  ctx.fillStyle = COLORS.text;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('[1] Smoke 25¢', 880, 24);
  ctx.fillText('[2] Loop 30¢', 880, 42);
  ctx.fillText('[3] Toss 10¢', 1030, 24);
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText(`Room ${game.roomIndex + 1}/3`, 1030, 42);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(fmtTime(game.elapsed), 1190, 30);
}

function fmtTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function drawToast(ctx, game) {
  ctx.fillStyle = 'rgba(14, 20, 32, 0.88)';
  const text = game.room.intro;
  ctx.font = '15px system-ui, sans-serif';
  const w = ctx.measureText(text).width + 36;
  roundRect(ctx, (VIEW_W - w) / 2, VIEW_H - 64, w, 36, 8);
  ctx.fill();
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'center';
  ctx.fillText(text, VIEW_W / 2, VIEW_H - 41);
}

function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(8, 12, 20, 0.45)';
  ctx.fillRect(0, HUD_H, VIEW_W, 150);
  ctx.fillStyle = COLORS.loot;
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('THE MERIDIAN VAULT', VIEW_W / 2, HUD_H + 62);
  ctx.fillStyle = COLORS.text;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('One thief. Three rooms. One diamond. Do not get seen.', VIEW_W / 2, HUD_H + 96);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('WASD / arrows to move · 1 smoke · 2 loop cameras · 3 toss a coin at the mouse · M mute · P pause', VIEW_W / 2, HUD_H + 124);
  const blink = Math.sin(game.animTime / 300) > 0;
  if (blink) {
    ctx.fillStyle = COLORS.exitGlow;
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('— PRESS ENTER TO BEGIN —', VIEW_W / 2, VIEW_H - 24);
  }
}

function drawCaught(ctx, game) {
  ctx.fillStyle = 'rgba(20, 4, 6, 0.72)';
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
  ctx.fillStyle = '#ff5a4e';
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CAUGHT!', VIEW_W / 2, 330);
  ctx.fillStyle = COLORS.text;
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText(game.caughtReason, VIEW_W / 2, 372);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText(`Loot kept: $${game.thief.loot} · Room ${game.roomIndex + 1} of 3`, VIEW_W / 2, 404);
  ctx.fillStyle = COLORS.exitGlow;
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.fillText('Press R to retry this room · Press T for the title screen', VIEW_W / 2, 448);
}

function drawWin(ctx, game) {
  ctx.fillStyle = 'rgba(4, 18, 10, 0.72)';
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
  ctx.fillStyle = COLORS.exitGlow;
  ctx.font = 'bold 48px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CLEAN GETAWAY!', VIEW_W / 2, 300);
  ctx.fillStyle = COLORS.text;
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText('The Meridian Diamond is yours. The van is already moving.', VIEW_W / 2, 340);
  ctx.fillStyle = COLORS.loot;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText(`LOOT $${game.thief.loot}   +   TIME BONUS $${game.timeBonus}   =   SCORE $${game.score}`, VIEW_W / 2, 392);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText(`Finished in ${fmtTime(game.elapsed)} · Alarms raised: ${game.alarmsRaised} · Press R to run it again`, VIEW_W / 2, 430);
}

function drawPaused(ctx, game) {
  ctx.fillStyle = 'rgba(8, 12, 20, 0.6)';
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', VIEW_W / 2, 380);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('Press P to keep moving', VIEW_W / 2, 414);
}
