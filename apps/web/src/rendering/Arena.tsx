import { useEffect, useRef, useState } from "react";
import {
  collectDamageNumbers,
  collectConstructDamageNumbers,
  damageNumberMotion,
  DAMAGE_NUMBER_LIFE,
  DAMAGE_NUMBER_LIMIT,
  DAMAGE_PALETTE,
  SUPPORT_PALETTE,
  COMBAT_PALETTE,
  COMBAT_NUMBER_TYPES,
  collectSupportNumbers,
  isRecoveryNumber,
  type DamageNumber,
} from "./damage-numbers";
import {
  Application,
  Graphics,
  Text,
  Assets,
  Sprite,
  Texture,
  Rectangle,
  Container,
} from "pixi.js";
import {
  calculateBattleResult,
  calculateStateHash,
  createBattle,
  ENGINE_VERSION,
  safeBounds,
  weaponCount,
  weaponReach,
  stepBattle,
  closingTempo,
  STATUS_RULES,
  type ReplayFrame,
  type BattleConfig,
  type BattleState,
} from "../../../../packages/battle-engine/src/index";
import { CHARACTERS } from "../../../../packages/shared/src/balance";
import type { ReplayInfo } from "../../../../packages/shared/src/room";
import { characterKit } from "../../../../packages/shared/src/character-kits";
import {
  character,
  BONDS,
  FRIEND_GROUPS,
  CHARACTER_IDS,
  isTransformedCharacter,
  type CharacterId,
} from "../../../../packages/shared/src/catalog";
import {
  avatar,
  Portrait,
  weaponArtUrl,
  weaponAtlasUrl,
  weaponFrame,
} from "../GameCatalog";
import type { Fighter } from "../../../../packages/battle-engine/src/types";
import { loadKitArt, characterFxFamily } from "./kit-art";
import { TEAM_COLORS } from "./team-colors";
import {
  energyRing,
  fireRim,
  fireBurst,
  impact,
  supportBurst,
} from "./fx-drawing";
import {
  ARENA_LAYERS,
  effectFrame,
  effectMotion,
  effectStyle,
  interpolateAngle,
  createWeaponHeading,
  updateWeaponHeading,
  type WeaponHeading,
} from "./fx-motion";
import {
  loadCombatFx,
  loadCharacterFx,
  characterFxColor,
  isCombatFx,
  type CombatFxKind,
  type CharacterFxFrames,
} from "./combat-fx";
import { createBattleRecorder, type BattleSummary } from "../battleAnalytics";
const colors = TEAM_COLORS.map((color) => color.value);
const fxArt = {
  slash: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><path d="M14 94Q49 18 112 24 82 43 59 70 39 91 14 94Z" fill="#ffe5a0" fill-opacity=".82"/><path d="M18 96Q57 44 109 25" fill="none" stroke="#fff8d6" stroke-width="7" stroke-linecap="round"/><path d="m32 73 9 2-7 8m33-34 8 2-7 7m19-24 8 2-7 7" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="m19 24 4 9 9 4-9 4-4 9-4-9-9-4 9-4zM103 79l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" fill="#fff4c5"/></svg>`,
  shatter: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><path d="m56 53 9-38 13 35-10 11zM66 69l36-21-20 33-17-3zM57 70l-8 41-13-35 11-12zM48 60 13 43l38 3 7 10zM75 81l23 26-35-16-1-9zM44 49 30 16l24 27-5 8zM54 79l-7 31-8-24z" fill="#ff7989" stroke="#ffe8bc" stroke-width="3" stroke-linejoin="round"/><path d="m29 69-9 9m77-42 10-8m-51 69-2 13" stroke="#fff5d9" stroke-width="4" stroke-linecap="round"/></svg>`,
  bond: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><path d="M64 102 27 68C5 48 33 19 53 39l11 11 11-11c20-20 48 9 26 29z" fill="#ec73ba" stroke="#ffe6f5" stroke-width="5"/><path d="M18 30 31 43m79 42-13 13M64 11v17m0 72v17" stroke="#fff1bb" stroke-width="5" stroke-linecap="round"/></svg>`,
  group: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><circle cx="64" cy="65" r="15" fill="#ffe39a"/><circle cx="33" cy="46" r="11" fill="#69d9b6"/><circle cx="95" cy="46" r="11" fill="#72c7ff"/><circle cx="33" cy="87" r="11" fill="#ff86a7"/><circle cx="95" cy="87" r="11" fill="#b49aff"/><path d="M41 57 53 63m34-6-12 6M42 79l11-8m33 8-11-8" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>`,
  utility: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><path d="m64 13 12 33 34 2-26 21 9 33-29-19-29 19 9-33-26-21 34-2z" fill="#a2f1e0" stroke="#edfff5" stroke-width="4" stroke-linejoin="round"/><circle cx="64" cy="64" r="8" fill="#fff"/></svg>`,
  heal: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><path d="M64 103V57m0 30C30 90 19 63 24 39c28 0 45 16 40 48zm0-14c2-33 24-51 51-48 5 29-14 49-51 55" fill="#82dfa0" stroke="#eaffd5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M64 72c-17-22-5-42 8-47 12 13 8 32-8 47z" fill="#ffe5a1" stroke="#fff7d5" stroke-width="3"/><path d="m23 24 4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#fff"/></svg>`,
  shield: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><path d="M64 13 101 27v29c0 28-17 45-37 59C44 101 27 84 27 56V27z" fill="#8ecfff" fill-opacity=".58" stroke="#e7f8ff" stroke-width="5" stroke-linejoin="round"/><path d="M64 28 87 37v19c0 18-10 30-23 40-13-10-23-22-23-40V37z" fill="none" stroke="#fff4c7" stroke-width="3"/><path d="m64 39 5 14 15 1-12 9 4 15-12-9-12 9 4-15-12-9 15-1z" fill="#fff3bd"/></svg>`,
  bolt: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M10 40 47 7 35 29h19L17 58l12-18z" fill="#ffd984" stroke="#fff7d8" stroke-width="4" stroke-linejoin="round"/><path d="m12 15 4 8 8 3-8 3-4 8-3-8-8-3 8-3z" fill="#fff"/></svg>`,
  zone: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><path d="M80 15c8 10 12 14 22 11-3 12-1 17 10 22-12 4-15 9-13 21-10-7-16-7-25 1-1-12-5-17-17-18 9-8 10-14 4-24 12 2 18-1 19-13zm0 97c8 10 12 14 22 11-3 12-1 17 10 22-12 4-15 9-13 21-10-7-16-7-25 1-1-12-5-17-17-18 9-8 10-14 4-24 12 2 18-1 19-13z" fill="#ff789f" fill-opacity=".68" stroke="#ffe2b9" stroke-width="3"/><path d="M80 13c38 0 67 29 67 67s-29 67-67 67-67-29-67-67 29-67 67-67z" fill="none" stroke="#ffbdd0" stroke-width="4" stroke-dasharray="2 9"/><path d="M43 80c12-18 25-23 37-23s25 5 37 23c-12 18-25 23-37 23S55 98 43 80z" fill="none" stroke="#fff1bc" stroke-width="4"/></svg>`,
  warn: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><path d="M64 17c7 13 14 20 29 22-9 11-11 20-7 34-14-4-23-2-34 7-2-15-9-22-22-29 13-7 20-14 22-29z" fill="#ffc960" fill-opacity=".45" stroke="#fff0be" stroke-width="4"/><path d="m64 37 4 23 16 10-20-3-20 9 13-16z" fill="#fff3cc" stroke="#fff" stroke-width="2"/></svg>`,
  clash: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><path d="m20 22 86 84M107 20 21 106" fill="none" stroke="#f5a623" stroke-width="15" stroke-linecap="round"/><path d="m20 22 86 84M107 20 21 106" fill="none" stroke="#fff5c9" stroke-width="7" stroke-linecap="round"/><path d="m64 7 5 21 20-10-10 20 22 4-22 8 15 17-23-4-7 23-8-22-18 16 5-23-22-7 22-8-15-18 23 5z" fill="#fff4bd" stroke="#fff" stroke-width="3"/><path d="m16 51-9-7m114 39 8 7M53 13l-2-10m27 112 2 10" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>`,
};
type FxKind = keyof typeof fxArt;
type CharacterFxKind = "characterSkill" | "characterSuper" | "characterItem";
type EffectKind = FxKind | CharacterFxKind | CombatFxKind;
type CharacterFxSpec = {
  color: string;
  light: string;
  skill: string;
  super: string;
};

// Each character gets two separately loaded SVG textures. The hand-authored
// emblems and palettes make their skill and Super effects readable at a glance.
const characterFxArt: Partial<Record<CharacterId, CharacterFxSpec>> = {
  char_01: {
    color: "#f28b45",
    light: "#fff0b5",
    skill: `<path d="M31 67 24 48l18 9 10-17 9 18 20-8-8 20 18 11-22 4-6 20-13-17-20 7 8-20z" fill="currentColor"/><path d="m42 62 8 2m6 2 8-2M47 74l9 4 9-4" fill="none" stroke="#fff9dd" stroke-width="4" stroke-linecap="round"/>`,
    super: `<path d="M29 72c-4-28 11-43 35-39 23 4 38 26 30 47-5 13-19 23-37 23-14 0-25-10-28-31z" fill="currentColor"/><path d="M39 62 50 57l10 5m7 0 10-5 11 5M51 80l11 5 11-5M21 39l10 13m76-12L94 53M25 91l17-7m58 7-17-7" fill="none" stroke="#fff9dd" stroke-width="5" stroke-linecap="round"/>`,
  },
  char_02: {
    color: "#ff8fbd",
    light: "#fff1f7",
    skill: `<path d="M64 100S27 78 27 52c0-18 23-25 37-7 14-18 37-11 37 7 0 26-37 48-37 48z" fill="currentColor"/><path d="M20 81c10-10 18-12 28-9m60 9c-10-10-18-12-28-9" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`,
    super: `<path d="M64 99 28 66c-19-18 5-46 25-28l11 10 11-10c20-18 44 10 25 28z" fill="currentColor"/><path d="M12 64h21m82 0H94M25 35l16 13m62-13L87 48M32 103l17-16m47 16L80 87" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="64" cy="61" r="9" fill="#fff1f7"/>`,
  },
  char_03: {
    color: "#9d59dd",
    light: "#e9d4ff",
    skill: `<path d="M64 35c-19 0-34 18-34 37s15 31 34 31 34-12 34-31-15-37-34-37z" fill="currentColor"/><path d="M62 37c4-15 16-19 29-16-5 12-14 18-27 18M48 60h1m15-7h1m15 11h1m-27 21c10 7 20 7 30 0" fill="none" stroke="#f4eaff" stroke-width="5" stroke-linecap="round"/>`,
    super: `<path d="M64 28c-24 0-43 20-43 44 0 20 19 34 43 34s43-14 43-34c0-24-19-44-43-44z" fill="currentColor"/><path d="M55 29c4-18 22-25 40-17-8 15-23 22-41 19M42 57h2m18-7h2m18 7h2M47 82c11 11 23 11 34 0" fill="none" stroke="#fff1c7" stroke-width="5" stroke-linecap="round"/><circle cx="64" cy="67" r="7" fill="#fff1c7"/>`,
  },
  char_04: {
    color: "#49c8e9",
    light: "#d8f9ff",
    skill: `<path d="m24 76 17-5 17-28 12 8-9 19 25-5 17 11-18 17-42-2-22-7z" fill="currentColor"/><path d="m27 92 58 4m-48-14 41 4" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`,
    super: `<path d="M20 77c10-3 21-4 30-18l18-30 17 10-12 24 33-7 16 17-22 25-55-1-25-8z" fill="currentColor"/><path d="m13 45 22 6M12 61l16 4m81-31-14 17M28 107l25-4" stroke="#fff1bd" stroke-width="5" stroke-linecap="round"/>`,
  },
  char_05: {
    color: "#79caff",
    light: "#f3fbff",
    skill: `<circle cx="58" cy="64" r="28" fill="none" stroke="currentColor" stroke-width="10"/><path d="m79 84 24 24M54 52c18-10 30 5 20 17-5 6-14 4-19 12" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/><circle cx="55" cy="91" r="4" fill="#fff"/>`,
    super: `<circle cx="57" cy="62" r="36" fill="none" stroke="currentColor" stroke-width="11"/><path d="m82 87 29 29M46 51c18-16 42-1 30 15-6 8-18 5-22 16m8-44v-9m35 33h10M29 68H17" fill="none" stroke="#fff1b5" stroke-width="6" stroke-linecap="round"/><circle cx="53" cy="88" r="5" fill="#fff1b5"/>`,
  },
  char_06: {
    color: "#ff70a6",
    light: "#fff3a6",
    skill: `<path d="M31 28h67L79 50l19 21H31l20-21z" fill="currentColor"/><path d="M64 50v48m0-2c-18 0-27 8-27 18h54c0-10-9-18-27-18" fill="none" stroke="#fff2a6" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="45" cy="40" r="5" fill="#fff"/><circle cx="83" cy="61" r="5" fill="#fff"/>`,
    super: `<path d="M20 22h88L81 52l27 31H20l27-31z" fill="currentColor"/><path d="M64 50v47m0 0c-20 0-32 9-32 22h64c0-13-12-22-32-22" fill="none" stroke="#fff0a8" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="m18 75 9 4-9 4m92-46 9 4-9 4M36 17l4 8 8 3-8 3-4 8-3-8-8-3 8-3z" fill="#fff"/>`,
  },
  char_07: {
    color: "#ff7898",
    light: "#fff1e8",
    skill: `<path d="M28 53 22 26l27 14c10-5 20-5 30 0l27-14-6 28c9 24-4 49-36 49S19 77 28 53z" fill="currentColor"/><path d="m45 62 9 4m20 0 9-4M53 82l11 8 11-8" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="m19 66-10-5m109 5 10-5" stroke="#fff1e8" stroke-width="5"/>`,
    super: `<path d="M25 49 17 18l34 18c9-4 19-4 28 0l34-18-8 31c14 31-4 61-41 61S11 80 25 49z" fill="currentColor"/><path d="M11 46 0 40m117 6 11-6M13 86 1 91m114-5 12 5M46 60l9 5m18 0 9-5M53 83l11 10 11-10" fill="none" stroke="#fff5c9" stroke-width="6" stroke-linecap="round"/>`,
  },
  char_08: {
    color: "#9875ed",
    light: "#f1eaff",
    skill: `<path d="M22 90 39 36l21 19 20-25 27 56-24-14-18 24-15-21z" fill="currentColor"/><path d="M45 66 58 75m11-2 15-13M64 15v17m-37 4 13 12m67-12L95 48" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`,
    super: `<path d="M16 89 37 25l25 23 25-34 28 77-29-17-21 29-18-25z" fill="currentColor"/><path d="M48 62 62 73m9-4 18-18M64 8v18M24 20l15 16m66-16L90 36" stroke="#fff2bc" stroke-width="6" stroke-linecap="round"/><circle cx="99" cy="97" r="10" fill="#fff2bc"/>`,
  },
  char_09: {
    color: "#f4a447",
    light: "#fff2bf",
    skill: `<rect x="29" y="27" width="70" height="76" rx="9" fill="currentColor"/><path d="M45 19v18m38-18v18M42 54h44M43 72h12m9 0h21m-42 16h12m9 0h21" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="m78 68 7 7 14-18" fill="none" stroke="#fff2bf" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
    super: `<rect x="23" y="25" width="82" height="82" rx="12" fill="currentColor"/><path d="M43 16v22m42-22v22M38 53h52M41 73h11m10 0h22m-43 19h11m10 0h22" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/><path d="m71 69 10 10 18-23M18 47l-9-9m105 9 9-9M19 99l-9 9m99-9 9 9" fill="none" stroke="#fff2bf" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  char_10: {
    color: "#ffb84a",
    light: "#fff2c6",
    skill: `<circle cx="64" cy="66" r="36" fill="currentColor"/><circle cx="64" cy="66" r="15" fill="#201d23" stroke="#fff2c6" stroke-width="6"/><path d="m35 37 12 11m34 35 12 11M93 37 81 49M35 95l12-12" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`,
    super: `<circle cx="64" cy="66" r="43" fill="currentColor"/><circle cx="64" cy="66" r="20" fill="#201d23" stroke="#fff2c6" stroke-width="7"/><path d="m64 9 5 15 16-2-10 13 9 14-17-5-8 15-4-17-17-1 14-10-5-16 15 8z" fill="#fff2c6"/><path d="m27 31 13 13m48 44 13 13m-5-70L83 44M27 101l13-13" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`,
  },
  char_11: {
    color: "#5bd6a2",
    light: "#fff2a6",
    skill: `<path d="M33 27h65L78 49l20 22H33l19-22z" fill="currentColor"/><path d="M64 48v54m0-1-17 15m17-15 17 15" fill="none" stroke="#fff2a6" stroke-width="7" stroke-linecap="round"/><path d="m64 42 5 10 11 2-8 7 2 11-10-5-10 5 2-11-8-7 11-2z" fill="#fff2a6"/>`,
    super: `<path d="M22 21h83L80 51l25 31H22l25-31z" fill="currentColor"/><path d="M64 49v57m0 0-21 17m21-17 21 17" fill="none" stroke="#fff2a6" stroke-width="8" stroke-linecap="round"/><path d="m64 38 7 14 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z" fill="#fff2a6"/><path d="m14 68-7 6 7 6m100-12 7 6-7 6" fill="none" stroke="#fff" stroke-width="5"/>`,
  },
  char_12: {
    color: "#ecf1fa",
    light: "#ffe6a0",
    skill: `<path d="m30 89 57-61 10 10-57 61-17 7z" fill="currentColor"/><path d="m79 36 14 13M23 88l16 15m-26-8 13-3m-9-14 11 11" fill="none" stroke="#ffe6a0" stroke-width="6" stroke-linecap="round"/><path d="M34 31 20 19m72 86 14 13" stroke="#fff" stroke-width="5"/>`,
    super: `<path d="m19 91 69-72 14 13-69 72-20 10z" fill="currentColor"/><path d="m77 32 20 18M17 80l22 22m-32-6 17-6m-12-17 22 22M21 29l18 18m55 43 17 17" fill="none" stroke="#ffe6a0" stroke-width="7" stroke-linecap="round"/>`,
  },
  char_13: {
    color: "#e94e6f",
    light: "#fff0ad",
    skill: `<path d="M64 39c-16-16-33-7-33 12 0 23 33 48 33 48s33-25 33-48c0-19-17-28-33-12z" fill="currentColor"/><path d="M65 39c-1-18 10-28 28-27-4 15-14 25-28 27m-1 8c-12-15-24-14-31-9m31 23c13-14 25-14 34-8" fill="none" stroke="#fff0ad" stroke-width="5" stroke-linecap="round"/>`,
    super: `<path d="M64 31c-20-20-43-9-43 16 0 29 43 61 43 61s43-32 43-61c0-25-23-36-43-16z" fill="currentColor"/><path d="M64 32c-1-22 13-35 36-32-5 19-18 31-36 32m0 14C49 28 34 29 23 37m41 23c17-19 34-18 47-10M29 106l14-12m56 12L85 94" fill="none" stroke="#fff0ad" stroke-width="6" stroke-linecap="round"/>`,
  },
  char_14: {
    color: "#f2c85b",
    light: "#fff7d7",
    skill: `<path d="M27 46 64 27l37 19v48l-37 20-37-20z" fill="currentColor"/><path d="M27 46 64 66l37-20M64 66v48M46 37l37 20" fill="none" stroke="#fff" stroke-width="6" stroke-linejoin="round"/><path d="m64 48 5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#fff7d7"/>`,
    super: `<path d="M20 44 64 20l44 24v55l-44 25-44-25z" fill="currentColor"/><path d="M20 44 64 69l44-25M64 69v55M41 32l46 26" fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round"/><path d="m64 44 7 16 17 2-13 11 4 17-15-9-15 9 4-17-13-11 17-2zM12 21l3 8 8 3-8 3-3 8-3-8-8-3 8-3zM113 22l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#fff7d7"/>`,
  },
  char_15: {
    color: "#72d1a7",
    light: "#efffd9",
    skill: `<path d="M64 17 96 29v27c0 23-14 37-32 51-18-14-32-28-32-51V29z" fill="currentColor"/><path d="M49 58c0-11 9-17 15-7 6-10 15-4 15 7 0 10-15 21-15 21S49 68 49 58z" fill="#efffd9"/><path d="m45 40 9 7m29-7-9 7" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`,
    super: `<path d="M64 9 106 25v34c0 29-19 47-42 64-23-17-42-35-42-64V25z" fill="currentColor"/><path d="M44 60c0-16 13-24 20-10 7-14 20-6 20 10 0 14-20 30-20 30S44 74 44 60z" fill="#efffd9"/><path d="m38 38 14 10m38-10L76 48M64 30v10" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`,
  },
  char_16: {
    color: "#df69cf",
    light: "#fff3a8",
    skill: `<path d="m29 91 47-61 17 13-47 61-22 8z" fill="currentColor"/><path d="m75 36 15 12M24 99l18 14m-17-3 23-5m-15-5 18-5" fill="none" stroke="#fff3a8" stroke-width="6" stroke-linecap="round"/><path d="m97 25 3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#fff"/>`,
    super: `<path d="m19 92 57-74 20 15-57 74-27 10z" fill="currentColor"/><path d="m73 26 19 15M15 102l20 16m-15-1 32-7m-24-4 28-9m33-76 3 10 10 3-10 4-3 10-4-10-10-4 10-3z" fill="none" stroke="#fff3a8" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  char_17: {
    color: "#45c5e8",
    light: "#fff0a8",
    skill: `<rect x="28" y="36" width="67" height="60" rx="7" fill="currentColor"/><path d="M28 54h67M62 36v60M20 24l13 4-13 5m73-16 13 4-13 5M12 75l12 4-12 5" fill="none" stroke="#fff0a8" stroke-width="6" stroke-linecap="round"/><path d="m49 66 10 9 19-22" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
    super: `<rect x="21" y="34" width="82" height="70" rx="9" fill="currentColor"/><path d="M21 54h82M62 34v70M11 18l19 5-19 6m83-16 19 5-19 6M7 77l19 5-19 6" fill="none" stroke="#fff0a8" stroke-width="7" stroke-linecap="round"/><path d="m46 69 13 12 24-29" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  char_18: {
    color: "#fa7056",
    light: "#fff0b3",
    skill: `<path d="M24 62h80l-8 33c-3 12-12 18-32 18s-29-6-32-18z" fill="currentColor"/><path d="M18 59h92m-71-9c-9-13 8-17 0-30m24 30c-9-13 8-17 0-30m24 30c-9-13 8-17 0-30" fill="none" stroke="#fff0b3" stroke-width="6" stroke-linecap="round"/><path d="M42 78h44" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`,
    super: `<path d="M15 60h98l-10 40c-4 15-16 22-39 22s-35-7-39-22z" fill="currentColor"/><path d="M11 57h106M35 47c-12-16 11-20 0-37m28 37c-12-16 11-20 0-37m28 37c-12-16 11-20 0-37" fill="none" stroke="#fff0b3" stroke-width="7" stroke-linecap="round"/><path d="M39 81h50m-44 15h38" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`,
  },
  char_19: {
    color: "#ed5a69",
    light: "#ffdb8c",
    skill: `<path d="M22 58 64 32l42 26-42 26z" fill="currentColor"/><path d="M22 58v38l42 24 42-24V58M64 84v36M64 32c-23 0-23-23-8-23 10 0 12 14 8 23zm0 0c23 0 23-23 8-23-10 0-12 14-8 23z" fill="none" stroke="#ffdb8c" stroke-width="6" stroke-linejoin="round"/><path d="m37 64 27 16 27-16" stroke="#fff" stroke-width="5"/>`,
    super: `<path d="M13 57 64 25l51 32-51 31z" fill="currentColor"/><path d="M13 57v45l51 28 51-28V57M64 88v42M64 25C36 25 35 0 54 0c12 0 15 16 10 25zm0 0c28 0 29-25 10-25-12 0-15 16-10 25z" fill="none" stroke="#ffdb8c" stroke-width="7" stroke-linejoin="round"/><path d="m28 64 36 21 36-21M23 19l4 10 10 4-10 4-4 10-4-10-10-4 10-4zM105 18l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="#fff"/>`,
  },
  char_20: {
    color: "#f05a94",
    light: "#fff0bd",
    skill: `<path d="M64 99c-28-17-38-37-23-50 10-9 20-3 23 8 3-11 13-17 23-8 15 13 5 33-23 50z" fill="currentColor"/><path d="M63 92c-2-24 8-42 27-55m-32 37c-11-8-21-8-31-2m40 15c12-8 23-8 34-2" fill="none" stroke="#fff0bd" stroke-width="5" stroke-linecap="round"/>`,
    super: `<path d="M64 111c-37-22-50-48-30-66 14-12 27-4 30 10 3-14 16-22 30-10 20 18 7 44-30 66z" fill="currentColor"/><path d="M63 104c-3-32 10-57 37-75m-44 48c-15-11-29-10-42-2m56 29c16-11 31-10 45-2" fill="none" stroke="#fff0bd" stroke-width="6" stroke-linecap="round"/><path d="m17 39 4 9 9 4-9 4-4 9-4-9-9-4 9-4zM108 87l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="#fff"/>`,
  },
};

