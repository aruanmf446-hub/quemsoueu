// Corpo inteiro da Head V2 — só a malha (sem roupa, sem acessórios, sem genitais), em pose A.
//
// Forma: campo de distância (SDF) com volumes fundidos por união suave:
//  - tronco por curvas (largura, frente e costas por altura, como a casca do rosto): trapézio, peito, costelas,
//    cintura, barriga, quadril; seios (mulheres adultas), peitoral, barriga, glúteos por personagem;
//  - pescoço que continua o pescoço da cabeça (as duas superfícies se cruzam por dentro, sem degrau);
//  - braços (deltoide, bíceps, antebraço), mãos com palma, 4 dedos de 3 falanges e polegar;
//  - pernas (coxa, joelho, panturrilha), pés com calcanhar, arco e dedos arredondados; virilha lisa.
// Malha: "surface nets" esparso — só os blocos perto da superfície são avaliados (rápido e leve), vértices
// projetados na superfície, normais suaves. Cor por vértice a partir da pele do personagem.
import * as THREE from 'three';

const { clamp } = THREE.MathUtils;
const sqrt = Math.sqrt;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) };
const smin = (a, b, k) => { if (k <= 0) return Math.min(a, b); const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * .25 };
const smax = (a, b, k) => -smin(-a, -b, k);
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z), DEG = Math.PI / 180;

