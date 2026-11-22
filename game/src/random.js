// random.js — one job: a small seeded RNG so a run can be replayed.
// mulberry32: tiny, fast, deterministic. The game seeds it from the URL
// (?seed=) for screenshots and from the clock for normal play.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A tiny helper bundle over one RNG stream, so call sites read plainly.
export function makeRng(seed) {
  const next = mulberry32(seed);
  return {
    next,
    // float in [min, max)
    range(min, max) {
      return min + next() * (max - min);
    },
    // integer in [min, max] inclusive
    int(min, max) {
      return Math.floor(min + next() * (max - min + 1));
    },
    // pick one element of an array
    pick(list) {
      return list[Math.floor(next() * list.length)];
    },
  };
}
