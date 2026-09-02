import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const canvas = document.querySelector('#hamster3d');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(27, 1, 0.01, 100);
camera.position.set(0, 1.05, 5.4);
camera.lookAt(0, 0.78, 0);
scene.add(new THREE.HemisphereLight(0xfff6e8, 0x55483e, 2.15));
const key = new THREE.DirectionalLight(0xffead2, 3.1);
key.position.set(-3, 6, 5);
key.castShadow = true;
scene.add(key);
const rim = new THREE.DirectionalLight(0xbfd6ff, 1.25);
rim.position.set(4, 3, -4);
scene.add(rim);

const stage = new THREE.Group();
scene.add(stage);
const modelRig = new THREE.Group();
modelRig.rotation.order = 'YXZ';
stage.add(modelRig);

const texture = new THREE.TextureLoader().load('../assets/models/booth-hamster/restored/Assets/Ham/Texture/Ham.png');
texture.colorSpace = THREE.SRGBColorSpace;
texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
const bodyMaterial = new THREE.MeshStandardMaterial({ map: texture, color: 0x9b9d98, roughness: 0.94, metalness: 0 });
bodyMaterial.onBeforeCompile = shader => {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vHamWorld;')
    .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvHamWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vHamWorld;')
    .replace('vec4 diffuseColor = vec4( diffuse, opacity );', `
      float bellyLow = 1.0 - smoothstep(0.28, 1.18, vHamWorld.y);
      float bellyFront = smoothstep(-0.28, 0.34, vHamWorld.z);
      float belly = clamp(bellyLow * bellyFront, 0.0, 0.82);
      vec3 grayBack = vec3(0.56, 0.58, 0.57);
      vec3 whiteBelly = vec3(1.0, 0.98, 0.94);
      vec4 diffuseColor = vec4(mix(grayBack, whiteBelly, belly), opacity);
    `);
};
const eyeMaterial = new THREE.MeshPhysicalMaterial({ color: 0x080706, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.04 });
const whiskerMaterial = new THREE.MeshStandardMaterial({ color: 0xd8d4cc, roughness: 0.9, transparent: true, opacity: 0.78, side: THREE.DoubleSide });

let model = null;
const bones = {};
const base = new Map();
let selectedOutfit = window.__pet3dOutfit?.form === '3d' ? (window.__pet3dOutfit.outfit || 'none') : 'none';
const outfitMeshes = {};
const wantedBones = [
  'mixamorig:Hips', 'mixamorig:Spine', 'mixamorig:Spine1', 'mixamorig:Spine2',
  'mixamorig:Neck', 'mixamorig:Head', 'mixamorig:LeftArm', 'mixamorig:RightArm',
  'mixamorig:LeftForeArm', 'mixamorig:RightForeArm', 'mixamorig:LeftHand', 'mixamorig:RightHand',
  'mixamorig:LeftUpLeg', 'mixamorig:RightUpLeg', 'mixamorig:LeftLeg', 'mixamorig:RightLeg'
];

