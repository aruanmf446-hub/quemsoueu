// Cabelos da Head V2 — modelos prontos que se encaixam em qualquer cabeça (clica e troca).
//
// Cada penteado tem duas camadas:
//  1. Touca: cópia da pele dentro da linha do cabelo, afastada pela normal (cobre o couro cabeludo; a borda
//     afunda na pele e vira uma linha de cabelo limpa).
//  2. Mechas: tubos achatados e afinando na ponta que nascem na touca, seguem o fluxo do penteado (risca, para trás,
//     redemoinho, coque), abraçam a cabeça e caem com a gravidade depois do "equador", sem atravessar rosto, orelhas
//     ou pescoço. Ondas, cachos (hélice) e tranças são aplicados sobre esse caminho.
// O rosto não é alterado: olhos, nariz e boca continuam exatamente iguais.
// A cor do cabelo é a cor do material (as cores por vértice guardam só luz e sombra) → trocar a cor é instantâneo.
import * as THREE from 'three';

const { clamp } = THREE.MathUtils;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) };
const DEG = Math.PI / 180, V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), DOWN = V(0, -1, 0);
function rng(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }

// ---------------- catálogo ----------------
// flow: 'part' (risca: x = partX), 'back' (penteado para trás), 'whorl' (redemoinho na coroa), 'knot' (preso num coque)
// cap: espessura da touca; n/spacing: quantidade de mechas; w/th: largura/espessura; endY: onde as pontas terminam
// over: quanto a mecha pode passar da linha do cabelo (curto); grav: gravidade; wave/curl: ondas e cachos
export const HAIR_STYLES = {
  none: { label: 'Careca', sub: 'Sem cabelo' },
  short: { label: 'Curto', sub: 'Topete leve, laterais baixas', flow: 'whorl', lines: 110, seed: .03, cap: .012, topVol: 1.2, len: [1.5, 1.7], over: .04, grav: .12, layer: .022, lift: .045,
    bulge: .02, tip: .78, maxStrip: .5, wave: { a: .01, f: 1.2 }, tipLift: .045, hairline: .5, sideburn: -.02, inner: false },
  swept: { label: 'Para trás', sub: 'Penteado para trás, entradas', flow: 'back', seed: .03, cap: .012, topVol: .6, len: [2.6, 2.8], endY: 'nape+', grav: .55, layer: .025, lift: .025,
    bulge: .02, tip: .72, wave: { a: .014, f: 1.1 }, flick: .05, hairline: .6, templeLift: .12, flare: .02 },
  royal: { label: 'Real', sub: 'Volumoso, cobre as orelhas, pontas viradas', flow: 'back', seed: .036, cap: .016, topVol: .5, len: [3, 3.2], endY: 'neck', grav: .75, layer: .045, lift: .025,
    bulge: .035, tip: .78, wave: { a: .03, f: 1.1 }, flick: .07, hairline: .45, flare: .06, inner: false, maxStrip: .22 },
  long_wavy: { label: 'Longo ondulado', sub: 'Risca ao lado, ondas até os ombros', flow: 'part', partX: .1, seed: .042, cap: .016, topVol: .7, len: [4, 4.2], endY: 'long', grav: .85, layer: .07, lift: .05,
    bulge: .05, tip: .8, wave: { a: .07, f: .85 }, hairline: .42, flare: .2 },
  long_braids: { label: 'Longo com tranças', sub: 'Solto para trás e duas tranças na frente', flow: 'back', seed: .032, cap: .016, topVol: .7, len: [4, 4.2], endY: 'long', grav: .8, layer: .07, lift: .04,
    bulge: .04, tip: .84, wave: { a: .06, f: .9 }, hairline: .44, flare: .18, braids: { at: 'temple', len: 1.25, r: .045 } },
  long_curly: { label: 'Cachos volumosos', sub: 'Muito volume, cachos em espiral', flow: 'part', partX: -.06, seed: .034, cap: .02, topVol: 1, len: [3.6, 3.8], endY: 'shoulder', grav: .7, layer: .09, lift: .05,
    bulge: .035, tip: .8, wave: { a: .05, f: 1.2 }, hairline: .42, flare: .3, faceFrame: 4,
    tubes: true, n: 150, spacing: .055, w: .045, th: .042, curl: { r: [.025, .06], pitch: .26 } },
  bun: { label: 'Coque', sub: 'Preso no alto, fios soltos no rosto', flow: 'knot', knot: { y: .06, z: -.12, R: .22 }, seed: .03, cap: .014, topVol: .2, len: [1.6, 1.6], grav: 0, layer: .015,
    bulge: .016, tip: .97, hairline: .42, wisps: 2 },
  topknot: { label: 'Coque guerreiro', sub: 'Coque no alto, rabo e tranças', flow: 'knot', knot: { y: .0, z: -.42, R: .2 }, seed: .032, cap: .012, topVol: .1, len: [1.8, 1.8], grav: 0, layer: .012,
    bulge: .016, tip: .97, hairline: .5, tail: { n: 26, endY: -1.45, wave: .05 }, braids: { at: 'side', len: 1.1, r: .04, rings: true } },
  clown: { label: 'Cachinhos de palhaço', sub: 'Topo careca, cachos nas laterais', flow: 'out', tubesOnly: true, noCap: true, n: 170, tubes: true, cap: .03, topVol: 0, spacing: .04, w: .045, th: .045,
    len: [.28, .42], grav: .25, layer: .03, curl: { r: [.03, .045], pitch: .12 }, hairline: .3, band: { top: .28 }, sideburn: -.15 }
};
// Variações leves do catálogo para as novas identidades; os estilos existentes permanecem iguais.
HAIR_STYLES.lunar_curls={...HAIR_STYLES.bun,curlBun:true,label:'Cachos presos',sub:'Coque cacheado alto, com mechas soltas',knot:{y:.18,z:-.16,R:.43},tubes:true,n:88,spacing:.085,w:.05,th:.045,curl:{r:[.04,.075],pitch:.22},wisps:5};
HAIR_STYLES.short_curls={...HAIR_STYLES.short,label:'Curto cacheado',sub:'Cachos curtos e topete de inventor',tubes:true,n:64,spacing:.1,w:.047,th:.042,curl:{r:[.03,.055],pitch:.2},len:[1.2,1.5],topVol:1.4};
// Novos modelos da fila de refinamento; não modificam os penteados já existentes.
HAIR_STYLES.forest_pixie={...HAIR_STYLES.royal,label:'Curto em camadas',sub:'Risca lateral e mechas soltas',flow:'part',partX:.18,len:[1.9,2.2],endY:'nape+',topVol:1,layer:.055,wave:{a:.04,f:1.2},flare:.08,maxStrip:.18,hairline:.46,tubes:true,n:100,spacing:.065,w:.065,th:.045,curl:{r:[.012,.024],pitch:.3}};
HAIR_STYLES.forest_locks={...HAIR_STYLES.long_braids,label:'Mechas torcidas',sub:'Mechas longas em cordões, presas para trás',braids:null,tubes:true,n:54,spacing:.12,w:.065,th:.059,curl:{r:[.008,.018],pitch:.35},len:[3.3,3.7],endY:'shoulder',topVol:.85,layer:.065};
HAIR_STYLES.court_waves={...HAIR_STYLES.long_wavy,label:'Ondas de corte',sub:'Cabelo longo em camadas onduladas',len:[5.0,5.6],endY:-2.7,wave:{a:.085,f:.85},layer:.075,faceFrame:3,w:.075,th:.032,maxStrip:.24};
export const HAIR_COLORS = [
  ['Preto', '#17110f'], ['Castanho escuro', '#3a2417'], ['Castanho', '#6b4027'], ['Ruivo', '#b4441c'], ['Acobreado', '#8e3b1e'],
  ['Loiro', '#d6ad62'], ['Loiro claro', '#eedbb0'], ['Grisalho', '#9c968e'], ['Branco', '#efede8'],
  ['Azul', '#3456c4'], ['Rosa', '#e3679c'], ['Roxo', '#7446bf'], ['Verde', '#3f9152']
];

