import type { GameSettings } from "./gameSettings";
import { DAMAGE_PALETTE, SUPPORT_PALETTE } from "./rendering/damage-numbers";
import "./settings.css";
import { exportJourneyEvents } from "./telemetry";

export function SettingsPage({
  settings,
  onChange,
}: {
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
}) {
  const rows = [
    {
      key: "effects",
      name: "Hiện hiệu ứng",
      description:
        "Lửa, tia sáng, vệt vũ khí và hiệu ứng kỹ năng. Đạn, vũ khí và vùng tác động luôn được giữ lại.",
    },
    {
      key: "damageNumbers",
      name: "Hiện sát thương",
      description:
        "Số sát thương bật lên phía trên mục tiêu khi mất HP. Các hit liên tiếp được gộp để dễ đọc.",
    },
    {
      key: "recoveryNumbers",
      name: "Hiện hồi phục và khiên",
      description:
        "Hiện HP thực nhận, khiên và máu ảo được cộng thêm, với dấu + và màu riêng.",
    },
    {
      key: "reducedEffects",
      name: "Giảm hiệu ứng",
      description:
        "Giảm hạt sáng, chuyển động phụ và rung màn hình cho trận đấu nhẹ hơn.",
    },
    {
      key: "sound",
      name: "Âm thanh",
      description: "Bật âm thanh trong trận đấu.",
    },
  ] as const;
  return (
    <section className="settings-page" aria-label="Cài đặt">
      <div className="settings-heading">
        <span>TRẢI NGHIỆM TRẬN ĐẤU</span>
        <h2>Chơi theo cách bạn thích.</h2>
        <p>
          Áp dụng cho Đi ải, Mô phỏng và Multiplayer. Tự động lưu trên trình
          duyệt này.
        </p>
      </div>
      <button onClick={() => { const url = URL.createObjectURL(new Blob([exportJourneyEvents()], { type: "application/json" })); const link = document.createElement("a"); link.href = url; link.download = "circlewar-journey-events.json"; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }}>Xuất lịch sử trải nghiệm trên thiết bị</button>
      <div className="settings-options">
        {rows.map((row) => {
          const disabled = row.key === "reducedEffects" && !settings.effects;
          return (
            <label
              className={`settings-option${disabled ? " disabled" : ""}`}
              key={row.key}
            >
              <span className="settings-option-copy">
                <b>{row.name}</b>
                <span>{row.description}</span>
                {row.key === "recoveryNumbers" && (
                  <span
                    className="settings-damage-colors"
                    aria-label="Màu hồi phục và khiên"
                  >
                    {Object.entries(SUPPORT_PALETTE).map(([type, palette]) => (
                      <small
                        key={type}
                        style={{
                          color: `#${palette.color.toString(16).padStart(6, "0")}`,
                        }}
                      >
                        {palette.label}
                      </small>
                    ))}
                  </span>
                )}
                {row.key === "damageNumbers" && (
                  <span
                    className="settings-damage-colors"
                    aria-label="Màu nguồn sát thương"
                  >
                    {Object.entries(DAMAGE_PALETTE).map(([type, palette]) => (
                      <small
                        key={type}
                        style={{
                          color: `#${palette.color.toString(16).padStart(6, "0")}`,
                        }}
                      >
                        {palette.label}
                      </small>
                    ))}
                  </span>
                )}
              </span>
              <span className="settings-toggle">
                <input
                  type="checkbox"
                  role="switch"
                  aria-label={row.name}
                  checked={settings[row.key]}
                  disabled={disabled}
                  onChange={(event) =>
                    onChange({ ...settings, [row.key]: event.target.checked })
                  }
                />
                <span aria-hidden="true" />
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