const outfitMaterials = {
  blue: new THREE.MeshStandardMaterial({ color:0x718fb7, roughness:.56, metalness:.04 }),
  blueDark: new THREE.MeshStandardMaterial({ color:0x425b83, roughness:.48, metalness:.08 }),
  green: new THREE.MeshStandardMaterial({ color:0x789765, roughness:.72, metalness:0 }),
  greenLight: new THREE.MeshStandardMaterial({ color:0xa8bc87, roughness:.76, metalness:0 }),
  yellow: new THREE.MeshStandardMaterial({ color:0xe8c979, roughness:.64, metalness:.02 }),
  purple: new THREE.MeshStandardMaterial({ color:0x9a88b5, roughness:.58, metalness:.03 }),
  cream: new THREE.MeshStandardMaterial({ color:0xfff4df, roughness:.72, metalness:0 })
};
function finishOutfit(group){
  group.visible=false;
  group.traverse(child=>{if(child.isMesh){child.castShadow=true;child.receiveShadow=true}});
  return group;
}
function makeGlasses(unit){
  const group=new THREE.Group(),ringGeometry=new THREE.TorusGeometry(unit*.118,unit*.016,10,38);
  const left=new THREE.Mesh(ringGeometry,outfitMaterials.blueDark),right=left.clone();
  left.position.x=-unit*.135;right.position.x=unit*.135;
  const bridge=new THREE.Mesh(new THREE.CylinderGeometry(unit*.012,unit*.012,unit*.075,10),outfitMaterials.blueDark);
  bridge.rotation.z=Math.PI/2;
  const leftArm=bridge.clone(),rightArm=bridge.clone();
  leftArm.position.set(-unit*.245,0,-unit*.035);rightArm.position.set(unit*.245,0,-unit*.035);
  leftArm.rotation.set(0,.62,Math.PI/2);rightArm.rotation.set(0,-.62,Math.PI/2);
  group.add(left,right,bridge,leftArm,rightArm);
  group.position.set(0,unit*.17,unit*.31);
  group.scale.setScalar(.43);
  return finishOutfit(group);
}
function makeBow(unit){
  const group=new THREE.Group();
  const wingGeometry=new THREE.SphereGeometry(unit*.12,20,14);
  wingGeometry.scale(1.35,.72,.45);
  const left=new THREE.Mesh(wingGeometry,outfitMaterials.blue),right=left.clone();
  left.position.x=-unit*.12;right.position.x=unit*.12;
  left.rotation.z=-.18;right.rotation.z=.18;
  const knot=new THREE.Mesh(new THREE.SphereGeometry(unit*.068,18,12),outfitMaterials.yellow);
  group.add(left,right,knot);
  group.position.set(0,-unit*.025,unit*.28);
  group.scale.setScalar(.4);
  return finishOutfit(group);
}
function makePartyHat(unit){
  const group=new THREE.Group();
  const cone=new THREE.Mesh(new THREE.ConeGeometry(unit*.19,unit*.52,32),outfitMaterials.purple);
  cone.position.y=unit*.26;
  const brim=new THREE.Mesh(new THREE.TorusGeometry(unit*.19,unit*.024,10,36),outfitMaterials.yellow);
  brim.rotation.x=Math.PI/2;
  const pom=new THREE.Mesh(new THREE.SphereGeometry(unit*.052,18,12),outfitMaterials.cream);
  pom.position.y=unit*.53;
  group.add(cone,brim,pom);
  group.position.set(0,unit*.22,unit*.24);
  group.rotation.z=-.07;
  group.scale.setScalar(.78);
  return finishOutfit(group);
}
function makeLeafHat(unit){
  const group=new THREE.Group();
  const shape=new THREE.Shape();
  shape.moveTo(0,-unit*.18);shape.bezierCurveTo(unit*.28,-unit*.08,unit*.3,unit*.18,0,unit*.25);
  shape.bezierCurveTo(-unit*.3,unit*.18,-unit*.28,-unit*.08,0,-unit*.18);
  const leaf=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:unit*.026,bevelEnabled:true,bevelSize:unit*.012,bevelThickness:unit*.008,bevelSegments:2}),outfitMaterials.green);
  const vein=new THREE.Mesh(new THREE.CylinderGeometry(unit*.012,unit*.012,unit*.39,9),outfitMaterials.greenLight);
  vein.rotation.z=-.12;
  vein.position.z=unit*.045;
  group.add(leaf,vein);
  group.position.set(-unit*.105,unit*.27,unit*.23);
  group.rotation.set(-.42,0,-.38);
  group.scale.setScalar(.37);
  return finishOutfit(group);
}
function attachOutfits(size){
  const head=bones['mixamorig:Head'],neck=bones['mixamorig:Neck'];
  if(!head||!neck)return;
  const unit=size.y;
  outfitMeshes.glasses=makeGlasses(unit);
  outfitMeshes.party=makePartyHat(unit);
  outfitMeshes.leaf=makeLeafHat(unit);
  outfitMeshes.bow=makeBow(unit);
  head.add(outfitMeshes.glasses,outfitMeshes.party,outfitMeshes.leaf);
  neck.add(outfitMeshes.bow);
  updateOutfitVisibility();
}
function updateOutfitVisibility(){
  for(const [name,group] of Object.entries(outfitMeshes))group.visible=name===selectedOutfit;
}
window.addEventListener('pet-outfit',event=>{
  selectedOutfit=event.detail?.form==='3d'?(event.detail.outfit||'none'):'none';
  updateOutfitVisibility();
});

