import React,{useMemo,useState} from 'react';
import { character,CATALOG_ITEMS } from '../../../packages/shared/src/catalog';
import { masteryInfo } from '../../../packages/shared/src/mastery';
import { CATEGORIES,completeStatistics,sortResults,type Category,type ResultRow,type SortColumn } from '../../../packages/simulator/src/statistics';
import type { SearchSnapshot } from '../../../packages/simulator/src/search';
const categories:Record<Category,string>={teams:'Đội',characters:'Nhân vật',items:'Trang bị',characterItems:'Nhân vật × Trang bị',characterMasteries:'Nhân vật × Bí kỹ'};
const characterName=(id?:string)=>character(id)?.name||id||'Không';
const itemName=(id?:string)=>CATALOG_ITEMS.find(i=>i.id===id)?.name||'Không trang bị';
const masteryName=(id?:string)=>masteryInfo(id)?.name||'Không Bí kỹ';
const pct=(v:number)=>`${(v*100).toFixed(1)}%`;
const label=(r:ResultRow)=>r.team?r.team.map(u=>`${characterName(u.characterId)} ${itemName(u.equipment[0])} ${masteryName(u.masteryId)}`).join(' · '):[r.characterId?characterName(r.characterId):'',r.itemId!==undefined?itemName(r.itemId):'',r.masteryId!==undefined?masteryName(r.masteryId):''].filter(Boolean).join(' · ');
const columns:[SortColumn,string][]=[['name','Lựa chọn'],['games','Số trận'],['wins','Thắng'],['draws','Hòa'],['losses','Thua'],['winRate','Tỷ lệ thắng'],['score','Điểm / trận']];
export function ColonyResults({snapshot}:{snapshot:SearchSnapshot}){
  const [category,setCategory]=useState<Category>('teams'),[source,setSource]=useState('all');
  const [sort,setSort]=useState<SortColumn>('winRate'),[descending,setDescending]=useState(true);
  const [query,setQuery]=useState(''),[minimum,setMinimum]=useState(0),[page,setPage]=useState(0);
  const phase=source==='training'||source==='validation'?source:'all';
  const statistics=useMemo(()=>phase==='all'?completeStatistics(snapshot.statistics.training,snapshot.statistics.validation):completeStatistics(snapshot.statistics[phase]),[snapshot.statistics,phase]);
  const all=Object.values(statistics[category]);
  const sourceLabel=phase==='all'?'Toàn bộ dữ liệu':phase==='training'?'Các trận học':'Đánh giá cuối';
  const filtered=all.filter(r=>r.games>=minimum&&label(r).toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')));
  const sorted=sortResults(filtered,sort,descending,label),pages=Math.max(1,Math.ceil(sorted.length/25)),current=Math.min(page,pages-1);
  const selectSort=(column:SortColumn)=>{setSort(column);setDescending(column===sort?!descending:column!=='name');setPage(0);};
  return <section className="colony-results" aria-label="Kết quả mô phỏng">
    <div className="colony-results-heading"><div><span className="colony-eyebrow">KẾT QUẢ MÔ PHỎNG</span><h3>Hiệu quả qua từng trận</h3></div><span className={'colony-result-badge '+(snapshot.phase==='done'?'complete':'')}>{snapshot.phase==='done'?'Đã hoàn tất':'Số liệu tạm'}</span></div>
    <div className="colony-result-tabs" role="group" aria-label="Nhóm kết quả">{CATEGORIES.map(c=><button key={c} aria-pressed={category===c} onClick={()=>{setCategory(c);setPage(0);}}>{categories[c]} <small>{Object.keys(statistics[c]).length}</small></button>)}</div>
    <div className="colony-result-filters"><label>Tập số liệu<select aria-label="Tập số liệu" value={phase} onChange={e=>{setSource(e.target.value);setPage(0);}}><option value="all">Toàn bộ dữ liệu đã ghi</option><option value="training">Các trận học</option><option value="validation">Đánh giá cuối</option></select></label><label>Tìm kiếm<input aria-label="Tìm kết quả" placeholder="Tên nhân vật, trang bị, Bí kỹ…" value={query} onChange={e=>{setQuery(e.target.value);setPage(0);}}/></label><label>Số trận tối thiểu<input aria-label="Số trận tối thiểu" type="number" min={0} step={1} value={minimum} onChange={e=>{setMinimum(Math.max(0,Math.floor(Number(e.target.value)||0)));setPage(0);}}/></label></div>
    <p className="colony-result-note">{phase==='all'?'Toàn bộ các đội đã ghi nhận trong trận học và ứng viên đánh giá cuối; giữ cả đội cũ qua mọi thế hệ.':phase==='training'?'Trận học: tính cả hai bên tham gia, gồm các đội đã đổi hoặc bị loại.':'Đánh giá cuối: chỉ tính các đội ứng viên, không tính phía đối thủ thử nghiệm.'} Mục 0 trận chưa có dữ liệu; tỷ lệ thắng hiển thị —. Một lượt xuất hiện trong đội được ghi thắng/hòa/thua theo kết quả của đội. Tỷ lệ thắng = thắng / tổng trận; điểm = (thắng + ½ hòa) / tổng trận. Đây là thống kê đi cùng đội, không phải thắng đơn đấu hay đóng góp riêng.</p>
    <small className="colony-scroll-hint">Cuộn ngang để xem đủ cột · Bấm tiêu đề cột để sắp xếp</small>
    <div className="colony-table colony-result-table"><table><caption>{categories[category]} · {sourceLabel} · {sorted.length.toLocaleString('vi-VN')} kết quả</caption><thead><tr><th scope="col">#</th>{columns.map(([key,title])=><th key={key} scope="col" aria-sort={sort===key?(descending?'descending':'ascending'):'none'}><button onClick={()=>selectSort(key)}>{title} <span aria-hidden="true">{sort===key?(descending?'↓':'↑'):'↕'}</span></button></th>)}</tr></thead><tbody>{sorted.slice(current*25,current*25+25).map((r,i)=>{
      const rate=r.games?r.wins/r.games:0;
      return <tr key={r.id}><td className="colony-row-number">{current*25+i+1}</td><td className="colony-build-cell">{r.team?r.team.map((u,j)=><div className="colony-unit-row" key={j}><span className="colony-slot">{j+1}</span><div><strong>{characterName(u.characterId)}</strong><small>{itemName(u.equipment[0])} <span>·</span> {masteryName(u.masteryId)}{u.masteryTarget?` → ${characterName(u.masteryTarget)}`:''}</small></div></div>):<div className="colony-single-build"><strong>{r.characterId?characterName(r.characterId):itemName(r.itemId)}</strong>{!r.games&&<small>Chưa có dữ liệu</small>}{r.characterId&&r.itemId!==undefined&&<small>{itemName(r.itemId)}</small>}{r.masteryId!==undefined&&<small className="colony-mastery-label">{masteryName(r.masteryId)}</small>}</div>}</td><td>{r.games.toLocaleString('vi-VN')}</td><td className="colony-win-count">{r.wins.toLocaleString('vi-VN')}</td><td>{r.draws.toLocaleString('vi-VN')}</td><td className="colony-loss-count">{(r.games-r.wins-r.draws).toLocaleString('vi-VN')}</td><td><div className="colony-win-rate"><b>{r.games?pct(rate):'—'}</b><span className="colony-rate-track"><span style={{width:pct(rate)}}/></span></div></td><td>{r.games?pct((r.wins+r.draws*.5)/r.games):'—'}</td></tr>;
    })}</tbody></table>{!sorted.length&&<p className="colony-results-empty">Chưa có kết quả phù hợp. Hãy đổi bộ lọc hoặc chờ các trận hoàn tất.</p>}</div>
    <div className="colony-pagination"><span>{sorted.length?current*25+1:0}–{Math.min((current+1)*25,sorted.length)} / {sorted.length.toLocaleString('vi-VN')}</span><div><button disabled={current===0} onClick={()=>setPage(current-1)}>Trang trước</button><span>{current+1} / {pages}</span><button disabled={current+1>=pages} onClick={()=>setPage(current+1)}>Trang sau</button></div></div>
    <small className="colony-result-caveat">Ít trận có thể cho tỷ lệ thắng cao do ngẫu nhiên. Nên lọc số trận tối thiểu; kết quả phản ánh đối thủ, seed và quần thể đã thử, không khẳng định lựa chọn mạnh nhất toàn game.</small>
  </section>;
}
