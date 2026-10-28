import type { BattleState } from "./types";

const isResultEvent = (type: string) =>
  type === "kill" || type.startsWith("bond:") || type.startsWith("group:") || type.startsWith("resonance:");

/** Preserve bounded kill/synergy totals for replay analytics, plus 120 recent visual events. */
export function retainCombatEvents(state: BattleState) {
  let visual = 0,
    from = state.events.length;
  while (from > 0 && visual < 120) {
    from--;
    if (!isResultEvent(state.events[from].type)) visual++;
  }
  let write = 0;
  for (let i = 0; i < state.events.length; i++) {
    const event = state.events[i];
    if (i >= from || isResultEvent(event.type)) state.events[write++] = event;
  }
  state.events.length = write;
}
