import type { Fighter } from "./types";
import { clamp, div, isqrt, normalize, UNIT, DIRECTIONS } from "./math";
export function constrain(
  f: Fighter,
  width: number,
  height: number,
  inset = 0,
  insetY = inset,
) {
  const left = inset + f.radius,
    right = width - inset - f.radius;
  const top = insetY + f.radius,
    bottom = height - insetY - f.radius;
  if (f.x <= left) {
    f.x = left;
    f.vx = Math.abs(f.vx);
  }
  if (f.x >= right) {
    f.x = right;
    f.vx = -Math.abs(f.vx);
  }
  if (f.y <= top) {
    f.y = top;
    f.vy = Math.abs(f.vy);
  }
  if (f.y >= bottom) {
    f.y = bottom;
    f.vy = -Math.abs(f.vy);
  }
  const speed = isqrt(f.vx * f.vx + f.vy * f.vy),
    max = f.stats.speed;
  if (speed > max) {
    f.vx = div(f.vx * max, speed);
    f.vy = div(f.vy * max, speed);
  }
  if (speed < 120) {
    const d = DIRECTIONS[(f.id * 7) % 32];
    f.vx = div(d[0] * max, UNIT);
    f.vy = div(d[1] * max, UNIT);
  }
  // A deterministic unsticking direction must also point into the active arena.
  if (f.x === left) f.vx = Math.abs(f.vx);
  if (f.x === right) f.vx = -Math.abs(f.vx);
  if (f.y === top) f.vy = Math.abs(f.vy);
  if (f.y === bottom) f.vy = -Math.abs(f.vy);
}
export function collide(a: Fighter, b: Fighter) {
  let dx = b.x - a.x,
    dy = b.y - a.y;
  const radius = a.radius + b.radius;
  if (
    Math.abs(dx) >= radius ||
    Math.abs(dy) >= radius ||
    dx * dx + dy * dy >= radius * radius
  )
    return;
  let distance = isqrt(dx * dx + dy * dy);
  if (!distance) {
    const d = DIRECTIONS[(a.id + b.id * 3) % 32];
    dx = d[0];
    dy = d[1];
    distance = UNIT;
  }
  const [nx, ny] = normalize(dx, dy),
    total = a.stats.mass + b.stats.mass;
  const overlap = radius - isqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
  const correctionA = div((overlap + 2) * b.stats.mass, total),
    correctionB = overlap + 2 - correctionA;
  a.x -= div(nx * correctionA, UNIT);
  a.y -= div(ny * correctionA, UNIT);
  b.x += div(nx * correctionB, UNIT);
  b.y += div(ny * correctionB, UNIT);
  const relative = div((b.vx - a.vx) * nx + (b.vy - a.vy) * ny, UNIT);
  if (relative >= 0) return;
  const restitution = clamp(div(a.stats.bounce + b.stats.bounce, 2), 80, 115);
  const impulse = div(-relative * (100 + restitution), 100);
  const ia = div(impulse * b.stats.mass, total),
    ib = div(impulse * a.stats.mass, total);
  a.vx -= div(nx * ia, UNIT);
  a.vy -= div(ny * ia, UNIT);
  b.vx += div(nx * ib, UNIT);
  b.vy += div(ny * ib, UNIT);
}
export function pairs(fighters: Fighter[], cell = 15000): [number, number][] {
  const grid = new Map<string, number[]>();
  const result: [number, number][] = [];
  for (let i = 0; i < fighters.length; i++) {
    const f = fighters[i];
    if (f.hp <= 0) continue;
    const x = Math.floor(f.x / cell),
      y = Math.floor(f.y / cell);
    for (let xx = x - 1; xx <= x + 1; xx++)
      for (let yy = y - 1; yy <= y + 1; yy++)
        for (const j of grid.get(xx + "," + yy) || []) result.push([j, i]);
    const key = x + "," + y;
    const list = grid.get(key) || [];
    list.push(i);
    grid.set(key, list);
  }
  return result.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}
export function capsuleHit(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  x: number,
  y: number,
  radius: number,
) {
  const dx = bx - ax,
    dy = by - ay,
    l = dx * dx + dy * dy;
  const t = l
    ? clamp(div(((x - ax) * dx + (y - ay) * dy) * 1024, l), 0, 1024)
    : 0;
  const ex = x - ax - div(dx * t, 1024),
    ey = y - ay - div(dy * t, 1024);
  return ex * ex + ey * ey <= radius * radius;
}