new FBXLoader().load('../assets/models/booth-hamster/restored/Assets/Ham/Mesh/Ham.fbx', object => {
  model = object;
  model.traverse(child => {
    const canonicalBoneName = child.isBone && child.name.startsWith('mixamorig') && !child.name.startsWith('mixamorig:')
      ? child.name.replace(/^mixamorig/, 'mixamorig:')
      : child.name;
    if (child.isBone && wantedBones.includes(canonicalBoneName)) {
      bones[canonicalBoneName] = child;
      base.set(child, child.quaternion.clone());
    }
    if (!child.isMesh && !child.isSkinnedMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    const chooseMaterial = original => {
      const name = `${child.name} ${original?.name || ''}`.toLowerCase();
      if (name.includes('eye')) return eyeMaterial;
      if (name.includes('hige') || name.includes('whisk')) return whiskerMaterial;
      return bodyMaterial;
    };
    child.material = Array.isArray(child.material)
      ? child.material.map(chooseMaterial)
      : chooseMaterial(child.material);
  });
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = 2.55 / Math.max(size.x, size.y, size.z);
  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, -box.min.y * scale - 0.58, -center.z * scale);
  modelRig.add(model);

  // Replace the humanoid FBX T-pose with a real resting forepaw direction.
  // Work from actual joint positions instead of guessing the bones' local axes.
  model.updateMatrixWorld(true);
  const tuckShoulder = (armName, foreArmName) => {
    const arm = bones[armName];
    const foreArm = bones[foreArmName];
    if (!arm || !foreArm || !arm.parent) return;
    const shoulderModel = model.worldToLocal(arm.getWorldPosition(new THREE.Vector3()));
    const chestModel = new THREE.Vector3(
      shoulderModel.x * 0.72,
      shoulderModel.y - size.y * 0.16,
      shoulderModel.z + size.z * 0.035
    );
    const chestWorld = model.localToWorld(chestModel.clone());
    const chestParent = arm.parent.worldToLocal(chestWorld);
    const currentDirection = foreArm.position.clone().normalize().applyQuaternion(base.get(arm));
    const desiredDirection = chestParent.sub(arm.position).normalize();
    const correction = new THREE.Quaternion().setFromUnitVectors(currentDirection, desiredDirection);
    base.set(arm, correction.multiply(base.get(arm).clone()));
  };
  tuckShoulder('mixamorig:LeftArm', 'mixamorig:LeftForeArm');
  tuckShoulder('mixamorig:RightArm', 'mixamorig:RightForeArm');
  // Apply the new shoulder bases once so the elbow positions are current,
  // then aim each forearm's hand joint at a visible point on the chest.
  bones['mixamorig:LeftArm']?.quaternion.copy(base.get(bones['mixamorig:LeftArm']));
  bones['mixamorig:RightArm']?.quaternion.copy(base.get(bones['mixamorig:RightArm']));
  model.updateMatrixWorld(true);
  const tuckForearm = (foreArmName, handName) => {
    const foreArm = bones[foreArmName];
    const hand = bones[handName];
    if (!foreArm || !hand || !foreArm.parent) return;
    const elbowModel = model.worldToLocal(foreArm.getWorldPosition(new THREE.Vector3()));
    const side = Math.sign(elbowModel.x) || (foreArmName.includes('Left') ? 1 : -1);
    const pawModel = new THREE.Vector3(
      side * size.x * 0.105,
      center.y + size.y * 0.035,
      box.max.z + size.z * 0.035
    );
    const pawParent = foreArm.parent.worldToLocal(model.localToWorld(pawModel.clone()));
    const currentDirection = hand.position.clone().normalize().applyQuaternion(base.get(foreArm));
    const desiredDirection = pawParent.sub(foreArm.position).normalize();
    const correction = new THREE.Quaternion().setFromUnitVectors(currentDirection, desiredDirection);
    base.set(foreArm, correction.multiply(base.get(foreArm).clone()));
  };
  tuckForearm('mixamorig:LeftForeArm', 'mixamorig:LeftHand');
  tuckForearm('mixamorig:RightForeArm', 'mixamorig:RightHand');
  attachOutfits(size);
}, undefined, error => console.error('鼠鼠3D模型加载失败', error));

