// Superfícies PBR procedurais compartilhadas: relevo e rugosidade exportáveis, sem imagens externas.
import * as THREE from 'three';
const textures=new Map(),prepared=new WeakSet(),SIZE=512;
const wrap=(x,n)=>(x%n+n)%n,fract=x=>x-Math.floor(x);
const hash=(x,y)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453);
function noise(x,y,cells,rows=cells){
  const ix=Math.floor(x),iy=Math.floor(y),fx=fract(x),fy=fract(y),u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
  const h=(a,b)=>hash(wrap(a,cells),wrap(b,rows));
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(h(ix,iy),h(ix+1,iy),u),THREE.MathUtils.lerp(h(ix,iy+1),h(ix+1,iy+1),u),v);
}
function maps(kind){
  if(textures.has(kind))return textures.get(kind);
  const height=new Float32Array(SIZE*SIZE),normal=new Uint8Array(SIZE*SIZE*4),rough=new Uint8Array(SIZE*SIZE*4);
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
    const u=x/SIZE,v=y/SIZE,grain=noise(u*32,v*32,32),fine=noise(u*128,v*128,128);
    // Todas as frequências fecham no tile; o grão é contínuo, sem degraus aleatórios por pixel.
    height[y*SIZE+x]=kind==='fabric'?.32*Math.sin(u*Math.PI*64)*Math.sin(v*Math.PI*64)+.055*(grain-.5):kind==='metal'?.07*noise(u*8,v*128,8,128)+.025*(grain-.5):kind==='polymer'?.025*(fine-.5):kind==='fur'?.12*noise(u*64,v*8,64,8):.24*(grain-.5)+.065*(fine-.5);
    const r=kind==='fabric'?.94+.06*grain:kind==='metal'?.87+.13*grain:.89+.11*grain,k=(y*SIZE+x)*4;
    rough.set([255,Math.round(r*255),255,255],k);
  }
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
    const dx=height[y*SIZE+wrap(x+1,SIZE)]-height[y*SIZE+wrap(x-1,SIZE)],dy=height[wrap(y+1,SIZE)*SIZE+x]-height[wrap(y-1,SIZE)*SIZE+x],len=Math.hypot(dx,dy,1),k=(y*SIZE+x)*4;
    normal.set([Math.round((.5-dx/len*.5)*255),Math.round((.5-dy/len*.5)*255),Math.round((.5+.5/len)*255),255],k);
  }
  const make=(data,name)=>{
    let t;
    // O exportador glTF combina rugosidade/metal com drawImage: precisa de uma imagem canvas.
    if(name.endsWith('_roughness')&&typeof OffscreenCanvas!=='undefined'){
      const canvas=new OffscreenCanvas(SIZE,SIZE),ctx=canvas.getContext('2d'),image=ctx.createImageData(SIZE,SIZE);image.data.set(data);ctx.putImageData(image,0,0);t=new THREE.CanvasTexture(canvas);t.flipY=false;
    }else t=new THREE.DataTexture(data,SIZE,SIZE);
    t.name=name;t.channel=1;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.needsUpdate=true;return t;
  };
  const result={normal:make(normal,kind+'_normal'),roughness:make(rough,kind+'_roughness')};textures.set(kind,result);return result;
}

// Projeção por face com vértices separados só nas mudanças de eixo. Não altera a superfície:
// normais suaves e atributos originais são copiados; UV de cor e UV de microdetalhe são independentes.
export function surfaceUV(geo,W=1){
  if(prepared.has(geo))return geo;
  const p=geo.attributes.position,n=geo.attributes.normal;if(!p||!n||!p.count)return geo;
  if(geo.morphAttributes.position?.length||geo.attributes.skinIndex)return geo;
  const ix=geo.index,keys=new Map(),sources=[],uv=[],indices=[],scale=3/Math.max(.01,W);
  const project=(i,axis)=>{const x=p.getX(i)*scale,y=p.getY(i)*scale,z=p.getZ(i)*scale;return axis===0?[z,y]:axis===1?[x,z]:[x,y]};
  for(let t=0;t<(ix?.count||p.count);t+=3){
    const tri=[0,1,2].map(k=>ix?ix.getX(t+k):t+k),[a,b,c]=tri;
    const ux=p.getX(b)-p.getX(a),uy=p.getY(b)-p.getY(a),uz=p.getZ(b)-p.getZ(a),vx=p.getX(c)-p.getX(a),vy=p.getY(c)-p.getY(a),vz=p.getZ(c)-p.getZ(a);
    // A normal geométrica garante área de UV mesmo nas barras com normais de sombreado próprias.
    const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
    const ax=Math.abs(nx),ay=Math.abs(ny),az=Math.abs(nz),axis=ax>ay&&ax>az?0:ay>az?1:2;
    for(const i of tri){const key=i*3+axis;let j=keys.get(key);if(j===undefined){j=sources.length;keys.set(key,j);sources.push(i);uv.push(...project(i,axis))}indices.push(j)}
  }
  for(const [name,a]of Object.entries(geo.attributes)){
    const values=new a.array.constructor(sources.length*a.itemSize);
    for(let i=0;i<sources.length;i++)for(let k=0;k<a.itemSize;k++)values[i*a.itemSize+k]=a.array[sources[i]*a.itemSize+k];
    geo.setAttribute(name,new THREE.BufferAttribute(values,a.itemSize,a.normalized));
  }
  geo.setIndex(indices);geo.setAttribute('uv1',new THREE.Float32BufferAttribute(uv,2));prepared.add(geo);return geo;
}
export function heroSurface(geo,mat,ch,W=1){
  if(!mat.isMeshStandardMaterial||mat.transparent||['gem','pearl','tail','fin'].includes(ch))return;
  const kind=['trim','enamel','metal'].includes(ch)?'metal':['leather','sole'].includes(ch)?'leather':ch==='polymer'?'polymer':ch==='fur'?'fur':'fabric';
  surfaceUV(geo,W);if(!geo.attributes.uv1)return;
  const texture=maps(kind);mat.normalMap=texture.normal;mat.roughnessMap=texture.roughness;
  mat.normalScale.setScalar(kind==='metal'?.11:kind==='leather'?.20:kind==='polymer'?.08:.23);
}
