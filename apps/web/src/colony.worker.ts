import { search, battleSeeds, type SearchConfig } from '../../../packages/simulator/src/search';
import { adventureConfig } from '../../../packages/shared/src/adventure';
import { createBattle, stepBattle, ENGINE_VERSION } from '../../../packages/battle-engine/src/index';
self.onmessage=({data}:{data:SearchConfig})=>{
  try{
    let lastUpdate=0,lastPhase='';
    search(data,(a,b,seed)=>{
      let wins=0,draws=0;
      const seeds=battleSeeds(seed);
      for(let side=0;side<2;side++){
        const s=createBattle(adventureConfig(side?b:a,side?a:b),seeds[side]);
        while(!s.finished&&s.tick<5400)stepBattle(s);
        if(!s.finished)throw Error('Trận không kết thúc trong giới hạn engine.');
        const alive=new Set(s.fighters.filter(f=>f.hp>0).map(f=>f.team));
        if(alive.size!==1)draws++;else if(alive.has(side?'team-rival':'team-player'))wins++;
      }
      return {wins,draws,score:(wins+draws*.5)/2};
    },snapshot=>{
      const now=performance.now();
      if(snapshot.phase==='done'||snapshot.phase!==lastPhase||now-lastUpdate>=500){
        self.postMessage({snapshot,engine:ENGINE_VERSION});lastUpdate=now;lastPhase=snapshot.phase;
      }
    });
  }catch(error){self.postMessage({error:String(error)});}
};
