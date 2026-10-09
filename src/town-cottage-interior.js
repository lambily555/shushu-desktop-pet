import * as THREE from 'three';

// World-space profile shared by the cottage's outer belly and inner room.
// The face and upper half retain their original dimensions; the base is gently rounded out.
export function cottageRadius(y){
 if(y<.08)return .87;
 if(y<.5)return .9+(y-.08)/.42*.055;
 if(y<1.04)return .955+(y-.5)/.54*.045;
 return Math.sqrt(Math.max(0,1-((y-1.04)/1.104)**2));
}
export const cottageExpansion=Math.sqrt(1.5);
export const cottageFloor={x:1.01,z:.77};
export const cottageFurniture={bed:[-1.85,-.55],shelf:[-.2,-1.7],table:[-1.8,1],windowTable:[-2,.85],water:[2.65,.05],bowl:[2.05,1.05]};
export function cottageShellGeometry(inset=0){
 const points=[new THREE.Vector2(0,.04)];
 for(let i=0;i<=96;i++){const y=.08+i*(2.144-.08)/96;points.push(new THREE.Vector2(Math.max(0,cottageRadius(y)-inset),y))}
 const geometry=new THREE.LatheGeometry(points,192);geometry.scale(1.184,1,.912);return geometry;
}
export function cottageFrontZ(x,y,inset=.045){const r=cottageRadius(y)-inset;return .912*Math.sqrt(Math.max(0,r*r-(x/1.184)**2))}
// The ring follows the curved wall, and its inner edge joins the door's short tunnel.
export function cottageDoorLining(front,outside=false){
 const positions=[],indices=[],rows=outside?8:2;
 const outerZ=(x,y)=>{let z=cottageFrontZ(x,y,0);for(const [cx,cy,cz,rx,ry,rz] of [[0,.656,.576,.864,.712,.44],[-.408,1.112,.76,.44,.328,.272],[.408,1.112,.76,.44,.328,.272]]){const r=1-((x-cx)/rx)**2-((y-cy)/ry)**2;if(r>0)z=Math.max(z,cz+rz*Math.sqrt(r))}return z+.012};
 for(let row=0;row<=rows;row++)for(let i=0;i<=96;i++){
  const a=i*Math.PI*2/96,t=row/rows,r=outside?.60+(.39-.60)*t:row===0?.61:.39,x=Math.cos(a)*r,y=Math.max(.1,.52+Math.sin(a)*r*.84/.78);
  const z=outside?outerZ(x,y)*(1-t)+front*t:row===2?front:cottageFrontZ(x,y)-.006;
  positions.push(x,y,z);
 }
 for(let row=0;row<rows;row++)for(let i=0;i<96;i++){const a=row*97+i,b=a+97;indices.push(a,b,a+1,b,b+1,a+1)}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
