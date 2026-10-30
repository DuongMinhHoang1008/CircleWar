import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { MASTERIES } from "../../packages/shared/src/mastery";
import { loanUnit, adventureConfig } from "../../packages/shared/src/adventure";
import { createBattle, stepBattle, ENGINE_VERSION } from "../../packages/battle-engine/src/index";
import type { CharacterId } from "../../packages/shared/src/catalog";

// Read-only balance review: never modifies mastery definitions or game state on disk.
const samples = 8;
const contexts = [
  { name: "frontline-support", partners: ["char_15", "char_13", "char_11"] },
  { name: "ranged-pressure", partners: ["char_05", "char_31", "char_06"] },
];
let battles = 0;
function simulate(characterId: string, partners: string[], seed: number, side: number, masteryId?: string) {
  const ids = [characterId, ...partners.filter(id => id !== characterId).slice(0, 2)] as CharacterId[];
  const teams = [ids.map(id => loanUnit(id)), ids.map(id => loanUnit(id))];
  teams[side][0].masteryId = masteryId;
  const state = createBattle(adventureConfig(teams[0], teams[1]), seed);
  let activations = 0;
  while (!state.finished && state.tick < 5400) {
    stepBattle(state);
    if (masteryId) activations += state.events.filter(e => e.tick === state.tick && e.type === `mastery:${masteryId}`).length;
  }
  assert.ok(state.finished);
  assert.ok(state.fighters.every(f => Number.isInteger(f.hp) && f.hp >= 0 && Number.isFinite(f.x) && Number.isFinite(f.y)));
  const team = side === 0 ? "team-player" : "team-rival";
  const living = new Set(state.fighters.filter(f => f.hp > 0).map(f => f.team));
  const actor = state.fighters.find(f => f.team === team && f.characterId === characterId)!;
  const allies = state.fighters.filter(f => f.team === team);
  const damage = (f: typeof actor) => Object.values(f.metrics.damageByType).reduce((a, b) => a + b, 0);
  battles++;
  return {
    score: living.size === 1 ? (living.has(team) ? 1 : 0) : 0.5,
    win: living.size === 1 && living.has(team) ? 1 : 0,
    draw: living.size !== 1 ? 1 : 0,
    actorDamage: damage(actor),
    teamDamage: allies.reduce((n, f) => n + damage(f), 0),
    allyHealing: actor.metrics.allyHealing,
    allyAbsorbed: actor.metrics.allyShieldAbsorbed,
    allyBuffSeconds: actor.metrics.allyBuffTicks / 30,
    controlSeconds: actor.metrics.controlTicks / 30,
    friendlyDamage: actor.metrics.friendlyDamage,
    supers: actor.supers,
    survivalSeconds: (actor.deadAt < 0 ? state.tick : actor.deadAt) / 30,
    activations,
  };
}
const rows = [];
for (const characterId of [...new Set(MASTERIES.map(m => m.characterId))]) {
  const byContext = [];
  for (const context of contexts) {
    const baselines = [];
    for (let sample = 0; sample < samples; sample++) for (const side of [0, 1]) {
      const seed = 20261030 + sample * 7907;
      baselines.push({ seed, side, result: simulate(characterId, context.partners, seed, side) });
    }
    const mean = (values: ReturnType<typeof simulate>[]) => Object.fromEntries(
      Object.keys(values[0]).map(key => [key, values.reduce((sum, value) => sum + value[key as keyof typeof value], 0) / values.length]),
    );
    const baseline = mean(baselines.map(b => b.result));
    const skills = MASTERIES.filter(m => m.characterId === characterId).map(skill => {
      const results = baselines.map(b => simulate(characterId, context.partners, b.seed, b.side, skill.id));
      const stats = mean(results);
      return { id: skill.id, name: skill.name, matches: results.length, ...stats, scoreDelta: stats.score - baseline.score,
        actorDamageRatio: baseline.actorDamage ? stats.actorDamage / baseline.actorDamage : null,
        teamDamageRatio: baseline.teamDamage ? stats.teamDamage / baseline.teamDamage : null };
    });
    byContext.push({ name: context.name, baseline, skills });
  }
  rows.push({ characterId, contexts: byContext });
  console.log(`${characterId}: ${battles} battles`);
}
writeFileSync(process.env.MASTERY_AUDIT_FILE || "reports/mastery-review/after-v38.json", JSON.stringify({
  date: "2026-10-30", engine: ENGINE_VERSION, battles, samples,
  method: "99 masteries; Lv10 without equipment; two mirrored 3v3 partner contexts; eight seeds each tested on both sides; matched no-mastery baseline per character/context/seed/side. Draw scores 0.5. Descriptive screening only, not a population win-rate estimate. Legacy target falls back to engine default; no target optimization.",
  rows,
}, null, 2));
