import { readFileSync, writeFileSync } from "node:fs";

const roster = JSON.parse(readFileSync(new URL("../packages/shared/src/catalog-data.json", import.meta.url), "utf8")).characters;
const ring = (r, color, width = 3, opacity = 1) => `<circle cx="64" cy="64" r="${r}" fill="none" stroke="${color}" stroke-width="${width}" opacity="${opacity}"/>`;
const star = (x, y, size, color) => `<path d="M${x-size} ${y}q${size} -2 ${size} -${size}q2 ${size} ${size} ${size}q-${size} 2 -${size} ${size}q-2 -${size} -${size} -${size}Z" fill="${color}"/>`;
const rays = (p, color, count = 8, phase = 0) => Array.from({ length: count }, (_, i) => {
  const a = i * Math.PI * 2 / count + phase;
  const r = 26 + p * 25;
  return `<path d="M${64+Math.cos(a)*r} ${64+Math.sin(a)*r}l${Math.cos(a)*8} ${Math.sin(a)*8}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
}).join("");
const palettes = {
  char_03: "#bc7dff", char_05: "#68dcff", char_07: "#ff8fbd", char_09: "#ffbe58", char_13: "#ef6b86",
  char_14: "#ffd56a", char_16: "#f17cdc", char_22: "#b29bff", char_24: "#f8de98", char_29: "#50e5ff",
  char_26: "#40e7e6", char_27: "#ff823b", char_28: "#ffbf62", char_30: "#ffe862",
};

// All projectiles point right. Silhouette and palette identify the owner,
// including basic shots; skills/supers use the same identity at a larger size.
const projectiles = {
  char_03: p => `<path d="M8 64Q41 ${35+p*8} 81 62Q40 78 8 64" fill="#a45aec" opacity=".4"/><g fill="#b97aff" stroke="#f4dcff" stroke-width="2"><circle cx="78" cy="54" r="12"/><circle cx="94" cy="63" r="14"/><circle cx="77" cy="76" r="12"/></g><path d="M83 46q3-16 18-17-3 14-18 17" fill="#b8ff91"/>`,
  char_05: p => `<path d="M8 62h50m-35-12h36m-33 25h29" stroke="#68dcff" stroke-width="4" opacity=".55"/><circle cx="80" cy="60" r="23" fill="#5bcfff" fill-opacity=".25" stroke="#bff7ff" stroke-width="5"/><path d="m96 77 16 16m-42-33h19m-9-10v20" stroke="#f1ffff" stroke-width="5" stroke-linecap="round"/>${star(81,60,6+p*2,"#fff")}`,
  char_07: p => `<path d="M11 64q24-${12+p*7} 50 0-25 19-50 0" fill="#ff78b9" opacity=".45"/><path d="M66 89Q51 59 74 42q25-16 38 11 10 20-7 38l-10-10-9 10-9-10Z" fill="#ffa9cb" stroke="#ffe8f3" stroke-width="3"/><ellipse cx="81" cy="59" rx="4" ry="7" fill="#642658"/><ellipse cx="99" cy="59" rx="4" ry="7" fill="#642658"/><ellipse cx="90" cy="76" rx="6" ry="8" fill="#642658"/>`,
  char_09: p => `<path d="M10 55h39M18 69h32M29 81h23" stroke="#ffc561" stroke-width="4" opacity=".5"/><g transform="rotate(${Math.sin(p*Math.PI*2)*7} 84 64)"><path d="M59 34h49v63l-8-5-8 5-8-5-8 5-8-5-9 5Z" fill="#ffe6a1" stroke="#b87827" stroke-width="3"/><path d="M69 47h27m-27 10h17m-15 19 7 7 18-20" fill="none" stroke="#d76524" stroke-width="5" stroke-linecap="round"/></g>`,
  char_13: p => `<path d="M8 66q32-19 55 0-36 16-55 0" fill="#fa6c91" opacity=".4"/><g transform="rotate(${p*24-12} 85 66)"><path d="M84 47c-25-16-39 14-18 37l18 14 19-15c21-24 5-51-19-36" fill="#ef5274" stroke="#ffd8b0" stroke-width="3"/><path d="M84 48q-1-22 23-24-3 22-23 24" fill="#8ce4a3"/><path d="M72 55q-9 5-6 17" fill="none" stroke="#fff3ce" stroke-width="4" stroke-linecap="round"/></g>`,
  char_14: p => `<path d="M12 56h34m-26 17h26" stroke="#ffe484" stroke-width="4" opacity=".5"/><g transform="rotate(${p*22-11} 86 64)"><path d="m57 51 28-17 29 17v35l-29 17-28-17Z" fill="#f8bf4e" stroke="#fff0bb" stroke-width="3"/><path d="m57 51 28 17 29-17M85 68v35M70 43l29 17" stroke="#fb667b" stroke-width="6"/><path d="M85 35c-21-1-20-18-9-17 9 1 9 17 9 17s1-18 11-17c12 2 8 18-11 17" fill="none" stroke="#ffebaa" stroke-width="4"/></g>`,
  char_16: p => `<path d="M7 66q39-${23+p*8} 105-6-20 26-87 21l22-11Z" fill="#d455c4"/><path d="M18 65q52-17 91-4" fill="none" stroke="#fff0bd" stroke-width="5" stroke-linecap="round"/><circle cx="38" cy="43" r="4" fill="#65e6ff"/><circle cx="25" cy="86" r="5" fill="#ffcd70"/><path d="m74 44 20 3 17 15-22 12-22-5Z" fill="#f69ce4" stroke="#fff2c7" stroke-width="3"/>`,
  char_22: p => `<path d="M12 65 71 34 113 63 71 92Z" fill="#a28aff" fill-opacity=".22"/><path d="m46 66 25-31 40 28-40 29Z" fill="#aa8bff" stroke="#f4ecff" stroke-width="3"/><path d="m71 35 6 30-6 27m6-27 34-2-65 3" stroke="#7bffff" stroke-width="3"/>${star(26,54+p*12,5,"#ddd4ff")}`,
  char_24: p => `<path d="M9 70q24-32 53-12-20-2-27 14 31-13 49-6" fill="none" stroke="#d8ba65" stroke-width="4" opacity=".65"/><g transform="rotate(${p*12-6} 88 64)"><path d="M59 40h51v49H59Z" fill="#fff1c9" stroke="#b98942" stroke-width="3"/><path d="M66 38v54m37-54v54" stroke="#674838" stroke-width="5"/><path d="m76 52 18 4-16 7 18 7-19 9m8-30-3 32" fill="none" stroke="#353450" stroke-width="3" stroke-linecap="round"/></g>`,
  char_29: p => `<path d="M7 58h47m-35 12h38m-20 10h20" stroke="#55dfff" stroke-width="4" opacity=".65"/><path d="m60 53 38-3 19 14-19 14-38-3 13-11Z" fill="#259acb" stroke="#a4faff" stroke-width="3"/><path d="m97 53 17 11-17 11Z" fill="#fafaff"/><path d="M66 61h26" stroke="#ff75db" stroke-width="5"/><rect x="30" y="44" width="7" height="7" fill="#f387ff"/><rect x="44" y="83" width="5" height="5" fill="#5efff2"/>`,
};

const bursts = {
  char_26: (p, superMode) => `${ring(15+p*42,"#45e9e6",superMode?6:4,1-p*.6)}${ring(10+p*30,"#bafffa",2)}<g stroke="#5de8ef" stroke-width="5" stroke-linecap="round">${Array.from({length:7},(_,i)=>`<path d="M${31+i*11} ${64-(10+Math.sin(i+p*8)*8)}v${20+Math.sin(i+p*8)*16}"/>`).join("")}</g><path d="M51 66V35l28-6v30m-28-18 28-6" fill="none" stroke="#fff0a3" stroke-width="5"/><ellipse cx="45" cy="69" rx="9" ry="6" fill="#fff0a3"/><ellipse cx="73" cy="62" rx="9" ry="6" fill="#fff0a3"/>${superMode?rays(p,"#92fff4",10,p):""}`,
  char_27: (p, superMode) => `<g transform="rotate(${p*45} 64 64)">${ring(22+p*29,"#ff823b",superMode?8:5,1-p*.6)}${rays(p,"#ffd077",10)}</g><path d="M65 104C23 96 41 62 48 53c-2 17 10 17 12 26-5-30 13-42 8-57 28 24 26 36 20 51 11-3 15-16 15-16 12 29-6 49-38 47Z" fill="#ff6535"/><path d="M66 97C45 92 57 74 63 65c-2 15 9 16 12 5 17 17 8 29-9 27" fill="#fff0a2"/>${superMode?ring(46+p*12,"#ffc95e",3):""}`,
  char_28: (p, superMode) => `${ring(16+p*37,"#f6a44c",4,1-p*.65)}<g transform="rotate(${p*32-16} 64 64)"><path d="m41 33 13 12 20-1 15-13 2 24 9 14-8 29-28 15-29-15-8-28 12-15Z" fill="#d64b46" fill-opacity=".4" stroke="#ffce76" stroke-width="4"/><path d="M45 81q19-28 38 0l-7 13H53Z" fill="#ffcb69"/><ellipse cx="44" cy="62" rx="6" ry="9" fill="#fff0b5"/><ellipse cx="58" cy="54" rx="6" ry="9" fill="#fff0b5"/><ellipse cx="73" cy="54" rx="6" ry="9" fill="#fff0b5"/><ellipse cx="87" cy="62" rx="6" ry="9" fill="#fff0b5"/></g>${superMode?rays(p,"#ffeb95",8,p):""}`,
  char_29: (p, superMode) => `<g opacity="${1-p*.45}"><rect x="${25-p*10}" y="${28-p*10}" width="${78+p*20}" height="${72+p*20}" rx="8" fill="#167fa5" fill-opacity=".15" stroke="#6bf5ff" stroke-width="4"/><path d="m31 84 21-26 19 15 28-37" fill="none" stroke="#f587ef" stroke-width="5" stroke-linejoin="round"/><path d="m78 29 15 8-38 64-13 5 1-14Z" fill="#c5ffff" stroke="#2da6d8" stroke-width="3"/></g>${Array.from({length:6},(_,i)=>`<rect x="${17+i*17}" y="${20+(i%2?82:-5)*p}" width="5" height="5" fill="${i%2?'#fa8adf':'#70f6ff'}"/>`).join("")}${superMode?ring(38+p*20,"#e283ff",3):""}`,
  char_30: (p, superMode) => `${ring(15+p*40,"#ffe269",superMode?6:3,1-p*.6)}<path d="M64 76C32 58 24 39 40 32c13-6 22 8 24 23 2-15 11-29 24-23 16 7 8 26-24 44Z" fill="#ffe777" stroke="#fff5c6" stroke-width="3"/><path d="M64 76q-14 9 0 17t0 18" fill="none" stroke="#ff80d0" stroke-width="5"/>${star(36-p*20,65,7,"#7deaff")}${star(94+p*14,77,7,"#ff8fd7")}${rays(p,"#ffe898",7,p)}${superMode?`<path d="M19 92Q64 ${10-p*15} 110 92" fill="none" stroke="#ff90d6" stroke-width="6"/><path d="M25 95Q64 25 104 95" fill="none" stroke="#7befff" stroke-width="4"/>`:""}`,
};
const frames = 8, size = 128;
const rows = {}, cells = [], preview = [];
let row = 0;
function addRow(id, kind, render) {
  rows[`${id}:${kind}`] = row;
  for (let frame=0;frame<frames;frame++) cells.push(`<svg x="${frame*size}" y="${row*size}" width="128" height="128" viewBox="0 0 128 128">${render(frame/(frames-1))}</svg>`);
  preview.push(`<g transform="translate(${(preview.length%5)*180} ${Math.floor(preview.length/5)*170})"><rect width="176" height="166" rx="10" fill="#141922"/><svg x="24" y="7" width="128" height="128" viewBox="0 0 128 128">${render(.38)}</svg><text x="88" y="151" fill="#e4ebf4" font-size="12" text-anchor="middle">${id} · ${kind}</text></g>`);
  row++;
}
for (const [id, render] of Object.entries(bursts)) { addRow(id,"skill",p=>render(p,false)); addRow(id,"super",p=>render(p,true)); }
roster.forEach((c,index)=>{if (["ranger","frost"].includes(c.base)) {const id=`char_${String(index+1).padStart(2,"0")}`;if(!projectiles[id]) throw Error(`Missing projectile art: ${id}`);addRow(id,"projectile",projectiles[id]);}});
writeFileSync(new URL("../apps/web/public/effects/character-fx.svg",import.meta.url),`<svg xmlns="http://www.w3.org/2000/svg" width="${frames*size}" height="${row*size}" viewBox="0 0 ${frames*size} ${row*size}">${cells.join("\n")}</svg>\n`);
writeFileSync(new URL("../apps/web/src/rendering/character-fx.json",import.meta.url),JSON.stringify({size,frames,rows,palettes},null,2)+"\n");
writeFileSync(new URL("../reports/character-fx-preview.svg",import.meta.url),`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="${Math.ceil(row/5)*170}" viewBox="0 0 900 ${Math.ceil(row/5)*170}">${preview.join("")}</svg>`);
console.log(`Generated ${row*frames} character animation frames: 5 skill/super sets and ${Object.keys(projectiles).length} unique ranged projectiles.`);
