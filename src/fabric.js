// Malhas de tecido: seções de apoio, folga e queda própria. O corpo é somente uma referência de encaixe.
import * as THREE from 'three';
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// Superfície com avesso e bordas fechadas. Anéis periódicos compartilham vértices e normais na costura.
export function clothSurface(nr, nc, point, { closed = false, thickness = .025 } = {}) {
  const cols = closed ? nc : nc + 1, pos = [], ids = [], shade = [];
  for (let i = 0; i <= nr; i++) for (let j = 0; j < cols; j++) {
    const p = point(i / nr, j / nc); pos.push(p.x, p.y, p.z);
    shade.push(1);
  }
  const faces = [];
  for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) {
    const a = i * cols + j, b = i * cols + (j + 1) % cols, c = a + cols, d = b + cols;
    faces.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(faces); g.computeVertexNormals();
  const normal = g.attributes.normal, count = pos.length / 3;
  for (let i = 0; i < count; i++) pos.push(pos[i * 3] - normal.getX(i) * thickness, pos[i * 3 + 1] - normal.getY(i) * thickness, pos[i * 3 + 2] - normal.getZ(i) * thickness);
  ids.push(...faces);
  for (let i = 0; i < faces.length; i += 3) ids.push(faces[i] + count, faces[i + 2] + count, faces[i + 1] + count);
  const join = (a, b) => ids.push(a, b, a + count, b, b + count, a + count);
  for (let j = 0; j < nc; j++) { const b = (j + 1) % cols; join(j, b); join(nr * cols + b, nr * cols + j) }
  if (!closed) for (let i = 0; i < nr; i++) { join((i + 1) * cols, i * cols); join(i * cols + nc, (i + 1) * cols + nc) }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('shade', new THREE.Float32BufferAttribute([...shade, ...shade.map(x => x * .86)], 1));
  g.setAttribute('mixc', new THREE.Float32BufferAttribute(new Float32Array(count * 2), 1));
  g.setIndex(ids); g.deleteAttribute('normal'); g.computeVertexNormals();
  // As barras não participam da média de normais da superfície visível.
  for(let i=0;i<count;i++){g.attributes.normal.setXYZ(i,normal.getX(i),normal.getY(i),normal.getZ(i));g.attributes.normal.setXYZ(i+count,-normal.getX(i),-normal.getY(i),-normal.getZ(i))} g.computeBoundingBox(); g.userData.surface = { nr, cols, closed, nc }; return g;
}

// Taubin somente nas peças residuais de SDF, com contorno preservado. Não atua na malha do corpo.
export function smoothCloth(g, passes = 5) {
  const p = g.attributes.position, neighbors = Array.from({ length: p.count }, () => new Set()), edges = new Map(), ix = g.index?.array;
  if (!ix) return g;
  for (let i = 0; i < ix.length; i += 3) for (let k = 0; k < 3; k++) {
    const a = ix[i + k], b = ix[i + (k + 1) % 3]; neighbors[a].add(b); neighbors[b].add(a);
    const key = Math.min(a, b) * p.count + Math.max(a, b); edges.set(key, (edges.get(key) || 0) + 1);
  }
  const fixed = new Uint8Array(p.count); for (const [key, n] of edges) if (n === 1) { fixed[Math.floor(key / p.count)]=1; fixed[key % p.count]=1 }
  // Mantém a ordem de soma das vizinhanças, com acesso contíguo nas seis passagens de suavização.
  const offsets=new Uint32Array(p.count+1);for(let i=0;i<p.count;i++)offsets[i+1]=offsets[i]+neighbors[i].size;
  const adjacent=new Uint32Array(offsets[p.count]);for(let i=0;i<p.count;i++){let j=offsets[i];for(const vertex of neighbors[i])adjacent[j++]=vertex}
  const next = new Float32Array(p.array.length);
  for (let k = 0; k < passes; k++) for (const weight of [.45, -.47]) {
    next.set(p.array);
    // Soma as três coordenadas numa única visita à vizinhança; os pesos Taubin são os mesmos.
    for (let i = 0; i < p.count; i++) if (!fixed[i] && offsets[i+1]>offsets[i]) {
      let sx=0,sy=0,sz=0;for(let q=offsets[i];q<offsets[i+1];q++){const j=adjacent[q];sx+=p.array[j*3];sy+=p.array[j*3+1];sz+=p.array[j*3+2]}
      const n=offsets[i+1]-offsets[i],k=i*3;
      next[k]+=weight*(sx/n-p.array[k]);next[k+1]+=weight*(sy/n-p.array[k+1]);next[k+2]+=weight*(sz/n-p.array[k+2]);
    }
    p.array.set(next);
  }
  p.needsUpdate = true; g.computeVertexNormals(); return g;
}

