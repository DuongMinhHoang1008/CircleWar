import { ROSTER, CATALOG_ITEMS, type CharacterId } from '../../shared/src/catalog';
import { loanUnit, legalLoanTeam } from '../../shared/src/adventure';
import { masteriesFor, masteryInfo } from '../../shared/src/mastery';
import type { Loadout } from '../../shared/src/balance';

export type Team = Loadout[];
export type Trails = Record<string, number>;
export function randomSource(seed:number){let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
export const teamKey=(team:Team)=>JSON.stringify(team.map(u=>[u.characterId,u.equipment[0]||'',u.masteryId||'',u.masteryTarget||'']));
const keys=(u:Loadout)=>[`character:${u.characterId}`,`item:${u.equipment[0]||'none'}`,`mastery:${u.masteryId||'none'}`,`build:${u.characterId}:${u.equipment[0]||'none'}:${u.masteryId||'none'}`];
export function evaporate(trails:Trails,rate:number){for(const key of Object.keys(trails))trails[key]=Math.max(.1,trails[key]*(1-rate));}
export function reward(trails:Trails,team:Team,score:number){
  for(const u of team)for(const k of keys(u))trails[k]=Math.min(30,(trails[k]??1)+score);
  for(let i=0;i<team.length;i++)for(let j=i+1;j<team.length;j++){
    const k='pair:'+ [team[i].characterId,team[j].characterId].sort().join(':');trails[k]=Math.min(30,(trails[k]??1)+score);
  }
}
function choose<T>(values:T[],weight:(v:T)=>number,rng:()=>number,exploration:number){
  if(rng()<exploration)return values[Math.floor(rng()*values.length)];
  const weights=values.map(weight),total=weights.reduce((a,b)=>a+b,0);let cursor=rng()*total;
  return values.find((_,i)=>(cursor-=weights[i])<0)??values[values.length-1];
}
/** Generate legal builds, including targets; slot order remains part of the team. */
export function sampleTeam(trails:Trails,rng:()=>number,exploration:number,level=10,fixed:Team=[]):Team {
  const team=structuredClone(fixed);
  while(team.length<3){
    const c=choose(ROSTER.filter(c=>!team.some(u=>u.characterId===c.id)),c=>
      (trails[`character:${c.id}`]??1)*Math.sqrt(team.reduce((v,u)=>v*(trails['pair:'+ [c.id,u.characterId].sort().join(':')]??1),1)),rng,exploration);
    const items=['',...CATALOG_ITEMS.map(i=>i.id)].filter(id=>!id||!team.some(u=>u.equipment.includes(id)));
    const item=choose(items,id=>trails[`item:${id||'none'}`]??1,rng,exploration);
    const skills=[undefined,...masteriesFor(c.id).filter(m=>!m.legacy||!team.some(u=>masteryInfo(u.masteryId)?.legacy))];
    const skill=choose(skills,m=>(trails[`mastery:${m?.id||'none'}`]??1)*Math.sqrt(trails[`build:${c.id}:${item||'none'}:${m?.id||'none'}`]??1),rng,exploration);
    team.push({...loanUnit(c.id as CharacterId,item,level),masteryId:skill?.id});
  }
  for(const u of team){
    if(masteryInfo(u.masteryId)?.targeted){const allies=team.filter(v=>v!==u);u.masteryTarget=allies[Math.floor(rng()*allies.length)].characterId;}
    else delete u.masteryTarget;
  }
  legalLoanTeam(team);
  return team;
}
export function evolve(team:Team,trails:Trails,rng:()=>number,changeChance:number,exploration:number,level=10){
  if(rng()>=changeChance)return structuredClone(team);
  if(rng()<.25)return sampleTeam(trails,rng,exploration,level);
  const slot=Math.floor(rng()*3),keep=team.filter((_,i)=>i!==slot);
  const next=sampleTeam(trails,rng,exploration,level,keep),replacement=next[2];
  const ordered=team.map((u,i)=>i===slot?replacement:next[keep.indexOf(u)]||u);
  // Re-select targets after replacing a teammate.
  return sampleTeam(trails,rng,exploration,level,ordered);
}
