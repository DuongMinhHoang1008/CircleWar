export const PROFILE_KEY = "circlewar-player-profile-v1";
const JOURNAL_KEY = "circlewar-profile-journal-v1";
type StorageLike = Pick<Storage, "getItem" | "setItem">;
export type ProfileJournal<T, R = unknown> = { revision: string; pending: boolean; profile: T; receipt?: R };

export function readProfileJournal<T, R = unknown>(storage: StorageLike): ProfileJournal<T, R> | null {
  try {
    const value = JSON.parse(storage.getItem(JOURNAL_KEY) || "null");
    return value && typeof value.revision === "string" && typeof value.pending === "boolean" && value.profile ? value : null;
  } catch { return null; }
}

export function readLocalProfile<T>(storage: StorageLike): T | null {
  const journal = readProfileJournal<T>(storage);
  if (journal) return journal.profile;
  try { return JSON.parse(storage.getItem(PROFILE_KEY) || "null") as T | null; }
  catch { return null; }
}

// One atomic journal write contains both the debit and all rewards. Rendering may
// fail afterwards without losing the draw. The old key is only a compatibility mirror.
export function commitLocalProfile<T, R = unknown>(storage: StorageLike, profile: T, receipt?: R, pending = true): ProfileJournal<T, R> {
  const previous = readProfileJournal<T, R>(storage);
  const journal = { revision: crypto.randomUUID(), pending, profile, receipt: receipt ?? previous?.receipt };
  storage.setItem(JOURNAL_KEY, JSON.stringify(journal));
  try { storage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch { /* Journal is already durable. */ }
  return journal;
}

export function acknowledgeProfile<T>(storage: StorageLike, revision: string) {
  const journal = readProfileJournal<T>(storage);
  // An older request must never mark a newer local change as synchronized.
  if (journal?.revision === revision) storage.setItem(JOURNAL_KEY, JSON.stringify({ ...journal, pending: false }));
}
