import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import {
  dropInventoryCard,
  parseInventoryDrag,
  INVENTORY_DRAG_TYPE,
  type InventoryDrag,
} from "./inventoryDrag";
import { useEffect, useRef, useState } from "react";
import {
  ROSTER,
  BONDS,
  FRIEND_GROUPS,
  groupTier,
  character,
  itemInfo,
  type CharacterId,
} from "../../../packages/shared/src/catalog";
import {
  profileLoadouts,
  experienceOf,
  toggleLock,
  type CollectionProfile,
} from "../../../packages/shared/src/experience";
import type { Loadout } from "../../../packages/shared/src/balance";
import { PresetBar } from "./PresetBar";
import { ItemSprite, type Inspect } from "./GameCatalog";
import { cardEvolution } from "../../../packages/shared/src/progression";
import "./inventory.css";
import { TeamLinks } from "./TeamLinks";
import {
  LoadoutCard,
  CharacterConfig,
  ItemConfig,
  applyOwnedConfig,
} from "./LoadoutConfig";

export function InventoryBoard({
  profile,
  onChange,
  disabled,
  onError,
}: {
  profile: CollectionProfile;
  onChange: (changes: Partial<CollectionProfile>) => void;
  disabled?: boolean;
  onError: (message: string) => void;
  inspect?: (info: Inspect) => void;
}) {
  const [tab, setTab] = useState<"characters" | "items">("characters"),
    [search, setSearch] = useState(""),
    [role, setRole] = useState(""),
    [sort, setSort] = useState("level"),
    [config, setConfig] = useState<CharacterId | null>(null),
    [item, setItem] = useState<string | null>(null);
  const [drag, setDrag] = useState<InventoryDrag | null>(null),
    [hover, setHover] = useState<number | null>(null),
    [touch, setTouch] = useState(false),
    [notice, setNotice] = useState("");
  const dragging = useRef<InventoryDrag | null>(null);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);
  function finishDrag() {
    dragging.current = null;
    setDrag(null);
    setHover(null);
    setTouch(false);
  }
  function commitDrop(payload: InventoryDrag, slot: number) {
    if (disabled) return;
    try {
      onChange(
        dropInventoryCard(
          profile,
          payload,
          Math.min(slot, profile.team.length),
        ),
      );
      setNotice(
        payload.kind === "item"
          ? "Đã gắn trang bị. Đồ cũ vẫn ở trong kho."
          : "Đã cập nhật đội hình.",
      );
    } catch (e) {
      const message = (e as Error).message;
      setNotice(message);
      onError(message);
    }
    finishDrag();
  }
  function dragProps(payload: InventoryDrag) {
    return {
      draggable: !disabled,
      onDragStart: (e: React.DragEvent) => {
        if (disabled) return;
        e.dataTransfer.setData(INVENTORY_DRAG_TYPE, JSON.stringify(payload));
        e.dataTransfer.effectAllowed = "move";
        dragging.current = payload;
        setDrag(payload);
      },
      onDragEnd: finishDrag,
    };
  }
  function touchMove(e: ReactPointerEvent) {
    if (!dragging.current || e.pointerType === "mouse") return;
    const element = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest<HTMLElement>("[data-team-slot]");
    setHover(element ? Number(element.dataset.teamSlot) : null);
  }
  function handle(payload: InventoryDrag, name: string) {
    return (
      <button
        className="inventory-drag-handle"
        disabled={disabled}
        aria-label={"Kéo " + name}
        title="Giữ và kéo vào đội"
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" || disabled) return;
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          dragging.current = payload;
          setDrag(payload);
          setTouch(true);
        }}
        onPointerMove={touchMove}
        onPointerUp={(e) => {
          if (e.pointerType === "mouse") return;
          const element = document
            .elementFromPoint(e.clientX, e.clientY)
            ?.closest<HTMLElement>("[data-team-slot]");
          if (dragging.current && element)
            commitDrop(dragging.current, Number(element.dataset.teamSlot));
          else finishDrag();
        }}
        onPointerCancel={finishDrag}
      >
        ⠿<span>Kéo</span>
      </button>
    );
  }
  function dropSlot(slot: number, children: ReactNode) {
    let valid = false;
    if (drag && !disabled)
      try {
        dropInventoryCard(profile, drag, Math.min(slot, profile.team.length));
        valid = true;
      } catch {}
    return (
      <div
        key={slot}
        data-team-slot={slot}
        className={
          "inventory-drop-slot " +
          (drag ? (valid ? "drop-valid" : "drop-invalid") : "") +
          " " +
          (hover === slot ? "drop-hover" : "")
        }
        onDragOver={(e) => {
          if (dragging.current && !disabled) {
            e.preventDefault();
            setHover(slot);
            e.dataTransfer.dropEffect = valid ? "move" : "none";
          }
        }}
        onDragLeave={() => setHover(null)}
        onDrop={(e) => {
          e.preventDefault();
          try {
            commitDrop(
              parseInventoryDrag(e.dataTransfer.getData(INVENTORY_DRAG_TYPE)),
              slot,
            );
          } catch {
            finishDrag();
          }
        }}
      >
        {children}
        {drag && (
          <span className="drop-caption">
            {valid
              ? drag.kind === "item"
                ? "Thả để gắn đồ"
                : slot < profile.team.length
                  ? "Thả để đổi quân"
                  : "Thả để thêm vào đội"
              : "Cần thả lên nhân vật"}
          </span>
        )}
      </div>
    );
  }
  const searchRef = useRef<HTMLInputElement>(null),
    exp = experienceOf(profile),
    units = profileLoadouts(profile),
    term = search.trim().toLocaleLowerCase("vi");
  const characterCards = profile.cards
    .filter((c) => {
      const info = character(c.characterId)!;
      return (
        info.name.toLocaleLowerCase("vi").includes(term) &&
        (!role || role === info.roleClass)
      );
    })
    .slice()
    .sort((a, b) =>
      sort === "level"
        ? b.level - a.level
        : character(a.characterId)!.name.localeCompare(
            character(b.characterId)!.name,
            "vi",
          ),
    );
  const itemCards = profile.itemCards
    .filter((c) =>
      itemInfo(c.itemId)?.name.toLocaleLowerCase("vi").includes(term),
    )
    .slice()
    .sort((a, b) =>
      sort === "level"
        ? b.level - a.level
        : itemInfo(a.itemId)!.name.localeCompare(
            itemInfo(b.itemId)!.name,
            "vi",
          ),
    );
  const activeLinks = [
    ...BONDS.filter((b) =>
      b.members.every((id) => profile.team.includes(id as CharacterId)),
    ),
    ...FRIEND_GROUPS.filter((g) => groupTier(g, profile.team) > 0),
  ];
  function unitFor(id: CharacterId): Loadout {
    return {
      characterId: id,
      classId: character(id)!.base as Loadout["classId"],
      level: profile.cards.find((c) => c.characterId === id)?.level || 1,
      equipment: profile.equipment[id] || [],
      equipmentLevels: Object.fromEntries(
        profile.itemCards.map((c) => [c.itemId, c.level]),
      ),
      masteryId: exp.masteries?.[id]?.id,
      masteryTarget: exp.masteries?.[id]?.target,
    };
  }
  function remove(id: CharacterId) {
    if (disabled) return;
    const team = profile.team.filter((c) => c !== id);
    if (!team.length) return onError("Đội cần ít nhất một nhân vật.");
    const masteries = { ...exp.masteries };
    for (const key of team)
      if (masteries[key]?.target === id)
        masteries[key] = { id: masteries[key].id };
    onChange({
      ...profile,
      team,
      equipment: Object.fromEntries(
        Object.entries(profile.equipment).filter(([key]) =>
          team.includes(key as CharacterId),
        ),
      ),
      experience: { ...exp, masteries },
    });
  }
  return (
    <div className="inventory-board collection-workspace">
      <aside className="inventory-team-column" aria-label="Đội hình của tôi">
        <div className="inventory-column-heading">
          <div>
            <h2>Đội hình của tôi</h2>
          </div>
          <span className="team-size">{units.length}/3</span>
        </div>
        <div className="inventory-team-list">
          {units.map((u, slot) =>
            dropSlot(
              slot,
              <div
                className="inventory-card-shell"
                {...dragProps({ kind: "character", id: u.characterId! })}
              >
                <LoadoutCard
                  unit={u}
                  inTeam
                  compact
                  onClick={() => setConfig(u.characterId!)}
                />
                {handle(
                  { kind: "character", id: u.characterId! },
                  character(u.characterId)!.name,
                )}
              </div>,
            ),
          )}
          {Array.from({ length: 3 - units.length }, (_, index) =>
            dropSlot(
              units.length + index,
              <button
                className="empty-team-slot"
                onClick={() => {
                  setTab("characters");
                  setSearch("");
                  searchRef.current?.focus();
                }}
              >
                <span aria-hidden="true">+</span>
                <small>Thêm nhân vật</small>
              </button>,
            ),
          )}
        </div>
        <div className="inventory-team-tools">
          <details className="active-link-summary">
            <summary>
              Liên kết <span>{activeLinks.length}</span>
            </summary>
            <TeamLinks units={units} />
          </details>
          <details className="inventory-presets">
            <summary>
              Đội đã lưu <span>{exp.presets.length}/5</span>
            </summary>
            <PresetBar
              profile={profile}
              onChange={onChange}
              disabled={disabled}
              onError={onError}
            />
          </details>
          <details className="inventory-help">
            <summary>Hướng dẫn</summary>
            <p>
              Chọn thẻ để thêm hoặc thay nhân vật, đổi trang bị và Bí kỹ. Có thể
              kéo thẻ vào ô đội; kéo vật phẩm lên nhân vật để gắn.
            </p>
          </details>
        </div>
        {disabled && (
          <p className="config-notice">
            Đội đang khóa. Bạn vẫn có thể xem chỉ số.
          </p>
        )}
      </aside>
      <section
        className="inventory-collection-column"
        aria-label="Kho thẻ của bạn"
      >
        <div className="inventory-column-heading">
          <div>
            <h2>Thẻ sở hữu</h2>
          </div>
          <span>
            {tab === "characters" ? characterCards.length : itemCards.length}{" "}
            thẻ
          </span>
        </div>
        <div
          className="inventory-tabs"
          role="tablist"
          aria-label="Loại thẻ trong kho"
        >
          <button
            role="tab"
            id="inventory-characters-tab"
            aria-controls="inventory-cards"
            aria-selected={tab === "characters"}
            onClick={() => {
              setTab("characters");
              setSearch("");
            }}
          >
            Nhân vật <span>{profile.cards.length}</span>
          </button>
          <button
            role="tab"
            id="inventory-items-tab"
            aria-controls="inventory-cards"
            aria-selected={tab === "items"}
            onClick={() => {
              setTab("items");
              setSearch("");
            }}
          >
            Vật phẩm <span>{profile.itemCards.length}</span>
          </button>
        </div>
        <div className="inventory-search">
          <input
            ref={searchRef}
            aria-label="Tìm thẻ trong kho"
            placeholder={
              tab === "characters" ? "Tìm tên nhân vật…" : "Tìm tên vật phẩm…"
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <details>
            <summary>Lọc{tab === "characters" && role ? " (1)" : ""}</summary>
            <div className="inventory-filter-popover">
              {tab === "characters" && (
                <label>
                  Vai trò
                  <select
                    aria-label="Vai trò"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="">Tất cả</option>
                    {[...new Set(ROSTER.map((c) => c.roleClass))].map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Sắp xếp
                <select
                  aria-label="Sắp xếp thẻ"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="level">Cấp cao trước</option>
                  <option value="name">Theo tên</option>
                </select>
              </label>
            </div>
          </details>
        </div>
        <div
          className="inventory-card-grid"
          id="inventory-cards"
          role="tabpanel"
          aria-labelledby={
            tab === "characters"
              ? "inventory-characters-tab"
              : "inventory-items-tab"
          }
          aria-label={
            tab === "characters" ? "Nhân vật sở hữu" : "Vật phẩm sở hữu"
          }
        >
          {tab === "characters"
            ? characterCards.map((c) => {
                const key = `character:${c.characterId}`,
                  locked = exp.locked.includes(key);
                return (
                  <article
                    className="inventory-card-shell"
                    key={key}
                    {...dragProps({ kind: "character", id: c.characterId })}
                  >
                    <LoadoutCard
                      compact
                      xp={c.xp}
                      unit={unitFor(c.characterId)}
                      inTeam={profile.team.includes(c.characterId)}
                      onClick={() => setConfig(c.characterId)}
                    />
                    {handle(
                      { kind: "character", id: c.characterId },
                      character(c.characterId)!.name,
                    )}
                    <button
                      className="card-lock"
                      disabled={disabled}
                      aria-label={`${locked ? "Mở khóa" : "Khóa"} ${character(c.characterId)?.name}`}
                      aria-pressed={locked}
                      onClick={() =>
                        onChange({
                          experience: toggleLock(profile, key).experience,
                        })
                      }
                    >
                      <svg
                        width="14"
                        height="16"
                        viewBox="0 0 16 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden="true"
                      >
                        <rect x="2" y="8" width="12" height="10" rx="2" />
                        <path
                          d={
                            locked
                              ? "M4 8V5a4 4 0 0 1 8 0v3"
                              : "M4 8V5a4 4 0 0 1 8 0"
                          }
                        />
                      </svg>
                    </button>
                  </article>
                );
              })
            : itemCards.map((c) => {
                const key = `item:${c.itemId}`,
                  info = itemInfo(c.itemId)!,
                  owner = Object.entries(profile.equipment).find(([, items]) =>
                    items.includes(c.itemId),
                  )?.[0],
                  locked = exp.locked.includes(key);
                return (
                  <article
                    className="inventory-card-shell"
                    key={key}
                    {...dragProps({ kind: "item", id: c.itemId })}
                  >
                    <button
                      className={`loadout-card compact-card inventory-item-card tier-${cardEvolution(info.rarity, c.level).tier.toLowerCase()}`}
                      aria-label={`Trang bị ${info.name}`}
                      onClick={() => setItem(c.itemId)}
                    >
                      <span className="compact-card-meta">
                        <span className="card-level">Lv.{c.level}</span>
                      </span>
                      <ItemSprite id={c.itemId} />
                      <b className="loadout-name">{info.name}</b>
                      <span className="compact-card-role">
                        {(
                          {
                            T1: "Thường",
                            T2: "Hiếm",
                            T3: "Sử thi",
                            T4: "Huyền thoại",
                            GOD: "GOD",
                          } as Record<string, string>
                        )[cardEvolution(info.rarity, c.level).tier] || "Thường"}
                      </span>
                      {owner && (
                        <span className="in-team-label">
                          {character(owner)?.name}
                        </span>
                      )}
                    </button>
                    {handle({ kind: "item", id: c.itemId }, info.name)}
                    <button
                      className="card-lock"
                      disabled={disabled}
                      aria-label={`${locked ? "Mở khóa" : "Khóa"} ${info.name}`}
                      aria-pressed={locked}
                      onClick={() =>
                        onChange({
                          experience: toggleLock(profile, key).experience,
                        })
                      }
                    >
                      <svg
                        width="14"
                        height="16"
                        viewBox="0 0 16 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden="true"
                      >
                        <rect x="2" y="8" width="12" height="10" rx="2" />
                        <path
                          d={
                            locked
                              ? "M4 8V5a4 4 0 0 1 8 0v3"
                              : "M4 8V5a4 4 0 0 1 8 0"
                          }
                        />
                      </svg>
                    </button>
                  </article>
                );
              })}
        </div>
        {(tab === "characters"
          ? !characterCards.length
          : !itemCards.length) && (
          <div className="inventory-empty" role="status">
            <h3>
              {term || (tab === "characters" && role)
                ? "Không tìm thấy thẻ"
                : tab === "items"
                  ? "Chưa có vật phẩm"
                  : "Chưa có nhân vật"}
            </h3>
            <p>
              {term || (tab === "characters" && role)
                ? "Thử tên khác hoặc bỏ bộ lọc."
                : "Mở bài để bổ sung thẻ cho bộ sưu tập."}
            </p>
            {(term || role) && (
              <button
                onClick={() => {
                  setSearch("");
                  setRole("");
                }}
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}
      </section>
      <p role="status" className="inventory-action-status">
        {notice}
      </p>
      {drag && (
        <div
          className={"touch-team-rail" + (touch ? " touch-active" : "")}
          aria-label="Thả thẻ vào đội"
        >
          {units.map((u, i) =>
            dropSlot(i, <span>{character(u.characterId)?.name}</span>),
          )}
          {units.length < 3 && dropSlot(units.length, <span>+ Thêm quân</span>)}
        </div>
      )}
      {config && (
        <CharacterConfig
          key={config}
          unit={unitFor(config)}
          items={profile.itemCards.map((c) => ({
            ...c,
            owner: Object.entries(profile.equipment).find(([, items]) =>
              items.includes(c.itemId),
            )?.[0],
          }))}
          allies={units}
          profile={profile}
          readOnly={disabled}
          addToTeam={!profile.team.includes(config)}
          removeFromTeam={
            !disabled &&
            profile.team.includes(config) &&
            profile.team.length > 1
              ? () => remove(config)
              : undefined
          }
          onClose={() => setConfig(null)}
          onApply={(next, replacement) => {
            if (disabled) throw Error("Đội đang khóa.");
            onChange(applyOwnedConfig(profile, next, replacement));
          }}
        />
      )}
      {item && (
        <ItemConfig
          itemId={item}
          readOnly={disabled}
          profile={profile}
          onSave={(next) => {
            if (!disabled) onChange(next);
          }}
          onClose={() => setItem(null)}
        />
      )}
    </div>
  );
}
