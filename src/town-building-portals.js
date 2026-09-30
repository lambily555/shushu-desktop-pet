import * as THREE from 'three';

// Dimensions are in the town's world units, including the original front-door positions.
export const buildingLayouts={
 'Mariah Carey名人堂':{width:3.1,depth:2.3,z:0,floor:.38,height:1.7,doorX:-.8,doorWidth:.62,doorHeight:1.4,wall:0xeae4d6,trim:0x625b55,glass:true},
 '鼠鼠饭馆':{width:3,depth:2.05,z:-.14,floor:.14,height:1.6,doorX:-.6,doorWidth:.8,doorHeight:1.25,wall:0xeee8d9,trim:0x655746},
 '诊所':{width:2.88,depth:1.85,z:-.175,floor:.2,height:1.45,doorX:0,doorWidth:.64,doorHeight:1.2,wall:0xf1f5f1,trim:0x86b6c5,glass:true},
 '零食铺':{width:2.9,depth:1.88,z:0,floor:.1,height:1.6,doorX:-.95,doorWidth:.64,doorHeight:1.25,wall:0xf3e3b1,trim:0xa8c3a3},
 '纪念馆':{width:2.8,depth:1.85,z:-.27,floor:.23,height:1.3,doorX:0,doorWidth:.7,doorHeight:1.08,wall:0xeee5cc,trim:0xa7b39a},
 '殡仪馆':{width:2.8,depth:1.85,z:-.27,floor:.23,height:1.3,doorX:0,doorWidth:.85,doorHeight:1.05,wall:0xeee5cc,trim:0x929ea3},
 '鼠鼠学校':{width:2.32,depth:2.36,z:-.35,floor:.13,height:1.22,doorX:0,doorWidth:.56,doorHeight:.82,wall:0xb89059,trim:0x68452e,round:true},
 '鼠鼠小屋':{width:2.15,depth:2.14,z:0,floor:.1,height:1.25,doorX:0,doorWidth:.78,doorHeight:.84,wall:0xe1c6a0,trim:0x99603a,cottage:true}
};

function box(parent,w,h,d,x,y,z,mat){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}

// Cut the doorway out of curved shells rather than placing a door on a solid body.
function doorwayHole(mesh,layout,root){let geometry=mesh.geometry.toNonIndexed();const p=geometry.attributes.position,kept=[];mesh.updateWorldMatrix(true,false);root.updateWorldMatrix(true,false);const matrix=root.matrixWorld.clone().invert().multiply(mesh.matrixWorld),v=new THREE.Vector3();
 for(let i=0;i<p.count;i+=3){let inside=0;for(let j=0;j<3;j++){v.fromBufferAttribute(p,i+j).applyMatrix4(matrix);if(layout.cottage){if(v.z>.68&&(v.x/.49)**2+((v.y-.52)/.49)**2<1)inside++}else if(Math.abs(v.x-layout.doorX)<layout.doorWidth/2+.02&&v.y>layout.floor-.03&&v.y<layout.floor+layout.doorHeight+.025&&v.z>layout.z+.15)inside++}if(!inside)kept.push(i,i+1,i+2)}
 geometry.setIndex(kept);mesh.geometry=geometry;const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];mesh.material=mats.map(m=>{const copy=m.clone();copy.side=THREE.DoubleSide;return copy});if(!Array.isArray(mesh.material)||mesh.material.length===1)mesh.material=mesh.material[0];
}

