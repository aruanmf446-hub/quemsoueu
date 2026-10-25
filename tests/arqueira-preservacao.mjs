// O refinamento individual não pode mudar os outros personagens ou seus movimentos.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {PRESETS,PRESET_ORDER} from '../src/presets.js';
import {BODIES,buildBody,headScale} from '../src/body.js';
import {defaultLook} from '../src/look.js';
import {buildHead} from '../src/head.js';
import {buildClothes} from '../src/clothes.js';
const base=resolve(process.argv[2]||'/tmp/arqueira-base-ffc9f80'),root=resolve(import.meta.dirname,'..');
const load=file=>import(pathToFileURL(resolve(base,'src',file)).href);
const [oldPresets,oldBody,oldLook,oldHead,oldClothes]=await Promise.all(['presets.js','body.js','look.js','head.js','clothes.js'].map(load));
for(const file of ['head.js','face-identities.js','rig.js','motions.js','mocap-player.js','mocap-data.js','character-height.js','hero-forest.js'])assert.deepEqual(readFileSync(resolve(root,'src',file)),readFileSync(resolve(base,'src',file)),file+': alteração fora do refinamento individual');
let preserved=0;for(const id of PRESET_ORDER){if(id==='forest_archer_f')continue;assert.deepEqual(PRESETS[id],oldPresets.PRESETS[id],id+': rosto alterado');assert.deepEqual(BODIES[id],oldBody.BODIES[id],id+': corpo alterado');assert.deepEqual(defaultLook(id),oldLook.defaultLook(id),id+': visual padrão alterado');preserved++}
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
function clothesHash(m){const h=createHash('sha256');m.group.traverse(o=>{if(!o.isMesh)return;for(const key of ['position','normal','color']){const a=o.geometry.attributes[key];if(a)h.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength))}if(o.geometry.index)h.update(Buffer.from(o.geometry.index.array.buffer));h.update(o.material.color.getHexString())});return h.digest('hex')}
for(const id of ['forest_archer_m','forest_guard_f']){
 const h=buildHead(id,{}, {quality:.3}),b=buildBody(h.fit,id,{cell:.065,headScale:headScale(id)}),c=buildClothes(b,defaultLook(id));
 const oh=oldHead.buildHead(id,{}, {quality:.3}),ob=oldBody.buildBody(oh.fit,id,{cell:.065,headScale:oldBody.headScale(id)}),oc=oldClothes.buildClothes(ob,oldLook.defaultLook(id));
 assert.equal(clothesHash(c),clothesHash(oc),id+': figurino de controle alterado');c.dispose();oc.dispose();b.geo.dispose();ob.geo.dispose();h.dispose();oh.dispose();
}
assert.equal(preserved,33);console.log('OK: 33 identidades/corpos/visuais preservados; dois figurinos de controle idênticos; rig e movimentos intactos.');
