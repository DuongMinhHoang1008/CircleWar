import { useEffect, useMemo, useState } from "react";
import { CATALOG_ITEMS } from "../../../packages/shared/src/catalog";
import { characterKit } from "../../../packages/shared/src/character-kits";
import "./battleAnalytics.css";

interface AuditRow {
  id: string;
  name: string;
  role: string;
  games: number;
  winRate: number;
  lossRate: number;
  drawRate: number;
  survivalRate: number;
  averageDamage: number;
  dps: number;
  allyHealing: number;
  allyShielding: number;
  allyShieldAbsorbed: number;
  controlSeconds: number;
  allyBuffSeconds: number;
  buffs: number;
  debuffs: number;
  selfHealing: number;
  friendlyDamage: number;
  winInterval95: number[];
}
interface AuditPhase {
  id: string;
  mode: string;
  level: number;
  gear: boolean;
  battles: number;
  stalled: number;
  characters: AuditRow[];
}
interface AuditReport {
  engine: string;
  measuredAt: string;
  battles: number;
  stalled: number;
  phases: AuditPhase[];
  adjustments?: string[];
  comparison?: {
    id: string;
    name: string;
    phase: string;
    beforeWinRate: number;
    afterWinRate: number;
  }[];
}
const number = (value: number) =>
  value.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
const roles: Record<string, string> = {
  tank: "Hộ vệ",
  support: "Hỗ trợ",
  ranger: "Xạ thủ",
  controller: "Khống chế",
  fighter: "Đấu sĩ",
  assassin: "Sát thủ",
};
const phaseName = (phase: AuditPhase) =>
  `${phase.mode === "solo" ? "Đấu đơn" : phase.mode === "team" ? "Đấu đội 3v3" : "6 đội tự do"} · Lv.${phase.level} · ${phase.gear ? "Đồ hợp cạ" : "Không trang bị"}`;