// Luvas: recorta apenas a região da mão, com folga nas normais. Evita remalhar o SDF a cada modelo.
// A geometria de origem é somente lida; o punho recebe uma tampa própria, escondida dentro da manga.
export function handPatch(body, side = 0, offset = .025 * body.proportions.W) {
  const g = body.geo, p = g.attributes.position, n = g.attributes.normal, ix = g.index.array, J = body.joints, W = body.proportions.W;
  const dir = J.wrist.clone().sub(J.elbow).normalize(), cut = J.wrist.clone().addScaledVector(dir, -.08 * W), len = .095 * J.Lb * body.proportions.hand * (.85 + .15 * W);
  const positions = [], normals = [], ids = [], shared = new Map();
  const put = q => {
    const v = q.p.clone().addScaledVector(q.n, offset), key = [v.x, v.y, v.z].map(x => x.toFixed(6)).join(':');
    if (shared.has(key)) return shared.get(key);
    const k = positions.length / 3; shared.set(key, k); positions.push(v.x, v.y, v.z); normals.push(q.n.x, q.n.y, q.n.z); return k;
  };
  const field = q => (Math.abs(q.x) - cut.x) * dir.x + (q.y - cut.y) * dir.y + (q.z - cut.z) * dir.z;
  for (let i = 0; i < ix.length; i += 3) {
    const tri = [ix[i], ix[i + 1], ix[i + 2]], x = tri.reduce((s, k) => s + p.getX(k) / 3, 0), y = tri.reduce((s, k) => s + p.getY(k) / 3, 0);
    if (Math.abs(x) < J.wrist.x - .35 * W || y < J.wrist.y - len * 1.45 || (side && x * side < 0)) continue;
    const poly = tri.map(k => ({ p: V().fromBufferAttribute(p, k), n: V().fromBufferAttribute(n, k) })), clipped = [];
    for (let j = 0; j < 3; j++) {
      const a = poly[j], b = poly[(j + 1) % 3], fa = field(a.p), fb = field(b.p);
      if (fa >= 0) clipped.push(a);
      if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb); clipped.push({ p: a.p.clone().lerp(b.p, t), n: a.n.clone().lerp(b.n, t).normalize() }) }
    }
    for (let j = 1; j + 1 < clipped.length; j++) ids.push(put(clipped[0]), put(clipped[j]), put(clipped[j + 1]));
  }
  const edges = new Map();
  for (let i = 0; i < ids.length; i += 3) for (let j = 0; j < 3; j++) { const a = ids[i + j], b = ids[i + (j + 1) % 3], key = Math.min(a, b) + ':' + Math.max(a, b); edges.set(key, (edges.get(key) || 0) + 1) }
  for (const s of [-1, 1]) {
    const rim = new Set(); for (const [key, count] of edges) if (count === 1) { const pair = key.split(':').map(Number); if (positions[pair[0] * 3] * s > 0) pair.forEach(k => rim.add(k)) }
    if (!rim.size) continue;
    const center = V(); for (const k of rim) center.add(V().fromArray(positions, k * 3)); center.multiplyScalar(1 / rim.size);
    const normal = V(-s * dir.x, -dir.y, -dir.z), u = V(0, 0, 1).cross(normal).normalize(), v = normal.clone().cross(u), points = [...rim];
    points.sort((a, b) => { const pa = V().fromArray(positions, a * 3).sub(center), pb = V().fromArray(positions, b * 3).sub(center); return Math.atan2(pa.dot(v), pa.dot(u)) - Math.atan2(pb.dot(v), pb.dot(u)) });
    const c = positions.length / 3; positions.push(center.x, center.y, center.z); normals.push(normal.x, normal.y, normal.z);
    for (let j = 0; j < points.length; j++) ids.push(c, points[j], points[(j + 1) % points.length]);
  }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3)); out.setIndex(ids); return out;
}