function characterFxSvg(id: CharacterId, kind: "skill" | "super" | "item") {
  const art = characterFxArt[id] || {
    color: "#78b9ff",
    light: "#fff0bd",
    skill:
      '<path d="M64 18 76 50l34 14-34 14-12 32-12-32-34-14 34-14z" fill="currentColor"/>',
    super:
      '<path d="M64 8 80 43l38 5-28 26 7 39-33-20-33 20 7-39L20 48l38-5z" fill="currentColor"/>',
  };
  const superMode = kind === "super",
    itemMode = kind === "item";
  const frame = superMode
    ? `<path d="M64 5 73 20l18-9 1 19 20 1-9 18 15 11-15 12 9 18-20 1-1 19-18-9-9 15-12-15-18 9-1-19-20-1 9-18L7 64l15-11-9-18 20-1 1-19 18 9z" fill="none" stroke="${art.light}" stroke-width="3" stroke-linejoin="round"/><circle cx="64" cy="64" r="48" fill="${art.color}" fill-opacity=".2" stroke="${art.color}" stroke-width="3" stroke-dasharray="5 7"/>`
    : itemMode
      ? `<path d="M64 9 77 18l17-4 4 17 15 10-7 17 7 17-15 10-4 17-17-4-13 9-13-9-17 4-4-17-15-10 7-17-7-17 15-10 4-17 17 4z" fill="none" stroke="${art.light}" stroke-width="3" stroke-linejoin="round"/><circle cx="64" cy="64" r="43" fill="${art.color}" fill-opacity=".2" stroke="#ffe8a3" stroke-width="4"/>`
      : `<circle cx="64" cy="64" r="48" fill="${art.color}" fill-opacity=".16" stroke="${art.light}" stroke-width="3" stroke-dasharray="16 9"/><circle cx="64" cy="64" r="39" fill="none" stroke="${art.color}" stroke-width="2"/>`;
  const glyph = superMode ? art.super : art.skill;
  const scale = superMode ? 0.9 : itemMode ? 0.68 : 0.78;
  const itemBadge = itemMode
    ? `<path d="m98 16 4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#fff0b3" stroke="#60483c" stroke-width="2"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><radialGradient id="g"><stop stop-color="${art.color}" stop-opacity=".5"/><stop offset="1" stop-color="${art.color}" stop-opacity="0"/></radialGradient></defs><circle cx="64" cy="64" r="62" fill="url(#g)"/>${frame}<g transform="translate(64 64) scale(${scale}) translate(-64 -64)" color="${art.color}">${glyph}</g>${itemBadge}<path d="m64 8 3 8 8 3-8 3-3 8-3-8-8-3 8-3zM18 64l3 6 6 3-6 3-3 6-3-6-6-3 6-3zM110 64l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" fill="${art.light}"/></svg>`;
}

