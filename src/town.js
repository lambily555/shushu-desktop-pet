import * as THREE from 'three';

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
  group.traverse(o=>o.userData.place=name); return group;
}

function hamster() {
  const g=new THREE.Group();
  const fur=new THREE.MeshStandardMaterial({color:0x8c8179,roughness:1});
  const cream=new THREE.MeshStandardMaterial({color:0xe8ddd0,roughness:1});
  const body=new THREE.Mesh(new THREE.SphereGeometry(.58,28,20),fur);body.scale.set(1,1.05,1.18);body.position.y=.62;body.castShadow=true;g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.49,28,20),fur);head.scale.set(1.08,1.02,.96);head.position.set(0,1.12,-.34);head.castShadow=true;g.add(head);
  const belly=new THREE.Mesh(new THREE.SphereGeometry(.38,24,16),cream);belly.scale.set(.84,.95,.28);belly.position.set(0,.72,-.57);g.add(belly);
  const earMat=new THREE.MeshStandardMaterial({color:0xc89ca0,roughness:1});
  [-1,1].forEach(side=>{const ear=new THREE.Mesh(new THREE.SphereGeometry(.18,20,14),earMat);ear.scale.z=.45;ear.position.set(side*.36,1.48,-.32);g.add(ear)});
  const black=new THREE.MeshStandardMaterial({color:0x151515,roughness:.35});
  [-1,1].forEach(side=>{const eye=new THREE.Mesh(new THREE.SphereGeometry(.055,14,10),black);eye.position.set(side*.18,1.2,-.78);g.add(eye)});
  const nose=new THREE.Mesh(new THREE.SphereGeometry(.055,14,10),new THREE.MeshStandardMaterial({color:0xb77b80}));nose.position.set(0,1.06,-.84);g.add(nose);
  g.scale.set(1.08,1.08,1.08);g.position.set(0,.1,1);return g;
}

function init() {
  const host=document.querySelector('#townScene'),canvas=host?.querySelector('canvas'); if(!host||!canvas)return;
  const scene=new THREE.Scene(); scene.background=new THREE.Color(0xdce9df); scene.fog=new THREE.Fog(0xdce9df,18,34);
  const camera=new THREE.PerspectiveCamera(38,1,.1,100); camera.position.set(13,15,17);camera.lookAt(0,0,1);
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene.add(new THREE.HemisphereLight(0xfff4df,0x66766d,2.4));const sun=new THREE.DirectionalLight(0xffe4bd,3.1);sun.position.set(-8,15,-7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
  const ground=new THREE.Mesh(new THREE.CylinderGeometry(10.8,11.4,.65,48),new THREE.MeshStandardMaterial({color:0x9fbd91,roughness:1}));ground.position.y=-.35;ground.receiveShadow=true;scene.add(ground);
  const pathMat=new THREE.MeshStandardMaterial({color:0xd9c9ad,roughness:1});
  [[0,0,13,1.05],[0,2.2,1.05,8.2]].forEach(([x,z,w,d])=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,.035,d),pathMat);m.position.set(x,.01,z);m.receiveShadow=true;scene.add(m)});
  const clickable=[]; places.forEach(place=>{const obj=roundedBuilding(...place);clickable.push(obj);scene.add(obj)});
  const pet=hamster();scene.add(pet);
  for(let i=0;i<34;i++){const tree=new THREE.Group(),trunk=new THREE.Mesh(new THREE.CylinderGeometry(.08,.11,.55,8),new THREE.MeshStandardMaterial({color:0x80644d})),leaf=new THREE.Mesh(new THREE.SphereGeometry(.34,12,9),new THREE.MeshStandardMaterial({color:i%3?0x5f946a:0x7ca56e,roughness:1}));trunk.position.y=.28;leaf.position.y=.73;tree.add(trunk,leaf);const a=i/34*Math.PI*2,r=9.5;tree.position.set(Math.cos(a)*r,0,Math.sin(a)*r);scene.add(tree)}
  let yaw=.62,pitch=.7,distance=24,drag=null;
  function positionCamera(){camera.position.set(Math.sin(yaw)*Math.cos(pitch)*distance,Math.sin(pitch)*distance,Math.cos(yaw)*Math.cos(pitch)*distance);camera.lookAt(0,0,1)}positionCamera();
  canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,yaw,pitch,moved:false};canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>4)drag.moved=true;yaw=drag.yaw-dx*.008;pitch=Math.max(.34,Math.min(1.18,drag.pitch+dy*.006));positionCamera()});
  canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved){const rect=canvas.getBoundingClientRect(),mouse=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-((e.clientY-rect.top)/rect.height)*2+1),ray=new THREE.Raycaster();ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(clickable,true)[0];if(hit){const name=hit.object.userData.place,item=places.find(p=>p[0]===name);document.querySelector('#townPlace b').textContent=name;document.querySelector('#townPlace span').textContent=item?.[4]||''}}drag=null});
  canvas.addEventListener('wheel',e=>{e.preventDefault();distance=Math.max(14,Math.min(31,distance+e.deltaY*.015));positionCamera()},{passive:false});
  function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}new ResizeObserver(resize).observe(host);resize();
  const clock=new THREE.Clock();function draw(){requestAnimationFrame(draw);const t=clock.getElapsedTime();pet.position.x=Math.sin(t*.22)*1.7;pet.position.z=1+Math.cos(t*.22)*1.1;pet.rotation.y=Math.atan2(Math.cos(t*.22)*1.7,Math.sin(t*.22)*1.1)+Math.PI;pet.position.y=.1+Math.abs(Math.sin(t*2.4))*.025;renderer.render(scene,camera)}draw();
  window.TownApp={resize};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