const shadow = new THREE.Mesh(
  new THREE.CircleGeometry(1.05, 64),
  new THREE.MeshBasicMaterial({ color: 0x241b17, transparent: true, opacity: 0.19, depthWrite: false })
);
shadow.rotation.x = -Math.PI / 2;
shadow.scale.y = 0.28;
shadow.position.set(0, -0.57, 0.08);
stage.add(shadow);

let state = 'idle';
let stateAt = performance.now();
let pointerX = 0;
let pointerY = 0;
let manualYaw = 0;
let manualPitch = 0;
window.addEventListener('pet-state', event => { state = event.detail; stateAt = performance.now(); });
window.addEventListener('mousemove', event => {
  pointerX = event.clientX / innerWidth - 0.5;
  pointerY = event.clientY / innerHeight - 0.5;
});
window.addEventListener('pet-rotate', event => {
  manualYaw += event.detail.dx * 0.012;
  manualPitch = THREE.MathUtils.clamp(manualPitch + event.detail.dy * 0.008, -0.45, 0.32);
});

function rotateBone(name, x = 0, y = 0, z = 0, damping = 0.18) {
  const bone = bones[name];
  if (!bone) return;
  const origin = base.get(bone);
  const target = origin.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)));
  bone.quaternion.slerp(target, damping);
}

