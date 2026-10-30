import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { MASTERY_VFX_DEFINITIONS } from "../apps/web/src/rendering/mastery-vfx-themes";
import { ROSTER } from "../packages/shared/src/catalog";

const size = 80,
  frames = 8,
  perPage = 33;
const out = new URL("../apps/web/public/effects/mastery/", import.meta.url);
mkdirSync(out, { recursive: true });
mkdirSync(new URL("../reports/mastery-vfx/", import.meta.url), {
  recursive: true,
});
const glyph = (
  d: (typeof MASTERY_VFX_DEFINITIONS)[number],
  x: number,
  y: number,
  scale: number,
  angle: number,
  opacity = 1,
) =>
  `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})" opacity="${opacity}" fill="${d.theme.color}" fill-opacity=".18" stroke="${d.theme.light}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d.theme.glyph}</g>`;
function art(
  d: (typeof MASTERY_VFX_DEFINITIONS)[number],
  p: number,
  projectile = false,
) {
  const { color, accent, light } = d.theme,
    pattern = ({splitKeep:'split',impactMine:'mine',basketMines:'mines',returnSlipper:'return',sideSlipper:'fan',envelopeFan:'fan',whirlPush:'whirl',delayedSword:'thrust',delayedSwords:'ricochet',laser:'beams',scan:'beams',crossInk:'crossBeams',crossRainbow:'crossBeams',escortBalloons:'orbit',chicken:'boomerangs',paintWings:'paint',vortexWings:'vortex',slipperWings:'slipper',followVortex:'vortex'} as Record<string,string>)[d.pattern] || d.pattern;
  const r = 13 + 28 * (1 - (1 - p) ** 2),
    a = (1 - p) ** 1.1;
  const stroke = (path: string, c = color, w = 2, opacity = a) =>
    `<path d="${path}" fill="none" stroke="${c}" stroke-width="${w}" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const orbit = (n: number) =>
    Array.from({ length: n }, (_, i) => {
      const t = (i * Math.PI * 2) / n + p * 2;
      return glyph(
        d,
        40 + Math.cos(t) * r,
        40 + Math.sin(t) * r,
        0.18 + p * 0.1,
        (i * 360) / n + p * 90,
        a,
      );
    }).join("");
  let geometry = "";
  if (['paintWings','vortexWings','slipperWings','followVortex'].includes(d.pattern))
    geometry=orbit(d.pattern==='slipperWings'?3:2)+stroke('M8 40H72M40 8V72',accent,1,a*.4)+`<circle cx="40" cy="40" r="${r}" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="4 4" opacity="${a}"/>`;
  else if (['delayedSwords','delayedSword'].includes(d.pattern))
    geometry=orbit(d.pattern==='delayedSword'?4:8)+stroke('M15 65L62 12L57 32M62 12L43 19',light,3,a);
  else if (['laser','scan','crossInk','crossRainbow'].includes(d.pattern))
    geometry=stroke('M2 40H78',light,5,a)+stroke('M5 22L75 34M5 58L75 46',color,3,a)+(d.pattern.startsWith('cross')?stroke('M40 4V76',accent,3,a):'');
  else if (["fan", "ricochet", "mines", "harvest"].includes(pattern))
    geometry = Array.from({ length: pattern === "fan" ? 3 : 5 }, (_, i) => {
      const t = (i - 2) * 0.5,
        x = 40 + Math.cos(t) * r,
        y = 40 + Math.sin(t) * r;
      return (
        stroke(
          `M${40 + Math.cos(t) * 12} ${40 + Math.sin(t) * 12}L${x} ${y}`,
          i % 2 ? accent : color,
          2.5,
        ) + glyph(d, x, y, 0.2, i * 35, a)
      );
    }).join("");
  else if (
    ["return", "throw", "echo", "tether", "chain", "constellation"].includes(
      pattern,
    )
  )
    geometry =
      stroke(
        `M8 52C${16 + p * 20} ${-8 + p * 16} ${75 - p * 15} 2 72 37S${46 - p * 20} 73 13 56`,
        color,
        3,
      ) +
      stroke(`M18 58Q52 ${62 - p * 25} 67 19`, accent, 1.8) +
      glyph(d, 20 + 40 * p, 45 - Math.sin(p * Math.PI) * 28, 0.3, 360 * p, a);
  else if (
    [
      "pierce",
      "thrust",
      "charge",
      "beams",
      "crossBeams",
      "wave",
      "harpoon",
    ].includes(pattern)
  ) {
    geometry =
      stroke(
        `M3 48Q${20 + p * 20} ${pattern === "wave" ? 6 : 38} 73 30M9 58Q43 43 74 32`,
        color,
        4,
      ) + stroke("M58 18L77 30L58 44", light, 2.8);
    if (pattern === "crossBeams")
      geometry += stroke("M14 11L66 69M9 16L71 64", accent, 2);
    if (pattern === "harpoon")
      geometry += stroke("M12 43L27 47L38 36L48 40", accent, 2);
  } else if (["sweep", "whirl", "cross", "split"].includes(pattern)) {
    geometry =
      pattern === "cross"
        ? stroke("M13 13L68 68M13 68L68 13", color, 5)
        : stroke(
            `M${10 + p * 14} 65Q${26 - p * 15} ${4 + p * 10} 70 ${18 + p * 12}`,
            color,
            5,
          );
    geometry +=
      stroke("M14 68Q41 31 72 18", light, 1.8) +
      orbit(pattern === "split" ? 4 : 3);
    if (pattern === "whirl")
      geometry += `<ellipse cx="40" cy="40" rx="${r}" ry="${r * 0.72}" fill="none" stroke="${accent}" stroke-width="2" opacity="${a}" transform="rotate(${p * 180} 40 40)"/>`;
  } else if (
    ["mine", "anchor", "fortify", "bulwark", "guard", "focus"].includes(pattern)
  ) {
    geometry =
      stroke(
        `M40 ${40 - r}L${40 + r} 40L40 ${40 + r}L${40 - r} 40Z`,
        color,
        2.4,
      ) +
      stroke(
        `M${40 - r * 0.7} ${40 - r * 0.7}H${40 + r * 0.7}V${40 + r * 0.7}H${40 - r * 0.7}Z`,
        accent,
        1.5,
      ) +
      orbit(4);
  } else if (["cleanse", "bloom", "medic", "supply"].includes(pattern)) {
    geometry =
      Array.from({ length: 5 }, (_, i) => {
        const t = i * 1.256 + p * 0.7;
        return `<ellipse cx="40" cy="${40 - r * 0.6}" rx="6" ry="${r * 0.55}" fill="${i % 2 ? accent : color}" fill-opacity="${a * 0.25}" stroke="${light}" stroke-opacity="${a}" stroke-width="1.5" transform="rotate(${(t * 180) / Math.PI} 40 40)"/>`;
      }).join("") + stroke("M40 20V60M20 40H60", accent, 2, a * 0.65);
  } else if (
    [
      "drone",
      "fanTurret",
      "mortar",
      "hunter",
      "ram",
      "brazier",
      "bank",
      "summon",
    ].includes(pattern)
  ) {
    geometry =
      stroke(`M14 56L40 ${40 - r * 0.55}L66 56L40 69Z`, color, 3) +
      stroke("M19 52L19 21M61 52V21", accent, 1.8) +
      orbit(pattern === "fanTurret" ? 3 : 4);
    if (pattern === "drone")
      geometry += stroke("M18 26H5M62 26H75M10 18V34M70 18V34", light, 3);
    if (pattern === "hunter")
      geometry += stroke("M26 42L31 54L38 43M43 43L50 54L55 42", light, 2);
  } else if (pattern === "vine") {
    geometry =
      stroke(`M4 66Q31 ${4 + p * 10} 55 20T76 44`, color, 3) +
      stroke(
        "M13 47L5 32L25 38M33 27L25 10L43 20M53 23L64 8L64 29",
        accent,
        2,
      ) +
      orbit(5);
  } else {
    geometry =
      orbit(pattern === "orbit" ? 3 : 6) +
      stroke(
        `M8 45Q40 ${10 + p * 12} 72 45M14 58Q40 ${24 + p * 12} 66 58`,
        color,
        2.5,
      );
  }
  const motes = Array.from({ length: 6 }, (_, i) => {
    const t = i * 1.047 + (d.branch + 1) * p,
      rad = 10 + p * 28;
    const x = 40 + Math.cos(t) * rad,
      y = 40 + Math.sin(t) * rad;
    return d.theme.motif === "pixel"
      ? `<rect x="${x}" y="${y}" width="3" height="3" fill="${i % 2 ? accent : light}" opacity="${a}"/>`
      : `<circle cx="${x}" cy="${y}" r="${1 + (i % 2)}" fill="${i % 2 ? accent : light}" opacity="${a}"/>`;
  }).join("");
  if (projectile) {
    const bodies:Record<string,string>={
      drone:'M14 26H66V52H14ZM5 20H27M53 20H75M16 14V26M64 14V26M30 38H50M32 52L26 64M48 52L54 64',
      fanTurret:'M18 63H62L56 44H24ZM24 44V23H31V44M37 44V17H44V44M50 44V23H57V44',
      hunter:'M6 35L15 42L20 30L45 29L53 22L55 8L62 18L69 13L68 28L77 34L70 43L61 45L56 56L60 68L51 68L45 49L31 49L25 65L16 65L20 48L11 46ZM61 29L65 30M66 38L72 37M25 34L36 38L43 34',
      ram:'M12 40A28 28 0 1 0 68 40A28 28 0 1 0 12 40M27 40A13 13 0 1 0 53 40A13 13 0 1 0 27 40M13 25L25 29M57 52L68 56',
      bodyguard:'M40 9L65 20V41Q61 62 40 72Q19 62 15 41V20ZM40 23V55M25 39H55',
      bulwark:'M40 9L65 20V41Q61 62 40 72Q19 62 15 41V20ZM40 23V55M25 39H55',
      medic:'M17 26H63V63H17ZM29 26V16H51V26M40 34V55M29 45H51',
      supply:'M12 29H68L61 16H19ZM18 29V65H62V29M30 38V56M21 47H39M49 38H58',
      bank:'M10 30L40 12L70 30ZM16 62H64M23 35V56M40 35V56M57 35V56',
      brazier:'M15 48H65L57 67H23ZM40 45Q18 35 37 11Q35 29 49 20Q67 39 40 45',
      mortar:'M17 65H65M26 60L35 31L56 18L64 28L43 42L38 60M20 49L51 57',
    };
    if(bodies[pattern])return `<path d="${bodies[pattern]}" fill="${color}" fill-opacity=".65" stroke="${light}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="40" cy="44" r="4" fill="${accent}"/>`;
    let shell = stroke("M4 34L29 40L4 46", color, 3, 0.8);
    if (["return", "throw", "boomerangs", "echo", "ricochet"].includes(pattern))
      shell = stroke(
        "M13 57Q0 21 33 17Q63 12 69 40Q71 62 43 63M13 57L13 43M13 57L27 55",
        accent,
        3,
        1,
      );
    else if (["mine", "mines", "anchor"].includes(pattern))
      shell = stroke(
        "M40 10L69 40L40 70L11 40ZM40 3V13M40 67V77M3 40H13M67 40H77",
        color,
        3,
        1,
      );
    else if (["orbit", "vortex", "whirl"].includes(pattern))
      shell = `<ellipse cx="40" cy="40" rx="34" ry="18" fill="none" stroke="${accent}" stroke-width="3" transform="rotate(-28 40 40)"/>${stroke("M17 17L25 9L29 22M57 58L66 70L73 60", color, 2, 1)}`;
    else if (["split", "fan", "fanTurret"].includes(pattern))
      shell = stroke(
        "M6 40L27 40M7 19L29 31M7 61L29 49M63 24L73 18M66 40H78M63 56L73 62",
        accent,
        3,
        1,
      );
    else if (
      ["pierce", "thrust", "charge", "beams", "crossBeams", "harpoon"].includes(
        pattern,
      )
    )
      shell =
        stroke("M3 32H33M3 48H33M52 17L77 40L52 63", accent, 3, 1) +
        (pattern === "harpoon"
          ? stroke("M58 28L45 28M58 52L45 52", color, 3, 1)
          : "");
    else if (["wave", "sweep"].includes(pattern))
      shell = stroke("M16 9Q60 40 16 71M7 17Q39 40 7 63", color, 4, 1);
    else if (["chain", "tether", "constellation"].includes(pattern))
      shell = stroke("M2 40L12 33L24 47L35 33L46 40M24 47L24 54", accent, 3, 1);
    else if (["seeker", "hunter"].includes(pattern))
      shell = stroke(
        "M9 23L34 31M9 57L34 49M60 14L70 24M70 56L60 66M70 24V56",
        accent,
        3,
        1,
      );
    return `${shell}${glyph(d, 46, 40, 0.78, pattern === "return" || pattern === "throw" ? 20 : 0)}`;
  }
  return `<g>${geometry}${glyph(d, 40, 40, 0.54 + p * 0.2, p * (d.branch === 1 ? -55 : 55), Math.min(1, a * 1.6))}${motes}<circle cx="40" cy="40" r="${Math.max(0, 5 - p * 10)}" fill="${light}" opacity="${a}"/></g>`;
}
const rows: Record<
  string,
  { page: number; row: number; projectile: [number, number] }
