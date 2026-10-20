import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
const spec = JSON.parse(
  readFileSync(
    new URL("../apps/web/src/rendering/combat-fx.json", import.meta.url),
    "utf8",
  ),
);
const point = (angle, radius, x = 64, y = 64) => [
  (x + Math.cos(angle) * radius).toFixed(2),
  (y + Math.sin(angle) * radius).toFixed(2),
];
const sparks = (progress, color, count = 8, phase = 0) =>
  Array.from({ length: count }, (_, i) => {
    const angle = (i * Math.PI * 2) / count + phase;
    const [x, y] = point(angle, 13 + progress * 39);
    const [ex, ey] = point(angle, 19 + progress * 43);
    return `<path d="M${x} ${y} ${ex} ${ey}" stroke="${color}" stroke-width="${5 - progress * 3}" stroke-linecap="round"/>`;
  }).join("");
const ring = (radius, color, width, opacity = 1) =>
  `<circle cx="64" cy="64" r="${radius}" fill="none" stroke="${color}" stroke-width="${width}" opacity="${opacity}"/>`;
const art = {
  impactBurst: (p) =>
    `<g opacity="${1 - p * 0.8}">${ring(8 + p * 42, "#ffd978", 5 - p * 3)}${sparks(p, "#fff3c4", 7, 0.3)}<path d="M24 93Q57 ${12 + p * 22} 105 30Q74 41 43 90Z" fill="#fff8df" opacity="${1 - p}"/></g>`,
  superBurst: (p) =>
    `<g opacity="${1 - p * 0.75}">${ring(9 + p * 47, "#c495ff", 8 - p * 5)}${ring(5 + p * 37, "#ffe5a2", 3)}${sparks(p, "#ffe7a0", 12, p * 0.5)}<path d="m64 37 7 18 20 9-20 7-7 20-8-20-19-7 19-9Z" fill="#fff7d8" opacity="${1 - p}"/></g>`,
  burnLoop: (p) => {
    const sway = Math.sin(p * Math.PI * 2) * 7;
    return `<path d="M64 112C17 106 30 65 42 49c-1 15 5 21 10 23C42 40 69 30 65 10c41 28 30 44 32 53 13-3 11-16 11-16 24 45-6 69-44 65Z" fill="#ff7428"/><path d="M64 107C36 99 48 78 54 65c0 13 6 14 10 18 0-15 ${sway} -17 11-32 24 32 31 49-11 56Z" fill="#ffe69b"/><path d="m32 ${30 + p * 45} 4-7 4 7-4 7Z" fill="#ffd76a" opacity="${1 - p}"/>`;
  },
  slowLoop: (p) =>
    `<g transform="rotate(${p * 45} 64 64)">${ring(43 + Math.sin(p * Math.PI * 2) * 4, "#8deeff", 4, 0.7)}${Array.from({ length: 6 }, (_, i) => `<path d="M64 17V64M64 28l-10 9m10-9 10 9" transform="rotate(${i * 60} 64 64)" stroke="#d9fcff" stroke-width="5" stroke-linecap="round"/>`).join("")}</g>`,
  passiveBurst: (p) =>
    `<g opacity="${1 - p * 0.7}">${ring(12 + p * 40, "#7ff5ca", 4)}${sparks(p, "#c4ffed", 5, 0.8)}<path d="m64 31 9 23 24 10-24 9-9 24-10-24-23-9 23-10Z" fill="#b5ffdf" transform="rotate(${p * 50} 64 64)"/></g>`,
  healBurst: (p) =>
    `<g opacity="${1 - p * 0.7}" transform="translate(0 ${-p * 20})">${ring(18 + p * 34, "#72e7a7", 3, 0.6)}<path d="M54 35h20v19h19v20H74v19H54V74H35V54h19Z" fill="#ccffe0"/><path d="M34 93Q14 70 29 62q22 4 24 25m42 6q20-23 5-31-22 4-24 25" fill="#75dba2"/></g>`,
  shieldBurst: (p) =>
    `<g opacity="${0.9 - p * 0.45}" transform="translate(${64 * (1 - (0.6 + p * 0.4))} ${64 * (1 - (0.6 + p * 0.4))}) scale(${0.6 + p * 0.4})"><path d="M64 13 106 31v30c0 27-23 44-42 55C45 105 22 88 22 61V31Z" fill="#59b9ff" fill-opacity=".2" stroke="#b8efff" stroke-width="6"/><path d="m41 64 16 16 31-35" fill="none" stroke="#eaffff" stroke-width="7" stroke-linecap="round"/>${sparks(p, "#bcefff", 6)}</g>`,
  projectile: (p) =>
    `<path d="M6 64 60 44 51 58h19L61 72 6 64Z" fill="#fff" opacity=".35"/><ellipse cx="83" cy="64" rx="${23 + Math.sin(p * Math.PI * 2) * 3}" ry="18" fill="#fff" opacity=".22"/><path d="m63 64 19-18 34 18-34 18Z" fill="#f9fdff"/><path d="m76 64 10-8 17 8-17 8Z" fill="#fff"/>`,
};
const cells = Object.entries(spec.rows)
  .flatMap(([kind, row]) =>
    Array.from(
      { length: spec.frames },
      (_, frame) =>
        `<svg x="${frame * spec.size}" y="${row * spec.size}" width="128" height="128" viewBox="0 0 128 128" overflow="hidden">${art[kind](frame / (spec.frames - 1))}</svg>`,
    ),
  )
  .join("\n");
const folder = new URL("../apps/web/public/effects/", import.meta.url);
mkdirSync(folder, { recursive: true });
writeFileSync(
  new URL("combat-fx.svg", folder),
  `<svg xmlns="http://www.w3.org/2000/svg" width="${spec.size * spec.frames}" height="${spec.size * Object.keys(spec.rows).length}" viewBox="0 0 1024 1024">\n${cells}\n</svg>\n`,
);
console.log("Generated 64 transparent vector animation frames.");
