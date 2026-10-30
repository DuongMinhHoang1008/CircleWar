import { randomSource, sampleTeam, evolve, evaporate, reward, teamKey, type Team, type Trails } from './colony';
import { emptyStatistics,recordStatistics,type ResultStatistics } from './statistics';
export interface SearchConfig {seed:number;population:number;generations:number;rounds:number;changeChance:number;exploration:number;evaporation:number;level:number;finalists:number;validationOpponents:number;}
export const DEFAULT_SEARCH:SearchConfig={seed:20261030,population:64,generations:20,rounds:2,changeChance:.55,exploration:.25,evaporation:.12,level:10,finalists:8,validationOpponents:32};
export function validateSearch(c:SearchConfig){
  for(const [key,min,max] of [['seed',0,4294967295],['population',4,2000],['generations',1,1000],['rounds',1,100],['level',1,100],['finalists',1,50],['validationOpponents',2,1000]] as const)
    if(!Number.isInteger(c[key])||c[key]<min||c[key]>max)throw Error(`Thông số ${key}: cần số nguyên từ ${min} đến ${max}.`);
  if(c.population%2)throw Error('Số người chơi phải là số chẵn.');
  for(const k of ['changeChance','exploration','evaporation'] as const)if(!Number.isFinite(c[k])||c[k]<0||c[k]>1)throw Error(`${k} phải từ 0 đến 1.`);
}
export interface Duel {wins:number;draws:number;score:number;}
export interface Standing {team:Team;games:number;wins:number;draws:number;score:number;}
export interface SearchSnapshot {statistics:{training:ResultStatistics;validation:ResultStatistics};phase:'training'|'validation'|'done';generation:number;battles:number;trails:Trails;leaders:Standing[];history:{generation:number;diversity:number;changes:number}[];}
export type Evaluator=(a:Team,b:Team,seed:number)=>Duel;
export const battleSeeds=(seed:number):[number,number]=>[seed>>>0,(seed^0x9e3779b9)>>>0];
export function learnedOpponentIndex(index:number,count:number){return Math.floor(index/2)%count;}
/** Each evaluation contains two side-swapped battles with distinct seeds. */
export function search(c:SearchConfig,evaluate:Evaluator,progress:(s:SearchSnapshot)=>void){
  validateSearch(c);
  const rng=randomSource(c.seed),seed=()=>Math.floor(rng()*4294967296),trails:Trails={};
  const statistics={training:emptyStatistics(),validation:emptyStatistics()};
  let population=Array.from({length:c.population},()=>sampleTeam(trails,rng,1,c.level)),battles=0;
  const archive=new Map<string,Standing>(),history:SearchSnapshot['history']=[];
  const rank=()=>[...archive.values()].sort((a,b)=>(b.score+2)/(b.games+4)-(a.score+2)/(a.games+4)||b.games-a.games||teamKey(a.team).localeCompare(teamKey(b.team))).slice(0,c.finalists);
  const record=(team:Team,wins:number,draws:number,score:number)=>{
    const key=teamKey(team),r=archive.get(key)||{team:structuredClone(team),games:0,wins:0,draws:0,score:0};
    r.games+=2;r.wins+=wins;r.draws+=draws;r.score+=score*2;archive.set(key,r);
  };
  for(let generation=1;generation<=c.generations;generation++){
    evaporate(trails,c.evaporation);
    for(let round=0;round<c.rounds;round++){
      const order=population.map((_,i)=>i);for(let i=order.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
      for(let i=0;i<order.length;i+=2){
        const a=population[order[i]],b=population[order[i+1]],r=evaluate(a,b,seed());battles+=2;
        record(a,r.wins,r.draws,r.score);record(b,2-r.wins-r.draws,r.draws,1-r.score);
        recordStatistics(statistics.training,a,r.wins,r.draws);
        recordStatistics(statistics.training,b,2-r.wins-r.draws,r.draws);
        // No reinforcement on a draw; both sides' wins earn proportional credit.
        if(r.wins)reward(trails,a,r.wins/2);if(2-r.wins-r.draws)reward(trails,b,(2-r.wins-r.draws)/2);
        if(battles%16===0)progress({statistics,phase:'training',generation,battles,trails,leaders:rank(),history});
      }
    }
    let changes=0;
    if(generation<c.generations)population=population.map(team=>{const next=evolve(team,trails,rng,c.changeChance,c.exploration,c.level);changes+=Number(teamKey(next)!==teamKey(team));return next;});
    history.push({generation,diversity:new Set(population.map(teamKey)).size,changes});
    if(archive.size>5000){
      const keep=[...archive.entries()].sort((a,b)=>(b[1].score+2)/(b[1].games+4)-(a[1].score+2)/(a[1].games+4)).slice(0,2500);
      archive.clear();for(const [key,value] of keep)archive.set(key,value);
    }
    progress({statistics,phase:'training',generation,battles,trails,leaders:rank(),history});
  }
  const candidates=rank();
  // Same opponents for every finalist, fresh battle seeds per evaluation.
  const opponents=Array.from({length:c.validationOpponents},(_,i)=>i%2&&candidates.length?structuredClone(candidates[learnedOpponentIndex(i,candidates.length)].team):sampleTeam({},rng,1,c.level));
  const leaders:Standing[]=[];
  for(const candidate of candidates){
    const r:Standing={team:candidate.team,games:0,wins:0,draws:0,score:0};
    for(let i=0;i<opponents.length;i++){
      const result=evaluate(r.team,opponents[i],seed());battles+=2;r.games+=2;r.wins+=result.wins;r.draws+=result.draws;r.score+=result.score*2;
      // Validation statistics cover candidates only, consistently with finalist rankings.
      recordStatistics(statistics.validation,r.team,result.wins,result.draws);
      if(i%8===0)progress({statistics,phase:'validation',generation:c.generations,battles,trails,leaders:[...leaders,r],history});
    }
    leaders.push(r);
  }
  leaders.sort((a,b)=>b.wins/b.games-a.wins/a.games||b.score/b.games-a.score/a.games||teamKey(a.team).localeCompare(teamKey(b.team)));
  const result:SearchSnapshot={statistics,phase:'done',generation:c.generations,battles,trails,leaders,history};progress(result);return result;
}
