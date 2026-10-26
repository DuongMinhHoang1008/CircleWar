import { useMemo, useState } from "react";
import {
  CHARACTERS,
  type ClassId,
  type Loadout,
} from "../../../packages/shared/src/balance";
import { character, itemInfo } from "../../../packages/shared/src/catalog";
import {
  characterMetrics,
  matchupMetrics,
  type BattleMode,
  type BattleRecord,
} from "./battleAnalytics";
import "./battleAnalytics.css";

const MODE_LABELS: Record<BattleMode, string> = {
  campaign: "Đi ải",
  simulation: "Mô phỏng",
  multiplayer: "Multiplayer",
};
const name = (id: string) =>
  character(id)?.name || CHARACTERS[id as ClassId]?.name || id;
const gear = (unit: {
  equipment: string[];
  equipmentLevels?: Record<string, number>;
}) =>
  unit.equipment.length
    ? unit.equipment
        .map(
          (id) =>
            `${itemInfo(id)?.name || id} · Lv.${unit.equipmentLevels?.[id] || 1}`,
        )
        .join(", ")
    : "Không trang bị";

export function BattleAnalyticsPage({
  records,
  equipment,
}: {
  records: BattleRecord[];
  equipment: Loadout[];
}) {
  const [mode, setMode] = useState<BattleMode | "all">("all"),
    [selected, setSelected] = useState("all");
  const filtered = useMemo(
    () =>
      records.filter(
        (record) =>
          (mode === "all" || record.mode === mode) &&
          (selected === "all" ||
            record.units.some((unit) => unit.characterId === selected)),
      ),
    [records, mode, selected],
  );
  const metrics = useMemo(
    () =>
      characterMetrics(filtered).filter(
        (row) => selected === "all" || row.id === selected,
      ),
    [filtered, selected],
  );
  const matchups = useMemo(
    () =>
      matchupMetrics(filtered).filter(
        (row) =>
          selected === "all" ||
          row.source === selected ||
          row.target === selected,
      ),
    [filtered, selected],
  );
  const ids = useMemo(
    () =>
      [
        ...new Set(
          records.flatMap((record) =>
            record.units.map((unit) => unit.characterId),
          ),
        ),
      ].sort(),
    [records],
  );
  function exportJson() {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            { exportedAt: new Date().toISOString(), records: filtered },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "circlewar-phan-tich.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="profile-screen analytics-screen">
      <div className="panel-title">
        <h2>Phân tích số liệu</h2>
        <button onClick={exportJson} disabled={!filtered.length}>
          Xuất JSON
        </button>
      </div>
      <p className="muted">
        Tự lưu tối đa 200 trận hoàn tất gần nhất trên trình duyệt này. Đi ải, mô
        phỏng và từng vòng multiplayer được ghi riêng. Không ghi trận thoát giữa
        chừng; lịch sử không đồng bộ giữa các thiết bị.
      </p>
      <div className="analytics-filters">
        <label>
          Chế độ
          <select
            aria-label="Chế độ thống kê"
            value={mode}
            onChange={(e) => setMode(e.target.value as BattleMode | "all")}
          >
            <option value="all">Tất cả chế độ</option>
            {Object.entries(MODE_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Nhân vật
          <select
            aria-label="Nhân vật thống kê"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="all">Tất cả nhân vật</option>
            {ids.map((id) => (
              <option key={id} value={id}>
                {name(id)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="analytics-metrics">
        <div>
          <span>TRẬN ĐÃ LƯU</span>
          <strong>{filtered.length}</strong>
        </div>
        <div>
          <span>LƯỢT HẠ GỤC</span>
          <strong>
            {filtered.reduce((sum, record) => sum + record.kills.length, 0)}
          </strong>
        </div>
        <div>
          <span>NHÂN VẬT THAM GIA</span>
          <strong>{metrics.length}</strong>
        </div>
      </div>
      <h3>Trang bị đang sử dụng</h3>
      <div className="analytics-current">
        {equipment.map((unit, i) => (
          <article key={i}>
            <b>
              {name(unit.characterId || unit.classId)} · Lv.{unit.level}
            </b>
            <span>{gear(unit)}</span>
          </article>
        ))}
      </div>
      {!filtered.length ? (
        <p className="analytics-empty">
          Chưa có trận phù hợp. Hoàn tất một trận Đi ải hoặc Mô phỏng để bắt đầu
          thu thập số liệu.
        </p>
      ) : (
        <>
          <h3>Hiệu quả theo nhân vật</h3>
          <p className="muted">
            Tỉ lệ thắng = lượt nhân vật thuộc đội thắng / tổng lượt ra sân. Nhân
            vật trùng tính theo từng lượt; đây là kết quả đội.
          </p>
          <div className="analytics-table-wrap">
            <table>
              <thead>
                <tr>
                  {[
                    "Nhân vật",
                    "Ra sân",
                    "Thắng",
                    "Tỉ lệ thắng",
                    "Hạ gục",
                    "Bị hạ",
                  ].map((label) => (
                    <th key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((row) => (
                  <tr key={row.id}>
                    <td>{name(row.id)}</td>
                    <td>{row.games}</td>
                    <td>{row.wins}</td>
                    <td>
                      {((row.wins * 100) / row.games).toLocaleString("vi-VN", {
                        maximumFractionDigits: 1,
                      })}
                      %
                    </td>
                    <td>{row.kills}</td>
                    <td>{row.deaths}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3>Nhân vật nào hạ gục nhân vật nào</h3>
          <p className="muted">
            Đếm đòn kết liễu từ engine. Tự sát, môi trường hoặc đồng đội không
            tính là hạ gục đối thủ.
          </p>
          <div className="analytics-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nhân vật hạ gục</th>
                  <th>Nhân vật bị hạ</th>
                  <th>Số lần</th>
                </tr>
              </thead>
              <tbody>
                {matchups.map((row) => (
                  <tr key={`${row.source}:${row.target}`}>
                    <td>{name(row.source)}</td>
                    <td>{name(row.target)}</td>
                    <td>{row.kills}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3>Lịch sử trận đấu</h3>
          <div className="analytics-history">
            {filtered.map((record) => (
              <details key={record.id}>
                <summary>
                  <b>
                    {MODE_LABELS[record.mode]}
                    {record.stage ? ` · Ải ${record.stage}` : ""}
                  </b>
                  <span>
                    {new Date(record.savedAt).toLocaleString("vi-VN")} ·{" "}
                    {(record.ticks / 30).toFixed(1)}s
                  </span>
                  <span>
                    Thắng:{" "}
                    {record.units.find((unit) => unit.team === record.winner)
                      ?.teamName || record.winner}
                  </span>
                </summary>
                <p className="muted">
                  Engine {record.version} · Seed{" "}
                  {record.seed ?? "ẩn bởi server"}
                </p>
                {record.tactics && (
                  <p>
                    Liên kết: {record.tactics.bonds} · Hội:{" "}
                    {record.tactics.groups}
                  </p>
                )}
                <div className="analytics-current">
                  {record.units.map((unit) => (
                    <article key={unit.id}>
                      <b>
                        {name(unit.characterId)} · Lv.{unit.level}
                      </b>
                      <small>
                        {unit.teamName} ·{" "}
                        {unit.team === record.winner ? "Thắng" : "Thua"}
                      </small>
                      <span>{gear(unit)}</span>
                    </article>
                  ))}
                </div>
                <ol className="analytics-kill-log">
                  {record.kills.map((kill, i) => (
                    <li key={i}>
                      {(kill.tick / 30).toFixed(1)}s ·{" "}
                      {name(
                        record.units.find((unit) => unit.id === kill.source)
                          ?.characterId || "Môi trường",
                      )}{" "}
                      →{" "}
                      {name(
                        record.units.find((unit) => unit.id === kill.target)
                          ?.characterId || "Không rõ",
                      )}
                    </li>
                  ))}
                </ol>
              </details>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