export function installBuildingPortal(model,name){const layout=buildingLayouts[name];if(!layout)return;const front=layout.z+layout.depth/2,back=layout.z-layout.depth/2,top=layout.floor+layout.height;
 model.updateWorldMatrix(true,true);
 const removed=[];model.traverse(mesh=>{if(!mesh.isMesh)return;const centre=new THREE.Vector3().setFromMatrixPosition(mesh.matrixWorld);model.worldToLocal(centre);const p=mesh.geometry.parameters||{};
  if(layout.cottage){if(mesh.name==='Round timber entrance'){return}if(mesh.name==='Individual door plank'||mesh.name==='Door window frame'||mesh.name==='Window mullion'||mesh.name==='Brass door knob'||mesh.name==='Iron hinge'||mesh.name==='Thick oak door frame')return;if(mesh.name==='Rounded grey cottage'||mesh.name==='Cream chest')doorwayHole(mesh,layout,model);return}
  // Retain roof/tower, signs, foundation and outdoor gardens; replace the occupied core and facade.
  const bounds=new THREE.Box3().setFromObject(mesh).applyMatrix4(model.matrixWorld.clone().invert()),actual=bounds.getCenter(new THREE.Vector3());if(Math.abs(actual.x-layout.doorX)<layout.doorWidth/2+.06&&actual.y>layout.floor&&actual.y<layout.floor+layout.doorHeight+.025&&actual.z>front-.07&&actual.z<front+.25)removed.push(mesh);else if(name==='Mariah Carey名人堂'&&p.height===.22&&p.width===3.1)removed.push(mesh);else if(name==='诊所'&&mesh.geometry.type==='ExtrudeGeometry'&&p.options?.depth>.2)removed.push(mesh);else if(centre.y>layout.floor+.04&&centre.y<top-.04&&Math.abs(centre.x)<layout.width/2+.12&&centre.z>back-.1&&centre.z<front+.09)removed.push(mesh);
  else if(name==='Mariah Carey名人堂'&&p.height>1&&centre.y<top&&centre.z>=front)removed.push(mesh);
 });removed.forEach(mesh=>mesh.parent.remove(mesh));
 if(layout.cottage){const old=model.getObjectByName('Round timber entrance');if(old)old.parent.remove(old);}
 const shell=new THREE.Group();shell.name='Shared exterior and interior shell';model.add(shell);const wall=new THREE.MeshStandardMaterial({color:layout.wall,roughness:.88}),trim=new THREE.MeshStandardMaterial({color:layout.trim,roughness:.62}),glass=new THREE.MeshPhysicalMaterial({color:0xdceaf0,roughness:.12,metalness:0,transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide,clearcoat:1,envMapIntensity:.7});
 const roof=box(shell,layout.width,.07,layout.depth,0,top,layout.z,wall);roof.userData.cutawayRoof=true;if(layout.cottage)shell.visible=false;
 if(layout.cottage){
  // Keep the hamster silhouette intact; only the original circular doorway opens.
  box(shell,layout.width,layout.height,.065,0,layout.floor+layout.height/2,back,wall);
  for(const side of [-1,1])box(shell,.065,layout.height,layout.depth,side*layout.width/2,layout.floor+layout.height/2,layout.z,wall);
  const frame=new THREE.Mesh(new THREE.TorusGeometry(.43,.045,10,48),trim);frame.position.set(0,.52,front+.022);shell.add(frame);
 }else{
  if(layout.round){const body=new THREE.Mesh(new THREE.CylinderGeometry(1.16,1.16,layout.height,192,48,true),wall.clone());body.position.set(0,layout.floor+layout.height/2,layout.z);shell.add(body);doorwayHole(body,layout,model)}
  else{
   box(shell,layout.width,layout.height,.065,0,layout.floor+layout.height/2,back,wall);
   for(const side of [-1,1]){const mat=layout.glass?glass:wall;box(shell,.065,layout.height,layout.depth,side*layout.width/2,layout.floor+layout.height/2,layout.z,mat);if(layout.glass)for(const z of [back,layout.z,front])box(shell,.035,layout.height,.035,side*layout.width/2,layout.floor+layout.height/2,z,trim)}
   const left=-layout.width/2,right=layout.width/2,a=layout.doorX-layout.doorWidth/2,b=layout.doorX+layout.doorWidth/2;
   for(const [lo,hi] of [[left,a],[b,right]]){const width=hi-lo,x=(lo+hi)/2;if(layout.glass){box(shell,width,layout.height,.025,x,layout.floor+layout.height/2,front,glass);for(const xx of [lo,hi])box(shell,.025,layout.height,.06,xx,layout.floor+layout.height/2,front,trim);box(shell,width,.025,.055,x,layout.floor+.025,front,trim);box(shell,width,.025,.055,x,top-.025,front,trim)}else{
     const sill=layout.floor+.4,paneHeight=.65;box(shell,width,.4,.065,x,layout.floor+.2,front,wall);box(shell,width,top-sill-paneHeight,.065,x,(top+sill+paneHeight)/2,front,wall);box(shell,width,paneHeight,.025,x,sill+paneHeight/2,front,glass);for(const xx of [lo,hi,x])box(shell,.03,paneHeight,.065,xx,sill+paneHeight/2,front,trim);box(shell,width,.035,.065,x,sill,front,trim);box(shell,width,.035,.065,x,sill+paneHeight,front,trim);
   }}
   box(shell,layout.doorWidth,layout.height-layout.doorHeight,.065,layout.doorX,layout.floor+(layout.height+layout.doorHeight)/2,front,wall);
  }
 }
 const pivot=new THREE.Group();pivot.position.set(layout.doorX-layout.doorWidth/2,layout.floor,front+.015);model.add(pivot);const w=layout.doorWidth,h=layout.doorHeight;
 if(layout.cottage){const door=new THREE.Mesh(new THREE.CircleGeometry(w/2,48),trim);door.material=trim.clone();door.material.side=THREE.DoubleSide;door.position.set(w/2,h/2,0);door.scale.y=h/w;pivot.add(door)}else{box(pivot,w,h*.42,.045,w/2,h*.21,0,trim);box(pivot,w,h*.09,.045,w/2,h*.955,0,trim);for(const x of [.025,w-.025])box(pivot,.05,h*.53,.045,x,h*.685,0,trim);box(pivot,w-.1,h*.49,.018,w/2,h*.685,0,glass);box(pivot,.025,h*.49,.03,w/2,h*.685,0,trim)}
 const handle=new THREE.Mesh(new THREE.SphereGeometry(.025,16,10),new THREE.MeshStandardMaterial({color:0xd2b479,metalness:.75,roughness:.27}));handle.position.set(w-.085,h*.44,.05);pivot.add(handle);pivot.traverse(mesh=>{if(mesh.isMesh)mesh.userData.buildingDoor=name});
 const ceilingLight=new THREE.PointLight(0xffe2b0,1.1,4,2);ceilingLight.position.set(0,top-.15,layout.z);model.add(ceilingLight);box(shell,layout.width*.4,.018,.18,0,top-.045,layout.z,new THREE.MeshStandardMaterial({color:0xffeac7,emissive:0xffdfad,emissiveIntensity:.5}));
 const portal={name,layout,model,door:pivot,target:0,angle:0,front,roof,shell,light:ceilingLight,exteriorChildren:model.children.filter(child=>child!==shell&&child!==pivot&&child!==ceilingLight)};model.userData.portal=portal;return portal;
}

export function placeRoom(room,portal){const {layout,model}=portal;room.position.copy(model.position);room.rotation.y=model.rotation.y;const scale=layout.width/8;room.scale.set(scale,scale,layout.depth/6);const offset=new THREE.Vector3(0,layout.floor,layout.z).applyAxisAngle(new THREE.Vector3(0,1,0),model.rotation.y);room.position.add(offset);room.updateMatrixWorld(true)}
export function localDoor(portal){return {x:portal.layout.doorX*8/portal.layout.width,z:3,width:portal.layout.doorWidth*8/portal.layout.width}}
