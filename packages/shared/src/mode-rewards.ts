import { awardPacksToMailbox, type MailboxProfile } from "./mailbox";
import { challengeDay } from "./daily-challenges";
import { dailyQuestDay, addCardXp, DUPLICATE_CARD_XP } from "./progression";
import { CATALOG_ITEMS, ROSTER, type CharacterId } from "./catalog";
import { experienceOf, type CollectionProfile } from "./experience";
import { weekId } from "./adventure";

export interface ModeReward {
  packs: number;
  bossPacks: number;
  choiceChests?: number;
  title?: string;
}
export interface RewardMilestone {
  id: string;
  goal: number;
  label: string;
  reward: ModeReward;
}
export interface RewardProfile extends CollectionProfile, MailboxProfile {
  bossPacks: number;
  choiceChests?: number;
}
export const DAILY_CHALLENGE_REWARDS: RewardMilestone[] = [
  {
    id: "daily-1",
    goal: 1,
    label: "Hạ 1 đối thủ hôm nay",
    reward: { packs: 5, bossPacks: 0 },
  },
  {
    id: "daily-2",
    goal: 2,
    label: "Hạ 2 đối thủ hôm nay",
    reward: { packs: 8, bossPacks: 1 },
  },
  {
    id: "daily-3",
    goal: 3,
    label: "Hạ cả 3 đối thủ hôm nay",
    reward: { packs: 12, bossPacks: 1 },
  },
];
export const ROGUELIKE_REWARDS: RewardMilestone[] = [
  {
    id: "roguelike-4",
    goal: 4,
    label: "Vượt tầng 4",
    reward: { packs: 20, bossPacks: 1 },
  },
  {
    id: "roguelike-8",
    goal: 8,
    label: "Vượt tầng 8",
    reward: { packs: 40, bossPacks: 4 },
  },
  {
    id: "roguelike-12",
    goal: 12,
    label: "Hạ boss tầng 12",
    reward: {
      packs: 90,
      bossPacks: 10,
      choiceChests: 1,
      title: "Người chinh phục tháp",
    },
  },
];
export function dailyWins(profile: CollectionProfile, day = challengeDay()) {
  return [0, 1, 2].filter(
    (n) => experienceOf(profile).medals[`daily:${day}:${n}`] > 0,
  ).length;
}
export function rogueBest(profile: CollectionProfile, now = Date.now()) {
  const e = experienceOf(profile);
  return e.roguelikeDay === challengeDay(now) ? e.roguelikeBest || 0 : 0;
}
export function grantRogueMilestone<T extends RewardProfile>(
  profile: T,
  milestone: RewardMilestone,
  now = Date.now(),
): T {
  const canonical = ROGUELIKE_REWARDS.find((m) => m.id === milestone.id);
  if (!canonical || rogueBest(profile, now) < canonical.goal)
    throw Error("Chưa đạt mốc viễn chinh này.");
  milestone = canonical;
  const receipt = rewardReceipt(milestone.id, now),
    revised = `${receipt}:reward-v2`;
  if (profile.rewardReceipts?.includes(revised)) return profile;
  const old = (
    {
      "roguelike-4": { packs: 10, bossPacks: 0 },
      "roguelike-8": { packs: 15, bossPacks: 1 },
      "roguelike-12": { packs: 20, bossPacks: 3 },
    } as Record<string, ModeReward>
  )[milestone.id];
  const reward = profile.rewardReceipts?.includes(receipt)
    ? {
        ...milestone.reward,
        packs: milestone.reward.packs - old.packs,
        bossPacks: milestone.reward.bossPacks - old.bossPacks,
      }
    : milestone.reward;
  const next = applyModeReward(profile, reward, revised, now);
  return {
    ...next,
    rewardReceipts: [
      ...new Set([...(next.rewardReceipts || []), receipt]),
    ].slice(-5000),
  };
}
export function settleRogueRewards<T extends RewardProfile>(
  profile: T,
  now = Date.now(),
): T {
  let next = profile;
  for (const m of ROGUELIKE_REWARDS)
    if (rogueBest(next, now) >= m.goal)
      next = grantRogueMilestone(next, m, now);
  return next;
}
export const WEEKLY_PRACTICE_REWARDS: RewardMilestone[] = [
  {
    id: "practice-1",
    goal: 1,
    label: "Hạ 1 đối thủ",
    reward: { packs: 10, bossPacks: 1 },
  },
  {
    id: "practice-2",
    goal: 2,
    label: "Hạ 2 đối thủ",
    reward: { packs: 15, bossPacks: 1 },
  },
  {
    id: "practice-3",
    goal: 3,
    label: "Hạ cả 3 đối thủ",
    reward: { packs: 20, bossPacks: 2, title: "Người giải đố tuần" },
  },
];
export const WEEKLY_OFFICIAL_REWARDS: RewardMilestone[] = [
  {
    id: "official-3",
    goal: 3,
    label: "Đồng · 3 trận thắng",
    reward: { packs: 20, bossPacks: 2 },
  },
  {
    id: "official-6",
    goal: 6,
    label: "Bạc · 6 trận thắng",
    reward: { packs: 30, bossPacks: 3 },
  },
  {
    id: "official-9",
    goal: 9,
    label: "Vàng · 9 trận thắng",
    reward: {
      packs: 50,
      bossPacks: 5,
      choiceChests: 1,
      title: "Bậc thầy chín trận",
    },
  },
];
export const EXPEDITION_REWARDS: RewardMilestone[] = [
  {
    id: "expedition-2",
    goal: 2,
    label: "Thắng 2 chặng",
    reward: { packs: 10, bossPacks: 0 },
  },
  {
    id: "expedition-4",
    goal: 4,
    label: "Thắng 4 chặng",
    reward: { packs: 15, bossPacks: 1 },
  },
  {
    id: "expedition-6",
    goal: 6,
    label: "Toàn thắng 6 chặng",
    reward: { packs: 20, bossPacks: 3 },
  },
];
export const EXPEDITION_FIRST_CLEAR: RewardMilestone = {
  id: "expedition-perfect",
  goal: 1,
  label: "Lần đầu toàn thắng",
  reward: {
    packs: 0,
    bossPacks: 3,
    choiceChests: 1,
    title: "Nhà chinh phục hoàn hảo",
  },
};
export const EXPEDITION_HARD_REWARD: RewardMilestone = {
  id: "expedition-hard",
  goal: 1,
  label: "Toàn thắng · ít nhất 3 chặng hiểm trở",
  reward: { packs: 0, bossPacks: 2, title: "Băng qua hiểm trở" },
};
export const CHAPTER_REWARDS: RewardMilestone[] = [10, 20, 30].map(
  (goal, index) => ({
    id: `chapter-${goal}`,
    goal,
    label: `Hoàn thành chương ${index + 1}`,
    reward: { packs: 20 + index * 10, bossPacks: 2 + index },
  }),
);
export function rewardReceipt(id: string, now = Date.now()) {
  const period =
    id.startsWith("daily-") || id.startsWith("roguelike-")
      ? challengeDay(now)
      : id.startsWith("official-") || id.startsWith("practice-")
        ? weekId(now)
        : /^expedition-(2|4|6|hard)$/.test(id)
          ? dailyQuestDay(now)
          : "once";
  return `mode-reward:${id}:${period}`;
}
export function practiceWins(profile: CollectionProfile, now = Date.now()) {
  const medals = experienceOf(profile).medals,
    prefix = `weekly:${weekId(now)}:`;
  return new Set(
    Object.entries(medals)
      .filter(([id, count]) => id.startsWith(prefix) && count > 0)
      .map(([id]) => id.split(":").at(-1))
      .filter((id) => ["0", "1", "2"].includes(id || "")),
  ).size;
}
export function expeditionBest(profile: CollectionProfile, now = Date.now()) {
  const exp = experienceOf(profile);
  return exp.expeditionDay === dailyQuestDay(now) ? exp.expeditionBest || 0 : 0;
}
export function applyModeReward<T extends RewardProfile>(
  profile: T,
  reward: ModeReward,
  receipt: string,
  now = Date.now(),
): T {
  if (profile.rewardReceipts?.includes(receipt)) return profile;
  const awarded = awardPacksToMailbox(profile, reward.packs, receipt, now),
    exp = experienceOf(awarded);
  return {
    ...awarded,
    bossPacks: profile.bossPacks + reward.bossPacks,
    choiceChests: (profile.choiceChests || 0) + (reward.choiceChests || 0),
    experience: {
      ...exp,
      titles: reward.title
        ? Array.from(new Set([...exp.titles, reward.title])).slice(-100)
        : exp.titles,
    },
  };
}
export function claimLocalModeReward<
  T extends RewardProfile & { campaignStage?: number },
