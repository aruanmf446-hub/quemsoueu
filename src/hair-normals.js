// Costuras paramétricas têm vértices duplicados para UVs, mas precisam da mesma normal.
// Só as normais são corrigidas; posições, índices, UVs e cores permanecem intactos.
export function smoothHairNormals(geometry,ranges=[{start:0,count:geometry.attributes.position.count}]){
  const position=geometry.attributes.position,normal=geometry.attributes.normal,index=geometry.index;
  if(!normal||!index)return geometry;
  const weighted=new Float64Array(position.count*3);
  for(let i=0;i<index.count;i+=3){
    const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2),ax=position.getX(a),ay=position.getY(a),az=position.getZ(a);
    const ux=position.getX(b)-ax,uy=position.getY(b)-ay,uz=position.getZ(b)-az,vx=position.getX(c)-ax,vy=position.getY(c)-ay,vz=position.getZ(c)-az;
    const x=uy*vz-uz*vy,y=uz*vx-ux*vz,z=ux*vy-uy*vx;
    for(const k of [a,b,c]){weighted[k*3]+=x;weighted[k*3+1]+=y;weighted[k*3+2]+=z}
  }
  for(const {start,count} of ranges){
    const groups=new Map();
    for(let i=start;i<start+count;i++){
      const key=[position.getX(i),position.getY(i),position.getZ(i)].map(v=>Math.round(v*1e6)).join(':');
      if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);
    }
    for(const ids of groups.values()){
      if(ids.length<2)continue;
      let x=0,y=0,z=0;
      for(const i of ids){x+=weighted[i*3];y+=weighted[i*3+1];z+=weighted[i*3+2]}
      let length=Math.hypot(x,y,z);
      if(length<1e-12){
        const i=ids.find(k=>Math.hypot(normal.getX(k),normal.getY(k),normal.getZ(k))>1e-8);
        if(i===undefined)continue;
        x=normal.getX(i);y=normal.getY(i);z=normal.getZ(i);length=Math.hypot(x,y,z);
      }
      for(const i of ids)normal.setXYZ(i,x/length,y/length,z/length);
    }
  }
  normal.needsUpdate=true;return geometry;
}
