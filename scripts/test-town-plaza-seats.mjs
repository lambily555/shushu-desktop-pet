import assert from 'node:assert/strict';
import * as THREE from 'three';
const context=new Proxy({measureText:t=>({width:t.length*16}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});globalThis.document={createElement:()=>({getContext:()=>context})};
const {createPlaza}=await import('../src/town-grounds.js');
const {plazaSeats}=await import('../src/town-plaza-seats.js');
const {canWalk}=await import('../src/town-player.js');
const {destinations,createTownLife}=await import('../src/town-life.js');
const plaza=createPlaza(),origin=destinations.find(d=>d[0]==='中心广场');plaza.position.set(origin[1],0,origin[2]);plaza.updateMatrixWorld(true);
assert.equal(plaza.userData.plazaSeats.length,4);
for(const [i,bench]of plaza.userData.plazaSeats.entries()){
 const s=plazaSeats[i],p=bench.getWorldPosition(new THREE.Vector3()),front=bench.localToWorld(new THREE.Vector3(0,0,.55));
 assert.ok(Math.abs(p.x-origin[1]-s.x)<1e-6&&Math.abs(p.z-origin[2]-s.z)<1e-6,'bench and collision use the rendered coordinates');
 assert.ok(Math.sin(s.heading)*-s.x+Math.cos(s.heading)*-s.z>0,'bench faces plaza centre');
 const hit=new THREE.Raycaster(p.clone().setY(1),new THREE.Vector3(0,-1,0),0,1).intersectObject(bench,true)[0];assert.ok(hit&&Math.abs(hit.point.y-s.y)<1e-6,'seated height matches seat surface');assert.equal(hit.object.userData.townAction,'plaza-seat');assert.equal(hit.object.userData.seatIndex,i);
 assert.equal(canWalk({},p.x,p.z),false,'bench blocks walking');assert.equal(canWalk({},front.x,front.z),true,'standing point is walkable');
 for(const mesh of bench.children){const bounds=new THREE.Box3().setFromObject(mesh);for(const x of [bounds.min.x,bounds.max.x])for(const z of [bounds.min.z,bounds.max.z])assert.ok(((x-origin[1])/4.45)**2+((z-origin[2])/2.54)**2<1,'bench stays on plaza paving')}
}
for(const x of [-.3,0,.3])for(let z=1;z<2.6;z+=.1)assert.equal(canWalk({},origin[1]+x,origin[2]+z),true,'front centre passage stays open');
const life=createTownLife(),actor=life.add('main','中心广场');actor.plazaSeat=0;actor.seated=true;actor.controlled=true;life.setResting(true);assert.equal(actor.plazaSeat,undefined);assert.equal(actor.seated,false);
console.log('Plaza seat surfaces, facing, paving bounds, collision, aisle and sleep release passed');

const busy=createTownLife(),player=busy.add('main','中心广场');player.controlled=true;player.plazaSeat=0;player.seated=true;
for(let i=0;i<6;i++){const a=busy.add('npc-'+i,'中心广场');a.phase='meeting';a.wait=0;a.action='社交';a.destination='中心广场';a.allowSocial=false}
let seatedCount=0;for(let t=0;t<300;t++){busy.tick(.1);const seated=[...busy.actors.values()].filter(a=>a.plazaSeat!==undefined),reserved=[...busy.actors.values()].filter(a=>a.plazaSeatReservation!==undefined);const seats=[...seated.map(a=>a.plazaSeat),...reserved.map(a=>a.plazaSeatReservation)];assert.equal(new Set(seats).size,seats.length,'seats and reservations are exclusive');seatedCount=Math.max(seatedCount,seated.filter(a=>a.id!=='main').length)}assert.ok(seatedCount>=2,'NPCs walk to free seats and rest');assert.equal(busy.plazaSeatAvailable(0,'npc-0'),false,'player seat is occupied');busy.setCelebration({key:'party',birthdays:[]});assert.ok([...busy.actors.values()].filter(a=>a.id!=='main').every(a=>a.plazaSeat===undefined&&a.plazaSeatReservation===undefined&&!a.seated),'NPCs release seats for celebrations');
const statue=plaza.userData.statue;assert.equal(statue.userData.lights.length,2);assert.ok(statue.userData.lights.every(l=>l.isSpotLight&&!l.castShadow&&l.target.parent===statue),'aimed lights do not allocate shadow maps');assert.ok(statue.getObjectByName('Sun halo'));
console.log('NPC seat ownership, walking/resting, celebration release and statue lighting passed');
