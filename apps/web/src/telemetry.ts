const KEY = "circlewar-journey-events-v1";
export function journeyEvent(
  name: string,
  detail: Record<string, string | number | boolean> = {},
) {
  try {
    const previous = JSON.parse(localStorage.getItem(KEY) || "[]") as unknown[];
    localStorage.setItem(
      KEY,
      JSON.stringify([
        ...previous.slice(-1999),
        { name, at: Date.now(), detail },
      ]),
    );
  } catch {
    /* Diagnostics never prevent play or replace the profile journal. */
  }
}
export function exportJourneyEvents() {
  return localStorage.getItem(KEY) || "[]";
}
