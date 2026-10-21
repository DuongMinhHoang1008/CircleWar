import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PackOpeningScene, visiblePackOrders } from "../../apps/web/src/PackOpeningScene";
import { PROFILE_KEY, acknowledgeProfile, commitLocalProfile, readLocalProfile, readProfileJournal } from "../../apps/web/src/profileStorage";

function storage() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
}

describe("bulk pack recovery", () => {
  it("keeps at most 15 rendered packs for the entire 100-pack sequence", () => {
    const seen = new Set<number>();
    const pulls = Array.from({ length: 100 }, (_, id) => ({ id: String(id), kind: "item", tier: "T4", rarity: "Huyền thoại" }));
    for (let opened = 0; opened <= 100; opened++) {
      const orders = visiblePackOrders(100, opened);
      expect(orders.length).toBeLessThanOrEqual(15);
      orders.forEach(order => seen.add(order));
      const html = renderToStaticMarkup(React.createElement(PackOpeningScene, { pulls, openedCount: opened }));
      expect((html.match(/aria-label="Pack lớp/g) || []).length).toBe(orders.length);
    }
    expect(seen.size).toBe(100);
  });

  it("recovers all rewards and the matching debit after animation failure or reload", () => {
    const local = storage();
    const before = { packs: 100, cards: 1, xp: 0, pity: 99 };
    const after = { packs: 0, cards: 41, xp: 60 * 20, pity: 0 };
    local.setItem(PROFILE_KEY, JSON.stringify(before));
    const receipt = { count: 100, pulls: ["char_26", "item_30"] };
    const saved = commitLocalProfile(local, after, receipt);
    // Reload sees the complete committed profile, before any network ACK.
    expect(readLocalProfile(local)).toEqual(after);
    expect(readProfileJournal(local)?.receipt).toEqual(receipt);
    expect(readProfileJournal(local)?.pending).toBe(true);
    acknowledgeProfile(local, saved.revision);
    expect(readProfileJournal(local)?.pending).toBe(false);
    expect(readLocalProfile(local)).toEqual(after);
  });

  it("does not clear a newer pending draw when an older cloud request finishes", () => {
    const local = storage();
    const first = commitLocalProfile(local, { packs: 100 });
    const second = commitLocalProfile(local, { packs: 0, cards: 100 });
    acknowledgeProfile(local, first.revision);
    expect(readProfileJournal(local)?.revision).toBe(second.revision);
    expect(readProfileJournal(local)?.pending).toBe(true);
  });

  it("does not spend packs if the atomic journal cannot be saved", () => {
    const local = storage();
    local.setItem(PROFILE_KEY, JSON.stringify({ packs: 100 }));
    const full = { getItem: local.getItem, setItem: () => { throw Error("quota"); } };
    expect(() => commitLocalProfile(full, { packs: 0 })).toThrow("quota");
    expect(readLocalProfile(local)).toEqual({ packs: 100 });
  });

  it("retains a committed draw if only the compatibility mirror fails", () => {
    const local = storage();
    const partial = { getItem: local.getItem, setItem: (key: string, value: string) => { if (key === PROFILE_KEY) throw Error("quota"); local.setItem(key, value); } };
    commitLocalProfile(partial, { packs: 0, cards: 100 });
    expect(readLocalProfile(partial)).toEqual({ packs: 0, cards: 100 });
  });
});
