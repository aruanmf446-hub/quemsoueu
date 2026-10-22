// Luz de apresentação dos novos personagens; o estúdio dos treze modelos anteriores é preservado.
import * as THREE from 'three';
const original=new Set(['feminine_soft','masculine_soft','old_king','cute_round','feminine_bold','alchemist_villain','dwarf_bard','sad_clown','orc_warrior','cactus_cowboy','pepper_king','chili_bandit','robot_ball']);
const settings=new WeakMap();
export function heroStudio(scene,renderer,id){
  let state=settings.get(scene);
  if(!state){
    const lights=scene.children.filter(x=>x.isLight);
    state={background:scene.background,environmentIntensity:scene.environmentIntensity,lights:lights.map(l=>({l,intensity:l.intensity,position:l.position.clone(),color:l.color.clone(),radius:l.shadow?.radius,normalBias:l.shadow?.normalBias}))};settings.set(scene,state);
  }
  const active=!original.has(id);
  scene.background=active?new THREE.Color('#aaa5a2'):state.background;
  scene.environmentIntensity=active?.42:state.environmentIntensity;
  const strengths=[.34,3.35,.35,.09,1.25,.60];
  for(let i=0;i<state.lights.length;i++){
    const s=state.lights[i];s.l.intensity=active?(strengths[i]??s.intensity):s.intensity;
    s.l.position.copy(active&&i===1?new THREE.Vector3(-3.8,4.8,4.4):s.position);
    if(s.l.shadow){s.l.shadow.radius=active?5:s.radius;s.l.shadow.normalBias=active?.012:s.normalBias;s.l.shadow.needsUpdate=true}
  }
}
