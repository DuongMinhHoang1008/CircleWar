import { useState } from "react";
import {
  epicChoices,
  openChoiceChest,
  rewardReceipt,
  type ModeReward,
  type RewardMilestone,
  type RewardProfile,
} from "../../../packages/shared/src/mode-rewards";
import { Portrait, ItemSprite } from "./GameCatalog";

export function RewardBundle({
  reward,
  large = false,
}: {
  reward: ModeReward;
  large?: boolean;
}) {
  return (
    <div className={`reward-bundle${large ? " large" : ""}`}>
      {reward.packs > 0 && (
        <span className="reward-quantity normal">
          <i aria-hidden="true">▥</i>
          <strong>{reward.packs}</strong>
          <span>Pack thường</span>
        </span>
      )}
      {reward.bossPacks > 0 && (
        <span className="reward-quantity boss">
          <i className="boss-pack-icon" aria-hidden="true">
            ✦
          </i>
          <strong>{reward.bossPacks}</strong>
          <span>Pack Boss</span>
        </span>
      )}
      {!!reward.choiceChests && (
        <span className="reward-quantity chest">
          <i aria-hidden="true">✦</i>
          <strong>{reward.choiceChests}</strong>
          <span>Rương chọn Sử thi</span>
        </span>
      )}
    </div>
  );
}
export function RewardTrack({
  title = "Phần thưởng",
  subtitle,
  milestones,
  progress,
  profile,
  onClaim,
  claiming,
  compact = false,
}: {
  title?: string;
  subtitle?: string;
  milestones: RewardMilestone[];
  progress: number;
  profile: Pick<RewardProfile, "rewardReceipts">;
  onClaim: (id: string) => void;
  claiming?: boolean;
  compact?: boolean;
}) {
  return (
    <section
      className={`reward-track${compact ? " compact" : ""}`}
      aria-label={title}
    >
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
        </div>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="reward-milestones">
        {milestones.map((m, index) => {
          const claimed = profile.rewardReceipts?.includes(rewardReceipt(m.id)),
            ready = progress >= m.goal;
          return (
            <article
              key={m.id}
              className={`reward-milestone ${claimed ? "claimed" : ready ? "ready" : "locked"}`}
            >
              <div className="milestone-heading">
                <span className="milestone-number">
                  {claimed ? "✓" : index + 1}
                </span>
                <h3>{m.label}</h3>
                {ready && !claimed && (
                  <span className="ready-label">Có thể nhận</span>
                )}
              </div>
              <RewardBundle reward={m.reward} />
              {m.reward.title && (
                <span className="reward-title">✧ Danh hiệu độc quyền</span>
              )}
              <button
                disabled={claiming || claimed || !ready}
                className={ready && !claimed ? "primary" : "reward-claim"}
                onClick={() => onClaim(m.id)}
                aria-label={`${claimed ? "Đã nhận" : "Nhận thưởng"} ${m.label}`}
              >
                {claimed
                  ? "Đã nhận thưởng"
                  : ready
                    ? "Nhận thưởng"
                    : `${Math.min(progress, m.goal)} / ${m.goal}`}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
export function RewardToast({
  reward,
  onClose,
  onOpenPacks,
}: {
  reward: ModeReward;
  onClose: () => void;
  onOpenPacks: () => void;
}) {
  return (
    <section className="reward-confirmation" role="status">
      <div>
        <span className="section-kicker">ĐÃ NHẬN THƯỞNG</span>
        <h3>Chiến lợi phẩm của bạn</h3>
        <RewardBundle reward={reward} />
        <p>Pack vượt sức chứa được giữ trong Hòm thư.</p>
      </div>
      <div className="action-row">
        <button className="primary" onClick={onOpenPacks}>
          Mở phần thưởng
        </button>
        <button aria-label="Đóng phần thưởng" onClick={onClose}>
          ×
        </button>
      </div>
    </section>
  );
}
export function ChoiceChestPanel<T extends RewardProfile>({
  profile,
  onSave,
  onError,
}: {
  profile: T;
  onSave: (next: T) => void;
  onError: (message: string) => void;
}) {
  const [selected, setSelected] = useState(""),
    [opened, setOpened] = useState(false),
    choices = epicChoices(profile);
  if (!profile.choiceChests) return null;
  return (
    <section className="choice-chest-panel">
      <div>
        <span className="section-kicker">PHẦN THƯỞNG CHINH PHỤC</span>
        <h2>{profile.choiceChests} Rương chọn Sử thi</h2>
        <p>
          Chọn đúng thẻ nhân vật hoặc vật phẩm bạn cần. Thẻ trùng nhận 150 EXP;
          thẻ đã max không xuất hiện.
        </p>
      </div>
      <button className="primary" onClick={() => setOpened(!opened)}>
        {opened ? "Thu gọn" : "Chọn thẻ Sử thi"}
      </button>
      {opened && (
        <>
          <div className="chest-choices">
            {choices.map((c) => (
              <button
                key={`${c.kind}:${c.id}`}
                aria-pressed={selected === `${c.kind}:${c.id}`}
                onClick={() => setSelected(`${c.kind}:${c.id}`)}
              >
                {c.kind === "character" ? (
                  <Portrait id={c.id as Parameters<typeof Portrait>[0]["id"]} />
                ) : (
                  <ItemSprite id={c.id} />
                )}
                <b>{c.name}</b>
                <small>
                  {c.kind === "character" ? "Nhân vật" : "Vật phẩm"}
                </small>
              </button>
            ))}
          </div>
          <button
            className="primary"
            disabled={choices.length > 0 && !selected}
            onClick={() => {
              try {
                const current = profile;
                onSave(
                  openChoiceChest(
                    current,
                    choices.length ? selected : "boss-packs",
                  ),
                );
                setSelected("");
                setOpened(false);
              } catch (e) {
                onError((e as Error).message);
              }
            }}
          >
            {choices.length
              ? "Xác nhận nhận thẻ đã chọn"
              : "Tất cả Sử thi đã max · Nhận 5 Pack Boss"}
          </button>
        </>
      )}
    </section>
  );
}
