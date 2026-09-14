import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const places = [
  ['跑轮公园', -6, -5, 0x91b7a4, '夜里最热闹的运动场'],
  ['诊所', 0, -5, 0xb7c9d9, '医生鼠鼠守护大家的健康'],
  ['零食铺', 6, -5, 0xe4bd8f, '购买粮食和偶尔的小零食'],
  ['中心广场', 0, -1.3, 0xc9b6d8, '鼠鼠们碰面和交换消息的地方'],
  ['纪念馆', -6, 2.3, 0xa9a2b7, '收藏逝去鼠鼠的纪念物'],
  ['鼠鼠小屋', 0, 2.3, 0xd39b78, '休息、粮仓和家具都在这里'],
  ['小菜园', 6, 2.3, 0x88b779, '种下鼠鼠喜欢的新鲜食物'],
  ['殡仪馆', -2.1, 5.9, 0x8f91a4, '温柔送别小镇里的鼠鼠'],
  ['墓地', 2.8, 5.9, 0x778b83, '安静纪念每一段小小生命']
];

function roundedBuilding(name, x, z, color) {
  const group = new THREE.Group(); group.position.set(x, 0, z); group.userData.place = name;
  const body = new THREE.Mesh(new THREE.BoxGeometry(name === '中心广场' ? 2.3 : 2.5, .85, 1.65), new THREE.MeshStandardMaterial({color, roughness:.82}));
  body.position.y=.55; body.castShadow=true; body.receiveShadow=true; group.add(body);
  if(name === '中心广场') {
    body.geometry.dispose(); body.geometry = new THREE.CylinderGeometry(1.35,1.55,.3,32); body.position.y=.2;
    const fountain = new THREE.Mesh(new THREE.CylinderGeometry(.45,.62,.45,24),new THREE.MeshStandardMaterial({color:0xe9eef0,roughness:.65})); fountain.position.y=.55; group.add(fountain);
  } else {
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.75,.8,4),new THREE.MeshStandardMaterial({color:new THREE.Color(color).multiplyScalar(.76),roughness:.9})); roof.rotation.y=Math.PI/4;roof.position.y=1.35;roof.castShadow=true;group.add(roof);
    const door = new THREE.Mesh(new THREE.BoxGeometry(.48,.62,.05),new THREE.MeshStandardMaterial({color:0x74594c}));door.position.set(0,.38,-.85);group.add(door);
  }
  const box=(w,h,d,px,py,pz,tone)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:tone,roughness:.85}));mesh.position.set(px,py,pz);mesh.castShadow=true;group.add(mesh);return mesh};
  if(!['中心广场','跑轮公园','小菜园','墓地'].includes(name)){
    box(2.8,.15,2,0,.06,0,0xc4b49d);
    [-.78,.78].forEach(x=>{box(.55,.48,.08,x,.66,.86,0xece2ba);box(.04,.49,.1,x,.66,.91,0x795c43);box(.56,.04,.1,x,.66,.91,0x795c43)});
    box(.52,.72,.09,0,.4,.88,0x765840);box(.8,.12,.42,0,.08,1.04,0xb2a18a);
    for(let y=.23;y<.98;y+=.18)box(2.52,.025,1.67,0,y,0,0xa4937c);
  }
  if(name==='诊所'){box(.18,.65,.12,0,1.25,1,0x528c79);box(.6,.18,.12,0,1.25,1,0x528c79)}
  if(name==='零食铺'){for(let i=0;i<8;i++)box(.34,.1,.85,-1.2+i*.34,1.02,1.08,i%2?0xf4e6c9:0xb97753);box(2.3,.35,.55,0,.25,1.25,0x906c4a);for(let i=0;i<5;i++)box(.3,.15,.32,-.85+i*.42,.5,1.25,0xd8b355)}
  if(name==='鼠鼠小屋'){box(.32,.9,.35,.75,1.5,-.25,0x9a6a50);box(1,.12,.5,-1.5,.12,.3,0xba9167)}
  if(name==='纪念馆'){[-1,-.5,.5,1].forEach(x=>box(.14,1.1,.18,x,.6,1,0xe2d9c7));box(2.8,.18,.45,0,1.15,1,0xc8bca7)}
  if(name==='殡仪馆'){box(2.7,.14,.7,0,1.03,1,0x6c7773);[-1,1].forEach(x=>box(.12,.9,.12,x,.5,1.25,0xaaa99c))}
  if(['跑轮公园','小菜园','墓地'].includes(name)){
    while(group.children.length){group.remove(group.children[0])}
    box(3,.12,2.2,0,.02,0,name==='小菜园'?0x6c543c:0xaab692);
    for(let x=-1.5;x<=1.5;x+=.3)box(.06,.5,.06,x,.25,-1.12,0xe0d1af);
    box(3,.07,.07,0,.35,-1.12,0xc7b393);
  }
  if(name==='跑轮公园'){
    const wheel=new THREE.Mesh(new THREE.TorusGeometry(.82,.1,12,48),new THREE.MeshStandardMaterial({color:0x8d6950}));wheel.position.y=1;group.add(wheel);
    for(let i=0;i<12;i++){const spoke=box(.04,1.6,.06,0,1,0,0xb39a73);spoke.rotation.z=i*Math.PI/6}box(1.5,.15,.9,0,.18,0,0x756750);
  }
  if(name==='小菜园'){for(let x=-1;x<=1;x+=.65){box(.42,.13,1.6,x,.16,0,0x513a29);for(let z=-.65;z<=.65;z+=.4){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.18,10,8),new THREE.MeshStandardMaterial({color:0x5b8848}));leaf.scale.y=.55;leaf.position.set(x,.3,z);group.add(leaf)}}}
  if(name==='墓地'){for(let x=-.9;x<=.9;x+=.9){box(.48,.55,.16,x,.32,0,0xb9bdb5);box(.64,.09,.6,x,.12,.2,0xc8c9bd)}}
  group.traverse(o=>o.userData.place=name); return group;
}