// ---------------- geometria ----------------
export function buildHair(fit, id, color = '#2a1a12') {
  const S = HAIR_STYLES[id];
  if (!fit || !S || id === 'none') return null;
  const T0 = performance.now();
  const P = fit.P, sdf = fit.sdf, zc = fit.cz, top = fit.top, brow = fit.browY, rand = rng(1234 + id.length * 97);
  const ears = fit.ears || [];
  const earTop = ears.length ? Math.max(...ears.map(e => e.top.y)) : brow - .3;
  const lobe = ears.length ? Math.min(...ears.map(e => e.lobe.y)) : earTop - .45;
  const phiE = ears.length ? Math.atan2(Math.abs(ears[0].center.x), ears[0].center.z - zc) : 95 * DEG;
  const neckBot = P.neck ? P.neck[3] : -1.6;

  // ---- linha do cabelo: altura mínima y em função do ângulo em volta da cabeça (0 = frente) ----
  const hf = brow + (top - brow) * (S.hairline ?? .42), yTemple = brow + .07 + (S.templeLift || 0);
  const ySide = earTop + (S.sideburn ?? -.08), yEar = earTop + .05, yNape = lobe - .2;
  const KP = [[0, hf], [30 * DEG, hf - .015], [phiE - 42 * DEG, yTemple], [phiE - 24 * DEG, ySide], [phiE - 13 * DEG, ySide], [phiE - 4 * DEG, yEar],
    [phiE + 14 * DEG, yEar], [phiE + 40 * DEG, yNape + .08], [Math.PI, yNape]];
  const hairline = phi => {
    const a = Math.abs(phi);
    for (let k = 1; k < KP.length; k++) if (a <= KP[k][0]) { const [a0, y0] = KP[k - 1], [a1, y1] = KP[k], t = sstep(a0, a1, a); return y0 + (y1 - y0) * t }
    return yNape;
  };
  const phiOf = p => Math.atan2(p.x, p.z - zc);
  const bandTop = S.band ? earTop + S.band.top : Infinity;
  const mask = p => {
    const h = hairline(phiOf(p)); let m = sstep(h - .015, h + .1, p.y);
    if (S.band) m *= sstep(bandTop + .02, bandTop - .12, p.y);
    return m;
  };
  const capT = p => S.cap * (S.band ? 1 : 1 - .45 * sstep(earTop + .1, lobe, p.y));
  const volT = p => (S.topVol || 0) * .04 * sstep(brow + .1, top, p.y); // volume extra no alto (só nas mechas)

  // ---- corpo para colisão: cabeça + pescoço + orelhas (com folga) ----
  const earE = ears.map(e => ({ c: e.center.clone().add(V(e.s * .03, 0, 0)), r: V(.11, (e.top.y - e.lobe.y) * .58, .16) }));
  const body = (x, y, z) => {
    let d = sdf(x, y, z);
    for (const e of earE) {
      const qx = (x - e.c.x) / e.r.x, qy = (y - e.c.y) / e.r.y, qz = (z - e.c.z) / e.r.z, k = Math.sqrt(qx * qx + qy * qy + qz * qz);
      const de = (k - 1) * Math.min(e.r.x, e.r.y, e.r.z); if (de < d) d = de;
    }
    return d;
  };
  const grad = (p, out = V()) => { const e = .004; return out.set(body(p.x + e, p.y, p.z) - body(p.x - e, p.y, p.z), body(p.x, p.y + e, p.z) - body(p.x, p.y - e, p.z), body(p.x, p.y, p.z + e) - body(p.x, p.y, p.z - e)).normalize() };

  // ---------------- 1. touca ----------------
  const G = fit.skinGeo, pa = G.attributes.position, na = G.attributes.normal, N = fit.skinN, ia = G.index.array;
  const vm = new Float32Array(N), off = new Float32Array(N), p = V(), capK = S.noCap ? 0 : 1;
  for (let i = 0; i < N; i++) { p.fromBufferAttribute(pa, i); const m = mask(p); vm[i] = m; off[i] = m > 0 ? -.008 + (capT(p) * capK + .008 * capK) * Math.pow(m, 1.6) : -1 }
  const remap = new Int32Array(N).fill(-1), cPos = [], cCol = [], cIdx = [];
  const rootCand = [];
  for (let t = 0; t < ia.length; t += 3) {
    const a = ia[t], b = ia[t + 1], c = ia[t + 2]; if (a >= N || b >= N || c >= N) continue;
    if (Math.max(vm[a], vm[b], vm[c]) < .04) continue;
    for (const v of [a, b, c]) if (remap[v] < 0) {
      remap[v] = cPos.length / 3; p.fromBufferAttribute(pa, v);
      const o = Math.max(off[v], -.012), nx = na.getX(v), ny = na.getY(v), nz = na.getZ(v);
      cPos.push(p.x + nx * o, p.y + ny * o, p.z + nz * o);
      const g = .7 + .15 * vm[v] + .08 * (rand() - .5); cCol.push(g, g, g);
      if (vm[v] > .55) rootCand.push(v);
    }
    cIdx.push(remap[a], remap[b], remap[c]);
  }
  const capGeo = new THREE.BufferGeometry();
  capGeo.setAttribute('position', new THREE.Float32BufferAttribute(cPos, 3)); capGeo.setAttribute('color', new THREE.Float32BufferAttribute(cCol, 3));
  capGeo.setIndex(cIdx); capGeo.computeVertexNormals();

  // ---------------- 2. mechas ----------------
  const L = { pos: [], nor: null, col: [], uv: [], idx: [] };
  const hull = (q, o) => body(q.x, q.y, q.z) - o;
  const knot = S.knot && V(0, top + S.knot.y, zc + S.knot.z);
  const endYOf = () => {
    const e = S.endY; if (e === undefined) return -9;
    if (e === 'nape+') return yNape - .12; if (e === 'neck') return lobe - .42; if (e === 'shoulder') return neckBot + .25; if (e === 'long') return neckBot - .2; return e;
  };
  const tangent = (v, n) => v.clone().addScaledVector(n, -v.dot(n)).normalize();
  const flowDir = (q, n) => {
    if (S.flow === 'part') {
      const px = S.partX || 0, front = Math.max(q.z - zc, 0) / .9;
      return tangent(V(Math.sign(q.x - px || 1), -.35, -.25 - .4 * (1 - front)), n);
    }
    if (S.flow === 'back') return tangent(V(q.x * .35, .05, -1), n);
    if (S.flow === 'whorl') return tangent(q.clone().sub(WH), n);
    if (S.flow === 'knot') return tangent(knot.clone().sub(q), n);
    if (S.flow === 'out') return n.clone().multiplyScalar(.65).add(V(0, -.55, 0)).add(V(Math.sign(q.x), 0, 0).multiplyScalar(.2)).normalize();
    return tangent(DOWN.clone(), n);
  };
  // rosto: mechas não descem na frente do rosto — são guiadas para o lado/trás (exceto as de moldura, que caem ao lado)
  const faceness = q => { const ph = Math.abs(phiOf(q)), h = hairline(phiOf(q)); return sstep(phiE - 22 * DEG, phiE - 50 * DEG, ph) * sstep(h + .1, h - .02, q.y) };
  const sideBack = (q, sd) => { const ph = phiOf(q), sg = sd || Math.sign(ph) || 1, a = Math.abs(ph) * sg; return V(Math.cos(a), 0, -Math.sin(a)).multiplyScalar(sg) };

  function grow(r0, d0, len, o0, prm) {
    const NS = clamp(Math.round(len / .028), 8, 90), step = len / NS, pts = [r0.clone()], q = r0.clone(), dir = d0.clone(), g = V(), prev = V();
    const endY = prm.endY ?? -9;
    for (let i = 1; i <= NS; i++) {
      const t = i / NS, o = (prm.o0 ?? o0) + (o0 + (S.flare || 0) * sstep(.25, 1, t) * prm.flareK - (prm.o0 ?? o0)) * sstep(0, prm.ramp ?? .18, t);
      grad(q, g);
      const fz = prm.frame || S.over !== undefined ? 0 : faceness(q);
      let wg = (S.grav || 0) * sstep(.5, -.05, g.y) * (1 - fz);
      if (prm.attract) { const to = prm.attract.clone().sub(q); if (to.length() < S.knot.R * .9) break; dir.lerp(tangent(to.normalize(), g), .35).normalize() }
      if (fz > 0) dir.addScaledVector(sideBack(q, prm.side), fz * .6).normalize();
      dir.addScaledVector(DOWN, wg * .3).normalize();
      const hug = !prm.free && wg < .45;
      if (hug) dir.addScaledVector(g, -dir.dot(g)).normalize();
      prev.copy(q); q.addScaledVector(dir, step);
      const d = hull(q, o); grad(q, g);
      if (hug || d < 0) q.addScaledVector(g, -d);
      if (prm.over !== undefined && q.y < hairline(phiOf(q)) - prm.over) { pts.push(q.clone()); break }
      pts.push(q.clone()); dir.copy(q).sub(prev).normalize();
      if (q.y < endY) break;
    }
    return pts;
  }
  // ondas / cachos / ponta virada sobre o caminho; depois empurra para fora do corpo e suaviza
  function shape(pts, o0, prm) {
    const n = pts.length; if (n < 3) return pts;
    let s = 0; const acc = [0]; for (let i = 1; i < n; i++) { s += pts[i].distanceTo(pts[i - 1]); acc.push(s) }
    const out = [], Tn = V(), Nn = V(), Bn = V();
    for (let i = 0; i < n; i++) {
      const t = acc[i] / (s || 1), q = pts[i].clone();
      Tn.copy(pts[Math.min(n - 1, i + 1)]).sub(pts[Math.max(0, i - 1)]).normalize(); grad(q, Nn); Nn.addScaledVector(Tn, -Nn.dot(Tn)).normalize(); Bn.crossVectors(Tn, Nn);
      if (S.wave && !prm.straight) { const env = sstep(.12, .45, t) * prm.waveK, ph = acc[i] / S.wave.a * 0 + 2 * Math.PI * S.wave.f * acc[i] + prm.phase; q.addScaledVector(Bn, S.wave.a * env * Math.sin(ph)).addScaledVector(Nn, S.wave.a * .7 * env * Math.cos(ph)) }
      if (S.curl && !prm.straight && !prm.noCurl) { const R = S.curl.r[0] + (S.curl.r[1] - S.curl.r[0]) * t, env = sstep(.03, .2, t), th = 2 * Math.PI * acc[i] / S.curl.pitch + prm.phase; q.addScaledVector(Bn, R * env * Math.cos(th)).addScaledVector(Nn, R * env * Math.sin(th)) }
      if (S.flick) q.addScaledVector(Nn, S.flick * Math.pow(sstep(.7, 1, t), 2)).addScaledVector(DOWN, -S.flick * .6 * Math.pow(sstep(.75, 1, t), 2));
      if (S.tipLift) q.addScaledVector(Nn, S.tipLift * sstep(.5, 1, t));
      out.push(q);
    }
    for (let it = 0; it < 2; it++) for (let i = 1; i < n - 1; i++) out[i].lerp(out[i - 1].clone().add(out[i + 1]).multiplyScalar(.5), .35);
    const g = V(); for (let i = 1; i < n; i++) { const q = out[i], d = hull(q, o0 * .6 + .006); if (d < 0) { grad(q, g); q.addScaledVector(g, -d) } }
    return out;
  }
  // tubo achatado (lado largo virado para fora), afinando; cores = luz e sombra (raiz e parte de dentro mais escuras, fios)
  function addTube(pts, width, thick, prm) {
    const n = pts.length; if (n < 2) return;
    const seg = prm.seg || 10, base = L.pos.length / 3, Tn = V(), Nn = V(), Bn = V(), tone = .9 + .2 * rand(), strands = [];
    for (let j = 0; j < seg; j++) strands.push(.8 + .2 * rand());
    let s = 0; const acc = [0]; for (let i = 1; i < n; i++) { s += pts[i].distanceTo(pts[i - 1]); acc.push(s) }
    for (let i = 0; i < n; i++) {
      const t = acc[i] / (s || 1);
      Tn.copy(pts[Math.min(n - 1, i + 1)]).sub(pts[Math.max(0, i - 1)]).normalize();
      if (prm.normal) Nn.copy(prm.normal(i, pts[i])); else grad(pts[i], Nn);
      Bn.crossVectors(Tn, Nn).normalize(); Nn.crossVectors(Bn, Tn).normalize();
      const prof = prm.profile ? prm.profile(t) : (.75 + .25 * sstep(0, .12, t)) * Math.pow(1 - sstep(prm.taper ?? .62, 1, t), .55);
      const rw = Math.max(width * prof, .0015), rh = Math.max(thick * (prm.round ? prof : (.55 + .45 * prof)), .0012);
      for (let j = 0; j < seg; j++) {
        const al = j / seg * Math.PI * 2, c = Math.cos(al), sn = Math.sin(al), groove = 1 - .1 * (.5 + .5 * Math.cos(al * 3)) * (sn > 0 ? 1 : 0);
        const x = c * rw * groove, y = sn * rh;
        L.pos.push(pts[i].x + Bn.x * x + Nn.x * y, pts[i].y + Bn.y * x + Nn.y * y, pts[i].z + Bn.z * x + Nn.z * y);
        const shade = (.55 + .45 * sstep(0, .22, t)) * (.7 + .3 * (.5 + .5 * sn)) * tone * strands[j] * (1 + .12 * t) * (prm.dark ?? 1) * 1.15;
        L.col.push(shade, shade, shade); L.uv.push(t, j / seg);
      }
    }
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < seg; j++) {
      const a = base + i * seg + j, b = base + i * seg + (j + 1) % seg, c = a + seg, d = b + seg; L.idx.push(a, c, b, b, c, d);
    }
  }

  const endY = endYOf(), frameN = S.faceFrame || 0;
  // ---------------- 2a. mechas em faixa contínua (superfície esculpida) ----------------
  // sementes ordenadas ao longo de uma linha (risca, linha da frente, círculo do redemoinho, contorno do coque);
  // de cada semente sai uma linha de fluxo; entre duas linhas vizinhas nasce uma mecha (faixa abaulada, sulco nas
  // bordas, ponta fina). Vizinhas compartilham a borda → cabelo sem buracos, com volume e pontas em mecha.
  const yc0 = fit.cy - .05;
  const surfDir = (dx, dy, dz, cx = 0, cy = yc0, czz = zc) => { // ponto da superfície do corpo a partir de um centro interno
    let r = 1.8; for (let k = 0; k < 90; k++) { const d = body(cx + dx * r, cy + dy * r, czz + dz * r); if (Math.abs(d) < 2e-4) break; r -= d * .9 } return V(cx + dx * r, cy + dy * r, czz + dz * r);
  };
  const seedPath = (side) => {
    const pts = [];
    if (S.flow === 'part') { // ao longo da risca: da linha do cabelo na frente, por cima, até a nuca
      const px = S.partX || 0, b0 = Math.atan2(hf - yc0 - .03, .75), b1 = Math.PI + .9;
      for (let i = 0; i <= 400; i++) { const bb = b0 + (b1 - b0) * i / 400; const q = surfDir(0, Math.sin(bb), Math.cos(bb), px, yc0, zc); if (q.y < yNape + .15 && i > 100) break; pts.push(q) }
    } else if (S.flow === 'back') { // linha da frente, de têmpora a têmpora
      const lim = phiE - 30 * DEG;
      for (let i = 0; i <= 300; i++) { const ph = -lim + 2 * lim * i / 300, y = hairline(ph) + .05; const r = traceR(body, y, ph, zc); pts.push(V(Math.sin(ph) * r, y, zc + Math.cos(ph) * r)) }
    } else if (S.flow === 'whorl') {
      const W = WH;
      for (let i = 0; i < (S.lines || 48); i++) { const a2 = i / (S.lines || 48) * Math.PI * 2, q = W.clone().add(V(Math.cos(a2) * .06, 0, Math.sin(a2) * .06)); pts.push(surfDir(...q.clone().sub(V(0, yc0, zc)).normalize().toArray())) }
      return pts;
    } else if (S.flow === 'knot') {
      for (let i = 0; i < 400; i++) { const ph = -Math.PI + 2 * Math.PI * i / 400, y = hairline(ph) + .05, r = traceR(body, y, ph, zc); pts.push(V(Math.sin(ph) * r, y, zc + Math.cos(ph) * r)) }
    }
    // reamostra com espaçamento fixo
    const out = [pts[0]]; let acc = 0;
    for (let i = 1; i < pts.length; i++) { acc += pts[i].distanceTo(pts[i - 1]); if (acc >= S.seed) { out.push(pts[i]); acc = 0 } }
    return out;
  };
  const closed = S.flow === 'whorl' || S.flow === 'knot', DBG = [];
  const WH = surfDir(0, Math.cos(.62), -Math.sin(.62));
  function sheet(side, layer) {
    const seeds = seedPath(side), lines = [], NSd = seeds.length;
    seeds.forEach((sd, i) => {
      const n = grad(sd), edge = closed ? 1 : S.flow === 'part' ? sstep(0, 3, i) : sstep(0, 3, i) * sstep(NSd - 1, NSd - 4, i);
      const base = capT(sd), o = base + ((layer ? S.layer * .3 : S.layer) + volT(sd) + (S.lift || 0) * sstep(brow + .15, top, sd.y)) * (.25 + .75 * edge);
      const r0 = sd.clone().addScaledVector(n, base * .4);
      let d0 = flowDir(r0, n); if (S.flow === 'part') d0 = tangent(V(side, -.25, -.15), n);
      const [l0, l1] = S.len, len = l0 + (l1 - l0) * (.5 + .5 * Math.sin(i * 1.7 + side));
      const prm = { endY: endY + .1 * Math.sin(i * .9 + side * 2) + .07 * rand() + (layer ? .06 : 0), flareK: (.8 + .3 * Math.sin(i * .5)) * (layer ? .55 : 1), over: S.over, attract: knot,
        side: S.flow === 'part' ? side : 0, phase: i * .32 + side * 1.3 + (layer ? .6 : 0), waveK: 1, lenRef: len, o0: base * .4, noCurl: true };
      const pts = shape(grow(r0, d0, len, o, prm), o, prm);
      lines.push(pts); DBG.push([side, layer, i, pts.length, +arcLen(pts).toFixed(2), pts[0].toArray().map(v => +v.toFixed(2)), pts[pts.length - 1].toArray().map(v => +v.toFixed(2))]);
    });
    const M = clamp(Math.round(Math.max(...lines.map(arcLen)) / .028), 6, 110), R = lines.map(l => resample(l, M));
    const nStrip = closed ? R.length : R.length - 1;
    for (let i = 0; i < nStrip; i++) strip(R[i], R[(i + 1) % R.length], layer ? .62 : 1, i);
  }
  const arcLen = l => { let s2 = 0; for (let i = 1; i < l.length; i++) s2 += l[i].distanceTo(l[i - 1]); return s2 };
  function resample(l, M) {
    const acc = [0]; for (let i = 1; i < l.length; i++) acc.push(acc[i - 1] + l[i].distanceTo(l[i - 1]));
    const tot = acc[acc.length - 1] || 1e-6, out = []; let j = 1;
    for (let m = 0; m < M; m++) { const d = tot * m / (M - 1); while (j < l.length - 1 && acc[j] < d) j++; const t = (d - acc[j - 1]) / ((acc[j] - acc[j - 1]) || 1); out.push(l[j - 1].clone().lerp(l[j], clamp(t, 0, 1))) }
    return out;
  }
  function strip(A, B, dark, sid) {
    for (let m = 0; m < A.length; m++) if (A[m].distanceTo(B[m]) > (S.maxStrip || .32)) return;
    const M = A.length, K = 6, base = L.pos.length / 3, nrm = V(), mid = V(), q = V(), tone = (.9 + .2 * rand()) * dark, tipS = S.tip ?? .8;
    for (let m = 0; m < M; m++) {
      const u = m / (M - 1); mid.copy(A[m]).add(B[m]).multiplyScalar(.5); grad(mid, nrm);
      const wdt = A[m].distanceTo(B[m]), w = Math.pow(1 - sstep(tipS, 1, u), .65), bul = Math.min(S.bulge ?? .03, wdt * .32) * sstep(0, .12, u) * (.4 + .6 * w);
      for (let k = 0; k <= K; k++) {
        const sk = k / K; q.copy(A[m]).lerp(B[m], sk).sub(mid).multiplyScalar(w).add(mid).addScaledVector(nrm, bul * Math.sin(Math.PI * sk));
        L.pos.push(q.x, q.y, q.z);
        const sh = (.6 + .4 * Math.pow(Math.sin(Math.PI * sk), .6)) * (.6 + .4 * sstep(0, .2, u)) * tone * (.93 + .07 * Math.sin(sk * Math.PI * 5 + sid)) * (1 + .1 * u) * 1.1;
        L.col.push(sh, sh, sh); L.uv.push(u, sk);
      }
    }
    for (let m = 0; m < M - 1; m++) for (let k = 0; k < K; k++) { const a2 = base + m * (K + 1) + k, b2 = a2 + 1, c2 = a2 + K + 1, d2 = c2 + 1; L.idx.push(a2, b2, c2, b2, d2, c2) }
  }
  if (!S.tubesOnly) {
    if (S.flow === 'part') for (const side of [-1, 1]) { if (S.inner !== false) sheet(side, 1); sheet(side, 0) }
    else { if (S.inner !== false && !closed) sheet(1, 1); sheet(1, 0) }
  }
  // ---------------- 2b. mechas soltas em tubo (cachos, palhaço) ----------------
  const roots = [];
  if (S.tubes) {
    const cand = rootCand.slice();
    for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [cand[i], cand[j]] = [cand[j], cand[i]] }
    const sp2 = S.spacing * S.spacing;
    for (const v of cand) {
      if (roots.length >= S.n) break;
      p.fromBufferAttribute(pa, v); if (S.band && p.y > bandTop - .02) continue;
      if (roots.some(r => r.p.distanceToSquared(p) < sp2)) continue;
      roots.push({ p: p.clone(), n: V(na.getX(v), na.getY(v), na.getZ(v)), v });
    }
  }
  roots.forEach((r, k) => {
    const o = capT(r.p) * .55, r0 = r.p.clone().addScaledVector(r.n, o), d0 = flowDir(r0, r.n);
    const [l0, l1] = S.len, len = l0 + (l1 - l0) * rand(), layer = (S.layer || 0) * (.6 + .9 * rand());
    const prm = { endY: endY + (rand() - .3) * .2, flareK: .8 + .6 * rand(), over: S.over, attract: knot, phase: rand() * 6.283, waveK: .7 + .5 * rand(), lenRef: len, o0: o };
    const pts = grow(r0, d0, len, capT(r.p) + layer, prm);
    addTube(shape(pts, capT(r.p) + layer, prm), S.w * (.8 + .4 * rand()), S.th * (.85 + .3 * rand()), { round: !!S.curl, seg: S.curl ? 8 : 10 });
  });
  for (let k = 0; k < frameN; k++) { // mechas de moldura (soltas na frente da orelha)
    const s = k % 2 ? 1 : -1, j = Math.floor(k / 2), ph = (phiE - (30 + j * 7) * DEG) * s, y = hairline(ph) + .06;
    const dir0 = V(Math.sin(ph), 0, Math.cos(ph)), rr = traceR(sdf, y, ph, zc), r0 = V(dir0.x * rr, y, zc + dir0.z * rr), g0 = grad(r0);
    const o = S.cap + .03 + j * .02; r0.addScaledVector(g0, o);
    const prm = { endY: endY + .25 + j * .1 + rand() * .15, flareK: .4, frame: true, phase: rand() * 6.283, waveK: 1, lenRef: 2 };
    const pts = grow(r0, tangent(V(s * .3, -1, .1), g0), 2.4, o, prm);
    addTube(shape(pts, o, prm), S.w * 1.05, S.th, { round: !!S.curl, seg: S.curl ? 8 : 10 });
  }
  for (let k = 0; k < (S.wisps || 0); k++) { // fios soltos (coque): finos, ondulados, na frente da orelha
    const s = k % 2 ? 1 : -1, ph = (phiE - 32 * DEG) * s, y = yTemple + .02, rr = traceR(sdf, y, ph, zc), r0 = V(Math.sin(ph) * rr, y, zc + Math.cos(ph) * rr), g0 = grad(r0);
    r0.addScaledVector(g0, .015);
    const prm = { endY: P.mouthY - .05, flareK: 0, frame: true, phase: k * 2, waveK: 1.6, lenRef: 1, o0: .015 };
    const pts = grow(r0, tangent(V(s * .2, -1, -.05), g0), 1.2, .03, prm);
    addTube(shape(pts, .03, prm), .03, .012, { seg: 6 });
  }

  // ---- coque: bola enrolada + base ----
  const extra = [];
  if (knot) {
    const R = S.knot.R, ball = new THREE.SphereGeometry(R * .9, 28, 20); ball.translate(knot.x, knot.y, knot.z);
    setGray(ball, .62); extra.push(ball);
    if(!S.curlBun){
    const pts = [], TURNS = 7; for (let i = 0; i <= 260; i++) { const s = i / 260, th = .25 + s * (Math.PI - .5), ph = s * TURNS * 2 * Math.PI; pts.push(V(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)).multiplyScalar(R * .93).add(knot)) }
    addTube(pts, R * .3, R * .16, { normal: (i, q) => q.clone().sub(knot).normalize(), profile: t => Math.min(1, sstep(0, .03, t) + .25) * (1 - .4 * sstep(.97, 1, t)), seg: 10 });
    }else{
      // Cachos curtos cobrem o coque da Nana, sem adicionar outro sistema de cabelo.
      for(let k=0;k<28;k++){
        const y=1-2*(k+.5)/28,phi=k*2.399963,n=V(Math.sqrt(1-y*y)*Math.cos(phi),y,Math.sqrt(1-y*y)*Math.sin(phi));
        const u=V(0,1,0).cross(n).normalize(),v=n.clone().cross(u),center=knot.clone().addScaledVector(n,R*.91),pts=[];
        for(let i=0;i<=36;i++){const t=i/36,a=t*Math.PI*4;pts.push(center.clone().addScaledVector(u,Math.cos(a)*R*.2).addScaledVector(v,Math.sin(a)*R*.2).addScaledVector(n,(t-.5)*R*.3))}
        addTube(pts,.035,.032,{round:true,seg:8});
      }
    }
    if (S.tail) { // rabo: cai do coque
      for (let k = 0; k < S.tail.n; k++) {
        const a = (k / S.tail.n) * Math.PI * 2, r0 = knot.clone().add(V(Math.cos(a) * R * .5, -R * .3 + Math.sin(a) * R * .3, -R * .55)), d0 = V(Math.cos(a) * .2, -.3, -1).normalize();
        const prm = { endY: S.tail.endY + rand() * .25, flareK: .5, free: false, phase: rand() * 6.283, waveK: 1, lenRef: 2, frame: true };
        const save = S.wave; S.wave = { a: S.tail.wave, f: 1.6 };
        const pts = grow(r0, d0, 2.6, .05 + rand() * .05, prm); addTube(shape(pts, .05, prm), .075 * (.8 + .4 * rand()), .028, { seg: 10 });
        S.wave = save;
      }
    }
  }
  // ---- tranças (3 fios entrelaçados) com argolas opcionais ----
  const rings = [];
  if (S.braids) {
    const B = S.braids;
    for (const s of [-1, 1]) {
      const ph = s * (B.at === 'temple' ? phiE - 26 * DEG : phiE + 18 * DEG), y = B.at === 'temple' ? yTemple - .02 : earTop + .02;
      const rr = traceR(sdf, y, ph, zc), r0 = V(Math.sin(ph) * rr, y, zc + Math.cos(ph) * rr), g0 = grad(r0); r0.addScaledVector(g0, S.cap + .06);
      const prm = { endY: y - B.len, flareK: .2, frame: true, phase: 0, waveK: 0, lenRef: 1, straight: true };
      const path = shape(grow(r0, tangent(V(s * .2, -1, B.at === 'temple' ? .15 : -.1), g0), B.len * 1.2, S.cap + .07, prm), S.cap + .07, prm);
      braid(path, B.r);
      if (B.rings) for (const t of [.35, .7]) rings.push({ p: path[Math.floor(t * (path.length - 1))], d: path[Math.floor(t * (path.length - 1)) + 1].clone().sub(path[Math.floor(t * (path.length - 1))]).normalize(), r: B.r * 1.25 });
    }
  }
  function braid(path, r) {
    const n = path.length; if (n < 3) return;
    let s = 0; const acc = [0]; for (let i = 1; i < n; i++) { s += path[i].distanceTo(path[i - 1]); acc.push(s) }
    const NS = Math.max(24, Math.round(s / .012)), res = [];
    for (let k = 0; k <= NS; k++) { const d = s * k / NS; let i = 1; while (i < n - 1 && acc[i] < d) i++; const t = (d - acc[i - 1]) / ((acc[i] - acc[i - 1]) || 1); res.push(path[i - 1].clone().lerp(path[i], t)) }
    const Tn = V(), Nn = V(), Bn = V();
    for (let f = 0; f < 3; f++) {
      const pts = [];
      res.forEach((q, i) => {
        Tn.copy(res[Math.min(NS, i + 1)]).sub(res[Math.max(0, i - 1)]).normalize(); grad(q, Nn); Nn.addScaledVector(Tn, -Nn.dot(Tn)).normalize(); Bn.crossVectors(Tn, Nn);
        const th = (s * i / NS) / (r * 2.2) * Math.PI * 2 + f * 2.094, taper = 1 - .55 * sstep(.8, 1, i / NS);
        pts.push(q.clone().addScaledVector(Bn, Math.sin(th) * r * .55 * taper).addScaledVector(Nn, Math.sin(2 * th) * r * .22 * taper));
      });
      addTube(pts, r * .55, r * .4, { round: true, seg: 8, profile: t => (1 - .5 * sstep(.85, 1, t)) * (.85 + .15 * sstep(0, .05, t)) });
    }
  }

  // ---------------- materiais e malhas ----------------
  const hex = new THREE.Color(color);
  const mat = new THREE.MeshPhysicalMaterial({ name: 'Hair', color: hex, vertexColors: true, roughness: .42, metalness: 0, sheen: .7, sheenRoughness: .45, sheenColor: hex.clone().lerp(new THREE.Color('#ffffff'), .45), specularIntensity: .9, anisotropy: .85, clearcoat: .2, clearcoatRoughness: .45, side: THREE.DoubleSide });
  mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n if (!gl_FrontFacing) diffuseColor.rgb *= .42;') }; mat.customProgramCacheKey = () => 'hair-v1';
  const capMat = new THREE.MeshPhysicalMaterial({ name: 'Hair_Base', color: hex, vertexColors: true, roughness: .6, sheen: .4, sheenColor: hex.clone().lerp(new THREE.Color('#ffffff'), .3) });
  const group = new THREE.Group(); group.name = 'Hair_' + id;
  const capMesh = new THREE.Mesh(capGeo, capMat); capMesh.name = 'Hair_Cap'; group.add(capMesh);
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.Float32BufferAttribute(L.pos, 3)); lg.setAttribute('color', new THREE.Float32BufferAttribute(L.col, 3)); lg.setAttribute('uv', new THREE.Float32BufferAttribute(L.uv, 2));
  lg.setIndex(L.idx); lg.computeVertexNormals(); unit(lg); lg.computeTangents();
  const locks = new THREE.Mesh(lg, mat); locks.name = 'Hair_Locks'; group.add(locks);
  for (const g of extra) { g.deleteAttribute('uv'); const m = new THREE.Mesh(g, capMat); m.name = 'Hair_Bun'; group.add(m) }
  let ringMat = null;
  if (rings.length) {
    ringMat = new THREE.MeshPhysicalMaterial({ name: 'Hair_Ring', color: '#b88a3e', metalness: 1, roughness: .32 });
    const geos = rings.map(r => { const g = new THREE.CylinderGeometry(r.r, r.r, r.r * 1.1, 20, 1, false); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), r.d)); g.translate(r.p.x, r.p.y, r.p.z); g.deleteAttribute('uv'); return g });
    const m = new THREE.Mesh(merge(geos), ringMat); m.name = 'Hair_Rings'; group.add(m);
  }
  group.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } });
  group.userData.timing = Math.round(performance.now() - T0); group.userData.dbg = DBG;
  return {
    group, material: mat, meshes: group.children.filter(o => o.isMesh),
    setColor(c) { mat.color.set(c); mat.sheenColor.set(c).lerp(new THREE.Color('#ffffff'), .45); capMat.color.set(c); capMat.sheenColor.set(c).lerp(new THREE.Color('#ffffff'), .3) },
    dispose() { group.traverse(o => { if (o.isMesh) o.geometry.dispose() }); mat.dispose(); capMat.dispose(); if (ringMat) ringMat.dispose() }
  };
}

