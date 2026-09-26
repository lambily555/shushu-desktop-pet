import assert from 'node:assert/strict';
import {createTownLife,destinations,route,blocked} from '../src/town-life.js';
for(const a of destinations)for(const b of destinations){const path=route({x:a[1],z:a[2]+1.6},{x:b[1],z:b[2]+1.6});assert.ok(path.length,`${a[0]} -> ${b[0]}`);assert.ok(path.every(p=>!blocked(p.x,p.z)))}
const events=[],life=createTownLife(e=>events.push(e));life.add('main','鼠鼠小屋');destinations.forEach((d,i)=>life.add('npc-'+i,d[0]));
let indoor=false,closeConversation=false;
for(let i=0;i<2400;i++){const before=new Map([...life.actors].map(([id,a])=>[id,{...a.position,inside:a.inside}]));life.tick(.25,false);for(const [id,a] of life.actors){const old=before.get(id);if(old.inside===a.inside)assert.ok(Math.hypot(a.position.x-old.x,a.position.z-old.z)<.3,'teleport');if(a.inside&&a.phase==='activity')indoor=true;if(a.phase==='talking'){const b=life.actors.get(a.partner);assert.ok(Math.hypot(a.position.x-b.position.x,a.position.z-b.position.z)<.85);closeConversation=true}}}
assert.ok(indoor);assert.ok(closeConversation);assert.ok(life.actors.get('npc-1').visited.has('小菜园'));assert.ok(life.actors.get('main').visited.size>=4);assert.ok(events.some(e=>e.type==='social'&&(e.id==='main'||e.otherId==='main')));assert.ok(events.some(e=>e.type==='social'&&e.id!=='main'&&e.otherId!=='main'));
console.log(JSON.stringify({passed:true,routePairs:81,conversations:life.inspect().conversations,mainVisited:[...life.actors.get('main').visited],doctorVisited:[...life.actors.get('npc-1').visited]}));
assert.equal(life.actors.get('main').visited.size,9);
const paused=createTownLife();const resting=paused.add('main','鼠鼠小屋');resting.frozen=true;const position={...resting.position};for(let i=0;i<20;i++)paused.tick(1);assert.deepEqual(resting.position,position);assert.equal(resting.cycle,0);
