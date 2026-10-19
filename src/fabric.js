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
    const key = Math.min(a, b) + ':' + Math.max(a, b); edges.set(key, (edges.get(key) || 0) + 1);
  }
  const fixed = new Set(); for (const [key, n] of edges) if (n === 1) key.split(':').forEach(i => fixed.add(Number(i)));
  const next = new Float32Array(p.array.length);
  for (let k = 0; k < passes; k++) for (const weight of [.45, -.47]) {
    next.set(p.array);
    for (let i = 0; i < p.count; i++) if (!fixed.has(i) && neighbors[i].size) for (let c = 0; c < 3; c++) {
      let sum = 0; for (const j of neighbors[i]) sum += p.array[j * 3 + c];
      next[i * 3 + c] += weight * (sum / neighbors[i].size - p.array[i * 3 + c]);
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
