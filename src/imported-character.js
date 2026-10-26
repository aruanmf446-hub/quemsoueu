// Catálogo de modelos preparados fora do gerador procedural. Nenhuma geração paga.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {bakeMixamoMotions} from './mixamo-motions.js';
import {restoreImportedBindPose} from './imported-bind.js';
import {MOTIONS} from './motions.js?v=mocap-1';

export const IMPORTED_CHARACTERS={
  nana_explorer:{
    url:'assets/characters/nana-explorer.glb',height:7,floor:-5.2,retarget:'mixamo-cmu-v4-hands',
    capabilities:{height:true,build:false,appearance:false,clothes:false,accessories:false,expressions:false},
    clips:Object.fromEntries(Object.entries(MOTIONS).map(([id,def])=>[id,{...def,source:'Body_'+id,description:def.description+' · adaptado ao modelo'}]))
  },
  forest_archer_f:{
    url:'assets/characters/forest-archer.glb',height:7,floor:-5.2,
    capabilities:{height:true,build:false,appearance:false,clothes:false,accessories:false,expressions:false},
    clips:{lobby:{source:'wait',label:'Esperar',description:'Animação original de espera.',loop:true},defeat:{source:'sob',label:'Tristeza',description:'Animação original de tristeza.',loop:false},dance_original:{source:'dance_04',label:'Dança original',description:'Dança incluída no modelo enviado.',loop:true}}
  }
};
const files=new Map(),adaptedClips=new Map();
export async function loadImportedCharacter(id,{baseURL=globalThis.document?.baseURI||globalThis.location?.href,animations=true}={}){
  const definition=IMPORTED_CHARACTERS[id];if(!definition)throw Error('Modelo importado não cadastrado: '+id);
  const url=new URL(definition.url,baseURL).href;
  if(!files.has(url))files.set(url,fetch(url).then(r=>{if(!r.ok)throw Error('Não foi possível carregar o modelo ('+r.status+').');return r.arrayBuffer()}).catch(e=>{files.delete(url);throw e}));
  // O buffer é compartilhado; cenas, materiais, esqueletos e estados são independentes.
  const gltf=await new GLTFLoader().parseAsync(await files.get(url),new URL('.',url).href);
  restoreImportedBindPose(gltf.scene,{rotationY:definition.bindRotationY||0});const restNodes=[];gltf.scene.traverse(o=>restNodes.push({o,p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone()}));
  const root=new THREE.Group(),group=new THREE.Group();root.name='Personagem_'+id;group.name='Modelo_Importado';root.add(group);const basis=new THREE.Group();basis.name='Orientacao_Original';basis.rotation.y=definition.rotationY||0;group.add(basis);basis.add(gltf.scene);
  const meshes=[],materials=new Set(),textures=new Set(),geometries=new Set();
  gltf.scene.traverse(o=>{if(!o.isMesh)return;meshes.push(o);o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;geometries.add(o.geometry);for(const m of [o.material].flat()){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value)}});
  root.updateMatrixWorld(true);
  const raw=new THREE.Box3().setFromObject(basis,true),size=raw.getSize(new THREE.Vector3()),factor=definition.height/size.y;
  group.scale.setScalar(factor);group.position.set(-(raw.min.x+raw.max.x)/2*factor,definition.floor-raw.min.y*factor,-(raw.min.z+raw.max.z)/2*factor);root.updateMatrixWorld(true);
  if(definition.retarget&&animations){
    const key=JSON.stringify([url,definition.retarget,definition.rotationY,definition.bindRotationY]);
    if(!adaptedClips.has(key))adaptedClips.set(key,bakeMixamoMotions(group,meshes));
    gltf.animations=adaptedClips.get(key).map(c=>c.clone());
  }
  const bounds=new THREE.Box3().setFromObject(root,true),mixer=new THREE.AnimationMixer(gltf.scene),motions={};
  for(const [key,def]of Object.entries(definition.clips)){const clip=gltf.animations.find(c=>c.name===def.source);if(clip)motions[key]={...def,duration:clip.duration,clip}}
  let active=null,playing=false,time=0,speed=1,action=null,helper=null,disposed=false;
  function rest(){mixer.stopAllAction();for(const {o,p,q,s}of restNodes){o.position.copy(p);o.quaternion.copy(q);o.scale.copy(s)}root.updateMatrixWorld(true);for(const m of meshes)if(m.isSkinnedMesh)m.skeleton.update()}
  const bodyRig={
    bounds,motions,
    play(id){const def=motions[id];if(!def)return false;rest();active=id;time=0;playing=true;action=mixer.clipAction(def.clip);action.setLoop(def.loop?THREE.LoopRepeat:THREE.LoopOnce,def.loop?Infinity:1);action.clampWhenFinished=true;action.play();mixer.update(0);return true},
    update(dt){if(active&&playing){const def=motions[active];time+=Math.max(0,dt)*speed;if(def.loop)time%=def.duration;else if(time>=def.duration){time=def.duration;playing=false}action.paused=false;mixer.update(Math.max(0,dt)*speed);if(!playing)action.paused=true}if(helper){root.updateMatrixWorld(true);helper.matrix.multiplyMatrices(root.matrixWorld.clone().invert(),gltf.scene.matrixWorld);helper.updateMatrixWorld(true)}},
    seek(t){if(!active)return false;time=THREE.MathUtils.clamp(Number(t)||0,0,motions[active].duration);action.paused=false;action.time=time;mixer.update(0);action.paused=!playing;root.updateMatrixWorld(true);return true},
    pause(){playing=false;if(action)action.paused=true},resume(){if(!active)return false;playing=true;action.paused=false;return true},
    stop(){rest();active=null;playing=false;time=0},setSpeed(n){speed=THREE.MathUtils.clamp(Number(n)||1,.1,3)},state(){return{active,playing,time,speed}},
    showSkeleton(on){if(on&&!helper){helper=new THREE.SkeletonHelper(gltf.scene);helper.matrix=new THREE.Matrix4().multiplyMatrices(root.matrixWorld.clone().invert(),gltf.scene.matrixWorld);root.add(helper)}if(helper)helper.visible=on},
    makeClips:()=>gltf.animations,
    dispose(){mixer.stopAllAction();mixer.uncacheRoot(gltf.scene);if(helper){helper.geometry.dispose();helper.material.dispose();helper.removeFromParent();helper=null}}
  };
  return {imported:true,params:{id},root,group,body:null,fit:{ySole:definition.floor},rig:{apply(){}},bodyRig,capabilities:definition.capabilities,animations:gltf.animations,
    dispose(){if(disposed)return;disposed=true;bodyRig.dispose();for(const m of meshes)if(m.isSkinnedMesh)m.skeleton.dispose();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();root.removeFromParent()}
  };
}