const hamsterAsset=new FBXLoader().loadAsync('../assets/models/booth-hamster/restored/Assets/Ham/Mesh/Ham.fbx');
hamsterAsset.catch(()=>{});
function hamster(tone=0x9b9d98) {
  const rig=new THREE.Group();
  const texture=new THREE.TextureLoader().load('../assets/models/booth-hamster/restored/Assets/Ham/Texture/Ham.png');
  texture.colorSpace=THREE.SRGBColorSpace;
  const fur=new THREE.MeshStandardMaterial({map:texture,color:tone,roughness:.94});
  const eye=new THREE.MeshPhysicalMaterial({color:0x080706,roughness:.08,clearcoat:1});
  const whisker=new THREE.MeshStandardMaterial({color:0xd8d4cc,transparent:true,opacity:.78,side:THREE.DoubleSide});
  hamsterAsset.then(asset=>{
    const model=clone(asset),joints=[];
    model.traverse(child=>{if(child.isBone&&/Arm|Leg|Hand|Foot/.test(child.name))joints.push({bone:child,base:child.quaternion.clone()});if(!child.isMesh)return;child.castShadow=true;child.receiveShadow=true;
      const material=original=>{const name=(child.name+' '+(original?.name||'')).toLowerCase();return name.includes('eye')?eye:name.includes('hige')||name.includes('whisk')?whisker:fur};
      child.material=Array.isArray(child.material)?child.material.map(material):material(child.material);
    });
    const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=.62/Math.max(size.x,size.y,size.z);
    model.scale.setScalar(scale);model.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);rig.add(model);
    rig.userData.joints=joints;rig.userData.loaded=true;
    document.querySelector('#townScene').dataset.model='loaded';
  }).catch(()=>{document.querySelector('#townActivity').textContent='鼠鼠模型加载失败，请返回后重新进入。'});
  return rig;
}

