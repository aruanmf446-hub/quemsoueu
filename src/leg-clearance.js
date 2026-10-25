// A costura central é medida no corpo em pose A, sem mudar sua geometria.
// Uma folga radial de calça não pode preencher o vão entre as duas pernas.
const cache=new WeakMap();
export function legClearance(body){
 if(cache.has(body.geo))return cache.get(body.geo);
 const {hip,W}=body.joints,p=body.geo.attributes.position,ix=body.geo.index,step=W*.025;
 let crotch=hip.y,bottom=hip.y;
 for(let i=0;i<p.count;i++)bottom=Math.min(bottom,p.getY(i));
 const start=Math.floor(bottom/step)*step,rows=Math.ceil((hip.y-start)/step)+3,clearance=new Float64Array(rows).fill(Infinity);
 for(let i=0;i<(ix?.count??p.count);i+=3){
  const ids=[0,1,2].map(k=>ix?ix.getX(i+k):i+k),xs=ids.map(k=>p.getX(k)),ys=ids.map(k=>p.getY(k)),lo=Math.min(...ys),hi=Math.max(...ys);
  if(lo>hip.y)continue;
  // Mínimo conservador em cada faixa: nenhuma abertura pode cortar um
  // triângulo da pele, inclusive onde as coxas largas ainda se encostam.
  const medial=Math.min(...xs)<=0&&Math.max(...xs)>=0?0:Math.min(...xs.map(Math.abs));
  for(let row=Math.max(0,Math.floor((lo-start)/step));row<=Math.min(rows-1,Math.floor((hi-start)/step));row++)clearance[row]=Math.min(clearance[row],medial);
  for(let k=0;k<3;k++){
   const next=(k+1)%3,x=xs[k],other=xs[next];if(x*other>0)continue;
   const t=x===other?0:x/(x-other),y=ys[k]+(ys[next]-ys[k])*t;
   if(y<crotch)crotch=y;
  }
 }
 const radius=W*.06,top=crotch-W*.07,center=top-radius;
 const gaps=Array.from(clearance,(v,i)=>Math.min(radius,Math.min(v,clearance[Math.max(0,i-1)],clearance[Math.min(rows-1,i+1)])-W*.025));
 // A interpolação usa mínimos vizinhos: conserva folga da pele também
 // entre as alturas amostradas. Não depende da escala aproximada do SDF.
 const field=(x,y)=>{
  const f=Math.max(0,Math.min(rows-1,(y-start)/step)),i=Math.min(rows-2,Math.floor(f)),gap=gaps[i]+(gaps[i+1]-gaps[i])*(f-i);
  return Math.min(radius-Math.hypot(x,Math.max(0,y-center)),gap-Math.abs(x));
 };
 const result={crotch,radius,top,field};
 cache.set(body.geo,result);return result;
}
