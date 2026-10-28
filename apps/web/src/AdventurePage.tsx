import {
  CharacterConfig,
  LoadoutCard,
  applyOwnedConfig,
} from "./LoadoutConfig";
import { validateMasteryTeam } from "../../../packages/shared/src/mastery";
import { useEffect, useRef, useState } from "react";
import {
  ROSTER,
  CATALOG_ITEMS,
  character,
  itemInfo,
  BONDS,
  groupTier,
  FRIEND_GROUPS,
  type CharacterId,
} from "../../../packages/shared/src/catalog";
import {
  campaignEncounter,
  campaignPackReward,
  campaignBossPackReward,
} from "../../../packages/shared/src/campaign";
import {
  TUTORIALS,
  loanUnit,
  adventureConfig,
  type Contract,
} from "../../../packages/shared/src/adventure";
import {
  experienceOf,
  profileLoadouts,
  type CollectionProfile,
  type Experience,
} from "../../../packages/shared/src/experience";
import {
  awardPacks,
  type MailboxProfile,
} from "../../../packages/shared/src/mailbox";
import { Arena } from "./rendering/Arena";
import { PresetBar } from "./CollectionWorkspace";
import { Portrait, TeamChoices, type Inspect } from "./GameCatalog";
import { battleFacts, advanceMastery } from "./adventureProgress";
import type { BattleSummary } from "./battleAnalytics";
import type { BattleConfig } from "../../../packages/battle-engine/src/types";
import type { Loadout } from "../../../packages/shared/src/balance";
import type { GameSettings } from "./gameSettings";
import { HomeScreen, CampaignScreen } from "./AdventureScreens";
import { RewardTrack, RewardToast } from "./ModeRewards";
import { localRewardById } from "./rewardLookup";
import {
  claimLocalModeReward,
  type ModeReward,
} from "../../../packages/shared/src/mode-rewards";
import "./experience.css";
import { journeyEvent } from "./telemetry";
import { MasteryJourney } from "./MasteryJourney";
import { DailyChallenges } from "./DailyChallenges";
import { RoguelikeScreen } from "./RoguelikeScreen";
import {
  challengeDay,
  dailyPool,
  savedDailyTeam,
  saveDailyTeam,
  legalDailyTeam,
  dailyEnemies,
} from "../../../packages/shared/src/daily-challenges";
import {
  DAILY_CHALLENGE_REWARDS,
  ROGUELIKE_REWARDS,
  dailyWins,
  rogueBest,
  applyModeReward,
  rewardReceipt,
  settleRogueRewards,
} from "../../../packages/shared/src/mode-rewards";
import {
  runLoadouts,
  runBattleConfig,
  beginRunBattle,
  runBattleSeed,
  settleRunBattle,
  type RoguelikeRun,
} from "../../../packages/shared/src/roguelike";
import { freshBattleSeed } from "./battleSeed";

export interface AdventureProfile extends CollectionProfile, MailboxProfile {
  choiceChests?: number;
  campaignStage: number;
  bossPacks: number;
  missions: { draw: number; win: number; campaign: number };
}

type Mode =
  "home" | "campaign" | "challenges" | "tutorial" | "mastery" | "expedition";
