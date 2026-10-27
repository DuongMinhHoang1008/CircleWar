/** Presentation only: all times are fractional engine ticks (30 per second). */
export const ARENA_LAYERS = {
  ground: 0,
  groundFx: 10,
  combat: 20,
  bodies: 30,
  portraits: 40,
  hud: 50,
  damage: 60,
} as const;

const clamp = (value: number) => Math.max(0, Math.min(1, value));
export const easeOut = (value: number) => 1 - (1 - clamp(value)) ** 3;

export function effectStyle(kind: string) {
  if (kind === "impactBurst" || kind === "slash" || kind === "clash")
    return { life: 9, alpha: 0.72, growth: 0.22, turn: 0.12, rise: 0 };
  if (kind === "shatter")
    return { life: 22, alpha: 0.65, growth: 0.48, turn: 0.3, rise: 5 };
  if (kind === "characterSuper" || kind === "superBurst")
    return { life: 26, alpha: 0.62, growth: 0.4, turn: 0.16, rise: 0 };
  if (kind === "heal" || kind === "healBurst")
    return { life: 21, alpha: 0.6, growth: 0.2, turn: 0, rise: 20 };
  return { life: 17, alpha: 0.5, growth: 0.28, turn: 0.1, rise: 8 };
}

export function effectMotion(kind: string, progress: number) {
  const p = clamp(progress),
    style = effectStyle(kind);
  // A fast attack, followed by a longer, smooth release.
  const attack = easeOut(p / 0.12);
  const release = 1 - Math.max(0, (p - 0.16) / 0.84);
  return {
    alpha: style.alpha * attack * release ** 1.5,
    scale: 0.5 + style.growth * easeOut(p),
    turn: style.turn * easeOut(p),
    rise: style.rise * easeOut(p),
  };
}

export function effectFrame(progress: number, count: number) {
  const position = clamp(progress) * Math.max(0, count - 1);
  const frame = Math.floor(position),
    fraction = position - frame;
  return {
    frame,
    next: Math.min(count - 1, frame + 1),
    mix: fraction * fraction * (3 - 2 * fraction),
  };
}

export function interpolateAngle(from: number, to: number, fraction: number) {
  return from + (((to - from + 48) % 32) - 16) * clamp(fraction);
}

export interface WeaponHeading {
  angle: number;
  target: number;
  velocity: number;
}

export function createWeaponHeading(angle: number): WeaponHeading {
  return { angle, target: angle, velocity: 0 };
}

/** Follow the sampled angle directly; a clash reverses spin in place, without easing. */
export function updateWeaponHeading(
  heading: WeaponHeading,
  target: number,
  deltaTicks: number,
  clash = false,
) {
  const wrapped = ((heading.target % 32) + 32) % 32;
  const normalized = ((target % 32) + 32) % 32;
  const previous = heading.angle;
  heading.target += ((normalized - wrapped + 48) % 32) - 16;
  heading.angle = heading.target;
  if (clash) heading.velocity = -heading.velocity;
  else if (deltaTicks > 0)
    heading.velocity =
      deltaTicks > 3 ? 0 : (heading.angle - previous) / deltaTicks;
  return heading;
}
