import { MASTERIES } from '../../packages/shared/src/mastery';
import { character } from '../../packages/shared/src/catalog';
import { characterKit } from '../../packages/shared/src/character-kits';
for(let i=1;i<=33;i++) {const id=`char_${String(i).padStart(2,'0')}`;console.log(`\n${id} ${character(id)?.name}\nGốc: ${characterKit(id)?.normal}\nSuper: ${characterKit(id)?.super}`); for(const s of MASTERIES.filter(m=>m.characterId===id)) console.log(`${s.id} | ${s.name} | ${JSON.stringify(s.form||{})} | ${s.description} | Đổi:${s.tradeoff}`);}