function init() {
  const host=document.querySelector('#townScene'),canvas=host?.querySelector('canvas'); if(!host||!canvas)return;
  const scene=new THREE.Scene(); scene.background=new THREE.Color(0xdce9df); scene.fog=new THREE.Fog(0xdce9df,45,85);
  const camera=new THREE.PerspectiveCamera(38,1,.1,100); camera.position.set(13,15,17);camera.lookAt(0,0,1);
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const ambient=new THREE.HemisphereLight(0xfff4df,0x66766d,2.4);scene.add(ambient);const sun=new THREE.DirectionalLight(0xffe4bd,3.1);sun.position.set(-8,15,-7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
  const ground=new THREE.Mesh(new THREE.CylinderGeometry(10.8,11.4,.65,48),new THREE.MeshStandardMaterial({color:0x9fbd91,roughness:1}));ground.position.y=-.35;ground.receiveShadow=true;scene.add(ground);
  const pathMat=new THREE.MeshStandardMaterial({color:0xd9c9ad,roughness:1});
  [[0,0,13,1.05],[0,2.2,1.05,8.2]].forEach(([x,z,w,d])=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,.035,d),pathMat);m.position.set(x,.01,z);m.receiveShadow=true;scene.add(m)});
  const clickable=[]; places.forEach(place=>{const obj=roundedBuilding(...place);clickable.push(obj);scene.add(obj)});
  const pet=hamster();scene.add(pet);
  const roles=['跑轮管理员','医生','零食店主','广场邻居','纪念馆管理员','小屋邻居','园丁','礼仪师','守墓人'];
  const residents=places.map(([place,x,z],i)=>{
    const npc=hamster([0xbba58a,0xc8c8bb,0xa49782][i%3]);npc.userData.npcIndex=i;npc.traverse(child=>child.userData.npcIndex=i);scene.add(npc);clickable.push(npc);
    const tag=document.createElement('button');tag.className='town-label town-npc-label';tag.textContent=roles[i];host.appendChild(tag);
    tag.onclick=()=>focusResident(i);
    return {rig:npc,x:x+(place==='中心广场'?1.9:0),z:z+1.7,phase:i*1.8,tag};
  });
  const gaitAxis=new THREE.Vector3(1,0,0),rotation=new THREE.Quaternion();
  function walk(rig,time,phase,x,z){
    const cycle=(time+phase)%16,moving=cycle<10,progress=Math.min(cycle,10)/10*Math.PI*2;
    rig.position.set(x+Math.sin(progress)*.55,.035,z+Math.cos(progress)*.22);
    if(moving)rig.rotation.y=Math.atan2(.55*Math.cos(progress),-.22*Math.sin(progress));
    const stride=moving?Math.sin(progress*14):0;
    rig.position.y+=moving?Math.abs(stride)*.008:0;
    for(const {bone,base} of rig.userData.joints||[]){
      const side=bone.name.includes('Left')?1:-1,front=/Arm|Hand/.test(bone.name);
      const bend=/ForeArm|Leg/.test(bone.name)?Math.max(0,stride*side)*.18:stride*side*(front?-.28:.28);
      bone.quaternion.copy(base).multiply(rotation.setFromAxisAngle(gaitAxis,bend));
    }
  }
  const labels=places.map(([name,x,z])=>{const button=document.createElement('button');button.className='town-label';button.textContent=name;button.onclick=()=>enterPlace(name);host.appendChild(button);return {button,point:new THREE.Vector3(x,name==='中心广场'?.5:2.1,z)}});
  const landscape=new THREE.Mesh(new THREE.PlaneGeometry(160,160),new THREE.MeshStandardMaterial({color:0x92ad7e,roughness:1}));landscape.rotation.x=-Math.PI/2;landscape.position.y=-.7;scene.add(landscape);
  for(let i=0;i<34;i++){const tree=new THREE.Group(),trunk=new THREE.Mesh(new THREE.CylinderGeometry(.08,.11,.55,8),new THREE.MeshStandardMaterial({color:0x80644d})),leaf=new THREE.Mesh(new THREE.SphereGeometry(.34,12,9),new THREE.MeshStandardMaterial({color:i%3?0x5f946a:0x7ca56e,roughness:1}));trunk.position.y=.28;leaf.position.y=.73;tree.add(trunk,leaf);const a=i/34*Math.PI*2,r=9.5;tree.position.set(Math.cos(a)*r,0,Math.sin(a)*r);scene.add(tree)}
  let yaw=0,pitch=.83,distance=25,drag=null,activePlace=null,savedCamera=null,focusedResident=-1,savedFocusCamera=null,worldState={};
  const target=new THREE.Vector3(0,0,1);
  const room=new THREE.Group();room.visible=false;scene.add(room);
  const weatherFx=new THREE.Group(),memorialFx=new THREE.Group();scene.add(weatherFx,memorialFx);
  const roomLabels=[];
  const returnButton=document.createElement('button');returnButton.className='town-room-return';returnButton.textContent='← 返回小镇';returnButton.hidden=true;host.appendChild(returnButton);
  const speech=document.createElement('div');speech.className='town-npc-speech';speech.hidden=true;host.appendChild(speech);
  const indoorNames=['鼠鼠小屋','诊所','零食铺','纪念馆','殡仪馆'];
  function clearRoom(){roomLabels.splice(0).forEach(item=>item.button.remove());while(room.children.length){const child=room.children[0];child.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose()}});room.remove(child)}}
  function buildRoom(name){
    clearRoom();
    const add=(w,h,d,x,y,z,color)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.8}));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;room.add(mesh);return mesh};
    const label=(text,x,z,action)=>{const button=document.createElement(action?'button':'span');button.className='town-label town-furniture-label';button.textContent=text;if(action)button.onclick=()=>window.dispatchEvent(new CustomEvent('town-object-action',{detail:{action,place:name}}));host.appendChild(button);roomLabels.push({button,point:new THREE.Vector3(x,.95,z)})};
    add(8,.18,6,0,-.1,0,0xc6a678);add(8,1.9,.16,0,.85,-3,0xe5dbc5);add(.16,1.9,6,-4,.85,0,0xe5dbc5);add(8,.2,.16,0,0,3,0x8e7353);add(.16,.2,6,4,0,0,0x8e7353);
    for(let x=-3.8;x<4;x+=.4)add(.015,.01,6,x,0,0,0xa88c64);
    const bed=(x,z,text)=>{add(1.9,.3,1.2,x,.2,z,0x886846);add(1.78,.18,1.1,x,.43,z,0xe9dbba);add(.45,.17,.8,x-.58,.6,z,0xf7eed9);add(.9,.09,1.05,x+.3,.56,z,0x879c8a);label(text,x,z)};
    const shelf=(x,z,text)=>{add(1.6,1.35,.18,x,.68,z-.22,0x856845);[-.72,.72].forEach(dx=>add(.1,1.4,.6,x+dx,.7,z,0x856845));[.12,.65,1.2].forEach(y=>{add(1.6,.08,.6,x,y,z,0xad8961);for(let i=0;i<4;i++)add(.22,.25,.25,x-.5+i*.33,y+.16,z,0xc7c49e)});label(text,x,z)};
    if(name==='鼠鼠小屋'){
      bed(-2.2,-1.6,'床铺');
      const bowl=new THREE.Mesh(new THREE.TorusGeometry(.36,.1,12,32),new THREE.MeshStandardMaterial({color:0xe9d4b5}));bowl.rotation.x=Math.PI/2;bowl.position.set(1.8,.18,1.2);room.add(bowl);add(.5,.06,.5,1.8,.1,1.2,0x9a7944);label('食盆',1.8,1.2);
      add(.16,1.2,.16,2.9,.6,-1.2,0x8b7355);const bottle=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.65,20),new THREE.MeshStandardMaterial({color:0xb0d5d8,transparent:true,opacity:.72}));bottle.position.set(2.9,.82,-1.2);room.add(bottle);add(.07,.3,.07,2.9,.36,-1.05,0xbbbfc1);label('水壶',2.9,-1.2);
      shelf(.2,-2.4,'粮仓');roomLabels.at(-1).button.remove();roomLabels.pop();label('粮仓 · 点击补给',.2,-2.4,'supply');const moved=worldState.furniture?.table?.slot==='window',tableX=moved?2.2:-2.3,tableZ=moved?-.8:1.1;add(1,.55,.75,tableX,.3,tableZ,0x9b7851);label('木桌',tableX,tableZ);add(.65,.15,.65,tableX+1,.1,tableZ+.2,0x92a082);label('坐垫',tableX+1,tableZ+.2);if(worldState.furniture?.lamp?.owned){add(.08,.65,.08,tableX,.9,tableZ,0x6f614c);const shade=new THREE.Mesh(new THREE.ConeGeometry(.28,.35,16),new THREE.MeshStandardMaterial({color:0xe4c66e,emissive:0x7b5e20,emissiveIntensity:.35}));shade.position.set(tableX,1.25,tableZ);room.add(shade);label('台灯',tableX,tableZ)}
    }else if(name==='诊所'){bed(-1.9,-.8,'诊疗床');shelf(1.6,-2.4,'药柜');add(1.4,.7,.8,1.9,.38,1.2,0xdedccd);label('检查台',1.9,1.2)}
    else if(name==='零食铺'){shelf(-2.2,-2.4,'粮食货架');shelf(.5,-2.4,'零食货架');add(3,.85,.85,.5,.43,1.3,0xa87e52);label('柜台',.5,1.3);for(let i=0;i<5;i++)add(.33,.2,.4,-.6+i*.55,.97,1.3,0xd8b977)}
    else if(name==='纪念馆'){[-2.2,0,2.2].forEach((x,i)=>{add(1.4,.55,.8,x,.28,-1.4,0x9c927e);const glass=add(1.4,.65,.8,x,.88,-1.4,0xdceae1);glass.material.transparent=true;glass.material.opacity=.25;label(['纪念物展柜','生平卡片展柜','相册展柜'][i],x,-1.4)});add(2,.4,.7,0,.22,1.5,0x97836b);label('休息长椅',0,1.5)}
    else{add(2.5,.65,1.2,0,.34,-1,0xb9b7aa);label('告别台',0,-1);shelf(-2.6,-2.4,'送别用品柜');add(2,.4,.65,0,.2,1.4,0x938677);label('等候长椅',0,1.4)}
  }
  function enterPlace(name){
    clearFocus(false);
    if(activePlace)leavePlace();
    savedCamera={yaw,pitch,distance,target:target.clone()};activePlace=name;
    document.querySelector('#townPlace b').textContent=name;document.querySelector('#townPlace span').textContent=indoorNames.includes(name)?'屋顶剖视 · 拖动旋转 · 滚轮缩放':'近距离查看 · 拖动旋转 · 滚轮缩放';
    const indoor=indoorNames.includes(name);
    if(indoor){buildRoom(name);scene.children.forEach(child=>{if(!child.isLight&&child!==room)child.visible=false});room.visible=true;target.set(0,0,0);distance=13;pitch=.92;yaw=.18}
    else{const place=places.find(p=>p[0]===name);target.set(place[1],.2,place[2]);distance=8;pitch=.85;yaw=0}
    returnButton.hidden=false;host.dataset.place=name;positionCamera();window.dispatchEvent(new CustomEvent('town-place-select',{detail:{place:name}}));
  }
  function leavePlace(){
    if(!activePlace)return;room.visible=false;clearRoom();scene.children.forEach(child=>{if(child!==room)child.visible=true});yaw=savedCamera.yaw;pitch=savedCamera.pitch;distance=savedCamera.distance;target.copy(savedCamera.target);activePlace=null;savedCamera=null;returnButton.hidden=true;delete host.dataset.place;positionCamera();
  }
  function focusResident(index){
    const npc=residents[index];if(!npc?.rig.visible)return;if(activePlace)leavePlace();if(focusedResident<0)savedFocusCamera={yaw,pitch,distance,target:target.clone()};focusedResident=index;target.set(npc.x+1.15,.25,npc.z);yaw=.15;pitch=.68;distance=5.4;returnButton.hidden=false;host.dataset.resident=String(index);document.querySelector('#townPlace b').textContent=worldState.npcs?.[index]?.name||roles[index];document.querySelector('#townPlace span').textContent=places[index][0]+'的居民';positionCamera();sayToResident(index,'今天也很高兴见到你！');window.dispatchEvent(new CustomEvent('town-npc-select',{detail:{index}}));
  }
  function clearFocus(restore=true){if(focusedResident<0)return;focusedResident=-1;speech.hidden=true;delete host.dataset.resident;document.querySelector('#townPlace b').textContent='中心广场';document.querySelector('#townPlace span').textContent='鼠鼠们碰面和交换消息的地方';if(restore&&savedFocusCamera){yaw=savedFocusCamera.yaw;pitch=savedFocusCamera.pitch;distance=savedFocusCamera.distance;target.copy(savedFocusCamera.target);positionCamera()}savedFocusCamera=null;if(!activePlace)returnButton.hidden=true}
  function sayToResident(index,text){if(index!==focusedResident)focusResident(index);speech.textContent=text||'吱吱，欢迎来找我聊天。';speech.hidden=false;clearTimeout(speech._timer);speech._timer=setTimeout(()=>{speech.hidden=true},4200)}
  returnButton.onclick=()=>focusedResident>=0?clearFocus():leavePlace();
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&activePlace&&document.body.dataset.currentPanel==='town'){e.preventDefault();e.stopImmediatePropagation();leavePlace()}},true);
  new MutationObserver(()=>{if(document.body.dataset.currentPanel!=='town')leavePlace()}).observe(document.body,{attributes:true,attributeFilter:['data-current-panel']});
  function positionCamera(){camera.position.set(Math.sin(yaw)*Math.cos(pitch)*distance,Math.sin(pitch)*distance,Math.cos(yaw)*Math.cos(pitch)*distance);camera.position.add(target);camera.lookAt(target)}positionCamera();
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,yaw,pitch,target:target.clone(),button:e.button,moved:false};canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>4)drag.moved=true;if(drag.button===2||e.shiftKey){const right=new THREE.Vector3().setFromMatrixColumn(camera.matrix,0),forward=new THREE.Vector3().crossVectors(right,camera.up);target.copy(drag.target).addScaledVector(right,-dx*distance*.0015).addScaledVector(forward,dy*distance*.0015)}else{yaw=drag.yaw-dx*.008;pitch=Math.max(.34,Math.min(1.18,drag.pitch+dy*.006))}positionCamera()});
  canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved){const rect=canvas.getBoundingClientRect(),mouse=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-((e.clientY-rect.top)/rect.height)*2+1),ray=new THREE.Raycaster();ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(clickable,true)[0];if(hit&&!activePlace){let object=hit.object;while(object&&!Number.isInteger(object.userData.npcIndex)&&!object.userData.place)object=object.parent;if(Number.isInteger(object?.userData.npcIndex))focusResident(object.userData.npcIndex);else if(object?.userData.place)enterPlace(object.userData.place)}}drag=null});
  canvas.addEventListener('wheel',e=>{e.preventDefault();distance=Math.max(activePlace?5:14,Math.min(activePlace?20:31,distance+e.deltaY*.015));positionCamera()},{passive:false});
  function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}new ResizeObserver(resize).observe(host);resize();
  function placeLabel(button,point,occupied,hidden=false){const p=point.clone().project(camera);let x=(p.x+1)*host.clientWidth/2,y=(-p.y+1)*host.clientHeight/2;button.hidden=hidden||p.z>1;if(button.hidden)return;for(let tries=0;tries<5&&occupied.some(o=>Math.abs(o.x-x)<82&&Math.abs(o.y-y)<28);tries++)y+=24;occupied.push({x,y});button.style.left=x+'px';button.style.top=y+'px'}
  const clock=new THREE.Clock();function draw(){requestAnimationFrame(draw);const t=clock.getElapsedTime(),home=pet.userData.home||{x:2.3,z:2.3};walk(pet,t,0,home.x,home.z);weatherFx.rotation.y=t*.025;if(weatherFx.children[0])weatherFx.children[0].position.y=-(t*2)%4;const occupied=[];labels.forEach(({button,point})=>placeLabel(button,point,occupied,!!activePlace||focusedResident>=0));residents.forEach((npc,index)=>{walk(npc.rig,t,npc.phase,npc.x,npc.z);placeLabel(npc.tag,npc.rig.position.clone().add(new THREE.Vector3(0,.8,0)),occupied,!npc.rig.visible||!!activePlace||(focusedResident>=0&&focusedResident!==index))});roomLabels.forEach(({button,point})=>placeLabel(button,point,occupied,false));if(focusedResident>=0&&!speech.hidden){const p=residents[focusedResident].rig.position.clone().add(new THREE.Vector3(0,1.05,0)).project(camera);speech.style.left=((p.x+1)*host.clientWidth/2)+'px';speech.style.top=((-p.y+1)*host.clientHeight/2)+'px'}if(document.body.dataset.currentPanel==='town')renderer.render(scene,camera)}draw();
  function applyWorld(next={}){
    worldState=next;const night=['夜晚','深夜'].includes(next.part),sky=new THREE.Color(next.weather?.sky||0xcbd7a9);if(night)sky.multiplyScalar(.3);scene.background.copy(sky);scene.fog.color.copy(sky);ambient.intensity=(night?.65:2.4)*(next.weather?.light||1);sun.intensity=(night?.55:3.1)*(next.weather?.light||1);sun.color.set(night?0x9eb7df:0xffe4bd);document.body.dataset.townPart=next.part||'';
    pet.visible=next.alive!==false||next.pendingFarewell?.phase!=='buried';residents.forEach((resident,i)=>{const data=next.npcs?.[i];resident.rig.visible=data?.alive!==false;resident.tag.hidden=!resident.rig.visible;resident.tag.textContent=data?`${data.name} ${data.sex==='male'?'♂':'♀'}`:roles[i]});
    while(weatherFx.children.length){const child=weatherFx.children[0];child.geometry.dispose();child.material.dispose();weatherFx.remove(child)}
    if(next.weather?.name==='小雨'){const points=[];for(let i=0;i<260;i++)points.push((Math.random()-.5)*25,Math.random()*12,(Math.random()-.5)*25);const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));weatherFx.add(new THREE.Points(geometry,new THREE.PointsMaterial({color:0xd8edf0,size:.055,transparent:true,opacity:.72})))}
    while(memorialFx.children.length){const child=memorialFx.children[0];child.geometry?.dispose();child.material?.dispose();memorialFx.remove(child)}
    (next.memorials||[]).slice(-6).forEach((item,i)=>{const stone=new THREE.Mesh(new THREE.BoxGeometry(.3,.42,.12),new THREE.MeshStandardMaterial({color:0xaeb3aa,roughness:1}));stone.position.set(2.05+i*.36,.24,5.8);memorialFx.add(stone)});
    const location=places.find(p=>p[0]===next.place);if(location&&!activePlace){pet.userData.home={x:location[1]+.7,z:location[2]+1.3}}
    if(activePlace==='鼠鼠小屋'){buildRoom(activePlace)}
  }
  window.TownApp={resize,enterPlace,leavePlace,focusResident,clearFocus,sayToResident,applyWorld,inspect:()=>({activePlace,focusedResident,interiorVisible:room.visible,furniture:roomLabels.map(x=>x.button.textContent),camera:{yaw,pitch,distance,target:target.toArray()},npcCount:residents.filter(n=>n.rig.userData.loaded).length,petLoaded:!!pet.userData.loaded,jointCount:pet.userData.joints?.length||0,petHeight:new THREE.Box3().setFromObject(pet).getSize(new THREE.Vector3()).y,positions:residents.map(n=>n.rig.position.toArray())})};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
