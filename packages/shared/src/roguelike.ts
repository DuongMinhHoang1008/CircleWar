import {
  CATALOG_ITEMS,
  ROSTER,
  character,
  itemInfo,
  type CharacterId,
} from "./catalog";
import { adventureConfig, loanUnit, stableSeed } from "./adventure";
import { campaignEncounter } from "./campaign";
import {
  validMasterySelections,
  validateMasteryTeam,
  type MasterySelection,
} from "./mastery";

export const RUN_FLOORS = 12;
export type RunNodeKind =
  "battle" | "elite" | "boss" | "shop" | "camp" | "recruit" | "event";
export interface RunNode {
  id: string;
  floor: number;
  lane: number;
  kind: RunNodeKind;
}
export const NODE_NAMES: Record<RunNodeKind, string> = {
  battle: "Giao tranh",
  elite: "Tinh anh",
  boss: "Boss",
  shop: "Cửa hàng",
  camp: "Trại nghỉ",
  recruit: "Chiêu mộ",
  event: "Sự kiện",
};
export interface RoguelikeRun {
  version: 1;
  id: string;
  seed: number;
  floor: number;
  phase: "map" | "node" | "battle" | "reward";
  node?: string;
  gold: number;
  team: CharacterId[];
  levels: Record<string, number>;
  health: Record<string, number>;
  bag: string[];
  itemLevels: Record<string, number>;
  equipment: Record<string, string[]>;
  masteries: Record<string, MasterySelection>;
  path: RunNode[];
  purchased: string[];
  wins: number;
  elites: number;
}
export interface RunEnd {
  id: string;
  floor: number;
  wins: number;
  won: boolean;
  reason: "defeat" | "abandon" | "clear";
}
const lanes: RunNodeKind[][] = [
  ["battle", "battle"],
  ["shop", "recruit"],
  ["battle", "event"],
  ["battle", "elite"],
  ["camp", "recruit"],
  ["boss"],
  ["shop", "recruit"],
  ["battle", "elite"],
  ["camp", "event"],
  ["battle", "elite"],
  ["camp", "shop"],
  ["boss"],
];
export function runMap(seed: number): RunNode[][] {
  return lanes.map((kinds, index) =>
    kinds.map((kind, lane) => ({
      id: `${index + 1}:${lane}`,
      floor: index + 1,
      lane,
      kind,
    })),
  );
}
export function starterChoices(seed: number): CharacterId[] {
  return ROSTER.filter((c) => !["T3", "T4"].includes(c.tier))
    .slice()
    .sort(
      (a, b) =>
        stableSeed(`${seed}:starter:${a.id}`) -
        stableSeed(`${seed}:starter:${b.id}`),
    )
    .slice(0, 3)
    .map((c) => c.id as CharacterId);
}
export function createRun(
  id: string,
  seed: number,
  starter: CharacterId,
): RoguelikeRun {
  if (!starterChoices(seed).includes(starter))
    throw Error("Chọn nhân vật khởi đầu được đề xuất.");
  const starterItem = CATALOG_ITEMS.find((i) => i.affinity === starter)?.id;
  return {
    version: 1,
    id,
    seed,
    floor: 0,
    phase: "map",
    gold: 90,
    team: [starter],
    levels: { [starter]: 3 },
    health: { [starter]: 100 },
    bag: starterItem ? [starterItem] : [],
    itemLevels: starterItem ? { [starterItem]: 1 } : {},
    equipment: starterItem ? { [starter]: [starterItem] } : {},
    masteries: {},
    path: [],
    purchased: [],
    wins: 0,
    elites: 0,
  };
}
export function currentNode(run: RoguelikeRun) {
  return runMap(run.seed)
    .flat()
    .find((n) => n.id === run.node);
}
function requireIdle(run: RoguelikeRun) {
  if (run.phase === "battle" || run.phase === "reward")
    throw Error("Hoàn tất trận và chọn chiến lợi phẩm trước.");
}
export function enterNode(run: RoguelikeRun, id: string): RoguelikeRun {
  if (run.phase !== "map") throw Error("Hoàn tất điểm dừng hiện tại trước.");
  const node = runMap(run.seed)[run.floor]?.find((n) => n.id === id);
  if (!node) throw Error("Chỉ chọn một điểm ở tầng tiếp theo.");
  return { ...run, phase: "node", node: node.id, purchased: [] };
}
function advance(run: RoguelikeRun): RoguelikeRun {
  const node = currentNode(run);
  if (!node || node.floor !== run.floor + 1) throw Error("Tầng không hợp lệ.");
  return {
    ...run,
    floor: node.floor,
    path: [...run.path, node],
    phase: "map",
    node: undefined,
    purchased: [],
  };
}
export function leaveNode(run: RoguelikeRun) {
  if (
    run.phase !== "node" ||
    !["shop", "recruit"].includes(currentNode(run)?.kind || "")
  )
    throw Error("Điểm này cần được giải quyết trước.");
  return advance(run);
}
export function runLoadouts(run: RoguelikeRun) {
  return run.team.map((id) => ({
    ...loanUnit(id, run.equipment[id]?.[0] || "", run.levels[id]),
    equipmentLevels: { ...run.itemLevels },
    startingHpPercent: run.health[id],
    masteryId: run.masteries[id]?.id,
    masteryTarget: run.masteries[id]?.target,
  }));
}
export function runBattleConfig(run: RoguelikeRun) {
  const node = currentNode(run);
  if (!node || !["battle", "elite", "boss"].includes(node.kind))
    throw Error("Điểm này không phải trận đấu.");
  const level = Math.min(
    10,
    1 +
      Math.floor((node.floor - 1) / 3) +
      (node.kind === "boss" ? 2 : Number(node.kind === "elite")),
  );
  const count =
    node.kind === "boss"
      ? node.floor === 6
        ? 2
        : 3
      : Math.min(3, Math.max(run.team.length, 1 + Math.floor(node.floor / 5)));
  // Campaign multiples of five force three escorts; never inherit that rule in normal tower rooms.
  const rawStage = 11 + (stableSeed(`${run.seed}:${node.id}`) % 59),
    stage = rawStage % 5 === 0 ? rawStage + 1 : rawStage;
  const used = new Set<string>();
  const pool = ROSTER.filter(
    (c) =>
      node.floor >= 7 ||
      (node.floor >= 4 ? c.tier !== "T4" : !["T3", "T4"].includes(c.tier)),
  );
  const enemy = campaignEncounter(stage, count)
    .loadouts.slice(0, count)
    .map((u, slot) => {
      let id = u.characterId!;
      if (!pool.some((c) => c.id === id) || used.has(id)) {
        const available = pool.filter((c) => !used.has(c.id));
        id = available[
          stableSeed(`${run.seed}:${node.id}:slot:${slot}`) % available.length
        ].id as CharacterId;
      }
      used.add(id);
      const item =
        node.floor < 6 ||
        (node.kind === "battle" && slot > 0) ||
        (node.floor === 6 && slot > 0)
          ? ""
          : u.equipment[0] || "";
      return {
        ...loanUnit(id, item, level),
        equipmentLevels: item
          ? { [item]: Math.max(1, Math.floor(node.floor / 3)) }
          : {},
        startingHpPercent:
          node.kind === "boss"
            ? slot === 0
              ? 100
              : 70
            : node.kind === "elite"
              ? 85
              : Math.min(80, 55 + node.floor * 2),
      };
    });
  return adventureConfig(runLoadouts(run), enemy);
}
export function beginRunBattle(run: RoguelikeRun): RoguelikeRun {
  if (run.phase !== "node") throw Error("Trận đã được bắt đầu.");
  runBattleConfig(run);
  return { ...run, phase: "battle" };
}
export function runBattleSeed(run: RoguelikeRun) {
  return stableSeed(`${run.seed}:battle:${run.node}`);
}
export function settleRunBattle(
  run: RoguelikeRun,
  won: boolean,
  survivors: { characterId: string; hp: number; maxHp: number }[],
): { run?: RoguelikeRun; end?: RunEnd } {
  if (run.phase !== "battle") throw Error("Không có trận đang chờ kết quả.");
  const node = currentNode(run)!;
  if (!won)
    return {
      end: {
        id: run.id,
        floor: run.floor,
        wins: run.wins,
        won: false,
        reason: "defeat",
      },
    };
  const living = survivors.filter(
    (u) =>
      run.team.includes(u.characterId as CharacterId) &&
      u.hp > 0 &&
      u.maxHp > 0,
  );
  if (!living.length)
    throw Error("Chiến thắng cần ít nhất một nhân vật còn sống.");
  const next = advance({
    ...run,
    team: living.map((u) => u.characterId as CharacterId),
    health: Object.fromEntries(
      living.map((u) => [
        u.characterId,
        Math.max(1, Math.min(100, Math.ceil((u.hp / u.maxHp) * 100))),
      ]),
    ),
    gold:
      run.gold + (node.kind === "boss" ? 100 : node.kind === "elite" ? 70 : 45),
    wins: run.wins + 1,
    elites: run.elites + Number(node.kind === "elite"),
  });
  // A fallen character's equipment stays in the run bag, and may be reassigned.
  next.equipment = Object.fromEntries(
    Object.entries(next.equipment).filter(([id]) =>
      next.team.includes(id as CharacterId),
    ),
  );
  next.masteries = cleanMasteries(next);
  if (next.floor === RUN_FLOORS)
    return {
      end: {
        id: next.id,
        floor: next.floor,
        wins: next.wins,
        won: true,
        reason: "clear",
      },
    };
  return { run: { ...next, phase: "reward" } };
}
export function lootChoices(run: RoguelikeRun) {
  return CATALOG_ITEMS.slice()
    .sort(
      (a, b) =>
        stableSeed(`${run.seed}:loot:${run.floor}:${a.id}`) -
        stableSeed(`${run.seed}:loot:${run.floor}:${b.id}`),
    )
    .slice(0, 3)
    .map((i) => i.id);
}
export function takeLoot(run: RoguelikeRun, id?: string): RoguelikeRun {
  if (run.phase !== "reward" || (id && !lootChoices(run).includes(id)))
    throw Error("Chiến lợi phẩm không hợp lệ.");
  const next = structuredClone(run);
  if (id) {
    if (!next.bag.includes(id)) next.bag.push(id);
    next.itemLevels[id] = Math.min(10, (next.itemLevels[id] || 0) + 1);
  }
  return { ...next, phase: "map" };
}
export function nodeStock(run: RoguelikeRun) {
  const key = `${run.seed}:${run.node}`;
  return {
    items: CATALOG_ITEMS.slice()
      .sort(
        (a, b) =>
          stableSeed(`${key}:item:${a.id}`) - stableSeed(`${key}:item:${b.id}`),
      )
      .slice(0, 3)
      .map((i) => i.id),
    recruits: ROSTER.filter((c) => !run.team.includes(c.id as CharacterId))
      .slice()
      .sort(
        (a, b) =>
          stableSeed(`${key}:hero:${a.id}`) - stableSeed(`${key}:hero:${b.id}`),
      )
      .slice(0, 3)
      .map((c) => c.id as CharacterId),
  };
}
function spend(run: RoguelikeRun, amount: number) {
  if (run.gold < amount) throw Error("Không đủ vàng trong run.");
  return structuredClone({ ...run, gold: run.gold - amount });
}
export function buyItem(run: RoguelikeRun, id: string) {
  if (
    run.phase !== "node" ||
    currentNode(run)?.kind !== "shop" ||
    !nodeStock(run).items.includes(id) ||
    run.purchased.includes(id)
  )
    throw Error("Vật phẩm không có trong cửa hàng hoặc đã mua.");
  const next = spend(run, 35 + (itemInfo(id)?.rarity || 0) * 10);
  if (!next.bag.includes(id)) next.bag.push(id);
  next.itemLevels[id] = Math.min(10, (next.itemLevels[id] || 0) + 1);
  next.purchased.push(id);
  return next;
}
export function buyRunRest(run: RoguelikeRun) {
  if (
    run.phase !== "node" ||
    currentNode(run)?.kind !== "shop" ||
    run.purchased.includes("rest")
  )
    throw Error("Chỉ mua một lượt hồi phục tại mỗi cửa hàng.");
  if (run.team.every((id) => run.health[id] >= 100))
    throw Error("Đội đã đầy HP.");
  const next = spend(run, 25);
  next.health = Object.fromEntries(
    next.team.map((id) => [id, Math.min(100, next.health[id] + 35)]),
  );
  next.purchased.push("rest");
  return next;
}
export function recruit(run: RoguelikeRun, id: CharacterId) {
  if (
    run.phase !== "node" ||
    !["shop", "recruit"].includes(currentNode(run)?.kind || "") ||
    !nodeStock(run).recruits.includes(id) ||
    run.purchased.includes("recruit")
  )
    throw Error("Không thể chiêu mộ nhân vật này tại đây.");
  if (run.team.length >= 3)
    throw Error("Đội đã đủ ba người. Bỏ một nhân vật trước khi chiêu mộ.");
  const next = spend(run, 60);
  next.team.push(id);
  next.levels[id] = Math.min(10, 3 + Math.floor(run.floor / 2));
  next.health[id] = 100;
  next.purchased.push("recruit");
  return next;
}
function cleanMasteries(run: RoguelikeRun) {
  return Object.fromEntries(
    Object.entries(run.masteries)
      .filter(([id]) => run.team.includes(id as CharacterId))
      .map(([id, m]) => [
        id,
        m.target && !run.team.includes(m.target as CharacterId)
          ? { id: m.id }
          : m,
      ]),
  );
}
export function dismiss(run: RoguelikeRun, id: CharacterId) {
  requireIdle(run);
  if (!run.team.includes(id) || run.team.length <= 1)
    throw Error("Đội cần ít nhất một nhân vật.");
  const next = structuredClone(run);
  next.team = next.team.filter((c) => c !== id);
  delete next.equipment[id];
  delete next.health[id];
  delete next.levels[id];
  next.masteries = cleanMasteries(next);
  return next;
}
export function equipRunItem(
  run: RoguelikeRun,
  target: CharacterId,
  item: string,
) {
  requireIdle(run);
  if (!run.team.includes(target) || (item && !run.bag.includes(item)))
    throw Error("Chỉ dùng trang bị đang có trong run.");
  const next = structuredClone(run);
  for (const id of next.team)
    if (next.equipment[id]?.includes(item)) delete next.equipment[id];
  next.equipment[target] = item ? [item] : [];
  return next;
}
export function upgradeRun(run: RoguelikeRun, id: CharacterId) {
  if (
    run.phase !== "node" ||
    !["shop", "camp"].includes(currentNode(run)?.kind || "") ||
    !run.team.includes(id) ||
    run.levels[id] >= 10
  )
    throw Error("Không thể nâng cấp nhân vật này ở đây.");
  const camp = currentNode(run)?.kind === "camp",
    next = camp ? structuredClone(run) : spend(run, 40);
  next.levels[id]++;
  return camp ? advance(next) : next;
}
export function restRun(run: RoguelikeRun) {
  if (run.phase !== "node" || currentNode(run)?.kind !== "camp")
    throw Error("Chỉ nghỉ tại trại.");
  return advance({
    ...run,
    health: Object.fromEntries(
      run.team.map((id) => [id, Math.min(100, run.health[id] + 35)]),
    ),
  });
}
export function resolveEvent(run: RoguelikeRun, choice: "gold" | "heal") {
  if (run.phase !== "node" || currentNode(run)?.kind !== "event")
    throw Error("Không có sự kiện tại đây.");
  if (choice === "gold" && run.team.some((id) => run.health[id] <= 15))
    throw Error("Cần hơn 15% HP mỗi nhân vật để nhận vàng.");
  return advance({
    ...run,
    gold: run.gold + (choice === "gold" ? 55 : 0),
    health: Object.fromEntries(
      run.team.map((id) => [
        id,
        choice === "gold"
          ? run.health[id] - 15
          : Math.min(100, run.health[id] + 15),
      ]),
    ),
  });
}
export function validRun(raw: unknown): raw is RoguelikeRun {
  try {
    return validateRunDocument(raw);
  } catch {
    return false;
  }
}
function validateRunDocument(raw: unknown): raw is RoguelikeRun {
  if (!raw || typeof raw !== "object") return false;
  const r = raw as RoguelikeRun,
    integer = (v: unknown, max: number, min = 0) =>
      Number.isInteger(v) && Number(v) >= min && Number(v) <= max;
  if (
    r.version !== 1 ||
    typeof r.id !== "string" ||
    r.id.length > 100 ||
    !integer(r.seed, 0xffffffff) ||
    !integer(r.floor, 11) ||
    !integer(r.gold, 10000) ||
    !["map", "node", "battle", "reward"].includes(r.phase) ||
    !Array.isArray(r.team) ||
    !r.team.length ||
    r.team.length > 3 ||
    new Set(r.team).size !== r.team.length ||
    !r.team.every((id) => !!character(id)) ||
    !Array.isArray(r.bag) ||
    r.bag.length > 33 ||
    new Set(r.bag).size !== r.bag.length ||
    !r.bag.every((id) => !!itemInfo(id)) ||
    !Array.isArray(r.purchased) ||
    r.purchased.length > 5 ||
    !r.purchased.every(
      (id) => ["recruit", "rest"].includes(id) || !!itemInfo(id),
    ) ||
    !integer(r.wins, 12) ||
    !integer(r.elites, r.wins) ||
    !Array.isArray(r.path) ||
    r.path.length !== r.floor ||
    !r.path.every(
      (n, i) =>
        n.floor === i + 1 &&
        runMap(r.seed)[i].some(
          (v) => v.id === n.id && v.kind === n.kind && v.lane === n.lane,
        ),
    )
  )
    return false;
  if (
    r.wins !==
      r.path.filter((n) => ["battle", "elite", "boss"].includes(n.kind))
        .length ||
    r.elites !== r.path.filter((n) => n.kind === "elite").length
  )
    return false;
  const record = (v: unknown, ids: string[], max: number, min = 0) =>
    !!v &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    Object.entries(v).every(
      ([id, n]) => ids.includes(id) && integer(n, max, min),
    );
  if (
    !record(
      r.levels,
      ROSTER.map((c) => c.id),
      10,
      1,
    ) ||
    !record(r.health, r.team, 100, 1) ||
    !record(r.itemLevels, r.bag, 10, 1) ||
    !r.team.every((id) => r.levels[id] && r.health[id]) ||
    !r.bag.every((id) => r.itemLevels[id]) ||
    !validMasterySelections(r.masteries) ||
    !Object.keys(r.masteries).every((id) =>
      r.team.includes(id as CharacterId),
    ) ||
    !r.equipment ||
    Array.isArray(r.equipment)
  )
    return false;
  const equipped = Object.values(r.equipment).flat();
  if (
    new Set(equipped).size !== equipped.length ||
    !Object.entries(r.equipment).every(
      ([id, items]) =>
        r.team.includes(id as CharacterId) &&
        Array.isArray(items) &&
        items.length <= 1 &&
        items.every((item) => r.bag.includes(item)),
    )
  )
    return false;
  if (r.phase === "map" || r.phase === "reward") {
    if (
      r.node !== undefined ||
      (r.phase === "reward" &&
        (!r.floor ||
          !["battle", "elite", "boss"].includes(r.path.at(-1)!.kind)))
    )
      return false;
  } else if (
    !currentNode(r) ||
    currentNode(r)!.floor !== r.floor + 1 ||
    (r.phase === "battle" &&
      !["battle", "elite", "boss"].includes(currentNode(r)!.kind))
  )
    return false;
  try {
    validateMasteryTeam(runLoadouts(r));
    return true;
  } catch {
    return false;
  }
}
