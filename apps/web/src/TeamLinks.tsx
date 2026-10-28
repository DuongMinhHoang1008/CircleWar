import {
  BONDS,
  FRIEND_GROUPS,
  character,
  groupTier,
} from "../../../packages/shared/src/catalog";
import {
  synergySignature,
  SYNERGY_RULE,
  canResonate,
} from "../../../packages/shared/src/synergy";
import type { Loadout } from "../../../packages/shared/src/balance";

export function TeamLinks({ units }: { units: Loadout[] }) {
  const ids = units.map((u) => u.characterId),
    links = [
      ...BONDS.filter((b) =>
        b.members.every((id) => ids.includes(id as (typeof ids)[number])),
      ).map((b) => ({
        id: b.id,
        name: b.name,
        tier: b.size,
        text: b.description,
      })),
      ...FRIEND_GROUPS.filter((g) => groupTier(g, ids)).map((g) => ({
        id: g.id,
        name: g.name,
        tier: groupTier(g, ids),
        text: groupTier(g, ids) === 3 ? g.three : g.two,
      })),
    ],
    active = links.filter((link) => canResonate(link.id)),
    passive = links.filter((link) => !canResonate(link.id));
  const missing = BONDS.filter(
    (b) =>
      b.members.some((id) => ids.includes(id as (typeof ids)[number])) &&
      b.members.filter((id) => !ids.includes(id as (typeof ids)[number]))
        .length === 1,
  ).slice(0, 3);
  return (
    <div className="team-links" aria-label="Liên kết đội hình">
      {active.length ? (
        <div className="team-links-active">
          {active.map((link) => (
            <details key={link.id}>
              <summary>
                <b>✦ {link.name}</b>
                <span>
                  {link.tier} quân ·{" "}
                  {canResonate(link.id)
                    ? synergySignature(link.id).name
                    : "Hội bị động"}
                </span>
              </summary>
              <p>{link.text}</p>
              {canResonate(link.id) && <small>{SYNERGY_RULE}</small>}
            </details>
          ))}
        </div>
      ) : (
        <p className="team-links-empty">
          Chưa có Cộng hưởng · ghép đúng đồng đội để mở hiệu ứng đặc biệt.
        </p>
      )}
      {passive.length > 0 && (
        <details className="team-links-suggestions">
          <summary>Hội bị động · {passive.length} đang bật</summary>
          {passive.map((link) => (
            <p key={link.id}>
              <b>
                {link.name} · mốc {link.tier}
              </b>
              <br />
              {link.text}
            </p>
          ))}
        </details>
      )}
      {missing.length > 0 && (
        <details className="team-links-suggestions">
          <summary>Gợi ý ghép đội</summary>
          {missing.map((b) => (
            <p key={b.id}>
              <b>{b.name}</b> · thêm{" "}
              {b.members
                .filter((id) => !ids.includes(id as (typeof ids)[number]))
                .map((id) => character(id)?.name)
                .join(", ")}{" "}
              → {synergySignature(b.id).name}
            </p>
          ))}
        </details>
      )}
    </div>
  );
}
