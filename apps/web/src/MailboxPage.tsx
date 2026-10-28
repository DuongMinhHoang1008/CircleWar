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
  reserve = 0,
  onClaimReserve,
}: {
  mails: GiftMail[];
  queued: number;
  ready: boolean;
  onClaim: (id: string) => void;
  onOpenPacks: () => void;
  reserve?: number;
  onClaimReserve?: () => void;
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
            Nhận phần vừa hàng chờ; quà còn lại được giữ trong thư.
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
      {reserve > 0 && <section className="mailbox-letter"><div><h3>Thưởng chinh phục đang chờ</h3><p>{reserve} pack đã kiếm được và được giữ an toàn khi hàng chờ đầy.</p></div><button className="primary" disabled={!ready || space <= 0} onClick={onClaimReserve}>Nhận {Math.min(space, reserve)} pack</button></section>}
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
            const remaining = mail.packs - (mail.claimedPacks || 0);
            const missing = Math.max(0, remaining - space);
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
                    <b>{received ? mail.packs : remaining}</b> pack thường {mail.claimedPacks && !received ? `· đã nhận ${mail.claimedPacks}/${mail.packs}` : ""}
                  </span>
                </div>
                <div className="mailbox-letter-action">
                  <button
                    className={received ? "" : "primary"}
                    disabled={!ready || received || space <= 0}
                    onClick={() => onClaim(mail.id)}
                  >
                    {received ? "Đã nhận" : `Nhận ${Math.min(space, remaining)} pack`}
                  </button>
                  {!received && missing > 0 && (
                    <small>
                      Phần còn lại tiếp tục được giữ.
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
