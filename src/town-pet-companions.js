import * as THREE from 'three';
import {createPetAnimal,animatePet} from './town-pet-home.js';
import {cottagePetFurniture} from './town-pet-layout.js';
import {canWalk,movePlayer} from './town-player.js';
import {facing} from './town-life.js';
import {localDoor} from './town-building-portals.js';

const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const petOutsideZ=portal=>Math.max(4.3,(1.75-portal.layout.z)/(portal.layout.depth/6));
function segmentClear(actor,a,b){const steps=Math.ceil(distance(a,b)/.04);for(let i=1;i<=steps;i++)if(!canWalk(actor,a.x+(b.x-a.x)*i/steps,a.z+(b.z-a.z)*i/steps))return false;return true}
// Route planning and movement share the same door, furniture and body-clearance checks.
function petPath(actor,target){
 const indoors=!!actor.inside,unit=indoors?.2:.4,key=(x,z)=>`${x},${z}`;
 function anchor(point){const x=Math.round(point.x/unit),z=Math.round(point.z/unit),choices=[];for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){const p={x:(x+dx)*unit,z:(z+dz)*unit};if(canWalk(actor,p.x,p.z)&&segmentClear(actor,point,p))choices.push({x:x+dx,z:z+dz,d:distance(point,p)})}return choices.sort((a,b)=>a.d-b.d)[0]}
 const start=anchor(actor.position),end=anchor(target);if(!start||!end)return [];const queue=[{...start,g:0,f:0}],cost=new Map([[key(start.x,start.z),0]]),parents=new Map();let found=false;
 while(queue.length){queue.sort((a,b)=>a.f-b.f);const n=queue.shift(),nk=key(n.x,n.z);if(n.g!==cost.get(nk))continue;if(n.x===end.x&&n.z===end.z){found=true;break}for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[-1,1],[1,-1]]){const x=n.x+dx,z=n.z+dz,k=key(x,z);if(indoors?(Math.abs(x)>20||z< -15||z>22):(Math.abs(x)>44||Math.abs(z)>44))continue;const g=n.g+Math.hypot(dx,dz);if(g>=(cost.get(k)??Infinity)||!segmentClear(actor,{x:n.x*unit,z:n.z*unit},{x:x*unit,z:z*unit}))continue;cost.set(k,g);parents.set(k,nk);queue.push({x,z,g,f:g+Math.hypot(x-end.x,z-end.z)})}}
 if(!found)return [];const path=[];for(let k=key(end.x,end.z);k;k=parents.get(k)){const [x,z]=k.split(',').map(Number);path.unshift({x:x*unit,z:z*unit})}path.push({...target});return path;
}
export const petRoomPath=(actor,target)=>petPath(actor,target);
export const petOutdoorPath=(actor,target)=>petPath(actor,target);
function followingPoint(actor,leader,index){
 const gap=actor.inside?.8+index*.9:.55+index*.25,heading=leader.heading||0;
 for(const turn of [0,.7,-.7,1.4,-1.4,Math.PI]){const p={x:leader.position.x-Math.sin(heading+turn)*gap,z:leader.position.z-Math.cos(heading+turn)*gap};if(canWalk(actor,p.x,p.z))return p}return {...actor.position};
}
export function createPetCompanions({scene,rooms,models,clickable}){
 const pets=new Map();let initialized=false;
 const worldPoint=(name,x,z)=>rooms.get(name).localToWorld(new THREE.Vector3(x,0,z));
 function sync(state){
  for(const [index,pet] of (state.petHome?.pets||[]).entries())if(!pets.has(pet.id)){const newlyAdopted=initialized&&state.petHome.follow,inside=newlyAdopted?'宠物之家':'鼠鼠小屋',position=newlyAdopted?{x:pet.id==='cat'?-1.85:.3,z:.5}:{x:cottagePetFurniture.beds[index][0],z:cottagePetFurniture.beds[index][1]},rig=createPetAnimal(pet.id);rig.userData.roomAction='owned-pet';rig.userData.petId=pet.id;rig.scale.setScalar(.25);scene.add(rig);clickable.push(rig);pets.set(pet.id,{id:pet.id,inside,position,heading:0,rig,path:[],replan:0,petCompanion:true})}initialized=true;
 }
 function prepare(actor,state){const portal=actor.inside?models.get(actor.inside).userData.portal:actor.entryPortal;actor.doorway=portal?{...localDoor(portal),open:portal.angle>1}:null;actor.cottageTableSlot=state.furniture?.table?.slot;actor.petFacilities={...state.petHome?.facilities,pets:state.petHome?.pets,food:state.petHome?.food,hasPets:!!state.petHome?.pets.length}}
 function walkTo(actor,target,dt){
  actor.replan-=dt;if(!actor.goal||distance(actor.goal,target)>(actor.inside?.65:.8)||(!actor.path.length&&actor.replan<=0&&distance(actor.position,target)>.12)){actor.goal={...target};actor.path=petPath(actor,target);actor.replan=1}
  const scale=actor.inside?rooms.get(actor.inside).scale:null;let budget=dt*.9;
  while(budget>0&&actor.path.length){const next=actor.path[0],dx=next.x-actor.position.x,dz=next.z-actor.position.z,d=Math.hypot(dx*(scale?.x||1),dz*(scale?.z||1));if(d<.005){actor.path.shift();continue}const fraction=Math.min(1,budget/d),before={...actor.position};movePlayer(actor,dx*fraction,dz*fraction);const moved=distance(before,actor.position);if(moved<.0001){actor.path=[];actor.replan=1;break}actor.moving=true;actor.heading=Math.atan2(dx,dz);budget-=d*fraction;if(distance(actor.position,next)<.005)actor.path.shift();else break}
  return distance(actor.position,target)<.12;
 }
 function tick(dt,leader,state,activePlace,firstPerson){
  let index=0;for(const actor of pets.values()){
   prepare(actor,state);actor.moving=false;const follow=state.petHome?.follow&&state.alive!==false&&leader&&!leader.forcedSleep&&!leader.frozen,wanted=follow?(leader.inside||null):'鼠鼠小屋';
   if(actor.exiting){const portal=actor.exiting,gate=localDoor(portal),p=worldPoint(portal.name,gate.x,petOutsideZ(portal));actor.entryPortal=portal;prepare(actor,state);const target={x:p.x,z:p.z};actor.path=[target];actor.goal=target;if(walkTo(actor,target,dt)){actor.exiting=null;actor.path=[];actor.goal=null}}
   else if(actor.inside!==wanted){
    if(actor.inside){const name=actor.inside,portal=models.get(name).userData.portal,gate=localDoor(portal);if(distance(actor.position,{x:gate.x,z:2.35})<1.1)portal.target=1;prepare(actor,state);if(walkTo(actor,{x:gate.x,z:portal.angle>1?4.1:2.35},dt)&&portal.angle>1){const p=worldPoint(name,actor.position.x,actor.position.z);actor.position={x:p.x,z:p.z};actor.inside=null;actor.exiting=portal;actor.path=[];actor.goal=null}}
    else if(wanted){const portal=models.get(wanted).userData.portal,gate=localDoor(portal),approach=worldPoint(wanted,gate.x,petOutsideZ(portal));actor.entryPortal=portal;prepare(actor,state);if(actor.entering===wanted){portal.target=1;if(portal.angle>1){const p=worldPoint(wanted,gate.x,4.05),target={x:p.x,z:p.z};actor.path=[target];actor.goal=target;walkTo(actor,target,dt);if(distance(actor.position,target)<.03){const local=rooms.get(wanted).worldToLocal(new THREE.Vector3(actor.position.x,portal.layout.floor,actor.position.z));actor.position={x:local.x,z:local.z};actor.inside=wanted;actor.entering=null;actor.path=[];actor.goal=null}}}else if(distance(actor.position,{x:approach.x,z:approach.z})<.03){actor.entering=wanted;actor.path=[];actor.goal=null}else walkTo(actor,{x:approach.x,z:approach.z},dt)}
   }else{
    actor.entryPortal=null;const homePoint=cottagePetFurniture.beds[index],target=follow?followingPoint(actor,leader,index):{x:homePoint[0],z:homePoint[1]};walkTo(actor,target,dt);
   }
   const p=new THREE.Vector3(actor.position.x,0,actor.position.z);if(actor.inside)rooms.get(actor.inside).localToWorld(p);else p.y=.03;actor.reaction=Math.max(0,(actor.reaction||0)-dt);if(actor.reaction>0)p.y+=Math.sin(Math.PI*(1-actor.reaction/.65))*.18;actor.rig.position.copy(p);actor.rig.rotation.y=actor.heading+(actor.inside?facing(actor.inside):0);actor.rig.visible=actor.inside?!!rooms.get(actor.inside)?.visible&&(firstPerson||!activePlace||activePlace===actor.inside):firstPerson||!activePlace;
   const data=actor.rig.userData;if(data.playFor>0)data.playFor-=dt;else animatePet(actor.rig,actor.moving?'walk':'idle');data.mixer?.update(dt);index++;
  }
 }
 function interact(action,petId){for(const actor of pets.values()){if(petId&&actor.id!==petId)continue;if(action==='click')actor.reaction=.65;animatePet(actor.rig,action==='feed'?'eat':'gesture-positive');actor.rig.userData.playFor=3}}
 return {sync,tick,interact,inspect:()=>[...pets.values()].map(a=>({id:a.id,inside:a.inside,position:{...a.position},worldPosition:a.rig.position.toArray(),reaction:a.reaction||0,moving:a.moving,loaded:!!a.rig.userData.loaded,error:!!a.rig.userData.loadError,animation:a.rig.userData.animation,visible:a.rig.visible}))};
}
