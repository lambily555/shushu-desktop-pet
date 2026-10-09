import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {cottagePetFurniture} from './town-pet-layout.js';

export const petHomeFurniture={counter:[2.75,.9,.45,1.05],shelf:[0,-2.4,3.45,.35],beds:[[-2.65,-1.35],[-.85,-1.35]],animals:[[-1.85,.5],[.3,.5]],toy:[2.7,-1.2]};
const material=color=>new THREE.MeshStandardMaterial({color,roughness:.82});
function box(group,w,h,d,x,y,z,color){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(color));mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);return mesh}
function sign(group,text,w,h,x,y,z){const c=document.createElement('canvas');c.width=768;c.height=192;const g=c.getContext('2d');g.fillStyle='#77482d';g.fillRect(0,0,c.width,c.height);g.strokeStyle='#dcaa64';g.lineWidth=12;g.strokeRect(8,8,752,176);g.fillStyle='#ffe3a2';g.font='bold 84px Microsoft YaHei';g.textAlign='center';g.textBaseline='middle';g.fillText(text,384,98);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide}));mesh.position.set(x,y,z);group.add(mesh);return mesh}
export function createPetHome(){
 const group=new THREE.Group();group.name='宠物之家';group.userData.footprint={width:4,depth:3.15};
 box(group,3.95,.1,3,0,.05,0,0x91623c);
 // Both roof slopes sit above the shared ceiling; no solid core covers the room.
 for(const side of [-1,1]){const roof=box(group,2.18,.09,3.15,side*.95,2.22,0,0xc87535);roof.rotation.z=-side*.31;roof.userData.petRoof=true;for(let i=0;i<10;i++){const tile=box(group,.2,.015,3.14,side*(.08+i*.2),2.5-i*.061,0,i%2?0xe29a4c:0xd58a40);tile.userData.petRoof=true;tile.rotation.z=-side*.31}}
 box(group,.08,.1,3.2,0,2.52,0,0x87502c).userData.petRoof=true;sign(group,'宠物之家',2.5,.48,0,1.98,1.54);
 for(const x of [-1.78,1.78]){box(group,.09,1.75,.09,x,.98,1.45,0x805132);const pot=new THREE.Mesh(new THREE.CylinderGeometry(.16,.12,.22,12),material(0xa77240));pot.position.set(x,.23,1.65);group.add(pot);for(let i=0;i<5;i++){const flower=new THREE.Mesh(new THREE.SphereGeometry(.065,8,6),material(i%2?0xffd888:0xe8a0a0));flower.position.set(x+Math.sin(i*2)*.12,.4+(i%2)*.05,1.65+Math.cos(i*2)*.12);group.add(flower)}}
 return group;
}
const assets=new Map();
function asset(kind){if(!assets.has(kind))assets.set(kind,new GLTFLoader().loadAsync('../assets/models/cube-pets/animal-'+kind+'.glb'));return assets.get(kind)}
export function createPetAnimal(kind,texture){
 const holder=new THREE.Group();holder.name='Cube pet '+kind;holder.userData.roomAction='pet-home';holder.userData.petId=kind;
 asset(kind).then(data=>{if(holder.userData.retired)return;const customMap=texture?new THREE.TextureLoader().load(texture):null;if(customMap){customMap.colorSpace=THREE.SRGBColorSpace;holder.userData.customMap=customMap}const model=clone(data.scene),bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),centre=bounds.getCenter(new THREE.Vector3()),scale=.85/Math.max(size.x,size.y,size.z);model.scale.setScalar(scale);model.position.set(-centre.x*scale,-bounds.min.y*scale,-centre.z*scale);model.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;if(texture){o.geometry=o.geometry.clone();const positions=o.geometry.attributes.position,uv=new Float32Array(positions.count*2);o.geometry.computeBoundingBox();const b=o.geometry.boundingBox;for(let i=0;i<positions.count;i++){uv[i*2]=(positions.getX(i)-b.min.x)/Math.max(.001,b.max.x-b.min.x);uv[i*2+1]=(positions.getY(i)-b.min.y)/Math.max(.001,b.max.y-b.min.y)}o.geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));o.material=new THREE.MeshStandardMaterial({map:customMap,roughness:.82})}}});holder.add(model);holder.userData.loaded=true;holder.userData.animationNames=data.animations.map(a=>a.name);holder.userData.clips=data.animations;holder.userData.mixer=new THREE.AnimationMixer(model);animatePet(holder,'idle')}).catch(()=>{holder.userData.loadError=true});
 return holder;
}
export function animatePet(holder,name){const data=holder.userData,clip=data.clips?.find(c=>c.name===name);if(!clip||data.animation===name)return;data.mixer.stopAllAction();data.mixer.clipAction(clip).reset().play();data.animation=name}
export function populateCottagePets(room,label){
 const beds=cottagePetFurniture.beds.map(([x,z])=>{const group=new THREE.Group();group.position.set(x,.07,z);const rim=new THREE.Mesh(new THREE.TorusGeometry(.31,.075,8,24),material(0xc69b77));rim.rotation.x=Math.PI/2;rim.position.y=.08;group.add(rim);box(group,.45,.07,.45,0,.035,0,0xf3dec0);room.add(group);return group});
 const [x,z]=cottagePetFurniture.grain,grain=new THREE.Group();grain.position.set(x,0,z);box(grain,.4,.5,.4,0,.32,0,0x95603b);box(grain,.45,.06,.45,0,.6,0,0xd7b878);sign(grain,'宠物粮',.36,.12,0,.36,.205);room.add(grain);label('宠物专属粮仓',x,z,'pet-roster');
 const [tx,tz]=cottagePetFurniture.toy,toy=new THREE.Group();toy.position.set(tx,.07,tz);box(toy,.27,.05,.35,0,.025,0,0x95603b);box(toy,.07,.42,.07,0,.25,0,0xd4bd86);box(toy,.3,.04,.32,0,.46,0,0xc69b77);room.add(toy);label('宠物玩具',tx,tz,'pet-roster');
 const foods=cottagePetFurniture.bowls.map(([bx,bz])=>{const bowl=new THREE.Mesh(new THREE.TorusGeometry(.12,.035,8,20),material(0xe8ded0));bowl.rotation.x=Math.PI/2;bowl.position.set(bx,.1,bz);room.add(bowl);return box(room,.15,.035,.15,bx,.09,bz,0xbb9656)});label('宠物食盆',.8,.7,'pet-roster');label('宠物窝',.2,-.5,'pet-roster');
 room.userData.syncPets=state=>{beds.forEach(b=>b.visible=!!state?.facilities?.bed);toy.visible=!!state?.facilities?.toy;grain.visible=!!state?.pets?.length||state?.food>0;foods.forEach(b=>b.visible=(state?.food||0)>0)};
}
export function populatePetHome(room,label,clickable){
 const wood=0x95603b,cream=0xf3dec0;
 box(room,8,.09,6,0,-.045,0,0xe7c68f);
 for(let x=-3.8;x<4;x+=.8)box(room,.015,.007,6,x,.004,0,0xc7a673);
 const [cx,cz,cw,cd]=petHomeFurniture.counter;box(room,cw*2,.85,cd*2,cx,.425,cz,wood);box(room,cw*2+.12,.08,cd*2+.1,cx,.89,cz,0xc99553);label('领养柜台',cx,cz,'pet-home');
 box(room,7,.12,.65,0,.12,-2.4,wood);for(const x of [-3.5,-1.75,0,1.75,3.5])box(room,.1,2.4,.65,x,1.3,-2.4,wood);
 for(const y of [.5,1.3,2.1]){box(room,7,.09,.65,0,y,-2.4,wood);for(let i=0;i<10;i++){const x=-3.1+i*.69;box(room,.35,.4,.3,x,y+.24,-2.4,[0xcfa453,0x90a86d,0xc68563,0xe5d7ab][i%4]);box(room,.22,.1,.015,x,y+.27,-2.235,cream)}}label('宠物用品架',0,-2.4,'pet-home');
 const bowls=[];for(const [x,z] of [[-2.5,1.7],[-.5,1.7]]){const bowl=new THREE.Mesh(new THREE.TorusGeometry(.2,.055,8,20),material(0xe8ded0));bowl.rotation.x=Math.PI/2;bowl.position.set(x,.08,z);room.add(bowl);const food=box(room,.22,.045,.22,x,.065,z,0xbb9656);bowls.push(food)}label('宠物食盆',-1.5,1.7,'pet-home');
 const animals=[];label('宠物陪伴区',-.75,.5,'pet-home');
 room.userData.petHome={animals,bowls};
 room.userData.syncPets=state=>{const stock=state?.stock||[];for(let i=0;i<2;i++){const pet=stock[i],old=animals[i];if(old?.userData.stockKey===JSON.stringify(pet))continue;if(old){old.userData.retired=true;if(old.userData.customMap){old.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose()}});old.userData.customMap.dispose()}room.remove(old);const at=clickable.indexOf(old);if(at>=0)clickable.splice(at,1)}if(!pet){animals[i]=null;continue}const holder=createPetAnimal(pet.species||pet.id,pet.texture);holder.userData.petId=pet.id;holder.userData.stockKey=JSON.stringify(pet);holder.position.set(...[petHomeFurniture.animals[i][0],0,petHomeFurniture.animals[i][1]]);holder.rotation.y=i?-.5:.5;room.add(holder);clickable.push(holder);animals[i]=holder}};
 room.userData.playPetAction=action=>animals.forEach(a=>{if(!a?.visible)return;animatePet(a,action==='feed'?'eat':'gesture-positive');a.userData.playFor=3});
 room.userData.tickPets=dt=>animals.forEach(a=>{if(!a)return;const data=a.userData;data.mixer?.update(dt);if(data.playFor>0){data.playFor-=dt;if(data.playFor<=0)animatePet(a,'idle')}});
}
