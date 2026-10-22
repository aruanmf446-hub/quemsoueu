// Normais reais dos penteados: costura da touca contínua, sem normais nulas.
// Opcional: node tests/qualidade-cabelo.mjs /copia/do/repositorio/antes
// A referência confirma também que posições, faces, UVs e cores não mudaram.
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {buildHead} from '../src/head.js';
import {buildHair,HAIR_STYLES} from '../src/hair.js';
globalThis.document={createElement:()=>({getContext:()=>new Proxy({},{get:(_,k)=>k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}})})};
const baseline=process.argv[2]?await import(pathToFileURL(resolve(process.argv[2],'src/hair.js'))):null;
let meshes=0,vertices=0,seams=0,changedNormals=0;
// Todos os estilos, inclusive os antigos que não são o penteado padrão de uma identidade.
const head=buildHead('feminine_soft',{}, {quality:.35});
try{
  for(const style of Object.keys(HAIR_STYLES)){
    const hair=buildHair(head.fit,style),before=baseline?.buildHair(head.fit,style);
    if(!hair)continue;
    try{
      const previous=new Map();before?.group.traverse(m=>{if(m.isMesh)previous.set(m.name,m)});
      hair.group.traverse(m=>{
        if(!m.isMesh)return;meshes++;
        const geometry=m.geometry,position=geometry.attributes.position,normal=geometry.attributes.normal;vertices+=position.count;
        assert(normal,style+'/'+m.name+': normal ausente');
        const groups=new Map();
        for(let i=0;i<position.count;i++){
          assert(Math.abs(Math.hypot(normal.getX(i),normal.getY(i),normal.getZ(i))-1)<1e-5,style+'/'+m.name+': normal inválida no vértice '+i);
          if(m.name==='Hair_Cap'){
            const key=[position.getX(i),position.getY(i),position.getZ(i)].map(v=>Math.round(v*1e6)).join(':');
            if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);
          }
        }
        for(const ids of groups.values())if(ids.length>1){
          seams++;const first=ids[0];
          for(const i of ids)assert(Math.hypot(normal.getX(i)-normal.getX(first),normal.getY(i)-normal.getY(first),normal.getZ(i)-normal.getZ(first))<1e-6,style+': costura visível na touca');
        }
        if(before){
          const old=previous.get(m.name);assert(old,style+': malha nova inesperada');
          assert.deepEqual(geometry.index?.array,old.geometry.index?.array,style+': faces alteradas');
          assert.deepEqual(Object.keys(geometry.attributes),Object.keys(old.geometry.attributes),style+': atributos alterados');
          for(const [key,attribute] of Object.entries(geometry.attributes)){
            if(['normal','tangent'].includes(key))continue;
            assert.deepEqual(attribute.array,old.geometry.attributes[key].array,style+': '+key+' alterado');
          }
          if(!normal.array.every((v,i)=>v===old.geometry.attributes.normal.array[i]))changedNormals++;
          assert.deepEqual(m.position.toArray(),old.position.toArray());
          assert.deepEqual(m.quaternion.toArray(),old.quaternion.toArray());
          assert.deepEqual(m.scale.toArray(),old.scale.toArray());
        }
      });
      console.log('OK:',style);
    }finally{hair.dispose();before?.dispose()}
  }
}finally{head.dispose()}
assert(meshes>0&&seams>0,'Nenhuma costura real foi exercitada');
if(baseline)assert(changedNormals>0,'A comparação não encontrou correção de normais');
console.log(JSON.stringify({meshes,vertices,seams,changedNormals,baseline:!!baseline}));
