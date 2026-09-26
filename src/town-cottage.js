import * as THREE from 'three';

// Procedural cottage shared with the approved preview. Front faces +Z.
export function createCottage({density=1}={}){
 const house=new THREE.Group();house.name='MossHamsterCottage';
 let seed=824;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
 const material=(color,roughness=.85)=>new THREE.MeshStandardMaterial({color,roughness});
 const fur=material('#898078'),cream=material('#eee3c9'),pink=material('#bb8772'),wood=material('#99603a'),darkwood=material('#60402a'),moss=material('#6b7d32'),eyeMat=new THREE.MeshPhysicalMaterial({color:'#100e0c',roughness:.13,clearcoat:1});
 const glow=new THREE.MeshStandardMaterial({color:'#ffc66a',emissive:'#ffb342',emissiveIntensity:1.3,roughness:.5});

 function strandTexture(base,creamCoat=false){const c=document.createElement('canvas');c.width=1024;c.height=1024;const g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,1024,1024);for(let i=0;i<58000;i++){const x=random()*1024,y=random()*1024,len=6+random()*24,v=creamCoat?200+Math.floor(random()*39):135+Math.floor(random()*46);g.strokeStyle='rgba('+v+','+(v-3)+','+(v-8)+',.32)';g.lineWidth=.45+random()*.65;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+2,y+len*.5,x+3+random()*3,y+len);g.stroke()}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t}
 fur.color.set('#ffffff');fur.map=strandTexture('#a7a29b');cream.color.set('#ffffff');cream.map=strandTexture('#ebe6d8',true);fur.bumpMap=fur.map;fur.bumpScale=.004;cream.bumpMap=cream.map;cream.bumpScale=.003;
 const woodCanvas=document.createElement('canvas');woodCanvas.width=512;woodCanvas.height=1024;const wc=woodCanvas.getContext('2d');wc.fillStyle='#b58456';wc.fillRect(0,0,512,1024);for(let i=0;i<900;i++){const x=random()*512;wc.strokeStyle='rgba(69,40,18,'+(.04+random()*.13)+')';wc.lineWidth=.3+random()*1.2;wc.beginPath();wc.moveTo(x,0);for(let y=0;y<=1024;y+=16)wc.lineTo(x+Math.sin(y/100+i)*3+Math.sin(y/41)*1.3,y);wc.stroke()}const woodTexture=new THREE.CanvasTexture(woodCanvas);woodTexture.colorSpace=THREE.SRGBColorSpace;wood.map=woodTexture;wood.color.set('#d8b38b');wood.bumpMap=woodTexture;wood.bumpScale=.01;
 const sphere=new THREE.SphereGeometry(1,64,40);
 function oval(name,mat,x,y,z,sx,sy,sz,parent=house){const mesh=new THREE.Mesh(sphere,mat);mesh.name=name;mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
 function box(name,mat,x,y,z,w,h,d,parent=house){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.name=name;mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
 function line(name,points,radius,mat,parent=house){const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const mesh=new THREE.Mesh(new THREE.TubeGeometry(path,24,radius,6,false),mat);mesh.name=name;mesh.castShadow=true;parent.add(mesh);return mesh}
 function ring(name,mat,x,y,z,r,tube,parent=house){const mesh=new THREE.Mesh(new THREE.TorusGeometry(r,tube,10,56),mat);mesh.name=name;mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh}
 oval('Rounded grey cottage',fur,0,1.3,0,1.48,1.38,1.14);
 oval('Cream chest',cream,0,.82,.72,1.08,.89,.55);
 oval('Left cheek',cream,-.51,1.39,.95,.55,.41,.34);oval('Right cheek',cream,.51,1.39,.95,.55,.41,.34);
 for(const side of [-1,1]){
  const ear=oval('Rounded ear',fur,side*.9,2.38,.42,.4,.51,.19);ear.rotation.z=-side*.25;
  const inner=oval('Soft inner ear',pink,side*.9,2.4,.58,.285,.36,.075);inner.rotation.z=-side*.25;
  oval('Glossy eye',eyeMat,side*.53,1.86,1.01,.17,.205,.12);
  oval('Eye catchlight',material('#fff5dc',.2),side*.53-.04,1.93,1.117,.041,.047,.018);
  for(let i=0;i<3;i++)oval('Tiny paw',pink,side*.68+(i-1)*.064,.115,1.04,.057,.058,.12);
  for(let i=0;i<3;i++)line('Whisker',[[side*.29,1.44+i*.07,1.255],[side*.88,1.51+i*.12,1.36],[side*1.35,1.5+i*.15,1.32]],.004,material('#c5bca7'));
 }
 oval('Joined muzzle',cream,0,1.42,1.15,.35,.23,.22);
 oval('Little nose',material('#d49d88',.62),0,1.55,1.335,.115,.073,.059);

 const lip=material('#968072'),muzzleZ=(x,y)=>1.15+.22*Math.sqrt(Math.max(0,1-(x/.35)**2-((y-1.42)/.23)**2))+.003;
 const mouthPoints=[[0,1.485],[0,1.40],[-.07,1.375]].map(([x,y])=>[x,y,muzzleZ(x,y)]);
 line('Inset lip crease',mouthPoints,.005,lip);line('Inset lip crease',[[0,1.40],[.07,1.375]].map(([x,y])=>[x,y,muzzleZ(x,y)]),.005,lip);
 // Curved, tapered strands lie along the surface; no radial cones or dark dots.
 const hairPositions=[],hairNormals=[],hairColors=[],hairIndices=[];
 function coat(center,radii,count,light,mask=()=>true){for(let i=0;i<Math.ceil(count*density);i++){
  const az=random()*Math.PI*2,ny=random()*2-1,n=new THREE.Vector3(Math.sqrt(1-ny*ny)*Math.cos(az),ny,Math.sqrt(1-ny*ny)*Math.sin(az));
  const start=new THREE.Vector3(n.x*radii[0]+center[0],n.y*radii[1]+center[1],n.z*radii[2]+center[2]);if(!mask(start))continue;
  let tangent=new THREE.Vector3(n.x*.2,-1,n.z*.08);tangent.addScaledVector(n,-tangent.dot(n)).normalize();if(tangent.length()<.01)tangent.set(1,0,0);
  const side=new THREE.Vector3().crossVectors(n,tangent).normalize(),length=.035+random()*.04,width=.00065+random()*.0008,base=hairPositions.length/3;
  const color=new THREE.Color(light?'#eae3d3':'#b8b2a9').multiplyScalar(.94+random()*.1);
  for(let k=0;k<=4;k++){const t=k/4,dir=n.clone().addScaledVector(tangent,t*length/Math.min(...radii)).normalize(),normal=new THREE.Vector3(dir.x/radii[0],dir.y/radii[1],dir.z/radii[2]).normalize();const point=new THREE.Vector3(center[0]+dir.x*radii[0],center[1]+dir.y*radii[1],center[2]+dir.z*radii[2]).addScaledVector(normal,.003+Math.sin(t*Math.PI)*.012+t*.005);
   for(const sign of [-1,1]){const q=point.clone().addScaledVector(side,sign*width*(1-.92*t));hairPositions.push(q.x,q.y,q.z);hairNormals.push(normal.x,normal.y,normal.z);hairColors.push(color.r,color.g,color.b)}
   if(k<4){const j=base+k*2;hairIndices.push(j,j+2,j+1,j+1,j+2,j+3)}
  }
 }}
 coat([0,1.3,0],[1.48,1.38,1.14],42000,false,p=>p.y>.17&&p.y<2.4&&!(p.z>.73&&p.y<1.7));
 coat([0,.82,.72],[1.08,.89,.55],14000,true,p=>p.z>.76);
 for(const side of [-1,1])coat([side*.51,1.39,.95],[.55,.41,.34],10000,true,p=>p.z>1.03);
 coat([0,1.42,1.15],[.35,.23,.22],3000,true,p=>p.z>1.28&&p.y<1.54);
 const hairGeometry=new THREE.BufferGeometry();hairGeometry.setAttribute('position',new THREE.Float32BufferAttribute(hairPositions,3));hairGeometry.setAttribute('normal',new THREE.Float32BufferAttribute(hairNormals,3));hairGeometry.setAttribute('color',new THREE.Float32BufferAttribute(hairColors,3));hairGeometry.setIndex(hairIndices);const hair=new THREE.Mesh(hairGeometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}));hair.name='Surface following tapered fur';house.add(hair);
 const dummy=new THREE.Object3D();
 const door=new THREE.Group();door.name='Round timber entrance';door.position.set(0,.65,1.34);house.add(door);
 const backing=new THREE.Mesh(new THREE.CircleGeometry(.53,64),darkwood);door.add(backing);
 for(let i=-4;i<=4;i++){const x=i*.112,h=2*Math.sqrt(Math.max(0,.49*.49-x*x));if(h>0)box('Individual door plank',wood,x,0,.022,.105,h,.065,door)}
 ring('Thick oak door frame',wood,0,0,.035,.54,.073,door);
 ring('Door window frame',wood,0,.19,.1,.17,.036,door);
 const glass=new THREE.Mesh(new THREE.CircleGeometry(.147,32),glow);glass.position.set(0,.19,.094);door.add(glass);box('Window mullion',wood,0,.19,.113,.019,.29,.025,door);
 oval('Brass door knob',material('#9d783d',.32),.32,-.12,.11,.044,.044,.04,door);
 for(const yy of [-.2,.16])box('Iron hinge',darkwood,-.36,yy,.085,.15,.025,.025,door);
 // Right-side warm round window.
 const windowGroup=new THREE.Group();windowGroup.position.set(1.49,1.26,.05);windowGroup.rotation.y=Math.PI/2;house.add(windowGroup);
 ring('Round side window',wood,0,0,0,.35,.064,windowGroup);const windowPane=new THREE.Mesh(new THREE.CircleGeometry(.3,48),glow);windowGroup.add(windowPane);box('Cross frame',darkwood,0,0,.025,.035,.6,.04,windowGroup);box('Cross frame',darkwood,0,0,.025,.6,.035,.04,windowGroup);
 const roof=new THREE.Group();roof.name='Removable moss roof';house.add(roof);
 oval('Curved timber roof',darkwood,0,2.38,-.18,1.43,.23,1.02,roof);
 oval('Moss roof cushion',moss,0,2.43,-.18,1.45,.43,1.04,roof);
 const mossGeometry=new THREE.BufferGeometry(),leafPositions=[];for(let i=0;i<6;i++){const a=i*Math.PI/3,x=Math.cos(a),z=Math.sin(a);leafPositions.push(-z*.12,0,x*.12,z*.12,0,-x*.12,x*.6,.8+(i%2)*.3,z*.6)}mossGeometry.setAttribute('position',new THREE.Float32BufferAttribute(leafPositions,3));mossGeometry.computeVertexNormals();const mossLeafMaterial=material('#859c41');mossLeafMaterial.side=THREE.DoubleSide;const tufts=new THREE.InstancedMesh(mossGeometry,mossLeafMaterial,Math.ceil(14500*density));
 for(let i=0;i<Math.ceil(14500*density);i++){const a=random()*Math.PI*2,r=Math.sqrt(random()),x=Math.cos(a)*r*1.43,z=-.18+Math.sin(a)*r*1.01,y=2.43+.42*Math.sqrt(1-r*r);dummy.position.set(x,y,z);dummy.rotation.set(random()*.25,random()*Math.PI*2,random()*.25);dummy.scale.set(.025+random()*.035,.045+random()*.06,.025+random()*.035);dummy.updateMatrix();tufts.setMatrixAt(i,dummy.matrix);tufts.setColorAt(i,new THREE.Color().setHSL(.19+random()*.045,.45,.23+random()*.13))}tufts.castShadow=false;roof.add(tufts);
 function mushroom(x,y,z,size){const stem=oval('Mushroom stem',cream,x,y+size*.32,z,size*.12,size*.34,size*.12,roof);const cap=oval('Orange mushroom cap',material('#c3652d'),x,y+size*.64,z,size*.39,size*.255,size*.35,roof);for(let i=0;i<7;i++){const a=random()*Math.PI*2,r=random()*.26;oval('Cream mushroom spot',cream,x+Math.cos(a)*r*size,y+size*(.64+.255*Math.sqrt(1-r*r/(.39*.39))),z+Math.sin(a)*r*size,size*.045,size*.018,size*.038,roof)}}
 mushroom(.45,2.73,-.48,.95);mushroom(1,2.59,-.19,.62);mushroom(-.7,2.67,-.4,.3);
 const earth=oval('Moss garden island',material('#6d6545'),0,.03,.14,1.87,.11,1.57);
 for(let i=0;i<160;i++){const a=random()*Math.PI*2,r=1.42+random()*.32;oval('Garden moss',material(i%2?'#687b35':'#7b873e'),Math.cos(a)*r,.11,Math.sin(a)*r*.85,.09+random()*.1,.05+random()*.09,.1)}
 for(let i=0;i<3;i++){const stone=oval('Doorstep stone',material('#b4a087'),(i%2)*.13,.11-i*.018,1.33+i*.24,.36-i*.04,.07,.17);stone.rotation.y=i*.21}
 for(const side of [-1,1]){oval('Acorn',material('#ae723a'),side*1.35,.2,.98,.19,.22,.14);oval('Acorn cap',darkwood,side*1.35,.36,.98,.21,.095,.16);line('Twig',[[side*1.5,.13,.25],[side*1.61,.57,.2],[side*1.67,.82,.19]],.022,wood);line('Twig branch',[[side*1.6,.47,.2],[side*1.85,.64,.2]],.013,wood)}
 for(let i=0;i<12;i++){const a=random()*6.28,x=Math.cos(a)*1.72,z=Math.sin(a)*1.33;for(let j=0;j<5;j++)oval('Daisy petal',cream,x+Math.cos(j*6.28/5)*.045,.14,z+Math.sin(j*6.28/5)*.045,.04,.018,.028);oval('Daisy heart',material('#d7a44a'),x,.16,z,.025,.016,.025)}
 return house;
}
