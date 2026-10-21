// Relações entre skins: separar identidades não deve duplicar nem deformar as bases.
import assert from 'node:assert/strict';
import {PRESETS,PRESET_ORDER} from '../src/presets.js';
import {BODIES,buildBody,headScale} from '../src/body.js';
import {buildHead} from '../src/head.js';
import {defaultLook} from '../src/look.js';
const omit=p=>Object.fromEntries(Object.entries(p).filter(([k])=>!['id','label','sub'].includes(k)));
assert.deepEqual(omit(PRESETS.bread_baker),omit(PRESETS.bread_vigilante),'Padeiro e vigilante devem manter o mesmo rosto');
assert.deepEqual(BODIES.bread_baker,BODIES.bread_vigilante);
assert.notEqual(defaultLook('bread_baker').outfit,defaultLook('bread_vigilante').outfit);
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
const sizes=[];
for(const id of ['cactus_soldier','cactus_soldier_large']){
 const h=buildHead(id,{}, {quality:.3}),b=buildBody(h.fit,id,{cell:.065,headScale:headScale(id)});
 b.geo.computeBoundingBox();sizes.push(b.geo.boundingBox.max.clone().sub(b.geo.boundingBox.min));b.geo.dispose();h.dispose();
}
assert(sizes[1].y>sizes[0].y*1.1,'A malha do soldado grande deve ser mais alta');
assert(sizes[1].x>sizes[0].x*1.1,'A malha do soldado grande deve ser mais larga');
assert.equal(BODIES.cactus_soldier_large.head,BODIES.cactus_soldier.head);
for(const id of ['frontier_cowboy','desert_fennec','cowboy_on_fennec'])assert(PRESET_ORDER.includes(id));
assert.equal(defaultLook('desert_fennec').acc.head,'fennec_saddle');
assert.equal(defaultLook('cowboy_on_fennec').acc.head,'fennec_rider');
console.log('OK: identidades separadas, duas skins e dois portes de soldados.');
