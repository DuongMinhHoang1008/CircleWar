import { describe, expect, it } from "vitest";
import {
  claimMail,
  deliverMail,
  mergeMailbox,
  queuedPackCount,
  updateMail,
  validMailbox,
  welcomeMail,
} from "../../packages/shared/src/mailbox";
import {
  commitLocalProfile,
  readLocalProfile,
} from "../../apps/web/src/profileStorage";

const now = 1_800_000_000_000;
const profile = (packs = 0) => ({
  packs,
  lastPackAt: now,
  mailbox: [welcomeMail(now)],
});

describe("gift mailbox", () => {
  it("delivers gifts once without filling or clipping the pack queue", () => {
    const before = profile(150);
    const after = deliverMail(before, updateMail("release-2", now));
    expect(after.packs).toBe(150);
    expect(after.mailbox).toHaveLength(2);
    expect(after.mailbox[1].packs).toBe(50);
    expect(deliverMail(after, updateMail("release-2", now + 1))).toBe(after);
  });

  it("credits the portion that fits and retains the remainder", () => {
    const before = profile(101);
    const after = claimMail(before, "welcome", now);
    expect(after.packs).toBe(150);
    expect(after.mailbox[0].claimedPacks).toBe(49);
    expect(after.mailbox[0].claimedAt).toBeUndefined();
    expect(claimMail({ ...after, packs: 149 }, "welcome", now).mailbox[0].claimedAt).toBe(now);
    expect(before.packs).toBe(101);
    expect(before.mailbox[0].claimedAt).toBeUndefined();
  });

  it("accepts an exact fit and cannot credit a claimed letter twice", () => {
    const after = claimMail(profile(100), "welcome", now);
    expect(after.packs).toBe(150);
    expect(after.mailbox[0].claimedAt).toBe(now);
    expect(claimMail(after, "welcome", now + 60_000)).toBe(after);
    expect(() => claimMail(after, "missing", now)).toThrow("Không tìm thấy");
  });

  it("checks freshly regenerated packs at claim time", () => {
    const before = profile(99);
    expect(queuedPackCount(before, now + 120_000)).toBe(101);
    expect(claimMail(before, "welcome", now + 120_000).mailbox[0].claimedPacks).toBe(49);
    expect(claimMail(before, "welcome", now + 60_000).packs).toBe(150);
  });

  it("preserves partial recharge progress unless claiming fills the queue", () => {
    const after = claimMail(profile(10), "welcome", now + 150_000);
    expect(after.packs).toBe(62);
    expect(after.lastPackAt).toBe(now + 120_000);
    expect(queuedPackCount(after, now + 180_000)).toBe(63);
    const full = claimMail(profile(99), "welcome", now + 90_000);
    expect(full.lastPackAt).toBe(now + 90_000);
    expect(queuedPackCount({ ...full, packs: 149 }, now + 100_000)).toBe(149);
  });

  it("persists the queue credit and claim receipt together through reload", () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value);
      },
    };
    const after = claimMail(profile(0), "welcome", now);
    commitLocalProfile(storage, after);
    const restored = readLocalProfile<typeof after>(storage)!;
    expect(restored.packs).toBe(50);
    expect(claimMail(restored, "welcome", now + 1)).toBe(restored);
    expect(mergeMailbox(after.mailbox, profile().mailbox)[0].claimedAt).toBe(
      now,
    );
  });

  it("validates persisted letters and rejects duplicate or malformed gifts", () => {
    expect(validMailbox(profile().mailbox)).toBe(true);
    expect(validMailbox([welcomeMail(now), welcomeMail(now)])).toBe(false);
    for (const bad of [
      null,
      { packs: 151 },
      { packs: -1 },
      { packs: "50" },
      { claimedAt: now - 1 },
    ])
      expect(validMailbox([bad && { ...welcomeMail(now), ...bad }])).toBe(
        false,
      );
  });
});
