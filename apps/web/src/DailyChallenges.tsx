import {
  challengeDay,
  dailyPool,
  dailyEnemies,
} from "../../../packages/shared/src/daily-challenges";
import {
  DAILY_CHALLENGE_REWARDS,
  dailyWins,
} from "../../../packages/shared/src/mode-rewards";
import { experienceOf } from "../../../packages/shared/src/experience";
import { character } from "../../../packages/shared/src/catalog";
import type { Loadout } from "../../../packages/shared/src/balance";
import type { AdventureProfile } from "./AdventurePage";
import type { ReactNode } from "react";
import { ModeHero, TeamSummary } from "./AdventureScreens";
import { Portrait, type Inspect } from "./GameCatalog";
import { RewardTrack } from "./ModeRewards";
import { TeamLinks } from "./TeamLinks";

export function DailyChallenges({
  profile,
  team,
  opponent,
  onOpponent,
  editor,
  inspect,
  onStart,
  onClaim,
}: {
  profile: AdventureProfile;
  team: Loadout[];
  opponent: number;
  onOpponent: (n: number) => void;
  editor: ReactNode;
  inspect: (info: Inspect) => void;
  onStart: () => void;
  onClaim: (id: string) => void;
}) {
  const day = challengeDay(),
    exp = experienceOf(profile),
    pool = dailyPool(day);
  return (
    <>
      <ModeHero
        label="THỬ THÁCH NGÀY"
        title="9 nhân vật. Ba thử thách."
        description="Làm mới lúc 00:00 giờ Việt Nam. Nhân vật trong bộ chọn hôm nay và trang bị đều cho mượn Lv.10."
        reward={{ packs: 25, bossPacks: 2 }}
      />
      <div
        className="daily-opponents"
        role="tablist"
        aria-label="Thử thách hôm nay"
      >
        {[0, 1, 2].map((n) => (
          <button
            role="tab"
            key={n}
            aria-selected={n === opponent}
            onClick={() => onOpponent(n)}
          >
            <b>Thử thách {n + 1}</b>
            <span>
              {exp.medals[`daily:${day}:${n}`] ? "✓ Đã vượt" : "Chưa vượt"}
            </span>
          </button>
        ))}
      </div>
      <section className="challenge-play-card">
        <div className="section-heading">
          <h2>Đội của bạn</h2>
          <span className="saved-team-note">
            Tự lưu riêng cho thử thách {opponent + 1}
          </span>
        </div>
        <TeamSummary units={team} inspect={inspect} />
        <TeamLinks units={team} />
        <details className="progressive-details">
          <summary>
            Chọn đội trong pool hôm nay · {pool.length} nhân vật
          </summary>
          <div className="daily-pool" aria-label="Pool nhân vật hôm nay">
            {pool.map((id) => (
              <span key={id} title={character(id)?.name}>
                <Portrait id={id} />
                <small>{character(id)?.name}</small>
              </span>
            ))}
          </div>
          {editor}
        </details>
        <details className="progressive-details">
          <summary>Đội hình đối thủ {opponent + 1}</summary>
          <TeamSummary
            units={dailyEnemies(day, opponent)}
            inspect={inspect}
            enemy
          />
        </details>
        <div className="prep-footer">
          <p>
            Đánh lại miễn phí. Thưởng tự nhận một lần mỗi mốc/ngày; pack dư gửi
            Hòm thư.
          </p>
          <button className="primary main-cta" onClick={onStart}>
            Bắt đầu thử thách {opponent + 1} →
          </button>
        </div>
      </section>
      <details className="progressive-details reward-track-details">
        <summary>
          Phần thưởng hôm nay · đã vượt {dailyWins(profile)}/3 thử thách
        </summary>
        <RewardTrack
          title="Phần thưởng hôm nay"
          subtitle="Tự cộng khi đạt mốc"
          milestones={DAILY_CHALLENGE_REWARDS}
          progress={dailyWins(profile)}
          profile={profile}
          onClaim={onClaim}
        />
      </details>
    </>
  );
}