export function BalanceAuditPage() {
  const [report, setReport] = useState<AuditReport>();
  const [phaseId, setPhase] = useState("team-10-affinity");
  const [sort, setSort] = useState<keyof AuditRow>("winRate");
  const [error, setError] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    fetch(`${import.meta.env.BASE_URL}balance-audit.json`, {
      signal: abort.signal,
    })
      .then((response) => {
        if (!response.ok) throw Error("Missing report");
        return response.json();
      })
      .then((value) => {
        if (
          !value ||
          typeof value !== "object" ||
          !("phases" in value) ||
          !Array.isArray(value.phases)
        )
          throw Error("Invalid report");
        setReport(value as AuditReport);
      })
      .catch(() => {
        if (!abort.signal.aborted) setError(true);
      });
    return () => abort.abort();
  }, []);
  const phase =
    report?.phases.find((p) => p.id === phaseId) ?? report?.phases[0];
  const rows = useMemo(
    () =>
      [...(phase?.characters ?? [])].sort(
        (a, b) => Number(b[sort]) - Number(a[sort]) || a.id.localeCompare(b.id),
      ),
    [phase, sort],
  );
  if (!report)
    return (
      <section className="profile-screen analytics-screen">
        <p>
          {error
            ? "Chưa tải được báo cáo cân bằng."
            : "Đang tải báo cáo cân bằng…"}
        </p>
      </section>
    );
  return (
    <section className="profile-screen analytics-screen">
      <div className="panel-title">
        <h2>Kiểm tra cân bằng nhân vật</h2>
        <a
          href={`${import.meta.env.BASE_URL}balance-audit.json`}
          download="circlewar-can-bang.json"
        >
          Tải JSON
        </a>
      </div>
      <p className="muted">
        Mẫu mô phỏng offline trên {report.engine}, cùng cấp và điều kiện trang
        bị. Đấu đơn đổi hai phía xuất phát; đấu đội giữ hai đồng đội giống nhau
        giữa hai phe và luân phiên ba kiểu đội hình. Các dạng biến hình được
        tính ở mẫu có đồ hợp cạ.
      </p>
      <p className="muted">
        Sống tới cuối = còn HP khi trận kết thúc. Hỗ trợ tách riêng đồng đội và
        bản thân; khống chế tính thời gian thực tác động lên từng mục tiêu, gộp
        các trạng thái chồng nhau của cùng nguồn. Dữ liệu thực chiến của bạn nằm
        ở Phân tích số liệu.
      </p>
      <div className="analytics-metrics">
        <div>
          <span>TRẬN MÔ PHỎNG</span>
          <strong>{number(report.battles)}</strong>
        </div>
        <div>
          <span>NHÂN VẬT</span>
          <strong>{rows.length}</strong>
        </div>
        <div>
          <span>TRẬN CHƯA KẾT THÚC</span>
          <strong>{report.stalled}</strong>
        </div>
      </div>
      {!!report.adjustments?.length && (
        <section className="audit-changes">
          <h3>Đã cân bằng</h3>
          <ul>
            {report.adjustments.map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
          <div className="audit-comparisons">
            {report.comparison?.map((row) => (
              <article key={`${row.id}-${row.phase}`}>
                <b>{row.name}</b>
                <span>
                  {row.phase.startsWith("solo") ? "Đấu đơn" : "Đấu đội"} · Lv.
                  {row.phase.split("-")[1]} · Đồ hợp cạ
                </span>
                <strong>
                  {number(row.beforeWinRate)}% → {number(row.afterWinRate)}%
                </strong>
              </article>
            ))}
          </div>
          <p className="muted">
            Tỉ lệ thắng trước/sau trên cùng bộ mẫu gốc. Bảng bên dưới gộp thêm
            seed kiểm chứng riêng cho đấu đơn và đấu đội Lv.10.
          </p>
        </section>
      )}
      <div className="analytics-filters">
        <label>
          Mẫu kiểm tra
          <select
            aria-label="Mẫu kiểm tra cân bằng"
            value={phase?.id}
            onChange={(event) => setPhase(event.target.value)}
          >
            {report.phases.map((phase) => (
              <option key={phase.id} value={phase.id}>
                {phaseName(phase)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sắp xếp theo
          <select
            aria-label="Sắp xếp cân bằng"
            value={sort}
            onChange={(event) => setSort(event.target.value as keyof AuditRow)}
          >
            {Object.entries({
              winRate: "Tỉ lệ thắng",
              survivalRate: "Sống tới cuối",
              averageDamage: "Sát thương",
              allyHealing: "Hồi máu đồng đội",
              allyShieldAbsorbed: "Khiên đỡ cho đồng đội",
              controlSeconds: "Thời gian khống chế",
              allyBuffSeconds: "Thời gian buff đồng đội",
            }).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="muted">
        {phase?.mode === "team"
          ? "Đo vị trí được thay đổi trong đội 3v3; hai quân đi kèm phục vụ làm đối chứng."
          : "Mỗi nhân vật được thử với nhiều đối thủ."}{" "}
        Các cột damage và support là trung bình mỗi lượt ra sân. Mẫu cố định còn
        phụ thuộc seed và đội hình; khoảng ước lượng nằm trong mô tả ô
        thắng/thua.
      </p>
      <div className="analytics-table-wrap">
        <table>
          <thead>
            <tr>
              {[
                "Nhân vật",
                "Số lượt",
                "Thắng / Thua",
                "Hoà",
                "Sống tới cuối",
                "ST gây",
                "DPS",
                "Hồi ĐĐ",
                "Khiên tạo ĐĐ",
                "Khiên đỡ ĐĐ",
                "Buff ĐĐ",
                "Debuff",
                "Khống chế (s)",
                "Buff ĐĐ (s)",
              ].map((label) => (
                <th key={label}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const item = CATALOG_ITEMS.find(
                (item) => item.affinity === row.id,
              )?.id;
              return (
                <tr key={row.id}>
                  <td>
                    <b>
                      {characterKit(row.id, phase?.gear && item ? [item] : [])
                        ?.name || row.name}
                    </b>
                    <small className="audit-role">
                      {roles[row.role] || row.role}
                    </small>
                  </td>
                  <td>{row.games}</td>
                  <td
                    title={`Khoảng ước lượng thắng 95%: ${row.winInterval95.map(number).join("–")}%`}
                  >
                    {number(row.winRate)}% / {number(row.lossRate)}%
                  </td>
                  <td>{number(row.drawRate)}%</td>
                  <td>{number(row.survivalRate)}%</td>
                  <td>{number(row.averageDamage)}</td>
                  <td>{number(row.dps)}</td>
                  <td>{number(row.allyHealing)}</td>
                  <td>{number(row.allyShielding)}</td>
                  <td>{number(row.allyShieldAbsorbed)}</td>
                  <td>{number(row.buffs)}</td>
                  <td>{number(row.debuffs)}</td>
                  <td>{number(row.controlSeconds)}</td>
                  <td>{number(row.allyBuffSeconds)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="muted">
        Đo lúc{" "}
        {new Date(report.measuredAt).toLocaleString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
        })}
        . Trận vượt giới hạn 180 giây được ghi là chưa kết thúc và giữ riêng
        khỏi tỉ lệ thắng/thua.
      </p>
    </section>
  );
}
