import { useState } from "react";
import {
  createBattle,
  stepBattle,
} from "../../../packages/battle-engine/src/index";
import {
  adventureConfig,
  weeklyEnemies,
  stableSeed,
  weekId,
} from "../../../packages/shared/src/adventure";
import {
  applyPreset,
  experienceOf,
  profileLoadouts,
  presetMissing,
  type CollectionProfile,
} from "../../../packages/shared/src/experience";
export function BuildLab({ profile }: { profile: CollectionProfile }) {
  const [presetId, setPresetId] = useState(""),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [results, setResults] = useState<
      { group: string; current: number; alternative: number; count: number }[]
    >([]),
    [error, setError] = useState("");
  const presets = experienceOf(profile).presets;
  async function compare() {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;
    setBusy(true);
    setProgress(0);
    setResults([]);
    setError("");
    try {
      const teams = [
          profileLoadouts(profile),
          profileLoadouts(applyPreset(profile, preset)),
        ],
        data = [
          { group: "Seed luyện tập", current: 0, alternative: 0, count: 3 },
          { group: "Seed kiểm chứng", current: 0, alternative: 0, count: 3 },
        ];
      for (let n = 0; n < 6; n++)
        for (let side = 0; side < 2; side++) {
          const seed = stableSeed(`${weekId()}:build-lab:${n}`),
            state = createBattle(
              adventureConfig(teams[side], weeklyEnemies(weekId(), n % 3)),
              seed,
            );
          while (!state.finished && state.tick < 5400) {
            for (
              let tick = 0;
              tick < 240 && !state.finished && state.tick < 5400;
              tick++
            )
              stepBattle(state);
            await new Promise((resolve) => window.setTimeout(resolve, 0));
          }
          const won =
            state.finished &&
            state.fighters.some((f) => f.team === "team-player" && f.hp > 0) &&
            !state.fighters.some((f) => f.team === "team-rival" && f.hp > 0);
          if (won) {
            if (side === 0) data[Math.floor(n / 3)].current++;
            else data[Math.floor(n / 3)].alternative++;
          }
          setProgress(n * 2 + side + 1);
        }
      setResults(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="preset-bar">
      <summary>Phòng so sánh build · cùng đối thủ và seed</summary>
      <p>
        Đối chiếu đội hiện tại với một preset trên ba seed luyện tập và ba seed
        kiểm chứng. Mỗi seed chạy cả hai build. Kết quả là mẫu nhỏ, không phải
        xác suất thắng chung.
      </p>
      <select
        aria-label="Preset so sánh"
        value={presetId}
        disabled={busy}
        onChange={(e) => setPresetId(e.target.value)}
      >
        <option value="">Chọn preset thay thế</option>
        {presets.map((p) => (
          <option
            key={p.id}
            value={p.id}
            disabled={presetMissing(profile, p).length > 0}
          >
            {p.name}
          </option>
        ))}
      </select>
      <button disabled={busy || !presetId} onClick={() => void compare()}>
        So sánh 12 trận
      </button>
      {busy && <p role="status">Đã chạy {progress}/12 trận…</p>}
      {error && <p role="alert">{error}</p>}
      {results.map((r) => (
        <p key={r.group}>
          {r.group}: đội hiện tại thắng {r.current}/{r.count}, preset thắng{" "}
          {r.alternative}/{r.count}.
        </p>
      ))}
    </details>
  );
}
