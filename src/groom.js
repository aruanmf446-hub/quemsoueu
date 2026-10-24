// Acabamento de fios: guias existentes, seção fechada, moldura contínua e UV ao longo da fibra.
import * as THREE from 'three';
import {smoothHairNormals} from './hair-normals.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),PI=Math.PI,clamp=THREE.MathUtils.clamp;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
let textures;
function fiberMaps(){
 if(textures)return textures;
 const N=512,height=new Float32Array(N*N),normal=new Uint8Array(N*N*4),rough=new Uint8Array(N*N*4),albedo=new Uint8Array(N*N*4);
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const u=x/N,v=y/N,flow=.18*Math.sin(2*PI*v)+.08*Math.sin(4*PI*v),grain=.5+.5*Math.sin(2*PI*(13*u+v));
  height[y*N+x]=.12*Math.sin(2*PI*32*u+flow)+.044*Math.sin(2*PI*77*u+flow*.7);
  const r=Math.round(255*(.87+.10*grain));rough.set([255,r,255,255],(y*N+x)*4);
  const c=Math.round(255*(.965+.033*Math.sin(2*PI*32*u+flow)*(.65+.35*grain)));albedo.set([c,c,c,255],(y*N+x)*4);
 }
 const at=(x,y)=>height[((y+N)%N)*N+(x+N)%N];
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const dx=at(x+1,y)-at(x-1,y),dy=at(x,y+1)-at(x,y-1),len=Math.hypot(dx,dy,1);
  normal.set([Math.round(127.5-dx/len*127.5),Math.round(127.5-dy/len*127.5),Math.round(127.5+127.5/len),255],(y*N+x)*4);
 }
 const texture=(data,name)=>{
  let t;
  if(name==='Hair_Fiber_Roughness'&&typeof OffscreenCanvas!=='undefined'){
   const canvas=new OffscreenCanvas(N,N),ctx=canvas.getContext('2d'),im=ctx.createImageData(N,N);im.data.set(data);ctx.putImageData(im,0,0);t=new THREE.CanvasTexture(canvas);t.flipY=false;
  }else t=new THREE.DataTexture(data,N,N);
  t.name=name;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.needsUpdate=true;return t;
 };
 textures={normal:texture(normal,'Hair_Fiber_Normal'),roughness:texture(rough,'Hair_Fiber_Roughness'),color:texture(albedo,'Hair_Fiber_Color')};textures.color.colorSpace=THREE.SRGBColorSpace;return textures;
}
export function groomSurface(material,{roughness=.48,anisotropy=.6}={}){
 const maps=fiberMaps();material.map=maps.color;material.normalMap=maps.normal;material.roughnessMap=maps.roughness;material.normalScale.set(.60,.60);
 material.roughness=roughness;material.metalness=0;material.clearcoat=.035;material.clearcoatRoughness=.65;material.anisotropy=anisotropy;material.anisotropyRotation=PI/2;material.sheen=.65;material.sheenRoughness=.5;return material;
}
export function groomColor(material,color){material.color.set(color);material.sheenColor.set(color).lerp(new THREE.Color('#fff0da'),.22)}
export function groomMaterial(color,name='Hair'){
 const material=new THREE.MeshPhysicalMaterial({name,vertexColors:true});groomSurface(material);groomColor(material,color);return material;
}
export function groomedLock(points,width,depth,options={}){
 const closed=!!options.closed,guide=closed&&points[0].distanceToSquared(points[points.length-1])<1e-12?points.slice(0,-1):points;
 const curve=new THREE.CatmullRomCurve3(guide,closed,'centripetal'),rows=options.rows||clamp(Math.ceil(curve.getLength()*34),20,100),cols=options.segments||24;
 const pos=[],colors=[],uv=[],ix=[],tangent=V(),n=V(),bin=V(),previous=V();let initialized=false;
 for(let i=0;i<=rows;i++){
  const t=i/rows,c=curve.getPoint(t);tangent.copy(curve.getTangent(t)).normalize();
  n.copy(options.normal?options.normal(t,c):V(c.x,.15,c.z));n.addScaledVector(tangent,-n.dot(tangent));
  if(n.lengthSq()<1e-8)n.copy(Math.abs(tangent.z)<.9?V(0,0,1):V(0,1,0)).addScaledVector(tangent,-n.dot(tangent));n.normalize();
  if(initialized){previous.addScaledVector(tangent,-previous.dot(tangent));if(previous.lengthSq()>1e-8){previous.normalize();if(n.dot(previous)<0)n.negate();n.lerp(previous,.65).normalize()}}
  previous.copy(n);initialized=true;bin.crossVectors(tangent,n).normalize();n.crossVectors(bin,tangent).normalize();
  const taper=Math.max(.004,(.76+.24*smooth(0,.15,t))*(1-.46*t)*(1-smooth(options.tip??.78,1,t)));
  const size=options.profile?options.profile(t):[width*Math.pow(taper,.65),depth*.72*Math.pow(taper,.88)],w=Math.max(.0003,size[0]),h=Math.max(.00025,size[1]);
  for(let j=0;j<=cols;j++){
   const a=2*PI*j/cols,cs=Math.cos(a),sn=Math.sin(a),groove=1-(options.grooveStrength??.20)*(.5+.5*Math.cos((cs*.5+.5)*2*PI*Math.min(4,options.grooves||3)+(options.phase||0)+(options.twist||0)*t+.35*Math.sin(PI*t)))*Math.max(0,sn);
   const q=c.clone().addScaledVector(bin,cs*w).addScaledVector(n,(options.sculpted?(sn>=0?Math.pow(sn,options.archPower??.62)*h*groove:sn*h*(options.backDepth??.38)):sn*h*groove));
   pos.push(q.x,q.y,q.z);const tone=(options.tone||1)*(.83+.14*smooth(0,.20,t))*(.985+.015*Math.cos(a*7+(options.phase||0)));colors.push(tone,tone,tone);uv.push(j/cols,t);
   if(i<rows&&j<cols){const k=i*(cols+1)+j;ix.push(k,k+cols+1,k+1,k+1,k+cols+1,k+cols+2)}
  }
 }
 if(closed){
  for(let j=0;j<=cols;j++)for(let k=0;k<3;k++){pos[(rows*(cols+1)+j)*3+k]=pos[j*3+k];colors[(rows*(cols+1)+j)*3+k]=colors[j*3+k]}
 }
 // Tampas têm UVs próprios: sem triângulos de textura colapsados na ponta.
 for(const end of closed?[]:[0,rows]){
  const center=pos.length/3,c=curve.getPoint(end/rows);pos.push(...c.toArray());colors.push(.85,.85,.85);uv.push(.5,.5);
  for(let j=0;j<cols;j++){const k=(end*(cols+1)+j)*3;pos.push(pos[k],pos[k+1],pos[k+2]);colors.push(.85,.85,.85);uv.push(.5+.5*Math.cos(j/cols*2*PI),.5+.5*Math.sin(j/cols*2*PI))}
  for(let j=0;j<cols;j++){const a=center+1+j,b=center+1+(j+1)%cols;ix.push(center,...(end?[b,a]:[a,b]))}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);if(options.finish!==false){g.computeVertexNormals();smoothHairNormals(g);if(options.tangents!==false)g.computeTangents()}g.userData.groom={closed:true,rows,segments:cols};
 if(options.detailFibers&&width>.025&&curve.getLength()>.22){
  // Fibras secundárias seguem a própria superfície da mecha existente.
  // Não são novas guias de penteado nem ruído espalhado sobre a cabeça.
  if(!g.attributes.normal)g.computeVertexNormals();const parts=[g],a=g.attributes.position,no=g.attributes.normal;
  for(const j of [Math.round(cols/4)-2,Math.round(cols/4),Math.round(cols/4)+2]){
   const guide=[],normals=[];
   for(let i=Math.max(1,Math.round(rows*.08));i<=Math.round(rows*.94);i++){
    const k=i*(cols+1)+j,n0=V().fromBufferAttribute(no,k);guide.push(V().fromBufferAttribute(a,k).addScaledVector(n0,.0010));normals.push(n0);
   }
   if(guide.length<3)continue;
   parts.push(groomedLock(guide,1,1,{finish:options.finish,rows:Math.min(60,guide.length),segments:6,tone:(options.tone||1)*1.02,
    normal:t=>normals[Math.min(normals.length-1,Math.round(t*(normals.length-1)))],profile:t=>{const r=Math.max(.0003,.0012*Math.sin(PI*t)**.55);return[r,r*.70]}}));
  }
  if(options.finish===false)g.deleteAttribute('normal');const merged=mergeGeometries(parts,false);merged.userData.groom=g.userData.groom;merged.userData.fibers=parts.length-1;parts.forEach(p=>p.dispose());return merged;
 }
 return g;
}
// Anilha com parede e chanfros: o cabelo atravessa o vão, sem tampas maciças.
export function groomCuff(radius,height){
 const t=Math.min(.008,radius*.16),b=Math.min(.003,t*.35),r=radius;
 return new THREE.LatheGeometry([V(r-t,-height/2),V(r-b,-height/2),V(r,-height/2+b),V(r,height/2-b),V(r-b,height/2),V(r-t,height/2),V(r-t,-height/2)],48);
}
