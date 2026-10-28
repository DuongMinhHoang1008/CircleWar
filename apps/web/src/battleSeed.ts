let lastSeed = 0;

/** New attempts roll independently; replays and resumed runs reuse their saved seed. */
export function freshBattleSeed() {
  let seed = crypto.getRandomValues(new Uint32Array(1))[0];
  if (!seed || seed === lastSeed) seed = (lastSeed % 0xffff_ffff) + 1;
  lastSeed = seed;
  return seed;
}
