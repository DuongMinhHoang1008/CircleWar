/** v38 recipes: attacks supplement the original kit, never replace its cadence. */
export interface MasteryUpgrade {
  trigger: 'hit' | 'shot' | 'timer' | 'counter' | 'super';
  pattern: string;
  power: number;
  every?: number;
  range?: number;
  back?: number;
  count?: number;
  cap?: number;
  ticks?: number;
  replace?: boolean;
}
const hit = (pattern:string,power:number,every=4,range=180,back?:number):MasteryUpgrade => ({trigger:'hit',pattern,power,every,range,back});
const shot = (pattern:string,power:number,every=4,back?:number):MasteryUpgrade => ({trigger:'shot',pattern,power,every,back});
const timer = (pattern:string,power:number,ticks:number,range:number,back?:number):MasteryUpgrade => ({trigger:'timer',pattern,power,ticks,range,back});
const superFx = (pattern:string,power:number,count=1,cap?:number,replace=false):MasteryUpgrade => ({trigger:'super',pattern,power,count,cap,replace});
const paths:Record<string,readonly [MasteryUpgrade,MasteryUpgrade,MasteryUpgrade]> = {
  char_02:[hit('whirl',40,4,82),timer('harpoon',50,120,160),superFx('orbit',15,3)],
  char_03:[shot('splitKeep',15),shot('return',45,5,30),superFx('basketMines',10,5,30)],
  char_04:[hit('wave',45,4,200),timer('charge',45,120,140),superFx('followVortex',10)],
  char_05:[shot('pierce',25,1),superFx('drone',55,1,undefined,true),superFx('fanTurret',50,1,60,true)],
  char_06:[shot('fan',20),shot('return',35,5,35),superFx('crossRainbow',35,1)],
  char_07:[hit('return',35,4,170,35),{trigger:'counter',pattern:'mine',power:65,ticks:180},superFx('ricochet',8,8,24)],
  char_08:[hit('cross',40,4,90),hit('return',45,5,190,30),superFx('hunter',10,2,60)],
  char_09:[shot('return',40,5,40),shot('impactMine',40),superFx('chain',15,3)],
  char_10:[hit('whirl',40,4,78),hit('return',40,5,175,40),superFx('ram',15,2,60)],
  char_12:[hit('cross',40,4,105),hit('echo',45,3,95),superFx('delayedSwords',10,8,30)],
  char_15:[timer('return',40,120,180,40),{trigger:'counter',pattern:'fan',power:25,ticks:180,count:3,cap:50},superFx('bodyguard',0)],
  char_16:[shot('split',15),shot('wave',45),superFx('paintWings',10,2)],
  char_17:[hit('pierce',45,4,125),hit('return',45,5,195,30),superFx('medic',0)],
  char_18:[hit('sweep',45,4,90),hit('return',40,5,175,40),superFx('brazier',12)],
  char_19:[hit('envelopeFan',20,4,180),hit('return',35,5,190,35),superFx('supply',0)],
  char_21:[{...shot('fan',10),count:4,cap:30},shot('pierce',25,1),superFx('orbit',10,3)],
  char_23:[hit('pierce',45,4,135),hit('cross',40,4,110),superFx('delayedSword',25)],
  char_24:[shot('fan',20),shot('seeker',100,3),superFx('crossInk',8,4,16)],
  char_25:[timer('orbit',20,90,65),hit('pierce',45,4,170),superFx('bank',5,1,30)],
  char_26:[hit('wave',40,4,200),hit('whirlPush',35,4,75),superFx('vortexWings',8,2)],
  char_27:[hit('pierce',40,4,150),hit('return',40,5,180,40),superFx('orbit',10,3)],
  char_28:[timer('charge',50,120,145),hit('return',40,5,190,40),superFx('laser',210,3,230,true)],
  char_29:[shot('split',10),shot('ricochet',50,3),superFx('scan',310,3,330,true)],
  char_30:[shot('split',15),shot('mine',45),superFx('escortBalloons',65,8,195,true)],
  char_31:[shot('split',15),shot('seeker',100,3),superFx('mortar',10,2,40)],
  char_32:[shot('returnSlipper',35,5,35),shot('sideSlipper',35),superFx('slipperWings',8,3)],
  char_33:[hit('pierce',40,4,170),hit('whirl',40,4,85),superFx('chicken',125,3,40,true)],
};
export const MASTERY_UPGRADES:Record<string,MasteryUpgrade> = Object.fromEntries(
  Object.entries(paths).flatMap(([id,entries])=>entries.map((entry,i)=>[`${id}:${['pressure','resolve','tempo'][i]}`,entry])),
);
export const masteryUpgrade=(id?:string)=>id ? MASTERY_UPGRADES[id] : undefined;
