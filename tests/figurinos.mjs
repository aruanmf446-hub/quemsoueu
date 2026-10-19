// Verificação geométrica sem WebGL. Instale three@0.180.0 localmente para executar.
import assert from 'node:assert/strict';
import { buildHead } from '../src/head.js';
import { buildBody, headScale } from '../src/body.js';
import { buildClothes, defaultClothes, OUTFITS } from '../src/clothes.js';
import { PRESETS } from '../src/presets.js';
// A textura procedural da íris não participa destes testes de geometria.
globalThis.document = { createElement: () => ({ getContext: () => new Proxy({}, { get: (_, key) => key === 'createLinearGradient' ? () => ({ addColorStop() {} }) : () => {} }) }) };
for (const id of Object.keys(PRESETS)) {
  if (PRESETS[id].kind === 'robot') {
    const clothes = buildClothes(null, defaultClothes(id));
    assert.equal(clothes.group.children.length, 0); clothes.dispose(); continue;
  }
  const head = buildHead(id, {}, { quality: .35 });
  const body = buildBody(head.fit, id, { cell: .045, headScale: headScale(id) });
  const positions = body.geo.attributes.position.array.slice();
  for (const outfit of Object.keys(OUTFITS)) {
    const clothes = buildClothes(body, { ...defaultClothes(id), outfit });
    assert.equal(clothes.group.children.length === 0, outfit === 'none');
    clothes.group.traverse(mesh => {
      if (!mesh.isMesh) return;
      const g = mesh.geometry, p = g.attributes.position;
      assert(p.count > 0, `${id}/${outfit}/${mesh.name}: malha vazia`);
      assert(p.array.every(Number.isFinite), `${id}/${outfit}: coordenadas inválidas`);
      assert(g.attributes.normal.array.every(Number.isFinite), `${id}/${outfit}: normais inválidas`);
      assert(g.groups.length <= 2, "Listras devem usar no máximo dois grupos por peça");
      if (g.index) assert(g.index.array.every(v => v < p.count));
    });
    clothes.setColors({ fabric: '#246366' });
    clothes.group.traverse(mesh => {
      if (mesh.isMesh) for (const m of [mesh.material].flat()) if (m.name === 'Roupa_fabric') assert.equal(m.color.getHexString(), '246366');
    });
    clothes.dispose();
  }
  assert.deepEqual(body.geo.attributes.position.array, positions, 'O figurino não pode alterar a pele');
  body.geo.dispose(); head.dispose(); console.log(`${id}: 8 opções, cores e pele preservada`);
}