function pose(t, phase) {
  const breathe = Math.sin(t * 2.25);
  stage.position.y = breathe * 0.012;
  const targetYaw = manualYaw;
  const targetPitch = manualPitch;
  const targetRoll = 0;
  modelRig.rotation.y += (targetYaw - modelRig.rotation.y) * 0.1;
  modelRig.rotation.x += (targetPitch - modelRig.rotation.x) * 0.1;
  modelRig.rotation.z += (targetRoll - modelRig.rotation.z) * 0.1;
  stage.rotation.z *= 0.84;
  modelRig.scale.set(1, 1 + breathe * 0.012, 1);
  let headX = -pointerY * 0.12;
  let headY = pointerX * 0.28;
  let headZ = Math.sin(t * 0.72) * 0.025;
  // The BOOTH mesh was authored from a humanoid rig whose bind pose leaves
  // both shoulders spread out.  A hamster's resting forepaws should instead
  // sit close to its chest, so use a relaxed tucked pose as the default.
  let leftArm = -0.24, rightArm = -0.24, leftLeg = 0, rightLeg = 0;
  let leftArmZ = -0.04, rightArmZ = 0.04;
  let leftArmY = 0, rightArmY = 0;
  let leftForeArm = 0, rightForeArm = 0;
  let leftForeArmY = 0, rightForeArmY = 0;
  if (state === 'typing') {
    leftArm = Math.sin(t * 22) * 0.42 - 0.3;
    rightArm = Math.sin(t * 22 + Math.PI) * 0.42 - 0.3;
    headX += 0.12;
  } else if (state === 'happy') {
    stage.position.y += Math.abs(Math.sin(phase * 8)) * 0.14;
    stage.rotation.z = Math.sin(phase * 10) * 0.065;
    leftArm = -0.72; rightArm = -0.72;
    leftArmZ = -0.18; rightArmZ = 0.18;
    leftForeArm = -0.38; rightForeArm = -0.38;
  } else if (state === 'groom') {
    leftArm = Math.sin(t * 9) * 0.35 - 0.75;
    rightArm = Math.sin(t * 9 + Math.PI) * 0.25 - 0.55;
    leftArmZ = -0.1; rightArmZ = 0.1;
    leftForeArm = leftArm * 0.72; rightForeArm = rightArm * 0.72;
    headZ += 0.12;
  } else if (state === 'feeding') {
    // Use the model's own rigged forepaws to cradle the food at the chest.
    // The small repeated lift lines up with the canvas bite pulse at the mouth.
    const chew = (Math.sin(t * 17) + 1) * 0.5;
    headX += 0.18 + chew * 0.055;
    headZ += Math.sin(t * 8.5) * 0.018;
    leftArm = -0.62 - chew * 0.06;
    rightArm = -0.62 - chew * 0.06;
    leftArmY = 0.22;
    rightArmY = -0.22;
    leftArmZ = -0.2;
    rightArmZ = 0.2;
    leftForeArm = -0.5 - chew * 0.08;
    rightForeArm = -0.5 - chew * 0.08;
    leftForeArmY = 0.2;
    rightForeArmY = -0.2;
    stage.position.y += chew * 0.018;
  } else if (state === 'look') {
    headY += Math.sin(t * 1.35) * 0.42;
    headZ += Math.sin(t * 1.8) * 0.08;
  } else if (state === 'stretch') {
    modelRig.scale.set(1.03, 1.08, 1.04);
    headX -= 0.22;
  } else if (state === 'sleep' || state === 'loafing') {
    modelRig.scale.set(1.07, 0.9, 1.07);
    headX += 0.26;
    headZ += 0.1;
  } else if (state === 'wheel') {
    const stride = Math.sin(t * 15);
    stage.position.y += Math.abs(stride) * 0.018;
    modelRig.position.x *= 0.7;
    modelRig.scale.set(1.02, 0.97, 1.02);
    leftArm = stride * 0.62 - 0.2;
    rightArm = -leftArm;
    leftLeg = -stride * 0.68 + 0.18;
    rightLeg = stride * 0.68 + 0.18;
    leftArmZ = -0.08; rightArmZ = 0.08;
    leftForeArm = leftArm * 0.55; rightForeArm = rightArm * 0.55;
    headX -= 0.08;
  }
  if (state !== 'wheel') modelRig.position.x *= 0.82;
  rotateBone('mixamorig:Head', headX, headY, headZ);
  rotateBone('mixamorig:Neck', headX * 0.35, headY * 0.32, headZ * 0.25);
  rotateBone('mixamorig:LeftArm', leftArm, leftArmY, leftArmZ);
  rotateBone('mixamorig:RightArm', rightArm, rightArmY, rightArmZ);
  rotateBone('mixamorig:LeftForeArm', leftForeArm, leftForeArmY, 0);
  rotateBone('mixamorig:RightForeArm', rightForeArm, rightForeArmY, 0);
  rotateBone('mixamorig:LeftUpLeg', leftLeg, 0, 0);
  rotateBone('mixamorig:RightUpLeg', rightLeg, 0, 0);
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas);
resize();
window.addEventListener('pet-3d-resume',()=>{resize();renderer.resetState();renderer.render(scene,camera)});
function animate(now) {
  requestAnimationFrame(animate);
  pose(now * 0.001, (now - stateAt) * 0.001);
  renderer.render(scene, camera);
}
requestAnimationFrame(animate);
