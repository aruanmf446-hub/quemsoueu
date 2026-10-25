// A troca rápida deve manter exatamente os vínculos e as poses do cálculo frio.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildHead} from '../src/head.js';
import {buildBody,headScale} from '../src/body.js';
import {buildClothes} from '../src/clothes.js';
import {buildBodyRig} from '../src/body-rig.js';
import {defaultLook,headOpts} from '../src/look.js';
import {PRESETS} from '../src/presets.js';
import {createHash} from 'node:crypto';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
const id='forest_archer_f',look=defaultLook(id),head=buildHead(id,{}, {quality:.3,...headOpts(look,PRESETS[id])}),scale=headScale(id),body=buildBody(head.fit,id,{cell:.065,headScale:scale});
head.root=new THREE.Group();head.group.scale.setScalar(scale);head.group.position.copy(body.pivot).multiplyScalar(1-scale);head.root.add(head.group);head.body={...body,mesh:new THREE.Mesh(body.geo,head.group.getObjectByName('Head_Skin').material)};head.body.mesh.name='Body';head.root.add(head.body.mesh);const clothes=buildClothes(head.body,look);head.root.add(clothes.group);
let rig;
const hash=a=>createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const capture=()=>rig.meshes.map(m=>({name:m.name,key:[m.name,m.userData.slot,m.userData.channel].join('|'),indices:hash(m.geometry.attributes.skinIndex.array),weights:hash(m.geometry.attributes.skinWeight.array),faces:hash(m.geometry.index?.array||new Uint32Array()),faceCount:m.geometry.index?.count||0,points:[0,Math.floor(m.geometry.attributes.position.count/2),m.geometry.attributes.position.count-1].map(i=>m.getVertexPosition(i,new THREE.Vector3()).toArray())})).sort((a,b)=>a.key.localeCompare(b.key));
try{
 rig=buildBodyRig(head,clothes);rig.play('victory');rig.seek(1.3);const cold=capture();rig.dispose();
 rig=buildBodyRig(head,clothes);rig.play('victory');rig.seek(1.3);assert.deepEqual(capture(),cold,'O cache alterou pesos, índices ou a pose');rig.dispose();
 const upper=clothes.selection.upper;clothes.setPiece('upper','none');rig=buildBodyRig(head,clothes);assert(rig.meshes.find(m=>m.name==='Body').geometry.index.count>cold.find(m=>m.name==='Body').faceCount,'A pele não voltou após retirar a blusa');rig.dispose();
 clothes.setPiece('upper',upper);rig=buildBodyRig(head,clothes);rig.play('victory');rig.seek(1.3);assert.deepEqual(capture(),cold,'O cache misturou a pele coberta com o corpo sem blusa');
 console.log('OK: cache frio/quente idênticos em '+cold.length+' malhas; pose e recuperação da pele preservadas.');
}finally{rig?.dispose();clothes.dispose();body.geo.dispose();head.dispose()}
