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
import { journeyObjective } from "../../../packages/shared/src/mastery-journey";
import { Portrait } from "./GameCatalog";
import { MasteryPreview } from "./MasteryPreview";
import type { CharacterId } from "../../../packages/shared/src/catalog";

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
    [filter, setFilter] = useState("all"),
    [preview,setPreview]=useState<CharacterId>();
  const entries = MASTERY.filter(
    (m) =>
      [
        character(m.id)?.name,
        m.title,
        ...masteriesFor(m.id).flatMap((s) => [s.name, s.role]),
      ]
        .join(" ")
        .toLocaleLowerCase("vi")
        .includes(search.trim().toLocaleLowerCase("vi")) &&
      (filter !== "owned" ||
        profile.cards.some((c) => c.characterId === m.id)) &&
      (filter !== "unlocked" || (exp.mastery[m.id] || 0) >= 3) &&
      (filter !== "learning" ||
        ((exp.mastery[m.id] || 0) > 0 && (exp.mastery[m.id] || 0) < 15)) &&
      (filter !== "completed" || (exp.mastery[m.id] || 0) >= 15),
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
        99 Bí kỹ · Mỗi nhân vật có ba lối chơi để lựa chọn ở mốc 3 / 8 / 15.
        Điều kiện luyện đổi theo từng chặng; trận thua vẫn được tính nếu đạt mục
        tiêu. Mỗi trận hoàn tất tăng tối đa một bước cho mỗi nhân vật.
      </p>
      <details className="mastery-rules">
        <summary>Biến thể combat & luật luyện</summary>
        <p>
          Bí kỹ có thể đổi đường đạn, hình đòn đánh, Super hoặc cách đệ di chuyển và tấn công.
          Chọn <b>So sánh cách đánh</b> để thử bộ gốc và ba nhánh trong cùng tình huống,
          kể cả khi chưa mở khóa. Xem mô tả từng nhánh để biết lợi ích và giới hạn.
        </p>
        <p>
          Chỉ tính trận hoàn tất trong Đi ải, thử thách ngày, viễn chinh và bài
          tập. Xem lại trận không cộng tiến độ. Mỗi nhân vật lắp một Bí kỹ; mỗi
          đội tối đa một Truyền thừa. Mốc sau mở lựa chọn mới, không tự thay Bí
          kỹ đang lắp. Tiến độ cũ được giữ.
        </p>
      </details>
      <div className="mastery-filter">
        <input
          aria-label="Tìm nhân vật trong hành trình"
          placeholder="Tìm nhân vật, Bí kỹ, vai trò…"
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
          <option value="learning">Đang luyện</option>
          <option value="completed">Đã hoàn tất</option>
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
              <p className="mastery-current-objective">
                <b>
                  {count >= 15
                    ? "Đã hoàn tất hành trình"
                    : "Mục tiêu đang luyện"}
                </b>
                {count < 15 && (
                  <span>{journeyObjective(m.id, count).text}</span>
                )}
              </p>
              <progress max={15} value={Math.min(count, 15)} />
              <span className="mastery-count">
                {Math.min(count, 15)}/15 trận đạt điều kiện
              </span>
              <div className="mastery-branches" aria-label="Ba nhánh Bí kỹ">
                {masteriesFor(m.id).map((skill, index) => {
                  const unlocked = count >= skill.goal;
                  const equipped = exp.masteries?.[m.id]?.id === skill.id;
                  return (
                    <details
                      className={`mastery-unlock-detail${equipped ? " is-equipped" : ""}`}
                      key={skill.id}
                    >
                      <summary>
                        <div>
                          <b>
                            {unlocked ? "✓" : "○"} {skill.name}
                          </b>
                          <small className="mastery-role">{skill.role}</small>
                        </div>
                        <span>
                          {equipped
                            ? "Đang lắp"
                            : unlocked
                              ? "Đã mở"
                              : `Mốc ${skill.goal}`}
                        </span>
                      </summary>
                      <p>{skill.description}</p>
                      <small>Giới hạn: {skill.tradeoff}</small>
                      <p className="mastery-stage-objective">
                        <b>Điều kiện chặng {["0–3", "3–8", "8–15"][index]}:</b>{" "}
                        {m.objectives[index].text}
                      </p>
                    </details>
                  );
                })}
              </div>
              <button aria-label={`So sánh Bí kỹ của ${character(m.id)?.name}`} onClick={()=>setPreview(m.id as CharacterId)}>So sánh cách đánh ↗</button>
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
      {preview&&<MasteryPreview characterId={preview} initialMasteryId={exp.masteries?.[preview]?.id} onClose={()=>setPreview(undefined)} />}
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
