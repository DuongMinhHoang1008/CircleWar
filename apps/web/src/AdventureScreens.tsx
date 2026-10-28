import { LoadoutCard } from "./LoadoutConfig";
import type { ReactNode } from "react";
import type { AdventureProfile } from "./AdventurePage";
import { CHAPTERS } from "../../../packages/shared/src/adventure";
import {
  experienceOf,
  profileLoadouts,
} from "../../../packages/shared/src/experience";
import {
  campaignEncounter,
  campaignPackReward,
  campaignBossPackReward,
} from "../../../packages/shared/src/campaign";
import type { Loadout } from "../../../packages/shared/src/balance";
import {
  CHAPTER_REWARDS,
  type ModeReward,
} from "../../../packages/shared/src/mode-rewards";
import { Portrait, type Inspect } from "./GameCatalog";
import { RewardBundle, RewardTrack } from "./ModeRewards";

type Navigate = (
  mode:
    | "home"
    | "campaign"
    | "challenges"
    | "expedition"
    | "tutorial"
    | "mastery"
    | "inventory"
    | "packs",
) => void;
type Shared = {
  profile: AdventureProfile;
  onClaim: (id: string) => void;
  claiming?: boolean;
};
export function ModeHero({
  label,
  title,
  description,
  children,
  reward,
}: {
  label: string;
  title: string;
  description: string;
  children?: ReactNode;
  reward?: ModeReward;
}) {
  return (
    <div className="mode-hero">
      <div className="mode-hero-copy">
        <span className="section-kicker">{label}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
      </div>
      {reward && (
        <div className="hero-reward">
          <span>Thưởng tối đa</span>
          <RewardBundle reward={reward} large />
        </div>
      )}
    </div>
  );
}
export function TeamSummary({
  units,
  inspect,
  enemy = false,
}: {
  units: Loadout[];
  inspect: (info: Inspect) => void;
  enemy?: boolean;
}) {
  return (
    <div className={`team-summary${enemy ? " enemy" : ""}`}>
      {units.map((unit) => (
        <LoadoutCard
          compact
          showEquipment
          key={unit.characterId}
          unit={unit}
          onClick={() =>
            inspect({
              kind: "character",
              id: unit.characterId!,
              loadout: unit,
              configuration: true,
              readOnly: enemy,
            })
          }
        />
      ))}
    </div>
  );
}
export function HomeScreen({
  profile,
  navigate,
}: {
  profile: AdventureProfile;
  navigate: Navigate;
}) {
  const stage = profile.campaignStage + 1,
    boss = Math.ceil(stage / 5) * 5,
    exp = experienceOf(profile),
    run = exp.roguelike;
  return (
    <>
      <div className="home-welcome">
        <h1>Hôm nay, chinh phục gì?</h1>
      </div>
      <div className="home-main">
        <section className="journey-hero">
          <span className="mode-label">ĐI ẢI</span>
          <h2>
            Ải {stage}
            {stage % 5 === 0 && <span>Boss</span>}
          </h2>
          <p>
            {stage % 5
              ? `Còn ${boss - stage} ải đến boss tiếp theo.`
              : "Đánh bại chỉ huy và hai quân hỗ trợ."}
          </p>
          <RewardBundle
            reward={{
              packs: campaignPackReward(stage),
              bossPacks: campaignBossPackReward(stage),
            }}
          />
          <button
            className="primary hero-cta"
            onClick={() => navigate("campaign")}
          >
            Tiếp tục đi ải <span>→</span>
          </button>
        </section>
        <section className="home-progress">
          <span className="section-kicker">ĐỘI HÌNH SẴN SÀNG</span>
          <div className="home-squad">
            {profile.team.map((id) => (
              <Portrait key={id} id={id} />
            ))}
          </div>
          <h3>{profile.team.length}/3 nhân vật</h3>
          <button onClick={() => navigate("inventory")}>
            Chỉnh đội hình →
          </button>
          {!!profile.choiceChests && (
            <button
              className="chest-shortcut"
              onClick={() => navigate("packs")}
            >
              ✦ {profile.choiceChests} Rương Sử thi chờ mở
            </button>
          )}
        </section>
      </div>
      <div className="section-heading">
        <h2>Chế độ khác</h2>
      </div>
      <div className="featured-modes">
        <button
          className="featured-mode weekly"
          onClick={() => navigate("challenges")}
        >
          <div>
            <h2>Thử thách ngày</h2>
            <p>Pool 9 nhân vật Lv.10 · làm mới mỗi ngày</p>
            <span className="mode-link">Chọn thử thách →</span>
          </div>
          <span className="mode-emblem" aria-hidden="true">
            ♜
          </span>
        </button>
        <button
          className="featured-mode expedition"
          onClick={() => navigate("expedition")}
        >
          <div>
            <h2>Viễn chinh roguelike</h2>
            <p>12 tầng · mua đồ, nâng cấp · thua là kết thúc</p>
            <span className="mode-link">
              {run
                ? `Tiếp tục tầng ${run.floor + 1} →`
                : "Bắt đầu hành trình →"}
            </span>
          </div>
          <span className="mode-emblem" aria-hidden="true">
            ⚑
          </span>
        </button>
      </div>
      <div className="home-secondary">
        <button onClick={() => navigate("tutorial")}>
          <b>Làm quen với game</b>
          <span>{exp.tutorial.length}/3 bài tập hoàn tất →</span>
        </button>
        <button onClick={() => navigate("mastery")}>
          <b>Hành trình nhân vật</b>
          <span>{exp.titles.length} danh hiệu đã mở →</span>
        </button>
        <button onClick={() => navigate("packs")}>
          <b>Bộ sưu tập</b>
          <span>Mở thẻ và nhận thưởng →</span>
        </button>
      </div>
    </>
  );
}
export function CampaignScreen({
  profile,
  stage,
  onStage,
  start,
  inspect,
  editor,
  navigate,
  ...rewards
}: Shared & {
  stage: number;
  onStage: (stage: number) => void;
  start: () => void;
  inspect: (info: Inspect) => void;
  editor: ReactNode;
  navigate: Navigate;
}) {
  const encounter = campaignEncounter(
      Math.min(stage, profile.campaignStage + 1),
      profile.team.length,
    ),
    exp = experienceOf(profile),
    first = encounter.stage > profile.campaignStage;
  return (
    <>
      <ModeHero
        label="CHIẾN DỊCH"
        title={`Ải ${encounter.stage}${encounter.boss ? " · BOSS" : ""}`}
        description={
          first
            ? "Vượt ải để nhận thưởng lần đầu và mở thử thách tiếp theo."
            : "Ải đã chinh phục. Thử đội mới hoặc hoàn thiện huy chương."
        }
        reward={
          first
            ? {
                packs: campaignPackReward(stage),
                bossPacks: campaignBossPackReward(stage),
              }
            : undefined
        }
      />
      <div className="battle-prep-card">
        <div className="prep-side">
          <div className="section-heading">
            <h2>Đội của bạn</h2>
            <button
              className="text-button"
              onClick={() => navigate("inventory")}
            >
              Kho đồ ↗
            </button>
          </div>
          <TeamSummary units={profileLoadouts(profile)} inspect={inspect} />
          <details className="progressive-details">
            <summary>Đổi quân, trang bị & preset</summary>
            {editor}
          </details>
        </div>
        <div className="prep-divider">VS</div>
        <div className="prep-side">
          <div className="section-heading">
            <h2>Đối thủ</h2>
            {encounter.boss && (
              <span className="danger-badge">Chỉ huy cường hóa</span>
            )}
          </div>
          <TeamSummary units={encounter.loadouts} inspect={inspect} enemy />
          <p className="strategy-note">{encounter.strategy}</p>
        </div>
        <div className="prep-footer">
          <div>
            <b>
              {first
                ? "Thưởng được giữ khi đầy kho"
                : "Không phát lại thưởng lần đầu"}
            </b>
            <small>Huy chương: thắng · hai vai trò · không đồ hợp cạ</small>
          </div>
          <button className="primary main-cta" onClick={start}>
            Bắt đầu ải {encounter.stage} →
          </button>
        </div>
      </div>
      <details className="progressive-details map-details">
        <summary>
          Bản đồ chiến dịch <span>Đã vượt {profile.campaignStage} ải</span>
        </summary>
        <div className="chapter-grid">
          {CHAPTERS.map((ch) => (
            <section key={ch.from}>
              <h3>
                {ch.name}{" "}
                <small>
                  {ch.from}–{ch.to}
                </small>
              </h3>
              <div className="stage-grid">
                {Array.from({ length: 10 }, (_, n) => ch.from + n).map((n) => (
                  <button
                    key={n}
                    disabled={n > profile.campaignStage + 1}
                    aria-pressed={n === stage}
                    onClick={() => onStage(n)}
                  >
                    {n % 5 ? "" : "♛ "}
                    {n}
                    <small>{"★".repeat(exp.medals[`stage:${n}`] || 0)}</small>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
        {profile.campaignStage >= 30 && (
          <button onClick={() => onStage(profile.campaignStage + 1)}>
            Đến ải cao nhất
          </button>
        )}
      </details>
      <RewardTrack
        title="Quà hoàn thành chương"
        subtitle="Mỗi mốc nhận một lần"
        milestones={CHAPTER_REWARDS}
        progress={profile.campaignStage}
        profile={profile}
        {...rewards}
      />
    </>
  );
}
