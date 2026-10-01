import {blocked,facing} from './town-life.js';
const obstacles={
 'Mariah Carey名人堂':[[-2.1,-.5,.9,.4],[1.1,-.5,.9,.4],[2.7,1.2,.7,.45],[3,-1.4,.35,.2],[0,-1.7,.65,.65],[.3,1.6,.8,.35]],
 '鼠鼠小屋':[[-2.2,-1.6,.98,.65],[-2.3,1.1,.55,.43],[.2,-2.4,.82,.32],[1.7,-1.2,.23,.23],[1.8,1.2,.4,.4]],
 '诊所':[[-1.9,-.8,.98,.65],[1.6,-2.4,.82,.32],[1.9,1.2,.75,.45]],
 '鼠鼠饭馆':[[0,-2.3,3.3,.45],[3.35,1.4,.35,.75],[-2,-.5,.65,.4],[1.4,-.5,.65,.4],[1.4,1.55,.65,.4]],
 '零食铺':[[-2.2,-2.4,.82,.32],[.5,-2.4,.82,.32],[.5,1.3,1.55,.48]],
 '纪念馆':[[-2.2,-1.4,.75,.45],[0,-1.4,.75,.45],[2.2,-1.4,.75,.45],[0,1.5,1.05,.4]],
 '鼠鼠学校':[[-2,-1.7,.82,.32],[-1,-.6,.65,.4],[1.4,-.6,.65,.4],[-1,1.1,.65,.4],[1.4,1.1,.65,.4]],
 '殡仪馆':[[0,-1,1.3,.65],[-2.6,-2.4,.82,.32],[0,1.4,1.05,.4]]
};
export function canWalk(actor,x,z){if(actor.inside){const gate=actor.doorway,throughDoor=gate?.open&&Math.abs(x-gate.x)<gate.width/2-.13&&z>2.4&&z<4.5;if(throughDoor)return true;if(Math.abs(x)>3.7||z< -2.7||z>2.8)return false;if(actor.inside==='鼠鼠学校'&&(x/3.9)**2+(z/2.9)**2>.92)return false;return !(obstacles[actor.inside]||[]).some(([cx,cz,w,d])=>Math.abs(x-cx)<w+.1&&Math.abs(z-cz)<d+.1)}if(Math.hypot(x,z)>17.4)return false;let ignore=null;const portal=actor.entryPortal;if(portal?.angle>1){const a=facing(portal.name),dx=x-portal.model.position.x,dz=z-portal.model.position.z,lx=dx*Math.cos(a)-dz*Math.sin(a),lz=dx*Math.sin(a)+dz*Math.cos(a),layout=portal.layout;if(Math.abs(lx-layout.doorX)<layout.doorWidth/2-.055&&lz>portal.front-.3&&lz<portal.front+1.2)ignore=portal.name}return ![[0,0],[.08,0],[-.08,0],[0,.08],[0,-.08]].some(([dx,dz])=>blocked(x+dx,z+dz,ignore))}
export function movePlayer(actor,dx,dz){const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.08));let moved=false;for(let i=0;i<steps;i++){if(canWalk(actor,actor.position.x+dx/steps,actor.position.z)){actor.position.x+=dx/steps;moved=moved||!!dx}if(canWalk(actor,actor.position.x,actor.position.z+dz/steps)){actor.position.z+=dz/steps;moved=moved||!!dz}}actor.moving=moved;return moved}