type Battle = {
  config: BattleConfig;
  seed: number;
  kind: Mode;
  stage?: number;
  tutorial?: number;
  medal?: string;
  route?: string;
  day?: string;
  opponent?: number;
  runId?: string;
  round?: number;
};
export function AdventurePage({
  mode,
  profile,
  onSave,
  settings,
  onError,
  inspect: externalInspect,
  onNavigate,
  onRecord,
}: {
  mode: Mode;
  profile: AdventureProfile;
  onSave: (profile: AdventureProfile) => void;
  settings: GameSettings;
  onError: (message: string) => void;
  inspect: (info: Inspect) => void;
  onNavigate: (mode: Mode | "inventory" | "packs" | "analytics") => void;
  onRecord: (summary: BattleSummary) => void;
}) {
  const experience = experienceOf(profile),
    [stage, setStage] = useState(profile.campaignStage + 1),
    [battle, setBattle] = useState<Battle | null>(null),
    [summary, setSummary] = useState<BattleSummary | null>(null),
    [tutorial, setTutorial] = useState(0),
    [team, setTeam] = useState<Loadout[]>(() => {
      if (mode === "challenges") {
        return savedDailyTeam(experience.dailyChallenge);
      }
      return [loanUnit("char_01"), loanUnit("char_11"), loanUnit("char_15")];
    }),
    [replay, setReplay] = useState(false),
    [replayKey, setReplayKey] = useState(0);
  const [rewardNotice, setRewardNotice] = useState<ModeReward | null>(null),
    [claiming, setClaiming] = useState(false);
  const [opponent, setOpponent] = useState(
    experience.dailyChallenge?.day === challengeDay()
      ? experience.dailyChallenge.selected
      : 0,
  );
  const [configInfo, setConfigInfo] = useState<Inspect | null>(null);
  function inspect(info: Inspect) {
    if (
      info.configuration &&
      info.loadout &&
      !info.live &&
      (!battle || summary)
    )
      setConfigInfo(info);
    else externalInspect(info);
  }
  const configLoaned = mode === "challenges" || mode === "tutorial",
    configAllies =
      mode === "expedition" && experience.roguelike
        ? runLoadouts(experience.roguelike)
        : configLoaned
          ? team
          : profileLoadouts(profile);
  const configDialog = configInfo?.loadout && (
    <CharacterConfig
      key={configInfo.id}
      unit={configInfo.loadout}
      readOnly={
        configInfo.readOnly ||
        (!!battle && !summary) ||
        (mode === "expedition" && experience.roguelike?.phase === "battle")
      }
      loaned={configLoaned}
      equipmentLocked={mode === "expedition"}
      profile={profile}
      allies={configAllies}
      items={
        mode === "expedition" && experience.roguelike
          ? experience.roguelike.bag.map((itemId) => ({
              itemId,
              level: experience.roguelike!.itemLevels[itemId],
            }))
          : configLoaned
            ? CATALOG_ITEMS.map((i) => ({ itemId: i.id, level: 10 }))
            : profile.itemCards.map((i) => ({
                ...i,
                owner: Object.entries(profile.equipment).find(([, items]) =>
                  items.includes(i.itemId),
                )?.[0],
              }))
      }
      onClose={() => setConfigInfo(null)}
      onApply={(next) => {
        if (mode === "challenges" && !dailyPool().includes(next.characterId!))
          throw Error(
            "Pool ngày đã đổi. Đóng cấu hình và chọn đội từ bộ nhân vật hôm nay.",
          );
        if (mode === "campaign") onSave(applyOwnedConfig(profile, next));
        else if (mode === "expedition" && experience.roguelike) {
          const run = experience.roguelike,
            masteries = { ...run.masteries };
          if (next.masteryId)
            masteries[next.characterId!] = {
              id: next.masteryId,
              ...(next.masteryTarget ? { target: next.masteryTarget } : {}),
            };
          else delete masteries[next.characterId!];
          validateMasteryTeam(
            run.team.map((id) => ({
              characterId: id,
              masteryId: masteries[id]?.id,
              masteryTarget: masteries[id]?.target,
            })),
          );
          updateExperience({
            ...experience,
            roguelike: { ...run, masteries },
          });
        } else {
          const nextTeam = team.map((u) =>
            u.characterId === next.characterId
              ? next
              : {
                  ...u,
                  equipment: u.equipment.filter(
                    (id) => !next.equipment.includes(id),
                  ),
                },
          );
          validateMasteryTeam(nextTeam);
          changeLoanTeam(nextTeam);
        }
      }}
    />
  );
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const settled = useRef("");
  function updateExperience(next: Experience) {
    onSave({ ...profile, experience: next });
  }
  function start(next: Omit<Battle, "seed"> & { seed?: number }) {
    if (next.kind === "expedition" && next.seed === undefined)
      throw Error("Thiếu seed của trận viễn chinh đang lưu.");
    journeyEvent("battle_start", {
      mode: next.kind,
      stage: next.stage || 0,
      retry: !!summary,
    });
    settled.current = "";
    setBattle({
      ...next,
      seed: next.kind === "expedition" ? next.seed! : freshBattleSeed(),
    });
    setSummary(null);
    setReplay(false);
  }
  const day = challengeDay();
  useEffect(() => {
    if (mode !== "expedition") return;
    const current = profileRef.current,
      next = settleRogueRewards(current);
    if (next !== current) {
      profileRef.current = next;
      onSave(next);
    }
  }, [
    mode,
    profile.rewardReceipts,
    experience.roguelikeBest,
    experience.roguelikeDay,
  ]);
  useEffect(() => {
    if (mode !== "challenges") return;
    const saved = profileRef.current.experience?.dailyChallenge;
    const selected = saved?.day === day ? saved.selected : 0;
    setOpponent(selected);
    setTeam(savedDailyTeam(saved, day));
  }, [mode, day]);
  function changeLoanTeam(next: Loadout[], selected = opponent) {
    if (mode !== "challenges") {
      setTeam(next);
      return;
    }
    const cleaned = next.map((u) =>
      u.masteryTarget &&
      !next.some((other) => other.characterId === u.masteryTarget)
        ? { ...u, masteryTarget: undefined }
        : u,
    );
    const legal = legalDailyTeam(cleaned, day),
      current = profileRef.current,
      exp = experienceOf(current);
    const updated = {
      ...current,
      experience: {
        ...exp,
        dailyChallenge: saveDailyTeam(legal, selected, day),
      },
    };
    profileRef.current = updated;
    onSave(updated);
    setTeam(legal);
  }
  function selectOpponent(n: number) {
    setOpponent(n);
    changeLoanTeam(team, n);
  }
  function updateRun(run: RoguelikeRun) {
    const current = profileRef.current,
      exp = experienceOf(current);
    let next: AdventureProfile = {
      ...current,
      experience: {
        ...exp,
        roguelike: run,
        ...(exp.roguelike?.id === run.id && run.floor > exp.roguelike.floor
          ? {
              roguelikeDay: day,
              roguelikeBest: Math.max(
                exp.roguelikeDay === day ? exp.roguelikeBest || 0 : 0,
                run.floor,
              ),
            }
          : {}),
      },
    };
    next = settleRogueRewards(next);
    profileRef.current = next;
    onSave(next);
  }
  function expeditionStart() {
    const run = experienceOf(profileRef.current).roguelike;
    if (!run) return;
    const active = run.phase === "battle" ? run : beginRunBattle(run);
    if (active !== run) updateRun(active);
    start({
      kind: "expedition",
      config: runBattleConfig(active),
      seed: runBattleSeed(active),
      round: active.floor,
      runId: active.id,
    });
  }
  async function claimReward(id: string) {
    if (claiming) return;
    setClaiming(true);
    try {
      const current = profileRef.current;
      const next = claimLocalModeReward(current, id);
      profileRef.current = next;
      onSave(next);
      setRewardNotice(localRewardById(id));
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setClaiming(false);
    }
  }
  function finish(result: BattleSummary) {
    if (!battle || replay) return;
    const key = `${battle.kind}:${battle.seed}:${battle.stage}:${battle.round}`;
    if (settled.current === key) return;
    settled.current = key;
    setSummary(result);
    journeyEvent("battle_complete", {
      mode: battle.kind,
      won: result.winner === "team-player",
      ticks: result.ticks,
    });
    onRecord({ ...result, config: battle.config, seed: battle.seed });
    const current = profileRef.current,
      won = result.winner === "team-player";
    let next: AdventureProfile = {
        ...current,
        experience: advanceMastery(experienceOf(current), result),
      },
      exp = experienceOf(next);
    if (battle.kind === "campaign" && won && battle.stage) {
      const first = battle.stage > current.campaignStage;
      if (first) {
        next = awardPacks(
          {
            ...next,
            campaignStage: battle.stage,
            bossPacks: next.bossPacks + campaignBossPackReward(battle.stage),
            missions: {
              ...next.missions,
              campaign: next.missions.campaign + 1,
            },
          },
          campaignPackReward(battle.stage),
          `campaign-first:${battle.stage}`,
        );
      } else
        next = {
          ...next,
          missions: { ...next.missions, campaign: next.missions.campaign + 1 },
        };
      const roles = new Set(
        result.units
          .filter((u) => u.team === "team-player")
          .map((u) => character(u.characterId)?.roleClass),
      );
      const unbonded = battle.config.teams[0].loadouts.every((u) =>
        u.equipment.every((id) => itemInfo(id)?.affinity !== u.characterId),
      );
      const medal = (roles.size >= 2 ? 1 : 0) + (unbonded ? 1 : 0);
      exp = {
        ...exp,
        medals: {
          ...exp.medals,
          [`stage:${battle.stage}`]: Math.max(
            exp.medals[`stage:${battle.stage}`] || 0,
            1 + medal,
          ),
        },
      };
    }
    if (battle.kind === "tutorial" && battle.tutorial !== undefined)
      exp = {
        ...exp,
        tutorial: Array.from(new Set([...exp.tutorial, battle.tutorial])),
      };
    if (battle.kind === "challenges") {
      const battleDay = battle.day || day,
        index = battle.opponent || 0;
      const daily =
        exp.dailyChallenge?.day === battleDay ? exp.dailyChallenge : undefined;
      // Preserve the completed build for every opponent, on both victory and defeat.
      if (!exp.dailyChallenge || daily)
        exp = {
          ...exp,
          dailyChallenge: saveDailyTeam(
            battle.config.teams[0].loadouts,
            index,
            battleDay,
          ),
        };
      if (won)
        exp = {
          ...exp,
          medals: { ...exp.medals, [`daily:${battleDay}:${index}`]: 1 },
        };
      next.experience = exp;
      const at = Date.parse(`${battleDay}T12:00:00+07:00`);
      for (const reward of DAILY_CHALLENGE_REWARDS)
        if (dailyWins(next, battleDay) >= reward.goal)
          next = applyModeReward(
            next,
            reward.reward,
            rewardReceipt(reward.id, at),
          );
      exp = experienceOf(next);
    }
    if (battle.kind === "expedition") {
      const run = exp.roguelike;
      if (
        !run ||
        run.id !== battle.runId ||
        run.floor !== battle.round ||
        run.phase !== "battle"
      )
        return;
      const settledRun = settleRunBattle(
        run,
        won,
        result.units
          .filter((u) => u.team === "team-player")
          .map((u) => ({
            characterId: u.characterId,
            hp: u.hp || 0,
            maxHp: u.maxHp || 1,
          })),
      );
      const reached =
        settledRun.run?.floor ?? settledRun.end?.floor ?? run.floor;
      exp = {
        ...exp,
        roguelike: settledRun.run,
        lastRun: settledRun.end || exp.lastRun,
        ...(won
          ? {
              roguelikeDay: day,
              roguelikeBest: Math.max(
                exp.roguelikeDay === day ? exp.roguelikeBest || 0 : 0,
                reached,
              ),
            }
          : {}),
      };
      next.experience = exp;
      next = settleRogueRewards(next);
      exp = experienceOf(next);
    }
    next.experience = exp;
    profileRef.current = next;
    onSave(next);
  }
  const encounter = campaignEncounter(
    Math.min(stage, profile.campaignStage + 1),
    profile.team.length,
  );
  function campaignStart() {
    const config = adventureConfig(
      profileLoadouts(profile),
      encounter.loadouts,
    );
    config.campaign = { stage: encounter.stage, enemyTeamId: "team-rival" };
    start({
      config,
      kind: "campaign",
      stage: encounter.stage,
    });
  }
  const teamEditor = (
    <LoanTeamEditor
      team={team}
      onChange={changeLoanTeam}
      pool={mode === "challenges" ? dailyPool(day) : undefined}
      contracts={[]}
      inspect={inspect}
    />
  );
  const preset = (
    <PresetBar
      profile={profile}
      onChange={(changes) => onSave({ ...profile, ...changes })}
      disabled={!!battle && !summary}
      onError={onError}
    />
  );
  const teamPreview = (
    <div className="team-summary">
      {profileLoadouts(profile).map((u) => (
        <LoadoutCard
          key={u.characterId}
          unit={u}
          onClick={() =>
            inspect({
              kind: "character",
              id: u.characterId!,
              loadout: u,
              configuration: true,
            })
          }
        />
      ))}
    </div>
  );
  return (
    <section className={`adventure-page mode-${mode}`}>
      {configDialog}
      {rewardNotice && (
        <RewardToast
          reward={rewardNotice}
          onClose={() => setRewardNotice(null)}
          onOpenPacks={() => onNavigate("packs")}
        />
      )}
      {battle ? (
        <>
          {summary && (
            <div className="postbattle-actions">
              <button
                className="primary main-cta"
                onClick={() => {
                  if (
                    battle.kind === "campaign" &&
                    summary.winner === "team-player"
                  )
                    setStage(profile.campaignStage + 1);
                  setBattle(null);
                  setSummary(null);
                }}
              >
                {battle.kind === "expedition" &&
                summary.winner !== "team-player"
                  ? "Run kết thúc · về tháp →"
                  : summary.winner !== "team-player"
                    ? "Chỉnh đội hình & thử lại →"
                    : battle.kind === "campaign"
                      ? `Đi tiếp · ải ${profile.campaignStage + 1} →`
                      : battle.kind === "expedition"
                        ? "Tiếp tục hành trình →"
                        : "Xem thưởng & chọn thử thách →"}
              </button>
              <details className="progressive-details">
                <summary>Xem lại & thử nghiệm đội hình</summary>
                <div className="action-row">
                  <button
                    onClick={() => {
                      setReplay(true);
                      setReplayKey((n) => n + 1);
                    }}
                  >
                    Xem lại trận
                  </button>
                  {battle.kind !== "expedition" && (
                    <button
                      onClick={() =>
                        start({
                          ...battle,
                          config:
                            battle.kind === "campaign"
                              ? {
                                  ...battle.config,
                                  teams: [
                                    {
                                      ...battle.config.teams[0],
                                      loadouts: profileLoadouts(profile),
                                    },
                                    battle.config.teams[1],
                                  ],
                                }
                              : battle.config,
                        })
                      }
                    >
                      Đấu lại · trận mới
                    </button>
                  )}
                </div>
              </details>
            </div>
          )}
          {summary && battle.kind === "challenges" && (
            <RewardTrack
              title="Chiến lợi phẩm chinh phục"
              subtitle="Nhận thưởng ngay khi đạt mốc"
              milestones={DAILY_CHALLENGE_REWARDS}
              progress={dailyWins(profile)}
              profile={profile}
              onClaim={(id) => void claimReward(id)}
              claiming={claiming}
            />
          )}
          {summary && battle.kind === "expedition" && (
            <RewardTrack
              title="Thành tích hôm nay"
              subtitle="Thành tích tốt nhất trong một run"
              milestones={ROGUELIKE_REWARDS}
              progress={rogueBest(profile)}
              profile={profile}
              onClaim={(id) => void claimReward(id)}
              claiming={claiming}
            />
          )}
          {(!summary || replay) && (
            <Arena
              key={`${battle.kind}:${battle.seed}:${replay ? replayKey : 0}`}
              config={battle.config}
              seed={battle.seed}
              muted={!settings.sound}
              low={settings.reducedEffects}
              showEffects={settings.effects}
              showDamage={settings.damageNumbers}
              showRecovery={settings.recoveryNumbers}
              loadReplayChunk={async () => []}
              onInspect={(fighter, tick) =>
                inspect({
                  kind: "character",
                  id: fighter.characterId || "char_01",
                  live: fighter,
                  liveTick: tick,
                })
              }
              onError={onError}
              onBattleComplete={finish}
              highlightTeamId="team-player"
              label={
                replay
                  ? "XEM LẠI · không nhận thêm thưởng"
                  : battle.kind === "campaign"
                    ? `ĐI ẢI · ${battle.stage}`
                    : battle.kind === "expedition"
                      ? `VIỄN CHINH · TẦNG ${(battle.round || 0) + 1}`
                      : "THỬ THÁCH NGÀY · POOL CHO MƯỢN"
              }
            />
          )}
          {summary && (
            <BattleDebrief
              summary={summary}
              inspect={inspect}
              onAnalytics={() => onNavigate("analytics")}
            />
          )}
        </>
      ) : mode === "home" ? (
        <HomeScreen profile={profile} navigate={onNavigate} />
      ) : mode === "campaign" ? (
        <CampaignScreen
          profile={profile}
          stage={stage}
          onStage={setStage}
          start={campaignStart}
          inspect={inspect}
          editor={
            <>
              {preset}
              {teamPreview}
            </>
          }
          navigate={onNavigate}
          onClaim={(id) => void claimReward(id)}
          claiming={claiming}
        />
      ) : mode === "tutorial" ? (
        <>
          <h2>Ba quyết định đầu tiên</h2>
          <div className="action-row">
            {TUTORIALS.map((t, index) => (
              <button
                key={t.name}
                aria-pressed={tutorial === index}
                onClick={() => {
                  setTutorial(index);
                  setTeam(t.team.map((id) => loanUnit(id)));
                }}
              >
                {experience.tutorial.includes(index) ? "✓ " : ""}
                {t.name}
              </button>
            ))}
          </div>
          <p>{TUTORIALS[tutorial].text}</p>
          {teamEditor}
          <TeamChoices
            loadouts={team}
            choice={{}}
            disabled
            onChange={() => {}}
            inspect={inspect}
          />
          <button
            className="primary"
            onClick={() => {
              if (
                tutorial === 0 &&
                !team.some((u) =>
                  u.equipment.some(
                    (id) => itemInfo(id)?.affinity === u.characterId,
                  ),
                )
              )
                return onError(
                  "Gắn ít nhất một vật phẩm hợp cạ để bắt đầu bài tập.",
                );
              if (
                tutorial === 1 &&
                !BONDS.some((b) =>
                  b.members.every((id) =>
                    team.some((u) => u.characterId === id),
                  ),
                ) &&
                !FRIEND_GROUPS.some(
                  (g) =>
                    groupTier(
                      g,
                      team.map((u) => u.characterId),
                    ) > 0,
                )
              )
                return onError(
                  "Chọn các quân có ít nhất một liên kết hoặc hội hoạt động.",
                );
              if (
                tutorial === 2 &&
                team.every(
                  (u, i) =>
                    u.characterId === TUTORIALS[2].team[i] &&
                    !u.equipment.length,
                )
              )
                return onError(
                  "Đổi một quân hoặc gắn một vật phẩm trước khi thử.",
                );
              start({
                kind: "tutorial",
                tutorial,
                config: adventureConfig(team, [
                  loanUnit("char_02", "", 1),
                  loanUnit("char_03", "", 1),
                ]),
              });
            }}
          >
            Đánh thử · miễn phí
          </button>
          <button onClick={() => onNavigate("home")}>
            Bỏ qua và về hành trình
          </button>
        </>
      ) : mode === "mastery" ? (
        <MasteryJourney
          profile={profile}
          onInventory={() => onNavigate("inventory")}
          onTitle={(title) =>
            updateExperience({ ...experience, activeTitle: title })
          }
        />
      ) : mode === "challenges" ? (
        <DailyChallenges
          profile={profile}
          team={team}
          opponent={opponent}
          onOpponent={selectOpponent}
          editor={teamEditor}
          inspect={inspect}
          onClaim={(id) => void claimReward(id)}
          onStart={() => {
            try {
              const legal = legalDailyTeam(team, day);
              changeLoanTeam(legal);
              start({
                kind: "challenges",
                day,
                opponent,
                config: adventureConfig(legal, dailyEnemies(day, opponent)),
              });
            } catch (e) {
              onError((e as Error).message);
            }
          }}
        />
      ) : (
        <RoguelikeScreen
          profile={profile}
          onRun={updateRun}
          inspect={inspect}
          onError={onError}
          onClaim={(id) => void claimReward(id)}
          onBattle={() => {
            try {
              expeditionStart();
            } catch (e) {
              onError((e as Error).message);
            }
          }}
          onAbandon={() => {
            const current = profileRef.current,
              exp = experienceOf(current),
              run = exp.roguelike;
            if (!run) return;
            onSave({
              ...current,
              experience: {
                ...exp,
                roguelike: undefined,
                lastRun: {
                  id: run.id,
                  floor: run.floor,
                  wins: run.wins,
                  won: false,
                  reason: "abandon",
                },
              },
            });
          }}
        />
      )}
    </section>
  );
}

