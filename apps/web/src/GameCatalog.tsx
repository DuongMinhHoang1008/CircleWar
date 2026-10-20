import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  character,
  ROSTER,
  CATALOG_ITEMS,
  BONDS,
  FRIEND_GROUPS,
  availableGroups,
  groupTier,
  TRAIT_TEXT,
  availableBonds,
  availableTraits,
  type CharacterId,
  type TeamChoice,
} from "../../../packages/shared/src/catalog";
import {
  computeStats,
  type Loadout,
} from "../../../packages/shared/src/balance";
import type { Fighter } from "../../../packages/battle-engine/src/types";
import weaponAtlas from "./rendering/weapon-atlas.json";
export type Inspect = {
  kind: "character" | "item";
  id: string;
  loadout?: Loadout;
  live?: Fighter;
  liveTick?: number;
  actions?: { label: string; run: () => void; disabled?: boolean }[];
};
export const avatar = (id: string) =>
  `${import.meta.env.BASE_URL}avatars/${id}.png`;
const rarityLabel = (tier: string) => ({ T1: "Thường", T2: "Hiếm", T3: "Sử thi", T4: "Huyền thoại", GOD: "GOD" }[tier] || tier);
const rarityClass = (tier: string | number) => {
  const index = typeof tier === "number" ? tier + 1 : Number(String(tier).replace(/^T/, ""));
  return index >= 5 || tier === "GOD" ? "tier-god" : `tier-t${Math.max(1, Math.min(4, index || 1))}`;
};
const concise = (text: string, max = 96) => {
  const clean = humanText(text);
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max).replace(/\s+\S*$/, "");
  return `${cut}…`;
};
export const weaponAtlasUrl = () =>
  `${import.meta.env.BASE_URL}weapons/weapon-atlas-v2.png`;
export const weaponArtUrl = (id: string) =>
  Number(id.slice(-2)) >= 21
    ? `${import.meta.env.BASE_URL}weapons/${id}.svg`
    : weaponAtlasUrl();
export const weaponFrame = (id: string) =>
  weaponAtlas.frames[(Number(id.slice(-2)) - 1) % weaponAtlas.frames.length];
