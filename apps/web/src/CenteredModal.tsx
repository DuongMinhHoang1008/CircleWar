import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function CenteredModal({
  titleId,
  onClose,
  children,
}: {
  titleId: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const panel = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const buttons = () =>
      Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]',
        ) || [],
      );
    buttons()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close.current();
      }
      if (event.key !== "Tab") return;
      const targets = buttons(),
        first = targets[0],
        last = targets.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keydown);
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return createPortal(
    <div
      className="gift-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <section className="gift-modal" ref={panel}>
        {children}
        <button
          className="gift-modal-close"
          aria-label="Đóng thông báo"
          onClick={onClose}
        >
          ×
        </button>
      </section>
    </div>,
    document.body,
  );
}

export interface MatchReward {
  id: string;
  mode: "campaign" | "pvp";
  stage?: number;
  packs: number;
  bossPacks: number;
  overflow: number;
}

export function MatchRewardPopup({
  reward,
  onClose,
}: {
  reward: MatchReward;
  onClose: () => void;
}) {
  return (
    <CenteredModal titleId="match-reward-title" onClose={onClose}>
      <span className="eyebrow">
        {reward.mode === "campaign"
          ? `ĐI ẢI · ẢI ${reward.stage}`
          : "MULTIPLAYER · CHIẾN THẮNG"}
      </span>
      <div className="reward-trophy" aria-hidden="true">
        🏆
      </div>
      <h2 id="match-reward-title">
        {reward.mode === "campaign"
          ? "Vượt ải thành công!"
          : "Chiến thắng multiplayer!"}
      </h2>
      <p>Phần thưởng đã được cộng vào kho của bạn.</p>
      <div className="match-reward-items">
        <div>
          <span aria-hidden="true">🎴</span>
          <strong>+{reward.packs}</strong>
          <span>Pack thường</span>
        </div>
        {reward.bossPacks > 0 && (
          <div className="boss-reward">
            <img
              src={`${import.meta.env.BASE_URL}packs/boss-jake.png`}
              alt=""
            />
            <strong>+{reward.bossPacks}</strong>
            <span>Pack Boss</span>
          </div>
        )}
      </div>
      {reward.overflow > 0 && (
        <p className="reward-cap-note">
          Kho pack thường đã đầy (150). {reward.overflow} pack vượt giới hạn
          không được cộng.
        </p>
      )}
      <button className="primary wide" onClick={onClose}>
        Tiếp tục
      </button>
    </CenteredModal>
  );
}