// raio da cabeça numa altura y e ângulo ph (a partir do eixo vertical z = zc)
function traceR(sdf, y, ph, zc) { const dx = Math.sin(ph), dz = Math.cos(ph); let r = 1.6; for (let k = 0; k < 80; k++) { const d = sdf(dx * r, y, zc + dz * r); if (Math.abs(d) < 1e-4) break; r -= d * .9 } return r }
function setGray(g, v) { const n = g.attributes.position.count, c = new Float32Array(n * 3).fill(v); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g }
function unit(g) { const n = g.attributes.normal.array; for (let i = 0; i < n.length; i += 3) { const l = Math.hypot(n[i], n[i + 1], n[i + 2]); if (l > 1e-8) { n[i] /= l; n[i + 1] /= l; n[i + 2] /= l } else { n[i] = 0; n[i + 1] = 0; n[i + 2] = 1 } } return g }
function merge(list) {
  let nv = 0, ni = 0; for (const g of list) { nv += g.attributes.position.count; ni += g.index.count }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), idx = new Uint32Array(ni); let ov = 0, oi = 0;
  for (const g of list) { pos.set(g.attributes.position.array, ov * 3); nor.set(g.attributes.normal.array, ov * 3); const a = g.index.array; for (let i = 0; i < a.length; i++) idx[oi + i] = a[i] + ov; ov += g.attributes.position.count; oi += a.length; g.dispose() }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); m.setIndex(new THREE.BufferAttribute(idx, 1)); return m;
}
