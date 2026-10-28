import { useState } from "react";
import { computeStats } from "../../../packages/shared/src/balance";
import {
  character,
  CATALOG_ITEMS,
  itemInfo,
  ROSTER,
  isTransformedCharacter,
  type CharacterId,
} from "../../../packages/shared/src/catalog";
import {
  applyPreset,
  experienceOf,
  presetMissing,
  profileLoadouts,
  toggleLock,
  type CollectionProfile,
  type TeamPreset,
} from "../../../packages/shared/src/experience";
import {
  cardEvolution,
  cardEffectiveEvolution,
} from "../../../packages/shared/src/progression";
import { Portrait, ItemSprite, TeamChoices, type Inspect } from "./GameCatalog";
import { journeyEvent } from "./telemetry";

type Props = {
  profile: CollectionProfile;
  onChange: (changes: Partial<CollectionProfile>) => void;
  disabled?: boolean;
  onError: (message: string) => void;
};
export function PresetBar({ profile, onChange, disabled, onError }: Props) {
  const [name, setName] = useState(""),
    [selected, setSelected] = useState(""),
    [previous, setPrevious] = useState<TeamPreset | null>(null);
  const experience = experienceOf(profile);
  function save(replace = false) {
    if (disabled) return;
    const existing = experience.presets.find((p) => p.id === selected);
    if (!replace && experience.presets.length >= 5)
      return onError("Đã có 5 preset. Chọn preset để ghi đè hoặc xóa.");
    const preset: TeamPreset = {
      id: replace && existing ? existing.id : crypto.randomUUID(),
      name: (
        name.trim() ||
        existing?.name ||
        `Đội ${experience.presets.length + 1}`
      ).slice(0, 40),
      team: [...profile.team],
      equipment: structuredClone(profile.equipment),
      masteries: structuredClone(experience.masteries || {}),
    };
    onChange({
      experience: {
        ...experience,
        presets:
          replace && existing
            ? experience.presets.map((p) => (p.id === existing.id ? preset : p))
            : [...experience.presets, preset],
      },
    });
    setSelected(preset.id);
    setName(preset.name);
  }
  function apply(preset: TeamPreset) {
    try {
      const next = applyPreset(profile, preset);
      setPrevious({
        masteries: structuredClone(experienceOf(profile).masteries || {}),
        id: "undo",
        name: "Đội trước",
        team: [...profile.team],
        equipment: structuredClone(profile.equipment),
      });
      onChange({
        team: next.team,
        equipment: next.equipment,
        experience: next.experience,
      });
      journeyEvent("preset_apply", { slots: next.team.length });
    } catch (e) {
      onError((e as Error).message);
    }
  }
  const current = experience.presets.find((p) => p.id === selected);
  return (
    <section className="preset-bar" aria-label="Preset đội hình">
      <h3>
        Đội hình đã lưu <small>{experience.presets.length}/5</small>
      </h3>
      <div className="preset-chips">
        {experience.presets.map((p) => (
          <button
            key={p.id}
            disabled={disabled}
            title={presetMissing(profile, p).join(", ")}
            onClick={() => {
              setSelected(p.id);
              setName(p.name);
              apply(p);
            }}
          >
            {p.name}
            {presetMissing(profile, p).length ? " · thiếu thẻ" : ""}
          </button>
        ))}
        {!experience.presets.length && (
          <p>Lưu đội để đổi build chỉ bằng một chạm.</p>
        )}
      </div>
      <div className="action-row">
        <input
          aria-label="Tên preset"
          value={name}
          maxLength={40}
          placeholder="Tên đội hình"
          onChange={(e) => setName(e.target.value)}
        />
        <button
          disabled={disabled || experience.presets.length >= 5}
          onClick={() => save()}
        >
          Lưu đội mới
        </button>
        {current && (
          <>
            <button disabled={disabled} onClick={() => save(true)}>
              Ghi đè {current.name}
            </button>
            <button
              disabled={disabled || experience.presets.length >= 5}
              onClick={() =>
                onChange({
                  experience: {
                    ...experience,
                    presets: [
                      ...experience.presets,
                      {
                        ...structuredClone(current),
                        id: crypto.randomUUID(),
                        name: `${current.name.slice(0, 32)} bản sao`,
                      },
                    ],
                  },
                })
              }
            >
              Sao chép
            </button>
            <button
              disabled={disabled}
              onClick={() =>
                onChange({
                  experience: {
                    ...experience,
                    presets: experience.presets.map((p) =>
                      p.id === selected
                        ? { ...p, name: name.trim().slice(0, 40) || p.name }
                        : p,
                    ),
                  },
                })
              }
            >
              Đổi tên
            </button>
            <button
              disabled={disabled}
              onClick={() => {
                onChange({
                  experience: {
                    ...experience,
                    presets: experience.presets.filter(
                      (p) => p.id !== selected,
                    ),
                  },
                });
                setSelected("");
              }}
            >
              Xóa preset
            </button>
          </>
        )}
        {previous && (
          <button
            disabled={disabled}
            onClick={() => {
              try {
                const next = applyPreset(profile, previous);
                onChange({
                  team: next.team,
                  equipment: next.equipment,
                  experience: next.experience,
                });
                setPrevious(null);
              } catch (e) {
                onError((e as Error).message);
              }
            }}
          >
            Khôi phục đội trước
          </button>
        )}
      </div>
      {disabled && (
        <p role="status">Đội đang khóa trong trận hoặc đã sẵn sàng.</p>
      )}
    </section>
  );
}
