import * as THREE from 'three';

const palettes={silver:[0xcdd0d5,0xfffdf7],pudding:[0xd1a04e,0xfffae9],'three-line':[0x41454d,0xe2e1d9],violet:[0x77758e,0xece9f0]};
let texture;
const materials=new Map();
export function furMaterial(coat='three-line',age=0){
  if(!Object.hasOwn(palettes,coat))coat='three-line';
  const loss=Math.round(Math.max(0,Math.min(1,(age-1.5)/1.5))*20)/20,key=coat+':'+loss;if(materials.has(key))return materials.get(key);
  if(!texture){texture=new THREE.TextureLoader().load('../assets/models/booth-hamster/restored/Assets/Ham/Texture/Ham.png');texture.colorSpace=THREE.SRGBColorSpace}
  const [dark,light]=palettes[coat],material=new THREE.MeshStandardMaterial({map:texture,roughness:.94});
  material.userData.hamsterFur=true;
  if(coat==='three-line')material.color.setHex(0x9b9d98);
  if(coat==='three-line'&&!loss){
    materials.set(key,material);return material;
  }
  if(coat!=='three-line')material.onBeforeCompile=shader=>{
    shader.uniforms.coatDark={value:new THREE.Color(dark)};shader.uniforms.coatLight={value:new THREE.Color(light)};
    shader.fragmentShader='uniform vec3 coatDark;\nuniform vec3 coatLight;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',THREE.ShaderChunk.map_fragment.replace('diffuseColor *= sampledDiffuseColor;',`
      // Keep the texture's pink skin and dark facial details; recolor only neutral fur.
      float furLight=dot(sampledDiffuseColor.rgb,vec3(0.2126,0.7152,0.0722));
      float skin=smoothstep(0.015,0.055,sampledDiffuseColor.r-sampledDiffuseColor.g);
      float furMask=(1.0-skin)*smoothstep(0.015,0.055,furLight);
      vec3 coat=mix(coatDark,coatLight,clamp(furLight/0.78,0.0,1.0));
      sampledDiffuseColor.rgb=mix(sampledDiffuseColor.rgb,coat,furMask);
      diffuseColor *= sampledDiffuseColor;
    `));
  };
  if(loss){const recolor=material.onBeforeCompile;material.onBeforeCompile=shader=>{recolor(shader);shader.vertexShader='varying vec3 furSurface;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfurSurface=normalize(position+vec3(0.0001));');shader.fragmentShader='varying vec3 furSurface;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float sparse=sin(furSurface.x*17.0)*sin(furSurface.y*13.0)+0.25*sin(furSurface.z*19.0+furSurface.y*11.0);
      float furPatch=smoothstep(1.1-${loss.toFixed(2)}*1.25,1.3-${loss.toFixed(2)}*.7,sparse);
      float neutral=1.0-smoothstep(.015,.055,texture2D(map,vMapUv).r-texture2D(map,vMapUv).g);
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.48,.32,.28),furPatch*neutral*${(loss*.24).toFixed(3)});
    `)};}
  material.customProgramCacheKey=()=> 'hamster-coat-v2-'+key;
  materials.set(key,material);return material;
}

export function setHamsterCoat(rig,coat='three-line',age=0){
  if(!Object.hasOwn(palettes,coat))coat='three-line';
  const ageStep=Math.round(Math.max(0,Math.min(1,(age-1.5)/1.5))*20);if(rig.userData.coat===coat&&rig.userData.furStep===ageStep)return;rig.userData.furStep=ageStep;rig.userData.furAge=age;
  rig.userData.coat=coat;
  const material=furMaterial(coat,age);
  rig.traverse(child=>{if(child.isMesh){const replace=m=>m?.userData.hamsterFur?material:m;child.material=Array.isArray(child.material)?child.material.map(replace):replace(child.material)}});
}
