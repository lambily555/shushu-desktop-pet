import * as THREE from 'three';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';

const canvas = document.querySelector('#preview');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.shadowMap.enabled = true;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 310 / 350, .01, 100);
camera.position.set(3.6, 1.8, 4.8);
camera.lookAt(0, .6, 0);
scene.add(new THREE.HemisphereLight(0xfff4e4, 0x41362f, 2.4));
const light = new THREE.DirectionalLight(0xffe7cc, 3.2); light.position.set(-3, 5, 4); scene.add(light);
const root = new THREE.Group(); scene.add(root);
let mixer;
new ColladaLoader().load('../assets/models/quadruped-rat-cc0/godot/rat.dae', data => {
  const object = data.scene;
  object.traverse(node => { if (node.isMesh || node.isSkinnedMesh) { node.castShadow = true; node.material.roughness = .95; } });
  const box = new THREE.Box3().setFromObject(object), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  const scale = 2.65 / Math.max(size.x, size.y, size.z);
  object.scale.setScalar(scale);
  object.position.set(-center.x * scale, -box.min.y * scale - .55, -center.z * scale);
  root.add(object);
  const clips = data.animations || object.animations || [];
  console.log('四足动画', clips.map(clip => clip.name).join(','));
  if (clips.length) {
    mixer = new THREE.AnimationMixer(object);
    const clip = clips.find(item => /walk-loop/i.test(item.name)) || clips[0];
    mixer.clipAction(clip).play();
  }
}, undefined, error => console.error('四足模型加载失败', error));
const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.2, 48), new THREE.MeshBasicMaterial({color:0x211812,transparent:true,opacity:.2,depthWrite:false}));
shadow.rotation.x = -Math.PI/2; shadow.scale.y=.32; shadow.position.y=-.54; scene.add(shadow);
const clock = new THREE.Clock();
function resize(){const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()}resize();
function animate(){requestAnimationFrame(animate);mixer?.update(clock.getDelta());renderer.render(scene,camera)}animate();
