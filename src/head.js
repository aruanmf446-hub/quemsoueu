// Head V2 — cabeça cartoon 3D procedural (beauty pass).
//
// Forma base: um campo de distância (SDF) com volumes anatômicos fundidos por união suave — crânio, terço médio,
// maçãs do rosto, mandíbula (do queixo ao ângulo), queixo e pescoço. A malha é uma grade única (pele + pescoço)
// projetada nesse campo por raios a partir de dentro da cabeça.
// Relevo fino: um campo de deslocamento em (x, y) na frente do rosto — órbitas, prega da pálpebra, nariz (ponte,
// ponta, asas, narinas), lábios paramétricos com arco do cupido, filtro, sulcos e maçãs.
// A pele envolve o globo ocular (pálpebras na própria malha) e a abertura do olho é recortada nela.
// Sombreamento: shader de pele com "wrap" avermelhado (falso espalhamento subsuperficial), oclusão por cavidade
// calculada na malha, brilho por vértice (lábios), sombras projetadas. Sem assets externos.
import * as THREE from 'three';
import { resolve } from './presets.js';
import { buildCompanion } from './companions.js';
import { buildRobot } from './robot.js';
import { createRig } from './rig.js';

const { clamp } = THREE.MathUtils;
const sqrt = Math.sqrt, exp = Math.exp;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) };
const gau = (d, r) => exp(-(d * d) / (r * r));
const smaxS = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.max(a, b) + h * h * k * .25 };
const col = h => new THREE.Color(h);

// ---------- SDF ----------
function ellip(x, y, z, rx, ry, rz) {
  const a = x / rx, b = y / ry, c = z / rz, k0 = sqrt(a * a + b * b + c * c);
  const a1 = a / rx, b1 = b / ry, c1 = c / rz, k1 = sqrt(a1 * a1 + b1 * b1 + c1 * c1);
  return k1 > 1e-9 ? k0 * (k0 - 1) / k1 : -Math.min(rx, ry, rz);
}
// super-elipsoide: frente mais "chapada" (norma-p em xz para z>0, p≈2.3–2.8), nuca arredondada (rzB).
// A norma-p é aproximada sem pow (rápido): na diagonal ela vale 2^(1/p-1/2) da norma euclidiana; cF = 1 - esse fator.
const sqC = n => 1 - Math.pow(2, 1 / n - .5);
function superE(x, y, z, rx, ry, rzF, rzB, cF) {
  const X = Math.abs(x) / rx, Z = Math.abs(z) / (z > 0 ? rzF : rzB), q = X * X + Z * Z;
  let h = q;
  if (z > 0 && cF > 0 && q > 1e-12) { const w = 2 * X * Z / q, f = 1 - cF * w * w; h = q * f * f }
  const v = y / ry, k = sqrt(h + v * v);
  return (k - 1) * Math.min(rx, ry, z > 0 ? rzF : rzB);
}
function smin(a, b, k) { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * .25 }
function roundCone(px, py, pz, ax, ay, az, ra, bx, by, bz, rb) {
  const bax = bx - ax, bay = by - ay, baz = bz - az, pax = px - ax, pay = py - ay, paz = pz - az;
  const h = clamp((pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz), 0, 1);
  const dx = pax - bax * h, dy = pay - bay * h, dz = paz - baz * h;
  return sqrt(dx * dx + dy * dy + dz * dz) - (ra + (rb - ra) * h);
}

// ---------- casca facial por curvas (loft) ----------
// Cada fatia horizontal do rosto é uma super-elipse definida por três curvas da altura y:
//   a(y)  = meia-largura (contorno de frente: maçãs → mandíbula → queixo)
//   zf(y) = frente (perfil de base: testa → maçã → boca → queixo)
//   zb(y) = fundo  (ramo e linha de baixo da mandíbula, vista de perfil)
// Curvas: Hermite monotônica pelos pontos de controle → suavização gaussiana (curvatura contínua: sem faixas na luz)
// → fechamento elíptico nas pontas (queixo arredondado embaixo, some dentro do crânio em cima).
function pchip(xs, vs) {
  const n = xs.length, h = [], d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) { h[i] = xs[i + 1] - xs[i]; d[i] = (vs[i + 1] - vs[i]) / h[i] }
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m[i] = 0;
    else { const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]) }
  }
  return x => {
    x = clamp(x, xs[0], xs[n - 1]); let i = 0; while (i < n - 2 && x > xs[i + 1]) i++;
    const t = (x - xs[i]) / h[i], t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * vs[i] + (t3 - 2 * t2 + t) * h[i] * m[i] + (-2 * t3 + 3 * t2) * vs[i + 1] + (t3 - t2) * h[i] * m[i + 1];
  };
}
function makeLoft(L) {
  const Y = L.y, y0 = Y[0], y1 = Y[Y.length - 1], NT = 1024, dy = (y1 - y0) / (NT - 1);
  const fa = pchip(Y, L.a), ff = pchip(Y, L.zf), fb = pchip(Y, L.zb);
  let A = new Float64Array(NT), F = new Float64Array(NT), B = new Float64Array(NT);
  for (let i = 0; i < NT; i++) { const y = y0 + i * dy; A[i] = fa(y); F[i] = ff(y); B[i] = fb(y) }
  const sig = (L.blur ?? .05) / dy, R = Math.ceil(3 * sig), ker = [];
  let ks = 0; for (let k = -R; k <= R; k++) { const w = exp(-k * k / (2 * sig * sig)); ker.push(w); ks += w }
  const blur = T => { const o = new Float64Array(NT); for (let i = 0; i < NT; i++) { let v = 0; for (let k = -R; k <= R; k++) v += T[clamp(i + k, 0, NT - 1)] * ker[k + R]; o[i] = v / ks } return o };
  A = blur(A); F = blur(F); B = blur(B);
  const cb = L.cb ?? .1, ct = L.ct ?? .18;
  for (let i = 0; i < NT; i++) {
    const y = y0 + i * dy, f = (y < y0 + cb ? sqrt(Math.max(0, 1 - ((y0 + cb - y) / cb) ** 2)) : 1) * (y > y1 - ct ? sqrt(Math.max(0, 1 - ((y - (y1 - ct)) / ct) ** 2)) : 1);
    const mid = (F[i] + B[i]) / 2; A[i] *= f; F[i] = mid + (F[i] - mid) * f; B[i] = mid + (B[i] - mid) * f;
  }
  const cF = sqC(L.n ?? 2.4);
  return { y0, y1, cF, at(y, out) { const fi = clamp((y - y0) / dy, 0, NT - 1.0001), i = fi | 0, t = fi - i; out.a = A[i] + (A[i + 1] - A[i]) * t; out.zf = F[i] + (F[i + 1] - F[i]) * t; out.zb = B[i] + (B[i + 1] - B[i]) * t; return out } };
}

// ---------- forma por perfil girado (vegetais): largura r(y) em volta de um eixo vertical + tampa arredondada ----------
function makeLathe(Lt) {
  const NT = 768, y0 = Lt.y[0], y1 = Lt.y[Lt.y.length - 1], dy = (y1 - y0) / (NT - 1), f = pchip(Lt.y, Lt.r);
  const R = new Float64Array(NT), D = new Float64Array(NT);
  for (let i = 0; i < NT; i++) R[i] = f(y0 + i * dy);
  for (let i = 0; i < NT; i++) D[i] = (R[Math.min(i + 1, NT - 1)] - R[Math.max(i - 1, 0)]) / (dy * (i > 0 && i < NT - 1 ? 2 : 1));
  const zs = Lt.zs || 1, rc = Lt.rc || .3;
  return (x, y, z) => {
    const zz = (z - Lt.cz) / zs, rr = sqrt(x * x + zz * zz);
    const fi = clamp((y - y0) / dy, 0, NT - 1.0001), i = fi | 0, t = fi - i, r = R[i] + (R[i + 1] - R[i]) * t, dr = D[i] + (D[i + 1] - D[i]) * t;
    const dS = (rr - r) / sqrt(1 + dr * dr), yt = Lt.top - (Lt.dip || 0) * exp(-((rr / (Lt.dipR || .3)) ** 2)), dT = y - yt;
    const qx = dS + rc, qy = dT + rc; // canto arredondado (raio rc) entre a lateral e a tampa
    return (Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rc) * Math.min(1, zs);
  };
}

function makeSDF(P) {
  const [cy, cz, crx, cry, crz, crzB = crz, cn0 = 2] = P.cran, cn = sqC(cn0), [nr, nty, ntz, nby, nbz, nk] = P.neck;
  const LA = P.lathe && makeLathe(P.lathe);
  const L = LA ? null : makeLoft(P.loft), kf = LA ? 0 : P.loft.k ?? .16, sl = { a: 0, zf: 0, zb: 0 }, oc = P.occ;
  const cut = nby + .06;
  // esferas envolventes: se o ponto está longe de um volume, ele não altera a união suave → pula (bem mais rápido)
  const bs = (x, y, z, r) => ({ x, y, z, r }), far = (b, ax, y, z, d, k) => { const dx = ax - b.x, dy = y - b.y, dz = z - b.z; return sqrt(dx * dx + dy * dy + dz * dz) - b.r > d + k + .2 };
  const segB = (ax, ay, az, ra, bx2, by2, bz2, rb) => bs((ax + bx2) / 2, (ay + by2) / 2, (az + bz2) / 2, Math.hypot(bx2 - ax, by2 - ay, bz2 - az) / 2 + Math.max(ra, rb));
  const BN = segB(0, nty, ntz, nr, 0, nby, nbz, nr * 1.1), BO = oc && bs(0, oc[0], oc[1], Math.max(oc[2], oc[3], oc[4]));
  const S = P.scm, BS = S && segB(S[0], S[1], S[2], S[6], S[3], S[4], S[5], S[6]);
  const ER = P._earRoot, BE = ER && bs(ER[0], ER[1], ER[2], Math.max(ER[3], ER[4], ER[5]));
  const PT = P.pattern && { top: cy + cry * .98, bot: nby + .1, mid: cy - .2, cz: P.lathe ? P.lathe.cz : cz, ...P.pattern }; // esternocleidomastoideo: de trás da orelha à base do pescoço
  return (x, y, z) => {
    const ax = sqrt(x * x + 4e-4); // |x| suave
    let d;
    if (LA) d = LA(x, y, z); else {
    d = superE(x, y - cy, z - cz, crx, cry, crz, crzB, cn);
    if (oc && !far(BO, 0, y, z, d, oc[5])) d = smin(d, ellip(x, y - oc[0], z - oc[1], oc[2], oc[3], oc[4]), oc[5]); // occipital (nuca)
    if (y > L.y0 - .3 && y < L.y1 + .3) { // casca facial
      L.at(y, sl); const a = Math.max(sl.a, 1e-3), zc = sl.zb + (sl.zf - sl.zb) * .45, front = z > zc;
      const X = ax / a, Z = front ? (z - zc) / Math.max(sl.zf - zc, 1e-3) : (zc - z) / Math.max(zc - sl.zb, 1e-3), q = X * X + Z * Z;
      let h = sqrt(q); if (front && q > 1e-12) { const w = 2 * X * Z / q; h *= 1 - L.cF * w * w }
      let dl = (h - 1) * Math.min(a, Math.max(sl.zf - zc, 1e-3)) * .9;
      if (y < L.y0) dl = Math.max(dl, L.y0 - y); else if (y > L.y1) dl = Math.max(dl, y - L.y1);
      d = smin(d, dl, kf);
    }
    if (!far(BN, ax, y, z, d, nk)) d = smin(d, roundCone(x * 1.14, y, z, 0, nty, ntz, nr, 0, nby, nbz, nr * 1.08) * .92, nk); // seção oval (mais funda que larga)
    if (S && !far(BS, ax, y, z, d, S[7])) d = smin(d, roundCone(ax, y, z, S[0], S[1], S[2], S[6], S[3], S[4], S[5], S[6] * .8), S[7]);
    if (ER && !far(BE, ax, y, z, d, .08)) d = smin(d, ellip(ax - ER[0], y - ER[1], z - ER[2], ER[3], ER[4], ER[5]), .08); // raiz da orelha
    }
    if (PT) { // padrão em volta do eixo vertical: nervuras (cacto) ou gomos (pimentão); some nos polos e, se pedido, no meio do rosto
      const rx = x, rz = z - PT.cz, rr = sqrt(rx * rx + rz * rz) + 1e-6, phi = Math.atan2(rx, rz), pole = sstep(PT.top, PT.top - .25, y) * sstep(PT.bot, PT.bot + .2, y);
      const face = PT.faceFade ? 1 - PT.faceFade * sstep(.35, .8, rz / rr) * gau(y + .15, .5) : 1;
      let v = 0;
      if (PT.type === 'ribs') v = -PT.depth * (1 - sqrt(.5 + .5 * Math.cos(PT.n * phi + (PT.phase || 0))));
      else { const c = .5 + .5 * Math.cos(PT.n * phi + (PT.phase || 0)); v = -PT.depth * (1 - Math.pow(c, .3)) * (.45 + .55 * Math.min(1, Math.abs(y - PT.mid) / .55)) }
      d -= v * pole * face;
    }
    return y - cut > .05 ? d : smaxS(d, cut - y, .05);
  };
}

// do ponto interno O, ao longo de dir, até a primeira saída da superfície. sGuess = distância do vizinho (acelera muito).
function traceOut(sdf, ox, oy, oz, dx, dy, dz, sGuess = 0) {
  let s = Math.max(sGuess - .02, 0), d = sdf(ox + dx * s, oy + dy * s, oz + dz * s);
  if (d >= 0) { s = 0; d = sdf(ox, oy, oz) }
  let prev = s, dp = d;
  for (let k = 0; k < 90; k++) {
    prev = s; dp = d; s += Math.max(-d * .9, .002);
    d = sdf(ox + dx * s, oy + dy * s, oz + dz * s);
    if (d >= 0) break;
  }
  // regula falsi (Illinois) no intervalo [prev, s]
  let a = prev, fa = dp, b = s, fb = d, side = 0;
  for (let j = 0; j < 7 && b - a > 1e-5; j++) {
    const m = (a * fb - b * fa) / (fb - fa), fm = sdf(ox + dx * m, oy + dy * m, oz + dz * m);
    if (fm < 0) { a = m; fa = fm; if (side === -1) fb *= .5; side = -1 } else { b = m; fb = fm; if (side === 1) fa *= .5; side = 1 }
  }
  return (a * fb - b * fa) / (fb - fa);
}
// superfície frontal z(x, y): raio vindo da frente
function makeFrontZ(sdf) {
  return (x, y) => {
    let z = 1.5, prev = z, d = sdf(x, y, z);
    for (let k = 0; k < 80; k++) {
      if (d < 0) { let a = prev, b = z; for (let j = 0; j < 16; j++) { const m = (a + b) * .5; if (sdf(x, y, m) < 0) b = m; else a = m; if (a - b < 2e-5) break } return (a + b) * .5 }
      if (z < -.5) return -.5;
      prev = z; z -= Math.max(d * .9, .002); d = sdf(x, y, z);
    }
    return z;
  };
}