export function WeaponArt({ id }: { id: string }) {
  const frame = weaponFrame(id);
  const custom = Number(id.slice(-2)) >= 21;
  return (
    <svg
      className="weapon-art"
      role="img"
      aria-label={"Vũ khí " + (character(id)?.weaponName || id)}
      viewBox={custom ? "0 0 256 256" : frame.join(" ")}
      preserveAspectRatio="xMidYMid meet"
      overflow="hidden"
    >
      <image
        href={weaponArtUrl(id)}
        width={custom ? 256 : weaponAtlas.width}
        height={custom ? 256 : weaponAtlas.height}
      />
    </svg>
  );
}
const itemArt: Record<string, ReactNode> = {
  item_01: (
    <>
      <circle cx="24" cy="24" r="15" />
      <path d="M24 14v10l7 4M20 4h8M24 4v5" />
      <path d="M8 38h32" />
    </>
  ),
  item_02: (
    <>
      <rect x="6" y="11" width="36" height="25" rx="4" />
      <circle cx="19" cy="23" r="7" />
      <circle cx="19" cy="23" r="3" />
      <path d="M19 16v3m0 8v3m-7-7h3m8 0h3M27 17h9v12h-9M10 36v4m6-4v4m6-4v4m13-9h8" />
    </>
  ),
  item_03: (
    <>
      <path d="M9 31 24 8l15 23-4 7H13z" />
      <path d="M15 29h18l3 8H12z" />
      <circle cx="19" cy="20" r="1" />
      <circle cx="28" cy="17" r="1" />
    </>
  ),
  item_04: (
    <>
      <path d="M8 29c2-8 7-17 15-17s13 9 15 17c0 7-7 11-15 11S8 36 8 29z" />
      <path d="m15 22 2 4m7-8 1 5m7 1-2 4M12 32h24" />
    </>
  ),
  item_05: (
    <>
      <rect x="7" y="13" width="34" height="24" rx="4" />
      <path d="M8 21h32M23 21v15M31 22v7m-17-7v8" />
      <path d="M12 13v-4h24v4" />
    </>
  ),
  item_06: (
    <>
      <path d="m10 34 7-1 17-20 4 4-20 17-1 7-7-7z" />
      <path d="m29 13 5-5 7 7-5 5M10 34l-4 8 8-4m5-12 4 4m-1-10 4 4m-1-10 4 4" />
    </>
  ),
  item_07: (
    <>
      <path d="m18 24 8 16 9-16z" />
      <path d="M13 19a8 8 0 0 1 15-4 7 7 0 0 1 12 5 7 7 0 0 1-6 7H19a7 7 0 0 1-6-8z" />
      <path d="m22 31 9 1" />
    </>
  ),
  item_08: (
    <>
      <path d="M13 17q0-5 5-5h12q5 0 5 5v15q0 4-5 4H18q-5 0-5-4z" />
      <path d="M24 12V6m-4 0h8M18 22h1m10 0h1m-10 7q4 4 8 0M13 23H8v7h5m22-7h5v7h-5M21 17h6" />
    </>
  ),
  item_09: (
    <>
      <rect x="7" y="9" width="34" height="23" rx="3" />
      <path d="M18 40h12m-6-8v8M12 14h24v13H12z" />
      <path d="m17 22 4-4 4 5 3-3 4 4" />
    </>
  ),
  item_10: (
    <>
      <path d="M14 18h19l-2 18H16zM33 21h5a5 5 0 0 1 0 10h-6" />
      <path d="M19 13c-3-3 3-4 0-8m8 8c-3-3 3-4 0-8M18 25h11" />
    </>
  ),
  item_11: (
    <>
      <rect x="10" y="5" width="28" height="38" rx="2" />
      <path d="M13 9h22v7H13zM16 20q3-4 6 0l-2 4 4 5-4 1-2 9m8-19q3-4 6 0l-2 4 3 5-4 1-1 9M13 36q4-3 8 0m5 0q5-3 9 0" />
      <circle cx="31" cy="12" r="2" />
    </>
  ),
  item_12: (
    <>
      <path d="M8 24h32l-4 14H12z" />
      <path d="M12 23q12-17 24 0M17 16l2 3m6-7v4m7 0-2 4" />
      <path d="M14 31h20" />
    </>
  ),
  item_13: (
    <>
      <path d="M10 24h28v13H10zM7 21h34v5H7zM13 17h22v4H13z" />
      <path d="M23 17v-7m0 0q-5-4 0-7 5 3 0 7M15 30h18m-16 4h14" />
    </>
  ),
  item_14: (
    <>
      <path d="M32 10c-7 0-12 3-17 10-7 10-2 19 7 17 9-2 11-12 10-20l6-8z" />
      <path d="M30 12q-3 6-1 12M18 29l4 2m3-7 4 2" />
    </>
  ),
  item_15: (
    <>
      <path d="M24 38V20m0 10C9 31 7 19 9 13c10 0 16 5 15 17zm0-5c0-11 8-17 16-17 2 9-3 17-16 19" />
      <path d="M14 39h20" />
    </>
  ),
  item_16: (
    <>
      <path d="M9 26q1-11 13-12 8-8 17-2l-5 8q6 6 1 13-7 8-20 3z" />
      <path d="m15 24 7 4-7 4m15-12 3 4-3 4M12 18l-4-5" />
    </>
  ),
  item_17: (
    <>
      <path d="M8 24h32l-4 13H12z" />
      <path d="M12 23q12-13 24 0M15 27h18M18 31h12" />
      <path d="m17 17 3-5m8 5 3-5" />
    </>
  ),
  item_18: (
    <>
      <path d="M17 27q-5-4-5-10a12 12 0 0 1 24 0q0 6-5 10l-2 5h-10z" />
      <path d="M19 36h10m-8 4h6m-3-27-4 8h5l-3 6M24 3V0m-12 8-4-3m28 3 4-3" />
    </>
  ),
  item_19: (
    <>
      <path d="M19 6h10v6l5 5v19q0 4-4 4H18q-4 0-4-4V17l5-5z" />
      <path d="M19 12h10m-15 11h20M20 29h8m-7 5h6" />
      <path d="M21 27h7v5h-7zM23 29h3" />
    </>
  ),
  item_20: (
    <>
      <path d="M8 8h28v28H8zM17 8v28m10-28v28M8 17h28M8 27h28" />
      <path d="M34 12c-5 0-7 5-4 8l-4 9 7-4 4 5 2-10c5-3 2-7-5-8z" />
      <path d="m34 12 3-4m-7 7-4-2" />
    </>
  ),
  item_21: (
    <>
      <path d="M12 7h25l-2 5-3 1v22l4 4H12l4-4V13l-4-1z" />
      <path d="M17 14h15v17H17zM24 21h1m-1-12 13 11-13 10" />
      <circle cx="29" cy="23" r="2" />
    </>
  ),
  item_22: (
    <>
      <path d="M24 25C17 9 7 8 7 13c0 5 8 7 11 12-7-2-10 0-8 4 2 4 10 3 14 10z" />
      <path d="M24 25c7-16 17-17 17-12 0 5-8 7-11 12 7-2 10 0 8 4-2 4-10 3-14 10z" />
      <path d="m24 4 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" />
    </>
  ),
  item_23: (
    <>
      <path d="m7 16 10 6 7-13 7 13 10-6-4 20H11z" />
      <path d="M11 31h26M17 36h14" />
      <circle cx="24" cy="23" r="3" />
    </>
  ),
  item_24: (
    <>
      <path d="M8 27q1-13 12-14 9-8 17 0l-5 8q5 6 0 12-8 8-21 3z" />
      <path d="m14 25 8 4-8 5m17-13 3 4-3 4M6 11l4 5m28 13 5 4" />
    </>
  ),
  item_25: (
    <>
      <path d="M7 17q0-4 4-4h26q4 0 4 4l-2 21H9z" />
      <path d="M17 13V8q0-4 4-4h6q4 0 4 4v5M8 20h32M20 24h8v6h-8z" />
      <path d="M13 24h4m14 0h4M24 24v6" />
    </>
  ),
};
const itemPhotoIds = new Set([
  ...Array.from({ length: 17 }, (_, index) => `item_${String(index + 1).padStart(2, "0")}`),
  "item_19",
  "item_20",
  "item_21",
  "item_22",
  "item_23",
  "item_24",
  "item_25",
]);
export function ItemSprite({
  id,
  className = "",
}: {
  id: string;
  className?: string;
}) {
  const label = CATALOG_ITEMS.find((i) => i.id === id)?.name || id;
  if (itemPhotoIds.has(id))
    return (
      <img
        className={`item-sprite item-photo ${className}`}
        src={`${import.meta.env.BASE_URL}items/${id}.png`}
        alt={label}
      />
    );
  return (
    <svg
      className={"item-sprite " + className}
      viewBox="0 0 48 48"
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id="item-gold" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff1b7" />
          <stop offset="1" stopColor="#d59a45" />
        </linearGradient>
      </defs>
      <path
        d="M24 2 43 13v22L24 46 5 35V13z"
        fill="#211b20"
        stroke="#84633f"
        strokeWidth="1.5"
      />
      <g
        fill="none"
        stroke="url(#item-gold)"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {itemArt[id] || (
          <>
            <path d="M10 24h28M24 10v28" />
            <circle cx="24" cy="24" r="12" />
          </>
        )}
      </g>
      {id === "item_20" && (
        <path
          d="M36 8c-3 4-5 4-8 5"
          fill="none"
          stroke="#ff7f9c"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
const humanText = (value: string) =>
  value
    .replace(/superPower/g, "sức mạnh Super")
    .replace(/\bcharge\b/g, "hiệu suất nạp Super")
    .replace(/\bspeed\b/g, "tốc độ")
    .replace(/\bmass\b/g, "khối lượng")
    .replace(/\bcooldown\b/g, "thời gian giữa đòn đánh");
export function Portrait({
  id,
  className = "",
}: {
  id: string;
  className?: string;
}) {
  return (
    <img
      className={"portrait " + className}
      src={avatar(id)}
      alt={character(id)?.name || id}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.style.opacity = "0.15";
      }}
    />
  );
}
const labels: Record<string, string> = {
  hp: "Máu tối đa",
  attack: "ATK",
  defense: "Giáp",
  speed: "Tốc độ",
  crit: "Chí mạng (%)",
  cooldown: "Nhịp đánh (tick)",
  charge: "Nạp Super",
  superPower: "Sức mạnh Super",
  mass: "Khối lượng",
  reach: "Tầm vũ khí (×100)",
  rotation: "Tốc độ xoay",
  critPower: "Sát thương chí mạng (%)",
  shield: "Khiên ban đầu",
  thorns: "Phản đòn",
  burn: "Đốt",
  bounce: "Độ nảy",
  stability: "Kháng đẩy",
};
export function InfoPopup({
  info,
  close,
  inspect,
}: {
  info: Inspect | null;
  close: () => void;
  inspect: (i: Inspect) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (info) {
      if (!ref.current?.open) ref.current?.showModal();
      body.current?.scrollTo(0, 0);
    } else ref.current?.close();
  }, [info]);
  const c = info?.kind === "character" ? character(info.id) : undefined,
    it =
      info?.kind === "item"
        ? CATALOG_ITEMS.find((i) => i.id === info.id)
        : undefined;
  const stats = c
    ? info?.live?.stats ||
      computeStats(
        info?.loadout || {
          characterId: c.id as CharacterId,
          classId: c.base as Loadout["classId"],
          level: 0,
          equipment: [],
        },
      )
    : null;
  return (
    <dialog
      ref={ref}
      className="info-dialog"
      aria-labelledby="info-title"
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            close();
        }
      }}
    >
      <div className="dialog-head">
        <span>HỒ SƠ ĐẤU TRƯỜNG</span>
        <button onClick={close} aria-label="Đóng thông tin">
          ✕
        </button>
      </div>
      <div className="dialog-body" ref={body} key={info?.id}>
        {c && (
          <>
            <div className="profile-hero">
              <div className="profile-art">
                <Portrait id={c.id} />
                <WeaponArt id={c.id} />
              </div>
              <div>
                <span className="eyebrow">NHÂN VẬT #{c.id.slice(-2)}</span>
                <h2 id="info-title">{c.name}</h2>
                <div className="badges">
                  <span>{c.roleClass}</span>
                  <span>{c.race}</span>
                  <span className={`rarity-label ${rarityClass(c.tier)}`}>{rarityLabel(c.tier)}</span>
                </div>
                <blockquote>“{c.quote}”</blockquote>
                <p>{c.role}</p>
                {info?.live && (
                  <p className="live-stats">
                    Trong trận: {info.live.hp}/{info.live.stats.hp} HP ·{" "}
                    {info.live.shield} khiên · {info.live.energy}/100 năng lượng
                    · Super đã dùng {info.live.supers}
                  </p>
                )}
              </div>
            </div>
            {info?.live && (
              <div className="bond-info">
                <b>
                  Trạng thái tại giây {((info.liveTick || 0) / 30).toFixed(1)}
                </b>
                <p>
                  Chiêu tự động:{" "}
                  {Math.max(
                    0,
                    (info.live.skillReady - (info.liveTick || 0)) / 30,
                  ).toFixed(1)}{" "}
                  giây còn lại · Super: {info.live.energy}/100 năng lượng.
                </p>
                <div className="badges">
                  {info.live.buffs
                    .filter((b) => b.until > (info.liveTick || 0))
                    .map((b, i) => (
                      <span key={i}>
                        {(
                          {
                            attack: "Tăng công",
                            speed: "Tăng tốc",
                            deliverySpeed: "Lao nhanh",
                            armor: "Tăng giáp",
                            haste: "Đánh nhanh",
                            slow: "Làm chậm",
                            dot: "Vị chua",
                            soupDot: "Nước nóng",
                            bonus: "Đòn liên kết",
                            envelope: "Phong bao",
                            electric: "Sét chờ đánh",
                          } as Record<string, string>
                        )[b.kind] || "Hiệu ứng"}{" "}
                        · {((b.until - (info.liveTick || 0)) / 30).toFixed(1)}s
                      </span>
                    ))}
                </div>
                <small>
                  Ảnh chụp trạng thái lúc bấm. Trận vẫn tiếp tục phía sau.
                </small>
              </div>
            )}
            <h3>
              Chỉ số{" "}
              {info?.live
                ? "tại thời điểm xem"
                : info?.loadout
                  ? `level ${info.loadout.level} · bậc vũ khí ${info.loadout.weaponRank || 1}`
                  : "cấp 1 · chưa trang bị"}
            </h3>
            <div className="profile-stats">
              {Object.entries(stats!)
                .filter(([k]) =>
                  ["hp", "attack", "defense", "speed"].includes(k),
                )
                .map(([k, v]) => (
                  <div key={k}>
                    <small>{labels[k] || k}</small>
                    <b>{v}</b>
                  </div>
                ))}
            </div>
            <details className="all-stats">
              <summary>Toàn bộ chỉ số chiến đấu</summary>
              <div className="profile-stats">
                {Object.entries(stats!)
                  .filter(
                    ([k]) => !["hp", "attack", "defense", "speed"].includes(k),
                  )
                  .map(([k, v]) => (
                    <div key={k}>
                      <small>{labels[k] || k}</small>
                      <b>{v}</b>
                    </div>
                  ))}
              </div>
            </details>
            <div className="skill-list">
              {[
                ["⚔", c.weaponName, c.weapon],
                ["✦", `Nội tại · ${c.passive[0]}`, c.passive[1]],
                ["◷", `Kỹ năng · ${c.skill[0]}`, c.skill[1]],
                ["★", `Super · ${c.super[0]}`, c.super[1]],
              ].map(([icon, name, text]) => (
                <section className="skill-info" key={name}>
                  <span className="skill-icon">{icon}</span>
                  <div>
                    <h3>{name}</h3>
                    <p>{concise(text, 105)}</p>
                    {text.length > 105 && <details><summary>Chi tiết</summary><p>{text}</p></details>}
                  </div>
                </section>
              ))}
            </div>
            <h3>Đặc tính class / race</h3>
            <p>{concise(TRAIT_TEXT[c.roleClass] || "Class này hiện chưa có đủ hai nhân vật khác nhau để mở mốc class.")}</p>
            <p>{concise(TRAIT_TEXT[c.race])}</p>
            <h3>Vũ khí & nâng cấp</h3>
            <div className="weapon-detail">
              <WeaponArt id={c.id} />
              <div>
                <b>{c.weaponName}</b>
                <p>{concise(c.weapon)}</p>
              </div>
            </div>
            <p>
              {c.weaponCategory} · {c.weaponTier} · Tier biểu thị độ phức tạp.
            </p>
            <p>
              Bậc I: mặc định. Bậc II: level ≥3, 8G, +2 ATK. Bậc III: level ≥6,
              thêm 12G, tổng +4 ATK và +10 sức mạnh Super.
            </p>
            <p>
              <b>Mốc level 5:</b> {concise(c.upgrade)}
            </p>
            <p>
              <b>Cách đối phó:</b> {concise(c.weakness)}
            </p>
            <p>
              <b>Hiệu ứng:</b> {concise(c.vfx)}
            </p>
            <h3>Món hợp cạ</h3>
            {!CATALOG_ITEMS.some((i) => i.affinity === c.id) && (
              <p>
                Không có bonus vật phẩm chữ ký riêng; dùng được hiệu ứng gốc của
                cả vật phẩm trong catalog.
              </p>
            )}
            {CATALOG_ITEMS.filter((i) => i.affinity === c.id).map((i) => (
              <button
                className="affinity-card"
                key={i.id}
                onClick={() =>
                  inspect({ kind: "item", id: i.id, loadout: info?.loadout })
                }
              >
                <ItemSprite id={i.id} />
                <div>
                  <b>
                    {i.name} · {i.affinityName}
                  </b>
                  <p>{concise(i.affinityDescription)}</p>
                </div>
                <span>↗</span>
              </button>
            ))}
            {info?.loadout && (
              <>
                <h3>Trang bị đang mang</h3>
                <div className="badges">
                  {info.loadout.equipment.length ? (
                    info.loadout.equipment.map((id, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          inspect({ kind: "item", id, loadout: info.loadout })
                        }
                      >
                        <ItemSprite id={id} />{" "}
                        {CATALOG_ITEMS.find((it) => it.id === id)?.name || id}
                      </button>
                    ))
                  ) : (
                    <p>Chưa có trang bị.</p>
                  )}
                </div>
              </>
            )}
            <h3>Liên kết đôi / bộ ba</h3>
            {BONDS.filter((b) => b.members.includes(c.id)).map((b) => (
              <section className="bond-info" key={b.id}>
                <b>
                  {b.name} · {b.size === 2 ? "Đôi" : "Bộ ba"}
                </b>
                <div className="bond-members">
                  {b.members.map((id) => (
                    <button
                      key={id}
                      onClick={() => inspect({ kind: "character", id })}
                    >
                      <Portrait id={id} />
                      <span>{character(id)?.name}</span>
                    </button>
                  ))}
                </div>
                <p>{concise(b.description)}</p>
                <details><summary>Điều kiện</summary><p>{b.description}</p><small>{b.size === 2 ? "3 lượt/vòng · hồi 8 giây · tầm 240" : "2 lượt/vòng · hồi 12 giây · tầm 280"}. Thành viên cần còn sống.</small></details>
              </section>
            ))}
            <h3>Hội bạn</h3>
            <p>Hội đủ điều kiện tự cộng dồn theo thành viên khác nhau còn sống.</p>
            {FRIEND_GROUPS.filter((g) => g.members.includes(c.id)).map((g) => (
              <section className="bond-info" key={g.id}>
                <b>{g.name}</b>
                {g.requiredAny && (
                  <p>
                    Hạt nhân: ít nhất một{" "}
                    {g.requiredAny
                      .map((id) => character(id)?.name)
                      .join(" hoặc ")}{" "}
                    còn sống.
                  </p>
                )}
                {g.required && (
                  <p>
                    Hạt nhân bắt buộc:{" "}
                    {g.required.map((id) => character(id)?.name).join(", ")}{" "}
                    (còn sống).
                  </p>
                )}
                <p>
                    <strong>2 người:</strong> {concise(g.two, 92)}
                </p>
                <p>
                  <strong>3 người:</strong> {concise(g.three, 92)}
                </p>
                <small>{concise(g.limit, 90)}</small>
                <div className="friend-members">
                  {g.members.map((id) => (
                    <button
                      key={id}
                      onClick={() => inspect({ kind: "character", id })}
                    >
                      <Portrait id={id} />
                      {character(id)?.name}
                    </button>
                  ))}
                </div>
              </section>
            ))}
            <p className="info-note">
              Sức mạnh Super nhân sát thương, hồi máu và khiên của Super; với
              chiêu xuyên giáp/xuyên đạn, tăng hiệu quả phần xuyên. Không kéo
              dài thời gian hoặc tăng số lượt chiêu. Các con số mô tả là mức gốc
              trước trang bị và tăng nhịp. Kỹ năng tự động, Super dùng ở 100
              năng lượng. Mỗi 10 giây tăng nhịp; hết round reset phần tăng thời
              gian. Bonus ATK/tốc độ từ các hội, đặc tính và liên kết khác nhau
              cộng số phần trăm; buff cá nhân/trang bị cùng loại giữ mức cao
              nhất. Khiên hiệu ứng tối đa 100; năng lượng từ nhiều nguồn cộng
              dồn trong tick, tối đa 100. Chỉ số nền của thẻ dùng rarity hiện tại, nên thẻ cùng rarity có cùng mức chỉ số dù là base hay đã tiến hóa.
            </p>
          </>
        )}
        {it && (
          <>
            <div className="item-profile">
              <div className="item-glyph">
                <ItemSprite id={it.id} />
              </div>
              <span className="eyebrow">
                VẬT PHẨM ·{" "}
                {["THƯỜNG", "HIẾM", "SỬ THI", "HUYỀN THOẠI"][it.rarity]}
              </span>
              <h2 id="info-title">{it.name}</h2>
              <div className="badges">
                <span>Trang bị · giữ lại sau trận</span>
                <span>{it.price}G</span>
              </div>
              <blockquote>{it.quote}</blockquote>
            </div>
            <h3>{it.effectName}</h3>
            <p className="item-effect">{concise(it.description, 110)}</p>
            {humanText(it.description).length > 110 && <details><summary>Chi tiết hiệu ứng</summary><p>{humanText(it.description)}</p></details>}
            <div className="profile-stats">
              {Object.entries(it.modifiers).map(([key, value]) => (
                <div key={key}>
                  <small>{labels[key] || key}</small>
                  <b>
                    {Number(value) > 0 ? "+" : ""}
                    {value}
                  </b>
                </div>
              ))}
            </div>
            <h3>Đúng người, thêm hiệu ứng</h3>
            <button
              className={
                "affinity-card " +
                (info?.loadout?.characterId === it.affinity ? "matched" : "")
              }
              onClick={() => inspect({ kind: "character", id: it.affinity })}
            >
              <Portrait id={it.affinity} />
              <div>
                <b>
                  {character(it.affinity)?.name} · {it.affinityName}
                </b>
                <p>{humanText(it.affinityDescription)}</p>
              </div>
            </button>
            {info?.loadout && (
              <p>
                {info.loadout.characterId === it.affinity
                  ? "✓ Đang chọn đúng nhân vật hợp cạ."
                  : "Món này vẫn dùng được trên nhân vật đang chọn; bonus hợp cạ chỉ dành cho người ghi trên."}
              </p>
            )}
            <h3>Trang bị & cộng dồn</h3>
            <p>
              Một nhân vật chỉ gắn một vật phẩm. Vật phẩm vẫn nằm trong Kho đồ sau trận và có thể dùng lại ở các trận tiếp theo. Bản trùng khi mở pack cộng kinh nghiệm, không tạo số lượng bản dùng một lần.
            </p>
            <p>
              Chỉ số cộng thẳng tính trước tăng nhịp thời gian. Cooldown tối
              thiểu 8 tick; speed tối đa 900; chí mạng tối đa 65%; giáp tối đa
              60. HP thêm chỉ thuộc nhân vật, không hồi HP người chơi. Khiên có
              thời hạn và chịu trần 100.
            </p>
            <p>
              Các hiệu ứng thấp máu chỉ kích hoạt khi còn sống sau hit, không
              cứu một đòn chết người. Hồi phục không vượt máu tối đa. Sát thương
              phụ không tự kích hoạt chuỗi vật phẩm/liên kết. Bộ đếm hiệu ứng
              trong trận được đặt lại mỗi round; vật phẩm vẫn thuộc Kho đồ.
            </p>
          </>
        )}
        {!c && !it && info && (
          <>
            <h2 id="info-title">Trang bị từ phiên bản trước</h2>
            <p>
              {info.id}. Hãy mở phòng mới để dùng catalog vật phẩm hiện hành.
            </p>
          </>
        )}
      </div>
      <div className="dialog-actions">
        {info?.actions?.map((a, i) => (
          <button
            className="primary"
            key={i}
            disabled={a.disabled}
            onClick={() => {
              a.run();
              close();
            }}
          >
            {a.label}
          </button>
        ))}
        <button onClick={close}>Đóng</button>
      </div>
    </dialog>
  );
}
export function TeamChoices({
  loadouts,
  choice,
  onChange,
  disabled = false,
  inspect,
}: {
  loadouts: Loadout[];
  choice: TeamChoice;
  onChange: (choice: TeamChoice) => void;
  disabled?: boolean;
  inspect: (i: Inspect) => void;
}) {
  const traits = availableTraits(loadouts, choice),
    bonds = availableBonds(loadouts),
    groups = availableGroups(loadouts);
  return (
    <section className="team-choices">
      <h3>Phối hợp đội hình</h3>
      <p className="muted">Đặc tính, hội và liên kết đủ điều kiện sẽ tự kích hoạt.</p>
      <details><summary>Quy tắc cộng dồn</summary><p>Nhân vật cần sống và đúng thành phần, trong tầm. Bản sao tính một đại diện. Bonus ATK/tốc độ từ nguồn khác nhau cộng phần trăm; hiệu ứng cùng loại không nhân chồng.</p></details>
      <h4>Đặc tính đang đủ điều kiện · {traits.length}</h4>
      {traits.map((t) => (
        <p key={t} data-active-trait={t}>
          <b>{t}</b>: {concise(TRAIT_TEXT[t])}
        </p>
      ))}
      <h4>Liên kết đang đủ điều kiện · {bonds.length}</h4>
      {bonds.map((b) => (
        <div className="bond-info" key={b.id} data-active-bond={b.id}>
          <b>{b.name}</b>
          <p>{concise(b.description)}</p>
          <small>{b.size === 2 ? "3 lượt · hồi 8s · tầm 240" : "2 lượt · hồi 12s · tầm 280"}</small>
        </div>
      ))}
      <h4>Hội đang đủ điều kiện · {groups.length}</h4>
      {groups.map((g) => (
        <div className="bond-info" key={g.id} data-active-group={g.id}>
          <b>
            {g.name} · mốc{" "}
            {groupTier(
              g,
              loadouts.map((l) => l.characterId),
            )}
          </b>
          {g.id === "G11" && (
            <p>
              Đang có:{" "}
              {groupTier(
                g,
                loadouts.map((l) => l.characterId),
              ) === 3
                ? "Full Combo — đủ Hộp Quà + Ạt tít + Cốt đơ"
                : "Ghép đôi — chưa đủ hai nhánh Ạt tít và Cốt đơ"}
              .
            </p>
          )}
          {g.requiredAny && (
            <p>
              Hạt nhân: ít nhất một{" "}
              {g.requiredAny.map((id) => character(id)?.name).join(" hoặc ")}{" "}
              còn sống.
            </p>
          )}
          {g.required && (
            <p>
              Hạt nhân bắt buộc:{" "}
              {g.required.map((id) => character(id)?.name).join(", ")} (còn
              sống).
            </p>
          )}
          <p>{concise(g.two, 88)}</p>
          <details><summary>Mốc 3 và giới hạn</summary><p>{g.three}</p><small>{g.limit}</small></details>
        </div>
      ))}
      <details>
        <summary>Các hội bạn · xem điều kiện</summary>
        {FRIEND_GROUPS.map((g) => (
          <div className="bond-preview" key={g.id}>
            <b>{g.name}</b>
            {g.requiredAny && (
              <p>
                Hạt nhân: ít nhất một{" "}
                {g.requiredAny.map((id) => character(id)?.name).join(" hoặc ")}{" "}
                còn sống.
              </p>
            )}
            {g.required && (
              <p>
                Hạt nhân bắt buộc:{" "}
                {g.required.map((id) => character(id)?.name).join(", ")} (còn
                sống).
              </p>
            )}
            <p>Mốc 2: {concise(g.two, 100)}</p>
            <details><summary>Mốc 3 và giới hạn</summary><p>{g.three}</p><small>{g.limit}</small></details>
            <small>{g.limit}</small>
            <div className="friend-members">
              {g.members.map((id) => (
                <button
                  key={id}
                  onClick={() => inspect({ kind: "character", id })}
                >
                  <Portrait id={id} />
                  {loadouts.some((l) => l.characterId === id) ? "✓ " : ""}
                  {character(id)?.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </details>
      {loadouts.length === 1 && (
        <p>
          Thêm người thứ hai để mở liên kết. Món hợp cạ vẫn có tác dụng khi
          solo.
        </p>
      )}
      <details>
        <summary>Tìm đồng đội còn thiếu</summary>
        {BONDS.map((b) => (
          <div className="bond-preview" key={b.id}>
            <b>{b.name}</b>
            <div>
              {b.members.map((id) => (
                <button
                  key={id}
                  onClick={() => inspect({ kind: "character", id })}
                >
                  {loadouts.some((l) => l.characterId === id) ? "✓" : "＋"}{" "}
                  {character(id)?.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </details>
    </section>
  );
}
export function CatalogLibrary({
  inspect,
  choose,
  equip,
  selected,
  initialOpen = false,
}: {
  inspect: (i: Inspect) => void;
  choose?: (id: CharacterId) => void;
  equip?: (id: string) => void;
  selected?: Loadout;
  initialOpen?: boolean;
}) {
  const [tab, setTab] = useState<"characters" | "items">("characters"),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("Tất cả"),
    [open, setOpen] = useState(initialOpen);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        !document.querySelector(".info-dialog[open]")
      )
        setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);
  return (
    <>
      {(!initialOpen || !open) && <button
        className="catalog-trigger"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        Cẩm nang · {ROSTER.length} nhân vật / {CATALOG_ITEMS.length} vật phẩm
      </button>}
      {open && (
        <div
          className="catalog-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            className="catalog-library"
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalog-title"
          >
            <div className="catalog-heading">
              <div>
                <h2 id="catalog-title">Cẩm nang đấu trường</h2>
                <span className="muted">
                  {ROSTER.length} NHÂN VẬT · {CATALOG_ITEMS.length} VẬT PHẨM
                </span>
              </div>
              <button aria-label="Đóng cẩm nang" onClick={() => setOpen(false)}>
                Đóng ✕
              </button>
            </div>
            <div className="catalog-toolbar">
              <button
                className={tab === "characters" ? "active" : ""}
                onClick={() => {
                  setTab("characters");
                  setFilter("Tất cả");
                }}
              >
                Nhân vật
              </button>
              <button
                className={tab === "items" ? "active" : ""}
                onClick={() => {
                  setTab("items");
                  setFilter("Tất cả");
                }}
              >
                Vật phẩm
              </button>
              <input
                aria-label="Tìm trong cẩm nang"
                placeholder="Tìm tên, kỹ năng…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                aria-label="Lọc cẩm nang"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {[
                  "Tất cả",
                  ...(tab === "characters"
                    ? [...new Set(ROSTER.map((c) => c.roleClass))]
                    : ["Thường", "Hiếm", "Sử thi", "Huyền thoại"]),
                ].map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
            <p className="muted">
              Bấm thẻ để xem đầy đủ kỹ năng, chỉ số, vũ khí, liên kết và đồ hợp
              cạ.
            </p>
            <div className="catalog-grid">
              {tab === "characters"
                ? ROSTER.filter(
                    (c) =>
                      (filter === "Tất cả" || c.roleClass === filter) &&
                      JSON.stringify(c)
                        .toLocaleLowerCase("vi")
                        .includes(search.toLocaleLowerCase("vi")),
                  ).map((c) => (
                    <button
                      className="roster-card"
                      key={c.id}
                      onClick={() =>
                        inspect({
                          kind: "character",
                          id: c.id,
                          actions: choose
                            ? [
                                {
                                  label: `Chọn vào slot đang xem`,
                                  run: () => {
                                    choose(c.id as CharacterId);
                                    setOpen(false);
                                  },
                                },
                              ]
                            : undefined,
                        })
                      }
                    >
                      <div className="roster-art">
                        <Portrait id={c.id} />
                        <WeaponArt id={c.id} />
                        <span className={`tier-badge ${rarityClass(c.tier)}`}>{rarityLabel(c.tier)}</span>
                      </div>
                      <div className="roster-caption">
                        <h3>{c.name}</h3>
                        <div className="badges">
                          <span>{c.roleClass}</span>
                          <span>{c.race}</span>
                        </div>
                        <p>{c.skill[0]}</p>
                        <small>★ {c.super[0]} ↗</small>
                      </div>
                    </button>
                  ))
                : CATALOG_ITEMS.filter(
                    (i) =>
                      (filter === "Tất cả" ||
                        ["Thường", "Hiếm", "Sử thi", "Huyền thoại"][i.rarity] === filter) &&
                      JSON.stringify(i)
                        .toLocaleLowerCase("vi")
                        .includes(search.toLocaleLowerCase("vi")),
                  ).map((i) => (
                    <button
                      className={`item-card rarity-${i.rarity} ${rarityClass(i.rarity)}`}
                      key={i.id}
                      onClick={() =>
                        inspect({
                          kind: "item",
                          id: i.id,
                          loadout: selected,
                          actions: equip
                            ? [
                                {
                                  label: "Trang bị thử cho slot đang chọn",
                                  run: () => equip(i.id),
                                },
                              ]
                            : undefined,
                        })
                      }
                    >
                      <ItemSprite id={i.id} className="item-icon" />
                      <span className="item-meta">
                        {["Thường", "Hiếm", "Sử thi", "Huyền thoại"][i.rarity]}{" "}
                        · {i.price}G
                      </span>
                      <h3>{i.name}</h3>
                      <p>{humanText(i.description)}</p>
                      <small>Hợp cạ: {character(i.affinity)?.name} ↗</small>
                    </button>
                  ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
