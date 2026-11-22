# The Meridian Vault

[![best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/0xyfann/makefun-best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/0xyfann/makefun-best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A top-down stealth heist game for make.fun's
["Make the best heist game"](https://make.fun/bounty/best-heist-game-20261122-0559)
bounty. You are Wren, a thief breaking into the Meridian Vault through
three rooms — Lobby, Gallery, Vault — past patrolling guards and sweeping
security cameras, to steal the Meridian Diamond and make a clean getaway.

- **Stealth:** guards with vision cones and suspicion meters, wall cameras
  with sweeping red cones, an alarm meter (100 = caught).
- **Tools:** Smoke (25¢), Camera Loop (30¢), Coin Toss (10¢) — bought
  with coins found in the rooms.
- **Loot:** coins (10¢), a safe ($150), a painting ($200), the Meridian
  Diamond ($500). Score is loot plus a time bonus.

## Play it

Open `game/index.html` in a desktop browser. No network needed.
Move with WASD or arrow keys, P pauses.

## Hand it in

`main.ts` (Node 22, standard library only) copies `game/` and
`screenshots/` into the output directory and writes `dossier.json`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
