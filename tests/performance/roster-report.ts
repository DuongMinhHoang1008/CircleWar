import { readFileSync, writeFileSync, existsSync } from "node:fs";
import type { CombatMetrics } from "../../packages/battle-engine/src/types";

interface Row {
  id: string;
  name: string;
  games: number;
  support: CombatMetrics;
  [key: string]: unknown;
}
interface Pair {
  a: string;
  b: string;
  aWins: number;
  bWins: number;
  draws: number;
  games: number;
}
interface Phase {
  id: string;
  mode: string;
  level: number;
  gear: boolean;
  battles: number;
  stalled: unknown[];
  characters: Row[];
  pairs: Pair[];
  seedOffsets?: number[];
}
interface Report {
  engine: string;
  measuredAt: string;
  battles: number;
  stalled: number;
  conditions: string;
  phases: Phase[];
  trainingPhases?: Phase[];
  validationPhases?: Phase[];
  adjustments?: string[];
  comparison?: unknown[];
}
const round = (value: number) => +value.toFixed(2);
const n = (row: Row, key: string) => Number(row[key] || 0);
function combine(a: Row, b: Row): Row {
  const row = structuredClone(a);
  for (const key of [
    "matches",
    "games",
    "wins",
    "losses",
    "draws",
    "survived",
    "stalled",
    "ticks",
    "aliveTicks",
    "damage",
    "taken",
  ])
    row[key] = n(a, key) + n(b, key);
  for (const key of Object.keys(row.support) as (keyof CombatMetrics)[]) {
    const value = b.support[key];
    if (typeof value === "number") (row.support[key] as number) += value;
    else
      for (const [kind, count] of Object.entries(value)) {
        const into = row.support[key] as Record<string, number>;
        into[kind] = (into[kind] || 0) + count;
      }
  }
  const games = Math.max(1, row.games),
    rate = n(row, "wins") / games;
  for (const [field, count] of [
    ["winRate", "wins"],
    ["lossRate", "losses"],
    ["drawRate", "draws"],
    ["survivalRate", "survived"],
  ])
    row[field] = round((100 * n(row, count)) / games);
  row.averageDamage = round(n(row, "damage") / games);
  row.averageTaken = round(n(row, "taken") / games);
  row.dps = round((n(row, "damage") * 30) / Math.max(1, n(row, "ticks")));
  row.averageAliveSeconds = round(n(row, "aliveTicks") / games / 30);
  row.averageSeconds = round(n(row, "ticks") / games / 30);
  for (const key of [
    "allyHealing",
    "allyShielding",
    "allyShieldAbsorbed",
    "friendlyDamage",
  ])
    row[key] = round(Number(row.support[key as keyof CombatMetrics]) / games);
  row.selfHealing = round(
    (row.support.healing - row.support.allyHealing) / games,
  );
  row.buffs = round(row.support.buffsApplied / games);
  row.debuffs = round(row.support.debuffsApplied / games);
  row.controlSeconds = round(row.support.controlTicks / games / 30);
  row.allyBuffSeconds = round(row.support.allyBuffTicks / games / 30);
  const z = 1.96,
    denominator = 1 + (z * z) / games,
    midpoint = (rate + (z * z) / (2 * games)) / denominator,
    half =
      (z *
        Math.sqrt(
          (rate * (1 - rate)) / games + (z * z) / (4 * games * games),
        )) /
      denominator;
  row.winInterval95 = [
    round(100 * Math.max(0, midpoint - half)),
    round(100 * Math.min(1, midpoint + half)),
  ];
  return row;
}
export function writeRosterReport(report: Report) {
  const training = structuredClone(report.trainingPhases ?? report.phases);
  const validation = ["solo-10-affinity", "team-10-affinity"].flatMap((id) => {
    const path = `test-results/roster-${id}-holdout.json`;
    if (!existsSync(path)) throw Error(`Missing validation phase: ${path}`);
    const phase = JSON.parse(readFileSync(path, "utf8")) as Phase & {
      seedOffset?: number;
    };
    if (
      phase.id !== id ||
      phase.seedOffset !== 7919 ||
      phase.characters.length !== 33
    )
      throw Error(`Invalid validation phase: ${path}`);
    return [phase];
  });
  const phases = training.map((phase) => {
    const held = validation.find((v) => v.id === phase.id);
    if (!held) return phase;
    const pairs = new Map(phase.pairs.map((p) => [`${p.a}:${p.b}`, { ...p }]));
    for (const pair of held.pairs) {
      const key = `${pair.a}:${pair.b}`,
        existing = pairs.get(key);
      if (!existing) pairs.set(key, pair);
      else
        for (const field of ["aWins", "bWins", "draws", "games"] as const)
          existing[field] += pair[field];
    }
    return {
      ...phase,
      seedOffsets: [0, 7919],
      battles: phase.battles + held.battles,
      stalled: [...phase.stalled, ...held.stalled],
      pairs: [...pairs.values()],
      characters: phase.characters.map((row) =>
        combine(
          row,
          held.characters.find((r) => r.id === row.id)!,
        ),
      ),
    };
  });
  report.trainingPhases = training;
  report.validationPhases = validation;
  report.phases = phases;
  report.battles = phases.reduce((total, p) => total + p.battles, 0);
  report.stalled = phases.reduce((total, p) => total + p.stalled.length, 0);
  report.adjustments = [
    "Giảm khả năng tự chống chịu của Hổ, thời gian né của Ship Nhanh, sát thương/nhịp laser Fu Di và áp lực nhiều mục tiêu của Jake, Ủn, Skyrocket.",
    "Tăng tính hữu dụng của đệ Hộp Quà, tầm đánh của chủ, cận chiến yếu và hỗ trợ của Mâm Quả/Cờ. Wacom xuyên hai mục tiêu nhưng dừng nảy sau lần trúng người đầu tiên.",
    "Hồi máu từ đồng đội còn tối thiểu 35% hệ số nhịp cuối trận; tự hồi vẫn giảm về 0. Trạng thái giảm hồi phục tiếp tục áp dụng.",
    "Sau bo, khi không có giao tranh 15 giây, chỉnh góc rất nhỏ cho quỹ đạo gần nằm ngang/dọc để tránh chạy song song mãi. Không có sát thương môi trường hay chọn người thắng theo giờ.",
  ];
  const baselinePath = "reports/roster-balance-v31-before.json";
  const baseline = existsSync(baselinePath)
    ? (JSON.parse(readFileSync(baselinePath, "utf8")) as Report)
    : undefined;
  report.comparison = [
    ["char_28", "solo-10-affinity"],
    ["char_14", "solo-10-affinity"],
    ["char_13", "team-10-affinity"],
    ["char_17", "team-1-affinity"],
    ["char_33", "team-1-affinity"],
  ].flatMap(([id, phase]) => {
    const before = baseline?.phases
      .find((p) => p.id === phase)
      ?.characters.find((r) => r.id === id);
    const after = training
      .find((p) => p.id === phase)
      ?.characters.find((r) => r.id === id);
    return before && after
      ? [
          {
            id,
            name: after.name,
            phase,
            beforeWinRate: before.winRate,
            afterWinRate: after.winRate,
          },
        ]
      : [];
  });
  report.conditions =
    report.conditions.replace(/ Lv10 validation[\s\S]*$/, "") +
    " Lv10 validation: seed offset 7919 was withheld during tuning; final Lv10 solo/team rows pool original and validation samples. FFA uses twelve seeded roster shuffles and all six spawn rotations, 432 appearances per card. Raw training and validation phases are retained separately.";
  writeFileSync(
    "reports/roster-balance-v31.json",
    JSON.stringify(report, null, 2),
  );
  const summary = {
    ...report,
    trainingPhases: undefined,
    validationPhases: undefined,
    phases: phases.map(({ pairs, stalled, ...phase }) => ({
      ...phase,
      stalled: stalled.length,
    })),
  };
  writeFileSync("apps/web/public/balance-audit.json", JSON.stringify(summary));
  const columns = [
    "phase",
    "id",
    "name",
    "games",
    "winRate",
    "lossRate",
    "drawRate",
    "survivalRate",
    "averageDamage",
    "dps",
    "allyHealing",
    "selfHealing",
    "allyShielding",
    "allyShieldAbsorbed",
    "controlSeconds",
    "allyBuffSeconds",
    "buffs",
    "debuffs",
    "friendlyDamage",
  ];
  writeFileSync(
    "reports/roster-balance-v31.csv",
    "\ufeff" +
      [
        columns,
        ...phases.flatMap((p) =>
          p.characters.map((row) =>
            columns.map((key) => (key === "phase" ? p.id : row[key])),
          ),
        ),
      ]
        .map((row) =>
          row.map((value) => JSON.stringify(String(value ?? ""))).join(","),
        )
        .join("\n"),
  );
  const team = phases.find((p) => p.id === "team-10-affinity")!;
  const lines = [
    `# Cân bằng nhân vật — ${report.engine}`,
    "",
    `Đã áp dụng thay đổi và kiểm tra ${report.battles.toLocaleString("vi-VN")} trận; ${report.stalled} trận chưa kết thúc trong giới hạn 180 giây.`,
    "",
    ...report.adjustments.map((line) => `- ${line}`),
    "",
    "## So sánh cùng bộ mẫu trước/sau",
    "",
    "Các số so sánh dưới đây dùng đúng mẫu gốc, không trộn seed kiểm chứng vào cột sau.",
    "",
    "| Nhân vật | Mẫu | Trước | Sau |",
    "|---|---|---:|---:|",
    ...(
      report.comparison as {
        name: string;
        phase: string;
        beforeWinRate: number;
        afterWinRate: number;
      }[]
    ).map(
      (r) =>
        `| ${r.name} | ${r.phase} | ${r.beforeWinRate}% | ${r.afterWinRate}% |`,
    ),
    "",
    "## Đấu đội Lv.10 có đồ hợp cạ",
    "",
    "Gộp 48 lượt gốc và 48 lượt seed kiểm chứng mỗi nhân vật. Các cột HP/support là trung bình mỗi lượt. ĐĐ = đồng đội, không tính tự hồi/tự buff. Sống tới cuối xét HP, độc lập với thắng đội.",
    "",
    "| Nhân vật | Thắng | Sống | ST gây | Hồi ĐĐ | Khiên đỡ ĐĐ | KC (giây) | Buff ĐĐ (giây) |",
    "|---|---:|---:|---:|---:|---:|---:|---:|",
    ...team.characters.map(
      (row) =>
        `| ${row.name} | ${row.winRate}% | ${row.survivalRate}% | ${row.averageDamage} | ${row.allyHealing} | ${row.allyShieldAbsorbed} | ${row.controlSeconds} | ${row.allyBuffSeconds} |`,
    ),
    "",
    "Mẫu offline, cùng cấp và đồ hợp cạ; không điều chỉnh để ép mọi vai trò về cùng DPS hay cùng tỉ lệ thắng đấu đơn. Lượt hiệu ứng tính cả làm mới thành công; thời gian khống chế gộp phần trùng của cùng nguồn trên cùng mục tiêu. Chỉ ghi lượng hồi thực nhận và khiên thực hấp thụ. Dữ liệu seed/đối thủ và khoảng ước lượng 95% nằm trong JSON. Mẫu cố định còn phụ thuộc đội hình và seed.",
    "",
  ];
  writeFileSync("reports/roster-balance-v31.md", lines.join("\n"));
  return report;
}
if (process.argv[1]?.replaceAll("\\", "/").endsWith("/roster-report.ts")) {
  const report = writeRosterReport(
    JSON.parse(readFileSync("reports/roster-balance-v31.json", "utf8")),
  );
  console.log(
    JSON.stringify({
      engine: report.engine,
      battles: report.battles,
      stalled: report.stalled,
      comparison: report.comparison,
    }),
  );
}
