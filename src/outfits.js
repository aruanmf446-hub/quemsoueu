// Figurinos esculpidos (referências): palhaço de circo, orc guerreiro, anão aventureiro, falcoeiro do deserto,
// sereia pérola e sereia rubi.
//
// Método: cada peça de tecido é um campo de distância construído a partir do próprio corpo — o corpo "inflado" pela
// espessura do tecido, recortado por planos e faixas (gola, barra, manga, cano da bota), mais volumes próprios
// (bombacha, saia/cauda de casaco, capa, cauda de sereia) com pregas por ondulação. A malha sai pelo mesmo
// surface nets do corpo, então o tecido acompanha a anatomia, tem espessura e volume, sem atravessar a pele.
// Peças rígidas (fivelas, botões, espinhos, caveira, pompons, frascos, pérolas) são primitivas.
// Nadadeiras, babados e véus são superfícies finas de dupla face. Cores por canal, trocadas ao vivo.
import * as THREE from 'three';
import { sdfMesh, roundCone, ellip } from './body.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const { clamp } = THREE.MathUtils;
const sqrt = Math.sqrt, PI = Math.PI;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) };
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * .25 };
const smax = (a, b, k) => -smin(-a, -b, k);
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ---------- catálogo ----------
export const SDF_OUTFITS = {
  circus: { label: 'Palhaço de circo', sub: 'Macacão listrado, gola franzida, casaca de estrelas, sapatões', channels: ['fabric', 'secondary', 'accent', 'leather', 'trim'] },
  orc: { label: 'Guerreiro orc', sub: 'Ombreira de espinhos, caveira no cinto, tanga e braçadeiras', channels: ['fabric', 'leather', 'trim', 'secondary'] },
  adventurer: { label: 'Aventureiro', sub: 'Camisa, gibão, capa, bolsas, bússola e botas', channels: ['fabric', 'secondary', 'accent', 'pants', 'leather', 'trim'] },
  desert: { label: 'Falcoeiro do deserto', sub: 'Túnica, faixa e capa azuis, bombacha, botas trançadas', channels: ['fabric', 'secondary', 'pants', 'leather', 'trim'] },
  mermaid_pearl: { label: 'Sereia pérola', sub: 'Cauda de escamas, top de pérolas, véus nos braços', channels: ['fabric', 'accent', 'secondary', 'trim'], mermaid: true },
  mermaid_ruby: { label: 'Sereia rubi', sub: 'Cauda negra e vermelha, joias, frascos, véus rubi', channels: ['fabric', 'accent', 'secondary', 'trim'], mermaid: true }
};
export const SDF_DEFAULT_COLORS = {
  circus: { fabric: '#9e2a2b', secondary: '#eadcbf', accent: '#3d4f8a', leather: '#8e2a26', trim: '#d4a640' },
  orc: { fabric: '#a3302a', leather: '#4a3326', trim: '#8c8a86', secondary: '#e8dcc0' },
  adventurer: { fabric: '#34507e', secondary: '#ece4d4', accent: '#8e3326', pants: '#3a3836', leather: '#6b4228', trim: '#c99a3e' },
  desert: { fabric: '#2f4fb5', secondary: '#f1e9d8', pants: '#ece2cc', leather: '#5a3a24', trim: '#d4a640' },
  mermaid_pearl: { fabric: '#f3f1ee', accent: '#4f8fd8', secondary: '#f5efe6', trim: '#d4a640' },
  mermaid_ruby: { fabric: '#17111a', accent: '#c4161f', secondary: '#1c1418', trim: '#d4a640' }
};
export const SDF_DEFAULT_OUTFIT = { sad_clown: 'circus', orc_warrior: 'orc', dwarf_bard: 'adventurer', masculine_soft: 'desert', feminine_soft: 'mermaid_pearl', feminine_bold: 'mermaid_ruby' };

// material de dois tons: mistura a cor do canal A com a do canal B pelo atributo "mixc" (degradês de cauda e nadadeira)
export function twoTone(name, a, b, o = {}) {
  const { scales, dark, ...mo } = o;
  const m = new THREE.MeshPhysicalMaterial({ name, color: a, roughness: .45, ...mo });
  m.userData.colorB = new THREE.Color(b); const uB = { value: m.userData.colorB };
  m.onBeforeCompile = sh => {
    sh.uniforms.uColorB = uB;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float mixc;\nattribute float shade;\nvarying float vMix;\nvarying float vShade;\nvarying vec3 vObj;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMix = mixc; vShade = shade; vObj = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uColorB;\nvarying float vMix;\nvarying float vShade;\nvarying vec3 vObj;\n' + (o.scales ? SCALES : ''))
      .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, uColorB, clamp(vMix, 0., 1.)) * vShade;' + (o.scales ? '\n diffuseColor.rgb *= scalePattern(vObj);' : '') + (o.dark ? '\n if (!gl_FrontFacing) diffuseColor.rgb *= .6;' : ''));
  };
  m.customProgramCacheKey = () => 'twotone-' + (o.scales ? 's' : '') + (o.dark ? 'd' : '');
  return m;
}
// listras pelo material (bordas nítidas, sem dividir a malha): eixo x (vertical) ou y (horizontal), 2 ou 3 cores
export function stripeMaterial(name, cols, axis, width, o = {}) {
  const m = new THREE.MeshPhysicalMaterial({ name, color: '#ffffff', roughness: .78, sheen: .35, sheenRoughness: .6, side: THREE.DoubleSide, ...o });
  m.userData.cols = cols.map(c => new THREE.Color(c)); const u = { uC1: { value: m.userData.cols[0] }, uC2: { value: m.userData.cols[1] }, uC3: { value: m.userData.cols[2] || m.userData.cols[0] } };
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vObjS;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvObjS = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uC1, uC2, uC3;\nvarying vec3 vObjS;')
      .replace('#include <color_fragment>', `#include <color_fragment>
 float sv = ${axis === 'x' ? 'vObjS.x' : 'vObjS.y'} / ${width.toFixed(4)} + 30.5; float k = mod(floor(sv), ${cols.length}.0);
 diffuseColor.rgb *= (k < .5 ? uC1 : (k < 1.5 ? uC2 : uC3));`);
  };
  m.customProgramCacheKey = () => 'stripe-' + axis + cols.length + width.toFixed(3);
  return m;
}
// escamas: células em fileiras deslocadas no espaço (ângulo em volta do eixo, altura); borda de cada escama mais escura
// e um brilho no centro → lê como escama de sereia sem textura de imagem
const SCALES = `
float scalePattern(vec3 p){
  float ang = atan(p.x, p.z + 0.15) * 0.62; float s = 0.085;
  vec2 q = vec2(ang / s, p.y / (s * 0.8));
  float row = floor(q.y); q.x += mod(row, 2.0) * 0.5;
  vec2 c = fract(q) - vec2(0.5, 0.15);
  float d = length(vec2(c.x, c.y * 0.9));
  float edge = smoothstep(0.42, 0.52, d);
  float hi = 1.0 - smoothstep(0.0, 0.38, d);
  return mix(1.0 + 0.18 * hi, 0.55, edge);
}`;

