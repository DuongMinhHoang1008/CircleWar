import { useEffect, useMemo, useRef, useState } from "react";
import {
  character,
  type CharacterId,
} from "../../../packages/shared/src/catalog";
import {
  masteriesFor,
  masteryInfo,
} from "../../../packages/shared/src/mastery";
import { ENGINE_VERSION } from "../../../packages/battle-engine/src/types";
import type { RecordedReplayInfo } from "../../../packages/shared/src/room";
import { Arena } from "./rendering/Arena";
import { buildMasteryPreview } from "./masteryPreviewBattle";

export function MasteryPreview({
  characterId,
  initialMasteryId,
  onClose,
}: {
  characterId: CharacterId;
  initialMasteryId?: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState(initialMasteryId || ""),
    [run, setRun] = useState(0),
    [error, setError] = useState("");
  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);
  const playback = useMemo(() => {
    const data = buildMasteryPreview(characterId, selected || undefined);
    const replay: RecordedReplayInfo = {
      format: 1,
      version: ENGINE_VERSION,
      game: 1,
      round: 1,
      config: data.config,
      configHash: "",
      finalHash: "",
      start: Date.now() + 500,
      totalTicks: data.totalTicks,
      chunks: [
        {
          index: 0,
          fromTick: 0,
          toTick: data.totalTicks,
          count: data.frames.length,
          hash: "",
          bytes: 0,
        },
      ],
    };
    return { ...data, replay };
  }, [characterId, selected, run]);
  const skill = masteryInfo(selected);
  return (
    <dialog
      className="mastery-preview"
      ref={dialog}
      aria-labelledby="mastery-preview-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="mastery-preview-heading">
        <div>
          <small>SÂN THỬ · LV.10</small>
          <h2 id="mastery-preview-title">
            {character(characterId)?.name} · Cách đánh
          </h2>
        </div>
        <button aria-label="Đóng sân thử Bí kỹ" onClick={onClose}>
          Đóng ✕
        </button>
      </div>
      <p>
        Đổi nhánh để so cùng đội hình và tình huống. Super được nạp đầy đầu mỗi
        lượt; một đồng đội bắt đầu ở 70% HP để thử hỗ trợ. Sân thử không cộng
        tiến độ hoặc phần thưởng.
      </p>
      <div
        className="mastery-preview-choices"
        role="group"
        aria-label="So sánh nhánh Bí kỹ"
      >
        <button
          aria-pressed={!selected}
          onClick={() => {
            setSelected("");
            setError("");
          }}
        >
          Chưa lắp Bí kỹ
        </button>
        {masteriesFor(characterId).map((m) => (
          <button
            key={m.id}
            aria-pressed={selected === m.id}
            onClick={() => {
              setSelected(m.id);
              setError("");
            }}
          >
            {m.name}
          </button>
        ))}
      </div>
      <div className="mastery-preview-description">
        <b>{skill?.name || "Bộ kỹ năng gốc"}</b>
        <p>{skill?.description || character(characterId)?.weapon}</p>
        {skill && <small>Giới hạn: {skill.tradeoff}</small>}
      </div>
      {error && <p role="alert">{error}</p>}
      <Arena
        key={`${selected}:${run}`}
        config={playback.config}
        seed={playback.seed}
        replay={playback.replay}
        loadReplayChunk={async () => playback.frames}
        sandboxReplay
        muted
        low={false}
        showEffects
        showDamage
        showRecovery
        onError={setError}
        highlightTeamId="team-player"
        label="Sân thử Bí kỹ"
      />
      <button onClick={() => setRun((n) => n + 1)}>Xem lại lượt thử</button>
    </dialog>
  );
}
