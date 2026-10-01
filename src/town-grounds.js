import * as THREE from 'three';
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.85,...extra});
function kit(group){
 const box=(w,h,d,x,y,z,m)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh};
 const oval=(x,y,z,sx,sy,sz,m)=>{const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),m);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;group.add(mesh);return mesh};
 const tube=(points,r,m)=>{const mesh=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),14,r,5,false),m);group.add(mesh);return mesh};
 return {box,oval,tube};
}
function woodTexture(){const c=document.createElement('canvas');c.width=256;c.height=256;const g=c.getContext('2d');g.fillStyle='#b68a54';g.fillRect(0,0,256,256);for(let i=0;i<90;i++){g.strokeStyle=i%3?'#a4784670':'#dbc09480';g.beginPath();for(let y=0;y<256;y+=8){const x=i*3+Math.sin(y*.035+i)*2;if(y)g.lineTo(x,y);else g.moveTo(x,y)}g.stroke()}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function soilTexture(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle='#6b5035';g.fillRect(0,0,256,256);for(let i=0;i<6500;i++){const x=(Math.sin(i*72.9)*43758.5%1+1)%1*256,y=(Math.cos(i*41.7)*29173.2%1+1)%1*256;g.fillStyle=i%3?'#806245':'#493724';g.fillRect(x,y,1+(i%3),1+(i%2))}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function sign(group,text,x,y,z,action){const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#e9dbb9';ctx.fillRect(0,0,512,256);ctx.strokeStyle='#765e3e';ctx.lineWidth=12;ctx.strokeRect(8,8,496,240);ctx.fillStyle='#4c4935';ctx.font='bold 55px Microsoft YaHei';ctx.textAlign='center';ctx.textBaseline='middle';text.split('\n').forEach((line,i,all)=>ctx.fillText(line,256,128+(i-(all.length-1)/2)*65));const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(.95,.48),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}));mesh.position.set(x,y,z);if(action)mesh.userData.townAction=action;group.add(mesh);return mesh}
export function createGarden(){
 const group=new THREE.Group(),{box,oval,tube}=kit(group),wood=mat('#ffffff',{map:woodTexture()}),soil=mat('#ffffff',{map:soilTexture()}),leaf=mat('#769a43'),darkLeaf=mat('#4e7535'),stem=mat('#738347'),plants=new THREE.Group();group.add(plants);const grow=kit(plants);
 box(3.15,.15,2.25,0,.02,0,soil);box(3.3,.24,.1,0,.12,1.15,wood);box(3.3,.24,.1,0,.12,-1.15,wood);[-1.6,1.6].forEach(x=>box(.1,.24,2.4,x,.12,0,wood));for(let x=-1.55;x<1.6;x+=.25){box(.07,.6,.07,x,.35,-1.18,wood);const top=new THREE.Mesh(new THREE.ConeGeometry(.065,.12,4),wood);top.position.set(x,.71,-1.18);group.add(top)}box(3.2,.065,.08,0,.55,-1.18,wood);[-.52,.52].forEach(x=>box(.07,.08,2.2,x,.17,0,wood));box(3.1,.08,.06,0,.17,0,wood);
 // Six beds contain recognisable carrots, broccoli, cabbage, peppers and wheat.
 const cabbage=(x,z)=>{for(let j=0;j<7;j++){const a=j*Math.PI*2/7;const l=grow.oval(x+Math.cos(a)*.12,.23,z+Math.sin(a)*.12,.13,.035,.2,j%2?leaf:darkLeaf);l.rotation.set(Math.sin(a)*.45,a,Math.cos(a)*.3)}grow.oval(x,.27,z,.12,.09,.12,leaf)};
 for(let i=0;i<3;i++){const x=-1.22+i*.25;grow.oval(x,.2,.63,.065,.14,.065,mat('#df8132'));for(let j=0;j<3;j++){const l=grow.oval(x+(j-1)*.07,.4,.63,.03,.17,.045,darkLeaf);l.rotation.z=(j-1)*.4}}
 for(let i=0;i<2;i++){const x=-1.18+i*.4;grow.box(.065,.25,.065,x,.27,.12,stem);for(let j=0;j<9;j++){const a=j*2.4,r=.14*Math.sqrt(j/9);grow.oval(x+Math.cos(a)*r,.43+(j%3)*.025,.12+Math.sin(a)*r,.09,.075,.09,darkLeaf)}}
 [-.25,.25].forEach(x=>cabbage(x,.55));[.87,1.2].forEach(x=>cabbage(x,-.6));
 for(let i=0;i<2;i++){const x=.85+i*.35;const color=mat(i?'#d54f33':'#ecc544');for(let j=0;j<4;j++){const a=j*Math.PI/2;grow.oval(x+Math.cos(a)*.06,.28,.5+Math.sin(a)*.06,.085,.16,.085,color)}grow.box(.035,.1,.035,x,.49,.5,stem)}
 for(let i=0;i<9;i++){const x=-1.3+(i%3)*.15,z=-.85+Math.floor(i/3)*.25;grow.tube([[x,.12,z],[x+.03,.48,z],[x+.05,.8,z]],.009,mat('#c49b55'));for(let j=0;j<5;j++)grow.oval(x+(j%2?.04:-.02),.5+j*.055,z,.035,.055,.025,mat('#d6b472'))}
 for(let i=0;i<3;i++)cabbage(-.25+i*.22,-.58);
 for(let i=0;i<75;i++){const x=Math.sin(i*12.7)*1.5,z=Math.cos(i*7.1)*1.03;oval(x,.12,z,.023,.015,.021,mat(i%2?'#927757':'#4e3a2b'))}
 const can=mat('#7a997a');oval(1.75,.22,.95,.15,.2,.15,can);tube([[1.78,.17,.94],[2.03,.22,.8],[2.1,.3,.75]],.045,can);tube([[1.66,.24,1],[1.57,.55,1],[1.84,.55,1],[1.87,.26,1]],.015,can);
 sign(group,'小菜园',-.95,.65,1.22);plants.traverse(o=>o.userData.townAction='harvest');group.userData.plants=plants;group.userData.setGrowth=p=>{plants.scale.y=.35+.65*p;plants.scale.x=plants.scale.z=.7+.3*p};group.userData.footprint=3.3*2.4;return group;
}
export function createPlaza(){
 const group=new THREE.Group(),{box,oval,tube}=kit(group),wood=mat('#ffffff',{map:woodTexture()}),stone=mat('#d1c4a7'),bronze=mat('#ad8950',{metalness:.72,roughness:.35});
 const floor=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.14,64),mat('#b6aa90'));floor.scale.set(3.15*Math.SQRT2,1,1.8*Math.SQRT2);floor.position.y=.02;floor.receiveShadow=true;group.add(floor);
 for(let row=-7;row<=7;row++)for(let col=-12;col<=12;col++){const x=col*.36+(row%2)*.16,z=row*.35;if((x/(3.1*Math.SQRT2))**2+(z/(1.75*Math.SQRT2))**2>1||Math.hypot(x,z)<.86)continue;const slab=box(.33,.045,.31,x,.115,z,mat(['#cfc4ac','#bdbaa5','#d9ceb4'][Math.abs(col+row)%3]));slab.rotation.y=Math.sin(col*7+row)*.04}
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.73,.11,8,40),stone);ring.rotation.x=Math.PI/2;ring.position.y=.24;ring.visible=false;group.add(ring);for(let i=0;i<20;i++){const a=i*Math.PI/10,brick=box(.225,.18,.16,Math.cos(a)*.73,.25,Math.sin(a)*.73,mat(i%2?'#c8bca4':'#d7ccb6'));brick.rotation.y=Math.PI/2-a}const water=new THREE.Mesh(new THREE.CircleGeometry(.7,40),mat('#7faeb6',{metalness:.25,roughness:.22,transparent:true,opacity:.83}));water.rotation.x=-Math.PI/2;water.position.y=.2;group.add(water);const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(.26,.33,.23,24),bronze);pedestal.position.y=.31;group.add(pedestal);
 oval(0,.86,0,.35,.46,.29,bronze);oval(0,1.24,.02,.3,.25,.27,bronze);[-1,1].forEach(side=>{oval(side*.22,1.45,.02,.13,.16,.07,bronze);oval(side*.11,1.24,.25,.037,.045,.025,mat('#453c28',{metalness:.8}));oval(side*.2,.74,.22,.085,.15,.075,bronze);oval(side*.19,.45,.2,.11,.06,.13,bronze)});oval(0,1.16,.295,.05,.035,.035,bronze);tube([[-.09,1.1,.27],[0,1.07,.3],[.09,1.1,.27]],.008,bronze);
 for(let i=0;i<4;i++){const a=i*Math.PI/2;tube([[Math.cos(a)*.35,.32,Math.sin(a)*.35],[Math.cos(a)*.48,.62,Math.sin(a)*.48],[Math.cos(a)*.61,.21,Math.sin(a)*.61]],.011,mat('#b9d9e0',{transparent:true,opacity:.7,roughness:.15}))}
 const furnitureStart=group.children.length;const bench=(x,z,rotation)=>{const seat=new THREE.Group(),k=kit(seat);for(let i=0;i<3;i++)k.box(.82,.045,.08,0,.3,-.08+i*.09,wood);for(let i=0;i<3;i++)k.box(.82,.07,.04,0,.36+i*.08,-.17,wood);[-.3,.3].forEach(x=>{k.box(.055,.3,.24,x,.15,0,wood);k.box(.045,.4,.045,x,.42,-.14,wood)});seat.position.set(x,0,z);seat.rotation.y=rotation;group.add(seat)};bench(-2.45,.7,.5);bench(2.45,.7,-.5);bench(1.9,-1.1,Math.PI);bench(-1.9,-1.1,Math.PI);bench(-.7,1.45,0);bench(.7,1.45,0);
 const board=(x,z,title,action)=>{box(.85,.8,.1,x,.74,z,wood);[-.35,.35].forEach(dx=>box(.06,1.2,.06,x+dx,.6,z,wood));sign(group,title,x,.8,z+.065,action);for(let i=0;i<4;i++)box(.15,.15,.012,x-.25+(i%2)*.48,.56+Math.floor(i/2)*.18,z+.06,mat(['#e4d08c','#b9cbbd'][i%2]))};board(-1.8,-1.2,'鼠鼠日历','calendar');board(1,-1.3,'物品交换','exchange');
 for(const [x,z] of [[-2.6,-.8],[2.6,-.65],[-1.75,1.28],[1.75,1.28]]){box(.58,.24,.32,x,.18,z,wood);for(let i=0;i<6;i++){const px=x-.23+i*.085;oval(px,.37,z,.055,.14,.04,mat('#65934b'));for(let j=0;j<5;j++){const a=j*Math.PI*2/5;oval(px+Math.cos(a)*.04,.51,z+Math.sin(a)*.04,.037,.02,.037,mat(i%2?'#f0ce63':'#c9868f'))}}}
 const stall=box(.8,.45,.45,2.5,.26,-.15,wood);stall.userData.townAction='exchange';[-.2,0,.2].forEach(x=>oval(2.5+x,.54,-.15,.08,.05,.075,mat('#d9b879')));
 const celebration=new THREE.Group();celebration.visible=false;group.add(celebration);const fest=kit(celebration);for(const x of [-2.15,2.15])fest.box(.035,1.6,.035,x,.82,-.65,wood);fest.tube([[-2.15,1.55,-.65],[0,1.3,-.65],[2.15,1.55,-.65]],.009,wood);for(let i=0;i<11;i++){const x=-1.95+i*.39,shape=new THREE.Shape();shape.moveTo(-.13,0);shape.lineTo(.13,0);shape.lineTo(0,-.25);shape.closePath();const flag=new THREE.Mesh(new THREE.ShapeGeometry(shape),mat(['#bc6955','#dcb64f','#91aa71','#7897ab'][i%4],{side:THREE.DoubleSide}));flag.position.set(x,1.3+.25*(x/2.15)**2,-.65);celebration.add(flag)}
 const cake=new THREE.Group(),cakeKit=kit(cake);const cakeBody=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.18,24),mat('#f0d6b3'));cakeBody.position.y=.17;cake.add(cakeBody);cakeKit.oval(0,.27,0,.3,.035,.3,mat('#f5e7d7'));for(let i=0;i<5;i++){const a=i*Math.PI*2/5;cakeKit.oval(Math.cos(a)*.21,.3,Math.sin(a)*.21,.035,.055,.035,mat('#c76052'))}cakeKit.box(.015,.16,.015,0,.36,0,mat('#dfb459'));cakeKit.oval(0,.46,0,.025,.04,.025,mat('#ffc46f',{emissive:'#ffaf42',emissiveIntensity:1}));cake.position.set(0,.08,1.05);cake.visible=false;celebration.add(cake);
 group.userData.celebration=celebration;group.userData.cake=cake;group.userData.setEvent=event=>{celebration.visible=!!event;cake.visible=!!event?.birthdays?.length};for(const item of group.children.slice(furnitureStart)){item.position.x*=Math.SQRT2;item.position.z*=Math.SQRT2}group.userData.footprint=2*Math.PI*3.15*1.8;return group;
}
export function birthdayHat(){const group=new THREE.Group();const hat=new THREE.Mesh(new THREE.ConeGeometry(.12,.29,12),mat('#cb826a'));hat.position.y=.12;const pom=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),mat('#e9c965'));pom.position.y=.28;group.add(hat,pom);return group}
function storeSign(group,text,x,y,z,width,height,background,ink){const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*height/width);const g=c.getContext('2d');g.fillStyle=background;g.fillRect(0,0,c.width,c.height);g.fillStyle=ink;g.font='bold '+Math.floor(c.height*.67)+'px Microsoft YaHei';g.textAlign='center';g.textBaseline='middle';g.fillText(text,c.width/2,c.height/2);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));mesh.position.set(x,y,z);group.add(mesh)}
export function createRestaurant(){
 const group=new THREE.Group(),{box,oval}=kit(group),wall=mat(0xeee9dd),wood=mat(0x715a43,{map:woodTexture()}),roof=mat(0x667471),stone=mat(0xa7aaa0),green=mat(0x71845d);
 box(4.25,.14,2.9,0,.07,-.14,stone);box(4,1.6,2.65,0,.94,-.14,wall);
 for(const side of [-1,1]){const r=box(2.45,.12,3.15,side*1.02,2.02,-.14,roof);r.rotation.z=-side*.36;for(let row=0;row<6;row++)for(let col=0;col<9;col++){const tile=box(.42,.035,.36,side*(.2+row*.35),2.39-row*.126,-1.52+col*.35,roof);tile.rotation.z=-side*.36}}
 box(.14,.14,3.2,0,2.4,-.14,wood);
 storeSign(group,'鼠鼠饭馆',0,1.77,1.225,2,.32,'#c8b291','#493b2e');
 for(let i=0;i<11;i++)oval(-1.8+i*.36,.17,-1.48,.14,.12,.13,green);
 group.userData.footprint=4.25*2.9;return group;
}
export function createSnackShop(){
 const group=new THREE.Group(),{box,oval,tube}=kit(group),cream=mat('#f2dfa1'),pink=mat('#dca3a0'),mint=mat('#a8c2a0'),wood=mat('#c49c68'),floor=mat('#c9bda3');
 box(3.5,.12,2.7,0,.02,0,floor);box(2.9,1.4,.1,0,.78,-.94,cream);
 for(const x of [-1.42,1.42])for(const z of [-.92,.92])box(.12,1.8,.12,x,.94,z,cream);
 for(const side of [-1,1]){const roof=box(3.3,.12,1.4,0,1.92,side*.55,cream);roof.rotation.x=side*.38;
  for(let row=0;row<4;row++)for(let col=0;col<10;col++){const z=side*(.15+row*.29),tile=box(.31,.045,.31,-1.45+col*.32,2.25-Math.abs(z)*.4,z,mat(row%2?'#f3e5b4':'#ead699'));tile.rotation.x=side*.38}
 }
 tube([[-1.62,2.27,0],[0,2.27,0],[1.62,2.27,0]],.06,cream);
 for(let i=0;i<8;i++){const awning=box(.35,.07,.65,-1.24+i*.355,1.55,1.05,[mint,cream,pink,pink,cream,mint,pink,cream][i]);awning.rotation.x=.17;oval(-1.24+i*.355,1.48,1.37,.175,.055,.08,[mint,cream,pink,pink,cream,mint,pink,cream][i])}
 box(2.5,.38,.09,0,1.89,1.03,pink);storeSign(group,'鼠鼠零食铺',0,1.9,1.085,2.35,.34,'#f5e4b2','#915e3d');
 const rack=(x,z,w)=>{box(w,.64,.32,x,.39,z,mint);for(const y of [.47,.78]){box(w,.055,.4,x,y,z,cream);for(let j=0;j<3;j++){const cx=x-w*.32+j*w*.32;box(w*.29,.1,.34,cx,y+.06,z,pink);for(let n=0;n<9;n++){const a=n*2.4,r=.05*Math.sqrt(n);oval(cx+Math.cos(a)*r,y+.15,z+Math.sin(a)*r,.04,.035,.055,mat(['#c48543','#a65438','#e6bd63'][j]))}}}};
 rack(0,-.68,2.45);rack(.95,.3,.7);
 box(1.65,.62,.5,.35,.35,1.02,mint);box(1.78,.07,.56,.35,.7,1.02,pink);
 for(let i=0;i<4;i++){const x=-.27+i*.4;box(.36,.08,.4,x,.78,1.02,cream);for(let j=0;j<5;j++)oval(x+(j%3-1)*.07,.85,1.02+Math.floor(j/3)*.09-.05,.04,.04,.06,mat(i%2?'#d4ab62':'#9f6540'))}
 box(.65,.48,.5,-1.03,.27,.95,mint);box(.72,.06,.55,-1.03,.53,.95,pink);oval(-1.03,.58,.95,.14,.02,.14,cream);
 for(const side of [-1,1]){for(let i=0;i<5;i++){const z=-.9+i*.45;box(.022,.48,.022,side*1.67,.3,z,wood)}tube([[side*1.67,.45,-.9],[side*1.67,.48,0],[side*1.67,.45,.9]],.012,wood)}
 sign(group,'每日新鲜',1.25,.48,1.3).scale.set(.45,.7,1);group.userData.footprint=3.5*2.7;return group;
}
export function createClinic(){
 const group=new THREE.Group(),{box}=kit(group),white=mat('#f1f5f1'),blue=mat('#86b6c5'),metal=mat('#a8bec4',{metalness:.45,roughness:.4}),glass=mat('#badde1',{transparent:true,opacity:.24,roughness:.15,depthWrite:false}),red=mat('#c75653');
 const rounded=(w,d,h,x,y,z,m)=>{const r=.22,s=new THREE.Shape();s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);s.lineTo(w/2,d/2-r);s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);s.lineTo(-w/2+r,d/2);s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);s.lineTo(-w/2,-d/2+r);s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);const geometry=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:2,steps:1,curveSegments:8});geometry.rotateX(-Math.PI/2);const mesh=new THREE.Mesh(geometry,m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh};
 rounded(3.5,2.7,.12,0,-.02,0,white);rounded(2.95,1.88,.45,0,.13,-.22,blue);
 // An open roof and transparent facade reveal beds and cabinets from above.
 box(2.88,1.45,.09,0,.98,-1.1,white);for(const side of [-1,1]){box(.09,1.2,1.77,side*1.43,1.02,-.22,glass);box(.11,1.58,.11,side*1.43,.96,.67,white)}
 for(const x of [-1.04,1.04]){box(.72,1.16,.035,x,1.07,.71,glass);box(.025,1.23,.025,x,.99,.74,metal)}
 box(.64,1.2,.035,0,.89,.75,glass);for(const x of [-.34,.34])box(.035,1.3,.04,x,.9,.77,white);for(const x of [-.055,.055])box(.018,.19,.025,x,.75,.79,metal);
 for(const y of [1.67,1.76]){box(3.06,.08,.13,0,y,-1.13,white);box(3.06,.08,.13,0,y,.75,white);for(const side of [-1,1])box(.13,.08,1.95,side*1.47,y,-.19,white)}
 const cross=(x,y,z,size)=>{box(size*.27,size,.025,x,y,z,red);box(size,size*.27,.027,x,y,z,red)};cross(0,1.32,-1.03,.33);
 box(1.8,.36,.055,0,1.43,.85,white);storeSign(group,'鼠鼠医院',0,1.44,.884,1.65,.32,'#f0f6f3','#3f7180');
 for(const side of [-1,1]){const chair=new THREE.Group(),seat=kit(chair);chair.position.set(side*1.08,0,1.22);chair.userData.townAction='clinic-seat';chair.userData.seatSide=side;seat.box(.44,.08,.38,0,.31,0,blue);seat.box(.44,.43,.07,0,.55,-.17,blue);for(const x of [-.17,.17])for(const z of [-.13,.13])seat.box(.045,.28,.045,x,.14,z,metal);group.add(chair)}
 group.userData.footprint=3.5*2.7;return group;
}
export function createRemembranceHouse(memorial=false){
 const group=new THREE.Group(),{box,oval,tube}=kit(group),wall=mat('#eee5cc'),trim=mat(memorial?'#a7b39a':'#929ea3'),roof=mat(memorial?'#c0c9b3':'#718794'),wood=mat('#a07d55'),stone=mat('#c6c0ad'),leaf=mat('#748257'),door=mat(memorial?'#8a9976':'#535d60');
 box(3.5,.12,2.7,0,.02,0,stone);box(2.8,1.45,1.85,0,.83,-.27,wall);box(2.85,.15,1.9,0,.18,-.27,trim);
 const arch=(x,y,z,w,h,material)=>{const shape=new THREE.Shape(),r=w/2;shape.moveTo(-r,0);shape.lineTo(r,0);shape.lineTo(r,h-r);shape.absarc(0,h-r,r,0,Math.PI,false);shape.lineTo(-r,0);const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape,20),material);mesh.position.set(x,y,z);group.add(mesh);return mesh};
 const window=(x,z,rotation=0)=>{const frame=new THREE.Group(),outer=arch(0,0,0,.46,.82,trim),inner=arch(0,.05,.006,.34,.69,mat('#5d7071'));group.remove(outer,inner);frame.add(outer,inner);for(const y of [.23,.48]){const bar=new THREE.Mesh(new THREE.BoxGeometry(.34,.018,.025),wood);bar.position.set(0,y,.018);frame.add(bar)}const upright=new THREE.Mesh(new THREE.BoxGeometry(.018,.67,.025),wood);upright.position.set(0,.37,.02);frame.add(upright);frame.position.set(x,.48,z);frame.rotation.y=rotation;group.add(frame)};
 window(-.96,.662);window(.96,.662);for(const side of [-1,1])for(const z of [-.75,-.1])window(side*1.405,z,side*Math.PI/2);
 for(const side of [-1,1]){const panel=box(1.66,.09,2.12,side*.7,1.87,-.27,roof);panel.rotation.z=-side*.36;for(let i=0;i<6;i++){const x=side*(.13+i*.25);tube([[x,2.19-Math.abs(x)*.38,-1.31],[x,2.19-Math.abs(x)*.38,.79]],.018,trim)}}
 const triangle=new THREE.Shape();triangle.moveTo(-1.48,0);triangle.lineTo(1.48,0);triangle.lineTo(0,.58);triangle.closePath();const gable=new THREE.Mesh(new THREE.ShapeGeometry(triangle),wall);gable.position.set(0,1.57,.69);group.add(gable);
 if(memorial){arch(0,.23,.68,.85,1.08,stone);arch(0,.23,.69,.7,.97,door);for(const x of [-.045,.045])oval(x,.7,.71,.025,.025,.015,mat('#c7a76a'));box(.012,.86,.015,0,.66,.71,wood);
  for(const x of [-.68,.68]){const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.075,.085,1.16,16),wall);pillar.position.set(x,.87,.88);group.add(pillar);for(const y of [.28,1.45])box(.23,.1,.25,x,y,.88,stone);for(let i=0;i<8;i++){const a=i*Math.PI/4;tube([[x+Math.cos(a)*.08,.35,.88+Math.sin(a)*.08],[x+Math.cos(a)*.08,1.38,.88+Math.sin(a)*.08]],.008,stone)}}box(1.65,.1,.55,0,1.53,.84,wall);
 }else{box(.85,1.05,.045,0,.77,.69,door);box(.018,1,.025,0,.77,.725,trim);for(const x of [-.06,.06])box(.02,.16,.025,x,.72,.73,mat('#ba9d61'));box(1.15,.1,.43,0,1.39,.85,trim)}
 for(let i=0;i<3;i++)box(1.04,.07,.18,0,.19-i*.05,.81+i*.17,stone);
 storeSign(group,memorial?'鼠鼠纪念馆':'鼠鼠殡仪馆',0,1.77,.72,1.6,.26,'#f0e5c9','#655340');
 const flowers=(x,z)=>{oval(x,.17,z,.15,.12,.14,leaf);for(let i=0;i<6;i++){const a=i*2.4;oval(x+Math.cos(a)*.09,.3,z+Math.sin(a)*.09,.045,.035,.045,mat(i%2?'#e8d9bd':'#ccaaa1'))}};
 for(const side of [-1,1]){box(.33,.14,1.95,side*1.56,.12,-.1,stone);for(let i=0;i<6;i++)oval(side*1.56,.28,-.85+i*.3,.13,.13,.14,leaf);for(let i=0;i<4;i++)box(.02,.42,.02,side*1.73,.27,-.9+i*.55,wood);tube([[side*1.73,.42,-.9],[side*1.73,.45,.1],[side*1.73,.42,.9]],.011,wood);flowers(side*1.05,.94)}
 if(memorial){const display=box(.68,.62,.08,1.14,.6,1.05,wood);for(let i=0;i<9;i++){const x=.94+(i%3)*.2,y=.44+Math.floor(i/3)*.17;oval(x,y,1.1,.065,.065,.018,stone);oval(x,y,1.12,.037,.04,.008,trim)}box(.72,.05,.35,1.14,.25,1.04,wood);box(.55,.025,.3,-.95,.42,1.09,wood);for(const x of [-1.13,-.77])box(.035,.36,.04,x,.22,1.09,wood);box(.55,.22,.035,-.95,.53,.96,wood);
 }else{for(const x of [-1.03,1.03]){const wreath=new THREE.Mesh(new THREE.TorusGeometry(.14,.04,8,20),leaf);wreath.position.set(x,.51,1.05);group.add(wreath);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;oval(x+Math.cos(a)*.14,.51+Math.sin(a)*.14,1.085,.035,.035,.02,mat('#e4d8c2'))}for(const side of [-1,1])tube([[x,.4,1.05],[x+side*.11,.15,1.08]],.008,wood)}}
 group.userData.footprint=3.5*2.7;return group;
}
export function createCemetery(){
 const group=new THREE.Group(),{box,oval,tube}=kit(group),stone=mat('#aaa99a'),cap=mat('#c4c2af'),grass=mat('#8f9e72'),leaf=mat('#697d50'),iron=mat('#6c6653'),wood=mat('#9c7951');
 box(4.2,.1,3.2,0,.01,0,grass);box(.65,.04,3.1,0,.09,0,cap);box(4,.035,.45,0,.09,.08,cap);
 // Gravel stays on the paths; the open central entrance faces local +Z.
 for(let i=0;i<155;i++){const x=Math.sin(i*17.3)*.25,z=Math.cos(i*7.1)*1.45;oval(x,.12,z,.035,.016,.045,i%3?stone:cap)}
 for(let i=0;i<75;i++){const x=Math.sin(i*12.7)*1.9,z=Math.cos(i*6.7)*.16;oval(x,.12,z,.035,.015,.04,stone)}
 box(4.2,.36,.1,0,.23,-1.56,stone);for(const side of [-1,1]){box(.1,.36,3.2,side*2.05,.23,0,stone);box(1.52,.36,.1,side*1.3,.23,1.56,stone);for(let i=0;i<13;i++){const z=-1.5+i*.25;box(.015,.64,.015,side*2.05,.71,z,iron)}tube([[side*2.05,.57,-1.5],[side*2.05,.57,1.5]],.012,iron);tube([[side*2.05,.83,-1.5],[side*2.05,.83,1.5]],.012,iron);box(.17,.84,.18,side*.58,.44,1.58,wood);box(.25,.06,.25,side*.58,.88,1.58,cap)}
 for(let i=0;i<17;i++)box(.015,.64,.015,-2+i*.25,.71,-1.56,iron);for(const y of [.57,.83])box(4.1,.022,.022,0,y,-1.56,iron);
 for(const x of [-1.92,1.92,-.47,.47])for(let i=0;i<10;i++){const z=-1.35+i*.28;if(Math.abs(z)<.32)continue;oval(x,.19,z,.09,.13,.1,leaf)}
 // Niches in the rear wall hold small memorial urns.
 box(1.78,1.08,.24,0,.64,-1.27,stone);for(let row=0;row<3;row++)for(let col=0;col<5;col++){const x=-.7+col*.35,y=.3+row*.32;box(.29,.24,.025,x,y,-1.135,iron);oval(x,y-.015,-1.08,.063,.075,.05,cap)}
 storeSign(group,'鼠鼠纪念墓园',-1.25,.29,1.622,1.25,.22,'#d2bd93','#66533c');
 const graves=new THREE.Group();group.add(graves);let signature='';
 group.userData.setMemorials=items=>{const records=items.slice(-8),key=JSON.stringify(records.map(m=>[m.id,m.name]));if(key===signature)return;signature=key;while(graves.children.length){const child=graves.children[0];child.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.map?.dispose();o.material.dispose()}});graves.remove(child)}const k=kit(graves);
  for(let i=0;i<8;i++){const side=i<4?-1:1,x=side*(.88+(i%2)*.6),z=i%4<2?-.65:.85;k.box(.38,.06,.5,x,.12,z,cap);k.box(.26,.26,.07,x,.28,z-.14,stone);k.oval(x,.41,z-.14,.13,.09,.04,stone);const item=records[i];if(item){storeSign(graves,item.name,x,.29,z-.096,.24,.1,'#b9b7a6','#4b5345');k.oval(x+.12,.18,z+.13,.07,.035,.06,leaf);k.oval(x+.12,.23,z+.13,.045,.025,.035,mat('#dcc7b0'))}}
  group.userData.memorialNames=records.map(m=>m.name);
 };group.userData.setMemorials([]);group.userData.footprint=4.2*3.2;group.userData.gate={x:0,z:1.6};return group;
}
export function createSchool(){
 const group=new THREE.Group(),{box,oval,tube}=kit(group),wood=mat('#ffffff',{map:woodTexture()}),roof=mat('#aa7245'),stone=mat('#c4baa4'),green=mat('#365d4b'),paper=mat('#eee5c9'),gold=mat('#c8a155',{metalness:.65,roughness:.35});
 const cylinder=(top,bottom,h,x,y,z,m)=>{const mesh=new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,h,40),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh};
 box(4.7,.12,3.8,0,.02,.3,stone);cylinder(1.26,1.35,.2,0,.13,-.35,stone);cylinder(1.16,1.16,1.15,0,.8,-.35,wood);cylinder(.99,1.5,.28,0,1.46,-.35,roof);cylinder(.83,.83,.85,0,1.99,-.35,wood);cylinder(.25,1.18,.48,0,2.65,-.35,roof);
 // Individual roof shingles and wall planks add depth rather than painted dots.
 for(const [radius,y] of [[1.38,1.48],[1.07,2.54],[.78,2.69],[.49,2.81]])for(let i=0;i<28;i++){const a=i*Math.PI*2/28,m=box(.17,.045,.23,Math.sin(a)*radius,y,Math.cos(a)*radius-.35,roof);m.rotation.y=a;m.rotation.x=.25}
 for(let i=0;i<38;i++){const a=i*Math.PI*2/38;const plank=box(.015,1.04,.025,Math.sin(a)*1.167,.81,Math.cos(a)*1.167-.35,mat('#a37b48'));plank.rotation.y=a}
 const door=box(.56,.82,.08,0,.52,.83,mat('#68452e'));oval(0,.94,.84,.29,.25,.055,mat('#68452e'));box(.65,.08,.3,0,.13,1.02,wood);oval(.19,.52,.89,.04,.04,.04,gold);sign(group,'鼠鼠学校',0,1.2,1.19);
 for(const [x,y,z,a] of [[-.78,.84,.5,-.65],[.78,.84,.5,.65],[-.52,2.01,.32,-.55],[.52,2.01,.32,.55]]){const frame=new THREE.Mesh(new THREE.TorusGeometry(.23,.04,8,32),roof);frame.position.set(x,y,z);frame.rotation.y=a;group.add(frame);const pane=oval(x,y,z,.21,.21,.035,green);pane.rotation.y=a;box(.025,.38,.07,x,y,z+.03,wood);box(.38,.025,.07,x,y,z+.03,wood)}
 cylinder(.53,.57,.12,0,3.04,-.35,wood);for(const x of [-.38,.38])for(const z of [-.73,.03])box(.09,.66,.09,x,3.4,z,wood);cylinder(.08,.15,.08,0,3.62,-.35,gold);cylinder(.12,.23,.33,0,3.43,-.35,gold);oval(0,3.22,-.35,.035,.06,.035,gold);const cap=new THREE.Mesh(new THREE.ConeGeometry(.76,.48,4),roof);cap.rotation.y=Math.PI/4;cap.position.set(0,3.95,-.35);group.add(cap);
 box(1,.63,.055,-1.65,.62,.95,green);[-2.06,-1.24].forEach(x=>box(.055,.82,.055,x,.43,.95,wood));sign(group,'认识种子\n学习生活',-1.65,.65,.99);
 for(const x of [-1.65,-.72]){box(.68,.42,.43,x,.3,1.62,wood);for(const dx of [-.27,.27])box(.04,.42,.04,x+dx,.22,1.62,wood);box(.3,.035,.23,x,.54,1.62,paper);box(.35,.2,.3,x,.16,1.97,wood)}
 for(const x of [1.35,2.13])box(.065,1.1,.065,x,.56,.65,wood);box(.9,.06,.07,1.74,1.13,.65,wood);for(const x of [1.48,2])tube([[x,1.1,.65],[x,.45,.65]],.01,gold);box(.6,.06,.25,1.74,.43,.65,wood);
 box(.9,.24,.3,1.7,.16,1.7,wood);sign(group,'校园公告',1.85,.8,-.8);for(let i=0;i<24;i++){const x=-2.3+i*.2;box(.025,.35,.025,x,.25,-1.58,wood)}group.userData.footprint=4.7*3.8;return group;
}
export function createWheelPark(){
 const group=new THREE.Group(),{box,oval,tube}=kit(group),wood=mat('#ffffff',{map:woodTexture()}),dark=mat('#805638'),stone=mat('#c5b99d'),grass=mat('#90a165'),track=mat('#c89258'),line=mat('#ece0bc'),metal=mat('#9b9c8c',{metalness:.4,roughness:.45}),wheels=[];
 const disk=(r,h,x,y,z,m)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,64),m);o.position.set(x,y,z);o.receiveShadow=true;o.castShadow=true;group.add(o);return o};
 const ring=(inner,outer,y,m)=>{const o=new THREE.Mesh(new THREE.RingGeometry(inner,outer,80),m);o.rotation.x=-Math.PI/2;o.position.y=y;o.receiveShadow=true;group.add(o)};
 disk(2.26,.12,0,.02,0,grass);ring(1.7,2.08,.091,track);ring(1.86,1.875,.093,line);ring(1.71,1.73,.093,line);ring(2.05,2.07,.093,line);disk(.92,.12,0,.13,0,stone);
 function wheel(x,z,r){const rotor=new THREE.Group(),parts=kit(rotor);rotor.position.set(x,r+.2,z);group.add(rotor);wheels.push(rotor);for(const depth of [-.2,.2]){const rim=new THREE.Mesh(new THREE.TorusGeometry(r,.055,10,64),wood);rim.position.z=depth;rotor.add(rim);for(let i=0;i<8;i++){const a=i*Math.PI/4,spoke=parts.box(.04,r*1.8,.05,0,0,depth,wood);spoke.rotation.z=a}}for(let i=0;i<36;i++){const a=i*Math.PI*2/36,slat=parts.box(.1,.035,.44,Math.sin(a)*r,Math.cos(a)*r,0,wood);slat.rotation.z=-a}parts.oval(0,0,.24,.14,.14,.07,dark);box(r*.85,.1,.68,x,.17,z,wood);for(const dz of [-.3,.3]){const stand=new THREE.Mesh(new THREE.CylinderGeometry(.08,.22,r+.18,3),wood);stand.position.set(x,(r+.18)/2+.18,z+dz);group.add(stand);oval(x,r+.2,z+dz,.05,.05,.04,metal)}return rotor}
 wheel(0,-.12,.75);wheel(-1.12,.3,.29);wheel(.96,.52,.27);wheel(-.65,-1.02,.25);
 for(const [x,z] of [[.9,-.75],[-.75,1.07]]){for(const dx of [-.3,.3])box(.08,.32,.08,x+dx,.25,z,wood);box(.68,.06,.08,x,.42,z,line)}
 for(let i=0;i<7;i++)box(.36,.05,.1,.88,.14,-.35+i*.105,wood);for(let i=0;i<3;i++){box(.78,.18,.25,1.48,.18+i*.18,-.74-i*.2,wood)}box(.8,.55,.06,1.48,.75,-1.28,wood);
 disk(.2,.15,.5,.16,1.03,wood);disk(.165,.015,.5,.245,1.03,mat('#72a4af',{roughness:.2}));tube([[.55,.24,1.03],[.55,.44,1.03],[.49,.46,1.03]],.017,metal);box(.65,.12,.25,.87,.26,1.51,wood);for(const x of [.6,1.14])box(.05,.23,.05,x,.15,1.51,wood);
 for(let i=0;i<38;i++){const a=i*Math.PI*2/38;if(a<.23||a>Math.PI*2-.23)continue;const x=Math.sin(a)*2.19,z=Math.cos(a)*2.19;box(.03,.36,.03,x,.26,z,dark);tube([[x*.985,.26,z*.985],[x,.46,z],[x*1.025,.54,z*1.025]],.009,dark)}
 for(const y of [.25,.41])tube(Array.from({length:48},(_,i)=>{const a=.25+i*(Math.PI*2-.5)/47;return [Math.sin(a)*2.19,y,Math.cos(a)*2.19]}),.014,dark);
 for(let i=0;i<24;i++){const a=i*2.4,x=Math.sin(a)*2.12,z=Math.cos(a)*2.12;oval(x,.1,z,.09,.025,.065,grass);if(i%3===0){box(.015,.13,.015,x,.16,z,line);oval(x,.24,z,.06,.035,.06,mat('#c67b43'));oval(x+.01,.25,z+.02,.016,.009,.015,paperMaterial())}}
 function paperMaterial(){return mat('#eee4c6')}
 sign(group,'跑轮公园',-.85,1.01,1.59);[-1.27,-.43].forEach(x=>box(.055,1.15,.055,x,.56,1.56,wood));sign(group,'运动与饮水',1.12,.77,1.5);
 group.userData.wheels=wheels;group.userData.setRunning=(dt,active)=>{if(active)wheels.forEach((w,i)=>w.rotation.z-=dt*(i?1.8:1.3))};group.userData.footprint=Math.PI*2.26**2;return group;
}
