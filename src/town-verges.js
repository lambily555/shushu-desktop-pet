import * as THREE from 'three';
import {destinations,entrance} from './town-life.js';
import {lampLayout,lampPositionClear} from './town-lights.js';

export function vergeLayout(){
 const segments=[[{x:-14,z:-1.3},{x:14,z:-1.3}],[{x:0,z:-12.5},{x:0,z:12.7}]];
 for(const d of destinations){if(d[0]==='中心广场')continue;const e=entrance(d[0]),near=Math.abs(e.x)<Math.abs(e.z+1.3)?{x:0,z:e.z}:{x:e.x,z:-1.3};segments.push([near,e])}
 let seed=927;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296},lamps=lampLayout(),items=[];
 const centers=[],parts=[['grass',-.2,0],['grass',.05,.12],['flower',-.05,-.12],['flower',.14,-.04],['stone',.26,.16],['twig',-.23,.22]];
 for(let attempt=0;attempt<200&&centers.length<7;attempt++){
  const [a,b]=segments[Math.floor(random()*segments.length)],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);if(length<.5)continue;
  const t=random(),side=random()<.5?-1:1,offset=1.15+random()*.45,x=a.x+dx*t-dz/length*offset*side,z=a.z+dz*t+dx/length*offset*side,yaw=random()*Math.PI*2;
  if(centers.some(p=>Math.hypot(x-p.x,z-p.z)<4))continue;
  const cluster=parts.map(([kind,ox,oz])=>({x:x+ox*Math.cos(yaw)-oz*Math.sin(yaw),z:z+ox*Math.sin(yaw)+oz*Math.cos(yaw),kind,yaw:random()*Math.PI*2,scale:1+random()*.3}));
  if(cluster.some(p=>!lampPositionClear(p.x,p.z)||lamps.some(l=>Math.hypot(p.x-l.x,p.z-l.z)<.55)))continue;
  centers.push({x,z});items.push(...cluster);
 }
 return items;
}

export function createTownVerges(){
 const group=new THREE.Group(),batches=new Map(),matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion();
 const add=(key,geometry,color,x,y,z,sx,sy,sz,yaw=0)=>{if(!batches.has(key))batches.set(key,{geometry,color,matrices:[]});rotation.setFromAxisAngle(new THREE.Vector3(0,1,0),yaw);matrix.compose(new THREE.Vector3(x,y,z),rotation,new THREE.Vector3(sx,sy,sz));batches.get(key).matrices.push(matrix.clone())};
 const blade=new THREE.ConeGeometry(1,1,4),sphere=new THREE.SphereGeometry(1,7,5),branch=new THREE.CylinderGeometry(1,1,1,5);branch.rotateZ(Math.PI/2);const stem=new THREE.CylinderGeometry(1,1,1,5);
 for(const p of vergeLayout()){const s=p.scale;
  if(p.kind==='grass'||p.kind==='flower')for(let i=0;i<5;i++){const a=p.yaw+i*2.4;add('grass',blade,0x78935d,p.x+Math.cos(a)*.075*s,.1*s,p.z+Math.sin(a)*.075*s,.028*s,(.14+i*.02)*s,.022*s,a)}
  if(p.kind==='flower'){add('stem',stem,0x668447,p.x,.16*s,p.z,.009*s,.25*s,.009*s);
   const color=Math.sin(p.yaw)>0?0xf3dcc1:0xd6afc5;for(let i=0;i<5;i++){const a=i*Math.PI*2/5;add('petal'+color,sphere,color,p.x+Math.cos(a)*.045*s,.29*s,p.z+Math.sin(a)*.045*s,.04*s,.015*s,.032*s,a)}add('pollen',sphere,0xe4b954,p.x,.305*s,p.z,.022*s,.015*s,.022*s)
  }
  if(p.kind==='stone')add('stone',sphere,0xa5a18e,p.x,.035*s,p.z,.11*s,.055*s,.075*s,p.yaw);
  if(p.kind==='twig'){add('twig',branch,0x866b50,p.x,.033,p.z,.28*s,.017*s,.017*s,p.yaw);add('twig',branch,0x866b50,p.x+.035,.037,p.z,.14*s,.012*s,.012*s,p.yaw+.7)}
 }
 for(const {geometry,color,matrices} of batches.values()){const mesh=new THREE.InstancedMesh(geometry,new THREE.MeshStandardMaterial({color,roughness:1}),matrices.length);matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.receiveShadow=true;group.add(mesh)}
 group.name='路边花草';return group;
}