const fxUrl = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
function replayStateAt(
  template: BattleState,
  frames: ReplayFrame[],
  target: number,
  totalTicks: number,
  headings?: Map<number, number>,
) {
  if (!frames.length) return template;
  let right = frames.findIndex((frame) => frame.tick >= target);
  if (right < 0) right = frames.length - 1;
  const a = frames[Math.max(0, right - (frames[right].tick > target ? 1 : 0))],
    b = frames[right],
    span = Math.max(1, b.tick - a.tick),
    t = Math.max(0, Math.min(1, (target - a.tick) / span)),
    lerp = (x: number, y: number) => x + (y - x) * t,
    state = structuredClone(template);
  state.tick = Math.floor(Math.min(totalTicks, target));
  state.finished = target >= totalTicks && b.tick >= totalTicks;
  for (let i = 0; i < state.fighters.length; i++) {
    const fighter = state.fighters[i],
      from = a.fighters[i],
      to = b.fighters[i] || from;
    if (!from) continue;
    fighter.x = lerp(from[0], to[0]);
    fighter.y = lerp(from[1], to[1]);
    fighter.hp = lerp(from[2], to[2]);
    fighter.shield = lerp(from[3], to[3]);
    fighter.energy = lerp(from[4], to[4]);
    const turn = ((to[5] - from[5] + 48) % 32) - 16;
    headings?.set(fighter.id, interpolateAngle(from[5], to[5], t));
    fighter.angle = Math.round((from[5] + turn * t + 32) % 32) % 32;
    fighter.skillReady = from[6];
    fighter.superUntil = from[7];
    fighter.slowUntil = from[8];
    fighter.burnUntil = from[9];
    fighter.deadAt = from[10];
    fighter.stats.reach = lerp(from[11], to[11]);
    fighter.stats.hp = from[12];
    fighter.memory.swordHits = from[13];
    fighter.supers = from[14];
    fighter.facing = (t < 0.5 ? from[15] : to[15]) || 1;
    fighter.buffs = structuredClone(a.buffs[i] || []);
    fighter.statuses = structuredClone(a.statuses?.[i] || []);
    if (a.damageStats?.[i]) [fighter.dealt, fighter.taken] = a.damageStats[i];
    fighter.metrics = a.supportStats?.[i] ? structuredClone(a.supportStats[i]) : undefined;
    const combatStats = a.combatStats?.[i];
    if (combatStats) {
      [
        fighter.stats.attack,
        fighter.stats.speed,
        fighter.stats.rotation,
        fighter.stats.charge,
        fighter.stats.cooldown,
        fighter.memory.spinRate,
      ] = combatStats;
    }
  }
  const nextConstructs = new Map((b.constructs || []).map((c) => [c.id, c]));
  state.constructs = (a.constructs || []).map((c) => {
    const next = nextConstructs.get(c.id) || c;
    return {
      ...structuredClone(c),
      x: lerp(c.x, next.x),
      y: lerp(c.y, next.y),
    };
  });
  const nextProjectiles = new Map(b.projectiles.map((p) => [p[0], p]));
  state.projectiles = a.projectiles.map((p) => {
    const q = nextProjectiles.get(p[0]) || p;
    return {
      id: p[0],
      owner: p[1],
      x: lerp(p[2], q[2]),
      y: lerp(p[3], q[3]),
      vx: p[4] ?? (q[2] - p[2]) / span,
      vy: p[5] ?? (q[3] - p[3]) / span,
      normal: p[6],
      kind: p[7],
      life: 0,
      pierce: 0,
      hit: [],
    };
  });
  for (const extra of a.kitProjectiles || []) {
    const projectile = state.projectiles.find((p) => p.id === extra.id);
    if (projectile) {
      projectile.kit = extra.kit;
      projectile.radius = extra.radius;
      projectile.returning = extra.returning;
    }
  }
  state.zones = structuredClone(a.zones);
  state.pending = structuredClone(a.pending);
  state.events = structuredClone(a.events);
  return state;
}
export function Arena({
  config,
  seed,
  replay,
  loadReplayChunk,
  officialResult,
  offset = 0,
  muted,
  low,
  showEffects = true,
  showDamage = false,
  showRecovery = true,
  onError,
  onInspect,
  onFinished,
  onBattleComplete,
  label,
  highlightTeamId,
  watchedTeamId,
}: {
  config: BattleConfig;
  seed: number;
  replay?: ReplayInfo | null;
  loadReplayChunk: (index: number) => Promise<ReplayFrame[]>;
  officialResult?: string;
  offset?: number;
  muted: boolean;
  low: boolean;
  showEffects?: boolean;
  showDamage?: boolean;
  showRecovery?: boolean;
  onError: (s: string) => void;
  onInspect?: (fighter: Fighter, tick: number) => void;
  onFinished?: (teamId: string) => void;
  onBattleComplete?: (summary: BattleSummary) => void;
  label?: string;
  highlightTeamId?: string;
  watchedTeamId?: string;
}) {
  const mount = useRef<HTMLDivElement>(null),
    options = useRef({
      muted,
      low,
      showEffects,
      showDamage,
      showRecovery,
      onError,
      offset,
      onInspect,
      onFinished,
      onBattleComplete,
      loadReplayChunk,
      officialResult,
      highlightTeamId,
      watchedTeamId,
    });
  options.current = {
    muted,
    low,
    showEffects,
    showDamage,
    showRecovery,
    onError,
    offset,
    onInspect,
    onFinished,
    onBattleComplete,
    loadReplayChunk,
    officialResult,
    highlightTeamId,
    watchedTeamId,
  };
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [hasDamageStats, setHasDamageStats] = useState(replay?.format !== 1);
  const [hud, setHud] = useState({
    tick: 0,
    alive: 0,
    fps: 0,
    hash: "",
    kills: [] as string[],
    result: "",
  });
  useEffect(() => {
    if (replay && replay.version !== ENGINE_VERSION) {
      options.current.onError(
        "Replay thuộc phiên bản cũ. Hãy bắt đầu trận mới để dùng luật trận mới.",
      );
      return;
    }
    let disposed = false,
      frame = 0,
      app: Application | undefined,
      audio: AudioContext | undefined;
    const labels: Text[] = [];
    const callouts: Text[] = [];
    const faces: (Sprite | undefined)[] = [],
      masks: (Graphics | undefined)[] = [];
    const weapons: Sprite[][] = [];
    const replayHeadings = new Map<number, number>();
    const viewWidth = config.width / 100,
      viewHeight = config.height / 100;
    const battle = createBattle(config, seed);
    let state: BattleState = battle;
    const recorder = createBattleRecorder();
    let started = performance.now(),
      last = started,
      hudTime = 0,
      heard = 0,
      playbackTick = 0;
    let frames: ReplayFrame[] = [];
    const loaded = new Set<number>(),
      loading = new Set<number>(),
      retryAfter = new Map<number, number>(),
      checked = new Set<number>();
    let verified = false;
    let completionReported = false;
    async function loadChunk(index: number) {
      if (
        !replay ||
        replay.format !== 1 ||
        index < 0 ||
        index >= replay.chunks.length ||
        loaded.has(index) ||
        loading.has(index) ||
        (retryAfter.get(index) || 0) > Date.now()
      )
        return;
      loading.add(index);
      try {
        const received = await options.current.loadReplayChunk(index);
        recorder.replay(
          received,
          battle.fighters,
          options.current.highlightTeamId,
        );
        frames = [...frames, ...received].sort((a, b) => a.tick - b.tick);
        frames = frames.filter(
          (f, i) => i === 0 || f.tick !== frames[i - 1].tick,
        );
        loaded.add(index);
        retryAfter.delete(index);
      } catch (error) {
        retryAfter.set(index, Date.now() + 1000);
        throw error;
      } finally {
        loading.delete(index);
      }
    }
    async function init() {
      if (replay?.format === 1) {
        if (!replay.chunks.length) throw Error("Replay không có frame đã ghi");
        const initialTarget = Math.max(
            0,
            ((Date.now() + options.current.offset - replay.start) * 30) / 1000,
          ),
          current = replay.chunks.findIndex(
            (chunk) => chunk.toTick >= initialTarget,
          ),
          selected = current < 0 ? replay.chunks.length - 1 : current;
        playbackTick = Math.min(replay.totalTicks, initialTarget);
        if (selected > 0) await loadChunk(selected - 1);
        await loadChunk(selected);
        state = replayStateAt(battle, frames, initialTarget, replay.totalTicks);
      }
      const instance = new Application();
      app = instance;
      await instance.init({
        width: viewWidth,
        height: viewHeight,
        background: "#151314",
        antialias: true,
        autoStart: false,
        preference: "webgl",
      });
      if (disposed) {
        instance.destroy(true);
        return;
      }
      mount.current!.appendChild(instance.canvas);
      const kitArt = await loadKitArt().catch(() => undefined);
      if (disposed) return;
      const fxTextures = {} as Record<FxKind, Texture>;
      const characterFxTextures = {} as Record<
        CharacterId,
        { skill: Texture; super: Texture; item: Texture }
      >;
      await Promise.all(
        (Object.keys(fxArt) as FxKind[]).map(async (kind) => {
          fxTextures[kind] = await Assets.load<Texture>(fxUrl(fxArt[kind]));
        }),
      );
      await Promise.all(
        CHARACTER_IDS.map(async (id) => {
          if (kitArt) {
            const frames = kitArt.fx[characterFxFamily(id)];
            characterFxTextures[id] = {
              skill: frames[0],
              super: frames[0],
              item: frames[0],
            };
            return;
          }
          const [skill, superFx, item] = await Promise.all([
            Assets.load<Texture>(fxUrl(characterFxSvg(id, "skill"))),
            Assets.load<Texture>(fxUrl(characterFxSvg(id, "super"))),
            Assets.load<Texture>(fxUrl(characterFxSvg(id, "item"))),
          ]);
          characterFxTextures[id] = { skill, super: superFx, item };
        }),
      );
      if (disposed) return;
      const animatedFx =
        kitArt?.combat ??
        (await loadCombatFx().catch(() => ({
          impactBurst: [fxTextures.slash],
          superBurst: [fxTextures.zone],
          burnLoop: [fxTextures.bolt],
          slowLoop: [fxTextures.zone],
          passiveBurst: [fxTextures.utility],
          healBurst: [fxTextures.heal],
          shieldBurst: [fxTextures.shield],
          projectile: [fxTextures.bolt],
        })));
      const personalAnimatedFx: CharacterFxFrames = kitArt
        ? Object.fromEntries(
            CHARACTER_IDS.map((id) => [
              id,
              {
                skill: kitArt.fx[characterFxFamily(id)],
                super: kitArt.fx[characterFxFamily(id)],
              },
            ]),
          )
        : await loadCharacterFx().catch(() => ({}) as CharacterFxFrames);
      const generatedFx = kitArt
        ? {
            slash: kitArt.fx.slash,
            shatter: kitArt.fx.slash,
            clash: kitArt.fx.slash,
            bolt: kitArt.fx.frost,
            zone: kitArt.fx.aura,
            warn: kitArt.fx.aura,
            utility: kitArt.fx.aura,
            heal: kitArt.fx.aura,
            shield: kitArt.fx.aura,
            bond: kitArt.fx.aura,
            group: kitArt.fx.aura,
          }
        : undefined;
      if (disposed) return;
      const textureForEffect = (kind: EffectKind, characterId?: string) => {
        if (isCombatFx(kind)) return animatedFx[kind][0];
        if (
          kind === "characterSkill" ||
          kind === "characterSuper" ||
          kind === "characterItem"
        ) {
          const id = CHARACTER_IDS.includes(characterId as CharacterId)
            ? (characterId as CharacterId)
            : undefined;
          if (id) {
            const frames =
              personalAnimatedFx[id]?.[
                kind === "characterSuper" ? "super" : "skill"
              ];
            if (frames?.length)
              return frames[Math.floor(state.tick / 3) % frames.length];
            const personal = characterFxTextures[id];
            return kind === "characterSkill"
              ? personal.skill
              : kind === "characterSuper"
                ? personal.super
                : personal.item;
          }
          return fxTextures.utility;
        }
        return generatedFx?.[kind]?.[0] || fxTextures[kind];
      };
      instance.stage.sortableChildren = true;
      const layers = Object.fromEntries(
        Object.entries(ARENA_LAYERS).map(([name, zIndex]) => {
          const layer = new Container({ label: name, zIndex });
          instance.stage.addChild(layer);
          return [name, layer];
        }),
      ) as Record<keyof typeof ARENA_LAYERS, Container>;
      const g = new Graphics();
      const bodyGraphics = new Graphics();
      const constructGraphics = new Graphics();
      const hudGraphics = new Graphics();
      const trails = new Graphics({ label: "weapon-trails" });
      const particles = new Graphics({ label: "effect-particles" });
      const ambientFx = new Graphics({ label: "ambient-effects" });
      layers.ground.addChild(g);
      layers.combat.addChild(trails);
      layers.bodies.addChild(constructGraphics, bodyGraphics);
      layers.hud.addChild(hudGraphics);
      const damageNodes = Array.from({ length: DAMAGE_NUMBER_LIMIT }, () => {
        const text = new Text({
          label: "damage-number",
          text: "",
          style: {
            fontFamily: "Arial",
            fontSize: 18,
            fontWeight: "900",
            fill: 0xffefbc,
            stroke: { color: 0x20161a, width: 4, join: "round" },
          },
        });
        text.anchor.set(0.5, 1);
        text.visible = false;
        layers.damage.addChild(text);
        return text;
      });
      let damagePopups: DamageNumber[] = [];
      let constructHealth = new Map(
        state.constructs.map((c) => [c.id, { ...c }]),
      );
      const statusNodes = state.fighters.map(() =>
        Array.from({ length: 3 }, () => {
          const sprite = new Sprite(animatedFx.passiveBurst[0]);
          sprite.anchor.set(0.5);
          sprite.visible = false;
          layers.hud.addChild(sprite);
          return sprite;
        }),
      );
      for (const f of state.fighters) {
        const label = new Text({
          text: f.boss ? "BOSS" : CHARACTERS[f.classId].short,
          style: {
            fontFamily: "Arial",
            fontSize: f.boss ? 12 : 10,
            fontWeight: "bold",
            fill: f.boss ? 0xffd272 : 0x231f20,
          },
        });
        label.anchor.set(0.5);
        labels.push(label);
        layers.hud.addChild(label);
      }
      await Promise.all(
        state.fighters.map(async (f, i) => {
          if (!f.characterId) return;
          try {
            const texture = await Assets.load<Texture>(
              avatar(
                f.characterId,
                isTransformedCharacter(f.characterId, f.equipment),
              ),
            );
            if (disposed) return;
            const crops = [
              [0.23, 0, 0.5],
              [0.02, 0, 0.94],
              [0.23, 0.1, 0.55],
              [0.23, 0, 0.28],
              [0.34, 0, 0.43],
              [0.04, 0.05, 0.58],
              [0.13, 0.14, 0.55],
              [0.45, 0.04, 0.34],
              [0.24, 0.05, 0.49],
              [0.39, 0.05, 0.45],
              [0.31, 0, 0.48],
              [0.33, 0.02, 0.44],
              [0.2, 0, 0.58],
              [0.35, 0.01, 0.42],
              [0.23, 0.04, 0.48],
              [0.45, 0.01, 0.29],
              [0.25, 0.01, 0.5],
              [0.27, 0.02, 0.46],
              [0.35, 0.01, 0.43],
              [0, 0, 1],
            ];
            const w = texture.width,
              h = texture.height,
              sourceCrop =
                (
                  {
                    char_31: [0.23, 0, 0.56],
                    char_32: [0.25, 0.06, 0.55],
                    char_33: [0.32, 0.03, 0.48],
                  } as Record<string, number[]>
                )[f.characterId] || crops[Number(f.characterId.slice(-2)) - 1],
              side = Math.min(w, h),
              crop = sourceCrop || [
                (w - side) / (2 * w),
                (h - side) / (2 * h),
                side / w,
              ];
            const size = Math.min(
              w * crop[2],
              h * (1 - crop[1]),
              w * (1 - crop[0]),
            );
            const face = new Sprite(
              new Texture({
                source: texture.source,
                frame: new Rectangle(
                  Math.floor(w * crop[0]),
                  Math.floor(h * crop[1]),
                  Math.floor(size),
                  Math.floor(size),
                ),
              }),
            );
            face.anchor.set(0.5);
            const mask = new Graphics();
            faces[i] = face;
            masks[i] = mask;
            face.mask = mask;
            layers.portraits.addChild(face, mask);
            labels[i].visible = false;
          } catch {
            /* Short label remains available if an avatar fails to load. */
          }
        }),
      );
      if (disposed) return;
      try {
        const frames = new Map<string, Texture>();
        for (const f of state.fighters) {
          if (!f.characterId) continue;
          const kitWeapon =
            kitArt?.weapons[characterKit(f.characterId, f.equipment)?.id || ""];
          if (kitWeapon && kitArt) {
            weapons[f.id] = Array.from({ length: weaponCount(f) }, (_, w) => {
              const texture =
                w === 1
                  ? f.characterId === "char_15"
                    ? kitArt.objects.shield
                    : kitArt.objects.chicken
                  : kitWeapon;
              const sprite = new Sprite(texture);
              sprite.anchor.set(w === 1 ? 0.5 : 0, 0.5);
              layers.combat.addChild(sprite);
              return sprite;
            });
            continue;
          }
          const index = Number(f.characterId.slice(-2)) - 1;
          if (!frames.has(f.characterId)) {
            if (index >= 20) {
              const art = await Assets.load<Texture>(
                weaponArtUrl(f.characterId),
              );
              if (index >= 25) {
                const inset = Math.round((art.width * 20) / 256);
                frames.set(
                  f.characterId,
                  new Texture({
                    source: art.source,
                    frame: new Rectangle(
                      inset,
                      inset,
                      art.width - inset * 2,
                      art.height - inset * 2,
                    ),
                  }),
                );
              } else frames.set(f.characterId, art);
            } else {
              const atlas = await Assets.load<Texture>(weaponAtlasUrl());
              const [x, y, width, height] = weaponFrame(f.characterId);
              frames.set(
                f.characterId,
                new Texture({
                  source: atlas.source,
                  frame: new Rectangle(x, y, width, height),
                }),
              );
            }
          }
          weapons[f.id] = Array.from({ length: weaponCount(f) }, () => {
            const sprite = new Sprite(frames.get(f.characterId!)!);
            // Expansion art is drawn vertically; the brush (#24) points down.
            if (index >= 25) sprite.anchor.set(0.5, 1);
            else if (index >= 20)
              sprite.anchor.set(0.5, index === 23 ? 0.08 : 0.92);
            else sprite.anchor.set(0.12, 0.5);
            layers.combat.addChild(sprite);
            return sprite;
          });
        }
      } catch {
        /* Keep the collision-aligned vector weapon when the atlas is unavailable. */
      }
      for (const f of state.fighters)
        if (f.characterId) {
          const label = labels[f.id];
          label.text = f.boss
            ? "BOSS"
            : `${config.teams.findIndex((t) => t.id === f.team) + 1}.${f.slot + 1}`;
          label.style.fontSize = f.boss ? 12 : 8;
          label.style.fill = f.boss ? 0xffd272 : 0xffffff;
          label.style.stroke = { color: 0x151018, width: 2 };
          layers.hud.addChild(label);
        }
      for (let i = 0; i < 10; i++) {
        const text = new Text({
          text: "",
          style: {
            fontFamily: "Arial",
            fontSize: 11,
            fontWeight: "bold",
            fill: 0xffe28b,
            stroke: { color: 0x161019, width: 3 },
          },
        });
        text.anchor.set(0.5);
        layers.hud.addChild(text);
        callouts.push(text);
      }
      const effectNodes = Array.from({ length: 128 }, () => {
        const sprite = new Sprite(fxTextures.utility);
        sprite.anchor.set(0.5);
        sprite.visible = false;
        layers.combat.addChild(sprite);
        return sprite;
      });
      const effectData = Array.from({ length: effectNodes.length }, () => ({
        active: false,
        tick: 0,
        life: 24,
        size: 1,
        rotation: 0,
        kind: "utility" as EffectKind,
        characterId: undefined as string | undefined,
        x: 0,
        y: 0,
      }));
      const effectBlends = effectNodes.map(() => {
        const sprite = new Sprite(fxTextures.utility);
        sprite.anchor.set(0.5);
        sprite.visible = false;
        layers.combat.addChild(sprite);
        return sprite;
      });
      const motes = Array.from({ length: 192 }, () => ({
        tick: -1000,
        life: 1,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        color: 0xffffff,
      }));
      let moteCursor = 0;
      const hitImpulses = new Map<
        number,
        { tick: number; dx: number; dy: number }
      >();
      let shakeAt = -100,
        shakeAmount = 0;
      let effectCursor = 0,
        lastFxTick = state.tick;
      const burst = (
        kind: EffectKind,
        x: number,
        y: number,
        tick: number,
        size = 1,
        rotation = 0,
        characterId?: string,
      ) => {
        if (!options.current.showEffects) return;
        const index = effectCursor++ % effectNodes.length;
        const sprite = effectNodes[index];
        sprite.texture = textureForEffect(kind, characterId);
        sprite.blendMode = "normal";
        sprite.position.set(
          x * (viewWidth / config.width),
          y * (viewHeight / config.height),
        );
        sprite.visible = true;
        sprite.alpha = 1;
        sprite.scale.set((0.42 * size * 128) / sprite.texture.width);
        sprite.rotation = rotation;
        const fx = effectData[index];
        fx.active = true;
        fx.tick = tick;
        fx.life = effectStyle(kind).life;
        fx.size = Math.min(3, size);
        fx.rotation = rotation;
        fx.kind = kind;
        fx.characterId = characterId;
        fx.x = sprite.x;
        fx.y = sprite.y;
        const big =
          kind === "characterSuper" ||
          kind === "superBurst" ||
          kind === "shatter";
        if (big && tick - shakeAt > 9) {
          shakeAt = tick;
          shakeAmount = Math.min(2.4, size * 1.5);
        }
        const count = options.current.low ? 2 : big ? 9 : 4;
        const color =
          kind === "healBurst"
            ? 0x8ee6ac
            : characterId
              ? characterFxColor(characterId)
              : kind === "shieldBurst"
                ? 0x9fdfff
                : 0xffd89a;
        for (let j = 0; j < count; j++) {
          const mote = motes[moteCursor++ % motes.length];
          // Stable variation avoids synchronized spokes and keeps replay visuals repeatable.
          const angle = rotation + j * 2.39996 + tick * 0.7;
          const speed = (big ? 2.4 : 1.4) * (0.65 + ((j * 7 + tick) % 11) / 11);
          Object.assign(mote, {
            tick,
            life: big ? 23 + (j % 6) : 10 + (j % 5),
            x: fx.x,
            y: fx.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - (kind === "healBurst" ? 1.2 : 0.25),
            color,
          });
        }
      };
      const zoneNodes = Array.from({ length: 120 }, () => {
        const sprite = new Sprite(fxTextures.zone);
        sprite.anchor.set(0.5);
        sprite.visible = false;
        layers.groundFx.addChild(sprite);
        return sprite;
      });
      const summonPortraits = kitArt
        ? Object.fromEntries(
            ["minion", "giant", "turret"].map((kind) => {
              const texture = kitArt.constructs[kind],
                frame = texture.frame;
              const side = Math.min(frame.width, frame.height) * 0.64;
              return [
                kind,
                new Texture({
                  source: texture.source,
                  frame: new Rectangle(
                    frame.x + frame.width * 0.23,
                    frame.y + frame.height * 0.22,
                    side,
                    side,
                  ),
                }),
              ];
            }),
          )
        : undefined;
      const constructMasks: Graphics[] = [];
      const constructNodes = Array.from({ length: 64 }, () => {
        const sprite = new Sprite(
          kitArt?.constructs.minion || fxTextures.utility,
        );
        sprite.anchor.set(0.5);
        sprite.visible = false;
        const mask = new Graphics({ label: "summon-mask" });
        mask.visible = false;
        constructMasks.push(mask);
        layers.bodies.addChild(mask);
        layers.combat.addChild(sprite);
        return sprite;
      });
      const projectileNodes = Array.from({ length: 240 }, () => {
        const sprite = new Sprite(fxTextures.bolt);
        sprite.anchor.set(0.5);
        sprite.visible = false;
        layers.combat.addChild(sprite);
        return sprite;
      });
      const rocketAttachments = Array.from({ length: 240 }, () => {
        const sprite = new Sprite(kitArt?.objects.rocket || fxTextures.bolt);
        sprite.anchor.set(0.5);
        sprite.visible = false;
        layers.combat.addChild(sprite);
        return sprite;
      });
      layers.combat.addChild(particles);
      layers.groundFx.addChild(ambientFx);
      instance.stage.eventMode = "static";
      instance.stage.hitArea = new Rectangle(0, 0, viewWidth, viewHeight);
      instance.stage.on("pointertap", (e) => {
        const x = (e.global.x * config.width) / viewWidth,
          y = (e.global.y * config.height) / viewHeight;
        const f = state.fighters
          .filter(
            (f) =>
              f.hp > 0 &&
              (f.x - x) ** 2 + (f.y - y) ** 2 < (f.radius * 1.6) ** 2,
          )
          .sort(
            (a, b) =>
              (a.x - x) ** 2 +
                (a.y - y) ** 2 -
                ((b.x - x) ** 2 + (b.y - y) ** 2) || a.id - b.id,
          )[0];
        if (f) options.current.onInspect?.(f, state.tick);
      });
      const sx = viewWidth / config.width,
        sy = viewHeight / config.height;
      type Pose = { x: number; y: number; angle?: number };
      let previousFighters = new Map<number, Pose>();
      let previousProjectiles = new Map<number, Pose>();
      let previousConstructs = new Map<number, Pose>();
      const weaponHeadings = new Map<number, WeaponHeading>();
      let visualStateTick = state.tick,
        visualTickAt = performance.now();
      function draw() {
        if (disposed) return;
        const now = performance.now(),
          desired = replay
            ? Math.min(
                replay.totalTicks,
                Math.max(
                  0,
                  ((Date.now() + options.current.offset - replay.start) * 30) /
                    1000,
                ),
              )
            : Math.floor(((now - started) * 30) / 1000),
          target = replay
            ? (playbackTick = Math.max(playbackTick, desired))
            : desired;
        if (replay?.format === 1) {
          const currentChunk =
              replay.chunks.find((chunk) => target <= chunk.toTick)?.index ??
              replay.chunks.length - 1,
            currentInfo = replay.chunks[currentChunk];
          if (
            target >= currentInfo.toTick - 45 &&
            (retryAfter.get(currentChunk + 1) || 0) <= Date.now()
          )
            void loadChunk(currentChunk + 1).catch((e) => {
              if (!disposed) options.current.onError(e.message);
            });
          state = replayStateAt(
            battle,
            frames,
            target,
            replay.totalTicks,
            replayHeadings,
          );
        } else {
          let budget = 180;
          while (!state.finished && state.tick < target && budget-- > 0) {
            previousFighters = new Map(
              state.fighters.map((f) => [
                f.id,
                { x: f.x, y: f.y, angle: f.angle },
              ]),
            );
            previousProjectiles = new Map(
              state.projectiles.map((p) => [p.id, { x: p.x, y: p.y }]),
            );
            previousConstructs = new Map(
              state.constructs.map((c) => [c.id, { x: c.x, y: c.y }]),
            );
            const previousTick = state.tick;
            stepBattle(state);
            recorder.observe(
              state.events,
              state.fighters,
              options.current.highlightTeamId,
              previousTick,
            );
          }
          if (replay?.format === 0) {
            const checkpoint = replay.checkpoints.find(
              (c) => c.tick === state.tick,
            );
            if (checkpoint && !checked.has(checkpoint.tick)) {
              checked.add(checkpoint.tick);
              if (calculateStateHash(state) !== checkpoint.hash)
                options.current.onError("Replay lịch sử lệch checksum.");
            }
            if (state.finished && !verified) {
              verified = true;
              if (calculateStateHash(state) !== replay.finalHash)
                options.current.onError(
                  "Replay lịch sử không khớp kết quả cuối.",
                );
            }
          }
        }
        if (state.tick !== visualStateTick) {
          visualStateTick = state.tick;
          visualTickAt = now;
        }
        const fraction = Math.min(1, (now - visualTickAt) * 0.03);
        const visualTick =
          state.tick +
          (state.finished ? (now - visualTickAt) * 0.03 : fraction);
        const pose = (
          current: Pose & { id: number },
          previous: Map<number, Pose>,
        ) => {
          const from =
            replay?.format === 1 ? undefined : previous.get(current.id);
          return from
            ? {
                x: from.x + (current.x - from.x) * fraction,
                y: from.y + (current.y - from.y) * fraction,
                angle: interpolateAngle(
                  from.angle || 0,
                  current.angle || 0,
                  fraction,
                ),
              }
            : current;
        };
        const clashed = new Set<number>();
        const effects = options.current.showEffects;
        trails.visible = particles.visible = ambientFx.visible = effects;
        damagePopups = damagePopups.filter(
          (p) =>
            visualTick - p.tick < DAMAGE_NUMBER_LIFE &&
            (isRecoveryNumber(p.type)
              ? options.current.showRecovery
              : options.current.showDamage),
        );
        if (options.current.showDamage || options.current.showRecovery) {
          const incoming = [
            ...(options.current.showDamage
              ? collectDamageNumbers(
                  state.events,
                  state.fighters,
                  lastFxTick,
                  state.tick,
                )
              : []),
            ...(options.current.showDamage
              ? collectConstructDamageNumbers(
                  state.events,
                  state.constructs,
                  constructHealth,
                  lastFxTick,
                  state.tick,
                )
              : []),
            ...(options.current.showRecovery
              ? collectSupportNumbers(
                  state.events,
                  state.fighters,
                  lastFxTick,
                  state.tick,
                )
              : []),
          ];
          for (const popup of incoming) {
            const existing = damagePopups.find((p) => p.key === popup.key);
            if (existing) existing.amount += popup.amount;
            else damagePopups.push(popup);
          }
          damagePopups = damagePopups.slice(-DAMAGE_NUMBER_LIMIT);
        }
        constructHealth = new Map(
          state.constructs.map((c) => [c.id, { ...c }]),
        );
        damageNodes.forEach((text, i) => {
          const popup = damagePopups[i];
          text.visible = !!popup;
          if (!popup) return;
          const motion = damageNumberMotion(
            visualTick - popup.tick,
            popup.lane,
          );
          const palette = COMBAT_PALETTE[popup.type];
          text.text = `${popup.type === "direct" ? "" : palette.label + " "}${isRecoveryNumber(popup.type) ? "+" : "−"}${popup.amount}`;
          text.style.fill = palette.color;
          text.style.fontSize =
            popup.type === "direct" ? (popup.amount >= 60 ? 22 : 18) : 15;
          text.position.set(
            Math.max(28, Math.min(viewWidth - 28, popup.x * sx + motion.x)),
            Math.max(
              28,
              Math.max(46, popup.y * sy - popup.radius * sy - 19) -
                motion.rise -
                (popup.type === "direct"
                  ? 0
                  : COMBAT_NUMBER_TYPES.indexOf(popup.type) * 12),
            ),
          );
          text.alpha = motion.alpha;
          text.scale.set(motion.scale);
        });
        for (const e of state.events) {
          if (e.tick <= lastFxTick || e.tick > state.tick) continue;
          const source = state.fighters[e.source],
            target = state.fighters[e.target];
          if (e.source === -1 && target) {
            if (e.type === "arena:pressure")
              burst("impactBurst", target.x, target.y, e.tick, 0.45);
            else if (e.type === "kill")
              burst("shatter", target.x, target.y, e.tick, 0.8);
            continue;
          }
          if (!source || !target) continue;
          if (e.type === "hit") {
            const dx = source.x - target.x,
              dy = source.y - target.y;
            const length = Math.max(1, Math.hypot(dx, dy));
            hitImpulses.set(target.id, {
              tick: e.tick,
              dx: -dx / length,
              dy: -dy / length,
            });
            burst(
              "impactBurst",
              target.x + (dx / length) * target.radius * 1.6,
              target.y + (dy / length) * target.radius * 1.6,
              e.tick,
              0.55,
              Math.atan2(dy, dx),
            );
          } else if (e.type === "kit:construct-hit") {
            const construct = state.constructs.find((c) => c.id === e.amount);
            if (e.x !== undefined || construct)
              burst(
                "impactBurst",
                e.x ?? construct!.x,
                e.y ?? construct!.y,
                e.tick,
                0.45,
                (source.angle * Math.PI) / 16,
              );
          } else if (e.type.startsWith("kit:explosion:")) {
            burst(
              e.type.endsWith("balloon") ? "characterSuper" : "superBurst",
              e.x ?? target.x,
              e.y ?? target.y,
              e.tick,
              Math.min(4.5, e.amount / 45),
              0,
              source.characterId,
            );
          } else if (e.type === "clash") {
            if (state.tick - e.tick <= 3) {
              clashed.add(source.id);
              clashed.add(target.id);
            }
            const x = e.x ?? (source.x + target.x) / 2,
              y = e.y ?? (source.y + target.y) / 2;
            burst("clash", x, y, e.tick, 0.3, (source.angle * Math.PI) / 16);
          } else if (e.type === "kill") {
            burst("shatter", target.x, target.y, e.tick, 1.25);
          } else if (e.type === "super") {
            if (!personalAnimatedFx[source.characterId || ""]?.super)
              burst("superBurst", source.x, source.y, e.tick, 1.4);
            burst(
              "characterSuper",
              source.x,
              source.y,
              e.tick,
              personalAnimatedFx[source.characterId || ""]?.super
                ? 1
                : source.characterId === "char_20"
                  ? 0.8
                  : 0.65,
              0,
              source.characterId,
            );
          } else if (e.type === "heal") {
            burst(
              "healBurst",
              target.x,
              target.y - target.radius * 1.7,
              e.tick,
              1.05,
            );
          } else if (e.type === "shield") {
            burst("shieldBurst", target.x, target.y, e.tick, 1.05);
          } else if (e.type === "radiation" || e.type === "impact:radiation") {
            burst(
              "characterSuper",
              target.x,
              target.y,
              e.tick,
              e.type === "impact:radiation" ? 0.9 : 0.4,
              0,
              "char_31",
            );
          } else if (e.type.startsWith("passive:")) {
            burst(
              personalAnimatedFx[source.characterId || ""]?.skill
                ? "characterSkill"
                : "passiveBurst",
              source.x,
              source.y,
              e.tick,
              0.75,
              0,
              source.characterId,
            );
          } else if (e.type.startsWith("skill:")) {
            if (!personalAnimatedFx[source.characterId || ""]?.skill)
              burst("passiveBurst", source.x, source.y, e.tick, 0.6);
            burst(
              "characterSkill",
              source.x,
              source.y,
              e.tick,
              personalAnimatedFx[source.characterId || ""]?.skill ? 0.9 : 0.72,
              0,
              source.characterId,
            );
          } else if (e.type.startsWith("bond:")) {
            burst("bond", source.x, source.y, e.tick, 0.85);
          } else if (e.type.startsWith("group:")) {
            burst("group", source.x, source.y, e.tick, 0.85);
          } else if (
            e.type.startsWith("item:") ||
            e.type.startsWith("affinity:")
          ) {
            const itemId = e.type.startsWith("affinity:")
              ? source.characterId
              : CHARACTER_IDS[Number(e.type.slice(5)) - 1];
            burst(
              itemId ? "characterItem" : "utility",
              target.x,
              target.y,
              e.tick,
              0.62,
              0,
              itemId,
            );
          }
        }
        lastFxTick = Math.max(lastFxTick, state.tick);
        g.clear();
        bodyGraphics.clear();
        constructGraphics.clear();
        hudGraphics.clear();
        trails.clear();
        particles.clear();
        ambientFx.clear();
        for (let x = 0; x < viewWidth; x += 60)
          g.moveTo(x, 0)
            .lineTo(x, viewHeight)
            .stroke({ color: 0x393334, width: 1, alpha: 0.45 });
        for (let y = 0; y < viewHeight; y += 60)
          g.moveTo(0, y)
            .lineTo(viewWidth, y)
            .stroke({ color: 0x393334, width: 1, alpha: 0.45 });
        const bounds = safeBounds(state);
        const shrinking =
          state.tick > Math.min(900, config.shrinkSeconds * 15) &&
          state.tick < config.shrinkSeconds * 30;
        const wallColor = 0xf6ad13;
        const wallPulse = shrinking
          ? 0.5 + Math.sin(state.tick * 0.22) * 0.5
          : 0;
        const inset = bounds.left * sx;
        const insetY = bounds.top * sy;
        if (inset > 0 || insetY > 0) {
          g.rect(0, 0, viewWidth, insetY)
            .rect(0, viewHeight - insetY, viewWidth, insetY)
            .rect(0, insetY, inset, viewHeight - 2 * insetY)
            .rect(viewWidth - inset, insetY, inset, viewHeight - 2 * insetY)
            .fill({ color: 0x0c0b0b, alpha: 0.94 });
        }
        // The visible edge matches the same collision bounds used by the engine.
        g.rect(inset, insetY, viewWidth - 2 * inset, viewHeight - 2 * insetY)
          .stroke({
            color: wallColor,
            width: 10 + wallPulse * 4,
            alpha: 0.09 + wallPulse * 0.12,
          })
          .rect(inset, insetY, viewWidth - 2 * inset, viewHeight - 2 * insetY)
          .stroke({ color: wallColor, width: 5, alpha: 0.25 })
          .rect(inset, insetY, viewWidth - 2 * inset, viewHeight - 2 * insetY)
          .stroke({ color: 0xf9de0b, width: 2 });
        zoneNodes.forEach((sprite, i) => {
          const z = state.zones[i];
          if (!z) {
            sprite.visible = false;
            return;
          }
          sprite.visible = true;
          const owner = state.fighters[z.owner];
          if (z.kit) {
            const tint =
              z.kit === "deadline"
                ? 0xff8676
                : z.kit === "rose"
                  ? 0xff78b6
                  : z.kit === "soup"
                    ? 0xff9448
                    : z.kit === "vortex"
                      ? 0x9ce9ff
                      : z.kit === "paint"
                        ? 0xb49aff
                        : z.kit === "flag"
                          ? 0xffdb75
                          : 0x8ddd77;
            const warning = state.tick < (z.start || 0);
            g.circle(z.x * sx, z.y * sy, (z.radius || 50) * 100 * sx)
              .fill({ color: tint, alpha: warning ? 0.025 : 0.07 })
              .stroke({
                color: warning ? 0xffedaa : tint,
                width: warning ? 2.2 : 1.2,
                alpha: warning ? 0.55 : 0.4,
              });
            if (!kitArt && z.kit === "flag")
              g.moveTo(z.x * sx, z.y * sy + 10)
                .lineTo(z.x * sx, z.y * sy - 18)
                .lineTo(z.x * sx + 17, z.y * sy - 10)
                .lineTo(z.x * sx, z.y * sy - 3)
                .stroke({ color: tint, width: 3 });
          }
          sprite.texture = owner?.characterId
            ? textureForEffect(
                z.super ? "characterSuper" : "characterSkill",
                owner.characterId,
              )
            : z.line
              ? fxTextures.slash
              : fxTextures.zone;
          if (z.line) {
            sprite.position.set(
              (z.x + (z.line.dx * z.line.length * 50) / 1024) * sx,
              (z.y + (z.line.dy * z.line.length * 50) / 1024) * sy,
            );
            sprite.width = Math.max(24, z.line.length * 100 * sx);
            sprite.height = Math.max(12, z.line.width * 100 * sy);
            sprite.rotation = Math.atan2(z.line.dy, z.line.dx);
          } else {
            sprite.position.set(z.x * sx, z.y * sy);
            const size = (z.radius || 120) * 200 * sx;
            sprite.width = size;
            sprite.height = size;
            sprite.rotation = visualTick * 0.008;
            if (z.territory) {
              const warning = state.tick < (z.start || 0);
              g.circle(z.x * sx, z.y * sy, (z.radius || 0) * 100 * sx)
                .fill({ color: 0x8ddd77, alpha: warning ? 0.035 : 0.055 })
                .stroke({
                  color: warning ? 0xffe08d : 0x98e889,
                  width: warning ? 2 : 1.5,
                  alpha: 0.45,
                });
            }
          }
          sprite.alpha = z.trap ? 0.2 : z.super ? 0.24 : 0.14;
          if (kitArt && z.kit) {
            sprite.texture =
              z.kit === "vortex"
                ? kitArt.fx.wind[0]
                : z.kit === "deadline"
                  ? kitArt.objects.deadline
                  : z.kit === "fruit"
                    ? kitArt.objects.fruitField
                    : z.kit === "slipper"
                      ? kitArt.objects.slipper
                      : kitArt.constructs[z.kit] || kitArt.objects.roseField;
            const size = (z.radius || 50) * 200 * sx;
            // The ring communicates the full area; the artwork is a small source marker.
            sprite.width =
              z.kit === "flag"
                ? 40
                : z.kit === "slipper"
                  ? Math.min(36, size * 0.5)
                  : z.kit === "vortex"
                    ? size * 0.85
                    : Math.min(60, size * 0.4);
            sprite.height =
              (sprite.width * sprite.texture.height) / sprite.texture.width;
            // A stable silhouette rotates continuously instead of popping through six unrelated poses.
            sprite.rotation =
              z.kit === "vortex"
                ? visualTick * 0.018
                : Math.sin(visualTick * 0.08 + i) * 0.035;
            const breath = 1 + Math.sin(visualTick * 0.12 + i * 2) * 0.045;
            sprite.scale.set(sprite.scale.x * breath, sprite.scale.y * breath);
            sprite.y -= Math.sin(visualTick * 0.09 + i) * 2;
            sprite.alpha =
              state.tick < (z.start || 0)
                ? 0.18
                : z.kit === "flag" || z.kit === "slipper"
                  ? 0.55
                  : z.kit === "vortex"
                    ? 0.22
                    : 0.24;
            if (z.kit === "vortex") {
              sprite.visible = false;
              energyRing(
                ambientFx,
                z.x * sx,
                z.y * sy,
                size * 0.35,
                -visualTick * 0.7 + i,
                0x9ce9ff,
                0.32,
              );
              energyRing(
                ambientFx,
                z.x * sx,
                z.y * sy,
                size * 0.22,
                visualTick + i,
                0xb5f3ff,
                0.22,
              );
            } else if (
              effects &&
              state.tick >= (z.start || 0) &&
              !options.current.low
            ) {
              const radius = (z.radius || 50) * 100 * sx;
              const phase = (visualTick * 0.018 + i * 0.37) % 1;
              g.circle(
                z.x * sx,
                z.y * sy,
                radius * (0.55 + phase * 0.45),
              ).stroke({
                color: 0xd9ddb1,
                width: 1,
                alpha: (1 - phase) * 0.12,
              });
            }
          }
        });
        constructNodes.forEach((sprite, i) => {
          const c = state.constructs[i];
          const mask = constructMasks[i];
          mask.clear();
          mask.visible = false;
          sprite.visible = !!kitArt && !!c && c.hp > 0;
          if (!sprite.visible || !kitArt || !c) return;
          const position = pose(c, previousConstructs);
          sprite.label =
            c.kind === "turret" ? "turret-portrait" : "summon-portrait";
          const layer = layers.bodies;
          if (sprite.parent !== layer) layer.addChild(sprite);
          sprite.mask = mask;
          sprite.texture = summonPortraits![c.kind];
          sprite.position.set(
            position.x * sx,
            position.y * sy +
              (c.kind === "turret"
                ? 0
                : Math.sin(visualTick * 0.16 + c.id) * 1.2),
          );
          const radius = c.radius * sx * 1.38;
          sprite.width = radius * 2.12;
          sprite.height =
            (sprite.width * sprite.texture.height) / sprite.texture.width;
          mask.visible = true;
          mask.circle(sprite.x, sprite.y, radius * 0.96).fill(0xffffff);
          sprite.rotation = 0;
          if (c.kind === "turret") {
            let nearest = Infinity;
            for (const t of state.fighters)
              if (t.hp > 0 && t.team !== state.fighters[c.owner]?.team) {
                const d = (t.x - c.x) ** 2 + (t.y - c.y) ** 2;
                if (d < nearest) {
                  nearest = d;
                  sprite.rotation = Math.atan2(t.y - c.y, t.x - c.x);
                }
              }
          } else
            sprite.scale.x = Math.abs(sprite.scale.x) * (c.vx < 0 ? -1 : 1);
        });
        for (const c of state.constructs) {
          if (c.hp <= 0) continue;
          const owner = state.fighters[c.owner],
            color =
              colors[
                config.teams.findIndex((t) => t.id === owner?.team) %
                  colors.length
              ] || 0xffffff;
          const position = pose(c, previousConstructs);
          const x = position.x * sx,
            y =
              position.y * sy +
              (c.kind === "turret"
                ? 0
                : Math.sin(visualTick * 0.16 + c.id) * 1.2),
            r = c.radius * sx * 1.38;
          {
            constructGraphics.circle(x, y, r + 2).fill({ color, alpha: 0.18 });
            constructGraphics
              .circle(x, y, r)
              .fill(c.kind === "giant" ? 0x4c385f : 0x45402e)
              .stroke({ color, width: c.kind === "giant" ? 2.8 : 2 });
          }
          if (!kitArt && c.kind === "turret") {
            constructGraphics.circle(x, y, r * 0.85).fill(0x28394b);
            constructGraphics
              .moveTo(x, y)
              .lineTo(x + r * 1.7, y - r * 0.5)
              .stroke({ color: 0xa8d8ff, width: 4 });
          } else if (!kitArt) {
            constructGraphics
              .circle(x, y, r)
              .fill(c.kind === "giant" ? 0xb8a0ff : 0xb5e28d)
              .stroke({ color, width: 2 });
            constructGraphics
              .circle(x - r * 0.3, y - r * 0.1, 2)
              .circle(x + r * 0.3, y - r * 0.1, 2)
              .fill(0x172132);
          }
          hudGraphics
            .rect(x - r, y - r - 7, r * 2, 3)
            .fill(0x232323)
            .rect(x - r, y - r - 7, (r * 2 * c.hp) / c.maxHp, 3)
            .fill(color);
        }
        for (const e of state.events) {
          const age = visualTick - e.tick,
            source = state.fighters[e.source];
          if (!effects || age < 0 || age > 12 || !source) continue;
          if (e.type === "kit:beam" && e.x !== undefined && e.y !== undefined)
            g.moveTo(source.x * sx, source.y * sy)
              .lineTo(e.x * sx, e.y * sy)
              .stroke({
                color: source.characterId === "char_06" ? 0x91eeff : 0xff6475,
                width: Math.max(3, e.amount * sx * 100),
                alpha: 0.75 * (1 - age / 13),
              });
          if (e.type === "kit:explosion:rocket" && e.amount > 600)
            g.rect(0, 0, config.width * sx, config.height * sy).fill({
              color: 0xff9b40,
              alpha: 0.16 * (1 - age / 13),
            });
          if (
            e.type.startsWith("kit:explosion:") &&
            e.x !== undefined &&
            e.y !== undefined
          )
            g.circle(
              e.x * sx,
              e.y * sy,
              e.amount * 100 * sx * (0.4 + age / 18),
            ).stroke({
              color: 0xffc16c,
              width: 3,
              alpha: 0.8 * (1 - age / 13),
            });
        }
        state.pending.slice(0, 80).forEach((p) => {
          const owner = state.fighters[p.owner];
          if (!owner) return;
          const at = p.target !== undefined ? state.fighters[p.target] : p;
          if (!at) return;
          const radius = p.kind === "deadline" ? 30 : 23;
          const pulse = 0.5 + 0.5 * Math.sin(visualTick * 0.24);
          g.circle(at.x * sx, at.y * sy, radius)
            .fill({ color: 0xffca78, alpha: 0.025 + pulse * 0.025 })
            .stroke({ color: 0xffd68b, width: 1.4, alpha: 0.4 + pulse * 0.25 });
          g.circle(at.x * sx, at.y * sy, radius + 5 + pulse * 3).stroke({
            color: 0xffb868,
            width: 1,
            alpha: 0.2,
          });
        });
        effectNodes.forEach((sprite, i) => {
          const fx = effectData[i];
          if (!effects) {
            sprite.visible = effectBlends[i].visible = false;
            fx.active = false;
            return;
          }
          if (!fx.active) return;
          const blend = effectBlends[i];
          const progress = (visualTick - fx.tick) / fx.life;
          if (progress >= 1) {
            sprite.visible = blend.visible = false;
            fx.active = false;
            return;
          }
          const fire =
            fx.kind === "superBurst" ||
            ((fx.kind === "characterSuper" || fx.kind === "characterSkill") &&
              characterFxFamily(fx.characterId) === "explosion");
          const smallImpact =
            fx.kind === "impactBurst" ||
            fx.kind === "slash" ||
            fx.kind === "clash" ||
            fx.kind === "shatter";
          if (fx.kind === "healBurst" || fx.kind === "shieldBurst") {
            sprite.visible = blend.visible = false;
            if (progress >= 0)
              supportBurst(
                particles,
                fx.x,
                fx.y,
                progress,
                fx.size,
                fx.kind === "healBurst",
              );
            return;
          }
          if (fire || smallImpact) {
            sprite.visible = blend.visible = false;
            if (progress >= 0) {
              if (fire)
                fireBurst(
                  particles,
                  fx.x,
                  fx.y,
                  progress,
                  fx.size,
                  fx.tick * 0.1,
                );
              else
                impact(
                  particles,
                  fx.x,
                  fx.y,
                  progress,
                  fx.size,
                  fx.rotation,
                  fx.kind === "shatter" ? 0xffa797 : 0xffedbe,
                );
            }
            return;
          }
          if (fx.kind === "characterSuper")
            energyRing(
              particles,
              fx.x,
              fx.y,
              (23 + progress * 42) * fx.size,
              visualTick * 1.5,
              characterFxColor(fx.characterId),
              (1 - progress) ** 2 * 0.5,
            );
          let frames: Texture[] | undefined;
          if (isCombatFx(fx.kind)) {
            frames = animatedFx[fx.kind];
          } else if (
            fx.kind === "characterSkill" ||
            fx.kind === "characterSuper" ||
            fx.kind === "characterItem"
          ) {
            frames =
              personalAnimatedFx[fx.characterId || ""]?.[
                fx.kind === "characterSuper" ? "super" : "skill"
              ];
          }
          if (generatedFx && fx.kind in generatedFx) {
            frames = generatedFx[fx.kind as FxKind];
          }
          const sample = effectFrame(progress, frames?.length || 1);
          const motion = effectMotion(fx.kind, progress);
          if (frames?.length) {
            sprite.texture = frames[sample.frame];
            blend.texture = frames[sample.next];
          }
          sprite.visible = progress >= 0;
          blend.visible = sprite.visible && sample.mix > 0;
          sprite.alpha = motion.alpha * (1 - sample.mix);
          blend.alpha = motion.alpha * sample.mix;
          for (const node of [sprite, blend]) {
            node.position.set(fx.x, fx.y - motion.rise);
            node.scale.set((motion.scale * fx.size * 128) / node.texture.width);
            node.rotation = fx.rotation + motion.turn;
          }
        });
        for (const mote of motes) {
          const age = visualTick - mote.tick;
          if (age < 0 || age >= mote.life) continue;
          const progress = age / mote.life;
          const distance = (1 - Math.exp(-age * 0.085)) / 0.085;
          const x = mote.x + mote.vx * distance;
          const y = mote.y + mote.vy * distance + age * age * 0.009;
          const alpha = (1 - progress) ** 1.7 * 0.75;
          particles
            .moveTo(
              x - mote.vx * (1 - progress) * 1.8,
              y - mote.vy * (1 - progress) * 1.8,
            )
            .lineTo(x, y)
            .stroke({
              color: mote.color,
              width: 1.4 * (1 - progress) + 0.3,
              alpha,
            });
        }
        const shown = state.events
          .filter(
            (e) =>
              visualTick - e.tick >= 0 &&
              visualTick - e.tick < 35 &&
              (e.type === "super" ||
                e.type.startsWith("skill:") ||
                e.type.startsWith("bond:") ||
                e.type.startsWith("item:") ||
                e.type.startsWith("affinity:") ||
                e.type.startsWith("status:") ||
                e.type.startsWith("group:")),
          )
          .slice(-10);
        callouts.forEach((text, i) => {
          const e = shown[i];
          text.visible = effects && !!e;
          if (!e) return;
          const f =
              state.fighters[
                e.type.startsWith("status:") ? e.target : e.source
              ],
            age = visualTick - e.tick;
          if (!f) return;
          const c = character(f.characterId);
          let label =
            e.type === "clash"
              ? "⚔ CLASH!"
              : e.type === "super"
                ? "★ " + (c?.super[0] || "SUPER")
                : e.type.startsWith("skill:")
                  ? c?.skill[0] || "Kỹ năng"
                  : e.type.startsWith("bond:")
                    ? "✦ " +
                      (BONDS.find((b) => b.id === e.type.slice(5))?.name ||
                        "Liên kết")
                    : e.type.startsWith("group:")
                      ? "♥ " +
                        (e.type === "group:G11" && e.amount === 2
                          ? "Ghép Đôi Vá Nóng"
                          : FRIEND_GROUPS.find((g) => g.id === e.type.slice(6))
                              ?.name || "Hội bạn")
                      : e.type.startsWith("affinity:")
                        ? "✦ HỢP CẠ!"
                        : e.type === "item:01"
                          ? "TÍCH!"
                          : e.type === "item:15"
                            ? "MÁT RỒI!"
                            : e.type === "item:18"
                              ? "TỰ TIN!"
                              : e.type === "item:20"
                                ? "THẾ CỜ VƯỜN HỒNG"
                                : "HIỆU ỨNG ĐỒ";
          text.text = label;
          const status = e.type.startsWith("status:")
            ? (e.type.slice(7) as keyof typeof STATUS_RULES)
            : undefined;
          if (status && STATUS_RULES[status])
            text.text = STATUS_RULES[status].label;
          text.style.fill =
            status && status in DAMAGE_PALETTE
              ? DAMAGE_PALETTE[status as keyof typeof DAMAGE_PALETTE].color
              : status === "blessing"
                ? SUPPORT_PALETTE.heal.color
                : 0xffe28b;
          text.position.set(
            Math.max(
              70,
              Math.min(
                viewWidth - 70,
                (e.type === "clash" ? (e.x ?? f.x) : f.x) * sx,
              ),
            ),
            Math.max(
              20,
              (e.type === "clash" ? (e.y ?? f.y) : f.y) * sy - 28 - age * 0.7,
            ),
          );
          text.alpha = Math.min(1, (35 - age) / 12);
        });
        state.fighters.forEach((f, i) => {
          const position = pose(f, previousFighters);
          const sampledHeading =
            replay?.format === 1
              ? (replayHeadings.get(f.id) ?? f.angle)
              : (position.angle ?? f.angle);
          let heading = weaponHeadings.get(f.id);
          if (!heading) {
            heading = createWeaponHeading(sampledHeading);
            weaponHeadings.set(f.id, heading);
          }
          updateWeaponHeading(
            heading,
            sampledHeading,
            Math.max(0, now - last) * 0.03,
            clashed.has(f.id),
          );
          const x = position.x * sx,
            y = position.y * sy,
            r = f.radius * sx,
            visualRadius = r * (state.fighters.length <= 30 ? 1.38 : 1.25),
            color =
              colors[
                config.teams.findIndex((t) => t.id === f.team) % colors.length
              ];
          labels[i].visible = f.hp > 0;
          if (f.hp > 0 && f.characterId === "char_22") {
            g.circle(x, y, 160 * 100 * sx).stroke({
              color: 0xc8b3ff,
              width: 1.2,
              alpha: 0.18,
            });
          }
          let burning = f.burnUntil > state.tick,
            buffed = false,
            radiated = false,
            paralyzed = false;
          for (const effect of f.statuses) {
            if (effect.until <= state.tick) continue;
            if (
              effect.kind === "burn" ||
              effect.kind === "poison" ||
              effect.kind === "bleeding" ||
              effect.kind === "radiation"
            ) {
              burning = true;
              if (effect.kind === "poison" || effect.kind === "radiation")
                radiated = true;
            }
            if (
              effect.kind === "rage" ||
              effect.kind === "blessing" ||
              effect.kind === "introvert"
            )
              buffed = true;
            if (
              effect.kind === "paralyzed" ||
              effect.kind === "stunned" ||
              effect.kind === "myopia" ||
              effect.kind === "pressure" ||
              effect.kind === "diabetes"
            )
              paralyzed = true;
          }
          for (const buff of f.buffs) {
            if (buff.until <= state.tick) continue;
            if (
              buff.kind === "burnDot" ||
              buff.kind === "dot" ||
              buff.kind === "soupDot"
            )
              burning = true;
            if (buff.kind === "radiation") {
              burning = true;
              radiated = true;
            }
            if (
              buff.kind === "attack" ||
              buff.kind === "bonus" ||
              buff.kind === "electric" ||
              buff.kind === "envelope" ||
              buff.kind === "haste"
            )
              buffed = true;
          }
          for (let slot = 0; slot < 3; slot++) {
            const icon = statusNodes[i][slot];
            icon.tint = slot === 0 && radiated ? 0xbfea60 : 0xffffff;
            icon.visible =
              f.hp > 0 &&
              options.current.showEffects &&
              !options.current.low &&
              (slot === 0
                ? burning && radiated
                : slot === 1
                  ? f.slowUntil > state.tick || paralyzed
                  : buffed);
            if (!icon.visible) continue;
            const frames =
              animatedFx[
                slot === 0
                  ? "burnLoop"
                  : slot === 1
                    ? "slowLoop"
                    : "passiveBurst"
              ];
            icon.texture = frames[0];
            icon.position.set(
              x - 14 + slot * 14,
              y + visualRadius + 15 + Math.sin(visualTick * 0.12 + slot) * 1.2,
            );
            icon.width = icon.height = 13;
            icon.alpha = 0.75;
          }
          weapons[i]?.forEach((w) => (w.visible = f.hp > 0));
          const auraKind: EffectKind | null =
            f.superUntil > state.tick
              ? "characterSuper"
              : f.shield > 0
                ? "shield"
                : f.slowUntil > state.tick
                  ? "characterSkill"
                  : null;
          // Persistent auras are living outlines, never a scaled explosion texture.
          if (effects && f.hp > 0 && !options.current.low) {
            const fireActive =
              f.burnUntil > state.tick ||
              f.statuses.some(
                (effect) => effect.kind === "burn" && effect.until > state.tick,
              ) ||
              f.buffs.some(
                (buff) =>
                  (buff.kind === "burnDot" || buff.kind === "soupDot") &&
                  buff.until > state.tick,
              );
            const fireSuper =
              f.superUntil > state.tick &&
              characterFxFamily(f.characterId) === "explosion";
            if (fireActive || fireSuper)
              fireRim(
                ambientFx,
                x,
                y,
                visualRadius,
                visualTick,
                i,
                fireSuper ? 1.2 : 1,
              );
            if (auraKind && !fireSuper)
              energyRing(
                ambientFx,
                x,
                y,
                visualRadius + (f.superUntil > state.tick ? 6 : 4),
                visualTick + i * 7,
                f.shield > 0 && f.superUntil <= state.tick
                  ? 0x9bdfff
                  : characterFxColor(f.characterId),
                f.superUntil > state.tick ? 0.65 : 0.4,
              );
          }
          if (faces[i]) {
            faces[i]!.visible = f.hp > 0;
            masks[i]!.clear();
            if (f.hp > 0) {
              const hit = hitImpulses.get(f.id);
              const hitAge = hit ? visualTick - hit.tick : 100;
              const recoil =
                options.current.showEffects &&
                !options.current.low &&
                hitAge >= 0 &&
                hitAge < 6
                  ? (1 - hitAge / 6) ** 2
                  : 0;
              const squash =
                Math.sin(Math.min(1, hitAge / 6) * Math.PI) * recoil * 0.1;
              faces[i]!.position.set(
                x + (hit?.dx || 0) * recoil * 2,
                y + (hit?.dy || 0) * recoil * 2,
              );
              faces[i]!.width = visualRadius * 2.2 * (1 + squash);
              faces[i]!.height = visualRadius * 2.2 * (1 - squash);
              faces[i]!.tint = recoil > 0.65 ? 0xffe5ce : 0xffffff;
              faces[i]!.scale.x = Math.abs(faces[i]!.scale.x) * (f.facing || 1);
              masks[i]!.circle(x, y, visualRadius * 0.98).fill(0xffffff);
            }
          }
          const rack = weapons[i];
          if (rack) for (const weapon of rack) weapon.visible = f.hp > 0;
          if (f.hp <= 0) return;
          labels[i].position.set(
            f.boss ? x : x + (f.characterId ? visualRadius : 0),
            f.boss
              ? y - visualRadius - 29
              : y + (f.characterId ? visualRadius : 0),
          );
          if (f.boss)
            bodyGraphics.circle(x, y, visualRadius + 6).stroke({
              color: 0xffca68,
              width: 3,
              alpha: 0.85,
            });
          bodyGraphics
            .circle(x, y, visualRadius + 3)
            .fill({ color, alpha: 0.18 });
          if (options.current.highlightTeamId === f.team)
            bodyGraphics.circle(x, y, visualRadius + 7).stroke({
              color: 0xffe18a,
              width: 3,
              alpha: 0.95,
            });
          if (
            options.current.watchedTeamId === f.team &&
            options.current.watchedTeamId !== options.current.highlightTeamId
          )
            bodyGraphics.circle(x, y, visualRadius + 12).stroke({
              color: 0x70d9ff,
              width: 2,
              alpha: 0.9,
            });
          bodyGraphics
            .circle(x, y, visualRadius)
            .fill(CHARACTERS[f.classId].color)
            .stroke({ color, width: 3 });
          const number = Number(f.characterId?.slice(-2) || 0);
          const count = weaponCount(f);
          for (let w = 0; w < count; w++) {
            const renderAngle = ((heading.angle + w * 16) * Math.PI) / 16,
              d = [Math.cos(renderAngle) * 1024, Math.sin(renderAngle) * 1024],
              reach = weaponReach(state, f, w) * sx;
            const weapon = weapons[i]?.[w];
            if (w === 1 && (number === 15 || number === 33)) {
              if (weapon && kitArt) {
                const cx =
                  x +
                  (d[0] *
                    (number === 15 ? r + 1600 * sx : r + (reach - r) * 0.5)) /
                    1024;
                const cy =
                  y +
                  (d[1] *
                    (number === 15 ? r + 1600 * sx : r + (reach - r) * 0.5)) /
                    1024;
                weapon.position.set(cx, cy);
                weapon.width =
                  number === 15
                    ? 2800 *
                      sx *
                      (1 + Math.min(12, Math.floor(state.tick / 300)) * 0.05)
                    : (reach - r) * 0.85;
                weapon.height =
                  (weapon.width * weapon.texture.height) / weapon.texture.width;
                weapon.rotation = renderAngle;
                continue;
              }
              if (weapon) weapon.visible = false;
              const wx =
                  x +
                  (d[0] * (number === 15 ? r + 1600 * sx : reach * 0.8)) / 1024,
                wy =
                  y +
                  (d[1] * (number === 15 ? r + 1600 * sx : reach * 0.8)) / 1024;
              if (number === 15)
                trails
                  .circle(
                    wx,
                    wy,
                    1400 *
                      sx *
                      (1 + Math.min(12, Math.floor(state.tick / 300)) * 0.05),
                  )
                  .fill({ color: 0x78c9f5, alpha: 0.4 })
                  .stroke({ color: 0xbdeeff, width: 2 });
              else {
                trails
                  .moveTo(x, y)
                  .lineTo(wx, wy)
                  .stroke({ color: 0xf4dfb4, width: 5 });
                trails
                  .circle(wx, wy, 10)
                  .fill(0xe89750)
                  .stroke({ color: 0xffdda3, width: 1.5 });
              }
              continue;
            }
            if (
              options.current.showEffects &&
              !options.current.low &&
              Math.abs(heading.velocity) > 0.01
            ) {
              const angle = renderAngle;
              const spin = Math.sign(heading.velocity) || 1;
              const trailRadius = reach * 0.92,
                sweep = Math.min(
                  0.55,
                  ((Math.abs(heading.velocity) * Math.PI) / 16) * 0.9,
                ),
                startAngle = angle - spin * sweep;
              trails
                .moveTo(
                  x + Math.cos(startAngle) * trailRadius,
                  y + Math.sin(startAngle) * trailRadius,
                )
                .arc(x, y, trailRadius, startAngle, angle, spin < 0)
                .stroke({ color, width: 5, alpha: 0.15 });
            }
            if (weapon) {
              weapon.position.set(
                x + (d[0] * r * 0.7) / 1024,
                y + (d[1] * r * 0.7) / 1024,
              );
              const length = Math.max(1, reach - r * 0.7);
              const angle = renderAngle;
              if (kitArt) {
                weapon.width = length;
                weapon.height =
                  (length * weapon.texture.height) / weapon.texture.width;
                weapon.rotation = angle;
              } else if (number >= 26) {
                // Custom #26–33 silhouettes point up, with the grip at the bottom.
                // Rotate from that axis so the tip follows the physical weapon reach.
                weapon.height = length / 0.95;
                weapon.width =
                  weapon.height *
                  (f.classId === "ranger" || f.classId === "frost"
                    ? 0.98
                    : 1.12);
                weapon.rotation = angle + Math.PI / 2;
              } else if (number >= 21) {
                weapon.height = length / 0.84;
                weapon.width = Math.max(18, weapon.height * 0.5);
                weapon.rotation =
                  angle + (number === 24 ? -Math.PI / 2 : Math.PI / 2);
              } else {
                weapon.width = length / 0.88;
                weapon.height = Math.max(26, Math.min(46, length * 0.9));
                weapon.rotation = angle;
              }
            }
            trails
              .moveTo(x + (d[0] * r) / 1024, y + (d[1] * r) / 1024)
              .lineTo(x + (d[0] * reach) / 1024, y + (d[1] * reach) / 1024)
              .stroke({
                color: 0xf4f2f2,
                width: weapon ? 2 : f.classId === "guardian" ? 10 : 6,
                alpha: weapon ? 0.18 : 1,
              });
          }
          const barWidth = f.boss ? 82 : 46;
          hudGraphics
            .rect(x - barWidth / 2, y - visualRadius - 13, barWidth, 5)
            .fill(0x393334);
          hudGraphics
            .rect(
              x - barWidth / 2,
              y - visualRadius - 13,
              (barWidth * f.hp) / f.stats.hp,
              5,
            )
            .fill(color);
          hudGraphics
            .rect(
              x - barWidth / 2,
              y - visualRadius - 7,
              (barWidth * f.energy) / 100,
              2,
            )
            .fill(0x9c94ff);
          if (f.shield > 0)
            hudGraphics
              .rect(
                x - barWidth / 2,
                y - visualRadius - 17,
                barWidth * Math.min(1, f.shield / 100),
                3,
              )
              .fill(0x8cdbff);
          if (burning)
            hudGraphics.circle(x, y, visualRadius + 5).stroke({
              color: 0xff933b,
              width: 2,
              alpha: 0.75,
            });
          if (f.characterId) {
            hudGraphics
              .rect(
                x - 23,
                y + visualRadius + 5,
                (46 * Math.min(12, Math.floor(state.tick / 300))) / 12,
                2,
              )
              .fill(0xffcb75);
          }
        });
        projectileNodes.forEach((sprite, i) => {
          const p = state.projectiles[i];
          rocketAttachments[i].visible = false;
          if (!p) {
            sprite.visible = false;
            return;
          }
          sprite.visible = true;
          const owner = state.fighters[p.owner];
          const personalFrames =
            personalAnimatedFx[owner?.characterId || ""]?.projectile;
          const frames = personalFrames || animatedFx.projectile;
          sprite.texture =
            frames[Math.floor((state.tick + p.id) / 2) % frames.length];
          sprite.tint = personalFrames
            ? 0xffffff
            : p.kind === "super"
              ? 0xffca60
              : p.normal
                ? 0x92edff
                : 0xe3a4ff;
          const trailColor = personalFrames
            ? characterFxColor(owner.characterId)
            : sprite.tint;
          const position = pose(p, previousProjectiles);
          sprite.position.set(position.x * sx, position.y * sy);
          sprite.width =
            p.kit === "balloon" || p.kit === "chicken" || p.kit === "basket"
              ? (p.radius || 700) * sx * 3
              : personalFrames
                ? p.kind === "super"
                  ? 55
                  : p.normal
                    ? 35
                    : 43
                : p.kind === "super"
                  ? 38
                  : p.normal
                    ? 25
                    : 30;
          sprite.height =
            p.kit === "balloon" || p.kit === "basket"
              ? sprite.width
              : personalFrames
                ? p.kind === "super"
                  ? 38
                  : p.normal
                    ? 25
                    : 31
                : p.kind === "super"
                  ? 24
                  : 17;
          if (kitArt && p.kit && kitArt.objects[p.kit]) {
            sprite.texture =
              p.kit === "shrapnel"
                ? p.id % 3 === 0
                  ? kitArt.objects.shield
                  : p.id % 3 === 1
                    ? kitArt.weapons.char_15
                    : kitArt.objects.shrapnel
                : kitArt.objects[p.kit];
            sprite.tint = 0xffffff;
            const bodySize = (p.radius || 450) * 2 * sx;
            sprite.width =
              p.kit === "balloon" || p.kit === "basket" || p.kit === "chicken"
                ? Math.max(18, bodySize * 1.4)
                : Math.max(20, bodySize * 2.3);
            sprite.height =
              (sprite.width * sprite.texture.height) / sprite.texture.width;
            if (p.kit === "balloon")
              sprite.height = Math.max(sprite.height, sprite.width * 1.15);
          }
          sprite.rotation =
            p.kit === "balloon"
              ? Math.sin(visualTick * 0.09 + p.id) * 0.08
              : Math.atan2(p.vy, p.vx);
          if (
            kitArt &&
            p.kit === "balloon" &&
            p.kind === "super" &&
            characterKit(owner.characterId, owner.equipment)?.id === "skyrocket"
          ) {
            const rocket = rocketAttachments[i];
            rocket.visible = true;
            rocket.position.set(
              position.x * sx,
              position.y * sy + sprite.height * 0.25,
            );
            rocket.width = sprite.width * 0.85;
            rocket.height =
              (rocket.width * rocket.texture.height) / rocket.texture.width;
            rocket.rotation = Math.atan2(p.vy, p.vx);
          }
          const speed = Math.max(1, Math.hypot(p.vx, p.vy));
          const trail = p.kind === "super" ? 2600 : 1800;
          // Tapered segments dissolve into the arena instead of a rigid bright rod.
          const segments = options.current.low ? 2 : 5;
          for (let segment = 0; segment < segments; segment++) {
            const a = segment / segments,
              b = (segment + 1) / segments;
            trails
              .moveTo(
                (position.x - (p.vx * trail * a) / speed) * sx,
                (position.y - (p.vy * trail * a) / speed) * sy,
              )
              .lineTo(
                (position.x - (p.vx * trail * b) / speed) * sx,
                (position.y - (p.vy * trail * b) / speed) * sy,
              )
              .stroke({
                color: trailColor,
                width: (p.kind === "super" ? 4 : 2.5) * (1 - a),
                alpha: 0.38 * (1 - a) ** 2,
              });
          }
        });
        const events = state.events.filter((e) => e.type === "kill");
        if (events.length > heard && !options.current.muted) {
          try {
            audio ??= new AudioContext();
            const osc = audio.createOscillator(),
              gain = audio.createGain();
            osc.connect(gain);
            gain.connect(audio.destination);
            osc.frequency.value = 240;
            gain.gain.setValueAtTime(0.035, audio.currentTime);
            gain.gain.exponentialRampToValueAtTime(
              0.001,
              audio.currentTime + 0.08,
            );
            osc.start();
            osc.stop(audio.currentTime + 0.08);
          } catch {}
        }
        heard = events.length;
        const shakeAge = visualTick - shakeAt;
        const shake =
          options.current.showEffects &&
          !options.current.low &&
          shakeAge >= 0 &&
          shakeAge < 10
            ? shakeAmount * (1 - shakeAge / 10) ** 2
            : 0;
        instance.stage.position.set(
          Math.sin(visualTick * 2.1) * shake,
          Math.cos(visualTick * 2.7) * shake * 0.65,
        );
        instance.renderer.render(instance.stage);
        if (now - hudTime > 250) {
          const winningTeam = state.finished
            ? options.current.officialResult ||
              state.fighters.find((f) => f.hp > 0)?.team ||
              calculateBattleResult(state)[0]?.id ||
              ""
            : "";
          if (state.finished && !completionReported) {
            completionReported = true;
            options.current.onFinished?.(winningTeam);
            // Late joiners still need all event chunks for an honest complete history.
            const completedState = state;
            void (async () => {
              if (replay?.format === 1)
                for (const chunk of replay.chunks) {
                  if (disposed) return;
                  const received = await options.current.loadReplayChunk(
                    chunk.index,
                  );
                  recorder.replay(
                    received,
                    battle.fighters,
                    options.current.highlightTeamId,
                  );
                }
              if (!disposed)
                options.current.onBattleComplete?.(
                  recorder.finish(
                    completedState,
                    config,
                    winningTeam,
                    replay?.format === 1,
                  ),
                );
            })().catch(() => {
              if (!disposed)
                options.current.onError(
                  "Chưa lưu được thống kê đầy đủ của trận này vì thiếu dữ liệu replay.",
                );
            });
          }
          setHud({
            tick: state.tick,
            alive: new Set(
              state.fighters.filter((f) => f.hp > 0).map((f) => f.team),
            ).size,
            fps: Math.round(1000 / Math.max(1, now - last)),
            hash: state.finished
              ? replay?.finalHash || calculateStateHash(state)
              : "",
            kills: events
              .slice(-4)
              .map((e) => {
                const killer = state.fighters[e.source];
                const victim = state.fighters[e.target];
                if (e.source === -1 && victim)
                  return `Áp lực bo - Hạ gục ${characterKit(victim.characterId, victim.equipment)?.name || CHARACTERS[victim.classId].name} - Đội ${config.teams.findIndex((team) => team.id === victim.team) + 1}`;
                if (!killer || !victim) return "";
                const killerName =
                    characterKit(killer.characterId, killer.equipment)?.name ||
                    CHARACTERS[killer.classId].name,
                  victimName =
                    characterKit(victim.characterId, victim.equipment)?.name ||
                    CHARACTERS[victim.classId].name,
                  killerTeam =
                    config.teams.findIndex((team) => team.id === killer.team) +
                    1,
                  victimTeam =
                    config.teams.findIndex((team) => team.id === victim.team) +
                    1;
                return `${killerName} - Đội ${killerTeam} - Hạ gục ${victimName} - Đội ${victimTeam}`;
              })
              .filter(Boolean),
            result: state.finished ? winningTeam : "",
          });
          setFighters(structuredClone(state.fighters));
          setHasDamageStats(
            replay?.format !== 1 ||
              frames.some(
                (frame) => frame.tick <= state.tick && !!frame.damageStats,
              ),
          );
          hudTime = now;
        }
        last = now;
        frame = requestAnimationFrame(draw);
      }
      frame = requestAnimationFrame(draw);
    }
    init().catch((e) => {
      if (!disposed)
        options.current.onError("Không khởi tạo được đồ họa: " + e.message);
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      audio?.close();
      if (app?.renderer) app.destroy(true);
    };
  }, [config, seed, replay]);
  const closing = closingTempo(hud.tick, config.shrinkSeconds);
  return (
    <div className="arena-shell">
      <div className="arena-top">
        <span>
          <i className="live-dot" />{" "}
          {label || (replay ? "REPLAY CHÍNH THỨC" : "PHÒNG TẬP OFFLINE")}
        </span>
        <span>
          {hud.alive} đội · {(hud.tick / 30).toFixed(1)}s · Tường{" "}
          {Math.min(30, config.shrinkSeconds / 2)}–{config.shrinkSeconds}s
        </span>
      </div>
      {closing.active && !hud.result && (
        <div className="arena-closing" role="status">
          <b>
            {hud.tick >= config.shrinkSeconds * 30
              ? "QUYẾT ĐẤU"
              : "BO ĐANG THU"}
          </b>
          <span>
            Sát thương ×{(closing.damage / 100).toFixed(1)} · Hồi máu/khiên còn{" "}
            {closing.recovery}%
            {` · Di chuyển ×${(closing.speed / 100).toFixed(1)} · Nhịp đánh/xoay ×${(closing.haste / 100).toFixed(1)}`}
          </span>
        </div>
      )}
      <div className="team-color-legend" aria-label="Màu của từng đội">
        {config.teams.map((team, index) => {
          const color = TEAM_COLORS[index % TEAM_COLORS.length];
          return (
            <span
              key={team.id}
              className="team-color-key"
              style={{ borderColor: color.css }}
            >
              <i style={{ backgroundColor: color.css }} aria-hidden="true" />
              <b>
                {index + 1}. {team.name || `Đội ${index + 1}`}
              </b>
              <small>{color.name}</small>
            </span>
          );
        })}
      </div>
      <div
        className="canvas-mount"
        style={{ aspectRatio: `${config.width}/${config.height}` }}
        ref={mount}
      />
      <div className="arena-bottom">
        <span>
          {hud.hash
            ? `Kết thúc · ${hud.hash} · ${hud.result.slice(0, 12)}`
            : "Bi-a tự động · vũ khí xoay · không điều khiển trực tiếp"}
        </span>
        <span>
          {import.meta.env.DEV
            ? `${hud.fps} FPS · tick ${hud.tick}`
            : "30 ticks/s"}
          {` · Tăng trưởng riêng ${Math.min(12, Math.floor(hud.tick / 300))}/12 tầng`}
        </span>
      </div>
      <div className="kill-feed">
        {hud.kills.map((k, i) => (
          <small key={i}>{k}</small>
        ))}
      </div>
      <div className="fighter-list" aria-label="Nhân vật trong trận">
        {fighters.map((f) => (
          <button
            className={"fighter-token " + (f.hp <= 0 ? "dead" : "")}
            key={f.id}
            onClick={() => onInspect?.(f, hud.tick)}
          >
            {f.characterId && (
              <Portrait
                id={f.characterId}
                transformed={isTransformedCharacter(f.characterId, f.equipment)}
              />
            )}
            <span>
              Đội {config.teams.findIndex((t) => t.id === f.team) + 1} · Slot{" "}
              {f.slot + 1}
              <br />
              {characterKit(f.characterId, f.equipment)?.name ||
                CHARACTERS[f.classId].name}
              <br />
              {f.hp} HP · {f.energy}⚡
              <small className="fighter-damage">
                ST gây: {hasDamageStats ? f.dealt.toLocaleString("vi-VN") : "—"}{" "}
                · ST nhận:{" "}
                {hasDamageStats ? f.taken.toLocaleString("vi-VN") : "—"}
              </small>
              {f.metrics && <small className="fighter-support">Hồi ĐĐ: {f.metrics.allyHealing.toLocaleString("vi-VN")} · Đỡ ĐĐ: {f.metrics.allyShieldAbsorbed.toLocaleString("vi-VN")} · KC: {(f.metrics.controlTicks / 30).toFixed(1)}s</small>}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
