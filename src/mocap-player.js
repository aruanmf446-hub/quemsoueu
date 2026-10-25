// Amostragem da captura: posições cúbicas e orientações esféricas.
import * as THREE from 'three';
const Q=()=>new THREE.Quaternion(),clamp=THREE.MathUtils.clamp;
function vector(a,b,c,d,t,unit=false){
 const t2=t*t,t3=t2*t,out=b.map((v,i)=>.5*((2*v)+(-a[i]+c[i])*t+(2*a[i]-5*v+4*c[i]-d[i])*t2+(-a[i]+3*v-3*c[i]+d[i])*t3));
 if(unit){const length=Math.hypot(...out);if(length>1e-8)return out.map(v=>v/length)}return out;
}
function orientation(a,b,c,d,t){
 // SQUAD suaviza a velocidade entre chaves sem interpolar ângulos de Euler.
 const qa=Q().fromArray(a).normalize(),qb=Q().fromArray(b).normalize(),qc=Q().fromArray(c).normalize(),qd=Q().fromArray(d).normalize();
 const nearest=(q,ref)=>{if(q.dot(ref)<0)q.set(-q.x,-q.y,-q.z,-q.w);return q};
 nearest(qa,qb);nearest(qc,qb);nearest(qd,qc);
 const log=q=>{const r=Math.hypot(q.x,q.y,q.z),angle=Math.atan2(r,q.w);return r<1e-9?new THREE.Vector3():new THREE.Vector3(q.x,q.y,q.z).multiplyScalar(angle/r)};
 const exp=v=>{const angle=v.length(),k=angle<1e-9?1:Math.sin(angle)/angle;return Q().set(v.x*k,v.y*k,v.z*k,Math.cos(angle))};
 const tangent=(prev,q,next)=>{const inverse=q.clone().invert(),sum=log(inverse.clone().multiply(prev)).add(log(inverse.multiply(next))).multiplyScalar(-.25);return q.clone().multiply(exp(sum))};
 return qb.clone().slerp(qc,t).slerp(tangent(qa,qb,qc).slerp(tangent(qb,qc,qd),t),2*t*(1-t)).normalize().toArray();
}
export function sampleCapture(clip,time){
 const duration=clip.duration,t=clip.loop?((time%duration)+duration)%duration:clamp(time,0,duration),count=clip.frames.length-1,x=t/duration*count,i=Math.min(count-1,Math.floor(x)),u=x-i;
 const frame=index=>clip.frames[clip.loop?((index%count)+count)%count:index<0?-index:index>count?2*count-index:index],a=frame(i-1),b=frame(i),c=frame(i+1),d=frame(i+2),out={};
 for(const key of Object.keys(b)){
  if(Array.isArray(b[key]))out[key]=vector(a[key],b[key],c[key],d[key],u);
  else if(typeof b[key]==='number')out[key]=Math.max(0,vector([a[key]],[b[key]],[c[key]],[d[key]],u)[0]);
  else{out[key]={};for(const name of Object.keys(b[key])){
   const values=[a[key][name],b[key][name],c[key][name],d[key][name]];
   out[key][name]=Array.isArray(values[0])?(values[0].length===4?orientation(...values,u):vector(...values,u,key==='directions')):Math.max(0,vector(...values.map(v=>[v]),u)[0]);
  }}
 }
 return out;
}
