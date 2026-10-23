// Cena independente para miniaturas. A pele, o rig e o visual do editor nunca são tocados.
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {buildHead} from './head.js';
import {buildBody,headScale,bodyViewHeight,BODIES} from './body.js';
import {buildClothes,OUTFITS} from './clothes.js';
import {buildLook,attachLook,headOpts,defaultLook} from './look.js';
import {PRESETS} from './presets.js';
import {EXPRESSIONS} from './rig.js';
import {previewChoice} from './preview-spec.js';
import {heroStudio} from './hero-studio.js';

// Texturas procedurais de íris e tela usam canvas também fora da página.
globalThis.document={createElement:tag=>{if(tag==='canvas')return new OffscreenCanvas(1,1);throw Error('Elemento não disponível nas prévias: '+tag)}};
const canvas=new OffscreenCanvas(240,288),renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setSize(240,288,false);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=.96;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(30,240/288,.05,100),pmrem=new THREE.PMREMGenerator(renderer);
scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.35;
scene.add(new THREE.HemisphereLight(0xf2f5ff,0x9c8a84,.6));
for(const [c,i,x,y,z]of [[0xfff7f0,2.9,-2.6,3.6,6],[0xf4ecea,.65,3.5,.6,5],[0xffc0a8,.22,0,-3,4],[0xd2e2ff,1.1,4.5,2.2,-2.5],[0xffffff,.9,-3.5,2.5,-4]]){const l=new THREE.DirectionalLight(c,i);l.position.set(x,y,z);scene.add(l)}
let head,body,visual,clothes,root,headKey,bodyKey,visualKey,clothesKey;
function clear(){if(clothes)clothes.dispose();if(visual)visual.dispose();if(body){body.geo.dispose();if(body.vegSkin)body.mesh.material.dispose()}if(head)head.dispose();root?.removeFromParent();head=body=visual=clothes=null;headKey=bodyKey=visualKey=clothesKey=null}
function assemble(id,look){
  heroStudio(scene,renderer,id);
  const hk=JSON.stringify([id,headOpts(look,PRESETS[id])]);
  if(hk!==headKey){clear();head=buildHead(id,{},{quality:1,...headOpts(look,PRESETS[id])});root=new THREE.Group();root.add(head.group);scene.add(root);headKey=hk}
  const bk=JSON.stringify([id,look.build]);
  if(bk!==bodyKey){
    if(clothes){clothes.dispose();clothes.group.removeFromParent();clothes=null;clothesKey=null}
    if(body){body.mesh.removeFromParent();body.geo.dispose();if(body.vegSkin)body.mesh.material.dispose()}
    const hs=headScale(id);body=buildBody(head.fit,id,{cell:.05*Math.min(1.3,Math.max(1,BODIES[id]?.W||1)),headScale:hs,build:look.build,mermaid:!!OUTFITS[defaultLook(id).outfit]?.mermaid});
    if(body){const p=body.pivot;head.group.scale.setScalar(hs);head.group.position.set(p.x*(1-hs),p.y*(1-hs),p.z*(1-hs));const material=body.vegSkin?new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.5,clearcoat:.25,sheen:.3}):head.group.getObjectByName('Head_Skin').material;body.mesh=new THREE.Mesh(body.geo,material);root.add(body.mesh)}
    bodyKey=bk;visualKey=null;
  }
  const vk=JSON.stringify([look.hair,look.hairColor,look.acc,look.colors,bodyKey]);
  if(vk!==visualKey){if(visual){visual.group.removeFromParent();visual.dispose()}visual=buildLook(head.fit,look,body?.sdfHead);attachLook(head,visual);visualKey=vk}
  const ck=JSON.stringify([look.outfit,look.clothColors,look.pieces,look.pieceColors,bodyKey]);
  if(ck!==clothesKey){if(clothes){clothes.group.removeFromParent();clothes.dispose()}clothes=buildClothes(body,look);root.add(clothes.group);clothesKey=ck}
}
function focusHead(ears=false){
  // O mesmo personagem, visto de lado e com mais margem apenas nas miniaturas de brincos.
  const hs=body?.hs||1,pv=body?.pivot||new THREE.Vector3();
  const center=new THREE.Vector3(0,.18,0).multiplyScalar(hs).addScaledVector(pv,1-hs);
  if(ears)center.y-=.18*hs;
  const height=Math.max(2.8,(head.fit?.top||1.2)+1.6)*hs,dist=height/(2*Math.tan(THREE.MathUtils.degToRad(15)))*(ears?1.33:1.15);
  camera.position.copy(center).add(new THREE.Vector3(ears?1.25:.12,.04,1).normalize().multiplyScalar(dist));camera.lookAt(center);
}
function focusBody(){const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());const height=bodyViewHeight(head.params.id,size.y);center.y=box.min.y+height/2;const dist=Math.max(height,size.x/camera.aspect)/(2*Math.tan(THREE.MathUtils.degToRad(15)))*1.12;camera.position.copy(center).add(new THREE.Vector3(.08,.015,1).normalize().multiplyScalar(dist));camera.lookAt(center)}
onmessage=async({data})=>{
  try{
    const {id,look,frame,expression}=previewChoice(data);
    const size=data.imageSize||{width:320,height:384};
    if(size.width!==canvas.width||size.height!==canvas.height){renderer.setSize(size.width,size.height,false);camera.aspect=size.width/size.height;camera.updateProjectionMatrix()}
    assemble(id,look);head.rig?.apply(expression?EXPRESSIONS[expression]:{});root.updateMatrixWorld(true);
    if(frame==='head')focusHead(data.spec?.kind==='accessory'&&data.spec?.slot==='ears');else focusBody();
    renderer.render(scene,camera);const blob=await canvas.convertToBlob({type:'image/webp',quality:.94});postMessage({blob});
  }catch(error){postMessage({message:error.message+'\n'+error.stack})}
};
