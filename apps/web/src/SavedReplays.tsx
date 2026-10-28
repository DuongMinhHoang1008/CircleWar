import { useState } from "react";
import { Arena } from "./rendering/Arena";
import { ENGINE_VERSION } from "../../../packages/battle-engine/src/types";
import type { BattleRecord } from "./battleAnalytics";
import type { GameSettings } from "./gameSettings";
export function SavedReplays({
  records,
  settings,
  onError,
}: {
  records: BattleRecord[];
  settings: GameSettings;
  onError: (message: string) => void;
}) {
  const [selected, setSelected] = useState<BattleRecord | null>(null),
    [nonce, setNonce] = useState(0);
  const available = records.filter(
    (r) => r.config && r.seed !== undefined && r.version === ENGINE_VERSION,
  );
  return (
    <details className="preset-bar">
      <summary>
        Xem lại trận đã lưu · {available.length} replay tương thích
      </summary>
      <p>
        Replay được dựng lại từ cấu hình đầu trận và seed, dùng đúng phiên bản
        engine. Lịch sử cũ thiếu cấu hình hoặc khác phiên bản vẫn xem được thống
        kê.
      </p>
      <select
        aria-label="Chọn replay"
        value={selected?.id || ""}
        onChange={(e) => {
          setSelected(available.find((r) => r.id === e.target.value) || null);
          setNonce((n) => n + 1);
        }}
      >
        <option value="">Chọn trận</option>
        {available.map((r) => (
          <option key={r.id} value={r.id}>
            {new Date(r.savedAt).toLocaleString("vi-VN")} · {r.mode}
            {r.stage ? ` · ải ${r.stage}` : ""} · {(r.ticks / 30).toFixed(1)}s
          </option>
        ))}
      </select>
      {selected?.config && (
        <>
          <button onClick={() => setNonce((n) => n + 1)}>Xem lại từ đầu</button>
          <Arena
            key={`${selected.id}:${nonce}`}
            config={selected.config}
            seed={selected.seed!}
            loadReplayChunk={async () => []}
            muted={!settings.sound}
            low={settings.reducedEffects}
            showEffects={settings.effects}
            showDamage={settings.damageNumbers}
            showRecovery={settings.recoveryNumbers}
            onError={onError}
            label="REPLAY ĐÃ LƯU · không nhận thưởng"
          />
        </>
      )}
    </details>
  );
}
