import { useEffect, useRef, useState } from "react";
import {
  computeStats,
  itemEffectDescription,
  type Loadout,
} from "../../../packages/shared/src/balance";
import {
  character,
  itemInfo,
  isTransformedCharacter,
  type CharacterId,
} from "../../../packages/shared/src/catalog";
import { characterKit } from "../../../packages/shared/src/character-kits";
import {
  masteriesFor,
  masteryInfo,
  masteryUnlocked,
  validateMasteryTeam,
} from "../../../packages/shared/src/mastery";
import {
  experienceOf,
  type CollectionProfile,
} from "../../../packages/shared/src/experience";
import { Portrait, ItemSprite } from "./GameCatalog";
import {
  cardEffectiveEvolution,
  xpForNextLevel,
} from "../../../packages/shared/src/progression";
import "./loadoutConfig.css";

export const shortCharacterText = (id?: string) =>
  ({
    char_01: "Tự chống chịu, tích lực phản công.",
    char_11: "Cắm cờ, tạo khiên và cổ vũ đồng đội.",
    char_13: "Ném hoa quả, hồi máu và tiếp tế.",
    char_14: "Triệu hồi đệ, tạo áp lực và chắn đạn.",
    char_20: "Trồng hoa, hỗ trợ và kiểm soát khu vực.",
    char_22: "Tỏa hào quang, tăng sức mạnh đồng đội.",
  })[id || ""] ||
  (
    characterKit(id as CharacterId, [])?.normal || "Nhân vật chiến đấu tự động."
  ).split(";")[0];