// ruído de valor 3D (determinístico, sem dependências) — variação orgânica da pele
function hash3(i, j, k) { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(k, 1274126177) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295 }
function vnoise(x, y, z) {
  const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z), fx = x - i, fy = y - j, fz = z - k;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz), L = (a, b, t) => a + (b - a) * t;
  return L(L(L(hash3(i, j, k), hash3(i + 1, j, k), u), L(hash3(i, j + 1, k), hash3(i + 1, j + 1, k), u), v),
           L(L(hash3(i, j, k + 1), hash3(i + 1, j, k + 1), u), L(hash3(i, j + 1, k + 1), hash3(i + 1, j + 1, k + 1), u), v), w);
}

// ---------- olho: quadro local ----------
function cornerFn(u, peak, power=.8) { // 0 nos cantos, 1 no ponto mais aberto
  if (Math.abs(u) >= 1) return 0;
  const w = u < peak ? (u - peak) / (peak + 1) : (u - peak) / (1 - peak);
  return Math.pow(Math.cos(clamp(w, -1, 1) * Math.PI / 2), power);
}
function eyeFrame(P, s) {
  const th = s * P.tilt, c = Math.cos(th), sn = Math.sin(th), Re = P.Re;
  const e = { s, ex: s * P.eyeX, ey: P.eyeY, halfW: Re * Math.sin(P.openW) * 1.02, hu: Re * Math.sin(P.openU) * 1.1, hl: Re * Math.sin(-P.openL) * 1.1, Rl: Re * 1.035, zc: 0 };
  e.Rl2 = e.Rl * e.Rl;
  e.local = (x, y) => { const dx = x - e.ex, dy = y - e.ey; return [s * (dx * c + dy * sn), -dx * sn + dy * c] };
  e.toHead = (U, V) => { const lx = s * U; return [e.ex + lx * c - V * sn, e.ey + lx * sn + V * c] };
  e.H = (uN, up) => up ? e.hu * cornerFn(uN, P.peakU,P.upperLidPower??.8) : e.hl * cornerFn(uN, P.peakL,P.lowerLidPower??.8);
  return e;
}

// ---------- curva da boca (compartilhada entre relevo, traço e dentes) ----------
// sorriso: cantos sobem; smirk: só o canto direito sobe (sorriso torto); open: abertura (crescente) abaixo da curva
export function mouthCurve(P) {
  const mw = P.mouthW, sm = P.smirk || 0;
  const sL = P.smileL || 0, sR = P.smileR || 0;
  const ym = x => { const k = clamp(x / mw, -1.25, 1.25), t = Math.abs(k); return P.mouthY + (P.smile + (k < 0 ? sL : sR)) * .04 * t * t - .004 * gau(x, .03) + sm * .05 * Math.max(k, 0) ** 2 - sm * .008 * Math.max(-k, 0) ** 2 };
  const open = x => P.open ? P.open * Math.pow(Math.max(0, 1 - (Math.abs(x) / (mw * .98)) ** 2), .7) : 0;
  return { ym, open, mw };
}

// ---------- relevo do rosto + máscaras de cor ----------
function makeFaceField(P, eyes) {
  const eyeX = P.eyeX, eyeY = P.eyeY, tipY = P.noseTipY, mY = P.mouthY, mw = P.mouthW, nW = P.noseW, Re = P.Re;
  const rootY = eyeY - .02, chinY = P.loft.y[0] + .02;
  const out = { dz: 0, lipU: 0, lipL: 0, lipHi: 0, line: 0, blush: 0, ao: 0, nostril: 0, lid: 0, hi: 0, gloss: 0, under: 0, cav: 0 };
  const MC = mouthCurve(P), ymAt = MC.ym, noNose = P.noseType === 'none' || P.noseType === 'ball';
  return function field(x, y) {
    const ax = sqrt(x * x + 1e-4); // |x| suave: sem vinco na linha média
    const ymC = ymAt(x < 0 ? -mw : mw); let cav = 0;
    const sX = x < 0 ? (P.smileL || 0) : (P.smileR || 0), smS = P.smile + sX; // sorriso deste lado (base + expressão)
    let dz = 0, ao = 0, hi = 0, lid = 0, lipU = 0, lipL = 0, lipHi = 0, line = 0, nostril = 0, gloss = 0, under = 0;
    // testa e arcada
    dz += P.browRidge * exp(-((ax / .58) ** 4)) * gau(y - (eyeY + .25), .09); // arcada contínua (sem vale no meio)
    hi += .35 * gau(x, .28) * gau(y - .45, .22);
    // órbitas
    const sock = gau(ax - eyeX, Re * 1.15) * gau(y - eyeY, Re * .95);
    dz -= P.socket * sock;
    const inner = gau(ax - (eyeX - Re * .98), .06) * gau(y - (eyeY + .01), .07);
    dz -= .024 * inner; ao += .35 * inner;
    // pálpebras: prega, pele da pálpebra, bolsinha inferior
    for (const e of eyes) {
      const [U, V] = e.local(x, y), uN = U / e.halfW;
      if (uN < -1.5 || uN > 1.6 || V < -.32 || V > .3) continue;
      const uc = clamp(uN, -1, 1), Hu = e.H(uc, true), Hl = e.H(uc, false);
      const fade = (1 - sstep(.7, 1.1, uN)) * (1 - sstep(.6, 1.0, -uN));
      const vc = Hu + P.creaseGap * (.4 + .6 * cornerFn(uc * .9, P.peakU));
      const cr = gau(V - vc, .015) * fade;
      dz -= P.crease * cr; ao += .9 * cr * P.crease / .016;
      dz += P.crease * .5 * gau(V - (vc - .024), .017) * fade;
      if (V > 0) lid = Math.max(lid, fade * sstep(vc + .07, vc - .01, V));
      // arcada sobre o olho: "prateleira" acima da dobra que sombreia a pálpebra e corre até a têmpora
      const orb = P.orbit ?? .02, span = sstep(-1.15, -.4, uN) * (1 - sstep(1.2, 1.8, uN)), vr = vc + .075 + .03 * sstep(0, 1.2, uN);
      dz += orb * gau(V - vr, .055) * span; hi += .5 * gau(V - vr - .01, .035) * span * orb / .02;
      ao += .5 * gau(V - (vc + .02), .03) * span * (orb / .02) * sstep(-.5, .3, uN); // sombra sob a arcada (lado externo)
      // pálpebra superior com espessura: borda arredondada logo acima da abertura
      if (V > 0) dz += (P.lidFold ?? .008) * gau(V - (Hu + .014), .016) * fade;
      // pálpebra inferior: rolinho visível que emenda na maçã
      dz += (P.lowerRoll ?? .006) * gau(V + Hl + .022, .016) * fade;
      hi += .6 * gau(V + Hl + .026, .012) * fade;
      dz += .003 * gau(V + Hl + .045, .03) * fade;
      if (V < 0) under = Math.max(under, fade * gau(V + Hl + .065, .05));
    }
    // maçãs do rosto
    // maçãs: altas (logo abaixo do olho) e cheias, descendo até o canto da boca; o sorriso empurra para cima
    const chY = P.cheekY ?? (eyeY - .27), chX = P.cheekX ?? .42;
    dz += P.cheekH * gau(ax - chX, P.cheekW??.19) * gau(y - (chY + .025 * smS), P.cheekTall??.15) + P.cheekH * .45 * gau(ax - (mw + .1), .13) * gau(y - (ymC + .08), .12);
    if (sX > 0) { // expressão de sorriso: maçã sobe e enche, canto empurra a bochecha
      dz += sX * .03 * gau(ax - (mw + .1), .12) * gau(y - (ymC + .12), .11) + sX * .02 * gau(ax - chX, .17) * gau(y - (chY + .05), .13);
    } else if (sX < 0) { // tristeza: queixo contrai (bolinha do queixo) e cantos afundam
      dz += -sX * .014 * gau(x, .1) * gau(y - (mY - P.lipL - .1), .06);
      dz -= -sX * .01 * gau(ax - (mw + .02), .04) * gau(y - (ymC - .03), .05);
    }
    // planos de estrutura: zigomático (crista que sobe para a orelha), cavado abaixo dele, têmporas
    if (P.zyg) { const zy = gau(ax - .52, P.sculptedFace?.24:.15) * gau(y - (eyeY - .17) - .25 * (ax - .52), P.sculptedFace?.14:.065); dz += P.zyg * zy; hi += .6 * zy * P.zyg / .02 }
    if (P.hollow) { const ho = gau(ax - .5, .13) * gau(y - (mY + .1), .11); dz -= P.hollow * ho; ao += .45 * ho * P.hollow / .015 }
    if (P.temple) { const te = gau(ax - .66, .12) * gau(y - (eyeY + .2), .13); dz -= P.temple * te; ao += .25 * te * P.temple / .015 }
    // ---- nariz: forma contínua — ponte → ponta alongada (sem "bolinha") → base; asas baixas e recuadas; narinas por baixo ----
    if (!noNose && ax < .42 && y < rootY + .25 && y > tipY - .3) {
      const span = rootY - tipY, q = (rootY - y) / span, qc = clamp(q, 0, 1), below = Math.max(0, (q - 1) * span);
      const bw = (.036 + .034 * qc * qc) * nW, xb = x / bw;
      if(P.sculptedNose){
        // Ponte larga se funde com ponta e asas elípticas. Derivadas contínuas evitam
        // o antigo bico estreito, com degraus na base e na ponta do nariz.
        const bridge=P.noseH*Math.pow(qc,1.25)*gau(below,P.tipR*.95)*gau(x,(.052+.030*qc)*nW);
        const tip=(P.tipH+P.noseH*.34)*Math.exp(-((x/(P.tipR*nW))**2)-((y-tipY-.018)/(P.tipR*1.12))**2);
        const wings=P.alaeH*gau(ax-P.alaeX*nW,.055*nW)*gau(y-tipY+.018,.051);
        dz+=smaxS(bridge,tip,.035)-.035*.25+wings+(P.bridgeBump||0)*gau(q-.53,.25)*gau(x,bw*1.3);
        const n2=((ax-.052*nW)/(.024*nW))**2+((y-tipY+.051)/.016)**2;
        nostril=Math.exp(-n2*1.4)*.65;dz-=.012*nostril;
        ao+=.12*gau(ax-.104*nW,.027)*gau(y-tipY+.022,.045);
        hi+=.20*gau(x,P.tipR*.7)*gau(y-tipY-.028,.055);
      }else{
      const prof = P.noseH * Math.pow(qc, P.scoop) * exp(-((below / (P.tipR * .8)) ** 2));
      dz += prof * exp(-xb * xb);
      dz += (P.bridgeBump||0)*gau(q-.55,.24)*gau(x,bw*1.1);
      hi += .4 * exp(-((x / (bw * .42)) ** 2)) * sstep(.3, .7, q) * (1 - sstep(.9, 1.1, q));
      ao += .22 * gau(ax - bw * 1.25, bw * .55) * sstep(.15, .5, q) * (1 - sstep(.85, 1.05, q)); // laterais da ponte
      const dy = y - (tipY + .012), ry = dy > 0 ? P.tipR * 1.9 : P.tipR * .78, r2 = (x / (P.tipR * nW)) ** 2 + (dy / ry) ** 2;
      if (r2 < 1) { const k = 1 - r2; dz += P.tipH * k * k; hi += 1.0 * k * k * k * sstep(-.5, .3, dy / ry); gloss += .3 * k * k }
      const aX = P.alaeX * nW, ex = (ax - aX) / (.044 * nW), ey = (y - (tipY - .014)) / .036, a2 = ex * ex + ey * ey;
      if (a2 < 1) dz += P.alaeH * (1 - a2) * (1 - a2);
      const ring = sqrt(a2), side = clamp(sstep(-.1, .6, ex) + .6 * sstep(.1, .7, ey) * sstep(-.6, 0, ex), 0, 1);
      const crease = gau(ring - 1.0, .16) * side;
      dz -= P.alaeH * .35 * crease; ao += .35 * crease;
      const n2 = ((ax - .036 * nW) / (.022 * nW)) ** 2 + ((y - (tipY - .047)) / .012) ** 2;
      nostril = exp(-n2 * 1.6) * .75; dz -= .009 * nostril;
      const under = gau(x, .07) * gau(y - (tipY - .078), .022);
      dz -= .008 * under; ao += .2 * under;
      }
    }
    // ---- boca ----
    const t = ax / mw;
    dz += P.muzzle * gau(x, .34) * gau(y - (mY + .03), .2);
    if (t < 3 && y > mY - .4 && y < tipY + .1) {
      const ym = ymAt(x), opn = MC.open(x), ymL = ym - opn, tc = Math.min(t, 1), xf = t < 1 ? 1 : exp(-(((t - 1) / .1) ** 2));
      // espessuras ao longo da largura: lábio de cima fino com arco do cupido macio; de baixo cheio e arredondado, afinando nos cantos
      const thU = P.lipU * Math.pow(Math.max(0, 1 - Math.pow(tc, 2.2)), .8) * (1 + P.bow * (.35 * gau(tc - .28, .14) - .28 * gau(tc, .07)));
      const thL = P.lipL * Math.pow(Math.max(0, 1 - Math.pow(tc, 1.8)), .75) * (1 + .12 * gau(tc - .32, .22));
      if (y >= ym) {
        // lábio de cima: plano inclinado para a frente, mais saliente perto da borda; "rolinho" claro na borda (vermilion)
        const v = (y - ym) / Math.max(thU, .003), sh = v < .6 ? .55 + .45 * Math.sin(Math.PI * .5 * v / .6) : exp(-(((v - .6) / .6) ** 2));
        const upper=P.sculptedFace?gau(v-.45,.72)*sstep(-.05,.18,v):sh*sstep(-.05,.25,v);
        dz += P.lipH * .85 * (thU / P.lipU) * upper * xf + P.lipH * .06 * gau(v - 1.0, .12) * xf;
        lipU = (1 - sstep(.88, 1.2, v)) * sstep(.0015, .006, thU);
        hi += .18 * gau(v - 1.04, .1) * xf * sstep(.002, .01, thU);
      } else if (y > ymL) { // boca aberta: cavidade entre os lábios
        cav = sstep(0, .012, ym - y) * sstep(0, .012, y - ymL) * (t < .97 ? 1 : exp(-(((t - .97) / .03) ** 2)));
      } else {
        // lábio de baixo: volume redondo (seção quase circular), mais cheio no centro
        const w = (ymL - y) / Math.max(thL, .003), r = clamp(1 - ((w - .45) / .75) ** 2, 0, 1);
        const lower=P.sculptedFace?gau(w-.43,.72):r*(2-r);
        dz += P.lipH * 1.2 * (thL / P.lipL) * lower * sstep(-.05, .2, w) * xf;
        lipL = (1 - sstep(.78, 1.22, w)) * sstep(.0015, .006, thL);
        lipHi = gau(w - .4, .2) * gau(x, mw * .4);
      }
      const lf = t < 1 ? 1 : exp(-(((t - 1) / .06) ** 2));
      const yl = clamp(y, ymL, ym); // distância à abertura (uma linha quando fechada)
      dz -= .02 * gau(y - yl, .008 + .004 * tc) * lf;
      line = gau(y - yl, .006 + .002 * tc) * lf;
      const corner = gau(ax - mw * 1.0, .018) * gau(y - ymC, .02);
      dz -= .018 * corner; ao += .6 * corner; // canto encaixado na bochecha
      dz += Math.max(0, Math.min(smS, 1.4)) * .016 * gau(ax - (mw + .07), .06) * gau(y - (ymC + .03), .07);
      if (smS > .45) { // covinha curta além do canto: sorriso mais natural
        const dm = gau(ax - (mw * 1.1 + .012), .013) * gau(y - (ymC + .012), .03) * Math.min(smS - .45, 1);
        dz -= .012 * dm; ao += .9 * dm;
      }
      const oC = MC.open(0), sul = gau(y - (mY - oC - P.lipL - .052), .03) * gau(x, mw * .85);
      dz -= .016 * sul; ao += .4 * sul;
      ao += .35 * gau(y - (mY - oC - P.lipL - .022), .02) * gau(x, mw * .7);
      const band = sstep(mY + P.lipU * .9, mY + P.lipU * 1.5, y) * sstep(tipY - .03, tipY - .09, y);
      dz -= .0035 * gau(x, .024) * band; dz += .0018 * gau(ax - .032, .02) * band;
      gloss += lipU * .55 + lipL * 1.0;
      const fold = (P.fold ?? .5) * (.4 + .6 * clamp(smS, 0, 1)) + .5 * Math.max(sX, 0);
      if (fold > .05) { // dobra nasolabial (sorriso / maturidade)
        const px = .14 * nW, py = tipY - .02, sx = mw * 1.1 - px, sy = ymC + .01 - py;
        const tt = clamp(((ax - px) * sx + (y - py) * sy) / (sx * sx + sy * sy), 0, 1);
        const dd = Math.hypot(ax - (px + sx * tt), y - (py + sy * tt)), nl = gau(dd, .035) * Math.pow(Math.sin(Math.PI * tt), .7);
        dz -= .014 * fold * nl; ao += .3 * nl * fold;
      }
    }
    // queixo
    dz += P.chinH * gau(x, P.chinW??.2) * gau(y - (chinY + .06), .12);
    hi += .35 * gau(x, .12) * gau(y - (chinY + .08), .08);
    // zona T e pálpebras levemente mais brilhantes (pele viva, não plástico uniforme)
    gloss += .3 * gau(x, .16) * gau(y - .42, .2) + .22 * gau(x, .06) * sstep(eyeY - .02, tipY + .02, y) * (y < rootY + .05 ? 1 : 0) + .18 * gau(x, .14) * gau(y - (chinY + .08), .08) + .15 * lid;
    out.under = under; out.cav = cav;
    out.dz = dz; out.ao = ao; out.hi = hi; out.lid = lid; out.lipU = lipU; out.lipL = lipL; out.lipHi = lipHi; out.line = line; out.nostril = nostril; out.gloss = gloss;
    out.blush = .75 * gau(ax - chX, .21) * gau(y - (chY + .02), .16) + .5 * gau(x, .08) * gau(y - tipY, .07) + .12 * gau(x, .2) * gau(y - (chinY + .06), .12);
    return out;
  };
}

