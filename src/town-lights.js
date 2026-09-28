import {destinations,facing,entrance} from './town-life.js';
const segmentDistance=(x,z,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a.x-t*dx,z-a.z-t*dz)};
export function lampPositionClear(x,z){
 if(Math.hypot(x,z)>16.2)return false;
 if(segmentDistance(x,z,{x:-14,z:-1.3},{x:14,z:-1.3})<.68||segmentDistance(x,z,{x:0,z:-12.5},{x:0,z:12.7})<.68)return false;
 for(const d of destinations){const name=d[0],a=facing(name),dx=x-d[1],dz=z-d[2],lx=dx*Math.cos(a)-dz*Math.sin(a),lz=dx*Math.sin(a)+dz*Math.cos(a);const w=name==='鼠鼠学校'?2.5:name==='中心广场'?4.65:name==='墓地'?2.3:1.9,h=name==='鼠鼠学校'?2.1:name==='中心广场'?2.8:name==='墓地'?1.8:1.45;if(name==='跑轮公园'?Math.hypot(dx,dz)<2.45:Math.abs(lx)<w&&Math.abs(lz)<h)return false;if(name!=='中心广场'){const e=entrance(name),near=Math.abs(e.x)<Math.abs(e.z+1.3)?{x:0,z:e.z}:{x:e.x,z:-1.3};if(segmentDistance(x,z,e,near)<.6)return false}}
 return true;
}
export function lampLayout(){
 const lamps=[];
 for(const d of destinations){const name=d[0],a=facing(name),side=name==='跑轮公园'?2.8:name==='鼠鼠学校'?2.8:name==='中心广场'?5.1:name==='墓地'?2.6:2.2;for(const direction of [-1,1]){for(let back=.6;back<3;back+=.4){const x=d[1]-Math.sin(a)*back+Math.cos(a)*side*direction,z=d[2]-Math.cos(a)*back-Math.sin(a)*side*direction;if(lampPositionClear(x,z)){lamps.push({x,z,yaw:Math.atan2(z-d[2],d[1]-x),place:name});break}}}}
 // Stable scattered locations avoid rearranging lights every time the town opens.
 let seed=731;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};let added=0;
 for(let i=0;i<300&&added<6;i++){const x=(random()-.5)*29,z=(random()-.5)*29;if(!lampPositionClear(x,z)||lamps.some(l=>Math.hypot(x-l.x,z-l.z)<4))continue;lamps.push({x,z,yaw:random()*Math.PI*2,place:null});added++}
 return lamps;
}
