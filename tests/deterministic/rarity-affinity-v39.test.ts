import {expect,it} from 'vitest';
import {ROSTER,CATALOG_ITEMS} from '../../packages/shared/src/catalog';
import {computeStats,itemModifiers} from '../../packages/shared/src/balance';
import {CHARACTER_BALANCE,PRINTED_RARITY_POWER} from '../../packages/shared/src/combat-balance';
import {cardRarityMultiplier} from '../../packages/shared/src/progression';
import {loanUnit,adventureConfig} from '../../packages/shared/src/adventure';
import {createBattle} from '../../packages/battle-engine/src/index';
import {kitSuper,fieldAffinityScale,type KitCombatServices} from '../../packages/battle-engine/src/kit-combat';
it('applies printed rarity to base HP/ATK once at every progression milestone without changing item rarity',()=>{
  for(const c of ROSTER)for(const level of [1,3,7,10]){
    const unit=loanUnit(c.id as any,'',level),s=computeStats(unit),base=CHARACTER_BALANCE[c.id].stats;
    for(const key of ['hp','attack'] as const)expect(s[key]).toBe(Math.round(base[key]!*cardRarityMultiplier(c.tier,level)*PRINTED_RARITY_POWER[c.tier]));
    const item=CATALOG_ITEMS.find(i=>i.affinity===c.id)!;
    const equipped=computeStats(loanUnit(c.id as any,item.id,level)),mods=itemModifiers(item.id,level,true);
    // Transformations retain their existing evolution increment; ordinary affinities use the same base.
    if(!['char_28','char_29','char_30'].includes(c.id))for(const key of ['hp','attack'] as const)expect(equipped[key]).toBe(Math.round(base[key]!*cardRarityMultiplier(c.tier,level)*PRINTED_RARITY_POWER[c.tier]*1.02)+(mods[key]||0));
  }
  expect(itemModifiers('item_05',10,true).speed).toBe(itemModifiers('item_05',10,false).speed);
  expect(itemModifiers('item_05',10,true).hp).toBeGreaterThan(itemModifiers('item_05',10,false).hp!);
});
const ctx:KitCombatServices={damage:()=>1,normal:()=>true,heal:()=>0,shield:()=>{},buff:()=>{}};
it('uses separate regular and transformed escort caps and giant affinity HP only on its owner',()=>{
  for(const [item,power] of [['',65],['item_30',70]] as const){
    const s=createBattle(adventureConfig([{...loanUnit('char_30',item),masteryId:'char_30:tempo'}],[loanUnit('char_01')]),5),f=s.fighters[0];s.tick=1;
    expect(kitSuper(s,f,ctx)).toBeTruthy();
    expect(s.projectiles.filter(p=>p.bonus)).toHaveLength(8);
    expect(s.projectiles[0].power).toBe(Math.floor(power*f.stats.superPower/100));
    expect(s.projectiles[0].budget?.cap).toBe(Math.floor(f.stats.attack*power*3*f.stats.superPower/10000));
  }
  for(const item of ['', 'item_08']){
    const s=createBattle(adventureConfig([loanUnit('char_14',item)],[loanUnit('char_01')]),5),f=s.fighters[0];s.tick=1;kitSuper(s,f,ctx);
    const normal=Math.max(35,Math.floor(f.baseStats.hp*70/100));
    expect(s.constructs[0].hp).toBe(normal+(item?Math.min(25,Math.floor(f.baseStats.hp*6/100)):0));
  }
});
it('boosts only the intended affinity fields, keeping Phonk wings unmodified',()=>{
  const s=createBattle(adventureConfig([loanUnit('char_26','item_26'),loanUnit('char_32','item_32')],[loanUnit('char_01')]),5);
  const zone={owner:0,x:0,y:0,until:100,kit:'vortex' as const};
  expect(fieldAffinityScale(s.fighters[0],zone)).toBe(108);
  expect(fieldAffinityScale(s.fighters[0],{...zone,bonus:true})).toBe(100);
  expect(fieldAffinityScale(s.fighters[1],{...zone,kit:'slipper'})).toBe(108);
});
it('caps all scan beams together with the improved matched form',()=>{
  for(const [item,cap] of [['',330],['item_29',340]] as const){
    const s=createBattle(adventureConfig([{...loanUnit('char_29',item),masteryId:'char_29:tempo'}],[loanUnit('char_01')]),5),[f,t]=s.fighters;
    s.tick=1;f.x=30000;f.y=30000;t.x=33000;t.y=30000;f.stats.attack=100;f.stats.superPower=100;
    let total=0;kitSuper(s,f,{...ctx,damage:(_s,_f,_t,raw)=>{total+=raw;return raw;}});
    expect(total).toBe(cap);
  }
});
