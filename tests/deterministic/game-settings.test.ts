import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  readSettings,
  saveSettings,
} from "../../apps/web/src/gameSettings";

describe("game display preferences", () => {
  it("keeps floating damage off by default without overwriting an explicit choice", () => {
    expect(readSettings({ getItem: () => null }).damageNumbers).toBe(false);
    expect(
      readSettings({ getItem: () => '{"damageNumbers":true}' }).damageNumbers,
    ).toBe(true);
  });
  it("uses safe defaults for missing, invalid or inaccessible storage", () => {
    for (const value of [
      null,
      "{",
      "null",
      "[]",
      '{"effects":"false","damageNumbers":0}',
    ]) {
      expect(readSettings({ getItem: () => value })).toEqual(DEFAULT_SETTINGS);
    }
    expect(
      readSettings({
        getItem: () => {
          throw Error("Unavailable");
        },
      }),
    ).toEqual(DEFAULT_SETTINGS);
  });
  it("persists independent preferences and ignores unknown fields", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };
    const preferences = {
      ...DEFAULT_SETTINGS,
      effects: false,
      damageNumbers: true,
      sound: true,
    };
    saveSettings(preferences, storage);
    expect(readSettings(storage)).toEqual(preferences);
    values.set(SETTINGS_KEY, '{"effects":false,"extra":true}');
    expect(readSettings(storage)).toEqual({
      ...DEFAULT_SETTINGS,
      effects: false,
    });
    expect(() =>
      saveSettings(preferences, {
        setItem: () => {
          throw Error("Full");
        },
      }),
    ).not.toThrow();
  });
});
