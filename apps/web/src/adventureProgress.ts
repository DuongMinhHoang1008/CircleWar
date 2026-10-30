import { type Experience } from "../../../packages/shared/src/experience";
import { MASTERY } from "../../../packages/shared/src/adventure";
import type { BattleSummary, BattleUnit } from "./battleAnalytics";
import { masteriesFor } from "../../../packages/shared/src/mastery";
import { journeyObjective, type JourneyObjective } from "../../../packages/shared/src/mastery-journey";

function meetsObjective(objective: JourneyObjective, unit: BattleUnit, summary: BattleSummary): boolean {
  const metrics = unit.support, amount = objective.amount;
  switch (objective.kind) {
    case "effect": return (metrics?.effects[objective.effect!] || 0) >= amount;
    case "damage": return !!unit.maxHp && (unit.combat?.damage || 0) * 100 >= unit.maxHp * amount;
    case "control": return (metrics?.controlTicks || 0) >= amount;
    case "healing": return (metrics?.healing || 0) >= amount;
    case "allyHealing": return (metrics?.allyHealing || 0) >= amount;
    case "shielding": return (metrics?.shielding || 0) >= amount;
    case "allyShielding": return Math.max(metrics?.allyShielding || 0, metrics?.allyShieldAbsorbed || 0) >= amount;
    case "buff": return Math.max(metrics?.buffsApplied || 0, metrics?.allyBuffTicks ? 1 : 0) >= amount;
    case "buffTime": return (metrics?.allyBuffTicks || 0) >= amount;
    case "endure": return (unit.aliveTicks || 0) >= amount * 30 && (unit.combat?.taken || 0) > 0;
    case "bond": return summary.tactics.bonds + summary.tactics.groups >= amount;
    default: return false;
  }
}

export function advanceMastery(
  experience: Experience,
  summary: BattleSummary,
): Experience {
  const mastery = { ...experience.mastery },
    titles = [...experience.titles],
    notices = [...(experience.masteryNotices || [])];
  for (const mission of MASTERY) {
    const unit = summary.units.find(
      (u) => u.team === "team-player" && u.characterId === mission.id,
    );
    if (!unit) continue;
    const objective = journeyObjective(mission.id, mastery[mission.id] || 0);
    const qualifying = objective.kind === "winOrSignature"
      ? summary.winner === "team-player" || meetsObjective(mission.objectives[1], unit, summary)
      : meetsObjective(objective, unit, summary);
    if (!qualifying) continue;
    mastery[mission.id] = Math.min(1_000_000, (mastery[mission.id] || 0) + 1);
    for (const skill of masteriesFor(mission.id))
      if (
        (experience.mastery[mission.id] || 0) < skill.goal &&
        mastery[mission.id] >= skill.goal &&
        !notices.includes(skill.id)
      )
        notices.push(skill.id);
    for (const [index, goal] of [3, 8, 15].entries()) {
      const title = `${mission.title} ${["I", "II", "III"][index]}`;
      if (mastery[mission.id] >= goal && !titles.includes(title))
        titles.push(title);
    }
  }
  return {
    ...experience,
    mastery,
    titles: titles.slice(-100),
    masteryNotices: notices.slice(-99),
  };
}

export function battleFacts(summary: BattleSummary) {
  const units = summary.units.filter((u) => u.team === "team-player");
  const first = units
    .filter((u) => !u.survived)
    .sort((a, b) => (a.aliveTicks ?? Infinity) - (b.aliveTicks ?? Infinity))[0];
  return {
    first,
    damage: units.reduce((n, u) => n + (u.combat?.damage || 0), 0),
    healing: units.reduce((n, u) => n + (u.support?.allyHealing || 0), 0),
    shielding: units.reduce(
      (n, u) => n + (u.support?.allyShieldAbsorbed || 0),
      0,
    ),
    links: summary.tactics.bonds + summary.tactics.groups,
    hint:
      !summary.tactics.bonds && !summary.tactics.groups
        ? "Trận này chưa ghi nhận liên kết/hội kích hoạt. Thử ghép một liên kết trong bảng đội hình."
        : summary.winner !== "team-player"
          ? "Thử đổi một quân hoặc vật phẩm, rồi so trên cùng seed và một seed khác để kiểm tra."
          : "Thử một đội khác hoặc mục tiêu huy chương để khám phá thêm cách thắng.",
  };
}
