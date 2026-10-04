const assert=require('node:assert/strict');
const sim=require('../src/town-sim.js');
const now=new Date(2026,9,4,12).getTime(),keys=['silver','pudding','three-line','violet'];
const state=sim.defaults(now);
assert.deepEqual([...new Set(state.npcs.map(n=>n.coat))].sort(),[...keys].sort(),'NPC population includes all four coats');
const legacy=structuredClone(state);delete legacy.mainCoat;legacy.npcs.forEach(n=>delete n.coat);legacy.offspring=[{id:'old-child',parentId:'npc-0',ageYears:.1}];legacy.npcOffspring=[{id:'old-family',parentIds:['npc-0','npc-1'],ageYears:.1}];
const migrated=sim.migrate(legacy,now),saved=JSON.parse(JSON.stringify(migrated));
assert.deepEqual(sim.migrate(saved,now+1000),{...saved},'coat migration is stable after save/reload');
for(const n of [...migrated.npcs,...migrated.offspring,...migrated.npcOffspring])assert.ok(keys.includes(n.coat));
assert.equal(legacy.npcs[0].coat,undefined,'migration does not change input residents');
state.mainCoat='silver';state.npcs[0].coat='pudding';state.npcs[0].relationship=90;state.lifeStage='成年';
const born=sim.breed(state,'npc-0');assert.equal(born.ok,true);
assert.ok(born.state.offspring.every(p=>keys.includes(p.coat)));
const adopted=sim.adopt(born.state,born.state.offspring[0].id);assert.equal(adopted.state.mainCoat,born.state.offspring[0].coat);
const colors=new Set();let inherited=0,total=0;
for(let i=0;i<160;i++){
  const pair=sim.breedNpcPair(state,'npc-0','npc-1',now+i*1000);assert.equal(pair.ok,true);
  for(const pup of pair.state.npcOffspring){colors.add(pup.coat);total++;if([state.npcs[0].coat,state.npcs[1].coat].includes(pup.coat))inherited++}
  assert.deepEqual(sim.migrate(pair.state,now).npcOffspring,pair.state.npcOffspring);
}
assert.equal(colors.size,4,'offspring can express each coat');assert.ok(inherited/total>.75,'parent coats are preferred');
const invalid=sim.migrate({...state,mainCoat:'invalid',npcs:state.npcs.map(n=>({...n,coat:'invalid'}))},now);assert.ok(keys.includes(invalid.mainCoat));assert.ok(invalid.npcs.every(n=>keys.includes(n.coat)));
console.log('Town coat migration, inheritance, persistence and adoption tests passed');
