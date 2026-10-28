import { useState } from "react";
import { MASTERY } from "../../../packages/shared/src/adventure";
import { character } from "../../../packages/shared/src/catalog";
import {
  experienceOf,
  type CollectionProfile,
} from "../../../packages/shared/src/experience";
import {
  masteryInfo,
  masteriesFor,
} from "../../../packages/shared/src/mastery";
import { Portrait } from "./GameCatalog";

export function MasteryJourney({
  profile,
  onInventory,
  onTitle,
}: {
  profile: CollectionProfile;
  onInventory: () => void;
  onTitle: (title: string) => void;
}) {
  const exp = experienceOf(profile),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all");
  const entries = MASTERY.filter(
    (m) =>
      character(m.id)
        ?.name.toLocaleLowerCase("vi")
        .includes(search.trim().toLocaleLowerCase("vi")) &&
      (filter !== "owned" ||
        profile.cards.some((c) => c.characterId === m.id)) &&
      (filter !== "unlocked" || (exp.mastery[m.id] || 0) >= 3),
  );
  return (
    <>
      <div className="section-heading">
        <h2>Hành trình · {MASTERY.length} nhân vật</h2>
        <span>
          {MASTERY.filter((m) => (exp.mastery[m.id] || 0) >= 15).length} hoàn
          tất
        </span>
      </div>
      <p>
        Hoàn thành điều kiện ở mốc 3 / 8 / 15 trận để mở Bí kỹ. Chỉ trận hoàn
        tất trong Đi ải, thử thách ngày, viễn chinh và bài tập mới tính; xem lại
        trận không tăng tiến độ.
      </p>
      <div className="mastery-filter">
        <input
          aria-label="Tìm nhân vật trong hành trình"
          placeholder="Tìm nhân vật…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Lọc hành trình"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Tất cả nhân vật</option>
          <option value="owned">Đã sở hữu</option>
          <option value="unlocked">Đã mở Bí kỹ</option>
        </select>
      </div>
      <div className="mastery-journey-grid">
        {entries.map((m) => {
          const count = exp.mastery[m.id] || 0;
          return (
            <article className="mastery-journey-card" key={m.id}>
              <div className="mastery-card-heading">
                <Portrait id={m.id} />
                <div>
                  <h3>{character(m.id)?.name}</h3>
                  <small>{m.title}</small>
                </div>
              </div>
              <p>{m.text}</p>
              <progress max={15} value={Math.min(count, 15)} />
              <span className="mastery-count">
                {Math.min(count, 15)}/15 trận đạt điều kiện
              </span>
              <details>
                <summary>
                  Bí kỹ ·{" "}
                  {masteriesFor(m.id).filter((s) => count >= s.goal).length}/3
                  đã mở
                </summary>
                {masteriesFor(m.id).map((skill) => (
                  <div className="mastery-unlock-detail" key={skill.id}>
                    <b>
                      {count >= skill.goal ? "✓" : "○"} {skill.name} ·{" "}
                      {skill.goal} trận
                    </b>
                    <p>{skill.description}</p>
                    <small>Đánh đổi: {skill.tradeoff}</small>
                  </div>
                ))}
              </details>
              {count >= 3 && (
                <button onClick={onInventory}>Lắp Bí kỹ trong Kho đồ →</button>
              )}
            </article>
          );
        })}
      </div>
      {!entries.length && (
        <p role="status">Chưa có nhân vật phù hợp với bộ lọc.</p>
      )}
      <label>
        Danh hiệu đang dùng
        <select
          value={exp.activeTitle}
          onChange={(e) => onTitle(e.target.value)}
        >
          <option value="">Chưa chọn</option>
          {exp.titles.map((title) => (
            <option key={title}>{title}</option>
          ))}
        </select>
      </label>
    </>
  );
}
export function MasteryNotification({
  profile,
  onDismiss,
  onView,
}: {
  profile: CollectionProfile;
  onDismiss: (id: string) => void;
  onView: () => void;
}) {
  const queue = experienceOf(profile).masteryNotices || [],
    skill = masteryInfo(queue[0]);
  if (!skill) return null;
  return (
    <aside
      className="mastery-notification"
      role="status"
      aria-live="polite"
      aria-label="Mở khóa hành trình nhân vật"
    >
      <Portrait
        id={skill.characterId as Parameters<typeof Portrait>[0]["id"]}
      />
      <div>
        <small>ĐÃ MỞ BÍ KỸ · MỐC {skill.goal} TRẬN</small>
        <b>
          {character(skill.characterId)?.name} · {skill.name}
        </b>
        <p>{skill.summary}</p>
        <button
          onClick={() => {
            onDismiss(skill.id);
            onView();
          }}
        >
          Xem hành trình →
        </button>
        {queue.length > 1 && <span> Còn {queue.length - 1} mốc mới</span>}
      </div>
      <button
        className="mastery-notification-close"
        aria-label="Đóng thông báo Bí kỹ"
        onClick={() => onDismiss(skill.id)}
      >
        ×
      </button>
    </aside>
  );
}
