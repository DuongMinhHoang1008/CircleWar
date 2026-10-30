import {expect,it} from 'vitest';
import {sampleTeam,randomSource,evolve,reward,evaporate,teamKey} from '../../packages/simulator/src/colony';
import {search,DEFAULT_SEARCH,validateSearch,battleSeeds,learnedOpponentIndex} from '../../packages/simulator/src/search';
import {legalLoanTeam} from '../../packages/shared/src/adventure';
import {emptyStatistics,recordStatistics,sortResults,completeStatistics} from '../../packages/simulator/src/statistics';
it('keeps generated and mutated teams legal, deterministic, and retains teams at zero change probability',()=>{
  const rng=randomSource(42),trails={};
  let team=sampleTeam(trails,rng,.25);
  expect(team).toEqual(sampleTeam({},randomSource(42),.25));
  expect(teamKey(evolve(team,trails,rng,0,.25))).toBe(teamKey(team));
  for(let i=0;i<200;i++){team=evolve(team,trails,rng,1,.25);expect(()=>legalLoanTeam(team)).not.toThrow();expect(new Set(team.map(u=>u.characterId)).size).toBe(3);}
});
it('reinforces winners, evaporates credit, and bounds trails',()=>{
  const trails:Record<string,number>={},team=sampleTeam({},randomSource(1),1);
  reward(trails,team,1);const key=`character:${team[0].characterId}`;expect(trails[key]).toBe(2);
  evaporate(trails,.5);expect(trails[key]).toBe(1);
  for(let i=0;i<100;i++)reward(trails,team,1);expect(trails[key]).toBe(30);
  evaporate(trails,1);expect(trails[key]).toBe(.1);
});
it('separates mirrored training and equal held-out validation and reproduces search',()=>{
  const config={...DEFAULT_SEARCH,population:4,generations:2,rounds:1,finalists:2,validationOpponents:2};
  const calls:string[]=[];const evalFn=(a:Parameters<typeof teamKey>[0],b:Parameters<typeof teamKey>[0],seed:number)=>{calls.push(`${teamKey(b)}:${seed}`);return {wins:1,draws:0,score:.5};};
  const result=search(config,evalFn,()=>{});
  expect(result.phase).toBe('done');expect(result.battles).toBe(16);
  expect(calls.slice(4,6).map(s=>s.slice(0,s.lastIndexOf(':')))).toEqual(calls.slice(6,8).map(s=>s.slice(0,s.lastIndexOf(':'))));
  expect(calls.slice(4,6)).not.toEqual(calls.slice(6,8));
  expect(result.leaders.every(r=>r.games===4&&r.wins===2)).toBe(true);
  expect(Object.values(result.statistics.training.teams).reduce((n,r)=>n+r.games,0)).toBe(16);
  expect(Object.values(result.statistics.validation.teams).reduce((n,r)=>n+r.games,0)).toBe(8);
  expect(search(config,evalFn,()=>{})).toEqual(result);
  expect(()=>validateSearch({...config,population:5})).toThrow();
});
it('records all five groups, separates wins/draws/losses and counts repeated no-item choices once per team',()=>{
  const team=sampleTeam({},randomSource(7),1).map(u=>({...u,equipment:[],masteryId:undefined,masteryTarget:undefined}));
  const stats=emptyStatistics();recordStatistics(stats,team,1,1);
  expect(Object.keys(stats.teams)).toHaveLength(1);
  expect(Object.keys(stats.characters)).toHaveLength(3);
  expect(Object.keys(stats.characterItems)).toHaveLength(3);
  expect(Object.keys(stats.characterMasteries)).toHaveLength(3);
  expect(stats.items['']).toMatchObject({games:2,wins:1,draws:1});
  recordStatistics(stats,team,0,0);
  expect(stats.items['']).toMatchObject({games:4,wins:1,draws:1});
  expect(Object.values(stats.characters).every(r=>r.games===4&&r.wins===1&&r.draws===1)).toBe(true);
});
it('sorts numerical results rather than formatted percentages and supports both directions',()=>{
  const rows=[{id:'A',games:10,wins:9,draws:0},{id:'B',games:2,wins:2,draws:0}];
  expect(sortResults(rows,'winRate',true,r=>r.id).map(r=>r.id)).toEqual(['B','A']);
  expect(sortResults(rows,'games',true,r=>r.id).map(r=>r.id)).toEqual(['A','B']);
  expect(sortResults(rows,'games',false,r=>r.id).map(r=>r.id)).toEqual(['B','A']);
  expect(rows[0].id).toBe('A');
});
it('shows the full catalog and all observed teams without losing counts or mutating raw samples',()=>{
  const training=emptyStatistics(),validation=emptyStatistics();
  const a=sampleTeam({},randomSource(1),1),b=sampleTeam({},randomSource(2),1);
  recordStatistics(training,a,2,0);recordStatistics(training,b,0,1);
  recordStatistics(validation,a,1,0);
  const raw=JSON.stringify(training),all=completeStatistics(training,validation);
  expect(Object.keys(all.characters)).toHaveLength(33);
  expect(Object.keys(all.items)).toHaveLength(34);
  expect(Object.keys(all.characterItems)).toHaveLength(1122);
  expect(Object.keys(all.characterMasteries)).toHaveLength(132);
  expect(Object.keys(all.teams)).toHaveLength(2);
  expect(all.teams[teamKey(a)]).toMatchObject({games:4,wins:3,draws:0});
  expect(all.teams[teamKey(b)]).toMatchObject({games:2,wins:0,draws:1});
  expect(JSON.stringify(training)).toBe(raw);
  const sorted=sortResults(Object.values(all.characters),'winRate',false,r=>r.id);
  const firstZero=sorted.findIndex(r=>!r.games);
  expect(firstZero).toBeGreaterThan(0);expect(sorted.slice(firstZero).every(r=>!r.games)).toBe(true);
});

it('uses different battle seeds and cycles through all learned opponents',()=>{
  expect(battleSeeds(123)[0]).not.toBe(battleSeeds(123)[1]);
  expect(battleSeeds(123)).toEqual(battleSeeds(123));
  expect(Array.from({length:8},(_,i)=>learnedOpponentIndex(i*2+1,8))).toEqual([0,1,2,3,4,5,6,7]);
});
