// Verificação geométrica sem WebGL. Instale three@0.180.0 localmente para executar.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {clothSurface} from '../src/fabric.js';
import { buildHead } from '../src/head.js';
import { buildBody, headScale } from '../src/body.js';
import { buildClothes, defaultClothes, OUTFITS, CLOTH_SLOTS, pieceOptions } from '../src/clothes.js';
import { PRESETS } from '../src/presets.js';
// A textura procedural da íris não participa destes testes de geometria.
globalThis.document = { createElement: () => ({ getContext: () => new Proxy({}, { get: (_, key) => key === 'createLinearGradient' ? () => ({ addColorStop() {} }) : () => {} }) }) };
// A espessura do avesso não pode alterar a iluminação da face externa.
const point=(t,u)=>new THREE.Vector3(Math.sin(u*Math.PI*2)*(1+t*.2),-t,Math.cos(u*Math.PI*2)*(1+t*.2));
const thin=clothSurface(16,48,point,{closed:true,thickness:.01}),thick=clothSurface(16,48,point,{closed:true,thickness:.2});
for(let i=0;i<17*48*3;i++)assert.equal(thin.attributes.normal.array[i],thick.attributes.normal.array[i],'A barra contaminou a normal externa');
thin.dispose();thick.dispose();
for (const id of Object.keys(PRESETS)) {
  if (PRESETS[id].kind === 'robot') {
    const clothes = buildClothes(null, defaultClothes(id));
    assert.equal(clothes.group.children.length, 0); clothes.dispose(); continue;
  }
  const head = buildHead(id, {}, { quality: .35 });
  const body = buildBody(head.fit, id, { cell: .045, headScale: headScale(id), mermaid: !!OUTFITS[defaultClothes(id).outfit]?.mermaid });
  const positions = body.geo.attributes.position.array.slice();
  for (const outfit of Object.keys(OUTFITS)) {
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
  for (const slot of Object.keys(CLOTH_SLOTS)) for (const option of pieceOptions(body, slot)) {
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
  body.geo.dispose(); head.dispose(); console.log(`${id}: ${Object.keys(OUTFITS).length} conjuntos; pele preservada`);
}

await import('./cobertura.mjs');