export function buildSdfOutfit(body, style, colors, mats, add, addGeo) {
  const J = body.joints, B = body.proportions, W = J.W, Y = J.Y, z0 = J.zCenter, Lb = J.Lb, bf = body.sdf, yN = J.yNeck;
  const S = J.shoulder, E = J.elbow, Wr = J.wrist, H = J.hip, K = J.knee, A = J.ankle, ySole = J.ySole;
  const dU = E.clone().sub(S).normalize(), dF = Wr.clone().sub(E).normalize();
  const cellBase = .03 * clamp(W, 1, 1.25);
  const bx = J.bounds.x, zA = J.bounds.z0, zB = J.bounds.z1;
  // lado do braço: plano bissetor entre a lateral do tronco e o braço (axila)
  const aDir = V(dU.x, dU.y, 0).normalize(), bis = V(aDir.x, aDir.y - 1, 0).normalize(), nArm = V(-bis.y, bis.x, 0); if (nArm.x < 0) nArm.negate();
  const armSide = (ax, y) => (ax - S.x) * nArm.x + (y - S.y) * nArm.y;
  const along = (ax, y, z, P0, d) => (ax - P0.x) * d.x + (y - P0.y) * d.y + (z - P0.z) * d.z;
  const segD = (ax, y, z, a, b) => { const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z, t = clamp(((ax - a.x) * abx + (y - a.y) * aby + (z - a.z) * abz) / (abx * abx + aby * aby + abz * abz), 0, 1); return Math.hypot(ax - a.x - abx * t, y - a.y - aby * t, z - a.z - abz * t) };
  const phiOf = (x, z) => Math.atan2(x, z - z0); // 0 = frente
  // superfície do corpo: z da frente/de trás numa coluna (x, y); raio horizontal numa direção
  const bT = (x, y, z) => armSide(Math.abs(x), y) > .02 ? Math.max(bf(x, y, z), .05) : bf(x, y, z); // só tronco/pernas (ignora braços e mãos)
  const frontZ = (x, y) => { let z = zB + .5; for (let k = 0; k < 120; k++) { const d = bT(x, y, z); if (d < 1e-3) break; z -= Math.max(d * .9, .004); if (z < zA - .5) return z0 } return z };
  const backZ = (x, y) => { let z = zA - .5; for (let k = 0; k < 120; k++) { const d = bT(x, y, z); if (d < 1e-3) break; z += Math.max(d * .9, .004); if (z > zB + .5) return z0 } return z };
  const radAt = (y, ph, cz = z0, cx = 0) => { const dx = Math.sin(ph), dz = Math.cos(ph); let r = 2.5 * W + 1; for (let k = 0; k < 120; k++) { const d = bT(cx + dx * r, y, cz + dz * r); if (d < 1e-3) break; r -= Math.max(d * .9, .004); if (r < .01) return .01 } return r };
  const onFront = (x, y, off = 0) => V(x, y, frontZ(x, y) + off);
  const limbR = (P0, dir, side = 1) => { const up = Math.abs(dir.y) > .9 ? V(1, 0, 0) : V(0, 1, 0), n = up.clone().cross(dir).normalize(); let r = .02; while (r < 1.5 && bf(P0.x * side + n.x * r, P0.y + n.y * r, P0.z + n.z * r) < 0) r += .01; return r };
  const bodyBounds = (y0, y1, extra = .3) => ({ x: bx + extra, y0, y1, z0: zA - extra, z1: zB + extra });
  const piece = (name, channel, f, bounds, cell = cellBase) => { const g = sdfMesh(f, bounds, cell); if (g.attributes.position.count) add(name, g, channel); else g.dispose() };
  const tubeG = (pts, r, seg = 8) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(12, pts.length * 4), r, seg, false);
  const sph = (p, r, sx = 1, sy = 1, sz = 1, w = 14, h = 10) => { const g = new THREE.SphereGeometry(r, w, h); g.scale(sx, sy, sz); g.translate(p.x, p.y, p.z); return g };
  const orient = (g, p, dir, up = V(0, 1, 0)) => { const zz = dir.clone().normalize(), xx = up.clone().cross(zz); if (xx.lengthSq() < 1e-6) xx.set(1, 0, 0); xx.normalize(); const yy = zz.clone().cross(xx); g.applyMatrix4(new THREE.Matrix4().makeBasis(xx, yy, zz).setPosition(p)); return g };
  const mirror = (fn) => { fn(1); fn(-1) };
  const starShape = (r0, r1, n = 5) => { const s = new THREE.Shape(); for (let k = 0; k <= n * 2; k++) { const a = k / (n * 2) * PI * 2, r = k % 2 ? r1 : r0; k ? s.lineTo(Math.sin(a) * r, Math.cos(a) * r) : s.moveTo(Math.sin(a) * r, Math.cos(a) * r) } return s };
  const flatOnBody = (shape, x, y, depth, rot = 0, lift = .012) => { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: depth * .4, bevelSize: depth * .4, bevelSegments: 1, curveSegments: 8 }); g.rotateZ(rot); const p = onFront(x, y, lift); const e = .03, n = V(bf(x + e, y, p.z) - bf(x - e, y, p.z), bf(x, y + e, p.z) - bf(x, y - e, p.z), bf(x, y, p.z + e) - bf(x, y, p.z - e)).normalize(); return orient(g, p, n) };
  // ---- peças base ----
  // camisa/túnica/gibão: corpo + espessura, gola, barra, manga até um ponto do braço; folgas e pregas opcionais
  function top(name, ch, o) {
    const sleeveEnd = o.sleeve === 'wrist' ? Wr.clone().addScaledVector(dF, -.02) : o.sleeve === 'elbow' ? E.clone().addScaledVector(dF, .15 * Lb * .1) : o.sleeve === 'short' ? S.clone().addScaledVector(dU, S.distanceTo(E) * (o.short ?? .55)) : null;
    const sDir = o.sleeve === 'wrist' || o.sleeve === 'elbow' ? dF : dU;
    const yTop = yN + (o.collar ?? .02), yBot = Y(o.bottom);
    const f = (x, y, z) => {
      const ax = Math.abs(x), as = armSide(ax, y);
      let t = o.t + (o.loose || 0) * sstep(Y(.2), Y(.38), y) + (o.puff || 0) * sstep(-.1, .4, as) * (sleeveEnd ? Math.sin(PI * clamp(along(ax, y, z, S, sDir) / Math.max(.01, along(sleeveEnd.x, sleeveEnd.y, sleeveEnd.z, S, sDir)), 0, 1)) : 1);
      if (o.folds) t += o.folds * (.5 + .5 * Math.sin(phiOf(x, z) * 14 + y * 3)) * sstep(Y(.3), Y(.5), y);
      let d = bf(x, y, z) - t;
      const neck = y - yTop + (o.vneck ? o.vneck * Math.max(0, 1 - ax / .25) * sstep(z0, z0 + .3, z) : 0) * 1;
      d = smax(d, neck, .02); d = Math.max(d, yBot - y);
      if (sleeveEnd) d = Math.max(d, Math.min(along(ax, y, z, sleeveEnd, sDir), as + .1 * W)); else d = Math.max(d, as - (o.shoulderPad ?? .08) * W);
      if (o.open) { const ph = Math.abs(phiOf(x, z)); d = Math.max(d, (o.open - ph) * .4) }
      return d;
    };
    piece(name, ch, f, { x: bx + .3, y0: yBot - .3, y1: yTop + .3, z0: zA - .3, z1: zB + .4 }, o.cell);
  }
  // calça: pernas + espessura; bombacha (volume no meio, franzida no tornozelo); termina acima do tornozelo
  function pants(name, ch, o) {
    const yTop = Y(o.top), yBot = A.y + (o.cuff ?? .05) * Lb;
    const f = (x, y, z) => {
      const ax = Math.abs(x); if (armSide(ax, y) > 0 && y > Y(.5)) return 1;
      const u = clamp((yTop - y) / (yTop - yBot), 0, 1);
      let t = o.t + (o.puff || 0) * Math.pow(Math.sin(PI * clamp((u - .05) / .95, 0, 1)), .8) * (1 - .6 * sstep(.85, 1, u));
      if (o.folds) t += o.folds * (.5 + .5 * Math.sin(Math.atan2(ax - K.x, z - z0) * 9 + y * 4));
      let d = bf(x, y, z) - t; d = Math.max(d, y - yTop, yBot - y);
      if (o.stripes) d = Math.max(d, o.stripes(x, y, z));
      return d;
    };
    piece(name, ch, f, { x: Math.max(H.x, K.x) + .6 * W + (o.puff || 0) * 1.5, y0: yBot - .2, y1: yTop + .2, z0: zA - .3, z1: zB + .3 + (o.puff || 0) }, o.cell);
  }
  // bota/meia: pé + perna até a altura h (acima do tornozelo), cano largo no topo, sola
  function boots(name, ch, o) {
    const yTop = A.y + o.h * Lb;
    const f = (x, y, z) => {
      let t = o.t + (o.cuffT || 0) * sstep(yTop - .25 * Lb * .1 - .08, yTop, y) + (o.toe || 0) * sstep(A.z + .1, A.z + .5, z) * sstep(A.y, ySole, y);
      let d = bf(x, y, z) - t; d = Math.max(d, y - yTop);
      if (o.stripes) d = Math.max(d, o.stripes(x, y, z));
      return d;
    };
    piece(name, ch, f, { x: A.x + .9 * W, y0: ySole - .15, y1: yTop + .1, z0: A.z - .7 * W, z1: A.z + 1.3 * W + (o.toe || 0) }, o.cell);
  }
  // faixa em volta do corpo (cinto, faixa, gola baixa)
  function band(name, ch, yc, h, t, o = {}) {
    const f = (x, y, z) => { let d = Math.max(bf(x, y, z) - t, Math.abs(y - yc - (o.tilt || 0) * x) - h / 2); if (armSide(Math.abs(x), y) > -.05) d = Math.max(d, .05); return d };
    piece(name, ch, f, bodyBounds(yc - h - .3, yc + h + .3), o.cell ?? cellBase * .8);
  }
  // trecho de membro (braçadeira, polaina): segmento a→b do braço/perna, entre t0 e t1
  function limbWrap(name, ch, a, b, t0, t1, t, o = {}) {
    const d0 = b.clone().sub(a), Lseg = d0.length(), dir = d0.clone().normalize(), p0 = a.clone().addScaledVector(dir, Lseg * t0), p1 = a.clone().addScaledVector(dir, Lseg * t1);
    const R = limbR(a.clone().lerp(b, (t0 + t1) / 2), dir) + t + .35;
    const f = (x, y, z) => { const ax = Math.abs(x); let tt = t + (o.flare || 0) * sstep(.6, 1, along(ax, y, z, p0, dir) / (Lseg * (t1 - t0))); if (o.rings) tt += o.rings * (Math.cos(along(ax, y, z, p0, dir) / (Lseg * (t1 - t0)) * PI * 2 * o.ringsN) > .6 ? 1 : 0); return Math.max(bf(x, y, z) - tt, -along(ax, y, z, p0, dir), along(ax, y, z, p1, dir), segD(ax, y, z, p0, p1) - R) };
    const lo = V(Math.min(p0.x, p1.x) - R, Math.min(p0.y, p1.y) - R, Math.min(p0.z, p1.z) - R), hi = V(Math.max(p0.x, p1.x) + R, Math.max(p0.y, p1.y) + R, Math.max(p0.z, p1.z) + R);
    piece(name, ch, f, { x: hi.x + .1, y0: lo.y - .1, y1: hi.y + .1, z0: lo.z - .1, z1: hi.z + .1 }, o.cell ?? cellBase * .8);
  }
  // casca cônica (saia, abas de casaco, tanga em volta): raio = contorno do corpo + folga + abertura com a altura
  function cone(name, ch, o) {
    const yT = Y(o.top), yB = Y(o.bottom), NS = 72, base = [];
    for (let i = 0; i < NS; i++) base.push(radAt(yT, -PI + 2 * PI * i / NS) + (o.pad ?? .06));
    const R0 = ph => { const f = ((ph + PI) / (2 * PI)) * NS, i = Math.floor(f), t = f - i; return base[(i % NS + NS) % NS] * (1 - t) + base[((i + 1) % NS + NS) % NS] * t };
    const f = (x, y, z) => {
      const r = Math.hypot(x, z - z0), ph = phiOf(x, z), u = clamp((yT - y) / (yT - yB), 0, 1);
      let R = R0(ph) + (o.flare || 0) * u * (yT - yB) + (o.pleat || 0) * Math.sin(ph * (o.pleatN || 16)) * u;
      if (o.backOnly) R += 0;
      let d = Math.abs(r - R) - (o.th ?? .035);
      d = Math.max(d, y - yT, yB - y + (o.ragged ? o.ragged * (.5 + .5 * Math.sin(ph * 23) * Math.sin(ph * 7)) : 0) + (o.tails ? o.tails(ph) : 0));
      if (o.open) d = Math.max(d, (o.open - Math.abs(ph)) * .5);
      if (o.only) d = Math.max(d, o.only(ph));
      return d;
    };
    const Rmax = Math.max(...base) + (o.flare || 0) * (yT - yB) + .4;
    piece(name, ch, f, { x: Rmax, y0: yB - .3, y1: yT + .2, z0: z0 - Rmax, z1: z0 + Rmax }, o.cell);
  }
  // superfície fina de dupla face a partir de uma grade de pontos (babado, véu, nadadeira, capa leve)
  function sheet(name, ch, rows, mixFn, shadeFn) {
    const nr = rows.length, nc = rows[0].length, pos = [], mixc = [], shade = [], idx = [];
    for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) { const p = rows[i][j]; pos.push(p.x, p.y, p.z); mixc.push(mixFn ? mixFn(i / (nr - 1), j / (nc - 1)) : 0); shade.push(shadeFn ? shadeFn(i / (nr - 1), j / (nc - 1)) : 1) }
    for (let i = 0; i < nr - 1; i++) for (let j = 0; j < nc - 1; j++) { const a = i * nc + j, b = a + 1, c = a + nc, d = c + 1; idx.push(a, c, b, b, c, d) }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('mixc', new THREE.Float32BufferAttribute(mixc, 1)); g.setAttribute('shade', new THREE.Float32BufferAttribute(shade, 1)); g.setIndex(idx); g.computeVertexNormals();
    add(name, g, ch);
  }
  // babado franzido em anel (gola, punho)
  function ruffle(name, ch, center, axis, r0, r1, n, amp, drop = 0) {
    const ax = axis.clone().normalize(), u = (Math.abs(ax.y) > .9 ? V(1, 0, 0) : V(0, 1, 0)).cross(ax).normalize(), v = ax.clone().cross(u), rows = [];
    for (let i = 0; i <= 6; i++) { const t = i / 6, row = []; for (let j = 0; j <= 160; j++) { const a = j / 160 * PI * 2, r = r0 + (r1 - r0) * t, w = Math.sin(a * n) * amp * t; row.push(center.clone().addScaledVector(u, Math.cos(a) * r).addScaledVector(v, Math.sin(a) * r).addScaledVector(ax, w - drop * t * t)) } rows.push(row) }
    sheet(name, ch, rows, null, (t, s) => .82 + .18 * Math.abs(Math.sin(s * PI * 2 * n)) * (.5 + t * .5));
  }
  // capa/manto: pano que sai dos ombros e cai atrás, com pregas
  function cape(name, ch, o) {
    const rows = [], NC = 46, NR = 40, yT = Y(o.top), yB = o.yBottom ?? Y(o.bottom);
    for (let i = 0; i <= NR; i++) {
      const t = i / NR, y = yT + (yB - yT) * t, row = [];
      for (let j = 0; j <= NC; j++) {
        const s = j / NC, ph = PI - (o.span ?? 1.9) / 2 + (o.span ?? 1.9) * s + (o.turn || 0), rr = radAt(Math.max(y, Y(.42)), ph) + .07 + (o.flare ?? .25) * t + .05 * Math.sin(s * PI * (o.pleats ?? 9) + t * 2) * t;
        const sw = (o.sway || 0) * t * t;
        row.push(V(Math.sin(ph) * rr + sw, y - (o.ragged ? o.ragged * t * (.5 + .5 * Math.sin(s * 40)) * sstep(.9, 1, t) : 0), z0 + Math.cos(ph) * rr));
      }
      rows.push(row);
    }
    sheet(name, ch, rows, null, (t, s) => .75 + .25 * (.5 + .5 * Math.sin(s * PI * (o.pleats ?? 9) + t * 2)));
  }

  // ================= figurinos =================
  if (style === 'circus') {
    // macacão listrado (creme / vermelho / azul em faixas verticais) em balão, franzido no tornozelo
    const sw = .3 * W, stripe = k => (x, y, z) => { const u = (x / sw + 30.5) % 3, c = k + .5; let dd = Math.abs(u - c); dd = Math.min(dd, 3 - dd); return (dd - .5) * sw };
    const suit = (x, y, z) => {
      const ax = Math.abs(x); if (armSide(ax, y) > .02 * W) return .5;
      const yTop = Y(.03), yBot = A.y + .085 * Lb, u = clamp((Y(.45) - y) / (Y(.45) - yBot), 0, 1);
      const t = .07 + .2 * W * sstep(Y(.12), Y(.32), y) * (1 - sstep(Y(.36), Y(.48), y)) + .18 * W * Math.pow(Math.sin(PI * u), .8) * (1 - .7 * sstep(.82, 1, u)) * sstep(Y(.4), Y(.5), y);
      return Math.max(bf(x, y, z) - t, y - yTop, yBot - y);
    };
    const bb = bodyBounds(A.y, Y(0) + .2, .7);
    piece('Macacao', 'stripesV', suit, bb); // listras verticais creme/vermelho/azul pelo material (bordas nítidas)
    // casaca aberta com abas até o joelho, mangas com punho franzido
    top('Casaca', 'fabric', { t: .1 * W, sleeve: 'wrist', bottom: .3, collar: -.05, open: .75, cell: cellBase, puff: .04 * W, loose: .12 * W });
    cone('Casaca_Abas', 'fabric', { top: .29, bottom: .68, pad: .26 * W, flare: .1, open: 1.05, th: .035, ragged: .12, pleat: .035, pleatN: 9 });
    mirror(s => { for (const [ff, aa] of [[.12, .95], [.2, 1.3], [.4, 1.25], [.55, 1.6], [.33, 2.1], [.6, 2.5], [.45, 2.9]]) { const ph = s * aa, y = Y(ff), r = ff > .29 ? radAt(Y(.29), ph) + .26 * W + .1 * (ff - .29) / .39 * (Y(.29) - Y(.68)) + .06 : radAt(y, ph) + .22 * W + .04; const p = V(Math.sin(ph) * r, y, z0 + Math.cos(ph) * r); const g = new THREE.ExtrudeGeometry(starShape(.13 * W, .055 * W), { depth: .02, bevelEnabled: false }); addGeo('trim', orient(g, p, V(Math.sin(ph), 0, Math.cos(ph)))) } });
    // gola franzida dupla (creme com borda dourada) e punhos
    ruffle('Gola', 'secondary', V(0, yN + .1, z0 - .02), V(0, 1, 0), .3 * W + .2, 1.0 * W + .35, 24, .16, .2);
    ruffle('Gola2', 'secondary', V(0, yN - .02, z0 - .02), V(0, 1, 0), .36 * W + .25, 1.15 * W + .45, 20, .18, .3);
    { const ring = []; for (let i = 0; i <= 120; i++) { const a = i / 120 * PI * 2, r = 1.15 * W + .45; ring.push(V(Math.cos(a) * r, yN - .02 + Math.sin(a * 20) * .18 - .3, z0 - .02 + Math.sin(a) * r)) } addGeo('trim', tubeG(ring, .018 * W, 5)) }
    mirror(s => ruffle('Punho', 'secondary', V(s * Wr.x, Wr.y, Wr.z).addScaledVector(V(s * dF.x, dF.y, dF.z), -.06), V(s * dF.x, dF.y, dF.z), limbR(Wr, dF) + .03, limbR(Wr, dF) + .2, 12, .045, .08));
    // suspensórios com botões-estrela, pompons, remendos de coração e estrela
    mirror(s => { const pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14, x = s * (.36 * W - .06 * W * t), y = Y(.03) + (Y(.27) - Y(.03)) * t; pts.push(onFront(x, y, .08 + .2 * W * sstep(Y(.12), Y(.27), y))) } addGeo('accent', tubeG(pts, .035 * W, 6)); const b = pts[pts.length - 1].clone().add(V(0, 0, .03)); addGeo('trim', orient(new THREE.CylinderGeometry(.075 * W, .075 * W, .025, 20).rotateX(PI / 2), b, V(0, 0, 1))) });
    for (const ff of [.14, .23, .32]) { const y = Y(ff), p = onFront(0, y, .2 * W * sstep(Y(.12), Y(.32), y) + .02); addGeo('fabric', sph(p, .1 * W, 1, 1, .85, 16, 12)) }
    { const hs = new THREE.Shape(); hs.moveTo(0, -.12); hs.bezierCurveTo(.16, .0, .12, .14, 0, .06); hs.bezierCurveTo(-.12, .14, -.16, 0, 0, -.12); addGeo('fabric', flatOnBody(hs.clone(), .42 * W, Y(.33), .015, 0, .2 * W + .04)) }
    addGeo('trim', flatOnBody(starShape(.15 * W, .065 * W), -.45 * W, Y(.38), .015, .2, .2 * W + .04));
    // meias listradas e sapatões de palhaço (bico enorme, duas cores) + luvas brancas
    boots('Meia', 'stripesH', { t: .035, h: .16 });
    mirror(s => { const toe = V(s * (A.x + .06 * W), ySole + .14 * W, A.z + .42 * W * 1.2 + .1), heel = V(s * A.x, ySole + .14 * W, A.z - .05); addGeo('leather', sph(heel.clone().lerp(toe, .35), .27 * W, 1.05, .75, 1.6, 22, 14)); addGeo('leather', sph(toe, .3 * W, 1.15, .78, 1.05, 22, 14)); addGeo('secondary', sph(toe.clone().add(V(s * .08 * W, .1 * W, .12 * W)), .17 * W, 1.1, .5, .9, 16, 10)); addGeo('secondary', sph(heel.clone().add(V(0, .08 * W, -.05)), .13 * W, 1, .5, .9, 14, 8)); addGeo('leather', sph(V(s * A.x, A.y + .02, A.z), .2 * W, 1, .7, 1, 16, 10)) });
    piece('Luvas', 'secondary', (x, y, z) => { const ax = Math.abs(x); return Math.max(bf(x, y, z) - .025, -along(ax, y, z, Wr.clone().addScaledVector(dF, -.08), dF)) }, { x: bx + .2, y0: Wr.y - 1.4, y1: Wr.y + .4, z0: zA - .2, z1: zB + .3 }, cellBase * .65);
  }

  if (style === 'orc') {
    // tanga: cinto grosso de couro com rebites, saiote de tiras de couro, estandarte vermelho na frente
    const yBelt = Y(.4);
    band('Cinto', 'leather', yBelt, .16 * W, .1 * W);
    cone('Saiote', 'leather', { top: .4, bottom: .62, pad: .08 * W, flare: .05, th: .04, ragged: .18, pleat: .04, pleatN: 13, only: ph => Math.abs(Math.sin(ph * 6.5)) < .2 ? .05 : -1 });
    { const zf = frontZ(0, yBelt) + .1 * W, rows = []; for (let i = 0; i <= 26; i++) { const t = i / 26, y = yBelt - .06 - t * .3 * Lb, row = []; for (let j = 0; j <= 16; j++) { const s = j / 16 - .5, w = (.42 - .08 * t) * W; row.push(V(s * 2 * w, y - (t > .85 ? (.5 + .5 * Math.sin(j * 2.3)) * .12 * W : 0), Math.max(frontZ(s * 2 * w * .8, Math.max(y, Y(.47))) + .06, zf - .05 * t) + .04 * Math.sin(s * 6 + t * 3) * t)) } rows.push(row) } sheet('Estandarte', 'fabric', rows, null, (t, s) => .78 + .22 * Math.cos((s - .5) * 3)) }
    // caveira de fivela com chifres e presas penduradas
    { const p = onFront(0, yBelt + .02, .1 * W + .1); addGeo('secondary', sph(p.clone().add(V(0, .06, 0)), .3 * W, 1, .92, .85, 20, 14)); addGeo('secondary', sph(p.clone().add(V(0, -.2 * W, .06)), .19 * W, 1, .6, .7, 16, 10)); for (let k = -2; k <= 2; k++) { const c = new THREE.ConeGeometry(.03 * W, .12 * W, 6); c.rotateX(PI); c.translate(p.x + k * .06 * W, p.y - .28 * W, p.z + .12 * W); addGeo('secondary', c) }
      mirror(s => { addGeo('leather', sph(p.clone().add(V(s * .11 * W, .08 * W, .22 * W)), .08 * W, 1, 1, .5, 10, 8)); const horn = []; for (let i = 0; i <= 10; i++) { const t = i / 10; horn.push(p.clone().add(V(s * (.25 + .35 * t) * W, (.05 + .2 * t * t) * W, (.02 - .12 * t) * W))) } addGeo('secondary', new THREE.TubeGeometry(new THREE.CatmullRomCurve3(horn), 20, .07 * W, 8)) });
      for (let k = -4; k <= 4; k++) { if (!k) continue; const ph = k * .2, y = yBelt - .1 * W, r = radAt(y, ph) + .14 * W, q = V(Math.sin(ph) * r, y, z0 + Math.cos(ph) * r); const c = new THREE.ConeGeometry(.04 * W, .2 * W, 8); c.rotateX(PI); c.translate(0, -.1 * W, 0); c.translate(q.x, q.y, q.z); addGeo('secondary', c); addGeo('trim', sph(q.clone().add(V(0, .02, 0)), .02 * W)) } }
    for (let k = 0; k < 18; k++) { const ph = -PI + k / 18 * 2 * PI, r = radAt(yBelt, ph) + .1 * W + .02; addGeo('trim', sph(V(Math.sin(ph) * r, yBelt, z0 + Math.cos(ph) * r), .03 * W, 1, 1, 1, 8, 6)) }
    // ombreira esquerda: placas sobrepostas com espinhos de osso, alça cruzando o peito com argola
    { const sh = V(-S.x - .05 * W, S.y + .1, S.z), shp = []; for (let k = 0; k < 4; k++) { const c = sh.clone().add(V(-.1 * k * W, -.16 * k * W, 0)); addGeo(k % 2 ? 'leather' : 'trim', sph(c, (.72 - .08 * k) * W, 1.05, .5, 1.05, 24, 12)); for (let r = 0; r < 9; r++) { const a = r / 8 * PI * 1.6 - PI * .8; addGeo('trim', sph(c.clone().add(V(Math.sin(a) * .62 * W * (1 - .1 * k), .12 * W, Math.cos(a) * .62 * W)), .03 * W, 1, 1, 1, 6, 5)) } }
      const strap = []; for (let i = 0; i <= 20; i++) { const t = i / 20, x = -S.x * .75 * (1 - t) + .55 * W * t, y = S.y + (yBelt - S.y) * t; strap.push(onFront(x, y, .07)) } addGeo('leather', tubeG(strap, .11 * W, 8));
      const ring = new THREE.TorusGeometry(.12 * W, .025 * W, 8, 24); addGeo('trim', orient(ring, strap[11].clone().add(V(0, 0, .05)), V(0, 0, 1))) }
    // espinhos da ombreira: cones de osso (o loop acima cria tubos finos; os cones dão a ponta)
    { const sh = V(-S.x - .05 * W, S.y + .1, S.z); for (let k = 0; k < 7; k++) { const a = k / 6 * PI, base = sh.clone().add(V(Math.cos(a) * .45 * W - .1 * W, .3 * W, Math.sin(a - PI / 2) * .45 * W)), dir = V(-.45 + Math.cos(a) * .35, 1, Math.sin(a - PI / 2) * .45).normalize(), L = (.55 + .3 * Math.sin(a)) * W; const c = new THREE.ConeGeometry(.11 * W, L, 10); c.translate(0, L / 2, 0); c.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir)); c.translate(base.x, base.y, base.z); addGeo('secondary', c) } }
    // braçadeiras de couro com faixas de metal e espinhos; polainas nas canelas; pés descalços
    limbWrap('Bracadeira', 'leather', E, Wr, .3, .92, .09 * W, { flare: .04 * W });
    limbWrap('Bracadeira_Aro', 'trim', E, Wr, .45, .8, .11 * W, { rings: .02 * W, ringsN: 2.2 });
    mirror(s => { for (let k = 0; k < 5; k++) { const t = .4 + k * .12, p = E.clone().lerp(Wr, t), side = V(0, 1, 0).cross(dF).normalize(), dir = V(s * (-dF.y), dF.x, .3).normalize(); const pr = V(s * p.x, p.y, p.z), r = limbR(p, dF) + .1 * W; const c = new THREE.ConeGeometry(.035 * W, .13 * W, 8); c.translate(0, .065 * W + r, 0); c.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), V(s * .3, 1, .4 * (k % 2 ? 1 : -1)).normalize())); c.translate(pr.x, pr.y, pr.z); addGeo('trim', c) } });
    limbWrap('Polaina', 'leather', K, A, .25, 1.02, .08 * W, { flare: .05 * W });
    limbWrap('Polaina_Placa', 'trim', K, A, .38, .62, .1 * W);
  }

  if (style === 'adventurer') {
    // camisa branca bufante, gibão azul até o meio da coxa com acabamento, capa vermelha nos ombros
    top('Camisa', 'secondary', { t: .07 * W, sleeve: 'wrist', bottom: .36, puff: .16 * W, collar: .04 });
    top('Gibao', 'fabric', { t: .14 * W, bottom: .4, collar: -.02, shoulderPad: .06, open: .16, loose: .03 * W });
    cone('Gibao_Saia', 'fabric', { top: .36, bottom: .6, pad: .12 * W, flare: .05, open: .2, th: .035, pleat: .015, pleatN: 10 });
    cone('Gibao_Barra', 'trim', { top: .575, bottom: .61, pad: .125 * W, flare: .05, open: .2, th: .045 });
    pants('Calca', 'pants', { top: .34, t: .07 * W, puff: .06 * W, cuff: .2 });
    boots('Botas', 'leather', { t: .07 * W, h: .26, cuffT: .09 * W, toe: .02 });
    band('Cinto', 'leather', Y(.36), .12 * W, .2 * W);
    limbWrap('Bracadeira', 'leather', E, Wr, .45, .95, .13 * W, { flare: .03 * W });
    cape('Capa', 'accent', { top: .02, bottom: .85, span: 3.4, flare: .7, pleats: 8, ragged: .3 });
    cone('Echarpe', 'accent', { top: -.02, bottom: .13, pad: .2 * W, flare: .1, th: .05, pleat: .04, pleatN: 7, ragged: .05 });
    // fivela-bússola, alça diagonal, bolsas de couro e bússola pendurada
    { const p = onFront(0, Y(.36), .2 * W + .02); addGeo('trim', orient(new THREE.CylinderGeometry(.16 * W, .16 * W, .04, 28).rotateX(PI / 2), p, V(0, 0, 1))); addGeo('leather', orient(new THREE.ExtrudeGeometry(starShape(.13 * W, .04 * W, 8), { depth: .012, bevelEnabled: false }), p.clone().add(V(0, 0, .03)), V(0, 0, 1))) }
    { const strap = []; for (let i = 0; i <= 18; i++) { const t = i / 18, x = .62 * W * (1 - t) - .55 * W * t, y = S.y + .05 + (Y(.38) - S.y) * t; strap.push(onFront(x, y, .15 * W)) } addGeo('leather', tubeG(strap, .05 * W, 6)); addGeo('trim', orient(new THREE.CylinderGeometry(.09 * W, .09 * W, .03, 20).rotateX(PI / 2), strap[5].clone().add(V(0, 0, .04)), V(0, 0, 1))) }
    mirror(s => { const p = onFront(s * .62 * W, Y(.42), .24 * W); const g = new THREE.BoxGeometry(.32 * W, .28 * W, .16 * W, 2, 2, 2); addGeo('leather', orient(g, p, V(s * .4, 0, 1).normalize())); addGeo('leather', orient(new THREE.BoxGeometry(.34 * W, .12 * W, .17 * W), p.clone().add(V(0, .12 * W, .01)), V(s * .4, 0, 1).normalize())); addGeo('trim', sph(p.clone().add(V(0, .06 * W, .1 * W)), .025 * W)) });
    { const p = onFront(.25 * W, Y(.5), .26 * W); addGeo('trim', orient(new THREE.CylinderGeometry(.11 * W, .11 * W, .04, 24).rotateX(PI / 2), p, V(0, 0, 1))); addGeo('secondary', orient(new THREE.CylinderGeometry(.085 * W, .085 * W, .045, 24).rotateX(PI / 2), p.clone().add(V(0, 0, .005)), V(0, 0, 1))); addGeo('trim', tubeG([onFront(.22 * W, Y(.37), .22 * W), p.clone().add(V(0, .11 * W, 0))], .012, 5)) }
  }

  if (style === 'desert') {
    // túnica branca de manga curta até o meio da coxa, bombacha creme franzida na canela, botas trançadas
    top('Tunica', 'secondary', { t: .1 * W, sleeve: 'short', short: .62, puff: .05 * W, bottom: .4, collar: .01, vneck: .12, loose: .05 * W });
    cone('Tunica_Saia', 'secondary', { top: .37, bottom: .62, pad: .14 * W, flare: .09, th: .035, pleat: .03, pleatN: 12, open: .0, tails: ph => Math.abs(Math.sin(ph)) > .97 ? .3 : 0 });
    pants('Bombacha', 'pants', { top: .4, t: .06 * W, puff: .22 * W, cuff: .26 });
    boots('Botas', 'leather', { t: .07 * W, h: .3, cuffT: .03 * W });
    for (let k = 0; k < 4; k++) limbWrap('Bota_Tira', 'trim', K, A, .3 + k * .17, .3 + k * .17 + .04, .095 * W);
    // faixa azul larga + cinto com medalhão; tabardo azul com losangos e franja; tiras cruzadas no peito
    band('Faixa', 'fabric', Y(.34), .22 * W, .18 * W);
    band('Cinto', 'leather', Y(.375), .07 * W, .23 * W);
    { const p = onFront(0, Y(.36), .25 * W); addGeo('trim', orient(new THREE.CylinderGeometry(.12 * W, .12 * W, .035, 26).rotateX(PI / 2), p, V(0, 0, 1))) }
    const zTab = y => z0 + radAt(Y(.37), 0) + .17 * W + .09 * (Y(.37) - y) + .05;
    for (const xc of [-.22, .22]) {
      const rows = [], yT = Y(.39); for (let i = 0; i <= 20; i++) { const t = i / 20, y = yT - t * .3 * Lb, row = []; for (let j = 0; j <= 8; j++) { const s = j / 8 - .5, x = (xc + s * .3) * W; row.push(V(x, y, zTab(y) + .02 * Math.cos(s * 3))) } rows.push(row) }
      sheet('Tabardo', 'fabric', rows, null, (t, s) => .85 + .15 * Math.cos((s - .5) * 3));
      for (let k = 0; k < 3; k++) { const y = yT - (.07 + k * .09) * Lb, p = V(xc * W, y, zTab(y) + .04); const g = new THREE.TorusGeometry(.07 * W, .012 * W, 4, 4); g.rotateZ(PI / 4); addGeo('trim', orient(g, p, V(0, 0, 1))) }
      for (let k = 0; k < 9; k++) { const x = (xc - .14 + k * .035) * W, y = yT - .3 * Lb, p = V(x, y, zTab(y) + .01); addGeo('trim', tubeG([p, p.clone().add(V(0, -.09 * W, .005))], .008, 4)) }
    }
    mirror(s => { const strap = []; for (let i = 0; i <= 16; i++) { const t = i / 16, x = s * (.6 * W * (1 - t) - .45 * W * t), y = S.y + (Y(.34) - S.y) * t; strap.push(onFront(x, y, .1 * W + .04 * Math.sin(PI * t))) } addGeo('leather', tubeG(strap, .045 * W, 6)) });
    addGeo('trim', orient(new THREE.CylinderGeometry(.1 * W, .1 * W, .03, 24).rotateX(PI / 2), onFront(0, Y(.17), .16 * W), V(0, 0, 1)));
    // lenço/capuz azul no pescoço e capa azul caindo do ombro esquerdo com barra dourada
    piece('Lenco', 'fabric', (x, y, z) => { const ax = Math.abs(x); if (armSide(ax, y) > -.1) return .3; const t = .11 * W + .05 * W * Math.sin(phiOf(x, z) * 5 + y * 20) + .06 * W * sstep(yN - .05, yN - .25, y); return Math.max(bf(x, y, z) - t, Math.abs(y - (yN - .1)) - .17) }, bodyBounds(yN - .5, yN + .4), cellBase * .8);
    cape('Capa', 'fabric', { top: .03, yBottom: Y(.8), span: 2.4, flare: .5, pleats: 6, turn: -.25 });
    // luva de falcoeiro no braço direito e braçadeira no esquerdo
    piece('Luva', 'leather', (x, y, z) => x > 0 ? 1 : Math.max(bf(x, y, z) - .05 * W, -along(-x, y, z, E.clone().lerp(Wr, .45), dF)), { x: bx + .2, y0: Wr.y - 1.4, y1: E.y + .3, z0: zA - .2, z1: zB + .3 }, cellBase * .7);
  }

  if (style === 'mermaid_pearl' || style === 'mermaid_ruby') {
    const ruby = style === 'mermaid_ruby';
    // cauda: começa nos quadris (cós em V na frente), afina até o "tornozelo" e abre na nadadeira; S suave de lado
    const yT = Y(.36), yAnk = ySole + .17 * Lb, yEnd = ySole + .08 * Lb;
    const wAt = y => { const u = clamp((yT - y) / (yT - yAnk), 0, 1); return W * (1.02 * B.hip - (1.02 * B.hip - .2) * Math.pow(u, 1.15) + .12 * Math.sin(PI * Math.min(u * 1.4, 1)) * (1 - u)) };
    const zc = y => z0 - .02 + .12 * Math.sin(clamp((yT - y) / (yT - yEnd), 0, 1) * PI * 1.1);
    const tail = (x, y, z) => {
      const w = Math.max(wAt(y), .1), d = w * .78, q = Math.hypot(x / w, (z - zc(y)) / d);
      let dd = (q - 1) * Math.min(w, d) * .9;
      const vcut = yT + .06 - .16 * Math.max(0, 1 - Math.abs(x) / (.5 * W)) * sstep(z0, z0 + .3, z);
      const hipCover = armSide(Math.abs(x), y) > -.02 ? 1 : bf(x, y, z) - .045 * W; // cobre quadril/glúteos do corpo
      dd = smin(dd, hipCover, .06);
      dd = smax(dd, y - vcut, .02); dd = smax(dd, yEnd - y, .05);
      return dd;
    };
    const tg = sdfMesh(tail, { x: 1.4 * W + .5, y0: yEnd - .2, y1: yT + .3, z0: z0 - 1.4 * W - .3, z1: z0 + 1.4 * W + .4 }, cellBase);
    { const pa = tg.attributes.position, n = pa.count, mixc = new Float32Array(n), shade = new Float32Array(n); for (let i = 0; i < n; i++) { const y = pa.getY(i); mixc[i] = Math.pow(sstep(yT, yEnd, y), ruby ? .9 : 1.3); shade[i] = 1 } tg.setAttribute('mixc', new THREE.BufferAttribute(mixc, 1)); tg.setAttribute('shade', new THREE.BufferAttribute(shade, 1)) }
    add('Cauda', tg, 'tail');
    // linhas douradas no cós e descendo a cauda
    { const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40, ph = -1.25 + 2.5 * t, x = Math.sin(ph), y = yT + .06 - .16 * Math.max(0, 1 - Math.abs(Math.sin(ph) * radAt(yT, ph)) / (.5 * W)) - .02; const r = radAt(y, ph, zc(y)) + .03; pts.push(V(Math.sin(ph) * r, y, zc(y) + Math.cos(ph) * r)) } addGeo('trim', tubeG(pts, .022 * W, 6)) }
    mirror(s => { const pts = []; for (let i = 0; i <= 30; i++) { const t = i / 30, y = yT - .1 - t * (yT - yAnk - .1), w = wAt(y); pts.push(V(s * (.35 * w * (1 - t) + .08 * w), y, zc(y) + w * .78 * Math.sqrt(1 - Math.pow(.35 * (1 - t) + .08, 2)) + .015)) } addGeo('trim', tubeG(pts, .012 * W, 5)) });
    // nadadeira da cauda: dois lóbulos em leque com raios, borda recortada e ondulada
    const finSheet = (name, base, dirMain, side, len, spread, n, ruffleAmp) => {
      const rows = [], NR = 18, NC = 30; const up = V(0, 0, 1);
      for (let i = 0; i <= NR; i++) { const t = i / NR, row = []; for (let j = 0; j <= NC; j++) { const s = j / NC, ang = (s - .5) * spread, dir = dirMain.clone().applyAxisAngle(up, ang).normalize(); const L = len * (.55 + .45 * Math.pow(Math.sin(PI * s), .6)) * (1 - .25 * Math.abs(Math.sin(s * PI * n)) * sstep(.8, 1, t)); const p = base.clone().addScaledVector(dir, L * t); p.z += ruffleAmp * Math.sin(s * PI * n * 2) * t * t + side * .05 * t; row.push(p) } rows.push(row) }
      sheet(name, 'fin', rows, (t) => .35 + .65 * t, (t, s) => .7 + .3 * Math.abs(Math.cos(s * PI * 14)) * (.6 + .4 * t));
    };
    const fb = V(0, yEnd + .05, zc(yEnd) - .02);
    mirror(s => finSheet('Nadadeira', fb, V(s * .9, -1, 0).normalize(), s, 1.5 * W + .25 * Lb * .3, 1.25, 4, .1));
    mirror(s => { const y = Y(.46), b = V(s * wAt(y) * .9, y, zc(y)); finSheet('Nadadeira_Quadril', b, V(s * 1, -1.1, .1).normalize(), s, .9 * W, .9, 3, .06) });
    mirror(s => { const y = yT - .55 * (yT - yAnk), b = V(s * wAt(y) * .95, y, zc(y)); finSheet('Nadadeira_Lateral', b, V(s * .8, -1, 0).normalize(), s, .75 * W, .8, 3, .05) });
    // top: faixa no busto com decote coração (pérolas/joias), colar e correntes na barriga
    const yB0 = Y(.2), yB1 = Y(.115);
    piece('Top', 'secondary', (x, y, z) => { const ax = Math.abs(x); if (armSide(ax, y) > -.02) return .3; const cup = .08 * W * Math.exp(-((ax - .3 * W) ** 2) / (.04 * W * W)) * sstep(z0, z0 + .3, z); const topEdge = yB1 + .06 * Math.exp(-((ax - .3 * W) ** 2) / (.03 * W * W)) - .12 * Math.exp(-(x * x) / (.008 * W * W)) - (z < z0 ? .1 : 0); return Math.max(bf(x, y, z) - .04 * W - cup, y - topEdge, yB0 + .05 - y) }, bodyBounds(yB0 - .2, yB1 + .3), cellBase * .7);
    const pearl = 'pearl';
    { const pts = []; for (let i = 0; i <= 44; i++) { const t = i / 44, x = (t - .5) * 1.5 * W, y = yB1 + .04 - .09 * Math.exp(-(x * x) / (.012 * W * W)) + .005; pts.push(onFront(x, y, .055 * W)) } pts.forEach((p, i) => addGeo(ruby ? 'trim' : pearl, sph(p, (ruby ? .02 : .028) * W, 1, 1, 1, 8, 6))) }
    { const c = onFront(0, Y(.13), .05 * W + .02); addGeo('gem', orient(new THREE.OctahedronGeometry(.07 * W, 0).scale(1, 1.3, .5), c, V(0, 0, 1))); const fr = new THREE.TorusGeometry(.08 * W, .012 * W, 6, 20); fr.scale(1, 1.25, 1); addGeo('trim', orient(fr, c, V(0, 0, 1))) }
    { const pts = []; for (let i = 0; i <= 50; i++) { const a = -PI * .8 + i / 50 * PI * 1.6, y = yN - .22 - .08 * Math.cos(a / 1.6), r = radAt(Math.min(y, yN - .1), a) + .03; pts.push(V(Math.sin(a) * r, y, z0 + Math.cos(a) * r)) } pts.forEach(p => addGeo(ruby ? 'trim' : pearl, sph(p, .026 * W, 1, 1, 1, 8, 6))); addGeo('gem', orient(new THREE.OctahedronGeometry(.05 * W, 0).scale(1, 1.4, .5), pts[25].clone().add(V(0, -.08, .02)), V(0, 0, 1))) }
    for (let k = 0; k < 2; k++) { const pts = []; for (let i = 0; i <= 50; i++) { const t = i / 50, ph = -1.3 + 2.6 * t, y = yT + .08 - (.12 + k * .1) * Math.sin(PI * t), r = radAt(y, ph) + .03; pts.push(V(Math.sin(ph) * r, y, z0 + Math.cos(ph) * r)) } pts.forEach((p, i) => { if (i % 2 === 0) addGeo(ruby ? 'trim' : pearl, sph(p, (ruby ? .016 : .02) * W, 1, 1, 1, 8, 6)) }) }
    { const c = onFront(0, yT + .02, .06); addGeo('gem', orient(new THREE.OctahedronGeometry(.075 * W, 0).scale(1, 1.4, .5), c, V(0, 0, 1))); const fr = new THREE.TorusGeometry(.085 * W, .014 * W, 6, 20); fr.scale(1, 1.3, 1); addGeo('trim', orient(fr, c, V(0, 0, 1))) }
    if (ruby) { // cinto de alquimista: frascos de vidro com líquido vermelho pendurados
      for (const ph of [-1.15, -.75, .75, 1.15, 1.6, -1.6]) { const y = yT + .02, r = radAt(y, ph) + .1, p = V(Math.sin(ph) * r, y - .14, z0 + Math.cos(ph) * r); const tall = Math.abs(ph) > 1.3; if (tall) { addGeo('glass', orient(new THREE.CylinderGeometry(.05 * W, .05 * W, .26 * W, 14), p, V(0, 1, 0), V(0, 0, 1))); addGeo('liquid', orient(new THREE.CylinderGeometry(.04 * W, .04 * W, .17 * W, 12), p.clone().add(V(0, -.04 * W, 0)), V(0, 1, 0), V(0, 0, 1))) } else { addGeo('glass', sph(p, .09 * W, 1, 1, 1, 16, 12)); addGeo('liquid', sph(p.clone().add(V(0, -.02 * W, 0)), .07 * W, 1, .7, 1, 14, 8)); addGeo('glass', orient(new THREE.CylinderGeometry(.025 * W, .03 * W, .1 * W, 10), p.clone().add(V(0, .11 * W, 0)), V(0, 1, 0), V(0, 0, 1))) } addGeo('trim', tubeG([V(p.x, y, p.z), p.clone().add(V(0, tall ? .13 * W : .14 * W, 0))], .008, 4)) }
      mirror(s => { for (let k = 0; k < 2; k++) { const ph = s * (.25 + k * .3), y = Y(.45) - k * .05, r = radAt(y, ph) + .05; addGeo('gem', orient(new THREE.OctahedronGeometry(.04 * W, 0).scale(1, 1.5, .5), V(Math.sin(ph) * r, y, z0 + Math.cos(ph) * r), V(Math.sin(ph), 0, Math.cos(ph)))) } });
    }
    // véus nos braços (tecido transparente preso no braço, caindo em ondas) com barra dourada; braceletes
    mirror(s => {
      const rows = [], a0 = S.clone().lerp(E, .3), a1 = E.clone().lerp(Wr, .05), NC = 16, NR = 22, drop = .55 * Lb * .32;
      const edge = [];
      for (let i = 0; i <= NR; i++) { const t = i / NR, row = []; for (let j = 0; j <= NC; j++) { const u = j / NC, p = a0.clone().lerp(a1, u); const r = limbR(p, dU) + .03; const q = V(s * p.x, p.y - r * .4, p.z); q.y -= drop * t * (.7 + .5 * u); q.x += s * .05 * t; q.z += .08 * Math.sin(u * 9 + t * 3) * t; row.push(q); if (i === NR) edge.push(q) } rows.push(row) }
      sheet('Veu', 'veil', rows, null, (t, u) => .85 + .15 * Math.sin(u * 20));
      addGeo('trim', tubeG(edge, .012 * W, 5));
      for (const [pp, k] of [[S.clone().lerp(E, .32), dU], [Wr.clone().addScaledVector(dF, -.12), dF], [Wr.clone().addScaledVector(dF, -.2), dF]]) { const r = limbR(pp, k) + .02, g = new THREE.TorusGeometry(r, .022 * W, 8, 28); addGeo('trim', orient(g, V(s * pp.x, pp.y, pp.z), V(s * k.x, k.y, k.z))) }
    });
  }
}
