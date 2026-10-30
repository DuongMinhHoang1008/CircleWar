import type { Team } from './colony';
import { teamKey } from './colony';
import { ROSTER,CATALOG_ITEMS } from '../../shared/src/catalog';
import { masteriesFor } from '../../shared/src/mastery';
export const CATEGORIES=['teams','characters','items','characterItems','characterMasteries'] as const;
export type Category=typeof CATEGORIES[number];
export interface ResultRow {id:string;characterId?:string;itemId?:string;masteryId?:string;team?:Team;games:number;wins:number;draws:number;}
export type ResultStatistics=Record<Category,Record<string,ResultRow>>;
export const emptyStatistics=():ResultStatistics=>({teams:{},characters:{},items:{},characterItems:{},characterMasteries:{}});
/** Catalog-complete view. Missing observations remain zero, never invented percentages. */
export function completeStatistics(...sources:ResultStatistics[]):ResultStatistics{
  const result=emptyStatistics();
  const add=(category:Category,row:Omit<ResultRow,'games'|'wins'|'draws'>)=>{result[category][row.id]={...row,games:0,wins:0,draws:0};};
  const items=['',...CATALOG_ITEMS.map(i=>i.id)];
  for(const itemId of items)add('items',{id:itemId,itemId});
  for(const c of ROSTER){
    const characterId=c.id;
    add('characters',{id:characterId,characterId});
    for(const itemId of items)add('characterItems',{id:`${characterId}:${itemId}`,characterId,itemId});
    for(const masteryId of ['',...masteriesFor(characterId).map(m=>m.id)])add('characterMasteries',{id:`${characterId}:${masteryId}`,characterId,masteryId});
  }
  for(const source of sources)for(const category of CATEGORIES)for(const row of Object.values(source[category])){
    const existing=result[category][row.id];
    result[category][row.id]=existing?{...row,games:existing.games+row.games,wins:existing.wins+row.wins,draws:existing.draws+row.draws}:{...row};
  }
  return result;
}
/** Team appearances, not kills or individual duels. Same entity on opposite sides counts twice. */
export function recordStatistics(stats:ResultStatistics,team:Team,wins:number,draws:number){
  const entries:{category:Category;row:Omit<ResultRow,'games'|'wins'|'draws'>}[]=[{category:'teams',row:{id:teamKey(team),team}}];
  for(const u of team){
    const characterId=u.characterId!,itemId=u.equipment[0]||'',masteryId=u.masteryId||'';
    entries.push({category:'characters',row:{id:characterId,characterId}},
      {category:'items',row:{id:itemId,itemId}},
      {category:'characterItems',row:{id:`${characterId}:${itemId}`,characterId,itemId}},
      {category:'characterMasteries',row:{id:`${characterId}:${masteryId}`,characterId,masteryId}});
  }
  const seen=new Set<string>();
  for(const {category,row} of entries){
    const key=`${category}:${row.id}`;if(seen.has(key))continue;seen.add(key);
    const r=stats[category][row.id]??={...row,games:0,wins:0,draws:0};
    r.games+=2;r.wins+=wins;r.draws+=draws;
  }
}
export type SortColumn='name'|'games'|'wins'|'draws'|'losses'|'winRate'|'score';
export function sortResults(rows:ResultRow[],column:SortColumn,descending:boolean,label:(r:ResultRow)=>string){
  const value=(r:ResultRow)=>column==='winRate'?r.wins/r.games:column==='score'?(r.wins+r.draws*.5)/r.games:column==='losses'?r.games-r.wins-r.draws:column==='name'?0:r[column];
  return [...rows].sort((a,b)=>{
    if((column==='winRate'||column==='score')&&(!a.games||!b.games))return Number(!a.games)-Number(!b.games)||a.id.localeCompare(b.id);
    const comparison=column==='name'?label(a).localeCompare(label(b),'vi'):value(a)-value(b);
    return comparison*(descending?-1:1)||b.games-a.games||a.id.localeCompare(b.id);
  });
}
