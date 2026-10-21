// Verificação geométrica sem WebGL. Instale three@0.180.0 localmente para executar.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {clothSurface,shellCloth} from '../src/fabric.js';
import { buildHead } from '../src/head.js';
import { buildBody, headScale } from '../src/body.js';
import { buildClothes, defaultClothes, OUTFITS, CLOTH_SLOTS, pieceOptions } from '../src/clothes.js';
import { defaultLook, buildLook } from '../src/look.js';
import { PRESETS } from '../src/presets.js';
// Filtro opcional para repetir somente os conjuntos alterados; a execução padrão mantém todo o catálogo.
const outfitsToTest=process.env.ATELIE_FIGURINOS?.split(',')||Object.keys(OUTFITS);
for(const id of outfitsToTest)assert(id in OUTFITS,'Figurino desconhecido: '+id);
// A textura procedural da íris não participa destes testes de geometria.
globalThis.document = { createElement: () => ({ getContext: () => new Proxy({}, { get: (_, key) => key === 'createLinearGradient' ? () => ({ addColorStop() {} }) : () => {} }) }) };
// A espessura do avesso não pode alterar a iluminação da face externa.
const point=(t,u)=>new THREE.Vector3(Math.sin(u*Math.PI*2)*(1+t*.2),-t,Math.cos(u*Math.PI*2)*(1+t*.2));
const thin=clothSurface(16,48,point,{closed:true,thickness:.01}),thick=clothSurface(16,48,point,{closed:true,thickness:.2});
for(let i=0;i<17*48*3;i++)assert.equal(thin.attributes.normal.array[i],thick.attributes.normal.array[i],'A barra contaminou a normal externa');
thin.dispose();thick.dispose();
// Aberturas recortadas depois da malhagem: a parede fina deve fechar e preservar as normais externas.
const shellA=shellCloth(new THREE.SphereGeometry(1,32,24),(x,y,z)=>y-.2,.01,3);
const shellB=shellCloth(new THREE.SphereGeometry(1,32,24),(x,y,z)=>y-.2,.15,3);
const sp=shellA.attributes.position,sn=shellA.attributes.normal,tp=shellB.attributes.position,tn=shellB.attributes.normal;
for(let i=0;i<sp.count;i++)if(sp.getX(i)===tp.getX(i)&&sp.getY(i)===tp.getY(i)&&sp.getZ(i)===tp.getZ(i)&&sp.getX(i)*sn.getX(i)+sp.getY(i)*sn.getY(i)+sp.getZ(i)*sn.getZ(i)>.85)for(let k=0;k<3;k++)assert.equal(sn.array[i*3+k],tn.array[i*3+k],'O avesso alterou a normal externa');
const geometricIds=new Map(),vertexIds=[];for(let i=0;i<sp.count;i++){const key=[sp.getX(i),sp.getY(i),sp.getZ(i)].map(v=>Math.round(v*1e6)).join(':');if(!geometricIds.has(key))geometricIds.set(key,geometricIds.size);vertexIds.push(geometricIds.get(key))}
const shellEdges=new Map(),six=shellA.index.array;for(let i=0;i<six.length;i+=3)for(let k=0;k<3;k++){const a=vertexIds[six[i+k]],b=vertexIds[six[i+(k+1)%3]];if(a===b)continue;const key=Math.min(a,b)+':'+Math.max(a,b);shellEdges.set(key,(shellEdges.get(key)||0)+1)}
assert([...shellEdges.values()].every(n=>n===2),'A casca tem uma abertura sem espessura');shellA.dispose();shellB.dispose();
for (const id of (process.env.ATELIE_PERSONAGENS?.split(',')||Object.keys(PRESETS))) {
  if (PRESETS[id].kind === 'robot') {
    const clothes = buildClothes(null, defaultClothes(id));
    assert.equal(clothes.group.children.length, 0); clothes.dispose(); continue;
  }
  const head = buildHead(id, {}, { quality: .35 });
  if(PRESETS[id].kind==='companion'){
    assert(head.group.getObjectByName('Body'));assert(head.group.getObjectByName('Rosto'));
    assert.equal(head.rig.makeClips().length,12);head.rig.apply({jaw:.5,blinkL:1});
    const look=defaultLook(id),visual=buildLook(head.fit,look);
    if(head.fit.maskGroup)assert.equal(head.fit.maskGroup.visible,true);
    visual.rebuildAcc({...look,acc:{}});assert.equal(visual.acc.group.children.length,0);
    if(head.fit.maskGroup)assert.equal(head.fit.maskGroup.visible,false,'A máscara deve sair junto do equipamento');
    visual.rebuildAcc(look);visual.setColors({metal:'#c9ccd1',fabric:'#246366'});
    visual.acc.group.traverse(m=>{if(m.isMesh&&m.material.name==='Acc_Metal')assert.equal(m.material.color.getHexString(),'c9ccd1');if(m.isMesh&&m.material.name==='Acc_Fabric')assert.equal(m.material.color.getHexString(),'246366')});
    if(PRESETS[id].species==='fennec'){
      for(const kit of ['fennec_rider','fennec_saddle',null]){
        visual.rebuildAcc({...look,acc:{head:kit}});
        assert.equal(!!visual.acc.group.getObjectByName('Cowboy_Montado'),kit==='fennec_rider','Cavaleiro deve aparecer somente na combinação');
        head.rig.apply({jaw:.6,smile:.5});const clips=head.rig.makeClips();assert.equal(clips.length,12);
        assert.equal(clips.some(c=>c.tracks.some(t=>t.name.startsWith('Cavaleiro_Bone_Jaw.'))),kit==='fennec_rider','Trilhas do cavaleiro devem acompanhar seu equipamento');
      }
    }
    visual.dispose();
    head.group.traverse(m=>{if(m.isMesh)assert(m.geometry.attributes.position.array.every(Number.isFinite))});
    head.dispose();console.log(id+': malha própria, rosto, corpo e clipes');continue;
  }
  const body = buildBody(head.fit, id, { cell: .045, headScale: headScale(id), mermaid: !!OUTFITS[defaultClothes(id).outfit]?.mermaid });
  const positions = body.geo.attributes.position.array.slice();
  for (const outfit of outfitsToTest) {
    const clothes = buildClothes(body, { ...defaultClothes(id), outfit });
    assert.equal(clothes.group.children.length === 0, outfit === 'none');
    clothes.group.traverse(mesh => {
      if (!mesh.isMesh) return;
      const g = mesh.geometry, p = g.attributes.position;
      assert(p.count > 0, `${id}/${outfit}/${mesh.name}: malha vazia`);
      assert(p.array.every(Number.isFinite), `${id}/${outfit}: coordenadas inválidas`);
      assert.equal(g.attributes.normal.count,p.count,`${id}/${outfit}: normais do avesso incompletas`);
      if(g.attributes.color)assert.equal(g.attributes.color.count,p.count);
      assert(g.attributes.normal.array.every(Number.isFinite), `${id}/${outfit}: normais inválidas`);
      assert(g.groups.length <= 2, "Listras devem usar no máximo dois grupos por peça");
      if(/Calca|Bombacha/.test(mesh.name)){
        const J=body.joints,d=J.elbow.clone().sub(J.shoulder).normalize(),bis=new THREE.Vector3(d.x,d.y-1,0).normalize();
        for(let i=0;i<p.count;i++)assert((Math.abs(p.getX(i))-J.shoulder.x)*-bis.y+(p.getY(i)-J.shoulder.y)*bis.x<.08*J.W,`${id}/${outfit}: a calça alcançou a mão`);
      }
      if (g.index) assert(g.index.array.every(v => v < p.count));
    });
    clothes.setColors({ fabric: '#246366' });
    clothes.group.traverse(mesh => {
      if (mesh.isMesh) for (const m of [mesh.material].flat()) if (m.name === 'Roupa_fabric') assert.equal(m.color.getHexString(), '246366');
    });
    clothes.dispose();
  }
  const outfit = buildClothes(body, defaultClothes(id)), latencies = [];
  for (const slot of Object.keys(CLOTH_SLOTS)) for (const option of pieceOptions(body, slot).filter(option=>option.id==='none'||outfitsToTest.includes(option.id.split(':')[0]))) {
    const other = outfit.group.children.find(g => g.name !== 'RoupaSlot_' + slot), start = performance.now();
    assert(outfit.setPiece(slot, option.id), `${id}/${option.id}: peça rejeitada`);
    latencies.push(performance.now() - start);
    if (other) assert(outfit.group.children.includes(other), 'Trocar uma peça deve preservar as outras instâncias');
    const part = outfit.group.getObjectByName('RoupaSlot_' + slot);
    if (option.id !== 'none') assert(part?.children.length > 0, `${id}/${option.id}: peça vazia`);
    outfit.setPieceColors(slot, { fabric: '#246366', accent: '#c4161f' });
  }
  outfit.dispose();
  latencies.sort((a,b)=>a-b);const p95=latencies[Math.floor(latencies.length*.95)];assert(p95<500, `${id}: troca em cache lenta (${p95} ms)`);
  console.log(`${id}: peças por slot, cores e cache (p95 ${p95.toFixed(1)} ms)`);
  assert.deepEqual(body.geo.attributes.position.array, positions, 'O figurino não pode alterar a pele');
  body.geo.dispose(); head.dispose(); console.log(`${id}: ${outfitsToTest.length} conjuntos; pele preservada`);
}

await import('./tipos-fisicos.mjs');
process.env.ATELIE_COBERTURA_TIPOS='1';
await import('./cobertura.mjs');
await import('./ajuste-roupas.mjs');