// ---------- utilidades de malha ----------
function ribbon(pts, rw, rh, nrm, seg = 10) {
  const n = pts.length, pos = [], idx = [], t = new THREE.Vector3(), w = new THREE.Vector3(), nn = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    t.copy(b).sub(a).normalize(); nn.copy(nrm(i, pts[i]));
    w.crossVectors(t, nn).normalize(); nn.crossVectors(w, t).normalize();
    for (let j = 0; j < seg; j++) {
      const al = j / seg * Math.PI * 2, c = Math.cos(al) * rw[i], s = Math.sin(al) * rh[i];
      pos.push(pts[i].x + w.x * c + nn.x * s, pts[i].y + w.y * c + nn.y * s, pts[i].z + w.z * c + nn.z * s);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < seg; j++) {
    const a = i * seg + j, b = i * seg + (j + 1) % seg, c = (i + 1) * seg + j, d = (i + 1) * seg + (j + 1) % seg;
    idx.push(a, c, b, b, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals(); return fixNormals(geo);
}
function fixNormals(geo) { // normais unitárias (fitas com pontas finas geram normais nulas) → GLB sem avisos
  const n = geo.attributes.normal.array;
  for (let i = 0; i < n.length; i += 3) { const l = Math.hypot(n[i], n[i + 1], n[i + 2]); if (l > 1e-8) { n[i] /= l; n[i + 1] /= l; n[i + 2] /= l } else { n[i] = 0; n[i + 1] = 0; n[i + 2] = 1 } }
  return geo;
}
function mirrorX(geo) {
  const g = geo.clone(); g.scale(-1, 1, 1);
  const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t }
  g.index.needsUpdate = true; g.computeVertexNormals(); return fixNormals(g);
}
function setColors(geo, fn) {
  const p = geo.attributes.position, cl = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { fn(c, p.getX(i), p.getY(i), p.getZ(i), i); cl[i * 3] = c.r; cl[i * 3 + 1] = c.g; cl[i * 3 + 2] = c.b }
  geo.setAttribute('color', new THREE.BufferAttribute(cl, 3));
  if (!geo.attributes.gloss) geo.setAttribute('gloss', new THREE.BufferAttribute(new Float32Array(p.count), 1));
  return geo;
}
function mergeGeos(list) { // junta geometrias indexadas (cor/brilho só se todas tiverem)
  const hasC = list.every(g => g.attributes.color);
  let nv = 0, ni = 0; for (const g of list) { nv += g.attributes.position.count; ni += g.index.count }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), colA = new Float32Array(nv * 3), gl = new Float32Array(nv), idx = new Uint32Array(ni);
  let ov = 0, oi = 0;
  for (const g of list) {
    const n = g.attributes.position.count;
    pos.set(g.attributes.position.array, ov * 3); nor.set(g.attributes.normal.array, ov * 3); if (hasC) colA.set(g.attributes.color.array, ov * 3);
    if (g.attributes.gloss) gl.set(g.attributes.gloss.array, ov);
    const ia = g.index.array; for (let i = 0; i < ia.length; i++) idx[oi + i] = ia[i] + ov;
    ov += n; oi += ia.length;
  }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  if (hasC) { m.setAttribute('color', new THREE.BufferAttribute(colA, 3)); m.setAttribute('gloss', new THREE.BufferAttribute(gl, 1)) }
  for (let i = 0; i < nor.length; i += 3) { const l = Math.hypot(nor[i], nor[i + 1], nor[i + 2]); if (l > 1e-8) { nor[i] /= l; nor[i + 1] /= l; nor[i + 2] /= l } else nor[i + 2] = 1 }
  m.setIndex(new THREE.BufferAttribute(idx, 1)); list.forEach(g => g.dispose()); return m;
}

function irisTexture(cols, pupil) {
  const W = 512, H = 256, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  // eixo y: do centro da pupila (topo) até a borda da íris (base). eixo x: ângulo (u≈.25 = parte de baixo do olho)
  const p = pupil, g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#040202'); g.addColorStop(p - .02, '#070404'); g.addColorStop(p + .03, cols[0]);
  g.addColorStop(p + .2, cols[1]); g.addColorStop(.8, cols[2]); g.addColorStop(.9, '#1c0e06'); g.addColorStop(1, '#0d0603');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 900; i++) { // fibras radiais
    const x = rnd() * W, y0 = H * (p + .02 + rnd() * .08), y1 = H * (.55 + rnd() * .35);
    c.strokeStyle = rnd() > .45 ? 'rgba(255,226,160,' + (.05 + rnd() * .12) + ')' : 'rgba(35,15,4,' + (.08 + rnd() * .16) + ')';
    c.lineWidth = .8 + rnd() * 2.2; c.beginPath(); c.moveTo(x, y0); c.quadraticCurveTo(x + (rnd() - .5) * 8, (y0 + y1) / 2, x + (rnd() - .5) * 4, y1); c.stroke();
  }
  const ring = c.createLinearGradient(0, H * (p - .01), 0, H * (p + .14)); // colarete claro
  ring.addColorStop(0, 'rgba(255,225,150,0)'); ring.addColorStop(.45, 'rgba(255,225,150,.32)'); ring.addColorStop(1, 'rgba(255,225,150,0)');
  c.fillStyle = ring; c.fillRect(0, H * (p - .01), W, H * .15);
  // luz entrando por baixo (cáustica) e sombra da pálpebra em cima
  const lg = c.createLinearGradient(0, 0, W, 0);
  for (let k = 0; k <= 16; k++) { const u = k / 16, v = Math.cos(2 * Math.PI * (u - .25)); lg.addColorStop(u, v > 0 ? 'rgba(255,200,120,' + (.38 * v * v).toFixed(3) + ')' : 'rgba(10,4,0,' + (.5 * v * v).toFixed(3) + ')') }
  c.globalCompositeOperation = 'source-atop'; c.fillStyle = lg; c.fillRect(0, H * (p + .03), W, H * (.97 - p));
  c.globalCompositeOperation = 'source-over';
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.wrapS = THREE.RepeatWrapping; return t;
}

// Pele: difusa com "wrap" colorido (luz vermelha atravessa o terminador) + rugosidade por vértice (brilho dos lábios)
function skinMaterial(P = {}) {
  const m = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: P.rough ?? .58, metalness: 0, specularIntensity: .5, sheen: P.sheen ?? .32, sheenRoughness: .5, sheenColor: col(P.sheenColor || '#ffcdb8'), clearcoat: P.clearcoat ?? .22, clearcoatRoughness: P.clearcoatRough ?? .38, name: 'Skin' });
  const sss = P.sss || [.5, .22, .14];
  // Cada material conserva seu uniforme ao recompilar; o programa pode ser compartilhado sem misturar peles.
  const sssUniform = { value: new THREE.Vector3(...sss) };
  m.onBeforeCompile = sh => {
    sh.uniforms.uSSS = sssUniform;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float gloss;\nvarying float vGloss;\nvarying vec3 vObjPos;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvGloss = gloss; vObjPos = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vGloss;\nvarying vec3 vObjPos;\nuniform vec3 uSSS;\n' +
        'float h31(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }\n' +
        'float vn3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);\n' +
        '  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),\n' +
        '             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }\n' +
        // O detalhe menor que um pixel converge para a média, sem cintilação ao afastar a câmera.
        'float skinDetailWeight(vec3 p){ float footprint = max(length(dFdx(p)), length(dFdy(p))); return 1. - smoothstep(.5, 1.5, footprint); }\n' +
        // Gradiente de superfície no espaço da vista: acompanha escala, rotação, ossos e blendshapes.
        // Evita tratar o ruído no espaço do objeto como se já estivesse no espaço do mundo.
        'vec3 skinBumpNormal(vec3 surfPos, vec3 surfNormal, float height, float faceDir){\n' +
        '  vec3 dx = dFdx(surfPos), dy = dFdy(surfPos);\n' +
        '  vec3 r1 = cross(dy, surfNormal), r2 = cross(surfNormal, dx);\n' +
        '  float det = dot(dx, r1) * faceDir;\n' +
        '  vec2 heightGradient = vec2(dFdx(height), dFdy(height));\n' +
        '  if(abs(det) < 1e-12) return surfNormal;\n' +
        '  vec3 gradient = sign(det) * (heightGradient.x * r1 + heightGradient.y * r2);\n' +
        '  return normalize(abs(det) * surfNormal - gradient);\n' +
        '}')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n' +
        'float gl = clamp(vGloss, 0., 1.); vec3 porePos = vObjPos * 140.;\n' +
        'float pn = mix(.5, vn3(porePos), skinDetailWeight(porePos));\n' +
        'roughnessFactor = mix(roughnessFactor, .26, gl) * (.92 + .16 * pn);')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' +
        '{ // Altura microscópica filtrada nas duas frequências; não desloca nenhum vértice.\n' +
        '  vec3 p2 = vObjPos * 330.;\n' +
        '  float height = (.000225 * (pn - .5) + .000057 * (vn3(p2) - .5) * skinDetailWeight(p2)) * (1. - .7 * gl);\n' +
        '  normal = skinBumpNormal(-vViewPosition, normal, height, faceDirection); }')
      .replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\n#ifdef USE_CLEARCOAT\n material.clearcoat *= mix(.45, 1.0, gl);\n#endif')
      .replace('#include <lights_fragment_begin>', THREE.ShaderChunk.lights_fragment_begin.replace(
        'directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;',
        '{ float shF = ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;\n' +
        '  directLight.color *= mix( 1.0, shF, smoothstep( 0.0, 0.35, dot( geometryNormal, directLight.direction ) ) ); }'))
      .replace('#include <lights_physical_pars_fragment>', THREE.ShaderChunk.lights_physical_pars_fragment.replace(
        'reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );',
        'float nlW = dot( geometryNormal, directLight.direction ); vec3 wW = uSSS;\n' +
        'vec3 wrapD = pow( clamp( ( vec3( nlW ) + wW ) / ( 1.0 + wW ), 0.0, 1.0 ), vec3( 1.5 ) );\n' +
        'reflectedLight.directDiffuse += wrapD * directLight.color * BRDF_Lambert( material.diffuseColor );'));
  };
  m.customProgramCacheKey = () => 'skin-wrap-v6-filtered';
  return m;
}

// ---------- visual escolhido no ateliê: cor de pele e barba (o resto do visual — cabelo e acessórios — fica em look.js) ----------
// Trocar a pele desloca junto as cores que nascem dela (blush, sombra da pálpebra, olheira, sulcos de vegetal),
// mantendo a relação de tom do preset. Lábios escurecem/clareiam só um pouco.
function shiftLike(hex, from, to, k = 1) {
  const a = {}, b = {}, c = {}; col(from).getHSL(a); col(to).getHSL(b); const o = col(hex); o.getHSL(c);
  const dh = ((b.h - a.h + 1.5) % 1) - .5, sr = b.s / Math.max(a.s, .02), lr = b.l / Math.max(a.l, .02);
  return '#' + new THREE.Color().setHSL((c.h + dh * k + 1) % 1, clamp(c.s * (1 + (sr - 1) * k), 0, 1), clamp(c.l * (1 + (lr - 1) * k), 0, .95)).getHexString();
}
export const BEARD_STYLES = {
  default: 'Do personagem', none: 'Sem barba', shadow: 'Sombreada', full: 'Cheia', stache: 'Bigode', goatee: 'Bigode + cavanhaque'
};
function applyLook(P, o) {
  if (o.skin && o.skin !== P.skin) {
    const from = P.skin, to = o.skin, veg = !!P.lathe;
    for (const k of ['blush', 'lidShadow', 'bag']) if (P[k]) P[k] = shiftLike(P[k], from, to);
    if (P.patternColor) P.patternColor = P.patternColor.map(h => shiftLike(h, from, to));
    if (veg) { P.lip = shiftLike(P.lip, from, to); P.lipLine = shiftLike(P.lipLine, from, to); P.brow = shiftLike(P.brow, from, to, .5) }
    else P.lip = shiftLike(P.lip, from, to, .35);
    if (P.paint) P.paint = { ...P.paint };
    P.skin = to;
  }
  const hc = o.hairColor, b = o.beard && o.beard !== 'default' ? o.beard : null, mw = P.mouthW || .22;
  if (b) {
    P.beard = 0; P.beardVol = null; P.stache = null; P.goatee = null;
    if (b === 'shadow') P.beard = .32;
    if (b === 'full') { P.beardVol = { thick: .055, len: .38, color: '#3a2618', stache: true }; P.beard = .12 }
    if (b === 'stache' || b === 'goatee') P.stache = { w: mw * 1.15, th: .036, curl: .05, droop: .05, color: '#2a1a12' };
    if (b === 'goatee') P.goatee = { w: .06, len: .13, color: '#2a1a12' };
  }
  if (hc && (b || o.beardFollowsHair)) { // barba, bigode e cavanhaque na cor do cabelo
    if (P.beardVol) P.beardVol = { ...P.beardVol, color: hc };
    if (P.stache) P.stache = { ...P.stache, color: hc };
    if (P.goatee) P.goatee = { ...P.goatee, color: hc };
  }
}

