import { completeStatistics } from '../../../packages/simulator/src/statistics';
import { ColonyResults } from './ColonyResults';
import React,{useEffect,useRef,useState} from 'react';
import { DEFAULT_SEARCH,validateSearch,type SearchConfig,type SearchSnapshot } from '../../../packages/simulator/src/search';
import { character,CATALOG_ITEMS } from '../../../packages/shared/src/catalog';
import { masteryInfo } from '../../../packages/shared/src/mastery';
import './colonySimulator.css';
const fields:{key:keyof SearchConfig;label:string;min:number;max:number;step?:number;hint:string}[]=[
  {key:'population',label:'Người chơi ảo',min:4,max:2000,step:2,hint:'Số chẵn; mỗi người giữ một đội 3 nhân vật.'},
  {key:'generations',label:'Số thế hệ',min:1,max:1000,hint:'Sau mỗi thế hệ, người chơi có cơ hội thay đội.'},
  {key:'rounds',label:'Lượt ghép cặp / thế hệ',min:1,max:100,hint:'Mỗi lượt xáo trộn quần thể và ghép cặp ngẫu nhiên.'},
  {key:'changeChance',label:'Xác suất đổi đội',min:0,max:1,step:.05,hint:'0 = giữ đội; 1 = luôn thử thay. Trong các lần đổi: 75% đổi một vị trí, 25% dựng lại đội.'},
  {key:'exploration',label:'Khám phá ngẫu nhiên',min:0,max:1,step:.05,hint:'Xác suất bỏ qua điểm hấp dẫn để chọn đều ngẫu nhiên.'},
  {key:'evaporation',label:'Bay hơi điểm / thế hệ',min:0,max:1,step:.05,hint:'Giảm ảnh hưởng các lựa chọn thắng trong quá khứ; điểm được chặn để tránh độc chiếm.'},
  {key:'level',label:'Cấp nhân vật và trang bị',min:1,max:100,hint:'Cùng cấp cho mọi đội; mỗi nhân vật tối đa một trang bị.'},
  {key:'finalists',label:'Đội vào vòng đánh giá',min:1,max:50,hint:'Chọn từ lịch sử đội đã đấu, ưu tiên điểm có làm mượt theo số trận.'},
  {key:'validationOpponents',label:'Đối thủ đánh giá / đội',min:2,max:1000,hint:'Một nửa đội ngẫu nhiên mới, một nửa đội học được. Mọi ứng viên đấu cùng tập đối thủ, với seed trận riêng.'},
  {key:'seed',label:'Seed',min:0,max:4294967295,hint:'Cùng cấu hình, seed và engine cho cùng kết quả.'},
];
const name=(id?:string)=>character(id)?.name||id||'Không';
export function ColonySimulatorPage(){
  const [config,setConfig]=useState<SearchConfig>(()=>{try{return {...DEFAULT_SEARCH,...JSON.parse(localStorage.getItem('circlewar-colony-config')||'{}')};}catch{return DEFAULT_SEARCH;}});
  const [snapshot,setSnapshot]=useState<SearchSnapshot>();const [running,setRunning]=useState(false);
  const [runConfig,setRunConfig]=useState(config);
  const [randomSeed,setRandomSeed]=useState(true);
  const [error,setError]=useState(''),[engine,setEngine]=useState(''),[stopped,setStopped]=useState(false);
  const worker=useRef<Worker|null>(null),started=useRef(0),[seconds,setSeconds]=useState(0);
  useEffect(()=>()=>worker.current?.terminate(),[]);
  useEffect(()=>{if(!running)return;const id=setInterval(()=>setSeconds((Date.now()-started.current)/1000),1000);return()=>clearInterval(id);},[running]);
  const start=()=>{
    try{
      const actual={...config,seed:randomSeed?crypto.getRandomValues(new Uint32Array(1))[0]:config.seed};
      validateSearch(actual);worker.current?.terminate();
      setRunConfig(actual);setConfig(actual);
      try{localStorage.setItem('circlewar-colony-config',JSON.stringify(actual));}catch{}
      setSnapshot(undefined);setError('');setStopped(false);setSeconds(0);started.current=Date.now();
      const w=new Worker(new URL('./colony.worker.ts',import.meta.url),{type:'module'});worker.current=w;
      w.onmessage=({data})=>{if(data.error){setError(data.error);setRunning(false);w.terminate();return;}setSnapshot(data.snapshot);setEngine(data.engine);if(data.snapshot.phase==='done'){setRunning(false);setSeconds((Date.now()-started.current)/1000);w.terminate();}};
      w.onerror=e=>{setError(e.message||'Không tải được trình mô phỏng.');setRunning(false);w.terminate();};
      setRunning(true);w.postMessage(actual);
    }catch(e){setError(String(e));}
  };
  const download=()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify({config:runConfig,engine,seconds,stopped,algorithm:"colony-v2-per-battle-seeds",snapshot,allStatistics:snapshot?.statistics?completeStatistics(snapshot.statistics.training,snapshot.statistics.validation):undefined},null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=`colony-${runConfig.seed}-${Date.now()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const estimated=config.population*config.generations*config.rounds+config.finalists*config.validationOpponents*2;
  return <section className="colony-page">
    <h2>Tìm đội hình bằng mô phỏng đàn kiến</h2>
    <p>Người chơi ảo khởi đầu ngẫu nhiên, đấu bằng engine thật và đổi lựa chọn theo điểm hấp dẫn. Chạy nền, không vẽ trận và không thay hồ sơ hay phần thưởng. Rời trang sẽ dừng mô phỏng.</p>
    <fieldset disabled={running} className="colony-fields"><legend>Cấu hình</legend><label>Seed phiên mới<input aria-label="Seed phiên ngẫu nhiên" type="checkbox" checked={randomSeed} onChange={e=>setRandomSeed(e.target.checked)}/><small>Bật: chọn seed gốc mới khi bắt đầu. Tắt: nhập seed để lặp lại kết quả. Mỗi trận luôn có seed riêng.</small></label>{fields.map(f=><label key={f.key}>{f.label}<input aria-label={f.label} disabled={f.key==='seed'&&randomSeed} type="number" min={f.min} max={f.max} step={f.step||1} value={Number.isFinite(config[f.key])?config[f.key]:''} onChange={e=>setConfig({...config,[f.key]:e.target.value===''?NaN:Number(e.target.value)})}/><small>{f.hint}</small></label>)}</fieldset>
    <p>Khoảng tối đa <b>{Number.isFinite(estimated)?estimated.toLocaleString('vi-VN'):'—'} trận</b>, gồm đánh giá cuối. Mỗi cặp đấu hai trận đổi bên, mỗi trận dùng seed riêng. Cấu hình lớn có thể chạy lâu; tốc độ phụ thuộc CPU.</p>
    <div className="colony-actions"><button className="primary" disabled={running} onClick={start}>Bắt đầu mô phỏng</button><button disabled={!running} onClick={()=>{worker.current?.terminate();setRunning(false);setStopped(true);}}>Dừng</button><button disabled={running} onClick={()=>setConfig(DEFAULT_SEARCH)}>Mặc định</button><button disabled={!snapshot} onClick={download}>Tải kết quả JSON</button></div>
    {error&&<p role="alert">{error}</p>}
    <p role="status">{running?(snapshot?.phase==='validation'?'Đang đánh giá trên đối thủ riêng…':'Đang học…'):stopped?'Đã dừng · dữ liệu tạm, chưa phải kết quả cuối.':snapshot?.phase==='done'?'Hoàn tất':'Sẵn sàng'} · {snapshot?.battles.toLocaleString('vi-VN')||0} trận · {seconds.toFixed(0)}s {seconds>0&&snapshot?`· ${(snapshot.battles/seconds).toFixed(1)} trận/s`:''}</p>
    {snapshot&&<>
      <p>Thế hệ {snapshot.generation}/{runConfig.generations} · Seed gốc {runConfig.seed} · {engine} · {snapshot.history.at(-1)?.diversity??runConfig.population} đội khác nhau</p>
      {snapshot.statistics ? <ColonyResults snapshot={snapshot} /> : <p>Chạy lượt mô phỏng mới để ghi nhận đủ năm nhóm thống kê.</p>}
      <details><summary>Điểm hấp dẫn: nhân vật, trang bị và Bí kỹ</summary><p>Điểm lựa chọn sau thưởng và bay hơi; không phải tỷ lệ thắng riêng.</p>{['character','item','mastery'].map(kind=><div key={kind}><h4>{kind==='character'?'Nhân vật':kind==='item'?'Trang bị':'Bí kỹ'}</h4>{Object.entries(snapshot.trails).filter(([k])=>k.startsWith(kind+':')).sort((a,b)=>b[1]-a[1]).slice(0,15).map(([k,v])=>{const id=k.slice(k.indexOf(':')+1);return <div key={k}>{kind==='character'?name(id):kind==='item'?CATALOG_ITEMS.find(i=>i.id===id)?.name||'Không trang bị':masteryInfo(id)?.name||'Không Bí kỹ'}: {v.toFixed(2)}</div>;})}</div>)}</details>
    </>}
  </section>;
}
