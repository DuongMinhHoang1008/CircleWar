import { character } from "../../../packages/shared/src/catalog";
import type { Inspect } from "./GameCatalog";
import { useState } from "react";
import { masteryInfo } from "../../../packages/shared/src/mastery";
import type { CharacterId } from "../../../packages/shared/src/catalog";
import { MasteryPreview } from "./MasteryPreview";
import {
  searchReference,
  REFERENCE_ENTRIES,
  type ReferenceTab,
} from "./catalogReferenceData";

export function CatalogReference({
  tab,
  search,
  filter,
  inspect,
}: {
  tab: ReferenceTab;
  search: string;
  filter: string;
  inspect: (value: Inspect) => void;
}) {
  const entries = searchReference(tab, search, filter);
  const [preview,setPreview]=useState<string>();
  return (
    <>
      <p className="catalog-result-count" role="status">
        {entries.length}/{REFERENCE_ENTRIES[tab].length} mục phù hợp
      </p>
      {tab === "statuses" && (
        <p className="catalog-reference-note">
          Thông số mặc định dùng khi nguồn không ghi giá trị riêng. Kỹ năng có
          thể đổi cường độ và thời hạn; trần hiệu lực vẫn áp dụng. Thời hạn mỗi
          lần áp tối đa 10 giây, riêng Choáng tối đa 0,6 giây.
        </p>
      )}
      {!entries.length ? (
        <p className="catalog-empty">
          Chưa có mục phù hợp. Thử tên khác hoặc chọn “Tất cả”.
        </p>
      ) : (
        <div className="catalog-reference-grid">
          {entries.map((entry) => (
            <article className="catalog-reference-card" key={entry.id}>
              <span className="catalog-reference-category">
                {entry.category}
              </span>
              <h3>{entry.name}</h3>
              <p>{entry.summary}</p>
              <dl>
                {entry.facts.map((fact) => (
                  <div key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.text}</dd>
                  </div>
                ))}
              </dl>
              {tab==="masteries"&&<button onClick={()=>setPreview(entry.id)}>Xem cách đánh ↗</button>}
              {!!entry.related.length && (
                <details className="catalog-reference-sources">
                  <summary>Nhân vật liên quan · {entry.related.length}</summary>
                  <div>
                    {entry.related.map((id) => (
                      <button
                        key={id}
                        onClick={() => inspect({ kind: "character", id })}
                      >
                        {character(id)?.name}
                      </button>
                    ))}
                  </div>
                </details>
              )}
            </article>
          ))}
        </div>
      )}
      {preview&&<MasteryPreview characterId={masteryInfo(preview)!.characterId as CharacterId} initialMasteryId={preview} onClose={()=>setPreview(undefined)} />}
    </>
  );
}