export function EnemyPreview({
  team,
  inspect,
  pool,
}: {
  pool?: CharacterId[];
  team: Loadout[];
  inspect: (info: Inspect) => void;
}) {
  return (
    <div className="adventure-team">
      {team.map((u) => (
        <button
          key={u.characterId}
          onClick={() =>
            inspect({
              kind: "character",
              id: u.characterId!,
              loadout: u,
              configuration: true,
              readOnly: true,
            })
          }
        >
          <Portrait id={u.characterId!} />
          <b>{character(u.characterId)?.name}</b>
          <small>
            Lv.{u.level} ·{" "}
            {u.equipment
              .map(
                (id) =>
                  `${itemInfo(id)?.name} Lv.${u.equipmentLevels?.[id] || u.level}`,
              )
              .join(", ") || "Không trang bị"}
          </small>
        </button>
      ))}
    </div>
  );
}
function LoanTeamEditor({
  team,
  onChange,
  contracts,
  inspect,
  pool,
}: {
  pool?: CharacterId[];
  team: Loadout[];
  onChange: (team: Loadout[]) => void;
  contracts: Contract[];
  inspect: (info: Inspect) => void;
}) {
  return (
    <section className="loan-team">
      <h3>Đội cho mượn · Lv.10</h3>
      {team.map((u, slot) => (
        <div className="action-row" key={slot}>
          <select
            aria-label={`Quân cho mượn ${slot + 1}`}
            value={u.characterId}
            onChange={(e) =>
              onChange(
                team.map((v, n) =>
                  n === slot ? loanUnit(e.target.value as CharacterId) : v,
                ),
              )
            }
          >
            {ROSTER.filter(
              (c) => !pool || pool.includes(c.id as CharacterId),
            ).map((c) => (
              <option
                key={c.id}
                value={c.id}
                disabled={
                  (contracts.includes("rare") &&
                    ["T3", "T4"].includes(c.tier)) ||
                  team.some((v, n) => n !== slot && v.characterId === c.id)
                }
              >
                {c.name}
              </option>
            ))}
          </select>
          <select
            aria-label={`Đồ cho mượn ${slot + 1}`}
            value={u.equipment[0] || ""}
            onChange={(e) =>
              onChange(
                team.map((v, n) =>
                  n === slot
                    ? {
                        ...v,
                        equipment: e.target.value ? [e.target.value] : [],
                        equipmentLevels: e.target.value
                          ? { [e.target.value]: 10 }
                          : {},
                      }
                    : v,
                ),
              )
            }
          >
            <option value="">Không trang bị</option>
            {CATALOG_ITEMS.slice()
              .sort(
                (a, b) =>
                  Number(b.affinity === u.characterId) -
                  Number(a.affinity === u.characterId),
              )
              .map((it) => (
                <option
                  key={it.id}
                  value={it.id}
                  disabled={
                    (contracts.includes("rare") && it.rarity > 1) ||
                    (contracts.includes("unbonded") &&
                      it.affinity === u.characterId) ||
                    team.some(
                      (v, n) => n !== slot && v.equipment.includes(it.id),
                    )
                  }
                >
                  {it.name}
                  {it.affinity === u.characterId ? " · Hợp cạ" : ""}
                </option>
              ))}
          </select>
          <button
            onClick={() =>
              inspect({
                kind: "character",
                id: u.characterId!,
                loadout: u,
                configuration: true,
              })
            }
          >
            Chi tiết
          </button>
          <button
            disabled={team.length <= 1}
            onClick={() => onChange(team.filter((_, index) => index !== slot))}
          >
            Bỏ ô {slot + 1}
          </button>
        </div>
      ))}
      {team.length < 3 && (
        <button
          onClick={() => {
            const next = ROSTER.find(
              (c) =>
                !team.some((u) => u.characterId === c.id) &&
                (!pool || pool.includes(c.id as CharacterId)) &&
                (!contracts.includes("rare") || !["T3", "T4"].includes(c.tier)),
            );
            if (next) onChange([...team, loanUnit(next.id as CharacterId)]);
          }}
        >
          Thêm quân cho mượn
        </button>
      )}
    </section>
  );
}
function BattleDebrief({
  summary,
  inspect,
  onAnalytics,
}: {
  summary: BattleSummary;
  inspect: (info: Inspect) => void;
  onAnalytics: () => void;
}) {
  const facts = battleFacts(summary);
  return (
    <section className="battle-debrief">
      <h2>
        {summary.winner === "team-player"
          ? "Chiến thắng!"
          : "Thử một cách phối hợp khác"}
      </h2>
      <p>{facts.hint.replace("seed", "điều kiện trận")}</p>
      {facts.first && (
        <p>
          Bị hạ đầu tiên: {character(facts.first.characterId)?.name} ở{" "}
          {((facts.first.aliveTicks || 0) / 30).toFixed(1)}s.
        </p>
      )}
      <details className="progressive-details">
        <summary>
          Thống kê trận đấu · {(summary.ticks / 30).toFixed(1)} giây
        </summary>
        <div className="debrief-stats">
          {[
            ["Sát thương", facts.damage],
            ["Hồi đồng đội", facts.healing],
            ["Khiên hấp thụ", facts.shielding],
            ["Liên kết kích hoạt", facts.links],
          ].map(([label, value]) => (
            <div key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <button onClick={onAnalytics}>Mở Phân tích số liệu →</button>
      </details>
    </section>
  );
}
