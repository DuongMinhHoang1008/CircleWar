import { useState } from "react";
import {
  character,
  itemInfo,
  type CharacterId,
} from "../../../packages/shared/src/catalog";
import { experienceOf } from "../../../packages/shared/src/experience";
import {
  RUN_FLOORS,
  NODE_NAMES,
  runMap,
  starterChoices,
  createRun,
  currentNode,
  enterNode,
  leaveNode,
  runLoadouts,
  runBattleConfig,
  lootChoices,
  takeLoot,
  nodeStock,
  buyItem,
  buyRunRest,
  recruit,
  dismiss,
  equipRunItem,
  upgradeRun,
  restRun,
  resolveEvent,
  type RoguelikeRun,
} from "../../../packages/shared/src/roguelike";
import {
  ROGUELIKE_REWARDS,
  rogueBest,
} from "../../../packages/shared/src/mode-rewards";
import type { AdventureProfile } from "./AdventurePage";
import { ModeHero, TeamSummary } from "./AdventureScreens";
import { Portrait, ItemSprite, type Inspect } from "./GameCatalog";
import { RewardTrack } from "./ModeRewards";
import { TeamLinks } from "./TeamLinks";

export function RoguelikeScreen({
  profile,
  onRun,
  onAbandon,
  onBattle,
  inspect,
  onError,
  onClaim,
}: {
  profile: AdventureProfile;
  onRun: (run: RoguelikeRun) => void;
  onAbandon: () => void;
  onBattle: () => void;
  inspect: (info: Inspect) => void;
  onError: (message: string) => void;
  onClaim: (id: string) => void;
}) {
  const exp = experienceOf(profile),
    run = exp.roguelike,
    node = run && currentNode(run);
  const [seed, setSeed] = useState(
      () => crypto.getRandomValues(new Uint32Array(1))[0],
    ),
    [confirmAbandon, setConfirmAbandon] = useState(false);
  function act(action: () => RoguelikeRun) {
    try {
      onRun(action());
    } catch (e) {
      onError((e as Error).message);
    }
  }
  return (
    <>
      <ModeHero
        label="VIỄN CHINH ROGUELIKE"
        title={
          run
            ? `Tầng ${Math.min(RUN_FLOORS, run.floor + 1)} / ${RUN_FLOORS}`
            : "Chinh phục tháp viễn chinh."
        }
        description="Chọn đường, tích vàng, ghé cửa hàng và xây đội. HP được giữ giữa các trận. Thua một trận là mất toàn bộ run."
        reward={{ packs: 150, bossPacks: 15, choiceChests: 1 }}
      />
      {!run ? (
        <section className="expedition-play-card">
          {exp.lastRun && (
            <p
              className={exp.lastRun.won ? "run-clear" : "run-defeat"}
              role="status"
            >
              {exp.lastRun.won
                ? "Đã chinh phục tháp!"
                : exp.lastRun.reason === "defeat"
                  ? "Đã thất bại. Toàn bộ vàng, quân và đồ trong run đã mất."
                  : "Đã kết thúc run."}{" "}
              Đã vượt {exp.lastRun.floor}/{RUN_FLOORS} tầng.
            </p>
          )}
          <h2>Chọn nhân vật khởi đầu</h2>
          <p>
            Khởi đầu Lv.3 với 90 vàng và vật phẩm hợp cạ Lv.1. Quân và vật phẩm
            trong run tách riêng khỏi Kho đồ.
          </p>
          <div className="run-offers">
            {starterChoices(seed).map((id) => (
              <button
                key={id}
                className="run-offer"
                onClick={() => {
                  act(() => createRun(crypto.randomUUID(), seed, id));
                  setSeed(crypto.getRandomValues(new Uint32Array(1))[0]);
                }}
              >
                <Portrait id={id} />
                <b>{character(id)?.name}</b>
                <small>{character(id)?.roleClass} · Lv.3</small>
                <span>Bắt đầu với nhân vật này →</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="expedition-play-card">
            <div className="run-resource-bar">
              <b>{run.gold} vàng</b>
              <span>
                Đã vượt {run.floor}/{RUN_FLOORS} tầng · {run.wins} thắng
              </span>
              <small>Vàng chỉ dùng trong run</small>
            </div>
            <TeamSummary units={runLoadouts(run)} inspect={inspect} />
            <div className="run-health">
              {run.team.map((id) => (
                <span key={id}>
                  <b>{character(id)?.name}</b>
                  <progress max={100} value={run.health[id]} />
                  <small>
                    {run.health[id]}% HP · Lv.{run.levels[id]}
                  </small>
                </span>
              ))}
            </div>
            <TeamLinks units={runLoadouts(run)} />
            {run.phase !== "battle" && run.phase !== "reward" && (
              <details className="progressive-details">
                <summary>
                  Trang bị & quản lý đội · {run.bag.length} vật phẩm
                </summary>
                {run.team.map((id) => (
                  <div className="run-team-row" key={id}>
                    <b>{character(id)?.name}</b>
                    <select
                      aria-label={`Trang bị run ${character(id)?.name}`}
                      value={run.equipment[id]?.[0] || ""}
                      onChange={(e) =>
                        act(() => equipRunItem(run, id, e.target.value))
                      }
                    >
                      <option value="">Không trang bị</option>
                      {run.bag.map((item) => (
                        <option key={item} value={item}>
                          {itemInfo(item)?.name} · Lv.{run.itemLevels[item]}
                          {run.team.some(
                            (other) =>
                              other !== id &&
                              run.equipment[other]?.includes(item),
                          )
                            ? " · chuyển từ đồng đội"
                            : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      disabled={run.team.length <= 1}
                      aria-label={`Bỏ ${character(id)?.name} khỏi run`}
                      onClick={() => act(() => dismiss(run, id))}
                    >
                      Bỏ khỏi đội
                    </button>
                  </div>
                ))}
                <p>
                  Quân bị hạ được loại khỏi đội sau chiến thắng; trang bị vẫn
                  còn trong túi run. Bỏ quân không hoàn vàng.
                </p>
              </details>
            )}
          </section>
          <section className="expedition-play-card run-node-panel">
            {run.phase === "map" ? (
              <>
                <h2>Chọn đường lên tầng {run.floor + 1}</h2>
                <div className="run-offers">
                  {runMap(run.seed)[run.floor].map((n) => (
                    <button
                      className={`run-node node-${n.kind}`}
                      key={n.id}
                      onClick={() => act(() => enterNode(run, n.id))}
                    >
                      <b>{NODE_NAMES[n.kind]}</b>
                      <span>
                        {
                          {
                            battle: "Thắng: +45 vàng, chọn chiến lợi phẩm",
                            elite: "Đối thủ mạnh hơn · +70 vàng",
                            boss: "Boss bắt buộc · +100 vàng",
                            shop: "Mua đồ, nâng cấp hoặc chiêu mộ",
                            camp: "Hồi 35% HP cả đội hoặc nâng 1 cấp",
                            recruit: "Chiêu mộ 1 quân · 60 vàng",
                            event: "Đổi HP lấy vàng hoặc hồi phục",
                          }[n.kind]
                        }
                      </span>
                      <small>Đi theo đường này →</small>
                    </button>
                  ))}
                </div>
                <details className="progressive-details">
                  <summary>Bản đồ đủ 12 tầng</summary>
                  <div className="run-map">
                    {runMap(run.seed)
                      .slice()
                      .reverse()
                      .map((row, i) => (
                        <div
                          className={
                            row[0].floor === run.floor + 1 ? "current" : ""
                          }
                          key={i}
                        >
                          <b>{row[0].floor}</b>
                          {row.map((n) => (
                            <span
                              className={
                                run.path.some((p) => p.id === n.id)
                                  ? "visited"
                                  : ""
                              }
                              key={n.id}
                            >
                              {run.path.some((p) => p.id === n.id) ? "✓ " : ""}
                              {NODE_NAMES[n.kind]}
                            </span>
                          ))}
                        </div>
                      ))}
                  </div>
                </details>
              </>
            ) : run.phase === "battle" ? (
              <>
                <h2>Trận đang chờ kết quả</h2>
                <p>
                  Đội hình, HP và điều kiện trận đã khóa. Tải lại trang sẽ tiếp
                  tục đúng trận này.
                </p>
                <button className="primary main-cta" onClick={onBattle}>
                  Tiếp tục trận tầng {run.floor + 1} →
                </button>
              </>
            ) : run.phase === "reward" ? (
              <>
                <h2>Chọn một chiến lợi phẩm</h2>
                <p>
                  Vàng đã cộng vào run. Nhận trùng một món sẽ nâng món đó thêm 1
                  cấp, tối đa Lv.10.
                </p>
                <div className="run-offers">
                  {lootChoices(run).map((id) => (
                    <button
                      key={id}
                      className="run-offer"
                      onClick={() => act(() => takeLoot(run, id))}
                    >
                      <ItemSprite id={id} />
                      <b>{itemInfo(id)?.name}</b>
                      <span>
                        {run.bag.includes(id)
                          ? `Nâng lên Lv.${Math.min(10, run.itemLevels[id] + 1)}`
                          : "Nhận vào túi run"}
                      </span>
                    </button>
                  ))}
                </div>
                <button onClick={() => act(() => takeLoot(run))}>
                  Bỏ qua chiến lợi phẩm
                </button>
              </>
            ) : (
              node && (
                <>
                  <div className="section-heading">
                    <h2>
                      {NODE_NAMES[node.kind]} · tầng {node.floor}
                    </h2>
                    {["shop", "recruit"].includes(node.kind) && (
                      <button onClick={() => act(() => leaveNode(run))}>
                        Tiếp tục lên tháp →
                      </button>
                    )}
                  </div>
                  {["battle", "elite", "boss"].includes(node.kind) ? (
                    <>
                      <TeamSummary
                        units={runBattleConfig(run).teams[1].loadouts}
                        inspect={inspect}
                        enemy
                      />
                      <button className="primary main-cta" onClick={onBattle}>
                        Vào trận tầng {node.floor} →
                      </button>
                    </>
                  ) : node.kind === "camp" ? (
                    <>
                      <p>Chỉ chọn một: hồi HP cả đội hoặc nâng một nhân vật.</p>
                      <div className="action-row">
                        <button
                          className="primary"
                          onClick={() => act(() => restRun(run))}
                        >
                          Nghỉ · hồi 35% HP cả đội
                        </button>
                        {run.team.map((id) => (
                          <button
                            key={id}
                            disabled={run.levels[id] >= 10}
                            onClick={() => act(() => upgradeRun(run, id))}
                          >
                            Nâng {character(id)?.name} · Lv.{run.levels[id]} →{" "}
                            {Math.min(10, run.levels[id] + 1)}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : node.kind === "event" ? (
                    <>
                      <p>
                        Một thương nhân bí ẩn đề nghị đổi sức bền lấy tài
                        nguyên.
                      </p>
                      <div className="action-row">
                        <button
                          disabled={run.team.some((id) => run.health[id] <= 15)}
                          onClick={() => act(() => resolveEvent(run, "gold"))}
                        >
                          Nhận 55 vàng · cả đội mất 15% HP
                        </button>
                        <button
                          onClick={() => act(() => resolveEvent(run, "heal"))}
                        >
                          Từ chối trao đổi · hồi 15% HP cả đội
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {node.kind === "shop" && (
                        <>
                          <button
                            disabled={
                              run.gold < 25 ||
                              run.purchased.includes("rest") ||
                              run.team.every((id) => run.health[id] >= 100)
                            }
                            onClick={() => act(() => buyRunRest(run))}
                          >
                            {run.purchased.includes("rest")
                              ? "Đã mua hồi phục"
                              : "Hồi 35% HP cả đội · 25 vàng"}
                          </button>
                          <h3>Vật phẩm</h3>
                          <div className="run-offers">
                            {nodeStock(run).items.map((id) => {
                              const price =
                                35 + (itemInfo(id)?.rarity || 0) * 10;
                              return (
                                <button
                                  key={id}
                                  className="run-offer"
                                  disabled={
                                    run.gold < price ||
                                    run.purchased.includes(id)
                                  }
                                  onClick={() => act(() => buyItem(run, id))}
                                >
                                  <ItemSprite id={id} />
                                  <b>{itemInfo(id)?.name}</b>
                                  <span>
                                    {run.purchased.includes(id)
                                      ? "Đã mua"
                                      : `Mua · ${price} vàng`}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          <h3>Nâng cấp nhân vật · 40 vàng / cấp</h3>
                          <div className="action-row">
                            {run.team.map((id) => (
                              <button
                                key={id}
                                disabled={run.gold < 40 || run.levels[id] >= 10}
                                onClick={() => act(() => upgradeRun(run, id))}
                              >
                                {character(id)?.name} · Lv.{run.levels[id]} →{" "}
                                {Math.min(10, run.levels[id] + 1)}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                      <h3>Chiêu mộ · 60 vàng</h3>
                      <p>
                        {run.team.length >= 3
                          ? "Đội đã đủ ba người. Bỏ một nhân vật trong quản lý đội để có chỗ."
                          : "Mỗi điểm dừng chỉ chiêu mộ một nhân vật."}
                      </p>
                      <div className="run-offers">
                        {nodeStock(run).recruits.map((id) => (
                          <button
                            key={id}
                            className="run-offer"
                            disabled={
                              run.gold < 60 ||
                              run.team.length >= 3 ||
                              run.purchased.includes("recruit")
                            }
                            onClick={() => act(() => recruit(run, id))}
                          >
                            <Portrait id={id} />
                            <b>{character(id)?.name}</b>
                            <span>
                              Chiêu mộ · Lv.
                              {Math.min(10, 3 + Math.floor(run.floor / 2))}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )
            )}
          </section>
          <details className="progressive-details">
            <summary>Kết thúc run này</summary>
            {confirmAbandon ? (
              <div className="action-row">
                <p>Bỏ toàn bộ vàng, quân và vật phẩm của run hiện tại?</p>
                <button
                  className="danger"
                  onClick={() => {
                    onAbandon();
                    setConfirmAbandon(false);
                  }}
                >
                  Xác nhận bỏ run
                </button>
                <button onClick={() => setConfirmAbandon(false)}>
                  Tiếp tục chơi
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmAbandon(true)}>
                Bỏ run hiện tại
              </button>
            )}
          </details>
        </>
      )}
      <details className="progressive-details reward-track-details">
        <summary>
          Thưởng vượt tầng hôm nay · tốt nhất {rogueBest(profile)}/12 tầng
        </summary>
        <RewardTrack
          title="Thưởng vượt tầng hôm nay"
          subtitle="Tự nhận khi đạt mốc · pack dư vào Hòm thư · vật phẩm run không mang ra Kho đồ"
          milestones={ROGUELIKE_REWARDS}
          progress={rogueBest(profile)}
          profile={profile}
          onClaim={onClaim}
        />
      </details>
    </>
  );
}