// ---------- construção principal ----------
export function buildHead(presetId, adj, opts = {}) {
  const T0 = performance.now(), marks = {}, mark = l => { marks[l] = Math.round(performance.now() - T0) };
  const Q = opts.quality || 1;
  const P = resolve(presetId, adj);
  if (P.kind === 'robot') return buildRobot(P, opts);
  // A fábrica mantém o grafo de módulos sem ciclos, necessário para o Worker de prévias.
  if (P.kind === 'companion') return buildCompanion(P, {...opts,buildRider:()=>buildHead('frontier_cowboy',{}, {quality:.45})});
  applyLook(P, opts);
  const disposables = [], root = new THREE.Group();
  root.name = 'Head_V2_' + presetId;
  const track = o => (disposables.push(o), o);
  if (P.earType !== 'none') { // raiz da orelha: um volume suave na cabeça onde a concha se apoia (orelha não fica "colada")
    const s0 = makeSDF(P), eS = P.earS, Hh = (P.eyeY + .12 - P.noseTipY) / 2 * eS, yE = (P.eyeY + .12 + P.noseTipY) / 2 - .01, zE = -.19;
    let x = 1.4; for (let k = 0; k < 80; k++) { const d = s0(x, yE - .03, zE); if (d < 1e-4) break; x -= d * .9 }
    P._earRoot = [x - .02, yE - .03, zE + .01, .06, Hh * .55, Hh * .32];
  }
  const sdf = makeSDF(P), frontZ = makeFrontZ(sdf);
  const eyes = [-1, 1].map(s => eyeFrame(P, s));
  const field = makeFaceField(P, eyes);
  const skin = col(P.skin), blush = col(P.blush), lipC = col(P.lip), lineC = col(P.lipLine), lidC = col(P.lidShadow);
  const hsl = {}; skin.getHSL(hsl);
  const shade = new THREE.Color().setHSL(hsl.h - .018, Math.min(1, hsl.s * 1.02), hsl.l * .6);
  const skinHi = new THREE.Color().setHSL(hsl.h + .006, hsl.s * .92, Math.min(.92, hsl.l * 1.13));
  const blotchC = new THREE.Color().setHSL(hsl.h - .02, Math.min(1, hsl.s * 1.15), hsl.l * .92), foreC = new THREE.Color().setHSL(hsl.h + .018, hsl.s * .9, Math.min(.9, hsl.l * 1.06));
  const underC = new THREE.Color().setHSL(hsl.h - .05, hsl.s * .7, hsl.l * .82), beardC = new THREE.Color().setHSL(hsl.h + .03, hsl.s * .55, hsl.l * .74);
  const lipUC = lipC.clone().multiplyScalar(.86), lipHiC = lipC.clone().lerp(col('#ffd0c8'), .3), nostrilC = col('#3a1612'), deep = col('#8a5650');
  const skinMat = track(skinMaterial(P));
  const bagC = P.bag ? col(P.bag) : underC, mouthIn = col(P.mouthIn || '#4a1418');
  // barba volumétrica (anão, orc): bochechas abaixo da linha da barba, queixo, mandíbula; boca livre; bigode opcional
  const BV = P.beardVol, beardHair = BV ? col(BV.color) : null;
  const MCv = mouthCurve(P), SLIT = !P.open && P.mouthRig !== false;
  function beardMask(x, y, z, f) {
    const ax = Math.abs(x), tY = P.noseTipY, mY = P.mouthY, yB = mY + .02 + (P.eyeY - .24 - (mY + .02)) * sstep(.2, .62, ax);
    let m = sstep(yB + .05, yB - .06, y) * sstep(-.5, -.25, z) * (1 - sstep(.66, .8, ax) * sstep(-.1, -.3, z));
    if (BV.stache) m = Math.max(m, sstep(tY - .06, tY - .11, y) * sstep(mY + .1, mY + .05, y) * (1 - sstep(MCv.mw * 1.2, MCv.mw * 1.6, ax)));
    const ym = MCv.ym(x), opn = MCv.open(x), lip = ((x / (MCv.mw * 1.15)) ** 2 + ((y - (ym - opn / 2)) / (P.lipU + P.lipL + opn / 2 + .012)) ** 2);
    return m * sstep(.75, 1.25, lip);
  }
  // pintura facial (palhaço): base clara no rosto, marcas acima/abaixo dos olhos, boca pintada
  const PA = P.paint;
  const grooveC = P.patternColor ? col(P.patternColor[0]) : null, ridgeC = P.patternColor ? col(P.patternColor[1]) : null;
  const paintBase = PA && col(PA.base), paintMark = PA && col(PA.mark), paintMouth = PA && col(PA.mouth);
  function paint(c, x, y, z, wf, f) {
    const ax = Math.abs(x), area = sstep(1.05, .85, (x / .7) ** 2 + ((y + (y > 0 ? -.1 : .22)) / (y > 0 ? .85 : .8)) ** 2) * wf;
    c.lerp(paintBase, .92 * area);
    for (const e of eyes) {
      const [U, V] = e.local(x, y), up = V > 0, top = e.hu + .035, bot = -(e.hl + .03), len = up ? .13 : .16;
      const vv = up ? (V - top) / len : (bot - V) / len; if (vv < 0 || vv > 1) continue;
      const half = .03 * Math.sin(Math.PI * Math.pow(vv, .8)), dd = Math.abs(U) - half;
      c.lerp(paintMark, sstep(.004, -.004, dd) * .95);
    }
    const ym = MCv.ym(x), t = ax / MCv.mw, band = (P.lipU + P.lipL) * .8 * Math.max(0, 1 - Math.pow(t / 1.15, 2)) + .004;
    c.lerp(paintMouth, sstep(.006, -.004, Math.abs(y - ym + band * .1) - band) * (t < 1.2 ? 1 : 0));
  }

  function surfNoDome(x, y) { return frontZ(x, y) + field(x, y).dz }
  for (const e of eyes) e.zc = surfNoDome(e.ex, e.ey) - P.sink;
  function domeLift(x, y, z, lw = 1) { // a pele envolve o globo ocular → pálpebras (lw: só onde a superfície olha para a frente)
    for (const e of eyes) {
      const dx = x - e.ex, dy = y - e.ey, r2 = dx * dx + dy * dy; if (r2 > e.Rl2 * 1.5) continue;
      // perfil da "tampa" do globo: esfera até 85% do raio, depois continua com a mesma inclinação e cai suave (C1, sem vinco circular)
      const t = sqrt(r2) / e.Rl, u = t - .85, hS = e.zc + e.Rl * (u < 0 ? sqrt(1 - t * t) : .5268 - 1.6135 * u - 2.2 * u * u);
      z += (smaxS(z, hS, P.domeK ?? .08) - z) * lw;
    }
    return z;
  }
  const surfZ = (x, y) => domeLift(x, y, surfNoDome(x, y));
  const zRimE = P.Re * Math.cos(P.irisAng);
  mark('setup');

  // ---- pele: cabeça + pescoço numa malha só ----
  {
    const LON = Math.round(310 * Q), LAT = Math.round(340 * Q), WARP = .5, W = LON + 1;
    const [, nty, ntz, nby, nbz] = P.neck, Cy = -.02, Cz = -.1, yBot = nby + .12;
    const TA = .76, TB = .93, thA = 150 * Math.PI / 180, thH = Math.PI / 2 * 1.04;
    const NS = 1024, cdf = new Float64Array(NS + 1);
    // Redistribui o mesmo orçamento de vértices para as pálpebras e os lábios desta identidade.
    // Evita gastar anéis uniformes na testa enquanto a borda da boca fica subamostrada.
    const mouthTh=Math.atan2(Math.max(.2,surfZ(0,P.mouthY)-Cz),P.mouthY-Cy),eyeTh=Math.atan2(Math.max(.2,surfZ(P.eyeX,P.eyeY)-Cz),P.eyeY-Cy);
    for (let i = 1; i <= NS; i++) { const th = thA * (i - .5) / NS; cdf[i] = cdf[i - 1] + .32 + 1.2 * sstep(.8, 1.2, th) * (1 - sstep(2.4, 2.65, th)) + .75*gau(th-eyeTh,.17)+1.3*gau(th-mouthTh,.115) }
    const invTh = s => { const tg = s * cdf[NS]; let lo = 0, hi = NS; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cdf[m] < tg) lo = m; else hi = m } return thA * (lo + (tg - cdf[lo]) / ((cdf[hi] - cdf[lo]) || 1)) / NS };
    const axisZ = y => y > nty ? Cz + (ntz - Cz) * clamp((Cy - y) / (Cy - nty), 0, 1) : ntz + (nbz - ntz) * clamp((nty - y) / (nty - nby), 0, 1);
    const sinP = new Float64Array(W), cosP = new Float64Array(W);
    for (let ix = 0; ix < W; ix++) { const lon = -Math.PI + 2 * Math.PI * ix / LON, ph = lon - WARP * Math.sin(lon); sinP[ix] = Math.sin(ph); cosP[ix] = Math.cos(ph) }
    const N = W * (LAT + 1), NX = N + W, pos = new Float32Array(NX * 3), colors = new Float32Array(NX * 3), gloss = new Float32Array(NX), state = new Uint8Array(NX), wfA = new Float32Array(NX);
    const c = new THREE.Color(); let rowGuess = 0;
    for (let iy = 0; iy <= LAT; iy++) {
      const t = iy / LAT; let oy, oz, th, face = false;
      if (t <= TA) { oy = Cy; oz = Cz; th = invTh(t / TA); face = true }
      else if (t <= TB) { const s = (t - TA) / (TB - TA); oy = Cy + (yBot - Cy) * s; oz = axisZ(oy); th = thA + (thH - thA) * sstep(0, 1, s) }
      else { const s = (t - TB) / (1 - TB); oy = yBot; oz = axisZ(oy); th = thH + (Math.PI - thH) * s }
      const sth = Math.sin(th), cth = Math.cos(th); let guess = rowGuess;
      for (let ix = 0; ix < W; ix++) {
        const i = iy * W + ix, dx = sth * sinP[ix], dy = cth, dz0 = sth * cosP[ix];
        const sHit = traceOut(sdf, 0, oy, oz, dx, dy, dz0, guess); guess = sHit; if (ix === 0) rowGuess = sHit;
        let x = dx * sHit, y = oy + dy * sHit, z = oz + dz0 * sHit;
        const wf = face ? sstep(.05, .5, cosP[ix]) * (1 - sstep(.3, .7, -cth) * sstep(.75, .4, cosP[ix])) : 0;
        let f = null, eyeState = 0;
        if (wf > 0) { f = field(x, y); z += f.dz * wf }
        let lifted = false; const lwF = sstep(.3, .8, cosP[ix]);
        if (wf > .9) for (const e of eyes) {
          const [U, V] = e.local(x, y), uN = U / e.halfW;
          if (Math.abs(uN) >= 1 || Math.abs(V) > .24) continue;
          const Hh = e.H(uN, V >= 0), vN = Hh > 1e-4 ? Math.abs(V) / Hh : 9;
          // A superfície externa mantém sua distribuição. Colapsar várias fileiras
          // na mesma curva criava triângulos muito estreitos e marcas na têmpora.
          // A malha anatômica abaixo desenha a borda exata da abertura.
          z = domeLift(x, y, z, lwF); lifted = true;
          if (vN < 1 && Math.abs(uN) < .985 && Hh > .002) { // interior: escondido atrás do globo e da íris
            if (Hh - Math.abs(V) < .013) { const [x2, y2] = e.toHead(U, Math.sign(V || 1) * Hh); x = x2; y = y2 } // fileira junto à borda vira "parede" sob a pálpebra (sem degraus)
            const r2 = (x - e.ex) ** 2 + (y - e.ey) ** 2; z = e.zc + Math.min(sqrt(Math.max(P.Re * P.Re - r2, 0)) - .016, zRimE - .03); eyeState = 1;
          }
          break;
        }
        if (wf > 0 && !lifted) z = domeLift(x, y, z, lwF);
        if (f && f.cav > 0) { z -= .1 * f.cav * wf; eyeState = eyeState || 3 } // boca aberta: interior afundado
        let bm = 0;
        if (BV && face) { // barba esculpida: volume que cresce para fora (e para baixo no queixo), com mechas
          bm = beardMask(x, y, z, f);
          if (bm > 0) {
            const flow = vnoise(x * 34 + 2, y * 5.5, z * 34) - .5, grow = BV.thick * bm * (1 + BV.len * sstep(P.mouthY - .05, P.loft.y[0] - .1, y)) + .014 * bm * flow;
            x += dx * grow; y += dy * grow; z += dz0 * grow;
          }
        }
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; state[i] = eyeState; wfA[i] = wf;
        // cor
        c.copy(skin);
        if (f) {
          const k = wf;
          c.lerp(skinHi, clamp(f.hi * k * .4, 0, .5));
          c.lerp(blush, clamp(f.blush * k * (P.blushK ?? .5), 0, .7));
          c.lerp(lidC, clamp(f.lid * k * P.lidShade * .55, 0, .5));
          c.lerp(shade, clamp(f.ao * k * .5, 0, .6));
          if (!P.noLips) { c.lerp(lipUC, clamp(f.lipU * k, 0, 1)); c.lerp(lipC, clamp(f.lipL * k, 0, 1)) }
          c.lerp(lipHiC, clamp(f.lipHi * f.lipL * k * .45, 0, 1));
          c.lerp(lineC, clamp(f.line * k * .9, 0, 1));
          c.lerp(nostrilC, clamp(f.nostril * k * .85, 0, .85));
          c.lerp(bagC, clamp(f.under * k * (P.bagK ?? .32), 0, .7));
          gloss[i] = clamp(f.gloss * k, 0, 1);
        }
        { // variação orgânica de tom: manchas suaves (ruído de baixa frequência), testa mais clara/amarelada, barba sombreada
          const n = vnoise(x * 6.5 + 3.1, y * 6.5, z * 6.5) * .6 + vnoise(x * 17 + 9.7, y * 17, z * 17) * .4 - .5;
          c.lerp(n > 0 ? blotchC : skinHi, Math.abs(n) * .22);
          c.lerp(foreC, .22 * gau(x, .3) * gau(y - .42, .24) * sstep(-.1, .3, z));
          if (P.beard) { // barba sombreada: buço + queixo + mandíbula; linha da barba desce da costeleta ao canto da boca, bordas suaves
            const ax = Math.abs(x), tY = P.noseTipY, mY = P.mouthY, yB = mY + .06 + (P.eyeY - .2 - (mY + .06)) * sstep(.22, .66, ax);
            const cheek = sstep(yB + .07, yB - .07, y), lip = sstep(tY - .05, tY - .15, y);
            const b = Math.max(cheek, lip * (1 - sstep(.18, .3, ax))) * sstep(P.loft.y[0] - .5, P.loft.y[0] - .18, y) * sstep(-.42, -.18, z);
            const lips = f ? clamp(f.lipU + f.lipL + f.line, 0, 1) : 0;
            c.lerp(beardC, clamp(P.beard * b * (1 - lips), 0, .5));
          }
        }
        if (P.pattern && P.patternColor) { // sulcos mais escuros e cristas mais claras (lê o relevo como vegetal)
          const PTc = P.pattern, phi = Math.atan2(x, z - (P.lathe ? P.lathe.cz : P.cran[1])), cc = .5 + .5 * Math.cos(PTc.n * phi + (PTc.phase || 0));
          const fadeF = PTc.faceFade ? 1 - .7 * PTc.faceFade * wf * gau(y + .15, .5) : 1;
          c.lerp(grooveC, (1 - Math.pow(cc, .35)) * .75 * fadeF).lerp(ridgeC, Math.pow(cc, 6) * .35 * fadeF);
        }
        if (PA && f) paint(c, x, y, z, wf, f);
        if (f && f.cav > 0) { c.lerp(mouthIn, clamp(f.cav * 1.3, 0, 1)) }
        if (bm > 0) { const n = vnoise(x * 34 + 2, y * 5.5, z * 34); c.lerp(beardHair.clone().multiplyScalar(.7 + .55 * n), clamp(bm * 1.6, 0, 1)) }
        if (P.skinGloss) gloss[i] = Math.max(gloss[i], P.skinGloss * (1 - bm));
        if (bm > 0) gloss[i] *= 1 - bm;
        if (eyeState === 2) c.lerp(blush, .22);
        if (eyeState === 1) c.copy(deep);
        colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      }
    }
    mark('loop');
    // ---- fenda da boca (rig): uma fileira de vértices é ajustada exatamente na linha da boca e duplicada;
    // os triângulos abaixo da linha usam as cópias → a mandíbula abre uma boca de verdade, fechada no repouso ----
    const dupOf = new Int32Array(N).fill(-1); let NV = N;
    if (SLIT) for (let ix = 0; ix < W; ix++) {
      if (cosP[ix] < .5) continue;
      for (let iy = 0; iy < LAT && iy / LAT <= TA; iy++) {
        const a = iy * W + ix, b = a + W, xa = pos[a * 3], ya = pos[a * 3 + 1], yb = pos[b * 3 + 1];
        if (Math.abs(xa) > MCv.mw * .96 || state[a] || state[b]) continue;
        const yma = MCv.ym(xa), ymb = MCv.ym(pos[b * 3]);
        if (ya >= yma && yb < ymb) {
          const pick = ya - yma < ymb - yb ? a : b, x = pos[pick * 3], y = MCv.ym(x), f = field(x, y);
          pos[pick * 3 + 1] = y; pos[pick * 3 + 2] = frontZ(x, y) + f.dz;
          const cc2 = new THREE.Color().fromArray(colors, pick * 3).lerp(lineC, .8); cc2.toArray(colors, pick * 3);
          dupOf[pick] = NV; NV++; break;
        }
      }
    }
    for (let i = 0; i < N; i++) if (dupOf[i] >= 0) { const d = dupOf[i]; pos.copyWithin(d * 3, i * 3, i * 3 + 3); gloss[d] = gloss[i]; state[d] = 0; wfA[d] = wfA[i] }
    const idx = new Uint32Array(LON * LAT * 6); let o = 0;
    const tri = (a, b, c) => {
      if (NV > N && (dupOf[a] >= 0 || dupOf[b] >= 0 || dupOf[c] >= 0)) {
        // lado do triângulo decidido pelos vértices que NÃO estão na fenda (robusto nos degraus da curva)
        let below = 0, n = 0, cx = 0, cy = 0;
        for (const v of [a, b, c]) { cx += pos[v * 3]; cy += pos[v * 3 + 1]; if (dupOf[v] < 0) { n++; if (pos[v * 3 + 1] < MCv.ym(pos[v * 3])) below++ } }
        const isBelow = n ? below * 2 > n || (below * 2 === n && cy / 3 < MCv.ym(cx / 3)) : cy / 3 < MCv.ym(cx / 3);
        if (isBelow) { if (dupOf[a] >= 0) a = dupOf[a]; if (dupOf[b] >= 0) b = dupOf[b]; if (dupOf[c] >= 0) c = dupOf[c] }
      }
      idx[o++] = a; idx[o++] = b; idx[o++] = c;
    };
    for (let iy = 0; iy < LAT; iy++) for (let ix = 0; ix < LON; ix++) {
      const a = iy * W + ix, b = a + 1, cc = a + W, d = cc + 1;
      if (iy < LAT && dupOf[a] >= 0 && d < N && dupOf[d] >= 0) { tri(a, cc, d); tri(a, d, b) } // degrau da fenda: diagonal segue a linha da boca
      else { tri(a, cc, b); tri(b, cc, d) }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, NV * 3), 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeVertexNormals();
    const nr = geo.attributes.normal;
    { // costura e polos: normais unificadas
      const v = new THREE.Vector3();
      for (let iy = 1; iy < LAT; iy++) { const a = iy * W, b = a + LON; v.set(nr.getX(a) + nr.getX(b), nr.getY(a) + nr.getY(b), nr.getZ(a) + nr.getZ(b)).normalize(); nr.setXYZ(a, v.x, v.y, v.z); nr.setXYZ(b, v.x, v.y, v.z) }
      for (const iy of [0, LAT]) { v.set(0, 0, 0); for (let ix = 0; ix < W; ix++) v.x += nr.getX(iy * W + ix), v.y += nr.getY(iy * W + ix), v.z += nr.getZ(iy * W + ix); v.normalize(); for (let ix = 0; ix < W; ix++) nr.setXYZ(iy * W + ix, v.x, v.y, v.z) }
    }
    fixNormals(geo); mark('normals');
    { // oclusão por cavidade (duas escalas) + sombra sob a mandíbula
      const cc = new THREE.Color(), cav = (i, j, k) => {
        const jl = (j - k + LON) % LON, jr = (j + k) % LON, iu = Math.max(i - k, 0), id = Math.min(i + k, LAT);
        const p = i * W + j, A = [i * W + jl, i * W + jr, iu * W + j, id * W + j];
        let ax = 0, ay = 0, az = 0; for (const q of A) { ax += pos[q * 3]; ay += pos[q * 3 + 1]; az += pos[q * 3 + 2] }
        return (ax / 4 - pos[p * 3]) * nr.getX(p) + (ay / 4 - pos[p * 3 + 1]) * nr.getY(p) + (az / 4 - pos[p * 3 + 2]) * nr.getZ(p);
      };
      const s1 = Math.max(1, Math.round(3 * Q)), s2 = Math.max(2, Math.round(9 * Q));
      for (let i = 1; i < LAT; i++) for (let j = 0; j < W; j++) {
        const p = i * W + j; if (state[p] === 1 || state[p] === 3) continue;
        const c1 = cav(i, j % LON, s1), c2 = cav(i, j % LON, s2);
        const dark = .3 * sstep(.0005, .005, c1) + .4 * sstep(.002, .016, c2), dn = sstep(-.3, -.85, nr.getY(p)) * .35;
        const lite = .1 * sstep(-.002, -.008, c1);
        if (dark + dn + lite > .003) {
          cc.fromArray(colors, p * 3).lerp(shade, clamp(dark + dn, 0, .7)).lerp(skinHi, lite); cc.toArray(colors, p * 3);
        }
      }
    }
    for (let i = 0; i < N; i++) if (dupOf[i] >= 0) colors.copyWithin(dupOf[i] * 3, i * 3, i * 3 + 3);
    geo.setAttribute('color', new THREE.BufferAttribute(colors.subarray(0, NV * 3), 3)); geo.setAttribute('gloss', new THREE.BufferAttribute(gloss.subarray(0, NV), 1));
    const head = new THREE.Mesh(track(geo), skinMat); head.name = 'Head_Skin'; root.add(head);
    head.userData.vinfo = { N, NV, dupOf, state, wfA };
  }
  mark('head');

  const normalAt = (x, y) => {
    const e = .004, dzx = (surfZ(x + e, y) - surfZ(x - e, y)) / (2 * e), dzy = (surfZ(x, y + e) - surfZ(x, y - e)) / (2 * e);
    return new THREE.Vector3(-dzx, -dzy, 1).normalize();
  };

  // ---- orelhas: peça única em "C" — hélice (borda), anti-hélice, concha, trago e lóbulo; tamanho anatômico ----
  if (P.earType !== 'none') {
    const eS = P.earS, Hh = (P.eyeY + .12 - P.noseTipY) / 2 * eS, Wd = Hh * .6, T = Hh * .26;
    const yE = (P.eyeY + .12 + P.noseTipY) / 2 - .01, zE = -.19;
    const surfX = (y, z) => { let x = 1.4; for (let k = 0; k < 80; k++) { const d = sdf(x, y, z); if (d < 1e-4) break; x -= d * .9 } return x };
    let xs = 0; for (const fy of [-.6, -.3, 0, .3, .6]) for (const fz of [-.3, 0, .3]) xs = Math.max(xs, surfX(yE + fy * Hh, zE + fz * Wd)); // maior largura da cabeça sob a orelha
    const NR = 18, NT = 96, W = NT + 1, rows = 2 * NR + 1, pos = new Float32Array(rows * W * 3), cl = new Float32Array(rows * W * 3), c = new THREE.Color();
    const rimC = skin.clone().lerp(blush, .32), bowlC = skin.clone().lerp(shade, .5).lerp(blush, .25);
    for (let i = 0; i < rows; i++) for (let j = 0; j < W; j++) {
      const front = i <= NR, r = front ? i / NR : (2 * NR - i) / NR, th = -Math.PI + 2 * Math.PI * j / NT; // th = 0 em cima, >0 para trás
      const cy = Math.cos(th), sz = Math.sin(th);
      const tipK = 1 + (P.earPoint || 0) * Math.pow(Math.max(0, Math.cos(th - (P.earTipA ?? .7))), 7); // orelha pontuda
      const Yo = Hh * cy * tipK, Zo = -Wd * sz * (sz < 0 ? .72 : 1) * (1 - .35 * sstep(.2, 1, -cy)) * tipK; // contorno: frente mais reta, lóbulo mais estreito
      const Y = r * Yo, Z = r * Zo, E = Math.sqrt(Math.max(0, 1 - Math.pow(r, 8)));
      const lobe = sstep(-.55, -.85, cy), helix = sstep(-.9, -.35, th) * (1 - sstep(2.55, 3.0, th)) * (1 - lobe);
      let h, depth = 0;
      if (front) {
        const bowl = (1 - sstep(.55, .82, r)) * (1 - lobe), anti = gau(r - .6, .1) * sstep(.15, .6, th) * (1 - sstep(2.0, 2.5, th));
        const concha = gau(Y / Hh + .12, .32) * gau(Z / Wd - .22, .34) * bowl, trag = gau(Y / Hh + .14, .13) * gau(Z / Wd - .62, .12);
        depth = .85 * bowl + .6 * concha - .6 * anti;
        h = T * (.55 + .45 * Math.sqrt(Math.max(0, 1 - r * r))) + T * 1.1 * gau(r - .87, .085) * helix + T * .6 * anti - T * .8 * bowl - T * .3 * concha + T * 1.0 * trag + T * .5 * lobe * (1 - r * r);
      } else h = -T * .95 * Math.pow(Math.max(0, 1 - r * r), .7);
      const k = (i * W + j) * 3; pos[k] = h * E; pos[k + 1] = Y; pos[k + 2] = Z;
      c.copy(front ? (depth > 0 ? skin.clone().lerp(bowlC, clamp(depth, 0, 1) * .7) : skin.clone().lerp(rimC, clamp(-depth + gau(r - .87, .1) * helix, 0, 1))) : skin).lerp(blush, .12);
      cl[k] = c.r; cl[k + 1] = c.g; cl[k + 2] = c.b;
    }
    const idx = []; for (let i = 0; i < rows - 1; i++) for (let j = 0; j < NT; j++) { const a2 = i * W + j, b2 = a2 + 1, c2 = a2 + W, d2 = c2 + 1; idx.push(a2, b2, c2, b2, d2, c2) }
    const g0 = new THREE.BufferGeometry(); g0.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g0.setIndex(idx); g0.computeVertexNormals(); fixNormals(g0);
    g0.setAttribute('color', new THREE.BufferAttribute(cl, 3)); g0.setAttribute('gloss', new THREE.BufferAttribute(new Float32Array(rows * W), 1));
    for (const s of [-1, 1]) {
      const g = s > 0 ? g0 : mirrorX(g0);
      const m = new THREE.Mesh(track(g), skinMat); m.name = 'Ear_' + (s < 0 ? 'L' : 'R');
      m.position.set(s * (xs - T * .2), yE, zE); m.rotation.set(-.14 - (P.earLift || 0), s * -(.5 + (P.earFlare || 0)), s * .04); root.add(m);
    }
  }

  // ---- sobrancelhas ----
  const browMat = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9, name: 'Brow' }));
  const browC = col(P.brow), browSoft = browC.clone().lerp(skin, .45);
  for (const e of eyes) {
    const s = e.s, N = 34, pts = [], rw = [], rh = [];
    const x0 = P.eyeX - e.halfW * .98, x1 = P.eyeX + e.halfW * 1.18 * P.browLen, by = P.eyeY + P.browGap;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1), x = x0 + (x1 - x0) * t, pk = P.browPeak;
      const arch = P.browArch * (1 - Math.pow((t - pk) / (t < pk ? pk : 1 - pk), 2)) - P.browArch * .45;
      const y = by + arch + P.browSlope * (t - .3) * 3 - (t > .85 ? (t - .85) * .12 : 0) - .012 * (1 - sstep(0, .2, t));
      pts.push(new THREE.Vector3(s * x, y, surfZ(s * x, y) + .006));
      const taper = Math.sqrt(sstep(0, .06, t)) * (1 - .8 * sstep(.45, 1, t)) * (.85 + .15 * Math.sin(Math.PI * t));
      rw.push(P.browTh * taper); rh.push(P.browTh * taper * .32);
    }
    const g = ribbon(pts, rw, rh, (i, p) => normalAt(p.x, p.y), 12);
    setColors(g, (c, x, y, z, i) => { const t = Math.floor(i / 12) / (N - 1); c.copy(browC).lerp(browSoft, .55 * (1 - sstep(.04, .22, t))) });
    const m = new THREE.Mesh(track(g), browMat); m.name = 'Brow_' + (s < 0 ? 'L' : 'R'); root.add(m);
  }

  // ---- olhos ----
  const scleraMat = track(new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .35, clearcoat: .5, clearcoatRoughness: .25, name: 'Sclera' }));
  const irisTex = track(irisTexture(P.iris, .3));
  const irisMat = track(new THREE.MeshPhysicalMaterial({ map: irisTex, vertexColors: true, roughness: .55, name: 'Iris' }));
  const corneaMat = track(new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .12, roughness: .03, clearcoat: 1, clearcoatRoughness: 0, specularIntensity: 1, depthWrite: false, name: 'Cornea' }));
  const catchMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .95, name: 'Catchlight' }));
  const lashMat = track(new THREE.MeshStandardMaterial({ color: col(P.liner), roughness: .55, name: 'Lash' }));
  const lowLashMat = track(new THREE.MeshStandardMaterial({ color: col(P.liner).lerp(skin, .45), roughness: .7, name: 'LowerLash' }));
  const carMat = track(new THREE.MeshStandardMaterial({ color: col('#d98b86'), roughness: .35, name: 'Caruncle' }));
  const Re = P.Re, ia = P.irisAng, rIris = Re * Math.sin(ia), zRim = Re * Math.cos(ia);

  for (const e of eyes) {
    const s = e.s, grp = new THREE.Group(); grp.name = 'Eye_' + (s < 0 ? 'L' : 'R');
    grp.position.set(e.ex, e.ey, e.zc);
    grp.lookAt(0, e.ey, e.zc + 4.5); // leve convergência: os dois olhos olham para o mesmo ponto
    const sg = new THREE.SphereGeometry(Re, 64, 44, 0, Math.PI * 2, ia * .985, Math.PI - ia * .985); sg.rotateX(Math.PI / 2);
    // sombra da pálpebra superior sobre o globo (a pálpebra tem espessura e projeta sombra) — dá profundidade e "olhar"
    const lidShadow = (x, y) => { const [U, V] = e.local(e.ex + x, e.ey + y), uN = clamp(U / e.halfW, -.999, .999), d = e.H(uN, true) - V;
      return 1 - (P.eyeShadow ?? .5) * exp(-Math.max(d, 0) / (.09 * Re / .23)) * sstep(-.02, .01, d) - .18 * exp(-Math.max(e.H(uN, false) + V, 0) / .035) };
    setColors(sg, (c, x, y, z) => {
      const dx = x / Re, dz = z / Re;
      c.set('#f2e8df').multiplyScalar(1 - .22 * Math.pow(1 - clamp(dz, 0, 1), 2));
      c.lerp(col('#d9a29a'), .5 * sstep(.55, .95, Math.abs(dx)));
      c.multiplyScalar(lidShadow(x, y));
    });
    const sclera = new THREE.Mesh(track(sg), scleraMat); sclera.name = 'Sclera'; grp.add(sclera);
    // íris côncava (lente) sob a córnea
    const ig = new THREE.RingGeometry(1e-4, rIris * 1.002, 72, 12);
    { const p = ig.attributes.position, uv = ig.attributes.uv;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), r = Math.hypot(x, y) / rIris;
        p.setZ(i, zRim + .002 - .022 * Re * (1 - r * r));
        const a = Math.atan2(-y, -x); uv.setXY(i, ((a / (2 * Math.PI)) % 1 + 1) % 1, 1 - r); // u≈.25 em baixo, v=1 na pupila
      }
      ig.computeVertexNormals(); fixNormals(ig);
      setColors(ig, (c, x, y) => { c.setRGB(1, 1, 1).multiplyScalar(lidShadow(x, y)) }); }
    const iris = new THREE.Mesh(track(ig), irisMat); iris.name = 'Iris'; grp.add(iris);
    const cg = new THREE.SphereGeometry(Re * 1.004, 56, 18, 0, Math.PI * 2, 0, ia * 1.3); cg.rotateX(Math.PI / 2);
    { const p = cg.attributes.position, rc = Re * Math.sin(ia * 1.3); for (let i = 0; i < p.count; i++) { const r = Math.hypot(p.getX(i), p.getY(i)) / rc; p.setZ(i, p.getZ(i) + .016 * Re / .25 * Math.max(0, 1 - r * r)) } cg.computeVertexNormals(); fixNormals(cg) }
    const cornea = new THREE.Mesh(track(cg), corneaMat); cornea.renderOrder = 3; cornea.name = 'Cornea'; grp.add(cornea);
    const spark = (lon, lat, r, sq) => {
      const R = Re * 1.06, p = new THREE.Vector3(R * Math.sin(lon) * Math.cos(lat), R * Math.sin(lat), R * Math.cos(lon) * Math.cos(lat));
      const g = new THREE.CircleGeometry(r, 28); g.scale(1, sq, 1);
      const m = new THREE.Mesh(track(g), catchMat); m.position.copy(p); m.lookAt(p.clone().multiplyScalar(2)); m.renderOrder = 4; m.name = 'Catchlight'; grp.add(m);
    };
    spark(-s * .2 - .12, .24, .03 * Re / .25, .85); spark(s * .17 - .04, -.24, .012 * Re / .25, .8);
    root.add(grp);

    // carúncula (canto interno)
    { const [x, y] = e.toHead(-e.halfW * .9, -e.hl * .05), r2 = (x - e.ex) ** 2 + (y - e.ey) ** 2;
      const g = new THREE.SphereGeometry(1, 20, 14); g.scale(.026 * Re / .25, .02 * Re / .25, .014);
      const m = new THREE.Mesh(track(g), carMat); m.position.set(x, y, e.zc + sqrt(Math.max(Re * Re - r2, 0)) - .004); m.name = 'Caruncle'; root.add(m) }

    const edgePt = (uN, up, dv = 0) => { const [x, y] = e.toHead(uN * e.halfW, (up ? 1 : -1) * (e.H(uN, up) + dv)); return new THREE.Vector3(x, y, surfZ(x, y) + .002) };
    const radial = (i, p) => normalAt(p.x, p.y);
    for(const up of [true,false]){
      // Anéis anatômicos seguem a abertura exata do olho. A grade polar da cabeça
      // permanece por baixo, sem expor os degraus de amostragem junto ao globo.
      const NU=96,NT=8,ps=[],cs=[],ix=[],c=new THREE.Color();
      for(let j=0;j<=NT;j++)for(let i=0;i<=NU;i++){
        const t=j/NT,u=-1+2*i/NU,fade=cornerFn(u,up?P.peakU:P.peakL,.6);
        const U=u*(e.halfW+.028*t),V=(up?1:-1)*(e.H(u,up)+.035*t*(.25+.75*fade)),[x,y]=e.toHead(U,V);
        const z=surfZ(x,y)+.0015+.004*Math.sin(Math.PI*t)*fade,f=field(x,y);
        ps.push(x,y,z);c.copy(skin).lerp(blush,clamp(f.blush*(P.blushK??.5),0,.7)).lerp(lidC,clamp(f.lid*P.lidShade*.55,0,.5)).lerp(shade,clamp(f.ao*.5,0,.6));if(PA)paint(c,x,y,z,1,f);c.toArray(cs,cs.length);
        if(j<NT&&i<NU){const q=j*(NU+1)+i;if(up)ix.push(q,q+1,q+NU+1,q+1,q+NU+2,q+NU+1);else ix.push(q,q+NU+1,q+1,q+1,q+NU+1,q+NU+2)}
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(ps,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cs,3));g.setIndex(ix);g.computeVertexNormals();fixNormals(g);
      const m=new THREE.Mesh(track(g),skinMat);m.name='Lid_Sculpt_'+(up?'U_':'L_')+(s<0?'L':'R');root.add(m);
    }
    { // borda inferior (linha d'água) em tom de pele
      const n = 44, pts = [], rw = [];
      for (let i = 0; i <= n; i++) { const u = -1 + 2 * i / n; pts.push(edgePt(u, false)); rw.push(.0055 * Math.pow(Math.sin(Math.PI * i / n), .5) + .001) }
      const g = ribbon(pts, rw, rw, radial, 8); setColors(g, c => c.copy(skin).lerp(blush, .3));
      const m = new THREE.Mesh(track(g), skinMat); m.name = 'Lid_Rim_' + (s < 0 ? 'L' : 'R'); root.add(m);
    }
    if (P.lowerLash > 0) { // cílio inferior discreto na metade externa
      const n = 30, pts = [], rw = [];
      for (let i = 0; i <= n; i++) { const u = -.15 + 1.1 * i / n; pts.push(edgePt(Math.min(u, .97), false, .007)); rw.push(.0042 * P.lowerLash * Math.pow(Math.sin(Math.PI * i / n), .7) + .0004) }
      const m = new THREE.Mesh(track(ribbon(pts, rw, rw.map(r => r * .6), radial, 6)), lowLashMat); m.name = 'LowerLash_' + (s < 0 ? 'L' : 'R'); root.add(m);
    }
    const lashGeos = [];
    { // linha de cílios superior (delineado) com asa no canto externo
      const n = 48, list = [], rw = [];
      for (let i = 0; i <= n; i++) { const u = -1 + 2 * i / n, w = P.lash * (.2 + .8 * sstep(-1, .55, u)); list.push(edgePt(u, true, w * .45)); rw.push(w) }
      if (P.flick > 0) {
        const [xa, ya] = e.toHead(e.halfW * .98, e.H(.98, true)), dir = new THREE.Vector2(.82, .57).normalize();
        for (let k = 1; k <= 8; k++) { const t = k / 8, U = e.halfW + P.flick * t * dir.x, V = e.H(.98, true) * .4 + P.flick * t * dir.y + P.lash * .3, [x, y] = e.toHead(U, V); list.push(new THREE.Vector3(x, y, surfZ(x, y) + .003)); rw.push(P.lash * (1 - t * .95)) }
      }
      rw[0] = .0006; rw[rw.length - 1] = .0004;
      lashGeos.push(ribbon(list, rw, rw.map(r => r * .55), radial, 10));
    }
    for (let k = 0; k < P.lashN; k++) { // tufos de cílios: mais longos e inclinados para fora no canto externo
      const t = (k + .5) / P.lashN, uu = Math.min(-.3 + 1.26 * Math.pow(t, .8), .96), base = edgePt(uu, true, P.lash * .5);
      const nrm = normalAt(base.x, base.y), tang = edgePt(Math.min(uu + .03, .995), true, P.lash * .5).sub(base).normalize();
      const up = new THREE.Vector3(-Math.sin(s * P.tilt), Math.cos(P.tilt), 0);
      const L = P.lashLen * (.4 + .6 * sstep(-.4, .85, uu)) * (1 + .1 * Math.sin(k * 2.7)), lean = .1 + .8 * t * t;
      const pts = [], rw = [], rh = [];
      for (let j = 0; j <= 10; j++) {
        const a = j / 10;
        pts.push(base.clone().addScaledVector(nrm, L * (.62 * a - .3 * a * a)).addScaledVector(up, L * (.12 * a + .62 * a * a)).addScaledVector(tang, L * lean * a * (.5 + .5 * a)));
        const r = Math.pow(1 - a, .85); rw.push(.0068 * Re / .25 * r + .0003); rh.push(.0024 * r + .0002);
      }
      lashGeos.push(ribbon(pts, rw, rh, () => nrm, 6));
    }
    { const m = new THREE.Mesh(track(mergeGeos(lashGeos)), lashMat); m.name = 'Lashes_' + (s < 0 ? 'L' : 'R'); root.add(m) } // delineado + tufos numa malha
  }

  // ---- linha da boca: traço fino no fundo do sulco (só sem fenda de rig) ----
  if (!P.open && (!SLIT || ['frontier_cowboy','cactus_soldier','cactus_soldier_large'].includes(presetId))) {
    const N = 40, pts = [], rw = [], mw = P.mouthW;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1), x = (t * 2 - 1) * mw * 1.02, y = mouthCurve(P).ym(x);
      const heroCactus=['frontier_cowboy','cactus_soldier','cactus_soldier_large'].includes(presetId);
      pts.push(new THREE.Vector3(x, y, surfZ(x, y) + (heroCactus?.014:.0015))); rw.push((heroCactus?.010:.0052) * Math.pow(Math.sin(Math.PI * t), .6));
    }
    const mat = track(new THREE.MeshStandardMaterial({ color: col(P.lipLine), roughness: .6, name: 'MouthLine' }));
    const m = new THREE.Mesh(track(ribbon(pts, rw, rw.map(r => r * .7), () => new THREE.Vector3(0, 0, 1), 8)), mat); m.name = 'Mouth_Line'; root.add(m);
  }

  // ================= peças de personagem (opcionais, por preset) =================
  const sdfGrad = (x, y, z) => { const e = .003; return new THREE.Vector3(sdf(x + e, y, z) - sdf(x - e, y, z), sdf(x, y + e, z) - sdf(x, y - e, z), sdf(x, y, z + e) - sdf(x, y, z - e)).normalize() };
  const cz0 = P.cran[1];
  const mat = (color, o = {}) => track(new THREE.MeshPhysicalMaterial({ color: col(color), roughness: .55, ...o }));
  const addMesh = (geo, material, name) => { if (geo.attributes.normal) fixNormals(geo); const m = new THREE.Mesh(track(geo), material); m.name = name; root.add(m); return m };

  // ---- talo + cálice (pimentão, pimenta) ----
  if (P.stem) {
    const S = P.stem, top = traceOut(sdf, 0, P.cran[0], cz0 + (S.z || 0), 0, 1, 0), base = new THREE.Vector3(0, P.cran[0] + top - .03, cz0 + (S.z || 0));
    const pts = [], rw = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30, p = base.clone(); let px = 0, py = 0, step = S.len / 30;
      for (let k = 0; k < i; k++) { const a2 = (S.bend || 0) * (k / 30) + (S.curl || 0) * (k / 30) ** 3; px += Math.sin(a2) * step; py += Math.cos(a2) * step }
      p.x += px * (S.dirX ?? 1) * .3; p.z += px * (S.dirZ ?? -1); p.y += py;
      pts.push(p); rw.push(S.r * (1 - .45 * t) * (i === 30 ? .6 : 1) + (i === 0 ? S.r * .4 : 0));
    }
    const g = ribbon(pts, rw, rw, () => new THREE.Vector3(0, 0, 1), 14);
    setColors(g, (c, x, y) => c.set(S.color).multiplyScalar(.85 + .3 * sstep(base.y, base.y + S.len, y)));
    addMesh(g, mat(S.color, { vertexColors: true, color: 0xffffff, roughness: .5, clearcoat: .3 }), 'Stem');
    if (S.calyx) { // folhas do cálice deitadas sobre o topo
      const geos = [];
      for (let k = 0; k < S.calyx; k++) {
        const a2 = k / S.calyx * Math.PI * 2 + .3, lp = [], lw = [];
        for (let i = 0; i <= 12; i++) {
          const t = i / 12, r = S.r * .8 + t * S.calyxLen, x = Math.sin(a2) * r, z = cz0 + (S.z || 0) + Math.cos(a2) * r;
          let y = base.y + .02; for (let it = 0; it < 40; it++) { const d = sdf(x, y, z); if (Math.abs(d) < 1e-4) break; y -= d * .8 }
          lp.push(new THREE.Vector3(x, y + .012, z)); lw.push(S.r * 1.1 * Math.sin(Math.PI * Math.min(1, t * 1.1 + .05)) + .002);
        }
        geos.push(ribbon(lp, lw, lw.map(v => v * .25), (i, p) => sdfGrad(p.x, p.y, p.z), 8));
      }
      const g2 = mergeGeos(geos.map(g3 => setColors(g3, c => c.set(S.color))));
      addMesh(g2, mat(S.color, { vertexColors: true, color: 0xffffff, roughness: .55 }), 'Calyx');
    }
  }

  // ---- espinhos (cacto): tufos nas cristas das nervuras, fora do centro do rosto ----
  if (P.spines && P.pattern) {
    const SP = P.spines, PTn = P.pattern.n, geos = [], cone = new THREE.ConeGeometry(1, 1, 6, 1); cone.translate(0, .5, 0);
    const up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), M = new THREE.Matrix4(), sc = new THREE.Vector3();
    for (let k = 0; k < PTn; k++) {
      const phi = (2 * Math.PI * k - (P.pattern.phase || 0)) / PTn, sx = Math.sin(phi), szz = Math.cos(phi);
      for (let yy = SP.y0 + (k % 2) * SP.dy * .5; yy < SP.y1; yy += SP.dy) {
        const face = szz > .45 && yy > P.mouthY - .15 && yy < P.eyeY + .35 && Math.abs(sx) < .55; if (face) continue;
        const r = traceOut(sdf, 0, yy, cz0, sx, 0, szz), p = new THREE.Vector3(sx * r, yy, cz0 + szz * r), n = sdfGrad(p.x, p.y, p.z);
        for (let j = 0; j < 3; j++) {
          const tilt = new THREE.Vector3(Math.cos(j * 2.1 + k), Math.sin(j * 2.1 + k * 1.7), 0).multiplyScalar(j ? .55 : 0);
          const dir = n.clone().add(tilt.applyQuaternion(q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n))).normalize();
          q.setFromUnitVectors(up, dir); const L = SP.len * (j ? .65 : 1);
          M.compose(p.clone().addScaledVector(n, -.004), q, sc.set(SP.r * (j ? .7 : 1), L, SP.r * (j ? .7 : 1)));
          const g = cone.clone().applyMatrix4(M); g.deleteAttribute('uv'); geos.push(g);
        }
      }
    }
    if (geos.length) {
      geos.forEach(g => { g.computeVertexNormals(); setColors(g, (c, x, y, z, i) => c.set(SP.color)) });
      addMesh(mergeGeos(geos), mat(SP.color, { vertexColors: true, color: 0xffffff, roughness: .45 }), 'Spines');
    }
    cone.dispose();
  }

  // ---- nariz bola (palhaço) ----
  if (P.noseType === 'ball') {
    const r = P.ballR || .09, y = P.noseTipY + .02, g = new THREE.SphereGeometry(r, 48, 32);
    const m = addMesh(g, mat(P.ballColor || '#c8141c', { roughness: .25, clearcoat: .8, clearcoatRoughness: .2 }), 'Nose_Ball');
    m.position.set(0, y, surfZ(0, y) + r * .55);
  }

  const hairMat = c0 => mat(c0, { roughness: .85, sheen: .6, sheenColor: col(c0).lerp(col('#ffffff'), .3) });
  // ---- bigode (guidão com pontas viradas ou caído) ----
  if (P.stache) {
    const S = P.stache, yC = MCv.ym(0) + P.lipU + .028 + (S.y || 0), m2 = hairMat(S.color);
    for (const sd of [-1, 1]) {
      const pts = [], rw = [], rh = [];
      for (let i = 0; i <= 32; i++) {
        const t = i / 32, xr = .006 + t * S.w; let x = sd * xr, y = yC - (S.droop || 0) * t * t - .02 * sstep(0, .3, t);
        let z = surfZ(Math.min(Math.abs(x), MCv.mw * 1.5) * sd, y) + S.th * .55;
        if (t > .62) { const u = (t - .62) / .38; y += (S.curl || 0) * u * u; z += .04 * u - (Math.abs(x) > .45 ? .05 * u : 0) }
        pts.push(new THREE.Vector3(x, y, z)); const w = S.th * (1 - .85 * Math.pow(t, 1.3)) * (.75 + .25 * sstep(0, .1, t)) + .002; rw.push(w * 1.3); rh.push(w * .75);
      }
      addMesh(ribbon(pts, rw, rh, (i, p) => normalAt(clamp(p.x, -.5, .5), p.y), 12), m2, 'Mustache_' + (sd < 0 ? 'L' : 'R'));
    }
  }
  // ---- cavanhaque pontudo ----
  if (P.goatee) {
    const G = P.goatee, y0 = MCv.ym(0) - MCv.open(0) - P.lipL - .03, chinBot = Math.max(P.loft.y[0], y0 - G.len), pts = [], rw = [], rh = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24, y = y0 - t * (y0 - chinBot + G.len);
      const z = y > chinBot + .06 ? surfZ(0, y) + .012 : surfZ(0, chinBot + .06) + .012 - (chinBot + .06 - y) * .3;
      pts.push(new THREE.Vector3(0, y, z)); const w = G.w * Math.pow(1 - t, .8) * sstep(-.1, .2, t) + .002; rw.push(w); rh.push(w * .45 + .003);
    }
    addMesh(ribbon(pts, rw, rh, () => new THREE.Vector3(0, 0, 1), 12), hairMat(G.color), 'Goatee');
  }
  // ---- presas (orc) ----
  if (P.tusks) {
    const T = P.tusks, m2 = mat(T.color || '#efe2c4', { roughness: .4, clearcoat: .3 });
    for (const sd of [-1, 1]) {
      const bx = sd * T.x, by = MCv.ym(bx) - P.lipL * .4, bz = surfZ(bx, by) - .015, pts = [], rw = [];
      for (let i = 0; i <= 16; i++) { const a = i / 16; pts.push(new THREE.Vector3(bx + sd * T.out * a * a, by + T.len * a, bz + .035 * a - .02 * a * a)); rw.push(T.r * Math.pow(1 - a, .7) + .002) }
      addMesh(ribbon(pts, rw, rw.map(v => v * .9), () => new THREE.Vector3(0, 0, 1), 12), m2, 'Tusk_' + (sd < 0 ? 'L' : 'R'));
    }
  }
  // ---- interior da boca do rig (boca fechada no repouso): fundo, dentes e língua atrás dos lábios ----
  if (SLIT) {
    const zg = surfZ(0, MCv.ym(0)), cy = MCv.ym(0) - .02, depth = Math.min(.17, zg - P.cran[1] - .05);
    { const g = new THREE.SphereGeometry(1, 40, 24),pos=g.attributes.position,L=P.lathe?null:makeLoft(P.loft),slice={};
      // A cavidade acompanha a largura e a curvatura deste rosto. Uma esfera
      // larga e plana atravessava as bochechas de mandíbulas estreitas.
      for(let i=0;i<pos.count;i++){
        const ux=pos.getX(i),uy=pos.getY(i),uz=pos.getZ(i),y=cy-.03+uy*.105;
        const width=L?Math.min(MCv.mw*1.12,L.at(y,slice).a*.72):MCv.mw*1.12,x=ux*width;
        pos.setXYZ(i,x,y,surfZ(x,y)-.027-depth*(1-uz));
      }
      g.computeVertexNormals();
      setColors(g, (c, x, y, z) => c.set('#3c0c10').multiplyScalar(.55 + .45 * sstep(zg - depth * 2, zg, z)));
      addMesh(g, mat('#ffffff', { vertexColors: true, roughness: .6, side: THREE.BackSide }), 'Mouth_Bag') }
    const tm = mat('#f4efe6', { vertexColors: true, color: 0xffffff, roughness: .3, clearcoat: .5, side: THREE.DoubleSide });
    const teeth = (upper, h) => {
      const NX2 = 60, NY = 5, ps = [], ix2 = [], span = MCv.mw * .72, tw = (P.teeth && P.teeth.w) || Math.max(.05, MCv.mw * .3);
      for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX2; i++) {
        const x = -span + 2 * span * i / NX2, v = j / NY, ph = Math.abs(Math.sin(Math.PI * (x + tw / 2) / tw)), edge = MCv.ym(x) + (upper ? .012 : -.012);
        const y = upper ? edge - v * h * (.86 + .14 * Math.pow(ph, .4)) : edge + v * h * (.86 + .14 * Math.pow(ph, .4)) - h * 1.05;
        ps.push(x, y, surfZ(x, MCv.ym(x)) - (upper ? .05 : .065) - .05 * (x / span) ** 2);
      }
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX2; i++) { const a = j * (NX2 + 1) + i, b = a + 1, c2 = a + NX2 + 1, d = c2 + 1; ix2.push(a, c2, b, b, c2, d) }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(ps, 3)); g.setIndex(ix2); g.computeVertexNormals();
      setColors(g, (c, x) => { const ph = Math.abs(Math.sin(Math.PI * (x + tw / 2) / tw)); c.set('#f6f1e8').multiplyScalar(.92 + .08 * sstep(.03, .25, ph)).lerp(col('#c9b8a6'), .45 * sstep(.6, 1, Math.abs(x) / span)) });
      return g;
    };
    const th = Math.max(.035, MCv.mw * .2);
    addMesh(teeth(true, th), tm, 'Teeth_Upper'); addMesh(teeth(false, th * .55), tm, 'Teeth_Lower');
    { const g = new THREE.SphereGeometry(1, 32, 20); g.scale(MCv.mw * .62, .035, depth * .55); g.translate(0, cy - .085, zg - depth * .7);
      setColors(g, (c, x) => c.set('#c85a66').multiplyScalar(1 - .25 * gau(x, .05)));
      addMesh(g, mat('#ffffff', { vertexColors: true, roughness: .4, clearcoat: .4 }), 'Tongue') }
  }

  // ---- dentes e língua (boca aberta) ----
  if (P.open) {
    const TT = P.teeth || {}, toothMat = mat('#f4efe6', { vertexColors: true, color: 0xffffff, roughness: .3, clearcoat: .5, side: THREE.DoubleSide });
    const row = (upper, h) => {
      const NX = 72, NY = 6, pos = [], idx = [], span = MCv.mw * (TT.span ?? .86), tw = TT.w ?? .05;
      for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
        const x = -span + 2 * span * i / NX, edge = upper ? MCv.ym(x) + .006 : MCv.ym(x) - MCv.open(x) - .006, v = j / NY;
        const ph = Math.abs(Math.sin(Math.PI * (x + tw / 2) / tw)), tip = h * (.86 + .14 * Math.pow(ph, .4));
        const y = upper ? edge - v * Math.min(tip, MCv.open(x) * .55) : edge + v * Math.min(tip, MCv.open(x) * .5);
        pos.push(x, y, surfZ(x, edge) - .028 - .01 * (x / span) ** 2 - .01 * v);
      }
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c2 = a + NX + 1, d = c2 + 1; idx.push(a, c2, b, b, c2, d) }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); fixNormals(g);
      setColors(g, (c, x, y) => { const ph = Math.abs(Math.sin(Math.PI * (x + tw / 2) / tw)); c.set('#f6f1e8').multiplyScalar(.62 + .38 * sstep(.05, .35, ph)).lerp(col('#c9b8a6'), .5 * sstep(.6, 1, Math.abs(x) / span)) });
      return g;
    };
    addMesh(row(true, TT.h ?? .05), toothMat, 'Teeth_Upper');
    if (TT.lower !== false) addMesh(row(false, (TT.h ?? .05) * .8), toothMat, 'Teeth_Lower');
    { // interior escuro atrás dos dentes (garganta)
      const g = new THREE.CircleGeometry(1, 48); g.scale(MCv.mw * .78, MCv.open(0) * .62, 1); const m = addMesh(g, mat('#2a0a0c', { roughness: .9 }), 'Mouth_Back');
      m.position.set(0, MCv.ym(0) - MCv.open(0) / 2, surfZ(0, MCv.ym(0)) - .13);
    }
    if (P.tongue) {
      const TG = P.tongue, g = new THREE.SphereGeometry(1, 40, 28), yb = MCv.ym(0) - MCv.open(0);
      setColors(g, (c, x, y, z) => c.set(TG.color || '#e2737e').multiplyScalar(1 - .3 * gau(x, .18) * sstep(-.2, .6, z)));
      const m = addMesh(g, mat('#ffffff', { vertexColors: true, roughness: .35, clearcoat: .6, clearcoatRoughness: .3 }), 'Tongue');
      if (TG.out) { m.scale.set(MCv.mw * .48, TG.out, .045); m.position.set(TG.x || 0, yb - TG.out * .55, surfZ(0, yb) + .015); m.rotation.set(-.55, 0, TG.tilt || 0) }
      else { m.scale.set(MCv.mw * .62, MCv.open(0) * .32, .1); m.position.set(0, yb + MCv.open(0) * .22, surfZ(0, yb) - .1) } // dentro da boca, apoiada atrás dos dentes de baixo
    }
  }

  // ================= blendshapes esculpidos (formas de expressão) =================
  // Cada forma é o rosto reconstruído com outros parâmetros (ex.: sorriso extra de um lado) e a pele arrastada
  // junto com a boca/sobrancelha → lábios, bochechas, prega nasolabial e queixo mudam de forma, não só de lugar.
  const morphDefs = (() => {
    const mw = MCv.mw, Re = P.Re, browY = P.eyeY + P.browGap + P.browArch * .4, lidTop = P.eyeY + Re * Math.sin(P.openU) * 1.1;
    const keepLid = (y, x = P.eyeX) => 1 - (1 - sstep(lidTop + .005, lidTop + .07, y)) * gau(Math.abs(x) - P.eyeX, Re * 1.25); // pálpebra e olho não se mexem com a sobrancelha
    const mouth = (name, P2, widen = 0, side = 0) => ({ name, mouth: true, P2: { ...P, ...P2 }, widen, side });
    const brow = (name, fn, extraDz) => ({ name, carry: fn, extraDz });
    const browMask = (x, y, sd) => (sd === 0 || Math.sign(x) === sd ? 1 : 0) * Math.exp(-(((Math.abs(x) - P.eyeX) / .26) ** 4)) * gau(y - browY, .17) * keepLid(y, x);
    const inner = (x, y) => gau(Math.abs(x) - .13, .15) * gau(y - browY, .15) * keepLid(y, x);
    return [
      mouth('smile_L', { smileL: 1.35 }, .03, -1), mouth('smile_R', { smileR: 1.35 }, .03, 1),
      mouth('frown_L', { smileL: -1.25 }, -.005, -1), mouth('frown_R', { smileR: -1.25 }, -.005, 1),
      mouth('mouthWide', { mouthW: mw * 1.2, lipU: P.lipU * .8, lipL: P.lipL * .8, smile: P.smile + .2 }),
      mouth('mouthPucker', { mouthW: mw * .64, lipH: P.lipH * 1.8 + .012, lipU: P.lipU * 1.25, lipL: P.lipL * 1.15, muzzle: (P.muzzle || 0) + .035, smile: P.smile * .3 }),
      mouth('mouthPress', { lipU: P.lipU * .45, lipL: P.lipL * .5, lipH: P.lipH * .45, smile: P.smile * .8 }),
      brow('browUp_L', (x, y) => [0, .06 * browMask(x, y, -1)]), brow('browUp_R', (x, y) => [0, .06 * browMask(x, y, 1)]),
      brow('browInnerUp', (x, y) => { const m = inner(x, y); return [-Math.sign(x) * .01 * m, .065 * m] },
        (x, y) => .006 * gau(y - (browY + .1), .03) * gau(x, .14) * keepLid(y, x)), // rugas horizontais leves (preocupado)
      brow('browDown', (x, y) => { const m = gau(Math.abs(x) - .14, .19) * gau(y - browY, .16) * keepLid(y, x); return [-Math.sign(x) * .026 * m, -.05 * m] },
        (x, y) => -.014 * gau(Math.abs(x) - .05, .016) * gau(y - (browY - .02), .07) * keepLid(y, x) + .01 * gau(Math.abs(x) - .16, .1) * gau(y - (browY - .01), .06) * keepLid(y, x))
    ];
  })();
  // superfície base (sem relevo) numa grade: consulta rápida e idêntica para pele e peças
  const FZ = (() => { if (!(P.rigMorphs !== false && (Q >= 1 || opts.export))) return null; const x0 = -.9, y0 = -1.45, st = .012, NXg = Math.ceil(1.8 / st) + 1, NYg = Math.ceil(2.1 / st) + 1, T = new Float32Array(NXg * NYg);
    for (let j = 0; j < NYg; j++) for (let i = 0; i < NXg; i++) T[j * NXg + i] = frontZ(x0 + i * st, y0 + j * st);
    return (x, y) => { const fx = clamp((x - x0) / st, 0, NXg - 1.001), fy = clamp((y - y0) / st, 0, NYg - 1.001), i = fx | 0, j = fy | 0, u = fx - i, v = fy - j, k = j * NXg + i;
      return (T[k] * (1 - u) + T[k + 1] * u) * (1 - v) + (T[k + NXg] * (1 - u) + T[k + NXg + 1] * u) * v } })();
  const fieldCache = new Map(), fieldFor = d => { if (!fieldCache.has(d.name)) fieldCache.set(d.name, makeFaceField(d.P2, eyes)); return fieldCache.get(d.name) };
  const MC2 = new Map(), curveFor = d => { if (!MC2.has(d.name)) MC2.set(d.name, mouthCurve(d.P2)); return MC2.get(d.name) };
  // deslocamento (x,y) de um ponto do rosto para uma forma
  function warpXY(d, x, y) {
    if (d.carry) { const [dx, dy] = d.carry(x, y); return [x + dx, y + dy] }
    const M1 = MCv, M2 = curveFor(d), u = x / M1.mw, au = Math.abs(u);
    let xT = au <= 1 ? u * M2.mw : x + Math.sign(x) * (M2.mw - M1.mw);
    if (d.widen && (d.side === 0 || Math.sign(x) === d.side)) xT += Math.sign(x) * d.widen * gau(Math.abs(x) - M1.mw, .14);
    const yT = y + (M2.ym(xT) - MCv.ym(x)) - (M2.open(xT) - M1.open(x)) * sstep(MCv.ym(x), MCv.ym(x) - .05, y);
    const w = gau(y - M1.ym(x), .17) * (au < 1 ? 1 : exp(-(((au - 1) / .7) ** 2)));
    return [x + w * (xT - x), y + w * (yT - y)];
  }
  // pele: inclinação da superfície pela normal + diferença de relevo reavaliada na posição nova
  function morphSkin(headMesh, d, withNormals) {
    const g = headMesh.geometry, p = g.attributes.position, nr = g.attributes.normal, vi = headMesh.userData.vinfo, n = p.count;
    const out = new Float32Array(n * 3), f2 = d.mouth ? fieldFor(d) : null, xLim = d.mouth ? Math.min(.85, MCv.mw * 2.6 + .15) : .85;
    if (!vi.baseDz) { vi.baseDz = new Float32Array(n).fill(NaN) }
    for (let i = 0; i < n; i++) {
      const wf = vi.wfA[i]; if (wf < .02 || (i < vi.N && vi.state[i] === 1)) continue;
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i); if (z < -.2 || Math.abs(x) > xLim) continue;
      if (d.mouth && (y > P.eyeY - .02 || y < (P.loft?.y?.[0] ?? -1.2) - .36)) continue;
      // região da boca some suavemente (sem degrau): até a pálpebra de baixo em cima, abaixo do queixo embaixo
      const fz0 = FZ(x, y); if (Math.abs(fz0 - z) > .14) continue; // só a frente do rosto (a silhueta fica parada)
      const fade = (d.mouth ? sstep(P.eyeY - .03, P.eyeY - .16, y) * sstep((P.loft?.y?.[0] ?? -1.2) - .35, (P.loft?.y?.[0] ?? -1.2) - .1, y) : 1) * sstep(.12, .3, nr.getZ(i));
      if (fade < .001) continue;
      let [x2, y2] = warpXY(d, x, y); x2 = x + (x2 - x) * fade; y2 = y + (y2 - y) * fade;
      const dx = x2 - x, dy = y2 - y;
      let dz = FZ(x2, y2) - fz0; // relevo é carregado junto com a pele
      if (f2) { let b0 = vi.baseDz[i]; if (b0 !== b0) b0 = vi.baseDz[i] = field(x, y).dz; dz += wf * fade * (f2(x2, y2).dz - b0) } // e reesculpido (lábios, bochechas, prega) na forma nova
      if (d.extraDz) dz += wf * d.extraDz(x, y);
      if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) < 1e-6) continue;
      out[i * 3] = dx; out[i * 3 + 1] = dy; out[i * 3 + 2] = dz;
    }
    return out;
  }
  // peças sobre a pele (sobrancelha, bigode): seguem a superfície nova
  function morphAccessory(mesh, d, noRelief) {
    const p = mesh.geometry.attributes.position, n = p.count, out = new Float32Array(n * 3), f2 = d.mouth ? fieldFor(d) : null;
    for (let i = 0; i < n; i++) {
      const x = p.getX(i), y = p.getY(i), [x2, y2] = warpXY(d, x, y);
      let dz = FZ(x2, y2) - FZ(x, y);
      if (f2 && !noRelief) dz += f2(x2, y2).dz - field(x, y).dz;
      if (d.extraDz) dz += d.extraDz(x, y);
      out[i * 3] = x2 - x; out[i * 3 + 1] = y2 - y; out[i * 3 + 2] = dz;
    }
    return out;
  }
  const morphMeshes = [];
  function addMorphs(mesh, kind) {
    const g = mesh.geometry, list = kind === 'brow' ? morphDefs.filter(d => d.carry) : kind === 'mouthAcc' || kind === 'teeth' ? morphDefs.filter(d => d.mouth) : morphDefs;
    g.morphAttributes.position = []; if (kind === 'skin' && !opts.export) g.morphAttributes.normal = [];
    const idx = g.index, base = g.attributes.position.array;
    for (const d of list) {
      const delta = kind === 'skin' ? morphSkin(mesh, d) : morphAccessory(mesh, d, kind === 'teeth'), attr = new THREE.Float32BufferAttribute(delta, 3); attr.name = d.name;
      g.morphAttributes.position.push(attr);
      if (g.morphAttributes.normal) { // normais da forma, recalculadas só onde a pele se mexe (sombreado correto das bochechas)
        const nb = g.attributes.normal.array, nd = new Float32Array(nb.length), ia = idx.array, nv = base.length / 3, mark = new Uint8Array(nv);
        for (let v = 0; v < nv; v++) if (delta[v * 3] || delta[v * 3 + 1] || delta[v * 3 + 2]) mark[v] = 1;
        for (let t = 0; t < ia.length; t += 3) { const a2 = ia[t], b2 = ia[t + 1], c2 = ia[t + 2]; if (mark[a2] === 1 || mark[b2] === 1 || mark[c2] === 1) { mark[a2] |= 2; mark[b2] |= 2; mark[c2] |= 2 } }
        const acc = new Float32Array(nb.length), P3 = (v, k) => base[v * 3 + k] + delta[v * 3 + k];
        for (let t = 0; t < ia.length; t += 3) {
          const a2 = ia[t], b2 = ia[t + 1], c2 = ia[t + 2]; if (!(mark[a2] | mark[b2] | mark[c2])) continue;
          const ux = P3(b2, 0) - P3(a2, 0), uy = P3(b2, 1) - P3(a2, 1), uz = P3(b2, 2) - P3(a2, 2), vx = P3(c2, 0) - P3(a2, 0), vy = P3(c2, 1) - P3(a2, 1), vz = P3(c2, 2) - P3(a2, 2);
          const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
          for (const v of [a2, b2, c2]) { acc[v * 3] += nx; acc[v * 3 + 1] += ny; acc[v * 3 + 2] += nz }
        }
        for (let v = 0; v < nv; v++) if (mark[v]) { const x = acc[v * 3], y = acc[v * 3 + 1], z = acc[v * 3 + 2], l = Math.hypot(x, y, z) || 1;
          nd[v * 3] = x / l - nb[v * 3]; nd[v * 3 + 1] = y / l - nb[v * 3 + 1]; nd[v * 3 + 2] = z / l - nb[v * 3 + 2] }
        const na = new THREE.Float32BufferAttribute(nd, 3); na.name = d.name; g.morphAttributes.normal.push(na);
      }
    }
    g.morphTargetsRelative = true; mesh.updateMorphTargets(); morphMeshes.push(mesh);
  }
  const doMorphs = P.rigMorphs !== false && (Q >= 1 || opts.export) && !(typeof window !== 'undefined' && window.__noMorphs); // prévia do slider sem blendshapes (rápida)
  if (doMorphs) for (const obj of root.children) {
    if (!obj.isMesh) continue;
    if (obj.name === 'Head_Skin') addMorphs(obj, 'skin');
    else if (obj.name.startsWith('Brow_')) addMorphs(obj, 'brow');
    else if (obj.name.startsWith('Mustache_')) addMorphs(obj, 'mouthAcc');
    else if (obj.name.startsWith('Teeth_') || obj.name === 'Mouth_Bag' || obj.name === 'Tongue' || obj.name === 'Mouth_Back') addMorphs(obj, 'teeth'); // dentes acompanham a boca (não aparecem pelos cantos)
  }
  mark('morphs');

  // ---- dados de encaixe para cabelo e acessórios (espaço da cabeça, pose neutra) ----
  const fit = { P, sdf, surfZ, eyes: eyes.map(e => ({ x: e.ex, y: e.ey, z: e.zc, R: P.Re })), cz: P.cran[1], cy: P.cran[0], ears: [] };
  fit.top = P.cran[0] + traceOut(sdf, 0, P.cran[0], P.cran[1], 0, 1, 0);
  fit.browY = P.eyeY + P.browGap + P.browTh;
  for (const obj of root.children) {
    if (obj.name === 'Head_Skin') { fit.skinGeo = obj.geometry; fit.skinN = obj.userData.vinfo.N }
    if (obj.name.startsWith('Ear_')) {
      obj.updateMatrix(); const pa = obj.geometry.attributes.position, v = new THREE.Vector3(), lo = new THREE.Vector3(0, 9, 0), hi = new THREE.Vector3(0, -9, 0), out = new THREE.Vector3();
      for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(obj.matrix); if (v.y < lo.y) lo.copy(v); if (v.y > hi.y) hi.copy(v); if (Math.abs(v.x) > Math.abs(out.x)) out.copy(v) }
      fit.ears.push({ s: Math.sign(obj.position.x), center: obj.position.clone(), lobe: lo, top: hi, out });
    }
  }

  // ================= rig facial: esqueleto + pesos =================
  const rig = createRig(P, { eyes, MC: MCv, surfZ });
  root.add(rig.root); root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(rig.bones), Bn = n => rig.bones[rig.B[n]];
  const mouthBagY = MCv.ym(0) - .05;
  const classify = name => {
    if (name === 'Head_Skin') return 'skin';
    if (name.startsWith('Brow_')) return 'head';
    if (name.startsWith('Lashes_')) return 'lidU';
    if (name.startsWith('Lid_Rim_') || name.startsWith('LowerLash_')) return 'lidL';
    if (name.startsWith('Lid_Sculpt_')) return 'generic';
    if (name === 'Mouth_Line') return 'line';
    if (name.startsWith('Mustache_')) return 'head';
    if (name === 'Mouth_Bag') return 'bag';
    if (['Goatee', 'Teeth_Lower', 'Tongue'].includes(name) || name.startsWith('Tusk_')) return 'jaw';
    return 'head';
  };
  for (const obj of [...root.children]) {
    if (obj === rig.root) continue;
    if (obj.name === 'Eye_L' || obj.name === 'Eye_R') { // globo vai com o osso do olho; brilhos ficam fixos na cabeça
      const side = obj.name.slice(-1), hl = new THREE.Group(); hl.name = 'Eye_Highlights_' + side;
      hl.position.copy(obj.position); hl.quaternion.copy(obj.quaternion); root.add(hl); root.updateMatrixWorld(true);
      for (const c of [...obj.children]) if (c.name === 'Catchlight') hl.attach(c);
      Bn('Head').attach(hl); Bn('Eye_' + side).attach(obj); continue;
    }
    const kind = obj.isMesh ? classify(obj.name) : 'head';
    if (kind === 'head') { Bn('Head').attach(obj); continue }
    if (kind === 'jaw') { Bn('Jaw').attach(obj); continue }
    const g = obj.geometry, vinfo = obj.userData.vinfo;
    const fn = kind === 'skin' ? (x, y, z, i) => {
        let jaw = vinfo && i >= vinfo.N ? 1 : (vinfo && i < vinfo.N && vinfo.dupOf[i] >= 0 ? 0 : undefined);
        if (!SLIT && vinfo && i < vinfo.N && vinfo.state[i] === 3) { const ym = MCv.ym(x) - MCv.open(x) * .5; jaw = sstep(ym + .015, ym - .015, y) } // boca sempre aberta: metade de cima do interior fica com a cabeça
        return rig.weights(x, y, z, { jaw, interior: vinfo && i < vinfo.N && vinfo.state[i] === 1 });
      }
      : kind === 'bag' ? (x, y, z) => rig.weights(x, y, z, { jaw: sstep(mouthBagY + .02, mouthBagY - .04, y) })
      : kind === 'line' ? (x, y, z) => rig.weights(x, y, z, { jaw: 0 })
      : kind === 'generic' ? (x, y, z) => rig.weights(x, y, z)
      : (x, y, z) => rig.weights(x, y, z, { mode: kind });
    rig.skinAttributes(g, fn);
    const sm = new THREE.SkinnedMesh(g, obj.material); sm.name = obj.name; sm.renderOrder = obj.renderOrder;
    if (g.morphAttributes.position) { sm.updateMorphTargets(); const k = morphMeshes.indexOf(obj); if (k >= 0) morphMeshes[k] = sm }
    root.remove(obj); root.add(sm); sm.bind(skeleton);
  }
  rig.morphMeshes = morphMeshes; rig.apply({});
  fit.headBone = Bn('Head'); fit.jawBone = Bn('Jaw');

  root.traverse(o => { if (o.isMesh) { const transp = o.material.transparent; o.castShadow = !transp && o.name !== 'Catchlight'; o.receiveShadow = !transp } });
  mark('total'); root.userData.params = P; root.userData.timings = marks;
  const dispose = () => { root.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose() }); disposables.forEach(d => d.dispose && d.dispose()) };
  return { group: root, dispose, params: P, rig, fit };
}