// Casca de tecido a partir da face externa: recorta a abertura e só depois cria avesso e espessura.
// Assim uma grade inicial maior nunca perde uma parede fina entre duas isosuperfícies próximas.
export function shellCloth(source, clip, thickness, passes = 0) {
  const pa=source.attributes.position,na=source.attributes.normal,ix=source.index.array;
  const distance=Array.from({length:pa.count},(_,i)=>clip(pa.getX(i),pa.getY(i),pa.getZ(i)));
  let positions=[],normals=[];const indices=[],originals=new Map(),crossings=new Map();
  const original=i=>{
    if(originals.has(i))return originals.get(i);
    const n=positions.length/3;positions.push(pa.getX(i),pa.getY(i),pa.getZ(i));normals.push(na?.getX(i)||0,na?.getY(i)||0,na?.getZ(i)||0);originals.set(i,n);return n;
  };
  const crossing=(a,b)=>{
    const key=Math.min(a,b)*pa.count+Math.max(a,b);if(crossings.has(key))return crossings.get(key);
    const t=distance[a]/(distance[a]-distance[b]),n=positions.length/3;let length=0;
    for(let k=0;k<3;k++){positions.push(pa.array[a*3+k]+t*(pa.array[b*3+k]-pa.array[a*3+k]));const v=na?na.array[a*3+k]+t*(na.array[b*3+k]-na.array[a*3+k]):0;normals.push(v);length+=v*v}
    length=Math.sqrt(length)||1;for(let k=0;k<3;k++)normals[n*3+k]/=length;crossings.set(key,n);return n;
  };
  for(let i=0;i<ix.length;i+=3){
    const tri=[ix[i],ix[i+1],ix[i+2]],polygon=[];
    for(let j=0;j<3;j++){const a=tri[j],b=tri[(j+1)%3],inside=distance[a]<=0;if(inside)polygon.push(original(a));if(inside!==(distance[b]<=0))polygon.push(crossing(a,b))}
    for(let j=1;j+1<polygon.length;j++)indices.push(polygon[0],polygon[j],polygon[j+1]);
  }
  source.dispose();
  if(passes||!na){
    // Suaviza só a face externa; o avesso é o seu deslocamento, não outra malha a suavizar inteira.
    const outside=new THREE.BufferGeometry();outside.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));outside.setIndex(indices);
    if(passes)smoothCloth(outside,passes);else outside.computeVertexNormals();
    positions=Array.from(outside.attributes.position.array);normals=Array.from(outside.attributes.normal.array);outside.dispose();
  }
  const n=positions.length/3,edges=new Map(),canonical=new Map(),ids=[];
  // Costuras de UV podem repetir posições: só uma abertura geométrica recebe parede lateral.
  for(let i=0;i<n;i++){const key=positions.slice(i*3,i*3+3).map(v=>Math.round(v*1e8)).join(':');if(!canonical.has(key))canonical.set(key,canonical.size);ids.push(canonical.get(key))}
  for(let i=0;i<indices.length;i+=3)for(let j=0;j<3;j++){const a=indices[i+j],b=indices[i+(j+1)%3],ga=ids[a],gb=ids[b];if(ga===gb)continue;const key=Math.min(ga,gb)*canonical.size+Math.max(ga,gb);if(edges.has(key))edges.get(key).count++;else edges.set(key,{a,b,count:1})}
  // Posições repetidas numa costura precisam do mesmo deslocamento no avesso, mesmo quando
  // as normais externas são separadas. Isso fecha a casca sem misturar o sombreado da frente.
  const first=new Int32Array(canonical.size).fill(-1),duplicates=new Map();
  for(let i=0;i<n;i++){const id=ids[i];if(first[id]<0)first[id]=i;else{if(!duplicates.has(id))duplicates.set(id,[first[id]]);duplicates.get(id).push(i)}}
  let offsetNormals=normals;
  if(duplicates.size){offsetNormals=normals.slice();for(const vertices of duplicates.values()){let x=0,y=0,z=0;for(const i of vertices){x+=normals[i*3];y+=normals[i*3+1];z+=normals[i*3+2]}const length=Math.hypot(x,y,z)||1;for(const i of vertices){offsetNormals[i*3]=x/length;offsetNormals[i*3+1]=y/length;offsetNormals[i*3+2]=z/length}}}
  // O avesso tem seus próprios vértices e normais; as bordas não interferem no sombreado da frente.
  for(let i=0;i<n;i++)for(let k=0;k<3;k++){positions.push(positions[i*3+k]-offsetNormals[i*3+k]*thickness);normals.push(-normals[i*3+k])}
  const frontCount=indices.length;for(let i=0;i<frontCount;i+=3)indices.push(indices[i]+n,indices[i+2]+n,indices[i+1]+n);
  for(const {a,b,count}of edges.values())if(count===1){
    const offset=positions.length/3,vertices=[a,a+n,b+n,b];
    for(const v of vertices){positions.push(...positions.slice(v*3,v*3+3));normals.push(0,0,0)}
    indices.push(offset,offset+1,offset+2,offset,offset+2,offset+3);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