>(profile: T, id: string, now = Date.now()): T {
  if (id.startsWith("official-"))
    throw Error("Thưởng thi đấu cần được xác nhận từ máy chủ.");
  const milestone = [
    ...DAILY_CHALLENGE_REWARDS,
    ...ROGUELIKE_REWARDS,
    ...WEEKLY_PRACTICE_REWARDS,
    ...EXPEDITION_REWARDS,
    ...CHAPTER_REWARDS,
    EXPEDITION_FIRST_CLEAR,
    EXPEDITION_HARD_REWARD,
  ].find((m) => m.id === id);
  if (!milestone) throw Error("Không tìm thấy phần thưởng.");
  const exp = experienceOf(profile);
  const progress = id.startsWith("daily-")
    ? dailyWins(profile, challengeDay(now))
    : id.startsWith("roguelike-")
      ? rogueBest(profile, now)
      : id.startsWith("practice-")
        ? practiceWins(profile, now)
        : id.startsWith("chapter-")
          ? profile.campaignStage || 0
          : id === "expedition-perfect"
            ? exp.medals["expedition:perfect"] || 0
            : id === "expedition-hard"
              ? exp.expeditionDay === dailyQuestDay(now)
                ? exp.expeditionHardBest || 0
                : 0
              : expeditionBest(profile, now);
  if (progress < milestone.goal) throw Error("Chưa đạt mốc phần thưởng này.");
  if (id.startsWith("roguelike-"))
    return grantRogueMilestone(profile, milestone, now);
  return applyModeReward(
    profile,
    milestone.reward,
    rewardReceipt(id, now),
    now,
  );
}
export function epicChoices(profile: CollectionProfile) {
  return [
    ...ROSTER.filter(
      (c) =>
        c.tier === "T3" &&
        (profile.cards.find((card) => card.characterId === c.id)?.level || 0) <
          10,
    ).map((c) => ({ kind: "character" as const, id: c.id, name: c.name })),
    ...CATALOG_ITEMS.filter(
      (c) =>
        c.rarity === 2 &&
        (profile.itemCards.find((card) => card.itemId === c.id)?.level || 0) <
          10,
    ).map((c) => ({ kind: "item" as const, id: c.id, name: c.name })),
  ];
}
export function openChoiceChest<T extends RewardProfile>(
  profile: T,
  key: string,
): T {
  if (!(profile.choiceChests && profile.choiceChests > 0))
    throw Error("Bạn chưa có Rương chọn Sử thi.");
  const choices = epicChoices(profile);
  if (!choices.length && key === "boss-packs")
    return {
      ...profile,
      choiceChests: profile.choiceChests - 1,
      bossPacks: profile.bossPacks + 5,
    };
  const choice = choices.find((c) => `${c.kind}:${c.id}` === key);
  if (!choice) throw Error("Chọn một thẻ Sử thi chưa đạt tối đa.");
  const cards = profile.cards.map((c) => ({ ...c })),
    items = profile.itemCards.map((c) => ({ ...c }));
  if (choice.kind === "character") {
    const existing = cards.find((c) => c.characterId === choice.id);
    if (existing)
      Object.assign(existing, addCardXp(existing, DUPLICATE_CARD_XP));
    else cards.push({ characterId: choice.id as CharacterId, level: 1, xp: 0 });
  } else {
    const existing = items.find((c) => c.itemId === choice.id);
    if (existing)
      Object.assign(existing, addCardXp(existing, DUPLICATE_CARD_XP));
    else items.push({ itemId: choice.id, level: 1, xp: 0 });
  }
  return {
    ...profile,
    cards,
    itemCards: items,
    choiceChests: profile.choiceChests - 1,
  };
}
