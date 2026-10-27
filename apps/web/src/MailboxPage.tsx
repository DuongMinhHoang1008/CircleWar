import { useState } from "react";
import type { GiftMail } from "../../../packages/shared/src/mailbox";
import { PACK_CAPACITY } from "../../../packages/shared/src/progression";
import "./mailbox.css";

export function MailboxPage({
  mails,
  queued,
  ready,
  onClaim,
  onOpenPacks,
}: {
  mails: GiftMail[];
  queued: number;
  ready: boolean;
  onClaim: (id: string) => void;
  onOpenPacks: () => void;
}) {
  const [tab, setTab] = useState<"pending" | "claimed">("pending");
  const pending = mails.filter((mail) => mail.claimedAt === undefined);
  const claimed = mails.filter((mail) => mail.claimedAt !== undefined);
  const visible = (tab === "pending" ? pending : claimed).slice().reverse();
  const space = PACK_CAPACITY - queued;
  return (
    <section className="mailbox-page">
      <div className="mailbox-summary">
        <div>
          <span className="mailbox-kicker">QUÀ TỪ RISEON</span>
          <h2>Những món quà đang chờ bạn.</h2>
          <p>
            Quà được giữ trong thư cho đến khi bạn nhận. Hãy để đủ chỗ trong
            hàng chờ cho toàn bộ pack của mỗi thư.
          </p>
        </div>
        <div className="mailbox-capacity" role="status">
          <span>HÀNG CHỜ PACK</span>
          <strong>
            {queued}
            <small> / {PACK_CAPACITY}</small>
          </strong>
          <progress value={queued} max={PACK_CAPACITY} />
          <small>Còn {space} chỗ trống</small>
          <button onClick={onOpenPacks}>Mở pack để thêm chỗ ↗</button>
        </div>
      </div>
      <div className="mailbox-tabs" role="tablist" aria-label="Loại thư">
        <button
          role="tab"
          aria-selected={tab === "pending"}
          onClick={() => setTab("pending")}
        >
          Chờ nhận <b>{pending.length}</b>
        </button>
        <button
          role="tab"
          aria-selected={tab === "claimed"}
          onClick={() => setTab("claimed")}
        >
          Đã nhận <b>{claimed.length}</b>
        </button>
      </div>
      <div className="mailbox-letters">
        {visible.length === 0 ? (
          <div className="mailbox-empty">
            <span aria-hidden="true">✉</span>
            <h3>
              {tab === "pending"
                ? "Bạn đã nhận hết quà."
                : "Chưa có thư đã nhận."}
            </h3>
            <p>
              {tab === "pending"
                ? "Quà tân thủ và quà cập nhật sẽ xuất hiện ở đây."
                : "Thư được lưu lại sau khi bạn nhận quà."}
            </p>
          </div>
        ) : (
          visible.map((mail) => {
            const received = mail.claimedAt !== undefined;
            const missing = Math.max(0, mail.packs - space);
            return (
              <article
                className={`mailbox-letter ${received ? "received" : ""}`}
                key={mail.id}
                aria-label={mail.title}
              >
                <div className="mailbox-seal" aria-hidden="true">
                  {received ? "✓" : "✉"}
                </div>
                <div className="mailbox-letter-body">
                  <div className="mailbox-letter-meta">
                    <span>HỆ THỐNG · RISEON</span>
                    <time dateTime={new Date(mail.createdAt).toISOString()}>
                      {new Date(mail.createdAt).toLocaleDateString("vi-VN", {
                        timeZone: "Asia/Ho_Chi_Minh",
                      })}
                    </time>
                  </div>
                  <h3>{mail.title}</h3>
                  <p>{mail.message}</p>
                  <span className="mailbox-reward">
                    <b>{mail.packs}</b> pack thường
                  </span>
                </div>
                <div className="mailbox-letter-action">
                  <button
                    className={received ? "" : "primary"}
                    disabled={!ready || received || missing > 0}
                    onClick={() => onClaim(mail.id)}
                  >
                    {received ? "Đã nhận" : "Nhận quà"}
                  </button>
                  {!received && missing > 0 && (
                    <small>
                      Cần thêm {missing} chỗ trống.
                      <br />
                      Mở bớt pack để nhận quà.
                    </small>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
