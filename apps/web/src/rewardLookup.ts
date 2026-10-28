import {
  WEEKLY_PRACTICE_REWARDS,
  EXPEDITION_REWARDS,
  CHAPTER_REWARDS,
  EXPEDITION_FIRST_CLEAR,
  EXPEDITION_HARD_REWARD,
  type ModeReward,
} from "../../../packages/shared/src/mode-rewards";
import {
  DAILY_CHALLENGE_REWARDS,
  ROGUELIKE_REWARDS,
} from "../../../packages/shared/src/mode-rewards";
export function localRewardById(id: string): ModeReward {
  return [
    ...DAILY_CHALLENGE_REWARDS,
    ...ROGUELIKE_REWARDS,
    ...WEEKLY_PRACTICE_REWARDS,
    ...EXPEDITION_REWARDS,
    ...CHAPTER_REWARDS,
    EXPEDITION_FIRST_CLEAR,
    EXPEDITION_HARD_REWARD,
  ].find((m) => m.id === id)!.reward;
}
