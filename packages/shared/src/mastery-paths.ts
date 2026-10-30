import type { MasteryDefinition } from "./mastery";
import { FORM_PATHS } from "./mastery-forms";

/** Stable save IDs. Budgets live in attack geometry and cadence. */
export const MASTERY_PATHS: MasteryDefinition[] = Object.entries(
  FORM_PATHS,
).flatMap(([characterId, entries]) =>
  entries.map((entry, index) => ({
    id: `${characterId}:${["pressure", "resolve", "tempo"][index]}`,
    characterId,
    ...entry,
    goal: [3, 8, 15][index],
    legacy: false,
    targeted: false,
    summary: entry.role,
  })),
);
