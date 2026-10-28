import type { BattleState, Fighter } from "./types";
import { div } from "./math";
import { closingTempo } from "./pacing";
import { recordShielding } from "./metrics";
export function masteryAlly(s: BattleState, source: Fighter) {
  return (
    s.fighters.find(
      (f) =>
        f.hp > 0 &&
        f.team === source.team &&
        f !== source &&
        f.characterId === source.masteryTarget,
    ) ||
    s.fighters.find((f) => f.hp > 0 && f.team === source.team && f !== source)
  );
}
export function weakestAlly(s: BattleState, source: Fighter) {
  return s.fighters
    .filter((f) => f.hp > 0 && f !== source && f.team === source.team)
    .sort((a, b) => a.hp * b.stats.hp - b.hp * a.stats.hp || a.id - b.id)[0];
}
export function masteryShield(
  s: BattleState,
  source: Fighter,
  target: Fighter,
  raw: number,
  ticks: number,
) {
  if (source.hp <= 0 || target.hp <= 0) return;
  const amount = Math.max(
    0,
    Math.min(
      div(raw * closingTempo(s.tick, s.config.shrinkSeconds).recovery, 100),
      100 - target.shield,
    ),
  );
  if (!amount) return;
  target.shield += amount;
  target.shields.push({ source: source.id, amount, until: s.tick + ticks });
  recordShielding(source, target, amount);
  s.events.push({
    tick: s.tick,
    type: "shield",
    source: source.id,
    target: target.id,
    amount,
    shieldKind: "shield",
  });
}
