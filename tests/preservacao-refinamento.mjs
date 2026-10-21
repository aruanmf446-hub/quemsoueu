// Compara os personagens anteriores com uma cópia do src no commit de referência.
// Uso: node tests/preservacao-refinamento.mjs /tmp/atelie-refino-base
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
const ids=['feminine_soft','masculine_soft','cute_round','feminine_bold','alchemist_villain','dwarf_bard','old_king','sad_clown','orc_warrior','cactus_cowboy','pepper_king','chili_bandit','robot_ball'];
async function modules(root){const read=name=>import(pathToFileURL(resolve(root,'src',name+'.js')).href);return {head:await read('head'),body:await read('body'),look:await read('look'),clothes:await read('clothes')}}
const baseline=await modules(process.argv[2]),current=await modules(resolve(import.meta.dirname,'..'));
function fingerprint(group){const hash=createHash('sha256'),update=s=>hash.update(typeof s==='string'?s:Buffer.from(s.buffer,s.byteOffset,s.byteLength));group.traverse(m=>{
 update(m.name);update(JSON.stringify([m.position.toArray(),m.quaternion.toArray(),m.scale.toArray()]));if(!m.isMesh)return;
 for(const k of Object.keys(m.geometry.attributes).sort()){update(k);update(m.geometry.attributes[k].array)}
 if(m.geometry.index)update(m.geometry.index.array);
 for(const k of Object.keys(m.geometry.morphAttributes).sort())for(const a of m.geometry.morphAttributes[k]){update(k);update(a.array)}
 for(const mat of [m.material].flat())update(JSON.stringify([mat.name,mat.color?.getHex(),mat.roughness,mat.metalness,mat.sheen,mat.clearcoat,mat.opacity,mat.side,mat.vertexColors]));
});return hash.digest('hex')}
function capture(mod,id){const look=mod.look.defaultLook(id),head=mod.head.buildHead(id,{}, {quality:.35}),parts=[fingerprint(head.group)];let clothes,visual,body;
 if(id!=='robot_ball'){body=mod.body.buildBody(head.fit,id,{cell:.045,headScale:mod.body.headScale(id),mermaid:!!mod.clothes.OUTFITS[look.outfit]?.mermaid});clothes=mod.clothes.buildClothes(body,look);visual=mod.look.buildLook(head.fit,look);parts.push(fingerprint(clothes.group),fingerprint(visual.group));const h=createHash('sha256');h.update(Buffer.from(body.geo.attributes.position.array.buffer));parts.push(h.digest('hex'));}
 clothes?.dispose();visual?.dispose();body?.geo.dispose();head.dispose();return parts;
}
for(const id of ids){assert.deepEqual(capture(current,id),capture(baseline,id),id+': o personagem anterior mudou');console.log(id+': geometria, rig e materiais preservados')}
console.log('OK: os 13 personagens anteriores continuam idênticos à referência.');
