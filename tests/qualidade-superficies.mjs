// A projeção deve preservar cada canto dos triângulos e os UVs das cores/estampas.
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {heroSurface} from '../src/hero-material.js';
const rim=new THREE.BufferGeometry();rim.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));rim.setAttribute('normal',new THREE.Float32BufferAttribute([1,0,0,1,0,0,1,0,0],3));rim.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,0,1],2));rim.setIndex([0,1,2]);
for(const geometry of [new THREE.BoxGeometry(1,2,1,2,2,2),new THREE.SphereGeometry(1,32,24),new THREE.TorusGeometry(1,.25,16,32),rim]){
  const before=geometry.toNonIndexed(),material=new THREE.MeshPhysicalMaterial();
  heroSurface(geometry,material,'fabric');
  const after=geometry.toNonIndexed();
  for(const name of ['position','normal','uv'])assert.deepEqual(after.attributes[name].array,before.attributes[name].array,'A textura alterou '+name);
  assert.equal(geometry.attributes.uv1.count,geometry.attributes.position.count);
  const p=geometry.attributes.position,uv=geometry.attributes.uv1,ix=geometry.index;
  for(let t=0;t<ix.count;t+=3){
    const [a,b,c]=[0,1,2].map(k=>ix.getX(t+k)),pa=new THREE.Vector3().fromBufferAttribute(p,a),pb=new THREE.Vector3().fromBufferAttribute(p,b),pc=new THREE.Vector3().fromBufferAttribute(p,c);
    if(pb.sub(pa).cross(pc.sub(pa)).lengthSq()<1e-16)continue;
    const area=(uv.getX(b)-uv.getX(a))*(uv.getY(c)-uv.getY(a))-(uv.getY(b)-uv.getY(a))*(uv.getX(c)-uv.getX(a));
    assert(Math.abs(area)>1e-10,'Projeção colapsou um triângulo de textura');
  }
  for(const map of [material.normalMap,material.roughnessMap]){
    assert.equal(map.channel,1);assert.equal(map.image.width,512);assert.equal(map.minFilter,THREE.LinearMipmapLinearFilter);assert(map.generateMipmaps);
    assert.equal(map.colorSpace,THREE.NoColorSpace);
  }
  const count=p.count;heroSurface(geometry,material,'fabric');assert.equal(geometry.attributes.position.count,count,'Preparação duplicou a geometria no cache');
  before.dispose();after.dispose();geometry.dispose();material.dispose();
}
// Materiais distintos precisam de mapas distintos; instâncias do mesmo material compartilham os mapas.
const geometry=new THREE.BoxGeometry(),materials=[];
for(const kind of ['fabric','leather','metal','polymer','fur']){const m=new THREE.MeshPhysicalMaterial();heroSurface(geometry,m,kind);materials.push(m)}
assert.equal(new Set(materials.map(m=>m.normalMap)).size,5);
const other=new THREE.MeshPhysicalMaterial();heroSurface(geometry,other,'fabric');assert.equal(other.normalMap,materials[0].normalMap);
for(const material of materials){
  const {data,width:n}=material.normalMap.image;
  // Uma emenda do tile não pode ser um salto maior que o microdetalhe no interior.
  for(const vertical of [false,true]){
    let seam=0,inside=0;
    for(let y=0;y<n;y++)for(let x=0;x<n;x++)for(let c=0;c<2;c++){
      const a=(y*n+x)*4+c,b=vertical?(((y+1)%n)*n+x)*4+c:(y*n+(x+1)%n)*4+c,d=Math.abs(data[a]-data[b]);
      if((vertical?y:x)===n-1)seam=Math.max(seam,d);else inside=Math.max(inside,d);
    }
    assert(seam<=inside+2,material.normalMap.name+': costura descontínua');
  }
}
console.log('OK: triângulos, normais e UVs de cor preservados; 5 superfícies PBR periódicas, UV independente e cache compartilhado.');