// ---------- primitivas ----------
function roundCone(px, py, pz, a, ra, b, rb) {
  const bax = b.x - a.x, bay = b.y - a.y, baz = b.z - a.z, l2 = bax * bax + bay * bay + baz * baz, rr = ra - rb, a2 = l2 - rr * rr, il2 = 1 / l2;
  const pax = px - a.x, pay = py - a.y, paz = pz - a.z, y = pax * bax + pay * bay + paz * baz, z = y - l2;
  const qx = pax * l2 - bax * y, qy = pay * l2 - bay * y, qz = paz * l2 - baz * y, x2 = qx * qx + qy * qy + qz * qz, y2 = y * y * l2, z2 = z * z * l2;
  const k = Math.sign(rr) * rr * rr * x2;
  if (Math.sign(z) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - rb;
  if (Math.sign(y) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - ra;
  return (sqrt(x2 * a2 * il2) + y * rr) * il2 - ra;
}
function ellip(px, py, pz, c, rx, ry, rz) {
  const x = (px - c.x) / rx, y = (py - c.y) / ry, z = (pz - c.z) / rz, k0 = sqrt(x * x + y * y + z * z);
  const k1 = sqrt(x * x / (rx * rx) + y * y / (ry * ry) + z * z / (rz * rz)); return k1 > 1e-9 ? k0 * (k0 - 1) / k1 : -Math.min(rx, ry, rz);
}
// elipsoide orientado (base u, v, w)
function ellipO(px, py, pz, c, u, v, w, ru, rv, rw) {
  const dx = px - c.x, dy = py - c.y, dz = pz - c.z, a = dx * u.x + dy * u.y + dz * u.z, b = dx * v.x + dy * v.y + dz * v.z, e = dx * w.x + dy * w.y + dz * w.z;
  const x = a / ru, y = b / rv, z = e / rw, k0 = sqrt(x * x + y * y + z * z), k1 = sqrt(x * x / (ru * ru) + y * y / (rv * rv) + z * z / (rw * rw)); return k1 > 1e-9 ? k0 * (k0 - 1) / k1 : -Math.min(ru, rv, rw);
}
// curva monotônica suave (Hermite) por pontos
function curve(xs, vs) {
  const n = xs.length, d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((vs[i + 1] - vs[i]) / (xs[i + 1] - xs[i]));
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : 2 * d[i - 1] * d[i] / (d[i - 1] + d[i]);
  m[0] = d[0]; m[n - 1] = d[n - 2];
  return x => {
    if (x <= xs[0]) return vs[0]; if (x >= xs[n - 1]) return vs[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * vs[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * vs[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

// ---------- tipos de corpo por personagem ----------
// heads: altura total em "cabeças"; W: largura geral; sh/chest/waist/hip: multiplicadores; breasts: tamanho (0 = sem);
// belly: barriga; muscle: musculatura; glute; arm/hand/foot/leg: proporções; hunch: corcunda leve
const BASE = { heads: 6, W: 1, sh: 1, chest: 1, waist: 1, hip: 1, depth: 1, breasts: 0, belly: 0, muscle: 0, glute: 1, arm: 1, hand: 1, foot: 1, leg: 1, hunch: 0, fingers: 5, aPose: 52 };
export const BODIES = {
  feminine_soft: { head: .8, heads: 5.9, breasts: 1, waist: .93, hip: 1.0, sh: .94, glute: .95 },
  feminine_bold: { head: .8, heads: 6, breasts: 1.12, waist: .91, hip: 1.04, sh: .96, glute: 1.0 },
  cute_round: { head: .88, neckUp: .3, heads: 3.4, W: .8, sh: .92, waist: 1.0, hip: .88, belly: .18, arm: 1.12, hand: 1.35, foot: 1.35, leg: .92, glute: .8 },
  masculine_soft: { head: .76, heads: 6.4, W: 1.12, sh: 1.28, chest: 1.12, waist: .98, hip: .9, depth: 1.08, muscle: .55, glute: .85, hand: 1.08, foot: 1.08 },
  old_king: { head: .78, heads: 6.1, W: 1.14, sh: 1.22, chest: 1.08, waist: 1.12, hip: .95, depth: 1.1, belly: .55, muscle: .25, glute: .85, hand: 1.08, foot: 1.08 },
  alchemist_villain: { head: .9, heads: 6.9, W: .8, sh: 1.08, chest: .95, waist: .82, hip: .86, hunch: .18, glute: .6, hand: 1.18, arm: 1.06 },
  dwarf_bard: { head: .86, neckUp: .22, heads: 3.9, W: 1.3, sh: 1.12, chest: 1.1, waist: 1.15, hip: 1.0, depth: 1.15, belly: .55, muscle: .2, leg: .82, arm: .95, hand: 1.25, foot: 1.25 },
  sad_clown: { head: .86, neckUp: .22, heads: 4.7, W: 1.2, sh: .98, chest: 1.05, waist: 1.4, hip: 1.28, depth: 1.25, belly: 1.25, glute: 1.1, hand: 1.2, foot: 1.4 },
  orc_warrior: { head: .8, heads: 6.3, W: 1.55, sh: 1.42, chest: 1.28, waist: 1.08, hip: .95, depth: 1.18, muscle: 1, glute: .95, hand: 1.3, foot: 1.25, arm: 1.05 },
  cactus_cowboy: { head: .85, heads: 5.2, W: 1.55, sh: .85, chest: .9, waist: .88, hip: .85, depth: .9, glute: .3, cactus: true, fingers: 4, arm: 1.05, hand: .85 },
  pepper_king: { veg: true, legLen: 2.3, armLen: 1.85, limbR: .085, foot: 1.2, armY: -1.15 },
  chili_bandit: { veg: true, legLen: 2.4, armLen: 1.75, limbR: .075, foot: 1.1, armY: -1.0 }
};

// escala da cabeça com corpo (a cabeça é desenhada grande para o close do rosto; no corpo inteiro ela diminui)
export const headScale = id => (BODIES[id] && BODIES[id].head) || 1;

// ---------- SDF do corpo ----------
function makeBodySDF(fit, presetId, hs = 1) { // hs: escala da cabeça (a cabeça diminui em volta da base do pescoço; o corpo não muda)
  const P = fit.P, B = { ...BASE, ...(BODIES[presetId] || {}) };
  const prims = []; // { f(x,y,z) com x ≥ 0 (corpo simétrico), b: esfera envolvente, k }
  const add = (f, b, k) => prims.push({ f, b, k });
  const bs = (c, r) => ({ x: c.x, y: c.y, z: c.z, r });
  const chinY = P.lathe ? P.lathe.y[0] : P.loft.y[0], H = fit.top - Math.max(chinY, -1.2);
  const [nr, nty, ntz, nby, nbz] = P.neck;
  const joints = {}, W = B.W;
  if (B.veg) return makeVegSDF(fit, B, prims, add, bs, joints);

  const yN = nby + .02 + (B.neckUp ?? .1), ySole = fit.top - B.heads * H, Lb = yN - ySole, z0 = nbz + .02;
  const Y = f => yN - f * Lb;
  joints.ySole = ySole; joints.Lb = Lb;

  // ---- pescoço: continua o da cabeça (mesma seção oval), alargando para dentro do trapézio ----
  { const a = V(0, nby + .26 * hs, nbz - .02 * hs), b = V(0, nby - .1, nbz - .06), r1 = nr * hs * 1.14, r2 = nr * (.3 + .7 * hs) * 1.24;
    add((x, y, z) => roundCone(x * 1.14, y, z, a, r1, b, r2) * .92, bs(V(0, nby, nbz), .8), .1) }

  // ---- tronco por curvas ----
  const M = { sh: B.sh, ch: B.chest, wa: B.waist, hi: B.hip }, mu = B.muscle, bel = B.belly;
  //          f      meia-largura                      frente                          costas
  const rows = [
    [0.000, .42 * (nr * hs / .35),                  .06,                              -.34],
    [0.035, .72 * M.sh,                         .3 + .04 * mu,                    -.46 - .06 * mu],
    [0.085, .96 * M.sh,                         .36 + .06 * mu,                   -.5 - .06 * mu],
    [0.150, .93 * M.ch,                         .38 + .07 * mu + .03 * bel,       -.5],
    [0.225, .80 * (M.ch + M.wa) / 2,            .35 + .12 * bel,                  -.45],
    [0.300, .64 * M.wa,                         .3 + .25 * bel,                   -.39],
    [0.370, .74 * (M.wa + M.hi) / 2,            .33 + .26 * bel,                  -.41],
    [0.430, .95 * M.hi,                         .32 + .12 * bel,                  -.48],
    [0.470, .8 * M.hi,                          .2,                               -.38],
    [0.505, .34 * M.hi,                         .02,                              -.16]
  ];
  const fA = curve(rows.map(r => r[0]), rows.map(r => r[1] * W)), fF = curve(rows.map(r => r[0]), rows.map(r => r[2] * W * B.depth)), fB = curve(rows.map(r => r[0]), rows.map(r => r[3] * W * B.depth));
  const hunchZ = f => -B.hunch * sstep(.0, .2, f) * (1 - sstep(.2, .45, f)) * .9;
  const tTop = 0, tBot = .505, torsoB = bs(V(0, Y(.25), z0), Lb * .3 + 1.2 * W);
  const cactus = !!B.cactus, PT = cactus && P.pattern;
  add((x, y, z) => {
    const f = (yN - y) / Lb; if (f < tTop - .2 || f > tBot + .2) return Math.max(Math.abs(f - .25) * Lb - .3 * Lb, .05);
    const ff = clamp(f, tTop, tBot), a = Math.max(fA(ff), .05), zf = fF(ff), zb = fB(ff), zc = z0 + (zf + zb) / 2 + hunchZ(ff);
    const hz = Math.max((zf - zb) / 2, .05), X = x / a, Z = (z - zc) / hz, q = sqrt(X * X + Z * Z);
    let d = (q - 1) * Math.min(a, hz) * .92;
    if (f < tTop) d = Math.max(d, (tTop - f) * Lb); if (f > tBot - .03) d = smax(d, (f - tBot) * Lb, .25);
    if (PT) { const phi = Math.atan2(x, z - zc); d += PT.depth * .7 * (1 - sqrt(.5 + .5 * Math.cos(PT.n * phi))) }
    return d;
  }, torsoB, .02);

  // ---- volumes do tronco ----
  if (B.breasts > 0) { // seios: forma lisa e arredondada (sem mamilo), levemente para fora e para baixo
    const s = B.breasts * W, f = .158, zf = fF(f) + z0;
    const c = V(.31 * W, Y(f) - .04 * s, zf - .1 * s), u = V(.96, 0, .28).normalize(), v = V(0, 1, 0), w = V(-.28, 0, .96).normalize();
    add((x, y, z) => ellipO(x, y, z, c, u, v, w, .3 * s, .27 * s, .25 * s), bs(c, .4 * s), .22 * s);
  }
  if (mu > 0) { // peitoral, abdômen e serrátil discretos
    const f = .15, c = V(.32 * W * M.ch, Y(f) + .02, fF(f) + z0 - .12);
    add((x, y, z) => ellip(x, y, z, c, .42 * W, .22 * W, .1 * W * (1 + .5 * mu)), bs(c, .5 * W), .22 * W);
    if (mu >= .8) for (let r = 0; r < 3; r++) for (const xx of [.11]) { const cc = V(xx * W, Y(.215 + r * .045), fF(.215 + r * .045) + z0 - .05); add((x, y, z) => ellip(x, y, z, cc, .1 * W, .07 * W, .025 * W * mu), bs(cc, .14 * W), .12 * W) }
  }
  if (bel > 0) { const c = V(0, Y(.33), fF(.33) + z0 - .3 * bel * W); add((x, y, z) => ellip(x, y, z, c, .55 * W * (.8 + .3 * bel), .5 * W * (.8 + .3 * bel), .38 * W * (.8 + .4 * bel)), bs(c, .8 * W), .25 * W) }
  if (B.glute > 0) { const g = B.glute, c = V(.26 * W * M.hi, Y(.455), fB(.455) + z0 + .16 * W); add((x, y, z) => ellip(x, y, z, c, .3 * W * g, .32 * W * g, .26 * W * g), bs(c, .45 * W * g), .22 * W) }

  // ---- braços em pose A ----
  const shX = .98 * W * M.sh, shJ = V(shX, Y(.07), z0 - .04 + hunchZ(.07)), ang = B.aPose * DEG;
  const up = .19 * Lb * B.arm, fo = .165 * Lb * B.arm, rA = .23 * W * (1 + .35 * mu);
  const dir = V(Math.cos(ang), -Math.sin(ang), .02).normalize(), elbow = shJ.clone().addScaledVector(dir, up);
  const dir2 = V(Math.cos(ang + 14 * DEG), -Math.sin(ang + 14 * DEG), .16).normalize(), wrist = elbow.clone().addScaledVector(dir2, fo);
  joints.elbow = elbow; joints.wrist = wrist; joints.shoulder = shJ;
  { const c = shJ.clone().add(V(.02 * W, .03, 0)); add((x, y, z) => ellip(x, y, z, c, rA * 1.15, rA * 1.05, rA * 1.1), bs(c, rA * 1.4), .26 * W) } // deltoide
  add((x, y, z) => roundCone(x, y, z, shJ, rA, elbow, rA * .74), bs(shJ.clone().lerp(elbow, .5), up / 2 + rA), .14 * W);
  if (mu > 0) { const c = shJ.clone().lerp(elbow, .52).add(V(0, 0, .05)); add((x, y, z) => ellipO(x, y, z, c, dir, V(0, 0, 1), V(0, 0, 1).cross(dir).normalize(), up * .3, rA * (.9 + .35 * mu), rA * .9), bs(c, up * .35), .16 * W) }
  add((x, y, z) => roundCone(x, y, z, elbow, rA * .76, wrist, rA * .54), bs(elbow.clone().lerp(wrist, .5), fo / 2 + rA), .1 * W);
  { const c = elbow.clone().lerp(wrist, .28); add((x, y, z) => ellipO(x, y, z, c, dir2, V(0, 0, 1), V(0, 0, 1).cross(dir2).normalize(), fo * .3, rA * .8, rA * .7), bs(c, fo * .35), .16 * W) } // antebraço
  hand(wrist, dir2, .095 * Lb * B.hand * (.85 + .15 * W), rA * .5, B.fingers);

  // ---- pernas ----
  const hipJ = V(.45 * W * M.hi, Y(.465), z0 + .02), lk = (.735 - .465) * B.leg, la = (.955 - .735) * B.leg;
  const fK = .465 + (.49 * (lk / (lk + la))), knee = V(.4 * W * (.9 + .1 * M.hi), Y(fK), z0 + .05), ankle = V(.36 * W, ySole + .033 * Lb * (.9 + .1 * B.foot), z0 - .02);
  joints.knee = knee; joints.ankle = ankle;
  const rT = .38 * W * (1 + .15 * mu) * (.92 + .12 * M.hi), rK = .25 * W * (1 + .15 * mu), rAn = .125 * W * (1 + .15 * mu);
  add((x, y, z) => roundCone(x, y, z, hipJ, rT, knee, rK), bs(hipJ.clone().lerp(knee, .5), hipJ.distanceTo(knee) / 2 + rT), .14 * W);
  { const c = hipJ.clone().lerp(knee, .35).add(V(.0, 0, .08 * W)); add((x, y, z) => ellip(x, y, z, c, rT * .8, hipJ.distanceTo(knee) * .36, rT * .78), bs(c, Math.max(rT * .8, hipJ.distanceTo(knee) * .36) + .05), .3 * W) } // quadríceps
  add((x, y, z) => roundCone(x, y, z, knee, rK * .97, ankle, rAn), bs(knee.clone().lerp(ankle, .5), knee.distanceTo(ankle) / 2 + rK), .12 * W);
  { const c = knee.clone().lerp(ankle, .26).add(V(-.01, 0, -.08 * W)); add((x, y, z) => ellip(x, y, z, c, rK * .9, knee.distanceTo(ankle) * .28, rK * .9), bs(c, Math.max(rK * .9, knee.distanceTo(ankle) * .28) + .05), .22 * W) } // panturrilha
  { const c = knee.clone().add(V(0, -.02, rK * .5)); add((x, y, z) => ellip(x, y, z, c, rK * .55, rK * .6, rK * .4), bs(c, rK), .14 * W) } // joelho
  foot(ankle, ySole, .105 * Lb * B.foot * (.9 + .1 * W), W);
  if (cactus) joints.ribs = PT;

  function hand(wr, along, Lh, rw, nF) { // mão relaxada, palma virada para a coxa, polegar para a frente
    const u = along.clone().normalize(), w0 = V(0, 0, 1), v = u.clone().cross(w0).normalize(); // v: normal da palma (para o corpo/baixo)
    if (v.x > 0) v.negate(); const w = v.clone().cross(u).normalize(); // w: lado do polegar (frente)
    if (w.z < 0) w.negate();
    const at = (a, b, c) => wr.clone().addScaledVector(u, a).addScaledVector(v, b).addScaledVector(w, c);
    const pc = at(Lh * .3, 0, 0);
    add((x, y, z) => ellipO(x, y, z, pc, u, v, w, Lh * .3, Lh * .11, Lh * .24), bs(pc, Lh * .35), .05 * Lh);
    add((x, y, z) => roundCone(x, y, z, wr, rw, at(Lh * .14, 0, 0), rw * 1.05), bs(wr, Lh * .25), .06 * Lh);
    const rf = Lh * .062, fingers = nF === 4 ? [[.17, .95, .1], [0, 1, 0], [-.17, .9, -.1]] : [[.2, .93, .07], [.065, 1, .02], [-.07, .95, -.03], [-.2, .78, -.1]];
    for (const [wo, len, spread] of fingers) {
      let p = at(Lh * .54, Lh * .01, Lh * wo), d = u.clone().addScaledVector(w, spread * .35).normalize();
      const segs = [.25, .17, .13].map(s => s * Lh * len); let r = rf * (len < .85 ? .9 : 1);
      for (let k = 0; k < 3; k++) {
        d = d.clone().addScaledVector(v, .22 + .1 * k).normalize(); const q = p.clone().addScaledVector(d, segs[k]), a0 = p.clone(), r0 = r, r1 = r * (k === 2 ? .86 : .94);
        add((x, y, z) => roundCone(x, y, z, a0, r0, q, r1), bs(a0.clone().lerp(q, .5), segs[k] / 2 + r0), .012 * Lh);
        p = q; r = r1;
      }
    }
    { let p = at(Lh * .1, Lh * .04, Lh * .2), d = u.clone().multiplyScalar(.55).addScaledVector(w, .7).addScaledVector(v, .25).normalize(); let r = rf * 1.15; // polegar
      for (const s of [.2, .16, .13]) { const q = p.clone().addScaledVector(d, s * Lh), a0 = p.clone(), r0 = r; add((x, y, z) => roundCone(x, y, z, a0, r0, q, r0 * .9), bs(a0.clone().lerp(q, .5), s * Lh / 2 + r0), .02 * Lh); p = q; r *= .9; d = d.clone().addScaledVector(u, .35).addScaledVector(v, .15).normalize() } }
  }
  function foot(an, yS, Lf, Wd) { // pé com calcanhar, peito do pé e dedos arredondados; sola plana
    const heel = V(an.x, yS + Lf * .14, an.z - Lf * .12), ball = V(an.x + Lf * .05, yS + Lf * .1, an.z + Lf * .58), toe = V(an.x + Lf * .07, yS + Lf * .08, an.z + Lf * .78);
    add((x, y, z) => smax(roundCone(x, y, z, heel, Lf * .15, ball, Lf * .14), yS - y, .02), bs(heel.clone().lerp(ball, .5), Lf * .55), .06 * Wd);
    add((x, y, z) => roundCone(x, y, z, an, Lf * .12 * Wd ** .3, ball.clone().add(V(0, Lf * .04, -Lf * .15)), Lf * .1), bs(an.clone().lerp(ball, .5), Lf * .5), .08 * Wd);
    add((x, y, z) => smax(ellip(x, y, z, toe, Lf * .19, Lf * .09, Lf * .17), yS - y, .02), bs(toe, Lf * .25), .05 * Wd);
  }
  joints.bounds = { x: Math.max(wrist.x + .5 * Lb * .1 * B.hand + .4, 1.4 * W + .4), y0: ySole - .1, y1: nby + .5, z0: z0 - 1.0 * W * B.depth - .6, z1: z0 + 1.2 * W * B.depth + .5 + bel * .4 };
  return finish(prims, joints, B);
}

// vegetais: o vegetal inteiro é a "cabeça"; braços e pernas finos de desenho animado (luva-mão com 4 dedos)
function makeVegSDF(fit, B, prims, add, bs, joints) {
  const P = fit.P, L = P.lathe, yBot = Math.max(L.y[0], P.neck[3] + .08), rBot = L.r[0], zc = L.cz, r = B.limbR;
  const hip = V(rBot * .5, yBot + .2, zc), knee = V(rBot * .65, yBot - B.legLen * .5, zc + .06), ankle = V(rBot * .62, yBot - B.legLen, zc - .02);
  add((x, y, z) => roundCone(x, y, z, hip, r * 1.1, knee, r), bs(hip.clone().lerp(knee, .5), B.legLen * .3 + r), .04);
  add((x, y, z) => roundCone(x, y, z, knee, r, ankle, r * .85), bs(knee.clone().lerp(ankle, .5), B.legLen * .3 + r), .03);
  const ySole = ankle.y - .1 * B.foot, fc = V(ankle.x + .02, ySole + .1 * B.foot, ankle.z + .14 * B.foot);
  add((x, y, z) => Math.max(ellip(x, y, z, fc, .17 * B.foot, .12 * B.foot, .27 * B.foot), ySole - y), bs(fc, .3 * B.foot), .05);
  // braço: sai do lado do vegetal na altura armY
  let rr = 0, yA = B.armY; for (let i = 0; i < L.y.length - 1; i++) if (yA >= L.y[i] && yA <= L.y[i + 1]) { const t = (yA - L.y[i]) / (L.y[i + 1] - L.y[i]); rr = L.r[i] + (L.r[i + 1] - L.r[i]) * t }
  const sh = V(rr * .9, yA, zc), ang = 48 * DEG, d1 = V(Math.cos(ang), -Math.sin(ang), .05).normalize(), el = sh.clone().addScaledVector(d1, B.armLen * .5);
  const d2 = V(Math.cos(ang + 18 * DEG), -Math.sin(ang + 18 * DEG), .2).normalize(), wr = el.clone().addScaledVector(d2, B.armLen * .5);
  add((x, y, z) => roundCone(x, y, z, sh, r * .95, el, r * .85), bs(sh.clone().lerp(el, .5), B.armLen * .3), .03);
  add((x, y, z) => roundCone(x, y, z, el, r * .85, wr, r * .75), bs(el.clone().lerp(wr, .5), B.armLen * .3), .03);
  { // mão em luva: palma + 3 dedos + polegar
    const Lh = .42, u = d2.clone(), v = u.clone().cross(V(0, 0, 1)).normalize(); if (v.x > 0) v.negate(); const w = v.clone().cross(u).normalize(); if (w.z < 0) w.negate();
    const at = (a, b, c) => wr.clone().addScaledVector(u, a).addScaledVector(v, b).addScaledVector(w, c), pc = at(Lh * .3, 0, 0);
    add((x, y, z) => ellipO(x, y, z, pc, u, v, w, Lh * .32, Lh * .17, Lh * .3), bs(pc, Lh * .4), .04);
    for (const wo of [.17, 0, -.17]) { const a0 = at(Lh * .5, 0, Lh * wo), q = a0.clone().addScaledVector(u.clone().addScaledVector(v, .35).addScaledVector(w, wo * .6).normalize(), Lh * .36); add((x, y, z) => roundCone(x, y, z, a0, Lh * .09, q, Lh * .08), bs(a0.clone().lerp(q, .5), Lh * .3), .02) }
    { const a0 = at(Lh * .15, 0, Lh * .22), q = a0.clone().addScaledVector(w.clone().addScaledVector(u, .8).normalize(), Lh * .3); add((x, y, z) => roundCone(x, y, z, a0, Lh * .095, q, Lh * .08), bs(a0.clone().lerp(q, .5), Lh * .3), .02) }
  }
  joints.ySole = ySole; joints.Lb = yBot - ySole; joints.limb = true;
  joints.bounds = { x: wr.x + .7, y0: ySole - .1, y1: yA + .3, z0: zc - .8, z1: zc + .8 };
  return finish(prims, joints, B);
}

function finish(prims, joints, B) {
  const n = prims.length;
  const f = (x, y, z) => {
    const ax = x < 0 ? -x : x; let d = 1e9;
    for (let i = 0; i < n; i++) {
      const p = prims[i], b = p.b, dx = ax - b.x, dy = y - b.y, dz = z - b.z, db = sqrt(dx * dx + dy * dy + dz * dz) - b.r;
      if (db > d + p.k) continue;
      d = smin(d, p.f(ax, y, z), p.k);
    }
    return d;
  };
  return { f, joints, B };
}

// ---------- malha: surface nets esparso ----------
function mesh(sdf, bounds, cell) {
  const BS = 4, S = BS * cell;
  const x0 = -bounds.x, y0 = bounds.y0, z0 = bounds.z0;
  const NBx = Math.ceil(2 * bounds.x / S), NBy = Math.ceil((bounds.y1 - bounds.y0) / S), NBz = Math.ceil((bounds.z1 - bounds.z0) / S);
  const NCx = NBx * BS, NCy = NBy * BS, NCz = NBz * BS;
  // passe grosso: valor nos cantos dos blocos
  const cx = NBx + 1, cy = NBy + 1, cz = NBz + 1, coarse = new Float32Array(cx * cy * cz);
  for (let k = 0; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) coarse[(k * cy + j) * cx + i] = sdf(x0 + i * S, y0 + j * S, z0 + k * S);
  const blocks = new Map(), thr = S * 1.8; // ≥ meia-diagonal·2: um membro fino que atravessa o bloco sem tocar os cantos não é perdido
  for (let k = 0; k < NBz; k++) for (let j = 0; j < NBy; j++) for (let i = 0; i < NBx; i++) {
    let mn = 1e9, pos = false, neg = false;
    for (let c = 0; c < 8; c++) { const v = coarse[((k + (c >> 2 & 1)) * cy + (j + (c >> 1 & 1))) * cx + i + (c & 1)]; mn = Math.min(mn, Math.abs(v)); if (v > 0) pos = true; else neg = true }
    if (mn > thr && !(pos && neg)) continue;
    const P1 = BS + 1, arr = new Float32Array(P1 * P1 * P1), bx = x0 + i * S, by = y0 + j * S, bz = z0 + k * S;
    for (let c = 0; c < P1; c++) for (let b = 0; b < P1; b++) for (let a = 0; a < P1; a++) arr[(c * P1 + b) * P1 + a] = sdf(bx + a * cell, by + b * cell, bz + c * cell);
    blocks.set((k * NBy + j) * NBx + i, arr);
  }
  const P1 = BS + 1, val = (ix, iy, iz) => { // valor num ponto fino (pode estar em qualquer bloco ativo)
    let bi = Math.min(Math.floor(ix / BS), NBx - 1), bj = Math.min(Math.floor(iy / BS), NBy - 1), bk = Math.min(Math.floor(iz / BS), NBz - 1);
    const arr = blocks.get((bk * NBy + bj) * NBx + bi); if (!arr) return NaN;
    return arr[((iz - bk * BS) * P1 + (iy - bj * BS)) * P1 + (ix - bi * BS)];
  };
  // vértices: um por célula cruzada (média dos cruzamentos nas arestas)
  const vmap = new Map(), pos = [], cellKey = (i, j, k) => (k * NCy + j) * NCx + i;
  const EF = Int8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 0, 2, 1, 3, 4, 6, 5, 7, 0, 4, 1, 5, 2, 6, 3, 7]), cv = new Float32Array(8);
  for (const [key, arr] of blocks) {
    const bi = key % NBx, bj = Math.floor(key / NBx) % NBy, bk = Math.floor(key / (NBx * NBy));
    for (let c = 0; c < BS; c++) for (let b = 0; b < BS; b++) for (let a = 0; a < BS; a++) {
      let m = 0;
      for (let q = 0; q < 8; q++) { const v = arr[((c + (q >> 2 & 1)) * P1 + (b + (q >> 1 & 1))) * P1 + a + (q & 1)]; cv[q] = v; if (v < 0) m |= 1 << q }
      if (m === 0 || m === 255) continue;
      let sx = 0, sy = 0, sz = 0, n = 0;
      for (let e = 0; e < 24; e += 2) {
        const p = EF[e], q = EF[e + 1], vp = cv[p], vq = cv[q]; if ((vp < 0) === (vq < 0)) continue;
        const t = vp / (vp - vq), px = p & 1, py = p >> 1 & 1, pz = p >> 2 & 1;
        sx += px + ((q & 1) - px) * t; sy += py + ((q >> 1 & 1) - py) * t; sz += pz + ((q >> 2 & 1) - pz) * t; n++;
      }
      const gi = bi * BS + a, gj = bj * BS + b, gk = bk * BS + c;
      vmap.set(cellKey(gi, gj, gk), pos.length / 3);
      pos.push(x0 + (gi + sx / n) * cell, y0 + (gj + sy / n) * cell, z0 + (gk + sz / n) * cell);
    }
  }
  // faces: para cada aresta com troca de sinal, um quad com as 4 células em volta
  const idx = [];
  for (const [key, arr] of blocks) {
    const bi = key % NBx, bj = Math.floor(key / NBx) % NBy, bk = Math.floor(key / (NBx * NBy));
    for (let c = 0; c < BS; c++) for (let b = 0; b < BS; b++) for (let a = 0; a < BS; a++) {
      const gi = bi * BS + a, gj = bj * BS + b, gk = bk * BS + c, v0 = arr[(c * P1 + b) * P1 + a];
      for (let ax = 0; ax < 3; ax++) {
        const v1 = ax === 0 ? arr[(c * P1 + b) * P1 + a + 1] : ax === 1 ? arr[(c * P1 + b + 1) * P1 + a] : arr[((c + 1) * P1 + b) * P1 + a];
        if ((v0 < 0) === (v1 < 0)) continue;
        // as 4 células que compartilham a aresta
        let i1, i2, i3;
        if (ax === 0) { if (gj < 1 || gk < 1) continue; i1 = vmap.get(cellKey(gi, gj - 1, gk)); i2 = vmap.get(cellKey(gi, gj - 1, gk - 1)); i3 = vmap.get(cellKey(gi, gj, gk - 1)) }
        else if (ax === 1) { if (gi < 1 || gk < 1) continue; i1 = vmap.get(cellKey(gi, gj, gk - 1)); i2 = vmap.get(cellKey(gi - 1, gj, gk - 1)); i3 = vmap.get(cellKey(gi - 1, gj, gk)) }
        else { if (gi < 1 || gj < 1) continue; i1 = vmap.get(cellKey(gi - 1, gj, gk)); i2 = vmap.get(cellKey(gi - 1, gj - 1, gk)); i3 = vmap.get(cellKey(gi, gj - 1, gk)) }
        const i0 = vmap.get(cellKey(gi, gj, gk));
        if (i0 === undefined || i1 === undefined || i2 === undefined || i3 === undefined) continue;
        const ids = [i0, i1, i2, i3];
        if (v0 < 0) idx.push(ids[0], ids[1], ids[2], ids[0], ids[2], ids[3]); else idx.push(ids[0], ids[2], ids[1], ids[0], ids[3], ids[2]);
      }
    }
  }
  return { pos: new Float32Array(pos), idx, val, cell, origin: [x0, y0, z0] };
}

// ---------- montagem ----------
const cache = new Map();
export function buildBody(fit, presetId, opts = {}) {
  if (!fit || !fit.P || fit.P.kind === 'robot' || !BODIES[presetId]) return null;
  const T0 = performance.now(), P = fit.P;
  const hs = opts.headScale ?? 1, key = presetId + '|' + (opts.cell || 0) + '|' + hs;
  let geo, S;
  const hit = cache.get(key);
  if (hit) { geo = hit.geo.clone(); S = hit.S }
  else {
    S = makeBodySDF(fit, presetId, hs);
    const B = S.joints.bounds, cell = opts.cell || (S.joints.limb ? .014 : .028 * clamp(S.B.W, 1, 1.3));
    const m = mesh(S.f, B, cell);
    // projeta cada vértice na superfície (2 passos de Newton com gradiente numérico)
    const p = m.pos, e = cell * .5;
    for (let i = 0; i < p.length; i += 3) { // 1 passo de Newton, gradiente por tetraedro (4 avaliações)
      const x = p[i], y = p[i + 1], z = p[i + 2];
      const a1 = S.f(x + e, y - e, z - e), a2 = S.f(x - e, y - e, z + e), a3 = S.f(x - e, y + e, z - e), a4 = S.f(x + e, y + e, z + e);
      const d = (a1 + a2 + a3 + a4) / 4, gx = a1 - a2 - a3 + a4, gy = -a1 - a2 + a3 + a4, gz = -a1 + a2 - a3 + a4, gl = sqrt(gx * gx + gy * gy + gz * gz) || 1;
      const st = clamp(d, -cell, cell); p[i] -= gx / gl * st; p[i + 1] -= gy / gl * st; p[i + 2] -= gz / gl * st;
    }
    geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3)); geo.setIndex(m.idx); geo.computeVertexNormals();
    // remove partes escondidas dentro da cabeça/pescoço (economiza vértices; o pescoço do corpo cruza o da cabeça por dentro)
    cache.set(key, { geo: geo.clone(), S });
  }
  // cores: pele (ou cor dos membros nos vegetais) com variação suave, oclusão nas dobras, joelhos/cotovelos/mãos rosados
  const pa = geo.attributes.position, na = geo.attributes.normal, n = pa.count, colors = new Float32Array(n * 3), gloss = new Float32Array(n);
  const veg = S.joints.limb, base = new THREE.Color(veg ? (P.stem && P.stem.color) || '#4f7d22' : P.skin), hsl = {}; base.getHSL(hsl);
  const blush = new THREE.Color(P.blush || '#d66f72'), shade = new THREE.Color().setHSL(hsl.h - .02, Math.min(1, hsl.s * 1.05), hsl.l * .62), hi = new THREE.Color().setHSL(hsl.h + .01, hsl.s * .92, Math.min(.92, hsl.l * 1.1));
  const groove = P.patternColor ? new THREE.Color(P.patternColor[0]) : null, ridge = P.patternColor ? new THREE.Color(P.patternColor[1]) : null;
  const J = S.joints, c = new THREE.Color(), q = V();
  for (let i = 0; i < n; i++) {
    const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), ax = Math.abs(x);
    c.copy(base);
    const ns = Math.sin(x * 7.1 + y * 3.3) * Math.sin(z * 6.7 - y * 2.1) * .5 + Math.sin(x * 19 + z * 17 + y * 11) * .25;
    c.lerp(ns > 0 ? hi : shade, Math.abs(ns) * .12);
    // oclusão: o quanto o espaço logo fora da superfície está "fechado" (axilas, entre dedos, virilha)
    q.set(x + na.getX(i) * .07, y + na.getY(i) * .07, z + na.getZ(i) * .07); const ao = clamp(S.f(q.x, q.y, q.z) / .07, 0, 1);
    c.lerp(shade, (1 - ao) * .45);
    if (!veg) {
      let rosy = 0; for (const jn of ['knee', 'elbow']) { const jp = J[jn]; if (jp) rosy = Math.max(rosy, Math.exp(-((ax - jp.x) ** 2 + (y - jp.y) ** 2 + (z - jp.z) ** 2) / .03)) }
      if (J.wrist) rosy = Math.max(rosy, .6 * sstep(.25, -.1, (ax - J.wrist.x) * .7 - (y - J.wrist.y) * .7 + .0) * sstep(J.wrist.y + .1, J.wrist.y - .2, y));
      if (J.ankle) rosy = Math.max(rosy, .35 * sstep(J.ankle.y + .05, J.ankle.y - .15, y));
      c.lerp(blush, rosy * .22 * (P.blushK ?? .5) * 1.4);
    }
    if (J.ribs && groove && !veg) { const zc = (fit.cz || 0), phi = Math.atan2(ax < .9 ? x : x - Math.sign(x) * .4, z - zc), cc = .5 + .5 * Math.cos(J.ribs.n * phi); c.lerp(groove, (1 - Math.pow(cc, .35)) * .5).lerp(ridge, Math.pow(cc, 6) * .25) }
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b; gloss[i] = P.skinGloss || 0;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3)); geo.setAttribute('gloss', new THREE.BufferAttribute(gloss, 1));
  const pv = new THREE.Vector3(0, P.neck[3], P.neck[4]); // pivô da escala da cabeça (base do pescoço)
  const out = { geo, sdf: S.f, ySole: S.joints.ySole, timing: Math.round(performance.now() - T0), joints: S.joints, hs, pivot: pv,
    sdfHead: (x, y, z) => S.f(pv.x + hs * (x - pv.x), pv.y + hs * (y - pv.y), pv.z + hs * (z - pv.z)) / hs }; // corpo visto do espaço da cabeça (colisão do cabelo)
  return out;
}
