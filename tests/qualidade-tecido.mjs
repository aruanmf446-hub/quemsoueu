// A espessura e o recorte não devem alterar as normais suaves da face externa.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {shellCloth} from '../src/fabric.js';

const source=new THREE.SphereGeometry(1,32,24),positions=source.attributes.position.clone(),normals=source.attributes.normal.clone();
const thin=shellCloth(source.clone(),(x,y,z)=>y-.23,.02);
const thick=shellCloth(source.clone(),(x,y,z)=>y-.23,.16);
source.dispose();
assert.deepEqual(thin.index.array,thick.index.array,'A espessura alterou a topologia');
const p=thin.attributes.position,n=thin.attributes.normal,tp=thick.attributes.position,tn=thick.attributes.normal;
let checked=0,nearCut=0;
for(let i=0;i<positions.count;i++){
  if(positions.getY(i)>.23)continue;
  // A primeira ocorrência é a face externa; as paredes têm cópias próprias desses vértices.
  let found=-1;
  for(let j=0;j<p.count;j++)if(p.getX(j)===positions.getX(i)&&p.getY(j)===positions.getY(i)&&p.getZ(j)===positions.getZ(i)){found=j;break;}
  if(found<0)continue; // Polos não referenciados não fazem parte da malha de origem.
  const actual=new THREE.Vector3().fromBufferAttribute(n,found),expected=new THREE.Vector3().fromBufferAttribute(normals,i);
  assert(actual.distanceTo(expected)<2e-6,'O recorte alterou a normal suave da esfera');
  assert.equal(tp.getX(found),p.getX(found));assert.equal(tp.getY(found),p.getY(found));assert.equal(tp.getZ(found),p.getZ(found));
  assert(new THREE.Vector3().fromBufferAttribute(tn,found).distanceTo(actual)<2e-6,'A espessura alterou o sombreado externo');
  checked++;if(positions.getY(i)>.1)nearCut++;
}
assert(checked>200&&nearCut>20,'A região próxima ao recorte não foi verificada');
for(const geometry of [thin,thick]){
  for(const attribute of ['position','normal'])assert(geometry.attributes[attribute].array.every(Number.isFinite),'Atributo inválido: '+attribute);
  for(let i=0;i<geometry.attributes.normal.count;i++)assert(Math.abs(new THREE.Vector3().fromBufferAttribute(geometry.attributes.normal,i).length()-1)<2e-6,'Normal sem comprimento unitário');
  geometry.dispose();
}
console.log('OK: '+checked+' normais externas preservadas; '+nearCut+' junto ao recorte, duas espessuras e paredes válidas.');
