import * as THREE from 'three';

const palettes={silver:[0xcdd0d5,0xfffdf7],pudding:[0xd1a04e,0xfffae9],'three-line':[0x41454d,0xe2e1d9],violet:[0x77758e,0xece9f0]};
let texture;
const materials=new Map();
export function furMaterial(coat='three-line'){
  if(!Object.hasOwn(palettes,coat))coat='three-line';
  if(materials.has(coat))return materials.get(coat);
  if(!texture){texture=new THREE.TextureLoader().load('../assets/models/booth-hamster/restored/Assets/Ham/Texture/Ham.png');texture.colorSpace=THREE.SRGBColorSpace}
  const [dark,light]=palettes[coat],material=new THREE.MeshStandardMaterial({map:texture,roughness:.94});
  material.userData.hamsterFur=true;
  if(coat==='three-line'){
    material.color.setHex(0x9b9d98);
    materials.set(coat,material);return material;
  }
  material.onBeforeCompile=shader=>{
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
  material.customProgramCacheKey=()=> 'hamster-coat-v1';
  materials.set(coat,material);return material;
}

export function setHamsterCoat(rig,coat='three-line'){
  if(!Object.hasOwn(palettes,coat))coat='three-line';
  if(rig.userData.coat===coat)return;
  rig.userData.coat=coat;
  const material=furMaterial(coat);
  rig.traverse(child=>{if(child.isMesh){const replace=m=>m?.userData.hamsterFur?material:m;child.material=Array.isArray(child.material)?child.material.map(replace):replace(child.material)}});
}
