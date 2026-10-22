// Texturas geradas localmente: trama, grão e micro-riscos incorporados no GLB.
import * as THREE from 'three';
const textures=new Map();
const fract=x=>x-Math.floor(x),noise=(x,y)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453);
function texture(kind){
  if(textures.has(kind))return textures.get(kind);
  const n=256,data=new Uint8Array(n*n*4);
  const h=(x,y)=>{
    const u=(x+n)%n,v=(y+n)%n;
    if(kind==='fabric')return .4*Math.sin(u*Math.PI/8)*Math.sin(v*Math.PI/8)+.12*Math.sin(u*Math.PI/2)+.12*Math.sin(v*Math.PI/2);
    if(kind==='metal')return noise(Math.floor(u/2),v)*.12+Math.sin(v*.45)*.035;
    const k=noise(Math.floor(u/3),Math.floor(v/3));return k*.45+noise(u,v)*.16;
  };
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const dx=h(x+1,y)-h(x-1,y),dy=h(x,y+1)-h(x,y-1),k=(y*n+x)*4,v=new THREE.Vector3(-dx,-dy,1).normalize();
    data[k]=Math.round((v.x*.5+.5)*255);data[k+1]=Math.round((v.y*.5+.5)*255);data[k+2]=Math.round((v.z*.5+.5)*255);data[k+3]=255;
  }
  const t=new THREE.DataTexture(data,n,n);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;textures.set(kind,t);return t;
}
export function heroSurface(geo,mat,ch,W){
  if(mat.transparent||['gem','pearl'].includes(ch))return;
  if(!geo.attributes.uv){
    const p=geo.attributes.position,n=geo.attributes.normal,uv=new Float32Array(p.count*2);
    for(let i=0;i<p.count;i++){
      const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));
      uv[i*2]=(nx>nz?p.getZ(i):p.getX(i))/W*3;
      uv[i*2+1]=(ny>Math.max(nx,nz)?p.getZ(i):p.getY(i))/W*3;
    }
    geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  }
  const kind=['trim','enamel'].includes(ch)?'metal':['leather','sole'].includes(ch)?'leather':'fabric';
  mat.normalMap=texture(kind);mat.normalScale.setScalar(kind==='metal'?.11:kind==='leather'?.20:.23);
  if(kind==='fabric'){mat.sheen=.65;mat.sheenRoughness=.68;mat.roughness=.79}
  if(ch==='enamel'){mat.metalness=.66;mat.roughness=.27;mat.clearcoat=.65;mat.clearcoatRoughness=.23}
}
