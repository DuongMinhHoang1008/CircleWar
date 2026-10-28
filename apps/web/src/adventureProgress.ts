import { type Experience } from "../../../packages/shared/src/experience";
import { MASTERY } from "../../../packages/shared/src/adventure";
import type { BattleSummary } from "./battleAnalytics";
import { masteriesFor } from "../../../packages/shared/src/mastery";

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
    const qualifying =
      mission.id === "char_11"
        ? (unit.support?.allyShielding ||
            unit.support?.allyShieldAbsorbed ||
            0) > 0
        : mission.id === "char_13"
          ? (unit.support?.allyHealing || 0) > 0
          : mission.id === "char_22"
            ? (unit.support?.allyBuffTicks || 0) > 0
            : mission.id === "char_20"
              ? summary.tactics.bonds + summary.tactics.groups > 0
              : summary.winner === "team-player";
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
