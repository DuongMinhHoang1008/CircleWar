import { masteryUpgrade, type MasteryUpgrade } from '../../shared/src/mastery-upgrades';
import { characterKit } from '../../shared/src/character-kits';
import type { BattleState, Fighter, Projectile, Construct } from './types';
import type { KitCombatServices } from './kit-combat';
import { shapeStrike, type FormOperations } from './mastery-forms';
import { DIRECTIONS, div, normalize, UNIT } from './math';
import { alignedRangedTarget, weaponReach } from './weapons';
import { attackCooldown, applyStatus } from './statuses';
import { capsuleHit } from './physics';
import { safeBounds } from './bounds';
import { weakestAlly } from './mastery';
import { isConstruct } from './constructs';

export const upgradeEvent=(s:BattleState,f:Fighter)=>s.events.push({tick:s.tick,type:`mastery:${f.masteryId}`,source:f.id,target:f.id,amount:1});
export function upgradeBudget(f:Fighter,cap:number,superMode=false,base=false) {
  const id=f.memory.upgradeGroup=(f.memory.upgradeGroup||0)+1;
  return {id,cap:div((base?f.baseStats.attack:f.stats.attack)*cap*(superMode?f.stats.superPower:100),10000)};
}
/** Per-cast budget is stored on the fighter so checkpoints cannot duplicate it. */
export function spendUpgrade(f:Fighter,target:number,raw:number,budget?:Projectile['budget']) {
  if(!budget) return raw;
  const key=`upgradeBudget:${budget.id}:${target}`, used=f.memory[key]||0;
  const amount=Math.max(0,Math.min(raw,budget.cap-used));
  f.memory[key]=used+amount;
  return amount;
}
export function upgradeProjectileDamage(s:BattleState,f:Fighter,t:Fighter,p:Projectile,ctx:KitCombatServices,scale=100) {
  const raw=spendUpgrade(f,t.id,div((p.rawDamage ?? div(f.stats.attack*(p.power??100),100))*scale,100),p.budget);
  return raw>0?ctx.damage(s,f,t,raw,t.team===f.team,!!p.bonus):0;
}
const distance=(a:{x:number;y:number},b:{x:number;y:number})=>(a.x-b.x)**2+(a.y-b.y)**2;
const angleTo=(a:{x:number;y:number},b:{x:number;y:number})=>{
  const [x,y]=normalize(b.x-a.x,b.y-a.y);let best=-Infinity,angle=0;
  DIRECTIONS.forEach((d,i)=>{const dot=x*d[0]+y*d[1];if(dot>best){best=dot;angle=i;}});return angle;
};
const thematic=(f:Fighter):NonNullable<Projectile['kit']>=>f.characterId==='char_06'?'ribbon':f.characterId==='char_19'?'envelope':'air';
export function bonusShot(s:BattleState,f:Fighter,ops:FormOperations,angle:number,power:number,extra:Partial<Projectile>={}) {
  return ops.shoot(s,f,(Math.round(angle)+64)%32,extra.kit||thematic(f),power,{
    normal:false,bonus:true,life:30,push:0,pierce:0,mastery:{style:'shard'},...extra,
  });
}
function roomFor(s:BattleState,f:Fighter,count:number) {
  return s.projectiles.filter(p=>p.life>0).length+count<=216 && s.projectiles.filter(p=>p.owner===f.id&&p.bonus&&p.life>0).length+count<=12;
}
function emitRecipe(s:BattleState,f:Fighter,r:MasteryUpgrade,angle:number,ops:FormOperations,ctx?:KitCombatServices,target?:Fighter) {
  const count=r.pattern==='fan'?(r.count||2):r.pattern==='orbit'?2:r.pattern==='envelopeFan'?3:1;
  if(!roomFor(s,f,count)) return false;
  const range=r.range||240;
  const budget=r.cap?upgradeBudget(f,r.cap):undefined;
  const shot=(offset:number,power=r.power,extra:Partial<Projectile>={})=>bonusShot(s,f,ops,angle+offset,power,{budget,life:Math.max(8,Math.ceil(range/10)),...extra});
  if(['whirl','whirlPush','cross','sweep'].includes(r.pattern)) {
    if(!ctx) return false;
    const hits=shapeStrike(s,f,r.pattern==='whirlPush'?'whirl':r.pattern as 'whirl',f.x,f.y,f.angle,range,r.power,ctx,true);
    if(r.pattern==='whirlPush' && hits) for(const t of s.fighters.filter(t=>t.hp>0&&t.team!==f.team&&t!==target&&distance(f,t)<(range*100+t.radius)**2).sort((a,b)=>distance(f,a)-distance(f,b)||a.id-b.id).slice(0,2)) {
      const [dx,dy]=normalize(t.x-f.x,t.y-f.y);t.memory.impulseX=Math.max(-1100,Math.min(1100,(t.memory.impulseX||0)+div(dx*100,UNIT)));t.memory.impulseY=Math.max(-1100,Math.min(1100,(t.memory.impulseY||0)+div(dy*100,UNIT)));
    }
    return hits>0;
  }
  if(r.pattern==='echo') {
    if(s.zones.length>=108)return false;
    const d=DIRECTIONS[f.angle];s.zones.push({owner:f.id,x:f.x,y:f.y,kit:'paint',mastery:'echo',bonus:true,radius:range,start:s.tick+9,until:s.tick+10,power:r.power,line:{dx:d[0],dy:d[1],length:range,width:13}});return true;
  }
  if(r.pattern==='return'||r.pattern==='returnSlipper') {
    if(s.projectiles.some(p=>p.owner===f.id&&p.bonus&&p.returnAfter&&p.life>0))return false;
    return !!shot(0,r.power,{life:90,returnAfter:18,pierce:5,mastery:{style:'disc',backPower:r.back??r.power,assistTicks:f.characterId==='char_19'||f.characterId==='char_06'?60:undefined,plantOnce:r.pattern==='returnSlipper'}});
  }
  if(r.pattern==='fan'||r.pattern==='envelopeFan') {
    const offsets=r.pattern==='envelopeFan'?[-2,0,2]:count===4?[-4,-2,2,4]:[-2,2];
    return offsets.map(offset=>shot(offset,r.pattern==='envelopeFan'&&offset!==0?10:r.power,{mastery:{style:'shard',assistTicks:f.characterId==='char_19'?30:f.characterId==='char_06'?1:undefined}})).some(Boolean);
  }
  if(r.pattern==='sideSlipper') {
    const offset=(f.memory.slipperSide||0)%2?-1:1;
    const p=shot(offset,r.power,{mastery:{style:'shard',plantOnce:true}});
    if(p) f.memory.slipperSide=(f.memory.slipperSide||0)+1;return !!p;
  }
  if(r.pattern==='orbit') {
    if(s.projectiles.some(p=>p.owner===f.id&&p.bonus&&p.mastery?.orbit&&p.life>0))return false;
    return [0,16].map(offset=>shot(offset,r.power,{life:45,pierce:99,mastery:{style:'orbit',orbit:65,orbitAngle:(angle+offset)%32}})).some(Boolean);
  }
  if(r.pattern==='mine') {
    if(s.projectiles.filter(p=>p.owner===f.id&&p.life>0&&p.mastery?.style==='mine').length>=2)return false;
    const d=DIRECTIONS[angle],bounds=safeBounds(s);
    const p=shot(0,r.power,{life:90,armedAfter:18,splash:55,vx:0,vy:0,mastery:{style:'mine'}});
    if(p){p.x=Math.max(bounds.left+450,Math.min(bounds.right-450,f.x+div(d[0]*8000,UNIT)));p.y=Math.max(bounds.top+450,Math.min(bounds.bottom-450,f.y+div(d[1]*8000,UNIT)));}return !!p;
  }
  const p=shot(0,r.power,{pierce:r.pattern==='harpoon'?0:1,radius:r.pattern==='charge'?850:650,mastery:{style:r.pattern==='wave'?'wave':r.pattern==='harpoon'?'hook':'drill',pull:r.pattern==='harpoon'?300:undefined,waveWidth:10}});
  if(p?.mastery){p.mastery.baseVx=p.vx;p.mastery.baseVy=p.vy;}
  if(p&&r.pattern==='charge'&&target&&distance(f,target)>(weaponReach(s,f,0)+target.radius)**2)ops.dash(s,f,target,8,1000);
  return !!p;
}
export function afterUpgradeHit(s:BattleState,f:Fighter,t:Fighter,ctx:KitCombatServices,ops:FormOperations) {
  const r=masteryUpgrade(f.masteryId);
  if(!r||r.trigger!=='hit'||f.hp<=0)return;
  if((f.memory.upgradeHitReady||0)>s.tick)return;
  if(s.tick-(f.memory.upgradeLastHit??s.tick)>120)f.memory.upgradeHits=0;
  f.memory.upgradeLastHit=s.tick;f.memory.upgradeHitReady=s.tick+attackCooldown(f,s.tick);
  f.memory.upgradeHits=Math.min(r.every!, (f.memory.upgradeHits||0)+1);
  if(f.memory.upgradeHits>=r.every!&&emitRecipe(s,f,r,angleTo(f,t),ops,ctx,t)) {f.memory.upgradeHits=0;upgradeEvent(s,f);}
}
export function afterUpgradeShot(s:BattleState,f:Fighter,p:Projectile,ops:FormOperations) {
  const r=masteryUpgrade(f.masteryId);if(!r||r.trigger!=='shot')return;
  f.memory.upgradeShots=Math.min(r.every!, (f.memory.upgradeShots||0)+1);
  if(f.characterId==='char_30'&&r.pattern==='split'){p.selfScale=div((p.selfScale||0)*90,100);p.friendlyScale=div((p.friendlyScale||0)*90,100);}
  if(f.memory.upgradeShots<r.every!)return;
  let fired=true;
  if(['split','splitKeep','impactMine'].includes(r.pattern)) {
    p.mastery={style:'shard',...(r.pattern==='impactMine'?{impactMine:r.power}:{split:3,splitPower:r.power,keepParent:true,onlyOnHit:r.pattern==='splitKeep'})};
  } else if(r.pattern==='pierce') {
    p.pierce=2;p.radius=850;p.mastery={style:'drill',piercePower:r.power,piercePush:f.characterId==='char_21'?25:0};
  } else if(r.pattern==='seeker') {const target=alignedRangedTarget(s,f,240);p.homing=true;p.target=target&&!isConstruct(target)?target.id:undefined;p.life=Math.ceil(p.life*1.2);p.mastery={style:'seeker'};
  } else if(r.pattern==='ricochet') {p.bounces=(p.bounces||0)+2;p.mastery={style:'shard',bouncePower:div((p.power||55)*50,100)};
  } else fired=emitRecipe(s,f,r,f.memory.shotAngle,ops);
  if(fired){f.memory.upgradeShots=0;upgradeEvent(s,f);}
}
export function upgradeTimer(s:BattleState,f:Fighter,ctx:KitCombatServices,ops:FormOperations) {
  const r=masteryUpgrade(f.masteryId);
  if(r?.trigger==='timer'&&(f.memory.upgradeTimer||0)<=s.tick) {
    const target=alignedRangedTarget(s,f,r.range!);
    if(target&&emitRecipe(s,f,r,f.memory.shotAngle,ops,ctx,'team'in target?target:undefined)){f.memory.upgradeTimer=s.tick+r.ticks!;upgradeEvent(s,f);}
  }
  if(f.memory.upgradeDelayed && f.memory.upgradeDelayed<=s.tick){
    f.memory.upgradeDelayed=0;
    if(r?.pattern==='delayedSwords') radialBonus(s,f,ops,10,8,30,'ricochet');
    if(r?.pattern==='delayedSword') {
      const target=s.fighters.filter(t=>t.hp>0&&t.team!==f.team).sort((a,b)=>distance(f,a)-distance(f,b)||a.id-b.id)[0];
      if(target)bonusShot(s,f,ops,angleTo(f,target),div(25*f.stats.superPower,100),{kind:'super',life:90,mastery:{style:'shard',split:4,splitPower:div(8*f.stats.superPower,100)}});
    }
  }
  return false; // Always keep the original melee attack.
}
export function upgradeCounter(s:BattleState,f:Fighter,attacker:Fighter,ops:FormOperations) {
  const r=masteryUpgrade(f.masteryId);if(r?.trigger!=='counter'||f.hp<=0||(f.memory.formCounterReady||0)>s.tick)return;
  if(!roomFor(s,f,r.count||1))return;
  let fired=false;
  if(r.pattern==='mine') {
    const p=bonusShot(s,f,ops,angleTo(f,attacker),r.power,{life:90,vx:0,vy:0,splash:55,armedAfter:12,mastery:{style:'mine'}});fired=!!p;
  } else {
    const budget=upgradeBudget(f,50);fired=[-2,0,2].map(o=>bonusShot(s,f,ops,angleTo(f,attacker)+o,r.power,{budget})).some(Boolean);
  }
  if(fired){f.memory.formCounterReady=s.tick+r.ticks!;upgradeEvent(s,f);}
}
function radialBonus(s:BattleState,f:Fighter,ops:FormOperations,power:number,count:number,cap?:number,pattern='orbit',release=30) {
  if(!roomFor(s,f,count))return false;
  const budget=cap?upgradeBudget(f,cap,true):undefined;
  for(let i=0;i<count;i++) {
    const angle=div(i*32,count);
    bonusShot(s,f,ops,angle,div(power*f.stats.superPower,100),{kind:'super',budget,life:100,bounces:pattern==='ricochet'?1:0,
      mastery:pattern==='orbit'?{style:'orbit',orbit:80,orbitAngle:angle,releaseAt:release,releaseSingleHit:true}:{style:'shard'}});
  }return true;
}
function upgradeBeam(s:BattleState,f:Fighter,target:Fighter,ctx:KitCombatServices,power:number,width:number,range:number,angle:number,budget:Projectile['budget'],bonus:boolean,rainbow=false) {
  const d=DIRECTIONS[(angle+64)%32],x=f.x+div(d[0]*range*100,UNIT),y=f.y+div(d[1]*range*100,UNIT);
  for(const t of s.fighters)if(t.hp>0&&t!==f&&capsuleHit(f.x,f.y,x,y,t.x,t.y,t.radius+width*50)){
    if(t.team!==f.team){const raw=spendUpgrade(f,t.id,div(f.stats.attack*power*f.stats.superPower,10000),budget);if(raw>0)ctx.damage(s,f,t,raw,false,bonus);}
    else if(rainbow){applyStatus(s,f,t,'rage',16,60);applyStatus(s,f,t,'blessing',5,60);}
  }
  for(const c of s.constructs)if(c.hp>0&&s.fighters[c.owner]?.team!==f.team&&capsuleHit(f.x,f.y,x,y,c.x,c.y,c.radius+width*50))c.hp=Math.max(0,c.hp-spendUpgrade(f,-c.id-1,div(f.stats.attack*power*f.stats.superPower,10000),budget));
  s.events.push({tick:s.tick,type:'kit:beam',source:f.id,target:target.id,amount:range,x:f.x,y:f.y,angle});
}
export function spawnUpgradeConstruct(s:BattleState,f:Fighter,pattern:string,count:number,power:number,cap?:number) {
  const specs:Record<string,[number,number,number,number]>={ // HP %, life ticks, interval, heal % *100
    drone:[40,240,30,0],fanTurret:[40,240,30,0],hunter:[12,150,24,0],ram:[12,120,24,0],bodyguard:[20,120,30,0],
    medic:[18,150,45,150],brazier:[20,120,45,0],supply:[15,120,60,100],bank:[15,120,45,0],mortar:[12,90,45,0],
  };
  const [hpPercent,life,interval,heal]=specs[pattern];
  const replacement=['drone','fanTurret'].includes(pattern);
  const live=s.constructs.filter(c=>c.owner===f.id&&c.hp>0&&c.until>s.tick&&c.upgrade);
  if(replacement)for(const c of live)c.hp=0;
  else if(live.length)return false;
  if(s.constructs.filter(c=>c.hp>0&&c.until>s.tick).length+count>56)return false;
  const budget=upgradeBudget(f,cap||100000,true,true),bounds=safeBounds(s);
  const anchor=['bodyguard','medic','supply'].includes(pattern)?weakestAlly(s,f)||f:undefined;
  for(let i=0;i<count;i++) {
    const d=DIRECTIONS[(f.angle+8+i*16)%32],origin=anchor||f;
    const kind:Construct['kind']=['fanTurret','brazier','supply','bank','mortar'].includes(pattern)?'turret':'minion';
    const hp=Math.max(12,div(f.baseStats.hp*hpPercent,100));
    s.constructs.push({id:s.nextConstruct++,owner:f.id,kind,variant:pattern as Construct['variant'],anchor:anchor?.id,x:Math.max(bounds.left+1100,Math.min(bounds.right-1100,origin.x+div(d[0]*5000,UNIT))),y:Math.max(bounds.top+1100,Math.min(bounds.bottom-1100,origin.y+div(d[1]*5000,UNIT))),vx:div(d[0]*480,UNIT),vy:div(d[1]*480,UNIT),radius:1100,hp,maxHp:hp,damage:div(f.baseStats.attack*power*f.stats.superPower,10000),until:s.tick+life,nextAttack:s.tick+20,upgrade:{group:budget.id,cap:cap?budget.cap:undefined,interval,heal,healTicks:interval,healRange:pattern==='supply'?220:60,nextHeal:s.tick+20,passive:pattern==='bodyguard'||!!heal,auxiliary:!replacement,superScale:f.stats.superPower}});
  }return true;
}
export function beforeUpgradeSuper(s:BattleState,f:Fighter,t:Fighter,ctx:KitCombatServices,ops:FormOperations):boolean|undefined {
  const r=masteryUpgrade(f.masteryId);if(r?.trigger!=='super'||!r.replace)return undefined;
  const angle=angleTo(f,t);let fired=true;
  if(r.pattern==='drone'||r.pattern==='fanTurret')fired=spawnUpgradeConstruct(s,f,r.pattern,1,r.power,r.cap);
  else if(r.pattern==='laser'||r.pattern==='scan') {
    const equipped=characterKit(f.characterId,f.equipment)?.id;
    const power=r.pattern==='scan'&&equipped==='wacom'?320:r.power;
    const cap=r.pattern==='scan'&&equipped==='wacom'?340:r.cap!;
    const budget=upgradeBudget(f,cap,true);
    upgradeBeam(s,f,t,ctx,power,r.pattern==='laser'&&equipped==='fu_di'?45:22,300,angle,budget,false);
    for(const offset of [-3,3])upgradeBeam(s,f,t,ctx,r.pattern==='laser'?15:20,18,260,(angle+offset+32)%32,budget,true);
    if(r.pattern==='laser'&&equipped!=='fu_di')applyStatus(s,f,f,'burn',3,90,true);
  } else if(r.pattern==='escortBalloons') {
    const power=characterKit(f.characterId,f.equipment)?.id==='skyrocket'?70:65;
    if(!roomFor(s,f,8))return false;
    const budget=upgradeBudget(f,power*3,true);
    for(let i=0;i<8;i++)bonusShot(s,f,ops,div(i*32,8),div(power*f.stats.superPower,100),{kind:'super',budget,life:120,mastery:{style:'orbit',orbit:80,orbitAngle:div(i*32,8),releaseAt:15,releaseSingleHit:true}});
  } else if(r.pattern==='chicken') {
    if(!roomFor(s,f,2))return false;
    // The main chicken is emitted through the original Super below.
    return undefined;
  }
  if(fired){f.superUntil=s.tick+90;upgradeEvent(s,f);}return fired;
}
export function afterUpgradeSuper(s:BattleState,f:Fighter,t:Fighter,ctx:KitCombatServices,ops:FormOperations) {
  const r=masteryUpgrade(f.masteryId);if(r?.trigger!=='super')return;
  const a=angleTo(f,t),pattern=r.pattern;
  if(['hunter','ram','bodyguard','medic','brazier','supply','bank','mortar'].includes(pattern))spawnUpgradeConstruct(s,f,pattern,r.count||1,r.power,r.cap);
  else if(pattern==='orbit')radialBonus(s,f,ops,r.power,r.count!,undefined,'orbit',f.characterId==='char_21'?18:30);
  else if(pattern==='ricochet')radialBonus(s,f,ops,r.power,r.count!,r.cap,'ricochet');
  else if(pattern==='delayedSwords'||pattern==='delayedSword')f.memory.upgradeDelayed=f.superUntil;
  else if(pattern==='basketMines') {
    const p=s.projectiles.slice().reverse().find(p=>p.owner===f.id&&p.kit==='basket'&&p.superShot);if(p)p.mastery={style:'shard',impactMines:5,impactMine:div(10*f.stats.superPower,100)};
  } else if(pattern==='crossRainbow')upgradeBeam(s,f,t,ctx,35,18,260,(a+8)%32,undefined,true,true);
  else if(pattern==='crossInk') {const budget=upgradeBudget(f,16,true);for(let i=0;i<4;i++)upgradeBeam(s,f,t,ctx,8,18,260,(a+i*8)%32,budget,true);}
  else if(pattern==='chain')bonusShot(s,f,ops,a,div(15*f.stats.superPower,100),{kind:'super',life:90,mastery:{style:'chain',chain:2}});
  else if(pattern==='chicken') {
    const budget=upgradeBudget(f,40,true);for(const offset of [-4,4])bonusShot(s,f,ops,a+offset,div(15*f.stats.superPower,100),{kit:'chicken',kind:'super',budget,life:130,pierce:5,returnAfter:28,mastery:{style:'disc'}});
  } else if(['paintWings','vortexWings','slipperWings','followVortex'].includes(pattern)) {
    const kind=pattern==='paintWings'?'paint':pattern==='slipperWings'?'slipper':'vortex';
    const base=pattern==='followVortex'?f:t;
    for(let i=0;i<(r.count||1);i++) {
      const angle=pattern==='slipperWings'?div(i*32,3):(a+8+i*16)%32,d=DIRECTIONS[angle];
      const offset=pattern==='followVortex'?0:pattern==='paintWings'?150:pattern==='slipperWings'?175:160;
      ops.field(s,f,kind,base.x+div(d[0]*offset*100,UNIT),base.y+div(d[1]*offset*100,UNIT),pattern==='followVortex'?100:pattern==='slipperWings'?35:45,90,r.power,{bonus:true,super:true,follow:pattern==='followVortex',pullScale:25,start:pattern==='followVortex'?0:15});
    }
  }
  upgradeEvent(s,f);
}