export function statsBreakdown(unit: Loadout) {
  const base = computeStats({ ...unit, equipment: [], equipmentLevels: {} }),
    total = computeStats(unit);
  return {
    base,
    total,
    attackFromItems: total.attack - base.attack,
    hpFromItems: total.hp - base.hp,
  };
}
export function LoadoutCard({
  unit,
  onClick,
  inTeam = false,
  compact = false,
  showEquipment = inTeam,
  xp,
}: {
  unit: Loadout;
  onClick: () => void;
  inTeam?: boolean;
  compact?: boolean;
  showEquipment?: boolean;
  xp?: number;
}) {
  const c = character(unit.characterId),
    skill = masteryInfo(unit.masteryId);
  if (!c) return null;
  if (compact) {
    const transformed = isTransformedCharacter(c.id, unit.equipment),
      tier = cardEffectiveEvolution(c.tier, unit.level, transformed).tier,
      rarity =
        (
          {
            T1: "Thường",
            T2: "Hiếm",
            T3: "Sử thi",
            T4: "Huyền thoại",
            GOD: "GOD",
            RAC: "Rác",
          } as Record<string, string>
        )[tier] || tier;
    return (
      <button
        type="button"
        className={`loadout-card compact-card tier-${tier.toLowerCase()}${inTeam ? " in-team" : ""}`}
        aria-label={`Cấu hình ${c.name}`}
        onClick={onClick}
      >
        <span className="compact-card-meta">
          <span className="card-level">Lv.{unit.level}</span>
          <span className="rarity-label">{rarity}</span>
        </span>
        <Portrait id={c.id as CharacterId} transformed={transformed} />
        <b className="loadout-name">
          {characterKit(c.id as CharacterId, unit.equipment)?.name || c.name}
        </b>
        <span className="compact-card-role">{c.roleClass}</span>
        {unit.startingHpPercent !== undefined &&
          unit.startingHpPercent < 100 && (
            <span className="compact-card-role">
              HP vào trận: {unit.startingHpPercent}%
            </span>
          )}
        {inTeam && <span className="in-team-label">Trong đội</span>}
        {xp !== undefined && (
          <span
            className="compact-xp"
            role="progressbar"
            aria-label={`EXP ${c.name}`}
            aria-valuemin={0}
            aria-valuemax={unit.level >= 10 ? 100 : xpForNextLevel(unit.level)}
            aria-valuenow={unit.level >= 10 ? 100 : xp}
            title={
              unit.level >= 10
                ? "Cấp tối đa"
                : `${xp}/${xpForNextLevel(unit.level)} EXP`
            }
          >
            <i
              style={{
                width: `${unit.level >= 10 ? 100 : Math.min(100, (xp / xpForNextLevel(unit.level)) * 100)}%`,
              }}
            />
          </span>
        )}
        {showEquipment && (unit.equipment.length > 0 || skill) && (
          <span className="compact-equipment">
            {unit.equipment.map((id) => (
              <span key={id}>
                <ItemSprite id={id} />
                <span>{itemInfo(id)?.name}</span>
              </span>
            ))}
            {skill && (
              <span className="compact-mastery">
                <i aria-hidden="true">✦</i>
                <span>{skill.name}</span>
              </span>
            )}
          </span>
        )}
      </button>
    );
  }
  return (
    <button
      type="button"
      className={`loadout-card${inTeam ? " in-team" : ""}`}
      aria-label={`Cấu hình ${c.name}`}
      onClick={onClick}
    >
      <div className="loadout-card-top">
        <span className="card-level">Lv.{unit.level}</span>
        {inTeam && <span className="in-team-label">Trong đội</span>}
      </div>
      <Portrait
        id={c.id as CharacterId}
        transformed={isTransformedCharacter(c.id, unit.equipment)}
      />
      <b className="loadout-name">
        {characterKit(c.id as CharacterId, unit.equipment)?.name || c.name}
      </b>
      <div className="loadout-tags">
        <span>{c.roleClass}</span>
        <span>{c.race}</span>
      </div>
      <p>{shortCharacterText(c.id)}</p>
      <div className="loadout-slots">
        <span className={unit.equipment[0] ? "filled" : ""}>
          {unit.equipment[0] ? (
            <ItemSprite id={unit.equipment[0]} />
          ) : (
            <i aria-hidden="true">◇</i>
          )}
          <span>{itemInfo(unit.equipment[0])?.name || "Chưa gắn đồ"}</span>
        </span>
        <span className={skill ? "filled skill-slot" : ""}>
          <i aria-hidden="true">✦</i>
          <span>{skill?.name || "Chưa lắp Bí kỹ"}</span>
        </span>
      </div>
      <span className="card-config-hint">Chạm để chỉnh →</span>
    </button>
  );
}
type ItemChoice = { itemId: string; level: number; owner?: string };
export function CharacterConfig({
  unit,
  onClose,
  onApply,
  items,
  allies,
  profile,
  loaned = false,
  readOnly = false,
  equipmentLocked = false,
  addToTeam,
  removeFromTeam,
}: {
  unit: Loadout;
  onClose: () => void;
  onApply?: (next: Loadout, replacement?: string) => void;
  items: ItemChoice[];
  allies: Loadout[];
  profile?: CollectionProfile;
  loaned?: boolean;
  readOnly?: boolean;
  equipmentLocked?: boolean;
  addToTeam?: boolean;
  removeFromTeam?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    [draft, setDraft] = useState(() => structuredClone(unit)),
    [error, setError] = useState(""),
    [replacement, setReplacement] = useState(allies[0]?.characterId || "");
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => {
      dialog.current?.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  const c = character(draft.characterId)!,
    stats = statsBreakdown(draft),
    selectedItem = items.find((i) => i.itemId === draft.equipment[0]),
    selectedSkill = masteryInfo(draft.masteryId),
    count = profile?.experience?.mastery?.[c.id] || 0;
  const signed = (n: number) => `${n >= 0 ? "+" : ""}${n}`;
  function apply() {
    try {
      if (!onApply) return;
      onApply(draft, addToTeam && allies.length >= 3 ? replacement : undefined);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="loadout-config"
      aria-labelledby="config-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="config-heading">
        <div>
          <span>{readOnly ? "ĐỘI HÌNH ĐỐI THỦ" : "CẤU HÌNH NHÂN VẬT"}</span>
          <h2 id="config-title">
            {c.name} <small>Lv.{draft.level}</small>
          </h2>
        </div>
        <button aria-label="Đóng cấu hình" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="config-scroll">
        <div className="config-hero">
          <Portrait
            id={c.id as CharacterId}
            transformed={isTransformedCharacter(c.id, draft.equipment)}
          />
          <div>
            <div className="loadout-tags">
              <span>{c.roleClass}</span>
              <span>{c.race}</span>
              {loaned && <span>Cho mượn</span>}
            </div>
            <p>{shortCharacterText(c.id)}</p>
          </div>
        </div>
        <section className="config-stats" aria-label="Chỉ số hiện tại">
          <div>
            <span>Sát thương / đòn · Lv.{draft.level}</span>
            <strong data-testid="config-attack">{stats.total.attack}</strong>
            <small>
              {stats.base.attack} từ nhân vật{" "}
              <b>{signed(stats.attackFromItems)} trang bị</b>
            </small>
          </div>
          <div>
            <span>Máu tối đa</span>
            <strong>{stats.total.hp}</strong>
            <small>
              {stats.base.hp} từ nhân vật{" "}
              <b>{signed(stats.hpFromItems)} trang bị</b>
            </small>
          </div>
        </section>
        <details className="config-more-stats">
          <summary>Giáp, tốc độ & chỉ số khác</summary>
          <p>
            Giảm sát thương {stats.total.defense}% · Di chuyển{" "}
            {Math.round((stats.total.speed * 30) / 100)} đơn vị/s · Nạp Super{" "}
            {stats.total.charge}%
          </p>
          <small>
            Chỉ số trước trận, đã tính cấp đồ, hợp cạ, biến hình và trần. Nội
            tại/Bí kỹ có điều kiện sẽ kích hoạt trong trận.
          </small>
        </details>
        <details className="config-more-stats config-kit">
          <summary>Kỹ năng & nội tại</summary>
          <div>
            <h3>{c.passive[0]}</h3>
            <p>{c.passive[1]}</p>
            <h3>Đòn thường</h3>
            <p>{characterKit(c.id, draft.equipment)?.normal}</p>
            <h3>Super · {c.skill[0]}</h3>
            <p>{characterKit(c.id, draft.equipment)?.super || c.skill[1]}</p>
          </div>
        </details>
        <section className="config-section">
          <div className="config-section-title">
            <h3>Trang bị</h3>
            <span>
              1 ô ·{" "}
              {equipmentLocked ? "Nhận từ chọn thẻ" : "Có thể đổi trước trận"}
            </span>
          </div>
          {readOnly || equipmentLocked ? (
            <div className="selected-equipment">
              {draft.equipment[0] && <ItemSprite id={draft.equipment[0]} />}
              <b>{itemInfo(draft.equipment[0])?.name || "Không có trang bị"}</b>
            </div>
          ) : (
            <select
              aria-label="Trang bị cho nhân vật"
              value={draft.equipment[0] || ""}
              onChange={(e) => {
                const id = e.target.value,
                  item = items.find((i) => i.itemId === id);
                setDraft({
                  ...draft,
                  equipment: id ? [id] : [],
                  equipmentLevels: id ? { [id]: item?.level || 1 } : {},
                });
              }}
            >
              <option value="">Không trang bị</option>
              {items
                .slice()
                .sort(
                  (a, b) =>
                    Number(itemInfo(b.itemId)?.affinity === c.id) -
                    Number(itemInfo(a.itemId)?.affinity === c.id),
                )
                .map((i) => (
                  <option key={i.itemId} value={i.itemId}>
                    {itemInfo(i.itemId)?.name} · Lv.{i.level}
                    {itemInfo(i.itemId)?.affinity === c.id ? " · Hợp cạ" : ""}
                    {i.owner && i.owner !== c.id
                      ? ` · ở ${character(i.owner)?.name}`
                      : ""}
                  </option>
                ))}
            </select>
          )}
          {selectedItem && (
            <p className="equipment-effect">
              {itemEffectDescription(
                selectedItem.itemId,
                selectedItem.level,
                itemInfo(selectedItem.itemId)?.affinity === c.id,
              )}
            </p>
          )}
          {selectedItem?.owner && selectedItem.owner !== c.id && !readOnly && (
            <p className="config-notice">
              Lưu sẽ chuyển món này từ {character(selectedItem.owner)?.name}{" "}
              sang {c.name}.
            </p>
          )}
        </section>
        <section className="config-section">
          <div className="config-section-title">
            <h3>Bí kỹ</h3>
            <span>Chỉ chọn 1 · không chiếm ô đồ</span>
          </div>
          {readOnly ? (
            <p>{selectedSkill?.name || "Chưa lắp Bí kỹ"}</p>
          ) : (
            <div className="mastery-picks">
              <button
                aria-pressed={!draft.masteryId}
                onClick={() =>
                  setDraft({
                    ...draft,
                    masteryId: undefined,
                    masteryTarget: undefined,
                  })
                }
              >
                Không dùng Bí kỹ
              </button>
              {masteriesFor(c.id).map((m) => {
                const unlocked =
                  loaned || (!!profile && masteryUnlocked(profile, c.id, m.id));
                return (
                  <button
                    key={m.id}
                    disabled={!unlocked}
                    aria-pressed={draft.masteryId === m.id}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        masteryId: m.id,
                        masteryTarget: undefined,
                      })
                    }
                  >
                    <span>
                      <b>{m.name}</b>
                      <small>{m.role}</small>
                    </span>
                    <span>
                      {unlocked
                        ? draft.masteryId === m.id
                          ? "✓ Đang chọn"
                          : "Lắp"
                        : `${Math.min(count, m.goal)}/${m.goal} · Hành trình`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {!masteriesFor(c.id).length && (
            <p className="config-muted">
              Nhân vật này chưa có Bí kỹ trong đợt hiện tại.
            </p>
          )}
          {selectedSkill && (
            <div className="mastery-description">
              <b>{selectedSkill.name}</b>
              <p>{selectedSkill.description}</p>
              <small>Đánh đổi: {selectedSkill.tradeoff}</small>
              {selectedSkill.legacy && (
                <small>Mỗi đội chỉ được lắp một Truyền thừa.</small>
              )}
            </div>
          )}
          {selectedSkill?.targeted &&
            !readOnly &&
            allies.some((u) => u.characterId !== draft.characterId) && (
              <label>
                Đồng đội nhận hiệu ứng
                <select
                  aria-label="Mục tiêu Bí kỹ"
                  value={draft.masteryTarget || ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      masteryTarget: e.target.value || undefined,
                    })
                  }
                >
                  <option value="">Tự chọn đồng đội còn sống</option>
                  {allies
                    .filter((u) => u.characterId !== draft.characterId)
                    .map((u) => (
                      <option key={u.characterId} value={u.characterId}>
                        {character(u.characterId)?.name}
                      </option>
                    ))}
                </select>
              </label>
            )}
        </section>
        {addToTeam && allies.length >= 3 && (
          <section className="config-section">
            <h3>Đội đã đủ 3 người · chọn vị trí thay</h3>
            <select
              aria-label="Nhân vật được thay"
              value={replacement}
              onChange={(e) => setReplacement(e.target.value as CharacterId)}
            >
              {allies.map((u) => (
                <option key={u.characterId} value={u.characterId}>
                  {character(u.characterId)?.name}
                </option>
              ))}
            </select>
          </section>
        )}
        {error && (
          <p className="config-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="config-footer">
        {removeFromTeam && (
          <button
            className="config-remove"
            onClick={() => {
              removeFromTeam();
              onClose();
            }}
          >
            Bỏ khỏi đội
          </button>
        )}
        <button onClick={onClose}>{readOnly ? "Đóng" : "Hủy"}</button>
        {!readOnly && onApply && (
          <button className="primary" onClick={apply}>
            {addToTeam
              ? allies.length >= 3
                ? "Thay vào đội & lưu"
                : "Thêm vào đội & lưu"
              : "Lưu cấu hình"}
          </button>
        )}
      </div>
    </dialog>
  );
}
export function applyOwnedConfig<T extends CollectionProfile>(
  profile: T,
  unit: Loadout,
  replacement?: string,
): T {
  const id = unit.characterId!;
  if (!profile.cards.some((c) => c.characterId === id))
    throw Error("Bạn chưa sở hữu nhân vật này.");
  if (unit.masteryId && !masteryUnlocked(profile, id, unit.masteryId))
    throw Error("Bí kỹ chưa được mở từ hành trình nhân vật.");
  if (
    unit.equipment.length > 1 ||
    unit.equipment.some(
      (item) => !profile.itemCards.some((i) => i.itemId === item),
    )
  )
    throw Error("Chỉ lắp một vật phẩm đã sở hữu.");
  let team = [...profile.team];
  if (!team.includes(id)) {
    if (replacement && team.includes(replacement as CharacterId))
      team[team.indexOf(replacement as CharacterId)] = id;
    else if (team.length < 3) team.push(id);
    else {
      const index = team.indexOf(replacement as CharacterId);
      if (index < 0) throw Error("Chọn nhân vật được thay.");
      team[index] = id;
    }
  }
  const equipment = Object.fromEntries(
    Object.entries(profile.equipment).filter(
      ([owner, ids]) =>
        team.includes(owner as CharacterId) &&
        owner !== id &&
        !ids.some((item) => unit.equipment.includes(item)),
    ),
  );
  if (unit.equipment.length) equipment[id] = [...unit.equipment];
  const experience = experienceOf(profile),
    masteries = { ...experience.masteries };
  if (unit.masteryId)
    masteries[id] = {
      id: unit.masteryId,
      ...(unit.masteryTarget ? { target: unit.masteryTarget } : {}),
    };
  else delete masteries[id];
  for (const owner of team)
    if (
      masteries[owner]?.target &&
      !team.includes(masteries[owner].target as CharacterId)
    )
      masteries[owner] = { id: masteries[owner].id };
  const next = {
    ...profile,
    team,
    equipment,
    experience: { ...experience, masteries },
  };
  validateMasteryTeam(
    team.map((c) => ({
      characterId: c,
      masteryId: masteries[c]?.id,
      masteryTarget: masteries[c]?.target,
    })),
  );
  return next;
}
export function ItemConfig({
  itemId,
  profile,
  readOnly = false,
  onSave,
  onClose,
}: {
  itemId: string;
  profile: CollectionProfile;
  readOnly?: boolean;
  onSave: (next: CollectionProfile) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    [target, setTarget] = useState(profile.team[0]);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  const card = profile.itemCards.find((c) => c.itemId === itemId)!,
    info = itemInfo(itemId)!,
    current: Loadout = {
      characterId: target,
      classId: character(target)!.base as Loadout["classId"],
      level: profile.cards.find((c) => c.characterId === target)?.level || 1,
      equipment: profile.equipment[target] || [],
      equipmentLevels: Object.fromEntries(
        profile.itemCards.map((c) => [c.itemId, c.level]),
      ),
      masteryId: profile.experience?.masteries?.[target]?.id,
      masteryTarget: profile.experience?.masteries?.[target]?.target,
    };
  const next = { ...current, equipment: [itemId] },
    before = computeStats(current),
    after = computeStats(next);
  return (
    <dialog
      ref={ref}
      className="loadout-config item-config"
      aria-labelledby="item-config-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="config-heading">
        <h2 id="item-config-title">Trang bị vật phẩm</h2>
        <button aria-label="Đóng cấu hình" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="config-scroll">
        <div className="config-hero">
          <ItemSprite id={itemId} />
          <div>
            <h3>
              {info.name} · Lv.{card.level}
            </h3>
            <p>
              {itemEffectDescription(
                itemId,
                card.level,
                info.affinity === target,
              )}
            </p>
          </div>
        </div>
        <label>
          Trang bị cho
          <select
            aria-label="Nhân vật nhận trang bị"
            value={target}
            onChange={(e) => setTarget(e.target.value as CharacterId)}
          >
            {profile.team.map((id) => (
              <option key={id} value={id}>
                {character(id)?.name}
              </option>
            ))}
          </select>
        </label>
        <div className="config-stats">
          <div>
            <span>Sát thương / đòn</span>
            <strong>
              {before.attack} → {after.attack}
            </strong>
          </div>
          <div>
            <span>Máu tối đa</span>
            <strong>
              {before.hp} → {after.hp}
            </strong>
          </div>
        </div>
        <p className="config-muted">
          Thay đồ đang gắn, không mất vật phẩm cũ. Mỗi món chỉ gắn một người.
        </p>
      </div>
      <div className="config-footer">
        <button onClick={onClose}>Hủy</button>
        <button
          className="primary"
          disabled={readOnly}
          onClick={() => {
            onSave(applyOwnedConfig(profile, next));
            onClose();
          }}
        >
          Trang bị cho {character(target)?.name}
        </button>
      </div>
    </dialog>
  );
}
