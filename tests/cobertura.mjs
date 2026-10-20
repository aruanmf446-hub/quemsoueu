// Consulta a malha real: cada vértice coberto deve encontrar tecido à frente da pele.
// Conta a primeira face de SAÍDA do tecido no raio (paredes internas de peças em camadas, como o avesso de
// uma saia por dentro da bombacha, não escondem nem expõem a pele).
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildHead} from '../src/head.js';
import {buildBody,headScale,BODIES} from '../src/body.js';
import {buildClothes,defaultClothes,OUTFITS} from '../src/clothes.js';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
const V=()=>new THREE.Vector3();
// Árvore espacial usada somente nos testes; não acrescenta dependências ao aplicativo.
function tree(g){
 const p=g.attributes.position,ix=g.index?.array,tri=[];
 for(let i=0;i<(ix?.length||p.count);i+=3){const v=[0,1,2].map(k=>V().fromBufferAttribute(p,ix?ix[i+k]:i+k));const box=new THREE.Box3().setFromPoints(v);tri.push({v,box,c:box.getCenter(V())})}
 function branch(items){const box=new THREE.Box3();items.forEach(t=>box.union(t.box));if(items.length<16)return{box,items};const size=box.getSize(V()),axis=size.x>size.y&&size.x>size.z?'x':size.y>size.z?'y':'z';items.sort((a,b)=>a.c[axis]-b.c[axis]);const mid=items.length>>1;return{box,left:branch(items.slice(0,mid)),right:branch(items.slice(mid))}}
 return branch(tri);
}
function first(root,ray){let best=Infinity,orientation=0;const hit=V(),ab=V(),ac=V();
 function visit(n){if(!ray.intersectBox(n.box,hit))return;if(n.items){for(const t of n.items){if(ray.intersectTriangle(...t.v,false,hit)){const d=hit.distanceTo(ray.origin),o=ab.subVectors(t.v[1],t.v[0]).cross(ac.subVectors(t.v[2],t.v[0])).dot(ray.direction);if(d<best&&o>0&&d>.001){best=d;orientation=o}}}}else{visit(n.left);visit(n.right)}}visit(root);return{distance:best,orientation};}
const defaultIds=process.env.ATELIE_PERSONAGENS?.split(',')||['cute_round','cactus_cowboy','chili_bandit','masculine_soft','sad_clown','dwarf_bard','alchemist_villain'];
export function checkCoverage(ids=defaultIds,builds=[{weight:0,muscle:0}]){
for(const id of ids)for(const build of builds){const h=buildHead(id,{}, {quality:.35}),look=defaultClothes(id),b=buildBody(h.fit,id,{cell:.045,headScale:headScale(id),build,mermaid:!!OUTFITS[look.outfit]?.mermaid}),c=buildClothes(b,look),meshes=[];
 c.group.updateMatrixWorld(true);c.group.traverse(m=>{if(m.isMesh&&m.parent.name==='RoupaSlot_lower'&&!m.material.transparent&&!/Detalhes|Dobra|Nadadeira/.test(m.name))meshes.push(tree(m.geometry))});
 assert(meshes.length,`${id}: peça inferior ausente`);
 // A pele pode estar coberta pela calça ou pela peça de cima (túnica, colete, jaleco) que desce sobre o quadril.
 c.group.traverse(m=>{if(m.isMesh&&!m.material.transparent&&['RoupaSlot_upper','RoupaSlot_belt','RoupaSlot_feet','RoupaSlot_extras'].includes(m.parent.name))meshes.push(tree(m.geometry))});
 const p=b.geo.attributes.position,n=b.geo.attributes.normal,J=b.joints;let checked=0,min=Infinity;const misses=[];
 const mermaid=!!OUTFITS[look.outfit]?.mermaid,royal=look.outfit==='royal',orc=look.outfit==='orc';
 const top=J.Y(mermaid?.405:orc?.46:id==='sad_clown'?.42:id==='dwarf_bard'?.36:id==='masculine_soft'?.42:.41),bottom=mermaid?J.Y(.50):orc?J.Y(.55):J.ankle.y+(royal?.12:id==='masculine_soft'?.27:id==='dwarf_bard'?.21:id==='sad_clown'?.1:.015)*J.Lb+.04;
 for(let i=0;i<p.count;i++){
 const y=p.getY(i),ax=Math.abs(p.getX(i)),f=(J.yNeck-y)/J.Lb;
 const torso=!orc&&f>(mermaid?.14:.12)&&f<(mermaid?.185:.28)&&ax<.65*J.W;
 const upper=J.elbow.clone().sub(J.shoulder),point=V().set(ax,y,p.getZ(i)).sub(J.shoulder),t=point.dot(upper)/upper.lengthSq();
 const sleeve=!orc&&!mermaid&&ax>J.shoulder.x&&t>.30&&t<.48&&point.addScaledVector(upper,-t).length()<.7*J.W;
 if(!torso&&!sleeve&&(y>top||y<bottom||ax>J.W*(b.proportions.hip+.28)))continue;
 // O saiote do orc tem vãos intencionais entre as tiras; ali a pele é descoberta, não atravessa tecido.
 if(orc&&y<J.Y(.42)){const ph=(Math.atan2(p.getX(i),p.getZ(i)-J.zCenter)+Math.PI*2)%(Math.PI*2),edge=ph%(Math.PI*2/13);if(edge<.06||edge>Math.PI*2/13-.06)continue}
 // contato entre as coxas (pele na linha do meio, normal apontando para a outra perna): ocluída pela própria perna
 if(p.getY(i)<J.hip.y&&Math.abs(p.getX(i))<.55*J.hip.x&&Math.abs(n.getX(i))>.55&&(n.getX(i)*p.getX(i)<0||Math.abs(p.getX(i))<.02))continue;
 const origin=V().fromBufferAttribute(p,i),dir=V().fromBufferAttribute(n,i).normalize(),hits=meshes.map(t=>first(t,new THREE.Ray(origin,dir))).filter(h=>Number.isFinite(h.distance)).sort((a,b)=>a.distance-b.distance),hit=hits[0];checked++;
 const ok=h=>h&&h.distance>.001&&h.orientation>0;
 // raio exatamente no plano de uma borda (cano da bota, barra) passa rente às duas peças: confere logo acima e abaixo
 const near=ok(hit)?hit:[-.012,.012].map(dy=>meshes.map(t=>first(t,new THREE.Ray(origin.clone().add(new THREE.Vector3(0,dy,0)),dir))).filter(h=>Number.isFinite(h.distance)).sort((a,b)=>a.distance-b.distance)[0]).find(ok);
 const radial=orc&&!near?meshes.map(t=>first(t,new THREE.Ray(origin,V().set(origin.x,0,origin.z-J.zCenter).normalize()))).filter(ok).sort((a,b)=>a.distance-b.distance)[0]:null;
 if(!near&&!radial)misses.push(i);else min=Math.min(min,(near||radial).distance);
 }


 console.log(id,build,{vertices:checked,folgaMinima:min,falhas:misses.length});assert.equal(misses.length,0,`${id}: pele sem cobertura nos vértices ${misses.slice(0,12)}`);c.dispose();b.geo.dispose();h.dispose();}

}
if(process.env.ATELIE_COBERTURA_TIPOS)checkCoverage(process.env.ATELIE_PERSONAGENS?.split(',')||Object.keys(BODIES),[{weight:-1,muscle:0},{weight:1,muscle:0},{weight:0,muscle:1}]);else checkCoverage();
