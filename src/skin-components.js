// Componentes desconectados de um mesmo mesh (fivelas, botas, cajados, bolsas).
// Solda apenas para descobrir a conectividade; não altera a geometria/UVs de autoria.
import * as THREE from 'three';
export function componentBindings(geometry,matrix,classify){
 const p=geometry.attributes.position,n=p.count,parent=Int32Array.from({length:n},(_,i)=>i),point=new THREE.Vector3(),weld=new Map();
 const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i]}return i},join=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent[b]=a};
 for(let i=0;i<n;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e5)).join(':');if(weld.has(key))join(i,weld.get(key));else weld.set(key,i)}
 const index=geometry.index;
 for(let i=0;i<(index?.count??n);i+=3){const a=index?index.getX(i):i,b=index?index.getX(i+1):i+1,c=index?index.getX(i+2):i+2;join(a,b);join(a,c)}
 const groups=new Map();
 for(let i=0;i<n;i++){
  const id=find(i);parent[i]=id;let g=groups.get(id);if(!g){g={center:new THREE.Vector3(),min:new THREE.Vector3(Infinity,Infinity,Infinity),max:new THREE.Vector3(-Infinity,-Infinity,-Infinity),count:0};groups.set(id,g)}
  point.fromBufferAttribute(p,i).applyMatrix4(matrix);g.center.add(point);g.min.min(point);g.max.max(point);g.count++;
 }
 const bindings=new Map();for(const [id,g]of groups){g.center.multiplyScalar(1/g.count);g.size=g.max.clone().sub(g.min);const binding=classify(g);if(binding)bindings.set(id,binding)}
 return i=>bindings.get(parent[i])||null;
}
