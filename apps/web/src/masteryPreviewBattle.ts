import {
  adventureConfig,
  loanUnit,
} from "../../../packages/shared/src/adventure";
import type { CharacterId } from "../../../packages/shared/src/catalog";
import {
  createBattle,
  stepBattle,
  captureReplayFrame,
} from "../../../packages/battle-engine/src/index";

/** An isolated recorded sandbox. No settlement, profile or reward operations. */
export function buildMasteryPreview(
  characterId: CharacterId,
  masteryId?: string,
) {
  const ally = characterId === "char_11" ? "char_13" : "char_11";
  const config = adventureConfig(
    [{ ...loanUnit(characterId), masteryId }, loanUnit(ally)],
    [loanUnit("char_01"), loanUnit("char_05")],
  );
  const seed = 20261029,
    state = createBattle(config, seed);
  const positions = [
    [28000, 32000],
    [22000, 43000],
    [40000, 32000],
    [44000, 44000],
  ];
  state.fighters.forEach((f, i) => {
    f.x = positions[i][0];
    f.y = positions[i][1];
    f.angle = i < 2 ? 0 : 16;
    f.vx = i < 2 ? 180 : -180;
    f.vy = i % 2 ? 100 : -100;
  });
  state.fighters[0].energy = 100;
  state.fighters[1].hp = Math.floor(state.fighters[1].stats.hp * 0.7);
  const frames = [captureReplayFrame(state)];
  for (let i = 0; i < 360 && !state.finished; i++) {
    stepBattle(state);
    if (state.tick % 3 === 0 || state.finished)
      frames.push(captureReplayFrame(state));
  }
  return { config, seed, frames, totalTicks: state.tick };
}
