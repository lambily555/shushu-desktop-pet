import * as THREE from 'three';

export function createPlazaStatue(){
 const statue=new THREE.Group();statue.name='鼠鼠守护神像';
 const bronze=new THREE.MeshStandardMaterial({color:0xb58b4e,metalness:.78,roughness:.34});
 const gold=new THREE.MeshStandardMaterial({color:0xe3bc6f,metalness:.8,roughness:.27});
 const recess=new THREE.MeshStandardMaterial({color:0x514334,metalness:.6,roughness:.48});
 const stone=new THREE.MeshStandardMaterial({color:0xe0d4b9,roughness:.78});
 const glow=new THREE.MeshStandardMaterial({color:0xffdb8d,metalness:.4,roughness:.3,emissive:0xffb84c,emissiveIntensity:.22});
 const mesh=(geometry,material,x,y,z)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;statue.add(m);return m};
 const oval=(x,y,z,sx,sy,sz,material=bronze)=>{const m=mesh(new THREE.SphereGeometry(1,32,24),material,x,y,z);m.scale.set(sx,sy,sz);return m};
 const tube=(points,r,material=gold)=>mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),20,r,8,false),material,0,0,0);
 // A stepped stone plinth and engraved sunburst support the figure above the water.
 for(const [r,h,y,m] of [[.49,.12,.32,stone],[.43,.055,.408,gold],[.37,.15,.51,stone],[.39,.035,.602,gold]])mesh(new THREE.CylinderGeometry(r,r,h,64),m,0,y,0);
 for(let i=0;i<16;i++){const a=i*Math.PI/8;oval(Math.sin(a)*.375,.51,Math.cos(a)*.375,.015,.05,.015,gold)}
 oval(0,1.01,0,.32,.43,.245);oval(0,1.06,.207,.2,.3,.055,gold);
 for(const side of [-1,1]){
  oval(side*.18,.646,.115,.125,.063,.17);for(let i=0;i<3;i++)tube([[side*.18+(i-1)*.035,.65,.24],[side*.18+(i-1)*.035,.667,.27]],.008,recess);
 }
 oval(0,1.47,.035,.32,.295,.265);
 for(const side of [-1,1]){
  oval(side*.25,1.695,.015,.137,.155,.077);oval(side*.25,1.706,.079,.084,.102,.019,gold);oval(side*.25,1.711,.091,.05,.065,.009,recess);
  oval(side*.215,1.395,.199,.14,.135,.109);oval(side*.122,1.526,.263,.057,.073,.022,recess);oval(side*.119,1.54,.284,.019,.025,.008,gold);
  oval(side*.063,1.39,.296,.073,.061,.043,gold);
  tube([[side*.06,1.355,.302],[side*.105,1.345,.283],[side*.14,1.369,.272]],.009,recess);
  for(let i=0;i<3;i++)tube([[side*.125,1.394-i*.016,.277],[side*.24,1.402+(i-1)*.027,.292],[side*.36,1.412+(i-1)*.049,.262]],.006,gold);
  const arm=oval(side*.23,1.028,.205,.094,.205,.095);arm.rotation.z=side*.5;
  oval(side*.124,.947,.35,.071,.068,.072,gold);
 }
 oval(0,1.423,.335,.047,.03,.023,recess);tube([[0,1.4,.336],[0,1.363,.337]],.009,recess);
 // A seed held between the paws and a restrained radiant nimbus identify the guardian.
 const seed=oval(0,1.037,.354,.086,.135,.065,gold);seed.rotation.z=-.15;tube([[0,.922,.411],[-.013,1.025,.423],[.005,1.151,.398]],.007,recess);
 tube([[-.23,1.25,.14],[0,1.175,.263],[.23,1.25,.14]],.025,gold);
 oval(0,1.171,.278,.044,.055,.017,glow);
 const halo=mesh(new THREE.TorusGeometry(.49,.018,10,96),gold,0,1.53,-.205);halo.name='Sun halo';
 mesh(new THREE.TorusGeometry(.53,.006,6,96),glow,0,1.53,-.205);
 for(let i=0;i<15;i++){const a=-Math.PI*.35+i*Math.PI*1.7/14,inner=.565,outer=i%2?.61:.665;tube([[Math.cos(a)*inner,1.53+Math.sin(a)*inner,-.205],[Math.cos(a)*outer,1.53+Math.sin(a)*outer,-.205]],.009,gold)}
 // Three-quarter warm key and rear rim light model the face without extra shadow maps.
 const target=new THREE.Object3D();target.position.set(0,1.3,.1);statue.add(target);
 const key=new THREE.SpotLight(0xffdc9a,13,7,.43,.65,2);key.position.set(-1.45,3.15,2);key.target=target;statue.add(key);
 const rim=new THREE.SpotLight(0xffc571,9,5,.48,.75,2);rim.position.set(1.15,2.35,-1.35);rim.target=target;statue.add(rim);
 statue.userData.lights=[key,rim];return statue;
}
