// Referências da floresta: dados e símbolos compartilhados, reaproveitando as bases do Ateliê.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {tube,V} from './lunar.js';
export const FOREST_CHARACTERS=[
  {id:'forest_archer_f',label:'Arqueira da floresta',base:'feminine_bold',body:'feminine_bold',outfit:'forest_huntress',hair:'archer_braid',skin:'#dca582',beard:'none',acc:{ears:'studs'}},
  {id:'forest_archer_m',label:'Arqueiro da floresta',base:'masculine_soft',body:'masculine_soft',outfit:'forest_archer',hair:'forest_locks',skin:'#946044',beard:'default',acc:{}},
  {id:'forest_guard_f',label:'Guarda feminina',base:'feminine_bold',body:'feminine_bold',outfit:'forest_guard',hair:'forest_pixie',skin:'#dca582',beard:'none',acc:{}},
  {id:'forest_guard_m',label:'Guarda jovem',base:'masculine_soft',body:'masculine_soft',outfit:'forest_guard',hair:'hero_tousled',skin:'#cc9373',beard:'none',acc:{}},
  {id:'forest_guard_veteran',label:'Guarda veterano',base:'old_king',body:'old_king',outfit:'forest_guard',hair:'hero_veteran',skin:'#b47a58',beard:'default',acc:{}},
  {id:'forest_artificer',label:'Artífice da floresta',base:'masculine_soft',body:'masculine_soft',outfit:'forest_artificer',hair:'forest_locks',skin:'#946044',beard:'default',acc:{face:'monocle'}},
  {id:'forest_princess',label:'Princesa da floresta',base:'feminine_soft',body:'feminine_soft',outfit:'forest_princess',hair:'court_waves',skin:'#e9bc9c',beard:'none',acc:{head:'leaf_crown',ears:'drop',hairpin:'flowers'}}
];
export const FOREST_OUTFITS={
  forest_huntress:{label:'Arqueira da floresta',sub:'Linho franzido, corpete baixo, camadas assimétricas e couro costurado'},
  forest_archer:{label:'Arqueiro da floresta',sub:'Túnica clara, manto verde, botas, arco e aljava'},
  forest_guard:{label:'Guarda da floresta',sub:'Túnica verde, ombreiras, escudo e lança'},
  forest_artificer:{label:'Artífice da floresta',sub:'Casaca verde, mochila mecânica e frascos'},
  forest_princess:{label:'Princesa da floresta',sub:'Vestido verde, manto, folhas douradas e joias'}
};
const palette={fabric:'#405b3d',secondary:'#e1d5b7',accent:'#53673f',pants:'#2c302b',leather:'#60432d',trim:'#bc9655'};
export const FOREST_COLORS=Object.fromEntries(Object.keys(FOREST_OUTFITS).map(id=>[id,{...palette,...(id==='forest_princess'?{fabric:'#344c2c',secondary:'#e9ddc1',accent:'#607a41',leather:'#896745',trim:'#d6bc74'}:id==='forest_artificer'?{accent:'#719d32'}:{})}]));
export function leafGeo(r=.1,depth=.02){
  const s=new THREE.Shape();s.moveTo(0,-r);s.bezierCurveTo(-r*.8,-r*.25,-r*.65,r*.55,0,r);s.bezierCurveTo(r*.65,r*.55,r*.8,-r*.25,0,-r);return new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSegments:2,bevelSize:depth*.25,bevelThickness:depth*.25,curveSegments:12});
}
export function treeGeo(r=.2){
  const parts=[tube([V(0,-r,0),V(0,0,0),V(0,r*.85,0)],r*.065)];
  for(const side of [-1,1])for(let i=0;i<3;i++){
    const end=V(side*r*(.85-i*.18),r*(-.25+i*.4),0),a=V(0,-r*.65+i*r*.4,0);parts.push(tube([a,a.clone().lerp(end,.55).add(V(0,-r*.1,0)),end],r*.045));
    const leaf=leafGeo(r*.24,r*.07);leaf.rotateZ(-side*.6);leaf.translate(...end.toArray());parts.push(leaf);
  }
  const normalized=parts.map(g=>{if(g.attributes.uv)g.deleteAttribute('uv');return g.index?g.toNonIndexed():g}),geo=mergeGeometries(normalized,false);normalized.forEach(g=>g.dispose());parts.forEach(g=>g.dispose());return geo;
}
export function shieldGeo(r=1){
  const s=new THREE.Shape();s.moveTo(0,r*.8);s.lineTo(r*.48,r*.52);s.lineTo(r*.43,-r*.2);s.quadraticCurveTo(r*.3,-r*.58,0,-r*.85);s.quadraticCurveTo(-r*.3,-r*.58,-r*.43,-r*.2);s.lineTo(-r*.48,r*.52);s.closePath();return new THREE.ExtrudeGeometry(s,{depth:r*.06,bevelEnabled:true,bevelSegments:3,bevelSize:r*.035,bevelThickness:r*.025});
}
