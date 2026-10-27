export interface GameSettings {
  effects: boolean;
  damageNumbers: boolean;
  recoveryNumbers: boolean;
  reducedEffects: boolean;
  sound: boolean;
}

export const SETTINGS_KEY = "circlewar-settings-v1";
export const DEFAULT_SETTINGS: GameSettings = {
  effects: true,
  damageNumbers: false,
  recoveryNumbers: true,
  reducedEffects: false,
  sound: false,
};

export function readSettings(storage?: Pick<Storage, "getItem">): GameSettings {
  try {
    const saved = JSON.parse(
      (storage ?? localStorage).getItem(SETTINGS_KEY) || "{}",
    );
    return Object.fromEntries(
      Object.entries(DEFAULT_SETTINGS).map(([key, fallback]) => [
        key,
        typeof saved?.[key] === "boolean" ? saved[key] : fallback,
      ]),
    ) as unknown as GameSettings;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(
  settings: GameSettings,
  storage?: Pick<Storage, "setItem">,
) {
  try {
    (storage ?? localStorage).setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* Keep session preferences when storage is unavailable. */
  }
}
