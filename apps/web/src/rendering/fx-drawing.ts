import type { Graphics } from "pixi.js";
import { easeOut } from "./fx-motion";

/** Small translucent tongues with a bright core, never a full portrait-sized flame. */
export function flame(
  g: Graphics,
  x: number,
  y: number,
  height: number,
  lean: number,
  alpha: number,
  angle = 0,
) {
  const w = height * 0.29,
    c = Math.cos(angle),
    s = Math.sin(angle);
  const p = (dx: number, dy: number): [number, number] => [
    x + dx * c - dy * s,
    y + dx * s + dy * c,
  ];
  const glow = p(0, -height * 0.25);
  g.circle(...glow, height * 0.5).fill({
    color: 0xff6c26,
    alpha: alpha * 0.07,
  });
  g.moveTo(...p(0, 0))
    .bezierCurveTo(
      ...p(-w * 1.5, -height * 0.12),
      ...p(-w, -height * 0.5),
      ...p(lean, -height),
    )
    .bezierCurveTo(
      ...p(lean * 0.25 + w * 0.2, -height * 0.55),
      ...p(w * 1.7, -height * 0.25),
      ...p(0, 0),
    )
    .fill({ color: 0xff8b32, alpha: alpha * 0.8 });
  g.moveTo(...p(0, -0.6))
    .bezierCurveTo(
      ...p(-w * 0.65, -height * 0.1),
      ...p(-w * 0.45, -height * 0.3),
      ...p(lean * 0.4, -height * 0.58),
    )
    .bezierCurveTo(
      ...p(w * 0.7, -height * 0.22),
      ...p(w * 0.6, 0),
      ...p(0, -0.6),
    )
    .fill({ color: 0xffe8a3, alpha });
}

export function fireRim(
  g: Graphics,
  x: number,
  y: number,
  radius: number,
  time: number,
  seed: number,
  strength = 1,
) {
  const count = strength > 1 ? 12 : 9;
  for (let j = 0; j < count; j++) {
    const cycle =
      (time * (0.035 + (j % 3) * 0.004) + j * 0.618 + seed * 0.13) % 1;
    const angle =
      (j * Math.PI * 2) / count +
      seed * 1.7 +
      Math.sin(time * 0.035 + j) * 0.12;
    const r = radius + 4 + cycle * 4;
    const px = x + Math.cos(angle) * r,
      py = y + Math.sin(angle) * r - cycle * 2;
    const flicker =
      0.8 +
      Math.sin(time * 0.55 + j * 4) * 0.12 +
      Math.sin(time * 0.91 + j) * 0.08;
    flame(
      g,
      px,
      py,
      (9 + Math.sin(cycle * Math.PI) * 9) * flicker * strength,
      Math.sin(time * 0.2 + j) * 3,
      Math.sin(cycle * Math.PI) * 0.95,
      angle + Math.PI / 2,
    );
    if (cycle > 0.45) {
      g.circle(px + Math.sin(j + time * 0.09) * 3, py - cycle * 12, 0.9).fill({
        color: 0xffcf72,
        alpha: (1 - cycle) * 0.7,
      });
    }
  }
}

export function energyRing(
  g: Graphics,
  x: number,
  y: number,
  radius: number,
  time: number,
  color: number,
  alpha = 0.5,
) {
  for (let j = 0; j < 3; j++) {
    const start = time * 0.035 + (j * Math.PI * 2) / 3;
    const r = radius + Math.sin(time * 0.12 + j * 2) * 1.3;
    g.moveTo(x + Math.cos(start) * r, y + Math.sin(start) * r)
      .arc(x, y, r, start, start + 1.3)
      .stroke({ color, width: 5, alpha: alpha * 0.09 });
    g.moveTo(x + Math.cos(start) * r, y + Math.sin(start) * r)
      .arc(x, y, r, start, start + 1.3)
      .stroke({ color, width: 1.3, alpha });
    g.circle(
      x + Math.cos(start + 1.3) * r,
      y + Math.sin(start + 1.3) * r,
      1.6,
    ).fill({ color: 0xfff4d5, alpha: alpha * 0.9 });
  }
}

export function impact(
  g: Graphics,
  x: number,
  y: number,
  progress: number,
  size: number,
  rotation: number,
  color: number,
) {
  const t = easeOut(progress),
    fade = (1 - progress) ** 2;
  for (let j = 0; j < 6; j++) {
    const angle = rotation + j * 2.39996;
    const inner = 3 + t * 16 * size,
      outer = inner + (1 - t) * (12 + (j % 3) * 5) * size;
    g.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner)
      .lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer)
      .stroke({ color, width: (1 - progress) * 2 + 0.3, alpha: fade * 0.9 });
  }
  g.circle(x, y, 3 + t * 22 * size).stroke({
    color,
    width: (1 - progress) * 1.5,
    alpha: fade * 0.4,
  });
}

export function fireBurst(
  g: Graphics,
  x: number,
  y: number,
  progress: number,
  size: number,
  seed: number,
) {
  const t = easeOut(progress),
    fade = Math.sin(Math.PI * progress) * (1 - progress);
  const radius = (10 + t * 29) * size;
  g.circle(x, y, radius).stroke({
    color: 0xffbd71,
    width: 2 * (1 - progress) + 0.5,
    alpha: fade * 0.45,
  });
  for (let j = 0; j < 9; j++) {
    const angle = (j * Math.PI * 2) / 9 + seed;
    flame(
      g,
      x + Math.cos(angle) * radius,
      y + Math.sin(angle) * radius - progress * 10,
      (6 + (j % 3) * 3) * (1 - progress * 0.6),
      Math.sin(progress * 9 + j) * 4,
      fade * 0.9,
    );
  }
}

export function supportBurst(
  g: Graphics,
  x: number,
  y: number,
  progress: number,
  size: number,
  heal: boolean,
) {
  const fade = Math.sin(progress * Math.PI) * (1 - progress);
  const color = heal ? 0x8ff0b0 : 0x99ddff;
  energyRing(
    g,
    x,
    y,
    (22 + easeOut(progress) * 12) * size,
    progress * (heal ? 40 : -40),
    color,
    fade * 0.8,
  );
  for (let j = 0; j < 5; j++) {
    const angle = (j * Math.PI * 2) / 5 + 0.5;
    const px = x + Math.cos(angle) * (18 + progress * 12) * size;
    const py = y + Math.sin(angle) * 22 * size - progress * (heal ? 24 : 8);
    const r = (1.5 + Math.sin(progress * Math.PI) * 1.5) * size;
    g.moveTo(px - r, py)
      .lineTo(px + r, py)
      .moveTo(px, py - r)
      .lineTo(px, py + r)
      .stroke({ color, width: 1.4, alpha: fade });
  }
}