> = {};
for (let page = 0; page < 3; page++) {
  const entries = MASTERY_VFX_DEFINITIONS.filter((d) => d.branch === page).sort(
    (a, b) => a.characterId.localeCompare(b.characterId),
  );
  const cells = entries.flatMap((d, row) => {
    const index = MASTERY_VFX_DEFINITIONS.findIndex((e) => e.id === d.id);
    rows[d.id] = {
      page,
      row,
      projectile: [index % 11, Math.floor(index / 11)],
    };
    return Array.from(
      { length: frames },
      (_, frame) =>
        `<svg x="${frame * size}" y="${row * size}" width="${size}" height="${size}" viewBox="0 0 80 80">${art(d, (frame + 0.3) / frames)}</svg>`,
    );
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size * frames}" height="${size * perPage}">${cells.join("")}</svg>`;
  writeFileSync(new URL(`cast-${page + 1}.svg`, out), svg);
  await sharp(Buffer.from(svg))
    .webp({ lossless: true })
    .toFile(fileURLToPath(new URL(`cast-${page + 1}.webp`, out)));
}
const projectiles = `<svg xmlns="http://www.w3.org/2000/svg" width="${size * 11}" height="${size * 9}">${MASTERY_VFX_DEFINITIONS.map((d, i) => `<svg x="${(i % 11) * size}" y="${Math.floor(i / 11) * size}" width="${size}" height="${size}" viewBox="0 0 80 80">${art(d, 0.35, true)}</svg>`).join("")}</svg>`;
await sharp(Buffer.from(projectiles))
  .webp({ lossless: true })
  .toFile(fileURLToPath(new URL("projectiles.webp", out)));
const manifest = {
  size,
  frames,
  pages: Array.from(
    { length: 3 },
    (_, i) => `effects/mastery/cast-${i + 1}.webp`,
  ),
  projectiles: "effects/mastery/projectiles.webp",
  rows,
};
writeFileSync(
  new URL("../apps/web/src/rendering/mastery-vfx.json", import.meta.url),
  JSON.stringify(manifest, null, 2) + "\n",
);
const contact = MASTERY_VFX_DEFINITIONS.map(
  (d, i) =>
    `<g transform="translate(${(i % 9) * 160} ${Math.floor(i / 9) * 152})"><rect x="3" y="3" width="154" height="146" rx="10" fill="#151923"/><svg x="25" y="2" width="110" height="110" viewBox="0 0 80 80">${art(d, 0.38)}</svg><text x="80" y="119" text-anchor="middle" fill="${d.theme.light}" font-size="10">${ROSTER.find((c) => c.id === d.characterId)?.name}</text><text x="80" y="137" text-anchor="middle" fill="${d.theme.accent}" font-size="9">${d.name}</text></g>`,
).join("");
const preview = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1672"><rect width="1440" height="1672" fill="#080c13"/>${contact}</svg>`;
writeFileSync(
  new URL("../reports/mastery-vfx/contact-sheet.svg", import.meta.url),
  preview,
);
await sharp(Buffer.from(preview))
  .png()
  .toFile(
    fileURLToPath(
      new URL("../reports/mastery-vfx/contact-sheet.png", import.meta.url),
    ),
  );
console.log(
  `Generated ${MASTERY_VFX_DEFINITIONS.length} mastery VFX, ${MASTERY_VFX_DEFINITIONS.length * frames} animation frames and 99 projectile silhouettes for 33 characters.`,
);
